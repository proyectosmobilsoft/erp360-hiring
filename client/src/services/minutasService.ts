import { supabase } from './supabaseClient';

export interface UnidadConMenu {
  unidad_id: number;
  unidad_nombre: string;
  zona_nombre: string;
  menus: MenuAsignado[];
}

export interface IngredienteDetallado {
  id_producto: number;
  nombre: string;
  cantidad: number;
  id_componente_menu: number | null;
  nombre_componente_menu: string | null;
  nombre_sublinea: string | null;
}

export interface MenuAsignado {
  id_producto: number;
  nombre_receta: string;
  codigo: string;
  unidad_servicio: string;
  nombre_servicio: string;
  fecha_asignacion: string;
  ingredientes?: string[];
  ingredientes_detallados?: IngredienteDetallado[];
  descripcion?: string;
}

export interface MinutasResponse {
  data: UnidadConMenu[] | null;
  error: any;
}

// Función para generar ingredientes basados en el nombre del producto
const generarIngredientes = (nombreProducto: string): string[] => {
  const nombre = nombreProducto.toLowerCase();
  
  // Mapeo de ingredientes comunes basado en palabras clave
  const ingredientesMap: { [key: string]: string[] } = {
    'pan': ['HARINA DE TRIGO', 'AGUA', 'SAL', 'LEVADURA'],
    'huevo': ['HUEVOS FRESCOS', 'SAL', 'PIMIENTA'],
    'leche': ['LECHE FRESCA', 'AZÚCAR'],
    'arroz': ['ARROZ BLANCO', 'AGUA', 'SAL', 'ACEITE'],
    'pollo': ['POLLO FRESCO', 'SAL', 'PIMIENTA', 'CEBOLLA', 'AJOS'],
    'carne': ['CARNE DE RES', 'SAL', 'PIMIENTA', 'CEBOLLA', 'TOMATE'],
    'papa': ['PAPAS FRESCAS', 'SAL', 'ACEITE'],
    'ensalada': ['LECHUGA', 'TOMATE', 'CEBOLLA', 'LIMÓN', 'ACEITE'],
    'sopa': ['AGUA', 'SAL', 'CEBOLLA', 'ZANAHORIA', 'APIO'],
    'chocolate': ['CHOCOLATE', 'LECHE', 'AZÚCAR'],
    'avena': ['AVENA', 'LECHE', 'AZÚCAR', 'CANELA'],
    'fruta': ['FRUTA FRESCA'],
    'jugo': ['FRUTA FRESCA', 'AGUA', 'AZÚCAR']
  };

  // Buscar coincidencias en el nombre del producto
  for (const [palabra, ingredientes] of Object.entries(ingredientesMap)) {
    if (nombre.includes(palabra)) {
      return ingredientes;
    }
  }

  // Ingredientes por defecto si no se encuentra coincidencia
  return ['INGREDIENTES VARIOS', 'SAL', 'ESPECIAS'];
};

export class MinutasService {
  /**
   * Obtiene los ingredientes detallados de una receta con su información de componente de menú
   */
  static async getIngredientesDetalladosReceta(idReceta: number): Promise<IngredienteDetallado[]> {
    try {
      const { data: ingredientes, error } = await supabase
        .from('inv_detalle_productos')
        .select(`
          id_producto,
          cantidad,
          inv_productos!fk_detalle_productos_ingrediente (
            id,
            nombre,
            id_sublineas,
            inv_sublineas!fk_productos_sublineas (
              id,
              nombre,
              id_componente_menu,
              prod_componentes_menus!fk_sublineas_componente_menu (
                id,
                nombre
              )
            )
          )
        `)
        .eq('id_maestro_producto', idReceta)
        .eq('estado', 1);

      if (error) {
        console.error('❌ Error obteniendo ingredientes de receta:', error);
        return [];
      }

      if (!ingredientes || ingredientes.length === 0) {
        return [];
      }

      // Mapear los ingredientes con su información completa
      const ingredientesDetallados: IngredienteDetallado[] = ingredientes.map(ing => {
        const producto = Array.isArray(ing.inv_productos) ? ing.inv_productos[0] : ing.inv_productos;
        const sublinea = producto?.inv_sublineas ? 
          (Array.isArray(producto.inv_sublineas) ? producto.inv_sublineas[0] : producto.inv_sublineas) : null;
        const componenteMenu = sublinea?.prod_componentes_menus ?
          (Array.isArray(sublinea.prod_componentes_menus) ? sublinea.prod_componentes_menus[0] : sublinea.prod_componentes_menus) : null;

        return {
          id_producto: producto?.id || 0,
          nombre: producto?.nombre || 'Sin nombre',
          cantidad: ing.cantidad || 0,
          id_componente_menu: componenteMenu?.id || null,
          nombre_componente_menu: componenteMenu?.nombre || null,
          nombre_sublinea: sublinea?.nombre || null
        };
      });

      return ingredientesDetallados;
    } catch (error) {
      console.error('❌ Error inesperado obteniendo ingredientes:', error);
      return [];
    }
  }

