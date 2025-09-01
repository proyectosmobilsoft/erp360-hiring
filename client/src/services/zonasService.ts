import { supabase } from './supabaseClient';

export interface Zona {
  id: number;
  codigo: string;
  nombre: string;
  abreviatura?: string;
  no_ppl?: number;
}

export interface ZonasResponse {
  data: Zona[] | null;
  error: any;
  count: number | null;
}

export class ZonasService {
  /**
   * Obtiene todas las zonas disponibles
   */
  static async getZonas(): Promise<ZonasResponse> {
    try {
      const { data, error, count } = await supabase
        .from('prod_zonas_contrato')
        .select('*')
        .order('nombre', { ascending: true });

      return { data, error, count };
    } catch (error) {
      console.error('Error al obtener zonas:', error);
      return { data: null, error, count: null };
    }
  }

  /**
   * Obtiene una zona por ID
   */
  static async getZonaById(id: number): Promise<{ data: Zona | null; error: any }> {
    try {
      const { data, error } = await supabase
        .from('prod_zonas_contrato')
        .select('*')
        .eq('id', id)
        .single();

      return { data, error };
    } catch (error) {
      console.error('Error al obtener zona por ID:', error);
      return { data: null, error };
    }
  }
}

export default ZonasService;
