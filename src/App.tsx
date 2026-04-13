import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { useMedicamentos } from './hooks/useMedicamentos';
import { useVentas } from './hooks/useVentas';
import { useMessage } from './hooks/useMessage';
import { Dashboard } from './components/Dashboard';
import { Inventario } from './components/Inventario';
import { RegistroVentas } from './components/RegistroVentas';
import { Reportes } from './components/Reportes';
import { LoginPage } from './pages/LoginPage';
import { Unauthorized } from './components/Unauthorized';
import { ProtectedRoute } from './components/ProtectedRoute';
import { ReactNode } from 'react';

// Componente para proteger rutas - redirige a /login si no hay usuario
const RequireAuth = ({ children }: { children: ReactNode }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-slate-600 font-medium">Cargando...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

// Componente para redirigir usuarios autenticados fuera del login
const RedirectIfAuthenticated = ({ children }: { children: ReactNode }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-slate-600 font-medium">Cargando...</p>
        </div>
      </div>
    );
  }

  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
};

// Layout principal con navegación
const MainLayout = ({ children }: { children: ReactNode }) => {
  const { user, role, signOut } = useAuth();
  const { message } = useMessage();

  const navItems = [
    { path: '/dashboard', label: 'Dashboard', roles: ['admin', 'vendedor', 'viewer'] },
    { path: '/inventario', label: 'Inventario', roles: ['admin', 'vendedor'] },
    { path: '/ventas', label: 'Registrar Venta', roles: ['admin', 'vendedor'] },
    { path: '/reportes', label: 'Reportes', roles: ['admin'] },
  ];

  const visibleNavItems = navItems.filter(item =>
    role && item.roles.includes(role)
  );

  const handleLogout = async () => {
    await signOut();
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4 flex flex-col sm:flex-row justify-between items-center gap-4">
          <h1 className="text-xl font-bold text-slate-800">
            Wellness Med Manager
          </h1>
          <nav className="flex items-center gap-2 flex-wrap justify-center">
            {visibleNavItems.map((item) => (
              <a
                key={item.path}
                href={item.path}
                className="px-4 py-2 text-sm font-medium rounded-lg text-slate-600 hover:bg-slate-100 transition-colors"
              >
                {item.label}
              </a>
            ))}
            <button
              onClick={handleLogout}
              className="px-4 py-2 text-sm font-medium rounded-lg text-red-600 hover:bg-red-50 transition-colors"
            >
              Cerrar sesión
            </button>
          </nav>
        </div>
      </header>

      {/* Main content */}
      <main className="container mx-auto px-4 py-6 flex-grow">
        {/* User info */}
        <div className="mb-4 text-sm text-slate-500">
          Usuario: {user?.email} | Rol: <span className="font-medium capitalize">{role || 'Sin rol'}</span>
        </div>

        {/* Toast message */}
        {message && (
          <div className="fixed top-20 right-4 p-4 bg-blue-600 text-white font-medium rounded-lg shadow-lg z-50">
            {message}
          </div>
        )}

        {children}
      </main>

      {/* Footer */}
      <footer className="bg-slate-800 text-white p-4 text-center text-sm">
        © {new Date().getFullYear()} Wellness Med Manager
      </footer>
    </div>
  );
};

// Páginas con datos
const DashboardPage = () => {
  const medicamentos = useMedicamentos();
  const ventas = useVentas();
  return <Dashboard medicamentos={medicamentos} ventas={ventas} />;
};

const InventarioPage = () => {
  const medicamentos = useMedicamentos();
  const { showMessage } = useMessage();
  return <Inventario medicamentos={medicamentos} showMessage={showMessage} />;
};

const VentasPage = () => {
  const medicamentos = useMedicamentos();
  const { showMessage } = useMessage();
  return <RegistroVentas medicamentos={medicamentos} showMessage={showMessage} />;
};

const ReportesPage = () => {
  const ventas = useVentas();
  return <Reportes ventas={ventas} />;
};

// App principal con rutas
const AppRoutes = () => {
  return (
    <Routes>
      {/* Ruta de login - redirige a dashboard si ya está autenticado */}
      <Route
        path="/login"
        element={
          <RedirectIfAuthenticated>
            <LoginPage />
          </RedirectIfAuthenticated>
        }
      />

      {/* Ruta de no autorizado */}
      <Route
        path="/unauthorized"
        element={
          <RequireAuth>
            <MainLayout>
              <Unauthorized
                onGoBack={() => window.history.back()}
                onLogout={() => window.location.href = '/login'}
              />
            </MainLayout>
          </RequireAuth>
        }
      />

      {/* Dashboard - accesible para todos los roles */}
      <Route
        path="/dashboard"
        element={
          <RequireAuth>
            <MainLayout>
              <ProtectedRoute
                allowedRoles={['admin', 'vendedor', 'viewer']}
                onUnauthorized={() => window.location.href = '/unauthorized'}
              >
                <DashboardPage />
              </ProtectedRoute>
            </MainLayout>
          </RequireAuth>
        }
      />

      {/* Inventario - solo admin y vendedor */}
      <Route
        path="/inventario"
        element={
          <RequireAuth>
            <MainLayout>
              <ProtectedRoute
                allowedRoles={['admin', 'vendedor']}
                onUnauthorized={() => window.location.href = '/unauthorized'}
              >
                <InventarioPage />
              </ProtectedRoute>
            </MainLayout>
          </RequireAuth>
        }
      />

      {/* Ventas - solo admin y vendedor */}
      <Route
        path="/ventas"
        element={
          <RequireAuth>
            <MainLayout>
              <ProtectedRoute
                allowedRoles={['admin', 'vendedor']}
                onUnauthorized={() => window.location.href = '/unauthorized'}
              >
                <VentasPage />
              </ProtectedRoute>
            </MainLayout>
          </RequireAuth>
        }
      />

      {/* Reportes - solo admin */}
      <Route
        path="/reportes"
        element={
          <RequireAuth>
            <MainLayout>
              <ProtectedRoute
                allowedRoles={['admin']}
                onUnauthorized={() => window.location.href = '/unauthorized'}
              >
                <ReportesPage />
              </ProtectedRoute>
            </MainLayout>
          </RequireAuth>
        }
      />

      {/* Redirigir raíz a dashboard o login */}
      <Route path="/" element={<Navigate to="/dashboard" replace />} />

      {/* Cualquier otra ruta redirige a dashboard */}
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
};

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
