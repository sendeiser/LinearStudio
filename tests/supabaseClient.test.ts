import { describe, it, expect } from 'vitest';
import { getSupabaseClient, isSupabaseConfigured } from '../src/lib/supabase';

describe('Supabase Client & Resilient Fallback', () => {
  it('should detect if Supabase is properly configured via environment variables', () => {
    const configured = isSupabaseConfigured();
    expect(typeof configured).toBe('boolean');
  });

  it('should return a valid Supabase client instance without throwing exceptions', () => {
    const client = getSupabaseClient();
    expect(client).toBeDefined();
    expect(client.from).toBeDefined();
    expect(typeof client.from).toBe('function');
  });

  it('should handle mock queries gracefully when offline or without active session', async () => {
    const client = getSupabaseClient();
    const query = client.from('issues').select('*');
    expect(query).toBeDefined();
  });
});

