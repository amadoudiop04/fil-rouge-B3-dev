import React, { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  getLiveMatches, getRunningTournaments, getUpcomingTournaments, getTournamentBracket,
  hasPandaToken,
  type LiveMatch, type EsportsTournament, type BracketMatch,
} from '../services/tournamentApi';

interface TournamentPageProps {
  onNavigate?: (page: string) => void;
}

/* ── Mock Valorant fallback ── */
const MOCK_LIVE: EsportsTournament[] = [
  { id: 1, name: 'VCT Champions 2025 – Demi-finales', serie: 'VCT Champions', status: 'live', location: 'Berlin', prizepool: '1 000 000 $', teams: 4, beginAt: '2025-08-10', endAt: '2025-08-24', twitchChannel: 'valorant', color: '#FF4654' },
];
const MOCK_UPCOMING: EsportsTournament[] = [
  { id: 2, name: 'VCT Game Changers EMEA 2025', serie: 'VCT Game Changers', status: 'upcoming', location: 'Europe', prizepool: '50 000 $', teams: 8, beginAt: '2025-09-01', endAt: '2025-09-14', twitchChannel: 'valorant', color: '#FF4654' },
  { id: 3, name: 'VCT Pacific League Stage 3',  serie: 'VCT Pacific',       status: 'upcoming', location: 'Seoul',  prizepool: '200 000 $', teams: 8, beginAt: '2025-09-15', endAt: '2025-09-30', twitchChannel: 'valorantesports', color: '#FF4654' },
];
const MOCK_MATCH: LiveMatch = {
  id: 0, name: 'NAVI vs LOUD', tournament: 'VCT Champions 2025', serie: 'Demi-finale',
  team1: { name: 'NAVI', score: 10 }, team2: { name: 'LOUD', score: 8 },
  twitchChannel: 'valorant', map: 'Ascent',
};

const STREAMS = [
  { channel: 'valorant',         name: 'VCT Officiel', lang: 'EN', live: true  },
  { channel: 'valorantfr',       name: 'VCT France',   lang: 'FR', live: true  },
  { channel: 'valorantesports',  name: 'VCT Esports',  lang: 'EN', live: false },
];

const sp = { type: 'spring' as const, stiffness: 340, damping: 28 };
const fd = (d = 0) => ({ initial: { opacity: 0, y: 10 }, animate: { opacity: 1, y: 0 }, transition: { ...sp, delay: d } });

/* ── Twitch embed ── */
const TwitchPanel: React.FC<{ channel: string }> = ({ channel }) => {
  const parent = window.location.hostname || 'localhost';
  return (
    <div className="aspect-video w-full overflow-hidden rounded-xl bg-black" style={{ border: '1px solid var(--border)' }}>
      <iframe key={channel} src={`https://player.twitch.tv/?channel=${channel}&parent=${parent}&autoplay=false`}
        title={`Stream ${channel}`} allowFullScreen className="h-full w-full" />
    </div>
  );
};

/* ── Bracket components ── */
const BracketSlot: React.FC<{ name?: string; logo?: string; score: number; isWinner?: boolean; isLive?: boolean }> =
  ({ name, logo, score, isWinner, isLive }) => (
  <div className="flex items-center justify-between rounded-lg px-3 py-2"
    style={{
      background: isLive ? 'rgba(255,70,84,0.08)' : isWinner ? 'rgba(255,255,255,0.07)' : 'rgba(255,255,255,0.02)',
      border: `1px solid ${isLive ? 'rgba(255,70,84,0.4)' : isWinner ? 'rgba(255,255,255,0.12)' : 'rgba(255,255,255,0.05)'}`,
    }}>
    <div className="flex items-center gap-2 min-w-0">
      {logo
        ? <img src={logo} alt={name} className="h-5 w-5 shrink-0 rounded object-contain" style={{ background: 'var(--raised)' }} />
        : <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: '#FF4654' }} />
      }
      <p className={`truncate text-[11px] font-extrabold ${isWinner ? 'text-white' : 'text-white/55'}`}>
        {name ?? 'TBD'}
      </p>
    </div>
    {(score > 0 || isWinner !== undefined) && (
      <p className="ml-2 shrink-0 text-[12px] font-extrabold tabular-nums"
        style={{ color: isWinner ? 'white' : 'var(--text3)' }}>{score}</p>
    )}
  </div>
);

