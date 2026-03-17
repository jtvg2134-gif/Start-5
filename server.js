import { createServer } from "node:http";
import { spawnSync } from "node:child_process";
import { createHash, randomBytes, scryptSync, timingSafeEqual } from "node:crypto";
import { existsSync, mkdirSync } from "node:fs";
import { readFile } from "node:fs/promises";
import { extname, dirname, resolve, relative } from "node:path";
import { fileURLToPath } from "node:url";
import { DatabaseSync } from "node:sqlite";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = __dirname;
const publicDir = resolve(projectRoot, "public");
const dataDir = resolve(projectRoot, "data");
const dbFile = resolve(dataDir, "start5.db");
const pythonEssayEngineEntry = resolve(projectRoot, "backend", "essay_engine", "cli.py");

const PORT = Number(process.env.PORT) || 3000;
const IS_PRODUCTION = process.env.NODE_ENV === "production";
const DEFAULT_ADMIN_PASSWORD = "Start5Admin123!";
const DEFAULT_ADMIN_EMAIL = "owner@start5.local";
const PUBLIC_ORIGIN = String(process.env.START5_PUBLIC_ORIGIN || "").trim().replace(/\/+$/, "");
const BODY_LIMIT_BYTES = Math.max(10_000, Number(process.env.START5_BODY_LIMIT_BYTES) || 1_000_000);
const AUTH_RATE_LIMIT_WINDOW_MS = Math.max(
  1_000,
  Number(process.env.START5_AUTH_RATE_LIMIT_WINDOW_MS) || 10 * 60 * 1000
);
const AUTH_RATE_LIMIT_MAX = Math.max(1, Number(process.env.START5_AUTH_RATE_LIMIT_MAX) || 8);
const WRITE_RATE_LIMIT_WINDOW_MS = Math.max(
  1_000,
  Number(process.env.START5_WRITE_RATE_LIMIT_WINDOW_MS) || 60 * 1000
);
const WRITE_RATE_LIMIT_MAX = Math.max(1, Number(process.env.START5_WRITE_RATE_LIMIT_MAX) || 90);
const SESSION_COOKIE = "start5_session";
const SESSION_DURATION_DAYS = 30;
const ALLOWED_STATES = new Set(["cansado", "normal", "focado"]);
const DEFAULT_SUBJECT_KEY = "ingles";
const ESSAY_STATUS_VALUES = new Set(["pending", "evaluated", "failed"]);
const ESSAY_THEME_MODE_VALUES = new Set(["preset", "custom"]);
const ESSAY_EVALUATION_MODE_VALUES = new Set(["local", "hybrid", "openai"]);
const ESSAY_EVALUATION_MODE = ESSAY_EVALUATION_MODE_VALUES.has(String(process.env.START5_ESSAY_EVALUATION_MODE || "").trim().toLowerCase())
  ? String(process.env.START5_ESSAY_EVALUATION_MODE || "").trim().toLowerCase()
  : "local";
const ESSAY_LOCAL_ENGINE_VALUES = new Set(["javascript", "python"]);
const ESSAY_LOCAL_ENGINE = ESSAY_LOCAL_ENGINE_VALUES.has(String(process.env.START5_ESSAY_LOCAL_ENGINE || "").trim().toLowerCase())
  ? String(process.env.START5_ESSAY_LOCAL_ENGINE || "").trim().toLowerCase()
  : "javascript";
const ESSAY_PYTHON_COMMAND = String(process.env.START5_PYTHON_COMMAND || "python").trim() || "python";
const SUBJECT_LABELS = {
  ingles: "Ingl\u00eas",
  matematica: "Matem\u00e1tica",
  portugues: "Portugu\u00eas",
  geografia: "Geografia",
  historia: "Hist\u00f3ria",
  biologia: "Biologia",
  fisica: "F\u00edsica",
  quimica: "Qu\u00edmica",
  redacao: "Reda\u00e7\u00e3o",
  filosofia: "Filosofia",
  sociologia: "Sociologia",
  outras: "Outra mat\u00e9ria",
};
const ALLOWED_SUBJECTS = new Set(Object.keys(SUBJECT_LABELS));
const ENEM_COMPETENCIES = [
  { id: 1, name: "Compet\u00eancia 1" },
  { id: 2, name: "Compet\u00eancia 2" },
  { id: 3, name: "Compet\u00eancia 3" },
  { id: 4, name: "Compet\u00eancia 4" },
  { id: 5, name: "Compet\u00eancia 5" },
];
const ESSAY_MAX_TITLE_LENGTH = 140;
const ESSAY_MAX_PROMPT_LENGTH = 240;
const ESSAY_MAX_TEXT_LENGTH = 12000;
const ESSAY_THEMES = [
  {
    key: "desinformacao_juventude",
    title: "Caminhos para combater a desinforma\u00e7\u00e3o entre jovens no ambiente digital",
    prompt:
      "Discuta os impactos da desinforma\u00e7\u00e3o na forma\u00e7\u00e3o cr\u00edtica dos jovens e proponha medidas educativas e institucionais para reduzir esse problema.",
  },
  {
    key: "saude_mental_estudantes",
    title: "Desafios para proteger a sa\u00fade mental de estudantes no Brasil",
    prompt:
      "Aborde fatores que pressionam estudantes, os impactos emocionais dessa realidade e uma proposta de interven\u00e7\u00e3o socialmente respons\u00e1vel.",
  },
  {
    key: "leitura_formacao",
    title: "A import\u00e2ncia do incentivo \u00e0 leitura na forma\u00e7\u00e3o dos jovens",
    prompt:
      "Analise como o h\u00e1bito da leitura interfere na autonomia intelectual, no desempenho escolar e na participa\u00e7\u00e3o social dos jovens brasileiros.",
  },
  {
    key: "sustentabilidade_cidades",
    title: "Desafios para tornar as cidades brasileiras mais sustent\u00e1veis",
    prompt:
      "Discuta obst\u00e1culos urbanos ligados a mobilidade, res\u00edduos, consumo e desigualdade, apresentando uma proposta de interven\u00e7\u00e3o aplic\u00e1vel.",
  },
  {
    key: "valorizacao_docente",
    title: "Caminhos para valorizar o trabalho docente no Brasil",
    prompt:
      "Avalie como a valoriza\u00e7\u00e3o de professores impacta a qualidade da educa\u00e7\u00e3o e proponha solu\u00e7\u00f5es vi\u00e1veis no contexto brasileiro.",
  },
];
const ESSAY_THEME_MAP = new Map(ESSAY_THEMES.map((theme) => [theme.key, theme]));
const ESSAY_EVALUATION_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: [
    "competencies",
    "totalScore",
    "summaryFeedback",
    "strengths",
    "mainProblems",
    "nextSteps",
    "interventionFeedback",
    "highlightedExcerpts",
  ],
  properties: {
    competencies: {
      type: "array",
      minItems: 5,
      maxItems: 5,
      items: {
        type: "object",
        additionalProperties: false,
        required: ["id", "name", "score", "justification", "improvement"],
        properties: {
          id: {
            type: "integer",
            minimum: 1,
            maximum: 5,
          },
          name: {
            type: "string",
          },
          score: {
            type: "integer",
            minimum: 0,
            maximum: 200,
          },
          justification: {
            type: "string",
          },
          improvement: {
            type: "string",
          },
        },
      },
    },
    totalScore: {
      type: "integer",
      minimum: 0,
      maximum: 1000,
    },
    summaryFeedback: {
      type: "string",
    },
    strengths: {
      type: "array",
      maxItems: 5,
      items: {
        type: "string",
      },
    },
    mainProblems: {
      type: "array",
      maxItems: 5,
      items: {
        type: "string",
      },
    },
    nextSteps: {
      type: "array",
      maxItems: 5,
      items: {
        type: "string",
      },
    },
    interventionFeedback: {
      type: "string",
    },
    highlightedExcerpts: {
      type: "array",
      maxItems: 4,
      items: {
        type: "string",
      },
    },
    analysisIndicators: {
      type: "array",
      maxItems: 6,
      items: {
        type: "string",
      },
    },
  },
};
const ESSAY_LOCAL_STOPWORDS = new Set([
  "a", "o", "as", "os", "de", "da", "do", "das", "dos", "e", "em", "no", "na", "nos", "nas",
  "um", "uma", "uns", "umas", "para", "por", "com", "sem", "sobre", "entre", "que", "se",
  "ao", "aos", "à", "às", "como", "mais", "menos", "muito", "muita", "muitos", "muitas",
  "ser", "estar", "ter", "há", "isso", "essa", "esse", "essas", "esses", "sua", "seu",
  "suas", "seus", "são", "foi", "era", "dos", "das", "pela", "pelo", "pelas", "pelos",
  "também", "já", "ainda", "quando", "onde", "porque", "pois", "num", "numa", "ele", "ela",
  "eles", "elas", "lhe", "lhes", "eu", "tu", "nós", "vocês", "você",
]);
const ESSAY_LOCAL_CONNECTIVES = [
  "além disso",
  "portanto",
  "assim",
  "desse modo",
  "nesse sentido",
  "sob essa ótica",
  "dessa forma",
  "contudo",
  "entretanto",
  "todavia",
  "porém",
  "logo",
  "outrossim",
  "em primeiro lugar",
  "em segundo lugar",
  "por conseguinte",
  "em síntese",
  "por fim",
  "ademais",
];
const ESSAY_LOCAL_THESIS_MARKERS = [
  "é preciso",
  "é necessário",
  "é fundamental",
  "torna-se",
  "deve-se",
  "nota-se",
  "percebe-se",
];
const ESSAY_LOCAL_CONCLUSION_MARKERS = [
  "portanto",
  "em síntese",
  "em suma",
  "por fim",
  "dessa forma",
  "desse modo",
  "assim",
];
const ESSAY_LOCAL_INTERVENTION_AGENTS = [
  "governo",
  "estado",
  "escola",
  "familia",
  "sociedade",
  "ministerio",
  "midia",
  "ong",
  "instituicoes",
  "prefeitura",
];
const ESSAY_LOCAL_INTERVENTION_ACTIONS = [
  "promover",
  "criar",
  "garantir",
  "oferecer",
  "ampliar",
  "investir",
  "fiscalizar",
  "desenvolver",
  "realizar",
  "implementar",
];
const ESSAY_LOCAL_INTERVENTION_MEANS = [
  "por meio de",
  "mediante",
  "através de",
  "com campanhas",
  "com apoio",
  "em parceria",
  "por intermédio",
];
const ESSAY_LOCAL_INTERVENTION_PURPOSE = [
  "para",
  "a fim de",
  "com o objetivo de",
  "visando",
];
const ESSAY_LOCAL_DETAIL_MARKERS = [
  "nas escolas",
  "na mídia",
  "na internet",
  "nas redes sociais",
  "com acompanhamento",
  "com metas",
  "com periodicidade",
];
const ESSAY_LOCAL_CAUSAL_MARKERS = [
  "porque",
  "pois",
  "já que",
  "uma vez que",
  "devido a",
  "em razão de",
  "por causa de",
  "visto que",
];
const ESSAY_LOCAL_EXAMPLE_MARKERS = [
  "por exemplo",
  "como",
  "segundo",
  "de acordo com",
  "conforme",
  "a exemplo de",
  "isto é",
];
const ESSAY_LOCAL_REPERTOIRE_MARKERS = [
  "constituicao federal",
  "direitos humanos",
  "declaracao universal",
  "ibge",
  "ipea",
  "onu",
  "unesco",
  "organizacao mundial da saude",
  "paulo freire",
  "zygmunt bauman",
  "milton santos",
  "sartre",
  "aristoteles",
  "platao",
  "durkheim",
  "foucault",
  "simone de beauvoir",
  "george orwell",
  "revolucao industrial",
  "idade media",
  "seculo xxi",
];
const ESSAY_LOCAL_INFORMAL_MARKERS = [
  "vc",
  "vcs",
  "pq",
  "tbm",
  "ta",
  "to",
  "pra",
  "pro",
  "tipo",
  "mano",
  "né",
  "ne",
];
const ALLOWED_ACTIVITIES = new Set([
  "serie",
  "game",
  "verbos",
  "frases",
  "escuta",
  "leitura",
  "outros",
]);
const SQL_ACTIVITY_LIST = "'serie', 'game', 'verbos', 'frases', 'escuta', 'leitura', 'outros'";
const STRUCTURED_SESSION_MIGRATION_KEY = "start5_structured_sessions_v2_subjects";
const DEFAULT_ADMIN = {
  name: process.env.START5_ADMIN_NAME || "Start 5 Owner",
  email: (process.env.START5_ADMIN_EMAIL || DEFAULT_ADMIN_EMAIL).toLowerCase(),
  password: process.env.START5_ADMIN_PASSWORD || DEFAULT_ADMIN_PASSWORD,
};
const rateLimitStore = new Map();

if (!existsSync(dataDir)) {
  mkdirSync(dataDir, { recursive: true });
}

const db = new DatabaseSync(dbFile);
let openAIClientPromise = null;

db.exec("PRAGMA foreign_keys = ON;");
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    first_name TEXT NOT NULL DEFAULT '',
    last_name TEXT NOT NULL DEFAULT '',
    avatar_data_url TEXT NOT NULL DEFAULT '',
    focus_subject_key TEXT NOT NULL DEFAULT 'ingles',
    focus_subject_name TEXT NOT NULL DEFAULT '',
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
    activities_json TEXT NOT NULL DEFAULT '[]',
    subject_key TEXT NOT NULL DEFAULT 'ingles',
    custom_subject_name TEXT NOT NULL DEFAULT '',
    topic_text TEXT NOT NULL DEFAULT '',
    verbs_text TEXT NOT NULL DEFAULT '',
    phrases_text TEXT NOT NULL DEFAULT '',
    notes_text TEXT NOT NULL DEFAULT '',
    date_key TEXT NOT NULL,
    started_at TEXT NOT NULL,
    ended_at TEXT NOT NULL,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL DEFAULT '',
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS session_activities (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    session_id INTEGER NOT NULL,
    activity_key TEXT NOT NULL CHECK (activity_key IN (${SQL_ACTIVITY_LIST})),
    other_label TEXT NOT NULL DEFAULT '',
    created_at TEXT NOT NULL,
    FOREIGN KEY (session_id) REFERENCES start_sessions(id) ON DELETE CASCADE,
    UNIQUE(session_id, activity_key)
  );

  CREATE TABLE IF NOT EXISTS session_verbs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    session_id INTEGER NOT NULL,
    verb TEXT NOT NULL,
    created_at TEXT NOT NULL,
    FOREIGN KEY (session_id) REFERENCES start_sessions(id) ON DELETE CASCADE,
    UNIQUE(session_id, verb)
  );

  CREATE TABLE IF NOT EXISTS session_phrases (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    session_id INTEGER NOT NULL,
    phrase TEXT NOT NULL,
    created_at TEXT NOT NULL,
    FOREIGN KEY (session_id) REFERENCES start_sessions(id) ON DELETE CASCADE,
    UNIQUE(session_id, phrase)
  );

  CREATE TABLE IF NOT EXISTS app_meta (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL
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

  CREATE TABLE IF NOT EXISTS essay_submissions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    theme_mode TEXT NOT NULL DEFAULT 'preset' CHECK (theme_mode IN ('preset', 'custom')),
    theme_key TEXT NOT NULL DEFAULT '',
    theme_title TEXT NOT NULL DEFAULT '',
    theme_prompt TEXT NOT NULL DEFAULT '',
    essay_text TEXT NOT NULL DEFAULT '',
    word_count INTEGER NOT NULL DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'evaluated', 'failed')),
    competency_1_score INTEGER NOT NULL DEFAULT 0,
    competency_2_score INTEGER NOT NULL DEFAULT 0,
    competency_3_score INTEGER NOT NULL DEFAULT 0,
    competency_4_score INTEGER NOT NULL DEFAULT 0,
    competency_5_score INTEGER NOT NULL DEFAULT 0,
    total_score INTEGER NOT NULL DEFAULT 0,
    evaluation_json TEXT NOT NULL DEFAULT '',
    error_message TEXT NOT NULL DEFAULT '',
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    evaluated_at TEXT NOT NULL DEFAULT '',
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  );

  CREATE INDEX IF NOT EXISTS idx_start_sessions_user_date
  ON start_sessions (user_id, date_key);

  CREATE UNIQUE INDEX IF NOT EXISTS idx_start_sessions_dedup
  ON start_sessions (user_id, started_at, minutes, state);

  CREATE INDEX IF NOT EXISTS idx_session_activities_session
  ON session_activities (session_id);

  CREATE INDEX IF NOT EXISTS idx_session_verbs_session
  ON session_verbs (session_id);

  CREATE INDEX IF NOT EXISTS idx_session_phrases_session
  ON session_phrases (session_id);

  CREATE INDEX IF NOT EXISTS idx_auth_sessions_token
  ON auth_sessions (token_hash);

  CREATE INDEX IF NOT EXISTS idx_essay_submissions_user_created
  ON essay_submissions (user_id, created_at DESC);

  CREATE INDEX IF NOT EXISTS idx_essay_submissions_status
  ON essay_submissions (status);
