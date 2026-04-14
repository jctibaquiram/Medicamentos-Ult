import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import type { Venta } from '../types';

interface UseVentasRangoParams {
  startDate: Date;
  endDate: Date;
}

interface UseVentasRangoResult {
  ventas: Venta[];
  loading: boolean;
  error: string | null;
  diagnostics: {
    fetched: number;
    parsed: number;
    inRange: number;
    firstRawCreatedAt: string | null;
    firstRawFecha: string | null;
  };
}

const parseVentaDate = (rawValue: unknown): Date => {
  if (!rawValue) {
    return new Date('invalid');
  }

  if (rawValue instanceof Date) {
    return rawValue;
  }

  const text = String(rawValue ?? '').trim();
  if (!text) {
    return new Date('invalid');
  }

  let parsed = new Date(text);
  if (!Number.isNaN(parsed.getTime())) {
    return parsed;
  }

  // Normalize common Postgres formats like "YYYY-MM-DD HH:mm:ss+00".
  const withT = text.replace(' ', 'T');
  parsed = new Date(withT);
  if (!Number.isNaN(parsed.getTime())) {
    return parsed;
  }

  const withTimezone = withT.replace(/([+-]\d{2})$/, '$1:00');
  parsed = new Date(withTimezone);
  if (!Number.isNaN(parsed.getTime())) {
    return parsed;
  }

  // Parse fallback for DD/MM/YYYY and DD/MM/YYYY HH:mm:ss
  const dmY = /^(\d{2})\/(\d{2})\/(\d{4})(?:\s+(\d{2}):(\d{2})(?::(\d{2}))?)?$/.exec(text);
  if (dmY) {
    const [, dd, mm, yyyy, hh = '00', min = '00', sec = '00'] = dmY;
    parsed = new Date(Number(yyyy), Number(mm) - 1, Number(dd), Number(hh), Number(min), Number(sec));
    if (!Number.isNaN(parsed.getTime())) {
      return parsed;
    }
  }

  return new Date('invalid');
};

export const useVentasRango = ({ startDate, endDate }: UseVentasRangoParams): UseVentasRangoResult => {
  const [ventas, setVentas] = useState<Venta[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [diagnostics, setDiagnostics] = useState({
    fetched: 0,
    parsed: 0,
    inRange: 0,
    firstRawCreatedAt: null,
    firstRawFecha: null,
  });

  useEffect(() => {
    let isActive = true;

    const fetchVentas = async () => {
      setLoading(true);
      setError(null);

      if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) {
        if (!isActive) {
          return;
        }

        setVentas([]);
        setDiagnostics({
          fetched: 0,
          parsed: 0,
          inRange: 0,
          firstRawCreatedAt: null,
          firstRawFecha: null,
        });
        setError('El rango de fechas seleccionado no es válido.');
        setLoading(false);
        return;
      }

      const normalizedStart = new Date(startDate);
      const normalizedEnd = new Date(endDate);
      const startIso = normalizedStart.toISOString();
      const endIso = normalizedEnd.toISOString();

      if (startIso >= endIso) {
        if (!isActive) {
          return;
        }

        setVentas([]);
        setDiagnostics({
          fetched: 0,
          parsed: 0,
          inRange: 0,
          firstRawCreatedAt: null,
          firstRawFecha: null,
        });
        setError('El rango de fechas seleccionado no es válido.');
        setLoading(false);
        return;
      }

      try {
        const { data, error: queryError } = await supabase
          .from('ventas')
          .select('id,fecha,medicamento_id,nombre,lab,cantidad,precio_unitario,costo_unitario,total_venta,costo_total,ganancia,forma_pago,registrado_por,created_at')
          .order('fecha', { ascending: false })
          .limit(5000);

        if (!isActive) {
          return;
        }

        if (queryError) {
          console.error('Error fetching ventas por rango:', queryError);
          setVentas([]);
          setDiagnostics({
            fetched: 0,
            parsed: 0,
            inRange: 0,
            firstRawCreatedAt: null,
            firstRawFecha: null,
          });
          setError('No se pudieron cargar las ventas del período.');
          return;
        }

        const normalizedStart = new Date(startDate);
        normalizedStart.setHours(0, 0, 0, 0);

        const normalizedEnd = new Date(endDate);
        normalizedEnd.setHours(0, 0, 0, 0);

        const parsedSales = (data ?? [])
          .map((venta) => ({
            ...venta,
            fecha: parseVentaDate(venta.fecha || venta.created_at),
          }))
          .filter((venta) => !Number.isNaN(venta.fecha.getTime()));

        const filteredSales = parsedSales.filter((venta) => {
          const ventaDateOnly = new Date(venta.fecha);
          ventaDateOnly.setHours(0, 0, 0, 0);

          return ventaDateOnly >= normalizedStart && ventaDateOnly < normalizedEnd;
        });

        setDiagnostics({
          fetched: (data ?? []).length,
          parsed: parsedSales.length,
          inRange: filteredSales.length,
          firstRawCreatedAt: data?.[0]?.created_at ? String(data[0].created_at) : null,
          firstRawFecha: data?.[0]?.fecha ? String(data[0].fecha) : null,
        });
        setVentas(filteredSales);
      } catch (unknownError) {
        if (!isActive) {
          return;
        }

        console.error('Unexpected error fetching ventas por rango:', unknownError);
        setVentas([]);
        setDiagnostics({
          fetched: 0,
          parsed: 0,
          inRange: 0,
          firstRawCreatedAt: null,
          firstRawFecha: null,
        });
        setError('Ocurrió un error inesperado cargando el reporte.');
      } finally {
        if (isActive) {
          setLoading(false);
        }
      }
    };

    fetchVentas();

    return () => {
      isActive = false;
    };
  }, [startDate, endDate]);

  return { ventas, loading, error, diagnostics };
};
