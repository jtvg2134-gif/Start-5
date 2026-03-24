import { createServer } from "node:http";
import { spawnSync } from "node:child_process";
import { createHash, randomBytes, scryptSync, timingSafeEqual } from "node:crypto";
import { existsSync, mkdirSync } from "node:fs";
import { readFile, unlink, writeFile } from "node:fs/promises";
import { extname, dirname, resolve, relative } from "node:path";
import { fileURLToPath } from "node:url";
import { DatabaseSync } from "node:sqlite";
import {
  DEFAULT_QUESTION_BANK_EXAMS,
  QUESTION_DIFFICULTY_VALUES,
  QUESTION_PROCESS_STATUS_VALUES,
  QUESTION_PROOF_STATUS_VALUES,
  QUESTION_REVIEW_STATUS_VALUES,
  calculateUsageDifficulty,
  parseQuestionsFromExtractedText,
} from "./backend/question_bank.js";
import { findEnemCatalogItem, loadEnemCatalog } from "./backend/enem_catalog.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = __dirname;
const publicDir = resolve(projectRoot, "public");
const dataDir = resolve(projectRoot, "data");
const dbFile = resolve(dataDir, "start5.db");
const questionBankUploadDir = resolve(dataDir, "question_bank_uploads");
const pythonEssayEngineEntry = resolve(projectRoot, "backend", "essay_engine", "cli.py");

