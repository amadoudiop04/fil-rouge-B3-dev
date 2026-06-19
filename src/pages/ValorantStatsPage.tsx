import React, { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// ─── Types ────────────────────────────────────────────────────────────────────

type Tab      = 'tierlist' | 'leaderboard' | 'matchups';
type AgentRole = 'All' | 'Duelist' | 'Controller' | 'Initiator' | 'Sentinel';
type SortKey  = 'tier' | 'wr' | 'pr' | 'kd' | 'ban';

interface AgentStat {
  name: string;
  role: Exclude<AgentRole, 'All'>;
  tier: string;
  wr: number; pr: number; ban: number; kd: number; games: number;
}

interface Ability {
  slot: string;
  displayName: string;
  description: string;
  displayIcon: string | null;
}

interface ValorantAgent {
  uuid: string;
  displayName: string;
  displayIcon: string;
  fullPortrait: string | null;
  background: string | null;
  backgroundGradientColors: string[];
  description: string;
  role: { displayName: string; description?: string; displayIcon?: string } | null;
  abilities: Ability[];
}

interface ProPlayer {
  id: number;
  name: string;
  first_name: string | null;
  last_name: string | null;
  nationality: string | null;
  role: string | null;
  current_team: { name: string; image_url: string | null; acronym: string | null } | null;
}

// ─── Static data ──────────────────────────────────────────────────────────────

const TIER_ORDER = ['S+', 'S', 'A', 'B', 'C'] as const;

const TIER_BADGE: Record<string, { bg: string; color: string }> = {
  'S+': { bg: 'rgba(251,191,36,0.13)',  color: '#fbbf24' },
  'S':  { bg: 'rgba(167,139,250,0.13)', color: '#a78bfa' },
  'A':  { bg: 'rgba(96,165,250,0.13)',  color: '#60a5fa' },
  'B':  { bg: 'rgba(74,222,128,0.13)',  color: '#4ade80' },
  'C':  { bg: 'rgba(248,113,113,0.13)', color: '#f87171' },
};

const ROLE_COLOR: Record<string, string> = {
  Duelist:    '#ff4655',
  Controller: '#4ade80',
  Initiator:  '#fbbf24',
  Sentinel:   '#60a5fa',
};

const ROLES: AgentRole[] = ['All', 'Duelist', 'Controller', 'Initiator', 'Sentinel'];

const AGENT_STATS: AgentStat[] = [
  { name: 'Jett',      role: 'Duelist',    tier: 'S+', wr: 54.2, pr: 12.5, ban: 8.3, kd: 1.28, games: 892341 },
  { name: 'Reyna',     role: 'Duelist',    tier: 'S+', wr: 52.8, pr: 18.3, ban: 3.1, kd: 1.35, games: 1234567 },
  { name: 'Neon',      role: 'Duelist',    tier: 'S',  wr: 51.9, pr: 8.2,  ban: 2.4, kd: 1.22, games: 456789 },
  { name: 'Iso',       role: 'Duelist',    tier: 'S',  wr: 51.3, pr: 6.1,  ban: 1.8, kd: 1.19, games: 312456 },
  { name: 'Raze',      role: 'Duelist',    tier: 'A',  wr: 50.1, pr: 9.4,  ban: 5.2, kd: 1.15, games: 678234 },
  { name: 'Phoenix',   role: 'Duelist',    tier: 'B',  wr: 48.6, pr: 4.2,  ban: 0.8, kd: 1.08, games: 234567 },
  { name: 'Yoru',      role: 'Duelist',    tier: 'B',  wr: 47.9, pr: 3.8,  ban: 0.5, kd: 1.04, games: 198234 },
  { name: 'Omen',      role: 'Controller', tier: 'S+', wr: 53.4, pr: 14.2, ban: 4.6, kd: 1.18, games: 876543 },
  { name: 'Clove',     role: 'Controller', tier: 'S+', wr: 53.1, pr: 11.8, ban: 6.3, kd: 1.21, games: 567890 },
  { name: 'Viper',     role: 'Controller', tier: 'S',  wr: 52.3, pr: 10.5, ban: 7.9, kd: 1.12, games: 723456 },
  { name: 'Brimstone', role: 'Controller', tier: 'A',  wr: 50.8, pr: 7.3,  ban: 1.2, kd: 1.09, games: 534678 },
  { name: 'Astra',     role: 'Controller', tier: 'A',  wr: 50.2, pr: 5.1,  ban: 2.8, kd: 1.07, games: 312456 },
  { name: 'Harbor',    role: 'Controller', tier: 'C',  wr: 45.8, pr: 2.1,  ban: 0.3, kd: 0.98, games: 123456 },
  { name: 'Sova',      role: 'Initiator',  tier: 'S',  wr: 52.1, pr: 11.3, ban: 3.4, kd: 1.14, games: 789123 },
  { name: 'Skye',      role: 'Initiator',  tier: 'S',  wr: 51.8, pr: 9.7,  ban: 2.9, kd: 1.11, games: 634567 },
  { name: 'Fade',      role: 'Initiator',  tier: 'A',  wr: 50.9, pr: 8.4,  ban: 3.1, kd: 1.13, games: 512345 },
  { name: 'Gekko',     role: 'Initiator',  tier: 'A',  wr: 50.4, pr: 7.8,  ban: 2.2, kd: 1.10, games: 445678 },
  { name: 'KAY/O',     role: 'Initiator',  tier: 'A',  wr: 49.8, pr: 6.9,  ban: 1.7, kd: 1.08, games: 398765 },
  { name: 'Breach',    role: 'Initiator',  tier: 'B',  wr: 48.9, pr: 4.3,  ban: 1.1, kd: 1.02, games: 276543 },
  { name: 'Chamber',   role: 'Sentinel',   tier: 'S',  wr: 52.7, pr: 10.8, ban: 5.7, kd: 1.25, games: 698765 },
  { name: 'Killjoy',   role: 'Sentinel',   tier: 'S',  wr: 52.4, pr: 12.1, ban: 4.8, kd: 1.16, games: 812345 },
  { name: 'Cypher',    role: 'Sentinel',   tier: 'A',  wr: 50.6, pr: 7.2,  ban: 2.4, kd: 1.10, games: 489234 },
  { name: 'Sage',      role: 'Sentinel',   tier: 'B',  wr: 49.1, pr: 9.8,  ban: 1.9, kd: 0.99, games: 623456 },
  { name: 'Deadlock',  role: 'Sentinel',   tier: 'C',  wr: 46.2, pr: 3.1,  ban: 0.7, kd: 0.97, games: 167890 },
  { name: 'Vyse',      role: 'Sentinel',   tier: 'C',  wr: 45.4, pr: 2.4,  ban: 0.4, kd: 0.94, games: 134567 },
];

const MATCHUP_DATA: Record<string, { weakTo: string[]; synergy: string[] }> = {
  'Jett':      { weakTo: ['KAY/O', 'Breach', 'Fade'],        synergy: ['Viper', 'Sova', 'Killjoy'] },
  'Reyna':     { weakTo: ['KAY/O', 'Skye', 'Breach'],        synergy: ['Omen', 'Sova', 'Killjoy'] },
  'Neon':      { weakTo: ['Chamber', 'Cypher', 'Killjoy'],   synergy: ['Viper', 'Omen', 'Sova'] },
  'Iso':       { weakTo: ['KAY/O', 'Breach', 'Skye'],        synergy: ['Viper', 'Omen', 'Fade'] },
  'Raze':      { weakTo: ['Cypher', 'Killjoy', 'Sage'],      synergy: ['Viper', 'Sova', 'Fade'] },
  'Phoenix':   { weakTo: ['Sage', 'KAY/O', 'Killjoy'],       synergy: ['Viper', 'Omen', 'Skye'] },
  'Yoru':      { weakTo: ['Cypher', 'KAY/O', 'Fade'],        synergy: ['Viper', 'Skye', 'Sova'] },
  'Omen':      { weakTo: ['Sova', 'Fade', 'KAY/O'],          synergy: ['Jett', 'Raze', 'Chamber'] },
  'Clove':     { weakTo: ['KAY/O', 'Sova', 'Breach'],        synergy: ['Jett', 'Chamber', 'Killjoy'] },
  'Viper':     { weakTo: ['Sova', 'Breach', 'KAY/O'],        synergy: ['Jett', 'Chamber', 'Fade'] },
  'Brimstone': { weakTo: ['Sova', 'Fade', 'Skye'],           synergy: ['Jett', 'Raze', 'Killjoy'] },
  'Astra':     { weakTo: ['Sova', 'KAY/O', 'Breach'],        synergy: ['Jett', 'Chamber', 'Killjoy'] },
  'Harbor':    { weakTo: ['Sova', 'Fade', 'Killjoy'],        synergy: ['Raze', 'Breach', 'Skye'] },
  'Sova':      { weakTo: ['Viper', 'Omen', 'Astra'],         synergy: ['Jett', 'Chamber', 'Killjoy'] },
  'Skye':      { weakTo: ['KAY/O', 'Killjoy', 'Cypher'],    synergy: ['Jett', 'Viper', 'Killjoy'] },
  'Fade':      { weakTo: ['KAY/O', 'Jett', 'Raze'],         synergy: ['Jett', 'Viper', 'Killjoy'] },
  'Gekko':     { weakTo: ['Cypher', 'Killjoy', 'KAY/O'],    synergy: ['Jett', 'Viper', 'Chamber'] },
  'KAY/O':     { weakTo: ['Viper', 'Cypher', 'Chamber'],    synergy: ['Viper', 'Killjoy', 'Chamber'] },
  'Breach':    { weakTo: ['Viper', 'Omen', 'Killjoy'],       synergy: ['Jett', 'Raze', 'Viper'] },
  'Chamber':   { weakTo: ['KAY/O', 'Killjoy', 'Breach'],    synergy: ['Viper', 'Skye', 'Fade'] },
  'Killjoy':   { weakTo: ['Viper', 'Raze', 'KAY/O'],        synergy: ['Viper', 'Sova', 'Chamber'] },
  'Cypher':    { weakTo: ['Raze', 'Breach', 'KAY/O'],        synergy: ['Viper', 'Omen', 'Sova'] },
  'Sage':      { weakTo: ['KAY/O', 'Breach', 'Raze'],        synergy: ['Jett', 'Omen', 'Sova'] },
  'Deadlock':  { weakTo: ['Raze', 'Breach', 'KAY/O'],        synergy: ['Viper', 'Sova', 'Omen'] },
  'Vyse':      { weakTo: ['KAY/O', 'Raze', 'Breach'],        synergy: ['Viper', 'Sova', 'Omen'] },
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

const toFlag = (code: string) =>
  code.toUpperCase().replace(/./g, c => String.fromCodePoint(c.charCodeAt(0) + 127397));

const fmt = (n: number) => n >= 1000000
  ? (n / 1000000).toFixed(1) + 'M'
  : n >= 1000 ? (n / 1000).toFixed(0) + 'k' : String(n);

// ─── Sub-components ───────────────────────────────────────────────────────────

const AgentPortrait: React.FC<{ name: string; icon?: string; size?: number }> = ({ name, icon, size = 36 }) => (
  <div className="rounded-full overflow-hidden flex-shrink-0 flex items-center justify-center"
    style={{ width: size, height: size, background: 'var(--raised)' }}>
    {icon
      ? <img src={icon} alt={name} className="h-full w-full object-cover" />
      : <span className="text-[11px] font-bold" style={{ color: 'var(--text2)' }}>{name[0]}</span>
    }
  </div>
);

const TierBadge: React.FC<{ tier: string }> = ({ tier }) => {
  const style = TIER_BADGE[tier] ?? { bg: 'var(--raised)', color: 'var(--text2)' };
  return (
    <span className="inline-block text-xs font-black px-2.5 py-0.5 rounded-md"
      style={{ background: style.bg, color: style.color }}>
      {tier}
    </span>
  );
};

const RoleBadge: React.FC<{ role: string }> = ({ role }) => (
  <span className="text-xs font-medium px-2 py-0.5 rounded-md"
    style={{ background: ROLE_COLOR[role] + '18', color: ROLE_COLOR[role] }}>
    {role}
  </span>
);

// ─── Agent guides (how to play / meta) ──────────────────────────────────────────

interface RoleGuide { playstyle: string; generalTips: string[]; }
const ROLE_GUIDE: Record<string, RoleGuide> = {
  Duelist: {
    playstyle: "Entry fragger : tu prends l'espace en premier et crées l'ouverture pour ton équipe.",
    generalTips: [
      "Entre en premier sur les sites, mais attends les utilitaires de tes initiateurs.",
      "Ne gaspille pas tes capacités de mobilité : garde une option de repli.",
      "Trade tes coéquipiers — ne joue jamais trop loin du reste de l'équipe.",
    ],
  },
  Controller: {
    playstyle: "Contrôleur : tu bloques les lignes de vue avec tes fumigènes pour ouvrir ou défendre les sites.",
    generalTips: [
      "Pré-place tes smokes pour couper les angles clés avant l'exécution.",
      "Communique le timing de tes fumigènes avec les entries.",
      "Garde une smoke pour le post-plant / retake.",
    ],
  },
  Initiator: {
    playstyle: "Initiateur : tu récoltes l'info et prépares l'entrée avec flashs et reconnaissance.",
    generalTips: [
      "Utilise tes capacités d'info avant chaque prise de site.",
      "Coordonne tes flashs avec l'entry duelist (flash-in).",
      "Garde une capacité pour le retake ou le post-plant.",
    ],
  },
  Sentinel: {
    playstyle: "Sentinelle : tu ancres un site, surveilles les flancs et ralentis les pushs adverses.",
    generalTips: [
      "Place tes pièges sur les flancs et les entrées secondaires.",
      "Joue patient : ton rôle est de gagner du temps et de récupérer l'info.",
      "Garde tes utilitaires pour le retake plutôt que de tout dépenser en début de round.",
    ],
  },
};

interface AgentGuide { difficulty: 1 | 2 | 3; summary?: string; tips?: string[]; bestMaps?: string[]; }
const AGENT_GUIDE: Record<string, AgentGuide> = {
  Jett:      { difficulty: 3, summary: "Duelist mobile par excellence : dash et updraft pour des prises agressives et des frags à l'opérateur.", tips: ["Garde ton dash pour t'extraire après un kill, pas seulement pour entrer.", "L'updraft + smoke des contrôleurs ouvre des angles imprévisibles.", "Maîtrise l'Operator : ton dash compense le manque de repli."], bestMaps: ["Ascent", "Breeze", "Icebox"] },
  Reyna:     { difficulty: 2, summary: "Duelist auto-suffisante : chaque kill te soigne (Devour) ou te rend invincible (Dismiss).", tips: ["Consomme tes orbes immédiatement après un frag.", "Leer (œil) avant de peek pour aveugler les défenseurs.", "Tu brilles en solo : prends les duels que tu peux gagner."], bestMaps: ["Bind", "Lotus", "Fracture"] },
  Neon:      { difficulty: 3, summary: "Duelist ultra-rapide : sprint et glissade pour surprendre les angles.", tips: ["Utilise la glissade pour finir une course et tirer précisément.", "Le mur électrique bloque et ralentit les rotations.", "Ne sprinte pas à l'aveugle : combine avec les flashs alliés."], bestMaps: ["Breeze", "Fracture", "Pearl"] },
  Iso:       { difficulty: 2, summary: "Duelist de duel : son bouclier (Double Tap) te protège pour gagner les 1v1.", tips: ["Active ton bouclier avant chaque peek important.", "Le mur immobilisant coupe les lignes pendant l'exécution.", "Ton ultime force un 1v1 isolé — utilise-le pour casser un ancrage."], bestMaps: ["Lotus", "Sunset", "Split"] },
  Raze:      { difficulty: 2, summary: "Duelist d'explosifs : Boombot et grenades pour déloger et entrer en force.", tips: ["Le satchel double permet des entrées verticales surprenantes.", "Boombot révèle et chasse les défenseurs d'un angle.", "Showstopper nettoie un site groupé ou un post-plant."], bestMaps: ["Bind", "Split", "Haven"] },
  Phoenix:   { difficulty: 1, summary: "Duelist autonome : flashs courbées et soins via ton feu, idéal pour apprendre.", tips: ["Tes flashs se courbent : aveugle les angles sans t'exposer.", "Reste dans ton mur de feu pour récupérer de la vie.", "Ton ultime te permet de prendre des infos sans risque."], bestMaps: ["Haven", "Ascent", "Split"] },
  Yoru:      { difficulty: 3, summary: "Duelist de déception : téléportation et leurres pour prendre les défenseurs à revers.", tips: ["Place ton téléport tôt pour un flanc imprévisible.", "Le leurre simule des bruits de pas — bait les angles.", "Ta flash traverse les murs : utilise-la en entrée."], bestMaps: ["Bind", "Pearl", "Ascent"] },
  Omen:      { difficulty: 2, summary: "Contrôleur flexible : smokes à distance, flash et téléportation pour reprendre l'espace.", tips: ["Tes smokes peuvent être placées de n'importe où sur la map.", "Téléporte-toi sur un angle inattendu pour surprendre.", "Ton ultime sert à info ou flank — pas à frag directement."], bestMaps: ["Ascent", "Split", "Haven"] },
  Clove:     { difficulty: 2, summary: "Contrôleur agressif : tu peux smoke et fragger même après ta mort (résurrection).", tips: ["Joue agressivement : ton ultime te ressuscite si tu frag/assist.", "Tes smokes se placent à distance comme Omen.", "Le decay (Ruse) affaiblit les ennemis avant un duel."], bestMaps: ["Lotus", "Sunset", "Breeze"] },
  Viper:     { difficulty: 3, summary: "Contrôleuse de zone : mur toxique et nuage pour couper la map en deux.", tips: ["Gère ton carburant : ne laisse pas tomber ton mur trop tôt.", "Le Snake Bite ralentit et débusque pour le retake.", "Ton ultime (Viper's Pit) domine les post-plants et retakes."], bestMaps: ["Breeze", "Icebox", "Fracture"] },
  Brimstone: { difficulty: 1, summary: "Contrôleur simple et puissant : trois smokes posées à la carte + molotov et ultime dévastateur.", tips: ["Pose tes smokes via la carte tactique pour des exécutions propres.", "Stim Beacon accélère la cadence de tir de l'équipe.", "Ton ultime punit les post-plants et les groupes."], bestMaps: ["Bind", "Ascent", "Split"] },
  Astra:     { difficulty: 3, summary: "Contrôleuse globale : place des étoiles sur toute la map pour smoke, stun et aspirer.", tips: ["Place tes étoiles pendant le temps mort avant le round.", "Garde une étoile pour le retake / post-plant.", "Le mur (Cosmic Divide) coupe le son et la vision."], bestMaps: ["Haven", "Lotus", "Pearl"] },
  Harbor:    { difficulty: 2, summary: "Contrôleur aquatique : murs d'eau courbables et bouclier pour des exécutions agressives.", tips: ["Ton mur peut être courbé pour couvrir des angles complexes.", "La bulle (Cove) bloque les balles le temps de planter.", "Combine High Tide et Cascade pour une entrée couverte."], bestMaps: ["Pearl", "Lotus", "Sunset"] },
  Sova:      { difficulty: 2, summary: "Initiateur d'info : flèche reco, drone et flèche à choc pour révéler et déloger.", tips: ["Apprends les line-ups de flèche reco par map.", "Le drone (Owl Drive) confirme un site avant l'entrée.", "Ton ultime traverse les murs — punis les positions connues."], bestMaps: ["Ascent", "Icebox", "Breeze"] },
  Skye:      { difficulty: 2, summary: "Initiatrice polyvalente : flashs (oiseau), soin de zone et loup d'info.", tips: ["Le faucon (flash) peut être rappelé si non déclenché.", "Le loup (Trailblazer) révèle et concuss un angle.", "Ton ultime traque plusieurs ennemis — idéal en retake."], bestMaps: ["Haven", "Fracture", "Abyss"] },
  Fade:      { difficulty: 3, summary: "Initiatrice d'info brutale : prowler, œil de reconnaissance et terreur de zone.", tips: ["Apprends les line-ups de Haunt (œil) pour révéler les sites.", "Le prowler suit l'info de ton œil — combo dévastateur.", "Ton ultime sourd + révèle une large zone pour le retake."], bestMaps: ["Bind", "Lotus", "Haven"] },
  Gekko:     { difficulty: 1, summary: "Initiateur réutilisable : ses créatures (flash, capture, plant) se ramassent et se relancent.", tips: ["Récupère Dizzy et Wingman après usage pour les réutiliser.", "Wingman peut planter/désamorcer le Spike à ta place.", "Mosh Pit (ultime) déblaie un site ou un post-plant."], bestMaps: ["Split", "Sunset", "Pearl"] },
  'KAY/O':   { difficulty: 2, summary: "Initiateur anti-capacités : son couteau (ZERO/point) supprime les pouvoirs ennemis.", tips: ["Lance ton couteau avant l'exécution pour couper les utilitaires.", "Tes flashs (FLASH/drive) sont parmi les meilleures du jeu.", "Ton ultime te relève si tu es abattu — joue agressif."], bestMaps: ["Ascent", "Bind", "Icebox"] },
  Breach:    { difficulty: 2, summary: "Initiateur de zone : flashs et stuns à travers les murs pour ouvrir les sites étroits.", tips: ["Tes capacités traversent les murs : prépare l'entrée à l'aveugle.", "Coordonne Fault Line (stun) + flash avec les duelists.", "Rolling Thunder (ultime) déstabilise tout un site."], bestMaps: ["Split", "Bind", "Lotus"] },
  Chamber:   { difficulty: 3, summary: "Sentinelle agressive : téléport, piège et armes signature pour tenir les angles à l'opérateur.", tips: ["Place ton ancre de téléport pour peek agressivement sans risque.", "Headhunter (pistolet) gagne les pistols et les eco.", "Tour Demoniaque (ultime) = un Operator gratuit pour tenir un angle."], bestMaps: ["Bind", "Haven", "Sunset"] },
  Killjoy:   { difficulty: 1, summary: "Sentinelle de gadgets : tourelle, alarmbot et nanoswarms pour verrouiller un site.", tips: ["Place ton swarm + alarmbot pour couvrir les flancs.", "La tourelle donne de l'info — replace-la souvent.", "Lockdown (ultime) force le retake ou le départ d'un site."], bestMaps: ["Ascent", "Split", "Bind"] },
  Cypher:    { difficulty: 2, summary: "Sentinelle d'information : caméra, fils-pièges et cage pour surveiller toute la map.", tips: ["Cache ta caméra dans des spots inattendus.", "Les fils-pièges couvrent les flancs et révèlent les pushs.", "Ton ultime révèle toutes les positions ennemies — décisif en retake."], bestMaps: ["Ascent", "Split", "Pearl"] },
  Sage:      { difficulty: 1, summary: "Sentinelle de soutien : mur, ralentissement, soin et résurrection — le pilier de l'équipe.", tips: ["Le mur peut bloquer une entrée ou créer un boost vertical.", "Garde ta résurrection pour ton meilleur joueur / fragger.", "Les orbes de ralentissement protègent un site ou un post-plant."], bestMaps: ["Icebox", "Ascent", "Bind"] },
  Deadlock:  { difficulty: 2, summary: "Sentinelle de contrôle : barrière, capteurs sonores et nasse pour bloquer les pushs.", tips: ["La barrière (GravNet) bloque physiquement une entrée.", "Les capteurs sonores concussent ceux qui font du bruit.", "Ton ultime capture un ennemi à travers les murs."], bestMaps: ["Icebox", "Breeze", "Abyss"] },
  Vyse:      { difficulty: 3, summary: "Sentinelle de piège : ronces, mur métallique instantané et brouillage d'armes.", tips: ["Pré-place tes ronces invisibles sur les angles clés.", "Le mur (Razorvine) se déclenche au moment parfait pour stopper une entrée.", "Ton ultime (Steal) empêche les ennemis de tirer — combo retake."], bestMaps: ["Sunset", "Lotus", "Haven"] },
};

const SLOT_KEY: Record<string, string> = { Ability1: 'Q', Ability2: 'E', Grenade: 'C', Ultimate: 'X', Passive: '•' };
const DIFFICULTY_LABEL = ['', 'Facile', 'Intermédiaire', 'Difficile'];

// ─── Agent detail page ──────────────────────────────────────────────────────────

const AgentDetail: React.FC<{
  name: string;
  stat?: AgentStat;
  apiAgent?: ValorantAgent;
  matchup?: { weakTo: string[]; synergy: string[] };
  apiAgents: Record<string, ValorantAgent>;
  onBack: () => void;
  onSelect: (name: string) => void;
}> = ({ name, stat, apiAgent, matchup, apiAgents, onBack, onSelect }) => {
  const guide     = AGENT_GUIDE[name];
  const roleGuide = stat ? ROLE_GUIDE[stat.role] : undefined;
  const summary   = guide?.summary ?? roleGuide?.playstyle ?? '';
  const tips      = guide?.tips ?? roleGuide?.generalTips ?? [];
  const bestMaps  = guide?.bestMaps ?? [];
  const difficulty = guide?.difficulty ?? 2;

  // Tier-list rank (by tier, then win-rate)
  const rank = useMemo(() => {
    const sorted = [...AGENT_STATS].sort((a, b) => {
      const d = TIER_ORDER.indexOf(a.tier as typeof TIER_ORDER[number]) - TIER_ORDER.indexOf(b.tier as typeof TIER_ORDER[number]);
      return d !== 0 ? d : b.wr - a.wr;
    });
    return sorted.findIndex(a => a.name === name) + 1;
  }, [name]);

  const grad = apiAgent?.backgroundGradientColors ?? [];
  const heroGradient = grad.length >= 4
    ? `linear-gradient(120deg, #${grad[0]} 0%, #${grad[1]} 40%, #${grad[2]} 75%, #${grad[3]} 100%)`
    : 'linear-gradient(120deg, var(--accent) 0%, var(--accent2) 100%)';

  const abilities = (apiAgent?.abilities ?? []).filter(a => a.displayName && a.slot !== 'Passive' || (a.slot === 'Passive' && a.description));

  const metaCards = stat ? [
    { label: 'Win Rate',  value: `${stat.wr.toFixed(1)}%`, color: stat.wr >= 52.5 ? 'var(--green)' : stat.wr >= 50 ? 'var(--text1)' : 'var(--red)' },
    { label: 'Pick Rate', value: `${stat.pr.toFixed(1)}%`, color: 'var(--text1)' },
    { label: 'Ban Rate',  value: `${stat.ban.toFixed(1)}%`, color: 'var(--text1)' },
    { label: 'K/D',       value: stat.kd.toFixed(2), color: stat.kd >= 1.2 ? 'var(--green)' : 'var(--text1)' },
    { label: 'Parties',   value: fmt(stat.games), color: 'var(--text1)' },
    { label: 'Rang méta', value: `#${rank}`, color: 'var(--accent2)' },
  ] : [];

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }} className="space-y-5">

      {/* Back */}
      <button onClick={onBack}
        className="flex items-center gap-2 text-sm font-semibold transition hover:opacity-80"
        style={{ color: 'var(--text2)' }}>
        <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" className="h-4 w-4"><path d="M10 3l-5 5 5 5" /></svg>
        Retour à la tier list
      </button>

      {/* Hero */}
      <div className="relative overflow-hidden rounded-2xl" style={{ minHeight: 280, background: heroGradient }}>
        {apiAgent?.background && (
          <img src={apiAgent.background} alt="" className="absolute inset-0 h-full w-full object-cover opacity-20 mix-blend-luminosity" />
        )}
        {/* dark scrim for legibility */}
        <div className="absolute inset-0" style={{ background: 'linear-gradient(90deg, rgba(6,20,41,0.94) 0%, rgba(6,20,41,0.72) 48%, rgba(6,20,41,0.25) 100%)' }} />
        {/* portrait */}
        {apiAgent?.fullPortrait && (
          <img src={apiAgent.fullPortrait} alt={name}
            className="absolute right-0 bottom-0 h-[112%] object-contain pointer-events-none"
            style={{ filter: 'drop-shadow(0 12px 30px rgba(0,0,0,0.5))' }} />
        )}
        {/* content */}
        <div className="relative p-7 max-w-[60%]">
          <div className="flex items-center gap-3 mb-2">
            {stat && <RoleBadge role={stat.role} />}
            {stat && <TierBadge tier={stat.tier} />}
            <span className="flex items-center gap-1.5 text-[12px] font-semibold" style={{ color: 'var(--text2)' }}>
              {Array.from({ length: 3 }).map((_, i) => (
                <span key={i} className="h-1.5 w-4 rounded-full"
                  style={{ background: i < difficulty ? 'var(--accent2)' : 'rgba(255,255,255,0.15)' }} />
              ))}
              {DIFFICULTY_LABEL[difficulty]}
            </span>
          </div>
          <h1 className="font-display text-[52px] font-bold leading-none uppercase tracking-wide">{name}</h1>
          {apiAgent?.role && (
            <p className="mt-3 text-[14px] leading-relaxed" style={{ color: 'var(--text2)' }}>
              {apiAgent.role.description || apiAgent.description}
            </p>
          )}
        </div>
      </div>

      {/* Meta cards */}
      <div className="grid grid-cols-6 gap-3">
        {metaCards.map(c => (
          <div key={c.label} className="card p-3.5 text-center">
            <div className="font-mono text-[20px] font-bold leading-none" style={{ color: c.color }}>{c.value}</div>
            <div className="mt-1.5 text-[10px] uppercase tracking-wider" style={{ color: 'var(--text3)' }}>{c.label}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-5 gap-4">

        {/* Abilities */}
        <div className="card p-5 col-span-3">
          <h3 className="font-display text-[14px] font-bold uppercase tracking-wide mb-4">Compétences</h3>
          <div className="space-y-3">
            {abilities.length === 0 && <p className="text-sm" style={{ color: 'var(--text3)' }}>Chargement des compétences…</p>}
            {abilities.map(ab => (
              <div key={ab.slot} className="flex gap-3.5 items-start">
                <div className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-xl" style={{ background: 'var(--raised)' }}>
                  {ab.displayIcon
                    ? <img src={ab.displayIcon} alt={ab.displayName} className="h-7 w-7 object-contain" />
                    : <span className="text-[13px] font-bold" style={{ color: 'var(--accent2)' }}>{SLOT_KEY[ab.slot] ?? '?'}</span>}
                  <span className="absolute -bottom-1.5 -right-1.5 flex h-5 w-5 items-center justify-center rounded-md text-[10px] font-bold font-mono text-white"
                    style={{ background: 'var(--accent)', border: '2px solid var(--card)' }}>
                    {SLOT_KEY[ab.slot] ?? '?'}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[13.5px] font-semibold">{ab.displayName}</div>
                  <p className="text-[12.5px] leading-relaxed mt-0.5" style={{ color: 'var(--text2)' }}>{ab.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* How to play */}
        <div className="col-span-2 space-y-4">
          <div className="card p-5">
            <h3 className="font-display text-[14px] font-bold uppercase tracking-wide mb-3">Comment le jouer</h3>
            <p className="text-[13px] leading-relaxed mb-4" style={{ color: 'var(--text2)' }}>{summary}</p>
            <div className="space-y-2.5">
              {tips.map((t, i) => (
                <div key={i} className="flex gap-2.5 items-start">
                  <svg viewBox="0 0 16 16" fill="none" stroke="var(--accent2)" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4 shrink-0 mt-0.5">
                    <path d="M3 8l4 4 6-8" />
                  </svg>
                  <span className="text-[12.5px] leading-relaxed" style={{ color: 'var(--text2)' }}>{t}</span>
                </div>
              ))}
            </div>
          </div>

          {bestMaps.length > 0 && (
            <div className="card p-5">
              <h3 className="font-display text-[14px] font-bold uppercase tracking-wide mb-3">Meilleures maps</h3>
              <div className="flex flex-wrap gap-2">
                {bestMaps.map(m => (
                  <span key={m} className="rounded-lg px-3 py-1.5 text-[12px] font-semibold"
                    style={{ background: 'var(--raised)', color: 'var(--text1)' }}>{m}</span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Counters & synergies */}
      {matchup && (
        <div className="grid grid-cols-2 gap-4">
          <div className="card p-5">
            <div className="flex items-center gap-2 mb-3">
              <span className="h-2 w-2 rounded-full" style={{ background: 'var(--red)' }} />
              <h3 className="font-display text-[14px] font-bold uppercase tracking-wide">Faible face à</h3>
            </div>
            <div className="grid grid-cols-3 gap-2.5">
              {matchup.weakTo.map(n => (
                <button key={n} onClick={() => onSelect(n)}
                  className="flex items-center gap-2 px-2.5 py-2 rounded-xl transition hover:bg-white/5"
                  style={{ background: 'var(--raised)' }}>
                  <AgentPortrait name={n} icon={apiAgents[n]?.displayIcon} size={28} />
                  <span className="text-[12px] font-semibold truncate">{n}</span>
                </button>
              ))}
            </div>
          </div>
          <div className="card p-5">
            <div className="flex items-center gap-2 mb-3">
              <span className="h-2 w-2 rounded-full" style={{ background: 'var(--green)' }} />
              <h3 className="font-display text-[14px] font-bold uppercase tracking-wide">Synergies</h3>
            </div>
            <div className="grid grid-cols-3 gap-2.5">
              {matchup.synergy.map(n => (
                <button key={n} onClick={() => onSelect(n)}
                  className="flex items-center gap-2 px-2.5 py-2 rounded-xl transition hover:bg-white/5"
                  style={{ background: 'var(--raised)' }}>
                  <AgentPortrait name={n} icon={apiAgents[n]?.displayIcon} size={28} />
                  <span className="text-[12px] font-semibold truncate">{n}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
};

// ─── Main component ───────────────────────────────────────────────────────────

const ValorantStatsPage: React.FC = () => {
  const [tab,          setTab]          = useState<Tab>('tierlist');
  const [roleFilter,   setRoleFilter]   = useState<AgentRole>('All');
  const [search,       setSearch]       = useState('');
  const [sortKey,      setSortKey]      = useState<SortKey>('tier');
  const [sortAsc,      setSortAsc]      = useState(true);
  const [apiAgents,    setApiAgents]    = useState<Record<string, ValorantAgent>>({});
  const [proPlayers,   setProPlayers]   = useState<ProPlayer[]>([]);
  const [proLoading,   setProLoading]   = useState(false);
  const [proError,     setProError]     = useState<string | null>(null);
  const [selectedAgent, setSelectedAgent] = useState<string>('Jett');
  const [detailAgent,   setDetailAgent]   = useState<string | null>(null);

  // Fetch real agent icons from valorant-api.com (no key needed)
  useEffect(() => {
    fetch('https://valorant-api.com/v1/agents?isPlayableCharacter=true&language=fr-FR')
      .then(r => r.json())
      .then(({ data }: { data: ValorantAgent[] }) => {
        const map: Record<string, ValorantAgent> = {};
        for (const a of data) map[a.displayName] = a;
        setApiAgents(map);
      })
      .catch(() => {});
  }, []);

  // Fetch pro players from PandaScore
  useEffect(() => {
    if (tab !== 'leaderboard') return;
    if (proPlayers.length > 0) return;
    setProLoading(true);
    setProError(null);
    const token = import.meta.env.VITE_PANDASCORE_TOKEN as string | undefined;
    fetch('https://api.pandascore.co/valorant/players?sort=-id&per_page=30', {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    })
      .then(r => r.json())
      .then((data: unknown) => {
        if (!Array.isArray(data)) throw new Error();
        setProPlayers(data as ProPlayer[]);
      })
      .catch(() => setProError('Impossible de charger les données'))
      .finally(() => setProLoading(false));
  }, [tab, proPlayers.length]);

  // Sorted & filtered tier list
  const filteredAgents = useMemo(() => {
    let list = [...AGENT_STATS];
    if (roleFilter !== 'All') list = list.filter(a => a.role === roleFilter);
    if (search.trim()) list = list.filter(a => a.name.toLowerCase().includes(search.toLowerCase()));
    list.sort((a, b) => {
      if (sortKey === 'tier') {
        const d = TIER_ORDER.indexOf(a.tier as typeof TIER_ORDER[number]) - TIER_ORDER.indexOf(b.tier as typeof TIER_ORDER[number]);
        return sortAsc ? d : -d;
      }
      const d = a[sortKey] - b[sortKey];
      return sortAsc ? -d : d;
    });
    return list;
  }, [roleFilter, search, sortKey, sortAsc]);

  const handleSort = (key: SortKey) => {
    if (key === sortKey) setSortAsc(v => !v);
    else { setSortKey(key); setSortAsc(true); }
  };

  const totalGames = useMemo(() => AGENT_STATS.reduce((s, a) => s + a.games, 0), []);
  const topPick    = useMemo(() => [...AGENT_STATS].sort((a, b) => b.pr  - a.pr)[0],  []);
  const topBanned  = useMemo(() => [...AGENT_STATS].sort((a, b) => b.ban - a.ban)[0], []);
  const sPlus      = AGENT_STATS.filter(a => a.tier === 'S+').length;

  const agentInfo = AGENT_STATS.find(a => a.name === selectedAgent);
  const matchup   = MATCHUP_DATA[selectedAgent];

  const SortArrow = ({ k }: { k: SortKey }) => sortKey !== k ? null : (
    <svg viewBox="0 0 10 6" fill="currentColor" className={`h-2.5 w-2.5 ml-1 inline-block transition-transform ${sortAsc ? '' : 'rotate-180'}`}>
      <path d="M5 0L0 6h10z"/>
    </svg>
  );

  // ── Matchup agent chip ──────────────────────────────────────────────────────
  const MatchupAgentCard: React.FC<{ name: string }> = ({ name }) => {
    const s    = AGENT_STATS.find(a => a.name === name);
    const icon = apiAgents[name]?.displayIcon;
    return (
      <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl"
        style={{ background: 'var(--raised)' }}>
        <AgentPortrait name={name} icon={icon} size={32} />
        <div className="flex-1 min-w-0">
          <div className="text-sm font-semibold truncate">{name}</div>
          {s && <div className="text-[11px]" style={{ color: 'var(--text3)' }}>{s.role}</div>}
        </div>
        {s && <TierBadge tier={s.tier} />}
      </div>
    );
  };

  if (detailAgent) {
    return (
      <div className="page-enter p-6">
        <AgentDetail
          name={detailAgent}
          stat={AGENT_STATS.find(a => a.name === detailAgent)}
          apiAgent={apiAgents[detailAgent]}
          matchup={MATCHUP_DATA[detailAgent]}
          apiAgents={apiAgents}
          onBack={() => setDetailAgent(null)}
          onSelect={(n) => setDetailAgent(n)}
        />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-5">

      {/* ─── Page header ──────────────────────────────────────── */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Stats Valorant</h1>
          <p className="text-sm mt-1" style={{ color: 'var(--text2)' }}>
            Tier list des agents, classement pro & analyse des matchups
          </p>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold"
          style={{ background: 'rgba(255,70,85,0.08)', color: '#ff6472', border: '1px solid rgba(255,70,85,0.2)' }}>
          <span className="h-1.5 w-1.5 rounded-full animate-pulse" style={{ background: '#ff4655' }} />
          Patch 10.04 Live
        </div>
      </div>

      {/* ─── Tab bar ──────────────────────────────────────────── */}
      <div className="flex gap-1 p-1 rounded-xl w-fit" style={{ background: 'var(--surface)' }}>
        {([
          { id: 'tierlist'   as Tab, label: 'Tier List',   icon: <svg viewBox="0 0 16 16" fill="currentColor" className="h-3.5 w-3.5"><path d="M2 2h4v4H2zM6 6h4v4H6zM10 2h4v4h-4zM2 10h4v4H2z"/><path d="M10 10l2 2 4-4" stroke="currentColor" fill="none" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round"/></svg> },
          { id: 'leaderboard'as Tab, label: 'Leaderboard', icon: <svg viewBox="0 0 16 16" fill="currentColor" className="h-3.5 w-3.5"><path d="M6 10H2v4h4v-4zM10 6H6v8h4V6zM14 2h-4v12h4V2z"/></svg> },
          { id: 'matchups'   as Tab, label: 'Matchups',    icon: <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" className="h-3.5 w-3.5"><circle cx="8" cy="8" r="6"/><circle cx="8" cy="8" r="2"/><path d="M8 2v2M8 12v2M2 8h2M12 8h2"/></svg> },
        ]).map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className="flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-medium transition-all"
            style={tab === t.id
              ? { background: 'var(--violet)', color: '#fff' }
              : { color: 'var(--text2)', background: 'transparent' }}>
            {t.icon}{t.label}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">

        {/* ═══════════════════════════════════════════════════════
            TAB — TIER LIST
        ══════════════════════════════════════════════════════════ */}
        {tab === 'tierlist' && (
          <motion.div key="tierlist"
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.18 }}
            className="space-y-5">

            {/* Summary row */}
            <div className="grid grid-cols-4 gap-4">
              {[
                { label: 'Parties analysées', value: fmt(totalGames), sub: 'depuis le patch 10.04' },
                { label: 'Agents méta (S+)',   value: `${sPlus} agents`, sub: 'actuellement au top tier' },
                { label: 'Plus joué',          value: topPick.name,    sub: `${topPick.pr}% pick rate`, agent: topPick.name },
                { label: 'Plus banni',         value: topBanned.name,  sub: `${topBanned.ban}% ban rate`, agent: topBanned.name },
              ].map(c => (
                <div key={c.label} className="card rounded-xl p-4 flex items-center gap-4">
                  {c.agent && (
                    <AgentPortrait name={c.agent} icon={apiAgents[c.agent]?.displayIcon} size={40} />
                  )}
                  <div className="min-w-0">
                    <div className="text-lg font-bold truncate">{c.value}</div>
                    <div className="text-[11px] mt-0.5 truncate" style={{ color: 'var(--text2)' }}>{c.sub}</div>
                    <div className="text-[10px] uppercase tracking-wider mt-1 truncate" style={{ color: 'var(--text3)' }}>{c.label}</div>
                  </div>
                </div>
              ))}
            </div>

            {/* Filter bar */}
            <div className="flex items-center gap-3 flex-wrap">
              <div className="flex gap-1">
                {ROLES.map(r => (
                  <button key={r} onClick={() => setRoleFilter(r)}
                    className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
                    style={roleFilter === r
                      ? r === 'All'
                        ? { background: 'var(--violet)', color: '#fff', border: '1px solid var(--violet)' }
                        : { background: ROLE_COLOR[r] + '20', color: ROLE_COLOR[r], border: `1px solid ${ROLE_COLOR[r]}55` }
                      : { background: 'var(--surface)', color: 'var(--text2)', border: '1px solid var(--border)' }}>
                    {r}
                  </button>
                ))}
              </div>
              <div className="relative ml-auto">
                <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth={1.6}
                  className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 pointer-events-none"
                  style={{ color: 'var(--text3)' }}>
                  <circle cx="9" cy="9" r="6"/>
                  <path d="m14 14 3 3" strokeLinecap="round"/>
                </svg>
                <input value={search} onChange={e => setSearch(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter' && filteredAgents.length > 0) setDetailAgent(filteredAgents[0].name); }}
                  placeholder="Rechercher un agent..."
                  className="input pl-9 pr-9 py-2 w-64 text-sm rounded-xl" />
                {search && (
                  <button onClick={() => setSearch('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 flex h-5 w-5 items-center justify-center rounded-md transition hover:bg-white/10"
                    style={{ color: 'var(--text3)' }} title="Effacer">
                    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={1.8} className="h-3.5 w-3.5"><path d="M4 4l8 8M12 4l-8 8" strokeLinecap="round"/></svg>
                  </button>
                )}
              </div>
            </div>

            {/* Table */}
            <div className="rounded-xl overflow-hidden" style={{ border: '1px solid var(--border)' }}>
              <table className="w-full border-collapse">
                <thead>
                  <tr style={{ background: 'var(--surface)' }}>
                    {([
                      { label: '#',        key: null         },
                      { label: 'Agent',    key: null         },
                      { label: 'Rôle',     key: null         },
                      { label: 'Tier',     key: 'tier' as SortKey },
                      { label: 'Win %',    key: 'wr'   as SortKey },
                      { label: 'Pick %',   key: 'pr'   as SortKey },
                      { label: 'Ban %',    key: 'ban'  as SortKey },
                      { label: 'K/D',      key: 'kd'   as SortKey },
                      { label: 'Parties',  key: null         },
                    ] as { label: string; key: SortKey | null }[]).map(({ label, key }) => (
                      <th key={label}
                        onClick={key ? () => handleSort(key) : undefined}
                        className={`px-4 py-3 text-left text-[11px] uppercase tracking-wider font-semibold ${key ? 'cursor-pointer select-none hover:opacity-70 transition-opacity' : ''}`}
                        style={{
                          color: key && sortKey === key ? 'var(--violet2)' : 'var(--text3)',
                          borderBottom: '1px solid var(--border)',
                        }}>
                        {label}<SortArrow k={key as SortKey} />
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredAgents.map((agent, i) => {
                    const icon = apiAgents[agent.name]?.displayIcon;
                    const wrColor = agent.wr >= 52.5 ? 'var(--green)' : agent.wr >= 50 ? 'var(--text1)' : 'var(--red)';
                    const kdColor = agent.kd >= 1.2  ? 'var(--green)' : agent.kd >= 1.0 ? 'var(--text1)' : 'var(--red)';
                    const wrPct   = Math.min(100, Math.max(0, (agent.wr - 44) / 14 * 100));
                    const isLast  = i === filteredAgents.length - 1;
                    return (
                      <tr key={agent.name}
                        onClick={() => setDetailAgent(agent.name)}
                        className="group cursor-pointer transition-colors hover:bg-white/[0.04]"
                        style={{ borderBottom: isLast ? 'none' : '1px solid var(--border)' }}>
                        <td className="px-4 py-3 text-sm font-medium w-10" style={{ color: 'var(--text3)' }}>
                          {i + 1}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <AgentPortrait name={agent.name} icon={icon} size={36} />
                            <span className="text-sm font-semibold whitespace-nowrap group-hover:text-[var(--accent2)] transition-colors">{agent.name}</span>
                            <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round"
                              className="h-3.5 w-3.5 opacity-0 group-hover:opacity-100 transition-opacity" style={{ color: 'var(--accent2)' }}>
                              <path d="M6 4l4 4-4 4" />
                            </svg>
                          </div>
                        </td>
                        <td className="px-4 py-3"><RoleBadge role={agent.role} /></td>
                        <td className="px-4 py-3"><TierBadge tier={agent.tier} /></td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2.5">
                            <div className="h-1 w-14 rounded-full overflow-hidden" style={{ background: 'var(--raised)' }}>
                              <div className="h-full rounded-full transition-all"
                                style={{ width: `${wrPct}%`, background: agent.wr >= 52.5 ? 'var(--green)' : agent.wr >= 50 ? 'var(--amber)' : 'var(--red)' }} />
                            </div>
                            <span className="text-sm font-semibold tabular-nums" style={{ color: wrColor }}>
                              {agent.wr.toFixed(1)}%
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm tabular-nums" style={{ color: 'var(--text2)' }}>
                          {agent.pr.toFixed(1)}%
                        </td>
                        <td className="px-4 py-3 text-sm tabular-nums" style={{ color: 'var(--text2)' }}>
                          {agent.ban.toFixed(1)}%
                        </td>
                        <td className="px-4 py-3 text-sm font-semibold tabular-nums" style={{ color: kdColor }}>
                          {agent.kd.toFixed(2)}
                        </td>
                        <td className="px-4 py-3 text-sm tabular-nums" style={{ color: 'var(--text3)' }}>
                          {fmt(agent.games)}
                        </td>
                      </tr>
                    );
                  })}
                  {filteredAgents.length === 0 && (
                    <tr>
                      <td colSpan={9} className="px-4 py-16 text-center text-sm" style={{ color: 'var(--text3)' }}>
                        Aucun agent ne correspond à la recherche
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Legend */}
            <div className="flex items-center gap-6 pt-1">
              <span className="text-[11px] uppercase tracking-wider" style={{ color: 'var(--text3)' }}>Tier :</span>
              {TIER_ORDER.map(t => (
                <div key={t} className="flex items-center gap-1.5">
                  <TierBadge tier={t} />
                  <span className="text-[11px]" style={{ color: 'var(--text3)' }}>
                    {t === 'S+' ? 'Incontournable' : t === 'S' ? 'Excellent' : t === 'A' ? 'Bon' : t === 'B' ? 'Passable' : 'Faible'}
                  </span>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* ═══════════════════════════════════════════════════════
            TAB — LEADERBOARD
        ══════════════════════════════════════════════════════════ */}
        {tab === 'leaderboard' && (
          <motion.div key="leaderboard"
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.18 }}
            className="space-y-5">

            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold">Top Joueurs Professionnels</h2>
                <p className="text-sm mt-0.5" style={{ color: 'var(--text2)' }}>
                  Classement des meilleurs joueurs Valorant compétitifs
                </p>
              </div>
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs"
                style={{ background: 'var(--surface)', color: 'var(--text3)', border: '1px solid var(--border)' }}>
                <svg viewBox="0 0 14 14" fill="currentColor" className="h-3 w-3">
                  <path d="M7 0a7 7 0 100 14A7 7 0 007 0zm.5 4v3.7l2.5 2.5-.7.7L6.5 8V4h1z"/>
                </svg>
                Via PandaScore API
              </div>
            </div>

            {proLoading && (
              <div className="card rounded-xl flex items-center justify-center py-24">
                <div className="flex flex-col items-center gap-4">
                  <div className="flex gap-1.5">
                    {[0, 1, 2].map(i => (
                      <motion.div key={i} className="h-2 w-2 rounded-full"
                        style={{ background: 'var(--violet)' }}
                        animate={{ opacity: [0.3, 1, 0.3] }}
                        transition={{ duration: 1, repeat: Infinity, delay: i * 0.15 }} />
                    ))}
                  </div>
                  <span className="text-sm" style={{ color: 'var(--text3)' }}>Chargement des joueurs…</span>
                </div>
              </div>
            )}

            {proError && !proLoading && (
              <div className="card rounded-xl p-10 text-center">
                <div className="text-3xl mb-3">⚠️</div>
                <div className="text-sm font-medium mb-1">Erreur de chargement</div>
                <div className="text-sm" style={{ color: 'var(--text3)' }}>{proError}</div>
                <button onClick={() => { setProPlayers([]); setProError(null); setProLoading(true); }}
                  className="btn-primary mt-4 px-4 py-2 rounded-lg text-sm">
                  Réessayer
                </button>
              </div>
            )}

            {!proLoading && !proError && proPlayers.length > 0 && (
              <div className="rounded-xl overflow-hidden" style={{ border: '1px solid var(--border)' }}>
                <table className="w-full border-collapse">
                  <thead>
                    <tr style={{ background: 'var(--surface)', borderBottom: '1px solid var(--border)' }}>
                      {['#', 'Joueur', 'Équipe', 'Pays', 'Rôle'].map(h => (
                        <th key={h} className="px-4 py-3 text-left text-[11px] uppercase tracking-wider font-semibold"
                          style={{ color: 'var(--text3)' }}>
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {proPlayers.map((p, i) => {
                      const rankBadge = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : null;
                      return (
                        <tr key={p.id}
                          className="transition-colors hover:bg-white/[0.025]"
                          style={{ borderBottom: i < proPlayers.length - 1 ? '1px solid var(--border)' : 'none' }}>
                          <td className="px-4 py-3 w-12">
                            {rankBadge
                              ? <span className="text-xl">{rankBadge}</span>
                              : <span className="text-sm font-semibold tabular-nums" style={{ color: 'var(--text3)' }}>{i + 1}</span>
                            }
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-3">
                              <div className="h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                                style={{ background: 'var(--violet)', color: '#fff' }}>
                                {p.name[0]?.toUpperCase() ?? '?'}
                              </div>
                              <div>
                                <div className="text-sm font-bold">{p.name}</div>
                                {(p.first_name || p.last_name) && (
                                  <div className="text-[11px]" style={{ color: 'var(--text3)' }}>
                                    {[p.first_name, p.last_name].filter(Boolean).join(' ')}
                                  </div>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            {p.current_team ? (
                              <div className="flex items-center gap-2">
                                {p.current_team.image_url && (
                                  <img src={p.current_team.image_url} alt=""
                                    className="h-5 w-5 object-contain rounded flex-shrink-0"
                                    onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                                )}
                                <span className="text-sm">{p.current_team.name}</span>
                                {p.current_team.acronym && (
                                  <span className="text-[11px] px-1.5 py-0.5 rounded font-mono"
                                    style={{ background: 'var(--raised)', color: 'var(--text3)' }}>
                                    {p.current_team.acronym}
                                  </span>
                                )}
                              </div>
                            ) : (
                              <span className="text-sm" style={{ color: 'var(--text3)' }}>Free agent</span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-xl">
                            {p.nationality ? toFlag(p.nationality) : <span style={{ color: 'var(--text3)' }}>—</span>}
                          </td>
                          <td className="px-4 py-3">
                            {p.role ? (
                              <span className="text-xs px-2 py-0.5 rounded-md font-medium capitalize"
                                style={{ background: 'var(--raised)', color: 'var(--text2)' }}>
                                {p.role}
                              </span>
                            ) : (
                              <span style={{ color: 'var(--text3)' }}>—</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </motion.div>
        )}

        {/* ═══════════════════════════════════════════════════════
            TAB — MATCHUPS
        ══════════════════════════════════════════════════════════ */}
        {tab === 'matchups' && (
          <motion.div key="matchups"
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.18 }}
            className="space-y-5">

            <div>
              <h2 className="text-lg font-bold">Analyse des Matchups</h2>
              <p className="text-sm mt-0.5" style={{ color: 'var(--text2)' }}>
                Sélectionne un agent pour voir ses counter-picks et synergies
              </p>
            </div>

            {/* Agent grid picker */}
            <div className="card rounded-xl p-5">
              <div className="text-xs uppercase tracking-wider font-semibold mb-4" style={{ color: 'var(--text3)' }}>
                Choisir un agent
              </div>
              <div className="flex flex-wrap gap-2">
                {AGENT_STATS.map(a => {
                  const icon = apiAgents[a.name]?.displayIcon;
                  const selected = a.name === selectedAgent;
                  return (
                    <button key={a.name} onClick={() => setSelectedAgent(a.name)}
                      title={a.name}
                      className="relative rounded-xl overflow-hidden transition-all h-11 w-11"
                      style={{
                        background: 'var(--raised)',
                        outline: selected ? '2px solid var(--violet)' : '2px solid transparent',
                        outlineOffset: '2px',
                        opacity: selected ? 1 : 0.55,
                        transform: selected ? 'scale(1.08)' : 'scale(1)',
                      }}>
                      {icon
                        ? <img src={icon} alt={a.name} className="h-full w-full object-cover" />
                        : <span className="flex h-full w-full items-center justify-center text-[10px] font-bold"
                            style={{ color: 'var(--text2)' }}>{a.name[0]}</span>
                      }
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Detail panel */}
            {agentInfo && matchup && (
              <div className="grid grid-cols-3 gap-4">

                {/* Left: Selected agent info */}
                <div className="card rounded-xl p-5 flex flex-col items-center text-center">
                  <div className="h-20 w-20 rounded-xl overflow-hidden mb-3"
                    style={{ background: 'var(--raised)' }}>
                    {apiAgents[selectedAgent]?.displayIcon && (
                      <img src={apiAgents[selectedAgent].displayIcon} alt={selectedAgent}
                        className="h-full w-full object-cover" />
                    )}
                  </div>
                  <div className="text-lg font-bold">{selectedAgent}</div>
                  <div className="mt-1"><RoleBadge role={agentInfo.role} /></div>

                  <div className="mt-5 w-full space-y-2.5">
                    {[
                      { label: 'Tier',      value: <TierBadge tier={agentInfo.tier} /> },
                      { label: 'Win Rate',  value: <span className="font-semibold text-sm" style={{ color: agentInfo.wr >= 52 ? 'var(--green)' : 'var(--text1)' }}>{agentInfo.wr.toFixed(1)}%</span> },
                      { label: 'Pick Rate', value: <span className="text-sm font-semibold">{agentInfo.pr.toFixed(1)}%</span> },
                      { label: 'Ban Rate',  value: <span className="text-sm font-semibold">{agentInfo.ban.toFixed(1)}%</span> },
                      { label: 'K/D Ratio', value: <span className="font-semibold text-sm" style={{ color: agentInfo.kd >= 1.2 ? 'var(--green)' : 'var(--text1)' }}>{agentInfo.kd.toFixed(2)}</span> },
                    ].map(({ label, value }) => (
                      <div key={label} className="flex items-center justify-between py-1"
                        style={{ borderBottom: '1px solid var(--border)' }}>
                        <span className="text-xs" style={{ color: 'var(--text3)' }}>{label}</span>
                        {value}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Middle: Weak to (counters) */}
                <div className="card rounded-xl p-5">
                  <div className="flex items-center gap-2.5 mb-4">
                    <div className="h-8 w-8 rounded-lg flex items-center justify-center flex-shrink-0"
                      style={{ background: 'rgba(239,68,68,0.12)' }}>
                      <svg viewBox="0 0 16 16" fill="none" stroke="#ef4444" strokeWidth={1.6} strokeLinecap="round" className="h-4 w-4">
                        <path d="M8 2v6l4 2M2 12l12-4"/>
                      </svg>
                    </div>
                    <div>
                      <div className="text-sm font-bold">Contre-picks</div>
                      <div className="text-[11px]" style={{ color: 'var(--text3)' }}>Agents qui neutralisent {selectedAgent}</div>
                    </div>
                  </div>
                  <div className="space-y-2.5">
                    {matchup.weakTo.map(name => <MatchupAgentCard key={name} name={name} />)}
                  </div>
                </div>

                {/* Right: Synergy */}
                <div className="card rounded-xl p-5">
                  <div className="flex items-center gap-2.5 mb-4">
                    <div className="h-8 w-8 rounded-lg flex items-center justify-center flex-shrink-0"
                      style={{ background: 'rgba(34,197,94,0.12)' }}>
                      <svg viewBox="0 0 16 16" fill="none" stroke="#22c55e" strokeWidth={1.6} strokeLinecap="round" className="h-4 w-4">
                        <path d="M3 8l4 4 6-7"/>
                      </svg>
                    </div>
                    <div>
                      <div className="text-sm font-bold">Synergies</div>
                      <div className="text-[11px]" style={{ color: 'var(--text3)' }}>Meilleurs coéquipiers pour {selectedAgent}</div>
                    </div>
                  </div>
                  <div className="space-y-2.5">
                    {matchup.synergy.map(name => <MatchupAgentCard key={name} name={name} />)}
                  </div>
                </div>

              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ValorantStatsPage;
