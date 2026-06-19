import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { platformApi } from '../services/platformApi';

const sp = { type: 'spring' as const, stiffness: 360, damping: 28 };

const ROLES = ['Duelist', 'Controller', 'Initiator', 'Sentinel'];
const RANKS = ['Iron','Bronze','Silver','Gold','Platinum','Diamond','Ascendant','Immortal','Radiant'];

const RANK_COLOR: Record<string, string> = {
  Iron:'#6b7280', Bronze:'#d97706', Silver:'#d1d5db', Gold:'#fbbf24',
  Platinum:'#22d3ee', Diamond:'#818cf8', Ascendant:'#34d399', Immortal:'#f87171', Radiant:'#fbbf24',
};
const ROLE_COLOR: Record<string, string> = {
  Duelist:'#FF4654', Controller:'#4ade80', Initiator:'#f59e0b', Sentinel:'#60a5fa',
};

const DISCORD_SERVERS = [
  { name:'Valorant France',    desc:'La plus grande communauté Valorant francophone. LFG, clips, tournois amateurs.', members:'42 000', invite:'https://discord.gg/valorantfr',  color:'#FF4654', tags:['FR','LFG','Tournois'] },
  { name:'Valorant Community', desc:'Serveur communautaire international pour trouver des équipes et discuter du jeu.', members:'120 000', invite:'https://discord.gg/valorant',   color:'#FF4654', tags:['EN','LFG','Coaching'] },
  { name:'VCT Esports Hub',    desc:'Suivez le VCT, discutez des matchs et trouvez des équipes semi-pro.', members:'28 000', invite:'https://discord.gg/vct',           color:'#FF4654', tags:['EN','FR','Pro','Tournois'] },
  { name:'Valorant EU LFG',    desc:'Serveur dédié au LFG/LFT sur les serveurs européens. Ranked et casual.', members:'15 000', invite:'https://discord.gg/valoranteu', color:'#FF4654', tags:['EU','LFG','Ranked'] },
  { name:'B3 Esport Community',desc:'Notre communauté ! Trouvez des coéquipiers B3, organisez des parties internes.', members:'—', invite:'#', color:'var(--violet)', tags:['FR','B3','Interne'], featured:true },
];

interface LfgPlayer {
  id: number;
  username: string;
  riotId?: string | null;
  tagLine?: string | null;
  bio?: string | null;
  discord?: string | null;
  twitter?: string | null;
  twitch?: string | null;
  youtube?: string | null;
  rankLabel?: string | null;
  roles?: string[];
  region?: string | null;
  languages?: string[];
  playtimes?: string[];
  lfgStatus?: 'lfg' | 'busy';
}

const RankBadge: React.FC<{ rank: string }> = ({ rank }) => {
  const tier = rank.split(' ')[0];
  const color = RANK_COLOR[tier] ?? '#71717a';
  return (
    <span className="rounded-full px-2 py-0.5 text-[10px] font-bold"
      style={{ background:`${color}18`, color, border:`1px solid ${color}30` }}>
      {rank}
    </span>
  );
};

const RoleBadge: React.FC<{ role: string }> = ({ role }) => (
  <span className="rounded-full px-2 py-0.5 text-[10px] font-semibold"
    style={{ background:`${ROLE_COLOR[role]}15`, color:ROLE_COLOR[role], border:`1px solid ${ROLE_COLOR[role]}25` }}>
    {role}
  </span>
);

const SocialIcon: React.FC<{ type: string }> = ({ type }) => {
  if (type === 'discord') return (
    <svg viewBox="0 0 24 24" fill="currentColor" className="h-3.5 w-3.5">
      <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057c.002.022.015.045.034.057a19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03z"/>
    </svg>
  );
  if (type === 'twitter') return (
    <svg viewBox="0 0 24 24" fill="currentColor" className="h-3.5 w-3.5">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
    </svg>
  );
  if (type === 'twitch') return (
    <svg viewBox="0 0 24 24" fill="currentColor" className="h-3.5 w-3.5">
      <path d="M11.571 4.714h1.715v5.143H11.57zm4.715 0H18v5.143h-1.714zM6 0L1.714 4.286v15.428h5.143V24l4.286-4.286h3.428L22.286 12V0zm14.571 11.143l-3.428 3.428h-3.429l-3 3v-3H6.857V1.714h13.714z"/>
    </svg>
  );
  return null;
};

const copyToClipboard = (text: string) => navigator.clipboard.writeText(text).catch(() => {});

