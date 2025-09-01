import { supabase } from './supabaseClient';

// Tipos basados en la vista view_prod_contratos
export interface ContratoView {
  id: number;
  'Sede:width[300]': string;
  'No Contrato': string;
  'Entidad / Contratante:FLT': string;
  'NIT': string;
  'Inicial:DT:colspan:[Fechas del Contrato]:width[110]': string;
  'Final:DT:colspan:[Fechas del Contrato]': string;
  'Ejecucion:DT:colspan:[Fechas del Contrato]': string;
  'PPL:colspan:[Cantidades x Dia]': number;
  'Servicios:colspan:[Cantidades x Dia]': number;
  'Raciones:colspan:[Cantidades x Dia]': number;
  'Racion:$:colspan:[Valores]': number;
  'Total:$:colspan:[Valores]': number;
  'Estado': 'ABIERTO' | 'EN PRODUCCION' | 'FINALIZADO' | 'INACTIVO';
  'detalle:hide': Array<{
    Codigo: string;
    Nombre: string;
    'No PPL': number;
  }>;
}

export interface ContratosResponse {
  data: ContratoView[] | null;
  error: any;
  count: number | null;
}

export class ContratosService {
  /**
   * Obtiene todos los contratos (incluyendo inactivos)
   */
  static async getContratos(): Promise<ContratosResponse> {
    try {
      // Consulta directa a la tabla para incluir contratos inactivos
      const { data, error, count } = await supabase
        .from('prod_contratos')
        .select(`
          id,
          no_contrato,
          fecha_inicial,
          fecha_final,
          fecha_arranque,
          no_ppl,
          no_servicios,
          valor_racion,
          valor_contrato,
          estado_proceso,
          con_terceros:id_tercero(documento, nombre_tercero),
          gen_sucursales:id_sucursal(nombre)
        `, { count: 'exact' })
        .order('id', { ascending: false });

      // Transformar datos al formato ContratoView
      const transformedData = data?.map(contrato => ({
        id: contrato.id,
        'Sede:width[300]': contrato.gen_sucursales?.nombre || '',
        'No Contrato': contrato.no_contrato || '',
        'Entidad / Contratante:FLT': contrato.con_terceros?.nombre_tercero || '',
        'NIT': contrato.con_terceros?.documento || '',
        'Inicial:DT:colspan:[Fechas del Contrato]:width[110]': contrato.fecha_inicial || '',
        'Final:DT:colspan:[Fechas del Contrato]': contrato.fecha_final || '',
        'Ejecucion:DT:colspan:[Fechas del Contrato]': contrato.fecha_arranque || '',
        'PPL:colspan:[Cantidades x Dia]': contrato.no_ppl || 0,
        'Servicios:colspan:[Cantidades x Dia]': contrato.no_servicios || 0,
        'Raciones:colspan:[Cantidades x Dia]': (contrato.no_ppl || 0) * (contrato.no_servicios || 0),
        'Racion:$:colspan:[Valores]': contrato.valor_racion || 0,
        'Total:$:colspan:[Valores]': contrato.valor_contrato || 0,
        'Estado': contrato.estado_proceso || 'ABIERTO',
        'detalle:hide': [] // Se cargará por separado
      })) || [];

      return { data: transformedData, error, count };
    } catch (error) {
      console.error('Error al obtener contratos:', error);
      return { data: null, error, count: null };
    }
  }

  /**
   * Obtiene contratos con paginación
   */
  static async getContratosPaginados(
    page: number = 1,
    pageSize: number = 10
  ): Promise<ContratosResponse> {
    try {
      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;

      const { data, error, count } = await supabase
        .from('view_prod_contratos')
        .select('*', { count: 'exact' })
        .range(from, to)
        .order('id', { ascending: false });

      return { data, error, count };
    } catch (error) {
      console.error('Error al obtener contratos paginados:', error);
      return { data: null, error, count: null };
    }
  }

