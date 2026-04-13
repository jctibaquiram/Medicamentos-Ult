import { StatCard } from './StatCard';
import { formatCurrency } from '../utils/format';
import type { Medicamento, Venta } from '../types';
import { AlertTriangle, Package, TrendingUp, DollarSign, Calendar } from 'lucide-react';

interface DashboardProps {
  medicamentos: Medicamento[];
  ventas: Venta[];
}

export const Dashboard = ({ medicamentos, ventas }: DashboardProps) => {
  const lowStockItems = medicamentos.filter((m) => m.stock < m.min_stock);

  const totalStockValue = medicamentos.reduce((sum, m) => sum + m.stock * m.costo, 0);
  const totalSalesValue = ventas.reduce((sum, v) => sum + v.total_venta, 0);
  const totalProfitValue = ventas.reduce((sum, v) => sum + v.ganancia, 0);

  const today = new Date().toDateString();
  const todaySales = ventas.filter((v) => v.fecha.toDateString() === today);
  const todayTotal = todaySales.reduce((sum, v) => sum + v.total_venta, 0);
  const todayProfit = todaySales.reduce((sum, v) => sum + v.ganancia, 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-neutral-100 tracking-tight">Panel de Control</h2>
        <span className="text-xs text-neutral-500">
          {new Date().toLocaleDateString('es-CO', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        </span>
      </div>

      {lowStockItems.length > 0 && (
        <div className="p-4 bg-red-950/30 border border-red-900/50 rounded-lg">
          <div className="flex items-start gap-3">
            <AlertTriangle size={18} className="text-red-400 mt-0.5 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-red-300">Alerta de inventario bajo</p>
              <ul className="mt-2 space-y-1">
                {lowStockItems.slice(0, 5).map((m) => (
                  <li key={m.id} className="text-xs text-red-400/80">
                    {m.nombre}: {m.stock} unidades (min. {m.min_stock})
                  </li>
                ))}
              </ul>
              {lowStockItems.length > 5 && (
                <p className="mt-1 text-xs text-red-500">+{lowStockItems.length - 5} productos más</p>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard
          title="Valor de Inventario"
          value={formatCurrency(totalStockValue)}
          icon={<Package size={16} className="text-blue-400" />}
          color="bg-blue-950/40 border-blue-900/50"
        />
        <StatCard
          title="Ventas Totales"
          value={formatCurrency(totalSalesValue)}
          icon={<DollarSign size={16} className="text-emerald-400" />}
          color="bg-emerald-950/40 border-emerald-900/50"
        />
        <StatCard
          title="Ganancia Total"
          value={formatCurrency(totalProfitValue)}
          icon={<TrendingUp size={16} className="text-amber-400" />}
          color="bg-amber-950/40 border-amber-900/50"
        />
      </div>

      <div className="card-dark">
        <div className="flex items-center gap-2 mb-4">
          <Calendar size={16} className="text-neutral-500" />
          <h3 className="text-sm font-medium text-neutral-300">
            Resumen de Hoy
          </h3>
        </div>
        <div className="grid grid-cols-2 gap-6">
          <div>
            <p className="text-xs text-neutral-500 mb-1">Ventas</p>
            <p className="text-2xl font-semibold text-emerald-400 tabular-nums">
              {formatCurrency(todayTotal)}
            </p>
          </div>
          <div>
            <p className="text-xs text-neutral-500 mb-1">Ganancia</p>
            <p className="text-2xl font-semibold text-amber-400 tabular-nums">
              {formatCurrency(todayProfit)}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
