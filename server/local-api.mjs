import dotenv from 'dotenv';
import http from 'http';
import { URL } from 'url';
import crypto from 'crypto';
import mysql from 'mysql2/promise';
import bcrypt from 'bcryptjs';

dotenv.config();

const API_PORT = Number(process.env.API_PORT || 3001);
const SALT_ROUNDS = 10;

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

const sessions = new Map();

const setCors = (res) => {
  res.setHeader('Access-Control-Allow-Origin', 'http://localhost:5173');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
};

const sendJson = (res, statusCode, payload) => {
  setCors(res);
  res.writeHead(statusCode, { 'Content-Type': 'application/json; charset=utf-8' });
  res.end(JSON.stringify(payload));
};

const readJsonBody = (req) =>
  new Promise((resolve, reject) => {
    let body = '';
    req.on('data', (chunk) => {
      body += chunk.toString();
    });
    req.on('end', () => {
      if (!body) {
        resolve({});
        return;
      }
      try {
        resolve(JSON.parse(body));
      } catch {
        reject(new Error('Corps JSON invalide'));
      }
    });
    req.on('error', reject);
  });

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
});

const USER_COLS = 'id, username, email, riot_id, tag_line, created_at, bio, discord, twitter, twitch, youtube, rank_label, roles, region, languages, playtimes, show_in_lfg, lfg_status, is_admin';

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
  // 'Cancelled' may be missing from an older enum — widen it
  try {
    await pool.execute("ALTER TABLE orders MODIFY status ENUM('Pending','Paid','Shipped','Cancelled') DEFAULT 'Paid'");
  } catch { /* ok */ }

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

const getSessionUser = async (req) => {
  const userId = getSessionUserId(req);
  if (!userId) return null;
  return getUserById(userId);
};

const requireAdmin = async (req, res) => {
  const user = await getSessionUser(req);
  if (!user) { sendJson(res, 401, { success: false, error: 'Non authentifie' }); return null; }
  if (!user.is_admin) { sendJson(res, 403, { success: false, error: 'Acces reserve aux administrateurs' }); return null; }
  return user;
};

const getBearerToken = (req) => {
  const auth = req.headers.authorization || '';
  if (!auth.startsWith('Bearer ')) {
    return null;
  }
  return auth.slice(7).trim();
};

const getSessionUserId = (req) => {
  const token = getBearerToken(req);
  if (!token || !sessions.has(token)) {
    return null;
  }
  return sessions.get(token);
};

const createSession = (userId) => {
  const token = crypto.randomBytes(24).toString('hex');
  sessions.set(token, userId);
  return token;
};

