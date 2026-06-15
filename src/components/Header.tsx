import React, { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Avatar } from './Avatar';
import { useAuth } from '../contexts/AuthContext';

interface HeaderProps {
  username: string;
  onNavigate: (page: string) => void;
}

const spring = { type: 'spring' as const, stiffness: 340, damping: 28 };

const BellIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
    <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/>
    <path d="M13.73 21a2 2 0 01-3.46 0"/>
  </svg>
);

const NOTIFS = [
  { id: 1, type: 'win' as const,  title: 'Victoire !',       body: 'Vous avez gagné sur Ascent · +20 RR', time: '2h',  read: false },
  { id: 2, type: 'info' as const, title: 'Nouveau tournoi',  body: 'VCT Opens inscriptions ouvertes',        time: '5h',  read: false },
  { id: 3, type: 'warn' as const, title: 'Mise à jour',      body: 'Version 8.11 disponible',               time: '1j',  read: true  },
];

const typeColor = { win: '#22c55e', info: '#60a5fa', warn: '#f59e0b' };

export const Header: React.FC<HeaderProps> = ({ username, onNavigate }) => {
  const { logout } = useAuth();
  const [notifOpen, setNotifOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [notifs, setNotifs] = useState(NOTIFS);

  const unread = notifs.filter(n => !n.read).length;
  const read = (id: number) => setNotifs(p => p.map(n => n.id === id ? { ...n, read: true } : n));

  return (
    <header className="relative z-40 flex items-center justify-between px-4 py-3 border-b border-white/[0.05] bg-[#06060f]/70 backdrop-blur-md">

      {/* Left: avatar + name */}
      <button
        type="button"
        onClick={() => onNavigate('profile')}
        className="flex items-center gap-3 active:opacity-70 transition"
      >
        <Avatar username={username} size="sm" showBorder />
        <div className="leading-none">
          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-white/30">Bienvenue</p>
          <p className="text-sm font-extrabold text-white">{username}</p>
        </div>
      </button>

      {/* Right: bell + menu */}
      <div className="flex items-center gap-2">

        {/* Notification bell */}
        <div className="relative">
          <motion.button
            whileTap={{ scale: 0.88 }}
            transition={spring}
            onClick={() => { setNotifOpen(o => !o); setMenuOpen(false); }}
            className="relative flex h-9 w-9 items-center justify-center rounded-xl bg-white/[0.04] text-white/60 hover:bg-white/[0.08] hover:text-white transition"
          >
            <BellIcon />
            {unread > 0 && (
              <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-[#FF4654] text-[9px] font-black">
                {unread}
              </span>
            )}
          </motion.button>

          <AnimatePresence>
            {notifOpen && (
              <motion.div
                initial={{ opacity: 0, y: -8, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -8, scale: 0.95 }}
                transition={spring}
                className="absolute right-0 mt-2 w-[300px] overflow-hidden rounded-2xl border border-white/[0.07] bg-[#0c0c18] shadow-2xl shadow-black/60"
              >
                <div className="flex items-center justify-between border-b border-white/[0.05] px-4 py-3">
                  <p className="text-[11px] font-extrabold uppercase tracking-[0.15em]">Notifications</p>
                  <button onClick={() => setNotifOpen(false)} className="text-white/30 hover:text-white transition text-xs">✕</button>
                </div>
                {notifs.map(n => (
                  <button
                    key={n.id}
                    type="button"
                    onClick={() => read(n.id)}
                    className={`flex w-full items-start gap-3 px-4 py-3 text-left transition hover:bg-white/[0.03] border-b border-white/[0.04] last:border-0 ${!n.read ? 'bg-white/[0.02]' : ''}`}
                  >
                    <span className="mt-1 h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: typeColor[n.type] }} />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold">{n.title}</p>
                      <p className="text-[11px] text-white/40 mt-0.5 truncate">{n.body}</p>
                    </div>
                    <p className="shrink-0 text-[10px] text-white/25 mt-0.5">{n.time}</p>
                    {!n.read && <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[#FF4654]" />}
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Settings menu */}
        <div className="relative">
          <motion.button
            whileTap={{ scale: 0.88 }}
            transition={spring}
            onClick={() => { setMenuOpen(o => !o); setNotifOpen(false); }}
            className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/[0.04] text-white/60 hover:bg-white/[0.08] hover:text-white transition"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" className="h-5 w-5">
              <circle cx="12" cy="12" r="3"/>
              <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"/>
            </svg>
          </motion.button>

          <AnimatePresence>
            {menuOpen && (
              <motion.div
                initial={{ opacity: 0, y: -8, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -8, scale: 0.95 }}
                transition={spring}
                className="absolute right-0 mt-2 w-44 overflow-hidden rounded-2xl border border-white/[0.07] bg-[#0c0c18] shadow-2xl shadow-black/60"
              >
                {[
                  { label: 'Profil',      action: () => { onNavigate('profile'); setMenuOpen(false); } },
                  { label: 'Paramètres', action: () => { onNavigate('settings'); setMenuOpen(false); } },
                ].map(item => (
                  <button
                    key={item.label}
                    type="button"
                    onClick={item.action}
                    className="w-full px-4 py-2.5 text-left text-sm text-white/80 hover:bg-white/[0.05] hover:text-white transition"
                  >
                    {item.label}
                  </button>
                ))}
                <div className="border-t border-white/[0.05]" />
                <button
                  type="button"
                  onClick={() => { logout(); setMenuOpen(false); }}
                  className="w-full px-4 py-2.5 text-left text-sm font-bold text-[#FF4654] hover:bg-[#FF4654]/10 transition"
                >
                  Déconnexion
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

      </div>
    </header>
  );
};
