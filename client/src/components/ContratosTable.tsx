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
  DollarSign,
  Users,
  AlertCircle,
  Loader2,
  MapPin,
  Building2,
  Power,
  PowerOff,
  TrendingUp,
  Clock,
  CheckCircle,
  XCircle,
  BarChart3,
  Target
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
import { ContratosService, ContratoView } from '../services/contratosService';

interface ContratosTableProps {
  onEdit: (contrato: ContratoView) => void;
  onView: (contrato: ContratoView) => void;
  onDelete: (contrato: ContratoView) => void;
  onActivate?: (contrato: ContratoView) => void;
  onInactivate?: (contrato: ContratoView) => void;
  onAdd: () => void;
}

const ContratosTable: React.FC<ContratosTableProps> = ({
  onEdit,
  onView,
  onDelete,
  onActivate,
  onInactivate,
  onAdd
}) => {
  const { toast } = useToast();
  const { showLoading, hideLoading } = useGlobalLoading();
  const [contratos, setContratos] = useState<ContratoView[]>([]);
  const [filteredContratos, setFilteredContratos] = useState<ContratoView[]>([]);

  const [error, setError] = useState<string | null>(null);
  
  // Estados para filtros y paginación
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [expandedRow, setExpandedRow] = useState<number | null>(null);

  // Estado para las zonas cargadas
  const [zonasContrato, setZonasContrato] = useState<{[key: number]: any[]}>({});

  // Estado para estadísticas calculadas
  const [estadisticas, setEstadisticas] = useState({
    total: 0,
    abiertos: 0,
    enProduccion: 0,
    finalizados: 0,
    inactivos: 0,
    valorTotal: 0,
    valorPromedio: 0,
    totalPPL: 0,
    totalServicios: 0,
    totalRaciones: 0,
    porcentajeActivos: 0
  });

  // Función para calcular estadísticas
  const calcularEstadisticas = (contratos: ContratoView[]) => {
    const total = contratos.length;
    const abiertos = contratos.filter(c => c.Estado === 'ABIERTO').length;
    const enProduccion = contratos.filter(c => c.Estado === 'EN PRODUCCION').length;
    const finalizados = contratos.filter(c => c.Estado === 'FINALIZADO').length;
    const inactivos = contratos.filter(c => c.Estado === 'INACTIVO').length;
    
    const valorTotal = contratos.reduce((sum, c) => sum + (c['Total:$:colspan:[Valores]'] || 0), 0);
    const valorPromedio = total > 0 ? valorTotal / total : 0;
    const totalPPL = contratos.reduce((sum, c) => sum + (c['PPL:colspan:[Cantidades x Dia]'] || 0), 0);
    const totalServicios = contratos.reduce((sum, c) => sum + (c['Servicios:colspan:[Cantidades x Dia]'] || 0), 0);
    const totalRaciones = contratos.reduce((sum, c) => sum + (c['Raciones:colspan:[Cantidades x Dia]'] || 0), 0);
    
    const contratosActivos = abiertos + enProduccion;
    const porcentajeActivos = total > 0 ? (contratosActivos / total) * 100 : 0;

    setEstadisticas({
      total,
      abiertos,
      enProduccion,
      finalizados,
      inactivos,
      valorTotal,
      valorPromedio,
      totalPPL,
      totalServicios,
      totalRaciones,
      porcentajeActivos
    });
  };

  // Función para expandir/contraer filas
  const toggleRowExpansion = async (contratoId: number) => {
    if (expandedRow === contratoId) {
      setExpandedRow(null);
    } else {
      setExpandedRow(contratoId);
      
      // Cargar zonas si no están cargadas
      if (!zonasContrato[contratoId]) {
        try {
          const response = await ContratosService.getZonasContrato(contratoId);
          if (!response.error) {
            setZonasContrato(prev => ({
              ...prev,
              [contratoId]: response.data
            }));
          }
        } catch (error) {
          console.error('Error cargando zonas:', error);
        }
      }
    }
  };

  // Funciones internas para manejar acciones con toast y refrescar tabla
  const handleActivarInterno = async (contrato: ContratoView) => {
    showLoading('Activando contrato...');
    try {
      const response = await ContratosService.activarContrato(contrato.id);
      
      if (response.error) {
        toast({
          title: "Error al activar",
          description: `No se pudo activar el contrato ${contrato['No Contrato']}`,
          variant: "destructive",
        });
        return;
      }
      
      toast({
        title: "Contrato activado",
        description: `El contrato ${contrato['No Contrato']} ha sido activado exitosamente`,
      });
      
      // Refrescar solo la tabla
      cargarContratos();
    } catch (error) {
      toast({
        title: "Error inesperado",
        description: "Ocurrió un error al activar el contrato",
        variant: "destructive",
      });
    } finally {
      hideLoading();
    }
  };

  const handleInactivarInterno = async (contrato: ContratoView) => {
    showLoading('Inactivando contrato...');
    try {
      const response = await ContratosService.inactivarContrato(contrato.id);
      
      if (response.error) {
        toast({
          title: "Error al inactivar",
          description: `No se pudo inactivar el contrato ${contrato['No Contrato']}`,
          variant: "destructive",
        });
        return;
      }
      
      toast({
        title: "Contrato inactivado",
        description: `El contrato ${contrato['No Contrato']} ha sido inactivado exitosamente`,
        variant: "default",
      });
      
      // Refrescar solo la tabla
      cargarContratos();
    } catch (error) {
      toast({
        title: "Error inesperado",
        description: "Ocurrió un error al inactivar el contrato",
        variant: "destructive",
      });
    } finally {
      hideLoading();
    }
  };

  const handleEliminarInterno = async (contrato: ContratoView) => {
    showLoading('Eliminando contrato...');
    try {
      const response = await ContratosService.eliminarContrato(contrato.id);
      
      if (response.error) {
        toast({
          title: "Error al eliminar",
          description: `No se pudo eliminar el contrato ${contrato['No Contrato']}`,
          variant: "destructive",
        });
        return;
      }
      
      toast({
        title: "Contrato eliminado",
        description: `El contrato ${contrato['No Contrato']} ha sido eliminado permanentemente`,
      });
      
      // Refrescar solo la tabla
      cargarContratos();
    } catch (error) {
      toast({
        title: "Error inesperado",
        description: "Ocurrió un error al eliminar el contrato",
        variant: "destructive",
      });
    } finally {
      hideLoading();
    }
  };

  // Cargar contratos
  const cargarContratos = async () => {
    setError(null);
    showLoading('Cargando contratos...');
    try {
      const response = await ContratosService.getContratos();
      if (response.error) {
        setError('Error al cargar los contratos');
        console.error('Error:', response.error);
      } else {
        const contractData = response.data || [];
        setContratos(contractData);
        setFilteredContratos(contractData);
        calcularEstadisticas(contractData);
      }
    } catch (err) {
      setError('Error inesperado al cargar los contratos');
      console.error('Error:', err);
    } finally {
      hideLoading();
    }
  };

  // Efecto para cargar datos iniciales
  useEffect(() => {
    cargarContratos();
  }, []);

  // Efecto para filtrar contratos
  useEffect(() => {
    let filtered = contratos;

    // Filtro por término de búsqueda
    if (searchTerm) {
      filtered = filtered.filter(contrato =>
        contrato['No Contrato']?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        contrato['Entidad / Contratante:FLT']?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        contrato['NIT']?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        contrato['Sede:width[300]']?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filtro por estado
    if (statusFilter !== 'all') {
      filtered = filtered.filter(contrato => contrato.Estado === statusFilter);
    }

    setFilteredContratos(filtered);
    setCurrentPage(1); // Reset a la primera página cuando se filtra
  }, [searchTerm, statusFilter, contratos]);

  // Calcular paginación
  const totalPages = Math.ceil(filteredContratos.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentContratos = filteredContratos.slice(startIndex, endIndex);

  // Función para obtener el color del badge según el estado
  const getStatusColor = (estado: string) => {
    switch (estado) {
      case 'ABIERTO':
        return 'bg-blue-100 text-blue-800';
      case 'EN PRODUCCION':
        return 'bg-green-100 text-green-800';
      case 'FINALIZADO':
        return 'bg-gray-100 text-gray-800';
      case 'INACTIVO':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Función para formatear moneda
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };

  // Función para formatear fecha
  const formatDate = (dateString: string) => {
    if (!dateString) return '-';
    try {
      return new Date(dateString).toLocaleDateString('es-CO');
    } catch {
      return dateString;
    }
  };



  if (error) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="flex items-center gap-3 text-red-600">
          <AlertCircle className="w-6 h-6" />
          <span>{error}</span>
          <Button 
            onClick={cargarContratos} 
            variant="outline" 
            size="sm"
            className="ml-3"
          >
            <RefreshCw className="w-4 h-4 mr-1" />
            Reintentar
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Barra de herramientas */}
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between bg-white p-4 rounded-lg shadow-sm border">
        <div className="flex flex-1 gap-4 items-center w-full sm:w-auto">
          {/* Búsqueda */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              type="text"
              placeholder="Buscar por contrato, entidad, NIT o sede..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Filtro por estado */}
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-48">
              <Filter className="w-4 h-4 mr-2" />
              <SelectValue placeholder="Filtrar por estado" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los estados</SelectItem>
              <SelectItem value="ABIERTO">Abierto</SelectItem>
              <SelectItem value="EN PRODUCCION">En Producción</SelectItem>
              <SelectItem value="FINALIZADO">Finalizado</SelectItem>
              <SelectItem value="INACTIVO">Inactivo</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex gap-2">
          <Button
            onClick={cargarContratos}
            variant="outline"
            size="sm"
          >
            <RefreshCw className="w-4 h-4 mr-1" />
            Actualizar
          </Button>
          <Button
            onClick={onAdd}
            className="bg-cyan-600 hover:bg-cyan-700 text-white"
          >
            <Plus className="w-4 h-4 mr-1" />
            Nuevo Contrato
          </Button>
        </div>
      </div>

      {/* Tabla con estilo de usuarios */}
      <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
        <div className="relative overflow-x-auto rounded-lg shadow-sm">
          <Table className="min-w-[900px] w-full text-xs">
            <TableHeader className="bg-cyan-50">
              <TableRow className="text-left font-semibold text-gray-700">
                <TableHead className="px-2 py-1 text-teal-600">Acciones</TableHead>
                <TableHead className="px-4 py-3">Contrato</TableHead>
                <TableHead className="px-4 py-3">Entidad/Contratante</TableHead>
                <TableHead className="px-4 py-3">Fechas</TableHead>
                <TableHead className="px-4 py-3">PPL/Servicios</TableHead>
                <TableHead className="px-4 py-3">Valor Total</TableHead>
                <TableHead className="px-4 py-3">Estado</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {currentContratos.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="h-24 text-center">
                    <div className="flex flex-col items-center gap-2">
                      <FileText className="w-12 h-12 text-gray-300" />
                      <p className="text-gray-500">
                        {searchTerm || statusFilter !== 'all' 
                          ? 'No se encontraron contratos con los filtros aplicados'
                          : 'No hay contratos registrados'
                        }
                      </p>
                      {!searchTerm && statusFilter === 'all' && (
                        <Button
                          onClick={onAdd}
                          className="bg-cyan-600 hover:bg-cyan-700 text-white mt-2"
                        >
                          <Plus className="w-4 h-4 mr-1" />
                          Crear primer contrato
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                currentContratos.map((contrato, index) => (
                  <React.Fragment key={contrato.id}>
                    {/* Fila principal del contrato */}
                    <TableRow className="hover:bg-cyan-50/50">
                      <TableCell className="px-2 py-1">
                        <div className="flex flex-row gap-1 items-center">
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => toggleRowExpansion(contrato.id)}
                                  aria-label="Expandir/Contraer"
                                  className="h-6 w-6 p-0 text-blue-600 hover:text-blue-700 hover:bg-blue-100 rounded-full transition-all duration-300"
                                >
                                  {expandedRow === contrato.id ? (
                                    <Minus className="w-3 h-3" />
                                  ) : (
                                    <Plus className="w-3 h-3" />
                                  )}
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>{expandedRow === contrato.id ? 'Contraer' : 'Expandir'}</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                          
                          {/* Botón de Editar - Mostrar en cualquier estado excepto INACTIVO */}
                          {contrato.Estado !== 'INACTIVO' && (
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => onEdit(contrato)}
                                    aria-label="Editar contrato"
                                    className="h-6 w-6 p-0 text-cyan-600 hover:text-cyan-700 hover:bg-cyan-100 transition-all duration-200"
                                  >
                                    <Edit className="w-3 h-3" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>Editar</p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          )}

                          {/* Botón de Activar/Inactivar */}
                          {contrato.Estado === 'INACTIVO' ? (
                            <AlertDialog>
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <AlertDialogTrigger asChild>
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        aria-label="Activar contrato"
                                        className="h-6 w-6 p-0 text-green-600 hover:text-green-700 hover:bg-green-100 transition-all duration-200"
                                      >
                                        <Power className="w-3 h-3" />
                                      </Button>
                                    </AlertDialogTrigger>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>Activar</p>
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Activar Contrato</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    ¿Está seguro que desea activar el contrato <strong>{contrato['No Contrato']}</strong>?
                                    <br />Esta acción cambiará el estado del contrato a activo.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => handleActivarInterno(contrato)}
                                    className="bg-green-600 hover:bg-green-700"
                                  >
                                    Activar
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          ) : (
                            <AlertDialog>
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <AlertDialogTrigger asChild>
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        aria-label="Inactivar contrato"
                                        className="h-6 w-6 p-0 text-orange-600 hover:text-orange-700 hover:bg-orange-100 transition-all duration-200"
                                      >
                                        <PowerOff className="w-3 h-3" />
                                      </Button>
                                    </AlertDialogTrigger>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>Inactivar</p>
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Inactivar Contrato</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    ¿Está seguro que desea inactivar el contrato <strong>{contrato['No Contrato']}</strong>?
                                    <br />Esta acción cambiará el estado del contrato a inactivo.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => handleInactivarInterno(contrato)}
                                    className="bg-orange-600 hover:bg-orange-700"
                                  >
                                    Inactivar
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          )}

                          {/* Botón de Eliminar - Solo si está inactivo */}
                          {contrato.Estado === 'INACTIVO' && (
                            <AlertDialog>
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <AlertDialogTrigger asChild>
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        aria-label="Eliminar contrato"
                                        className="h-6 w-6 p-0 text-red-600 hover:text-red-700 hover:bg-red-100 transition-all duration-200"
                                      >
                                        <Trash2 className="w-3 h-3" />
                                      </Button>
                                    </AlertDialogTrigger>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>Eliminar</p>
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Eliminar Contrato</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    ¿Está seguro que desea eliminar permanentemente el contrato <strong>{contrato['No Contrato']}</strong>?
                                    <br />Esta acción no se puede deshacer.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => handleEliminarInterno(contrato)}
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
                      <TableCell className="px-4 py-3">
                        <div className="text-sm font-semibold text-cyan-600">
                          {contrato['No Contrato'] || '-'}
                        </div>
                        <div className="text-xs text-gray-600 mt-1">
                          {contrato['Sede:width[300]'] || '-'}
                        </div>
                      </TableCell>
                      <TableCell className="px-4 py-3">
                        <div className="text-sm text-gray-900 truncate max-w-48">
                          {contrato['Entidad / Contratante:FLT'] || '-'}
                        </div>
                        <div className="text-xs text-gray-600 mt-1">
                          NIT: {contrato.NIT || '-'}
                        </div>
                      </TableCell>
                      <TableCell className="px-4 py-3">
                        <div className="text-xs text-gray-600">
                          <div>Inicial: {formatDate(contrato['Inicial:DT:colspan:[Fechas del Contrato]:width[110]'])}</div>
                          <div>Final: {formatDate(contrato['Final:DT:colspan:[Fechas del Contrato]'])}</div>
                        </div>
                      </TableCell>
                      <TableCell className="px-4 py-3">
                        <div className="text-xs text-gray-600">
                          <div>PPL: {contrato['PPL:colspan:[Cantidades x Dia]'] || 0}</div>
                          <div>Servicios: {contrato['Servicios:colspan:[Cantidades x Dia]'] || 0}</div>
                        </div>
                      </TableCell>
                      <TableCell className="px-4 py-3">
                        <div className="text-sm font-semibold text-green-600">
                          {formatCurrency(contrato['Total:$:colspan:[Valores]'] || 0)}
                        </div>
                      </TableCell>
                      <TableCell className="px-4 py-3">
                        <Badge className={`text-xs ${getStatusColor(contrato.Estado)}`}>
                          {contrato.Estado}
                        </Badge>
                      </TableCell>
                    </TableRow>

                    {/* Fila expandida con detalles */}
                    {expandedRow === contrato.id && (
                      <TableRow className="bg-gradient-to-r from-gray-50 to-cyan-50">
                        <TableCell colSpan={7} className="p-0">
                          <div 
                            className="overflow-hidden transition-all duration-500 ease-in-out"
                            style={{
                              maxHeight: expandedRow === contrato.id ? '500px' : '0px',
                              opacity: expandedRow === contrato.id ? 1 : 0,
                              transform: expandedRow === contrato.id ? 'translateY(0)' : 'translateY(-20px)'
                            }}
                          >
                            <div className="p-3 flex justify-center">
                              <div className="w-full max-w-4xl">
                                {/* Solo Tabla de zonas */}
                                {zonasContrato[contrato.id] && zonasContrato[contrato.id].length > 0 ? (
                                  <div className="transition-all duration-500 delay-200">
                                    <h5 className="text-cyan-800 font-semibold text-sm mb-2 flex items-center gap-2">
                                      <MapPin className="w-4 h-4" />
                                      Zonas del Contrato
                                    </h5>
                                    <div className="bg-white rounded-lg border border-cyan-200 overflow-hidden shadow-sm max-w-2xl mx-auto">
                                      <table className="w-full">
                                        <thead>
                                          <tr className="bg-gradient-to-r from-cyan-50 to-blue-50">
                                            <th className="px-3 py-2 text-left text-cyan-700 font-medium text-xs">Código</th>
                                            <th className="px-3 py-2 text-left text-cyan-700 font-medium text-xs">Nombre</th>
                                            <th className="px-3 py-2 text-left text-cyan-700 font-medium text-xs">No PPL</th>
                                          </tr>
                                        </thead>
                                        <tbody>
                                          {zonasContrato[contrato.id].map((zona: any, zonaIndex: number) => (
                                            <tr key={zonaIndex} className="border-b border-cyan-200 hover:bg-cyan-50/50 transition-colors duration-200">
                                              <td className="px-3 py-2 text-gray-700 text-xs font-medium">{zona.Codigo}</td>
                                              <td className="px-3 py-2 text-gray-700 text-xs">{zona.Nombre}</td>
                                              <td className="px-3 py-2 text-gray-700 text-xs font-medium">{zona['No PPL']}</td>
                                            </tr>
                                          ))}
                                        </tbody>
                                      </table>
                                    </div>
                                  </div>
                                ) : (
                                  <div className="text-center py-8">
                                    <MapPin className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                                    <p className="text-gray-500 text-sm">
                                      {zonasContrato[contrato.id] === undefined ? 'Cargando zonas...' : 'No hay zonas asignadas a este contrato'}
                                    </p>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </React.Fragment>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* Paginación */}
        {totalPages > 1 && (
          <div className="px-4 py-3 border-t bg-gray-50 flex items-center justify-between">
            <div className="text-sm text-gray-700">
              Mostrando {startIndex + 1} a {Math.min(endIndex, filteredContratos.length)} de {filteredContratos.length} contratos
            </div>
            <div className="flex items-center gap-2">
              <Button
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                variant="outline"
                size="sm"
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <span className="text-sm text-gray-600">
                Página {currentPage} de {totalPages}
              </span>
              <Button
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                variant="outline"
                size="sm"
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Estadísticas detalladas debajo del listado */}
      <div className="mt-8">
        <div className="mb-4">
          <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-cyan-600" />
            Estadísticas Detalladas de Contratos
          </h3>
          <p className="text-sm text-gray-600">Resumen completo de todos los contratos registrados en el sistema</p>
        </div>

        {/* Estadísticas principales */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {/* Tarjeta Principal - Total Contratos */}
          <Card className="border-l-4 border-l-cyan-500 shadow-md hover:shadow-lg transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Contratos</p>
                  <p className="text-3xl font-bold text-cyan-600">{estadisticas.total}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    {estadisticas.porcentajeActivos.toFixed(1)}% activos
                  </p>
                </div>
                <div className="relative">
                  <FileText className="w-10 h-10 text-cyan-500" />
                  <div className="absolute -top-1 -right-1 w-4 h-4 bg-cyan-100 rounded-full flex items-center justify-center">
                    <span className="text-xs font-bold text-cyan-600">{estadisticas.total}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Estados de Contratos */}
          <Card className="border-l-4 border-l-green-500 shadow-md hover:shadow-lg transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="w-full">
                  <p className="text-sm font-medium text-gray-600 mb-2">Estados</p>
                  <div className="space-y-1">
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-green-700">En Producción</span>
                      <span className="text-sm font-bold text-green-600">{estadisticas.enProduccion}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-blue-700">Abiertos</span>
                      <span className="text-sm font-bold text-blue-600">{estadisticas.abiertos}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-gray-700">Finalizados</span>
                      <span className="text-sm font-bold text-gray-600">{estadisticas.finalizados}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-red-700">Inactivos</span>
                      <span className="text-sm font-bold text-red-600">{estadisticas.inactivos}</span>
                    </div>
                  </div>
                </div>
                <BarChart3 className="w-8 h-8 text-green-500" />
              </div>
            </CardContent>
          </Card>

          {/* Valores Monetarios */}
          <Card className="border-l-4 border-l-purple-500 shadow-md hover:shadow-lg transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Valor Total</p>
                  <p className="text-xl font-bold text-purple-600">
                    {formatCurrency(estadisticas.valorTotal)}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    Promedio: {formatCurrency(estadisticas.valorPromedio)}
                  </p>
                </div>
                <div className="relative">
                  <DollarSign className="w-10 h-10 text-purple-500" />
                  <TrendingUp className="w-4 h-4 text-purple-600 absolute -bottom-1 -right-1" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Capacidades y Servicios */}
          <Card className="border-l-4 border-l-orange-500 shadow-md hover:shadow-lg transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="w-full">
                  <p className="text-sm font-medium text-gray-600 mb-2">Capacidades</p>
                  <div className="space-y-1">
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-orange-700 flex items-center gap-1">
                        <Users className="w-3 h-3" />
                        Total PPL
                      </span>
                      <span className="text-sm font-bold text-orange-600">
                        {estadisticas.totalPPL.toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-orange-700 flex items-center gap-1">
                        <Target className="w-3 h-3" />
                        Servicios
                      </span>
                      <span className="text-sm font-bold text-orange-600">
                        {estadisticas.totalServicios.toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-orange-700 flex items-center gap-1">
                        <Building className="w-3 h-3" />
                        Raciones
                      </span>
                      <span className="text-sm font-bold text-orange-600">
                        {estadisticas.totalRaciones.toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sección de estadísticas adicionales */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="bg-gradient-to-r from-green-50 to-green-100 border-green-200">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-green-700">Contratos Activos</p>
                  <p className="text-2xl font-bold text-green-600">
                    {estadisticas.abiertos + estadisticas.enProduccion}
                  </p>
                  <p className="text-xs text-green-600">
                    {estadisticas.porcentajeActivos.toFixed(1)}% del total
                  </p>
                </div>
                <div className="relative">
                  <CheckCircle className="w-10 h-10 text-green-500" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-blue-50 to-blue-100 border-blue-200">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-blue-700">Valor por PPL</p>
                  <p className="text-xl font-bold text-blue-600">
                    {estadisticas.totalPPL > 0 ? formatCurrency(estadisticas.valorTotal / estadisticas.totalPPL) : formatCurrency(0)}
                  </p>
                  <p className="text-xs text-blue-600">Costo unitario promedio</p>
                </div>
                <div className="relative">
                  <Users className="w-10 h-10 text-blue-500" />
                  <DollarSign className="w-4 h-4 text-blue-600 absolute -bottom-1 -right-1" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-indigo-50 to-indigo-100 border-indigo-200">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-indigo-700">Eficiencia</p>
                  <p className="text-xl font-bold text-indigo-600">
                    {estadisticas.totalServicios > 0 ? (estadisticas.totalRaciones / estadisticas.totalServicios).toFixed(1) : '0.0'}
                  </p>
                  <p className="text-xs text-indigo-600">Raciones por servicio</p>
                </div>
                <div className="relative">
                  <Target className="w-10 h-10 text-indigo-500" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default ContratosTable;