const PORT = Number(process.env.PORT) || 3000;
const IS_PRODUCTION = process.env.NODE_ENV === "production";
const DEFAULT_ADMIN_PASSWORD = "Start5Admin123!";
const DEFAULT_ADMIN_EMAIL = "owner@start5.local";
const PUBLIC_ORIGIN = String(process.env.START5_PUBLIC_ORIGIN || "").trim().replace(/\/+$/, "");
const BODY_LIMIT_BYTES = Math.max(10_000, Number(process.env.START5_BODY_LIMIT_BYTES) || 1_000_000);
const QUESTION_BANK_UPLOAD_LIMIT_BYTES = Math.max(
  BODY_LIMIT_BYTES,
  Number(process.env.START5_QUESTION_BANK_UPLOAD_LIMIT_BYTES) || 16_000_000
);
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
const DEFAULT_SESSION_STATE = "normal";
const MIN_START_SESSION_MINUTES = 10;
const DEFAULT_SUBJECT_KEY = "ingles";
const QUESTION_BANK_DIFFICULTY_SET = new Set(QUESTION_DIFFICULTY_VALUES);
const QUESTION_BANK_PROOF_STATUS_SET = new Set(QUESTION_PROOF_STATUS_VALUES);
const QUESTION_BANK_REVIEW_STATUS_SET = new Set(QUESTION_REVIEW_STATUS_VALUES);
const QUESTION_BANK_PROCESS_STATUS_SET = new Set(QUESTION_PROCESS_STATUS_VALUES);
const QUESTION_BANK_FLAG_FILTERS = new Set(["all", "unanswered", "wrong", "favorites", "review"]);
const QUESTION_BANK_SUBJECT_VALUES = [
  "matematica",
  "portugues",
  "fisica",
  "quimica",
  "biologia",
  "historia",
  "geografia",
  "filosofia",
  "sociologia",
  "ingles",
];
const QUESTION_BANK_SUBJECT_LABELS = {
  matematica: "Matematica",
  portugues: "Portugues",
  fisica: "Fisica",
  quimica: "Quimica",
  biologia: "Biologia",
  historia: "Historia",
  geografia: "Geografia",
  filosofia: "Filosofia",
  sociologia: "Sociologia",
  ingles: "Ingles",
};
const QUESTION_BANK_ALTERNATIVE_LETTERS = ["A", "B", "C", "D", "E"];
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
const ESSAY_CALIBRATION_MODE = /^(1|true|on|yes)$/i.test(
  String(process.env.START5_ESSAY_CALIBRATION_MODE || "").trim()
);
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
const ROUTINE_EXAM_METADATA = {
  enem: {
    label: "ENEM",
    group: "Mais conhecidos",
    featured: true,
    profile: "enem_like",
    searchTerms: ["sisu", "nacional", "mec", "federal"],
  },
  fuvest: {
    label: "FUVEST (USP)",
    group: "Mais conhecidos",
    featured: true,
    profile: "paulista_tradicional",
    searchTerms: ["usp", "sao paulo", "universidade de sao paulo"],
  },
  unicamp: {
    label: "UNICAMP",
    group: "Mais conhecidos",
    featured: true,
    profile: "paulista_tradicional",
    searchTerms: ["campinas"],
  },
  unesp: {
    label: "UNESP",
    group: "Mais conhecidos",
    featured: true,
    profile: "paulista_tradicional",
    searchTerms: ["julio de mesquita", "estadual paulista"],
  },
  unifesp: {
    label: "UNIFESP",
    group: "Mais conhecidos",
    featured: true,
    profile: "saude_reforcada",
    searchTerms: ["federal de sao paulo", "medicina", "sao paulo"],
  },
  uerj: {
    label: "UERJ",
    group: "Mais conhecidos",
    featured: true,
    profile: "humanas_redacao",
    searchTerms: ["rio de janeiro", "estadual do rio"],
  },
  ufmg: {
    label: "UFMG",
    group: "Federais e estaduais",
    featured: true,
    profile: "federal_tradicional",
    searchTerms: ["minas gerais", "belo horizonte"],
  },
  ufrj: {
    label: "UFRJ",
    group: "Federais e estaduais",
    featured: true,
    profile: "federal_tradicional",
    searchTerms: ["rio de janeiro", "federal do rio"],
  },
  ufpr: {
    label: "UFPR",
    group: "Federais e estaduais",
    featured: true,
    profile: "federal_tradicional",
    searchTerms: ["parana", "curitiba"],
  },
  ufrgs: {
    label: "UFRGS",
    group: "Federais e estaduais",
    featured: true,
    profile: "federal_tradicional",
    searchTerms: ["rio grande do sul", "porto alegre"],
  },
  ufsc: {
    label: "UFSC",
    group: "Federais e estaduais",
    featured: true,
    profile: "federal_tradicional",
    searchTerms: ["santa catarina", "florianopolis"],
  },
  unb: {
    label: "UnB",
    group: "Federais e estaduais",
    featured: true,
    profile: "federal_tradicional",
    searchTerms: ["brasilia", "universidade de brasilia"],
  },
  ufc: {
    label: "UFC",
    group: "Federais e estaduais",
    featured: false,
    profile: "federal_tradicional",
    searchTerms: ["ceara", "fortaleza"],
  },
  ufpe: {
    label: "UFPE",
    group: "Federais e estaduais",
    featured: false,
    profile: "federal_tradicional",
    searchTerms: ["pernambuco", "recife"],
  },
  ufba: {
    label: "UFBA",
    group: "Federais e estaduais",
    featured: false,
    profile: "federal_tradicional",
    searchTerms: ["bahia", "salvador"],
  },
  ufrn: {
    label: "UFRN",
    group: "Federais e estaduais",
    featured: false,
    profile: "federal_tradicional",
    searchTerms: ["rio grande do norte", "natal"],
  },
  ufpb: {
    label: "UFPB",
    group: "Federais e estaduais",
    featured: false,
    profile: "federal_tradicional",
    searchTerms: ["paraiba", "joao pessoa"],
  },
  ufpa: {
    label: "UFPA",
    group: "Federais e estaduais",
    featured: false,
    profile: "federal_tradicional",
    searchTerms: ["para", "belem"],
  },
  ufam: {
    label: "UFAM",
    group: "Federais e estaduais",
    featured: false,
    profile: "federal_tradicional",
    searchTerms: ["amazonas", "manaus"],
  },
  ufmt: {
    label: "UFMT",
    group: "Federais e estaduais",
    featured: false,
    profile: "federal_tradicional",
    searchTerms: ["mato grosso", "cuiaba"],
  },
  ufms: {
    label: "UFMS",
    group: "Federais e estaduais",
    featured: false,
    profile: "federal_tradicional",
    searchTerms: ["mato grosso do sul", "campo grande"],
  },
  ufg: {
    label: "UFG",
    group: "Federais e estaduais",
    featured: false,
    profile: "federal_tradicional",
    searchTerms: ["goias", "goiania"],
  },
  uece: {
    label: "UECE",
    group: "Federais e estaduais",
    featured: false,
    profile: "federal_tradicional",
    searchTerms: ["estadual do ceara", "ceara"],
  },
  uea: {
    label: "UEA",
    group: "Federais e estaduais",
    featured: false,
    profile: "saude_reforcada",
    searchTerms: ["amazonas", "estadual do amazonas"],
  },
  ita: {
    label: "ITA",
    group: "Militares e especiais",
    featured: true,
    profile: "militar_exatas",
    searchTerms: ["aeronautica", "engenharia", "tecnologico"],
  },
  ime: {
    label: "IME",
    group: "Militares e especiais",
    featured: true,
    profile: "militar_exatas",
    searchTerms: ["exercito", "engenharia militar"],
  },
  especex: {
    label: "EsPCEx",
    group: "Militares e especiais",
    featured: false,
    profile: "militar_misto",
    searchTerms: ["preparatoria de cadetes", "exercito"],
  },
  puc_sp: {
    label: "PUC-SP",
    group: "Privados e especiais",
    featured: false,
    profile: "humanas_redacao",
    searchTerms: ["pontificia catolica", "sao paulo"],
  },
  puc_rio: {
    label: "PUC-Rio",
    group: "Privados e especiais",
    featured: false,
    profile: "humanas_redacao",
    searchTerms: ["pontificia catolica", "rio"],
  },
  mackenzie: {
    label: "Mackenzie",
    group: "Privados e especiais",
    featured: false,
    profile: "paulista_tradicional",
    searchTerms: ["presbiteriana", "mack"],
  },
  fgv: {
    label: "FGV",
    group: "Privados e especiais",
    featured: false,
    profile: "humanas_redacao",
    searchTerms: ["fundacao getulio vargas", "administracao", "economia", "direito"],
  },
  insper: {
    label: "Insper",
    group: "Privados e especiais",
    featured: false,
    profile: "exatas_aplicadas",
    searchTerms: ["negocios", "engenharia", "economia", "administracao"],
  },
  outro: {
    label: "Outro vestibular",
    group: "Personalizado",
    featured: false,
    profile: "federal_tradicional",
    searchTerms: ["personalizado", "outro", "proprio"],
  },
};
const ROUTINE_EXAM_LABELS = Object.fromEntries(
  Object.entries(ROUTINE_EXAM_METADATA).map(([key, metadata]) => [key, metadata.label])
);
const ROUTINE_EXAM_WEIGHT_PROFILES = {
  enem_like: {
    ingles: 8,
    matematica: 16,
    portugues: 12,
    geografia: 8,
    historia: 8,
    biologia: 11,
    fisica: 9,
    quimica: 9,
    redacao: 14,
    filosofia: 4,
    sociologia: 4,
  },
  paulista_tradicional: {
    ingles: 6,
    matematica: 14,
    portugues: 13,
    geografia: 9,
    historia: 9,
    biologia: 10,
    fisica: 10,
    quimica: 10,
    redacao: 13,
    filosofia: 3,
    sociologia: 3,
  },
  federal_tradicional: {
    ingles: 7,
    matematica: 13,
    portugues: 13,
    geografia: 8,
    historia: 8,
    biologia: 10,
    fisica: 10,
    quimica: 10,
    redacao: 13,
    filosofia: 4,
    sociologia: 4,
  },
  humanas_redacao: {
    ingles: 6,
    matematica: 10,
    portugues: 15,
    geografia: 10,
    historia: 10,
    biologia: 8,
    fisica: 7,
    quimica: 7,
    redacao: 16,
    filosofia: 6,
    sociologia: 5,
  },
  saude_reforcada: {
    ingles: 6,
    matematica: 11,
    portugues: 12,
    geografia: 7,
    historia: 7,
    biologia: 14,
    fisica: 8,
    quimica: 12,
    redacao: 14,
    filosofia: 4,
    sociologia: 3,
  },
  militar_exatas: {
    ingles: 5,
    matematica: 18,
    portugues: 10,
    geografia: 5,
    historia: 5,
    biologia: 6,
    fisica: 16,
    quimica: 12,
    redacao: 10,
    filosofia: 2,
    sociologia: 1,
  },
  militar_misto: {
    ingles: 6,
    matematica: 13,
    portugues: 13,
    geografia: 10,
    historia: 10,
    biologia: 8,
    fisica: 9,
    quimica: 8,
    redacao: 12,
    filosofia: 4,
    sociologia: 3,
  },
  exatas_aplicadas: {
    ingles: 7,
    matematica: 17,
    portugues: 11,
    geografia: 6,
    historia: 6,
    biologia: 6,
    fisica: 12,
    quimica: 10,
    redacao: 11,
    filosofia: 2,
    sociologia: 2,
  },
};
const ROUTINE_TRACK_LABELS = {
  geral: "Geral",
  exatas: "Exatas",
  humanas: "Humanas",
  saude: "Saúde",
  linguagens: "Linguagens",
  personalizado: "Personalizado",
};
const ROUTINE_TRACK_DETAILS = {
  geral: "Equilíbrio amplo entre as matérias mais cobradas.",
  exatas: "Puxa matemática, física e química.",
  humanas: "Puxa história, geografia, filosofia e sociologia.",
  saude: "Puxa biologia e química sem largar redação.",
  linguagens: "Puxa português, redação e inglês.",
  personalizado: "Você ajusta a prioridade manualmente.",
};
const ROUTINE_TRACK_MULTIPLIERS = {
  geral: {},
  exatas: {
    matematica: 1.35,
    fisica: 1.24,
    quimica: 1.18,
    biologia: 0.95,
    geografia: 0.9,
    historia: 0.9,
    filosofia: 0.85,
    sociologia: 0.85,
    portugues: 0.94,
    redacao: 0.94,
    ingles: 0.95,
  },
  humanas: {
    geografia: 1.26,
    historia: 1.26,
    filosofia: 1.2,
    sociologia: 1.2,
    portugues: 1.18,
    redacao: 1.18,
    ingles: 1.05,
    matematica: 0.86,
    fisica: 0.82,
    quimica: 0.82,
    biologia: 0.95,
  },
  saude: {
    biologia: 1.32,
    quimica: 1.22,
    matematica: 1.08,
    fisica: 0.98,
    portugues: 1.05,
    redacao: 1.15,
    ingles: 0.96,
    geografia: 0.88,
    historia: 0.88,
    filosofia: 0.84,
    sociologia: 0.84,
  },
  linguagens: {
    portugues: 1.32,
    redacao: 1.34,
    ingles: 1.22,
    historia: 1.02,
    geografia: 0.95,
    matematica: 0.82,
    fisica: 0.8,
    quimica: 0.8,
    biologia: 0.9,
    filosofia: 1.05,
    sociologia: 1.05,
  },
  personalizado: {},
};
const ROUTINE_COURSE_METADATA = {
  medicina: {
    label: "Medicina",
    group: "Saude",
    featured: true,
    recommendedTrackKey: "saude",
    searchTerms: ["med", "medicina", "medico"],
    subjectBoosts: {
      biologia: 1.38,
      quimica: 1.24,
      redacao: 1.12,
      portugues: 1.08,
      matematica: 1.06,
    },
    targetScores: { ac: 790, ep: 760, ppe: 735 },
  },
  odontologia: {
    label: "Odontologia",
    group: "Saude",
    featured: true,
    recommendedTrackKey: "saude",
    searchTerms: ["odonto", "dentista"],
    subjectBoosts: {
      biologia: 1.28,
      quimica: 1.2,
      redacao: 1.08,
      portugues: 1.04,
    },
    targetScores: { ac: 740, ep: 705, ppe: 675 },
  },
  enfermagem: {
    label: "Enfermagem",
    group: "Saude",
    featured: true,
    recommendedTrackKey: "saude",
    searchTerms: ["enfermeiro", "enfermagem"],
    subjectBoosts: {
      biologia: 1.24,
      quimica: 1.14,
      redacao: 1.08,
      portugues: 1.05,
    },
    targetScores: { ac: 700, ep: 665, ppe: 635 },
  },
  fisioterapia: {
    label: "Fisioterapia",
    group: "Saude",
    featured: false,
    recommendedTrackKey: "saude",
    searchTerms: ["fisio", "reabilitacao"],
    subjectBoosts: {
      biologia: 1.22,
      quimica: 1.12,
      redacao: 1.08,
    },
    targetScores: { ac: 700, ep: 665, ppe: 635 },
  },
  psicologia: {
    label: "Psicologia",
    group: "Saude",
    featured: true,
    recommendedTrackKey: "humanas",
    searchTerms: ["psi", "psicologo"],
    subjectBoosts: {
      redacao: 1.16,
      portugues: 1.14,
      biologia: 1.08,
      sociologia: 1.12,
      filosofia: 1.1,
    },
    targetScores: { ac: 735, ep: 700, ppe: 670 },
  },
  farmacia: {
    label: "Farmacia",
    group: "Saude",
    featured: false,
    recommendedTrackKey: "saude",
    searchTerms: ["farmacia", "farmaceutico"],
    subjectBoosts: {
      quimica: 1.24,
      biologia: 1.14,
      redacao: 1.06,
    },
    targetScores: { ac: 710, ep: 675, ppe: 645 },
  },
  biomedicina: {
    label: "Biomedicina",
    group: "Saude",
    featured: false,
    recommendedTrackKey: "saude",
    searchTerms: ["biomed", "laboratorio"],
    subjectBoosts: {
      biologia: 1.24,
      quimica: 1.16,
      redacao: 1.06,
    },
    targetScores: { ac: 720, ep: 685, ppe: 655 },
  },
  nutricao: {
    label: "Nutricao",
    group: "Saude",
    featured: false,
    recommendedTrackKey: "saude",
    searchTerms: ["nutri", "nutricionista"],
    subjectBoosts: {
      biologia: 1.18,
      quimica: 1.08,
      redacao: 1.06,
    },
    targetScores: { ac: 690, ep: 655, ppe: 625 },
  },
  veterinaria: {
    label: "Medicina Veterinaria",
    group: "Saude",
    featured: false,
    recommendedTrackKey: "saude",
    searchTerms: ["veterinaria", "veterinario", "animal"],
    subjectBoosts: {
      biologia: 1.26,
      quimica: 1.12,
      redacao: 1.06,
    },
    targetScores: { ac: 730, ep: 695, ppe: 665 },
  },
  engenharia: {
    label: "Engenharia",
    group: "Exatas e tecnologia",
    featured: true,
    recommendedTrackKey: "exatas",
    searchTerms: ["engenharia", "engenheiro"],
    subjectBoosts: {
      matematica: 1.3,
      fisica: 1.22,
      quimica: 1.12,
      redacao: 1.04,
    },
    targetScores: { ac: 730, ep: 695, ppe: 665 },
  },
  engenharia_civil: {
    label: "Engenharia Civil",
    group: "Exatas e tecnologia",
    featured: true,
    recommendedTrackKey: "exatas",
    searchTerms: ["engenharia civil", "civil", "obra", "estruturas"],
    subjectBoosts: {
      matematica: 1.34,
      fisica: 1.24,
      quimica: 1.08,
      redacao: 1.04,
    },
    targetScores: { ac: 745, ep: 710, ppe: 680 },
  },
  engenharia_mecanica: {
    label: "Engenharia Mecanica",
    group: "Exatas e tecnologia",
    featured: false,
    recommendedTrackKey: "exatas",
    searchTerms: ["engenharia mecanica", "mecanica", "motores"],
    subjectBoosts: {
      matematica: 1.34,
      fisica: 1.26,
      quimica: 1.08,
      redacao: 1.04,
    },
    targetScores: { ac: 735, ep: 700, ppe: 670 },
  },
  engenharia_eletrica: {
    label: "Engenharia Eletrica",
    group: "Exatas e tecnologia",
    featured: false,
    recommendedTrackKey: "exatas",
    searchTerms: ["engenharia eletrica", "eletrica", "circuitos"],
    subjectBoosts: {
      matematica: 1.34,
      fisica: 1.26,
      quimica: 1.06,
      redacao: 1.04,
    },
    targetScores: { ac: 740, ep: 705, ppe: 675 },
  },
  engenharia_producao: {
    label: "Engenharia de Producao",
    group: "Exatas e tecnologia",
    featured: false,
    recommendedTrackKey: "exatas",
    searchTerms: ["engenharia de producao", "producao", "processos"],
    subjectBoosts: {
      matematica: 1.28,
      fisica: 1.16,
      quimica: 1.06,
      redacao: 1.06,
    },
    targetScores: { ac: 725, ep: 690, ppe: 660 },
  },
  engenharia_quimica: {
    label: "Engenharia Quimica",
    group: "Exatas e tecnologia",
    featured: false,
    recommendedTrackKey: "exatas",
    searchTerms: ["engenharia quimica", "quimica", "processos quimicos"],
    subjectBoosts: {
      matematica: 1.26,
      fisica: 1.14,
      quimica: 1.22,
      redacao: 1.04,
    },
    targetScores: { ac: 730, ep: 695, ppe: 665 },
  },
  engenharia_software: {
    label: "Engenharia de Software",
    group: "Exatas e tecnologia",
    featured: true,
    recommendedTrackKey: "exatas",
    searchTerms: ["software", "programacao", "dev"],
    subjectBoosts: {
      matematica: 1.32,
      fisica: 1.16,
      ingles: 1.12,
      redacao: 1.04,
    },
    targetScores: { ac: 755, ep: 720, ppe: 690 },
  },
  ciencia_computacao: {
    label: "Ciencia da Computacao",
    group: "Exatas e tecnologia",
    featured: true,
    recommendedTrackKey: "exatas",
    searchTerms: ["computacao", "computador", "ti", "programacao"],
    subjectBoosts: {
      matematica: 1.34,
      ingles: 1.14,
      fisica: 1.08,
      redacao: 1.05,
    },
    targetScores: { ac: 760, ep: 725, ppe: 695 },
  },
  sistemas_informacao: {
    label: "Sistemas de Informacao",
    group: "Exatas e tecnologia",
    featured: false,
    recommendedTrackKey: "exatas",
    searchTerms: ["sistemas", "informacao", "dados"],
    subjectBoosts: {
      matematica: 1.24,
      ingles: 1.1,
      redacao: 1.04,
    },
    targetScores: { ac: 710, ep: 675, ppe: 645 },
  },
  arquitetura: {
    label: "Arquitetura e Urbanismo",
    group: "Exatas e tecnologia",
    featured: false,
    recommendedTrackKey: "exatas",
    searchTerms: ["arquitetura", "urbanismo", "projeto"],
    subjectBoosts: {
      matematica: 1.12,
      redacao: 1.14,
      portugues: 1.08,
      geografia: 1.06,
    },
    targetScores: { ac: 715, ep: 680, ppe: 650 },
  },
  matematica: {
    label: "Matematica",
    group: "Exatas e tecnologia",
    featured: false,
    recommendedTrackKey: "exatas",
    searchTerms: ["matematica", "licenciatura"],
    subjectBoosts: {
      matematica: 1.36,
      fisica: 1.08,
      redacao: 1.04,
    },
    targetScores: { ac: 650, ep: 620, ppe: 590 },
  },
  fisica_curso: {
    label: "Fisica",
    group: "Exatas e tecnologia",
    featured: false,
    recommendedTrackKey: "exatas",
    searchTerms: ["fisica", "licenciatura em fisica", "bacharelado em fisica"],
    subjectBoosts: {
      fisica: 1.36,
      matematica: 1.18,
      redacao: 1.04,
    },
    targetScores: { ac: 650, ep: 620, ppe: 590 },
  },
  quimica_curso: {
    label: "Quimica",
    group: "Exatas e tecnologia",
    featured: false,
    recommendedTrackKey: "exatas",
    searchTerms: ["quimica", "licenciatura em quimica", "bacharelado em quimica"],
    subjectBoosts: {
      quimica: 1.34,
      matematica: 1.1,
      redacao: 1.04,
      fisica: 1.04,
    },
    targetScores: { ac: 640, ep: 610, ppe: 580 },
  },
  biologia_curso: {
    label: "Biologia",
    group: "Saude",
    featured: false,
    recommendedTrackKey: "saude",
    searchTerms: ["biologia", "ciencias biologicas", "licenciatura em biologia"],
    subjectBoosts: {
      biologia: 1.34,
      quimica: 1.08,
      redacao: 1.06,
    },
    targetScores: { ac: 650, ep: 620, ppe: 590 },
  },
  estatistica: {
    label: "Estatistica",
    group: "Exatas e tecnologia",
    featured: false,
    recommendedTrackKey: "exatas",
    searchTerms: ["estatistica", "dados", "analise"],
    subjectBoosts: {
      matematica: 1.32,
      ingles: 1.08,
      redacao: 1.04,
    },
    targetScores: { ac: 680, ep: 645, ppe: 615 },
  },
  direito: {
    label: "Direito",
    group: "Humanas e negocios",
    featured: true,
    recommendedTrackKey: "humanas",
    searchTerms: ["direito", "juridico", "advocacia"],
    subjectBoosts: {
      redacao: 1.18,
      portugues: 1.16,
      historia: 1.1,
      geografia: 1.08,
      sociologia: 1.08,
      filosofia: 1.08,
    },
    targetScores: { ac: 760, ep: 725, ppe: 695 },
  },
  relacoes_internacionais: {
    label: "Relacoes Internacionais",
    group: "Humanas e negocios",
    featured: false,
    recommendedTrackKey: "humanas",
    searchTerms: ["ri", "internacional", "diplomacia"],
    subjectBoosts: {
      historia: 1.14,
      geografia: 1.14,
      ingles: 1.12,
      redacao: 1.1,
      portugues: 1.08,
    },
    targetScores: { ac: 730, ep: 695, ppe: 665 },
  },
  historia: {
    label: "Historia",
    group: "Humanas e negocios",
    featured: false,
    recommendedTrackKey: "humanas",
    searchTerms: ["historia", "licenciatura"],
    subjectBoosts: {
      historia: 1.34,
      redacao: 1.1,
      portugues: 1.08,
      geografia: 1.08,
    },
    targetScores: { ac: 640, ep: 605, ppe: 575 },
  },
  geografia: {
    label: "Geografia",
    group: "Humanas e negocios",
    featured: false,
    recommendedTrackKey: "humanas",
    searchTerms: ["geografia", "licenciatura"],
    subjectBoosts: {
      geografia: 1.34,
      redacao: 1.08,
      historia: 1.08,
      portugues: 1.04,
    },
    targetScores: { ac: 630, ep: 595, ppe: 565 },
  },
  letras: {
    label: "Letras",
    group: "Linguagens e criacao",
    featured: false,
    recommendedTrackKey: "linguagens",
    searchTerms: ["letras", "literatura", "linguistica"],
    subjectBoosts: {
      portugues: 1.3,
      redacao: 1.18,
      ingles: 1.14,
      historia: 1.04,
    },
    targetScores: { ac: 620, ep: 590, ppe: 560 },
  },
  pedagogia: {
    label: "Pedagogia",
    group: "Linguagens e criacao",
    featured: false,
    recommendedTrackKey: "linguagens",
    searchTerms: ["pedagogia", "educacao"],
    subjectBoosts: {
      redacao: 1.14,
      portugues: 1.14,
      historia: 1.06,
      sociologia: 1.06,
    },
    targetScores: { ac: 600, ep: 570, ppe: 545 },
  },
  educacao_fisica: {
    label: "Educacao Fisica",
    group: "Saude",
    featured: false,
    recommendedTrackKey: "saude",
    searchTerms: ["educacao fisica", "edf", "esporte"],
    subjectBoosts: {
      biologia: 1.12,
      redacao: 1.08,
      portugues: 1.06,
      historia: 1.04,
    },
    targetScores: { ac: 640, ep: 610, ppe: 580 },
  },
  jornalismo: {
    label: "Jornalismo",
    group: "Linguagens e criacao",
    featured: false,
    recommendedTrackKey: "linguagens",
    searchTerms: ["jornalismo", "midia", "comunicacao"],
    subjectBoosts: {
      redacao: 1.16,
      portugues: 1.16,
      historia: 1.06,
      geografia: 1.04,
    },
    targetScores: { ac: 690, ep: 655, ppe: 625 },
  },
  publicidade: {
    label: "Publicidade e Propaganda",
    group: "Linguagens e criacao",
    featured: false,
    recommendedTrackKey: "linguagens",
    searchTerms: ["publicidade", "propaganda", "marketing"],
    subjectBoosts: {
      redacao: 1.12,
      portugues: 1.1,
      ingles: 1.08,
      sociologia: 1.04,
    },
    targetScores: { ac: 680, ep: 645, ppe: 615 },
  },
  design: {
    label: "Design",
    group: "Linguagens e criacao",
    featured: false,
    recommendedTrackKey: "linguagens",
    searchTerms: ["design", "criacao", "visual"],
    subjectBoosts: {
      redacao: 1.12,
      portugues: 1.08,
      matematica: 1.04,
      historia: 1.04,
    },
    targetScores: { ac: 670, ep: 635, ppe: 605 },
  },
  administracao: {
    label: "Administracao",
    group: "Humanas e negocios",
    featured: true,
    recommendedTrackKey: "humanas",
    searchTerms: ["administracao", "gestao", "negocios"],
    subjectBoosts: {
      matematica: 1.12,
      redacao: 1.1,
      portugues: 1.08,
      geografia: 1.06,
      historia: 1.04,
    },
    targetScores: { ac: 690, ep: 655, ppe: 625 },
  },
  economia: {
    label: "Economia",
    group: "Humanas e negocios",
    featured: false,
    recommendedTrackKey: "humanas",
    searchTerms: ["economia", "economista", "mercado"],
    subjectBoosts: {
      matematica: 1.2,
      redacao: 1.1,
      geografia: 1.08,
      historia: 1.06,
      portugues: 1.04,
    },
    targetScores: { ac: 730, ep: 695, ppe: 665 },
  },
  contabeis: {
    label: "Ciencias Contabeis",
    group: "Humanas e negocios",
    featured: false,
    recommendedTrackKey: "humanas",
    searchTerms: ["contabeis", "contabilidade", "contador"],
    subjectBoosts: {
      matematica: 1.12,
      portugues: 1.08,
      redacao: 1.08,
      geografia: 1.04,
    },
    targetScores: { ac: 670, ep: 635, ppe: 605 },
  },
  outro: {
    label: "Outro curso",
    group: "Personalizado",
    featured: false,
    recommendedTrackKey: "personalizado",
    searchTerms: ["outro", "personalizado", "curso livre"],
    subjectBoosts: {},
    targetScores: { ac: 650, ep: 620, ppe: 590 },
  },
};
const ROUTINE_ADMISSION_CATEGORY_LABELS = {
  ac: "Ampla Concorrencia",
  ep: "Escola Publica",
  ppi: "Pretos, Pardos e Indigenas",
  ep_baixa_renda: "Escola Publica + Baixa Renda",
  ep_ppi: "Escola Publica + PPI",
  pcd: "Pessoa com Deficiencia",
};
const ROUTINE_ADMISSION_CATEGORY_DETAILS = {
  ac: "Modalidade geral sem reserva especifica.",
  ep: "Referencia interna para ingresso por escola publica.",
  ppi: "Estimativa interna para modalidades com recorte racial.",
  ep_baixa_renda: "Estimativa interna para escola publica com recorte de renda.",
  ep_ppi: "Estimativa interna para escola publica com recorte racial.",
  pcd: "Estimativa interna para modalidades com reserva PcD.",
};
const ROUTINE_ADMISSION_CATEGORY_SHORT_LABELS = {
  ac: "AC",
  ep: "EP",
  ppi: "PPI",
  ep_baixa_renda: "EP + BR",
  ep_ppi: "EP + PPI",
  pcd: "PcD",
};
const ROUTINE_ADMISSION_CATEGORY_TARGET_BUCKETS = {
  ac: "ac",
  ep: "ep",
  ppi: "ppe",
  ep_baixa_renda: "ppe",
  ep_ppi: "ppe",
  pcd: "ep",
};
const ROUTINE_EXAM_SCORE_SCALE_BY_PROFILE = {
  enem_like: "enem_points",
  federal_tradicional: "enem_points",
  saude_reforcada: "enem_points",
  paulista_tradicional: "percent_correct",
  humanas_redacao: "percent_correct",
  militar_exatas: "percent_correct",
  militar_misto: "percent_correct",
  exatas_aplicadas: "percent_correct",
};
const ROUTINE_EXAM_PERCENT_ADJUSTMENTS = {
  fuvest: 2,
  unicamp: 1,
  unesp: -1,
  unifesp: -1,
  uerj: -2,
  ita: 5,
  ime: 6,
  especex: -2,
  puc_sp: -1,
  puc_rio: -1,
  mackenzie: -2,
  fgv: 1,
  insper: 1,
};
const ROUTINE_EXAM_KEYS = new Set(Object.keys(ROUTINE_EXAM_LABELS));
const ROUTINE_COURSE_KEYS = new Set(Object.keys(ROUTINE_COURSE_METADATA));
const ROUTINE_TRACK_KEYS = new Set(Object.keys(ROUTINE_TRACK_LABELS));
const ROUTINE_ADMISSION_CATEGORY_KEYS = new Set(Object.keys(ROUTINE_ADMISSION_CATEGORY_LABELS));
const ROUTINE_DIFFICULTY_LEVELS = new Set(["facil", "normal", "dificil", "muito_dificil", "atencao", "reforco"]);
const ROUTINE_MANUAL_DELTA_VALUES = new Set([-2, -1, 0, 1, 2, 3, 4, 5]);
const ROUTINE_WEEKDAY_LABELS = [
  "Segunda",
  "Terça",
  "Quarta",
  "Quinta",
  "Sexta",
  "Sábado",
  "Domingo",
];
const ROUTINE_PRIMARY_EXAM_WEIGHT = 0.7;
const ROUTINE_SECONDARY_EXAM_WEIGHT = 0.3;
const ROUTINE_DEFAULT_STUDY_DAYS = [0, 1, 2, 3, 4];
const ROUTINE_DEFAULT_WEEKDAY_MINUTES = 60;
const ROUTINE_DEFAULT_WEEKLY_GOAL_MINUTES = 300;
const ROUTINE_MIN_DAY_MINUTES = 30;
const ROUTINE_MAX_DAY_MINUTES = 360;
const ROUTINE_MIN_TOTAL_WEEKLY_MINUTES = 30;
const ROUTINE_MIN_BLOCK_MINUTES = 25;
const ROUTINE_PRIORITY_FOCUS_MULTIPLIER = 1.06;
const ROUTINE_DIFFICULTY_MULTIPLIERS = {
  facil: 0.92,
  normal: 1,
  dificil: 1.16,
  muito_dificil: 1.3,
  atencao: 1.16,
  reforco: 1.32,
};
const ROUTINE_MANUAL_DELTA_MULTIPLIERS = {
  "-2": 0.74,
  "-1": 0.88,
  0: 1,
  1: 1.16,
  2: 1.32,
  3: 1.42,
  4: 1.52,
  5: 1.62,
};
const ROUTINE_SUMMARY_VERSION = "routine-v1";
const ROUTINE_HISTORY_LOOKBACK_DAYS = 21;
const ROUTINE_SUBJECT_ORDER = [
  "matematica",
  "portugues",
  "redacao",
  "ingles",
  "biologia",
  "quimica",
  "fisica",
  "historia",
  "geografia",
  "filosofia",
  "sociologia",
  "outras",
];
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
const ESSAY_MIN_WORDS = Math.max(60, Number(process.env.START5_ESSAY_MIN_WORDS) || 160);
const ESSAY_MIN_PARAGRAPHS = Math.max(3, Number(process.env.START5_ESSAY_MIN_PARAGRAPHS) || 4);
const ESSAY_MIN_SENTENCES = Math.max(4, Number(process.env.START5_ESSAY_MIN_SENTENCES) || 8);
const ESSAY_TANGENCY_LIMIT = Math.min(
  0.8,
  Math.max(0.12, Number(process.env.START5_ESSAY_TANGENCY_LIMIT) || 0.34)
);
const ESSAY_DISCONNECTED_SECTION_LIMIT = Math.min(
  0.4,
  Math.max(0.02, Number(process.env.START5_ESSAY_DISCONNECTED_SECTION_LIMIT) || 0.05)
);
const ESSAY_DECORATED_REPERTOIRE_LIMIT = Math.max(
  1,
  Number(process.env.START5_ESSAY_DECORATED_REPERTOIRE_LIMIT) || 2
);
const ESSAY_VAGUE_PROPOSAL_LIMIT = Math.max(
  1,
  Number(process.env.START5_ESSAY_VAGUE_PROPOSAL_LIMIT) || 2
);
const ESSAY_ALERT_WEIGHT_CRITICAL = Math.max(
  10,
  Number(process.env.START5_ESSAY_ALERT_WEIGHT_CRITICAL) || 45
);
const ESSAY_ALERT_WEIGHT_MODERATE = Math.max(
  5,
  Number(process.env.START5_ESSAY_ALERT_WEIGHT_MODERATE) || 20
);
const ESSAY_RUBRIC_VERSION = "enem-rubrica-local-v5";
const ESSAY_PROMPT_VERSION = "essay-engine-local-v5";
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
          technicalJustification: {
            type: "string",
          },
          technicalImprovement: {
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
    diagnosticMessages: {
      type: "array",
      maxItems: 8,
      items: {
        type: "string",
      },
    },
    criticalAlerts: {
      type: "array",
      maxItems: 6,
      items: {
        type: "string",
      },
    },
    profileLabel: {
      type: "string",
    },
    confidenceLevel: {
      type: "string",
    },
    confidenceNote: {
      type: "string",
    },
    themeStatus: {
      type: "string",
    },
    evidenceMap: {
      type: "object",
      additionalProperties: false,
      properties: {
        thesis: {
          type: "string",
        },
        repertoire: {
          type: "string",
        },
        cohesion: {
          type: "string",
        },
        intervention: {
          type: "string",
        },
        problemExcerpt: {
          type: "string",
        },
      },
    },
    calibrationMeta: {
      type: "object",
      additionalProperties: false,
      properties: {
        enabled: {
          type: "boolean",
        },
        recommendedHumanReview: {
          type: "boolean",
        },
        scoreProfile: {
          type: "string",
        },
        checkpoints: {
          type: "array",
          maxItems: 8,
          items: {
            type: "string",
          },
        },
      },
    },
    preAnalysis: {
      type: "object",
      additionalProperties: false,
      properties: {
        primaryLanguage: { type: "string" },
        dissertativeCompatible: { type: "boolean" },
        incompleteText: { type: "boolean" },
        looseSentences: { type: "boolean" },
        missingParagraphing: { type: "boolean" },
        listLike: { type: "boolean" },
        noteLike: { type: "boolean" },
        poemLike: { type: "boolean" },
        narrativeLike: { type: "boolean" },
        messages: {
          type: "array",
          maxItems: 8,
          items: { type: "string" },
        },
      },
    },
    introductionDiagnosis: {
      type: "array",
      maxItems: 6,
      items: { type: "string" },
    },
    conclusionDiagnosis: {
      type: "array",
      maxItems: 6,
      items: { type: "string" },
    },
    riskNotes: {
      type: "array",
      maxItems: 8,
      items: { type: "string" },
    },
    ceilingAnalysis: {
      type: "object",
      additionalProperties: false,
      properties: {
        currentCeiling: { type: "integer" },
        explanation: { type: "string" },
        bandReadings: {
          type: "array",
          maxItems: 4,
          items: { type: "string" },
        },
        locks: {
          type: "array",
          maxItems: 8,
          items: { type: "string" },
        },
      },
    },
    improvementLadder: {
      type: "object",
      additionalProperties: false,
      properties: {
        quickFixes: {
          type: "array",
          maxItems: 5,
          items: { type: "string" },
        },
        competenceImprovements: {
          type: "array",
          maxItems: 5,
          items: { type: "string" },
        },
        bandLeapSteps: {
          type: "array",
          maxItems: 5,
          items: { type: "string" },
        },
      },
    },
    feedbackModes: {
      type: "object",
      additionalProperties: false,
      properties: {
        studentSummary: { type: "string" },
        technicalSummary: { type: "string" },
      },
    },
    rewritingGuidance: {
      type: "object",
      additionalProperties: false,
      properties: {
        introduction: { type: "string" },
        topicSentence: { type: "string" },
        repertoire: { type: "string" },
        argumentativeLink: { type: "string" },
        intervention: { type: "string" },
      },
    },
    auditTrail: {
      type: "object",
      additionalProperties: false,
      properties: {
        rubricVersion: { type: "string" },
        promptVersion: { type: "string" },
        rulesApplied: {
          type: "array",
          maxItems: 16,
          items: { type: "string" },
        },
        locksTriggered: {
          type: "array",
          maxItems: 12,
          items: { type: "string" },
        },
        evidenceUsed: {
          type: "array",
          maxItems: 10,
          items: { type: "string" },
        },
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
const ESSAY_LOCAL_REPERTOIRE_SUPPORT_MARKERS = [
  "demonstra",
  "evidencia",
  "explica",
  "revela",
  "mostra",
  "comprova",
  "denuncia",
  "ilustra",
  "exemplifica",
  "dialoga",
  "reforca",
  "relaciona",
];
const ESSAY_LOCAL_POCKET_REPERTOIRE_MARKERS = [
  "constituicao federal",
  "declaracao universal",
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
];
const ESSAY_LOCAL_VAGUE_INTERVENTION_AGENTS = [
  "todos",
  "todo mundo",
  "a sociedade",
  "nossa sociedade",
  "nos",
  "nÃ³s",
  "o povo",
  "a populacao",
];
const ESSAY_LOCAL_HUMAN_RIGHTS_VIOLATION_MARKERS = [
  "matar",
  "morte",
  "exterminar",
  "eliminar",
  "banir",
  "expulsar",
  "torturar",
  "linchar",
  "fuzilar",
  "aniquilar",
  "esterilizar",
  "castrar",
];
const ESSAY_LOCAL_NON_ARGUMENTATIVE_MARKERS = [
  "era uma vez",
  "querido diario",
  "querido diÃ¡rio",
  "oi",
  "ola",
  "olÃ¡",
];
const ESSAY_LOCAL_ENGLISH_STOPWORDS = [
  "the", "and", "that", "with", "from", "this", "have", "will", "would", "there", "their",
  "about", "which", "should", "into", "because", "people", "school", "student", "students",
];
const ESSAY_LOCAL_ABSTRACT_MARKERS = [
  "sociedade",
  "realidade",
  "cenario",
  "cenario",
  "problemática",
  "problematica",
  "contexto",
  "panorama",
  "questao",
  "questão",
  "ambito",
  "âmbito",
  "esfera",
];
const ESSAY_LOCAL_LIST_LINE_MARKERS = ["- ", "* ", "1.", "2.", "3.", "I.", "II."];
const ESSAY_LOCAL_NOTE_MARKERS = ["prezado", "atenciosamente", "querido", "olá", "ola"];
const ESSAY_LOCAL_NARRATIVE_MARKERS = ["era uma vez", "de repente", "certo dia", "entao eu", "então eu"];
const ESSAY_LOCAL_FORMULAIC_OPENINGS = [
  "diante desse cenario",
  "diante desse cenário",
  "sob essa otica",
  "sob essa ótica",
  "nesse contexto",
  "hodiernamente",
];
const ESSAY_LOCAL_FORMULAIC_PROPOSALS = [
  "e preciso conscientizar",
  "é preciso conscientizar",
  "faz-se necessario",
  "faz-se necessário",
  "deve-se promover campanhas",
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
const SQL_QUESTION_BANK_DIFFICULTY_LIST = QUESTION_DIFFICULTY_VALUES.map((value) => `'${value}'`).join(", ");
const SQL_QUESTION_BANK_REVIEW_STATUS_LIST = QUESTION_REVIEW_STATUS_VALUES.map((value) => `'${value}'`).join(", ");
const SQL_QUESTION_BANK_PROOF_STATUS_LIST = QUESTION_PROOF_STATUS_VALUES.map((value) => `'${value}'`).join(", ");
const SQL_QUESTION_BANK_PROCESS_STATUS_LIST = QUESTION_PROCESS_STATUS_VALUES.map((value) => `'${value}'`).join(", ");
const SQL_QUESTION_BANK_ALTERNATIVE_LETTER_LIST = QUESTION_BANK_ALTERNATIVE_LETTERS.map((value) => `'${value}'`).join(", ");
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

if (!existsSync(questionBankUploadDir)) {
  mkdirSync(questionBankUploadDir, { recursive: true });
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

  CREATE TABLE IF NOT EXISTS routine_preferences (
    user_id INTEGER PRIMARY KEY,
    primary_exam_key TEXT NOT NULL DEFAULT 'enem',
    secondary_exam_key TEXT NOT NULL DEFAULT '',
    course_key TEXT NOT NULL DEFAULT '',
    admission_category_key TEXT NOT NULL DEFAULT 'ac',
    course_track_key TEXT NOT NULL DEFAULT 'geral',
    course_name TEXT NOT NULL DEFAULT '',
    study_days_json TEXT NOT NULL DEFAULT '[]',
    weekday_minutes_json TEXT NOT NULL DEFAULT '{}',
    weekly_goal_minutes INTEGER NOT NULL DEFAULT 300,
    updated_at TEXT NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS routine_subject_preferences (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    subject_key TEXT NOT NULL DEFAULT 'ingles',
    custom_subject_name TEXT NOT NULL DEFAULT '',
    manual_delta INTEGER NOT NULL DEFAULT 0,
    difficulty_level TEXT NOT NULL DEFAULT 'normal',
    updated_at TEXT NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE(user_id, subject_key, custom_subject_name)
  );

  CREATE TABLE IF NOT EXISTS routine_week_plans (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    week_start TEXT NOT NULL,
    generation_source_json TEXT NOT NULL DEFAULT '{}',
    generated_at TEXT NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE(user_id, week_start)
  );

  CREATE TABLE IF NOT EXISTS routine_week_plan_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    plan_id INTEGER NOT NULL,
    day_of_week INTEGER NOT NULL,
    subject_key TEXT NOT NULL DEFAULT 'ingles',
    custom_subject_name TEXT NOT NULL DEFAULT '',
    planned_minutes INTEGER NOT NULL DEFAULT 0,
    slot_type TEXT NOT NULL DEFAULT 'base',
    reason_label TEXT NOT NULL DEFAULT '',
    FOREIGN KEY (plan_id) REFERENCES routine_week_plans(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS vestibulares (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nome TEXT NOT NULL,
    sigla TEXT NOT NULL UNIQUE,
    descricao TEXT NOT NULL DEFAULT '',
    ativo INTEGER NOT NULL DEFAULT 1 CHECK (ativo IN (0, 1)),
    created_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS provas (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    vestibular_id INTEGER NOT NULL,
    ano INTEGER NOT NULL,
    fase TEXT NOT NULL DEFAULT '',
    versao TEXT NOT NULL DEFAULT '',
    materia_geral TEXT NOT NULL DEFAULT '',
    pdf_file_path TEXT NOT NULL DEFAULT '',
    pdf_original_name TEXT NOT NULL DEFAULT '',
    pdf_mime_type TEXT NOT NULL DEFAULT '',
    pdf_size_bytes INTEGER NOT NULL DEFAULT 0,
    extracted_text TEXT NOT NULL DEFAULT '',
    process_status TEXT NOT NULL DEFAULT 'pending' CHECK (process_status IN (${SQL_QUESTION_BANK_PROCESS_STATUS_LIST})),
    status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN (${SQL_QUESTION_BANK_PROOF_STATUS_LIST})),
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    FOREIGN KEY (vestibular_id) REFERENCES vestibulares(id) ON DELETE RESTRICT
  );

  CREATE TABLE IF NOT EXISTS questoes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    prova_id INTEGER NOT NULL,
    numero INTEGER NOT NULL DEFAULT 0,
    enunciado TEXT NOT NULL,
    materia TEXT NOT NULL DEFAULT '',
    tema TEXT NOT NULL DEFAULT '',
    dificuldade TEXT NOT NULL DEFAULT 'media' CHECK (dificuldade IN (${SQL_QUESTION_BANK_DIFFICULTY_LIST})),
    resposta_correta TEXT NOT NULL DEFAULT '' CHECK (resposta_correta IN ('', ${SQL_QUESTION_BANK_ALTERNATIVE_LETTER_LIST})),
    status_revisao TEXT NOT NULL DEFAULT 'pending' CHECK (status_revisao IN (${SQL_QUESTION_BANK_REVIEW_STATUS_LIST})),
    origem_pdf TEXT NOT NULL DEFAULT '',
    observacoes_adm TEXT NOT NULL DEFAULT '',
    sugestao_materia TEXT NOT NULL DEFAULT '',
    sugestao_tema TEXT NOT NULL DEFAULT '',
    sugestao_dificuldade TEXT NOT NULL DEFAULT '',
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    published_at TEXT NOT NULL DEFAULT '',
    FOREIGN KEY (prova_id) REFERENCES provas(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS alternativas (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    questao_id INTEGER NOT NULL,
    letra TEXT NOT NULL CHECK (letra IN (${SQL_QUESTION_BANK_ALTERNATIVE_LETTER_LIST})),
    texto TEXT NOT NULL DEFAULT '',
    FOREIGN KEY (questao_id) REFERENCES questoes(id) ON DELETE CASCADE,
    UNIQUE(questao_id, letra)
  );

  CREATE TABLE IF NOT EXISTS question_attempts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    questao_id INTEGER NOT NULL,
    resposta_marcada TEXT NOT NULL CHECK (resposta_marcada IN (${SQL_QUESTION_BANK_ALTERNATIVE_LETTER_LIST})),
    acertou INTEGER NOT NULL CHECK (acertou IN (0, 1)),
    tempo_gasto_segundos INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (questao_id) REFERENCES questoes(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS question_stats (
    questao_id INTEGER PRIMARY KEY,
    total_respostas INTEGER NOT NULL DEFAULT 0,
    total_acertos INTEGER NOT NULL DEFAULT 0,
    total_erros INTEGER NOT NULL DEFAULT 0,
    taxa_acerto REAL NOT NULL DEFAULT 0,
    dificuldade_calculada TEXT NOT NULL DEFAULT '' CHECK (dificuldade_calculada IN ('', ${SQL_QUESTION_BANK_DIFFICULTY_LIST})),
    updated_at TEXT NOT NULL,
    FOREIGN KEY (questao_id) REFERENCES questoes(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS question_user_states (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    questao_id INTEGER NOT NULL,
    is_favorite INTEGER NOT NULL DEFAULT 0 CHECK (is_favorite IN (0, 1)),
    review_later INTEGER NOT NULL DEFAULT 0 CHECK (review_later IN (0, 1)),
    updated_at TEXT NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (questao_id) REFERENCES questoes(id) ON DELETE CASCADE,
    UNIQUE(user_id, questao_id)
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

  CREATE INDEX IF NOT EXISTS idx_routine_subject_preferences_user
  ON routine_subject_preferences (user_id);

  CREATE INDEX IF NOT EXISTS idx_routine_week_plans_user_week
  ON routine_week_plans (user_id, week_start);

  CREATE INDEX IF NOT EXISTS idx_routine_week_plan_items_plan
  ON routine_week_plan_items (plan_id, day_of_week);

  CREATE INDEX IF NOT EXISTS idx_vestibulares_nome
  ON vestibulares (nome);

  CREATE INDEX IF NOT EXISTS idx_provas_vestibular_ano
  ON provas (vestibular_id, ano DESC);

  CREATE INDEX IF NOT EXISTS idx_provas_status
  ON provas (status, process_status);

  CREATE INDEX IF NOT EXISTS idx_questoes_prova_numero
  ON questoes (prova_id, numero ASC);

  CREATE INDEX IF NOT EXISTS idx_questoes_filtros
  ON questoes (materia, tema, dificuldade, status_revisao);

  CREATE INDEX IF NOT EXISTS idx_alternativas_questao
  ON alternativas (questao_id, letra);

  CREATE INDEX IF NOT EXISTS idx_question_attempts_user_question_created
  ON question_attempts (user_id, questao_id, created_at DESC);

  CREATE INDEX IF NOT EXISTS idx_question_attempts_question
  ON question_attempts (questao_id, created_at DESC);

  CREATE INDEX IF NOT EXISTS idx_question_user_states_user
  ON question_user_states (user_id, updated_at DESC);
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

function ensureRoutinePreferenceColumns() {
  const existingColumns = db
    .prepare("PRAGMA table_info(routine_preferences)")
    .all()
    .map((column) => column.name);

  if (!existingColumns.length) {
    return;
  }

  const migrations = [
    {
      name: "course_key",
      sql: "ALTER TABLE routine_preferences ADD COLUMN course_key TEXT NOT NULL DEFAULT ''",
    },
    {
      name: "admission_category_key",
      sql: "ALTER TABLE routine_preferences ADD COLUMN admission_category_key TEXT NOT NULL DEFAULT 'ac'",
    },
  ];

  migrations.forEach((migration) => {
    if (!existingColumns.includes(migration.name)) {
      db.exec(migration.sql);
    }
  });
}

ensureUserColumns();
ensureStartSessionColumns();
ensureEssaySubmissionColumns();
ensureRoutinePreferenceColumns();

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

const getRoutinePreferencesStatement = db.prepare(`
  SELECT
    user_id AS userId,
    primary_exam_key AS primaryExamKey,
    secondary_exam_key AS secondaryExamKey,
    course_key AS courseKey,
    admission_category_key AS admissionCategoryKey,
    course_track_key AS courseTrackKey,
    course_name AS courseName,
    study_days_json AS studyDaysJson,
    weekday_minutes_json AS weekdayMinutesJson,
    weekly_goal_minutes AS weeklyGoalMinutes,
    updated_at AS updatedAt
  FROM routine_preferences
  WHERE user_id = ?
`);

const upsertRoutinePreferencesStatement = db.prepare(`
  INSERT INTO routine_preferences (
    user_id,
    primary_exam_key,
    secondary_exam_key,
    course_key,
    admission_category_key,
    course_track_key,
    course_name,
    study_days_json,
    weekday_minutes_json,
    weekly_goal_minutes,
    updated_at
  )
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  ON CONFLICT(user_id) DO UPDATE SET
    primary_exam_key = excluded.primary_exam_key,
    secondary_exam_key = excluded.secondary_exam_key,
    course_key = excluded.course_key,
    admission_category_key = excluded.admission_category_key,
    course_track_key = excluded.course_track_key,
    course_name = excluded.course_name,
    study_days_json = excluded.study_days_json,
    weekday_minutes_json = excluded.weekday_minutes_json,
    weekly_goal_minutes = excluded.weekly_goal_minutes,
    updated_at = excluded.updated_at
`);

const listRoutineSubjectPreferencesStatement = db.prepare(`
  SELECT
    id,
    user_id AS userId,
    subject_key AS subjectKey,
    custom_subject_name AS customSubjectName,
    manual_delta AS manualDelta,
    difficulty_level AS difficultyLevel,
    updated_at AS updatedAt
  FROM routine_subject_preferences
  WHERE user_id = ?
  ORDER BY id ASC
`);

const deleteRoutineSubjectPreferencesStatement = db.prepare(`
  DELETE FROM routine_subject_preferences
  WHERE user_id = ?
`);

const insertRoutineSubjectPreferenceStatement = db.prepare(`
  INSERT INTO routine_subject_preferences (
    user_id,
    subject_key,
    custom_subject_name,
    manual_delta,
    difficulty_level,
    updated_at
  )
  VALUES (?, ?, ?, ?, ?, ?)
`);

const getRoutineWeekPlanStatement = db.prepare(`
  SELECT
    id,
    user_id AS userId,
    week_start AS weekStart,
    generation_source_json AS generationSourceJson,
    generated_at AS generatedAt
  FROM routine_week_plans
  WHERE user_id = ? AND week_start = ?
`);

const insertRoutineWeekPlanStatement = db.prepare(`
  INSERT INTO routine_week_plans (
    user_id,
    week_start,
    generation_source_json,
    generated_at
  )
  VALUES (?, ?, ?, ?)
`);

const updateRoutineWeekPlanStatement = db.prepare(`
  UPDATE routine_week_plans
  SET
    generation_source_json = ?,
    generated_at = ?
  WHERE id = ? AND user_id = ?
`);

const deleteRoutineWeekPlanItemsStatement = db.prepare(`
  DELETE FROM routine_week_plan_items
  WHERE plan_id = ?
`);

const insertRoutineWeekPlanItemStatement = db.prepare(`
  INSERT INTO routine_week_plan_items (
    plan_id,
    day_of_week,
    subject_key,
    custom_subject_name,
    planned_minutes,
    slot_type,
    reason_label
  )
  VALUES (?, ?, ?, ?, ?, ?, ?)
`);

const listRoutineWeekPlanItemsStatement = db.prepare(`
  SELECT
    id,
    plan_id AS planId,
    day_of_week AS dayOfWeek,
    subject_key AS subjectKey,
    custom_subject_name AS customSubjectName,
    planned_minutes AS plannedMinutes,
    slot_type AS slotType,
    reason_label AS reasonLabel
  FROM routine_week_plan_items
  WHERE plan_id = ?
  ORDER BY day_of_week ASC, id ASC
`);

const countQuestionBankExamsStatement = db.prepare(`
  SELECT COUNT(*) AS total
  FROM vestibulares
`);

const listQuestionBankExamsStatement = db.prepare(`
  SELECT
    id,
    nome,
    sigla,
    descricao,
    ativo,
    created_at AS createdAt
  FROM vestibulares
  ORDER BY ativo DESC, nome COLLATE NOCASE ASC
`);

const listPublishedQuestionBankExamsStatement = db.prepare(`
  SELECT DISTINCT
    vestibulares.id,
    vestibulares.nome,
    vestibulares.sigla,
    vestibulares.descricao,
    vestibulares.ativo,
    vestibulares.created_at AS createdAt
  FROM vestibulares
  INNER JOIN provas ON provas.vestibular_id = vestibulares.id
  INNER JOIN questoes ON questoes.prova_id = provas.id
  WHERE vestibulares.ativo = 1
    AND provas.status = 'published'
    AND questoes.status_revisao = 'approved'
  ORDER BY vestibulares.nome COLLATE NOCASE ASC
`);

const findQuestionBankExamByIdStatement = db.prepare(`
  SELECT
    id,
    nome,
    sigla,
    descricao,
    ativo,
    created_at AS createdAt
  FROM vestibulares
  WHERE id = ?
`);

const findQuestionBankExamBySiglaStatement = db.prepare(`
  SELECT
    id,
    nome,
    sigla,
    descricao,
    ativo,
    created_at AS createdAt
  FROM vestibulares
  WHERE sigla = ?
`);

const insertQuestionBankExamStatement = db.prepare(`
  INSERT INTO vestibulares (nome, sigla, descricao, ativo, created_at)
  VALUES (?, ?, ?, ?, ?)
`);

const questionBankAdminOverviewStatement = db.prepare(`
  SELECT
    (SELECT COUNT(*) FROM provas) AS totalProofs,
    (SELECT COUNT(*) FROM provas WHERE status = 'published') AS publishedProofs,
    (SELECT COUNT(*) FROM provas WHERE status = 'review') AS proofsInReview,
    (SELECT COUNT(*) FROM questoes) AS totalQuestions,
    (SELECT COUNT(*) FROM questoes WHERE status_revisao = 'approved') AS approvedQuestions,
    (SELECT COUNT(*) FROM questoes WHERE status_revisao = 'pending') AS pendingQuestions,
    (SELECT COUNT(*) FROM question_attempts) AS totalAttempts
`);

const listQuestionProofsStatement = db.prepare(`
  SELECT
    provas.id,
    provas.vestibular_id AS vestibularId,
    vestibulares.nome AS vestibularNome,
    vestibulares.sigla AS vestibularSigla,
    provas.ano,
    provas.fase,
    provas.versao,
    provas.materia_geral AS materiaGeral,
    provas.pdf_file_path AS pdfFilePath,
    provas.pdf_original_name AS pdfOriginalName,
    provas.pdf_mime_type AS pdfMimeType,
    provas.pdf_size_bytes AS pdfSizeBytes,
    provas.extracted_text AS extractedText,
    provas.process_status AS processStatus,
    provas.status,
    provas.created_at AS createdAt,
    provas.updated_at AS updatedAt,
    COUNT(questoes.id) AS totalQuestions,
    COALESCE(SUM(CASE WHEN questoes.status_revisao = 'approved' THEN 1 ELSE 0 END), 0) AS approvedQuestions,
    COALESCE(SUM(CASE WHEN questoes.status_revisao = 'pending' THEN 1 ELSE 0 END), 0) AS pendingQuestions,
    COALESCE(SUM(CASE WHEN questoes.status_revisao = 'rejected' THEN 1 ELSE 0 END), 0) AS rejectedQuestions
  FROM provas
  INNER JOIN vestibulares ON vestibulares.id = provas.vestibular_id
  LEFT JOIN questoes ON questoes.prova_id = provas.id
  GROUP BY provas.id
  ORDER BY provas.created_at DESC, provas.id DESC
`);

const getQuestionProofByIdStatement = db.prepare(`
  SELECT
    provas.id,
    provas.vestibular_id AS vestibularId,
    vestibulares.nome AS vestibularNome,
    vestibulares.sigla AS vestibularSigla,
    provas.ano,
    provas.fase,
    provas.versao,
    provas.materia_geral AS materiaGeral,
    provas.pdf_file_path AS pdfFilePath,
    provas.pdf_original_name AS pdfOriginalName,
    provas.pdf_mime_type AS pdfMimeType,
    provas.pdf_size_bytes AS pdfSizeBytes,
    provas.extracted_text AS extractedText,
    provas.process_status AS processStatus,
    provas.status,
    provas.created_at AS createdAt,
    provas.updated_at AS updatedAt,
    COUNT(questoes.id) AS totalQuestions,
    COALESCE(SUM(CASE WHEN questoes.status_revisao = 'approved' THEN 1 ELSE 0 END), 0) AS approvedQuestions,
    COALESCE(SUM(CASE WHEN questoes.status_revisao = 'pending' THEN 1 ELSE 0 END), 0) AS pendingQuestions,
    COALESCE(SUM(CASE WHEN questoes.status_revisao = 'rejected' THEN 1 ELSE 0 END), 0) AS rejectedQuestions
  FROM provas
  INNER JOIN vestibulares ON vestibulares.id = provas.vestibular_id
  LEFT JOIN questoes ON questoes.prova_id = provas.id
  WHERE provas.id = ?
  GROUP BY provas.id
`);

const insertQuestionProofStatement = db.prepare(`
  INSERT INTO provas (
    vestibular_id,
    ano,
    fase,
    versao,
    materia_geral,
    pdf_file_path,
    pdf_original_name,
    pdf_mime_type,
    pdf_size_bytes,
    extracted_text,
    process_status,
    status,
    created_at,
    updated_at
  )
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`);

const updateQuestionProofStatement = db.prepare(`
  UPDATE provas
  SET
    vestibular_id = ?,
    ano = ?,
    fase = ?,
    versao = ?,
    materia_geral = ?,
    pdf_file_path = ?,
    pdf_original_name = ?,
    pdf_mime_type = ?,
    pdf_size_bytes = ?,
    extracted_text = ?,
    process_status = ?,
    status = ?,
    updated_at = ?
  WHERE id = ?
`);

const updateQuestionProofStatusStatement = db.prepare(`
  UPDATE provas
  SET
    status = ?,
    updated_at = ?
  WHERE id = ?
`);

const updateQuestionProofProcessStatement = db.prepare(`
  UPDATE provas
  SET
    extracted_text = ?,
    process_status = ?,
    status = ?,
    updated_at = ?
  WHERE id = ?
`);

const countQuestionAttemptsForProofStatement = db.prepare(`
  SELECT COUNT(*) AS total
  FROM question_attempts
  INNER JOIN questoes ON questoes.id = question_attempts.questao_id
  WHERE questoes.prova_id = ?
`);

const listQuestionsByProofStatement = db.prepare(`
  SELECT
    questoes.id,
    questoes.prova_id AS provaId,
    questoes.numero,
    questoes.enunciado,
    questoes.materia,
    questoes.tema,
    questoes.dificuldade,
    questoes.resposta_correta AS respostaCorreta,
    questoes.status_revisao AS statusRevisao,
    questoes.origem_pdf AS origemPdf,
    questoes.observacoes_adm AS observacoesAdm,
    questoes.sugestao_materia AS sugestaoMateria,
    questoes.sugestao_tema AS sugestaoTema,
    questoes.sugestao_dificuldade AS sugestaoDificuldade,
    questoes.created_at AS createdAt,
    questoes.updated_at AS updatedAt,
    questoes.published_at AS publishedAt,
    question_stats.total_respostas AS totalRespostas,
    question_stats.total_acertos AS totalAcertos,
    question_stats.total_erros AS totalErros,
    question_stats.taxa_acerto AS taxaAcerto,
    question_stats.dificuldade_calculada AS dificuldadeCalculada
  FROM questoes
  LEFT JOIN question_stats ON question_stats.questao_id = questoes.id
  WHERE questoes.prova_id = ?
  ORDER BY questoes.numero ASC, questoes.id ASC
`);

const getQuestionByIdStatement = db.prepare(`
  SELECT
    questoes.id,
    questoes.prova_id AS provaId,
    questoes.numero,
    questoes.enunciado,
    questoes.materia,
    questoes.tema,
    questoes.dificuldade,
    questoes.resposta_correta AS respostaCorreta,
    questoes.status_revisao AS statusRevisao,
    questoes.origem_pdf AS origemPdf,
    questoes.observacoes_adm AS observacoesAdm,
    questoes.sugestao_materia AS sugestaoMateria,
    questoes.sugestao_tema AS sugestaoTema,
    questoes.sugestao_dificuldade AS sugestaoDificuldade,
    questoes.created_at AS createdAt,
    questoes.updated_at AS updatedAt,
    questoes.published_at AS publishedAt,
    provas.id AS proofId,
    provas.ano,
    provas.fase,
    provas.versao,
    provas.status AS proofStatus,
    vestibulares.id AS vestibularId,
    vestibulares.nome AS vestibularNome,
    vestibulares.sigla AS vestibularSigla,
    question_stats.total_respostas AS totalRespostas,
    question_stats.total_acertos AS totalAcertos,
    question_stats.total_erros AS totalErros,
    question_stats.taxa_acerto AS taxaAcerto,
    question_stats.dificuldade_calculada AS dificuldadeCalculada
  FROM questoes
  INNER JOIN provas ON provas.id = questoes.prova_id
  INNER JOIN vestibulares ON vestibulares.id = provas.vestibular_id
  LEFT JOIN question_stats ON question_stats.questao_id = questoes.id
  WHERE questoes.id = ?
`);

const insertQuestionStatement = db.prepare(`
  INSERT INTO questoes (
    prova_id,
    numero,
    enunciado,
    materia,
    tema,
    dificuldade,
    resposta_correta,
    status_revisao,
    origem_pdf,
    observacoes_adm,
    sugestao_materia,
    sugestao_tema,
    sugestao_dificuldade,
    created_at,
    updated_at,
    published_at
  )
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`);

const updateQuestionStatement = db.prepare(`
  UPDATE questoes
  SET
    numero = ?,
    enunciado = ?,
    materia = ?,
    tema = ?,
    dificuldade = ?,
    resposta_correta = ?,
    status_revisao = ?,
    origem_pdf = ?,
    observacoes_adm = ?,
    sugestao_materia = ?,
    sugestao_tema = ?,
    sugestao_dificuldade = ?,
    updated_at = ?,
    published_at = ?
  WHERE id = ?
`);

const publishApprovedQuestionsByProofStatement = db.prepare(`
  UPDATE questoes
  SET
    published_at = ?,
    updated_at = ?
  WHERE prova_id = ? AND status_revisao = 'approved'
`);

const deleteQuestionsByProofStatement = db.prepare(`
  DELETE FROM questoes
  WHERE prova_id = ?
`);

const deleteQuestionAlternativesStatement = db.prepare(`
  DELETE FROM alternativas
  WHERE questao_id = ?
`);

const insertQuestionAlternativeStatement = db.prepare(`
  INSERT INTO alternativas (questao_id, letra, texto)
  VALUES (?, ?, ?)
`);

const listQuestionAlternativesForQuestionStatement = db.prepare(`
  SELECT
    id,
    questao_id AS questaoId,
    letra,
    texto
  FROM alternativas
  WHERE questao_id = ?
  ORDER BY letra ASC, id ASC
`);

const aggregateQuestionStatsStatement = db.prepare(`
  SELECT
    COUNT(*) AS totalRespostas,
    COALESCE(SUM(CASE WHEN acertou = 1 THEN 1 ELSE 0 END), 0) AS totalAcertos,
    COALESCE(SUM(CASE WHEN acertou = 0 THEN 1 ELSE 0 END), 0) AS totalErros
  FROM question_attempts
  WHERE questao_id = ?
`);

const upsertQuestionStatsStatement = db.prepare(`
  INSERT INTO question_stats (
    questao_id,
    total_respostas,
    total_acertos,
    total_erros,
    taxa_acerto,
    dificuldade_calculada,
    updated_at
  )
  VALUES (?, ?, ?, ?, ?, ?, ?)
  ON CONFLICT(questao_id) DO UPDATE SET
    total_respostas = excluded.total_respostas,
    total_acertos = excluded.total_acertos,
    total_erros = excluded.total_erros,
    taxa_acerto = excluded.taxa_acerto,
    dificuldade_calculada = excluded.dificuldade_calculada,
    updated_at = excluded.updated_at
`);

const getQuestionStatsStatement = db.prepare(`
  SELECT
    questao_id AS questaoId,
    total_respostas AS totalRespostas,
    total_acertos AS totalAcertos,
    total_erros AS totalErros,
    taxa_acerto AS taxaAcerto,
    dificuldade_calculada AS dificuldadeCalculada,
    updated_at AS updatedAt
  FROM question_stats
  WHERE questao_id = ?
`);

const insertQuestionAttemptStatement = db.prepare(`
  INSERT INTO question_attempts (
    user_id,
    questao_id,
    resposta_marcada,
    acertou,
    tempo_gasto_segundos,
    created_at
  )
  VALUES (?, ?, ?, ?, ?, ?)
`);

const getLatestUserQuestionAttemptStatement = db.prepare(`
  SELECT
    id,
    user_id AS userId,
    questao_id AS questaoId,
    resposta_marcada AS respostaMarcada,
    acertou,
    tempo_gasto_segundos AS tempoGastoSegundos,
    created_at AS createdAt
  FROM question_attempts
  WHERE user_id = ? AND questao_id = ?
  ORDER BY created_at DESC, id DESC
  LIMIT 1
`);

const upsertQuestionUserStateStatement = db.prepare(`
  INSERT INTO question_user_states (
    user_id,
    questao_id,
    is_favorite,
    review_later,
    updated_at
  )
  VALUES (?, ?, ?, ?, ?)
  ON CONFLICT(user_id, questao_id) DO UPDATE SET
    is_favorite = excluded.is_favorite,
    review_later = excluded.review_later,
    updated_at = excluded.updated_at
`);

const getQuestionUserStateStatement = db.prepare(`
  SELECT
    user_id AS userId,
    questao_id AS questaoId,
    is_favorite AS isFavorite,
    review_later AS reviewLater,
    updated_at AS updatedAt
  FROM question_user_states
  WHERE user_id = ? AND questao_id = ?
`);

const questionBankStudentOverviewStatement = db.prepare(`
  SELECT
    COUNT(DISTINCT questoes.id) AS totalAvailable,
    COUNT(DISTINCT CASE WHEN latest_attempt.id IS NOT NULL THEN questoes.id END) AS answeredQuestions,
    COUNT(DISTINCT CASE WHEN latest_attempt.acertou = 1 THEN questoes.id END) AS correctQuestions,
    COUNT(DISTINCT CASE WHEN latest_attempt.acertou = 0 THEN questoes.id END) AS wrongQuestions,
    COUNT(DISTINCT CASE WHEN user_state.is_favorite = 1 THEN questoes.id END) AS favoriteQuestions,
    COUNT(DISTINCT CASE WHEN user_state.review_later = 1 THEN questoes.id END) AS reviewQuestions
  FROM questoes
  INNER JOIN provas ON provas.id = questoes.prova_id
  LEFT JOIN question_user_states AS user_state
    ON user_state.user_id = ? AND user_state.questao_id = questoes.id
  LEFT JOIN question_attempts AS latest_attempt
    ON latest_attempt.id = (
      SELECT qa.id
      FROM question_attempts qa
      WHERE qa.user_id = ? AND qa.questao_id = questoes.id
      ORDER BY qa.created_at DESC, qa.id DESC
      LIMIT 1
    )
  WHERE provas.status = 'published'
    AND questoes.status_revisao = 'approved'
`);

const listQuestionAttemptsForAnalyticsStatement = db.prepare(`
  SELECT
    question_attempts.id,
    question_attempts.questao_id AS questaoId,
    question_attempts.resposta_marcada AS respostaMarcada,
    question_attempts.acertou AS acertou,
    question_attempts.tempo_gasto_segundos AS tempoGastoSegundos,
    question_attempts.created_at AS createdAt,
    questoes.numero,
    questoes.materia,
    questoes.tema,
    provas.id AS proofId,
    provas.ano,
    provas.fase,
    provas.versao,
    vestibulares.nome AS vestibularNome,
    vestibulares.sigla AS vestibularSigla
  FROM question_attempts
  INNER JOIN questoes ON questoes.id = question_attempts.questao_id
  INNER JOIN provas ON provas.id = questoes.prova_id
  INNER JOIN vestibulares ON vestibulares.id = provas.vestibular_id
  WHERE question_attempts.user_id = ?
    AND provas.status = 'published'
    AND questoes.status_revisao = 'approved'
  ORDER BY question_attempts.created_at DESC, question_attempts.id DESC
  LIMIT ?
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

function startOfWeekMonday(date) {
  const copy = new Date(date);
  copy.setHours(0, 0, 0, 0);
  const weekday = copy.getDay();
  const offset = weekday === 0 ? -6 : 1 - weekday;
  copy.setDate(copy.getDate() + offset);
  return copy;
}

function toDateKey(date) {
  const safeDate = new Date(date);

  if (Number.isNaN(safeDate.getTime())) {
    return "";
  }

  const year = safeDate.getFullYear();
  const month = String(safeDate.getMonth() + 1).padStart(2, "0");
  const day = String(safeDate.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function parseDateKey(value) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(value || "").trim());

  if (!match) {
    return null;
  }

  const parsedDate = new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]), 12, 0, 0, 0);
  return Number.isNaN(parsedDate.getTime()) ? null : parsedDate;
}

function getWeekStartDateKey(referenceDate = new Date()) {
  return toDateKey(startOfWeekMonday(referenceDate));
}

function getWeekEndDateKey(weekStartKey) {
  const weekStartDate = parseDateKey(weekStartKey);
  return weekStartDate ? toDateKey(addDays(weekStartDate, 6)) : "";
}

function isDateKeyInRange(dateKey, startKey, endKey) {
  return Boolean(dateKey) && Boolean(startKey) && Boolean(endKey) && dateKey >= startKey && dateKey <= endKey;
}

function sanitizeRoutineExamKey(value, allowEmpty = false) {
  const normalizedValue = String(value || "").trim().toLowerCase();

  if (!normalizedValue) {
    return allowEmpty ? "" : "enem";
  }

  return ROUTINE_EXAM_KEYS.has(normalizedValue) ? normalizedValue : allowEmpty ? "" : "enem";
}

function sanitizeRoutineCourseKey(value, allowEmpty = true) {
  const normalizedValue = String(value || "").trim().toLowerCase();

  if (!normalizedValue) {
    return allowEmpty ? "" : "outro";
  }

  return ROUTINE_COURSE_KEYS.has(normalizedValue) ? normalizedValue : allowEmpty ? "" : "outro";
}

function sanitizeRoutineAdmissionCategoryKey(value) {
  const normalizedValue = String(value || "").trim().toLowerCase();
  return ROUTINE_ADMISSION_CATEGORY_KEYS.has(normalizedValue) ? normalizedValue : "ac";
}

function sanitizeRoutineTrackKey(value) {
  const normalizedValue = String(value || "").trim().toLowerCase();
  return ROUTINE_TRACK_KEYS.has(normalizedValue) ? normalizedValue : "geral";
}

function sanitizeRoutineDifficultyLevel(value) {
  const normalizedValue = String(value || "").trim().toLowerCase();
  return ROUTINE_DIFFICULTY_LEVELS.has(normalizedValue) ? normalizedValue : "normal";
}

function sanitizeRoutineManualDelta(value) {
  const safeValue = clampInteger(value, -2, 2);
  return ROUTINE_MANUAL_DELTA_VALUES.has(safeValue) ? safeValue : 0;
}

function normalizeRoutineStudyDays(value) {
  const rawValues = Array.isArray(value) ? value : parseStoredJson(String(value || "[]"), []);
  const normalizedDays = rawValues
    .map((entry) => clampInteger(entry, 0, 6))
    .filter((entry, index, list) => list.indexOf(entry) === index)
    .sort((left, right) => left - right);

  return normalizedDays.length ? normalizedDays : [...ROUTINE_DEFAULT_STUDY_DAYS];
}

function normalizeRoutineWeekdayMinutes(value, studyDays = ROUTINE_DEFAULT_STUDY_DAYS) {
  const fallback = {};
  const source =
    value && typeof value === "object" && !Array.isArray(value)
      ? value
      : parseStoredJson(typeof value === "string" ? value : JSON.stringify(value || {}), {});

  studyDays.forEach((dayOfWeek) => {
    fallback[String(dayOfWeek)] = ROUTINE_DEFAULT_WEEKDAY_MINUTES;
  });

  studyDays.forEach((dayOfWeek) => {
    const rawValue = source?.[dayOfWeek] ?? source?.[String(dayOfWeek)];
    fallback[String(dayOfWeek)] = clampInteger(
      rawValue === undefined ? ROUTINE_DEFAULT_WEEKDAY_MINUTES : rawValue,
      ROUTINE_MIN_DAY_MINUTES,
      ROUTINE_MAX_DAY_MINUTES
    );
  });

  return fallback;
}

function getRoutineWeeklyGoalMinutes(weekdayMinutes, explicitValue) {
  const totalMinutes = Object.values(weekdayMinutes || {}).reduce(
    (total, currentValue) => total + clampInteger(currentValue, 0, ROUTINE_MAX_DAY_MINUTES),
    0
  );
  const fallbackValue = Math.max(ROUTINE_MIN_TOTAL_WEEKLY_MINUTES, totalMinutes || ROUTINE_DEFAULT_WEEKLY_GOAL_MINUTES);
  return clampInteger(
    explicitValue === undefined ? fallbackValue : explicitValue,
    ROUTINE_MIN_TOTAL_WEEKLY_MINUTES,
    Math.max(ROUTINE_MIN_TOTAL_WEEKLY_MINUTES, fallbackValue)
  );
}

function getRoutinePreferenceKey(subjectKey, customSubjectName = "") {
  const normalizedCustomName = String(customSubjectName || "").trim().toLowerCase();
  return subjectKey === "outras" ? `${subjectKey}:${normalizedCustomName}` : subjectKey;
}

function getRoutineCourseLabel(courseKey, courseName = "") {
  const normalizedCourseKey = sanitizeRoutineCourseKey(courseKey, true);
  const customCourseName = sanitizeShortText(courseName, 80);

  if (normalizedCourseKey === "outro" && customCourseName) {
    return customCourseName;
  }

  if (normalizedCourseKey && ROUTINE_COURSE_METADATA[normalizedCourseKey]) {
    return ROUTINE_COURSE_METADATA[normalizedCourseKey].label;
  }

  return customCourseName;
}

function getRoutineSubjectLabel(subjectKey, customSubjectName = "") {
  return getSubjectLabel(subjectKey, customSubjectName);
}

function getRoutineCourseMultiplier(courseKey, subjectKey) {
  const normalizedCourseKey = sanitizeRoutineCourseKey(courseKey, true);

  if (!normalizedCourseKey || !ROUTINE_COURSE_METADATA[normalizedCourseKey]) {
    return 1;
  }

  return Number(ROUTINE_COURSE_METADATA[normalizedCourseKey].subjectBoosts?.[subjectKey] || 1);
}

function getRoutineExamScoreScale(examKey) {
  const normalizedExamKey = sanitizeRoutineExamKey(examKey);
  const profileKey = ROUTINE_EXAM_METADATA[normalizedExamKey]?.profile;
  return ROUTINE_EXAM_SCORE_SCALE_BY_PROFILE[profileKey] || "enem_points";
}

function getRoutinePercentTargetFromEnemEstimate(enemTarget, examKey) {
  const adjustment = Number(ROUTINE_EXAM_PERCENT_ADJUSTMENTS[examKey] || 0);
  const rawPercent = 36 + ((Number(enemTarget || 0) - 500) * 0.155) + adjustment;
  return clampInteger(rawPercent, 40, 92);
}

function buildRoutineCourseTarget(preferences) {
  const courseKey = sanitizeRoutineCourseKey(preferences?.courseKey, true);
  const courseMetadata = courseKey ? ROUTINE_COURSE_METADATA[courseKey] : null;
  const courseLabel = getRoutineCourseLabel(courseKey, preferences?.courseName);

  if (!courseMetadata || !courseLabel) {
    return null;
  }

  const primaryExamKey = sanitizeRoutineExamKey(preferences?.primaryExamKey);
  const scoreScaleType = getRoutineExamScoreScale(primaryExamKey);
  const admissionCategoryKey = sanitizeRoutineAdmissionCategoryKey(preferences?.admissionCategoryKey);
  const categoryTargets = Object.entries(ROUTINE_ADMISSION_CATEGORY_LABELS).map(([categoryKey, categoryLabel]) => {
    const targetBucket = ROUTINE_ADMISSION_CATEGORY_TARGET_BUCKETS[categoryKey] || "ac";
    const enemEquivalent = Number(courseMetadata.targetScores?.[targetBucket] || courseMetadata.targetScores?.ac || 650);
    const targetValue = scoreScaleType === "percent_correct"
      ? getRoutinePercentTargetFromEnemEstimate(enemEquivalent, primaryExamKey)
      : enemEquivalent;

    return {
      key: categoryKey,
      label: categoryLabel,
      shortLabel: ROUTINE_ADMISSION_CATEGORY_SHORT_LABELS[categoryKey] || categoryLabel,
      detail: ROUTINE_ADMISSION_CATEGORY_DETAILS[categoryKey] || "",
      enemEquivalent,
      targetValue,
      targetDisplay: scoreScaleType === "percent_correct" ? `${targetValue}/100` : `${targetValue}/1000`,
      isSelected: categoryKey === admissionCategoryKey,
    };
  });

  return {
    courseKey,
    courseLabel,
    group: courseMetadata.group,
    recommendedTrackKey: courseMetadata.recommendedTrackKey || "geral",
    recommendedTrackLabel: ROUTINE_TRACK_LABELS[courseMetadata.recommendedTrackKey] || "Geral",
    admissionCategoryKey,
    scoreScaleType,
    scoreScaleLabel: scoreScaleType === "percent_correct"
      ? "desempenho estimado na prova"
      : "nota ENEM estimada",
    selectedTarget: categoryTargets.find((entry) => entry.key === admissionCategoryKey) || categoryTargets[0],
    categories: categoryTargets,
    note: "Meta interna de referencia, nao corte oficial do vestibular.",
  };
}

function roundToNearestFive(value) {
  const safeValue = Number(value) || 0;
  return Math.max(0, Math.round(safeValue / 5) * 5);
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

async function readRequestBody(request, options = {}) {
  const maxBytes = Math.max(1_000, Number(options.maxBytes) || BODY_LIMIT_BYTES);
  const contentType = String(request.headers["content-type"] || "").toLowerCase();
  const contentLength = Number(request.headers["content-length"] || 0);

  if (contentLength > maxBytes) {
    throw createError(413, "A requisicao passou do limite permitido.");
  }

  if (contentType && !contentType.includes("application/json")) {
    throw createError(415, "Envie os dados em JSON.");
  }

  const chunks = [];
  let totalSize = 0;

  for await (const chunk of request) {
    totalSize += chunk.length;

    if (totalSize > maxBytes) {
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

function normalizeQuestionBankTerm(value, maxLength = 120) {
  return sanitizeShortText(value, maxLength)
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ");
}

function sanitizeQuestionBankMultilineText(value, maxLength = 16_000) {
  return sanitizeEssayText(value, maxLength);
}

function sanitizeQuestionBankExamName(value) {
  return sanitizeShortText(value, 120);
}

function sanitizeQuestionBankExamSigla(value) {
  return String(value || "")
    .trim()
    .toUpperCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^A-Z0-9]/g, "")
    .slice(0, 24);
}

function sanitizeQuestionBankDescription(value) {
  return sanitizeQuestionBankMultilineText(value, 320);
}

function sanitizeQuestionBankYear(value, { allowEmpty = false } = {}) {
  const safeValue = Number(value);

  if (!Number.isInteger(safeValue)) {
    if (allowEmpty) {
      return 0;
    }

    throw createError(400, "Informe um ano valido para a prova.");
  }

  if (safeValue < 1980 || safeValue > 2100) {
    throw createError(400, "O ano da prova precisa estar entre 1980 e 2100.");
  }

  return safeValue;
}

function sanitizeQuestionDifficulty(value, fallback = "media") {
  const difficulty = normalizeQuestionBankTerm(value, 20);
  return QUESTION_BANK_DIFFICULTY_SET.has(difficulty) ? difficulty : fallback;
}

function sanitizeQuestionProofStatus(value, fallback = "draft") {
  const status = normalizeQuestionBankTerm(value, 20);
  return QUESTION_BANK_PROOF_STATUS_SET.has(status) ? status : fallback;
}

function sanitizeQuestionProcessStatus(value, fallback = "pending") {
  const status = normalizeQuestionBankTerm(value, 20);
  return QUESTION_BANK_PROCESS_STATUS_SET.has(status) ? status : fallback;
}

function sanitizeQuestionReviewStatus(value, fallback = "pending") {
  const status = normalizeQuestionBankTerm(value, 20);
  return QUESTION_BANK_REVIEW_STATUS_SET.has(status) ? status : fallback;
}

function sanitizeQuestionFlagFilter(value, fallback = "all") {
  const flag = normalizeQuestionBankTerm(value, 20);
  return QUESTION_BANK_FLAG_FILTERS.has(flag) ? flag : fallback;
}

function sanitizeQuestionNumber(value, { allowEmpty = false } = {}) {
  const safeValue = Number(value);

  if (!Number.isInteger(safeValue)) {
    if (allowEmpty) {
      return 0;
    }

    throw createError(400, "Informe um numero valido para a questao.");
  }

  if (safeValue < 0 || safeValue > 300) {
    throw createError(400, "O numero da questao precisa estar entre 0 e 300.");
  }

  return safeValue;
}

function sanitizeQuestionAlternativeLetter(value, allowEmpty = false) {
  const letter = String(value || "").trim().toUpperCase();

  if (!letter && allowEmpty) {
    return "";
  }

  if (!QUESTION_BANK_ALTERNATIVE_LETTERS.includes(letter)) {
    throw createError(400, "Alternativa invalida. Use apenas letras de A a E.");
  }

  return letter;
}

function sanitizeQuestionBankTimeSpent(value) {
  const safeValue = Number(value);

  if (!Number.isFinite(safeValue) || safeValue < 0) {
    return 0;
  }

  return Math.min(60 * 60 * 4, Math.round(safeValue));
}

function sanitizeQuestionAlternatives(value, { includeEmptySlots = false } = {}) {
  const normalizedEntries = [];

  if (Array.isArray(value)) {
    normalizedEntries.push(...value);
  } else if (value && typeof value === "object") {
    Object.entries(value).forEach(([letter, text]) => {
      normalizedEntries.push({ letra: letter, texto: text });
    });
  }

  const alternativesByLetter = new Map();

  normalizedEntries.forEach((entry, index) => {
    const letterSource =
      typeof entry === "object" && entry !== null
        ? entry.letra ?? entry.letter ?? entry.key ?? QUESTION_BANK_ALTERNATIVE_LETTERS[index] ?? ""
        : QUESTION_BANK_ALTERNATIVE_LETTERS[index] ?? "";
    const textSource =
      typeof entry === "object" && entry !== null
        ? entry.texto ?? entry.text ?? entry.value ?? ""
        : entry;
    const letter = sanitizeQuestionAlternativeLetter(letterSource, true);

    if (!letter) {
      return;
    }

    const text = sanitizeQuestionBankMultilineText(textSource, 2_400).replace(/\n+/g, " ").trim();
    alternativesByLetter.set(letter, { letra: letter, texto: text });
  });

  const orderedAlternatives = QUESTION_BANK_ALTERNATIVE_LETTERS.map((letter) => (
    alternativesByLetter.get(letter) || { letra: letter, texto: "" }
  ));

  return includeEmptySlots ? orderedAlternatives : orderedAlternatives.filter((item) => item.texto);
}

function validateQuestionAlternativePayload(alternatives, correctAnswer) {
  const filledAlternatives = sanitizeQuestionAlternatives(alternatives);

  if (filledAlternatives.length < 2) {
    throw createError(400, "Cadastre pelo menos duas alternativas preenchidas.");
  }

  if (!correctAnswer) {
    throw createError(400, "Defina a resposta correta da questao.");
  }

  if (!filledAlternatives.some((item) => item.letra === correctAnswer)) {
    throw createError(400, "A resposta correta precisa apontar para uma alternativa preenchida.");
  }

  return filledAlternatives;
}

function sanitizeQuestionBankPdfPayload(payload) {
  if (!payload) {
    return null;
  }

  const fileName = sanitizeShortText(payload.fileName || payload.name || "", 180);
  const mimeType = sanitizeShortText(payload.mimeType || payload.type || "application/pdf", 80).toLowerCase();
  const rawBase64 = String(payload.dataBase64 || payload.base64 || "").trim();
  const normalizedBase64 = rawBase64.replace(/^data:application\/pdf;base64,/i, "").replace(/\s+/g, "");

  if (!fileName || !normalizedBase64) {
    throw createError(400, "Envie o PDF original da prova.");
  }

  if (!mimeType.includes("pdf")) {
    throw createError(400, "O arquivo enviado precisa ser um PDF.");
  }

  let buffer;

  try {
    buffer = Buffer.from(normalizedBase64, "base64");
  } catch {
    throw createError(400, "Nao foi possivel ler o PDF enviado.");
  }

  if (!buffer || !buffer.length) {
    throw createError(400, "Nao foi possivel ler o PDF enviado.");
  }

  if (buffer.length > QUESTION_BANK_UPLOAD_LIMIT_BYTES) {
    throw createError(413, "O PDF enviado passou do limite permitido.");
  }

  const safeOriginalName = fileName.toLowerCase().endsWith(".pdf") ? fileName : `${fileName}.pdf`;

  return {
    fileName: safeOriginalName,
    mimeType: "application/pdf",
    buffer,
    sizeBytes: buffer.length,
  };
}

async function saveQuestionBankPdfFile(payload) {
  const normalizedPdf = sanitizeQuestionBankPdfPayload(payload);

  if (!normalizedPdf) {
    return null;
  }

  const storedFileName = `${Date.now()}-${randomBytes(8).toString("hex")}.pdf`;
  const filePath = resolve(questionBankUploadDir, storedFileName);
  await writeFile(filePath, normalizedPdf.buffer);

  return {
    storedFileName,
    originalName: normalizedPdf.fileName,
    mimeType: normalizedPdf.mimeType,
    sizeBytes: normalizedPdf.sizeBytes,
  };
}

function getQuestionBankUploadFilePath(storedFileName) {
  const safeFileName = sanitizeShortText(storedFileName, 200);

  if (!safeFileName) {
    return "";
  }

  const filePath = resolve(questionBankUploadDir, safeFileName);
  const fileRelativePath = relative(questionBankUploadDir, filePath);

  if (!fileRelativePath || fileRelativePath.startsWith("..")) {
    return "";
  }

  return filePath;
}

function getProjectRelativeFilePath(relativeFilePath, baseDir = projectRoot) {
  const normalizedPath = String(relativeFilePath || "").trim();

  if (!normalizedPath) {
    return "";
  }

  const filePath = resolve(baseDir, normalizedPath);
  const fileRelativePath = relative(baseDir, filePath);

  if (!fileRelativePath || fileRelativePath.startsWith("..")) {
    return "";
  }

  return filePath;
}

async function sendInlinePdfFile(response, filePath, downloadName) {
  const file = await readFile(filePath);

  response.writeHead(200, {
    "Content-Type": "application/pdf",
    "Content-Disposition": `inline; filename="${downloadName}"`,
    "Cache-Control": "no-store",
  });
  response.end(file);
}

function tryExtractTextFromPdfFile(storedFileName) {
  const filePath = getQuestionBankUploadFilePath(storedFileName);

  if (!filePath || !existsSync(filePath)) {
    return "";
  }

  try {
    const result = spawnSync("pdftotext", ["-layout", "-enc", "UTF-8", filePath, "-"], {
      encoding: "utf8",
      maxBuffer: 6_000_000,
      timeout: 15_000,
      windowsHide: true,
    });

    if (result.status === 0) {
      return sanitizeQuestionBankMultilineText(result.stdout || "", 220_000);
    }
  } catch {
    return "";
  }

  return "";
}

function serializeQuestionBankExam(row) {
  if (!row) {
    return null;
  }

  return {
    id: Number(row.id) || 0,
    nome: String(row.nome || ""),
    sigla: String(row.sigla || ""),
    descricao: String(row.descricao || ""),
    ativo: Boolean(Number(row.ativo)),
    createdAt: String(row.createdAt || ""),
  };
}

function serializeQuestionStatsRow(row) {
  const totalAnswers = Number(row?.totalRespostas) || 0;
  const totalCorrect = Number(row?.totalAcertos) || 0;
  const totalWrong = Number(row?.totalErros) || 0;
  const accuracyRate = totalAnswers > 0 ? totalCorrect / totalAnswers : Number(row?.taxaAcerto) || 0;

  return {
    totalAnswers,
    totalCorrect,
    totalWrong,
    accuracyRate,
    accuracyPercentage: Math.round(accuracyRate * 100),
    usageDifficulty: String(row?.dificuldadeCalculada || ""),
    updatedAt: String(row?.updatedAt || ""),
  };
}

function serializeQuestionAttemptRow(row) {
  if (!row || !row.id) {
    return null;
  }

  return {
    id: Number(row.id) || 0,
    userId: Number(row.userId) || 0,
    questaoId: Number(row.questaoId) || 0,
    respostaMarcada: sanitizeQuestionAlternativeLetter(row.respostaMarcada, true),
    acertou: Boolean(Number(row.acertou)),
    tempoGastoSegundos: Number(row.tempoGastoSegundos) || 0,
    createdAt: String(row.createdAt || ""),
  };
}

function serializeQuestionStateRow(row) {
  return {
    isFavorite: Boolean(Number(row?.isFavorite)),
    reviewLater: Boolean(Number(row?.reviewLater)),
    updatedAt: String(row?.updatedAt || ""),
  };
}

function buildQuestionAlternativeSlots(alternatives, { filledOnly = false } = {}) {
  const normalizedAlternatives = sanitizeQuestionAlternatives(alternatives, { includeEmptySlots: true });
  return filledOnly ? normalizedAlternatives.filter((item) => item.texto) : normalizedAlternatives;
}

function serializeQuestionProofRow(row, { includeExtractedText = false } = {}) {
  if (!row) {
    return null;
  }

  return {
    id: Number(row.id) || 0,
    vestibular: {
      id: Number(row.vestibularId) || 0,
      nome: String(row.vestibularNome || ""),
      sigla: String(row.vestibularSigla || ""),
    },
    ano: Number(row.ano) || 0,
    fase: String(row.fase || ""),
    versao: String(row.versao || ""),
    materiaGeral: String(row.materiaGeral || ""),
    pdf: {
      hasFile: Boolean(String(row.pdfFilePath || "")),
      filePath: String(row.pdfFilePath || ""),
      originalName: String(row.pdfOriginalName || ""),
      mimeType: String(row.pdfMimeType || ""),
      sizeBytes: Number(row.pdfSizeBytes) || 0,
      downloadUrl: row.pdfFilePath ? `/api/admin/question-bank/provas/${Number(row.id) || 0}/file` : "",
    },
    extractedText: includeExtractedText ? String(row.extractedText || "") : "",
    extractedTextLength: String(row.extractedText || "").length,
    processStatus: sanitizeQuestionProcessStatus(row.processStatus),
    status: sanitizeQuestionProofStatus(row.status),
    createdAt: String(row.createdAt || ""),
    updatedAt: String(row.updatedAt || ""),
    counts: {
      totalQuestions: Number(row.totalQuestions) || 0,
      approvedQuestions: Number(row.approvedQuestions) || 0,
      pendingQuestions: Number(row.pendingQuestions) || 0,
      rejectedQuestions: Number(row.rejectedQuestions) || 0,
    },
  };
}

function serializeAdminQuestionRow(row, alternatives = []) {
  if (!row) {
    return null;
  }

  return {
    id: Number(row.id) || 0,
    provaId: Number(row.provaId || row.proofId) || 0,
    numero: Number(row.numero) || 0,
    enunciado: String(row.enunciado || ""),
    materia: String(row.materia || ""),
    tema: String(row.tema || ""),
    dificuldade: sanitizeQuestionDifficulty(row.dificuldade),
    respostaCorreta: sanitizeQuestionAlternativeLetter(row.respostaCorreta, true),
    statusRevisao: sanitizeQuestionReviewStatus(row.statusRevisao),
    origemPdf: String(row.origemPdf || ""),
    observacoesAdm: String(row.observacoesAdm || ""),
    sugestoes: {
      materia: String(row.sugestaoMateria || ""),
      tema: String(row.sugestaoTema || ""),
      dificuldade: String(row.sugestaoDificuldade || ""),
    },
    alternatives: buildQuestionAlternativeSlots(alternatives),
    stats: serializeQuestionStatsRow(row),
    createdAt: String(row.createdAt || ""),
    updatedAt: String(row.updatedAt || ""),
    publishedAt: String(row.publishedAt || ""),
    prova: {
      id: Number(row.proofId || row.provaId) || 0,
      ano: Number(row.ano) || 0,
      fase: String(row.fase || ""),
      versao: String(row.versao || ""),
      status: String(row.proofStatus || ""),
    },
    vestibular: {
      id: Number(row.vestibularId) || 0,
      nome: String(row.vestibularNome || ""),
      sigla: String(row.vestibularSigla || ""),
    },
  };
}

function serializeStudentQuestionRow(row, alternatives = [], options = {}) {
  if (!row) {
    return null;
  }

  const latestAttempt = serializeQuestionAttemptRow({
    id: row.lastAttemptId,
    userId: row.lastAttemptUserId || 0,
    questaoId: row.id,
    respostaMarcada: row.lastRespostaMarcada,
    acertou: row.lastAcertou,
    tempoGastoSegundos: row.lastTempoGastoSegundos,
    createdAt: row.lastAttemptAt,
  });
  const userState = serializeQuestionStateRow({
    isFavorite: row.isFavorite,
    reviewLater: row.reviewLater,
    updatedAt: row.userStateUpdatedAt,
  });
  const prompt = String(row.enunciado || "");
  const excerpt = sanitizeShortText(prompt.replace(/\s+/g, " "), 220);

  return {
    id: Number(row.id) || 0,
    provaId: Number(row.proofId || row.provaId) || 0,
    numero: Number(row.numero) || 0,
    vestibular: {
      id: Number(row.vestibularId) || 0,
      nome: String(row.vestibularNome || ""),
      sigla: String(row.vestibularSigla || ""),
    },
    prova: {
      id: Number(row.proofId || row.provaId) || 0,
      ano: Number(row.ano) || 0,
      fase: String(row.fase || ""),
      versao: String(row.versao || ""),
      pdfOriginalName: String(row.pdfOriginalName || ""),
      pdfViewerUrl: row.pdfFilePath ? `/api/question-bank/provas/${Number(row.proofId || row.provaId) || 0}/file` : "",
    },
    materia: String(row.materia || ""),
    tema: String(row.tema || ""),
    assunto: String(row.tema || row.materia || ""),
    dificuldade: sanitizeQuestionDifficulty(row.dificuldade),
    enunciado: options.includeFullText ? prompt : "",
    excerpt,
    alternatives: buildQuestionAlternativeSlots(alternatives, { filledOnly: true }),
    stats: serializeQuestionStatsRow(row),
    user: {
      answered: Boolean(latestAttempt),
      lastAttempt,
      lastAttemptCorrect: latestAttempt ? latestAttempt.acertou : null,
      isFavorite: userState.isFavorite,
      reviewLater: userState.reviewLater,
    },
    createdAt: String(row.createdAt || ""),
    updatedAt: String(row.updatedAt || ""),
    respostaCorreta: options.includeCorrectAnswer
      ? sanitizeQuestionAlternativeLetter(row.respostaCorreta, true)
      : "",
  };
}

function listQuestionAlternativeRowsByQuestionIds(questionIds) {
  const normalizedIds = Array.from(new Set(
    (Array.isArray(questionIds) ? questionIds : [])
      .map((value) => Number(value))
      .filter((value) => Number.isInteger(value) && value > 0)
  ));

  if (!normalizedIds.length) {
    return new Map();
  }

  const placeholders = normalizedIds.map(() => "?").join(", ");
  const rows = db.prepare(`
    SELECT
      id,
      questao_id AS questaoId,
      letra,
      texto
    FROM alternativas
    WHERE questao_id IN (${placeholders})
    ORDER BY questao_id ASC, letra ASC, id ASC
  `).all(...normalizedIds);
  const groupedAlternatives = new Map();

  rows.forEach((row) => {
    const questionId = Number(row.questaoId) || 0;

    if (!groupedAlternatives.has(questionId)) {
      groupedAlternatives.set(questionId, []);
    }

    groupedAlternatives.get(questionId).push({
      id: Number(row.id) || 0,
      questaoId: questionId,
      letra: sanitizeQuestionAlternativeLetter(row.letra, true),
      texto: String(row.texto || ""),
    });
  });

  return groupedAlternatives;
}

function refreshQuestionStats(questionId) {
  const safeQuestionId = Number(questionId);

  if (!Number.isInteger(safeQuestionId) || safeQuestionId <= 0) {
    throw createError(400, "Questao invalida.");
  }

  const aggregateRow = aggregateQuestionStatsStatement.get(safeQuestionId);
  const totalAnswers = Number(aggregateRow?.totalRespostas) || 0;
  const totalCorrect = Number(aggregateRow?.totalAcertos) || 0;
  const totalWrong = Number(aggregateRow?.totalErros) || 0;
  const accuracyRate = totalAnswers > 0 ? totalCorrect / totalAnswers : 0;
  const calculatedDifficulty = calculateUsageDifficulty(totalAnswers, accuracyRate) || "";

  upsertQuestionStatsStatement.run(
    safeQuestionId,
    totalAnswers,
    totalCorrect,
    totalWrong,
    accuracyRate,
    calculatedDifficulty,
    nowIso()
  );

  return serializeQuestionStatsRow(getQuestionStatsStatement.get(safeQuestionId));
}

function saveQuestionAlternatives(questionId, alternatives) {
  const safeQuestionId = Number(questionId);
  const filledAlternatives = sanitizeQuestionAlternatives(alternatives);

  deleteQuestionAlternativesStatement.run(safeQuestionId);

  filledAlternatives.forEach((alternative) => {
    insertQuestionAlternativeStatement.run(
      safeQuestionId,
      sanitizeQuestionAlternativeLetter(alternative.letra),
      sanitizeQuestionBankMultilineText(alternative.texto, 2_400).replace(/\n+/g, " ").trim()
    );
  });

  return buildQuestionAlternativeSlots(filledAlternatives);
}

function resolveQuestionPublishedAt(proofRow, statusRevisao, currentPublishedAt = "") {
  if (sanitizeQuestionProofStatus(proofRow?.status) === "published" && statusRevisao === "approved") {
    return String(currentPublishedAt || nowIso());
  }

  return "";
}

function sanitizeQuestionPayload(payload, options = {}) {
  const proofId = Number(payload?.provaId ?? payload?.proofId ?? options.proofId);
  const numero = sanitizeQuestionNumber(payload?.numero ?? options.numero ?? 0, {
    allowEmpty: options.allowEmptyNumber !== false,
  });
  const enunciado = sanitizeQuestionBankMultilineText(payload?.enunciado, 20_000);
  const materia = normalizeQuestionBankTerm(payload?.materia, 80);
  const tema = normalizeQuestionBankTerm(payload?.tema, 120);
  const dificuldade = sanitizeQuestionDifficulty(payload?.dificuldade);
  const respostaCorreta = sanitizeQuestionAlternativeLetter(payload?.respostaCorreta, true);
  const statusRevisao = sanitizeQuestionReviewStatus(payload?.statusRevisao, options.defaultStatusRevisao || "pending");
  const origemPdf = sanitizeQuestionBankMultilineText(payload?.origemPdf, 220).replace(/\n+/g, " ").trim();
  const observacoesAdm = sanitizeQuestionBankMultilineText(payload?.observacoesAdm, 2_200);
  const sugestaoMateria = normalizeQuestionBankTerm(payload?.sugestaoMateria || payload?.sugestoes?.materia || materia, 80);
  const sugestaoTema = normalizeQuestionBankTerm(payload?.sugestaoTema || payload?.sugestoes?.tema || tema, 120);
  const sugestaoDificuldade = sanitizeQuestionDifficulty(
    payload?.sugestaoDificuldade || payload?.sugestoes?.dificuldade || dificuldade,
    dificuldade
  );
  const alternatives = validateQuestionAlternativePayload(payload?.alternativas || payload?.alternatives, respostaCorreta);

  if (!Number.isInteger(proofId) || proofId <= 0) {
    throw createError(400, "Selecione a prova da questao.");
  }

  if (!enunciado) {
    throw createError(400, "Preencha o enunciado da questao.");
  }

  if (!materia) {
    throw createError(400, "Defina a materia da questao.");
  }

  if (statusRevisao === "approved" && numero <= 0) {
    throw createError(400, "Defina o numero da questao antes de aprovar.");
  }

  return {
    proofId,
    numero,
    enunciado,
    materia,
    tema,
    dificuldade,
    respostaCorreta,
    statusRevisao,
    origemPdf,
    observacoesAdm,
    sugestaoMateria,
    sugestaoTema,
    sugestaoDificuldade,
    alternatives,
  };
}

function sanitizeQuestionProofPayload(payload, currentProof = null) {
  const ano = sanitizeQuestionBankYear(payload?.ano ?? currentProof?.ano);
  const fase = sanitizeShortText(payload?.fase ?? currentProof?.fase ?? "", 80);
  const versao = sanitizeShortText(payload?.versao ?? currentProof?.versao ?? "", 80);
  const materiaGeral = normalizeQuestionBankTerm(payload?.materiaGeral ?? currentProof?.materiaGeral ?? "", 80);
  const extractedText = payload?.extractedText === undefined
    ? sanitizeQuestionBankMultilineText(currentProof?.extractedText || "", 220_000)
    : sanitizeQuestionBankMultilineText(payload?.extractedText, 220_000);
  const processStatus = sanitizeQuestionProcessStatus(
    payload?.processStatus ?? currentProof?.processStatus ?? "pending"
  );
  const status = sanitizeQuestionProofStatus(payload?.status ?? currentProof?.status ?? "draft");

  return {
    ano,
    fase,
    versao,
    materiaGeral,
    extractedText,
    processStatus,
    status,
  };
}

function resolveQuestionBankExamId(payload) {
  const directExamId = Number(payload?.vestibularId ?? payload?.examId);

  if (Number.isInteger(directExamId) && directExamId > 0) {
    const existingExam = findQuestionBankExamByIdStatement.get(directExamId);

    if (!existingExam) {
      throw createError(404, "Vestibular nao encontrado.");
    }

    return Number(existingExam.id);
  }

  const nome = sanitizeQuestionBankExamName(
    payload?.vestibularNome ?? payload?.examName ?? payload?.novoVestibularNome ?? ""
  );
  const sigla = sanitizeQuestionBankExamSigla(
    payload?.vestibularSigla ?? payload?.examSigla ?? payload?.novoVestibularSigla ?? ""
  );
  const descricao = sanitizeQuestionBankDescription(
    payload?.vestibularDescricao ?? payload?.examDescription ?? ""
  );

  if (!nome || !sigla) {
    throw createError(400, "Selecione um vestibular existente ou informe nome e sigla.");
  }

  const existingExam = findQuestionBankExamBySiglaStatement.get(sigla);

  if (existingExam) {
    return Number(existingExam.id) || 0;
  }

  const result = insertQuestionBankExamStatement.run(nome, sigla, descricao, 1, nowIso());
  return Number(result.lastInsertRowid) || 0;
}

function ensureQuestionBankSeedData() {
  const totalExams = Number(countQuestionBankExamsStatement.get()?.total) || 0;

  if (totalExams > 0) {
    return;
  }

  DEFAULT_QUESTION_BANK_EXAMS.forEach((exam) => {
    insertQuestionBankExamStatement.run(
      sanitizeQuestionBankExamName(exam.nome),
      sanitizeQuestionBankExamSigla(exam.sigla),
      sanitizeQuestionBankDescription(exam.descricao),
      exam.ativo ? 1 : 0,
      nowIso()
    );
  });
}

function listAdminQuestionsByProof(proofId) {
  const rows = listQuestionsByProofStatement.all(proofId);
  const alternativesByQuestionId = listQuestionAlternativeRowsByQuestionIds(rows.map((row) => row.id));
  return rows.map((row) => serializeAdminQuestionRow(row, alternativesByQuestionId.get(Number(row.id)) || []));
}

function getAdminQuestionById(questionId) {
  const row = getQuestionByIdStatement.get(questionId);

  if (!row) {
    return null;
  }

  return serializeAdminQuestionRow(
    row,
    listQuestionAlternativesForQuestionStatement.all(questionId)
  );
}

function buildQuestionBankReferenceData({ publishedOnly = false } = {}) {
  const vestibulares = (publishedOnly ? listPublishedQuestionBankExamsStatement : listQuestionBankExamsStatement)
    .all()
    .map((row) => serializeQuestionBankExam(row))
    .filter((row) => row && (publishedOnly ? true : row.ativo));

  const yearRows = publishedOnly
    ? db.prepare(`
        SELECT DISTINCT provas.ano AS value
        FROM provas
        INNER JOIN questoes ON questoes.prova_id = provas.id
        WHERE provas.status = 'published' AND questoes.status_revisao = 'approved'
        ORDER BY provas.ano DESC
      `).all()
    : db.prepare(`
        SELECT DISTINCT ano AS value
        FROM provas
        ORDER BY ano DESC
      `).all();
  const matterRows = publishedOnly
    ? db.prepare(`
        SELECT DISTINCT questoes.materia AS value
        FROM questoes
        INNER JOIN provas ON provas.id = questoes.prova_id
        WHERE provas.status = 'published'
          AND questoes.status_revisao = 'approved'
          AND questoes.materia <> ''
        ORDER BY questoes.materia ASC
      `).all()
    : db.prepare(`
        SELECT DISTINCT materia AS value
        FROM questoes
        WHERE materia <> ''
        ORDER BY materia ASC
      `).all();
  const themeRows = publishedOnly
    ? db.prepare(`
        SELECT DISTINCT questoes.tema AS value
        FROM questoes
        INNER JOIN provas ON provas.id = questoes.prova_id
        WHERE provas.status = 'published'
          AND questoes.status_revisao = 'approved'
          AND questoes.tema <> ''
        ORDER BY questoes.tema ASC
      `).all()
    : db.prepare(`
        SELECT DISTINCT tema AS value
        FROM questoes
        WHERE tema <> ''
        ORDER BY tema ASC
      `).all();
  const materias = Array.from(new Set([
    ...QUESTION_BANK_SUBJECT_VALUES,
    ...matterRows.map((row) => String(row.value || "")).filter(Boolean),
  ]));

  return {
    vestibulares,
    anos: yearRows.map((row) => Number(row.value)).filter((value) => Number.isInteger(value) && value > 0),
    materias,
    temas: themeRows.map((row) => String(row.value || "")).filter(Boolean),
    dificuldades: QUESTION_DIFFICULTY_VALUES.slice(),
    proofStatuses: QUESTION_PROOF_STATUS_VALUES.slice(),
    reviewStatuses: QUESTION_REVIEW_STATUS_VALUES.slice(),
    processStatuses: QUESTION_PROCESS_STATUS_VALUES.slice(),
    statusFilters: Array.from(QUESTION_BANK_FLAG_FILTERS),
  };
}

function sanitizeQuestionBankBooklet(value = "") {
  const normalized = String(value || "").trim().toUpperCase();
  return /^CD\d{1,2}$/.test(normalized) ? normalized : "";
}

function buildQuestionBankCatalogFileUrl(item = {}, kind = "prova") {
  const safeKind = kind === "gabarito" ? "gabarito" : "prova";
  const ano = Number(item.ano) || 0;
  const dia = Number(item.dia) || 0;
  const caderno = sanitizeQuestionBankBooklet(item.caderno || "");

  if (!ano || !dia || !caderno) {
    return "";
  }

  const searchParams = new URLSearchParams({
    ano: String(ano),
    dia: String(dia),
    caderno,
    kind: safeKind,
  });

  return `/api/question-bank/catalog/file?${searchParams.toString()}`;
}

function resolveQuestionBankCatalogVestibular(rawVestibular = "") {
  const directExamId = Number(rawVestibular);

  if (Number.isInteger(directExamId) && directExamId > 0) {
    const exam = findQuestionBankExamByIdStatement.get(directExamId);
    return serializeQuestionBankExam(exam);
  }

  const normalizedSigla = sanitizeQuestionBankExamSigla(rawVestibular);

  if (!normalizedSigla) {
    return null;
  }

  return serializeQuestionBankExam(findQuestionBankExamBySiglaStatement.get(normalizedSigla));
}

function buildQuestionBankCatalogSessionStatus(item = {}) {
  const pending = Array.isArray(item.pendencias) ? item.pendencias : [];

  if (pending.includes("prova")) {
    return { label: "Falta prova", state: "missing" };
  }

  if (pending.includes("gabarito")) {
    return { label: "Falta gabarito", state: "missing" };
  }

  if (String(item.status || "") === "review") {
    return { label: "Em revisao", state: "review" };
  }

  return { label: "Pronta", state: "ready" };
}

function serializeQuestionBankCatalogSession(item = {}) {
  const status = buildQuestionBankCatalogSessionStatus(item);

  return {
    key: String(item.chave || ""),
    vestibular: String(item.vestibular || "ENEM"),
    ano: Number(item.ano) || 0,
    dia: Number(item.dia) || 0,
    caderno: String(item.caderno || ""),
    status: String(item.status || ""),
    manifestStatus: String(item.manifest_status || item.status || ""),
    statusLabel: status.label,
    statusState: status.state,
    hasProof: Boolean(item.prova?.principal),
    hasAnswerKey: Boolean(item.gabarito?.principal),
    proof: item.prova
      ? {
          principal: String(item.prova.principal || ""),
          nomeOriginal: String(item.prova.nome_original || ""),
          viewerUrl: item.prova.principal ? buildQuestionBankCatalogFileUrl(item, "prova") : "",
          variantCount: Array.isArray(item.prova.variantes) ? item.prova.variantes.length : 0,
          duplicateCount: Array.isArray(item.prova.duplicatas) ? item.prova.duplicatas.length : 0,
        }
      : null,
    answerKey: item.gabarito
      ? {
          principal: String(item.gabarito.principal || ""),
          nomeOriginal: String(item.gabarito.nome_original || ""),
          viewerUrl: item.gabarito.principal ? buildQuestionBankCatalogFileUrl(item, "gabarito") : "",
          variantCount: Array.isArray(item.gabarito.variantes) ? item.gabarito.variantes.length : 0,
          duplicateCount: Array.isArray(item.gabarito.duplicatas) ? item.gabarito.duplicatas.length : 0,
        }
      : null,
    pending: Array.isArray(item.pendencias) ? item.pendencias : [],
    notes: Array.isArray(item.notes) ? item.notes.map((note) => String(note || "")).filter(Boolean) : [],
    tags: Array.isArray(item.tags) ? item.tags.map((tag) => String(tag || "")).filter(Boolean) : [],
    overrideApplied: Boolean(item.override_aplicado),
  };
}

async function buildQuestionBankCatalogFallback(filters = {}) {
  try {
    const catalog = await loadEnemCatalog({ repoRoot: projectRoot });
    const selectedExam = resolveQuestionBankCatalogVestibular(filters.vestibular);
    const selectedSigla = String(selectedExam?.sigla || "").trim().toUpperCase();
    const selectedYear = Number(filters.ano || 0);
    const selectedDay = Number(filters.dia || 0);
    const selectedBooklet = sanitizeQuestionBankBooklet(filters.caderno || "");
    const allItems = Array.isArray(catalog.items) ? catalog.items : [];
    const enemExam = serializeQuestionBankExam(findQuestionBankExamBySiglaStatement.get("ENEM")) || {
      id: 0,
      nome: "ENEM",
      sigla: "ENEM",
      descricao: "Exame Nacional do Ensino Medio",
      ativo: true,
      createdAt: "",
    };

    const filteredItems = allItems.filter((item) => {
      if (selectedSigla && String(item.vestibular || "").trim().toUpperCase() !== selectedSigla) {
        return false;
      }

      if (Number.isInteger(selectedYear) && selectedYear > 0 && Number(item.ano) !== selectedYear) {
        return false;
      }

      if (Number.isInteger(selectedDay) && selectedDay > 0 && Number(item.dia) !== selectedDay) {
        return false;
      }

      if (selectedBooklet && String(item.caderno || "").trim().toUpperCase() !== selectedBooklet) {
        return false;
      }

      return true;
    });

    return {
      available: allItems.length > 0,
      summary: {
        totalSessions: filteredItems.length,
        readySessions: filteredItems.filter((item) => String(item.status || "") === "ok").length,
        reviewSessions: filteredItems.filter((item) => String(item.status || "") === "review").length,
        missingProofSessions: filteredItems.filter((item) => (item.pendencias || []).includes("prova")).length,
        missingAnswerKeySessions: filteredItems.filter((item) => (item.pendencias || []).includes("gabarito")).length,
        sourceSummary: catalog.summary || {},
      },
      reference: {
        vestibulares: [enemExam],
        anos: Array.from(new Set(allItems.map((item) => Number(item.ano) || 0).filter((value) => value > 0))).sort((a, b) => b - a),
        dias: Array.from(new Set(allItems.map((item) => Number(item.dia) || 0).filter((value) => value > 0))).sort((a, b) => a - b),
        cadernos: Array.from(new Set(allItems.map((item) => String(item.caderno || "").trim().toUpperCase()).filter(Boolean))).sort(
          (left, right) => {
            const leftNumber = Number(left.replace(/\D+/g, "")) || 0;
            const rightNumber = Number(right.replace(/\D+/g, "")) || 0;
            return leftNumber - rightNumber;
          }
        ),
      },
      sessions: filteredItems.map((item) => serializeQuestionBankCatalogSession(item)),
      issues: {
        active: catalog.activeReport || {},
        resolved: catalog.resolvedReport || {},
      },
      source: catalog.source || {},
    };
  } catch (error) {
    console.error("Erro ao carregar fallback do catalogo ENEM:", error);

    return {
      available: false,
      summary: {
        totalSessions: 0,
        readySessions: 0,
        reviewSessions: 0,
        missingProofSessions: 0,
        missingAnswerKeySessions: 0,
        sourceSummary: {},
      },
      reference: {
        vestibulares: [],
        anos: [],
        dias: [],
        cadernos: [],
      },
      sessions: [],
      issues: {
        active: {},
        resolved: {},
      },
      source: {},
      error: sanitizePublicErrorMessage(error, "Nao foi possivel carregar o catalogo ENEM."),
    };
  }
}

function buildQuestionBankStudentOverview(userId) {
  const overviewRow = questionBankStudentOverviewStatement.get(userId, userId) || {};
  const totalAvailable = Number(overviewRow.totalAvailable) || 0;
  const answeredQuestions = Number(overviewRow.answeredQuestions) || 0;
  const correctQuestions = Number(overviewRow.correctQuestions) || 0;
  const wrongQuestions = Number(overviewRow.wrongQuestions) || 0;
  const favoriteQuestions = Number(overviewRow.favoriteQuestions) || 0;
  const reviewQuestions = Number(overviewRow.reviewQuestions) || 0;

  return {
    totalAvailable,
    answeredQuestions,
    correctQuestions,
    wrongQuestions,
    favoriteQuestions,
    reviewQuestions,
    accuracyRate: answeredQuestions > 0 ? correctQuestions / answeredQuestions : 0,
    accuracyPercentage: answeredQuestions > 0 ? Math.round((correctQuestions / answeredQuestions) * 100) : 0,
  };
}

function listQuestionAttemptsForAnalytics(userId, limit = 1000) {
  const normalizedLimit = clampInteger(limit, 1, 2000);
  const rows = listQuestionAttemptsForAnalyticsStatement.all(userId, normalizedLimit);

  return rows.map((row) => ({
    id: Number(row.id) || 0,
    questionId: Number(row.questaoId) || 0,
    proofId: Number(row.proofId) || 0,
    questionNumber: Number(row.numero) || 0,
    examName: String(row.vestibularSigla || row.vestibularNome || "Vestibular nao informado"),
    subjectName: String(row.materia || "Materia nao informada"),
    topicName: String(row.tema || ""),
    year: Number(row.ano) || 0,
    isCorrect: Boolean(row.acertou),
    answer: sanitizeQuestionAlternativeLetter(row.respostaMarcada, true),
    timeSpentSeconds: Number(row.tempoGastoSegundos) || 0,
    createdAt: String(row.createdAt || ""),
    proofLabel: [row.vestibularSigla || row.vestibularNome || "", row.ano || ""].filter(Boolean).join(" ").trim(),
  }));
}

function listPublishedQuestionBankQuestions(userId, filters = {}) {
  const conditions = [
    "provas.status = 'published'",
    "questoes.status_revisao = 'approved'",
  ];
  const params = [userId, userId];
  const proofId = Number(filters.proofId || filters.provaId || 0);
  const vestibularId = Number(filters.vestibularId || 0);
  const ano = Number(filters.ano || 0);
  const materia = normalizeQuestionBankTerm(filters.materia || "", 80);
  const dificuldade = sanitizeQuestionDifficulty(filters.dificuldade || "", "");
  const statusFilter = sanitizeQuestionFlagFilter(filters.status || "all");
  const limit = clampInteger(filters.limit || 60, 1, 120);

  if (Number.isInteger(proofId) && proofId > 0) {
    conditions.push("provas.id = ?");
    params.push(proofId);
  }

  if (Number.isInteger(vestibularId) && vestibularId > 0) {
    conditions.push("provas.vestibular_id = ?");
    params.push(vestibularId);
  }

  if (Number.isInteger(ano) && ano > 0) {
    conditions.push("provas.ano = ?");
    params.push(ano);
  }

  if (materia) {
    conditions.push("questoes.materia = ?");
    params.push(materia);
  }

  if (dificuldade) {
    conditions.push("questoes.dificuldade = ?");
    params.push(dificuldade);
  }

  if (statusFilter === "unanswered") {
    conditions.push("latest_attempt.id IS NULL");
  } else if (statusFilter === "wrong") {
    conditions.push("latest_attempt.acertou = 0");
  } else if (statusFilter === "favorites") {
    conditions.push("COALESCE(user_state.is_favorite, 0) = 1");
  } else if (statusFilter === "review") {
    conditions.push("COALESCE(user_state.review_later, 0) = 1");
  }

  const sql = `
    SELECT
      questoes.id,
      questoes.prova_id AS provaId,
      questoes.numero,
      questoes.enunciado,
      questoes.materia,
      questoes.tema,
      questoes.dificuldade,
      questoes.resposta_correta AS respostaCorreta,
      questoes.created_at AS createdAt,
      questoes.updated_at AS updatedAt,
      provas.id AS proofId,
      provas.ano,
      provas.fase,
      provas.versao,
      provas.pdf_file_path AS pdfFilePath,
      provas.pdf_original_name AS pdfOriginalName,
      vestibulares.id AS vestibularId,
      vestibulares.nome AS vestibularNome,
      vestibulares.sigla AS vestibularSigla,
      question_stats.total_respostas AS totalRespostas,
      question_stats.total_acertos AS totalAcertos,
      question_stats.total_erros AS totalErros,
      question_stats.taxa_acerto AS taxaAcerto,
      question_stats.dificuldade_calculada AS dificuldadeCalculada,
      latest_attempt.id AS lastAttemptId,
      latest_attempt.user_id AS lastAttemptUserId,
      latest_attempt.resposta_marcada AS lastRespostaMarcada,
      latest_attempt.acertou AS lastAcertou,
      latest_attempt.tempo_gasto_segundos AS lastTempoGastoSegundos,
      latest_attempt.created_at AS lastAttemptAt,
      COALESCE(user_state.is_favorite, 0) AS isFavorite,
      COALESCE(user_state.review_later, 0) AS reviewLater,
      user_state.updated_at AS userStateUpdatedAt
    FROM questoes
    INNER JOIN provas ON provas.id = questoes.prova_id
    INNER JOIN vestibulares ON vestibulares.id = provas.vestibular_id
    LEFT JOIN question_stats ON question_stats.questao_id = questoes.id
    LEFT JOIN question_user_states AS user_state
      ON user_state.user_id = ? AND user_state.questao_id = questoes.id
    LEFT JOIN question_attempts AS latest_attempt
      ON latest_attempt.id = (
        SELECT qa.id
        FROM question_attempts qa
        WHERE qa.user_id = ? AND qa.questao_id = questoes.id
        ORDER BY qa.created_at DESC, qa.id DESC
        LIMIT 1
      )
    WHERE ${conditions.join(" AND ")}
    ORDER BY
      CASE WHEN latest_attempt.id IS NULL THEN 0 ELSE 1 END ASC,
      provas.ano DESC,
      vestibulares.sigla ASC,
      questoes.numero ASC,
      questoes.id ASC
    LIMIT ?
  `;

  const rows = db.prepare(sql).all(...params, limit);
  return rows.map((row) => serializeStudentQuestionRow(row));
}

function getPublishedQuestionForUser(userId, questionId, options = {}) {
  const row = db.prepare(`
    SELECT
      questoes.id,
      questoes.prova_id AS provaId,
      questoes.numero,
      questoes.enunciado,
      questoes.materia,
      questoes.tema,
      questoes.dificuldade,
      questoes.resposta_correta AS respostaCorreta,
      questoes.created_at AS createdAt,
      questoes.updated_at AS updatedAt,
      provas.id AS proofId,
      provas.ano,
      provas.fase,
      provas.versao,
      provas.pdf_file_path AS pdfFilePath,
      provas.pdf_original_name AS pdfOriginalName,
      vestibulares.id AS vestibularId,
      vestibulares.nome AS vestibularNome,
      vestibulares.sigla AS vestibularSigla,
      question_stats.total_respostas AS totalRespostas,
      question_stats.total_acertos AS totalAcertos,
      question_stats.total_erros AS totalErros,
      question_stats.taxa_acerto AS taxaAcerto,
      question_stats.dificuldade_calculada AS dificuldadeCalculada,
      latest_attempt.id AS lastAttemptId,
      latest_attempt.user_id AS lastAttemptUserId,
      latest_attempt.resposta_marcada AS lastRespostaMarcada,
      latest_attempt.acertou AS lastAcertou,
      latest_attempt.tempo_gasto_segundos AS lastTempoGastoSegundos,
      latest_attempt.created_at AS lastAttemptAt,
      COALESCE(user_state.is_favorite, 0) AS isFavorite,
      COALESCE(user_state.review_later, 0) AS reviewLater,
      user_state.updated_at AS userStateUpdatedAt
    FROM questoes
    INNER JOIN provas ON provas.id = questoes.prova_id
    INNER JOIN vestibulares ON vestibulares.id = provas.vestibular_id
    LEFT JOIN question_stats ON question_stats.questao_id = questoes.id
    LEFT JOIN question_user_states AS user_state
      ON user_state.user_id = ? AND user_state.questao_id = questoes.id
    LEFT JOIN question_attempts AS latest_attempt
      ON latest_attempt.id = (
        SELECT qa.id
        FROM question_attempts qa
        WHERE qa.user_id = ? AND qa.questao_id = questoes.id
        ORDER BY qa.created_at DESC, qa.id DESC
        LIMIT 1
      )
    WHERE questoes.id = ?
      AND provas.status = 'published'
      AND questoes.status_revisao = 'approved'
    LIMIT 1
  `).get(userId, userId, questionId);

  if (!row) {
    return null;
  }

  return serializeStudentQuestionRow(
    row,
    listQuestionAlternativesForQuestionStatement.all(questionId),
    {
      includeFullText: true,
      includeCorrectAnswer: Boolean(options.includeCorrectAnswer),
    }
  );
}

function getRoutineExamTemplates() {
  return Object.entries(ROUTINE_EXAM_METADATA)
    .map(([key, metadata]) => ({
      key,
      label: metadata.label,
      group: metadata.group,
      featured: metadata.featured === true,
      searchTerms: Array.isArray(metadata.searchTerms) ? [...metadata.searchTerms] : [],
      scoreScaleType: getRoutineExamScoreScale(key),
      percentAdjustment: Number(ROUTINE_EXAM_PERCENT_ADJUSTMENTS[key] || 0),
      subjectWeights: {
        ...(ROUTINE_EXAM_WEIGHT_PROFILES[metadata.profile] || ROUTINE_EXAM_WEIGHT_PROFILES.federal_tradicional),
      },
    }))
    .sort((left, right) => {
      if (left.featured !== right.featured) {
        return left.featured ? -1 : 1;
      }

      if (left.group !== right.group) {
        return left.group.localeCompare(right.group, "pt-BR");
      }

      return left.label.localeCompare(right.label, "pt-BR");
    });
}

function getRoutineCourseTemplates() {
  return Object.entries(ROUTINE_COURSE_METADATA)
    .map(([key, metadata]) => ({
      key,
      label: metadata.label,
      group: metadata.group,
      featured: metadata.featured === true,
      recommendedTrackKey: metadata.recommendedTrackKey || "geral",
      recommendedTrackLabel: ROUTINE_TRACK_LABELS[metadata.recommendedTrackKey] || "Geral",
      searchTerms: Array.isArray(metadata.searchTerms) ? [...metadata.searchTerms] : [],
      subjectBoosts: { ...(metadata.subjectBoosts || {}) },
      targetScores: { ...(metadata.targetScores || {}) },
    }))
    .sort((left, right) => {
      if (left.featured !== right.featured) {
        return left.featured ? -1 : 1;
      }

      if (left.group !== right.group) {
        return left.group.localeCompare(right.group, "pt-BR");
      }

      return left.label.localeCompare(right.label, "pt-BR");
    });
}

function getRoutineAdmissionCategoryTemplates() {
  return Object.entries(ROUTINE_ADMISSION_CATEGORY_LABELS).map(([key, label]) => ({
    key,
    label,
    shortLabel: ROUTINE_ADMISSION_CATEGORY_SHORT_LABELS[key] || label,
    detail: ROUTINE_ADMISSION_CATEGORY_DETAILS[key] || "",
  }));
}

function getRoutineTrackTemplates() {
  return Object.entries(ROUTINE_TRACK_LABELS).map(([key, label]) => ({
    key,
    label,
    description: ROUTINE_TRACK_DETAILS[key] || "",
    multipliers: { ...(ROUTINE_TRACK_MULTIPLIERS[key] || {}) },
  }));
}

function getRoutineTemplates() {
  return {
    version: ROUTINE_SUMMARY_VERSION,
    exams: getRoutineExamTemplates(),
    courses: getRoutineCourseTemplates(),
    admissionCategories: getRoutineAdmissionCategoryTemplates(),
    courseTracks: getRoutineTrackTemplates(),
    subjects: ROUTINE_SUBJECT_ORDER.map((subjectKey) => ({
      key: subjectKey,
      label: SUBJECT_LABELS[subjectKey] || subjectKey,
    })),
    manualDeltas: [-2, -1, 0, 1, 2, 3, 4, 5],
    difficultyLevels: [
      { key: "normal", label: "Normal" },
      { key: "atencao", label: "Atenção" },
      { key: "reforco", label: "Reforço" },
    ],
    weekdayLabels: [...ROUTINE_WEEKDAY_LABELS],
  };
}

function getDefaultRoutinePreferences() {
  const studyDays = [...ROUTINE_DEFAULT_STUDY_DAYS];
  const weekdayMinutes = normalizeRoutineWeekdayMinutes({}, studyDays);

  return {
    primaryExamKey: "enem",
    secondaryExamKey: "",
    courseKey: "",
    admissionCategoryKey: "ac",
    courseTrackKey: "geral",
    courseName: "",
    studyDays,
    weekdayMinutes,
    weeklyGoalMinutes: getRoutineWeeklyGoalMinutes(weekdayMinutes),
    subjectPreferences: [],
    updatedAt: "",
  };
}

function sanitizeRoutineSubjectPreferenceEntry(entry) {
  const subjectKey = sanitizeSubjectKey(entry?.subjectKey, DEFAULT_SUBJECT_KEY);
  const customSubjectName = subjectKey === "outras"
    ? sanitizeSubjectName(entry?.customSubjectName ?? entry?.subjectName ?? "", 80)
    : "";
  const manualDelta = sanitizeRoutineManualDelta(entry?.manualDelta);
  const difficultyLevel = sanitizeRoutineDifficultyLevel(entry?.difficultyLevel);

  if (subjectKey === "outras" && !customSubjectName) {
    throw createError(400, "Informe o nome da matéria personalizada da rotina.");
  }

  return {
    subjectKey,
    customSubjectName,
    manualDelta,
    difficultyLevel,
    subjectLabel: getRoutineSubjectLabel(subjectKey, customSubjectName),
  };
}

function normalizeRoutineSubjectPreferences(entries) {
  const rawEntries = Array.isArray(entries) ? entries : [];
  const uniquePreferences = [];
  const seenKeys = new Set();

  rawEntries.forEach((entry) => {
    const normalizedEntry = sanitizeRoutineSubjectPreferenceEntry(entry);
    const preferenceKey = getRoutinePreferenceKey(
      normalizedEntry.subjectKey,
      normalizedEntry.customSubjectName
    );

    if (seenKeys.has(preferenceKey)) {
      return;
    }

    seenKeys.add(preferenceKey);

    if (
      normalizedEntry.manualDelta !== 0 ||
      normalizedEntry.difficultyLevel !== "normal" ||
      normalizedEntry.subjectKey === "outras"
    ) {
      uniquePreferences.push(normalizedEntry);
    }
  });

  return uniquePreferences.sort((left, right) => {
    const leftIndex = ROUTINE_SUBJECT_ORDER.indexOf(left.subjectKey);
    const rightIndex = ROUTINE_SUBJECT_ORDER.indexOf(right.subjectKey);

    if (left.subjectKey !== right.subjectKey) {
      return (leftIndex === -1 ? 999 : leftIndex) - (rightIndex === -1 ? 999 : rightIndex);
    }

    return left.subjectLabel.localeCompare(right.subjectLabel, "pt-BR");
  });
}

function sanitizeRoutinePreferencesPayload(payload, currentPreferences = getDefaultRoutinePreferences()) {
  const rawStudyDays = payload?.studyDays === undefined ? currentPreferences.studyDays : payload.studyDays;
  const nextPrimaryExamKey = sanitizeRoutineExamKey(
    payload?.primaryExamKey === undefined ? currentPreferences.primaryExamKey : payload.primaryExamKey
  );
  const requestedSecondaryExamKey = sanitizeRoutineExamKey(
    payload?.secondaryExamKey === undefined ? currentPreferences.secondaryExamKey : payload.secondaryExamKey,
    true
  );
  const secondaryExamKey = requestedSecondaryExamKey === nextPrimaryExamKey ? "" : requestedSecondaryExamKey;
  const courseKey = sanitizeRoutineCourseKey(
    payload?.courseKey === undefined ? currentPreferences.courseKey : payload.courseKey,
    true
  );
  const admissionCategoryKey = sanitizeRoutineAdmissionCategoryKey(
    payload?.admissionCategoryKey === undefined
      ? currentPreferences.admissionCategoryKey
      : payload.admissionCategoryKey
  );
  const courseTrackKey = sanitizeRoutineTrackKey(
    payload?.courseTrackKey === undefined ? currentPreferences.courseTrackKey : payload.courseTrackKey
  );
  const courseName = sanitizeShortText(
    payload?.courseName === undefined ? currentPreferences.courseName : payload.courseName,
    80
  );
  const studyDays = normalizeRoutineStudyDays(rawStudyDays);
  const weekdayMinutes = normalizeRoutineWeekdayMinutes(
    payload?.weekdayMinutes === undefined ? currentPreferences.weekdayMinutes : payload.weekdayMinutes,
    studyDays
  );
  const weeklyGoalMinutes = getRoutineWeeklyGoalMinutes(
    weekdayMinutes,
    payload?.weeklyGoalMinutes === undefined ? currentPreferences.weeklyGoalMinutes : payload.weeklyGoalMinutes
  );
  const subjectPreferences = normalizeRoutineSubjectPreferences(
    payload?.subjectPreferences === undefined ? currentPreferences.subjectPreferences : payload.subjectPreferences
  );

  if (Array.isArray(rawStudyDays) && !rawStudyDays.length) {
    throw createError(400, "Selecione ao menos um dia de estudo para a rotina.");
  }

  return {
    primaryExamKey: nextPrimaryExamKey,
    secondaryExamKey,
    courseKey,
    admissionCategoryKey,
    courseTrackKey,
    courseName,
    studyDays,
    weekdayMinutes,
    weeklyGoalMinutes,
    subjectPreferences,
  };
}

function sanitizeRoutinePreferencesRow(row, subjectPreferenceRows = []) {
  const defaults = getDefaultRoutinePreferences();

  if (!row) {
    return defaults;
  }

  const studyDays = normalizeRoutineStudyDays(parseStoredJson(row.studyDaysJson, defaults.studyDays));
  const weekdayMinutes = normalizeRoutineWeekdayMinutes(
    parseStoredJson(row.weekdayMinutesJson, defaults.weekdayMinutes),
    studyDays
  );

  return {
    primaryExamKey: sanitizeRoutineExamKey(row.primaryExamKey),
    secondaryExamKey: sanitizeRoutineExamKey(row.secondaryExamKey, true),
    courseKey: sanitizeRoutineCourseKey(row.courseKey, true),
    admissionCategoryKey: sanitizeRoutineAdmissionCategoryKey(row.admissionCategoryKey),
    courseTrackKey: sanitizeRoutineTrackKey(row.courseTrackKey),
    courseName: sanitizeShortText(row.courseName, 80),
    studyDays,
    weekdayMinutes,
    weeklyGoalMinutes: getRoutineWeeklyGoalMinutes(weekdayMinutes, row.weeklyGoalMinutes),
    subjectPreferences: normalizeRoutineSubjectPreferences(subjectPreferenceRows),
    updatedAt: row.updatedAt || "",
  };
}

function getRoutinePreferences(userId) {
  const row = getRoutinePreferencesStatement.get(userId);
  const subjectPreferenceRows = listRoutineSubjectPreferencesStatement.all(userId);
  return sanitizeRoutinePreferencesRow(row, subjectPreferenceRows);
}

function saveRoutinePreferences(userId, payload) {
  const currentPreferences = getRoutinePreferences(userId);
  const nextPreferences = sanitizeRoutinePreferencesPayload(payload, currentPreferences);
  const updatedAt = nowIso();

  withTransaction(() => {
    upsertRoutinePreferencesStatement.run(
      userId,
      nextPreferences.primaryExamKey,
      nextPreferences.secondaryExamKey,
      nextPreferences.courseKey,
      nextPreferences.admissionCategoryKey,
      nextPreferences.courseTrackKey,
      nextPreferences.courseName,
      JSON.stringify(nextPreferences.studyDays),
      JSON.stringify(nextPreferences.weekdayMinutes),
      nextPreferences.weeklyGoalMinutes,
      updatedAt
    );

    deleteRoutineSubjectPreferencesStatement.run(userId);

    nextPreferences.subjectPreferences.forEach((entry) => {
      insertRoutineSubjectPreferenceStatement.run(
        userId,
        entry.subjectKey,
        entry.customSubjectName,
        entry.manualDelta,
        entry.difficultyLevel,
        updatedAt
      );
    });
  });

  return getRoutinePreferences(userId);
}

function getRoutineCustomSubjectSuggestions(userId) {
  const orderedNames = [];
  const seenNames = new Set();

  listStructuredUserSessions(userId)
    .filter((session) => session.subjectKey === "outras" && String(session.customSubjectName || "").trim())
    .forEach((session) => {
      const label = String(session.customSubjectName).trim();
      const key = label.toLowerCase();

      if (!seenNames.has(key)) {
        seenNames.add(key);
        orderedNames.push(label);
      }
    });

  return orderedNames.slice(0, 12);
}

function buildRoutinePreferenceLookup(subjectPreferences = []) {
  const lookup = new Map();

  subjectPreferences.forEach((entry) => {
    lookup.set(getRoutinePreferenceKey(entry.subjectKey, entry.customSubjectName), entry);
  });

  return lookup;
}

function buildRoutineHistoryStats(userId) {
  const thresholdDateKey = toDateKey(addDays(new Date(), -ROUTINE_HISTORY_LOOKBACK_DAYS + 1));
  const minutesBySubject = new Map();
  const weekStartKey = getWeekStartDateKey(new Date());
  const currentWeekMinutesBySubject = new Map();

  listStructuredUserSessions(userId).forEach((session) => {
    const statKey = getRoutinePreferenceKey(session.subjectKey, session.customSubjectName);
    const sessionMinutes = Number(session.minutes) || 0;

    if (session.dateKey >= thresholdDateKey) {
      minutesBySubject.set(statKey, roundToNearestFive((minutesBySubject.get(statKey) || 0) + sessionMinutes));
    }

    if (isDateKeyInRange(session.dateKey, weekStartKey, getWeekEndDateKey(weekStartKey))) {
      currentWeekMinutesBySubject.set(
        statKey,
        roundToNearestFive((currentWeekMinutesBySubject.get(statKey) || 0) + sessionMinutes)
      );
    }
  });

  return {
    minutesBySubject,
    currentWeekMinutesBySubject,
  };
}

function getRoutineCompositeExamWeight(primaryExamKey, secondaryExamKey, subjectKey) {
  const primaryWeight = Number(
    ROUTINE_EXAM_WEIGHT_PROFILES[ROUTINE_EXAM_METADATA[primaryExamKey]?.profile]?.[subjectKey] || 0
  );
  const secondaryWeight = secondaryExamKey
    ? Number(
        ROUTINE_EXAM_WEIGHT_PROFILES[ROUTINE_EXAM_METADATA[secondaryExamKey]?.profile]?.[subjectKey] || 0
      )
    : 0;

  if (!secondaryExamKey) {
    return primaryWeight;
  }

  return (primaryWeight * ROUTINE_PRIMARY_EXAM_WEIGHT) + (secondaryWeight * ROUTINE_SECONDARY_EXAM_WEIGHT);
}

function getRoutineTrackMultiplier(courseTrackKey, subjectKey) {
  return Number(ROUTINE_TRACK_MULTIPLIERS[courseTrackKey]?.[subjectKey] || 1);
}

function buildRoutinePriorityEntries(userId, user, preferences) {
  const preferenceLookup = buildRoutinePreferenceLookup(preferences.subjectPreferences);
  const historyStats = buildRoutineHistoryStats(userId);
  const candidates = [];
  const focusPreferenceKey = getRoutinePreferenceKey(user.focusSubjectKey, user.focusSubjectName);
  const customSubjectPreferences = [...preferences.subjectPreferences.filter((entry) => entry.subjectKey === "outras")];

  if (user.focusSubjectKey === "outras" && user.focusSubjectName) {
    const alreadyTracked = customSubjectPreferences.some((entry) =>
      String(entry.customSubjectName || "").trim().toLowerCase() ===
        String(user.focusSubjectName || "").trim().toLowerCase()
    );

    if (!alreadyTracked) {
      customSubjectPreferences.push({
        subjectKey: "outras",
        customSubjectName: sanitizeSubjectName(user.focusSubjectName, 80),
        manualDelta: 0,
        difficultyLevel: "normal",
        subjectLabel: sanitizeSubjectName(user.focusSubjectName, 80),
      });
    }
  }

  ROUTINE_SUBJECT_ORDER.filter((subjectKey) => subjectKey !== "outras").forEach((subjectKey) => {
    const statKey = getRoutinePreferenceKey(subjectKey);
    const subjectPreference = preferenceLookup.get(statKey) || {
      subjectKey,
      customSubjectName: "",
      manualDelta: 0,
      difficultyLevel: "normal",
      subjectLabel: getRoutineSubjectLabel(subjectKey),
    };
    const baseWeight = getRoutineCompositeExamWeight(
      preferences.primaryExamKey,
      preferences.secondaryExamKey,
      subjectKey
    );
    const isFocusSubject = focusPreferenceKey === statKey;

    if (
      baseWeight <= 0 &&
      subjectPreference.manualDelta === 0 &&
      subjectPreference.difficultyLevel === "normal" &&
      !isFocusSubject
    ) {
      return;
    }

    const manualMultiplier = ROUTINE_MANUAL_DELTA_MULTIPLIERS[String(subjectPreference.manualDelta)] || 1;
    const difficultyMultiplier = ROUTINE_DIFFICULTY_MULTIPLIERS[subjectPreference.difficultyLevel] || 1;
    const trackMultiplier = getRoutineTrackMultiplier(preferences.courseTrackKey, subjectKey);
    const courseMultiplier = getRoutineCourseMultiplier(preferences.courseKey, subjectKey);
    const historyMinutes = Number(historyStats.minutesBySubject.get(statKey) || 0);
    const lowHistoryBoost = historyMinutes < 45 && baseWeight >= 8 ? 1.08 : 1;
    const highHistoryPenalty = historyMinutes > 220 ? 0.94 : 1;
    const focusMultiplier = isFocusSubject ? ROUTINE_PRIORITY_FOCUS_MULTIPLIER : 1;
    const finalWeight = Math.max(
      1.5,
      baseWeight *
        manualMultiplier *
        difficultyMultiplier *
        trackMultiplier *
        courseMultiplier *
        lowHistoryBoost *
        highHistoryPenalty *
        focusMultiplier
    );
    const suggestedReinforcement =
      subjectPreference.difficultyLevel !== "normal" || (historyMinutes < 35 && baseWeight >= 9);

    candidates.push({
      subjectKey,
      customSubjectName: "",
      subjectLabel: getRoutineSubjectLabel(subjectKey),
      preferenceKey: statKey,
      baseWeight,
      finalWeight,
      historyMinutes,
      manualDelta: subjectPreference.manualDelta,
      difficultyLevel: subjectPreference.difficultyLevel,
      courseBoosted: courseMultiplier > 1.04,
      suggestedReinforcement,
      isFocusSubject,
    });
  });

  customSubjectPreferences.forEach((entry) => {
    const statKey = getRoutinePreferenceKey(entry.subjectKey, entry.customSubjectName);
    const historyMinutes = Number(historyStats.minutesBySubject.get(statKey) || 0);
    const baseWeight = Math.max(3, 3 + (entry.manualDelta * 0.8) + (historyMinutes > 0 ? 1 : 0));
    const focusMultiplier = focusPreferenceKey === statKey ? ROUTINE_PRIORITY_FOCUS_MULTIPLIER : 1;

    candidates.push({
      subjectKey: "outras",
      customSubjectName: entry.customSubjectName,
      subjectLabel: entry.subjectLabel,
      preferenceKey: statKey,
      baseWeight,
      finalWeight: Math.max(
        2.5,
        baseWeight *
          (ROUTINE_MANUAL_DELTA_MULTIPLIERS[String(entry.manualDelta)] || 1) *
          (ROUTINE_DIFFICULTY_MULTIPLIERS[entry.difficultyLevel] || 1) *
          focusMultiplier
      ),
      historyMinutes,
      manualDelta: entry.manualDelta,
      difficultyLevel: entry.difficultyLevel,
      courseBoosted: false,
      suggestedReinforcement: entry.difficultyLevel !== "normal" || historyMinutes < 30,
      isFocusSubject: focusPreferenceKey === statKey,
    });
  });

  return candidates.sort((left, right) => {
    if (right.finalWeight !== left.finalWeight) {
      return right.finalWeight - left.finalWeight;
    }

    return left.subjectLabel.localeCompare(right.subjectLabel, "pt-BR");
  });
}

function buildRoutineDaySlots(preferences) {
  return preferences.studyDays.map((dayOfWeek) => {
    const totalMinutes = clampInteger(
      preferences.weekdayMinutes?.[String(dayOfWeek)] || ROUTINE_DEFAULT_WEEKDAY_MINUTES,
      ROUTINE_MIN_DAY_MINUTES,
      ROUTINE_MAX_DAY_MINUTES
    );
    const slots = [];
    const hasSecondarySlot = totalMinutes >= 75;

    if (!hasSecondarySlot) {
      slots.push({
        dayOfWeek,
        slotType: "base",
        plannedMinutes: totalMinutes,
      });
      return { dayOfWeek, totalMinutes, slots };
    }

    const baseMinutes = roundToNearestFive(Math.max(ROUTINE_MIN_BLOCK_MINUTES, totalMinutes * 0.64));
    const secondaryMinutes = totalMinutes - baseMinutes;

    slots.push({
      dayOfWeek,
      slotType: "base",
      plannedMinutes: baseMinutes,
    });

    if (secondaryMinutes >= ROUTINE_MIN_BLOCK_MINUTES) {
      slots.push({
        dayOfWeek,
        slotType: "reforco",
        plannedMinutes: secondaryMinutes,
      });
    }

    return { dayOfWeek, totalMinutes, slots };
  });
}

function buildRoutineSubjectTargets(priorityEntries, totalMinutes) {
  const safeTotalMinutes = Math.max(ROUTINE_MIN_TOTAL_WEEKLY_MINUTES, roundToNearestFive(totalMinutes));
  const totalWeight = priorityEntries.reduce((total, entry) => total + entry.finalWeight, 0) || 1;
  let allocatedMinutes = 0;

  return priorityEntries.map((entry, index) => {
    const isLastEntry = index === priorityEntries.length - 1;
    const proportionalMinutes = isLastEntry
      ? Math.max(0, safeTotalMinutes - allocatedMinutes)
      : Math.max(0, roundToNearestFive((entry.finalWeight / totalWeight) * safeTotalMinutes));

    allocatedMinutes += proportionalMinutes;

    return {
      ...entry,
      targetMinutes: proportionalMinutes,
    };
  });
}

function chooseRoutineSubjectForSlot(priorityEntries, remainingMinutesMap, context = {}) {
  const {
    slotType = "base",
    lastBasePreferenceKey = "",
    currentDayBasePreferenceKey = "",
    reinforcementOutstanding = new Set(),
  } = context;

  return [...priorityEntries]
    .map((entry) => {
      let score = Number(remainingMinutesMap.get(entry.preferenceKey) || entry.targetMinutes || 0) + (entry.finalWeight * 4);

      if (slotType === "base" && entry.preferenceKey === lastBasePreferenceKey) {
        score -= 35;
      }

      if (slotType === "reforco" && entry.preferenceKey === currentDayBasePreferenceKey) {
        score -= 14;
      }

      if (slotType === "reforco" && entry.difficultyLevel === "reforco") {
        score += 28;
      }

      if (slotType === "reforco" && reinforcementOutstanding.has(entry.preferenceKey)) {
        score += 24;
      }

      if (entry.suggestedReinforcement && slotType === "reforco") {
        score += 12;
      }

      return {
        entry,
        score,
      };
    })
    .sort((left, right) => right.score - left.score)[0]?.entry || priorityEntries[0] || null;
}

function buildRoutineReasonLabel(entry, slotType, primaryExamKey) {
  if (slotType === "reforco" && entry.difficultyLevel === "reforco") {
    return "Reforço da matéria mais difícil";
  }

  if (slotType === "reforco" && entry.suggestedReinforcement) {
    return "Reforço sugerido pelo histórico";
  }

  if (entry.manualDelta > 0) {
    return "Ajuste manual de prioridade";
  }

  if (entry.isFocusSubject) {
    return "Matéria foco da sua conta";
  }

  if (entry.courseBoosted) {
    return "Materia puxada pelo curso escolhido";
  }

  return `Peso de ${ROUTINE_EXAM_LABELS[primaryExamKey] || "prova principal"}`;
}

function createRoutineWeekPlanItems(userId, user, preferences, weekStartKey) {
  const daySlots = buildRoutineDaySlots(preferences);
  const totalPlannedMinutes = daySlots.reduce((total, day) => total + day.totalMinutes, 0);
  const priorityEntries = buildRoutineSubjectTargets(
    buildRoutinePriorityEntries(userId, user, preferences),
    totalPlannedMinutes
  );
  const remainingMinutesMap = new Map(
    priorityEntries.map((entry) => [entry.preferenceKey, entry.targetMinutes])
  );
  const reinforcementOutstanding = new Set(
    priorityEntries
      .filter((entry) => entry.difficultyLevel === "reforco")
      .map((entry) => entry.preferenceKey)
  );
  const items = [];
  let lastBasePreferenceKey = "";

  daySlots.forEach((day) => {
    let currentDayBasePreferenceKey = "";

    day.slots.forEach((slot, slotIndex) => {
      const selectedEntry = chooseRoutineSubjectForSlot(priorityEntries, remainingMinutesMap, {
        slotType: slot.slotType,
        lastBasePreferenceKey,
        currentDayBasePreferenceKey,
        reinforcementOutstanding,
      });

      if (!selectedEntry) {
        return;
      }

      if (slotIndex === 0) {
        currentDayBasePreferenceKey = selectedEntry.preferenceKey;
        lastBasePreferenceKey = selectedEntry.preferenceKey;
      }

      const remainingMinutes = Number(remainingMinutesMap.get(selectedEntry.preferenceKey) || 0);
      remainingMinutesMap.set(
        selectedEntry.preferenceKey,
        Math.max(0, remainingMinutes - slot.plannedMinutes)
      );

      if (slot.slotType === "reforco" && selectedEntry.difficultyLevel === "reforco") {
        reinforcementOutstanding.delete(selectedEntry.preferenceKey);
      }

      items.push({
        dayOfWeek: day.dayOfWeek,
        subjectKey: selectedEntry.subjectKey,
        customSubjectName: selectedEntry.customSubjectName,
        plannedMinutes: slot.plannedMinutes,
        slotType: slot.slotType,
        reasonLabel: buildRoutineReasonLabel(selectedEntry, slot.slotType, preferences.primaryExamKey),
      });
    });
  });

  return {
    items,
    priorityEntries,
    totalPlannedMinutes,
  };
}

function saveRoutineWeekPlan(userId, weekStartKey, generationSource, items) {
  const generatedAt = nowIso();

  return withTransaction(() => {
    const existingPlan = getRoutineWeekPlanStatement.get(userId, weekStartKey);
    let planId = Number(existingPlan?.id || 0);

    if (planId > 0) {
      updateRoutineWeekPlanStatement.run(
        JSON.stringify(generationSource),
        generatedAt,
        planId,
        userId
      );
    } else {
      const insertResult = insertRoutineWeekPlanStatement.run(
        userId,
        weekStartKey,
        JSON.stringify(generationSource),
        generatedAt
      );
      planId = Number(insertResult.lastInsertRowid);
    }

    deleteRoutineWeekPlanItemsStatement.run(planId);

    items.forEach((item) => {
      insertRoutineWeekPlanItemStatement.run(
        planId,
        item.dayOfWeek,
        item.subjectKey,
        item.customSubjectName,
        clampInteger(item.plannedMinutes, ROUTINE_MIN_BLOCK_MINUTES, ROUTINE_MAX_DAY_MINUTES),
        item.slotType === "reforco" ? "reforco" : "base",
        sanitizeShortText(item.reasonLabel, 120)
      );
    });

    return planId;
  });
}

function sanitizeRoutinePlanItemRow(row) {
  const subjectKey = sanitizeSubjectKey(row.subjectKey, DEFAULT_SUBJECT_KEY);
  const customSubjectName = subjectKey === "outras" ? sanitizeSubjectName(row.customSubjectName, 80) : "";

  return {
    id: Number(row.id),
    planId: Number(row.planId),
    dayOfWeek: clampInteger(row.dayOfWeek, 0, 6),
    subjectKey,
    customSubjectName,
    subjectLabel: getRoutineSubjectLabel(subjectKey, customSubjectName),
    plannedMinutes: clampInteger(row.plannedMinutes, 0, ROUTINE_MAX_DAY_MINUTES),
    slotType: row.slotType === "reforco" ? "reforco" : "base",
    reasonLabel: sanitizeShortText(row.reasonLabel, 120),
  };
}

function getRoutinePlanRecord(userId, weekStartKey) {
  const planRow = getRoutineWeekPlanStatement.get(userId, weekStartKey);

  if (!planRow) {
    return null;
  }

  return {
    id: Number(planRow.id),
    userId: Number(planRow.userId),
    weekStart: planRow.weekStart,
    generationSource: parseStoredJson(planRow.generationSourceJson, {}),
    generatedAt: planRow.generatedAt,
    items: listRoutineWeekPlanItemsStatement.all(planRow.id).map((row) => sanitizeRoutinePlanItemRow(row)),
  };
}

function buildRoutineActualStats(userId, weekStartKey) {
  const weekStartDate = parseDateKey(weekStartKey);
  const weekEndKey = getWeekEndDateKey(weekStartKey);
  const actualByDay = new Map();
  const actualBySubject = new Map();
  const actualByDaySubject = new Map();
  const sessions = listStructuredUserSessions(userId).filter((session) =>
    isDateKeyInRange(session.dateKey, weekStartKey, weekEndKey)
  );

  sessions.forEach((session) => {
    const sessionDate = parseDateKey(session.dateKey);

    if (!weekStartDate || !sessionDate) {
      return;
    }

    const dayOfWeek = Math.round((sessionDate.getTime() - weekStartDate.getTime()) / 86_400_000);

    if (dayOfWeek < 0 || dayOfWeek > 6) {
      return;
    }

    const subjectKey = getRoutinePreferenceKey(session.subjectKey, session.customSubjectName);
    const subjectDayKey = `${dayOfWeek}:${subjectKey}`;
    const sessionMinutes = roundToNearestFive(Number(session.minutes) || 0);

    actualByDay.set(dayOfWeek, roundToNearestFive((actualByDay.get(dayOfWeek) || 0) + sessionMinutes));
    actualBySubject.set(
      subjectKey,
      roundToNearestFive((actualBySubject.get(subjectKey) || 0) + sessionMinutes)
    );
    actualByDaySubject.set(
      subjectDayKey,
      roundToNearestFive((actualByDaySubject.get(subjectDayKey) || 0) + sessionMinutes)
    );
  });

  return {
    sessions,
    actualByDay,
    actualBySubject,
    actualByDaySubject,
  };
}

function buildRoutinePrioritySummary(priorityEntries = [], preferences = {}) {
  const lead = priorityEntries[0];
  const reinforcementLead = priorityEntries.find(
    (entry) => entry.difficultyLevel === "reforco" || entry.suggestedReinforcement
  );
  const courseLabel = getRoutineCourseLabel(preferences.courseKey, preferences.courseName);

  if (!lead) {
    return "Defina seus dias e gere a rotina para ver a prioridade da semana.";
  }

  if (reinforcementLead) {
    return courseLabel
      ? `${lead.subjectLabel} lidera a semana para ${courseLabel}. ${reinforcementLead.subjectLabel} entra com reforço extra.`
      : `${lead.subjectLabel} lidera a semana. ${reinforcementLead.subjectLabel} entra com reforço extra.`;
  }

  return courseLabel
    ? `${lead.subjectLabel} lidera a semana para ${courseLabel}, com base no vestibular e no curso escolhido.`
    : `${lead.subjectLabel} lidera a semana com base no vestibular e no seu ajuste atual.`;
}

function buildRoutineWeekPlanResponse(userId, user, preferences, planRecord) {
  if (!planRecord) {
    return null;
  }

  const actualStats = buildRoutineActualStats(userId, planRecord.weekStart);
  const weekEnd = getWeekEndDateKey(planRecord.weekStart);
  const snapshotStudyDays = Array.isArray(planRecord.generationSource?.studyDays)
    ? normalizeRoutineStudyDays(planRecord.generationSource.studyDays)
    : preferences.studyDays;
  const snapshotWeeklyGoalMinutes = Number(planRecord.generationSource?.weeklyGoalMinutes || preferences.weeklyGoalMinutes);
  const subjectTotalsMap = new Map();
  const planItemsByDay = new Map();

  planRecord.items.forEach((item) => {
    if (!planItemsByDay.has(item.dayOfWeek)) {
      planItemsByDay.set(item.dayOfWeek, []);
    }

    const actualMinutes = Number(
      actualStats.actualByDaySubject.get(
        `${item.dayOfWeek}:${getRoutinePreferenceKey(item.subjectKey, item.customSubjectName)}`
      ) || 0
    );

    const enrichedItem = {
      ...item,
      actualMinutes,
      executionPercent: item.plannedMinutes > 0
        ? Math.round((actualMinutes / item.plannedMinutes) * 100)
        : 0,
    };

    planItemsByDay.get(item.dayOfWeek).push(enrichedItem);

    const totalKey = getRoutinePreferenceKey(item.subjectKey, item.customSubjectName);
    const currentTotal = subjectTotalsMap.get(totalKey) || {
      subjectKey: item.subjectKey,
      customSubjectName: item.customSubjectName,
      subjectLabel: item.subjectLabel,
      plannedMinutes: 0,
    };

    currentTotal.plannedMinutes += item.plannedMinutes;
    subjectTotalsMap.set(totalKey, currentTotal);
  });

  const subjectTotals = [...subjectTotalsMap.entries()]
    .map(([statKey, total]) => {
      const actualMinutes = Number(actualStats.actualBySubject.get(statKey) || 0);

      return {
        ...total,
        actualMinutes,
        executionPercent: total.plannedMinutes > 0
          ? Math.round((actualMinutes / total.plannedMinutes) * 100)
          : 0,
      };
    })
    .sort((left, right) => right.plannedMinutes - left.plannedMinutes);

  const days = ROUTINE_WEEKDAY_LABELS.map((label, dayOfWeek) => {
    const items = planItemsByDay.get(dayOfWeek) || [];
    const plannedMinutes = items.reduce((total, item) => total + item.plannedMinutes, 0);
    const actualMinutes = Number(actualStats.actualByDay.get(dayOfWeek) || 0);

    return {
      dayOfWeek,
      label,
      isActive: snapshotStudyDays.includes(dayOfWeek),
      plannedMinutes,
      actualMinutes,
      executionPercent: plannedMinutes > 0 ? Math.round((actualMinutes / plannedMinutes) * 100) : 0,
      items,
    };
  });

  const totalPlannedMinutes = days.reduce((total, day) => total + day.plannedMinutes, 0);
  const totalActualMinutes = days.reduce((total, day) => total + day.actualMinutes, 0);
  const reinforcementSubjects = subjectTotals.filter((entry) => {
    const preferenceKey = getRoutinePreferenceKey(entry.subjectKey, entry.customSubjectName);
    const matchedPriorityEntry = (planRecord.generationSource?.priorityEntries || []).find(
      (priorityEntry) => priorityEntry.preferenceKey === preferenceKey
    );

    return matchedPriorityEntry?.difficultyLevel === "reforco" || matchedPriorityEntry?.suggestedReinforcement;
  });
  const nextPriority = [...subjectTotals]
    .sort((left, right) => (right.plannedMinutes - right.actualMinutes) - (left.plannedMinutes - left.actualMinutes))[0] || null;

  return {
    weekStart: planRecord.weekStart,
    weekEnd,
    generatedAt: planRecord.generatedAt,
    metadata: {
      primaryExamKey: String(planRecord.generationSource?.primaryExamKey || preferences.primaryExamKey || "enem"),
      secondaryExamKey: String(planRecord.generationSource?.secondaryExamKey || preferences.secondaryExamKey || ""),
      courseKey: String(planRecord.generationSource?.courseKey || preferences.courseKey || ""),
      admissionCategoryKey: String(
        planRecord.generationSource?.admissionCategoryKey || preferences.admissionCategoryKey || "ac"
      ),
      courseTrackKey: String(planRecord.generationSource?.courseTrackKey || preferences.courseTrackKey || "geral"),
      courseName: String(planRecord.generationSource?.courseName || preferences.courseName || ""),
      weeklyGoalMinutes: snapshotWeeklyGoalMinutes,
    },
    summaryText:
      String(planRecord.generationSource?.summaryText || "").trim() ||
      buildRoutinePrioritySummary(planRecord.generationSource?.priorityEntries || [], {
        courseKey: String(planRecord.generationSource?.courseKey || preferences.courseKey || ""),
        courseName: String(planRecord.generationSource?.courseName || preferences.courseName || ""),
      }),
    totalPlannedMinutes,
    totalActualMinutes,
    executionPercent: totalPlannedMinutes > 0
      ? Math.round((totalActualMinutes / totalPlannedMinutes) * 100)
      : 0,
    nextPriority,
    reinforcementSubjects,
    totalsBySubject: subjectTotals,
    days,
    generationSource: planRecord.generationSource,
    customSubjectSuggestions: getRoutineCustomSubjectSuggestions(userId),
    focusSubjectLabel: getRoutineSubjectLabel(user.focusSubjectKey, user.focusSubjectName),
    courseTarget: buildRoutineCourseTarget({
      primaryExamKey: String(planRecord.generationSource?.primaryExamKey || preferences.primaryExamKey || "enem"),
      courseKey: String(planRecord.generationSource?.courseKey || preferences.courseKey || ""),
      courseName: String(planRecord.generationSource?.courseName || preferences.courseName || ""),
      admissionCategoryKey: String(
        planRecord.generationSource?.admissionCategoryKey || preferences.admissionCategoryKey || "ac"
      ),
    }),
  };
}

function generateRoutinePlan(userId) {
  const user = sanitizeUser(findUserByIdStatement.get(userId));

  if (!user) {
    throw createError(404, "Usuário não encontrado.");
  }

  const preferences = getRoutinePreferences(userId);
  const weekStartKey = getWeekStartDateKey(new Date());
  const generation = createRoutineWeekPlanItems(userId, user, preferences, weekStartKey);
  const generationSource = {
    version: ROUTINE_SUMMARY_VERSION,
    primaryExamKey: preferences.primaryExamKey,
    secondaryExamKey: preferences.secondaryExamKey,
    courseKey: preferences.courseKey,
    admissionCategoryKey: preferences.admissionCategoryKey,
    courseTrackKey: preferences.courseTrackKey,
    courseName: preferences.courseName,
    studyDays: [...preferences.studyDays],
    weekdayMinutes: { ...preferences.weekdayMinutes },
    weeklyGoalMinutes: preferences.weeklyGoalMinutes,
    priorityEntries: generation.priorityEntries.map((entry) => ({
      preferenceKey: entry.preferenceKey,
      subjectKey: entry.subjectKey,
      customSubjectName: entry.customSubjectName,
      subjectLabel: entry.subjectLabel,
      finalWeight: Math.round(entry.finalWeight * 100) / 100,
      baseWeight: Math.round(entry.baseWeight * 100) / 100,
      manualDelta: entry.manualDelta,
      difficultyLevel: entry.difficultyLevel,
      suggestedReinforcement: entry.suggestedReinforcement,
      historyMinutes: entry.historyMinutes,
      courseBoosted: entry.courseBoosted,
      isFocusSubject: entry.isFocusSubject,
    })),
    summaryText: buildRoutinePrioritySummary(generation.priorityEntries, preferences),
    courseTarget: buildRoutineCourseTarget(preferences),
  };

  saveRoutineWeekPlan(userId, weekStartKey, generationSource, generation.items);
  const planRecord = getRoutinePlanRecord(userId, weekStartKey);

  return buildRoutineWeekPlanResponse(userId, user, preferences, planRecord);
}

function getRoutinePlanResponse(userId, weekStartKey) {
  const user = sanitizeUser(findUserByIdStatement.get(userId));

  if (!user) {
    throw createError(404, "Usuário não encontrado.");
  }

  const planRecord = getRoutinePlanRecord(userId, weekStartKey);

  if (!planRecord) {
    return null;
  }

  return buildRoutineWeekPlanResponse(userId, user, getRoutinePreferences(userId), planRecord);
}

function sanitizeEssayFeedbackText(value, maxLength = 420) {
  return String(value || "").trim().replace(/\s+/g, " ").slice(0, maxLength);
}

function extractErrorMessage(error) {
  if (typeof error === "string") {
    return error;
  }

  return [
    error?.response?.error?.message,
    error?.error?.message,
    error?.cause?.message,
    error?.message,
  ].find((value) => typeof value === "string" && value.trim()) || "";
}

function isLikelyPromptLeakMessage(message) {
  const normalizedMessage = sanitizeEssayFeedbackText(message, 1200);

  if (!normalizedMessage) {
    return false;
  }

  return (
    /you are amp|you are devin|you are kiro|you are cascade|you are qoder|you are notion ai|you are antigravity|you are a claude agent|you are an interactive cli tool|you are a web automation assistant|you are an expert ai programming assistant|you are an ai programming assistant|the assistant is claude|claude code version|github copilot|follow microsoft content policies|when asked for your name, you must respond with|working with a user in the vs code editor|managed by an autonomous process|lastinference|debugparamsused|amp thread url|input_schema|tools available in jsonschema|turn_answer_start|tabs_context|copilot_cache_control|workspacefolder path=|notion-flavored markdown|notion has the following main concepts|<claude_behavior>|<artifact_instructions>|<mandatory_copyright_requirements>|<critical_injection_defense>|<tooluseinstructions>|<applypatchinstructions>|<notebookinstructions>|<outputformatting>|<reminderinstructions>|<environment_info>|<workspace_info>|<userrequest>|<recently_viewed_code_snippets>|<tool calling spec>|<\|code_to_edit\|>|working directory|directory listing/i.test(
      normalizedMessage
    ) ||
    (
      normalizedMessage.length > 220 &&
      (
        /\bsystem prompt\b|\bsystem:\b|\btools:\b|\bthinking:\b|\bcache_control:\b|\bstream:\s*true\b|\bcurrent date is\b/i.test(
          normalizedMessage
        ) ||
        /"name"\s*:\s*"computer"|"name"\s*:\s*"web_search"|"name"\s*:\s*"Task"/i.test(
          normalizedMessage
        )
      )
    )
  );
}

function sanitizePublicErrorMessage(error, fallbackMessage = "Nao foi possivel concluir a requisicao.") {
  const normalizedMessage = sanitizeEssayFeedbackText(extractErrorMessage(error), 520);
  const safeFallback =
    sanitizeEssayFeedbackText(fallbackMessage, 240) || "Nao foi possivel concluir a requisicao.";

  if (!normalizedMessage) {
    return safeFallback;
  }

  if (isLikelyPromptLeakMessage(normalizedMessage)) {
    return safeFallback;
  }

  return sanitizeEssayFeedbackText(normalizedMessage, 240) || safeFallback;
}

function normalizeEssayServiceError(error) {
  if (!error) {
    return createError(502, "Nao foi possivel corrigir a redacao com IA.");
  }

  const statusCode =
    Number.isInteger(error?.statusCode) && error.statusCode >= 400
      ? error.statusCode
      : Number.isInteger(error?.status) && error.status >= 400
        ? error.status
        : 502;

  const normalizedMessage = sanitizeEssayFeedbackText(extractErrorMessage(error), 520);
  const leakLikeMessage = isLikelyPromptLeakMessage(normalizedMessage);

  let safeMessage = normalizedMessage;

  if (leakLikeMessage) {
    safeMessage = "A IA retornou um erro invalido ao corrigir a redacao. Tente novamente em instantes.";
  } else if (/quota|billing|rate limit|too many requests|429/i.test(normalizedMessage)) {
    safeMessage = "A IA atingiu o limite do provedor. Tente novamente em instantes.";
  } else if (
    /openai_api_key|openai_model|api key|incorrect api key|invalid api key|authentication|unauthorized|forbidden/i.test(
      normalizedMessage
    )
  ) {
    safeMessage = "A configuracao da IA precisa ser revisada antes de corrigir a redacao.";
  } else if (/json schema|json valido|conteudo valido|structured output|schema/i.test(normalizedMessage)) {
    safeMessage = "A IA retornou uma resposta incompatível com a correção da redação.";
  }

  const safeError = createError(
    statusCode,
    sanitizeEssayFeedbackText(safeMessage, 240) || "Nao foi possivel corrigir a redacao com IA."
  );
  safeError.originalMessage = normalizedMessage;
  return safeError;
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
      technicalJustification:
        sanitizeEssayFeedbackText(rawCompetency.technicalJustification, 620) || justification,
      technicalImprovement:
        sanitizeEssayFeedbackText(rawCompetency.technicalImprovement, 420) || improvement,
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
    diagnosticMessages: sanitizeEssayFeedbackList(rawEvaluation.diagnosticMessages, 8, 220),
    criticalAlerts: sanitizeEssayFeedbackList(rawEvaluation.criticalAlerts, 6, 220),
    profileLabel: sanitizeEssayFeedbackText(rawEvaluation.profileLabel, 60),
    confidenceLevel: sanitizeEssayFeedbackText(rawEvaluation.confidenceLevel, 40).toLowerCase(),
    confidenceNote: sanitizeEssayFeedbackText(rawEvaluation.confidenceNote, 240),
    themeStatus: sanitizeEssayFeedbackText(rawEvaluation.themeStatus, 80),
    evidenceMap: {
      thesis: sanitizeEssayFeedbackText(rawEvaluation?.evidenceMap?.thesis, 220),
      repertoire: sanitizeEssayFeedbackText(rawEvaluation?.evidenceMap?.repertoire, 220),
      cohesion: sanitizeEssayFeedbackText(rawEvaluation?.evidenceMap?.cohesion, 220),
      intervention: sanitizeEssayFeedbackText(rawEvaluation?.evidenceMap?.intervention, 220),
      problemExcerpt: sanitizeEssayFeedbackText(rawEvaluation?.evidenceMap?.problemExcerpt, 220),
    },
    calibrationMeta: {
      enabled: Boolean(rawEvaluation?.calibrationMeta?.enabled),
      recommendedHumanReview: Boolean(rawEvaluation?.calibrationMeta?.recommendedHumanReview),
      scoreProfile: sanitizeEssayFeedbackText(rawEvaluation?.calibrationMeta?.scoreProfile, 120),
      checkpoints: sanitizeEssayFeedbackList(rawEvaluation?.calibrationMeta?.checkpoints, 8, 180),
    },
    preAnalysis: {
      primaryLanguage: sanitizeEssayFeedbackText(rawEvaluation?.preAnalysis?.primaryLanguage, 40),
      dissertativeCompatible: Boolean(rawEvaluation?.preAnalysis?.dissertativeCompatible),
      incompleteText: Boolean(rawEvaluation?.preAnalysis?.incompleteText),
      looseSentences: Boolean(rawEvaluation?.preAnalysis?.looseSentences),
      missingParagraphing: Boolean(rawEvaluation?.preAnalysis?.missingParagraphing),
      listLike: Boolean(rawEvaluation?.preAnalysis?.listLike),
      noteLike: Boolean(rawEvaluation?.preAnalysis?.noteLike),
      poemLike: Boolean(rawEvaluation?.preAnalysis?.poemLike),
      narrativeLike: Boolean(rawEvaluation?.preAnalysis?.narrativeLike),
      messages: sanitizeEssayFeedbackList(rawEvaluation?.preAnalysis?.messages, 8, 180),
    },
    introductionDiagnosis: sanitizeEssayFeedbackList(rawEvaluation.introductionDiagnosis, 6, 200),
    conclusionDiagnosis: sanitizeEssayFeedbackList(rawEvaluation.conclusionDiagnosis, 6, 200),
    riskNotes: sanitizeEssayFeedbackList(rawEvaluation.riskNotes, 8, 220),
    ceilingAnalysis: {
      currentCeiling: clampInteger(rawEvaluation?.ceilingAnalysis?.currentCeiling, 0, 1000),
      explanation: sanitizeEssayFeedbackText(rawEvaluation?.ceilingAnalysis?.explanation, 260),
      bandReadings: sanitizeEssayFeedbackList(rawEvaluation?.ceilingAnalysis?.bandReadings, 4, 220),
      locks: sanitizeEssayFeedbackList(rawEvaluation?.ceilingAnalysis?.locks, 8, 180),
    },
    improvementLadder: {
      quickFixes: sanitizeEssayFeedbackList(rawEvaluation?.improvementLadder?.quickFixes, 5, 180),
      competenceImprovements: sanitizeEssayFeedbackList(rawEvaluation?.improvementLadder?.competenceImprovements, 5, 200),
      bandLeapSteps: sanitizeEssayFeedbackList(rawEvaluation?.improvementLadder?.bandLeapSteps, 5, 220),
    },
    feedbackModes: {
      studentSummary: sanitizeEssayFeedbackText(rawEvaluation?.feedbackModes?.studentSummary, 320),
      technicalSummary: sanitizeEssayFeedbackText(rawEvaluation?.feedbackModes?.technicalSummary, 480),
    },
    rewritingGuidance: {
      introduction: sanitizeEssayFeedbackText(rawEvaluation?.rewritingGuidance?.introduction, 220),
      topicSentence: sanitizeEssayFeedbackText(rawEvaluation?.rewritingGuidance?.topicSentence, 220),
      repertoire: sanitizeEssayFeedbackText(rawEvaluation?.rewritingGuidance?.repertoire, 220),
      argumentativeLink: sanitizeEssayFeedbackText(rawEvaluation?.rewritingGuidance?.argumentativeLink, 220),
      intervention: sanitizeEssayFeedbackText(rawEvaluation?.rewritingGuidance?.intervention, 220),
    },
    auditTrail: {
      rubricVersion: sanitizeEssayFeedbackText(rawEvaluation?.auditTrail?.rubricVersion, 80),
      promptVersion: sanitizeEssayFeedbackText(rawEvaluation?.auditTrail?.promptVersion, 80),
      rulesApplied: sanitizeEssayFeedbackList(rawEvaluation?.auditTrail?.rulesApplied, 16, 160),
      locksTriggered: sanitizeEssayFeedbackList(rawEvaluation?.auditTrail?.locksTriggered, 12, 180),
      evidenceUsed: sanitizeEssayFeedbackList(rawEvaluation?.auditTrail?.evidenceUsed, 10, 180),
    },
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
  return clampInteger(Math.round((Number(value) || 0) / 40) * 40, 0, 200);
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

function getEssayMarkerFrequencyMetrics(text, markers) {
  const normalizedText = normalizeEssayAnalysisText(text);
  const counts = new Map();
  let total = 0;

  markers.forEach((marker) => {
    const normalizedMarker = normalizeEssayAnalysisText(marker);

    if (!normalizedMarker) {
      return;
    }

    const matches = normalizedText.match(
      new RegExp(`(^|\\s)${escapeRegExp(normalizedMarker)}(?=\\s|$)`, "gu")
    );
    const count = Array.isArray(matches) ? matches.length : 0;

    if (count > 0) {
      counts.set(marker, count);
      total += count;
    }
  });

  const repeated = [...counts.entries()].filter(([, count]) => count >= 2);

  return {
    total,
    unique: counts.size,
    counts,
    repeated,
    highestCount: repeated.length ? Math.max(...repeated.map(([, count]) => count)) : 0,
    dominantMarker: repeated.length
      ? repeated.sort((left, right) => right[1] - left[1])[0][0]
      : [...counts.keys()][0] || "",
  };
}

function getEssayTopWordFrequency(text, limit = 6, excludedWords = []) {
  const excluded = new Set(excludedWords.map((item) => normalizeEssayAnalysisText(item)));
  const counts = new Map();

  getEssaySignificantWords(text, 4).forEach((word) => {
    if (!excluded.has(word)) {
      counts.set(word, (counts.get(word) || 0) + 1);
    }
  });

  return [...counts.entries()]
    .sort((left, right) => right[1] - left[1] || left[0].localeCompare(right[0]))
    .slice(0, limit)
    .map(([word]) => word);
}

function getEssayJaccardSimilarity(leftText, rightText) {
  const leftWords = new Set(getEssaySignificantWords(leftText, 4));
  const rightWords = new Set(getEssaySignificantWords(rightText, 4));

  if (!leftWords.size || !rightWords.size) {
    return 0;
  }

  let intersection = 0;

  leftWords.forEach((word) => {
    if (rightWords.has(word)) {
      intersection += 1;
    }
  });

  return intersection / new Set([...leftWords, ...rightWords]).size;
}

function buildEssayExcerpt(value, maxLength = 220) {
  const excerpt = sanitizeEssayFeedbackText(value, maxLength + 6);

  if (excerpt.length <= maxLength) {
    return excerpt;
  }

  return `${excerpt.slice(0, maxLength - 3).trim()}...`;
}

function getEssayBestSentenceByMatches(sentences, terms, options = {}) {
  const candidateTerms = Array.isArray(terms) ? terms.filter(Boolean) : [];
  let bestSentence = "";
  let bestScore = 0;

  sentences.forEach((sentence) => {
    const matchScore = countEssayAnalysisMatches(sentence, candidateTerms);
    const wordBonus = Math.min(6, countWords(sentence) / 12);
    const score = matchScore * 10 + wordBonus;

    if (
      score > bestScore ||
      (score === bestScore && countWords(sentence) > countWords(bestSentence))
    ) {
      bestSentence = sentence;
      bestScore = score;
    }
  });

  if (!bestSentence && options.fallbackToFirst && sentences[0]) {
    bestSentence = sentences[0];
  }

  return buildEssayExcerpt(bestSentence, options.maxLength || 220);
}

function getEssayCopyMetrics(essayText, sourceText) {
  const essayNormalized = normalizeEssayAnalysisText(essayText);
  const sourceWords = getEssaySignificantWords(sourceText, 4);

  if (sourceWords.length < 4 || !essayNormalized) {
    return {
      totalMatches: 0,
      ratio: 0,
      fragments: [],
      excerpt: "",
      excessive: false,
      copiedWordCount: 0,
    };
  }

  const fragments = [];
  const ngramSet = new Set();

  for (let index = 0; index <= sourceWords.length - 4; index += 1) {
    ngramSet.add(sourceWords.slice(index, index + 4).join(" "));
  }

  ngramSet.forEach((fragment) => {
    if (essayNormalized.includes(fragment)) {
      fragments.push(fragment);
    }
  });

  const ratio = ngramSet.size ? fragments.length / ngramSet.size : 0;

  return {
    totalMatches: fragments.length,
    ratio,
    fragments,
    excerpt: buildEssayExcerpt(fragments[0] || "", 180),
    excessive: fragments.length >= 2 || ratio >= 0.35,
    copiedWordCount: Math.min(
      countWords(essayText),
      new Set(fragments.flatMap((fragment) => fragment.split(/\s+/g))).size
    ),
  };
}

function getEssayDisconnectedParagraphMetrics(paragraphs, themeKeywords) {
  const items = paragraphs
    .map((paragraph, index) => {
      const restText = paragraphs.filter((_, innerIndex) => innerIndex !== index).join(" ");

      return {
        paragraph,
        index,
        wordCount: countWords(paragraph),
        themeHits: countEssayAnalysisMatches(paragraph, themeKeywords),
        similarityToRest: getEssayJaccardSimilarity(paragraph, restText),
        argumentSignals:
          countEssayAnalysisMatches(paragraph, ESSAY_LOCAL_CAUSAL_MARKERS) +
          countEssayAnalysisMatches(paragraph, ESSAY_LOCAL_EXAMPLE_MARKERS) +
          countEssayAnalysisMatches(paragraph, ESSAY_LOCAL_CONNECTIVES) +
          countEssayAnalysisMatches(paragraph, ESSAY_LOCAL_REPERTOIRE_MARKERS),
      };
    })
    .filter((item) =>
      item.index > 0 &&
      item.index < paragraphs.length - 1 &&
      item.wordCount >= 18 &&
      item.themeHits === 0 &&
      item.similarityToRest <= ESSAY_DISCONNECTED_SECTION_LIMIT &&
      item.argumentSignals === 0
    );

  return {
    count: items.length,
    items,
    excerpt: buildEssayExcerpt(items[0]?.paragraph || "", 180),
  };
}

function getEssayParagraphDensityMetrics(paragraphs, themeKeywords, introText) {
  const items = paragraphs.map((paragraph) => {
    const wordCount = countWords(paragraph);
    const themeHits = countEssayAnalysisMatches(paragraph, themeKeywords);
    const causeHits = countEssayAnalysisMatches(paragraph, ESSAY_LOCAL_CAUSAL_MARKERS);
    const exampleHits = countEssayAnalysisMatches(paragraph, ESSAY_LOCAL_EXAMPLE_MARKERS);
    const connectiveHits = countEssayAnalysisMatches(paragraph, ESSAY_LOCAL_CONNECTIVES);
    const repertoireHits = countEssayAnalysisMatches(paragraph, ESSAY_LOCAL_REPERTOIRE_MARKERS);
    const abstractHits = countEssayAnalysisMatches(paragraph, ESSAY_LOCAL_ABSTRACT_MARKERS);
    const introSimilarity = getEssayJaccardSimilarity(paragraph, introText);
    const ideaUnits =
      (themeHits > 0 ? 1 : 0) +
      (causeHits > 0 ? 1 : 0) +
      (exampleHits > 0 ? 1 : 0) +
      (repertoireHits > 0 ? 1 : 0);
    const hollow = wordCount >= 40 && ideaUnits <= 1;
    let maturity = "descritivo";

    if ((causeHits > 0 || exampleHits > 0) && (repertoireHits > 0 || themeHits > 1)) {
      maturity = "analitico";
    } else if (causeHits > 0 || exampleHits > 0) {
      maturity = "explicativo";
    }

    return {
      paragraph,
      wordCount,
      themeHits,
      causeHits,
      exampleHits,
      connectiveHits,
      repertoireHits,
      abstractHits,
      introSimilarity,
      ideaUnits,
      hollow,
      maturity,
    };
  });

  const hollowParagraphs = items.filter((item) => item.hollow);
  const maturityCounts = items.reduce(
    (accumulator, item) => {
      accumulator[item.maturity] += 1;
      return accumulator;
    },
    { descritivo: 0, explicativo: 0, analitico: 0 }
  );

  return {
    items,
    hollowCount: hollowParagraphs.length,
    hollowExcerpt: buildEssayExcerpt(hollowParagraphs[0]?.paragraph || "", 180),
    maturityCounts,
    overallMaturity:
      maturityCounts.analitico > 0 ? "analitico" : maturityCounts.explicativo > 0 ? "explicativo" : "descritivo",
    abstractOverload:
      items.filter((item) => item.abstractHits >= 2 && item.repertoireHits === 0 && item.exampleHits === 0).length > 0,
  };
}

function getEssayCeilingAnalysis(context) {
  const locks = [];
  const bandReadings = [];
  let currentCeiling = 600;

  if (context.textualTypeInvalid || context.totalThemeVoid) {
    currentCeiling = 0;
    locks.push("Estrutura incompatível ou fuga total ao tema.");
    bandReadings.push("Esta redação não alcança 600 porque o tipo textual ou o tema não foram atendidos com segurança.");
  } else {
    const passes600 =
      !context.tangenciamento &&
      context.scores.competency2 >= 80 &&
      context.scores.competency3 >= 80 &&
      context.scores.competency5 >= 80;

    if (passes600) {
      currentCeiling = 800;
      bandReadings.push("Esta redaÃ§Ã£o jÃ¡ supera com seguranÃ§a a faixa de 600 porque tema, argumentaÃ§Ã£o e intervenÃ§Ã£o aparecem de forma funcional.");
    } else {
      currentCeiling = 600;
      bandReadings.push("Esta redaÃ§Ã£o ainda fica perto da faixa de 600 porque tema, projeto argumentativo ou intervenÃ§Ã£o ainda nÃ£o se sustentam com regularidade.");
    }

    if (
      context.tangenciamento ||
      context.thesisVague ||
      context.missingPromises.length > 0 ||
      context.proposalNeedsSpecificAgent ||
      context.interventionComponentCount < 4
    ) {
      locks.push("C3 ou C5 ainda travam a passagem segura para 800.");
      bandReadings.push("Esta redação não passa com segurança de 800 porque a argumentação e a proposta de intervenção ainda estão limitadas.");
    } else {
      currentCeiling = 800;
      bandReadings.push("Esta redaÃ§Ã£o jÃ¡ entra na faixa de 800 porque a tese, os desenvolvimentos e a conclusÃ£o comeÃ§am a trabalhar de forma coordenada.");
    }

    if (
      context.scores.competency2 < 160 ||
      context.scores.competency3 < 160 ||
      context.scores.competency4 < 160 ||
      context.scores.competency5 < 160 ||
      context.repertoireAnalysis.productive === 0 ||
      context.connectiveRepetitionIssue ||
      context.repeatedArgumentPairs > 0
    ) {
      locks.push("C2, C3, C4 ou C5 ainda não sustentam uma faixa quase excelente.");
      bandReadings.push("Esta redação não passa com segurança de 960 porque repertório, progressão lógica ou intervenção ainda não chegaram ao topo.");
    } else {
      currentCeiling = 960;
      bandReadings.push("Esta redaÃ§Ã£o jÃ¡ encosta na faixa de 960 porque repertÃ³rio, progressÃ£o argumentativa, coesÃ£o e intervenÃ§Ã£o operam em nÃ­vel alto.");
    }

    if (
      context.scores.competency1 < 200 ||
      context.scores.competency2 < 200 ||
      context.scores.competency3 < 200 ||
      context.scores.competency4 < 200 ||
      context.scores.competency5 < 200
    ) {
      locks.push("Ainda há competências fora do teto máximo.");
      bandReadings.push("Para chegar ao 1000, todas as competências precisariam operar no nível máximo com muito mais refinamento.");
    } else {
      currentCeiling = 1000;
    }
  }

  const explanation =
    currentCeiling === 0
      ? "A correção foi interrompida por bloqueio estrutural ou temático."
      : `O teto atual estimado desta redação está em torno de ${currentCeiling} pontos, considerando as travas de competência ainda ativas.`;

  return {
    currentCeiling,
    explanation,
    bandReadings,
    locks,
  };
}

function getEssayRepertoireAnalysis(sentences, themeKeywords) {
  const result = {
    total: 0,
    productive: 0,
    generic: 0,
    decorated: 0,
    productiveExcerpt: "",
    genericExcerpt: "",
    decoratedExcerpt: "",
  };

  sentences.forEach((sentence) => {
    const repertoireHits = countEssayAnalysisMatches(sentence, ESSAY_LOCAL_REPERTOIRE_MARKERS);

    if (!repertoireHits) {
      return;
    }

    result.total += 1;
    const themeHits = countEssayAnalysisMatches(sentence, themeKeywords);
    const supportHits =
      countEssayAnalysisMatches(sentence, ESSAY_LOCAL_REPERTOIRE_SUPPORT_MARKERS) +
      countEssayAnalysisMatches(sentence, ESSAY_LOCAL_CAUSAL_MARKERS) +
      countEssayAnalysisMatches(sentence, ESSAY_LOCAL_EXAMPLE_MARKERS);
    const pocketHits = countEssayAnalysisMatches(sentence, ESSAY_LOCAL_POCKET_REPERTOIRE_MARKERS);

    if (themeHits > 0 && supportHits > 0 && countWords(sentence) >= 12) {
      result.productive += 1;
      if (!result.productiveExcerpt) {
        result.productiveExcerpt = buildEssayExcerpt(sentence, 180);
      }
      return;
    }

    if (pocketHits > 0 || themeHits === 0 || countWords(sentence) < 10) {
      result.decorated += 1;
      if (!result.decoratedExcerpt) {
        result.decoratedExcerpt = buildEssayExcerpt(sentence, 180);
      }
      return;
    }

    result.generic += 1;
    if (!result.genericExcerpt) {
      result.genericExcerpt = buildEssayExcerpt(sentence, 180);
    }
  });

  return result;
}

function getEssayProfileLabel(totalScore) {
  if (totalScore >= 980) return "excelente";
  if (totalScore >= 900) return "quase excelente";
  if (totalScore >= 800) return "forte";
  if (totalScore >= 680) return "boa";
  if (totalScore >= 520) return "mediana";
  return "muito generica";
}

function detectEssayPrimaryLanguage(text) {
  const normalizedText = normalizeEssayAnalysisText(text);
  const portugueseHits = [...ESSAY_LOCAL_STOPWORDS].reduce(
    (total, term) => total + (containsEssayAnalysisTerm(normalizedText, term) ? 1 : 0),
    0
  );
  const englishHits = ESSAY_LOCAL_ENGLISH_STOPWORDS.reduce(
    (total, term) => total + (containsEssayAnalysisTerm(normalizedText, term) ? 1 : 0),
    0
  );

  if (englishHits > portugueseHits + 3) {
    return { code: "en", label: "ingles", portugueseHits, englishHits };
  }

  return { code: "pt", label: "portugues", portugueseHits, englishHits };
}

function getEssayPreAnalysis(input) {
  const paragraphs = Array.isArray(input?.paragraphs) ? input.paragraphs : [];
  const sentences = Array.isArray(input?.sentences) ? input.sentences : [];
  const essayText = String(input?.essayText || "");
  const effectiveWordCount = Number(input?.effectiveWordCount) || 0;
  const language = detectEssayPrimaryLanguage(essayText);
  const listLike =
    essayText.split(/\n+/g).filter((line) => ESSAY_LOCAL_LIST_LINE_MARKERS.some((marker) => line.trim().startsWith(marker))).length >= 2;
  const noteLike = countEssayAnalysisMatches(essayText, ESSAY_LOCAL_NOTE_MARKERS) >= 2;
  const poemLike = paragraphs.length >= 5 && sentences.length >= 5 && paragraphs.every((paragraph) => countWords(paragraph) <= 12);
  const narrativeLike = countEssayAnalysisMatches(essayText, ESSAY_LOCAL_NARRATIVE_MARKERS) >= 1;
  const missingParagraphing = paragraphs.length < ESSAY_MIN_PARAGRAPHS;
  const shortSentenceCount = sentences.filter((sentence) => countWords(sentence) <= 6).length;
  const looseSentences = sentences.length > 0 && shortSentenceCount / sentences.length >= 0.45;
  const incompleteText =
    effectiveWordCount < ESSAY_MIN_WORDS ||
    sentences.length < ESSAY_MIN_SENTENCES ||
    !/[.!?]\s*$/.test(String(essayText).trim());
  const dissertativeCompatible =
    language.code === "pt" &&
    !listLike &&
    !noteLike &&
    !poemLike &&
    !narrativeLike &&
    !missingParagraphing;

  const messages = [];

  if (language.code !== "pt") messages.push("O idioma principal nao parece ser o portugues.");
  if (incompleteText) messages.push("O texto aparenta estar incompleto ou insuficiente.");
  if (looseSentences) messages.push("Ha excesso de frases soltas ou curtas demais.");
  if (missingParagraphing) messages.push("Ha ausencia ou fragilidade de paragrafacao.");
  if (listLike) messages.push("O formato ficou proximo de lista.");
  if (noteLike) messages.push("O formato ficou proximo de bilhete ou mensagem.");
  if (poemLike) messages.push("O formato ficou proximo de poema.");
  if (narrativeLike) messages.push("O texto apresenta traços narrativos fortes.");

  return {
    primaryLanguage: language.label,
    dissertativeCompatible,
    incompleteText,
    looseSentences,
    missingParagraphing,
    listLike,
    noteLike,
    poemLike,
    narrativeLike,
    messages,
    stopNormalCorrection: !dissertativeCompatible,
  };
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

function buildAdvancedLocalEssayEvaluation(submission, sourceError) {
  const essayText = String(submission?.essayText || "");
  const normalizedText = normalizeEssayAnalysisText(essayText);
  const paragraphs = splitEssayParagraphs(essayText);
  const sentences = splitEssaySentences(essayText);
  const wordCount = Number(submission?.wordCount) || countWords(essayText);
  const introText = paragraphs[0] || "";
  const bodyParagraphs = paragraphs.length > 2 ? paragraphs.slice(1, -1) : paragraphs.slice(1);
  const bodyText = bodyParagraphs.join(" ");
  const conclusionText = paragraphs[paragraphs.length - 1] || essayText;
  const avgSentenceWords = sentences.length ? wordCount / sentences.length : wordCount;
  const uppercaseMatches = essayText.match(/\p{Lu}/gu) || [];
  const letterMatches = essayText.match(/\p{L}/gu) || [];
  const uppercaseRatio = letterMatches.length ? uppercaseMatches.length / letterMatches.length : 0;
  const exclamationCount = (essayText.match(/!/g) || []).length;
  const questionCount = (essayText.match(/\?/g) || []).length;
  const repeatedPunctuationCount = (essayText.match(/([!?.,;:])\1{1,}/g) || []).length;
  const informalMetrics = getEssayMarkerMetrics(normalizedText, ESSAY_LOCAL_INFORMAL_MARKERS);
  const connectivePresence = getEssayMarkerMetrics(normalizedText, ESSAY_LOCAL_CONNECTIVES);
  const connectiveMetrics = getEssayMarkerFrequencyMetrics(normalizedText, ESSAY_LOCAL_CONNECTIVES);
  const causalMetrics = getEssayMarkerMetrics(normalizedText, ESSAY_LOCAL_CAUSAL_MARKERS);
  const exampleMetrics = getEssayMarkerMetrics(normalizedText, ESSAY_LOCAL_EXAMPLE_MARKERS);
  const thesisMarkerCount = countEssayAnalysisMatches(introText || essayText, ESSAY_LOCAL_THESIS_MARKERS);
  const conclusionMarkerCount = countEssayAnalysisMatches(
    conclusionText || essayText,
    ESSAY_LOCAL_CONCLUSION_MARKERS
  );
  const themeCoverage = getEssayThemeCoverageMetrics(submission, paragraphs);
  const titleKeywords = getEssayThemeKeywords(submission?.themeTitle);
  const broadTopicKeywords = titleKeywords.slice(0, Math.min(3, titleKeywords.length));
  const titleCoverageHits = countEssayAnalysisMatches(essayText, titleKeywords);
  const titleCoverageRatio = titleKeywords.length ? titleCoverageHits / titleKeywords.length : themeCoverage.coverage;
  const subjectHits = countEssayAnalysisMatches(essayText, broadTopicKeywords);
  const interventionMetrics = getEssayInterventionMetrics(conclusionText);
  const interventionComponentCount = countEssayPresentComponents(interventionMetrics);
  const vagueAgentCount = countEssayAnalysisMatches(conclusionText, ESSAY_LOCAL_VAGUE_INTERVENTION_AGENTS);
  const humanRightsViolationCount = countEssayAnalysisMatches(
    conclusionText,
    ESSAY_LOCAL_HUMAN_RIGHTS_VIOLATION_MARKERS
  );
  const uniqueWordRatio = getEssayUniqueWordRatio(essayText);
  const paragraphOpeningVariety = getEssayParagraphOpeningVariety(paragraphs);
  const bodyParagraphCount = bodyParagraphs.length;
  const bodyParagraphsWithSubstance = bodyParagraphs.filter((paragraph) => countWords(paragraph) >= 45).length;
  const veryShortParagraphCount = paragraphs.filter((paragraph) => countWords(paragraph) < 25).length;
  const numericEvidenceCount = (essayText.match(/\b\d+(?:[.,]\d+)?\b|%/g) || []).length;
  const nonArgumentativeMarkers = countEssayAnalysisMatches(normalizedText, ESSAY_LOCAL_NON_ARGUMENTATIVE_MARKERS);
  const introKeyIdeas = getEssayTopWordFrequency(introText, 4, themeCoverage.keywords);
  const promisedIdeas = introKeyIdeas.slice(0, 3);
  const developedPromises = promisedIdeas.filter((idea) =>
    bodyParagraphs.some((paragraph) => containsEssayAnalysisTerm(paragraph, idea))
  );
  const missingPromises = promisedIdeas.filter((idea) => !developedPromises.includes(idea));
  let repeatedArgumentPairs = 0;
  let repeatedArgumentExcerpt = "";

  bodyParagraphs.forEach((paragraph, index) => {
    bodyParagraphs.slice(index + 1).forEach((otherParagraph) => {
      if (getEssayJaccardSimilarity(paragraph, otherParagraph) >= 0.55) {
        repeatedArgumentPairs += 1;

        if (!repeatedArgumentExcerpt) {
          repeatedArgumentExcerpt = buildEssayExcerpt(paragraph, 180);
        }
      }
    });
  });

  const conclusionSimilarity = getEssayJaccardSimilarity(conclusionText, bodyText);
  const thesisSentence = getEssayBestSentenceByMatches(
    splitEssaySentences(introText),
    [...ESSAY_LOCAL_THESIS_MARKERS, ...themeCoverage.keywords],
    { fallbackToFirst: true, maxLength: 220 }
  );
  const cohesionSentence = getEssayBestSentenceByMatches(
    sentences,
    [...ESSAY_LOCAL_CONNECTIVES, ...ESSAY_LOCAL_CAUSAL_MARKERS],
    { fallbackToFirst: true, maxLength: 220 }
  );
  const interventionSentence = getEssayBestSentenceByMatches(
    splitEssaySentences(conclusionText),
    [
      ...ESSAY_LOCAL_INTERVENTION_AGENTS,
      ...ESSAY_LOCAL_VAGUE_INTERVENTION_AGENTS,
      ...ESSAY_LOCAL_INTERVENTION_ACTIONS,
      ...ESSAY_LOCAL_INTERVENTION_MEANS,
      ...ESSAY_LOCAL_INTERVENTION_PURPOSE,
    ],
    { fallbackToFirst: true, maxLength: 220 }
  );
  const repertoireAnalysis = getEssayRepertoireAnalysis(sentences, themeCoverage.keywords);
  const copyMetrics = getEssayCopyMetrics(
    essayText,
    `${submission?.themeTitle || ""} ${submission?.themePrompt || ""}`
  );
  const effectiveWordCount = Math.max(0, wordCount - copyMetrics.copiedWordCount);
  const preAnalysis = getEssayPreAnalysis({
    essayText,
    paragraphs,
    sentences,
    effectiveWordCount,
  });
  const disconnectedParagraphMetrics = getEssayDisconnectedParagraphMetrics(paragraphs, themeCoverage.keywords);
  const paragraphDensityMetrics = getEssayParagraphDensityMetrics(bodyParagraphs, themeCoverage.keywords, introText);
  const hasExplicitProposal =
    interventionMetrics.actions.total > 0 &&
    (interventionMetrics.agents.total > 0 || vagueAgentCount > 0) &&
    interventionMetrics.purposes.total > 0;
  const proposalNeedsSpecificAgent =
    interventionMetrics.agents.total === 0 && vagueAgentCount >= ESSAY_VAGUE_PROPOSAL_LIMIT;
  const thesisVague =
    themeCoverage.introHits === 0 ||
    (thesisMarkerCount === 0 && promisedIdeas.length < 2) ||
    countWords(introText) < 28;
  const conclusionDisconnected =
    countWords(conclusionText) > 0 &&
    conclusionSimilarity < 0.08 &&
    themeCoverage.conclusionHits === 0 &&
    interventionComponentCount < 3;
  const connectiveRepetitionIssue = connectiveMetrics.highestCount >= 3;
  const artificialConnectiveChain =
    connectiveMetrics.total >= Math.max(5, Math.round(sentences.length / 2)) &&
    connectiveMetrics.unique <= 2;
  const textualTypeSignals = [
    effectiveWordCount >= ESSAY_MIN_WORDS,
    paragraphs.length >= ESSAY_MIN_PARAGRAPHS,
    sentences.length >= ESSAY_MIN_SENTENCES,
    bodyParagraphCount >= 2,
    bodyParagraphsWithSubstance >= 2,
    thesisMarkerCount > 0 || promisedIdeas.length >= 2,
    conclusionMarkerCount > 0 || hasExplicitProposal,
  ].filter(Boolean).length;
  const textualTypeInvalid =
    preAnalysis.stopNormalCorrection ||
    effectiveWordCount < Math.max(70, Math.floor(ESSAY_MIN_WORDS * 0.55)) ||
    paragraphs.length < 2 ||
    sentences.length < Math.max(3, Math.floor(ESSAY_MIN_SENTENCES * 0.5)) ||
    bodyParagraphCount === 0 ||
    (textualTypeSignals <= 1 && bodyParagraphsWithSubstance === 0) ||
    nonArgumentativeMarkers >= 2;
  const broadSubjectOnly =
    subjectHits > 0 &&
    themeCoverage.coverage < ESSAY_TANGENCY_LIMIT &&
    titleCoverageRatio < 0.45 &&
    themeCoverage.introHits < 2;
  const totalThemeVoid =
    !textualTypeInvalid &&
    subjectHits === 0 &&
    themeCoverage.totalHits === 0 &&
    textualTypeSignals <= 3;
  const tangenciamento = !textualTypeInvalid && !totalThemeVoid && broadSubjectOnly;
  const themeStatus = textualTypeInvalid
    ? "estrutura incompatível"
    : totalThemeVoid
      ? "fuga total ao tema"
      : tangenciamento
        ? "tangenciamento"
        : "aderente ao recorte";
  const formulaicOpeningHits = countEssayAnalysisMatches(introText, ESSAY_LOCAL_FORMULAIC_OPENINGS);
  const formulaicProposalHits = countEssayAnalysisMatches(conclusionText, ESSAY_LOCAL_FORMULAIC_PROPOSALS);
  const decoratedEssayRisk =
    formulaicOpeningHits > 0 ||
    formulaicProposalHits > 0 ||
    connectiveRepetitionIssue ||
    repertoireAnalysis.decorated >= ESSAY_DECORATED_REPERTOIRE_LIMIT;

  let competency1Score = 80;
  if (effectiveWordCount >= ESSAY_MIN_WORDS) competency1Score += 20;
  if (paragraphs.length >= ESSAY_MIN_PARAGRAPHS) competency1Score += 20;
  if (sentences.length >= ESSAY_MIN_SENTENCES) competency1Score += 20;
  if (avgSentenceWords >= 10 && avgSentenceWords <= 28) competency1Score += 20;
  if (informalMetrics.total === 0) competency1Score += 20;
  if (exclamationCount === 0 && repeatedPunctuationCount === 0 && uppercaseRatio < 0.08) competency1Score += 20;
  if (uniqueWordRatio >= 0.45) competency1Score += 20;
  if (informalMetrics.total >= 1) competency1Score -= 20;
  if (avgSentenceWords < 8 || avgSentenceWords > 34) competency1Score -= 20;
  if (exclamationCount > 1 || questionCount > 2 || repeatedPunctuationCount > 0) competency1Score -= 20;
  if (veryShortParagraphCount >= 2) competency1Score -= 20;
  if (nonArgumentativeMarkers > 0) competency1Score -= 20;
  if (copyMetrics.excessive) competency1Score -= 20;
  competency1Score = normalizeEssayBandScore(competency1Score);

  let competency2Score = 40;
  if (!textualTypeInvalid && !totalThemeVoid) {
    if (themeCoverage.coverage >= 0.75) competency2Score += 120;
    else if (themeCoverage.coverage >= 0.55) competency2Score += 100;
    else if (themeCoverage.coverage >= 0.4) competency2Score += 80;
    else if (themeCoverage.coverage >= 0.25) competency2Score += 60;
    else if (themeCoverage.totalHits > 0 || subjectHits > 0) competency2Score += 40;
    else competency2Score += 20;
    if (themeCoverage.introHits > 0) competency2Score += 20;
    if (themeCoverage.bodyHits >= 2) competency2Score += 20;
    if (repertoireAnalysis.productive > 0) competency2Score += 20;
    else if (repertoireAnalysis.generic > 0) competency2Score += 10;
    if (repertoireAnalysis.decorated >= ESSAY_DECORATED_REPERTOIRE_LIMIT) competency2Score -= 20;
    if (formulaicOpeningHits > 0) competency2Score -= 20;
    if (thesisVague) competency2Score -= 20;
    if (copyMetrics.excessive) competency2Score -= ESSAY_ALERT_WEIGHT_MODERATE;
    if (disconnectedParagraphMetrics.count > 0) competency2Score -= ESSAY_ALERT_WEIGHT_MODERATE;
    competency2Score = normalizeEssayBandScore(competency2Score);
    if (tangenciamento) {
      competency2Score = Math.min(40, Math.max(20, competency2Score));
    }
  } else {
    competency2Score = 0;
  }

  let competency3Score = 40;
  if (!textualTypeInvalid && !totalThemeVoid) {
    if (paragraphs.length >= ESSAY_MIN_PARAGRAPHS) competency3Score += 20;
    if (bodyParagraphCount >= 2) competency3Score += 20;
    if (bodyParagraphsWithSubstance >= 2) competency3Score += 20;
    if (thesisMarkerCount > 0 || promisedIdeas.length >= 2) competency3Score += 20;
    if (causalMetrics.total >= 2) competency3Score += 20;
    if (exampleMetrics.total >= 1 || numericEvidenceCount > 0) competency3Score += 20;
    if (repertoireAnalysis.productive > 0) competency3Score += 20;
    if (developedPromises.length >= Math.min(2, promisedIdeas.length || 1)) competency3Score += 20;
    if (paragraphDensityMetrics.overallMaturity === "analitico") competency3Score += 20;
    if (thesisVague) competency3Score -= 20;
    if (missingPromises.length > 0) competency3Score -= 20;
    if (repeatedArgumentPairs > 0) competency3Score -= 20;
    if (conclusionDisconnected) competency3Score -= 20;
    if (paragraphDensityMetrics.hollowCount > 0) competency3Score -= 20;
    if (paragraphDensityMetrics.abstractOverload) competency3Score -= 20;
    if (copyMetrics.excessive) competency3Score -= ESSAY_ALERT_WEIGHT_MODERATE;
    if (disconnectedParagraphMetrics.count > 0) competency3Score -= ESSAY_ALERT_WEIGHT_MODERATE;
    competency3Score = normalizeEssayBandScore(competency3Score);
    if (tangenciamento) {
      competency3Score = Math.min(40, Math.max(20, competency3Score));
    }
  } else {
    competency3Score = 0;
  }

  let competency4Score = 40;
  if (!textualTypeInvalid && !totalThemeVoid) {
    if (connectivePresence.total >= 3) competency4Score += 20;
    if (connectiveMetrics.unique >= 3) competency4Score += 20;
    if (connectiveMetrics.unique >= 5) competency4Score += 20;
    if (paragraphOpeningVariety >= Math.min(3, paragraphs.length)) competency4Score += 20;
    if (avgSentenceWords >= 10 && avgSentenceWords <= 28) competency4Score += 20;
    if (conclusionMarkerCount > 0) competency4Score += 20;
    if (paragraphs.length >= ESSAY_MIN_PARAGRAPHS) competency4Score += 20;
    if (connectiveRepetitionIssue) competency4Score -= 20;
    if (artificialConnectiveChain) competency4Score -= 20;
    if (repeatedArgumentPairs > 0) competency4Score -= 20;
    competency4Score = normalizeEssayBandScore(competency4Score);
  } else {
    competency4Score = 0;
  }

  let competency5Score = 0;
  if (!textualTypeInvalid && !totalThemeVoid) {
    if (humanRightsViolationCount > 0) {
      competency5Score = 0;
    } else {
      if (conclusionMarkerCount > 0) competency5Score += 20;
      if (interventionMetrics.actions.total > 0) competency5Score += 40;
      if (interventionMetrics.agents.total > 0) competency5Score += 40;
      if (interventionMetrics.means.total > 0) competency5Score += 40;
      if (interventionMetrics.purposes.total > 0) competency5Score += 20;
      if (interventionMetrics.details.total > 0) competency5Score += 20;
      if (countWords(conclusionText) >= 45) competency5Score += 20;
      if (hasExplicitProposal) competency5Score += 20;
      if (proposalNeedsSpecificAgent) competency5Score -= 40;
      if (!hasExplicitProposal) competency5Score -= 20;
      if (interventionComponentCount < 4) competency5Score -= 20;
      if (formulaicProposalHits > 0) competency5Score -= 20;
      competency5Score = normalizeEssayBandScore(competency5Score);
    }
    if (tangenciamento) {
      competency5Score = Math.min(40, Math.max(20, competency5Score));
    }
  }

  const quotaOrConfigIssue =
    Number(sourceError?.statusCode) === 429 ||
    /quota|billing|rate limit|OPENAI_API_KEY|OPENAI_MODEL/i.test(String(sourceError?.message || ""));
  const fallbackPrefix = quotaOrConfigIssue
    ? "Avaliacao local automatica usada porque a IA nao estava disponivel agora."
    : "Avaliacao local automatica usada como plano de seguranca.";

  if (textualTypeInvalid || totalThemeVoid) {
    competency1Score = 0;
    competency2Score = 0;
    competency3Score = 0;
    competency4Score = 0;
    competency5Score = 0;
  }

  const competencies = [
    {
      id: 1,
      name: "Competência 1",
      score: competency1Score,
      justification: textualTypeInvalid || totalThemeVoid
        ? "Como a redação foi classificada com fuga total ao tema ou estrutura textual incompatível, a nota total foi zerada e esta competência não foi aproveitada."
        : `O texto trouxe ${wordCount} palavras em ${paragraphs.length} parágrafo(s), com média de ${Math.max(1, Math.round(avgSentenceWords))} palavras por frase. A leitura formal ficou melhor quando a pontuação, a extensão dos períodos e o registro se mantiveram estáveis.`,
      technicalJustification: textualTypeInvalid || totalThemeVoid
        ? "Bloqueio estrutural aplicado antes da correção por competência."
        : `Norma-padrão observada por extensão textual, regularidade sintática, proporção de caixa alta (${Math.round(uppercaseRatio * 100)}%), oralidade (${informalMetrics.total}) e estabilidade de pontuação.`,
      improvement: informalMetrics.total > 0
        ? "Retire marcas de oralidade e revise ortografia, acentuação e pontuação frase por frase."
        : "Faça uma revisão final de ortografia, concordância e pontuação para sustentar um registro formal do começo ao fim.",
      technicalImprovement: "Revisar ortografia, concordância, pontuação e registro formal com foco em microdesvios recorrentes.",
    },
    {
      id: 2,
      name: "Competência 2",
      score: competency2Score,
      justification: textualTypeInvalid
        ? "A estrutura textual não atendeu de forma segura ao tipo dissertativo-argumentativo, por isso a avaliação foi zerada."
        : totalThemeVoid
          ? "Foi identificada fuga total ao tema: o texto não enfrentou de forma suficiente o assunto nem o recorte temático esperado."
          : tangenciamento
            ? `O texto abordou o assunto amplo, mas ficou no tangenciamento do recorte. A leitura temática encontrou ${themeCoverage.totalHits} aproximações com o tema, porém com cobertura estimada de apenas ${Math.round(themeCoverage.coverage * 100)}% das palavras-chave analisadas.`
            : `A leitura temática encontrou ${themeCoverage.totalHits} aproximações com o tema, com cobertura estimada de ${Math.round(themeCoverage.coverage * 100)}% das palavras-chave analisadas. O repertório apareceu em ${repertoireAnalysis.total} trecho(s), sendo ${repertoireAnalysis.productive} produtivo(s).`,
      technicalJustification: `Cobertura temática: ${Math.round(themeCoverage.coverage * 100)}%. Hits no título: ${titleCoverageHits}. Repertório produtivo/genérico/decorado: ${repertoireAnalysis.productive}/${repertoireAnalysis.generic}/${repertoireAnalysis.decorated}.`,
      improvement: tangenciamento || themeCoverage.coverage < 0.35
        ? "Retome o recorte exato do tema já na introdução e faça os desenvolvimentos voltarem explicitamente a esse foco."
        : repertoireAnalysis.decorated >= ESSAY_DECORATED_REPERTOIRE_LIMIT
          ? "Use menos referência decorativa e mais repertório realmente conectado ao argumento e ao recorte temático."
          : "Aprofunde o recorte do tema com repertório produtivo e explicite melhor como cada argumento conversa com a proposta.",
      technicalImprovement: "Aumentar aderência ao recorte e substituir repertório apenas válido por repertório forte, contextualizado e probatório.",
    },
    {
      id: 3,
      name: "Competência 3",
      score: competency3Score,
      justification: textualTypeInvalid || totalThemeVoid
        ? "Como a redação foi zerada, não houve aproveitamento seguro da progressão argumentativa."
        : `A argumentação foi estimada pela presença de tese na introdução, ${bodyParagraphsWithSubstance} desenvolvimento(s) com bom corpo textual, ${causalMetrics.total} marca(s) de causa, ${exampleMetrics.total + numericEvidenceCount} sinal(is) de exemplo ou dado e ${developedPromises.length}/${Math.max(1, promisedIdeas.length)} ideia(s) prometidas na abertura realmente desenvolvidas.`,
      technicalJustification: `Maturidade do desenvolvimento: ${paragraphDensityMetrics.overallMaturity}. Parágrafos ocos: ${paragraphDensityMetrics.hollowCount}. Promessas desenvolvidas: ${developedPromises.length}/${Math.max(1, promisedIdeas.length)}.`,
      improvement: repeatedArgumentPairs > 0 || missingPromises.length > 0
        ? "Evite repetir o mesmo argumento e desenvolva, no corpo do texto, tudo o que foi prometido na introdução."
        : bodyParagraphsWithSubstance < 2
          ? "Fortaleça os parágrafo(s) de desenvolvimento com ideia central, explicação, repercussão e fechamento."
          : "Refine a progressão dos argumentos para que cada desenvolvimento avance a tese com mais precisão.",
      technicalImprovement: "Aumentar densidade argumentativa, substituir descrição por análise e eliminar parágrafo oco ou repetitivo.",
    },
    {
      id: 4,
      name: "Competência 4",
      score: competency4Score,
      justification: textualTypeInvalid || totalThemeVoid
        ? "Com a redação zerada, a coesão não foi aproveitada para composição da nota."
        : `Foram identificados ${connectiveMetrics.total} conectivo(s), com diversidade de ${connectiveMetrics.unique}, variedade de abertura em ${paragraphOpeningVariety} parágrafo(s) e dominância de "${connectiveMetrics.dominantMarker || "nenhum"}" em ${connectiveMetrics.highestCount || 0} ocorrência(s).`,
      technicalJustification: `Encadeamento avaliado por conectivos distintos, repetição máxima, variedade de abertura e relação lógica entre os parágrafos.`,
      improvement: connectiveRepetitionIssue || artificialConnectiveChain
        ? "Os conectivos existem, mas precisam fazer mais sentido no contexto. Varie os encadeamentos e evite costura artificial."
        : connectiveMetrics.unique < 3
          ? "Use conectivos mais variados entre frases e parágrafos para deixar a progressão das ideias mais fluida."
          : "Mantenha a coesão, mas refine a transição entre um argumento e outro para o texto soar mais orgânico.",
      technicalImprovement: "Reduzir conectivos em série, aumentar amarração lógica real e impedir cola artificial entre períodos.",
    },
    {
      id: 5,
      name: "Competência 5",
      score: competency5Score,
      justification: textualTypeInvalid || totalThemeVoid
        ? "Como o texto foi zerado, a proposta de intervenção não foi aproveitada."
        : humanRightsViolationCount > 0
          ? "A proposta de intervenção apresentou sinal de desrespeito aos direitos humanos. Nesse caso, a Competência 5 foi zerada, com transparência sobre o motivo."
          : `Na parte final apareceram ${interventionComponentCount} componente(s) da proposta de intervenção, considerando agente, ação, meio, finalidade e detalhamento. Houve ${vagueAgentCount} referência(s) a agente genérico.`,
      technicalJustification: `Intervenção medida por ação/agente/meio/finalidade/detalhamento (${interventionComponentCount}/5), agente genérico (${vagueAgentCount}) e risco de violação de direitos humanos (${humanRightsViolationCount}).`,
      improvement: humanRightsViolationCount > 0
        ? "Reescreva a proposta com respeito aos direitos humanos e troque soluções punitivas ou violentas por medidas legítimas e viáveis."
        : interventionComponentCount < 4 || proposalNeedsSpecificAgent
          ? "A conclusão apresenta solução, mas ainda precisa de agente específico, meio de execução e detalhamento mais claros."
          : "Sua proposta já aparece de forma válida, mas ainda pode ganhar mais detalhamento operacional para subir a nota.",
      technicalImprovement: "Completar a cadeia interventiva, evitar agente genérico e garantir articulação direta com a tese debatida.",
    },
  ];

  const sortedCompetencies = [...competencies].sort((left, right) => left.score - right.score);
  const weakestCompetency = sortedCompetencies[0];
  const strongestCompetency = sortedCompetencies[sortedCompetencies.length - 1];
  const totalScore = competencies.reduce((sum, item) => sum + item.score, 0);
  const profileLabel = getEssayProfileLabel(totalScore);
  const confidencePenalty =
    (effectiveWordCount < ESSAY_MIN_WORDS ? 1 : 0) +
    (paragraphs.length < ESSAY_MIN_PARAGRAPHS ? 1 : 0) +
    (sentences.length < ESSAY_MIN_SENTENCES ? 1 : 0) +
    (tangenciamento ? 2 : 0) +
    (textualTypeInvalid || totalThemeVoid ? 3 : 0) +
    (copyMetrics.excessive ? 1 : 0) +
    (repertoireAnalysis.decorated >= ESSAY_DECORATED_REPERTOIRE_LIMIT ? 1 : 0) +
    (disconnectedParagraphMetrics.count > 0 ? 1 : 0);
  const confidenceLevel = confidencePenalty >= 4 ? "baixa" : confidencePenalty >= 2 ? "media" : "alta";
  const confidenceNote =
    confidenceLevel === "alta"
      ? "Leitura automatica com bons sinais estruturais. Ainda assim, vale revisao humana em caso de prova real."
      : confidenceLevel === "media"
        ? "Leitura automatica com alguns pontos limitrofes. Vale revisar manualmente os trechos destacados."
        : "Baixa confianca automatica. O texto pede revisao humana porque houve incerteza semantica relevante. Em correcao humana no modelo ENEM, casos assim exigiriam conferencia quando houvesse discrepancia superior a 100 pontos no total ou 80 em qualquer competencia.";
  const highlightedExcerpts = [];

  [thesisSentence, bodyParagraphs.find((paragraph) => countWords(paragraph) >= 45), interventionSentence, sentences[sentences.length - 1]]
    .map((item) => sanitizeEssayFeedbackText(item, 220))
    .forEach((item) => {
      if (item && !highlightedExcerpts.includes(item) && highlightedExcerpts.length < 4) {
        highlightedExcerpts.push(item);
      }
    });

  const analysisIndicators = [
    `Perfil da redacao: ${profileLabel}.`,
    `Tema: ${themeStatus}, com cobertura aproximada de ${Math.round(themeCoverage.coverage * 100)}% do recorte analisado.`,
    `Estrutura: ${wordCount} palavras totais, ${effectiveWordCount} aproveitaveis, ${paragraphs.length} paragrafo(s) e ${sentences.length} frase(s).`,
    `Argumentacao: ${developedPromises.length}/${Math.max(1, promisedIdeas.length)} ideia(s) prometidas na abertura foram efetivamente desenvolvidas.`,
    `Maturidade do desenvolvimento: ${paragraphDensityMetrics.overallMaturity}, com ${paragraphDensityMetrics.hollowCount} paragrafo(s) oco(s).`,
    `Coesao: ${connectiveMetrics.total} conectivo(s), ${connectiveMetrics.unique} diferentes e repeticao maxima de ${connectiveMetrics.highestCount || 0}.`,
    `Intervencao: ${interventionComponentCount} elemento(s) validos e confianca ${confidenceLevel}.`,
    "Precisao: esta leitura e uma aproximacao automatizada, nao uma nota oficial do ENEM.",
  ];
  const diagnosticMessages = [];
  const criticalAlerts = [];
  const strengths = [];
  const mainProblems = [];
  const nextSteps = [];
  const dedupeFeedbackList = (items, limit = 8) => [...new Set((items || []).filter(Boolean))].slice(0, limit);

  if (tangenciamento) {
    diagnosticMessages.push("Abordou o assunto, mas não o recorte temático.");
    criticalAlerts.push("Tangenciamento identificado: C2 ficou limitada a 40 e C3/C5 não puderam ultrapassar 40.");
  }

  if (totalThemeVoid) {
    diagnosticMessages.push("Houve fuga total ao tema.");
    criticalAlerts.push("Fuga total ao tema: a nota foi zerada conforme a regra configurada.");
  }

  if (textualTypeInvalid) {
    diagnosticMessages.push("O texto não atendeu com segurança ao tipo dissertativo-argumentativo.");
    criticalAlerts.push("Estrutura incompatível com o formato esperado: a nota foi zerada.");
  }

  if (repertoireAnalysis.productive > 0) {
    strengths.push("Há repertório produtivo, pertinente ao tema e ligado à argumentação.");
  } else if (repertoireAnalysis.generic > 0) {
    diagnosticMessages.push("Há repertório, mas ele ainda fica mais genérico do que produtivo.");
  }

  if (repertoireAnalysis.decorated >= ESSAY_DECORATED_REPERTOIRE_LIMIT) {
    diagnosticMessages.push("Há repertório, mas ele funciona mais como enfeite do que como prova.");
    mainProblems.push("O repertório apareceu de forma decorativa ou pouco contextualizada.");
  }

  if (repertoireAnalysis.total > 0 && repertoireAnalysis.productive === 0) {
    diagnosticMessages.push("Repertorio famoso ou conhecido nao foi tratado como repertorio produtivo sem articulacao real ao argumento.");
  }

  if (copyMetrics.excessive) {
    diagnosticMessages.push("Trechos copiados dos textos motivadores não contam como desenvolvimento autoral.");
    criticalAlerts.push("Foi identificado trecho não aproveitável para avaliação argumentativa por proximidade excessiva com o enunciado.");
    mainProblems.push("A autoria e o desenvolvimento perderam força porque houve reaproveitamento excessivo do texto-base.");
  }

  if (effectiveWordCount < ESSAY_MIN_WORDS || sentences.length < ESSAY_MIN_SENTENCES || paragraphs.length < ESSAY_MIN_PARAGRAPHS) {
    diagnosticMessages.push("O texto ainda mostra insuficiência textual para um desempenho mais alto.");
    mainProblems.push("A quantidade de conteúdo aproveitável ainda está abaixo do ideal para sustentar a nota.");
  }

  if (disconnectedParagraphMetrics.count > 0) {
    diagnosticMessages.push("Há parte do texto desconectada do tema ou do projeto argumentativo.");
    criticalAlerts.push("Foi detectado trecho possivelmente desconectado do tema, tratado como alerta grave para revisão.");
  }

  if (disconnectedParagraphMetrics.count === 1 && criticalAlerts.length) {
    const lastAlert = criticalAlerts[criticalAlerts.length - 1] || "";

    if (/trecho possivelmente desconectado/i.test(lastAlert)) {
      criticalAlerts.pop();
    }
  }

  if (thesisVague) {
    diagnosticMessages.push("O texto tem estrutura de dissertação, porém com argumentação previsível.");
    mainProblems.push("A tese ainda está vaga ou pouco delimitada na introdução.");
  } else {
    strengths.push("A introdução já indica um projeto argumentativo relativamente claro.");
  }

  if (repeatedArgumentPairs > 0) {
    diagnosticMessages.push("Há argumento repetido, com pouca progressão entre os parágrafos.");
    mainProblems.push("Os desenvolvimentos repetem ideias sem avançar o projeto argumentativo.");
  } else if (bodyParagraphsWithSubstance >= 2) {
    strengths.push("Os parágrafos de desenvolvimento acrescentam informação nova ao texto.");
  }

  if (missingPromises.length > 0) {
    diagnosticMessages.push("Há causa prometida na introdução que não foi desenvolvida depois.");
    mainProblems.push("Parte do que foi prometido na abertura não voltou com força suficiente no corpo do texto.");
  }

  if (conclusionDisconnected) {
    diagnosticMessages.push("A conclusão se distancia do que foi discutido no desenvolvimento.");
    mainProblems.push("A conclusão não conversa de forma orgânica com os argumentos anteriores.");
  }

  if (connectiveRepetitionIssue || artificialConnectiveChain) {
    diagnosticMessages.push("Os conectivos existem, mas a progressão lógica ainda está fraca.");
    mainProblems.push("A coesão ficou artificial ou repetitiva em alguns encadeamentos.");
    mainProblems.push("Conectivo nao foi suficiente para garantir coesao real entre as ideias.");
  } else if (connectiveMetrics.unique >= 4) {
    strengths.push("Os conectivos ajudam a costurar bem as partes do texto.");
  }

  if (!hasExplicitProposal || interventionComponentCount < 4) {
    diagnosticMessages.push("A conclusão apresenta solução, mas sem agente ou meio de execução suficientes.");
    mainProblems.push("A proposta de intervenção ficou incompleta.");
  } else {
    strengths.push("A proposta de intervenção já apresenta vários elementos exigidos pela C5.");
  }

  if (!hasExplicitProposal || interventionComponentCount < 4) {
    mainProblems.push("Proposta generica nao foi tratada como intervencao completa.");
  }

  if (proposalNeedsSpecificAgent) {
    diagnosticMessages.push("O agente da proposta ficou genérico demais.");
    mainProblems.push("Agentes como 'todos' ou 'a sociedade' enfraquecem a intervenção quando não são especificados.");
  }

  if (humanRightsViolationCount > 0) {
    criticalAlerts.push("A proposta de intervenção feriu os direitos humanos e, por isso, a C5 foi zerada.");
  }

  nextSteps.push(weakestCompetency.improvement);

  if (tangenciamento) {
    nextSteps.push("Reescreva a introdução com o recorte exato do tema e faça cada desenvolvimento responder diretamente a ele.");
  }

  if (repertoireAnalysis.decorated >= ESSAY_DECORATED_REPERTOIRE_LIMIT) {
    nextSteps.push("Troque referência decorativa por repertório contextualizado e realmente usado para provar a tese.");
  }

  if (repeatedArgumentPairs > 0 || missingPromises.length > 0) {
    nextSteps.push("Planeje antes de escrever: defina a tese, as duas causas e o que cada desenvolvimento vai acrescentar de novo.");
  }

  if (!hasExplicitProposal || interventionComponentCount < 4 || proposalNeedsSpecificAgent) {
    nextSteps.push("Feche a redação com ação, agente específico, meio de execução, finalidade e detalhamento.");
  }

  if (paragraphDensityMetrics.hollowCount > 0) {
    diagnosticMessages.push("Ha paragrafo oco: existe volume textual com pouca entrega real de ideia.");
    mainProblems.push("Pelo menos um desenvolvimento repete a tese ou gira em torno dela sem aprofundar.");
  }

  if (paragraphDensityMetrics.abstractOverload) {
    diagnosticMessages.push("A argumentacao ficou abstrata demais em parte do texto.");
    mainProblems.push("Ha frases amplas e bonitas, mas com pouca concretude probatoria.");
  }

  if (decoratedEssayRisk) {
    diagnosticMessages.push("Ha sinais de redacao decorada ou artificial.");
  }

  const introHasTheme = themeCoverage.introHits > 0;
  const introHasThesis = thesisMarkerCount > 0 || promisedIdeas.length >= 2;
  const introDelimitsRecorte = promisedIdeas.length >= 2 || themeCoverage.introHits >= 2;
  const introRepertoireHits = countEssayAnalysisMatches(introText, ESSAY_LOCAL_REPERTOIRE_MARKERS);
  const introRepertoireSupport =
    countEssayAnalysisMatches(introText, ESSAY_LOCAL_REPERTOIRE_SUPPORT_MARKERS) +
    countEssayAnalysisMatches(introText, ESSAY_LOCAL_CAUSAL_MARKERS) +
    countEssayAnalysisMatches(introText, ESSAY_LOCAL_EXAMPLE_MARKERS);
  const introRepertoireQuality =
    introRepertoireHits === 0
      ? "sem repertorio inicial"
      : introRepertoireSupport > 0 && themeCoverage.introHits > 0
        ? "forte"
        : themeCoverage.introHits > 0
          ? "valido, mas superficial"
          : "decorativo";
  const conclusionRetakesProblem = themeCoverage.conclusionHits > 0 || conclusionSimilarity >= 0.12;
  const conclusionHasProposal = hasExplicitProposal;
  const conclusionExecutionDetailed = interventionComponentCount >= 4 && !proposalNeedsSpecificAgent;
  const conclusionClosesReasoning = !conclusionDisconnected && (conclusionMarkerCount > 0 || interventionComponentCount >= 3);
  const conclusionRepeatsOpening = conclusionSimilarity >= 0.45 && interventionComponentCount < 3;
  const introductionDiagnosis = dedupeFeedbackList([
    introHasTheme ? "A introducao apresenta o tema." : "A introducao ainda nao apresenta o tema com clareza.",
    introHasThesis ? "A introducao ja traz uma tese identificavel." : "A introducao ainda nao firma uma tese clara.",
    introDelimitsRecorte
      ? "A abertura delimita recortes, causas ou eixos de desenvolvimento."
      : "A abertura ainda nao delimita bem causas, efeitos ou recortes.",
    introRepertoireQuality === "forte"
      ? "O repertorio inicial funciona como apoio produtivo ao argumento."
      : introRepertoireQuality === "valido, mas superficial"
        ? "O repertorio inicial e valido, mas ainda superficial."
        : introRepertoireQuality === "decorativo"
          ? "O repertorio inicial aparece mais como enfeite do que como prova."
          : "A introducao nao depende de repertorio inicial para existir, mas pode ganhar forca com um repertorio bem articulado.",
  ], 6);
  const conclusionDiagnosis = dedupeFeedbackList([
    conclusionRetakesProblem
      ? "A conclusao retoma o problema discutido no texto."
      : "A conclusao ainda nao retoma com clareza o problema desenvolvido.",
    conclusionHasProposal
      ? "A conclusao apresenta proposta de intervencao."
      : "A conclusao ainda nao apresenta proposta de intervencao explicita.",
    conclusionExecutionDetailed
      ? "A execucao da proposta aparece com agente, meio e finalidade mais bem definidos."
      : "A proposta ainda precisa detalhar melhor execucao, agente ou finalidade.",
    conclusionClosesReasoning
      ? "A conclusao fecha o raciocinio com alguma organicidade."
      : "A conclusao ainda nao fecha o raciocinio de forma organica.",
    conclusionRepeatsOpening
      ? "A conclusao corre o risco de apenas repetir a introducao."
      : "A conclusao vai alem da simples repeticao da abertura.",
  ], 6);
  const riskNotes = dedupeFeedbackList([
    tangenciamento || (!tangenciamento && themeCoverage.coverage < ESSAY_TANGENCY_LIMIT + 0.08)
      ? "Texto limitrofe entre tangenciamento e abordagem parcial do recorte."
      : "",
    !conclusionHasProposal && interventionComponentCount >= 2
      ? "Ha tracos de intervencao, mas a proposta ainda nao esta plenamente desenvolvida."
      : "",
    bodyParagraphsWithSubstance >= 2 &&
    (repeatedArgumentPairs > 0 || paragraphDensityMetrics.overallMaturity === "descritivo" || decoratedEssayRisk)
      ? "Ha organizacao, mas pouca autoria argumentativa."
      : "",
    decoratedEssayRisk ? "Ha sinais de artificialidade, com abertura pronta, repertorio mecanico ou proposta formulaica." : "",
    confidenceLevel !== "alta" ? "A leitura automatica pede cautela e pode precisar de revisao humana." : "",
    disconnectedParagraphMetrics.count > 0 ? "Ha mudanca de direcao ou trecho desconectado do projeto argumentativo." : "",
    "A nota final e uma estimativa tecnica automatizada, nao uma correcao oficial do ENEM.",
  ], 8);
  const ceilingAnalysis = getEssayCeilingAnalysis({
    textualTypeInvalid,
    totalThemeVoid,
    tangenciamento,
    thesisVague,
    missingPromises,
    proposalNeedsSpecificAgent,
    interventionComponentCount,
    repertoireAnalysis,
    connectiveRepetitionIssue,
    repeatedArgumentPairs,
    scores: {
      competency1: competency1Score,
      competency2: competency2Score,
      competency3: competency3Score,
      competency4: competency4Score,
      competency5: competency5Score,
    },
  });
  const improvementLadder = {
    quickFixes: dedupeFeedbackList([
      proposalNeedsSpecificAgent ? "Ajuste rapido: nomeie um agente especifico na intervencao." : "",
      tangenciamento ? "Ajuste rapido: explicite o recorte exato do tema logo na introducao." : "",
      connectiveRepetitionIssue ? "Ajuste rapido: corte a repeticao dos mesmos conectivos." : "",
      copyMetrics.excessive ? "Ajuste rapido: substitua trechos copiados por formulacao autoral." : "",
      thesisVague ? "Ajuste rapido: escreva uma tese mais objetiva na primeira parte do texto." : "",
      "Ajuste rapido: revise a abertura e a conclusao para deixar a linha de raciocinio ainda mais nitida.",
    ], 5),
    competenceImprovements: dedupeFeedbackList([
      weakestCompetency.improvement,
      competency3Score < 160 ? "Melhora de competencia: aprofunde o segundo desenvolvimento com causa, efeito e exemplificacao." : "",
      competency2Score < 160 ? "Melhora de competencia: troque repertorio apenas valido por repertorio forte e articulado." : "",
      competency4Score < 160 ? "Melhora de competencia: melhore a progressao logica entre os paragrafos, nao so os conectivos." : "",
      competency5Score < 160 ? "Melhora de competencia: complete a intervencao com acao, agente, meio, finalidade e detalhamento." : "",
    ], 5),
    bandLeapSteps: dedupeFeedbackList([
      ceilingAnalysis.currentCeiling <= 600
        ? "Salto de faixa: estabilize tema, tese e proposta para sair da zona mediana."
        : "",
      ceilingAnalysis.currentCeiling <= 800
        ? "Salto de faixa: troque argumentacao previsivel por desenvolvimento analitico com mais densidade."
        : "",
      ceilingAnalysis.currentCeiling <= 960
        ? "Salto de faixa: substitua repertorio decorativo por repertorio produtivo e refine a coesao real."
        : "",
      ceilingAnalysis.currentCeiling < 1000
        ? "Salto de faixa: remova as travas finais das competencias e busque acabamento de topo em C1 a C5."
        : "",
    ], 5),
  };
  const feedbackModes = {
    studentSummary: `${fallbackPrefix} Esta e uma estimativa automatizada. Sua redacao ficou em ${totalScore} pontos, com perfil ${profileLabel}. O teto atual estimado esta em ${ceilingAnalysis.currentCeiling} pontos, e o foco principal agora esta em ${weakestCompetency.name.toLowerCase()}.`,
    technicalSummary: `${fallbackPrefix} Esta leitura e aproximativa, nao oficial. Perfil ${profileLabel}, confianca ${confidenceLevel}, tema ${themeStatus}. Placar tecnico: C1 ${competency1Score}, C2 ${competency2Score}, C3 ${competency3Score}, C4 ${competency4Score}, C5 ${competency5Score}. Teto atual estimado em ${ceilingAnalysis.currentCeiling}, travado por: ${ceilingAnalysis.locks.join(" | ") || "nenhuma trava estrutural relevante"}.`,
  };
  const rewritingGuidance = {
    introduction: tangenciamento || thesisVague
      ? "Reescreva a introducao com tema, tese e dois eixos claros de desenvolvimento, evitando abertura vaga."
      : "Mantenha a introducao curta, mas deixe ainda mais nitidos o recorte e a tese prometida.",
    topicSentence: paragraphDensityMetrics.hollowCount > 0 || repeatedArgumentPairs > 0
      ? "Abra o desenvolvimento com um topico frasal que avance a tese e nao apenas repita a introducao."
      : "Refine o topico frasal para que cada paragrafo entregue uma ideia nova e reconhecivel.",
    repertoire: repertoireAnalysis.productive > 0
      ? "Aprimore o repertorio que ja e valido, contextualizando melhor como ele prova o argumento."
      : "Troque repertorio decorativo ou generico por referencia pertinente, contextualizada e util para provar algo.",
    argumentativeLink: missingPromises.length > 0 || conclusionDisconnected || connectiveRepetitionIssue
      ? "Amarre melhor a progressao: recupere o que foi prometido na introducao e faca a conclusao responder ao desenvolvimento."
      : "Fortaleca a amarracao entre um desenvolvimento e outro, deixando a progressao mais organica.",
    intervention: humanRightsViolationCount > 0
      ? "Reescreva a intervencao com medida legitima, respeitosa e compativel com os direitos humanos."
      : proposalNeedsSpecificAgent || interventionComponentCount < 4
        ? "Complete a intervencao com agente especifico, acao, meio, finalidade e detalhamento operacional."
        : "A proposta ja existe, mas pode ganhar mais precisao de execucao para subir a C5.",
  };

  const evidenceMap = {
    thesis: thesisSentence,
    repertoire: repertoireAnalysis.productiveExcerpt || repertoireAnalysis.genericExcerpt || repertoireAnalysis.decoratedExcerpt,
    cohesion: cohesionSentence,
    intervention: interventionSentence,
    problemExcerpt: buildEssayExcerpt(
      copyMetrics.excerpt ||
        disconnectedParagraphMetrics.excerpt ||
        repeatedArgumentExcerpt ||
        repertoireAnalysis.decoratedExcerpt ||
        interventionSentence,
      220
    ),
  };
  const calibrationMeta = {
    enabled: ESSAY_CALIBRATION_MODE,
    recommendedHumanReview: confidenceLevel !== "alta" || Boolean(criticalAlerts.length),
    scoreProfile: `${profileLabel} | ${themeStatus} | confianca ${confidenceLevel}`,
    checkpoints: [
      `Tema e assunto: ${themeStatus}.`,
      `Texto aproveitavel: ${effectiveWordCount}/${wordCount} palavras.`,
      `Repertorio produtivo/generico/decorado: ${repertoireAnalysis.productive}/${repertoireAnalysis.generic}/${repertoireAnalysis.decorated}.`,
      `Proposta de intervencao: ${interventionComponentCount} elemento(s) validos.`,
      `Copia nao autoral detectada: ${copyMetrics.excessive ? "sim" : "nao"}.`,
      `Discrepancia potencial para revisao humana: ${confidenceLevel === "baixa" ? "alta" : "controlada"}.`,
    ].filter(Boolean),
  };
  const auditTrail = {
    rubricVersion: ESSAY_RUBRIC_VERSION,
    promptVersion: ESSAY_PROMPT_VERSION,
    rulesApplied: dedupeFeedbackList([
      "pre-analise textual",
      "checagem de tipo dissertativo-argumentativo",
      "contagem de texto aproveitavel",
      "leitura de tangenciamento e fuga total",
      "classificacao de repertorio produtivo/generico/decorado",
      "organizacao formal nao equivale a forca argumentativa",
      "repertorio famoso nao equivale a repertorio produtivo",
      "densidade argumentativa por paragrafo",
      "checagem de consistencia interna",
      "cohesao por conectivos e progressao logica",
      "conectivo nao equivale a coesao automatica",
      "analise da proposta de intervencao",
      "proposta generica nao equivale a intervencao completa",
      "assunto amplo nao equivale a atendimento pleno ao tema",
      "estimativa de teto por faixa",
      "resultado aproximativo, nao oficial",
    ], 16),
    locksTriggered: dedupeFeedbackList([
      ...criticalAlerts,
      ...ceilingAnalysis.locks,
      tangenciamento ? "trava de tangenciamento" : "",
      textualTypeInvalid ? "bloqueio por estrutura incompatível" : "",
      totalThemeVoid ? "bloqueio por fuga total ao tema" : "",
      thesisVague ? "tese vaga" : "",
      proposalNeedsSpecificAgent ? "proposta com agente generico" : "",
      paragraphDensityMetrics.hollowCount > 0 ? "paragrafo oco" : "",
      paragraphDensityMetrics.abstractOverload ? "argumentacao abstrata demais" : "",
      decoratedEssayRisk ? "sinais de redacao decorada" : "",
    ], 12),
    evidenceUsed: dedupeFeedbackList([
      evidenceMap.thesis ? `tese: ${evidenceMap.thesis}` : "",
      evidenceMap.repertoire ? `repertorio: ${evidenceMap.repertoire}` : "",
      evidenceMap.cohesion ? `coesao: ${evidenceMap.cohesion}` : "",
      evidenceMap.intervention ? `intervencao: ${evidenceMap.intervention}` : "",
      evidenceMap.problemExcerpt ? `problema: ${evidenceMap.problemExcerpt}` : "",
      paragraphDensityMetrics.hollowExcerpt ? `paragrafo oco: ${paragraphDensityMetrics.hollowExcerpt}` : "",
      disconnectedParagraphMetrics.excerpt ? `trecho desconectado: ${disconnectedParagraphMetrics.excerpt}` : "",
    ], 10),
  };

  return normalizeEssayEvaluation({
    competencies,
    totalScore,
    summaryFeedback: feedbackModes.studentSummary,
    strengths: [
      `${strongestCompetency.name} foi a competencia mais consistente nesta leitura automatizada.`,
      ...strengths,
    ],
    mainProblems: [
      `${weakestCompetency.name} ficou com a menor nota nesta estimativa.`,
      ...mainProblems,
    ],
    nextSteps,
    interventionFeedback:
      humanRightsViolationCount > 0
        ? "A proposta de intervencao feriu os direitos humanos. Reescreva a conclusao com medida legitima, viavel e socialmente responsavel."
        : interventionComponentCount >= 4 && !proposalNeedsSpecificAgent
          ? "A proposta de intervencao ja aparece de forma valida, mas ainda pode ganhar mais detalhamento para subir a nota."
          : "A proposta de intervencao precisa ficar mais completa, com agente especifico, acao, meio, finalidade e detalhamento mais claros.",
    highlightedExcerpts,
    analysisIndicators,
    diagnosticMessages,
    criticalAlerts,
    profileLabel,
    confidenceLevel,
    confidenceNote,
    themeStatus,
    evidenceMap,
    calibrationMeta,
    preAnalysis,
    introductionDiagnosis,
    conclusionDiagnosis,
    riskNotes,
    ceilingAnalysis,
    improvementLadder,
    feedbackModes,
    rewritingGuidance,
    auditTrail,
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
      return buildAdvancedLocalEssayEvaluation(submission, sourceError || pythonError);
    }
  }

  return buildAdvancedLocalEssayEvaluation(submission, sourceError);
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
  const state = String(payload.state || DEFAULT_SESSION_STATE).trim().toLowerCase();
  const type = String(payload.type || (minutes > 20 ? "extra" : "padrao")).trim();
  const startedAt = payload.startedAt ? new Date(payload.startedAt) : new Date();
  const activities = (Array.isArray(payload.activities) ? payload.activities : [])
    .map((activity) => String(activity || "").trim().toLowerCase())
    .filter((activity, index, list) => activity && list.indexOf(activity) === index);
  const verbsText = String(payload.verbsText || "").trim();
  const phrasesText = String(payload.phrasesText || "").trim();
  const notes = String(payload.notes || "").trim();

  if (!Number.isFinite(minutes) || minutes < MIN_START_SESSION_MINUTES) {
    throw createError(400, `Informe pelo menos ${MIN_START_SESSION_MINUTES} minutos.`);
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
  const state = String(payload.state || DEFAULT_SESSION_STATE).trim().toLowerCase();
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

  if (!Number.isFinite(minutes) || minutes < MIN_START_SESSION_MINUTES) {
    throw createError(400, `Informe pelo menos ${MIN_START_SESSION_MINUTES} minutos.`);
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

function handleRoutineTemplates(request, response) {
  const user = getAuthenticatedUser(request);

  if (!user) {
    throw createError(401, "Sessão não encontrada.");
  }

  sendJson(response, 200, { templates: getRoutineTemplates() });
}

function handleRoutinePreferences(request, response) {
  const user = getAuthenticatedUser(request);

  if (!user) {
    throw createError(401, "Sessão não encontrada.");
  }

  sendJson(response, 200, {
    preferences: getRoutinePreferences(user.id),
    customSubjectSuggestions: getRoutineCustomSubjectSuggestions(user.id),
  });
}

async function handleUpdateRoutinePreferences(request, response) {
  const user = getAuthenticatedUser(request);

  if (!user) {
    throw createError(401, "Sessão não encontrada.");
  }

  const payload = await readRequestBody(request);
  const preferences = saveRoutinePreferences(user.id, payload);

  sendJson(response, 200, {
    preferences,
    customSubjectSuggestions: getRoutineCustomSubjectSuggestions(user.id),
  });
}

function handleCurrentRoutinePlan(request, response) {
  const user = getAuthenticatedUser(request);

  if (!user) {
    throw createError(401, "Sessão não encontrada.");
  }

  sendJson(response, 200, {
    plan: getRoutinePlanResponse(user.id, getWeekStartDateKey(new Date())),
  });
}

async function handleGenerateRoutinePlan(request, response) {
  const user = getAuthenticatedUser(request);

  if (!user) {
    throw createError(401, "Sessão não encontrada.");
  }

  const payload = await readRequestBody(request);

  if (Object.keys(payload || {}).length) {
    saveRoutinePreferences(user.id, payload);
  }

  sendJson(response, 201, {
    plan: generateRoutinePlan(user.id),
  });
}

function handleRoutinePlanByWeek(request, response, rawWeekStart) {
  const user = getAuthenticatedUser(request);

  if (!user) {
    throw createError(401, "Sessão não encontrada.");
  }

  const weekStartKey = String(rawWeekStart || "").trim();

  if (!/^\d{4}-\d{2}-\d{2}$/.test(weekStartKey)) {
    throw createError(400, "Semana inválida.");
  }

  const plan = getRoutinePlanResponse(user.id, weekStartKey);

  if (!plan) {
    throw createError(404, "Rotina da semana não encontrada.");
  }

  sendJson(response, 200, { plan });
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
    const safeEssayError = normalizeEssayServiceError(error);

    if (ESSAY_EVALUATION_MODE === "openai") {
      const submission = markEssaySubmissionFailed(
        user.id,
        pendingSubmission.id,
        safeEssayError.message || "N\u00e3o foi poss\u00edvel corrigir a reda\u00e7\u00e3o com IA."
      );
      const statusCode =
        Number.isInteger(safeEssayError?.statusCode) && safeEssayError.statusCode >= 400
          ? safeEssayError.statusCode
          : 502;

      sendJson(response, statusCode, {
        error: submission.errorMessage || "N\u00e3o foi poss\u00edvel corrigir a reda\u00e7\u00e3o com IA.",
        submission,
      });
      return;
    }

    try {
      const fallbackEvaluation = evaluateEssayLocally(pendingSubmission, safeEssayError);
      const submission = markEssaySubmissionEvaluated(user.id, pendingSubmission.id, fallbackEvaluation);
      sendJson(response, 201, { submission, fallbackMode: "local" });
    } catch (fallbackError) {
      const safeFallbackError = normalizeEssayServiceError(fallbackError);
      const submission = markEssaySubmissionFailed(
        user.id,
        pendingSubmission.id,
        safeFallbackError?.message || safeEssayError?.message || "N\u00e3o foi poss\u00edvel corrigir a reda\u00e7\u00e3o."
      );
      const statusCode =
        Number.isInteger(safeFallbackError?.statusCode) && safeFallbackError.statusCode >= 400
          ? safeFallbackError.statusCode
          : Number.isInteger(safeEssayError?.statusCode) && safeEssayError.statusCode >= 400
            ? safeEssayError.statusCode
            : 502;

      sendJson(response, statusCode, {
        error: submission.errorMessage || "N\u00e3o foi poss\u00edvel corrigir a reda\u00e7\u00e3o.",
        submission,
      });
    }
  }
}

function handleAdminQuestionBankReference(request, response) {
  const user = getAuthenticatedUser(request);
  ensureAdmin(user);

  sendJson(response, 200, {
    reference: buildQuestionBankReferenceData(),
    overview: questionBankAdminOverviewStatement.get(),
  });
}

async function handleCreateQuestionBankExam(request, response) {
  const user = getAuthenticatedUser(request);
  ensureAdmin(user);

  const payload = await readRequestBody(request);
  const nome = sanitizeQuestionBankExamName(payload.nome);
  const sigla = sanitizeQuestionBankExamSigla(payload.sigla);
  const descricao = sanitizeQuestionBankDescription(payload.descricao);

  if (!nome || !sigla) {
    throw createError(400, "Informe nome e sigla do vestibular.");
  }

  const existingExam = findQuestionBankExamBySiglaStatement.get(sigla);

  if (existingExam) {
    throw createError(409, "Ja existe um vestibular com essa sigla.");
  }

  const result = insertQuestionBankExamStatement.run(nome, sigla, descricao, 1, nowIso());
  sendJson(response, 201, {
    vestibular: serializeQuestionBankExam(findQuestionBankExamByIdStatement.get(result.lastInsertRowid)),
  });
}

function handleListQuestionProofs(request, response) {
  const user = getAuthenticatedUser(request);
  ensureAdmin(user);

  sendJson(response, 200, {
    overview: questionBankAdminOverviewStatement.get(),
    proofs: listQuestionProofsStatement.all().map((row) => serializeQuestionProofRow(row)),
  });
}

async function handleCreateQuestionProof(request, response) {
  const user = getAuthenticatedUser(request);
  ensureAdmin(user);

  const payload = await readRequestBody(request, {
    maxBytes: QUESTION_BANK_UPLOAD_LIMIT_BYTES,
  });
  const vestibularId = resolveQuestionBankExamId(payload);
  const normalizedProof = sanitizeQuestionProofPayload(payload);

  if (!payload?.pdfFile) {
    throw createError(400, "Envie o PDF original da prova.");
  }

  const savedPdf = await saveQuestionBankPdfFile(payload.pdfFile);

  if (!savedPdf) {
    throw createError(400, "Nao foi possivel salvar o PDF da prova.");
  }

  try {
    const timestamp = nowIso();
    const result = insertQuestionProofStatement.run(
      vestibularId,
      normalizedProof.ano,
      normalizedProof.fase,
      normalizedProof.versao,
      normalizedProof.materiaGeral,
      savedPdf.storedFileName,
      savedPdf.originalName,
      savedPdf.mimeType,
      savedPdf.sizeBytes,
      normalizedProof.extractedText,
      normalizedProof.processStatus,
      normalizedProof.status,
      timestamp,
      timestamp
    );

    sendJson(response, 201, {
      proof: serializeQuestionProofRow(
        getQuestionProofByIdStatement.get(result.lastInsertRowid),
        { includeExtractedText: true }
      ),
    });
  } catch (error) {
    try {
      await unlink(getQuestionBankUploadFilePath(savedPdf.storedFileName));
    } catch {
      // Mantem o foco no erro principal do fluxo.
    }

    throw error;
  }
}

function handleGetQuestionProof(request, response, rawProofId) {
  const user = getAuthenticatedUser(request);
  ensureAdmin(user);

  const proofId = Number(rawProofId);

  if (!Number.isInteger(proofId) || proofId <= 0) {
    throw createError(400, "Prova invalida.");
  }

  const proofRow = getQuestionProofByIdStatement.get(proofId);

  if (!proofRow) {
    throw createError(404, "Prova nao encontrada.");
  }

  sendJson(response, 200, {
    proof: serializeQuestionProofRow(proofRow, { includeExtractedText: true }),
    questions: listAdminQuestionsByProof(proofId),
  });
}

async function handleUpdateQuestionProof(request, response, rawProofId) {
  const user = getAuthenticatedUser(request);
  ensureAdmin(user);

  const proofId = Number(rawProofId);

  if (!Number.isInteger(proofId) || proofId <= 0) {
    throw createError(400, "Prova invalida.");
  }

  const currentProofRow = getQuestionProofByIdStatement.get(proofId);

  if (!currentProofRow) {
    throw createError(404, "Prova nao encontrada.");
  }

  const currentProof = serializeQuestionProofRow(currentProofRow, { includeExtractedText: true });
  const payload = await readRequestBody(request, {
    maxBytes: QUESTION_BANK_UPLOAD_LIMIT_BYTES,
  });
  const vestibularId =
    payload?.vestibularId !== undefined ||
    payload?.examId !== undefined ||
    payload?.vestibularNome !== undefined ||
    payload?.vestibularSigla !== undefined
      ? resolveQuestionBankExamId(payload)
      : currentProof.vestibular.id;
  const normalizedProof = sanitizeQuestionProofPayload(payload, currentProof);
  let savedPdf = null;

  if (payload?.pdfFile) {
    savedPdf = await saveQuestionBankPdfFile(payload.pdfFile);
  }

  const previousPdfFilePath = currentProof.pdf.filePath;

  try {
    updateQuestionProofStatement.run(
      vestibularId,
      normalizedProof.ano,
      normalizedProof.fase,
      normalizedProof.versao,
      normalizedProof.materiaGeral,
      savedPdf?.storedFileName || previousPdfFilePath,
      savedPdf?.originalName || currentProof.pdf.originalName,
      savedPdf?.mimeType || currentProof.pdf.mimeType || "application/pdf",
      savedPdf?.sizeBytes || currentProof.pdf.sizeBytes || 0,
      normalizedProof.extractedText,
      normalizedProof.processStatus,
      normalizedProof.status,
      nowIso(),
      proofId
    );

    if (savedPdf && previousPdfFilePath && previousPdfFilePath !== savedPdf.storedFileName) {
      try {
        await unlink(getQuestionBankUploadFilePath(previousPdfFilePath));
      } catch {
        // O arquivo antigo nao deve impedir o fluxo principal.
      }
    }

    sendJson(response, 200, {
      proof: serializeQuestionProofRow(
        getQuestionProofByIdStatement.get(proofId),
        { includeExtractedText: true }
      ),
      questions: listAdminQuestionsByProof(proofId),
    });
  } catch (error) {
    if (savedPdf?.storedFileName) {
      try {
        await unlink(getQuestionBankUploadFilePath(savedPdf.storedFileName));
      } catch {
        // Mantem o foco no erro principal do fluxo.
      }
    }

    throw error;
  }
}

async function handleProcessQuestionProof(request, response, rawProofId) {
  const user = getAuthenticatedUser(request);
  ensureAdmin(user);

  const proofId = Number(rawProofId);

  if (!Number.isInteger(proofId) || proofId <= 0) {
    throw createError(400, "Prova invalida.");
  }

  const proofRow = getQuestionProofByIdStatement.get(proofId);

  if (!proofRow) {
    throw createError(404, "Prova nao encontrada.");
  }

  const proof = serializeQuestionProofRow(proofRow, { includeExtractedText: true });
  const payload = await readRequestBody(request, {
    maxBytes: QUESTION_BANK_UPLOAD_LIMIT_BYTES,
  });
  const replaceExisting = Boolean(payload?.replaceExisting);
  const attemptsOnProof = Number(countQuestionAttemptsForProofStatement.get(proofId)?.total) || 0;

  if (attemptsOnProof > 0) {
    throw createError(400, "Essa prova ja tem tentativas registradas e nao pode ser reprocessada.");
  }

  if (proof.counts.totalQuestions > 0 && !replaceExisting) {
    throw createError(400, "Essa prova ja possui questoes. Use a opcao de reprocessar substituindo as anteriores.");
  }

  let extractedText = payload?.extractedText === undefined
    ? String(proof.extractedText || "")
    : sanitizeQuestionBankMultilineText(payload.extractedText, 220_000);

  if (!extractedText) {
    extractedText = tryExtractTextFromPdfFile(proof.pdf.filePath);
  }

  const parsedQuestions = parseQuestionsFromExtractedText(extractedText, {
    fallbackMatter: proof.materiaGeral,
    originLabel: `${proof.vestibular.sigla} ${proof.ano}`.trim(),
  });

  withTransaction(() => {
    if (replaceExisting) {
      deleteQuestionsByProofStatement.run(proofId);
    }

    parsedQuestions.forEach((questionDraft) => {
      const createdAt = nowIso();
      const insertResult = insertQuestionStatement.run(
        proofId,
        sanitizeQuestionNumber(questionDraft.numero || 0, { allowEmpty: true }),
        sanitizeQuestionBankMultilineText(questionDraft.enunciado || "", 20_000),
        normalizeQuestionBankTerm(questionDraft.materia || proof.materiaGeral || "", 80),
        normalizeQuestionBankTerm(questionDraft.tema || "", 120),
        sanitizeQuestionDifficulty(questionDraft.dificuldade, "media"),
        sanitizeQuestionAlternativeLetter(questionDraft.respostaCorreta, true),
        sanitizeQuestionReviewStatus(questionDraft.statusRevisao || "pending"),
        sanitizeQuestionBankMultilineText(questionDraft.origemPdf || "", 220).replace(/\n+/g, " ").trim(),
        "",
        normalizeQuestionBankTerm(questionDraft.sugestaoMateria || questionDraft.materia || "", 80),
        normalizeQuestionBankTerm(questionDraft.sugestaoTema || questionDraft.tema || "", 120),
        sanitizeQuestionDifficulty(questionDraft.sugestaoDificuldade || questionDraft.dificuldade || "media"),
        createdAt,
        createdAt,
        ""
      );
      const questionId = Number(insertResult.lastInsertRowid) || 0;

      saveQuestionAlternatives(
        questionId,
        sanitizeQuestionAlternatives(questionDraft.alternativas || [], { includeEmptySlots: true })
      );
      refreshQuestionStats(questionId);
    });

    updateQuestionProofProcessStatement.run(
      extractedText,
      parsedQuestions.length ? "processed" : "needs_review",
      parsedQuestions.length ? "review" : sanitizeQuestionProofStatus(proof.status),
      nowIso(),
      proofId
    );
  });

  sendJson(response, 200, {
    proof: serializeQuestionProofRow(
      getQuestionProofByIdStatement.get(proofId),
      { includeExtractedText: true }
    ),
    importedQuestions: parsedQuestions.length,
    questions: listAdminQuestionsByProof(proofId),
    warning: parsedQuestions.length ? "" : "Nao foi possivel separar questoes automaticamente a partir do texto informado.",
  });
}

function handlePublishQuestionProof(request, response, rawProofId) {
  const user = getAuthenticatedUser(request);
  ensureAdmin(user);

  const proofId = Number(rawProofId);

  if (!Number.isInteger(proofId) || proofId <= 0) {
    throw createError(400, "Prova invalida.");
  }

  const proofRow = getQuestionProofByIdStatement.get(proofId);

  if (!proofRow) {
    throw createError(404, "Prova nao encontrada.");
  }

  const proof = serializeQuestionProofRow(proofRow);

  if (proof.counts.approvedQuestions <= 0) {
    throw createError(400, "A prova precisa ter pelo menos uma questao aprovada antes da publicacao.");
  }

  const publishedAt = nowIso();

  withTransaction(() => {
    updateQuestionProofStatusStatement.run("published", publishedAt, proofId);
    publishApprovedQuestionsByProofStatement.run(publishedAt, publishedAt, proofId);
  });

  sendJson(response, 200, {
    proof: serializeQuestionProofRow(
      getQuestionProofByIdStatement.get(proofId),
      { includeExtractedText: true }
    ),
    questions: listAdminQuestionsByProof(proofId),
  });
}

async function handleCreateAdminQuestion(request, response) {
  const user = getAuthenticatedUser(request);
  ensureAdmin(user);

  const payload = await readRequestBody(request);
  const normalizedQuestion = sanitizeQuestionPayload(payload, {
    allowEmptyNumber: false,
  });
  const proofRow = getQuestionProofByIdStatement.get(normalizedQuestion.proofId);

  if (!proofRow) {
    throw createError(404, "Prova nao encontrada.");
  }

  const publishedAt = resolveQuestionPublishedAt(proofRow, normalizedQuestion.statusRevisao);
  let questionId = 0;

  withTransaction(() => {
    const createdAt = nowIso();
    const result = insertQuestionStatement.run(
      normalizedQuestion.proofId,
      normalizedQuestion.numero,
      normalizedQuestion.enunciado,
      normalizedQuestion.materia,
      normalizedQuestion.tema,
      normalizedQuestion.dificuldade,
      normalizedQuestion.respostaCorreta,
      normalizedQuestion.statusRevisao,
      normalizedQuestion.origemPdf,
      normalizedQuestion.observacoesAdm,
      normalizedQuestion.sugestaoMateria,
      normalizedQuestion.sugestaoTema,
      normalizedQuestion.sugestaoDificuldade,
      createdAt,
      createdAt,
      publishedAt
    );
    questionId = Number(result.lastInsertRowid) || 0;
    saveQuestionAlternatives(questionId, normalizedQuestion.alternatives);
    refreshQuestionStats(questionId);
  });

  sendJson(response, 201, {
    question: getAdminQuestionById(questionId),
  });
}

async function handleUpdateAdminQuestion(request, response, rawQuestionId) {
  const user = getAuthenticatedUser(request);
  ensureAdmin(user);

  const questionId = Number(rawQuestionId);

  if (!Number.isInteger(questionId) || questionId <= 0) {
    throw createError(400, "Questao invalida.");
  }

  const currentQuestion = getQuestionByIdStatement.get(questionId);

  if (!currentQuestion) {
    throw createError(404, "Questao nao encontrada.");
  }

  const payload = await readRequestBody(request);
  const normalizedQuestion = sanitizeQuestionPayload(
    {
      ...payload,
      provaId: currentQuestion.proofId,
    },
    {
      proofId: currentQuestion.proofId,
      allowEmptyNumber: false,
      defaultStatusRevisao: currentQuestion.statusRevisao,
    }
  );
  const proofRow = getQuestionProofByIdStatement.get(currentQuestion.proofId);
  const publishedAt = resolveQuestionPublishedAt(
    proofRow,
    normalizedQuestion.statusRevisao,
    currentQuestion.publishedAt
  );

  withTransaction(() => {
    updateQuestionStatement.run(
      normalizedQuestion.numero,
      normalizedQuestion.enunciado,
      normalizedQuestion.materia,
      normalizedQuestion.tema,
      normalizedQuestion.dificuldade,
      normalizedQuestion.respostaCorreta,
      normalizedQuestion.statusRevisao,
      normalizedQuestion.origemPdf,
      normalizedQuestion.observacoesAdm,
      normalizedQuestion.sugestaoMateria,
      normalizedQuestion.sugestaoTema,
      normalizedQuestion.sugestaoDificuldade,
      nowIso(),
      publishedAt,
      questionId
    );
    saveQuestionAlternatives(questionId, normalizedQuestion.alternatives);
    refreshQuestionStats(questionId);
  });

  sendJson(response, 200, {
    question: getAdminQuestionById(questionId),
  });
}

async function handleDownloadQuestionProofFile(request, response, rawProofId) {
  const user = getAuthenticatedUser(request);
  ensureAdmin(user);

  const proofId = Number(rawProofId);

  if (!Number.isInteger(proofId) || proofId <= 0) {
    throw createError(400, "Prova invalida.");
  }

  const proofRow = getQuestionProofByIdStatement.get(proofId);

  if (!proofRow || !proofRow.pdfFilePath) {
    throw createError(404, "Arquivo da prova nao encontrado.");
  }

  const filePath = getQuestionBankUploadFilePath(proofRow.pdfFilePath);

  if (!filePath || !existsSync(filePath)) {
    throw createError(404, "Arquivo da prova nao encontrado.");
  }

  const downloadName = sanitizeShortText(proofRow.pdfOriginalName || `prova-${proofId}.pdf`, 180) || `prova-${proofId}.pdf`;
  await sendInlinePdfFile(response, filePath, downloadName);
}

async function handleDownloadPublishedQuestionProofFile(request, response, rawProofId) {
  const user = getAuthenticatedUser(request);

  if (!user) {
    throw createError(401, "Sessao nao encontrada.");
  }

  const proofId = Number(rawProofId);

  if (!Number.isInteger(proofId) || proofId <= 0) {
    throw createError(400, "Prova invalida.");
  }

  const proofRow = getQuestionProofByIdStatement.get(proofId);

  if (!proofRow || String(proofRow.status || "") !== "published" || !proofRow.pdfFilePath) {
    throw createError(404, "Arquivo da prova nao encontrado.");
  }

  const filePath = getQuestionBankUploadFilePath(proofRow.pdfFilePath);

  if (!filePath || !existsSync(filePath)) {
    throw createError(404, "Arquivo da prova nao encontrado.");
  }

  const downloadName = sanitizeShortText(proofRow.pdfOriginalName || `prova-${proofId}.pdf`, 180) || `prova-${proofId}.pdf`;
  await sendInlinePdfFile(response, filePath, downloadName);
}

async function handleDownloadQuestionBankCatalogFile(request, response) {
  const user = getAuthenticatedUser(request);

  if (!user) {
    throw createError(401, "Sessao nao encontrada.");
  }

  const requestUrl = new URL(request.url, `http://${request.headers.host}`);
  const ano = Number(requestUrl.searchParams.get("ano") || 0);
  const dia = Number(requestUrl.searchParams.get("dia") || 0);
  const caderno = sanitizeQuestionBankBooklet(requestUrl.searchParams.get("caderno") || "");
  const kind = String(requestUrl.searchParams.get("kind") || "prova").trim().toLowerCase() === "gabarito"
    ? "gabarito"
    : "prova";

  if (!ano || !dia || !caderno) {
    throw createError(400, "Sessao do catalogo invalida.");
  }

  const catalogItem = await findEnemCatalogItem({ ano, dia, caderno }, { repoRoot: projectRoot });

  if (!catalogItem) {
    throw createError(404, "Sessao do catalogo nao encontrada.");
  }

  const fileRecord = kind === "gabarito" ? catalogItem.gabarito : catalogItem.prova;
  const relativeFilePath = String(fileRecord?.principal || "");

  if (!relativeFilePath) {
    throw createError(404, `Arquivo de ${kind === "gabarito" ? "gabarito" : "prova"} nao encontrado.`);
  }

  const filePath = getProjectRelativeFilePath(relativeFilePath, projectRoot);

  if (!filePath || !existsSync(filePath)) {
    throw createError(404, "Arquivo do catalogo nao encontrado.");
  }

  const downloadName = sanitizeShortText(
    fileRecord?.nome_original || `${catalogItem.vestibular || "enem"}-${ano}-d${dia}-${caderno}-${kind}.pdf`,
    180
  ) || `${catalogItem.vestibular || "enem"}-${ano}-d${dia}-${caderno}-${kind}.pdf`;

  await sendInlinePdfFile(response, filePath, downloadName);
}

async function handleQuestionBankReference(request, response) {
  const user = getAuthenticatedUser(request);

  if (!user) {
    throw createError(401, "Sessao nao encontrada.");
  }

  const overview = buildQuestionBankStudentOverview(user.id);
  const catalog = await buildQuestionBankCatalogFallback();

  sendJson(response, 200, {
    reference: buildQuestionBankReferenceData({ publishedOnly: true }),
    overview,
    catalog: {
      ...catalog,
      active: overview.totalAvailable === 0 && catalog.available,
    },
  });
}

async function handleListQuestionBankQuestions(request, response) {
  const user = getAuthenticatedUser(request);

  if (!user) {
    throw createError(401, "Sessao nao encontrada.");
  }

  const requestUrl = new URL(request.url, `http://${request.headers.host}`);
  const questions = listPublishedQuestionBankQuestions(user.id, {
    proofId: requestUrl.searchParams.get("prova"),
    vestibularId: requestUrl.searchParams.get("vestibular"),
    ano: requestUrl.searchParams.get("ano"),
    materia: requestUrl.searchParams.get("materia"),
    dificuldade: requestUrl.searchParams.get("dificuldade"),
    status: requestUrl.searchParams.get("status"),
    limit: requestUrl.searchParams.get("limit"),
  });
  const overview = buildQuestionBankStudentOverview(user.id);
  const catalog = await buildQuestionBankCatalogFallback({
    vestibular: requestUrl.searchParams.get("vestibular"),
    ano: requestUrl.searchParams.get("ano"),
    dia: requestUrl.searchParams.get("dia"),
    caderno: requestUrl.searchParams.get("caderno"),
  });

  sendJson(response, 200, {
    reference: buildQuestionBankReferenceData({ publishedOnly: true }),
    overview,
    questions,
    catalog: {
      ...catalog,
      active: overview.totalAvailable === 0 && catalog.available,
    },
  });
}

function handleQuestionBankAnalytics(request, response) {
  const user = getAuthenticatedUser(request);

  if (!user) {
    throw createError(401, "Sessao nao encontrada.");
  }

  const requestUrl = new URL(request.url, `http://${request.headers.host}`);
  const limit = requestUrl.searchParams.get("limit");

  sendJson(response, 200, {
    attempts: listQuestionAttemptsForAnalytics(user.id, limit || 1000),
    overview: buildQuestionBankStudentOverview(user.id),
  });
}

function handleGetQuestionBankQuestion(request, response, rawQuestionId) {
  const user = getAuthenticatedUser(request);

  if (!user) {
    throw createError(401, "Sessao nao encontrada.");
  }

  const questionId = Number(rawQuestionId);

  if (!Number.isInteger(questionId) || questionId <= 0) {
    throw createError(400, "Questao invalida.");
  }

  const question = getPublishedQuestionForUser(user.id, questionId);

  if (!question) {
    throw createError(404, "Questao nao encontrada.");
  }

  sendJson(response, 200, { question });
}

async function handleCreateQuestionAttempt(request, response, rawQuestionId) {
  const user = getAuthenticatedUser(request);

  if (!user) {
    throw createError(401, "Sessao nao encontrada.");
  }

  const questionId = Number(rawQuestionId);

  if (!Number.isInteger(questionId) || questionId <= 0) {
    throw createError(400, "Questao invalida.");
  }

  const payload = await readRequestBody(request);
  const question = getPublishedQuestionForUser(user.id, questionId, {
    includeCorrectAnswer: true,
  });

  if (!question) {
    throw createError(404, "Questao nao encontrada.");
  }

  const respostaMarcada = sanitizeQuestionAlternativeLetter(payload?.respostaMarcada || payload?.answer);

  if (!question.alternatives.some((alternative) => alternative.letra === respostaMarcada)) {
    throw createError(400, "Escolha uma alternativa valida.");
  }

  const acertou = question.respostaCorreta === respostaMarcada ? 1 : 0;
  const createdAt = nowIso();

  insertQuestionAttemptStatement.run(
    user.id,
    questionId,
    respostaMarcada,
    acertou,
    sanitizeQuestionBankTimeSpent(payload?.tempoGastoSegundos ?? payload?.timeSpentSeconds),
    createdAt
  );

  sendJson(response, 201, {
    result: {
      questaoId: questionId,
      respostaMarcada,
      respostaCorreta: question.respostaCorreta,
      acertou: Boolean(acertou),
      createdAt,
    },
    question: getPublishedQuestionForUser(user.id, questionId, {
      includeCorrectAnswer: true,
    }),
    overview: buildQuestionBankStudentOverview(user.id),
  });
}

async function handleUpdateQuestionState(request, response, rawQuestionId) {
  const user = getAuthenticatedUser(request);

  if (!user) {
    throw createError(401, "Sessao nao encontrada.");
  }

  const questionId = Number(rawQuestionId);

  if (!Number.isInteger(questionId) || questionId <= 0) {
    throw createError(400, "Questao invalida.");
  }

  const question = getPublishedQuestionForUser(user.id, questionId);

  if (!question) {
    throw createError(404, "Questao nao encontrada.");
  }

  const payload = await readRequestBody(request);
  const currentState = getQuestionUserStateStatement.get(user.id, questionId);
  const nextFavorite = Object.prototype.hasOwnProperty.call(payload || {}, "isFavorite")
    ? Boolean(payload.isFavorite)
    : Boolean(currentState?.isFavorite);
  const nextReviewLater = Object.prototype.hasOwnProperty.call(payload || {}, "reviewLater")
    ? Boolean(payload.reviewLater)
    : Boolean(currentState?.reviewLater);

  upsertQuestionUserStateStatement.run(
    user.id,
    questionId,
    nextFavorite ? 1 : 0,
    nextReviewLater ? 1 : 0,
    nowIso()
  );

  sendJson(response, 200, {
    state: serializeQuestionStateRow(getQuestionUserStateStatement.get(user.id, questionId)),
    question: getPublishedQuestionForUser(user.id, questionId),
    overview: buildQuestionBankStudentOverview(user.id),
  });
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

  if (request.method === "GET" && pathname === "/api/routine/templates") {
    handleRoutineTemplates(request, response);
    return;
  }

  if (request.method === "GET" && pathname === "/api/routine/preferences") {
    handleRoutinePreferences(request, response);
    return;
  }

  if (request.method === "PATCH" && pathname === "/api/routine/preferences") {
    await handleUpdateRoutinePreferences(request, response);
    return;
  }

  if (request.method === "POST" && pathname === "/api/routine/plans/generate") {
    await handleGenerateRoutinePlan(request, response);
    return;
  }

  if (request.method === "GET" && pathname === "/api/routine/plans/current") {
    handleCurrentRoutinePlan(request, response);
    return;
  }

  const routinePlanByWeekMatch =
    request.method === "GET" && pathname.match(/^\/api\/routine\/plans\/(\d{4}-\d{2}-\d{2})$/);

  if (routinePlanByWeekMatch) {
    handleRoutinePlanByWeek(request, response, routinePlanByWeekMatch[1]);
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

  if (request.method === "GET" && pathname === "/api/admin/question-bank/reference") {
    handleAdminQuestionBankReference(request, response);
    return;
  }

  if (request.method === "POST" && pathname === "/api/admin/question-bank/vestibulares") {
    await handleCreateQuestionBankExam(request, response);
    return;
  }

  if (request.method === "GET" && pathname === "/api/admin/question-bank/provas") {
    handleListQuestionProofs(request, response);
    return;
  }

  if (request.method === "POST" && pathname === "/api/admin/question-bank/provas") {
    await handleCreateQuestionProof(request, response);
    return;
  }

  const adminQuestionProofFileMatch =
    request.method === "GET" && pathname.match(/^\/api\/admin\/question-bank\/provas\/(\d+)\/file$/);

  if (adminQuestionProofFileMatch) {
    await handleDownloadQuestionProofFile(request, response, adminQuestionProofFileMatch[1]);
    return;
  }

  const adminQuestionProofProcessMatch =
    request.method === "POST" && pathname.match(/^\/api\/admin\/question-bank\/provas\/(\d+)\/process$/);

  if (adminQuestionProofProcessMatch) {
    await handleProcessQuestionProof(request, response, adminQuestionProofProcessMatch[1]);
    return;
  }

  const adminQuestionProofPublishMatch =
    request.method === "POST" && pathname.match(/^\/api\/admin\/question-bank\/provas\/(\d+)\/publish$/);

  if (adminQuestionProofPublishMatch) {
    handlePublishQuestionProof(request, response, adminQuestionProofPublishMatch[1]);
    return;
  }

  const adminQuestionProofMatch =
    pathname.match(/^\/api\/admin\/question-bank\/provas\/(\d+)$/);

  if (request.method === "GET" && adminQuestionProofMatch) {
    handleGetQuestionProof(request, response, adminQuestionProofMatch[1]);
    return;
  }

  if (request.method === "PATCH" && adminQuestionProofMatch) {
    await handleUpdateQuestionProof(request, response, adminQuestionProofMatch[1]);
    return;
  }

  if (request.method === "POST" && pathname === "/api/admin/question-bank/questoes") {
    await handleCreateAdminQuestion(request, response);
    return;
  }

  const adminQuestionMatch =
    request.method === "PATCH" && pathname.match(/^\/api\/admin\/question-bank\/questoes\/(\d+)$/);

  if (adminQuestionMatch) {
    await handleUpdateAdminQuestion(request, response, adminQuestionMatch[1]);
    return;
  }

  if (request.method === "GET" && pathname === "/api/question-bank/reference") {
    await handleQuestionBankReference(request, response);
    return;
  }

  const questionBankProofFileMatch =
    request.method === "GET" && pathname.match(/^\/api\/question-bank\/provas\/(\d+)\/file$/);

  if (questionBankProofFileMatch) {
    await handleDownloadPublishedQuestionProofFile(request, response, questionBankProofFileMatch[1]);
    return;
  }

  if (request.method === "GET" && pathname === "/api/question-bank/catalog/file") {
    await handleDownloadQuestionBankCatalogFile(request, response);
    return;
  }

  if (request.method === "GET" && pathname === "/api/question-bank/questions") {
    await handleListQuestionBankQuestions(request, response);
    return;
  }

  if (request.method === "GET" && pathname === "/api/question-bank/analytics") {
    handleQuestionBankAnalytics(request, response);
    return;
  }

  const questionBankQuestionAttemptMatch =
    request.method === "POST" && pathname.match(/^\/api\/question-bank\/questions\/(\d+)\/attempts$/);

  if (questionBankQuestionAttemptMatch) {
    await handleCreateQuestionAttempt(request, response, questionBankQuestionAttemptMatch[1]);
    return;
  }

  const questionBankQuestionStateMatch =
    request.method === "PATCH" && pathname.match(/^\/api\/question-bank\/questions\/(\d+)\/state$/);

  if (questionBankQuestionStateMatch) {
    await handleUpdateQuestionState(request, response, questionBankQuestionStateMatch[1]);
    return;
  }

  const questionBankQuestionMatch =
    request.method === "GET" && pathname.match(/^\/api\/question-bank\/questions\/(\d+)$/);

  if (questionBankQuestionMatch) {
    handleGetQuestionBankQuestion(request, response, questionBankQuestionMatch[1]);
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
ensureQuestionBankSeedData();
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
    const message =
      statusCode >= 500
        ? "Erro interno do servidor."
        : sanitizePublicErrorMessage(error, "Nao foi possivel concluir a requisicao.");
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
