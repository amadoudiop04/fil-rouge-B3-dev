import React, { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { platformApi } from '../services/platformApi';

const sp = { type: 'spring' as const, stiffness: 400, damping: 30 };

export const ResetPasswordForm: React.FC<{
  initialToken: string;
  onSwitchToLogin: () => void;
}> = ({ initialToken, onSwitchToLogin }) => {
  const [token, setToken]       = useState(initialToken);
  const [password, setPassword] = useState('');
  const [confirm, setConfirm]   = useState('');
  const [showPw, setShowPw]     = useState(false);
  const [error, setError]       = useState('');
  const [done, setDone]         = useState(false);
  const [loading, setLoading]   = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (password !== confirm) { setError('Les mots de passe ne correspondent pas'); return; }
    setLoading(true);
    const r = await platformApi.resetPassword(token.trim(), password);
    setLoading(false);
    if (!r.success) { setError(r.error || 'Erreur'); return; }
    setDone(true);
  };

  if (done) {
    return (
      <div className="space-y-4 text-center">
        <p className="text-[15px] font-semibold" style={{ color: 'var(--green)' }}>✓ Mot de passe réinitialisé</p>
        <p className="text-[13px]" style={{ color: 'var(--text3)' }}>Tu peux maintenant te connecter avec ton nouveau mot de passe.</p>
        <motion.button type="button" onClick={onSwitchToLogin}
          whileTap={{ scale: 0.97 }} transition={sp}
          className="btn-primary w-full py-3.5 text-[15px]">
          Se connecter
        </motion.button>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <p className="text-[13px]" style={{ color: 'var(--text3)' }}>Choisis un nouveau mot de passe (6 caractères minimum).</p>

      {/* Token field — usually arrives via the email link, editable as a fallback. */}
      {!initialToken && (
        <input
          type="text" value={token} onChange={e => setToken(e.target.value)} required
          placeholder="Code de réinitialisation"
          className="input w-full px-4 py-3 text-[15px]"
        />
      )}

      <div className="relative">
        <input
          type={showPw ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} required
          placeholder="Nouveau mot de passe"
          className="input w-full px-4 py-3 pr-16 text-[15px]"
        />
        <button type="button" onClick={() => setShowPw(v => !v)}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-[12px] font-medium" style={{ color: 'var(--violet2)' }}>
          {showPw ? 'Cacher' : 'Voir'}
        </button>
      </div>

      <input
        type={showPw ? 'text' : 'password'} value={confirm} onChange={e => setConfirm(e.target.value)} required
        placeholder="Confirme le mot de passe"
        className="input w-full px-4 py-3 text-[15px]"
      />

      <AnimatePresence>
        {error && (
          <motion.p initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="rounded-lg px-3 py-2 text-[13px]"
            style={{ background: 'rgba(239,68,68,0.1)', color: 'var(--red)', border: '1px solid rgba(239,68,68,0.2)' }}>
            {error}
          </motion.p>
        )}
      </AnimatePresence>

      <motion.button
        type="submit" disabled={loading}
        whileTap={{ scale: 0.97 }} transition={sp}
        className="btn-primary w-full py-3.5 text-[15px]">
        {loading ? 'Réinitialisation…' : 'Réinitialiser'}
      </motion.button>

      <p className="text-center text-[13px]" style={{ color: 'var(--text3)' }}>
        <button type="button" onClick={onSwitchToLogin} className="font-semibold transition hover:opacity-80" style={{ color: 'var(--violet2)' }}>
          ← Retour à la connexion
        </button>
      </p>
    </form>
  );
};
