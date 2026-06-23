// Esports data is proxied through the local API (which talks to vlr.gg via the
// community "vlresports" wrapper). The server caches responses; no token needed.
const API_BASE = (import.meta.env.VITE_API_URL as string | undefined) ?? 'http://localhost:3001';
let esportsConfigured = true;

export interface LiveMatch {
  id: number;
  name: string;
  tournament: string;
  serie?: string;
  team1: { name: string; score: number; imageUrl?: string };
  team2: { name: string; score: number; imageUrl?: string };
  twitchChannel?: string;
  map?: string;
  beginAt?: string;
}

export interface EsportsTournament {
  id: number;
  name: string;
  serie: string;
  status: 'live' | 'upcoming';
  location?: string;
  prizepool?: string;
  teams: number;
  beginAt?: string;
  endAt?: string;
  twitchChannel?: string;
  color: string;
}

export interface BracketMatch {
  id: string;
  t1Name?: string;
  t2Name?: string;
  t1Logo?: string;
  t2Logo?: string;
  s1: number;
  s2: number;
  winner?: string | null;
  status: 'done' | 'live' | 'upcoming';
  round: string;
}

const MONTHS: Record<string, number> = {
  jan: 0, feb: 1, mar: 2, apr: 3, may: 4, jun: 5,
  jul: 6, aug: 7, sep: 8, oct: 9, nov: 10, dec: 11,
};

// vlr events expose dates as a human string e.g. "Jun 21 Jul 5" (start … end).
// Turn the start into an ISO date so the UI can format it / run the countdown.
const parseVlrStart = (dates?: string): string | undefined => {
  if (!dates) return undefined;
  const m = dates.trim().match(/^([A-Za-z]{3})\s+(\d{1,2})/);
  if (!m) return undefined;
  const month = MONTHS[m[1].toLowerCase()];
  if (month === undefined) return undefined;
  const day = Number(m[2]);
  const now = new Date();
  let year = now.getUTCFullYear();
  let d = new Date(Date.UTC(year, month, day));
  // If the parsed date is well in the past, it belongs to next year.
  if (d.getTime() < now.getTime() - 60 * 86400000) {
    year += 1;
    d = new Date(Date.UTC(year, month, day));
  }
  return d.toISOString();
};

const fmtPrize = (p?: string): string | undefined => {
  const n = Number(p);
  return p && !Number.isNaN(n) && n > 0 ? `${n.toLocaleString('fr-FR')} $` : undefined;
};

// Calls the local API esports proxy and records whether esports data is available.
async function vlr<T>(proxyPath: string): Promise<T> {
  const res = await fetch(`${API_BASE}/esports/${proxyPath}`);
  if (!res.ok) throw new Error(`esports proxy ${res.status}: ${proxyPath}`);
  const json = await res.json() as { success?: boolean; configured?: boolean; data?: unknown };
  if (typeof json.configured === 'boolean') esportsConfigured = json.configured;
  return (Array.isArray(json.data) ? json.data : []) as unknown as T;
}

const isLive = (status?: string): boolean => (status || '').toLowerCase() === 'live';

export async function getLiveMatches(): Promise<LiveMatch[]> {
  try {
    const data: any[] = await vlr('matches/running');
    return data
      .filter(m => isLive(m.status) && Array.isArray(m.teams) && m.teams.length === 2)
      .map(m => ({
        id:         Number(m.id) || 0,
        name:       m.tournament ?? '',
        tournament: m.tournament ?? '',
        serie:      m.event ?? '',
        team1: {
          name:     m.teams[0]?.name ?? 'TBD',
          score:    Number(m.teams[0]?.score) || 0,
          imageUrl: m.teams[0]?.logo ?? undefined,
        },
        team2: {
          name:     m.teams[1]?.name ?? 'TBD',
          score:    Number(m.teams[1]?.score) || 0,
          imageUrl: m.teams[1]?.logo ?? undefined,
        },
        map:        undefined,
        beginAt:    m.utc ?? undefined,
      }));
  } catch (e) {
    console.error('vlr.gg live matches:', e);
    return [];
  }
}

