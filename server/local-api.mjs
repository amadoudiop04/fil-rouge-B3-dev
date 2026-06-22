import dotenv from 'dotenv';
import crypto from 'crypto';
import express from 'express';
import cors from 'cors';
import mysql from 'mysql2/promise';
import bcrypt from 'bcryptjs';
import { WebSocketServer } from 'ws';

dotenv.config();

const API_PORT = Number(process.env.API_PORT || 3001);
const SALT_ROUNDS = 10;
const TEAM_MAX_MEMBERS = 5; // a Valorant roster — no team may exceed this
// Front-end origin allowed to call this API (browser CORS). Override via env if needed.
const CORS_ORIGIN = process.env.CORS_ORIGIN || 'http://localhost:5173';

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT || 3306),
  database: process.env.DB_NAME || '',
  user: process.env.DB_USER || '',
  password: process.env.DB_PASSWORD || '',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

// ── Realtime (WebSocket) registry ───────────────────────────
// userId -> Set<ws>. Populated on connection, used to push live updates.
const wsClients = new Map();
const wsSendToUser = (userId, payload) => {
  const set = wsClients.get(Number(userId));
  if (!set) return;
  const msg = JSON.stringify(payload);
  for (const ws of set) { try { if (ws.readyState === 1) ws.send(msg); } catch { /* ignore */ } }
};
const wsBroadcast = (payload) => {
  const msg = JSON.stringify(payload);
  for (const set of wsClients.values()) {
    for (const ws of set) { try { if (ws.readyState === 1) ws.send(msg); } catch { /* ignore */ } }
  }
};


// ── vlr.gg (esports) proxy — real Valorant data, no token, short cache ──
// Uses the community "vlresports" wrapper around vlr.gg. Proxied server-side so
// the browser avoids CORS and we can cache responses to be polite to the source.
const VLR_BASE = process.env.VLR_API_BASE || 'https://vlr.orlandomm.net/api/v1';
const ESPORTS_TTL = 30_000; // 30s — near real-time without hammering vlr.gg
const esportsCache = new Map();

const fetchVlr = async (path) => {
  const hit = esportsCache.get(path);
  if (hit && Date.now() - hit.at < ESPORTS_TTL) return hit.data;
  const apiRes = await fetch(`${VLR_BASE}${path}`, {
    headers: { 'User-Agent': 'b3-esport/1.0 (+local-api)' },
  });
  if (!apiRes.ok) throw new Error(`vlr.gg ${apiRes.status}: ${path}`);
  const json = await apiRes.json();
  const data = Array.isArray(json?.data) ? json.data : [];
  esportsCache.set(path, { at: Date.now(), data });
  return data;
};

const parseJsonCol = (val) => {
  if (!val) return [];
  if (Array.isArray(val)) return val;
  try { return JSON.parse(val); } catch { return []; }
};

const sanitizeUser = (row) => ({
  id: row.id,
  username: row.username,
  email: row.email,
  riot_id: row.riot_id,
  tag_line: row.tag_line,
  created_at: row.created_at,
  bio: row.bio || null,
  discord: row.discord || null,
  twitter: row.twitter || null,
  twitch: row.twitch || null,
  youtube: row.youtube || null,
  rank_label: row.rank_label || null,
  roles: parseJsonCol(row.roles),
  region: row.region || null,
  languages: parseJsonCol(row.languages),
  playtimes: parseJsonCol(row.playtimes),
  show_in_lfg: row.show_in_lfg ? 1 : 0,
  lfg_status: row.lfg_status || 'lfg',
  is_admin: row.is_admin ? 1 : 0,
  banned: row.banned ? 1 : 0,
  avatar_url: row.avatar_url || null,
});

const USER_COLS = 'id, username, email, riot_id, tag_line, created_at, bio, discord, twitter, twitch, youtube, rank_label, roles, region, languages, playtimes, show_in_lfg, lfg_status, is_admin, banned, avatar_url';

const getUserByEmail = async (email) => {
  const [rows] = await pool.execute(
    `SELECT ${USER_COLS}, password_hash FROM users WHERE email = ?`,
    [email]
  );
  return rows.length > 0 ? rows[0] : null;
};

const getUserById = async (id) => {
  const [rows] = await pool.execute(
    `SELECT ${USER_COLS} FROM users WHERE id = ?`,
    [id]
  );
  return rows.length > 0 ? rows[0] : null;
};

const ADMIN_EMAIL = 'admin@b3esport.gg';
const ADMIN_PASSWORD = 'Admin2026!';