`);

function ensureStartSessionColumns() {
  const existingColumns = db
    .prepare("PRAGMA table_info(start_sessions)")
    .all()
    .map((column) => column.name);

  const migrations = [
    {
      name: "activities_json",
      sql: "ALTER TABLE start_sessions ADD COLUMN activities_json TEXT NOT NULL DEFAULT '[]'",
    },
    {
      name: "verbs_text",
      sql: "ALTER TABLE start_sessions ADD COLUMN verbs_text TEXT NOT NULL DEFAULT ''",
    },
    {
      name: "subject_key",
      sql: "ALTER TABLE start_sessions ADD COLUMN subject_key TEXT NOT NULL DEFAULT 'ingles'",
    },
    {
      name: "custom_subject_name",
      sql: "ALTER TABLE start_sessions ADD COLUMN custom_subject_name TEXT NOT NULL DEFAULT ''",
    },
    {
      name: "topic_text",
      sql: "ALTER TABLE start_sessions ADD COLUMN topic_text TEXT NOT NULL DEFAULT ''",
    },
    {
      name: "phrases_text",
      sql: "ALTER TABLE start_sessions ADD COLUMN phrases_text TEXT NOT NULL DEFAULT ''",
    },
    {
      name: "notes_text",
      sql: "ALTER TABLE start_sessions ADD COLUMN notes_text TEXT NOT NULL DEFAULT ''",
    },
    {
      name: "updated_at",
      sql: "ALTER TABLE start_sessions ADD COLUMN updated_at TEXT NOT NULL DEFAULT ''",
    },
  ];

  migrations.forEach((migration) => {
    if (!existingColumns.includes(migration.name)) {
      db.exec(migration.sql);
    }
  });

  db.exec("UPDATE start_sessions SET updated_at = created_at WHERE updated_at = ''");
}

function ensureUserColumns() {
  const existingColumns = db
    .prepare("PRAGMA table_info(users)")
    .all()
    .map((column) => column.name);

  const migrations = [
    {
      name: "first_name",
      sql: "ALTER TABLE users ADD COLUMN first_name TEXT NOT NULL DEFAULT ''",
    },
    {
      name: "last_name",
      sql: "ALTER TABLE users ADD COLUMN last_name TEXT NOT NULL DEFAULT ''",
    },
    {
      name: "avatar_data_url",
      sql: "ALTER TABLE users ADD COLUMN avatar_data_url TEXT NOT NULL DEFAULT ''",
    },
    {
      name: "focus_subject_key",
      sql: "ALTER TABLE users ADD COLUMN focus_subject_key TEXT NOT NULL DEFAULT 'ingles'",
    },
    {
      name: "focus_subject_name",
      sql: "ALTER TABLE users ADD COLUMN focus_subject_name TEXT NOT NULL DEFAULT ''",
    },
  ];

  migrations.forEach((migration) => {
    if (!existingColumns.includes(migration.name)) {
      db.exec(migration.sql);
    }
  });
}

function ensureEssaySubmissionColumns() {
  const existingColumns = db
    .prepare("PRAGMA table_info(essay_submissions)")
    .all()
    .map((column) => column.name);

  if (!existingColumns.length) {
    return;
  }

  const migrations = [
    {
      name: "theme_mode",
      sql: "ALTER TABLE essay_submissions ADD COLUMN theme_mode TEXT NOT NULL DEFAULT 'preset'",
    },
    {
      name: "theme_key",
      sql: "ALTER TABLE essay_submissions ADD COLUMN theme_key TEXT NOT NULL DEFAULT ''",
    },
    {
      name: "theme_title",
      sql: "ALTER TABLE essay_submissions ADD COLUMN theme_title TEXT NOT NULL DEFAULT ''",
    },
    {
      name: "theme_prompt",
      sql: "ALTER TABLE essay_submissions ADD COLUMN theme_prompt TEXT NOT NULL DEFAULT ''",
    },
    {
      name: "essay_text",
      sql: "ALTER TABLE essay_submissions ADD COLUMN essay_text TEXT NOT NULL DEFAULT ''",
    },
    {
      name: "word_count",
      sql: "ALTER TABLE essay_submissions ADD COLUMN word_count INTEGER NOT NULL DEFAULT 0",
    },
    {
      name: "status",
      sql: "ALTER TABLE essay_submissions ADD COLUMN status TEXT NOT NULL DEFAULT 'pending'",
    },
    {
      name: "competency_1_score",
      sql: "ALTER TABLE essay_submissions ADD COLUMN competency_1_score INTEGER NOT NULL DEFAULT 0",
    },
    {
      name: "competency_2_score",
      sql: "ALTER TABLE essay_submissions ADD COLUMN competency_2_score INTEGER NOT NULL DEFAULT 0",
    },
    {
      name: "competency_3_score",
      sql: "ALTER TABLE essay_submissions ADD COLUMN competency_3_score INTEGER NOT NULL DEFAULT 0",
    },
    {
      name: "competency_4_score",
      sql: "ALTER TABLE essay_submissions ADD COLUMN competency_4_score INTEGER NOT NULL DEFAULT 0",
    },
    {
      name: "competency_5_score",
      sql: "ALTER TABLE essay_submissions ADD COLUMN competency_5_score INTEGER NOT NULL DEFAULT 0",
    },
    {
      name: "total_score",
      sql: "ALTER TABLE essay_submissions ADD COLUMN total_score INTEGER NOT NULL DEFAULT 0",
    },
    {
      name: "evaluation_json",
      sql: "ALTER TABLE essay_submissions ADD COLUMN evaluation_json TEXT NOT NULL DEFAULT ''",
    },
    {
      name: "error_message",
      sql: "ALTER TABLE essay_submissions ADD COLUMN error_message TEXT NOT NULL DEFAULT ''",
    },
    {
      name: "updated_at",
      sql: "ALTER TABLE essay_submissions ADD COLUMN updated_at TEXT NOT NULL DEFAULT ''",
    },
    {
      name: "evaluated_at",
      sql: "ALTER TABLE essay_submissions ADD COLUMN evaluated_at TEXT NOT NULL DEFAULT ''",
    },
  ];

  migrations.forEach((migration) => {
    if (!existingColumns.includes(migration.name)) {
      db.exec(migration.sql);
    }
  });

  db.exec("UPDATE essay_submissions SET updated_at = created_at WHERE updated_at = ''");
}

ensureUserColumns();
ensureStartSessionColumns();
ensureEssaySubmissionColumns();

const insertUserStatement = db.prepare(`
  INSERT INTO users (name, first_name, last_name, email, password_hash, role, created_at)
  VALUES (?, ?, ?, ?, ?, ?, ?)
`);

const findUserByEmailStatement = db.prepare(`
  SELECT
    id,
    name,
    first_name AS firstName,
    last_name AS lastName,
    avatar_data_url AS avatarDataUrl,
    focus_subject_key AS focusSubjectKey,
    focus_subject_name AS focusSubjectName,
    email,
    password_hash,
    role,
    created_at AS createdAt
  FROM users
  WHERE email = ?
`);

const findUserByIdStatement = db.prepare(`
  SELECT
    id,
    name,
    first_name AS firstName,
    last_name AS lastName,
    avatar_data_url AS avatarDataUrl,
    focus_subject_key AS focusSubjectKey,
    focus_subject_name AS focusSubjectName,
    email,
    role,
    created_at AS createdAt
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
    users.first_name AS firstName,
    users.last_name AS lastName,
    users.avatar_data_url AS avatarDataUrl,
    users.focus_subject_key AS focusSubjectKey,
    users.focus_subject_name AS focusSubjectName,
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

const selectMetaStatement = db.prepare(`
  SELECT value
  FROM app_meta
  WHERE key = ?
`);

const upsertMetaStatement = db.prepare(`
  INSERT INTO app_meta (key, value)
  VALUES (?, ?)
  ON CONFLICT(key) DO UPDATE SET value = excluded.value
`);

const insertStartSessionStatement = db.prepare(`
  INSERT INTO start_sessions (
    user_id,
    state,
    minutes,
    type,
    activities_json,
    subject_key,
    custom_subject_name,
    topic_text,
    verbs_text,
    phrases_text,
    notes_text,
    date_key,
    started_at,
    ended_at,
    created_at,
    updated_at
  )
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`);

const updateStartSessionStatement = db.prepare(`
  UPDATE start_sessions
  SET
    state = ?,
    minutes = ?,
    type = ?,
    activities_json = ?,
    subject_key = ?,
    custom_subject_name = ?,
    topic_text = ?,
    verbs_text = ?,
    phrases_text = ?,
    notes_text = ?,
    date_key = ?,
    ended_at = ?,
    updated_at = ?
  WHERE id = ? AND user_id = ?
`);

const deleteStartSessionStatement = db.prepare(`
  DELETE FROM start_sessions
  WHERE id = ? AND user_id = ?
`);

const listUserSessionsStatement = db.prepare(`
  SELECT
    id,
    user_id AS userId,
    state,
    minutes,
    type,
    activities_json AS activitiesJson,
    subject_key AS subjectKey,
    custom_subject_name AS customSubjectName,
    topic_text AS topicText,
    verbs_text AS verbsText,
    phrases_text AS phrasesText,
    notes_text AS notesText,
    date_key AS dateKey,
    started_at AS startedAt,
    ended_at AS endedAt,
    created_at AS createdAt,
    updated_at AS updatedAt
  FROM start_sessions
  WHERE user_id = ?
  ORDER BY started_at DESC
`);

const getUserSessionStatement = db.prepare(`
  SELECT
    id,
    user_id AS userId,
    state,
    minutes,
    type,
    activities_json AS activitiesJson,
    subject_key AS subjectKey,
    custom_subject_name AS customSubjectName,
    topic_text AS topicText,
    verbs_text AS verbsText,
    phrases_text AS phrasesText,
    notes_text AS notesText,
    date_key AS dateKey,
    started_at AS startedAt,
    ended_at AS endedAt,
    created_at AS createdAt,
    updated_at AS updatedAt
  FROM start_sessions
  WHERE id = ? AND user_id = ?
`);

const listAllSessionsForMigrationStatement = db.prepare(`
  SELECT
    id,
    user_id AS userId,
    state,
    minutes,
    type,
    activities_json AS activitiesJson,
    subject_key AS subjectKey,
    custom_subject_name AS customSubjectName,
    topic_text AS topicText,
    verbs_text AS verbsText,
    phrases_text AS phrasesText,
    notes_text AS notesText,
    date_key AS dateKey,
    started_at AS startedAt,
    ended_at AS endedAt,
    created_at AS createdAt,
    updated_at AS updatedAt
  FROM start_sessions
  ORDER BY id ASC
`);

const insertSessionActivityStatement = db.prepare(`
  INSERT INTO session_activities (session_id, activity_key, other_label, created_at)
  VALUES (?, ?, ?, ?)
`);

const deleteSessionActivitiesStatement = db.prepare(`
  DELETE FROM session_activities
  WHERE session_id = ?
`);

const insertSessionVerbStatement = db.prepare(`
  INSERT INTO session_verbs (session_id, verb, created_at)
  VALUES (?, ?, ?)
`);

const deleteSessionVerbsStatement = db.prepare(`
  DELETE FROM session_verbs
  WHERE session_id = ?
`);

const insertSessionPhraseStatement = db.prepare(`
  INSERT INTO session_phrases (session_id, phrase, created_at)
  VALUES (?, ?, ?)
`);

