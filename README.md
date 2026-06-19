# 🎮 B3 Esport — Plateforme Web Valorant

## 👥 Membres du projet

- **AMADOU Diop**
- **KAFFA Hamed**

<div align="center">

![React](https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react&logoColor=black)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?style=for-the-badge&logo=typescript&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-5-646CFF?style=for-the-badge&logo=vite&logoColor=white)
![Node.js](https://img.shields.io/badge/Node.js-20-339933?style=for-the-badge&logo=node.js&logoColor=white)
![MySQL](https://img.shields.io/badge/MySQL-8.0-4479A1?style=for-the-badge&logo=mysql&logoColor=white)
![TailwindCSS](https://img.shields.io/badge/Tailwind-4-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white)
![Docker](https://img.shields.io/badge/Docker-ready-2496ED?style=for-the-badge&logo=docker&logoColor=white)

**Application web moderne pour la communauté Valorant : statistiques, méta des agents, tournois, recherche de coéquipiers, boutique et administration.**

</div>

---

## 🎯 À propos

**B3 Esport** est une **application web** (SPA React + API Node + MySQL) dédiée à la communauté Valorant. Elle combine des données en temps réel (Riot Games, PandaScore, valorant-api.com) et des fonctionnalités communautaires : tier list des agents, fiches détaillées, recherche de joueurs (LFG), tournois, boutique connectée à la base de données et un **panneau d'administration** complet.

> ⚠️ Anciennement une app Electron desktop, le projet a été **refondu en application web**.

---

## ✨ Fonctionnalités

### 🔐 Authentification
- Inscription / connexion sécurisées (mots de passe hashés **bcrypt**)
- Sessions par token, contexte d'auth React
- Rôles **utilisateur / administrateur**

### 📊 Stats & méta Valorant
- **Mes stats** : connexion du compte Riot, RR, agents, historique (via l'API officielle Riot)
- **Agents & méta** : tier list des 25 agents (win/pick/ban rate, K/D, tri par colonne)
- **Fiche agent détaillée** (au clic) : portrait, compétences officielles **en français** (valorant-api.com), guide « comment le jouer », meilleures maps, counters & synergies
- **Leaderboard pro** : top joueurs via **PandaScore**

### 👥 Communauté (LFG)
- Page **Joueurs** dynamique : affiche les vrais membres ayant activé le mode LFG
- Filtres rang / rôle / région / statut, liens Discord / Twitter / Twitch
- Annuaire de serveurs Discord Valorant

### 🏆 Tournois
- Tournois live (PandaScore), brackets, équipes
- Création de tournois (format, dates, région, prize pool)

### 🛒 Boutique
- Catalogue **servi depuis la base de données**
- Panier, codes promo, paiement (Carte / PayPal / Crypto)
- Commande persistée en base + **décrément automatique du stock**

### 🛡️ Administration (`admin`)
- **Vue d'ensemble** : revenu, commandes, membres, stock, graphe d'inscriptions
- **Utilisateurs** : édition, promotion admin, suppression
- **Produits** : création / édition / suppression (CRUD)
- **Commandes** : changement de statut, détail des articles

### 👤 Profil
- Réseaux sociaux (Discord, Twitter/X, Twitch, YouTube)
- Profil gaming (rang, rôles, région, langues, disponibilités)
- Bascule LFG, photo de profil, connexion Riot

### 📝 Patch Notes
- Historique des versions du site

---

## 🛠 Stack technique

| Couche | Technologies |
|--------|-------------|
| **Frontend** | React 19, TypeScript, Vite 5, TailwindCSS 4, Framer Motion |
| **Backend** | Node.js (serveur HTTP natif, sans framework), `mysql2`, `bcryptjs`, `dotenv` |
| **Base de données** | MySQL 8 |
| **APIs externes** | Riot Games (proxy serveur), PandaScore (esports), valorant-api.com (agents) |
| **Infra** | Docker / Docker Compose |

**Polices** : Outfit (corps), Rajdhani (titres), JetBrains Mono (chiffres).
**Thème « Cobalt »** : fond bleu nuit, accents bleu électrique, texte blanc.

---

## 📦 Prérequis

**Option Docker (recommandée)** : Docker Desktop + Git uniquement.
**Option manuelle** : Node.js ≥ 18 (20 conseillé), npm ≥ 9, MySQL ≥ 8, Git.

---

## 🚀 Lancement avec Docker (recommandé)

Aucune install de Node ni MySQL nécessaire — tout est conteneurisé.

```bash
git clone git@github.com:amadoudiop04/fil-rouge-B3-dev.git
cd fil-rouge-B3-dev
cp .env.example .env        # puis remplir RIOT_API_KEY et VITE_PANDASCORE_TOKEN
docker compose up --build
```

Ouvrir **http://localhost:5173** → c'est prêt.

`docker compose` démarre 3 services :
- **mysql** — MySQL 8, base `b3_esport`
- **api** — API Node sur `:3001` (crée les tables, le compte admin et les produits au démarrage)
- **web** — front Vite sur `:5173`

Commandes utiles :
```bash
docker compose down        # arrêter
docker compose down -v      # arrêter + remise à zéro de la base
docker compose logs -f api  # logs de l'API
```

> 💡 Si le port **3306** est déjà utilisé, modifie `"3306:3306"` → `"3307:3306"` dans `docker-compose.yml`.

---

## 💻 Lancement manuel (sans Docker)

```bash
git clone git@github.com:amadoudiop04/fil-rouge-B3-dev.git
cd fil-rouge-B3-dev
npm install

# créer une base vide (les tables sont créées automatiquement par l'API) :
mysql -u root -p -e "CREATE DATABASE IF NOT EXISTS b3_esport;"

cp .env.example .env        # remplir DB_* + RIOT_API_KEY + VITE_PANDASCORE_TOKEN
```

Puis dans **2 terminaux** :

```bash
npm run api    # terminal 1 → API sur :3001 (init DB + seed admin/produits)
npm run dev    # terminal 2 → front sur :5173
```

Ouvrir **http://localhost:5173**.

> Accède bien à `localhost:5173` (et pas `127.0.0.1`) : le CORS de l'API n'autorise que cette origine.

---

## ⚙️ Configuration (`.env`)

Copie `.env.example` en `.env`. **Le `.env` n'est jamais commité** (il est ignoré par git).

```env
API_PORT=3001

DB_HOST=localhost
DB_PORT=3306
DB_NAME=b3_esport
DB_USER=root
DB_PASSWORD=

# Clé Riot (gratuite, valide 24h) — https://developer.riotgames.com
RIOT_API_KEY=RGAPI-xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
RIOT_REGION=eu

# Token PandaScore (esports temps réel) — https://pandascore.co
VITE_PANDASCORE_TOKEN=ton_token_pandascore_ici
```

> 🔑 La clé Riot dev expire toutes les **24h** : régénère-la sur developer.riotgames.com puis relance `npm run api`.

---

## 🔐 Compte administrateur

Créé automatiquement au premier démarrage de l'API :

| Email | Mot de passe |
|-------|--------------|
| `admin@b3esport.gg` | `Admin2026!` |

Donne accès au **Panneau admin** (section « Administration » de la barre latérale).

---

## 🧾 Codes promo (page Panier)

| Code | Réduction |
|------|-----------|
| `BIENVENUE` | -15 % |
| `VIP20` | -20 % |
| `ESPORT10` | -10 % |
| `PROMO5` | -5 % |

---

## 🗄️ Base de données

La base est **initialisée automatiquement** par `initDb()` dans `server/local-api.mjs` au démarrage de l'API : création des tables manquantes (`CREATE TABLE IF NOT EXISTS`), ajout des colonnes, seed du compte admin et de quelques produits. **Une base vide suffit.**

Tables principales :

| Table | Rôle |
|-------|------|
| `users` | Comptes (auth, profil, réseaux sociaux, LFG, `is_admin`) |
| `products` | Catalogue boutique |
| `orders` / `order_items` | Commandes et lignes de commande |

Sécurité :
- ✅ Mots de passe hashés (bcrypt, 10 rounds)
- ✅ Requêtes SQL **préparées** (anti-injection)
- ✅ Endpoints `/admin/*` protégés par rôle (`is_admin`)
- ✅ Validation des entrées, protection du dernier admin

---

## 🌐 Aperçu de l'API (port 3001)

| Méthode | Route | Description |
|---------|-------|-------------|
| POST | `/auth/register` · `/auth/login` · `/auth/logout` | Authentification |
| GET | `/auth/me` | Session courante |
| PUT | `/users/:id/profile` · `/users/:id/password` | Mise à jour profil / mot de passe |
| GET | `/users/lfg` | Joueurs en recherche d'équipe |
| GET | `/products` | Catalogue (public) |
| POST | `/orders` | Créer une commande |
| GET | `/riot/player/:name/:tag` · `/riot/matches/:name/:tag` | Proxy Riot Games |
| GET | `/admin/overview` · `/admin/users` · `/admin/orders` | Données admin |
| POST/PUT/DELETE | `/admin/products`, `/admin/users/:id`, `/admin/orders/:id` | Gestion admin |

---

## 📁 Structure du projet

```
fil-rouge-B3-dev/
├── server/
│   └── local-api.mjs          # API HTTP Node (auth, profil, shop, riot, admin) + initDb
├── src/
│   ├── components/            # Sidebar, TopBar, Avatar…
│   ├── contexts/
│   │   └── AuthContext.tsx    # Auth + session
│   ├── services/
│   │   ├── platformApi.ts     # Client API (auth, shop, admin…)
│   │   └── tournamentApi.ts   # PandaScore (tournois Valorant)
│   ├── pages/                # HomePage, statsPage, ValorantStatsPage,
│   │   │                      # PlayersPage, TournamentPage, CreateTournamentPage,
│   │   │                      # Shop, PanierPage, PaymentPage, ProfilePage,
│   │   │                      # SettingsPage, PatchNotesPage, AdminPage…
│   ├── middleware/AuthPage.tsx
│   ├── App.tsx               # Layout (sidebar + topbar) + routage par état
│   ├── main.tsx              # Point d'entrée React
│   └── index.css             # Design system « Cobalt » (tokens, utilitaires)
├── Dockerfile                # Image Node (API + front)
├── docker-compose.yml        # MySQL + API + front
├── .dockerignore
├── .env.example              # Modèle de configuration (sans secrets)
├── vite.config.mjs
├── tsconfig.json
└── package.json
```

---

## 📜 Scripts npm

```bash
npm run api      # démarre l'API Node (port 3001)
npm run dev      # démarre le front Vite (port 5173)
npm run build    # build de production du front
npm run preview  # sert le build de production
npm run lint     # ESLint
```

---

## 🤖 Utilisation de l'IA dans le projet

L'IA a été utilisée comme assistant de développement : refonte de l'architecture (passage Electron → web), mise en place de l'API Node + MySQL, refonte du design « Cobalt », construction du panneau d'administration, conteneurisation Docker, et rédaction de cette documentation.

---

## 🔒 Sécurité & secrets

- `.env`, `dist/` et les artefacts de build sont **ignorés par git** (`.gitignore`).
- Ne jamais committer de vraies clés. Utiliser `.env.example` comme modèle.
- En cas de fuite d'un token/clé, **le régénérer** auprès du fournisseur (un secret poussé est compromis définitivement).
