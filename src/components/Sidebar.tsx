import { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth, type UserRole } from '../contexts/AuthContext';
import {
  LayoutDashboard,
  Package,
  FileBarChart,
  ShoppingCart,
  Users,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Pill,
} from 'lucide-react';

interface NavItem {
  to: string;
  label: string;
  icon: React.ReactNode;
  allowedRoles: UserRole[];
}

const navItems: NavItem[] = [
  {
    to: '/dashboard',
    label: 'Dashboard',
    icon: <LayoutDashboard size={18} strokeWidth={1.5} />,
    allowedRoles: ['admin'],
  },
  {
    to: '/inventario',
    label: 'Inventario',
    icon: <Package size={18} strokeWidth={1.5} />,
    allowedRoles: ['admin'],
  },
  {
    to: '/ventas',
    label: 'Ventas',
    icon: <ShoppingCart size={18} strokeWidth={1.5} />,
    allowedRoles: ['admin', 'empleado', 'vendedor'],
  },
  {
    to: '/reportes',
    label: 'Reportes',
    icon: <FileBarChart size={18} strokeWidth={1.5} />,
    allowedRoles: ['admin'],
  },
  {
    to: '/usuarios',
    label: 'Usuarios',
    icon: <Users size={18} strokeWidth={1.5} />,
    allowedRoles: ['admin'],
  },
];

export const Sidebar = () => {
  const { user, role, signOut } = useAuth();
  const [collapsed, setCollapsed] = useState(false);

  const filteredNavItems = navItems.filter(
    (item) => role && item.allowedRoles.includes(role)
  );

  const handleSignOut = async () => {
    await signOut();
  };

  return (
    <aside
      className={`
        flex flex-col h-screen bg-neutral-950 border-r border-neutral-800
        transition-all duration-200 ease-in-out
        ${collapsed ? 'w-16' : 'w-56'}
      `}
    >
      {/* Header */}
      <div className="flex items-center justify-between h-14 px-3 border-b border-neutral-800">
        <div className={`flex items-center gap-2 ${collapsed ? 'justify-center w-full' : ''}`}>
          <div className="flex items-center justify-center w-8 h-8 rounded bg-emerald-950">
            <Pill size={16} className="text-emerald-400" strokeWidth={1.5} />
          </div>
          {!collapsed && (
            <span className="text-sm font-medium text-neutral-200 tracking-tight">
              MedStock
            </span>
          )}
        </div>
        <button
          onClick={() => setCollapsed(!collapsed)}
          className={`
            p-1.5 rounded text-neutral-500 hover:text-neutral-300 hover:bg-neutral-800
            transition-colors ${collapsed ? 'hidden' : ''}
          `}
          aria-label={collapsed ? 'Expandir sidebar' : 'Colapsar sidebar'}
        >
          <ChevronLeft size={16} strokeWidth={1.5} />
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-3 px-2 space-y-0.5 overflow-y-auto">
        {filteredNavItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `flex items-center gap-2.5 px-2.5 py-2 rounded text-sm font-medium
              transition-colors duration-150
              ${collapsed ? 'justify-center' : ''}
              ${
                isActive
                  ? 'bg-emerald-950/60 text-emerald-400 border-l-2 border-emerald-500'
                  : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-900 border-l-2 border-transparent'
              }`
            }
            title={collapsed ? item.label : undefined}
          >
            {item.icon}
            {!collapsed && <span>{item.label}</span>}
          </NavLink>
        ))}
      </nav>

      {/* Footer */}
      <div className="border-t border-neutral-800 p-2 space-y-2">
        {/* User info */}
        <div
          className={`
            flex items-center gap-2 px-2.5 py-2 rounded bg-neutral-900
            ${collapsed ? 'justify-center' : ''}
          `}
        >
          <div className="w-7 h-7 rounded bg-neutral-800 flex items-center justify-center">
            <span className="text-xs font-medium text-neutral-400 uppercase">
              {user?.email?.charAt(0) || 'U'}
            </span>
          </div>
          {!collapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-neutral-300 truncate">
                {user?.email || 'Usuario'}
              </p>
              <p className="text-[10px] text-neutral-500 uppercase tracking-wider">
                {role || 'Sin rol'}
              </p>
            </div>
          )}
        </div>

        {/* Expand button (when collapsed) */}
        {collapsed && (
          <button
            onClick={() => setCollapsed(false)}
            className="w-full p-2 rounded text-neutral-500 hover:text-neutral-300 hover:bg-neutral-800 transition-colors flex justify-center"
            aria-label="Expandir sidebar"
          >
            <ChevronRight size={16} strokeWidth={1.5} />
          </button>
        )}

        {/* Sign out */}
        <button
          onClick={handleSignOut}
          className={`
            flex items-center gap-2.5 w-full px-2.5 py-2 rounded text-sm font-medium
            text-neutral-500 hover:text-red-400 hover:bg-red-950/30
            transition-colors duration-150
            ${collapsed ? 'justify-center' : ''}
          `}
          title={collapsed ? 'Cerrar sesión' : undefined}
        >
          <LogOut size={16} strokeWidth={1.5} />
          {!collapsed && <span>Cerrar sesión</span>}
        </button>
      </div>
    </aside>
  );
};
