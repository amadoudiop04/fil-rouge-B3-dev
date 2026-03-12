import React, { useState, useEffect } from 'react';
import './index.css';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { AuthPage } from './middleware/AuthPage';
import { Header } from './components/Header';
import { Navigation } from './components/Navigation';
import { Footer } from './components/Footer';
import { HomePage } from './pages/HomePage';
import { StatsPage } from './pages/statsPage';
import { ProfilePage } from './pages/ProfilePage';
import { SettingsPage } from './pages/SettingsPage';
import TournamentPage from './pages/TournamentPage';
import { PaymentPage } from './pages/PaymentPage';
import { Product } from './components/ProductCard';
import ShopPage from './pages/Shop';
import PanierPage from './pages/PanierPage';

interface CartItem {
  id: number;
  img: string;
  name: string;
  price: number;
  category: string;
  stock_quantity: number;
  quantity: number;
}

const AppContent = () => {
  const { user, logout, isLoading } = useAuth();
  const [currentPage, setCurrentPage] = useState('home');
  const [hasPlayedLoginSound, setHasPlayedLoginSound] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [cartItems, setCartItems] = useState<CartItem[]>([]);

  const handleBuyProduct = (product: Product) => {
    setSelectedProduct(product);
    setCurrentPage('payment');
  };

  const handleCartUpdate = (items: CartItem[]) => {
    setCartItems(items);
  };

  const handleCheckout = () => {
    setCurrentPage('payment');
  };

  const handleClearCart = () => {
    setCartItems([]);
  };

  useEffect(() => {
    // Jouer un son de connexion
    if (user && !hasPlayedLoginSound) {
      const soundEnabled = window.localStorage.getItem('settings-sound');
      if (soundEnabled === 'true' || soundEnabled === null) {
        try {
          const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
          const oscillator = audioContext.createOscillator();
          const gainNode = audioContext.createGain();

          oscillator.connect(gainNode);
          gainNode.connect(audioContext.destination);

          // Créer une mélodie simple
          oscillator.frequency.setValueAtTime(600, audioContext.currentTime);
          oscillator.frequency.setValueAtTime(800, audioContext.currentTime + 0.1);

          gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
          gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.4);

          oscillator.start(audioContext.currentTime);
          oscillator.stop(audioContext.currentTime + 0.4);

          setHasPlayedLoginSound(true);
        } catch (err) {
          console.error('Error playing login sound:', err);
        }
      }
    }
  }, [user, hasPlayedLoginSound]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0a1628] text-white flex items-center justify-center">
        <div className="text-center">
          <p className="text-xl">Chargement...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <AuthPage />;
  }


  return (
    <div className="min-h-screen bg-[#061325] text-white flex flex-col">
      <Header username={user.username} onNavigate={setCurrentPage} />
      {currentPage === 'home' && <HomePage onNavigate={setCurrentPage} onBuyProduct={handleBuyProduct} />}
      {currentPage === 'stats' && <StatsPage user={user} onNavigate={setCurrentPage} />}
      {currentPage === 'profile' && <ProfilePage user={user} onLogout={logout} onNavigate={setCurrentPage} />}
      {currentPage === 'settings' && <SettingsPage user={user} onNavigate={setCurrentPage} />}
      {currentPage === 'tournaments' && <TournamentPage onNavigate={setCurrentPage} />}
      {currentPage === 'shop' && <ShopPage onNavigate={setCurrentPage} cartItems={cartItems} onCartUpdate={handleCartUpdate} />}
      {currentPage === 'panier' && <PanierPage onNavigate={setCurrentPage} cartItems={cartItems} onCartUpdate={handleCartUpdate} onCheckout={handleCheckout} />}
      {currentPage === 'payment' && <PaymentPage onNavigate={setCurrentPage} product={selectedProduct} cartItems={cartItems} onClearCart={handleClearCart} />}
      <Footer />
      <Navigation currentPage={currentPage} onPageChange={setCurrentPage} />
    </div>
  );
};

const App = () => {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
};

export default App;

