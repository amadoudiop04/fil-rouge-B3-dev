import React, { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';

interface TopBarProps {
  title: string;
  onNavigate: (page: string) => void;
}

const sp = { type: 'spring' as const, stiffness: 400, damping: 30 };

const NOTIFS = [
  { id: 1, color: 'var(--green)', title: 'Victoire !',      body: 'Gagné sur Ascent · +20 RR',  time: '2h',  read: false },
  { id: 2, color: 'var(--blue)',  title: 'Nouveau tournoi', body: 'VCT Opens — inscriptions',    time: '5h',  read: false },
  { id: 3, color: 'var(--amber)', title: 'Mise à jour',     body: 'Version 8.11 disponible',     time: '1j',  read: true  },
];

export const TopBar: React.FC<TopBarProps> = ({ title, onNavigate }) => {
  const { user } = useAuth();
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifs, setNotifs]       = useState(NOTIFS);

  const unread  = notifs.filter(n => !n.read).length;
  const markRead = (id: number) => setNotifs(p => p.map(n => n.id === id ? { ...n, read: true } : n));

  return (
    <div className="flex h-[56px] shrink-0 items-center justify-between px-6 backdrop-blur"
      style={{ borderBottom: '1px solid var(--border)', background: 'rgba(8,23,47,0.72)' }}>

      {/* Title with accent bar */}
      <div className="flex items-center gap-3">
        <span className="h-5 w-1 rounded-full" style={{ background: 'var(--accent2)', boxShadow: '0 0 10px var(--accent2)' }} />
        <h1 className="font-display text-[17px] font-bold tracking-wide uppercase">{title}</h1>
      </div>

      {/* Center: command/search pill */}
      <button
        onClick={() => onNavigate('players')}
        className="hidden md:flex items-center gap-2.5 rounded-xl px-3.5 py-1.5 w-[300px] transition"
        style={{ background: 'rgba(8,22,46,0.6)', border: '1px solid var(--border)' }}>
        <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth={1.7}
          className="h-4 w-4" style={{ color: 'var(--text3)' }}>
          <circle cx="9" cy="9" r="6" /><path d="m14 14 3 3" strokeLinecap="round" />
        </svg>
        <span className="flex-1 text-left text-[12.5px]" style={{ color: 'var(--text3)' }}>
          Rechercher un joueur, un agent…
        </span>
        <kbd className="rounded px-1.5 py-0.5 text-[10px] font-mono font-medium"
          style={{ background: 'var(--raised)', color: 'var(--text2)', border: '1px solid var(--border)' }}>⌘K</kbd>
      </button>

      {/* Right controls */}
      <div className="flex items-center gap-2">

        {/* Bell */}
        <div className="relative">
          <motion.button whileTap={{ scale: 0.88 }} transition={sp}
            onClick={() => setNotifOpen(o => !o)}
            className="relative flex h-8 w-8 items-center justify-center rounded-lg transition hover:bg-white/8"
            style={{ color: 'var(--text2)' }}>
            <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" className="h-4.5 w-4.5 h-[18px] w-[18px]">
              <path d="M15 7A5 5 0 005 7c0 5.833-2.5 7.5-2.5 7.5h15S15 12.833 15 7zM11.44 17.5a1.666 1.666 0 01-2.88 0"/>
            </svg>
            {unread > 0 && (
              <span className="absolute right-1 top-1 h-2 w-2 rounded-full" style={{ background: 'var(--red)' }}>
                <span className="absolute h-full w-full animate-ping rounded-full opacity-60" style={{ background: 'var(--red)' }} />
              </span>
            )}
          </motion.button>

          <AnimatePresence>
            {notifOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setNotifOpen(false)} />
                <motion.div
                  initial={{ opacity: 0, y: -6, scale: 0.97 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -6, scale: 0.97 }}
                  transition={sp}
                  className="absolute right-0 top-10 z-50 w-72 overflow-hidden rounded-xl shadow-2xl shadow-black/60"
                  style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
                  <div className="flex items-center justify-between px-4 py-2.5"
                    style={{ borderBottom: '1px solid var(--border)' }}>
                    <span className="text-[12px] font-semibold" style={{ color: 'var(--text2)' }}>Notifications</span>
                    {unread > 0 && (
                      <span className="rounded-full px-2 py-0.5 text-[10px] font-bold text-white" style={{ background: 'var(--red)' }}>{unread}</span>
                    )}
                  </div>
                  {notifs.map((n, i) => (
                    <button key={n.id} type="button" onClick={() => markRead(n.id)}
                      className="flex w-full items-start gap-3 px-4 py-3 text-left transition hover:bg-white/5"
                      style={{ borderTop: i > 0 ? '1px solid var(--border)' : undefined }}>
                      <div className="mt-1.5 h-2 w-2 shrink-0 rounded-full" style={{ background: n.color }} />
                      <div className="flex-1 min-w-0">
                        <p className="text-[13px] font-medium" style={{ color: n.read ? 'var(--text2)' : 'var(--text1)' }}>{n.title}</p>
                        <p className="text-[11px] truncate mt-0.5" style={{ color: 'var(--text3)' }}>{n.body}</p>
                      </div>
                      <span className="shrink-0 text-[11px] mt-0.5" style={{ color: 'var(--text3)' }}>{n.time}</span>
                    </button>
                  ))}
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>

        {/* Admin quick-access */}
        {user?.isAdmin && (
          <motion.button whileTap={{ scale: 0.95 }} transition={sp}
            onClick={() => onNavigate('admin')}
            className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[12px] font-semibold transition"
            style={{ background: 'rgba(70,194,255,0.12)', color: 'var(--accent2)', border: '1px solid rgba(70,194,255,0.25)' }}>
            <svg viewBox="0 0 16 16" fill="currentColor" className="h-3.5 w-3.5">
              <path d="M8 1l5.5 2.2v3.3c0 3.4-2.3 6.6-5.5 7.5-3.2-.9-5.5-4.1-5.5-7.5V3.2L8 1z"/>
            </svg>
            Admin
          </motion.button>
        )}

        {/* User chip */}
        <button onClick={() => onNavigate('profile')}
          className="flex items-center gap-2 rounded-lg px-2.5 py-1.5 transition hover:border-[var(--border2)]"
          style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
          <div className="h-5 w-5 shrink-0 rounded-full" style={{ background: 'linear-gradient(150deg, var(--accent2), var(--accent))' }}>
            <div className="flex h-full w-full items-center justify-center text-[10px] font-bold text-white">
              {user?.username?.charAt(0).toUpperCase()}
            </div>
          </div>
          <span className="text-[13px] font-medium">{user?.username}</span>
        </button>
      </div>
    </div>
  );
};
