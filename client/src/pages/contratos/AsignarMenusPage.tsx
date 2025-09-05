import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Badge } from '../../components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';
import {
  FileText,
  MapPin,
  Package,
  Search,
  Check,
  X,
  ArrowRight,
  Settings,
  Coffee,
  UtensilsCrossed,
  Moon,
  Cookie,
  Beef,
  Wheat,
  Droplets,
  Carrot,
  Sparkles,
  Plus,
  Trash2,
  ChevronRight,
  Sun,
  Sunset
} from 'lucide-react';
import { ContratosService, ContratoView } from '../../services/contratosService';
import { UnidadesServicioService, UnidadServicio } from '../../services/unidadesServicioService';
import { ProductosService, ComponenteMenu, Producto, RecetaAgrupada } from '../../services/productosService';
import { useToast } from '../../hooks/use-toast';
import { useGlobalLoading } from '../../contexts/GlobalLoadingContext';
import GroupedTable, { GroupedTableData } from '../../components/GroupedTable';

interface SelectWithSearchProps {
  options: { id: string; nombre: string }[];
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  disabled?: boolean;
}

const SelectWithSearch: React.FC<SelectWithSearchProps> = ({
  options,
  value,
  onChange,
  placeholder,
  disabled = false
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredOptions, setFilteredOptions] = useState(options);

  useEffect(() => {
    const filtered = options.filter(option =>
      option.nombre.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredOptions(filtered);
  }, [searchTerm, options]);

  const selectedOption = options.find(option => option.id === value);

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className={`w-full px-3 py-2 text-left border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 ${
          disabled ? 'bg-gray-100 cursor-not-allowed' : 'bg-white cursor-pointer hover:border-gray-400'
        }`}
      >
        {selectedOption ? selectedOption.nombre : placeholder}
      </button>
      
      {isOpen && !disabled && (
        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg">
          <div className="p-2">
            <Input
              type="text"
              placeholder="Buscar..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="mb-2"
            />
          </div>
          <div className="max-h-60 overflow-auto">
            {filteredOptions.map((option) => (
              <button
                key={option.id}
                type="button"
                onClick={() => {
                  onChange(option.id);
                  setIsOpen(false);
                  setSearchTerm('');
                }}
                className="w-full px-3 py-2 text-left hover:bg-gray-100 focus:bg-gray-100 focus:outline-none"
              >
                {option.nombre}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

interface MultiSelectProps {
  options: { id: string; nombre: string; zona_nombre?: string; zona_id?: number }[];
  selectedValues: string[];
  onChange: (values: string[]) => void;
  placeholder: string;
  disabled?: boolean;
}

const MultiSelect: React.FC<MultiSelectProps> = ({
  options,
  selectedValues,
  onChange,
  placeholder,
  disabled = false
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);

  const filteredOptions = options.filter(option =>
    option.nombre.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Cerrar dropdown al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const toggleOption = (optionId: string) => {
    if (selectedValues.includes(optionId)) {
      onChange(selectedValues.filter(id => id !== optionId));
    } else {
      onChange([...selectedValues, optionId]);
    }
  };

  const removeOption = (optionId: string) => {
    onChange(selectedValues.filter(id => id !== optionId));
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className={`w-full px-3 py-2 text-left border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 ${
          disabled ? 'bg-gray-100 cursor-not-allowed' : 'bg-white cursor-pointer hover:border-gray-400'
        }`}
      >
        {selectedValues.length > 0 ? (
          <div className="flex flex-wrap gap-1">
            {selectedValues.map(id => {
              const option = options.find(o => o.id === id);
              return (
                <Badge key={id} variant="secondary" className="text-xs hover:bg-cyan-100 hover:text-cyan-800">
                  {option?.nombre}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      removeOption(id);
                    }}
                    className="ml-1 hover:text-red-600"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </Badge>
              );
            })}
          </div>
        ) : (
          <span className="text-gray-500">{placeholder}</span>
        )}
      </button>
      
      {isOpen && !disabled && (
        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg">
          <div className="p-2">
            <Input
              type="text"
              placeholder="Buscar unidades..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="mb-2"
            />
          </div>
          <div className="max-h-60 overflow-auto">
            {(() => {
              // Agrupar opciones por zona
              const groupedOptions = filteredOptions.reduce((groups, option) => {
                const zona = (option as any).zona_nombre || 'Sin Zona';
                if (!groups[zona]) {
                  groups[zona] = [];
                }
                groups[zona].push(option);
                return groups;
              }, {} as Record<string, typeof filteredOptions>);

              return Object.entries(groupedOptions).map(([zona, opciones]) => (
                <div key={zona}>
                  {/* Header de zona */}
                  <div className="px-3 py-2 bg-gray-100 text-sm font-semibold text-gray-700 border-b border-gray-200">
                    {zona}
                  </div>
                  {/* Opciones de la zona */}
                  {opciones.map((option) => {
                    const isSelected = selectedValues.includes(option.id);
                    return (
                      <button
                        key={option.id}
                        type="button"
                        onClick={() => toggleOption(option.id)}
                        className="w-full px-6 py-2 text-left focus:outline-none text-sm"
                        style={{
                          backgroundColor: isSelected ? '#ecfeff' : 'transparent',
                          borderLeft: isSelected ? '4px solid #06b6d4' : 'none'
                        }}
                        onMouseEnter={(e) => {
                          console.log('Mouse enter - isSelected:', isSelected, 'option:', option.nombre);
                          if (!isSelected) {
                            e.currentTarget.style.backgroundColor = '#f3f4f6';
                          }
                        }}
                        onMouseLeave={(e) => {
                          console.log('Mouse leave - isSelected:', isSelected, 'option:', option.nombre);
                          if (!isSelected) {
                            e.currentTarget.style.backgroundColor = 'transparent';
                          }
                        }}
                      >
                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => {}} // El onChange se maneja en el onClick del botón
                            className="rounded border-gray-300 text-cyan-600 focus:ring-cyan-500"
                          />
                          <span className={isSelected ? 'text-cyan-800 font-medium' : 'text-gray-700'}>
                            {option.nombre}
                          </span>
                          {(option as any).zona_nombre && (
                            <span className="text-xs text-gray-500 ml-auto">
                              (TIENE MENUS)
                            </span>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              ));
            })()}
          </div>
        </div>
      )}
    </div>
  );
};

const AsignarMenusPage: React.FC = () => {
  const { toast } = useToast();
  const { showLoading, hideLoading } = useGlobalLoading();
  
  const [contratosDisponibles, setContratosDisponibles] = useState<ContratoView[]>([]);
  const [selectedContrato, setSelectedContrato] = useState<string>('');
  const [unidadesFiltradas, setUnidadesFiltradas] = useState<UnidadServicio[]>([]);
  const [selectedUnidades, setSelectedUnidades] = useState<string[]>([]);
  const [recetasAgrupadas, setRecetasAgrupadas] = useState<RecetaAgrupada[]>([]);
  const [menusAsignados, setMenusAsignados] = useState<Producto[]>([]);
  const [selectedRecetas, setSelectedRecetas] = useState<Set<string>>(new Set());
  const [filterText, setFilterText] = useState('');

  // Función para transformar recetas agrupadas a datos de tabla
  const transformRecetasToTableData = (recetas: RecetaAgrupada[]): GroupedTableData[] => {
    return recetas.map((receta, index) => ({
      id: `${receta.id}-${receta.tipo_zona}-${receta.nombre_servicio}-${index}`, // ID único combinando varios campos
      codigo: receta.codigo,
      nombre: receta.nombre_receta,
      tipo_zona: receta.tipo_zona, // Primer nivel de agrupación
      nombre_servicio: receta.nombre_servicio, // Segundo nivel de agrupación
      orden: receta.orden,
      estado: 1,
      // Mantener el ID original para referencia si es necesario
      originalId: receta.id
    }));
  };

  // Función para filtrar recetas basándose en las selecciones actuales
  const getRecetasFiltradas = (): GroupedTableData[] => {
    const recetasTransformadas = transformRecetasToTableData(recetasAgrupadas);
    
    // Si no hay recetas seleccionadas, mostrar todas
    if (selectedRecetas.size === 0) {
      return recetasTransformadas;
    }
    
    // Obtener el tipo de zona de las recetas seleccionadas
    const recetasSeleccionadas = Array.from(selectedRecetas).map(id => {
      return recetasTransformadas.find(r => r.id === id);
    }).filter(Boolean);
    
    const tipoZonaSeleccionado = recetasSeleccionadas[0]?.tipo_zona;
    
    // Si hay un tipo de zona seleccionado, mostrar solo las recetas de ese tipo
    if (tipoZonaSeleccionado) {
      return recetasTransformadas.filter(receta => receta.tipo_zona === tipoZonaSeleccionado);
    }
    
    return recetasTransformadas;
  };

  // Iconos para los tipos de menú
  const menuTypeIcons = {
    'DESAYUNO': <Sun className="w-3 h-3 text-yellow-600" />,
    'ALMUERZO': <UtensilsCrossed className="w-3 h-3 text-orange-600" />,
    'CENA': <Moon className="w-3 h-3 text-blue-600" />,
    'GENERAL': <Package className="w-3 h-3 text-gray-600" />
  };

  useEffect(() => {
    cargarContratos();
  }, []);

  const cargarContratos = async () => {
    try {
      const response = await ContratosService.getContratos();
      if (response.data) {
        // Filtrar solo contratos que no estén en estado INACTIVO
        const contratosActivos = response.data.filter(contrato => 
          contrato.Estado !== 'INACTIVO'
        );
        setContratosDisponibles(contratosActivos);
      }
    } catch (error) {
      console.error('Error cargando contratos:', error);
      toast({
        title: "Error",
        description: "No se pudieron cargar los contratos",
        variant: "destructive",
      });
    }
  };

  const getUnidadesPorContrato = async (contratoId: number) => {
    try {
      console.log('🔍 Llamando al servicio con contrato ID:', contratoId);
      const response = await UnidadesServicioService.getUnidadesPorContrato(contratoId);
      console.log('📡 Respuesta del servicio:', response);
      console.log('📊 Datos de unidades:', response.data);
      return response.data || [];
    } catch (error) {
      console.error('❌ Error obteniendo unidades del contrato:', error);
      return [];
    }
  };

  const handleContratoChange = async (contratoValue: string) => {
    console.log('🔄 Cambiando contrato a:', contratoValue);
          setSelectedContrato(contratoValue);
      setSelectedUnidades([]);
      setMenusAsignados([]);

    if (contratoValue) {
      // Buscar por ID del contrato
      const contratoSeleccionado = contratosDisponibles.find(c => c.id?.toString() === contratoValue);

      console.log('📋 Contrato seleccionado:', contratoSeleccionado);

      if (contratoSeleccionado && contratoSeleccionado.id) {
        console.log('🔍 Buscando unidades para contrato ID:', contratoSeleccionado.id);
        const unidadesDelContrato = await getUnidadesPorContrato(contratoSeleccionado.id);
        console.log('📊 Unidades encontradas:', unidadesDelContrato);
        setUnidadesFiltradas(unidadesDelContrato);
      } else {
        console.log('❌ No se encontró el contrato o no tiene ID');
        setUnidadesFiltradas([]);
      }
    } else {
      setUnidadesFiltradas([]);
    }
  };

  const cargarRecetasAgrupadas = async () => {
    try {
      showLoading('Cargando catálogo de recetas...');
      
      const response = await ProductosService.getRecetasAgrupadas();
      
      if (response.error) {
        console.error('Error cargando recetas:', response.error);
        toast({
          title: "Error",
          description: "No se pudieron cargar las recetas",
          variant: "destructive",
        });
        return;
      }

      setRecetasAgrupadas(response.data || []);
      console.log('✅ Recetas agrupadas cargadas:', response.data);
      
    } catch (error) {
      console.error('Error cargando recetas agrupadas:', error);
      toast({
        title: "Error",
        description: "Error al cargar las recetas",
        variant: "destructive",
      });
    } finally {
      hideLoading();
    }
  };

  // Cargar recetas agrupadas al inicio
  useEffect(() => {
    cargarRecetasAgrupadas();
  }, []);

  // Función para manejar la selección de recetas con validación de tipo de zona
  const handleRecetaSelect = (receta: GroupedTableData, selected: boolean) => {
    setSelectedRecetas(prev => {
      const newSet = new Set(prev);
      
      if (selected) {
        // Verificar si ya hay recetas seleccionadas de otros tipos de zona
        const recetasActuales = Array.from(prev).map(id => {
          return recetasAgrupadas.find(r => 
            `${r.id}-${r.tipo_zona}-${r.nombre_servicio}-${recetasAgrupadas.indexOf(r)}` === id
          );
        }).filter(Boolean);
        
        const tiposZonaSeleccionados = new Set(recetasActuales.map(r => r?.tipo_zona));
        const tipoZonaActual = receta.tipo_zona;
        
        // Si hay recetas de otros tipos de zona seleccionadas, no permitir seleccionar
        if (tiposZonaSeleccionados.size > 0 && !tiposZonaSeleccionados.has(tipoZonaActual)) {
          toast({
            title: "Validación de zona",
            description: `Solo puedes seleccionar recetas del tipo de zona "${tipoZonaActual}". Deselecciona primero las recetas de otros tipos de zona.`,
            variant: "destructive",
          });
          return prev; // No hacer cambios
        }
        
        newSet.add(receta.id.toString());
      } else {
        newSet.delete(receta.id.toString());
      }
      
      return newSet;
    });
  };


  const handleToggleProducto = (producto: Producto) => {
    setMenusAsignados(prev => {
      const existe = prev.find(p => p.id === producto.id);
      if (existe) {
        return prev.filter(p => p.id !== producto.id);
      } else {
        return [...prev, producto];
      }
    });
  };

  const getIconForTipo = (tipo: string) => {
    switch (tipo.toLowerCase()) {
      case 'desayuno':
        return <Coffee className="w-5 h-5 text-yellow-600" />;
      case 'almuerzo':
        return <UtensilsCrossed className="w-5 h-5 text-orange-600" />;
      case 'cena':
        return <Moon className="w-5 h-5 text-purple-600" />;
      case 'snack':
        return <Cookie className="w-5 h-5 text-pink-600" />;
      default:
        return <Package className="w-5 h-5 text-gray-600" />;
    }
  };

  const handleAsignarMenus = () => {
    console.log('🎯 Asignando menús seleccionados...');
    // TODO: Implementar lógica de asignación
    toast({
      title: "Asignación de menús",
      description: "Funcionalidad en desarrollo",
    });
  };

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Asignación de Menús</h1>
        <p className="text-gray-600">Gestiona la asignación de productos a los menús de los contratos</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-teal-600" />
            Configuración de Menús
          </CardTitle>
        </CardHeader>
        <CardContent>
          {/* Campos superiores */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                <FileText className="w-4 h-4 text-blue-600" />
                Seleccione un Contrato
              </label>
              <SelectWithSearch
                options={contratosDisponibles.map(c => ({
                  id: c.id?.toString() || '0',
                  nombre: `(No. ${c['No Contrato']}) ${c['Entidad / Contratante:FLT']?.toUpperCase()}`
                }))}
                value={selectedContrato}
                onChange={handleContratoChange}
                placeholder="Buscar contrato..."
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                <MapPin className="w-4 h-4 text-indigo-600" />
                Seleccione una o varias Unidades de Servicio
              </label>
              <MultiSelect
                options={unidadesFiltradas.map(u => ({
                  id: u.id.toString(),
                  nombre: u.nombre_servicio,
                  zona_nombre: u.zona_nombre,
                  zona_id: u.zona_id
                }))}
                selectedValues={selectedUnidades}
                onChange={setSelectedUnidades}
                placeholder={selectedContrato ? "Seleccionar unidades..." : "Primero seleccione un contrato"}
                disabled={!selectedContrato}
              />
            </div>
          </div>

          {/* Contenedor principal con dos columnas */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Columna izquierda - Catálogo de Recetas */}
            <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
              <div className="bg-gray-50 p-4 border-b border-gray-200">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-8 h-8 bg-teal-100 rounded-lg flex items-center justify-center">
                    <Package className="w-4 h-4 text-teal-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">
                      Catálogo de Recetas
                    </h3>
                    <p className="text-gray-600 text-sm">
                      Seleccione las recetas para el menú
                    </p>
                  </div>
                </div>

                                 <div className="relative">
                   <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                   <Input
                     type="text"
                     placeholder="Buscar productos..."
                     value={filterText}
                     onChange={(e) => setFilterText(e.target.value)}
                     className="pl-10"
                   />
                 </div>
                 
                 {/* Indicador de tipo de zona seleccionado */}
                 {selectedRecetas.size > 0 && (() => {
                   const recetasSeleccionadas = Array.from(selectedRecetas).map(id => {
                     return transformRecetasToTableData(recetasAgrupadas).find(r => r.id === id);
                   }).filter(Boolean);
                   
                   const tipoZonaSeleccionado = recetasSeleccionadas[0]?.tipo_zona;
                   
                   return (
                     <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                       <div className="flex items-center gap-2">
                         <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                         <span className="text-sm font-medium text-blue-800">
                           Tipo de zona seleccionado: <strong>{tipoZonaSeleccionado}</strong>
                         </span>
                       </div>
                       <p className="text-xs text-blue-600 mt-1">
                         Solo se muestran recetas de este tipo de zona. Deselecciona todas para ver todas las opciones.
                       </p>
                     </div>
                   );
                 })()}
              </div>

              <div className="max-h-96 overflow-y-auto">
                {selectedUnidades.length === 0 ? (
                  <div className="p-8 text-center">
                    <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                      <Settings className="w-8 h-8 text-gray-400" />
                    </div>
                    <h4 className="text-lg font-semibold text-gray-700 mb-2">
                      Seleccione Unidades de Servicio
                    </h4>
                    <p className="text-sm text-gray-500 max-w-xs mx-auto">
                      No hay recetas disponibles en el sistema
                    </p>
                  </div>
                ) : recetasAgrupadas.length === 0 ? (
                  <div className="p-8 text-center">
                    <div className="w-16 h-16 mx-auto mb-4 bg-blue-100 rounded-full flex items-center justify-center">
                      <Package className="w-8 h-8 text-blue-500 animate-pulse" />
                    </div>
                    <h4 className="text-lg font-semibold text-gray-700 mb-2">
                      Cargando Recetas
                    </h4>
                    <p className="text-sm text-gray-500">
                      Obteniendo recetas de la base de datos...
                    </p>
                  </div>
                ) : (
                                     <div className="p-4">
                     <GroupedTable
                       data={getRecetasFiltradas()}
                       groupBy={['tipo_zona', 'nombre_servicio']}
                       columns={[
                         {
                           key: 'nombre',
                           label: 'Nombre de la Receta'
                         },
                         {
                           key: 'codigo',
                           label: 'Código'
                         }
                       ]}
                       title=""
                       showTitle={false}
                       emptyMessage="No hay recetas disponibles"
                       defaultExpandedGroups={[]}
                       showCheckboxes={true}
                       selectedItems={selectedRecetas}
                       onItemSelect={handleRecetaSelect}
                       groupIcons={{}}
                       onItemClick={(item) => {
                         // Aquí puedes manejar la selección de recetas
                         console.log('Receta seleccionada:', item);
                       }}
                     />
                   </div>
                )}
              </div>

              {/* Contador de recetas seleccionadas y Botón Asignar Menús */}
              <div className="p-4 bg-gray-50 border-t border-gray-200">
                {/* Contador de recetas seleccionadas */}
                {selectedRecetas.size > 0 && (
                  <div className="mb-3 flex items-center gap-2">
                    <div className="w-2 h-2 bg-teal-500 rounded-full"></div>
                    <span className="text-sm font-medium text-gray-700">
                      {selectedRecetas.size} receta{selectedRecetas.size !== 1 ? 's' : ''} seleccionada{selectedRecetas.size !== 1 ? 's' : ''}
                    </span>
                  </div>
                )}
                
                <Button
                  type="button"
                  onClick={handleAsignarMenus}
                  className="w-full bg-teal-600 hover:bg-teal-700 text-white"
                  disabled={menusAsignados.length === 0}
                >
                  <ArrowRight className="w-4 h-4 mr-2" />
                  Asignar Productos al Menú
                </Button>
              </div>
            </div>

            {/* Columna derecha - Productos Seleccionados */}
            <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
              <div className="bg-teal-50 p-4 border-b border-teal-200">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-teal-100 rounded-lg flex items-center justify-center">
                    <Check className="w-4 h-4 text-teal-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">
                      Productos Seleccionados
                    </h3>
                    <p className="text-gray-600 text-sm">
                      {menusAsignados.length} productos en el menú
                    </p>
                  </div>
                </div>
              </div>

              <div className="min-h-96">
                {menusAsignados.length > 0 ? (
                  <div className="p-4">
                    <div className="space-y-2">
                      {menusAsignados.map((menu) => (
                        <div
                          key={menu.id}
                          className="bg-gray-50 border border-gray-200 rounded-lg p-3 hover:shadow-sm transition-all"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-teal-100 rounded-lg flex items-center justify-center">
                              <Check className="w-4 h-4 text-teal-600" />
                            </div>

                            <div className="flex-1">
                              <h5 className="text-sm font-medium text-gray-900">
                                {menu.nombre}
                              </h5>
                              <p className="text-xs text-gray-500 mt-1">
                                Producto asignado al menú
                              </p>
                            </div>

                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => setMenusAsignados(prev => prev.filter(m => m.id !== menu.id))}
                              className="text-red-600 hover:text-red-700 hover:bg-red-50"
                            >
                              <X className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="p-8 flex flex-col items-center justify-center text-center h-full">
                    <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                      <UtensilsCrossed className="w-8 h-8 text-gray-400" />
                    </div>
                    <h4 className="text-lg font-semibold text-gray-700 mb-2">
                      Menú Vacío
                    </h4>
                    <p className="text-sm text-gray-500 max-w-xs">
                      Los productos que seleccione aparecerán aquí para formar el menú del contrato
                    </p>
                    <div className="mt-4 flex items-center gap-2 text-xs text-gray-400">
                      <ArrowRight className="w-3 h-3" />
                      <span>Seleccione productos de la izquierda</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AsignarMenusPage;
