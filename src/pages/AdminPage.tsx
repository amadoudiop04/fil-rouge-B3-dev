import React, { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import {
  platformApi,
  type AdminUser,
  type AdminOrder,
  type AdminOverviewResponse,
} from '../services/platformApi';
import type { ProductRecord } from '../types/api';

type Tab = 'overview' | 'users' | 'products' | 'orders';

const sp = { type: 'spring' as const, stiffness: 360, damping: 30 };
const CATEGORIES = ['MAILLOTS', 'SWEATS', 'ACCESSOIRES', 'GOODIES'];
const ORDER_STATUSES = ['Pending', 'Paid', 'Shipped', 'Cancelled'];

const STATUS_STYLE: Record<string, { bg: string; color: string }> = {
  Pending:   { bg: 'rgba(255,177,59,0.14)',  color: '#ffb13b' },
  Paid:      { bg: 'rgba(34,211,154,0.14)',  color: '#22d39a' },
  Shipped:   { bg: 'rgba(70,194,255,0.14)',  color: '#46c2ff' },
  Cancelled: { bg: 'rgba(255,90,110,0.14)',  color: '#ff5a6e' },
};

const fmtPrice = (n: number) => `${n.toFixed(2)} €`;
const fmtDate = (d?: string) => {
  if (!d) return '—';
  const p = new Date(d);
  return isNaN(p.getTime()) ? '—' : p.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });
};

// ─── Shared UI ─────────────────────────────────────────────────────────────────

const Modal: React.FC<{ title: string; onClose: () => void; children: React.ReactNode; width?: number }> = ({ title, onClose, children, width = 460 }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
    style={{ background: 'rgba(3,10,22,0.7)', backdropFilter: 'blur(4px)' }} onClick={onClose}>
    <motion.div
      initial={{ opacity: 0, scale: 0.96, y: 12 }} animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={sp} onClick={e => e.stopPropagation()}
      className="card overflow-hidden" style={{ width }}>
      <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: '1px solid var(--border)' }}>
        <h3 className="font-display text-[16px] font-bold tracking-wide uppercase">{title}</h3>
        <button onClick={onClose} className="rounded-lg p-1 transition hover:bg-white/8" style={{ color: 'var(--text3)' }}>
          <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth={1.8} className="h-4 w-4"><path d="M5 5l10 10M15 5L5 15" strokeLinecap="round" /></svg>
        </button>
      </div>
      <div className="p-5">{children}</div>
    </motion.div>
  </div>
);

const Field: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
  <div>
    <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-widest" style={{ color: 'var(--text3)' }}>{label}</label>
    {children}
  </div>
);

const Confirm: React.FC<{ text: string; onCancel: () => void; onConfirm: () => void; busy?: boolean }> = ({ text, onCancel, onConfirm, busy }) => (
  <Modal title="Confirmation" onClose={onCancel} width={400}>
    <p className="text-[14px] mb-5" style={{ color: 'var(--text2)' }}>{text}</p>
    <div className="flex justify-end gap-3">
      <button onClick={onCancel} className="btn-ghost px-4 py-2 rounded-lg text-[13px]">Annuler</button>
      <button onClick={onConfirm} disabled={busy}
        className="px-4 py-2 rounded-lg text-[13px] font-semibold text-white disabled:opacity-50"
        style={{ background: 'var(--red)' }}>
        {busy ? 'Suppression…' : 'Supprimer'}
      </button>
    </div>
  </Modal>
);

const StatusBadge: React.FC<{ status: string }> = ({ status }) => {
  const s = STATUS_STYLE[status] ?? { bg: 'var(--raised)', color: 'var(--text2)' };
  return <span className="rounded-md px-2 py-0.5 text-[11px] font-bold tracking-wide" style={{ background: s.bg, color: s.color }}>{status}</span>;
};

// ════════════════════════════════════════════════════════════════════════════════
//  DASHBOARD
// ════════════════════════════════════════════════════════════════════════════════

