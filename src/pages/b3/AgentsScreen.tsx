// Agents tier list + per-agent detail sheet. Extracted from B3App to keep that
// component focused; receives the bits of state it needs as props.
import React from 'react';
import type { StatsRecord, MatchWithUser } from '../../types/api';
import { AGENT_META, TIER_RANK, SLOT_KEY, DIFFICULTY_LABEL, AGENT_GUIDE, MATCHUP_DATA, type ValorantAgent } from '../../data/agents';
import { C, DISP, MONO, UI } from './theme';
import { ScreenHead, chipRow, kicker } from './ui';

interface AgentsScreenProps {
  statsData: { stats: StatsRecord | null; matches: MatchWithUser[] } | null;
  apiAgents: Record<string, ValorantAgent>;
  detailAgent: string | null;
  setDetailAgent: (name: string | null) => void;
  role: string;
  setRole: (v: string) => void;
  scanClip: string;
  W: (v: number) => string;
}

export const AgentsScreen: React.FC<AgentsScreenProps> = ({
  statsData, apiAgents, detailAgent, setDetailAgent, role, setRole, scanClip, W,
}) => {
  /* ── 03b AGENT DETAIL (spells, counters, how-to-play) ────── */
  const renderAgentDetail = (name: string) => {
    const meta = AGENT_META.find(a => a.name === name);
    const api = apiAgents[name];
    const guide = AGENT_GUIDE[name];
    const matchup = MATCHUP_DATA[name];
    const abilities = (api?.abilities ?? []).filter(ab => ab.displayName && (ab.slot !== 'Passive' || ab.description));
    const grad = api?.backgroundGradientColors ?? [];
    const heroBg = grad.length >= 4
      ? `linear-gradient(110deg, #${grad[0]} 0%, #${grad[1]} 42%, #${grad[2]} 74%, #${grad[3]} 100%)`
      : C.ink;
    const onDark = 'rgba(231,227,217,.4)';
    const tierStyle: Record<string, { bg: string; fg: string }> = {
      'S+': { bg: C.red, fg: '#fff' }, S: { bg: C.paper, fg: C.ink }, A: { bg: C.paper3, fg: C.ink }, B: { bg: C.paper3, fg: C.ink }, C: { bg: 'transparent', fg: onDark },
    };

    const counterChip = (n: string) => {
      const ic = apiAgents[n]?.displayIcon;
      return (
        <button key={n} onClick={() => setDetailAgent(n)} className="b3-row" style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '8px 10px', border: `1px solid ${C.line}`, background: C.paper, cursor: 'pointer', textAlign: 'left' }}>
          <span style={{ height: 28, width: 28, flex: 'none', background: C.paper3, overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {ic ? <img src={ic} alt={n} style={{ height: '100%', width: '100%', objectFit: 'cover' }} /> : <span style={{ fontFamily: DISP, fontSize: 13 }}>{n[0]}</span>}
          </span>
          <span style={{ fontFamily: UI, fontSize: 13, fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{n}</span>
        </button>
      );
    };

    return (
      <div style={{ clipPath: scanClip, display: 'flex', flexDirection: 'column', gap: 22 }}>
        <button onClick={() => setDetailAgent(null)} style={{ alignSelf: 'flex-start', display: 'inline-flex', alignItems: 'center', gap: 8, padding: '8px 14px', border: `2px solid ${C.ink}`, background: C.paper, fontFamily: MONO, fontSize: 11, fontWeight: 700, letterSpacing: '.1em', textTransform: 'uppercase', cursor: 'pointer' }}>← Tier list</button>

        {/* Hero */}
        <section style={{ position: 'relative', overflow: 'hidden', border: `2px solid ${C.ink}`, minHeight: 260, background: heroBg, color: '#fff' }}>
          {api?.background && <img src={api.background} alt="" style={{ position: 'absolute', inset: 0, height: '100%', width: '100%', objectFit: 'cover', opacity: .25, mixBlendMode: 'luminosity' }} />}
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(90deg, rgba(20,18,16,.93) 0%, rgba(20,18,16,.7) 46%, rgba(20,18,16,.2) 100%)' }} />
          {api?.fullPortrait && <img src={api.fullPortrait} alt={name} style={{ position: 'absolute', right: 0, bottom: 0, height: '116%', objectFit: 'contain', pointerEvents: 'none', filter: 'drop-shadow(0 12px 30px rgba(0,0,0,.5))' }} />}
          <div style={{ position: 'relative', padding: '30px 32px', maxWidth: '62%' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
              {meta && <span style={{ fontFamily: DISP, fontSize: 16, lineHeight: 1, padding: '4px 9px', color: tierStyle[meta.tier].fg, background: tierStyle[meta.tier].bg, border: meta.tier === 'C' ? `1px solid ${onDark}` : 0 }}>{meta.tier}</span>}
              {meta && <span style={{ fontFamily: MONO, fontSize: 11, letterSpacing: '.1em', color: '#fff' }}>{meta.role}</span>}
              {guide && (
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontFamily: MONO, fontSize: 11, color: onDark }}>
                  {[0, 1, 2].map(i => <span key={i} style={{ height: 5, width: 16, background: i < guide.difficulty ? C.red : 'rgba(255,255,255,.2)' }} />)}
                  {DIFFICULTY_LABEL[guide.difficulty]}
                </span>
              )}
            </div>
            <h1 style={{ margin: 0, fontFamily: DISP, fontSize: 60, lineHeight: .82, textTransform: 'uppercase' }}>{name}</h1>
            {api?.role && <p style={{ margin: '14px 0 0', fontFamily: UI, fontSize: 14, lineHeight: 1.5, color: 'rgba(255,255,255,.82)' }}>{api.role.description || api.description}</p>}
          </div>
        </section>

        {/* Meta cards */}
        {meta && (
          <section style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', border: `2px solid ${C.ink}` }}>
            {[
              { l: 'WIN RATE', v: `${meta.win.toFixed(1)}%`, c: meta.win >= 52.5 ? C.green : C.ink },
              { l: 'PICK RATE', v: `${meta.pick.toFixed(1)}%`, c: C.ink },
              { l: 'K/D MÉTA', v: meta.kd.toFixed(2), c: meta.kd >= 1.2 ? C.green : C.ink },
              { l: 'TIER', v: meta.tier, c: C.red },
            ].map((s, i) => (
              <div key={s.l} style={{ padding: 18, borderRight: i < 3 ? `1px solid ${C.line}` : 0 }}>
                <p style={{ margin: 0, fontFamily: MONO, fontSize: 10, letterSpacing: '.1em', color: C.muted }}>{s.l}</p>
                <p style={{ margin: '8px 0 0', fontFamily: MONO, fontSize: 30, fontWeight: 700, lineHeight: .9, color: s.c }}>{s.v}</p>
              </div>
            ))}
          </section>
        )}

        <section style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 22, alignItems: 'start' }}>
          {/* Abilities / spells */}
          <div style={{ border: `2px solid ${C.ink}`, padding: 22 }}>
            <p style={{ ...kicker('// COMPÉTENCES'), margin: '0 0 16px' }}>// COMPÉTENCES</p>
            {abilities.length === 0 && <p style={{ fontFamily: MONO, fontSize: 11, color: C.muted }}>// CHARGEMENT DES COMPÉTENCES…</p>}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {abilities.map(ab => (
                <div key={ab.slot} style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
                  <div style={{ position: 'relative', height: 44, width: 44, flex: 'none', background: C.ink, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {ab.displayIcon ? <img src={ab.displayIcon} alt={ab.displayName} style={{ height: 28, width: 28, objectFit: 'contain', filter: 'invert(1)' }} /> : <span style={{ fontFamily: DISP, fontSize: 16, color: C.paper }}>{SLOT_KEY[ab.slot] ?? '?'}</span>}
                    <span style={{ position: 'absolute', bottom: -7, right: -7, height: 20, width: 20, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: MONO, fontSize: 10, fontWeight: 700, color: '#fff', background: C.red, border: `2px solid ${C.paper}` }}>{SLOT_KEY[ab.slot] ?? '?'}</span>
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ margin: 0, fontFamily: UI, fontSize: 14, fontWeight: 800 }}>{ab.displayName}</p>
                    <p style={{ margin: '3px 0 0', fontFamily: UI, fontSize: 12.5, lineHeight: 1.5, color: C.ink2 }}>{ab.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* How to play + best maps */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            {guide && (
              <div style={{ border: `2px solid ${C.ink}`, padding: 22 }}>
                <p style={{ ...kicker('// COMMENT LE JOUER'), margin: '0 0 12px' }}>// COMMENT LE JOUER</p>
                <p style={{ margin: '0 0 14px', fontFamily: UI, fontSize: 13, lineHeight: 1.55, color: C.ink2 }}>{guide.summary}</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {guide.tips.map((t, i) => (
                    <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                      <span style={{ flex: 'none', marginTop: 2, height: 14, width: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', background: C.red, color: '#fff', fontFamily: MONO, fontSize: 9, fontWeight: 700 }}>✓</span>
                      <span style={{ fontFamily: UI, fontSize: 12.5, lineHeight: 1.5, color: C.ink2 }}>{t}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {guide && guide.bestMaps.length > 0 && (
              <div style={{ border: `2px solid ${C.ink}`, padding: 22 }}>
                <p style={{ ...kicker('// MEILLEURES MAPS'), margin: '0 0 12px' }}>// MEILLEURES MAPS</p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {guide.bestMaps.map(mp => (
                    <span key={mp} style={{ fontFamily: MONO, fontSize: 12, fontWeight: 700, letterSpacing: '.04em', padding: '7px 12px', border: `1.5px solid ${C.ink}`, textTransform: 'uppercase' }}>{mp}</span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </section>

        {/* Counters & synergies */}
        {matchup && (
          <section style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 22 }}>
            <div style={{ border: `2px solid ${C.ink}`, padding: 22 }}>
              <p style={{ ...kicker('// FAIBLE FACE À', C.red), margin: '0 0 14px' }}>// FAIBLE FACE À</p>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10 }}>{matchup.weakTo.map(counterChip)}</div>
            </div>
            <div style={{ border: `2px solid ${C.ink}`, padding: 22 }}>
              <p style={{ ...kicker('// SYNERGIES', C.green), margin: '0 0 14px', color: C.green }}>// SYNERGIES</p>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10 }}>{matchup.synergy.map(counterChip)}</div>
            </div>
          </section>
        )}
      </div>
    );
  };

  const tierStyle: Record<string, { bg: string; fg: string }> = {
    'S+': { bg: C.red, fg: '#fff' },
    S: { bg: C.ink, fg: C.paper },
    A: { bg: C.paper3, fg: C.ink },
    B: { bg: C.paper3, fg: C.ink },
    C: { bg: 'transparent', fg: C.muted },
  };
  const matches = statsData?.matches ?? [];

  // The player's own picks, so we can flag agents they have actually played and
  // surface their personal K/D alongside the global meta.
  const mine = new Map<string, { matches: number; kills: number; deaths: number }>();
  matches.forEach(m => {
    const key = (m.agent_played || '').toLowerCase();
    if (!key) return;
    const a = mine.get(key) ?? { matches: 0, kills: 0, deaths: 0 };
    a.matches += 1; a.kills += m.kills; a.deaths += m.deaths;
    mine.set(key, a);
  });

  const agents = AGENT_META.map(a => {
    const own = mine.get(a.name.toLowerCase());
    const ownKd = own ? own.kills / Math.max(1, own.deaths) : null;
    return { ...a, played: own?.matches ?? 0, kd: ownKd ?? a.kd, kdOwn: ownKd != null };
  });

  // A single agent is open → render its full sheet (spells, counters…).
  if (detailAgent) return renderAgentDetail(detailAgent);

  const roles = ['Tous', 'Duelliste', 'Initiateur', 'Contrôleur', 'Sentinelle'];
  const cols = '54px 40px 2fr 1.1fr 1.2fr 0.9fr 0.9fr';
  const list = agents
    .filter(a => role === 'Tous' || a.role === role.toUpperCase())
    .sort((x, y) => (TIER_RANK[x.tier] - TIER_RANK[y.tier]) || (y.pick - x.pick));

  return (
    <div style={{ clipPath: scanClip, display: 'flex', flexDirection: 'column', gap: 26 }}>
      <ScreenHead num="03" eyebrow={`// MÉTA AGENTS · ${AGENT_META.length} AGENTS · CLIQUE POUR LE DÉTAIL`} title={<>Agents</>} />
      {chipRow(roles, role, setRole)}
      <div style={{ border: `2px solid ${C.ink}` }}>
        <div style={{ display: 'grid', gridTemplateColumns: cols, gap: 14, padding: '12px 20px', borderBottom: `2px solid ${C.ink}`, background: C.paper2, fontFamily: MONO, fontSize: 10, letterSpacing: '.1em', color: C.muted }}>
          <span>TIER</span><span /><span>AGENT</span><span>RÔLE</span><span>WIN RATE</span><span>PICK</span><span>K/D</span>
        </div>
        {list.length === 0 && (
          <div style={{ padding: '20px', fontFamily: MONO, fontSize: 11, color: C.muted }}>AUCUN AGENT POUR CE RÔLE</div>
        )}
        {list.map((a, i) => {
          const icon = apiAgents[a.name]?.displayIcon;
          return (
          <div key={a.name} className="b3-row" onClick={() => setDetailAgent(a.name)} title={`Voir ${a.name}`} style={{ display: 'grid', gridTemplateColumns: cols, gap: 14, alignItems: 'center', padding: '14px 20px', borderBottom: i < list.length - 1 ? `1px solid ${C.line}` : 0, cursor: 'pointer' }}>
            <span style={{ height: 34, width: 34, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: DISP, fontSize: 18, color: tierStyle[a.tier].fg, background: tierStyle[a.tier].bg, border: a.tier === 'C' ? `1px solid ${C.line}` : 0 }}>{a.tier}</span>
            <span style={{ height: 36, width: 36, background: C.paper3, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
              {icon ? <img src={icon} alt={a.name} style={{ height: '100%', width: '100%', objectFit: 'cover' }} /> : <span style={{ fontFamily: DISP, fontSize: 16, color: C.muted }}>{a.name[0]}</span>}
            </span>
            <span style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
              <span style={{ fontFamily: DISP, fontSize: 22, textTransform: 'uppercase' }}>{a.name}</span>
              {a.played > 0 && (
                <span style={{ fontFamily: MONO, fontSize: 9, fontWeight: 700, letterSpacing: '.08em', color: '#fff', background: C.red, padding: '2px 5px' }}>{a.played} JOUÉ{a.played > 1 ? 'S' : ''}</span>
              )}
            </span>
            <span style={{ fontFamily: MONO, fontSize: 12, color: C.ink2 }}>{a.role}</span>
            <div>
              <span style={{ fontFamily: MONO, fontSize: 13, fontWeight: 700 }}>{a.win.toFixed(1)}%</span>
              <div style={{ marginTop: 6, height: 5, background: C.paper3, overflow: 'hidden' }}>
                <div style={{ height: '100%', background: C.green, width: W(a.win) }} />
              </div>
            </div>
            <span style={{ fontFamily: MONO, fontSize: 13, color: C.ink2 }}>{a.pick.toFixed(1)}%</span>
            <span style={{ fontFamily: MONO, fontSize: 15, fontWeight: 700, color: a.kdOwn ? C.red : C.ink2 }} title={a.kdOwn ? 'Ton K/D' : 'K/D méta'}>{a.kd.toFixed(2)}</span>
          </div>
        );})}
      </div>
    </div>
  );
};
