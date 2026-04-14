import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { formatCurrency } from '../utils/format';

interface TrendPoint {
  label: string;
  ventas: number;
  ganancia: number;
}

interface PaymentPoint {
  name: string;
  value: number;
}

interface ProductPoint {
  name: string;
  units: number;
  revenue: number;
}

interface ReportesChartsProps {
  trendData: TrendPoint[];
  paymentData: PaymentPoint[];
  topByRevenue: ProductPoint[];
  topByUnits: ProductPoint[];
}

const PAYMENT_COLORS = ['#16a34a', '#2563eb', '#f59e0b', '#6d28d9'];

const tooltipCurrency = (value: number | string) => formatCurrency(Number(value) || 0);

export const ReportesCharts = ({
  trendData,
  paymentData,
  topByRevenue,
  topByUnits,
}: ReportesChartsProps) => {
  const hasTrendData = trendData.length > 0;
  const hasPaymentData = paymentData.length > 0;
  const hasRevenueProducts = topByRevenue.length > 0;
  const hasUnitProducts = topByUnits.length > 0;

  return (
    <>
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2 rounded-xl border border-gray-200 p-4">
          <p className="text-sm font-semibold text-gray-700 mb-3">Tendencia de ventas y ganancia</p>
          <div className="h-72">
            {hasTrendData ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={trendData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="label" />
                  <YAxis />
                  <Tooltip formatter={tooltipCurrency} />
                  <Legend />
                  <Area type="monotone" dataKey="ventas" stroke="#2563eb" fill="#93c5fd" name="Ventas" />
                  <Area type="monotone" dataKey="ganancia" stroke="#16a34a" fill="#86efac" name="Ganancia" />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full w-full rounded-lg border border-dashed border-gray-300 flex items-center justify-center text-sm text-gray-500">
                Sin datos de tendencia para este período.
              </div>
            )}
          </div>
        </div>

        <div className="rounded-xl border border-gray-200 p-4">
          <p className="text-sm font-semibold text-gray-700 mb-3">Distribución por forma de pago</p>
          <div className="h-72">
            {hasPaymentData ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={paymentData} dataKey="value" nameKey="name" outerRadius={100} label>
                    {paymentData.map((entry, index) => (
                      <Cell key={`${entry.name}-${index}`} fill={PAYMENT_COLORS[index % PAYMENT_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={tooltipCurrency} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full w-full rounded-lg border border-dashed border-gray-300 flex items-center justify-center text-sm text-gray-500">
                Sin pagos registrados para este período.
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <div className="rounded-xl border border-gray-200 p-4">
          <p className="text-sm font-semibold text-gray-700 mb-3">Top productos por ingresos</p>
          <div className="h-72">
            {hasRevenueProducts ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={topByRevenue} layout="vertical" margin={{ left: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" />
                  <YAxis dataKey="name" type="category" width={140} />
                  <Tooltip formatter={tooltipCurrency} />
                  <Bar dataKey="revenue" fill="#2563eb" name="Ingresos" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full w-full rounded-lg border border-dashed border-gray-300 flex items-center justify-center text-sm text-gray-500">
                Sin productos vendidos en este período.
              </div>
            )}
          </div>
        </div>

        <div className="rounded-xl border border-gray-200 p-4">
          <p className="text-sm font-semibold text-gray-700 mb-3">Top productos por unidades</p>
          <div className="h-72">
            {hasUnitProducts ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={topByUnits} layout="vertical" margin={{ left: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" />
                  <YAxis dataKey="name" type="category" width={140} />
                  <Tooltip />
                  <Bar dataKey="units" fill="#16a34a" name="Unidades" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full w-full rounded-lg border border-dashed border-gray-300 flex items-center justify-center text-sm text-gray-500">
                Sin unidades vendidas en este período.
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};