const deleteSessionPhrasesStatement = db.prepare(`
  DELETE FROM session_phrases
  WHERE session_id = ?
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
    users.first_name AS firstName,
    users.last_name AS lastName,
    users.avatar_data_url AS avatarDataUrl,
    users.focus_subject_key AS focusSubjectKey,
    users.focus_subject_name AS focusSubjectName,
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

const adminUserByIdStatement = db.prepare(`
  SELECT
    users.id,
    users.name,
    users.first_name AS firstName,
    users.last_name AS lastName,
    users.avatar_data_url AS avatarDataUrl,
    users.focus_subject_key AS focusSubjectKey,
    users.focus_subject_name AS focusSubjectName,
    users.email,
    users.role,
    users.created_at AS createdAt,
    COUNT(start_sessions.id) AS totalSessions,
    COALESCE(ROUND(SUM(start_sessions.minutes), 1), 0) AS totalMinutes,
    MAX(start_sessions.started_at) AS lastSessionAt
  FROM users
  LEFT JOIN start_sessions ON start_sessions.user_id = users.id
  WHERE users.id = ?
  GROUP BY users.id
`);

const updateUserRoleStatement = db.prepare(`
  UPDATE users
  SET role = ?
  WHERE id = ?
`);

const updateUserEmailStatement = db.prepare(`
  UPDATE users
  SET email = ?
  WHERE id = ?
`);

const updateUserPasswordStatement = db.prepare(`
  UPDATE users
  SET password_hash = ?
  WHERE id = ?
`);

const updateUserProfileStatement = db.prepare(`
  UPDATE users
  SET
    name = ?,
    first_name = ?,
    last_name = ?,
    avatar_data_url = ?,
    focus_subject_key = ?,
    focus_subject_name = ?
  WHERE id = ?
`);

const listUserEssaySubmissionsStatement = db.prepare(`
  SELECT
    id,
    user_id AS userId,
    theme_mode AS themeMode,
    theme_key AS themeKey,
    theme_title AS themeTitle,
    theme_prompt AS themePrompt,
    essay_text AS essayText,
    word_count AS wordCount,
    status,
    competency_1_score AS competency1Score,
    competency_2_score AS competency2Score,
    competency_3_score AS competency3Score,
    competency_4_score AS competency4Score,
    competency_5_score AS competency5Score,
    total_score AS totalScore,
    evaluation_json AS evaluationJson,
    error_message AS errorMessage,
    created_at AS createdAt,
    updated_at AS updatedAt,
    evaluated_at AS evaluatedAt
  FROM essay_submissions
  WHERE user_id = ?
  ORDER BY created_at DESC, id DESC
`);

const getUserEssaySubmissionStatement = db.prepare(`
  SELECT
    id,
    user_id AS userId,
    theme_mode AS themeMode,
    theme_key AS themeKey,
    theme_title AS themeTitle,
    theme_prompt AS themePrompt,
    essay_text AS essayText,
    word_count AS wordCount,
    status,
    competency_1_score AS competency1Score,
    competency_2_score AS competency2Score,
    competency_3_score AS competency3Score,
    competency_4_score AS competency4Score,
    competency_5_score AS competency5Score,
    total_score AS totalScore,
    evaluation_json AS evaluationJson,
    error_message AS errorMessage,
    created_at AS createdAt,
    updated_at AS updatedAt,
    evaluated_at AS evaluatedAt
  FROM essay_submissions
  WHERE id = ? AND user_id = ?
`);

const getEssaySubmissionByIdStatement = db.prepare(`
  SELECT
    id,
    user_id AS userId,
    theme_mode AS themeMode,
    theme_key AS themeKey,
    theme_title AS themeTitle,
    theme_prompt AS themePrompt,
    essay_text AS essayText,
    word_count AS wordCount,
    status,
    competency_1_score AS competency1Score,
    competency_2_score AS competency2Score,
    competency_3_score AS competency3Score,
    competency_4_score AS competency4Score,
    competency_5_score AS competency5Score,
    total_score AS totalScore,
    evaluation_json AS evaluationJson,
    error_message AS errorMessage,
    created_at AS createdAt,
    updated_at AS updatedAt,
    evaluated_at AS evaluatedAt
  FROM essay_submissions
  WHERE id = ?
`);

const insertEssaySubmissionStatement = db.prepare(`
  INSERT INTO essay_submissions (
    user_id,
    theme_mode,
    theme_key,
    theme_title,
    theme_prompt,
    essay_text,
    word_count,
    status,
    created_at,
    updated_at
  )
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`);

const updateEssaySubmissionSuccessStatement = db.prepare(`
  UPDATE essay_submissions
  SET
    status = 'evaluated',
    competency_1_score = ?,
    competency_2_score = ?,
    competency_3_score = ?,
    competency_4_score = ?,
    competency_5_score = ?,
    total_score = ?,
    evaluation_json = ?,
    error_message = '',
    updated_at = ?,
    evaluated_at = ?
  WHERE id = ? AND user_id = ?
`);

const updateEssaySubmissionFailureStatement = db.prepare(`
  UPDATE essay_submissions
  SET
    status = 'failed',
    error_message = ?,
    updated_at = ?
  WHERE id = ? AND user_id = ?
`);

const listEssayMetricRowsStatement = db.prepare(`
  SELECT
    user_id AS userId,
    theme_mode AS themeMode,
    theme_key AS themeKey,
    theme_title AS themeTitle,
    status,
    competency_1_score AS competency1Score,
    competency_2_score AS competency2Score,
    competency_3_score AS competency3Score,
    competency_4_score AS competency4Score,
    competency_5_score AS competency5Score,
    total_score AS totalScore,
    created_at AS createdAt,
    evaluated_at AS evaluatedAt
  FROM essay_submissions
  ORDER BY created_at DESC, id DESC
`);

const countAdminsStatement = db.prepare(`
  SELECT COUNT(*) AS total
  FROM users
  WHERE role = 'admin'
`);

function nowIso() {
  return new Date().toISOString();
}

function normalizePersonNamePart(value) {
  return String(value || "")
    .trim()
    .replace(/\s+/g, " ");
}

function splitStoredName(name, firstName = "", lastName = "") {
  const safeFirstName = normalizePersonNamePart(firstName);
  const safeLastName = normalizePersonNamePart(lastName);

  if (safeFirstName || safeLastName) {
    return {
      firstName: safeFirstName,
      lastName: safeLastName,
    };
  }

  const safeName = normalizePersonNamePart(name);
  const [derivedFirstName = "", ...rest] = safeName.split(" ");

  return {
    firstName: derivedFirstName,
    lastName: rest.join(" ").trim(),
  };
}

function buildFullName(firstName = "", lastName = "", fallbackName = "") {
  const safeFirstName = normalizePersonNamePart(firstName);
  const safeLastName = normalizePersonNamePart(lastName);
  const combinedName = [safeFirstName, safeLastName].filter(Boolean).join(" ").trim();

  return combinedName || normalizePersonNamePart(fallbackName);
}

function sanitizeSubjectKey(value, fallback = DEFAULT_SUBJECT_KEY, allowEmpty = false) {
  const normalizedValue = String(value || "").trim().toLowerCase();

  if (!normalizedValue) {
    return allowEmpty ? "" : fallback;
  }

  return ALLOWED_SUBJECTS.has(normalizedValue) ? normalizedValue : fallback;
}

function sanitizeSubjectName(value, maxLength = 60) {
  return sanitizeShortText(value, maxLength);
}

function sanitizeTopicText(value, maxLength = 140) {
  return sanitizeShortText(value, maxLength);
}

function getSubjectLabel(subjectKey, customSubjectName = "") {
  if (subjectKey === "outras" && customSubjectName) {
    return customSubjectName;
  }

  return SUBJECT_LABELS[subjectKey] || SUBJECT_LABELS[DEFAULT_SUBJECT_KEY];
}

function getLegacyActivityLabel(activityKey) {
  const labels = {
    serie: "S\u00e9rie em ingl\u00eas",
    game: "Game em ingl\u00eas",
    verbos: "Estudo de verbos",
    frases: "Repeti\u00e7\u00e3o de frases",
    escuta: "Escuta em ingl\u00eas",
    leitura: "Leitura em ingl\u00eas",
    outros: "Pr\u00e1tica livre",
  };

  return labels[activityKey] || "Pr\u00e1tica livre";
}

function deriveLegacyTopicText(
  subjectKey,
  activities = [],
  otherLabel = "",
  verbs = [],
  phrases = [],
  fallbackValue = ""
) {
  const directTopic = sanitizeTopicText(fallbackValue);

  if (directTopic) {
    return directTopic;
  }

  if (subjectKey === "outras" && otherLabel) {
    return sanitizeTopicText(otherLabel);
  }

  const activityLabels = activities
    .map((activity) => (activity === "outros" && otherLabel ? otherLabel : getLegacyActivityLabel(activity)))
    .filter(Boolean);

  if (activityLabels.length) {
    return sanitizeTopicText(activityLabels.join(", "));
  }

  if (verbs.length) {
    return "Estudo de verbos";
  }

  if (phrases.length) {
    return "Repeti\u00e7\u00e3o de frases";
  }

  return subjectKey === DEFAULT_SUBJECT_KEY
    ? "Pr\u00e1tica livre de ingl\u00eas"
    : `Estudo de ${getSubjectLabel(subjectKey, otherLabel).toLowerCase()}`;
}

function sanitizeAvatarDataUrl(value) {
  if (value === undefined) {
    return undefined;
  }

  if (value === null || value === "") {
    return "";
  }

  const safeValue = String(value).trim();
  const isAllowedImage = /^data:image\/(png|jpeg|webp|gif);base64,[a-z0-9+/=]+$/i.test(safeValue);

  if (!isAllowedImage) {
    throw createError(400, "Envie uma imagem valida em PNG, JPG, WEBP ou GIF.");
  }

  if (safeValue.length > 1_600_000) {
    throw createError(400, "A imagem esta muito grande. Use um arquivo menor.");
  }

  return safeValue;
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

function getClientAddress(request) {
  const forwardedFor = String(request.headers["x-forwarded-for"] || "")
    .split(",")
    .map((entry) => entry.trim())
    .find(Boolean);

  return forwardedFor || request.socket?.remoteAddress || "unknown";
}

function isSecureRequest(request) {
  const forwardedProto = String(request.headers["x-forwarded-proto"] || "")
    .split(",")[0]
    .trim()
    .toLowerCase();

  return forwardedProto === "https" || Boolean(request.socket?.encrypted);
}

function getRequestOrigin(request) {
  const rawOrigin = String(request.headers.origin || "").trim().replace(/\/+$/, "");

  if (rawOrigin) {
    return rawOrigin;
  }

  const rawReferer = String(request.headers.referer || "").trim();

  if (!rawReferer) {
    return "";
  }

  try {
    const refererUrl = new URL(rawReferer);
    return refererUrl.origin;
  } catch {
    return "";
  }
}

function getExpectedOrigin(request) {
  if (PUBLIC_ORIGIN) {
    return PUBLIC_ORIGIN;
  }

  const host = String(request.headers.host || "").trim();

  if (!host) {
    return "";
  }

  return `${isSecureRequest(request) ? "https" : "http"}://${host}`;
}

function cleanupRateLimitStore(now = Date.now()) {
  for (const [key, record] of rateLimitStore.entries()) {
    if (record.resetAt <= now) {
      rateLimitStore.delete(key);
    }
  }
}

function consumeRateLimit(bucket, key, maxRequests, windowMs) {
  const now = Date.now();

  if (rateLimitStore.size > 2_000) {
    cleanupRateLimitStore(now);
  }

  const bucketKey = `${bucket}:${key}`;
  const currentRecord = rateLimitStore.get(bucketKey);

  if (!currentRecord || currentRecord.resetAt <= now) {
    rateLimitStore.set(bucketKey, {
      count: 1,
      resetAt: now + windowMs,
    });
    return;
  }

  currentRecord.count += 1;

  if (currentRecord.count > maxRequests) {
    const retryAfterSeconds = Math.max(1, Math.ceil((currentRecord.resetAt - now) / 1000));
    const error = createError(429, "Muitas tentativas em pouco tempo. Aguarde e tente novamente.");
    error.retryAfter = retryAfterSeconds;
    throw error;
  }
}

function enforceAuthRateLimit(request, pathname) {
  const clientAddress = getClientAddress(request);
  consumeRateLimit("auth", `${pathname}:${clientAddress}`, AUTH_RATE_LIMIT_MAX, AUTH_RATE_LIMIT_WINDOW_MS);
}

function enforceWriteRateLimit(request) {
  const clientAddress = getClientAddress(request);
  const user = getAuthenticatedUser(request);
  const key = user ? `user:${user.id}` : `ip:${clientAddress}`;
  consumeRateLimit("write", key, WRITE_RATE_LIMIT_MAX, WRITE_RATE_LIMIT_WINDOW_MS);
}

function assertTrustedOrigin(request) {
  if (!["POST", "PATCH", "PUT", "DELETE"].includes(request.method || "")) {
    return;
  }

  const fetchSite = String(request.headers["sec-fetch-site"] || "").trim().toLowerCase();

  if (fetchSite && !["same-origin", "same-site", "none"].includes(fetchSite)) {
    throw createError(403, "Origem da requisicao bloqueada.");
  }

  const requestOrigin = getRequestOrigin(request);

  if (!requestOrigin) {
    return;
  }

  const expectedOrigin = getExpectedOrigin(request);

  if (expectedOrigin && requestOrigin !== expectedOrigin) {
    throw createError(403, "Origem da requisicao bloqueada.");
  }
}

