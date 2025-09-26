import { supabase } from './supabaseClient';

export interface UnidadConMenu {
  unidad_id: number;
  unidad_nombre: string;
  zona_nombre: string;
  menus: MenuAsignado[];
}

export interface MenuAsignado {
  id_producto: number;
  nombre_receta: string;
  codigo: string;
  unidad_servicio: string;
  nombre_servicio: string;
  fecha_asignacion: string;
  ingredientes?: string[];
  descripcion?: string;
}

export interface MinutasResponse {
  data: UnidadConMenu[] | null;
  error: any;
}

// Función para generar ingredientes basados en el nombre del producto
const generarIngredientes = (nombreProducto: string): string[] => {
  const nombre = nombreProducto.toLowerCase();
  
  // Mapeo de ingredientes comunes basado en palabras clave
  const ingredientesMap: { [key: string]: string[] } = {
    'pan': ['HARINA DE TRIGO', 'AGUA', 'SAL', 'LEVADURA'],
    'huevo': ['HUEVOS FRESCOS', 'SAL', 'PIMIENTA'],
    'leche': ['LECHE FRESCA', 'AZÚCAR'],
    'arroz': ['ARROZ BLANCO', 'AGUA', 'SAL', 'ACEITE'],
    'pollo': ['POLLO FRESCO', 'SAL', 'PIMIENTA', 'CEBOLLA', 'AJOS'],
    'carne': ['CARNE DE RES', 'SAL', 'PIMIENTA', 'CEBOLLA', 'TOMATE'],
    'papa': ['PAPAS FRESCAS', 'SAL', 'ACEITE'],
    'ensalada': ['LECHUGA', 'TOMATE', 'CEBOLLA', 'LIMÓN', 'ACEITE'],
    'sopa': ['AGUA', 'SAL', 'CEBOLLA', 'ZANAHORIA', 'APIO'],
    'chocolate': ['CHOCOLATE', 'LECHE', 'AZÚCAR'],
    'avena': ['AVENA', 'LECHE', 'AZÚCAR', 'CANELA'],
    'fruta': ['FRUTA FRESCA'],
    'jugo': ['FRUTA FRESCA', 'AGUA', 'AZÚCAR']
  };

  // Buscar coincidencias en el nombre del producto
  for (const [palabra, ingredientes] of Object.entries(ingredientesMap)) {
    if (nombre.includes(palabra)) {
      return ingredientes;
    }
  }

  // Ingredientes por defecto si no se encuentra coincidencia
  return ['INGREDIENTES VARIOS', 'SAL', 'ESPECIAS'];
};

