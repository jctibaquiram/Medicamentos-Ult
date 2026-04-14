-- Transactional sale registration with atomic stock discount.
-- This function runs as SECURITY DEFINER and enforces role checks internally,
-- allowing non-admin sales users to update stock only through this RPC.

CREATE OR REPLACE FUNCTION public.registrar_venta_con_stock(
  p_medicamento_id text,
  p_cantidad integer,
  p_forma_pago text,
  p_fecha timestamptz,
  p_registrado_por uuid
)
RETURNS public.ventas
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_role text;
  v_med public.medicamentos%ROWTYPE;
  v_venta public.ventas%ROWTYPE;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Sesión no válida para registrar ventas.';
  END IF;

  IF p_registrado_por IS DISTINCT FROM auth.uid() THEN
    RAISE EXCEPTION 'No autorizado para registrar ventas para otro usuario.';
  END IF;

  SELECT role
  INTO v_role
  FROM public.profiles
  WHERE id = auth.uid()
     OR lower(email) = lower(auth.email())
  ORDER BY CASE WHEN id = auth.uid() THEN 0 ELSE 1 END
  LIMIT 1;

  IF v_role NOT IN ('admin', 'empleado', 'vendedor') THEN
    RAISE EXCEPTION 'Tu rol no tiene permisos para registrar ventas.';
  END IF;

  IF p_cantidad IS NULL OR p_cantidad <= 0 THEN
    RAISE EXCEPTION 'La cantidad debe ser mayor a cero.';
  END IF;

  SELECT *
  INTO v_med
  FROM public.medicamentos
  WHERE id = p_medicamento_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Medicamento no encontrado: %', p_medicamento_id;
  END IF;

  IF v_med.stock < p_cantidad THEN
    RAISE EXCEPTION 'Stock insuficiente para % (disponible: %, solicitado: %).', v_med.nombre, v_med.stock, p_cantidad;
  END IF;

  UPDATE public.medicamentos
  SET stock = v_med.stock - p_cantidad
  WHERE id = v_med.id;

  INSERT INTO public.ventas (
    fecha,
    medicamento_id,
    nombre,
    lab,
    cantidad,
    precio_unitario,
    costo_unitario,
    total_venta,
    costo_total,
    ganancia,
    forma_pago,
    registrado_por
  )
  VALUES (
    COALESCE(p_fecha, now()),
    v_med.id,
    v_med.nombre,
    v_med.lab,
    p_cantidad,
    v_med.precio,
    v_med.costo,
    v_med.precio * p_cantidad,
    v_med.costo * p_cantidad,
    (v_med.precio - v_med.costo) * p_cantidad,
    p_forma_pago,
    p_registrado_por
  )
  RETURNING * INTO v_venta;

  RETURN v_venta;
END;
$$;

REVOKE ALL ON FUNCTION public.registrar_venta_con_stock(text, integer, text, timestamptz, uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.registrar_venta_con_stock(text, integer, text, timestamptz, uuid) TO authenticated;

-- Restrict direct stock updates. Employees should only change stock via the RPC.
DROP POLICY IF EXISTS "Authenticated users can update medications" ON public.medicamentos;

CREATE POLICY "Admins can update medications"
  ON public.medicamentos
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.profiles p
      WHERE (p.id = auth.uid() OR lower(p.email) = lower(auth.email()))
        AND p.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.profiles p
      WHERE (p.id = auth.uid() OR lower(p.email) = lower(auth.email()))
        AND p.role = 'admin'
    )
  );
