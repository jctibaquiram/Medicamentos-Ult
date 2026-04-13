import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';

// Importación de Páginas
import { LoginPage } from './pages/Loginpage';
import Unauthorized from './components/Unauthorized';

// Importación de Componentes de Protección
import { ProtectedRoute } from './components/ProtectedRoute';

// Componentes temporales para probar (Luego los cambias por tus archivos reales)
const Dashboard = () => <div className="p-8"><h1>Dashboard - Solo Admins</h1></div>;
const Ventas = () => <div className="p-8"><h1>Módulo de Ventas - Acceso General</h1></div>;

function AppRoutes() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-gray-900 text-white">
        <p className="animate-pulse">Cargando sistema de seguridad...</p>
      </div>
    );
  }

  return (
    <Routes>
      {/* RUTA PÚBLICA: Login */}
      <Route 
        path="/login" 
        element={!user ? <LoginPage /> : <Navigate to="/dashboard" />} 
      />

      {/* RUTA PROTEGIDA: Dashboard (Solo Admin) */}
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute allowedRoles={['admin']}>
            <Dashboard />
          </ProtectedRoute>
        }
      />

      {/* RUTA PROTEGIDA: Ventas (Admin y Empleado) */}
      <Route
        path="/ventas"
        element={
          <ProtectedRoute allowedRoles={['admin', 'empleado']}>
            <Ventas />
          </ProtectedRoute>
        }
      />

      {/* RUTAS DE CONTROL */}
      <Route path="/unauthorized" element={<Unauthorized />} />
      <Route path="/" element={<Navigate to={user ? "/dashboard" : "/login"} />} />
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
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