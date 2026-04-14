-- Atomic deletion of a sale with stock restoration.
-- Admin and empleado can execute this flow.

CREATE OR REPLACE FUNCTION public.eliminar_venta_con_reintegro(
  p_venta_id uuid
)
RETURNS public.ventas
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_role text;
  v_venta public.ventas%ROWTYPE;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Sesión no válida para eliminar ventas.';
  END IF;

  SELECT role
  INTO v_role
  FROM public.profiles
  WHERE id = auth.uid()
     OR lower(email) = lower(auth.email())
  ORDER BY CASE WHEN id = auth.uid() THEN 0 ELSE 1 END
  LIMIT 1;

  IF v_role NOT IN ('admin', 'empleado') THEN
    RAISE EXCEPTION 'Solo admin o empleado puede eliminar ventas.';
  END IF;

  SELECT *
  INTO v_venta
  FROM public.ventas
  WHERE id = p_venta_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Venta no encontrada: %', p_venta_id;
  END IF;

  UPDATE public.medicamentos
  SET stock = stock + v_venta.cantidad
  WHERE id = v_venta.medicamento_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'No se pudo restablecer stock. Medicamento no encontrado: %', v_venta.medicamento_id;
  END IF;

  DELETE FROM public.ventas
  WHERE id = p_venta_id;

  RETURN v_venta;
EXCEPTION
  WHEN OTHERS THEN
    RAISE;
END;
$$;

REVOKE ALL ON FUNCTION public.eliminar_venta_con_reintegro(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.eliminar_venta_con_reintegro(uuid) TO authenticated;

-- Tighten direct delete permissions on ventas to admin/empleado roles.
DROP POLICY IF EXISTS "Authenticated users can delete their own sales" ON public.ventas;
DROP POLICY IF EXISTS "Admins can delete sales" ON public.ventas;

CREATE POLICY "Admins and empleados can delete sales"
  ON public.ventas
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.profiles p
      WHERE (p.id = auth.uid() OR lower(p.email) = lower(auth.email()))
        AND p.role IN ('admin', 'empleado')
    )
  );
