import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import type { Venta } from '../types';

interface MedicamentoSnapshot {
  id: string;
  nombre: string;
  lab: string;
  precio: number;
  costo: number;
  stock: number;
}

export interface CreateVentaInput {
  medicamentoId: string;
  nombre: string;
  lab: string;
  cantidad: number;
  precioUnitario: number;
  costoUnitario: number;
  formaPago: string;
  fecha: string;
  registradoPor: string;
  stockDisponible: number;
}

export interface UpdateVentaInput {
  venta: Venta;
  medicamentoId: string;
  cantidad: number;
  formaPago: string;
  fecha: string;
  registradoPor?: string | null;
}

interface OperationResult {
  ok: boolean;
  message: string;
}

export const useVentas = () => {
  const [ventas, setVentas] = useState<Venta[]>([]);
  const [loading, setLoading] = useState(true);
  const [optimisticStock, setOptimisticStock] = useState<Record<string, number>>({});

  const fetchVentas = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('ventas')
      .select('id,fecha,medicamento_id,nombre,lab,cantidad,precio_unitario,costo_unitario,total_venta,costo_total,ganancia,forma_pago,registrado_por,created_at')
      .order('fecha', { ascending: false });

    if (error) {
      console.error('Error fetching ventas:', error);
      setLoading(false);
      return;
    }

    setVentas(
      data.map((venta) => ({
        ...venta,
        fecha: new Date(venta.fecha),
      }))
    );
    setLoading(false);
  }, []);

  const getMedicamentoById = useCallback(async (id: string): Promise<MedicamentoSnapshot> => {
    const { data, error } = await supabase
      .from('medicamentos')
      .select('id,nombre,lab,precio,costo,stock')
      .eq('id', id)
      .single();

    if (error || !data) {
      throw new Error(`No se pudo obtener el medicamento seleccionado (${id}).`);
    }

    return data as MedicamentoSnapshot;
  }, []);

  const createVenta = useCallback(
    async ({
      medicamentoId,
      nombre,
      lab,
      cantidad,
      precioUnitario,
      costoUnitario,
      formaPago,
      fecha,
      registradoPor,
      stockDisponible,
    }: CreateVentaInput): Promise<OperationResult> => {
      if (cantidad <= 0) {
        return { ok: false, message: 'La cantidad debe ser mayor que cero.' };
      }

      if (cantidad > stockDisponible) {
        return {
          ok: false,
          message: `Stock insuficiente. Disponible: ${stockDisponible} unidades.`,
        };
      }

      const saleDate = new Date(`${fecha}T12:00:00`);
      if (Number.isNaN(saleDate.getTime())) {
        return { ok: false, message: 'La fecha seleccionada no es válida.' };
      }

      const nextStock = stockDisponible - cantidad;

      // Optimistic stock update for immediate UI feedback.
      setOptimisticStock((current) => ({
        ...current,
        [medicamentoId]: nextStock,
      }));

      const { error } = await supabase.rpc('registrar_venta_con_stock', {
        p_medicamento_id: medicamentoId,
        p_cantidad: cantidad,
        p_forma_pago: formaPago,
        p_fecha: saleDate.toISOString(),
        p_registrado_por: registradoPor,
      });

      if (error) {
        setOptimisticStock((current) => ({
          ...current,
          [medicamentoId]: stockDisponible,
        }));
        return { ok: false, message: `No se pudo registrar la venta: ${error.message}` };
      }

      const totalVenta = precioUnitario * cantidad;
      const costoTotal = costoUnitario * cantidad;
      const ganancia = totalVenta - costoTotal;

      const ventaOptimista: Venta = {
        id: `tmp-${Date.now()}`,
        fecha: saleDate,
        medicamento_id: medicamentoId,
        nombre,
        lab,
        cantidad,
        precio_unitario: precioUnitario,
        costo_unitario: costoUnitario,
        total_venta: totalVenta,
        costo_total: costoTotal,
        ganancia,
        forma_pago: formaPago,
        registrado_por: registradoPor,
        created_at: new Date().toISOString(),
      };

      setVentas((current) => [ventaOptimista, ...current]);
      await fetchVentas();

      return { ok: true, message: 'Venta registrada y stock descontado correctamente.' };
    },
    [fetchVentas]
  );

  const syncOptimisticStock = useCallback((medicamentoId: string, stock: number) => {
    setOptimisticStock((current) => ({
      ...current,
      [medicamentoId]: stock,
    }));
  }, []);

  const deleteVenta = useCallback(async (venta: Venta): Promise<OperationResult> => {
    try {
      const medicamento = await getMedicamentoById(venta.medicamento_id);
      const baseStock = optimisticStock[venta.medicamento_id] ?? medicamento.stock;
      const restoredStock = baseStock + venta.cantidad;

      setOptimisticStock((current) => ({
        ...current,
        [venta.medicamento_id]: restoredStock,
      }));

      const { error: deleteError } = await supabase.rpc('eliminar_venta_con_reintegro', {
        p_venta_id: venta.id,
      });

      if (deleteError) {
        setOptimisticStock((current) => ({
          ...current,
          [venta.medicamento_id]: baseStock,
        }));
        return { ok: false, message: `No se pudo eliminar la venta: ${deleteError.message}` };
      }

      setVentas((current) => current.filter((item) => item.id !== venta.id));

      await fetchVentas();
      return { ok: true, message: 'Venta eliminada y stock restaurado correctamente.' };
    } catch (error) {
      const message =
        typeof error === 'object' && error !== null && 'message' in error
          ? String((error as { message?: string }).message)
          : 'Error inesperado eliminando la venta.';

      return { ok: false, message };
    }
  }, [fetchVentas, getMedicamentoById, optimisticStock]);

  const updateVenta = useCallback(
    async ({ venta, medicamentoId, cantidad, formaPago, fecha, registradoPor }: UpdateVentaInput): Promise<OperationResult> => {
      try {
        if (cantidad <= 0) {
          return { ok: false, message: 'La cantidad debe ser mayor que cero.' };
        }

        const saleDate = new Date(`${fecha}T12:00:00`);
        if (Number.isNaN(saleDate.getTime())) {
          return { ok: false, message: 'La fecha seleccionada no es válida.' };
        }

        const sameMedicamento = venta.medicamento_id === medicamentoId;
        const oldMedicamento = await getMedicamentoById(venta.medicamento_id);
        const newMedicamento = sameMedicamento
          ? oldMedicamento
          : await getMedicamentoById(medicamentoId);

        if (sameMedicamento) {
          const delta = cantidad - venta.cantidad;
          if (delta > 0 && oldMedicamento.stock < delta) {
            return {
              ok: false,
              message: `Stock insuficiente para aumentar la venta. Disponible: ${oldMedicamento.stock}.`,
            };
          }

          const targetStock = oldMedicamento.stock - delta;
          const { error: stockError } = await supabase
            .from('medicamentos')
            .update({ stock: targetStock })
            .eq('id', oldMedicamento.id);

          if (stockError) {
            return { ok: false, message: `No se pudo actualizar stock: ${stockError.message}` };
          }
        } else {
          if (newMedicamento.stock < cantidad) {
            return {
              ok: false,
              message: `Stock insuficiente en ${newMedicamento.nombre}. Disponible: ${newMedicamento.stock}.`,
            };
          }

          const restoredOldStock = oldMedicamento.stock + venta.cantidad;
          const { error: oldStockError } = await supabase
            .from('medicamentos')
            .update({ stock: restoredOldStock })
            .eq('id', oldMedicamento.id);

          if (oldStockError) {
            return { ok: false, message: `No se pudo restaurar stock del producto anterior: ${oldStockError.message}` };
          }

          const { error: newStockError } = await supabase
            .from('medicamentos')
            .update({ stock: newMedicamento.stock - cantidad })
            .eq('id', newMedicamento.id);

          if (newStockError) {
            await supabase
              .from('medicamentos')
              .update({ stock: oldMedicamento.stock })
              .eq('id', oldMedicamento.id);

            return { ok: false, message: `No se pudo descontar stock del nuevo producto: ${newStockError.message}` };
          }
        }

        const totalVenta = newMedicamento.precio * cantidad;
        const costoTotal = newMedicamento.costo * cantidad;
        const ganancia = totalVenta - costoTotal;

        const { error: updateError } = await supabase
          .from('ventas')
          .update({
            fecha: saleDate.toISOString(),
            medicamento_id: newMedicamento.id,
            nombre: newMedicamento.nombre,
            lab: newMedicamento.lab,
            cantidad,
            precio_unitario: newMedicamento.precio,
            costo_unitario: newMedicamento.costo,
            total_venta: totalVenta,
            costo_total: costoTotal,
            ganancia,
            forma_pago: formaPago,
            registrado_por: registradoPor ?? venta.registrado_por,
          })
          .eq('id', venta.id);

        if (updateError) {
          if (sameMedicamento) {
            await supabase
              .from('medicamentos')
              .update({ stock: oldMedicamento.stock })
              .eq('id', oldMedicamento.id);
          } else {
            await supabase
              .from('medicamentos')
              .update({ stock: oldMedicamento.stock })
              .eq('id', oldMedicamento.id);
            await supabase
              .from('medicamentos')
              .update({ stock: newMedicamento.stock })
              .eq('id', newMedicamento.id);
          }

          return { ok: false, message: `No se pudo actualizar la venta: ${updateError.message}` };
        }

        await fetchVentas();
        return { ok: true, message: 'Venta actualizada correctamente.' };
      } catch (error) {
        const message =
          typeof error === 'object' && error !== null && 'message' in error
            ? String((error as { message?: string }).message)
            : 'Error inesperado actualizando la venta.';

        return { ok: false, message };
      }
    },
    [fetchVentas, getMedicamentoById]
  );

  useEffect(() => {
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
  }, [fetchVentas]);

  return {
    ventas,
    loading,
    optimisticStock,
    syncOptimisticStock,
    fetchVentas,
    createVenta,
    updateVenta,
    deleteVenta,
  };
};
