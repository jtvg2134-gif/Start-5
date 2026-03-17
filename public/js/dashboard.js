const body = document.body;

const menuToggle = document.getElementById("menuToggle");
const menuPanel = document.getElementById("menuPanel");

const modalBackdrop = document.getElementById("sessionModalBackdrop");
const sessionModalModeLabel = document.getElementById("sessionModalModeLabel");
const sessionModalTitle = document.getElementById("sessionModalTitle");
const startSessionButtons = [...document.querySelectorAll("#startSessionButton")];
const closeSessionModalButtons = [...document.querySelectorAll("[data-close-session-modal]")];
const saveSessionButton = document.getElementById("saveSessionButton");
const sessionHelper = document.getElementById("sessionHelper");

const stateButtons = [...document.querySelectorAll("[data-state]")];
const durationButtons = [...document.querySelectorAll("[data-duration]")];
const subjectSelect = document.getElementById("subjectSelect");
const customSubjectField = document.getElementById("customSubjectField");
const customSubjectInput = document.getElementById("customSubjectInput");
const customSubjectSuggestions = document.getElementById("customSubjectSuggestions");
const topicInput = document.getElementById("topicInput");

const extraMinutesBox = document.getElementById("extraMinutesBox");
const extraMinutesInput = document.getElementById("extraMinutesInput");
const verbDetailsField = document.getElementById("verbDetailsField");
const phraseDetailsField = document.getElementById("phraseDetailsField");
const verbsEntryInput = document.getElementById("verbsEntryInput");
const verbsTokenList = document.getElementById("verbsTokenList");
const addVerbButton = document.getElementById("addVerbButton");
const verbModeToggleButton = document.getElementById("verbModeToggleButton");
const verbPickerStatus = document.getElementById("verbPickerStatus");
const verbSuggestions = document.getElementById("verbSuggestions");
const phrasesEntryInput = document.getElementById("phrasesEntryInput");
const phrasesTokenList = document.getElementById("phrasesTokenList");
const notesInput = document.getElementById("notesInput");

const deleteSessionBackdrop = document.getElementById("deleteSessionBackdrop");
const deleteSessionSummary = document.getElementById("deleteSessionSummary");
const confirmDeleteSessionButton = document.getElementById("confirmDeleteSessionButton");
const closeDeleteModalButtons = [...document.querySelectorAll("[data-close-delete-modal]")];

const scoreNumber = document.getElementById("scoreNumber");
const vsYesterdayValue = document.getElementById("vsYesterdayValue");
const vsMonthValue = document.getElementById("vsMonthValue");
const currentStateValue = document.getElementById("currentStateValue");
const goalValue = document.getElementById("goalValue");
const doneValue = document.getElementById("doneValue");
const streakValue = document.getElementById("streakValue");
const focusSubjectNameValue = document.getElementById("focusSubjectNameValue");
const focusSubjectMinutesValue = document.getElementById("focusSubjectMinutesValue");
const focusSubjectDaysValue = document.getElementById("focusSubjectDaysValue");
const focusSubjectTopicValue = document.getElementById("focusSubjectTopicValue");
const focusSubjectInsightText = document.getElementById("focusSubjectInsightText");

const todayDateLabel = document.getElementById("todayDateLabel");
const todayMinutesValue = document.getElementById("todayMinutesValue");
const todayCountValue = document.getElementById("todayCountValue");
const todayStateValue = document.getElementById("todayStateValue");
const todayActivitiesValue = document.getElementById("todayActivitiesValue");
const todayVerbsValue = document.getElementById("todayVerbsValue");
const todayPhraseCountValue = document.getElementById("todayPhraseCountValue");
const todayHighlightTitle = document.getElementById("todayHighlightTitle");
const todayHighlightText = document.getElementById("todayHighlightText");
const todayActivitiesList = document.getElementById("todayActivitiesList");
const todayVerbsList = document.getElementById("todayVerbsList");
const todaySessionsList = document.getElementById("todaySessionsList");
const recentSessionsList = document.getElementById("recentSessionsList");

const weeklyMinutesValue = document.getElementById("weeklyMinutesValue");
const weeklyDaysValue = document.getElementById("weeklyDaysValue");
const weeklyTopActivityValue = document.getElementById("weeklyTopActivityValue");
const weeklyPhraseCountValue = document.getElementById("weeklyPhraseCountValue");
const weeklyInsightTitle = document.getElementById("weeklyInsightTitle");
const weeklyInsightText = document.getElementById("weeklyInsightText");
const weeklyActivityChart = document.getElementById("weeklyActivityChart");
const weeklyDailyChart = document.getElementById("weeklyDailyChart");
const weeklyActivityList = document.getElementById("weeklyActivityList");
const weeklyVerbList = document.getElementById("weeklyVerbList");
const weeklyEssayAverageValue = document.getElementById("weeklyEssayAverageValue");
const weeklyEssayLatestValue = document.getElementById("weeklyEssayLatestValue");
const weeklyEssayList = document.getElementById("weeklyEssayList");
const weeklyEssayCompetencyList = document.getElementById("weeklyEssayCompetencyList");

const monthlyMinutesValue = document.getElementById("monthlyMinutesValue");
const monthlyDaysValue = document.getElementById("monthlyDaysValue");
const monthlyTopActivityValue = document.getElementById("monthlyTopActivityValue");
const monthlyPhraseCountValue = document.getElementById("monthlyPhraseCountValue");
const monthlyInsightTitle = document.getElementById("monthlyInsightTitle");
const monthlyInsightText = document.getElementById("monthlyInsightText");
const monthlyActivityChart = document.getElementById("monthlyActivityChart");
const monthlyWeekChart = document.getElementById("monthlyWeekChart");
const monthlyActivityList = document.getElementById("monthlyActivityList");
const monthlyVerbList = document.getElementById("monthlyVerbList");
const monthlyEssayAverageValue = document.getElementById("monthlyEssayAverageValue");
const monthlyEssayLatestValue = document.getElementById("monthlyEssayLatestValue");
const monthlyEssayList = document.getElementById("monthlyEssayList");
const monthlyEssayCompetencyList = document.getElementById("monthlyEssayCompetencyList");

const DAILY_GOALS = {
  cansado: 10,
  normal: 15,
  focado: 20,
};

const AUTO_DURATION_BY_STATE = {
  cansado: 10,
  normal: 15,
  focado: 20,
};

const ALLOWED_DURATIONS_BY_STATE = {
  cansado: ["10", "15", "extra"],
  normal: ["10", "15", "20", "extra"],
  focado: ["15", "20", "extra"],
};

const ACTIVITY_DEFINITIONS = [
  { key: "serie", label: "S\u00e9rie em ingl\u00eas", color: "#f3f6fa" },
  { key: "game", label: "Game em ingl\u00eas", color: "#d5dde6" },
  { key: "verbos", label: "Estudo de verbos", color: "#aeb8c3" },
  { key: "frases", label: "Repeti\u00e7\u00e3o de frases", color: "#8894a3" },
  { key: "escuta", label: "Escuta em ingl\u00eas", color: "#728093" },
  { key: "leitura", label: "Leitura em ingl\u00eas", color: "#5f6d80" },
  { key: "outros", label: "Outros", color: "#8db4ff" },
];
const DEFAULT_SUBJECT_KEY = "ingles";
const SUBJECT_DEFINITIONS = [
  { key: "ingles", label: "Ingl\u00eas", color: "#f0d7b1" },
  { key: "matematica", label: "Matem\u00e1tica", color: "#d8eef9" },
  { key: "portugues", label: "Portugu\u00eas", color: "#efd4dc" },
  { key: "geografia", label: "Geografia", color: "#d4e8da" },
  { key: "historia", label: "Hist\u00f3ria", color: "#e4d7c5" },
  { key: "biologia", label: "Biologia", color: "#cfe7cf" },
  { key: "fisica", label: "F\u00edsica", color: "#cedbff" },
  { key: "quimica", label: "Qu\u00edmica", color: "#d6d3f3" },
  { key: "redacao", label: "Reda\u00e7\u00e3o", color: "#f3dcc3" },
  { key: "filosofia", label: "Filosofia", color: "#ddd3e4" },
  { key: "sociologia", label: "Sociologia", color: "#d8d8d8" },
  { key: "outras", label: "Outra mat\u00e9ria", color: "#f1ddb8" },
];

const ACTIVITY_MAP = new Map(ACTIVITY_DEFINITIONS.map((activity) => [activity.key, activity]));
const SUBJECT_MAP = new Map(SUBJECT_DEFINITIONS.map((subject) => [subject.key, subject]));
const VALID_STATES = new Set(Object.keys(DAILY_GOALS));
const VALID_ACTIVITIES = new Set(ACTIVITY_DEFINITIONS.map((activity) => activity.key));
const VALID_SUBJECTS = new Set(SUBJECT_DEFINITIONS.map((subject) => subject.key));
const LEGACY_IMPORT_PREFIX = "start5:legacy-imported";
const WEEKDAY_LABELS = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sab", "Dom"];
const MAX_VERB_SUGGESTIONS = 12;
const CUSTOM_SUBJECT_VALUE_PREFIX = "__custom_subject__:";
const COMMON_ENGLISH_VERBS = [
  "be",
  "have",
  "do",
  "say",
  "go",
  "get",
  "make",
  "know",
  "think",
  "take",
  "see",
  "come",
  "want",
  "look",
  "use",
  "find",
  "give",
  "tell",
  "work",
  "call",
  "try",
  "ask",
  "need",
  "feel",
  "become",
  "leave",
  "put",
  "mean",
  "keep",
  "let",
  "begin",
  "seem",
  "help",
  "talk",
  "turn",
  "start",
  "show",
  "hear",
  "play",
  "run",
  "move",
  "live",
  "believe",
  "bring",
  "happen",
  "write",
  "provide",
  "sit",
  "stand",
  "lose",
  "pay",
  "meet",
  "include",
  "continue",
  "set",
  "learn",
  "change",
  "lead",
  "understand",
  "watch",
  "follow",
  "stop",
  "create",
  "speak",
  "read",
  "allow",
  "add",
  "spend",
  "grow",
  "open",
  "walk",
  "win",
  "offer",
  "remember",
  "love",
  "consider",
  "appear",
  "buy",
  "wait",
  "serve",
  "die",
  "send",
  "expect",
  "build",
  "stay",
  "fall",
  "cut",
  "reach",
  "remain",
  "suggest",
  "raise",
  "pass",
  "sell",
  "require",
  "report",
  "decide",
  "pull",
  "return",
  "explain",
  "hope",
  "develop",
  "carry",
  "break",
  "receive",
  "agree",
  "support",
  "hit",
  "produce",
  "eat",
  "cover",
  "catch",
  "draw",
  "choose",
  "wear",
  "drive",
  "teach",
  "fly",
  "forget",
  "shake",
  "sleep",
  "drink",
  "sing",
  "swim",
  "travel",
  "study",
  "improve",
  "practice",
  "review",
  "listen",
  "hold",
  "plan",
  "share",
  "join",
];
const COMMON_ENGLISH_VERB_SET = new Set(COMMON_ENGLISH_VERBS);
const ESSAY_COMPETENCY_DEFINITIONS = [
  { id: 1, shortLabel: "C1", label: "Norma padr\u00e3o" },
  { id: 2, shortLabel: "C2", label: "Tema" },
  { id: 3, shortLabel: "C3", label: "Argumenta\u00e7\u00e3o" },
  { id: 4, shortLabel: "C4", label: "Coes\u00e3o" },
  { id: 5, shortLabel: "C5", label: "Interven\u00e7\u00e3o" },
];

let sessions = [];
let essaySubmissions = [];
let selectedState = "normal";
let selectedDuration = AUTO_DURATION_BY_STATE.normal;
let selectedSubjectKey = DEFAULT_SUBJECT_KEY;
let selectedVerbs = [];
let selectedPhrases = [];
let editingSessionId = null;
let pendingDeleteSessionId = null;
let isSavingSession = false;
let isDeletingSession = false;
let isCustomVerbMode = false;

function pad(value) {
  return String(value).padStart(2, "0");
}

function toDateKey(date) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

function parseDateKey(value) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(value || ""));

  if (!match) {
    return null;
  }

  return new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]), 12, 0, 0, 0);
}

function shiftDate(date, amount) {
  const copy = new Date(date);
  copy.setDate(copy.getDate() + amount);
  return copy;
}

function startOfWeek(date) {
  const copy = new Date(date);
  const day = copy.getDay();
  const offset = day === 0 ? -6 : 1 - day;
  copy.setDate(copy.getDate() + offset);
  copy.setHours(12, 0, 0, 0);
  return copy;
}

