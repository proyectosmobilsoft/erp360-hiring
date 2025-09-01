import { supabase } from './supabaseClient';

// Tipos para CRUD de contratos
export interface ContratoCRUD {
  id?: number;
  id_tercero: number;
  id_usuario: number;
  id_sucursal: number;
  no_contrato: string;
  codigo: string;
  fecha_final: string;
  fecha_inicial: string;
  fecha_arranque: string;
  objetivo: string;
  observacion: string;
  tasa_impuesto: number;
  valor_racion?: number;
  valor_contrato: number;
  valor_facturado?: number;
  estado: number;
  no_ppl: number;
  no_ciclos: number;
  no_servicios: number;
  estado_proceso: string;
  clausulas?: string;
  // Campos adicionales para el formulario
  nit?: string;
  nombre_cliente?: string;
  sede_administrativa?: string;
}

export interface ZonaContrato {
  id?: number;
  id_zona: number;
  codigo: string;
  nombre: string;
  no_ppl: number;
}

export interface MenuContrato {
  id?: number;
  id_menu: number;
  nombre: string;
  tipo: string;
}

export interface TiempoContrato {
  id?: number;
  tipo_tiempo: string;
  valor: number;
}

export interface ContratoResponse {
  data: ContratoCRUD | null;
  error: any;
}

export interface ContratosResponse {
  data: ContratoCRUD[] | null;
  error: any;
  count: number | null;
}

export class ContratosCRUDService {
  /**
   * Crea un nuevo contrato
   */
  static async crearContrato(
    contrato: ContratoCRUD,
    zonas: ZonaContrato[] = [],
    menus: MenuContrato[] = [],
    tiempos: TiempoContrato[] = []
  ): Promise<ContratoResponse> {
    try {
      // Obtener el siguiente ID disponible
      const { data: maxIdData } = await supabase
        .from('prod_contratos')
        .select('id')
        .order('id', { ascending: false })
        .limit(1);

      const nextId = maxIdData && maxIdData.length > 0 ? maxIdData[0].id + 1 : 1;
      
      console.log('Creando contrato con ID:', nextId); // Debug
      console.log('Datos del contrato:', contrato); // Debug
      console.log('Clausulas recibidas en servicio:', contrato.clausulas); // Debug
      console.log('Zonas a asociar:', zonas); // Debug

      // Insertar el contrato principal
      const { data: contratoData, error: contratoError } = await supabase
        .from('prod_contratos')
        .insert([{
          id: nextId,
          id_tercero: contrato.id_tercero,
          id_usuario: contrato.id_usuario,
          id_sucursal: contrato.id_sucursal,
          no_contrato: contrato.no_contrato,
          codigo: contrato.codigo,
          fecha_final: contrato.fecha_final,
          fecha_inicial: contrato.fecha_inicial,
          fecha_arranque: contrato.fecha_arranque,
          objetivo: contrato.objetivo,
          observacion: contrato.observacion,
          tasa_impuesto: contrato.tasa_impuesto,
          valor_racion: contrato.valor_racion || 0,
          valor_contrato: contrato.valor_contrato,
          valor_facturado: contrato.valor_facturado || 0,
          estado: contrato.estado,
          no_ppl: contrato.no_ppl,
          no_ciclos: contrato.no_ciclos,
          no_servicios: contrato.no_servicios,
          estado_proceso: contrato.estado_proceso,
          clausulas: contrato.clausulas,
          fecsys: new Date().toISOString()
        }])
        .select()
        .single();

      if (contratoError) {
        console.error('Error al crear contrato:', contratoError);
        return { data: null, error: contratoError };
      }

      // Insertar zonas si las hay
      if (zonas.length > 0 && contratoData) {
        console.log('Insertando zonas para contrato ID:', contratoData.id); // Debug
        
        // Obtener el siguiente ID disponible para zonas
        const { data: maxZonaIdData } = await supabase
          .from('prod_zonas_by_contrato')
          .select('id')
          .order('id', { ascending: false })
          .limit(1);

        const nextZonaId = maxZonaIdData && maxZonaIdData.length > 0 ? maxZonaIdData[0].id + 1 : 1;
        
        const zonasData = zonas.map((zona, index) => ({
          id: nextZonaId + index,
          id_zona: zona.id_zona,
          id_contrato: contratoData.id
        }));
        
        console.log('Datos de zonas a insertar:', zonasData); // Debug

        const { error: zonasError } = await supabase
          .from('prod_zonas_by_contrato')
          .insert(zonasData);

        if (zonasError) {
          console.error('Error al insertar zonas del contrato:', zonasError);
          // No retornamos error aquí para que el contrato se guarde aunque las zonas fallen
        } else {
          console.log('Zonas insertadas correctamente'); // Debug
        }
      } else {
        console.log('No hay zonas para insertar o contrato no creado'); // Debug
      }

      return { data: contratoData, error: null };
    } catch (error) {
      console.error('Error en crearContrato:', error);
      return { data: null, error };
    }
  }

