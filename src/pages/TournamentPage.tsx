import React, { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';

interface TournamentPageProps {
  onNavigate?: (page: string) => void;
}

// ─── data ────────────────────────────────────────────────────────────────────

const MAJORS = [
  {
    id: 1,
    name: 'VCT CHAMPIONS 2025',
    game: 'VALORANT',
    status: 'live' as const,
    location: 'Berlin, Allemagne',
    prize: '1 000 000 $',
    teams: 16,
    dates: '10–24 Août 2025',
    phase: 'Demi-finales',
    twitchChannel: 'valorant',
    color: '#FF4654',
    badge: '🔴 EN DIRECT',
  },
  {
    id: 2,
    name: 'BLAST PREMIER WORLD FINAL',
    game: 'CS2',
    status: 'upcoming' as const,
    location: 'Copenhague, Danemark',
    prize: '500 000 $',
    teams: 8,
    dates: '22–28 Sept 2025',
    phase: 'Ouverture 3 sept.',
    twitchChannel: 'blastpremier',
    color: '#0094FF',
    badge: '📅 À VENIR',
  },
  {
    id: 3,
    name: 'WORLDS 2025',
    game: 'LEAGUE OF LEGENDS',
    status: 'upcoming' as const,
    location: 'Shanghai, Chine',
    prize: '2 225 000 $',
    teams: 22,
    dates: '25 Sept–2 Nov 2025',
    phase: 'Qualifications',
    twitchChannel: 'riotgames',
    color: '#C89B3C',
    badge: '📅 À VENIR',
  },
  {
    id: 4,
    name: 'THE INTERNATIONAL 2025',
    game: 'DOTA 2',
    status: 'upcoming' as const,
    location: 'Seattle, USA',
    prize: '40 000 000 $+',
    teams: 18,
    dates: 'Oct–Nov 2025',
    phase: 'Qualifications',
    twitchChannel: 'dota2ti',
    color: '#AA0000',
    badge: '📅 À VENIR',
  },
];

const STREAMS = [
  { channel: 'valorant',     name: 'VCT Officiel', lang: 'EN', live: true },
  { channel: 'valorantfr',   name: 'VCT France',   lang: 'FR', live: true },
  { channel: 'blastpremier', name: 'BLAST CS2',     lang: 'EN', live: false },
  { channel: 'riotgames',    name: 'Riot Games',    lang: 'EN', live: false },
];

// VCT Champions 2025 bracket
const TEAMS: Record<string, { name: string; region: string; color: string }> = {
  navi:      { name: 'NAVI',       region: 'EU', color: '#FFD700' },
  loud:      { name: 'LOUD',       region: 'SA', color: '#00CC44' },
  sentinels: { name: 'SENTINELS',  region: 'NA', color: '#FF4444' },
  fnatic:    { name: 'FNATIC',     region: 'EU', color: '#FF6B00' },
  drx:       { name: 'DRX',        region: 'KR', color: '#FF0080' },
  cloud9:    { name: 'CLOUD9',     region: 'NA', color: '#0088FF' },
  edg:       { name: 'EDG',        region: 'CN', color: '#CC0000' },
  prx:       { name: 'PRX',        region: 'AP', color: '#9333EA' },
};

const BRACKET = {
  quarterFinals: [
    { id: 'qf1', t1: 'navi',      t2: 'prx',     s1: 2, s2: 0, winner: 'navi',     status: 'done' },
    { id: 'qf2', t1: 'loud',      t2: 'cloud9',  s1: 2, s2: 1, winner: 'loud',     status: 'done' },
    { id: 'qf3', t1: 'sentinels', t2: 'edg',     s1: 1, s2: 2, winner: 'edg',      status: 'done' },
    { id: 'qf4', t1: 'fnatic',    t2: 'drx',     s1: 2, s2: 0, winner: 'fnatic',   status: 'done' },
  ],
  semiFinals: [
    { id: 'sf1', t1: 'navi', t2: 'loud',   s1: 1, s2: 0, winner: null, status: 'live' },
    { id: 'sf2', t1: 'edg',  t2: 'fnatic', s1: 0, s2: 0, winner: null, status: 'upcoming' },
  ],
  final: { id: 'f1', t1: null as string | null, t2: null as string | null, status: 'upcoming' },
};

const LIVE_MATCH = {
  tournament: 'VCT Champions 2025 – Demi-finale 1',
  map: 'Ascent · Map 2/3',
  t1: { name: 'NAVI', flag: '🇺🇦', score: 10, color: '#FFD700' },
  t2: { name: 'LOUD', flag: '🇧🇷', score: 8,  color: '#00CC44' },
  time: '23:14',
};

// ─── helpers ──────────────────────────────────────────────────────────────────

const spring = { type: 'spring' as const, stiffness: 320, damping: 28 };
const fadeUp = { hidden: { opacity: 0, y: 14 }, show: { opacity: 1, y: 0, transition: spring } };
const stagger = { show: { transition: { staggerChildren: 0.07 } } };

// ─── Live score pill ──────────────────────────────────────────────────────────

const LiveScore: React.FC = () => {
  const [tick, setTick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setTick(t => t + 1), 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <motion.div
      variants={fadeUp}
      className="mb-4 overflow-hidden rounded-2xl border border-white/[0.07] bg-white/[0.03] backdrop-blur-sm"
    >
      <div className="flex items-center gap-2 border-b border-white/[0.06] px-4 py-2.5">
        <span className="relative flex h-2 w-2">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-500 opacity-75" />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-red-500" />
        </span>
        <p className="text-[10px] font-extrabold uppercase tracking-widest text-red-400">
          Match en direct
        </p>
        <p className="ml-auto text-[10px] text-white/30">{LIVE_MATCH.map}</p>
      </div>

      <div className="flex items-center justify-between px-5 py-4">
        <div className="flex flex-col items-center gap-1">
          <span className="text-2xl">{LIVE_MATCH.t1.flag}</span>
          <p className="text-sm font-extrabold" style={{ color: LIVE_MATCH.t1.color }}>
            {LIVE_MATCH.t1.name}
          </p>
        </div>

        <div className="flex items-center gap-4">
          <motion.p
            key={`${LIVE_MATCH.t1.score}-${tick}`}
            initial={{ scale: 1.3 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.2 }}
            className="text-5xl font-black tabular-nums"
            style={{ color: LIVE_MATCH.t1.color }}
          >
            {LIVE_MATCH.t1.score}
          </motion.p>
          <div className="flex flex-col items-center gap-0.5">
            <p className="text-xs text-white/30">vs</p>
            <p className="text-[10px] font-mono text-white/20">{LIVE_MATCH.time}</p>
          </div>
          <motion.p
            key={`${LIVE_MATCH.t2.score}-${tick}`}
            initial={{ scale: 1.3 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.2 }}
            className="text-5xl font-black tabular-nums"
            style={{ color: LIVE_MATCH.t2.color }}
          >
            {LIVE_MATCH.t2.score}
          </motion.p>
        </div>

        <div className="flex flex-col items-center gap-1">
          <span className="text-2xl">{LIVE_MATCH.t2.flag}</span>
          <p className="text-sm font-extrabold" style={{ color: LIVE_MATCH.t2.color }}>
            {LIVE_MATCH.t2.name}
          </p>
        </div>
      </div>

      <p className="pb-3 text-center text-[10px] text-white/30">{LIVE_MATCH.tournament}</p>
    </motion.div>
  );
};

// ─── Twitch embed ─────────────────────────────────────────────────────────────

const TwitchPanel: React.FC<{ channel: string }> = ({ channel }) => {
  const parent = window.location.hostname || 'localhost';
  const src = `https://player.twitch.tv/?channel=${channel}&parent=${parent}&autoplay=false&muted=false`;

  return (
    <div className="aspect-video w-full overflow-hidden rounded-2xl border border-white/[0.07] bg-black">
      <iframe
        key={channel}
        src={src}
        title={`Stream ${channel}`}
        allowFullScreen
        className="h-full w-full"
      />
    </div>
  );
};

// ─── Bracket ──────────────────────────────────────────────────────────────────

const TeamSlot: React.FC<{
  teamId: string | null;
  score?: number;
  isWinner?: boolean;
  isLive?: boolean;
}> = ({ teamId, score, isWinner, isLive }) => {
  const team = teamId ? TEAMS[teamId] : null;

  return (
    <div
      className={`flex items-center justify-between rounded-lg px-3 py-2 transition ${
        isLive
          ? 'border border-red-500/40 bg-red-500/8'
          : isWinner
          ? 'border border-white/10 bg-white/[0.06]'
          : 'border border-white/[0.05] bg-white/[0.02]'
      }`}
    >
      <div className="flex items-center gap-2">
        {team ? (
          <>
            <span
              className="h-2 w-2 shrink-0 rounded-full"
              style={{ backgroundColor: team.color }}
            />
            <p className={`text-xs font-extrabold ${isWinner ? 'text-white' : 'text-white/60'}`}>
              {team.name}
            </p>
            <span className="text-[9px] text-white/20">{team.region}</span>
          </>
        ) : (
          <p className="text-xs text-white/20">TBD</p>
        )}
      </div>
      {score !== undefined && (
        <p className={`text-sm font-extrabold tabular-nums ${isWinner ? 'text-white' : 'text-white/40'}`}>
          {score}
        </p>
      )}
      {isLive && <span className="ml-2 h-1.5 w-1.5 animate-pulse rounded-full bg-red-500" />}
    </div>
  );
};

const BracketMatch: React.FC<{
  match: typeof BRACKET.semiFinals[0] | typeof BRACKET.quarterFinals[0];
  round: string;
}> = ({ match, round }) => {
  const isLive = match.status === 'live';
  const isDone = match.status === 'done';

  return (
    <div className="min-w-[160px]">
      <p className="mb-1.5 text-[9px] font-bold uppercase tracking-widest text-white/20">{round}</p>
      <div className={`space-y-1 rounded-xl border p-2 ${isLive ? 'border-red-500/30 shadow-sm shadow-red-500/10' : 'border-white/[0.06]'}`}>
        <TeamSlot
          teamId={match.t1}
          score={'s1' in match ? match.s1 : undefined}
          isWinner={isDone && 'winner' in match && match.winner === match.t1}
          isLive={isLive}
        />
        <TeamSlot
          teamId={match.t2}
          score={'s2' in match ? match.s2 : undefined}
          isWinner={isDone && 'winner' in match && match.winner === match.t2}
          isLive={isLive}
        />
      </div>
      {isLive && (
        <div className="mt-1.5 flex items-center gap-1">
          <span className="h-1.5 w-1.5 animate-ping rounded-full bg-red-500" />
          <p className="text-[9px] font-bold text-red-400">LIVE</p>
        </div>
      )}
    </div>
  );
};

// Pair of bracket connector lines (top-corner + bottom-corner)
const BracketConn: React.FC<{ dir: 'right' | 'left' }> = ({ dir }) => {
  const r = dir === 'right';
  return (
    <div className="flex flex-col self-stretch w-4 shrink-0">
      <div className={`flex-1 border-white/10 border-t ${r ? 'rounded-tr-lg border-r' : 'rounded-tl-lg border-l'}`} />
      <div className={`flex-1 border-white/10 border-b ${r ? 'rounded-br-lg border-r' : 'rounded-bl-lg border-l'}`} />
    </div>
  );
};

const Bracket: React.FC = () => {
  const finalMatch = {
    id: 'f1', t1: null as string | null, t2: null as string | null,
    s1: 0, s2: 0, winner: null as string | null, status: 'upcoming' as const,
  };

  return (
    <motion.div variants={fadeUp} className="mb-4">
      <div className="mb-3 flex items-center justify-between">
        <p className="text-[11px] font-extrabold uppercase tracking-[0.16em] text-white/40">
          Bracket — VCT Champions 2025
        </p>
        <span className="rounded-full bg-red-500/15 px-2 py-0.5 text-[9px] font-bold text-red-400">
          SF EN COURS
        </span>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-white/[0.06] bg-white/[0.02] p-4">
        {/* Layout: [QF1, QF2] ─conn─ [SF1] ─line─ [FINAL] ─line─ [SF2] ─conn─ [QF3, QF4] */}
        <div className="flex min-w-[720px] items-stretch gap-0">

          {/* Left QFs */}
          <div className="flex flex-col gap-3 justify-around">
            <BracketMatch match={BRACKET.quarterFinals[0]} round="QF 1" />
            <BracketMatch match={BRACKET.quarterFinals[1]} round="QF 2" />
          </div>

          <BracketConn dir="right" />

          {/* SF1 (vertically centered between QF1 and QF2) */}
          <div className="flex items-center">
            <BracketMatch match={BRACKET.semiFinals[0]} round="SF 1" />
          </div>

          {/* Line SF1 → FINAL */}
          <div className="flex items-center w-6">
            <div className="w-full h-px bg-white/10" />
          </div>

          {/* FINAL */}
          <div className="flex items-center">
            <BracketMatch match={finalMatch} round="FINALE" />
          </div>

          {/* Line FINAL → SF2 */}
          <div className="flex items-center w-6">
            <div className="w-full h-px bg-white/10" />
          </div>

          {/* SF2 (vertically centered between QF3 and QF4) */}
          <div className="flex items-center">
            <BracketMatch match={BRACKET.semiFinals[1]} round="SF 2" />
          </div>

          <BracketConn dir="left" />

          {/* Right QFs */}
          <div className="flex flex-col gap-3 justify-around">
            <BracketMatch match={BRACKET.quarterFinals[2]} round="QF 3" />
            <BracketMatch match={BRACKET.quarterFinals[3]} round="QF 4" />
          </div>

        </div>
      </div>
    </motion.div>
  );
};

// ─── Major tournament card ─────────────────────────────────────────────────────

const MajorCard: React.FC<{
  major: typeof MAJORS[0];
  onWatch: () => void;
}> = ({ major, onWatch }) => {
  const isLive = major.status === 'live';
  return (
    <motion.div
      variants={fadeUp}
      whileHover={{ scale: 1.015 }}
      transition={spring}
      className="rounded-2xl border border-white/[0.07] bg-white/[0.03] p-4 backdrop-blur-sm"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="mb-1 flex items-center gap-2">
            <span
              className={`rounded-full px-2 py-0.5 text-[9px] font-extrabold ${
                isLive ? 'bg-red-500/20 text-red-400' : 'bg-white/8 text-white/40'
              }`}
            >
              {major.badge}
            </span>
            <span className="text-[9px] text-white/30">{major.game}</span>
          </div>
          <h3 className="truncate text-sm font-extrabold leading-tight">{major.name}</h3>
          <p className="mt-0.5 text-[11px] text-white/40">{major.location} · {major.dates}</p>
        </div>
        <div className="shrink-0 text-right">
          <p className="text-[10px] text-white/30">Dotation</p>
          <p className="text-sm font-extrabold" style={{ color: major.color }}>{major.prize}</p>
        </div>
      </div>

      <div className="mt-3 flex items-center justify-between border-t border-white/[0.06] pt-3">
        <div className="flex items-center gap-3">
          <div className="text-center">
            <p className="text-[9px] text-white/30">Équipes</p>
            <p className="text-xs font-bold">{major.teams}</p>
          </div>
          <div className="text-center">
            <p className="text-[9px] text-white/30">Phase</p>
            <p className="text-xs font-bold">{major.phase}</p>
          </div>
        </div>
        {isLive && (
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            transition={spring}
            onClick={onWatch}
            className="flex items-center gap-1.5 rounded-xl bg-red-600 px-3 py-1.5 text-[11px] font-extrabold uppercase text-white hover:bg-red-500"
          >
            <span className="animate-pulse">●</span> Regarder
          </motion.button>
        )}
      </div>
    </motion.div>
  );
};

// ─── Main page ────────────────────────────────────────────────────────────────

const TournamentPage: React.FC<TournamentPageProps> = ({ onNavigate }) => {
  const [activeStream, setActiveStream] = useState(STREAMS[0]);
  const [showStream, setShowStream] = useState(false);
  const [activeTab, setActiveTab] = useState<'live' | 'upcoming'>('live');
  const [countdown, setCountdown] = useState({ h: '04', m: '12', s: '44' });

  const targetRef = useRef(Date.now() + 4 * 3600_000 + 12 * 60_000 + 44_000);

  useEffect(() => {
    const id = setInterval(() => {
      const diff = Math.max(0, targetRef.current - Date.now());
      const h = String(Math.floor(diff / 3600_000)).padStart(2, '0');
      const m = String(Math.floor((diff % 3600_000) / 60_000)).padStart(2, '0');
      const s = String(Math.floor((diff % 60_000) / 1000)).padStart(2, '0');
      setCountdown({ h, m, s });
    }, 1000);
    return () => clearInterval(id);
  }, []);

  const liveMajors     = MAJORS.filter(m => m.status === 'live');
  const upcomingMajors = MAJORS.filter(m => m.status === 'upcoming');

  return (
    <main className="flex-1 overflow-y-auto bg-[#050d1a] pb-24">

      {/* Header */}
      <header className="sticky top-0 z-20 flex items-center justify-between border-b border-white/[0.06] bg-[#050d1a]/90 px-4 py-4 backdrop-blur-md">
        <button
          type="button"
          onClick={() => onNavigate?.('home')}
          className="text-white/50 transition hover:text-white"
        >
          ←
        </button>
        <span className="text-sm font-extrabold uppercase tracking-widest">Tournois Majeurs</span>
        <div className="w-6" />
      </header>

      <motion.div variants={stagger} initial="hidden" animate="show" className="px-4 pt-5">

        {/* Hero banner */}
        <motion.div
          variants={fadeUp}
          className="relative mb-5 overflow-hidden rounded-3xl border border-red-500/20 bg-gradient-to-br from-red-950/60 to-[#050d1a]"
        >
          <div className="absolute right-0 top-0 h-48 w-48 rounded-full bg-red-500/5 blur-3xl" />
          <div className="relative px-5 py-6">
            <div className="mb-1 flex items-center gap-2">
              <span className="flex items-center gap-1.5 rounded-full bg-red-500/20 px-2.5 py-1 text-[10px] font-extrabold text-red-400">
                <span className="animate-pulse">●</span> EN DIRECT MAINTENANT
              </span>
            </div>
            <h1 className="mb-0.5 text-2xl font-black leading-tight text-white">
              VCT CHAMPIONS<br />2025
            </h1>
            <p className="mb-4 text-xs text-white/40">Berlin · Demi-finales · 1 000 000 $ dotation</p>

            <div className="flex gap-2">
              <motion.button
                whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} transition={spring}
                onClick={() => setShowStream(true)}
                className="flex items-center gap-2 rounded-xl bg-[#9147ff] px-4 py-2.5 text-xs font-extrabold uppercase text-white hover:bg-[#7d3be6]"
              >
                <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 fill-current">
                  <path d="M11.571 4.714h1.715v5.143H11.57zm4.715 0H18v5.143h-1.714zM6 0L1.714 4.286v15.428h5.143V24l4.286-4.286h3.428L22.286 12V0zm14.571 11.143l-3.428 3.428h-3.429l-3 3v-3H6.857V1.714h13.714z"/>
                </svg>
                Regarder sur Twitch
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} transition={spring}
                onClick={() => setShowStream(true)}
                className="rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-xs font-extrabold uppercase text-white hover:bg-white/10"
              >
                Bracket →
              </motion.button>
            </div>
          </div>
        </motion.div>

        {/* Live match score */}
        <LiveScore />

        {/* Stream section */}
        <AnimatePresence>
          {showStream && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={spring}
              className="mb-4 overflow-hidden"
            >
              <div className="mb-2 flex items-center justify-between">
                <div className="flex gap-1.5 overflow-x-auto scrollbar-hide pb-1">
                  {STREAMS.map(s => (
                    <button
                      key={s.channel}
                      onClick={() => setActiveStream(s)}
                      className={`flex shrink-0 items-center gap-1.5 rounded-xl px-3 py-1.5 text-[11px] font-bold transition ${
                        activeStream.channel === s.channel
                          ? 'bg-[#9147ff] text-white'
                          : 'border border-white/10 bg-white/5 text-white/60 hover:text-white'
                      }`}
                    >
                      {s.live && <span className="h-1.5 w-1.5 rounded-full bg-red-400" />}
                      {s.name}
                      <span className="text-[9px] opacity-60">{s.lang}</span>
                    </button>
                  ))}
                </div>
                <button
                  onClick={() => setShowStream(false)}
                  className="ml-2 shrink-0 text-white/30 hover:text-white"
                >
                  ✕
                </button>
              </div>
              <TwitchPanel channel={activeStream.channel} />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Bracket */}
        <Bracket />

        {/* Tabs */}
        <div className="mb-4 flex gap-2">
          {(['live', 'upcoming'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`rounded-xl px-4 py-2 text-xs font-extrabold uppercase tracking-wide transition ${
                activeTab === tab
                  ? tab === 'live'
                    ? 'bg-red-600 text-white'
                    : 'bg-blue-600 text-white'
                  : 'border border-white/10 bg-white/5 text-white/50 hover:text-white'
              }`}
            >
              {tab === 'live' ? '🔴 En direct' : '📅 À venir'}
            </button>
          ))}
        </div>

        {/* Tournament cards */}
        <motion.div variants={stagger} className="space-y-3 mb-4">
          {(activeTab === 'live' ? liveMajors : upcomingMajors).map(major => (
            <MajorCard
              key={major.id}
              major={major}
              onWatch={() => {
                setActiveStream(STREAMS.find(s => s.channel === major.twitchChannel) ?? STREAMS[0]);
                setShowStream(true);
              }}
            />
          ))}
        </motion.div>

        {/* Next major countdown */}
        {activeTab === 'upcoming' && (
          <motion.div
            variants={fadeUp}
            className="mb-4 rounded-2xl border border-blue-500/20 bg-blue-500/5 p-5 text-center"
          >
            <p className="mb-1 text-[10px] font-bold uppercase tracking-widest text-blue-400">
              Prochain tournoi majeur dans
            </p>
            <p className="font-mono text-5xl font-black tracking-tight tabular-nums text-white">
              {countdown.h}:{countdown.m}:{countdown.s}
            </p>
            <p className="mt-1 text-[11px] text-white/30">BLAST Premier World Final</p>
          </motion.div>
        )}

      </motion.div>

      {/* Full-screen stream modal */}
      <AnimatePresence>
        {showStream && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/90 backdrop-blur-sm p-4"
            onClick={() => setShowStream(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              transition={spring}
              className="relative w-full max-w-4xl"
              onClick={e => e.stopPropagation()}
            >
              <div className="mb-3 flex items-center justify-between">
                <div className="flex gap-2 overflow-x-auto scrollbar-hide">
                  {STREAMS.map(s => (
                    <button
                      key={s.channel}
                      onClick={() => setActiveStream(s)}
                      className={`shrink-0 rounded-xl px-3 py-1.5 text-xs font-bold transition ${
                        activeStream.channel === s.channel
                          ? 'bg-[#9147ff] text-white'
                          : 'bg-white/10 text-white/60 hover:bg-white/20 hover:text-white'
                      }`}
                    >
                      {s.name}
                    </button>
                  ))}
                </div>
                <button
                  onClick={() => setShowStream(false)}
                  className="ml-3 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20"
                >
                  ✕
                </button>
              </div>
              <TwitchPanel channel={activeStream.channel} />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </main>
  );
};

export default TournamentPage;
