import React, { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Avatar } from './Avatar';
import { useAuth } from '../contexts/AuthContext';

interface HeaderProps {
  username: string;
  onNavigate: (page: string) => void;
  cartCount?: number;
}

const sp = { type: 'spring' as const, stiffness: 400, damping: 30 };

const NOTIFS = [
  { id: 1, color: 'var(--green)', title: 'Victoire !',      body: 'Gagné sur Ascent · +20 RR',   time: '2h',  read: false },
  { id: 2, color: 'var(--blue)',  title: 'Nouveau tournoi', body: 'VCT Opens — inscriptions',    time: '5h',  read: false },
  { id: 3, color: 'var(--amber)', title: 'Mise à jour',     body: 'Version 8.11 disponible',     time: '1j',  read: true  },
];

export const Header: React.FC<HeaderProps> = ({ username, onNavigate }) => {
  const { logout } = useAuth();
  const [notifOpen, setNotifOpen] = useState(false);
  const [menuOpen, setMenuOpen]   = useState(false);
  const [notifs, setNotifs]       = useState(NOTIFS);

  const unread = notifs.filter(n => !n.read).length;
  const markRead = (id: number) => setNotifs(p => p.map(n => n.id === id ? { ...n, read: true } : n));
  const close = () => { setNotifOpen(false); setMenuOpen(false); };

  return (
    <header
      className="relative z-40 flex h-12 items-center justify-between px-4"
      style={{
        background: 'rgba(9,9,11,0.95)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderBottom: '1px solid var(--border)',
      }}
    >
      {/* Logo */}
      <button
        type="button"
        onClick={() => { close(); onNavigate('home'); }}
        className="flex items-center gap-2.5 active:opacity-70 transition-opacity"
      >
        <div className="flex h-7 w-7 items-center justify-center rounded-lg" style={{ background: 'var(--violet)' }}>
          <svg viewBox="0 0 32 32" fill="none" className="h-4 w-4 text-white">
            <path d="M16 3L4 9v14l12 6 12-6V9L16 3z" stroke="currentColor" strokeWidth={2.5} strokeLinejoin="round"/>
            <path d="M4 9l12 6 12-6M16 15v12" stroke="currentColor" strokeWidth={2.5} strokeLinejoin="round"/>
          </svg>
        </div>
        <span className="text-[15px] font-bold tracking-tight">B3 Esport</span>
      </button>

      {/* Right controls */}
      <div className="flex items-center gap-0.5">

        {/* Bell */}
        <div className="relative">
          <motion.button
            whileTap={{ scale: 0.86 }} transition={sp}
            onClick={() => { setNotifOpen(o => !o); setMenuOpen(false); }}
            className="relative flex h-8 w-8 items-center justify-center rounded-xl transition hover:bg-white/8"
            style={{ color: 'var(--text2)' }}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" className="h-5 w-5">
              <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/>
              <path d="M13.73 21a2 2 0 01-3.46 0"/>
            </svg>
            {unread > 0 && (
              <span className="absolute right-1 top-1 flex h-2 w-2 items-center justify-center rounded-full" style={{ background: 'var(--red)' }}>
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full opacity-75" style={{ background: 'var(--red)' }} />
              </span>
            )}
          </motion.button>

          <AnimatePresence>
            {notifOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setNotifOpen(false)} />
                <motion.div
                  initial={{ opacity: 0, y: -8, scale: 0.96 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -8, scale: 0.96 }}
                  transition={sp}
                  className="absolute right-0 top-11 z-50 w-72 overflow-hidden rounded-2xl shadow-2xl shadow-black/70"
                  style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
                >
                  <div className="flex items-center justify-between px-4 py-3" style={{ borderBottom: '1px solid var(--border)' }}>
                    <span className="text-[13px] font-semibold" style={{ color: 'var(--text2)' }}>Notifications</span>
                    {unread > 0 && (
                      <span className="rounded-full px-2 py-0.5 text-[10px] font-bold text-white" style={{ background: 'var(--red)' }}>{unread}</span>
                    )}
                  </div>
                  {notifs.map((n, i) => (
                    <button key={n.id} type="button" onClick={() => markRead(n.id)}
                      className="flex w-full items-start gap-3 px-4 py-3 text-left transition hover:bg-white/5"
                      style={{ borderTop: i > 0 ? '1px solid var(--border)' : undefined }}
                    >
                      <div className="mt-1.5 h-2 w-2 shrink-0 rounded-full" style={{ background: n.color }} />
                      <div className="flex-1 min-w-0">
                        <p className="text-[13px] font-medium" style={{ color: n.read ? 'var(--text2)' : 'var(--text1)' }}>{n.title}</p>
                        <p className="text-[12px] mt-0.5 truncate" style={{ color: 'var(--text3)' }}>{n.body}</p>
                      </div>
                      <span className="shrink-0 text-[11px] mt-0.5" style={{ color: 'var(--text3)' }}>{n.time}</span>
                    </button>
                  ))}
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>

        {/* Avatar / menu */}
        <div className="relative">
          <motion.button
            whileTap={{ scale: 0.88 }} transition={sp}
            onClick={() => { setMenuOpen(o => !o); setNotifOpen(false); }}
            className="ml-1 rounded-full overflow-hidden"
          >
            <Avatar username={username} size="sm" showBorder={false} />
          </motion.button>

          <AnimatePresence>
            {menuOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setMenuOpen(false)} />
                <motion.div
                  initial={{ opacity: 0, y: -8, scale: 0.96 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -8, scale: 0.96 }}
                  transition={sp}
                  className="absolute right-0 top-11 z-50 w-44 overflow-hidden rounded-2xl shadow-2xl shadow-black/70"
                  style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
                >
                  <div className="px-4 py-2.5" style={{ borderBottom: '1px solid var(--border)' }}>
                    <p className="text-[13px] font-semibold truncate">{username}</p>
                  </div>
                  {[
                    { label: 'Profil',      fn: () => { onNavigate('profile');  close(); } },
                    { label: 'Paramètres', fn: () => { onNavigate('settings'); close(); } },
                  ].map((item, i) => (
                    <button key={item.label} type="button" onClick={item.fn}
                      className="flex w-full items-center px-4 py-3 text-left text-[14px] transition hover:bg-white/5"
                      style={{ borderTop: i > 0 ? '1px solid var(--border)' : undefined }}
                    >
                      {item.label}
                    </button>
                  ))}
                  <button type="button" onClick={() => { logout(); close(); }}
                    className="flex w-full items-center px-4 py-3 text-left text-[14px] font-medium transition hover:bg-white/5"
                    style={{ borderTop: '1px solid var(--border)', color: 'var(--red)' }}
                  >
                    Déconnexion
                  </button>
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>

      </div>
    </header>
  );
};
