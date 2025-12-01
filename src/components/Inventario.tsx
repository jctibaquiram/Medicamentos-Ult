import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { InputField } from './InputField';
import { formatCurrency } from '../utils/format';
import type { Medicamento } from '../types';

interface InventarioProps {
  medicamentos: Medicamento[];
  showMessage: (msg: string) => void;
}

export const Inventario = ({ medicamentos, showMessage }: InventarioProps) => {
  const [search, setSearch] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [newStock, setNewStock] = useState({
    id: '',
    nombre: '',
    lab: '',
    contenido: 'Gotas',
    costo: 0,
    precio: 0,
    stock: 0,
    min_stock: 5,
  });
  const [editItem, setEditItem] = useState<Medicamento | null>(null);

  const filteredMedicamentos = medicamentos.filter(
    (m) =>
      m.nombre.toLowerCase().includes(search.toLowerCase()) ||
      m.lab.toLowerCase().includes(search.toLowerCase())
  );

  const handleAddStock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newStock.stock <= 0) {
      showMessage('La cantidad de stock a añadir debe ser positiva.');
      return;
    }

    try {
      const { data: existingItem } = await supabase
        .from('medicamentos')
        .select('*')
        .eq('id', newStock.id)
        .maybeSingle();

      if (existingItem) {
        const newStockQty = existingItem.stock + newStock.stock;
        const { error } = await supabase
          .from('medicamentos')
          .update({
            stock: newStockQty,
            costo: newStock.costo,
            precio: newStock.precio,
            min_stock: newStock.min_stock,
          })
          .eq('id', newStock.id);

        if (error) throw error;
        showMessage(`Stock de ${newStock.nombre} actualizado a ${newStockQty}.`);
      } else {
        const { error } = await supabase.from('medicamentos').insert(newStock);
        if (error) throw error;
        showMessage(`Nuevo medicamento ${newStock.nombre} añadido al inventario.`);
      }

      setIsAdding(false);
      setNewStock({
        id: '',
        nombre: '',
        lab: '',
        contenido: 'Gotas',
        costo: 0,
        precio: 0,
        stock: 0,
        min_stock: 5,
      });
    } catch (error) {
      console.error('Error al añadir stock:', error);
      showMessage('Error al guardar el inventario. Revise la consola.');
    }
  };

  const handleUpdateStock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editItem) return;

    try {
      const { error } = await supabase
        .from('medicamentos')
        .update({
          stock: editItem.stock,
          costo: editItem.costo,
          precio: editItem.precio,
          min_stock: editItem.min_stock,
        })
        .eq('id', editItem.id);

      if (error) throw error;
      showMessage(`Medicamento ${editItem.nombre} actualizado.`);
      setEditItem(null);
    } catch (error) {
      console.error('Error al actualizar stock:', error);
      showMessage('Error al actualizar el inventario. Revise la consola.');
    }
  };

  const RenderItem = ({ item }: { item: Medicamento }) => {
    const isLow = item.stock < item.min_stock;

    if (editItem && editItem.id === item.id) {
      return (
        <tr key={item.id} className="bg-yellow-50">
          <td className="p-3 font-semibold text-gray-800">{item.nombre}</td>
          <td className="p-3">
            <input
              type="number"
              value={editItem.stock}
              onChange={(e) => setEditItem({ ...editItem, stock: parseInt(e.target.value) || 0 })}
              className="w-20 p-1 text-sm border rounded"
            />
          </td>
          <td className="p-3">
            <input
              type="number"
              value={editItem.costo}
              onChange={(e) => setEditItem({ ...editItem, costo: parseInt(e.target.value) || 0 })}
              className="w-24 p-1 text-sm border rounded"
            />
          </td>
          <td className="p-3">
            <input
              type="number"
              value={editItem.precio}
              onChange={(e) => setEditItem({ ...editItem, precio: parseInt(e.target.value) || 0 })}
              className="w-24 p-1 text-sm border rounded"
            />
          </td>
          <td className="p-3">
            <input
              type="number"
              value={editItem.min_stock}
              onChange={(e) => setEditItem({ ...editItem, min_stock: parseInt(e.target.value) || 0 })}
              className="w-20 p-1 text-sm border rounded"
            />
          </td>
          <td className="p-3">
            <button
              onClick={handleUpdateStock}
              className="px-3 py-1 text-xs font-bold text-white bg-green-500 rounded hover:bg-green-600 mr-2"
            >
              Guardar
            </button>
            <button
              onClick={() => setEditItem(null)}
              className="px-3 py-1 text-xs font-bold text-gray-700 bg-gray-200 rounded hover:bg-gray-300"
            >
              Cancelar
            </button>
          </td>
        </tr>
      );
    }

    return (
      <tr key={item.id} className={isLow ? 'bg-red-50 hover:bg-red-100' : 'hover:bg-gray-50'}>
        <td className="p-3 font-semibold text-gray-800">{item.nombre}</td>
        <td className="p-3">{item.lab}</td>
        <td className={`p-3 font-bold ${isLow ? 'text-red-600' : 'text-green-600'}`}>
          {item.stock} {isLow && '🚨'}
        </td>
        <td className="p-3">{formatCurrency(item.costo)}</td>
        <td className="p-3">{formatCurrency(item.precio)}</td>
        <td className="p-3">{item.min_stock}</td>
        <td className="p-3">
          <button
            onClick={() => setEditItem({ ...item })}
            className="px-3 py-1 text-xs font-bold text-white bg-blue-500 rounded hover:bg-blue-600"
          >
            Editar
          </button>
        </td>
      </tr>
    );
  };

  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-bold text-gray-800">Gestión de Inventario</h2>

      <button
        onClick={() => setIsAdding(!isAdding)}
        className="px-6 py-2 text-white bg-blue-600 rounded-lg shadow-md hover:bg-blue-700 transition duration-150"
      >
        {isAdding ? '❌ Cerrar Formulario' : '➕ Registrar Compra de Stock'}
      </button>

      {isAdding && (
        <form
          onSubmit={handleAddStock}
          className="p-6 mt-4 bg-white border border-gray-200 rounded-xl shadow-lg grid grid-cols-1 md:grid-cols-3 gap-4"
        >
          <h3 className="col-span-full text-xl font-semibold mb-2">
            Registro de Compra de Inventario
          </h3>
          <InputField
            label="ID/SKU (Único)"
            name="id"
            value={newStock.id}
            onChange={(e) => setNewStock({ ...newStock, id: e.target.value })}
            required
          />
          <InputField
            label="Nombre de Medicamento"
            name="nombre"
            value={newStock.nombre}
            onChange={(e) => setNewStock({ ...newStock, nombre: e.target.value })}
            required
          />
          <InputField
            label="Laboratorio"
            name="lab"
            value={newStock.lab}
            onChange={(e) => setNewStock({ ...newStock, lab: e.target.value })}
            required
          />
          <InputField
            label="Costo (Precio Médico)"
            name="costo"
            type="number"
            value={newStock.costo}
            onChange={(e) => setNewStock({ ...newStock, costo: parseInt(e.target.value) || 0 })}
            required
          />
          <InputField
            label="Precio Venta (Público)"
            name="precio"
            type="number"
            value={newStock.precio}
            onChange={(e) => setNewStock({ ...newStock, precio: parseInt(e.target.value) || 0 })}
            required
          />
          <InputField
            label="Cantidad Comprada (Stock a Añadir)"
            name="stock"
            type="number"
            value={newStock.stock}
            onChange={(e) => setNewStock({ ...newStock, stock: parseInt(e.target.value) || 0 })}
            required
          />
          <InputField
            label="Stock Mínimo (Alerta)"
            name="minStock"
            type="number"
            value={newStock.min_stock}
            onChange={(e) =>
              setNewStock({ ...newStock, min_stock: parseInt(e.target.value) || 0 })
            }
            required
          />
          <div className="md:col-span-3">
            <button
              type="submit"
              className="w-full px-4 py-2 text-white bg-green-500 rounded-lg hover:bg-green-600 transition duration-150 font-semibold"
            >
              {medicamentos.some((m) => m.id === newStock.id)
                ? 'Actualizar Stock Existente'
                : 'Añadir Nuevo Producto'}
            </button>
          </div>
        </form>
      )}

      <div className="p-6 bg-white rounded-xl shadow-lg">
        <input
          type="text"
          placeholder="Buscar medicamento o laboratorio..."
          className="w-full p-3 mb-4 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead>
              <tr className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50">
                <th className="p-3">Nombre</th>
                <th className="p-3">Lab.</th>
                <th className="p-3">Stock</th>
                <th className="p-3">Costo Unit.</th>
                <th className="p-3">Precio Venta</th>
                <th className="p-3">Mín. Alerta</th>
                <th className="p-3">Acciones</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredMedicamentos.map((item) => (
                <RenderItem key={item.id} item={item} />
              ))}
            </tbody>
          </table>
        </div>
        {filteredMedicamentos.length === 0 && (
          <p className="mt-4 text-center text-gray-500">No se encontraron medicamentos.</p>
        )}
      </div>
    </div>
  );
};
