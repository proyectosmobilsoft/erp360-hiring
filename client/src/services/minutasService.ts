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
  tipo_zona: string;
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

      // Obtener los menús asignados a estas unidades
      const { data: menus, error: errorMenus } = await supabase
        .from('inv_productos_unidad_servicio')
        .select(`
          id_unidad_servicio,
          created_at,
          inv_productos!inner(
            id,
            nombre,
            codigo,
            gen_tipo_zonas!inner(
              nombre
            ),
            inv_clase_servicios!inner(
              nombre
            )
          )
        `)
        .in('id_unidad_servicio', unidadIds)
        .eq('id_contrato', contratoId);

      if (errorMenus) {
        console.error('❌ Error obteniendo menús:', errorMenus);
        return { data: null, error: errorMenus };
      }

      console.log('🍽️ Menús encontrados:', menus);

      // Combinar los datos
      const unidadesConMenus: UnidadConMenu[] = unidades.map(unidad => {
        const menusDeUnidad = menus?.filter(menu => 
          menu.id_unidad_servicio === unidad.id
        ) || [];

        const menusFormateados: MenuAsignado[] = menusDeUnidad.map(menu => {
          // Simular ingredientes basados en el nombre del producto
          const ingredientes = generarIngredientes(menu.inv_productos.nombre);
          
          return {
            id_producto: menu.inv_productos.id,
            nombre_receta: menu.inv_productos.nombre,
            codigo: menu.inv_productos.codigo,
            tipo_zona: (menu.inv_productos.gen_tipo_zonas as any)?.nombre || '',
            nombre_servicio: (menu.inv_productos.inv_clase_servicios as any)?.nombre || '',
            fecha_asignacion: menu.created_at,
            ingredientes: ingredientes,
            descripcion: menu.inv_productos.nombre // Usar el nombre como descripción
          };
        });

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
