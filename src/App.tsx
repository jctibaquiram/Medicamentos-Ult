import { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { SpeedInsights } from '@vercel/speed-insights/react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { isSupabaseConfigured } from './lib/supabase';
import { useVentas } from './hooks/useVentas';

import { ProtectedRoute } from './components/ProtectedRoute';

const LoginPage = lazy(() =>
  import('./pages/Loginpage').then((module) => ({ default: module.LoginPage }))
);
const Unauthorized = lazy(() => import('./components/Unauthorized'));
const Layout = lazy(() =>
  import('./components/Layout').then((module) => ({ default: module.Layout }))
);
const Dashboard = lazy(() =>
  import('./components/Dashboard').then((module) => ({ default: module.Dashboard }))
);
const Inventario = lazy(() =>
  import('./components/Inventario').then((module) => ({ default: module.Inventario }))
);
const RegistroVentas = lazy(() =>
  import('./components/RegistroVentas').then((module) => ({ default: module.RegistroVentas }))
);
const Reportes = lazy(() =>
  import('./components/Reportes').then((module) => ({ default: module.Reportes }))
);

const Usuarios = () => (
  <div className="space-y-4">
    <h1 className="text-2xl font-semibold text-neutral-100 tracking-tight">Gestión de Usuarios</h1>
    <p className="text-neutral-400 text-sm">Este módulo está en fase de desarrollo técnico.</p>
  </div>
);

const LoadingScreen = ({ label }: { label: string }) => (
  <div className="h-screen w-screen flex items-center justify-center bg-neutral-950">
    <div className="flex flex-col items-center gap-4">
      <div className="w-8 h-8 border-2 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin" />
      <p className="text-xs text-neutral-500 uppercase tracking-[0.2em] font-medium">{label}</p>
    </div>
  </div>
);

function getDefaultPathForRole(role: string | null) {
  if (role === 'admin') return '/dashboard';
  if (role === 'empleado') return '/ventas';
  if (role === 'vendedor') return '/ventas';
  return '/unauthorized';
}

function PublicRoutes() {
  return (
    <Suspense fallback={<LoadingScreen label="Cargando acceso" />}>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/unauthorized" element={<Unauthorized />} />
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  );
}

function AuthenticatedRoutes({
  role,
  ventas,
  loadingVentas,
  optimisticStock,
  syncOptimisticStock,
  createVenta,
  deleteVenta,
}: {
  role: string | null;
  ventas: Awaited<ReturnType<typeof useVentas>>['ventas'];
  loadingVentas: boolean;
  optimisticStock: Awaited<ReturnType<typeof useVentas>>['optimisticStock'];
  syncOptimisticStock: Awaited<ReturnType<typeof useVentas>>['syncOptimisticStock'];
  createVenta: Awaited<ReturnType<typeof useVentas>>['createVenta'];
  deleteVenta: Awaited<ReturnType<typeof useVentas>>['deleteVenta'];
}) {
  const defaultPath = getDefaultPathForRole(role);
  const unauthorizedElement =
    defaultPath === '/unauthorized' ? <Unauthorized /> : <Navigate to={defaultPath} replace />;

  return (
    <Suspense fallback={<LoadingScreen label="Cargando módulos" />}>
      <Routes>
        <Route path="/login" element={<Navigate to={defaultPath} replace />} />

        <Route
          element={
            <ProtectedRoute allowedRoles={['admin', 'empleado', 'vendedor']}>
              <Layout />
            </ProtectedRoute>
          }
        >
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <Dashboard />
              </ProtectedRoute>
            }
          />

          <Route
            path="/inventario"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <Inventario
                  optimisticStock={optimisticStock}
                  onStockSync={syncOptimisticStock}
                />
              </ProtectedRoute>
            }
          />

          <Route
            path="/ventas"
            element={
              <ProtectedRoute allowedRoles={['admin', 'empleado', 'vendedor']}>
                <RegistroVentas
                  ventas={ventas}
                  loadingVentas={loadingVentas}
                  optimisticStock={optimisticStock}
                  createVenta={createVenta}
                  deleteVenta={deleteVenta}
                />
              </ProtectedRoute>
            }
          />

          <Route
            path="/reportes"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <Reportes ventas={ventas} loading={loadingVentas} />
              </ProtectedRoute>
            }
          />

          <Route
            path="/usuarios"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <Usuarios />
              </ProtectedRoute>
            }
          />
        </Route>

        <Route path="/unauthorized" element={unauthorizedElement} />
        <Route path="/" element={<Navigate to={defaultPath} replace />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  );
}

function AppRoutes() {
  const { user, role, loading, roleLoading } = useAuth();
  const {
    ventas,
    loading: loadingVentas,
    optimisticStock,
    createVenta,
    deleteVenta,
    syncOptimisticStock,
  } = useVentas();

  if (!isSupabaseConfigured) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-neutral-950 px-6">
        <div className="w-full max-w-2xl rounded-2xl border border-neutral-800 bg-neutral-900/70 p-8 text-neutral-100 shadow-2xl">
          <h1 className="text-2xl font-semibold tracking-tight">Configuracion pendiente de Supabase</h1>
          <p className="mt-3 text-sm text-neutral-300">
            La aplicacion no puede iniciar porque faltan variables de entorno.
          </p>

          <div className="mt-6 rounded-xl border border-neutral-800 bg-neutral-950 p-4 font-mono text-sm text-neutral-200">
            <p>VITE_SUPABASE_URL=tu_url_de_supabase</p>
            <p>VITE_SUPABASE_ANON_KEY=tu_clave_anon</p>
          </div>

          <p className="mt-6 text-xs uppercase tracking-[0.15em] text-neutral-500">
            Crea un archivo .env en la raiz del proyecto y reinicia el servidor de Vite.
          </p>
        </div>
      </div>
    );
  }

  if (loading) {
    return <LoadingScreen label="Verificando credenciales" />;
  }

  if (user && roleLoading) {
    return <LoadingScreen label="Cargando permisos" />;
  }

  return user ? (
    <AuthenticatedRoutes
      role={role}
      ventas={ventas}
      loadingVentas={loadingVentas}
      optimisticStock={optimisticStock}
      syncOptimisticStock={syncOptimisticStock}
      createVenta={createVenta}
      deleteVenta={deleteVenta}
    />
  ) : (
    <PublicRoutes />
  );
}

function App() {
  return (
    <Router>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
      <SpeedInsights />
    </Router>
  );
}

export default App;