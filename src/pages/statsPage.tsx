import React, { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Avatar } from '../components/Avatar';

interface User { id: string; username: string; email: string; riotId?: string; tagLine?: string; }
interface StatsPageProps { user: User; onNavigate: (p: string) => void; }
interface ManualStats { rank: string; rr: number; winRate: number; kd: number; adr: number; }
interface ValorantAgent { uuid: string; displayName: string; fullPortrait: string; }

const RANKS = [
  'Iron 1','Iron 2','Iron 3','Bronze 1','Bronze 2','Bronze 3',
  'Silver 1','Silver 2','Silver 3','Gold 1','Gold 2','Gold 3',
  'Platinum 1','Platinum 2','Platinum 3','Diamond 1','Diamond 2','Diamond 3',
  'Ascendant 1','Ascendant 2','Ascendant 3','Immortal 1','Immortal 2','Immortal 3','Radiant',
];
const RANK_COLOR: Record<string, string> = {
  Iron: '#6b7280', Bronze: '#d97706', Silver: '#d1d5db', Gold: '#fbbf24',
  Platinum: '#22d3ee', Diamond: '#818cf8', Ascendant: '#34d399', Immortal: '#f87171', Radiant: '#fbbf24',
};
const getRankColor = (rank: string) => RANK_COLOR[rank.split(' ')[0]] ?? '#71717a';

const loadStats = (uid: string): ManualStats | null => {
  try { const r = localStorage.getItem(`stats-v2-${uid}`); return r ? JSON.parse(r) : null; } catch { return null; }
};
const saveStats = (uid: string, s: ManualStats) => localStorage.setItem(`stats-v2-${uid}`, JSON.stringify(s));

const sp = { type: 'spring' as const, stiffness: 360, damping: 28 };

const RRRing: React.FC<{ rr: number; color: string }> = ({ rr, color }) => {
  const sz = 96; const r = 38; const c = 2 * Math.PI * r;
  return (
    <svg width={sz} height={sz} style={{ transform: 'rotate(-90deg)' }}>
      <circle cx={sz/2} cy={sz/2} r={r} fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth={8} />
      <circle cx={sz/2} cy={sz/2} r={r} fill="none" stroke={color} strokeWidth={8}
        strokeDasharray={c} strokeDashoffset={c * (1 - Math.min(rr/100, 1))} strokeLinecap="round"
        style={{ transition: 'stroke-dashoffset 0.8s ease' }} />
    </svg>
  );
};

const EditModal: React.FC<{ initial: ManualStats; onSave: (s: ManualStats) => void; onClose: () => void }> =
  ({ initial, onSave, onClose }) => {
  const [form, setForm] = useState(initial);
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm"
      onClick={onClose}>
      <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} transition={sp}
        className="w-full max-w-md overflow-hidden rounded-2xl p-6"
        style={{ background: 'var(--card)', border: '1px solid var(--border)' }}
        onClick={e => e.stopPropagation()}>
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-[17px] font-bold">Modifier mes stats</h2>
          <button onClick={onClose} className="h-7 w-7 rounded-lg text-[16px] transition hover:bg-white/10" style={{ color: 'var(--text3)' }}>✕</button>
        </div>
        <div className="space-y-4">
          <div>
            <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-widest" style={{ color: 'var(--text3)' }}>Rang</label>
            <select value={form.rank} onChange={e => setForm({ ...form, rank: e.target.value })}
              className="input w-full px-3 py-2.5 text-[14px]">
              <option value="">Non classé</option>
              {RANKS.map(r => <option key={r} value={r} style={{ background: 'var(--card)' }}>{r}</option>)}
            </select>
          </div>
          <div>
            <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-widest" style={{ color: 'var(--text3)' }}>RR (0–100)</label>
            <input type="number" min={0} max={100} value={form.rr}
              onChange={e => setForm({ ...form, rr: Math.max(0, Math.min(100, Number(e.target.value))) })}
              className="input w-full px-3 py-2.5 text-[14px]" />
          </div>
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: 'K/D', val: form.kd, key: 'kd', step: 0.01, min: 0 },
              { label: 'Win %', val: form.winRate, key: 'winRate', step: 1, min: 0, max: 100 },
              { label: 'ADR', val: form.adr, key: 'adr', step: 1, min: 0 },
            ].map(f => (
              <div key={f.key}>
                <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-widest" style={{ color: 'var(--text3)' }}>{f.label}</label>
                <input type="number" min={f.min} max={(f as any).max} step={f.step} value={f.val}
                  onChange={e => setForm({ ...form, [f.key]: Math.max(f.min, Number(e.target.value)) })}
                  className="input w-full px-3 py-2.5 text-[14px]" />
              </div>
            ))}
          </div>
        </div>
        <motion.button whileTap={{ scale: 0.97 }} transition={sp}
          onClick={() => { onSave(form); onClose(); }}
          className="btn-primary mt-5 w-full py-3 text-[14px]">
          Enregistrer
        </motion.button>
      </motion.div>
    </motion.div>
  );
};

