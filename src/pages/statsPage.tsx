import React, { useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Avatar } from '../components/Avatar';
import { platformApi } from '../services/platformApi';

interface User {
  id: string;
  username: string;
  email: string;
  riotId?: string;
  tagLine?: string;
}

interface StatsPageProps {
  user: User;
  onNavigate: (page: string) => void;
}

interface ManualStats {
  rank: string;
  rr: number;
  winRate: number;
  kd: number;
  adr: number;
}

interface ValorantAgent {
  uuid: string;
  displayName: string;
  fullPortrait: string;
  isPlayable?: boolean;
}

// ─── constants ────────────────────────────────────────────────────────────────

const RANKS = [
  'Iron 1','Iron 2','Iron 3',
  'Bronze 1','Bronze 2','Bronze 3',
  'Silver 1','Silver 2','Silver 3',
  'Gold 1','Gold 2','Gold 3',
  'Platinum 1','Platinum 2','Platinum 3',
  'Diamond 1','Diamond 2','Diamond 3',
  'Ascendant 1','Ascendant 2','Ascendant 3',
  'Immortal 1','Immortal 2','Immortal 3',
  'Radiant',
];

const RANK_COLOR: Record<string, string> = {
  Iron: '#6b7280', Bronze: '#d97706', Silver: '#d1d5db',
  Gold: '#fbbf24', Platinum: '#22d3ee', Diamond: '#818cf8',
  Ascendant: '#34d399', Immortal: '#f87171', Radiant: '#fbbf24',
};

const getRankColor = (rank: string) => {
  const tier = RANKS.find(r => r === rank)?.split(' ')[0] ?? '';
  return RANK_COLOR[tier] ?? '#6b7280';
};

const STATS_KEY = 'stats-v2';

const loadStats = (userId: string): ManualStats | null => {
  try {
    const raw = localStorage.getItem(`${STATS_KEY}-${userId}`);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
};

const saveStats = (userId: string, s: ManualStats) => {
  localStorage.setItem(`${STATS_KEY}-${userId}`, JSON.stringify(s));
};

const spring = { type: 'spring' as const, stiffness: 320, damping: 28 };
const fadeUp = { hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0, transition: spring } };
const stagger = { show: { transition: { staggerChildren: 0.06 } } };

// ─── sub-components ───────────────────────────────────────────────────────────

const StatCard: React.FC<{ label: string; value: string; accent?: string; sub?: string }> = ({ label, value, accent, sub }) => (
  <motion.div
    variants={fadeUp}
    whileHover={{ scale: 1.025 }}
    transition={spring}
    className="flex flex-col gap-1 rounded-2xl border border-white/[0.07] bg-white/[0.03] p-4 backdrop-blur-sm"
  >
    <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-white/40">{label}</p>
    <p className="text-2xl font-extrabold leading-none" style={accent ? { color: accent } : {}}>
      {value}
    </p>
    {sub && <p className="text-[10px] text-white/30">{sub}</p>}
  </motion.div>
);

// ─── Stats edit modal ─────────────────────────────────────────────────────────

const StatsModal: React.FC<{
  initial: ManualStats;
  onSave: (s: ManualStats) => void;
  onClose: () => void;
}> = ({ initial, onSave, onClose }) => {
  const [form, setForm] = useState(initial);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 backdrop-blur-sm sm:items-center"
      onClick={onClose}
    >
      <motion.div
        initial={{ y: 60, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 60, opacity: 0 }}
        transition={spring}
        onClick={e => e.stopPropagation()}
        className="w-full max-w-sm rounded-t-3xl border border-white/[0.08] bg-[#0d1829] p-6 sm:rounded-3xl"
      >
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-lg font-extrabold">Mes statistiques</h2>
          <button onClick={onClose} className="text-white/40 hover:text-white">✕</button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-widest text-white/40">Rang</label>
            <select
              value={form.rank}
              onChange={e => setForm({ ...form, rank: e.target.value })}
              className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-sm font-semibold text-white outline-none focus:border-blue-500"
            >
              <option value="">Non classé</option>
              {RANKS.map(r => <option key={r} value={r} className="bg-[#0d1829]">{r}</option>)}
            </select>
          </div>

          <div>
            <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-widest text-white/40">RR (0–100)</label>
            <input
              type="number" min={0} max={100}
              value={form.rr}
              onChange={e => setForm({ ...form, rr: Math.max(0, Math.min(100, Number(e.target.value))) })}
              className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-sm font-semibold text-white outline-none focus:border-blue-500"
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-widest text-white/40">K/D</label>
              <input
                type="number" min={0} step={0.01}
                value={form.kd}
                onChange={e => setForm({ ...form, kd: Math.max(0, Number(e.target.value)) })}
                className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-sm font-semibold text-white outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-widest text-white/40">Win %</label>
              <input
                type="number" min={0} max={100}
                value={form.winRate}
                onChange={e => setForm({ ...form, winRate: Math.max(0, Math.min(100, Number(e.target.value))) })}
                className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-sm font-semibold text-white outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-widest text-white/40">ADR</label>
              <input
                type="number" min={0}
                value={form.adr}
                onChange={e => setForm({ ...form, adr: Math.max(0, Number(e.target.value)) })}
                className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-sm font-semibold text-white outline-none focus:border-blue-500"
              />
            </div>
          </div>
        </div>

        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          transition={spring}
          onClick={() => { onSave(form); onClose(); }}
          className="mt-6 w-full rounded-xl bg-blue-600 py-3 text-sm font-extrabold uppercase tracking-wide text-white hover:bg-blue-500"
        >
          Enregistrer
        </motion.button>
      </motion.div>
    </motion.div>
  );
};

