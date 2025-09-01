import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Formik, Form, Field, ErrorMessage } from 'formik';
import * as Yup from 'yup';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Input } from '../../components/ui/input';
import { Badge } from '../../components/ui/badge';
import { Tabs as UITabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '../../components/ui/alert-dialog';
import {
  ArrowLeft,
  Save,
  User,
  FileText,
  MapPin,
  Settings,
  Plus,
  X,
  Trash2,
  ChevronDown,
  Search,
  Check,
  ChevronRight,
  Filter,
  ArrowRight,
  RefreshCw,
  Edit3,
  AlertCircle,
  Coffee,
  UtensilsCrossed,
  Moon,
  Cookie,
  Beef,
  Wheat,
  Droplets,
  Carrot,
  Sparkles,
  Package
} from 'lucide-react';
import { SucursalesService, Sucursal } from '../../services/sucursalesService';
import { ZonasService, Zona } from '../../services/zonasService';
import { ContratosCRUDService, ContratoCRUD, ZonaContrato } from '../../services/contratosCRUDService';
import { ContratosService } from '../../services/contratosService';
import { UnidadesServicioService, UnidadServicio } from '../../services/unidadesServicioService';
import { ProductosService, ComponenteMenu, Producto } from '../../services/productosService';
import { supabase } from '../../services/supabaseClient';
import { useToast } from '../../hooks/use-toast';
import { useGlobalLoading } from '../../contexts/GlobalLoadingContext';
import TercerosModal from '../../components/TercerosModal';
import { Tercero } from '../../services/tercerosService';

const createValidationSchema = (isEditing: boolean) => Yup.object({
  nit: isEditing ? Yup.string() : Yup.string().required("NIT es requerido"),
  nombreCliente: isEditing ? Yup.string() : Yup.string().required("Nombre del cliente es requerido"),
  observacion: Yup.string(),
  codigo: Yup.string().required("Código es requerido"),
  objetoContrato: Yup.string().required("Objeto del contrato es requerido"),
  noContrato: Yup.string().required("Número de contrato es requerido"),
  fechaInicial: Yup.string().required("Fecha inicial es requerida"),
  fechaFinal: Yup.string().required("Fecha final es requerida"),
  fechaEjecucion: Yup.string().required("Fecha de ejecución es requerida"),
  valorContrato: Yup.string().required("Valor del contrato es requerido"),
  noPpl: Yup.string().required("Número PPL es requerido"),
  noCiclos: Yup.string().required("Número de ciclos es requerido"),
  noServicios: Yup.string().required("Número de servicios es requerido"),
  estadoProceso: Yup.string().required("Estado del proceso es requerido"),
  sedeAdministrativa: Yup.string().required("Sede administrativa es requerida"),
  zona: Yup.string(), // No obligatorio
  noPplZona: Yup.string(), // No obligatorio
  clausulas: Yup.string(), // No obligatorio
});

interface ZonaLocal {
  id: string;
  codigo: string;
  nombre: string;
  noPpl: string;
}

interface ContratoFormData {
  nit: string;
  nombreCliente: string;
  observacion: string;
  codigo: string;
  objetoContrato: string;
  noContrato: string;
  fechaInicial: string;
  fechaFinal: string;
  fechaEjecucion: string;
  valorContrato: string;
  noPpl: string;
  noCiclos: string;
  noServicios: string;
  estadoProceso: string;
  sedeAdministrativa: string;
  zona: string;
  noPplZona: string;
  zonas: ZonaLocal[];
  clausulas: string;
}

// Datos mock para los selects
const estadosProceso = [
  { id: 'ABIERTO', nombre: 'ABIERTO' },
  { id: 'CERRADO', nombre: 'CERRADO' },
  { id: 'EN PROCESO', nombre: 'EN PROCESO' },
  { id: 'EN PRODUCCION', nombre: 'EN PRODUCCION' },
  { id: 'SUSPENDIDO', nombre: 'SUSPENDIDO' },
  { id: 'PENDIENTE', nombre: 'PENDIENTE' },
  { id: 'APROBADO', nombre: 'APROBADO' },
  { id: 'INACTIVO', nombre: 'INACTIVO' }
];

const sedesAdministrativas = [
  { id: '1', nombre: 'SEDE ADMINISTRATIVA COTA' },
  { id: '2', nombre: 'SEDE OPERATIVA BOGOTÁ' },
  { id: '3', nombre: 'SEDE REGIONAL MEDELLÍN' },
  { id: '4', nombre: 'SEDE NORTE BARRANQUILLA' },
  { id: '5', nombre: 'SEDE SUR CALI' },
  { id: '6', nombre: 'SEDE CENTRO MANIZALES' }
];

const zonas = [
  { id: '1', nombre: 'ZONA NORTE' },
  { id: '2', nombre: 'ZONA SUR' },
  { id: '3', nombre: 'ZONA ESTE' },
  { id: '4', nombre: 'ZONA OESTE' },
  { id: '5', nombre: 'ZONA CENTRO' },
  { id: '6', nombre: 'ZONA METROPOLITANA' }
];

// Datos mock para contratos y unidades
const contratos = [
  { id: '1', nombre: 'CONTRATO 001 - SERVICIOS ALIMENTARIOS' },
  { id: '2', nombre: 'CONTRATO 002 - MANTENIMIENTO GENERAL' },
  { id: '3', nombre: 'CONTRATO 003 - LIMPIEZA Y ASEO' },
  { id: '4', nombre: 'CONTRATO 004 - SEGURIDAD Y VIGILANCIA' },
  { id: '5', nombre: 'CONTRATO 005 - TRANSPORTE Y LOGÍSTICA' }
];

const unidadesServicio = [
  { id: '1', nombre: 'UNIDAD ADMINISTRATIVA COTA' },
  { id: '2', nombre: 'UNIDAD OPERATIVA BOGOTÁ' },
  { id: '3', nombre: 'UNIDAD REGIONAL MEDELLÍN' },
  { id: '4', nombre: 'UNIDAD NORTE BARRANQUILLA' },
  { id: '5', nombre: 'UNIDAD SUR CALI' },
  { id: '6', nombre: 'UNIDAD CENTRO MANIZALES' },
  { id: '7', nombre: 'UNIDAD METROPOLITANA' },
  { id: '8', nombre: 'UNIDAD ESPECIALIZADA' }
];

// Interfaces para menús
interface MenuItem {
  id: string;
  nombre: string;
  tipo: 'desayuno' | 'almuerzo' | 'cena' | 'refrigerio';
  seleccionado: boolean;
}

interface MenuTipo {
  id: string;
  nombre: string;
  tipo: 'desayuno' | 'almuerzo' | 'cena' | 'refrigerio';
  items: MenuItem[];
  expandido: boolean;
}

interface MenuGroup {
  id: string;
  nombre: string;
  tipos: MenuTipo[];
  expandido: boolean;
}

// Datos mock para menús con 3 niveles
const menuGroups: MenuGroup[] = [
  {
    id: '1',
    nombre: 'MENU BUEN PASTOR',
    expandido: false,
    tipos: [
      {
        id: 'desayuno-1',
        nombre: 'DESAYUNO',
        tipo: 'desayuno',
        expandido: false,
        items: [
          { id: '1', nombre: 'AVENA CON 2 GALLETAS Y MANDARINA', tipo: 'desayuno', seleccionado: false },
          { id: '2', nombre: 'PURE PAPA, JUGO MANGO Y UNA MANZANA', tipo: 'desayuno', seleccionado: false },
          { id: '3', nombre: 'PLATANO MADURO CON ENSALADA Y AVENA', tipo: 'desayuno', seleccionado: false },
          { id: '4', nombre: 'TAJADA PLATANO VERDE, JUGO CURUBA Y UVAS', tipo: 'desayuno', seleccionado: false },
          { id: '5', nombre: 'TORTA DE CHOCOLATE CON JUGO FRESA', tipo: 'desayuno', seleccionado: false }
        ]
      },
      {
        id: 'almuerzo-1',
        nombre: 'ALMUERZO',
        tipo: 'almuerzo',
        expandido: false,
        items: [
          { id: '6', nombre: 'ARROZ CON POLLO Y ENSALADA', tipo: 'almuerzo', seleccionado: false },
          { id: '7', nombre: 'CARNE ASADA CON PAPAS', tipo: 'almuerzo', seleccionado: false },
          { id: '8', nombre: 'PESCADO CON ARROZ', tipo: 'almuerzo', seleccionado: false },
          { id: '9', nombre: 'PASTA CON SALSA TOMATE', tipo: 'almuerzo', seleccionado: false },
          { id: '10', nombre: 'ENSALADA CESAR CON POLLO', tipo: 'almuerzo', seleccionado: false }
        ]
      },
      {
        id: 'cena-1',
        nombre: 'CENA',
        tipo: 'cena',
        expandido: false,
        items: [
          { id: '11', nombre: 'SANDWICH DE POLLO CON ENSALADA', tipo: 'cena', seleccionado: false },
          { id: '12', nombre: 'SOPA DE VERDURAS CON PAN', tipo: 'cena', seleccionado: false },
          { id: '13', nombre: 'ENSALADA DE FRUTAS CON YOGUR', tipo: 'cena', seleccionado: false },
          { id: '14', nombre: 'TORTILLA DE ESPINACAS', tipo: 'cena', seleccionado: false },
          { id: '15', nombre: 'QUESADILLA DE QUESO', tipo: 'cena', seleccionado: false }
        ]
      }
    ]
  },
  {
    id: '2',
    nombre: 'MENU CONVITA ALTA',
    expandido: false,
    tipos: [
      {
        id: 'desayuno-2',
        nombre: 'DESAYUNO',
        tipo: 'desayuno',
        expandido: false,
        items: [
          { id: '16', nombre: 'AREPA CON HUEVO Y QUESO', tipo: 'desayuno', seleccionado: false },
          { id: '17', nombre: 'PAN CON MANTEQUILLA Y JUGO', tipo: 'desayuno', seleccionado: false }
        ]
      },
      {
        id: 'almuerzo-2',
        nombre: 'ALMUERZO',
        tipo: 'almuerzo',
        expandido: false,
        items: [
          { id: '18', nombre: 'BANDEJA PAISA', tipo: 'almuerzo', seleccionado: false },
          { id: '19', nombre: 'AJIACO CON AGUACATE', tipo: 'almuerzo', seleccionado: false }
        ]
      },
      {
        id: 'cena-2',
        nombre: 'CENA',
        tipo: 'cena',
        expandido: false,
        items: [
          { id: '20', nombre: 'CALDO DE POLLO', tipo: 'cena', seleccionado: false },
          { id: '21', nombre: 'ENSALADA DE ATUN', tipo: 'cena', seleccionado: false }
        ]
      }
    ]
  }
];

// Componente Select con Search
interface SelectWithSearchProps {
  options: { id: string; nombre: string }[];
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  label?: string;
  disabled?: boolean;
}

const SelectWithSearch: React.FC<SelectWithSearchProps> = ({ options, value, onChange, placeholder, label, disabled = false }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const selectRef = useRef<HTMLDivElement>(null);

  const filteredOptions = options.filter(option =>
    option.nombre.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const selectedOption = options.find(option => option.nombre === value);

  // Cerrar select al hacer click afuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (selectRef.current && !selectRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSearchTerm('');
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <div className="relative" ref={selectRef}>
      {label && <label className="block text-sm text-gray-700 mb-1">{label}</label>}
      <div className="relative">
        <button
          type="button"
          onClick={() => !disabled && setIsOpen(!isOpen)}
          className={`w-full px-2 py-1.5 border border-gray-300 rounded flex items-center justify-between focus:ring-2 focus:ring-cyan-500 focus:border-transparent text-sm ${disabled
            ? 'bg-gray-100 cursor-not-allowed opacity-60'
            : 'bg-yellow-50 hover:bg-yellow-100'
            }`}
          disabled={disabled}
        >
          <span className={selectedOption ? 'text-gray-900' : 'text-gray-500'}>
            {selectedOption ? selectedOption.nombre : placeholder}
          </span>
          <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </button>

        {isOpen && !disabled && (
          <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-hidden">
            <div className="p-2 border-b border-gray-200">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Buscar..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-8 pr-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-teal-500"
                />
              </div>
            </div>
            <div className="max-h-48 overflow-y-auto">
              {filteredOptions.map((option) => (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => {
                    onChange(option.nombre);
                    setIsOpen(false);
                    setSearchTerm('');
                  }}
                  className="w-full px-3 py-2 text-left text-sm hover:bg-teal-50 hover:text-teal-700 focus:bg-teal-50 focus:text-teal-700"
                >
                  {option.nombre}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// Componente MultiSelect
interface MultiSelectProps {
  options: { id: string; nombre: string }[];
  selectedValues: string[];
  onChange: (values: string[]) => void;
  placeholder: string;
  label?: string;
}

const MultiSelect: React.FC<MultiSelectProps> = ({ options, selectedValues, onChange, placeholder, label }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const multiSelectRef = useRef<HTMLDivElement>(null);

  const filteredOptions = options.filter(option =>
    option.nombre.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const selectedOptions = options.filter(option => selectedValues.includes(option.nombre));

  // Cerrar select al hacer click afuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (multiSelectRef.current && !multiSelectRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSearchTerm('');
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleToggleOption = (optionNombre: string) => {
    const newSelectedValues = selectedValues.includes(optionNombre)
      ? selectedValues.filter(value => value !== optionNombre)
      : [...selectedValues, optionNombre];
    onChange(newSelectedValues);
  };

  const handleRemoveOption = (optionNombre: string) => {
    onChange(selectedValues.filter(value => value !== optionNombre));
  };

  return (
    <div className="relative" ref={multiSelectRef}>
      {label && <label className="block text-sm text-gray-700 mb-1">{label}</label>}
      <div className="relative">
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="w-full px-2 py-1.5 border border-gray-300 rounded bg-yellow-50 flex items-center justify-between focus:ring-2 focus:ring-cyan-500 focus:border-transparent text-sm min-h-[38px]"
        >
          <div className="flex flex-wrap gap-1 flex-1">
            {selectedOptions.length > 0 ? (
              selectedOptions.map((option) => (
                <span
                  key={option.id}
                  className="inline-flex items-center gap-1 bg-teal-100 text-teal-800 text-xs px-2 py-1 rounded"
                >
                  {option.nombre}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRemoveOption(option.nombre);
                    }}
                    className="text-teal-600 hover:text-teal-800"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))
            ) : (
              <span className="text-gray-500">{placeholder}</span>
            )}
          </div>
          <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </button>

        {isOpen && (
          <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-hidden">
            <div className="p-2 border-b border-gray-200">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Buscar..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-8 pr-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-teal-500"
                />
              </div>
            </div>
            <div className="max-h-48 overflow-y-auto">
              {filteredOptions.map((option) => (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => handleToggleOption(option.nombre)}
                  className={`w-full px-3 py-2 text-left text-sm flex items-center gap-2 hover:bg-teal-50 hover:text-teal-700 focus:bg-teal-50 focus:text-teal-700 ${selectedValues.includes(option.nombre) ? 'bg-teal-50 text-teal-700' : ''
                    }`}
                >
                  <input
                    type="checkbox"
                    checked={selectedValues.includes(option.nombre)}
                    onChange={() => { }} // Controlled by parent
                    className="rounded border-gray-300 text-teal-600 focus:ring-teal-500"
                  />
                  {option.nombre}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

interface ContratoFormProps {
  contratoEnEdicion?: ContratoCRUD | null;
  onCancel?: () => void;
  onSave?: () => void;
}

interface Contrato {
  id: string;
  item: string;
  sede: string;
  noContrato: string;
  entidad: string;
  nit: string;
  fechaInicial: string;
  fechaFinal: string;
  fechaEjecucion: string;
  serviciosPorDia: number;
  valorTotal: number;
  estado: string;
}

const ContratoForm: React.FC<ContratoFormProps> = ({ contratoEnEdicion, onCancel, onSave }) => {
  const { toast } = useToast();
  const { showLoading, hideLoading } = useGlobalLoading();
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [activeTab, setActiveTab] = useState('general');
  const [zonasAgregadas, setZonasAgregadas] = useState<ZonaLocal[]>([]);
  const [selectedZona, setSelectedZona] = useState<string>('');
  const [showZonaDropdown, setShowZonaDropdown] = useState(false);

  const [sucursales, setSucursales] = useState<Sucursal[]>([]);
  const [zonasDisponibles, setZonasDisponibles] = useState<Zona[]>([]);
  const [contratosDisponibles, setContratosDisponibles] = useState<ContratoCRUD[]>([]);
  const [unidadesServicio, setUnidadesServicio] = useState<UnidadServicio[]>([]);
  const [unidadesFiltradas, setUnidadesFiltradas] = useState<UnidadServicio[]>([]);
  const [componentesMenu, setComponentesMenu] = useState<ComponenteMenu[]>([]);
  const [menusAsignados, setMenusAsignados] = useState<{ id: number, nombre: string }[]>([]);
  const [filterText, setFilterText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [pendingFormData, setPendingFormData] = useState<ContratoFormData | null>(null);
  const [showTercerosModal, setShowTercerosModal] = useState(false);
  const [terceroSeleccionado, setTerceroSeleccionado] = useState<Tercero | null>(null);
  const [terceroIdSeleccionado, setTerceroIdSeleccionado] = useState<number | null>(null);

  // Estados para asignación de menús
  const [menus, setMenus] = useState<MenuGroup[]>(menuGroups);
  const [selectedTipoMenu, setSelectedTipoMenu] = useState<string | null>(null);
  const [selectedContrato, setSelectedContrato] = useState<string>('');
  const [selectedUnidades, setSelectedUnidades] = useState<string[]>([]);

  // Cargar datos iniciales
  useEffect(() => {
    const cargarDatosIniciales = async () => {
      showLoading('Cargando datos del formulario...');
      try {
        // Cargar sucursales
        const sucursalesResponse = await SucursalesService.getSucursales();
        if (sucursalesResponse.data) {
          setSucursales(sucursalesResponse.data);
        }

        // Cargar zonas disponibles
        const zonasResponse = await ZonasService.getZonas();
        if (zonasResponse.data) {
          setZonasDisponibles(zonasResponse.data);
        }

        // Cargar contratos disponibles desde prod_contratos directamente para obtener el objetivo
        const { data: contratosData, error: contratosError } = await supabase
          .from('prod_contratos')
          .select('id, no_contrato, objetivo, estado')
          .eq('estado', 1)
          .order('id', { ascending: false });

        if (contratosData && !contratosError) {
          // Transformar los datos a ContratoCRUD para el select
          const contratosParaSelect = contratosData.map(contrato => ({
            id: contrato.id,
            no_contrato: contrato.no_contrato || '',
            objetivo: contrato.objetivo || '', // Objetivo real de la base de datos
            // Campos mínimos requeridos para ContratoCRUD
            id_tercero: 0,
            id_usuario: 0,
            id_sucursal: 0,
            codigo: '',
            fecha_final: '',
            fecha_inicial: '',
            fecha_arranque: '',
            observacion: '',
            tasa_impuesto: 0,
            valor_contrato: 0,
            estado: 1,
            no_ppl: 0,
            no_ciclos: 0,
            no_servicios: 0,
            estado_proceso: ''
          }));
          setContratosDisponibles(contratosParaSelect);
        }

        // Cargar unidades de servicio
        const unidadesResponse = await UnidadesServicioService.getUnidadesServicio();
        if (unidadesResponse.data) {
          setUnidadesServicio(unidadesResponse.data);
          setUnidadesFiltradas(unidadesResponse.data); // Inicialmente mostrar todas
        }

        // Cargar productos reales organizados por componente de menú
        const productosResponse = await ProductosService.getProductosPorComponente();
        if (productosResponse.data) {
          setComponentesMenu(productosResponse.data);
          console.log('✅ Componentes de menú cargados:', productosResponse.data);
        }
      } catch (error) {
        console.error('Error cargando datos iniciales:', error);
      } finally {
        hideLoading();
      }
    };

    cargarDatosIniciales();
  }, []);

  // Simular carga de recursos al editar
  useEffect(() => {
    const cargarZonasContrato = async () => {
      if (contratoEnEdicion?.id) {
        showLoading('Cargando zonas del contrato...');
        try {
          // Cargar zonas reales desde prod_zonas_by_contrato
          const response = await ContratosService.getZonasContrato(contratoEnEdicion.id);

          if (!response.error && response.data) {
            // Transformar al formato ZonaLocal
            const zonasReales: ZonaLocal[] = response.data.map((zona: any, index: number) => ({
              id: (index + 1).toString(),
              codigo: zona.Codigo || '',
              nombre: zona.Nombre || '',
              noPpl: zona['No PPL']?.toString() || '0'
            }));

            setZonasAgregadas(zonasReales);
          }
        } catch (error) {
          console.error('Error cargando zonas del contrato:', error);
        } finally {
          hideLoading();
        }
      }
    };

    if (contratoEnEdicion) {
      // Inicializar ID del tercero si estamos editando
      if (contratoEnEdicion.id_tercero) {
        setTerceroIdSeleccionado(contratoEnEdicion.id_tercero);
      }

      // Preseleccionar el contrato actual en el tab de asignación usando el nuevo formato
      setSelectedContrato(`(No. ${contratoEnEdicion.no_contrato}) ${contratoEnEdicion.objetivo.toUpperCase()}`);

      // Las unidades se cargarán automáticamente por el useEffect de selectedContrato
      cargarZonasContrato();
    }
  }, [contratoEnEdicion]);

  // useEffect para cargar unidades cuando cambie el contrato seleccionado
  useEffect(() => {
    const cargarUnidadesDelContratoSeleccionado = async () => {
      console.log('🔄 useEffect selectedContrato ejecutándose');
      console.log('📊 Estado actual - selectedContrato:', selectedContrato);
      console.log('📊 Estado actual - contratosDisponibles:', contratosDisponibles.length);
      console.log('📊 Estado actual - contratoEnEdicion:', contratoEnEdicion?.id);

      if (selectedContrato && contratosDisponibles.length > 0) {
        console.log('✅ Condiciones cumplidas, buscando contrato...');

        // Encontrar el contrato seleccionado usando el formato
        const contratoSeleccionado = contratosDisponibles.find(c =>
          `(No. ${c.no_contrato}) ${c.objetivo.toUpperCase()}` === selectedContrato
        );

        console.log('🎯 Contrato encontrado para cargar unidades:', contratoSeleccionado);

        if (contratoSeleccionado && contratoSeleccionado.id) {
          console.log('📡 Cargando unidades automáticamente para contrato ID:', contratoSeleccionado.id);

          try {
            const unidadesDelContrato = await getUnidadesPorContrato(contratoSeleccionado.id);
            console.log('📋 Unidades cargadas automáticamente:', unidadesDelContrato);
            setUnidadesFiltradas(unidadesDelContrato);

            // Si estamos editando, también preseleccionar las unidades
            if (contratoEnEdicion && contratoEnEdicion.id === contratoSeleccionado.id) {
              const nombresUnidades = unidadesDelContrato.map(unidad => unidad.nombre_servicio);
              console.log('📝 Preseleccionando unidades del contrato en edición:', nombresUnidades);
              setSelectedUnidades(nombresUnidades);
            } else {
              console.log('ℹ️ No estamos editando o IDs no coinciden');
              // Si no estamos editando, limpiar selecciones previas
              setSelectedUnidades([]);
            }
          } catch (error) {
            console.error('Error cargando unidades automáticamente:', error);
            setUnidadesFiltradas([]);
          }
        } else {
          console.log('❌ No se encontró contrato válido o sin ID');
          setUnidadesFiltradas([]);
          setSelectedUnidades([]);
        }
      } else {
        console.log('🚫 Condiciones no cumplidas para cargar unidades');
        console.log('   - selectedContrato:', !!selectedContrato);
        console.log('   - contratosDisponibles.length:', contratosDisponibles.length);
        setUnidadesFiltradas([]);
        setSelectedUnidades([]);
      }
    };

    // Agregar un pequeño delay para asegurar que los datos estén cargados
    const timer = setTimeout(() => {
      cargarUnidadesDelContratoSeleccionado();
    }, 100);

    return () => clearTimeout(timer);
  }, [selectedContrato, contratosDisponibles, contratoEnEdicion]);

  console.log('ContratoForm - contratoEnEdicion recibido:', contratoEnEdicion); // Debug

  const initialValues: ContratoFormData = {
    nit: contratoEnEdicion?.nit || '', // NIT desde la base de datos
    nombreCliente: contratoEnEdicion?.nombre_cliente || '', // Nombre desde la base de datos
    observacion: contratoEnEdicion?.observacion || '',
    codigo: contratoEnEdicion?.codigo || '002',
    objetoContrato: contratoEnEdicion?.objetivo || '',
    noContrato: contratoEnEdicion?.no_contrato || '', // Número desde la base de datos
    fechaInicial: contratoEnEdicion?.fecha_inicial || '', // Fecha desde la base de datos
    fechaFinal: contratoEnEdicion?.fecha_final || '', // Fecha desde la base de datos
    fechaEjecucion: contratoEnEdicion?.fecha_arranque || '', // Fecha desde la base de datos
    valorContrato: contratoEnEdicion?.valor_contrato?.toString() || '0', // Valor desde la base de datos
    noPpl: contratoEnEdicion?.no_ppl?.toString() || '', // PPL desde la base de datos
    noCiclos: contratoEnEdicion?.no_ciclos?.toString() || '',
    noServicios: contratoEnEdicion?.no_servicios?.toString() || '', // Servicios desde la base de datos
    estadoProceso: contratoEnEdicion?.estado_proceso || '', // Estado desde la base de datos
    sedeAdministrativa: contratoEnEdicion?.sede_administrativa || '', // Sucursal desde la base de datos
    zona: '',
    noPplZona: contratoEnEdicion?.no_ppl?.toString() || '',
    zonas: contratoEnEdicion ? [
      {
        id: '1',
        codigo: 'ZN',
        nombre: 'ZONA NORTE',
        noPpl: contratoEnEdicion.no_ppl?.toString() || '0'
      }
    ] : [],
    clausulas: contratoEnEdicion?.clausulas || '',
  };

  const handleSubmit = async (values: ContratoFormData) => {
    console.log('handleSubmit ejecutado con valores:', values); // Debug
    console.log('Valor específico de clausulas en handleSubmit:', values.clausulas); // Debug
    console.log('Longitud de clausulas:', values.clausulas?.length || 0); // Debug
    // Mostrar modal de confirmación
    setPendingFormData(values);
    setShowConfirmModal(true);
  };

  const procesarFormulario = async () => {
    if (!pendingFormData) return;

    console.log('Procesando formulario...', pendingFormData); // Debug
    setIsSubmitting(true);
    setShowConfirmModal(false);
    showLoading(contratoEnEdicion ? 'Actualizando contrato...' : 'Guardando contrato...');

    try {
      const values = pendingFormData;
      if (contratoEnEdicion) {
        // Actualizar contrato existente
        // Buscar IDs reales desde los datos cargados
        const sucursalSeleccionada = sucursales.find(s => s.nombre === values.sedeAdministrativa);

        const contratoData: ContratoCRUD = {
          id_tercero: contratoEnEdicion?.id_tercero || 1, // Mantener el ID original
          id_usuario: contratoEnEdicion?.id_usuario || 1, // Mantener el usuario original
          id_sucursal: sucursalSeleccionada?.id || contratoEnEdicion?.id_sucursal || 1,
          no_contrato: values.noContrato,
          codigo: values.codigo,
          fecha_final: values.fechaFinal,
          fecha_inicial: values.fechaInicial,
          fecha_arranque: values.fechaEjecucion,
          objetivo: values.objetoContrato,
          observacion: values.observacion,
          tasa_impuesto: 0.19000,
          valor_racion: 0,
          valor_contrato: parseFloat(values.valorContrato) || 0,
          valor_facturado: 0,
          estado: contratoEnEdicion?.estado || 1,
          no_ppl: parseInt(values.noPpl) || 0,
          no_ciclos: parseInt(values.noCiclos) || 0,
          no_servicios: parseInt(values.noServicios) || 0,
          estado_proceso: values.estadoProceso,
          clausulas: values.clausulas
        };

        const zonasData: ZonaContrato[] = zonasAgregadas.map(zona => ({
          id_zona: zonasDisponibles.find(z => z.nombre === zona.nombre)?.id || parseInt(zona.codigo) || 0,
          codigo: zona.codigo,
          nombre: zona.nombre,
          no_ppl: parseInt(zona.noPpl) || 0
        }));

        console.log('ID del contrato a actualizar:', contratoEnEdicion.id); // Debug
        console.log('Datos del contrato a enviar:', contratoData); // Debug
        console.log('Clausulas específicas en actualización:', contratoData.clausulas); // Debug
        console.log('Zonas a enviar:', zonasData); // Debug

        const response = await ContratosCRUDService.actualizarContrato(
          contratoEnEdicion.id!,
          contratoData,
          zonasData,
          [], // menus
          []  // tiempos
        );

        console.log('Respuesta de actualización:', response); // Debug

        if (response.error) {
          console.error('Error actualizando contrato:', response.error);
          toast({
            title: "Error al actualizar",
            description: "No se pudo actualizar el contrato",
            variant: "destructive",
          });
          return;
        }

        toast({
          title: "Contrato actualizado",
          description: `El contrato ${values.noContrato} ha sido actualizado exitosamente`,
        });

        if (onSave) {
          onSave();
        } else {
          navigate('/contratos');
        }
      } else {
        // Crear nuevo contrato
        const sucursalSeleccionada = sucursales.find(s => s.nombre === values.sedeAdministrativa);

        console.log('Creando contrato - values.sedeAdministrativa:', values.sedeAdministrativa); // Debug
        console.log('Sucursales disponibles:', sucursales); // Debug
        console.log('Sucursal seleccionada:', sucursalSeleccionada); // Debug
        console.log('Valor de clausulas:', values.clausulas); // Debug
        console.log('Todos los valores del formulario:', values); // Debug

        const contratoData: ContratoCRUD = {
          id_tercero: terceroIdSeleccionado || 0,
          id_usuario: 1, // Usuario por defecto
          id_sucursal: sucursalSeleccionada?.id || 1, // Default a sucursal principal
          no_contrato: values.noContrato,
          codigo: values.codigo,
          fecha_final: values.fechaFinal,
          fecha_inicial: values.fechaInicial,
          fecha_arranque: values.fechaEjecucion,
          objetivo: values.objetoContrato,
          observacion: values.observacion,
          tasa_impuesto: 0.19000,
          valor_racion: 0,
          valor_contrato: parseFloat(values.valorContrato) || 0,
          valor_facturado: 0,
          estado: 1,
          no_ppl: parseInt(values.noPpl) || 0,
          no_ciclos: parseInt(values.noCiclos) || 0,
          no_servicios: parseInt(values.noServicios) || 0,
          estado_proceso: values.estadoProceso,
          clausulas: values.clausulas
        };

        const zonasData: ZonaContrato[] = zonasAgregadas.map(zona => ({
          id_zona: zonasDisponibles.find(z => z.nombre === zona.nombre)?.id || parseInt(zona.codigo) || 0,
          codigo: zona.codigo,
          nombre: zona.nombre,
          no_ppl: parseInt(zona.noPpl) || 0
        }));

        console.log('Enviando creación...', { contratoData, zonasData }); // Debug
        console.log('Clausulas específicas en creación:', contratoData.clausulas); // Debug

        const response = await ContratosCRUDService.crearContrato(
          contratoData,
          zonasData,
          [], // menus
          []  // tiempos
        );

        console.log('Respuesta de creación:', response); // Debug

        if (response.error) {
          console.error('Error creando contrato:', response.error);
          toast({
            title: "Error al crear",
            description: "No se pudo crear el contrato",
            variant: "destructive",
          });
          return;
        }

        toast({
          title: "Contrato creado",
          description: `El contrato ${values.noContrato} ha sido creado exitosamente`,
        });

        if (onSave) {
          onSave();
        } else {
          navigate('/contratos');
        }
      }
    } catch (error) {
      console.error('Error en submit:', error);
      toast({
        title: "Error inesperado",
        description: "Ocurrió un error al procesar el contrato",
        variant: "destructive",
      });
    } finally {
      hideLoading();
      setIsSubmitting(false);
      setPendingFormData(null);
    }
  };

  const handleCancelar = () => {
    if (onCancel) {
      onCancel();
    } else {
      navigate('/contratos');
    }
  };

  const handleSelectTercero = (tercero: Tercero) => {
    setTerceroSeleccionado(tercero);
    setTerceroIdSeleccionado(tercero.id);
    setShowTercerosModal(false);
  };

  // Función para obtener el icono según la categoría del producto
  const getProductIcon = (categoria: string) => {
    switch (categoria.toLowerCase()) {
      case 'proteínas':
      case 'proteinas':
        return <Beef className="w-4 h-4 text-red-500" />;
      case 'granos y cereales':
      case 'cereales':
        return <Wheat className="w-4 h-4 text-amber-600" />;
      case 'bebidas':
        return <Droplets className="w-4 h-4 text-blue-500" />;
      case 'verduras':
        return <Carrot className="w-4 h-4 text-green-500" />;
      case 'condimentos':
        return <Sparkles className="w-4 h-4 text-purple-500" />;
      default:
        return <Package className="w-4 h-4 text-gray-500" />;
    }
  };

  // Función para obtener el icono del componente de menú
  const getComponentIcon = (componente: string) => {
    switch (componente.toLowerCase()) {
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

  // Función para manejar la asignación de menús
  const handleAsignarMenus = () => {
    console.log('🎯 Asignando menús seleccionados...');
    // TODO: Implementar lógica de asignación
  };

  // Función para obtener unidades del contrato seleccionado
  const getUnidadesPorContrato = async (contratoId: number) => {
    try {
      const response = await UnidadesServicioService.getUnidadesPorContrato(contratoId);
      return response.data || [];
    } catch (error) {
      console.error('Error obteniendo unidades del contrato:', error);
      return [];
    }
  };

  // Función para manejar el cambio de contrato y filtrar unidades
  const handleContratoChange = async (contratoValue: string) => {
    console.log('🔄 handleContratoChange llamado con:', contratoValue);
    setSelectedContrato(contratoValue);
    setSelectedUnidades([]); // Limpiar unidades seleccionadas

    if (contratoValue) {
      // Encontrar el contrato seleccionado usando el nuevo formato
      const contratoSeleccionado = contratosDisponibles.find(c =>
        `(No. ${c.no_contrato}) ${c.objetivo.toUpperCase()}` === contratoValue
      );

      console.log('🎯 Contrato encontrado:', contratoSeleccionado);

      if (contratoSeleccionado && contratoSeleccionado.id) {
        console.log('📡 Cargando unidades para contrato ID:', contratoSeleccionado.id);
        // Cargar unidades específicas de este contrato
        const unidadesDelContrato = await getUnidadesPorContrato(contratoSeleccionado.id);
        console.log('📋 Unidades obtenidas:', unidadesDelContrato);
        setUnidadesFiltradas(unidadesDelContrato);
      } else {
        console.log('❌ No se encontró contrato o no tiene ID');
        setUnidadesFiltradas([]); // No hay unidades si no se encuentra el contrato
      }
    } else {
      console.log('🚫 No hay contrato seleccionado');
      setUnidadesFiltradas([]); // No mostrar unidades si no hay contrato seleccionado
    }
  };

  const handleAddZona = () => {
    const zonaSeleccionada = zonasDisponibles.find(z => z.nombre === selectedZona);
    const pplZona = zonaSeleccionada?.no_ppl || 0;

    if (selectedZona && pplZona > 0) {
      const nuevaZona: ZonaLocal = {
        id: Date.now().toString(),
        codigo: zonaSeleccionada?.codigo || '',
        nombre: zonaSeleccionada?.nombre || '',
        noPpl: pplZona.toString()
      };
      setZonasAgregadas(prev => [...prev, nuevaZona]);
      setSelectedZona('');
      setShowZonaDropdown(false);
    }
  };

  // Funciones para asignación de menús
  const handleToggleMenuGroup = (groupId: string) => {
    // Validar que haya al menos una unidad de servicio seleccionada
    if (selectedUnidades.length === 0) {
      toast({
        title: "Seleccione unidades de servicio",
        description: "Debe seleccionar al menos una unidad de servicio antes de expandir los menús",
        variant: "destructive",
      });
      return;
    }

    setMenus(prev => prev.map(group =>
      group.id === groupId
        ? { ...group, expandido: !group.expandido }
        : group
    ));
  };

  const handleToggleMenuTipo = (groupId: string, tipoId: string) => {
    // Validar que haya al menos una unidad de servicio seleccionada
    if (selectedUnidades.length === 0) {
      toast({
        title: "Seleccione unidades de servicio",
        description: "Debe seleccionar al menos una unidad de servicio antes de expandir los tipos de menú",
        variant: "destructive",
      });
      return;
    }

    setMenus(prev => prev.map(group => {
      if (group.id === groupId) {
        const updatedTipos = group.tipos.map(tipo =>
          tipo.id === tipoId
            ? { ...tipo, expandido: !tipo.expandido }
            : tipo
        );
        return { ...group, tipos: updatedTipos };
      }
      return group;
    }));
  };

  const handleSelectMenuItem = (groupId: string, itemId: string) => {
    // Validar que haya al menos una unidad de servicio seleccionada
    if (selectedUnidades.length === 0) {
      toast({
        title: "Seleccione unidades de servicio",
        description: "Debe seleccionar al menos una unidad de servicio antes de seleccionar menús",
        variant: "destructive",
      });
      return;
    }

    setMenus(prev => prev.map(group => {
      if (group.id === groupId) {
        const updatedTipos = group.tipos.map(tipo => {
          const updatedItems = tipo.items.map(item => {
            if (item.id === itemId) {
              const newSeleccionado = !item.seleccionado;

              // Si es la primera selección, establecer el tipo de menú
              if (newSeleccionado && !selectedTipoMenu) {
                setSelectedTipoMenu(item.tipo);
              }

              // Si se deselecciona y no hay otros seleccionados del mismo tipo, limpiar tipo seleccionado
              if (!newSeleccionado) {
                const otrosSeleccionados = tipo.items.filter(i =>
                  i.id !== itemId && i.seleccionado && i.tipo === item.tipo
                );
                if (otrosSeleccionados.length === 0) {
                  setSelectedTipoMenu(null);
                }
              }

              return { ...item, seleccionado: newSeleccionado };
            }
            return item;
          });
          return { ...tipo, items: updatedItems };
        });
        return { ...group, tipos: updatedTipos };
      }
      return group;
    }));
  };

  const handleSelectAll = () => {
    const tipoActual = selectedTipoMenu;
    setMenus(prev => prev.map(group => ({
      ...group,
      tipos: group.tipos.map(tipo => ({
        ...tipo,
        items: tipo.items.map(item => ({
          ...item,
          seleccionado: tipoActual ? item.tipo === tipoActual : true
        }))
      }))
    })));
  };

  const getFilteredMenus = () => {
    return menus.map(group => ({
      ...group,
      tipos: group.tipos.map(tipo => ({
        ...tipo,
        items: tipo.items.filter(item => {
          const matchesFilter = item.nombre.toLowerCase().includes(filterText.toLowerCase());
          const matchesTipo = !selectedTipoMenu || item.tipo === selectedTipoMenu;
          return matchesFilter && matchesTipo;
        })
      }))
    })).filter(group => group.tipos.some(tipo => tipo.items.length > 0));
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };

  const handleCurrencyChange = (e: React.ChangeEvent<HTMLInputElement>, setFieldValue: any) => {
    const value = e.target.value.replace(/[^\d]/g, '');
    const numericValue = value ? parseInt(value) : 0;
    setFieldValue('valorContrato', numericValue);
  };

  return (
    <div className="min-h-screen bg-gray-100">


      <div className="max-w-7xl mx-auto p-4">
        {/* Header */}


        <Formik
          initialValues={initialValues}
          validationSchema={createValidationSchema(!!contratoEnEdicion)}
          onSubmit={handleSubmit}
        >
          {({ values, errors, touched, handleChange, handleBlur, setFieldValue, handleSubmit: formikSubmit, setFieldError, setFieldTouched }) => {
            // Effect para actualizar campos cuando se selecciona un tercero
            React.useEffect(() => {
              if (terceroSeleccionado && !contratoEnEdicion) {
                const documentoCompleto = terceroSeleccionado.digito
                  ? `${terceroSeleccionado.documento}-${terceroSeleccionado.digito}`
                  : terceroSeleccionado.documento;

                // Actualizar valores
                setFieldValue('nit', documentoCompleto);
                setFieldValue('nombreCliente', terceroSeleccionado.nombre_tercero);

                // Limpiar errores de validación específicamente
                setFieldError('nit', undefined);
                setFieldError('nombreCliente', undefined);
                setFieldTouched('nit', false);
                setFieldTouched('nombreCliente', false);

                setTerceroSeleccionado(null); // Limpiar selección
              }
            }, [terceroSeleccionado, setFieldValue, setFieldError, setFieldTouched]);

            return (
              <>
                {/* Header con botones */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-teal-500 rounded-full flex items-center justify-center">
                      <FileText className="w-4 h-4 text-white" />
                    </div>
                    <h1 className="text-2xl font-bold text-gray-900 flex items-center space-x-2">
                      <span>{contratoEnEdicion ? 'Editar Contrato' : 'Registro de Contrato'}</span>
                      {contratoEnEdicion && (
                        <span className="text-sm bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                          {contratoEnEdicion.no_contrato}
                        </span>
                      )}
                    </h1>

                  </div>

                  {/* Botones en el header */}
                  <div className="flex justify-end space-x-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleCancelar}
                      className="px-4 py-2"
                    >
                      Cancelar
                    </Button>
                    <Button
                      type="button"
                      onClick={async () => {
                        console.log('Botón clickeado, valores actuales:', values); // Debug
                        console.log('Errores de validación:', errors); // Debug

                        // Validar manualmente primero
                        try {
                          await createValidationSchema(!!contratoEnEdicion).validate(values, { abortEarly: false });

                          // Validación adicional para nuevo contrato
                          if (!contratoEnEdicion && !terceroIdSeleccionado) {
                            toast({
                              title: "Error de validación",
                              description: "Debe seleccionar un tercero para el contrato",
                              variant: "destructive",
                            });
                            return;
                          }

                          // Validar que se haya seleccionado una sucursal válida
                          const sucursalSeleccionada = sucursales.find(s => s.nombre === values.sedeAdministrativa);
                          if (!sucursalSeleccionada) {
                            toast({
                              title: "Error de validación",
                              description: "Debe seleccionar una sede administrativa válida",
                              variant: "destructive",
                            });
                            return;
                          }

                          console.log('Validación exitosa, ejecutando handleSubmit'); // Debug
                          console.log('ID tercero seleccionado:', terceroIdSeleccionado); // Debug
                          handleSubmit(values);
                        } catch (validationError) {
                          console.error('Error de validación:', validationError); // Debug
                          toast({
                            title: "Error de validación",
                            description: "Por favor completa todos los campos requeridos",
                            variant: "destructive",
                          });
                        }
                      }}
                      disabled={isSubmitting}
                      className="bg-cyan-600 hover:bg-cyan-700 disabled:bg-cyan-400 text-white border-0 shadow-sm px-6 py-2 rounded text-sm font-medium transition-colors"
                    >
                      <Save className="w-4 h-4 mr-2" />
                      {contratoEnEdicion ? 'Actualizar' : 'Guardar'}
                    </Button>
                  </div>
                </div>

                <Form id="contrato-form">
                  {/* Contenedor principal */}
                  <div className="bg-white rounded-lg shadow-lg border border-gray-200">
                    {/* Tabs actualizados */}
                    <div className="border-b border-gray-200 bg-white">
                      <div className="flex items-center justify-center p-4">
                        <div className="w-4/5">
                          <div className="grid w-full grid-cols-4 bg-cyan-100/60 p-1 rounded-lg">
                            <button
                              type="button"
                              onClick={() => setActiveTab('general')}
                              className={`px-3 py-2 text-sm font-medium rounded-md transition-all duration-300 ${activeTab === 'general'
                                ? 'bg-cyan-600 text-white shadow-md'
                                : 'text-gray-600 hover:text-gray-900'
                                }`}
                            >
                              Información General
                            </button>
                            <button
                              type="button"
                              onClick={() => setActiveTab('asignacion')}
                              className={`px-3 py-2 text-sm font-medium rounded-md transition-all duration-300 ${activeTab === 'asignacion'
                                ? 'bg-cyan-600 text-white shadow-md'
                                : 'text-gray-600 hover:text-gray-900'
                                }`}
                            >
                              Asignación de Menús
                            </button>
                            <button
                              type="button"
                              onClick={() => setActiveTab('clausulas')}
                              className={`px-3 py-2 text-sm font-medium rounded-md transition-all duration-300 ${activeTab === 'clausulas'
                                ? 'bg-cyan-600 text-white shadow-md'
                                : 'text-gray-600 hover:text-gray-900'
                                }`}
                            >
                              Cláusulas
                            </button>
                            <button
                              type="button"
                              onClick={() => setActiveTab('minutas')}
                              className={`px-3 py-2 text-sm font-medium rounded-md transition-all duration-300 ${activeTab === 'minutas'
                                ? 'bg-cyan-600 text-white shadow-md'
                                : 'text-gray-600 hover:text-gray-900'
                                }`}
                            >
                              Minutas del contrato
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Contenido del formulario */}
                    <div className="p-4">
                      {activeTab === 'general' && (
                        <div className="space-y-3">
                          {/* Sección principal con dos columnas */}
                          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                            {/* Columna izquierda - Información del cliente */}
                            <div className="bg-gray-50 rounded-lg p-3 shadow-sm">
                              <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                                <User className="w-5 h-5 text-teal-600" />
                                Información del cliente
                              </h3>

                              {/* Primera fila - NIT y Nombre */}
                              <div className="grid grid-cols-3 gap-3 mb-3">
                                <div className="col-span-1">
                                  <label className="block text-sm text-gray-700 mb-1">NIT</label>
                                  <input
                                    type="text"
                                    name="nit"
                                    value={values.nit}
                                    onChange={handleChange}
                                    onBlur={handleBlur}
                                    onClick={() => {
                                      if (!contratoEnEdicion) {
                                        setShowTercerosModal(true);
                                      }
                                    }}
                                    readOnly={!!contratoEnEdicion}
                                    className={`w-full px-2 py-1.5 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-teal-500 focus:border-teal-500 ${contratoEnEdicion
                                      ? 'bg-gray-100 cursor-not-allowed'
                                      : 'bg-yellow-50 cursor-pointer hover:bg-yellow-100'
                                      }`}
                                    placeholder={contratoEnEdicion ? '' : 'Haga clic para seleccionar tercero'}
                                  />
                                  {errors.nit && touched.nit && (
                                    <p className="text-red-600 text-xs mt-1">{errors.nit}</p>
                                  )}
                                </div>

                                <div className="col-span-2">
                                  <label className="block text-sm text-gray-700 mb-1">Nombre del Cliente o Entidad Contratante</label>
                                  <input
                                    type="text"
                                    name="nombreCliente"
                                    value={values.nombreCliente}
                                    onChange={handleChange}
                                    onBlur={handleBlur}
                                    onClick={() => {
                                      if (!contratoEnEdicion) {
                                        setShowTercerosModal(true);
                                      }
                                    }}
                                    readOnly={!!contratoEnEdicion}
                                    className={`w-full px-2 py-1.5 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-teal-500 focus:border-teal-500 ${contratoEnEdicion
                                      ? 'bg-gray-100 cursor-not-allowed'
                                      : 'bg-yellow-50 cursor-pointer hover:bg-yellow-100'
                                      }`}
                                    placeholder={contratoEnEdicion ? '' : 'Haga clic para seleccionar tercero'}
                                  />
                                  {errors.nombreCliente && touched.nombreCliente && (
                                    <p className="text-red-600 text-xs mt-1">{errors.nombreCliente}</p>
                                  )}
                                </div>
                              </div>

                              {/* Segunda fila - Solo Observación */}
                              <div>
                                <label className="block text-sm text-gray-700 mb-1">
                                  Observación <span className="text-red-500">*</span>
                                </label>
                                <textarea
                                  name="observacion"
                                  value={values.observacion}
                                  onChange={handleChange}
                                  onBlur={handleBlur}
                                  rows={2}
                                  className="w-full px-2 py-1.5 border border-gray-300 rounded bg-yellow-50 focus:ring-2 focus:ring-teal-500 focus:border-teal-500 resize-none text-sm"
                                />
                                {errors.observacion && touched.observacion && (
                                  <p className="text-red-600 text-xs mt-1">{errors.observacion}</p>
                                )}
                              </div>

                              {/* Sección de Zona debajo de información del cliente */}
                              <div className="border-t border-gray-200 pt-3 mt-3">
                                <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                                  <MapPin className="w-5 h-5 text-teal-600" />
                                  Asociación de Zonas
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-4 gap-3 items-end">
                                  <div className="col-span-2">
                                    <SelectWithSearch
                                      options={zonasDisponibles.map(z => ({ id: z.id.toString(), nombre: z.nombre }))}
                                      value={selectedZona}
                                      onChange={setSelectedZona}
                                      placeholder="Seleccione una Zona"

                                    />
                                  </div>
                                  <div>
                                    <label className="block text-sm text-gray-700 mb-1">No PPL</label>
                                    <input
                                      type="text"
                                      name="noPplZona"
                                      value={selectedZona ? (zonasDisponibles.find(z => z.nombre === selectedZona)?.no_ppl || 0) : ''}
                                      className="w-full px-2 py-1.5 border border-gray-300 rounded bg-gray-100 focus:ring-2 focus:ring-teal-500 focus:border-teal-500 text-sm"
                                      disabled
                                      readOnly
                                    />
                                  </div>
                                  <div>
                                    <button
                                      type="button"
                                      onClick={handleAddZona}
                                      disabled={!selectedZona || !((zonasDisponibles.find(z => z.nombre === selectedZona)?.no_ppl || 0) > 0)}
                                      className={`w-full px-2 py-1.5 rounded flex items-center justify-center transition-colors text-sm ${selectedZona && ((zonasDisponibles.find(z => z.nombre === selectedZona)?.no_ppl || 0) > 0)
                                        ? 'bg-teal-500 hover:bg-teal-600 text-white'
                                        : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                        }`}
                                    >
                                      <Plus className="w-3 h-3" />
                                    </button>
                                  </div>
                                </div>

                                {/* Tabla de zonas */}
                                <div className="mt-3">
                                  <div className="bg-teal-50 border border-gray-200 rounded-t">
                                    <div className="grid grid-cols-4 gap-4 p-2 font-medium text-xs text-gray-900">
                                      <div>Codigo</div>
                                      <div>Nombre Zona</div>
                                      <div>No PPL</div>
                                      <div>Acciones</div>
                                    </div>
                                  </div>
                                  <div className="border border-t-0 border-gray-200 rounded-b">
                                    {zonasAgregadas.length > 0 ? (
                                      zonasAgregadas.map((zona) => (
                                        <div key={zona.id} className="grid grid-cols-4 gap-4 p-2 border-b border-gray-100 last:border-b-0 items-center">
                                          <div className="text-xs text-gray-700">{zona.codigo}</div>
                                          <div className="text-xs text-gray-700">{zona.nombre}</div>
                                          <div className="text-xs text-gray-700">{zona.noPpl}</div>
                                          <div className="flex justify-center">
                                            <button
                                              type="button"
                                              onClick={() => setZonasAgregadas(prev => prev.filter(z => z.id !== zona.id))}
                                              className="text-red-500 hover:text-red-700 p-1 hover:bg-red-50 rounded transition-colors"
                                              title="Quitar zona"
                                            >
                                              <Trash2 className="w-4 h-4" />
                                            </button>
                                          </div>
                                        </div>
                                      ))
                                    ) : (
                                      <div className="p-4 text-center">
                                        <p className="text-gray-500 text-xs">No Rows To Show</p>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </div>

                            {/* Columna derecha - Información del contrato */}
                            <div className="bg-gray-50 rounded-lg p-3 shadow-sm">
                              <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                                <FileText className="w-5 h-5 text-teal-600" />
                                Información del contrato
                              </h3>

                              {/* Primera fila - Código, Objeto y No Contrato */}
                              <div className="grid grid-cols-2 gap-3 mb-3">
                                <div>
                                  <label className="block text-xs text-gray-700 mb-1">
                                    N° Contrato <span className="text-red-500">*</span>
                                  </label>
                                  <input
                                    type="text"
                                    name="noContrato"
                                    value={values.noContrato}
                                    onChange={handleChange}
                                    onBlur={handleBlur}
                                    className="w-full px-2 py-1.5 border border-gray-300 rounded bg-yellow-50 focus:ring-2 focus:ring-teal-500 focus:border-teal-500 text-sm"
                                  />
                                  {errors.noContrato && touched.noContrato && (
                                    <p className="text-red-600 text-xs mt-1">{errors.noContrato}</p>
                                  )}
                                </div>
                                <div>
                                  <label className="block text-sm text-gray-700 mb-1">Objeto del Contrato</label>
                                  <input
                                    type="text"
                                    name="objetoContrato"
                                    value={values.objetoContrato}
                                    onChange={handleChange}
                                    onBlur={handleBlur}
                                    className="w-full px-2 py-1.5 border border-gray-300 rounded bg-yellow-50 focus:ring-2 focus:ring-teal-500 focus:border-teal-500 text-sm"
                                  />
                                  {errors.objetoContrato && touched.objetoContrato && (
                                    <p className="text-red-600 text-xs mt-1">{errors.objetoContrato}</p>
                                  )}
                                </div>


                              </div>

                              {/* Campos en 3 columnas */}
                              <div className="grid grid-cols-4 gap-4 mb-3">
                                <div>
                                  <label className="block text-sm text-gray-700 mb-1">Codigo</label>
                                  <input
                                    type="text"
                                    name="codigo"
                                    value={values.codigo}
                                    onChange={handleChange}
                                    onBlur={handleBlur}
                                    className="w-full px-2 py-1.5 border border-gray-300 rounded bg-yellow-50 focus:ring-2 focus:ring-teal-500 focus:border-teal-500 text-sm font-bold text-red-600"
                                    disabled
                                  />
                                </div>
                                <div>
                                  <label className="block text-sm text-gray-700 mb-1">No PPL</label>
                                  <input
                                    type="text"
                                    name="noPpl"
                                    value={values.noPpl}
                                    onChange={handleChange}
                                    onBlur={handleBlur}
                                    className="w-full px-2 py-1.5 border border-gray-300 rounded bg-yellow-50 focus:ring-2 focus:ring-teal-500 focus:border-teal-500 text-sm"
                                  />
                                </div>
                                <div>
                                  <label className="block text-sm text-gray-700 mb-1">No Ciclos</label>
                                  <input
                                    type="text"
                                    name="noCiclos"
                                    value={values.noCiclos}
                                    onChange={handleChange}
                                    onBlur={handleBlur}
                                    className="w-full px-2 py-1.5 border border-gray-300 rounded bg-yellow-50 focus:ring-2 focus:ring-teal-500 focus:border-teal-500 text-sm"
                                  />
                                </div>
                                <div>
                                  <label className="block text-sm text-gray-700 mb-1">No. Servicios</label>
                                  <input
                                    type="text"
                                    name="noServicios"
                                    value={values.noServicios}
                                    onChange={handleChange}
                                    onBlur={handleBlur}
                                    className="w-full px-2 py-1.5 border border-gray-300 rounded bg-yellow-50 focus:ring-2 focus:ring-teal-500 focus:border-teal-500 text-sm"
                                  />
                                </div>
                              </div>

                              {/* Segunda fila - Valor, Estado y Sede */}
                              <div className="grid grid-cols-2 gap-2 mb-3">
                                <div>
                                  <label className="block text-sm text-gray-700 mb-1">Estado Proceso</label>
                                  <SelectWithSearch
                                    options={estadosProceso}
                                    value={values.estadoProceso}
                                    onChange={(value) => setFieldValue('estadoProceso', value)}
                                    placeholder="Seleccione estado"
                                  />
                                </div>
                                <div>
                                  <label className="block text-sm text-gray-700 mb-1">Valor</label>
                                  <input
                                    type="text"
                                    name="valorContrato"
                                    value={formatCurrency(parseFloat(values.valorContrato) || 0)}
                                    onChange={(e) => handleCurrencyChange(e, setFieldValue)}
                                    onBlur={handleBlur}
                                    className="w-full px-2 py-1.5 border border-gray-300 rounded bg-yellow-50 focus:ring-2 focus:ring-teal-500 focus:border-teal-500 text-sm"
                                  />
                                </div>

                              </div>

                              <div className="grid grid-cols-1 gap-3 mb-3">
                                <div>
                                  <label className="block text-sm text-gray-700 mb-1">Sede Administrativa</label>
                                  <SelectWithSearch
                                    options={sucursales.map(s => ({ id: s.id.toString(), nombre: s.nombre }))}
                                    value={values.sedeAdministrativa}
                                    onChange={(value) => setFieldValue('sedeAdministrativa', value)}
                                    placeholder="Seleccione sede"
                                  />
                                </div>
                              </div>

                              {/* Fechas en 3 columnas */}
                              <div className="grid grid-cols-3 gap-3 mb-3">
                                <div>
                                  <label className="block text-sm text-gray-700 mb-1">Fecha Inicial</label>
                                  <input
                                    type="date"
                                    name="fechaInicial"
                                    value={values.fechaInicial}
                                    onChange={handleChange}
                                    onBlur={handleBlur}
                                    className="w-full px-2 py-1.5 border border-gray-300 rounded bg-yellow-50 focus:ring-2 focus:ring-teal-500 focus:border-teal-500 text-sm"
                                  />
                                </div>
                                <div>
                                  <label className="block text-sm text-gray-700 mb-1">Fecha Final</label>
                                  <input
                                    type="date"
                                    name="fechaFinal"
                                    value={values.fechaFinal}
                                    onChange={handleChange}
                                    onBlur={handleBlur}
                                    className="w-full px-2 py-1.5 border border-gray-300 rounded bg-yellow-50 focus:ring-2 focus:ring-teal-500 focus:border-teal-500 text-sm"
                                  />
                                </div>
                                <div>
                                  <label className="block text-sm text-gray-700 mb-1">Fecha Ejecución</label>
                                  <input
                                    type="date"
                                    name="fechaEjecucion"
                                    value={values.fechaEjecucion}
                                    onChange={handleChange}
                                    onBlur={handleBlur}
                                    className="w-full px-2 py-1.5 border border-gray-300 rounded bg-yellow-50 focus:ring-2 focus:ring-teal-500 focus:border-teal-500 text-sm"
                                  />
                                </div>
                              </div>


                            </div>
                          </div>
                        </div>
                      )}

                      {activeTab === 'asignacion' && (
                        <div className="p-4">
                          {/* Campos superiores */}
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                            <div>
                              <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                                <FileText className="w-4 h-4 text-blue-600" />
                                {contratoEnEdicion ? 'Contrato Seleccionado' : 'Seleccione un Contrato'}
                              </label>
                              <SelectWithSearch
                                options={contratosDisponibles.map(c => ({
                                  id: c.id?.toString() || '0',
                                  nombre: `(No. ${c.no_contrato}) ${c.objetivo.toUpperCase()}`
                                }))}
                                value={selectedContrato}
                                onChange={handleContratoChange}
                                placeholder="Buscar contrato..."
                                disabled={!!contratoEnEdicion} // Deshabilitar al editar
                              />
                            </div>
                            {(selectedContrato || contratoEnEdicion) && (
                              <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                                  <MapPin className="w-4 h-4 text-indigo-600" />
                                  {contratoEnEdicion ? 'Unidades de Servicio del Contrato' : 'Seleccione una o varias Unidades de Servicio'}
                                </label>
                                <MultiSelect
                                  options={unidadesFiltradas.map(u => ({
                                    id: u.id.toString(),
                                    nombre: u.nombre_servicio
                                  }))}
                                  selectedValues={selectedUnidades}
                                  onChange={setSelectedUnidades}
                                  placeholder="Seleccionar unidades..."
                                />
                              </div>
                            )}
                          </div>

                          {/* Contenedor principal con dos columnas */}
                          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            {/* Columna izquierda - Catálogo de Productos */}
                            <div className="bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden">
                              {/* Header moderno con gradiente */}
                              <div className="bg-gradient-to-r from-blue-600 via-purple-600 to-teal-600 p-6">
                                <div className="flex items-center gap-3 mb-4">
                                  <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
                                    <Package className="w-5 h-5 text-white" />
                                  </div>
                                  <div>
                                    <h3 className="text-xl font-bold text-white">
                                      Catálogo de Productos
                                    </h3>
                                    <p className="text-blue-100 text-sm">
                                      Seleccione los productos para el menú
                                    </p>
                                  </div>
                                </div>

                                {/* Barra de búsqueda moderna */}
                                <div className="relative">
                                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-white/70" />
                                  <input
                                    type="text"
                                    placeholder="Buscar productos..."
                                    value={filterText}
                                    onChange={(e) => setFilterText(e.target.value)}
                                    className="w-full pl-10 pr-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/70 focus:outline-none focus:ring-2 focus:ring-white/30 focus:bg-white/20 transition-all backdrop-blur-sm"
                                  />
                                </div>
                              </div>

                              {/* Contenedor del treeview con scroll personalizado */}
                              <div className="max-h-96 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
                                {selectedUnidades.length === 0 ? (
                                  <div className="p-12 text-center">
                                    <div className="w-20 h-20 mx-auto mb-4 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center">
                                      <Settings className="w-10 h-10 text-gray-400" />
                                    </div>
                                    <h4 className="text-lg font-semibold text-gray-700 mb-2">
                                      Seleccione Unidades de Servicio
                                    </h4>
                                    <p className="text-sm text-gray-500 max-w-xs mx-auto">
                                      Para ver el catálogo de productos disponibles, primero seleccione al menos una unidad de servicio
                                    </p>
                                  </div>
                                ) : componentesMenu.length === 0 ? (
                                  <div className="p-12 text-center">
                                    <div className="w-20 h-20 mx-auto mb-4 bg-gradient-to-br from-blue-100 to-purple-100 rounded-full flex items-center justify-center">
                                      <Package className="w-10 h-10 text-blue-500 animate-pulse" />
                                    </div>
                                    <h4 className="text-lg font-semibold text-gray-700 mb-2">
                                      Cargando Catálogo
                                    </h4>
                                    <p className="text-sm text-gray-500">
                                      Obteniendo productos de la base de datos...
                                    </p>
                                  </div>
                                ) : (
                                  <div className="p-2">
                                    {componentesMenu
                                      .filter(componente =>
                                        filterText === '' ||
                                        componente.nombre.toLowerCase().includes(filterText.toLowerCase()) ||
                                        componente.productos.some(p => p.nombre.toLowerCase().includes(filterText.toLowerCase()))
                                      )
                                      .map((componente) => (
                                        <div key={componente.id} className="mb-2 last:mb-0">
                                          {/* Componente de Menú - Diseño moderno */}
                                          <div className="bg-gradient-to-r from-white to-gray-50 rounded-lg border border-gray-200 shadow-sm overflow-hidden">
                                            <button
                                              type="button"
                                              onClick={() => {
                                                setComponentesMenu(prev =>
                                                  prev.map(c =>
                                                    c.id === componente.id
                                                      ? { ...c, expandido: !c.expandido }
                                                      : c
                                                  )
                                                );
                                              }}
                                              className="w-full p-4 text-left hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50 flex items-center justify-between transition-all duration-300 group"
                                            >
                                              <div className="flex items-center gap-4">
                                                <div className="w-12 h-12 bg-gradient-to-br from-blue-100 to-purple-100 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                                                  {getComponentIcon(componente.nombre)}
                                                </div>
                                                <div>
                                                  <h4 className="font-bold text-gray-900 text-lg group-hover:text-blue-700 transition-colors">
                                                    {componente.nombre}
                                                  </h4>
                                                  <div className="flex items-center gap-2 mt-1">
                                                    <span className="text-xs text-gray-500 bg-white px-3 py-1 rounded-full border shadow-sm">
                                                      📦 {componente.productos.length} productos
                                                    </span>
                                                    <span className="text-xs text-gray-400">
                                                      Disponibles para selección
                                                    </span>
                                                  </div>
                                                </div>
                                              </div>
                                              <div className="flex items-center gap-2">
                                                <ChevronRight
                                                  className={`w-5 h-5 text-gray-400 transition-all duration-300 group-hover:text-blue-500 ${componente.expandido ? 'rotate-90 text-blue-500' : ''
                                                    }`}
                                                />
                                              </div>
                                            </button>

                                            {/* Lista de Productos - Animación de expansión */}
                                            <div className={`overflow-hidden transition-all duration-500 ease-out ${componente.expandido ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
                                              }`}>
                                              <div className="bg-gradient-to-br from-gray-50 to-white border-t border-gray-100">
                                                {componente.productos
                                                  .filter(producto =>
                                                    filterText === '' ||
                                                    producto.nombre.toLowerCase().includes(filterText.toLowerCase())
                                                  )
                                                  .map((producto, index) => (
                                                    <div
                                                      key={producto.id}
                                                      className={`flex items-center gap-4 p-4 hover:bg-gradient-to-r hover:from-teal-50 hover:to-blue-50 transition-all duration-300 border-b border-gray-100/50 last:border-b-0 group cursor-pointer ${index % 2 === 0 ? 'bg-white/50' : 'bg-gray-50/30'
                                                        }`}
                                                      style={{
                                                        animationDelay: `${index * 50}ms`
                                                      }}
                                                    >
                                                      {/* Checkbox moderno */}
                                                      <div className="relative">
                                                        <input
                                                          type="checkbox"
                                                          // checked={producto.seleccionado}
                                                          onChange={() => {
                                                            console.log('🎯 Producto seleccionado:', producto);
                                                          }}
                                                          className="w-5 h-5 rounded-lg border-2 border-gray-300 text-teal-600 focus:ring-2 focus:ring-teal-500 focus:ring-offset-1 transition-all hover:border-teal-400"
                                                        />
                                                      </div>

                                                      {/* Icono de categoría */}
                                                      <div className="w-10 h-10 bg-white rounded-lg border border-gray-200 flex items-center justify-center shadow-sm group-hover:shadow-md transition-shadow">
                                                        {getProductIcon(producto.categoria)}
                                                      </div>

                                                      {/* Información del producto */}
                                                      <div className="flex-1 min-w-0">
                                                        <h5 className="text-sm font-semibold text-gray-900 truncate group-hover:text-teal-700 transition-colors">
                                                          {producto.nombre}
                                                        </h5>
                                                        <div className="flex items-center gap-2 mt-1">
                                                          <span className="text-xs text-gray-500 bg-white px-2 py-0.5 rounded-md border">
                                                            {producto.categoria}
                                                          </span>
                                                          <span className="text-xs text-gray-400">•</span>
                                                          <span className="text-xs text-gray-500">
                                                            {producto.sublinea}
                                                          </span>
                                                        </div>
                                                      </div>

                                                      {/* Badges modernos */}
                                                      <div className="flex flex-col gap-1">
                                                        <span className={`text-xs px-3 py-1 rounded-full font-medium shadow-sm ${componente.nombre === 'Desayuno' ? 'bg-gradient-to-r from-yellow-100 to-amber-100 text-yellow-800 border border-yellow-200' :
                                                          componente.nombre === 'Almuerzo' ? 'bg-gradient-to-r from-orange-100 to-red-100 text-orange-800 border border-orange-200' :
                                                            componente.nombre === 'Cena' ? 'bg-gradient-to-r from-purple-100 to-indigo-100 text-purple-800 border border-purple-200' :
                                                              'bg-gradient-to-r from-gray-100 to-slate-100 text-gray-800 border border-gray-200'
                                                          }`}>
                                                          {componente.nombre}
                                                        </span>
                                                        {producto.tipo_menu && (
                                                          <span className="text-xs bg-gradient-to-r from-teal-100 to-cyan-100 text-teal-700 px-2 py-0.5 rounded-full border border-teal-200 text-center">
                                                            Tipo {producto.tipo_menu}
                                                          </span>
                                                        )}
                                                      </div>
                                                    </div>
                                                  ))}
                                              </div>
                                            </div>
                                          </div>
                                        </div>
                                      ))
                                    }
                                  </div>
                                )}
                                {/* Botón Asignar Menús - Diseño moderno */}
                                <div className="p-6 bg-gradient-to-r from-gray-50 to-white border-t border-gray-200">
                                  <button
                                    type="button"
                                    onClick={handleAsignarMenus}
                                    className="w-full bg-gradient-to-r from-teal-500 via-blue-500 to-purple-500 hover:from-teal-600 hover:via-blue-600 hover:to-purple-600 text-white px-6 py-4 rounded-xl font-semibold text-sm shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 flex items-center justify-center gap-3 group"
                                  >
                                    <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center group-hover:rotate-12 transition-transform duration-300">
                                      <ArrowRight className="w-4 h-4" />
                                    </div>
                                    <span className="tracking-wide">ASIGNAR PRODUCTOS AL MENÚ</span>
                                    <div className="w-2 h-2 bg-white/40 rounded-full animate-pulse"></div>
                                  </button>
                                </div>
                              </div>

                              {/* Columna derecha - Productos Seleccionados */}
                              <div className="bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden">
                                {/* Header moderno */}
                                <div className="bg-gradient-to-r from-teal-600 via-cyan-600 to-blue-600 p-6">
                                  <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
                                      <Check className="w-5 h-5 text-white" />
                                    </div>
                                    <div>
                                      <h3 className="text-xl font-bold text-white">
                                        Productos Seleccionados
                                      </h3>
                                      <p className="text-cyan-100 text-sm">
                                        {menusAsignados.length} productos en el menú
                                      </p>
                                    </div>
                                  </div>
                                </div>

                                <div className="min-h-96">
                                  {menusAsignados.length > 0 ? (
                                    <div className="p-4">
                                      <div className="space-y-2">
                                        {menusAsignados.map((menu, index) => (
                                          <div
                                            key={menu.id}
                                            className="bg-gradient-to-r from-white to-gray-50 border border-gray-200 rounded-lg p-4 hover:shadow-md transition-all duration-300 group"
                                            style={{
                                              animationDelay: `${index * 100}ms`
                                            }}
                                          >
                                            <div className="flex items-center gap-4">
                                              <div className="w-10 h-10 bg-gradient-to-br from-teal-100 to-cyan-100 rounded-lg flex items-center justify-center">
                                                <Check className="w-5 h-5 text-teal-600" />
                                              </div>

                                              <div className="flex-1">
                                                <h5 className="text-sm font-semibold text-gray-900 group-hover:text-teal-700 transition-colors">
                                                  {menu.nombre}
                                                </h5>
                                                <p className="text-xs text-gray-500 mt-1">
                                                  Producto asignado al menú
                                                </p>
                                              </div>

                                              <button
                                                type="button"
                                                onClick={() => setMenusAsignados(prev => prev.filter(m => m.id !== menu.id))}
                                                className="w-8 h-8 bg-red-100 hover:bg-red-200 text-red-600 hover:text-red-700 rounded-lg flex items-center justify-center transition-all duration-200 hover:scale-110"
                                              >
                                                <X className="w-4 h-4" />
                                              </button>
                                            </div>
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                  ) : (
                                    <div className="p-12 flex flex-col items-center justify-center text-center h-full">
                                      <div className="w-20 h-20 mx-auto mb-4 bg-gradient-to-br from-teal-100 to-cyan-100 rounded-full flex items-center justify-center">
                                        <UtensilsCrossed className="w-10 h-10 text-teal-500" />
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

                            {/* Botones de acción */}
                            <div className="flex justify-end gap-3 mt-6">
                              <button
                                type="button"
                                className="bg-teal-500 hover:bg-teal-600 text-white px-4 py-2 rounded flex items-center gap-2 transition-colors"
                              >
                                <Check className="w-4 h-4" />
                                Aceptar
                              </button>
                              <button
                                type="button"
                                className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded flex items-center gap-2 transition-colors"
                              >
                                <ArrowRight className="w-4 h-4" />
                                Cerrar
                              </button>
                            </div>
                          </div>
                        </div>
                      )}

                      {activeTab === 'clausulas' && (
                        <div className="p-6">
                          <div className="bg-gradient-to-r from-cyan-50 to-teal-50 rounded-lg p-6 border border-cyan-200">
                            <div className="flex items-center gap-3 mb-6">
                              <div className="w-10 h-10 bg-gradient-to-r from-cyan-500 to-teal-500 rounded-full flex items-center justify-center">
                                <FileText className="w-5 h-5 text-white" />
                              </div>
                              <div>
                                <h3 className="text-xl font-bold text-gray-900">Cláusulas del Contrato</h3>
                                <p className="text-sm text-gray-600">Defina los términos y condiciones específicas del contrato</p>
                              </div>
                            </div>

                            <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
                              <div className="p-4 border-b border-gray-200 bg-gray-50">
                                <label className="block text-sm font-semibold text-gray-700 flex items-center gap-2">
                                  <Edit3 className="w-4 h-4 text-cyan-600" />
                                  Contenido de las Cláusulas
                                </label>
                                <p className="text-xs text-gray-500 mt-1">Escriba aquí todas las cláusulas, términos y condiciones del contrato</p>
                              </div>
                              <div className="p-4">
                                <textarea
                                  name="clausulas"
                                  value={values.clausulas}
                                  onChange={handleChange}
                                  onBlur={handleBlur}
                                  rows={12}
                                  className="w-full px-4 py-3 border-0 focus:ring-2 focus:ring-cyan-500 focus:outline-none resize-none text-sm leading-relaxed"
                                  placeholder="Ejemplo:&#10;&#10;PRIMERA: El contratante se compromete a...&#10;&#10;SEGUNDA: El contratista deberá cumplir con...&#10;&#10;TERCERA: En caso de incumplimiento..."
                                  style={{ minHeight: '300px' }}
                                />
                                {errors.clausulas && touched.clausulas && (
                                  <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-red-600 text-xs">
                                    {errors.clausulas}
                                  </div>
                                )}
                              </div>
                            </div>

                            <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
                              <div className="flex items-start gap-2">
                                <AlertCircle className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                                <div className="text-xs text-blue-700">
                                  <p className="font-medium mb-1">Recomendaciones para las cláusulas:</p>
                                  <ul className="list-disc list-inside space-y-1 text-blue-600">
                                    <li>Enumere las cláusulas (PRIMERA, SEGUNDA, TERCERA...)</li>
                                    <li>Sea específico en los términos de cumplimiento</li>
                                    <li>Incluya condiciones de pago y entrega</li>
                                    <li>Defina responsabilidades de cada parte</li>
                                  </ul>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}

                      {activeTab === 'minutas' && (
                        <div className="p-4">
                          <h3 className="text-lg font-semibold text-gray-900 mb-4">Minutas del Contrato</h3>
                          <p className="text-gray-600">Contenido de las minutas...</p>
                        </div>
                      )}
                    </div>
                  </div>
                </Form >

                {/* Modal de selección de terceros */}
                < TercerosModal
                  isOpen={showTercerosModal}
                  onClose={() => setShowTercerosModal(false)}
                  onSelect={handleSelectTercero}
                />
              </>
            );
          }}
        </Formik>

        {/* Modal de confirmación */}
        <AlertDialog open={showConfirmModal} onOpenChange={setShowConfirmModal}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>
                {contratoEnEdicion ? 'Confirmar Actualización' : 'Confirmar Creación'}
              </AlertDialogTitle>
              <AlertDialogDescription>
                {contratoEnEdicion
                  ? `¿Está seguro que desea actualizar el contrato ${pendingFormData?.noContrato}? Esta acción modificará la información en la base de datos.`
                  : `¿Está seguro que desea crear el contrato ${pendingFormData?.noContrato}? Esta acción guardará la información en la base de datos.`
                }
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => {
                setShowConfirmModal(false);
                setPendingFormData(null);
              }}>
                Cancelar
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={procesarFormulario}
                className="bg-cyan-600 hover:bg-cyan-700"
              >
                {contratoEnEdicion ? 'Actualizar' : 'Guardar'}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

      </div>
    </div >
  );
};

export default ContratoForm;