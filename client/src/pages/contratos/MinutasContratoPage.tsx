import React, { useState, useEffect } from 'react';
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
  Building2
} from 'lucide-react';
import { ContratosService, ContratoView } from '../../services/contratosService';
import { useToast } from '../../hooks/use-toast';
import { useGlobalLoading } from '../../contexts/GlobalLoadingContext';
import { supabase } from '../../services/supabaseClient';

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

  const filteredOptions = options.filter(option =>
    option.nombre.toLowerCase().includes(searchTerm.toLowerCase()) &&
    !selectedValues.includes(option.id)
  );

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
    <div className="relative">
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
    await cargarMenusPorZona(zonaId);
  };

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

                      {/* Sección de Grupos/Zonas Seleccionados */}
                      <div className="mb-6">
                        <div className="bg-gray-100 border border-gray-300 rounded-lg p-6">
                          <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                            <MapPin className="w-5 h-5 text-teal-600" />
                            Grupos/Zonas Seleccionados
                          </h3>
                          <div className="text-gray-600 mb-4 text-center">
                            <span className="font-medium">{zonasSeleccionadas.length}</span> Grupos/Zonas de {zonasDisponibles.length}
                          </div>
                          
                          {/* Tarjetas de Zonas Seleccionadas */}
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {zonasSeleccionadas.map((zonaId, index) => {
                              const zona = zonasDisponibles.find(z => z.id === zonaId);
                              if (!zona) return null;
                              
                              return (
                                <div 
                                  key={zonaId}
                                  onClick={() => handleZonaClick(zonaId)}
                                  className={`bg-cyan-600 text-white p-4 rounded-lg cursor-pointer transition-all duration-200 hover:bg-cyan-700 ${
                                    zonaActiva === zonaId ? 'ring-4 ring-cyan-300 shadow-lg' : ''
                                  }`}
                                >
                                  <div className="text-center">
                                    <div className="font-bold text-lg mb-2">
                                      NO PPL. {Math.floor(Math.random() * 9000) + 1000}
                                    </div>
                                    <div className="text-sm mb-3">
                                      {zona.nombre}
                                    </div>
                                    <button 
                                      className="bg-white text-cyan-600 px-4 py-2 rounded-md font-medium hover:bg-gray-100 transition-colors"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        // Aquí puedes agregar la lógica para ver unidades
                                      }}
                                    >
                                      Ver Unidades
                                    </button>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      </div>

                      {/* Sección de Menús de la Zona Seleccionada */}
                      {zonaActiva ? (
                        <div className="mb-6">
                          <div className="bg-white border border-gray-300 rounded-lg p-6">
                            <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                              <UtensilsCrossed className="w-5 h-5 text-teal-600" />
                              Menús de la Zona Seleccionada
                            </h3>
                            
                            {/* Tabs para Menu Estándar y Especial */}
                            <div className="flex border-b border-gray-200 mb-4">
                              <button 
                                onClick={() => setActiveMenuTab('estandar')}
                                className={`px-4 py-2 text-sm font-medium transition-colors ${
                                  activeMenuTab === 'estandar' 
                                    ? 'text-blue-600 border-b-2 border-blue-600' 
                                    : 'text-gray-500 hover:text-gray-700'
                                }`}
                              >
                                MENU ESTANDAR
                              </button>
                              <button 
                                onClick={() => setActiveMenuTab('especial')}
                                className={`px-4 py-2 text-sm font-medium transition-colors ${
                                  activeMenuTab === 'especial' 
                                    ? 'text-blue-600 border-b-2 border-blue-600' 
                                    : 'text-gray-500 hover:text-gray-700'
                                }`}
                              >
                                MENU ESPECIAL
                              </button>
                            </div>

                            {/* Header del Calendario */}
                            <div className="bg-blue-100 p-4 rounded-t-lg">
                              <div className="text-center text-blue-800 font-semibold mb-2">Ciclos del Contrato</div>
                              <div className="text-center text-blue-900 text-lg font-bold mb-2">
                                {contratoSeleccionado?.['No. Días'] || menusZona.length} Ciclos Configurados
                              </div>
                              <div className={`grid gap-2 text-sm text-blue-700`} style={{ gridTemplateColumns: `repeat(${menusZona.length}, 1fr)` }}>
                                {menusZona.map((menu, index) => (
                                  <div key={menu.id} className="text-center">
                                    Ciclo {menu.ciclo}
                                  </div>
                                ))}
                              </div>
                            </div>

                            {/* Tabla de Menús */}
                            <div className="border border-gray-300 rounded-b-lg overflow-hidden">
                              <table className="w-full">
                                <thead>
                                  <tr className="bg-gray-50">
                                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 border-r border-gray-300">
                                      COMPONENTE/MENU
                                    </th>
                                    {menusZona.map((menu, index) => (
                                      <th 
                                        key={menu.id} 
                                        className={`px-4 py-3 text-center text-sm font-semibold text-gray-700 ${
                                          index < menusZona.length - 1 ? 'border-r border-gray-300' : ''
                                        }`}
                                      >
                                        Menu {menu.ciclo}
                                      </th>
                                    ))}
                                  </tr>
                                </thead>
                                <tbody>
                                  {/* DESAYUNO */}
                                  <tr>
                                    <td className="px-4 py-3 bg-green-100 font-semibold text-gray-800 border-r border-gray-300" rowSpan={6}>
                                      DESAYUNO
                                    </td>
                                    {menusZona.map((menu, index) => {
                                      const desayuno = menu.componentes.find(c => c.nombre === 'DESAYUNO');
                                      return (
                                        <td 
                                          key={menu.id} 
                                          className={`px-4 py-2 text-center text-sm bg-blue-50 ${
                                            index < menusZona.length - 1 ? 'border-r border-gray-300' : ''
                                          }`}
                                        >
                                          {desayuno?.items[0]?.fruta || '-'}
                                        </td>
                                      );
                                    })}
                                  </tr>
                                  <tr>
                                    {menusZona.map((menu, index) => {
                                      const desayuno = menu.componentes.find(c => c.nombre === 'DESAYUNO');
                                      return (
                                        <td 
                                          key={menu.id} 
                                          className={`px-4 py-2 text-center text-sm bg-blue-50 ${
                                            index < menusZona.length - 1 ? 'border-r border-gray-300' : ''
                                          }`}
                                        >
                                          {desayuno?.items[0]?.cereal || '-'}
                                        </td>
                                      );
                                    })}
                                  </tr>
                                  <tr>
                                    {menusZona.map((menu, index) => {
                                      const desayuno = menu.componentes.find(c => c.nombre === 'DESAYUNO');
                                      return (
                                        <td 
                                          key={menu.id} 
                                          className={`px-4 py-2 text-center text-sm bg-blue-50 ${
                                            index < menusZona.length - 1 ? 'border-r border-gray-300' : ''
                                          }`}
                                        >
                                          {desayuno?.items[0]?.bebida || '-'}
                                        </td>
                                      );
                                    })}
                                  </tr>
                                  <tr>
                                    {menusZona.map((menu, index) => {
                                      const desayuno = menu.componentes.find(c => c.nombre === 'DESAYUNO');
                                      return (
                                        <td 
                                          key={menu.id} 
                                          className={`px-4 py-2 text-center text-sm bg-blue-50 ${
                                            index < menusZona.length - 1 ? 'border-r border-gray-300' : ''
                                          }`}
                                        >
                                          {desayuno?.items[0]?.sopa || '-'}
                                        </td>
                                      );
                                    })}
                                  </tr>
                                  <tr>
                                    {menusZona.map((menu, index) => {
                                      const desayuno = menu.componentes.find(c => c.nombre === 'DESAYUNO');
                                      return (
                                        <td 
                                          key={menu.id} 
                                          className={`px-4 py-2 text-center text-sm bg-blue-50 ${
                                            index < menusZona.length - 1 ? 'border-r border-gray-300' : ''
                                          }`}
                                        >
                                          {desayuno?.items[0]?.proteina || '-'}
                                        </td>
                                      );
                                    })}
                                  </tr>
                                  <tr>
                                    {menusZona.map((menu, index) => (
                                      <td 
                                        key={menu.id} 
                                        className={`px-4 py-2 text-center text-sm bg-blue-50 ${
                                          index < menusZona.length - 1 ? 'border-r border-gray-300' : ''
                                        }`}
                                      >
                                        -
                                      </td>
                                    ))}
                                  </tr>

                                  {/* ALMUERZO */}
                                  <tr>
                                    <td className="px-4 py-3 bg-orange-100 font-semibold text-gray-800 border-r border-gray-300" rowSpan={3}>
                                      ALMUERZO
                                    </td>
                                    {menusZona.map((menu, index) => {
                                      const almuerzo = menu.componentes.find(c => c.nombre === 'ALMUERZO');
                                      return (
                                        <td 
                                          key={menu.id} 
                                          className={`px-4 py-2 text-center text-sm bg-orange-50 ${
                                            index < menusZona.length - 1 ? 'border-r border-gray-300' : ''
                                          }`}
                                        >
                                          {almuerzo?.items[0]?.bebida || '-'}
                                        </td>
                                      );
                                    })}
                                  </tr>
                                  <tr>
                                    {menusZona.map((menu, index) => {
                                      const almuerzo = menu.componentes.find(c => c.nombre === 'ALMUERZO');
                                      return (
                                        <td 
                                          key={menu.id} 
                                          className={`px-4 py-2 text-center text-sm bg-orange-50 ${
                                            index < menusZona.length - 1 ? 'border-r border-gray-300' : ''
                                          }`}
                                        >
                                          {almuerzo?.items[0]?.sopa || '-'}
                                        </td>
                                      );
                                    })}
                                  </tr>
                                  <tr>
                                    {menusZona.map((menu, index) => {
                                      const almuerzo = menu.componentes.find(c => c.nombre === 'ALMUERZO');
                                      return (
                                        <td 
                                          key={menu.id} 
                                          className={`px-4 py-2 text-center text-sm bg-orange-50 ${
                                            index < menusZona.length - 1 ? 'border-r border-gray-300' : ''
                                          }`}
                                        >
                                          {almuerzo?.items[0]?.proteina || '-'}
                                        </td>
                                      );
                                    })}
                                  </tr>
                                </tbody>
                              </table>
                            </div>
                          </div>
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
                                Haz clic en una de las zonas seleccionadas arriba para visualizar sus menús
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
