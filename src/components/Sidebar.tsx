import React from 'react';
import { motion } from 'framer-motion';
import { Avatar } from './Avatar';
import { User } from '../contexts/AuthContext';

interface SidebarProps {
  currentPage: string;
  onPageChange: (page: string) => void;
  user: User;
  onLogout: () => void;
  cartCount?: number;
}

const sp = { type: 'spring' as const, stiffness: 400, damping: 30 };

const Logo = () => (
  <svg viewBox="0 0 32 32" fill="none" className="h-5 w-5 text-white">
    <path d="M16 3L4 9v14l12 6 12-6V9L16 3z" stroke="currentColor" strokeWidth={2} strokeLinejoin="round"/>
    <path d="M4 9l12 6 12-6M16 15v12" stroke="currentColor" strokeWidth={2} strokeLinejoin="round"/>
  </svg>
);

const IconHome = ({ active }: { active: boolean }) => active
  ? <svg viewBox="0 0 20 20" fill="currentColor" className="h-[18px] w-[18px]"><path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z"/></svg>
  : <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth={1.6} className="h-[18px] w-[18px]"><path d="M3 12l2-2m0 0l5-5 5 5M5 10v7a1 1 0 001 1h3m6-8v7a1 1 0 01-1 1h-3m0 0v-4a1 1 0 00-1-1H9a1 1 0 00-1 1v4m4 0H9" strokeLinecap="round" strokeLinejoin="round"/></svg>;

const IconStats = ({ active }: { active: boolean }) => active
  ? <svg viewBox="0 0 20 20" fill="currentColor" className="h-[18px] w-[18px]"><path d="M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zM8 7a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zM14 4a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z"/></svg>
  : <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth={1.6} className="h-[18px] w-[18px]"><path d="M9 19V6m0 0l-3 3m3-3l3 3M3 19V10m0 0l-3 3m3-3l3 3" strokeLinecap="round" strokeLinejoin="round"/><path d="M3 19v-9m6 9V6m6 13v-3" strokeLinecap="round"/></svg>;

const IconTrophy = ({ active }: { active: boolean }) => active
  ? <svg viewBox="0 0 20 20" fill="currentColor" className="h-[18px] w-[18px]"><path fillRule="evenodd" d="M10 1a1 1 0 01.894.553l2 4a1 1 0 01-.088 1.002l-1.5 2a1 1 0 01-.812.414H9.5a1 1 0 01-.812-.414l-1.5-2a1 1 0 01-.088-1.002l2-4A1 1 0 0110 1zm0 2.236L8.618 6h2.764L10 3.236zM5 7H3a1 1 0 00-1 1v1a5 5 0 003.1 4.599l.9.36V15H5a1 1 0 000 2h10a1 1 0 000-2h-1v-1.041l.9-.36A5 5 0 0018 9V8a1 1 0 00-1-1h-2a1 1 0 100 2h1v.17a3 3 0 01-1.86 2.76L13 12.5V15h-2v-3h-2v3H7v-2.5l-1.14-.57A3 3 0 014 9.17V9h1a1 1 0 100-2z"/></svg>
  : <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" className="h-[18px] w-[18px]"><path d="M6 3H4v4a4 4 0 004 4h4a4 4 0 004-4V3h-2M6 3h8M10 11v4m-3 2h6"/></svg>;

const IconShop = ({ active }: { active: boolean }) => active
  ? <svg viewBox="0 0 20 20" fill="currentColor" className="h-[18px] w-[18px]"><path d="M3 1a1 1 0 000 2h1.22l.305 1.222a.997.997 0 00.01.042l1.358 5.43-.893.892C3.74 11.846 4.632 14 6.414 14H15a1 1 0 000-2H6.414l1-1H14a1 1 0 00.894-.553l3-6A1 1 0 0017 3H6.28l-.31-1.243A1 1 0 005 1H3zM16 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zM6.5 18a1.5 1.5 0 100-3 1.5 1.5 0 000 3z"/></svg>
  : <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" className="h-[18px] w-[18px]"><path d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"/></svg>;

const IconProfile = ({ active }: { active: boolean }) => active
  ? <svg viewBox="0 0 20 20" fill="currentColor" className="h-[18px] w-[18px]"><path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z"/></svg>
  : <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" className="h-[18px] w-[18px]"><path d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/></svg>;

const IconSettings = () => (
  <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" className="h-[18px] w-[18px]">
    <circle cx="10" cy="10" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"/>
  </svg>
);

