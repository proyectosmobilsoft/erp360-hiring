import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import {
  Calendar as CalendarIcon,
  UtensilsCrossed,
  MapPin,
  Clock,
  Sun,
  Moon,
  Package,
  Coffee
} from 'lucide-react';
import { supabase } from '../services/supabaseClient';
import { MinutasService } from '../services/minutasService';

interface IngredienteDetallado {
  id_producto: number;
  nombre: string;
  cantidad: number;
  id_componente_menu: number | null;
  nombre_componente_menu: string | null;
  nombre_sublinea: string | null;
}

interface MenuItem {
  id: number;
  nombre: string;
  tipo: 'DESAYUNO' | 'ALMUERZO' | 'CENA' | 'REFRIGERIO';
  codigo: string;
  ingredientes: string[];
  ingredientes_detallados?: IngredienteDetallado[];
}

interface UnitMenu {
  unidad_id: number;
  unidad_nombre: string;
  fecha_inicio: string;
  menus: MenuItem[];
}

interface ClaseServicio {
  id: number;
  nombre: string;
  orden: number;
}

interface ComponenteMenu {
  id: number;
  nombre: string;
  id_clase_servicio: number;
}

interface DetalleMenu {
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
}

interface MenuCalendarDetailedProps {
  zonaId: string;
  zonaNombre: string;
  fechaInicial: string;
  fechaEjecucion: string;
  unidadesMenus: UnitMenu[];
  detallemenus?: DetalleMenu[];
  noCiclos?: number;
  productosDetalleZona?: any[]; // Datos crudos del RPC sin transformar
}

