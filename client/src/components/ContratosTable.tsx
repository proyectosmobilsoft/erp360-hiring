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
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  // Estados para filtros y paginación
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [expandedRow, setExpandedRow] = useState<number | null>(null);

  // Estado para las zonas cargadas
  const [zonasContrato, setZonasContrato] = useState<{[key: number]: any[]}>({});

  // Estado para información de dependencias asociadas al eliminar
  const [zonasAsociadas, setZonasAsociadas] = useState<{ 
    tieneZonas: boolean; 
    count: number; 
    detalles: { zonas: number; minutas: number; productos: number } 
  }>({ 
    tieneZonas: false, 
    count: 0, 
    detalles: { zonas: 0, minutas: 0, productos: 0 } 
  });
  
  // Estado para controlar el modal de eliminación
  const [modalEliminarAbierto, setModalEliminarAbierto] = useState(false);
  
  // Estado para el contrato que se va a eliminar
  const [contratoParaEliminar, setContratoParaEliminar] = useState<ContratoView | null>(null);


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
    console.log('🚀 INICIANDO eliminación del contrato:', contrato.id, contrato['No Contrato']);
    showLoading('Eliminando contrato...');
    try {
      // Siempre usar eliminación con dependencias para evitar errores de foreign key
      console.log('📞 Llamando a eliminarContratoConZonas...');
      const response = await ContratosService.eliminarContratoConZonas(contrato.id);
      
      if (response.error) {
        console.error('Error eliminando contrato:', response.error);
        toast({
          title: "Error al eliminar",
          description: `No se pudo eliminar el contrato ${contrato['No Contrato']}: ${response.error.message}`,
          variant: "destructive",
        });
        return;
      }
      
      const mensaje = zonasAsociadas.tieneZonas 
        ? `El contrato ${contrato['No Contrato']} y sus ${zonasAsociadas.count} dependencia${zonasAsociadas.count > 1 ? 's' : ''} asociada${zonasAsociadas.count > 1 ? 's' : ''} han sido eliminados permanentemente`
        : `El contrato ${contrato['No Contrato']} ha sido eliminado permanentemente`;
      
      toast({
        title: "Contrato eliminado",
        description: mensaje,
      });
      
      // Limpiar estados
      setContratoParaEliminar(null);
      setZonasAsociadas({ 
        tieneZonas: false, 
        count: 0, 
        detalles: { zonas: 0, minutas: 0, productos: 0 } 
      });
      setModalEliminarAbierto(false);
      
      // Refrescar solo la tabla
      cargarContratos();
    } catch (error) {
      console.error('Error inesperado eliminando contrato:', error);
      toast({
        title: "Error inesperado",
        description: "Ocurrió un error al eliminar el contrato",
        variant: "destructive",
      });
    } finally {
      hideLoading();
    }
  };

  // Función para verificar dependencias antes de mostrar el modal de confirmación
  const handleEliminarClick = async (contrato: ContratoView) => {
    const { tieneZonas, count, detalles } = await ContratosService.verificarZonasAsociadas(contrato.id);
    setZonasAsociadas({ tieneZonas, count, detalles });
    setContratoParaEliminar(contrato);
    setModalEliminarAbierto(true);
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

  // Función para formatear fecha sin conversión de zona horaria
  const formatDate = (dateString: string) => {
    if (!dateString) return '-';
    try {
      // Separar la fecha en partes para evitar problemas de zona horaria
      const [year, month, day] = dateString.split('T')[0].split('-');
      return `${day}/${month}/${year}`;
    } catch {
      return dateString;
    }
  };

  // Función para actualizar datos
  const handleRefresh = async () => {
    setIsRefreshing(true);
    setError(null);
    try {
      const response = await ContratosService.getContratos();
      if (response.error) {
        toast({
          title: '❌ Error al Actualizar',
          description: 'No se pudieron actualizar los contratos. Intente nuevamente.',
          variant: 'destructive',
          className: "bg-red-50 border-red-200 text-red-800",
        });
      } else {
        const contractData = response.data || [];
        setContratos(contractData);
        setFilteredContratos(contractData);
      }
    } catch (err) {
      console.error('Error al actualizar:', err);
      toast({
        title: '❌ Error al Actualizar',
        description: 'No se pudieron actualizar los contratos. Intente nuevamente.',
        variant: 'destructive',
        className: "bg-red-50 border-red-200 text-red-800",
      });
    } finally {
      setIsRefreshing(false);
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
    <>
    <Card className="bg-white shadow-lg border-0">
      <CardHeader className="bg-gradient-to-r from-teal-50 to-cyan-50 border-b border-teal-200">
        <div className="flex items-center justify-between">
          <CardTitle className="text-xl font-bold text-teal-800 flex items-center gap-2">
            <FileText className="w-6 h-6 text-teal-600" />
            Gestión de Contratos
          </CardTitle>
          <div className="flex items-center gap-2">
            <Button
              onClick={handleRefresh}
              variant="outline"
              size="sm"
              disabled={isRefreshing}
              className="text-teal-600 hover:text-teal-700 hover:bg-teal-50"
            >
              <RefreshCw className={`w-4 h-4 mr-1 ${isRefreshing ? 'animate-spin' : ''}`} />
              Actualizar
            </Button>
            <Button
              onClick={onAdd}
              className="bg-teal-600 hover:bg-teal-700 text-white"
            >
              <Plus className="w-4 h-4 mr-1" />
              Nuevo Contrato
            </Button>
          </div>
        </div>
      </CardHeader>

      {/* Sección de Filtros */}
      <div className="p-4 bg-gray-50 border-b border-gray-200">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              type="text"
              placeholder="Buscar por contrato, entidad, NIT o sede..."
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
              <SelectItem value="ABIERTO">Abierto</SelectItem>
              <SelectItem value="EN PRODUCCION">En Producción</SelectItem>
              <SelectItem value="FINALIZADO">Finalizado</SelectItem>
              <SelectItem value="INACTIVO">Inactivo</SelectItem>
            </SelectContent>
          </Select>
        </div>
        </div>
      </div>

      <CardContent className="p-6">
        <div className="rounded-md border overflow-hidden">
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
              {isRefreshing ? (
                <TableRow>
                  <TableCell colSpan={7} className="h-24 text-center">
                    <div className="flex items-center justify-center">
                      <Loader2 className="h-6 w-6 animate-spin mr-2 text-teal-600" />
                      <span className="text-gray-600">Actualizando contratos...</span>
                    </div>
                  </TableCell>
                </TableRow>
              ) : currentContratos.length === 0 ? (
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
                          className="bg-teal-600 hover:bg-teal-700 text-white mt-2"
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
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        aria-label="Eliminar contrato"
                                        className="h-6 w-6 p-0 text-red-600 hover:text-red-700 hover:bg-red-100 transition-all duration-200"
                                    onClick={() => handleEliminarClick(contrato)}
                                      >
                                        <Trash2 className="w-3 h-3" />
                                      </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>Eliminar</p>
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
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
      </CardContent>
    </Card>

      {/* Modal de confirmación de eliminación */}
      <AlertDialog open={modalEliminarAbierto} onOpenChange={setModalEliminarAbierto}>
        <AlertDialogContent className="max-w-2xl">
          <AlertDialogHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-100 rounded-full">
                <Trash2 className="w-6 h-6 text-red-600" />
        </div>
              <AlertDialogTitle className="text-xl">Eliminar Contrato</AlertDialogTitle>
                </div>
            
            <AlertDialogDescription className="space-y-4">
              <div className="bg-gray-50 p-4 rounded-lg border">
                <p className="text-base font-medium text-gray-900 mb-2">
                  ¿Está seguro que desea eliminar permanentemente el contrato?
                </p>
                <div className="bg-white p-3 rounded border-l-4 border-red-500">
                  <p className="font-semibold text-gray-900">
                    {contratoParaEliminar?.['No Contrato']}
                  </p>
                  <p className="text-sm text-gray-700 mt-1 font-medium">
                    {contratoParaEliminar?.['Objeto']}
                  </p>
                  <p className="text-sm text-gray-600 mt-1">
                    {contratoParaEliminar?.['Empresa']} - {contratoParaEliminar?.['Sucursal']}
                  </p>
                </div>
                </div>

              {zonasAsociadas.tieneZonas && (
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <div className="p-1 bg-amber-100 rounded-full">
                      <AlertCircle className="w-5 h-5 text-amber-600" />
              </div>
                    <div className="flex-1">
                      <h4 className="font-semibold text-amber-800 mb-2">
                        ⚠️ Advertencia: Dependencias Asociadas
                      </h4>
                      <p className="text-amber-700 mb-3">
                        Este contrato tiene <strong>{zonasAsociadas.count} dependencia{zonasAsociadas.count > 1 ? 's' : ''}</strong> asociada{zonasAsociadas.count > 1 ? 's' : ''} que también será{zonasAsociadas.count > 1 ? 'án' : ''} eliminada{zonasAsociadas.count > 1 ? 's' : ''}:
                      </p>
                      
                      <div className="space-y-2">
                        {zonasAsociadas.detalles.zonas > 0 && (
                          <div className="flex items-center gap-2 text-sm">
                            <div className="w-2 h-2 bg-amber-500 rounded-full"></div>
                            <span className="font-medium text-amber-800">
                              {zonasAsociadas.detalles.zonas} Zona{zonasAsociadas.detalles.zonas > 1 ? 's' : ''} de servicio
                      </span>
                    </div>
                        )}
                        {zonasAsociadas.detalles.minutas > 0 && (
                          <div className="flex items-center gap-2 text-sm">
                            <div className="w-2 h-2 bg-amber-500 rounded-full"></div>
                            <span className="font-medium text-amber-800">
                              {zonasAsociadas.detalles.minutas} Minuta{zonasAsociadas.detalles.minutas > 1 ? 's' : ''} de contratación
                      </span>
                    </div>
                        )}
                        {zonasAsociadas.detalles.productos > 0 && (
                          <div className="flex items-center gap-2 text-sm">
                            <div className="w-2 h-2 bg-amber-500 rounded-full"></div>
                            <span className="font-medium text-amber-800">
                              {zonasAsociadas.detalles.productos} Asignación{zonasAsociadas.detalles.productos > 1 ? 'es' : ''} de producto{zonasAsociadas.detalles.productos > 1 ? 's' : ''}
                      </span>
                    </div>
                        )}
        </div>

                      <div className="mt-3 p-2 bg-amber-100 rounded text-xs text-amber-800">
                        <strong>Importante:</strong> La eliminación de estas dependencias puede afectar otros procesos del sistema.
                </div>
                </div>
              </div>
                </div>
              )}

              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <div className="p-1 bg-red-100 rounded-full">
                    <XCircle className="w-5 h-5 text-red-600" />
                  </div>
                <div>
                    <h4 className="font-semibold text-red-800 mb-1">
                      Acción Irreversible
                    </h4>
                    <p className="text-red-700 text-sm">
                      Esta acción no se puede deshacer. Todos los datos relacionados serán eliminados permanentemente.
                    </p>
                </div>
                </div>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          
          <AlertDialogFooter className="gap-3">
            <AlertDialogCancel 
              onClick={() => setModalEliminarAbierto(false)}
              className="flex-1"
            >
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => contratoParaEliminar && handleEliminarInterno(contratoParaEliminar)}
              className="flex-1 bg-red-600 hover:bg-red-700 focus:ring-red-600"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Eliminar Permanentemente
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default ContratosTable;