  /**
   * Obtiene las unidades de servicio de una zona específica con sus menús asignados
   */
  static async getUnidadesConMenusPorZona(
    contratoId: number, 
    zonaId: number
  ): Promise<MinutasResponse> {
    try {
      console.log('🔍 Obteniendo unidades con menús para contrato:', contratoId, 'zona:', zonaId);

      // Primero obtener las unidades de servicio de la zona usando consultas separadas
      // 1. Obtener los IDs de las unidades de servicio de la zona
      const { data: zonasDetalle, error: errorZonasDetalle } = await supabase
        .from('prod_zonas_detalle_contratos')
        .select('id_unidad_servicio')
        .eq('id_zona', zonaId);

      if (errorZonasDetalle) {
        console.error('❌ Error obteniendo detalle de zonas:', errorZonasDetalle);
        return { data: null, error: errorZonasDetalle };
      }

      if (!zonasDetalle || zonasDetalle.length === 0) {
        console.log('⚠️ No se encontraron unidades para esta zona');
        return { data: [], error: null };
      }

      // 2. Obtener los IDs de las unidades
      const unidadIds = zonasDetalle.map(z => z.id_unidad_servicio);

      // 3. Obtener la información de las unidades de servicio
      const { data: unidades, error: errorUnidades } = await supabase
        .from('prod_unidad_servicios')
        .select('id, nombre_servicio')
        .in('id', unidadIds);

      if (errorUnidades) {
        console.error('❌ Error obteniendo unidades:', errorUnidades);
        return { data: null, error: errorUnidades };
      }

      console.log('📊 Unidades encontradas:', unidades);

      if (!unidades || unidades.length === 0) {
        console.log('⚠️ No se encontraron unidades para esta zona');
        return { data: [], error: null };
      }

      // Obtener el nombre de la zona por separado
      const { data: zonaInfo, error: errorZonaInfo } = await supabase
        .from('prod_zonas_contrato')
        .select('nombre')
        .eq('id', zonaId)
        .single();

      const zonaNombre = zonaInfo?.nombre || 'Zona';

      // Obtener los menús asignados a estas unidades usando la misma lógica que asignacionesService
      const { data: asignaciones, error: errorAsignaciones } = await supabase
        .from('inv_productos_unidad_servicio')
        .select(`
          id,
          id_producto_by_unidad,
          id_contrato,
          id_unidad_servicio,
          created_at
        `)
        .in('id_unidad_servicio', unidadIds)
        .eq('id_contrato', contratoId);

      if (errorAsignaciones) {
        console.error('❌ Error obteniendo asignaciones:', errorAsignaciones);
        return { data: null, error: errorAsignaciones };
      }

      console.log('🍽️ Asignaciones encontradas:', asignaciones);

      if (!asignaciones || asignaciones.length === 0) {
        console.log('⚠️ No se encontraron asignaciones para estas unidades');
        return { data: [], error: null };
      }

      // Obtener los IDs de relaciones producto-unidad únicos
      const relacionesIds = [...new Set(asignaciones.map(a => a.id_producto_by_unidad))];
      
      // Obtener información de las relaciones producto-unidad con sus datos relacionados
      const { data: relaciones, error: errorRelaciones } = await supabase
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

      if (errorRelaciones) {
        console.error('❌ Error obteniendo relaciones:', errorRelaciones);
        return { data: null, error: errorRelaciones };
      }

      console.log('🍽️ Relaciones encontradas:', relaciones);

      // Combinar los datos usando la misma lógica que asignacionesService
      const unidadesConMenus: UnidadConMenu[] = await Promise.all(unidades.map(async (unidad) => {
        // Filtrar asignaciones para esta unidad
        const asignacionesDeUnidad = asignaciones?.filter(asignacion => 
          asignacion.id_unidad_servicio === unidad.id
        ) || [];

        console.log(`🔍 Procesando unidad ${unidad.id} (${unidad.nombre_servicio}):`, {
          asignacionesDeUnidad: asignacionesDeUnidad.length,
          primerAsignacion: asignacionesDeUnidad[0]
        });

        const menusRaw = await Promise.all(asignacionesDeUnidad.map(async (asignacion) => {
          // Buscar la relación correspondiente
          const relacion = relaciones?.find(r => r.id === asignacion.id_producto_by_unidad);
          if (!relacion) {
            console.log('❌ No se encontró relación para la asignación:', asignacion.id_producto_by_unidad);
            return null;
          }
          
          console.log('🔍 Relación encontrada:', {
            id: relacion.id,
            id_producto: relacion.id_producto,
            id_unidad_servicio: relacion.id_unidad_servicio,
            inv_productos: relacion.inv_productos,
            tipo: typeof relacion.inv_productos,
            esArray: Array.isArray(relacion.inv_productos),
            keys: relacion.inv_productos ? Object.keys(relacion.inv_productos) : 'null'
          });
          
          // Acceder correctamente a la estructura de datos
          let producto;
          
          // Verificar si es un array o un objeto
          if (Array.isArray(relacion.inv_productos)) {
            producto = relacion.inv_productos[0];
            console.log('📋 Es array, accediendo a [0]:', producto);
          } else {
            producto = relacion.inv_productos;
            console.log('📋 Es objeto, accediendo directo:', producto);
          }
          
          if (!producto) {
            console.log('❌ No se encontró producto para la relación');
            return null;
          }
          
          console.log('✅ Producto encontrado:', {
            id: producto.id,
            nombre: producto.nombre,
            codigo: producto.codigo,
            clase_servicio_raw: producto.inv_clase_servicios,
            clase_servicio_tipo: typeof producto.inv_clase_servicios,
            clase_servicio_isArray: Array.isArray(producto.inv_clase_servicios),
            clase_servicio_length: producto.inv_clase_servicios?.length,
            clase_servicio_primer_elemento: producto.inv_clase_servicios?.[0]
          });
          
          // Simular ingredientes basados en el nombre del producto
          const ingredientes = generarIngredientes(producto.nombre);
          
          // Determinar el nombre del servicio
          let nombreServicio = '';
          if (producto.inv_clase_servicios) {
            if (Array.isArray(producto.inv_clase_servicios) && producto.inv_clase_servicios.length > 0) {
              nombreServicio = producto.inv_clase_servicios[0]?.nombre || '';
            } else if (!Array.isArray(producto.inv_clase_servicios) && typeof producto.inv_clase_servicios === 'object' && 'nombre' in producto.inv_clase_servicios) {
              nombreServicio = (producto.inv_clase_servicios as any).nombre;
            }
          }
          
          console.log(`🔍 Nombre servicio determinado para ${producto.nombre}: "${nombreServicio}"`);
          
          return {
            id_producto: producto.id,
            nombre_receta: producto.nombre,
            codigo: producto.codigo,
            unidad_servicio: unidad.nombre_servicio,
            nombre_servicio: nombreServicio,
            fecha_asignacion: asignacion.created_at,
            ingredientes: ingredientes,
            ingredientes_detallados: [],
            descripcion: producto.nombre
          };
        }));
        
        const menusFormateados: MenuAsignado[] = menusRaw.filter(Boolean) as MenuAsignado[];

        return {
          unidad_id: unidad.id,
          unidad_nombre: unidad.nombre_servicio,
          zona_nombre: zonaNombre,
          menus: menusFormateados
        };
      }));

      console.log('✅ Unidades con menús procesadas:', unidadesConMenus);

      return { data: unidadesConMenus, error: null };
    } catch (error) {
      console.error('❌ Error inesperado obteniendo unidades con menús:', error);
      return { data: null, error };
    }
  }