const BracketCard: React.FC<{ m: BracketMatch }> = ({ m }) => (
  <div className="min-w-[158px]">
    <p className="mb-1.5 text-[9px] font-bold uppercase tracking-widest truncate" style={{ color: 'var(--text3)' }}>
      {m.round}
    </p>
    <div className="space-y-1 rounded-xl p-2"
      style={{ border: `1px solid ${m.status === 'live' ? 'rgba(255,70,84,0.4)' : 'rgba(255,255,255,0.07)'}` }}>
      <BracketSlot name={m.t1Name} logo={m.t1Logo} score={m.s1}
        isWinner={m.status === 'done' && m.winner === m.t1Name}
        isLive={m.status === 'live'} />
      <BracketSlot name={m.t2Name} logo={m.t2Logo} score={m.s2}
        isWinner={m.status === 'done' && m.winner === m.t2Name}
        isLive={m.status === 'live'} />
    </div>
    {m.status === 'live' && (
      <div className="mt-1 flex items-center gap-1">
        <span className="h-1.5 w-1.5 animate-ping rounded-full" style={{ background: 'var(--red)' }} />
        <p className="text-[9px] font-bold" style={{ color: 'var(--red)' }}>LIVE</p>
      </div>
    )}
  </div>
);

const BracketConn: React.FC<{ dir: 'right' | 'left' }> = ({ dir }) => {
  const r = dir === 'right';
  return (
    <div className="flex w-4 shrink-0 flex-col self-stretch">
      <div className={`flex-1 border-white/10 border-t ${r ? 'rounded-tr-lg border-r' : 'rounded-tl-lg border-l'}`} />
      <div className={`flex-1 border-white/10 border-b ${r ? 'rounded-br-lg border-r' : 'rounded-bl-lg border-l'}`} />
    </div>
  );
};

/* Groups bracket by round label */
function groupByRound(matches: BracketMatch[]) {
  const rounds: Record<string, BracketMatch[]> = {};
  matches.forEach(m => {
    const key = m.round;
    if (!rounds[key]) rounds[key] = [];
    rounds[key].push(m);
  });
  return Object.entries(rounds);
}

const BracketView: React.FC<{ matches: BracketMatch[]; tourneyName: string }> = ({ matches, tourneyName }) => {
  const rounds = groupByRound(matches);
  if (rounds.length === 0) return null;
  return (
    <motion.div {...fd(0.08)}>
      <div className="mb-3 flex items-center justify-between">
        <p className="text-[11px] font-semibold uppercase tracking-widest" style={{ color: 'var(--text3)' }}>
          Bracket — {tourneyName}
        </p>
        {matches.some(m => m.status === 'live') && (
          <span className="rounded-full px-2.5 py-0.5 text-[10px] font-bold" style={{ background: 'rgba(255,70,84,0.12)', color: 'var(--red)' }}>
            EN COURS
          </span>
        )}
      </div>
      <div className="card overflow-x-auto p-5">
        <div className="flex items-stretch gap-0" style={{ minWidth: rounds.length * 180 }}>
          {rounds.map(([, rMatches], ri) => (
            <React.Fragment key={ri}>
              {ri > 0 && rMatches.length < rounds[ri - 1][1].length && <BracketConn dir="right" />}
              <div className="flex flex-col justify-around gap-3">
                {rMatches.map(m => <BracketCard key={m.id} m={m} />)}
              </div>
              {ri < rounds.length - 1 && rMatches.length > rounds[ri + 1]?.[1]?.length && <BracketConn dir="right" />}
            </React.Fragment>
          ))}
        </div>
      </div>
    </motion.div>
  );
};