const PlayersPage: React.FC = () => {
  const [players,      setPlayers]      = useState<LfgPlayer[]>([]);
  const [loading,      setLoading]      = useState(true);
  const [rankFilter,   setRankFilter]   = useState('TOUS');
  const [roleFilter,   setRoleFilter]   = useState('TOUS');
  const [regionFilter, setRegionFilter] = useState('TOUS');
  const [statusFilter, setStatusFilter] = useState<'all'|'lfg'>('lfg');
  const [search,       setSearch]       = useState('');
  const [copied,       setCopied]       = useState<string | null>(null);
  const [activeTab,    setActiveTab]    = useState<'players'|'servers'>('players');

  useEffect(() => {
    platformApi.getLfgPlayers()
      .then(res => {
        if (res.success && Array.isArray(res.players)) {
          setPlayers(res.players as LfgPlayer[]);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleCopy = (text: string) => {
    copyToClipboard(text);
    setCopied(text);
    setTimeout(() => setCopied(null), 1800);
  };

  const filtered = players.filter(p => {
    if (statusFilter === 'lfg' && p.lfgStatus !== 'lfg') return false;
    if (rankFilter !== 'TOUS' && p.rankLabel && !p.rankLabel.startsWith(rankFilter)) return false;
    if (rankFilter !== 'TOUS' && !p.rankLabel) return false;
    if (roleFilter !== 'TOUS' && !(p.roles ?? []).includes(roleFilter)) return false;
    if (regionFilter !== 'TOUS' && p.region !== regionFilter) return false;
    if (search && !p.username.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const regions = [...new Set(players.map(p => p.region).filter(Boolean))] as string[];

  return (
    <div className="page-enter h-full overflow-y-auto p-6 space-y-6">

      {/* Header */}
      <motion.div initial={{ opacity:0, y:8 }} animate={{ opacity:1, y:0 }} transition={sp}>
        <h2 className="text-[22px] font-bold">Trouver des joueurs</h2>
        <p className="mt-1 text-[14px]" style={{ color:'var(--text3)' }}>
          LFG · Serveurs Discord · Coéquipiers Valorant
        </p>
      </motion.div>

      {/* Tabs */}
      <div className="flex gap-2">
        {[
          { id:'players', label:'👥 Joueurs LFG' },
          { id:'servers', label:'💬 Serveurs Discord' },
        ].map(t => (
          <button key={t.id} onClick={() => setActiveTab(t.id as 'players'|'servers')}
            className="rounded-xl px-4 py-2 text-[13px] font-semibold transition"
            style={{
              background: activeTab === t.id ? 'var(--violet)' : 'var(--surface)',
              border: `1px solid ${activeTab === t.id ? 'transparent' : 'var(--border)'}`,
              color: activeTab === t.id ? 'white' : 'var(--text2)',
            }}>
            {t.label}
          </button>
        ))}
      </div>

      {/* ── PLAYERS TAB ── */}
      {activeTab === 'players' && (
        <>
          {/* Filters */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Search */}
            <div className="relative">
              <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth={1.8}
                className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2" style={{ color:'var(--text3)' }}>
                <path d="M9 17A8 8 0 109 1a8 8 0 000 16zM19 19l-4.35-4.35" strokeLinecap="round"/>
              </svg>
              <input type="text" value={search} onChange={e => setSearch(e.target.value)}
                placeholder="Pseudo…"
                className="input w-44 py-2 pl-9 pr-3 text-[13px]" />
            </div>

            {/* LFG status */}
            <div className="flex rounded-xl overflow-hidden" style={{ border:'1px solid var(--border)' }}>
              {[{ id:'all', label:'Tous' }, { id:'lfg', label:'🔍 LFG' }].map(s => (
                <button key={s.id} onClick={() => setStatusFilter(s.id as 'all'|'lfg')}
                  className="px-3 py-2 text-[12px] font-semibold transition"
                  style={{
                    background: statusFilter === s.id ? 'var(--violet)' : 'transparent',
                    color: statusFilter === s.id ? 'white' : 'var(--text2)',
                  }}>
                  {s.label}
                </button>
              ))}
            </div>

            <select value={rankFilter} onChange={e => setRankFilter(e.target.value)}
              className="input py-2 px-3 text-[13px]">
              <option value="TOUS">Tous les rangs</option>
              {RANKS.map(r => <option key={r} value={r} style={{ background:'var(--card)' }}>{r}</option>)}
            </select>

            <select value={roleFilter} onChange={e => setRoleFilter(e.target.value)}
              className="input py-2 px-3 text-[13px]">
              <option value="TOUS">Tous les rôles</option>
              {ROLES.map(r => <option key={r} value={r} style={{ background:'var(--card)' }}>{r}</option>)}
            </select>

            {regions.length > 0 && (
              <select value={regionFilter} onChange={e => setRegionFilter(e.target.value)}
                className="input py-2 px-3 text-[13px]">
                <option value="TOUS">Toutes régions</option>
                {regions.map(r => <option key={r} value={r} style={{ background:'var(--card)' }}>{r}</option>)}
              </select>
            )}

            <p className="ml-auto text-[13px]" style={{ color:'var(--text3)' }}>
              {filtered.length} joueur{filtered.length !== 1 ? 's' : ''}
            </p>
          </div>

          {/* Loading */}
          {loading && (
            <div className="flex items-center justify-center py-20">
              <div className="flex flex-col items-center gap-4">
                <div className="flex gap-1.5">
                  {[0,1,2].map(i => (
                    <motion.div key={i} className="h-2 w-2 rounded-full" style={{ background:'var(--violet)' }}
                      animate={{ opacity:[0.3,1,0.3] }}
                      transition={{ duration:1, repeat:Infinity, delay:i*0.15 }} />
                  ))}
                </div>
                <span className="text-sm" style={{ color:'var(--text3)' }}>Chargement des joueurs…</span>
              </div>
            </div>
          )}

          {/* Empty state */}
          {!loading && players.length === 0 && (
            <div className="card rounded-xl p-12 text-center">
              <div className="text-4xl mb-4">👥</div>
              <div className="text-[16px] font-bold mb-2">Aucun joueur inscrit pour l'instant</div>
              <p className="text-[14px]" style={{ color:'var(--text2)' }}>
                Active "Apparaître dans la page Joueurs" dans ton profil pour être le premier !
              </p>
            </div>
          )}

          {/* Grid */}
          {!loading && players.length > 0 && (
            <div className="grid grid-cols-3 gap-4 xl:grid-cols-4">
              <AnimatePresence>
                {filtered.map((p, i) => (
                  <motion.div key={p.id}
                    initial={{ opacity:0, y:8 }} animate={{ opacity:1, y:0 }}
                    transition={{ ...sp, delay: Math.min(i * 0.04, 0.3) }}
                    className="card flex flex-col gap-3.5 p-4">

                    {/* Header */}
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className="relative">
                          <div className="h-10 w-10 rounded-full flex items-center justify-center text-[15px] font-black"
                            style={{ background:'var(--raised)', color:'var(--violet2)' }}>
                            {p.username.charAt(0).toUpperCase()}
                          </div>
                          <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2"
                            style={{
                              background: p.lfgStatus === 'lfg' ? 'var(--green)' : 'var(--text3)',
                              borderColor: 'var(--card)',
                            }} />
                        </div>
                        <div>
                          <p className="text-[14px] font-bold leading-tight">{p.username}</p>
                          {p.riotId && p.tagLine && (
                            <p className="text-[11px]" style={{ color:'var(--text3)' }}>
                              {p.riotId}<span style={{ color:'var(--text3)' }}>#{p.tagLine}</span>
                            </p>
                          )}
                        </div>
                      </div>
                      <span className="rounded-full px-2 py-0.5 text-[10px] font-bold flex-shrink-0"
                        style={{
                          background: p.lfgStatus === 'lfg' ? 'rgba(34,197,94,0.12)' : 'rgba(113,113,122,0.12)',
                          color: p.lfgStatus === 'lfg' ? 'var(--green)' : 'var(--text3)',
                        }}>
                        {p.lfgStatus === 'lfg' ? 'LFG' : 'Occupé'}
                      </span>
                    </div>

                    {/* Rank */}
                    {p.rankLabel && <RankBadge rank={p.rankLabel} />}

                    {/* Roles */}
                    {(p.roles ?? []).length > 0 && (
                      <div className="flex flex-wrap gap-1.5">
                        {(p.roles ?? []).map(r => <RoleBadge key={r} role={r} />)}
                      </div>
                    )}

                    {/* Meta */}
                    <div className="space-y-1 text-[12px]" style={{ color:'var(--text3)' }}>
                      {(p.region || (p.languages ?? []).length > 0) && (
                        <p>🌍 {[p.region, ...(p.languages ?? [])].filter(Boolean).join(' · ')}</p>
                      )}
                      {(p.playtimes ?? []).length > 0 && (
                        <p>🕐 {(p.playtimes ?? []).join(', ')}</p>
                      )}
                    </div>

                    {/* Bio */}
                    {p.bio && (
                      <p className="text-[12px] leading-relaxed line-clamp-2" style={{ color:'var(--text2)' }}>
                        {p.bio}
                      </p>
                    )}

                    {/* Social links */}
                    <div className="mt-auto flex flex-col gap-2">
                      {p.discord && (
                        <button onClick={() => handleCopy(p.discord!)}
                          className="flex items-center justify-center gap-2 rounded-xl py-2 text-[12px] font-semibold transition hover:opacity-90"
                          style={{
                            background: copied === p.discord ? 'rgba(34,197,94,0.12)' : 'rgba(88,101,242,0.12)',
                            color: copied === p.discord ? 'var(--green)' : '#5865F2',
                            border: `1px solid ${copied === p.discord ? 'rgba(34,197,94,0.2)' : 'rgba(88,101,242,0.2)'}`,
                          }}>
                          {copied === p.discord ? '✓ Copié !' : (
                            <><SocialIcon type="discord" />{p.discord}</>
                          )}
                        </button>
                      )}
                      {(p.twitter || p.twitch) && (
                        <div className="flex gap-2">
                          {p.twitter && (
                            <a href={`https://x.com/${p.twitter}`} target="_blank" rel="noopener noreferrer"
                              className="flex-1 flex items-center justify-center gap-1.5 rounded-lg py-1.5 text-[11px] font-semibold transition hover:opacity-80"
                              style={{ background:'rgba(255,255,255,0.05)', color:'var(--text2)' }}>
                              <SocialIcon type="twitter" />@{p.twitter}
                            </a>
                          )}
                          {p.twitch && (
                            <a href={`https://twitch.tv/${p.twitch}`} target="_blank" rel="noopener noreferrer"
                              className="flex-1 flex items-center justify-center gap-1.5 rounded-lg py-1.5 text-[11px] font-semibold transition hover:opacity-80"
                              style={{ background:'rgba(145,70,255,0.1)', color:'#9146FF' }}>
                              <SocialIcon type="twitch" />{p.twitch}
                            </a>
                          )}
                        </div>
                      )}
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>

              {!loading && filtered.length === 0 && players.length > 0 && (
                <div className="col-span-4 rounded-xl p-10 text-center"
                  style={{ background:'var(--surface)', border:'1px solid var(--border)' }}>
                  <p className="text-[15px] font-semibold" style={{ color:'var(--text2)' }}>Aucun joueur trouvé</p>
                  <p className="mt-1 text-[13px]" style={{ color:'var(--text3)' }}>Essayez d'autres filtres</p>
                </div>
              )}
            </div>
          )}
        </>
      )}

      {/* ── SERVERS TAB ── */}
      {activeTab === 'servers' && (
        <div className="grid grid-cols-2 gap-5 xl:grid-cols-3">
          {DISCORD_SERVERS.map((s, i) => (
            <motion.div key={s.name}
              initial={{ opacity:0, y:8 }} animate={{ opacity:1, y:0 }}
              transition={{ ...sp, delay:i*0.06 }}
              className="card flex flex-col gap-4 p-5 card-hover overflow-hidden"
              style={'featured' in s && s.featured ? { borderColor:'rgba(47,129,247,0.4)' } : undefined}>
              {'featured' in s && s.featured && (
                <span className="self-start rounded-full px-2.5 py-0.5 text-[10px] font-bold"
                  style={{ background:'rgba(47,129,247,0.15)', color:'var(--violet2)' }}>
                  ✦ Recommandé
                </span>
              )}
              <div className="flex items-start gap-3">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl"
                  style={{ background:`${s.color}20` }}>
                  <svg viewBox="0 0 24 24" fill="currentColor" className="h-6 w-6"
                    style={{ color: s.color === 'var(--violet)' ? 'var(--violet2)' : s.color }}>
                    <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057c.002.022.015.045.034.057a19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03z"/>
                  </svg>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[15px] font-bold">{s.name}</p>
                  <p className="mt-0.5 text-[12px]" style={{ color:'var(--text3)' }}>
                    {s.members !== '—' ? `${s.members} membres` : 'Rejoignez-nous'}
                  </p>
                </div>
              </div>
              <p className="text-[13px] leading-relaxed" style={{ color:'var(--text2)' }}>{s.desc}</p>
              <div className="flex flex-wrap gap-1.5">
                {s.tags.map(t => (
                  <span key={t} className="rounded-full px-2 py-0.5 text-[10px] font-semibold"
                    style={{ background:'var(--raised)', color:'var(--text3)' }}>{t}</span>
                ))}
              </div>
              <a href={s.invite} target="_blank" rel="noopener noreferrer"
                className="mt-auto flex items-center justify-center gap-2 rounded-xl py-2.5 text-[13px] font-bold text-white transition hover:opacity-90"
                style={{ background: s.invite === '#' ? 'var(--violet)' : '#5865F2' }}>
                {s.invite === '#' ? 'Rejoindre notre communauté' : 'Rejoindre le serveur'}
              </a>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
};

export default PlayersPage;
