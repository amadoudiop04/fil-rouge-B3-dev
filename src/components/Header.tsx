import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Avatar } from './Avatar';
import { motion, AnimatePresence } from 'framer-motion';

interface HeaderProps {
  username: string;
  onNavigate: (page: string) => void;
}

interface Notification {
  id: number;
  type: 'info' | 'success' | 'warning';
  title: string;
  message: string;
  time: string;
  read: boolean;
}

export const Header: React.FC<HeaderProps> = ({ username, onNavigate }) => {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isHelpModalOpen, setIsHelpModalOpen] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const { logout } = useAuth();

  useEffect(() => {
    const storedSound = window.localStorage.getItem('settings-sound');
    if (storedSound) {
      setSoundEnabled(storedSound === 'true');
    }
  }, []);

  const playNotificationSound = () => {
    if (soundEnabled) {
      try {
        const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);

        oscillator.frequency.value = 800;
        oscillator.type = 'sine';

        gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);

        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.5);
      } catch (err) {
        console.error('Error playing notification sound:', err);
      }
    }
  };

  const [notifications, setNotifications] = useState<Notification[]>([
    {
      id: 1,
      type: 'success',
      title: 'Victoire !',
      message: 'Vous avez gagné votre dernier match sur Ascent',
      time: 'Il y a 2h',
      read: false,
    },
    {
      id: 2,
      type: 'info',
      title: 'Nouveau tournoi',
      message: 'Un nouveau tournoi commence demain',
      time: 'Il y a 5h',
      read: false,
    },
    {
      id: 3,
      type: 'warning',
      title: 'Mise à jour',
      message: 'Nouvelle version disponible',
      time: 'Il y a 1j',
      read: true,
    },
  ]);

  const handleSettingsAction = (
    action: 'notifications' | 'settings' | 'profile' | 'help' | 'logout'
  ) => {
    setIsSettingsOpen(false);

    if (action === 'notifications') {
      setIsNotificationsOpen(true);
      return;
    }

    if (action === 'settings') {
      onNavigate('settings');
      return;
    }

    if (action === 'profile') {
      onNavigate('profile');
      return;
    }

    if (action === 'help') {
      setIsHelpModalOpen(true);
      return;
    }

    if (action === 'logout') {
      logout();
      return;
    }
  };

  const markAsRead = (id: number) => {
    const notification = notifications.find((n) => n.id === id);
    if (notification && !notification.read) {
      playNotificationSound();
    }
    setNotifications((prev) =>
      prev.map((notif) => (notif.id === id ? { ...notif, read: true } : notif))
    );
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  const notificationTypeColors = {
    info: 'bg-blue-500',
    success: 'bg-green-500',
    warning: 'bg-orange-500',
  };

  return (
    <>
      <header className="relative z-40 flex items-center justify-between px-4 py-3 bg-[#061325] border-b border-gray-800">
        <div className="flex items-center gap-3">
          <Avatar username={username} size="sm" showBorder={false} />
          <div>
            <p className="text-xs text-gray-400">BIENVENUE</p>
            <p className="font-bold">
              {username} <span className="text-blue-500">#LUG</span>
            </p>
          </div>
        </div>
        <div className="flex gap-3">
          <div className="relative">
            <button
              onClick={() => setIsNotificationsOpen((open) => !open)}
              className="w-9 h-9 bg-[#111927] rounded-lg flex items-center justify-center hover:bg-[#243554] transition relative"
            >
              🔔
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full text-xs flex items-center justify-center font-bold">
                  {unreadCount}
                </span>
              )}
            </button>

            {/* Notifications Panel */}
            <AnimatePresence>
              {isNotificationsOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="absolute right-0 mt-2 w-80 bg-[#111927] border border-gray-700 rounded-lg shadow-lg overflow-hidden z-50"
                >
                  <div className="p-3 border-b border-gray-700 flex items-center justify-between">
                    <h3 className="font-bold text-sm">Notifications</h3>
                    <button
                      onClick={() => setIsNotificationsOpen(false)}
                      className="text-gray-400 hover:text-white"
                    >
                      ✕
                    </button>
                  </div>
                  <div className="max-h-96 overflow-y-auto">
                    {notifications.length === 0 ? (
                      <div className="p-4 text-center text-gray-400 text-sm">
                        Aucune notification
                      </div>
                    ) : (
                      notifications.map((notif) => (
                        <div
                          key={notif.id}
                          onClick={() => markAsRead(notif.id)}
                          className={`p-3 border-b border-gray-800 hover:bg-gray-800 cursor-pointer transition ${
                            !notif.read ? 'bg-gray-800/50' : ''
                          }`}
                        >
                          <div className="flex items-start gap-2">
                            <div
                              className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${notificationTypeColors[notif.type]}`}
                            />
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between gap-2">
                                <h4 className="font-semibold text-sm">{notif.title}</h4>
                                {!notif.read && (
                                  <span className="w-2 h-2 bg-blue-500 rounded-full shrink-0" />
                                )}
                              </div>
                              <p className="text-xs text-gray-400 mt-0.5">{notif.message}</p>
                              <p className="text-xs text-gray-500 mt-1">{notif.time}</p>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className="relative">
            <button
              type="button"
              onClick={() => setIsSettingsOpen((open) => !open)}
              aria-expanded={isSettingsOpen}
              aria-haspopup="menu"
              className="w-9 h-9 bg-[#111927] rounded-lg flex items-center justify-center hover:bg-[#243554] transition"
            >
              ⚙️
            </button>

            {isSettingsOpen && (
              <div
                role="menu"
                className="absolute right-0 mt-2 w-48 bg-[#111927] border border-gray-700 rounded-lg shadow-lg overflow-hidden z-50"
              >
                <button
                  type="button"
                  role="menuitem"
                  onClick={() => handleSettingsAction('notifications')}
                  className="w-full text-left px-4 py-2 text-sm text-gray-200 hover:bg-gray-800 transition"
                >
                  Notifications
                </button>
                <button
                  type="button"
                  role="menuitem"
                  onClick={() => handleSettingsAction('settings')}
                  className="w-full text-left px-4 py-2 text-sm text-gray-200 hover:bg-gray-800 transition"
                >
                  Parametres
                </button>
                <button
                  type="button"
                  role="menuitem"
                  onClick={() => handleSettingsAction('profile')}
                  className="w-full text-left px-4 py-2 text-sm text-gray-200 hover:bg-gray-800 transition"
                >
                  Profil
                </button>
                <button
                  type="button"
                  role="menuitem"
                  onClick={() => handleSettingsAction('help')}
                  className="w-full text-left px-4 py-2 text-sm text-gray-200 hover:bg-gray-800 transition"
                >
                  Aide
                </button>
                <button
                  type="button"
                  role="menuitem"
                  onClick={() => handleSettingsAction('logout')}
                  className="w-full text-left px-4 py-2 text-sm text-red-400 hover:bg-gray-800 transition"
                >
                  Deconnexion
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Help Modal */}
      <AnimatePresence>
        {isHelpModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm"
            onClick={() => setIsHelpModalOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative w-[90%] max-w-2xl bg-[#0b1525] rounded-2xl border-2 border-gray-700 p-6"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={() => setIsHelpModalOpen(false)}
                className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center bg-gray-800 hover:bg-gray-700 rounded-full text-white transition"
              >
                ✕
              </button>

              <h2 className="text-2xl font-bold mb-4">Centre d'aide</h2>

              <div className="space-y-4 max-h-96 overflow-y-auto pr-2">
                <div className="bg-[#111927] rounded-lg p-4 border border-gray-800">
                  <h3 className="font-bold text-lg mb-2 text-blue-400">🎮 Comment jouer ?</h3>
                  <p className="text-sm text-gray-300">
                    Rejoignez des tournois, suivez vos statistiques et progressez dans les
                    classements Valorant.
                  </p>
                </div>

                <div className="bg-[#111927] rounded-lg p-4 border border-gray-800">
                  <h3 className="font-bold text-lg mb-2 text-green-400">📊 Statistiques</h3>
                  <p className="text-sm text-gray-300">
                    Consultez vos performances détaillées dans la page Stats. K/D, win rate,
                    agents favoris et plus encore.
                  </p>
                </div>

                <div className="bg-[#111927] rounded-lg p-4 border border-gray-800">
                  <h3 className="font-bold text-lg mb-2 text-purple-400">🏆 Compétitions</h3>
                  <p className="text-sm text-gray-300">
                    Participez aux tournois disponibles depuis la page d'accueil. Gagnez des
                    récompenses et montez dans le classement.
                  </p>
                </div>

                <div className="bg-[#111927] rounded-lg p-4 border border-gray-800">
                  <h3 className="font-bold text-lg mb-2 text-orange-400">⚙️ Paramètres</h3>
                  <p className="text-sm text-gray-300">
                    Personnalisez votre profil, gérez vos notifications et ajustez vos
                    préférences dans la page Profil.
                  </p>
                </div>

                <div className="bg-[#111927] rounded-lg p-4 border border-gray-800">
                  <h3 className="font-bold text-lg mb-2 text-red-400">💬 Support</h3>
                  <p className="text-sm text-gray-300">
                    Besoin d'aide supplémentaire ? Contactez notre équipe support à{' '}
                    <span className="text-blue-400">support@b3esport.com</span>
                  </p>
                </div>
              </div>

              <div className="mt-6 flex justify-end">
                <button
                  onClick={() => setIsHelpModalOpen(false)}
                  className="px-6 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg font-semibold transition"
                >
                  Compris !
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};
