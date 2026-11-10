import { createClient, SupabaseClient } from '@supabase/supabase-js';

const SUPABASE_URL = (typeof process !== 'undefined' && process.env?.VITE_SUPABASE_URL) || 
  (import.meta as any).env?.VITE_SUPABASE_URL || 
  'https://xftwykrxumzxaqhosbvt.supabase.co';

const SUPABASE_ANON_KEY = (typeof process !== 'undefined' && process.env?.VITE_SUPABASE_ANON_KEY) || 
  (import.meta as any).env?.VITE_SUPABASE_ANON_KEY || 
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.e30.dummy-token';

let supabaseInstance: SupabaseClient | null = null;

export const isSupabaseConfigured = (): boolean => {
  return Boolean(
    SUPABASE_URL && 
    SUPABASE_ANON_KEY && 
    !SUPABASE_ANON_KEY.includes('dummy-token')
  );
};

export const getSupabaseClient = (): SupabaseClient => {
  if (!supabaseInstance) {
    try {
      supabaseInstance = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
        auth: {
          persistSession: true,
          autoRefreshToken: true
        }
      });
    } catch {
      // Fallback dummy client if creation fails
      supabaseInstance = {
        from: (_table: string) => ({
          select: () => Promise.resolve({ data: [], error: null }),
          insert: () => Promise.resolve({ data: null, error: null }),
          update: () => Promise.resolve({ data: null, error: null }),
          delete: () => Promise.resolve({ data: null, error: null })
        })
      } as unknown as SupabaseClient;
    }
  }
  return supabaseInstance;
};

export const supabase = getSupabaseClient();

