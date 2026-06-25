// Order confirmation + order detail modals. Extracted from B3App; both are
// self-contained overlays driven entirely by their props.
import React from 'react';
import type { UserOrder } from '../../services/platformApi';
import type { CartLine } from '../B3App';
import { C, DISP, MONO, UI, ORDER_STATUS_COLOR, eur } from './theme';

// Snapshot frozen at checkout so the recap survives the cart reset.
export interface Receipt {
  id: number; items: CartLine[]; subtotal: number; discount: number; total: number;
  count: number; method: string; promoCode: string | null; date: Date;
}

export const ReceiptModal: React.FC<{
  receipt: Receipt; onClose: () => void; onContinue: () => void; onViewOrders: () => void;
}> = ({ receipt, onClose, onContinue, onViewOrders }) => (
  <div onClick={onClose}
    style={{ position: 'fixed', inset: 0, zIndex: 60, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, background: 'rgba(20,18,16,.72)' }}>
    <div onClick={ev => ev.stopPropagation()} role="dialog" aria-modal="true"
      style={{ width: '100%', maxWidth: 460, maxHeight: '88vh', overflowY: 'auto', background: C.paper, border: `2px solid ${C.ink}`, boxShadow: '10px 10px 0 rgba(20,18,16,.18)' }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '20px 24px', borderBottom: `2px solid ${C.ink}` }}>
        <span style={{ height: 40, width: 40, flex: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', background: C.green, color: '#fff', fontSize: 22, fontWeight: 800 }}>✓</span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ margin: 0, fontFamily: DISP, fontSize: 24, letterSpacing: '.01em', textTransform: 'uppercase', lineHeight: 1 }}>Commande confirmée</p>
          <p style={{ margin: '5px 0 0', fontFamily: MONO, fontSize: 10.5, letterSpacing: '.08em', color: C.muted }}>// PAIEMENT ACCEPTÉ — MERCI</p>
        </div>
        <button onClick={onClose} title="Fermer" style={{ height: 30, width: 30, flex: 'none', border: `1.5px solid ${C.ink}`, background: C.paper, fontFamily: MONO, fontSize: 15, fontWeight: 700, cursor: 'pointer' }}>×</button>
      </div>

      {/* Meta */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)' }}>
        {[
          { k: 'Commande', v: `#${receipt.id}` },
          { k: 'Date', v: receipt.date.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' }) },
          { k: 'Paiement', v: receipt.method === 'Card' ? 'Carte' : receipt.method },
        ].map((f, i) => (
          <div key={f.k} style={{ padding: '13px 16px', borderBottom: `1px solid ${C.line}`, borderRight: i < 2 ? `1px solid ${C.line}` : 0 }}>
            <p style={{ margin: 0, fontFamily: MONO, fontSize: 9, letterSpacing: '.14em', textTransform: 'uppercase', color: C.muted }}>{f.k}</p>
            <p style={{ margin: '5px 0 0', fontFamily: UI, fontSize: 14, fontWeight: 800, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{f.v}</p>
          </div>
        ))}
      </div>

      {/* Items */}
      <div style={{ padding: '8px 24px 4px' }}>
        <p style={{ margin: '12px 0 8px', fontFamily: MONO, fontSize: 10, letterSpacing: '.14em', textTransform: 'uppercase', color: C.muted }}>Articles · {receipt.count}</p>
        {receipt.items.map((it, i) => (
          <div key={it.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0', borderBottom: i < receipt.items.length - 1 ? `1px solid ${C.line}` : 0 }}>
            <span style={{ height: 40, width: 40, flex: 'none', background: C.paper3, overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {it.img ? <img src={it.img} alt={it.name} style={{ height: '100%', width: '100%', objectFit: 'cover' }} /> : <span style={{ fontFamily: MONO, fontSize: 8, color: C.muted }}>//</span>}
            </span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ margin: 0, fontFamily: UI, fontSize: 13.5, fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={it.name}>{it.name}</p>
              <p style={{ margin: '3px 0 0', fontFamily: MONO, fontSize: 10.5, color: C.muted }}>×{it.quantity}</p>
            </div>
            <span style={{ flex: 'none', fontFamily: MONO, fontSize: 13, fontWeight: 700, color: C.red }}>{eur(it.price * it.quantity)}</span>
          </div>
        ))}
      </div>

      {/* Totals */}
      <div style={{ padding: '14px 24px', borderTop: `1px solid ${C.line}` }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: MONO, fontSize: 12, color: C.ink2 }}>
          <span>Sous-total</span><span>{eur(receipt.subtotal)}</span>
        </div>
        {receipt.discount > 0 && (
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6, fontFamily: MONO, fontSize: 12, color: C.green }}>
            <span>Remise{receipt.promoCode ? ` · ${receipt.promoCode}` : ''}</span><span>−{eur(receipt.discount)}</span>
          </div>
        )}
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginTop: 12, paddingTop: 12, borderTop: `2px solid ${C.ink}` }}>
          <span style={{ fontFamily: UI, fontSize: 13, fontWeight: 800, letterSpacing: '.04em', textTransform: 'uppercase' }}>Total TTC</span>
          <span style={{ fontFamily: DISP, fontSize: 30, lineHeight: 1, color: C.red }}>{eur(receipt.total)}</span>
        </div>
      </div>

      {/* Actions */}
      <div style={{ display: 'flex', gap: 12, padding: '4px 24px 24px' }}>
        <button onClick={onContinue}
          style={{ flex: 1, padding: '13px 0', border: `1.5px solid ${C.ink}`, background: C.paper, fontFamily: UI, fontSize: 13, fontWeight: 800, letterSpacing: '.03em', textTransform: 'uppercase', cursor: 'pointer' }}>Continuer</button>
        <button onClick={onViewOrders} className="b3-btn-ink"
          style={{ flex: 1, padding: '13px 0', border: 0, background: C.ink, color: C.paper, fontFamily: UI, fontSize: 13, fontWeight: 800, letterSpacing: '.03em', textTransform: 'uppercase', cursor: 'pointer' }}>Mes commandes</button>
      </div>
    </div>
  </div>
);

export const OrderDetailModal: React.FC<{ order: UserOrder; onClose: () => void }> = ({ order: o, onClose }) => {
  const sub = o.items.reduce((s, it) => s + it.price * it.quantity, 0);
  const disc = Math.max(0, Math.round((sub - o.total_ttc) * 100) / 100);
  const statusColor = ORDER_STATUS_COLOR[o.status] || C.ink2;
  return (
    <div onClick={onClose}
      style={{ position: 'fixed', inset: 0, zIndex: 60, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, background: 'rgba(20,18,16,.72)' }}>
      <div onClick={ev => ev.stopPropagation()} role="dialog" aria-modal="true"
        style={{ width: '100%', maxWidth: 460, maxHeight: '88vh', overflowY: 'auto', background: C.paper, border: `2px solid ${C.ink}`, boxShadow: '10px 10px 0 rgba(20,18,16,.18)' }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '20px 24px', borderBottom: `2px solid ${C.ink}` }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ margin: 0, fontFamily: DISP, fontSize: 26, letterSpacing: '.01em', lineHeight: 1 }}>Commande #{o.id}</p>
            <p style={{ margin: '6px 0 0', fontFamily: MONO, fontSize: 10.5, letterSpacing: '.08em', color: C.muted }}>// DÉTAIL DE LA COMMANDE</p>
          </div>
          <button onClick={onClose} title="Fermer" style={{ height: 30, width: 30, flex: 'none', border: `1.5px solid ${C.ink}`, background: C.paper, fontFamily: MONO, fontSize: 15, fontWeight: 700, cursor: 'pointer' }}>×</button>
        </div>

        {/* Meta */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)' }}>
          {[
            { k: 'Date', v: new Date(o.created_at).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' }) },
            { k: 'Paiement', v: o.payment_method === 'Card' ? 'Carte' : o.payment_method },
            { k: 'Statut', v: o.status.toUpperCase(), color: statusColor },
          ].map((f, i) => (
            <div key={f.k} style={{ padding: '13px 16px', borderBottom: `1px solid ${C.line}`, borderRight: i < 2 ? `1px solid ${C.line}` : 0 }}>
              <p style={{ margin: 0, fontFamily: MONO, fontSize: 9, letterSpacing: '.14em', textTransform: 'uppercase', color: C.muted }}>{f.k}</p>
              <p style={{ margin: '5px 0 0', fontFamily: UI, fontSize: 14, fontWeight: 800, color: f.color || C.ink, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{f.v}</p>
            </div>
          ))}
        </div>

        {/* Items */}
        <div style={{ padding: '8px 24px 4px' }}>
          <p style={{ margin: '12px 0 8px', fontFamily: MONO, fontSize: 10, letterSpacing: '.14em', textTransform: 'uppercase', color: C.muted }}>Articles · {o.items.reduce((s, it) => s + it.quantity, 0)}</p>
          {o.items.length === 0
            ? <p style={{ margin: '0 0 8px', fontFamily: MONO, fontSize: 11, color: C.muted }}>Aucun article enregistré.</p>
            : o.items.map((it, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0', borderBottom: i < o.items.length - 1 ? `1px solid ${C.line}` : 0 }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ margin: 0, fontFamily: UI, fontSize: 13.5, fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={it.name}>{it.name}</p>
                  <p style={{ margin: '3px 0 0', fontFamily: MONO, fontSize: 10.5, color: C.muted }}>{eur(it.price)} × {it.quantity}</p>
                </div>
                <span style={{ flex: 'none', fontFamily: MONO, fontSize: 13, fontWeight: 700, color: C.red }}>{eur(it.price * it.quantity)}</span>
              </div>
            ))}
        </div>

        {/* Totals */}
        <div style={{ padding: '14px 24px 24px', borderTop: `1px solid ${C.line}` }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: MONO, fontSize: 12, color: C.ink2 }}>
            <span>Sous-total</span><span>{eur(sub)}</span>
          </div>
          {disc > 0 && (
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6, fontFamily: MONO, fontSize: 12, color: C.green }}>
              <span>Remise</span><span>−{eur(disc)}</span>
            </div>
          )}
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginTop: 12, paddingTop: 12, borderTop: `2px solid ${C.ink}` }}>
            <span style={{ fontFamily: UI, fontSize: 13, fontWeight: 800, letterSpacing: '.04em', textTransform: 'uppercase' }}>Total TTC</span>
            <span style={{ fontFamily: DISP, fontSize: 30, lineHeight: 1, color: C.red }}>{eur(o.total_ttc)}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
