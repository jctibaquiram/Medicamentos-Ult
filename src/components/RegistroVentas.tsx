import { useState, useMemo } from 'react';
import { InputField } from './InputField';
import { formatCurrency } from '../utils/format';
import { useAuth } from '../contexts/AuthContext';
import { useMedicamentos } from '../hooks/useMedicamentos';
import type { CreateVentaInput } from '../hooks/useVentas';
import { useMessage } from '../hooks/useMessage';
import type { Venta } from '../types';

const getTodayForInput = () => {
  const now = new Date();
  const offsetMs = now.getTimezoneOffset() * 60_000;
  return new Date(now.getTime() - offsetMs).toISOString().slice(0, 10);
};

interface RegistroVentasProps {
  ventas: Venta[];
  loadingVentas: boolean;
  optimisticStock: Record<string, number>;
  createVenta: (input: CreateVentaInput) => Promise<{ ok: boolean; message: string }>;
  deleteVenta: (venta: Venta) => Promise<{ ok: boolean; message: string }>;
}

export const RegistroVentas = ({
  ventas,
  loadingVentas,
  optimisticStock,
  createVenta,
  deleteVenta,
}: RegistroVentasProps) => {
  const { user, role } = useAuth();
  const { medicamentos, loading } = useMedicamentos();
  const { message, showMessage } = useMessage();
  const [selectedMed, setSelectedMed] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [saleDate, setSaleDate] = useState(getTodayForInput());
  const [paymentMethod, setPaymentMethod] = useState('Efectivo');
  const [isSaving, setIsSaving] = useState(false);
  const [deletingSaleId, setDeletingSaleId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const medInfo = useMemo(
    () => medicamentos.find((m) => m.id === selectedMed),
    [selectedMed, medicamentos]
  );
  const effectiveStock = medInfo
    ? optimisticStock[medInfo.id] ?? medInfo.stock
    : 0;
  const totalSale = medInfo ? medInfo.precio * quantity : 0;
  const estimatedProfit = medInfo ? (medInfo.precio - medInfo.costo) * quantity : 0;
  const recentVentas = useMemo(() => ventas.slice(0, 20), [ventas]);

  const handleSale = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      showMessage('Tu sesión no está lista. Cierra sesión e ingresa nuevamente.');
      return;
    }

    if (!medInfo || quantity <= 0) {
      showMessage('Por favor, seleccione un medicamento y una cantidad válida.');
      return;
    }

    if (!saleDate) {
      showMessage('Selecciona una fecha válida para la venta.');
      return;
    }

    if (saleDate > getTodayForInput()) {
      showMessage('La fecha de la venta no puede ser posterior a hoy.');
      return;
    }

    if (quantity > effectiveStock) {
      showMessage(`Stock insuficiente. Solo quedan ${effectiveStock} unidades de ${medInfo.nombre}.`);
      return;
    }

    setIsSaving(true);
    try {
      const result = await createVenta({
        medicamentoId: medInfo.id,
        nombre: medInfo.nombre,
        lab: medInfo.lab,
        cantidad: quantity,
        precioUnitario: medInfo.precio,
        costoUnitario: medInfo.costo,
        formaPago: paymentMethod,
        fecha: saleDate,
        registradoPor: user.id,
        stockDisponible: effectiveStock,
      });

      if (!result.ok) {
        showMessage(result.message);
        return;
      }

      showMessage(
        `Venta de ${quantity} x ${medInfo.nombre} registrada. Total: ${formatCurrency(totalSale)}`
      );

      setSelectedMed('');
      setQuantity(1);
      setSaleDate(getTodayForInput());
      setPaymentMethod('Efectivo');
    } catch (error) {
      console.error('Error al registrar venta:', error);
      const detail =
        typeof error === 'object' && error !== null && 'message' in error
          ? String((error as { message?: string }).message)
          : 'Error al registrar la venta.';
      showMessage(detail);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteVenta = async (venta: Venta) => {
    setDeletingSaleId(venta.id);
    const result = await deleteVenta(venta);
    setDeletingSaleId(null);
    setConfirmDeleteId(null);
    showMessage(result.message);
  };

  return (
    <div className="space-y-6">
      {message && (
        <div className="fixed top-6 right-6 z-[100] px-5 py-3 bg-neutral-900 border border-neutral-800 rounded-lg text-sm text-neutral-200 shadow-2xl animate-in fade-in slide-in-from-top-4 duration-300">
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
            {message}
          </div>
        </div>
      )}

      {loading ? (
        <div className="min-h-[60vh] w-full flex items-center justify-center bg-neutral-950 rounded-xl">
          <div className="flex flex-col items-center gap-4">
            <div className="w-8 h-8 border-2 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin" />
            <p className="text-xs text-neutral-500 uppercase tracking-[0.2em] font-medium">
              Cargando módulo de ventas
            </p>
          </div>
        </div>
      ) : (
        <>
      <h2 className="text-3xl font-bold text-neutral-100">Registrar Venta</h2>

      <form onSubmit={handleSale} className="p-6 bg-white rounded-xl shadow-lg space-y-4 max-w-lg mx-auto">
        <div>
          <label htmlFor="med-select" className="block text-sm font-medium text-gray-700">
            Medicamento
          </label>
          <select
            id="med-select"
            value={selectedMed}
            onChange={(e) => setSelectedMed(e.target.value)}
            className="block w-full px-3 py-2 mt-1 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            required
          >
            <option value="">-- Seleccione un medicamento --</option>
            {medicamentos.map((m) => (
              <option
                key={m.id}
                value={m.id}
                disabled={(optimisticStock[m.id] ?? m.stock) <= 0}
              >
                {m.nombre} ({m.lab}) - {formatCurrency(m.precio)} (Stock: {optimisticStock[m.id] ?? m.stock})
              </option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <InputField
            label="Cantidad"
            name="quantity"
            type="number"
            value={quantity}
            onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
            required
          />
          <div>
            <label htmlFor="payment-method" className="block text-sm font-medium text-gray-700">
              Forma de Pago
            </label>
            <select
              id="payment-method"
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value)}
              className="block w-full px-3 py-2 mt-1 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              required
            >
              <option value="Efectivo">Efectivo</option>
              <option value="Transferencia">Transferencia</option>
            </select>
          </div>
        </div>

        <div>
          <label htmlFor="sale-date" className="block text-sm font-medium text-gray-700">
            Fecha de la venta
          </label>
          <input
            id="sale-date"
            type="date"
            value={saleDate}
            max={getTodayForInput()}
            onChange={(e) => setSaleDate(e.target.value)}
            className="block w-full px-3 py-2 mt-1 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            required
          />
        </div>

        {medInfo && (
          <div className="p-4 mt-4 text-center bg-blue-50 rounded-lg">
            <p className="text-lg font-semibold text-gray-700">Resumen:</p>
            <p className="text-3xl font-bold text-blue-600">{formatCurrency(totalSale)}</p>
            <p className="text-sm text-gray-500">Ganancia Estimada: {formatCurrency(estimatedProfit)}</p>
          </div>
        )}

        <button
          type="submit"
          disabled={isSaving || !medInfo || quantity <= 0 || effectiveStock < quantity}
          className={`w-full py-3 text-white font-bold rounded-lg shadow-md transition duration-150 ${
            isSaving || !medInfo || effectiveStock < quantity
              ? 'bg-gray-400 cursor-not-allowed'
              : 'bg-green-600 hover:bg-green-700'
          }`}
        >
          {isSaving ? 'Registrando...' : 'Confirmar Venta'}
        </button>
      </form>

      <section className="max-w-6xl mx-auto mt-8 rounded-xl border border-neutral-800 bg-neutral-900/70 p-4 md:p-6">
        <div className="flex items-center justify-between gap-3 mb-4">
          <h3 className="text-lg font-semibold text-neutral-100">Historial de ventas recientes</h3>
          <span className="text-xs uppercase tracking-wide text-neutral-500">
            {loadingVentas ? 'Cargando ventas...' : `${ventas.length} ventas visibles`}
          </span>
        </div>

        {loadingVentas ? (
          <div className="h-28 rounded-lg border border-neutral-800 bg-neutral-950 animate-pulse" />
        ) : recentVentas.length === 0 ? (
          <div className="rounded-lg border border-neutral-800 bg-neutral-950 p-4 text-sm text-neutral-400">
            Aún no hay ventas registradas.
          </div>
        ) : (
          <div className="overflow-x-auto rounded-lg border border-neutral-800">
            <table className="min-w-full text-sm text-neutral-200">
              <thead className="bg-neutral-950">
                <tr className="text-left text-xs uppercase tracking-wide text-neutral-500">
                  <th className="px-3 py-2">Fecha</th>
                  <th className="px-3 py-2">Producto</th>
                  <th className="px-3 py-2">Cantidad</th>
                  <th className="px-3 py-2">Pago</th>
                  <th className="px-3 py-2">Total</th>
                  <th className="px-3 py-2 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-800 bg-neutral-900/60">
                {recentVentas.map((venta) => {
                  const isConfirmingDelete = confirmDeleteId === venta.id;
                  return (
                    <tr key={venta.id} className="align-top">
                      <td className="px-3 py-3 text-neutral-400 whitespace-nowrap">
                        {venta.fecha.toLocaleDateString('es-CO')}
                      </td>
                      <td className="px-3 py-3 min-w-[220px]">
                        <span className="font-medium text-neutral-100">{venta.nombre}</span>
                      </td>
                      <td className="px-3 py-3">
                        <span>{venta.cantidad}</span>
                      </td>
                      <td className="px-3 py-3 min-w-[160px]">
                        <span>{venta.forma_pago}</span>
                      </td>
                      <td className="px-3 py-3 font-semibold text-neutral-100">
                        {formatCurrency(venta.total_venta)}
                      </td>
                      <td className="px-3 py-3">
                        {isConfirmingDelete ? (
                          <div className="flex justify-end items-center gap-2">
                            <span className="text-xs text-red-400">
                              ¿Estás seguro de eliminar esta venta? El stock se devolverá al inventario automáticamente.
                            </span>
                            <button
                              type="button"
                              onClick={() => handleDeleteVenta(venta)}
                              disabled={deletingSaleId === venta.id}
                              className="rounded-md border border-red-500 bg-red-500/10 px-3 py-1.5 text-xs font-medium text-red-500 hover:bg-red-500/20 disabled:opacity-60"
                            >
                              {deletingSaleId === venta.id ? 'Eliminando...' : 'Sí, eliminar'}
                            </button>
                            <button
                              type="button"
                              onClick={() => setConfirmDeleteId(null)}
                              className="rounded-md border border-neutral-700 px-3 py-1.5 text-xs font-medium text-neutral-300 hover:bg-neutral-800"
                            >
                              No
                            </button>
                          </div>
                        ) : (
                          <div className="flex justify-end gap-2">
                            {(role === 'admin' || role === 'empleado') && (
                              <button
                                type="button"
                                onClick={() => setConfirmDeleteId(venta.id)}
                                className="rounded-md border border-red-500 bg-red-500/10 px-3 py-1.5 text-xs font-medium text-red-500 hover:bg-red-500/20"
                              >
                                Eliminar
                              </button>
                            )}
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
        </>
      )}
    </div>
  );
};
