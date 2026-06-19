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

export const TopBar: React.FC<TopBarProps> = ({ title }) => {
  const { user } = useAuth();
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifs, setNotifs]       = useState(NOTIFS);

  const unread  = notifs.filter(n => !n.read).length;
  const markRead = (id: number) => setNotifs(p => p.map(n => n.id === id ? { ...n, read: true } : n));

  return (
    <div className="flex h-[52px] shrink-0 items-center justify-between px-6"
      style={{ borderBottom: '1px solid var(--border)', background: 'var(--bg)' }}>

      {/* Title */}
      <h1 className="text-[15px] font-semibold">{title}</h1>

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

        {/* User chip */}
        <div className="flex items-center gap-2 rounded-lg px-2.5 py-1.5"
          style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
          <div className="h-5 w-5 shrink-0 rounded-full" style={{ background: 'var(--violet)' }}>
            <div className="flex h-full w-full items-center justify-center text-[10px] font-bold text-white">
              {user?.username?.charAt(0).toUpperCase()}
            </div>
          </div>
          <span className="text-[13px] font-medium">{user?.username}</span>
        </div>
      </div>
    </div>
  );
};
