import React, { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { User, useAuth } from '../contexts/AuthContext';
import { Avatar } from '../components/Avatar';
import { platformApi } from '../services/platformApi';

interface ProfilePageProps {
  user: User;
  onLogout: () => void;
  onNavigate: (page: string) => void;
}

const sp = { type: 'spring' as const, stiffness: 400, damping: 30 };

const RANKS = [
  'Iron 1','Iron 2','Iron 3',
  'Bronze 1','Bronze 2','Bronze 3',
  'Silver 1','Silver 2','Silver 3',
  'Gold 1','Gold 2','Gold 3',
  'Platinum 1','Platinum 2','Platinum 3',
  'Diamond 1','Diamond 2','Diamond 3',
  'Ascendant 1','Ascendant 2','Ascendant 3',
  'Immortal 1','Immortal 2','Immortal 3',
  'Radiant',
];

const ROLES_LIST     = ['Duelist','Controller','Initiator','Sentinel'];
const REGIONS        = ['EU','NA','AP','SA','BR','KR'];
const LANGUAGES_LIST = ['FR','EN','ES','DE','PT','IT','PL','RU','TR','KO','JA','ZH'];
const PLAYTIMES_LIST = ['Matin','Après-midi','Soir','Nuit','Week-end'];

const formatDate = (d?: string) => {
  if (!d) return '—';
  const p = new Date(d);
  return isNaN(p.getTime()) ? '—' : p.toLocaleDateString('fr-FR', { year:'numeric', month:'long', day:'numeric' });
};

// ─── Small helpers ────────────────────────────────────────────────────────────

const SectionHeader: React.FC<{ icon: React.ReactNode; title: string; sub?: string }> = ({ icon, title, sub }) => (
  <div className="flex items-center gap-3 px-5 py-4" style={{ borderBottom: '1px solid var(--border)' }}>
    <div className="flex h-8 w-8 items-center justify-center rounded-lg flex-shrink-0"
      style={{ background: 'rgba(47,129,247,0.12)' }}>
      <span style={{ color: 'var(--violet2)' }}>{icon}</span>
    </div>
    <div>
      <h3 className="text-[15px] font-bold">{title}</h3>
      {sub && <p className="text-[12px]" style={{ color: 'var(--text3)' }}>{sub}</p>}
    </div>
  </div>
);

const Label: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-widest" style={{ color: 'var(--text3)' }}>
    {children}
  </label>
);

