import React, { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// ─── Types ────────────────────────────────────────────────────────────────────

type Tab      = 'tierlist' | 'leaderboard' | 'matchups';
type AgentRole = 'All' | 'Duelist' | 'Controller' | 'Initiator' | 'Sentinel';
type SortKey  = 'tier' | 'wr' | 'pr' | 'kd' | 'ban';

interface AgentStat {
  name: string;
  role: Exclude<AgentRole, 'All'>;
  tier: string;
  wr: number; pr: number; ban: number; kd: number; games: number;
}

interface ValorantAgent {
  uuid: string;
  displayName: string;
  displayIcon: string;
  role: { displayName: string } | null;
}

interface ProPlayer {
  id: number;
  name: string;
  first_name: string | null;
  last_name: string | null;
  nationality: string | null;
  role: string | null;
  current_team: { name: string; image_url: string | null; acronym: string | null } | null;
}

// ─── Static data ──────────────────────────────────────────────────────────────

const TIER_ORDER = ['S+', 'S', 'A', 'B', 'C'] as const;

const TIER_BADGE: Record<string, { bg: string; color: string }> = {
  'S+': { bg: 'rgba(251,191,36,0.13)',  color: '#fbbf24' },
  'S':  { bg: 'rgba(167,139,250,0.13)', color: '#a78bfa' },
  'A':  { bg: 'rgba(96,165,250,0.13)',  color: '#60a5fa' },
  'B':  { bg: 'rgba(74,222,128,0.13)',  color: '#4ade80' },
  'C':  { bg: 'rgba(248,113,113,0.13)', color: '#f87171' },
};

const ROLE_COLOR: Record<string, string> = {
  Duelist:    '#ff4655',
  Controller: '#4ade80',
  Initiator:  '#fbbf24',
  Sentinel:   '#60a5fa',
};

const ROLES: AgentRole[] = ['All', 'Duelist', 'Controller', 'Initiator', 'Sentinel'];

const AGENT_STATS: AgentStat[] = [
  { name: 'Jett',      role: 'Duelist',    tier: 'S+', wr: 54.2, pr: 12.5, ban: 8.3, kd: 1.28, games: 892341 },
  { name: 'Reyna',     role: 'Duelist',    tier: 'S+', wr: 52.8, pr: 18.3, ban: 3.1, kd: 1.35, games: 1234567 },
  { name: 'Neon',      role: 'Duelist',    tier: 'S',  wr: 51.9, pr: 8.2,  ban: 2.4, kd: 1.22, games: 456789 },
  { name: 'Iso',       role: 'Duelist',    tier: 'S',  wr: 51.3, pr: 6.1,  ban: 1.8, kd: 1.19, games: 312456 },
  { name: 'Raze',      role: 'Duelist',    tier: 'A',  wr: 50.1, pr: 9.4,  ban: 5.2, kd: 1.15, games: 678234 },
  { name: 'Phoenix',   role: 'Duelist',    tier: 'B',  wr: 48.6, pr: 4.2,  ban: 0.8, kd: 1.08, games: 234567 },
  { name: 'Yoru',      role: 'Duelist',    tier: 'B',  wr: 47.9, pr: 3.8,  ban: 0.5, kd: 1.04, games: 198234 },
  { name: 'Omen',      role: 'Controller', tier: 'S+', wr: 53.4, pr: 14.2, ban: 4.6, kd: 1.18, games: 876543 },
  { name: 'Clove',     role: 'Controller', tier: 'S+', wr: 53.1, pr: 11.8, ban: 6.3, kd: 1.21, games: 567890 },
  { name: 'Viper',     role: 'Controller', tier: 'S',  wr: 52.3, pr: 10.5, ban: 7.9, kd: 1.12, games: 723456 },
  { name: 'Brimstone', role: 'Controller', tier: 'A',  wr: 50.8, pr: 7.3,  ban: 1.2, kd: 1.09, games: 534678 },
  { name: 'Astra',     role: 'Controller', tier: 'A',  wr: 50.2, pr: 5.1,  ban: 2.8, kd: 1.07, games: 312456 },
  { name: 'Harbor',    role: 'Controller', tier: 'C',  wr: 45.8, pr: 2.1,  ban: 0.3, kd: 0.98, games: 123456 },
  { name: 'Sova',      role: 'Initiator',  tier: 'S',  wr: 52.1, pr: 11.3, ban: 3.4, kd: 1.14, games: 789123 },
  { name: 'Skye',      role: 'Initiator',  tier: 'S',  wr: 51.8, pr: 9.7,  ban: 2.9, kd: 1.11, games: 634567 },
  { name: 'Fade',      role: 'Initiator',  tier: 'A',  wr: 50.9, pr: 8.4,  ban: 3.1, kd: 1.13, games: 512345 },
  { name: 'Gekko',     role: 'Initiator',  tier: 'A',  wr: 50.4, pr: 7.8,  ban: 2.2, kd: 1.10, games: 445678 },
  { name: 'KAY/O',     role: 'Initiator',  tier: 'A',  wr: 49.8, pr: 6.9,  ban: 1.7, kd: 1.08, games: 398765 },
  { name: 'Breach',    role: 'Initiator',  tier: 'B',  wr: 48.9, pr: 4.3,  ban: 1.1, kd: 1.02, games: 276543 },
  { name: 'Chamber',   role: 'Sentinel',   tier: 'S',  wr: 52.7, pr: 10.8, ban: 5.7, kd: 1.25, games: 698765 },
  { name: 'Killjoy',   role: 'Sentinel',   tier: 'S',  wr: 52.4, pr: 12.1, ban: 4.8, kd: 1.16, games: 812345 },
  { name: 'Cypher',    role: 'Sentinel',   tier: 'A',  wr: 50.6, pr: 7.2,  ban: 2.4, kd: 1.10, games: 489234 },
  { name: 'Sage',      role: 'Sentinel',   tier: 'B',  wr: 49.1, pr: 9.8,  ban: 1.9, kd: 0.99, games: 623456 },
  { name: 'Deadlock',  role: 'Sentinel',   tier: 'C',  wr: 46.2, pr: 3.1,  ban: 0.7, kd: 0.97, games: 167890 },
  { name: 'Vyse',      role: 'Sentinel',   tier: 'C',  wr: 45.4, pr: 2.4,  ban: 0.4, kd: 0.94, games: 134567 },
];

const MATCHUP_DATA: Record<string, { weakTo: string[]; synergy: string[] }> = {
  'Jett':      { weakTo: ['KAY/O', 'Breach', 'Fade'],        synergy: ['Viper', 'Sova', 'Killjoy'] },
  'Reyna':     { weakTo: ['KAY/O', 'Skye', 'Breach'],        synergy: ['Omen', 'Sova', 'Killjoy'] },
  'Neon':      { weakTo: ['Chamber', 'Cypher', 'Killjoy'],   synergy: ['Viper', 'Omen', 'Sova'] },
  'Iso':       { weakTo: ['KAY/O', 'Breach', 'Skye'],        synergy: ['Viper', 'Omen', 'Fade'] },
  'Raze':      { weakTo: ['Cypher', 'Killjoy', 'Sage'],      synergy: ['Viper', 'Sova', 'Fade'] },
  'Phoenix':   { weakTo: ['Sage', 'KAY/O', 'Killjoy'],       synergy: ['Viper', 'Omen', 'Skye'] },
  'Yoru':      { weakTo: ['Cypher', 'KAY/O', 'Fade'],        synergy: ['Viper', 'Skye', 'Sova'] },
  'Omen':      { weakTo: ['Sova', 'Fade', 'KAY/O'],          synergy: ['Jett', 'Raze', 'Chamber'] },
  'Clove':     { weakTo: ['KAY/O', 'Sova', 'Breach'],        synergy: ['Jett', 'Chamber', 'Killjoy'] },
  'Viper':     { weakTo: ['Sova', 'Breach', 'KAY/O'],        synergy: ['Jett', 'Chamber', 'Fade'] },
  'Brimstone': { weakTo: ['Sova', 'Fade', 'Skye'],           synergy: ['Jett', 'Raze', 'Killjoy'] },
  'Astra':     { weakTo: ['Sova', 'KAY/O', 'Breach'],        synergy: ['Jett', 'Chamber', 'Killjoy'] },
  'Harbor':    { weakTo: ['Sova', 'Fade', 'Killjoy'],        synergy: ['Raze', 'Breach', 'Skye'] },
  'Sova':      { weakTo: ['Viper', 'Omen', 'Astra'],         synergy: ['Jett', 'Chamber', 'Killjoy'] },
  'Skye':      { weakTo: ['KAY/O', 'Killjoy', 'Cypher'],    synergy: ['Jett', 'Viper', 'Killjoy'] },
  'Fade':      { weakTo: ['KAY/O', 'Jett', 'Raze'],         synergy: ['Jett', 'Viper', 'Killjoy'] },
  'Gekko':     { weakTo: ['Cypher', 'Killjoy', 'KAY/O'],    synergy: ['Jett', 'Viper', 'Chamber'] },
  'KAY/O':     { weakTo: ['Viper', 'Cypher', 'Chamber'],    synergy: ['Viper', 'Killjoy', 'Chamber'] },
  'Breach':    { weakTo: ['Viper', 'Omen', 'Killjoy'],       synergy: ['Jett', 'Raze', 'Viper'] },
  'Chamber':   { weakTo: ['KAY/O', 'Killjoy', 'Breach'],    synergy: ['Viper', 'Skye', 'Fade'] },
  'Killjoy':   { weakTo: ['Viper', 'Raze', 'KAY/O'],        synergy: ['Viper', 'Sova', 'Chamber'] },
  'Cypher':    { weakTo: ['Raze', 'Breach', 'KAY/O'],        synergy: ['Viper', 'Omen', 'Sova'] },
  'Sage':      { weakTo: ['KAY/O', 'Breach', 'Raze'],        synergy: ['Jett', 'Omen', 'Sova'] },
  'Deadlock':  { weakTo: ['Raze', 'Breach', 'KAY/O'],        synergy: ['Viper', 'Sova', 'Omen'] },
  'Vyse':      { weakTo: ['KAY/O', 'Raze', 'Breach'],        synergy: ['Viper', 'Sova', 'Omen'] },
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

const toFlag = (code: string) =>
  code.toUpperCase().replace(/./g, c => String.fromCodePoint(c.charCodeAt(0) + 127397));

const fmt = (n: number) => n >= 1000000
  ? (n / 1000000).toFixed(1) + 'M'
  : n >= 1000 ? (n / 1000).toFixed(0) + 'k' : String(n);

// ─── Sub-components ───────────────────────────────────────────────────────────

const AgentPortrait: React.FC<{ name: string; icon?: string; size?: number }> = ({ name, icon, size = 36 }) => (
  <div className="rounded-full overflow-hidden flex-shrink-0 flex items-center justify-center"
    style={{ width: size, height: size, background: 'var(--raised)' }}>
    {icon
      ? <img src={icon} alt={name} className="h-full w-full object-cover" />
      : <span className="text-[11px] font-bold" style={{ color: 'var(--text2)' }}>{name[0]}</span>
    }
  </div>
);

const TierBadge: React.FC<{ tier: string }> = ({ tier }) => {
  const style = TIER_BADGE[tier] ?? { bg: 'var(--raised)', color: 'var(--text2)' };
  return (
    <span className="inline-block text-xs font-black px-2.5 py-0.5 rounded-md"
      style={{ background: style.bg, color: style.color }}>
      {tier}
    </span>
  );
};

const RoleBadge: React.FC<{ role: string }> = ({ role }) => (
  <span className="text-xs font-medium px-2 py-0.5 rounded-md"
    style={{ background: ROLE_COLOR[role] + '18', color: ROLE_COLOR[role] }}>
    {role}
  </span>
);

// ─── Main component ───────────────────────────────────────────────────────────

const ValorantStatsPage: React.FC = () => {
  const [tab,          setTab]          = useState<Tab>('tierlist');
  const [roleFilter,   setRoleFilter]   = useState<AgentRole>('All');
  const [search,       setSearch]       = useState('');
  const [sortKey,      setSortKey]      = useState<SortKey>('tier');
  const [sortAsc,      setSortAsc]      = useState(true);
  const [apiAgents,    setApiAgents]    = useState<Record<string, ValorantAgent>>({});
  const [proPlayers,   setProPlayers]   = useState<ProPlayer[]>([]);
  const [proLoading,   setProLoading]   = useState(false);
  const [proError,     setProError]     = useState<string | null>(null);
  const [selectedAgent, setSelectedAgent] = useState<string>('Jett');

  // Fetch real agent icons from valorant-api.com (no key needed)
  useEffect(() => {
    fetch('https://valorant-api.com/v1/agents?isPlayableCharacter=true')
      .then(r => r.json())
      .then(({ data }: { data: ValorantAgent[] }) => {
        const map: Record<string, ValorantAgent> = {};
        for (const a of data) map[a.displayName] = a;
        setApiAgents(map);
      })
      .catch(() => {});
  }, []);

  // Fetch pro players from PandaScore
  useEffect(() => {
    if (tab !== 'leaderboard') return;
    if (proPlayers.length > 0) return;
    setProLoading(true);
    setProError(null);
    const token = import.meta.env.VITE_PANDASCORE_TOKEN as string | undefined;
    fetch('https://api.pandascore.co/valorant/players?sort=-id&per_page=30', {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    })
      .then(r => r.json())
      .then((data: unknown) => {
        if (!Array.isArray(data)) throw new Error();
        setProPlayers(data as ProPlayer[]);
      })
      .catch(() => setProError('Impossible de charger les données'))
      .finally(() => setProLoading(false));
  }, [tab, proPlayers.length]);

  // Sorted & filtered tier list
  const filteredAgents = useMemo(() => {
    let list = [...AGENT_STATS];
    if (roleFilter !== 'All') list = list.filter(a => a.role === roleFilter);
    if (search.trim()) list = list.filter(a => a.name.toLowerCase().includes(search.toLowerCase()));
    list.sort((a, b) => {
      if (sortKey === 'tier') {
        const d = TIER_ORDER.indexOf(a.tier as typeof TIER_ORDER[number]) - TIER_ORDER.indexOf(b.tier as typeof TIER_ORDER[number]);
        return sortAsc ? d : -d;
      }
      const d = a[sortKey] - b[sortKey];
      return sortAsc ? -d : d;
    });
    return list;
  }, [roleFilter, search, sortKey, sortAsc]);

  const handleSort = (key: SortKey) => {
    if (key === sortKey) setSortAsc(v => !v);
    else { setSortKey(key); setSortAsc(true); }
  };

  const totalGames = useMemo(() => AGENT_STATS.reduce((s, a) => s + a.games, 0), []);
  const topPick    = useMemo(() => [...AGENT_STATS].sort((a, b) => b.pr  - a.pr)[0],  []);
  const topBanned  = useMemo(() => [...AGENT_STATS].sort((a, b) => b.ban - a.ban)[0], []);
  const sPlus      = AGENT_STATS.filter(a => a.tier === 'S+').length;

  const agentInfo = AGENT_STATS.find(a => a.name === selectedAgent);
  const matchup   = MATCHUP_DATA[selectedAgent];

  const SortArrow = ({ k }: { k: SortKey }) => sortKey !== k ? null : (
    <svg viewBox="0 0 10 6" fill="currentColor" className={`h-2.5 w-2.5 ml-1 inline-block transition-transform ${sortAsc ? '' : 'rotate-180'}`}>
      <path d="M5 0L0 6h10z"/>
    </svg>
  );

  // ── Matchup agent chip ──────────────────────────────────────────────────────
  const MatchupAgentCard: React.FC<{ name: string }> = ({ name }) => {
    const s    = AGENT_STATS.find(a => a.name === name);
    const icon = apiAgents[name]?.displayIcon;
    return (
      <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl"
        style={{ background: 'var(--raised)' }}>
        <AgentPortrait name={name} icon={icon} size={32} />
        <div className="flex-1 min-w-0">
          <div className="text-sm font-semibold truncate">{name}</div>
          {s && <div className="text-[11px]" style={{ color: 'var(--text3)' }}>{s.role}</div>}
        </div>
        {s && <TierBadge tier={s.tier} />}
      </div>
    );
  };

  return (
    <div className="p-6 space-y-5">

      {/* ─── Page header ──────────────────────────────────────── */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Stats Valorant</h1>
          <p className="text-sm mt-1" style={{ color: 'var(--text2)' }}>
            Tier list des agents, classement pro & analyse des matchups
          </p>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold"
          style={{ background: 'rgba(255,70,85,0.08)', color: '#ff6472', border: '1px solid rgba(255,70,85,0.2)' }}>
          <span className="h-1.5 w-1.5 rounded-full animate-pulse" style={{ background: '#ff4655' }} />
          Patch 10.04 Live
        </div>
      </div>

      {/* ─── Tab bar ──────────────────────────────────────────── */}
      <div className="flex gap-1 p-1 rounded-xl w-fit" style={{ background: 'var(--surface)' }}>
        {([
          { id: 'tierlist'   as Tab, label: 'Tier List',   icon: <svg viewBox="0 0 16 16" fill="currentColor" className="h-3.5 w-3.5"><path d="M2 2h4v4H2zM6 6h4v4H6zM10 2h4v4h-4zM2 10h4v4H2z"/><path d="M10 10l2 2 4-4" stroke="currentColor" fill="none" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round"/></svg> },
          { id: 'leaderboard'as Tab, label: 'Leaderboard', icon: <svg viewBox="0 0 16 16" fill="currentColor" className="h-3.5 w-3.5"><path d="M6 10H2v4h4v-4zM10 6H6v8h4V6zM14 2h-4v12h4V2z"/></svg> },
          { id: 'matchups'   as Tab, label: 'Matchups',    icon: <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" className="h-3.5 w-3.5"><circle cx="8" cy="8" r="6"/><circle cx="8" cy="8" r="2"/><path d="M8 2v2M8 12v2M2 8h2M12 8h2"/></svg> },
        ]).map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className="flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-medium transition-all"
            style={tab === t.id
              ? { background: 'var(--violet)', color: '#fff' }
              : { color: 'var(--text2)', background: 'transparent' }}>
            {t.icon}{t.label}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">

        {/* ═══════════════════════════════════════════════════════
            TAB — TIER LIST
        ══════════════════════════════════════════════════════════ */}
        {tab === 'tierlist' && (
          <motion.div key="tierlist"
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.18 }}
            className="space-y-5">

            {/* Summary row */}
            <div className="grid grid-cols-4 gap-4">
              {[
                { label: 'Parties analysées', value: fmt(totalGames), sub: 'depuis le patch 10.04' },
                { label: 'Agents méta (S+)',   value: `${sPlus} agents`, sub: 'actuellement au top tier' },
                { label: 'Plus joué',          value: topPick.name,    sub: `${topPick.pr}% pick rate`, agent: topPick.name },
                { label: 'Plus banni',         value: topBanned.name,  sub: `${topBanned.ban}% ban rate`, agent: topBanned.name },
              ].map(c => (
                <div key={c.label} className="card rounded-xl p-4 flex items-center gap-4">
                  {c.agent && (
                    <AgentPortrait name={c.agent} icon={apiAgents[c.agent]?.displayIcon} size={40} />
                  )}
                  <div className="min-w-0">
                    <div className="text-lg font-bold truncate">{c.value}</div>
                    <div className="text-[11px] mt-0.5 truncate" style={{ color: 'var(--text2)' }}>{c.sub}</div>
                    <div className="text-[10px] uppercase tracking-wider mt-1 truncate" style={{ color: 'var(--text3)' }}>{c.label}</div>
                  </div>
                </div>
              ))}
            </div>

            {/* Filter bar */}
            <div className="flex items-center gap-3 flex-wrap">
              <div className="flex gap-1">
                {ROLES.map(r => (
                  <button key={r} onClick={() => setRoleFilter(r)}
                    className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
                    style={roleFilter === r
                      ? r === 'All'
                        ? { background: 'var(--violet)', color: '#fff', border: '1px solid var(--violet)' }
                        : { background: ROLE_COLOR[r] + '20', color: ROLE_COLOR[r], border: `1px solid ${ROLE_COLOR[r]}55` }
                      : { background: 'var(--surface)', color: 'var(--text2)', border: '1px solid var(--border)' }}>
                    {r}
                  </button>
                ))}
              </div>
              <div className="relative ml-auto">
                <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth={1.6}
                  className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 pointer-events-none"
                  style={{ color: 'var(--text3)' }}>
                  <circle cx="9" cy="9" r="6"/>
                  <path d="m14 14 3 3" strokeLinecap="round"/>
                </svg>
                <input value={search} onChange={e => setSearch(e.target.value)}
                  placeholder="Rechercher un agent..."
                  className="input pl-9 pr-4 py-2 w-56 text-sm rounded-xl" />
              </div>
            </div>

            {/* Table */}
            <div className="rounded-xl overflow-hidden" style={{ border: '1px solid var(--border)' }}>
              <table className="w-full border-collapse">
                <thead>
                  <tr style={{ background: 'var(--surface)' }}>
                    {([
                      { label: '#',        key: null         },
                      { label: 'Agent',    key: null         },
                      { label: 'Rôle',     key: null         },
                      { label: 'Tier',     key: 'tier' as SortKey },
                      { label: 'Win %',    key: 'wr'   as SortKey },
                      { label: 'Pick %',   key: 'pr'   as SortKey },
                      { label: 'Ban %',    key: 'ban'  as SortKey },
                      { label: 'K/D',      key: 'kd'   as SortKey },
                      { label: 'Parties',  key: null         },
                    ] as { label: string; key: SortKey | null }[]).map(({ label, key }) => (
                      <th key={label}
                        onClick={key ? () => handleSort(key) : undefined}
                        className={`px-4 py-3 text-left text-[11px] uppercase tracking-wider font-semibold ${key ? 'cursor-pointer select-none hover:opacity-70 transition-opacity' : ''}`}
                        style={{
                          color: key && sortKey === key ? 'var(--violet2)' : 'var(--text3)',
                          borderBottom: '1px solid var(--border)',
                        }}>
                        {label}<SortArrow k={key as SortKey} />
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredAgents.map((agent, i) => {
                    const icon = apiAgents[agent.name]?.displayIcon;
                    const wrColor = agent.wr >= 52.5 ? 'var(--green)' : agent.wr >= 50 ? 'var(--text1)' : 'var(--red)';
                    const kdColor = agent.kd >= 1.2  ? 'var(--green)' : agent.kd >= 1.0 ? 'var(--text1)' : 'var(--red)';
                    const wrPct   = Math.min(100, Math.max(0, (agent.wr - 44) / 14 * 100));
                    const isLast  = i === filteredAgents.length - 1;
                    return (
                      <tr key={agent.name}
                        className="transition-colors hover:bg-white/[0.025]"
                        style={{ borderBottom: isLast ? 'none' : '1px solid var(--border)' }}>
                        <td className="px-4 py-3 text-sm font-medium w-10" style={{ color: 'var(--text3)' }}>
                          {i + 1}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <AgentPortrait name={agent.name} icon={icon} size={36} />
                            <span className="text-sm font-semibold whitespace-nowrap">{agent.name}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3"><RoleBadge role={agent.role} /></td>
                        <td className="px-4 py-3"><TierBadge tier={agent.tier} /></td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2.5">
                            <div className="h-1 w-14 rounded-full overflow-hidden" style={{ background: 'var(--raised)' }}>
                              <div className="h-full rounded-full transition-all"
                                style={{ width: `${wrPct}%`, background: agent.wr >= 52.5 ? 'var(--green)' : agent.wr >= 50 ? 'var(--amber)' : 'var(--red)' }} />
                            </div>
                            <span className="text-sm font-semibold tabular-nums" style={{ color: wrColor }}>
                              {agent.wr.toFixed(1)}%
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm tabular-nums" style={{ color: 'var(--text2)' }}>
                          {agent.pr.toFixed(1)}%
                        </td>
                        <td className="px-4 py-3 text-sm tabular-nums" style={{ color: 'var(--text2)' }}>
                          {agent.ban.toFixed(1)}%
                        </td>
                        <td className="px-4 py-3 text-sm font-semibold tabular-nums" style={{ color: kdColor }}>
                          {agent.kd.toFixed(2)}
                        </td>
                        <td className="px-4 py-3 text-sm tabular-nums" style={{ color: 'var(--text3)' }}>
                          {fmt(agent.games)}
                        </td>
                      </tr>
                    );
                  })}
                  {filteredAgents.length === 0 && (
                    <tr>
                      <td colSpan={9} className="px-4 py-16 text-center text-sm" style={{ color: 'var(--text3)' }}>
                        Aucun agent ne correspond à la recherche
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Legend */}
            <div className="flex items-center gap-6 pt-1">
              <span className="text-[11px] uppercase tracking-wider" style={{ color: 'var(--text3)' }}>Tier :</span>
              {TIER_ORDER.map(t => (
                <div key={t} className="flex items-center gap-1.5">
                  <TierBadge tier={t} />
                  <span className="text-[11px]" style={{ color: 'var(--text3)' }}>
                    {t === 'S+' ? 'Incontournable' : t === 'S' ? 'Excellent' : t === 'A' ? 'Bon' : t === 'B' ? 'Passable' : 'Faible'}
                  </span>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* ═══════════════════════════════════════════════════════
            TAB — LEADERBOARD
        ══════════════════════════════════════════════════════════ */}
        {tab === 'leaderboard' && (
          <motion.div key="leaderboard"
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.18 }}
            className="space-y-5">

            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold">Top Joueurs Professionnels</h2>
                <p className="text-sm mt-0.5" style={{ color: 'var(--text2)' }}>
                  Classement des meilleurs joueurs Valorant compétitifs
                </p>
              </div>
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs"
                style={{ background: 'var(--surface)', color: 'var(--text3)', border: '1px solid var(--border)' }}>
                <svg viewBox="0 0 14 14" fill="currentColor" className="h-3 w-3">
                  <path d="M7 0a7 7 0 100 14A7 7 0 007 0zm.5 4v3.7l2.5 2.5-.7.7L6.5 8V4h1z"/>
                </svg>
                Via PandaScore API
              </div>
            </div>

            {proLoading && (
              <div className="card rounded-xl flex items-center justify-center py-24">
                <div className="flex flex-col items-center gap-4">
                  <div className="flex gap-1.5">
                    {[0, 1, 2].map(i => (
                      <motion.div key={i} className="h-2 w-2 rounded-full"
                        style={{ background: 'var(--violet)' }}
                        animate={{ opacity: [0.3, 1, 0.3] }}
                        transition={{ duration: 1, repeat: Infinity, delay: i * 0.15 }} />
                    ))}
                  </div>
                  <span className="text-sm" style={{ color: 'var(--text3)' }}>Chargement des joueurs…</span>
                </div>
              </div>
            )}

            {proError && !proLoading && (
              <div className="card rounded-xl p-10 text-center">
                <div className="text-3xl mb-3">⚠️</div>
                <div className="text-sm font-medium mb-1">Erreur de chargement</div>
                <div className="text-sm" style={{ color: 'var(--text3)' }}>{proError}</div>
                <button onClick={() => { setProPlayers([]); setProError(null); setProLoading(true); }}
                  className="btn-primary mt-4 px-4 py-2 rounded-lg text-sm">
                  Réessayer
                </button>
              </div>
            )}

            {!proLoading && !proError && proPlayers.length > 0 && (
              <div className="rounded-xl overflow-hidden" style={{ border: '1px solid var(--border)' }}>
                <table className="w-full border-collapse">
                  <thead>
                    <tr style={{ background: 'var(--surface)', borderBottom: '1px solid var(--border)' }}>
                      {['#', 'Joueur', 'Équipe', 'Pays', 'Rôle'].map(h => (
                        <th key={h} className="px-4 py-3 text-left text-[11px] uppercase tracking-wider font-semibold"
                          style={{ color: 'var(--text3)' }}>
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {proPlayers.map((p, i) => {
                      const rankBadge = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : null;
                      return (
                        <tr key={p.id}
                          className="transition-colors hover:bg-white/[0.025]"
                          style={{ borderBottom: i < proPlayers.length - 1 ? '1px solid var(--border)' : 'none' }}>
                          <td className="px-4 py-3 w-12">
                            {rankBadge
                              ? <span className="text-xl">{rankBadge}</span>
                              : <span className="text-sm font-semibold tabular-nums" style={{ color: 'var(--text3)' }}>{i + 1}</span>
                            }
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-3">
                              <div className="h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                                style={{ background: 'var(--violet)', color: '#fff' }}>
                                {p.name[0]?.toUpperCase() ?? '?'}
                              </div>
                              <div>
                                <div className="text-sm font-bold">{p.name}</div>
                                {(p.first_name || p.last_name) && (
                                  <div className="text-[11px]" style={{ color: 'var(--text3)' }}>
                                    {[p.first_name, p.last_name].filter(Boolean).join(' ')}
                                  </div>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            {p.current_team ? (
                              <div className="flex items-center gap-2">
                                {p.current_team.image_url && (
                                  <img src={p.current_team.image_url} alt=""
                                    className="h-5 w-5 object-contain rounded flex-shrink-0"
                                    onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                                )}
                                <span className="text-sm">{p.current_team.name}</span>
                                {p.current_team.acronym && (
                                  <span className="text-[11px] px-1.5 py-0.5 rounded font-mono"
                                    style={{ background: 'var(--raised)', color: 'var(--text3)' }}>
                                    {p.current_team.acronym}
                                  </span>
                                )}
                              </div>
                            ) : (
                              <span className="text-sm" style={{ color: 'var(--text3)' }}>Free agent</span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-xl">
                            {p.nationality ? toFlag(p.nationality) : <span style={{ color: 'var(--text3)' }}>—</span>}
                          </td>
                          <td className="px-4 py-3">
                            {p.role ? (
                              <span className="text-xs px-2 py-0.5 rounded-md font-medium capitalize"
                                style={{ background: 'var(--raised)', color: 'var(--text2)' }}>
                                {p.role}
                              </span>
                            ) : (
                              <span style={{ color: 'var(--text3)' }}>—</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </motion.div>
        )}

        {/* ═══════════════════════════════════════════════════════
            TAB — MATCHUPS
        ══════════════════════════════════════════════════════════ */}
        {tab === 'matchups' && (
          <motion.div key="matchups"
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.18 }}
            className="space-y-5">

            <div>
              <h2 className="text-lg font-bold">Analyse des Matchups</h2>
              <p className="text-sm mt-0.5" style={{ color: 'var(--text2)' }}>
                Sélectionne un agent pour voir ses counter-picks et synergies
              </p>
            </div>

            {/* Agent grid picker */}
            <div className="card rounded-xl p-5">
              <div className="text-xs uppercase tracking-wider font-semibold mb-4" style={{ color: 'var(--text3)' }}>
                Choisir un agent
              </div>
              <div className="flex flex-wrap gap-2">
                {AGENT_STATS.map(a => {
                  const icon = apiAgents[a.name]?.displayIcon;
                  const selected = a.name === selectedAgent;
                  return (
                    <button key={a.name} onClick={() => setSelectedAgent(a.name)}
                      title={a.name}
                      className="relative rounded-xl overflow-hidden transition-all h-11 w-11"
                      style={{
                        background: 'var(--raised)',
                        outline: selected ? '2px solid var(--violet)' : '2px solid transparent',
                        outlineOffset: '2px',
                        opacity: selected ? 1 : 0.55,
                        transform: selected ? 'scale(1.08)' : 'scale(1)',
                      }}>
                      {icon
                        ? <img src={icon} alt={a.name} className="h-full w-full object-cover" />
                        : <span className="flex h-full w-full items-center justify-center text-[10px] font-bold"
                            style={{ color: 'var(--text2)' }}>{a.name[0]}</span>
                      }
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Detail panel */}
            {agentInfo && matchup && (
              <div className="grid grid-cols-3 gap-4">

                {/* Left: Selected agent info */}
                <div className="card rounded-xl p-5 flex flex-col items-center text-center">
                  <div className="h-20 w-20 rounded-xl overflow-hidden mb-3"
                    style={{ background: 'var(--raised)' }}>
                    {apiAgents[selectedAgent]?.displayIcon && (
                      <img src={apiAgents[selectedAgent].displayIcon} alt={selectedAgent}
                        className="h-full w-full object-cover" />
                    )}
                  </div>
                  <div className="text-lg font-bold">{selectedAgent}</div>
                  <div className="mt-1"><RoleBadge role={agentInfo.role} /></div>

                  <div className="mt-5 w-full space-y-2.5">
                    {[
                      { label: 'Tier',      value: <TierBadge tier={agentInfo.tier} /> },
                      { label: 'Win Rate',  value: <span className="font-semibold text-sm" style={{ color: agentInfo.wr >= 52 ? 'var(--green)' : 'var(--text1)' }}>{agentInfo.wr.toFixed(1)}%</span> },
                      { label: 'Pick Rate', value: <span className="text-sm font-semibold">{agentInfo.pr.toFixed(1)}%</span> },
                      { label: 'Ban Rate',  value: <span className="text-sm font-semibold">{agentInfo.ban.toFixed(1)}%</span> },
                      { label: 'K/D Ratio', value: <span className="font-semibold text-sm" style={{ color: agentInfo.kd >= 1.2 ? 'var(--green)' : 'var(--text1)' }}>{agentInfo.kd.toFixed(2)}</span> },
                    ].map(({ label, value }) => (
                      <div key={label} className="flex items-center justify-between py-1"
                        style={{ borderBottom: '1px solid var(--border)' }}>
                        <span className="text-xs" style={{ color: 'var(--text3)' }}>{label}</span>
                        {value}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Middle: Weak to (counters) */}
                <div className="card rounded-xl p-5">
                  <div className="flex items-center gap-2.5 mb-4">
                    <div className="h-8 w-8 rounded-lg flex items-center justify-center flex-shrink-0"
                      style={{ background: 'rgba(239,68,68,0.12)' }}>
                      <svg viewBox="0 0 16 16" fill="none" stroke="#ef4444" strokeWidth={1.6} strokeLinecap="round" className="h-4 w-4">
                        <path d="M8 2v6l4 2M2 12l12-4"/>
                      </svg>
                    </div>
                    <div>
                      <div className="text-sm font-bold">Contre-picks</div>
                      <div className="text-[11px]" style={{ color: 'var(--text3)' }}>Agents qui neutralisent {selectedAgent}</div>
                    </div>
                  </div>
                  <div className="space-y-2.5">
                    {matchup.weakTo.map(name => <MatchupAgentCard key={name} name={name} />)}
                  </div>
                </div>

                {/* Right: Synergy */}
                <div className="card rounded-xl p-5">
                  <div className="flex items-center gap-2.5 mb-4">
                    <div className="h-8 w-8 rounded-lg flex items-center justify-center flex-shrink-0"
                      style={{ background: 'rgba(34,197,94,0.12)' }}>
                      <svg viewBox="0 0 16 16" fill="none" stroke="#22c55e" strokeWidth={1.6} strokeLinecap="round" className="h-4 w-4">
                        <path d="M3 8l4 4 6-7"/>
                      </svg>
                    </div>
                    <div>
                      <div className="text-sm font-bold">Synergies</div>
                      <div className="text-[11px]" style={{ color: 'var(--text3)' }}>Meilleurs coéquipiers pour {selectedAgent}</div>
                    </div>
                  </div>
                  <div className="space-y-2.5">
                    {matchup.synergy.map(name => <MatchupAgentCard key={name} name={name} />)}
                  </div>
                </div>

              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ValorantStatsPage;
