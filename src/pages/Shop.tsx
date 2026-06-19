import React, { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { platformApi } from '../services/platformApi';

interface ShopProduct { id: number; img: string; name: string; price: number; category: string; stock_quantity: number; }
interface CartItem extends ShopProduct { quantity: number; }
interface ShopPageProps {
  onNavigate?: (page: string) => void;
  cartItems?: CartItem[];
  onCartUpdate?: (items: CartItem[]) => void;
}

const sp = { type: 'spring' as const, stiffness: 380, damping: 28 };

const ShopPage: React.FC<ShopPageProps> = ({ onNavigate, cartItems = [], onCartUpdate }) => {
  const [products, setProducts]   = useState<ShopProduct[]>([]);
  const [loading, setLoading]     = useState(true);
  const [activeCategory, setActive] = useState('TOUS');
  const [search, setSearch]       = useState('');
  const [toast, setToast]         = useState<string | null>(null);
  const [sort, setSort]           = useState<'default' | 'asc' | 'desc'>('default');

  useEffect(() => {
    platformApi.getProducts().then(r => {
      if (r.success && r.products) {
        setProducts(r.products.map((p: any) => ({
          id: p.id, img: p.image_url || '', name: p.name,
          price: p.price, category: p.category.toUpperCase(), stock_quantity: p.stock_quantity,
        })));
      }
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const addToCart = (product: ShopProduct) => {
    if (product.stock_quantity === 0) return;
    const updated = [...cartItems];
    const idx = updated.findIndex(i => i.id === product.id);
    if (idx >= 0) updated[idx] = { ...updated[idx], quantity: updated[idx].quantity + 1 };
    else updated.push({ ...product, quantity: 1 });
    onCartUpdate?.(updated);
    setToast(product.name);
    setTimeout(() => setToast(null), 1800);
  };

  const categories = ['TOUS', ...Array.from(new Set(products.map(p => p.category)))];
  const filtered = products
    .filter(p => (activeCategory === 'TOUS' || p.category === activeCategory) && p.name.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => sort === 'asc' ? a.price - b.price : sort === 'desc' ? b.price - a.price : 0);

  const cartCount = cartItems.reduce((s, i) => s + i.quantity, 0);

  return (
    <div className="page-enter flex h-full">

      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -16 }} transition={sp}
            className="fixed left-1/2 top-4 z-50 -translate-x-1/2 rounded-lg px-4 py-2.5 text-[13px] font-semibold shadow-xl"
            style={{ background: 'var(--card)', border: '1px solid var(--green)', color: 'var(--green)' }}>
            ✓ {toast.length > 24 ? toast.slice(0, 24) + '…' : toast} ajouté au panier
          </motion.div>
        )}
      </AnimatePresence>

      {/* Left: filter sidebar */}
      <aside className="w-52 shrink-0 p-4 space-y-1 overflow-y-auto"
        style={{ borderRight: '1px solid var(--border)' }}>
        <p className="mb-3 text-[11px] font-semibold uppercase tracking-widest px-2" style={{ color: 'var(--text3)' }}>Catégories</p>
        {categories.map(cat => (
          <button key={cat} onClick={() => setActive(cat)}
            className="flex w-full items-center justify-between rounded-lg px-2.5 py-2 text-[13px] font-medium transition"
            style={{
              background: activeCategory === cat ? 'rgba(47,129,247,0.12)' : 'transparent',
              color: activeCategory === cat ? 'var(--violet2)' : 'var(--text2)',
            }}>
            <span>{cat}</span>
            {activeCategory === cat && (
              <span className="h-1.5 w-1.5 rounded-full" style={{ background: 'var(--violet2)' }} />
            )}
          </button>
        ))}

        <div className="pt-4">
          <p className="mb-3 text-[11px] font-semibold uppercase tracking-widest px-2" style={{ color: 'var(--text3)' }}>Trier par prix</p>
          {[
            { id: 'default', label: 'Par défaut' },
            { id: 'asc',     label: 'Croissant' },
            { id: 'desc',    label: 'Décroissant' },
          ].map(s => (
            <button key={s.id} onClick={() => setSort(s.id as any)}
              className="flex w-full items-center justify-between rounded-lg px-2.5 py-2 text-[13px] font-medium transition"
              style={{
                background: sort === s.id ? 'rgba(47,129,247,0.12)' : 'transparent',
                color: sort === s.id ? 'var(--violet2)' : 'var(--text2)',
              }}>
              {s.label}
            </button>
          ))}
        </div>
      </aside>

      {/* Right: products */}
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">

        {/* Toolbar */}
        <div className="flex items-center gap-4 px-6 py-3.5 shrink-0"
          style={{ borderBottom: '1px solid var(--border)' }}>
          <div className="relative flex-1 max-w-sm">
            <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth={1.8}
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2" style={{ color: 'var(--text3)' }}>
              <path d="M9 17A8 8 0 109 1a8 8 0 000 16zM19 19l-4.35-4.35" strokeLinecap="round"/>
            </svg>
            <input type="text" value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Rechercher un produit…"
              className="input w-full py-2 pl-9 pr-4 text-[13px]" />
          </div>
          <p className="text-[13px]" style={{ color: 'var(--text3)' }}>
            {filtered.length} produit{filtered.length !== 1 ? 's' : ''}
          </p>
          {cartCount > 0 && (
            <button onClick={() => onNavigate?.('panier')}
              className="btn-primary flex items-center gap-2 px-4 py-2 text-[13px]">
              <svg viewBox="0 0 16 16" fill="currentColor" className="h-3.5 w-3.5">
                <path d="M0 1.5A.5.5 0 01.5 1H2a.5.5 0 01.485.379L2.89 3H14.5a.5.5 0 01.491.592l-1.5 8A.5.5 0 0113 12H4a.5.5 0 01-.491-.408L2.01 3.607 1.61 2H.5a.5.5 0 01-.5-.5zM5 13a1 1 0 100 2 1 1 0 000-2zm-1.293-.707A1 1 0 005 13h6a1 1 0 100-2H5a1 1 0 00-.293.293zM11 13a1 1 0 100 2 1 1 0 000-2z"/>
              </svg>
              Panier ({cartCount})
            </button>
          )}
        </div>

        {/* Grid */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="flex flex-col items-center gap-3 py-20">
              <div className="h-8 w-8 animate-spin rounded-full border-2" style={{ borderColor: 'var(--raised)', borderTopColor: 'var(--violet)' }} />
              <p style={{ color: 'var(--text3)' }}>Chargement…</p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center gap-3 py-20">
              <p className="text-[15px] font-semibold" style={{ color: 'var(--text2)' }}>Aucun produit trouvé</p>
              <p style={{ color: 'var(--text3)' }}>Essayez une autre recherche ou catégorie</p>
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-4 xl:grid-cols-4">
              {filtered.map((p, i) => (
                <motion.div key={p.id}
                  initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                  transition={{ ...sp, delay: Math.min(i * 0.03, 0.25) }}
                  className="card card-hover overflow-hidden">
                  <div className="relative aspect-video overflow-hidden" style={{ background: 'var(--raised)' }}>
                    {p.stock_quantity === 0 && (
                      <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/60">
                        <span className="rounded-md px-2.5 py-1 text-[11px] font-bold" style={{ color: 'var(--red)', border: '1px solid var(--red)' }}>Rupture</span>
                      </div>
                    )}
                    {p.stock_quantity > 0 && p.stock_quantity <= 5 && (
                      <span className="absolute left-2 top-2 z-10 rounded-full px-2 py-0.5 text-[10px] font-bold"
                        style={{ background: 'rgba(245,158,11,0.15)', color: 'var(--amber)', border: '1px solid var(--amber)' }}>
                        {p.stock_quantity} restant{p.stock_quantity > 1 ? 's' : ''}
                      </span>
                    )}
                    {p.img
                      ? <img src={p.img} alt={p.name} className="h-full w-full object-cover transition-transform duration-300 hover:scale-105" />
                      : <div className="flex h-full items-center justify-center"><span className="text-4xl opacity-15">📦</span></div>
                    }
                  </div>
                  <div className="p-4">
                    <p className="text-[10px] font-semibold uppercase tracking-wide mb-1" style={{ color: 'var(--text3)' }}>{p.category}</p>
                    <p className="text-[13px] font-semibold leading-tight mb-3" style={{ minHeight: 36 }}>{p.name}</p>
                    <div className="flex items-center justify-between">
                      <span className="text-[18px] font-bold" style={{ color: 'var(--violet2)' }}>{p.price.toFixed(2)}€</span>
                      <motion.button whileTap={{ scale: 0.88 }} transition={sp}
                        onClick={() => addToCart(p)}
                        disabled={p.stock_quantity === 0}
                        className="btn-primary flex items-center gap-1.5 px-3 py-1.5 text-[12px] disabled:opacity-40">
                        <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={2} className="h-3.5 w-3.5">
                          <path d="M8 3v10M3 8h10" strokeLinecap="round"/>
                        </svg>
                        Ajouter
                      </motion.button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ShopPage;
