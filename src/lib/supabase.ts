import { createClient, SupabaseClient } from '@supabase/supabase-js';
import type { Database } from './database.types';

// Intentar obtener variables de entorno (VITE para dev, o directas para build)
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || import.meta.env.SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || import.meta.env.SUPABASE_ANON_KEY || '';

console.log('[v0] Supabase URL disponible:', !!supabaseUrl);
console.log('[v0] Supabase Key disponible:', !!supabaseAnonKey);

let supabase: SupabaseClient<Database>;

if (supabaseUrl && supabaseAnonKey) {
  supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);
} else {
  console.warn('[v0] Supabase environment variables are missing. Using mock client.');
  // Crear un cliente mock que no falle
  supabase = createClient<Database>('https://placeholder.supabase.co', 'placeholder-key');
}

export { supabase };