const MenuCalendarDetailed: React.FC<MenuCalendarDetailedProps> = ({
  zonaId,
  zonaNombre,
  fechaInicial,
  fechaEjecucion,
  unidadesMenus,
  detallemenus = [],
  noCiclos = 7,
  productosDetalleZona = []
}) => {
  const [clasesServicios, setClasesServicios] = useState<ClaseServicio[]>([]);
  const [componentesMenus, setComponentesMenus] = useState<ComponenteMenu[]>([]);
  const [cargando, setCargando] = useState(true);
  const [detallemenusTransformados, setDetallemenusTransformados] = useState<DetalleMenu[]>([]);
  const [validaciones, setValidaciones] = useState<any>(null);

  // Cargar clases de servicios y componentes de menú
  useEffect(() => {
    const cargarDatos = async () => {
      setCargando(true);
      try {
        // Cargar clases de servicios
        const { data: clases, error: errorClases } = await supabase
          .from('inv_clase_servicios')
          .select('id, nombre, orden')
          .eq('estado', 1)
          .order('orden');

        if (errorClases) {
          console.error('❌ Error cargando clases de servicios:', errorClases);
        } else {
          setClasesServicios(clases || []);
          console.log('✅ Clases de servicios cargadas:', clases);
        }

        // Cargar componentes de menú con su relación a clase de servicio
        const { data: componentes, error: errorComponentes } = await supabase
          .from('prod_componentes_menus')
          .select('id, nombre, id_clase_servicio')
          .order('id');

        if (errorComponentes) {
          console.error('❌ Error cargando componentes de menú:', errorComponentes);
        } else {
          setComponentesMenus(componentes || []);
          console.log('✅ Componentes de menú cargados:', componentes);
        }
      } catch (error) {
        console.error('❌ Error inesperado cargando datos:', error);
      } finally {
        setCargando(false);
      }
    };

    cargarDatos();
  }, []);

  // Transformar datos del RPC cuando se carguen las clases y componentes
  useEffect(() => {
    console.log('🔄 useEffect de transformación ejecutándose:', {
      productosDetalleZonaLength: productosDetalleZona.length,
      clasesServiciosLength: clasesServicios.length,
      componentesMenusLength: componentesMenus.length,
      cargando: cargando,
      noCiclos: noCiclos
    });
    
    if (productosDetalleZona.length > 0 && clasesServicios.length > 0 && componentesMenus.length > 0 && !cargando) {
      console.log('🔄 Transformando datos del RPC con validaciones...');
      
      const resultado = MinutasService.transformarDatosParaCalendario(
        productosDetalleZona,
        noCiclos,
        clasesServicios,
        componentesMenus
      );

      console.log('✅ Resultado de transformación recibido:', {
        detallemenusCount: resultado.detallemenus.length,
        detallemenus: resultado.detallemenus.map(dm => ({
          id_clase: dm.id_clase_servicio,
          nombre_clase: dm.nombre,
          id_componente: dm.id_componente,
          componente: dm.componente,
          ingredientesCount: dm.ingredientes?.length || 0,
          ingredientes: dm.ingredientes?.map(ing => ({ menu: ing.menu, nombre: ing.nombre })) || []
        }))
      });

      setDetallemenusTransformados(resultado.detallemenus);
      setValidaciones(resultado.validaciones);

      console.log('✅ Estado actualizado con detallemenusTransformados:', resultado.detallemenus.length);

      // Mostrar advertencias si hay errores
      if (resultado.validaciones.errores.length > 0) {
        console.warn('⚠️ Errores encontrados durante la validación:', resultado.validaciones.errores);
      }
    } else if (productosDetalleZona.length === 0) {
      // Si no hay datos del RPC, limpiar los datos transformados
      console.log('🧹 Limpiando datos transformados (no hay productosDetalleZona)');
      setDetallemenusTransformados([]);
      setValidaciones(null);
    } else {
      console.log('⏸️ No se pueden transformar los datos aún:', {
        productosDetalleZonaLength: productosDetalleZona.length,
        clasesServiciosLength: clasesServicios.length,
        componentesMenusLength: componentesMenus.length,
        cargando: cargando
      });
    }
  }, [productosDetalleZona, clasesServicios, componentesMenus, noCiclos, cargando]);

  // Debug: Log de datos recibidos
  console.log('📅 MenuCalendarDetailed recibió:', {
    zonaId,
    zonaNombre,
    fechaEjecucion,
    unidadesCount: unidadesMenus.length,
    clasesServicios: clasesServicios.length,
    componentesMenus: componentesMenus.length,
    unidades: unidadesMenus.map(unidad => ({
      id: unidad.unidad_id,
      nombre: unidad.unidad_nombre,
      menusCount: unidad.menus.length,
      menus: unidad.menus.map(menu => ({
        id: menu.id,
        nombre: menu.nombre,
        tipo: menu.tipo,
        codigo: menu.codigo,
        ingredientes: menu.ingredientes,
        ingredientes_detallados: menu.ingredientes_detallados?.map(ing => ({
          nombre: ing.nombre,
          id_componente_menu: ing.id_componente_menu,
          nombre_componente_menu: ing.nombre_componente_menu
        })),
        ingredientes_detallados_count: menu.ingredientes_detallados?.length || 0
      }))
    }))
  });
  // Función para obtener el icono del tipo de menú
  const getMenuIcon = (tipo: string) => {
    switch (tipo) {
      case 'DESAYUNO':
        return <Sun className="w-4 h-4 text-yellow-500" />;
      case 'ALMUERZO':
        return <UtensilsCrossed className="w-4 h-4 text-orange-500" />;
      case 'CENA':
        return <Moon className="w-4 h-4 text-purple-500" />;
      case 'REFRIGERIO':
        return <Package className="w-4 h-4 text-green-500" />;
      default:
        return <Coffee className="w-4 h-4 text-gray-500" />;
    }
  };

  // Función para obtener el color del tipo de menú
  const getMenuTypeColor = (tipo: string) => {
    switch (tipo) {
      case 'DESAYUNO':
        return 'bg-yellow-50 border-yellow-200 text-yellow-800';
      case 'ALMUERZO':
        return 'bg-orange-50 border-orange-200 text-orange-800';
      case 'CENA':
        return 'bg-purple-50 border-purple-200 text-purple-800';
      case 'REFRIGERIO':
        return 'bg-green-50 border-green-200 text-green-800';
      default:
        return 'bg-gray-50 border-gray-200 text-gray-800';
    }
  };

  // Función para obtener el color del borde superior según el tipo de menú
  const getMenuTypeBorderColor = (tipo: string) => {
    switch (tipo) {
      case 'DESAYUNO':
        return 'border-t-yellow-500';
      case 'ALMUERZO':
        return 'border-t-orange-500';
      case 'CENA':
        return 'border-t-purple-500';
      case 'REFRIGERIO':
        return 'border-t-green-500';
      default:
        return 'border-t-gray-500';
    }
  };

  // Función para obtener el color de texto fuerte según el tipo de menú
  const getMenuTypeTextColor = (tipo: string) => {
    switch (tipo) {
      case 'DESAYUNO':
        return 'text-yellow-600';
      case 'ALMUERZO':
        return 'text-orange-600';
      case 'CENA':
        return 'text-purple-600';
      case 'REFRIGERIO':
        return 'text-green-600';
      default:
        return 'text-gray-600';
    }
  };

  // Función para parsear fecha sin timezone (formato YYYY-MM-DD)
  const parseDateWithoutTimezone = (dateString: string): Date => {
    const [year, month, day] = dateString.split('-').map(Number);
    return new Date(year, month - 1, day);
  };

  // Función para formatear la fecha sin conversión de timezone
  const formatDate = (dateString: string) => {
    const date = parseDateWithoutTimezone(dateString);
    return date.toLocaleDateString('es-ES', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Calcular el offset de días entre fecha inicial y fecha de ejecución
  const getEjecucionOffset = () => {
    const inicial = parseDateWithoutTimezone(fechaInicial);
    const ejecucion = parseDateWithoutTimezone(fechaEjecucion);
    const diffTime = ejecucion.getTime() - inicial.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    return Math.max(0, diffDays); // Asegurar que no sea negativo
  };

  // Función para obtener las fechas desde la fecha de ejecución (no antes)
  // Genera noCiclos fechas desde la fecha de ejecución
  const getWeekDates = (startDate: string) => {
    const ejecucionOffset = getEjecucionOffset();
    const inicial = parseDateWithoutTimezone(startDate);
    const ejecucion = parseDateWithoutTimezone(fechaEjecucion);
    const dates = [];

    // Generar noCiclos días consecutivos desde la fecha de ejecución (no desde la inicial)
    // Si la fecha de ejecución es mayor que la inicial, empezar desde la ejecución
    const start = ejecucionOffset > 0 ? ejecucion : inicial;
    
    // Usar noCiclos para generar el número correcto de columnas
    const numCiclos = noCiclos || 7;
    
    for (let i = 0; i < numCiclos; i++) {
      const date = new Date(start);
      date.setDate(start.getDate() + i);
      dates.push(date);
    }

    return dates;
  };

  // Función para obtener la semana de fechas
  const getWeeksGrouped = (startDate: string) => {
    const weekDates = getWeekDates(startDate);

    return [{
      weekNumber: 1,
        dates: weekDates
    }];
  };

  // Función para obtener el nombre del día en español
  const getDayName = (date: Date) => {
    const days = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
    return days[date.getDay()];
  };

  // Función para obtener el nombre del mes en español
  const getMonthName = (date: Date) => {
    const months = ['ene.', 'feb.', 'mar.', 'abr.', 'may.', 'jun.', 'jul.', 'ago.', 'sep.', 'oct.', 'nov.', 'dic.'];
    return months[date.getMonth()];
  };

  // Función para verificar si una fecha es el día actual
  const isToday = (date: Date) => {
    const today = new Date();
    return date.getDate() === today.getDate() &&
           date.getMonth() === today.getMonth() &&
           date.getFullYear() === today.getFullYear();
  };

  const weekDates = getWeekDates(fechaInicial);
  const weeksGrouped = getWeeksGrouped(fechaInicial);
  const ejecucionOffset = getEjecucionOffset();

  // Si tenemos detallemenus transformados (de productosDetalleZona), usarlos
  // Si no, usar detallemenus pasados como prop (fallback) o lógica antigua con unidadesMenus
  const usarDatosTransformados = detallemenusTransformados.length > 0 || (detallemenus && detallemenus.length > 0);
  const detallemenusFinales = detallemenusTransformados.length > 0 ? detallemenusTransformados : detallemenus;
  
  // Debug: Log información del calendario (después de calcular detallemenusFinales)
  useEffect(() => {
    console.log('🔍 Estado del calendario:', {
      usarDatosTransformados,
      detallemenusTransformadosLength: detallemenusTransformados.length,
      detallemenusLength: detallemenus?.length || 0,
      detallemenusFinalesLength: detallemenusFinales.length,
      detallemenusFinales: detallemenusFinales.map(dm => ({
        id_clase: dm.id_clase_servicio,
        nombre_clase: dm.nombre,
        id_componente: dm.id_componente,
        componente: dm.componente,
        ingredientesCount: dm.ingredientes?.length || 0,
        ingredientes: dm.ingredientes?.map(ing => ({ menu: ing.menu, nombre: ing.nombre })) || []
      }))
    });

    if (usarDatosTransformados && detallemenusFinales.length > 0) {
      console.log('📅 Información del calendario:', {
        fechaInicial,
        fechaEjecucion,
        ejecucionOffset,
        weekDatesCount: weekDates.length,
        weekDates: weekDates.map((d, i) => ({ 
          dia: i, 
          fecha: d.toISOString().split('T')[0],
          menuIndex: i,
          numMenu: i + 1,
          esAntesDeEjecucion: false
        })),
        detallemenusFinalesCount: detallemenusFinales.length,
        usarDatosTransformados,
        detallemenusFinales: detallemenusFinales.map(dm => ({
          id_clase: dm.id_clase_servicio,
          nombre_clase: dm.nombre,
          id_componente: dm.id_componente,
          componente: dm.componente,
          ingredientesCount: dm.ingredientes?.length || 0,
          ingredientes: dm.ingredientes?.map(ing => ({ menu: ing.menu, nombre: ing.nombre, tipoMenu: typeof ing.menu })) || []
        }))
      });
    }
  }, [detallemenusFinales, usarDatosTransformados, fechaInicial, fechaEjecucion, ejecucionOffset, weekDates, detallemenusTransformados, detallemenus]);

  // Consolidar todos los menús de todas las unidades en un solo array (solo si no hay datos transformados)
  // Agrupamos por índice de menú (día) para tener todos los menús del mismo día juntos
  // Los menús se asignan desde la fecha de ejecución, no desde la fecha inicial
  const consolidatedMenus = usarDatosTransformados ? [] : weekDates.map((date, dayIndex) => {
    const menusDelDia: MenuItem[] = [];
    
    // Solo asignar menús si el día es igual o posterior a la fecha de ejecución
    if (dayIndex >= ejecucionOffset) {
      const menuIndex = dayIndex - ejecucionOffset;
      
      // Recopilar todos los menús de este índice de todas las unidades
      unidadesMenus.forEach(unidad => {
        if (unidad.menus && unidad.menus[menuIndex]) {
          menusDelDia.push(unidad.menus[menuIndex]);
        }
      });
    }
    
    return menusDelDia;
  });

  return (
    <>
      <style>{`
        /* Estilos personalizados para scrollbar */
        .custom-scrollbar::-webkit-scrollbar {
          height: 12px;
        }
        
        .custom-scrollbar::-webkit-scrollbar-track {
          background: linear-gradient(to right, #f0fdfa, #ccfbf1);
          border-radius: 10px;
          border: 1px solid #99f6e4;
        }
        
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: linear-gradient(135deg, #14b8a6, #06b6d4);
          border-radius: 10px;
          border: 2px solid #f0fdfa;
        }
        
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: linear-gradient(135deg, #0d9488, #0891b2);
        }
        
        .custom-scrollbar::-webkit-scrollbar-thumb:active {
          background: linear-gradient(135deg, #0f766e, #0e7490);
        }
        
        /* Para Firefox */
        .custom-scrollbar {
          scrollbar-width: thin;
          scrollbar-color: #14b8a6 #f0fdfa;
        }
        
        /* Scrollbar superior */
        .top-scroll::-webkit-scrollbar {
          height: 14px;
        }
        
        .top-scroll::-webkit-scrollbar-track {
          background: linear-gradient(to bottom, #e0f2fe, #cffafe);
          border-radius: 8px;
          border: 1px solid #a5f3fc;
          box-shadow: inset 0 1px 3px rgba(0, 0, 0, 0.1);
        }
        
        .top-scroll::-webkit-scrollbar-thumb {
          background: linear-gradient(135deg, #0891b2, #14b8a6);
          border-radius: 8px;
          border: 2px solid #e0f2fe;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }
        
        .top-scroll::-webkit-scrollbar-thumb:hover {
          background: linear-gradient(135deg, #0e7490, #0d9488);
          box-shadow: 0 2px 6px rgba(0, 0, 0, 0.2);
        }
        
        .top-scroll::-webkit-scrollbar-thumb:active {
          background: linear-gradient(135deg, #155e75, #0f766e);
        }
        
        /* Scrollbar de la tabla - OCULTO (solo visible el scroll superior) */
        .table-scroll-container::-webkit-scrollbar {
          display: none; /* Chrome, Safari, Opera */
        }
      `}</style>
      
    <Card className="w-full" style={{ zoom: '0.80' }} >
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CalendarIcon className="w-5 h-5 text-teal-600" />
          Calendario de Menús Detallado - {zonaNombre}
        </CardTitle>
        <div className="text-sm text-gray-600 flex gap-6">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4" />
            Fecha Inicial: {formatDate(fechaInicial)}
          </div>
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-teal-600" />
            <span className="font-semibold">Fecha de Ejecución: {formatDate(fechaEjecucion)}</span>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {cargando ? (
          <div className="text-center py-8">
            <div className="text-gray-500">
              <UtensilsCrossed className="w-12 h-12 mx-auto mb-4 text-gray-300 animate-pulse" />
              <p>Cargando datos del calendario...</p>
            </div>
          </div>
        ) : unidadesMenus.length === 0 && !usarDatosTransformados ? (
          // Mostrar calendario vacío con estructura cuando no hay unidades Y no hay datos transformados
          <div>
            <div className="flex">
              {/* Espacio para columnas fijas */}
              <div style={{ minWidth: '280px' }}></div>
              
              {/* Barra de scroll horizontal arriba - solo para columnas scrolleables */}
              <div 
                className="flex-1 overflow-x-auto border border-gray-300 rounded mb-1 top-scroll" 
                style={{ height: '15px', minHeight: '1px' }}
                onScroll={(e) => {
                  const tableContainer = e.currentTarget.parentElement?.nextElementSibling as HTMLElement;
                  if (tableContainer && !tableContainer.dataset.scrolling) {
                    tableContainer.dataset.scrolling = 'true';
                    tableContainer.scrollLeft = e.currentTarget.scrollLeft;
                    setTimeout(() => delete tableContainer.dataset.scrolling, 0);
                  }
                }}
              >
                <div style={{ width: `calc(${weekDates.length} * 256px)`, height: '1px' }}></div>
            </div>
                </div>

            {/* Contenedor de la tabla - scrollbar oculto visualmente pero funcional */}
            <div 
              className="overflow-x-auto overflow-y-hidden table-scroll-container"
              style={{
                scrollbarWidth: 'none', /* Firefox */
                msOverflowStyle: 'none'  /* IE and Edge */
              }}
              onScroll={(e) => {
                const scrollTop = e.currentTarget.previousElementSibling?.querySelector('.top-scroll') as HTMLElement;
                if (scrollTop && !e.currentTarget.dataset.scrolling) {
                  e.currentTarget.dataset.scrolling = 'true';
                  scrollTop.scrollLeft = e.currentTarget.scrollLeft;
                  setTimeout(() => {
                    if (e.currentTarget) delete e.currentTarget.dataset.scrolling;
                  }, 0);
                }
                
                // Agregar borde a columnas sticky cuando hay scroll
                const stickyColumns = e.currentTarget.querySelectorAll('.sticky-column-shadow');
                if (e.currentTarget.scrollLeft > 0) {
                  stickyColumns.forEach(col => col.classList.add('border-r-4', 'border-r-teal-500'));
                } else {
                  stickyColumns.forEach(col => col.classList.remove('border-r-4', 'border-r-teal-500'));
                }
              }}
            >
                    <table className="w-full border-collapse border border-gray-300">
                      {/* Header de semanas agrupadas */}
                      <thead>
                        <tr className="bg-gray-100">
                  <th className="border border-gray-300 p-2 text-center text-sm font-semibold text-gray-800 sticky left-0 z-10 bg-gray-100 sticky-column-shadow" colSpan={2} style={{ minWidth: '280px' }}>
                    SEMANA ACTUAL
                          </th>
                  <th className="border border-gray-300 p-2 text-center text-sm font-semibold bg-teal-200 text-teal-900" colSpan={7}>
                    SEMANA {weeksGrouped[0].weekNumber}
                              </th>
                        </tr>
                      </thead>

                      {/* Header de días individuales */}
                      <thead>
                        <tr className="bg-gray-50">
                  <th className="border border-gray-300 p-3 text-left text-base font-semibold text-gray-700 sticky left-0 z-10 bg-gray-50 sticky-column-shadow" colSpan={2} style={{ minWidth: '280px' }}>
                            DÍAS
                          </th>
                          {weekDates.map((date, i) => {
                    const isTodayDate = isToday(date);
                            return (
                      <th key={i} className={`border border-gray-300 p-3 text-center text-sm font-semibold whitespace-nowrap ${
                        isTodayDate 
                          ? 'bg-gray-200 text-gray-900 font-bold' 
                          : 'bg-teal-50 text-teal-800'
                      }`}>
                                {`${getDayName(date)} ${date.getDate()}/${getMonthName(date)}`}
                              </th>
                            );
                          })}
                        </tr>
                      </thead>

                      {/* Header de menús individuales */}
                      <thead>
                        <tr className="bg-blue-50">
                  <th className="border border-gray-300 p-2 text-center text-sm font-semibold text-blue-700 sticky left-0 z-10 bg-blue-50 sticky-column-shadow" colSpan={2} style={{ minWidth: '280px' }}>
                            COMPONENTE/MENU
                          </th>
                  {weekDates.map((date, i) => {
                    const isTodayDate = isToday(date);
                    return (
                      <th key={i} className={`border border-gray-300 p-2 text-center text-sm font-semibold w-64 min-w-64 ${
                        isTodayDate 
                          ? 'bg-gray-200 text-gray-900 font-bold' 
                          : 'text-blue-700'
                      }`}>
                        {`Menu ${i + 1}`}
                            </th>
                    );
                  })}
                        </tr>
                      </thead>

                      <tbody>
                {/* Mostrar clases de servicio vacías */}
                        {clasesServicios.length > 0 ? (
                          clasesServicios.map((claseServicio) => {
                            const componentesRelacionados = componentesMenus.filter(
                              comp => comp.id_clase_servicio === claseServicio.id
                            );

                            if (componentesRelacionados.length === 0) {
                              return (
                                <tr key={`clase-${claseServicio.id}`}>
                          <td className={`border border-gray-300 p-3 font-semibold text-xs sticky left-0 z-10 ${getMenuTypeColor(claseServicio.nombre.toUpperCase())}`} rowSpan={1} style={{ minWidth: '140px' }}>
                                    <div className="flex items-center gap-2">
                                      {getMenuIcon(claseServicio.nombre.toUpperCase())}
                                      {claseServicio.nombre.toUpperCase()}
                                    </div>
                                  </td>
                          <td className={`border border-gray-300 p-2 text-center text-xs text-gray-400 sticky z-10 sticky-column-shadow ${getMenuTypeColor(claseServicio.nombre.toUpperCase()).split(' ')[0]}`} style={{ left: '140px', minWidth: '140px' }}>
                                    Sin componentes
                                  </td>
                          {weekDates.map((date, i) => {
                            const isTodayDate = isToday(date);
                            return (
                              <td key={i} className={`border border-gray-300 p-2 text-center text-xs ${
                                isTodayDate ? 'bg-gray-100' : ''
                              }`}>
                                      -
                                    </td>
                            );
                          })}
                                </tr>
                              );
                            }

                            return componentesRelacionados.map((componente, compIndex) => {
                      return (
                        <tr key={`clase-${claseServicio.id}-comp-${componente.id}`} className={compIndex === 0 ? `border-t-[3px] ${getMenuTypeBorderColor(claseServicio.nombre.toUpperCase())}` : ''}>
                          {compIndex === 0 && (
                            <td 
                              className={`border border-gray-300 p-3 font-semibold text-xs sticky left-0 z-10 ${getMenuTypeColor(claseServicio.nombre.toUpperCase())}`} 
                              rowSpan={componentesRelacionados.length}
                              style={{ minWidth: '140px' }}
                            >
                              <div className="flex items-center gap-2">
                                {getMenuIcon(claseServicio.nombre.toUpperCase())}
                                {claseServicio.nombre.toUpperCase()}
                              </div>
                            </td>
                          )}
                          
                          <td className={`border border-gray-300 p-2 text-xs font-medium sticky z-10 ${getMenuTypeColor(claseServicio.nombre.toUpperCase())}`} style={{ left: '140px', minWidth: '140px' }}>
                            {componente.nombre}
                          </td>
                          
                          {weekDates.map((date, i) => {
                            const isTodayDate = isToday(date);
                            const bgColor = getMenuTypeColor(claseServicio.nombre.toUpperCase());
                            return (
                              <td key={i} className={`border border-gray-300 p-2 text-center text-xs w-64 min-w-64 ${
                                isTodayDate ? 'bg-gray-100' : bgColor
                              }`}>
                                -
                              </td>
                            );
                          })}
                        </tr>
                      );
                    });
                  })
                ) : (
                  <tr>
                    <td colSpan={weekDates.length + 2} className="border border-gray-300 p-8 text-center text-gray-500">
                      <div className="flex flex-col items-center gap-2">
                        <UtensilsCrossed className="w-8 h-8 text-gray-300" />
                        <p>No hay clases de servicio configuradas</p>
            </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
            </div>
          </div>
        ) : (
          <div>
            {/* Calendario consolidado de todas las unidades O con datos transformados */}
            {(consolidatedMenus.some(menus => menus.length > 0) || usarDatosTransformados) ? (
              <div>
                    <div className="flex">
                      {/* Espacio para columnas fijas */}
                      <div style={{ minWidth: '280px' }}></div>
                      
                      {/* Barra de scroll horizontal arriba - solo para columnas scrolleables */}
                      <div 
                        className="flex-1 overflow-x-auto border border-gray-300 rounded mb-1 top-scroll" 
                        style={{ height: '1px', minHeight: '1px' }}
                        onScroll={(e) => {
                          const tableContainer = e.currentTarget.parentElement?.nextElementSibling as HTMLElement;
                          if (tableContainer && !tableContainer.dataset.scrolling) {
                            tableContainer.dataset.scrolling = 'true';
                            tableContainer.scrollLeft = e.currentTarget.scrollLeft;
                            setTimeout(() => delete tableContainer.dataset.scrolling, 0);
                          }
                        }}
                      >
                        <div style={{ width: `calc(${weekDates.length} * 256px)`, height: '1px' }}></div>
                      </div>
                    </div>
                    
                    {/* Contenedor de la tabla - scrollbar oculto visualmente pero funcional */}
                    <div 
                      className="overflow-x-auto overflow-y-hidden table-scroll-container"
                      style={{
                        scrollbarWidth: 'none', /* Firefox */
                        msOverflowStyle: 'none'  /* IE and Edge */
                      }}
                      onScroll={(e) => {
                        const scrollTop = e.currentTarget.previousElementSibling?.querySelector('.top-scroll') as HTMLElement;
                        if (scrollTop && !e.currentTarget.dataset.scrolling) {
                          e.currentTarget.dataset.scrolling = 'true';
                          scrollTop.scrollLeft = e.currentTarget.scrollLeft;
                          setTimeout(() => {
                            if (e.currentTarget) delete e.currentTarget.dataset.scrolling;
                          }, 0);
                        }
                        
                        // Agregar borde a columnas sticky cuando hay scroll
                        const stickyColumns = e.currentTarget.querySelectorAll('.sticky-column-shadow');
                        if (e.currentTarget.scrollLeft > 0) {
                          stickyColumns.forEach(col => col.classList.add('border-r-4', 'border-r-teal-500'));
                        } else {
                          stickyColumns.forEach(col => col.classList.remove('border-r-4', 'border-r-teal-500'));
                        }
                      }}
                    >
                      <table className="w-full border-collapse border border-gray-300">
                        {/* Header de semanas agrupadas */}
                        <thead>
                          <tr className="bg-gray-100">
                            <th className="border border-gray-300 p-2 text-center text-sm font-semibold text-gray-800 sticky left-0 z-10 bg-gray-100 sticky-column-shadow" colSpan={2} style={{ minWidth: '280px' }}>
                              SEMANA ACTUAL
                            </th>
                          <th className="border border-gray-300 p-2 text-center text-sm font-semibold bg-teal-200 text-teal-900" colSpan={7}>
                            SEMANA {weeksGrouped[0].weekNumber}
                              </th>
                        </tr>
                      </thead>

                        {/* Header de días individuales */}
                        <thead>
                          <tr className="bg-gray-50">
                            <th className="border border-gray-300 p-3 text-left text-base font-semibold text-gray-700 sticky left-0 z-10 bg-gray-50 sticky-column-shadow" colSpan={2} style={{ minWidth: '280px' }}>
                              DÍAS
                            </th>
                          {weekDates.map((date, i) => {
                            const isTodayDate = isToday(date);
                            return (
                              <th key={i} className={`border border-gray-300 p-3 text-center text-sm font-semibold whitespace-nowrap ${
                                isTodayDate 
                                  ? 'bg-gray-200 text-gray-900 font-bold' 
                                  : 'bg-teal-50 text-teal-800'
                              }`}>
                                {`${getDayName(date)} ${date.getDate()}/${getMonthName(date)}`}
                              </th>
                            );
                          })}
                        </tr>
                      </thead>

                        {/* Header de menús individuales */}
                        <thead>
                          <tr className="bg-blue-50">
                            <th className="border border-gray-300 p-2 text-center text-sm font-semibold text-blue-700 sticky left-0 z-10 bg-blue-50 sticky-column-shadow" colSpan={2} style={{ minWidth: '280px' }}>
                              COMPONENTE/MENU
                            </th>
                          {weekDates.map((date, i) => {
                            const isTodayDate = isToday(date);
                            return (
                              <th key={i} className={`border border-gray-300 p-2 text-center text-sm font-semibold w-64 min-w-64 ${
                                isTodayDate 
                                  ? 'bg-gray-200 text-gray-900 font-bold' 
                                  : 'text-blue-700'
                              }`}>
                              {`Menu ${i + 1}`}
                            </th>
                            );
                          })}
                        </tr>
                      </thead>

                      <tbody>
                        {/* Mostrar menús organizados por clase de servicio y componentes */}
                        {(() => {
                          // Debug: Log del estado antes de renderizar
                          console.log('🎨 Renderizando tabla:', {
                            clasesServiciosLength: clasesServicios.length,
                            usarDatosTransformados,
                            detallemenusFinalesLength: detallemenusFinales.length,
                            detallemenusTransformadosLength: detallemenusTransformados.length,
                            detallemenusLength: detallemenus?.length || 0
                          });
                          return null;
                        })()}
                        {clasesServicios.length > 0 ? (
                          clasesServicios.map((claseServicio) => {
                            // Si tenemos datos transformados, obtener componentes que tienen datos en detallemenus para esta clase
                            // Si no, obtener componentes relacionados con esta clase de servicio de la lista general
                            let componentesRelacionados: Array<{componente: ComponenteMenu; detalleMenu: DetalleMenu | undefined}> = [];
                            
                            if (usarDatosTransformados) {
                              console.log(`🎯 Renderizando clase ${claseServicio.nombre} (ID: ${claseServicio.id}) con datos transformados`);
                              // Debug: Log antes de filtrar
                              console.log(`🔍 Buscando detallemenus para clase ${claseServicio.nombre} (ID: ${claseServicio.id}):`, {
                                detallemenusFinalesTotal: detallemenusFinales.length,
                                detallemenusFinales: detallemenusFinales.map(dm => ({
                                  id_clase: dm.id_clase_servicio,
                                  nombre_clase: dm.nombre,
                                  id_componente: dm.id_componente,
                                  componente: dm.componente
                                }))
                              });
                              
                              // Obtener TODOS los detallemenus que pertenecen a esta clase de servicio
                              const detallemenusDeEstaClase = detallemenusFinales.filter(
                                dm => dm.id_clase_servicio === claseServicio.id
                              );
                              
                              console.log(`✅ Detallemenus encontrados para clase ${claseServicio.nombre} (ID: ${claseServicio.id}): ${detallemenusDeEstaClase.length}`, {
                                detallemenus: detallemenusDeEstaClase.map(dm => ({
                                  id_clase: dm.id_clase_servicio,
                                  nombre_clase: dm.nombre,
                                  id_componente: dm.id_componente,
                                  componente: dm.componente,
                                  ingredientesCount: dm.ingredientes?.length || 0,
                                  ingredientes: dm.ingredientes?.map(ing => ({ menu: ing.menu, nombre: ing.nombre })) || []
                                }))
                              });
                              
                              // Crear pares de componente y detalleMenu directamente desde los detallemenus
                              componentesRelacionados = detallemenusDeEstaClase.map(dm => {
                                // Buscar el componente en la lista general para obtener toda su información
                                const comp = componentesMenus.find(c => c.id === dm.id_componente);
                                const componenteInfo = comp || {
                                  id: dm.id_componente,
                                  nombre: dm.componente,
                                  id_clase_servicio: dm.id_clase_servicio
                                } as ComponenteMenu;
                                
                                return {
                                  componente: componenteInfo,
                                  detalleMenu: dm
                                };
                              });
                              
                              // Si no hay componentes con datos para esta clase, usar los componentes de la lista general
                              if (componentesRelacionados.length === 0) {
                                componentesRelacionados = componentesMenus
                                  .filter(comp => comp.id_clase_servicio === claseServicio.id)
                                  .map(comp => ({
                                    componente: comp,
                                    detalleMenu: undefined
                                  }));
                              }
                              
                              // Ordenar por id del componente para mantener consistencia
                              componentesRelacionados.sort((a, b) => a.componente.id - b.componente.id);
                              
                              // Debug: Log componentes relacionados para todas las clases
                              console.log(`🔍 Componentes relacionados para clase ${claseServicio.nombre} (${claseServicio.id}):`, {
                                componentes: componentesRelacionados.map(item => ({ 
                                  id: item.componente.id, 
                                  nombre: item.componente.nombre, 
                                  id_clase: item.componente.id_clase_servicio,
                                  tieneDetalleMenu: !!item.detalleMenu,
                                  tieneIngredientes: item.detalleMenu ? (item.detalleMenu.ingredientes?.length || 0) > 0 : false,
                                  ingredientes: item.detalleMenu ? item.detalleMenu.ingredientes.map(ing => ({ menu: ing.menu, nombre: ing.nombre })) : []
                                })),
                                detallemenusCount: detallemenusDeEstaClase.length,
                                detallemenusDeEstaClase: detallemenusDeEstaClase.map(dm => ({
                                  id_clase: dm.id_clase_servicio,
                                  id_componente: dm.id_componente,
                                  componente: dm.componente,
                                  ingredientes: dm.ingredientes.map(ing => ({ menu: ing.menu, nombre: ing.nombre }))
                                  }))
                                });
                            } else {
                              // Obtener componentes relacionados con esta clase de servicio
                              componentesRelacionados = componentesMenus
                                .filter(comp => comp.id_clase_servicio === claseServicio.id)
                                .map(comp => ({
                                  componente: comp,
                                  detalleMenu: undefined
                                }));
                            }

                            // Si no hay componentes, mostrar solo la clase de servicio
                            if (componentesRelacionados.length === 0) {
                              return (
                                <tr key={`clase-${claseServicio.id}`}>
                                  <td className={`border border-gray-300 p-3 font-semibold text-xs sticky left-0 z-10 ${getMenuTypeColor(claseServicio.nombre.toUpperCase())}`} rowSpan={1} style={{ minWidth: '140px' }}>
                                    <div className="flex items-center gap-2">
                                      {getMenuIcon(claseServicio.nombre.toUpperCase())}
                                      {claseServicio.nombre.toUpperCase()}
                                    </div>
                                  </td>
                                  <td className={`border border-gray-300 p-2 text-center text-xs text-gray-400 sticky z-10 sticky-column-shadow ${getMenuTypeColor(claseServicio.nombre.toUpperCase()).split(' ')[0]}`} style={{ left: '140px', minWidth: '140px' }}>
                                    Sin componentes
                                  </td>
                                  {weekDates.map((date, i) => {
                                    const isTodayDate = isToday(date);
                                    const esAntesDeLaEjecucion = i < ejecucionOffset;
                                    return (
                                      <td key={i} className={`border border-gray-300 p-2 text-center text-xs ${
                                        isTodayDate ? 'bg-gray-100' : ''
                                      }`}>
                                      {esAntesDeLaEjecucion ? '' : '-'}
                                      </td>
                                    );
                                  })}
                                </tr>
                              );
                            }

                            // Mostrar cada componente en una fila
                            return componentesRelacionados.map((item, compIndex) => {
                              const componente = item.componente;
                              const detalleMenu = item.detalleMenu;
                              
                              // Debug: Log detalleMenu para todos los componentes que tienen datos
                              if (detalleMenu && detalleMenu.ingredientes && detalleMenu.ingredientes.length > 0) {
                                console.log(`✅ detalleMenu encontrado para componente ${componente.id} (${componente.nombre}) en clase ${claseServicio.nombre}:`, {
                                  id_clase_servicio: detalleMenu.id_clase_servicio,
                                  nombre_clase: detalleMenu.nombre,
                                  id_componente: detalleMenu.id_componente,
                                  componente: detalleMenu.componente,
                                  ingredientesCount: detalleMenu.ingredientes?.length || 0,
                                  ingredientes: detalleMenu.ingredientes.map(ing => ({ menu: ing.menu, nombre: ing.nombre, tipoMenu: typeof ing.menu }))
                                });
                              } else if (usarDatosTransformados && !detalleMenu && compIndex === 0) {
                                console.warn(`⚠️ No se encontró detalleMenu para componente ${componente.id} (${componente.nombre}) en clase ${claseServicio.nombre} (${claseServicio.id})`);
                              }

                              // Si no hay datos transformados, usar la lógica antigua
                              const recetasDeClase = usarDatosTransformados ? [] : consolidatedMenus.map(menusDelDia => 
                                menusDelDia.find(menu => menu.tipo.toUpperCase() === claseServicio.nombre.toUpperCase())
                              ).filter((menu): menu is MenuItem => menu !== undefined);

                              return (
                                <tr key={`clase-${claseServicio.id}-comp-${componente.id}`} className={compIndex === 0 ? `border-t-[3px] ${getMenuTypeBorderColor(claseServicio.nombre.toUpperCase())}` : ''}>
                                  {/* Primera subcolumna: Clase de Servicio (solo en la primera fila de componente) */}
                                  {compIndex === 0 && (
                                    <td 
                                      className={`border border-gray-300 p-3 font-semibold text-xs sticky left-0 z-10 ${getMenuTypeColor(claseServicio.nombre.toUpperCase())}`} 
                                      rowSpan={componentesRelacionados.length}
                                      style={{ minWidth: '140px' }}
                                    >
                                      <div className="flex items-center gap-2">
                                        {getMenuIcon(claseServicio.nombre.toUpperCase())}
                                        {claseServicio.nombre.toUpperCase()}
                                      </div>
                                    </td>
                                  )}
                                  
                                  {/* Segunda subcolumna: Componente de menú */}
                                  <td className={`border border-gray-300 p-2 text-xs font-medium sticky z-10 sticky-column-shadow ${getMenuTypeColor(claseServicio.nombre.toUpperCase())}`} style={{ left: '140px', minWidth: '140px' }}>
                                    {componente.nombre}
                                  </td>
                                  
                                  {/* Columnas de días: Mostrar ingredientes del componente correspondiente */}
                                  {weekDates.map((date, i) => {
                                    // Obtener el color de fondo de la clase de servicio
                                    const bgColor = getMenuTypeColor(claseServicio.nombre.toUpperCase());
                                    const isTodayDate = isToday(date);

                                    // Calcular el índice del menú (todas las fechas son desde la ejecución)
                                    // El primer día (i === 0) tiene menuIndex = 0 (menú 1)
                                    // El número del menú es i + 1 (1-indexed)
                                    const numMenu = i + 1;

                                    // Si tenemos datos transformados, usar detallemenus
                                    if (usarDatosTransformados && detalleMenu) {
                                      // Debug: Log detallado para el primer día y componente con ingredientes
                                      if (i === 0 && detalleMenu.ingredientes && detalleMenu.ingredientes.length > 0) {
                                        console.log(`🔍 [DIA ${i}] Buscando ingredientes para:`, {
                                          componente: detalleMenu.componente,
                                          id_componente: detalleMenu.id_componente,
                                          id_clase: detalleMenu.id_clase_servicio,
                                          numMenu: numMenu,
                                          totalIngredientes: detalleMenu.ingredientes.length,
                                          ingredientes: detalleMenu.ingredientes.map(ing => ({ menu: ing.menu, nombre: ing.nombre }))
                                        });
                                      }

                                      // Buscar ingredientes que correspondan a este menú
                                      // La estructura ahora es: { ingredientes: [{ menu, nombre, ... }, ...] }
                                      // Asegurar que ambos valores sean del mismo tipo (número) para la comparación
                                      const ingredientesDelMenu = detalleMenu.ingredientes?.filter(ing => {
                                        const ingMenu = typeof ing.menu === 'string' ? parseInt(ing.menu, 10) : Number(ing.menu);
                                        const numMenuNum = typeof numMenu === 'string' ? parseInt(numMenu, 10) : Number(numMenu);
                                        const matches = ingMenu === numMenuNum;
                                        
                                        // Debug detallado para el primer día
                                        if (i === 0 && detalleMenu.ingredientes && detalleMenu.ingredientes.length > 0) {
                                          console.log(`🔍 Comparando ingrediente:`, {
                                            ingMenu: ingMenu,
                                            ingMenuType: typeof ingMenu,
                                            numMenuNum: numMenuNum,
                                            numMenuNumType: typeof numMenuNum,
                                            matches: matches,
                                            ingNombre: ing.nombre
                                          });
                                        }
                                        
                                        return matches;
                                      }) || [];

                                      // Debug: Log cuando encontramos ingredientes
                                      if (ingredientesDelMenu.length > 0) {
                                        console.log(`✅ [DIA ${i}] Ingredientes encontrados para menú ${numMenu} en componente ${detalleMenu.componente}:`, ingredientesDelMenu.map(ing => ing.nombre));
                                      }

                                      if (ingredientesDelMenu.length > 0) {
                                        return (
                                          <td key={i} className={`border border-gray-300 p-2 text-xs w-64 min-w-64 ${
                                            isTodayDate ? 'bg-gray-100' : bgColor
                                          }`}>
                                            <div className="text-center p-2 space-y-2">
                                              {ingredientesDelMenu.map((ing, ingIndex) => (
                                                <div key={ingIndex} className={ingIndex > 0 ? 'border-t border-gray-200 pt-2 mt-2' : ''}>
                                                  <div className="font-semibold text-gray-900 text-sm">
                                                    {ing.nombre || 'Sin nombre'}
                                                  </div>
                                                  {ing.cantidad && ing.medida && (
                                                    <div className="text-xs text-gray-600 mt-1">
                                                      {ing.cantidad} {ing.medida}
                                                    </div>
                                                  )}
                                                </div>
                                              ))}
                                            </div>
                                          </td>
                                        );
                                      }
                                      
                                      // Debug: Log cuando no se encuentran ingredientes para este menú
                                      if (i === ejecucionOffset && detalleMenu.ingredientes && detalleMenu.ingredientes.length > 0) {
                                        console.warn(`⚠️ [DIA ${i}] No se encontraron ingredientes para menú ${numMenu} en componente ${detalleMenu.componente}. Ingredientes disponibles:`, 
                                          detalleMenu.ingredientes.map(ing => ({ menu: ing.menu, nombre: ing.nombre }))
                                        );
                                      }
                                      
                                      // Si no hay ingrediente para este menú, mostrar guión
                                      return (
                                        <td key={i} className={`border border-gray-300 p-2 text-center text-xs w-64 min-w-64 ${
                                          isTodayDate ? 'bg-gray-100' : bgColor
                                        }`}>
                                          -
                                        </td>
                                      );
                                    }
                                    
                                    // Si no se encuentra detalleMenu, mostrar celda vacía o guión
                                    if (usarDatosTransformados && !detalleMenu) {
                                      // Debug: Log cuando no se encuentra detalleMenu (solo para el primer día y componente)
                                      if (i === 0 && compIndex === 0) {
                                        console.warn(`⚠️ [DIA ${i}] No se encontró detalleMenu para componente ${componente.id} (${componente.nombre}) en clase ${claseServicio.id} (${claseServicio.nombre})`);
                                        console.log('🔍 Buscando componente:', {
                                          componenteId: componente.id,
                                          componenteNombre: componente.nombre,
                                          componenteIdClase: componente.id_clase_servicio,
                                          claseServicioId: claseServicio.id,
                                          claseServicioNombre: claseServicio.nombre
                                        });
                                        console.log('🔍 Detallemenus disponibles:', detallemenusFinales.map(dm => ({
                                          id_clase: dm.id_clase_servicio,
                                          nombre_clase: dm.nombre,
                                          id_componente: dm.id_componente,
                                          componente: dm.componente,
                                          tieneIngredientes: (dm.ingredientes?.length || 0) > 0,
                                          ingredientes: dm.ingredientes || []
                                        })));
                                      }
                                      return (
                                        <td key={i} className={`border border-gray-300 p-2 text-center text-xs w-64 min-w-64 ${
                                          isTodayDate ? 'bg-gray-100' : bgColor
                                        }`}>
                                          -
                                        </td>
                                      );
                                    }

                                    // Lógica antigua (si no hay datos transformados)
                                    if (!usarDatosTransformados && i < recetasDeClase.length) {
                                      const receta = recetasDeClase[i];
                                      
                                      // Filtrar los ingredientes de esta receta específica que pertenecen a este componente
                                      const ingredientesDelComponente = receta.ingredientes_detallados?.filter(
                                        ing => ing.nombre_componente_menu === componente.nombre
                                      ) || [];

                                      // Si esta receta tiene ingredientes para este componente, mostrarlos
                                      if (ingredientesDelComponente.length > 0) {
                                        return (
                                          <td key={i} className={`border border-gray-300 p-1 text-xs w-64 min-w-64 ${
                                            isTodayDate ? 'bg-gray-100' : bgColor
                                          }`}>
                                            {ingredientesDelComponente.map((ingrediente, idx) => (
                                              <div 
                                                key={idx}
                                                className={`text-center font-semibold p-1 mb-1 last:mb-0 ${getMenuTypeTextColor(claseServicio.nombre.toUpperCase())}`}
                                                style={{ fontSize: '1rem' }}
                                                title={`${ingrediente.nombre} (${ingrediente.cantidad})`}>
                                                {ingrediente.nombre}
                                              </div>
                                            ))}
                                          </td>
                                        );
                                      }
                                    }

                                    // Si no hay receta asignada para este menú o no hay ingredientes para este componente, celda vacía
                                    return (
                                      <td key={i} className={`border border-gray-300 p-2 text-center text-xs w-64 min-w-64 ${
                                        isTodayDate ? 'bg-gray-100' : bgColor
                                      }`}>
                                        -
                                      </td>
                                    );
                                  })}
                                </tr>
                              );
                            });
                          })
                        ) : (
                          // Mostrar mensaje cuando no hay clases de servicio
                          <tr>
                            <td colSpan={weekDates.length + 2} className="border border-gray-300 p-8 text-center text-gray-500">
                              <div className="flex flex-col items-center gap-2">
                                <UtensilsCrossed className="w-8 h-8 text-gray-300" />
                                <p>No hay clases de servicio configuradas</p>
                              </div>
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <UtensilsCrossed className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                <p>No hay menús asignados para esta zona</p>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
    </>
  );
};

export default MenuCalendarDetailed;
