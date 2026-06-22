import React, { useEffect, useRef, useState } from 'react';
import { User } from '../contexts/AuthContext';
import { platformApi, type AdminOverviewResponse, type AdminUser, type DiscordServer } from '../services/platformApi';
import type { StatsRecord, MatchWithUser, ProductRecord } from '../types/api';
import { getLiveMatches, getMatchesForTournament, getRunningTournaments, getUpcomingTournaments, hasPandaToken, type EsportsTournament, type LiveMatch, type TournamentMatch } from '../services/tournamentApi';

export interface ShopItem {
  id: number; name: string; price: number; category: string;
  img: string; stock_quantity: number;
}

interface LfgPlayer {
  id: number; username: string;
  riotId?: string | null; tagLine?: string | null;
  bio?: string | null; discord?: string | null;
  twitter?: string | null; twitch?: string | null; youtube?: string | null;
  avatarUrl?: string | null;
  rankLabel?: string | null; roles?: string[];
  region?: string | null; languages?: string[]; playtimes?: string[];
  lfgStatus?: 'lfg' | 'busy';
}

const DEFAULT_STATS: StatsRecord = {
  user_id: 0, rank_name: 'Diamant I', rank_rating: 412, win_rate: 62.8, kd_ratio: 1.55, avg_damage: 170,
};

const rankColor = (label?: string | null): string => {
  const t = (label || '').split(' ')[0].toLowerCase();
  if (/(radiant|immort)/.test(t)) return 'var(--red)';
  if (/(diam|ascend)/.test(t)) return 'var(--green)';
  return 'var(--ink2)';
};

const fmtShortDate = (iso?: string): string =>
  iso ? new Date(iso).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' }).toUpperCase() : '—';

// Relative "il y a …" for the activity feed.
const fmtAgo = (iso?: string): string => {
  if (!iso) return '—';
  const diff = Date.now() - new Date(iso).getTime();
  if (Number.isNaN(diff)) return '—';
  const h = Math.floor(diff / 3600000);
  if (h < 1) return `${Math.max(1, Math.floor(diff / 60000))}m`;
  if (h < 24) return `${h}h`;
  return `${Math.floor(h / 24)}j`;
};

// Full Valorant roster meta (tier / win-rate / pick-rate / K/D) so the Agents
// tab always lists every agent, not only the ones the logged-in player has played.
type AgentMeta = { name: string; role: string; tier: string; win: number; pick: number; kd: number };
const AGENT_META: AgentMeta[] = [
  { name: 'Jett',      role: 'DUELLISTE',  tier: 'S+', win: 54.2, pick: 12.5, kd: 1.28 },
  { name: 'Reyna',     role: 'DUELLISTE',  tier: 'S+', win: 52.8, pick: 18.3, kd: 1.35 },
  { name: 'Neon',      role: 'DUELLISTE',  tier: 'S',  win: 51.9, pick: 8.2,  kd: 1.22 },
  { name: 'Iso',       role: 'DUELLISTE',  tier: 'S',  win: 51.3, pick: 6.1,  kd: 1.19 },
  { name: 'Raze',      role: 'DUELLISTE',  tier: 'A',  win: 50.1, pick: 9.4,  kd: 1.15 },
  { name: 'Phoenix',   role: 'DUELLISTE',  tier: 'B',  win: 48.6, pick: 4.2,  kd: 1.08 },
  { name: 'Yoru',      role: 'DUELLISTE',  tier: 'B',  win: 47.9, pick: 3.8,  kd: 1.04 },
  { name: 'Omen',      role: 'CONTRÔLEUR', tier: 'S+', win: 53.4, pick: 14.2, kd: 1.18 },
  { name: 'Clove',     role: 'CONTRÔLEUR', tier: 'S+', win: 53.1, pick: 11.8, kd: 1.21 },
  { name: 'Viper',     role: 'CONTRÔLEUR', tier: 'S',  win: 52.3, pick: 10.5, kd: 1.12 },
  { name: 'Brimstone', role: 'CONTRÔLEUR', tier: 'A',  win: 50.8, pick: 7.3,  kd: 1.09 },
  { name: 'Astra',     role: 'CONTRÔLEUR', tier: 'A',  win: 50.2, pick: 5.1,  kd: 1.07 },
  { name: 'Harbor',    role: 'CONTRÔLEUR', tier: 'C',  win: 45.8, pick: 2.1,  kd: 0.98 },
  { name: 'Sova',      role: 'INITIATEUR', tier: 'S',  win: 52.1, pick: 11.3, kd: 1.14 },
  { name: 'Skye',      role: 'INITIATEUR', tier: 'S',  win: 51.8, pick: 9.7,  kd: 1.11 },
  { name: 'Fade',      role: 'INITIATEUR', tier: 'A',  win: 50.9, pick: 8.4,  kd: 1.13 },
  { name: 'Gekko',     role: 'INITIATEUR', tier: 'A',  win: 50.4, pick: 7.8,  kd: 1.10 },
  { name: 'KAY/O',     role: 'INITIATEUR', tier: 'A',  win: 49.8, pick: 6.9,  kd: 1.08 },
  { name: 'Breach',    role: 'INITIATEUR', tier: 'B',  win: 48.9, pick: 4.3,  kd: 1.02 },
  { name: 'Chamber',   role: 'SENTINELLE', tier: 'S',  win: 52.7, pick: 10.8, kd: 1.25 },
  { name: 'Killjoy',   role: 'SENTINELLE', tier: 'S',  win: 52.4, pick: 12.1, kd: 1.16 },
  { name: 'Cypher',    role: 'SENTINELLE', tier: 'A',  win: 50.6, pick: 7.2,  kd: 1.10 },
  { name: 'Sage',      role: 'SENTINELLE', tier: 'B',  win: 49.1, pick: 9.8,  kd: 0.99 },
  { name: 'Deadlock',  role: 'SENTINELLE', tier: 'C',  win: 46.2, pick: 3.1,  kd: 0.97 },
  { name: 'Vyse',      role: 'SENTINELLE', tier: 'C',  win: 45.4, pick: 2.4,  kd: 0.94 },
];
const TIER_RANK: Record<string, number> = { 'S+': 0, S: 1, A: 2, B: 3, C: 4 };

// Live agent data (abilities/spells, portraits) from valorant-api.com — no key needed.
interface VAbility { slot: string; displayName: string; description: string; displayIcon: string | null; }
export interface ValorantAgent {
  uuid: string; displayName: string; displayIcon: string;
  fullPortrait: string | null; background: string | null;
  backgroundGradientColors: string[]; description: string;
  role: { displayName: string; description?: string } | null;
  abilities: VAbility[];
}
const SLOT_KEY: Record<string, string> = { Ability1: 'Q', Ability2: 'E', Grenade: 'C', Ultimate: 'X', Passive: '•' };
const DIFFICULTY_LABEL = ['', 'Facile', 'Intermédiaire', 'Difficile'];

// Per-agent guide: difficulty, summary, tips, best maps (static game knowledge).
interface AgentGuide { difficulty: 1 | 2 | 3; summary: string; tips: string[]; bestMaps: string[]; }
const AGENT_GUIDE: Record<string, AgentGuide> = {
  Jett:      { difficulty: 3, summary: "Duelliste mobile par excellence : dash et updraft pour des prises agressives et des frags à l'Operator.", tips: ["Garde ton dash pour t'extraire après un kill, pas seulement pour entrer.", "L'updraft + smoke des contrôleurs ouvre des angles imprévisibles.", "Maîtrise l'Operator : ton dash compense le manque de repli."], bestMaps: ["Ascent", "Breeze", "Icebox"] },
  Reyna:     { difficulty: 2, summary: "Duelliste auto-suffisante : chaque kill te soigne (Devour) ou te rend invincible (Dismiss).", tips: ["Consomme tes orbes immédiatement après un frag.", "Leer (œil) avant de peek pour aveugler les défenseurs.", "Tu brilles en solo : prends les duels que tu peux gagner."], bestMaps: ["Bind", "Lotus", "Fracture"] },
  Neon:      { difficulty: 3, summary: "Duelliste ultra-rapide : sprint et glissade pour surprendre les angles.", tips: ["Utilise la glissade pour finir une course et tirer précisément.", "Le mur électrique bloque et ralentit les rotations.", "Ne sprinte pas à l'aveugle : combine avec les flashs alliés."], bestMaps: ["Breeze", "Fracture", "Pearl"] },
  Iso:       { difficulty: 2, summary: "Duelliste de duel : son bouclier (Double Tap) te protège pour gagner les 1v1.", tips: ["Active ton bouclier avant chaque peek important.", "Le mur immobilisant coupe les lignes pendant l'exécution.", "Ton ultime force un 1v1 isolé — casse un ancrage."], bestMaps: ["Lotus", "Sunset", "Split"] },
  Raze:      { difficulty: 2, summary: "Duelliste d'explosifs : Boombot et grenades pour déloger et entrer en force.", tips: ["Le satchel double permet des entrées verticales surprenantes.", "Boombot révèle et chasse les défenseurs d'un angle.", "Showstopper nettoie un site groupé ou un post-plant."], bestMaps: ["Bind", "Split", "Haven"] },
  Phoenix:   { difficulty: 1, summary: "Duelliste autonome : flashs courbées et soins via ton feu, idéal pour apprendre.", tips: ["Tes flashs se courbent : aveugle les angles sans t'exposer.", "Reste dans ton mur de feu pour récupérer de la vie.", "Ton ultime te permet de prendre des infos sans risque."], bestMaps: ["Haven", "Ascent", "Split"] },
  Yoru:      { difficulty: 3, summary: "Duelliste de déception : téléportation et leurres pour prendre à revers.", tips: ["Place ton téléport tôt pour un flanc imprévisible.", "Le leurre simule des bruits de pas — bait les angles.", "Ta flash traverse les murs : utilise-la en entrée."], bestMaps: ["Bind", "Pearl", "Ascent"] },
  Omen:      { difficulty: 2, summary: "Contrôleur flexible : smokes à distance, flash et téléportation pour reprendre l'espace.", tips: ["Tes smokes peuvent être placées de n'importe où sur la map.", "Téléporte-toi sur un angle inattendu pour surprendre.", "Ton ultime sert à l'info ou au flank — pas à frag directement."], bestMaps: ["Ascent", "Split", "Haven"] },
  Clove:     { difficulty: 2, summary: "Contrôleur agressif : tu peux smoke et fragger même après ta mort (résurrection).", tips: ["Joue agressivement : ton ultime te ressuscite si tu frag/assist.", "Tes smokes se placent à distance comme Omen.", "Le decay (Ruse) affaiblit les ennemis avant un duel."], bestMaps: ["Lotus", "Sunset", "Breeze"] },
  Viper:     { difficulty: 3, summary: "Contrôleuse de zone : mur toxique et nuage pour couper la map en deux.", tips: ["Gère ton carburant : ne laisse pas tomber ton mur trop tôt.", "Le Snake Bite ralentit et débusque pour le retake.", "Ton ultime (Viper's Pit) domine les post-plants et retakes."], bestMaps: ["Breeze", "Icebox", "Fracture"] },
  Brimstone: { difficulty: 1, summary: "Contrôleur simple et puissant : trois smokes à la carte + molotov et ultime dévastateur.", tips: ["Pose tes smokes via la carte tactique pour des exécutions propres.", "Stim Beacon accélère la cadence de tir de l'équipe.", "Ton ultime punit les post-plants et les groupes."], bestMaps: ["Bind", "Ascent", "Split"] },
  Astra:     { difficulty: 3, summary: "Contrôleuse globale : place des étoiles sur toute la map pour smoke, stun et aspirer.", tips: ["Place tes étoiles pendant le temps mort avant le round.", "Garde une étoile pour le retake / post-plant.", "Le mur (Cosmic Divide) coupe le son et la vision."], bestMaps: ["Haven", "Lotus", "Pearl"] },
  Harbor:    { difficulty: 2, summary: "Contrôleur aquatique : murs d'eau courbables et bouclier pour des exécutions agressives.", tips: ["Ton mur peut être courbé pour couvrir des angles complexes.", "La bulle (Cove) bloque les balles le temps de planter.", "Combine High Tide et Cascade pour une entrée couverte."], bestMaps: ["Pearl", "Lotus", "Sunset"] },
  Sova:      { difficulty: 2, summary: "Initiateur d'info : flèche reco, drone et flèche à choc pour révéler et déloger.", tips: ["Apprends les line-ups de flèche reco par map.", "Le drone (Owl Drive) confirme un site avant l'entrée.", "Ton ultime traverse les murs — punis les positions connues."], bestMaps: ["Ascent", "Icebox", "Breeze"] },
  Skye:      { difficulty: 2, summary: "Initiatrice polyvalente : flashs (oiseau), soin de zone et loup d'info.", tips: ["Le faucon (flash) peut être rappelé si non déclenché.", "Le loup (Trailblazer) révèle et concuss un angle.", "Ton ultime traque plusieurs ennemis — idéal en retake."], bestMaps: ["Haven", "Fracture", "Abyss"] },
  Fade:      { difficulty: 3, summary: "Initiatrice d'info brutale : prowler, œil de reconnaissance et terreur de zone.", tips: ["Apprends les line-ups de Haunt (œil) pour révéler les sites.", "Le prowler suit l'info de ton œil — combo dévastateur.", "Ton ultime sourd + révèle une large zone pour le retake."], bestMaps: ["Bind", "Lotus", "Haven"] },
  Gekko:     { difficulty: 1, summary: "Initiateur réutilisable : ses créatures (flash, capture, plant) se ramassent et se relancent.", tips: ["Récupère Dizzy et Wingman après usage pour les réutiliser.", "Wingman peut planter/désamorcer le Spike à ta place.", "Mosh Pit (ultime) déblaie un site ou un post-plant."], bestMaps: ["Split", "Sunset", "Pearl"] },
  'KAY/O':   { difficulty: 2, summary: "Initiateur anti-capacités : son couteau (ZERO/point) supprime les pouvoirs ennemis.", tips: ["Lance ton couteau avant l'exécution pour couper les utilitaires.", "Tes flashs (FLASH/drive) sont parmi les meilleures du jeu.", "Ton ultime te relève si tu es abattu — joue agressif."], bestMaps: ["Ascent", "Bind", "Icebox"] },
  Breach:    { difficulty: 2, summary: "Initiateur de zone : flashs et stuns à travers les murs pour ouvrir les sites étroits.", tips: ["Tes capacités traversent les murs : prépare l'entrée à l'aveugle.", "Coordonne Fault Line (stun) + flash avec les duellistes.", "Rolling Thunder (ultime) déstabilise tout un site."], bestMaps: ["Split", "Bind", "Lotus"] },
  Chamber:   { difficulty: 3, summary: "Sentinelle agressive : téléport, piège et armes signature pour tenir les angles à l'Operator.", tips: ["Place ton ancre de téléport pour peek agressivement sans risque.", "Headhunter (pistolet) gagne les pistols et les eco.", "Tour Démoniaque (ultime) = un Operator gratuit pour tenir un angle."], bestMaps: ["Bind", "Haven", "Sunset"] },
  Killjoy:   { difficulty: 1, summary: "Sentinelle de gadgets : tourelle, alarmbot et nanoswarms pour verrouiller un site.", tips: ["Place ton swarm + alarmbot pour couvrir les flancs.", "La tourelle donne de l'info — replace-la souvent.", "Lockdown (ultime) force le retake ou le départ d'un site."], bestMaps: ["Ascent", "Split", "Bind"] },
  Cypher:    { difficulty: 2, summary: "Sentinelle d'information : caméra, fils-pièges et cage pour surveiller toute la map.", tips: ["Cache ta caméra dans des spots inattendus.", "Les fils-pièges couvrent les flancs et révèlent les pushs.", "Ton ultime révèle toutes les positions ennemies — décisif en retake."], bestMaps: ["Ascent", "Split", "Pearl"] },
  Sage:      { difficulty: 1, summary: "Sentinelle de soutien : mur, ralentissement, soin et résurrection — le pilier de l'équipe.", tips: ["Le mur peut bloquer une entrée ou créer un boost vertical.", "Garde ta résurrection pour ton meilleur fragger.", "Les orbes de ralentissement protègent un site ou un post-plant."], bestMaps: ["Icebox", "Ascent", "Bind"] },
  Deadlock:  { difficulty: 2, summary: "Sentinelle de contrôle : barrière, capteurs sonores et nasse pour bloquer les pushs.", tips: ["La barrière (GravNet) bloque physiquement une entrée.", "Les capteurs sonores concussent ceux qui font du bruit.", "Ton ultime capture un ennemi à travers les murs."], bestMaps: ["Icebox", "Breeze", "Abyss"] },
  Vyse:      { difficulty: 3, summary: "Sentinelle de piège : ronces, mur métallique instantané et brouillage d'armes.", tips: ["Pré-place tes ronces invisibles sur les angles clés.", "Le mur (Razorvine) se déclenche au moment parfait pour stopper une entrée.", "Ton ultime (Steal) empêche les ennemis de tirer — combo retake."], bestMaps: ["Sunset", "Lotus", "Haven"] },
};

// Counter picks & synergies per agent (vlr/meta knowledge). Names match AGENT_META.
const MATCHUP_DATA: Record<string, { weakTo: string[]; synergy: string[] }> = {
  Jett:      { weakTo: ['KAY/O', 'Breach', 'Fade'],     synergy: ['Viper', 'Sova', 'Killjoy'] },
  Reyna:     { weakTo: ['KAY/O', 'Skye', 'Breach'],     synergy: ['Omen', 'Sova', 'Killjoy'] },
  Neon:      { weakTo: ['Chamber', 'Cypher', 'Killjoy'],synergy: ['Viper', 'Omen', 'Sova'] },
  Iso:       { weakTo: ['KAY/O', 'Breach', 'Skye'],     synergy: ['Viper', 'Omen', 'Fade'] },
  Raze:      { weakTo: ['Cypher', 'Killjoy', 'Sage'],   synergy: ['Viper', 'Sova', 'Fade'] },
  Phoenix:   { weakTo: ['Sage', 'KAY/O', 'Killjoy'],    synergy: ['Viper', 'Omen', 'Skye'] },
  Yoru:      { weakTo: ['Cypher', 'KAY/O', 'Fade'],     synergy: ['Viper', 'Skye', 'Sova'] },
  Omen:      { weakTo: ['Sova', 'Fade', 'KAY/O'],       synergy: ['Jett', 'Raze', 'Chamber'] },
  Clove:     { weakTo: ['KAY/O', 'Sova', 'Breach'],     synergy: ['Jett', 'Chamber', 'Killjoy'] },
  Viper:     { weakTo: ['Sova', 'Breach', 'KAY/O'],     synergy: ['Jett', 'Chamber', 'Fade'] },
  Brimstone: { weakTo: ['Sova', 'Fade', 'Skye'],        synergy: ['Jett', 'Raze', 'Killjoy'] },
  Astra:     { weakTo: ['Sova', 'KAY/O', 'Breach'],     synergy: ['Jett', 'Chamber', 'Killjoy'] },
  Harbor:    { weakTo: ['Sova', 'Fade', 'Killjoy'],     synergy: ['Raze', 'Breach', 'Skye'] },
  Sova:      { weakTo: ['Viper', 'Omen', 'Astra'],      synergy: ['Jett', 'Chamber', 'Killjoy'] },
  Skye:      { weakTo: ['KAY/O', 'Killjoy', 'Cypher'],  synergy: ['Jett', 'Viper', 'Killjoy'] },
  Fade:      { weakTo: ['KAY/O', 'Jett', 'Raze'],       synergy: ['Jett', 'Viper', 'Killjoy'] },
  Gekko:     { weakTo: ['Cypher', 'Killjoy', 'KAY/O'],  synergy: ['Jett', 'Viper', 'Chamber'] },
  'KAY/O':   { weakTo: ['Viper', 'Cypher', 'Chamber'],  synergy: ['Viper', 'Killjoy', 'Chamber'] },
  Breach:    { weakTo: ['Viper', 'Omen', 'Killjoy'],    synergy: ['Jett', 'Raze', 'Viper'] },
  Chamber:   { weakTo: ['KAY/O', 'Killjoy', 'Breach'],  synergy: ['Viper', 'Skye', 'Fade'] },
  Killjoy:   { weakTo: ['Viper', 'Raze', 'KAY/O'],      synergy: ['Viper', 'Sova', 'Chamber'] },
  Cypher:    { weakTo: ['Raze', 'Breach', 'KAY/O'],     synergy: ['Viper', 'Omen', 'Sova'] },
  Sage:      { weakTo: ['KAY/O', 'Breach', 'Raze'],     synergy: ['Jett', 'Omen', 'Sova'] },
  Deadlock:  { weakTo: ['Raze', 'Breach', 'KAY/O'],     synergy: ['Viper', 'Sova', 'Omen'] },
  Vyse:      { weakTo: ['KAY/O', 'Raze', 'Breach'],     synergy: ['Viper', 'Sova', 'Omen'] },
};

