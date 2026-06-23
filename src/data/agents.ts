// Static Valorant game knowledge used by the Agents tab: meta tier list,
// per-agent guides and matchup data. Kept here (pure data, no React) so the
// B3App component stays focused on UI and state.

// Full roster meta (tier / win-rate / pick-rate / K/D) so the Agents tab always
// lists every agent, not only the ones the logged-in player has played.
export type AgentMeta = { name: string; role: string; tier: string; win: number; pick: number; kd: number };
export const AGENT_META: AgentMeta[] = [
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
export const TIER_RANK: Record<string, number> = { 'S+': 0, S: 1, A: 2, B: 3, C: 4 };

// Live agent data (abilities/spells, portraits) from valorant-api.com — no key needed.
export interface VAbility { slot: string; displayName: string; description: string; displayIcon: string | null; }
export interface ValorantAgent {
  uuid: string; displayName: string; displayIcon: string;
  fullPortrait: string | null; background: string | null;
  backgroundGradientColors: string[]; description: string;
  role: { displayName: string; description?: string } | null;
  abilities: VAbility[];
}
export const SLOT_KEY: Record<string, string> = { Ability1: 'Q', Ability2: 'E', Grenade: 'C', Ultimate: 'X', Passive: '•' };
export const DIFFICULTY_LABEL = ['', 'Facile', 'Intermédiaire', 'Difficile'];

// Per-agent guide: difficulty, summary, tips, best maps (static game knowledge).
export interface AgentGuide { difficulty: 1 | 2 | 3; summary: string; tips: string[]; bestMaps: string[]; }
export const AGENT_GUIDE: Record<string, AgentGuide> = {
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
export const MATCHUP_DATA: Record<string, { weakTo: string[]; synergy: string[] }> = {
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
