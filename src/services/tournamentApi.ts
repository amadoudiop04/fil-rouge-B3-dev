// Esports data is proxied through the local API so the PandaScore token never
// reaches the browser bundle. The server caches responses and reports whether
// a token is configured.
const API_BASE = (import.meta.env.VITE_API_URL as string | undefined) ?? 'http://localhost:3001';
let pandaConfigured = true;

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

const extractTwitch = (url?: string): string | undefined => {
  if (!url) return undefined;
  const m = url.match(/twitch\.tv\/([^/?&]+)/);
  return m ? m[1] : undefined;
};

// Calls the local API esports proxy. Returns the raw PandaScore array and
// records whether the server has a token configured.
async function panda<T>(proxyPath: string): Promise<T> {
  const res = await fetch(`${API_BASE}/esports/${proxyPath}`);
  if (!res.ok) throw new Error(`esports proxy ${res.status}: ${proxyPath}`);
  const json = await res.json() as { success?: boolean; configured?: boolean; data?: unknown };
  if (typeof json.configured === 'boolean') pandaConfigured = json.configured;
  return (Array.isArray(json.data) ? json.data : []) as unknown as T;
}

export async function getLiveMatches(): Promise<LiveMatch[]> {
  try {
    const data: any[] = await panda('matches/running');
    return data
      .filter(m => m.opponents?.length === 2)
      .map(m => ({
        id:         m.id,
        name:       m.name ?? '',
        tournament: m.tournament?.name ?? '',
        serie:      m.serie?.full_name ?? '',
        team1: {
          name:     m.opponents[0]?.opponent?.name ?? 'TBD',
          score:    m.results?.[0]?.score ?? 0,
          imageUrl: m.opponents[0]?.opponent?.image_url ?? undefined,
        },
        team2: {
          name:     m.opponents[1]?.opponent?.name ?? 'TBD',
          score:    m.results?.[1]?.score ?? 0,
          imageUrl: m.opponents[1]?.opponent?.image_url ?? undefined,
        },
        twitchChannel: extractTwitch(m.official_stream_url),
        map:           m.games?.[0]?.map?.name ?? undefined,
        beginAt:       m.begin_at ?? undefined,
      }));
  } catch (e) {
    console.error('PandaScore live matches:', e);
    return [];
  }
}

export async function getRunningTournaments(): Promise<EsportsTournament[]> {
  try {
    const data: any[] = await panda('tournaments/running');
    return data.map(t => ({
      id:       t.id,
      name:     t.name ?? '',
      serie:    t.serie?.full_name ?? '',
      status:   'live' as const,
      location: t.location ?? undefined,
      prizepool: t.prizepool ? `${Number(t.prizepool).toLocaleString('fr-FR')} $` : undefined,
      teams:    t.teams?.length ?? 0,
      beginAt:  t.begin_at ?? undefined,
      endAt:    t.end_at ?? undefined,
      twitchChannel: extractTwitch(t.live_url),
      color:    '#FF4654',
    }));
  } catch (e) {
    console.error('PandaScore running tourneys:', e);
    return [];
  }
}

export async function getUpcomingTournaments(): Promise<EsportsTournament[]> {
  try {
    const data: any[] = await panda('tournaments/upcoming');
    return data.map(t => ({
      id:       t.id,
      name:     t.name ?? '',
      serie:    t.serie?.full_name ?? '',
      status:   'upcoming' as const,
      location: t.location ?? undefined,
      prizepool: t.prizepool ? `${Number(t.prizepool).toLocaleString('fr-FR')} $` : undefined,
      teams:    t.teams?.length ?? 0,
      beginAt:  t.begin_at ?? undefined,
      endAt:    t.end_at ?? undefined,
      twitchChannel: extractTwitch(t.live_url),
      color:    '#FF4654',
    }));
  } catch (e) {
    console.error('PandaScore upcoming tourneys:', e);
    return [];
  }
}

export async function getTournamentBracket(tournamentId: number): Promise<BracketMatch[]> {
  try {
    const data: any[] = await panda(`tournaments/${tournamentId}/brackets`);
    return data.map((m: any, i: number) => {
      const t1 = m.opponents?.[0]?.opponent;
      const t2 = m.opponents?.[1]?.opponent;
      const r1 = m.results?.[0]?.score ?? 0;
      const r2 = m.results?.[1]?.score ?? 0;
      const isDone   = m.status === 'finished';
      const isLive   = m.status === 'running';
      const winnerId = m.winner_id;
      return {
        id:     String(m.id ?? i),
        t1Name:  t1?.name ?? 'TBD',
        t2Name:  t2?.name ?? 'TBD',
        t1Logo:  t1?.image_url ?? undefined,
        t2Logo:  t2?.image_url ?? undefined,
        s1: r1, s2: r2,
        winner: isDone ? (winnerId === t1?.id ? t1?.name : t2?.name) : null,
        status: isDone ? 'done' : isLive ? 'live' : 'upcoming',
        round:  m.name ?? `Match ${i + 1}`,
      };
    });
  } catch (e) {
    console.error('PandaScore bracket:', e);
    return [];
  }
}

export const hasPandaToken = () => pandaConfigured;
