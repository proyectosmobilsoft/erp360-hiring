import { supabase } from './supabaseClient';

export interface AsignacionData {
  id_producto_by_unidad: number; // ID de la tabla inv_producto_by_unidades
  id_contrato: number;
  id_unidad_servicio: number;
  estado?: number;
}

export interface RecetaExistente {
  id: number;
  id_producto: number;
  id_producto_by_unidad: number; // ID de la tabla inv_producto_by_unidades
  id_contrato: number;
  id_unidad_servicio: number;
  nombre_receta: string;
  codigo: string;
  unidad_servicio: string;
  id_unidad_servicio_nombre: number; // ID de la unidad de servicio
  nombre_servicio: string;
  id_nombre_servicio: number; // ID del nombre de servicio
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
          id_producto_by_unidad,
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

      // Obtener los IDs de relaciones producto-unidad únicos
      const relacionesIds = [...new Set(asignaciones.map(a => a.id_producto_by_unidad))];
      
      // Obtener información de las relaciones producto-unidad con sus datos relacionados
      const { data: relaciones, error: relacionesError } = await supabase
        .from('inv_producto_by_unidades')
        .select(`
          id,
          id_producto,
          id_unidad_servicio,
          inv_productos!inner (
            id,
            nombre,
            codigo,
            inv_categorias!inner (
              isreceta
            ),
            inv_clase_servicios (
              id,
              nombre
            )
          )
        `)
        .in('id', relacionesIds)
        .eq('inv_productos.inv_categorias.isreceta', 1);

      if (relacionesError) {
        console.error('❌ Error obteniendo relaciones:', relacionesError);
        return { data: null, error: relacionesError };
      }

      // Obtener información de la unidad de servicio
      const { data: unidadServicio, error: unidadError } = await supabase
        .from('prod_unidad_servicios')
        .select('id, nombre_servicio')
        .eq('id', unidadId)
        .single();

      if (unidadError) {
        console.error('❌ Error obteniendo unidad de servicio:', unidadError);
        return { data: null, error: unidadError };
      }

