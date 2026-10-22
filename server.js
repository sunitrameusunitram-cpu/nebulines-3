'use strict';
const express = require('express');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const bcrypt = require('bcryptjs');
const Database = require('better-sqlite3');
const jwt = require('jsonwebtoken');
const { OAuth2Client } = require('google-auth-library');
const crypto = require('crypto');
const path = require('path');
const fs = require('fs');

const PORT = Number(process.env.PORT || 3000);
const DATA_DIR = process.env.DATA_DIR || path.join(__dirname, 'data');
const JWT_SECRET = process.env.JWT_SECRET;
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || '';
const googleClient = GOOGLE_CLIENT_ID ? new OAuth2Client(GOOGLE_CLIENT_ID) : null;
if (!JWT_SECRET || JWT_SECRET.length < 32 || JWT_SECRET.includes('remplacer-par')) {
  console.error('ERREUR : définis JWT_SECRET avec une clé aléatoire d’au moins 32 caractères.');
  process.exit(1);
}
fs.mkdirSync(DATA_DIR, { recursive: true });
const db = new Database(path.join(DATA_DIR, 'nebulines.sqlite'));
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT NOT NULL,
    username_key TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    google_sub TEXT UNIQUE,
    email TEXT,
    dust INTEGER NOT NULL DEFAULT 0 CHECK(dust >= 0),
    collection_json TEXT NOT NULL DEFAULT '{}',
    welcome_granted INTEGER NOT NULL DEFAULT 1 CHECK(welcome_granted IN (0,1)),
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );
  CREATE TABLE IF NOT EXISTS reward_ledger (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    reward_key TEXT NOT NULL,
    amount INTEGER NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    UNIQUE(user_id, reward_key)
  );
  CREATE TABLE IF NOT EXISTS friendships (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_low INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    user_high INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    requested_by INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','accepted')),
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    UNIQUE(user_low, user_high), CHECK(user_low < user_high)
  );
  CREATE TABLE IF NOT EXISTS trades (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    from_user INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    to_user INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    card_id INTEGER NOT NULL CHECK(card_id > 0),
    status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','accepted','declined')),
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );
  CREATE INDEX IF NOT EXISTS idx_friendships_low ON friendships(user_low);
  CREATE INDEX IF NOT EXISTS idx_friendships_high ON friendships(user_high);
  CREATE INDEX IF NOT EXISTS idx_trades_to_status ON trades(to_user, status);
