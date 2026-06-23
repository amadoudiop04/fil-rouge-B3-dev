// Design tokens, pure formatters and small UI hooks shared by B3App.
// Kept out of the component so it stays focused on state and rendering.
import { useEffect, useState } from 'react';
import type { StatsRecord } from '../../types/api';

// Editorial palette + font CSS variables (defined in index.css).
export const C = {
  paper: 'var(--paper)', paper2: 'var(--paper2)', paper3: 'var(--paper3)',
  ink: 'var(--ink)', ink2: 'var(--ink2)', muted: 'var(--muted)',
  red: 'var(--red)', green: 'var(--green)', line: 'var(--line)', line2: 'var(--line2)',
};
export const DISP = 'var(--disp)', MONO = 'var(--mono)', UI = 'var(--ui)';

export const ORDER_STATUS_COLOR: Record<string, string> = {
  Paid: 'var(--green)', Shipped: 'var(--ink2)', Pending: 'var(--red)', Cancelled: 'var(--muted)',
};

// Fallback stats shown before the player's real numbers load.
export const DEFAULT_STATS: StatsRecord = {
  user_id: 0, rank_name: 'Diamant I', rank_rating: 412, win_rate: 62.8, kd_ratio: 1.55, avg_damage: 170,
};

export const eur = (n: number) => '€' + n.toFixed(2).replace('.', ',');

export const fmtShortDate = (iso?: string): string =>
  iso ? new Date(iso).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' }).toUpperCase() : '—';

// Relative "il y a …" for the activity feed.
export const fmtAgo = (iso?: string): string => {
  if (!iso) return '—';
  const diff = Date.now() - new Date(iso).getTime();
  if (Number.isNaN(diff)) return '—';
  const h = Math.floor(diff / 3600000);
  if (h < 1) return `${Math.max(1, Math.floor(diff / 60000))}m`;
  if (h < 24) return `${h}h`;
  return `${Math.floor(h / 24)}j`;
};

export const rankColor = (label?: string | null): string => {
  const t = (label || '').split(' ')[0].toLowerCase();
  if (/(radiant|immort)/.test(t)) return 'var(--red)';
  if (/(diam|ascend)/.test(t)) return 'var(--green)';
  return 'var(--ink2)';
};

// Cubic-ease reveal that re-runs whenever `dep` changes (drives the scan wipe).
export function useReveal(dep: unknown): number {
  const [e, setE] = useState(1);
  useEffect(() => {
    let raf = 0;
    const t0 = performance.now(), dur = 720;
    const tick = (t: number) => {
      const x = Math.min(1, (t - t0) / dur);
      setE(1 - Math.pow(1 - x, 3));
      if (x < 1) raf = requestAnimationFrame(tick);
    };
    setE(0);
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dep]);
  return e;
}