function endOfWeek(date) {
  return shiftDate(startOfWeek(date), 6);
}

function startOfMonth(date) {
  return new Date(date.getFullYear(), date.getMonth(), 1, 12, 0, 0, 0);
}

function endOfMonth(date) {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0, 12, 0, 0, 0);
}

function isValidDate(date) {
  return date instanceof Date && !Number.isNaN(date.getTime());
}

function roundOne(value) {
  return Math.round((Number(value) || 0) * 10) / 10;
}

function formatNumber(value) {
  const safeValue = roundOne(value);

  return new Intl.NumberFormat("pt-BR", {
    minimumFractionDigits: Number.isInteger(safeValue) ? 0 : 1,
    maximumFractionDigits: 1,
  }).format(safeValue);
}

function formatMinutesOnly(value) {
  return `${formatNumber(value)} min`;
}

function formatSignedMinutes(value) {
  const safeValue = roundOne(value);

  if (safeValue === 0) {
    return "0 min";
  }

  const sign = safeValue > 0 ? "+" : "-";
  return `${sign}${formatNumber(Math.abs(safeValue))} min`;
}

function formatTime(value) {
  const date = new Date(value);

  if (!isValidDate(date)) {
    return "--:--";
  }

  return date.toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getEssayReferenceDate(submission) {
  const directDate = new Date(submission?.evaluatedAt || submission?.createdAt || "");
  return isValidDate(directDate) ? directDate : null;
}

function formatEssayScore(value) {
  const safeValue = Math.round(Number(value) || 0);
  return `${new Intl.NumberFormat("pt-BR").format(safeValue)} pts`;
}

function formatEssayDate(value) {
  const date = new Date(value || "");

  if (!isValidDate(date)) {
    return "Sem data";
  }

  return date.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
  });
}

function formatShortDate(dateKey) {
  const date = parseDateKey(dateKey);

  if (!isValidDate(date)) {
    return "Sem data";
  }

  return date.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "short",
  });
}

