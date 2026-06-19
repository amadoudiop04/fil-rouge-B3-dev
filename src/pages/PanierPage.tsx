import React, { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';

interface CartItem {
  id: number; name: string; price: number; img: string;
  category: string; stock_quantity: number; quantity: number;
}

interface PanierPageProps {
  onNavigate?: (page: string) => void;
  cartItems?: CartItem[];
  onCartUpdate?: (items: CartItem[]) => void;
  onCheckout?: () => void;
}

const sp = { type: 'spring' as const, stiffness: 380, damping: 28 };
const PROMO: Record<string, number> = { ESPORT10: 10, BIENVENUE: 15, VIP20: 20, PROMO5: 5 };

const CartPage: React.FC<PanierPageProps> = ({ onNavigate, cartItems = [], onCartUpdate, onCheckout }) => {
  const [promoCode, setPromoCode] = useState('');
  const [discount, setDiscount]   = useState(0);
  const [promoMsg, setPromoMsg]   = useState<{ text: string; ok: boolean } | null>(null);

  const update = (id: number, delta: number) =>
    onCartUpdate?.(cartItems.map(i => i.id === id ? { ...i, quantity: Math.max(1, i.quantity + delta) } : i));
  const remove = (id: number) => onCartUpdate?.(cartItems.filter(i => i.id !== id));
  const clear  = () => onCartUpdate?.([]);

  const applyPromo = () => {
    const code = promoCode.toUpperCase().trim();
    if (!code)       { setPromoMsg({ text: 'Entrez un code promo', ok: false }); return; }
    if (PROMO[code]) { setDiscount(PROMO[code]); setPromoMsg({ text: `✓ Code appliqué : −${PROMO[code]}%`, ok: true }); }
    else             { setPromoMsg({ text: '✗ Code invalide', ok: false }); setDiscount(0); }
  };

  const subtotal       = cartItems.reduce((s, i) => s + i.price * i.quantity, 0);
  const discountAmount = (subtotal * discount) / 100;
  const total          = subtotal - discountAmount;
  const itemCount      = cartItems.reduce((s, i) => s + i.quantity, 0);

  if (cartItems.length === 0) {
    return (
      <div className="page-enter flex h-full items-center justify-center p-6">
        <div className="card flex w-full max-w-sm flex-col items-center gap-5 p-12 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl" style={{ background: 'var(--raised)' }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="h-8 w-8" style={{ color: 'var(--text3)' }}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4zM3 6h18M16 10a4 4 0 01-8 0"/>
            </svg>
          </div>
          <div>
            <p className="text-[18px] font-bold">Votre panier est vide</p>
            <p className="mt-1.5 text-[14px]" style={{ color: 'var(--text3)' }}>Découvrez notre boutique</p>
          </div>
          <button onClick={() => onNavigate?.('shop')} className="btn-primary px-6 py-2.5 text-[14px]">
            Aller à la boutique
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="page-enter flex h-full gap-0 overflow-hidden">

      {/* Left: item list */}
      <div className="flex-1 overflow-y-auto p-6 min-w-0">
        <div className="mb-5 flex items-center justify-between">
          <div>
            <h2 className="text-[20px] font-bold">Mon panier</h2>
            <p className="text-[13px] mt-0.5" style={{ color: 'var(--text3)' }}>
              {itemCount} article{itemCount > 1 ? 's' : ''}
            </p>
          </div>
          <motion.button whileTap={{ scale: 0.94 }} transition={sp} onClick={clear}
            className="rounded-lg px-3 py-1.5 text-[13px] font-semibold"
            style={{ background: 'rgba(239,68,68,0.08)', color: 'var(--red)', border: '1px solid rgba(239,68,68,0.15)' }}>
            Vider le panier
          </motion.button>
        </div>

        <div className="space-y-3">
          <AnimatePresence>
            {cartItems.map(item => (
              <motion.div key={item.id}
                initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                transition={sp} className="overflow-hidden">
                <div className="card flex items-center gap-4 p-4">
                  <div className="h-20 w-20 shrink-0 overflow-hidden rounded-xl" style={{ background: 'var(--raised)' }}>
                    {item.img
                      ? <img src={item.img} alt={item.name} className="h-full w-full object-cover" />
                      : <div className="flex h-full items-center justify-center"><span className="text-2xl opacity-20">📦</span></div>
                    }
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] font-semibold uppercase tracking-wide mb-1" style={{ color: 'var(--text3)' }}>{item.category}</p>
                    <p className="text-[15px] font-semibold leading-tight">{item.name}</p>
                    <p className="mt-1 text-[14px] font-bold" style={{ color: 'var(--violet2)' }}>
                      {(item.price * item.quantity).toFixed(2)}€
                      {item.quantity > 1 && (
                        <span className="ml-2 text-[12px] font-normal" style={{ color: 'var(--text3)' }}>
                          ({item.price.toFixed(2)}€ / u.)
                        </span>
                      )}
                    </p>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <div className="flex items-center gap-0.5 rounded-lg overflow-hidden" style={{ border: '1px solid var(--border)' }}>
                      <button onClick={() => update(item.id, -1)}
                        className="flex h-8 w-8 items-center justify-center text-[16px] leading-none transition hover:bg-white/8"
                        style={{ color: 'var(--text2)' }}>−</button>
                      <span className="w-8 text-center text-[14px] font-bold tabular-nums">{item.quantity}</span>
                      <button onClick={() => update(item.id, 1)}
                        className="flex h-8 w-8 items-center justify-center text-[14px] leading-none text-white transition"
                        style={{ background: 'var(--violet)' }}>+</button>
                    </div>
                    <button onClick={() => remove(item.id)}
                      className="flex h-8 w-8 items-center justify-center rounded-lg transition hover:bg-red-500/15"
                      style={{ color: 'var(--text3)' }}>
                      <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={2} className="h-3.5 w-3.5">
                        <path d="M2 4h12M5 4V2h6v2M6 7v5M10 7v5M4 4l.8 9.2c.04.4.4.8.8.8h4.8c.4 0 .76-.4.8-.8L12 4" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        <button onClick={() => onNavigate?.('shop')}
          className="mt-6 flex items-center gap-2 text-[13px] font-semibold transition hover:opacity-70"
          style={{ color: 'var(--text3)' }}>
          ← Continuer les achats
        </button>
      </div>

      {/* Right: order summary */}
      <aside className="w-80 shrink-0 overflow-y-auto p-6"
        style={{ borderLeft: '1px solid var(--border)' }}>
        <h3 className="mb-4 text-[14px] font-bold">Résumé de la commande</h3>

        {/* Item list recap */}
        <div className="mb-4 space-y-2">
          {cartItems.map(item => (
            <div key={item.id} className="flex items-center justify-between text-[13px]">
              <span className="truncate pr-2" style={{ color: 'var(--text2)', maxWidth: 160 }}>
                {item.name} ×{item.quantity}
              </span>
              <span className="shrink-0 font-semibold">{(item.price * item.quantity).toFixed(2)}€</span>
            </div>
          ))}
        </div>

        <div className="my-4 h-px" style={{ background: 'var(--border)' }} />

        {/* Promo */}
        <p className="mb-2 text-[11px] font-semibold uppercase tracking-widest" style={{ color: 'var(--text3)' }}>Code promo</p>
        <div className="flex gap-2 mb-2">
          <input type="text" value={promoCode} onChange={e => setPromoCode(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && applyPromo()}
            placeholder="ESPORT10…" className="input flex-1 px-3 py-2 text-[13px] uppercase" />
          <button onClick={applyPromo} className="btn-ghost rounded-lg px-3 py-2 text-[13px] shrink-0">
            Appliquer
          </button>
        </div>
        {promoMsg && (
          <p className="mb-3 text-[12px] font-semibold" style={{ color: promoMsg.ok ? 'var(--green)' : 'var(--red)' }}>
            {promoMsg.text}
          </p>
        )}

        <div className="my-4 h-px" style={{ background: 'var(--border)' }} />

        {/* Totals */}
        <div className="space-y-2.5 text-[14px]">
          <div className="flex justify-between">
            <span style={{ color: 'var(--text2)' }}>Sous-total</span>
            <span className="font-semibold">{subtotal.toFixed(2)}€</span>
          </div>
          <div className="flex justify-between">
            <span style={{ color: 'var(--text2)' }}>Livraison</span>
            <span className="font-semibold" style={{ color: 'var(--green)' }}>Gratuite</span>
          </div>
          {discount > 0 && (
            <div className="flex justify-between" style={{ color: 'var(--green)' }}>
              <span>Réduction ({discount}%)</span>
              <span className="font-bold">−{discountAmount.toFixed(2)}€</span>
            </div>
          )}
        </div>

        <div className="mt-4 flex items-center justify-between py-4" style={{ borderTop: '1px solid var(--border)' }}>
          <div>
            <p className="text-[11px]" style={{ color: 'var(--text3)' }}>Total TTC</p>
            <p className="text-[28px] font-black leading-none">{total.toFixed(2)}€</p>
          </div>
        </div>

        <motion.button whileTap={{ scale: 0.97 }} transition={sp}
          onClick={onCheckout}
          className="btn-primary w-full py-3.5 text-[15px]">
          Passer au paiement →
        </motion.button>

        <p className="mt-3 text-center text-[11px]" style={{ color: 'var(--text3)' }}>
          Paiement sécurisé · SSL
        </p>
      </aside>
    </div>
  );
};

export default CartPage;