`);
// Compatibilité avec une base créée par une ancienne version du serveur.
const columns = db.prepare('PRAGMA table_info(users)').all().map(c => c.name);
if (!columns.includes('welcome_granted')) db.exec('ALTER TABLE users ADD COLUMN welcome_granted INTEGER NOT NULL DEFAULT 0');
if (!columns.includes('google_sub')) db.exec('ALTER TABLE users ADD COLUMN google_sub TEXT');
if (!columns.includes('email')) db.exec('ALTER TABLE users ADD COLUMN email TEXT');
const app = express();
app.disable('x-powered-by');
app.use(helmet({ contentSecurityPolicy: false, crossOriginEmbedderPolicy: false }));
app.use(express.json({ limit: '250kb' }));
const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, limit: 30, standardHeaders: true, legacyHeaders: false, message: { error: 'Trop de tentatives. Réessaie dans quelques minutes.' } });
app.use(['/api/register', '/api/login', '/api/google-login'], authLimiter);
function parseCollection(raw) { try { const value = JSON.parse(raw || '{}'); return value && typeof value === 'object' && !Array.isArray(value) ? value : {}; } catch { return {}; } }
function publicUser(row) {
  return { id: row.id, username: row.username, dust: row.dust, collection: parseCollection(row.collection_json), welcomeRewardGranted: !!row.welcome_granted };
}
function issueToken(row) { return jwt.sign({ sub: String(row.id) }, JWT_SECRET, { expiresIn: '30d', issuer: 'nebulines' }); }
function auth(req, res, next) {
  const header = req.get('authorization') || '';
  const match = header.match(/^Bearer\s+(.+)$/i);
  if (!match) return res.status(401).json({ error: 'Connecte-toi pour continuer.' });
  try {
    const payload = jwt.verify(match[1], JWT_SECRET, { issuer: 'nebulines' });
    req.user = db.prepare('SELECT * FROM users WHERE id = ?').get(Number(payload.sub));
    if (!req.user) return res.status(401).json({ error: 'Compte introuvable. Reconnecte-toi.' });
    next();
  } catch { return res.status(401).json({ error: 'Session expirée ou invalide. Reconnecte-toi.' }); }
}
const createAccount = db.transaction((username, usernameKey, passwordHash) => {
  // La création du compte, le crédit de 160 Orbres et son reçu sont atomiques.
  const info = db.prepare('INSERT INTO users (username, username_key, password_hash, dust, collection_json, welcome_granted) VALUES (?, ?, ?, 160, ?, 1)')
    .run(username, usernameKey, passwordHash, '{}');
  const userId = Number(info.lastInsertRowid);
  db.prepare('INSERT INTO reward_ledger (user_id, reward_key, amount) VALUES (?, ?, ?)').run(userId, 'welcome-160-v1', 160);
  return db.prepare('SELECT * FROM users WHERE id = ?').get(userId);
});
app.post('/api/register', async (req, res) => {
  const username = String(req.body?.username || '').trim();
  const password = String(req.body?.password || '');
  if (!/^[\p{L}\p{N}_-]{3,20}$/u.test(username)) return res.status(400).json({ error: 'Le pseudo doit contenir 3 à 20 lettres, chiffres, _ ou -.' });
  if (password.length < 10 || password.length > 200) return res.status(400).json({ error: 'Le mot de passe doit contenir au moins 10 caractères.' });
  try {
    const hash = await bcrypt.hash(password, 12);
    const row = createAccount(username, username.toLocaleLowerCase('fr'), hash);
    return res.status(201).json({ token: issueToken(row), user: publicUser(row), welcomeMessage: 'Bienvenue ! +160 Orbres crédités.' });
  } catch (e) {
    if (String(e.code || '').startsWith('SQLITE_CONSTRAINT')) return res.status(409).json({ error: 'Ce pseudo est déjà utilisé. Choisis-en un autre.' });
    console.error('register failed', e); return res.status(500).json({ error: 'Impossible de créer le compte pour le moment.' });
  }
});
app.post('/api/login', (req, res) => {
  const username = String(req.body?.username || '').trim();
  const password = String(req.body?.password || '');
  const row = db.prepare('SELECT * FROM users WHERE username_key = ?').get(username.toLocaleLowerCase('fr'));
  if (!row || !bcrypt.compareSync(password, row.password_hash)) return res.status(401).json({ error: 'Pseudo ou mot de passe incorrect.' });
  return res.json({ token: issueToken(row), user: publicUser(row) });
});

// Google Identity Services: le jeton Google est vérifié côté serveur avant toute création de compte.
app.get('/api/config', (_req, res) => res.json({ googleClientId: GOOGLE_CLIENT_ID }));
app.post('/api/google-login', async (req, res) => {
  const credential = String(req.body?.credential || '');
  if (!googleClient) return res.status(503).json({ error: 'Connexion Google non configurée. Ajoute GOOGLE_CLIENT_ID dans les variables du serveur.' });
  if (!credential || credential.length > 10000) return res.status(400).json({ error: 'Jeton Google manquant ou invalide.' });
  try {
    const ticket = await googleClient.verifyIdToken({ idToken: credential, audience: GOOGLE_CLIENT_ID });
    const payload = ticket.getPayload();
    if (!payload?.sub || !payload.email || payload.email_verified !== true) return res.status(401).json({ error: 'Google doit confirmer ton adresse e-mail.' });
    let row = db.prepare('SELECT * FROM users WHERE google_sub = ?').get(payload.sub);
    let isNew = false;
    if (!row) {
      const suffix = crypto.randomBytes(4).toString('hex');
      let username = String(payload.name || 'Joueur').normalize('NFKD').replace(/[^\p{L}\p{N}_-]/gu, '').slice(0, 12) || 'Joueur';
      username = (username + '_' + suffix).slice(0, 20);
      const randomPasswordHash = await bcrypt.hash(crypto.randomBytes(32).toString('hex'), 12);
      const createGoogle = db.transaction(() => {
        const info = db.prepare('INSERT INTO users (username, username_key, password_hash, google_sub, email, dust, collection_json, welcome_granted) VALUES (?, ?, ?, ?, ?, 160, ?, 1)')
          .run(username, username.toLocaleLowerCase('fr'), randomPasswordHash, payload.sub, String(payload.email).toLowerCase(), '{}');
        const userId = Number(info.lastInsertRowid);
        db.prepare('INSERT INTO reward_ledger (user_id, reward_key, amount) VALUES (?, ?, ?)').run(userId, 'welcome-160-v1', 160);
        return db.prepare('SELECT * FROM users WHERE id = ?').get(userId);
      });
      row = createGoogle(); isNew = true;
    }
    return res.json({ token: issueToken(row), user: publicUser(row), isNew, welcomeMessage: isNew ? 'Bienvenue ! +160 Orbres crédités.' : '' });
  } catch (e) {
    console.error('Google sign-in failed:', e.message);
    return res.status(401).json({ error: 'Connexion Google impossible. Vérifie la configuration OAuth et réessaie.' });
  }
});

app.get('/api/me', auth, (req, res) => res.json({ user: publicUser(req.user) }));
app.put('/api/me/collection', auth, (req, res) => {
  const collection = req.body?.collection;
  const dust = Number(req.body?.dust);
  if (!collection || typeof collection !== 'object' || Array.isArray(collection) || JSON.stringify(collection).length > 200000) return res.status(400).json({ error: 'Collection invalide.' });
  if (!Number.isSafeInteger(dust) || dust < 0 || dust > 100000000) return res.status(400).json({ error: 'Solde d’Orbres invalide.' });
  const cleanCollection = Object.create(null);
  for (const [key, item] of Object.entries(collection)) {
    if (!/^[1-9]\d{0,4}$/.test(key) || !item || typeof item !== 'object' || Array.isArray(item)) return res.status(400).json({ error: 'Une carte de la collection est invalide.' });
    const n = Number(item.n), h = Number(item.h || 0);
    if (!Number.isSafeInteger(n) || n < 1 || n > 1000000 || !Number.isFinite(h) || h < 0 || h > 1000000000) return res.status(400).json({ error: 'Quantité de carte invalide.' });
    cleanCollection[key] = { n, h };
  }
  db.prepare('UPDATE users SET collection_json = ?, dust = ? WHERE id = ?').run(JSON.stringify(cleanCollection), dust, req.user.id);
  return res.json({ user: publicUser(db.prepare('SELECT * FROM users WHERE id = ?').get(req.user.id)) });
});
// Reset explicite de la progression. Le registre welcome reste intact : aucun second bonus.
app.post('/api/me/reset', auth, (req, res) => {
  const reset = db.transaction(() => {
    db.prepare('UPDATE users SET collection_json = ?, dust = 0 WHERE id = ?').run('{}', req.user.id);
    // Les échanges en attente sont annulés pour éviter qu'une ancienne transaction
    // ne réintroduise une carte après la réinitialisation.
    db.prepare("UPDATE trades SET status='declined' WHERE status='pending' AND (from_user=? OR to_user=?)").run(req.user.id, req.user.id);
    return db.prepare('SELECT * FROM users WHERE id = ?').get(req.user.id);
  });
  const row = reset();
  return res.json({ user: publicUser(row), reset: true, welcomeRewardGranted: !!row.welcome_granted });
});
// Social API: demandes d'amis et échanges de cartes exécutés côté serveur.
function friendPair(a, b) { return { low: Math.min(a, b), high: Math.max(a, b) }; }
function areFriends(a, b) {
  const p = friendPair(a, b);
  return !!db.prepare("SELECT 1 FROM friendships WHERE user_low=? AND user_high=? AND status='accepted'").get(p.low, p.high);
}
app.get('/api/friends', auth, (req, res) => {
  const rows = db.prepare(`SELECT f.*, u.username AS other_username
    FROM friendships f JOIN users u ON u.id = CASE WHEN f.user_low=? THEN f.user_high ELSE f.user_low END
    WHERE f.user_low=? OR f.user_high=? ORDER BY f.created_at DESC`).all(req.user.id, req.user.id, req.user.id);
  res.json({ friends: rows.map(f => ({ username: f.other_username, status: f.status,
    direction: f.status === 'pending' ? (f.requested_by === req.user.id ? 'outgoing' : 'incoming') : 'accepted' })) });
});
app.post('/api/friends', auth, (req, res) => {
  const username = String(req.body?.username || '').trim();
  if (!username || username.length > 20) return res.status(400).json({ error: 'Pseudo invalide.' });
  const target = db.prepare('SELECT id, username FROM users WHERE username_key=?').get(username.toLocaleLowerCase('fr'));
  if (!target) return res.status(404).json({ error: 'Aucun joueur trouvé avec ce pseudo.' });
  if (target.id === req.user.id) return res.status(400).json({ error: 'Tu ne peux pas t’ajouter toi-même.' });
  const pair = friendPair(req.user.id, target.id);
  const existing = db.prepare('SELECT * FROM friendships WHERE user_low=? AND user_high=?').get(pair.low, pair.high);
  if (existing?.status === 'accepted') return res.status(409).json({ error: 'Vous êtes déjà amis.' });
  if (existing) {
    if (existing.requested_by !== req.user.id) {
      db.prepare("UPDATE friendships SET status='accepted' WHERE id=?").run(existing.id);
      return res.json({ ok: true, accepted: true });
    }
    return res.status(409).json({ error: 'Demande déjà envoyée.' });
  }
  db.prepare('INSERT INTO friendships (user_low,user_high,requested_by,status) VALUES (?,?,?,\'pending\')').run(pair.low, pair.high, req.user.id);
  res.status(201).json({ ok: true });
});
app.post('/api/friends/:username/accept', auth, (req, res) => {
  const target = db.prepare('SELECT id FROM users WHERE username_key=?').get(String(req.params.username).toLocaleLowerCase('fr'));
  if (!target) return res.status(404).json({ error: 'Joueur introuvable.' });
  const pair = friendPair(req.user.id, target.id);
  const result = db.prepare("UPDATE friendships SET status='accepted' WHERE user_low=? AND user_high=? AND status='pending' AND requested_by=?").run(pair.low, pair.high, target.id);
  if (!result.changes) return res.status(409).json({ error: 'Aucune demande reçue à accepter.' });
  res.json({ ok: true });
});
app.get('/api/users/:username/collection', auth, (req, res) => {
  const target = db.prepare('SELECT id, username, collection_json FROM users WHERE username_key=?').get(String(req.params.username).toLocaleLowerCase('fr'));
  if (!target) return res.status(404).json({ error: 'Joueur introuvable.' });
  if (!areFriends(req.user.id, target.id)) return res.status(403).json({ error: 'Tu dois être ami avec ce joueur pour voir sa collection.' });
  res.json({ username: target.username, collection: JSON.parse(target.collection_json || '{}') });
});
app.get('/api/trades', auth, (req, res) => {
  const rows = db.prepare(`SELECT t.*, a.username AS from_username, b.username AS to_username
    FROM trades t JOIN users a ON a.id=t.from_user JOIN users b ON b.id=t.to_user
    WHERE t.from_user=? OR t.to_user=? ORDER BY t.created_at DESC LIMIT 100`).all(req.user.id, req.user.id);
  res.json({ trades: rows.map(t => ({ id: t.id, fromUsername: t.from_username, toUsername: t.to_username, cardId: t.card_id, status: t.status })) });
});
app.post('/api/trades', auth, (req, res) => {
  const username = String(req.body?.username || '').trim();
  const cardId = Number(req.body?.cardId);
  if (!Number.isSafeInteger(cardId) || cardId < 1 || cardId > 10000) return res.status(400).json({ error: 'Carte invalide.' });
  const target = db.prepare('SELECT id FROM users WHERE username_key=?').get(username.toLocaleLowerCase('fr'));
  if (!target) return res.status(404).json({ error: 'Joueur introuvable.' });
  if (target.id === req.user.id || !areFriends(req.user.id, target.id)) return res.status(403).json({ error: 'Un échange nécessite un ami accepté.' });
  const own = JSON.parse(req.user.collection_json || '{}');
  if (!own[cardId] || Number(own[cardId].n) < 2) return res.status(400).json({ error: 'Il faut posséder au moins un doublon de cette carte.' });
  const pending = db.prepare("SELECT 1 FROM trades WHERE from_user=? AND to_user=? AND card_id=? AND status='pending'").get(req.user.id, target.id, cardId);
  if (pending) return res.status(409).json({ error: 'Une proposition identique est déjà en attente.' });
  const info = db.prepare("INSERT INTO trades (from_user,to_user,card_id,status) VALUES (?,?,?,'pending')").run(req.user.id, target.id, cardId);
  res.status(201).json({ ok: true, id: Number(info.lastInsertRowid) });
});
app.post('/api/trades/:id/accept', auth, (req, res) => {
  const id = Number(req.params.id);
  const tx = db.transaction(() => {
    const trade = db.prepare("SELECT * FROM trades WHERE id=? AND to_user=? AND status='pending'").get(id, req.user.id);
    if (!trade) throw Object.assign(new Error('Proposition introuvable ou déjà traitée.'), { status: 404 });
    if (!areFriends(trade.from_user, trade.to_user)) throw Object.assign(new Error('Vous devez être amis pour échanger.'), { status: 403 });
    const sender = db.prepare('SELECT collection_json FROM users WHERE id=?').get(trade.from_user);
    const receiver = db.prepare('SELECT collection_json FROM users WHERE id=?').get(trade.to_user);
    const sc = JSON.parse(sender.collection_json || '{}'); const rc = JSON.parse(receiver.collection_json || '{}');
    const key = String(trade.card_id); const owned = sc[key];
    if (!owned || Number(owned.n) < 2) throw Object.assign(new Error('L’expéditeur ne possède plus de doublon : échange annulé.'), { status: 409 });
    owned.n = Number(owned.n) - 1; if (owned.n <= 0) delete sc[key];
    const dest = rc[key] || { n: 0, h: 0 }; dest.n = Number(dest.n || 0) + 1; dest.h = Math.max(Number(dest.h)||0, Number(owned?.h)||0); rc[key] = dest;
    db.prepare('UPDATE users SET collection_json=? WHERE id=?').run(JSON.stringify(sc), trade.from_user);
    db.prepare('UPDATE users SET collection_json=? WHERE id=?').run(JSON.stringify(rc), trade.to_user);
    db.prepare("UPDATE trades SET status='accepted' WHERE id=?").run(id);
  });
  try { tx(); res.json({ ok: true, user: publicUser(db.prepare('SELECT * FROM users WHERE id=?').get(req.user.id)) }); }
  catch (e) { res.status(e.status || 500).json({ error: e.message || 'Échange impossible.' }); }
});
app.post('/api/trades/:id/decline', auth, (req, res) => {
  const result = db.prepare("UPDATE trades SET status='declined' WHERE id=? AND to_user=? AND status='pending'").run(Number(req.params.id), req.user.id);
  if (!result.changes) return res.status(404).json({ error: 'Proposition introuvable ou déjà traitée.' });
  res.json({ ok: true });
});
app.get('/api/health', (_req, res) => res.json({ ok: true, service: 'nebulines', version: 2 }));
app.use(express.static(path.join(__dirname, 'public'), { extensions: ['html'] }));
app.get('*', (_req, res) => res.sendFile(path.join(__dirname, 'public', 'index.html')));
app.listen(PORT, () => console.log(`Nébulines prêt sur le port ${PORT}`));
