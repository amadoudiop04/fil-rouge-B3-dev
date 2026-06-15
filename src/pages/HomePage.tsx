import React, { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { platformApi } from '../services/platformApi';
import { Product } from '../components/ProductCard';

interface HomePageProps {
  onNavigate?: (page: string) => void;
  onBuyProduct?: (product: Product) => void;
}

const spring = { type: 'spring' as const, stiffness: 320, damping: 26 };
const fadeUp = { hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0, transition: spring } };
const stagger = { show: { transition: { staggerChildren: 0.08 } } };

// ─── section label ────────────────────────────────────────────────────────────
const Label: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <p className="text-[10px] font-extrabold uppercase tracking-[0.22em] text-white/30 flex items-center gap-2">
    <span className="inline-block h-3 w-0.5 rounded-full bg-[#FF4654]" />
    {children}
  </p>
);

// ─── quick stat tile ──────────────────────────────────────────────────────────
const StatTile: React.FC<{
  label: string; value: string; sub?: string; accent?: string;
}> = ({ label, value, sub, accent = '#FF4654' }) => (
  <motion.div
    variants={fadeUp}
    whileHover={{ scale: 1.03 }}
    transition={spring}
    className="rounded-2xl border border-white/[0.06] bg-white/[0.025] p-4 backdrop-blur-sm"
  >
    <p className="text-[9px] font-extrabold uppercase tracking-[0.2em] text-white/30">{label}</p>
    <p className="mt-1 text-3xl font-black leading-none" style={{ color: accent }}>{value}</p>
    {sub && <p className="mt-1 text-[10px] text-white/30">{sub}</p>}
  </motion.div>
);

// ─── tournament teaser ────────────────────────────────────────────────────────
const NEXT = {
  name: 'BLAST Premier World Final',
  date: new Date(Date.now() + 96 * 3600_000),
  prize: '500 000 $',
};

const useCountdown = (target: Date) => {
  const calc = () => {
    const diff = Math.max(0, target.getTime() - Date.now());
    const h = String(Math.floor(diff / 3600_000)).padStart(2, '0');
    const m = String(Math.floor((diff % 3600_000) / 60_000)).padStart(2, '0');
    const s = String(Math.floor((diff % 60_000) / 1000)).padStart(2, '0');
    return { h, m, s };
  };
  const [t, setT] = useState(calc);
  useEffect(() => {
    const id = setInterval(() => setT(calc()), 1000);
    return () => clearInterval(id);
  });
  return t;
};

const TournamentTeaser: React.FC<{ onNavigate?: (p: string) => void }> = ({ onNavigate }) => {
  const cd = useCountdown(NEXT.date);
  return (
    <motion.div
      variants={fadeUp}
      className="relative overflow-hidden rounded-2xl border border-[#FF4654]/20 bg-[#FF4654]/5 p-4"
    >
      <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-[#FF4654]/8 blur-2xl" />
      <div className="flex items-start justify-between gap-3">
        <div>
          <span className="mb-1.5 inline-block rounded-full bg-[#FF4654]/20 px-2 py-0.5 text-[9px] font-extrabold uppercase tracking-wider text-[#FF4654]">
            📅 Prochain tournoi majeur
          </span>
          <h3 className="text-sm font-extrabold leading-tight text-white">{NEXT.name}</h3>
          <p className="mt-0.5 text-[10px] text-white/30">Dotation {NEXT.prize}</p>
        </div>
        <div className="shrink-0 text-right font-mono">
          <p className="text-[9px] text-white/30 mb-1">DÉBUT DANS</p>
          <p className="text-xl font-black tabular-nums text-[#FF4654]">
            {cd.h}:{cd.m}:{cd.s}
          </p>
        </div>
      </div>
      <motion.button
        whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }} transition={spring}
        onClick={() => onNavigate?.('tournaments')}
        className="mt-3 w-full rounded-xl bg-[#FF4654] py-2.5 text-xs font-extrabold uppercase tracking-[0.15em] text-white hover:bg-[#e03040] transition"
      >
        Voir tous les tournois →
      </motion.button>
    </motion.div>
  );
};

