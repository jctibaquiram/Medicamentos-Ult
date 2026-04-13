import { Link } from 'react-router-dom';
import { ShieldX } from 'lucide-react';

export default function Unauthorized() {
  return (
    <div className="flex h-screen items-center justify-center bg-neutral-950">
      <div className="text-center space-y-4">
        <div className="flex justify-center">
          <div className="p-4 rounded-full bg-red-950/30 border border-red-900/50">
            <ShieldX size={32} className="text-red-400" />
          </div>
        </div>
        <div>
          <h1 className="text-lg font-semibold text-neutral-100">Acceso Denegado</h1>
          <p className="mt-1 text-sm text-neutral-500">No tienes permiso para ver esta sección.</p>
        </div>
        <Link
          to="/"
          className="inline-block px-4 py-2 text-sm font-medium text-neutral-300 bg-neutral-800 border border-neutral-700 rounded hover:bg-neutral-700 transition-colors"
        >
          Volver al inicio
        </Link>
      </div>
    </div>
  );
}