const NoRiot: React.FC<{ onNavigate: (p: string) => void }> = ({ onNavigate }) => (
  <div className="page-enter flex h-full items-center justify-center p-6">
    <div className="card flex w-full max-w-sm flex-col items-center gap-5 p-10 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl" style={{ background: 'rgba(239,68,68,0.1)' }}>
        <span className="text-2xl font-black" style={{ color: 'var(--red)' }}>R</span>
      </div>
      <div>
        <h2 className="text-[18px] font-bold">Connecte ton compte Riot</h2>
        <p className="mt-1.5 text-[14px] leading-relaxed" style={{ color: 'var(--text2)' }}>
          Valide ton identité Riot pour accéder à ta page de statistiques.
        </p>
      </div>
      <motion.button whileTap={{ scale: 0.97 }} transition={sp}
        onClick={() => onNavigate('profile')}
        className="btn-primary px-6 py-2.5 text-[14px]">
        Connecter dans le profil →
      </motion.button>
    </div>
  </div>
);

export const StatsPage: React.FC<StatsPageProps> = ({ user, onNavigate }) => {
  const hasRiot = !!(user.riotId && user.tagLine);
  const [stats, setStats]         = useState<ManualStats>(() => loadStats(user.id) ?? { rank: 'Gold 2', rr: 45, winRate: 54, kd: 1.2, adr: 145 });
  const [showModal, setShowModal] = useState(false);
  const [agents, setAgents]       = useState<ValorantAgent[]>([]);
  const [showAll, setShowAll]     = useState(false);

  useEffect(() => {
    fetch('https://valorant-api.com/v1/agents?isPlayableCharacter=true')
      .then(r => r.json()).then(d => { if (d.status === 200) setAgents(d.data ?? []); }).catch(() => {});
  }, []);

  const rankColor = getRankColor(stats.rank);

  if (!hasRiot) return <NoRiot onNavigate={onNavigate} />;

  const statCards = [
    { label: 'K/D Ratio',     value: stats.kd.toFixed(2),  color: 'var(--blue)',  sub: 'Moyenne' },
    { label: 'Win Rate',      value: `${stats.winRate}%`,  color: stats.winRate >= 50 ? 'var(--green)' : 'var(--red)', sub: `${stats.winRate >= 50 ? 'Positif' : 'À améliorer'}` },
    { label: 'ADR',           value: String(stats.adr),    color: 'var(--amber)', sub: 'Dégâts/round' },
    { label: 'Rank Rating',   value: `${stats.rr} RR`,     color: rankColor,      sub: stats.rank || 'Non classé' },
  ];

  return (
    <div className="page-enter p-6 space-y-6">

      {/* Edit button */}
      <div className="flex items-center justify-between">
        <div />
        <button onClick={() => setShowModal(true)}
          className="btn-ghost px-4 py-2 text-[13px]">
          ✎ Modifier mes stats
        </button>
      </div>

      {/* Two-column layout */}
      <div className="grid grid-cols-3 gap-6">

        {/* Left: profile */}
        <div className="col-span-1 space-y-4">
          <div className="card p-6 flex flex-col items-center gap-4">
            <Avatar username={user.username} size="lg" showBorder />
            <div className="text-center">
              <h2 className="text-[18px] font-bold">
                {user.riotId}
                <span style={{ color: 'var(--text3)' }}>#{user.tagLine}</span>
              </h2>
              <p className="mt-0.5 text-[12px] font-semibold" style={{ color: 'var(--green)' }}>Vérifié Riot ✓</p>
            </div>

            <div className="relative flex items-center justify-center">
              <RRRing rr={stats.rr} color={rankColor} />
              <div className="absolute flex flex-col items-center">
                <span className="text-[14px] font-bold tabular-nums" style={{ color: rankColor }}>{stats.rr}</span>
                <span className="text-[10px]" style={{ color: 'var(--text3)' }}>RR</span>
              </div>
            </div>

            {stats.rank && (
              <div className="rounded-lg px-4 py-2 text-center"
                style={{ background: `${rankColor}15`, border: `1px solid ${rankColor}25` }}>
                <p className="text-[15px] font-bold" style={{ color: rankColor }}>{stats.rank}</p>
              </div>
            )}
          </div>

          {/* Agent favori info */}
          {agents[0] && (
            <div className="card p-4">
              <p className="text-[11px] font-semibold uppercase tracking-widest mb-3" style={{ color: 'var(--text3)' }}>Agent principal</p>
              <div className="flex items-center gap-3">
                <div className="h-14 w-14 overflow-hidden rounded-xl" style={{ background: 'var(--raised)' }}>
                  <img src={agents[0].fullPortrait} alt={agents[0].displayName} className="h-full w-full object-cover object-top" />
                </div>
                <div>
                  <p className="text-[15px] font-bold">{agents[0].displayName}</p>
                  <p className="text-[12px]" style={{ color: 'var(--text3)' }}>78 parties · 68% WR</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right: stats + agents */}
        <div className="col-span-2 space-y-5">

          {/* Stats grid */}
          <div className="grid grid-cols-2 gap-4">
            {statCards.map((s, i) => (
              <motion.div key={s.label}
                initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                transition={{ ...sp, delay: i * 0.06 }}
                className="card p-5">
                <p className="text-[11px] font-semibold uppercase tracking-widest mb-2" style={{ color: 'var(--text3)' }}>{s.label}</p>
                <p className="text-[32px] font-black leading-none" style={{ color: s.color }}>{s.value}</p>
                <p className="mt-1.5 text-[12px]" style={{ color: 'var(--text3)' }}>{s.sub}</p>
              </motion.div>
            ))}
          </div>

          {/* Agents table */}
          {agents.length > 0 && (
            <div className="card overflow-hidden">
              <div className="flex items-center justify-between px-5 py-3.5"
                style={{ borderBottom: '1px solid var(--border)' }}>
                <p className="text-[13px] font-semibold">Agents Valorant</p>
                <button onClick={() => setShowAll(v => !v)} className="text-[12px] font-semibold" style={{ color: 'var(--violet2)' }}>
                  {showAll ? 'Réduire' : 'Voir tout'}
                </button>
              </div>
              <div className="divide-y" style={{ borderColor: 'var(--border)' }}>
                {(showAll ? agents : agents.slice(0, 8)).map((agent, i) => (
                  <motion.div key={agent.uuid}
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                    transition={{ ...sp, delay: i * 0.03 }}
                    className="flex items-center gap-4 px-5 py-3 transition hover:bg-white/[0.02]">
                    <span className="w-5 text-center text-[12px] tabular-nums" style={{ color: 'var(--text3)' }}>{i + 1}</span>
                    <div className="h-9 w-9 overflow-hidden rounded-lg" style={{ background: 'var(--raised)' }}>
                      <img src={agent.fullPortrait} alt={agent.displayName} className="h-full w-full object-cover object-top" />
                    </div>
                    <p className="flex-1 text-[14px] font-medium">{agent.displayName}</p>
                    <div className="flex items-center gap-3">
                      <div className="h-1.5 w-32 overflow-hidden rounded-full" style={{ background: 'var(--raised)' }}>
                        <motion.div
                          initial={{ width: 0 }} animate={{ width: `${Math.max(10, 90 - i * 6)}%` }}
                          transition={{ duration: 0.7, delay: i * 0.04, ease: 'easeOut' }}
                          className="h-full rounded-full" style={{ background: 'var(--violet)' }}
                        />
                      </div>
                      <span className="w-8 text-right text-[12px] tabular-nums" style={{ color: 'var(--text3)' }}>
                        {Math.max(10, 90 - i * 6)}%
                      </span>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      <AnimatePresence>
        {showModal && (
          <EditModal initial={stats} onSave={s => { setStats(s); saveStats(user.id, s); }} onClose={() => setShowModal(false)} />
        )}
      </AnimatePresence>
    </div>
  );
};
