import { useState, useMemo } from 'react';
import { supabase } from '../lib/supabase';
import { formatCurrency } from '../utils/format';
import { useAuth } from '../contexts/AuthContext';
import type { Medicamento } from '../types';
import { ShoppingCart, CreditCard, Banknote } from 'lucide-react';

interface RegistroVentasProps {
  medicamentos: Medicamento[];
  showMessage: (msg: string) => void;
}

export const RegistroVentas = ({ medicamentos, showMessage }: RegistroVentasProps) => {
  const { user } = useAuth();
  const [selectedMed, setSelectedMed] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [paymentMethod, setPaymentMethod] = useState('Efectivo');
  const [isSaving, setIsSaving] = useState(false);

  const medInfo = useMemo(
    () => medicamentos.find((m) => m.id === selectedMed),
    [selectedMed, medicamentos]
  );
  const totalSale = medInfo ? medInfo.precio * quantity : 0;
  const estimatedProfit = medInfo ? (medInfo.precio - medInfo.costo) * quantity : 0;

  const handleSale = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!medInfo || quantity <= 0) {
      showMessage('Seleccione un medicamento y cantidad válida.');
      return;
    }
    if (medInfo.stock < quantity) {
      showMessage(`Stock insuficiente. Disponible: ${medInfo.stock} unidades.`);
      return;
    }

    setIsSaving(true);
    try {
      const costPerUnit = medInfo.costo;
      const pricePerUnit = medInfo.precio;

      const { error: ventaError } = await supabase.from('ventas').insert({
        medicamento_id: medInfo.id,
        nombre: medInfo.nombre,
        lab: medInfo.lab,
        cantidad: quantity,
        precio_unitario: pricePerUnit,
        costo_unitario: costPerUnit,
        total_venta: totalSale,
        costo_total: costPerUnit * quantity,
        ganancia: estimatedProfit,
        forma_pago: paymentMethod,
        registrado_por: user?.id || null,
      });

      if (ventaError) throw ventaError;

      const { error: stockError } = await supabase
        .from('medicamentos')
        .update({ stock: medInfo.stock - quantity })
        .eq('id', medInfo.id);

      if (stockError) throw stockError;

      showMessage(`Venta registrada: ${quantity}x ${medInfo.nombre} - ${formatCurrency(totalSale)}`);

      setSelectedMed('');
      setQuantity(1);
      setPaymentMethod('Efectivo');
    } catch (error) {
      console.error('Error al registrar venta:', error);
      showMessage('Error al registrar la venta.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold text-neutral-100 tracking-tight">Registrar Venta</h2>

      <div className="max-w-md">
        <form onSubmit={handleSale} className="card-dark space-y-4">
          <div>
            <label className="block text-xs text-neutral-500 mb-1.5">Medicamento</label>
            <select
              value={selectedMed}
              onChange={(e) => setSelectedMed(e.target.value)}
              className="input-dark"
              required
            >
              <option value="">Seleccionar medicamento</option>
              {medicamentos.map((m) => (
                <option key={m.id} value={m.id} disabled={m.stock <= 0}>
                  {m.nombre} ({m.lab}) - {formatCurrency(m.precio)} [{m.stock} disp.]
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-neutral-500 mb-1.5">Cantidad</label>
              <input
                type="number"
                min={1}
                value={quantity}
                onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
                className="input-dark"
                required
              />
            </div>
            <div>
              <label className="block text-xs text-neutral-500 mb-1.5">Forma de Pago</label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setPaymentMethod('Efectivo')}
                  className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium rounded border transition-colors ${
                    paymentMethod === 'Efectivo'
                      ? 'bg-emerald-950/50 border-emerald-700 text-emerald-400'
                      : 'bg-neutral-800 border-neutral-700 text-neutral-400 hover:border-neutral-600'
                  }`}
                >
                  <Banknote size={14} />
                  Efectivo
                </button>
                <button
                  type="button"
                  onClick={() => setPaymentMethod('Transferencia')}
                  className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium rounded border transition-colors ${
                    paymentMethod === 'Transferencia'
                      ? 'bg-blue-950/50 border-blue-700 text-blue-400'
                      : 'bg-neutral-800 border-neutral-700 text-neutral-400 hover:border-neutral-600'
                  }`}
                >
                  <CreditCard size={14} />
                  Transfer
                </button>
              </div>
            </div>
          </div>

          {medInfo && (
            <div className="p-4 rounded-lg bg-neutral-800/50 border border-neutral-700">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-neutral-500">Total</span>
                <span className="text-2xl font-semibold text-emerald-400 tabular-nums">
                  {formatCurrency(totalSale)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-neutral-500">Ganancia</span>
                <span className="text-sm font-medium text-amber-400 tabular-nums">
                  +{formatCurrency(estimatedProfit)}
                </span>
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={isSaving || !medInfo || quantity <= 0 || (medInfo && medInfo.stock < quantity)}
            className={`w-full flex items-center justify-center gap-2 py-2.5 text-sm font-medium rounded transition-colors ${
              isSaving || !medInfo || (medInfo && medInfo.stock < quantity)
                ? 'bg-neutral-700 text-neutral-500 cursor-not-allowed'
                : 'bg-emerald-600 text-white hover:bg-emerald-500'
            }`}
          >
            <ShoppingCart size={16} />
            {isSaving ? 'Registrando...' : 'Confirmar Venta'}
          </button>
        </form>
      </div>
    </div>
  );
};