  /**
   * Busca contratos por término de búsqueda
   */
  static async buscarContratos(termino: string): Promise<ContratosResponse> {
    try {
      const { data, error, count } = await supabase
        .from('view_prod_contratos')
        .select('*')
        .or(`No Contrato.ilike.%${termino}%,Entidad / Contratante:FLT.ilike.%${termino}%,NIT.ilike.%${termino}%`)
        .order('id', { ascending: false });

      return { data, error, count };
    } catch (error) {
      console.error('Error al buscar contratos:', error);
      return { data: null, error, count: null };
    }
  }

  /**
   * Filtra contratos por estado
   */
  static async filtrarPorEstado(estado: string): Promise<ContratosResponse> {
    try {
      const { data, error, count } = await supabase
        .from('view_prod_contratos')
        .select('*')
        .eq('Estado', estado)
        .order('id', { ascending: false });

      return { data, error, count };
    } catch (error) {
      console.error('Error al filtrar contratos por estado:', error);
      return { data: null, error, count: null };
    }
  }

  /**
   * Obtiene un contrato específico por ID
   */
  static async getContratoById(id: number): Promise<{ data: ContratoView | null; error: any }> {
    try {
      const { data, error } = await supabase
        .from('view_prod_contratos')
        .select('*')
        .eq('id', id)
        .single();

      return { data, error };
    } catch (error) {
      console.error('Error al obtener contrato por ID:', error);
      return { data: null, error };
    }
  }

  /**
   * Obtiene datos completos de un contrato para edición
   */
  static async getContratoCompleto(id: number): Promise<any> {
    try {
      const { data, error } = await supabase
        .from('prod_contratos')
        .select(`
          *,
          con_terceros:id_tercero(documento, nombre_tercero),
          gen_sucursales:id_sucursal(id, nombre)
        `)
        .eq('id', id)
        .single();

      return {
        data,
        error
      };
    } catch (error) {
      console.error('Error obteniendo contrato completo:', error);
      return {
        data: null,
        error
      };
    }
  }

  /**
   * Activa un contrato
   */
  static async activarContrato(id: number): Promise<any> {
    try {
      const { data, error } = await supabase
        .from('prod_contratos')
        .update({ 
          estado: 1,
          estado_proceso: 'ABIERTO' // Cambiar también el estado del proceso
        })
        .eq('id', id)
        .select();

      return {
        data,
        error
      };
    } catch (error) {
      console.error('Error activando contrato:', error);
      return {
        data: null,
        error
      };
    }
  }

  /**
   * Inactiva un contrato
   */
  static async inactivarContrato(id: number): Promise<any> {
    try {
      const { data, error } = await supabase
        .from('prod_contratos')
        .update({ 
          estado: 0,
          estado_proceso: 'INACTIVO' // Cambiar también el estado del proceso
        })
        .eq('id', id)
        .select();

      return {
        data,
        error
      };
    } catch (error) {
      console.error('Error inactivando contrato:', error);
      return {
        data: null,
        error
      };
    }
  }

  /**
   * Elimina un contrato (solo si está inactivo)
   */
  static async eliminarContrato(id: number): Promise<any> {
    try {
      const { data, error } = await supabase
        .from('prod_contratos')
        .delete()
        .eq('id', id)
        .eq('estado', 0); // Solo eliminar si está inactivo

      return {
        data,
        error
      };
    } catch (error) {
      console.error('Error eliminando contrato:', error);
      return {
        data: null,
        error
      };
    }
  }

  /**
   * Obtiene las zonas de un contrato específico
   */
  static async getZonasContrato(contratoId: number): Promise<any> {
    try {
      const { data, error } = await supabase
        .from('prod_zonas_by_contrato')
        .select(`
          prod_zonas_contrato:id_zona(
            codigo,
            nombre,
            no_ppl
          )
        `)
        .eq('id_contrato', contratoId);

      // Transformar al formato esperado
      const zonas = data?.map(item => ({
        Codigo: item.prod_zonas_contrato?.codigo || '',
        Nombre: item.prod_zonas_contrato?.nombre || '',
        'No PPL': item.prod_zonas_contrato?.no_ppl || 0
      })) || [];

      return {
        data: zonas,
        error
      };
    } catch (error) {
      console.error('Error obteniendo zonas del contrato:', error);
      return {
        data: [],
        error
      };
    }
  }
}

export default ContratosService;