/* ── Live match score card ── */
const LiveMatchCard: React.FC<{ match: LiveMatch; onWatch: (ch: string) => void }> = ({ match, onWatch }) => (
  <motion.div {...fd(0.06)} className="card overflow-hidden"
    style={{ borderColor: 'rgba(255,70,84,0.3)' }}>
    <div className="flex items-center justify-between px-4 py-2.5" style={{ borderBottom: '1px solid var(--border)' }}>
      <span className="flex items-center gap-2">
        <span className="relative flex h-2 w-2">
          <span className="absolute h-full w-full animate-ping rounded-full opacity-75" style={{ background: 'var(--red)' }} />
          <span className="relative h-2 w-2 rounded-full" style={{ background: 'var(--red)' }} />
        </span>
        <span className="text-[11px] font-bold uppercase tracking-wider" style={{ color: 'var(--red)' }}>En direct</span>
      </span>
      <span className="truncate text-[11px] max-w-[180px]" style={{ color: 'var(--text3)' }}>
        {match.tournament}{match.map ? ` · ${match.map}` : ''}
      </span>
    </div>
    <div className="flex items-center justify-between px-6 py-5">
      <div className="flex flex-col items-center gap-2 w-20">
        {match.team1.imageUrl
          ? <img src={match.team1.imageUrl} alt={match.team1.name} className="h-10 w-10 rounded-lg object-contain" style={{ background: 'var(--raised)' }} />
          : <div className="h-10 w-10 rounded-lg flex items-center justify-center text-[11px] font-black" style={{ background: 'var(--raised)' }}>
              {match.team1.name.slice(0, 3)}
            </div>
        }
        <p className="text-[12px] font-black text-center leading-tight">{match.team1.name}</p>
      </div>
      <div className="flex items-center gap-3">
        <span className="text-[44px] font-black tabular-nums leading-none">{match.team1.score}</span>
        <span className="text-[18px]" style={{ color: 'var(--text3)' }}>—</span>
        <span className="text-[44px] font-black tabular-nums leading-none">{match.team2.score}</span>
      </div>
      <div className="flex flex-col items-center gap-2 w-20">
        {match.team2.imageUrl
          ? <img src={match.team2.imageUrl} alt={match.team2.name} className="h-10 w-10 rounded-lg object-contain" style={{ background: 'var(--raised)' }} />
          : <div className="h-10 w-10 rounded-lg flex items-center justify-center text-[11px] font-black" style={{ background: 'var(--raised)' }}>
              {match.team2.name.slice(0, 3)}
            </div>
        }
        <p className="text-[12px] font-black text-center leading-tight">{match.team2.name}</p>
      </div>
    </div>
    {match.twitchChannel && (
      <div className="px-4 pb-4">
        <button onClick={() => onWatch(match.twitchChannel!)}
          className="flex w-full items-center justify-center gap-2 rounded-xl py-2.5 text-[13px] font-bold text-white transition hover:opacity-90"
          style={{ background: '#9147ff' }}>
          <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 fill-current">
            <path d="M11.571 4.714h1.715v5.143H11.57zm4.715 0H18v5.143h-1.714zM6 0L1.714 4.286v15.428h5.143V24l4.286-4.286h3.428L22.286 12V0zm14.571 11.143l-3.428 3.428h-3.429l-3 3v-3H6.857V1.714h13.714z"/>
          </svg>
          Regarder sur Twitch
        </button>
      </div>
    )}
  </motion.div>
);

