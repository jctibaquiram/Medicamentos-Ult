import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import type { Medicamento } from '../types';

const initialMedicationData: Medicamento[] = [
  { id: '1', nombre: 'Agraricus Muscarius D9', lab: 'DH MEDICAL', contenido: 'Gotas', costo: 40000, precio: 62000, stock: 15, min_stock: 5 },
  { id: '2', nombre: 'Anacardium Orientale D9', lab: 'DH MEDICAL', contenido: 'Gotas', costo: 40000, precio: 62000, stock: 8, min_stock: 5 },
  { id: '3', nombre: 'Drotox Jarabe', lab: 'LHA', contenido: 'Jarabe', costo: 44500, precio: 90000, stock: 3, min_stock: 10 },
  { id: '4', nombre: 'Apis Mellifica D9', lab: 'DH MEDICAL', contenido: 'Gotas', costo: 40000, precio: 62000, stock: 20, min_stock: 5 },
  { id: '5', nombre: 'Chimal Gotas', lab: 'LHA', contenido: 'Gotas', costo: 29600, precio: 60000, stock: 12, min_stock: 7 },
];

export const useMedicamentos = () => {
  const [medicamentos, setMedicamentos] = useState<Medicamento[]>([]);
  const [loading, setLoading] = useState(true);

  const updateMedicamento = async (updatedItem: Medicamento) => {
    let previousItem: Medicamento | undefined;

    // Optimistic update for immediate UX response.
    setMedicamentos((prev) => {
      previousItem = prev.find((m) => m.id === updatedItem.id);
      return prev.map((m) => (m.id === updatedItem.id ? { ...updatedItem } : m));
    });

    const { data, error } = await supabase
      .from('medicamentos')
      .update({
        stock: updatedItem.stock,
        costo: updatedItem.costo,
        precio: updatedItem.precio,
        min_stock: updatedItem.min_stock,
      })
      .eq('id', updatedItem.id)
      .select('id,nombre,lab,contenido,costo,precio,stock,min_stock,created_at,updated_at')
      .single();

    if (error || !data) {
      if (previousItem) {
        setMedicamentos((prev) =>
          prev.map((m) => (m.id === previousItem?.id ? previousItem : m))
        );
      }

      return {
        ok: false,
        message: `Error al actualizar inventario: ${error?.message ?? 'Sin respuesta de la base de datos.'}`,
      };
    }

    setMedicamentos((prev) => prev.map((m) => (m.id === data.id ? data : m)));

    return {
      ok: true,
      message: `Medicamento ${data.nombre} actualizado.`,
      data,
    };
  };

  const saveCompraStock = async (newStock: {
    id: string;
    nombre: string;
    lab: string;
    contenido: string;
    costo: number;
    precio: number;
    stock: number;
    min_stock: number;
  }) => {
    if (newStock.stock <= 0) {
      return {
        ok: false,
        message: 'La cantidad de stock a añadir debe ser positiva.',
      };
    }

    const existingItem = medicamentos.find((m) => m.id === newStock.id);

    if (existingItem) {
      const optimisticUpdated: Medicamento = {
        ...existingItem,
        costo: newStock.costo,
        precio: newStock.precio,
        min_stock: newStock.min_stock,
        stock: existingItem.stock + newStock.stock,
      };

      return updateMedicamento(optimisticUpdated);
    }

    const { data, error } = await supabase
      .from('medicamentos')
      .insert(newStock)
      .select('id,nombre,lab,contenido,costo,precio,stock,min_stock,created_at,updated_at')
      .single();

    if (error || !data) {
      return {
        ok: false,
        message: `Error al guardar inventario: ${error?.message ?? 'Sin respuesta de la base de datos.'}`,
      };
    }

    setMedicamentos((prev) => [...prev, data].sort((a, b) => a.nombre.localeCompare(b.nombre)));

    return {
      ok: true,
      message: `Nuevo medicamento ${data.nombre} añadido al inventario.`,
      data,
    };
  };

  useEffect(() => {
    const fetchMedicamentos = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('medicamentos')
        .select('id,nombre,lab,contenido,costo,precio,stock,min_stock,created_at,updated_at')
        .order('nombre');

      if (error) {
        console.error('Error fetching medicamentos:', error);
        setLoading(false);
        return;
      }

      if (data.length === 0) {
        console.log('Inventario vacío, inicializando con datos de ejemplo...');
        const { error: insertError } = await supabase
          .from('medicamentos')
          .insert(initialMedicationData);

        if (insertError) {
          console.error('Error seeding medicamentos:', insertError);
          setLoading(false);
          return;
        }

        setMedicamentos(initialMedicationData);
        setLoading(false);
        return;
      }

      setMedicamentos(data);
      setLoading(false);
    };

    fetchMedicamentos();

    const subscription = supabase
      .channel('medicamentos_changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'medicamentos' },
        () => {
          fetchMedicamentos();
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  return { medicamentos, loading, updateMedicamento, saveCompraStock };
};
