import React, { useState } from 'react';
import './index.css';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { AuthPage } from './middleware/AuthPage';
import B3App from './pages/B3App';

export interface CartItem {
  id: number; img: string; name: string; price: number;
  category: string; stock_quantity: number; quantity: number;
}

const Loader: React.FC = () => (
  <div className="flex h-screen items-center justify-center">
    <div className="flex flex-col items-center gap-5">
      <span className="flex h-12 w-12 items-center justify-center font-display text-[24px] text-white"
        style={{ background: 'var(--red)', clipPath: 'polygon(0 0,100% 0,100% 72%,82% 100%,0 100%)' }}>
        B3
      </span>
      <span className="font-mono text-[11px] tracking-[0.2em] animate-pulse" style={{ color: 'var(--muted)' }}>
        // CHARGEMENT…
      </span>
    </div>
  </div>
);

const AppContent: React.FC = () => {
  const { user, logout, isLoading } = useAuth();
  const [cartItems, setCartItems] = useState<CartItem[]>([]);

  const addToCart = (p: Omit<CartItem, 'quantity'>) => {
    setCartItems(prev => {
      const idx = prev.findIndex(i => i.id === p.id);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = { ...next[idx], quantity: next[idx].quantity + 1 };
        return next;
      }
      return [...prev, { ...p, quantity: 1 }];
    });
  };

  if (isLoading) return <Loader />;
  if (!user)     return <AuthPage />;

  const cartCount = cartItems.reduce((s, i) => s + i.quantity, 0);

  return <B3App user={user} cartCount={cartCount} onLogout={logout} onAddToCart={addToCart} />;
};

const App: React.FC = () => (
  <AuthProvider><AppContent /></AuthProvider>
);

export default App;
