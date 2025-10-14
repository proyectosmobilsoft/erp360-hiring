import React, { useState, useEffect } from 'react';
import { 
  Search, 
  Filter, 
  Eye, 
  Edit, 
  Trash2, 
  Plus,
  Minus,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  FileText,
  Building,
  Calendar,
  Users,
  AlertCircle,
  Loader2,
  MapPin,
  Package,
  UtensilsCrossed,
  CheckCircle,
  XCircle
} from 'lucide-react';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from './ui/table';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './ui/tooltip';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from './ui/alert-dialog';
import { toast } from 'sonner';
import { useGlobalLoading } from '../contexts/GlobalLoadingContext';
import { supabase } from '../services/supabaseClient';

interface AsignacionData {
  id: number;
  id_producto_by_unidad: number;
  id_contrato: number;
  id_unidad_servicio: number;
  id_zona?: number;
  estado: number;
  // Campos relacionados con nombres
  nombre_receta?: string;
  codigo_receta?: string;
  nombre_contrato?: string;
  numero_contrato?: string;
  nombre_unidad_servicio?: string;
  zona_nombre?: string;
  tipo_menu?: string;
  servicio_nombre?: string;
  created_at?: string;
}

interface EntidadAgrupada {
  id_contrato: number;
  nombre_entidad: string;
  nit: string;
  zonas: ZonaAgrupada[];
  totalAsignaciones: number;
}

interface ZonaAgrupada {
  id_zona: number;
  nombre_zona: string;
  unidades: UnidadAgrupada[];
  totalAsignaciones: number;
}

interface UnidadAgrupada {
  id_unidad: number;
  nombre_unidad: string;
  asignaciones: AsignacionData[];
}

interface AsignacionesTableProps {
  onEdit?: (asignacion: AsignacionData) => void;
  onView?: (asignacion: AsignacionData) => void;
  onDelete?: (asignacion: AsignacionData) => void;
  onAdd?: () => void;
}

