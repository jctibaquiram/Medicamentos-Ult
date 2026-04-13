import { useState } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { useMedicamentos } from './hooks/useMedicamentos';
import { useVentas } from './hooks/useVentas';
import { useMessage } from './hooks/useMessage';
import { Dashboard } from './components/Dashboard';
import { Inventario } from './components/Inventario';
import { RegistroVentas } from './components/RegistroVentas';
import { Reportes } from './components/Reportes';
import { Login } from './components/Login';
import { Unauthorized } from './components/Unauthorized';
import { ProtectedRoute } from './components/ProtectedRoute';
import type { ViewType } from './types';

type AppView = ViewType | 'login' | 'unauthorized';

const AppContent = () => {
  const { user, role, loading, signOut } = useAuth();
  const medicamentos = useMedicamentos();
  const ventas = useVentas();
  const { message, showMessage } = useMessage();
  const [activeView, setActiveView] = useState<AppView>('dashboard');

  const navItems = [
    { key: 'dashboard' as ViewType, label: 'Dashboard', icon: '🏠', roles: ['admin', 'vendedor', 'viewer'] },
    { key: 'inventario' as ViewType, label: 'Inventario', icon: '📦', roles: ['admin', 'vendedor'] },
    { key: 'ventas' as ViewType, label: 'Registrar Venta', icon: '🛒', roles: ['admin', 'vendedor'] },
    { key: 'reportes' as ViewType, label: 'Reportes y Balance', icon: '📊', roles: ['admin'] },
  ];

  const handleLogout = async () => {
    await signOut();
    setActiveView('login');
  };

  const renderContent = () => {
    // Show login page if not authenticated
    if (activeView === 'login' || !user) {
      return (
        <Login
          onSuccess={() => setActiveView('dashboard')}
          onSwitchToSignUp={() => {/* Could add signup view */}}
        />
      );
    }

    // Show unauthorized page
    if (activeView === 'unauthorized') {
      return (
        <Unauthorized
          onGoBack={() => setActiveView('dashboard')}
          onLogout={() => setActiveView('login')}
        />
      );
    }

    switch (activeView) {
      case 'inventario':
        return (
          <ProtectedRoute
            allowedRoles={['admin', 'vendedor']}
            onUnauthorized={() => setActiveView('unauthorized')}
          >
            <Inventario medicamentos={medicamentos} showMessage={showMessage} />
          </ProtectedRoute>
        );
      case 'ventas':
        return (
          <ProtectedRoute
            allowedRoles={['admin', 'vendedor']}
            onUnauthorized={() => setActiveView('unauthorized')}
          >
            <RegistroVentas medicamentos={medicamentos} showMessage={showMessage} />
          </ProtectedRoute>
        );
      case 'reportes':
        return (
          <ProtectedRoute
            allowedRoles={['admin']}
            onUnauthorized={() => setActiveView('unauthorized')}
          >
            <Reportes ventas={ventas} />
          </ProtectedRoute>
        );
      case 'dashboard':
      default:
        return (
          <ProtectedRoute
            allowedRoles={['admin', 'vendedor', 'viewer']}
            onUnauthorized={() => setActiveView('unauthorized')}
          >
            <Dashboard medicamentos={medicamentos} ventas={ventas} />
          </ProtectedRoute>
        );
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen p-8 text-gray-700 bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <div className="text-xl font-semibold">Cargando aplicación...</div>
        </div>
      </div>
    );
  }

  // Show login if not authenticated
  if (!user) {
    return (
      <div className="min-h-screen bg-gray-100 font-sans antialiased flex flex-col">
        <header className="bg-white shadow-md">
          <div className="container mx-auto px-4 py-4">
            <h1 className="text-2xl font-extrabold text-blue-700 text-center">
              Wellness Med Manager
            </h1>
          </div>
        </header>
        <main className="flex-grow flex items-center justify-center">
          <Login
            onSuccess={() => setActiveView('dashboard')}
          />
        </main>
        <footer className="bg-gray-800 text-white p-4 text-center text-sm">
          © {new Date().getFullYear()} Wellness Med Manager | Desarrollado con React y Supabase
        </footer>
      </div>
    );
  }

  // Filter nav items based on user role
  const visibleNavItems = navItems.filter(item => 
    role && item.roles.includes(role)
  );

  return (
    <div className="min-h-screen bg-gray-100 font-sans antialiased flex flex-col">
      <header className="bg-white shadow-md sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4 flex flex-col sm:flex-row justify-between items-center">
          <h1 className="text-2xl font-extrabold text-blue-700 mb-2 sm:mb-0">
            Wellness Med Manager
          </h1>
          <nav className="flex items-center space-x-2 sm:space-x-4 overflow-x-auto pb-1">
            {visibleNavItems.map((item) => (
              <button
                key={item.key}
                onClick={() => setActiveView(item.key)}
                className={`flex items-center px-4 py-2 text-sm font-semibold rounded-full transition-colors duration-150 whitespace-nowrap
                  ${
                    activeView === item.key
                      ? 'bg-blue-600 text-white shadow-lg'
                      : 'text-gray-600 hover:bg-gray-200'
                  }`}
              >
                {item.icon} <span className="ml-1 hidden sm:inline">{item.label}</span>
              </button>
            ))}
            <button
              onClick={handleLogout}
              className="flex items-center px-4 py-2 text-sm font-semibold rounded-full text-red-600 hover:bg-red-50 transition-colors duration-150 whitespace-nowrap"
            >
              <span className="mr-1">🚪</span>
              <span className="hidden sm:inline">Salir</span>
            </button>
          </nav>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 flex-grow">
        {message && (
          <div className="fixed top-20 right-4 p-4 bg-yellow-400 text-gray-800 font-semibold rounded-lg shadow-xl z-50 transition-opacity duration-300">
            {message}
          </div>
        )}

        <div className="mb-4 flex justify-between items-center text-xs text-gray-500">
          <span>
            Usuario: {user?.email || 'N/A'} | Rol: <span className="font-semibold capitalize">{role || 'Sin rol'}</span>
          </span>
        </div>

        {renderContent()}
      </main>

      <footer className="bg-gray-800 text-white p-4 text-center text-sm mt-8">
        © {new Date().getFullYear()} Wellness Med Manager | Desarrollado con React y Supabase
      </footer>
    </div>
  );
};

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