  /**
   * Obtiene información detallada del contrato incluyendo fecha de ejecución
   */
  static async getContratoDetalle(contratoId: number) {
    try {
      const { data, error } = await supabase
        .from('prod_contratos')
        .select(`
          id,
          no_contrato,
          fecha_arranque,
          fecha_inicial,
          fecha_final,
          con_terceros:id_tercero(
            nombre_tercero
          )
        `)
        .eq('id', contratoId)
        .single();

      if (error) {
        console.error('❌ Error obteniendo detalle del contrato:', error);
        return { data: null, error };
      }

      return { data, error: null };
    } catch (error) {
      console.error('❌ Error inesperado obteniendo detalle del contrato:', error);
      return { data: null, error };
    }
  }

  /**
   * Obtiene productos/menús con sus componentes y detalles para una unidad de servicio
   * usando la función RPC creada en la base de datos
   */
  static async getProductosConDetallePorUnidad(
    unidadServicioId: number,
    contratoId: number,
    tipoMenu: string = 'Estandar'
  ): Promise<{ data: any[] | null; error: any }> {
    try {
      console.log('🔍 Obteniendo productos con detalle para unidad:', unidadServicioId, 'contrato:', contratoId, 'tipo:', tipoMenu);

      // Llamar a la función RPC creada en la base de datos
      const { data, error } = await supabase.rpc('get_productos_detalle_zona', {
        p_id_unidad_servicio: unidadServicioId,
        p_id_contrato: contratoId,
        p_tipo_menu: tipoMenu
      });

      if (error) {
        console.error('❌ Error ejecutando función RPC:', error);
        return { data: null, error };
      }

      // El resultado ya es un array JSON parseado
      console.log('✅ Productos obtenidos:', data);
      return { data: data || [], error: null };
    } catch (error) {
      console.error('❌ Error inesperado obteniendo productos con detalle:', error);
      return { data: null, error };
    }
  }

