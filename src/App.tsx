import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';

// Páginas
import { LoginPage } from './pages/Loginpage';
import Unauthorized from './components/Unauthorized';

// Layout y Protección
import { Layout } from './components/Layout';

// Componentes de contenido
import { Dashboard } from './components/Dashboard';
import { Inventario } from './components/Inventario';
import { RegistroVentas } from './components/RegistroVentas';
import { Reportes } from './components/Reportes';

// Hooks de datos
import { useMedicamentos } from './hooks/useMedicamentos';
import { useVentas } from './hooks/useVentas';
import { useMessage } from './hooks/useMessage';

// Placeholder para Usuarios
const Usuarios = () => (
  <div className="space-y-4">
    <h1 className="text-2xl font-semibold text-neutral-100">Gestión de Usuarios</h1>
    <p className="text-neutral-400 text-sm">Módulo en desarrollo.</p>
  </div>
);

// Componente para verificar rol
const RoleGuard = ({ 
  children, 
  allowedRoles 
}: { 
  children: React.ReactNode; 
  allowedRoles: string[] 
}) => {
  const { role } = useAuth();
  
  if (role && !allowedRoles.includes(role)) {
    return <Navigate to="/unauthorized" replace />;
  }
  
  return <>{children}</>;
};

function AppRoutes() {
  console.log('[v0] AppRoutes: Renderizando...');
  const { user, loading } = useAuth();
  console.log('[v0] AppRoutes: Auth state:', { user: !!user, loading });
  const { medicamentos } = useMedicamentos();
  const { ventas } = useVentas();
  const { message, showMessage } = useMessage();

  if (loading) {
    console.log('[v0] AppRoutes: Mostrando loading...');
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-neutral-950">
        <div className="flex flex-col items-center gap-3">
          <div className="w-6 h-6 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-neutral-400 tracking-tight">Cargando sistema...</p>
        </div>
      </div>
    );
  }

  // Si no hay usuario, mostrar login
  if (!user) {
    return (
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    );
  }

  // Usuario autenticado - mostrar app con layout
  return (
    <>
      {/* Mensaje global */}
      {message && (
        <div className="fixed top-4 right-4 z-50 px-4 py-2.5 bg-neutral-800 border border-neutral-700 rounded text-sm text-neutral-200 shadow-lg">
          {message}
        </div>
      )}

      <Routes>
        <Route element={<Layout />}>
          {/* Dashboard - Solo Admin */}
          <Route
            path="/dashboard"
            element={
              <RoleGuard allowedRoles={['admin']}>
                <Dashboard medicamentos={medicamentos} ventas={ventas} />
              </RoleGuard>
            }
          />

          {/* Inventario - Admin y Empleado */}
          <Route
            path="/inventario"
            element={
              <RoleGuard allowedRoles={['admin', 'empleado']}>
                <Inventario medicamentos={medicamentos} showMessage={showMessage} />
              </RoleGuard>
            }
          />

          {/* Ventas - Admin y Empleado */}
          <Route
            path="/ventas"
            element={
              <RoleGuard allowedRoles={['admin', 'empleado']}>
                <RegistroVentas medicamentos={medicamentos} showMessage={showMessage} />
              </RoleGuard>
            }
          />

          {/* Reportes - Solo Admin */}
          <Route
            path="/reportes"
            element={
              <RoleGuard allowedRoles={['admin']}>
                <Reportes ventas={ventas} />
              </RoleGuard>
            }
          />

          {/* Usuarios - Solo Admin */}
          <Route
            path="/usuarios"
            element={
              <RoleGuard allowedRoles={['admin']}>
                <Usuarios />
              </RoleGuard>
            }
          />
        </Route>

        {/* Rutas de control */}
        <Route path="/unauthorized" element={<Unauthorized />} />
        <Route path="/login" element={<Navigate to="/dashboard" replace />} />
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </>
  );
}

function App() {
  return (
    <Router>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </Router>
  );
}

export default App;
