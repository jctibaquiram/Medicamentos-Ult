import { StatCard } from './StatCard';
import { formatCurrency } from '../utils/format';
import type { Medicamento, Venta } from '../types';

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
      <h2 className="text-3xl font-bold text-gray-800">Panel de Control (Dashboard)</h2>

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
