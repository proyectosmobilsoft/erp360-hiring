import { supabase } from './supabaseClient';

// Tipos basados en la vista view_prod_contratos
export interface ContratoView {
  id: number;
  'Sede:width[300]': string;
  'No Contrato': string;
  'Objeto': string;
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
  'No. Ciclos'?: number;
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
          objetivo,
          fecha_inicial,
          fecha_final,
          fecha_arranque,
          no_ppl,
          no_servicios,
          no_ciclos,
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
        'Objeto': contrato.objetivo || '',
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
        'No. Ciclos': contrato.no_ciclos || 0,
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
   * Verifica si un contrato tiene dependencias asociadas (zonas, minutas, asignaciones de productos)
   */
  static async verificarZonasAsociadas(id: number): Promise<{ tieneZonas: boolean; count: number; detalles: { zonas: number; minutas: number; productos: number } }> {
    try {
      // Verificar zonas
      const { count: countZonas } = await supabase
        .from('prod_zonas_by_contrato')
        .select('*', { count: 'exact' })
        .eq('id_contrato', id);

      // Verificar minutas
      const { count: countMinutas } = await supabase
        .from('prod_minutas_contratos')
        .select('*', { count: 'exact' })
        .eq('id_contrato', id);

      // Verificar asignaciones de productos
      const { count: countProductos } = await supabase
        .from('inv_productos_unidad_servicio')
        .select('*', { count: 'exact' })
        .eq('id_contrato', id);

      const totalDependencias = (countZonas || 0) + (countMinutas || 0) + (countProductos || 0);
      const detalles = {
        zonas: countZonas || 0,
        minutas: countMinutas || 0,
        productos: countProductos || 0
      };

      return { 
        tieneZonas: totalDependencias > 0, 
        count: totalDependencias,
        detalles 
      };
    } catch (error) {
      console.error('Error verificando dependencias asociadas:', error);
      return { 
        tieneZonas: false, 
        count: 0,
        detalles: { zonas: 0, minutas: 0, productos: 0 }
      };
    }
  }

  /**
   * Elimina un contrato y todas sus dependencias (zonas, minutas, asignaciones de productos)
   */
  static async eliminarContratoConZonas(id: number): Promise<any> {
    try {
      console.log('🗑️ Iniciando eliminación completa del contrato:', id);

      // 1. Eliminar asignaciones de productos a unidades de servicio
      console.log('📦 Eliminando asignaciones de productos...');
      const { data: productosEliminados, error: errorProductos } = await supabase
        .from('inv_productos_unidad_servicio')
        .delete()
        .eq('id_contrato', id)
        .select();

      if (errorProductos) {
        console.error('❌ Error eliminando asignaciones de productos:', errorProductos);
        return {
          data: null,
          error: errorProductos
        };
      }
      console.log('✅ Asignaciones de productos eliminadas:', productosEliminados?.length || 0);

      // 2. Eliminar minutas asociadas
      console.log('📄 Eliminando minutas asociadas...');
      const { data: minutasEliminadas, error: errorMinutas } = await supabase
        .from('prod_minutas_contratos')
        .delete()
        .eq('id_contrato', id)
        .select();

      if (errorMinutas) {
        console.error('❌ Error eliminando minutas asociadas:', errorMinutas);
        return {
          data: null,
          error: errorMinutas
        };
      }
      console.log('✅ Minutas eliminadas:', minutasEliminadas?.length || 0);
      console.log('📄 Datos de minutas eliminadas:', minutasEliminadas);

      // 3. Eliminar las zonas asociadas
      console.log('🗺️ Eliminando zonas asociadas...');
      const { data: zonasEliminadas, error: errorZonas } = await supabase
        .from('prod_zonas_by_contrato')
        .delete()
        .eq('id_contrato', id)
        .select();

      if (errorZonas) {
        console.error('❌ Error eliminando zonas asociadas:', errorZonas);
        return {
          data: null,
          error: errorZonas
        };
      }
      console.log('✅ Zonas eliminadas:', zonasEliminadas?.length || 0);

      // 4. Finalmente, eliminar el contrato
      console.log('📋 Eliminando contrato principal...');
      const { data: contratoEliminado, error: errorContrato } = await supabase
        .from('prod_contratos')
        .delete()
        .eq('id', id)
        .select();

      if (errorContrato) {
        console.error('❌ Error eliminando contrato:', errorContrato);
        return {
          data: null,
          error: errorContrato
        };
      }
      console.log('✅ Contrato eliminado:', contratoEliminado);

      return {
        data: contratoEliminado,
        error: null
      };
    } catch (error) {
      console.error('❌ Error inesperado eliminando contrato con dependencias:', error);
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