  /**
   * Obtiene productos/menús con sus componentes y detalles para todas las unidades de servicio de una zona
   */
  static async getProductosConDetallePorZona(
    zonaId: number,
    contratoId: number,
    tipoMenu: string = 'Estandar'
  ): Promise<{ data: any[] | null; error: any }> {
    try {
      console.log('🔍 Obteniendo productos con detalle para zona:', zonaId, 'contrato:', contratoId, 'tipo:', tipoMenu);

      // Primero obtener todas las unidades de servicio de la zona
      const { data: zonasDetalle, error: errorZonasDetalle } = await supabase
        .from('prod_zonas_detalle_contratos')
        .select('id_unidad_servicio')
        .eq('id_zona', zonaId);

      if (errorZonasDetalle) {
        console.error('❌ Error obteniendo detalle de zonas:', errorZonasDetalle);
        return { data: null, error: errorZonasDetalle };
      }

      if (!zonasDetalle || zonasDetalle.length === 0) {
        console.log('⚠️ No se encontraron unidades para esta zona');
        return { data: [], error: null };
      }

      // Obtener los IDs de las unidades
      const unidadIds = zonasDetalle.map(z => z.id_unidad_servicio);
      console.log(`📊 Consolidando datos de ${unidadIds.length} unidades de servicio para la zona ${zonaId}`);

      // Ejecutar la consulta para cada unidad de servicio y consolidar resultados
      const productosConsolidados: any[] = [];
      let unidadesProcesadas = 0;
      
      for (const unidadId of unidadIds) {
        const resultado = await MinutasService.getProductosConDetallePorUnidad(
          unidadId,
          contratoId,
          tipoMenu
        );

        if (resultado.data && resultado.data.length > 0) {
          unidadesProcesadas++;
          // Agregar id_unidad_servicio a cada producto para poder agrupar después
          const productosConUnidad = resultado.data.map((producto: any) => ({
            ...producto,
            id_unidad_servicio: unidadId
          }));
          productosConsolidados.push(...productosConUnidad);
          console.log(`  ✓ Unidad ${unidadId}: ${resultado.data.length} productos agregados`);
        }
      }

      console.log('✅ JSON Consolidado del RPC:', {
        totalUnidades: unidadIds.length,
        unidadesProcesadas,
        totalProductos: productosConsolidados.length,
        estructura: productosConsolidados.length > 0 ? {
          ejemplo: productosConsolidados[0],
          campos: Object.keys(productosConsolidados[0] || {})
        } : null
      });

      // Mostrar resumen del JSON consolidado
      if (productosConsolidados.length > 0) {
        const resumen = productosConsolidados.reduce((acc, producto) => {
          const clave = `${producto.num_menu || 'N/A'}-${producto.id_clase_servicio || 'N/A'}`;
          acc[clave] = (acc[clave] || 0) + 1;
          return acc;
        }, {} as Record<string, number>);
        
        console.log('📋 Resumen del JSON consolidado por menú y clase de servicio:', resumen);
      }

      return { data: productosConsolidados, error: null };
    } catch (error) {
      console.error('❌ Error inesperado obteniendo productos con detalle por zona:', error);
      return { data: null, error };
    }
  }

