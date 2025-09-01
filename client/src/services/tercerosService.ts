import { supabase } from './supabaseClient';

export interface Tercero {
  id: number;
  documento: string;
  digito?: string;
  nombre_tercero: string;
  telefono?: string;
  celular?: string;
  email?: string;
  direccion?: string;
  estado: number;
}

export interface TercerosResponse {
  data: Tercero[] | null;
  error: any;
  count?: number | null;
}

export class TercerosService {
  /**
   * Obtiene todos los terceros activos
   */
  static async getTerceros(): Promise<TercerosResponse> {
    try {
      const { data, error, count } = await supabase
        .from('con_terceros')
        .select(`
          id,
          documento,
          digito,
          nombre_tercero,
          telefono,
          celular,
          email,
          direccion,
          estado
        `, { count: 'exact' })
        .eq('estado', 1) // Solo terceros activos
        .order('nombre_tercero', { ascending: true });

      return { data, error, count };
    } catch (error) {
      console.error('Error al obtener terceros:', error);
      return { data: null, error, count: null };
    }
  }

  /**
   * Busca terceros por documento o nombre
   */
  static async buscarTerceros(searchTerm: string): Promise<TercerosResponse> {
    try {
      const { data, error, count } = await supabase
        .from('con_terceros')
        .select(`
          id,
          documento,
          digito,
          nombre_tercero,
          telefono,
          celular,
          email,
          direccion,
          estado
        `, { count: 'exact' })
        .eq('estado', 1)
        .or(`documento.ilike.%${searchTerm}%,nombre_tercero.ilike.%${searchTerm}%`)
        .order('nombre_tercero', { ascending: true })
        .limit(50);

      return { data, error, count };
    } catch (error) {
      console.error('Error al buscar terceros:', error);
      return { data: null, error, count: null };
    }
  }

  /**
   * Obtiene un tercero por ID
   */
  static async getTerceroPorId(id: number): Promise<{ data: Tercero | null; error: any }> {
    try {
      const { data, error } = await supabase
        .from('con_terceros')
        .select(`
          id,
          documento,
          digito,
          nombre_tercero,
          telefono,
          celular,
          email,
          direccion,
          estado
        `)
        .eq('id', id)
        .single();

      return { data, error };
    } catch (error) {
      console.error('Error al obtener tercero:', error);
      return { data: null, error };
    }
  }
}
