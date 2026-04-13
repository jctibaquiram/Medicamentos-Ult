import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export const ProtectedRoute = ({ children, allowedRoles }: { children: JSX.Element, allowedRoles: string[] }) => {
  const { user, role, loading } = useAuth();
  const location = useLocation();

  if (loading) return <div>Cargando...</div>;
  if (!user) return <Navigate to="/login" state={{ from: location }} replace />;
  if (role && !allowedRoles.includes(role)) return <Navigate to="/unauthorized" replace />;

  return children;
};