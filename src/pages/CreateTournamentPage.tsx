import React, { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';

const sp = { type: 'spring' as const, stiffness: 360, damping: 28 };
const fd = (d = 0) => ({ initial: { opacity: 0, y: 8 }, animate: { opacity: 1, y: 0 }, transition: { ...sp, delay: d } });

const STORAGE_KEY = 'b3-tournaments';

interface Tournament {
  id: string;
  name: string;
  format: '5v5' | '3v3' | '1v1';
  maxTeams: number;
  startDate: string;
  endDate: string;
  description: string;
  discordLink: string;
  prize: string;
  region: string;
  createdBy: string;
  createdAt: string;
  status: 'open' | 'closed' | 'ongoing';
  registeredTeams: number;
}

const loadTournaments = (): Tournament[] => {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]'); } catch { return []; }
};
const saveTournaments = (t: Tournament[]) => localStorage.setItem(STORAGE_KEY, JSON.stringify(t));

const fmtDate = (s: string) => {
  if (!s) return '—';
  return new Date(s).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
};

const StatusBadge: React.FC<{ status: Tournament['status'] }> = ({ status }) => {
  const map = {
    open:    { label: 'Inscriptions ouvertes', bg: 'rgba(34,197,94,0.12)',   color: 'var(--green)' },
    ongoing: { label: 'En cours',              bg: 'rgba(239,68,68,0.12)',   color: 'var(--red)'   },
    closed:  { label: 'Terminé',               bg: 'rgba(113,113,122,0.12)', color: 'var(--text3)' },
  };
  const s = map[status];
  return (
    <span className="rounded-full px-2.5 py-0.5 text-[10px] font-bold"
      style={{ background: s.bg, color: s.color }}>
      {s.label}
    </span>
  );
};

