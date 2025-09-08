import { supabase } from './supabaseClient';

export interface AsignacionData {
  id_producto: number;
  id_contrato: number;
  id_unidad_servicio: number;
  estado?: number;
}

export interface RecetaExistente {
  id: number;
  id_producto: number;
  id_contrato: number;
  id_unidad_servicio: number;
  nombre_receta: string;
  codigo: string;
  tipo_zona: string;
  nombre_servicio: string;
}

export interface AsignacionResponse {
  data: any[] | null;
  error: any;
}

export class AsignacionesService {
  /**
   * Obtiene las recetas existentes para una unidad de servicio específica
   */
  static async getRecetasExistentesPorUnidad(unidadId: number): Promise<{ data: RecetaExistente[] | null; error: any }> {
    try {
      console.log('🔍 Obteniendo recetas existentes para unidad:', unidadId);
      
      // Primero obtener las asignaciones de la unidad
      const { data: asignaciones, error: asignacionesError } = await supabase
        .from('inv_productos_unidad_servicio')
        .select(`
          id,
          id_producto,
          id_contrato,
          id_unidad_servicio
        `)
        .eq('id_unidad_servicio', unidadId);

      if (asignacionesError) {
        console.error('❌ Error obteniendo asignaciones:', asignacionesError);
        return { data: null, error: asignacionesError };
      }

      if (!asignaciones || asignaciones.length === 0) {
        console.log('⚠️ No se encontraron asignaciones para la unidad:', unidadId);
        return { data: [], error: null };
      }

      // Obtener los IDs de productos únicos
      const productosIds = [...new Set(asignaciones.map(a => a.id_producto))];
      
      // Obtener información de los productos con sus relaciones
      const { data: productos, error: productosError } = await supabase
        .from('inv_productos')
        .select(`
          id,
          nombre,
          codigo,
          inv_tipo_producto!inner (
            es_receta
          ),
          inv_clase_servicios!inner (
            nombre
          ),
          gen_tipo_zonas!inner (
            nombre
          )
        `)
        .in('id', productosIds)
        .eq('inv_tipo_producto.es_receta', true);

      if (productosError) {
        console.error('❌ Error obteniendo productos:', productosError);
        return { data: null, error: productosError };
      }

      // Combinar la información
      const recetasExistentes: RecetaExistente[] = asignaciones
        .map(asignacion => {
          const producto = productos?.find(p => p.id === asignacion.id_producto);
          if (!producto) return null;
          
          return {
            id: asignacion.id,
            id_producto: asignacion.id_producto,
            id_contrato: asignacion.id_contrato,
            id_unidad_servicio: asignacion.id_unidad_servicio,
            nombre_receta: producto.nombre,
            codigo: producto.codigo,
            tipo_zona: (producto.gen_tipo_zonas as any)?.nombre || 'Sin Zona',
            nombre_servicio: (producto.inv_clase_servicios as any)?.nombre || 'Sin Servicio'
          };
        })
        .filter(Boolean) as RecetaExistente[];

      console.log('✅ Recetas existentes encontradas:', recetasExistentes);
      return { data: recetasExistentes, error: null };
    } catch (error) {
      console.error('❌ Error inesperado obteniendo recetas existentes:', error);
      return { data: null, error };
    }
  }

  /**
   * Guarda las asignaciones de productos a unidades de servicio
   */
  static async guardarAsignaciones(asignaciones: AsignacionData[]): Promise<AsignacionResponse> {
    try {
      console.log('💾 Guardando asignaciones en la base de datos...', asignaciones);
      
      if (asignaciones.length === 0) {
        console.log('⚠️ No hay asignaciones para guardar');
        return { data: [], error: null };
      }

      // Verificar que todos los IDs existan en sus tablas relacionadas
      await AsignacionesService.validarRelaciones(asignaciones);
      
      // Obtener el ID del contrato (todas las asignaciones deben ser del mismo contrato)
      const contratoId = asignaciones[0].id_contrato;
      
      // Eliminar asignaciones existentes para este contrato
      console.log('🗑️ Eliminando asignaciones existentes para contrato:', contratoId);
      const { error: deleteError } = await supabase
        .from('inv_productos_unidad_servicio')
        .delete()
        .eq('id_contrato', contratoId);

      if (deleteError) {
        console.error('❌ Error al eliminar asignaciones existentes:', deleteError);
        return { data: null, error: deleteError };
      }

      console.log('✅ Asignaciones existentes eliminadas para contrato:', contratoId);
      
      // Insertar las nuevas asignaciones
      console.log('➕ Insertando nuevas asignaciones...');
      const { data, error } = await supabase
        .from('inv_productos_unidad_servicio')
        .insert(asignaciones)
        .select();

      if (error) {
        console.error('❌ Error al insertar nuevas asignaciones:', error);
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