export class MinutasService {
  /**
   * Obtiene las unidades de servicio de una zona específica con sus menús asignados
   */
  static async getUnidadesConMenusPorZona(
    contratoId: number, 
    zonaId: number
  ): Promise<MinutasResponse> {
    try {
      console.log('🔍 Obteniendo unidades con menús para contrato:', contratoId, 'zona:', zonaId);

      // Primero obtener las unidades de servicio de la zona usando consultas separadas
      // 1. Obtener los IDs de las unidades de servicio de la zona
      const { data: zonasDetalle, error: errorZonasDetalle } = await supabase
        .from('prod_zonas_detalle_contratos')
        .select('id_unidad_servicio')
        .eq('id_zona', zonaId);

      if (errorZonasDetalle) {
        console.error('❌ Error obteniendo detalle de zonas:', errorZonasDetalle);
        return { data: null, error: errorZonasDetalle };
      }

      if (!zonasDetalle || zonasDetalle.length === 0) {
        console.log('⚠️ No se encontraron unidades para esta zona');
        return { data: [], error: null };
      }

      // 2. Obtener los IDs de las unidades
      const unidadIds = zonasDetalle.map(z => z.id_unidad_servicio);

      // 3. Obtener la información de las unidades de servicio
      const { data: unidades, error: errorUnidades } = await supabase
        .from('prod_unidad_servicios')
        .select('id, nombre_servicio')
        .in('id', unidadIds);

      if (errorUnidades) {
        console.error('❌ Error obteniendo unidades:', errorUnidades);
        return { data: null, error: errorUnidades };
      }

      console.log('📊 Unidades encontradas:', unidades);

      if (!unidades || unidades.length === 0) {
        console.log('⚠️ No se encontraron unidades para esta zona');
        return { data: [], error: null };
      }

      // Obtener el nombre de la zona por separado
      const { data: zonaInfo, error: errorZonaInfo } = await supabase
        .from('prod_zonas_contrato')
        .select('nombre')
        .eq('id', zonaId)
        .single();

      const zonaNombre = zonaInfo?.nombre || 'Zona';

      // Obtener los menús asignados a estas unidades usando la misma lógica que asignacionesService
      const { data: asignaciones, error: errorAsignaciones } = await supabase
        .from('inv_productos_unidad_servicio')
        .select(`
          id,
          id_producto_by_unidad,
          id_contrato,
          id_unidad_servicio,
          created_at
        `)
        .in('id_unidad_servicio', unidadIds)
        .eq('id_contrato', contratoId);

      if (errorAsignaciones) {
        console.error('❌ Error obteniendo asignaciones:', errorAsignaciones);
        return { data: null, error: errorAsignaciones };
      }

      console.log('🍽️ Asignaciones encontradas:', asignaciones);

      if (!asignaciones || asignaciones.length === 0) {
        console.log('⚠️ No se encontraron asignaciones para estas unidades');
        return { data: [], error: null };
      }

      // Obtener los IDs de relaciones producto-unidad únicos
      const relacionesIds = [...new Set(asignaciones.map(a => a.id_producto_by_unidad))];
      
      // Obtener información de las relaciones producto-unidad con sus datos relacionados
      const { data: relaciones, error: errorRelaciones } = await supabase
        .from('inv_producto_by_unidades')
        .select(`
          id,
          id_producto,
          id_unidad_servicio,
          inv_productos!inner (
            id,
            nombre,
            codigo,
            inv_categorias!inner (
              isreceta
            ),
            inv_clase_servicios (
              id,
              nombre
            )
          )
        `)
        .in('id', relacionesIds)
        .eq('inv_productos.inv_categorias.isreceta', 1);

      if (errorRelaciones) {
        console.error('❌ Error obteniendo relaciones:', errorRelaciones);
        return { data: null, error: errorRelaciones };
      }

      console.log('🍽️ Relaciones encontradas:', relaciones);

      // Combinar los datos usando la misma lógica que asignacionesService
      const unidadesConMenus: UnidadConMenu[] = unidades.map(unidad => {
        // Filtrar asignaciones para esta unidad
        const asignacionesDeUnidad = asignaciones?.filter(asignacion => 
          asignacion.id_unidad_servicio === unidad.id
        ) || [];

        console.log(`🔍 Procesando unidad ${unidad.id} (${unidad.nombre_servicio}):`, {
          asignacionesDeUnidad: asignacionesDeUnidad.length,
          primerAsignacion: asignacionesDeUnidad[0]
        });

        const menusFormateados: MenuAsignado[] = asignacionesDeUnidad.map(asignacion => {
          // Buscar la relación correspondiente
          const relacion = relaciones?.find(r => r.id === asignacion.id_producto_by_unidad);
          if (!relacion) {
            console.log('❌ No se encontró relación para la asignación:', asignacion.id_producto_by_unidad);
            return null;
          }
          
          console.log('🔍 Relación encontrada:', {
            id: relacion.id,
            id_producto: relacion.id_producto,
            id_unidad_servicio: relacion.id_unidad_servicio,
            inv_productos: relacion.inv_productos,
            tipo: typeof relacion.inv_productos,
            esArray: Array.isArray(relacion.inv_productos),
            keys: relacion.inv_productos ? Object.keys(relacion.inv_productos) : 'null'
          });
          
          // Acceder correctamente a la estructura de datos
          let producto;
          
          // Verificar si es un array o un objeto
          if (Array.isArray(relacion.inv_productos)) {
            producto = relacion.inv_productos[0];
            console.log('📋 Es array, accediendo a [0]:', producto);
          } else {
            producto = relacion.inv_productos;
            console.log('📋 Es objeto, accediendo directo:', producto);
          }
          
          if (!producto) {
            console.log('❌ No se encontró producto para la relación');
            return null;
          }
          
          console.log('✅ Producto encontrado:', {
            id: producto.id,
            nombre: producto.nombre,
            codigo: producto.codigo,
            clase_servicio: producto.inv_clase_servicios
          });
          
          // Simular ingredientes basados en el nombre del producto
          const ingredientes = generarIngredientes(producto.nombre);
          
          return {
            id_producto: producto.id,
            nombre_receta: producto.nombre,
            codigo: producto.codigo,
            unidad_servicio: unidad.nombre_servicio,
            nombre_servicio: producto.inv_clase_servicios?.[0]?.nombre || '',
            fecha_asignacion: asignacion.created_at,
            ingredientes: ingredientes,
            descripcion: producto.nombre
          };
        }).filter(Boolean) as MenuAsignado[];

        return {
          unidad_id: unidad.id,
          unidad_nombre: unidad.nombre_servicio,
          zona_nombre: zonaNombre,
          menus: menusFormateados
        };
      });

      console.log('✅ Unidades con menús procesadas:', unidadesConMenus);

      return { data: unidadesConMenus, error: null };
    } catch (error) {
      console.error('❌ Error inesperado obteniendo unidades con menús:', error);
      return { data: null, error };
    }
  }

  /**
   * Obtiene información detallada del contrato incluyendo fecha de ejecución
   */
  static async getContratoDetalle(contratoId: number) {
    try {
      const { data, error } = await supabase
        .from('prod_contratos')
        .select(`
          id,
          no_contrato,
          fecha_arranque,
          fecha_inicial,
          fecha_final,
          con_terceros:id_tercero(
            nombre_tercero
          )
        `)
        .eq('id', contratoId)
        .single();

      if (error) {
        console.error('❌ Error obteniendo detalle del contrato:', error);
        return { data: null, error };
      }

      return { data, error: null };
    } catch (error) {
      console.error('❌ Error inesperado obteniendo detalle del contrato:', error);
      return { data: null, error };
    }
  }
}
