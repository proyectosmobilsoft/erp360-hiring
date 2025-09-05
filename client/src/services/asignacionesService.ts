import { supabase } from './supabaseClient';

export interface AsignacionData {
  id_producto: number;
  id_contrato: number;
  id_unidad_servicio: number;
  estado?: number;
}

export interface AsignacionResponse {
  data: any[] | null;
  error: any;
}

export class AsignacionesService {
  /**
   * Guarda las asignaciones de productos a unidades de servicio
   */
  static async guardarAsignaciones(asignaciones: AsignacionData[]): Promise<AsignacionResponse> {
    try {
      console.log('💾 Guardando asignaciones en la base de datos...', asignaciones);
      
      // Verificar que todos los IDs existan en sus tablas relacionadas
      await AsignacionesService.validarRelaciones(asignaciones);
      
      // Insertar las asignaciones
      const { data, error } = await supabase
        .from('inv_productos_unidad_servicio')
        .insert(asignaciones)
        .select();

      if (error) {
        console.error('❌ Error al guardar asignaciones:', error);
        return { data: null, error };
      }

      console.log('✅ Asignaciones guardadas exitosamente:', data);
      return { data, error: null };
    } catch (error) {
      console.error('❌ Error inesperado al guardar asignaciones:', error);
      return { data: null, error };
    }
  }

  /**
   * Valida que todos los IDs existan en sus tablas relacionadas
   */
  static async validarRelaciones(asignaciones: AsignacionData[]): Promise<void> {
    const productosIds = [...new Set(asignaciones.map(a => a.id_producto))];
    const contratosIds = [...new Set(asignaciones.map(a => a.id_contrato))];
    const unidadesIds = [...new Set(asignaciones.map(a => a.id_unidad_servicio))];

    // Verificar productos
    const { data: productos, error: errorProductos } = await supabase
      .from('inv_productos')
      .select('id')
      .in('id', productosIds);

    if (errorProductos) {
      throw new Error(`Error al verificar productos: ${errorProductos.message}`);
    }

    if (productos.length !== productosIds.length) {
      const productosEncontrados = productos.map(p => p.id);
      const productosNoEncontrados = productosIds.filter(id => !productosEncontrados.includes(id));
      throw new Error(`Los siguientes productos no existen: ${productosNoEncontrados.join(', ')}`);
    }

    // Verificar contratos
    const { data: contratos, error: errorContratos } = await supabase
      .from('prod_contratos')
      .select('id')
      .in('id', contratosIds);

    if (errorContratos) {
      throw new Error(`Error al verificar contratos: ${errorContratos.message}`);
    }

    if (contratos.length !== contratosIds.length) {
      const contratosEncontrados = contratos.map(c => c.id);
      const contratosNoEncontrados = contratosIds.filter(id => !contratosEncontrados.includes(id));
      throw new Error(`Los siguientes contratos no existen: ${contratosNoEncontrados.join(', ')}`);
    }

    // Verificar unidades de servicio
    const { data: unidades, error: errorUnidades } = await supabase
      .from('prod_unidad_servicios')
      .select('id')
      .in('id', unidadesIds);

    if (errorUnidades) {
      throw new Error(`Error al verificar unidades de servicio: ${errorUnidades.message}`);
    }

    if (unidades.length !== unidadesIds.length) {
      const unidadesEncontradas = unidades.map(u => u.id);
      const unidadesNoEncontradas = unidadesIds.filter(id => !unidadesEncontradas.includes(id));
      throw new Error(`Las siguientes unidades de servicio no existen: ${unidadesNoEncontradas.join(', ')}`);
    }

    console.log('✅ Todas las relaciones son válidas');
  }

  /**
   * Elimina asignaciones existentes para un contrato específico
   */
  static async eliminarAsignacionesPorContrato(idContrato: number): Promise<AsignacionResponse> {
    try {
      console.log('🗑️ Eliminando asignaciones existentes para el contrato:', idContrato);
      
      const { data, error } = await supabase
        .from('inv_productos_unidad_servicio')
        .delete()
        .eq('id_contrato', idContrato)
        .select();

      if (error) {
        console.error('❌ Error al eliminar asignaciones existentes:', error);
        return { data: null, error };
      }

      console.log('✅ Asignaciones existentes eliminadas:', data);
      return { data, error: null };
    } catch (error) {
      console.error('❌ Error inesperado al eliminar asignaciones:', error);
      return { data: null, error };
    }
  }
}
