import { supabase } from './supabaseClient';

export interface Sucursal {
  id: number;
  nombre: string;
  codigo: string;
  estado: number;
  id_empresa: number;
  id_municipio: number;
  tipo_control_fecha?: string;
}

export interface SucursalesResponse {
  data: Sucursal[] | null;
  error: any;
  count: number | null;
}

export class SucursalesService {
  /**
   * Obtiene todas las sucursales activas
   */
  static async getSucursales(): Promise<SucursalesResponse> {
    try {
      const { data, error, count } = await supabase
        .from('gen_sucursales')
        .select('*')
        .eq('estado', 1)
        .order('nombre', { ascending: true });

      return { data, error, count };
    } catch (error) {
      console.error('Error al obtener sucursales:', error);
      return { data: null, error, count: null };
    }
  }

  /**
   * Obtiene una sucursal por ID
   */
  static async getSucursalById(id: number): Promise<{ data: Sucursal | null; error: any }> {
    try {
      const { data, error } = await supabase
        .from('gen_sucursales')
        .select('*')
        .eq('id', id)
        .single();

      return { data, error };
    } catch (error) {
      console.error('Error al obtener sucursal por ID:', error);
      return { data: null, error };
    }
  }
}

export default SucursalesService;