const AsignacionesTable: React.FC<AsignacionesTableProps> = ({
  onEdit,
  onView,
  onDelete,
  onAdd
}) => {
  const { showLoading, hideLoading } = useGlobalLoading();
  
  const [asignaciones, setAsignaciones] = useState<AsignacionData[]>([]);
  const [entidadesAgrupadas, setEntidadesAgrupadas] = useState<EntidadAgrupada[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const itemsPerPage = 10;
  
  // Estados para controlar qué grupos están expandidos
  const [entidadesExpandidas, setEntidadesExpandidas] = useState<Set<number>>(new Set());
  const [zonasExpandidas, setZonasExpandidas] = useState<Set<string>>(new Set());
  const [unidadesExpandidas, setUnidadesExpandidas] = useState<Set<string>>(new Set());

  // Función para cargar asignaciones con datos relacionados
  const cargarAsignaciones = async (page: number = 1) => {
    try {
      setLoading(true);
      
      const { data, error, count } = await supabase
        .from('inv_productos_unidad_servicio')
        .select(`
          id,
          id_producto_by_unidad,
          id_contrato,
          id_unidad_servicio,
          estado,
          created_at,
          inv_producto_by_unidades!inner(
            id,
            id_producto,
            id_unidad_servicio,
            inv_productos!inner(
              id,
              nombre,
              tipo_menu,
              inv_clase_servicios(
                nombre
              )
            )
          ),
          prod_contratos!inner(
            no_contrato,
            objetivo,
            estado,
            con_terceros!inner(
              nombre_tercero,
              documento
            )
          )
        `, { count: 'exact' })
        .range((page - 1) * itemsPerPage, page * itemsPerPage - 1)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error cargando asignaciones:', error);
        toast.error("No se pudieron cargar las asignaciones", {
          description: error.message || "Error al consultar la base de datos"
        });
        return;
      }

      // Obtener información de unidades de servicio por separado
      const unidadIds = [...new Set((data || []).map(item => item.id_unidad_servicio))];
      let unidadesInfo: any[] = [];
      
      if (unidadIds.length > 0) {
        const { data: unidadesData, error: unidadesError } = await supabase
          .from('prod_unidad_servicios')
          .select(`
            id,
            nombre_servicio,
            codigo
          `)
          .in('id', unidadIds);

        if (unidadesError) {
          console.error('Error obteniendo información de unidades:', unidadesError);
        } else {
          unidadesInfo = unidadesData || [];
        }
        
        // Obtener información de zonas por separado a través de prod_zonas_detalle_contratos
        if (unidadesData && unidadesData.length > 0) {
          const { data: zonasData, error: zonasError } = await supabase
            .from('prod_zonas_detalle_contratos')
            .select(`
              id_unidad_servicio,
              prod_zonas_contrato!inner(
                id,
                nombre
              )
            `)
            .in('id_unidad_servicio', unidadIds);

          if (!zonasError && zonasData) {
            // Crear un mapa de unidad_servicio -> zona
            const zonasMap = new Map(zonasData.map(z => [z.id_unidad_servicio, z.prod_zonas_contrato]));
            
            // Agregar información de zona a cada unidad
            unidadesInfo = unidadesInfo.map(u => ({
              ...u,
              prod_zonas: zonasMap.get(u.id)
            }));
          }
        }
      }

      // Crear un mapa para acceso rápido a la información de unidades
      const unidadesMap = new Map(unidadesInfo.map(u => [u.id, u]));

      // Transformar los datos para incluir nombres relacionados
      const asignacionesTransformadas: AsignacionData[] = (data || []).map((item: any) => {
        const unidadInfo = unidadesMap.get(item.id_unidad_servicio);
        const producto = item.inv_producto_by_unidades?.inv_productos;
        const contrato = item.prod_contratos;
        const tercero = contrato?.con_terceros;
        
        return {
          id: item.id,
          id_producto_by_unidad: item.id_producto_by_unidad,
          id_contrato: item.id_contrato,
          id_unidad_servicio: item.id_unidad_servicio,
          id_zona: unidadInfo?.prod_zonas?.id,
          estado: item.estado,
          nombre_receta: producto?.nombre || 'Sin nombre',
          codigo_receta: '',
          nombre_contrato: tercero?.nombre_tercero || 'Sin entidad',
          numero_contrato: tercero?.documento || 'Sin NIT',
          nombre_unidad_servicio: unidadInfo?.nombre_servicio || 'Sin unidad',
          zona_nombre: unidadInfo?.prod_zonas?.nombre || 'Sin zona',
          tipo_menu: producto?.tipo_menu || 'Sin tipo',
          servicio_nombre: producto?.inv_clase_servicios?.nombre || 'Sin servicio',
          created_at: item.created_at
        };
      });

      setAsignaciones(asignacionesTransformadas);
      
      // Agrupar datos
      const agrupadas = agruparAsignaciones(asignacionesTransformadas);
      setEntidadesAgrupadas(agrupadas);
      
      setTotalItems(count || 0);
      setTotalPages(Math.ceil((count || 0) / itemsPerPage));
      
    } catch (error: any) {
      console.error('Error inesperado:', error);
      toast.error("Error inesperado al cargar las asignaciones", {
        description: error.message || "Por favor, intenta nuevamente"
      });
    } finally {
      setLoading(false);
    }
  };

  // Función para agrupar asignaciones por entidad, zona y unidad
  const agruparAsignaciones = (asignaciones: AsignacionData[]): EntidadAgrupada[] => {
    const entidadesMap = new Map<number, EntidadAgrupada>();

    asignaciones.forEach(asignacion => {
      // Agrupar por entidad
      if (!entidadesMap.has(asignacion.id_contrato)) {
        entidadesMap.set(asignacion.id_contrato, {
          id_contrato: asignacion.id_contrato,
          nombre_entidad: asignacion.nombre_contrato || 'Sin entidad',
          nit: asignacion.numero_contrato || 'Sin NIT',
          zonas: [],
          totalAsignaciones: 0
        });
      }

      const entidad = entidadesMap.get(asignacion.id_contrato)!;
      entidad.totalAsignaciones++;

      // Agrupar por zona dentro de la entidad
      let zona = entidad.zonas.find(z => z.id_zona === asignacion.id_zona);
      if (!zona) {
        zona = {
          id_zona: asignacion.id_zona || 0,
          nombre_zona: asignacion.zona_nombre || 'Sin zona',
          unidades: [],
          totalAsignaciones: 0
        };
        entidad.zonas.push(zona);
      }
      zona.totalAsignaciones++;

      // Agrupar por unidad dentro de la zona
      let unidad = zona.unidades.find(u => u.id_unidad === asignacion.id_unidad_servicio);
      if (!unidad) {
        unidad = {
          id_unidad: asignacion.id_unidad_servicio,
          nombre_unidad: asignacion.nombre_unidad_servicio || 'Sin unidad',
          asignaciones: []
        };
        zona.unidades.push(unidad);
      }
      unidad.asignaciones.push(asignacion);
    });

    return Array.from(entidadesMap.values());
  };

  useEffect(() => {
    cargarAsignaciones(currentPage);
  }, [currentPage]);

  // Escuchar evento de recarga de asignaciones
  useEffect(() => {
    const handleRecargar = () => {
      console.log('🔄 Recargando tabla de asignaciones...');
      cargarAsignaciones(currentPage);
    };

    window.addEventListener('recargar-asignaciones', handleRecargar);

    return () => {
      window.removeEventListener('recargar-asignaciones', handleRecargar);
    };
  }, [currentPage]);

  // Filtrar entidades agrupadas cuando cambien los filtros
  const [entidadesFiltradas, setEntidadesFiltradas] = useState<EntidadAgrupada[]>([]);

  useEffect(() => {
    const filtradas = entidadesAgrupadas.filter(entidad => {
      // Si no hay término de búsqueda, solo aplicar filtro de estado
      if (!searchTerm.trim()) {
        return entidad.zonas.some(zona => 
          zona.unidades.some(unidad => 
            unidad.asignaciones.some(asignacion => 
              statusFilter === 'all' ||
              (statusFilter === 'active' && asignacion.estado === 1) ||
              (statusFilter === 'inactive' && asignacion.estado === 0)
            )
          )
        );
      }

      // Buscar solo en contrato, zona y unidades (primer nivel)
      const searchLower = searchTerm.toLowerCase();
    const matchesSearch = 
        entidad.nombre_entidad.toLowerCase().includes(searchLower) ||
        entidad.zonas.some(zona => 
          zona.nombre_zona.toLowerCase().includes(searchLower) ||
          zona.unidades.some(unidad => 
            unidad.nombre_unidad.toLowerCase().includes(searchLower)
          )
        );

      if (!matchesSearch) return false;

      // Aplicar filtro de estado si hay coincidencias de búsqueda
      return entidad.zonas.some(zona => 
        zona.unidades.some(unidad => 
          unidad.asignaciones.some(asignacion => 
            statusFilter === 'all' ||
      (statusFilter === 'active' && asignacion.estado === 1) ||
            (statusFilter === 'inactive' && asignacion.estado === 0)
          )
        )
      );
    });

    setEntidadesFiltradas(filtradas);
  }, [entidadesAgrupadas, searchTerm, statusFilter]);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleRefresh = () => {
    cargarAsignaciones(currentPage);
  };

  const getStatusBadge = (estado: number) => {
    if (estado === 1) {
      return <Badge className="bg-green-100 text-green-800 hover:bg-green-100"><CheckCircle className="w-3 h-3 mr-1" />Activo</Badge>;
    } else {
      return <Badge variant="secondary"><XCircle className="w-3 h-3 mr-1" />Inactivo</Badge>;
    }
  };

  // Funciones para manejar expansión/colapso
  const toggleEntidad = (idContrato: number) => {
    const newSet = new Set(entidadesExpandidas);
    if (newSet.has(idContrato)) {
      newSet.delete(idContrato);
    } else {
      newSet.add(idContrato);
    }
    setEntidadesExpandidas(newSet);
  };

  const toggleZona = (idContrato: number, idZona: number) => {
    const key = `${idContrato}-${idZona}`;
    const newSet = new Set(zonasExpandidas);
    if (newSet.has(key)) {
      newSet.delete(key);
    } else {
      newSet.add(key);
    }
    setZonasExpandidas(newSet);
  };

  const toggleUnidad = (idContrato: number, idZona: number, idUnidad: number) => {
    const key = `${idContrato}-${idZona}-${idUnidad}`;
    const newSet = new Set(unidadesExpandidas);
    if (newSet.has(key)) {
      newSet.delete(key);
    } else {
      newSet.add(key);
    }
    setUnidadesExpandidas(newSet);
  };

  return (
    <Card className="shadow-lg">
      <CardHeader className="bg-gradient-to-r from-teal-50 to-cyan-50 border-b border-teal-200">
        <div className="flex items-center justify-between">
          <CardTitle className="text-xl font-bold text-teal-800 flex items-center gap-2">
            <UtensilsCrossed className="w-6 h-6 text-teal-600" />
            Asignaciones de Menús
          </CardTitle>
          <div className="flex items-center gap-2">
            <Button
              onClick={handleRefresh}
              variant="outline"
              size="sm"
              disabled={loading}
              className="text-teal-600 hover:text-teal-700 hover:bg-teal-50"
            >
              <RefreshCw className={`w-4 h-4 mr-1 ${loading ? 'animate-spin' : ''}`} />
              Actualizar
            </Button>
            {onAdd && (
              <Button
                onClick={onAdd}
                className="bg-teal-600 hover:bg-teal-700 text-white"
              >
                <Plus className="w-4 h-4 mr-1" />
                Nueva Asignación
              </Button>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-0">
        {/* Filtros */}
        <div className="p-4 bg-gray-50 border-b border-gray-200">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Buscar por unidad, contrato o zona..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="w-full sm:w-48">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Filtrar por estado" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los estados</SelectItem>
                  <SelectItem value="active">Activos</SelectItem>
                  <SelectItem value="inactive">Inactivos</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Tabla */}
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50">
                <TableHead className="font-semibold text-gray-700 text-left">Unidad de Servicio</TableHead>
                <TableHead className="font-semibold text-gray-700 text-xs w-40 text-left">Recetas Asignadas</TableHead>
                <TableHead className="font-semibold text-gray-700 text-xs w-40 text-left">Tipo Menú</TableHead>
                <TableHead className="font-semibold text-gray-700 text-xs w-44 text-left">Última Asignación</TableHead>
                <TableHead className="font-semibold text-gray-700 text-center w-20">Estado</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8">
                    <div className="flex items-center justify-center gap-2">
                      <Loader2 className="w-5 h-5 animate-spin text-teal-600" />
                      <span className="text-gray-600">Cargando asignaciones...</span>
                    </div>
                  </TableCell>
                </TableRow>
              ) : entidadesFiltradas.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8">
                    <div className="flex flex-col items-center gap-2">
                      <Package className="w-12 h-12 text-gray-400" />
                      <span className="text-gray-600">
                        {searchTerm.trim() ? 'No se encontraron resultados para la búsqueda' : 'No se encontraron asignaciones'}
                      </span>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                entidadesFiltradas.flatMap((entidad) =>
                  entidad.zonas.flatMap((zona) =>
                    zona.unidades.map((unidad) => {
                              const unidadKey = `${entidad.id_contrato}-${zona.id_zona}-${unidad.id_unidad}`;
                              const unidadExpandida = unidadesExpandidas.has(unidadKey);
                              
                              return (
                                <React.Fragment key={`unidad-${unidadKey}`}>
                          {/* Fila principal de la unidad de servicio */}
                          <TableRow className="hover:bg-cyan-50/50 transition-colors duration-200">
                            <TableCell className="py-3 text-left">
                              <div className="flex items-center gap-2">
                                <TooltipProvider>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                        <Button 
                                          variant="ghost" 
                                        size="icon"
                                        onClick={() => toggleUnidad(entidad.id_contrato, zona.id_zona, unidad.id_unidad)}
                                        aria-label="Expandir/Contraer"
                                        className={`h-6 w-6 p-0 text-blue-600 hover:text-blue-700 hover:bg-blue-100 rounded-full transition-all duration-300 transform ${
                                          unidadExpandida ? 'rotate-180' : 'rotate-0'
                                        }`}
                                      >
                                        {unidadExpandida ? (
                                          <Minus className="w-3 h-3" />
                                        ) : (
                                          <Plus className="w-3 h-3" />
                                        )}
                                        </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      <p>{unidadExpandida ? 'Contraer' : 'Expandir'}</p>
                                    </TooltipContent>
                                  </Tooltip>
                                </TooltipProvider>
                                <div className="flex-1">
                                  <div className="text-sm font-semibold text-cyan-600 mb-1">
                                    {unidad.nombre_unidad}
                                  </div>
                                  <div className="text-xs text-gray-600 mt-1">
                                    Contrato: <span className="font-medium text-blue-700">{entidad.nombre_entidad}</span> | Zona: <span className="font-medium text-orange-700">{zona.nombre_zona}</span>
                                  </div>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell className="py-3 text-left">
                              <div className="text-sm font-semibold text-green-600">
                                          {unidad.asignaciones.length} {unidad.asignaciones.length === 1 ? 'receta' : 'recetas'}
                              </div>
                            </TableCell>
                            <TableCell className="py-3 text-left">
                              <div className="flex flex-wrap gap-1">
                                {[...new Set(unidad.asignaciones.map(a => a.tipo_menu))].slice(0, 2).map((tipo, index) => (
                                  <Badge key={index} variant="outline" className="text-xs px-2 py-0.5">
                                    {tipo}
                                  </Badge>
                                ))}
                                {[...new Set(unidad.asignaciones.map(a => a.tipo_menu))].length > 2 && (
                                  <Badge variant="outline" className="text-xs px-2 py-0.5">
                                    +{[...new Set(unidad.asignaciones.map(a => a.tipo_menu))].length - 2}
                                        </Badge>
                                )}
                              </div>
                            </TableCell>
                            <TableCell className="py-3 text-left">
                              <div className="text-xs text-gray-800 font-medium">
                                {unidad.asignaciones.length > 0 ? new Date(Math.max(...unidad.asignaciones.map(a => new Date(a.created_at || 0).getTime()))).toLocaleDateString() : 'N/A'}
                                      </div>
                                    </TableCell>
                            <TableCell className="py-3 text-center">
                              <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
                                <CheckCircle className="w-3 h-3 mr-1" />Activo
                              </Badge>
                            </TableCell>
                                  </TableRow>

                          {/* Fila expandida con detalles de recetas */}
                          <TableRow className={`bg-gradient-to-r from-gray-50 to-cyan-50 transition-all duration-500 ease-in-out ${
                            unidadExpandida ? 'opacity-100' : 'opacity-0'
                          }`}>
                            <TableCell colSpan={5} className="p-0">
                              <div 
                                className={`overflow-hidden transition-all duration-500 ease-in-out ${
                                  unidadExpandida 
                                    ? 'max-h-[500px] opacity-100 transform translate-y-0' 
                                    : 'max-h-0 opacity-0 transform -translate-y-4'
                                }`}
                              >
                                <div className="p-4 flex justify-center animate-in slide-in-from-top-2 duration-300">
                                  <div className="w-full max-w-6xl">
                                    <h5 className="text-cyan-800 font-semibold text-sm mb-3 flex items-center gap-2">
                                      <UtensilsCrossed className="w-4 h-4" />
                                      Recetas asignadas a {unidad.nombre_unidad}
                                      <Badge variant="outline" className="ml-2 text-xs">
                                        {unidad.asignaciones.length} {unidad.asignaciones.length === 1 ? 'receta' : 'recetas'}
                                      </Badge>
                                    </h5>
                                    <div className="bg-white rounded-lg border border-cyan-200 overflow-hidden shadow-sm animate-in fade-in-0 duration-300 delay-100">
                                      <table className="w-full">
                                        <thead>
                                          <tr className="bg-gradient-to-r from-cyan-50 to-blue-50">
                                            <th className="px-3 py-2 text-left text-cyan-700 font-medium text-xs">Receta</th>
                                            <th className="px-3 py-2 text-left text-cyan-700 font-medium text-xs">Tipo Menú</th>
                                            <th className="px-3 py-2 text-left text-cyan-700 font-medium text-xs">Servicio</th>
                                            <th className="px-3 py-2 text-left text-cyan-700 font-medium text-xs">Asignado</th>
                                            <th className="px-3 py-2 text-left text-cyan-700 font-medium text-xs">Acciones</th>
                                          </tr>
                                        </thead>
                                        <tbody>
                                          {unidad.asignaciones.map((asignacion, index) => (
                                            <tr 
                                              key={asignacion.id} 
                                              className={`border-b border-cyan-200 hover:bg-cyan-50/50 transition-all duration-200 animate-in slide-in-from-left-2 ${
                                                index % 2 === 0 ? 'bg-white' : 'bg-gray-50/30'
                                              }`}
                                              style={{ animationDelay: `${index * 50}ms` }}
                                            >
                                              <td className="px-3 py-2 text-gray-700 text-xs">
                                        <div className="flex items-center gap-2">
                                          <UtensilsCrossed className="w-3 h-3 text-teal-600" />
                                                  <span className="font-medium">{asignacion.nombre_receta}</span>
                                        </div>
                                              </td>
                                              <td className="px-3 py-2 text-gray-700 text-xs">
                                                <Badge variant="outline" className="text-xs">
                                                  {asignacion.tipo_menu}
                                                </Badge>
                                              </td>
                                              <td className="px-3 py-2 text-gray-700 text-xs font-medium">{asignacion.servicio_nombre}</td>
                                              <td className="px-3 py-2 text-gray-700 text-xs font-medium">
                                            {asignacion.created_at ? new Date(asignacion.created_at).toLocaleDateString() : 'N/A'}
                                              </td>
                                              <td className="px-3 py-2 text-gray-700 text-xs">
                                          {onDelete && (
                                            <AlertDialog>
                                              <AlertDialogTrigger asChild>
                                                <Button
                                                  variant="ghost"
                                                  size="sm"
                                                        className="h-6 w-6 p-0 text-red-600 hover:text-red-700 hover:bg-red-100 transition-colors duration-200"
                                                >
                                                  <Trash2 className="w-3 h-3" />
                                                </Button>
                                              </AlertDialogTrigger>
                                              <AlertDialogContent>
                                                <AlertDialogHeader>
                                                  <AlertDialogTitle>¿Eliminar asignación?</AlertDialogTitle>
                                                  <AlertDialogDescription>
                                                    Esta acción no se puede deshacer. Se eliminará permanentemente la asignación de la receta "{asignacion.nombre_receta}" a la unidad "{asignacion.nombre_unidad_servicio}".
                                                  </AlertDialogDescription>
                                                </AlertDialogHeader>
                                                <AlertDialogFooter>
                                                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                                  <AlertDialogAction
                                                    onClick={() => onDelete(asignacion)}
                                                    className="bg-red-600 hover:bg-red-700"
                                                  >
                                                    Eliminar
                                                  </AlertDialogAction>
                                                </AlertDialogFooter>
                                              </AlertDialogContent>
                                            </AlertDialog>
                                          )}
                                              </td>
                                            </tr>
                                          ))}
                                        </tbody>
                                      </table>
                                    </div>
                                  </div>
                                </div>
                                        </div>
                                      </TableCell>
                                    </TableRow>
                    </React.Fragment>
                  );
                })
                  )
                )
              )}
            </TableBody>
          </Table>
        </div>

        {/* Paginación */}
        {totalPages > 1 && (
          <div className="p-4 border-t border-gray-200 bg-gray-50">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-600">
                Mostrando {((currentPage - 1) * itemsPerPage) + 1} a {Math.min(currentPage * itemsPerPage, totalItems)} de {totalItems} asignaciones
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft className="w-4 h-4 mr-1" />
                  Anterior
                </Button>
                <div className="flex items-center gap-1">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    const pageNum = currentPage <= 3 ? i + 1 : currentPage - 2 + i;
                    if (pageNum > totalPages) return null;
                    
                    return (
                      <Button
                        key={pageNum}
                        variant={currentPage === pageNum ? "default" : "outline"}
                        size="sm"
                        onClick={() => handlePageChange(pageNum)}
                        className={currentPage === pageNum ? "bg-teal-600 hover:bg-teal-700" : ""}
                      >
                        {pageNum}
                      </Button>
                    );
                  })}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                >
                  Siguiente
                  <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default AsignacionesTable;
