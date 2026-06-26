import { describe, it, expect } from 'vitest';
import { isValidEmail, validatePassword } from './validation.mjs';

describe('isValidEmail', () => {
  it('accepts well-formed addresses', () => {
    expect(isValidEmail('player@b3esport.gg')).toBe(true);
    expect(isValidEmail('  UP.PER@Domain.co  ')).toBe(true); // trimmed
  });

  it('rejects malformed addresses', () => {
    for (const bad of ['', 'nope', 'a@b', 'a@b.', '@b.co', 'a b@c.co', null, undefined]) {
      expect(isValidEmail(bad)).toBe(false);
    }
  });
});

describe('validatePassword', () => {
  it('accepts 6+ characters', () => {
    expect(validatePassword('secret')).toEqual({ ok: true });
    expect(validatePassword('123456').ok).toBe(true);
  });

  it('rejects passwords that are too short', () => {
    const r = validatePassword('abc');
    expect(r.ok).toBe(false);
    expect(r.error).toMatch(/6/);
  });

  it('treats null/undefined as empty (too short)', () => {
    expect(validatePassword(undefined).ok).toBe(false);
    expect(validatePassword(null).ok).toBe(false);
  });
});
