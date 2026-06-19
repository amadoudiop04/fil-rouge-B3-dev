import React, { useState } from 'react';
import { motion } from 'framer-motion';

// ─── Types ────────────────────────────────────────────────────────────────────

type ChangeType = 'new' | 'fix' | 'update' | 'removed' | 'perf';

interface Change {
  type: ChangeType;
  text: string;
}

interface PatchSection {
  emoji: string;
  label: string;
  color: string;
  changes: Change[];
}

interface PatchNote {
  version: string;
  codename: string;
  date: string;
  live?: boolean;
  highlight: string;
  sections: PatchSection[];
}

// ─── Data ─────────────────────────────────────────────────────────────────────

const PATCHES: PatchNote[] = [
  {
    version: '1.4.0',
    codename: 'Cobalt',
    date: '19 juin 2026',
    live: true,
    highlight: 'Refonte visuelle cobalt (bleu/blanc), panneau d\'administration complet et boutique connectée à la base de données',
    sections: [
      {
        emoji: '🎨',
        label: 'Design',
        color: '#46c2ff',
        changes: [
          { type: 'update', text: 'Nouveau thème "Cobalt" — fond bleu nuit, accents bleu électrique, texte blanc' },
          { type: 'update', text: 'Fond atmosphérique : dégradés radiaux + grille fine, cartes en verre bleuté avec profondeur' },
          { type: 'update', text: 'Sidebar repensée — bloc de marque, navigation groupée (Jouer / Compétition / Boutique / Compte / Admin)' },
          { type: 'update', text: 'Top bar redesignée avec barre de recherche command (⌘K) et accès rapide admin' },
          { type: 'update', text: 'Boutons, inputs et toggles re-stylés (dégradés, glow, focus ring bleu)' },
        ],
      },
      {
        emoji: '🛡️',
        label: 'Administration',
        color: '#22d39a',
        changes: [
          { type: 'new', text: 'Panneau admin complet — Vue d\'ensemble, Utilisateurs, Produits, Commandes' },
          { type: 'new', text: 'Dashboard : revenu, commandes, membres, stock + graphique des inscriptions' },
          { type: 'new', text: 'Gestion utilisateurs — édition, promotion admin, suppression (protection du dernier admin)' },
          { type: 'new', text: 'Gestion produits — création, édition, suppression avec aperçu image' },
          { type: 'new', text: 'Gestion commandes — changement de statut, détail des articles' },
          { type: 'new', text: 'Compte admin créé en base : admin@b3esport.gg' },
        ],
      },
      {
        emoji: '⚙️',
        label: 'Backend',
        color: '#ffb13b',
        changes: [
          { type: 'new', text: 'Colonne is_admin + endpoints /admin/* protégés par rôle' },
          { type: 'new', text: 'Boutique connectée à la DB — GET /products, POST /orders (décrémente le stock)' },
          { type: 'new', text: 'Création automatique des tables products/orders/order_items au démarrage' },
        ],
      },
    ],
  },
  {
    version: '1.3.0',
    codename: 'Social Update',
    date: '19 juin 2026',
    highlight: 'Personnalisation complète du profil, réseaux sociaux et page joueurs dynamique',
    sections: [
      {
        emoji: '✦',
        label: 'Profil',
        color: '#38bdf8',
        changes: [
          { type: 'new',    text: 'Section Réseaux Sociaux — Discord, Twitter/X, Twitch, YouTube' },
          { type: 'new',    text: 'Section Profil Gaming — bio, rang (Iron→Radiant), rôles, région, langues et disponibilités' },
          { type: 'new',    text: 'Toggle LFG — active/désactive ton apparition dans la page Joueurs' },
          { type: 'new',    text: 'Statut LFG — choix entre "En recherche" et "Occupé"' },
          { type: 'update', text: 'Avatar — les icônes réseaux sociaux apparaissent maintenant dans la colonne de gauche' },
        ],
      },
      {
        emoji: '👥',
        label: 'Joueurs LFG',
        color: '#22c55e',
        changes: [
          { type: 'new',    text: 'Page Joueurs entièrement dynamique — affiche uniquement les vrais inscrits ayant activé le LFG' },
          { type: 'new',    text: 'Nouveau filtre région dans la page Joueurs' },
          { type: 'new',    text: 'Affichage des liens Twitter et Twitch sur les cartes joueurs' },
          { type: 'removed','text': 'Suppression des 12 joueurs fictifs (NightFury, Solana, Kryptonix…)' },
        ],
      },
      {
        emoji: '⚙️',
        label: 'Backend',
        color: '#f59e0b',
        changes: [
          { type: 'new',    text: '12 nouvelles colonnes DB — bio, discord, twitter, twitch, youtube, rank_label, roles, region, languages, playtimes, show_in_lfg, lfg_status' },
          { type: 'new',    text: 'Endpoint GET /users/lfg — liste publique des utilisateurs LFG actifs' },
          { type: 'fix',    text: 'Correction d\'un bug silencieux : les mises à jour de profil réinitialisaient le Riot ID si non inclus dans la requête' },
        ],
      },
    ],
  },
  {
    version: '1.2.0',
    codename: 'Agents & Stats',
    date: '12 juin 2026',
    highlight: 'Tier list des agents Valorant, leaderboard pro et analyse des matchups style dpm.lol',
    sections: [
      {
        emoji: '⚡',
        label: 'Stats Valorant',
        color: '#ff4655',
        changes: [
          { type: 'new',    text: 'Page "Agents & Stats" — tier list des 25 agents avec portraits réels depuis valorant-api.com' },
          { type: 'new',    text: 'Classement pro — top 30 joueurs professionnels via PandaScore API' },
          { type: 'new',    text: 'Analyse Matchups — counter-picks et synergies pour chaque agent' },
          { type: 'new',    text: 'Filtres par rôle (Duelist/Controller/Initiator/Sentinel) + recherche' },
          { type: 'new',    text: 'Tri cliquable sur toutes les colonnes — Tier, Win%, Pick%, Ban%, K/D' },
        ],
      },
      {
        emoji: '🗂️',
        label: 'Navigation',
        color: '#38bdf8',
        changes: [
          { type: 'new',    text: 'Icône crosshair dans la sidebar pour la page Agents & Stats' },
        ],
      },
    ],
  },
  {
    version: '1.1.0',
    codename: 'Community',
    date: '5 juin 2026',
    highlight: 'Photo de profil, page LFG avec Discord servers, et création de tournois',
    sections: [
      {
        emoji: '🖼️',
        label: 'Avatar',
        color: '#60a5fa',
        changes: [
          { type: 'new',    text: 'Upload de photo de profil — stocké en base64 dans localStorage' },
          { type: 'new',    text: 'Sélecteur de couleur de bordure (6 couleurs)' },
          { type: 'new',    text: 'Menu contextuel "Changer / Supprimer la photo"' },
        ],
      },
      {
        emoji: '👥',
        label: 'Page Joueurs',
        color: '#22c55e',
        changes: [
          { type: 'new',    text: 'Onglet "Joueurs LFG" — grille avec rang, rôles, région, Discord' },
          { type: 'new',    text: 'Onglet "Serveurs Discord" — 5 serveurs communautaires Valorant' },
          { type: 'new',    text: 'Filtres rang, rôle et statut LFG' },
          { type: 'new',    text: 'Copie du tag Discord en un clic' },
        ],
      },
      {
        emoji: '🏆',
        label: 'Tournois',
        color: '#f59e0b',
        changes: [
          { type: 'new',    text: 'Page Créer un tournoi — nom, format (5v5/3v3/1v1), dates, région, prize pool' },
          { type: 'new',    text: 'Cycle de statut — Ouvert → En cours → Terminé' },
          { type: 'new',    text: 'Sauvegarde dans localStorage (b3-tournaments)' },
          { type: 'new',    text: 'Suppression avec confirmation' },
        ],
      },
    ],
  },
  {
    version: '1.0.0',
    codename: 'Initial Release',
    date: '22 mai 2026',
    highlight: 'Lancement de la plateforme B3 Esport — application web Valorant complète',
    sections: [
      {
        emoji: '🚀',
        label: 'Plateforme',
        color: '#38bdf8',
        changes: [
          { type: 'new',    text: 'Authentification complète — inscription, connexion, sessions sécurisées' },
          { type: 'new',    text: 'Dashboard — statistiques live, countdown, activité, aperçu boutique' },
          { type: 'new',    text: 'Statistiques personnelles — RR ring, agents, historique (Riot API)' },
          { type: 'new',    text: 'Tournois — données live PandaScore, bracket, équipes' },
          { type: 'new',    text: 'Boutique — produits, panier, promo codes, paiement' },
          { type: 'new',    text: 'Profil — connexion Riot Games, édition, avatar' },
          { type: 'new',    text: 'Paramètres — changement de mot de passe, suppression de compte' },
        ],
      },
      {
        emoji: '🏗️',
        label: 'Architecture',
        color: '#60a5fa',
        changes: [
          { type: 'new',    text: 'Stack React 19 + TypeScript + Tailwind v4 + Framer Motion' },
          { type: 'new',    text: 'API Node.js ESM (mysql2) sur port 3001' },
          { type: 'new',    text: 'Docker MySQL 8 (mysql-b3)' },
          { type: 'new',    text: 'Sidebar desktop 240px + TopBar 52px — layout multi-colonnes' },
        ],
      },
    ],
  },
];

