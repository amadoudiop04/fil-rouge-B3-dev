import React, { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { LoginForm } from '../pages/LoginForm';
import { RegisterForm } from '../pages/RegisterForm';
import { ForgotPasswordForm } from '../pages/ForgotPasswordForm';
import { ResetPasswordForm } from '../pages/ResetPasswordForm';

const sp = { type: 'spring' as const, stiffness: 380, damping: 30 };
const C = { ink: 'var(--ink)', paper: 'var(--paper)', red: 'var(--red)', muted: 'var(--muted)', line: 'var(--line)', ink2: 'var(--ink2)' };

type Mode = 'login' | 'register' | 'forgot' | 'reset';

export const AuthPage: React.FC<{ onBack?: () => void }> = ({ onBack }) => {
  const [mode, setMode] = useState<Mode>('login');
  const [resetToken, setResetToken] = useState('');

  // A reset link (…/?token=abc) lands here → open the reset form pre-filled, and
  // strip the token from the URL so it isn't left in history.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get('token');
    if (token) {
      setResetToken(token);
      setMode('reset');
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, []);

  const showTabs = mode === 'login' || mode === 'register';

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
        {/* Tab switcher — only for the login/register pair */}
        {showTabs && (
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
        )}

        {/* Standalone header for the reset flows (no tabs) */}
        {!showTabs && (
          <div className="px-5 py-3.5 font-mono uppercase" style={{ borderBottom: `2px solid ${C.ink}`, fontSize: 12, fontWeight: 700, letterSpacing: '.1em', background: C.ink, color: C.paper }}>
            {mode === 'forgot' ? '· Mot de passe oublié' : '· Nouveau mot de passe'}
          </div>
        )}

        {/* Form area */}
        <div className="p-5">
          <AnimatePresence mode="wait">
            {mode === 'login' && (
              <motion.div key="login"
                initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }} transition={sp}>
                <LoginForm onSwitchToRegister={() => setMode('register')} onForgot={() => setMode('forgot')} />
              </motion.div>
            )}
            {mode === 'register' && (
              <motion.div key="register"
                initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} transition={sp}>
                <RegisterForm onSwitchToLogin={() => setMode('login')} />
              </motion.div>
            )}
            {mode === 'forgot' && (
              <motion.div key="forgot"
                initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} transition={sp}>
                <ForgotPasswordForm
                  onSwitchToLogin={() => setMode('login')}
                  onGotToken={(t) => { setResetToken(t); setMode('reset'); }}
                />
              </motion.div>
            )}
            {mode === 'reset' && (
              <motion.div key="reset"
                initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} transition={sp}>
                <ResetPasswordForm initialToken={resetToken} onSwitchToLogin={() => setMode('login')} />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>

      {onBack && (
        <motion.button
          type="button" onClick={onBack}
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.55 }}
          className="relative mt-6 font-mono uppercase transition hover:opacity-70"
          style={{ fontSize: 11, letterSpacing: '.14em', color: C.ink2, background: 'transparent', border: 0, cursor: 'pointer' }}
        >
          ← Continuer en tant qu'invité
        </motion.button>
      )}

      <motion.p
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.7 }}
        className="relative mt-6 font-mono" style={{ fontSize: 10, letterSpacing: '.16em', color: C.muted }}
      >
        © 2026 B3 GAMING PLATFORM
      </motion.p>
    </div>
  );
};
