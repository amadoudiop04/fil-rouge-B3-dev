import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { User } from '../contexts/AuthContext';

interface SettingsPageProps {
  user: User;
  onNavigate: (page: string) => void;
}

export const SettingsPage: React.FC<SettingsPageProps> = ({ onNavigate }) => {
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [autoUpdate, setAutoUpdate] = useState(true);
  const [language, setLanguage] = useState('Français');
  const [theme, setTheme] = useState('Dark');

  // Modals
  const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false);
  const [isDeleteAccountOpen, setIsDeleteAccountOpen] = useState(false);
  const [isTermsOpen, setIsTermsOpen] = useState(false);
  const [isPrivacyOpen, setIsPrivacyOpen] = useState(false);
  const [isLicensesOpen, setIsLicensesOpen] = useState(false);

  // Password change
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState(false);

  // Delete account
  const [deleteConfirmation, setDeleteConfirmation] = useState('');
  const [deleteError, setDeleteError] = useState('');

  useEffect(() => {
    const storedNotifications = window.localStorage.getItem('settings-notifications');
    const storedSound = window.localStorage.getItem('settings-sound');
    const storedAutoUpdate = window.localStorage.getItem('settings-auto-update');
    const storedLanguage = window.localStorage.getItem('settings-language');
    const storedTheme = window.localStorage.getItem('settings-theme');

    if (storedNotifications) setNotificationsEnabled(storedNotifications === 'true');
    if (storedSound) setSoundEnabled(storedSound === 'true');
    if (storedAutoUpdate) setAutoUpdate(storedAutoUpdate === 'true');
    if (storedLanguage) setLanguage(storedLanguage);
    if (storedTheme) setTheme(storedTheme);
  }, []);

  const handleToggle = (setting: string, value: boolean) => {
    window.localStorage.setItem(`settings-${setting}`, String(value));
    
    switch (setting) {
      case 'notifications':
        setNotificationsEnabled(value);
        break;
      case 'sound':
        setSoundEnabled(value);
        break;
      case 'auto-update':
        setAutoUpdate(value);
        break;
    }
  };

  const handleLanguageChange = (value: string) => {
    setLanguage(value);
    window.localStorage.setItem('settings-language', value);
  };

  const handleThemeChange = (value: string) => {
    setTheme(value);
    window.localStorage.setItem('settings-theme', value);
  };

  const handleChangePassword = async () => {
    setPasswordError('');
    setPasswordSuccess(false);

    if (!currentPassword || !newPassword || !confirmPassword) {
      setPasswordError('Tous les champs sont obligatoires');
      return;
    }

    if (newPassword.length < 6) {
      setPasswordError('Le nouveau mot de passe doit contenir au moins 6 caractères');
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError('Les mots de passe ne correspondent pas');
      return;
    }

    try {
      // Dans une vrai app, vous enverriez une requête au backend
      // Pour la démo, on simule seulement
      playNotificationSound();
      setPasswordSuccess(true);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      
      setTimeout(() => {
        setIsChangePasswordOpen(false);
        setPasswordSuccess(false);
      }, 1500);
    } catch (err) {
      setPasswordError('Erreur lors de la mise à jour du mot de passe');
    }
  };

  const playNotificationSound = () => {
    if (soundEnabled) {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      oscillator.frequency.value = 800; // Fréquence en Hz
      oscillator.type = 'sine';

      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);

      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.5);
    }
  };

  const handleDeleteAccount = async () => {
    setDeleteError('');

    if (deleteConfirmation !== 'SUPPRIMER') {
      setDeleteError('Tapez "SUPPRIMER" pour confirmer');
      return;
    }

    try {
      // Dans une vrai app, vous enverriez une requête pour supprimer le compte
      // Puis vous déconnectiez l'utilisateur
      setTimeout(() => {
        window.location.href = '/';
      }, 500);
    } catch (err) {
      setDeleteError('Erreur lors de la suppression du compte');
    }
  };

  return (
    <>
      <main className="flex-1 overflow-y-auto pb-24 bg-[#030d1d]">
        {/* Header */}
        <header className="sticky top-0 z-20 flex items-center justify-between border-b border-gray-800 bg-[#091628] px-4 py-4">
          <button
            type="button"
            onClick={() => onNavigate('home')}
            className="text-white/80 transition hover:text-white text-xl"
          >
            ←
          </button>
          <h1 className="text-sm font-extrabold uppercase tracking-wide">Paramètres</h1>
          <div className="w-6" />
        </header>

        <div className="px-4 py-6 space-y-6">
          {/* General Section */}
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-[#0b1525] rounded-2xl p-5 border border-gray-800"
          >
            <h2 className="text-lg font-bold mb-4 text-cyan-400">⚙️ Général</h2>
            
            <div className="space-y-4">
              {/* Language */}
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold text-sm">Langue</p>
                  <p className="text-xs text-gray-400">Choisir la langue de l'interface</p>
                </div>
                <select
                  value={language}
                  onChange={(e) => handleLanguageChange(e.target.value)}
                  className="bg-[#111927] border border-gray-700 rounded-lg px-3 py-2 text-sm outline-none focus:border-blue-500 transition"
                >
                  <option>Français</option>
                  <option>English</option>
                </select>
              </div>

              {/* Theme */}
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold text-sm">Thème</p>
                  <p className="text-xs text-gray-400">Apparence de l'application</p>
                </div>
                <select
                  value={theme}
                  onChange={(e) => handleThemeChange(e.target.value)}
                  className="bg-[#111927] border border-gray-700 rounded-lg px-3 py-2 text-sm outline-none focus:border-blue-500 transition"
                >
                  <option>Dark</option>
                  <option>Light</option>
                  <option>Auto</option>
                </select>
              </div>
            </div>
          </motion.section>

          {/* Notifications Section */}
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-[#0b1525] rounded-2xl p-5 border border-gray-800"
          >
            <h2 className="text-lg font-bold mb-4 text-blue-400">🔔 Notifications</h2>
            
            <div className="space-y-4">
              {/* Enable Notifications */}
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold text-sm">Activer les notifications</p>
                  <p className="text-xs text-gray-400">Recevoir des alertes push</p>
                </div>
                <button
                  onClick={() => handleToggle('notifications', !notificationsEnabled)}
                  className={`w-12 h-6 rounded-full transition-colors relative ${
                    notificationsEnabled ? 'bg-blue-600' : 'bg-gray-700'
                  }`}
                >
                  <div
                    className={`absolute top-0.5 w-5 h-5 bg-white rounded-full transition-transform ${
                      notificationsEnabled ? 'translate-x-6' : 'translate-x-0.5'
                    }`}
                  />
                </button>
              </div>

              {/* Sound */}
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold text-sm">Son des notifications</p>
                  <p className="text-xs text-gray-400">Jouer un son à la réception</p>
                </div>
                <button
                  onClick={() => handleToggle('sound', !soundEnabled)}
                  className={`w-12 h-6 rounded-full transition-colors relative ${
                    soundEnabled ? 'bg-blue-600' : 'bg-gray-700'
                  }`}
                >
                  <div
                    className={`absolute top-0.5 w-5 h-5 bg-white rounded-full transition-transform ${
                      soundEnabled ? 'translate-x-6' : 'translate-x-0.5'
                    }`}
                  />
                </button>
              </div>
            </div>
          </motion.section>

          {/* Application Section */}
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-[#0b1525] rounded-2xl p-5 border border-gray-800"
          >
            <h2 className="text-lg font-bold mb-4 text-purple-400">💻 Application</h2>
            
            <div className="space-y-4">
              {/* Auto Update */}
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold text-sm">Mises à jour automatiques</p>
                  <p className="text-xs text-gray-400">Télécharger les nouvelles versions</p>
                </div>
                <button
                  onClick={() => handleToggle('auto-update', !autoUpdate)}
                  className={`w-12 h-6 rounded-full transition-colors relative ${
                    autoUpdate ? 'bg-blue-600' : 'bg-gray-700'
                  }`}
                >
                  <div
                    className={`absolute top-0.5 w-5 h-5 bg-white rounded-full transition-transform ${
                      autoUpdate ? 'translate-x-6' : 'translate-x-0.5'
                    }`}
                  />
                </button>
              </div>

              {/* Version */}
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold text-sm">Version</p>
                  <p className="text-xs text-gray-400">Application actuelle</p>
                </div>
                <p className="text-sm text-gray-400">v1.0.0</p>
              </div>
            </div>
          </motion.section>

          {/* Account Section */}
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-[#0b1525] rounded-2xl p-5 border border-gray-800"
          >
            <h2 className="text-lg font-bold mb-4 text-green-400">👤 Compte</h2>
            
            <div className="space-y-3">
              <button
                onClick={() => onNavigate('profile')}
                className="w-full text-left px-4 py-3 bg-[#111927] hover:bg-gray-800 rounded-lg transition text-sm"
              >
                Modifier le profil
              </button>
              <button
                onClick={() => setIsChangePasswordOpen(true)}
                className="w-full text-left px-4 py-3 bg-[#111927] hover:bg-gray-800 rounded-lg transition text-sm"
              >
                Changer le mot de passe
              </button>
              <button
                onClick={() => setIsDeleteAccountOpen(true)}
                className="w-full text-left px-4 py-3 bg-red-900/20 hover:bg-red-900/30 text-red-400 rounded-lg transition text-sm"
              >
                Supprimer le compte
              </button>
            </div>
          </motion.section>

          {/* About Section */}
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-[#0b1525] rounded-2xl p-5 border border-gray-800"
          >
            <h2 className="text-lg font-bold mb-4 text-orange-400">ℹ️ À propos</h2>
            
            <div className="space-y-3">
              <button
                onClick={() => setIsTermsOpen(true)}
                className="w-full text-left px-4 py-3 bg-[#111927] hover:bg-gray-800 rounded-lg transition text-sm"
              >
                Conditions d'utilisation
              </button>
              <button
                onClick={() => setIsPrivacyOpen(true)}
                className="w-full text-left px-4 py-3 bg-[#111927] hover:bg-gray-800 rounded-lg transition text-sm"
              >
                Politique de confidentialité
              </button>
              <button
                onClick={() => setIsLicensesOpen(true)}
                className="w-full text-left px-4 py-3 bg-[#111927] hover:bg-gray-800 rounded-lg transition text-sm"
              >
                Licences open source
              </button>
            </div>
          </motion.section>
        </div>
      </main>

      {/* Change Password Modal */}
      <AnimatePresence>
        {isChangePasswordOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm"
            onClick={() => setIsChangePasswordOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative w-[90%] max-w-md bg-[#0b1525] rounded-2xl border-2 border-gray-700 p-6"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={() => setIsChangePasswordOpen(false)}
                className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center bg-gray-800 hover:bg-gray-700 rounded-full text-white"
              >
                ✕
              </button>

              <h2 className="text-2xl font-bold mb-4">Changer le mot de passe</h2>

              {passwordSuccess ? (
                <div className="text-center py-6">
                  <div className="text-4xl mb-3">✓</div>
                  <p className="text-green-400 font-semibold">Mot de passe modifié avec succès !</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {passwordError && (
                    <div className="p-3 bg-red-900/30 border border-red-500/50 rounded-lg text-red-400 text-sm">
                      {passwordError}
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-semibold mb-2">Mot de passe actuel</label>
                    <input
                      type="password"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      className="w-full bg-[#111927] border border-gray-700 rounded-lg px-3 py-2 text-sm outline-none focus:border-blue-500 transition"
                      placeholder="••••••••"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold mb-2">Nouveau mot de passe</label>
                    <input
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="w-full bg-[#111927] border border-gray-700 rounded-lg px-3 py-2 text-sm outline-none focus:border-blue-500 transition"
                      placeholder="••••••••"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold mb-2">Confirmer le mot de passe</label>
                    <input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="w-full bg-[#111927] border border-gray-700 rounded-lg px-3 py-2 text-sm outline-none focus:border-blue-500 transition"
                      placeholder="••••••••"
                    />
                  </div>

                  <div className="flex gap-3 pt-4">
                    <button
                      onClick={() => setIsChangePasswordOpen(false)}
                      className="flex-1 px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg font-semibold transition"
                    >
                      Annuler
                    </button>
                    <button
                      onClick={handleChangePassword}
                      className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg font-semibold transition"
                    >
                      Confirmer
                    </button>
                  </div>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Delete Account Modal */}
      <AnimatePresence>
        {isDeleteAccountOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm"
            onClick={() => setIsDeleteAccountOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative w-[90%] max-w-md bg-[#0b1525] rounded-2xl border-2 border-red-700 p-6"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={() => setIsDeleteAccountOpen(false)}
                className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center bg-gray-800 hover:bg-gray-700 rounded-full text-white"
              >
                ✕
              </button>

              <h2 className="text-2xl font-bold mb-2 text-red-400">Supprimer le compte</h2>
              <p className="text-gray-300 text-sm mb-4">
                Cette action est irréversible. Tous vos données seront supprimées.
              </p>

              {deleteError && (
                <div className="p-3 bg-red-900/30 border border-red-500/50 rounded-lg text-red-400 text-sm mb-4">
                  {deleteError}
                </div>
              )}

              <div className="mb-4">
                <label className="block text-sm font-semibold mb-2">
                  Tapez "SUPPRIMER" pour confirmer
                </label>
                <input
                  type="text"
                  value={deleteConfirmation}
                  onChange={(e) => setDeleteConfirmation(e.target.value.toUpperCase())}
                  className="w-full bg-[#111927] border border-gray-700 rounded-lg px-3 py-2 text-sm outline-none focus:border-red-500 transition"
                  placeholder="SUPPRIMER"
                />
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setIsDeleteAccountOpen(false)}
                  className="flex-1 px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg font-semibold transition"
                >
                  Annuler
                </button>
                <button
                  onClick={handleDeleteAccount}
                  disabled={deleteConfirmation !== 'SUPPRIMER'}
                  className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg font-semibold transition"
                >
                  Supprimer
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Terms Modal */}
      <AnimatePresence>
        {isTermsOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm"
            onClick={() => setIsTermsOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative w-[90%] max-w-2xl bg-[#0b1525] rounded-2xl border-2 border-gray-700 p-6"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={() => setIsTermsOpen(false)}
                className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center bg-gray-800 hover:bg-gray-700 rounded-full text-white"
              >
                ✕
              </button>

              <h2 className="text-2xl font-bold mb-4">Conditions d'utilisation</h2>
              <div className="max-h-96 overflow-y-auto text-sm text-gray-300 space-y-3 pr-2">
                <p>
                  <strong>1. Acceptation des conditions</strong><br />
                  En utilisant B3 Desktop, vous acceptez ces conditions d'utilisation dans leur
                  intégralité.
                </p>
                <p>
                  <strong>2. Droits d'utilisation</strong><br />
                  Vous êtes autorisé à utiliser cette application pour votre usage personnel et
                  non commercial.
                </p>
                <p>
                  <strong>3. Responsabilités de l'utilisateur</strong><br />
                  Vous êtes responsable de maintenir la confidentialité de vos identifiants de
                  connexion.
                </p>
                <p>
                  <strong>4. Limitations</strong><br />
                  B3 Desktop n'est pas responsable des pertes de données ou des dommages
                  résultant de l'utilisation de l'application.
                </p>
                <p>
                  <strong>5. Modifications</strong><br />
                  Nous nous réservons le droit de modifier ces conditions à tout moment.
                </p>
              </div>
              <button
                onClick={() => setIsTermsOpen(false)}
                className="mt-6 w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg font-semibold transition"
              >
                Fermer
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Privacy Modal */}
      <AnimatePresence>
        {isPrivacyOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm"
            onClick={() => setIsPrivacyOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative w-[90%] max-w-2xl bg-[#0b1525] rounded-2xl border-2 border-gray-700 p-6"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={() => setIsPrivacyOpen(false)}
                className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center bg-gray-800 hover:bg-gray-700 rounded-full text-white"
              >
                ✕
              </button>

              <h2 className="text-2xl font-bold mb-4">Politique de confidentialité</h2>
              <div className="max-h-96 overflow-y-auto text-sm text-gray-300 space-y-3 pr-2">
                <p>
                  <strong>1. Collecte de données</strong><br />
                  Nous collectons les informations que vous nous fournissez volontairement
                  lors de l'enregistrement.
                </p>
                <p>
                  <strong>2. Utilisation des données</strong><br />
                  Vos données sont utilisées pour améliorer nos services et personnaliser
                  votre expérience.
                </p>
                <p>
                  <strong>3. Protection des données</strong><br />
                  Nous utilisons le chiffrement SSL pour protéger vos informations personnelles.
                </p>
                <p>
                  <strong>4. Partage des données</strong><br />
                  Nous ne partageons jamais vos données personnelles avec des tiers sans consentement.
                </p>
                <p>
                  <strong>5. Vos droits</strong><br />
                  Vous avez le droit d'accéder, de modifier ou de supprimer vos données personnelles.
                </p>
              </div>
              <button
                onClick={() => setIsPrivacyOpen(false)}
                className="mt-6 w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg font-semibold transition"
              >
                Fermer
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Licenses Modal */}
      <AnimatePresence>
        {isLicensesOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm"
            onClick={() => setIsLicensesOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative w-[90%] max-w-2xl bg-[#0b1525] rounded-2xl border-2 border-gray-700 p-6"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={() => setIsLicensesOpen(false)}
                className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center bg-gray-800 hover:bg-gray-700 rounded-full text-white"
              >
                ✕
              </button>

              <h2 className="text-2xl font-bold mb-4">Licences Open Source</h2>
              <div className="max-h-96 overflow-y-auto text-sm text-gray-300 space-y-3 pr-2">
                <p>
                  <strong>React</strong><br />
                  License MIT<br />
                  Copyright (c) Meta Platforms, Inc. and affiliates.
                </p>
                <p>
                  <strong>Framer Motion</strong><br />
                  License MIT<br />
                  Copyright (c) Framer
                </p>
                <p>
                  <strong>TypeScript</strong><br />
                  License Apache License 2.0<br />
                  Copyright Microsoft Corporation
                </p>
                <p>
                  <strong>Tailwind CSS</strong><br />
                  License MIT<br />
                  Copyright (c) Tailwind Labs, Inc.
                </p>
                <p>
                  <strong>Electron</strong><br />
                  License MIT<br />
                  Copyright (c) Electron contributors
                </p>
              </div>
              <button
                onClick={() => setIsLicensesOpen(false)}
                className="mt-6 w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg font-semibold transition"
              >
                Fermer
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};
