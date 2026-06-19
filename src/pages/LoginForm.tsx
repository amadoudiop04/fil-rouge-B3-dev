import React, { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';

const sp = { type: 'spring' as const, stiffness: 400, damping: 30 };

export const LoginForm: React.FC<{ onSwitchToRegister: () => void }> = ({ onSwitchToRegister }) => {
  const { login } = useAuth();
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw]     = useState(false);
  const [error, setError]       = useState('');
  const [loading, setLoading]   = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try { await login(email, password); }
    catch (err) { setError(err instanceof Error ? err.message : 'Erreur de connexion'); }
    finally { setLoading(false); }
  };

  return (
    <form onSubmit={submit} className="space-y-4">
      <div className="space-y-2">
        <div className="relative">
          <input
            type="email" value={email} onChange={e => setEmail(e.target.value)} required
            placeholder="Adresse email"
            className="input w-full px-4 py-3 text-[15px]"
          />
        </div>
        <div className="relative">
          <input
            type={showPw ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} required
            placeholder="Mot de passe"
            className="input w-full px-4 py-3 pr-16 text-[15px]"
          />
          <button
            type="button" onClick={() => setShowPw(v => !v)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-[12px] font-medium"
            style={{ color: 'var(--violet2)' }}
          >
            {showPw ? 'Cacher' : 'Voir'}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {error && (
          <motion.p initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="rounded-lg px-3 py-2 text-[13px]"
            style={{ background: 'rgba(239,68,68,0.1)', color: 'var(--red)', border: '1px solid rgba(239,68,68,0.2)' }}
          >
            {error}
          </motion.p>
        )}
      </AnimatePresence>

      <motion.button
        type="submit" disabled={loading}
        whileTap={{ scale: 0.97 }} transition={sp}
        className="btn-primary w-full py-3.5 text-[15px]"
      >
        {loading ? (
          <span className="flex items-center justify-center gap-2">
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
            Connexion…
          </span>
        ) : 'Se connecter'}
      </motion.button>

      <p className="text-center text-[13px]" style={{ color: 'var(--text3)' }}>
        Pas encore de compte ?{' '}
        <button type="button" onClick={onSwitchToRegister} className="font-semibold transition hover:opacity-80" style={{ color: 'var(--violet2)' }}>
          S'inscrire
        </button>
      </p>
    </form>
  );
};
