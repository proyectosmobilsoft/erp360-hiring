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

interface MenuCalendarDetailedProps {
  zonaId: string;
  zonaNombre: string;
  fechaEjecucion: string;
  unidadesMenus: UnitMenu[];
}

const MenuCalendarDetailed: React.FC<MenuCalendarDetailedProps> = ({
  zonaId,
  zonaNombre,
  fechaEjecucion,
  unidadesMenus
}) => {
  const [clasesServicios, setClasesServicios] = useState<ClaseServicio[]>([]);
  const [componentesMenus, setComponentesMenus] = useState<ComponenteMenu[]>([]);
  const [cargando, setCargando] = useState(true);

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

  // Función para obtener las fechas de 7 días consecutivos desde la fecha de ejecución
  const getWeekDates = (startDate: string) => {
    const dates = [];
    const start = parseDateWithoutTimezone(startDate);

    // Generar exactamente 7 días consecutivos desde la fecha de inicio
    for (let i = 0; i < 7; i++) {
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

  const weekDates = getWeekDates(fechaEjecucion);
  const weeksGrouped = getWeeksGrouped(fechaEjecucion);

  // Consolidar todos los menús de todas las unidades en un solo array
  // Agrupamos por índice de menú (día) para tener todos los menús del mismo día juntos
  const consolidatedMenus = weekDates.map((date, dayIndex) => {
    const menusDelDia: MenuItem[] = [];
    
    // Recopilar todos los menús de este índice de todas las unidades
    unidadesMenus.forEach(unidad => {
      if (unidad.menus && unidad.menus[dayIndex]) {
        menusDelDia.push(unidad.menus[dayIndex]);
      }
    });
    
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
        
        /* Scrollbar de la tabla */
        .table-scroll-container::-webkit-scrollbar {
          height: 10px;
        }
        
        .table-scroll-container::-webkit-scrollbar-track {
          background: linear-gradient(to right, #f0fdfa, #ccfbf1);
          border-radius: 8px;
          border: 1px solid #99f6e4;
        }
        
        .table-scroll-container::-webkit-scrollbar-thumb {
          background: linear-gradient(135deg, #14b8a6, #06b6d4);
          border-radius: 8px;
          border: 2px solid #f0fdfa;
        }
        
        .table-scroll-container::-webkit-scrollbar-thumb:hover {
          background: linear-gradient(135deg, #0d9488, #0891b2);
        }
        
        .table-scroll-container::-webkit-scrollbar-thumb:active {
          background: linear-gradient(135deg, #0f766e, #0e7490);
        }
      `}</style>
      
      <Card className="w-full" style={{ zoom: '0.80' }} >
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CalendarIcon className="w-5 h-5 text-teal-600" />
            Calendario de Menús Detallado - {zonaNombre}
          </CardTitle>
        <div className="text-sm text-gray-600">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4" />
            Fecha de Ejecucion: {formatDate(fechaEjecucion)}
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
        ) : unidadesMenus.length === 0 ? (
          // Mostrar calendario vacío con estructura cuando no hay unidades
          <div>
            <div className="flex">
              {/* Espacio para columnas fijas */}
              <div style={{ minWidth: '280px' }}></div>
              
              {/* Barra de scroll horizontal arriba - solo para columnas scrolleables */}
              <div 
                className="flex-1 overflow-x-auto border border-gray-300 rounded mb-1 top-scroll" 
                style={{ height: '20px' }}
                onScroll={(e) => {
                  const tableContainer = e.currentTarget.parentElement?.nextElementSibling as HTMLElement;
                  if (tableContainer && !tableContainer.dataset.scrolling) {
                    tableContainer.dataset.scrolling = 'true';
                    tableContainer.scrollLeft = e.currentTarget.scrollLeft;
                    setTimeout(() => delete tableContainer.dataset.scrolling, 0);
                  }
                }}
              >
                <div style={{ width: 'calc(7 * 256px)', height: '1px' }}></div>
              </div>
            </div>
            
            {/* Contenedor de la tabla con scroll sincronizado */}
            <div 
              className="overflow-x-scroll overflow-y-hidden table-scroll-container" 
              onScroll={(e) => {
                const scrollTop = e.currentTarget.previousElementSibling?.querySelector('.top-scroll') as HTMLElement;
                if (scrollTop && !e.currentTarget.dataset.scrolling) {
                  e.currentTarget.dataset.scrolling = 'true';
                  scrollTop.scrollLeft = e.currentTarget.scrollLeft;
                  setTimeout(() => delete e.currentTarget.dataset.scrolling, 0);
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
                        Menu {i + 1}
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
            {/* Calendario consolidado de todas las unidades */}
            {consolidatedMenus.some(menus => menus.length > 0) ? (
              <div>
                    <div className="flex">
                      {/* Espacio para columnas fijas */}
                      <div style={{ minWidth: '280px' }}></div>
                      
                      {/* Barra de scroll horizontal arriba - solo para columnas scrolleables */}
                      <div 
                        className="flex-1 overflow-x-auto border border-gray-300 rounded mb-1 top-scroll" 
                        style={{ height: '20px' }}
                        onScroll={(e) => {
                          const tableContainer = e.currentTarget.parentElement?.nextElementSibling as HTMLElement;
                          if (tableContainer && !tableContainer.dataset.scrolling) {
                            tableContainer.dataset.scrolling = 'true';
                            tableContainer.scrollLeft = e.currentTarget.scrollLeft;
                            setTimeout(() => delete tableContainer.dataset.scrolling, 0);
                          }
                        }}
                      >
                        <div style={{ width: 'calc(7 * 256px)', height: '1px' }}></div>
                      </div>
                    </div>
                    
                    {/* Contenedor de la tabla con scroll sincronizado */}
                    <div 
                      className="overflow-x-scroll overflow-y-hidden table-scroll-container" 
                      onScroll={(e) => {
                        const scrollTop = e.currentTarget.previousElementSibling?.querySelector('.top-scroll') as HTMLElement;
                        if (scrollTop && !e.currentTarget.dataset.scrolling) {
                          e.currentTarget.dataset.scrolling = 'true';
                          scrollTop.scrollLeft = e.currentTarget.scrollLeft;
                          setTimeout(() => delete e.currentTarget.dataset.scrolling, 0);
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
                              Menu {i + 1}
                            </th>
                            );
                          })}
                        </tr>
                      </thead>

                      <tbody>
                        {/* Mostrar menús organizados por clase de servicio y componentes */}
                        {clasesServicios.length > 0 ? (
                          clasesServicios.map((claseServicio) => {
                            // Obtener componentes relacionados con esta clase de servicio
                            const componentesRelacionados = componentesMenus.filter(
                              comp => comp.id_clase_servicio === claseServicio.id
                            );

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

                            // Mostrar cada componente en una fila
                            return componentesRelacionados.map((componente, compIndex) => {
                              // Obtener las recetas que corresponden a esta clase de servicio de cada día
                              // consolidatedMenus es un array de arrays: [[menusDelDia0], [menusDelDia1], ...]
                              const recetasDeClase = consolidatedMenus.map(menusDelDia => 
                                menusDelDia.find(menu => menu.tipo.toUpperCase() === claseServicio.nombre.toUpperCase())
                              ).filter((menu): menu is MenuItem => menu !== undefined);

                              // Log para debug
                              if (compIndex === 0) {
                                console.log(`🔎 Buscando recetas para ${claseServicio.nombre} (consolidado):`, {
                                  claseServicio: claseServicio.nombre,
                                  diasConMenus: consolidatedMenus.map((menusDelDia, i) => ({
                                    dia: i + 1,
                                    totalMenus: menusDelDia.length,
                                    menus: menusDelDia.map(m => ({ 
                                      nombre: m.nombre, 
                                      tipo: m.tipo 
                                    }))
                                  })),
                                  recetasEncontradas: recetasDeClase.length,
                                  recetas: recetasDeClase.map(r => ({ 
                                    nombre: r.nombre, 
                                    tipo: r.tipo, 
                                    ingredientes_count: r.ingredientes_detallados?.length || 0
                                  }))
                                });
                              }

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

                                    // Verificar si hay una receta asignada para este menú (índice i corresponde a Menu 1, Menu 2, etc.)
                                    // Solo mostramos ingredientes si el índice i es menor que la cantidad de recetas
                                    if (i < recetasDeClase.length) {
                                      const receta = recetasDeClase[i];
                                      
                                      // Filtrar los ingredientes de esta receta específica que pertenecen a este componente
                                      // NOTA: Filtramos por NOMBRE del componente en lugar de ID porque el mismo componente
                                      // (ej: PROTEICO, FRUTA) puede tener diferentes IDs para diferentes clases de servicio
                                      const ingredientesDelComponente = receta.ingredientes_detallados?.filter(
                                        ing => ing.nombre_componente_menu === componente.nombre
                                      ) || [];

                                      // Debug log para ver qué ingredientes se están procesando
                                      if (i === 0 && ingredientesDelComponente.length > 0) {
                                        console.log(`🔍 Menu ${i + 1} - Componente ${componente.nombre} para clase ${claseServicio.nombre}:`, {
                                          receta: receta.nombre,
                                          ingredientes: ingredientesDelComponente.map(ing => ({
                                            nombre: ing.nombre,
                                            componente: ing.nombre_componente_menu,
                                            cantidad: ing.cantidad
                                          }))
                                        });
                                      }

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