// Resolve where a live match is being broadcast. Returns the direct Twitch URL
// when found, always with the vlr.gg match page as a guaranteed fallback.
export async function getMatchStream(id: number): Promise<{ twitchChannel?: string; twitchUrl?: string; url: string }> {
  const fallback = `https://www.vlr.gg/${id}`;
  try {
    const res = await fetch(`${API_BASE}/esports/matches/${id}/stream`);
    if (!res.ok) return { url: fallback };
    const json = await res.json() as { twitchChannel?: string | null; url?: string };
    const channel = json.twitchChannel || undefined;
    return {
      twitchChannel: channel,
      twitchUrl: channel ? `https://www.twitch.tv/${channel}` : undefined,
      url: json.url || fallback,
    };
  } catch {
    return { url: fallback };
  }
}

const mapEvent = (status: 'live' | 'upcoming') => (t: any): EsportsTournament => ({
  id:        Number(t.id) || 0,
  name:      t.name ?? '',
  serie:     (t.country || '').toUpperCase(),
  status,
  location:  t.country ? String(t.country).toUpperCase() : undefined,
  prizepool: fmtPrize(t.prizepool),
  teams:     0, // vlr's event list doesn't expose a team count
  beginAt:   parseVlrStart(t.dates),
  endAt:     undefined,
  twitchChannel: undefined,
  color:     '#FF4654',
});

export async function getRunningTournaments(): Promise<EsportsTournament[]> {
  try {
    const data: any[] = await vlr('tournaments/running');
    return data.map(mapEvent('live'));
  } catch (e) {
    console.error('vlr.gg running tourneys:', e);
    return [];
  }
}

export async function getUpcomingTournaments(): Promise<EsportsTournament[]> {
  try {
    const data: any[] = await vlr('tournaments/upcoming');
    return data
      .map(mapEvent('upcoming'))
      .sort((a, b) => (a.beginAt ? Date.parse(a.beginAt) : Infinity) - (b.beginAt ? Date.parse(b.beginAt) : Infinity));
  } catch (e) {
    console.error('vlr.gg upcoming tourneys:', e);
    return [];
  }
}

// vlr.gg has no per-event bracket feed through this wrapper; kept for API
// compatibility with TournamentPage (renders an empty bracket gracefully).
export async function getTournamentBracket(_tournamentId: number): Promise<BracketMatch[]> {
  return [];
}

export interface TournamentMatch {
  id: string;
  status: 'live' | 'upcoming' | 'completed';
  stage?: string;
  when?: string;            // "17h 3m" / "7h 37m ago" — vlr's relative label
  team1: { name: string; score: number | null; logo?: string };
  team2: { name: string; score: number | null; logo?: string };
}

const norm = (s?: string) => (s || '').trim().toLowerCase();

const mapMatch = (m: any, status: TournamentMatch['status']): TournamentMatch => ({
  id: String(m.id ?? ''),
  status,
  stage: m.event ?? undefined,
  when: m.in ? `dans ${m.in}` : m.ago ? `il y a ${m.ago}` : undefined,
  team1: { name: m.teams?.[0]?.name ?? 'TBD', score: m.teams?.[0]?.score != null ? Number(m.teams[0].score) : null, logo: m.teams?.[0]?.logo ?? undefined },
  team2: { name: m.teams?.[1]?.name ?? 'TBD', score: m.teams?.[1]?.score != null ? Number(m.teams[1].score) : null, logo: m.teams?.[1]?.logo ?? undefined },
});

// All matches (upcoming/live + completed) belonging to a tournament, matched by name.
export async function getMatchesForTournament(name: string): Promise<TournamentMatch[]> {
  const target = norm(name);
  try {
    const [feed, results] = await Promise.all([
      vlr<any[]>('matches/running').catch(() => []),
      vlr<any[]>('matches/results').catch(() => []),
    ]);
    const upcoming = feed
      .filter(m => norm(m.tournament) === target)
      .map(m => mapMatch(m, isLive(m.status) ? 'live' : 'upcoming'));
    const done = results
      .filter(m => norm(m.tournament) === target)
      .map(m => mapMatch(m, 'completed'));
    return [...upcoming, ...done];
  } catch (e) {
    console.error('vlr.gg tournament matches:', e);
    return [];
  }
}

export const hasPandaToken = () => esportsConfigured;
