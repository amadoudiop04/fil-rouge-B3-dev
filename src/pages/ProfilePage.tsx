import React, { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { User } from '../contexts/AuthContext';
import { Avatar } from '../components/Avatar';
import { platformApi } from '../services/platformApi';

interface ProfilePageProps {
  user: User;
  onLogout: () => void;
  onNavigate: (page: string) => void;
}

const formatJoinDate = (date?: string) => {
  if (!date) {
    return 'Date non disponible';
  }

  const parsedDate = new Date(date);
  if (Number.isNaN(parsedDate.getTime())) {
    return 'Date non disponible';
  }

  return parsedDate.toLocaleDateString('fr-FR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
};

export const ProfilePage: React.FC<ProfilePageProps> = ({ user, onLogout, onNavigate }) => {
  const [fullName, setFullName] = useState(user.username);
  const [email, setEmail] = useState(user.email);
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [language, setLanguage] = useState('Français');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const storedNotifications = window.localStorage.getItem('profile-notifications');
    const storedLanguage = window.localStorage.getItem('profile-language');

    if (storedNotifications) {
      setNotificationsEnabled(storedNotifications === 'true');
    }
    if (storedLanguage) {
      setLanguage(storedLanguage);
    }
  }, []);

  const handleToggleNotifications = () => {
    const nextValue = !notificationsEnabled;
    setNotificationsEnabled(nextValue);
    window.localStorage.setItem('profile-notifications', String(nextValue));
  };

  const handleLanguageChange = (value: string) => {
    setLanguage(value);
    window.localStorage.setItem('profile-language', value);
  };

  const validateEmail = (value: string) => {
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailPattern.test(value);
  };

  const handleSave = async () => {
    setError(null);
    setSuccess(false);

    if (!fullName.trim()) {
      setError('Le nom complet est obligatoire.');
      return;
    }

    if (!validateEmail(email.trim())) {
      setError('Veuillez saisir un email valide.');
      return;
    }

    if (password && password.length < 6) {
      setError('Le mot de passe doit contenir au moins 6 caractères.');
      return;
    }

    try {
      setIsSaving(true);

      const profileResponse = await platformApi.updateProfile(Number(user.id), {
        username: fullName.trim(),
        email: email.trim(),
      });

      if (!profileResponse.success) {
        throw new Error(profileResponse.error || 'Erreur lors de la mise à jour du profil');
      }

      if (password) {
        const passwordResponse = await platformApi.updatePassword(Number(user.id), password);
        if (!passwordResponse.success) {
          throw new Error(passwordResponse.error || 'Erreur lors de la mise à jour du mot de passe');
        }
      }

      setPassword('');
      setSuccess(true);
      setTimeout(() => {
        window.location.reload();
      }, 900);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de la sauvegarde');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <main className="flex-1 overflow-y-auto pb-24 bg-[#030d1d]">
      <AnimatePresence>
        {success && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-4 left-1/2 z-50 -translate-x-1/2 rounded-lg bg-green-600 px-4 py-2 text-sm font-semibold"
          >
            Modifications enregistrées
          </motion.div>
        )}
      </AnimatePresence>

      <header className="sticky top-0 z-20 flex items-center justify-between border-b border-gray-800 bg-[#091628] px-4 py-4">
        <button
          type="button"
          onClick={() => onNavigate('home')}
          className="text-white/80 transition hover:text-white"
        >
          ←
        </button>
        <h1 className="text-sm font-extrabold uppercase tracking-wide">Mon profil</h1>
      </header>

      <section className="px-4 pt-6">
        <div className="flex flex-col items-center">
          <Avatar 
            username={fullName || user.username} 
            size="lg" 
            showBorder 
            editable 
          />

          <h2 className="mt-4 text-2xl font-extrabold leading-none">{fullName || user.username}</h2>
          <p className="mt-1 text-xs font-semibold uppercase tracking-wider text-blue-400">
            Rang: Radiant
          </p>
        </div>

        <div className="mt-8 space-y-5">
          <div>
            <p className="mb-3 text-[11px] font-extrabold uppercase tracking-[0.18em] text-cyan-200/80">
              Informations personnelles
            </p>

            <div className="space-y-3">
              <div>
                <label className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-cyan-200/60">
                  Nom complet
                </label>
                <div className="flex items-center gap-3 rounded-xl border border-gray-800 bg-[#0f1a2d] px-3 py-3">
                  <span className="text-gray-400">👤</span>
                  <input
                    type="text"
                    value={fullName}
                    onChange={(event) => setFullName(event.target.value)}
                    className="w-full bg-transparent text-sm font-semibold text-white outline-none"
                    placeholder="Votre nom"
                  />
                </div>
              </div>

              <div>
                <label className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-cyan-200/60">
                  E-mail
                </label>
                <div className="flex items-center gap-3 rounded-xl border border-gray-800 bg-[#0f1a2d] px-3 py-3">
                  <span className="text-gray-400">✉️</span>
                  <input
                    type="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    className="w-full bg-transparent text-sm font-semibold text-white outline-none"
                    placeholder="Votre email"
                  />
                </div>
              </div>

              <div>
                <label className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-cyan-200/60">
                  Mot de passe
                </label>
                <div className="flex items-center gap-3 rounded-xl border border-gray-800 bg-[#0f1a2d] px-3 py-3">
                  <span className="text-gray-400">🔒</span>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    className="w-full bg-transparent text-sm font-semibold text-white outline-none"
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((visible) => !visible)}
                    className="text-gray-400 transition hover:text-white"
                  >
                    {showPassword ? '🙈' : '👁️'}
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div>
            <p className="mb-3 text-[11px] font-extrabold uppercase tracking-[0.18em] text-cyan-200/80">
              Préférences & système
            </p>

            <div className="space-y-3">
              <div className="flex items-center justify-between rounded-xl border border-gray-800 bg-[#0f1a2d] px-3 py-3">
                <div className="flex items-center gap-3">
                  <span className="text-blue-400">🔔</span>
                  <p className="text-sm font-semibold text-gray-200">Notifications Push</p>
                </div>
                <button
                  type="button"
                  onClick={handleToggleNotifications}
                  className={`relative h-6 w-12 rounded-full transition ${
                    notificationsEnabled ? 'bg-blue-500' : 'bg-gray-700'
                  }`}
                >
                  <span
                    className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition ${
                      notificationsEnabled ? 'left-6' : 'left-0.5'
                    }`}
                  />
                </button>
              </div>

              <div className="flex items-center justify-between rounded-xl border border-gray-800 bg-[#0f1a2d] px-3 py-3">
                <div className="flex items-center gap-3">
                  <span className="text-blue-400">🌐</span>
                  <p className="text-sm font-semibold text-gray-200">Langue</p>
                </div>
                <select
                  value={language}
                  onChange={(event) => handleLanguageChange(event.target.value)}
                  className="rounded-md bg-transparent text-sm font-semibold text-blue-400 outline-none"
                >
                  <option className="bg-[#0f1a2d] text-white">Français</option>
                  <option className="bg-[#0f1a2d] text-white">English</option>
                </select>
              </div>
            </div>
          </div>

          {error && (
            <p className="rounded-lg border border-red-600/50 bg-red-900/40 px-3 py-2 text-sm text-red-200">
              {error}
            </p>
          )}

          <button
            type="button"
            onClick={handleSave}
            disabled={isSaving}
            className="w-full rounded-xl bg-blue-600 py-3 text-sm font-extrabold uppercase tracking-wide transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSaving ? 'Enregistrement...' : 'Enregistrer les modifications'}
          </button>

          <button
            type="button"
            onClick={onLogout}
            className="mx-auto flex items-center gap-2 pb-2 text-sm font-bold text-red-500 transition hover:text-red-400"
          >
            ↪ Déconnexion
          </button>

          <p className="pb-6 text-center text-[11px] text-gray-500">
            Membre depuis {formatJoinDate(user.createdAt)}
          </p>
        </div>
      </section>
    </main>
  );
};
