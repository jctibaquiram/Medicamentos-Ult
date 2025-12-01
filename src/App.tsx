import { useState } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { useMedicamentos } from './hooks/useMedicamentos';
import { useVentas } from './hooks/useVentas';
import { useMessage } from './hooks/useMessage';
import { Dashboard } from './components/Dashboard';
import { Inventario } from './components/Inventario';
import { RegistroVentas } from './components/RegistroVentas';
import { Reportes } from './components/Reportes';
import type { ViewType } from './types';

const AppContent = () => {
  const { user, loading } = useAuth();
  const medicamentos = useMedicamentos();
  const ventas = useVentas();
  const { message, showMessage } = useMessage();
  const [activeView, setActiveView] = useState<ViewType>('dashboard');

  const navItems = [
    { key: 'dashboard' as ViewType, label: 'Dashboard', icon: '🏠' },
    { key: 'inventario' as ViewType, label: 'Inventario', icon: '📦' },
    { key: 'ventas' as ViewType, label: 'Registrar Venta', icon: '🛒' },
    { key: 'reportes' as ViewType, label: 'Reportes y Balance', icon: '📊' },
  ];

  const renderContent = () => {
    switch (activeView) {
      case 'inventario':
        return <Inventario medicamentos={medicamentos} showMessage={showMessage} />;
      case 'ventas':
        return <RegistroVentas medicamentos={medicamentos} showMessage={showMessage} />;
      case 'reportes':
        return <Reportes ventas={ventas} />;
      case 'dashboard':
      default:
        return <Dashboard medicamentos={medicamentos} ventas={ventas} />;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen p-8 text-gray-700 bg-gray-50">
        <div className="text-xl font-semibold">Cargando aplicación y autenticación...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 font-sans antialiased flex flex-col">
      <header className="bg-white shadow-md sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4 flex flex-col sm:flex-row justify-between items-center">
          <h1 className="text-2xl font-extrabold text-blue-700 mb-2 sm:mb-0">
            Wellness Med Manager
          </h1>
          <nav className="flex space-x-2 sm:space-x-4 overflow-x-auto pb-1">
            {navItems.map((item) => (
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
          </nav>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 flex-grow">
        {message && (
          <div className="fixed top-20 right-4 p-4 bg-yellow-400 text-gray-800 font-semibold rounded-lg shadow-xl z-50 transition-opacity duration-300">
            {message}
          </div>
        )}

        <div className="mb-4 text-xs text-right text-gray-500">
          Usuario ID: {user?.id || 'N/A'} (Asegúrese de estar autenticado)
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