function formatFullDate(dateKey) {
  const date = parseDateKey(dateKey);

  if (!isValidDate(date)) {
    return "Data n\u00e3o registrada";
  }

  return date.toLocaleDateString("pt-BR", {
    weekday: "long",
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

function capitalize(value) {
  const safeValue = String(value || "").trim();

  if (!safeValue) {
    return "";
  }

  return safeValue.charAt(0).toUpperCase() + safeValue.slice(1);
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

function uniqueItems(items) {
  return items
    .map((item) => String(item || "").trim())
    .filter((item, index, list) => item && list.indexOf(item) === index);
}

function normalizeVerbValue(value) {
  return String(value || "").trim().toLowerCase();
}

function uniqueVerbItems(items) {
  return items
    .map((item) => normalizeVerbValue(item))
    .filter((item, index, list) => item && list.indexOf(item) === index);
}

function getSubjectConfig(subjectKey) {
  return SUBJECT_MAP.get(subjectKey) || {
    key: subjectKey,
    label: capitalize(subjectKey),
    color: "#d5dde6",
  };
}

function getSubjectLabel(subjectKey, customSubjectName = "") {
  if (subjectKey === "outras" && String(customSubjectName || "").trim()) {
    return String(customSubjectName || "").trim();
  }

  return getSubjectConfig(subjectKey).label;
}

function getSubjectColor(subjectKey) {
  return getSubjectConfig(subjectKey).color;
}

function buildCustomSubjectOptionValue(subjectName) {
  return `${CUSTOM_SUBJECT_VALUE_PREFIX}${String(subjectName || "").trim()}`;
}

function readCustomSubjectOptionValue(value) {
  const safeValue = String(value || "");
  return safeValue.startsWith(CUSTOM_SUBJECT_VALUE_PREFIX)
    ? safeValue.slice(CUSTOM_SUBJECT_VALUE_PREFIX.length).trim()
    : "";
}

function getSavedCustomSubjectNames() {
  const currentUser = window.Start5Auth?.getSession?.();
  const orderedNames = [];

  if (currentUser?.focusSubjectKey === "outras" && String(currentUser?.focusSubjectName || "").trim()) {
    orderedNames.push(String(currentUser.focusSubjectName).trim());
  }

  sortSessionsByStartDesc(sessions)
    .filter((session) => session.subjectKey === "outras" && String(session.customSubjectName || "").trim())
    .forEach((session) => {
      orderedNames.push(String(session.customSubjectName).trim());
    });

  return uniqueItems(orderedNames).slice(0, 10);
}

function getActivityConfig(activityKey) {
  return ACTIVITY_MAP.get(activityKey) || {
    key: activityKey,
    label: capitalize(activityKey),
    color: "#d5dde6",
  };
}

function getActivityLabel(activityKey) {
  return getActivityConfig(activityKey).label;
}

function getActivityColor(activityKey) {
  return getActivityConfig(activityKey).color;
}

function getSessionActivityLabel(activityKey, otherLabel = "") {
  if (activityKey === "outros" && otherLabel) {
    return otherLabel;
  }

  return getActivityLabel(activityKey);
}

function getSafeActivities(input) {
  const source = Array.isArray(input) ? input : parseStructuredItems(input);

  return source
    .map((activity) => String(activity || "").trim().toLowerCase())
    .filter((activity, index, list) => VALID_ACTIVITIES.has(activity) && list.indexOf(activity) === index);
}

function getSessionStartDate(session) {
  const directDate = new Date(session?.startedAt || session?.startAt || "");

  if (isValidDate(directDate)) {
    return directDate;
  }

  const createdAt = new Date(session?.createdAt || "");

  if (isValidDate(createdAt)) {
    return createdAt;
  }

  const dateKey = session?.dateKey || session?.date;
  const parsedDate = parseDateKey(dateKey);

  if (isValidDate(parsedDate)) {
    return parsedDate;
  }

  return new Date();
}

function getSessionEndDate(session, minutes) {
  const directDate = new Date(session?.endedAt || "");

  if (isValidDate(directDate)) {
    return directDate;
  }

  const start = getSessionStartDate(session);
  return new Date(start.getTime() + minutes * 60000);
}

function deriveLegacyActivities(rawSession, verbs, phrases, otherLabel) {
  const baseActivities = getSafeActivities(rawSession?.activities || rawSession?.atividades);

  if (baseActivities.length) {
    return baseActivities;
  }

  const derived = [];

  if (verbs.length) {
    derived.push("verbos");
  }

  if (phrases.length) {
    derived.push("frases");
  }

  if (otherLabel || !derived.length) {
    derived.push("outros");
  }

  return uniqueItems(derived);
}

function deriveLegacySubjectKey(rawSession) {
  const subjectCandidate = String(rawSession?.subjectKey || rawSession?.materia || "")
    .trim()
    .toLowerCase();

  if (VALID_SUBJECTS.has(subjectCandidate)) {
    return subjectCandidate;
  }

  return DEFAULT_SUBJECT_KEY;
}

function deriveLegacyTopicText(subjectKey, activities, otherLabel, verbs, phrases, rawSession) {
  const directTopic = String(
    rawSession?.topicText || rawSession?.topic || rawSession?.whatStudied || rawSession?.assunto || ""
  )
    .trim()
    .replace(/\s+/g, " ")
    .slice(0, 140);

  if (directTopic) {
    return directTopic;
  }

  if (subjectKey === "outras") {
    const customSubjectName = String(rawSession?.customSubjectName || rawSession?.subjectName || "").trim();

    if (customSubjectName) {
      return customSubjectName;
    }
  }

  const activityLabels = activities
    .map((activity) => getSessionActivityLabel(activity, otherLabel))
    .filter(Boolean);

  if (activityLabels.length) {
    return activityLabels.join(", ");
  }

  if (verbs.length) {
    return "Estudo de verbos";
  }

  if (phrases.length) {
    return "Repeti\u00e7\u00e3o de frases";
  }

  return subjectKey === DEFAULT_SUBJECT_KEY
    ? "Pr\u00e1tica livre de ingl\u00eas"
    : `Estudo de ${getSubjectLabel(subjectKey, rawSession?.customSubjectName).toLowerCase()}`;
}

function normalizeSession(rawSession) {
  const minutes = Number(rawSession?.minutes) || 0;
  const stateCandidate = String(rawSession?.state || rawSession?.estadoDoDia || "normal")
    .trim()
    .toLowerCase();
  const state = VALID_STATES.has(stateCandidate) ? stateCandidate : "normal";
  const verbs = uniqueItems(rawSession?.verbs || parseStructuredItems(rawSession?.verbsText || rawSession?.verbosEstudados));
  const phrases = uniqueItems(
    rawSession?.phrases || parseStructuredItems(rawSession?.phrasesText || rawSession?.frasesRegistradas)
  );
  const otherLabel = String(rawSession?.otherLabel || "").trim();
  const activities = deriveLegacyActivities(rawSession, verbs, phrases, otherLabel);
  const subjectKey = deriveLegacySubjectKey(rawSession);
  const customSubjectName = subjectKey === "outras"
    ? String(rawSession?.customSubjectName || rawSession?.subjectName || "").trim()
    : "";
  const topicText = deriveLegacyTopicText(subjectKey, activities, otherLabel, verbs, phrases, rawSession);
  const startedAt = getSessionStartDate(rawSession).toISOString();
  const endedAt = getSessionEndDate(rawSession, minutes).toISOString();
  const dateKey =
    String(rawSession?.dateKey || rawSession?.date || "").trim() || toDateKey(getSessionStartDate(rawSession));

  return {
    id: rawSession?.id || null,
    state,
    minutes: minutes > 0 ? minutes : 0,
    type: String(rawSession?.type || (minutes > 20 ? "extra" : "padrao")),
    subjectKey,
    customSubjectName,
    subjectLabel: getSubjectLabel(subjectKey, customSubjectName),
    topicText,
    activities,
    otherLabel,
    verbs,
    phrases,
    notes: String(rawSession?.notes || rawSession?.observacoes || "").trim(),
    verbsText: verbs.join(", "),
    phrasesText: phrases.join("\n"),
    dateKey,
    date: dateKey,
    startedAt,
    endedAt,
    createdAt: String(rawSession?.createdAt || startedAt),
    updatedAt: String(rawSession?.updatedAt || rawSession?.createdAt || startedAt),
  };
}

function createSessionRecord(session) {
  return {
    minutes: session.minutes,
    state: session.state,
    subjectKey: session.subjectKey,
    customSubjectName: session.customSubjectName,
    topicText: session.topicText,
    activities: session.activities,
    otherLabel: session.otherLabel,
    verbs: session.verbs,
    phrases: session.phrases,
    englishDetails: {
      verbs: [...session.verbs],
      phrases: [...session.phrases],
    },
    notes: session.notes,
    startedAt: session.startedAt,
    createdAt: session.createdAt,
  };
}

function sortSessionsByStartDesc(list) {
  return [...list].sort((left, right) => new Date(right.startedAt).getTime() - new Date(left.startedAt).getTime());
}

function sumMinutes(list) {
  return roundOne(list.reduce((total, session) => total + (Number(session.minutes) || 0), 0));
}

function countActiveDays(list) {
  return new Set(list.map((session) => session.dateKey)).size;
}

function getPhraseCount(list) {
  return list.reduce((total, session) => total + session.phrases.length, 0);
}

function getSessionsByDate(dateKey) {
  return sortSessionsByStartDesc(sessions.filter((session) => session.dateKey === dateKey));
}

function getSessionsBetween(startDateKey, endDateKey) {
  const start = parseDateKey(startDateKey);
  const end = parseDateKey(endDateKey);

  if (!isValidDate(start) || !isValidDate(end)) {
    return [];
  }

  return sortSessionsByStartDesc(
    sessions.filter((session) => {
      const sessionDate = parseDateKey(session.dateKey);
      return isValidDate(sessionDate) && sessionDate >= start && sessionDate <= end;
    })
  );
}

function getCurrentWeekSessions() {
  const today = new Date();
  return getSessionsBetween(toDateKey(startOfWeek(today)), toDateKey(endOfWeek(today)));
}

function getPreviousWeekSessions() {
  const today = new Date();
  const currentWeekStart = startOfWeek(today);
  return getSessionsBetween(toDateKey(shiftDate(currentWeekStart, -7)), toDateKey(shiftDate(currentWeekStart, -1)));
}

function getCurrentMonthSessions() {
  const today = new Date();
  return getSessionsBetween(toDateKey(startOfMonth(today)), toDateKey(endOfMonth(today)));
}

function getEvaluatedEssaySubmissions() {
  return essaySubmissions.filter((submission) => submission?.status === "evaluated");
}

function sortEssaySubmissionsByDate(list) {
  return [...list].sort((left, right) => {
    const leftTime = getEssayReferenceDate(left)?.getTime() || 0;
    const rightTime = getEssayReferenceDate(right)?.getTime() || 0;
    return rightTime - leftTime;
  });
}

function getCurrentWeekEssaySubmissions() {
  const today = new Date();
  const weekStart = startOfWeek(today);
  const weekEnd = endOfWeek(today);

  return sortEssaySubmissionsByDate(
    getEvaluatedEssaySubmissions().filter((submission) => {
      const essayDate = getEssayReferenceDate(submission);
      return isValidDate(essayDate) && essayDate >= weekStart && essayDate <= weekEnd;
    })
  );
}

function getPreviousWeekEssaySubmissions() {
  const today = new Date();
  const currentWeekStart = startOfWeek(today);
  const previousWeekStart = shiftDate(currentWeekStart, -7);
  const previousWeekEnd = shiftDate(currentWeekStart, -1);

  return sortEssaySubmissionsByDate(
    getEvaluatedEssaySubmissions().filter((submission) => {
      const essayDate = getEssayReferenceDate(submission);
      return isValidDate(essayDate) && essayDate >= previousWeekStart && essayDate <= previousWeekEnd;
    })
  );
}

function getCurrentMonthEssaySubmissions() {
  const today = new Date();
  const monthStart = startOfMonth(today);
  const monthEnd = endOfMonth(today);

  return sortEssaySubmissionsByDate(
    getEvaluatedEssaySubmissions().filter((submission) => {
      const essayDate = getEssayReferenceDate(submission);
      return isValidDate(essayDate) && essayDate >= monthStart && essayDate <= monthEnd;
    })
  );
}

function getPreviousMonthEssaySubmissions() {
  const today = new Date();
  const previousMonthDate = new Date(today.getFullYear(), today.getMonth() - 1, 15, 12, 0, 0, 0);
  const monthStart = startOfMonth(previousMonthDate);
  const monthEnd = endOfMonth(previousMonthDate);

  return sortEssaySubmissionsByDate(
    getEvaluatedEssaySubmissions().filter((submission) => {
      const essayDate = getEssayReferenceDate(submission);
      return isValidDate(essayDate) && essayDate >= monthStart && essayDate <= monthEnd;
    })
  );
}

function getCurrentState(list = sessions) {
  return sortSessionsByStartDesc(list)[0]?.state || "normal";
}

function getStreak() {
  const uniqueDates = new Set(sessions.map((session) => session.dateKey));
  let streak = 0;
  let cursor = new Date();

  while (uniqueDates.has(toDateKey(cursor))) {
    streak += 1;
    cursor = shiftDate(cursor, -1);
  }

  return streak;
}

function buildActivityStats(list) {
  const statsMap = new Map();

  list.forEach((session) => {
    const sessionActivities = session.activities.length ? session.activities : ["outros"];
    const splitMinutes = sessionActivities.length ? session.minutes / sessionActivities.length : session.minutes;

    sessionActivities.forEach((activity) => {
      const current = statsMap.get(activity) || {
        key: activity,
        label: getActivityLabel(activity),
        count: 0,
        minutes: 0,
      };

      current.count += 1;
      current.minutes += splitMinutes;
      statsMap.set(activity, current);
    });
  });

  return [...statsMap.values()]
    .map((item) => ({
      ...item,
      minutes: roundOne(item.minutes),
    }))
    .sort((left, right) => {
      if (right.count !== left.count) return right.count - left.count;
      if (right.minutes !== left.minutes) return right.minutes - left.minutes;
      return left.label.localeCompare(right.label);
    });
}

function getSubjectStatKey(session) {
  const subjectKey = session.subjectKey || DEFAULT_SUBJECT_KEY;

  if (subjectKey === "outras") {
    const customSubjectName = String(session.customSubjectName || "").trim().toLowerCase();
    return customSubjectName ? `outras:${customSubjectName}` : "outras";
  }

  return subjectKey;
}

function buildSubjectStats(list) {
  const statsMap = new Map();

  list.forEach((session) => {
    const statKey = getSubjectStatKey(session);
    const current = statsMap.get(statKey) || {
      key: statKey,
      subjectKey: session.subjectKey || DEFAULT_SUBJECT_KEY,
      customSubjectName: String(session.customSubjectName || "").trim(),
      label: getSubjectLabel(session.subjectKey || DEFAULT_SUBJECT_KEY, session.customSubjectName),
      count: 0,
      minutes: 0,
      topics: [],
    };

    current.count += 1;
    current.minutes += Number(session.minutes) || 0;

    if (session.topicText) {
      current.topics.push(session.topicText);
    }

    statsMap.set(statKey, current);
  });

  return [...statsMap.values()]
    .map((item) => ({
      ...item,
      minutes: roundOne(item.minutes),
      topics: uniqueItems(item.topics),
    }))
    .sort((left, right) => {
      if (right.count !== left.count) return right.count - left.count;
      if (right.minutes !== left.minutes) return right.minutes - left.minutes;
      return left.label.localeCompare(right.label);
    });
}

function buildWordStats(words) {
  const statsMap = new Map();

  words.forEach((word) => {
    const normalizedWord = String(word || "").trim().toLowerCase();

    if (!normalizedWord) {
      return;
    }

    statsMap.set(normalizedWord, (statsMap.get(normalizedWord) || 0) + 1);
  });

  return [...statsMap.entries()]
    .map(([word, count]) => ({ word, count }))
    .sort((left, right) => {
      if (right.count !== left.count) return right.count - left.count;
      return left.word.localeCompare(right.word);
    });
}

function buildEssayCompetencyStats(list) {
  if (!list.length) {
    return [];
  }

  const totals = ESSAY_COMPETENCY_DEFINITIONS.map((definition) => ({
    ...definition,
    total: 0,
    count: 0,
  }));

  list.forEach((submission) => {
    totals.forEach((item) => {
      const score = Number(submission?.scores?.[`competency${item.id}`]) || 0;
      item.total += score;
      item.count += 1;
    });
  });

  return totals
    .map((item) => ({
      ...item,
      average: item.count ? roundOne(item.total / item.count) : 0,
    }))
    .sort((left, right) => {
      if (right.average !== left.average) return right.average - left.average;
      return left.id - right.id;
    });
}

function getEssayAverageScore(list) {
  if (!list.length) {
    return 0;
  }

  return roundOne(
    list.reduce((total, submission) => total + (Number(submission?.totalScore) || 0), 0) / list.length
  );
}

function describeEssayComparison(currentAverage, previousAverage, periodLabel) {
  if (!previousAverage) {
    return `Sua m\u00e9dia de reda\u00e7\u00e3o ficou em ${formatEssayScore(currentAverage)} ${periodLabel}.`;
  }

  const difference = roundOne(currentAverage - previousAverage);

  if (difference === 0) {
    return `Sua m\u00e9dia de reda\u00e7\u00e3o repetiu ${formatEssayScore(currentAverage)} ${periodLabel}.`;
  }

  if (difference > 0) {
    return `Sua m\u00e9dia de reda\u00e7\u00e3o subiu ${formatEssayScore(difference)} ${periodLabel}.`;
  }

  return `Sua m\u00e9dia de reda\u00e7\u00e3o caiu ${formatEssayScore(Math.abs(difference))} ${periodLabel}.`;
}

function findActivityStat(stats, key) {
  return stats.find((item) => item.key === key) || null;
}

function getTopSubject(list) {
  return buildSubjectStats(list)[0] || null;
}

function findSubjectStat(stats, subjectKey, customSubjectName = "") {
  const statKey = subjectKey === "outras" && customSubjectName
    ? `outras:${String(customSubjectName).trim().toLowerCase()}`
    : subjectKey;
  return stats.find((item) => item.key === statKey) || null;
}

function getFocusSubjectConfig() {
  const currentUser = window.Start5Auth?.getSession?.();
  const subjectKey = VALID_SUBJECTS.has(String(currentUser?.focusSubjectKey || "").trim().toLowerCase())
    ? String(currentUser.focusSubjectKey).trim().toLowerCase()
    : DEFAULT_SUBJECT_KEY;
  const customSubjectName = subjectKey === "outras"
    ? String(currentUser?.focusSubjectName || "").trim()
    : "";

  return {
    subjectKey,
    customSubjectName,
    label: getSubjectLabel(subjectKey, customSubjectName),
  };
}

function getFocusSubjectSessions(list) {
  const focusSubject = getFocusSubjectConfig();

  return list.filter((session) => {
    if ((session.subjectKey || DEFAULT_SUBJECT_KEY) !== focusSubject.subjectKey) {
      return false;
    }

    if (focusSubject.subjectKey !== "outras") {
      return true;
    }

    return String(session.customSubjectName || "").trim().toLowerCase() ===
      String(focusSubject.customSubjectName || "").trim().toLowerCase();
  });
}

function getRecentTopics(list, limit = 4) {
  return uniqueItems(
    sortSessionsByStartDesc(list)
      .map((session) => String(session.topicText || "").trim())
      .filter(Boolean)
  ).slice(0, limit);
}

function getTopicHighlights(list, limit = 3) {
  const stats = buildWordStats(
    list
      .map((session) => String(session.topicText || "").trim())
      .filter(Boolean)
  );

  return stats.slice(0, limit).map((item) => item.word);
}

function formatTopWords(words, limit = 3) {
  return formatCompactList(
    words.slice(0, limit).map((item) => item.word),
    limit
  );
}

function describeActivityComparison(stats, firstKey, secondKey, periodLabel) {
  const first = findActivityStat(stats, firstKey);
  const second = findActivityStat(stats, secondKey);

  if (!first && !second) {
    return "";
  }

  if (first && second) {
    if (first.count === second.count) {
      return `${first.label} e ${second.label} apareceram com a mesma frequ\u00eancia ${periodLabel}.`;
    }

    const winner = first.count > second.count ? first : second;
    const runnerUp = winner === first ? second : first;
    return `${winner.label} apareceu mais do que ${runnerUp.label} ${periodLabel}.`;
  }

  const present = first || second;
  const missingLabel = first
    ? getActivityLabel(secondKey)
    : getActivityLabel(firstKey);

  return `${present.label} entrou nos registros ${periodLabel}, enquanto ${missingLabel} ainda n\u00e3o apareceu.`;
}

function getVerbsFromSessions(list) {
  return list.flatMap((session) => session.verbs);
}

function getTopActivity(list) {
  return buildActivityStats(list)[0] || null;
}

function formatCompactList(items, limit = 3) {
  const safeItems = items.filter(Boolean);

  if (!safeItems.length) {
    return "Nenhuma";
  }

  if (safeItems.length <= limit) {
    return safeItems.join(", ");
  }

  return `${safeItems.slice(0, limit).join(", ")} +${safeItems.length - limit}`;
}

function createEmptyMessage(message, className = "detail-empty") {
  const element = document.createElement("div");
  element.className = className;
  element.textContent = message;
  return element;
}

function createDetailChip(label, metaText = "", color = "") {
  const chip = document.createElement("span");
  chip.className = "detail-chip";

  if (color) {
    chip.style.setProperty("--chip-color", color);
  }

  const labelNode = document.createElement("strong");
  labelNode.textContent = label;
  chip.appendChild(labelNode);

  if (metaText) {
    const metaNode = document.createElement("span");
    metaNode.textContent = metaText;
    chip.appendChild(metaNode);
  }

  return chip;
}

function createListRow(title, subtitle, metaText) {
  const row = document.createElement("div");
  row.className = "analysis-row";

  const main = document.createElement("div");
  main.className = "analysis-row-main";

  const titleNode = document.createElement("strong");
  titleNode.className = "analysis-row-title";
  titleNode.textContent = title;
  main.appendChild(titleNode);

  if (subtitle) {
    const subtitleNode = document.createElement("span");
    subtitleNode.className = "analysis-row-subtitle";
    subtitleNode.textContent = subtitle;
    main.appendChild(subtitleNode);
  }

  const metaNode = document.createElement("span");
  metaNode.className = "analysis-row-meta";
  metaNode.textContent = metaText;

  row.appendChild(main);
  row.appendChild(metaNode);

  return row;
}

function createSessionActionButton(action, sessionId, label) {
  const button = document.createElement("button");
  button.type = "button";
  button.className = `session-action-button ${action === "delete" ? "is-danger" : ""}`;
  button.dataset.sessionAction = action;
  button.dataset.sessionId = String(sessionId);
  button.textContent = label;
  return button;
}

function createSessionCard(session) {
  const card = document.createElement("article");
  card.className = "session-item";

  const topRow = document.createElement("div");
  topRow.className = "session-row";

  const main = document.createElement("div");
  main.className = "session-main";

  const stateBadge = document.createElement("span");
  stateBadge.className = `session-state ${session.state}`;
  stateBadge.textContent = capitalize(session.state);
  main.appendChild(stateBadge);

  const dayNode = document.createElement("span");
  dayNode.className = "session-day";
  dayNode.textContent = formatShortDate(session.dateKey);
  main.appendChild(dayNode);

  const subjectChipRow = document.createElement("div");
  subjectChipRow.className = "session-activities";
  subjectChipRow.appendChild(
    createDetailChip(
      session.subjectLabel,
      session.topicText ? "Mat\u00e9ria do registro" : "",
      getSubjectColor(session.subjectKey)
    )
  );

  const minutesNode = document.createElement("strong");
  minutesNode.className = "session-minutes";
  minutesNode.textContent = formatMinutesOnly(session.minutes);

  const actions = document.createElement("div");
  actions.className = "session-card-actions";
  actions.appendChild(createSessionActionButton("edit", session.id, "Editar"));
  actions.appendChild(createSessionActionButton("delete", session.id, "Apagar"));

  const side = document.createElement("div");
  side.className = "session-side";
  side.appendChild(minutesNode);
  side.appendChild(actions);

  topRow.appendChild(main);
  topRow.appendChild(side);

  const timesRow = document.createElement("div");
  timesRow.className = "session-times";
  timesRow.appendChild(createDetailChip(`In\u00edcio ${formatTime(session.startedAt)}`));
  timesRow.appendChild(createDetailChip(`Fim ${formatTime(session.endedAt)}`));

  card.appendChild(topRow);
  card.appendChild(timesRow);
  card.appendChild(subjectChipRow);

  const detailLines = [];

  if (session.topicText) {
    detailLines.push(`Tema: ${session.topicText}`);
  }

  if (session.verbs.length) {
    detailLines.push(`Verbos: ${formatCompactList(session.verbs, 5)}`);
  }

  if (session.phrases.length) {
    detailLines.push(`Frases: ${formatCompactList(session.phrases, 4)}`);
  }

  if (session.notes) {
    detailLines.push(`Observa\u00e7\u00e3o: ${session.notes}`);
  }

  if (detailLines.length) {
    const detailsBox = document.createElement("div");
    detailsBox.className = "session-notes";

    detailLines.forEach((detail) => {
      const paragraph = document.createElement("p");
      paragraph.textContent = detail;
      detailsBox.appendChild(paragraph);
    });

    card.appendChild(detailsBox);
  }

  return card;
}

function createSvgElement(tagName) {
  return document.createElementNS("http://www.w3.org/2000/svg", tagName);
}

function renderChipList(container, chips, emptyMessage) {
  if (!container) {
    return;
  }

  container.replaceChildren();

  if (!chips.length) {
    container.appendChild(createEmptyMessage(emptyMessage));
    return;
  }

  chips.forEach((chip) => container.appendChild(chip));
}

function renderActivityRows(container, stats, emptyMessage) {
  if (!container) {
    return;
  }

  container.replaceChildren();

  if (!stats.length) {
    container.appendChild(createEmptyMessage(emptyMessage));
    return;
  }

  stats.forEach((item) => {
    const subtitle = item.topics?.length
      ? `Temas: ${formatCompactList(item.topics, 2)}`
      : `${item.count} registro${item.count === 1 ? "" : "s"}`;
    container.appendChild(
      createListRow(
        item.label,
        subtitle,
        formatMinutesOnly(item.minutes)
      )
    );
  });
}

function renderEssayRows(container, essays, emptyMessage) {
  if (!container) {
    return;
  }

  container.replaceChildren();

  if (!essays.length) {
    container.appendChild(createEmptyMessage(emptyMessage));
    return;
  }

  essays.slice(0, 6).forEach((submission) => {
    const referenceDate = getEssayReferenceDate(submission);
    const subtitle = `${formatEssayDate(referenceDate)} | ${submission.wordCount || 0} palavras`;
    container.appendChild(
      createListRow(
        submission.themeTitle || "Reda\u00e7\u00e3o",
        subtitle,
        formatEssayScore(submission.totalScore)
      )
    );
  });
}

function renderEssayCompetencyRows(container, stats, emptyMessage) {
  if (!container) {
    return;
  }

  container.replaceChildren();

  if (!stats.length) {
    container.appendChild(createEmptyMessage(emptyMessage));
    return;
  }

  stats.forEach((item, index) => {
    const isStrongest = index === 0;
    const isWeakest = index === stats.length - 1;
    const subtitle = isStrongest
      ? "Compet\u00eancia mais forte neste recorte"
      : isWeakest
        ? "Compet\u00eancia que mais pede aten\u00e7\u00e3o"
        : "M\u00e9dia das reda\u00e7\u00f5es corrigidas";

    container.appendChild(
      createListRow(
        `${item.shortLabel} | ${item.label}`,
        subtitle,
        formatEssayScore(item.average)
      )
    );
  });
}

function renderDonutChart(container, stats, totalMinutes, emptyMessage) {
  if (!container) {
    return;
  }

  container.replaceChildren();

  if (!stats.length || totalMinutes <= 0) {
    container.appendChild(createEmptyMessage(emptyMessage));
    return;
  }

  const wrapper = document.createElement("div");
  wrapper.className = "chart-card";

  const visual = document.createElement("div");
  visual.className = "donut-chart";

  const svg = createSvgElement("svg");
  svg.setAttribute("viewBox", "0 0 120 120");

  const track = createSvgElement("circle");
  track.setAttribute("cx", "60");
  track.setAttribute("cy", "60");
  track.setAttribute("r", "42");
  track.setAttribute("fill", "none");
  track.setAttribute("stroke", "rgba(255,255,255,0.08)");
  track.setAttribute("stroke-width", "12");
  svg.appendChild(track);

  const circumference = 2 * Math.PI * 42;
  let offset = 0;

  stats.forEach((item) => {
    const ratio = item.minutes / totalMinutes;
    const segment = createSvgElement("circle");
    segment.setAttribute("cx", "60");
    segment.setAttribute("cy", "60");
    segment.setAttribute("r", "42");
    segment.setAttribute("fill", "none");
    segment.setAttribute("stroke", getSubjectColor(item.subjectKey || item.key));
    segment.setAttribute("stroke-width", "12");
    segment.setAttribute("stroke-linecap", "round");
    segment.setAttribute("transform", "rotate(-90 60 60)");
    segment.setAttribute("stroke-dasharray", `${circumference * ratio} ${circumference}`);
    segment.setAttribute("stroke-dashoffset", String(-offset));
    svg.appendChild(segment);
    offset += circumference * ratio;
  });

  const center = document.createElement("div");
  center.className = "donut-center";
  const centerValue = document.createElement("strong");
  centerValue.textContent = formatMinutesOnly(totalMinutes);
  const centerLabel = document.createElement("span");
  centerLabel.textContent = "distribuidos";
  center.appendChild(centerValue);
  center.appendChild(centerLabel);

  visual.appendChild(svg);
  visual.appendChild(center);

  const legend = document.createElement("div");
  legend.className = "chart-legend";

  stats.forEach((item) => {
    const row = document.createElement("div");
    row.className = "chart-legend-row";

    const main = document.createElement("div");
    main.className = "chart-legend-main";

    const dot = document.createElement("span");
    dot.className = "chart-legend-dot";
    dot.style.background = getSubjectColor(item.subjectKey || item.key);

    const label = document.createElement("strong");
    label.textContent = item.label;

    const subtitle = document.createElement("span");
    subtitle.textContent = `${item.count}x`;

    main.appendChild(dot);
    main.appendChild(label);
    main.appendChild(subtitle);

    const meta = document.createElement("span");
    meta.className = "chart-legend-meta";
    meta.textContent = formatMinutesOnly(item.minutes);

    row.appendChild(main);
    row.appendChild(meta);
    legend.appendChild(row);
  });

  wrapper.appendChild(visual);
  wrapper.appendChild(legend);
  container.appendChild(wrapper);
}

function renderBarChart(container, points, emptyMessage) {
  if (!container) {
    return;
  }

  container.replaceChildren();

  if (!points.length || points.every((point) => point.value <= 0)) {
    container.appendChild(createEmptyMessage(emptyMessage));
    return;
  }

  const maxValue = Math.max(...points.map((point) => point.value), 1);
  const chart = document.createElement("div");
  chart.className = "bar-chart";

  points.forEach((point) => {
    const column = document.createElement("div");
    column.className = "bar-chart-column";

    const value = document.createElement("span");
    value.className = "bar-chart-value";
    value.textContent = point.value > 0 ? formatMinutesOnly(point.value) : "0";

    const track = document.createElement("div");
    track.className = "bar-chart-track";

    const fill = document.createElement("div");
    fill.className = "bar-chart-fill";
    fill.style.height = `${Math.max((point.value / maxValue) * 100, point.value > 0 ? 12 : 0)}%`;
    track.appendChild(fill);

    const label = document.createElement("span");
    label.className = "bar-chart-label";
    label.textContent = point.label;

    column.appendChild(value);
    column.appendChild(track);
    column.appendChild(label);
    chart.appendChild(column);
  });

  container.appendChild(chart);
}

function buildWeeklyDailyPoints(list) {
  const weekStart = startOfWeek(new Date());

  return WEEKDAY_LABELS.map((label, index) => {
    const currentDate = shiftDate(weekStart, index);
    const dateKey = toDateKey(currentDate);
    return {
      label,
      value: sumMinutes(list.filter((session) => session.dateKey === dateKey)),
    };
  });
}

function buildMonthlyWeekPoints(list) {
  const monthStart = startOfMonth(new Date());
  const monthEnd = endOfMonth(new Date());
  const points = [];

  let cursor = new Date(monthStart);
  let weekIndex = 1;

  while (cursor <= monthEnd) {
    const chunkStart = new Date(cursor);
    const chunkEnd = shiftDate(chunkStart, 6);

    if (chunkEnd > monthEnd) {
      chunkEnd.setTime(monthEnd.getTime());
    }

    const value = sumMinutes(
      list.filter((session) => {
        const sessionDate = parseDateKey(session.dateKey);
        return isValidDate(sessionDate) && sessionDate >= chunkStart && sessionDate <= chunkEnd;
      })
    );

    points.push({
      label: `S${weekIndex}`,
      value,
    });

    cursor = shiftDate(cursor, 7);
    weekIndex += 1;
  }

  return points;
}

function readStoredJson(key) {
  try {
    const rawValue = window.localStorage.getItem(key);
    return rawValue ? JSON.parse(rawValue) : null;
  } catch {
    return null;
  }
}

function getLegacyImportKey(userId) {
  return `${LEGACY_IMPORT_PREFIX}:${userId}`;
}

function getLegacySessionsForCurrentUser() {
  const currentUser = window.Start5Auth?.getSession?.();

  if (!currentUser) {
    return [];
  }

  const candidateKeys = [
    `start5:sessions:${currentUser.id}`,
    `start5:sessions:${currentUser.email}`,
    "start5:sessions",
    "start5-sessions",
  ];

  const collected = [];

  candidateKeys.forEach((key) => {
    const value = readStoredJson(key);

    if (Array.isArray(value)) {
      value.forEach((session) => collected.push(session));
    }
  });

  return collected
    .map((session) => normalizeSession(session))
    .filter((session) => session.minutes > 0);
}

async function importLegacySessionsIfNeeded() {
  const currentUser = window.Start5Auth?.getSession?.();

  if (!currentUser) {
    return;
  }

  const importKey = getLegacyImportKey(currentUser.id);

  if (window.localStorage.getItem(importKey) === "1") {
    return;
  }

  const legacySessions = getLegacySessionsForCurrentUser();

  if (!legacySessions.length) {
    window.localStorage.setItem(importKey, "1");
    return;
  }

  try {
    await window.Start5Auth.apiRequest("/api/sessions/import", {
      method: "POST",
      body: {
        sessions: legacySessions.map((session) => createSessionRecord(session)),
      },
    });
    window.localStorage.setItem(importKey, "1");
  } catch (error) {
    console.error("Erro ao importar hist\u00f3rico legado:", error);
  }
}

async function loadSessionsFromApi() {
  const response = await window.Start5Auth.apiRequest("/api/sessions");
  const nextSessions = Array.isArray(response?.sessions) ? response.sessions : [];
  sessions = sortSessionsByStartDesc(nextSessions.map((session) => normalizeSession(session)));
  updateSubjectSelectionUI();
  renderCustomSubjectSuggestions();
}

async function loadEssaySubmissionsFromApi() {
  const response = await window.Start5Auth.apiRequest("/api/essay/submissions");
  essaySubmissions = sortEssaySubmissionsByDate(
    Array.isArray(response?.submissions) ? response.submissions : []
  );
}

function openMenu() {
  body.classList.add("menu-open");

  if (menuToggle) {
    menuToggle.setAttribute("aria-expanded", "true");
    menuToggle.setAttribute("aria-label", "Fechar menu");
  }
}

function closeMenu() {
  body.classList.remove("menu-open");

  if (menuToggle) {
    menuToggle.setAttribute("aria-expanded", "false");
    menuToggle.setAttribute("aria-label", "Abrir menu");
  }
}

function toggleMenu() {
  if (body.classList.contains("menu-open")) {
    closeMenu();
    return;
  }

  openMenu();
}

function updateStateButtons() {
  stateButtons.forEach((button) => {
    const isActive = button.dataset.state === selectedState;
    button.classList.toggle("is-active", isActive);
    button.setAttribute("aria-pressed", String(isActive));
  });
}

function updateDurationButtons() {
  const allowedDurations = new Set(ALLOWED_DURATIONS_BY_STATE[selectedState] || []);

  durationButtons.forEach((button) => {
    const durationKey = button.dataset.duration || "";
    const isDisabled = !allowedDurations.has(durationKey);
    const isActive = durationKey === String(selectedDuration);

    button.disabled = isDisabled;
    button.classList.toggle("is-disabled", isDisabled);
    button.classList.toggle("is-active", isActive && !isDisabled);
    button.setAttribute("aria-pressed", String(isActive && !isDisabled));
  });

  if (!allowedDurations.has(String(selectedDuration))) {
    selectedDuration = AUTO_DURATION_BY_STATE[selectedState];
    updateDurationButtons();
    return;
  }

  extraMinutesBox?.classList.toggle("is-visible", String(selectedDuration) === "extra");
}

function updateSubjectSelectionUI() {
  if (!subjectSelect) {
    return;
  }

  subjectSelect.querySelectorAll("[data-custom-subject-group]").forEach((element) => {
    element.remove();
  });

  const savedCustomSubjects = getSavedCustomSubjectNames();

  if (savedCustomSubjects.length) {
    const customGroup = document.createElement("optgroup");
    customGroup.label = "Mat\u00e9rias j\u00e1 usadas";
    customGroup.dataset.customSubjectGroup = "true";

    savedCustomSubjects.forEach((subjectName) => {
      const option = document.createElement("option");
      option.value = buildCustomSubjectOptionValue(subjectName);
      option.textContent = subjectName;
      customGroup.appendChild(option);
    });

    const otherOption = subjectSelect.querySelector('option[value="outras"]');

    if (otherOption) {
      subjectSelect.insertBefore(customGroup, otherOption);
    } else {
      subjectSelect.appendChild(customGroup);
    }
  }

  const currentCustomSubjectName = String(customSubjectInput?.value || "").trim();
  const matchingCustomValue = currentCustomSubjectName
    ? buildCustomSubjectOptionValue(currentCustomSubjectName)
    : "";
  const hasMatchingCustomOption = matchingCustomValue
    ? [...subjectSelect.options].some((option) => option.value === matchingCustomValue)
    : false;

  if (selectedSubjectKey === "outras" && hasMatchingCustomOption) {
    subjectSelect.value = matchingCustomValue;
    return;
  }

  subjectSelect.value = selectedSubjectKey;
}

function createCustomSubjectSuggestionButton(subjectName) {
  const button = document.createElement("button");
  button.type = "button";
  button.className = "subject-suggestion-button";
  button.dataset.customSubjectSuggestion = subjectName;
  button.textContent = subjectName;
  return button;
}

function renderCustomSubjectSuggestions() {
  if (!customSubjectSuggestions) {
    return;
  }

  customSubjectSuggestions.replaceChildren();

  const savedCustomSubjects = getSavedCustomSubjectNames();

  if (!savedCustomSubjects.length) {
    customSubjectSuggestions.appendChild(
      createEmptyMessage(
        "As mat\u00e9rias personalizadas que voc\u00ea salvar v\u00e3o aparecer aqui.",
        "subject-suggestions-empty"
      )
    );
    return;
  }

  savedCustomSubjects.forEach((subjectName) => {
    customSubjectSuggestions.appendChild(createCustomSubjectSuggestionButton(subjectName));
  });
}

function renderTokenList(container, items, tokenType) {
  if (!container) {
    return;
  }

  container.replaceChildren();

  items.forEach((item) => {
    const chip = document.createElement("span");
    chip.className = "token-chip";

    const label = document.createElement("span");
    label.textContent = item;

    const removeButton = document.createElement("button");
    removeButton.type = "button";
    removeButton.className = "token-chip-remove";
    removeButton.dataset.tokenType = tokenType;
    removeButton.dataset.tokenValue = item;
    removeButton.setAttribute("aria-label", `Remover ${item}`);
    removeButton.textContent = "×";

    chip.appendChild(label);
    chip.appendChild(removeButton);
    container.appendChild(chip);
  });
}

function updateTokenLists() {
  renderTokenList(verbsTokenList, selectedVerbs, "verb");
  renderTokenList(phrasesTokenList, selectedPhrases, "phrase");
}

function addStructuredItems(kind, value) {
  const parsedItems =
    kind === "verb"
      ? uniqueVerbItems(parseStructuredItems(value))
      : uniqueItems(parseStructuredItems(value));

  if (!parsedItems.length) {
    return;
  }

  if (kind === "verb") {
    selectedVerbs = uniqueVerbItems([...selectedVerbs, ...parsedItems]);
  } else {
    selectedPhrases = uniqueItems([...selectedPhrases, ...parsedItems]);
  }

  updateTokenLists();

  if (kind === "verb") {
    renderVerbSuggestions();
  }

  updateSessionHelper();
}

function removeStructuredItem(kind, value) {
  if (kind === "verb") {
    const normalizedValue = normalizeVerbValue(value);
    selectedVerbs = selectedVerbs.filter((item) => normalizeVerbValue(item) !== normalizedValue);
  } else {
    selectedPhrases = selectedPhrases.filter((item) => item !== value);
  }

  updateTokenLists();

  if (kind === "verb") {
    renderVerbSuggestions();
  }

  updateSessionHelper();
}

function commitTokenInput(kind, input) {
  if (!input) {
    return;
  }

  addStructuredItems(kind, input.value);
  input.value = "";
}

function bindTokenInput(input, kind) {
  if (!input) {
    return;
  }

  input.addEventListener("keydown", (event) => {
    if (event.key === "Enter" || event.key === ",") {
      event.preventDefault();
      commitTokenInput(kind, input);
    }
  });

  input.addEventListener("input", () => {
    if (!/[,\n]/.test(input.value)) {
      return;
    }

    const chunks = input.value.split(/[,\n]/g);
    const pending = chunks.pop() || "";
    addStructuredItems(kind, chunks);
    input.value = pending;
  });

  input.addEventListener("blur", () => {
    commitTokenInput(kind, input);
  });
}

function hasSelectedVerb(value) {
  const normalizedValue = normalizeVerbValue(value);
  return selectedVerbs.some((item) => normalizeVerbValue(item) === normalizedValue);
}

function getFilteredVerbSuggestions(query, limit = MAX_VERB_SUGGESTIONS) {
  const normalizedQuery = normalizeVerbValue(query);
  const availableVerbs = COMMON_ENGLISH_VERBS.filter((verb) => !hasSelectedVerb(verb));

  if (!normalizedQuery) {
    return availableVerbs.slice(0, limit);
  }

  const prefixMatches = [];
  const partialMatches = [];

  availableVerbs.forEach((verb) => {
    if (verb.startsWith(normalizedQuery)) {
      prefixMatches.push(verb);
      return;
    }

    if (verb.includes(normalizedQuery)) {
      partialMatches.push(verb);
    }
  });

  return [...prefixMatches, ...partialMatches].slice(0, limit);
}

function getDefaultVerbPickerStatus() {
  return isCustomVerbMode
    ? "Modo manual ativo. Digite qualquer verbo em ingl\u00eas."
    : "Sugest\u00f5es com os verbos mais conhecidos primeiro.";
}

function setVerbPickerStatus(message = "") {
  if (!verbPickerStatus) {
    return;
  }

  verbPickerStatus.textContent = message || getDefaultVerbPickerStatus();
}

function updateVerbModeButton() {
  if (!verbModeToggleButton) {
    return;
  }

  verbModeToggleButton.textContent = isCustomVerbMode ? "Voltar para lista" : "Outro verbo";
  verbModeToggleButton.setAttribute("aria-pressed", String(isCustomVerbMode));
}

function updateVerbInputPlaceholder() {
  if (!verbsEntryInput) {
    return;
  }

  verbsEntryInput.placeholder = isCustomVerbMode
    ? "Digite o verbo que estiver estudando"
    : "Busque um verbo comum";
}

function setCustomVerbMode(nextMode, message = "") {
  isCustomVerbMode = Boolean(nextMode);
  updateVerbInputPlaceholder();
  updateVerbModeButton();
  setVerbPickerStatus(message);
  renderVerbSuggestions();
}

function createVerbSuggestionButton(value, label = value, customClass = "") {
  const button = document.createElement("button");
  button.type = "button";
  button.className = `verb-suggestion-button ${customClass}`.trim();
  button.dataset.verbSuggestion = value;
  button.textContent = label;
  return button;
}

function renderVerbSuggestions() {
  if (!verbSuggestions) {
    return;
  }

  verbSuggestions.replaceChildren();

  if (isCustomVerbMode) {
    verbSuggestions.appendChild(
      createEmptyMessage(
        "Modo manual ativo. Digite o verbo que quiser e clique em Adicionar.",
        "verb-suggestions-empty"
      )
    );
    return;
  }

  const suggestions = getFilteredVerbSuggestions(verbsEntryInput?.value || "");

  if (!suggestions.length) {
    verbSuggestions.appendChild(
      createEmptyMessage(
        "Nenhum verbo parecido apareceu na lista principal.",
        "verb-suggestions-empty"
      )
    );
  } else {
    suggestions.forEach((verb) => {
      verbSuggestions.appendChild(createVerbSuggestionButton(verb));
    });
  }

  verbSuggestions.appendChild(
    createVerbSuggestionButton("__custom__", "Outro verbo", "is-custom")
  );
}

function addVerbFromPicker(value) {
  const normalizedValue = normalizeVerbValue(value);

  if (!normalizedValue) {
    return;
  }

  addStructuredItems("verb", normalizedValue);

  if (verbsEntryInput) {
    verbsEntryInput.value = "";
    verbsEntryInput.focus();
  }

  setVerbPickerStatus("");
  renderVerbSuggestions();
}

function commitVerbInput() {
  if (!verbsEntryInput) {
    return;
  }

  const normalizedValue = normalizeVerbValue(verbsEntryInput.value);

  if (!normalizedValue) {
    return;
  }

  if (hasSelectedVerb(normalizedValue)) {
    verbsEntryInput.value = "";
    setVerbPickerStatus(`"${normalizedValue}" ja foi adicionado.`);
    renderVerbSuggestions();
    return;
  }

  if (isCustomVerbMode) {
    addVerbFromPicker(normalizedValue);
    return;
  }

  if (COMMON_ENGLISH_VERB_SET.has(normalizedValue)) {
    addVerbFromPicker(normalizedValue);
    return;
  }

  const prefixMatches = getFilteredVerbSuggestions(normalizedValue).filter((verb) =>
    verb.startsWith(normalizedValue)
  );

  if (prefixMatches.length === 1) {
    addVerbFromPicker(prefixMatches[0]);
    return;
  }

  if (!prefixMatches.length) {
    setCustomVerbMode(
      true,
      `"${normalizedValue}" n\u00e3o apareceu na lista principal. Agora voc\u00ea pode adicionar manualmente.`
    );
    verbsEntryInput.focus();
    return;
  }

  setVerbPickerStatus("Escolha um verbo da lista ou use Outro verbo.");
  renderVerbSuggestions();
}

function bindVerbInput() {
  if (!verbsEntryInput) {
    return;
  }

  updateVerbInputPlaceholder();
  updateVerbModeButton();
  setVerbPickerStatus("");
  renderVerbSuggestions();

  verbsEntryInput.addEventListener("keydown", (event) => {
    if (event.key === "Enter" || event.key === ",") {
      event.preventDefault();
      commitVerbInput();
    }
  });

  verbsEntryInput.addEventListener("input", () => {
    const normalizedValue = normalizeVerbValue(verbsEntryInput.value);

    if (!normalizedValue) {
      setVerbPickerStatus("");
      renderVerbSuggestions();
      return;
    }

    if (isCustomVerbMode) {
      setVerbPickerStatus("Modo manual ativo. Digite o verbo e clique em Adicionar.");
      return;
    }

    const suggestions = getFilteredVerbSuggestions(normalizedValue);

    if (!suggestions.length) {
      setVerbPickerStatus("Esse verbo n\u00e3o est\u00e1 na lista principal. Use Outro verbo.");
    } else {
      setVerbPickerStatus("Escolha um verbo sugerido ou continue digitando.");
    }

    renderVerbSuggestions();
  });

  addVerbButton?.addEventListener("click", commitVerbInput);

  verbModeToggleButton?.addEventListener("click", () => {
    setCustomVerbMode(!isCustomVerbMode);
    verbsEntryInput.focus();
  });

  verbSuggestions?.addEventListener("click", (event) => {
    const button = event.target.closest("[data-verb-suggestion]");

    if (!button) {
      return;
    }

    const suggestedVerb = button.dataset.verbSuggestion || "";

    if (suggestedVerb === "__custom__") {
      setCustomVerbMode(true);
      verbsEntryInput.focus();
      return;
    }

    setCustomVerbMode(false);
    addVerbFromPicker(suggestedVerb);
  });
}

function updateDetailFieldsVisibility() {
  const showEnglishFields = selectedSubjectKey === DEFAULT_SUBJECT_KEY;
  const showCustomSubjectField = selectedSubjectKey === "outras";

  customSubjectField?.classList.toggle("is-hidden", !showCustomSubjectField);
  verbDetailsField?.classList.toggle("is-hidden", !showEnglishFields);
  phraseDetailsField?.classList.toggle("is-hidden", !showEnglishFields);

  if (!showEnglishFields) {
    selectedVerbs = [];
    selectedPhrases = [];
    isCustomVerbMode = false;
    if (verbsEntryInput) {
      verbsEntryInput.value = "";
    }
  }

  if (!showCustomSubjectField && customSubjectInput) {
    customSubjectInput.value = "";
  }

  updateTokenLists();
  updateVerbInputPlaceholder();
  updateVerbModeButton();
  setVerbPickerStatus("");
  renderVerbSuggestions();
  renderCustomSubjectSuggestions();
}

function getMinutesToSave() {
  if (String(selectedDuration) !== "extra") {
    return Number(selectedDuration) || 0;
  }

  const value = Number(extraMinutesInput?.value);
  return Number.isFinite(value) ? value : 0;
}

function setModalMode(mode) {
  const isEditing = mode === "edit";

  if (sessionModalModeLabel) {
    sessionModalModeLabel.textContent = isEditing ? "Edi\u00e7\u00e3o" : "Nova pr\u00e1tica";
  }

  if (sessionModalTitle) {
    sessionModalTitle.textContent = isEditing ? "Editar pr\u00e1tica" : "Registrar pr\u00e1tica";
  }

  if (saveSessionButton) {
    saveSessionButton.textContent = isEditing ? "Atualizar pr\u00e1tica" : "Salvar pr\u00e1tica";
  }
}

function updateSessionHelper() {
  if (!sessionHelper) {
    return;
  }

  const minutes = getMinutesToSave();
  const customSubjectName = String(customSubjectInput?.value || "").trim();
  const subjectLabel = getSubjectLabel(selectedSubjectKey, customSubjectName);
  const topicText = String(topicInput?.value || "").trim();

  if (!topicText) {
    sessionHelper.textContent = "Escolha a mat\u00e9ria e descreva o que voc\u00ea estudou hoje.";
    return;
  }

  if (selectedSubjectKey === "outras" && !customSubjectName) {
    sessionHelper.textContent = "Digite o nome da mat\u00e9ria para continuar.";
    return;
  }

  if (selectedSubjectKey === DEFAULT_SUBJECT_KEY && selectedVerbs.length) {
    sessionHelper.textContent =
      `${capitalize(selectedState)}, ${formatMinutesOnly(minutes || 0)} de ${subjectLabel}. Tema: ${topicText}.`;
    return;
  }

  sessionHelper.textContent =
    `${capitalize(selectedState)}, ${formatMinutesOnly(minutes || 0)} de ${subjectLabel}. Tema: ${topicText}.`;
}

function setSelectedState(nextState) {
  if (!VALID_STATES.has(nextState)) {
    return;
  }

  selectedState = nextState;

  if (!ALLOWED_DURATIONS_BY_STATE[selectedState].includes(String(selectedDuration))) {
    selectedDuration = AUTO_DURATION_BY_STATE[selectedState];
  }

  updateStateButtons();
  updateDurationButtons();
  updateSessionHelper();
}

function setSelectedSubject(nextSubjectKey) {
  const customSubjectName = readCustomSubjectOptionValue(nextSubjectKey);

  if (customSubjectName) {
    selectedSubjectKey = "outras";
    if (customSubjectInput) {
      customSubjectInput.value = customSubjectName;
    }
  } else {
    if (!VALID_SUBJECTS.has(nextSubjectKey)) {
      return;
    }

    selectedSubjectKey = nextSubjectKey;
  }

  updateSubjectSelectionUI();
  updateDetailFieldsVisibility();
  updateSessionHelper();
}

function resetSessionForm() {
  editingSessionId = null;
  selectedState = "normal";
  selectedDuration = AUTO_DURATION_BY_STATE.normal;
  selectedSubjectKey = getFocusSubjectConfig().subjectKey;
  selectedVerbs = [];
  selectedPhrases = [];
  isCustomVerbMode = false;

  if (extraMinutesInput) extraMinutesInput.value = "";
  if (customSubjectInput) customSubjectInput.value = getFocusSubjectConfig().customSubjectName || "";
  if (topicInput) topicInput.value = "";
  if (notesInput) notesInput.value = "";
  if (verbsEntryInput) verbsEntryInput.value = "";
  if (phrasesEntryInput) phrasesEntryInput.value = "";

  setModalMode("create");
  updateStateButtons();
  updateDurationButtons();
  updateSubjectSelectionUI();
  updateDetailFieldsVisibility();
  updateTokenLists();
  updateSessionHelper();
}

function populateSessionForm(session) {
  editingSessionId = session.id;
  selectedState = session.state;
  selectedSubjectKey = session.subjectKey || DEFAULT_SUBJECT_KEY;
  selectedVerbs = uniqueVerbItems(session.verbs);
  selectedPhrases = [...session.phrases];
  isCustomVerbMode = false;

  if (session.minutes > 20 || !["10", "15", "20"].includes(String(session.minutes))) {
    selectedDuration = "extra";
    if (extraMinutesInput) extraMinutesInput.value = String(session.minutes);
  } else {
    selectedDuration = String(session.minutes);
    if (extraMinutesInput) extraMinutesInput.value = "";
  }

  if (customSubjectInput) {
    customSubjectInput.value = session.customSubjectName || "";
  }

  if (topicInput) {
    topicInput.value = session.topicText || "";
  }

  if (notesInput) {
    notesInput.value = session.notes || "";
  }

  if (verbsEntryInput) verbsEntryInput.value = "";
  if (phrasesEntryInput) phrasesEntryInput.value = "";

  setModalMode("edit");
  updateStateButtons();
  updateDurationButtons();
  updateSubjectSelectionUI();
  updateDetailFieldsVisibility();
  updateTokenLists();
  updateSessionHelper();
}

function openSessionModal(session = null) {
  if (!modalBackdrop) {
    return;
  }

  if (session) {
    populateSessionForm(session);
  } else {
    resetSessionForm();
  }

  closeMenu();
  modalBackdrop.classList.add("is-visible");
  modalBackdrop.setAttribute("aria-hidden", "false");
  body.classList.add("modal-open");
}

function closeSessionModal() {
  if (!modalBackdrop) {
    return;
  }

  modalBackdrop.classList.remove("is-visible");
  modalBackdrop.setAttribute("aria-hidden", "true");
  body.classList.remove("modal-open");
}

function setSaveSessionLoading(isLoading) {
  isSavingSession = isLoading;

  if (!modalBackdrop || !saveSessionButton) {
    return;
  }

  modalBackdrop.querySelectorAll("button, input, textarea, select").forEach((element) => {
    element.disabled = isLoading;
  });

  if (editingSessionId) {
    saveSessionButton.textContent = isLoading ? "Atualizando..." : "Atualizar pr\u00e1tica";
  } else {
    saveSessionButton.textContent = isLoading ? "Salvando..." : "Salvar pr\u00e1tica";
  }
}

function openDeleteModal(session) {
  if (!deleteSessionBackdrop) {
    return;
  }

  pendingDeleteSessionId = session.id;

  if (deleteSessionSummary) {
    deleteSessionSummary.textContent =
      `${formatShortDate(session.dateKey)} • ${formatMinutesOnly(session.minutes)} • ${session.subjectLabel} • ${session.topicText}`;
  }

  deleteSessionBackdrop.classList.add("is-visible");
  deleteSessionBackdrop.setAttribute("aria-hidden", "false");
  body.classList.add("modal-open");
}

function closeDeleteModal() {
  if (!deleteSessionBackdrop) {
    return;
  }

  pendingDeleteSessionId = null;
  deleteSessionBackdrop.classList.remove("is-visible");
  deleteSessionBackdrop.setAttribute("aria-hidden", "true");
  body.classList.remove("modal-open");
}

function setDeleteLoading(isLoading) {
  isDeletingSession = isLoading;

  if (!deleteSessionBackdrop || !confirmDeleteSessionButton) {
    return;
  }

  deleteSessionBackdrop.querySelectorAll("button").forEach((button) => {
    button.disabled = isLoading;
  });

  confirmDeleteSessionButton.textContent = isLoading ? "Apagando..." : "Apagar pr\u00e1tica";
}

function renderProgress() {
  if (!scoreNumber) {
    return;
  }

  const todayKey = toDateKey(new Date());
  const yesterdayKey = toDateKey(shiftDate(new Date(), -1));
  const todaySessions = getSessionsByDate(todayKey);
  const todayTotal = sumMinutes(todaySessions);
  const yesterdayTotal = sumMinutes(getSessionsByDate(yesterdayKey));
  const currentWeekMinutes = sumMinutes(getCurrentWeekSessions());
  const previousWeekMinutes = sumMinutes(getPreviousWeekSessions());
  const activeState = getCurrentState(todaySessions.length ? todaySessions : sessions);
  const goal = DAILY_GOALS[activeState] || DAILY_GOALS.normal;
  const streak = getStreak();

  scoreNumber.textContent = `${goal > 0 ? Math.round((todayTotal / goal) * 100) : 0}%`;
  vsYesterdayValue.textContent = formatSignedMinutes(todayTotal - yesterdayTotal);
  vsMonthValue.textContent = formatSignedMinutes(currentWeekMinutes - previousWeekMinutes);
  currentStateValue.textContent = capitalize(activeState);
  goalValue.textContent = formatMinutesOnly(goal);
  doneValue.textContent = formatMinutesOnly(todayTotal);
  streakValue.textContent = `${streak} dia${streak === 1 ? "" : "s"}`;
}

function renderSessionList(container, list, emptyMessage) {
  if (!container) {
    return;
  }

  container.replaceChildren();

  if (!list.length) {
    container.appendChild(createEmptyMessage(emptyMessage, "session-empty"));
    return;
  }

  list.forEach((session) => {
    container.appendChild(createSessionCard(session));
  });
}

function renderTodaySummary() {
  if (!todayDateLabel) {
    return;
  }

  const todayKey = toDateKey(new Date());
  const todaySessions = getSessionsByDate(todayKey);
  const todayMinutes = sumMinutes(todaySessions);
  const subjectStats = buildSubjectStats(todaySessions);
  const verbStats = buildWordStats(getVerbsFromSessions(todaySessions));
  const topicHighlights = getRecentTopics(todaySessions, 3);
  const latestSession = todaySessions[0];
  const topSubject = subjectStats[0];

  todayDateLabel.textContent = formatFullDate(todayKey);
  todayMinutesValue.textContent = formatMinutesOnly(todayMinutes);
  todayCountValue.textContent = String(todaySessions.length);
  todayStateValue.textContent = capitalize(latestSession?.state || "normal");
  todayActivitiesValue.textContent = subjectStats.length
    ? formatCompactList(subjectStats.slice(0, 2).map((item) => item.label), 2)
    : "Nenhuma";
  todayVerbsValue.textContent = verbStats.length
    ? formatCompactList(verbStats.slice(0, 3).map((item) => item.word), 3)
    : "Nenhum";

  if (todayPhraseCountValue) {
    todayPhraseCountValue.textContent = topicHighlights[0] || "Nenhum";
  }

  if (!todaySessions.length) {
    todayHighlightTitle.textContent = "Nenhuma pr\u00e1tica registrada hoje.";
    todayHighlightText.textContent =
      "Quando voc\u00ea salvar a primeira sess\u00e3o, este bloco vai mostrar sua mat\u00e9ria principal, o tema estudado e o ritmo do dia.";
  } else {
    const firstSession = todaySessions[todaySessions.length - 1];
    const topSubjectText = topSubject ? topSubject.label : "estudo livre";
    const verbsText = verbStats.length
      ? `Verbos em destaque: ${formatCompactList(verbStats.slice(0, 3).map((item) => item.word), 3)}.`
      : "Nenhum verbo de ingl\u00eas foi registrado hoje.";
    const latestTopicText = latestSession?.topicText
      ? `\u00daltimo tema registrado: ${latestSession.topicText}.`
      : "";

    todayHighlightTitle.textContent =
      `Hoje voc\u00ea registrou ${todaySessions.length} pr\u00e1tica${todaySessions.length === 1 ? "" : "s"} e ${formatMinutesOnly(todayMinutes)}.`;
    todayHighlightText.textContent =
      `A mat\u00e9ria mais frequente hoje foi ${topSubjectText}. Janela do dia: ${formatTime(firstSession.startedAt)} at\u00e9 ${formatTime(latestSession.endedAt)}. ${latestTopicText} ${verbsText}`;
  }

  renderChipList(
    todayActivitiesList,
    subjectStats.map((item) =>
      createDetailChip(item.label, `${item.count}x • ${formatMinutesOnly(item.minutes)}`, getSubjectColor(item.subjectKey))
    ),
    "Nenhuma mat\u00e9ria registrada."
  );

  renderChipList(
    todayVerbsList,
    verbStats.map((item) => createDetailChip(item.word, `${item.count}x`)),
    "Nenhum verbo de ingl\u00eas registrado."
  );

  renderSessionList(
    todaySessionsList,
    todaySessions,
    "Voc\u00ea ainda n\u00e3o registrou nenhuma pr\u00e1tica hoje."
  );

  const recentSessions = sortSessionsByStartDesc(
    sessions.filter((session) => session.dateKey !== todayKey)
  ).slice(0, 12);

  renderSessionList(recentSessionsList, recentSessions, "Nenhuma pr\u00e1tica recente.");
}

function renderFocusSubject() {
  if (!focusSubjectNameValue) {
    return;
  }

  const focusSubject = getFocusSubjectConfig();
  const monthlySessions = getCurrentMonthSessions();
  const focusSessions = getFocusSubjectSessions(monthlySessions);
  const focusMinutes = sumMinutes(focusSessions);
  const focusDays = countActiveDays(focusSessions);
  const latestFocusSession = sortSessionsByStartDesc(focusSessions)[0] || null;
  const otherMinutes = roundOne(Math.max(sumMinutes(monthlySessions) - focusMinutes, 0));

  focusSubjectNameValue.textContent = focusSubject.label;
  focusSubjectMinutesValue.textContent = formatMinutesOnly(focusMinutes);
  focusSubjectDaysValue.textContent = String(focusDays);
  focusSubjectTopicValue.textContent = latestFocusSession?.topicText || "Nenhum tema ainda";

  if (!monthlySessions.length) {
    focusSubjectInsightText.textContent =
      "Quando voc\u00ea salvar sess\u00f5es, sua mat\u00e9ria foco vai ganhar um bloco pr\u00f3prio com minutos, dias ativos e \u00faltimo tema estudado.";
    return;
  }

  if (!focusSessions.length) {
    focusSubjectInsightText.textContent =
      `${focusSubject.label} ainda n\u00e3o apareceu neste m\u00eas. A pr\u00f3xima sess\u00e3o nessa mat\u00e9ria j\u00e1 entra aqui automaticamente.`;
    return;
  }

  const comparisonText = otherMinutes > focusMinutes
    ? `Ainda h\u00e1 ${formatMinutesOnly(otherMinutes - focusMinutes)} a mais nas outras mat\u00e9rias do que em ${focusSubject.label}.`
    : otherMinutes === focusMinutes
      ? `${focusSubject.label} est\u00e1 empatada com o restante do seu m\u00eas.`
      : `${focusSubject.label} j\u00e1 lidera seu m\u00eas por ${formatMinutesOnly(focusMinutes - otherMinutes)}.`;

  focusSubjectInsightText.textContent =
    `${focusSubject.label} somou ${formatMinutesOnly(focusMinutes)} em ${focusDays} dia${focusDays === 1 ? "" : "s"} ativo${focusDays === 1 ? "" : "s"}. ${comparisonText}`;
}

function renderWeeklyAnalysis() {
  if (!weeklyMinutesValue) {
    return;
  }

  const weeklySessions = getCurrentWeekSessions();
  const weeklyEssays = getCurrentWeekEssaySubmissions();
  const previousWeeklyEssays = getPreviousWeekEssaySubmissions();
  const weeklyMinutes = sumMinutes(weeklySessions);
  const activeDays = countActiveDays(weeklySessions);
  const subjectStats = buildSubjectStats(weeklySessions);
  const verbStats = buildWordStats(getVerbsFromSessions(weeklySessions));
  const topicHighlights = getRecentTopics(weeklySessions, 3);
  const weeklyEssayAverage = getEssayAverageScore(weeklyEssays);
  const previousWeeklyEssayAverage = getEssayAverageScore(previousWeeklyEssays);
  const weeklyEssayLatest = weeklyEssays[0] || null;
  const weeklyCompetencyStats = buildEssayCompetencyStats(weeklyEssays);
  const weeklyStrongestCompetency = weeklyCompetencyStats[0] || null;
  const weeklyWeakestCompetency = weeklyCompetencyStats[weeklyCompetencyStats.length - 1] || null;
  const topSubject = subjectStats[0];
  const runnerUp = subjectStats[1];
  const comparison = weeklyMinutes - sumMinutes(getPreviousWeekSessions());
  const focusSessions = getFocusSubjectSessions(weeklySessions);
  const focusSubject = getFocusSubjectConfig();

  weeklyMinutesValue.textContent = formatMinutesOnly(weeklyMinutes);
  weeklyDaysValue.textContent = String(activeDays);
  weeklyTopActivityValue.textContent = topSubject?.label || "Nenhuma";
  weeklyPhraseCountValue.textContent = topicHighlights[0] || "Nenhum";
  if (weeklyEssayAverageValue) {
    weeklyEssayAverageValue.textContent = weeklyEssays.length ? formatEssayScore(weeklyEssayAverage) : "Sem nota";
  }
  if (weeklyEssayLatestValue) {
    weeklyEssayLatestValue.textContent = weeklyEssayLatest
      ? formatEssayScore(weeklyEssayLatest.totalScore)
      : "Sem redação";
  }

  if (!weeklySessions.length && !weeklyEssays.length) {
    weeklyInsightTitle.textContent = "Ainda n\u00e3o h\u00e1 dados suficientes nesta semana.";
    weeklyInsightText.textContent =
      "Conforme voc\u00ea registrar sess\u00f5es, o painel semanal vai destacar a mat\u00e9ria dominante, os temas mais recentes e o peso da sua mat\u00e9ria foco.";
  } else if (!weeklySessions.length) {
    const latestEssayText = weeklyEssayLatest
      ? `Última nota: ${formatEssayScore(weeklyEssayLatest.totalScore)}.`
      : "";
    const competencyText = weeklyCompetencyStats.length
      ? `Mais forte: ${weeklyStrongestCompetency?.shortLabel || "C1"} | ${weeklyStrongestCompetency?.label || "Norma padrão"}. Mais difícil: ${weeklyWeakestCompetency?.shortLabel || "C5"} | ${weeklyWeakestCompetency?.label || "Intervenção"}.`
      : "";

    weeklyInsightTitle.textContent =
      `Nesta semana você corrigiu ${weeklyEssays.length} redação${weeklyEssays.length === 1 ? "" : "ões"}.`;
    weeklyInsightText.textContent =
      `${describeEssayComparison(weeklyEssayAverage, previousWeeklyEssayAverage, "nesta semana")} ${latestEssayText} ${competencyText}`.trim();
  } else {
    const comparisonText =
      comparison === 0
        ? "o mesmo volume da semana passada"
        : comparison > 0
          ? `${formatNumber(comparison)} min a mais que na semana passada`
          : `${formatNumber(Math.abs(comparison))} min a menos que na semana passada`;
    const weeklyLeadText = runnerUp
      ? `${topSubject.label} liderou sua semana, seguida por ${runnerUp.label}.`
      : `${topSubject?.label || "Nenhuma mat\u00e9ria"} foi a mat\u00e9ria dominante da semana.`;
    const focusText = focusSessions.length
      ? `${focusSubject.label} recebeu ${formatMinutesOnly(sumMinutes(focusSessions))} nesta semana.`
      : `${focusSubject.label} ainda n\u00e3o apareceu nesta semana.`;
    const weeklyVerbText = verbStats.length
      ? `Verbos do ingl\u00eas: ${formatTopWords(verbStats)}.`
      : "Nenhum verbo do ingl\u00eas foi registrado nesta semana.";
    const topicText = topicHighlights.length
      ? `Temas recentes: ${formatCompactList(topicHighlights, 3)}.`
      : "";
    const essayText = weeklyEssays.length
      ? `${describeEssayComparison(weeklyEssayAverage, previousWeeklyEssayAverage, "nesta semana")} ${weeklyEssays.length} redação${weeklyEssays.length === 1 ? "" : "ões"} corrigida${weeklyEssays.length === 1 ? "" : "s"}. Última nota: ${formatEssayScore(weeklyEssayLatest?.totalScore || 0)}. Mais forte: ${weeklyStrongestCompetency?.shortLabel || "C1"} | ${weeklyStrongestCompetency?.label || "Norma padrão"}. Mais difícil: ${weeklyWeakestCompetency?.shortLabel || "C5"} | ${weeklyWeakestCompetency?.label || "Intervenção"}.`
      : "Nenhuma redação corrigida nesta semana.";

    weeklyInsightTitle.textContent =
      `Nesta semana voc\u00ea estudou em ${activeDays} dia${activeDays === 1 ? "" : "s"} e somou ${formatMinutesOnly(weeklyMinutes)}.`;
    weeklyInsightText.textContent =
      `${weeklyLeadText} O Start 5 registrou ${comparisonText}. ${focusText} ${topicText} ${weeklyVerbText} ${essayText}`;
  }

  renderDonutChart(
    weeklyActivityChart,
    subjectStats,
    weeklyMinutes,
    "Nenhuma mat\u00e9ria registrada nesta semana."
  );

  renderBarChart(
    weeklyDailyChart,
    buildWeeklyDailyPoints(weeklySessions),
    "Nenhum dia com pr\u00e1tica nesta semana."
  );

  renderActivityRows(
    weeklyActivityList,
    subjectStats,
    "Nenhuma mat\u00e9ria registrada nesta semana."
  );

  renderChipList(
    weeklyVerbList,
    verbStats.map((item) => createDetailChip(item.word, `${item.count}x`)),
    "Nenhum verbo do ingl\u00eas registrado nesta semana."
  );

  renderEssayRows(
    weeklyEssayList,
    weeklyEssays,
    "Nenhuma redação corrigida nesta semana."
  );

  renderEssayCompetencyRows(
    weeklyEssayCompetencyList,
    weeklyCompetencyStats,
    "Nenhuma competência avaliada nesta semana."
  );
}

function renderMonthlyAnalysis() {
  if (!monthlyMinutesValue) {
    return;
  }

  const monthlySessions = getCurrentMonthSessions();
  const monthlyEssays = getCurrentMonthEssaySubmissions();
  const previousMonthEssays = getPreviousMonthEssaySubmissions();
  const monthlyMinutes = sumMinutes(monthlySessions);
  const activeDays = countActiveDays(monthlySessions);
  const subjectStats = buildSubjectStats(monthlySessions);
  const verbStats = buildWordStats(getVerbsFromSessions(monthlySessions));
  const topicHighlights = getRecentTopics(monthlySessions, 3);
  const monthlyEssayAverage = getEssayAverageScore(monthlyEssays);
  const previousMonthEssayAverage = getEssayAverageScore(previousMonthEssays);
  const monthlyEssayLatest = monthlyEssays[0] || null;
  const monthlyCompetencyStats = buildEssayCompetencyStats(monthlyEssays);
  const monthlyStrongestCompetency = monthlyCompetencyStats[0] || null;
  const monthlyWeakestCompetency = monthlyCompetencyStats[monthlyCompetencyStats.length - 1] || null;
  const topSubject = subjectStats[0];
  const focusSessions = getFocusSubjectSessions(monthlySessions);
  const focusSubject = getFocusSubjectConfig();

  monthlyMinutesValue.textContent = formatMinutesOnly(monthlyMinutes);
  monthlyDaysValue.textContent = String(activeDays);
  monthlyTopActivityValue.textContent = topSubject?.label || "Nenhuma";
  monthlyPhraseCountValue.textContent = topicHighlights[0] || "Nenhum";
  if (monthlyEssayAverageValue) {
    monthlyEssayAverageValue.textContent = monthlyEssays.length ? formatEssayScore(monthlyEssayAverage) : "Sem nota";
  }
  if (monthlyEssayLatestValue) {
    monthlyEssayLatestValue.textContent = monthlyEssayLatest
      ? formatEssayScore(monthlyEssayLatest.totalScore)
      : "Sem redação";
  }

  if (!monthlySessions.length && !monthlyEssays.length) {
    monthlyInsightTitle.textContent = "Ainda n\u00e3o h\u00e1 dados suficientes neste m\u00eas.";
    monthlyInsightText.textContent =
      "O Start 5 vai mostrar quais mat\u00e9rias dominaram o m\u00eas, quais temas apareceram mais e como sua mat\u00e9ria foco est\u00e1 caminhando.";
  } else if (!monthlySessions.length) {
    const latestEssayText = monthlyEssayLatest
      ? `Última nota: ${formatEssayScore(monthlyEssayLatest.totalScore)}.`
      : "";
    const competencyText = monthlyCompetencyStats.length
      ? `Mais forte: ${monthlyStrongestCompetency?.shortLabel || "C1"} | ${monthlyStrongestCompetency?.label || "Norma padrão"}. Mais difícil: ${monthlyWeakestCompetency?.shortLabel || "C5"} | ${monthlyWeakestCompetency?.label || "Intervenção"}.`
      : "";

    monthlyInsightTitle.textContent =
      `Neste mês você corrigiu ${monthlyEssays.length} redação${monthlyEssays.length === 1 ? "" : "ões"}.`;
    monthlyInsightText.textContent =
      `${describeEssayComparison(monthlyEssayAverage, previousMonthEssayAverage, "neste mês")} ${latestEssayText} ${competencyText}`.trim();
  } else {
    const runnerUp = subjectStats[1];
    const monthlyVerbText = verbStats.length
      ? `Verbos do ingl\u00eas: ${formatTopWords(verbStats)}.`
      : "Nenhum verbo do ingl\u00eas foi registrado neste m\u00eas.";
    const monthlyLeadText = runnerUp
      ? `${topSubject.label} lidera seu m\u00eas com ${topSubject.count} registros. Em seguida vem ${runnerUp.label}.`
      : `${topSubject?.label || "Nenhuma mat\u00e9ria"} foi a mat\u00e9ria dominante do m\u00eas.`;
    const focusText = focusSessions.length
      ? `${focusSubject.label} recebeu ${formatMinutesOnly(sumMinutes(focusSessions))} neste m\u00eas.`
      : `${focusSubject.label} ainda n\u00e3o apareceu neste m\u00eas.`;
    const topicText = topicHighlights.length
      ? `Temas em alta: ${formatCompactList(topicHighlights, 3)}.`
      : "";
    const essayText = monthlyEssays.length
      ? `${describeEssayComparison(monthlyEssayAverage, previousMonthEssayAverage, "neste mês")} ${monthlyEssays.length} redação${monthlyEssays.length === 1 ? "" : "ões"} corrigida${monthlyEssays.length === 1 ? "" : "s"}. Última nota: ${formatEssayScore(monthlyEssayLatest?.totalScore || 0)}. Mais forte: ${monthlyStrongestCompetency?.shortLabel || "C1"} | ${monthlyStrongestCompetency?.label || "Norma padrão"}. Mais difícil: ${monthlyWeakestCompetency?.shortLabel || "C5"} | ${monthlyWeakestCompetency?.label || "Intervenção"}.`
      : "Nenhuma redação corrigida neste mês.";

    monthlyInsightTitle.textContent =
      `Neste m\u00eas voc\u00ea somou ${formatMinutesOnly(monthlyMinutes)} em ${activeDays} dia${activeDays === 1 ? "" : "s"} ativo${activeDays === 1 ? "" : "s"}.`;
    monthlyInsightText.textContent = `${monthlyLeadText} ${focusText} ${topicText} ${monthlyVerbText} ${essayText}`;
  }

  renderDonutChart(
    monthlyActivityChart,
    subjectStats,
    monthlyMinutes,
    "Nenhuma mat\u00e9ria registrada neste m\u00eas."
  );

  renderBarChart(
    monthlyWeekChart,
    buildMonthlyWeekPoints(monthlySessions),
    "Nenhuma semana com dados ainda."
  );

  renderActivityRows(
    monthlyActivityList,
    subjectStats,
    "Nenhuma mat\u00e9ria registrada neste m\u00eas."
  );

  renderChipList(
    monthlyVerbList,
    verbStats.map((item) => createDetailChip(item.word, `${item.count}x`)),
    "Nenhum verbo do ingl\u00eas registrado neste m\u00eas."
  );

  renderEssayRows(
    monthlyEssayList,
    monthlyEssays,
    "Nenhuma redação corrigida neste mês."
  );

  renderEssayCompetencyRows(
    monthlyEssayCompetencyList,
    monthlyCompetencyStats,
    "Nenhuma competência avaliada neste mês."
  );
}

function renderDashboard() {
  renderProgress();
  renderFocusSubject();
  renderTodaySummary();
  renderWeeklyAnalysis();
  renderMonthlyAnalysis();
  window.Start5Auth?.setHeaderMonthlyMinutes?.(sumMinutes(getCurrentMonthSessions()));
}

function findSessionById(sessionId) {
  return sessions.find((session) => session.id === sessionId) || null;
}

function getCurrentSessionPayload() {
  const customSubjectName = String(customSubjectInput?.value || "").trim();
  return {
    minutes: getMinutesToSave(),
    state: selectedState,
    subjectKey: selectedSubjectKey,
    customSubjectName,
    topicText: String(topicInput?.value || "").trim(),
    verbs: selectedVerbs,
    phrases: selectedPhrases,
    englishDetails: {
      verbs: [...selectedVerbs],
      phrases: [...selectedPhrases],
    },
    notes: String(notesInput?.value || "").trim(),
  };
}

async function saveSession() {
  if (isSavingSession) {
    return;
  }

  const payload = getCurrentSessionPayload();

  if (!Number.isFinite(payload.minutes) || payload.minutes <= 0) {
    sessionHelper.textContent = "Escolha um tempo v\u00e1lido para salvar a pr\u00e1tica.";
    return;
  }

  if (!payload.topicText) {
    sessionHelper.textContent = "Descreva o que voc\u00ea estudou hoje.";
    return;
  }

  if (payload.subjectKey === "outras" && !payload.customSubjectName) {
    sessionHelper.textContent = "Digite o nome da mat\u00e9ria antes de salvar.";
    return;
  }

  setSaveSessionLoading(true);

  try {
    if (editingSessionId) {
      await window.Start5Auth.apiRequest(`/api/sessions/${editingSessionId}`, {
        method: "PATCH",
        body: payload,
      });
    } else {
      await window.Start5Auth.apiRequest("/api/sessions", {
        method: "POST",
        body: payload,
      });
    }

    await loadSessionsFromApi();
    renderDashboard();
    closeSessionModal();
  } catch (error) {
    sessionHelper.textContent = error.message || "N\u00e3o foi poss\u00edvel salvar a pr\u00e1tica.";
  } finally {
    setSaveSessionLoading(false);
  }
}

async function confirmDeleteSession() {
  if (isDeletingSession || !pendingDeleteSessionId) {
    return;
  }

  setDeleteLoading(true);

  try {
    await window.Start5Auth.apiRequest(`/api/sessions/${pendingDeleteSessionId}`, {
      method: "DELETE",
    });

    await loadSessionsFromApi();
    renderDashboard();
    closeDeleteModal();
  } catch (error) {
    console.error("Erro ao apagar sess\u00e3o:", error);

    if (deleteSessionSummary) {
      deleteSessionSummary.textContent = error.message || "N\u00e3o foi poss\u00edvel apagar a pr\u00e1tica.";
    }
  } finally {
    setDeleteLoading(false);
  }
}

function handleSessionActionClick(event) {
  const button = event.target.closest("[data-session-action]");

  if (!button) {
    return;
  }

  const sessionId = Number(button.dataset.sessionId);
  const action = button.dataset.sessionAction;
  const session = findSessionById(sessionId);

  if (!session) {
    return;
  }

  if (action === "edit") {
    openSessionModal(session);
    return;
  }

  if (action === "delete") {
    openDeleteModal(session);
  }
}

function bindEvents() {
  if (menuToggle) {
    menuToggle.addEventListener("click", toggleMenu);
  }

  if (menuPanel) {
    menuPanel.addEventListener("click", (event) => {
      if (event.target === menuPanel) {
        closeMenu();
      }
    });
  }

  stateButtons.forEach((button) => {
    button.addEventListener("click", () => {
      setSelectedState(button.dataset.state || "normal");
    });
  });

  durationButtons.forEach((button) => {
    button.addEventListener("click", () => {
      if (button.disabled) {
        return;
      }

      selectedDuration = button.dataset.duration || AUTO_DURATION_BY_STATE[selectedState];
      updateDurationButtons();
      updateSessionHelper();
    });
  });

  subjectSelect?.addEventListener("change", () => {
    setSelectedSubject(subjectSelect.value || DEFAULT_SUBJECT_KEY);
  });

  customSubjectSuggestions?.addEventListener("click", (event) => {
    const button = event.target.closest("[data-custom-subject-suggestion]");

    if (!button || !customSubjectInput) {
      return;
    }

    selectedSubjectKey = "outras";
    customSubjectInput.value = button.dataset.customSubjectSuggestion || "";
    updateSubjectSelectionUI();
    updateDetailFieldsVisibility();
    updateSessionHelper();
    customSubjectInput.focus();
  });

  bindVerbInput();
  bindTokenInput(phrasesEntryInput, "phrase");

  verbsTokenList?.addEventListener("click", (event) => {
    const button = event.target.closest("[data-token-type='verb']");

    if (button) {
      removeStructuredItem("verb", button.dataset.tokenValue || "");
    }
  });

  phrasesTokenList?.addEventListener("click", (event) => {
    const button = event.target.closest("[data-token-type='phrase']");

    if (button) {
      removeStructuredItem("phrase", button.dataset.tokenValue || "");
    }
  });

  extraMinutesInput?.addEventListener("input", updateSessionHelper);
  customSubjectInput?.addEventListener("input", () => {
    selectedSubjectKey = "outras";
    updateSubjectSelectionUI();
    updateSessionHelper();
  });
  topicInput?.addEventListener("input", updateSessionHelper);
  notesInput?.addEventListener("input", updateSessionHelper);

  startSessionButtons.forEach((button) => {
    button.addEventListener("click", () => {
      openSessionModal();
    });
  });

  closeSessionModalButtons.forEach((button) => {
    button.addEventListener("click", closeSessionModal);
  });

  modalBackdrop?.addEventListener("click", (event) => {
    if (event.target === modalBackdrop) {
      closeSessionModal();
    }
  });

  closeDeleteModalButtons.forEach((button) => {
    button.addEventListener("click", closeDeleteModal);
  });

  deleteSessionBackdrop?.addEventListener("click", (event) => {
    if (event.target === deleteSessionBackdrop) {
      closeDeleteModal();
    }
  });

  saveSessionButton?.addEventListener("click", saveSession);
  confirmDeleteSessionButton?.addEventListener("click", confirmDeleteSession);

  todaySessionsList?.addEventListener("click", handleSessionActionClick);
  recentSessionsList?.addEventListener("click", handleSessionActionClick);

  document.addEventListener("keydown", (event) => {
    if (event.key !== "Escape") {
      return;
    }

    if (deleteSessionBackdrop?.classList.contains("is-visible")) {
      closeDeleteModal();
      return;
    }

    if (modalBackdrop?.classList.contains("is-visible")) {
      closeSessionModal();
      return;
    }

    if (body.classList.contains("menu-open")) {
      closeMenu();
    }
  });
}

async function initializeApp() {
  resetSessionForm();
  bindEvents();

  if (!window.Start5Auth?.ready) {
    return;
  }

  await window.Start5Auth.ready;

  if (!window.Start5Auth.getSession()) {
    return;
  }

  await importLegacySessionsIfNeeded();
  await loadSessionsFromApi();
  await loadEssaySubmissionsFromApi();
  renderDashboard();
}

initializeApp().catch((error) => {
  console.error("Erro ao inicializar o painel do Start 5:", error);
});
