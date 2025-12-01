export type Database = {
  public: {
    Tables: {
      medicamentos: {
        Row: {
          id: string;
          nombre: string;
          lab: string;
          contenido: string;
          costo: number;
          precio: number;
          stock: number;
          min_stock: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          nombre: string;
          lab: string;
          contenido?: string;
          costo?: number;
          precio?: number;
          stock?: number;
          min_stock?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          nombre?: string;
          lab?: string;
          contenido?: string;
          costo?: number;
          precio?: number;
          stock?: number;
          min_stock?: number;
          created_at?: string;
          updated_at?: string;
        };
      };
      ventas: {
        Row: {
          id: string;
          fecha: string;
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
          created_at: string;
        };
        Insert: {
          id?: string;
          fecha?: string;
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
          registrado_por?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          fecha?: string;
          medicamento_id?: string;
          nombre?: string;
          lab?: string;
          cantidad?: number;
          precio_unitario?: number;
          costo_unitario?: number;
          total_venta?: number;
          costo_total?: number;
          ganancia?: number;
          forma_pago?: string;
          registrado_por?: string | null;
          created_at?: string;
        };
      };
    };
  };
};
