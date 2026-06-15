import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';

interface Props { onSwitchToLogin: () => void; }

const spring = { type: 'spring' as const, stiffness: 360, damping: 28 };

export const RegisterForm: React.FC<Props> = ({ onSwitchToLogin }) => {
  const { register } = useAuth();
  const [username, setUsername]         = useState('');
  const [email, setEmail]               = useState('');
  const [password, setPassword]         = useState('');
  const [confirm, setConfirm]           = useState('');
  const [error, setError]               = useState('');
  const [loading, setLoading]           = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (password !== confirm) { setError('Les mots de passe ne correspondent pas'); return; }
    setLoading(true);
    try {
      await register(username, email, password);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur lors de l'inscription");
    } finally {
      setLoading(false);
    }
  };

  const Field: React.FC<{
    label: string; type: string; value: string;
    onChange: (v: string) => void; placeholder: string;
  }> = ({ label, type, value, onChange, placeholder }) => (
    <div>
      <label className="mb-1.5 block text-[10px] font-extrabold uppercase tracking-[0.2em] text-white/40">
        {label}
      </label>
      <input
        type={type} value={value} onChange={e => onChange(e.target.value)}
        placeholder={placeholder} required
        className="w-full rounded-xl border border-white/[0.07] bg-white/[0.04] px-4 py-3 text-sm text-white placeholder:text-white/20 outline-none transition hover:border-white/15 focus:border-[#FF4654]/60 focus:bg-white/[0.06]"
      />
    </div>
  );

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <Field label="Pseudo"          type="text"     value={username} onChange={setUsername} placeholder="TonPseudo" />
      <Field label="Email"           type="email"    value={email}    onChange={setEmail}    placeholder="votre@email.com" />
      <Field label="Mot de passe"    type="password" value={password} onChange={setPassword} placeholder="••••••••" />
      <Field label="Confirmation"    type="password" value={confirm}  onChange={setConfirm}  placeholder="••••••••" />

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
            Inscription…
          </span>
        ) : "Créer mon compte"}
      </motion.button>

      <p className="text-center text-xs text-white/30">
        Déjà inscrit ?{' '}
        <button
          type="button"
          onClick={onSwitchToLogin}
          className="font-bold text-[#FF4654] hover:text-white transition"
        >
          Se connecter
        </button>
      </p>
    </form>
  );
};
