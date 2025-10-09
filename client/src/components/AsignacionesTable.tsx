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

  // Filtrar asignaciones
  const asignacionesFiltradas = asignaciones.filter(asignacion => {
    const matchesSearch = 
      asignacion.nombre_receta?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      asignacion.nombre_contrato?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      asignacion.numero_contrato?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      asignacion.nombre_unidad_servicio?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      asignacion.zona_nombre?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === 'all' || 
      (statusFilter === 'active' && asignacion.estado === 1) ||
      (statusFilter === 'inactive' && asignacion.estado === 0);

    return matchesSearch && matchesStatus;
  });

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
                  placeholder="Buscar por receta, contrato, unidad o zona..."
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
                <TableHead className="font-semibold text-gray-700">Entidad / Zona / Unidad / Receta</TableHead>
                <TableHead className="font-semibold text-gray-700 text-xs w-32">Tipo Menú</TableHead>
                <TableHead className="font-semibold text-gray-700 text-xs w-40">Servicio</TableHead>
                <TableHead className="font-semibold text-gray-700 text-xs w-32">Asignado</TableHead>
                <TableHead className="font-semibold text-gray-700 text-center w-20">Acciones</TableHead>
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
              ) : entidadesAgrupadas.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8">
                    <div className="flex flex-col items-center gap-2">
                      <Package className="w-12 h-12 text-gray-400" />
                      <span className="text-gray-600">No se encontraron asignaciones</span>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                entidadesAgrupadas.map((entidad) => {
                  const entidadExpandida = entidadesExpandidas.has(entidad.id_contrato);
                  
                  return (
                    <React.Fragment key={`entidad-${entidad.id_contrato}`}>
                      {/* Fila de Entidad */}
                      <TableRow 
                        className="bg-blue-50 hover:bg-blue-100 cursor-pointer font-semibold transition-colors duration-200"
                      >
                        <TableCell 
                          className="py-3 cursor-pointer"
                          onClick={() => toggleEntidad(entidad.id_contrato)}
                        >
                          <div className="flex items-center gap-2">
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="h-7 w-7 p-0 hover:bg-blue-200 hover:text-blue-800 transition-all duration-200 flex-shrink-0"
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleEntidad(entidad.id_contrato);
                              }}
                            >
                              {entidadExpandida ? <Minus className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                            </Button>
                            <FileText className="w-5 h-5 text-blue-600" />
                            <div>
                              <div className="font-semibold text-base">{entidad.nombre_entidad}</div>
                              <div className="text-xs text-gray-600">NIT: {entidad.nit}</div>
                            </div>
                            <Badge className="ml-2 bg-blue-600 hover:bg-blue-700 cursor-pointer transition-colors text-[10px] py-0 px-2 h-4">
                              {entidad.zonas.length} {entidad.zonas.length === 1 ? 'zona' : 'zonas'}
                            </Badge>
                          </div>
                        </TableCell>
                        <TableCell className="py-3"></TableCell>
                        <TableCell className="py-3"></TableCell>
                        <TableCell className="py-3"></TableCell>
                        <TableCell className="py-3"></TableCell>
                      </TableRow>

                      {/* Filas de Zonas */}
                      {entidadExpandida && entidad.zonas.map((zona) => {
                        const zonaKey = `${entidad.id_contrato}-${zona.id_zona}`;
                        const zonaExpandida = zonasExpandidas.has(zonaKey);
                        
                        return (
                          <React.Fragment key={`zona-${zonaKey}`}>
                            <TableRow 
                              className="bg-orange-50 hover:bg-orange-100 cursor-pointer transition-colors duration-200 animate-in slide-in-from-top-2"
                              style={{ marginLeft: '2rem' }}
                            >
                              <TableCell 
                                className="py-2.5 cursor-pointer pl-8"
                                onClick={() => toggleZona(entidad.id_contrato, zona.id_zona)}
                              >
                                <div className="flex items-center gap-2">
                                  <Button 
                                    variant="ghost" 
                                    size="sm" 
                                    className="h-6 w-6 p-0 hover:bg-orange-200 hover:text-orange-800 transition-all duration-200 flex-shrink-0"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      toggleZona(entidad.id_contrato, zona.id_zona);
                                    }}
                                  >
                                    {zonaExpandida ? <Minus className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
                                  </Button>
                                  <MapPin className="w-4 h-4 text-orange-600" />
                                  <span className="font-medium text-sm">{zona.nombre_zona}</span>
                                  <Badge className="ml-2 bg-orange-600 hover:bg-orange-700 cursor-pointer transition-colors text-[10px] py-0 px-2 h-4">
                                    {zona.unidades.length} {zona.unidades.length === 1 ? 'unidad' : 'unidades'}
                                  </Badge>
                                </div>
                              </TableCell>
                              <TableCell className="py-2.5"></TableCell>
                              <TableCell className="py-2.5"></TableCell>
                              <TableCell className="py-2.5"></TableCell>
                              <TableCell className="py-2.5"></TableCell>
                            </TableRow>

                            {/* Filas de Unidades */}
                            {zonaExpandida && zona.unidades.map((unidad) => {
                              const unidadKey = `${entidad.id_contrato}-${zona.id_zona}-${unidad.id_unidad}`;
                              const unidadExpandida = unidadesExpandidas.has(unidadKey);
                              
                              return (
                                <React.Fragment key={`unidad-${unidadKey}`}>
                                  <TableRow 
                                    className="bg-purple-50 hover:bg-purple-100 cursor-pointer transition-colors duration-200 animate-in slide-in-from-top-2"
                                    style={{ marginLeft: '4rem' }}
                                  >
                                    <TableCell 
                                      className="py-2 cursor-pointer pl-12"
                                      onClick={() => toggleUnidad(entidad.id_contrato, zona.id_zona, unidad.id_unidad)}
                                    >
                                      <div className="flex items-center gap-2 flex-nowrap">
                                        <Button 
                                          variant="ghost" 
                                          size="sm" 
                                          className="h-5 w-5 p-0 hover:bg-purple-200 hover:text-purple-800 transition-all duration-200 flex-shrink-0"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            toggleUnidad(entidad.id_contrato, zona.id_zona, unidad.id_unidad);
                                          }}
                                        >
                                          {unidadExpandida ? <Minus className="w-3 h-3" /> : <Plus className="w-3 h-3" />}
                                        </Button>
                                        <Building className="w-3.5 h-3.5 text-purple-600 flex-shrink-0" />
                                        <span className="font-medium whitespace-nowrap" style={{ fontSize: '0.75rem' }}>{unidad.nombre_unidad}</span>
                                        <Badge className="ml-2 bg-purple-600 hover:bg-purple-700 cursor-pointer transition-colors text-[10px] py-0 px-2 h-4 flex-shrink-0 whitespace-nowrap">
                                          {unidad.asignaciones.length} {unidad.asignaciones.length === 1 ? 'receta' : 'recetas'}
                                        </Badge>
                                      </div>
                                    </TableCell>
                                    <TableCell className="py-2"></TableCell>
                                    <TableCell className="py-2"></TableCell>
                                    <TableCell className="py-2"></TableCell>
                                    <TableCell className="py-2"></TableCell>
                                  </TableRow>

                                  {/* Filas de Recetas */}
                                  {unidadExpandida && unidad.asignaciones.map((asignacion, index) => (
                                    <TableRow 
                                      key={`receta-${asignacion.id}`} 
                                      className={`transition-colors duration-150 animate-in fade-in slide-in-from-top-1 ${
                                        index % 2 === 0 ? 'bg-gray-50' : 'bg-white'
                                      }`}
                                      style={{ marginLeft: '6rem' }}
                                    >
                                      <TableCell className="py-1.5 pl-16">
                                        <div className="flex items-center gap-2">
                                          <UtensilsCrossed className="w-3 h-3 text-teal-600" />
                                          <span className="font-medium text-xs text-gray-800">{asignacion.nombre_receta}</span>
                                        </div>
                                      </TableCell>
                                      <TableCell className="py-1.5">
                                        <span className="text-xs text-gray-800 font-medium">{asignacion.tipo_menu}</span>
                                      </TableCell>
                                      <TableCell className="py-1.5">
                                        <span className="text-xs text-gray-800 font-medium">{asignacion.servicio_nombre}</span>
                                      </TableCell>
                                      <TableCell className="py-1.5">
                                        <div className="flex items-center gap-1">
                                          <Calendar className="w-3 h-3 text-gray-500" />
                                          <span className="text-xs text-gray-800 font-medium">
                                            {asignacion.created_at ? new Date(asignacion.created_at).toLocaleDateString() : 'N/A'}
                                          </span>
                                        </div>
                                      </TableCell>
                                      <TableCell className="py-1.5">
                                        <div className="flex items-center justify-center">
                                          {onDelete && (
                                            <AlertDialog>
                                              <AlertDialogTrigger asChild>
                                                <Button
                                                  variant="ghost"
                                                  size="sm"
                                                  className="h-6 w-6 p-0 text-red-600 hover:text-red-700 hover:bg-red-100"
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
                                        </div>
                                      </TableCell>
                                    </TableRow>
                                  ))}
                                </React.Fragment>
                              );
                            })}
                          </React.Fragment>
                        );
                      })}
                    </React.Fragment>
                  );
                })
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
