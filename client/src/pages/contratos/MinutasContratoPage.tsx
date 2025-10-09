import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Badge } from '../../components/ui/badge';
import {
  FileText,
  MapPin,
  Calendar,
  DollarSign,
  Users,
  Settings,
  Search,
  Check,
  X,
  ArrowRight,
  Package,
  UtensilsCrossed,
  Building2,
  Eye
} from 'lucide-react';
import { ContratosService, ContratoView } from '../../services/contratosService';
import { MinutasService, UnidadConMenu } from '../../services/minutasService';
import { useToast } from '../../hooks/use-toast';
import { useGlobalLoading } from '../../contexts/GlobalLoadingContext';
import { supabase } from '../../services/supabaseClient';
import MenuCalendarDetailed from '../../components/MenuCalendarDetailed';

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
  const selectRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const filtered = options.filter(option =>
      option.nombre.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredOptions(filtered);
  }, [searchTerm, options]);

  // Cerrar select al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (selectRef.current && !selectRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSearchTerm('');
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const selectedOption = options.find(option => option.id === value);

  return (
    <div className="relative" ref={selectRef}>
      <button
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className={`w-full px-2 py-1.5 text-left border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 text-sm h-8 ${disabled ? 'bg-gray-100 cursor-not-allowed' : 'bg-white cursor-pointer hover:border-gray-400'
          }`}
      >
        {selectedOption ? (
          <span className="truncate block" title={selectedOption.nombre}>
            {selectedOption.nombre}
          </span>
        ) : (
          <span className="text-gray-500">{placeholder}</span>
        )}
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
  options: { id: string; nombre: string }[];
  selectedValues: string[];
  onChange: (values: string[]) => void;
  placeholder: string;
}

