import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Badge } from '../../components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';
import AsignacionesTable from '../../components/AsignacionesTable';
import { supabase } from '../../services/supabaseClient';
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
import { AsignacionesService, AsignacionData, RecetaExistente } from '../../services/asignacionesService';
import { useToast } from '../../hooks/use-toast';
import { useGlobalLoading } from '../../contexts/GlobalLoadingContext';
import GroupedTable, { GroupedTableData } from '../../components/GroupedTable';

interface AsignacionUnidad {
  unidadId: string;
  unidadNombre: string;
  zonaNombre: string;
  contratoId: string;
  contratoNombre: string;
  recetas: (RecetaAgrupada & { uniqueId: string })[];
}

interface SelectWithSearchProps {
  options: { id: string; nombre: string; tiene_menu?: boolean }[];
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
        className={`w-full px-3 py-2 text-left border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 ${disabled ? 'bg-gray-100 cursor-not-allowed' : 'bg-white cursor-pointer hover:border-gray-400'
          }`}
      >
        {selectedOption ? selectedOption.nombre : placeholder}
      </button>

      {isOpen && !disabled && (
        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg">
          <div className="p-3">
            <Input
              type="text"
              placeholder="Buscar..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="mb-2 h-8 text-sm"
            />
          </div>
          <div className="max-h-60 overflow-auto px-2 pb-2">
            {filteredOptions.map((option) => (
              <button
                key={option.id}
                type="button"
                onClick={() => {
                  onChange(option.id);
                  setIsOpen(false);
                  setSearchTerm('');
                }}
                className="w-full px-2 py-2 text-left hover:bg-gray-100 focus:bg-gray-100 focus:outline-none text-xs rounded mb-1"
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
        className={`w-full px-3 py-2 text-left border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 ${disabled ? 'bg-gray-100 cursor-not-allowed' : 'bg-white cursor-pointer hover:border-gray-400'
          }`}
      >
        {selectedValues.length > 0 ? (
          <div className="flex flex-wrap gap-1">
            {selectedValues.map(id => {
              const option = options.find(o => o.id === id);
              return (
                <Badge key={id} variant="secondary" className="text-xs hover:bg-cyan-100 hover:text-cyan-800">
                  {option?.nombre}
                  <span
                    onClick={(e) => {
                      e.stopPropagation();
                      removeOption(id);
                    }}
                    className="ml-1 hover:text-red-600 cursor-pointer"
                  >
                    <X className="w-3 h-3" />
                  </span>
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
          <div className="p-3">
            <Input
              type="text"
              placeholder="Buscar unidades..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="mb-2 h-8 text-sm"
            />
          </div>
          <div className="max-h-60 overflow-auto px-2 pb-2">
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
                  <div className="px-2 py-1.5 bg-gray-100 text-xs font-semibold text-gray-700 border-b border-gray-200">
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
                        className="w-full px-4 py-1.5 text-left focus:outline-none text-xs mb-1 rounded"
                        style={{
                          backgroundColor: isSelected ? '#ecfeff' : 'transparent',
                          borderLeft: isSelected ? '3px solid #06b6d4' : 'none'
                        }}
                        onMouseEnter={(e) => {
                          if (!isSelected) {
                            e.currentTarget.style.backgroundColor = '#f3f4f6';
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (!isSelected) {
                            e.currentTarget.style.backgroundColor = 'transparent';
                          }
                        }}
                      >
                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => { }} // El onChange se maneja en el onClick del botón
                            className="rounded border-gray-300 text-cyan-600 focus:ring-cyan-500 w-3 h-3"
                          />
                          <span className={isSelected ? 'text-cyan-800 font-medium' : 'text-gray-700'}>
                            {option.nombre}
                          </span>
                          <span className={`text-xs ml-auto px-1.5 py-0.5 rounded-full ${
                            (option as any).tiene_menu 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-gray-100 text-gray-600'
                          }`}>
                            {(option as any).tiene_menu ? 'Tiene menú' : 'No tiene menú'}
                          </span>
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
  
  const [activeTab, setActiveTab] = useState('asignaciones');

  const [contratosDisponibles, setContratosDisponibles] = useState<ContratoView[]>([]);
  const [selectedContrato, setSelectedContrato] = useState<string>('');
  const [unidadesFiltradas, setUnidadesFiltradas] = useState<UnidadServicio[]>([]);
  const [selectedUnidades, setSelectedUnidades] = useState<string[]>([]);
  const [recetasAgrupadas, setRecetasAgrupadas] = useState<RecetaAgrupada[]>([]);
  const [menusAsignados, setMenusAsignados] = useState<Producto[]>([]);
  const [selectedRecetas, setSelectedRecetas] = useState<Set<string>>(new Set());
  const [unidadesCargadas, setUnidadesCargadas] = useState<Set<string>>(new Set());
  const [filterText, setFilterText] = useState('');
  const [asignacionesUnidades, setAsignacionesUnidades] = useState<AsignacionUnidad[]>([]);
  
  // Función para eliminar duplicados del array de asignaciones
  const eliminarDuplicadosAsignaciones = (asignaciones: AsignacionUnidad[]): AsignacionUnidad[] => {
    const seen = new Set<string>();
    const resultado = [];
    
    for (const asignacion of asignaciones) {
      const key = `${asignacion.unidadId}-${asignacion.contratoId}`;
      if (seen.has(key)) {
        console.log('🗑️ Eliminando duplicado:', key);
        // Si ya existe, mantener la última (más reciente)
        const index = resultado.findIndex(a => `${a.unidadId}-${a.contratoId}` === key);
        if (index !== -1) {
          resultado[index] = asignacion; // Reemplazar con la más reciente
          console.log('🔄 Reemplazando asignación existente con la más reciente:', key);
        }
      } else {
        seen.add(key);
        resultado.push(asignacion);
        console.log('✅ Agregando nueva asignación:', key);
      }
    }
    
    return resultado;
  };
  
  // Debug: Log del estado inicial
  console.log('🏁 Estado inicial selectedRecetas:', Array.from(selectedRecetas));
  
  // Asegurar que el estado esté completamente limpio al montar el componente
  useEffect(() => {
    console.log('🧹 Limpiando estado inicial de selectedRecetas');
    setSelectedRecetas(new Set());
  }, []);

  // Limpiar duplicados automáticamente cada vez que cambie asignacionesUnidades
  useEffect(() => {
    if (asignacionesUnidades.length > 0) {
      const sinDuplicados = eliminarDuplicadosAsignaciones(asignacionesUnidades);
      if (sinDuplicados.length !== asignacionesUnidades.length) {
        console.log('🧹 Limpiando duplicados automáticamente:', asignacionesUnidades.length, '->', sinDuplicados.length);
        setAsignacionesUnidades(sinDuplicados);
      }
    }
  }, [asignacionesUnidades]);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Función para generar un ID único que combine id_relacion + unidad_servicio
  const generarIdUnico = (idRelacion: number, unidadServicio: string): string => {
    return `${idRelacion}-${unidadServicio}`;
  };

  // Función para extraer id_relacion del ID único
  const extraerIdRelacion = (idUnico: string): number => {
    return parseInt(idUnico.split('-')[0]);
  };

  // Función para extraer id_producto del ID único (necesario para compatibilidad)
  const extraerIdProducto = (idUnico: string): number => {
    const idRelacion = extraerIdRelacion(idUnico);
    // Buscar el id_producto correspondiente en recetasAgrupadas
    const receta = recetasAgrupadas.find(r => r.id === idRelacion);
    return receta ? receta.id_producto : 0;
  };

  // Función para extraer unidad_servicio del ID único
  const extraerUnidadServicio = (idUnico: string): string => {
    const partes = idUnico.split('-');
    return partes.slice(1).join('-'); // En caso de que la unidad tenga guiones
  };

  // Función para verificar si un item está seleccionado basándose en su ID único
  const isItemSelected = useCallback((item: GroupedTableData): boolean => {
    const idUnico = generarIdUnico(Number(item.id), item.unidad_servicio);
    const isSelected = selectedRecetas.has(idUnico);
    
    return isSelected;
  }, [selectedRecetas]);

  // Función para verificar si una receta está asignada a alguna unidad
  const isRecetaAsignada = (recetaId: number): boolean => {
    return asignacionesUnidades.some(unidad => 
      unidad.recetas.some(receta => receta.id_producto === recetaId)
    );
  };

  // Función para transformar recetas agrupadas a datos de tabla
  const transformRecetasToTableData = useCallback((recetas: RecetaAgrupada[]): GroupedTableData[] => {
    return recetas.map((receta, index) => {
      // Crear un hash único para la unidad de servicio para usar en el ID del nivel 2
      const unidadHash = receta.unidad_servicio.replace(/\s+/g, '_').toLowerCase();
      
      return {
        id: receta.id, // Usar el ID de la tabla inv_producto_by_unidades
      codigo: receta.codigo,
      nombre: receta.nombre_receta,
        unidad_servicio: receta.unidad_servicio, // Mostrar solo el nombre de la unidad sin ID
        id_unidad_servicio: receta.id_unidad_servicio, // ID de la unidad de servicio
        nombre_servicio: receta.nombre_servicio, // Mostrar solo el nombre del servicio sin hash
        id_nombre_servicio: receta.id_nombre_servicio, // ID del nombre de servicio
        nombre_servicio_id: `${receta.nombre_servicio}-${unidadHash}`, // ID único para agrupación interna
      orden: receta.orden,
      estado: 1,
      // Mantener el ID original para referencia si es necesario
      originalId: receta.id_producto // Usar id_producto como ID original
      };
    });
  }, [selectedRecetas]);

  // Función para personalizar la visualización de grupos
  const getGroupDisplayName = (groupValue: string, field: string): string => {
    if (field === 'nombre_servicio_id') {
      // Extraer solo el nombre del servicio (primera parte antes del hash)
      // El hash siempre está al final después del último guión
      const parts = groupValue.split('-');
      // Si hay más de una parte, tomar solo la primera (nombre del servicio)
      // Si solo hay una parte, devolverla tal como está
      return parts.length > 1 ? parts[0] : groupValue;
    }
    return groupValue;
  };

  // Función para filtrar recetas basándose en las selecciones actuales
  const getRecetasFiltradas = useCallback((): GroupedTableData[] => {
    const recetasTransformadas = transformRecetasToTableData(recetasAgrupadas);

    // Si no hay recetas seleccionadas, mostrar todas
    if (selectedRecetas.size === 0) {
      return recetasTransformadas;
    }

    // Obtener la unidad de servicio de las recetas seleccionadas
    const recetasSeleccionadas = Array.from(selectedRecetas).map(idUnico => {
      const idRelacion = extraerIdRelacion(idUnico);
      const unidadServicio = extraerUnidadServicio(idUnico);
      return recetasTransformadas.find(r => r.id === idRelacion && r.unidad_servicio === unidadServicio);
    }).filter(Boolean) as GroupedTableData[];

    if (recetasSeleccionadas.length === 0) {
      return recetasTransformadas;
    }

    // Obtener la unidad de servicio de las recetas seleccionadas
    const unidadServicioSeleccionada = recetasSeleccionadas[0].unidad_servicio;

    // Mostrar todas las recetas de la misma unidad de servicio
    return recetasTransformadas.filter(receta => 
      receta.unidad_servicio === unidadServicioSeleccionada
    );
  }, [recetasAgrupadas, selectedRecetas]);

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
    
    // LIMPIAR COMPLETAMENTE EL ESTADO PARA EVITAR DUPLICACIONES
    setSelectedRecetas(new Set());
    setAsignacionesUnidades([]);
    setUnidadesCargadas(new Set());

    if (contratoValue) {
      // Buscar por ID del contrato
      const contratoSeleccionado = contratosDisponibles.find(c => c.id?.toString() === contratoValue);

      console.log('📋 Contrato seleccionado:', contratoSeleccionado);

      if (contratoSeleccionado && contratoSeleccionado.id) {
        console.log('🔍 Buscando unidades para contrato ID:', contratoSeleccionado.id);
        const unidadesDelContrato = await getUnidadesPorContrato(contratoSeleccionado.id);
        console.log('📊 Unidades encontradas:', unidadesDelContrato);
        setUnidadesFiltradas(unidadesDelContrato);
        
        // Cargar recetas específicas del contrato
        await cargarRecetasAgrupadas(contratoSeleccionado.id);
      } else {
        console.log('❌ No se encontró el contrato o no tiene ID');
        setUnidadesFiltradas([]);
        // Cargar todas las recetas si no hay contrato específico
        await cargarRecetasAgrupadas();
      }
    } else {
      setUnidadesFiltradas([]);
      // Cargar todas las recetas si no hay contrato seleccionado
      await cargarRecetasAgrupadas();
    }
  };

  const cargarRecetasAgrupadas = async (contratoId?: number) => {
    try {
      showLoading('Cargando catálogo de recetas...');

      const response = await ProductosService.getRecetasAgrupadas(contratoId);

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

  // No cargar recetas al inicio, solo cuando se seleccione un contrato
  // useEffect(() => {
  //   cargarRecetasAgrupadas();
  // }, []);

  // DESHABILITADO: Sincronización automática de recetas seleccionadas
  // El usuario debe seleccionar manualmente las recetas que desea asignar
  // useEffect(() => {
  //   console.log('🔄 useEffect sincronización:', {
  //     asignacionesUnidades: asignacionesUnidades.length,
  //     recetasAgrupadas: recetasAgrupadas.length,
  //     selectedRecetas: Array.from(selectedRecetas)
  //   });
  //   
  //   // Solo sincronizar si hay asignaciones Y recetas, pero NO si ya hay recetas seleccionadas
  //   if (asignacionesUnidades.length > 0 && recetasAgrupadas.length > 0 && selectedRecetas.size === 0) {
  //     const recetasAsignadas = new Set<string>();
  //     
  //     // Recopilar todas las recetas asignadas
  //     asignacionesUnidades.forEach(unidad => {
  //       unidad.recetas.forEach(receta => {
  //         // Usar solo el id_producto como identificador
  //         recetasAsignadas.add(receta.id_producto.toString());
  //       });
  //     });
  //     
  //     console.log('🔄 Recetas asignadas encontradas:', Array.from(recetasAsignadas));
  //     
  //     if (recetasAsignadas.size > 0) {
  //       console.log('🔄 Sincronizando recetas asignadas:', Array.from(recetasAsignadas));
  //       setSelectedRecetas(recetasAsignadas);
  //     }
  //   } else {
  //     console.log('🔄 No sincronizando:', {
  //       reason: selectedRecetas.size > 0 ? 'Ya hay recetas seleccionadas' : 'No hay asignaciones o recetas',
  //       selectedRecetas: Array.from(selectedRecetas)
  //     });
  //   }
  // }, [asignacionesUnidades, recetasAgrupadas]);

  // Función para manejar la selección de recetas con validación de unidad de servicio
  const handleRecetaSelect = (receta: GroupedTableData, selected: boolean) => {
    const idUnico = generarIdUnico(Number(receta.id), receta.unidad_servicio);
    
    console.log('🎯 Seleccionando receta:', {
      receta: receta.nombre,
      id: receta.id,
      unidad_servicio: receta.unidad_servicio,
      idUnico,
      selected
    });
    
    setSelectedRecetas(prev => {
      const newSet = new Set(prev);

      if (selected) {
        // Verificar si ya hay recetas seleccionadas de otras unidades de servicio
        const recetasActuales = Array.from(prev).map(idUnico => {
          const idRelacion = extraerIdRelacion(idUnico);
          const unidadServicio = extraerUnidadServicio(idUnico);
          return recetasAgrupadas.find(r => r.id === idRelacion && r.unidad_servicio === unidadServicio);
        }).filter(Boolean);

        // Filtrar solo las recetas que NO son de la misma unidad de servicio actual
        const recetasDeOtrasUnidades = recetasActuales.filter(r => r?.unidad_servicio !== receta.unidad_servicio);
        const unidadesServicioSeleccionadas = new Set(recetasDeOtrasUnidades.map(r => r?.unidad_servicio));
        const unidadServicioActual = receta.unidad_servicio;

        console.log('🔍 Debug validación:', {
          selectedRecetas: Array.from(prev),
          recetasActuales: recetasActuales.map(r => ({ id: r?.id_producto, unidad: r?.unidad_servicio })),
          recetasDeOtrasUnidades: recetasDeOtrasUnidades.map(r => ({ id: r?.id_producto, unidad: r?.unidad_servicio })),
          unidadesServicioSeleccionadas: Array.from(unidadesServicioSeleccionadas),
          unidadServicioActual,
          recetaSeleccionada: receta.nombre
        });

        // Si hay recetas de otras unidades de servicio seleccionadas, limpiar las anteriores y permitir seleccionar de la nueva unidad
        if (unidadesServicioSeleccionadas.size > 0) {
          // Limpiar recetas de otras unidades y permitir seleccionar de la nueva unidad
          const recetasDeOtrasUnidades = Array.from(prev).filter(idUnico => {
            const unidadServicio = extraerUnidadServicio(idUnico);
            return unidadServicio !== unidadServicioActual;
          });
          
          // Eliminar recetas de otras unidades
          recetasDeOtrasUnidades.forEach(idUnico => newSet.delete(idUnico));
          
          // Mostrar toast después de actualizar el estado (usando setTimeout para evitar warning)
          setTimeout(() => {
          toast({
              title: "Cambio de unidad de servicio",
              description: `Se han deseleccionado las recetas de otras unidades. Ahora puedes seleccionar recetas de "${unidadServicioActual}".`,
              variant: "default",
            });
          }, 0);
        }

        // Verificar si ya existe la misma receta en la misma unidad de servicio
        if (!newSet.has(idUnico)) {
          console.log('✅ Agregando receta al set:', idUnico, 'de unidad:', receta.unidad_servicio);
          newSet.add(idUnico);
      } else {
          console.log('⚠️ La receta ya está seleccionada en esta unidad de servicio');
        }
      } else {
        console.log('❌ Eliminando receta del set:', idUnico, 'de unidad:', receta.unidad_servicio);
        newSet.delete(idUnico);
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
    if (selectedRecetas.size === 0 || selectedUnidades.length === 0 || !selectedContrato) {
      toast({
        title: "Error",
        description: "Debe seleccionar al menos una receta y una unidad de servicio",
        variant: "destructive",
      });
      return;
    }

    // Obtener las recetas seleccionadas
    const recetasSeleccionadas = Array.from(selectedRecetas).map(idUnico => {
      const idRelacion = extraerIdRelacion(idUnico);
      const unidadServicio = extraerUnidadServicio(idUnico);
      return recetasAgrupadas.find(r => r.id === idRelacion && r.unidad_servicio === unidadServicio);
    }).filter(Boolean) as RecetaAgrupada[];

    // Obtener información del contrato seleccionado
    const contrato = contratosDisponibles.find(c => c.id?.toString() === selectedContrato);
    if (!contrato) {
      toast({
        title: "Error",
        description: "No se encontró el contrato seleccionado",
        variant: "destructive",
      });
      return;
    }

    // Crear asignaciones para cada unidad de servicio
    const nuevasAsignaciones: AsignacionUnidad[] = selectedUnidades.map(unidadId => {
      const unidad = unidadesFiltradas.find(u => u.id?.toString() === unidadId);
      return {
        unidadId,
        unidadNombre: unidad?.nombre_servicio || 'Unidad desconocida',
        zonaNombre: unidad?.zona_nombre || 'Zona desconocida',
        contratoId: selectedContrato,
        contratoNombre: contrato['Entidad / Contratante:FLT'] || 'Contrato desconocido',
        recetas: recetasSeleccionadas.map(receta => ({
          ...receta,
          uniqueId: `${receta.id_producto}-${unidadId}` // ID único que combina id_producto + unidad
        }))
      };
    });

    // Agregar nuevas asignaciones sin actualizar las existentes
    setAsignacionesUnidades(prev => {
      // Siempre agregar como nuevas asignaciones, no actualizar las existentes
      const todasLasAsignaciones = [...prev, ...nuevasAsignaciones];
      const sinDuplicados = eliminarDuplicadosAsignaciones(todasLasAsignaciones);
      console.log('🔄 Asignando recetas - Antes:', prev.length, 'Nuevas:', nuevasAsignaciones.length, 'Final:', sinDuplicados.length);
      return sinDuplicados;
    });
  };

  // Función para preparar los datos de asignación para la base de datos
  const prepararDatosAsignacion = (): AsignacionData[] => {
    const asignaciones: AsignacionData[] = [];
    
    asignacionesUnidades.forEach(unidad => {
      unidad.recetas.forEach(receta => {
        asignaciones.push({
          id_producto_by_unidad: receta.id, // Usar el ID de inv_producto_by_unidades
          id_contrato: parseInt(unidad.contratoId),
          id_unidad_servicio: parseInt(unidad.unidadId),
          estado: 1
        });
      });
    });
    
    return asignaciones;
  };

  // Función para manejar el guardado de asignaciones
  const handleGuardarAsignaciones = async () => {
    if (asignacionesUnidades.length === 0) {
      toast({
        title: "Sin asignaciones",
        description: "No hay asignaciones para guardar",
        variant: "destructive",
      });
      return;
    }

    setIsSaving(true);
    showLoading();

    try {
      const datosAsignacion = prepararDatosAsignacion();
      console.log('💾 Preparando para guardar:', {
        totalAsignaciones: datosAsignacion.length,
        asignaciones: datosAsignacion,
        asignacionesUnidades: asignacionesUnidades.map(a => ({
          unidadId: a.unidadId,
          contratoId: a.contratoId,
          totalRecetas: a.recetas.length,
          recetas: a.recetas.map(r => ({ id: r.id_producto, nombre: r.nombre_receta }))
        }))
      });

      // Guardar nuevas asignaciones sin eliminar las existentes
      const response = await AsignacionesService.guardarAsignaciones(datosAsignacion);

      if (response.error) {
        throw new Error(response.error.message || 'Error al guardar las asignaciones');
      }

      toast({
        title: "Asignaciones guardadas",
        description: `Se guardaron ${datosAsignacion.length} asignaciones exitosamente`,
        variant: "default",
      });

      // Cerrar el diálogo de confirmación
      setShowConfirmDialog(false);

      // Limpiar todo el formulario después del guardado exitoso
      limpiarFormulario();

    } catch (error: any) {
      console.error('❌ Error al guardar asignaciones:', error);
      toast({
        title: "Error al guardar",
        description: error.message || 'Ocurrió un error inesperado al guardar las asignaciones',
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
      hideLoading();
    }
  };

  // Función para limpiar todo el formulario
  const limpiarFormulario = () => {
    setSelectedContrato('');
    setSelectedUnidades([]);
    setSelectedRecetas(new Set());
    setAsignacionesUnidades([]);
    setFilterText('');
    console.log('🧹 Formulario limpiado completamente');
  };

  // Función para desmarcar recetas de una unidad específica
  const desmarcarRecetasDeUnidad = async (unidadId: string) => {
    try {
      console.log('🗑️ Desmarcando recetas de unidad:', unidadId);
      
      // Consultar la tabla inv_productos_unidad_servicio para obtener las recetas de esta unidad
      const { data: asignaciones, error: asignacionesError } = await supabase
        .from('inv_productos_unidad_servicio')
        .select(`
          id,
          id_producto_by_unidad,
          id_contrato,
          id_unidad_servicio
        `)
        .eq('id_unidad_servicio', parseInt(unidadId));

      if (asignacionesError) {
        console.error('❌ Error obteniendo asignaciones para desmarcar:', asignacionesError);
        return;
      }

      if (!asignaciones || asignaciones.length === 0) {
        console.log('⚠️ No se encontraron asignaciones para desmarcar en la unidad:', unidadId);
        return;
      }

      console.log('🔍 Asignaciones encontradas para desmarcar:', asignaciones);

      // Obtener los IDs de inv_producto_by_unidades
      const idsProductoByUnidad = asignaciones.map(a => a.id_producto_by_unidad);
      console.log('🔍 IDs de inv_producto_by_unidades a desmarcar:', idsProductoByUnidad);

      // Buscar las recetas correspondientes en el catálogo y desmarcarlas
      const recetasADesmarcar: string[] = [];
      
      idsProductoByUnidad.forEach((idProductoByUnidad: number) => {
        // Buscar la receta correspondiente en el catálogo por el ID de inv_producto_by_unidades
        const recetaEnCatalogo = recetasAgrupadas.find(receta => 
          receta.id === idProductoByUnidad
        );
        
        if (recetaEnCatalogo) {
          const idUnico = generarIdUnico(recetaEnCatalogo.id, recetaEnCatalogo.unidad_servicio);
          recetasADesmarcar.push(idUnico);
          console.log('✅ Encontrada receta en catálogo para desmarcar:', {
            idProductoByUnidad,
            recetaEnCatalogo: {
              id: recetaEnCatalogo.id,
              nombre: recetaEnCatalogo.nombre_receta,
              unidad: recetaEnCatalogo.unidad_servicio
            },
            idUnico
          });
        } else {
          console.log('❌ No se encontró receta en catálogo para desmarcar:', {
            idProductoByUnidad
          });
        }
      });
      
      console.log('🔍 IDs únicos para desmarcar:', recetasADesmarcar);
      
      // Desmarcar las recetas
      setSelectedRecetas(prev => {
        const newSet = new Set(prev);
        recetasADesmarcar.forEach(idUnico => {
          newSet.delete(idUnico);
          console.log('❌ Desmarcando receta:', idUnico);
        });
        return newSet;
      });

          // Limpiar la unidad de las unidades cargadas
          setUnidadesCargadas(prev => {
            const newSet = new Set(prev);
            newSet.delete(unidadId);
            return newSet;
          });

          console.log('✅ Recetas desmarcadas de la unidad:', unidadId);
        } catch (error) {
          console.error('❌ Error inesperado desmarcando recetas de unidad:', error);
        }
  };

  // Función para cargar recetas existentes de una unidad
  const cargarRecetasExistentes = async (unidadId: string) => {
    try {
      console.log('🔍 Cargando recetas existentes para unidad:', unidadId);
      
      // Verificar si ya se cargaron las recetas para esta unidad
      if (unidadesCargadas.has(unidadId)) {
        console.log('⚠️ Ya se cargaron recetas para esta unidad, saltando:', unidadId);
        return;
      }

      // Verificar si ya existe una asignación para esta unidad
      const yaExisteAsignacion = asignacionesUnidades.some(a => a.unidadId === unidadId);
      console.log('🔍 Verificando asignaciones existentes:', {
        unidadId,
        asignacionesExistentes: asignacionesUnidades.map(a => ({ unidadId: a.unidadId, recetas: a.recetas.length })),
        yaExisteAsignacion
      });
      if (yaExisteAsignacion) {
        console.log('⚠️ Ya existe asignación para esta unidad, saltando carga:', unidadId);
        return;
      }
      
      // Consultar directamente la tabla inv_productos_unidad_servicio
      const { data: asignaciones, error: asignacionesError } = await supabase
        .from('inv_productos_unidad_servicio')
        .select(`
          id,
          id_producto_by_unidad,
          id_contrato,
          id_unidad_servicio
        `)
        .eq('id_unidad_servicio', parseInt(unidadId));

      if (asignacionesError) {
        console.error('❌ Error obteniendo asignaciones:', asignacionesError);
        return;
      }

      if (!asignaciones || asignaciones.length === 0) {
        console.log('⚠️ No se encontraron asignaciones para la unidad:', unidadId);
        return;
      }

      console.log('🔍 Asignaciones encontradas:', asignaciones);

      // Obtener los IDs de inv_producto_by_unidades
      const idsProductoByUnidad = asignaciones.map(a => a.id_producto_by_unidad);
      console.log('🔍 IDs de inv_producto_by_unidades:', idsProductoByUnidad);

      // Buscar las recetas correspondientes en el catálogo y marcarlas como seleccionadas
      const recetasIdsParaMarcar: string[] = [];
      
      idsProductoByUnidad.forEach((idProductoByUnidad: number) => {
        // Buscar la receta correspondiente en el catálogo por el ID de inv_producto_by_unidades
        const recetaEnCatalogo = recetasAgrupadas.find(receta => 
          receta.id === idProductoByUnidad
        );
        
        if (recetaEnCatalogo) {
          const idUnico = generarIdUnico(recetaEnCatalogo.id, recetaEnCatalogo.unidad_servicio);
          recetasIdsParaMarcar.push(idUnico);
          console.log('✅ Encontrada receta en catálogo:', {
            idProductoByUnidad,
            recetaEnCatalogo: {
              id: recetaEnCatalogo.id,
              nombre: recetaEnCatalogo.nombre_receta,
              unidad: recetaEnCatalogo.unidad_servicio
            },
            idUnico
          });
        } else {
          console.log('❌ No se encontró receta en catálogo:', {
            idProductoByUnidad
          });
        }
      });
      
      console.log('🔍 IDs únicos para marcar:', recetasIdsParaMarcar);
      
      // Debug: Ver qué unidades están en el catálogo
      console.log('🔍 Unidades en el catálogo:', [...new Set(recetasAgrupadas.map(r => r.unidad_servicio))]);
      
      setSelectedRecetas(prev => {
        const newSet = new Set(prev);
        recetasIdsParaMarcar.forEach(idUnico => newSet.add(idUnico));
        console.log('🎯 Marcando recetas existentes como seleccionadas:', {
          recetasIdsParaMarcar,
          selectedRecetas: Array.from(newSet)
        });
        return newSet;
      });

      // Agregar las recetas a la sección "Recetas Asignadas"
      const recetasParaAsignacion: (RecetaAgrupada & { uniqueId: string })[] = [];
      
      idsProductoByUnidad.forEach((idProductoByUnidad: number) => {
        const recetaEnCatalogo = recetasAgrupadas.find(receta => 
          receta.id === idProductoByUnidad
        );
        
        if (recetaEnCatalogo) {
          recetasParaAsignacion.push({
            ...recetaEnCatalogo,
            uniqueId: `${recetaEnCatalogo.id}-${unidadId}`
          });
        }
      });

      if (recetasParaAsignacion.length > 0) {
        // Obtener información de la unidad
        const unidad = unidadesFiltradas.find(u => u.id.toString() === unidadId);
        const contrato = contratosDisponibles.find(c => c.id?.toString() === selectedContrato);

        if (unidad && contrato) {
          // Crear asignación con recetas existentes
          const nuevaAsignacion: AsignacionUnidad = {
            unidadId,
            unidadNombre: unidad.nombre_servicio,
            zonaNombre: unidad.zona_nombre || 'Sin Zona',
            contratoId: selectedContrato,
            contratoNombre: contrato['Entidad / Contratante:FLT'] || 'Contrato desconocido',
            recetas: recetasParaAsignacion
          };

          // Agregar la nueva asignación (ya verificamos que no existe)
          setAsignacionesUnidades(prev => {
            // FILTRAR CUALQUIER ASIGNACIÓN EXISTENTE PARA ESTA UNIDAD
            const sinDuplicados = prev.filter(a => a.unidadId !== unidadId);
            const nuevasAsignaciones = [...sinDuplicados, nuevaAsignacion];
            const sinDuplicadosFinales = eliminarDuplicadosAsignaciones(nuevasAsignaciones);
            console.log('➕ Creando nueva asignación para unidad:', unidadId);
            console.log('🔍 Filtrado duplicados - Antes:', prev.length, 'Después:', sinDuplicadosFinales.length);
            return sinDuplicadosFinales;
          });

          console.log('✅ Recetas agregadas a asignaciones:', recetasParaAsignacion);
        }
      }

      // Marcar la unidad como cargada
      setUnidadesCargadas(prev => new Set([...prev, unidadId]));
      console.log('✅ Recetas existentes cargadas, marcadas y agregadas a asignaciones');
    } catch (error) {
      console.error('❌ Error inesperado cargando recetas existentes:', error);
    }
  };

  // Función para manejar el cambio de unidades seleccionadas
  const handleUnidadesChange = (nuevasUnidades: string[]) => {
    const unidadesAnteriores = selectedUnidades;
    const unidadesEliminadas = unidadesAnteriores.filter(unidadId => !nuevasUnidades.includes(unidadId));
    
    setSelectedUnidades(nuevasUnidades);
    
    // Si se eliminaron unidades, desmarcar las recetas asociadas a esas unidades
    if (unidadesEliminadas.length > 0) {
      console.log('🗑️ Unidades eliminadas:', unidadesEliminadas);
      
      // Desmarcar recetas de las unidades eliminadas
      unidadesEliminadas.forEach(async (unidadId) => {
        await desmarcarRecetasDeUnidad(unidadId);
      });
      
      // Eliminar las asignaciones de las unidades eliminadas
      setAsignacionesUnidades(prev => 
        prev.filter(a => !unidadesEliminadas.includes(a.unidadId))
      );
    }
    
          // Cargar recetas existentes para las nuevas unidades que tienen menú
          nuevasUnidades.forEach(unidadId => {
            const unidad = unidadesFiltradas.find(u => u.id.toString() === unidadId);
            if (unidad && unidad.tiene_menu) {
              // Verificar que no se haya cargado ya
              if (!unidadesCargadas.has(unidadId) && !asignacionesUnidades.some(a => a.unidadId === unidadId)) {
                console.log('🔄 Cargando recetas para unidad nueva:', unidadId);
                cargarRecetasExistentes(unidadId);
              } else {
                console.log('⚠️ Saltando carga para unidad ya procesada:', unidadId);
              }
            }
          });
    
    // Si no hay recetas cargadas, cargar el catálogo de recetas
    if (recetasAgrupadas.length === 0) {
      cargarRecetasAgrupadas();
    }
  };

  // Función para mostrar el diálogo de confirmación
  const handleMostrarConfirmacion = () => {
    if (asignacionesUnidades.length === 0) {
      toast({
        title: "Sin asignaciones",
        description: "No hay asignaciones para guardar",
        variant: "destructive",
      });
      return;
    }
    setShowConfirmDialog(true);
  };

  // Funciones para manejar acciones de la tabla
  const handleVerAsignacion = (asignacion: any) => {
    console.log('Ver asignación:', asignacion);
    toast({
      title: "Ver asignación",
      description: `Viendo detalles de la asignación: ${asignacion.nombre_receta}`,
    });
  };

  const handleEditarAsignacion = (asignacion: any) => {
    console.log('Editar asignación:', asignacion);
    // Cambiar al tab de formulario y cargar los datos para edición
    setActiveTab('formulario');
    toast({
      title: "Editar asignación",
      description: `Editando asignación: ${asignacion.nombre_receta}`,
    });
  };

  const handleEliminarAsignacion = async (asignacion: any) => {
    try {
      showLoading('Eliminando asignación...');
      
      const { error } = await supabase
        .from('inv_productos_unidad_servicio')
        .delete()
        .eq('id', asignacion.id);

      if (error) {
        throw error;
      }

      toast({
        title: "Asignación eliminada",
        description: `La asignación de "${asignacion.nombre_receta}" ha sido eliminada exitosamente`,
        variant: "default",
      });

      // Recargar la tabla
      // La tabla se recargará automáticamente debido a su useEffect
      
    } catch (error: any) {
      console.error('Error eliminando asignación:', error);
      toast({
        title: "Error al eliminar",
        description: error.message || 'Ocurrió un error al eliminar la asignación',
        variant: "destructive",
      });
    } finally {
      hideLoading();
    }
  };

  const handleNuevaAsignacion = () => {
    // Cambiar al tab de formulario y limpiar el formulario
    setActiveTab('formulario');
    limpiarFormulario();
    toast({
      title: "Nueva asignación",
      description: "Formulario listo para crear una nueva asignación",
    });
  };

  return (
    <div className="p-4 max-w-full mx-auto">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-extrabold text-cyan-800 flex items-center gap-2">
          <FileText className="w-8 h-8 text-cyan-600" />
          Asignación de Menús
        </h1>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2 bg-cyan-100/60 p-1 rounded-lg">
          <TabsTrigger
            value="asignaciones"
            className="data-[state=active]:bg-cyan-600 data-[state=active]:text-white data-[state=active]:shadow-md rounded-md transition-all duration-300"
          >
            Listado de Asignaciones
          </TabsTrigger>
          <TabsTrigger
            value="formulario"
            className="data-[state=active]:bg-cyan-600 data-[state=active]:text-white data-[state=active]:shadow-md rounded-md transition-all duration-300"
          >
            Configuración de Menús
          </TabsTrigger>
        </TabsList>

        <TabsContent value="asignaciones" className="mt-6">
          <AsignacionesTable
            onDelete={handleEliminarAsignacion}
            onAdd={handleNuevaAsignacion}
          />
        </TabsContent>

        <TabsContent value="formulario" className="mt-6">
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
              <label className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
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
              <label className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                <MapPin className="w-4 h-4 text-indigo-600" />
                Seleccione una o varias Unidades de Servicio
              </label>
              <MultiSelect
                options={unidadesFiltradas.map(u => ({
                  id: u.id.toString(),
                  nombre: u.nombre_servicio,
                  zona_nombre: u.zona_nombre,
                  zona_id: u.zona_id,
                  tiene_menu: u.tiene_menu
                }))}
                selectedValues={selectedUnidades}
                onChange={handleUnidadesChange}
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

                {/* Indicador de unidad de servicio seleccionada */}
                {selectedRecetas.size > 0 && (() => {
                  const recetasSeleccionadas = Array.from(selectedRecetas).map(idUnico => {
                    const idRelacion = extraerIdRelacion(idUnico);
                    const unidadServicio = extraerUnidadServicio(idUnico);
                    return transformRecetasToTableData(recetasAgrupadas).find(r => r.id === idRelacion && r.unidad_servicio === unidadServicio);
                  }).filter(Boolean);

                  const unidadServicioSeleccionada = recetasSeleccionadas[0]?.unidad_servicio;

                  return (
                    <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                        <span className="text-sm font-medium text-blue-800">
                          Unidad de servicio seleccionada: <strong>{unidadServicioSeleccionada}</strong>
                        </span>
                      </div>
                      <p className="text-xs text-blue-600 mt-1">
                        Solo se muestran recetas de esta unidad de servicio. Deselecciona todas para ver todas las opciones.
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
                      groupBy={['unidad_servicio', 'nombre_servicio_id']}
                      groupDisplayNames={getGroupDisplayName}
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
                      isItemSelected={isItemSelected}
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
                  disabled={selectedRecetas.size === 0 || selectedUnidades.length === 0 || !selectedContrato}
                >
                  <ArrowRight className="w-4 h-4 mr-2" />
                  Asignar Recetas a las Unidades
                </Button>
              </div>
            </div>

            {/* Columna derecha - Recetas Asignadas */}
            <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
              <div className="bg-teal-50 p-4 border-b border-teal-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-teal-100 rounded-lg flex items-center justify-center">
                      <Check className="w-4 h-4 text-teal-600" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">
                        Recetas Asignadas
                      </h3>
                      <p className="text-gray-600 text-sm">
                        {asignacionesUnidades.length > 0
                          ? `${asignacionesUnidades[0]?.recetas.length || 0} recetas asignadas a ${asignacionesUnidades.length} unidades`
                          : 'No hay recetas asignadas'
                        }
                      </p>
                    </div>
                  </div>
                  {asignacionesUnidades.length > 0 && (
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={handleMostrarConfirmacion}
                        disabled={isSaving}
                        className="text-green-600 hover:text-green-700 hover:bg-green-50"
                      >
                        <Check className="w-3 h-3 mr-1" />
                        {isSaving ? 'Guardando...' : 'Guardar'}
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={limpiarFormulario}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50 px-2"
                      >
                        <X className="w-3 h-3" />
                      </Button>
                    </div>
                  )}
                </div>
              </div>

              <div className="min-h-96">
                {asignacionesUnidades.length > 0 ? (
                  <div className="p-4">
                    <div className="space-y-4">
                      {asignacionesUnidades.map((asignacion, index) => (
                        <div
                          key={`${asignacion.contratoId}-${asignacion.unidadId}`}
                          className="bg-gray-50 border border-gray-200 rounded-lg p-4 hover:shadow-sm transition-all"
                        >
                          {/* Información de la unidad */}
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                                <MapPin className="w-4 h-4 text-blue-600" />
                              </div>
                              <div>
                                <h5 className="text-sm font-medium text-gray-900">
                                  {asignacion.unidadNombre}
                                </h5>
                                <p className="text-xs text-gray-500">
                                  Zona: {asignacion.zonaNombre} | Contrato: {asignacion.contratoNombre}
                                </p>
                              </div>
                            </div>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setAsignacionesUnidades(prev => prev.filter((_, i) => i !== index));
                              }}
                              className="text-red-600 hover:text-red-700 hover:bg-red-50"
                            >
                              <X className="w-4 h-4" />
                            </Button>
                          </div>

                          {/* Lista de recetas asignadas */}
                          <div className="space-y-2">
                            <h6 className="text-xs font-medium text-gray-700 mb-2">
                              Recetas asignadas ({asignacion.recetas.length}):
                            </h6>
                            <div className="grid grid-cols-1 gap-2">
                              {asignacion.recetas.map((receta, recetaIndex) => (
                                <div
                                  key={`${asignacion.unidadId}-${receta.id}-${recetaIndex}`}
                                  className="flex items-center justify-between bg-white border border-gray-100 rounded-lg p-2"
                                >
                                  <div className="flex items-center gap-2">
                                    <div className="w-2 h-2 bg-teal-500 rounded-full"></div>
                                    <span className="text-xs text-gray-700">{receta.nombre_receta}</span>
                                    <span className="text-xs text-gray-400">({receta.codigo})</span>
                                  </div>
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => {
                                      console.log('=== ELIMINANDO RECETA ===');
                                      console.log('Receta a eliminar:', receta);
                                      console.log('ID de la receta:', receta.id);
                                      console.log('Unidad actual:', asignacion.unidadId);
                                      console.log('Recetas antes de eliminar:', asignacion.recetas.map(r => ({ id: r.id, nombre: r.nombre_receta })));

                                      // Remover receta específica solo de esta unidad
                                      setAsignacionesUnidades(prev => {
                                        console.log('Asignaciones antes:', prev.map(u => ({ unidad: u.unidadId, recetas: u.recetas.map(r => r.id) })));

                                        const updated = prev.map(unit => {
                                          if (unit.unidadId === asignacion.unidadId) {
                                            const filteredRecetas = unit.recetas.filter(r => (r as any).uniqueId !== (receta as any).uniqueId);
                                            console.log('Recetas filtradas para unidad', unit.unidadId, ':', filteredRecetas.map(r => ({ id: r.id, uniqueId: (r as any).uniqueId, nombre: r.nombre_receta })));
                                            return { ...unit, recetas: filteredRecetas };
                                          }
                                          return unit;
                                        });

                                        // Filtrar unidades que no tengan recetas asignadas
                                        const updatedWithFilteredUnits = updated.filter(unit => unit.recetas.length > 0);
                                        
                                        console.log('Asignaciones después:', updatedWithFilteredUnits.map(u => ({ unidad: u.unidadId, recetas: u.recetas.map(r => r.id) })));
                                        
                                        // Verificar si la receta existe en otras unidades después de la actualización
                                        const recetaExisteEnOtrasUnidades = updatedWithFilteredUnits.some(unit => 
                                          unit.unidadId !== asignacion.unidadId && 
                                          unit.recetas.some(r => (r as any).uniqueId === (receta as any).uniqueId)
                                        );

                                        console.log('¿Receta existe en otras unidades?', recetaExisteEnOtrasUnidades);

                                        // Si no existe en otras unidades, desmarcar del catálogo
                                        if (!recetaExisteEnOtrasUnidades) {
                                          // Buscar la receta original en recetasAgrupadas
                                          const recetaOriginal = recetasAgrupadas.find(r => r.id === receta.id && r.unidad_servicio === receta.unidad_servicio);
                                          if (recetaOriginal) {
                                            const recetaIdUnico = generarIdUnico(recetaOriginal.id, recetaOriginal.unidad_servicio);
                                            console.log('Desmarcando del catálogo:', recetaIdUnico);
                                            setSelectedRecetas(prevSelected => {
                                              const newSet = new Set(prevSelected);
                                              newSet.delete(recetaIdUnico);
                                              console.log('Recetas seleccionadas después:', Array.from(newSet));
                                              return newSet;
                                            });
                                          }
                                        }
                                        
                                        return updatedWithFilteredUnits;
                                      });
                                    }}
                                    className="text-red-500 hover:text-red-700 hover:bg-red-50 p-1 h-6 w-6"
                                  >
                                    <X className="w-3 h-3" />
                                  </Button>
                                </div>
                              ))}
                            </div>
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
                      Sin Asignaciones
                    </h4>
                    <p className="text-sm text-gray-500 max-w-xs">
                      Las recetas que seleccione y asigne aparecerán aquí organizadas por unidad de servicio
                    </p>
                    <div className="mt-4 flex items-center gap-2 text-xs text-gray-400">
                      <ArrowRight className="w-3 h-3" />
                      <span>Seleccione recetas y haga clic en "Asignar"</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Diálogo de confirmación para guardar */}
      {showConfirmDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex items-center mb-4">
              <div className="flex-shrink-0">
                <Check className="w-6 h-6 text-green-600" />
              </div>
              <div className="ml-3">
                <h3 className="text-lg font-medium text-gray-900">
                  Confirmar guardado
                </h3>
              </div>
            </div>
            
            <div className="mb-4">
              <p className="text-sm text-gray-600">
                ¿Estás seguro de que deseas guardar las siguientes asignaciones?
              </p>
              
              <div className="mt-3 bg-gray-50 rounded-md p-3">
                <div className="text-sm">
                  <p><strong>Contrato:</strong> {asignacionesUnidades[0]?.contratoNombre}</p>
                  <p><strong>Unidades:</strong> {asignacionesUnidades.length}</p>
                  <p><strong>Total de asignaciones:</strong> {asignacionesUnidades.reduce((total, unidad) => total + unidad.recetas.length, 0)}</p>
                </div>
              </div>
            </div>

            <div className="flex justify-end space-x-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowConfirmDialog(false)}
                disabled={isSaving}
              >
                Cancelar
              </Button>
              <Button
                type="button"
                onClick={handleGuardarAsignaciones}
                disabled={isSaving}
                className="bg-green-600 hover:bg-green-700 text-white"
              >
                {isSaving ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Guardando...
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4 mr-2" />
                    Confirmar guardado
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AsignarMenusPage;
