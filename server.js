import { createServer } from "node:http";
import { createHash, randomBytes, scryptSync, timingSafeEqual } from "node:crypto";
import { existsSync, mkdirSync } from "node:fs";
import { readFile } from "node:fs/promises";
import { extname, dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { DatabaseSync } from "node:sqlite";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = __dirname;
const dataDir = resolve(rootDir, "data");
const dbFile = resolve(dataDir, "start5.db");

const PORT = Number(process.env.PORT) || 3000;
const SESSION_COOKIE = "start5_session";
const SESSION_DURATION_DAYS = 30;
const ALLOWED_STATES = new Set(["cansado", "normal", "focado"]);
const DEFAULT_ADMIN = {
  name: process.env.START5_ADMIN_NAME || "Start 5 Owner",
  email: (process.env.START5_ADMIN_EMAIL || "owner@start5.local").toLowerCase(),
  password: process.env.START5_ADMIN_PASSWORD || "Start5Admin123!",
};

if (!existsSync(dataDir)) {
  mkdirSync(dataDir, { recursive: true });
}

const db = new DatabaseSync(dbFile);
db.exec("PRAGMA foreign_keys = ON;");
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin')),
    created_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS start_sessions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    state TEXT NOT NULL CHECK (state IN ('cansado', 'normal', 'focado')),
    minutes REAL NOT NULL,
    type TEXT NOT NULL DEFAULT 'padrao',
    date_key TEXT NOT NULL,
    started_at TEXT NOT NULL,
    ended_at TEXT NOT NULL,
    created_at TEXT NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS auth_sessions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    token_hash TEXT NOT NULL UNIQUE,
    created_at TEXT NOT NULL,
    expires_at TEXT NOT NULL,
    last_seen_at TEXT NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  );

  CREATE INDEX IF NOT EXISTS idx_start_sessions_user_date
  ON start_sessions (user_id, date_key);

  CREATE UNIQUE INDEX IF NOT EXISTS idx_start_sessions_dedup
  ON start_sessions (user_id, started_at, minutes, state);

  CREATE INDEX IF NOT EXISTS idx_auth_sessions_token
  ON auth_sessions (token_hash);
`);

const insertUserStatement = db.prepare(`
  INSERT INTO users (name, email, password_hash, role, created_at)
  VALUES (?, ?, ?, ?, ?)
`);

const findUserByEmailStatement = db.prepare(`
  SELECT id, name, email, password_hash, role, created_at AS createdAt
  FROM users
  WHERE email = ?
`);

const findUserByIdStatement = db.prepare(`
  SELECT id, name, email, role, created_at AS createdAt
  FROM users
  WHERE id = ?
`);

const insertAuthSessionStatement = db.prepare(`
  INSERT INTO auth_sessions (user_id, token_hash, created_at, expires_at, last_seen_at)
  VALUES (?, ?, ?, ?, ?)
`);

const findUserByTokenStatement = db.prepare(`
  SELECT
    users.id,
    users.name,
    users.email,
    users.role,
    users.created_at AS createdAt,
    auth_sessions.id AS authSessionId
  FROM auth_sessions
  INNER JOIN users ON users.id = auth_sessions.user_id
  WHERE auth_sessions.token_hash = ? AND auth_sessions.expires_at > ?
`);

const updateAuthSessionSeenStatement = db.prepare(`
  UPDATE auth_sessions
  SET last_seen_at = ?
  WHERE id = ?
`);

const deleteAuthSessionStatement = db.prepare(`
  DELETE FROM auth_sessions
  WHERE token_hash = ?
`);

const insertStartSessionStatement = db.prepare(`
  INSERT OR IGNORE INTO start_sessions (
    user_id,
    state,
    minutes,
    type,
    date_key,
    started_at,
    ended_at,
    created_at
  )
  VALUES (?, ?, ?, ?, ?, ?, ?, ?)
