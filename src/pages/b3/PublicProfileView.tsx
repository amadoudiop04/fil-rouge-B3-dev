// Read-only public profile of any player. Extracted from B3App.
import React from 'react';
import type { PublicProfile } from '../../services/platformApi';
import { C, DISP, MONO, UI } from './theme';
import { kicker } from './ui';

export const PublicProfileView: React.FC<{ profile: PublicProfile; onBack: () => void; scanClip: string }> = ({ profile: p, onBack, scanClip }) => {
  const socials = [
    ['Discord', p.discord], ['Twitter', p.twitter], ['Twitch', p.twitch], ['YouTube', p.youtube],
  ].filter(([, v]) => v) as [string, string][];
  return (
    <div style={{ clipPath: scanClip, display: 'flex', flexDirection: 'column', gap: 24 }}>
      <button onClick={onBack} style={{ alignSelf: 'flex-start', display: 'inline-flex', alignItems: 'center', gap: 8, padding: '8px 14px', border: `2px solid ${C.ink}`, background: C.paper, fontFamily: MONO, fontSize: 11, fontWeight: 700, letterSpacing: '.1em', textTransform: 'uppercase', cursor: 'pointer' }}>← Retour</button>

      <section style={{ display: 'flex', gap: 20, alignItems: 'center', border: `2px solid ${C.ink}`, padding: 24 }}>
        <div style={{ width: 84, height: 84, flex: 'none', background: C.paper3, border: `2px solid ${C.ink}`, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', fontFamily: DISP, fontSize: 34 }}>
          {p.avatarUrl ? <img src={p.avatarUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : (p.username[0] || '?').toUpperCase()}
        </div>
        <div style={{ minWidth: 0 }}>
          <h2 style={{ margin: 0, fontFamily: DISP, fontSize: 38, lineHeight: .9, textTransform: 'uppercase' }}>{p.username}</h2>
          <p style={{ margin: '8px 0 0', fontFamily: MONO, fontSize: 12, color: C.muted, textTransform: 'uppercase', letterSpacing: '.06em' }}>
            {[p.rankLabel || 'Non classé', p.region || null].filter(Boolean).join(' · ')}
          </p>
        </div>
      </section>

      {p.bio && <p style={{ margin: 0, fontFamily: UI, fontSize: 15, lineHeight: 1.5, color: C.ink2, maxWidth: 680 }}>{p.bio}</p>}

      {(p.roles && p.roles.length > 0) && (
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {p.roles.map(r => <span key={r} style={{ padding: '5px 12px', border: `1.5px solid ${C.line2}`, fontFamily: MONO, fontSize: 11, textTransform: 'uppercase' }}>{r}</span>)}
        </div>
      )}

      {socials.length > 0 && (
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {socials.map(([k, v]) => (
            <span key={k} style={{ display: 'inline-flex', gap: 6, padding: '7px 12px', background: C.paper2, border: `1px solid ${C.line}`, fontFamily: MONO, fontSize: 11 }}>
              <span style={{ color: C.muted }}>{k}</span><span style={{ fontWeight: 700 }}>{v}</span>
            </span>
          ))}
        </div>
      )}

      {p.teams.length > 0 && (
        <section>
          <p style={{ ...kicker('x'), margin: '0 0 12px' }}>// ÉQUIPES</p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
            {p.teams.map(t => (
              <span key={t.id} style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '8px 12px', border: `1.5px solid ${C.line2}`, fontFamily: UI, fontWeight: 700 }}>
                <span style={{ fontFamily: DISP, fontSize: 16 }}>{t.tag || '—'}</span>{t.name}
                <span style={{ fontFamily: MONO, fontSize: 9, color: C.muted }}>{t.role === 'owner' ? '★ CAPITAINE' : 'MEMBRE'}</span>
              </span>
            ))}
          </div>
        </section>
      )}

      <section>
        <p style={{ ...kicker('x'), margin: '0 0 12px' }}>// DERNIERS MATCHS</p>
        <div style={{ borderTop: `2px solid ${C.ink}` }}>
          {p.recentMatches.length === 0
            ? <div style={{ padding: '20px 0', fontFamily: MONO, fontSize: 11, color: C.muted }}>AUCUN MATCH SYNCHRONISÉ</div>
            : p.recentMatches.map((m, i) => {
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
      </section>
    </div>
  );
};