const IconPlayers = ({ active }: { active: boolean }) => active
  ? <svg viewBox="0 0 20 20" fill="currentColor" className="h-[18px] w-[18px]"><path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z"/></svg>
  : <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" className="h-[18px] w-[18px]"><path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM2 8a2 2 0 104 0M14 15a4 4 0 00-8 0v3h8v-3zM16.75 12A3 3 0 0119 15v3h-3M4 15v3H1v-3a3 3 0 012.75-2.993"/></svg>;

const IconCreate = ({ active }: { active: boolean }) => active
  ? <svg viewBox="0 0 20 20" fill="currentColor" className="h-[18px] w-[18px]"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z"/></svg>
  : <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" className="h-[18px] w-[18px]"><circle cx="10" cy="10" r="8"/><path d="M10 7v6M7 10h6"/></svg>;

const IconCrosshair = ({ active }: { active: boolean }) => active
  ? <svg viewBox="0 0 20 20" fill="currentColor" className="h-[18px] w-[18px]"><path fillRule="evenodd" d="M10 2a8 8 0 100 16A8 8 0 0010 2zm0 1.5a6.5 6.5 0 110 13 6.5 6.5 0 010-13zm0 3a3.5 3.5 0 100 7 3.5 3.5 0 000-7zm0 1.5a2 2 0 110 4 2 2 0 010-4z"/></svg>
  : <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" className="h-[18px] w-[18px]"><circle cx="10" cy="10" r="8"/><circle cx="10" cy="10" r="3"/><path d="M10 2v3M10 15v3M2 10h3M15 10h3"/></svg>;

const IconPatch = ({ active }: { active: boolean }) => active
  ? <svg viewBox="0 0 20 20" fill="currentColor" className="h-[18px] w-[18px]"><path fillRule="evenodd" d="M6 2a2 2 0 00-2 2v12a2 2 0 002 2h8a2 2 0 002-2V7.414A2 2 0 0015.414 6L12 2.586A2 2 0 0010.586 2H6zm0 2h4v3a1 1 0 001 1h3v8H6V4zm6 0l2.5 2.5H12V4zM8 9a1 1 0 000 2h4a1 1 0 000-2H8zm0 3a1 1 0 000 2h2a1 1 0 000-2H8z"/></svg>
  : <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" className="h-[18px] w-[18px]"><path d="M6 2h5.586L16 6.414V17a1 1 0 01-1 1H6a1 1 0 01-1-1V3a1 1 0 011-1z"/><path d="M11 2v5h5M8 9h4M8 12h2"/></svg>;

const IconAdmin = ({ active }: { active: boolean }) => active
  ? <svg viewBox="0 0 20 20" fill="currentColor" className="h-[18px] w-[18px]"><path fillRule="evenodd" d="M9.661 2.237a.531.531 0 01.678 0 11.947 11.947 0 007.078 2.749.5.5 0 01.479.425c.069.52.104 1.05.104 1.59 0 5.162-3.26 9.563-7.834 11.256a.48.48 0 01-.332 0C5.26 16.564 2 12.163 2 7c0-.538.035-1.069.104-1.589a.5.5 0 01.48-.425 11.947 11.947 0 007.077-2.75zm4.196 5.954a.75.75 0 00-1.214-.882l-3.236 4.53-1.55-1.55a.75.75 0 00-1.06 1.061l2.171 2.172a.75.75 0 001.137-.089l3.752-5.252z"/></svg>
  : <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" className="h-[18px] w-[18px]"><path d="M10 2.5c-2 1.6-4.2 2.4-6.5 2.5C3.3 5.7 3.3 6.3 3.3 7c0 4.6 2.8 8.4 6.7 9.8 3.9-1.4 6.7-5.2 6.7-9.8 0-.7 0-1.3-.2-2-2.3-.1-4.5-.9-6.5-2.5z"/><path d="M7.5 9.5l1.8 1.8 3-3.5"/></svg>;

interface NavGroup {
  label: string;
  items: ReadonlyArray<{ id: string; label: string; Icon: React.FC<{ active: boolean }> }>;
  adminOnly?: boolean;
}

