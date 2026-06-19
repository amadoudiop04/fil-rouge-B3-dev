import React, { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import { platformApi } from '../services/platformApi';

interface CartItem {
  id: number; name: string; price: number; img: string;
  category: string; stock_quantity: number; quantity: number;
}

interface PaymentPageProps {
  onNavigate: (page: string) => void;
  product?: any;
  cartItems?: CartItem[];
  onClearCart?: () => void;
}

const sp = { type: 'spring' as const, stiffness: 380, damping: 28 };

const METHODS = [
  {
    id: 'carte' as const,
    label: 'Carte bancaire',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="h-5 w-5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"/>
      </svg>
    ),
  },
  {
    id: 'paypal' as const,
    label: 'PayPal',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="h-5 w-5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.1 0-2 .9-2 2v1h3a2 2 0 002-2v-.5A.5.5 0 0014.5 8H12zM8 6h6a3 3 0 013 3v1a4 4 0 01-4 4H9l-1 5H5.5L8 6z"/>
      </svg>
    ),
  },
  {
    id: 'crypto' as const,
    label: 'Crypto',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="h-5 w-5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v8l9-11h-7z"/>
      </svg>
    ),
  },
];

export const PaymentPage: React.FC<PaymentPageProps> = ({ onNavigate, cartItems = [], onClearCart }) => {
  const { user } = useAuth();
  const [method, setMethod]   = useState<'carte' | 'paypal' | 'crypto'>('carte');
  const [processing, setProc] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError]     = useState<string | null>(null);

  const total     = cartItems.reduce((s, i) => s + i.price * i.quantity, 0);
  const itemCount = cartItems.reduce((s, i) => s + i.quantity, 0);

  const methodMap: Record<string, 'Card' | 'PayPal' | 'Crypto'> = {
    carte: 'Card', paypal: 'PayPal', crypto: 'Crypto',
  };

  const handlePay = async () => {
    if (!user || cartItems.length === 0) return;
    setProc(true); setError(null);
    try {
      const res = await platformApi.createOrder({
        user_id: Number(user.id),
        total_ttc: total,
        payment_method: methodMap[method],
        items: cartItems.map(i => ({ product_id: i.id, quantity: i.quantity, price_at_purchase: i.price })),
      });
      if (res.success) {
        setSuccess(true);
        onClearCart?.();
        setTimeout(() => onNavigate('home'), 2500);
      } else {
        setError(res.error || 'Erreur lors du paiement');
      }
    } catch { setError('Une erreur est survenue'); }
    finally { setProc(false); }
  };

  if (success) return (
    <div className="page-enter flex h-full items-center justify-center p-6">
      <motion.div initial={{ opacity: 0, scale: 0.92 }} animate={{ opacity: 1, scale: 1 }} transition={sp}
        className="card flex w-full max-w-sm flex-col items-center gap-5 p-10 text-center glow-violet">
        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ ...sp, delay: 0.2 }}
          className="flex h-16 w-16 items-center justify-center rounded-full"
          style={{ background: 'rgba(34,197,94,0.15)', border: '2px solid var(--green)' }}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="h-8 w-8" style={{ color: 'var(--green)' }}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/>
          </svg>
        </motion.div>
        <div>
          <h2 className="text-[22px] font-bold">Commande confirmée !</h2>
          <p className="mt-2 text-[14px]" style={{ color: 'var(--text2)' }}>Votre paiement a été traité avec succès.</p>
        </div>
        <p className="text-[13px]" style={{ color: 'var(--text3)' }}>Redirection vers l'accueil…</p>
      </motion.div>
    </div>
  );

  return (
    <div className="page-enter flex h-full overflow-hidden">

      {/* Left: payment form */}
      <div className="flex-1 overflow-y-auto p-6 min-w-0">

        {/* Back + title */}
        <div className="mb-6 flex items-center gap-3">
          <button onClick={() => onNavigate('panier')}
            className="flex h-9 w-9 items-center justify-center rounded-xl transition hover:bg-white/8"
            style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
            <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={2} className="h-4 w-4">
              <path d="M10 4L6 8l4 4" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
          <div>
            <h2 className="text-[20px] font-bold">Paiement</h2>
            <p className="text-[13px]" style={{ color: 'var(--text3)' }}>
              {itemCount} article{itemCount > 1 ? 's' : ''} · {total.toFixed(2)}€
            </p>
          </div>
        </div>

        {/* Steps */}
        <div className="mb-6 flex items-center gap-2">
          {['Panier', 'Paiement', 'Confirmation'].map((step, i) => (
            <React.Fragment key={step}>
              <div className="flex items-center gap-1.5">
                <div className="flex h-6 w-6 items-center justify-center rounded-full text-[11px] font-bold"
                  style={{
                    background: i === 0 ? 'var(--green)' : i === 1 ? 'var(--violet)' : 'var(--raised)',
                    color: i < 2 ? 'white' : 'var(--text3)',
                  }}>
                  {i === 0 ? '✓' : i + 1}
                </div>
                <span className="text-[12px] font-medium" style={{ color: i === 1 ? 'var(--text1)' : 'var(--text3)' }}>{step}</span>
              </div>
              {i < 2 && <div className="h-px w-8" style={{ background: i === 0 ? 'var(--violet)' : 'var(--border)' }} />}
            </React.Fragment>
          ))}
        </div>

        {/* Payment methods */}
        <p className="mb-3 text-[11px] font-semibold uppercase tracking-widest" style={{ color: 'var(--text3)' }}>Méthode de paiement</p>
        <div className="grid grid-cols-3 gap-3 mb-6">
          {METHODS.map(m => (
            <motion.button key={m.id} whileTap={{ scale: 0.96 }} transition={sp}
              onClick={() => setMethod(m.id)}
              className="flex flex-col items-center gap-2.5 rounded-xl p-4 transition"
              style={{
                background: method === m.id ? 'rgba(124,58,237,0.12)' : 'var(--surface)',
                border: `1px solid ${method === m.id ? 'var(--violet)' : 'var(--border)'}`,
                color: method === m.id ? 'var(--violet2)' : 'var(--text2)',
              }}>
              {m.icon}
              <span className="text-[13px] font-semibold">{m.label}</span>
            </motion.button>
          ))}
        </div>

        {/* Card form */}
        <AnimatePresence>
          {method === 'carte' && (
            <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 6 }} transition={sp}
              className="space-y-4">
              <p className="text-[11px] font-semibold uppercase tracking-widest" style={{ color: 'var(--text3)' }}>Informations carte</p>
              <input type="text" placeholder="Nom sur la carte" className="input w-full px-4 py-3 text-[14px]" />
              <input type="text" placeholder="0000 0000 0000 0000" className="input w-full px-4 py-3 text-[14px] font-mono" maxLength={19} />
              <div className="grid grid-cols-2 gap-4">
                <input type="text" placeholder="MM / AA" className="input w-full px-4 py-3 text-[14px] font-mono" maxLength={7} />
                <input type="password" placeholder="CVV" className="input w-full px-4 py-3 text-[14px] font-mono" maxLength={4} />
              </div>
            </motion.div>
          )}
          {method === 'paypal' && (
            <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 6 }} transition={sp}
              className="rounded-xl p-6 text-center"
              style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
              <p className="text-[14px]" style={{ color: 'var(--text2)' }}>Vous serez redirigé vers PayPal pour compléter votre paiement.</p>
            </motion.div>
          )}
          {method === 'crypto' && (
            <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 6 }} transition={sp}
              className="rounded-xl p-6 text-center"
              style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
              <p className="text-[14px]" style={{ color: 'var(--text2)' }}>BTC, ETH et USDC acceptés. Adresse générée à la confirmation.</p>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {error && (
            <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              className="mt-4 rounded-xl p-4 text-[13px] font-medium"
              style={{ background: 'rgba(239,68,68,0.08)', color: 'var(--red)', border: '1px solid rgba(239,68,68,0.2)' }}>
              {error}
            </motion.div>
          )}
        </AnimatePresence>

      </div>

      {/* Right: order summary */}
      <aside className="w-80 shrink-0 overflow-y-auto p-6"
        style={{ borderLeft: '1px solid var(--border)' }}>
        <h3 className="mb-4 text-[14px] font-bold">Récapitulatif</h3>

        <div className="card overflow-hidden mb-5">
          <div className="px-4 py-3" style={{ borderBottom: '1px solid var(--border)' }}>
            <p className="text-[11px] font-semibold uppercase tracking-widest" style={{ color: 'var(--text3)' }}>
              Articles ({itemCount})
            </p>
          </div>
          {cartItems.map((item, i) => (
            <div key={item.id} className="flex items-center gap-3 px-4 py-3"
              style={i < cartItems.length - 1 ? { borderBottom: '1px solid var(--border)' } : undefined}>
              <div className="h-10 w-10 shrink-0 overflow-hidden rounded-lg" style={{ background: 'var(--raised)' }}>
                {item.img
                  ? <img src={item.img} alt={item.name} className="h-full w-full object-cover" />
                  : <div className="flex h-full items-center justify-center text-lg opacity-20">📦</div>
                }
              </div>
              <div className="flex-1 min-w-0">
                <p className="truncate text-[13px] font-medium">{item.name}</p>
                <p className="text-[11px]" style={{ color: 'var(--text3)' }}>×{item.quantity}</p>
              </div>
              <span className="shrink-0 text-[13px] font-bold" style={{ color: 'var(--violet2)' }}>
                {(item.price * item.quantity).toFixed(2)}€
              </span>
            </div>
          ))}
        </div>

        {/* Totals */}
        <div className="space-y-2.5 text-[14px] mb-5">
          <div className="flex justify-between">
            <span style={{ color: 'var(--text2)' }}>Sous-total</span>
            <span className="font-semibold">{total.toFixed(2)}€</span>
          </div>
          <div className="flex justify-between">
            <span style={{ color: 'var(--text2)' }}>Livraison Express</span>
            <span className="font-semibold" style={{ color: 'var(--green)' }}>Offerte</span>
          </div>
        </div>

        <div className="flex items-center justify-between py-4" style={{ borderTop: '1px solid var(--border)' }}>
          <div>
            <p className="text-[11px]" style={{ color: 'var(--text3)' }}>Total TTC</p>
            <p className="text-[28px] font-black leading-none">{total.toFixed(2)}€</p>
          </div>
          <div className="flex items-center gap-1.5 text-[11px]" style={{ color: 'var(--text3)' }}>
            <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={1.5} className="h-4 w-4">
              <path strokeLinecap="round" d="M8 1l.9 2.8H12L9.6 5.4l.9 2.8L8 6.6l-2.5 1.6.9-2.8-2.4-1.6h3.1z"/>
            </svg>
            SSL sécurisé
          </div>
        </div>

        <motion.button whileTap={{ scale: 0.97 }} transition={sp}
          onClick={handlePay}
          disabled={processing || cartItems.length === 0}
          className="btn-primary w-full py-4 text-[15px] mt-2">
          {processing ? (
            <span className="flex items-center justify-center gap-2">
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
              Traitement…
            </span>
          ) : 'Confirmer le paiement'}
        </motion.button>

        <p className="mt-3 text-center text-[11px]" style={{ color: 'var(--text3)' }}>
          Paiement 100% sécurisé · Protocole SSL
        </p>
      </aside>
    </div>
  );
};
