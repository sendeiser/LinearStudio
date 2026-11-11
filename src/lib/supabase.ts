import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Base de datos compartida con boxtools.
// Las credenciales viven SOLO en variables de entorno; nunca se hardcodean.
const env = (import.meta as unknown as { env?: Record<string, string | undefined> }).env ?? {};

const SUPABASE_URL: string =
  (typeof process !== 'undefined' && process.env?.VITE_SUPABASE_URL) || env.VITE_SUPABASE_URL || '';

const SUPABASE_ANON_KEY: string =
  (typeof process !== 'undefined' && process.env?.VITE_SUPABASE_ANON_KEY) || env.VITE_SUPABASE_ANON_KEY || '';

let supabaseInstance: SupabaseClient | null = null;

export const isSupabaseConfigured = (): boolean => Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);

export const getSupabaseClient = (): SupabaseClient => {
  if (!supabaseInstance) {
    // Sin credenciales se crea un cliente inerte (placeholder) para no romper la app:
    // dataService sigue funcionando con su cache local hasta que haya .env.local.
    supabaseInstance = createClient(
      SUPABASE_URL || 'https://placeholder.supabase.co',
      SUPABASE_ANON_KEY || 'placeholder-anon-key',
      { auth: { persistSession: true, autoRefreshToken: true } }
    );
  }
  return supabaseInstance;
};

export const supabase = getSupabaseClient();
