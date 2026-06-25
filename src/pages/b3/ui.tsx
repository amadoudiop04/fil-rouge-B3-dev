// Pure presentational helpers shared by the B3App screens.
// They depend only on the design tokens, so they live outside the big component.
import React from 'react';
import { C, DISP, MONO } from './theme';

// Eyebrow style used for the little "// SECTION" labels. The label text is passed
// inline as children at the call sites, so the first arg is kept only for parity.
export const kicker = (_text: string, color: string = C.red): React.CSSProperties => ({
  margin: 0, fontFamily: MONO, fontSize: 11, letterSpacing: '.16em', color,
});

export const ScreenHead: React.FC<{
  num: string; eyebrow: string; title: React.ReactNode; right?: React.ReactNode;
}> = ({ num, eyebrow, title, right }) => (
  <div style={{ display: 'flex', alignItems: 'flex-end', gap: 20, borderBottom: `2px solid ${C.ink}`, paddingBottom: 16 }}>
    <span style={{ fontFamily: DISP, fontSize: 64, lineHeight: .8, color: C.red }}>{num}</span>
    <div style={{ flex: 1 }}>
      <span style={{ fontFamily: MONO, fontSize: 11, letterSpacing: '.16em', color: C.muted }}>{eyebrow}</span>
      <h1 style={{ margin: '4px 0 0', fontFamily: DISP, fontSize: 46, lineHeight: .85, textTransform: 'uppercase' }}>{title}</h1>
    </div>
    {right}
  </div>
);

export const chipRow = (items: string[], current: string, set: (v: string) => void): React.ReactNode => (
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
