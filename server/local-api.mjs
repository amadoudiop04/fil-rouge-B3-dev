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

const sanitizeUser = (row) => ({
  id: row.id,
  username: row.username,
  email: row.email,
  riot_id: row.riot_id,
  tag_line: row.tag_line,
  created_at: row.created_at,
});

const getUserByEmail = async (email) => {
  const [rows] = await pool.execute(
    'SELECT id, username, email, password_hash, riot_id, tag_line, created_at FROM users WHERE email = ?',
    [email]
  );
  return rows.length > 0 ? rows[0] : null;
};

const getUserById = async (id) => {
  const [rows] = await pool.execute(
    'SELECT id, username, email, riot_id, tag_line, created_at FROM users WHERE id = ?',
    [id]
  );
  return rows.length > 0 ? rows[0] : null;
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
      const username = String(body.username || '').trim();
      const email = String(body.email || '').trim().toLowerCase();
      const riotId = body.riotId === undefined ? null : String(body.riotId || '').trim() || null;
      const tagLine = body.tagLine === undefined ? null : String(body.tagLine || '').trim() || null;

      const currentUser = await getUserById(userId);
      if (!currentUser) {
        sendJson(res, 404, { success: false, error: 'Utilisateur introuvable' });
        return;
      }

      if (email && email !== currentUser.email) {
        const existing = await getUserByEmail(email);
        if (existing && existing.id !== userId) {
          sendJson(res, 409, { success: false, error: 'Cet email est deja utilise' });
          return;
        }
      }

      const nextUsername = username || currentUser.username;
      const nextEmail = email || currentUser.email;

      await pool.execute(
        'UPDATE users SET username = ?, email = ?, riot_id = ?, tag_line = ? WHERE id = ?',
        [nextUsername, nextEmail, riotId, tagLine, userId]
      );

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

    sendJson(res, 404, { success: false, error: 'Route introuvable' });
  } catch (error) {
    console.error('API error:', error);
    sendJson(res, 500, { success: false, error: 'Erreur serveur' });
  }
});

server.listen(API_PORT, () => {
  console.log(`Local API running on http://localhost:${API_PORT}`);
});
