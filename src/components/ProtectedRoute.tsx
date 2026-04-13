import { ReactNode } from 'react';
import { useAuth } from '../contexts/AuthContext';
import type { UserRole } from '../lib/database.types';

interface ProtectedRouteProps {
  children: ReactNode;
  allowedRoles: UserRole[];
  fallback?: ReactNode;
  onUnauthorized?: () => void;
  onUnauthenticated?: () => void;
}

export const ProtectedRoute = ({
  children,
  allowedRoles,
  fallback,
  onUnauthorized,
  onUnauthenticated,
}: ProtectedRouteProps) => {
  const { user, role, loading, isAuthorized } = useAuth();

  // Show loading state while checking auth
  if (loading) {
    return (
      fallback || (
        <div className="flex items-center justify-center min-h-[200px] p-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Verificando permisos...</p>
          </div>
        </div>
      )
    );
  }

  // User is not authenticated
  if (!user) {
    if (onUnauthenticated) {
      onUnauthenticated();
      return null;
    }
    
    return (
      <div className="flex items-center justify-center min-h-[400px] p-8">
        <div className="text-center bg-white rounded-lg shadow-lg p-8 max-w-md">
          <div className="text-red-500 text-5xl mb-4">
            <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Acceso Restringido</h2>
          <p className="text-gray-600 mb-6">
            Debes iniciar sesión para acceder a esta sección.
          </p>
          <a
            href="/login"
            className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
          >
            Iniciar Sesión
          </a>
        </div>
      </div>
    );
  }

  // User is authenticated but doesn't have the required role
  if (!isAuthorized(allowedRoles)) {
    if (onUnauthorized) {
      onUnauthorized();
      return null;
    }

    return (
      <div className="flex items-center justify-center min-h-[400px] p-8">
        <div className="text-center bg-white rounded-lg shadow-lg p-8 max-w-md">
          <div className="text-yellow-500 text-5xl mb-4">
            <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Sin Autorización</h2>
          <p className="text-gray-600 mb-4">
            No tienes los permisos necesarios para acceder a esta sección.
          </p>
          <p className="text-sm text-gray-500 mb-6">
            Tu rol actual: <span className="font-semibold text-gray-700">{role || 'Sin rol asignado'}</span>
          </p>
          <p className="text-sm text-gray-500 mb-6">
            Roles permitidos: <span className="font-semibold text-gray-700">{allowedRoles.join(', ')}</span>
          </p>
          <a
            href="/"
            className="inline-block bg-gray-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-gray-700 transition-colors"
          >
            Volver al Inicio
          </a>
        </div>
      </div>
    );
  }

  // User is authenticated and authorized
  return <>{children}</>;
};

export default ProtectedRoute;
