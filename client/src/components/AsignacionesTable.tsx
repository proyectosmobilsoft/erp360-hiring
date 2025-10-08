import React, { useState, useEffect } from 'react';
import { 
  Search, 
  Filter, 
  Eye, 
  Edit, 
  Trash2, 
  Plus, 
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
import { useToast } from '../hooks/use-toast';
import { useGlobalLoading } from '../contexts/GlobalLoadingContext';
import { supabase } from '../services/supabaseClient';

interface AsignacionData {
  id: number;
  id_producto_by_unidad: number;
  id_contrato: number;
  id_unidad_servicio: number;
  estado: number;
  // Campos relacionados con nombres
  nombre_receta?: string;
  codigo_receta?: string;
  nombre_contrato?: string;
  numero_contrato?: string;
  nombre_unidad_servicio?: string;
  zona_nombre?: string;
  created_at?: string;
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
  const { toast } = useToast();
  const { showLoading, hideLoading } = useGlobalLoading();
  
  const [asignaciones, setAsignaciones] = useState<AsignacionData[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const itemsPerPage = 10;

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
              nombre
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
        toast({
          title: "Error",
          description: "No se pudieron cargar las asignaciones",
          variant: "destructive",
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
      const asignacionesTransformadas: AsignacionData[] = (data || []).map(item => {
        const unidadInfo = unidadesMap.get(item.id_unidad_servicio);
        
        return {
          id: item.id,
          id_producto_by_unidad: item.id_producto_by_unidad,
          id_contrato: item.id_contrato,
          id_unidad_servicio: item.id_unidad_servicio,
          estado: item.estado,
          nombre_receta: item.inv_producto_by_unidades?.inv_productos?.nombre || 'Sin nombre',
          codigo_receta: '',
          nombre_contrato: item.prod_contratos?.con_terceros?.nombre_tercero || 'Sin entidad',
          numero_contrato: item.prod_contratos?.con_terceros?.documento || 'Sin NIT',
          nombre_unidad_servicio: unidadInfo?.nombre_servicio || 'Sin unidad',
          zona_nombre: unidadInfo?.prod_zonas?.nombre || 'Sin zona',
          created_at: item.created_at
        };
      });

      setAsignaciones(asignacionesTransformadas);
      setTotalItems(count || 0);
      setTotalPages(Math.ceil((count || 0) / itemsPerPage));
      
    } catch (error) {
      console.error('Error inesperado:', error);
      toast({
        title: "Error",
        description: "Error inesperado al cargar las asignaciones",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarAsignaciones(currentPage);
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
                <TableHead className="font-semibold text-gray-700">Entidad / NIT</TableHead>
                <TableHead className="font-semibold text-gray-700">Zona</TableHead>
                <TableHead className="font-semibold text-gray-700">Unidad de Servicio</TableHead>
                <TableHead className="font-semibold text-gray-700">Receta</TableHead>
                <TableHead className="font-semibold text-gray-700">Asignado</TableHead>
                <TableHead className="font-semibold text-gray-700 text-center">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8">
                    <div className="flex items-center justify-center gap-2">
                      <Loader2 className="w-5 h-5 animate-spin text-teal-600" />
                      <span className="text-gray-600">Cargando asignaciones...</span>
                    </div>
                  </TableCell>
                </TableRow>
              ) : asignacionesFiltradas.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8">
                    <div className="flex flex-col items-center gap-2">
                      <Package className="w-12 h-12 text-gray-400" />
                      <span className="text-gray-600">No se encontraron asignaciones</span>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                asignacionesFiltradas.map((asignacion) => (
                  <TableRow key={asignacion.id} className="hover:bg-gray-50">
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4 text-blue-600" />
                        <div>
                          <div className="font-medium text-sm">{asignacion.nombre_contrato}</div>
                          <div className="text-xs text-gray-500">NIT: {asignacion.numero_contrato}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-orange-600" />
                        {asignacion.zona_nombre}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Building className="w-4 h-4 text-purple-600" />
                        {asignacion.nombre_unidad_servicio}
                      </div>
                    </TableCell>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        <UtensilsCrossed className="w-4 h-4 text-teal-600" />
                        {asignacion.nombre_receta}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-gray-500" />
                        <span className="text-sm">
                          {asignacion.created_at ? new Date(asignacion.created_at).toLocaleDateString() : 'N/A'}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center justify-center">
                        {onDelete && (
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                              >
                                <Trash2 className="w-4 h-4" />
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
                ))
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