      // Combinar la información
      const recetasExistentes: RecetaExistente[] = asignaciones
        .map(asignacion => {
          const relacion = relaciones?.find(r => r.id === asignacion.id_producto_by_unidad);
          if (!relacion) return null;
          
          const producto = relacion.inv_productos;
          if (!producto) return null;
          
          return {
            id: asignacion.id,
            id_producto: producto.id,
            id_producto_by_unidad: asignacion.id_producto_by_unidad,
            id_contrato: asignacion.id_contrato,
            id_unidad_servicio: asignacion.id_unidad_servicio,
            nombre_receta: producto.nombre,
            codigo: producto.codigo,
            unidad_servicio: unidadServicio?.nombre_servicio || 'Sin Unidad',
            id_unidad_servicio_nombre: unidadServicio?.id || 0,
            nombre_servicio: (producto.inv_clase_servicios as any)?.nombre || 'Sin Servicio',
            id_nombre_servicio: (producto.inv_clase_servicios as any)?.id || 0
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
      
      // Agrupar asignaciones por contrato y unidad de servicio
      const asignacionesPorContratoUnidad = asignaciones.reduce((acc, asignacion) => {
        const key = `${asignacion.id_contrato}-${asignacion.id_unidad_servicio}`;
        if (!acc[key]) {
          acc[key] = [];
        }
        acc[key].push(asignacion);
        return acc;
      }, {} as Record<string, AsignacionData[]>);

      console.log('📊 Asignaciones agrupadas por contrato-unidad:', Object.keys(asignacionesPorContratoUnidad));

      // Procesar cada grupo de contrato-unidad
      for (const [key, asignacionesGrupo] of Object.entries(asignacionesPorContratoUnidad)) {
        const [contratoId, unidadId] = key.split('-');
        console.log(`🔄 Procesando grupo: Contrato ${contratoId}, Unidad ${unidadId}`);
        
        // 1. Obtener asignaciones existentes para este contrato y unidad
        const { data: asignacionesExistentes, error: errorExistentes } = await supabase
          .from('inv_productos_unidad_servicio')
          .select('id, id_producto_by_unidad')
          .eq('id_contrato', parseInt(contratoId))
          .eq('id_unidad_servicio', parseInt(unidadId));

        if (errorExistentes) {
          console.error('❌ Error obteniendo asignaciones existentes:', errorExistentes);
          return { data: null, error: errorExistentes };
        }

        console.log(`📋 Asignaciones existentes para contrato ${contratoId}, unidad ${unidadId}:`, asignacionesExistentes);

        // 2. Identificar qué asignaciones mantener (las que están en el payload)
        const idsProductosByUnidadEnPayload = asignacionesGrupo.map(a => a.id_producto_by_unidad);
        const asignacionesAMantener = asignacionesExistentes?.filter(existente => 
          idsProductosByUnidadEnPayload.includes(existente.id_producto_by_unidad)
        ) || [];

        // 3. Identificar qué asignaciones eliminar (las que no están en el payload)
        const asignacionesAEliminar = asignacionesExistentes?.filter(existente => 
          !idsProductosByUnidadEnPayload.includes(existente.id_producto_by_unidad)
        ) || [];

        console.log(`🗑️ Asignaciones a eliminar:`, asignacionesAEliminar);
        console.log(`✅ Asignaciones a mantener:`, asignacionesAMantener);

        // 4. Eliminar asignaciones que no están en el payload
        if (asignacionesAEliminar.length > 0) {
          const idsAEliminar = asignacionesAEliminar.map(a => a.id);
          const { error: errorEliminar } = await supabase
            .from('inv_productos_unidad_servicio')
            .delete()
            .in('id', idsAEliminar);

          if (errorEliminar) {
            console.error('❌ Error eliminando asignaciones:', errorEliminar);
            return { data: null, error: errorEliminar };
          }
          console.log(`🗑️ Eliminadas ${asignacionesAEliminar.length} asignaciones`);
        }

        // 5. Identificar qué asignaciones son nuevas (no existen)
        const idsProductosByUnidadExistentes = asignacionesAMantener.map(a => a.id_producto_by_unidad);
        const asignacionesNuevas = asignacionesGrupo.filter(asignacion => 
          !idsProductosByUnidadExistentes.includes(asignacion.id_producto_by_unidad)
        );

        console.log(`➕ Asignaciones nuevas a insertar:`, asignacionesNuevas);

        // 6. Insertar solo las asignaciones nuevas
        if (asignacionesNuevas.length > 0) {
          const { data: dataInsert, error: errorInsert } = await supabase
            .from('inv_productos_unidad_servicio')
            .insert(asignacionesNuevas)
            .select();

          if (errorInsert) {
            console.error('❌ Error insertando nuevas asignaciones:', errorInsert);
            return { data: null, error: errorInsert };
          }
          console.log(`✅ Insertadas ${asignacionesNuevas.length} nuevas asignaciones`);
        }
      }

      console.log('✅ Todas las asignaciones procesadas exitosamente');
      return { data: [], error: null };
    } catch (error) {
      console.error('❌ Error inesperado al guardar asignaciones:', error);
      return { data: null, error };
    }
  }

  /**
   * Valida que todos los IDs existan en sus tablas relacionadas
   */
  static async validarRelaciones(asignaciones: AsignacionData[]): Promise<void> {
    const relacionesIds = [...new Set(asignaciones.map(a => a.id_producto_by_unidad))];
    const contratosIds = [...new Set(asignaciones.map(a => a.id_contrato))];
    const unidadesIds = [...new Set(asignaciones.map(a => a.id_unidad_servicio))];

    // Verificar relaciones producto-unidad
    const { data: relaciones, error: errorRelaciones } = await supabase
      .from('inv_producto_by_unidades')
      .select('id')
      .in('id', relacionesIds);

    if (errorRelaciones) {
      throw new Error(`Error al verificar relaciones producto-unidad: ${errorRelaciones.message}`);
    }

    if (relaciones.length !== relacionesIds.length) {
      const relacionesEncontradas = relaciones.map(r => r.id);
      const relacionesNoEncontradas = relacionesIds.filter(id => !relacionesEncontradas.includes(id));
      throw new Error(`Las siguientes relaciones producto-unidad no existen: ${relacionesNoEncontradas.join(', ')}`);
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
