// TODO: Implementar validación de nombres de workspace con caracteres unicode y emojis
import { describe, it, expect } from 'vitest';
import { slugify, isValidRepoName, friendlyAuthError } from '../src/services/authHelpers';

describe('authHelpers', () => {
  it('slugifies workspace names (accents, spaces, symbols)', () => {
    expect(slugify('Equipo Ñandú & Co.')).toBe('equipo-nandu-co');
    expect(slugify('  Mi   Taller  ')).toBe('mi-taller');
    expect(slugify('***')).toBe('');
  });

  it('validates GitHub owner/repo names', () => {
    expect(isValidRepoName('tincho/hyper-flow')).toBe(true);
    expect(isValidRepoName('org/repo.name_1')).toBe(true);
    expect(isValidRepoName('sin-barra')).toBe(false);
    expect(isValidRepoName('a/b/c')).toBe(false);
    expect(isValidRepoName('con espacio/repo')).toBe(false);
  });

  it('translates common Supabase auth errors to Spanish', () => {
    expect(friendlyAuthError('Invalid login credentials')).toMatch(/email o contraseña/i);
    expect(friendlyAuthError('Email not confirmed')).toMatch(/confirm/i);
    expect(friendlyAuthError('User already registered')).toMatch(/ya existe/i);
    expect(friendlyAuthError('Password should be at least 6 characters')).toMatch(/6 caracteres/);
    expect(friendlyAuthError('algo raro')).toBe('algo raro');
  });
});