function setSecurityHeaders(request, response, pathname = "") {
  const cspDirectives = [
    "default-src 'self'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    "object-src 'none'",
    "script-src 'self'",
    "style-src 'self' https://fonts.googleapis.com",
    "font-src 'self' https://fonts.gstatic.com data:",
    "img-src 'self' data: https:",
    "connect-src 'self'",
  ];

  if (IS_PRODUCTION) {
    cspDirectives.push("upgrade-insecure-requests");
    response.setHeader("Strict-Transport-Security", "max-age=31536000; includeSubDomains");
  }

  response.setHeader("Content-Security-Policy", cspDirectives.join("; "));
  response.setHeader("Referrer-Policy", "no-referrer");
  response.setHeader("X-Content-Type-Options", "nosniff");
  response.setHeader("X-Frame-Options", "DENY");
  response.setHeader("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
  response.setHeader("Cross-Origin-Opener-Policy", "same-origin");
  response.setHeader("Cross-Origin-Resource-Policy", "same-origin");

  if (pathname.startsWith("/api/")) {
    response.setHeader("Cache-Control", "no-store");
  }
}

function parseCookies(cookieHeader = "") {
  return cookieHeader.split(";").reduce((accumulator, chunk) => {
    const [rawKey, ...rest] = chunk.trim().split("=");
    if (!rawKey) return accumulator;
    accumulator[rawKey] = decodeURIComponent(rest.join("=") || "");
    return accumulator;
  }, {});
}

function setSessionCookie(request, response, token, expiresAt) {
  const maxAge = Math.max(0, Math.floor((expiresAt.getTime() - Date.now()) / 1000));
  const cookie = [
    `${SESSION_COOKIE}=${encodeURIComponent(token)}`,
    "Path=/",
    "HttpOnly",
    "SameSite=Lax",
    `Max-Age=${maxAge}`,
    "Priority=High",
  ];

  if (IS_PRODUCTION || isSecureRequest(request)) {
    cookie.push("Secure");
  }

  response.setHeader("Set-Cookie", cookie.join("; "));
}

function clearSessionCookie(request, response) {
  const cookie = [
    `${SESSION_COOKIE}=`,
    "Path=/",
    "HttpOnly",
    "SameSite=Lax",
    "Max-Age=0",
    "Expires=Thu, 01 Jan 1970 00:00:00 GMT",
    "Priority=High",
  ];

  if (IS_PRODUCTION || isSecureRequest(request)) {
    cookie.push("Secure");
  }

  response.setHeader("Set-Cookie", cookie.join("; "));
}

function sendJson(response, statusCode, payload) {
  const headers = {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store",
  };

  if (payload && Number.isInteger(payload.retryAfter) && payload.retryAfter > 0) {
    headers["Retry-After"] = String(payload.retryAfter);
  }

  response.writeHead(statusCode, headers);
  response.end(JSON.stringify(payload));
}

function createError(statusCode, message) {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
}

async function readRequestBody(request) {
  const contentType = String(request.headers["content-type"] || "").toLowerCase();
  const contentLength = Number(request.headers["content-length"] || 0);

  if (contentLength > BODY_LIMIT_BYTES) {
    throw createError(413, "A requisicao passou do limite permitido.");
  }

  if (contentType && !contentType.includes("application/json")) {
    throw createError(415, "Envie os dados em JSON.");
  }

  const chunks = [];
  let totalSize = 0;

  for await (const chunk of request) {
    totalSize += chunk.length;

    if (totalSize > BODY_LIMIT_BYTES) {
      throw createError(413, "A requisicao passou do limite permitido.");
    }

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

  const nameParts = splitStoredName(row.name, row.firstName, row.lastName);
  const focusSubjectKey = sanitizeSubjectKey(row.focusSubjectKey, DEFAULT_SUBJECT_KEY);
  const focusSubjectName = focusSubjectKey === "outras" ? sanitizeSubjectName(row.focusSubjectName) : "";

  return {
    id: row.id,
    name: buildFullName(nameParts.firstName, nameParts.lastName, row.name),
    firstName: nameParts.firstName,
    lastName: nameParts.lastName,
    avatarDataUrl: String(row.avatarDataUrl || ""),
    focusSubjectKey,
    focusSubjectName,
    focusSubjectLabel: getSubjectLabel(focusSubjectKey, focusSubjectName),
    email: row.email,
    role: row.role,
    createdAt: row.createdAt,
  };
}

function parseStoredJson(value, fallback) {
  try {
    return value ? JSON.parse(value) : fallback;
  } catch {
    return fallback;
  }
}

function parseStructuredItems(value) {
  if (Array.isArray(value)) {
    return value
      .flatMap((item) => parseStructuredItems(item))
      .filter((item, index, list) => item && list.indexOf(item) === index);
  }

  return String(value || "")
    .split(/[\n,;|/]+/g)
    .map((item) => item.trim())
    .filter((item, index, list) => item && list.indexOf(item) === index);
}

function sanitizeShortText(value, maxLength = 120) {
  return String(value || "").trim().replace(/\s+/g, " ").slice(0, maxLength);
}

function sanitizeEssayThemeMode(value) {
  const mode = String(value || "").trim().toLowerCase();
  return ESSAY_THEME_MODE_VALUES.has(mode) ? mode : "preset";
}

function sanitizeEssayPrompt(value, maxLength = ESSAY_MAX_PROMPT_LENGTH) {
  return String(value || "").trim().replace(/\s+/g, " ").slice(0, maxLength);
}

function sanitizeEssayText(value, maxLength = ESSAY_MAX_TEXT_LENGTH) {
  return String(value || "")
    .replace(/\r\n/g, "\n")
    .replace(/\t/g, " ")
    .split("\n")
    .map((line) => line.replace(/\s+/g, " ").trim())
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim()
    .slice(0, maxLength);
}

function countWords(value) {
  const text = String(value || "").trim();
  return text ? text.split(/\s+/g).length : 0;
}

function clampInteger(value, minimum, maximum) {
  const safeValue = Number(value);

  if (!Number.isFinite(safeValue)) {
    return minimum;
  }

  return Math.min(maximum, Math.max(minimum, Math.round(safeValue)));
}

function sanitizeEssayFeedbackText(value, maxLength = 420) {
  return String(value || "").trim().replace(/\s+/g, " ").slice(0, maxLength);
}

function sanitizeEssayFeedbackList(value, maxItems = 5, maxLength = 180) {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((item) => sanitizeEssayFeedbackText(item, maxLength))
    .filter((item, index, list) => item && list.indexOf(item) === index)
    .slice(0, maxItems);
}

function getEssayThemeDefinition(themeKey) {
  const normalizedKey = String(themeKey || "").trim().toLowerCase();
  return ESSAY_THEME_MAP.get(normalizedKey) || null;
}

function getEssayThemes() {
  return ESSAY_THEMES.map((theme) => ({ ...theme }));
}

function normalizeEssayPayload(payload) {
  const themeMode = sanitizeEssayThemeMode(payload?.themeMode);
  let themeKey = "";
  let themeTitle = "";
  let themePrompt = "";

  if (themeMode === "preset") {
    const theme = getEssayThemeDefinition(payload?.themeKey);

    if (!theme) {
      throw createError(400, "Escolha um tema sugerido valido.");
    }

    themeKey = theme.key;
    themeTitle = theme.title;
    themePrompt = theme.prompt;
  } else {
    themeTitle = sanitizeShortText(payload?.themeTitle, ESSAY_MAX_TITLE_LENGTH);
    themePrompt = sanitizeEssayPrompt(payload?.themePrompt, ESSAY_MAX_PROMPT_LENGTH);

    if (themeTitle.length < 6) {
      throw createError(400, "Informe um titulo claro para o tema livre.");
    }

    if (!themePrompt) {
      themePrompt = themeTitle;
    }
  }

  const essayText = sanitizeEssayText(payload?.essayText);
  const wordCount = countWords(essayText);

  if (essayText.length < 120 || wordCount < 20) {
    throw createError(400, "Escreva uma reda\u00e7\u00e3o mais completa antes de corrigir.");
  }

  const createdAt = nowIso();

  return {
    themeMode,
    themeKey,
    themeTitle,
    themePrompt,
    essayText,
    wordCount,
    status: "pending",
    createdAt,
    updatedAt: createdAt,
  };
}

function normalizeEssayEvaluation(rawEvaluation) {
  if (!rawEvaluation || typeof rawEvaluation !== "object") {
    throw new Error("A avalia\u00e7\u00e3o da IA veio em um formato inv\u00e1lido.");
  }

  const rawCompetencies = Array.isArray(rawEvaluation.competencies)
    ? rawEvaluation.competencies
    : [];
  const rawById = new Map(
    rawCompetencies.map((competency) => [Number(competency?.id), competency || {}])
  );

  const competencies = ENEM_COMPETENCIES.map((competency) => {
    const rawCompetency = rawById.get(competency.id) || rawCompetencies[competency.id - 1] || {};
    const score = clampInteger(rawCompetency.score, 0, 200);
    const justification = sanitizeEssayFeedbackText(rawCompetency.justification, 520);
    const improvement = sanitizeEssayFeedbackText(rawCompetency.improvement, 320);

    if (!justification || !improvement) {
      throw new Error("A avalia\u00e7\u00e3o da IA veio incompleta para as compet\u00eancias.");
    }

    return {
      id: competency.id,
      name: sanitizeEssayFeedbackText(rawCompetency.name, 80) || competency.name,
      score,
      justification,
      improvement,
    };
  });

  const totalScore = competencies.reduce((sum, competency) => sum + competency.score, 0);
  const summaryFeedback = sanitizeEssayFeedbackText(rawEvaluation.summaryFeedback, 640);
  const interventionFeedback = sanitizeEssayFeedbackText(rawEvaluation.interventionFeedback, 460);

  if (!summaryFeedback || !interventionFeedback) {
    throw new Error("A avalia\u00e7\u00e3o da IA n\u00e3o retornou o resumo principal esperado.");
  }

  return {
    competencies,
    totalScore,
    summaryFeedback,
    strengths: sanitizeEssayFeedbackList(rawEvaluation.strengths, 5, 200),
    mainProblems: sanitizeEssayFeedbackList(rawEvaluation.mainProblems, 5, 200),
    nextSteps: sanitizeEssayFeedbackList(rawEvaluation.nextSteps, 5, 200),
    interventionFeedback,
    highlightedExcerpts: sanitizeEssayFeedbackList(rawEvaluation.highlightedExcerpts, 4, 220),
    analysisIndicators: sanitizeEssayFeedbackList(rawEvaluation.analysisIndicators, 6, 180),
  };
}

function parseEssayEvaluation(value) {
  const parsed = parseStoredJson(value, null);

  if (!parsed || typeof parsed !== "object") {
    return null;
  }

  try {
    return normalizeEssayEvaluation(parsed);
  } catch {
    return null;
  }
}

function normalizeEssayAnalysisText(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9\s.!?]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function splitEssayParagraphs(value) {
  return String(value || "")
    .split(/\n+/g)
    .map((item) => item.trim())
    .filter(Boolean);
}

function splitEssaySentences(value) {
  const matches = String(value || "")
    .replace(/\n+/g, " ")
    .match(/[^.!?]+[.!?]?/g);

  return Array.isArray(matches)
    ? matches.map((item) => item.trim()).filter(Boolean)
    : [];
}

function escapeRegExp(value) {
  return String(value || "").replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function containsEssayAnalysisTerm(text, term) {
  const normalizedText = normalizeEssayAnalysisText(text);
  const normalizedTerm = normalizeEssayAnalysisText(term);

  if (!normalizedText || !normalizedTerm) {
    return false;
  }

  if (normalizedTerm.includes(" ")) {
    return normalizedText.includes(normalizedTerm);
  }

  return new RegExp(`(^|\\s)${escapeRegExp(normalizedTerm)}(?=\\s|$)`, "u").test(normalizedText);
}

function countEssayAnalysisMatches(text, terms) {
  return terms.reduce((total, term) => total + (containsEssayAnalysisTerm(text, term) ? 1 : 0), 0);
}

function getEssayThemeKeywords(...values) {
  const keywordSet = new Set();

  values.forEach((value) => {
    normalizeEssayAnalysisText(value)
      .split(/\s+/g)
      .filter((word) => word.length >= 4 && !ESSAY_LOCAL_STOPWORDS.has(word))
      .forEach((word) => keywordSet.add(word));
  });

  return [...keywordSet].slice(0, 10);
}

function normalizeEssayBandScore(value) {
  return clampInteger(Math.round((Number(value) || 0) / 20) * 20, 0, 200);
}

function getEssaySignificantWords(text, minLength = 4) {
  return normalizeEssayAnalysisText(text)
    .split(/\s+/g)
    .filter((word) => word.length >= minLength && !ESSAY_LOCAL_STOPWORDS.has(word));
}

function getEssayUniqueWordRatio(text) {
  const words = getEssaySignificantWords(text, 4);

  if (!words.length) {
    return 0;
  }

  return new Set(words).size / words.length;
}

function getEssayParagraphOpeningVariety(paragraphs) {
  const openings = paragraphs
    .map((paragraph) => getEssaySignificantWords(paragraph, 3).slice(0, 3).join(" "))
    .filter(Boolean);

  return new Set(openings).size;
}

function getEssayMarkerMetrics(text, markers) {
  const counts = new Map();
  let total = 0;

  markers.forEach((marker) => {
    if (containsEssayAnalysisTerm(text, marker)) {
      counts.set(marker, 1);
      total += 1;
    }
  });

  return {
    total,
    unique: counts.size,
    items: [...counts.keys()],
  };
}

function getEssayThemeCoverageMetrics(submission, paragraphs) {
  const keywords = getEssayThemeKeywords(submission?.themeTitle, submission?.themePrompt);
  const introText = paragraphs[0] || "";
  const bodyText = paragraphs.slice(1, -1).join(" ");
  const conclusionText = paragraphs[paragraphs.length - 1] || "";
  const allText = paragraphs.join(" ");

  const introHits = countEssayAnalysisMatches(introText, keywords);
  const bodyHits = countEssayAnalysisMatches(bodyText, keywords);
  const conclusionHits = countEssayAnalysisMatches(conclusionText, keywords);
  const totalHits = countEssayAnalysisMatches(allText, keywords);
  const coverage = keywords.length ? totalHits / keywords.length : 0;

  return {
    keywords,
    introHits,
    bodyHits,
    conclusionHits,
    totalHits,
    coverage,
  };
}

function getEssayInterventionMetrics(text) {
  return {
    agents: getEssayMarkerMetrics(text, ESSAY_LOCAL_INTERVENTION_AGENTS),
    actions: getEssayMarkerMetrics(text, ESSAY_LOCAL_INTERVENTION_ACTIONS),
    means: getEssayMarkerMetrics(text, ESSAY_LOCAL_INTERVENTION_MEANS),
    purposes: getEssayMarkerMetrics(text, ESSAY_LOCAL_INTERVENTION_PURPOSE),
    details: getEssayMarkerMetrics(text, ESSAY_LOCAL_DETAIL_MARKERS),
  };
}

function countEssayPresentComponents(interventionMetrics) {
  return [
    interventionMetrics.agents.total,
    interventionMetrics.actions.total,
    interventionMetrics.means.total,
    interventionMetrics.purposes.total,
    interventionMetrics.details.total,
  ].filter((value) => value > 0).length;
}

function buildLocalEssayEvaluation(submission, sourceError) {
  const essayText = String(submission?.essayText || "");
  const normalizedText = normalizeEssayAnalysisText(essayText);
  const paragraphs = splitEssayParagraphs(essayText);
  const sentences = splitEssaySentences(essayText);
  const wordCount = Number(submission?.wordCount) || countWords(essayText);
  const avgSentenceWords = sentences.length ? wordCount / sentences.length : wordCount;
  const uppercaseMatches = essayText.match(/\p{Lu}/gu) || [];
  const letterMatches = essayText.match(/\p{L}/gu) || [];
  const uppercaseRatio = letterMatches.length ? uppercaseMatches.length / letterMatches.length : 0;
  const exclamationCount = (essayText.match(/!/g) || []).length;
  const questionCount = (essayText.match(/\?/g) || []).length;
  const repeatedPunctuationCount = (essayText.match(/([!?.,;:])\1{1,}/g) || []).length;
  const informalMetrics = getEssayMarkerMetrics(normalizedText, ESSAY_LOCAL_INFORMAL_MARKERS);
  const connectiveMetrics = getEssayMarkerMetrics(normalizedText, ESSAY_LOCAL_CONNECTIVES);
  const causalMetrics = getEssayMarkerMetrics(normalizedText, ESSAY_LOCAL_CAUSAL_MARKERS);
  const exampleMetrics = getEssayMarkerMetrics(normalizedText, ESSAY_LOCAL_EXAMPLE_MARKERS);
  const repertoryMetrics = getEssayMarkerMetrics(normalizedText, ESSAY_LOCAL_REPERTOIRE_MARKERS);
  const thesisMarkerCount = countEssayAnalysisMatches(paragraphs[0] || essayText, ESSAY_LOCAL_THESIS_MARKERS);
  const conclusionMarkerCount = countEssayAnalysisMatches(paragraphs[paragraphs.length - 1] || essayText, ESSAY_LOCAL_CONCLUSION_MARKERS);
  const themeCoverage = getEssayThemeCoverageMetrics(submission, paragraphs);
  const conclusionText = paragraphs[paragraphs.length - 1] || essayText;
  const interventionMetrics = getEssayInterventionMetrics(conclusionText);
  const interventionComponentCount = countEssayPresentComponents(interventionMetrics);
  const uniqueWordRatio = getEssayUniqueWordRatio(essayText);
  const paragraphOpeningVariety = getEssayParagraphOpeningVariety(paragraphs);
  const bodyParagraphs = paragraphs.length > 2 ? paragraphs.slice(1, -1) : paragraphs.slice(1);
  const bodyParagraphCount = bodyParagraphs.length;
  const bodyParagraphsWithSubstance = bodyParagraphs.filter((paragraph) => countWords(paragraph) >= 45).length;
  const veryShortParagraphCount = paragraphs.filter((paragraph) => countWords(paragraph) < 25).length;
  const numericEvidenceCount = (essayText.match(/\b\d+(?:[.,]\d+)?\b|%/g) || []).length;

  let competency1Score = 80;
  if (wordCount >= 260) competency1Score += 20;
  if (paragraphs.length >= 4) competency1Score += 20;
  if (avgSentenceWords >= 10 && avgSentenceWords <= 28) competency1Score += 20;
  if (informalMetrics.total === 0) competency1Score += 20;
  if (exclamationCount === 0 && repeatedPunctuationCount === 0 && uppercaseRatio < 0.08) competency1Score += 20;
  if (uniqueWordRatio >= 0.45) competency1Score += 20;
  if (informalMetrics.total >= 1) competency1Score -= 20;
  if (avgSentenceWords < 6 || avgSentenceWords > 34) competency1Score -= 20;
  if (exclamationCount > 1 || questionCount > 2 || repeatedPunctuationCount > 0) competency1Score -= 20;
  if (veryShortParagraphCount >= 2) competency1Score -= 20;
  competency1Score = normalizeEssayBandScore(competency1Score);

  let competency2Score = 40;
  if (themeCoverage.coverage >= 0.6) competency2Score += 100;
  else if (themeCoverage.coverage >= 0.4) competency2Score += 80;
  else if (themeCoverage.coverage >= 0.25) competency2Score += 60;
  else if (themeCoverage.totalHits > 0) competency2Score += 40;
  else competency2Score += 20;
  if (themeCoverage.introHits > 0) competency2Score += 20;
  if (themeCoverage.bodyHits >= 2) competency2Score += 20;
  if (repertoryMetrics.total > 0) competency2Score += 20;
  if (thesisMarkerCount > 0) competency2Score += 20;
  competency2Score = normalizeEssayBandScore(competency2Score);

  let competency3Score = 40;
  if (paragraphs.length >= 4) competency3Score += 20;
  if (bodyParagraphCount >= 2) competency3Score += 20;
  if (bodyParagraphsWithSubstance >= 2) competency3Score += 20;
  if (thesisMarkerCount > 0) competency3Score += 20;
  if (causalMetrics.total >= 2) competency3Score += 20;
  if (exampleMetrics.total >= 1 || numericEvidenceCount > 0) competency3Score += 20;
  if (repertoryMetrics.total > 0) competency3Score += 20;
  if (themeCoverage.bodyHits >= 2) competency3Score += 20;
  competency3Score = normalizeEssayBandScore(competency3Score);

  let competency4Score = 40;
  if (connectiveMetrics.total >= 3) competency4Score += 20;
  if (connectiveMetrics.unique >= 3) competency4Score += 20;
  if (connectiveMetrics.unique >= 5) competency4Score += 20;
  if (paragraphOpeningVariety >= 3) competency4Score += 20;
  if (avgSentenceWords >= 10 && avgSentenceWords <= 28) competency4Score += 20;
  if (conclusionMarkerCount > 0) competency4Score += 20;
  if (paragraphs.length >= 4) competency4Score += 20;
  competency4Score = normalizeEssayBandScore(competency4Score);

  let competency5Score = 20;
  if (conclusionMarkerCount > 0) competency5Score += 20;
  competency5Score += interventionComponentCount * 30;
  if (countWords(conclusionText) >= 45) competency5Score += 10;
  if (interventionMetrics.details.total > 0) competency5Score += 10;
  competency5Score = normalizeEssayBandScore(competency5Score);

  const quotaOrConfigIssue =
    Number(sourceError?.statusCode) === 429 ||
    /quota|billing|rate limit|OPENAI_API_KEY|OPENAI_MODEL/i.test(String(sourceError?.message || ""));
  const fallbackPrefix = quotaOrConfigIssue
    ? "Avaliação local automática usada porque a IA não estava disponível agora."
    : "Avaliação local automática usada como plano de segurança.";

  const competencies = [
    {
      id: 1,
      name: "Competência 1",
      score: competency1Score,
      justification: `O texto trouxe ${wordCount} palavras em ${paragraphs.length} parágrafo(s), com média de ${Math.max(1, Math.round(avgSentenceWords))} palavras por frase. A formalidade ficou mais estável quando a pontuação e o registro se mantiveram regulares.`,
      improvement: informalMetrics.total > 0
        ? "Retire marcas de oralidade e revise ortografia, acentuação e pontuação frase por frase."
        : "Faça uma revisão final de ortografia, concordância e pontuação para sustentar um registro formal do começo ao fim.",
    },
    {
      id: 2,
      name: "Competência 2",
      score: competency2Score,
      justification: `A leitura temática encontrou ${themeCoverage.totalHits} aproximações com o tema, com cobertura estimada de ${Math.round(themeCoverage.coverage * 100)}% das palavras-chave analisadas, além de ${repertoryMetrics.total} referência(s) de repertório.`,
      improvement: themeCoverage.coverage < 0.35
        ? "Retome o foco do tema já na introdução e faça os parágrafos de desenvolvimento voltarem explicitamente ao recorte proposto."
        : "Aprofunde o recorte do tema com repertório e explicite melhor como cada argumento conversa com a proposta.",
    },
    {
      id: 3,
      name: "Competência 3",
      score: competency3Score,
      justification: `A argumentação foi estimada a partir da presença de tese na introdução, ${bodyParagraphsWithSubstance} parágrafo(s) de desenvolvimento com bom corpo textual, ${causalMetrics.total} marca(s) de causa e ${exampleMetrics.total + numericEvidenceCount} sinal(is) de exemplificação ou dado.`,
      improvement: bodyParagraphsWithSubstance < 2
        ? "Fortaleça os parágrafos de desenvolvimento com uma ideia central mais clara, explicação e consequência."
        : "Refine a progressão dos argumentos para que cada desenvolvimento avance a tese com mais precisão.",
    },
    {
      id: 4,
      name: "Competência 4",
      score: competency4Score,
      justification: `Foram identificados ${connectiveMetrics.total} conectivo(s) relevantes, com diversidade de ${connectiveMetrics.unique}, além de variedade de abertura em ${paragraphOpeningVariety} parágrafo(s), o que ajuda a medir a costura do texto.`,
      improvement: connectiveMetrics.unique < 3
        ? "Use conectivos mais variados entre frases e parágrafos para deixar a progressão das ideias mais fluida."
        : "Mantenha a coesão, mas refine a transição entre um argumento e outro para o texto soar mais orgânico.",
    },
    {
      id: 5,
      name: "Competência 5",
      score: competency5Score,
      justification: `Na parte final apareceram ${interventionComponentCount} componente(s) da proposta de intervenção, considerando agente, ação, meio, finalidade e detalhamento.`,
      improvement: interventionComponentCount < 4
        ? "Feche a redação com agente, ação, meio, finalidade e detalhamento mais explícitos para a proposta de intervenção ficar completa."
        : "Sua proposta já aparece, mas ainda pode ganhar mais detalhamento operacional para subir a nota.",
    },
  ];

  const sortedCompetencies = [...competencies].sort((left, right) => left.score - right.score);
  const weakestCompetency = sortedCompetencies[0];
  const strongestCompetency = sortedCompetencies[sortedCompetencies.length - 1];
  const totalScore = competencies.reduce((sum, item) => sum + item.score, 0);
  const highlightedExcerpts = [];

  [
    sentences[0],
    bodyParagraphs.find((paragraph) => countWords(paragraph) >= 45),
    sentences.find((item) => countEssayAnalysisMatches(item, ESSAY_LOCAL_INTERVENTION_ACTIONS) > 0),
    sentences[sentences.length - 1],
  ]
    .map((item) => sanitizeEssayFeedbackText(item, 220))
    .forEach((item) => {
      if (item && !highlightedExcerpts.includes(item) && highlightedExcerpts.length < 4) {
        highlightedExcerpts.push(item);
      }
    });

  const analysisIndicators = [
    `Estrutura: ${wordCount} palavras em ${paragraphs.length} parágrafo(s).`,
    `Tema: ${themeCoverage.totalHits} referência(s) diretas ao recorte, com cobertura aproximada de ${Math.round(themeCoverage.coverage * 100)}%.`,
    `Coesão: ${connectiveMetrics.total} conectivo(s) relevantes, com diversidade de ${connectiveMetrics.unique}.`,
    `Argumentação: ${bodyParagraphsWithSubstance} desenvolvimento(s) com bom corpo textual e ${exampleMetrics.total + numericEvidenceCount} marca(s) de exemplo ou dado.`,
    `Repertório: ${repertoryMetrics.total} referência(s) externas percebidas.`,
    `Intervenção: ${interventionComponentCount} elemento(s) da proposta de intervenção identificados na conclusão.`,
  ];

  return normalizeEssayEvaluation({
    competencies,
    totalScore,
    summaryFeedback: `${fallbackPrefix} Sua nota estimada ficou em ${totalScore} pontos. Neste texto, ${strongestCompetency.name} apareceu como ponto mais forte, enquanto ${weakestCompetency.name} segue como prioridade principal de melhora.`,
    strengths: [
      `${strongestCompetency.name} foi a competência mais consistente nesta leitura automatizada.`,
      paragraphs.length >= 4 ? "A estrutura em parágrafos já ajuda a organizar a leitura." : "Há uma base inicial de organização que pode ser aprofundada.",
      repertoryMetrics.total > 0 ? "O texto traz sinais de repertório, o que ajuda a enriquecer a argumentação." : "O texto já tem base para crescer com repertório mais explícito.",
    ],
    mainProblems: [
      `${weakestCompetency.name} ficou com a menor nota nesta estimativa.`,
      connectiveMetrics.unique < 3 ? "A coesão ainda depende de poucos conectivos e transições." : "A transição entre os argumentos ainda pode ficar mais refinada.",
      interventionComponentCount < 4 ? "A proposta de intervenção ainda está incompleta ou pouco detalhada." : "A proposta final existe, mas ainda pode ganhar mais precisão prática.",
    ],
    nextSteps: [
      weakestCompetency.improvement,
      "Revise a introdução para deixar a tese e o recorte do tema mais explícitos.",
      "Na próxima versão, mantenha quatro parágrafos bem definidos: introdução, dois desenvolvimentos e conclusão.",
    ],
    interventionFeedback:
      interventionComponentCount >= 4
        ? "A proposta de intervenção já aparece de forma perceptível, mas ainda pode ganhar mais detalhamento para subir a nota."
        : "A proposta de intervenção precisa ficar mais completa, com agente, ação, meio, finalidade e detalhamento mais claros.",
    highlightedExcerpts,
    analysisIndicators,
  });
}

function evaluateEssayWithPythonEngine(submission, sourceError) {
  if (!existsSync(pythonEssayEngineEntry)) {
    throw createError(500, "Motor Python de redação não encontrado.");
  }

  const payload = JSON.stringify({
    submission: {
      themeTitle: submission?.themeTitle || "",
      themePrompt: submission?.themePrompt || "",
      essayText: submission?.essayText || "",
      wordCount: submission?.wordCount || 0,
    },
    sourceErrorMessage: String(sourceError?.message || ""),
    sourceStatusCode: Number(sourceError?.statusCode) || 0,
  });

  const result = spawnSync(
    ESSAY_PYTHON_COMMAND,
    [pythonEssayEngineEntry],
    {
      cwd: projectRoot,
      input: payload,
      encoding: "utf8",
      timeout: 12_000,
      maxBuffer: 1024 * 1024,
    }
  );

  if (result.error) {
    throw createError(500, `Motor Python indisponível: ${result.error.message}`);
  }

  if (result.status !== 0) {
    const message = String(result.stderr || result.stdout || "").trim() || "Motor Python não respondeu corretamente.";
    throw createError(500, message);
  }

  let parsedEvaluation;

  try {
    parsedEvaluation = JSON.parse(String(result.stdout || "").trim());
  } catch {
    throw createError(500, "O motor Python retornou uma resposta inválida.");
  }

  return normalizeEssayEvaluation(parsedEvaluation);
}

function evaluateEssayLocally(submission, sourceError) {
  if (ESSAY_LOCAL_ENGINE === "python") {
    try {
      return evaluateEssayWithPythonEngine(submission, sourceError);
    } catch (pythonError) {
      return buildLocalEssayEvaluation(submission, sourceError || pythonError);
    }
  }

  return buildLocalEssayEvaluation(submission, sourceError);
}

function sanitizeEssaySubmissionRow(row, options = {}) {
  if (!row) {
    return null;
  }

  const includeText = options.includeText === true;
  const includeEvaluation = options.includeEvaluation === true;
  const feedback = parseEssayEvaluation(row.evaluationJson);
  const scores = {
    competency1: clampInteger(row.competency1Score, 0, 200),
    competency2: clampInteger(row.competency2Score, 0, 200),
    competency3: clampInteger(row.competency3Score, 0, 200),
    competency4: clampInteger(row.competency4Score, 0, 200),
    competency5: clampInteger(row.competency5Score, 0, 200),
    total: clampInteger(row.totalScore, 0, 1000),
  };

  return {
    id: row.id,
    themeMode: sanitizeEssayThemeMode(row.themeMode),
    themeKey: String(row.themeKey || ""),
    themeTitle: String(row.themeTitle || ""),
    themePrompt: String(row.themePrompt || ""),
    wordCount: Number(row.wordCount) || countWords(row.essayText),
    status: ESSAY_STATUS_VALUES.has(row.status) ? row.status : "pending",
    scores,
    totalScore: scores.total,
    errorMessage: sanitizeEssayFeedbackText(row.errorMessage, 240),
    excerpt: sanitizeEssayFeedbackText(String(row.essayText || "").replace(/\s+/g, " "), 180),
    createdAt: row.createdAt,
    updatedAt: row.updatedAt || row.createdAt,
    evaluatedAt: String(row.evaluatedAt || ""),
    essayText: includeText ? String(row.essayText || "") : undefined,
    feedback: includeEvaluation ? feedback : undefined,
  };
}

function extractResponseOutputText(response) {
  if (typeof response?.output_text === "string" && response.output_text.trim()) {
    return response.output_text.trim();
  }

  const outputItems = Array.isArray(response?.output) ? response.output : [];

  for (const item of outputItems) {
    const content = Array.isArray(item?.content) ? item.content : [];

    for (const fragment of content) {
      if (fragment?.type === "output_text" && typeof fragment.text === "string" && fragment.text.trim()) {
        return fragment.text.trim();
      }
    }
  }

  return "";
}

async function getOpenAIClient() {
  const apiKey = String(process.env.OPENAI_API_KEY || "").trim();
  const model = String(process.env.OPENAI_MODEL || "").trim();

  if (!apiKey) {
    throw createError(503, "Configure OPENAI_API_KEY para usar a corre\u00e7\u00e3o por IA.");
  }

  if (!model) {
    throw createError(503, "Configure OPENAI_MODEL para usar a corre\u00e7\u00e3o por IA.");
  }

  if (!openAIClientPromise) {
    openAIClientPromise = import("openai")
      .then(({ default: OpenAI }) => new OpenAI({ apiKey }))
      .catch(() => {
        throw createError(500, "N\u00e3o foi poss\u00edvel carregar a SDK da OpenAI.");
      });
  }

  return {
    client: await openAIClientPromise,
    model,
  };
}

async function evaluateEssayWithAI(submission) {
  const { client, model } = await getOpenAIClient();
  const response = await client.responses.create({
    model,
    instructions: [
      "Voc\u00ea \u00e9 um corretor de reda\u00e7\u00e3o em estilo ENEM.",
      "Avalie em portugu\u00eas e responda apenas no formato JSON solicitado.",
      "Use cinco compet\u00eancias no padr\u00e3o ENEM, cada uma de 0 a 200 pontos.",
      "Considere repert\u00f3rio, coes\u00e3o, argumenta\u00e7\u00e3o, dom\u00ednio da norma padr\u00e3o e proposta de interven\u00e7\u00e3o.",
      "Se o texto estiver fraco ou curto, ainda assim avalie com honestidade e explique por qu\u00ea.",
    ].join(" "),
    input: [
      `Tema: ${submission.themeTitle}`,
      `Recorte: ${submission.themePrompt}`,
      `Quantidade de palavras: ${submission.wordCount}`,
      "Texto do estudante:",
      submission.essayText,
    ].join("\n\n"),
    text: {
      format: {
        type: "json_schema",
        name: "enem_essay_evaluation",
        strict: true,
        description: "Corre\u00e7\u00e3o estruturada de reda\u00e7\u00e3o em estilo ENEM.",
        schema: ESSAY_EVALUATION_SCHEMA,
      },
    },
  });

  const outputText = extractResponseOutputText(response);

  if (!outputText) {
    throw new Error("A IA n\u00e3o retornou um conte\u00fado v\u00e1lido para a avalia\u00e7\u00e3o.");
  }

  let parsedEvaluation;

  try {
    parsedEvaluation = JSON.parse(outputText);
  } catch {
    throw new Error("A resposta da IA n\u00e3o veio em JSON v\u00e1lido.");
  }

  return normalizeEssayEvaluation(parsedEvaluation);
}

function listUserEssaySubmissions(userId) {
  return listUserEssaySubmissionsStatement
    .all(userId)
    .map((row) => sanitizeEssaySubmissionRow(row));
}

function getUserEssaySubmission(userId, submissionId, options = {}) {
  return sanitizeEssaySubmissionRow(
    getUserEssaySubmissionStatement.get(submissionId, userId),
    {
      includeText: options.includeText !== false,
      includeEvaluation: options.includeEvaluation !== false,
    }
  );
}

function createPendingEssaySubmission(userId, payload) {
  const submission = normalizeEssayPayload(payload);
  const result = insertEssaySubmissionStatement.run(
    userId,
    submission.themeMode,
    submission.themeKey,
    submission.themeTitle,
    submission.themePrompt,
    submission.essayText,
    submission.wordCount,
    submission.status,
    submission.createdAt,
    submission.updatedAt
  );

  return getEssaySubmissionByIdStatement.get(result.lastInsertRowid);
}

function markEssaySubmissionEvaluated(userId, submissionId, evaluation) {
  const evaluatedAt = nowIso();
  updateEssaySubmissionSuccessStatement.run(
    evaluation.competencies[0].score,
    evaluation.competencies[1].score,
    evaluation.competencies[2].score,
    evaluation.competencies[3].score,
    evaluation.competencies[4].score,
    evaluation.totalScore,
    JSON.stringify(evaluation),
    evaluatedAt,
    evaluatedAt,
    submissionId,
    userId
  );

  return getUserEssaySubmission(userId, submissionId, {
    includeText: true,
    includeEvaluation: true,
  });
}

function markEssaySubmissionFailed(userId, submissionId, errorMessage) {
  updateEssaySubmissionFailureStatement.run(
    sanitizeEssayFeedbackText(errorMessage, 240) || "N\u00e3o foi poss\u00edvel corrigir a reda\u00e7\u00e3o com IA.",
    nowIso(),
    submissionId,
    userId
  );

  return getUserEssaySubmission(userId, submissionId, {
    includeText: true,
    includeEvaluation: true,
  });
}

function withTransaction(callback) {
  db.exec("BEGIN");

  try {
    const result = callback();
    db.exec("COMMIT");
    return result;
  } catch (error) {
    db.exec("ROLLBACK");
    throw error;
  }
}

function buildSessionRelationQuery(tableName, projection, sessionIds) {
  if (!sessionIds.length) {
    return [];
  }

  const placeholders = sessionIds.map(() => "?").join(", ");
  const statement = db.prepare(`
    SELECT ${projection}
    FROM ${tableName}
    WHERE session_id IN (${placeholders})
    ORDER BY id ASC
  `);

  return statement.all(...sessionIds);
}

function hydrateSessionRows(rows) {
  if (!rows.length) {
    return [];
  }

  const sessionIds = rows.map((row) => row.id);
  const activityRows = buildSessionRelationQuery(
    "session_activities",
    "session_id AS sessionId, activity_key AS activityKey, other_label AS otherLabel",
    sessionIds
  );
  const verbRows = buildSessionRelationQuery(
    "session_verbs",
    "session_id AS sessionId, verb",
    sessionIds
  );
  const phraseRows = buildSessionRelationQuery(
    "session_phrases",
    "session_id AS sessionId, phrase",
    sessionIds
  );

  const sessionMap = new Map(
    rows.map((row) => [
      row.id,
      (() => {
        const parsedActivities = parseStoredJson(row.activitiesJson, []);
        const baseActivities = (Array.isArray(parsedActivities) ? parsedActivities : [])
          .map((activity) => String(activity || "").trim().toLowerCase())
          .filter((activity, index, list) => ALLOWED_ACTIVITIES.has(activity) && list.indexOf(activity) === index);
        const subjectKey = sanitizeSubjectKey(row.subjectKey, DEFAULT_SUBJECT_KEY);
        const customSubjectName = subjectKey === "outras" ? sanitizeSubjectName(row.customSubjectName) : "";
        const verbs = parseStructuredItems(row.verbsText);
        const phrases = parseStructuredItems(row.phrasesText);

        return {
        id: row.id,
        userId: row.userId,
        state: row.state,
        minutes: Number(row.minutes) || 0,
        type: row.type,
        subjectKey,
        customSubjectName,
        subjectLabel: getSubjectLabel(subjectKey, customSubjectName),
        topicText: deriveLegacyTopicText(
          subjectKey,
          baseActivities,
          "",
          verbs,
          phrases,
          row.topicText
        ),
        notes: String(row.notesText || ""),
        activities: baseActivities,
        otherLabel: "",
        verbs,
        phrases,
        dateKey: row.dateKey,
        date: row.dateKey,
        startedAt: row.startedAt,
        endedAt: row.endedAt,
        createdAt: row.createdAt,
        updatedAt: row.updatedAt || row.createdAt,
        };
      })(),
    ])
  );

  activityRows.forEach((row) => {
    const session = sessionMap.get(row.sessionId);

    if (!session) {
      return;
    }

    if (!session.activities.includes(row.activityKey)) {
      session.activities.push(row.activityKey);
    }

    if (row.activityKey === "outros" && row.otherLabel) {
      session.otherLabel = row.otherLabel;
    }
  });

  verbRows.forEach((row) => {
    const session = sessionMap.get(row.sessionId);

    if (session) {
      if (!session.verbs.includes(row.verb)) {
        session.verbs.push(row.verb);
      }
    }
  });

  phraseRows.forEach((row) => {
    const session = sessionMap.get(row.sessionId);

    if (session) {
      if (!session.phrases.includes(row.phrase)) {
        session.phrases.push(row.phrase);
      }
    }
  });

  return rows.map((row) => {
    const session = sessionMap.get(row.id);
    const topicText = deriveLegacyTopicText(
      session.subjectKey,
      session.activities,
      session.otherLabel,
      session.verbs,
      session.phrases,
      session.topicText
    );
    const isEnglishSubject = session.subjectKey === DEFAULT_SUBJECT_KEY;

    return {
      ...session,
      topicText,
      subjectLabel: getSubjectLabel(session.subjectKey, session.customSubjectName),
      verbsText: session.verbs.join(", "),
      phrasesText: session.phrases.join("\n"),
      englishDetails: {
        verbs: isEnglishSubject ? [...session.verbs] : [],
        phrases: isEnglishSubject ? [...session.phrases] : [],
      },
    };
  });
}

function writeSessionRelations(sessionId, session) {
  const timestamp = session.updatedAt;

  session.activities.forEach((activity) => {
    const otherLabel = activity === "outros" ? session.otherLabel : "";
    insertSessionActivityStatement.run(sessionId, activity, otherLabel, timestamp);
  });

  session.verbs.forEach((verb) => {
    insertSessionVerbStatement.run(sessionId, verb, timestamp);
  });

  session.phrases.forEach((phrase) => {
    insertSessionPhraseStatement.run(sessionId, phrase, timestamp);
  });
}

function replaceSessionRelations(sessionId, session) {
  deleteSessionActivitiesStatement.run(sessionId);
  deleteSessionVerbsStatement.run(sessionId);
  deleteSessionPhrasesStatement.run(sessionId);
  writeSessionRelations(sessionId, session);
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

function validateRuntimeConfiguration() {
  if (!IS_PRODUCTION) {
    return;
  }

  if (DEFAULT_ADMIN.password === DEFAULT_ADMIN_PASSWORD) {
    throw new Error("Configure START5_ADMIN_PASSWORD com uma senha forte antes de publicar o site.");
  }

  if (!PUBLIC_ORIGIN) {
    console.warn("[start5] START5_PUBLIC_ORIGIN n\u00e3o foi definido. Defina a origem p\u00fablica do site em produ\u00e7\u00e3o.");
  }
}

function ensureAdminUser() {
  const existingUser = findUserByEmailStatement.get(DEFAULT_ADMIN.email);

  if (existingUser) {
    if (existingUser.role !== "admin") {
      db.prepare("UPDATE users SET role = 'admin' WHERE id = ?").run(existingUser.id);
    }
    return;
  }

  const adminNameParts = splitStoredName(DEFAULT_ADMIN.name);

  insertUserStatement.run(
    buildFullName(adminNameParts.firstName, adminNameParts.lastName, DEFAULT_ADMIN.name),
    adminNameParts.firstName,
    adminNameParts.lastName,
    DEFAULT_ADMIN.email,
    hashPassword(DEFAULT_ADMIN.password),
    "admin",
    nowIso()
  );

  console.log("[start5] Conta admin criada.");
  console.log(`[start5] Admin e-mail: ${DEFAULT_ADMIN.email}`);

  if (!IS_PRODUCTION) {
    console.log("[start5] Defina uma senha forte para o admin antes de publicar o site.");
  }
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

  const nameParts = splitStoredName(row.name, row.firstName, row.lastName);
  const focusSubjectKey = sanitizeSubjectKey(row.focusSubjectKey, DEFAULT_SUBJECT_KEY);
  const focusSubjectName = focusSubjectKey === "outras" ? sanitizeSubjectName(row.focusSubjectName) : "";

  return {
    id: row.id,
    name: buildFullName(nameParts.firstName, nameParts.lastName, row.name),
    firstName: nameParts.firstName,
    lastName: nameParts.lastName,
    avatarDataUrl: String(row.avatarDataUrl || ""),
    focusSubjectKey,
    focusSubjectName,
    focusSubjectLabel: getSubjectLabel(focusSubjectKey, focusSubjectName),
    role: row.role,
    createdAt: row.createdAt,
    totalSessions: Number(row.totalSessions) || 0,
    totalMinutes: Number(row.totalMinutes) || 0,
    lastSessionAt: row.lastSessionAt,
    maskedEmail: maskEmail(row.email),
  };
}

function sanitizeAdminUserDetails(row) {
  if (!row) return null;

  const nameParts = splitStoredName(row.name, row.firstName, row.lastName);
  const focusSubjectKey = sanitizeSubjectKey(row.focusSubjectKey, DEFAULT_SUBJECT_KEY);
  const focusSubjectName = focusSubjectKey === "outras" ? sanitizeSubjectName(row.focusSubjectName) : "";

  return {
    id: row.id,
    name: buildFullName(nameParts.firstName, nameParts.lastName, row.name),
    firstName: nameParts.firstName,
    lastName: nameParts.lastName,
    avatarDataUrl: String(row.avatarDataUrl || ""),
    focusSubjectKey,
    focusSubjectName,
    focusSubjectLabel: getSubjectLabel(focusSubjectKey, focusSubjectName),
    email: row.email,
    role: row.role,
    createdAt: row.createdAt,
  };
}

function isValidDateString(value) {
  return /^\d{4}-\d{2}-\d{2}$/.test(String(value || ""));
}

function isValidRole(value) {
  return value === "user" || value === "admin";
}

function normalizeSessionPayload(payload) {
  const minutes = Number(payload.minutes);
  const state = String(payload.state || "").trim().toLowerCase();
  const type = String(payload.type || (minutes > 20 ? "extra" : "padrao")).trim();
  const startedAt = payload.startedAt ? new Date(payload.startedAt) : new Date();
  const activities = (Array.isArray(payload.activities) ? payload.activities : [])
    .map((activity) => String(activity || "").trim().toLowerCase())
    .filter((activity, index, list) => activity && list.indexOf(activity) === index);
  const verbsText = String(payload.verbsText || "").trim();
  const phrasesText = String(payload.phrasesText || "").trim();
  const notes = String(payload.notes || "").trim();

  if (!Number.isFinite(minutes) || minutes <= 0) {
    throw createError(400, "Minutos inválidos.");
  }

  if (!ALLOWED_STATES.has(state)) {
    throw createError(400, "Estado inválido.");
  }

  if (activities.some((activity) => !ALLOWED_ACTIVITIES.has(activity))) {
    throw createError(400, "Atividade inv\u00e1lida.");
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
    activitiesJson: JSON.stringify(activities),
    verbsText,
    phrasesText,
    notes,
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
    session.activitiesJson,
    session.verbsText,
    session.phrasesText,
    session.notes,
    session.dateKey,
    session.startedAt,
    session.endedAt,
    session.createdAt
  );

  return sanitizeSessionRow(listUserSessionsStatement.get(userId));
}

function listUserSessions(userId) {
  return listUserSessionsStatement.all(userId).map((row) => sanitizeSessionRow(row));
}

function normalizeStructuredSessionPayload(payload, options = {}) {
  const minutes = Number(payload.minutes);
  const state = String(payload.state || "").trim().toLowerCase();
  const startedAtSource = payload.startedAt || options.startedAt || new Date().toISOString();
  const startedAt = new Date(startedAtSource);
  const activitiesSource = Array.isArray(payload.activities)
    ? payload.activities
    : parseStructuredItems(payload.activities || []);
  const activities = activitiesSource
    .map((activity) => String(activity || "").trim().toLowerCase())
    .filter((activity, index, list) => activity && list.indexOf(activity) === index);
  const subjectKey = sanitizeSubjectKey(payload.subjectKey || options.subjectKey, DEFAULT_SUBJECT_KEY);
  const customSubjectName = subjectKey === "outras"
    ? sanitizeSubjectName(payload.customSubjectName ?? payload.subjectName ?? "")
    : "";
  const englishDetails = payload.englishDetails && typeof payload.englishDetails === "object"
    ? payload.englishDetails
    : {};
  const verbs = parseStructuredItems(
    payload.verbs ?? payload.verbsText ?? englishDetails.verbs ?? englishDetails.verbsText
  );
  const phrases = parseStructuredItems(
    payload.phrases ?? payload.phrasesText ?? englishDetails.phrases ?? englishDetails.phrasesText
  );
  const notes = String(payload.notes ?? payload.notesText ?? "").trim();
  const otherLabel = sanitizeShortText(payload.otherLabel, 80);
  const topicText = sanitizeTopicText(
    payload.topicText ?? payload.topic ?? payload.topicLabel ?? payload.whatStudied
  );
  const allowLooseMigration = options.allowLooseMigration === true;

  if (!Number.isFinite(minutes) || minutes <= 0) {
    throw createError(400, "Minutos inv\u00e1lidos.");
  }

  if (!ALLOWED_STATES.has(state)) {
    throw createError(400, "Estado inv\u00e1lido.");
  }

  if (activities.some((activity) => !ALLOWED_ACTIVITIES.has(activity))) {
    throw createError(400, "Atividade inv\u00e1lida.");
  }

  if (subjectKey === "outras" && !customSubjectName) {
    throw createError(400, "Informe qual mat\u00e9ria voc\u00ea estudou.");
  }

  if (Number.isNaN(startedAt.getTime())) {
    throw createError(400, "Data de in\u00edcio inv\u00e1lida.");
  }

  const safeActivities = activities;
  const safeOtherLabel = safeActivities.includes("outros")
    ? otherLabel || (allowLooseMigration ? "Pr\u00e1tica livre" : "")
    : "";

  if (safeActivities.includes("outros") && !safeOtherLabel) {
    throw createError(400, "Descreva a atividade em Outros.");
  }

  if (safeActivities.includes("verbos") && !verbs.length && !allowLooseMigration) {
    throw createError(400, "Informe quais verbos voc\u00ea estudou.");
  }

  const safeTopicText = topicText || (allowLooseMigration
    ? deriveLegacyTopicText(
        subjectKey,
        safeActivities,
        safeOtherLabel,
        verbs,
        phrases,
        topicText
      )
    : "");

  if (!safeTopicText && !allowLooseMigration) {
    throw createError(400, "Descreva o que voc\u00ea estudou hoje.");
  }

  const isEnglishSubject = subjectKey === DEFAULT_SUBJECT_KEY;
  const safeVerbs = isEnglishSubject ? verbs : [];
  const safePhrases = isEnglishSubject ? phrases : [];
  const endedAt = new Date(startedAt.getTime() + minutes * 60000);
  const dateKey = isValidDateString(payload.dateKey || payload.date)
    ? String(payload.dateKey || payload.date)
    : startedAt.toISOString().slice(0, 10);
  const createdAtSource = payload.createdAt || options.createdAt || nowIso();
  const updatedAt = nowIso();

  return {
    state,
    minutes,
    type: String(payload.type || (minutes > 20 ? "extra" : "padrao")).trim() || "padrao",
    notes,
    subjectKey,
    customSubjectName,
    subjectLabel: getSubjectLabel(subjectKey, customSubjectName),
    topicText: safeTopicText,
    activities: safeActivities,
    otherLabel: safeOtherLabel,
    verbs: safeVerbs,
    phrases: safePhrases,
    activitiesJson: JSON.stringify(safeActivities),
    verbsText: safeVerbs.join(", "),
    phrasesText: safePhrases.join("\n"),
    dateKey,
    startedAt: startedAt.toISOString(),
    endedAt: endedAt.toISOString(),
    createdAt: new Date(createdAtSource).toISOString(),
    updatedAt,
    englishDetails: {
      verbs: [...safeVerbs],
      phrases: [...safePhrases],
    },
  };
}

function getStructuredSessionRowsByIds(sessionIds) {
  if (!sessionIds.length) {
    return [];
  }

  return hydrateSessionRows(
    sessionIds
      .map((sessionId) => db.prepare(`
        SELECT
          id,
          user_id AS userId,
          state,
          minutes,
          type,
          activities_json AS activitiesJson,
          subject_key AS subjectKey,
          custom_subject_name AS customSubjectName,
          topic_text AS topicText,
          verbs_text AS verbsText,
          phrases_text AS phrasesText,
          notes_text AS notesText,
          date_key AS dateKey,
          started_at AS startedAt,
          ended_at AS endedAt,
          created_at AS createdAt,
          updated_at AS updatedAt
        FROM start_sessions
        WHERE id = ?
      `).get(sessionId))
      .filter(Boolean)
  );
}

function getStructuredUserSession(userId, sessionId) {
  return hydrateSessionRows([getUserSessionStatement.get(sessionId, userId)].filter(Boolean))[0] || null;
}

function listStructuredUserSessions(userId) {
  return hydrateSessionRows(listUserSessionsStatement.all(userId));
}

function insertStructuredSession(userId, payload) {
  const session = normalizeStructuredSessionPayload(payload);

  return withTransaction(() => {
    const result = insertStartSessionStatement.run(
      userId,
      session.state,
      session.minutes,
      session.type,
      session.activitiesJson,
      session.subjectKey,
      session.customSubjectName,
      session.topicText,
      session.verbsText,
      session.phrasesText,
      session.notes,
      session.dateKey,
      session.startedAt,
      session.endedAt,
      session.createdAt,
      session.updatedAt
    );

    writeSessionRelations(result.lastInsertRowid, session);
    return getStructuredUserSession(userId, Number(result.lastInsertRowid));
  });
}

function updateStructuredSession(userId, sessionId, payload) {
  const currentSession = getStructuredUserSession(userId, sessionId);

  if (!currentSession) {
    throw createError(404, "Sess\u00e3o n\u00e3o encontrada.");
  }

  const session = normalizeStructuredSessionPayload(
    {
      ...currentSession,
      ...payload,
      dateKey: currentSession.dateKey,
      startedAt: currentSession.startedAt,
      createdAt: currentSession.createdAt,
    },
    {
      startedAt: currentSession.startedAt,
      createdAt: currentSession.createdAt,
    }
  );

  return withTransaction(() => {
    const result = updateStartSessionStatement.run(
      session.state,
      session.minutes,
      session.type,
      session.activitiesJson,
      session.subjectKey,
      session.customSubjectName,
      session.topicText,
      session.verbsText,
      session.phrasesText,
      session.notes,
      session.dateKey,
      session.endedAt,
      session.updatedAt,
      sessionId,
      userId
    );

    if (!result.changes) {
      throw createError(404, "Sess\u00e3o n\u00e3o encontrada.");
    }

    replaceSessionRelations(sessionId, session);
    return getStructuredUserSession(userId, sessionId);
  });
}

function deleteStructuredSession(userId, sessionId) {
  const result = deleteStartSessionStatement.run(sessionId, userId);

  if (!result.changes) {
    throw createError(404, "Sess\u00e3o n\u00e3o encontrada.");
  }
}

function isSameMonth(date, reference) {
  return (
    date.getFullYear() === reference.getFullYear() &&
    date.getMonth() === reference.getMonth()
  );
}

function roundMetric(value) {
  return Math.round((Number(value) || 0) * 10) / 10;
}

function getAdminEssayMetrics() {
  const rows = listEssayMetricRowsStatement.all();
  const now = new Date();
  const weekStart = new Date(now);
  weekStart.setDate(weekStart.getDate() - 6);
  weekStart.setHours(0, 0, 0, 0);

  const evaluatedRows = rows.filter((row) => row.status === "evaluated");
  const correctedThisWeek = evaluatedRows.filter((row) => {
    const evaluatedAt = new Date(row.evaluatedAt || row.createdAt || "");
    return !Number.isNaN(evaluatedAt.getTime()) && evaluatedAt >= weekStart;
  });
  const correctedThisMonth = evaluatedRows.filter((row) => {
    const evaluatedAt = new Date(row.evaluatedAt || row.createdAt || "");
    return !Number.isNaN(evaluatedAt.getTime()) && isSameMonth(evaluatedAt, now);
  });
  const topThemeMap = new Map();

  rows.forEach((row) => {
    if (row.themeMode !== "preset" || !row.themeKey) {
      return;
    }

    const current = topThemeMap.get(row.themeKey) || {
      themeKey: row.themeKey,
      themeTitle: row.themeTitle,
      total: 0,
    };
    current.total += 1;
    topThemeMap.set(row.themeKey, current);
  });

  const topThemes = [...topThemeMap.values()]
    .sort((left, right) => right.total - left.total || left.themeTitle.localeCompare(right.themeTitle))
    .slice(0, 5);

  const totals = evaluatedRows.reduce(
    (accumulator, row) => {
      accumulator.totalScore += Number(row.totalScore) || 0;
      accumulator.competency1 += Number(row.competency1Score) || 0;
      accumulator.competency2 += Number(row.competency2Score) || 0;
      accumulator.competency3 += Number(row.competency3Score) || 0;
      accumulator.competency4 += Number(row.competency4Score) || 0;
      accumulator.competency5 += Number(row.competency5Score) || 0;
      return accumulator;
    },
    {
      totalScore: 0,
      competency1: 0,
      competency2: 0,
      competency3: 0,
      competency4: 0,
      competency5: 0,
    }
  );

  const divisor = evaluatedRows.length || 1;

  return {
    totalEssays: rows.length,
    correctedThisWeek: correctedThisWeek.length,
    correctedThisMonth: correctedThisMonth.length,
    usersWithEssays: new Set(rows.map((row) => row.userId)).size,
    averageTotalScore: evaluatedRows.length ? roundMetric(totals.totalScore / divisor) : 0,
    averageByCompetency: {
      competency1: evaluatedRows.length ? roundMetric(totals.competency1 / divisor) : 0,
      competency2: evaluatedRows.length ? roundMetric(totals.competency2 / divisor) : 0,
      competency3: evaluatedRows.length ? roundMetric(totals.competency3 / divisor) : 0,
      competency4: evaluatedRows.length ? roundMetric(totals.competency4 / divisor) : 0,
      competency5: evaluatedRows.length ? roundMetric(totals.competency5 / divisor) : 0,
    },
    statusBreakdown: {
      pending: rows.filter((row) => row.status === "pending").length,
      evaluated: evaluatedRows.length,
      failed: rows.filter((row) => row.status === "failed").length,
    },
    topThemes,
  };
}

function migrateLegacySessionsToStructured() {
  if (selectMetaStatement.get(STRUCTURED_SESSION_MIGRATION_KEY)?.value) {
    return;
  }

  const legacyRows = listAllSessionsForMigrationStatement.all();

  withTransaction(() => {
    legacyRows.forEach((row) => {
      const parsedActivities = parseStoredJson(row.activitiesJson, []);
      const session = normalizeStructuredSessionPayload(
        {
          state: row.state,
          minutes: row.minutes,
          type: row.type,
          subjectKey: row.subjectKey,
          customSubjectName: row.customSubjectName,
          topicText: row.topicText,
          activities: Array.isArray(parsedActivities) ? parsedActivities : [],
          verbsText: row.verbsText,
          phrasesText: row.phrasesText,
          notes: row.notesText,
          otherLabel: Array.isArray(parsedActivities) && parsedActivities.includes("outros")
            ? "Pr\u00e1tica livre"
            : "",
          dateKey: row.dateKey,
          startedAt: row.startedAt,
          createdAt: row.createdAt,
        },
        {
          startedAt: row.startedAt,
          createdAt: row.createdAt,
          allowLooseMigration: true,
        }
      );

      db.prepare(`
        UPDATE start_sessions
        SET
          activities_json = ?,
          subject_key = ?,
          custom_subject_name = ?,
          topic_text = ?,
          verbs_text = ?,
          phrases_text = ?,
          notes_text = ?,
          updated_at = ?
        WHERE id = ?
      `).run(
        session.activitiesJson,
        session.subjectKey,
        session.customSubjectName,
        session.topicText,
        session.verbsText,
        session.phrasesText,
        session.notes,
        row.updatedAt || row.createdAt || session.updatedAt,
        row.id
      );

      replaceSessionRelations(row.id, {
        ...session,
        updatedAt: row.updatedAt || row.createdAt || session.updatedAt,
      });
    });

    upsertMetaStatement.run(STRUCTURED_SESSION_MIGRATION_KEY, nowIso());
  });
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
  const requestedFile = pathname === "/" ? "login.html" : pathname.replace(/^\/+/, "");
  const filePath = resolve(publicDir, requestedFile);
  const relativePath = relative(publicDir, filePath);

  if (!relativePath || relativePath.startsWith("..")) {
    throw createError(404, "Arquivo não encontrado.");
  }

  try {
    const file = await readFile(filePath);
    const headers = {
      "Content-Type": getContentType(filePath),
    };

    if (extname(filePath).toLowerCase() === ".html") {
      headers["Cache-Control"] = "no-store";
    }

    response.writeHead(200, headers);
    response.end(file);
  } catch {
    throw createError(404, "Arquivo não encontrado.");
  }
}

async function handleRegister(request, response) {
  const payload = await readRequestBody(request);
  const fallbackNameParts = splitStoredName(payload.name);
  const firstName = normalizePersonNamePart(payload.firstName || fallbackNameParts.firstName);
  const lastName = normalizePersonNamePart(payload.lastName || fallbackNameParts.lastName);
  const name = buildFullName(firstName, lastName, payload.name);
  const email = normalizeEmail(payload.email);
  const password = String(payload.password || "").trim();

  if (firstName.length < 2) throw createError(400, "Informe um nome com pelo menos 2 caracteres.");
  if (lastName.length < 2) throw createError(400, "Informe um sobrenome com pelo menos 2 caracteres.");
  if (!email.includes("@")) throw createError(400, "Informe um e-mail válido.");
  if (password.length < 6) throw createError(400, "A senha precisa ter pelo menos 6 caracteres.");

  const existingUser = findUserByEmailStatement.get(email);

  if (existingUser) {
    throw createError(409, "Esse e-mail já está cadastrado.");
  }

  const result = insertUserStatement.run(
    name,
    firstName,
    lastName,
    email,
    hashPassword(password),
    "user",
    nowIso()
  );

  const user = findUserByIdStatement.get(result.lastInsertRowid);
  const session = createAuthSession(user.id);
  setSessionCookie(request, response, session.token, session.expiresAt);
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
  setSessionCookie(request, response, session.token, session.expiresAt);
  sendJson(response, 200, { user: sanitizeUser(user) });
}

function handleLogout(request, response) {
  const cookies = parseCookies(request.headers.cookie);
  const sessionToken = cookies[SESSION_COOKIE];

  if (sessionToken) {
    deleteAuthSessionStatement.run(hashToken(sessionToken));
  }

  clearSessionCookie(request, response);
  sendJson(response, 200, { success: true });
}

function handleCurrentUser(request, response) {
  const user = getAuthenticatedUser(request);

  if (!user) {
    throw createError(401, "Sessão não encontrada.");
  }

  sendJson(response, 200, { user });
}

function handleProfile(request, response) {
  const user = getAuthenticatedUser(request);

  if (!user) {
    throw createError(401, "Sess\u00e3o n\u00e3o encontrada.");
  }

  sendJson(response, 200, { user: sanitizeUser(findUserByIdStatement.get(user.id)) });
}

async function handleUpdateProfile(request, response) {
  const user = getAuthenticatedUser(request);

  if (!user) {
    throw createError(401, "Sess\u00e3o n\u00e3o encontrada.");
  }

  const payload = await readRequestBody(request);
  const currentUser = findUserByIdStatement.get(user.id);

  if (!currentUser) {
    throw createError(404, "Usu\u00e1rio n\u00e3o encontrado.");
  }

  const hasNameUpdate = payload.firstName !== undefined || payload.lastName !== undefined;
  const hasAvatarUpdate = Object.prototype.hasOwnProperty.call(payload, "avatarDataUrl");
  const hasFocusSubjectUpdate =
    payload.focusSubjectKey !== undefined || Object.prototype.hasOwnProperty.call(payload, "focusSubjectName");

  if (!hasNameUpdate && !hasAvatarUpdate && !hasFocusSubjectUpdate) {
    throw createError(400, "Nada para atualizar.");
  }

  const firstName = normalizePersonNamePart(
    payload.firstName === undefined ? currentUser.firstName : payload.firstName
  );
  const lastName = normalizePersonNamePart(
    payload.lastName === undefined ? currentUser.lastName : payload.lastName
  );

  if (firstName.length < 2) {
    throw createError(400, "Informe um nome com pelo menos 2 caracteres.");
  }

  if (lastName.length < 2) {
    throw createError(400, "Informe um sobrenome com pelo menos 2 caracteres.");
  }

  const avatarDataUrl = hasAvatarUpdate
    ? sanitizeAvatarDataUrl(payload.avatarDataUrl)
    : String(currentUser.avatarDataUrl || "");
  const focusSubjectKey = sanitizeSubjectKey(
    payload.focusSubjectKey === undefined ? currentUser.focusSubjectKey : payload.focusSubjectKey,
    DEFAULT_SUBJECT_KEY
  );
  const focusSubjectName = focusSubjectKey === "outras"
    ? sanitizeSubjectName(
        payload.focusSubjectName === undefined ? currentUser.focusSubjectName : payload.focusSubjectName
      )
    : "";

  if (focusSubjectKey === "outras" && !focusSubjectName) {
    throw createError(400, "Informe o nome da sua mat\u00e9ria foco.");
  }

  updateUserProfileStatement.run(
    buildFullName(firstName, lastName, currentUser.name),
    firstName,
    lastName,
    avatarDataUrl,
    focusSubjectKey,
    focusSubjectName,
    user.id
  );

  sendJson(response, 200, {
    user: sanitizeUser(findUserByIdStatement.get(user.id)),
  });
}

function handleListSessions(request, response) {
  const user = getAuthenticatedUser(request);

  if (!user) {
    throw createError(401, "Sessão não encontrada.");
  }

  sendJson(response, 200, { sessions: listStructuredUserSessions(user.id) });
}

async function handleCreateSession(request, response) {
  const user = getAuthenticatedUser(request);

  if (!user) {
    throw createError(401, "Sessão não encontrada.");
  }

  const payload = await readRequestBody(request);
  const session = insertStructuredSession(user.id, payload);

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
      insertStructuredSession(user.id, session);
    } catch {
      // Ignora registros inválidos durante a migração inicial.
    }
  });

  sendJson(response, 200, { sessions: listStructuredUserSessions(user.id) });
}

async function handleUpdateSession(request, response, rawSessionId) {
  const user = getAuthenticatedUser(request);

  if (!user) {
    throw createError(401, "Sess\u00e3o n\u00e3o encontrada.");
  }

  const sessionId = Number(rawSessionId);

  if (!Number.isInteger(sessionId) || sessionId <= 0) {
    throw createError(400, "Sess\u00e3o inv\u00e1lida.");
  }

  const payload = await readRequestBody(request);
  const session = updateStructuredSession(user.id, sessionId, payload);

  sendJson(response, 200, { session });
}

function handleDeleteSession(request, response, rawSessionId) {
  const user = getAuthenticatedUser(request);

  if (!user) {
    throw createError(401, "Sess\u00e3o n\u00e3o encontrada.");
  }

  const sessionId = Number(rawSessionId);

  if (!Number.isInteger(sessionId) || sessionId <= 0) {
    throw createError(400, "Sess\u00e3o inv\u00e1lida.");
  }

  deleteStructuredSession(user.id, sessionId);
  sendJson(response, 200, { success: true });
}

function handleEssayThemes(request, response) {
  const user = getAuthenticatedUser(request);

  if (!user) {
    throw createError(401, "Sess\u00e3o n\u00e3o encontrada.");
  }

  sendJson(response, 200, { themes: getEssayThemes() });
}

function handleListEssaySubmissions(request, response) {
  const user = getAuthenticatedUser(request);

  if (!user) {
    throw createError(401, "Sess\u00e3o n\u00e3o encontrada.");
  }

  sendJson(response, 200, { submissions: listUserEssaySubmissions(user.id) });
}

function handleGetEssaySubmission(request, response, rawSubmissionId) {
  const user = getAuthenticatedUser(request);

  if (!user) {
    throw createError(401, "Sess\u00e3o n\u00e3o encontrada.");
  }

  const submissionId = Number(rawSubmissionId);

  if (!Number.isInteger(submissionId) || submissionId <= 0) {
    throw createError(400, "Reda\u00e7\u00e3o inv\u00e1lida.");
  }

  const submission = getUserEssaySubmission(user.id, submissionId, {
    includeText: true,
    includeEvaluation: true,
  });

  if (!submission) {
    throw createError(404, "Reda\u00e7\u00e3o n\u00e3o encontrada.");
  }

  sendJson(response, 200, { submission });
}

async function handleCreateEssaySubmission(request, response) {
  const user = getAuthenticatedUser(request);

  if (!user) {
    throw createError(401, "Sess\u00e3o n\u00e3o encontrada.");
  }

  const payload = await readRequestBody(request);
  const pendingSubmission = createPendingEssaySubmission(user.id, payload);

  if (ESSAY_EVALUATION_MODE === "local") {
    const evaluation = evaluateEssayLocally(pendingSubmission);
    const submission = markEssaySubmissionEvaluated(user.id, pendingSubmission.id, evaluation);
    sendJson(response, 201, { submission, fallbackMode: "local" });
    return;
  }

  try {
    const evaluation = await evaluateEssayWithAI(pendingSubmission);
    const submission = markEssaySubmissionEvaluated(user.id, pendingSubmission.id, evaluation);
    sendJson(response, 201, { submission });
  } catch (error) {
    if (ESSAY_EVALUATION_MODE === "openai") {
      const submission = markEssaySubmissionFailed(
        user.id,
        pendingSubmission.id,
        error?.message || "N\u00e3o foi poss\u00edvel corrigir a reda\u00e7\u00e3o com IA."
      );
      const statusCode =
        Number.isInteger(error?.statusCode) && error.statusCode >= 400
          ? error.statusCode
          : 502;

      sendJson(response, statusCode, {
        error: submission.errorMessage || "N\u00e3o foi poss\u00edvel corrigir a reda\u00e7\u00e3o com IA.",
        submission,
      });
      return;
    }

    try {
      const fallbackEvaluation = evaluateEssayLocally(pendingSubmission, error);
      const submission = markEssaySubmissionEvaluated(user.id, pendingSubmission.id, fallbackEvaluation);
      sendJson(response, 201, { submission, fallbackMode: "local" });
    } catch (fallbackError) {
      const submission = markEssaySubmissionFailed(
        user.id,
        pendingSubmission.id,
        fallbackError?.message || error?.message || "N\u00e3o foi poss\u00edvel corrigir a reda\u00e7\u00e3o."
      );
      const statusCode =
        Number.isInteger(fallbackError?.statusCode) && fallbackError.statusCode >= 400
          ? fallbackError.statusCode
          : Number.isInteger(error?.statusCode) && error.statusCode >= 400
            ? error.statusCode
            : 502;

      sendJson(response, statusCode, {
        error: submission.errorMessage || "N\u00e3o foi poss\u00edvel corrigir a reda\u00e7\u00e3o.",
        submission,
      });
    }
  }
}

function handleAdminOverview(request, response) {
  const user = getAuthenticatedUser(request);
  ensureAdmin(user);
  sendJson(response, 200, { overview: adminOverviewStatement.get() });
}

function handleAdminEssayMetrics(request, response) {
  const user = getAuthenticatedUser(request);
  ensureAdmin(user);
  sendJson(response, 200, { metrics: getAdminEssayMetrics() });
}

function handleAdminUsers(request, response) {
  const user = getAuthenticatedUser(request);
  ensureAdmin(user);
  sendJson(response, 200, { users: adminUsersStatement.all().map((row) => sanitizeAdminUser(row)) });
}

function handleGrantAdmin(request, response, rawUserId) {
  const user = getAuthenticatedUser(request);
  ensureAdmin(user);

  const userId = Number(rawUserId);

  if (!Number.isInteger(userId) || userId <= 0) {
    throw createError(400, "Usuário inválido.");
  }

  const targetUser = findUserByIdStatement.get(userId);

  if (!targetUser) {
    throw createError(404, "Usuário não encontrado.");
  }

  if (targetUser.role !== "admin") {
    updateUserRoleStatement.run("admin", userId);
  }

  sendJson(response, 200, {
    user: sanitizeAdminUser(adminUserByIdStatement.get(userId)),
  });
}

function handleAdminUserDetails(request, response, rawUserId) {
  const user = getAuthenticatedUser(request);
  ensureAdmin(user);

  const userId = Number(rawUserId);

  if (!Number.isInteger(userId) || userId <= 0) {
    throw createError(400, "Usu\u00e1rio inv\u00e1lido.");
  }

  const targetUser = findUserByIdStatement.get(userId);

  if (!targetUser) {
    throw createError(404, "Usu\u00e1rio n\u00e3o encontrado.");
  }

  sendJson(response, 200, { user: sanitizeAdminUserDetails(targetUser) });
}

async function handleUpdateAdminUser(request, response, rawUserId) {
  const user = getAuthenticatedUser(request);
  ensureAdmin(user);

  const userId = Number(rawUserId);

  if (!Number.isInteger(userId) || userId <= 0) {
    throw createError(400, "Usu\u00e1rio inv\u00e1lido.");
  }

  const targetUser = findUserByIdStatement.get(userId);

  if (!targetUser) {
    throw createError(404, "Usu\u00e1rio n\u00e3o encontrado.");
  }

  const payload = await readRequestBody(request);
  const nextEmail = payload.email === undefined ? null : normalizeEmail(payload.email);
  const nextPassword = payload.password === undefined ? null : String(payload.password || "").trim();

  if (nextEmail === null && nextPassword === null) {
    throw createError(400, "Nada para atualizar.");
  }

  if (nextEmail !== null) {
    if (!nextEmail.includes("@")) {
      throw createError(400, "Informe um e-mail v\u00e1lido.");
    }

    const existingUser = findUserByEmailStatement.get(nextEmail);

    if (existingUser && existingUser.id !== userId) {
      throw createError(409, "Esse e-mail j\u00e1 est\u00e1 cadastrado.");
    }

    if (nextEmail !== targetUser.email) {
      updateUserEmailStatement.run(nextEmail, userId);
    }
  }

  if (nextPassword !== null) {
    if (nextPassword.length > 0 && nextPassword.length < 6) {
      throw createError(400, "A senha precisa ter pelo menos 6 caracteres.");
    }

    if (nextPassword.length >= 6) {
      updateUserPasswordStatement.run(hashPassword(nextPassword), userId);
    }
  }

  sendJson(response, 200, {
    user: sanitizeAdminUser(adminUserByIdStatement.get(userId)),
  });
}

async function handleUpdateAdminRole(request, response, rawUserId) {
  const user = getAuthenticatedUser(request);
  ensureAdmin(user);

  const userId = Number(rawUserId);

  if (!Number.isInteger(userId) || userId <= 0) {
    throw createError(400, "Usu\u00e1rio inv\u00e1lido.");
  }

  const targetUser = findUserByIdStatement.get(userId);

  if (!targetUser) {
    throw createError(404, "Usu\u00e1rio n\u00e3o encontrado.");
  }

  const payload = await readRequestBody(request);
  const nextRole = String(payload.role || "").trim().toLowerCase();

  if (!isValidRole(nextRole)) {
    throw createError(400, "Permiss\u00e3o inv\u00e1lida.");
  }

  if (
    targetUser.role === "admin" &&
    nextRole === "user" &&
    Number(countAdminsStatement.get().total) <= 1
  ) {
    throw createError(400, "N\u00e3o \u00e9 poss\u00edvel remover o \u00faltimo admin.");
  }

  if (targetUser.role !== nextRole) {
    updateUserRoleStatement.run(nextRole, userId);
  }

  sendJson(response, 200, {
    user: sanitizeAdminUser(adminUserByIdStatement.get(userId)),
  });
}

async function handleApiRequest(request, response, pathname) {
  assertTrustedOrigin(request);

  if (["POST", "PATCH", "PUT", "DELETE"].includes(request.method || "")) {
    enforceWriteRateLimit(request);
  }

  if (request.method === "GET" && pathname === "/api/healthz") {
    sendJson(response, 200, {
      status: "ok",
      uptimeSeconds: Math.round(process.uptime()),
      timestamp: nowIso(),
    });
    return;
  }

  if (request.method === "POST" && pathname === "/api/auth/register") {
    enforceAuthRateLimit(request, pathname);
    await handleRegister(request, response);
    return;
  }

  if (request.method === "POST" && pathname === "/api/auth/login") {
    enforceAuthRateLimit(request, pathname);
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

  if (request.method === "GET" && pathname === "/api/profile") {
    handleProfile(request, response);
    return;
  }

  if (request.method === "PATCH" && pathname === "/api/profile") {
    await handleUpdateProfile(request, response);
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

  const sessionUpdateMatch =
    request.method === "PATCH" && pathname.match(/^\/api\/sessions\/(\d+)$/);

  if (sessionUpdateMatch) {
    await handleUpdateSession(request, response, sessionUpdateMatch[1]);
    return;
  }

  const sessionDeleteMatch =
    request.method === "DELETE" && pathname.match(/^\/api\/sessions\/(\d+)$/);

  if (sessionDeleteMatch) {
    handleDeleteSession(request, response, sessionDeleteMatch[1]);
    return;
  }

  if (request.method === "POST" && pathname === "/api/sessions/import") {
    await handleImportSessions(request, response);
    return;
  }

  if (request.method === "GET" && pathname === "/api/essay/themes") {
    handleEssayThemes(request, response);
    return;
  }

  if (request.method === "GET" && pathname === "/api/essay/submissions") {
    handleListEssaySubmissions(request, response);
    return;
  }

  if (request.method === "POST" && pathname === "/api/essay/submissions") {
    await handleCreateEssaySubmission(request, response);
    return;
  }

  const essaySubmissionMatch =
    request.method === "GET" && pathname.match(/^\/api\/essay\/submissions\/(\d+)$/);

  if (essaySubmissionMatch) {
    handleGetEssaySubmission(request, response, essaySubmissionMatch[1]);
    return;
  }

  if (request.method === "GET" && pathname === "/api/admin/overview") {
    handleAdminOverview(request, response);
    return;
  }

  if (request.method === "GET" && pathname === "/api/admin/essay-metrics") {
    handleAdminEssayMetrics(request, response);
    return;
  }

  if (request.method === "GET" && pathname === "/api/admin/users") {
    handleAdminUsers(request, response);
    return;
  }

  const adminUserDetailsMatch =
    request.method === "GET" && pathname.match(/^\/api\/admin\/users\/(\d+)$/);

  if (adminUserDetailsMatch) {
    handleAdminUserDetails(request, response, adminUserDetailsMatch[1]);
    return;
  }

  const adminUserUpdateMatch =
    request.method === "PATCH" && pathname.match(/^\/api\/admin\/users\/(\d+)$/);

  if (adminUserUpdateMatch) {
    await handleUpdateAdminUser(request, response, adminUserUpdateMatch[1]);
    return;
  }

  const adminUserRoleMatch =
    request.method === "PATCH" && pathname.match(/^\/api\/admin\/users\/(\d+)\/role$/);

  if (adminUserRoleMatch) {
    await handleUpdateAdminRole(request, response, adminUserRoleMatch[1]);
    return;
  }

  const grantAdminMatch =
    request.method === "POST" && pathname.match(/^\/api\/admin\/users\/(\d+)\/grant-admin$/);

  if (grantAdminMatch) {
    handleGrantAdmin(request, response, grantAdminMatch[1]);
    return;
  }

  throw createError(404, "Rota não encontrada.");
}

validateRuntimeConfiguration();
migrateLegacySessionsToStructured();
ensureAdminUser();

const server = createServer(async (request, response) => {
  try {
    const requestUrl = new URL(request.url, `http://${request.headers.host}`);
    setSecurityHeaders(request, response, requestUrl.pathname);

    if (requestUrl.pathname.startsWith("/api/")) {
      await handleApiRequest(request, response, requestUrl.pathname);
      return;
    }

    await serveStaticFile(response, requestUrl.pathname);
  } catch (error) {
    const statusCode = error.statusCode || 500;
    const message = statusCode >= 500 ? "Erro interno do servidor." : error.message;
    const payload = { error: message };

    if (Number.isInteger(error.retryAfter)) {
      payload.retryAfter = error.retryAfter;
    }

    sendJson(response, statusCode, payload);
  }
});

server.listen(PORT, () => {
  console.log(`[start5] Servidor ativo em http://localhost:${PORT}`);
  console.log(`[start5] Banco SQLite em ${dbFile}`);
});
