/*
  # Pharmacy Management System Schema

  1. New Tables
    - `medicamentos` (medications inventory)
      - `id` (text, primary key) - Unique medication ID/SKU
      - `nombre` (text) - Medication name
      - `lab` (text) - Laboratory/manufacturer
      - `contenido` (text) - Content type (Gotas, Jarabe, etc.)
      - `costo` (numeric) - Unit cost (wholesale price)
      - `precio` (numeric) - Unit selling price
      - `stock` (integer) - Current stock quantity
      - `min_stock` (integer) - Minimum stock alert threshold
      - `created_at` (timestamptz) - Record creation timestamp
      - `updated_at` (timestamptz) - Record update timestamp

    - `ventas` (sales records)
      - `id` (uuid, primary key) - Auto-generated sale ID
      - `fecha` (timestamptz) - Sale date and time
      - `medicamento_id` (text) - Reference to medication
      - `nombre` (text) - Medication name (denormalized for historical data)
      - `lab` (text) - Laboratory name (denormalized)
      - `cantidad` (integer) - Quantity sold
      - `precio_unitario` (numeric) - Unit selling price at time of sale
      - `costo_unitario` (numeric) - Unit cost at time of sale
      - `total_venta` (numeric) - Total sale amount
      - `costo_total` (numeric) - Total cost
      - `ganancia` (numeric) - Profit from sale
      - `forma_pago` (text) - Payment method (Efectivo, Transferencia)
      - `registrado_por` (uuid) - User who registered the sale
      - `created_at` (timestamptz) - Record creation timestamp

  2. Security
    - Enable RLS on both tables
    - Add policies for authenticated users to manage inventory
    - Add policies for authenticated users to record and view sales
*/

-- Create medicamentos table
CREATE TABLE IF NOT EXISTS medicamentos (
  id text PRIMARY KEY,
  nombre text NOT NULL,
  lab text NOT NULL,
  contenido text DEFAULT 'Gotas',
  costo numeric NOT NULL DEFAULT 0,
  precio numeric NOT NULL DEFAULT 0,
  stock integer NOT NULL DEFAULT 0,
  min_stock integer NOT NULL DEFAULT 5,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create ventas table
CREATE TABLE IF NOT EXISTS ventas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  fecha timestamptz DEFAULT now(),
  medicamento_id text NOT NULL,
  nombre text NOT NULL,
  lab text NOT NULL,
  cantidad integer NOT NULL,
  precio_unitario numeric NOT NULL,
  costo_unitario numeric NOT NULL,
  total_venta numeric NOT NULL,
  costo_total numeric NOT NULL,
  ganancia numeric NOT NULL,
  forma_pago text NOT NULL,
  registrado_por uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_medicamentos_nombre ON medicamentos(nombre);
CREATE INDEX IF NOT EXISTS idx_medicamentos_stock ON medicamentos(stock);
CREATE INDEX IF NOT EXISTS idx_ventas_fecha ON ventas(fecha DESC);
CREATE INDEX IF NOT EXISTS idx_ventas_medicamento ON ventas(medicamento_id);

-- Enable Row Level Security
ALTER TABLE medicamentos ENABLE ROW LEVEL SECURITY;
ALTER TABLE ventas ENABLE ROW LEVEL SECURITY;

-- Policies for medicamentos table
CREATE POLICY "Authenticated users can view all medications"
  ON medicamentos FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert medications"
  ON medicamentos FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update medications"
  ON medicamentos FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete medications"
  ON medicamentos FOR DELETE
  TO authenticated
  USING (true);

-- Policies for ventas table
CREATE POLICY "Authenticated users can view all sales"
  ON ventas FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert sales"
  ON ventas FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = registrado_por);

CREATE POLICY "Authenticated users can update their own sales"
  ON ventas FOR UPDATE
  TO authenticated
  USING (auth.uid() = registrado_por)
  WITH CHECK (auth.uid() = registrado_por);

CREATE POLICY "Authenticated users can delete their own sales"
  ON ventas FOR DELETE
  TO authenticated
  USING (auth.uid() = registrado_por);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update updated_at
CREATE TRIGGER update_medicamentos_updated_at
  BEFORE UPDATE ON medicamentos
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