// ─── No Riot connected ────────────────────────────────────────────────────────

const NoRiotConnected: React.FC<{ onNavigate: (p: string) => void }> = ({ onNavigate }) => (
  <main className="flex flex-1 flex-col items-center justify-center px-6 pb-24 text-center">
    <motion.div
      initial={{ opacity: 0, scale: 0.92 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={spring}
      className="flex w-full max-w-xs flex-col items-center gap-5 rounded-3xl border border-white/[0.07] bg-white/[0.03] p-8 backdrop-blur-sm"
    >
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-red-500/10">
        <span className="text-3xl font-black text-red-400">R</span>
      </div>
      <div>
        <h2 className="text-lg font-extrabold">Connecte ton compte Riot</h2>
        <p className="mt-1 text-sm leading-relaxed text-white/50">
          Valide ton identité Riot pour accéder à ta page de statistiques.
        </p>
      </div>
      <motion.button
        whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} transition={spring}
        onClick={() => onNavigate('profile')}
        className="w-full rounded-xl bg-red-600 py-3 text-sm font-extrabold uppercase tracking-wide text-white hover:bg-red-500"
      >
        Connecter dans le profil →
      </motion.button>
    </motion.div>
  </main>
);

// ─── Main ─────────────────────────────────────────────────────────────────────

export const StatsPage: React.FC<StatsPageProps> = ({ user, onNavigate }) => {
  const hasRiot = !!(user.riotId && user.tagLine);

  const defaultStats: ManualStats = { rank: 'Gold 2', rr: 45, winRate: 54, kd: 1.2, adr: 145 };
  const [stats, setStats] = useState<ManualStats>(() => loadStats(user.id) ?? defaultStats);
  const [showModal, setShowModal] = useState(false);
  const [agents, setAgents] = useState<ValorantAgent[]>([]);
  const [showAllAgents, setShowAllAgents] = useState(false);

  // Load Valorant agents (free, no key)
  useEffect(() => {
    fetch('https://valorant-api.com/v1/agents?isPlayableCharacter=true')
      .then(r => r.json())
      .then(data => { if (data.status === 200) setAgents(data.data ?? []); })
      .catch(() => {});
  }, []);

  const handleSave = (s: ManualStats) => {
    setStats(s);
    saveStats(user.id, s);
  };

  const rankColor = getRankColor(stats.rank);
  const displayedAgents = showAllAgents ? agents : agents.slice(0, 5);

  if (!hasRiot) return (
    <div className="flex min-h-screen flex-col bg-[#050d1a]">
      <header className="flex items-center justify-between border-b border-white/[0.06] px-4 py-4">
        <button type="button" onClick={() => onNavigate('home')} className="text-white/50 transition hover:text-white">←</button>
        <span className="text-sm font-extrabold uppercase tracking-widest">Statistiques</span>
        <div className="w-6" />
      </header>
      <NoRiotConnected onNavigate={onNavigate} />
    </div>
  );

  return (
    <main className="flex-1 overflow-y-auto bg-[#050d1a] pb-24">
      {/* Header */}
      <header className="sticky top-0 z-20 flex items-center justify-between border-b border-white/[0.06] bg-[#050d1a]/90 px-4 py-4 backdrop-blur-md">
        <button type="button" onClick={() => onNavigate('home')} className="text-white/50 transition hover:text-white">←</button>
        <span className="text-sm font-extrabold uppercase tracking-widest">Statistiques</span>
        <button
          type="button"
          onClick={() => setShowModal(true)}
          className="text-xs font-bold text-blue-400 transition hover:text-blue-300"
        >
          Modifier
        </button>
      </header>

      <motion.div variants={stagger} initial="hidden" animate="show" className="px-4 pt-6">

        {/* Profile card */}
        <motion.div
          variants={fadeUp}
          className="relative mb-6 overflow-hidden rounded-3xl border border-white/[0.07] bg-white/[0.03] backdrop-blur-sm"
        >
          <div className="flex flex-col items-center gap-3 py-7">
            <Avatar username={user.username} size="lg" showBorder />
            <div className="text-center">
              <h1 className="text-2xl font-extrabold">
                {user.riotId}
                <span className="font-normal text-white/30">#{user.tagLine}</span>
              </h1>
              <p className="mt-0.5 text-[11px] font-semibold text-green-400">Compte Riot vérifié ✓</p>
            </div>

            {stats.rank ? (
              <div
                className="flex items-center gap-2 rounded-xl px-4 py-2"
                style={{ backgroundColor: `${rankColor}18`, border: `1px solid ${rankColor}30` }}
              >
                <span className="text-sm font-extrabold" style={{ color: rankColor }}>{stats.rank}</span>
                <span className="text-xs text-white/40">{stats.rr} RR</span>
              </div>
            ) : (
              <div className="rounded-xl border border-white/10 px-4 py-2">
                <span className="text-sm text-white/40">Non classé</span>
              </div>
            )}
          </div>
        </motion.div>

        {/* Stats grid */}
        <motion.div variants={stagger} className="mb-6 grid grid-cols-2 gap-3">
          <StatCard label="K/D Ratio"      value={stats.kd.toFixed(2)}      accent="#60a5fa" />
          <StatCard label="Taux victoire"  value={`${stats.winRate}%`}      accent={stats.winRate >= 50 ? '#34d399' : '#f87171'} />
          <StatCard label="Dégâts / Round" value={String(stats.adr)}        sub="ADR moyen" />
          <StatCard label="Rank Rating"    value={`${stats.rr} RR`}         accent={rankColor} />
        </motion.div>

        {/* Agents section */}
        {agents.length > 0 && (
          <motion.section variants={fadeUp} className="mb-4">
            <div className="mb-3 flex items-center justify-between">
              <p className="text-[11px] font-extrabold uppercase tracking-[0.16em] text-white/40">Agents Valorant</p>
              <button
                onClick={() => setShowAllAgents(v => !v)}
                className="text-[11px] font-bold text-blue-400 hover:text-blue-300"
              >
                {showAllAgents ? 'Réduire' : 'Voir tout'}
              </button>
            </div>

            <motion.div variants={stagger} className="space-y-2">
              {displayedAgents.map((agent, i) => (
                <motion.div
                  key={agent.uuid}
                  variants={fadeUp}
                  whileHover={{ scale: 1.01 }}
                  transition={spring}
                  className="flex items-center gap-4 rounded-2xl border border-white/[0.07] bg-white/[0.03] p-3 backdrop-blur-sm"
                >
                  <div className="h-14 w-14 shrink-0 overflow-hidden rounded-xl bg-white/5">
                    <img
                      src={agent.fullPortrait}
                      alt={agent.displayName}
                      className="h-full w-full object-cover object-top"
                      onError={e => { (e.target as HTMLImageElement).style.opacity = '0'; }}
                    />
                  </div>
                  <div className="flex-1">
                    <p className="font-bold">{agent.displayName}</p>
                    <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-white/10">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${Math.max(20, 90 - i * 8)}%` }}
                        transition={{ duration: 0.8, delay: i * 0.05, ease: 'easeOut' }}
                        className="h-full rounded-full bg-blue-500"
                      />
                    </div>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          </motion.section>
        )}

      </motion.div>

      {/* Stats modal */}
      <AnimatePresence>
        {showModal && (
          <StatsModal
            initial={stats}
            onSave={handleSave}
            onClose={() => setShowModal(false)}
          />
        )}
      </AnimatePresence>
    </main>
  );
};
