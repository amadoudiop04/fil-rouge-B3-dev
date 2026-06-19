import React, { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { platformApi } from '../services/platformApi';
import { useAuth } from '../contexts/AuthContext';

interface HomePageProps { onNavigate?: (page: string) => void; }

const sp = { type: 'spring' as const, stiffness: 380, damping: 30 };
const fd = (delay = 0) => ({
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0 },
  transition: { ...sp, delay },
});

const useCountdown = (target: number) => {
  const calc = () => {
    const d = Math.max(0, target - Date.now());
    return {
      d: String(Math.floor(d / 86_400_000)).padStart(2, '0'),
      h: String(Math.floor((d % 86_400_000) / 3_600_000)).padStart(2, '0'),
      m: String(Math.floor((d % 3_600_000) / 60_000)).padStart(2, '0'),
      s: String(Math.floor((d % 60_000) / 1000)).padStart(2, '0'),
    };
  };
  const [t, set] = useState(calc);
  useEffect(() => { const id = setInterval(() => set(calc()), 1000); return () => clearInterval(id); });
  return t;
};

const STATS = [
  { label: 'Rang actuel',   value: 'Diamant I', color: '#a78bfa', sub: 'Valorant' },
  { label: 'K/D Ratio',     value: '1.45',      color: 'var(--blue)',  sub: 'Moyenne' },
  { label: 'Win Rate',      value: '62.8%',     color: 'var(--green)', sub: '108 matchs' },
  { label: 'ADR moyen',     value: '158',        color: 'var(--amber)', sub: 'Par round' },
];

