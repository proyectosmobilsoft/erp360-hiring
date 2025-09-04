import { supabase } from './supabaseClient';

export interface UnidadServicio {
  id: number;
  codigo: number;
  nombre_servicio: string;
  id_municipio: number;
  no_ppl: number;
  created_at?: string;
  updated_at?: string;
  zona_nombre?: string;
  zona_id?: number;
}

interface UnidadesServicioResponse {
  data: UnidadServicio[] | null;
  error: any;
  count?: number | null;
}

export class UnidadesServicioService {
  /**
   * Obtiene todas las unidades de servicio activas
   */
  static async getUnidadesServicio(): Promise<UnidadesServicioResponse> {
    try {
      const { data, error, count } = await supabase
        .from('prod_unidad_servicios')
        .select('*', { count: 'exact' })
        .order('nombre_servicio', { ascending: true });

      return { data: data as UnidadServicio[], error, count };
    } catch (error) {
      console.error('Error al obtener unidades de servicio:', error);
      return { data: null, error, count: null };
    }
  }

  /**
   * Obtiene las unidades de servicio asociadas a un contrato específico
   */
  static async getUnidadesPorContrato(contratoId: number): Promise<UnidadesServicioResponse> {
    try {
      console.log('🔍 Obteniendo unidades de servicio para contrato:', contratoId);

      // Obtener las unidades de servicio con información de zona usando la estructura correcta
      const { data, error } = await supabase
        .from('prod_zonas_by_contrato')
        .select(`
          id_zona,
          prod_zonas_contrato!inner (
            id,
            nombre,
            activo
          )
        `)
        .eq('id_contrato', contratoId)
        .eq('prod_zonas_contrato.activo', true);

      if (error) {
        console.error('❌ Error obteniendo zonas del contrato:', error);
        return { data: null, error, count: null };
      }

      if (!data || data.length === 0) {
        console.log('⚠️ No se encontraron zonas para el contrato:', contratoId);
        return { data: [], error: null, count: 0 };
      }

      // Obtener las unidades de servicio para cada zona
      const unidadesConZona: UnidadServicio[] = [];
      
      for (const zonaContrato of data) {
        const zona = zonaContrato.prod_zonas_contrato;
        
        // Obtener las unidades de servicio para esta zona específica
        const { data: unidadesData, error: unidadesError } = await supabase
          .from('prod_zonas_detalle_contratos')
          .select(`
            id_unidad_servicio,
            prod_unidad_servicios (
              id,
              codigo,
              nombre_servicio,
              id_municipio,
              no_ppl,
              created_at,
              updated_at
            )
          `)
          .eq('id_zona', zona.id);

        if (unidadesError) {
          console.error('❌ Error obteniendo unidades para zona:', zona.nombre, unidadesError);
          continue;
        }

        if (unidadesData && unidadesData.length > 0) {
          unidadesData.forEach(detalle => {
            const unidad = detalle.prod_unidad_servicios;
            if (unidad) {
              unidadesConZona.push({
                id: unidad.id,
                codigo: unidad.codigo,
                nombre_servicio: unidad.nombre_servicio,
                id_municipio: unidad.id_municipio,
                no_ppl: unidad.no_ppl,
                created_at: unidad.created_at,
                updated_at: unidad.updated_at,
                zona_nombre: zona.nombre,
                zona_id: zona.id
              });
            }
          });
        }
      }

      // Eliminar duplicados basándose en el ID
      const unidadesUnicas = unidadesConZona.filter((unidad, index, self) => 
        index === self.findIndex(u => u.id === unidad.id)
      );

      console.log('✅ Unidades con zona encontradas:', unidadesUnicas);

      return { data: unidadesUnicas as UnidadServicio[], error: null, count: unidadesUnicas.length };
    } catch (error) {
      console.error('❌ Error en getUnidadesPorContrato:', error);
      return { data: null, error, count: null };
    }
  }
}
