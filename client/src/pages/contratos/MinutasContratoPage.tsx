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
         className={`w-full px-3 py-2 text-left border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 ${
           disabled ? 'bg-gray-100 cursor-not-allowed' : 'bg-white cursor-pointer hover:border-gray-400'
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
    option.nombre.toLowerCase().includes(searchTerm.toLowerCase()) &&
    !selectedValues.includes(option.id)
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
        className="w-full px-3 py-2 text-left border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 bg-white cursor-pointer hover:border-gray-400"
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
          <div className="p-2">
            <Input
              type="text"
              placeholder="Buscar zonas..."
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
                onClick={() => toggleOption(option.id)}
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

const MinutasContratoPage: React.FC = () => {
  const { toast } = useToast();
  const { showLoading, hideLoading } = useGlobalLoading();
  
  const [contratosDisponibles, setContratosDisponibles] = useState<ContratoView[]>([]);
  const [selectedContrato, setSelectedContrato] = useState<string>('');
  const [contratoSeleccionado, setContratoSeleccionado] = useState<ContratoView | null>(null);
  const [zonasDisponibles, setZonasDisponibles] = useState<{ id: string; nombre: string }[]>([]);
  const [zonasSeleccionadas, setZonasSeleccionadas] = useState<string[]>([]);
  const [menusZona, setMenusZona] = useState<any[]>([]);
  const [activeMenuTab, setActiveMenuTab] = useState<'estandar' | 'especial'>('estandar');
  const [zonaActiva, setZonaActiva] = useState<string>('');
  const [unidadesConMenus, setUnidadesConMenus] = useState<UnidadConMenu[]>([]);
  const [cargandoUnidades, setCargandoUnidades] = useState(false);
  const [overlayVisible, setOverlayVisible] = useState<string | null>(null);
  const [unidadesOverlay, setUnidadesOverlay] = useState<UnidadConMenu[]>([]);

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
    setZonasSeleccionadas([]);
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

  const handleZonaChange = async (zonas: string[]) => {
    setZonasSeleccionadas(zonas);
    setZonaActiva(''); // Reset zona activa
    
    if (zonas.length > 0) {
      // Cargar menús de la primera zona seleccionada
      await cargarMenusPorZona(zonas[0]);
    } else {
      setMenusZona([]);
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

  const cerrarOverlay = () => {
    setOverlayVisible(null);
    setUnidadesOverlay([]);
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
    if (zonasSeleccionadas.length === 0) {
      toast({
        title: "Seleccione zonas",
        description: "Debe seleccionar al menos una zona para guardar la configuración",
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
      <div className="container mx-auto p-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Datos del Contrato</h1>
          <p className="text-gray-600">Información y configuración del contrato seleccionado</p>
        </div>

       <Card>
         <CardHeader>
           <CardTitle className="flex items-center gap-2">
             <FileText className="w-5 h-5 text-teal-600" />
             Datos del Contrato
           </CardTitle>
         </CardHeader>
                   <CardContent className="p-6 pt-0">
          

                                           {/* Información del Contrato */}
                      <div className="grid grid-cols-6 gap-4 mb-6 scale-90 origin-top">
                        {/* Row 1: N° Contrato, Nit Cliente, Objeto */}
                        <div className="col-span-3">
                          <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                            <FileText className="w-4 h-4 text-gray-600" />
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
                          <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                            <Building2 className="w-4 h-4 text-gray-600" />
                            Nit Cliente
                          </label>
                          <Input
                            value={contratoSeleccionado?.['NIT'] || ''}
                            readOnly
                            className="bg-white border-gray-300 text-gray-900 font-medium cursor-default"
                          />
                        </div>

                        <div className="col-span-2">
                          <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                            <MapPin className="w-4 h-4 text-gray-600" />
                            Objeto
                          </label>
                          <Input
                            value={contratoSeleccionado?.['Entidad / Contratante:FLT'] || ''}
                            readOnly
                            className="bg-white border-gray-300 text-gray-900 font-medium cursor-default"
                          />
                        </div>

                        {/* Row 2: Sede, N° PPL, N° Servicios, Fecha Inicial, Fecha Final */}
                        <div className="col-span-2">
                          <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                            <MapPin className="w-4 h-4 text-gray-600" />
                            Sede
                          </label>
                          <Input
                            value={contratoSeleccionado?.['Sede:width[300]'] || ''}
                            readOnly
                            className="bg-white border-gray-300 text-gray-900 font-medium cursor-default"
                          />
                        </div>

                        <div className="col-span-1">
                          <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                            <Users className="w-4 h-4 text-gray-600" />
                            N° PPL
                          </label>
                          <Input
                            value={contratoSeleccionado?.['PPL:colspan:[Cantidades x Dia]']?.toString() || ''}
                            readOnly
                            className="bg-white border-gray-300 text-gray-900 font-medium cursor-default"
                          />
                        </div>

                        <div className="col-span-1">
                          <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                            <Settings className="w-4 h-4 text-gray-600" />
                            N° Servicios
                          </label>
                          <Input
                            value={contratoSeleccionado?.['Servicios:colspan:[Cantidades x Dia]']?.toString() || ''}
                            readOnly
                            className="bg-white border-gray-300 text-gray-900 font-medium cursor-default"
                          />
                        </div>

                        <div className="col-span-1">
                          <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-gray-600" />
                            Fecha Inicial
                          </label>
                          <Input
                            value={contratoSeleccionado?.['Inicial:DT:colspan:[Fechas del Contrato]:width[110]'] || ''}
                            readOnly
                            className="bg-white border-gray-300 text-gray-900 font-medium cursor-default"
                          />
                        </div>

                        <div className="col-span-1">
                          <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-gray-600" />
                            Fecha Final
                          </label>
                          <Input
                            value={contratoSeleccionado?.['Final:DT:colspan:[Fechas del Contrato]'] || ''}
                            readOnly
                            className="bg-white border-gray-300 text-gray-900 font-medium cursor-default"
                          />
                        </div>

                        {/* Row 3: Cantidades por día y Grupos/Zonas */}
                        <div className="col-span-1">
                          <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                            <Settings className="w-4 h-4 text-gray-600" />
                            # Servicios/Dia
                          </label>
                          <Input
                            value={contratoSeleccionado?.['Servicios:colspan:[Cantidades x Dia]']?.toString() || ''}
                            readOnly
                            className="bg-white border-gray-300 text-gray-900 font-medium cursor-default"
                          />
                        </div>

                        <div className="col-span-1">
                          <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                            <Users className="w-4 h-4 text-gray-600" />
                            # Raciones/Dia
                          </label>
                          <Input
                            value={contratoSeleccionado?.['Raciones:colspan:[Cantidades x Dia]']?.toString() || ''}
                            readOnly
                            className="bg-white border-gray-300 text-gray-900 font-medium cursor-default"
                          />
                        </div>

                        <div className="col-span-1">
                          <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-gray-600" />
                            N° Dias
                          </label>
                          <Input
                            value={contratoSeleccionado?.['PPL:colspan:[Cantidades x Dia]']?.toString() || ''}
                            readOnly
                            className="bg-white border-gray-300 text-gray-900 font-medium cursor-default"
                          />
                        </div>

                        <div className="col-span-3">
                          <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                            <MapPin className="w-4 h-4 text-indigo-600" />
                            Grupos / Zonas
                          </label>
                          <MultiSelect
                            options={zonasDisponibles}
                            selectedValues={zonasSeleccionadas}
                            onChange={handleZonaChange}
                            placeholder="Seleccionar zonas..."
                          />
                        </div>
                      </div>

                      {/* Sección de Grupos/Zonas Seleccionados - Compacta */}
                      {zonasSeleccionadas.length > 0 && (
                        <div className="mb-4">
                          <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                            <h3 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                              <MapPin className="w-4 h-4 text-teal-600" />
                              Zonas Seleccionadas ({zonasSeleccionadas.length})
                            </h3>
                            
                            {/* Lista compacta de zonas con overlay desplegable */}
                            <div className="flex flex-wrap gap-2">
                              {zonasSeleccionadas.map((zonaId) => {
                                const zona = zonasDisponibles.find(z => z.id === zonaId);
                                if (!zona) return null;
                                
                                return (
                                  <div 
                                    key={zonaId}
                                    className={`zona-container relative bg-white border border-gray-300 rounded-lg p-2 cursor-pointer transition-all duration-200 hover:shadow-md ${
                                      zonaActiva === zonaId ? 'border-teal-500 bg-teal-50' : 'hover:border-gray-400'
                                    }`}
                                  >
                                    <div className="flex items-center justify-between gap-2 min-w-0">
                                      <div className="flex-1 min-w-0">
                                        <div 
                                          className="text-xs font-medium text-gray-800 truncate cursor-pointer"
                                          onClick={() => handleZonaClick(zonaId)}
                                          title="Hacer clic para ver calendario"
                                        >
                                          {zona.nombre}
                                        </div>
                                        <div className="text-xs text-gray-500">
                                          NO PPL. {Math.floor(Math.random() * 9000) + 1000}
                                        </div>
                                      </div>
                                      <button 
                                        className="bg-teal-100 text-teal-700 px-2 py-1 rounded text-xs font-medium hover:bg-teal-200 transition-colors flex items-center gap-1"
                                        onClick={(e) => handleVerUnidades(zonaId, e)}
                                        title="Ver unidades de servicio"
                                      >
                                        <Eye className="w-3 h-3" />
                                        Ver Unidades
                                      </button>
                                    </div>

                                    {/* Overlay desplegable */}
                                    {overlayVisible === zonaId && (
                                      <div className="overlay-unidades absolute top-full left-0 mt-1 z-50 bg-white border border-blue-200 rounded-lg shadow-lg min-w-64 max-w-80 animate-in slide-in-from-top-2 duration-200">
                                        {/* Header del overlay */}
                                        <div className="bg-blue-600 text-white px-3 py-2 rounded-t-lg">
                                          <h4 className="text-sm font-semibold flex items-center gap-2">
                                            <Users className="w-4 h-4" />
                                            Unidades de Servicio
                                          </h4>
                                        </div>

                                        {/* Contenido del overlay */}
                                        <div className="p-2 max-h-64 overflow-y-auto">
                                          {cargandoUnidades ? (
                                            <div className="text-center py-4">
                                              <div className="text-gray-500">
                                                <Users className="w-6 h-6 mx-auto mb-2 text-gray-400 animate-pulse" />
                                                <p className="text-xs">Cargando unidades...</p>
                                              </div>
                                            </div>
                                          ) : unidadesOverlay.length > 0 ? (
                                            <div className="space-y-1">
                                              {unidadesOverlay.map((unidad) => (
                                                <div key={unidad.unidad_id} className="flex items-center gap-2 text-xs text-blue-800 hover:bg-blue-50 p-1 rounded">
                                                  <div className="w-1.5 h-1.5 bg-blue-600 rounded-full flex-shrink-0"></div>
                                                  <span className="font-medium">NO PPL.</span>
                                                  <Users className="w-3 h-3 text-blue-600 flex-shrink-0" />
                                                  <span className="font-semibold">{Math.floor(Math.random() * 9000) + 1000}</span>
                                                  <div className="ml-auto text-blue-700 truncate">
                                                    LA PICOTA - {unidad.unidad_nombre.toUpperCase()}
                                                  </div>
                                                </div>
                                              ))}
                                            </div>
                                          ) : (
                                            <div className="text-center py-4">
                                              <div className="text-gray-500">
                                                <Users className="w-6 h-6 mx-auto mb-2 text-gray-400" />
                                                <p className="text-xs">No hay unidades</p>
                                              </div>
                                            </div>
                                          )}
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Sección de Calendario de Menús */}
                      {zonaActiva ? (
                        <div className="mb-6">
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
                                  ingredientes: menu.ingredientes || []
                                }))
                              }))}
                            />
                          )}
                        </div>
                      ) : zonasSeleccionadas.length > 0 ? (
                        <div className="mb-6">
                          <div className="bg-blue-50 border border-blue-200 rounded-lg p-8 text-center">
                            <div className="text-blue-600">
                              <div className="w-16 h-16 mx-auto mb-4 bg-blue-100 rounded-full flex items-center justify-center">
                                <UtensilsCrossed className="w-8 h-8 text-blue-500" />
                              </div>
                              <h4 className="text-lg font-semibold text-blue-700 mb-2">
                                Selecciona una Zona
                              </h4>
                              <p className="text-sm text-blue-600">
                                Haz clic en una de las zonas seleccionadas arriba para visualizar el calendario de menús
                              </p>
                            </div>
                          </div>
                        </div>
                      ) : null}

                      {/* Botón Guardar */}
                      <div className="flex justify-end">
                        <Button
                          onClick={handleGuardarMinutas}
                          className="bg-teal-600 hover:bg-teal-700 text-white"
                          disabled={zonasSeleccionadas.length === 0}
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
