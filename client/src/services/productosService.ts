import { supabase } from './supabaseClient';

export interface Producto {
  id: number;
  nombre: string;
  tipo_menu: number | null;
  categoria: string;
  sublinea: string;
  componente_menu: string;
}

export interface ComponenteMenu {
  id: number;
  nombre: string;
  expandido: boolean;
  productos: Producto[];
}

interface ProductosResponse {
  data: ComponenteMenu[] | null;
  error: any;
}

export class ProductosService {
  /**
   * Obtiene todos los productos organizados por componente de menú
   */
  static async getProductosPorComponente(): Promise<ProductosResponse> {
    try {
      console.log('🔍 Cargando productos reales de la base de datos...');
      
      const { data: productosData, error } = await supabase
        .from('inv_productos')
        .select(`
          id,
          nombre,
          tipo_menu,
          inv_categorias!inner(nombre),
          inv_sublineas!inner(
            nombre,
            prod_componentes_menus!inner(
              id,
              nombre
            )
          )
        `)
        .eq('estado', 1)
        .order('nombre', { ascending: true });

      if (error) {
        console.error('Error obteniendo productos:', error);
        return { data: null, error };
      }

      console.log('📊 Productos raw obtenidos:', productosData);

      // Transformar los datos para agrupar por componente de menú
      const componentesMap = new Map<number, ComponenteMenu>();

      productosData?.forEach((item: any) => {
        const componenteMenu = item.inv_sublineas?.prod_componentes_menus;
        const categoria = item.inv_categorias?.nombre;
        const sublinea = item.inv_sublineas?.nombre;

        if (componenteMenu) {
          const componenteId = componenteMenu.id;
          
          // Si no existe el componente, crearlo
          if (!componentesMap.has(componenteId)) {
            componentesMap.set(componenteId, {
              id: componenteId,
              nombre: componenteMenu.nombre,
              expandido: false,
              productos: []
            });
          }

          // Agregar el producto al componente
          const producto: Producto = {
            id: item.id,
            nombre: item.nombre,
            tipo_menu: item.tipo_menu,
            categoria: categoria || 'Sin categoría',
            sublinea: sublinea || 'Sin sublínea',
            componente_menu: componenteMenu.nombre
          };

          componentesMap.get(componenteId)!.productos.push(producto);
        }
      });

      const componentes = Array.from(componentesMap.values());
      console.log('✅ Componentes organizados:', componentes);

      return { data: componentes, error: null };
    } catch (error) {
      console.error('Error al obtener productos por componente:', error);
      return { data: null, error };
    }
  }

  /**
   * Obtiene productos filtrados por unidades de servicio seleccionadas
   */
  static async getProductosPorUnidades(unidadIds: number[]): Promise<ProductosResponse> {
    try {
      console.log('🔍 Cargando productos para unidades:', unidadIds);
      
      if (unidadIds.length === 0) {
        return { data: [], error: null };
      }

      const { data: productosData, error } = await supabase
        .from('inv_productos_unidad_servicio')
        .select(`
          inv_productos!inner(
            id,
            nombre,
            tipo_menu,
            inv_categorias!inner(nombre),
            inv_sublineas!inner(
              nombre,
              prod_componentes_menus!inner(
                id,
                nombre
              )
            )
          )
        `)
        .in('id_unidad_servicio', unidadIds)
        .eq('estado', 1);

      if (error) {
        console.error('Error obteniendo productos por unidades:', error);
        return { data: null, error };
      }

      console.log('📊 Productos por unidades obtenidos:', productosData);

      // Transformar y organizar por componente de menú
      const componentesMap = new Map<number, ComponenteMenu>();
      const productosUnicos = new Set<number>(); // Para evitar duplicados

      productosData?.forEach((item: any) => {
        const producto = item.inv_productos;
        
        // Evitar duplicados
        if (productosUnicos.has(producto.id)) {
          return;
        }
        productosUnicos.add(producto.id);

        const componenteMenu = producto.inv_sublineas?.prod_componentes_menus;
        const categoria = producto.inv_categorias?.nombre;
        const sublinea = producto.inv_sublineas?.nombre;

        if (componenteMenu) {
          const componenteId = componenteMenu.id;
          
          // Si no existe el componente, crearlo
          if (!componentesMap.has(componenteId)) {
            componentesMap.set(componenteId, {
              id: componenteId,
              nombre: componenteMenu.nombre,
              expandido: false,
              productos: []
            });
          }

          // Agregar el producto al componente
          const productoObj: Producto = {
            id: producto.id,
            nombre: producto.nombre,
            tipo_menu: producto.tipo_menu,
            categoria: categoria || 'Sin categoría',
            sublinea: sublinea || 'Sin sublínea',
            componente_menu: componenteMenu.nombre
          };

          componentesMap.get(componenteId)!.productos.push(productoObj);
        }
      });

      const componentes = Array.from(componentesMap.values());
      console.log('✅ Componentes filtrados por unidades:', componentes);

      return { data: componentes, error: null };
    } catch (error) {
      console.error('Error al obtener productos por unidades:', error);
      return { data: null, error };
    }
  }
}