export const HomePage: React.FC<HomePageProps> = ({ onNavigate }) => {
  const { user } = useAuth();
  const [products, setProducts] = useState<{ name: string; price: string; image: string; id: number }[]>([]);
  const target = useRef(Date.now() + 4 * 86_400_000 + 6 * 3_600_000).current;
  const cd = useCountdown(target);

  useEffect(() => {
    platformApi.getProducts().then(r => {
      if (!r.success || !r.products) return;
      setProducts(r.products.slice(0, 4).map((p: any) => ({
        id: p.id,
        name: p.name,
        price: `€${Number(p.price).toFixed(2)}`,
        image: p.image_url ?? '',
      })));
    }).catch(() => {});
  }, []);

  const hour = new Date().getHours();
  const greeting = hour < 6 ? 'Bonne nuit' : hour < 12 ? 'Bonjour' : hour < 18 ? 'Bon après-midi' : 'Bonsoir';

  return (
    <div className="page-enter p-6 space-y-6">

      {/* Greeting */}
      <motion.div {...fd(0)}>
        <h2 className="text-[26px] font-bold tracking-tight">
          {greeting}, {user?.username} 👋
        </h2>
        <p className="mt-1 text-[14px]" style={{ color: 'var(--text3)' }}>
          {new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
        </p>
      </motion.div>

      {/* Stats row */}
      <motion.div {...fd(0.05)} className="grid grid-cols-4 gap-4">
        {STATS.map(s => (
          <div key={s.label} className="card p-5">
            <p className="text-[11px] font-semibold uppercase tracking-widest mb-2" style={{ color: 'var(--text3)' }}>{s.label}</p>
            <p className="text-[28px] font-bold leading-none" style={{ color: s.color }}>{s.value}</p>
            <p className="mt-1.5 text-[12px]" style={{ color: 'var(--text3)' }}>{s.sub}</p>
          </div>
        ))}
      </motion.div>

      {/* Middle row */}
      <div className="grid grid-cols-3 gap-4">

        {/* Live match */}
        <motion.button {...fd(0.09)} whileTap={{ scale: 0.99 }} transition={sp}
          onClick={() => onNavigate?.('tournaments')}
          className="card card-hover col-span-1 overflow-hidden text-left"
          style={{ borderColor: 'rgba(239,68,68,0.2)' }}>
          <div className="flex items-center justify-between px-4 py-3"
            style={{ borderBottom: '1px solid var(--border)' }}>
            <span className="flex items-center gap-2">
              <span className="relative flex h-2 w-2">
                <span className="absolute h-full w-full animate-ping rounded-full opacity-75" style={{ background: 'var(--red)' }} />
                <span className="relative h-2 w-2 rounded-full" style={{ background: 'var(--red)' }} />
              </span>
              <span className="text-[11px] font-bold uppercase tracking-wider" style={{ color: 'var(--red)' }}>En direct</span>
            </span>
            <span className="text-[11px]" style={{ color: 'var(--text3)' }}>VCT Champions 2025</span>
          </div>
          <div className="flex items-center justify-between px-6 py-6">
            <div className="text-center">
              <p className="text-[18px] font-black">NAVI</p>
              <p className="text-[11px]" style={{ color: 'var(--text3)' }}>EU</p>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-[40px] font-black tabular-nums">10</span>
              <span className="text-[18px]" style={{ color: 'var(--text3)' }}>—</span>
              <span className="text-[40px] font-black tabular-nums">8</span>
            </div>
            <div className="text-center">
              <p className="text-[18px] font-black">LOUD</p>
              <p className="text-[11px]" style={{ color: 'var(--text3)' }}>SA</p>
            </div>
          </div>
          <p className="pb-3 text-center text-[11px]" style={{ color: 'var(--text3)' }}>
            Ascent · Map 2 · Cliquer pour regarder →
          </p>
        </motion.button>

        {/* Countdown */}
        <motion.div {...fd(0.11)} className="card col-span-1 p-5">
          <div className="flex items-start justify-between mb-4">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-widest mb-1" style={{ color: 'var(--text3)' }}>Prochain tournoi</p>
              <p className="text-[15px] font-bold">BLAST Premier World Final</p>
              <p className="text-[12px] mt-0.5" style={{ color: 'var(--text3)' }}>Copenhague · $500 000</p>
            </div>
            <span className="rounded-full px-2.5 py-1 text-[11px] font-semibold"
              style={{ background: 'rgba(124,58,237,0.12)', color: 'var(--violet2)' }}>
              À venir
            </span>
          </div>
          <div className="flex items-center justify-between">
            {[{ v: cd.d, l: 'Jours' }, { v: cd.h, l: 'Hres' }, { v: cd.m, l: 'Min' }, { v: cd.s, l: 'Sec' }].map((u, i) => (
              <React.Fragment key={u.l}>
                {i > 0 && <span className="text-[20px] pb-4" style={{ color: 'var(--text3)' }}>:</span>}
                <div className="flex flex-col items-center">
                  <span className="text-[30px] font-black tabular-nums leading-none">{u.v}</span>
                  <span className="mt-1 text-[10px] uppercase tracking-widest" style={{ color: 'var(--text3)' }}>{u.l}</span>
                </div>
              </React.Fragment>
            ))}
          </div>
          <button onClick={() => onNavigate?.('tournaments')}
            className="mt-4 flex w-full items-center justify-center gap-1.5 rounded-lg py-2.5 text-[12px] font-semibold transition hover:bg-white/5"
            style={{ borderTop: '1px solid var(--border)', color: 'var(--violet2)' }}>
            Voir tous les tournois →
          </button>
        </motion.div>

        {/* Recent activity */}
        <motion.div {...fd(0.13)} className="card col-span-1 p-5">
          <p className="text-[11px] font-semibold uppercase tracking-widest mb-4" style={{ color: 'var(--text3)' }}>Activité récente</p>
          <div className="space-y-3">
            {[
              { label: 'Victoire sur Ascent',    sub: 'Compétitif · +20 RR',       color: 'var(--green)', icon: '🏆', time: '2h' },
              { label: 'Défaite sur Split',      sub: 'Compétitif · −12 RR',       color: 'var(--red)',   icon: '💀', time: '5h' },
              { label: 'Victoire sur Bind',      sub: 'Unranked · +0 RR',          color: 'var(--green)', icon: '✅', time: '1j' },
              { label: 'Achat : T-Shirt B3',     sub: 'Commande #1042',            color: 'var(--violet2)', icon: '🛍', time: '2j' },
            ].map(a => (
              <div key={a.label} className="flex items-center gap-3">
                <span className="text-[16px]">{a.icon}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] font-medium truncate">{a.label}</p>
                  <p className="text-[11px]" style={{ color: 'var(--text3)' }}>{a.sub}</p>
                </div>
                <span className="text-[11px] shrink-0" style={{ color: 'var(--text3)' }}>{a.time}</span>
              </div>
            ))}
          </div>
        </motion.div>

      </div>

      {/* Shop preview */}
      {products.length > 0 && (
        <motion.div {...fd(0.15)}>
          <div className="mb-3 flex items-center justify-between">
            <p className="text-[11px] font-semibold uppercase tracking-widest" style={{ color: 'var(--text3)' }}>Boutique</p>
            <button onClick={() => onNavigate?.('shop')} className="text-[12px] font-semibold" style={{ color: 'var(--violet2)' }}>
              Voir tout →
            </button>
          </div>
          <div className="grid grid-cols-4 gap-4">
            {products.map((p, i) => (
              <motion.button key={i} whileTap={{ scale: 0.97 }} transition={sp}
                onClick={() => onNavigate?.('shop')}
                className="card card-hover overflow-hidden text-left">
                <div className="aspect-video w-full overflow-hidden" style={{ background: 'var(--raised)' }}>
                  {p.image
                    ? <img src={p.image} alt={p.name} className="h-full w-full object-cover transition-transform duration-300 hover:scale-105" />
                    : <div className="flex h-full items-center justify-center"><span className="text-3xl opacity-20">📦</span></div>
                  }
                </div>
                <div className="p-3">
                  <p className="truncate text-[13px] font-semibold">{p.name}</p>
                  <p className="mt-1 text-[15px] font-bold" style={{ color: 'var(--violet2)' }}>{p.price}</p>
                </div>
              </motion.button>
            ))}
          </div>
        </motion.div>
      )}

    </div>
  );
};
