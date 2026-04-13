import { useState, useCallback, useMemo } from 'react';
import { StatCard } from './StatCard';
import { formatCurrency } from '../utils/format';
import type { Venta } from '../types';
import { DollarSign, TrendingDown, TrendingUp, Banknote, CreditCard, Trophy } from 'lucide-react';

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
    const fmt = (date: Date) => date.toLocaleDateString('es-CO', { day: '2-digit', month: 'short' });
    switch (reportType) {
      case 'daily':
        return `Reporte Diario: ${fmt(startDate)}`;
      case 'weekly':
        return `Balance Semanal: ${fmt(startDate)} - ${fmt(new Date(endDate.getTime() - 1))}`;
      case 'monthly':
        return startDate.toLocaleDateString('es-CO', { year: 'numeric', month: 'long' });
      case 'yearly':
        return `Año ${startDate.getFullYear()}`;
      default:
        return 'Reporte';
    }
  }, [reportType, startDate, endDate]);

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold text-neutral-100 tracking-tight">Reportes</h2>

      {/* Controles */}
      <div className="card-dark flex flex-wrap items-end gap-4">
        <div>
          <label className="block text-xs text-neutral-500 mb-1.5">Tipo</label>
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
            className="input-dark w-48"
          >
            <option value="weekly">Semanal</option>
            <option value="daily">Diario</option>
            <option value="monthly">Mensual</option>
            <option value="yearly">Anual</option>
          </select>
        </div>

        <div>
          <label className="block text-xs text-neutral-500 mb-1.5">Período</label>
          <input
            type={reportType === 'monthly' ? 'month' : reportType === 'yearly' ? 'number' : 'date'}
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
            className="input-dark"
          />
        </div>
      </div>

      {/* Resumen */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium text-neutral-400">{reportTitle}</h3>
          <span className="text-xs text-neutral-600">
            {reportData.totalTransacciones} transacciones
          </span>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <StatCard
            title="Ventas Brutas"
            value={formatCurrency(reportData.totalVenta)}
            icon={<DollarSign size={16} className="text-emerald-400" />}
            color="bg-emerald-950/40 border-emerald-900/50"
          />
          <StatCard
            title="Costo (COGS)"
            value={formatCurrency(reportData.totalCosto)}
            icon={<TrendingDown size={16} className="text-red-400" />}
            color="bg-red-950/40 border-red-900/50"
          />
          <StatCard
            title="Ganancia Neta"
            value={formatCurrency(reportData.totalGanancia)}
            icon={<TrendingUp size={16} className="text-amber-400" />}
            color="bg-amber-950/40 border-amber-900/50"
          />
        </div>

        {/* Cuadre de caja */}
        <div className={`card-dark ${reportType === 'weekly' ? 'ring-1 ring-blue-800' : ''}`}>
          <h4 className="text-sm font-medium text-neutral-300 mb-4">
            Cuadre de Caja {reportType === 'weekly' && '(Cruce Semanal)'}
          </h4>
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded bg-emerald-950/50">
                <Banknote size={18} className="text-emerald-400" />
              </div>
              <div>
                <p className="text-xs text-neutral-500">Efectivo</p>
                <p className="text-lg font-semibold text-emerald-400 tabular-nums">
                  {formatCurrency(reportData.efectivo)}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded bg-blue-950/50">
                <CreditCard size={18} className="text-blue-400" />
              </div>
              <div>
                <p className="text-xs text-neutral-500">Transferencia</p>
                <p className="text-lg font-semibold text-blue-400 tabular-nums">
                  {formatCurrency(reportData.transferencia)}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Top productos */}
        <div className="card-dark">
          <div className="flex items-center gap-2 mb-3">
            <Trophy size={14} className="text-amber-400" />
            <h4 className="text-sm font-medium text-neutral-300">Top 5 Productos</h4>
          </div>
          {reportData.topProducts.length > 0 ? (
            <div className="space-y-2">
              {reportData.topProducts.map(([name, count], index) => (
                <div key={index} className="flex items-center justify-between">
                  <span className="text-sm text-neutral-400">
                    <span className="text-neutral-600 mr-2">{index + 1}.</span>
                    {name}
                  </span>
                  <span className="text-sm font-medium text-neutral-200 tabular-nums">
                    {count} uds
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-neutral-500">Sin ventas en este período.</p>
          )}
        </div>
      </div>
    </div>
  );
};
