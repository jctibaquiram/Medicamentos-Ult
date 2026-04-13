import { createClient } from '@supabase/supabase-js';
import type { Database } from './database.types';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

// Validación suave - permite que la app cargue pero muestra advertencia
if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('[v0] Supabase environment variables are missing. Auth features will not work.');
}

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);
