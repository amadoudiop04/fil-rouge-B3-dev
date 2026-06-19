import React, { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { User } from '../contexts/AuthContext';

interface SettingsPageProps {
  user: User;
  onNavigate: (page: string) => void;
}

const sp = { type: 'spring' as const, stiffness: 400, damping: 30 };

const Toggle: React.FC<{ on: boolean; onChange: (v: boolean) => void }> = ({ on, onChange }) => (
  <button type="button" onClick={() => onChange(!on)} className={`toggle ${on ? 'on' : ''}`}>
    <div className="toggle-knob" />
  </button>
);

/* Desktop-style centered modal (replaces bottom sheet) */
const Modal: React.FC<{ open: boolean; onClose: () => void; title: string; children: React.ReactNode }> = ({ open, onClose, title, children }) => (
  <AnimatePresence>
    {open && (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm"
        onClick={onClose}>
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} transition={sp}
          className="w-full max-w-md overflow-hidden rounded-2xl shadow-2xl shadow-black/60"
          style={{ background: 'var(--card)', border: '1px solid var(--border)' }}
          onClick={e => e.stopPropagation()}>
          <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: '1px solid var(--border)' }}>
            <h3 className="text-[17px] font-bold">{title}</h3>
            <button type="button" onClick={onClose}
              className="flex h-7 w-7 items-center justify-center rounded-lg text-[16px] transition hover:bg-white/10"
              style={{ color: 'var(--text3)' }}>✕</button>
          </div>
          <div className="p-5 space-y-3 text-[14px]" style={{ color: 'var(--text2)' }}>
            {children}
          </div>
        </motion.div>
      </motion.div>
    )}
  </AnimatePresence>
);

const Row: React.FC<{ label: string; sub?: string; right: React.ReactNode; last?: boolean }> = ({ label, sub, right, last }) => (
  <div className="flex items-center justify-between px-5 py-4"
    style={last ? undefined : { borderBottom: '1px solid var(--border)' }}>
    <div>
      <span className="text-[14px] font-medium">{label}</span>
      {sub && <p className="mt-0.5 text-[12px]" style={{ color: 'var(--text3)' }}>{sub}</p>}
    </div>
    {right}
  </div>
);

const BtnRow: React.FC<{ label: string; sub?: string; onClick: () => void; color?: string; last?: boolean }> = ({ label, sub, onClick, color, last }) => (
  <motion.button whileTap={{ scale: 0.99 }} transition={sp} onClick={onClick}
    className="flex w-full items-center justify-between px-5 py-4 text-left transition hover:bg-white/5"
    style={{ borderTop: last === false ? undefined : '1px solid var(--border)', color: color ?? 'var(--text1)' }}>
    <div>
      <span className="text-[14px] font-medium">{label}</span>
      {sub && <p className="mt-0.5 text-[12px]" style={{ color: 'var(--text3)' }}>{sub}</p>}
    </div>
    {!color && (
      <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={2} className="h-4 w-4" style={{ color: 'var(--text3)' }}>
        <path d="M6 12l4-4-4-4"/>
      </svg>
    )}
  </motion.button>
);

const SectionTitle: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <p className="mb-2 text-[11px] font-semibold uppercase tracking-widest" style={{ color: 'var(--text3)' }}>{children}</p>
);

