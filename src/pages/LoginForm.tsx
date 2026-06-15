import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';

interface Props { onSwitchToRegister: () => void; }

const spring = { type: 'spring' as const, stiffness: 360, damping: 28 };

const EyeIcon: React.FC<{ open: boolean }> = ({ open }) => open ? (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" className="h-4 w-4">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
  </svg>
) : (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" className="h-4 w-4">
    <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94"/>
    <path d="M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19"/>
    <line x1="1" y1="1" x2="23" y2="23"/>
  </svg>
);

export const LoginForm: React.FC<Props> = ({ onSwitchToRegister }) => {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur de connexion');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="mb-1.5 block text-[10px] font-extrabold uppercase tracking-[0.2em] text-white/40">
          Email
        </label>
        <input
          type="email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          placeholder="votre@email.com"
          required
          className="w-full rounded-xl border border-white/[0.07] bg-white/[0.04] px-4 py-3 text-sm text-white placeholder:text-white/20 outline-none transition hover:border-white/15 focus:border-[#FF4654]/60 focus:bg-white/[0.06]"
        />
      </div>

      <div>
        <label className="mb-1.5 block text-[10px] font-extrabold uppercase tracking-[0.2em] text-white/40">
          Mot de passe
        </label>
        <div className="relative">
          <input
            type={showPw ? 'text' : 'password'}
            value={password}
            onChange={e => setPassword(e.target.value)}
            placeholder="••••••••"
            required
            className="w-full rounded-xl border border-white/[0.07] bg-white/[0.04] px-4 py-3 pr-11 text-sm text-white placeholder:text-white/20 outline-none transition hover:border-white/15 focus:border-[#FF4654]/60 focus:bg-white/[0.06]"
          />
          <button
            type="button"
            onClick={() => setShowPw(v => !v)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/70 transition"
          >
            <EyeIcon open={showPw} />
          </button>
        </div>
      </div>

      {error && (
        <motion.p
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-xl border border-[#FF4654]/30 bg-[#FF4654]/10 px-4 py-2.5 text-xs text-[#FF4654]"
        >
          {error}
        </motion.p>
      )}

      <motion.button
        type="submit"
        disabled={loading}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.97 }}
        transition={spring}
        className="w-full rounded-xl bg-[#FF4654] py-3 text-sm font-extrabold uppercase tracking-[0.15em] text-white transition hover:bg-[#e03040] disabled:cursor-not-allowed disabled:opacity-50"
      >
        {loading ? (
          <span className="flex items-center justify-center gap-2">
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
            Connexion…
          </span>
        ) : 'Se connecter'}
      </motion.button>

      <p className="text-center text-xs text-white/30">
        Pas de compte ?{' '}
        <button
          type="button"
          onClick={onSwitchToRegister}
          className="font-bold text-[#FF4654] hover:text-white transition"
        >
          S'inscrire
        </button>
      </p>
    </form>
  );
};
