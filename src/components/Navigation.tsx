import React from 'react';
import { motion } from 'framer-motion';

interface NavigationProps {
  currentPage: string;
  onPageChange: (page: string) => void;
  cartCount?: number;
}

const sp = { type: 'spring' as const, stiffness: 420, damping: 30 };

const IconHome = ({ filled }: { filled: boolean }) => filled
  ? <svg viewBox="0 0 24 24" fill="currentColor" className="h-6 w-6"><path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/></svg>
  : <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinejoin="round" className="h-6 w-6"><path d="M3 12L12 3l9 9M4 10.5V20a1 1 0 001 1h5v-5h4v5h5a1 1 0 001-1v-9.5"/></svg>;

const IconStats = ({ filled }: { filled: boolean }) => filled
  ? <svg viewBox="0 0 24 24" fill="currentColor" className="h-6 w-6"><path d="M5 3a2 2 0 00-2 2v14a2 2 0 002 2h3V3H5zm11 0v18h3a2 2 0 002-2V5a2 2 0 00-2-2h-3zm-6 6h4v12H10V9z"/></svg>
  : <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" className="h-6 w-6"><path d="M18 20V10M12 20V4M6 20v-6"/></svg>;

const IconTrophy = ({ filled }: { filled: boolean }) => filled
  ? <svg viewBox="0 0 24 24" fill="currentColor" className="h-6 w-6"><path d="M7 4H4v6c0 3.3 2.5 6 5.5 6.5V19H7v2h10v-2h-2.5v-2.5c3-.5 5.5-3.2 5.5-6.5V4h-3V2H7v2zm0 2h10v4a5 5 0 01-10 0V6zM4 6h1v4a7.06 7.06 0 001.5 4.3A4.5 4.5 0 014 10V6zm14 0h1v4a4.5 4.5 0 01-2.5 4.03A7.06 7.06 0 0018 10V6zM9 21v-2h6v2H9z"/></svg>
  : <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6"><path d="M8 21h8M12 17v4M7 4H4v6c0 3.3 2.5 6 5.5 6.5M17 4h3v6c0 3.3-2.5 6-5.5 6.5M7 4h10v6a5 5 0 01-10 0V4z"/></svg>;

const IconShop = ({ filled }: { filled: boolean }) => filled
  ? <svg viewBox="0 0 24 24" fill="currentColor" className="h-6 w-6"><path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4H6zM3.01 6H21v.01H3.01V6zm7 4.5a3.5 3.5 0 007 0h1a4.5 4.5 0 01-9 0h1z"/></svg>
  : <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6"><path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4zM3 6h18M16 10a4 4 0 01-8 0"/></svg>;

const IconProfile = ({ filled }: { filled: boolean }) => filled
  ? <svg viewBox="0 0 24 24" fill="currentColor" className="h-6 w-6"><path d="M12 2a5 5 0 110 10A5 5 0 0112 2zm0 12c5.33 0 8 2.67 8 4v2H4v-2c0-1.33 2.67-4 8-4z"/></svg>
  : <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>;

const TABS = [
  { id: 'home',        label: 'Accueil',  Icon: IconHome    },
  { id: 'stats',       label: 'Stats',    Icon: IconStats   },
  { id: 'tournaments', label: 'Tournois', Icon: IconTrophy  },
  { id: 'shop',        label: 'Shop',     Icon: IconShop    },
  { id: 'profile',     label: 'Profil',   Icon: IconProfile },
] as const;

export const Navigation: React.FC<NavigationProps> = ({ currentPage, onPageChange, cartCount = 0 }) => (
  <nav
    className="fixed bottom-0 left-0 right-0 z-50 flex items-end justify-around px-1"
    style={{
      background: 'rgba(9,9,11,0.96)',
      backdropFilter: 'blur(24px)',
      WebkitBackdropFilter: 'blur(24px)',
      borderTop: '1px solid rgba(255,255,255,0.07)',
      paddingBottom: 'env(safe-area-inset-bottom, 12px)',
      paddingTop: '8px',
    }}
  >
    {TABS.map(({ id, label, Icon }) => {
      const active = currentPage === id || (id === 'shop' && currentPage === 'panier');
      const isShop = id === 'shop';
      return (
        <motion.button
          key={id}
          onClick={() => onPageChange(id)}
          whileTap={{ scale: 0.84 }}
          transition={sp}
          className="relative flex flex-col items-center gap-0.5 px-3 py-1"
          style={{ minWidth: 52 }}
        >
          <motion.div
            animate={{ color: active ? 'var(--violet2)' : 'var(--text3)' }}
            transition={{ duration: 0.2 }}
            className="relative"
          >
            <Icon filled={active} />
            {isShop && cartCount > 0 && (
              <span className="absolute -right-1.5 -top-1.5 flex h-4 w-4 min-w-[16px] items-center justify-center rounded-full text-[9px] font-bold text-white"
                style={{ background: 'var(--red)' }}>
                {cartCount > 9 ? '9+' : cartCount}
              </span>
            )}
          </motion.div>
          <motion.span
            animate={{ color: active ? 'var(--violet2)' : 'var(--text3)' }}
            transition={{ duration: 0.2 }}
            className="text-[10px] font-medium"
          >
            {label}
          </motion.span>
          {active && (
            <motion.div
              layoutId="navPill"
              className="absolute -top-1 left-1/2 h-0.5 w-8 -translate-x-1/2 rounded-full"
              style={{ background: 'var(--violet2)' }}
              transition={sp}
            />
          )}
        </motion.button>
      );
    })}
  </nav>
);