const Toggle: React.FC<{ checked: boolean; onChange: (v: boolean) => void; label: string; sub?: string }> = ({ checked, onChange, label, sub }) => (
  <div className="flex items-center justify-between gap-4">
    <div>
      <div className="text-[14px] font-medium">{label}</div>
      {sub && <div className="text-[12px] mt-0.5" style={{ color: 'var(--text3)' }}>{sub}</div>}
    </div>
    <button type="button" onClick={() => onChange(!checked)}
      className="relative h-6 w-11 rounded-full transition-colors flex-shrink-0"
      style={{ background: checked ? 'var(--violet)' : 'var(--raised)' }}>
      <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${checked ? 'translate-x-5' : 'translate-x-0.5'}`} />
    </button>
  </div>
);

const CheckPill: React.FC<{ label: string; checked: boolean; onChange: () => void; color?: string }> = ({ label, checked, onChange, color }) => (
  <button type="button" onClick={onChange}
    className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
    style={checked
      ? { background: (color ?? 'var(--violet)') + '22', color: color ?? 'var(--violet2)', border: `1px solid ${(color ?? 'var(--violet)') + '55'}` }
      : { background: 'var(--raised)', color: 'var(--text3)', border: '1px solid var(--border)' }}>
    {label}
  </button>
);

const SocialInput: React.FC<{
  icon: React.ReactNode;
  label: string;
  placeholder: string;
  value: string;
  onChange: (v: string) => void;
  prefix?: string;
  color: string;
}> = ({ icon, label, placeholder, value, onChange, prefix, color }) => (
  <div>
    <Label>{label}</Label>
    <div className="relative flex items-center">
      <div className="absolute left-3 flex items-center gap-1.5">
        <span style={{ color }}>{icon}</span>
        {prefix && <span className="text-[13px]" style={{ color: 'var(--text3)' }}>{prefix}</span>}
      </div>
      <input value={value} onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className="input w-full py-2.5 text-[13px]"
        style={{ paddingLeft: prefix ? '4rem' : '2.25rem' }} />
    </div>
  </div>
);

// ─── Main component ───────────────────────────────────────────────────────────

export const ProfilePage: React.FC<ProfilePageProps> = ({ user, onLogout, onNavigate }) => {
  const { refreshUser } = useAuth();

  // Basic info
  const [username, setUsername] = useState(user.username);
  const [email,    setEmail]    = useState(user.email);
  const [password, setPassword] = useState('');

  // Social
  const [discord, setDiscord] = useState(user.discord ?? '');
  const [twitter, setTwitter] = useState(user.twitter ?? '');
  const [twitch,  setTwitch]  = useState(user.twitch  ?? '');
  const [youtube, setYoutube] = useState(user.youtube ?? '');

  // Gaming profile
  const [bio,       setBio]       = useState(user.bio       ?? '');
  const [rankLabel, setRankLabel] = useState(user.rankLabel ?? '');
  const [roles,     setRoles]     = useState<string[]>(user.roles     ?? []);
  const [region,    setRegion]    = useState(user.region    ?? '');
  const [languages, setLanguages] = useState<string[]>(user.languages ?? []);
  const [playtimes, setPlaytimes] = useState<string[]>(user.playtimes ?? []);

  // LFG
  const [showInLfg,  setShowInLfg]  = useState(user.showInLfg ?? false);
  const [lfgStatus,  setLfgStatus]  = useState<'lfg'|'busy'>(user.lfgStatus ?? 'lfg');

  // Riot
  const [riotInput,      setRiotInput]      = useState('');
  const [riotConnecting, setRiotConnecting] = useState(false);
  const [riotError,      setRiotError]      = useState<string | null>(null);
  const [connectedRiot,  setConnectedRiot]  = useState<{ name: string; tag: string } | null>(
    user.riotId && user.tagLine ? { name: user.riotId, tag: user.tagLine } : null,
  );

  // UI state
  const [saving,   setSaving]   = useState(false);
  const [error,    setError]    = useState<string | null>(null);
  const [success,  setSuccess]  = useState(false);

  const toggleArr = (arr: string[], setArr: (a: string[]) => void, val: string) => {
    setArr(arr.includes(val) ? arr.filter(x => x !== val) : [...arr, val]);
  };

  const handleSave = async () => {
    setError(null);
    setSaving(true);
    try {
      const r = await platformApi.updateProfile(Number(user.id), {
        username: username.trim(),
        email: email.trim(),
        bio: bio.trim(),
        discord: discord.trim(),
        twitter: twitter.trim(),
        twitch: twitch.trim(),
        youtube: youtube.trim(),
        rankLabel: rankLabel,
        roles,
        region,
        languages,
        playtimes,
        showInLfg,
        lfgStatus,
      });
      if (!r.success) throw new Error(r.error);
      if (password) {
        const pr = await platformApi.updatePassword(Number(user.id), password);
        if (!pr.success) throw new Error(pr.error);
      }
      setPassword('');
      setSuccess(true);
      setTimeout(() => setSuccess(false), 2500);
      await refreshUser();
    } catch (e) { setError(e instanceof Error ? e.message : 'Erreur'); }
    finally { setSaving(false); }
  };

  const handleConnectRiot = async () => {
    setRiotError(null);
    const parts = riotInput.trim().split('#');
    if (parts.length !== 2 || !parts[0] || !parts[1]) { setRiotError('Format requis : Pseudo#TAG'); return; }
    const [name, tag] = parts;
    setRiotConnecting(true);
    try {
      const res = await platformApi.getRiotPlayer(name, tag);
      if (!res.success) { setRiotError(res.needsApiKey ? 'Clé API manquante ou expirée' : (res.error || 'Joueur introuvable')); return; }
      const save = await platformApi.updateProfile(Number(user.id), { riotId: name, tagLine: tag });
      if (!save.success) { setRiotError(save.error || 'Erreur de sauvegarde'); return; }
      setConnectedRiot({ name, tag });
      setRiotInput('');
      await refreshUser();
    } catch { setRiotError('Erreur serveur'); }
    finally { setRiotConnecting(false); }
  };

  const handleDisconnectRiot = async () => {
    await platformApi.updateProfile(Number(user.id), { riotId: '', tagLine: '' });
    setConnectedRiot(null);
    await refreshUser();
  };

  return (
    <div className="page-enter h-full overflow-y-auto p-6">

      {/* Toast */}
      <AnimatePresence>
        {success && (
          <motion.div initial={{ opacity:0, y:-20 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0, y:-20 }} transition={sp}
            className="fixed left-1/2 top-4 z-50 -translate-x-1/2 rounded-xl px-5 py-2.5 text-[13px] font-semibold shadow-xl"
            style={{ background: 'var(--card)', border: '1px solid var(--green)', color: 'var(--green)' }}>
            ✓ Profil enregistré
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-3 gap-6">

        {/* ── LEFT: avatar + nav ──────────────────────────────── */}
        <div className="col-span-1 space-y-4">

          {/* Avatar card */}
          <div className="card p-6 flex flex-col items-center gap-4 text-center">
            <Avatar username={username || user.username} size="lg" showBorder editable />
            <div>
              <h2 className="text-[20px] font-bold">{username || user.username}</h2>
              <p className="mt-0.5 text-[13px]" style={{ color: 'var(--text2)' }}>{email}</p>
              {rankLabel && (
                <span className="mt-1 inline-block rounded-full px-2.5 py-0.5 text-[11px] font-bold"
                  style={{ background: 'rgba(47,129,247,0.15)', color: 'var(--violet2)' }}>
                  {rankLabel}
                </span>
              )}
              <p className="mt-1 text-[12px]" style={{ color: 'var(--text3)' }}>
                Membre depuis {formatDate(user.createdAt)}
              </p>
            </div>
            {connectedRiot && (
              <div className="flex items-center gap-1.5 rounded-lg px-3 py-1.5"
                style={{ background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.2)' }}>
                <span className="h-2 w-2 rounded-full" style={{ background: 'var(--green)' }} />
                <p className="text-[13px] font-semibold">
                  {connectedRiot.name}
                  <span style={{ color: 'var(--text3)' }}>#{connectedRiot.tag}</span>
                </p>
              </div>
            )}
            {/* Social links preview */}
            {(discord || twitter || twitch || youtube) && (
              <div className="flex items-center gap-3">
                {discord && (
                  <a title="Discord" className="flex h-8 w-8 items-center justify-center rounded-lg transition hover:opacity-80"
                    style={{ background: 'rgba(88,101,242,0.15)', color: '#5865F2' }}>
                    <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4">
                      <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057c.002.022.015.045.034.057a19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03z"/>
                    </svg>
                  </a>
                )}
                {twitter && (
                  <a href={`https://x.com/${twitter}`} target="_blank" rel="noopener noreferrer"
                    className="flex h-8 w-8 items-center justify-center rounded-lg transition hover:opacity-80"
                    style={{ background: 'rgba(0,0,0,0.3)', color: '#fff' }}>
                    <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4">
                      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                    </svg>
                  </a>
                )}
                {twitch && (
                  <a href={`https://twitch.tv/${twitch}`} target="_blank" rel="noopener noreferrer"
                    className="flex h-8 w-8 items-center justify-center rounded-lg transition hover:opacity-80"
                    style={{ background: 'rgba(145,70,255,0.15)', color: '#9146FF' }}>
                    <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4">
                      <path d="M11.571 4.714h1.715v5.143H11.57zm4.715 0H18v5.143h-1.714zM6 0L1.714 4.286v15.428h5.143V24l4.286-4.286h3.428L22.286 12V0zm14.571 11.143l-3.428 3.428h-3.429l-3 3v-3H6.857V1.714h13.714z"/>
                    </svg>
                  </a>
                )}
                {youtube && (
                  <a href={`https://youtube.com/@${youtube}`} target="_blank" rel="noopener noreferrer"
                    className="flex h-8 w-8 items-center justify-center rounded-lg transition hover:opacity-80"
                    style={{ background: 'rgba(255,0,0,0.12)', color: '#FF0000' }}>
                    <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4">
                      <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                    </svg>
                  </a>
                )}
              </div>
            )}
          </div>

          {/* LFG status badge */}
          {showInLfg && (
            <div className="card px-4 py-3 flex items-center gap-3">
              <span className={`h-2.5 w-2.5 rounded-full flex-shrink-0 ${lfgStatus === 'lfg' ? 'animate-pulse' : ''}`}
                style={{ background: lfgStatus === 'lfg' ? 'var(--green)' : 'var(--text3)' }} />
              <div className="flex-1 min-w-0">
                <div className="text-[13px] font-semibold">
                  {lfgStatus === 'lfg' ? 'En recherche d\'équipe' : 'Occupé'}
                </div>
                <div className="text-[11px]" style={{ color: 'var(--text3)' }}>Visible dans la page Joueurs</div>
              </div>
            </div>
          )}

          {/* Quick nav */}
          <div className="card overflow-hidden">
            <p className="px-4 py-3 text-[11px] font-semibold uppercase tracking-widest"
              style={{ color: 'var(--text3)', borderBottom: '1px solid var(--border)' }}>
              Navigation rapide
            </p>
            {[
              { label: 'Statistiques', page: 'stats',      icon: '📊' },
              { label: 'Tournois',     page: 'tournaments', icon: '🏆' },
              { label: 'Joueurs LFG', page: 'players',     icon: '👥' },
              { label: 'Boutique',     page: 'shop',        icon: '🛍' },
              { label: 'Paramètres',  page: 'settings',    icon: '⚙️' },
            ].map((item, i, arr) => (
              <motion.button key={item.page} whileTap={{ scale: 0.99 }} transition={sp}
                onClick={() => onNavigate(item.page)}
                className="flex w-full items-center gap-3 px-4 py-3 text-left transition hover:bg-white/5"
                style={i < arr.length - 1 ? { borderBottom: '1px solid var(--border)' } : undefined}>
                <span className="text-[15px]">{item.icon}</span>
                <span className="flex-1 text-[14px] font-medium">{item.label}</span>
                <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={2} className="h-3.5 w-3.5" style={{ color: 'var(--text3)' }}>
                  <path d="M6 12l4-4-4-4"/>
                </svg>
              </motion.button>
            ))}
          </div>

          {/* Logout */}
          <motion.button whileTap={{ scale: 0.97 }} transition={sp} onClick={onLogout}
            className="card w-full py-3.5 text-[14px] font-semibold transition hover:bg-white/5"
            style={{ color: 'var(--red)' }}>
            Se déconnecter
          </motion.button>
        </div>

        {/* ── RIGHT: forms ────────────────────────────────────── */}
        <div className="col-span-2 space-y-5">

          {/* ── Section 1: Infos de base ─────────────────────── */}
          <div className="card overflow-hidden">
            <SectionHeader
              icon={<svg viewBox="0 0 16 16" fill="currentColor" className="h-4 w-4"><path fillRule="evenodd" d="M8 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H1z"/></svg>}
              title="Informations de base"
              sub="Pseudo, email et mot de passe"
            />
            <div className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Pseudo</Label>
                  <input value={username} onChange={e => setUsername(e.target.value)}
                    className="input w-full px-3.5 py-2.5 text-[14px]" />
                </div>
                <div>
                  <Label>Email</Label>
                  <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                    className="input w-full px-3.5 py-2.5 text-[14px]" />
                </div>
              </div>
              <div>
                <Label>Nouveau mot de passe (optionnel)</Label>
                <input type="password" value={password} onChange={e => setPassword(e.target.value)}
                  placeholder="Laisser vide pour ne pas changer"
                  className="input w-full px-3.5 py-2.5 text-[14px]" />
              </div>
            </div>
          </div>

          {/* ── Section 2: Réseaux sociaux ───────────────────── */}
          <div className="card overflow-hidden">
            <SectionHeader
              icon={<svg viewBox="0 0 16 16" fill="currentColor" className="h-4 w-4"><path d="M3 6a3 3 0 100 6 3 3 0 000-6zm10-4a3 3 0 100 6 3 3 0 000-6zM3 10a1 1 0 110-2 1 1 0 010 2zm10-4a1 1 0 110-2 1 1 0 010 2zm-5 1a1 1 0 100 2 1 1 0 000-2zM3 7v2M13 5V3M8 7v2M3 8h5M8 9h5V7"/></svg>}
              title="Réseaux sociaux"
              sub="Tes liens de profil public"
            />
            <div className="p-5 grid grid-cols-2 gap-4">
              <SocialInput
                icon={<svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4"><path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057c.002.022.015.045.034.057a19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03z"/></svg>}
                label="Discord"
                placeholder="votre_pseudo"
                value={discord}
                onChange={setDiscord}
                color="#5865F2"
              />
              <SocialInput
                icon={<svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>}
                label="Twitter / X"
                placeholder="handle"
                value={twitter}
                onChange={setTwitter}
                prefix="@"
                color="#fff"
              />
              <SocialInput
                icon={<svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4"><path d="M11.571 4.714h1.715v5.143H11.57zm4.715 0H18v5.143h-1.714zM6 0L1.714 4.286v15.428h5.143V24l4.286-4.286h3.428L22.286 12V0zm14.571 11.143l-3.428 3.428h-3.429l-3 3v-3H6.857V1.714h13.714z"/></svg>}
                label="Twitch"
                placeholder="channel"
                value={twitch}
                onChange={setTwitch}
                color="#9146FF"
              />
              <SocialInput
                icon={<svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>}
                label="YouTube"
                placeholder="chaîne"
                value={youtube}
                onChange={setYoutube}
                prefix="@"
                color="#FF0000"
              />
            </div>
          </div>

          {/* ── Section 3: Profil Gaming ──────────────────────── */}
          <div className="card overflow-hidden">
            <SectionHeader
              icon={<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" className="h-4 w-4"><circle cx="8" cy="8" r="6"/><circle cx="8" cy="8" r="2"/><path d="M8 2v2M8 12v2M2 8h2M12 8h2"/></svg>}
              title="Profil Gaming"
              sub="Rang, rôles, région et disponibilités"
            />
            <div className="p-5 space-y-5">
              {/* Bio */}
              <div>
                <Label>Bio</Label>
                <textarea value={bio} onChange={e => setBio(e.target.value)} rows={2}
                  placeholder="Décris-toi en quelques mots (style de jeu, objectifs…)"
                  className="input w-full px-3.5 py-2.5 text-[13px] resize-none" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* Rank */}
                <div>
                  <Label>Rang actuel</Label>
                  <select value={rankLabel} onChange={e => setRankLabel(e.target.value)}
                    className="input w-full px-3.5 py-2.5 text-[13px]">
                    <option value="" style={{ background: 'var(--card)' }}>— Non renseigné —</option>
                    {RANKS.map(r => <option key={r} value={r} style={{ background: 'var(--card)' }}>{r}</option>)}
                  </select>
                </div>
                {/* Region */}
                <div>
                  <Label>Région</Label>
                  <div className="flex flex-wrap gap-1.5 mt-1">
                    {REGIONS.map(r => (
                      <CheckPill key={r} label={r} checked={region === r}
                        onChange={() => setRegion(region === r ? '' : r)} />
                    ))}
                  </div>
                </div>
              </div>

              {/* Roles */}
              <div>
                <Label>Rôles joués</Label>
                <div className="flex flex-wrap gap-2 mt-1">
                  {ROLES_LIST.map(r => {
                    const colors: Record<string, string> = { Duelist:'#ff4655', Controller:'#4ade80', Initiator:'#fbbf24', Sentinel:'#60a5fa' };
                    return <CheckPill key={r} label={r} checked={roles.includes(r)} onChange={() => toggleArr(roles, setRoles, r)} color={colors[r]} />;
                  })}
                </div>
              </div>

              {/* Languages */}
              <div>
                <Label>Langues parlées</Label>
                <div className="flex flex-wrap gap-1.5 mt-1">
                  {LANGUAGES_LIST.map(l => (
                    <CheckPill key={l} label={l} checked={languages.includes(l)}
                      onChange={() => toggleArr(languages, setLanguages, l)} />
                  ))}
                </div>
              </div>

              {/* Playtimes */}
              <div>
                <Label>Disponibilités</Label>
                <div className="flex flex-wrap gap-1.5 mt-1">
                  {PLAYTIMES_LIST.map(t => (
                    <CheckPill key={t} label={t} checked={playtimes.includes(t)}
                      onChange={() => toggleArr(playtimes, setPlaytimes, t)} />
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* ── Section 4: Visibilité LFG ─────────────────────── */}
          <div className="card overflow-hidden">
            <SectionHeader
              icon={<svg viewBox="0 0 16 16" fill="currentColor" className="h-4 w-4"><path d="M7 8a3 3 0 100-6 3 3 0 000 6zm0 2a5 5 0 00-4.546 2.916A5.986 5.986 0 007 15a5.986 5.986 0 004.546-2.084A5 5 0 007 10zm5.986-2.214A3 3 0 0014 6a3 3 0 00-2.014-2.786A5.009 5.009 0 0113 6a5.009 5.009 0 01-1.014 2.786zM14.5 10a5.02 5.02 0 012.496 4H14a6.012 6.012 0 00-3-5.197A4.987 4.987 0 0114.5 10z"/></svg>}
              title="Visibilité & LFG"
              sub="Apparais dans la page Joueurs pour trouver des coéquipiers"
            />
            <div className="p-5 space-y-4">
              <Toggle
                checked={showInLfg}
                onChange={setShowInLfg}
                label="Apparaître dans la page Joueurs"
                sub="Les autres joueurs pourront voir ton profil et te contacter"
              />
              {showInLfg && (
                <div>
                  <Label>Statut LFG</Label>
                  <div className="flex gap-3 mt-1">
                    {[
                      { id: 'lfg' as const,  label: 'En recherche',  icon: '🔍', color: 'var(--green)'  },
                      { id: 'busy' as const, label: 'Occupé',        icon: '🔴', color: 'var(--red)'    },
                    ].map(s => (
                      <button key={s.id} type="button" onClick={() => setLfgStatus(s.id)}
                        className="flex-1 flex items-center gap-2.5 px-4 py-3 rounded-xl text-sm font-semibold transition-all"
                        style={lfgStatus === s.id
                          ? { background: s.color + '15', color: s.color, border: `1px solid ${s.color}40` }
                          : { background: 'var(--raised)', color: 'var(--text2)', border: '1px solid var(--border)' }}>
                        <span>{s.icon}</span>{s.label}
                        {lfgStatus === s.id && <span className="ml-auto text-xs">✓</span>}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* ── Section 5: Riot Games ─────────────────────────── */}
          <div className="card overflow-hidden">
            <div className="flex items-center gap-3 px-5 py-4" style={{ borderBottom: '1px solid var(--border)' }}>
              <div className="flex h-8 w-8 items-center justify-center rounded-lg" style={{ background: 'rgba(239,68,68,0.1)' }}>
                <span className="text-[14px] font-black" style={{ color: '#FF4654' }}>R</span>
              </div>
              <div>
                <h3 className="text-[15px] font-bold">Riot Games</h3>
                <p className="text-[12px]" style={{ color: 'var(--text3)' }}>Connecte ton compte Valorant</p>
              </div>
            </div>
            <div className="p-5">
              <AnimatePresence mode="wait">
                {connectedRiot ? (
                  <motion.div key="on" initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
                    className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="h-2.5 w-2.5 rounded-full" style={{ background: 'var(--green)' }} />
                        <p className="text-[16px] font-bold">
                          {connectedRiot.name}
                          <span style={{ color: 'var(--text3)' }}>#{connectedRiot.tag}</span>
                        </p>
                      </div>
                      <p className="text-[13px] ml-4.5" style={{ color: 'var(--green)' }}>Compte Riot vérifié ✓</p>
                    </div>
                    <button onClick={handleDisconnectRiot}
                      className="rounded-lg px-4 py-2 text-[13px] font-semibold"
                      style={{ background: 'rgba(239,68,68,0.1)', color: 'var(--red)' }}>
                      Déconnecter
                    </button>
                  </motion.div>
                ) : (
                  <motion.div key="off" initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}>
                    <p className="mb-4 text-[14px]" style={{ color: 'var(--text2)' }}>
                      Entre ton Riot ID pour accéder à tes statistiques Valorant.
                    </p>
                    <div className="flex gap-3">
                      <input value={riotInput} onChange={e => setRiotInput(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && handleConnectRiot()}
                        placeholder="Pseudo#TAG (ex: Sleepy Mikuu#Ezz)"
                        className="input flex-1 px-4 py-3 text-[14px]" />
                      <motion.button whileTap={{ scale: 0.97 }} transition={sp}
                        onClick={handleConnectRiot} disabled={riotConnecting || !riotInput.trim()}
                        className="btn-primary px-5 py-3 text-[14px] shrink-0 disabled:opacity-40">
                        {riotConnecting ? 'Vérification…' : 'Connecter'}
                      </motion.button>
                    </div>
                    {riotError && <p className="mt-2 text-[13px]" style={{ color: 'var(--red)' }}>{riotError}</p>}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* ── Section 6: Infos du compte ────────────────────── */}
          <div className="card overflow-hidden">
            <div className="px-5 py-4" style={{ borderBottom: '1px solid var(--border)' }}>
              <h3 className="text-[15px] font-bold">Informations du compte</h3>
            </div>
            <div className="divide-y" style={{ borderColor: 'var(--border)' }}>
              {[
                { label: 'Identifiant', value: `#${user.id}` },
                { label: 'Pseudo',      value: username || user.username },
                { label: 'Email',       value: email },
                { label: 'Inscription', value: formatDate(user.createdAt) },
              ].map(row => (
                <div key={row.label} className="flex items-center px-5 py-3.5">
                  <span className="w-32 text-[13px]" style={{ color: 'var(--text3)' }}>{row.label}</span>
                  <span className="text-[14px] font-medium">{row.value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Save button */}
          {error && <p className="text-[13px]" style={{ color: 'var(--red)' }}>{error}</p>}
          <motion.button whileTap={{ scale: 0.97 }} transition={sp}
            onClick={handleSave} disabled={saving}
            className="btn-primary w-full py-3 text-[15px] font-bold rounded-xl disabled:opacity-50">
            {saving ? 'Enregistrement…' : 'Enregistrer les modifications'}
          </motion.button>

        </div>
      </div>
    </div>
  );
};