/* ════════════════════════════════════════════════════════════
   B3 ESPORT — editorial Valorant hub
   Faithful React port of the "B3 Esport" design (paper / ink / red),
   wired to the real auth session (user, cart count, logout).
═══════════════════════════════════════════════════════════════ */

type Screen =
  | 'home' | 'stats' | 'agents' | 'players'
  | 'tournaments' | 'shop' | 'panier' | 'discord' | 'profile' | 'admin';

export type CartLine = ShopItem & { quantity: number };

interface B3AppProps {
  user: User;
  cartCount: number;
  cartItems?: CartLine[];
  onLogout: () => void;
  onAddToCart?: (p: ShopItem) => void;
  onUpdateQty?: (id: number, delta: number) => void;
  onRemoveFromCart?: (id: number) => void;
  onClearCart?: () => void;
}

const ORDER_STATUS_COLOR: Record<string, string> = {
  Paid: 'var(--green)', Shipped: 'var(--ink2)', Pending: 'var(--red)', Cancelled: 'var(--muted)',
};
const eur = (n: number) => '€' + n.toFixed(2).replace('.', ',');

const C = {
  paper: 'var(--paper)', paper2: 'var(--paper2)', paper3: 'var(--paper3)',
  ink: 'var(--ink)', ink2: 'var(--ink2)', muted: 'var(--muted)',
  red: 'var(--red)', green: 'var(--green)', line: 'var(--line)', line2: 'var(--line2)',
};
const DISP = 'var(--disp)', MONO = 'var(--mono)', UI = 'var(--ui)';

