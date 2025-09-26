import React from 'react';
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

interface MenuItem {
  id: number;
  nombre: string;
  tipo: 'DESAYUNO' | 'ALMUERZO' | 'CENA' | 'REFRIGERIO';
  codigo: string;
  ingredientes: string[];
}

interface UnitMenu {
  unidad_id: number;
  unidad_nombre: string;
  fecha_inicio: string;
  menus: MenuItem[];
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
  // Debug: Log de datos recibidos
  console.log('📅 MenuCalendarDetailed recibió:', {
    zonaId,
    zonaNombre,
    fechaEjecucion,
    unidadesCount: unidadesMenus.length,
    unidades: unidadesMenus.map(unidad => ({
      id: unidad.unidad_id,
      nombre: unidad.unidad_nombre,
      menusCount: unidad.menus.length,
      menus: unidad.menus.map(menu => ({
        id: menu.id,
        nombre: menu.nombre,
        tipo: menu.tipo,
        ingredientes: menu.ingredientes
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

  // Función para formatear la fecha
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Función para obtener las fechas de 4 semanas (28 días)
  const getWeekDates = (startDate: string) => {
    const start = new Date(startDate);
    const dates = [];
    
    // Ajustar al lunes de la semana actual
    const dayOfWeek = start.getDay();
    const daysToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    const mondayStart = new Date(start);
    mondayStart.setDate(start.getDate() + daysToMonday);
    
    // Generar 28 días (4 semanas)
    for (let i = 0; i < 28; i++) {
      const date = new Date(mondayStart);
      date.setDate(mondayStart.getDate() + i);
      dates.push(date);
    }
    
    return dates;
  };

  // Función para obtener las semanas agrupadas
  const getWeeksGrouped = (startDate: string) => {
    const start = new Date(startDate);
    const weeks = [];
    let currentWeekStart = new Date(start);
    
    // Ajustar al lunes de la semana actual
    const dayOfWeek = start.getDay();
    const daysToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    currentWeekStart.setDate(start.getDate() + daysToMonday);
    
    let weekNumber = 1;
    
    // Generar 4 semanas (28 días)
    for (let week = 0; week < 4; week++) {
      const weekDates = [];
      for (let day = 0; day < 7; day++) {
        const date = new Date(currentWeekStart);
        date.setDate(currentWeekStart.getDate() + (week * 7) + day);
        weekDates.push(date);
      }
      weeks.push({
        weekNumber: weekNumber++,
        dates: weekDates
      });
    }
    
    return weeks;
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

  const weekDates = getWeekDates(fechaEjecucion);
  const weeksGrouped = getWeeksGrouped(fechaEjecucion);

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CalendarIcon className="w-5 h-5 text-teal-600" />
          Calendario de Menús Detallado - {zonaNombre}
        </CardTitle>
        <div className="text-sm text-gray-600">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4" />
            Inicio: {formatDate(fechaEjecucion)}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {unidadesMenus.length === 0 ? (
          <div className="text-center py-8">
            <div className="text-gray-500">
              <UtensilsCrossed className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p>No hay unidades de servicio asignadas a esta zona</p>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {unidadesMenus.map((unidad, index) => (
              <div key={unidad.unidad_id} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-4">
                  <MapPin className="w-4 h-4 text-blue-500" />
                  <h3 className="font-semibold text-gray-800">
                    {unidad.unidad_nombre}
                  </h3>
                  <Badge variant="outline" className="ml-auto">
                    Inicio: {formatDate(unidad.fecha_inicio)}
                  </Badge>
                </div>

                {unidad.menus.length === 0 ? (
                  <div className="text-center py-4 text-gray-500">
                    <p>No hay menús asignados a esta unidad</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                     <table className="w-full border-collapse border border-gray-300">
                       {/* Header de semanas agrupadas */}
                       <thead>
                         <tr className="bg-gray-100">
                           <th className="border border-gray-300 p-2 text-center text-xs font-semibold text-gray-800" colSpan={2}>
                             SEMANAS
                           </th>
                           {weeksGrouped.map((week, weekIndex) => {
                             const weekColors = [
                               'bg-blue-200 text-blue-900',
                               'bg-green-200 text-green-900', 
                               'bg-purple-200 text-purple-900',
                               'bg-orange-200 text-orange-900'
                             ];
                             return (
                               <th key={weekIndex} className={`border border-gray-300 p-2 text-center text-xs font-semibold ${weekColors[weekIndex]}`} colSpan={7}>
                                 SEMANA {week.weekNumber}
                               </th>
                             );
                           })}
                         </tr>
                       </thead>

                       {/* Header de días individuales */}
                       <thead>
                         <tr className="bg-gray-50">
                           <th className="border border-gray-300 p-3 text-left text-sm font-semibold text-gray-700" colSpan={2}>
                             DÍAS
                           </th>
                           {weekDates.map((date, i) => {
                             const weekIndex = Math.floor(i / 7);
                             const dayColors = [
                               'bg-blue-100 text-blue-800',
                               'bg-green-100 text-green-800', 
                               'bg-purple-100 text-purple-800',
                               'bg-orange-100 text-orange-800'
                             ];
                             return (
                               <th key={i} className={`border border-gray-300 p-3 text-center text-xs font-semibold whitespace-nowrap ${dayColors[weekIndex]}`}>
                                 {`${getDayName(date)} ${date.getDate()}/${getMonthName(date)}`}
                               </th>
                             );
                           })}
                         </tr>
                       </thead>

                       {/* Header de menús individuales */}
                       <thead>
                         <tr className="bg-blue-50">
                           <th className="border border-gray-300 p-2 text-center text-xs font-semibold text-blue-700" colSpan={2}>
                             COMPONENTE/MENU
                           </th>
                           {weekDates.map((date, i) => (
                             <th key={i} className="border border-gray-300 p-2 text-center text-xs font-semibold text-blue-700 w-64 min-w-64">
                               Menu {i + 1}
                             </th>
                           ))}
                         </tr>
                       </thead>

                      <tbody>
                        {/* Mostrar menús organizados por fecha */}
                        {unidad.menus.length > 0 ? (
                          // Mostrar cada menú individualmente
                          unidad.menus.map((menu, menuIndex) => (
                            <React.Fragment key={`menu-${menu.id}-${menuIndex}`}>
                              {/* Fila del menú */}
                              <tr>
                                <td className={`border border-gray-300 p-3 font-semibold text-xs ${getMenuTypeColor(menu.tipo.toUpperCase())}`}>
                                  <div className="flex items-center gap-2">
                                    {getMenuIcon(menu.tipo.toUpperCase())}
                                    {menu.tipo.toUpperCase()}
                                  </div>
                                </td>
                                 <td className={`border border-gray-300 p-2 text-center text-xs font-medium w-48 min-w-48 ${getMenuTypeColor(menu.tipo.toUpperCase())}`}>
                                   {menu.nombre}
                                 </td>
                                 {weekDates.map((date, i) => {
                                   // Mostrar ingredientes solo en la columna correspondiente al orden del menú
                                   // Para 28 días, distribuimos los menús cíclicamente
                                   const menuIndexForDay = menuIndex % unidad.menus.length;
                                   const weekIndex = Math.floor(i / 7);
                                   const weekBackgroundColors = [
                                     'bg-blue-50',
                                     'bg-green-50', 
                                     'bg-purple-50',
                                     'bg-orange-50'
                                   ];
                                   
                                   if (i === menuIndexForDay || (unidad.menus.length === 1 && i === menuIndex)) {
                                     return (
                                       <td key={i} className={`border border-gray-300 p-0 text-xs w-64 min-w-64 ${weekBackgroundColors[weekIndex]}`}>
                                        <div className="flex flex-col h-full">
                                          {menu.ingredientes.map((ingrediente, ingredienteIndex) => (
                                            <div 
                                              key={ingredienteIndex}
                                              className={`flex-1 p-2 border-b border-gray-300 last:border-b-0 ${getMenuTypeColor(menu.tipo.toUpperCase())} text-center font-medium text-xs`}
                                              style={{ fontSize: '0.65rem' }}
                                              title={ingrediente}
                                            >
                                              {ingrediente}
                                            </div>
                                          ))}
                                        </div>
                                      </td>
                                    );
                                  } else {
                                    // Columnas vacías para otros días
                                    return (
                                       <td key={i} className={`border border-gray-300 p-2 text-center text-xs w-64 min-w-64 ${weekBackgroundColors[weekIndex]}`}>
                                         -
                                       </td>
                                    );
                                  }
                                })}
                              </tr>
                            </React.Fragment>
                          ))
                        ) : (
                          // Mostrar mensaje cuando no hay menús
                          <tr>
                            <td colSpan={weekDates.length + 2} className="border border-gray-300 p-8 text-center text-gray-500">
                              <div className="flex flex-col items-center gap-2">
                                <UtensilsCrossed className="w-8 h-8 text-gray-300" />
                                <p>No hay menús asignados a esta unidad</p>
                              </div>
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default MenuCalendarDetailed;