const Dashboard: React.FC = () => {
  const [data, setData] = useState<AdminOverviewResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    platformApi.adminOverview().then(r => { setData(r); setLoading(false); });
  }, []);

  if (loading) return <PanelLoader />;
  if (!data?.success || !data.metrics) return <PanelError msg={data?.error ?? 'Erreur de chargement'} />;

  const m = data.metrics;
  const maxSignup = Math.max(1, ...(data.signups ?? []).map(s => s.count));

  const cards = [
    { label: 'Revenu total', value: fmtPrice(m.revenue), icon: '◈', accent: 'var(--accent2)' },
    { label: 'Commandes',    value: m.orders,            icon: '⬡', accent: 'var(--green)' },
    { label: 'Utilisateurs', value: m.users,             icon: '◉', accent: 'var(--accent)' },
    { label: 'Produits',     value: m.products,          icon: '▣', accent: 'var(--amber)' },
  ];

  return (
    <div className="space-y-5">
      {/* Metric cards */}
      <div className="grid grid-cols-4 gap-4">
        {cards.map((c, i) => (
          <motion.div key={c.label} initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ ...sp, delay: i * 0.05 }}
            className="card card-hover p-5 relative overflow-hidden">
            <div className="absolute -right-4 -top-4 text-[64px] opacity-[0.06] font-display" style={{ color: c.accent }}>{c.icon}</div>
            <div className="text-[11px] font-semibold uppercase tracking-widest" style={{ color: 'var(--text3)' }}>{c.label}</div>
            <div className="mt-2 font-mono text-[28px] font-bold leading-none">{c.value}</div>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-3 gap-4">
        {/* Signups chart */}
        <div className="card p-5 col-span-2">
          <div className="flex items-center justify-between mb-5">
            <h3 className="font-display text-[14px] font-bold uppercase tracking-wide">Inscriptions · 7 derniers jours</h3>
            <span className="text-[11px] font-mono" style={{ color: 'var(--text3)' }}>{m.lfg} en LFG · {m.admins} admin(s)</span>
          </div>
          <div className="flex items-end gap-3 h-[140px]">
            {(data.signups ?? []).length === 0 && (
              <div className="w-full text-center text-[13px] self-center" style={{ color: 'var(--text3)' }}>Aucune donnée récente</div>
            )}
            {(data.signups ?? []).map((s, i) => (
              <div key={s.day} className="flex-1 flex flex-col items-center gap-2">
                <div className="w-full flex items-end justify-center" style={{ height: '110px' }}>
                  <motion.div
                    initial={{ height: 0 }} animate={{ height: `${(s.count / maxSignup) * 100}%` }}
                    transition={{ ...sp, delay: i * 0.06 }}
                    className="w-full max-w-[34px] rounded-t-md relative group"
                    style={{ background: 'linear-gradient(180deg, var(--accent2), var(--accent))', minHeight: '4px' }}>
                    <span className="absolute -top-5 left-1/2 -translate-x-1/2 text-[11px] font-mono font-bold opacity-0 group-hover:opacity-100 transition">{s.count}</span>
                  </motion.div>
                </div>
                <span className="text-[10px] font-mono" style={{ color: 'var(--text3)' }}>
                  {new Date(s.day).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' })}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Stock + quick numbers */}
        <div className="card p-5 flex flex-col">
          <h3 className="font-display text-[14px] font-bold uppercase tracking-wide mb-4">Inventaire</h3>
          <div className="flex-1 flex flex-col items-center justify-center text-center">
            <div className="font-mono text-[42px] font-bold leading-none">{m.stock}</div>
            <div className="text-[12px] mt-1" style={{ color: 'var(--text3)' }}>unités en stock</div>
          </div>
          <div className="grid grid-cols-2 gap-3 mt-4">
            <div className="rounded-lg p-3" style={{ background: 'var(--raised)' }}>
              <div className="font-mono text-[18px] font-bold">{m.products}</div>
              <div className="text-[10px] uppercase tracking-wider" style={{ color: 'var(--text3)' }}>Produits</div>
            </div>
            <div className="rounded-lg p-3" style={{ background: 'var(--raised)' }}>
              <div className="font-mono text-[18px] font-bold">{m.admins}</div>
              <div className="text-[10px] uppercase tracking-wider" style={{ color: 'var(--text3)' }}>Admins</div>
            </div>
          </div>
        </div>
      </div>

      {/* Recent orders + users */}
      <div className="grid grid-cols-2 gap-4">
        <div className="card overflow-hidden">
          <h3 className="font-display text-[14px] font-bold uppercase tracking-wide px-5 py-4" style={{ borderBottom: '1px solid var(--border)' }}>Dernières commandes</h3>
          <div className="divide-y" style={{ borderColor: 'var(--border)' }}>
            {(data.recentOrders ?? []).length === 0 && <Empty>Aucune commande</Empty>}
            {(data.recentOrders ?? []).map(o => (
              <div key={o.id} className="flex items-center gap-3 px-5 py-3">
                <span className="font-mono text-[12px]" style={{ color: 'var(--text3)' }}>#{o.id}</span>
                <span className="flex-1 text-[13px] truncate">{o.username ?? 'Inconnu'}</span>
                <StatusBadge status={o.status} />
                <span className="font-mono text-[13px] font-semibold">{fmtPrice(o.total_ttc)}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="card overflow-hidden">
          <h3 className="font-display text-[14px] font-bold uppercase tracking-wide px-5 py-4" style={{ borderBottom: '1px solid var(--border)' }}>Nouveaux membres</h3>
          <div className="divide-y" style={{ borderColor: 'var(--border)' }}>
            {(data.recentUsers ?? []).map(u => (
              <div key={u.id} className="flex items-center gap-3 px-5 py-3">
                <div className="h-7 w-7 rounded-full flex items-center justify-center text-[11px] font-bold text-white shrink-0"
                  style={{ background: 'linear-gradient(150deg, var(--accent2), var(--accent))' }}>
                  {u.username.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[13px] font-semibold truncate flex items-center gap-1.5">
                    {u.username}
                    {u.is_admin === 1 && <span className="rounded px-1 text-[9px] font-bold" style={{ background: 'rgba(70,194,255,0.15)', color: 'var(--accent2)' }}>ADMIN</span>}
                  </div>
                  <div className="text-[11px] truncate" style={{ color: 'var(--text3)' }}>{u.email}</div>
                </div>
                <span className="text-[11px] font-mono shrink-0" style={{ color: 'var(--text3)' }}>{fmtDate(u.created_at)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

// ════════════════════════════════════════════════════════════════════════════════
//  USERS
// ════════════════════════════════════════════════════════════════════════════════

const UsersPanel: React.FC<{ currentUserId: string }> = ({ currentUserId }) => {
  const [users, setUsers]     = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch]   = useState('');
  const [editing, setEditing] = useState<AdminUser | null>(null);
  const [deleting, setDeleting] = useState<AdminUser | null>(null);
  const [busy, setBusy]       = useState(false);
  const [error, setError]     = useState<string | null>(null);

  const load = () => { setLoading(true); platformApi.adminGetUsers().then(r => { setUsers(r.users ?? []); setLoading(false); }); };
  useEffect(load, []);

  const filtered = users.filter(u =>
    u.username.toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase()));

  const saveEdit = async (updates: { username: string; email: string; isAdmin: boolean }) => {
    if (!editing) return;
    setBusy(true); setError(null);
    const r = await platformApi.adminUpdateUser(editing.id, updates);
    setBusy(false);
    if (!r.success) { setError(r.error ?? 'Erreur'); return; }
    setEditing(null); load();
  };

  const doDelete = async () => {
    if (!deleting) return;
    setBusy(true);
    const r = await platformApi.adminDeleteUser(deleting.id);
    setBusy(false);
    if (!r.success) { setError(r.error ?? 'Erreur'); setDeleting(null); return; }
    setDeleting(null); load();
  };

  if (loading) return <PanelLoader />;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <SearchInput value={search} onChange={setSearch} placeholder="Rechercher un utilisateur…" />
        <span className="ml-auto text-[13px] font-mono" style={{ color: 'var(--text3)' }}>{filtered.length} / {users.length} utilisateurs</span>
      </div>

      {error && <ErrorBar msg={error} onClose={() => setError(null)} />}

      <div className="card overflow-hidden">
        <table className="w-full">
          <thead>
            <tr style={{ background: 'var(--surface)' }}>
              {['ID', 'Utilisateur', 'Email', 'Rang', 'LFG', 'Rôle', 'Inscrit', ''].map(h => (
                <th key={h} className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider" style={{ color: 'var(--text3)', borderBottom: '1px solid var(--border)' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map(u => (
              <tr key={u.id} className="transition hover:bg-white/[0.02]" style={{ borderBottom: '1px solid var(--border)' }}>
                <td className="px-4 py-3 font-mono text-[12px]" style={{ color: 'var(--text3)' }}>#{u.id}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2.5">
                    <div className="h-7 w-7 rounded-full flex items-center justify-center text-[11px] font-bold text-white shrink-0"
                      style={{ background: 'linear-gradient(150deg, var(--accent2), var(--accent))' }}>{u.username.charAt(0).toUpperCase()}</div>
                    <span className="text-[13px] font-semibold">{u.username}</span>
                  </div>
                </td>
                <td className="px-4 py-3 text-[13px]" style={{ color: 'var(--text2)' }}>{u.email}</td>
                <td className="px-4 py-3 text-[12px]" style={{ color: 'var(--text2)' }}>{u.rank_label || '—'}</td>
                <td className="px-4 py-3">
                  {u.show_in_lfg === 1
                    ? <span className="h-2 w-2 rounded-full inline-block" style={{ background: 'var(--green)' }} />
                    : <span className="h-2 w-2 rounded-full inline-block" style={{ background: 'var(--text3)' }} />}
                </td>
                <td className="px-4 py-3">
                  {u.is_admin === 1
                    ? <span className="rounded px-1.5 py-0.5 text-[10px] font-bold" style={{ background: 'rgba(70,194,255,0.15)', color: 'var(--accent2)' }}>ADMIN</span>
                    : <span className="text-[12px]" style={{ color: 'var(--text3)' }}>Membre</span>}
                </td>
                <td className="px-4 py-3 font-mono text-[11px]" style={{ color: 'var(--text3)' }}>{fmtDate(u.created_at)}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-end gap-1.5">
                    <IconBtn title="Modifier" onClick={() => { setError(null); setEditing(u); }}>
                      <path d="M11 2.5l2.5 2.5-7 7H4v-2.5l7-7z" strokeLinecap="round" strokeLinejoin="round" />
                    </IconBtn>
                    {String(u.id) !== currentUserId && (
                      <IconBtn title="Supprimer" danger onClick={() => { setError(null); setDeleting(u); }}>
                        <path d="M2 4h12M5 4V2.5h6V4M6 7v4M10 7v4M4 4l.7 9c0 .5.4.9.9.9h4.8c.5 0 .9-.4.9-.9L12 4" strokeLinecap="round" strokeLinejoin="round" />
                      </IconBtn>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {editing && <UserEditModal user={editing} busy={busy} error={error} onClose={() => setEditing(null)} onSave={saveEdit} />}
      {deleting && <Confirm text={`Supprimer définitivement « ${deleting.username} » ? Cette action est irréversible.`} busy={busy} onCancel={() => setDeleting(null)} onConfirm={doDelete} />}
    </div>
  );
};

const UserEditModal: React.FC<{ user: AdminUser; busy: boolean; error: string | null; onClose: () => void; onSave: (u: { username: string; email: string; isAdmin: boolean }) => void }> = ({ user, busy, error, onClose, onSave }) => {
  const [username, setUsername] = useState(user.username);
  const [email, setEmail]       = useState(user.email);
  const [isAdmin, setIsAdmin]   = useState(user.is_admin === 1);
  return (
    <Modal title={`Modifier · ${user.username}`} onClose={onClose}>
      <div className="space-y-4">
        <Field label="Pseudo"><input value={username} onChange={e => setUsername(e.target.value)} className="input w-full px-3.5 py-2.5 text-[14px]" /></Field>
        <Field label="Email"><input value={email} onChange={e => setEmail(e.target.value)} className="input w-full px-3.5 py-2.5 text-[14px]" /></Field>
        <div className="flex items-center justify-between rounded-xl px-4 py-3" style={{ background: 'var(--raised)' }}>
          <div>
            <div className="text-[14px] font-medium">Administrateur</div>
            <div className="text-[12px]" style={{ color: 'var(--text3)' }}>Accès complet au panneau admin</div>
          </div>
          <button onClick={() => setIsAdmin(v => !v)} className="relative h-6 w-11 rounded-full transition-colors shrink-0"
            style={{ background: isAdmin ? 'var(--accent)' : 'var(--card)' }}>
            <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition-transform ${isAdmin ? 'translate-x-5' : 'translate-x-0.5'}`} />
          </button>
        </div>
        {error && <p className="text-[13px]" style={{ color: 'var(--red)' }}>{error}</p>}
        <div className="flex justify-end gap-3 pt-1">
          <button onClick={onClose} className="btn-ghost px-4 py-2 rounded-lg text-[13px]">Annuler</button>
          <button onClick={() => onSave({ username: username.trim(), email: email.trim(), isAdmin })} disabled={busy} className="btn-primary px-5 py-2 rounded-lg text-[13px]">
            {busy ? 'Enregistrement…' : 'Enregistrer'}
          </button>
        </div>
      </div>
    </Modal>
  );
};

// ════════════════════════════════════════════════════════════════════════════════
//  PRODUCTS
// ════════════════════════════════════════════════════════════════════════════════

const emptyProduct = (): Partial<ProductRecord> => ({ name: '', price: 0, category: 'MAILLOTS', image_url: '', stock_quantity: 0 });

const ProductsPanel: React.FC = () => {
  const [products, setProducts] = useState<ProductRecord[]>([]);
  const [loading, setLoading]   = useState(true);
  const [search, setSearch]     = useState('');
  const [editing, setEditing]   = useState<Partial<ProductRecord> | null>(null);
  const [deleting, setDeleting] = useState<ProductRecord | null>(null);
  const [busy, setBusy]         = useState(false);
  const [error, setError]       = useState<string | null>(null);

  const load = () => { setLoading(true); platformApi.adminGetProducts().then(r => { setProducts(r.products ?? []); setLoading(false); }); };
  useEffect(load, []);

  const filtered = products.filter(p => p.name.toLowerCase().includes(search.toLowerCase()));

  const save = async (p: Partial<ProductRecord>) => {
    setBusy(true); setError(null);
    const r = p.id ? await platformApi.adminUpdateProduct(p.id, p) : await platformApi.adminCreateProduct(p);
    setBusy(false);
    if (!r.success) { setError(r.error ?? 'Erreur'); return; }
    setEditing(null); load();
  };

  const doDelete = async () => {
    if (!deleting) return;
    setBusy(true);
    const r = await platformApi.adminDeleteProduct(deleting.id);
    setBusy(false);
    if (!r.success) { setError(r.error ?? 'Erreur'); setDeleting(null); return; }
    setDeleting(null); load();
  };

  if (loading) return <PanelLoader />;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <SearchInput value={search} onChange={setSearch} placeholder="Rechercher un produit…" />
        <span className="ml-auto text-[13px] font-mono" style={{ color: 'var(--text3)' }}>{products.length} produits</span>
        <button onClick={() => { setError(null); setEditing(emptyProduct()); }} className="btn-primary px-4 py-2 rounded-lg text-[13px] flex items-center gap-1.5">
          <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={2} className="h-3.5 w-3.5"><path d="M8 3v10M3 8h10" strokeLinecap="round" /></svg>
          Nouveau produit
        </button>
      </div>

      {error && <ErrorBar msg={error} onClose={() => setError(null)} />}

      <div className="grid grid-cols-3 gap-4 xl:grid-cols-4">
        {filtered.map(p => (
          <div key={p.id} className="card card-hover overflow-hidden flex flex-col">
            <div className="aspect-[4/3] overflow-hidden" style={{ background: 'var(--raised)' }}>
              {p.image_url
                ? <img src={p.image_url} alt={p.name} className="h-full w-full object-cover" onError={e => { (e.target as HTMLImageElement).style.opacity = '0'; }} />
                : <div className="flex h-full items-center justify-center text-[12px]" style={{ color: 'var(--text3)' }}>Pas d'image</div>}
            </div>
            <div className="p-4 flex flex-col flex-1">
              <div className="flex items-start justify-between gap-2">
                <span className="text-[13px] font-semibold leading-snug">{p.name}</span>
                <span className="font-mono text-[14px] font-bold shrink-0" style={{ color: 'var(--accent2)' }}>{fmtPrice(p.price)}</span>
              </div>
              <div className="mt-2 flex items-center gap-2">
                <span className="rounded px-1.5 py-0.5 text-[10px] font-semibold" style={{ background: 'var(--raised)', color: 'var(--text2)' }}>{p.category}</span>
                <span className="text-[11px]" style={{ color: p.stock_quantity > 0 ? 'var(--text3)' : 'var(--red)' }}>
                  {p.stock_quantity > 0 ? `${p.stock_quantity} en stock` : 'Rupture'}
                </span>
              </div>
              <div className="mt-3 flex gap-2 pt-3" style={{ borderTop: '1px solid var(--border)' }}>
                <button onClick={() => { setError(null); setEditing(p); }} className="btn-ghost flex-1 py-1.5 rounded-lg text-[12px]">Modifier</button>
                <button onClick={() => { setError(null); setDeleting(p); }} className="rounded-lg px-3 py-1.5 text-[12px] font-semibold transition hover:bg-white/5"
                  style={{ color: 'var(--red)', border: '1px solid var(--border)' }}>Suppr.</button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {editing && <ProductEditModal product={editing} busy={busy} error={error} onClose={() => setEditing(null)} onSave={save} />}
      {deleting && <Confirm text={`Supprimer « ${deleting.name} » ?`} busy={busy} onCancel={() => setDeleting(null)} onConfirm={doDelete} />}
    </div>
  );
};

const ProductEditModal: React.FC<{ product: Partial<ProductRecord>; busy: boolean; error: string | null; onClose: () => void; onSave: (p: Partial<ProductRecord>) => void }> = ({ product, busy, error, onClose, onSave }) => {
  const [form, setForm] = useState<Partial<ProductRecord>>(product);
  const set = (k: keyof ProductRecord, v: string | number) => setForm(f => ({ ...f, [k]: v }));
  return (
    <Modal title={product.id ? `Modifier · ${product.name}` : 'Nouveau produit'} onClose={onClose} width={520}>
      <div className="space-y-4">
        <Field label="Nom"><input value={form.name ?? ''} onChange={e => set('name', e.target.value)} className="input w-full px-3.5 py-2.5 text-[14px]" /></Field>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Prix (€)"><input type="number" step="0.01" value={form.price ?? 0} onChange={e => set('price', Number(e.target.value))} className="input w-full px-3.5 py-2.5 text-[14px]" /></Field>
          <Field label="Stock"><input type="number" value={form.stock_quantity ?? 0} onChange={e => set('stock_quantity', Number(e.target.value))} className="input w-full px-3.5 py-2.5 text-[14px]" /></Field>
        </div>
        <Field label="Catégorie">
          <select value={form.category ?? 'MAILLOTS'} onChange={e => set('category', e.target.value)} className="input w-full px-3.5 py-2.5 text-[14px]">
            {CATEGORIES.map(c => <option key={c} value={c} style={{ background: 'var(--card)' }}>{c}</option>)}
          </select>
        </Field>
        <Field label="URL de l'image"><input value={form.image_url ?? ''} onChange={e => set('image_url', e.target.value)} placeholder="https://…" className="input w-full px-3.5 py-2.5 text-[13px]" /></Field>
        {form.image_url && (
          <div className="rounded-lg overflow-hidden h-28" style={{ background: 'var(--raised)' }}>
            <img src={form.image_url} alt="" className="h-full w-full object-cover" onError={e => { (e.target as HTMLImageElement).style.opacity = '0'; }} />
          </div>
        )}
        {error && <p className="text-[13px]" style={{ color: 'var(--red)' }}>{error}</p>}
        <div className="flex justify-end gap-3 pt-1">
          <button onClick={onClose} className="btn-ghost px-4 py-2 rounded-lg text-[13px]">Annuler</button>
          <button onClick={() => onSave(form)} disabled={busy || !form.name?.trim()} className="btn-primary px-5 py-2 rounded-lg text-[13px]">
            {busy ? 'Enregistrement…' : product.id ? 'Enregistrer' : 'Créer'}
          </button>
        </div>
      </div>
    </Modal>
  );
};

// ════════════════════════════════════════════════════════════════════════════════
//  ORDERS
// ════════════════════════════════════════════════════════════════════════════════

const OrdersPanel: React.FC = () => {
  const [orders, setOrders]   = useState<AdminOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<number | null>(null);
  const [statusFilter, setStatusFilter] = useState('ALL');

  const load = () => { setLoading(true); platformApi.adminGetOrders().then(r => { setOrders(r.orders ?? []); setLoading(false); }); };
  useEffect(load, []);

  const changeStatus = async (id: number, status: string) => {
    setOrders(prev => prev.map(o => o.id === id ? { ...o, status } : o)); // optimistic
    await platformApi.adminUpdateOrder(id, status);
  };

  const filtered = statusFilter === 'ALL' ? orders : orders.filter(o => o.status === statusFilter);
  const revenue = useMemo(() => orders.filter(o => o.status !== 'Cancelled').reduce((s, o) => s + o.total_ttc, 0), [orders]);

  if (loading) return <PanelLoader />;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 flex-wrap">
        {['ALL', ...ORDER_STATUSES].map(s => (
          <button key={s} onClick={() => setStatusFilter(s)} className="px-3 py-1.5 rounded-lg text-[12px] font-semibold transition"
            style={statusFilter === s ? { background: 'var(--accent)', color: '#fff' } : { background: 'var(--surface)', color: 'var(--text2)', border: '1px solid var(--border)' }}>
            {s === 'ALL' ? 'Toutes' : s}
          </button>
        ))}
        <span className="ml-auto text-[13px] font-mono" style={{ color: 'var(--text3)' }}>
          {filtered.length} commandes · {fmtPrice(revenue)} de revenu
        </span>
      </div>

      {orders.length === 0 && <div className="card"><Empty>Aucune commande pour le moment</Empty></div>}

      <div className="card overflow-hidden">
        {filtered.map((o, i) => (
          <div key={o.id} style={{ borderBottom: i < filtered.length - 1 ? '1px solid var(--border)' : undefined }}>
            <div className="flex items-center gap-4 px-5 py-3.5 transition hover:bg-white/[0.02] cursor-pointer" onClick={() => setExpanded(expanded === o.id ? null : o.id)}>
              <span className="font-mono text-[12px] w-12" style={{ color: 'var(--text3)' }}>#{o.id}</span>
              <div className="flex-1 min-w-0">
                <div className="text-[13px] font-semibold truncate">{o.username ?? 'Utilisateur supprimé'}</div>
                <div className="text-[11px]" style={{ color: 'var(--text3)' }}>{fmtDate(o.created_at)} · {o.payment_method}</div>
              </div>
              <span className="text-[12px]" style={{ color: 'var(--text3)' }}>{o.items.length} article{o.items.length > 1 ? 's' : ''}</span>
              <span className="font-mono text-[14px] font-bold w-20 text-right">{fmtPrice(o.total_ttc)}</span>
              <select value={o.status} onClick={e => e.stopPropagation()} onChange={e => changeStatus(o.id, e.target.value)}
                className="input px-2.5 py-1.5 text-[12px] font-semibold" style={{ color: STATUS_STYLE[o.status]?.color }}>
                {ORDER_STATUSES.map(s => <option key={s} value={s} style={{ background: 'var(--card)', color: 'var(--text1)' }}>{s}</option>)}
              </select>
              <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={2} className={`h-4 w-4 transition-transform ${expanded === o.id ? 'rotate-180' : ''}`} style={{ color: 'var(--text3)' }}><path d="M4 6l4 4 4-4" strokeLinecap="round" /></svg>
            </div>
            <AnimatePresence>
              {expanded === o.id && (
                <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                  <div className="px-5 pb-4 pt-1 ml-16">
                    {o.items.length === 0 && <p className="text-[12px]" style={{ color: 'var(--text3)' }}>Aucun détail d'articles</p>}
                    {o.items.map((it, idx) => (
                      <div key={idx} className="flex items-center gap-3 py-1.5 text-[13px]">
                        <span className="font-mono text-[12px]" style={{ color: 'var(--text3)' }}>{it.quantity}×</span>
                        <span className="flex-1">{it.name}</span>
                        <span className="font-mono" style={{ color: 'var(--text2)' }}>{fmtPrice(it.price)}</span>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        ))}
      </div>
    </div>
  );
};

// ─── Tiny helpers ────────────────────────────────────────────────────────────────

const PanelLoader = () => (
  <div className="flex items-center justify-center py-24">
    <div className="flex gap-1.5">
      {[0, 1, 2].map(i => (
        <motion.div key={i} className="h-2 w-2 rounded-full" style={{ background: 'var(--accent2)' }}
          animate={{ opacity: [0.3, 1, 0.3] }} transition={{ duration: 1, repeat: Infinity, delay: i * 0.15 }} />
      ))}
    </div>
  </div>
);

const PanelError: React.FC<{ msg: string }> = ({ msg }) => (
  <div className="card p-10 text-center">
    <div className="text-3xl mb-3">⚠️</div>
    <div className="text-[14px] font-semibold mb-1">Impossible de charger les données</div>
    <div className="text-[13px]" style={{ color: 'var(--text3)' }}>{msg}</div>
    <div className="text-[12px] mt-3" style={{ color: 'var(--text3)' }}>Vérifie que le serveur API tourne (npm run api).</div>
  </div>
);

const Empty: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="px-5 py-10 text-center text-[13px]" style={{ color: 'var(--text3)' }}>{children}</div>
);

const SearchInput: React.FC<{ value: string; onChange: (v: string) => void; placeholder: string }> = ({ value, onChange, placeholder }) => (
  <div className="relative">
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth={1.7} className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 pointer-events-none" style={{ color: 'var(--text3)' }}>
      <circle cx="9" cy="9" r="6" /><path d="m14 14 3 3" strokeLinecap="round" />
    </svg>
    <input value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} className="input pl-9 pr-4 py-2 w-72 text-[13px]" />
  </div>
);

const IconBtn: React.FC<{ title: string; onClick: () => void; danger?: boolean; children: React.ReactNode }> = ({ title, onClick, danger, children }) => (
  <button title={title} onClick={onClick} className="rounded-lg p-2 transition hover:bg-white/8"
    style={{ color: danger ? 'var(--red)' : 'var(--text2)' }}>
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={1.6} className="h-4 w-4">{children}</svg>
  </button>
);

const ErrorBar: React.FC<{ msg: string; onClose: () => void }> = ({ msg, onClose }) => (
  <div className="flex items-center gap-3 rounded-xl px-4 py-3 text-[13px]" style={{ background: 'rgba(255,90,110,0.1)', border: '1px solid rgba(255,90,110,0.25)', color: 'var(--red)' }}>
    <span className="flex-1">{msg}</span>
    <button onClick={onClose} className="opacity-70 hover:opacity-100">✕</button>
  </div>
);

// ════════════════════════════════════════════════════════════════════════════════
//  PAGE
// ════════════════════════════════════════════════════════════════════════════════

const TABS: { id: Tab; label: string; icon: React.ReactNode }[] = [
  { id: 'overview', label: "Vue d'ensemble", icon: <path d="M2 2h5v5H2zM9 2h5v5H9zM2 9h5v5H2zM9 9h5v5H9z" /> },
  { id: 'users',    label: 'Utilisateurs',   icon: <path d="M6 7a2.5 2.5 0 100-5 2.5 2.5 0 000 5zM10 14v-1a4 4 0 00-8 0v1M11 7a2.5 2.5 0 100-5M14 14v-1a4 4 0 00-3-3.87" strokeLinecap="round" strokeLinejoin="round" /> },
  { id: 'products', label: 'Produits',       icon: <path d="M2 5l6-3 6 3v6l-6 3-6-3V5zM2 5l6 3 6-3M8 8v6" strokeLinecap="round" strokeLinejoin="round" /> },
  { id: 'orders',   label: 'Commandes',      icon: <path d="M5 2v2M11 2v2M2 5h12v8a1 1 0 01-1 1H3a1 1 0 01-1-1V5zM5 8h6M5 11h4" strokeLinecap="round" strokeLinejoin="round" /> },
];

const AdminPage: React.FC = () => {
  const { user } = useAuth();
  const [tab, setTab] = useState<Tab>('overview');

  if (!user?.isAdmin) {
    return (
      <div className="page-enter flex h-full items-center justify-center p-6">
        <div className="card p-10 text-center max-w-md">
          <div className="text-4xl mb-4">🔒</div>
          <h2 className="font-display text-[20px] font-bold uppercase tracking-wide mb-2">Accès refusé</h2>
          <p className="text-[14px]" style={{ color: 'var(--text2)' }}>Cette section est réservée aux administrateurs.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="page-enter h-full overflow-y-auto p-6 space-y-5">
      {/* Header */}
      <div className="flex items-end justify-between">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="font-display text-[26px] font-bold uppercase tracking-wide">Panneau d'administration</h1>
            <span className="rounded-md px-2 py-0.5 text-[11px] font-bold tracking-wider" style={{ background: 'rgba(70,194,255,0.15)', color: 'var(--accent2)' }}>ADMIN</span>
          </div>
          <p className="text-[14px] mt-1" style={{ color: 'var(--text2)' }}>Gère les utilisateurs, la boutique et les commandes de B3 Esport.</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 rounded-xl w-fit" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-[13px] font-semibold transition"
            style={tab === t.id ? { background: 'var(--accent)', color: '#fff' } : { color: 'var(--text2)' }}>
            <svg viewBox="0 0 16 16" fill={t.id === 'overview' ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth={1.5} className="h-4 w-4">{t.icon}</svg>
            {t.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <AnimatePresence mode="wait">
        <motion.div key={tab} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.18 }}>
          {tab === 'overview' && <Dashboard />}
          {tab === 'users'    && <UsersPanel currentUserId={user.id} />}
          {tab === 'products' && <ProductsPanel />}
          {tab === 'orders'   && <OrdersPanel />}
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

export default AdminPage;