`);

const listUserSessionsStatement = db.prepare(`
  SELECT
    id,
    state,
    minutes,
    type,
    date_key AS date,
    started_at AS startedAt,
    ended_at AS endedAt,
    created_at AS createdAt
  FROM start_sessions
  WHERE user_id = ?
  ORDER BY started_at DESC
`);

const countUserSessionsStatement = db.prepare(`
  SELECT COUNT(*) AS total
  FROM start_sessions
  WHERE user_id = ?
`);

const adminOverviewStatement = db.prepare(`
  SELECT
    (SELECT COUNT(*) FROM users) AS totalUsers,
    (SELECT COUNT(*) FROM users WHERE role = 'admin') AS adminUsers,
    (SELECT COUNT(*) FROM start_sessions) AS totalSessions,
    COALESCE((SELECT ROUND(SUM(minutes), 1) FROM start_sessions), 0) AS totalMinutes,
    (SELECT COUNT(DISTINCT user_id) FROM start_sessions) AS activeUsers
`);

const adminUsersStatement = db.prepare(`
  SELECT
    users.id,
    users.name,
    users.email,
    users.role,
    users.created_at AS createdAt,
    COUNT(start_sessions.id) AS totalSessions,
    COALESCE(ROUND(SUM(start_sessions.minutes), 1), 0) AS totalMinutes,
    MAX(start_sessions.started_at) AS lastSessionAt
  FROM users
  LEFT JOIN start_sessions ON start_sessions.user_id = users.id
  GROUP BY users.id
  ORDER BY users.created_at DESC