  /**
   * Actualiza un contrato existente
   */
  static async actualizarContrato(
    id: number,
    contrato: ContratoCRUD,
    zonas: ZonaContrato[] = [],
    menus: MenuContrato[] = [],
    tiempos: TiempoContrato[] = []
  ): Promise<ContratoResponse> {
    console.log('ContratosCRUDService.actualizarContrato llamado con:', { id, contrato, zonas }); // Debug
    console.log('Clausulas recibidas en actualización:', contrato.clausulas); // Debug
    try {
      // Actualizar el contrato principal
      const { data: contratoData, error: contratoError } = await supabase
        .from('prod_contratos')
        .update({
          id_tercero: contrato.id_tercero,
          id_usuario: contrato.id_usuario,
          id_sucursal: contrato.id_sucursal,
          no_contrato: contrato.no_contrato,
          codigo: contrato.codigo,
          fecha_final: contrato.fecha_final,
          fecha_inicial: contrato.fecha_inicial,
          fecha_arranque: contrato.fecha_arranque,
          objetivo: contrato.objetivo,
          observacion: contrato.observacion,
          tasa_impuesto: contrato.tasa_impuesto,
          valor_racion: contrato.valor_racion || 0,
          valor_contrato: contrato.valor_contrato,
          valor_facturado: contrato.valor_facturado || 0,
          estado: contrato.estado,
          no_ppl: contrato.no_ppl,
          no_ciclos: contrato.no_ciclos,
          no_servicios: contrato.no_servicios,
          estado_proceso: contrato.estado_proceso,
          clausulas: contrato.clausulas
        })
        .eq('id', id)
        .select()
        .single();

      console.log('Resultado de actualización de contrato:', { contratoData, contratoError }); // Debug

      if (contratoError) {
        console.error('Error al actualizar contrato:', contratoError);
        return { data: null, error: contratoError };
      }

      // Actualizar zonas - siempre eliminar las existentes primero
      console.log('Eliminando zonas existentes para contrato ID:', id); // Debug
      await supabase
        .from('prod_zonas_by_contrato')
        .delete()
        .eq('id_contrato', id);

      // Insertar nuevas zonas si las hay
      if (zonas.length > 0) {
        console.log('Insertando nuevas zonas:', zonas); // Debug
        
        // Obtener el siguiente ID disponible para zonas
        const { data: maxZonaIdData } = await supabase
          .from('prod_zonas_by_contrato')
          .select('id')
          .order('id', { ascending: false })
          .limit(1);

        const nextZonaId = maxZonaIdData && maxZonaIdData.length > 0 ? maxZonaIdData[0].id + 1 : 1;
        
        const zonasData = zonas.map((zona, index) => ({
          id: nextZonaId + index,
          id_zona: zona.id_zona,
          id_contrato: id
        }));
        
        console.log('Datos de zonas a insertar en actualización:', zonasData); // Debug

        const { error: zonasError } = await supabase
          .from('prod_zonas_by_contrato')
          .insert(zonasData);

        if (zonasError) {
          console.error('Error al actualizar zonas del contrato:', zonasError);
        } else {
          console.log('Zonas actualizadas correctamente'); // Debug
        }
      } else {
        console.log('No hay zonas para insertar'); // Debug
      }

      return { data: contratoData, error: null };
    } catch (error) {
      console.error('Error en actualizarContrato:', error);
      return { data: null, error };
    }
  }

  /**
   * Obtiene un contrato por ID para edición
   */
  static async obtenerContratoPorId(id: number): Promise<ContratoResponse> {
    try {
      const { data, error } = await supabase
        .from('prod_contratos')
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
   * Elimina un contrato (cambio de estado)
   */
  static async eliminarContrato(id: number): Promise<{ error: any }> {
    try {
      const { error } = await supabase
        .from('prod_contratos')
        .update({ estado: 0 })
        .eq('id', id);

      return { error };
    } catch (error) {
      console.error('Error al eliminar contrato:', error);
      return { error };
    }
  }

  /**
   * Obtiene las zonas asociadas a un contrato
   */
  static async obtenerZonasContrato(contratoId: number) {
    try {
      const { data, error } = await supabase
        .from('prod_zonas_by_contrato')
        .select(`
          id,
          id_zona,
          prod_zonas_contrato (
            id,
            codigo,
            nombre,
            no_ppl
          )
        `)
        .eq('id_contrato', contratoId);

      return { data, error };
    } catch (error) {
      console.error('Error al obtener zonas del contrato:', error);
      return { data: null, error };
    }
  }
}

export default ContratosCRUDService;