export const SettingsPage: React.FC<SettingsPageProps> = ({ onNavigate }) => {
  const [notifs, setNotifs] = useState(true);
  const [sound, setSound]   = useState(true);
  const [autoUp, setAutoUp] = useState(true);
  const [lang, setLang]     = useState('Français');

  const [pwModal, setPwModal]   = useState(false);
  const [delModal, setDelModal] = useState(false);
  const [termsModal, setTerms]  = useState(false);
  const [privModal, setPriv]    = useState(false);
  const [licModal, setLic]      = useState(false);

  const [curPw, setCurPw]   = useState('');
  const [newPw, setNewPw]   = useState('');
  const [confPw, setConfPw] = useState('');
  const [pwErr, setPwErr]   = useState('');
  const [pwOk, setPwOk]     = useState(false);
  const [delConf, setDelConf] = useState('');
  const [delErr, setDelErr]   = useState('');

  useEffect(() => {
    const map: Record<string, (v: string) => void> = {
      'settings-notifications': v => setNotifs(v === 'true'),
      'settings-sound':         v => setSound(v === 'true'),
      'settings-auto-update':   v => setAutoUp(v === 'true'),
      'settings-language':      setLang,
    };
    Object.entries(map).forEach(([k, fn]) => { const v = localStorage.getItem(k); if (v !== null) fn(v); });
  }, []);

  const save = (key: string, val: boolean) => localStorage.setItem(`settings-${key}`, String(val));

  const doChangePw = () => {
    setPwErr('');
    if (!curPw || !newPw || !confPw) { setPwErr('Tous les champs sont requis'); return; }
    if (newPw.length < 6) { setPwErr('6 caractères minimum'); return; }
    if (newPw !== confPw) { setPwErr('Les mots de passe ne correspondent pas'); return; }
    setPwOk(true);
    setTimeout(() => { setPwModal(false); setPwOk(false); setCurPw(''); setNewPw(''); setConfPw(''); }, 1500);
  };

  const doDelete = () => {
    if (delConf !== 'SUPPRIMER') { setDelErr('Tapez exactement "SUPPRIMER"'); return; }
    window.location.href = '/';
  };

  return (
    <>
      <div className="page-enter h-full overflow-y-auto p-6">
        <div className="grid grid-cols-2 gap-6 max-w-4xl">

          {/* Left column */}
          <div className="space-y-6">

            {/* General */}
            <div>
              <SectionTitle>Général</SectionTitle>
              <div className="card overflow-hidden">
                <Row label="Langue" sub="Interface de l'application" right={
                  <select value={lang} onChange={e => { setLang(e.target.value); localStorage.setItem('settings-language', e.target.value); }}
                    className="rounded-lg px-3 py-1.5 text-[13px] font-semibold outline-none cursor-pointer"
                    style={{ background: 'var(--raised)', color: 'var(--violet2)', border: '1px solid var(--border)' }}>
                    <option value="Français" className="bg-zinc-900 text-white">Français</option>
                    <option value="English"  className="bg-zinc-900 text-white">English</option>
                  </select>
                } />
                <Row label="Version" sub="B3 Esport Platform" last right={
                  <span className="rounded-full px-2.5 py-1 text-[12px] font-semibold"
                    style={{ background: 'var(--raised)', color: 'var(--text3)' }}>
                    v1.0.0
                  </span>
                } />
              </div>
            </div>

            {/* Notifications */}
            <div>
              <SectionTitle>Notifications</SectionTitle>
              <div className="card overflow-hidden">
                <Row label="Notifications push" sub="Résultats, tournois, etc." right={
                  <Toggle on={notifs} onChange={v => { setNotifs(v); save('notifications', v); }} />
                } />
                <Row label="Sons" sub="Effets sonores de l'interface" last right={
                  <Toggle on={sound} onChange={v => { setSound(v); save('sound', v); }} />
                } />
              </div>
            </div>

            {/* Application */}
            <div>
              <SectionTitle>Application</SectionTitle>
              <div className="card overflow-hidden">
                <Row label="Mises à jour automatiques" sub="Installer les nouvelles versions" last right={
                  <Toggle on={autoUp} onChange={v => { setAutoUp(v); save('auto-update', v); }} />
                } />
              </div>
            </div>

          </div>

          {/* Right column */}
          <div className="space-y-6">

            {/* Account */}
            <div>
              <SectionTitle>Compte</SectionTitle>
              <div className="card overflow-hidden">
                <BtnRow label="Modifier le profil" sub="Nom, email, avatar" onClick={() => onNavigate('profile')} last={false} />
                <BtnRow label="Changer le mot de passe" sub="Sécuriser votre compte" onClick={() => setPwModal(true)} />
                <BtnRow label="Supprimer le compte" sub="Action irréversible" onClick={() => setDelModal(true)} color="var(--red)" />
              </div>
            </div>

            {/* About */}
            <div>
              <SectionTitle>À propos</SectionTitle>
              <div className="card overflow-hidden">
                <BtnRow label="Conditions d'utilisation" sub="Règles et politique" onClick={() => setTerms(true)} last={false} />
                <BtnRow label="Confidentialité" sub="RGPD et données personnelles" onClick={() => setPriv(true)} />
                <BtnRow label="Licences open source" sub="Bibliothèques utilisées" onClick={() => setLic(true)} />
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* Change password modal */}
      <Modal open={pwModal} onClose={() => setPwModal(false)} title="Changer le mot de passe">
        {pwOk ? (
          <p className="font-semibold" style={{ color: 'var(--green)' }}>✓ Mot de passe modifié !</p>
        ) : (
          <div className="space-y-3">
            {pwErr && <p className="text-[13px]" style={{ color: 'var(--red)' }}>{pwErr}</p>}
            {[
              { label: 'Mot de passe actuel', val: curPw, set: setCurPw },
              { label: 'Nouveau mot de passe', val: newPw, set: setNewPw },
              { label: 'Confirmation', val: confPw, set: setConfPw },
            ].map(f => (
              <div key={f.label}>
                <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-widest" style={{ color: 'var(--text3)' }}>
                  {f.label}
                </label>
                <input type="password" value={f.val} onChange={e => f.set(e.target.value)}
                  placeholder="••••••••" className="input w-full px-4 py-3 text-[14px]" />
              </div>
            ))}
            <motion.button whileTap={{ scale: 0.97 }} transition={sp}
              onClick={doChangePw} className="btn-primary w-full py-3 text-[14px]">
              Confirmer
            </motion.button>
          </div>
        )}
      </Modal>

      {/* Delete account modal */}
      <Modal open={delModal} onClose={() => setDelModal(false)} title="Supprimer le compte">
        <div className="rounded-xl p-4" style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)' }}>
          <p className="text-[13px] font-semibold" style={{ color: 'var(--red)' }}>
            ⚠ Cette action est <strong>irréversible</strong>. Toutes vos données seront définitivement supprimées.
          </p>
        </div>
        {delErr && <p className="text-[13px]" style={{ color: 'var(--red)' }}>{delErr}</p>}
        <div>
          <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-widest" style={{ color: 'var(--text3)' }}>
            Tapez SUPPRIMER pour confirmer
          </label>
          <input type="text" value={delConf} onChange={e => setDelConf(e.target.value.toUpperCase())}
            placeholder="SUPPRIMER" className="input w-full px-4 py-3 text-[14px]" />
        </div>
        <motion.button whileTap={{ scale: 0.97 }} transition={sp}
          onClick={doDelete} disabled={delConf !== 'SUPPRIMER'}
          className="w-full rounded-xl py-3 text-[14px] font-semibold text-white disabled:opacity-40 transition"
          style={{ background: 'var(--red)' }}>
          Supprimer définitivement
        </motion.button>
      </Modal>

      {/* Legal modals */}
      <Modal open={termsModal} onClose={() => setTerms(false)} title="Conditions d'utilisation">
        <p><strong>1. Acceptation</strong><br/>En utilisant B3 Esport, vous acceptez ces conditions.</p>
        <p><strong>2. Droits</strong><br/>Usage personnel et non commercial uniquement.</p>
        <p><strong>3. Responsabilité</strong><br/>Vous êtes responsable de la confidentialité de vos identifiants.</p>
      </Modal>
      <Modal open={privModal} onClose={() => setPriv(false)} title="Confidentialité">
        <p><strong>1. Collecte</strong><br/>Nous collectons uniquement les données que vous fournissez.</p>
        <p><strong>2. Utilisation</strong><br/>Vos données servent à personnaliser votre expérience.</p>
        <p><strong>3. Droits</strong><br/>Vous pouvez modifier ou supprimer vos données à tout moment.</p>
      </Modal>
      <Modal open={licModal} onClose={() => setLic(false)} title="Licences Open Source">
        <p><strong>React</strong> — MIT © Meta Platforms</p>
        <p><strong>Framer Motion</strong> — MIT © Framer</p>
        <p><strong>TypeScript</strong> — Apache 2.0 © Microsoft</p>
        <p><strong>Tailwind CSS</strong> — MIT © Tailwind Labs</p>
      </Modal>
    </>
  );
};
