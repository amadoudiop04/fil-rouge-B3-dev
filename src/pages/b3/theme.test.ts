import { describe, it, expect } from 'vitest';
import { eur, fmtAgo, rankColor } from './theme';

describe('eur', () => {
  it('formats euros with a comma and the € sign', () => {
    expect(eur(19.9)).toBe('€19,90');
    expect(eur(0)).toBe('€0,00');
    expect(eur(1234.5)).toBe('€1234,50');
  });
});

describe('rankColor', () => {
  it('maps the top ranks to red', () => {
    expect(rankColor('Radiant')).toBe('var(--red)');
    expect(rankColor('Immortel 3')).toBe('var(--red)');
  });
  it('maps diamond/ascendant to green', () => {
    expect(rankColor('Diamant I')).toBe('var(--green)');
    expect(rankColor('Ascendant 2')).toBe('var(--green)');
  });
  it('falls back to ink for everything else / empty', () => {
    expect(rankColor('Argent')).toBe('var(--ink2)');
    expect(rankColor('')).toBe('var(--ink2)');
    expect(rankColor(null)).toBe('var(--ink2)');
  });
});

describe('fmtAgo', () => {
  it('returns a dash when no date is given', () => {
    expect(fmtAgo()).toBe('—');
    expect(fmtAgo('not-a-date')).toBe('—');
  });
  it('uses minutes / hours / days buckets', () => {
    const now = Date.now();
    expect(fmtAgo(new Date(now - 5 * 60_000).toISOString())).toBe('5m');
    expect(fmtAgo(new Date(now - 3 * 3_600_000).toISOString())).toBe('3h');
    expect(fmtAgo(new Date(now - 2 * 86_400_000).toISOString())).toBe('2j');
  });
});
