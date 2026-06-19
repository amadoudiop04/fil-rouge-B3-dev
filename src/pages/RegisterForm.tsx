import React, { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';

const sp = { type: 'spring' as const, stiffness: 400, damping: 30 };

export const RegisterForm: React.FC<{ onSwitchToLogin: () => void }> = ({ onSwitchToLogin }) => {
  const { register } = useAuth();
  const [username, setUsername] = useState('');
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm]   = useState('');
  const [showPw, setShowPw]     = useState(false);
  const [error, setError]       = useState('');
  const [loading, setLoading]   = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (password !== confirm) { setError('Les mots de passe ne correspondent pas'); return; }
    if (password.length < 6) { setError('6 caractères minimum pour le mot de passe'); return; }
    setLoading(true);
    try { await register(username, email, password); }
    catch (err) { setError(err instanceof Error ? err.message : "Erreur d'inscription"); }
    finally { setLoading(false); }
  };

  return (
    <form onSubmit={submit} className="space-y-4">
      <div className="space-y-2">
        <input type="text" value={username} onChange={e => setUsername(e.target.value)} required
          placeholder="Nom d'utilisateur" className="input w-full px-4 py-3 text-[15px]" />
        <input type="email" value={email} onChange={e => setEmail(e.target.value)} required
          placeholder="Adresse email" className="input w-full px-4 py-3 text-[15px]" />
        <div className="relative">
          <input type={showPw ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} required
            placeholder="Mot de passe (6 min.)" className="input w-full px-4 py-3 pr-16 text-[15px]" />
          <button type="button" onClick={() => setShowPw(v => !v)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-[12px] font-medium" style={{ color: 'var(--violet2)' }}>
            {showPw ? 'Cacher' : 'Voir'}
          </button>
        </div>
        <input type={showPw ? 'text' : 'password'} value={confirm} onChange={e => setConfirm(e.target.value)} required
          placeholder="Confirmer le mot de passe" className="input w-full px-4 py-3 text-[15px]" />
      </div>

      <AnimatePresence>
        {error && (
          <motion.p initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="rounded-lg px-3 py-2 text-[13px]"
            style={{ background: 'rgba(239,68,68,0.1)', color: 'var(--red)', border: '1px solid rgba(239,68,68,0.2)' }}>
            {error}
          </motion.p>
        )}
      </AnimatePresence>

      <motion.button type="submit" disabled={loading}
        whileTap={{ scale: 0.97 }} transition={sp}
        className="btn-primary w-full py-3.5 text-[15px]">
        {loading ? (
          <span className="flex items-center justify-center gap-2">
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
            Inscription…
          </span>
        ) : 'Créer mon compte'}
      </motion.button>

      <p className="text-center text-[13px]" style={{ color: 'var(--text3)' }}>
        Déjà inscrit ?{' '}
        <button type="button" onClick={onSwitchToLogin} className="font-semibold" style={{ color: 'var(--violet2)' }}>
          Se connecter
        </button>
      </p>
    </form>
  );
};
