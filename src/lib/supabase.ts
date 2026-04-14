import { createClient } from '@supabase/supabase-js';
import type { Database } from './database.types';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

if (!isSupabaseConfigured) {
  console.warn(
    'Supabase is not configured. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in a .env file.'
  );
}

const fallbackUrl = 'https://placeholder.supabase.co';
const fallbackAnonKey = 'public-anon-key-placeholder';

export const supabase = createClient<Database>(
  supabaseUrl || fallbackUrl,
  supabaseAnonKey || fallbackAnonKey
);
