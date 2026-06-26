import React, { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { platformApi } from '../services/platformApi';

const sp = { type: 'spring' as const, stiffness: 400, damping: 30 };

export const ForgotPasswordForm: React.FC<{
  onSwitchToLogin: () => void;
  onGotToken: (token: string) => void;
}> = ({ onSwitchToLogin, onGotToken }) => {
  const [email, setEmail]     = useState('');
  const [error, setError]     = useState('');
  const [message, setMessage] = useState('');
  const [devLink, setDevLink] = useState<string | null>(null);
  const [devToken, setDevToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(''); setMessage(''); setDevLink(null); setDevToken(null);
    setLoading(true);
    const r = await platformApi.forgotPassword(email);
    setLoading(false);
    if (!r.success) { setError(r.error || 'Erreur'); return; }
    setMessage(r.message || 'Si un compte existe, un lien a été envoyé.');
    if (r.devResetLink) setDevLink(r.devResetLink);
    if (r.devResetToken) setDevToken(r.devResetToken);
  };

  return (
    <form onSubmit={submit} className="space-y-4">
      <p className="text-[13px]" style={{ color: 'var(--text3)' }}>
        Saisis ton adresse email pour recevoir un lien de réinitialisation.
      </p>

      <input
        type="email" value={email} onChange={e => setEmail(e.target.value)} required
        placeholder="Adresse email"
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
        {message && (
          <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="rounded-lg px-3 py-2 text-[13px]"
            style={{ background: 'rgba(34,197,94,0.1)', color: 'var(--green)', border: '1px solid rgba(34,197,94,0.2)' }}>
            {message}
            {/* No mailer in this project → surface the link so the demo works end-to-end. */}
            {devToken && (
              <button type="button" onClick={() => onGotToken(devToken)}
                className="mt-2 block font-semibold underline" style={{ color: 'var(--green)' }}>
                → Continuer la réinitialisation (mode démo)
              </button>
            )}
            {devLink && <span className="mt-1 block break-all opacity-70">{devLink}</span>}
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        type="submit" disabled={loading}
        whileTap={{ scale: 0.97 }} transition={sp}
        className="btn-primary w-full py-3.5 text-[15px]">
        {loading ? 'Envoi…' : 'Envoyer le lien'}
      </motion.button>

      <p className="text-center text-[13px]" style={{ color: 'var(--text3)' }}>
        <button type="button" onClick={onSwitchToLogin} className="font-semibold transition hover:opacity-80" style={{ color: 'var(--violet2)' }}>
          ← Retour à la connexion
        </button>
      </p>
    </form>
  );
};
