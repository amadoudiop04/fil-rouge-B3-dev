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
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,OPTIONS');
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
});

const USER_COLS = 'id, username, email, riot_id, tag_line, created_at, bio, discord, twitter, twitch, youtube, rank_label, roles, region, languages, playtimes, show_in_lfg, lfg_status';

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

const initDb = async () => {
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
  ];
  for (const sql of cols) {
    try { await pool.execute(sql); } catch { /* column already exists */ }
  }
  console.log('DB schema ready');
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