/* ── Tournament card ── */
const TournamentCard: React.FC<{ t: EsportsTournament; onWatch?: () => void }> = ({ t, onWatch }) => {
  const isLive  = t.status === 'live';
  const fmtDate = (s?: string) => s ? new Date(s).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' }) : '';
  const dateRange = t.beginAt && t.endAt
    ? `${fmtDate(t.beginAt)} – ${fmtDate(t.endAt)}`
    : t.beginAt ? `À partir du ${fmtDate(t.beginAt)}` : '';
  return (
    <motion.div {...fd()} className="card card-hover overflow-hidden"
      style={isLive ? { borderColor: 'rgba(255,70,84,0.35)' } : undefined}>
      <div className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <div className="mb-2 flex items-center gap-2">
              <span className="rounded-full px-2.5 py-0.5 text-[10px] font-bold"
                style={{ background: isLive ? 'rgba(255,70,84,0.12)' : 'rgba(255,255,255,0.06)', color: isLive ? 'var(--red)' : 'var(--text3)' }}>
                {isLive ? '🔴 EN DIRECT' : '📅 À VENIR'}
              </span>
              <span className="text-[10px] font-semibold" style={{ color: '#FF4654' }}>VALORANT</span>
            </div>
            <h3 className="text-[15px] font-bold mb-0.5">{t.name}</h3>
            <p className="text-[12px]" style={{ color: 'var(--text3)' }}>
              {[t.location, dateRange].filter(Boolean).join(' · ')}
            </p>
          </div>
          {t.prizepool && (
            <div className="shrink-0 text-right">
              <p className="text-[10px] mb-0.5" style={{ color: 'var(--text3)' }}>Dotation</p>
              <p className="text-[15px] font-bold" style={{ color: '#FF4654' }}>{t.prizepool}</p>
            </div>
          )}
        </div>
        <div className="mt-3 flex items-center justify-between" style={{ borderTop: '1px solid var(--border)', paddingTop: '0.75rem' }}>
          <div className="flex gap-5">
            {t.teams > 0 && (
              <div>
                <p className="text-[10px]" style={{ color: 'var(--text3)' }}>Équipes</p>
                <p className="text-[14px] font-bold">{t.teams}</p>
              </div>
            )}
            {t.serie && (
              <div>
                <p className="text-[10px]" style={{ color: 'var(--text3)' }}>Série</p>
                <p className="text-[13px] font-semibold truncate max-w-[120px]">{t.serie}</p>
              </div>
            )}
          </div>
          {onWatch && (
            <motion.button whileTap={{ scale: 0.94 }} transition={sp} onClick={onWatch}
              className="flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-[12px] font-bold text-white"
              style={{ background: '#9147ff' }}>
              <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 fill-current">
                <path d="M11.571 4.714h1.715v5.143H11.57zm4.715 0H18v5.143h-1.714zM6 0L1.714 4.286v15.428h5.143V24l4.286-4.286h3.428L22.286 12V0zm14.571 11.143l-3.428 3.428h-3.429l-3 3v-3H6.857V1.714h13.714z"/>
              </svg>
              Regarder
            </motion.button>
          )}
        </div>
      </div>
    </motion.div>
  );
};

