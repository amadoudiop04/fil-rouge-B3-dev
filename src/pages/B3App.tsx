import React, { useEffect, useRef, useState } from 'react';
import { User } from '../contexts/AuthContext';
import { platformApi, type AdminOverviewResponse } from '../services/platformApi';
import type { StatsRecord, MatchWithUser } from '../types/api';
import { getRunningTournaments, getUpcomingTournaments, hasPandaToken, type EsportsTournament } from '../services/tournamentApi';

export interface ShopItem {
  id: number; name: string; price: number; category: string;
  img: string; stock_quantity: number;
}

interface LfgPlayer {
  id: number; username: string;
  riotId?: string | null; tagLine?: string | null;
  bio?: string | null; discord?: string | null;
  rankLabel?: string | null; roles?: string[];
  region?: string | null; languages?: string[]; playtimes?: string[];
  lfgStatus?: 'lfg' | 'busy';
}

const DEFAULT_STATS: StatsRecord = {
  user_id: 0, rank_name: 'Diamant I', rank_rating: 412, win_rate: 62.8, kd_ratio: 1.55, avg_damage: 170,
};

const rankColor = (label?: string | null): string => {
  const t = (label || '').split(' ')[0].toLowerCase();
  if (/(radiant|immort)/.test(t)) return 'var(--red)';
  if (/(diam|ascend)/.test(t)) return 'var(--green)';
  return 'var(--ink2)';
};

const fmtShortDate = (iso?: string): string =>
  iso ? new Date(iso).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' }).toUpperCase() : '—';

/* ════════════════════════════════════════════════════════════
   B3 ESPORT — editorial Valorant hub
   Faithful React port of the "B3 Esport" design (paper / ink / red),
   wired to the real auth session (user, cart count, logout).
═══════════════════════════════════════════════════════════════ */

type Screen =
  | 'home' | 'stats' | 'agents' | 'players'
  | 'tournaments' | 'shop' | 'profile' | 'admin';

interface B3AppProps {
  user: User;
  cartCount: number;
  onLogout: () => void;
  onAddToCart?: (p: ShopItem) => void;
}

const ORDER_STATUS_COLOR: Record<string, string> = {
  Paid: 'var(--green)', Shipped: 'var(--ink2)', Pending: 'var(--red)', Cancelled: 'var(--muted)',
};
const eur = (n: number) => '€' + n.toFixed(2).replace('.', ',');

const C = {
  paper: 'var(--paper)', paper2: 'var(--paper2)', paper3: 'var(--paper3)',
  ink: 'var(--ink)', ink2: 'var(--ink2)', muted: 'var(--muted)',
  red: 'var(--red)', green: 'var(--green)', line: 'var(--line)', line2: 'var(--line2)',
};
const DISP = 'var(--disp)', MONO = 'var(--mono)', UI = 'var(--ui)';