// ─── Change type badge ─────────────────────────────────────────────────────────

const TYPE_META: Record<ChangeType, { label: string; bg: string; color: string }> = {
  new:     { label: 'NOUVEAU',  bg: 'rgba(34,197,94,0.12)',   color: '#22c55e' },
  fix:     { label: 'CORRIGÉ', bg: 'rgba(59,130,246,0.12)',  color: '#60a5fa' },
  update:  { label: 'MAJ',     bg: 'rgba(245,158,11,0.12)',  color: '#f59e0b' },
  removed: { label: 'RETIRÉ',  bg: 'rgba(239,68,68,0.12)',   color: '#ef4444' },
  perf:    { label: 'PERF',    bg: 'rgba(167,139,250,0.12)', color: '#a78bfa' },
};

const TypeBadge: React.FC<{ type: ChangeType }> = ({ type }) => {
  const m = TYPE_META[type];
  return (
    <span className="shrink-0 rounded px-1.5 py-0.5 text-[9px] font-bold tracking-widest"
      style={{ background: m.bg, color: m.color }}>
      {m.label}
    </span>
  );
};

// ─── Single patch card ─────────────────────────────────────────────────────────

const PatchCard: React.FC<{ patch: PatchNote; index: number }> = ({ patch, index }) => {
  const [expanded, setExpanded] = useState(patch.live ?? index === 0);

  const totalChanges = patch.sections.reduce((s, sec) => s + sec.changes.length, 0);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.06 }}
      className="rounded-2xl overflow-hidden"
      style={{
        background: 'var(--card)',
        border: patch.live
          ? '1px solid rgba(47,129,247,0.35)'
          : '1px solid var(--border)',
        boxShadow: patch.live ? '0 0 40px rgba(47,129,247,0.08)' : 'none',
      }}>

      {/* ─── Header ──────────────────────────────────────── */}
      <button
        className="w-full text-left"
        onClick={() => setExpanded(v => !v)}>
        <div className="flex items-start gap-5 px-6 py-5">

          {/* Version number — Rajdhani display font */}
          <div className="shrink-0 text-center" style={{ minWidth: '80px' }}>
            <div className="font-display text-[42px] font-bold leading-none tracking-wide"
              style={{
                color: patch.live ? 'var(--violet2)' : 'var(--text3)',
                fontFamily: 'var(--font-display)',
              }}>
              {patch.version}
            </div>
            <div className="mt-1 text-[10px] font-mono font-medium uppercase tracking-widest"
              style={{ color: 'var(--text3)', fontFamily: 'var(--font-mono)' }}>
              {patch.date.split(' ')[2] ?? patch.date}
            </div>
          </div>

          {/* Divider */}
          <div className="self-stretch w-px mx-1 shrink-0" style={{ background: 'var(--border)' }} />

          {/* Info */}
          <div className="flex-1 min-w-0 pt-0.5">
            <div className="flex items-center gap-2.5 flex-wrap mb-1.5">
              {patch.live && (
                <span className="flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[10px] font-bold tracking-widest"
                  style={{ background: 'rgba(47,129,247,0.15)', color: 'var(--violet2)', border: '1px solid rgba(47,129,247,0.3)' }}>
                  <span className="h-1.5 w-1.5 rounded-full animate-pulse" style={{ background: 'var(--violet2)' }} />
                  LIVE
                </span>
              )}
              <span className="font-display text-[11px] font-bold uppercase tracking-widest"
                style={{ color: 'var(--text3)', fontFamily: 'var(--font-display)' }}>
                {patch.codename}
              </span>
              <span className="text-[11px]" style={{ color: 'var(--text3)', fontFamily: 'var(--font-mono)' }}>
                {patch.date}
              </span>
            </div>
            <p className="text-[14px] font-medium leading-snug" style={{ color: 'var(--text2)' }}>
              {patch.highlight}
            </p>
            <div className="flex items-center gap-4 mt-2.5">
              {patch.sections.map(s => (
                <span key={s.label} className="flex items-center gap-1.5 text-[11px] font-medium"
                  style={{ color: 'var(--text3)' }}>
                  <span className="h-1.5 w-1.5 rounded-full" style={{ background: s.color }} />
                  {s.label}
                </span>
              ))}
              <span className="ml-auto text-[11px]" style={{ color: 'var(--text3)', fontFamily: 'var(--font-mono)' }}>
                {totalChanges} changement{totalChanges > 1 ? 's' : ''}
              </span>
            </div>
          </div>

          {/* Expand chevron */}
          <div className="shrink-0 self-center ml-2">
            <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round"
              className={`h-4 w-4 transition-transform duration-200 ${expanded ? 'rotate-180' : ''}`}
              style={{ color: 'var(--text3)' }}>
              <path d="M4 6l4 4 4-4"/>
            </svg>
          </div>
        </div>
      </button>

      {/* ─── Body ────────────────────────────────────────── */}
      {expanded && (
        <div className="border-t" style={{ borderColor: 'var(--border)' }}>
          {patch.sections.map((sec, si) => (
            <div key={sec.label}
              className="px-6 py-4"
              style={si < patch.sections.length - 1 ? { borderBottom: '1px solid var(--border)' } : undefined}>

              {/* Section label */}
              <div className="flex items-center gap-2 mb-3">
                <span className="h-2 w-2 rounded-full shrink-0" style={{ background: sec.color }} />
                <span className="font-display text-[11px] font-bold uppercase tracking-widest"
                  style={{ color: sec.color, fontFamily: 'var(--font-display)' }}>
                  {sec.emoji} {sec.label}
                </span>
              </div>

              {/* Changes */}
              <ul className="space-y-2.5">
                {sec.changes.map((c, ci) => (
                  <li key={ci} className="flex items-start gap-3">
                    <TypeBadge type={c.type} />
                    <span className="text-[13px] leading-relaxed" style={{ color: 'var(--text2)' }}>
                      {c.text}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}
    </motion.div>
  );
};

// ─── Main page ─────────────────────────────────────────────────────────────────

const PatchNotesPage: React.FC = () => {
  const latestPatch = PATCHES[0];

  return (
    <div className="page-enter h-full overflow-y-auto">

      {/* ─── Hero header ───────────────────────────────────── */}
      <div className="relative overflow-hidden px-6 py-10"
        style={{
          background: 'linear-gradient(135deg, rgba(47,129,247,0.08) 0%, transparent 60%)',
          borderBottom: '1px solid var(--border)',
        }}>

        {/* Background version watermark */}
        <div className="absolute right-8 top-1/2 -translate-y-1/2 select-none pointer-events-none"
          style={{ fontFamily: 'var(--font-display)', fontSize: '160px', fontWeight: 700, lineHeight: 1, color: 'rgba(255,255,255,0.02)', letterSpacing: '0.05em' }}>
          {latestPatch.version}
        </div>

        <div className="relative">
          <div className="flex items-center gap-3 mb-3">
            <span className="flex items-center gap-2 rounded-full px-3 py-1 text-[11px] font-bold tracking-widest"
              style={{ background: 'rgba(47,129,247,0.15)', color: 'var(--violet2)', border: '1px solid rgba(47,129,247,0.3)' }}>
              <span className="h-1.5 w-1.5 rounded-full animate-pulse" style={{ background: 'var(--violet2)' }} />
              VERSION ACTUELLE
            </span>
            <span className="text-[12px]" style={{ color: 'var(--text3)', fontFamily: 'var(--font-mono)' }}>
              {latestPatch.date}
            </span>
          </div>

          <h1 className="text-[48px] font-bold leading-none mb-2"
            style={{ fontFamily: 'var(--font-display)', letterSpacing: '0.02em' }}>
            PATCH {latestPatch.version}
            <span className="ml-4 text-[22px] font-semibold align-middle" style={{ color: 'var(--text3)' }}>
              — {latestPatch.codename.toUpperCase()}
            </span>
          </h1>

          <p className="text-[15px] max-w-2xl" style={{ color: 'var(--text2)' }}>
            {latestPatch.highlight}
          </p>

          {/* Stats row */}
          <div className="flex items-center gap-6 mt-5">
            {[
              { label: 'Versions', value: PATCHES.length },
              { label: 'Changements', value: PATCHES.reduce((s, p) => s + p.sections.reduce((ss, sec) => ss + sec.changes.length, 0), 0) },
              { label: 'Nouvelles features', value: PATCHES.reduce((s, p) => s + p.sections.reduce((ss, sec) => ss + sec.changes.filter(c => c.type === 'new').length, 0), 0) },
              { label: 'Corrections', value: PATCHES.reduce((s, p) => s + p.sections.reduce((ss, sec) => ss + sec.changes.filter(c => c.type === 'fix').length, 0), 0) },
            ].map(stat => (
              <div key={stat.label}>
                <div className="text-[24px] font-bold" style={{ fontFamily: 'var(--font-mono)' }}>
                  {stat.value}
                </div>
                <div className="text-[11px] uppercase tracking-wider" style={{ color: 'var(--text3)' }}>
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ─── Legend ────────────────────────────────────────── */}
      <div className="flex items-center gap-4 px-6 py-3 flex-wrap"
        style={{ borderBottom: '1px solid var(--border)', background: 'var(--surface)' }}>
        <span className="text-[10px] uppercase tracking-widest font-bold" style={{ color: 'var(--text3)' }}>
          Légende :
        </span>
        {(Object.entries(TYPE_META) as [ChangeType, typeof TYPE_META[ChangeType]][]).map(([key, m]) => (
          <span key={key} className="flex items-center gap-1.5">
            <span className="rounded px-1.5 py-0.5 text-[9px] font-bold tracking-widest"
              style={{ background: m.bg, color: m.color }}>{m.label}</span>
          </span>
        ))}
        <span className="ml-auto text-[11px]" style={{ color: 'var(--text3)', fontFamily: 'var(--font-mono)' }}>
          {PATCHES.length} patch{PATCHES.length > 1 ? 'es' : ''} · Cliquez pour développer
        </span>
      </div>

      {/* ─── Patch list ────────────────────────────────────── */}
      <div className="p-6 space-y-4 max-w-4xl">
        {PATCHES.map((patch, i) => (
          <PatchCard key={patch.version} patch={patch} index={i} />
        ))}
      </div>

    </div>
  );
};

export default PatchNotesPage;
