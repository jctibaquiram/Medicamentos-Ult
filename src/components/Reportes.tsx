import { Suspense, lazy, useEffect, useMemo, useState } from 'react';
import { formatCurrency } from '../utils/format';
import type { Venta } from '../types';

type ReportType = 'daily' | 'weekly' | 'monthly' | 'yearly';

interface PeriodRange {
  start: Date;
  end: Date;
}

const ReportesCharts = lazy(() =>
  import('./ReportesCharts').then((module) => ({ default: module.ReportesCharts }))
);

interface ReportesProps {
  ventas: Venta[];
  loading: boolean;
}

const getTodayISO = () => {
  const now = new Date();
  const offsetMs = now.getTimezoneOffset() * 60_000;
  return new Date(now.getTime() - offsetMs).toISOString().slice(0, 10);
};

const getISOWeekString = (date: Date) => {
  const local = new Date(date);
  local.setHours(0, 0, 0, 0);

  const day = local.getDay() || 7;
  local.setDate(local.getDate() + 4 - day);

  const yearStart = new Date(local.getFullYear(), 0, 1);
  const weekNo = Math.ceil((((local.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);

  return `${local.getFullYear()}-W${String(weekNo).padStart(2, '0')}`;
};

const getCurrentWeekInput = () => getISOWeekString(new Date());

const getDefaultPeriodByType = (type: ReportType, baseDate = new Date()) => {
  const now = new Date(baseDate);
  if (type === 'daily') {
    const offsetMs = now.getTimezoneOffset() * 60_000;
    return new Date(now.getTime() - offsetMs).toISOString().slice(0, 10);
  }

  if (type === 'weekly') {
    return getISOWeekString(now);
  }

  if (type === 'monthly') {
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  }

  return String(now.getFullYear());
};

const getStartDateFromWeekInput = (weekInput: string) => {
  const match = /^(\d{4})-W(\d{2})$/.exec(weekInput);
  if (!match) {
    const today = new Date(`${getTodayISO()}T00:00:00`);
    const day = today.getDay() || 7;
    today.setDate(today.getDate() - day + 1);
    today.setHours(0, 0, 0, 0);
    return today;
  }

  const year = Number(match[1]);
  const week = Number(match[2]);
  const januaryFourth = new Date(year, 0, 4);
  const day = januaryFourth.getDay() || 7;
  const weekOneMonday = new Date(januaryFourth);
  weekOneMonday.setDate(januaryFourth.getDate() - day + 1);
  weekOneMonday.setHours(0, 0, 0, 0);

  const start = new Date(weekOneMonday);
  start.setDate(weekOneMonday.getDate() + (week - 1) * 7);
  return start;
};

const getReportRange = (type: ReportType, selectedDate: string): PeriodRange => {
  if (type === 'daily') {
    const fallback = new Date(`${getTodayISO()}T00:00:00`);
    const candidate = new Date(`${selectedDate}T00:00:00`);
    const start = Number.isNaN(candidate.getTime()) ? fallback : candidate;
    start.setHours(0, 0, 0, 0);

    const end = new Date(start);
    end.setDate(start.getDate() + 1);

    return { start, end };
  }

  if (type === 'weekly') {
    const start = getStartDateFromWeekInput(selectedDate);

    const end = new Date(start);
    end.setDate(start.getDate() + 7);

    return { start, end };
  }

  if (type === 'monthly') {
    const [yearRaw, monthRaw] = selectedDate.split('-').map(Number);
    const now = new Date();
    const year = Number.isFinite(yearRaw) ? yearRaw : now.getFullYear();
    const month = Number.isFinite(monthRaw) ? monthRaw : now.getMonth() + 1;
    const start = new Date(year, month - 1, 1);
    const end = new Date(year, month, 1);
    return { start, end };
  }

  const parsedYear = Number(selectedDate);
  const year = Number.isFinite(parsedYear) && parsedYear > 2000 ? parsedYear : new Date().getFullYear();
  const start = new Date(year, 0, 1);
  const end = new Date(year + 1, 0, 1);
  return { start, end };
};

const getPreviousRange = ({ start, end }: PeriodRange): PeriodRange => {
  const span = end.getTime() - start.getTime();
  return {
    start: new Date(start.getTime() - span),
    end: new Date(start.getTime()),
  };
};

const formatPct = (value: number) => `${value.toFixed(1)}%`;

const getVariation = (current: number, previous: number) => {
  if (previous === 0) {
    return current === 0 ? 0 : 100;
  }

  return ((current - previous) / previous) * 100;
};

const summarizeSales = (ventas: Venta[]) => {
  const revenue = ventas.reduce((sum, v) => sum + v.total_venta, 0);
  const cost = ventas.reduce((sum, v) => sum + v.costo_total, 0);
  const profit = ventas.reduce((sum, v) => sum + v.ganancia, 0);
  const units = ventas.reduce((sum, v) => sum + v.cantidad, 0);
  const ticket = ventas.length > 0 ? revenue / ventas.length : 0;
  const margin = revenue > 0 ? (profit / revenue) * 100 : 0;

  const paymentMap = ventas.reduce<Record<string, number>>((acc, venta) => {
    acc[venta.forma_pago] = (acc[venta.forma_pago] ?? 0) + venta.total_venta;
    return acc;
  }, {});

  const products = ventas.reduce<Record<string, { units: number; revenue: number }>>((acc, venta) => {
    if (!acc[venta.nombre]) {
      acc[venta.nombre] = { units: 0, revenue: 0 };
    }

    acc[venta.nombre].units += venta.cantidad;
    acc[venta.nombre].revenue += venta.total_venta;
    return acc;
  }, {});

  const topByUnits = Object.entries(products)
    .map(([name, values]) => ({ name, units: values.units, revenue: values.revenue }))
    .sort((a, b) => b.units - a.units)
    .slice(0, 5);

  const topByRevenue = Object.entries(products)
    .map(([name, values]) => ({ name, units: values.units, revenue: values.revenue }))
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 5);

  return {
    revenue,
    cost,
    profit,
    units,
    transactions: ventas.length,
    ticket,
    margin,
    paymentMap,
    topByUnits,
    topByRevenue,
  };
};

const buildTrend = (ventas: Venta[], reportType: ReportType) => {
  const formatter = reportType === 'yearly'
    ? (date: Date) => date.toLocaleDateString('es-CO', { month: 'short' })
    : (date: Date) => date.toLocaleDateString('es-CO', { day: '2-digit', month: '2-digit' });

  const keyFormatter = reportType === 'yearly'
    ? (date: Date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
    : (date: Date) => date.toISOString().slice(0, 10);

  const grouped = ventas.reduce<Record<string, { label: string; ventas: number; ganancia: number }>>(
    (acc, venta) => {
      const key = keyFormatter(venta.fecha);
      if (!acc[key]) {
        acc[key] = {
          label: formatter(venta.fecha),
          ventas: 0,
          ganancia: 0,
        };
      }

      acc[key].ventas += venta.total_venta;
      acc[key].ganancia += venta.ganancia;
      return acc;
    },
    {}
  );

  return Object.entries(grouped)
    .sort(([a], [b]) => (a < b ? -1 : 1))
    .map(([, value]) => value);
};

const resolveVentaDate = (venta: Venta): Date | null => {
  const parsedFecha = venta.fecha instanceof Date ? new Date(venta.fecha) : new Date(String(venta.fecha));
  if (!Number.isNaN(parsedFecha.getTime())) {
    return parsedFecha;
  }

  if (venta.created_at) {
    const parsedCreatedAt = new Date(venta.created_at);
    if (!Number.isNaN(parsedCreatedAt.getTime())) {
      return parsedCreatedAt;
    }
  }

  return null;
};

const toDayValue = (date: Date) => {
  const normalized = new Date(date);
  normalized.setHours(0, 0, 0, 0);
  return normalized.getTime();
};

const isInReportPeriod = (
  ventaDate: Date,
  reportType: ReportType,
  range: PeriodRange
) => {
  if (reportType === 'daily') {
    return toDayValue(ventaDate) === toDayValue(range.start);
  }

  if (reportType === 'monthly') {
    return (
      ventaDate.getFullYear() === range.start.getFullYear() &&
      ventaDate.getMonth() === range.start.getMonth()
    );
  }

  const start = new Date(range.start);
  start.setHours(0, 0, 0, 0);

  const end = new Date(range.end);
  end.setHours(0, 0, 0, 0);

  const ventaDay = toDayValue(ventaDate);
  return ventaDay >= start.getTime() && ventaDay < end.getTime();
};

export const Reportes = ({ ventas, loading }: ReportesProps) => {
  const [reportType, setReportType] = useState<ReportType>('daily');
  const [selectedDate, setSelectedDate] = useState(getDefaultPeriodByType('daily'));

  const currentRange = useMemo(
    () => getReportRange(reportType, selectedDate),
    [reportType, selectedDate]
  );
  const previousRange = useMemo(() => getPreviousRange(currentRange), [currentRange]);

  const salesWithDate = useMemo(
    () =>
      ventas
        .map((venta) => ({ venta, date: resolveVentaDate(venta) }))
        .filter((entry): entry is { venta: Venta; date: Date } => entry.date !== null),
    [ventas]
  );

  const currentSales = useMemo(
    () =>
      salesWithDate
        .filter((entry) => isInReportPeriod(entry.date, reportType, currentRange))
        .map((entry) => ({ ...entry.venta, fecha: entry.date })),
    [salesWithDate, reportType, currentRange]
  );

  const previousSales = useMemo(
    () =>
      salesWithDate
        .filter((entry) => isInReportPeriod(entry.date, reportType, previousRange))
        .map((entry) => ({ ...entry.venta, fecha: entry.date })),
    [salesWithDate, reportType, previousRange]
  );

  const currentSummary = useMemo(() => summarizeSales(currentSales), [currentSales]);
  const previousSummary = useMemo(() => summarizeSales(previousSales), [previousSales]);

  const trendData = useMemo(
    () => buildTrend(currentSales, reportType),
    [currentSales, reportType]
  );

  const paymentData = useMemo(
    () =>
      Object.entries(currentSummary.paymentMap).map(([name, value]) => ({
        name,
        value,
      })),
    [currentSummary.paymentMap]
  );

  const kpis = useMemo(
    () => [
      {
        title: 'Ingresos del período',
        value: formatCurrency(currentSummary.revenue),
        delta: getVariation(currentSummary.revenue, previousSummary.revenue),
      },
      {
        title: 'Ganancia neta',
        value: formatCurrency(currentSummary.profit),
        delta: getVariation(currentSummary.profit, previousSummary.profit),
      },
      {
        title: 'Margen neto',
        value: formatPct(currentSummary.margin),
        delta: getVariation(currentSummary.margin, previousSummary.margin),
      },
      {
        title: 'Ticket promedio',
        value: formatCurrency(currentSummary.ticket),
        delta: getVariation(currentSummary.ticket, previousSummary.ticket),
      },
    ],
    [currentSummary, previousSummary]
  );

  const reportTitle = useMemo(() => {
    if (reportType === 'daily') {
      return `Reporte diario (${currentRange.start.toLocaleDateString('es-CO')})`;
    }

    if (reportType === 'weekly') {
      return `Balance semanal (${currentRange.start.toLocaleDateString('es-CO')} - ${new Date(
        currentRange.end.getTime() - 1
      ).toLocaleDateString('es-CO')})`;
    }

    if (reportType === 'monthly') {
      return `Reporte mensual (${currentRange.start.toLocaleDateString('es-CO', {
        month: 'long',
        year: 'numeric',
      })})`;
    }

    return `Reporte anual (${currentRange.start.getFullYear()})`;
  }, [reportType, currentRange]);

  const ventasDebug = currentSales;
  const selectedFilterDate = useMemo(() => {
    const normalized = new Date(currentRange.start);
    normalized.setHours(0, 0, 0, 0);
    return normalized.toISOString();
  }, [currentRange.start]);

  const currentDiagnostics = useMemo(
    () => ({
      fetched: ventas.length,
      parsed: salesWithDate.length,
      inRange: currentSales.length,
      firstRawCreatedAt: ventas[0]?.created_at ? String(ventas[0].created_at) : null,
      firstRawFecha: ventas[0]?.fecha ? String(ventas[0].fecha) : null,
    }),
    [ventas, salesWithDate.length, currentSales.length]
  );

  const latestSaleDate = useMemo(() => {
    return salesWithDate[0]?.date ?? null;
  }, [salesWithDate]);

  const insight = useMemo(() => {
    if (currentSummary.transactions === 0) {
      return 'No hay ventas en el período seleccionado. Revisa campañas comerciales o amplitud de fechas.';
    }

    const topProduct = currentSummary.topByRevenue[0];
    const cashShare = currentSummary.revenue > 0
      ? ((currentSummary.paymentMap['Efectivo'] ?? 0) / currentSummary.revenue) * 100
      : 0;

    return `Producto líder: ${topProduct?.name ?? 'N/A'} (${formatCurrency(
      topProduct?.revenue ?? 0
    )}). Participación en efectivo: ${formatPct(cashShare)}. Transacciones: ${currentSummary.transactions}.`;
  }, [currentSummary]);

  useEffect(() => {
    setSelectedDate((current) => {
      const defaultDaily = getDefaultPeriodByType('daily');
      if (current !== defaultDaily || !latestSaleDate) {
        return current;
      }

      return getDefaultPeriodByType('daily', latestSaleDate);
    });
  }, [latestSaleDate]);

  const goToLatestPeriod = () => {
    if (!latestSaleDate) {
      return;
    }

    setSelectedDate(getDefaultPeriodByType(reportType, latestSaleDate));
  };

  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-bold text-neutral-100">Reportes y Analítica Administrativa</h2>

      <div className="p-6 bg-white rounded-xl shadow-lg flex flex-wrap gap-4 items-end">
        <div className="flex flex-col">
          <label className="text-sm font-medium text-gray-700 mb-1">Frecuencia</label>
          <select
            value={reportType}
            onChange={(e) => {
              const next = e.target.value as ReportType;
              setReportType(next);
              setSelectedDate(getDefaultPeriodByType(next, latestSaleDate ?? new Date()));
            }}
            className="p-2 border rounded-lg"
          >
            <option value="daily">Diario</option>
            <option value="weekly">Semanal</option>
            <option value="monthly">Mensual</option>
            <option value="yearly">Anual</option>
          </select>
        </div>

        <div className="flex flex-col">
          <label className="text-sm font-medium text-gray-700 mb-1">
            {reportType === 'daily'
              ? 'Día'
              : reportType === 'weekly'
              ? 'Semana'
              : reportType === 'monthly'
              ? 'Mes'
              : 'Año'}
          </label>
          <input
            type={
              reportType === 'daily'
                ? 'date'
                : reportType === 'weekly'
                ? 'week'
                : reportType === 'monthly'
                ? 'month'
                : 'number'
            }
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            min={reportType === 'yearly' ? 2023 : undefined}
            max={
              reportType === 'daily'
                ? getTodayISO()
                : reportType === 'weekly'
                ? getCurrentWeekInput()
                : reportType === 'yearly'
                ? new Date().getFullYear() + 1
                : undefined
            }
            className="p-2 border rounded-lg"
          />
        </div>

      </div>

      <div className="p-6 bg-white rounded-xl shadow-2xl space-y-6">
        <h3 className="text-2xl font-bold text-blue-700 border-b pb-2">{reportTitle}</h3>

        <div className="rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-xs text-amber-900">
          DEBUG ventas.length: {ventasDebug.length} | ventas[0].created_at: {currentDiagnostics.firstRawCreatedAt ?? 'null'} | ventas[0].fecha: {currentDiagnostics.firstRawFecha ?? 'null'} | filtroFecha(normalizado): {selectedFilterDate} | selectedDate: {selectedDate}
        </div>

        <p className="text-xs text-gray-500 uppercase tracking-wide">
          Ventas visibles para este usuario: {ventas.length}
        </p>

        <p className="text-xs text-gray-500 uppercase tracking-wide">
          Consultadas: {currentDiagnostics.fetched} | Fechas válidas: {currentDiagnostics.parsed} | En rango actual: {currentDiagnostics.inRange}
        </p>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((item) => (
              <div key={item} className="h-24 rounded-xl bg-gray-100 animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {kpis.map((kpi) => (
              <div key={kpi.title} className="rounded-xl border border-gray-200 bg-gray-50 p-4">
                <p className="text-xs uppercase tracking-wide text-gray-500">{kpi.title}</p>
                <p className="mt-2 text-2xl font-bold text-gray-800">{kpi.value}</p>
                <p className={`mt-1 text-sm ${kpi.delta >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                  {kpi.delta >= 0 ? '▲' : '▼'} {formatPct(Math.abs(kpi.delta))} vs período anterior
                </p>
              </div>
            ))}
          </div>
        )}

        {!loading && currentSummary.transactions === 0 && (
          <div className="rounded-xl border border-blue-200 bg-blue-50 p-4 text-blue-800">
            <p className="font-medium">No hay ventas en el período seleccionado.</p>
            <p className="mt-1 text-sm">
              Cambia el período para visualizar los datos disponibles.
            </p>
            {ventas.length === 0 && (
              <p className="mt-2 text-sm font-medium text-rose-700">
                No hay ventas visibles en la base para este usuario/rol actualmente.
              </p>
            )}
            {latestSaleDate && (
              <button
                type="button"
                onClick={goToLatestPeriod}
                className="mt-3 rounded-lg bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700"
              >
                Ir al último período con ventas
              </button>
            )}
          </div>
        )}

        <Suspense
          fallback={
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
              <div className="xl:col-span-2 h-80 rounded-xl bg-gray-100 animate-pulse" />
              <div className="h-80 rounded-xl bg-gray-100 animate-pulse" />
              <div className="xl:col-span-3 h-80 rounded-xl bg-gray-100 animate-pulse" />
            </div>
          }
        >
          <ReportesCharts
            trendData={trendData}
            paymentData={paymentData}
            topByRevenue={currentSummary.topByRevenue}
            topByUnits={currentSummary.topByUnits}
          />
        </Suspense>

        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
          <p className="text-sm font-semibold text-amber-900">Resumen ejecutivo</p>
          <p className="mt-2 text-sm text-amber-800">{insight}</p>
          <p className="mt-2 text-xs text-amber-700">
            Costo del período: {formatCurrency(currentSummary.cost)} | Unidades vendidas: {currentSummary.units}
          </p>
        </div>
      </div>
    </div>
  );
};
