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
  Package
} from 'lucide-react';

interface MenuItem {
  id: number;
  nombre: string;
  tipo: 'DESAYUNO' | 'ALMUERZO' | 'CENA' | 'REFRIGERIO';
  codigo: string;
}

interface UnitMenu {
  unidad_id: number;
  unidad_nombre: string;
  fecha_inicio: string;
  menus: MenuItem[];
}

interface MenuCalendarProps {
  zonaId: string;
  zonaNombre: string;
  fechaEjecucion: string;
  unidadesMenus: UnitMenu[];
}

const MenuCalendar: React.FC<MenuCalendarProps> = ({
  zonaId,
  zonaNombre,
  fechaEjecucion,
  unidadesMenus
}) => {
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
        return <UtensilsCrossed className="w-4 h-4 text-gray-500" />;
    }
  };

  // Función para obtener el color del badge según el tipo de menú
  const getMenuBadgeColor = (tipo: string) => {
    switch (tipo) {
      case 'DESAYUNO':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'ALMUERZO':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'CENA':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'REFRIGERIO':
        return 'bg-green-100 text-green-800 border-green-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
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

  // Función para calcular la fecha de inicio de cada unidad
  const calculateStartDate = (unitIndex: number) => {
    const startDate = parseDateWithoutTimezone(fechaEjecucion);
    // Cada unidad puede empezar en días diferentes
    startDate.setDate(startDate.getDate() + (unitIndex * 7)); // Cada unidad empieza una semana después
    const year = startDate.getFullYear();
    const month = String(startDate.getMonth() + 1).padStart(2, '0');
    const day = String(startDate.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CalendarIcon className="w-5 h-5 text-teal-600" />
          Calendario de Menús - {zonaNombre}
        </CardTitle>
        <div className="text-sm text-gray-600">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4" />
            Fecha de ejecución: {formatDate(fechaEjecucion)}
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
                    {formatDate(calculateStartDate(index))}
                  </Badge>
                </div>

                {unidad.menus.length === 0 ? (
                  <div className="text-center py-4 text-gray-500">
                    <p>No hay menús asignados a esta unidad</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                    {unidad.menus.map((menu) => (
                      <div
                        key={menu.id}
                        className="border border-gray-200 rounded-lg p-3 hover:shadow-md transition-shadow"
                      >
                        <div className="flex items-center gap-2 mb-2">
                          {getMenuIcon(menu.tipo)}
                          <span className="font-medium text-sm text-gray-700">
                            {menu.tipo}
                          </span>
                        </div>
                        <div className="space-y-1">
                          <p className="text-sm font-medium text-gray-900">
                            {menu.nombre}
                          </p>
                          <Badge 
                            variant="outline" 
                            className={`text-xs ${getMenuBadgeColor(menu.tipo)}`}
                          >
                            {menu.codigo}
                          </Badge>
                        </div>
                      </div>
                    ))}
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

export default MenuCalendar;
