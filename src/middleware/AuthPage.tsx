import React, { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { LoginForm } from '../pages/LoginForm';
import { RegisterForm } from '../pages/RegisterForm';

const sp = { type: 'spring' as const, stiffness: 380, damping: 30 };
const C = { ink: 'var(--ink)', paper: 'var(--paper)', red: 'var(--red)', muted: 'var(--muted)', line: 'var(--line)', ink2: 'var(--ink2)' };

export const AuthPage: React.FC = () => {
  const [mode, setMode] = useState<'login' | 'register'>('login');

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center px-5 py-12 overflow-hidden">
      {/* marquee strip top */}
      <div className="absolute inset-x-0 top-0 flex h-7 items-center overflow-hidden"
        style={{ background: 'var(--paper2)', borderBottom: `1px solid ${C.line}`, whiteSpace: 'nowrap' }}>
        <span className="inline-block font-mono" style={{ fontSize: 10, letterSpacing: '.18em', color: C.ink2, animation: 'mq 28s linear infinite' }}>
          {Array(2).fill(0).map((_, i) => (
            <React.Fragment key={i}>
              B3 ESPORT&nbsp;&nbsp;◆&nbsp;&nbsp;VALORANT.HUB&nbsp;&nbsp;◆&nbsp;&nbsp;VCT CHAMPIONS&nbsp;&nbsp;◆&nbsp;&nbsp;PATCH 8.11 LIVE&nbsp;&nbsp;◆&nbsp;&nbsp;B3 WINTER CUP — INSCRIPTIONS OUVERTES&nbsp;&nbsp;◆&nbsp;&nbsp;
            </React.Fragment>
          ))}
        </span>
      </div>

      {/* Logo lockup */}
      <motion.div
        initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }} transition={{ ...sp, delay: 0.05 }}
        className="relative mb-8 flex items-center gap-3"
      >
        <span className="flex items-center justify-center font-display text-white"
          style={{ height: 54, width: 54, fontSize: 30, background: C.red, clipPath: 'polygon(0 0,100% 0,100% 72%,82% 100%,0 100%)' }}>
          B3
        </span>
        <span className="leading-none text-left">
          <span className="block font-display" style={{ fontSize: 30, letterSpacing: '.01em' }}>ESPORT</span>
          <span className="mt-1 block font-mono" style={{ fontSize: 9, letterSpacing: '.22em', color: C.muted }}>// VALORANT.HUB</span>
        </span>
      </motion.div>

      {/* Auth card */}
      <motion.div
        initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ ...sp, delay: 0.12 }}
        className="relative w-full max-w-sm overflow-hidden"
        style={{ background: C.paper, border: `2px solid ${C.ink}` }}
      >
        {/* Tab switcher */}
        <div className="flex" style={{ borderBottom: `2px solid ${C.ink}` }}>
          {(['login', 'register'] as const).map((m, i) => (
            <button key={m} type="button" onClick={() => setMode(m)}
              className="relative flex-1 py-3.5 font-mono uppercase transition"
              style={{
                fontSize: 12, fontWeight: 700, letterSpacing: '.1em',
                borderRight: i === 0 ? `1px solid ${C.line}` : undefined,
                background: mode === m ? C.ink : 'transparent',
                color: mode === m ? C.paper : C.ink2,
              }}>
              {m === 'login' ? '01 · Connexion' : '02 · Inscription'}
            </button>
          ))}
        </div>

        {/* Form area */}
        <div className="p-5">
          <AnimatePresence mode="wait">
            {mode === 'login' ? (
              <motion.div key="login"
                initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }} transition={sp}>
                <LoginForm onSwitchToRegister={() => setMode('register')} />
              </motion.div>
            ) : (
              <motion.div key="register"
                initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} transition={sp}>
                <RegisterForm onSwitchToLogin={() => setMode('login')} />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>

      <motion.p
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.7 }}
        className="relative mt-6 font-mono" style={{ fontSize: 10, letterSpacing: '.16em', color: C.muted }}
      >
        © 2026 B3 GAMING PLATFORM
      </motion.p>
    </div>
  );
};
