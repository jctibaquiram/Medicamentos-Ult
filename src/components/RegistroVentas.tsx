import { useState, useMemo } from 'react';
import { supabase } from '../lib/supabase';
import { InputField } from './InputField';
import { formatCurrency } from '../utils/format';
import { useAuth } from '../contexts/AuthContext';
import type { Medicamento } from '../types';

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
      showMessage('Por favor, seleccione un medicamento y una cantidad válida.');
      return;
    }
    if (medInfo.stock < quantity) {
      showMessage(`Stock insuficiente. Solo quedan ${medInfo.stock} unidades de ${medInfo.nombre}.`);
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

      showMessage(
        `Venta de ${quantity} x ${medInfo.nombre} registrada. Total: ${formatCurrency(totalSale)}`
      );

      setSelectedMed('');
      setQuantity(1);
      setPaymentMethod('Efectivo');
    } catch (error) {
      console.error('Error al registrar venta:', error);
      showMessage('Error al registrar la venta. Revise la consola.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-bold text-gray-800">Registrar Venta</h2>

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
              <option key={m.id} value={m.id} disabled={m.stock <= 0}>
                {m.nombre} ({m.lab}) - {formatCurrency(m.precio)} (Stock: {m.stock})
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

        {medInfo && (
          <div className="p-4 mt-4 text-center bg-blue-50 rounded-lg">
            <p className="text-lg font-semibold text-gray-700">Resumen:</p>
            <p className="text-3xl font-bold text-blue-600">{formatCurrency(totalSale)}</p>
            <p className="text-sm text-gray-500">Ganancia Estimada: {formatCurrency(estimatedProfit)}</p>
          </div>
        )}

        <button
          type="submit"
          disabled={isSaving || !medInfo || quantity <= 0 || medInfo.stock < quantity}
          className={`w-full py-3 text-white font-bold rounded-lg shadow-md transition duration-150 ${
            isSaving || !medInfo || medInfo.stock < quantity
              ? 'bg-gray-400 cursor-not-allowed'
              : 'bg-green-600 hover:bg-green-700'
          }`}
        >
          {isSaving ? 'Registrando...' : 'Confirmar Venta'}
        </button>
      </form>
    </div>
  );
};
