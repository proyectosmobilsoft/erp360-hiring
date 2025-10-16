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
  nit: isEditing ? Yup.string() : Yup.string().required("Campo requerido"),
  nombreCliente: isEditing ? Yup.string() : Yup.string().required("Campo requerido"),
  observacion: Yup.string(),
  objetoContrato: Yup.string().required("Campo requerido"),
  noContrato: Yup.string().required("Campo requerido"),
  fechaInicial: Yup.string().required("Campo requerido"),
  fechaFinal: Yup.string()
    .required("Campo requerido")
    .test('fecha-mayor', 'La fecha final debe ser mayor a la fecha inicial', function(value) {
      const { fechaInicial } = this.parent;
      if (!value || !fechaInicial) return true;
      return new Date(value) > new Date(fechaInicial);
    }),
  fechaEjecucion: Yup.string()
    .required("Campo requerido")
    .test('fecha-ejecucion', 'La fecha de ejecución debe ser mayor o igual a la fecha inicial', function(value) {
      const { fechaInicial } = this.parent;
      if (!value || !fechaInicial) return true;
      return new Date(value) >= new Date(fechaInicial);
    }),
  valorContrato: Yup.string().required("Campo requerido"),
  noPpl: Yup.number()
    .typeError("Campo requerido")
    .min(0, "No puede ser negativo")
    .integer("Debe ser un número entero"),
  noCiclos: Yup.number()
    .typeError("Campo requerido")
    .min(0, "No puede ser negativo")
    .integer("Debe ser un número entero"),
  noServicios: Yup.number()
    .typeError("Campo requerido")
    .min(0, "No puede ser negativo")
    .integer("Debe ser un número entero"),
  estadoProceso: Yup.string().required("Campo requerido"),
  sedeAdministrativa: Yup.string().required("Campo requerido"),
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
  objetoContrato: string;
  noContrato: string;
  fechaInicial: string;
  fechaFinal: string;
  fechaEjecucion: string;
  valorContrato: string;
  noPpl: number | string;
  noCiclos: number | string;
  noServicios: number | string;
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
  const [selectedZona, setSelectedZona] = useState('');
  const [showZonaDropdown, setShowZonaDropdown] = useState(false);

  const [sucursales, setSucursales] = useState<Sucursal[]>([]);
  const [zonasDisponibles, setZonasDisponibles] = useState<Zona[]>([]);
  const [contratosDisponibles, setContratosDisponibles] = useState<ContratoCRUD[]>([]);
  const [unidadesServicio, setUnidadesServicio] = useState<UnidadServicio[]>([]);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [pendingFormData, setPendingFormData] = useState<ContratoFormData | null>(null);
  const [showTercerosModal, setShowTercerosModal] = useState(false);
  const [terceroSeleccionado, setTerceroSeleccionado] = useState<Tercero | null>(null);
  const [terceroIdSeleccionado, setTerceroIdSeleccionado] = useState<number | null>(null);



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

      cargarZonasContrato();
    }
  }, [contratoEnEdicion]);



  console.log('ContratoForm - contratoEnEdicion recibido:', contratoEnEdicion); // Debug

  const initialValues: ContratoFormData = {
    nit: contratoEnEdicion?.nit || '', // NIT desde la base de datos
    nombreCliente: contratoEnEdicion?.nombre_cliente || '', // Nombre desde la base de datos
    observacion: contratoEnEdicion?.observacion || '',
    objetoContrato: contratoEnEdicion?.objetivo || '',
    noContrato: contratoEnEdicion?.no_contrato || '', // Número desde la base de datos
    fechaInicial: contratoEnEdicion?.fecha_inicial || '', // Fecha desde la base de datos
    fechaFinal: contratoEnEdicion?.fecha_final || '', // Fecha desde la base de datos
    fechaEjecucion: contratoEnEdicion?.fecha_arranque || '', // Fecha desde la base de datos
    valorContrato: contratoEnEdicion?.valor_contrato?.toString() || '0', // Valor desde la base de datos
    noPpl: contratoEnEdicion?.no_ppl || 0, // PPL desde la base de datos
    noCiclos: contratoEnEdicion?.no_ciclos || 0,
    noServicios: contratoEnEdicion?.no_servicios || 0, // Servicios desde la base de datos
    estadoProceso: contratoEnEdicion?.estado_proceso || 'ABIERTO', // Estado desde la base de datos, por defecto ABIERTO
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
          codigo: contratoEnEdicion?.codigo || `COD-${Date.now().toString().slice(-6)}`,
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
          no_ppl: parseInt(String(values.noPpl)) || 0,
          no_ciclos: parseInt(String(values.noCiclos)) || 0,
          no_servicios: parseInt(String(values.noServicios)) || 0,
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
          codigo: `COD-${Date.now().toString().slice(-6)}`,
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
          no_ppl: parseInt(String(values.noPpl)) || 0,
          no_ciclos: parseInt(String(values.noCiclos)) || 0,
          no_servicios: parseInt(String(values.noServicios)) || 0,
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
    <>
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
                <Card className="bg-white shadow-lg border-0">
                  <CardHeader className="bg-gradient-to-r from-teal-50 to-cyan-50 border-b border-teal-200">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-xl font-bold text-teal-800 flex items-center gap-2">
                        <FileText className="w-6 h-6 text-teal-600" />
                        {contratoEnEdicion ? 'Editar Contrato' : 'Registro de Contrato'}
                        {contratoEnEdicion && (
                          <Badge className="ml-2 bg-blue-100 text-blue-800 hover:bg-blue-100">
                            {contratoEnEdicion.no_contrato}
                          </Badge>
                        )}
                      </CardTitle>
                      <div className="flex items-center gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={handleCancelar}
                          className="text-teal-600 hover:text-teal-700 hover:bg-teal-50"
                        >
                          <X className="w-4 h-4 mr-1" />
                          Cancelar
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          disabled={isSubmitting}
                          className="bg-teal-600 hover:bg-teal-700 disabled:bg-teal-400 text-white"
                          onClick={async () => {
                            console.log('🔍 Botón clickeado, valores actuales:', values); // Debug
                            console.log('🔍 Errores de validación previos:', errors); // Debug
                            console.log('🔍 Modo edición:', !!contratoEnEdicion);
                            console.log('🔍 Contrato en edición completo:', contratoEnEdicion);

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
                          } catch (validationError: any) {
                            console.error('❌ Error de validación:', validationError); // Debug
                            console.error('❌ Errores detallados:', validationError.errors); // Debug
                            console.error('❌ Inner errors:', validationError.inner); // Debug
                            
                            // Mostrar qué campos específicos tienen error
                            const camposConError = validationError.inner?.map((err: any) => {
                              console.error(`  ❌ Campo con error: ${err.path} - ${err.message}`);
                              return `${err.path}: ${err.message}`;
                            }).join(' | ') || validationError.errors?.join(', ') || 'campos requeridos';
                            
                            console.error('❌ Resumen de errores:', camposConError);
                            
                            toast({
                              title: "Error de validación",
                              description: camposConError,
                              variant: "destructive",
                            });
                          }
                          }}
                        >
                          <Save className="w-4 h-4 mr-1" />
                          {contratoEnEdicion ? 'Actualizar' : 'Guardar'}
                        </Button>
                      </div>
                    </div>
                  </CardHeader>

                  {/* Sección de Tabs */}
                  <div className="p-4 bg-gray-50 border-b border-gray-200">
                    <div className="flex items-center justify-start">
                      <div className="w-full max-w-md">
                        <div className="grid w-full grid-cols-2 bg-teal-100/60 p-1 rounded-lg">
                          <button
                            type="button"
                            onClick={() => setActiveTab('general')}
                            className={`px-3 py-2 text-sm font-medium rounded-md transition-all duration-300 ${activeTab === 'general'
                              ? 'bg-teal-600 text-white shadow-md'
                              : 'text-gray-600 hover:text-gray-900'
                              }`}
                          >
                            Información General
                          </button>
                          <button
                            type="button"
                            onClick={() => setActiveTab('clausulas')}
                            className={`px-3 py-2 text-sm font-medium rounded-md transition-all duration-300 ${activeTab === 'clausulas'
                              ? 'bg-teal-600 text-white shadow-md'
                              : 'text-gray-600 hover:text-gray-900'
                              }`}
                          >
                            Cláusulas
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  <CardContent className="p-6">
                    <Form id="contrato-form">
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

                              {/* Primera fila - Cliente (NIT - Nombre) */}
                              <div className="mb-3">
                                <label className="block text-sm text-gray-700 mb-1">
                                  Cliente (NIT - Nombre) <span className="text-red-500">*</span>
                                </label>
                                <input
                                  type="text"
                                  name="nombreCliente"
                                  value={values.nit ? `${values.nit} - ${values.nombreCliente}` : values.nombreCliente}
                                  onClick={() => {
                                    if (!contratoEnEdicion) {
                                      setShowTercerosModal(true);
                                    }
                                  }}
                                  readOnly
                                  autoComplete="off"
                                  className={`w-full px-2 py-1.5 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-teal-500 focus:border-teal-500 ${contratoEnEdicion
                                    ? 'bg-gray-100 cursor-not-allowed'
                                    : 'bg-yellow-50 cursor-pointer hover:bg-yellow-100'
                                    }`}
                                  placeholder={contratoEnEdicion ? '' : 'Haga clic para seleccionar tercero'}
                                />
                                {(errors.nit && touched.nit) || (errors.nombreCliente && touched.nombreCliente) ? (
                                  <p className="text-red-600 text-xs mt-1">{errors.nit || errors.nombreCliente}</p>
                                ) : null}
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
                                  autoComplete="off"
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
                                <div className="grid grid-cols-1 md:grid-cols-6 gap-3 items-end">
                                  <div className="col-span-3">
                                    <SelectWithSearch
                                      options={zonasDisponibles.map(z => ({ id: z.id.toString(), nombre: z.nombre }))}
                                      value={selectedZona}
                                      onChange={setSelectedZona}
                                      placeholder="Seleccione una Zona"

                                    />
                                  </div>
                                  <div className="col-span-2">
                                    <label className="block text-sm text-gray-700 mb-1">No PPL</label>
                                    <input
                                      type="text"
                                      name="noPplZona"
                                      value={selectedZona ? (zonasDisponibles.find(z => z.nombre === selectedZona)?.no_ppl || 0) : ''}
                                      className="w-full px-2 py-1.5 border border-gray-300 rounded bg-gray-100 focus:ring-2 focus:ring-teal-500 focus:border-teal-500 text-sm"
                                      disabled
                                      readOnly
                                      autoComplete="off"
                                    />
                                  </div>
                                  <div className="col-span-1">
                                    <button
                                      type="button"
                                      onClick={handleAddZona}
                                      disabled={!selectedZona || !((zonasDisponibles.find(z => z.nombre === selectedZona)?.no_ppl || 0) > 0)}
                                      className={`w-full px-2 py-1.5 rounded flex items-center justify-center transition-colors text-sm ${selectedZona && ((zonasDisponibles.find(z => z.nombre === selectedZona)?.no_ppl || 0) > 0)
                                        ? 'bg-teal-500 hover:bg-teal-600 text-white'
                                        : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                        }`}
                                    >
                                      <Plus className="w-4 h-4" />
                                    </button>
                                  </div>
                                </div>

                                {/* Tabla de zonas */}
                                <div className="mt-3">
                                  <div className="bg-teal-50 border border-gray-200 rounded-t">
                                    <div className="flex justify-between items-center p-3 font-medium text-sm text-teal-800">
                                      <div className="flex-1">Zonas Asociadas</div>
                                      <div className="w-20 text-center">Acciones</div>
                                    </div>
                                  </div>
                                  <div className="border border-t-0 border-gray-200 rounded-b bg-white">
                                    {zonasAgregadas.length > 0 ? (
                                      zonasAgregadas.map((zona, index) => (
                                        <div key={zona.id} className="flex justify-between items-center p-3 border-b border-gray-100 last:border-b-0 hover:bg-teal-50/30 transition-colors">
                                          <div className="flex-1 flex items-center gap-3">
                                            <Badge variant="outline" className="bg-teal-600 text-white border-teal-600 font-semibold px-3 py-1">
                                              {zona.codigo}
                                            </Badge>
                                            <div className="flex flex-col">
                                              <span className="text-sm font-semibold text-gray-900">{zona.nombre}</span>
                                              <span className="text-xs text-gray-500">PPL: {zona.noPpl}</span>
                                            </div>
                                          </div>
                                          <div className="w-20 flex justify-center">
                                            <button
                                              type="button"
                                              onClick={() => setZonasAgregadas(prev => prev.filter(z => z.id !== zona.id))}
                                              className="text-red-500 hover:text-red-700 p-2 hover:bg-red-50 rounded-full transition-colors"
                                              title="Quitar zona"
                                            >
                                              <Trash2 className="w-4 h-4" />
                                            </button>
                                          </div>
                                        </div>
                                      ))
                                    ) : (
                                      <div className="p-8 text-center">
                                        <MapPin className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                                        <p className="text-gray-500 text-sm">No hay zonas asociadas</p>
                                        <p className="text-gray-400 text-xs mt-1">Seleccione una zona y haga clic en el botón + para agregar</p>
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
                                {(contratoEnEdicion || values.noContrato) && (
                                  <Badge className="bg-red-100 text-red-700 hover:bg-red-100 font-bold">
                                    # {contratoEnEdicion?.codigo || `COD-${values.noContrato}`}
                                  </Badge>
                                )}
                              </h3>

                              {/* Primera fila - Objeto del Contrato */}
                              <div className="mb-3">
                                <label className="block text-sm text-gray-700 mb-1">
                                  Objeto del Contrato <span className="text-red-500">*</span>
                                </label>
                                <input
                                  type="text"
                                  name="objetoContrato"
                                  value={values.objetoContrato}
                                  onChange={handleChange}
                                  onBlur={handleBlur}
                                  autoComplete="off"
                                  className="w-full px-2 py-1.5 border border-gray-300 rounded bg-yellow-50 focus:ring-2 focus:ring-teal-500 focus:border-teal-500 text-sm"
                                />
                                {errors.objetoContrato && touched.objetoContrato && (
                                  <p className="text-red-600 text-xs mt-1">{errors.objetoContrato}</p>
                                )}
                              </div>

                              {/* Campos en 4 columnas */}
                              <div className="grid grid-cols-4 gap-4 mb-3">
                                <div>
                                  <label className="block text-sm text-gray-700 mb-1">
                                    N° Contrato <span className="text-red-500">*</span>
                                  </label>
                                  <input
                                    type="text"
                                    name="noContrato"
                                    value={values.noContrato}
                                    onChange={handleChange}
                                    onBlur={handleBlur}
                                    autoComplete="off"
                                    className="w-full px-2 py-1.5 border border-gray-300 rounded bg-yellow-50 focus:ring-2 focus:ring-teal-500 focus:border-teal-500 text-sm"
                                  />
                                  {errors.noContrato && touched.noContrato && (
                                    <p className="text-red-600 text-xs mt-1">{errors.noContrato}</p>
                                  )}
                                </div>
                                <div>
                                  <label className="block text-sm text-gray-700 mb-1">
                                    No PPL <span className="text-red-500">*</span>
                                  </label>
                                  <input
                                    type="number"
                                    name="noPpl"
                                    value={values.noPpl}
                                    onChange={handleChange}
                                    onBlur={handleBlur}
                                    autoComplete="off"
                                    className="w-full px-2 py-1.5 border border-gray-300 rounded bg-yellow-50 focus:ring-2 focus:ring-teal-500 focus:border-teal-500 text-sm"
                                  />
                                  {errors.noPpl && touched.noPpl && (
                                    <p className="text-red-600 text-xs mt-1">{errors.noPpl}</p>
                                  )}
                                </div>
                                <div>
                                  <label className="block text-sm text-gray-700 mb-1">
                                    No Ciclos <span className="text-red-500">*</span>
                                  </label>
                                  <input
                                    type="number"
                                    name="noCiclos"
                                    value={values.noCiclos}
                                    onChange={handleChange}
                                    onBlur={handleBlur}
                                    autoComplete="off"
                                    className="w-full px-2 py-1.5 border border-gray-300 rounded bg-yellow-50 focus:ring-2 focus:ring-teal-500 focus:border-teal-500 text-sm"
                                  />
                                  {errors.noCiclos && touched.noCiclos && (
                                    <p className="text-red-600 text-xs mt-1">{errors.noCiclos}</p>
                                  )}
                                </div>
                                <div>
                                  <label className="block text-sm text-gray-700 mb-1">
                                    No. Servicios <span className="text-red-500">*</span>
                                  </label>
                                  <input
                                    type="number"
                                    name="noServicios"
                                    value={values.noServicios}
                                    onChange={handleChange}
                                    onBlur={handleBlur}
                                    autoComplete="off"
                                    className="w-full px-2 py-1.5 border border-gray-300 rounded bg-yellow-50 focus:ring-2 focus:ring-teal-500 focus:border-teal-500 text-sm"
                                  />
                                  {errors.noServicios && touched.noServicios && (
                                    <p className="text-red-600 text-xs mt-1">{errors.noServicios}</p>
                                  )}
                                </div>
                              </div>

                              {/* Segunda fila - Valor, Estado y Sede */}
                              <div className="grid grid-cols-2 gap-2 mb-3">
                                <div>
                                  <label className="block text-sm text-gray-700 mb-1">
                                    Estado Proceso <span className="text-red-500">*</span>
                                  </label>
                                  <SelectWithSearch
                                    options={estadosProceso}
                                    value={values.estadoProceso}
                                    onChange={(value) => setFieldValue('estadoProceso', value)}
                                    placeholder="Seleccione estado"
                                    disabled={true}
                                  />
                                </div>
                                <div>
                                  <label className="block text-sm text-gray-700 mb-1">
                                    Valor <span className="text-red-500">*</span>
                                  </label>
                                  <input
                                    type="text"
                                    name="valorContrato"
                                    value={formatCurrency(parseFloat(values.valorContrato) || 0)}
                                    onChange={(e) => handleCurrencyChange(e, setFieldValue)}
                                    onBlur={handleBlur}
                                    autoComplete="off"
                                    className="w-full px-2 py-1.5 border border-gray-300 rounded bg-yellow-50 focus:ring-2 focus:ring-teal-500 focus:border-teal-500 text-sm text-right"
                                  />
                                  {errors.valorContrato && touched.valorContrato && (
                                    <p className="text-red-600 text-xs mt-1">{errors.valorContrato}</p>
                                  )}
                                </div>

                              </div>

                              <div className="grid grid-cols-1 gap-3 mb-3">
                                <div>
                                  <label className="block text-sm text-gray-700 mb-1">
                                    Sede Administrativa <span className="text-red-500">*</span>
                                  </label>
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
                                  <label className="block text-sm text-gray-700 mb-1">
                                    Fecha Inicial <span className="text-red-500">*</span>
                                  </label>
                                  <input
                                    type="date"
                                    name="fechaInicial"
                                    value={values.fechaInicial}
                                    onChange={handleChange}
                                    onBlur={handleBlur}
                                    onClick={(e) => e.currentTarget.showPicker?.()}
                                    autoComplete="off"
                                    className="w-full px-2 py-1.5 border border-gray-300 rounded bg-yellow-50 focus:ring-2 focus:ring-teal-500 focus:border-teal-500 text-sm cursor-pointer"
                                  />
                                  {errors.fechaInicial && touched.fechaInicial && (
                                    <p className="text-red-600 text-xs mt-1">{errors.fechaInicial}</p>
                                  )}
                                </div>
                                <div>
                                  <label className="block text-sm text-gray-700 mb-1">
                                    Fecha Final <span className="text-red-500">*</span>
                                  </label>
                                  <input
                                    type="date"
                                    name="fechaFinal"
                                    value={values.fechaFinal}
                                    onChange={handleChange}
                                    onBlur={handleBlur}
                                    onClick={(e) => e.currentTarget.showPicker?.()}
                                    autoComplete="off"
                                    min={values.fechaInicial || undefined}
                                    className="w-full px-2 py-1.5 border border-gray-300 rounded bg-yellow-50 focus:ring-2 focus:ring-teal-500 focus:border-teal-500 text-sm cursor-pointer"
                                  />
                                  {errors.fechaFinal && touched.fechaFinal && (
                                    <p className="text-red-600 text-xs mt-1">{errors.fechaFinal}</p>
                                  )}
                                </div>
                                <div>
                                  <label className="block text-sm text-gray-700 mb-1">
                                    Fecha Ejecución <span className="text-red-500">*</span>
                                  </label>
                                  <input
                                    type="date"
                                    name="fechaEjecucion"
                                    value={values.fechaEjecucion}
                                    onChange={handleChange}
                                    onBlur={handleBlur}
                                    onClick={(e) => e.currentTarget.showPicker?.()}
                                    autoComplete="off"
                                    min={values.fechaInicial || undefined}
                                    className="w-full px-2 py-1.5 border border-gray-300 rounded bg-yellow-50 focus:ring-2 focus:ring-teal-500 focus:border-teal-500 text-sm cursor-pointer"
                                  />
                                  {errors.fechaEjecucion && touched.fechaEjecucion && (
                                    <p className="text-red-600 text-xs mt-1">{errors.fechaEjecucion}</p>
                                  )}
                                </div>
                              </div>


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
                                <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
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
                                  autoComplete="off"
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
                    </Form>
                  </CardContent>
                </Card>

                {/* Modal de selección de terceros */}
                <TercerosModal
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
                className="bg-teal-600 hover:bg-teal-700"
              >
                {contratoEnEdicion ? 'Actualizar' : 'Guardar'}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
    </>
  );
};

export default ContratoForm;