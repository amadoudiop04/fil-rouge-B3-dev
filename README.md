# 🎮 B3 Desktop - Plateforme E-Sport
![alt text](image.png)
## 👥 Membres du Projet

- **AMADOU Diop**
- **AKTAS Semih**
- **HAMED KAFFA**

<div align="center">

![Electron](https://img.shields.io/badge/Electron-40.4.1-47848F?style=for-the-badge&logo=electron&logoColor=white)
![React](https://img.shields.io/badge/React-19.2.14-61DAFB?style=for-the-badge&logo=react&logoColor=black)
![TypeScript](https://img.shields.io/badge/TypeScript-4.5.4-3178C6?style=for-the-badge&logo=typescript&logoColor=white)
![MySQL](https://img.shields.io/badge/MySQL-8.0-4479A1?style=for-the-badge&logo=mysql&logoColor=white)
![TailwindCSS](https://img.shields.io/badge/Tailwind-4.1.18-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white)

**Application desktop moderne pour la gestion de compétitions e-sport, statistiques de joueurs et boutique en ligne**

[Fonctionnalités](#-fonctionnalités) •
[Installation](#-installation) •
[Configuration](#️-configuration) •
[Utilisation](#-utilisation) •

</div>

## 🎯 À propos

**B3 Desktop** est une application desktop cross-platform développée avec Electron et React, dédiée à la communauté e-sport. Elle offre une expérience complète pour les joueurs, permettant de suivre leurs statistiques, participer à des tournois, acheter des produits et gérer leur profil.

### Pourquoi ce projet ?

- 🏆 **Gestion de tournois** : Suivez les compétitions en temps réel
- 📊 **Statistiques détaillées** : Analysez vos performances de jeu
- 🛒 **Boutique intégrée** : Achetez des produits e-sport directement
- 👤 **Profil personnalisé** : Gérez votre identité de joueur
- 🔒 **Sécurisé** : Authentification robuste avec bcrypt

---

## ✨ Fonctionnalités

### 🔐 Authentification
- Inscription et connexion sécurisées
- Hashage des mots de passe avec bcrypt
- Gestion de session utilisateur
- Mise à jour du profil (username, email, Riot ID)

### 📊 Statistiques de joueur
- Suivi des matchs joués
- Ratio K/D (Kills/Deaths)
- Winrate et classement
- Statistiques par agent Valorant
- Historique détaillé des parties
![alt text](image.png)
![alt text](stats.png)

### 🏆 Tournois
- Liste des tournois (à venir, en cours, terminés)
- Résultats des matchs en temps réel
- Simulation d'inscription aux tournois
- Visualisation des brackets
- Streaming de matchs intégré
![alt text](Tournois.png)


### 🛒 Boutique E-Sport
- Catalogue de produits (maillots, sweats, accessoires)
- Panier d'achat avec gestion des quantités
- Système de codes promo (-5% à -20%)
- Gestion du stock en temps réel
- Historique des commandes
![alt text](Shop.png)

### 💳 Système de paiement
- Multiple moyens de paiement (Carte, PayPal, Crypto)
- Création de commandes avec transactions SQL
- Mise à jour automatique du stock
- Confirmation de commande
![alt text](checkout.png)

### 👤 Profil utilisateur
- Informations personnelles
- Statistiques globales
- Gestion du compte
- Modification du mot de passe
![alt text](profil.png)

---

## 🛠 Technologies

### Frontend
- **Electron** 40.4.1 - Framework desktop cross-platform
- **React** 19.2.14 - Bibliothèque UI
- **TypeScript** 4.5.4 - Typage statique
- **TailwindCSS** 4.1.18 - Framework CSS utility-first
- **Framer Motion** - Animations fluides

### Backend
- **MySQL** 8.0 - Base de données relationnelle
- **mysql2** - Driver MySQL pour Node.js
- **bcryptjs** - Hashage de mots de passe
- **dotenv** - Gestion des variables d'environnement

### Build & Dev Tools
- **Vite** 5.4.21 - Build tool moderne
- **Electron Forge** 7.11.1 - Packaging et distribution
- **ESLint** - Linting du code
- **PostCSS** - Traitement CSS


Dans le cadre de ce projet, nous avons intégré l'IA dans notre flux de travail comme un véritable assistant de développement pour gagner en efficacité et résoudre des défis techniques :

- **Débogage et refonte de l'architecture base de données** : Face à des bugs complexes empêchant la connexion de notre base de données initiale avec Electron, l'IA nous a aidés à diagnostiquer le problème et à pivoter efficacement vers la création d'une architecture SQL (MySQL) plus robuste et adaptée à notre environnement.
- **Génération de jeux de données (Mock Data)** : Pour tester l'application en conditions réelles de manière pertinente, nous avons utilisé l'IA afin de générer des entrées SQL cohérentes (comptes utilisateurs avec de vrais pseudos e-sport, statistiques de joueurs, produits de la boutique, et historique de matchs).
- **Documentation** : L'IA a également été mise à contribution pour structurer, formater et mettre au propre ce fichier README, afin d'offrir une documentation claire, esthétique et professionnelle.
---

## 📦 Prérequis

Avant de commencer, assurez-vous d'avoir installé :

- **Node.js** >= 18.0.0
- **npm** >= 9.0.0
- **MySQL** >= 8.0
- **Git**

Vérifiez vos versions :

```bash
node --version
npm --version
mysql --version
```

---

## 🚀 Installation

### 1. Cloner le repository

```bash
git clone https://github.com/amadoudiop04/B3-desktop-projet-electron.git
cd B3-desktop-projet-electron
```

### 2. Installer les dépendances

```bash
npm install
```

### 3. Créer le fichier de configuration

Créez un fichier `.env` à la racine du projet :

```bash
# Windows
New-Item .env

# Linux/Mac
touch .env
```

### 4. Configurer les variables d'environnement

Modifiez le fichier `.env` avec vos informations MySQL :

```env
DB_HOST=localhost
DB_PORT=3306
DB_NAME=desktop_projet
DB_USER=root
DB_PASSWORD=votre_mot_de_passe
```

---

## ⚙️ Configuration

### Base de données MySQL

#### 1. Importer le dump SQL complet

Téléchargez le fichier SQL complet ou copiez le script ci-dessous et exécutez-le dans phpMyAdmin ou MySQL Workbench :

```sql
-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Hôte : 127.0.0.1
-- Généré le : dim. 08 mars 2026 à 15:47
-- Version du serveur : 10.4.32-MariaDB
-- Version de PHP : 8.2.12

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Base de données : `desktop_projet`
--

CREATE DATABASE IF NOT EXISTS `desktop_projet` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci;
USE `desktop_projet`;

-- --------------------------------------------------------

--
-- Structure de la table `users`
--

CREATE TABLE `users` (
  `id` int(11) NOT NULL,
  `username` varchar(50) NOT NULL,
  `email` varchar(100) NOT NULL,
  `password_hash` varchar(255) NOT NULL,
  `riot_id` varchar(50) DEFAULT NULL,
  `tag_line` varchar(10) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Déchargement des données de la table `users`
--

INSERT INTO `users` (`id`, `username`, `email`, `password_hash`, `riot_id`, `tag_line`, `created_at`) VALUES
(1, 'test1', 'test@test.com', '$2b$10$3QCqPWMqZWlJe4MxlwphYO7EgS0fK3UGBs8gxDMy6/jx492IzLzwG', NULL, NULL, '2026-03-06 00:56:42'),
(2, 'TenZ_Pro', 'tenz@valorant.com', '$2b$10$YourHashedPasswordHere1234567890123456', NULL, NULL, '2026-03-08 13:45:21'),
(3, 'Shroud_Gaming', 'shroud@gaming.com', '$2b$10$YourHashedPasswordHere1234567890123456', NULL, NULL, '2026-03-08 13:45:21'),
(4, 'Faker_Legend', 'faker@league.com', '$2b$10$YourHashedPasswordHere1234567890123456', NULL, NULL, '2026-03-08 13:45:21'),
(5, 'Ninja_Warrior', 'ninja@twitch.com', '$2b$10$YourHashedPasswordHere1234567890123456', NULL, NULL, '2026-03-08 13:45:21'),
(6, 's1mple_CSGO', 's1mple@navi.com', '$2b$10$YourHashedPasswordHere1234567890123456', NULL, NULL, '2026-03-08 13:45:21');

-- --------------------------------------------------------

--
-- Structure de la table `user_stats`
--

CREATE TABLE `user_stats` (
  `user_id` int(11) NOT NULL,
  `rank_name` varchar(20) DEFAULT 'Radiant',
  `rank_rating` int(11) DEFAULT 0,
  `win_rate` decimal(5,2) DEFAULT NULL,
  `kd_ratio` decimal(3,2) DEFAULT NULL,
  `avg_damage` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Déchargement des données de la table `user_stats`
--

INSERT INTO `user_stats` (`user_id`, `rank_name`, `rank_rating`, `win_rate`, `kd_ratio`, `avg_damage`) VALUES
(1, 'RADIANT', 800, 62.00, 1.55, 170);

-- --------------------------------------------------------

--
-- Structure de la table `products`
--

CREATE TABLE `products` (
  `id` int(11) NOT NULL,
  `name` varchar(100) DEFAULT NULL,
  `price` decimal(10,2) DEFAULT NULL,
  `category` varchar(50) DEFAULT NULL,
  `image_url` varchar(255) DEFAULT NULL,
  `stock_quantity` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Déchargement des données de la table `products`
--

INSERT INTO `products` (`id`, `name`, `price`, `category`, `image_url`, `stock_quantity`) VALUES
(1, 'Pro Kit Edition 04', 64.99, 'maillot', 'https://lemaillotesport.com/wp-content/uploads/maillot-team-esport-personnalise-ssoj-avant-min.jpg', 25),
(2, 'Casquette Streath', 29.99, 'accessoire', 'https://www.genicado.com/177796-medium_default/casquette-sport-personnalisee-.jpg', 40),
(3, 'EA SPORTS Team Jersey 2024', 85.00, 'MAILLOTS', 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=500', 25),
(4, 'Valorant Champions Jersey', 79.99, 'MAILLOTS', 'https://images.unsplash.com/photo-1589802829985-817e51171b92?w=500', 15),
(5, 'League of Legends Pro Jersey', 89.00, 'MAILLOTS', 'https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?w=500', 30),
(6, 'CS:GO Elite Team Jersey', 75.00, 'MAILLOTS', 'https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=500', 20),
(7, 'Core Iconic Hoodie Black', 55.00, 'SWEATS', 'https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=500', 40),
(8, 'Gaming Legends Hoodie Blue', 62.00, 'SWEATS', 'https://images.unsplash.com/photo-1509942774463-acf339cf87d5?w=500', 35),
(9, 'Pro Player Zip Hoodie', 68.00, 'SWEATS', 'https://images.unsplash.com/photo-1620799140408-edc6dcb6d633?w=500', 22),
(10, 'Pro Series Adjustable Cap', 32.00, 'ACCESSOIRES', 'https://images.unsplash.com/photo-1588850561407-ed78c282e89b?w=500', 50),
(11, 'XL Performance Mousepad RGB', 45.00, 'ACCESSOIRES', 'https://images.unsplash.com/photo-1625225233840-695456021cde?w=500', 60),
(12, 'Gaming Backpack Premium', 89.99, 'ACCESSOIRES', 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=500', 18),
(13, 'Esport Water Bottle Steel', 24.99, 'ACCESSOIRES', 'https://images.unsplash.com/photo-1602143407151-7111542de6e8?w=500', 75),
(14, 'Gaming Keychain LED', 12.50, 'ACCESSOIRES', 'https://images.unsplash.com/photo-1611312449408-fcece27cdbb7?w=500', 100);

-- --------------------------------------------------------

--
-- Structure de la table `orders`
--

CREATE TABLE `orders` (
  `id` int(11) NOT NULL,
  `user_id` int(11) DEFAULT NULL,
  `total_ttc` decimal(10,2) DEFAULT NULL,
  `payment_method` enum('Card','PayPal','Crypto') DEFAULT NULL,
  `status` enum('Pending','Paid','Shipped') DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Structure de la table `order_items`
--

CREATE TABLE `order_items` (
  `id` int(11) NOT NULL,
  `order_id` int(11) DEFAULT NULL,
  `product_id` int(11) DEFAULT NULL,
  `quantity` int(11) DEFAULT NULL,
  `price_at_purchase` decimal(10,2) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Structure de la table `match_history`
--

CREATE TABLE `match_history` (
  `id` int(11) NOT NULL,
  `user_id` int(11) DEFAULT NULL,
  `map_name` varchar(50) DEFAULT NULL,
  `score_home` int(11) DEFAULT NULL,
  `score_away` int(11) DEFAULT NULL,
  `result` enum('W','L') DEFAULT NULL,
  `agent_played` varchar(30) DEFAULT NULL,
  `kills` int(11) DEFAULT NULL,
  `deaths` int(11) DEFAULT NULL,
  `assists` int(11) DEFAULT NULL,
  `played_at` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Déchargement des données de la table `match_history`
--

INSERT INTO `match_history` (`id`, `user_id`, `map_name`, `score_home`, `score_away`, `result`, `agent_played`, `kills`, `deaths`, `assists`, `played_at`) VALUES
(42, 1, 'Haven', 13, 11, 'W', 'Jett', 28, 15, 4, '2026-03-08 14:15:42'),
(43, 2, 'Bind', 10, 13, 'L', 'Phoenix', 18, 21, 7, '2026-03-08 13:15:42'),
(44, 3, 'Ascent', 13, 9, 'W', 'Sage', 22, 14, 12, '2026-03-08 12:15:42'),
(45, 4, 'Split', 13, 7, 'W', 'Reyna', 28, 12, 4, '2026-03-08 11:15:42'),
(46, 5, 'Icebox', 11, 13, 'L', 'Omen', 19, 20, 8, '2026-03-08 10:15:42'),
(47, 6, 'Breeze', 13, 10, 'L', 'Viper', 24, 17, 9, '2026-03-08 09:15:42');

--
-- Index pour les tables déchargées
--

--
-- Index pour la table `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `email` (`email`);

--
-- Index pour la table `user_stats`
--
ALTER TABLE `user_stats`
  ADD PRIMARY KEY (`user_id`);

--
-- Index pour la table `products`
--
ALTER TABLE `products`
  ADD PRIMARY KEY (`id`);

--
-- Index pour la table `orders`
--
ALTER TABLE `orders`
  ADD PRIMARY KEY (`id`),
  ADD KEY `user_id` (`user_id`);

--
-- Index pour la table `order_items`
--
ALTER TABLE `order_items`
  ADD PRIMARY KEY (`id`),
  ADD KEY `order_id` (`order_id`),
  ADD KEY `product_id` (`product_id`);

--
-- Index pour la table `match_history`
--
ALTER TABLE `match_history`
  ADD PRIMARY KEY (`id`),
  ADD KEY `user_id` (`user_id`);

--
-- AUTO_INCREMENT pour les tables déchargées
--

ALTER TABLE `users`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;

ALTER TABLE `products`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=15;

ALTER TABLE `orders`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

ALTER TABLE `order_items`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

ALTER TABLE `match_history`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=50;

--
-- Contraintes pour les tables déchargées
--

ALTER TABLE `user_stats`
  ADD CONSTRAINT `user_stats_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`);

ALTER TABLE `orders`
  ADD CONSTRAINT `orders_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`);

ALTER TABLE `order_items`
  ADD CONSTRAINT `order_items_ibfk_1` FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`),
  ADD CONSTRAINT `order_items_ibfk_2` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`);

ALTER TABLE `match_history`
  ADD CONSTRAINT `match_history_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`);

COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
```

#### 2. Données incluses

Le dump SQL contient déjà :
- **6 utilisateurs de test** (test1, TenZ_Pro, Shroud_Gaming, Faker_Legend, Ninja_Warrior, s1mple_CSGO)
- **14 produits** répartis dans les catégories (Maillots, Sweats, Accessoires)
- **6 matchs** avec statistiques complètes (K/D/A, cartes Valorant, résultats)
- **Statistiques utilisateur** pour test1 (Rank RADIANT, 62% winrate, 1.55 K/D)

#### 3. Comptes de test disponibles

| Username | Email | Mot de passe (bcrypt) |
|----------|-------|----------------------|
| test1 | test@test.com | `test123456` (déjà hashé) |
| TenZ_Pro | tenz@valorant.com | Hash fictif (à modifier) |
| Shroud_Gaming | shroud@gaming.com | Hash fictif (à modifier) |
| Faker_Legend | faker@league.com | Hash fictif (à modifier) |
| Ninja_Warrior | ninja@twitch.com | Hash fictif (à modifier) |
| s1mple_CSGO | s1mple@navi.com | Hash fictif (à modifier) |

**Note:** Pour vous connecter, utilisez le compte `test1` avec n'importe quel mot de passe (le hash est déjà configuré).
```

## 💻 Utilisation

### Démarrer l'application en mode développement

```bash
npm start
```

L'application se lancera automatiquement avec :
- Hot reload activé
- DevTools ouverts
- Connexion à la base de données

### Commandes disponibles

```bash
# Démarrer en mode développement
npm start

# Linter le code
npm run lint

# Packager l'application
npm run package

# Créer un installateur
npm run make

# Publier l'application
npm run publish
```

### Navigation dans l'application

1. **Page d'accueil** 🏠
   - Vue d'ensemble des fonctionnalités
   - Accès rapide aux sections

2. **Statistiques** 📊
   - Consultez vos stats de jeu
   - Classement global

3. **Tournois** 🏆
   - Matchs récents
   - Inscription aux compétitions

4. **Boutique** 🛒
   - Parcourez les produits
   - Ajoutez au panier

5. **Panier** 🛍️
   - Gérez vos articles
   - Appliquez des codes promo

6. **Profil** 👤
   - Modifiez vos informations
   - Changez votre mot de passe

### 🧪 Tester le code promo

Le champ `CODE PROMO` est disponible dans la page `Panier`.

Codes actuellement reconnus :
- `ESPORT10` (-10%)
- `BIENVENUE` (-15%)
- `VIP20` (-20%)
- `PROMO5` (-5%)
---

## 📁 Structure du projet

```
B3-desktop-projet-electron/
├── src/
│   ├── components/          # Composants React réutilisables
│   │   ├── Avatar.tsx
│   │   ├── CompetitionCard.tsx
│   │   ├── Footer.tsx
│   │   ├── Header.tsx
│   │   ├── Navigation.tsx
│   │   └── ...
│   │
│   ├── contexts/            # Contextes React
│   │   └── AuthContext.tsx  # Gestion de l'authentification
│   │
│   ├── database/            # Services de base de données
│   │   ├── connection.ts    # Pool MySQL
│   │   ├── userService.ts   # CRUD utilisateurs
│   │   ├── statsService.ts  # Stats de joueurs
│   │   ├── productService.ts # Produits
│   │   ├── orderService.ts  # Commandes
│   │   └── matchService.ts  # Matchs
│   │
│   ├── middleware/          # Middleware et guards
│   │   └── AuthPage.tsx     # Protection des routes
│   │
│   ├── pages/               # Pages de l'application
│   │   ├── HomePage.tsx
│   │   ├── LoginForm.tsx
│   │   ├── RegisterForm.tsx
│   │   ├── ProfilePage.tsx
│   │   ├── statsPage.tsx
│   │   ├── TournamentPage.tsx
│   │   ├── Shop.tsx
│   │   ├── PanierPage.tsx
│   │   └── PaymentPage.tsx
│   │
│   ├── types/               # Définitions TypeScript
│   │   └── electron.d.ts    # Types pour l'API Electron
│   │
│   ├── App.tsx              # Composant principal
│   ├── main.ts              # Process principal Electron
│   ├── preload.ts           # Script de préchargement
│   └── index.css            # Styles globaux
│
├── forge.config.ts          # Configuration Electron Forge
├── vite.main.config.ts      # Config Vite (main process)
├── vite.renderer.config.mjs # Config Vite (renderer)
├── tsconfig.json            # Configuration TypeScript
├── tailwind.config.js       # Configuration Tailwind
├── .env                     # Variables d'environnement
├── package.json             # Dépendances npm
└── README.md                # Documentation

```

---

## 🗄️ Base de données

### Schéma de la base de données
    users {
        int id PK
        string username
        string email
        string password
        string riot_id
        string tag_line
        timestamp created_at
    }

    user_stats {
        int id PK
        int user_id FK
        string rank_name
        int rank_rating
        decimal win_rate
        decimal kd_ratio
        decimal avg_damage
    }

    orders {
        int id PK
        int user_id FK
        decimal total_ttc
        enum payment_method
        enum status
        timestamp created_at
    }

    order_items {
        int id PK
        int order_id FK
        int product_id FK
        int quantity
        decimal price_at_purchase
    }

    products {
        int id PK
        string name
        decimal price
        string category
        text image_url
        int stock_quantity
    }

    match_history {
        int id PK
        int user_id FK
        string map_name
        int score_home
        int score_away
        enum result
        string agent_played
        int kills
        int deaths
        int assists
        timestamp played_at
    }
```

### Relations

- Un **utilisateur** peut avoir plusieurs **statistiques**, **commandes** et **matchs**
- Une **commande** contient plusieurs **articles**
- Un **produit** peut être dans plusieurs **commandes**

### Sécurité

- ✅ Hashage des mots de passe (bcrypt, 10 rounds)
- ✅ Context isolation activée
- ✅ Node integration désactivée
- ✅ Requêtes SQL préparées (protection SQL injection)
- ✅ Validation des entrées utilisateur

---

## 🎨 Design System

### Palette de couleurs

- **Primaire** : `#3B82F6` (Bleu)
- **Secondaire** : `#8B5CF6` (Violet)
- **Succès** : `#10B981` (Vert)
- **Erreur** : `#EF4444` (Rouge)
- **Background** : `#0a1628` (Bleu foncé)
- **Surface** : `#111e31` (Gris bleuté)

### Composants

- Cartes avec hover effects
- Animations Framer Motion
- Gradients modernes
- Responsive design

---

### Version 2.0 (Planifié)
- [ ] Intégration API Riot Games
- [ ] Streaming Twitch intégré
- [ ] Système de classement ELO
- [ ] Matchmaking automatique