// ─── live match strip ─────────────────────────────────────────────────────────
const LiveStrip: React.FC<{ onNavigate?: (p: string) => void }> = ({ onNavigate }) => (
  <motion.button
    variants={fadeUp}
    whileHover={{ scale: 1.015 }} whileTap={{ scale: 0.985 }} transition={spring}
    onClick={() => onNavigate?.('tournaments')}
    className="flex w-full items-center gap-3 rounded-2xl border border-white/[0.06] bg-white/[0.025] p-3.5 text-left backdrop-blur-sm"
  >
    <div className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#FF4654]/15">
      <span className="relative flex h-2.5 w-2.5">
        <span className="ping-slow absolute inline-flex h-full w-full rounded-full bg-[#FF4654] opacity-60" />
        <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-[#FF4654]" />
      </span>
    </div>
    <div className="min-w-0 flex-1">
      <p className="text-[9px] font-extrabold uppercase tracking-widest text-[#FF4654]">En direct</p>
      <p className="truncate text-sm font-bold text-white">NAVI vs LOUD · VCT Champions 2025</p>
      <p className="text-[10px] text-white/30">Ascent · Map 2 · Semi-finale</p>
    </div>
    <div className="shrink-0 font-black text-white">
      <span className="text-[#FFD700]">10</span>
      <span className="mx-1 text-white/30 text-sm">:</span>
      <span className="text-[#00CC44]">8</span>
    </div>
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-4 w-4 shrink-0 text-white/30">
      <polyline points="9 18 15 12 9 6"/>
    </svg>
  </motion.button>
);

// ─── product card ─────────────────────────────────────────────────────────────
const PCard: React.FC<{ name: string; price: string; img?: string; onBuy?: (p: Product) => void }> = ({
  name, price, img, onBuy,
}) => (
  <motion.button
    variants={fadeUp}
    whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} transition={spring}
    onClick={() => onBuy?.({ name, price, image: img })}
    className="overflow-hidden rounded-2xl border border-white/[0.06] bg-white/[0.025] text-left"
  >
    <div className="h-32 w-full bg-white/[0.03]">
      {img ? (
        <img src={img} alt={name} className="h-full w-full object-cover" />
      ) : (
        <div className="flex h-full items-center justify-center text-3xl text-white/10">🛍</div>
      )}
    </div>
    <div className="p-3">
      <p className="truncate text-xs font-bold text-white">{name}</p>
      <p className="mt-0.5 text-sm font-extrabold text-[#FF4654]">{price}</p>
    </div>
  </motion.button>
);

// ─── page ─────────────────────────────────────────────────────────────────────
export const HomePage: React.FC<HomePageProps> = ({ onNavigate, onBuyProduct }) => {
  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
    let alive = true;
    platformApi.getProducts().then(res => {
      if (!alive || !res.success || !res.products) return;
      setProducts(res.products.map(p => ({
        name: p.name,
        price: `€${Number(p.price).toFixed(2)}`,
        image: p.image_url,
      })));
    }).catch(() => {});
    return () => { alive = false; };
  }, []);

  return (
    <main className="flex-1 overflow-y-auto pb-28">
      <motion.div
        variants={stagger}
        initial="hidden"
        animate="show"
        className="space-y-5 px-4 pt-5"
      >

        {/* Live match strip */}
        <motion.div variants={fadeUp}>
          <LiveStrip onNavigate={onNavigate} />
        </motion.div>

        {/* Quick stats */}
        <section>
          <Label>Vos performances</Label>
          <motion.div variants={stagger} className="mt-2.5 grid grid-cols-3 gap-2.5">
            <StatTile label="Rang"    value="D1"    sub="Diamant 1"    accent="#9d4edd" />
            <StatTile label="K/D"     value="1.45"  sub="+0.05 ce mois" accent="#22d3ee" />
            <StatTile label="Win Rate" value="62%"  sub="68 victoires"  accent="#FF4654" />
          </motion.div>
          <motion.button
            variants={fadeUp}
            whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} transition={spring}
            onClick={() => onNavigate?.('stats')}
            className="mt-2.5 w-full rounded-xl border border-white/[0.06] bg-white/[0.02] py-2.5 text-xs font-bold uppercase tracking-[0.15em] text-white/50 hover:text-white hover:bg-white/[0.05] transition"
          >
            Voir les stats complètes →
          </motion.button>
        </section>

        {/* Next tournament countdown */}
        <section>
          <Label>Compétition</Label>
          <div className="mt-2.5">
            <TournamentTeaser onNavigate={onNavigate} />
          </div>
        </section>

        {/* Shop */}
        {products.length > 0 && (
          <section>
            <div className="flex items-center justify-between">
              <Label>Boutique</Label>
              <button
                onClick={() => onNavigate?.('shop')}
                className="text-[10px] font-bold text-white/30 hover:text-white transition uppercase tracking-wide"
              >
                Tout voir →
              </button>
            </div>
            <motion.div variants={stagger} className="mt-2.5 grid grid-cols-2 gap-3">
              {products.slice(0, 2).map((p, i) => (
                <PCard
                  key={i}
                  name={p.name}
                  price={p.price ?? ''}
                  img={p.image}
                  onBuy={onBuyProduct}
                />
              ))}
            </motion.div>
          </section>
        )}

      </motion.div>
    </main>
  );
};
