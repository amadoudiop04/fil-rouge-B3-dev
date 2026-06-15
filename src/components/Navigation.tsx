import React from 'react';
import { motion } from 'framer-motion';

interface NavigationProps {
  currentPage: string;
  onPageChange: (page: string) => void;
}

const spring = { type: 'spring' as const, stiffness: 380, damping: 30 };

const HomeIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
    <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/>
    <polyline points="9 22 9 12 15 12 15 22"/>
  </svg>
);
const StatsIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
    <line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/>
    <line x1="6" y1="20" x2="6" y2="14"/>
  </svg>
);
const TrophyIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
    <path d="M6 9H4.5a2.5 2.5 0 010-5H6"/>
    <path d="M18 9h1.5a2.5 2.5 0 000-5H18"/>
    <path d="M4 22h16M12 17v5M8 17h8"/>
    <path d="M6 2h12v9a6 6 0 01-12 0z"/>
  </svg>
);
const ShopIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
    <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/>
    <line x1="3" y1="6" x2="21" y2="6"/>
    <path d="M16 10a4 4 0 01-8 0"/>
  </svg>
);
const PersonIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
    <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/>
    <circle cx="12" cy="7" r="4"/>
  </svg>
);

const ITEMS = [
  { id: 'home',        label: 'Accueil',  Icon: HomeIcon   },
  { id: 'stats',       label: 'Stats',    Icon: StatsIcon  },
  { id: 'tournaments', label: 'Tournois', Icon: TrophyIcon },
  { id: 'shop',        label: 'Shop',     Icon: ShopIcon   },
  { id: 'profile',     label: 'Profil',   Icon: PersonIcon },
];

export const Navigation: React.FC<NavigationProps> = ({ currentPage, onPageChange }) => (
  <nav className="fixed bottom-0 left-0 right-0 z-50">
    {/* blur backdrop */}
    <div className="absolute inset-0 bg-[#06060f]/80 backdrop-blur-xl border-t border-white/[0.05]" />
    <div className="relative flex items-end justify-around px-1 py-2 max-w-md mx-auto">
      {ITEMS.map(({ id, label, Icon }) => {
        const active = currentPage === id;
        return (
          <motion.button
            key={id}
            onClick={() => onPageChange(id)}
            whileTap={{ scale: 0.88 }}
            transition={spring}
            className="relative flex flex-col items-center gap-1 px-3 py-1.5 min-w-[52px]"
          >
            {/* glow blob behind active */}
            {active && (
              <motion.div
                layoutId="nav-glow"
                className="absolute inset-0 rounded-xl bg-[#FF4654]/10"
                transition={spring}
              />
            )}

            <motion.div
              animate={{ color: active ? '#FF4654' : 'rgba(255,255,255,0.35)' }}
              transition={{ duration: 0.2 }}
              className="relative"
            >
              <Icon />
            </motion.div>

            <motion.span
              animate={{
                color: active ? '#ffffff' : 'rgba(255,255,255,0.3)',
                fontWeight: active ? 700 : 500,
              }}
              transition={{ duration: 0.15 }}
              className="relative text-[10px] uppercase tracking-[0.1em]"
            >
              {label}
            </motion.span>

            {/* active dot */}
            {active && (
              <motion.div
                layoutId="nav-dot"
                className="absolute -bottom-0.5 h-0.5 w-4 rounded-full bg-[#FF4654]"
                transition={spring}
              />
            )}
          </motion.button>
        );
      })}
    </div>
  </nav>
);