`);

function nowIso() {
  return new Date().toISOString();
}

function addDays(date, days) {
  const copy = new Date(date);
  copy.setDate(copy.getDate() + days);
  return copy;
}

function hashPassword(password) {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

function verifyPassword(password, storedHash) {
  const [salt, currentHash] = String(storedHash).split(":");

  if (!salt || !currentHash) return false;

  const derivedHash = scryptSync(password, salt, 64).toString("hex");
  return timingSafeEqual(Buffer.from(derivedHash, "hex"), Buffer.from(currentHash, "hex"));
}

function hashToken(token) {
  return createHash("sha256").update(token).digest("hex");
}

function parseCookies(cookieHeader = "") {
  return cookieHeader.split(";").reduce((accumulator, chunk) => {
    const [rawKey, ...rest] = chunk.trim().split("=");
    if (!rawKey) return accumulator;
    accumulator[rawKey] = decodeURIComponent(rest.join("=") || "");
    return accumulator;
  }, {});
}

function setSessionCookie(response, token, expiresAt) {
  const maxAge = Math.max(0, Math.floor((expiresAt.getTime() - Date.now()) / 1000));
  const cookie = [
    `${SESSION_COOKIE}=${encodeURIComponent(token)}`,
    "Path=/",
    "HttpOnly",
    "SameSite=Lax",
    `Max-Age=${maxAge}`,
  ];

  if (process.env.NODE_ENV === "production") {
    cookie.push("Secure");
  }

  response.setHeader("Set-Cookie", cookie.join("; "));
}

function clearSessionCookie(response) {
  const cookie = [
    `${SESSION_COOKIE}=`,
    "Path=/",
    "HttpOnly",
    "SameSite=Lax",
    "Max-Age=0",
  ];

  response.setHeader("Set-Cookie", cookie.join("; "));
}

function sendJson(response, statusCode, payload) {
  response.writeHead(statusCode, {
    "Content-Type": "application/json; charset=utf-8",
  });
  response.end(JSON.stringify(payload));
}

function createError(statusCode, message) {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
}

async function readRequestBody(request) {
  const chunks = [];

  for await (const chunk of request) {
    chunks.push(chunk);
  }

  if (chunks.length === 0) {
    return {};
  }

  try {
    return JSON.parse(Buffer.concat(chunks).toString("utf8"));
  } catch {
    throw createError(400, "JSON inválido.");
  }
}

function sanitizeUser(row) {
  if (!row) return null;

  return {
    id: row.id,
    name: row.name,
    email: row.email,
    role: row.role,
    createdAt: row.createdAt,
  };
}

function createAuthSession(userId) {
  const token = randomBytes(32).toString("hex");
  const tokenHash = hashToken(token);
  const createdAt = new Date();
  const expiresAt = addDays(createdAt, SESSION_DURATION_DAYS);
  const timestamp = createdAt.toISOString();

  insertAuthSessionStatement.run(
    userId,
    tokenHash,
    timestamp,
    expiresAt.toISOString(),
    timestamp
  );

  return {
    token,
    expiresAt,
  };
}

function getAuthenticatedUser(request) {
  const cookies = parseCookies(request.headers.cookie);
  const sessionToken = cookies[SESSION_COOKIE];

  if (!sessionToken) {
    return null;
  }

  const tokenHash = hashToken(sessionToken);
  const user = findUserByTokenStatement.get(tokenHash, nowIso());

  if (!user) {
    return null;
  }

  updateAuthSessionSeenStatement.run(nowIso(), user.authSessionId);
  return sanitizeUser(user);
}

function ensureAdminUser() {
  const existingUser = findUserByEmailStatement.get(DEFAULT_ADMIN.email);

  if (existingUser) {
    if (existingUser.role !== "admin") {
      db.prepare("UPDATE users SET role = 'admin' WHERE id = ?").run(existingUser.id);
    }
    return;
  }

  insertUserStatement.run(
    DEFAULT_ADMIN.name,
    DEFAULT_ADMIN.email,
    hashPassword(DEFAULT_ADMIN.password),
    "admin",
    nowIso()
  );

  console.log("[start5] Conta admin criada.");
  console.log(`[start5] Admin e-mail: ${DEFAULT_ADMIN.email}`);
  console.log(`[start5] Admin senha: ${DEFAULT_ADMIN.password}`);
}

function normalizeEmail(email) {
  return String(email || "").trim().toLowerCase();
}

function maskEmail(email) {
  const normalizedEmail = normalizeEmail(email);
  const [localPart, domainPart] = normalizedEmail.split("@");

  if (!localPart || !domainPart) {
    return "Privado";
  }

  const domainParts = domainPart.split(".");
  const domainName = domainParts.shift() || "";
  const domainSuffix = domainParts.length ? `.${domainParts.join(".")}` : "";
  const visibleLocal =
    localPart.length <= 2 ? `${localPart.slice(0, 1)}*` : `${localPart.slice(0, 2)}***`;
  const visibleDomain =
    domainName.length <= 2 ? `${domainName.slice(0, 1)}*` : `${domainName.slice(0, 2)}***`;

  return `${visibleLocal}@${visibleDomain}${domainSuffix}`;
}

function sanitizeAdminUser(row) {
  if (!row) return null;

  return {
    id: row.id,
    name: row.name,
    role: row.role,
    createdAt: row.createdAt,
    totalSessions: Number(row.totalSessions) || 0,
    totalMinutes: Number(row.totalMinutes) || 0,
    lastSessionAt: row.lastSessionAt,
    maskedEmail: maskEmail(row.email),
  };
}

function isValidDateString(value) {
  return /^\d{4}-\d{2}-\d{2}$/.test(String(value || ""));
}

function normalizeSessionPayload(payload) {
  const minutes = Number(payload.minutes);
  const state = String(payload.state || "").trim().toLowerCase();
  const type = String(payload.type || (minutes > 20 ? "extra" : "padrao")).trim();
  const startedAt = payload.startedAt ? new Date(payload.startedAt) : new Date();

  if (!Number.isFinite(minutes) || minutes <= 0) {
    throw createError(400, "Minutos inválidos.");
  }

  if (!ALLOWED_STATES.has(state)) {
    throw createError(400, "Estado inválido.");
  }

  if (Number.isNaN(startedAt.getTime())) {
    throw createError(400, "Data de início inválida.");
  }

  const endedAt = new Date(startedAt.getTime() + minutes * 60000);
  const dateKey = isValidDateString(payload.date)
    ? String(payload.date)
    : startedAt.toISOString().slice(0, 10);

  return {
    state,
    minutes,
    type,
    dateKey,
    startedAt: startedAt.toISOString(),
    endedAt: endedAt.toISOString(),
    createdAt: payload.createdAt ? new Date(payload.createdAt).toISOString() : nowIso(),
  };
}

function insertStartSession(userId, payload) {
  const session = normalizeSessionPayload(payload);
  insertStartSessionStatement.run(
    userId,
    session.state,
    session.minutes,
    session.type,
    session.dateKey,
    session.startedAt,
    session.endedAt,
    session.createdAt
  );

  return listUserSessionsStatement.get(userId);
}

function listUserSessions(userId) {
  return listUserSessionsStatement.all(userId);
}

function ensureAdmin(user) {
  if (!user || user.role !== "admin") {
    throw createError(403, "Acesso restrito ao admin.");
  }
}

function getContentType(filePath) {
  const extension = extname(filePath).toLowerCase();
  const contentTypes = {
    ".html": "text/html; charset=utf-8",
    ".css": "text/css; charset=utf-8",
    ".js": "application/javascript; charset=utf-8",
    ".json": "application/json; charset=utf-8",
    ".svg": "image/svg+xml",
    ".png": "image/png",
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".ico": "image/x-icon",
  };

  return contentTypes[extension] || "application/octet-stream";
}

async function serveStaticFile(response, pathname) {
  const requestedFile = pathname === "/" ? "login.html" : pathname.slice(1);
  const filePath = resolve(rootDir, requestedFile);

  if (dirname(filePath) !== rootDir) {
    throw createError(404, "Arquivo não encontrado.");
  }

  try {
    const file = await readFile(filePath);
    response.writeHead(200, { "Content-Type": getContentType(filePath) });
    response.end(file);
  } catch {
    throw createError(404, "Arquivo não encontrado.");
  }
}

async function handleRegister(request, response) {
  const payload = await readRequestBody(request);
  const name = String(payload.name || "").trim();
  const email = normalizeEmail(payload.email);
  const password = String(payload.password || "").trim();

  if (name.length < 2) throw createError(400, "Informe um nome com pelo menos 2 caracteres.");
  if (!email.includes("@")) throw createError(400, "Informe um e-mail válido.");
  if (password.length < 6) throw createError(400, "A senha precisa ter pelo menos 6 caracteres.");

  const existingUser = findUserByEmailStatement.get(email);

  if (existingUser) {
    throw createError(409, "Esse e-mail já está cadastrado.");
  }

  const result = insertUserStatement.run(
    name,
    email,
    hashPassword(password),
    "user",
    nowIso()
  );

  const user = findUserByIdStatement.get(result.lastInsertRowid);
  const session = createAuthSession(user.id);
  setSessionCookie(response, session.token, session.expiresAt);
  sendJson(response, 201, { user: sanitizeUser(user) });
}

async function handleLogin(request, response) {
  const payload = await readRequestBody(request);
  const email = normalizeEmail(payload.email);
  const password = String(payload.password || "").trim();

  if (!email || !password) {
    throw createError(400, "Informe e-mail e senha.");
  }

  const user = findUserByEmailStatement.get(email);

  if (!user || !verifyPassword(password, user.password_hash)) {
    throw createError(401, "E-mail ou senha inválidos.");
  }

  const session = createAuthSession(user.id);
  setSessionCookie(response, session.token, session.expiresAt);
  sendJson(response, 200, { user: sanitizeUser(user) });
}

function handleLogout(request, response) {
  const cookies = parseCookies(request.headers.cookie);
  const sessionToken = cookies[SESSION_COOKIE];

  if (sessionToken) {
    deleteAuthSessionStatement.run(hashToken(sessionToken));
  }

  clearSessionCookie(response);
  sendJson(response, 200, { success: true });
}

function handleCurrentUser(request, response) {
  const user = getAuthenticatedUser(request);

  if (!user) {
    throw createError(401, "Sessão não encontrada.");
  }

  sendJson(response, 200, { user });
}

function handleListSessions(request, response) {
  const user = getAuthenticatedUser(request);

  if (!user) {
    throw createError(401, "Sessão não encontrada.");
  }

  sendJson(response, 200, { sessions: listUserSessions(user.id) });
}

async function handleCreateSession(request, response) {
  const user = getAuthenticatedUser(request);

  if (!user) {
    throw createError(401, "Sessão não encontrada.");
  }

  const payload = await readRequestBody(request);
  const session = insertStartSession(user.id, payload);

  sendJson(response, 201, { session });
}

async function handleImportSessions(request, response) {
  const user = getAuthenticatedUser(request);

  if (!user) {
    throw createError(401, "Sessão não encontrada.");
  }

  const payload = await readRequestBody(request);
  const importedSessions = Array.isArray(payload.sessions) ? payload.sessions : [];

  importedSessions.forEach((session) => {
    try {
      insertStartSession(user.id, session);
    } catch {
      // Ignora registros inválidos durante a migração inicial.
    }
  });

  sendJson(response, 200, { sessions: listUserSessions(user.id) });
}

function handleAdminOverview(request, response) {
  const user = getAuthenticatedUser(request);
  ensureAdmin(user);
  sendJson(response, 200, { overview: adminOverviewStatement.get() });
}

function handleAdminUsers(request, response) {
  const user = getAuthenticatedUser(request);
  ensureAdmin(user);
  sendJson(response, 200, { users: adminUsersStatement.all().map((row) => sanitizeAdminUser(row)) });
}

async function handleApiRequest(request, response, pathname) {
  if (request.method === "POST" && pathname === "/api/auth/register") {
    await handleRegister(request, response);
    return;
  }

  if (request.method === "POST" && pathname === "/api/auth/login") {
    await handleLogin(request, response);
    return;
  }

  if (request.method === "POST" && pathname === "/api/auth/logout") {
    handleLogout(request, response);
    return;
  }

  if (request.method === "GET" && pathname === "/api/auth/me") {
    handleCurrentUser(request, response);
    return;
  }

  if (request.method === "GET" && pathname === "/api/sessions") {
    handleListSessions(request, response);
    return;
  }

  if (request.method === "POST" && pathname === "/api/sessions") {
    await handleCreateSession(request, response);
    return;
  }

  if (request.method === "POST" && pathname === "/api/sessions/import") {
    await handleImportSessions(request, response);
    return;
  }

  if (request.method === "GET" && pathname === "/api/admin/overview") {
    handleAdminOverview(request, response);
    return;
  }

  if (request.method === "GET" && pathname === "/api/admin/users") {
    handleAdminUsers(request, response);
    return;
  }

  throw createError(404, "Rota não encontrada.");
}

ensureAdminUser();

const server = createServer(async (request, response) => {
  try {
    const requestUrl = new URL(request.url, `http://${request.headers.host}`);

    if (requestUrl.pathname.startsWith("/api/")) {
      await handleApiRequest(request, response, requestUrl.pathname);
      return;
    }

    await serveStaticFile(response, requestUrl.pathname);
  } catch (error) {
    const statusCode = error.statusCode || 500;
    const message = statusCode >= 500 ? "Erro interno do servidor." : error.message;
    sendJson(response, statusCode, { error: message });
  }
});

server.listen(PORT, () => {
  console.log(`[start5] Servidor ativo em http://localhost:${PORT}`);
  console.log(`[start5] Banco SQLite em ${dbFile}`);
});
