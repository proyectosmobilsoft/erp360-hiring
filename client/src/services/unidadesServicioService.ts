import { supabase } from './supabaseClient';

export interface UnidadServicio {
  id: number;
  codigo: number;
  nombre_servicio: string;
  id_municipio: number;
  no_ppl: number;
  created_at?: string;
  updated_at?: string;
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
      console.log('🔍 Buscando unidades para contrato ID:', contratoId);
      
      // Primero obtener los IDs de unidades del contrato
      const { data: idsData, error: idsError } = await supabase
        .from('inv_productos_unidad_servicio')
        .select('id_unidad_servicio')
        .eq('id_contrato', contratoId)
        .eq('estado', 1);

      console.log('📊 IDs de unidades encontrados:', idsData);

      if (idsError || !idsData || idsData.length === 0) {
        console.log('❌ No se encontraron IDs de unidades o error:', idsError);
        return { data: [], error: idsError, count: 0 };
      }

      // Obtener IDs únicos
      const idsUnicos = [...new Set(idsData.map(item => item.id_unidad_servicio))];
      console.log('🔢 IDs únicos de unidades:', idsUnicos);

      // Ahora obtener los datos completos de las unidades
      const { data, error, count } = await supabase
        .from('prod_unidad_servicios')
        .select(`
          id,
          codigo,
          nombre_servicio,
          no_ppl,
          id_municipio
        `)
        .in('id', idsUnicos)
        .order('nombre_servicio', { ascending: true });

      console.log('📊 Datos finales de unidades:', data);
      console.log('❌ Error en consulta final:', error);

      if (error) {
        console.error('Error en getUnidadesPorContrato:', error);
        return { data: null, error, count: null };
      }

      console.log('✅ Unidades únicas encontradas:', data);

      return { data: data as UnidadServicio[], error: null, count: data?.length || 0 };
    } catch (error) {
      console.error('Error al obtener unidades por contrato:', error);
      return { data: null, error, count: null };
    }
  }
}