const MultiSelect: React.FC<MultiSelectProps> = ({
  options,
  selectedValues,
  onChange,
  placeholder
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const multiSelectRef = useRef<HTMLDivElement>(null);

  const filteredOptions = options.filter(option =>
    option.nombre.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Cerrar select al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (multiSelectRef.current && !multiSelectRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSearchTerm('');
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
    <div className="relative" ref={multiSelectRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-2 py-1.5 text-left border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 bg-white cursor-pointer hover:border-gray-400 text-sm min-h-8"
      >
        {selectedValues.length > 0 ? (
          <div className="flex flex-wrap gap-1">
            {selectedValues.map(id => {
              const option = options.find(o => o.id === id);
              return (
                <Badge key={id} variant="secondary" className="text-xs">
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

      {isOpen && (
        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg">
          <div className="p-3">
            <Input
              type="text"
              placeholder="Buscar zonas..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="mb-2 h-8 text-sm"
            />
          </div>
          <div className="max-h-60 overflow-auto px-2 pb-2">
            {(() => {
              // Agrupar opciones por zona (simulando zonas)
              const groupedOptions = filteredOptions.reduce((groups, option) => {
                // Extraer el código de zona del nombre (formato: "CODIGO - NOMBRE")
                const match = option.nombre.match(/^([^-]+)\s*-\s*(.+)$/);
                const zona = match ? match[1].trim() : 'Sin Código';

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

const MinutasContratoPage: React.FC = () => {
  const { toast } = useToast();
  const { showLoading, hideLoading } = useGlobalLoading();

  const [contratosDisponibles, setContratosDisponibles] = useState<ContratoView[]>([]);
  const [selectedContrato, setSelectedContrato] = useState<string>('');
  const [contratoSeleccionado, setContratoSeleccionado] = useState<ContratoView | null>(null);
  const [zonasDisponibles, setZonasDisponibles] = useState<{ id: string; nombre: string }[]>([]);
  const [zonaSeleccionada, setZonaSeleccionada] = useState<string>('');
  const [menusZona, setMenusZona] = useState<any[]>([]);
  const [activeMenuTab, setActiveMenuTab] = useState<'estandar' | 'especial'>('estandar');
  const [zonaActiva, setZonaActiva] = useState<string>('');
  const [unidadesConMenus, setUnidadesConMenus] = useState<UnidadConMenu[]>([]);
  const [cargandoUnidades, setCargandoUnidades] = useState(false);
  const [overlayVisible, setOverlayVisible] = useState<string | null>(null);
  const [unidadesOverlay, setUnidadesOverlay] = useState<UnidadConMenu[]>([]);
  const [pplPorZona, setPplPorZona] = useState<Record<string, number>>({});

  useEffect(() => {
    cargarContratos();
  }, []);

  const cargarContratos = async () => {
    try {
      const response = await ContratosService.getContratos();
      if (response.data) {
        setContratosDisponibles(response.data);
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

  const cargarZonasPorContrato = async (contratoId: number) => {
    try {
      console.log('🔍 Cargando zonas para contrato ID:', contratoId);

      // Consultar las zonas relacionadas al contrato
      const { data, error } = await supabase
        .from('prod_zonas_by_contrato')
        .select(`
          id_zona,
          prod_zonas_contrato (
            id,
            nombre,
            codigo
          )
        `)
        .eq('id_contrato', contratoId);

      if (error) {
        console.error('❌ Error consultando zonas:', error);
        setZonasDisponibles([]);
        return;
      }

      console.log('📊 Zonas encontradas:', data);

      if (data && data.length > 0) {
        const zonas = data.map(item => ({
          id: item.prod_zonas_contrato.id.toString(),
          nombre: `${item.prod_zonas_contrato.codigo} - ${item.prod_zonas_contrato.nombre}`
        }));
        setZonasDisponibles(zonas);
      } else {
        // Si no hay zonas específicas, mostrar todas las zonas disponibles
        const { data: todasZonas, error: errorZonas } = await supabase
          .from('prod_zonas_contrato')
          .select('id, nombre, codigo')
          .order('nombre');

        if (!errorZonas && todasZonas) {
          const zonas = todasZonas.map(zona => ({
            id: zona.id.toString(),
            nombre: `${zona.codigo} - ${zona.nombre}`
          }));
          setZonasDisponibles(zonas);
        } else {
          setZonasDisponibles([]);
        }
      }
    } catch (error) {
      console.error('❌ Error cargando zonas del contrato:', error);
      setZonasDisponibles([]);
    }
  };

  const cargarMenusPorZona = async (zonaId: string) => {
    try {
      console.log('🍽️ Cargando menús para zona ID:', zonaId);

      // Obtener el número de ciclos del contrato seleccionado
      const noCiclos = contratoSeleccionado?.['No. Días'] || 15;
      console.log('📅 Número de ciclos del contrato:', noCiclos);

      // Generar menús dinámicos basados en el número de ciclos
      const menusDinamicos = [];

      for (let ciclo = 1; ciclo <= noCiclos; ciclo++) {
        const menu = {
          id: ciclo,
          tipo: 'estandar',
          ciclo: ciclo,
          componentes: [
            {
              nombre: 'DESAYUNO',
              items: [
                {
                  dia: ciclo,
                  fruta: `FRUTA CICLO ${ciclo}`,
                  cereal: `CEREAL CICLO ${ciclo}`,
                  bebida: `BEBIDA CICLO ${ciclo}`,
                  sopa: `SOPA CICLO ${ciclo}`,
                  proteina: `PROTEINA CICLO ${ciclo}`
                }
              ]
            },
            {
              nombre: 'ALMUERZO',
              items: [
                {
                  dia: ciclo,
                  bebida: `BEBIDA CICLO ${ciclo}`,
                  sopa: `SOPA CICLO ${ciclo}`,
                  proteina: `PROTEINA CICLO ${ciclo}`,
                  cereal: `CEREAL CICLO ${ciclo}`
                }
              ]
            }
          ]
        };

        menusDinamicos.push(menu);
      }

      setMenusZona(menusDinamicos);
      console.log('📋 Menús dinámicos generados:', menusDinamicos);
    } catch (error) {
      console.error('❌ Error cargando menús de la zona:', error);
      setMenusZona([]);
    }
  };

  const handleContratoChange = async (contratoValue: string) => {
    console.log('🔄 Cambiando contrato a:', contratoValue);
    setSelectedContrato(contratoValue);
    setZonaSeleccionada('');
    setZonaActiva('');
    setMenusZona([]);

    if (contratoValue) {
      // Buscar por ID del contrato
      const contrato = contratosDisponibles.find(c => c.id?.toString() === contratoValue);

      console.log('📋 Contrato seleccionado:', contrato);

      if (contrato) {
        setContratoSeleccionado(contrato);
        await cargarZonasPorContrato(contrato.id || 0);
      } else {
        console.log('❌ No se encontró el contrato o no tiene ID');
        setContratoSeleccionado(null);
        setZonasDisponibles([]);
      }
    } else {
      setContratoSeleccionado(null);
      setZonasDisponibles([]);
    }
  };

  const handleZonaChange = async (zonaId: string) => {
    setZonaSeleccionada(zonaId);

    if (zonaId) {
      // Ejecutar automáticamente el click en la zona
      await handleZonaClick(zonaId);
    } else {
      setZonaActiva('');
      setMenusZona([]);
      setUnidadesConMenus([]);
    }
  };

  const handleZonaClick = async (zonaId: string) => {
    setZonaActiva(zonaId);
    setCargandoUnidades(true);

    try {
      // Cargar menús dinámicos (código existente)
      await cargarMenusPorZona(zonaId);

      // Cargar unidades reales con menús asignados
      if (contratoSeleccionado?.id) {
        console.log('🔍 Cargando unidades para zona:', zonaId, 'contrato:', contratoSeleccionado.id);

        const response = await MinutasService.getUnidadesConMenusPorZona(
          contratoSeleccionado.id,
          parseInt(zonaId)
        );

        if (response.data) {
          setUnidadesConMenus(response.data);
          console.log('✅ Unidades con menús cargadas:', response.data);

          // Guardar el PPL total para esta zona
          setPplPorZona(prev => ({
            ...prev,
            [zonaId]: response.data.length // Cada unidad representa 1 PPL
          }));

          // Debug: Log de cada unidad y sus menús
          response.data.forEach((unidad, index) => {
            console.log(`📋 Unidad ${index + 1}:`, {
              id: unidad.unidad_id,
              nombre: unidad.unidad_nombre,
              menusCount: unidad.menus.length,
              menus: unidad.menus.map(menu => ({
                nombre: menu.nombre_receta,
                tipo: menu.nombre_servicio,
                ingredientes: menu.ingredientes
              }))
            });
          });
        } else if (response.error) {
          console.error('❌ Error cargando unidades con menús:', response.error);
          setUnidadesConMenus([]);
        }
      } else {
        console.log('⚠️ No hay contrato seleccionado');
        setUnidadesConMenus([]);
      }
    } catch (error) {
      console.error('❌ Error inesperado:', error);
      setUnidadesConMenus([]);
    } finally {
      setCargandoUnidades(false);
    }
  };

  const handleVerUnidades = async (zonaId: string, event: React.MouseEvent) => {
    event.stopPropagation();

    // Si ya está abierto, cerrarlo
    if (overlayVisible === zonaId) {
      setOverlayVisible(null);
      setUnidadesOverlay([]);
      return;
    }

    setOverlayVisible(zonaId);
    setCargandoUnidades(true);

    try {
      // Cargar unidades para el overlay
      if (contratoSeleccionado?.id) {
        const response = await MinutasService.getUnidadesConMenusPorZona(
          contratoSeleccionado.id,
          parseInt(zonaId)
        );

        if (response.data) {
          setUnidadesOverlay(response.data);
          console.log('✅ Unidades para overlay cargadas:', response.data);
        } else if (response.error) {
          console.error('❌ Error cargando unidades para overlay:', response.error);
          setUnidadesOverlay([]);
        }
      }
    } catch (error) {
      console.error('❌ Error inesperado cargando unidades para overlay:', error);
      setUnidadesOverlay([]);
    } finally {
      setCargandoUnidades(false);
    }
  };

  const handleSoloVerUnidades = async (zonaId: string) => {
    // Función específica para el botón del ojito que NO ejecuta handleZonaClick
    // Si ya está abierto, cerrarlo
    if (overlayVisible === zonaId) {
      setOverlayVisible(null);
      setUnidadesOverlay([]);
      return;
    }

    setOverlayVisible(zonaId);
    setCargandoUnidades(true);

    try {
      // Cargar unidades para el overlay
      if (contratoSeleccionado?.id) {
        const response = await MinutasService.getUnidadesConMenusPorZona(
          contratoSeleccionado.id,
          parseInt(zonaId)
        );

        if (response.data) {
          setUnidadesOverlay(response.data);
          console.log('✅ Unidades para overlay cargadas:', response.data);

          // Guardar el PPL total para esta zona (si no se había guardado antes)
          setPplPorZona(prev => ({
            ...prev,
            [zonaId]: prev[zonaId] || response.data.length // Solo actualizar si no existe
          }));
        } else if (response.error) {
          console.error('❌ Error cargando unidades para overlay:', response.error);
          setUnidadesOverlay([]);
        }
      }
    } catch (error) {
      console.error('❌ Error inesperado cargando unidades para overlay:', error);
      setUnidadesOverlay([]);
    } finally {
      setCargandoUnidades(false);
    }
  };

  const cerrarOverlay = () => {
    setOverlayVisible(null);
    setUnidadesOverlay([]);
  };

  // Función para calcular el PPL total de una zona
  const calcularPPLPorZona = (zonaId: string): number => {
    // Retornar el PPL guardado para esta zona, o 0 si no se ha calculado
    return pplPorZona[zonaId] || 0;
  };

  // Cerrar overlay al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (!target.closest('.zona-container') && !target.closest('.overlay-unidades')) {
        cerrarOverlay();
      }
    };

    if (overlayVisible) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [overlayVisible]);

  const handleGuardarMinutas = () => {
    if (!zonaSeleccionada) {
      toast({
        title: "Seleccione una zona",
        description: "Debe seleccionar una zona para guardar la configuración",
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Configuración guardada",
      description: "La configuración del contrato se ha guardado correctamente",
    });
  };

  return (
    <div className="p-4 max-w-full mx-auto">

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-teal-600" />
            Datos del Contrato
          </CardTitle>
        </CardHeader>
        <CardContent className="p-3 pt-0">


          {/* Información del Contrato */}
          <div className="grid grid-cols-6 gap-2 mb-3">
            {/* Row 1: N° Contrato, Nit Cliente, Objeto */}
            <div className="col-span-3">
              <label className="text-xs font-semibold text-gray-700 mb-1 flex items-center gap-1">
                <FileText className="w-3 h-3 text-gray-600" />
                N°.Contrato
              </label>
              <SelectWithSearch
                options={contratosDisponibles.map(c => ({
                  id: c.id?.toString() || '0',
                  nombre: `(No. ${c['No Contrato']}) ${c['Entidad / Contratante:FLT']?.toUpperCase()}`
                }))}
                value={selectedContrato}
                onChange={handleContratoChange}
                placeholder="Seleccione un contrato..."
              />
            </div>

            <div className="col-span-1">
              <label className="text-xs font-semibold text-gray-700 mb-1 flex items-center gap-1">
                <Building2 className="w-3 h-3 text-gray-600" />
                Nit Cliente
              </label>
              <Input
                value={contratoSeleccionado?.['NIT'] || ''}
                readOnly
                className="bg-gray-50 border-gray-300 text-gray-900 font-medium cursor-default h-8 text-sm"
              />
            </div>

            <div className="col-span-2">
              <label className="text-xs font-semibold text-gray-700 mb-1 flex items-center gap-1">
                <MapPin className="w-3 h-3 text-gray-600" />
                Objeto
              </label>
              <Input
                value={contratoSeleccionado?.['Entidad / Contratante:FLT'] || ''}
                readOnly
                className="bg-gray-50 border-gray-300 text-gray-900 font-medium cursor-default h-8 text-sm"
              />
            </div>

            {/* Row 2: Sede, N° PPL, N° Servicios, Fecha Inicial, Fecha Final */}
            <div className="col-span-2">
              <label className="text-xs font-semibold text-gray-700 mb-1 flex items-center gap-1">
                <MapPin className="w-3 h-3 text-gray-600" />
                Sede
              </label>
              <Input
                value={contratoSeleccionado?.['Sede:width[300]'] || ''}
                readOnly
                className="bg-gray-50 border-gray-300 text-gray-900 font-medium cursor-default h-8 text-sm"
              />
            </div>

            <div className="col-span-1">
              <label className="text-xs font-semibold text-gray-700 mb-1 flex items-center gap-1">
                <Users className="w-3 h-3 text-gray-600" />
                N° PPL
              </label>
              <Input
                value={contratoSeleccionado?.['PPL:colspan:[Cantidades x Dia]']?.toString() || ''}
                readOnly
                className="bg-gray-50 border-gray-300 text-gray-900 font-medium cursor-default h-8 text-sm"
              />
            </div>

            <div className="col-span-1">
              <label className="text-xs font-semibold text-gray-700 mb-1 flex items-center gap-1">
                <Settings className="w-3 h-3 text-gray-600" />
                N° Servicios
              </label>
              <Input
                value={contratoSeleccionado?.['Servicios:colspan:[Cantidades x Dia]']?.toString() || ''}
                readOnly
                className="bg-gray-50 border-gray-300 text-gray-900 font-medium cursor-default h-8 text-sm"
              />
            </div>

            <div className="col-span-1">
              <label className="text-xs font-semibold text-gray-700 mb-1 flex items-center gap-1">
                <Calendar className="w-3 h-3 text-gray-600" />
                Fecha Inicial
              </label>
              <Input
                value={contratoSeleccionado?.['Inicial:DT:colspan:[Fechas del Contrato]:width[110]'] || ''}
                readOnly
                className="bg-gray-50 border-gray-300 text-gray-900 font-medium cursor-default h-8 text-sm"
              />
            </div>

            <div className="col-span-1">
              <label className="text-xs font-semibold text-gray-700 mb-1 flex items-center gap-1">
                <Calendar className="w-3 h-3 text-gray-600" />
                Fecha Final
              </label>
              <Input
                value={contratoSeleccionado?.['Final:DT:colspan:[Fechas del Contrato]'] || ''}
                readOnly
                className="bg-gray-50 border-gray-300 text-gray-900 font-medium cursor-default h-8 text-sm"
              />
            </div>

            {/* Row 3: Cantidades por día y Grupos/Zonas */}
            <div className="col-span-1">
              <label className="text-xs font-semibold text-gray-700 mb-1 flex items-center gap-1">
                <Settings className="w-3 h-3 text-gray-600" />
                # Servicios/Dia
              </label>
              <Input
                value={contratoSeleccionado?.['Servicios:colspan:[Cantidades x Dia]']?.toString() || ''}
                readOnly
                className="bg-gray-50 border-gray-300 text-gray-900 font-medium cursor-default h-8 text-sm"
              />
            </div>

            <div className="col-span-1">
              <label className="text-xs font-semibold text-gray-700 mb-1 flex items-center gap-1">
                <Users className="w-3 h-3 text-gray-600" />
                # Raciones/Dia
              </label>
              <Input
                value={contratoSeleccionado?.['Raciones:colspan:[Cantidades x Dia]']?.toString() || ''}
                readOnly
                className="bg-gray-50 border-gray-300 text-gray-900 font-medium cursor-default h-8 text-sm"
              />
            </div>

            <div className="col-span-1">
              <label className="text-xs font-semibold text-gray-700 mb-1 flex items-center gap-1">
                <Calendar className="w-3 h-3 text-gray-600" />
                N° Dias
              </label>
              <Input
                value={contratoSeleccionado?.['PPL:colspan:[Cantidades x Dia]']?.toString() || ''}
                readOnly
                className="bg-gray-50 border-gray-300 text-gray-900 font-medium cursor-default h-8 text-sm"
              />
            </div>

            <div className="col-span-3">
              <label className="text-xs font-semibold text-gray-700 mb-1 flex items-center gap-1">
                <MapPin className="w-3 h-3 text-indigo-600" />
                Grupos / Zonas
              </label>
              <SelectWithSearch
                options={zonasDisponibles}
                value={zonaSeleccionada}
                onChange={handleZonaChange}
                placeholder="Seleccionar zona..."
                disabled={!selectedContrato}
              />
            </div>
          </div>

          {/* Sección de Calendario de Menús - Con más espaciado */}
          {zonaActiva ? (
            <div className="mt-8 mb-6">
              {cargandoUnidades ? (
                <div className="bg-white border border-gray-300 rounded-lg p-8 text-center">
                  <div className="text-gray-500">
                    <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                      <UtensilsCrossed className="w-8 h-8 text-gray-400 animate-pulse" />
                    </div>
                    <h4 className="text-lg font-semibold text-gray-700 mb-2">
                      Cargando menús...
                    </h4>
                    <p className="text-sm text-gray-600">
                      Obteniendo unidades de servicio y menús asignados
                    </p>
                  </div>
                </div>
              ) : (
                <MenuCalendarDetailed
                  zonaId={zonaActiva}
                  zonaNombre={zonasDisponibles.find(z => z.id === zonaActiva)?.nombre || 'Zona'}
                  fechaEjecucion={contratoSeleccionado?.['Ejecucion:DT:colspan:[Fechas del Contrato]'] || new Date().toISOString().split('T')[0]}
                  unidadesMenus={unidadesConMenus.map(unidad => ({
                    unidad_id: unidad.unidad_id,
                    unidad_nombre: unidad.unidad_nombre,
                    fecha_inicio: unidad.menus[0]?.fecha_asignacion || new Date().toISOString().split('T')[0],
                    menus: unidad.menus.map(menu => ({
                      id: menu.id_producto,
                      nombre: menu.nombre_receta,
                      tipo: menu.nombre_servicio as 'DESAYUNO' | 'ALMUERZO' | 'CENA' | 'REFRIGERIO',
                      codigo: menu.codigo,
                      ingredientes: menu.ingredientes || [],
                      ingredientes_detallados: menu.ingredientes_detallados || []
                    }))
                  }))}
                />
              )}
            </div>
          ) : null}

          {/* Botón Guardar */}
          <div className="flex justify-end mt-6">
            <Button
              onClick={handleGuardarMinutas}
              className="bg-teal-600 hover:bg-teal-700 text-white"
              disabled={!zonaSeleccionada}
            >
              <Check className="w-4 h-4 mr-2" />
              Guardar Configuración
            </Button>
          </div>


        </CardContent>
      </Card>

    </div>
  );
};

export default MinutasContratoPage;
