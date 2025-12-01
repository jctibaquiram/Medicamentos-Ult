import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import type { Venta } from '../types';

export const useVentas = () => {
  const [ventas, setVentas] = useState<Venta[]>([]);

  useEffect(() => {
    const fetchVentas = async () => {
      const { data, error } = await supabase
        .from('ventas')
        .select('*')
        .order('fecha', { ascending: false });

      if (error) {
        console.error('Error fetching ventas:', error);
        return;
      }

      setVentas(
        data.map((venta) => ({
          ...venta,
          fecha: new Date(venta.fecha),
        }))
      );
    };

    fetchVentas();

    const subscription = supabase
      .channel('ventas_changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'ventas' },
        () => {
          fetchVentas();
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  return ventas;
};