const initDb = async () => {
  // 1. Make sure the users table exists (fresh DB safety net)
  await pool.execute(`
    CREATE TABLE IF NOT EXISTS users (
      id INT(11) NOT NULL AUTO_INCREMENT PRIMARY KEY,
      username VARCHAR(50) NOT NULL,
      email VARCHAR(100) NOT NULL UNIQUE,
      password_hash VARCHAR(255) NOT NULL,
      riot_id VARCHAR(50) DEFAULT NULL,
      tag_line VARCHAR(10) DEFAULT NULL,
      created_at TIMESTAMP NOT NULL DEFAULT current_timestamp()
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci
  `);

  // 2. Add personalization + admin columns (ignored if they already exist)
  const cols = [
    "ALTER TABLE users ADD COLUMN bio TEXT DEFAULT NULL",
    "ALTER TABLE users ADD COLUMN discord VARCHAR(100) DEFAULT NULL",
    "ALTER TABLE users ADD COLUMN twitter VARCHAR(100) DEFAULT NULL",
    "ALTER TABLE users ADD COLUMN twitch VARCHAR(100) DEFAULT NULL",
    "ALTER TABLE users ADD COLUMN youtube VARCHAR(100) DEFAULT NULL",
    "ALTER TABLE users ADD COLUMN rank_label VARCHAR(50) DEFAULT NULL",
    "ALTER TABLE users ADD COLUMN roles JSON DEFAULT NULL",
    "ALTER TABLE users ADD COLUMN region VARCHAR(20) DEFAULT NULL",
    "ALTER TABLE users ADD COLUMN languages JSON DEFAULT NULL",
    "ALTER TABLE users ADD COLUMN playtimes JSON DEFAULT NULL",
    "ALTER TABLE users ADD COLUMN show_in_lfg TINYINT(1) NOT NULL DEFAULT 0",
    "ALTER TABLE users ADD COLUMN lfg_status VARCHAR(20) NOT NULL DEFAULT 'lfg'",
    "ALTER TABLE users ADD COLUMN is_admin TINYINT(1) NOT NULL DEFAULT 0",
    "ALTER TABLE users ADD COLUMN banned TINYINT(1) NOT NULL DEFAULT 0",
    "ALTER TABLE users ADD COLUMN avatar_url VARCHAR(500) DEFAULT NULL",
    // Widen so uploaded pictures (stored as data URLs) fit, not just short links.
    "ALTER TABLE users MODIFY COLUMN avatar_url MEDIUMTEXT DEFAULT NULL",
  ];
  for (const sql of cols) {
    try { await pool.execute(sql); } catch { /* column already exists */ }
  }

  // 3. Shop tables (create if missing)
  await pool.execute(`
    CREATE TABLE IF NOT EXISTS products (
      id INT(11) NOT NULL AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(100) DEFAULT NULL,
      price DECIMAL(10,2) DEFAULT NULL,
      category VARCHAR(50) DEFAULT NULL,
      image_url VARCHAR(500) DEFAULT NULL,
      stock_quantity INT(11) DEFAULT 0
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci
  `);
  await pool.execute(`
    CREATE TABLE IF NOT EXISTS orders (
      id INT(11) NOT NULL AUTO_INCREMENT PRIMARY KEY,
      user_id INT(11) DEFAULT NULL,
      total_ttc DECIMAL(10,2) DEFAULT NULL,
      payment_method ENUM('Card','PayPal','Crypto') DEFAULT NULL,
      status ENUM('Pending','Paid','Shipped','Cancelled') DEFAULT 'Paid',
      created_at TIMESTAMP NOT NULL DEFAULT current_timestamp()
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci
  `);
  await pool.execute(`
    CREATE TABLE IF NOT EXISTS order_items (
      id INT(11) NOT NULL AUTO_INCREMENT PRIMARY KEY,
      order_id INT(11) DEFAULT NULL,
      product_id INT(11) DEFAULT NULL,
      quantity INT(11) DEFAULT NULL,
      price_at_purchase DECIMAL(10,2) DEFAULT NULL
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci
  `);
  await pool.execute(`
    CREATE TABLE IF NOT EXISTS discord_servers (
      id INT(11) NOT NULL AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(120) NOT NULL,
      description TEXT DEFAULT NULL,
      invite_url VARCHAR(255) NOT NULL,
      members VARCHAR(40) DEFAULT NULL,
      tag VARCHAR(40) DEFAULT NULL,
      featured TINYINT(1) NOT NULL DEFAULT 0,
      created_at TIMESTAMP NOT NULL DEFAULT current_timestamp()
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci
  `);
  // 'Cancelled' may be missing from an older enum — widen it
  try {
    await pool.execute("ALTER TABLE orders MODIFY status ENUM('Pending','Paid','Shipped','Cancelled') DEFAULT 'Paid'");
  } catch { /* ok */ }

  // 3b. Teams + own-tournaments + single-elimination brackets
  await pool.execute(`
    CREATE TABLE IF NOT EXISTS teams (
      id INT(11) NOT NULL AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(60) NOT NULL,
      tag VARCHAR(10) DEFAULT NULL,
      owner_id INT(11) NOT NULL,
      logo_url VARCHAR(500) DEFAULT NULL,
      description TEXT DEFAULT NULL,
      created_at TIMESTAMP NOT NULL DEFAULT current_timestamp()
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci
  `);
  await pool.execute(`
    CREATE TABLE IF NOT EXISTS team_requests (
      id INT(11) NOT NULL AUTO_INCREMENT PRIMARY KEY,
      team_id INT(11) NOT NULL,
      user_id INT(11) NOT NULL,
      status VARCHAR(20) NOT NULL DEFAULT 'pending',
      created_at TIMESTAMP NOT NULL DEFAULT current_timestamp(),
      UNIQUE KEY uniq_team_request (team_id, user_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci
  `);
  await pool.execute(`
    CREATE TABLE IF NOT EXISTS team_members (
      id INT(11) NOT NULL AUTO_INCREMENT PRIMARY KEY,
      team_id INT(11) NOT NULL,
      user_id INT(11) NOT NULL,
      role VARCHAR(20) NOT NULL DEFAULT 'member',
      joined_at TIMESTAMP NOT NULL DEFAULT current_timestamp(),
      UNIQUE KEY uniq_team_user (team_id, user_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci
  `);
  await pool.execute(`
    CREATE TABLE IF NOT EXISTS tournaments (
      id INT(11) NOT NULL AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(120) NOT NULL,
      format VARCHAR(20) NOT NULL DEFAULT 'SE',
      max_teams INT(11) NOT NULL DEFAULT 8,
      region VARCHAR(20) DEFAULT NULL,
      prize_pool VARCHAR(60) DEFAULT NULL,
      starts_at DATETIME DEFAULT NULL,
      status VARCHAR(20) NOT NULL DEFAULT 'open',
      created_by INT(11) DEFAULT NULL,
      created_at TIMESTAMP NOT NULL DEFAULT current_timestamp()
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci
  `);
  await pool.execute(`
    CREATE TABLE IF NOT EXISTS tournament_registrations (
      id INT(11) NOT NULL AUTO_INCREMENT PRIMARY KEY,
      tournament_id INT(11) NOT NULL,
      team_id INT(11) NOT NULL,
      checked_in TINYINT(1) NOT NULL DEFAULT 0,
      registered_at TIMESTAMP NOT NULL DEFAULT current_timestamp(),
      UNIQUE KEY uniq_tourn_team (tournament_id, team_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci
  `);
  await pool.execute(`
    CREATE TABLE IF NOT EXISTS audit_log (
      id INT(11) NOT NULL AUTO_INCREMENT PRIMARY KEY,
      admin_id INT(11) DEFAULT NULL,
      admin_username VARCHAR(50) DEFAULT NULL,
      action VARCHAR(60) NOT NULL,
      target VARCHAR(180) DEFAULT NULL,
      created_at TIMESTAMP NOT NULL DEFAULT current_timestamp()
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci
  `);
  await pool.execute(`
    CREATE TABLE IF NOT EXISTS sessions (
      token VARCHAR(64) NOT NULL PRIMARY KEY,
      user_id INT(11) NOT NULL,
      created_at TIMESTAMP NOT NULL DEFAULT current_timestamp(),
      expires_at DATETIME NOT NULL,
      KEY idx_sessions_user (user_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci
  `);
  await pool.execute(`
    CREATE TABLE IF NOT EXISTS promo_codes (
      id INT(11) NOT NULL AUTO_INCREMENT PRIMARY KEY,
      code VARCHAR(40) NOT NULL UNIQUE,
      percent INT(11) NOT NULL DEFAULT 0,
      active TINYINT(1) NOT NULL DEFAULT 1,
      created_at TIMESTAMP NOT NULL DEFAULT current_timestamp()
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci
  `);
  // Record which promo was used on an order (ignored if columns already exist).
  for (const sql of [
    "ALTER TABLE orders ADD COLUMN promo_code VARCHAR(40) DEFAULT NULL",
    "ALTER TABLE orders ADD COLUMN discount DECIMAL(10,2) NOT NULL DEFAULT 0",
  ]) { try { await pool.execute(sql); } catch { /* exists */ } }
  await pool.execute(`
    CREATE TABLE IF NOT EXISTS notifications (
      id INT(11) NOT NULL AUTO_INCREMENT PRIMARY KEY,
      user_id INT(11) NOT NULL,
      type VARCHAR(30) NOT NULL DEFAULT 'info',
      message VARCHAR(255) NOT NULL,
      link VARCHAR(120) DEFAULT NULL,
      is_read TINYINT(1) NOT NULL DEFAULT 0,
      created_at TIMESTAMP NOT NULL DEFAULT current_timestamp(),
      KEY idx_notif_user (user_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci
  `);
  await pool.execute(`
    CREATE TABLE IF NOT EXISTS match_history (
      id INT(11) NOT NULL AUTO_INCREMENT PRIMARY KEY,
      user_id INT(11) NOT NULL,
      match_id VARCHAR(80) NOT NULL,
      map VARCHAR(40) DEFAULT NULL,
      mode VARCHAR(40) DEFAULT NULL,
      result VARCHAR(2) DEFAULT NULL,
      rounds_won INT(11) NOT NULL DEFAULT 0,
      rounds_lost INT(11) NOT NULL DEFAULT 0,
      agent VARCHAR(40) DEFAULT NULL,
      kills INT(11) NOT NULL DEFAULT 0,
      deaths INT(11) NOT NULL DEFAULT 0,
      assists INT(11) NOT NULL DEFAULT 0,
      headshot_pct INT(11) NOT NULL DEFAULT 0,
      avg_damage INT(11) NOT NULL DEFAULT 0,
      played_at DATETIME DEFAULT NULL,
      created_at TIMESTAMP NOT NULL DEFAULT current_timestamp(),
      UNIQUE KEY uniq_user_match (user_id, match_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci
  `);
  await pool.execute(`
    CREATE TABLE IF NOT EXISTS tournament_matches (
      id INT(11) NOT NULL AUTO_INCREMENT PRIMARY KEY,
      tournament_id INT(11) NOT NULL,
      round INT(11) NOT NULL,
      slot INT(11) NOT NULL,
      team1_id INT(11) DEFAULT NULL,
      team2_id INT(11) DEFAULT NULL,
      score1 INT(11) NOT NULL DEFAULT 0,
      score2 INT(11) NOT NULL DEFAULT 0,
      winner_id INT(11) DEFAULT NULL,
      status VARCHAR(20) NOT NULL DEFAULT 'upcoming',
      created_at TIMESTAMP NOT NULL DEFAULT current_timestamp()
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci
  `);

  // 4. Seed a few products if the table is empty
  const [[{ cnt: productCount }]] = await pool.query('SELECT COUNT(*) AS cnt FROM products');
  if (productCount === 0) {
    await pool.query(
      `INSERT INTO products (name, price, category, image_url, stock_quantity) VALUES ?`,
      [[
        ['Maillot Pro B3 2026',        69.99, 'MAILLOTS',    'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=600', 30],
        ['Hoodie Tactical Cobalt',     74.99, 'SWEATS',      'https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=600',   25],
        ['Casquette Snapback Azure',   29.99, 'ACCESSOIRES', 'https://images.unsplash.com/photo-1588850561407-ed78c282e89b?w=600', 50],
        ['Tapis XXL Pro RGB',          44.99, 'ACCESSOIRES', 'https://images.unsplash.com/photo-1625225233840-695456021cde?w=600', 60],
        ['Gourde Steel B3',            22.99, 'ACCESSOIRES', 'https://images.unsplash.com/photo-1602143407151-7111542de6e8?w=600', 75],
        ['Sac à dos Premium',      89.99, 'ACCESSOIRES', 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=600',   18],
      ]]
    );
  }

  // 4b. Seed well-known public VALORANT Discord servers if none exist yet
  const [[{ cnt: discordCount }]] = await pool.query('SELECT COUNT(*) AS cnt FROM discord_servers');
  if (discordCount === 0) {
    await pool.query(
      `INSERT INTO discord_servers (name, description, invite_url, members, tag, featured) VALUES ?`,
      [[
        ['VALORANT · Officiel', 'Le serveur officiel de Riot Games : annonces, notes de patch, salons par région et events communautaires.', 'https://discord.gg/valorant', '2 400 000+', 'OFFICIEL', 1],
        ['VALORANT LFG', 'Le plus grand serveur « Looking for Group » : trouve des coéquipiers par rang et par région, à toute heure.', 'https://discord.gg/valorantlfg', '700 000+', 'LFG', 0],
        ['r/VALORANT', 'La communauté Reddit officielle : discussions méta, clips, mèmes et salons LFG.', 'https://discord.gg/P8EyvjA', '250 000+', 'COMMUNAUTÉ', 0],
        ['Sentinels', "Le serveur officiel de l'organisation esport Sentinels : actus de l'équipe, watch parties et communauté fan.", 'https://discord.gg/sentinels', '200 000+', 'ESPORT', 0],
        ['VALORANT Europe', 'Communauté européenne : scrims, LFG EU, tournois amateurs et discussions en plusieurs langues.', 'https://discord.gg/valeu', '57 000+', 'RÉGION · EU', 0],
      ]]
    );
  }

  // 4c. Seed a few shop promo codes if none exist yet
  const [[{ cnt: promoCount }]] = await pool.query('SELECT COUNT(*) AS cnt FROM promo_codes');
  if (promoCount === 0) {
    await pool.query(
      'INSERT INTO promo_codes (code, percent, active) VALUES ?',
      [[
        ['B3WELCOME', 10, 1],
        ['VALORANT15', 15, 1],
        ['RADIANT25', 25, 1],
        ['EXPIRED', 50, 0],
      ]]
    );
  }

  // 5. Seed the admin account if it does not exist
  const existingAdmin = await getUserByEmail(ADMIN_EMAIL);
  if (!existingAdmin) {
    const hash = await bcrypt.hash(ADMIN_PASSWORD, SALT_ROUNDS);
    await pool.execute(
      'INSERT INTO users (username, email, password_hash, is_admin) VALUES (?, ?, ?, 1)',
      ['Admin B3', ADMIN_EMAIL, hash]
    );
    console.log(`Admin account created → ${ADMIN_EMAIL} / ${ADMIN_PASSWORD}`);
  } else if (!existingAdmin.is_admin) {
    await pool.execute('UPDATE users SET is_admin = 1 WHERE id = ?', [existingAdmin.id]);
  }

  console.log('DB schema ready');
};

// ── Session helpers ─────────────────────────────────────────
const getBearerToken = (req) => {
  const auth = req.headers.authorization || '';
  if (!auth.startsWith('Bearer ')) return null;
  return auth.slice(7).trim();
};

// Sessions are persisted in the DB so they survive API restarts / redeploys.
const SESSION_TTL_DAYS = 30;

const getSessionUserId = async (req) => {
  const token = getBearerToken(req);
  if (!token) return null;
  const [[row]] = await pool.query(
    'SELECT user_id FROM sessions WHERE token = ? AND expires_at > NOW()',
    [token]
  );
  return row ? row.user_id : null;
};

const createSession = async (userId) => {
  const token = crypto.randomBytes(24).toString('hex');
  await pool.execute(
    'INSERT INTO sessions (token, user_id, expires_at) VALUES (?, ?, DATE_ADD(NOW(), INTERVAL ? DAY))',
    [token, userId, SESSION_TTL_DAYS]
  );
  return token;
};

const deleteSession = async (req) => {
  const token = getBearerToken(req);
  if (token) await pool.execute('DELETE FROM sessions WHERE token = ?', [token]);
};

// ── Auth middleware ─────────────────────────────────────────
// Populates req.userId for any logged-in caller; 401 otherwise.
const requireAuth = async (req, res, next) => {
  const userId = await getSessionUserId(req);
  if (!userId) { res.status(401).json({ success: false, error: 'Non authentifie' }); return; }
  req.userId = userId;
  next();
};

// Populates req.user with the full admin row; 401/403 otherwise.
const requireAdmin = async (req, res, next) => {
  const userId = await getSessionUserId(req);
  const user = userId ? await getUserById(userId) : null;
  if (!user) { res.status(401).json({ success: false, error: 'Non authentifie' }); return; }
  if (!user.is_admin) { res.status(403).json({ success: false, error: 'Acces reserve aux administrateurs' }); return; }
  req.user = user;
  next();
};

// ── Express app ─────────────────────────────────────────────
const app = express();
app.use(cors({
  origin: CORS_ORIGIN,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));
// Large limit: avatars are uploaded as base64 data URLs (stored in MEDIUMTEXT).
app.use(express.json({ limit: '20mb' }));

app.get('/health', async (req, res) => {
  await pool.query('SELECT 1');
  res.json({ success: true });
});

// ════════════════════════════════════════════════════════
//  AUTH
// ════════════════════════════════════════════════════════
app.post('/auth/register', async (req, res) => {
  const body = req.body || {};
  const username = String(body.username || '').trim();
  const email = String(body.email || '').trim().toLowerCase();
  const password = String(body.password || '');

  if (!username || !email || !password) {
    return res.status(400).json({ success: false, error: 'Champs requis manquants' });
  }
  if (password.length < 6) {
    return res.status(400).json({ success: false, error: 'Le mot de passe doit contenir au moins 6 caracteres' });
  }

  const existing = await getUserByEmail(email);
  if (existing) {
    return res.status(409).json({ success: false, error: 'Cet email est deja utilise' });
  }

  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
  const [insertResult] = await pool.execute(
    'INSERT INTO users (username, email, password_hash) VALUES (?, ?, ?)',
    [username, email, passwordHash]
  );

  const user = await getUserById(insertResult.insertId);
  const token = await createSession(user.id);
  res.status(201).json({ success: true, user: sanitizeUser(user), token });
});

app.post('/auth/login', async (req, res) => {
  const body = req.body || {};
  const email = String(body.email || '').trim().toLowerCase();
  const password = String(body.password || '');

  const user = await getUserByEmail(email);
  if (!user) {
    return res.status(401).json({ success: false, error: 'Email ou mot de passe incorrect' });
  }

  const valid = await bcrypt.compare(password, user.password_hash);
  if (!valid) {
    return res.status(401).json({ success: false, error: 'Email ou mot de passe incorrect' });
  }

  if (user.banned) {
    return res.status(403).json({ success: false, error: 'Ce compte a été banni.' });
  }

  const token = await createSession(user.id);
  res.json({ success: true, user: sanitizeUser(user), token });
});

app.get('/auth/me', async (req, res) => {
  const userId = await getSessionUserId(req);
  if (!userId) return res.json({ success: true });
  const user = await getUserById(userId);
  if (!user) return res.json({ success: true });
  res.json({ success: true, user: sanitizeUser(user) });
});

app.post('/auth/logout', async (req, res) => {
  await deleteSession(req);
  res.json({ success: true });
});

// ════════════════════════════════════════════════════════
//  USERS — profile + password (self only)
// ════════════════════════════════════════════════════════
app.put('/users/:id/profile', requireAuth, async (req, res) => {
  const userId = Number(req.params.id);
  if (req.userId !== userId) {
    return res.status(403).json({ success: false, error: 'Acces refuse' });
  }

  const body = req.body || {};
  const currentUser = await getUserById(userId);
  if (!currentUser) {
    return res.status(404).json({ success: false, error: 'Utilisateur introuvable' });
  }

  // Check email uniqueness before building update
  if (body.email !== undefined) {
    const e = String(body.email || '').trim().toLowerCase();
    if (e && e !== currentUser.email) {
      const existing = await getUserByEmail(e);
      if (existing && existing.id !== userId) {
        return res.status(409).json({ success: false, error: 'Cet email est deja utilise' });
      }
    }
  }

  // Build partial update — only fields explicitly present in the body
  const updates = {};
  if (body.username !== undefined) {
    const u = String(body.username || '').trim();
    updates.username = u || currentUser.username;
  }
  if (body.email !== undefined) {
    const e = String(body.email || '').trim().toLowerCase();
    updates.email = e || currentUser.email;
  }
  if (body.riotId  !== undefined) updates.riot_id    = String(body.riotId  || '').trim() || null;
  if (body.tagLine !== undefined) updates.tag_line   = String(body.tagLine || '').trim() || null;
  if (body.bio     !== undefined) updates.bio        = String(body.bio     || '').trim() || null;
  if (body.discord !== undefined) updates.discord    = String(body.discord || '').trim() || null;
  if (body.twitter !== undefined) updates.twitter    = String(body.twitter || '').trim() || null;
  if (body.twitch  !== undefined) updates.twitch     = String(body.twitch  || '').trim() || null;
  if (body.youtube !== undefined) updates.youtube    = String(body.youtube || '').trim() || null;
  if (body.avatarUrl !== undefined) updates.avatar_url = String(body.avatarUrl || '').trim() || null;
  if (body.rankLabel  !== undefined) updates.rank_label = String(body.rankLabel  || '').trim() || null;
  if (body.region     !== undefined) updates.region     = String(body.region     || '').trim() || null;
  if (body.roles      !== undefined) updates.roles      = Array.isArray(body.roles)     ? JSON.stringify(body.roles)     : null;
  if (body.languages  !== undefined) updates.languages  = Array.isArray(body.languages) ? JSON.stringify(body.languages) : null;
  if (body.playtimes  !== undefined) updates.playtimes  = Array.isArray(body.playtimes) ? JSON.stringify(body.playtimes) : null;
  if (body.showInLfg  !== undefined) updates.show_in_lfg = body.showInLfg ? 1 : 0;
  if (body.lfgStatus  !== undefined) updates.lfg_status  = ['lfg', 'busy'].includes(body.lfgStatus) ? body.lfgStatus : 'lfg';

  if (Object.keys(updates).length > 0) {
    const setClauses = Object.keys(updates).map(k => `${k} = ?`).join(', ');
    await pool.execute(`UPDATE users SET ${setClauses} WHERE id = ?`, [...Object.values(updates), userId]);
  }

  const updatedUser = await getUserById(userId);
  if (!updatedUser) {
    return res.status(404).json({ success: false, error: 'Utilisateur introuvable' });
  }
  res.json({ success: true, user: sanitizeUser(updatedUser) });
});

app.put('/users/:id/password', requireAuth, async (req, res) => {
  const userId = Number(req.params.id);
  if (req.userId !== userId) {
    return res.status(403).json({ success: false, error: 'Acces refuse' });
  }

  const body = req.body || {};
  const password = String(body.password || '');
  if (password.length < 6) {
    return res.status(400).json({ success: false, error: 'Le mot de passe doit contenir au moins 6 caracteres' });
  }

  const currentUser = await getUserById(userId);
  if (!currentUser) {
    return res.status(404).json({ success: false, error: 'Utilisateur introuvable' });
  }

  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
  await pool.execute('UPDATE users SET password_hash = ? WHERE id = ?', [passwordHash, userId]);
  res.json({ success: true });
});

// ── Notifications (self only) ───────────────────────────────
app.get('/users/:id/notifications', requireAuth, async (req, res) => {
  const userId = Number(req.params.id);
  if (req.userId !== userId) return res.status(403).json({ success: false, error: 'Acces refuse' });
  const [rows] = await pool.query(
    'SELECT id, type, message, link, is_read, created_at FROM notifications WHERE user_id = ? ORDER BY id DESC LIMIT 30',
    [userId]
  );
  const notifications = rows.map(r => ({
    id: r.id, type: r.type, message: r.message, link: r.link || null,
    read: r.is_read ? 1 : 0, createdAt: r.created_at,
  }));
  const unread = notifications.filter(n => !n.read).length;
  res.json({ success: true, notifications, unread });
});

app.post('/users/:id/notifications/read', requireAuth, async (req, res) => {
  const userId = Number(req.params.id);
  if (req.userId !== userId) return res.status(403).json({ success: false, error: 'Acces refuse' });
  await pool.execute('UPDATE notifications SET is_read = 1 WHERE user_id = ? AND is_read = 0', [userId]);
  res.json({ success: true });
});

// ── A player's own orders (self only) ───────────────────────
app.get('/users/:id/orders', requireAuth, async (req, res) => {
  const userId = Number(req.params.id);
  if (req.userId !== userId) return res.status(403).json({ success: false, error: 'Acces refuse' });
  const [orders] = await pool.query(
    'SELECT id, total_ttc, payment_method, status, created_at FROM orders WHERE user_id = ? ORDER BY id DESC',
    [userId]
  );
  const [items] = await pool.query(`
    SELECT oi.order_id, oi.quantity, oi.price_at_purchase, p.name
    FROM order_items oi
    LEFT JOIN products p ON p.id = oi.product_id
    WHERE oi.order_id IN (SELECT id FROM orders WHERE user_id = ?)
  `, [userId]);
  const byOrder = {};
  for (const it of items) {
    (byOrder[it.order_id] ||= []).push({ name: it.name || 'Produit supprimé', quantity: it.quantity, price: Number(it.price_at_purchase) });
  }
  res.json({
    success: true,
    orders: orders.map(o => ({ ...o, total_ttc: Number(o.total_ttc), items: byOrder[o.id] || [] })),
  });
});

// ── Public profile (read-only, any visitor) ─────────────────
app.get('/users/:id/public', async (req, res) => {
  const userId = Number(req.params.id);
  const u = await getUserById(userId);
  if (!u) return res.status(404).json({ success: false, error: 'Joueur introuvable' });
  const [teamRows] = await pool.query(
    `SELECT t.id, t.name, t.tag, tm.role FROM team_members tm JOIN teams t ON t.id = tm.team_id WHERE tm.user_id = ?`,
    [userId]
  );
  res.json({
    success: true,
    profile: {
      id: u.id,
      username: u.username,
      avatarUrl: u.avatar_url || null,
      rankLabel: u.rank_label || null,
      bio: u.bio || null,
      region: u.region || null,
      roles: parseJsonCol(u.roles),
      discord: u.discord || null,
      twitter: u.twitter || null,
      twitch: u.twitch || null,
      youtube: u.youtube || null,
      createdAt: u.created_at,
      teams: teamRows.map(t => ({ id: t.id, name: t.name, tag: t.tag || null, role: t.role })),
      recentMatches: await getMatchHistory(userId, 5),
    },
  });
});

// Persisted match history for a player (public — used by the Stats dashboard).
app.get('/users/:id/matches', async (req, res) => {
  const matches = await getMatchHistory(Number(req.params.id));
  res.json({ success: true, matches });
});

// Pull the caller's latest matches from Riot and persist them (self only).
// Idempotent: already-stored matches are skipped (UNIQUE user_id+match_id).
app.post('/users/:id/sync', requireAuth, async (req, res) => {
  const userId = Number(req.params.id);
  if (req.userId !== userId) return res.status(403).json({ success: false, error: 'Acces refuse' });

  const u = await getUserById(userId);
  if (!u) return res.status(404).json({ success: false, error: 'Utilisateur introuvable' });

  const body = req.body || {};
  const name = String(body.name || u.riot_id || '').trim();
  const tag = String(body.tag || u.tag_line || '').trim();
  if (!name || !tag) {
    return res.status(400).json({ success: false, error: 'Aucun Riot ID — connecte ton compte dans Profil' });
  }
  if (!process.env.RIOT_API_KEY) {
    return res.status(503).json({ success: false, needsApiKey: true, error: 'Clé API Riot manquante (RIOT_API_KEY dans .env)' });
  }

  const fetched = await riotFetchMatches(name, tag, 10);
  let synced = 0;
  for (const m of fetched) {
    if (!m.matchId) continue;
    const playedAt = m.startMillis ? new Date(m.startMillis).toISOString().slice(0, 19).replace('T', ' ') : null;
    const [r] = await pool.execute(
      `INSERT IGNORE INTO match_history
        (user_id, match_id, map, mode, result, rounds_won, rounds_lost, agent, kills, deaths, assists, headshot_pct, avg_damage, played_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [userId, m.matchId, m.map, m.mode, m.result, m.roundsWon, m.roundsLost, m.agent, m.kills, m.deaths, m.assists, m.headshotPct, m.avgDamage, playedAt]
    );
    if (r.affectedRows > 0) synced += 1;
  }

  // Refresh the player's rank from the most recent ranked match, if available.
  const latestRank = fetched.find(x => x.rank)?.rank || null;
  if (latestRank) await pool.execute('UPDATE users SET rank_label = ? WHERE id = ?', [latestRank, userId]);

  res.json({ success: true, synced, fetched: fetched.length, rankLabel: latestRank, matches: await getMatchHistory(userId) });
});

// ════════════════════════════════════════════════════════
//  RIOT proxy — official Riot API
// ════════════════════════════════════════════════════════
const TIER_NAMES = [
  'Non classé','Non classé','Non classé','Iron 1','Iron 2','Iron 3',
  'Bronze 1','Bronze 2','Bronze 3','Silver 1','Silver 2','Silver 3',
  'Gold 1','Gold 2','Gold 3','Platinum 1','Platinum 2','Platinum 3',
  'Diamond 1','Diamond 2','Diamond 3','Ascendant 1','Ascendant 2','Ascendant 3',
  'Immortal 1','Immortal 2','Immortal 3','Radiant',
];

// Fetch + normalise a player's recent matches from the official Riot API.
// Returns [] on any failure (missing/expired key, unknown player, network).
// Shared by GET /riot/matches and the persistence sync endpoint.
const riotFetchMatches = async (name, tag, size) => {
  const apiKey = process.env.RIOT_API_KEY || '';
  if (!apiKey) return [];
  const riotHeaders = { 'X-Riot-Token': apiKey };
  const region = process.env.RIOT_REGION || 'eu';
  try {
    const accountRes = await fetch(
      `https://europe.api.riotgames.com/riot/account/v1/accounts/by-riot-id/${encodeURIComponent(name)}/${encodeURIComponent(tag)}`,
      { headers: riotHeaders }
    );
    if (!accountRes.ok) return [];
    const { puuid } = await accountRes.json();

    const matchListRes = await fetch(
      `https://${region}.api.riotgames.com/val/match/v1/matchlists/by-puuid/${puuid}`,
      { headers: riotHeaders }
    );
    if (!matchListRes.ok) return [];
    const matchList = await matchListRes.json();
    const recentIds = (matchList.history || []).slice(0, size).map((m) => m.matchId);

    const details = await Promise.all(
      recentIds.map((id) =>
        fetch(`https://${region}.api.riotgames.com/val/match/v1/matches/${id}`, { headers: riotHeaders })
          .then((r) => (r.ok ? r.json() : null))
          .catch(() => null)
      )
    );

    return details
      .filter(Boolean)
      .map((match) => {
        const player = match.players?.find((p) => p.puuid === puuid);
        if (!player) return null;
        const myTeam = match.teams?.find((t) => t.teamId === player.teamId);
        const won = myTeam?.won === true;
        const mapId = match.matchInfo?.mapId || '';
        const startMillis = match.matchInfo?.gameStartMillis || 0;
        return {
          matchId: match.matchInfo?.matchId || '',
          map: mapId.split('/').pop() || 'Unknown',
          mode: match.matchInfo?.queueId || 'unrated',
          startMillis,
          date: startMillis ? new Date(startMillis).toLocaleDateString('fr-FR') : '',
          result: won ? 'W' : 'L',
          roundsWon: myTeam?.roundsWon || 0,
          roundsLost: (match.matchInfo?.numberOfRounds || 0) - (myTeam?.roundsWon || 0),
          agent: player.characterId || 'Unknown',
          agentImage: null,
          kills: player.stats?.kills || 0,
          deaths: player.stats?.deaths || 0,
          assists: player.stats?.assists || 0,
          headshotPct: (player.stats?.kills || 0) > 0
            ? Math.round(((player.stats?.headshots || 0) / player.stats.kills) * 100)
            : 0,
          avgDamage: (match.matchInfo?.numberOfRounds || 0) > 0
            ? Math.round((player.stats?.score || 0) / match.matchInfo.numberOfRounds)
            : 0,
          rank: player.competitiveTier ? (TIER_NAMES[player.competitiveTier] || '') : '',
        };
      })
      .filter(Boolean);
  } catch (err) {
    console.error('Riot matches error:', err);
    return [];
  }
};

// Map persisted match_history rows to the MatchWithUser shape the UI consumes
// (plus extra fields for the dashboard).
const getMatchHistory = async (userId, limit = 20) => {
  const [rows] = await pool.query(
    'SELECT * FROM match_history WHERE user_id = ? ORDER BY played_at DESC, id DESC LIMIT ?',
    [userId, limit]
  );
  return rows.map(r => ({
    id: r.id,
    user_id: r.user_id,
    map_name: r.map,
    score_home: r.rounds_won,
    score_away: r.rounds_lost,
    result: r.result,
    agent_played: r.agent,
    kills: r.kills,
    deaths: r.deaths,
    assists: r.assists,
    played_at: r.played_at,
    mode: r.mode,
    headshotPct: r.headshot_pct,
    avgDamage: r.avg_damage,
    roundsWon: r.rounds_won,
    roundsLost: r.rounds_lost,
  }));
};

// Record an admin action in the audit trail (best-effort).
const logAudit = async (adminUser, action, target = null) => {
  try {
    await pool.execute(
      'INSERT INTO audit_log (admin_id, admin_username, action, target) VALUES (?, ?, ?, ?)',
      [adminUser?.id ?? null, adminUser?.username ?? null, action, target]
    );
  } catch (err) {
    console.error('audit log failed:', err);
  }
};

// Insert an in-app notification (best-effort; never breaks the triggering action).
const pushNotification = async (userId, type, message, link = null) => {
  try {
    await pool.execute(
      'INSERT INTO notifications (user_id, type, message, link) VALUES (?, ?, ?, ?)',
      [userId, type, message, link]
    );
    // Nudge the recipient's open tabs so the bell updates instantly.
    wsSendToUser(userId, { type: 'notification', message });
  } catch (err) {
    console.error('notification insert failed:', err);
  }
};

// All user ids belonging to a team (used to fan-out tournament notifications).
const teamMemberIds = async (teamId) => {
  const [rows] = await pool.query('SELECT user_id FROM team_members WHERE team_id = ?', [teamId]);
  return rows.map(r => r.user_id);
};

const teamMemberCount = async (teamId) => {
  const [[{ cnt }]] = await pool.query('SELECT COUNT(*) AS cnt FROM team_members WHERE team_id = ?', [teamId]);
  return Number(cnt);
};

app.get('/riot/player/:name/:tag', async (req, res) => {
  const name = req.params.name;
  const tag = req.params.tag;
  const apiKey = process.env.RIOT_API_KEY || '';

  if (!apiKey) {
    return res.status(503).json({ success: false, needsApiKey: true, error: 'Clé API Riot manquante dans le fichier .env (RIOT_API_KEY=RGAPI-...)' });
  }

  const riotHeaders = { 'X-Riot-Token': apiKey };

  try {
    // 1. Account lookup (global endpoint)
    const accountRes = await fetch(
      `https://europe.api.riotgames.com/riot/account/v1/accounts/by-riot-id/${encodeURIComponent(name)}/${encodeURIComponent(tag)}`,
      { headers: riotHeaders }
    );

    if (accountRes.status === 401 || accountRes.status === 403) {
      return res.status(503).json({ success: false, needsApiKey: true, error: 'Clé API Riot invalide ou expirée. Renouvelle-la sur developer.riotgames.com (valide 24h).' });
    }
    if (!accountRes.ok) {
      return res.status(404).json({ success: false, error: 'Joueur introuvable. Vérifie le pseudo et le tag.' });
    }

    const accountData = await accountRes.json();
    const puuid = accountData.puuid;
    const region = process.env.RIOT_REGION || 'eu';

    // 2. Recent match list
    const matchListRes = await fetch(
      `https://${region}.api.riotgames.com/val/match/v1/matchlists/by-puuid/${puuid}`,
      { headers: riotHeaders }
    );
    const matchList = matchListRes.ok ? await matchListRes.json() : null;

    // 3. Get details of last 3 matches to infer rank + stats
    let currentTier = null;
    let currentTierName = null;
    if (matchList?.history?.length) {
      const recentIds = matchList.history.slice(0, 3).map((m) => m.matchId);
      const details = await Promise.all(
        recentIds.map((id) =>
          fetch(`https://${region}.api.riotgames.com/val/match/v1/matches/${id}`, { headers: riotHeaders })
            .then((r) => (r.ok ? r.json() : null))
            .catch(() => null)
        )
      );
      for (const match of details) {
        if (!match) continue;
        const player = match.players?.find((p) => p.puuid === puuid);
        if (player?.competitiveTier && player.competitiveTier > 0) {
          currentTier = player.competitiveTier;
          break;
        }
      }
    }

    if (currentTier !== null) {
      currentTierName = TIER_NAMES[currentTier] ?? 'Non classé';
    }

    res.json({
      success: true,
      account: {
        puuid,
        name: accountData.gameName,
        tag: accountData.tagLine,
        account_level: null,
      },
      mmr: currentTier !== null ? {
        current_data: {
          currenttier: currentTier,
          currenttierpatched: currentTierName,
          ranking_in_tier: 0,
          mmr_change_to_last_game: 0,
          elo: 0,
          old: false,
        },
      } : null,
      puuid,
      region,
    });
  } catch (err) {
    console.error('Riot player error:', err);
    res.status(502).json({ success: false, error: 'Erreur lors de la connexion aux serveurs Riot' });
  }
});

app.get('/riot/matches/:name/:tag', async (req, res) => {
  const size = Math.min(Number(req.query.size || '5'), 8);
  const matches = await riotFetchMatches(req.params.name, req.params.tag, size);
  res.json({ success: true, matches });
});

// ════════════════════════════════════════════════════════
//  ESPORTS — vlr.gg proxy (real Valorant data, no token needed)
// ════════════════════════════════════════════════════════
app.get('/esports/tournaments/running', async (req, res) => {
  try {
    const data = await fetchVlr('/events?status=ongoing');
    res.json({ success: true, configured: true, data });
  } catch (err) {
    console.error('vlr.gg proxy error:', err);
    res.json({ success: true, configured: true, data: [] });
  }
});

app.get('/esports/tournaments/upcoming', async (req, res) => {
  try {
    const data = await fetchVlr('/events?status=upcoming');
    res.json({ success: true, configured: true, data });
  } catch (err) {
    console.error('vlr.gg proxy error:', err);
    res.json({ success: true, configured: true, data: [] });
  }
});

app.get('/esports/matches/running', async (req, res) => {
  try {
    // vlr returns upcoming + live in one feed; the client keeps the live ones.
    const data = await fetchVlr('/matches');
    res.json({ success: true, configured: true, data });
  } catch (err) {
    console.error('vlr.gg proxy error:', err);
    res.json({ success: true, configured: true, data: [] });
  }
});

app.get('/esports/matches/results', async (req, res) => {
  try {
    const data = await fetchVlr('/results');
    res.json({ success: true, configured: true, data });
  } catch (err) {
    console.error('vlr.gg proxy error:', err);
    res.json({ success: true, configured: true, data: [] });
  }
});

// vlr.gg has no per-event bracket feed via this wrapper — return empty.
app.get('/esports/tournaments/:id/brackets', (req, res) => {
  res.json({ success: true, configured: true, data: [] });
});

// Any other /esports/* path is unknown.
app.get('/esports/*splat', (req, res) => {
  res.status(404).json({ success: false, error: 'Route esports introuvable' });
});

// ════════════════════════════════════════════════════════
//  COMMUNITY (LFG)
// ════════════════════════════════════════════════════════
app.get('/users/lfg', async (req, res) => {
  const [rows] = await pool.execute(
    `SELECT id, username, riot_id, tag_line, bio, discord, twitter, twitch, youtube, rank_label, roles, region, languages, playtimes, lfg_status, avatar_url FROM users WHERE show_in_lfg = 1`
  );
  const players = rows.map(r => ({
    id: r.id,
    username: r.username,
    riotId: r.riot_id || null,
    tagLine: r.tag_line || null,
    bio: r.bio || null,
    discord: r.discord || null,
    twitter: r.twitter || null,
    twitch: r.twitch || null,
    youtube: r.youtube || null,
    avatarUrl: r.avatar_url || null,
    rankLabel: r.rank_label || null,
    roles: parseJsonCol(r.roles),
    region: r.region || null,
    languages: parseJsonCol(r.languages),
    playtimes: parseJsonCol(r.playtimes),
    lfgStatus: r.lfg_status || 'lfg',
  }));
  res.json({ success: true, players });
});

// ════════════════════════════════════════════════════════
//  SHOP — public
// ════════════════════════════════════════════════════════
const getActivePromo = async (code) => {
  if (!code) return null;
  const [[row]] = await pool.query(
    'SELECT code, percent FROM promo_codes WHERE code = ? AND active = 1',
    [String(code).trim().toUpperCase()]
  );
  return row ? { code: row.code, percent: Number(row.percent) } : null;
};

// Validate a promo code (used by the cart before checkout).
app.post('/promo/validate', async (req, res) => {
  const code = String((req.body || {}).code || '').trim().toUpperCase();
  if (!code) return res.status(400).json({ success: false, error: 'Code requis' });
  const promo = await getActivePromo(code);
  if (!promo) return res.status(404).json({ success: false, error: 'Code promo invalide ou expiré' });
  res.json({ success: true, code: promo.code, percent: promo.percent });
});

app.get('/products', async (req, res) => {
  const [rows] = await pool.query(
    'SELECT id, name, price, category, image_url, stock_quantity FROM products ORDER BY id ASC'
  );
  const products = rows.map(r => ({
    id: Number(r.id),
    name: r.name,
    price: Number(r.price),
    category: r.category,
    image_url: r.image_url,
    stock_quantity: Number(r.stock_quantity),
  }));
  res.json({ success: true, products });
});

app.post('/orders', requireAuth, async (req, res) => {
  const sessionUserId = req.userId;
  const body = req.body || {};
  const method = ['Card', 'PayPal', 'Crypto'].includes(body.payment_method) ? body.payment_method : 'Card';
  const items = Array.isArray(body.items) ? body.items : [];

  // Compute the total server-side so the discount can't be forged client-side.
  const subtotal = items.reduce((s, it) => s + (Number(it.price_at_purchase) || 0) * (Number(it.quantity) || 1), 0);
  const promo = await getActivePromo(body.promo_code);
  const discount = promo ? Math.round(subtotal * promo.percent) / 100 : 0;
  const totalTtc = Math.max(0, Math.round((subtotal - discount) * 100) / 100);

  const [orderResult] = await pool.execute(
    'INSERT INTO orders (user_id, total_ttc, payment_method, status, promo_code, discount) VALUES (?, ?, ?, ?, ?, ?)',
    [sessionUserId, totalTtc, method, 'Paid', promo ? promo.code : null, discount]
  );
  const orderId = orderResult.insertId;

  for (const it of items) {
    const pid = Number(it.product_id);
    const qty = Number(it.quantity) || 1;
    const price = Number(it.price_at_purchase) || 0;
    if (!pid) continue;
    await pool.execute(
      'INSERT INTO order_items (order_id, product_id, quantity, price_at_purchase) VALUES (?, ?, ?, ?)',
      [orderId, pid, qty, price]
    );
    await pool.execute(
      'UPDATE products SET stock_quantity = GREATEST(stock_quantity - ?, 0) WHERE id = ?',
      [qty, pid]
    );
  }

  await pushNotification(sessionUserId, 'order', `Commande #${orderId} confirmée — merci !`, '/orders');
  res.status(201).json({ success: true, orderId });
});

// ════════════════════════════════════════════════════════
//  ADMIN — protected (is_admin required)
// ════════════════════════════════════════════════════════
app.get('/admin/overview', requireAdmin, async (req, res) => {
  const [[{ users }]]    = await pool.query('SELECT COUNT(*) AS users FROM users');
  const [[{ admins }]]   = await pool.query('SELECT COUNT(*) AS admins FROM users WHERE is_admin = 1');
  const [[{ lfg }]]      = await pool.query('SELECT COUNT(*) AS lfg FROM users WHERE show_in_lfg = 1');
  const [[{ products }]] = await pool.query('SELECT COUNT(*) AS products FROM products');
  const [[{ orders }]]   = await pool.query('SELECT COUNT(*) AS orders FROM orders');
  const [[{ revenue }]]  = await pool.query("SELECT COALESCE(SUM(total_ttc),0) AS revenue FROM orders WHERE status != 'Cancelled'");
  const [[{ stock }]]    = await pool.query('SELECT COALESCE(SUM(stock_quantity),0) AS stock FROM products');

  const [recentUsers] = await pool.query(
    'SELECT id, username, email, created_at, is_admin FROM users ORDER BY id DESC LIMIT 5'
  );
  const [recentOrders] = await pool.query(`
    SELECT o.id, o.total_ttc, o.payment_method, o.status, o.created_at, u.username
    FROM orders o LEFT JOIN users u ON u.id = o.user_id
    ORDER BY o.id DESC LIMIT 6
  `);
  const [signups] = await pool.query(`
    SELECT DATE(created_at) AS day, COUNT(*) AS count
    FROM users GROUP BY DATE(created_at) ORDER BY day DESC LIMIT 7
  `);

  res.json({
    success: true,
    metrics: {
      users: Number(users), admins: Number(admins), lfg: Number(lfg),
      products: Number(products), orders: Number(orders),
      revenue: Number(revenue), stock: Number(stock),
    },
    recentUsers,
    recentOrders: recentOrders.map(o => ({ ...o, total_ttc: Number(o.total_ttc) })),
    signups: signups.reverse(),
  });
});

app.get('/admin/users', requireAdmin, async (req, res) => {
  const [rows] = await pool.query(`SELECT ${USER_COLS} FROM users ORDER BY id DESC`);
  res.json({ success: true, users: rows.map(sanitizeUser) });
});

app.put('/admin/users/:id', requireAdmin, async (req, res) => {
  const targetId = Number(req.params.id);
  const body = req.body || {};

  const target = await getUserById(targetId);
  if (!target) { return res.status(404).json({ success: false, error: 'Utilisateur introuvable' }); }

  const updates = {};
  if (body.username !== undefined) updates.username = String(body.username).trim() || target.username;
  if (body.email    !== undefined) updates.email    = String(body.email).trim().toLowerCase() || target.email;
  if (body.isAdmin  !== undefined) {
    // Prevent removing the last admin
    if (!body.isAdmin && target.is_admin) {
      const [[{ admins }]] = await pool.query('SELECT COUNT(*) AS admins FROM users WHERE is_admin = 1');
      if (admins <= 1) { return res.status(400).json({ success: false, error: 'Impossible de retirer le dernier administrateur' }); }
    }
    updates.is_admin = body.isAdmin ? 1 : 0;
  }
  if (body.banned !== undefined) {
    // Banning an admin is not allowed — demote first.
    if (body.banned && target.is_admin) { return res.status(400).json({ success: false, error: 'Impossible de bannir un administrateur' }); }
    updates.banned = body.banned ? 1 : 0;
  }
  if (body.showInLfg !== undefined) updates.show_in_lfg = body.showInLfg ? 1 : 0;
  if (Object.keys(updates).length > 0) {
    const setClauses = Object.keys(updates).map(k => `${k} = ?`).join(', ');
    await pool.execute(`UPDATE users SET ${setClauses} WHERE id = ?`, [...Object.values(updates), targetId]);
  }
  const updated = await getUserById(targetId);
  const acts = [];
  if (updates.is_admin !== undefined) acts.push(updates.is_admin ? 'promu admin' : 'rétrogradé');
  if (updates.banned !== undefined) acts.push(updates.banned ? 'banni' : 'débanni');
  if (updates.username !== undefined || updates.email !== undefined) acts.push('profil modifié');
  if (updates.show_in_lfg !== undefined) acts.push('LFG modifié');
  if (acts.length) await logAudit(req.user, `Membre ${acts.join(', ')}`, `${target.username} (#${targetId})`);
  res.json({ success: true, user: sanitizeUser(updated) });
});

app.delete('/admin/users/:id', requireAdmin, async (req, res) => {
  const admin = req.user;
  const targetId = Number(req.params.id);
  if (targetId === admin.id) { return res.status(400).json({ success: false, error: 'Vous ne pouvez pas supprimer votre propre compte' }); }

  const target = await getUserById(targetId);
  if (!target) { return res.status(404).json({ success: false, error: 'Utilisateur introuvable' }); }
  if (target.is_admin) {
    const [[{ admins }]] = await pool.query('SELECT COUNT(*) AS admins FROM users WHERE is_admin = 1');
    if (admins <= 1) { return res.status(400).json({ success: false, error: 'Impossible de supprimer le dernier administrateur' }); }
  }
  try {
    await pool.execute('DELETE FROM users WHERE id = ?', [targetId]);
  } catch {
    return res.status(409).json({ success: false, error: 'Suppression impossible : cet utilisateur a des donnees liees (commandes).' });
  }
  await logAudit(req.user, 'Membre supprimé', `${target.username} (#${targetId})`);
  res.json({ success: true });
});

app.get('/admin/products', requireAdmin, async (req, res) => {
  const [rows] = await pool.query('SELECT id, name, price, category, image_url, stock_quantity FROM products ORDER BY id DESC');
  res.json({ success: true, products: rows.map(r => ({ ...r, price: Number(r.price), stock_quantity: Number(r.stock_quantity) })) });
});

app.post('/admin/products', requireAdmin, async (req, res) => {
  const body = req.body || {};
  const name = String(body.name || '').trim();
  if (!name) { return res.status(400).json({ success: false, error: 'Le nom est requis' }); }
  const [result] = await pool.execute(
    'INSERT INTO products (name, price, category, image_url, stock_quantity) VALUES (?, ?, ?, ?, ?)',
    [name, Number(body.price) || 0, String(body.category || 'ACCESSOIRES'), String(body.image_url || ''), Number(body.stock_quantity) || 0]
  );
  await logAudit(req.user, 'Produit créé', `${name} (#${result.insertId})`);
  res.status(201).json({ success: true, id: result.insertId });
});

app.put('/admin/products/:id', requireAdmin, async (req, res) => {
  const id = Number(req.params.id);
  const body = req.body || {};
  const [[existing]] = await pool.query('SELECT * FROM products WHERE id = ?', [id]);
  if (!existing) { return res.status(404).json({ success: false, error: 'Produit introuvable' }); }
  await pool.execute(
    'UPDATE products SET name = ?, price = ?, category = ?, image_url = ?, stock_quantity = ? WHERE id = ?',
    [
      body.name !== undefined ? String(body.name).trim() : existing.name,
      body.price !== undefined ? Number(body.price) : existing.price,
      body.category !== undefined ? String(body.category) : existing.category,
      body.image_url !== undefined ? String(body.image_url) : existing.image_url,
      body.stock_quantity !== undefined ? Number(body.stock_quantity) : existing.stock_quantity,
      id,
    ]
  );
  res.json({ success: true });
});

app.delete('/admin/products/:id', requireAdmin, async (req, res) => {
  const id = Number(req.params.id);
  const [[existing]] = await pool.query('SELECT name FROM products WHERE id = ?', [id]);
  try {
    await pool.execute('DELETE FROM products WHERE id = ?', [id]);
  } catch {
    return res.status(409).json({ success: false, error: 'Suppression impossible : ce produit figure dans des commandes.' });
  }
  await logAudit(req.user, 'Produit supprimé', `${existing?.name || ''} (#${id})`);
  res.json({ success: true });
});

// ════════════════════════════════════════════════════════
//  DISCORD SERVERS — public list + admin management
// ════════════════════════════════════════════════════════
app.get('/discord-servers', async (req, res) => {
  const [rows] = await pool.query('SELECT id, name, description, invite_url, members, tag, featured FROM discord_servers ORDER BY featured DESC, id ASC');
  res.json({ success: true, servers: rows.map(r => ({ ...r, featured: r.featured ? 1 : 0 })) });
});

app.post('/admin/discord-servers', requireAdmin, async (req, res) => {
  const body = req.body || {};
  const name = String(body.name || '').trim();
  const invite = String(body.inviteUrl || body.invite_url || '').trim();
  if (!name || !invite) { return res.status(400).json({ success: false, error: 'Le nom et le lien d’invitation sont requis' }); }
  const [result] = await pool.execute(
    'INSERT INTO discord_servers (name, description, invite_url, members, tag, featured) VALUES (?, ?, ?, ?, ?, ?)',
    [name, String(body.description || '').trim() || null, invite, String(body.members || '').trim() || null, String(body.tag || '').trim() || null, body.featured ? 1 : 0]
  );
  await logAudit(req.user, 'Serveur Discord ajouté', name);
  res.status(201).json({ success: true, id: result.insertId });
});

app.delete('/admin/discord-servers/:id', requireAdmin, async (req, res) => {
  await pool.execute('DELETE FROM discord_servers WHERE id = ?', [Number(req.params.id)]);
  await logAudit(req.user, 'Serveur Discord retiré', `#${Number(req.params.id)}`);
  res.json({ success: true });
});

app.get('/admin/orders', requireAdmin, async (req, res) => {
  const [orders] = await pool.query(`
    SELECT o.id, o.user_id, o.total_ttc, o.payment_method, o.status, o.created_at, u.username, u.email
    FROM orders o LEFT JOIN users u ON u.id = o.user_id
    ORDER BY o.id DESC
  `);
  const [items] = await pool.query(`
    SELECT oi.order_id, oi.quantity, oi.price_at_purchase, p.name
    FROM order_items oi LEFT JOIN products p ON p.id = oi.product_id
  `);
  const byOrder = {};
  for (const it of items) {
    (byOrder[it.order_id] ||= []).push({ name: it.name || 'Produit supprimé', quantity: it.quantity, price: Number(it.price_at_purchase) });
  }
  res.json({
    success: true,
    orders: orders.map(o => ({ ...o, total_ttc: Number(o.total_ttc), items: byOrder[o.id] || [] })),
  });
});

app.put('/admin/orders/:id', requireAdmin, async (req, res) => {
  const id = Number(req.params.id);
  const body = req.body || {};
  const status = ['Pending', 'Paid', 'Shipped', 'Cancelled'].includes(body.status) ? body.status : null;
  if (!status) { return res.status(400).json({ success: false, error: 'Statut invalide' }); }
  await pool.execute('UPDATE orders SET status = ? WHERE id = ?', [status, id]);
  await logAudit(req.user, 'Statut commande modifié', `#${id} → ${status}`);
  res.json({ success: true });
});

// ── Promo codes management (admin) ──────────────────────────
app.get('/admin/promo-codes', requireAdmin, async (req, res) => {
  const [rows] = await pool.query('SELECT id, code, percent, active, created_at FROM promo_codes ORDER BY id DESC');
  res.json({ success: true, codes: rows.map(r => ({ id: r.id, code: r.code, percent: Number(r.percent), active: r.active ? 1 : 0, createdAt: r.created_at })) });
});

app.post('/admin/promo-codes', requireAdmin, async (req, res) => {
  const body = req.body || {};
  const code = String(body.code || '').trim().toUpperCase();
  const percent = Number(body.percent);
  if (!code) return res.status(400).json({ success: false, error: 'Le code est requis' });
  if (!Number.isFinite(percent) || percent < 1 || percent > 100) {
    return res.status(400).json({ success: false, error: 'Pourcentage invalide (1–100)' });
  }
  try {
    const [r] = await pool.execute('INSERT INTO promo_codes (code, percent, active) VALUES (?, ?, ?)', [code, Math.round(percent), body.active === false ? 0 : 1]);
    await logAudit(req.user, 'Code promo créé', `${code} (−${Math.round(percent)}%)`);
    res.status(201).json({ success: true, id: r.insertId });
  } catch {
    res.status(409).json({ success: false, error: 'Ce code existe déjà' });
  }
});

app.put('/admin/promo-codes/:id', requireAdmin, async (req, res) => {
  const id = Number(req.params.id);
  const body = req.body || {};
  const [[existing]] = await pool.query('SELECT * FROM promo_codes WHERE id = ?', [id]);
  if (!existing) return res.status(404).json({ success: false, error: 'Code introuvable' });
  const updates = {};
  if (body.percent !== undefined) updates.percent = Math.max(1, Math.min(Number(body.percent) || existing.percent, 100));
  if (body.active !== undefined) updates.active = body.active ? 1 : 0;
  if (Object.keys(updates).length > 0) {
    const set = Object.keys(updates).map(k => `${k} = ?`).join(', ');
    await pool.execute(`UPDATE promo_codes SET ${set} WHERE id = ?`, [...Object.values(updates), id]);
    if (updates.active !== undefined) await logAudit(req.user, `Code promo ${updates.active ? 'activé' : 'désactivé'}`, existing.code);
  }
  res.json({ success: true });
});

app.delete('/admin/promo-codes/:id', requireAdmin, async (req, res) => {
  const [[existing]] = await pool.query('SELECT code FROM promo_codes WHERE id = ?', [Number(req.params.id)]);
  await pool.execute('DELETE FROM promo_codes WHERE id = ?', [Number(req.params.id)]);
  await logAudit(req.user, 'Code promo supprimé', existing?.code || `#${Number(req.params.id)}`);
  res.json({ success: true });
});

// Recent admin actions (audit trail).
app.get('/admin/audit-log', requireAdmin, async (req, res) => {
  const [rows] = await pool.query(
    'SELECT id, admin_username, action, target, created_at FROM audit_log ORDER BY id DESC LIMIT 100'
  );
  res.json({ success: true, entries: rows.map(r => ({ id: r.id, admin: r.admin_username, action: r.action, target: r.target || null, createdAt: r.created_at })) });
});

// ── Admin team management (view rosters, add/remove members, 5-player cap) ──
app.get('/admin/teams', requireAdmin, async (req, res) => {
  const [rows] = await pool.query('SELECT id FROM teams ORDER BY id DESC');
  const teams = [];
  for (const r of rows) teams.push(await teamWithMembers(r.id));
  res.json({ success: true, teams: teams.filter(Boolean) });
});

app.post('/admin/teams/:id/members', requireAdmin, async (req, res) => {
  const teamId = Number(req.params.id);
  const [[team]] = await pool.query('SELECT * FROM teams WHERE id = ?', [teamId]);
  if (!team) return res.status(404).json({ success: false, error: 'Équipe introuvable' });

  if (await teamMemberCount(teamId) >= TEAM_MAX_MEMBERS) {
    return res.status(400).json({ success: false, error: `Une équipe ne peut pas dépasser ${TEAM_MAX_MEMBERS} joueurs` });
  }
  const username = String((req.body || {}).username || '').trim();
  if (!username) return res.status(400).json({ success: false, error: 'Pseudo requis' });
  const [[u]] = await pool.query('SELECT id FROM users WHERE username = ?', [username]);
  if (!u) return res.status(404).json({ success: false, error: 'Aucun joueur avec ce pseudo' });

  try {
    await pool.execute('INSERT INTO team_members (team_id, user_id, role) VALUES (?, ?, ?)', [teamId, u.id, 'member']);
  } catch {
    return res.status(409).json({ success: false, error: 'Ce joueur est déjà dans l’équipe' });
  }
  await pushNotification(u.id, 'team', `Tu as été ajouté à l’équipe ${team.name}`);
  await logAudit(req.user, 'Joueur ajouté à une équipe', `${username} → ${team.name}`);
  res.status(201).json({ success: true, team: await teamWithMembers(teamId) });
});

app.delete('/admin/teams/:id/members/:userId', requireAdmin, async (req, res) => {
  const teamId = Number(req.params.id);
  const targetUserId = Number(req.params.userId);
  const [[team]] = await pool.query('SELECT * FROM teams WHERE id = ?', [teamId]);
  if (!team) return res.status(404).json({ success: false, error: 'Équipe introuvable' });
  if (targetUserId === team.owner_id) {
    return res.status(400).json({ success: false, error: 'Impossible de retirer le capitaine (supprimez l’équipe à la place)' });
  }
  await pool.execute('DELETE FROM team_members WHERE team_id = ? AND user_id = ?', [teamId, targetUserId]);
  await logAudit(req.user, 'Joueur retiré d’une équipe', `#${targetUserId} ← ${team.name}`);
  res.json({ success: true, team: await teamWithMembers(teamId) });
});

// ════════════════════════════════════════════════════════
//  TEAMS
// ════════════════════════════════════════════════════════
const teamWithMembers = async (teamId, includeRequests = false) => {
  const [[team]] = await pool.query('SELECT * FROM teams WHERE id = ?', [teamId]);
  if (!team) return null;
  const [members] = await pool.query(
    `SELECT tm.user_id, tm.role, u.username, u.avatar_url, u.rank_label
     FROM team_members tm JOIN users u ON u.id = tm.user_id
     WHERE tm.team_id = ? ORDER BY (tm.role = 'owner') DESC, tm.joined_at ASC`,
    [teamId]
  );
  let requests = [];
  if (includeRequests) {
    const [reqRows] = await pool.query(
      `SELECT r.user_id, u.username, u.rank_label FROM team_requests r JOIN users u ON u.id = r.user_id
       WHERE r.team_id = ? AND r.status = 'pending' ORDER BY r.created_at ASC`,
      [teamId]
    );
    requests = reqRows.map(r => ({ userId: r.user_id, username: r.username, rankLabel: r.rank_label || null }));
  }
  return {
    id: team.id,
    name: team.name,
    tag: team.tag || null,
    ownerId: team.owner_id,
    logoUrl: team.logo_url || null,
    description: team.description || null,
    createdAt: team.created_at,
    members: members.map(m => ({
      userId: m.user_id, username: m.username, role: m.role,
      avatarUrl: m.avatar_url || null, rankLabel: m.rank_label || null,
    })),
    requests,
  };
};

// Create a team — creator becomes the owner and first member.
app.post('/teams', requireAuth, async (req, res) => {
  const body = req.body || {};
  const name = String(body.name || '').trim();
  if (!name) return res.status(400).json({ success: false, error: 'Le nom de l’équipe est requis' });
  const tag = String(body.tag || '').trim().slice(0, 10) || null;
  const logoUrl = String(body.logoUrl || '').trim() || null;
  const description = String(body.description || '').trim() || null;

  const [result] = await pool.execute(
    'INSERT INTO teams (name, tag, owner_id, logo_url, description) VALUES (?, ?, ?, ?, ?)',
    [name, tag, req.userId, logoUrl, description]
  );
  await pool.execute(
    'INSERT INTO team_members (team_id, user_id, role) VALUES (?, ?, ?)',
    [result.insertId, req.userId, 'owner']
  );
  res.status(201).json({ success: true, team: await teamWithMembers(result.insertId) });
});

// Teams the caller owns or belongs to.
app.get('/teams/mine', requireAuth, async (req, res) => {
  const [rows] = await pool.query(
    'SELECT DISTINCT team_id FROM team_members WHERE user_id = ?',
    [req.userId]
  );
  const teams = [];
  for (const r of rows) teams.push(await teamWithMembers(r.team_id, true));
  res.json({ success: true, teams: teams.filter(Boolean) });
});

// Public list of all teams (with member count).
app.get('/teams', async (req, res) => {
  const [rows] = await pool.query(`
    SELECT t.id, t.name, t.tag, t.owner_id, t.logo_url, t.created_at,
           (SELECT COUNT(*) FROM team_members tm WHERE tm.team_id = t.id) AS member_count
    FROM teams t ORDER BY t.id DESC
  `);
  res.json({
    success: true,
    teams: rows.map(t => ({
      id: t.id, name: t.name, tag: t.tag || null, ownerId: t.owner_id,
      logoUrl: t.logo_url || null, memberCount: Number(t.member_count),
    })),
  });
});

app.get('/teams/:id', async (req, res) => {
  const team = await teamWithMembers(Number(req.params.id));
  if (!team) return res.status(404).json({ success: false, error: 'Équipe introuvable' });
  res.json({ success: true, team });
});

// A player asks to join a team — notifies the captain.
app.post('/teams/:id/request', requireAuth, async (req, res) => {
  const teamId = Number(req.params.id);
  const [[team]] = await pool.query('SELECT * FROM teams WHERE id = ?', [teamId]);
  if (!team) return res.status(404).json({ success: false, error: 'Équipe introuvable' });

  const [[member]] = await pool.query('SELECT 1 AS x FROM team_members WHERE team_id = ? AND user_id = ?', [teamId, req.userId]);
  if (member) return res.status(400).json({ success: false, error: 'Tu fais déjà partie de cette équipe' });

  try {
    await pool.execute('INSERT INTO team_requests (team_id, user_id, status) VALUES (?, ?, ?)', [teamId, req.userId, 'pending']);
  } catch {
    // Existing row → re-open it as pending (e.g. after a previous decline).
    await pool.execute("UPDATE team_requests SET status = 'pending', created_at = NOW() WHERE team_id = ? AND user_id = ?", [teamId, req.userId]);
  }
  const me = await getUserById(req.userId);
  await pushNotification(team.owner_id, 'team', `${me?.username || 'Un joueur'} souhaite rejoindre ${team.name}`);
  res.status(201).json({ success: true });
});

// Captain accepts a pending request → the player joins the team.
app.post('/teams/:id/requests/:userId/accept', requireAuth, async (req, res) => {
  const teamId = Number(req.params.id);
  const targetUserId = Number(req.params.userId);
  const [[team]] = await pool.query('SELECT * FROM teams WHERE id = ?', [teamId]);
  if (!team) return res.status(404).json({ success: false, error: 'Équipe introuvable' });
  if (team.owner_id !== req.userId) return res.status(403).json({ success: false, error: 'Seul le capitaine peut accepter les demandes' });

  const [[pending]] = await pool.query("SELECT 1 AS x FROM team_requests WHERE team_id = ? AND user_id = ? AND status = 'pending'", [teamId, targetUserId]);
  if (!pending) return res.status(404).json({ success: false, error: 'Demande introuvable' });

  if (await teamMemberCount(teamId) >= TEAM_MAX_MEMBERS) {
    return res.status(400).json({ success: false, error: `L’équipe est complète (${TEAM_MAX_MEMBERS} joueurs max)` });
  }
  try {
    await pool.execute('INSERT INTO team_members (team_id, user_id, role) VALUES (?, ?, ?)', [teamId, targetUserId, 'member']);
  } catch { /* already a member */ }
  await pool.execute('DELETE FROM team_requests WHERE team_id = ? AND user_id = ?', [teamId, targetUserId]);
  await pushNotification(targetUserId, 'team', `Ta demande pour rejoindre ${team.name} a été acceptée ✓`);
  res.json({ success: true, team: await teamWithMembers(teamId, true) });
});

// Captain declines a pending request.
app.post('/teams/:id/requests/:userId/decline', requireAuth, async (req, res) => {
  const teamId = Number(req.params.id);
  const targetUserId = Number(req.params.userId);
  const [[team]] = await pool.query('SELECT * FROM teams WHERE id = ?', [teamId]);
  if (!team) return res.status(404).json({ success: false, error: 'Équipe introuvable' });
  if (team.owner_id !== req.userId) return res.status(403).json({ success: false, error: 'Seul le capitaine peut refuser les demandes' });

  await pool.execute("UPDATE team_requests SET status = 'declined' WHERE team_id = ? AND user_id = ?", [teamId, targetUserId]);
  await pushNotification(targetUserId, 'team', `Ta demande pour rejoindre ${team.name} a été refusée`);
  res.json({ success: true, team: await teamWithMembers(teamId, true) });
});

// Owner adds a member by username.
app.post('/teams/:id/members', requireAuth, async (req, res) => {
  const teamId = Number(req.params.id);
  const [[team]] = await pool.query('SELECT * FROM teams WHERE id = ?', [teamId]);
  if (!team) return res.status(404).json({ success: false, error: 'Équipe introuvable' });
  if (team.owner_id !== req.userId) return res.status(403).json({ success: false, error: 'Seul le capitaine peut ajouter des membres' });

  if (await teamMemberCount(teamId) >= TEAM_MAX_MEMBERS) {
    return res.status(400).json({ success: false, error: `Une équipe ne peut pas dépasser ${TEAM_MAX_MEMBERS} joueurs` });
  }
  const username = String((req.body || {}).username || '').trim();
  if (!username) return res.status(400).json({ success: false, error: 'Pseudo requis' });
  const [[u]] = await pool.query('SELECT id FROM users WHERE username = ?', [username]);
  if (!u) return res.status(404).json({ success: false, error: 'Aucun joueur avec ce pseudo' });

  try {
    await pool.execute('INSERT INTO team_members (team_id, user_id, role) VALUES (?, ?, ?)', [teamId, u.id, 'member']);
  } catch {
    return res.status(409).json({ success: false, error: 'Ce joueur est déjà dans l’équipe' });
  }
  await pushNotification(u.id, 'team', `Tu as rejoint l’équipe ${team.name}`);
  res.status(201).json({ success: true, team: await teamWithMembers(teamId) });
});

// Remove a member (owner removes anyone but self; a member can remove themselves).
app.delete('/teams/:id/members/:userId', requireAuth, async (req, res) => {
  const teamId = Number(req.params.id);
  const targetUserId = Number(req.params.userId);
  const [[team]] = await pool.query('SELECT * FROM teams WHERE id = ?', [teamId]);
  if (!team) return res.status(404).json({ success: false, error: 'Équipe introuvable' });

  const isOwner = team.owner_id === req.userId;
  if (!isOwner && targetUserId !== req.userId) {
    return res.status(403).json({ success: false, error: 'Action non autorisée' });
  }
  if (targetUserId === team.owner_id) {
    return res.status(400).json({ success: false, error: 'Le capitaine ne peut pas quitter son équipe (supprimez-la plutôt)' });
  }
  await pool.execute('DELETE FROM team_members WHERE team_id = ? AND user_id = ?', [teamId, targetUserId]);
  res.json({ success: true, team: await teamWithMembers(teamId) });
});

// Delete a team (owner only). Also clears its tournament registrations.
app.delete('/teams/:id', requireAuth, async (req, res) => {
  const teamId = Number(req.params.id);
  const [[team]] = await pool.query('SELECT * FROM teams WHERE id = ?', [teamId]);
  if (!team) return res.status(404).json({ success: false, error: 'Équipe introuvable' });
  if (team.owner_id !== req.userId) return res.status(403).json({ success: false, error: 'Seul le capitaine peut supprimer l’équipe' });

  await pool.execute('DELETE FROM team_members WHERE team_id = ?', [teamId]);
  await pool.execute('DELETE FROM tournament_registrations WHERE team_id = ?', [teamId]);
  await pool.execute('DELETE FROM teams WHERE id = ?', [teamId]);
  res.json({ success: true });
});

// ════════════════════════════════════════════════════════
//  TOURNAMENTS (own) + single-elimination brackets
// ════════════════════════════════════════════════════════
const nextPow2 = (n) => { let p = 1; while (p < n) p *= 2; return Math.max(p, 2); };

// Advance a match winner into the appropriate slot of the next round.
// When the final is decided, the tournament is marked completed.
const advanceWinner = async (tournamentId, match, winnerId) => {
  await pool.execute(
    'UPDATE tournament_matches SET winner_id = ?, status = ? WHERE id = ?',
    [winnerId, 'done', match.id]
  );
  const [[{ maxRound }]] = await pool.query(
    'SELECT MAX(round) AS maxRound FROM tournament_matches WHERE tournament_id = ?',
    [tournamentId]
  );
  if (match.round >= maxRound) {
    await pool.execute("UPDATE tournaments SET status = 'completed' WHERE id = ?", [tournamentId]);
    return;
  }
  const nextSlot = Math.floor(match.slot / 2);
  const col = match.slot % 2 === 0 ? 'team1_id' : 'team2_id';
  const [[next]] = await pool.query(
    'SELECT id FROM tournament_matches WHERE tournament_id = ? AND round = ? AND slot = ?',
    [tournamentId, match.round + 1, nextSlot]
  );
  if (next) await pool.execute(`UPDATE tournament_matches SET ${col} = ? WHERE id = ?`, [winnerId, next.id]);
};

// Build a full single-elimination bracket from a list of team ids.
const generateBracket = async (tournamentId, teamIds) => {
  const size = nextPow2(teamIds.length);
  const rounds = Math.round(Math.log2(size));
  const slots = Array.from({ length: size }, (_, i) => teamIds[i] ?? null);

  const round1 = [];
  for (let r = 1; r <= rounds; r++) {
    const count = size / Math.pow(2, r);
    for (let slot = 0; slot < count; slot++) {
      const t1 = r === 1 ? (slots[slot * 2] ?? null) : null;
      const t2 = r === 1 ? (slots[slot * 2 + 1] ?? null) : null;
      const [ins] = await pool.execute(
        'INSERT INTO tournament_matches (tournament_id, round, slot, team1_id, team2_id, status) VALUES (?, ?, ?, ?, ?, ?)',
        [tournamentId, r, slot, t1, t2, 'upcoming']
      );
      if (r === 1) round1.push({ id: ins.insertId, round: 1, slot, team1_id: t1, team2_id: t2 });
    }
  }
  // Auto-advance first-round byes (a match with only one team present).
  for (const m of round1) {
    if (m.team1_id && !m.team2_id) await advanceWinner(tournamentId, m, m.team1_id);
    else if (!m.team1_id && m.team2_id) await advanceWinner(tournamentId, m, m.team2_id);
  }
};

const tournamentDetail = async (tournamentId) => {
  const [[t]] = await pool.query('SELECT * FROM tournaments WHERE id = ?', [tournamentId]);
  if (!t) return null;
  const [regs] = await pool.query(
    `SELECT r.team_id, r.checked_in, tm.name, tm.tag, tm.logo_url
     FROM tournament_registrations r JOIN teams tm ON tm.id = r.team_id
     WHERE r.tournament_id = ? ORDER BY r.registered_at ASC`,
    [tournamentId]
  );
  const [matches] = await pool.query(
    'SELECT * FROM tournament_matches WHERE tournament_id = ? ORDER BY round ASC, slot ASC',
    [tournamentId]
  );
  return {
    id: t.id, name: t.name, format: t.format, maxTeams: t.max_teams,
    region: t.region || null, prizePool: t.prize_pool || null,
    startsAt: t.starts_at, status: t.status, createdBy: t.created_by, createdAt: t.created_at,
    teams: regs.map(r => ({ teamId: r.team_id, name: r.name, tag: r.tag || null, logoUrl: r.logo_url || null, checkedIn: r.checked_in ? 1 : 0 })),
    matches: matches.map(m => ({
      id: m.id, round: m.round, slot: m.slot,
      team1Id: m.team1_id, team2Id: m.team2_id,
      score1: m.score1, score2: m.score2, winnerId: m.winner_id, status: m.status,
    })),
  };
};

app.post('/tournaments', requireAuth, async (req, res) => {
  const body = req.body || {};
  const name = String(body.name || '').trim();
  if (!name) return res.status(400).json({ success: false, error: 'Le nom du tournoi est requis' });
  const maxTeams = nextPow2(Math.max(2, Math.min(Number(body.maxTeams) || 8, 64)));
  const region = String(body.region || '').trim() || null;
  const prizePool = String(body.prizePool || '').trim() || null;
  const startsAt = body.startsAt ? new Date(body.startsAt) : null;
  const startsAtSql = startsAt && !Number.isNaN(startsAt.getTime())
    ? startsAt.toISOString().slice(0, 19).replace('T', ' ') : null;

  const [result] = await pool.execute(
    'INSERT INTO tournaments (name, format, max_teams, region, prize_pool, starts_at, created_by) VALUES (?, ?, ?, ?, ?, ?, ?)',
    [name, 'SE', maxTeams, region, prizePool, startsAtSql, req.userId]
  );
  res.status(201).json({ success: true, tournament: await tournamentDetail(result.insertId) });
});

// List own (DB-backed) tournaments — not the vlr.gg feed.
app.get('/tournaments', async (req, res) => {
  const [rows] = await pool.query(`
    SELECT t.*,
           (SELECT COUNT(*) FROM tournament_registrations r WHERE r.tournament_id = t.id) AS team_count
    FROM tournaments t ORDER BY t.id DESC
  `);
  res.json({
    success: true,
    tournaments: rows.map(t => ({
      id: t.id, name: t.name, format: t.format, maxTeams: t.max_teams,
      region: t.region || null, prizePool: t.prize_pool || null,
      startsAt: t.starts_at, status: t.status, createdBy: t.created_by,
      teamCount: Number(t.team_count),
    })),
  });
});

app.get('/tournaments/:id', async (req, res) => {
  const detail = await tournamentDetail(Number(req.params.id));
  if (!detail) return res.status(404).json({ success: false, error: 'Tournoi introuvable' });
  res.json({ success: true, tournament: detail });
});

// Register one of the caller's teams into an open tournament.
app.post('/tournaments/:id/register', requireAuth, async (req, res) => {
  const tournamentId = Number(req.params.id);
  const teamId = Number((req.body || {}).teamId);
  const [[t]] = await pool.query('SELECT * FROM tournaments WHERE id = ?', [tournamentId]);
  if (!t) return res.status(404).json({ success: false, error: 'Tournoi introuvable' });
  if (t.status !== 'open') return res.status(400).json({ success: false, error: 'Les inscriptions sont fermées' });

  const [[team]] = await pool.query('SELECT * FROM teams WHERE id = ?', [teamId]);
  if (!team) return res.status(404).json({ success: false, error: 'Équipe introuvable' });
  if (team.owner_id !== req.userId) return res.status(403).json({ success: false, error: 'Seul le capitaine peut inscrire l’équipe' });

  const [[{ cnt }]] = await pool.query('SELECT COUNT(*) AS cnt FROM tournament_registrations WHERE tournament_id = ?', [tournamentId]);
  if (cnt >= t.max_teams) return res.status(400).json({ success: false, error: 'Le tournoi est complet' });

  try {
    await pool.execute('INSERT INTO tournament_registrations (tournament_id, team_id) VALUES (?, ?)', [tournamentId, teamId]);
  } catch {
    return res.status(409).json({ success: false, error: 'Cette équipe est déjà inscrite' });
  }
  for (const uid of await teamMemberIds(teamId)) {
    await pushNotification(uid, 'tournament', `${team.name} est inscrite à « ${t.name} »`);
  }
  const detail = await tournamentDetail(tournamentId);
  wsBroadcast({ type: 'tournament', tournamentId, tournament: detail });
  res.status(201).json({ success: true, tournament: detail });
});

// Withdraw a team while registration is still open.
app.delete('/tournaments/:id/register/:teamId', requireAuth, async (req, res) => {
  const tournamentId = Number(req.params.id);
  const teamId = Number(req.params.teamId);
  const [[t]] = await pool.query('SELECT * FROM tournaments WHERE id = ?', [tournamentId]);
  if (!t) return res.status(404).json({ success: false, error: 'Tournoi introuvable' });
  if (t.status !== 'open') return res.status(400).json({ success: false, error: 'Le tournoi a déjà commencé' });
  const [[team]] = await pool.query('SELECT * FROM teams WHERE id = ?', [teamId]);
  if (team && team.owner_id !== req.userId && t.created_by !== req.userId) {
    return res.status(403).json({ success: false, error: 'Action non autorisée' });
  }
  await pool.execute('DELETE FROM tournament_registrations WHERE tournament_id = ? AND team_id = ?', [tournamentId, teamId]);
  const detail = await tournamentDetail(tournamentId);
  wsBroadcast({ type: 'tournament', tournamentId, tournament: detail });
  res.json({ success: true, tournament: detail });
});

// Lock registration and generate the bracket (organizer only).
app.post('/tournaments/:id/start', requireAuth, async (req, res) => {
  const tournamentId = Number(req.params.id);
  const [[t]] = await pool.query('SELECT * FROM tournaments WHERE id = ?', [tournamentId]);
  if (!t) return res.status(404).json({ success: false, error: 'Tournoi introuvable' });
  if (t.created_by !== req.userId) return res.status(403).json({ success: false, error: 'Seul l’organisateur peut lancer le tournoi' });
  if (t.status !== 'open') return res.status(400).json({ success: false, error: 'Le tournoi a déjà été lancé' });

  const [regs] = await pool.query('SELECT team_id FROM tournament_registrations WHERE tournament_id = ? ORDER BY registered_at ASC', [tournamentId]);
  if (regs.length < 2) return res.status(400).json({ success: false, error: 'Il faut au moins 2 équipes inscrites' });

  await generateBracket(tournamentId, regs.map(r => r.team_id));
  await pool.execute("UPDATE tournaments SET status = 'live' WHERE id = ?", [tournamentId]);
  for (const r of regs) {
    for (const uid of await teamMemberIds(r.team_id)) {
      await pushNotification(uid, 'tournament', `Le tournoi « ${t.name} » a commencé — bonne chance !`);
    }
  }
  const detail = await tournamentDetail(tournamentId);
  wsBroadcast({ type: 'tournament', tournamentId, tournament: detail });
  res.json({ success: true, tournament: detail });
});

// Report a match score (organizer only) — winner advances automatically.
app.put('/tournaments/:id/matches/:matchId', requireAuth, async (req, res) => {
  const tournamentId = Number(req.params.id);
  const matchId = Number(req.params.matchId);
  const [[t]] = await pool.query('SELECT * FROM tournaments WHERE id = ?', [tournamentId]);
  if (!t) return res.status(404).json({ success: false, error: 'Tournoi introuvable' });
  if (t.created_by !== req.userId) return res.status(403).json({ success: false, error: 'Seul l’organisateur peut saisir les scores' });

  const [[m]] = await pool.query('SELECT * FROM tournament_matches WHERE id = ? AND tournament_id = ?', [matchId, tournamentId]);
  if (!m) return res.status(404).json({ success: false, error: 'Match introuvable' });
  if (m.status === 'done') return res.status(400).json({ success: false, error: 'Ce match est déjà terminé' });
  if (!m.team1_id || !m.team2_id) return res.status(400).json({ success: false, error: 'Les deux équipes ne sont pas encore connues' });

  const body = req.body || {};
  const score1 = Number(body.score1);
  const score2 = Number(body.score2);
  if (!Number.isFinite(score1) || !Number.isFinite(score2) || score1 < 0 || score2 < 0) {
    return res.status(400).json({ success: false, error: 'Scores invalides' });
  }
  if (score1 === score2) return res.status(400).json({ success: false, error: 'Un match ne peut pas se terminer sur une égalité' });

  const winnerId = score1 > score2 ? m.team1_id : m.team2_id;
  await pool.execute('UPDATE tournament_matches SET score1 = ?, score2 = ? WHERE id = ?', [score1, score2, matchId]);
  await advanceWinner(tournamentId, m, winnerId);
  const detail = await tournamentDetail(tournamentId);
  wsBroadcast({ type: 'tournament', tournamentId, tournament: detail });
  res.json({ success: true, tournament: detail });
});

// ── Fallbacks ───────────────────────────────────────────────
// Unknown route → 404 (same shape as before).
app.use((req, res) => {
  res.status(404).json({ success: false, error: 'Route introuvable' });
});

// Centralised error handler → 500 (replaces the per-route try/catch).
app.use((err, req, res, next) => {
  console.error('API error:', err);
  if (res.headersSent) return next(err);
  res.status(500).json({ success: false, error: 'Erreur serveur' });
});

initDb().then(() => {
  const server = app.listen(API_PORT, () => {
    console.log(`Local API running on http://localhost:${API_PORT}`);
  });

  // WebSocket server on /ws — the session token (query param) is verified at the
  // handshake, so unauthenticated clients are rejected before the upgrade completes.
  const wss = new WebSocketServer({
    server,
    path: '/ws',
    verifyClient: (info, cb) => {
      (async () => {
        try {
          const url = new URL(info.req.url || '/', `http://${info.req.headers.host}`);
          const token = url.searchParams.get('token');
          const [[row]] = token
            ? await pool.query('SELECT user_id FROM sessions WHERE token = ? AND expires_at > NOW()', [token])
            : [[]];
          if (row) { info.req.userId = row.user_id; cb(true); }
          else cb(false, 401, 'Unauthorized');
        } catch (err) {
          console.error('ws verify error:', err);
          cb(false, 500, 'Server error');
        }
      })();
    },
  });
  wss.on('connection', (ws, req) => {
    const userId = req.userId;
    if (!userId) { ws.close(); return; }
    if (!wsClients.has(userId)) wsClients.set(userId, new Set());
    wsClients.get(userId).add(ws);
    ws.send(JSON.stringify({ type: 'connected' }));
    ws.on('close', () => {
      const set = wsClients.get(userId);
      if (set) { set.delete(ws); if (!set.size) wsClients.delete(userId); }
    });
    ws.on('error', () => { try { ws.close(); } catch { /* ignore */ } });
  });
  console.log(`WebSocket server ready on ws://localhost:${API_PORT}/ws`);
}).catch(err => {
  console.error('DB init failed:', err);
  process.exit(1);
});