  /**
   * Transforma los datos de get_productos_detalle_zona al formato que espera el calendario
   * Similar a la lógica del componente Angular DetalleCiclosComponent
   * Valida que los id_clase_servicio e id_componente existan en las listas de validación
   */
  static transformarDatosParaCalendario(
    productosDetalle: any[],
    noCiclos: number,
    clasesServicios: Array<{ id: number; nombre: string }> = [],
    componentesMenus: Array<{ id: number; nombre: string; id_clase_servicio: number }> = []
  ): {
    detallemenus: Array<{
      id_clase_servicio: number;
      nombre: string;
      id_componente: number;
      componente: string;
      ingredientes: Array<{
        menu: number;
        nombre: string;
        cantidad?: number;
        medida?: string;
        id_producto?: number;
        id_detalle?: number;
        costo?: number;
        total?: number;
      }>;
    }>;
    validaciones: {
      clasesValidadas: number;
      componentesValidadas: number;
      ingredientesProcesados: number;
      ingredientesOmitidos: number;
      errores: Array<{ tipo: string; mensaje: string; datos: any }>;
    };
  } {
    const detallemenus: Array<{
      id_clase_servicio: number;
      nombre: string;
      id_componente: number;
      componente: string;
      ingredientes: Array<{
        menu: number;
        nombre: string;
        cantidad?: number;
        medida?: string;
        id_producto?: number;
        id_detalle?: number;
        costo?: number;
        total?: number;
      }>;
    }> = [];

    const validaciones = {
      clasesValidadas: 0,
      componentesValidadas: 0,
      ingredientesProcesados: 0,
      ingredientesOmitidos: 0,
      errores: [] as Array<{ tipo: string; mensaje: string; datos: any }>
    };

    // Crear mapas para validación rápida
    const clasesServiciosMap = new Map(clasesServicios.map(cs => [cs.id, cs]));
    const componentesMenusMap = new Map(
      componentesMenus.map(cm => [`${cm.id_clase_servicio}-${cm.id}`, cm])
    );

    console.log('🔍 Validando datos del RPC:', {
      totalProductos: productosDetalle.length,
      clasesServiciosDisponibles: clasesServicios.length,
      componentesDisponibles: componentesMenus.length,
      clasesMap: Array.from(clasesServiciosMap.keys()),
      componentesMap: Array.from(componentesMenusMap.keys()),
      clasesServicios: clasesServicios.map(cs => ({ id: cs.id, nombre: cs.nombre })),
      componentesSample: componentesMenus.slice(0, 5).map(cm => ({ 
        id: cm.id, 
        nombre: cm.nombre, 
        id_clase_servicio: cm.id_clase_servicio 
      }))
    });

    // Recorrer cada producto/receta
    productosDetalle.forEach((receta, recetaIndex) => {
      // Si num_menu es null, usar 1 como valor por defecto
      let numMenu = receta.num_menu;
      if (numMenu === null || numMenu === undefined) {
        numMenu = 1;
        console.warn(`⚠️ num_menu es null/undefined en receta ${recetaIndex}, usando valor por defecto: 1`);
      }
      numMenu = Math.max(1, Math.min(numMenu, noCiclos)); // Asegurar que esté en el rango válido
      
      const idClaseServicio = receta.id_clase_servicio;
      const nombreServicio = receta.nombre_servicio || '';

      // VALIDACIÓN 1: Verificar que la clase de servicio existe
      const claseServicioValida = clasesServiciosMap.get(idClaseServicio);
      if (!claseServicioValida) {
        validaciones.errores.push({
          tipo: 'clase_servicio_no_encontrada',
          mensaje: `Clase de servicio con ID ${idClaseServicio} no existe en las clases disponibles`,
          datos: {
            recetaIndex,
            idClaseServicio,
            nombreServicio,
            numMenu,
            clasesDisponibles: Array.from(clasesServiciosMap.keys())
          }
        });
        console.warn(`⚠️ Clase de servicio ${idClaseServicio} (${nombreServicio}) no encontrada en clases disponibles`);
        return; // Saltar esta receta
      }

      validaciones.clasesValidadas++;

      // Parsear el detalle (componentes) si es string, si no ya es un array
      let componentes: any[] = [];
      if (typeof receta.detalle === 'string') {
        try {
          componentes = JSON.parse(receta.detalle);
        } catch (e) {
          console.error('❌ Error parseando detalle:', e);
          validaciones.errores.push({
            tipo: 'error_parseo_detalle',
            mensaje: `Error parseando detalle de receta: ${e}`,
            datos: { recetaIndex, numMenu, idClaseServicio }
          });
          componentes = [];
        }
      } else if (Array.isArray(receta.detalle)) {
        componentes = receta.detalle;
      }

      // Recorrer cada componente - SOLO procesar los que tienen ingredientes
      componentes.forEach((componente, compIndex) => {
        const idComponente = componente.id_componente;
        const nombreComponente = componente.componente || '';

        // Parsear el detalle del componente (ingredientes) PRIMERO para saber si tiene ingredientes
        let ingredientes: any[] = [];
        if (typeof componente.detalle === 'string') {
          try {
            ingredientes = JSON.parse(componente.detalle);
          } catch (e) {
            console.error('❌ Error parseando detalle del componente:', e);
            validaciones.errores.push({
              tipo: 'error_parseo_ingredientes',
              mensaje: `Error parseando ingredientes del componente: ${e}`,
              datos: { recetaIndex, compIndex, idComponente, idClaseServicio }
            });
            ingredientes = [];
          }
        } else if (Array.isArray(componente.detalle)) {
          ingredientes = componente.detalle;
        }

        // SOLO procesar componentes que tienen ingredientes
        if (ingredientes.length === 0) {
          // No es un error, simplemente ignorar componentes sin ingredientes
          return;
        }

        // Buscar el componente en TODAS las clases de servicio (no solo en la del producto)
        // porque un componente puede estar en múltiples clases de servicio
        let componenteValido: { id: number; nombre: string; id_clase_servicio: number } | undefined;
        let claseServicioComponente = idClaseServicio; // Por defecto, usar la clase del producto

        // Primero intentar encontrar el componente en la clase de servicio del producto
        const claveComponente = `${idClaseServicio}-${idComponente}`;
        componenteValido = componentesMenusMap.get(claveComponente);

        // Si no se encuentra en la clase del producto, buscar en todas las clases
        if (!componenteValido) {
          for (const [claseId, componentesList] of Array.from(clasesServiciosMap.entries())) {
            const claveAlternativa = `${claseId}-${idComponente}`;
            const compAlternativo = componentesMenusMap.get(claveAlternativa);
            if (compAlternativo) {
              componenteValido = compAlternativo;
              claseServicioComponente = claseId;
              console.log(`ℹ️ Componente ${idComponente} (${nombreComponente}) encontrado en clase ${claseId} en lugar de ${idClaseServicio}`);
              break;
            }
          }
        }

        // Si aún no se encuentra, es un error
        if (!componenteValido) {
          validaciones.errores.push({
            tipo: 'componente_no_encontrado',
            mensaje: `Componente con ID ${idComponente} (${nombreComponente}) no existe en ninguna clase de servicio`,
            datos: {
              recetaIndex,
              compIndex,
              idClaseServicio,
              idComponente,
              nombreComponente,
              numMenu,
              componentesDisponibles: Array.from(componentesMenusMap.keys())
            }
          });
          console.warn(`⚠️ Componente ${idComponente} (${nombreComponente}) no encontrado en ninguna clase de servicio`);
          validaciones.ingredientesOmitidos++;
          return; // Saltar este componente
        }

        validaciones.componentesValidadas++;

        // Usar la clase de servicio donde se encontró el componente
        const idClaseServicioFinal = claseServicioComponente;
        
        // Procesar TODOS los ingredientes del componente con el número de menú
        const ingredientesProcesados = ingredientes.map(ing => ({
          menu: numMenu, // Número del menú (1-indexed)
          nombre: ing.nombre || 'Sin nombre',
          cantidad: ing.cantidad || 0,
          medida: ing.medida || '',
          id_producto: ing.id_producto,
          id_detalle: ing.id_detalle,
          costo: ing.costo || 0,
          total: ing.total || 0
        }));
        
        // Debug: Log de ingredientes procesados
        if (ingredientesProcesados.length > 0) {
          console.log(`🍽️ Procesando ingredientes para componente ${idComponente} (${nombreComponente}) en menú ${numMenu}:`, {
            numMenu: numMenu,
            ingredientesCount: ingredientesProcesados.length,
            ingredientes: ingredientesProcesados.map(ing => ({
              menu: ing.menu,
              tipoMenu: typeof ing.menu,
              nombre: ing.nombre,
              cantidad: ing.cantidad,
              medida: ing.medida
            }))
          });
        }

        // Buscar si ya existe una fila para esta clase de servicio y componente
        const existingIndex = detallemenus.findIndex(
          (dm) => dm.id_clase_servicio === idClaseServicioFinal && dm.id_componente === idComponente
        );

        if (existingIndex !== -1) {
          // Si existe, agregar los ingredientes al array de ingredientes
          // La estructura ahora es: { ingredientes: [{ menu, nombre, ... }, ...] }
          if (!detallemenus[existingIndex].ingredientes) {
            detallemenus[existingIndex].ingredientes = [];
          }
          detallemenus[existingIndex].ingredientes.push(...ingredientesProcesados);
          validaciones.ingredientesProcesados += ingredientesProcesados.length;
        } else {
          // Si no existe, crear una nueva fila con la nueva estructura
          const claseServicioParaComponente = clasesServiciosMap.get(idClaseServicioFinal);
          detallemenus.push({
            id_clase_servicio: idClaseServicioFinal,
            nombre: claseServicioParaComponente?.nombre || nombreServicio,
            id_componente: idComponente,
            componente: componenteValido.nombre,
            ingredientes: ingredientesProcesados
          });
          validaciones.ingredientesProcesados += ingredientesProcesados.length;
        }
      });
    });

    console.log('✅ Transformación completada:', {
      detallemenusCount: detallemenus.length,
      validaciones,
      detallemenus: detallemenus.map(dm => ({
        id_clase: dm.id_clase_servicio,
        nombre_clase: dm.nombre,
        id_componente: dm.id_componente,
        componente: dm.componente,
        ingredientesCount: dm.ingredientes?.length || 0,
        ingredientes: dm.ingredientes?.map(ing => ({ 
          menu: ing.menu, 
          nombre: ing.nombre,
          tipoMenu: typeof ing.menu,
          cantidad: ing.cantidad,
          medida: ing.medida
        })) || []
      }))
    });
    
    // Log detallado de cada detallemenu
    detallemenus.forEach((dm, idx) => {
      console.log(`📋 DetalleMenu ${idx + 1}:`, {
        id_clase: dm.id_clase_servicio,
        nombre_clase: dm.nombre,
        id_componente: dm.id_componente,
        componente: dm.componente,
        ingredientesCount: dm.ingredientes?.length || 0,
        ingredientes: dm.ingredientes?.map(ing => ({
          menu: ing.menu,
          tipoMenu: typeof ing.menu,
          nombre: ing.nombre,
          cantidad: ing.cantidad,
          medida: ing.medida
        })) || []
      });
    });

    return { detallemenus, validaciones };
  }
}
