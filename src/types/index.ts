export interface Medicamento {
  id: string;
  nombre: string;
  lab: string;
  contenido: string;
  costo: number;
  precio: number;
  stock: number;
  min_stock: number;
  created_at?: string;
  updated_at?: string;
}

export interface Venta {
  id: string;
  fecha: Date;
  medicamento_id: string;
  nombre: string;
  lab: string;
  cantidad: number;
  precio_unitario: number;
  costo_unitario: number;
  total_venta: number;
  costo_total: number;
  ganancia: number;
  forma_pago: string;
  registrado_por: string | null;
  created_at?: string;
}

export type ViewType = 'dashboard' | 'inventario' | 'ventas' | 'reportes';
