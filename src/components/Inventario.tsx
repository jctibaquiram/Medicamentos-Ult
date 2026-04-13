import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { formatCurrency } from '../utils/format';
import type { Medicamento } from '../types';
import { Plus, X, Search, Pencil, Check } from 'lucide-react';

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
      showMessage('La cantidad de stock debe ser positiva.');
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
        showMessage(`${newStock.nombre} añadido al inventario.`);
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
      showMessage('Error al guardar el inventario.');
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
      showMessage(`${editItem.nombre} actualizado.`);
      setEditItem(null);
    } catch (error) {
      console.error('Error al actualizar stock:', error);
      showMessage('Error al actualizar el inventario.');
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-neutral-100 tracking-tight">Inventario</h2>
        <button
          onClick={() => setIsAdding(!isAdding)}
          className={`flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded transition-colors ${
            isAdding
              ? 'bg-neutral-800 text-neutral-300 hover:bg-neutral-700'
              : 'bg-emerald-600 text-white hover:bg-emerald-500'
          }`}
        >
          {isAdding ? <X size={14} /> : <Plus size={14} />}
          {isAdding ? 'Cerrar' : 'Nuevo'}
        </button>
      </div>

      {isAdding && (
        <form onSubmit={handleAddStock} className="card-dark space-y-4">
          <h3 className="text-sm font-medium text-neutral-300">Registro de Compra</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div>
              <label className="block text-xs text-neutral-500 mb-1">ID/SKU</label>
              <input
                type="text"
                value={newStock.id}
                onChange={(e) => setNewStock({ ...newStock, id: e.target.value })}
                className="input-dark"
                required
              />
            </div>
            <div>
              <label className="block text-xs text-neutral-500 mb-1">Nombre</label>
              <input
                type="text"
                value={newStock.nombre}
                onChange={(e) => setNewStock({ ...newStock, nombre: e.target.value })}
                className="input-dark"
                required
              />
            </div>
            <div>
              <label className="block text-xs text-neutral-500 mb-1">Laboratorio</label>
              <input
                type="text"
                value={newStock.lab}
                onChange={(e) => setNewStock({ ...newStock, lab: e.target.value })}
                className="input-dark"
                required
              />
            </div>
            <div>
              <label className="block text-xs text-neutral-500 mb-1">Costo</label>
              <input
                type="number"
                value={newStock.costo}
                onChange={(e) => setNewStock({ ...newStock, costo: parseInt(e.target.value) || 0 })}
                className="input-dark"
                required
              />
            </div>
            <div>
              <label className="block text-xs text-neutral-500 mb-1">Precio Venta</label>
              <input
                type="number"
                value={newStock.precio}
                onChange={(e) => setNewStock({ ...newStock, precio: parseInt(e.target.value) || 0 })}
                className="input-dark"
                required
              />
            </div>
            <div>
              <label className="block text-xs text-neutral-500 mb-1">Cantidad</label>
              <input
                type="number"
                value={newStock.stock}
                onChange={(e) => setNewStock({ ...newStock, stock: parseInt(e.target.value) || 0 })}
                className="input-dark"
                required
              />
            </div>
            <div>
              <label className="block text-xs text-neutral-500 mb-1">Stock Mínimo</label>
              <input
                type="number"
                value={newStock.min_stock}
                onChange={(e) => setNewStock({ ...newStock, min_stock: parseInt(e.target.value) || 0 })}
                className="input-dark"
                required
              />
            </div>
            <div className="flex items-end">
              <button type="submit" className="btn-primary w-full">
                {medicamentos.some((m) => m.id === newStock.id) ? 'Actualizar' : 'Añadir'}
              </button>
            </div>
          </div>
        </form>
      )}

      <div className="card-dark">
        <div className="relative mb-4">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500" />
          <input
            type="text"
            placeholder="Buscar medicamento o laboratorio..."
            className="input-dark pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="overflow-x-auto">
          <table className="table-dark">
            <thead>
              <tr>
                <th>Nombre</th>
                <th>Lab.</th>
                <th>Stock</th>
                <th>Costo</th>
                <th>Precio</th>
                <th>Mín.</th>
                <th className="w-24">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filteredMedicamentos.map((item) => {
                const isLow = item.stock < item.min_stock;
                const isEditing = editItem?.id === item.id;

                if (isEditing && editItem) {
                  return (
                    <tr key={item.id} className="bg-amber-950/20">
                      <td className="font-medium text-neutral-200">{item.nombre}</td>
                      <td>{item.lab}</td>
                      <td>
                        <input
                          type="number"
                          value={editItem.stock}
                          onChange={(e) => setEditItem({ ...editItem, stock: parseInt(e.target.value) || 0 })}
                          className="w-16 px-2 py-1 text-xs bg-neutral-800 border border-neutral-600 rounded text-neutral-100"
                        />
                      </td>
                      <td>
                        <input
                          type="number"
                          value={editItem.costo}
                          onChange={(e) => setEditItem({ ...editItem, costo: parseInt(e.target.value) || 0 })}
                          className="w-20 px-2 py-1 text-xs bg-neutral-800 border border-neutral-600 rounded text-neutral-100"
                        />
                      </td>
                      <td>
                        <input
                          type="number"
                          value={editItem.precio}
                          onChange={(e) => setEditItem({ ...editItem, precio: parseInt(e.target.value) || 0 })}
                          className="w-20 px-2 py-1 text-xs bg-neutral-800 border border-neutral-600 rounded text-neutral-100"
                        />
                      </td>
                      <td>
                        <input
                          type="number"
                          value={editItem.min_stock}
                          onChange={(e) => setEditItem({ ...editItem, min_stock: parseInt(e.target.value) || 0 })}
                          className="w-16 px-2 py-1 text-xs bg-neutral-800 border border-neutral-600 rounded text-neutral-100"
                        />
                      </td>
                      <td>
                        <div className="flex gap-1">
                          <button
                            onClick={handleUpdateStock}
                            className="p-1.5 rounded bg-emerald-600 text-white hover:bg-emerald-500"
                          >
                            <Check size={12} />
                          </button>
                          <button
                            onClick={() => setEditItem(null)}
                            className="p-1.5 rounded bg-neutral-700 text-neutral-300 hover:bg-neutral-600"
                          >
                            <X size={12} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                }

                return (
                  <tr key={item.id} className={isLow ? 'bg-red-950/20' : ''}>
                    <td className="font-medium text-neutral-200">{item.nombre}</td>
                    <td className="text-neutral-400">{item.lab}</td>
                    <td className={`font-medium ${isLow ? 'text-red-400' : 'text-emerald-400'}`}>
                      {item.stock}
                    </td>
                    <td className="tabular-nums">{formatCurrency(item.costo)}</td>
                    <td className="tabular-nums">{formatCurrency(item.precio)}</td>
                    <td className="text-neutral-500">{item.min_stock}</td>
                    <td>
                      <button
                        onClick={() => setEditItem({ ...item })}
                        className="p-1.5 rounded bg-neutral-800 text-neutral-400 hover:text-neutral-200 hover:bg-neutral-700"
                      >
                        <Pencil size={12} />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {filteredMedicamentos.length === 0 && (
          <p className="mt-4 text-center text-sm text-neutral-500">No se encontraron medicamentos.</p>
        )}
      </div>
    </div>
  );
};