/* Cubic-ease reveal that re-runs on every screen change. */
function useReveal(dep: unknown): number {
  const [e, setE] = useState(1);
  useEffect(() => {
    let raf = 0;
    const t0 = performance.now(), dur = 720;
    const tick = (t: number) => {
      const x = Math.min(1, (t - t0) / dur);
      setE(1 - Math.pow(1 - x, 3));
      if (x < 1) raf = requestAnimationFrame(tick);
    };
    setE(0);
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [dep]);
  return e;
}

const NAV_DEF: { id: Screen; label: string; adminOnly?: boolean }[] = [
  { id: 'home', label: 'Accueil' },
  { id: 'stats', label: 'Stats' },
  { id: 'agents', label: 'Agents' },
  { id: 'players', label: 'Joueurs' },
  { id: 'tournaments', label: 'Tournois' },
  { id: 'shop', label: 'Shop' },
  { id: 'profile', label: 'Profil' },
  { id: 'admin', label: 'Admin', adminOnly: true },
];

const B3App: React.FC<B3AppProps> = ({ user, cartCount, onLogout, onAddToCart }) => {
  const [screen, setScreenRaw] = useState<Screen>('home');
  const [role, setRole] = useState('Tous');
  const [cat, setCat] = useState('Tout');
  const [lfg, setLfg] = useState(user.showInLfg ?? true);
  const scrollRef = useRef<HTMLElement>(null);
  const targetRef = useRef(Date.now() + 4 * 86400000 + 6 * 3600000 + 23 * 60000 + 41000);

  // Real data: shop catalogue, admin overview, stats, LFG players, esports tournaments.
  const [products, setProducts] = useState<ShopItem[] | null>(null);
  const [overview, setOverview] = useState<AdminOverviewResponse | null>(null);
  const [statsData, setStatsData] = useState<{ stats: StatsRecord | null; matches: MatchWithUser[] } | null>(null);
  const [lfgPlayers, setLfgPlayers] = useState<LfgPlayer[] | null>(null);
  const [tourneys, setTourneys] = useState<EsportsTournament[] | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const toastTimer = useRef<number | undefined>(undefined);

  useEffect(() => {
    let alive = true;
    platformApi.getProducts()
      .then(r => {
        if (!alive) return;
        const list = (r.success && r.products) ? r.products : [];
        setProducts(list.map(p => ({
          id: p.id, name: p.name, price: p.price,
          category: (p.category || '').toUpperCase(),
          img: p.image_url || '', stock_quantity: p.stock_quantity,
        })));
      })
      .catch(() => alive && setProducts([]));
    return () => { alive = false; };
  }, []);

  useEffect(() => {
    if (!user.isAdmin) return;
    let alive = true;
    platformApi.adminOverview()
      .then(r => alive && setOverview(r))
      .catch(() => alive && setOverview({ success: false, error: 'API indisponible' }));
    return () => { alive = false; };
  }, [user.isAdmin]);

  // Stats + recent matches for the current player.
  useEffect(() => {
    let alive = true;
    Promise.all([
      platformApi.getUserStats(Number(user.id)),
      platformApi.getRecentMatches(8),
    ]).then(([s, m]) => {
      if (!alive) return;
      setStatsData({
        stats: (s.success && s.stats) ? s.stats : null,
        matches: (m.success && m.matches) ? m.matches : [],
      });
    }).catch(() => alive && setStatsData({ stats: null, matches: [] }));
    return () => { alive = false; };
  }, [user.id]);

  // LFG players directory.
  useEffect(() => {
    let alive = true;
    platformApi.getLfgPlayers()
      .then(r => alive && setLfgPlayers((r.success && Array.isArray(r.players)) ? (r.players as LfgPlayer[]) : []))
      .catch(() => alive && setLfgPlayers([]));
    return () => { alive = false; };
  }, []);

  // Esports tournaments (PandaScore, proxied) — loaded on entering the tab and
  // refreshed every 60s while it stays open, for near real-time standings.
  useEffect(() => {
    if (screen !== 'tournaments') return;
    let alive = true;
    const load = () => Promise.all([getRunningTournaments(), getUpcomingTournaments()])
      .then(([r, u]) => { if (alive) setTourneys([...r, ...u]); })
      .catch(() => { if (alive) setTourneys(prev => prev ?? []); });
    load();
    const id = window.setInterval(load, 60000);
    return () => { alive = false; window.clearInterval(id); };
  }, [screen]);

  const e = useReveal(screen);

  const addToCart = (p: ShopItem) => {
    if (p.stock_quantity === 0) return;
    onAddToCart?.(p);
    setToast(p.name);
    window.clearTimeout(toastTimer.current);
    toastTimer.current = window.setTimeout(() => setToast(null), 1800);
  };

  // Live tick for the countdown.
  const [, force] = useState(0);
  useEffect(() => {
    const id = setInterval(() => force(n => n + 1), 1000);
    return () => clearInterval(id);
  }, []);

  const setScreen = (s: Screen) => {
    if (s === screen) return;
    setScreenRaw(s);
    if (scrollRef.current) scrollRef.current.scrollTop = 0;
  };

  const N = (v: number, d = 0) => (v * e).toFixed(d);
  const W = (v: number) => (v * e).toFixed(2) + '%';

  const scanClip = `inset(0 ${((1 - e) * 100).toFixed(2)}% 0 0)`;
  const scanX = (e * 100).toFixed(2) + '%';
  const scanOp = e >= 1 ? 0 : 1;

  const nav = NAV_DEF.filter(n => !n.adminOnly || user.isAdmin);

  /* ── shared bits ─────────────────────────────────────────── */
  const kicker = (text: string, color: string = C.red): React.CSSProperties => ({
    margin: 0, fontFamily: MONO, fontSize: 11, letterSpacing: '.16em', color,
  });

  const ScreenHead = ({ num, eyebrow, title, right }: {
    num: string; eyebrow: string; title: React.ReactNode; right?: React.ReactNode;
  }) => (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 20, borderBottom: `2px solid ${C.ink}`, paddingBottom: 16 }}>
      <span style={{ fontFamily: DISP, fontSize: 64, lineHeight: .8, color: C.red }}>{num}</span>
      <div style={{ flex: 1 }}>
        <span style={{ fontFamily: MONO, fontSize: 11, letterSpacing: '.16em', color: C.muted }}>{eyebrow}</span>
        <h1 style={{ margin: '4px 0 0', fontFamily: DISP, fontSize: 46, lineHeight: .85, textTransform: 'uppercase' }}>{title}</h1>
      </div>
      {right}
    </div>
  );

  const chipRow = (
    items: string[], current: string, set: (v: string) => void,
  ) => (
    <div style={{ display: 'flex', border: `2px solid ${C.ink}`, width: 'max-content' }}>
      {items.map((label, i) => {
        const on = label === current;
        return (
          <button key={label} onClick={() => set(label)}
            style={{
              padding: '11px 20px', border: 0, borderRight: i < items.length - 1 ? `1px solid ${C.line}` : 0,
              background: on ? C.ink : 'transparent', color: on ? C.paper : C.ink2,
              fontFamily: MONO, fontSize: 11, fontWeight: 700, letterSpacing: '.08em',
              textTransform: 'uppercase', cursor: 'pointer',
            }}>
            {label}
          </button>
        );
      })}
    </div>
  );

  /* ── 01 ACCUEIL ──────────────────────────────────────────── */
  const renderHome = () => {
    const homeStats = [
      { label: 'RANG', value: 'D1', sub: 'DIAMANT · EUW', color: C.green },
      { label: 'K/D RATIO', value: N(1.45, 2), sub: 'MOYENNE SAISON', color: C.ink },
      { label: 'WIN RATE', value: N(62.8, 1) + '%', sub: '108 MATCHS', color: C.ink },
      { label: 'ADR MOYEN', value: N(158, 0), sub: 'PAR ROUND', color: C.ink },
    ];
    const live = { a: String(Math.round(13 * e)), b: String(Math.round(8 * e)) };
    const activity = [
      { time: '02h', label: 'Victoire — Ascent', rr: '+22', color: C.green },
      { time: '05h', label: 'Défaite — Split', rr: '-14', color: C.red },
      { time: '01j', label: 'Victoire — Bind', rr: '+18', color: C.green },
      { time: '02j', label: 'Achat — Hoodie B3', rr: '#1042', color: C.ink2 },
    ];
    const shopPreview = [
      { name: 'Hoodie B3 Vanguard', price: '€59,90', slug: 'hoodie' },
      { name: 'Tapis XL Radiant', price: '€34,90', slug: 'mousepad' },
      { name: 'Jersey Pro 2026', price: '€74,90', slug: 'jersey' },
      { name: 'Casquette Snapback', price: '€24,90', slug: 'cap' },
    ];
    const left = Math.max(0, targetRef.current - Date.now());
    const pad = (n: number) => String(n).padStart(2, '0');
    const cd = [
      { v: pad(Math.floor(left / 86400000)), l: 'JOURS' },
      { v: pad(Math.floor((left % 86400000) / 3600000)), l: 'HEURES' },
      { v: pad(Math.floor((left % 3600000) / 60000)), l: 'MIN' },
      { v: pad(Math.floor((left % 60000) / 1000)), l: 'SEC' },
    ];

    return (
      <div style={{ clipPath: scanClip, display: 'flex', flexDirection: 'column', gap: 34 }}>
        {/* hero */}
        <section style={{ display: 'grid', gridTemplateColumns: '1.45fr 1fr', border: `2px solid ${C.ink}` }}>
          <div style={{ padding: '30px 32px', borderRight: `2px solid ${C.ink}`, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', minHeight: 300 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '6px 11px', background: C.red, color: '#fff', fontFamily: MONO, fontSize: 10, fontWeight: 700, letterSpacing: '.16em' }}>
                <span style={{ height: 7, width: 7, background: '#fff' }} />EN DIRECT
              </span>
              <span style={{ fontFamily: MONO, fontSize: 10, letterSpacing: '.12em', color: C.muted }}>// FEAT.01</span>
            </div>
            <div>
              <p style={{ margin: '0 0 6px', fontFamily: MONO, fontSize: 11, letterSpacing: '.18em', color: C.red }}>VALORANT CHAMPIONS TOUR</p>
              <h1 style={{ margin: 0, fontFamily: DISP, fontSize: 74, lineHeight: .86, textTransform: 'uppercase' }}>Grande<br />Finale</h1>
              <p style={{ margin: '14px 0 0', fontFamily: MONO, fontSize: 12, letterSpacing: '.04em', color: C.ink2 }}>NAVI vs LOUD · ASCENT · MAP 02 / 03</p>
            </div>
            <button onClick={() => setScreen('tournaments')} className="b3-btn-ink"
              style={{ alignSelf: 'flex-start', display: 'inline-flex', alignItems: 'center', gap: 12, marginTop: 20, padding: '14px 26px', color: C.paper, fontFamily: UI, fontSize: 14, fontWeight: 800, letterSpacing: '.04em', textTransform: 'uppercase' }}>
              ▶ Regarder le live
            </button>
          </div>
          <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 22, padding: 30, background: C.ink, color: C.paper, overflow: 'hidden' }}>
            <span style={{ position: 'absolute', top: 14, right: 16, fontFamily: MONO, fontSize: 9, letterSpacing: '.1em', color: 'rgba(231,227,217,.4)' }}>// LIVE_SCORE.dat</span>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div><div style={{ fontFamily: DISP, fontSize: 30 }}>NAVI</div><div style={{ fontFamily: MONO, fontSize: 11, color: 'rgba(231,227,217,.5)' }}>EUROPE</div></div>
              <div style={{ fontFamily: MONO, fontSize: 62, fontWeight: 700, lineHeight: 1, color: C.red }}>{live.a}</div>
            </div>
            <div style={{ height: 1, background: 'rgba(231,227,217,.2)' }} />
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div><div style={{ fontFamily: DISP, fontSize: 30 }}>LOUD</div><div style={{ fontFamily: MONO, fontSize: 11, color: 'rgba(231,227,217,.5)' }}>SUD-AMÉRIQUE</div></div>
              <div style={{ fontFamily: MONO, fontSize: 62, fontWeight: 700, lineHeight: 1 }}>{live.b}</div>
            </div>
          </div>
        </section>

        {/* stat ribbon */}
        <section>
          <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 10 }}>
            <p style={kicker('// PERFORMANCE.SAISON')}>// PERFORMANCE.SAISON</p>
            <button onClick={() => setScreen('stats')} className="b3-link"
              style={{ fontFamily: MONO, fontSize: 11, fontWeight: 700, letterSpacing: '.08em', background: 0, border: 0, cursor: 'pointer', color: C.ink }}>
              DÉTAILS COMPLETS →
            </button>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', borderTop: `2px solid ${C.ink}`, borderBottom: `2px solid ${C.ink}` }}>
            {homeStats.map((st, i) => (
              <div key={i} style={{ padding: '18px 20px', borderRight: i < 3 ? `1px solid ${C.line}` : 0 }}>
                <p style={{ margin: 0, fontFamily: MONO, fontSize: 10, letterSpacing: '.12em', color: C.muted }}>{st.label}</p>
                <p style={{ margin: '8px 0 0', fontFamily: MONO, fontSize: 38, fontWeight: 700, lineHeight: .9, color: st.color }}>{st.value}</p>
                <p style={{ margin: '6px 0 0', fontFamily: MONO, fontSize: 10, color: C.ink2 }}>{st.sub}</p>
              </div>
            ))}
          </div>
        </section>

        {/* feed + countdown */}
        <section style={{ display: 'grid', gridTemplateColumns: '1.3fr 1fr', gap: 28 }}>
          <div>
            <p style={{ ...kicker('x'), margin: '0 0 12px' }}>// JOURNAL_DE_COMBAT</p>
            <div style={{ borderTop: `2px solid ${C.ink}` }}>
              {activity.map((a, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '13px 0', borderBottom: `1px solid ${C.line}` }}>
                  <span style={{ fontFamily: MONO, fontSize: 11, color: C.muted, width: 42 }}>[{a.time}]</span>
                  <span style={{ fontFamily: UI, fontSize: 14, fontWeight: 700, letterSpacing: '.02em', textTransform: 'uppercase' }}>{a.label}</span>
                  <span style={{ flex: 1, borderBottom: `1px dotted ${C.line2}`, margin: '0 4px' }} />
                  <span style={{ fontFamily: MONO, fontSize: 14, fontWeight: 700, color: a.color }}>{a.rr}</span>
                </div>
              ))}
            </div>
          </div>
          <div style={{ border: `2px solid ${C.ink}`, padding: 22 }}>
            <div style={{ marginBottom: 18 }}>
              <p style={kicker('// PROCHAIN_TOURNOI')}>// PROCHAIN_TOURNOI</p>
              <p style={{ margin: '8px 0 0', fontFamily: DISP, fontSize: 24, lineHeight: .95, textTransform: 'uppercase' }}>B3 Winter Cup</p>
              <p style={{ margin: '5px 0 0', fontFamily: MONO, fontSize: 10, color: C.ink2 }}>ONLINE · €5 000 · S4</p>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: `1px solid ${C.line}`, paddingTop: 16 }}>
              {cd.map((u, i) => (
                <div key={i} style={{ textAlign: 'center' }}>
                  <div style={{ fontFamily: MONO, fontSize: 34, fontWeight: 700, lineHeight: 1 }}>{u.v}</div>
                  <div style={{ marginTop: 6, fontFamily: MONO, fontSize: 9, letterSpacing: '.1em', color: C.muted }}>{u.l}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* merch */}
        <section>
          <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 12 }}>
            <p style={kicker('// BOUTIQUE.B3')}>// BOUTIQUE.B3</p>
            <button onClick={() => setScreen('shop')} className="b3-link"
              style={{ fontFamily: MONO, fontSize: 11, fontWeight: 700, letterSpacing: '.08em', background: 0, border: 0, cursor: 'pointer', color: C.ink }}>
              TOUT VOIR →
            </button>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 18 }}>
            {shopPreview.map((p, i) => (
              <button key={i} onClick={() => setScreen('shop')} className="b3-row"
                style={{ textAlign: 'left', padding: 0, border: `2px solid ${C.ink}`, background: C.paper, cursor: 'pointer' }}>
                <div style={{ aspectRatio: '1/1', borderBottom: `2px solid ${C.ink}`, background: `repeating-linear-gradient(135deg,${C.paper3} 0 9px,${C.paper2} 9px 18px)`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <span style={{ fontFamily: MONO, fontSize: 10, color: C.muted }}>// {p.slug}</span>
                </div>
                <div style={{ padding: '13px 14px' }}>
                  <p style={{ margin: 0, fontFamily: UI, fontSize: 13, fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.name}</p>
                  <p style={{ margin: '7px 0 0', fontFamily: MONO, fontSize: 15, fontWeight: 700, color: C.red }}>{p.price}</p>
                </div>
              </button>
            ))}
          </div>
        </section>
      </div>
    );
  };

  /* ── 02 STATS (real player data) ─────────────────────────── */
  const renderStats = () => {
    const loading = statsData === null;
    const stats = statsData?.stats ?? DEFAULT_STATS;
    const matches = statsData?.matches ?? [];
    const wins = matches.filter(m => m.result === 'W').length;
    const losses = matches.length - wins;

    const statGrid = [
      { label: 'K/D GLOBAL', value: N(stats.kd_ratio, 2), sub: 'SAISON', color: C.ink },
      { label: 'TAUX DE VICTOIRE', value: N(stats.win_rate, 1) + '%', sub: matches.length ? `${wins}V / ${losses}D` : 'GLOBAL', color: C.green },
      { label: 'DÉGÂTS / ROUND', value: N(stats.avg_damage, 0), sub: 'ADR MOYEN', color: C.ink },
      { label: 'RANK RATING', value: N(stats.rank_rating, 0), sub: stats.rank_name.toUpperCase(), color: C.red },
    ];

    // Aggregate the played agents out of the recent matches.
    const agg = new Map<string, { matches: number; kills: number; deaths: number }>();
    matches.forEach(m => {
      const a = agg.get(m.agent_played) ?? { matches: 0, kills: 0, deaths: 0 };
      a.matches += 1; a.kills += m.kills; a.deaths += m.deaths;
      agg.set(m.agent_played, a);
    });
    const agentsPlayed = Array.from(agg.entries())
      .map(([name, a]) => ({ name, matches: a.matches, kd: (a.kills / Math.max(1, a.deaths)).toFixed(2) }))
      .sort((x, y) => y.matches - x.matches)
      .slice(0, 5);
    const maxAgentM = Math.max(1, ...agentsPlayed.map(a => a.matches));

    return (
      <div style={{ clipPath: scanClip, display: 'flex', flexDirection: 'column', gap: 30 }}>
        <ScreenHead num="02" eyebrow="// DOSSIER_JOUEUR"
          title={<>{(user.username || 'Phantom').toUpperCase()} <span style={{ color: C.muted, fontSize: 24 }}>#{(user.tagLine || 'EUW').toUpperCase()}</span></>}
          right={
            <div style={{ textAlign: 'right', fontFamily: MONO, fontSize: 12, lineHeight: 1.7 }}>
              <span style={{ color: rankColor(stats.rank_name), fontWeight: 700 }}>{stats.rank_name.toUpperCase()}</span><br />
              <span style={{ color: C.muted }}>{(user.region || 'EUROPE').toUpperCase()} · {N(stats.rank_rating, 0)} RR</span>
            </div>
          } />

        {loading ? (
          <p style={{ fontFamily: MONO, fontSize: 12, letterSpacing: '.2em', color: C.muted, padding: '40px 0' }} className="animate-pulse">// CHARGEMENT DU DOSSIER…</p>
        ) : (<>
          <section style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', border: `2px solid ${C.ink}` }}>
            {statGrid.map((st, i) => (
              <div key={i} style={{ padding: '24px 22px', borderRight: i < 3 ? `1px solid ${C.line}` : 0 }}>
                <p style={{ margin: 0, fontFamily: MONO, fontSize: 10, letterSpacing: '.12em', color: C.muted }}>{st.label}</p>
                <p style={{ margin: '12px 0 0', fontFamily: MONO, fontSize: 46, fontWeight: 700, lineHeight: .85, color: st.color }}>{st.value}</p>
                <p style={{ margin: '10px 0 0', fontFamily: MONO, fontSize: 11, fontWeight: 700, color: C.ink2 }}>{st.sub}</p>
              </div>
            ))}
          </section>

          <section style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 28 }}>
            <div>
              <p style={{ ...kicker('x'), margin: '0 0 14px' }}>// AGENTS_LES_PLUS_JOUÉS</p>
              <div style={{ borderTop: `2px solid ${C.ink}` }}>
                {agentsPlayed.length === 0 && (
                  <div style={{ padding: '20px 0', fontFamily: MONO, fontSize: 11, color: C.muted }}>AUCUN MATCH ENREGISTRÉ</div>
                )}
                {agentsPlayed.map((ag, i) => (
                  <div key={i} style={{ padding: '15px 0', borderBottom: `1px solid ${C.line}` }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 9 }}>
                      <span style={{ fontFamily: DISP, fontSize: 20, textTransform: 'uppercase', flex: 1 }}>{ag.name}</span>
                      <span style={{ fontFamily: MONO, fontSize: 11, color: C.muted }}>{ag.matches} MATCH{ag.matches > 1 ? 'S' : ''}</span>
                      <span style={{ fontFamily: MONO, fontSize: 14, fontWeight: 700, color: C.green, width: 58, textAlign: 'right' }}>{ag.kd}</span>
                    </div>
                    <div style={{ height: 7, background: C.paper3, overflow: 'hidden' }}>
                      <div style={{ height: '100%', background: C.red, width: W((ag.matches / maxAgentM) * 100) }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <p style={{ ...kicker('x'), margin: '0 0 14px' }}>// DERNIERS_MATCHS</p>
              <div style={{ borderTop: `2px solid ${C.ink}` }}>
                {matches.length === 0 && (
                  <div style={{ padding: '20px 0', fontFamily: MONO, fontSize: 11, color: C.muted }}>AUCUN MATCH RÉCENT</div>
                )}
                {matches.map((m, i) => {
                  const col = m.result === 'W' ? C.green : C.red;
                  return (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 0 14px 14px', borderBottom: `1px solid ${C.line}`, borderLeft: `4px solid ${col}` }}>
                      <span style={{ fontFamily: UI, fontSize: 15, fontWeight: 700, textTransform: 'uppercase', flex: 1 }}>{m.map_name}</span>
                      <span style={{ fontFamily: MONO, fontSize: 12, color: C.muted }}>{m.agent_played}</span>
                      <span style={{ fontFamily: MONO, fontSize: 13, color: C.ink2 }}>{m.score_home}—{m.score_away}</span>
                      <span style={{ fontFamily: MONO, fontSize: 13, fontWeight: 700, width: 76, textAlign: 'right', color: col }}>{m.kills}/{m.deaths}/{m.assists}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </section>
        </>)}
      </div>
    );
  };

  /* ── 03 AGENTS ───────────────────────────────────────────── */
  const renderAgents = () => {
    const tierStyle: Record<string, { bg: string; fg: string }> = {
      S: { bg: C.red, fg: '#fff' },
      A: { bg: C.ink, fg: C.paper },
      B: { bg: C.paper3, fg: C.ink },
      C: { bg: 'transparent', fg: C.muted },
    };
    const allAgents = [
      { name: 'Jett', role: 'DUELLISTE', tier: 'S', win: 51.2, pick: 14.8, kd: '1.18' },
      { name: 'Raze', role: 'DUELLISTE', tier: 'S', win: 50.4, pick: 11.2, kd: '1.12' },
      { name: 'Killjoy', role: 'SENTINELLE', tier: 'A', win: 52.1, pick: 9.6, kd: '1.02' },
      { name: 'Omen', role: 'CONTRÔLEUR', tier: 'A', win: 49.8, pick: 13.1, kd: '0.98' },
      { name: 'Sova', role: 'INITIATEUR', tier: 'A', win: 50.9, pick: 8.7, kd: '1.04' },
      { name: 'Cypher', role: 'SENTINELLE', tier: 'B', win: 48.6, pick: 6.4, kd: '0.95' },
      { name: 'Breach', role: 'INITIATEUR', tier: 'B', win: 47.9, pick: 5.1, kd: '0.92' },
      { name: 'Yoru', role: 'DUELLISTE', tier: 'C', win: 46.2, pick: 3.2, kd: '1.06' },
    ];
    const roles = ['Tous', 'Duelliste', 'Initiateur', 'Contrôleur', 'Sentinelle'];
    const cols = '60px 2fr 1.1fr 1.2fr 0.9fr 0.9fr';
    const list = allAgents.filter(a => role === 'Tous' || a.role === role.toUpperCase());

    return (
      <div style={{ clipPath: scanClip, display: 'flex', flexDirection: 'column', gap: 26 }}>
        <ScreenHead num="03" eyebrow="// TIER_LIST · PATCH 8.11" title={<>Agents &amp; Méta</>} />
        {chipRow(roles, role, setRole)}
        <div style={{ border: `2px solid ${C.ink}` }}>
          <div style={{ display: 'grid', gridTemplateColumns: cols, gap: 14, padding: '12px 20px', borderBottom: `2px solid ${C.ink}`, background: C.paper2, fontFamily: MONO, fontSize: 10, letterSpacing: '.1em', color: C.muted }}>
            <span>TIER</span><span>AGENT</span><span>RÔLE</span><span>WIN RATE</span><span>PICK</span><span>K/D</span>
          </div>
          {list.map((a, i) => (
            <div key={i} className="b3-row" style={{ display: 'grid', gridTemplateColumns: cols, gap: 14, alignItems: 'center', padding: '14px 20px', borderBottom: i < list.length - 1 ? `1px solid ${C.line}` : 0 }}>
              <span style={{ height: 34, width: 34, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: DISP, fontSize: 18, color: tierStyle[a.tier].fg, background: tierStyle[a.tier].bg }}>{a.tier}</span>
              <span style={{ fontFamily: DISP, fontSize: 22, textTransform: 'uppercase' }}>{a.name}</span>
              <span style={{ fontFamily: MONO, fontSize: 12, color: C.ink2 }}>{a.role}</span>
              <div>
                <span style={{ fontFamily: MONO, fontSize: 13, fontWeight: 700 }}>{a.win.toFixed(1)}%</span>
                <div style={{ marginTop: 6, height: 5, background: C.paper3, overflow: 'hidden' }}>
                  <div style={{ height: '100%', background: C.green, width: W(a.win) }} />
                </div>
              </div>
              <span style={{ fontFamily: MONO, fontSize: 13, color: C.ink2 }}>{a.pick.toFixed(1)}%</span>
              <span style={{ fontFamily: MONO, fontSize: 15, fontWeight: 700, color: C.red }}>{a.kd}</span>
            </div>
          ))}
        </div>
      </div>
    );
  };

  /* ── 04 JOUEURS (real LFG directory) ─────────────────────── */
  const renderPlayers = () => {
    const loading = lfgPlayers === null;
    const list = lfgPlayers ?? [];
    const avs = [C.red, C.ink, C.green, C.ink2];

    const invite = (p: LfgPlayer) => {
      if (p.discord) {
        navigator.clipboard?.writeText(p.discord).catch(() => undefined);
        setToast(`Discord ${p.discord}`);
      } else {
        setToast(`${p.username} invité`);
      }
      window.clearTimeout(toastTimer.current);
      toastTimer.current = window.setTimeout(() => setToast(null), 1800);
    };

    return (
      <div style={{ clipPath: scanClip, display: 'flex', flexDirection: 'column', gap: 26 }}>
        <ScreenHead num="04" eyebrow={`// RECHERCHE_D'ÉQUIPE · ${loading ? '…' : list.length} ACTIF${list.length > 1 ? 'S' : ''}`} title={<>Joueurs · LFG</>} />
        {loading ? (
          <p style={{ fontFamily: MONO, fontSize: 12, letterSpacing: '.2em', color: C.muted, padding: '40px 0' }} className="animate-pulse">// RECHERCHE DES JOUEURS…</p>
        ) : list.length === 0 ? (
          <div style={{ border: `2px solid ${C.ink}`, padding: '48px 22px', textAlign: 'center' }}>
            <p style={{ margin: 0, fontFamily: DISP, fontSize: 26, textTransform: 'uppercase' }}>Personne en LFG</p>
            <p style={{ margin: '8px 0 0', fontFamily: MONO, fontSize: 11, color: C.muted }}>ACTIVE LE MODE LFG DANS TON PROFIL POUR APPARAÎTRE ICI</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 18 }}>
            {list.map((p, i) => {
              const role = (p.roles && p.roles[0]) || 'FLEX';
              const rank = p.rankLabel || 'NON CLASSÉ';
              const online = p.lfgStatus !== 'busy';
              return (
                <div key={p.id} className="b3-row" style={{ border: `2px solid ${C.ink}`, background: C.paper }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 13, padding: '16px 18px', borderBottom: `1px solid ${C.line}` }}>
                    <span style={{ height: 46, width: 46, flex: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: DISP, fontSize: 22, color: '#fff', background: avs[i % avs.length] }}>{p.username[0]?.toUpperCase()}</span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ margin: 0, fontFamily: DISP, fontSize: 22, lineHeight: .9, textTransform: 'uppercase', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={p.username}>{p.username}</p>
                      <p style={{ margin: '4px 0 0', fontFamily: MONO, fontSize: 10, letterSpacing: '.06em', color: C.muted, textTransform: 'uppercase' }}>{(p.region || '—')} · {role}</p>
                    </div>
                    <span title={online ? 'LFG' : 'Occupé'} style={{ height: 9, width: 9, flex: 'none', background: online ? C.green : C.muted }} />
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 18px' }}>
                    <span style={{ fontFamily: MONO, fontSize: 10, letterSpacing: '.1em', color: C.muted }}>RANG</span>
                    <span style={{ fontFamily: DISP, fontSize: 18, textTransform: 'uppercase', color: rankColor(p.rankLabel) }}>{rank}</span>
                  </div>
                  <button onClick={() => invite(p)} className="b3-btn-ink" style={{ width: '100%', padding: 13, border: 0, borderTop: `2px solid ${C.ink}`, color: C.paper, fontFamily: UI, fontSize: 12, fontWeight: 800, letterSpacing: '.06em', textTransform: 'uppercase', cursor: 'pointer' }}>
                    {p.discord ? '+ Copier le Discord' : '+ Inviter à jouer'}
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  };

  /* ── 05 TOURNOIS (real PandaScore esports data) ──────────── */
  const renderTournaments = () => {
    const onDark = 'rgba(231,227,217,.2)';
    const head = <ScreenHead num="05" eyebrow="// COMPÉTITIONS · TEMPS RÉEL" title={<>Tournois</>} />;
    const wrap = (body: React.ReactNode) => (
      <div style={{ clipPath: scanClip, display: 'flex', flexDirection: 'column', gap: 28 }}>{head}{body}</div>
    );

    if (tourneys === null) {
      return wrap(<p style={{ fontFamily: MONO, fontSize: 12, letterSpacing: '.2em', color: C.muted, padding: '40px 0' }} className="animate-pulse">// SYNCHRONISATION DES COMPÉTITIONS…</p>);
    }

    if (tourneys.length > 0) {
      const featured = tourneys[0];
      const rest = tourneys.slice(1);
      const live = featured.status === 'live';
      const watch = featured.twitchChannel ? `https://twitch.tv/${featured.twitchChannel}` : undefined;
      return wrap(<>
        <section style={{ border: `2px solid ${C.ink}`, background: C.ink, color: C.paper, padding: 34, position: 'relative', overflow: 'hidden' }}>
          <span style={{ position: 'absolute', top: 0, right: 0, fontFamily: DISP, fontSize: 200, lineHeight: .7, color: 'rgba(255,66,51,.12)', transform: 'translate(8%,-12%)' }}>01</span>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '6px 12px', background: C.red, color: '#fff', fontFamily: MONO, fontSize: 10, fontWeight: 700, letterSpacing: '.14em' }}>
            {live && <span style={{ height: 7, width: 7, background: '#fff' }} />}{live ? 'EN DIRECT' : 'TOURNOI VEDETTE'}
          </span>
          <h2 style={{ margin: '16px 0 0', fontFamily: DISP, fontSize: 52, lineHeight: .85, textTransform: 'uppercase', maxWidth: 680 }}>{featured.name}</h2>
          <p style={{ margin: '12px 0 0', fontFamily: MONO, fontSize: 12, letterSpacing: '.04em', color: 'rgba(231,227,217,.65)', textTransform: 'uppercase' }}>
            {[featured.serie, featured.location, featured.teams ? `${featured.teams} ÉQUIPES` : null].filter(Boolean).join(' · ') || 'VALORANT'}
          </p>
          <div style={{ display: 'flex', marginTop: 26, borderTop: `1px solid ${onDark}`, borderBottom: `1px solid ${onDark}`, width: 'max-content' }}>
            <div style={{ padding: '16px 28px 16px 0', borderRight: `1px solid ${onDark}` }}><div style={{ fontFamily: MONO, fontSize: 10, letterSpacing: '.1em', color: 'rgba(231,227,217,.5)' }}>PRIZE POOL</div><div style={{ fontFamily: MONO, fontSize: 28, fontWeight: 700, color: C.red }}>{featured.prizepool || '—'}</div></div>
            <div style={{ padding: '16px 28px', borderRight: `1px solid ${onDark}` }}><div style={{ fontFamily: MONO, fontSize: 10, letterSpacing: '.1em', color: 'rgba(231,227,217,.5)' }}>{live ? 'STATUT' : 'DÉBUT'}</div><div style={{ fontFamily: MONO, fontSize: 28, fontWeight: 700 }}>{live ? 'LIVE' : fmtShortDate(featured.beginAt)}</div></div>
            <div style={{ padding: '16px 0 16px 28px' }}><div style={{ fontFamily: MONO, fontSize: 10, letterSpacing: '.1em', color: 'rgba(231,227,217,.5)' }}>ÉQUIPES</div><div style={{ fontFamily: MONO, fontSize: 28, fontWeight: 700 }}>{featured.teams || '—'}</div></div>
          </div>
          {watch
            ? <a href={watch} target="_blank" rel="noopener noreferrer" className="b3-btn-ondark" style={{ display: 'inline-block', marginTop: 26, padding: '14px 28px', background: C.red, color: '#fff', fontFamily: UI, fontSize: 14, fontWeight: 800, letterSpacing: '.04em', textTransform: 'uppercase', textDecoration: 'none', cursor: 'pointer' }}>▶ Regarder le live</a>
            : <span style={{ display: 'inline-block', marginTop: 26, padding: '14px 28px', background: 'transparent', color: 'rgba(231,227,217,.6)', border: `1px solid ${onDark}`, fontFamily: MONO, fontSize: 12, fontWeight: 700, letterSpacing: '.08em', textTransform: 'uppercase' }}>{fmtShortDate(featured.beginAt)} · À VENIR</span>}
        </section>
        {rest.length > 0 && (
          <div style={{ borderTop: `2px solid ${C.ink}` }}>
            {rest.map((t, i) => {
              const col = t.status === 'live' ? C.red : C.ink2;
              return (
                <div key={t.id} className="b3-row" style={{ display: 'flex', alignItems: 'center', gap: 24, padding: '20px 4px', borderBottom: `1px solid ${C.line}` }}>
                  <span style={{ fontFamily: MONO, fontSize: 12, color: C.muted, width: 34 }}>{String(i + 2).padStart(2, '0')}</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <h3 style={{ margin: 0, fontFamily: DISP, fontSize: 24, lineHeight: .9, textTransform: 'uppercase', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={t.name}>{t.name}</h3>
                    <p style={{ margin: '5px 0 0', fontFamily: MONO, fontSize: 11, color: C.muted, textTransform: 'uppercase' }}>{[fmtShortDate(t.beginAt), t.location, t.teams ? `${t.teams} ÉQUIPES` : null].filter(Boolean).join(' · ')}</p>
                  </div>
                  <span style={{ fontFamily: MONO, fontSize: 20, fontWeight: 700, color: C.red, width: 130, textAlign: 'right' }}>{t.prizepool || '—'}</span>
                  <span style={{ fontFamily: MONO, fontSize: 10, fontWeight: 700, letterSpacing: '.08em', padding: '6px 12px', border: `1.5px solid ${col}`, color: col, width: 96, textAlign: 'center' }}>{t.status === 'live' ? 'LIVE' : 'À VENIR'}</span>
                </div>
              );
            })}
          </div>
        )}
      </>);
    }

    // No live PandaScore data (e.g. missing VITE_PANDASCORE_TOKEN) → labelled demo.
    const demo = [
      { name: 'Summer Showdown', date: 'EN COURS', teams: 16, prize: '€3 000', status: 'LIVE', statusColor: C.red },
      { name: 'B3 Open Qualifier', date: 'DANS 2 JOURS', teams: 64, prize: '€1 500', status: 'À VENIR', statusColor: C.ink2 },
      { name: 'Radiant League', date: '12 JUIL.', teams: 8, prize: '€8 000', status: 'À VENIR', statusColor: C.ink2 },
      { name: 'Spring Cup S3', date: 'TERMINÉ', teams: 32, prize: '€4 500', status: 'TERMINÉ', statusColor: C.muted },
    ];
    return wrap(<>
      <p style={{ margin: 0, fontFamily: MONO, fontSize: 11, letterSpacing: '.12em', color: C.muted }}>
        {hasPandaToken() ? '// AUCUNE COMPÉTITION VALORANT EN DIRECT — DONNÉES DÉMO' : '// PANDASCORE_TOKEN ABSENT — DONNÉES DÉMO'}
      </p>
      <section style={{ border: `2px solid ${C.ink}`, background: C.ink, color: C.paper, padding: 34, position: 'relative', overflow: 'hidden' }}>
        <span style={{ position: 'absolute', top: 0, right: 0, fontFamily: DISP, fontSize: 200, lineHeight: .7, color: 'rgba(255,66,51,.12)', transform: 'translate(8%,-12%)' }}>04</span>
        <span style={{ display: 'inline-block', padding: '6px 12px', background: C.red, color: '#fff', fontFamily: MONO, fontSize: 10, fontWeight: 700, letterSpacing: '.14em' }}>TOURNOI VEDETTE</span>
        <h2 style={{ margin: '16px 0 0', fontFamily: DISP, fontSize: 58, lineHeight: .85, textTransform: 'uppercase', maxWidth: 640 }}>B3 Winter Cup · S4</h2>
        <p style={{ margin: '12px 0 0', fontFamily: MONO, fontSize: 12, letterSpacing: '.04em', color: 'rgba(231,227,217,.65)' }}>SINGLE ELIMINATION · 32 ÉQUIPES · ONLINE EU/NA</p>
        <div style={{ display: 'flex', marginTop: 26, borderTop: `1px solid ${onDark}`, borderBottom: `1px solid ${onDark}`, width: 'max-content' }}>
          <div style={{ padding: '16px 28px 16px 0', borderRight: `1px solid ${onDark}` }}><div style={{ fontFamily: MONO, fontSize: 10, letterSpacing: '.1em', color: 'rgba(231,227,217,.5)' }}>PRIZE POOL</div><div style={{ fontFamily: MONO, fontSize: 28, fontWeight: 700, color: C.red }}>€5 000</div></div>
          <div style={{ padding: '16px 28px', borderRight: `1px solid ${onDark}` }}><div style={{ fontFamily: MONO, fontSize: 10, letterSpacing: '.1em', color: 'rgba(231,227,217,.5)' }}>DÉBUT</div><div style={{ fontFamily: MONO, fontSize: 28, fontWeight: 700 }}>04J:06H</div></div>
          <div style={{ padding: '16px 0 16px 28px' }}><div style={{ fontFamily: MONO, fontSize: 10, letterSpacing: '.1em', color: 'rgba(231,227,217,.5)' }}>INSCRITS</div><div style={{ fontFamily: MONO, fontSize: 28, fontWeight: 700 }}>28<span style={{ color: 'rgba(231,227,217,.45)' }}>/32</span></div></div>
        </div>
        <button className="b3-btn-ondark" style={{ marginTop: 26, padding: '14px 28px', border: 0, background: C.red, color: '#fff', fontFamily: UI, fontSize: 14, fontWeight: 800, letterSpacing: '.04em', textTransform: 'uppercase', cursor: 'pointer' }}>Inscrire mon équipe</button>
      </section>
      <div style={{ borderTop: `2px solid ${C.ink}` }}>
        {demo.map((t, i) => (
          <div key={i} className="b3-row" style={{ display: 'flex', alignItems: 'center', gap: 24, padding: '20px 4px', borderBottom: `1px solid ${C.line}` }}>
            <span style={{ fontFamily: MONO, fontSize: 12, color: C.muted, width: 34 }}>0{i + 1}</span>
            <div style={{ flex: 1 }}>
              <h3 style={{ margin: 0, fontFamily: DISP, fontSize: 26, lineHeight: .9, textTransform: 'uppercase' }}>{t.name}</h3>
              <p style={{ margin: '5px 0 0', fontFamily: MONO, fontSize: 11, color: C.muted }}>{t.date} · {t.teams} ÉQUIPES</p>
            </div>
            <span style={{ fontFamily: MONO, fontSize: 22, fontWeight: 700, color: C.red, width: 110, textAlign: 'right' }}>{t.prize}</span>
            <span style={{ fontFamily: MONO, fontSize: 10, fontWeight: 700, letterSpacing: '.08em', padding: '6px 12px', border: `1.5px solid ${t.statusColor}`, color: t.statusColor, width: 96, textAlign: 'center' }}>{t.status}</span>
          </div>
        ))}
      </div>
    </>);
  };

  /* ── 06 SHOP (real catalogue) ────────────────────────────── */
  const renderShop = () => {
    const loading = products === null;
    const all = products ?? [];
    const cats = ['Tout', ...Array.from(new Set(all.map(p => p.category))).filter(Boolean)];
    const list = all.filter(p => cat === 'Tout' || p.category === cat);

    return (
      <div style={{ clipPath: scanClip, display: 'flex', flexDirection: 'column', gap: 26 }}>
        <ScreenHead num="06" eyebrow="// MERCH_OFFICIEL"
          title={<>Boutique</>}
          right={!loading ? <span style={{ fontFamily: MONO, fontSize: 12, color: C.muted }}>{list.length} ARTICLE{list.length !== 1 ? 'S' : ''}</span> : undefined} />

        {!loading && cats.length > 1 && chipRow(cats, cat, setCat)}

        {loading ? (
          <p style={{ fontFamily: MONO, fontSize: 12, letterSpacing: '.2em', color: C.muted, padding: '40px 0' }} className="animate-pulse">// CHARGEMENT DU CATALOGUE…</p>
        ) : list.length === 0 ? (
          <div style={{ border: `2px solid ${C.ink}`, padding: '48px 22px', textAlign: 'center' }}>
            <p style={{ margin: 0, fontFamily: DISP, fontSize: 26, textTransform: 'uppercase' }}>Rayon vide</p>
            <p style={{ margin: '8px 0 0', fontFamily: MONO, fontSize: 11, color: C.muted }}>AUCUN PRODUIT DANS CETTE CATÉGORIE</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 18 }}>
            {list.map(p => {
              const out = p.stock_quantity === 0;
              const low = p.stock_quantity > 0 && p.stock_quantity <= 5;
              const tag = out ? 'RUPTURE' : low ? `${p.stock_quantity} RESTANTS` : '';
              return (
                <div key={p.id} className="b3-row" style={{ border: `2px solid ${C.ink}`, background: C.paper, display: 'flex', flexDirection: 'column' }}>
                  <div style={{ position: 'relative', aspectRatio: '1/1', borderBottom: `2px solid ${C.ink}`, background: `repeating-linear-gradient(135deg,${C.paper3} 0 10px,${C.paper2} 10px 20px)`, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                    {p.img
                      ? <img src={p.img} alt={p.name} style={{ height: '100%', width: '100%', objectFit: 'cover', filter: out ? 'grayscale(1) opacity(.5)' : undefined }} onError={ev => { (ev.target as HTMLImageElement).style.display = 'none'; }} />
                      : <span style={{ fontFamily: MONO, fontSize: 10, color: C.muted }}>// {p.category.toLowerCase()}</span>}
                    {tag && <span style={{ position: 'absolute', top: 0, left: 0, padding: '5px 10px', background: out ? C.ink : C.red, color: '#fff', fontFamily: MONO, fontSize: 10, fontWeight: 700, letterSpacing: '.06em' }}>{tag}</span>}
                  </div>
                  <div style={{ padding: '14px 16px', flex: 1, display: 'flex', flexDirection: 'column' }}>
                    <p style={{ margin: 0, fontFamily: MONO, fontSize: 9.5, letterSpacing: '.1em', color: C.muted }}>{p.category}</p>
                    <p style={{ margin: '5px 0 0', fontFamily: UI, fontSize: 14, fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={p.name}>{p.name}</p>
                    <div style={{ flex: 1 }} />
                    <div style={{ display: 'flex', alignItems: 'stretch', justifyContent: 'space-between', marginTop: 14, gap: 10 }}>
                      <span style={{ fontFamily: MONO, fontSize: 18, fontWeight: 700, color: C.red, alignSelf: 'center' }}>{eur(p.price)}</span>
                      <button onClick={() => addToCart(p)} disabled={out}
                        className={out ? '' : 'b3-btn-ink'}
                        style={{ padding: '9px 16px', border: 0, background: out ? C.paper3 : C.ink, color: out ? C.muted : C.paper, fontFamily: UI, fontSize: 12, fontWeight: 800, letterSpacing: '.04em', cursor: out ? 'not-allowed' : 'pointer' }}>
                        {out ? 'ÉPUISÉ' : '+ AJOUTER'}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  };

  /* ── 07 PROFIL ───────────────────────────────────────────── */
  const renderProfile = () => {
    const socials = [
      { tag: 'DC', color: '#9aa6ff' }, { tag: 'X', color: C.paper },
      { tag: 'TW', color: '#b89bff' }, { tag: 'YT', color: C.red },
    ];
    const gameProfile = [
      { label: 'RANG', value: 'Diamant I', color: C.green },
      { label: 'RÔLE PRINCIPAL', value: 'Duelliste', color: C.ink },
      { label: 'RÉGION', value: 'Europe (EU)', color: C.ink },
      { label: 'DISPONIBILITÉ', value: 'Soirs & week-ends', color: C.ink },
    ];
    const name = (user.username || 'Phantom');
    const onDark = 'rgba(231,227,217,.25)';

    return (
      <div style={{ clipPath: scanClip, display: 'flex', flexDirection: 'column', gap: 26 }}>
        <ScreenHead num="07" eyebrow="// IDENTITÉ" title={<>Profil</>} />
        <section style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr', border: `2px solid ${C.ink}` }}>
          <div style={{ padding: 30, borderRight: `2px solid ${C.ink}`, background: C.ink, color: C.paper }}>
            <div style={{ height: 120, width: 120, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: DISP, fontSize: 56, color: '#fff', background: C.red, clipPath: 'polygon(0 0,100% 0,100% 80%,86% 100%,0 100%)' }}>{name[0]?.toUpperCase()}</div>
            <h2 style={{ margin: '22px 0 0', fontFamily: DISP, fontSize: 38, lineHeight: .85, textTransform: 'uppercase' }}>{name}</h2>
            <p style={{ margin: '8px 0 0', fontFamily: MONO, fontSize: 12, letterSpacing: '.06em', color: C.red }}>DIAMANT I · {N(412, 0)} RR</p>
            <div style={{ display: 'flex', marginTop: 22, border: `1px solid ${onDark}`, width: 'max-content' }}>
              {socials.map((s, i) => (
                <span key={i} style={{ height: 42, width: 42, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRight: i < socials.length - 1 ? `1px solid ${onDark}` : 0, fontFamily: MONO, fontSize: 12, fontWeight: 700, color: s.color }}>{s.tag}</span>
              ))}
            </div>
            <button className="b3-btn-ondark" style={{ marginTop: 24, width: '100%', padding: 14, border: 0, background: C.red, color: '#fff', fontFamily: UI, fontSize: 13, fontWeight: 800, letterSpacing: '.04em', textTransform: 'uppercase', cursor: 'pointer' }}>Connecter mon compte Riot</button>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '22px 26px', borderBottom: `2px solid ${C.ink}` }}>
              <div>
                <p style={{ margin: 0, fontFamily: DISP, fontSize: 22, textTransform: 'uppercase' }}>Mode LFG</p>
                <p style={{ margin: '4px 0 0', fontFamily: MONO, fontSize: 11, color: C.muted }}>APPARAÎTRE DANS LA RECHERCHE D'ÉQUIPE</p>
              </div>
              <button onClick={() => setLfg(v => !v)} style={{ position: 'relative', width: 62, height: 30, border: `2px solid ${C.ink}`, background: lfg ? C.red : C.paper3, cursor: 'pointer', padding: 0 }}>
                <span style={{ position: 'absolute', top: 1, left: 1, height: 24, width: 24, background: lfg ? C.paper : C.ink, transition: 'transform .2s', transform: lfg ? 'translateX(32px)' : 'translateX(0)' }} />
              </button>
            </div>
            <div style={{ padding: '22px 26px' }}>
              <p style={{ ...kicker('x'), margin: '0 0 16px', letterSpacing: '.14em' }}>// PROFIL_GAMING</p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', borderTop: `1px solid ${C.line}`, borderLeft: `1px solid ${C.line}` }}>
                {gameProfile.map((g, i) => (
                  <div key={i} style={{ padding: 16, borderRight: `1px solid ${C.line}`, borderBottom: `1px solid ${C.line}` }}>
                    <p style={{ margin: 0, fontFamily: MONO, fontSize: 10, letterSpacing: '.08em', color: C.muted }}>{g.label}</p>
                    <p style={{ margin: '8px 0 0', fontFamily: UI, fontSize: 17, fontWeight: 700, color: g.color }}>{g.value}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      </div>
    );
  };

  /* ── 08 ADMIN (real overview) ────────────────────────────── */
  const renderAdmin = () => {
    const head = <ScreenHead num="08" eyebrow="// VUE_D'ENSEMBLE" title={<>Panneau Admin</>} />;
    const wrap = (body: React.ReactNode) => (
      <div style={{ clipPath: scanClip, display: 'flex', flexDirection: 'column', gap: 26 }}>{head}{body}</div>
    );

    if (overview === null) {
      return wrap(<p style={{ fontFamily: MONO, fontSize: 12, letterSpacing: '.2em', color: C.muted, padding: '40px 0' }} className="animate-pulse">// CHARGEMENT DES MÉTRIQUES…</p>);
    }
    const m = overview.metrics;
    if (!overview.success || !m) {
      return wrap(
        <div style={{ border: `2px solid ${C.red}`, padding: '40px 24px' }}>
          <p style={{ margin: 0, fontFamily: DISP, fontSize: 26, textTransform: 'uppercase', color: C.red }}>API hors-ligne</p>
          <p style={{ margin: '10px 0 0', fontFamily: MONO, fontSize: 12, color: C.ink2 }}>{overview.error || 'Impossible de charger les données.'}</p>
          <p style={{ margin: '6px 0 0', fontFamily: MONO, fontSize: 11, color: C.muted }}>Vérifie que le serveur tourne — <span style={{ color: C.ink, fontWeight: 700 }}>npm run api</span></p>
        </div>,
      );
    }

    const adminStats = [
      { label: 'REVENU TOTAL', value: eur(m.revenue * e), sub: 'TOUTES VENTES', color: C.green },
      { label: 'COMMANDES', value: N(m.orders, 0), sub: `${m.products} PRODUITS`, color: C.ink },
      { label: 'MEMBRES', value: N(m.users, 0), sub: `${m.admins} ADMIN${m.admins > 1 ? 'S' : ''} · ${m.lfg} LFG`, color: C.ink },
      { label: 'STOCK', value: N(m.stock, 0), sub: 'UNITÉS', color: m.stock <= 10 ? C.red : C.ink },
    ];

    const signups = overview.signups ?? [];
    const maxSignup = Math.max(1, ...signups.map(s => s.count));
    const orders = overview.recentOrders ?? [];

    return wrap(<>
      <section style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', border: `2px solid ${C.ink}` }}>
        {adminStats.map((st, i) => (
          <div key={i} style={{ padding: 22, borderRight: i < 3 ? `1px solid ${C.line}` : 0 }}>
            <p style={{ margin: 0, fontFamily: MONO, fontSize: 10, letterSpacing: '.1em', color: C.muted }}>{st.label}</p>
            <p style={{ margin: '12px 0 0', fontFamily: MONO, fontSize: 38, fontWeight: 700, lineHeight: .85, color: st.color }}>{st.value}</p>
            <p style={{ margin: '8px 0 0', fontFamily: MONO, fontSize: 11, fontWeight: 700, color: C.ink2 }}>{st.sub}</p>
          </div>
        ))}
      </section>
      <section style={{ display: 'grid', gridTemplateColumns: '1fr 1.2fr', gap: 28 }}>
        <div style={{ border: `2px solid ${C.ink}`, padding: 22 }}>
          <p style={{ ...kicker('x'), margin: '0 0 20px', letterSpacing: '.14em' }}>// INSCRIPTIONS · 7J</p>
          {signups.length === 0 ? (
            <div style={{ height: 160, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: MONO, fontSize: 11, color: C.muted }}>AUCUNE INSCRIPTION RÉCENTE</div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: 12, height: 160 }}>
              {signups.map((s, i) => {
                const day = new Date(s.day).toLocaleDateString('fr-FR', { weekday: 'short' }).replace('.', '').slice(0, 3).toUpperCase();
                return (
                  <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, height: '100%', justifyContent: 'flex-end' }}>
                    <span style={{ fontFamily: MONO, fontSize: 11, fontWeight: 700, color: C.ink2 }}>{Math.round(s.count * e)}</span>
                    <div style={{ width: '100%', background: C.red, height: ((s.count / maxSignup) * 100 * e).toFixed(1) + '%', minHeight: s.count > 0 ? 3 : 0 }} />
                    <span style={{ fontFamily: MONO, fontSize: 10, color: C.muted }}>{day}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
        <div>
          <p style={{ ...kicker('x'), margin: '0 0 14px', letterSpacing: '.14em' }}>// COMMANDES_RÉCENTES</p>
          <div style={{ borderTop: `2px solid ${C.ink}` }}>
            {orders.length === 0 && (
              <div style={{ padding: '24px 0', fontFamily: MONO, fontSize: 11, color: C.muted }}>AUCUNE COMMANDE</div>
            )}
            {orders.map((o, i) => {
              const col = ORDER_STATUS_COLOR[o.status] ?? C.ink2;
              return (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '13px 0', borderBottom: `1px solid ${C.line}` }}>
                  <span style={{ fontFamily: MONO, fontSize: 11, color: C.muted, width: 46 }}>#{o.id}</span>
                  <span style={{ flex: 1, fontFamily: UI, fontSize: 14, fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{o.username ?? 'Inconnu'}</span>
                  <span style={{ fontFamily: MONO, fontSize: 14, fontWeight: 700 }}>{eur(o.total_ttc)}</span>
                  <span style={{ fontFamily: MONO, fontSize: 10, fontWeight: 700, letterSpacing: '.06em', padding: '5px 10px', border: `1.5px solid ${col}`, color: col, width: 104, textAlign: 'center', textTransform: 'uppercase' }}>{o.status}</span>
                </div>
              );
            })}
          </div>
        </div>
      </section>
    </>);
  };

  const screens: Record<Screen, () => React.ReactNode> = {
    home: renderHome, stats: renderStats, agents: renderAgents, players: renderPlayers,
    tournaments: renderTournaments, shop: renderShop, profile: renderProfile, admin: renderAdmin,
  };

  /* ── shell ───────────────────────────────────────────────── */
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', width: '100%' }}>
      {/* TOAST */}
      {toast && (
        <div style={{ position: 'fixed', top: 16, left: '50%', transform: 'translateX(-50%)', zIndex: 50, display: 'flex', alignItems: 'center', gap: 10, padding: '10px 16px', background: C.ink, color: C.paper, border: `2px solid ${C.green}` }}>
          <span style={{ height: 8, width: 8, background: C.green }} />
          <span style={{ fontFamily: MONO, fontSize: 11, fontWeight: 700, letterSpacing: '.06em' }}>
            {toast.length > 28 ? toast.slice(0, 28) + '…' : toast} — AJOUTÉ AU PANIER
          </span>
        </div>
      )}

      {/* COMMAND RAIL */}
      <header style={{ flex: 'none', display: 'flex', alignItems: 'stretch', height: 66, borderBottom: `2px solid ${C.ink}`, background: C.paper }}>
        <button onClick={() => setScreen('home')} style={{ display: 'flex', alignItems: 'center', gap: 13, padding: '0 22px', border: 0, borderRight: `2px solid ${C.ink}`, background: 'transparent', cursor: 'pointer' }}>
          <span style={{ height: 42, width: 42, display: 'flex', alignItems: 'center', justifyContent: 'center', background: C.red, color: '#fff', fontFamily: DISP, fontSize: 22, letterSpacing: '.02em', clipPath: 'polygon(0 0,100% 0,100% 72%,82% 100%,0 100%)' }}>B3</span>
          <span style={{ textAlign: 'left', lineHeight: 1 }}>
            <span style={{ display: 'block', fontFamily: DISP, fontSize: 21, letterSpacing: '.01em' }}>ESPORT</span>
            <span style={{ display: 'block', marginTop: 3, fontFamily: MONO, fontSize: 8.5, letterSpacing: '.22em', color: C.muted }}>// VALORANT.HUB</span>
          </span>
        </button>

        <nav style={{ flex: 1, display: 'flex', alignItems: 'stretch', overflowX: 'auto', scrollbarWidth: 'none' }}>
          {nav.map((it, i) => {
            const active = it.id === screen;
            return (
              <button key={it.id} onClick={() => setScreen(it.id)} className="b3-nav"
                style={{ position: 'relative', display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 3, padding: '0 18px', border: 0, borderRight: `1px solid ${C.line}`, background: active ? C.paper2 : 'transparent', cursor: 'pointer', textAlign: 'left', flex: 'none' }}>
                {active && <span style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 4, background: C.red }} />}
                <span style={{ fontFamily: MONO, fontSize: 10, letterSpacing: '.1em', color: active ? C.red : C.muted }}>0{i + 1}</span>
                <span style={{ fontFamily: UI, fontSize: 13, fontWeight: 800, letterSpacing: '.03em', textTransform: 'uppercase', color: active ? C.ink : C.ink2 }}>{it.label}</span>
              </button>
            );
          })}
        </nav>

        <div style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '0 22px', borderLeft: `2px solid ${C.ink}` }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 7, fontFamily: MONO, fontSize: 10, fontWeight: 700, letterSpacing: '.12em' }}>
            <span style={{ height: 8, width: 8, background: C.red }} />LIVE · EUW
          </span>
          <button onClick={() => setScreen('shop')} className="b3-panier"
            style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: 8, padding: '9px 14px', border: `1.5px solid ${C.ink}`, background: C.ink, color: C.paper, fontFamily: MONO, fontSize: 11, fontWeight: 700, letterSpacing: '.08em', cursor: 'pointer' }}>
            PANIER [{cartCount}]
          </button>
          <button onClick={onLogout} title="Se déconnecter"
            style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '9px 14px', border: `1.5px solid ${C.ink}`, background: 'transparent', color: C.ink, fontFamily: MONO, fontSize: 11, fontWeight: 700, letterSpacing: '.08em', cursor: 'pointer' }}
            className="b3-btn-ondark">
            QUITTER
          </button>
        </div>
      </header>

      {/* STATUS STRIP */}
      <div style={{ flex: 'none', display: 'flex', alignItems: 'center', height: 30, overflow: 'hidden', borderBottom: `1px solid ${C.line}`, background: C.paper2, fontFamily: MONO, fontSize: 10.5, letterSpacing: '.14em', color: C.ink2, whiteSpace: 'nowrap' }}>
        <span style={{ display: 'inline-block', animation: 'mq 28s linear infinite' }}>
          {Array(2).fill(0).map((_, i) => (
            <React.Fragment key={i}>
              VCT CHAMPIONS — GRANDE FINALE EN COURS&nbsp;&nbsp;◆&nbsp;&nbsp;PATCH 8.11 LIVE&nbsp;&nbsp;◆&nbsp;&nbsp;6 JOUEURS EN RECHERCHE D'ÉQUIPE&nbsp;&nbsp;◆&nbsp;&nbsp;B3 WINTER CUP — INSCRIPTIONS OUVERTES&nbsp;&nbsp;◆&nbsp;&nbsp;NOUVEAU MERCH DISPONIBLE&nbsp;&nbsp;◆&nbsp;&nbsp;
            </React.Fragment>
          ))}
        </span>
      </div>

      {/* STAGE */}
      <div style={{ position: 'relative', flex: 1, minHeight: 0 }}>
        <div style={{ position: 'absolute', top: 0, bottom: 0, width: 4, background: C.red, left: scanX, opacity: scanOp, pointerEvents: 'none', zIndex: 20 }} />
        <main ref={scrollRef} style={{ position: 'absolute', inset: 0, overflowY: 'auto', padding: '34px 40px 56px' }}>
          {screens[screen]()}
        </main>
      </div>
    </div>
  );
};

export default B3App;
