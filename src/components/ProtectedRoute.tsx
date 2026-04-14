import { Navigate, useLocation, Outlet } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export const ProtectedRoute = ({ 
  children, 
  allowedRoles 
}: { 
  children?: JSX.Element, // Lo hacemos opcional con el ?
  allowedRoles: string[] 
}) => {
  const { user, role, loading, roleLoading } = useAuth();
  const location = useLocation();

  if (loading) return <div className="bg-neutral-950 h-screen text-white p-10">Verificando credenciales...</div>;
  
  if (!user) return <Navigate to="/login" state={{ from: location }} replace />;

  if (roleLoading) return <div className="bg-neutral-950 h-screen text-white p-10">Cargando permisos...</div>;

  if (!role || !allowedRoles.includes(role)) return <Navigate to="/unauthorized" replace />;

  // Si tiene hijos (como el Login o Dashboard individual), los muestra.
  // Si no tiene hijos (es una ruta de Layout), muestra el Outlet.
  return children ? children : <Outlet />;
};