const server = http.createServer(async (req, res) => {
  setCors(res);

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  const url = new URL(req.url || '/', `http://${req.headers.host}`);

  try {
    if (req.method === 'GET' && url.pathname === '/health') {
      await pool.query('SELECT 1');
      sendJson(res, 200, { success: true });
      return;
    }

    if (req.method === 'POST' && url.pathname === '/auth/register') {
      const body = await readJsonBody(req);
      const username = String(body.username || '').trim();
      const email = String(body.email || '').trim().toLowerCase();
      const password = String(body.password || '');

      if (!username || !email || !password) {
        sendJson(res, 400, { success: false, error: 'Champs requis manquants' });
        return;
      }

      if (password.length < 6) {
        sendJson(res, 400, { success: false, error: 'Le mot de passe doit contenir au moins 6 caracteres' });
        return;
      }

      const existing = await getUserByEmail(email);
      if (existing) {
        sendJson(res, 409, { success: false, error: 'Cet email est deja utilise' });
        return;
      }

      const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
      const [insertResult] = await pool.execute(
        'INSERT INTO users (username, email, password_hash) VALUES (?, ?, ?)',
        [username, email, passwordHash]
      );

      const user = await getUserById(insertResult.insertId);
      const token = createSession(user.id);
      sendJson(res, 201, { success: true, user: sanitizeUser(user), token });
      return;
    }

    if (req.method === 'POST' && url.pathname === '/auth/login') {
      const body = await readJsonBody(req);
      const email = String(body.email || '').trim().toLowerCase();
      const password = String(body.password || '');

      const user = await getUserByEmail(email);
      if (!user) {
        sendJson(res, 401, { success: false, error: 'Email ou mot de passe incorrect' });
        return;
      }

      const valid = await bcrypt.compare(password, user.password_hash);
      if (!valid) {
        sendJson(res, 401, { success: false, error: 'Email ou mot de passe incorrect' });
        return;
      }

      const token = createSession(user.id);
      sendJson(res, 200, { success: true, user: sanitizeUser(user), token });
      return;
    }

    if (req.method === 'GET' && url.pathname === '/auth/me') {
      const token = getBearerToken(req);
      if (!token || !sessions.has(token)) {
        sendJson(res, 200, { success: true });
        return;
      }

      const userId = sessions.get(token);
      const user = await getUserById(userId);
      if (!user) {
        sessions.delete(token);
        sendJson(res, 200, { success: true });
        return;
      }

      sendJson(res, 200, { success: true, user: sanitizeUser(user) });
      return;
    }

    if (req.method === 'POST' && url.pathname === '/auth/logout') {
      const token = getBearerToken(req);
      if (token) {
        sessions.delete(token);
      }
      sendJson(res, 200, { success: true });
      return;
    }

    if (req.method === 'PUT' && /^\/users\/\d+\/profile$/.test(url.pathname)) {
      const match = url.pathname.match(/^\/users\/(\d+)\/profile$/);
      const userId = Number(match?.[1]);
      const sessionUserId = getSessionUserId(req);

      if (!sessionUserId) {
        sendJson(res, 401, { success: false, error: 'Non authentifie' });
        return;
      }

      if (sessionUserId !== userId) {
        sendJson(res, 403, { success: false, error: 'Acces refuse' });
        return;
      }

      const body = await readJsonBody(req);

      const currentUser = await getUserById(userId);
      if (!currentUser) {
        sendJson(res, 404, { success: false, error: 'Utilisateur introuvable' });
        return;
      }

      // Check email uniqueness before building update
      if (body.email !== undefined) {
        const e = String(body.email || '').trim().toLowerCase();
        if (e && e !== currentUser.email) {
          const existing = await getUserByEmail(e);
          if (existing && existing.id !== userId) {
            sendJson(res, 409, { success: false, error: 'Cet email est deja utilise' });
            return;
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
        sendJson(res, 404, { success: false, error: 'Utilisateur introuvable' });
        return;
      }

      sendJson(res, 200, { success: true, user: sanitizeUser(updatedUser) });
      return;
    }

    if (req.method === 'PUT' && /^\/users\/\d+\/password$/.test(url.pathname)) {
      const match = url.pathname.match(/^\/users\/(\d+)\/password$/);
      const userId = Number(match?.[1]);
      const sessionUserId = getSessionUserId(req);

      if (!sessionUserId) {
        sendJson(res, 401, { success: false, error: 'Non authentifie' });
        return;
      }

      if (sessionUserId !== userId) {
        sendJson(res, 403, { success: false, error: 'Acces refuse' });
        return;
      }

      const body = await readJsonBody(req);
      const password = String(body.password || '');

      if (password.length < 6) {
        sendJson(res, 400, { success: false, error: 'Le mot de passe doit contenir au moins 6 caracteres' });
        return;
      }

      const currentUser = await getUserById(userId);
      if (!currentUser) {
        sendJson(res, 404, { success: false, error: 'Utilisateur introuvable' });
        return;
      }

      const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
      await pool.execute('UPDATE users SET password_hash = ? WHERE id = ?', [passwordHash, userId]);
      sendJson(res, 200, { success: true });
      return;
    }

    // Riot proxy — player profile (official Riot API)
    const riotPlayerMatch = url.pathname.match(/^\/riot\/player\/([^/]+)\/([^/]+)$/);
    if (req.method === 'GET' && riotPlayerMatch) {
      const name = decodeURIComponent(riotPlayerMatch[1]);
      const tag  = decodeURIComponent(riotPlayerMatch[2]);
      const apiKey = process.env.RIOT_API_KEY || '';

      if (!apiKey) {
        sendJson(res, 503, { success: false, needsApiKey: true, error: 'Clé API Riot manquante dans le fichier .env (RIOT_API_KEY=RGAPI-...)' });
        return;
      }

      const riotHeaders = { 'X-Riot-Token': apiKey };

      try {
        // 1. Account lookup (global endpoint)
        const accountRes = await fetch(
          `https://europe.api.riotgames.com/riot/account/v1/accounts/by-riot-id/${encodeURIComponent(name)}/${encodeURIComponent(tag)}`,
          { headers: riotHeaders }
        );

        if (accountRes.status === 401 || accountRes.status === 403) {
          sendJson(res, 503, { success: false, needsApiKey: true, error: 'Clé API Riot invalide ou expirée. Renouvelle-la sur developer.riotgames.com (valide 24h).' });
          return;
        }
        if (!accountRes.ok) {
          sendJson(res, 404, { success: false, error: 'Joueur introuvable. Vérifie le pseudo et le tag.' });
          return;
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

        // Valorant tier names
        const TIER_NAMES = [
          'Non classé','Non classé','Non classé','Iron 1','Iron 2','Iron 3',
          'Bronze 1','Bronze 2','Bronze 3','Silver 1','Silver 2','Silver 3',
          'Gold 1','Gold 2','Gold 3','Platinum 1','Platinum 2','Platinum 3',
          'Diamond 1','Diamond 2','Diamond 3','Ascendant 1','Ascendant 2','Ascendant 3',
          'Immortal 1','Immortal 2','Immortal 3','Radiant',
        ];
        if (currentTier !== null) {
          currentTierName = TIER_NAMES[currentTier] ?? 'Non classé';
        }

        sendJson(res, 200, {
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
        sendJson(res, 502, { success: false, error: 'Erreur lors de la connexion aux serveurs Riot' });
      }
      return;
    }

    // Riot proxy — match history (official Riot API)
    const riotMatchesMatch = url.pathname.match(/^\/riot\/matches\/([^/]+)\/([^/]+)$/);
    if (req.method === 'GET' && riotMatchesMatch) {
      const name = decodeURIComponent(riotMatchesMatch[1]);
      const tag  = decodeURIComponent(riotMatchesMatch[2]);
      const size = Math.min(Number(url.searchParams.get('size') || '5'), 8);
      const apiKey = process.env.RIOT_API_KEY || '';

      if (!apiKey) {
        sendJson(res, 200, { success: true, matches: [] });
        return;
      }

      const riotHeaders = { 'X-Riot-Token': apiKey };
      const region = process.env.RIOT_REGION || 'eu';

      try {
        // Get PUUID
        const accountRes = await fetch(
          `https://europe.api.riotgames.com/riot/account/v1/accounts/by-riot-id/${encodeURIComponent(name)}/${encodeURIComponent(tag)}`,
          { headers: riotHeaders }
        );
        if (!accountRes.ok) { sendJson(res, 200, { success: true, matches: [] }); return; }
        const { puuid } = await accountRes.json();

        // Get match list
        const matchListRes = await fetch(
          `https://${region}.api.riotgames.com/val/match/v1/matchlists/by-puuid/${puuid}`,
          { headers: riotHeaders }
        );
        if (!matchListRes.ok) { sendJson(res, 200, { success: true, matches: [] }); return; }
        const matchList = await matchListRes.json();
        const recentIds = (matchList.history || []).slice(0, size).map((m) => m.matchId);

        // Get match details in parallel
        const details = await Promise.all(
          recentIds.map((id) =>
            fetch(`https://${region}.api.riotgames.com/val/match/v1/matches/${id}`, { headers: riotHeaders })
              .then((r) => (r.ok ? r.json() : null))
              .catch(() => null)
          )
        );

        const TIER_NAMES = [
          'Non classé','Non classé','Non classé','Iron 1','Iron 2','Iron 3',
          'Bronze 1','Bronze 2','Bronze 3','Silver 1','Silver 2','Silver 3',
          'Gold 1','Gold 2','Gold 3','Platinum 1','Platinum 2','Platinum 3',
          'Diamond 1','Diamond 2','Diamond 3','Ascendant 1','Ascendant 2','Ascendant 3',
          'Immortal 1','Immortal 2','Immortal 3','Radiant',
        ];

        const matches = details
          .filter(Boolean)
          .map((match) => {
            const player = match.players?.find((p) => p.puuid === puuid);
            if (!player) return null;

            const myTeam = match.teams?.find((t) => t.teamId === player.teamId);
            const won = myTeam?.won === true;
            const mapId = match.matchInfo?.mapId || '';
            const mapName = mapId.split('/').pop() || 'Unknown';

            return {
              matchId: match.matchInfo?.matchId || '',
              map: mapName,
              mode: match.matchInfo?.queueId || 'unrated',
              date: match.matchInfo?.gameStartMillis
                ? new Date(match.matchInfo.gameStartMillis).toLocaleDateString('fr-FR')
                : '',
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

        sendJson(res, 200, { success: true, matches });
      } catch (err) {
        console.error('Riot matches error:', err);
        sendJson(res, 200, { success: true, matches: [] });
      }
      return;
    }

    // GET /users/lfg — public list of users who opted in to appear in LFG page
    if (req.method === 'GET' && url.pathname === '/users/lfg') {
      const [rows] = await pool.execute(
        `SELECT id, username, riot_id, tag_line, bio, discord, twitter, twitch, youtube, rank_label, roles, region, languages, playtimes, lfg_status FROM users WHERE show_in_lfg = 1`
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
        rankLabel: r.rank_label || null,
        roles: parseJsonCol(r.roles),
        region: r.region || null,
        languages: parseJsonCol(r.languages),
        playtimes: parseJsonCol(r.playtimes),
        lfgStatus: r.lfg_status || 'lfg',
      }));
      sendJson(res, 200, { success: true, players });
      return;
    }

    // ════════════════════════════════════════════════════════
    //  SHOP — public
    // ════════════════════════════════════════════════════════

    // GET /products — public catalogue from DB
    if (req.method === 'GET' && url.pathname === '/products') {
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
      sendJson(res, 200, { success: true, products });
      return;
    }

    // POST /orders — create an order (authenticated)
    if (req.method === 'POST' && url.pathname === '/orders') {
      const sessionUserId = getSessionUserId(req);
      if (!sessionUserId) { sendJson(res, 401, { success: false, error: 'Non authentifie' }); return; }

      const body = await readJsonBody(req);
      const totalTtc = Number(body.total_ttc || 0);
      const method = ['Card', 'PayPal', 'Crypto'].includes(body.payment_method) ? body.payment_method : 'Card';
      const items = Array.isArray(body.items) ? body.items : [];

      const [orderResult] = await pool.execute(
        'INSERT INTO orders (user_id, total_ttc, payment_method, status) VALUES (?, ?, ?, ?)',
        [sessionUserId, totalTtc, method, 'Paid']
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

      sendJson(res, 201, { success: true, orderId });
      return;
    }

    // ════════════════════════════════════════════════════════
    //  ADMIN — protected (is_admin required)
    // ════════════════════════════════════════════════════════

    // GET /admin/overview — dashboard metrics
    if (req.method === 'GET' && url.pathname === '/admin/overview') {
      if (!(await requireAdmin(req, res))) return;

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

      sendJson(res, 200, {
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
      return;
    }

    // GET /admin/users — list all users
    if (req.method === 'GET' && url.pathname === '/admin/users') {
      if (!(await requireAdmin(req, res))) return;
      const [rows] = await pool.query(`SELECT ${USER_COLS} FROM users ORDER BY id DESC`);
      sendJson(res, 200, { success: true, users: rows.map(sanitizeUser) });
      return;
    }

    // PUT /admin/users/:id — edit a user
    const adminUserPut = url.pathname.match(/^\/admin\/users\/(\d+)$/);
    if (req.method === 'PUT' && adminUserPut) {
      const admin = await requireAdmin(req, res);
      if (!admin) return;
      const targetId = Number(adminUserPut[1]);
      const body = await readJsonBody(req);

      const target = await getUserById(targetId);
      if (!target) { sendJson(res, 404, { success: false, error: 'Utilisateur introuvable' }); return; }

      const updates = {};
      if (body.username !== undefined) updates.username = String(body.username).trim() || target.username;
      if (body.email    !== undefined) updates.email    = String(body.email).trim().toLowerCase() || target.email;
      if (body.isAdmin  !== undefined) {
        // Prevent removing the last admin
        if (!body.isAdmin && target.is_admin) {
          const [[{ admins }]] = await pool.query('SELECT COUNT(*) AS admins FROM users WHERE is_admin = 1');
          if (admins <= 1) { sendJson(res, 400, { success: false, error: 'Impossible de retirer le dernier administrateur' }); return; }
        }
        updates.is_admin = body.isAdmin ? 1 : 0;
      }
      if (Object.keys(updates).length > 0) {
        const setClauses = Object.keys(updates).map(k => `${k} = ?`).join(', ');
        await pool.execute(`UPDATE users SET ${setClauses} WHERE id = ?`, [...Object.values(updates), targetId]);
      }
      const updated = await getUserById(targetId);
      sendJson(res, 200, { success: true, user: sanitizeUser(updated) });
      return;
    }

    // DELETE /admin/users/:id
    const adminUserDel = url.pathname.match(/^\/admin\/users\/(\d+)$/);
    if (req.method === 'DELETE' && adminUserDel) {
      const admin = await requireAdmin(req, res);
      if (!admin) return;
      const targetId = Number(adminUserDel[1]);
      if (targetId === admin.id) { sendJson(res, 400, { success: false, error: 'Vous ne pouvez pas supprimer votre propre compte' }); return; }

      const target = await getUserById(targetId);
      if (!target) { sendJson(res, 404, { success: false, error: 'Utilisateur introuvable' }); return; }
      if (target.is_admin) {
        const [[{ admins }]] = await pool.query('SELECT COUNT(*) AS admins FROM users WHERE is_admin = 1');
        if (admins <= 1) { sendJson(res, 400, { success: false, error: 'Impossible de supprimer le dernier administrateur' }); return; }
      }
      try {
        await pool.execute('DELETE FROM users WHERE id = ?', [targetId]);
      } catch {
        sendJson(res, 409, { success: false, error: 'Suppression impossible : cet utilisateur a des donnees liees (commandes).' });
        return;
      }
      sendJson(res, 200, { success: true });
      return;
    }

    // GET /admin/products
    if (req.method === 'GET' && url.pathname === '/admin/products') {
      if (!(await requireAdmin(req, res))) return;
      const [rows] = await pool.query('SELECT id, name, price, category, image_url, stock_quantity FROM products ORDER BY id DESC');
      sendJson(res, 200, { success: true, products: rows.map(r => ({ ...r, price: Number(r.price), stock_quantity: Number(r.stock_quantity) })) });
      return;
    }

    // POST /admin/products
    if (req.method === 'POST' && url.pathname === '/admin/products') {
      if (!(await requireAdmin(req, res))) return;
      const body = await readJsonBody(req);
      const name = String(body.name || '').trim();
      if (!name) { sendJson(res, 400, { success: false, error: 'Le nom est requis' }); return; }
      const [result] = await pool.execute(
        'INSERT INTO products (name, price, category, image_url, stock_quantity) VALUES (?, ?, ?, ?, ?)',
        [name, Number(body.price) || 0, String(body.category || 'ACCESSOIRES'), String(body.image_url || ''), Number(body.stock_quantity) || 0]
      );
      sendJson(res, 201, { success: true, id: result.insertId });
      return;
    }

    // PUT /admin/products/:id
    const adminProdPut = url.pathname.match(/^\/admin\/products\/(\d+)$/);
    if (req.method === 'PUT' && adminProdPut) {
      if (!(await requireAdmin(req, res))) return;
      const id = Number(adminProdPut[1]);
      const body = await readJsonBody(req);
      const [[existing]] = await pool.query('SELECT * FROM products WHERE id = ?', [id]);
      if (!existing) { sendJson(res, 404, { success: false, error: 'Produit introuvable' }); return; }
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
      sendJson(res, 200, { success: true });
      return;
    }

    // DELETE /admin/products/:id
    const adminProdDel = url.pathname.match(/^\/admin\/products\/(\d+)$/);
    if (req.method === 'DELETE' && adminProdDel) {
      if (!(await requireAdmin(req, res))) return;
      const id = Number(adminProdDel[1]);
      try {
        await pool.execute('DELETE FROM products WHERE id = ?', [id]);
      } catch {
        sendJson(res, 409, { success: false, error: 'Suppression impossible : ce produit figure dans des commandes.' });
        return;
      }
      sendJson(res, 200, { success: true });
      return;
    }

    // GET /admin/orders — all orders with buyer + line items
    if (req.method === 'GET' && url.pathname === '/admin/orders') {
      if (!(await requireAdmin(req, res))) return;
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
      sendJson(res, 200, {
        success: true,
        orders: orders.map(o => ({ ...o, total_ttc: Number(o.total_ttc), items: byOrder[o.id] || [] })),
      });
      return;
    }

    // PUT /admin/orders/:id — change status
    const adminOrderPut = url.pathname.match(/^\/admin\/orders\/(\d+)$/);
    if (req.method === 'PUT' && adminOrderPut) {
      if (!(await requireAdmin(req, res))) return;
      const id = Number(adminOrderPut[1]);
      const body = await readJsonBody(req);
      const status = ['Pending', 'Paid', 'Shipped', 'Cancelled'].includes(body.status) ? body.status : null;
      if (!status) { sendJson(res, 400, { success: false, error: 'Statut invalide' }); return; }
      await pool.execute('UPDATE orders SET status = ? WHERE id = ?', [status, id]);
      sendJson(res, 200, { success: true });
      return;
    }

    sendJson(res, 404, { success: false, error: 'Route introuvable' });
  } catch (error) {
    console.error('API error:', error);
    sendJson(res, 500, { success: false, error: 'Erreur serveur' });
  }
});

initDb().then(() => {
  server.listen(API_PORT, () => {
    console.log(`Local API running on http://localhost:${API_PORT}`);
  });
}).catch(err => {
  console.error('DB init failed:', err);
  process.exit(1);
});