/* ── Main page ── */
const TournamentPage: React.FC<TournamentPageProps> = () => {
  const [liveMatches,    setLiveMatches]   = useState<LiveMatch[]>([]);
  const [liveTourneys,   setLiveTourneys]  = useState<EsportsTournament[]>([]);
  const [upcomingTourneys, setUpcoming]    = useState<EsportsTournament[]>([]);
  const [bracket,        setBracket]       = useState<BracketMatch[]>([]);
  const [bracketName,    setBracketName]   = useState('');
  const [loading,        setLoading]       = useState(hasPandaToken());
  const [streamChannel,  setStreamChannel] = useState('valorant');
  const [showStream,     setShowStream]    = useState(false);
  const [activeTab,      setActiveTab]     = useState<'live' | 'upcoming'>('live');
  const hasToken = hasPandaToken();

  const targetRef = useRef(Date.now() + 6 * 3_600_000 + 30 * 60_000);
  const [cd, setCd] = useState({ h: '06', m: '30', s: '00' });

  useEffect(() => {
    const id = setInterval(() => {
      const d = Math.max(0, targetRef.current - Date.now());
      setCd({
        h: String(Math.floor(d / 3_600_000)).padStart(2, '0'),
        m: String(Math.floor((d % 3_600_000) / 60_000)).padStart(2, '0'),
        s: String(Math.floor((d % 60_000) / 1000)).padStart(2, '0'),
      });
    }, 1000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    if (!hasToken) return;
    setLoading(true);
    Promise.all([getLiveMatches(), getRunningTournaments(), getUpcomingTournaments()])
      .then(async ([matches, live, upcoming]) => {
        setLiveMatches(matches);
        setLiveTourneys(live);
        setUpcoming(upcoming);
        // Fetch bracket for first live tournament
        if (live.length > 0) {
          setBracketName(live[0].name);
          const b = await getTournamentBracket(live[0].id);
          setBracket(b);
        }
      })
      .finally(() => setLoading(false));
  }, []);

  const displayedLive     = hasToken ? liveTourneys     : MOCK_LIVE;
  const displayedUpcoming = hasToken ? upcomingTourneys : MOCK_UPCOMING;
  const displayedMatches  = hasToken ? liveMatches      : [MOCK_MATCH];

  const openWatch = (channel: string) => {
    setStreamChannel(channel);
    setShowStream(true);
  };

  return (
    <div className="page-enter flex h-full overflow-hidden">

      {/* ── Left ── */}
      <div className="flex-1 overflow-y-auto p-6 min-w-0 space-y-6">

        {/* Header */}
        <motion.div {...fd(0)} className="overflow-hidden rounded-2xl px-6 py-5"
          style={{ background: 'linear-gradient(135deg,rgba(255,70,84,0.15) 0%,rgba(255,70,84,0.03) 100%)', border: '1px solid rgba(255,70,84,0.25)' }}>
          <div className="flex items-center justify-between">
            <div>
              <span className="mb-2 flex w-fit items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-bold"
                style={{ background: 'rgba(255,70,84,0.15)', color: 'var(--red)' }}>
                <span className="animate-pulse">●</span> VALORANT ESPORTS
              </span>
              <h1 className="text-[24px] font-black">Tournois Valorant</h1>
              <p className="mt-0.5 text-[13px]" style={{ color: 'var(--text2)' }}>
                {hasToken ? 'Données live via PandaScore' : 'Configurez PandaScore pour les données en temps réel'}
              </p>
            </div>
            <motion.button whileTap={{ scale: 0.95 }} transition={sp}
              onClick={() => setShowStream(s => !s)}
              className="flex items-center gap-2 rounded-xl px-5 py-3 text-[13px] font-bold text-white"
              style={{ background: '#9147ff' }}>
              <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current">
                <path d="M11.571 4.714h1.715v5.143H11.57zm4.715 0H18v5.143h-1.714zM6 0L1.714 4.286v15.428h5.143V24l4.286-4.286h3.428L22.286 12V0zm14.571 11.143l-3.428 3.428h-3.429l-3 3v-3H6.857V1.714h13.714z"/>
              </svg>
              {showStream ? 'Masquer' : 'Regarder sur Twitch'}
            </motion.button>
          </div>
        </motion.div>

        {/* Stream inline */}
        <AnimatePresence>
          {showStream && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
              transition={sp} className="overflow-hidden">
              <div className="mb-2 flex items-center justify-between">
                <div className="flex gap-1.5 overflow-x-auto pb-1">
                  {STREAMS.map(s => (
                    <button key={s.channel} onClick={() => setStreamChannel(s.channel)}
                      className="flex shrink-0 items-center gap-1.5 rounded-xl px-3 py-1.5 text-[11px] font-semibold transition"
                      style={{
                        background: streamChannel === s.channel ? '#9147ff' : 'var(--surface)',
                        border: `1px solid ${streamChannel === s.channel ? '#9147ff' : 'var(--border)'}`,
                        color: streamChannel === s.channel ? 'white' : 'var(--text2)',
                      }}>
                      {s.live && <span className="h-1.5 w-1.5 rounded-full" style={{ background: 'var(--red)' }} />}
                      {s.name} <span className="opacity-50">{s.lang}</span>
                    </button>
                  ))}
                </div>
                <button onClick={() => setShowStream(false)}
                  className="ml-2 shrink-0 rounded-lg px-2 py-1 text-[12px] transition hover:bg-white/10"
                  style={{ color: 'var(--text3)' }}>✕ Fermer</button>
              </div>
              <TwitchPanel channel={streamChannel} />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Bracket (real or hidden if empty) */}
        {!loading && bracket.length > 0 && (
          <BracketView matches={bracket} tourneyName={bracketName} />
        )}
        {!loading && bracket.length === 0 && hasToken && (
          <motion.div {...fd(0.08)} className="rounded-xl p-4 text-center"
            style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
            <p className="text-[13px]" style={{ color: 'var(--text3)' }}>
              Aucun bracket disponible pour le tournoi en cours
            </p>
          </motion.div>
        )}

        {/* Tabs */}
        <div className="flex gap-2">
          {(['live', 'upcoming'] as const).map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              className="rounded-xl px-4 py-2 text-[13px] font-semibold transition"
              style={{
                background: activeTab === tab ? (tab === 'live' ? '#FF4654' : 'var(--violet)') : 'var(--surface)',
                border: `1px solid ${activeTab === tab ? 'transparent' : 'var(--border)'}`,
                color: activeTab === tab ? 'white' : 'var(--text2)',
              }}>
              {tab === 'live' ? '🔴 En direct' : '📅 À venir'}
            </button>
          ))}
        </div>

        {/* Loading */}
        {loading && (
          <div className="flex items-center gap-3 py-4" style={{ color: 'var(--text3)' }}>
            <div className="h-4 w-4 animate-spin rounded-full border-2" style={{ borderColor: 'var(--raised)', borderTopColor: '#FF4654' }} />
            <span className="text-[13px]">Chargement des tournois Valorant…</span>
          </div>
        )}

        {/* Cards */}
        {!loading && (
          <div className="grid grid-cols-2 gap-4">
            {(activeTab === 'live' ? displayedLive : displayedUpcoming).map(t => (
              <TournamentCard key={t.id} t={t}
                onWatch={t.twitchChannel ? () => openWatch(t.twitchChannel!) : undefined} />
            ))}
            {(activeTab === 'live' ? displayedLive : displayedUpcoming).length === 0 && (
              <div className="col-span-2 rounded-xl p-10 text-center"
                style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
                <p className="text-[16px] font-semibold" style={{ color: 'var(--text2)' }}>
                  {activeTab === 'live' ? 'Aucun tournoi Valorant en direct' : 'Aucun tournoi à venir'}
                </p>
                <p className="mt-1.5 text-[13px]" style={{ color: 'var(--text3)' }}>Revenez plus tard</p>
              </div>
            )}
          </div>
        )}

        {/* Upcoming countdown */}
        {activeTab === 'upcoming' && !loading && displayedUpcoming.length > 0 && (
          <motion.div {...fd(0.1)} className="card p-6 text-center"
            style={{ border: '1px solid rgba(255,70,84,0.2)' }}>
            <p className="mb-3 text-[10px] font-semibold uppercase tracking-widest" style={{ color: '#FF4654' }}>
              Prochain tournoi Valorant dans
            </p>
            <p className="font-mono text-[48px] font-black tabular-nums">{cd.h}:{cd.m}:{cd.s}</p>
            <p className="mt-2 text-[13px]" style={{ color: 'var(--text3)' }}>
              {displayedUpcoming[0]?.name ?? 'Prochain événement'}
            </p>
          </motion.div>
        )}
      </div>

      {/* ── Right sidebar ── */}
      <aside className="w-72 shrink-0 overflow-y-auto p-4 space-y-4"
        style={{ borderLeft: '1px solid var(--border)' }}>

        {/* Live match scores */}
        {loading && (
          <div className="card p-4 flex items-center gap-3" style={{ color: 'var(--text3)' }}>
            <div className="h-4 w-4 animate-spin rounded-full border-2" style={{ borderColor: 'var(--raised)', borderTopColor: '#FF4654' }} />
            <span className="text-[12px]">Matchs en cours…</span>
          </div>
        )}
        {!loading && displayedMatches.map(m => (
          <LiveMatchCard key={m.id} match={m} onWatch={openWatch} />
        ))}
        {!loading && displayedMatches.length === 0 && (
          <div className="card p-4 text-center">
            <p className="text-[13px]" style={{ color: 'var(--text3)' }}>Aucun match en direct</p>
          </div>
        )}

        {/* Streams */}
        <div className="card overflow-hidden">
          <p className="px-4 py-3 text-[11px] font-semibold uppercase tracking-widest"
            style={{ color: 'var(--text3)', borderBottom: '1px solid var(--border)' }}>
            Streams Valorant
          </p>
          {STREAMS.map((s, i) => (
            <button key={s.channel}
              onClick={() => { setStreamChannel(s.channel); setShowStream(true); }}
              className="flex w-full items-center gap-3 px-4 py-3 text-left transition hover:bg-white/5"
              style={i < STREAMS.length - 1 ? { borderBottom: '1px solid var(--border)' } : undefined}>
              <span className="h-2 w-2 rounded-full shrink-0" style={{ background: s.live ? '#FF4654' : 'var(--raised)' }} />
              <div className="flex-1 min-w-0">
                <p className="text-[13px] font-semibold">{s.name}</p>
                <p className="text-[11px]" style={{ color: 'var(--text3)' }}>
                  {s.live ? '🔴 En direct' : 'Hors ligne'} · {s.lang}
                </p>
              </div>
              <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 fill-current shrink-0" style={{ color: '#9147ff' }}>
                <path d="M11.571 4.714h1.715v5.143H11.57zm4.715 0H18v5.143h-1.714zM6 0L1.714 4.286v15.428h5.143V24l4.286-4.286h3.428L22.286 12V0zm14.571 11.143l-3.428 3.428h-3.429l-3 3v-3H6.857V1.714h13.714z"/>
              </svg>
            </button>
          ))}
        </div>

        {/* Valorant logo / branding */}
        <div className="rounded-xl p-4 text-center"
          style={{ background: 'linear-gradient(135deg,rgba(255,70,84,0.1),rgba(255,70,84,0.02))', border: '1px solid rgba(255,70,84,0.2)' }}>
          <p className="text-[18px] font-black tracking-widest" style={{ color: '#FF4654' }}>VALORANT</p>
          <p className="mt-1 text-[11px]" style={{ color: 'var(--text3)' }}>Esports officiel via PandaScore</p>
        </div>
      </aside>

      {/* Full-screen stream modal */}
      <AnimatePresence>
        {showStream && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/90 backdrop-blur-sm p-6"
            onClick={() => setShowStream(false)}>
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} transition={sp}
              className="relative w-full max-w-5xl" onClick={e => e.stopPropagation()}>
              <div className="mb-3 flex items-center justify-between">
                <div className="flex gap-2 overflow-x-auto">
                  {STREAMS.map(s => (
                    <button key={s.channel} onClick={() => setStreamChannel(s.channel)}
                      className="shrink-0 rounded-xl px-3 py-1.5 text-[12px] font-semibold transition"
                      style={{ background: streamChannel === s.channel ? '#9147ff' : 'rgba(255,255,255,0.1)', color: 'white' }}>
                      {s.name}
                    </button>
                  ))}
                </div>
                <button onClick={() => setShowStream(false)}
                  className="ml-3 flex h-8 w-8 shrink-0 items-center justify-center rounded-full transition hover:bg-white/20"
                  style={{ background: 'rgba(255,255,255,0.1)', color: 'white' }}>✕</button>
              </div>
              <TwitchPanel channel={streamChannel} />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default TournamentPage;
