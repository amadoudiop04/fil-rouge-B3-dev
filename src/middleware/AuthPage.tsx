import React, { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { LoginForm } from '../pages/LoginForm';
import { RegisterForm } from '../pages/RegisterForm';

const sp = { type: 'spring' as const, stiffness: 380, damping: 30 };

export const AuthPage: React.FC = () => {
  const [mode, setMode] = useState<'login' | 'register'>('login');

  return (
    <div
      className="relative flex min-h-screen flex-col items-center justify-center px-5 py-12 overflow-hidden"
      style={{ background: 'var(--bg)' }}
    >
      {/* Ambient glow */}
      <div
        className="pointer-events-none absolute left-1/2 top-1/2 h-[500px] w-[500px] -translate-x-1/2 -translate-y-1/2 rounded-full opacity-10"
        style={{ background: 'radial-gradient(circle, var(--violet) 0%, transparent 70%)' }}
      />

      {/* Logo */}
      <motion.div
        initial={{ opacity: 0, y: -16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ ...sp, delay: 0.05 }}
        className="relative mb-8 flex flex-col items-center gap-4"
      >
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl glow-violet" style={{ background: 'var(--violet)' }}>
          <svg viewBox="0 0 32 32" fill="none" className="h-9 w-9 text-white">
            <path d="M16 3L4 9v14l12 6 12-6V9L16 3z" stroke="currentColor" strokeWidth={2} strokeLinejoin="round"/>
            <path d="M4 9l12 6 12-6M16 15v12" stroke="currentColor" strokeWidth={2} strokeLinejoin="round"/>
          </svg>
        </div>
        <div className="text-center">
          <h1 className="text-[30px] font-bold tracking-tight">B3 Esport</h1>
          <p className="mt-1 text-[15px]" style={{ color: 'var(--text2)' }}>Plateforme compétitive</p>
        </div>
      </motion.div>

      {/* Auth card */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ ...sp, delay: 0.12 }}
        className="relative w-full max-w-sm overflow-hidden rounded-2xl"
        style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
      >
        {/* Tab switcher */}
        <div className="flex" style={{ borderBottom: '1px solid var(--border)' }}>
          {(['login', 'register'] as const).map(m => (
            <button
              key={m}
              type="button"
              onClick={() => setMode(m)}
              className="relative flex-1 py-3.5 text-[14px] font-semibold transition"
              style={{ color: mode === m ? 'var(--text1)' : 'var(--text3)' }}
            >
              {mode === m && (
                <motion.div
                  layoutId="authTab"
                  className="absolute bottom-0 left-0 right-0 h-0.5"
                  style={{ background: 'var(--violet)' }}
                  transition={sp}
                />
              )}
              {m === 'login' ? 'Connexion' : 'Inscription'}
            </button>
          ))}
        </div>

        {/* Form area */}
        <div className="p-5">
          <AnimatePresence mode="wait">
            {mode === 'login' ? (
              <motion.div key="login"
                initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }}
                transition={sp}
              >
                <LoginForm onSwitchToRegister={() => setMode('register')} />
              </motion.div>
            ) : (
              <motion.div key="register"
                initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }}
                transition={sp}
              >
                <RegisterForm onSwitchToLogin={() => setMode('login')} />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>

      <motion.p
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.7 }}
        className="relative mt-6 text-[12px]" style={{ color: 'var(--text3)' }}
      >
        © 2025 B3 Gaming Platform
      </motion.p>
    </div>
  );
};
