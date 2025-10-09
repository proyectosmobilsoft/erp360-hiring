import { supabase } from './supabaseClient';

export interface UnidadConMenu {
  unidad_id: number;
  unidad_nombre: string;
  zona_nombre: string;
  menus: MenuAsignado[];
}

export interface IngredienteDetallado {
  id_producto: number;
  nombre: string;
  cantidad: number;
  id_componente_menu: number | null;
  nombre_componente_menu: string | null;
  nombre_sublinea: string | null;
}

export interface MenuAsignado {
  id_producto: number;
  nombre_receta: string;
  codigo: string;
  unidad_servicio: string;
  nombre_servicio: string;
  fecha_asignacion: string;
  ingredientes?: string[];
  ingredientes_detallados?: IngredienteDetallado[];
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
   * Obtiene los ingredientes detallados de una receta con su información de componente de menú
   */
  static async getIngredientesDetalladosReceta(idReceta: number): Promise<IngredienteDetallado[]> {
    try {
      const { data: ingredientes, error } = await supabase
        .from('inv_detalle_productos')
        .select(`
          id_producto,
          cantidad,
          inv_productos!fk_detalle_productos_ingrediente (
            id,
            nombre,
            id_sublineas,
            inv_sublineas!fk_productos_sublineas (
              id,
              nombre,
              id_componente_menu,
              prod_componentes_menus!fk_sublineas_componente_menu (
                id,
                nombre
              )
            )
          )
        `)
        .eq('id_maestro_producto', idReceta)
        .eq('estado', 1);

      if (error) {
        console.error('❌ Error obteniendo ingredientes de receta:', error);
        return [];
      }

      if (!ingredientes || ingredientes.length === 0) {
        return [];
      }

      // Mapear los ingredientes con su información completa
      const ingredientesDetallados: IngredienteDetallado[] = ingredientes.map(ing => {
        const producto = Array.isArray(ing.inv_productos) ? ing.inv_productos[0] : ing.inv_productos;
        const sublinea = producto?.inv_sublineas ? 
          (Array.isArray(producto.inv_sublineas) ? producto.inv_sublineas[0] : producto.inv_sublineas) : null;
        const componenteMenu = sublinea?.prod_componentes_menus ?
          (Array.isArray(sublinea.prod_componentes_menus) ? sublinea.prod_componentes_menus[0] : sublinea.prod_componentes_menus) : null;

        return {
          id_producto: producto?.id || 0,
          nombre: producto?.nombre || 'Sin nombre',
          cantidad: ing.cantidad || 0,
          id_componente_menu: componenteMenu?.id || null,
          nombre_componente_menu: componenteMenu?.nombre || null,
          nombre_sublinea: sublinea?.nombre || null
        };
      });

      return ingredientesDetallados;
    } catch (error) {
      console.error('❌ Error inesperado obteniendo ingredientes:', error);
      return [];
    }
  }

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
      const unidadesConMenus: UnidadConMenu[] = await Promise.all(unidades.map(async (unidad) => {
        // Filtrar asignaciones para esta unidad
        const asignacionesDeUnidad = asignaciones?.filter(asignacion => 
          asignacion.id_unidad_servicio === unidad.id
        ) || [];

        console.log(`🔍 Procesando unidad ${unidad.id} (${unidad.nombre_servicio}):`, {
          asignacionesDeUnidad: asignacionesDeUnidad.length,
          primerAsignacion: asignacionesDeUnidad[0]
        });

        const menusRaw = await Promise.all(asignacionesDeUnidad.map(async (asignacion) => {
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
            clase_servicio_raw: producto.inv_clase_servicios,
            clase_servicio_tipo: typeof producto.inv_clase_servicios,
            clase_servicio_isArray: Array.isArray(producto.inv_clase_servicios),
            clase_servicio_length: producto.inv_clase_servicios?.length,
            clase_servicio_primer_elemento: producto.inv_clase_servicios?.[0]
          });
          
          // Simular ingredientes basados en el nombre del producto
          const ingredientes = generarIngredientes(producto.nombre);
          
          // Obtener ingredientes detallados con su relación a componentes de menú
          const ingredientesDetallados = await MinutasService.getIngredientesDetalladosReceta(producto.id);
          
          console.log(`📋 Ingredientes detallados de ${producto.nombre}:`, {
            count: ingredientesDetallados.length,
            ingredientes: ingredientesDetallados
          });
          
          // Determinar el nombre del servicio
          let nombreServicio = '';
          if (producto.inv_clase_servicios) {
            if (Array.isArray(producto.inv_clase_servicios) && producto.inv_clase_servicios.length > 0) {
              nombreServicio = producto.inv_clase_servicios[0]?.nombre || '';
            } else if (!Array.isArray(producto.inv_clase_servicios) && typeof producto.inv_clase_servicios === 'object' && 'nombre' in producto.inv_clase_servicios) {
              nombreServicio = (producto.inv_clase_servicios as any).nombre;
            }
          }
          
          console.log(`🔍 Nombre servicio determinado para ${producto.nombre}: "${nombreServicio}"`);
          
          return {
            id_producto: producto.id,
            nombre_receta: producto.nombre,
            codigo: producto.codigo,
            unidad_servicio: unidad.nombre_servicio,
            nombre_servicio: nombreServicio,
            fecha_asignacion: asignacion.created_at,
            ingredientes: ingredientes,
            ingredientes_detallados: ingredientesDetallados,
            descripcion: producto.nombre
          };
        }));
        
        const menusFormateados: MenuAsignado[] = menusRaw.filter(Boolean) as MenuAsignado[];

        return {
          unidad_id: unidad.id,
          unidad_nombre: unidad.nombre_servicio,
          zona_nombre: zonaNombre,
          menus: menusFormateados
        };
      }));

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