/* Cubic-ease reveal that re-runs on every screen change. */
function useReveal(dep: unknown): number {
  const [e, setE] = useState(1);
  useEffect(() => {
    let raf = 0;
    const t0 = performance.now(), dur = 720;
    const tick = (t: number) => {
      const x = Math.min(1, (t - t0) / dur);
      setE(1 - Math.pow(1 - x, 3));
      if (x < 1) raf = requestAnimationFrame(tick);
    };
    setE(0);
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [dep]);
  return e;
}

const NAV_DEF: { id: Screen; label: string; adminOnly?: boolean }[] = [
  { id: 'home', label: 'Accueil' },
  { id: 'stats', label: 'Stats' },
  { id: 'agents', label: 'Agents' },
  { id: 'players', label: 'Joueurs' },
  { id: 'tournaments', label: 'Tournois' },
  { id: 'shop', label: 'Shop' },
  { id: 'discord', label: 'Discord' },
  { id: 'profile', label: 'Profil' },
  { id: 'admin', label: 'Admin', adminOnly: true },
];

const B3App: React.FC<B3AppProps> = ({ user, cartCount, cartItems = [], onLogout, onAddToCart, onUpdateQty, onRemoveFromCart, onClearCart }) => {
  const [screen, setScreenRaw] = useState<Screen>('home');
  const [role, setRole] = useState('Tous');
  const [cat, setCat] = useState('Tout');
  const [lfg, setLfg] = useState(user.showInLfg ?? true);
  const scrollRef = useRef<HTMLElement>(null);
  const targetRef = useRef(Date.now() + 4 * 86400000 + 6 * 3600000 + 23 * 60000 + 41000);

  // Real data: shop catalogue, admin overview, stats, LFG players, esports tournaments.
  const [products, setProducts] = useState<ShopItem[] | null>(null);
  const [overview, setOverview] = useState<AdminOverviewResponse | null>(null);
  const [statsData, setStatsData] = useState<{ stats: StatsRecord | null; matches: MatchWithUser[] } | null>(null);
  const [lfgPlayers, setLfgPlayers] = useState<LfgPlayer[] | null>(null);
  const [tourneys, setTourneys] = useState<EsportsTournament[] | null>(null);
  const [liveMatches, setLiveMatches] = useState<LiveMatch[] | null>(null);
  const [nextTourney, setNextTourney] = useState<EsportsTournament | null>(null);
  const [lfgSaving, setLfgSaving] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const toastTimer = useRef<number | undefined>(undefined);
  const avatarFileRef = useRef<HTMLInputElement>(null);

  // Agents tab: live agent data (abilities/portraits) + which agent is open.
  const [apiAgents, setApiAgents] = useState<Record<string, ValorantAgent>>({});
  const [detailAgent, setDetailAgent] = useState<string | null>(null);

  // Detail views: a player's public profile, and a tournament's info + matches.
  const [viewPlayer, setViewPlayer] = useState<LfgPlayer | null>(null);
  const [viewTourney, setViewTourney] = useState<EsportsTournament | null>(null);
  const [tourneyMatches, setTourneyMatches] = useState<TournamentMatch[] | null>(null);

  // Admin management: sub-tab + live lists.
  const [adminTab, setAdminTab] = useState<'overview' | 'users' | 'merch' | 'discord'>('overview');
  const [adminUsers, setAdminUsers] = useState<AdminUser[] | null>(null);
  const [adminProducts, setAdminProducts] = useState<ProductRecord[] | null>(null);
  const [prodForm, setProdForm] = useState({ name: '', price: '', category: 'ACCESSOIRES', image_url: '', stock_quantity: '' });
  const [busyId, setBusyId] = useState<number | null>(null);

  // Discord community servers (public list, managed in admin).
  const [discordServers, setDiscordServers] = useState<DiscordServer[] | null>(null);
  const [discordForm, setDiscordForm] = useState({ name: '', inviteUrl: '', tag: '', members: '', description: '' });

  // Editable profile form, seeded from the logged-in user.
  const [profileForm, setProfileForm] = useState({
    username: user.username ?? '',
    bio: user.bio ?? '',
    discord: user.discord ?? '',
    twitter: user.twitter ?? '',
    twitch: user.twitch ?? '',
    youtube: user.youtube ?? '',
    avatarUrl: user.avatarUrl ?? '',
    riotId: user.riotId ?? '',
    tagLine: user.tagLine ?? '',
    rankLabel: user.rankLabel ?? '',
    region: user.region ?? '',
    roles: (user.roles ?? []).join(', '),
    languages: (user.languages ?? []).join(', '),
    playtimes: (user.playtimes ?? []).join(', '),
  });
  const [profileSaving, setProfileSaving] = useState(false);
  const [riotInput, setRiotInput] = useState('');
  const [riotBusy, setRiotBusy] = useState(false);
  const [riotError, setRiotError] = useState<string | null>(null);
  const [checkingOut, setCheckingOut] = useState(false);

  useEffect(() => {
    let alive = true;
    platformApi.getProducts()
      .then(r => {
        if (!alive) return;
        const list = (r.success && r.products) ? r.products : [];
        setProducts(list.map(p => ({
          id: p.id, name: p.name, price: p.price,
          category: (p.category || '').toUpperCase(),
          img: p.image_url || '', stock_quantity: p.stock_quantity,
        })));
      })
      .catch(() => alive && setProducts([]));
    return () => { alive = false; };
  }, []);

  useEffect(() => {
    if (!user.isAdmin) return;
    let alive = true;
    platformApi.adminOverview()
      .then(r => alive && setOverview(r))
      .catch(() => alive && setOverview({ success: false, error: 'API indisponible' }));
    return () => { alive = false; };
  }, [user.isAdmin]);

  // Live agent roster (icons, portraits, abilities) for the Agents detail view.
  useEffect(() => {
    let alive = true;
    fetch('https://valorant-api.com/v1/agents?isPlayableCharacter=true&language=fr-FR')
      .then(r => r.json())
      .then(({ data }: { data: ValorantAgent[] }) => {
        if (!alive || !Array.isArray(data)) return;
        const map: Record<string, ValorantAgent> = {};
        for (const a of data) map[a.displayName] = a;
        setApiAgents(map);
      })
      .catch(() => undefined);
    return () => { alive = false; };
  }, []);

  // Admin management lists — loaded when an admin opens the Admin screen.
  const reloadAdminUsers = () =>
    platformApi.adminGetUsers().then(r => setAdminUsers(r.success && r.users ? r.users : []));
  const reloadAdminProducts = () =>
    platformApi.adminGetProducts().then(r => setAdminProducts(r.success && r.products ? r.products : []));
  const reloadDiscord = () =>
    platformApi.getDiscordServers().then(r => setDiscordServers(r.success && r.servers ? r.servers : []));
  // Refresh the public shop catalogue (so admin merch changes show on the Shop tab).
  const reloadShop = () =>
    platformApi.getProducts().then(r => {
      const list = (r.success && r.products) ? r.products : [];
      setProducts(list.map(p => ({
        id: p.id, name: p.name, price: p.price,
        category: (p.category || '').toUpperCase(),
        img: p.image_url || '', stock_quantity: p.stock_quantity,
      })));
    }).catch(() => undefined);
  useEffect(() => {
    if (!user.isAdmin || screen !== 'admin') return;
    reloadAdminUsers().catch(() => setAdminUsers([]));
    reloadAdminProducts().catch(() => setAdminProducts([]));
  }, [user.isAdmin, screen]);

  // Discord servers — loaded when viewing the Discord page or the Admin panel.
  useEffect(() => {
    if (screen !== 'discord' && screen !== 'admin') return;
    reloadDiscord().catch(() => setDiscordServers([]));
  }, [screen]);

  // When a tournament is opened, load its real matches (vlr.gg).
  useEffect(() => {
    if (!viewTourney) { setTourneyMatches(null); return; }
    let alive = true;
    setTourneyMatches(null);
    getMatchesForTournament(viewTourney.name)
      .then(ms => alive && setTourneyMatches(ms))
      .catch(() => alive && setTourneyMatches([]));
    return () => { alive = false; };
  }, [viewTourney]);

  // Stats + recent matches for the current player.
  useEffect(() => {
    let alive = true;
    Promise.all([
      platformApi.getUserStats(Number(user.id)),
      platformApi.getRecentMatches(8),
    ]).then(([s, m]) => {
      if (!alive) return;
      setStatsData({
        stats: (s.success && s.stats) ? s.stats : null,
        matches: (m.success && m.matches) ? m.matches : [],
      });
    }).catch(() => alive && setStatsData({ stats: null, matches: [] }));
    return () => { alive = false; };
  }, [user.id]);

  // LFG players directory.
  useEffect(() => {
    let alive = true;
    platformApi.getLfgPlayers()
      .then(r => alive && setLfgPlayers((r.success && Array.isArray(r.players)) ? (r.players as LfgPlayer[]) : []))
      .catch(() => alive && setLfgPlayers([]));
    return () => { alive = false; };
  }, []);

  // Home hero / countdown: live esports match + next upcoming tournament.
  useEffect(() => {
    let alive = true;
    getLiveMatches().then(m => alive && setLiveMatches(m)).catch(() => alive && setLiveMatches([]));
    getUpcomingTournaments().then(u => alive && setNextTourney(u[0] ?? null)).catch(() => undefined);
    return () => { alive = false; };
  }, []);

  // Esports tournaments (PandaScore, proxied) — loaded on entering the tab and
  // refreshed every 60s while it stays open, for near real-time standings.
  useEffect(() => {
    if (screen !== 'tournaments') return;
    let alive = true;
    const load = () => Promise.all([getRunningTournaments(), getUpcomingTournaments()])
      .then(([r, u]) => { if (alive) setTourneys([...r, ...u]); })
      .catch(() => { if (alive) setTourneys(prev => prev ?? []); });
    load();
    const id = window.setInterval(load, 60000);
    return () => { alive = false; window.clearInterval(id); };
  }, [screen]);

  const e = useReveal(screen);

  const addToCart = (p: ShopItem) => {
    if (p.stock_quantity === 0) return;
    onAddToCart?.(p);
    setToast(p.name);
    window.clearTimeout(toastTimer.current);
    toastTimer.current = window.setTimeout(() => setToast(null), 1800);
  };

  // Live tick for the countdown.
  const [, force] = useState(0);
  useEffect(() => {
    const id = setInterval(() => force(n => n + 1), 1000);
    return () => clearInterval(id);
  }, []);

  const setScreen = (s: Screen) => {
    if (s === screen) return;
    setScreenRaw(s);
    // Leave any open detail view so each tab opens at its top level.
    setDetailAgent(null); setViewPlayer(null); setViewTourney(null);
    if (scrollRef.current) scrollRef.current.scrollTop = 0;
  };

  const notify = (msg: string) => {
    setToast(msg);
    window.clearTimeout(toastTimer.current);
    toastTimer.current = window.setTimeout(() => setToast(null), 1900);
  };

  const N = (v: number, d = 0) => (v * e).toFixed(d);
  const W = (v: number) => (v * e).toFixed(2) + '%';

  const scanClip = `inset(0 ${((1 - e) * 100).toFixed(2)}% 0 0)`;
  const scanX = (e * 100).toFixed(2) + '%';
  const scanOp = e >= 1 ? 0 : 1;

  const nav = NAV_DEF.filter(n => !n.adminOnly || user.isAdmin);

  /* ── shared bits ─────────────────────────────────────────── */
  const kicker = (text: string, color: string = C.red): React.CSSProperties => ({
    margin: 0, fontFamily: MONO, fontSize: 11, letterSpacing: '.16em', color,
  });

  const ScreenHead = ({ num, eyebrow, title, right }: {
    num: string; eyebrow: string; title: React.ReactNode; right?: React.ReactNode;
  }) => (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 20, borderBottom: `2px solid ${C.ink}`, paddingBottom: 16 }}>
      <span style={{ fontFamily: DISP, fontSize: 64, lineHeight: .8, color: C.red }}>{num}</span>
      <div style={{ flex: 1 }}>
        <span style={{ fontFamily: MONO, fontSize: 11, letterSpacing: '.16em', color: C.muted }}>{eyebrow}</span>
        <h1 style={{ margin: '4px 0 0', fontFamily: DISP, fontSize: 46, lineHeight: .85, textTransform: 'uppercase' }}>{title}</h1>
      </div>
      {right}
    </div>
  );

  const chipRow = (
    items: string[], current: string, set: (v: string) => void,
  ) => (
    <div style={{ display: 'flex', border: `2px solid ${C.ink}`, width: 'max-content' }}>
      {items.map((label, i) => {
        const on = label === current;
        return (
          <button key={label} onClick={() => set(label)}
            style={{
              padding: '11px 20px', border: 0, borderRight: i < items.length - 1 ? `1px solid ${C.line}` : 0,
              background: on ? C.ink : 'transparent', color: on ? C.paper : C.ink2,
              fontFamily: MONO, fontSize: 11, fontWeight: 700, letterSpacing: '.08em',
              textTransform: 'uppercase', cursor: 'pointer',
            }}>
            {label}
          </button>
        );
      })}
    </div>
  );

  /* ── 01 ACCUEIL (real player + esports + shop data) ──────── */
  const renderHome = () => {
    const stats = statsData?.stats ?? DEFAULT_STATS;
    const recent = statsData?.matches ?? [];
    const homeStats = [
      { label: 'K/D RATIO', value: N(stats.kd_ratio, 2), sub: 'MOYENNE SAISON', color: C.ink },
      { label: 'WIN RATE', value: N(stats.win_rate, 1) + '%', sub: `${recent.length} MATCHS`, color: C.ink },
      { label: 'ADR MOYEN', value: N(stats.avg_damage, 0), sub: 'PAR ROUND', color: C.ink },
      { label: 'RANK RATING', value: N(stats.rank_rating, 0), sub: stats.rank_name.toUpperCase(), color: C.green },
    ];

    // Featured live esports match (PandaScore) → hero score panel.
    const lm = liveMatches && liveMatches[0];
    const heroTitle = lm ? lm.tournament || 'MATCH EN DIRECT' : 'VALORANT CHAMPIONS TOUR';
    const heroSub = lm
      ? `${lm.team1.name} vs ${lm.team2.name}${lm.map ? ` · ${lm.map.toUpperCase()}` : ''}`
      : 'AUCUN MATCH EN DIRECT — VCT CHAMPIONS';
    const t1 = lm ? lm.team1 : { name: 'NAVI', score: Math.round(13 * e) };
    const t2 = lm ? lm.team2 : { name: 'LOUD', score: Math.round(8 * e) };

    // Activity feed from the player's recent matches.
    const activity = recent.length
      ? recent.slice(0, 4).map(m => ({
          time: fmtAgo(m.played_at),
          label: `${m.result === 'W' ? 'Victoire' : 'Défaite'} — ${m.map_name}`,
          rr: `${m.kills}/${m.deaths}/${m.assists}`,
          color: m.result === 'W' ? C.green : C.red,
        }))
      : [
          { time: '02h', label: 'Victoire — Ascent', rr: '24/14/7', color: C.green },
          { time: '05h', label: 'Défaite — Split', rr: '18/19/4', color: C.red },
          { time: '01j', label: 'Victoire — Bind', rr: '22/12/9', color: C.green },
        ];

    // Merch preview from the real catalogue.
    const shopPreview = (products && products.length ? products.slice(0, 4) : null);

    // Countdown to the next real upcoming tournament (fallback: fixed demo target).
    const targetMs = nextTourney?.beginAt ? new Date(nextTourney.beginAt).getTime() : targetRef.current;
    const left = Math.max(0, targetMs - Date.now());
    const pad = (n: number) => String(n).padStart(2, '0');
    const cd = [
      { v: pad(Math.floor(left / 86400000)), l: 'JOURS' },
      { v: pad(Math.floor((left % 86400000) / 3600000)), l: 'HEURES' },
      { v: pad(Math.floor((left % 3600000) / 60000)), l: 'MIN' },
      { v: pad(Math.floor((left % 60000) / 1000)), l: 'SEC' },
    ];
    const nextName = nextTourney?.name || 'B3 Winter Cup';
    const nextSub = nextTourney
      ? [nextTourney.serie, nextTourney.prizepool].filter(Boolean).join(' · ').toUpperCase() || 'À VENIR'
      : 'ONLINE · €5 000 · S4';
    const watch = lm?.twitchChannel ? `https://twitch.tv/${lm.twitchChannel}` : undefined;

    return (
      <div style={{ clipPath: scanClip, display: 'flex', flexDirection: 'column', gap: 34 }}>
        {/* hero */}
        <section style={{ display: 'grid', gridTemplateColumns: '1.45fr 1fr', border: `2px solid ${C.ink}` }}>
          <div style={{ padding: '30px 32px', borderRight: `2px solid ${C.ink}`, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', minHeight: 300 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '6px 11px', background: lm ? C.red : C.ink, color: '#fff', fontFamily: MONO, fontSize: 10, fontWeight: 700, letterSpacing: '.16em' }}>
                <span style={{ height: 7, width: 7, background: '#fff' }} />{lm ? 'EN DIRECT' : 'À LA UNE'}
              </span>
              <span style={{ fontFamily: MONO, fontSize: 10, letterSpacing: '.12em', color: C.muted }}>// FEAT.01</span>
            </div>
            <div>
              <p style={{ margin: '0 0 6px', fontFamily: MONO, fontSize: 11, letterSpacing: '.18em', color: C.red, textTransform: 'uppercase', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{heroTitle}</p>
              <h1 style={{ margin: 0, fontFamily: DISP, fontSize: 74, lineHeight: .86, textTransform: 'uppercase' }}>{lm ? 'En Direct' : <>Grande<br />Finale</>}</h1>
              <p style={{ margin: '14px 0 0', fontFamily: MONO, fontSize: 12, letterSpacing: '.04em', color: C.ink2, textTransform: 'uppercase', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{heroSub}</p>
            </div>
            {watch
              ? <a href={watch} target="_blank" rel="noopener noreferrer" className="b3-btn-ink" style={{ alignSelf: 'flex-start', display: 'inline-flex', alignItems: 'center', gap: 12, marginTop: 20, padding: '14px 26px', color: C.paper, fontFamily: UI, fontSize: 14, fontWeight: 800, letterSpacing: '.04em', textTransform: 'uppercase', textDecoration: 'none' }}>▶ Regarder le live</a>
              : <button onClick={() => setScreen('tournaments')} className="b3-btn-ink" style={{ alignSelf: 'flex-start', display: 'inline-flex', alignItems: 'center', gap: 12, marginTop: 20, padding: '14px 26px', border: 0, color: C.paper, fontFamily: UI, fontSize: 14, fontWeight: 800, letterSpacing: '.04em', textTransform: 'uppercase', cursor: 'pointer' }}>▶ Voir les tournois</button>}
          </div>
          <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 22, padding: 30, background: C.ink, color: C.paper, overflow: 'hidden' }}>
            <span style={{ position: 'absolute', top: 14, right: 16, fontFamily: MONO, fontSize: 9, letterSpacing: '.1em', color: 'rgba(231,227,217,.4)' }}>// LIVE_SCORE.dat</span>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 14 }}>
              <div style={{ minWidth: 0 }}><div style={{ fontFamily: DISP, fontSize: 30, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t1.name}</div><div style={{ fontFamily: MONO, fontSize: 11, color: 'rgba(231,227,217,.5)' }}>ÉQUIPE 01</div></div>
              <div style={{ fontFamily: MONO, fontSize: 62, fontWeight: 700, lineHeight: 1, color: C.red }}>{t1.score}</div>
            </div>
            <div style={{ height: 1, background: 'rgba(231,227,217,.2)' }} />
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 14 }}>
              <div style={{ minWidth: 0 }}><div style={{ fontFamily: DISP, fontSize: 30, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t2.name}</div><div style={{ fontFamily: MONO, fontSize: 11, color: 'rgba(231,227,217,.5)' }}>ÉQUIPE 02</div></div>
              <div style={{ fontFamily: MONO, fontSize: 62, fontWeight: 700, lineHeight: 1 }}>{t2.score}</div>
            </div>
          </div>
        </section>

        {/* stat ribbon */}
        <section>
          <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 10 }}>
            <p style={kicker('// PERFORMANCE.SAISON')}>// PERFORMANCE.SAISON</p>
            <button onClick={() => setScreen('stats')} className="b3-link"
              style={{ fontFamily: MONO, fontSize: 11, fontWeight: 700, letterSpacing: '.08em', background: 0, border: 0, cursor: 'pointer', color: C.ink }}>
              DÉTAILS COMPLETS →
            </button>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', borderTop: `2px solid ${C.ink}`, borderBottom: `2px solid ${C.ink}` }}>
            {homeStats.map((st, i) => (
              <div key={i} style={{ padding: '18px 20px', borderRight: i < 3 ? `1px solid ${C.line}` : 0 }}>
                <p style={{ margin: 0, fontFamily: MONO, fontSize: 10, letterSpacing: '.12em', color: C.muted }}>{st.label}</p>
                <p style={{ margin: '8px 0 0', fontFamily: MONO, fontSize: 38, fontWeight: 700, lineHeight: .9, color: st.color }}>{st.value}</p>
                <p style={{ margin: '6px 0 0', fontFamily: MONO, fontSize: 10, color: C.ink2 }}>{st.sub}</p>
              </div>
            ))}
          </div>
        </section>

        {/* feed + countdown */}
        <section style={{ display: 'grid', gridTemplateColumns: '1.3fr 1fr', gap: 28 }}>
          <div>
            <p style={{ ...kicker('x'), margin: '0 0 12px' }}>// JOURNAL_DE_COMBAT</p>
            <div style={{ borderTop: `2px solid ${C.ink}` }}>
              {activity.map((a, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '13px 0', borderBottom: `1px solid ${C.line}` }}>
                  <span style={{ fontFamily: MONO, fontSize: 11, color: C.muted, width: 42 }}>[{a.time}]</span>
                  <span style={{ fontFamily: UI, fontSize: 14, fontWeight: 700, letterSpacing: '.02em', textTransform: 'uppercase' }}>{a.label}</span>
                  <span style={{ flex: 1, borderBottom: `1px dotted ${C.line2}`, margin: '0 4px' }} />
                  <span style={{ fontFamily: MONO, fontSize: 14, fontWeight: 700, color: a.color }}>{a.rr}</span>
                </div>
              ))}
            </div>
          </div>
          <div style={{ border: `2px solid ${C.ink}`, padding: 22 }}>
            <div style={{ marginBottom: 18 }}>
              <p style={kicker('// PROCHAIN_TOURNOI')}>// PROCHAIN_TOURNOI</p>
              <p style={{ margin: '8px 0 0', fontFamily: DISP, fontSize: 24, lineHeight: .95, textTransform: 'uppercase', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={nextName}>{nextName}</p>
              <p style={{ margin: '5px 0 0', fontFamily: MONO, fontSize: 10, color: C.ink2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{nextSub}</p>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: `1px solid ${C.line}`, paddingTop: 16 }}>
              {cd.map((u, i) => (
                <div key={i} style={{ textAlign: 'center' }}>
                  <div style={{ fontFamily: MONO, fontSize: 34, fontWeight: 700, lineHeight: 1 }}>{u.v}</div>
                  <div style={{ marginTop: 6, fontFamily: MONO, fontSize: 9, letterSpacing: '.1em', color: C.muted }}>{u.l}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* merch */}
        <section>
          <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 12 }}>
            <p style={kicker('// BOUTIQUE.B3')}>// BOUTIQUE.B3</p>
            <button onClick={() => setScreen('shop')} className="b3-link"
              style={{ fontFamily: MONO, fontSize: 11, fontWeight: 700, letterSpacing: '.08em', background: 0, border: 0, cursor: 'pointer', color: C.ink }}>
              TOUT VOIR →
            </button>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 18 }}>
            {(shopPreview ?? Array<ShopItem | null>(4).fill(null)).map((p, i) => (
              <button key={i} onClick={() => setScreen('shop')} className="b3-row"
                style={{ textAlign: 'left', padding: 0, border: `2px solid ${C.ink}`, background: C.paper, cursor: 'pointer' }}>
                <div style={{ aspectRatio: '1/1', borderBottom: `2px solid ${C.ink}`, background: `repeating-linear-gradient(135deg,${C.paper3} 0 9px,${C.paper2} 9px 18px)`, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                  {p && p.img
                    ? <img src={p.img} alt={p.name} style={{ height: '100%', width: '100%', objectFit: 'cover' }} onError={ev => { (ev.target as HTMLImageElement).style.display = 'none'; }} />
                    : <span style={{ fontFamily: MONO, fontSize: 10, color: C.muted }}>// {p ? p.category.toLowerCase() : 'merch'}</span>}
                </div>
                <div style={{ padding: '13px 14px' }}>
                  <p style={{ margin: 0, fontFamily: UI, fontSize: 13, fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p ? p.name : 'Chargement…'}</p>
                  <p style={{ margin: '7px 0 0', fontFamily: MONO, fontSize: 15, fontWeight: 700, color: C.red }}>{p ? eur(p.price) : '—'}</p>
                </div>
              </button>
            ))}
          </div>
        </section>
      </div>
    );
  };

  /* ── 02 STATS (real player data) ─────────────────────────── */
  const renderStats = () => {
    const loading = statsData === null;
    const stats = statsData?.stats ?? DEFAULT_STATS;
    const matches = statsData?.matches ?? [];
    const wins = matches.filter(m => m.result === 'W').length;
    const losses = matches.length - wins;

    const statGrid = [
      { label: 'K/D GLOBAL', value: N(stats.kd_ratio, 2), sub: 'SAISON', color: C.ink },
      { label: 'TAUX DE VICTOIRE', value: N(stats.win_rate, 1) + '%', sub: matches.length ? `${wins}V / ${losses}D` : 'GLOBAL', color: C.green },
      { label: 'DÉGÂTS / ROUND', value: N(stats.avg_damage, 0), sub: 'ADR MOYEN', color: C.ink },
      { label: 'RANK RATING', value: N(stats.rank_rating, 0), sub: stats.rank_name.toUpperCase(), color: C.red },
    ];

    // Aggregate the played agents out of the recent matches.
    const agg = new Map<string, { matches: number; kills: number; deaths: number }>();
    matches.forEach(m => {
      const a = agg.get(m.agent_played) ?? { matches: 0, kills: 0, deaths: 0 };
      a.matches += 1; a.kills += m.kills; a.deaths += m.deaths;
      agg.set(m.agent_played, a);
    });
    const agentsPlayed = Array.from(agg.entries())
      .map(([name, a]) => ({ name, matches: a.matches, kd: (a.kills / Math.max(1, a.deaths)).toFixed(2) }))
      .sort((x, y) => y.matches - x.matches)
      .slice(0, 5);
    const maxAgentM = Math.max(1, ...agentsPlayed.map(a => a.matches));

    return (
      <div style={{ clipPath: scanClip, display: 'flex', flexDirection: 'column', gap: 30 }}>
        <ScreenHead num="02" eyebrow="// DOSSIER_JOUEUR"
          title={<>{(user.username || 'Phantom').toUpperCase()} <span style={{ color: C.muted, fontSize: 24 }}>#{(user.tagLine || 'EUW').toUpperCase()}</span></>}
          right={
            <div style={{ textAlign: 'right', fontFamily: MONO, fontSize: 12, lineHeight: 1.7 }}>
              <span style={{ color: rankColor(stats.rank_name), fontWeight: 700 }}>{stats.rank_name.toUpperCase()}</span><br />
              <span style={{ color: C.muted }}>{(user.region || 'EUROPE').toUpperCase()} · {N(stats.rank_rating, 0)} RR</span>
            </div>
          } />

        {loading ? (
          <p style={{ fontFamily: MONO, fontSize: 12, letterSpacing: '.2em', color: C.muted, padding: '40px 0' }} className="animate-pulse">// CHARGEMENT DU DOSSIER…</p>
        ) : (<>
          <section style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', border: `2px solid ${C.ink}` }}>
            {statGrid.map((st, i) => (
              <div key={i} style={{ padding: '24px 22px', borderRight: i < 3 ? `1px solid ${C.line}` : 0 }}>
                <p style={{ margin: 0, fontFamily: MONO, fontSize: 10, letterSpacing: '.12em', color: C.muted }}>{st.label}</p>
                <p style={{ margin: '12px 0 0', fontFamily: MONO, fontSize: 46, fontWeight: 700, lineHeight: .85, color: st.color }}>{st.value}</p>
                <p style={{ margin: '10px 0 0', fontFamily: MONO, fontSize: 11, fontWeight: 700, color: C.ink2 }}>{st.sub}</p>
              </div>
            ))}
          </section>

          <section style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 28 }}>
            <div>
              <p style={{ ...kicker('x'), margin: '0 0 14px' }}>// AGENTS_LES_PLUS_JOUÉS</p>
              <div style={{ borderTop: `2px solid ${C.ink}` }}>
                {agentsPlayed.length === 0 && (
                  <div style={{ padding: '20px 0', fontFamily: MONO, fontSize: 11, color: C.muted }}>AUCUN MATCH ENREGISTRÉ</div>
                )}
                {agentsPlayed.map((ag, i) => (
                  <div key={i} style={{ padding: '15px 0', borderBottom: `1px solid ${C.line}` }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 9 }}>
                      <span style={{ fontFamily: DISP, fontSize: 20, textTransform: 'uppercase', flex: 1 }}>{ag.name}</span>
                      <span style={{ fontFamily: MONO, fontSize: 11, color: C.muted }}>{ag.matches} MATCH{ag.matches > 1 ? 'S' : ''}</span>
                      <span style={{ fontFamily: MONO, fontSize: 14, fontWeight: 700, color: C.green, width: 58, textAlign: 'right' }}>{ag.kd}</span>
                    </div>
                    <div style={{ height: 7, background: C.paper3, overflow: 'hidden' }}>
                      <div style={{ height: '100%', background: C.red, width: W((ag.matches / maxAgentM) * 100) }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <p style={{ ...kicker('x'), margin: '0 0 14px' }}>// DERNIERS_MATCHS</p>
              <div style={{ borderTop: `2px solid ${C.ink}` }}>
                {matches.length === 0 && (
                  <div style={{ padding: '20px 0', fontFamily: MONO, fontSize: 11, color: C.muted }}>AUCUN MATCH RÉCENT</div>
                )}
                {matches.map((m, i) => {
                  const col = m.result === 'W' ? C.green : C.red;
                  return (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 0 14px 14px', borderBottom: `1px solid ${C.line}`, borderLeft: `4px solid ${col}` }}>
                      <span style={{ fontFamily: UI, fontSize: 15, fontWeight: 700, textTransform: 'uppercase', flex: 1 }}>{m.map_name}</span>
                      <span style={{ fontFamily: MONO, fontSize: 12, color: C.muted }}>{m.agent_played}</span>
                      <span style={{ fontFamily: MONO, fontSize: 13, color: C.ink2 }}>{m.score_home}—{m.score_away}</span>
                      <span style={{ fontFamily: MONO, fontSize: 13, fontWeight: 700, width: 76, textAlign: 'right', color: col }}>{m.kills}/{m.deaths}/{m.assists}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </section>
        </>)}
      </div>
    );
  };

  /* ── 03 AGENTS (full Valorant roster meta + the player's own picks) ── */
  const renderAgents = () => {
    const tierStyle: Record<string, { bg: string; fg: string }> = {
      'S+': { bg: C.red, fg: '#fff' },
      S: { bg: C.ink, fg: C.paper },
      A: { bg: C.paper3, fg: C.ink },
      B: { bg: C.paper3, fg: C.ink },
      C: { bg: 'transparent', fg: C.muted },
    };
    const matches = statsData?.matches ?? [];

    // The player's own picks, so we can flag agents they have actually played and
    // surface their personal K/D alongside the global meta.
    const mine = new Map<string, { matches: number; kills: number; deaths: number }>();
    matches.forEach(m => {
      const key = (m.agent_played || '').toLowerCase();
      if (!key) return;
      const a = mine.get(key) ?? { matches: 0, kills: 0, deaths: 0 };
      a.matches += 1; a.kills += m.kills; a.deaths += m.deaths;
      mine.set(key, a);
    });

    const agents = AGENT_META.map(a => {
      const own = mine.get(a.name.toLowerCase());
      const ownKd = own ? own.kills / Math.max(1, own.deaths) : null;
      return { ...a, played: own?.matches ?? 0, kd: ownKd ?? a.kd, kdOwn: ownKd != null };
    });

    // A single agent is open → render its full sheet (spells, counters…).
    if (detailAgent) return renderAgentDetail(detailAgent);

    const roles = ['Tous', 'Duelliste', 'Initiateur', 'Contrôleur', 'Sentinelle'];
    const cols = '54px 40px 2fr 1.1fr 1.2fr 0.9fr 0.9fr';
    const list = agents
      .filter(a => role === 'Tous' || a.role === role.toUpperCase())
      .sort((x, y) => (TIER_RANK[x.tier] - TIER_RANK[y.tier]) || (y.pick - x.pick));

    return (
      <div style={{ clipPath: scanClip, display: 'flex', flexDirection: 'column', gap: 26 }}>
        <ScreenHead num="03" eyebrow={`// MÉTA AGENTS · ${AGENT_META.length} AGENTS · CLIQUE POUR LE DÉTAIL`} title={<>Agents</>} />
        {chipRow(roles, role, setRole)}
        <div style={{ border: `2px solid ${C.ink}` }}>
          <div style={{ display: 'grid', gridTemplateColumns: cols, gap: 14, padding: '12px 20px', borderBottom: `2px solid ${C.ink}`, background: C.paper2, fontFamily: MONO, fontSize: 10, letterSpacing: '.1em', color: C.muted }}>
            <span>TIER</span><span /><span>AGENT</span><span>RÔLE</span><span>WIN RATE</span><span>PICK</span><span>K/D</span>
          </div>
          {list.length === 0 && (
            <div style={{ padding: '20px', fontFamily: MONO, fontSize: 11, color: C.muted }}>AUCUN AGENT POUR CE RÔLE</div>
          )}
          {list.map((a, i) => {
            const icon = apiAgents[a.name]?.displayIcon;
            return (
            <div key={a.name} className="b3-row" onClick={() => setDetailAgent(a.name)} title={`Voir ${a.name}`} style={{ display: 'grid', gridTemplateColumns: cols, gap: 14, alignItems: 'center', padding: '14px 20px', borderBottom: i < list.length - 1 ? `1px solid ${C.line}` : 0, cursor: 'pointer' }}>
              <span style={{ height: 34, width: 34, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: DISP, fontSize: 18, color: tierStyle[a.tier].fg, background: tierStyle[a.tier].bg, border: a.tier === 'C' ? `1px solid ${C.line}` : 0 }}>{a.tier}</span>
              <span style={{ height: 36, width: 36, background: C.paper3, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                {icon ? <img src={icon} alt={a.name} style={{ height: '100%', width: '100%', objectFit: 'cover' }} /> : <span style={{ fontFamily: DISP, fontSize: 16, color: C.muted }}>{a.name[0]}</span>}
              </span>
              <span style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
                <span style={{ fontFamily: DISP, fontSize: 22, textTransform: 'uppercase' }}>{a.name}</span>
                {a.played > 0 && (
                  <span style={{ fontFamily: MONO, fontSize: 9, fontWeight: 700, letterSpacing: '.08em', color: '#fff', background: C.red, padding: '2px 5px' }}>{a.played} JOUÉ{a.played > 1 ? 'S' : ''}</span>
                )}
              </span>
              <span style={{ fontFamily: MONO, fontSize: 12, color: C.ink2 }}>{a.role}</span>
              <div>
                <span style={{ fontFamily: MONO, fontSize: 13, fontWeight: 700 }}>{a.win.toFixed(1)}%</span>
                <div style={{ marginTop: 6, height: 5, background: C.paper3, overflow: 'hidden' }}>
                  <div style={{ height: '100%', background: C.green, width: W(a.win) }} />
                </div>
              </div>
              <span style={{ fontFamily: MONO, fontSize: 13, color: C.ink2 }}>{a.pick.toFixed(1)}%</span>
              <span style={{ fontFamily: MONO, fontSize: 15, fontWeight: 700, color: a.kdOwn ? C.red : C.ink2 }} title={a.kdOwn ? 'Ton K/D' : 'K/D méta'}>{a.kd.toFixed(2)}</span>
            </div>
          );})}
        </div>
      </div>
    );
  };

  /* ── 03b AGENT DETAIL (spells, counters, how-to-play) ────── */
  const renderAgentDetail = (name: string) => {
    const meta = AGENT_META.find(a => a.name === name);
    const api = apiAgents[name];
    const guide = AGENT_GUIDE[name];
    const matchup = MATCHUP_DATA[name];
    const abilities = (api?.abilities ?? []).filter(ab => ab.displayName && (ab.slot !== 'Passive' || ab.description));
    const grad = api?.backgroundGradientColors ?? [];
    const heroBg = grad.length >= 4
      ? `linear-gradient(110deg, #${grad[0]} 0%, #${grad[1]} 42%, #${grad[2]} 74%, #${grad[3]} 100%)`
      : C.ink;
    const onDark = 'rgba(231,227,217,.4)';
    const tierStyle: Record<string, { bg: string; fg: string }> = {
      'S+': { bg: C.red, fg: '#fff' }, S: { bg: C.paper, fg: C.ink }, A: { bg: C.paper3, fg: C.ink }, B: { bg: C.paper3, fg: C.ink }, C: { bg: 'transparent', fg: onDark },
    };

    const counterChip = (n: string) => {
      const ic = apiAgents[n]?.displayIcon;
      return (
        <button key={n} onClick={() => setDetailAgent(n)} className="b3-row" style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '8px 10px', border: `1px solid ${C.line}`, background: C.paper, cursor: 'pointer', textAlign: 'left' }}>
          <span style={{ height: 28, width: 28, flex: 'none', background: C.paper3, overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {ic ? <img src={ic} alt={n} style={{ height: '100%', width: '100%', objectFit: 'cover' }} /> : <span style={{ fontFamily: DISP, fontSize: 13 }}>{n[0]}</span>}
          </span>
          <span style={{ fontFamily: UI, fontSize: 13, fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{n}</span>
        </button>
      );
    };

    return (
      <div style={{ clipPath: scanClip, display: 'flex', flexDirection: 'column', gap: 22 }}>
        <button onClick={() => setDetailAgent(null)} style={{ alignSelf: 'flex-start', display: 'inline-flex', alignItems: 'center', gap: 8, padding: '8px 14px', border: `2px solid ${C.ink}`, background: C.paper, fontFamily: MONO, fontSize: 11, fontWeight: 700, letterSpacing: '.1em', textTransform: 'uppercase', cursor: 'pointer' }}>← Tier list</button>

        {/* Hero */}
        <section style={{ position: 'relative', overflow: 'hidden', border: `2px solid ${C.ink}`, minHeight: 260, background: heroBg, color: '#fff' }}>
          {api?.background && <img src={api.background} alt="" style={{ position: 'absolute', inset: 0, height: '100%', width: '100%', objectFit: 'cover', opacity: .25, mixBlendMode: 'luminosity' }} />}
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(90deg, rgba(20,18,16,.93) 0%, rgba(20,18,16,.7) 46%, rgba(20,18,16,.2) 100%)' }} />
          {api?.fullPortrait && <img src={api.fullPortrait} alt={name} style={{ position: 'absolute', right: 0, bottom: 0, height: '116%', objectFit: 'contain', pointerEvents: 'none', filter: 'drop-shadow(0 12px 30px rgba(0,0,0,.5))' }} />}
          <div style={{ position: 'relative', padding: '30px 32px', maxWidth: '62%' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
              {meta && <span style={{ fontFamily: DISP, fontSize: 16, lineHeight: 1, padding: '4px 9px', color: tierStyle[meta.tier].fg, background: tierStyle[meta.tier].bg, border: meta.tier === 'C' ? `1px solid ${onDark}` : 0 }}>{meta.tier}</span>}
              {meta && <span style={{ fontFamily: MONO, fontSize: 11, letterSpacing: '.1em', color: '#fff' }}>{meta.role}</span>}
              {guide && (
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontFamily: MONO, fontSize: 11, color: onDark }}>
                  {[0, 1, 2].map(i => <span key={i} style={{ height: 5, width: 16, background: i < guide.difficulty ? C.red : 'rgba(255,255,255,.2)' }} />)}
                  {DIFFICULTY_LABEL[guide.difficulty]}
                </span>
              )}
            </div>
            <h1 style={{ margin: 0, fontFamily: DISP, fontSize: 60, lineHeight: .82, textTransform: 'uppercase' }}>{name}</h1>
            {api?.role && <p style={{ margin: '14px 0 0', fontFamily: UI, fontSize: 14, lineHeight: 1.5, color: 'rgba(255,255,255,.82)' }}>{api.role.description || api.description}</p>}
          </div>
        </section>

        {/* Meta cards */}
        {meta && (
          <section style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', border: `2px solid ${C.ink}` }}>
            {[
              { l: 'WIN RATE', v: `${meta.win.toFixed(1)}%`, c: meta.win >= 52.5 ? C.green : C.ink },
              { l: 'PICK RATE', v: `${meta.pick.toFixed(1)}%`, c: C.ink },
              { l: 'K/D MÉTA', v: meta.kd.toFixed(2), c: meta.kd >= 1.2 ? C.green : C.ink },
              { l: 'TIER', v: meta.tier, c: C.red },
            ].map((s, i) => (
              <div key={s.l} style={{ padding: 18, borderRight: i < 3 ? `1px solid ${C.line}` : 0 }}>
                <p style={{ margin: 0, fontFamily: MONO, fontSize: 10, letterSpacing: '.1em', color: C.muted }}>{s.l}</p>
                <p style={{ margin: '8px 0 0', fontFamily: MONO, fontSize: 30, fontWeight: 700, lineHeight: .9, color: s.c }}>{s.v}</p>
              </div>
            ))}
          </section>
        )}

        <section style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 22, alignItems: 'start' }}>
          {/* Abilities / spells */}
          <div style={{ border: `2px solid ${C.ink}`, padding: 22 }}>
            <p style={{ ...kicker('// COMPÉTENCES'), margin: '0 0 16px' }}>// COMPÉTENCES</p>
            {abilities.length === 0 && <p style={{ fontFamily: MONO, fontSize: 11, color: C.muted }}>// CHARGEMENT DES COMPÉTENCES…</p>}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {abilities.map(ab => (
                <div key={ab.slot} style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
                  <div style={{ position: 'relative', height: 44, width: 44, flex: 'none', background: C.ink, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {ab.displayIcon ? <img src={ab.displayIcon} alt={ab.displayName} style={{ height: 28, width: 28, objectFit: 'contain', filter: 'invert(1)' }} /> : <span style={{ fontFamily: DISP, fontSize: 16, color: C.paper }}>{SLOT_KEY[ab.slot] ?? '?'}</span>}
                    <span style={{ position: 'absolute', bottom: -7, right: -7, height: 20, width: 20, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: MONO, fontSize: 10, fontWeight: 700, color: '#fff', background: C.red, border: `2px solid ${C.paper}` }}>{SLOT_KEY[ab.slot] ?? '?'}</span>
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ margin: 0, fontFamily: UI, fontSize: 14, fontWeight: 800 }}>{ab.displayName}</p>
                    <p style={{ margin: '3px 0 0', fontFamily: UI, fontSize: 12.5, lineHeight: 1.5, color: C.ink2 }}>{ab.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* How to play + best maps */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            {guide && (
              <div style={{ border: `2px solid ${C.ink}`, padding: 22 }}>
                <p style={{ ...kicker('// COMMENT LE JOUER'), margin: '0 0 12px' }}>// COMMENT LE JOUER</p>
                <p style={{ margin: '0 0 14px', fontFamily: UI, fontSize: 13, lineHeight: 1.55, color: C.ink2 }}>{guide.summary}</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {guide.tips.map((t, i) => (
                    <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                      <span style={{ flex: 'none', marginTop: 2, height: 14, width: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', background: C.red, color: '#fff', fontFamily: MONO, fontSize: 9, fontWeight: 700 }}>✓</span>
                      <span style={{ fontFamily: UI, fontSize: 12.5, lineHeight: 1.5, color: C.ink2 }}>{t}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {guide && guide.bestMaps.length > 0 && (
              <div style={{ border: `2px solid ${C.ink}`, padding: 22 }}>
                <p style={{ ...kicker('// MEILLEURES MAPS'), margin: '0 0 12px' }}>// MEILLEURES MAPS</p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {guide.bestMaps.map(mp => (
                    <span key={mp} style={{ fontFamily: MONO, fontSize: 12, fontWeight: 700, letterSpacing: '.04em', padding: '7px 12px', border: `1.5px solid ${C.ink}`, textTransform: 'uppercase' }}>{mp}</span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </section>

        {/* Counters & synergies */}
        {matchup && (
          <section style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 22 }}>
            <div style={{ border: `2px solid ${C.ink}`, padding: 22 }}>
              <p style={{ ...kicker('// FAIBLE FACE À', C.red), margin: '0 0 14px' }}>// FAIBLE FACE À</p>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10 }}>{matchup.weakTo.map(counterChip)}</div>
            </div>
            <div style={{ border: `2px solid ${C.ink}`, padding: 22 }}>
              <p style={{ ...kicker('// SYNERGIES', C.green), margin: '0 0 14px', color: C.green }}>// SYNERGIES</p>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10 }}>{matchup.synergy.map(counterChip)}</div>
            </div>
          </section>
        )}
      </div>
    );
  };

  /* ── 04 JOUEURS (real LFG directory) ─────────────────────── */
  const renderPlayers = () => {
    if (viewPlayer) return renderPlayerDetail(viewPlayer);
    const loading = lfgPlayers === null;
    const list = lfgPlayers ?? [];
    const avs = [C.red, C.ink, C.green, C.ink2];

    const invite = (p: LfgPlayer) => {
      if (p.discord) {
        navigator.clipboard?.writeText(p.discord).catch(() => undefined);
        setToast(`Discord ${p.discord}`);
      } else {
        setToast(`${p.username} invité`);
      }
      window.clearTimeout(toastTimer.current);
      toastTimer.current = window.setTimeout(() => setToast(null), 1800);
    };

    return (
      <div style={{ clipPath: scanClip, display: 'flex', flexDirection: 'column', gap: 26 }}>
        <ScreenHead num="04" eyebrow={`// RECHERCHE_D'ÉQUIPE · ${loading ? '…' : list.length} ACTIF${list.length > 1 ? 'S' : ''}`} title={<>Joueurs · LFG</>} />
        {loading ? (
          <p style={{ fontFamily: MONO, fontSize: 12, letterSpacing: '.2em', color: C.muted, padding: '40px 0' }} className="animate-pulse">// RECHERCHE DES JOUEURS…</p>
        ) : list.length === 0 ? (
          <div style={{ border: `2px solid ${C.ink}`, padding: '48px 22px', textAlign: 'center' }}>
            <p style={{ margin: 0, fontFamily: DISP, fontSize: 26, textTransform: 'uppercase' }}>Personne en LFG</p>
            <p style={{ margin: '8px 0 0', fontFamily: MONO, fontSize: 11, color: C.muted }}>ACTIVE LE MODE LFG DANS TON PROFIL POUR APPARAÎTRE ICI</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 18 }}>
            {list.map((p, i) => {
              const role = (p.roles && p.roles[0]) || 'FLEX';
              const rank = p.rankLabel || 'NON CLASSÉ';
              const online = p.lfgStatus !== 'busy';
              return (
                <div key={p.id} className="b3-row" style={{ border: `2px solid ${C.ink}`, background: C.paper }}>
                  <div onClick={() => setViewPlayer(p)} title={`Voir le profil de ${p.username}`} style={{ display: 'flex', alignItems: 'center', gap: 13, padding: '16px 18px', borderBottom: `1px solid ${C.line}`, cursor: 'pointer' }}>
                    <span style={{ height: 46, width: 46, flex: 'none', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: DISP, fontSize: 22, color: '#fff', background: avs[i % avs.length] }}>
                      {p.avatarUrl ? <img src={p.avatarUrl} alt={p.username} style={{ height: '100%', width: '100%', objectFit: 'cover' }} /> : p.username[0]?.toUpperCase()}
                    </span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ margin: 0, fontFamily: DISP, fontSize: 22, lineHeight: .9, textTransform: 'uppercase', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={p.username}>{p.username}</p>
                      <p style={{ margin: '4px 0 0', fontFamily: MONO, fontSize: 10, letterSpacing: '.06em', color: C.muted, textTransform: 'uppercase' }}>{(p.region || '—')} · {role}</p>
                    </div>
                    <span title={online ? 'LFG' : 'Occupé'} style={{ height: 9, width: 9, flex: 'none', background: online ? C.green : C.muted }} />
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 18px' }}>
                    <span style={{ fontFamily: MONO, fontSize: 10, letterSpacing: '.1em', color: C.muted }}>RANG</span>
                    <span style={{ fontFamily: DISP, fontSize: 18, textTransform: 'uppercase', color: rankColor(p.rankLabel) }}>{rank}</span>
                  </div>
                  <button onClick={() => invite(p)} className="b3-btn-ink" style={{ width: '100%', padding: 13, border: 0, borderTop: `2px solid ${C.ink}`, color: C.paper, fontFamily: UI, fontSize: 12, fontWeight: 800, letterSpacing: '.06em', textTransform: 'uppercase', cursor: 'pointer' }}>
                    {p.discord ? '+ Copier le Discord' : '+ Inviter à jouer'}
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  };

  /* ── 04b PROFIL PUBLIC (basic info on another player) ────── */
  const renderPlayerDetail = (p: LfgPlayer) => {
    const role = (p.roles && p.roles[0]) || 'FLEX';
    const rank = p.rankLabel || 'NON CLASSÉ';
    const online = p.lfgStatus !== 'busy';
    const onDark = 'rgba(231,227,217,.25)';
    const socials = [
      p.discord && { tag: 'DC', value: p.discord, color: '#9aa6ff' },
      p.twitter && { tag: 'X', value: p.twitter, color: C.paper },
      p.twitch && { tag: 'TW', value: p.twitch, color: '#b89bff' },
      p.youtube && { tag: 'YT', value: p.youtube, color: C.red },
    ].filter(Boolean) as { tag: string; value: string; color: string }[];
    const info = [
      { label: 'RANG', value: rank, color: rankColor(p.rankLabel) },
      { label: 'RÔLE PRINCIPAL', value: role, color: C.ink },
      { label: 'RÉGION', value: p.region || '—', color: C.ink },
      { label: 'RIOT ID', value: p.riotId ? `${p.riotId}${p.tagLine ? `#${p.tagLine}` : ''}` : '—', color: C.ink },
      { label: 'LANGUES', value: (p.languages && p.languages.length ? p.languages.join(', ') : '—'), color: C.ink },
      { label: 'DISPONIBILITÉ', value: (p.playtimes && p.playtimes.length ? p.playtimes.join(', ') : '—'), color: C.ink },
    ];

    const invite = () => {
      if (p.discord) { navigator.clipboard?.writeText(p.discord).catch(() => undefined); notify(`Discord ${p.discord}`); }
      else notify(`${p.username} invité`);
    };

    return (
      <div style={{ clipPath: scanClip, display: 'flex', flexDirection: 'column', gap: 22 }}>
        <button onClick={() => setViewPlayer(null)} style={{ alignSelf: 'flex-start', display: 'inline-flex', alignItems: 'center', gap: 8, padding: '8px 14px', border: `2px solid ${C.ink}`, background: C.paper, fontFamily: MONO, fontSize: 11, fontWeight: 700, letterSpacing: '.1em', textTransform: 'uppercase', cursor: 'pointer' }}>← Joueurs</button>
        <section style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr', border: `2px solid ${C.ink}` }}>
          <div style={{ padding: 30, borderRight: `2px solid ${C.ink}`, background: C.ink, color: C.paper }}>
            <div style={{ height: 120, width: 120, overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: DISP, fontSize: 56, color: '#fff', background: C.red, clipPath: 'polygon(0 0,100% 0,100% 80%,86% 100%,0 100%)' }}>
              {p.avatarUrl ? <img src={p.avatarUrl} alt={p.username} style={{ height: '100%', width: '100%', objectFit: 'cover' }} /> : p.username[0]?.toUpperCase()}
            </div>
            <h2 style={{ margin: '22px 0 0', fontFamily: DISP, fontSize: 38, lineHeight: .85, textTransform: 'uppercase', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.username}</h2>
            <p style={{ margin: '8px 0 0', fontFamily: MONO, fontSize: 11, letterSpacing: '.06em', color: online ? C.green : 'rgba(231,227,217,.5)', textTransform: 'uppercase' }}>{online ? '● Disponible · LFG' : '● Occupé'}</p>
            {p.bio && <p style={{ margin: '14px 0 0', fontFamily: UI, fontSize: 13, lineHeight: 1.5, color: 'rgba(231,227,217,.7)' }}>{p.bio}</p>}
            {socials.length > 0 && (
              <div style={{ display: 'flex', marginTop: 22, border: `1px solid ${onDark}`, width: 'max-content' }}>
                {socials.map((s, i) => (
                  <span key={i} title={s.value} style={{ height: 42, width: 42, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRight: i < socials.length - 1 ? `1px solid ${onDark}` : 0, fontFamily: MONO, fontSize: 12, fontWeight: 700, color: s.color }}>{s.tag}</span>
                ))}
              </div>
            )}
            <button onClick={invite} className="b3-btn-ondark" style={{ marginTop: 24, width: '100%', padding: 14, border: 0, background: C.red, color: '#fff', fontFamily: UI, fontSize: 13, fontWeight: 800, letterSpacing: '.04em', textTransform: 'uppercase', cursor: 'pointer' }}>{p.discord ? '+ Copier le Discord' : '+ Inviter à jouer'}</button>
          </div>
          <div style={{ padding: '22px 26px' }}>
            <p style={{ ...kicker('// INFOS_JOUEUR'), margin: '0 0 16px', letterSpacing: '.14em' }}>// INFOS_JOUEUR</p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', borderTop: `1px solid ${C.line}`, borderLeft: `1px solid ${C.line}` }}>
              {info.map((g, i) => (
                <div key={i} style={{ padding: 16, borderRight: `1px solid ${C.line}`, borderBottom: `1px solid ${C.line}` }}>
                  <p style={{ margin: 0, fontFamily: MONO, fontSize: 10, letterSpacing: '.08em', color: C.muted }}>{g.label}</p>
                  <p style={{ margin: '8px 0 0', fontFamily: UI, fontSize: 16, fontWeight: 700, color: g.color, overflow: 'hidden', textOverflow: 'ellipsis' }}>{g.value}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>
    );
  };

  /* ── 05b TOURNOI · DÉTAIL (info + real matches from vlr.gg) ── */
  const renderTournamentDetail = (t: EsportsTournament) => {
    const onDark = 'rgba(231,227,217,.2)';
    const live = t.status === 'live';
    const watch = t.twitchChannel ? `https://twitch.tv/${t.twitchChannel}` : undefined;
    const ms = tourneyMatches ?? [];
    const statusMeta: Record<TournamentMatch['status'], { label: string; color: string }> = {
      live: { label: 'EN DIRECT', color: C.red },
      upcoming: { label: 'À VENIR', color: C.ink2 },
      completed: { label: 'TERMINÉ', color: C.muted },
    };

    const facts = [
      { label: 'PRIZE POOL', value: t.prizepool || '—', color: C.red },
      { label: live ? 'STATUT' : 'DÉBUT', value: live ? 'LIVE' : fmtShortDate(t.beginAt), color: C.paper },
      { label: 'RÉGION', value: t.location || '—', color: C.paper },
      { label: 'FORMAT', value: t.serie || 'VALORANT', color: C.paper },
    ];

    return (
      <div style={{ clipPath: scanClip, display: 'flex', flexDirection: 'column', gap: 24 }}>
        <button onClick={() => setViewTourney(null)} style={{ alignSelf: 'flex-start', display: 'inline-flex', alignItems: 'center', gap: 8, padding: '8px 14px', border: `2px solid ${C.ink}`, background: C.paper, fontFamily: MONO, fontSize: 11, fontWeight: 700, letterSpacing: '.1em', textTransform: 'uppercase', cursor: 'pointer' }}>← Tournois</button>

        <section style={{ border: `2px solid ${C.ink}`, background: C.ink, color: C.paper, padding: 34, position: 'relative', overflow: 'hidden' }}>
          <span style={{ position: 'absolute', top: 0, right: 0, fontFamily: DISP, fontSize: 200, lineHeight: .7, color: 'rgba(255,66,51,.12)', transform: 'translate(8%,-12%)' }}>★</span>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '6px 12px', background: live ? C.red : 'transparent', border: live ? 0 : `1px solid ${onDark}`, color: live ? '#fff' : 'rgba(231,227,217,.7)', fontFamily: MONO, fontSize: 10, fontWeight: 700, letterSpacing: '.14em' }}>
            {live && <span style={{ height: 7, width: 7, background: '#fff' }} />}{live ? 'EN DIRECT' : 'À VENIR'}
          </span>
          <h2 style={{ margin: '16px 0 0', fontFamily: DISP, fontSize: 52, lineHeight: .85, textTransform: 'uppercase', maxWidth: 760 }}>{t.name}</h2>
          <div style={{ display: 'flex', flexWrap: 'wrap', marginTop: 26, borderTop: `1px solid ${onDark}`, borderBottom: `1px solid ${onDark}`, width: 'max-content', maxWidth: '100%' }}>
            {facts.map((fa, i) => (
              <div key={fa.label} style={{ padding: '16px 28px', borderRight: i < facts.length - 1 ? `1px solid ${onDark}` : 0 }}>
                <div style={{ fontFamily: MONO, fontSize: 10, letterSpacing: '.1em', color: 'rgba(231,227,217,.5)' }}>{fa.label}</div>
                <div style={{ fontFamily: MONO, fontSize: 26, fontWeight: 700, color: fa.color, textTransform: 'uppercase' }}>{fa.value}</div>
              </div>
            ))}
          </div>
          {watch && <a href={watch} target="_blank" rel="noopener noreferrer" style={{ display: 'inline-block', marginTop: 26, padding: '14px 28px', background: C.red, color: '#fff', fontFamily: UI, fontSize: 14, fontWeight: 800, letterSpacing: '.04em', textTransform: 'uppercase', textDecoration: 'none' }}>▶ Regarder le live</a>}
        </section>

        <div>
          <p style={{ ...kicker('// MATCHS'), margin: '0 0 14px', letterSpacing: '.14em' }}>// MATCHS</p>
          {tourneyMatches === null ? (
            <p style={{ fontFamily: MONO, fontSize: 12, letterSpacing: '.2em', color: C.muted, padding: '30px 0' }} className="animate-pulse">// CHARGEMENT DES MATCHS…</p>
          ) : ms.length === 0 ? (
            <div style={{ border: `2px solid ${C.ink}`, padding: '32px 22px', textAlign: 'center' }}>
              <p style={{ margin: 0, fontFamily: DISP, fontSize: 22, textTransform: 'uppercase' }}>Aucun match listé</p>
              <p style={{ margin: '8px 0 0', fontFamily: MONO, fontSize: 11, color: C.muted }}>VLR.GG N'EXPOSE PAS ENCORE DE MATCH POUR CETTE COMPÉTITION</p>
            </div>
          ) : (
            <div style={{ border: `2px solid ${C.ink}` }}>
              {ms.map((mt, i) => {
                const sm = statusMeta[mt.status];
                const teamRow = (tm: TournamentMatch['team1'], won: boolean) => (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
                    <span style={{ height: 26, width: 26, flex: 'none', background: C.paper3, overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      {tm.logo ? <img src={tm.logo} alt={tm.name} style={{ height: '100%', width: '100%', objectFit: 'contain' }} /> : <span style={{ fontFamily: DISP, fontSize: 12 }}>{tm.name[0]}</span>}
                    </span>
                    <span style={{ fontFamily: UI, fontSize: 14, fontWeight: won ? 800 : 600, color: won ? C.ink : C.ink2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{tm.name}</span>
                  </div>
                );
                const s1 = mt.team1.score, s2 = mt.team2.score;
                const won1 = s1 != null && s2 != null && s1 > s2;
                const won2 = s1 != null && s2 != null && s2 > s1;
                return (
                  <div key={mt.id || i} style={{ display: 'grid', gridTemplateColumns: '1fr 90px 1fr 110px', gap: 14, alignItems: 'center', padding: '14px 18px', borderBottom: i < ms.length - 1 ? `1px solid ${C.line}` : 0 }}>
                    {teamRow(mt.team1, won1)}
                    <span style={{ textAlign: 'center', fontFamily: MONO, fontSize: 18, fontWeight: 700, color: mt.status === 'completed' ? C.ink : C.muted }}>
                      {s1 != null || s2 != null ? `${s1 ?? 0} : ${s2 ?? 0}` : 'VS'}
                    </span>
                    {teamRow(mt.team2, won2)}
                    <div style={{ textAlign: 'right' }}>
                      <span style={{ fontFamily: MONO, fontSize: 9, fontWeight: 700, letterSpacing: '.06em', padding: '4px 8px', border: `1.5px solid ${sm.color}`, color: sm.color }}>{sm.label}</span>
                      {mt.when && <div style={{ marginTop: 4, fontFamily: MONO, fontSize: 9, color: C.muted }}>{mt.when}{mt.stage ? ` · ${mt.stage}` : ''}</div>}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    );
  };

  /* ── 05 TOURNOIS (real vlr.gg esports data) ──────────────── */
  const renderTournaments = () => {
    if (viewTourney) return renderTournamentDetail(viewTourney);
    const onDark = 'rgba(231,227,217,.2)';
    const head = <ScreenHead num="05" eyebrow="// COMPÉTITIONS · TEMPS RÉEL" title={<>Tournois</>} />;
    const wrap = (body: React.ReactNode) => (
      <div style={{ clipPath: scanClip, display: 'flex', flexDirection: 'column', gap: 28 }}>{head}{body}</div>
    );

    if (tourneys === null) {
      return wrap(<p style={{ fontFamily: MONO, fontSize: 12, letterSpacing: '.2em', color: C.muted, padding: '40px 0' }} className="animate-pulse">// SYNCHRONISATION DES COMPÉTITIONS…</p>);
    }

    if (tourneys.length > 0) {
      const featured = tourneys[0];
      const rest = tourneys.slice(1);
      const live = featured.status === 'live';
      const watch = featured.twitchChannel ? `https://twitch.tv/${featured.twitchChannel}` : undefined;
      return wrap(<>
        <section onClick={() => setViewTourney(featured)} title={`Voir ${featured.name}`} style={{ border: `2px solid ${C.ink}`, background: C.ink, color: C.paper, padding: 34, position: 'relative', overflow: 'hidden', cursor: 'pointer' }}>
          <span style={{ position: 'absolute', top: 0, right: 0, fontFamily: DISP, fontSize: 200, lineHeight: .7, color: 'rgba(255,66,51,.12)', transform: 'translate(8%,-12%)' }}>01</span>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '6px 12px', background: C.red, color: '#fff', fontFamily: MONO, fontSize: 10, fontWeight: 700, letterSpacing: '.14em' }}>
            {live && <span style={{ height: 7, width: 7, background: '#fff' }} />}{live ? 'EN DIRECT' : 'TOURNOI VEDETTE'}
          </span>
          <h2 style={{ margin: '16px 0 0', fontFamily: DISP, fontSize: 52, lineHeight: .85, textTransform: 'uppercase', maxWidth: 680 }}>{featured.name}</h2>
          <p style={{ margin: '12px 0 0', fontFamily: MONO, fontSize: 12, letterSpacing: '.04em', color: 'rgba(231,227,217,.65)', textTransform: 'uppercase' }}>
            {[featured.serie, featured.location, featured.teams ? `${featured.teams} ÉQUIPES` : null].filter(Boolean).join(' · ') || 'VALORANT'}
          </p>
          <div style={{ display: 'flex', marginTop: 26, borderTop: `1px solid ${onDark}`, borderBottom: `1px solid ${onDark}`, width: 'max-content' }}>
            <div style={{ padding: '16px 28px 16px 0', borderRight: `1px solid ${onDark}` }}><div style={{ fontFamily: MONO, fontSize: 10, letterSpacing: '.1em', color: 'rgba(231,227,217,.5)' }}>PRIZE POOL</div><div style={{ fontFamily: MONO, fontSize: 28, fontWeight: 700, color: C.red }}>{featured.prizepool || '—'}</div></div>
            <div style={{ padding: '16px 28px', borderRight: `1px solid ${onDark}` }}><div style={{ fontFamily: MONO, fontSize: 10, letterSpacing: '.1em', color: 'rgba(231,227,217,.5)' }}>{live ? 'STATUT' : 'DÉBUT'}</div><div style={{ fontFamily: MONO, fontSize: 28, fontWeight: 700 }}>{live ? 'LIVE' : fmtShortDate(featured.beginAt)}</div></div>
            <div style={{ padding: '16px 0 16px 28px' }}><div style={{ fontFamily: MONO, fontSize: 10, letterSpacing: '.1em', color: 'rgba(231,227,217,.5)' }}>ÉQUIPES</div><div style={{ fontFamily: MONO, fontSize: 28, fontWeight: 700 }}>{featured.teams || '—'}</div></div>
          </div>
          {watch
            ? <a href={watch} target="_blank" rel="noopener noreferrer" onClick={ev => ev.stopPropagation()} className="b3-btn-ondark" style={{ display: 'inline-block', marginTop: 26, padding: '14px 28px', background: C.red, color: '#fff', fontFamily: UI, fontSize: 14, fontWeight: 800, letterSpacing: '.04em', textTransform: 'uppercase', textDecoration: 'none', cursor: 'pointer' }}>▶ Regarder le live</a>
            : <span style={{ display: 'inline-block', marginTop: 26, padding: '14px 28px', background: 'transparent', color: 'rgba(231,227,217,.6)', border: `1px solid ${onDark}`, fontFamily: MONO, fontSize: 12, fontWeight: 700, letterSpacing: '.08em', textTransform: 'uppercase' }}>{fmtShortDate(featured.beginAt)} · À VENIR</span>}
        </section>
        {rest.length > 0 && (
          <div style={{ borderTop: `2px solid ${C.ink}` }}>
            {rest.map((t, i) => {
              const col = t.status === 'live' ? C.red : C.ink2;
              return (
                <div key={t.id} className="b3-row" onClick={() => setViewTourney(t)} title={`Voir ${t.name}`} style={{ display: 'flex', alignItems: 'center', gap: 24, padding: '20px 4px', borderBottom: `1px solid ${C.line}`, cursor: 'pointer' }}>
                  <span style={{ fontFamily: MONO, fontSize: 12, color: C.muted, width: 34 }}>{String(i + 2).padStart(2, '0')}</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <h3 style={{ margin: 0, fontFamily: DISP, fontSize: 24, lineHeight: .9, textTransform: 'uppercase', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={t.name}>{t.name}</h3>
                    <p style={{ margin: '5px 0 0', fontFamily: MONO, fontSize: 11, color: C.muted, textTransform: 'uppercase' }}>{[fmtShortDate(t.beginAt), t.location, t.teams ? `${t.teams} ÉQUIPES` : null].filter(Boolean).join(' · ')}</p>
                  </div>
                  <span style={{ fontFamily: MONO, fontSize: 20, fontWeight: 700, color: C.red, width: 130, textAlign: 'right' }}>{t.prizepool || '—'}</span>
                  <span style={{ fontFamily: MONO, fontSize: 10, fontWeight: 700, letterSpacing: '.08em', padding: '6px 12px', border: `1.5px solid ${col}`, color: col, width: 96, textAlign: 'center' }}>{t.status === 'live' ? 'LIVE' : 'À VENIR'}</span>
                </div>
              );
            })}
          </div>
        )}
      </>);
    }

    // No live PandaScore data (e.g. missing VITE_PANDASCORE_TOKEN) → labelled demo.
    const demo = [
      { name: 'Summer Showdown', date: 'EN COURS', teams: 16, prize: '€3 000', status: 'LIVE', statusColor: C.red },
      { name: 'B3 Open Qualifier', date: 'DANS 2 JOURS', teams: 64, prize: '€1 500', status: 'À VENIR', statusColor: C.ink2 },
      { name: 'Radiant League', date: '12 JUIL.', teams: 8, prize: '€8 000', status: 'À VENIR', statusColor: C.ink2 },
      { name: 'Spring Cup S3', date: 'TERMINÉ', teams: 32, prize: '€4 500', status: 'TERMINÉ', statusColor: C.muted },
    ];
    return wrap(<>
      <p style={{ margin: 0, fontFamily: MONO, fontSize: 11, letterSpacing: '.12em', color: C.muted }}>
        {hasPandaToken() ? '// AUCUNE COMPÉTITION VALORANT EN DIRECT — DONNÉES DÉMO' : '// PANDASCORE_TOKEN ABSENT — DONNÉES DÉMO'}
      </p>
      <section style={{ border: `2px solid ${C.ink}`, background: C.ink, color: C.paper, padding: 34, position: 'relative', overflow: 'hidden' }}>
        <span style={{ position: 'absolute', top: 0, right: 0, fontFamily: DISP, fontSize: 200, lineHeight: .7, color: 'rgba(255,66,51,.12)', transform: 'translate(8%,-12%)' }}>04</span>
        <span style={{ display: 'inline-block', padding: '6px 12px', background: C.red, color: '#fff', fontFamily: MONO, fontSize: 10, fontWeight: 700, letterSpacing: '.14em' }}>TOURNOI VEDETTE</span>
        <h2 style={{ margin: '16px 0 0', fontFamily: DISP, fontSize: 58, lineHeight: .85, textTransform: 'uppercase', maxWidth: 640 }}>B3 Winter Cup · S4</h2>
        <p style={{ margin: '12px 0 0', fontFamily: MONO, fontSize: 12, letterSpacing: '.04em', color: 'rgba(231,227,217,.65)' }}>SINGLE ELIMINATION · 32 ÉQUIPES · ONLINE EU/NA</p>
        <div style={{ display: 'flex', marginTop: 26, borderTop: `1px solid ${onDark}`, borderBottom: `1px solid ${onDark}`, width: 'max-content' }}>
          <div style={{ padding: '16px 28px 16px 0', borderRight: `1px solid ${onDark}` }}><div style={{ fontFamily: MONO, fontSize: 10, letterSpacing: '.1em', color: 'rgba(231,227,217,.5)' }}>PRIZE POOL</div><div style={{ fontFamily: MONO, fontSize: 28, fontWeight: 700, color: C.red }}>€5 000</div></div>
          <div style={{ padding: '16px 28px', borderRight: `1px solid ${onDark}` }}><div style={{ fontFamily: MONO, fontSize: 10, letterSpacing: '.1em', color: 'rgba(231,227,217,.5)' }}>DÉBUT</div><div style={{ fontFamily: MONO, fontSize: 28, fontWeight: 700 }}>04J:06H</div></div>
          <div style={{ padding: '16px 0 16px 28px' }}><div style={{ fontFamily: MONO, fontSize: 10, letterSpacing: '.1em', color: 'rgba(231,227,217,.5)' }}>INSCRITS</div><div style={{ fontFamily: MONO, fontSize: 28, fontWeight: 700 }}>28<span style={{ color: 'rgba(231,227,217,.45)' }}>/32</span></div></div>
        </div>
        <button className="b3-btn-ondark" style={{ marginTop: 26, padding: '14px 28px', border: 0, background: C.red, color: '#fff', fontFamily: UI, fontSize: 14, fontWeight: 800, letterSpacing: '.04em', textTransform: 'uppercase', cursor: 'pointer' }}>Inscrire mon équipe</button>
      </section>
      <div style={{ borderTop: `2px solid ${C.ink}` }}>
        {demo.map((t, i) => (
          <div key={i} className="b3-row" style={{ display: 'flex', alignItems: 'center', gap: 24, padding: '20px 4px', borderBottom: `1px solid ${C.line}` }}>
            <span style={{ fontFamily: MONO, fontSize: 12, color: C.muted, width: 34 }}>0{i + 1}</span>
            <div style={{ flex: 1 }}>
              <h3 style={{ margin: 0, fontFamily: DISP, fontSize: 26, lineHeight: .9, textTransform: 'uppercase' }}>{t.name}</h3>
              <p style={{ margin: '5px 0 0', fontFamily: MONO, fontSize: 11, color: C.muted }}>{t.date} · {t.teams} ÉQUIPES</p>
            </div>
            <span style={{ fontFamily: MONO, fontSize: 22, fontWeight: 700, color: C.red, width: 110, textAlign: 'right' }}>{t.prize}</span>
            <span style={{ fontFamily: MONO, fontSize: 10, fontWeight: 700, letterSpacing: '.08em', padding: '6px 12px', border: `1.5px solid ${t.statusColor}`, color: t.statusColor, width: 96, textAlign: 'center' }}>{t.status}</span>
          </div>
        ))}
      </div>
    </>);
  };

  /* ── 06 SHOP (real catalogue) ────────────────────────────── */
  const renderShop = () => {
    const loading = products === null;
    const all = products ?? [];
    const cats = ['Tout', ...Array.from(new Set(all.map(p => p.category))).filter(Boolean)];
    const list = all.filter(p => cat === 'Tout' || p.category === cat);

    return (
      <div style={{ clipPath: scanClip, display: 'flex', flexDirection: 'column', gap: 26 }}>
        <ScreenHead num="06" eyebrow="// MERCH_OFFICIEL"
          title={<>Boutique</>}
          right={!loading ? <span style={{ fontFamily: MONO, fontSize: 12, color: C.muted }}>{list.length} ARTICLE{list.length !== 1 ? 'S' : ''}</span> : undefined} />

        {!loading && cats.length > 1 && chipRow(cats, cat, setCat)}

        {loading ? (
          <p style={{ fontFamily: MONO, fontSize: 12, letterSpacing: '.2em', color: C.muted, padding: '40px 0' }} className="animate-pulse">// CHARGEMENT DU CATALOGUE…</p>
        ) : list.length === 0 ? (
          <div style={{ border: `2px solid ${C.ink}`, padding: '48px 22px', textAlign: 'center' }}>
            <p style={{ margin: 0, fontFamily: DISP, fontSize: 26, textTransform: 'uppercase' }}>Rayon vide</p>
            <p style={{ margin: '8px 0 0', fontFamily: MONO, fontSize: 11, color: C.muted }}>AUCUN PRODUIT DANS CETTE CATÉGORIE</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 18 }}>
            {list.map(p => {
              const out = p.stock_quantity === 0;
              const low = p.stock_quantity > 0 && p.stock_quantity <= 5;
              const tag = out ? 'RUPTURE' : low ? `${p.stock_quantity} RESTANTS` : '';
              return (
                <div key={p.id} className="b3-row" style={{ border: `2px solid ${C.ink}`, background: C.paper, display: 'flex', flexDirection: 'column' }}>
                  <div style={{ position: 'relative', aspectRatio: '1/1', borderBottom: `2px solid ${C.ink}`, background: `repeating-linear-gradient(135deg,${C.paper3} 0 10px,${C.paper2} 10px 20px)`, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                    {p.img
                      ? <img src={p.img} alt={p.name} style={{ height: '100%', width: '100%', objectFit: 'cover', filter: out ? 'grayscale(1) opacity(.5)' : undefined }} onError={ev => { (ev.target as HTMLImageElement).style.display = 'none'; }} />
                      : <span style={{ fontFamily: MONO, fontSize: 10, color: C.muted }}>// {p.category.toLowerCase()}</span>}
                    {tag && <span style={{ position: 'absolute', top: 0, left: 0, padding: '5px 10px', background: out ? C.ink : C.red, color: '#fff', fontFamily: MONO, fontSize: 10, fontWeight: 700, letterSpacing: '.06em' }}>{tag}</span>}
                  </div>
                  <div style={{ padding: '14px 16px', flex: 1, display: 'flex', flexDirection: 'column' }}>
                    <p style={{ margin: 0, fontFamily: MONO, fontSize: 9.5, letterSpacing: '.1em', color: C.muted }}>{p.category}</p>
                    <p style={{ margin: '5px 0 0', fontFamily: UI, fontSize: 14, fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={p.name}>{p.name}</p>
                    <div style={{ flex: 1 }} />
                    <div style={{ display: 'flex', alignItems: 'stretch', justifyContent: 'space-between', marginTop: 14, gap: 10 }}>
                      <span style={{ fontFamily: MONO, fontSize: 18, fontWeight: 700, color: C.red, alignSelf: 'center' }}>{eur(p.price)}</span>
                      <button onClick={() => addToCart(p)} disabled={out}
                        className={out ? '' : 'b3-btn-ink'}
                        style={{ padding: '9px 16px', border: 0, background: out ? C.paper3 : C.ink, color: out ? C.muted : C.paper, fontFamily: UI, fontSize: 12, fontWeight: 800, letterSpacing: '.04em', cursor: out ? 'not-allowed' : 'pointer' }}>
                        {out ? 'ÉPUISÉ' : '+ AJOUTER'}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  };

  /* ── 06b PANIER (live cart from the shop) ────────────────── */
  const renderPanier = () => {
    const items = cartItems;
    const total = items.reduce((s, i) => s + i.price * i.quantity, 0);
    const count = items.reduce((s, i) => s + i.quantity, 0);

    const checkout = () => {
      if (!items.length) return;
      setCheckingOut(true);
      platformApi.createOrder({
        user_id: Number(user.id),
        total_ttc: total,
        payment_method: 'Card',
        items: items.map(i => ({ product_id: i.id, quantity: i.quantity, price_at_purchase: i.price })),
      })
        .then(r => {
          if (r.success) {
            notify(`Commande #${r.orderId ?? ''} confirmée — merci !`);
            onClearCart?.();
            reloadShop();
            if (user.isAdmin) platformApi.adminOverview().then(setOverview).catch(() => undefined);
          } else notify(r.error || 'Échec de la commande');
        })
        .catch(() => notify('Échec de la commande'))
        .finally(() => setCheckingOut(false));
    };

    return (
      <div style={{ clipPath: scanClip, display: 'flex', flexDirection: 'column', gap: 26 }}>
        <ScreenHead num="06" eyebrow={`// PANIER · ${count} ARTICLE${count !== 1 ? 'S' : ''}`} title={<>Panier</>}
          right={items.length > 0 ? <button onClick={() => onClearCart?.()} style={{ padding: '8px 14px', border: `1.5px solid ${C.ink}`, background: C.paper, fontFamily: MONO, fontSize: 11, fontWeight: 700, letterSpacing: '.06em', textTransform: 'uppercase', cursor: 'pointer' }}>Vider</button> : undefined} />

        {items.length === 0 ? (
          <div style={{ border: `2px solid ${C.ink}`, padding: '52px 22px', textAlign: 'center' }}>
            <p style={{ margin: 0, fontFamily: DISP, fontSize: 28, textTransform: 'uppercase' }}>Panier vide</p>
            <p style={{ margin: '8px 0 18px', fontFamily: MONO, fontSize: 11, color: C.muted }}>AJOUTE DU MERCH DEPUIS LA BOUTIQUE POUR LE RETROUVER ICI</p>
            <button onClick={() => setScreen('shop')} className="b3-btn-ink" style={{ padding: '13px 26px', border: 0, background: C.ink, color: C.paper, fontFamily: UI, fontSize: 13, fontWeight: 800, letterSpacing: '.04em', textTransform: 'uppercase', cursor: 'pointer' }}>→ Parcourir la boutique</button>
          </div>
        ) : (
          <section style={{ display: 'grid', gridTemplateColumns: '1.7fr 1fr', gap: 28, alignItems: 'start' }}>
            <div style={{ border: `2px solid ${C.ink}` }}>
              {items.map((it, i) => (
                <div key={it.id} style={{ display: 'grid', gridTemplateColumns: '64px 1fr auto auto auto', gap: 16, alignItems: 'center', padding: '14px 18px', borderBottom: i < items.length - 1 ? `1px solid ${C.line}` : 0 }}>
                  <span style={{ height: 56, width: 56, background: C.paper3, overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {it.img ? <img src={it.img} alt={it.name} style={{ height: '100%', width: '100%', objectFit: 'cover' }} /> : <span style={{ fontFamily: MONO, fontSize: 9, color: C.muted }}>// {it.category.toLowerCase()}</span>}
                  </span>
                  <div style={{ minWidth: 0 }}>
                    <p style={{ margin: 0, fontFamily: UI, fontSize: 15, fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={it.name}>{it.name}</p>
                    <p style={{ margin: '4px 0 0', fontFamily: MONO, fontSize: 11, color: C.muted }}>{eur(it.price)} · {it.category}</p>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', border: `1.5px solid ${C.ink}` }}>
                    <button onClick={() => onUpdateQty?.(it.id, -1)} title="Moins" style={{ height: 30, width: 30, border: 0, borderRight: `1.5px solid ${C.ink}`, background: C.paper, fontFamily: MONO, fontSize: 16, fontWeight: 700, cursor: 'pointer' }}>−</button>
                    <span style={{ minWidth: 34, textAlign: 'center', fontFamily: MONO, fontSize: 14, fontWeight: 700 }}>{it.quantity}</span>
                    <button onClick={() => onUpdateQty?.(it.id, 1)} disabled={it.stock_quantity > 0 && it.quantity >= it.stock_quantity} title="Plus" style={{ height: 30, width: 30, border: 0, borderLeft: `1.5px solid ${C.ink}`, background: C.paper, fontFamily: MONO, fontSize: 16, fontWeight: 700, cursor: it.stock_quantity > 0 && it.quantity >= it.stock_quantity ? 'not-allowed' : 'pointer', opacity: it.stock_quantity > 0 && it.quantity >= it.stock_quantity ? 0.4 : 1 }}>+</button>
                  </div>
                  <span style={{ fontFamily: MONO, fontSize: 15, fontWeight: 700, color: C.red, width: 72, textAlign: 'right' }}>{eur(it.price * it.quantity)}</span>
                  <button onClick={() => onRemoveFromCart?.(it.id)} title="Retirer" style={{ height: 30, width: 30, border: `1.5px solid ${C.line2}`, background: C.paper, color: C.muted, fontFamily: MONO, fontSize: 14, cursor: 'pointer' }}>✕</button>
                </div>
              ))}
            </div>
            <div style={{ border: `2px solid ${C.ink}`, padding: 24, position: 'sticky', top: 0 }}>
              <p style={{ ...kicker('// RÉCAPITULATIF'), margin: '0 0 18px', letterSpacing: '.14em' }}>// RÉCAPITULATIF</p>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: MONO, fontSize: 13, color: C.ink2, marginBottom: 10 }}><span>SOUS-TOTAL</span><span>{eur(total)}</span></div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: MONO, fontSize: 13, color: C.ink2, marginBottom: 16 }}><span>LIVRAISON</span><span>OFFERTE</span></div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', borderTop: `2px solid ${C.ink}`, paddingTop: 16 }}>
                <span style={{ fontFamily: DISP, fontSize: 22, textTransform: 'uppercase' }}>Total</span>
                <span style={{ fontFamily: MONO, fontSize: 30, fontWeight: 700, color: C.red }}>{eur(total)}</span>
              </div>
              <button onClick={checkout} disabled={checkingOut} className="b3-btn-ink" style={{ marginTop: 22, width: '100%', padding: 15, border: 0, background: C.red, color: '#fff', fontFamily: UI, fontSize: 14, fontWeight: 800, letterSpacing: '.04em', textTransform: 'uppercase', cursor: checkingOut ? 'wait' : 'pointer', opacity: checkingOut ? 0.6 : 1 }}>
                {checkingOut ? 'Traitement…' : 'Valider la commande'}
              </button>
              <button onClick={() => setScreen('shop')} style={{ marginTop: 10, width: '100%', padding: 12, border: `1.5px solid ${C.ink}`, background: C.paper, fontFamily: UI, fontSize: 12, fontWeight: 700, letterSpacing: '.04em', textTransform: 'uppercase', cursor: 'pointer' }}>+ Continuer mes achats</button>
            </div>
          </section>
        )}
      </div>
    );
  };

  /* ── DISCORD (public community servers, managed in admin) ── */
  const renderDiscord = () => {
    const all = discordServers ?? [];
    const featured = all.find(s => s.featured) ?? all[0];
    const rest = all.filter(s => s !== featured);
    const letter = (n: string) => (n.split('·').pop()?.trim()[0] || n[0] || 'D').toUpperCase();

    return (
      <div style={{ clipPath: scanClip, display: 'flex', flexDirection: 'column', gap: 26 }}>
        <ScreenHead num="07" eyebrow="// COMMUNAUTÉ · SERVEURS DISCORD" title={<>Discord</>} />

        {discordServers === null ? (
          <p style={{ fontFamily: MONO, fontSize: 12, letterSpacing: '.2em', color: C.muted, padding: '40px 0' }} className="animate-pulse">// CHARGEMENT DES SERVEURS…</p>
        ) : all.length === 0 ? (
          <div style={{ border: `2px solid ${C.ink}`, padding: '48px 22px', textAlign: 'center' }}>
            <p style={{ margin: 0, fontFamily: DISP, fontSize: 26, textTransform: 'uppercase' }}>Aucun serveur</p>
            <p style={{ margin: '8px 0 0', fontFamily: MONO, fontSize: 11, color: C.muted }}>UN ADMIN PEUT EN AJOUTER DEPUIS LE PANNEAU ADMIN</p>
          </div>
        ) : (<>
          {featured && (
            <a href={featured.invite_url} target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none', color: C.paper }}>
              <section className="b3-row" style={{ border: `2px solid ${C.ink}`, background: '#5865F2', color: '#fff', padding: 34, position: 'relative', overflow: 'hidden', cursor: 'pointer' }}>
                <span style={{ position: 'absolute', top: 0, right: 0, fontFamily: DISP, fontSize: 220, lineHeight: .7, color: 'rgba(255,255,255,.12)', transform: 'translate(10%,-14%)' }}>✶</span>
                <span style={{ display: 'inline-block', padding: '6px 12px', background: 'rgba(0,0,0,.25)', fontFamily: MONO, fontSize: 10, fontWeight: 700, letterSpacing: '.14em' }}>{[featured.tag, featured.members ? `${featured.members} MEMBRES` : null].filter(Boolean).join(' · ')}</span>
                <h2 style={{ margin: '16px 0 0', fontFamily: DISP, fontSize: 50, lineHeight: .85, textTransform: 'uppercase', maxWidth: 680 }}>{featured.name}</h2>
                {featured.description && <p style={{ margin: '12px 0 0', fontFamily: UI, fontSize: 15, lineHeight: 1.5, color: 'rgba(255,255,255,.88)', maxWidth: 560 }}>{featured.description}</p>}
                <span style={{ display: 'inline-block', marginTop: 24, padding: '14px 28px', background: '#fff', color: '#404EED', fontFamily: UI, fontSize: 14, fontWeight: 800, letterSpacing: '.04em', textTransform: 'uppercase' }}>↗ Rejoindre le serveur</span>
              </section>
            </a>
          )}

          {rest.length > 0 && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 18 }}>
              {rest.map(s => (
                <div key={s.id} className="b3-row" style={{ border: `2px solid ${C.ink}`, background: C.paper, display: 'flex', flexDirection: 'column' }}>
                  <div style={{ padding: '18px 18px 14px', flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                      <span style={{ height: 40, width: 40, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#5865F2', color: '#fff', fontFamily: DISP, fontSize: 20 }}>{letter(s.name)}</span>
                      {s.tag && <span style={{ fontFamily: MONO, fontSize: 9, fontWeight: 700, letterSpacing: '.08em', padding: '4px 8px', border: `1.5px solid ${C.ink}`, color: C.ink2 }}>{s.tag}</span>}
                    </div>
                    <p style={{ margin: 0, fontFamily: DISP, fontSize: 21, lineHeight: .95, textTransform: 'uppercase' }}>{s.name}</p>
                    {s.description && <p style={{ margin: '8px 0 0', fontFamily: UI, fontSize: 12.5, lineHeight: 1.5, color: C.ink2 }}>{s.description}</p>}
                    {s.members && <p style={{ margin: '10px 0 0', fontFamily: MONO, fontSize: 10, letterSpacing: '.08em', color: C.muted }}>● {s.members} MEMBRES</p>}
                  </div>
                  <a href={s.invite_url} target="_blank" rel="noopener noreferrer" className="b3-btn-ink" style={{ textAlign: 'center', padding: 13, borderTop: `2px solid ${C.ink}`, background: C.ink, color: C.paper, fontFamily: UI, fontSize: 12, fontWeight: 800, letterSpacing: '.06em', textTransform: 'uppercase', textDecoration: 'none' }}>↗ Rejoindre</a>
                </div>
              ))}
            </div>
          )}
          <p style={{ margin: 0, fontFamily: MONO, fontSize: 10, letterSpacing: '.08em', color: C.muted }}>// LES INVITATIONS S'OUVRENT DANS DISCORD · RESPECTE LE RÈGLEMENT DE CHAQUE SERVEUR</p>
        </>)}
      </div>
    );
  };

  /* ── 07 PROFIL (real user data + persisted LFG) ──────────── */
  const renderProfile = () => {
    const stats = statsData?.stats ?? DEFAULT_STATS;
    const f = profileForm;
    const name = (f.username || 'Phantom');
    const rank = f.rankLabel || stats.rank_name;
    const socials = [
      f.discord && { tag: 'DC', value: f.discord, color: '#9aa6ff' },
      f.twitter && { tag: 'X', value: f.twitter, color: C.paper },
      f.twitch && { tag: 'TW', value: f.twitch, color: '#b89bff' },
      f.youtube && { tag: 'YT', value: f.youtube, color: C.red },
    ].filter(Boolean) as { tag: string; value: string; color: string }[];
    const onDark = 'rgba(231,227,217,.25)';
    const set = (k: keyof typeof profileForm) => (ev: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setProfileForm(p => ({ ...p, [k]: ev.target.value }));

    const lbl: React.CSSProperties = { display: 'block', margin: '0 0 6px', fontFamily: MONO, fontSize: 10, letterSpacing: '.1em', color: C.muted, textTransform: 'uppercase' };
    const inp: React.CSSProperties = { width: '100%', padding: '11px 13px', border: `1.5px solid ${C.ink}`, background: C.paper, fontFamily: UI, fontSize: 14, color: C.ink, boxSizing: 'border-box' };
    const field = (label: string, key: keyof typeof profileForm, ph = '', area = false) => (
      <label style={{ display: 'block' }}>
        <span style={lbl}>{label}</span>
        {area
          ? <textarea value={f[key]} onChange={set(key)} placeholder={ph} rows={3} style={{ ...inp, resize: 'vertical' }} />
          : <input value={f[key]} onChange={set(key)} placeholder={ph} style={inp} />}
      </label>
    );

    const saveProfile = () => {
      setProfileSaving(true);
      const toArr = (s: string) => s.split(',').map(x => x.trim()).filter(Boolean);
      platformApi.updateProfile(Number(user.id), {
        username: f.username.trim() || user.username,
        bio: f.bio, discord: f.discord, twitter: f.twitter, twitch: f.twitch, youtube: f.youtube,
        avatarUrl: f.avatarUrl, rankLabel: f.rankLabel, region: f.region,
        roles: toArr(f.roles), languages: toArr(f.languages), playtimes: toArr(f.playtimes),
      })
        .then(r => notify(r.success ? 'Profil mis à jour' : (r.error || 'Échec de la sauvegarde')))
        .catch(() => notify('Échec de la sauvegarde'))
        .finally(() => setProfileSaving(false));
    };

    // Read a picture from the user's PC, downscale it, and save it as the avatar.
    const fileToAvatar = (file: File) => new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onerror = reject;
      reader.onload = () => {
        const img = new Image();
        img.onerror = reject;
        img.onload = () => {
          const max = 256;
          const scale = Math.min(max / img.width, max / img.height, 1);
          const canvas = document.createElement('canvas');
          canvas.width = Math.max(1, Math.round(img.width * scale));
          canvas.height = Math.max(1, Math.round(img.height * scale));
          const ctx = canvas.getContext('2d');
          if (!ctx) { resolve(reader.result as string); return; }
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          resolve(canvas.toDataURL('image/jpeg', 0.85));
        };
        img.src = reader.result as string;
      };
      reader.readAsDataURL(file);
    });
    const onPickAvatar = (ev: React.ChangeEvent<HTMLInputElement>) => {
      const file = ev.target.files?.[0];
      ev.target.value = ''; // let the same file be re-selected later
      if (!file) return;
      if (!file.type.startsWith('image/')) { notify('Choisis un fichier image'); return; }
      setProfileSaving(true);
      fileToAvatar(file)
        .then(dataUrl => {
          setProfileForm(p => ({ ...p, avatarUrl: dataUrl }));
          return platformApi.updateProfile(Number(user.id), { avatarUrl: dataUrl })
            .then(r => notify(r.success ? 'Photo de profil mise à jour' : (r.error || 'Échec de la sauvegarde')));
        })
        .catch(() => notify('Image illisible'))
        .finally(() => setProfileSaving(false));
    };

    const toggleLfg = () => {
      const next = !lfg;
      setLfg(next);
      setLfgSaving(true);
      platformApi.updateProfile(Number(user.id), { showInLfg: next })
        .then(r => notify(r.success ? (next ? 'Mode LFG activé' : 'Mode LFG désactivé') : 'Échec de la sauvegarde'))
        .catch(() => notify('Échec de la sauvegarde'))
        .finally(() => setLfgSaving(false));
    };

    // Riot account: validate "Pseudo#TAG", verify via the Riot proxy when a key
    // is configured, then persist riotId/tagLine. Links even without a key.
    const riotConnected = !!(f.riotId && f.tagLine);
    const connectRiot = () => {
      setRiotError(null);
      const [name, tag] = riotInput.trim().split('#');
      if (!name?.trim() || !tag?.trim()) { setRiotError('Format requis : Pseudo#TAG'); return; }
      setRiotBusy(true);
      platformApi.getRiotPlayer(name.trim(), tag.trim())
        .then(res => {
          if (!res.success && !res.needsApiKey) { setRiotError(res.error || 'Joueur Riot introuvable'); return; }
          return platformApi.updateProfile(Number(user.id), { riotId: name.trim(), tagLine: tag.trim() }).then(save => {
            if (!save.success) { setRiotError(save.error || 'Erreur de sauvegarde'); return; }
            setProfileForm(p => ({ ...p, riotId: name.trim(), tagLine: tag.trim() }));
            setRiotInput('');
            notify(res.success ? `Compte Riot lié · ${name.trim()}#${tag.trim()}` : 'Riot ID enregistré');
          });
        })
        .catch(() => setRiotError('Erreur serveur'))
        .finally(() => setRiotBusy(false));
    };
    const disconnectRiot = () => {
      setRiotBusy(true);
      platformApi.updateProfile(Number(user.id), { riotId: '', tagLine: '' })
        .then(r => { if (r.success) { setProfileForm(p => ({ ...p, riotId: '', tagLine: '' })); notify('Compte Riot dissocié'); } else notify(r.error || 'Échec'); })
        .catch(() => notify('Échec'))
        .finally(() => setRiotBusy(false));
    };

    return (
      <div style={{ clipPath: scanClip, display: 'flex', flexDirection: 'column', gap: 26 }}>
        <ScreenHead num="07" eyebrow="// IDENTITÉ" title={<>Profil</>} />
        <section style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr', border: `2px solid ${C.ink}` }}>
          <div style={{ padding: 30, borderRight: `2px solid ${C.ink}`, background: C.ink, color: C.paper }}>
            <div style={{ position: 'relative', width: 120 }}>
              <div style={{ height: 120, width: 120, overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: DISP, fontSize: 56, color: '#fff', background: C.red, clipPath: 'polygon(0 0,100% 0,100% 80%,86% 100%,0 100%)' }}>
                {f.avatarUrl ? <img src={f.avatarUrl} alt={name} style={{ height: '100%', width: '100%', objectFit: 'cover' }} /> : (name[0]?.toUpperCase())}
              </div>
              <button onClick={() => avatarFileRef.current?.click()} disabled={profileSaving} title="Changer la photo de profil" style={{ position: 'absolute', right: -8, bottom: -8, height: 36, width: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0, border: `2px solid ${C.ink}`, background: C.paper, color: C.ink, cursor: profileSaving ? 'wait' : 'pointer' }}>
                <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9" /><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5z" /></svg>
              </button>
              <input ref={avatarFileRef} type="file" accept="image/*" onChange={onPickAvatar} style={{ display: 'none' }} />
            </div>
            <h2 style={{ margin: '22px 0 0', fontFamily: DISP, fontSize: 38, lineHeight: .85, textTransform: 'uppercase', overflow: 'hidden', textOverflow: 'ellipsis' }}>{name}</h2>
            <p style={{ margin: '8px 0 0', fontFamily: MONO, fontSize: 12, letterSpacing: '.06em', color: C.red, textTransform: 'uppercase' }}>{rank} · {N(stats.rank_rating, 0)} RR</p>
            {f.bio && <p style={{ margin: '14px 0 0', fontFamily: UI, fontSize: 13, lineHeight: 1.5, color: 'rgba(231,227,217,.7)' }}>{f.bio}</p>}
            {socials.length > 0 ? (
              <div style={{ display: 'flex', marginTop: 22, border: `1px solid ${onDark}`, width: 'max-content' }}>
                {socials.map((s, i) => (
                  <span key={i} title={s.value} style={{ height: 42, width: 42, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRight: i < socials.length - 1 ? `1px solid ${onDark}` : 0, fontFamily: MONO, fontSize: 12, fontWeight: 700, color: s.color }}>{s.tag}</span>
                ))}
              </div>
            ) : (
              <p style={{ margin: '22px 0 0', fontFamily: MONO, fontSize: 10, letterSpacing: '.08em', color: 'rgba(231,227,217,.5)' }}>// AUCUN RÉSEAU LIÉ</p>
            )}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '22px 26px', borderBottom: `2px solid ${C.ink}` }}>
              <div>
                <p style={{ margin: 0, fontFamily: DISP, fontSize: 22, textTransform: 'uppercase' }}>Mode LFG</p>
                <p style={{ margin: '4px 0 0', fontFamily: MONO, fontSize: 11, color: C.muted }}>APPARAÎTRE DANS LA RECHERCHE D'ÉQUIPE</p>
              </div>
              <button onClick={toggleLfg} disabled={lfgSaving} title={lfgSaving ? 'Sauvegarde…' : undefined} style={{ position: 'relative', width: 62, height: 30, border: `2px solid ${C.ink}`, background: lfg ? C.red : C.paper3, cursor: lfgSaving ? 'wait' : 'pointer', padding: 0, opacity: lfgSaving ? 0.6 : 1 }}>
                <span style={{ position: 'absolute', top: 1, left: 1, height: 24, width: 24, background: lfg ? C.paper : C.ink, transition: 'transform .2s', transform: lfg ? 'translateX(32px)' : 'translateX(0)' }} />
              </button>
            </div>
            <div style={{ padding: '22px 26px', display: 'flex', flexDirection: 'column', gap: 18 }}>
              <p style={{ ...kicker('// IDENTITÉ_PUBLIQUE'), margin: 0, letterSpacing: '.14em' }}>// IDENTITÉ_PUBLIQUE</p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                {field("Nom d'utilisateur", 'username', 'Phantom')}
                {field('Rang', 'rankLabel', 'Diamant II')}
              </div>
              {field('Photo de profil (URL de l\'image)', 'avatarUrl', 'https://…/avatar.png')}
              {field('Bio', 'bio', 'Quelques mots sur toi…', true)}

              <p style={{ ...kicker('// RÉSEAUX'), margin: '4px 0 0', letterSpacing: '.14em' }}>// RÉSEAUX</p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                {field('Discord', 'discord', 'pseudo#0000')}
                {field('Twitch', 'twitch', 'twitch.tv/pseudo')}
                {field('Twitter / X', 'twitter', '@pseudo')}
                {field('YouTube', 'youtube', 'youtube.com/@pseudo')}
              </div>

              <p style={{ ...kicker('// COMPTE_RIOT'), margin: '4px 0 0', letterSpacing: '.14em' }}>// COMPTE_RIOT</p>
              {riotConnected ? (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 14, border: `1.5px solid ${C.ink}`, padding: '14px 16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 }}>
                    <span style={{ height: 36, width: 36, flex: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', background: C.red, color: '#fff', fontFamily: DISP, fontSize: 18 }}>R</span>
                    <div style={{ minWidth: 0 }}>
                      <p style={{ margin: 0, fontFamily: UI, fontSize: 15, fontWeight: 800, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{f.riotId}<span style={{ color: C.muted }}>#{f.tagLine}</span></p>
                      <p style={{ margin: '2px 0 0', fontFamily: MONO, fontSize: 10, letterSpacing: '.06em', color: C.green }}>● COMPTE LIÉ</p>
                    </div>
                  </div>
                  <button onClick={disconnectRiot} disabled={riotBusy} style={{ flex: 'none', padding: '9px 16px', border: `1.5px solid ${C.ink}`, background: C.paper, fontFamily: UI, fontSize: 12, fontWeight: 700, letterSpacing: '.04em', textTransform: 'uppercase', cursor: riotBusy ? 'wait' : 'pointer', opacity: riotBusy ? 0.6 : 1 }}>Dissocier</button>
                </div>
              ) : (
                <div style={{ display: 'flex', gap: 12, alignItems: 'stretch' }}>
                  <input value={riotInput} onChange={ev => { setRiotInput(ev.target.value); setRiotError(null); }} onKeyDown={ev => { if (ev.key === 'Enter') connectRiot(); }} placeholder="Pseudo#TAG" style={{ ...inp, flex: 1 }} />
                  <button onClick={connectRiot} disabled={riotBusy} className="b3-btn-ink" style={{ flex: 'none', padding: '0 24px', border: 0, background: C.ink, color: C.paper, fontFamily: UI, fontSize: 13, fontWeight: 800, letterSpacing: '.04em', textTransform: 'uppercase', cursor: riotBusy ? 'wait' : 'pointer', opacity: riotBusy ? 0.6 : 1 }}>{riotBusy ? '…' : 'Lier mon compte'}</button>
                </div>
              )}
              {riotError && <p style={{ margin: '-6px 0 0', fontFamily: MONO, fontSize: 11, color: C.red }}>{riotError}</p>}

              <p style={{ ...kicker('// PROFIL_GAMING'), margin: '4px 0 0', letterSpacing: '.14em' }}>// PROFIL_GAMING</p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                {field('Région', 'region', 'EUW')}
                {field('Rôles (séparés par ,)', 'roles', 'Duelliste, Initiateur')}
                {field('Langues (séparées par ,)', 'languages', 'FR, EN')}
                {field('Disponibilités (séparées par ,)', 'playtimes', 'Soir, Week-end')}
              </div>

              <button onClick={saveProfile} disabled={profileSaving} className="b3-btn-ink" style={{ marginTop: 4, alignSelf: 'flex-start', padding: '14px 30px', border: 0, background: C.red, color: '#fff', fontFamily: UI, fontSize: 13, fontWeight: 800, letterSpacing: '.04em', textTransform: 'uppercase', cursor: profileSaving ? 'wait' : 'pointer', opacity: profileSaving ? 0.6 : 1 }}>
                {profileSaving ? 'Sauvegarde…' : 'Enregistrer le profil'}
              </button>
            </div>
          </div>
        </section>
      </div>
    );
  };

  /* ── 08 ADMIN (real overview) ────────────────────────────── */
  const renderAdmin = () => {
    const head = <ScreenHead num="08" eyebrow="// VUE_D'ENSEMBLE" title={<>Panneau Admin</>} />;
    const wrap = (body: React.ReactNode) => (
      <div style={{ clipPath: scanClip, display: 'flex', flexDirection: 'column', gap: 26 }}>{head}{body}</div>
    );

    if (overview === null) {
      return wrap(<p style={{ fontFamily: MONO, fontSize: 12, letterSpacing: '.2em', color: C.muted, padding: '40px 0' }} className="animate-pulse">// CHARGEMENT DES MÉTRIQUES…</p>);
    }
    const m = overview.metrics;
    if (!overview.success || !m) {
      return wrap(
        <div style={{ border: `2px solid ${C.red}`, padding: '40px 24px' }}>
          <p style={{ margin: 0, fontFamily: DISP, fontSize: 26, textTransform: 'uppercase', color: C.red }}>API hors-ligne</p>
          <p style={{ margin: '10px 0 0', fontFamily: MONO, fontSize: 12, color: C.ink2 }}>{overview.error || 'Impossible de charger les données.'}</p>
          <p style={{ margin: '6px 0 0', fontFamily: MONO, fontSize: 11, color: C.muted }}>Vérifie que le serveur tourne — <span style={{ color: C.ink, fontWeight: 700 }}>npm run api</span></p>
        </div>,
      );
    }

    const adminStats = [
      { label: 'REVENU TOTAL', value: eur(m.revenue * e), sub: 'TOUTES VENTES', color: C.green },
      { label: 'COMMANDES', value: N(m.orders, 0), sub: `${m.products} PRODUITS`, color: C.ink },
      { label: 'MEMBRES', value: N(m.users, 0), sub: `${m.admins} ADMIN${m.admins > 1 ? 'S' : ''} · ${m.lfg} LFG`, color: C.ink },
      { label: 'STOCK', value: N(m.stock, 0), sub: 'UNITÉS', color: m.stock <= 10 ? C.red : C.ink },
    ];

    const signups = overview.signups ?? [];
    const maxSignup = Math.max(1, ...signups.map(s => s.count));
    const orders = overview.recentOrders ?? [];

    // ── Member actions ───────────────────────────────────────
    const afterUser = (msg: string, ok: boolean) => { notify(ok ? msg : (msg || 'Échec')); if (ok) reloadAdminUsers().catch(() => undefined); };
    const setUser = (id: number, updates: Parameters<typeof platformApi.adminUpdateUser>[1], okMsg: string) => {
      setBusyId(id);
      platformApi.adminUpdateUser(id, updates)
        .then(r => afterUser(r.success ? okMsg : (r.error ?? ''), r.success))
        .catch(() => afterUser('Échec de la mise à jour', false))
        .finally(() => setBusyId(null));
    };
    const delUser = (u: AdminUser) => {
      if (!window.confirm(`Supprimer ${u.username} ? Action définitive.`)) return;
      setBusyId(u.id);
      platformApi.adminDeleteUser(u.id)
        .then(r => afterUser(r.success ? 'Utilisateur supprimé' : (r.error ?? ''), r.success))
        .catch(() => afterUser('Échec de la suppression', false))
        .finally(() => setBusyId(null));
    };

    // ── Merch actions ────────────────────────────────────────
    const afterProd = (msg: string, ok: boolean) => {
      notify(ok ? msg : (msg || 'Échec'));
      if (ok) { reloadAdminProducts().catch(() => undefined); reloadShop(); }
    };
    const addProduct = () => {
      if (!prodForm.name.trim()) { notify('Le nom du produit est requis'); return; }
      setBusyId(-1);
      platformApi.adminCreateProduct({
        name: prodForm.name.trim(),
        price: Number(prodForm.price) || 0,
        category: prodForm.category.trim() || 'ACCESSOIRES',
        image_url: prodForm.image_url.trim(),
        stock_quantity: Number(prodForm.stock_quantity) || 0,
      })
        .then(r => { afterProd(r.success ? 'Produit ajouté' : (r.error ?? ''), r.success); if (r.success) setProdForm({ name: '', price: '', category: 'ACCESSOIRES', image_url: '', stock_quantity: '' }); })
        .catch(() => afterProd('Échec de l\'ajout', false))
        .finally(() => setBusyId(null));
    };
    const delProduct = (p: ProductRecord) => {
      if (!window.confirm(`Supprimer « ${p.name} » de la boutique ?`)) return;
      setBusyId(p.id);
      platformApi.adminDeleteProduct(p.id)
        .then(r => afterProd(r.success ? 'Produit supprimé' : (r.error ?? ''), r.success))
        .catch(() => afterProd('Échec de la suppression', false))
        .finally(() => setBusyId(null));
    };

    const tabs: { id: typeof adminTab; label: string }[] = [
      { id: 'overview', label: 'Vue d\'ensemble' },
      { id: 'users', label: 'Membres' },
      { id: 'merch', label: 'Boutique' },
      { id: 'discord', label: 'Discord' },
    ];
    const tabRow = (
      <div style={{ display: 'flex', border: `2px solid ${C.ink}`, width: 'max-content' }}>
        {tabs.map((t, i) => (
          <button key={t.id} onClick={() => setAdminTab(t.id)} style={{ padding: '10px 20px', border: 0, borderRight: i < tabs.length - 1 ? `2px solid ${C.ink}` : 0, background: adminTab === t.id ? C.ink : C.paper, color: adminTab === t.id ? C.paper : C.ink, fontFamily: UI, fontSize: 12, fontWeight: 800, letterSpacing: '.04em', textTransform: 'uppercase', cursor: 'pointer' }}>{t.label}</button>
        ))}
      </div>
    );

    const overviewBody = (
      <>
        <section style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', border: `2px solid ${C.ink}` }}>
          {adminStats.map((st, i) => (
            <div key={i} style={{ padding: 22, borderRight: i < 3 ? `1px solid ${C.line}` : 0 }}>
              <p style={{ margin: 0, fontFamily: MONO, fontSize: 10, letterSpacing: '.1em', color: C.muted }}>{st.label}</p>
              <p style={{ margin: '12px 0 0', fontFamily: MONO, fontSize: 38, fontWeight: 700, lineHeight: .85, color: st.color }}>{st.value}</p>
              <p style={{ margin: '8px 0 0', fontFamily: MONO, fontSize: 11, fontWeight: 700, color: C.ink2 }}>{st.sub}</p>
            </div>
          ))}
        </section>
        <section style={{ display: 'grid', gridTemplateColumns: '1fr 1.2fr', gap: 28 }}>
          <div style={{ border: `2px solid ${C.ink}`, padding: 22 }}>
            <p style={{ ...kicker('x'), margin: '0 0 20px', letterSpacing: '.14em' }}>// INSCRIPTIONS · 7J</p>
            {signups.length === 0 ? (
              <div style={{ height: 160, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: MONO, fontSize: 11, color: C.muted }}>AUCUNE INSCRIPTION RÉCENTE</div>
            ) : (
              <div style={{ display: 'flex', alignItems: 'flex-end', gap: 12, height: 160 }}>
                {signups.map((s, i) => {
                  const day = new Date(s.day).toLocaleDateString('fr-FR', { weekday: 'short' }).replace('.', '').slice(0, 3).toUpperCase();
                  return (
                    <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, height: '100%', justifyContent: 'flex-end' }}>
                      <span style={{ fontFamily: MONO, fontSize: 11, fontWeight: 700, color: C.ink2 }}>{Math.round(s.count * e)}</span>
                      <div style={{ width: '100%', background: C.red, height: ((s.count / maxSignup) * 100 * e).toFixed(1) + '%', minHeight: s.count > 0 ? 3 : 0 }} />
                      <span style={{ fontFamily: MONO, fontSize: 10, color: C.muted }}>{day}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
          <div>
            <p style={{ ...kicker('x'), margin: '0 0 14px', letterSpacing: '.14em' }}>// COMMANDES_RÉCENTES</p>
            <div style={{ borderTop: `2px solid ${C.ink}` }}>
              {orders.length === 0 && (
                <div style={{ padding: '24px 0', fontFamily: MONO, fontSize: 11, color: C.muted }}>AUCUNE COMMANDE</div>
              )}
              {orders.map((o, i) => {
                const col = ORDER_STATUS_COLOR[o.status] ?? C.ink2;
                return (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '13px 0', borderBottom: `1px solid ${C.line}` }}>
                    <span style={{ fontFamily: MONO, fontSize: 11, color: C.muted, width: 46 }}>#{o.id}</span>
                    <span style={{ flex: 1, fontFamily: UI, fontSize: 14, fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{o.username ?? 'Inconnu'}</span>
                    <span style={{ fontFamily: MONO, fontSize: 14, fontWeight: 700 }}>{eur(o.total_ttc)}</span>
                    <span style={{ fontFamily: MONO, fontSize: 10, fontWeight: 700, letterSpacing: '.06em', padding: '5px 10px', border: `1.5px solid ${col}`, color: col, width: 104, textAlign: 'center', textTransform: 'uppercase' }}>{o.status}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      </>
    );

    const ucols = '2fr 1.4fr 70px 70px 80px 1fr';
    const usersBody = adminUsers === null ? (
      <p style={{ fontFamily: MONO, fontSize: 12, letterSpacing: '.2em', color: C.muted, padding: '40px 0' }} className="animate-pulse">// CHARGEMENT DES MEMBRES…</p>
    ) : (
      <div style={{ border: `2px solid ${C.ink}` }}>
        <div style={{ display: 'grid', gridTemplateColumns: ucols, gap: 14, padding: '12px 18px', borderBottom: `2px solid ${C.ink}`, background: C.paper2, fontFamily: MONO, fontSize: 10, letterSpacing: '.1em', color: C.muted }}>
          <span>MEMBRE</span><span>EMAIL</span><span>ADMIN</span><span>LFG</span><span>STATUT</span><span style={{ textAlign: 'right' }}>ACTIONS</span>
        </div>
        {adminUsers.length === 0 && <div style={{ padding: 20, fontFamily: MONO, fontSize: 11, color: C.muted }}>AUCUN MEMBRE</div>}
        {adminUsers.map((u, i) => {
          const busy = busyId === u.id;
          const isMe = Number(u.id) === Number(user.id);
          const banned = !!u.banned;
          const isAdmin = !!u.is_admin;
          const pill = (label: string, on: boolean, onClick: () => void, disabled = false) => (
            <button onClick={onClick} disabled={disabled || busy} title={label} style={{ padding: '5px 9px', border: `1.5px solid ${on ? C.green : C.line2}`, background: on ? C.green : C.paper, color: on ? '#fff' : C.muted, fontFamily: MONO, fontSize: 10, fontWeight: 700, letterSpacing: '.04em', cursor: disabled || busy ? 'not-allowed' : 'pointer', opacity: disabled || busy ? 0.5 : 1 }}>{on ? 'OUI' : 'NON'}</button>
          );
          return (
            <div key={u.id} style={{ display: 'grid', gridTemplateColumns: ucols, gap: 14, alignItems: 'center', padding: '12px 18px', borderBottom: i < adminUsers.length - 1 ? `1px solid ${C.line}` : 0, opacity: banned ? 0.6 : 1 }}>
              <span style={{ fontFamily: UI, fontSize: 15, fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{u.username}{isMe && <span style={{ marginLeft: 6, fontFamily: MONO, fontSize: 9, color: C.muted }}>(VOUS)</span>}</span>
              <span style={{ fontFamily: MONO, fontSize: 11, color: C.ink2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{u.email}</span>
              {pill('Admin', isAdmin, () => setUser(u.id, { isAdmin: !isAdmin }, isAdmin ? 'Admin retiré' : 'Promu admin'), isMe)}
              {pill('LFG', !!u.show_in_lfg, () => setUser(u.id, { showInLfg: !u.show_in_lfg }, u.show_in_lfg ? 'Retiré du LFG' : 'Ajouté au LFG'))}
              <span style={{ fontFamily: MONO, fontSize: 10, fontWeight: 700, letterSpacing: '.05em', color: banned ? C.red : C.green, textTransform: 'uppercase' }}>{banned ? 'Banni' : 'Actif'}</span>
              <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                <button onClick={() => setUser(u.id, { banned: !banned }, banned ? 'Débanni' : 'Banni')} disabled={busy || isMe || isAdmin} title={isAdmin ? 'Dépromouvoir avant de bannir' : (banned ? 'Débannir' : 'Bannir')} style={{ padding: '7px 12px', border: `1.5px solid ${banned ? C.green : C.red}`, background: C.paper, color: banned ? C.green : C.red, fontFamily: UI, fontSize: 11, fontWeight: 800, letterSpacing: '.04em', textTransform: 'uppercase', cursor: busy || isMe || isAdmin ? 'not-allowed' : 'pointer', opacity: busy || isMe || isAdmin ? 0.4 : 1 }}>{banned ? 'Débannir' : 'Bannir'}</button>
                <button onClick={() => delUser(u)} disabled={busy || isMe} title="Supprimer" style={{ padding: '7px 12px', border: `1.5px solid ${C.ink}`, background: C.ink, color: C.paper, fontFamily: UI, fontSize: 11, fontWeight: 800, letterSpacing: '.04em', textTransform: 'uppercase', cursor: busy || isMe ? 'not-allowed' : 'pointer', opacity: busy || isMe ? 0.4 : 1 }}>Suppr.</button>
              </div>
            </div>
          );
        })}
      </div>
    );

    const finp: React.CSSProperties = { padding: '11px 13px', border: `1.5px solid ${C.ink}`, background: C.paper, fontFamily: UI, fontSize: 14, color: C.ink, boxSizing: 'border-box', width: '100%' };
    const merchBody = (
      <>
        <section style={{ border: `2px solid ${C.ink}`, padding: 22 }}>
          <p style={{ ...kicker('// AJOUTER_UN_PRODUIT'), margin: '0 0 16px', letterSpacing: '.14em' }}>// AJOUTER_UN_PRODUIT</p>
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1.2fr 1fr', gap: 14 }}>
            <input value={prodForm.name} onChange={ev => setProdForm(p => ({ ...p, name: ev.target.value }))} placeholder="Nom du produit" style={finp} />
            <input value={prodForm.price} onChange={ev => setProdForm(p => ({ ...p, price: ev.target.value }))} placeholder="Prix €" inputMode="decimal" style={finp} />
            <input value={prodForm.category} onChange={ev => setProdForm(p => ({ ...p, category: ev.target.value }))} placeholder="Catégorie" style={finp} />
            <input value={prodForm.stock_quantity} onChange={ev => setProdForm(p => ({ ...p, stock_quantity: ev.target.value }))} placeholder="Stock" inputMode="numeric" style={finp} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 14, marginTop: 14 }}>
            <input value={prodForm.image_url} onChange={ev => setProdForm(p => ({ ...p, image_url: ev.target.value }))} placeholder="URL de l'image (https://…)" style={finp} />
            <button onClick={addProduct} disabled={busyId === -1} style={{ padding: '0 30px', border: 0, background: C.red, color: '#fff', fontFamily: UI, fontSize: 13, fontWeight: 800, letterSpacing: '.04em', textTransform: 'uppercase', cursor: busyId === -1 ? 'wait' : 'pointer', opacity: busyId === -1 ? 0.6 : 1 }}>+ Ajouter</button>
          </div>
        </section>
        {adminProducts === null ? (
          <p style={{ fontFamily: MONO, fontSize: 12, letterSpacing: '.2em', color: C.muted, padding: '40px 0' }} className="animate-pulse">// CHARGEMENT DE LA BOUTIQUE…</p>
        ) : (
          <div style={{ border: `2px solid ${C.ink}` }}>
            <div style={{ display: 'grid', gridTemplateColumns: '52px 2fr 1.2fr 80px 90px 90px', gap: 14, padding: '12px 18px', borderBottom: `2px solid ${C.ink}`, background: C.paper2, fontFamily: MONO, fontSize: 10, letterSpacing: '.1em', color: C.muted }}>
              <span /><span>PRODUIT</span><span>CATÉGORIE</span><span>PRIX</span><span>STOCK</span><span style={{ textAlign: 'right' }}>ACTION</span>
            </div>
            {adminProducts.length === 0 && <div style={{ padding: 20, fontFamily: MONO, fontSize: 11, color: C.muted }}>AUCUN PRODUIT</div>}
            {adminProducts.map((p, i) => (
              <div key={p.id} style={{ display: 'grid', gridTemplateColumns: '52px 2fr 1.2fr 80px 90px 90px', gap: 14, alignItems: 'center', padding: '12px 18px', borderBottom: i < adminProducts.length - 1 ? `1px solid ${C.line}` : 0 }}>
                <span style={{ height: 40, width: 40, background: C.paper3, overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {p.image_url ? <img src={p.image_url} alt={p.name} style={{ height: '100%', width: '100%', objectFit: 'cover' }} /> : <span style={{ fontFamily: DISP, fontSize: 15, color: C.muted }}>{p.name[0]}</span>}
                </span>
                <span style={{ fontFamily: UI, fontSize: 14, fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.name}</span>
                <span style={{ fontFamily: MONO, fontSize: 11, color: C.ink2, textTransform: 'uppercase' }}>{p.category}</span>
                <span style={{ fontFamily: MONO, fontSize: 13, fontWeight: 700 }}>{eur(p.price)}</span>
                <span style={{ fontFamily: MONO, fontSize: 13, color: p.stock_quantity <= 10 ? C.red : C.ink2 }}>{p.stock_quantity}</span>
                <div style={{ textAlign: 'right' }}>
                  <button onClick={() => delProduct(p)} disabled={busyId === p.id} style={{ padding: '7px 12px', border: `1.5px solid ${C.red}`, background: C.paper, color: C.red, fontFamily: UI, fontSize: 11, fontWeight: 800, letterSpacing: '.04em', textTransform: 'uppercase', cursor: busyId === p.id ? 'wait' : 'pointer', opacity: busyId === p.id ? 0.5 : 1 }}>Suppr.</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </>
    );

    // ── Discord actions ──────────────────────────────────────
    const afterDiscord = (msg: string, ok: boolean) => { notify(ok ? msg : (msg || 'Échec')); if (ok) reloadDiscord().catch(() => undefined); };
    const addDiscord = () => {
      if (!discordForm.name.trim() || !discordForm.inviteUrl.trim()) { notify('Nom et lien d’invitation requis'); return; }
      setBusyId(-2);
      platformApi.adminCreateDiscordServer({
        name: discordForm.name.trim(),
        inviteUrl: discordForm.inviteUrl.trim(),
        tag: discordForm.tag.trim(),
        members: discordForm.members.trim(),
        description: discordForm.description.trim(),
      })
        .then(r => { afterDiscord(r.success ? 'Serveur ajouté' : (r.error ?? ''), r.success); if (r.success) setDiscordForm({ name: '', inviteUrl: '', tag: '', members: '', description: '' }); })
        .catch(() => afterDiscord('Échec de l\'ajout', false))
        .finally(() => setBusyId(null));
    };
    const delDiscord = (s: DiscordServer) => {
      if (!window.confirm(`Retirer « ${s.name} » de la page Discord ?`)) return;
      setBusyId(s.id);
      platformApi.adminDeleteDiscordServer(s.id)
        .then(r => afterDiscord(r.success ? 'Serveur retiré' : (r.error ?? ''), r.success))
        .catch(() => afterDiscord('Échec de la suppression', false))
        .finally(() => setBusyId(null));
    };

    const dservers = discordServers ?? [];
    const discordBody = (
      <>
        <section style={{ border: `2px solid ${C.ink}`, padding: 22 }}>
          <p style={{ ...kicker('// AJOUTER_UN_SERVEUR'), margin: '0 0 16px', letterSpacing: '.14em' }}>// AJOUTER_UN_SERVEUR</p>
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 2fr 1fr 1fr', gap: 14 }}>
            <input value={discordForm.name} onChange={ev => setDiscordForm(p => ({ ...p, name: ev.target.value }))} placeholder="Nom du serveur" style={finp} />
            <input value={discordForm.inviteUrl} onChange={ev => setDiscordForm(p => ({ ...p, inviteUrl: ev.target.value }))} placeholder="Lien d'invitation (https://discord.gg/…)" style={finp} />
            <input value={discordForm.tag} onChange={ev => setDiscordForm(p => ({ ...p, tag: ev.target.value }))} placeholder="Tag (ex. LFG)" style={finp} />
            <input value={discordForm.members} onChange={ev => setDiscordForm(p => ({ ...p, members: ev.target.value }))} placeholder="Membres (ex. 50 000+)" style={finp} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 14, marginTop: 14 }}>
            <input value={discordForm.description} onChange={ev => setDiscordForm(p => ({ ...p, description: ev.target.value }))} placeholder="Description (optionnelle)" style={finp} />
            <button onClick={addDiscord} disabled={busyId === -2} style={{ padding: '0 30px', border: 0, background: C.red, color: '#fff', fontFamily: UI, fontSize: 13, fontWeight: 800, letterSpacing: '.04em', textTransform: 'uppercase', cursor: busyId === -2 ? 'wait' : 'pointer', opacity: busyId === -2 ? 0.6 : 1 }}>+ Ajouter</button>
          </div>
        </section>
        {discordServers === null ? (
          <p style={{ fontFamily: MONO, fontSize: 12, letterSpacing: '.2em', color: C.muted, padding: '40px 0' }} className="animate-pulse">// CHARGEMENT DES SERVEURS…</p>
        ) : (
          <div style={{ border: `2px solid ${C.ink}` }}>
            <div style={{ display: 'grid', gridTemplateColumns: '44px 2fr 1.1fr 1fr 1.4fr 90px', gap: 14, padding: '12px 18px', borderBottom: `2px solid ${C.ink}`, background: C.paper2, fontFamily: MONO, fontSize: 10, letterSpacing: '.1em', color: C.muted }}>
              <span /><span>SERVEUR</span><span>TAG</span><span>MEMBRES</span><span>INVITATION</span><span style={{ textAlign: 'right' }}>ACTION</span>
            </div>
            {dservers.length === 0 && <div style={{ padding: 20, fontFamily: MONO, fontSize: 11, color: C.muted }}>AUCUN SERVEUR</div>}
            {dservers.map((s, i) => (
              <div key={s.id} style={{ display: 'grid', gridTemplateColumns: '44px 2fr 1.1fr 1fr 1.4fr 90px', gap: 14, alignItems: 'center', padding: '12px 18px', borderBottom: i < dservers.length - 1 ? `1px solid ${C.line}` : 0 }}>
                <span style={{ height: 34, width: 34, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#5865F2', color: '#fff', fontFamily: DISP, fontSize: 16 }}>{(s.name.split('·').pop()?.trim()[0] || s.name[0] || 'D').toUpperCase()}</span>
                <span style={{ fontFamily: UI, fontSize: 14, fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.name}{s.featured ? <span style={{ marginLeft: 6, fontFamily: MONO, fontSize: 9, color: C.red }}>★ VEDETTE</span> : null}</span>
                <span style={{ fontFamily: MONO, fontSize: 11, color: C.ink2, textTransform: 'uppercase' }}>{s.tag || '—'}</span>
                <span style={{ fontFamily: MONO, fontSize: 12, color: C.ink2 }}>{s.members || '—'}</span>
                <a href={s.invite_url} target="_blank" rel="noopener noreferrer" style={{ fontFamily: MONO, fontSize: 11, color: '#5865F2', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.invite_url.replace('https://', '')}</a>
                <div style={{ textAlign: 'right' }}>
                  <button onClick={() => delDiscord(s)} disabled={busyId === s.id} style={{ padding: '7px 12px', border: `1.5px solid ${C.red}`, background: C.paper, color: C.red, fontFamily: UI, fontSize: 11, fontWeight: 800, letterSpacing: '.04em', textTransform: 'uppercase', cursor: busyId === s.id ? 'wait' : 'pointer', opacity: busyId === s.id ? 0.5 : 1 }}>Suppr.</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </>
    );

    const body = adminTab === 'users' ? usersBody
      : adminTab === 'merch' ? merchBody
      : adminTab === 'discord' ? discordBody
      : overviewBody;

    return wrap(<>
      {tabRow}
      {body}
    </>);
  };

  const screens: Record<Screen, () => React.ReactNode> = {
    home: renderHome, stats: renderStats, agents: renderAgents, players: renderPlayers,
    tournaments: renderTournaments, shop: renderShop, panier: renderPanier, discord: renderDiscord,
    profile: renderProfile, admin: renderAdmin,
  };

  /* ── shell ───────────────────────────────────────────────── */
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', width: '100%' }}>
      {/* TOAST */}
      {toast && (
        <div style={{ position: 'fixed', top: 16, left: '50%', transform: 'translateX(-50%)', zIndex: 50, display: 'flex', alignItems: 'center', gap: 10, padding: '10px 16px', background: C.ink, color: C.paper, border: `2px solid ${C.green}` }}>
          <span style={{ height: 8, width: 8, background: C.green }} />
          <span style={{ fontFamily: MONO, fontSize: 11, fontWeight: 700, letterSpacing: '.06em' }}>
            {toast.length > 28 ? toast.slice(0, 28) + '…' : toast} — AJOUTÉ AU PANIER
          </span>
        </div>
      )}

      {/* COMMAND RAIL */}
      <header style={{ flex: 'none', display: 'flex', alignItems: 'stretch', height: 66, borderBottom: `2px solid ${C.ink}`, background: C.paper }}>
        <button onClick={() => setScreen('home')} style={{ display: 'flex', alignItems: 'center', gap: 13, padding: '0 22px', border: 0, borderRight: `2px solid ${C.ink}`, background: 'transparent', cursor: 'pointer' }}>
          <span style={{ height: 42, width: 42, display: 'flex', alignItems: 'center', justifyContent: 'center', background: C.red, color: '#fff', fontFamily: DISP, fontSize: 22, letterSpacing: '.02em', clipPath: 'polygon(0 0,100% 0,100% 72%,82% 100%,0 100%)' }}>B3</span>
          <span style={{ textAlign: 'left', lineHeight: 1 }}>
            <span style={{ display: 'block', fontFamily: DISP, fontSize: 21, letterSpacing: '.01em' }}>ESPORT</span>
            <span style={{ display: 'block', marginTop: 3, fontFamily: MONO, fontSize: 8.5, letterSpacing: '.22em', color: C.muted }}>// VALORANT.HUB</span>
          </span>
        </button>

        <nav style={{ flex: 1, display: 'flex', alignItems: 'stretch', overflowX: 'auto', scrollbarWidth: 'none' }}>
          {nav.map((it, i) => {
            const active = it.id === screen;
            return (
              <button key={it.id} onClick={() => setScreen(it.id)} className="b3-nav"
                style={{ position: 'relative', display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 3, padding: '0 18px', border: 0, borderRight: `1px solid ${C.line}`, background: active ? C.paper2 : 'transparent', cursor: 'pointer', textAlign: 'left', flex: 'none' }}>
                {active && <span style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 4, background: C.red }} />}
                <span style={{ fontFamily: MONO, fontSize: 10, letterSpacing: '.1em', color: active ? C.red : C.muted }}>0{i + 1}</span>
                <span style={{ fontFamily: UI, fontSize: 13, fontWeight: 800, letterSpacing: '.03em', textTransform: 'uppercase', color: active ? C.ink : C.ink2 }}>{it.label}</span>
              </button>
            );
          })}
        </nav>

        <div style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '0 22px', borderLeft: `2px solid ${C.ink}` }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 7, fontFamily: MONO, fontSize: 10, fontWeight: 700, letterSpacing: '.12em' }}>
            <span style={{ height: 8, width: 8, background: C.red }} />LIVE · EUW
          </span>
          <button onClick={() => setScreen('panier')} className="b3-panier"
            style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: 8, padding: '9px 14px', border: `1.5px solid ${C.ink}`, background: screen === 'panier' ? C.red : C.ink, color: C.paper, fontFamily: MONO, fontSize: 11, fontWeight: 700, letterSpacing: '.08em', cursor: 'pointer' }}>
            PANIER [{cartCount}]
          </button>
          <button onClick={onLogout} title="Se déconnecter"
            style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '9px 14px', border: `1.5px solid ${C.ink}`, background: 'transparent', color: C.ink, fontFamily: MONO, fontSize: 11, fontWeight: 700, letterSpacing: '.08em', cursor: 'pointer' }}
            className="b3-btn-ondark">
            QUITTER
          </button>
        </div>
      </header>

      {/* STATUS STRIP */}
      <div style={{ flex: 'none', display: 'flex', alignItems: 'center', height: 30, overflow: 'hidden', borderBottom: `1px solid ${C.line}`, background: C.paper2, fontFamily: MONO, fontSize: 10.5, letterSpacing: '.14em', color: C.ink2, whiteSpace: 'nowrap' }}>
        <span style={{ display: 'inline-block', animation: 'mq 28s linear infinite' }}>
          {Array(2).fill(0).map((_, i) => (
            <React.Fragment key={i}>
              VCT CHAMPIONS — GRANDE FINALE EN COURS&nbsp;&nbsp;◆&nbsp;&nbsp;PATCH 8.11 LIVE&nbsp;&nbsp;◆&nbsp;&nbsp;6 JOUEURS EN RECHERCHE D'ÉQUIPE&nbsp;&nbsp;◆&nbsp;&nbsp;B3 WINTER CUP — INSCRIPTIONS OUVERTES&nbsp;&nbsp;◆&nbsp;&nbsp;NOUVEAU MERCH DISPONIBLE&nbsp;&nbsp;◆&nbsp;&nbsp;
            </React.Fragment>
          ))}
        </span>
      </div>

      {/* STAGE */}
      <div style={{ position: 'relative', flex: 1, minHeight: 0 }}>
        <div style={{ position: 'absolute', top: 0, bottom: 0, width: 4, background: C.red, left: scanX, opacity: scanOp, pointerEvents: 'none', zIndex: 20 }} />
        <main ref={scrollRef} style={{ position: 'absolute', inset: 0, overflowY: 'auto', padding: '34px 40px 56px' }}>
          {screens[screen]()}
        </main>
      </div>
    </div>
  );
};

export default B3App;
