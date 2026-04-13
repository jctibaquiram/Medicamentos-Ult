import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';

// Páginas
import { LoginPage } from './pages/Loginpage';
import Unauthorized from './components/Unauthorized';

// Layout y Protección
import { Layout } from './components/Layout';
import { ProtectedRoute } from './components/ProtectedRoute';

// Componentes de contenido (placeholders para rutas no implementadas)
import { Dashboard } from './components/Dashboard';
import { Inventario } from './components/Inventario';
import { RegistroVentas } from './components/RegistroVentas';
import { Reportes } from './components/Reportes';

// Hooks de datos
import { useMedicamentos } from './hooks/useMedicamentos';
import { useVentas } from './hooks/useVentas';
import { useMessage } from './hooks/useMessage';

// Placeholder para Usuarios (implementar después)
const Usuarios = () => (
  <div className="space-y-4">
    <h1 className="text-2xl font-semibold text-neutral-100">Gestión de Usuarios</h1>
    <p className="text-neutral-400 text-sm">Módulo en desarrollo.</p>
  </div>
);

function AppRoutes() {
  const { user, loading } = useAuth();
  const { medicamentos } = useMedicamentos();
  const { ventas } = useVentas();
  const { message, showMessage } = useMessage();

  if (loading) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-neutral-950">
        <div className="flex flex-col items-center gap-3">
          <div className="w-6 h-6 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-neutral-400 tracking-tight">Cargando sistema...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Mensaje global */}
      {message && (
        <div className="fixed top-4 right-4 z-50 px-4 py-2.5 bg-neutral-800 border border-neutral-700 rounded text-sm text-neutral-200 shadow-lg">
          {message}
        </div>
      )}

      <Routes>
        {/* Ruta pública: Login */}
        <Route
          path="/login"
          element={!user ? <LoginPage /> : <Navigate to="/dashboard" />}
        />

        {/* Rutas protegidas con Layout */}
        <Route
          element={
            <ProtectedRoute allowedRoles={['admin', 'empleado', 'vendedor']}>
              <Layout />
            </ProtectedRoute>
          }
        >
          {/* Dashboard - Solo Admin */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <Dashboard medicamentos={medicamentos} ventas={ventas} />
              </ProtectedRoute>
            }
          />

          {/* Inventario - Admin y Empleado */}
          <Route
            path="/inventario"
            element={
              <ProtectedRoute allowedRoles={['admin', 'empleado']}>
                <Inventario medicamentos={medicamentos} showMessage={showMessage} />
              </ProtectedRoute>
            }
          />

          {/* Ventas - Admin y Empleado */}
          <Route
            path="/ventas"
            element={
              <ProtectedRoute allowedRoles={['admin', 'empleado']}>
                <RegistroVentas medicamentos={medicamentos} showMessage={showMessage} />
              </ProtectedRoute>
            }
          />

          {/* Reportes - Solo Admin */}
          <Route
            path="/reportes"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <Reportes ventas={ventas} />
              </ProtectedRoute>
            }
          />

          {/* Usuarios - Solo Admin */}
          <Route
            path="/usuarios"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <Usuarios />
              </ProtectedRoute>
            }
          />
        </Route>

        {/* Rutas de control */}
        <Route path="/unauthorized" element={<Unauthorized />} />
        <Route path="/" element={<Navigate to={user ? "/dashboard" : "/login"} />} />
        <Route path="*" element={<Navigate to="/" />} />
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
