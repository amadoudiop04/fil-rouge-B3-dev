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
  // Guests browse the app in read-only mode; this flips to the login/register page
  // when they pick "Se connecter" or try a members-only action.
  const [showAuth, setShowAuth] = useState(false);

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

  // Increment/decrement a line; quantity hitting 0 removes it (capped at stock).
  const updateQty = (id: number, delta: number) => {
    setCartItems(prev => prev.flatMap(i => {
      if (i.id !== id) return [i];
      const q = Math.min(i.stock_quantity || Infinity, i.quantity + delta);
      return q <= 0 ? [] : [{ ...i, quantity: q }];
    }));
  };
  const removeFromCart = (id: number) => setCartItems(prev => prev.filter(i => i.id !== id));
  const clearCart = () => setCartItems([]);

  if (isLoading) return <Loader />;
  // Logged out: either the auth page (when requested) or the app in guest mode.
  if (!user && showAuth) return <AuthPage onBack={() => setShowAuth(false)} />;

  const cartCount = cartItems.reduce((s, i) => s + i.quantity, 0);

  return (
    <B3App
      user={user}
      cartCount={cartCount}
      cartItems={cartItems}
      onLogout={logout}
      onRequireAuth={() => setShowAuth(true)}
      onAddToCart={addToCart}
      onUpdateQty={updateQty}
      onRemoveFromCart={removeFromCart}
      onClearCart={clearCart}
    />
  );
};

const App: React.FC = () => (
  <AuthProvider><AppContent /></AuthProvider>
);

export default App;
