import { useState, useCallback, useMemo } from 'react';
import { StatCard } from './StatCard';
import { formatCurrency } from '../utils/format';
import type { Venta } from '../types';

interface ReportesProps {
  ventas: Venta[];
}

export const Reportes = ({ ventas }: ReportesProps) => {
  const [reportType, setReportType] = useState('weekly');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().substring(0, 10));

  const getReportRange = useCallback(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (reportType === 'daily') {
      const start = new Date(selectedDate);
      const end = new Date(start);
      end.setDate(end.getDate() + 1);
      return { start, end };
    } else if (reportType === 'weekly') {
      const date = new Date(selectedDate);
      const dayOfWeek = date.getDay();
      const startOfWeek = new Date(date);
      startOfWeek.setDate(date.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1));
      startOfWeek.setHours(0, 0, 0, 0);

      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(startOfWeek.getDate() + 7);

      return { start: startOfWeek, end: endOfWeek };
    } else if (reportType === 'monthly') {
      const [year, month] = selectedDate.split('-');
      const start = new Date(parseInt(year), parseInt(month) - 1, 1);
      const end = new Date(parseInt(year), parseInt(month), 1);
      return { start, end };
    } else if (reportType === 'yearly') {
      const year = new Date(selectedDate).getFullYear();
      const start = new Date(year, 0, 1);
      const end = new Date(year + 1, 0, 1);
      return { start, end };
    }
    return { start: new Date(0), end: today };
  }, [reportType, selectedDate]);

  const { start: startDate, end: endDate } = getReportRange();

  const reportData = useMemo(() => {
    const filteredSales = ventas.filter((v) => v.fecha >= startDate && v.fecha < endDate);

    const totalVenta = filteredSales.reduce((sum, v) => sum + v.total_venta, 0);
    const totalCosto = filteredSales.reduce((sum, v) => sum + v.costo_total, 0);
    const totalGanancia = filteredSales.reduce((sum, v) => sum + v.ganancia, 0);

    const efectivo = filteredSales
      .filter((v) => v.forma_pago === 'Efectivo')
      .reduce((sum, v) => sum + v.total_venta, 0);
    const transferencia = filteredSales
      .filter((v) => v.forma_pago === 'Transferencia')
      .reduce((sum, v) => sum + v.total_venta, 0);

    const topProducts = filteredSales.reduce((acc, v) => {
      acc[v.nombre] = (acc[v.nombre] || 0) + v.cantidad;
      return acc;
    }, {} as Record<string, number>);

    return {
      totalVenta,
      totalCosto,
      totalGanancia,
      efectivo,
      transferencia,
      totalTransacciones: filteredSales.length,
      topProducts: Object.entries(topProducts)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 5),
      filteredSales,
    };
  }, [ventas, startDate, endDate]);

  const reportTitle = useMemo(() => {
    const fmt = (date: Date) => date.toLocaleDateString('es-CO');
    switch (reportType) {
      case 'daily':
        return `Reporte Diario: ${fmt(startDate)}`;
      case 'weekly':
        return `Balance Semanal: Del ${fmt(startDate)} al ${fmt(new Date(endDate.getTime() - 1))}`;
      case 'monthly':
        return `Reporte Mensual: ${startDate.toLocaleDateString('es-CO', {
          year: 'numeric',
          month: 'long',
        })}`;
      case 'yearly':
        return `Reporte Anual: ${startDate.getFullYear()}`;
      default:
        return 'Reporte General';
    }
  }, [reportType, startDate, endDate]);

  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-bold text-gray-800">Reportes y Balance Financiero</h2>

      <div className="p-6 bg-white rounded-xl shadow-lg flex flex-wrap gap-4 items-end">
        <div className="flex flex-col">
          <label className="text-sm font-medium text-gray-700 mb-1">Tipo de Reporte</label>
          <select
            value={reportType}
            onChange={(e) => {
              setReportType(e.target.value);
              const now = new Date();
              if (e.target.value === 'monthly') {
                setSelectedDate(now.toISOString().substring(0, 7));
              } else if (e.target.value === 'yearly') {
                setSelectedDate(now.toISOString().substring(0, 4));
              } else {
                setSelectedDate(now.toISOString().substring(0, 10));
              }
            }}
            className="p-2 border rounded-lg"
          >
            <option value="weekly">Balance Semanal (Cruce con Secretaria)</option>
            <option value="daily">Reporte Diario</option>
            <option value="monthly">Reporte Mensual</option>
            <option value="yearly">Reporte Anual</option>
          </select>
        </div>

        <div className="flex flex-col">
          <label className="text-sm font-medium text-gray-700 mb-1">Seleccionar Fecha/Período</label>
          <input
            type={
              reportType === 'monthly' ? 'month' : reportType === 'yearly' ? 'number' : 'date'
            }
            value={
              reportType === 'monthly'
                ? selectedDate.substring(0, 7)
                : reportType === 'yearly'
                ? selectedDate.substring(0, 4)
                : selectedDate
            }
            onChange={(e) => setSelectedDate(e.target.value)}
            min={reportType === 'yearly' ? 2023 : undefined}
            max={reportType === 'yearly' ? new Date().getFullYear() + 1 : undefined}
            className="p-2 border rounded-lg"
          />
        </div>
      </div>

      <div className="p-6 bg-white rounded-xl shadow-2xl space-y-6">
        <h3 className="text-2xl font-bold text-blue-700 border-b pb-2">{reportTitle}</h3>
        <p className="text-sm text-gray-500">
          Período analizado: {startDate.toLocaleDateString('es-CO')} -{' '}
          {endDate.toLocaleDateString('es-CO')}
        </p>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          <StatCard
            title="Total Ventas (Ingreso Bruto)"
            value={formatCurrency(reportData.totalVenta)}
            icon="💵"
            color="bg-green-100 text-green-800"
            textClass="text-green-800"
          />
          <StatCard
            title="Costo Total de Medicamentos (COGS)"
            value={formatCurrency(reportData.totalCosto)}
            icon="📉"
            color="bg-red-100 text-red-800"
            textClass="text-red-800"
          />
          <StatCard
            title="Ganancia Neta del Período"
            value={formatCurrency(reportData.totalGanancia)}
            icon="🚀"
            color="bg-yellow-100 text-yellow-800"
            textClass="text-yellow-800"
          />
        </div>

        <div
          className={`p-6 border-4 rounded-xl ${
            reportType === 'weekly'
              ? 'border-blue-500 bg-blue-50'
              : 'border-gray-200 bg-gray-50'
          }`}
        >
          <h4 className="text-xl font-bold mb-3 text-blue-700">
            Cuadre de Caja y Bancos ({reportType === 'weekly' ? 'CRUCE SEMANAL' : 'Detalle de Pagos'})
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm font-medium text-gray-600">
                Total Recibido en EFECTIVO (Para Secretaría)
              </p>
              <p className="text-3xl font-extrabold text-green-700">
                {formatCurrency(reportData.efectivo)}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">
                Total Recibido por TRANSFERENCIA (Para Cuenta Bancaria)
              </p>
              <p className="text-3xl font-extrabold text-blue-700">
                {formatCurrency(reportData.transferencia)}
              </p>
            </div>
          </div>
          <p className="mt-4 text-sm text-gray-600 font-semibold">
            Suma de Ambos Métodos: {formatCurrency(reportData.efectivo + reportData.transferencia)}{' '}
            (Debe coincidir con Total Ventas).
          </p>
        </div>

        <div className="mt-6">
          <h4 className="text-xl font-bold text-gray-700 mb-3">
            Top 5 Productos Vendidos (Unidades)
          </h4>
          <ol className="list-decimal pl-5 space-y-1">
            {reportData.topProducts.length > 0 ? (
              reportData.topProducts.map(([name, count], index) => (
                <li key={index} className="text-gray-600 font-medium">
                  {name}: <span className="font-bold">{count}</span> unidades
                </li>
              ))
            ) : (
              <p className="text-gray-500 italic">No hay ventas registradas en este período.</p>
            )}
          </ol>
        </div>
      </div>
    </div>
  );
};