const NAV_GROUPS: NavGroup[] = [
  {
    label: 'Jouer',
    items: [
      { id: 'home',       label: 'Accueil',        Icon: IconHome      },
      { id: 'stats',      label: 'Mes stats',      Icon: IconStats     },
      { id: 'agentStats', label: 'Agents & méta', Icon: IconCrosshair },
      { id: 'players',    label: 'Joueurs',        Icon: IconPlayers   },
    ],
  },
  {
    label: 'Compétition',
    items: [
      { id: 'tournaments',      label: 'Tournois',          Icon: IconTrophy },
      { id: 'createTournament', label: 'Créer un tournoi', Icon: IconCreate },
    ],
  },
  {
    label: 'Boutique & infos',
    items: [
      { id: 'shop',       label: 'Boutique',     Icon: IconShop  },
      { id: 'patchNotes', label: 'Patch notes',  Icon: IconPatch },
    ],
  },
  {
    label: 'Compte',
    items: [
      { id: 'profile',  label: 'Profil',      Icon: IconProfile  },
      { id: 'settings', label: 'Paramètres', Icon: IconSettings },
    ],
  },
  {
    label: 'Administration',
    adminOnly: true,
    items: [
      { id: 'admin', label: 'Panneau admin', Icon: IconAdmin },
    ],
  },
];

export const Sidebar: React.FC<SidebarProps> = ({ currentPage, onPageChange, user, onLogout, cartCount = 0 }) => {
  const isActive = (id: string) =>
    currentPage === id || (id === 'shop' && currentPage === 'panier');

  const groups = NAV_GROUPS.filter(g => !g.adminOnly || user.isAdmin);

  return (
    <aside
      className="flex flex-col h-full shrink-0"
      style={{
        width: 'var(--sidebar)',
        background: 'linear-gradient(180deg, #0b203f 0%, var(--surface) 100%)',
        borderRight: '1px solid var(--border)',
      }}
    >
      {/* Brand block */}
      <div className="flex shrink-0 items-center gap-3 px-5 py-4"
        style={{ borderBottom: '1px solid var(--border)' }}>
        <div className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-xl glow-accent"
          style={{ background: 'linear-gradient(150deg, var(--accent2), var(--accent))' }}>
          <Logo />
        </div>
        <div className="leading-none">
          <div className="font-display text-[19px] font-bold tracking-wide">
            B3 <span className="text-gradient">ESPORT</span>
          </div>
          <div className="mt-1 text-[9.5px] font-semibold uppercase tracking-[0.22em]" style={{ color: 'var(--text3)' }}>
            Valorant Hub
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto scrollbar-hide px-3 py-4 space-y-5">
        {groups.map(group => (
          <div key={group.label}>
            <p className="nav-group-label mb-2 px-2 flex items-center gap-2">
              {group.adminOnly && (
                <span className="h-1.5 w-1.5 rounded-full" style={{ background: 'var(--accent2)', boxShadow: '0 0 8px var(--accent2)' }} />
              )}
              {group.label}
            </p>
            <div className="space-y-1">
              {group.items.map(({ id, label, Icon }) => {
                const active = isActive(id);
                const showBadge = id === 'shop' && cartCount > 0;
                return (
                  <motion.button
                    key={id}
                    whileTap={{ scale: 0.97 }}
                    onClick={() => onPageChange(id)}
                    className={`nav-item ${active ? 'active' : ''}`}
                  >
                    <Icon active={active} />
                    <span className="flex-1 text-left">{label}</span>
                    {showBadge && (
                      <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full px-1.5 text-[10px] font-bold text-white"
                        style={{ background: 'var(--red)' }}>
                        {cartCount > 9 ? '9+' : cartCount}
                      </span>
                    )}
                  </motion.button>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* User */}
      <div className="shrink-0 px-3 py-3" style={{ borderTop: '1px solid var(--border)' }}>
        <button onClick={() => onPageChange('profile')}
          className="flex w-full items-center gap-2.5 rounded-xl px-2 py-2 text-left transition hover:bg-white/5">
          <Avatar username={user.username} size="sm" showBorder={false} />
          <div className="flex-1 min-w-0">
            <p className="truncate text-[13px] font-semibold flex items-center gap-1.5">
              {user.username}
              {user.isAdmin && (
                <span className="rounded px-1.5 py-px text-[9px] font-bold tracking-wider"
                  style={{ background: 'rgba(70,194,255,0.15)', color: 'var(--accent2)' }}>ADMIN</span>
              )}
            </p>
            <p className="truncate text-[11px]" style={{ color: 'var(--text3)' }}>{user.email}</p>
          </div>
        </button>
        <motion.button whileTap={{ scale: 0.97 }} onClick={onLogout}
          className="mt-1.5 flex w-full items-center gap-2 rounded-lg px-3 py-2 text-[12px] font-medium transition hover:bg-white/5"
          style={{ color: 'var(--text3)' }}>
          <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={1.6} className="h-3.5 w-3.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M11 3h2a1 1 0 011 1v8a1 1 0 01-1 1h-2M8 10l3-3-3-3M11 7H4"/>
          </svg>
          Déconnexion
        </motion.button>
      </div>

    </aside>
  );
};
