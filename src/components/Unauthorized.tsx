import { useAuth } from '../contexts/AuthContext';

interface UnauthorizedProps {
  onGoBack?: () => void;
  onLogout?: () => void;
}

export const Unauthorized = ({ onGoBack, onLogout }: UnauthorizedProps) => {
  const { role, signOut } = useAuth();

  const handleLogout = async () => {
    await signOut();
    onLogout?.();
  };

  return (
    <div className="flex items-center justify-center min-h-[500px] p-4">
      <div className="w-full max-w-lg">
        <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
          <div className="mb-6">
            <svg
              className="w-20 h-20 mx-auto text-yellow-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636"
              />
            </svg>
          </div>

          <h1 className="text-3xl font-bold text-gray-800 mb-4">Acceso No Autorizado</h1>

          <p className="text-gray-600 mb-6 text-lg">
            Lo sentimos, no tienes los permisos necesarios para acceder a esta página.
          </p>

          <div className="bg-gray-50 rounded-lg p-4 mb-8">
            <p className="text-sm text-gray-500">
              Tu rol actual:{' '}
              <span className="font-semibold text-gray-700 capitalize">
                {role || 'Sin rol asignado'}
              </span>
            </p>
            <p className="text-xs text-gray-400 mt-2">
              Contacta al administrador si crees que esto es un error.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            {onGoBack && (
              <button
                onClick={onGoBack}
                className="px-6 py-3 bg-gray-100 text-gray-700 rounded-lg font-semibold hover:bg-gray-200 transition-colors"
              >
                Volver Atrás
              </button>
            )}
            <button
              onClick={handleLogout}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors"
            >
              Cerrar Sesión
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Unauthorized;
