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

  useEffect(() => {
    const fetchMedicamentos = async () => {
      const { data, error } = await supabase
        .from('medicamentos')
        .select('*')
        .order('nombre');

      if (error) {
        console.error('Error fetching medicamentos:', error);
        return;
      }

      if (data.length === 0) {
        console.log('Inventario vacío, inicializando con datos de ejemplo...');
        await Promise.all(
          initialMedicationData.map((med) =>
            supabase.from('medicamentos').insert(med)
          )
        );
      } else {
        setMedicamentos(data);
      }
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

  return medicamentos;
};
