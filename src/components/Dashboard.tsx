import { useMemo } from 'react';
import { StatCard } from './StatCard';
import { formatCurrency } from '../utils/format';
import { useMedicamentos } from '../hooks/useMedicamentos';
import { useVentas } from '../hooks/useVentas';

export const Dashboard = () => {
  const { medicamentos, loading: loadingMedicamentos } = useMedicamentos();
  const { ventas, loading: loadingVentas } = useVentas();

  const lowStockItems = useMemo(
    () => medicamentos.filter((m) => m.stock < m.min_stock),
    [medicamentos]
  );

  const totalStockValue = useMemo(
    () => medicamentos.reduce((sum, m) => sum + m.stock * m.costo, 0),
    [medicamentos]
  );
  const totalSalesValue = useMemo(
    () => ventas.reduce((sum, v) => sum + v.total_venta, 0),
    [ventas]
  );
  const totalProfitValue = useMemo(
    () => ventas.reduce((sum, v) => sum + v.ganancia, 0),
    [ventas]
  );

  const today = new Date().toDateString();
  const todaySales = useMemo(
    () => ventas.filter((v) => v.fecha.toDateString() === today),
    [ventas, today]
  );
  const todayTotal = useMemo(
    () => todaySales.reduce((sum, v) => sum + v.total_venta, 0),
    [todaySales]
  );
  const todayProfit = useMemo(
    () => todaySales.reduce((sum, v) => sum + v.ganancia, 0),
    [todaySales]
  );

  if (loadingMedicamentos || loadingVentas) {
    return (
      <div className="min-h-[60vh] w-full flex items-center justify-center bg-neutral-950 rounded-xl">
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 border-2 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin" />
          <p className="text-xs text-neutral-500 uppercase tracking-[0.2em] font-medium">
            Cargando dashboard
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-bold text-neutral-100">Panel de Control (Dashboard)</h2>

      {lowStockItems.length > 0 && (
        <div className="p-4 bg-red-100 border-l-4 border-red-500 rounded-lg shadow-md">
          <p className="text-lg font-semibold text-red-800">¡ALERTA DE INVENTARIO BAJO!</p>
          <ul className="pl-5 mt-2 text-sm list-disc text-red-700">
            {lowStockItems.map((m) => (
              <li key={m.id}>
                {m.nombre}: Quedan {m.stock} unidades (Mínimo: {m.min_stock})
              </li>
            ))}
          </ul>
          <p className="mt-2 text-sm">Visita la sección de **Inventario** para reabastecer.</p>
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        <StatCard
          title="Valor Total de Inventario (Costo)"
          value={formatCurrency(totalStockValue)}
          icon="📦"
          color="bg-blue-500"
        />
        <StatCard
          title="Ventas Totales Registradas"
          value={formatCurrency(totalSalesValue)}
          icon="💰"
          color="bg-green-500"
        />
        <StatCard
          title="Ganancia Total Histórica"
          value={formatCurrency(totalProfitValue)}
          icon="📈"
          color="bg-yellow-500"
        />
      </div>

      <div className="p-6 bg-white rounded-xl shadow-lg">
        <h3 className="mb-4 text-xl font-semibold text-gray-700">
          Resumen de Hoy ({new Date().toLocaleDateString('es-CO')})
        </h3>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <p className="text-sm font-medium text-gray-500">Ventas Registradas Hoy</p>
            <p className="text-2xl font-bold text-green-600">{formatCurrency(todayTotal)}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">Ganancia de Hoy</p>
            <p className="text-2xl font-bold text-yellow-600">{formatCurrency(todayProfit)}</p>
          </div>
        </div>
      </div>
    </div>
  );
};
