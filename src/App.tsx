import React, { useState } from 'react';
import './index.css';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { AuthPage } from './middleware/AuthPage';
import { Header } from './components/Header';
import { Navigation } from './components/Navigation';
import { HomePage } from './pages/HomePage';
import { StatsPage } from './pages/statsPage';
import { ProfilePage } from './pages/ProfilePage';
import { SettingsPage } from './pages/SettingsPage';
import TournamentPage from './pages/TournamentPage';
import { PaymentPage } from './pages/PaymentPage';
import { Product } from './components/ProductCard';
import ShopPage from './pages/Shop';
import PanierPage from './pages/PanierPage';
import { motion } from 'framer-motion';

interface CartItem {
  id: number; img: string; name: string; price: number;
  category: string; stock_quantity: number; quantity: number;
}

// ─── animated background (fixed, behind everything) ───────────────────────────
const Background: React.FC = () => (
  <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
    <div className="absolute inset-0 bg-[#06060f]" />
    <div className="bg-grid absolute inset-0" />
    <div className="orb-1 absolute -left-40 -top-40 h-[480px] w-[480px] rounded-full bg-[#FF4654]/8 blur-[110px]" />
    <div className="orb-2 absolute -right-40 top-1/3 h-[560px] w-[560px] rounded-full bg-[#9d4edd]/7 blur-[130px]" />
    <div className="orb-3 absolute -bottom-20 left-1/2 h-[360px] w-[360px] -translate-x-1/2 rounded-full bg-[#22d3ee]/5 blur-[100px]" />
  </div>
);

// ─── loading screen ───────────────────────────────────────────────────────────
const LoadingScreen: React.FC = () => (
  <div className="flex min-h-screen flex-col items-center justify-center bg-[#06060f] text-white">
    <Background />
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ type: 'spring', stiffness: 300, damping: 28 }}
      className="flex flex-col items-center gap-5"
    >
      <div className="flex items-center gap-2">
        <div className="h-7 w-1.5 rounded-full bg-[#FF4654]" />
        <span className="text-3xl font-black uppercase tracking-[0.25em]">B3 ESPORT</span>
        <div className="h-7 w-1.5 rounded-full bg-[#FF4654]" />
      </div>
      <div className="flex gap-1.5">
        {[0, 1, 2].map(i => (
          <motion.div
            key={i}
            className="h-1.5 w-1.5 rounded-full bg-[#FF4654]"
            animate={{ opacity: [0.3, 1, 0.3], scale: [0.8, 1.2, 0.8] }}
            transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.2 }}
          />
        ))}
      </div>
    </motion.div>
  </div>
);

// ─── main content (authenticated) ────────────────────────────────────────────
const AppContent: React.FC = () => {
  const { user, logout, isLoading } = useAuth();
  const [currentPage, setCurrentPage] = useState('home');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [cartItems, setCartItems] = useState<CartItem[]>([]);

  if (isLoading) return <LoadingScreen />;
  if (!user) return <AuthPage />;

  return (
    <div className="relative flex min-h-screen flex-col text-white">
      <Background />
      <Header username={user.username} onNavigate={setCurrentPage} />
      <div className="flex flex-1 flex-col overflow-hidden">
        {currentPage === 'home'        && <HomePage onNavigate={setCurrentPage} onBuyProduct={p => { setSelectedProduct(p); setCurrentPage('payment'); }} />}
        {currentPage === 'stats'       && <StatsPage user={user} onNavigate={setCurrentPage} />}
        {currentPage === 'profile'     && <ProfilePage user={user} onLogout={logout} onNavigate={setCurrentPage} />}
        {currentPage === 'settings'    && <SettingsPage user={user} onNavigate={setCurrentPage} />}
        {currentPage === 'tournaments' && <TournamentPage onNavigate={setCurrentPage} />}
        {currentPage === 'shop'        && <ShopPage onNavigate={setCurrentPage} cartItems={cartItems} onCartUpdate={setCartItems} />}
        {currentPage === 'panier'      && <PanierPage onNavigate={setCurrentPage} cartItems={cartItems} onCartUpdate={setCartItems} onCheckout={() => setCurrentPage('payment')} />}
        {currentPage === 'payment'     && <PaymentPage onNavigate={setCurrentPage} product={selectedProduct} cartItems={cartItems} onClearCart={() => setCartItems([])} />}
      </div>
      <Navigation currentPage={currentPage} onPageChange={setCurrentPage} />
    </div>
  );
};

const App: React.FC = () => (
  <AuthProvider>
    <AppContent />
  </AuthProvider>
);

export default App;