const CreateTournamentPage: React.FC = () => {
  const { user } = useAuth();
  const [tournaments, setTournaments] = useState<Tournament[]>(loadTournaments);
  const [showForm,    setShowForm]    = useState(false);
  const [success,     setSuccess]     = useState(false);
  const [delConfirm,  setDelConfirm]  = useState<string | null>(null);

  const [form, setForm] = useState({
    name:        '',
    format:      '5v5' as Tournament['format'],
    maxTeams:    8,
    startDate:   '',
    endDate:     '',
    description: '',
    discordLink: '',
    prize:       '',
    region:      'EU',
  });
  const [errors, setErrors] = useState<Partial<typeof form>>({});

  useEffect(() => {
    setTournaments(loadTournaments());
  }, []);

  const validate = () => {
    const e: Partial<typeof form> = {};
    if (!form.name.trim())      e.name      = 'Nom requis';
    if (!form.startDate)        e.startDate = 'Date de début requise';
    if (!form.description.trim()) e.description = 'Description requise';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = () => {
    if (!validate()) return;
    const t: Tournament = {
      id:             Date.now().toString(),
      name:           form.name.trim(),
      format:         form.format,
      maxTeams:       form.maxTeams,
      startDate:      form.startDate,
      endDate:        form.endDate,
      description:    form.description.trim(),
      discordLink:    form.discordLink.trim(),
      prize:          form.prize.trim(),
      region:         form.region,
      createdBy:      user?.username ?? 'Anonyme',
      createdAt:      new Date().toISOString(),
      status:         'open',
      registeredTeams: 0,
    };
    const updated = [t, ...tournaments];
    setTournaments(updated);
    saveTournaments(updated);
    setSuccess(true);
    setShowForm(false);
    setForm({ name: '', format: '5v5', maxTeams: 8, startDate: '', endDate: '', description: '', discordLink: '', prize: '', region: 'EU' });
    setTimeout(() => setSuccess(false), 3000);
  };

  const handleDelete = (id: string) => {
    const updated = tournaments.filter(t => t.id !== id);
    setTournaments(updated);
    saveTournaments(updated);
    setDelConfirm(null);
  };

  const toggleStatus = (id: string) => {
    const cycle: Record<Tournament['status'], Tournament['status']> = { open: 'ongoing', ongoing: 'closed', closed: 'open' };
    const updated = tournaments.map(t => t.id === id ? { ...t, status: cycle[t.status] } : t);
    setTournaments(updated);
    saveTournaments(updated);
  };

  const Field: React.FC<{ label: string; error?: string; children: React.ReactNode }> = ({ label, error, children }) => (
    <div>
      <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-widest" style={{ color: 'var(--text3)' }}>{label}</label>
      {children}
      {error && <p className="mt-1 text-[12px]" style={{ color: 'var(--red)' }}>{error}</p>}
    </div>
  );

  return (
    <div className="page-enter h-full overflow-y-auto p-6 space-y-6">

      {/* Toast */}
      <AnimatePresence>
        {success && (
          <motion.div initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -16 }} transition={sp}
            className="fixed left-1/2 top-4 z-50 -translate-x-1/2 rounded-xl px-5 py-2.5 text-[13px] font-semibold shadow-xl"
            style={{ background: 'var(--card)', border: '1px solid var(--green)', color: 'var(--green)' }}>
            ✓ Tournoi créé avec succès !
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <motion.div {...fd(0)} className="flex items-center justify-between">
        <div>
          <h2 className="text-[22px] font-bold">Mes tournois</h2>
          <p className="mt-1 text-[14px]" style={{ color: 'var(--text3)' }}>
            Créez et gérez vos tournois Valorant
          </p>
        </div>
        <motion.button whileTap={{ scale: 0.96 }} transition={sp}
          onClick={() => setShowForm(v => !v)}
          className="btn-primary flex items-center gap-2 px-5 py-2.5 text-[14px]">
          <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={2} className="h-4 w-4">
            <path d="M8 3v10M3 8h10" strokeLinecap="round"/>
          </svg>
          {showForm ? 'Annuler' : 'Créer un tournoi'}
        </motion.button>
      </motion.div>

      {/* Create form */}
      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
            transition={sp} className="overflow-hidden">
            <div className="card overflow-hidden">
              <div className="px-6 py-4" style={{ borderBottom: '1px solid var(--border)' }}>
                <h3 className="text-[16px] font-bold">Nouveau tournoi</h3>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-2 gap-5">

                  {/* Left column */}
                  <div className="space-y-4">
                    <Field label="Nom du tournoi" error={errors.name}>
                      <input type="text" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}
                        placeholder="ex: B3 Weekly Cup #12"
                        className="input w-full px-4 py-3 text-[14px]" />
                    </Field>

                    <div className="grid grid-cols-2 gap-4">
                      <Field label="Format">
                        <select value={form.format} onChange={e => setForm({ ...form, format: e.target.value as any })}
                          className="input w-full px-3 py-3 text-[14px]">
                          <option value="5v5" style={{ background: 'var(--card)' }}>5v5</option>
                          <option value="3v3" style={{ background: 'var(--card)' }}>3v3</option>
                          <option value="1v1" style={{ background: 'var(--card)' }}>1v1</option>
                        </select>
                      </Field>
                      <Field label="Max équipes">
                        <select value={form.maxTeams} onChange={e => setForm({ ...form, maxTeams: Number(e.target.value) })}
                          className="input w-full px-3 py-3 text-[14px]">
                          {[2,4,8,16,32].map(n => <option key={n} value={n} style={{ background: 'var(--card)' }}>{n} équipes</option>)}
                        </select>
                      </Field>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <Field label="Date de début" error={errors.startDate}>
                        <input type="date" value={form.startDate} onChange={e => setForm({ ...form, startDate: e.target.value })}
                          className="input w-full px-3 py-3 text-[14px]" />
                      </Field>
                      <Field label="Date de fin (opt.)">
                        <input type="date" value={form.endDate} onChange={e => setForm({ ...form, endDate: e.target.value })}
                          className="input w-full px-3 py-3 text-[14px]" />
                      </Field>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <Field label="Région">
                        <select value={form.region} onChange={e => setForm({ ...form, region: e.target.value })}
                          className="input w-full px-3 py-3 text-[14px]">
                          {['EU', 'NA', 'AP', 'SA', 'KR', 'Open'].map(r => <option key={r} value={r} style={{ background: 'var(--card)' }}>{r}</option>)}
                        </select>
                      </Field>
                      <Field label="Dotation (opt.)">
                        <input type="text" value={form.prize} onChange={e => setForm({ ...form, prize: e.target.value })}
                          placeholder="ex: 100€"
                          className="input w-full px-4 py-3 text-[14px]" />
                      </Field>
                    </div>
                  </div>

                  {/* Right column */}
                  <div className="space-y-4">
                    <Field label="Description" error={errors.description}>
                      <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })}
                        placeholder="Format du tournoi, règles, niveau requis…"
                        rows={5}
                        className="input w-full px-4 py-3 text-[14px] resize-none" />
                    </Field>

                    <Field label="Lien Discord (opt.)">
                      <input type="text" value={form.discordLink} onChange={e => setForm({ ...form, discordLink: e.target.value })}
                        placeholder="https://discord.gg/ton-serveur"
                        className="input w-full px-4 py-3 text-[14px]" />
                    </Field>

                    {/* Preview */}
                    {form.name && (
                      <div className="rounded-xl p-4"
                        style={{ background: 'var(--raised)', border: '1px solid var(--border)' }}>
                        <p className="mb-2 text-[11px] font-semibold uppercase tracking-widest" style={{ color: 'var(--text3)' }}>
                          Aperçu
                        </p>
                        <p className="text-[15px] font-bold">{form.name}</p>
                        <p className="mt-1 text-[12px]" style={{ color: 'var(--text3)' }}>
                          {form.format} · {form.maxTeams} équipes · {form.region}
                          {form.startDate ? ` · ${fmtDate(form.startDate)}` : ''}
                          {form.prize ? ` · ${form.prize}` : ''}
                        </p>
                      </div>
                    )}

                    <motion.button whileTap={{ scale: 0.97 }} transition={sp}
                      onClick={handleSubmit}
                      className="btn-primary w-full py-3.5 text-[14px]">
                      Créer le tournoi →
                    </motion.button>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Tournament list */}
      {tournaments.length === 0 && !showForm ? (
        <motion.div {...fd(0.06)} className="card flex flex-col items-center gap-4 py-16 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl" style={{ background: 'var(--raised)' }}>
            <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth={1.5} className="h-8 w-8" style={{ color: 'var(--text3)' }}>
              <path d="M6 3H4v4a4 4 0 004 4h4a4 4 0 004-4V3h-2M6 3h8M10 11v4m-3 2h6" strokeLinecap="round"/>
            </svg>
          </div>
          <div>
            <p className="text-[16px] font-bold">Aucun tournoi créé</p>
            <p className="mt-1 text-[13px]" style={{ color: 'var(--text3)' }}>
              Créez votre premier tournoi et invitez la communauté
            </p>
          </div>
          <button onClick={() => setShowForm(true)} className="btn-primary px-6 py-2.5 text-[14px]">
            Créer mon premier tournoi
          </button>
        </motion.div>
      ) : (
        <div className="grid grid-cols-2 gap-5 xl:grid-cols-3">
          <AnimatePresence>
            {tournaments.map((t, i) => (
              <motion.div key={t.id}
                initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }}
                transition={{ ...sp, delay: Math.min(i * 0.05, 0.25) }}
                className="card overflow-hidden flex flex-col">

                {/* Card header */}
                <div className="p-5 flex-1">
                  <div className="mb-3 flex items-start justify-between gap-2">
                    <StatusBadge status={t.status} />
                    <span className="rounded-full px-2 py-0.5 text-[10px] font-semibold"
                      style={{ background: 'var(--raised)', color: 'var(--text3)' }}>
                      {t.format} · {t.region}
                    </span>
                  </div>
                  <h3 className="text-[16px] font-bold mb-1">{t.name}</h3>
                  <p className="text-[12px] mb-3" style={{ color: 'var(--text3)' }}>
                    📅 {fmtDate(t.startDate)}{t.endDate ? ` – ${fmtDate(t.endDate)}` : ''}
                    {t.prize ? ` · 🏆 ${t.prize}` : ''}
                  </p>
                  <p className="text-[13px] leading-relaxed line-clamp-3" style={{ color: 'var(--text2)' }}>
                    {t.description}
                  </p>

                  {/* Stats */}
                  <div className="mt-4 flex items-center gap-4 text-[12px]" style={{ color: 'var(--text3)' }}>
                    <span>👥 {t.registeredTeams}/{t.maxTeams} équipes</span>
                    <span>Créé par <strong style={{ color: 'var(--text2)' }}>{t.createdBy}</strong></span>
                  </div>

                  {/* Discord link */}
                  {t.discordLink && (
                    <a href={t.discordLink} target="_blank" rel="noopener noreferrer"
                      className="mt-3 flex items-center gap-2 text-[12px] font-semibold transition hover:opacity-80"
                      style={{ color: '#5865F2' }}>
                      <svg viewBox="0 0 24 24" fill="currentColor" className="h-3.5 w-3.5">
                        <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057c.002.022.015.045.034.057a19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03z"/>
                      </svg>
                      Rejoindre le serveur Discord
                    </a>
                  )}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 px-5 py-3" style={{ borderTop: '1px solid var(--border)' }}>
                  <button onClick={() => toggleStatus(t.id)}
                    className="flex-1 rounded-lg py-2 text-[12px] font-semibold transition hover:bg-white/5"
                    style={{ color: 'var(--text2)', border: '1px solid var(--border)' }}>
                    {t.status === 'open' ? 'Démarrer' : t.status === 'ongoing' ? 'Terminer' : 'Rouvrir'}
                  </button>
                  {delConfirm === t.id ? (
                    <div className="flex items-center gap-1.5">
                      <span className="text-[12px]" style={{ color: 'var(--text3)' }}>Confirmer ?</span>
                      <button onClick={() => handleDelete(t.id)}
                        className="rounded-lg px-3 py-2 text-[12px] font-bold text-white"
                        style={{ background: 'var(--red)' }}>Oui</button>
                      <button onClick={() => setDelConfirm(null)}
                        className="rounded-lg px-3 py-2 text-[12px] font-semibold transition hover:bg-white/5"
                        style={{ color: 'var(--text3)' }}>Non</button>
                    </div>
                  ) : (
                    <button onClick={() => setDelConfirm(t.id)}
                      className="flex h-8 w-8 items-center justify-center rounded-lg transition hover:bg-red-500/15"
                      style={{ color: 'var(--text3)' }}>
                      <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={1.6} className="h-3.5 w-3.5">
                        <path d="M2 4h12M5 4V2h6v2M6 7v5M10 7v5M4 4l.8 9.2c.04.4.4.8.8.8h4.8c.4 0 .76-.4.8-.8L12 4" strokeLinecap="round"/>
                      </svg>
                    </button>
                  )}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
};

export default CreateTournamentPage;
