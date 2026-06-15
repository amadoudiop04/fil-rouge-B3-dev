import React, { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { LoginForm } from '../pages/LoginForm';
import { RegisterForm } from '../pages/RegisterForm';

const spring = { type: 'spring' as const, stiffness: 300, damping: 30 };

export const AuthPage: React.FC = () => {
  const [mode, setMode] = useState<'login' | 'register'>('login');

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#06060f] text-white flex flex-col items-center justify-center p-4">

      {/* Animated background orbs */}
      <div aria-hidden className="pointer-events-none fixed inset-0 -z-10">
        <div className="bg-grid absolute inset-0 opacity-100" />
        <div className="orb-1 absolute -left-32 -top-32 h-[420px] w-[420px] rounded-full bg-[#FF4654]/10 blur-[100px]" />
        <div className="orb-2 absolute -right-32 top-1/3 h-[500px] w-[500px] rounded-full bg-[#9d4edd]/8 blur-[120px]" />
        <div className="orb-3 absolute bottom-0 left-1/2 h-[300px] w-[300px] -translate-x-1/2 rounded-full bg-[#22d3ee]/6 blur-[90px]" />
        {/* scan line */}
        <div className="scan-line absolute inset-x-0 h-[2px] bg-gradient-to-r from-transparent via-[#FF4654]/20 to-transparent" />
      </div>

      {/* Logo */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ ...spring, delay: 0.05 }}
        className="mb-8 text-center"
      >
        <div className="mb-3 flex items-center justify-center gap-2">
          <div className="h-6 w-1.5 rounded-full bg-[#FF4654]" />
          <span className="text-3xl font-black uppercase tracking-[0.25em] text-white">
            B3 ESPORT
          </span>
          <div className="h-6 w-1.5 rounded-full bg-[#FF4654]" />
        </div>
        <p className="text-[11px] font-bold uppercase tracking-[0.3em] text-white/30">
          Plateforme compétitive
        </p>
      </motion.div>

      {/* Tab switcher */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ ...spring, delay: 0.12 }}
        className="mb-5 flex gap-1 rounded-2xl bg-white/[0.04] p-1 border border-white/[0.06]"
      >
        {(['login', 'register'] as const).map(m => (
          <button
            key={m}
            type="button"
            onClick={() => setMode(m)}
            className={`relative rounded-xl px-6 py-2 text-xs font-extrabold uppercase tracking-[0.15em] transition ${
              mode === m ? 'text-white' : 'text-white/30 hover:text-white/60'
            }`}
          >
            {mode === m && (
              <motion.div
                layoutId="auth-tab"
                className="absolute inset-0 rounded-xl bg-[#FF4654]"
                transition={spring}
              />
            )}
            <span className="relative">{m === 'login' ? 'Connexion' : 'Inscription'}</span>
          </button>
        ))}
      </motion.div>

      {/* Form card */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ ...spring, delay: 0.18 }}
        className="w-full max-w-sm rounded-3xl border border-white/[0.07] bg-white/[0.025] p-6 backdrop-blur-xl"
      >
        <AnimatePresence mode="wait">
          {mode === 'login' ? (
            <motion.div
              key="login"
              initial={{ opacity: 0, x: -16 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 16 }}
              transition={spring}
            >
              <LoginForm onSwitchToRegister={() => setMode('register')} />
            </motion.div>
          ) : (
            <motion.div
              key="register"
              initial={{ opacity: 0, x: 16 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -16 }}
              transition={spring}
            >
              <RegisterForm onSwitchToLogin={() => setMode('login')} />
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="mt-6 text-[10px] text-white/20 uppercase tracking-widest"
      >
        © 2025 B3 Gaming Platform
      </motion.p>

    </div>
  );
};
