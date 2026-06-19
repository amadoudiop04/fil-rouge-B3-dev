import React, { useState } from 'react';
import './index.css';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { AuthPage } from './middleware/AuthPage';
import { Sidebar } from './components/Sidebar';
import { TopBar } from './components/TopBar';
import { HomePage } from './pages/HomePage';
import { StatsPage } from './pages/statsPage';
import { ProfilePage } from './pages/ProfilePage';
import { SettingsPage } from './pages/SettingsPage';
import TournamentPage from './pages/TournamentPage';
import PlayersPage from './pages/PlayersPage';
import CreateTournamentPage from './pages/CreateTournamentPage';
import { PaymentPage } from './pages/PaymentPage';
import ShopPage from './pages/Shop';
import PanierPage from './pages/PanierPage';
import ValorantStatsPage from './pages/ValorantStatsPage';
import { motion } from 'framer-motion';

export interface CartItem {
  id: number; img: string; name: string; price: number;
  category: string; stock_quantity: number; quantity: number;
}

const PAGE_TITLES: Record<string, string> = {
  home:             'Accueil',
  stats:            'Statistiques',
  agentStats:       'Agents & Stats Valorant',
  profile:          'Profil',
  settings:         'Paramètres',
  tournaments:      'Tournois',
  players:          'Trouver des joueurs',
  createTournament: 'Créer un tournoi',
  shop:             'Boutique',
  panier:           'Panier',
  payment:          'Paiement',
};

const Loader: React.FC = () => (
  <div className="flex h-screen items-center justify-center" style={{ background: 'var(--bg)' }}>
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
      className="flex flex-col items-center gap-6">
      <div className="flex h-12 w-12 items-center justify-center rounded-xl glow-violet" style={{ background: 'var(--violet)' }}>
        <svg viewBox="0 0 32 32" fill="none" className="h-7 w-7 text-white">
          <path d="M16 3L4 9v14l12 6 12-6V9L16 3z" stroke="currentColor" strokeWidth={2} strokeLinejoin="round"/>
          <path d="M4 9l12 6 12-6M16 15v12" stroke="currentColor" strokeWidth={2} strokeLinejoin="round"/>
        </svg>
      </div>
      <div className="flex gap-1.5">
        {[0,1,2].map(i => (
          <motion.div key={i} className="h-1.5 w-1.5 rounded-full"
            style={{ background: 'var(--violet)' }}
            animate={{ opacity: [0.3,1,0.3] }}
            transition={{ duration: 1.1, repeat: Infinity, delay: i * 0.18 }}
          />
        ))}
      </div>
    </motion.div>
  </div>
);

const AppContent: React.FC = () => {
  const { user, logout, isLoading } = useAuth();
  const [page, setPage]         = useState('home');
  const [cartItems, setCartItems] = useState<CartItem[]>([]);

  if (isLoading) return <Loader />;
  if (!user)     return <AuthPage />;

  const cartCount = cartItems.reduce((s, i) => s + i.quantity, 0);

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: 'var(--bg)' }}>
      <Sidebar
        currentPage={page}
        onPageChange={setPage}
        user={user}
        onLogout={logout}
        cartCount={cartCount}
      />
      <div className="flex flex-1 flex-col overflow-hidden min-w-0">
        <TopBar title={PAGE_TITLES[page] ?? ''} onNavigate={setPage} />
        <div className="flex-1 overflow-y-auto">
          {page === 'home'        && <HomePage onNavigate={setPage} />}
          {page === 'stats'       && <StatsPage user={user} onNavigate={setPage} />}
          {page === 'agentStats'  && <ValorantStatsPage />}
          {page === 'profile'     && <ProfilePage user={user} onLogout={logout} onNavigate={setPage} />}
          {page === 'settings'    && <SettingsPage user={user} onNavigate={setPage} />}
          {page === 'tournaments'       && <TournamentPage onNavigate={setPage} />}
          {page === 'players'           && <PlayersPage />}
          {page === 'createTournament'  && <CreateTournamentPage />}
          {page === 'shop'        && <ShopPage onNavigate={setPage} cartItems={cartItems} onCartUpdate={setCartItems} />}
          {page === 'panier'      && <PanierPage onNavigate={setPage} cartItems={cartItems} onCartUpdate={setCartItems} onCheckout={() => setPage('payment')} />}
          {page === 'payment'     && <PaymentPage onNavigate={setPage} cartItems={cartItems} onClearCart={() => setCartItems([])} />}
        </div>
      </div>
    </div>
  );
};

const App: React.FC = () => (
  <AuthProvider><AppContent /></AuthProvider>
);

export default App;
