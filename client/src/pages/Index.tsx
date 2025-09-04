
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { useQuery } from '@tanstack/react-query';
import { ContratosService } from '@/services/contratosService';
import { Activity, BarChart3, FileText, DollarSign, Target, Building, CheckCircle, Users, TrendingUp } from 'lucide-react';

interface DashboardStats {
  // Estadísticas de contratos
  totalContratos: number;
  contratosAbiertos: number;
  contratosEnProduccion: number;
  contratosFinalizados: number;
  contratosInactivos: number;
  valorTotalContratos: number;
  valorPromedioContratos: number;
  totalPPL: number;
  totalServicios: number;
  totalRaciones: number;
  porcentajeContratosActivos: number;
}

const COLORS = ['#0891b2', '#0d9488', '#059669', '#7c3aed', '#dc2626'];

// Función para formatear moneda
const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

const Index = () => {
  const { data: stats, isLoading, error } = useQuery<DashboardStats>({
    queryKey: ['dashboard-stats'],
    queryFn: async () => {
      try {
        // Obtener estadísticas de contratos
        const response = await ContratosService.getContratos();
        const contratos = response.data || [];

        // Calcular estadísticas de contratos
        const totalContratos = contratos.length;
        const contratosAbiertos = contratos.filter(c => c.Estado === 'ABIERTO').length;
        const contratosEnProduccion = contratos.filter(c => c.Estado === 'EN PRODUCCION').length;
        const contratosFinalizados = contratos.filter(c => c.Estado === 'FINALIZADO').length;
        const contratosInactivos = contratos.filter(c => c.Estado === 'INACTIVO').length;
        
        const valorTotalContratos = contratos.reduce((sum, c) => sum + (c['Total:$:colspan:[Valores]'] || 0), 0);
        const valorPromedioContratos = totalContratos > 0 ? valorTotalContratos / totalContratos : 0;
        const totalPPL = contratos.reduce((sum, c) => sum + (c['PPL:colspan:[Cantidades x Dia]'] || 0), 0);
        const totalServicios = contratos.reduce((sum, c) => sum + (c['Servicios:colspan:[Cantidades x Dia]'] || 0), 0);
        const totalRaciones = contratos.reduce((sum, c) => sum + (c['Raciones:colspan:[Cantidades x Dia]'] || 0), 0);
        
        const contratosActivos = contratosAbiertos + contratosEnProduccion;
        const porcentajeContratosActivos = totalContratos > 0 ? (contratosActivos / totalContratos) * 100 : 0;

        return {
          // Estadísticas de contratos
          totalContratos,
          contratosAbiertos,
          contratosEnProduccion,
          contratosFinalizados,
          contratosInactivos,
          valorTotalContratos,
          valorPromedioContratos,
          totalPPL,
          totalServicios,
          totalRaciones,
          porcentajeContratosActivos
        };
      } catch (error) {
        console.error('Error fetching dashboard stats:', error);
        throw error;
      }
    },
    staleTime: 1000 * 60 * 5, // 5 minutos
  });

  if (isLoading) {
    return (
      <div className="p-4 max-w-full mx-auto">
        <div className="flex items-center justify-center h-64">
          <div className="flex flex-col items-center gap-2">
            <Activity className="animate-spin h-10 w-10 text-cyan-600" />
            <span className="text-cyan-700 font-semibold">Cargando dashboard...</span>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 max-w-full mx-auto">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">Error al cargar las estadísticas del dashboard</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 max-w-full mx-auto">
      {/* Header del Dashboard */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-extrabold text-cyan-800 flex items-center gap-2 mb-2">
          <Activity className="w-8 h-8 text-cyan-600" />
          Dashboard del Sistema
        </h1>
      </div>


      {/* Estadísticas de Contratos */}
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
                    <p className="text-3xl font-bold text-cyan-600">{stats?.totalContratos || 0}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      {stats?.porcentajeContratosActivos.toFixed(1) || 0}% activos
                    </p>
                  </div>
                  <div className="relative">
                    <FileText className="w-10 h-10 text-cyan-500" />
                    <div className="absolute -top-1 -right-1 w-4 h-4 bg-cyan-100 rounded-full flex items-center justify-center">
                      <span className="text-xs font-bold text-cyan-600">{stats?.totalContratos || 0}</span>
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
                        <span className="text-sm font-bold text-green-600">{stats?.contratosEnProduccion || 0}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-xs text-blue-700">Abiertos</span>
                        <span className="text-sm font-bold text-blue-600">{stats?.contratosAbiertos || 0}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-xs text-gray-700">Finalizados</span>
                        <span className="text-sm font-bold text-gray-600">{stats?.contratosFinalizados || 0}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-xs text-red-700">Inactivos</span>
                        <span className="text-sm font-bold text-red-600">{stats?.contratosInactivos || 0}</span>
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
                      {formatCurrency(stats?.valorTotalContratos || 0)}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      Promedio: {formatCurrency(stats?.valorPromedioContratos || 0)}
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
                          {(stats?.totalPPL || 0).toLocaleString()}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-xs text-orange-700 flex items-center gap-1">
                          <Target className="w-3 h-3" />
                          Servicios
                        </span>
                        <span className="text-sm font-bold text-orange-600">
                          {(stats?.totalServicios || 0).toLocaleString()}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-xs text-orange-700 flex items-center gap-1">
                          <Building className="w-3 h-3" />
                          Raciones
                        </span>
                        <span className="text-sm font-bold text-orange-600">
                          {(stats?.totalRaciones || 0).toLocaleString()}
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
                      {(stats?.contratosAbiertos || 0) + (stats?.contratosEnProduccion || 0)}
                    </p>
                    <p className="text-xs text-green-600">
                      {stats?.porcentajeContratosActivos.toFixed(1) || 0}% del total
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
                      {(stats?.totalPPL || 0) > 0 ? formatCurrency((stats?.valorTotalContratos || 0) / (stats?.totalPPL || 1)) : formatCurrency(0)}
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
                      {(stats?.totalServicios || 0) > 0 ? ((stats?.totalRaciones || 0) / (stats?.totalServicios || 1)).toFixed(1) : '0.0'}
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
  );
};

export default Index;
