// Community Discord servers list. Extracted from B3App; purely presentational.
import React from 'react';
import type { DiscordServer } from '../../services/platformApi';
import { C, DISP, MONO, UI } from './theme';
import { ScreenHead } from './ui';

export const DiscordScreen: React.FC<{ servers: DiscordServer[] | null; scanClip: string }> = ({ servers, scanClip }) => {
  const all = servers ?? [];
  const featured = all.find(s => s.featured) ?? all[0];
  const rest = all.filter(s => s !== featured);
  const letter = (n: string) => (n.split('·').pop()?.trim()[0] || n[0] || 'D').toUpperCase();

  return (
    <div style={{ clipPath: scanClip, display: 'flex', flexDirection: 'column', gap: 26 }}>
      <ScreenHead num="07" eyebrow="// COMMUNAUTÉ · SERVEURS DISCORD" title={<>Discord</>} />

      {servers === null ? (
        <p style={{ fontFamily: MONO, fontSize: 12, letterSpacing: '.2em', color: C.muted, padding: '40px 0' }} className="animate-pulse">// CHARGEMENT DES SERVEURS…</p>
      ) : all.length === 0 ? (
        <div style={{ border: `2px solid ${C.ink}`, padding: '48px 22px', textAlign: 'center' }}>
          <p style={{ margin: 0, fontFamily: DISP, fontSize: 26, textTransform: 'uppercase' }}>Aucun serveur</p>
          <p style={{ margin: '8px 0 0', fontFamily: MONO, fontSize: 11, color: C.muted }}>UN ADMIN PEUT EN AJOUTER DEPUIS LE PANNEAU ADMIN</p>
        </div>
      ) : (<>
        {featured && (
          <a href={featured.invite_url} target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none', color: C.paper }}>
            <section className="b3-row" style={{ border: `2px solid ${C.ink}`, background: '#5865F2', color: '#fff', padding: 34, position: 'relative', overflow: 'hidden', cursor: 'pointer' }}>
              <span style={{ position: 'absolute', top: 0, right: 0, fontFamily: DISP, fontSize: 220, lineHeight: .7, color: 'rgba(255,255,255,.12)', transform: 'translate(10%,-14%)' }}>✶</span>
              <span style={{ display: 'inline-block', padding: '6px 12px', background: 'rgba(0,0,0,.25)', fontFamily: MONO, fontSize: 10, fontWeight: 700, letterSpacing: '.14em' }}>{[featured.tag, featured.members ? `${featured.members} MEMBRES` : null].filter(Boolean).join(' · ')}</span>
              <h2 style={{ margin: '16px 0 0', fontFamily: DISP, fontSize: 50, lineHeight: .85, textTransform: 'uppercase', maxWidth: 680 }}>{featured.name}</h2>
              {featured.description && <p style={{ margin: '12px 0 0', fontFamily: UI, fontSize: 15, lineHeight: 1.5, color: 'rgba(255,255,255,.88)', maxWidth: 560 }}>{featured.description}</p>}
              <span style={{ display: 'inline-block', marginTop: 24, padding: '14px 28px', background: '#fff', color: '#404EED', fontFamily: UI, fontSize: 14, fontWeight: 800, letterSpacing: '.04em', textTransform: 'uppercase' }}>↗ Rejoindre le serveur</span>
            </section>
          </a>
        )}

        {rest.length > 0 && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 18 }}>
            {rest.map(s => (
              <div key={s.id} className="b3-row" style={{ border: `2px solid ${C.ink}`, background: C.paper, display: 'flex', flexDirection: 'column' }}>
                <div style={{ padding: '18px 18px 14px', flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                    <span style={{ height: 40, width: 40, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#5865F2', color: '#fff', fontFamily: DISP, fontSize: 20 }}>{letter(s.name)}</span>
                    {s.tag && <span style={{ fontFamily: MONO, fontSize: 9, fontWeight: 700, letterSpacing: '.08em', padding: '4px 8px', border: `1.5px solid ${C.ink}`, color: C.ink2 }}>{s.tag}</span>}
                  </div>
                  <p style={{ margin: 0, fontFamily: DISP, fontSize: 21, lineHeight: .95, textTransform: 'uppercase' }}>{s.name}</p>
                  {s.description && <p style={{ margin: '8px 0 0', fontFamily: UI, fontSize: 12.5, lineHeight: 1.5, color: C.ink2 }}>{s.description}</p>}
                  {s.members && <p style={{ margin: '10px 0 0', fontFamily: MONO, fontSize: 10, letterSpacing: '.08em', color: C.muted }}>● {s.members} MEMBRES</p>}
                </div>
                <a href={s.invite_url} target="_blank" rel="noopener noreferrer" className="b3-btn-ink" style={{ textAlign: 'center', padding: 13, borderTop: `2px solid ${C.ink}`, background: C.ink, color: C.paper, fontFamily: UI, fontSize: 12, fontWeight: 800, letterSpacing: '.06em', textTransform: 'uppercase', textDecoration: 'none' }}>↗ Rejoindre</a>
              </div>
            ))}
          </div>
        )}
        <p style={{ margin: 0, fontFamily: MONO, fontSize: 10, letterSpacing: '.08em', color: C.muted }}>// LES INVITATIONS S'OUVRENT DANS DISCORD · RESPECTE LE RÈGLEMENT DE CHAQUE SERVEUR</p>
      </>)}
    </div>
  );
};
