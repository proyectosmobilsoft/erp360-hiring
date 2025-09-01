
import React, { useState, useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { DynamicSidebar } from './DynamicSidebar';
import { Button } from '@/components/ui/button';
import { Menu, X, Shield, Users, Key, Lock, Activity, Building, Package, BookOpen, Calculator, TrendingUp, FileText, UserCheck } from 'lucide-react';
import './Layout.css';

const Layout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();

  // Cerrar sidebar en dispositivos móviles al cambiar de ruta
  useEffect(() => {
    setSidebarOpen(false);
  }, [location.pathname]);

  // Función para obtener el título del módulo basado en la ruta
  const getModuleTitle = (pathname: string) => {
    if (pathname === '/') return { title: 'Dashboard del Sistema', icon: <Activity /> };
    if (pathname.startsWith('/seguridad')) return { title: 'Módulo de Seguridad', icon: <Shield /> };
    if (pathname.startsWith('/admin')) return { title: 'Módulo de Administración', icon: <Building /> };
    if (pathname.startsWith('/compras')) return { title: 'Módulo de Compras', icon: <Package /> };
    if (pathname.startsWith('/inventario')) return { title: 'Módulo de Inventario', icon: <Package /> };
    if (pathname.startsWith('/maestros')) return { title: 'Módulo de Maestros', icon: <BookOpen /> };
    if (pathname.startsWith('/presupuesto')) return { title: 'Módulo de Presupuesto', icon: <Calculator /> };
    if (pathname.startsWith('/ventas')) return { title: 'Módulo de Ventas', icon: <TrendingUp /> };
    if (pathname.startsWith('/contabilidad')) return { title: 'Módulo de Contabilidad', icon: <FileText /> };
    if (pathname.startsWith('/recursos-humanos')) return { title: 'Módulo de Recursos Humanos', icon: <UserCheck /> };

    // Para rutas específicas de seguridad
    if (pathname.includes('/usuarios')) return { title: 'Gestión de Usuarios', icon: <Users /> };
    if (pathname.includes('/perfiles')) return { title: 'Gestión de Perfiles', icon: <Key /> };
    if (pathname.includes('/permisos')) return { title: 'Gestión de Permisos', icon: <Lock /> };

    return { title: 'Sistema de Gestión', icon: <Building /> };
  };

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const handleNavigate = (path: string) => {
    setSidebarOpen(false);
  };

  return (
    <div className="layout">


      {/* Contenido principal */}
      <div className="layout-main">
        {/* Sidebar */}
        <aside className={`layout-sidebar ${sidebarOpen ? 'sidebar-open' : ''}`}>
          <DynamicSidebar onNavigate={handleNavigate} />
        </aside>

        {/* Contenido principal */}
        <main className="layout-content">
          {/* Botón de toggle para móviles */}
          <div className="lg:hidden mb-4">
            <Button
              variant="outline"
              size="sm"
              onClick={toggleSidebar}
              className="mb-4"
            >
              {sidebarOpen ? <X className="h-4 w-4 mr-2" /> : <Menu className="h-4 w-4 mr-2" />}
              {sidebarOpen ? 'Cerrar Menú' : 'Abrir Menú'}
            </Button>
          </div>

          {/* Header del módulo */}
          <div className="module-header">
            <h1 className="module-title font-extrabold text-cyan-800">
              <span className="module-icon"><FileText /></span>
              Módulo Contratación
            </h1>
          </div>

          <Outlet />
        </main>
      </div>

      {/* Overlay para móviles */}
      {sidebarOpen && (
        <div
          className="sidebar-overlay lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  );
};

export default Layout;
