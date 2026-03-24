const body = document.body;

const menuToggle = document.getElementById("menuToggle");
const menuPanel = document.getElementById("menuPanel");

const modalBackdrop = document.getElementById("sessionModalBackdrop");
const sessionForm = document.getElementById("sessionForm");
const sessionModalTitle = document.getElementById("sessionModalTitle");
const sessionModalActions = document.getElementById("sessionModalActions");
const startSessionButtons = [...document.querySelectorAll("#startSessionButton")];
const closeSessionModalButtons = [...document.querySelectorAll("[data-close-session-modal]")];
const saveSessionButton = document.getElementById("saveSessionButton");
const sessionHelper = document.getElementById("sessionHelper");

const subjectSelect = document.getElementById("subjectSelect");
const customSubjectField = document.getElementById("customSubjectField");
const customSubjectInput = document.getElementById("customSubjectInput");
const customSubjectSuggestions = document.getElementById("customSubjectSuggestions");
const topicInput = document.getElementById("topicInput");

const studyMinutesInput = document.getElementById("studyMinutesInput");
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

const deleteSessionBackdrop = document.getElementById("deleteSessionBackdrop");
const deleteSessionForm = document.getElementById("deleteSessionForm");
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
const routineWeekLabel = document.getElementById("routineWeekLabel");
const routineExecutionValue = document.getElementById("routineExecutionValue");
const routinePriorityValue = document.getElementById("routinePriorityValue");
const routineReinforcementValue = document.getElementById("routineReinforcementValue");
const routineMinutesValue = document.getElementById("routineMinutesValue");
const routineSummaryText = document.getElementById("routineSummaryText");

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
const panelTabButtons = [...document.querySelectorAll("[data-panel-tab]")];
const panelSections = [...document.querySelectorAll("[data-panel-section]")];
const dashboardViewCopy = document.getElementById("dashboardViewCopy");
const analyticsRangeButtons = [...document.querySelectorAll("[data-analytics-range]")];
const dashboardFocusViewButtons = [...document.querySelectorAll("[data-dashboard-focus-view]")];
const analyticsDom = {
  analysisPulseLabel: document.getElementById("analysisPulseLabel"),
  analysisWindowLabel: document.getElementById("analysisWindowLabel"),
  analysisCoverageLabel: document.getElementById("analysisCoverageLabel"),
  overviewTotalMinutesValue: document.getElementById("overviewTotalMinutesValue"),
  overviewTotalMinutesHelper: document.getElementById("overviewTotalMinutesHelper"),
  overviewStreakValue: document.getElementById("overviewStreakValue"),
  overviewStreakHelper: document.getElementById("overviewStreakHelper"),
  overviewQuestionCountValue: document.getElementById("overviewQuestionCountValue"),
  overviewQuestionCountHelper: document.getElementById("overviewQuestionCountHelper"),
  overviewEssayCountValue: document.getElementById("overviewEssayCountValue"),
  overviewEssayCountHelper: document.getElementById("overviewEssayCountHelper"),
  overviewAveragePerformanceValue: document.getElementById("overviewAveragePerformanceValue"),
  overviewAveragePerformanceHelper: document.getElementById("overviewAveragePerformanceHelper"),
  overviewStrongAreaValue: document.getElementById("overviewStrongAreaValue"),
  overviewStrongAreaHelper: document.getElementById("overviewStrongAreaHelper"),
  overviewWeakAreaValue: document.getElementById("overviewWeakAreaValue"),
  overviewWeakAreaHelper: document.getElementById("overviewWeakAreaHelper"),
  overviewConsistencyValue: document.getElementById("overviewConsistencyValue"),
  overviewConsistencyHelper: document.getElementById("overviewConsistencyHelper"),
  routineDaysStudiedValue: document.getElementById("routineDaysStudiedValue"),
  routineDaysStudiedHelper: document.getElementById("routineDaysStudiedHelper"),
  routineBestHourValue: document.getElementById("routineBestHourValue"),
  routineBestHourHelper: document.getElementById("routineBestHourHelper"),
  routineAverageDayValue: document.getElementById("routineAverageDayValue"),
  routineAverageDayHelper: document.getElementById("routineAverageDayHelper"),
  routineAverageSessionValue: document.getElementById("routineAverageSessionValue"),
  routineAverageSessionHelper: document.getElementById("routineAverageSessionHelper"),
  routineFrequencyValue: document.getElementById("routineFrequencyValue"),
  routineFrequencyHelper: document.getElementById("routineFrequencyHelper"),
  routineGapValue: document.getElementById("routineGapValue"),
  routineGapHelper: document.getElementById("routineGapHelper"),
  routineWeekChart: document.getElementById("routineWeekChart"),
  routineHourChart: document.getElementById("routineHourChart"),
  routineBehaviorList: document.getElementById("routineBehaviorList"),
  questionAnsweredValue: document.getElementById("questionAnsweredValue"),
  questionAnsweredHelper: document.getElementById("questionAnsweredHelper"),
  questionCorrectValue: document.getElementById("questionCorrectValue"),
  questionCorrectHelper: document.getElementById("questionCorrectHelper"),
  questionWrongValue: document.getElementById("questionWrongValue"),
  questionWrongHelper: document.getElementById("questionWrongHelper"),
  questionAccuracyValue: document.getElementById("questionAccuracyValue"),
  questionAccuracyHelper: document.getElementById("questionAccuracyHelper"),
  questionExamList: document.getElementById("questionExamList"),
  questionSubjectList: document.getElementById("questionSubjectList"),
  questionTrendChart: document.getElementById("questionTrendChart"),
  questionInsightList: document.getElementById("questionInsightList"),
  essayTotalValue: document.getElementById("essayTotalValue"),
  essayTotalHelper: document.getElementById("essayTotalHelper"),
  essayAverageValue: document.getElementById("essayAverageValue"),
  essayAverageHelper: document.getElementById("essayAverageHelper"),
  essayLastScoreValue: document.getElementById("essayLastScoreValue"),
  essayLastScoreHelper: document.getElementById("essayLastScoreHelper"),
  essayBestScoreValue: document.getElementById("essayBestScoreValue"),
  essayBestScoreHelper: document.getElementById("essayBestScoreHelper"),
  essayWeakCompetencyValue: document.getElementById("essayWeakCompetencyValue"),
  essayWeakCompetencyHelper: document.getElementById("essayWeakCompetencyHelper"),
  essayStableCompetencyValue: document.getElementById("essayStableCompetencyValue"),
  essayStableCompetencyHelper: document.getElementById("essayStableCompetencyHelper"),
  essayTrendChart: document.getElementById("essayTrendChart"),
  essayCompetencyBoard: document.getElementById("essayCompetencyBoard"),
  essayThemeList: document.getElementById("essayThemeList"),
  essayInsightList: document.getElementById("essayInsightList"),
  englishPracticeCountValue: document.getElementById("englishPracticeCountValue"),
  englishPracticeCountHelper: document.getElementById("englishPracticeCountHelper"),
  englishMinutesValue: document.getElementById("englishMinutesValue"),
  englishMinutesHelper: document.getElementById("englishMinutesHelper"),
  englishVerbCountValue: document.getElementById("englishVerbCountValue"),
  englishVerbCountHelper: document.getElementById("englishVerbCountHelper"),
  englishObservationValue: document.getElementById("englishObservationValue"),
  englishObservationHelper: document.getElementById("englishObservationHelper"),
  englishConsistencyValue: document.getElementById("englishConsistencyValue"),
  englishConsistencyHelper: document.getElementById("englishConsistencyHelper"),
  englishVerbList: document.getElementById("englishVerbList"),
  englishObservationList: document.getElementById("englishObservationList"),
  englishTrendChart: document.getElementById("englishTrendChart"),
  englishInsightList: document.getElementById("englishInsightList"),
  dashboardRecommendationsList: document.getElementById("dashboardRecommendationsList"),
  recentEssayTimeline: document.getElementById("recentEssayTimeline"),
};

const modernDashboardDom = {
  modernHeroTotalMinutes: document.getElementById("modernHeroTotalMinutes"),
  modernHeroTotalMinutesHelper: document.getElementById("modernHeroTotalMinutesHelper"),
  modernHeroQuestionAccuracy: document.getElementById("modernHeroQuestionAccuracy"),
  modernHeroQuestionAccuracyHelper: document.getElementById("modernHeroQuestionAccuracyHelper"),
  modernHeroEssayAverage: document.getElementById("modernHeroEssayAverage"),
  modernHeroEssayAverageHelper: document.getElementById("modernHeroEssayAverageHelper"),
  modernHeroConsistency: document.getElementById("modernHeroConsistency"),
  modernHeroConsistencyHelper: document.getElementById("modernHeroConsistencyHelper"),
  modernHeroFocusArea: document.getElementById("modernHeroFocusArea"),
  modernHeroFocusAreaHelper: document.getElementById("modernHeroFocusAreaHelper"),
  cardOverallSessionsValue: document.getElementById("cardOverallSessionsValue"),
  cardOverallTimeValue: document.getElementById("cardOverallTimeValue"),
  cardOverallBestValue: document.getElementById("cardOverallBestValue"),
  cardOverallWeakValue: document.getElementById("cardOverallWeakValue"),
  dashboardOverallCardChart: document.getElementById("dashboardOverallCardChart"),
  cardRoutineDaysValue: document.getElementById("cardRoutineDaysValue"),
  cardRoutineStreakValue: document.getElementById("cardRoutineStreakValue"),
  cardRoutineAverageValue: document.getElementById("cardRoutineAverageValue"),
  cardRoutineFrequencyValue: document.getElementById("cardRoutineFrequencyValue"),
  dashboardRoutineCardChart: document.getElementById("dashboardRoutineCardChart"),
  cardQuestionsTotalValue: document.getElementById("cardQuestionsTotalValue"),
  cardQuestionsAccuracyValue: document.getElementById("cardQuestionsAccuracyValue"),
  cardQuestionsErrorsValue: document.getElementById("cardQuestionsErrorsValue"),
  cardQuestionsWeakSubjectValue: document.getElementById("cardQuestionsWeakSubjectValue"),
  dashboardQuestionsCardChart: document.getElementById("dashboardQuestionsCardChart"),
  cardEssayTotalValue: document.getElementById("cardEssayTotalValue"),
  cardEssayAverageValue: document.getElementById("cardEssayAverageValue"),
  cardEssayLastValue: document.getElementById("cardEssayLastValue"),
  cardEssayWeakValue: document.getElementById("cardEssayWeakValue"),
  dashboardEssayCardChart: document.getElementById("dashboardEssayCardChart"),
  cardEnglishCountValue: document.getElementById("cardEnglishCountValue"),
  cardEnglishMinutesValue: document.getElementById("cardEnglishMinutesValue"),
  cardEnglishVerbValue: document.getElementById("cardEnglishVerbValue"),
  cardEnglishFrequencyValue: document.getElementById("cardEnglishFrequencyValue"),
  dashboardEnglishCardChart: document.getElementById("dashboardEnglishCardChart"),
  dashboardOverallTrendHelper: document.getElementById("dashboardOverallTrendHelper"),
  dashboardOverallTrendChart: document.getElementById("dashboardOverallTrendChart"),
  dashboardRoutineTrendChart: document.getElementById("dashboardRoutineTrendChart"),
  dashboardRoutineSummaryList: document.getElementById("dashboardRoutineSummaryList"),
  dashboardQuestionTrendChartModern: document.getElementById("dashboardQuestionTrendChartModern"),
  dashboardQuestionSummaryList: document.getElementById("dashboardQuestionSummaryList"),
  dashboardEssayTrendChartModern: document.getElementById("dashboardEssayTrendChartModern"),
  dashboardEssaySummaryList: document.getElementById("dashboardEssaySummaryList"),
  dashboardEnglishTrendChartModern: document.getElementById("dashboardEnglishTrendChartModern"),
  dashboardEnglishSummaryList: document.getElementById("dashboardEnglishSummaryList"),
  dashboardRecommendationsListModern: document.getElementById("dashboardRecommendationsListModern"),
  dashboardFocusTitle: document.getElementById("dashboardFocusTitle"),
  dashboardFocusNote: document.getElementById("dashboardFocusNote"),
  dashboardFocusLegend: document.getElementById("dashboardFocusLegend"),
  dashboardFocusChart: document.getElementById("dashboardFocusChart"),
  dashboardFocusMetrics: document.getElementById("dashboardFocusMetrics"),
};

const MIN_SESSION_MINUTES = 10;

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
const VALID_STATES = new Set(["cansado", "normal", "focado"]);
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
let questionAttempts = [];
let routinePlan = null;
let selectedSubjectKey = DEFAULT_SUBJECT_KEY;
let selectedVerbs = [];
let selectedPhrases = [];
let selectedNotes = "";
let editingSessionId = null;
let pendingDeleteSessionId = null;
let isSavingSession = false;
let isDeletingSession = false;
let isCustomVerbMode = false;
let analyticsRange = "30d";
let dashboardFocusView = "panorama";

function isDialogElement(element) {
  return typeof HTMLDialogElement !== "undefined" && element instanceof HTMLDialogElement;
}

function isModalLayerOpen(element) {
  if (!element) {
    return false;
  }

  if (isDialogElement(element)) {
    return element.open;
  }

  return element.classList.contains("is-visible");
}

function showModalLayer(element) {
  if (!element) {
    return;
  }

  if (isDialogElement(element)) {
    if (!element.open) {
      element.showModal();
    }

    return;
  }

  element.classList.add("is-visible");
}

function hideModalLayer(element) {
  if (!element) {
    return;
  }

  if (isDialogElement(element)) {
    if (element.open) {
      element.close();
    }

    return;
  }

  element.classList.remove("is-visible");
}

function setSessionActionsRevealed(isRevealed) {
  if (!sessionModalActions) {
    return;
  }

  sessionModalActions.classList.toggle("is-revealed", isRevealed);
  sessionModalActions.toggleAttribute("inert", !isRevealed);
  sessionModalActions.setAttribute("aria-hidden", String(!isRevealed));
}

function updateSessionActionsVisibility() {
  if (!sessionForm || !sessionModalActions) {
    return;
  }

  const canScroll = sessionForm.scrollHeight > sessionForm.clientHeight + 16;
  const isAtBottom =
    sessionForm.scrollTop + sessionForm.clientHeight >= sessionForm.scrollHeight - 16;

  setSessionActionsRevealed(!canScroll || isAtBottom);
}

function refreshSessionActionsVisibility() {
  window.requestAnimationFrame(updateSessionActionsVisibility);
}

function updateStudyMinutesValidity() {
  if (!studyMinutesInput) {
    return;
  }

  const minutes = Number(studyMinutesInput.value);
  const isEmpty = String(studyMinutesInput.value || "").trim() === "";

  if (isEmpty) {
    studyMinutesInput.setCustomValidity("Informe quanto tempo voce estudou hoje.");
    return;
  }

  if (!Number.isFinite(minutes) || minutes < MIN_SESSION_MINUTES) {
    studyMinutesInput.setCustomValidity(`Informe pelo menos ${MIN_SESSION_MINUTES} minutos.`);
    return;
  }

  studyMinutesInput.setCustomValidity("");
}

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

function formatPercent(value) {
  const safeValue = Math.max(0, Math.round(Number(value) || 0));
  return `${safeValue}%`;
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

function formatWeekRangeLabel(weekStartKey, weekEndKey) {
  const startDate = parseDateKey(weekStartKey);
  const endDate = parseDateKey(weekEndKey);

  if (!isValidDate(startDate) || !isValidDate(endDate)) {
    return "Semana atual";
  }

  return `${startDate.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "short",
  })} - ${endDate.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "short",
  })}`;
}

function capitalize(value) {
  const safeValue = String(value || "").trim();

  if (!safeValue) {
    return "";
  }

  return safeValue.charAt(0).toUpperCase() + safeValue.slice(1);
}

function truncateText(value, maxLength = 48) {
  const safeValue = String(value || "").trim();

  if (safeValue.length <= maxLength) {
    return safeValue;
  }

  return `${safeValue.slice(0, Math.max(0, maxLength - 3)).trimEnd()}...`;
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

const ANALYTICS_RANGE_DEFINITIONS = {
  "7d": { label: "ultimos 7 dias", days: 7 },
  "30d": { label: "ultimos 30 dias", days: 30 },
  "90d": { label: "ultimos 90 dias", days: 90 },
  all: { label: "todo o historico", days: null },
};

function getAnalyticsRangeConfig(range = analyticsRange) {
  return ANALYTICS_RANGE_DEFINITIONS[range] || ANALYTICS_RANGE_DEFINITIONS["30d"];
}

function getRangeEndDate() {
  const endDate = new Date();
  endDate.setHours(23, 59, 59, 999);
  return endDate;
}

function getRangeStartDate(range = analyticsRange) {
  const config = getAnalyticsRangeConfig(range);

  if (!config.days) {
    return null;
  }

  const startDate = new Date();
  startDate.setHours(0, 0, 0, 0);
  startDate.setDate(startDate.getDate() - (config.days - 1));
  return startDate;
}

function getRangeDayCount(range = analyticsRange) {
  const config = getAnalyticsRangeConfig(range);

  if (config.days) {
    return config.days;
  }

  const datedValues = [
    ...sessions.map((session) => getSessionStartDate(session)),
    ...getEvaluatedEssaySubmissions().map((submission) => getEssayReferenceDate(submission)),
    ...questionAttempts.map((attempt) => getQuestionAttemptDate(attempt)),
  ].filter(isValidDate);

  if (!datedValues.length) {
    return 1;
  }

  const firstDate = datedValues.sort((left, right) => left.getTime() - right.getTime())[0];
  const today = getRangeEndDate();
  const milliseconds = today.getTime() - firstDate.getTime();
  return Math.max(1, Math.floor(milliseconds / 86400000) + 1);
}

function filterItemsByRange(list, getDate, range = analyticsRange) {
  const startDate = getRangeStartDate(range);
  const endDate = getRangeEndDate();

  return list.filter((item) => {
    const itemDate = getDate(item);

    if (!isValidDate(itemDate)) {
      return false;
    }

    if (!startDate) {
      return itemDate <= endDate;
    }

    return itemDate >= startDate && itemDate <= endDate;
  });
}

function getSessionsForRange(range = analyticsRange) {
  return sortSessionsByStartDesc(
    filterItemsByRange(sessions, (session) => getSessionStartDate(session), range)
  );
}

function getEssaySubmissionsForRange(range = analyticsRange) {
  return sortEssaySubmissionsByDate(
    filterItemsByRange(getEvaluatedEssaySubmissions(), (submission) => getEssayReferenceDate(submission), range)
  );
}

function getRangePreviousWindow(range = analyticsRange) {
  const config = getAnalyticsRangeConfig(range);

  if (!config.days) {
    return null;
  }

  const currentStart = getRangeStartDate(range);
  const previousEnd = new Date(currentStart);
  previousEnd.setDate(previousEnd.getDate() - 1);
  previousEnd.setHours(23, 59, 59, 999);
  const previousStart = new Date(previousEnd);
  previousStart.setDate(previousStart.getDate() - (config.days - 1));
  previousStart.setHours(0, 0, 0, 0);

  return {
    startDate: previousStart,
    endDate: previousEnd,
  };
}

function filterItemsByWindow(list, getDate, windowRange) {
  if (!windowRange) {
    return [];
  }

  return list.filter((item) => {
    const itemDate = getDate(item);
    return isValidDate(itemDate) && itemDate >= windowRange.startDate && itemDate <= windowRange.endDate;
  });
}

function getSessionsForPreviousRange(range = analyticsRange) {
  const previousWindow = getRangePreviousWindow(range);
  return sortSessionsByStartDesc(
    filterItemsByWindow(sessions, (session) => getSessionStartDate(session), previousWindow)
  );
}

function getEssaySubmissionsForPreviousRange(range = analyticsRange) {
  const previousWindow = getRangePreviousWindow(range);
  return sortEssaySubmissionsByDate(
    filterItemsByWindow(
      getEvaluatedEssaySubmissions(),
      (submission) => getEssayReferenceDate(submission),
      previousWindow
    )
  );
}

function getQuestionAttemptDate(attempt) {
  const directDate = new Date(
    attempt?.answeredAt || attempt?.createdAt || attempt?.updatedAt || attempt?.timestamp || ""
  );

  if (isValidDate(directDate)) {
    return directDate;
  }

  const parsedDate = parseDateKey(attempt?.dateKey || attempt?.date || "");
  return isValidDate(parsedDate) ? parsedDate : null;
}

function normalizeQuestionAttempt(rawAttempt) {
  const createdAt = getQuestionAttemptDate(rawAttempt) || new Date();
  const examName = String(
    rawAttempt?.examName || rawAttempt?.vestibular || rawAttempt?.vestibularNome || rawAttempt?.nomeVestibular || ""
  )
    .trim()
    .replace(/\s+/g, " ");
  const subjectName = String(
    rawAttempt?.subjectName || rawAttempt?.materia || rawAttempt?.materiaNome || rawAttempt?.disciplina || ""
  )
    .trim()
    .replace(/\s+/g, " ");
  const topicName = String(rawAttempt?.topic || rawAttempt?.assunto || rawAttempt?.assuntoNome || "")
    .trim()
    .replace(/\s+/g, " ");
  const year = Number(rawAttempt?.year || rawAttempt?.ano) || null;
  const isCorrect = Boolean(
    rawAttempt?.isCorrect ?? rawAttempt?.correct ?? rawAttempt?.acertou ?? rawAttempt?.correta
  );

  return {
    id: rawAttempt?.id || null,
    examName: examName || "Vestibular nao informado",
    subjectName: subjectName || "Materia nao informada",
    topicName,
    year,
    isCorrect,
    createdAt: createdAt.toISOString(),
  };
}

function loadQuestionAttemptsFromStorage() {
  const currentUser = window.Start5Auth?.getSession?.();
  const candidateKeys = [
    `start5:question-attempts:${currentUser?.id || ""}`,
    `start5:questionAttempts:${currentUser?.id || ""}`,
    `start5:questoes:tentativas:${currentUser?.id || ""}`,
    "start5:question-attempts",
    "start5:questionAttempts",
    "start5:questoes:tentativas",
  ].filter(Boolean);

  const collected = [];

  candidateKeys.forEach((key) => {
    const value = readStoredJson(key);

    if (Array.isArray(value)) {
      value.forEach((attempt) => collected.push(attempt));
    }
  });

  questionAttempts = collected
    .map((attempt) => normalizeQuestionAttempt(attempt))
    .sort((left, right) => (getQuestionAttemptDate(right)?.getTime() || 0) - (getQuestionAttemptDate(left)?.getTime() || 0));
}

async function loadQuestionAttemptsFromApi() {
  try {
    const response = await window.Start5Auth.apiRequest("/api/question-bank/analytics?limit=1200");
    const attempts = Array.isArray(response?.attempts) ? response.attempts : [];

    questionAttempts = attempts
      .map((attempt) => normalizeQuestionAttempt(attempt))
      .sort((left, right) => (getQuestionAttemptDate(right)?.getTime() || 0) - (getQuestionAttemptDate(left)?.getTime() || 0));
  } catch (error) {
    console.warn("Nao foi possivel carregar tentativas reais do banco de questoes. Usando fallback local.", error);
    loadQuestionAttemptsFromStorage();
  }
}

function getQuestionAttemptsForRange(range = analyticsRange) {
  return filterItemsByRange(questionAttempts, (attempt) => getQuestionAttemptDate(attempt), range).sort(
    (left, right) => (getQuestionAttemptDate(right)?.getTime() || 0) - (getQuestionAttemptDate(left)?.getTime() || 0)
  );
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
    detailLines.push(`Observacao: ${formatCompactList(session.phrases, 4)}`);
  }

  if (session.notes && !session.phrases.length) {
    detailLines.push(`Observacao: ${session.notes}`);
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

function setTextContent(element, value) {
  if (element) {
    element.textContent = value;
  }
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function createInsightCard(title, copy) {
  const card = document.createElement("article");
  card.className = "insight-card";

  const titleNode = document.createElement("strong");
  titleNode.textContent = title;

  const copyNode = document.createElement("p");
  copyNode.textContent = copy;

  card.appendChild(titleNode);
  card.appendChild(copyNode);
  return card;
}

function renderInsightCards(container, items, emptyMessage) {
  if (!container) {
    return;
  }

  container.replaceChildren();

  if (!items.length) {
    container.appendChild(createEmptyMessage(emptyMessage));
    return;
  }

  items.forEach((item) => {
    container.appendChild(createInsightCard(item.title, item.copy));
  });
}

function renderListRows(container, rows, emptyMessage) {
  if (!container) {
    return;
  }

  container.replaceChildren();

  if (!rows.length) {
    container.appendChild(createEmptyMessage(emptyMessage));
    return;
  }

  rows.forEach((row) => {
    container.appendChild(createListRow(row.title, row.subtitle, row.meta));
  });
}

function renderAnalyticsBarChart(container, points, emptyMessage, formatValue = (value) => String(value)) {
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

    const valueNode = document.createElement("span");
    valueNode.className = "bar-chart-value";
    valueNode.textContent = point.value > 0 ? formatValue(point.value, point) : "0";

    const track = document.createElement("div");
    track.className = "bar-chart-track";

    const fill = document.createElement("div");
    fill.className = "bar-chart-fill";
    fill.style.height = `${Math.max((point.value / maxValue) * 100, point.value > 0 ? 12 : 0)}%`;
    track.appendChild(fill);

    const labelNode = document.createElement("span");
    labelNode.className = "bar-chart-label";
    labelNode.textContent = point.label;

    column.appendChild(valueNode);
    column.appendChild(track);
    column.appendChild(labelNode);
    chart.appendChild(column);
  });

  container.appendChild(chart);
}

function getConsistencyLabel(percent) {
  if (percent >= 75) {
    return "Alta";
  }

  if (percent >= 45) {
    return "Media";
  }

  return "Baixa";
}

function getLargestGapDays(list) {
  const uniqueDates = [...new Set(list.map((item) => toDateKey(getSessionStartDate(item))))].sort();

  if (uniqueDates.length <= 1) {
    return 0;
  }

  let largestGap = 0;

  for (let index = 1; index < uniqueDates.length; index += 1) {
    const currentDate = parseDateKey(uniqueDates[index]);
    const previousDate = parseDateKey(uniqueDates[index - 1]);

    if (!isValidDate(currentDate) || !isValidDate(previousDate)) {
      continue;
    }

    const difference = Math.round((currentDate.getTime() - previousDate.getTime()) / 86400000) - 1;
    largestGap = Math.max(largestGap, difference);
  }

  return largestGap;
}

function buildWeekdayAggregatePoints(list) {
  return WEEKDAY_LABELS.map((label, index) => {
    const value = sumMinutes(
      list.filter((session) => {
        const date = getSessionStartDate(session);
        const weekdayIndex = date.getDay() === 0 ? 6 : date.getDay() - 1;
        return weekdayIndex === index;
      })
    );

    return { label, value };
  });
}

function getMostActiveWeekday(list) {
  return buildWeekdayAggregatePoints(list)
    .sort((left, right) => right.value - left.value)
    .find((point) => point.value > 0) || null;
}

function buildHourBucketPoints(list) {
  const buckets = [
    { label: "Madr", min: 0, max: 5, value: 0, count: 0 },
    { label: "Manha", min: 6, max: 11, value: 0, count: 0 },
    { label: "Tarde", min: 12, max: 17, value: 0, count: 0 },
    { label: "Noite", min: 18, max: 23, value: 0, count: 0 },
  ];

  list.forEach((session) => {
    const hour = getSessionStartDate(session).getHours();
    const bucket = buckets.find((item) => hour >= item.min && hour <= item.max);

    if (!bucket) {
      return;
    }

    bucket.value += Number(session.minutes) || 0;
    bucket.count += 1;
  });

  return buckets.map((bucket) => ({
    label: bucket.label,
    value: roundOne(bucket.value),
    count: bucket.count,
  }));
}

function getDominantStudyWindow(list) {
  return buildHourBucketPoints(list)
    .sort((left, right) => {
      if (right.value !== left.value) return right.value - left.value;
      return right.count - left.count;
    })
    .find((bucket) => bucket.value > 0) || null;
}

function getAverageSessionMinutes(list) {
  if (!list.length) {
    return 0;
  }

  return roundOne(sumMinutes(list) / list.length);
}

function getLatestObservationText(session) {
  if (!session) {
    return "";
  }

  if (session.phrases.length) {
    return session.phrases[0];
  }

  if (session.notes) {
    return session.notes;
  }

  return session.topicText || "";
}

function buildQuestionDimensionStats(list, key, labelAccessor) {
  const statsMap = new Map();

  list.forEach((attempt) => {
    const rawValue = String(attempt?.[key] || "").trim();
    const statKey = rawValue || "nao-informado";
    const current = statsMap.get(statKey) || {
      key: statKey,
      label: labelAccessor(attempt),
      total: 0,
      correct: 0,
      wrong: 0,
      topics: [],
    };

    current.total += 1;
    current.correct += attempt.isCorrect ? 1 : 0;
    current.wrong += attempt.isCorrect ? 0 : 1;

    if (attempt.topicName) {
      current.topics.push(attempt.topicName);
    }

    statsMap.set(statKey, current);
  });

  return [...statsMap.values()]
    .map((item) => ({
      ...item,
      accuracy: item.total ? roundOne((item.correct / item.total) * 100) : 0,
      topics: uniqueItems(item.topics),
    }))
    .sort((left, right) => {
      if (right.total !== left.total) return right.total - left.total;
      if (right.accuracy !== left.accuracy) return right.accuracy - left.accuracy;
      return left.label.localeCompare(right.label);
    });
}

function buildQuestionTrendPoints(list, limit = 8) {
  const grouped = new Map();

  [...list]
    .sort((left, right) => (getQuestionAttemptDate(right)?.getTime() || 0) - (getQuestionAttemptDate(left)?.getTime() || 0))
    .forEach((attempt) => {
    const dateKey = toDateKey(getQuestionAttemptDate(attempt) || new Date());
    const current = grouped.get(dateKey) || { total: 0, correct: 0 };
    current.total += 1;
    current.correct += attempt.isCorrect ? 1 : 0;
    grouped.set(dateKey, current);
    });

  return [...grouped.entries()]
    .sort((left, right) => left[0].localeCompare(right[0]))
    .slice(-limit)
    .map(([dateKey, data]) => ({
      label: formatShortDate(dateKey),
      value: data.total ? roundOne((data.correct / data.total) * 100) : 0,
    }));
}

function buildEssayCompetencyMetrics(list) {
  return ESSAY_COMPETENCY_DEFINITIONS.map((definition) => {
    const scores = list.map((submission) => Number(submission?.scores?.[`competency${definition.id}`]) || 0);
    const average = scores.length
      ? roundOne(scores.reduce((total, score) => total + score, 0) / scores.length)
      : 0;
    const minScore = scores.length ? Math.min(...scores) : 0;
    const maxScore = scores.length ? Math.max(...scores) : 0;

    return {
      ...definition,
      average,
      variation: maxScore - minScore,
      latest: scores[0] || 0,
      previous: scores[1] || 0,
    };
  }).sort((left, right) => {
    if (right.average !== left.average) return right.average - left.average;
    return left.id - right.id;
  });
}

function buildEssayThemeStats(list) {
  const statsMap = new Map();

  list.forEach((submission) => {
    const themeTitle = String(submission?.themeTitle || "").trim() || "Tema nao informado";
    const current = statsMap.get(themeTitle) || {
      title: themeTitle,
      total: 0,
      latestScore: 0,
      latestDate: "",
    };

    current.total += 1;
    current.latestScore = Number(submission?.totalScore) || 0;
    current.latestDate = getEssayReferenceDate(submission)?.toISOString() || "";
    statsMap.set(themeTitle, current);
  });

  return [...statsMap.values()].sort((left, right) => {
    if (right.total !== left.total) return right.total - left.total;
    return left.title.localeCompare(right.title);
  });
}

function buildEnglishObservationRows(list, limit = 5) {
  return sortSessionsByStartDesc(list)
    .map((session) => {
      const observation = getLatestObservationText(session);

      if (!observation) {
        return null;
      }

      return {
        title: observation,
        subtitle: `${session.subjectLabel} - ${session.topicText || "Pratica registrada"}`,
        meta: formatShortDate(session.dateKey),
      };
    })
    .filter(Boolean)
    .slice(0, limit);
}

function getObservationKeyword(list) {
  const observation = list
    .map((session) => getLatestObservationText(session))
    .find(Boolean);

  return observation || "Nenhuma";
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

async function loadRoutinePlanFromApi() {
  try {
    const response = await window.Start5Auth.apiRequest("/api/routine/plans/current");
    routinePlan = response?.plan || null;
  } catch (error) {
    console.error("Erro ao carregar rotina atual:", error);
    routinePlan = null;
  }
}

function openMenu() {
  if (window.Start5Main?.sidebarNavigation?.isManaged) {
    window.Start5Main.openSidebar();
    return;
  }

  body.classList.add("menu-open");

  if (menuToggle) {
    menuToggle.setAttribute("aria-expanded", "true");
    menuToggle.setAttribute("aria-label", "Fechar menu");
  }
}

function closeMenu() {
  if (window.Start5Main?.sidebarNavigation?.isManaged) {
    window.Start5Main.closeSidebar();
    return;
  }

  body.classList.remove("menu-open");

  if (menuToggle) {
    menuToggle.setAttribute("aria-expanded", "false");
    menuToggle.setAttribute("aria-label", "Abrir menu");
  }
}

function toggleMenu() {
  if (window.Start5Main?.sidebarNavigation?.isManaged) {
    window.Start5Main.toggleSidebar();
    return;
  }

  if (body.classList.contains("menu-open")) {
    closeMenu();
    return;
  }

  openMenu();
}

function getDashboardViewFromHash() {
  const hash = String(window.location.hash || "").toLowerCase();

  if (hash === "#semanal") {
    return "weekly";
  }

  if (hash === "#mensal") {
    return "monthly";
  }

  return "overview";
}

function getDashboardViewCopy(view) {
  if (view === "weekly") {
    return "Leitura semanal do seu ritmo, da sua constancia e da pressao que mais puxou seus estudos.";
  }

  if (view === "monthly") {
    return "Leitura mensal de evolucao, consistencia e como suas materias se comportaram no recorte maior.";
  }

  return "Visao geral do agora: foco do dia, resumo de hoje, rotina ativa e o que esta realmente em movimento.";
}

function setDashboardView(view, { updateHash = true } = {}) {
  const normalizedView = ["overview", "weekly", "monthly"].includes(view) ? view : "overview";

  panelTabButtons.forEach((button) => {
    const isActive = button.dataset.panelTab === normalizedView;
    button.classList.toggle("is-active", isActive);
    button.setAttribute("aria-selected", String(isActive));
  });

  panelSections.forEach((section) => {
    section.hidden = section.dataset.panelSection !== normalizedView;
  });

  if (dashboardViewCopy) {
    dashboardViewCopy.textContent = getDashboardViewCopy(normalizedView);
  }

  if (!updateHash) {
    return;
  }

  const nextHash =
    normalizedView === "weekly" ? "#semanal" : normalizedView === "monthly" ? "#mensal" : "";
  const nextUrl = `${window.location.pathname}${nextHash}`;
  window.history.replaceState(null, "", nextUrl);
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
  refreshSessionActionsVisibility();
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

function setVerbPickerStatus() {
  if (!verbPickerStatus) {
    return;
  }

  verbPickerStatus.textContent = selectedVerbs.length
    ? `Verbo estudado: ${formatCompactList(selectedVerbs, 3)}`
    : "Verbo estudado";
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
    : "Busque um Verbo comum";
}

function setCustomVerbMode(nextMode) {
  isCustomVerbMode = Boolean(nextMode);
  updateVerbInputPlaceholder();
  updateVerbModeButton();
  setVerbPickerStatus();
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
        "Nenhum verbo parecido apareceu na lista principal. Use Outro verbo para digitar manualmente.",
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

  refreshSessionActionsVisibility();
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

  setVerbPickerStatus();
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
    setVerbPickerStatus();
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
    setCustomVerbMode(true);
    verbsEntryInput.focus();
    return;
  }

  setVerbPickerStatus();
  renderVerbSuggestions();
}

function bindVerbInput() {
  if (!verbsEntryInput) {
    return;
  }

  updateVerbInputPlaceholder();
  updateVerbModeButton();
  setVerbPickerStatus();
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
      setVerbPickerStatus();
      renderVerbSuggestions();
      return;
    }

    if (isCustomVerbMode) {
      setVerbPickerStatus();
      return;
    }

    setVerbPickerStatus();
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
  setVerbPickerStatus();
  renderVerbSuggestions();
  renderCustomSubjectSuggestions();
  refreshSessionActionsVisibility();
}

function getMinutesToSave() {
  const value = Number(studyMinutesInput?.value);
  return Number.isFinite(value) ? value : 0;
}

function setModalMode(mode) {
  const isEditing = mode === "edit";

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
  const hasMinutesValue = String(studyMinutesInput?.value || "").trim() !== "";
  const customSubjectName = String(customSubjectInput?.value || "").trim();
  const subjectLabel = getSubjectLabel(selectedSubjectKey, customSubjectName);
  const topicText = String(topicInput?.value || "").trim();

  if (!hasMinutesValue) {
    sessionHelper.textContent = "Informe o tempo, a materia e o que voce estudou hoje.";
    return;
  }

  if (!Number.isFinite(minutes) || minutes < MIN_SESSION_MINUTES) {
    sessionHelper.textContent = `Informe pelo menos ${MIN_SESSION_MINUTES} min de estudo para salvar a pratica.`;
    return;
  }

  if (!topicText) {
    sessionHelper.textContent = "Escolha a materia e descreva o que voce estudou hoje.";
    return;
  }

  if (selectedSubjectKey === "outras" && !customSubjectName) {
    sessionHelper.textContent = "Digite o nome da materia para continuar.";
    return;
  }

  sessionHelper.textContent =
    `${formatMinutesOnly(minutes)} de ${subjectLabel}. Tema: ${topicText}.`;
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
  selectedSubjectKey = getFocusSubjectConfig().subjectKey;
  selectedVerbs = [];
  selectedPhrases = [];
  selectedNotes = "";
  isCustomVerbMode = false;

  if (studyMinutesInput) studyMinutesInput.value = "";
  if (customSubjectInput) customSubjectInput.value = getFocusSubjectConfig().customSubjectName || "";
  if (topicInput) topicInput.value = "";
  if (verbsEntryInput) verbsEntryInput.value = "";
  if (phrasesEntryInput) phrasesEntryInput.value = "";

  updateStudyMinutesValidity();
  setModalMode("create");
  updateSubjectSelectionUI();
  updateDetailFieldsVisibility();
  updateTokenLists();
  updateSessionHelper();
}

function populateSessionForm(session) {
  editingSessionId = session.id;
  selectedSubjectKey = session.subjectKey || DEFAULT_SUBJECT_KEY;
  selectedVerbs = uniqueVerbItems(session.verbs);
  selectedPhrases = [...session.phrases];
  selectedNotes = String(session.notes || "");
  isCustomVerbMode = false;

  if (studyMinutesInput) {
    studyMinutesInput.value = String(Math.round(Number(session.minutes) || 0));
  }

  if (customSubjectInput) {
    customSubjectInput.value = session.customSubjectName || "";
  }

  if (topicInput) {
    topicInput.value = session.topicText || "";
  }

  if (verbsEntryInput) verbsEntryInput.value = "";
  if (phrasesEntryInput) phrasesEntryInput.value = "";

  updateStudyMinutesValidity();
  setModalMode("edit");
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
  showModalLayer(modalBackdrop);
  if (sessionForm) {
    sessionForm.scrollTop = 0;
  }
  body.classList.add("modal-open");
  refreshSessionActionsVisibility();
}

function closeSessionModal() {
  if (!modalBackdrop) {
    return;
  }

  hideModalLayer(modalBackdrop);
  body.classList.remove("modal-open");
  setSessionActionsRevealed(false);
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

  showModalLayer(deleteSessionBackdrop);
  body.classList.add("modal-open");
}

function closeDeleteModal() {
  if (!deleteSessionBackdrop) {
    return;
  }

  pendingDeleteSessionId = null;
  hideModalLayer(deleteSessionBackdrop);
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
  const goal = MIN_SESSION_MINUTES;
  const streak = getStreak();

  scoreNumber.textContent = `${goal > 0 ? Math.round((todayTotal / goal) * 100) : 0}%`;
  vsYesterdayValue.textContent = formatSignedMinutes(todayTotal - yesterdayTotal);
  vsMonthValue.textContent = formatSignedMinutes(currentWeekMinutes - previousWeekMinutes);
  currentStateValue.textContent = "Livre";
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
  todayStateValue.textContent = "Livre";
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

function renderRoutineSummary() {
  if (!routineWeekLabel) {
    return;
  }

  if (!routinePlan) {
    routineWeekLabel.textContent = "Semana ainda não gerada";
    routineExecutionValue.textContent = "0%";
    routinePriorityValue.textContent = "Defina a rotina";
    routineReinforcementValue.textContent = "Nenhum";
    routineMinutesValue.textContent = "0 min • 0 min";
    routineSummaryText.textContent =
      "Monte sua rotina semanal para distribuir matérias, reforços e comparar o planejado com o que realmente foi estudado.";
    return;
  }

  routineWeekLabel.textContent = formatWeekRangeLabel(routinePlan.weekStart, routinePlan.weekEnd);
  routineExecutionValue.textContent = formatPercent(routinePlan.executionPercent);
  routinePriorityValue.textContent = routinePlan.nextPriority?.subjectLabel || "Semana organizada";
  routineReinforcementValue.textContent = routinePlan.reinforcementSubjects?.[0]?.subjectLabel || "Sem reforço extra";
  routineMinutesValue.textContent =
    `${formatMinutesOnly(routinePlan.totalPlannedMinutes)} • ${formatMinutesOnly(routinePlan.totalActualMinutes)}`;
  routineSummaryText.textContent =
    String(routinePlan.summaryText || "").trim() ||
    "Sua rotina já está pronta para comparar o planejado com o realizado nesta semana.";
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

function setAnalyticsRange(nextRange) {
  if (!ANALYTICS_RANGE_DEFINITIONS[nextRange]) {
    return;
  }

  analyticsRange = nextRange;
  renderDashboard();
}

function updateAnalyticsRangeUI() {
  analyticsRangeButtons.forEach((button) => {
    const isActive = button.dataset.analyticsRange === analyticsRange;
    button.classList.toggle("is-active", isActive);
    button.setAttribute("aria-selected", String(isActive));
  });
}

function renderDashboardHero(rangeSessions, rangeEssays, rangeQuestions) {
  const rangeConfig = getAnalyticsRangeConfig();
  const previousSessions = getSessionsForPreviousRange();
  const currentMinutes = sumMinutes(rangeSessions);
  const previousMinutes = sumMinutes(previousSessions);
  const difference = roundOne(currentMinutes - previousMinutes);
  const modules = [];

  if (rangeSessions.length) {
    modules.push("rotina");
  }

  if (rangeEssays.length) {
    modules.push("redacao");
  }

  if (rangeQuestions.length) {
    modules.push("questoes");
  }

  if (rangeSessions.some((session) => session.subjectKey === DEFAULT_SUBJECT_KEY)) {
    modules.push("ingles");
  }

  setTextContent(
    analyticsDom.analysisWindowLabel,
    analyticsRange === "all" ? `Leitura de ${rangeConfig.label}` : `Leitura dos ${rangeConfig.label}`
  );
  setTextContent(
    analyticsDom.analysisCoverageLabel,
    modules.length
      ? `Cobertura ativa: ${formatCompactList(uniqueItems(modules), 4)}.`
      : "Cobertura inicial: registre praticas para liberar as leituras."
  );

  if (!rangeSessions.length && !rangeEssays.length && !rangeQuestions.length) {
    setTextContent(
      analyticsDom.analysisPulseLabel,
      "Seu painel esta pronto. Registre pratica, redacao e questoes para transformar uso em leitura de desempenho."
    );
    return;
  }

  if (difference > 0) {
    setTextContent(
      analyticsDom.analysisPulseLabel,
      `Seu volume subiu ${formatMinutesOnly(difference)} em relacao ao recorte anterior, com ${countActiveDays(rangeSessions)} dia(s) ativo(s).`
    );
    return;
  }

  if (difference < 0) {
    setTextContent(
      analyticsDom.analysisPulseLabel,
      `Seu ritmo caiu ${formatMinutesOnly(Math.abs(difference))} frente ao recorte anterior. Uma sessao curta hoje ja ajuda a retomar tracao.`
    );
    return;
  }

  setTextContent(
    analyticsDom.analysisPulseLabel,
    "Seu volume ficou estavel no recorte atual. Agora vale observar qualidade, constancia e onde o desempenho esta oscilando."
  );
}

function renderOverviewAnalytics(rangeSessions, rangeEssays, rangeQuestions) {
  const totalMinutes = sumMinutes(rangeSessions);
  const streak = getStreak();
  const questionCount = rangeQuestions.length;
  const essayCount = rangeEssays.length;
  const questionAccuracy = questionCount
    ? roundOne((rangeQuestions.filter((attempt) => attempt.isCorrect).length / questionCount) * 100)
    : 0;
  const essayAverage = getEssayAverageScore(rangeEssays);
  const performanceValues = [];
  const subjectStats = buildSubjectStats(rangeSessions);
  const weakestEssayCompetency = buildEssayCompetencyMetrics(rangeEssays).slice(-1)[0] || null;
  const questionSubjectStats = buildQuestionDimensionStats(
    rangeQuestions,
    "subjectName",
    (attempt) => attempt.subjectName
  );
  const weakestQuestionSubject = [...questionSubjectStats]
    .filter((item) => item.total >= 2)
    .sort((left, right) => {
      if (left.accuracy !== right.accuracy) return left.accuracy - right.accuracy;
      return right.total - left.total;
    })[0] || null;
  const activeDays = countActiveDays(rangeSessions);
  const rangeDays = getRangeDayCount();
  const consistencyPercent = roundOne((activeDays / rangeDays) * 100);

  if (questionCount) {
    performanceValues.push(questionAccuracy);
  }

  if (essayCount) {
    performanceValues.push(roundOne(essayAverage / 10));
  }

  if (!performanceValues.length && rangeSessions.length) {
    performanceValues.push(consistencyPercent);
  }

  const averagePerformance = performanceValues.length
    ? roundOne(performanceValues.reduce((total, value) => total + value, 0) / performanceValues.length)
    : 0;
  const strongestArea = subjectStats[0] || null;
  const strongestAreaLabel = strongestArea?.label || (essayCount ? "Redacao" : questionCount ? "Questoes" : "Sem leitura");
  const strongestAreaHelper = strongestArea
    ? `${strongestArea.count} registro(s) e ${formatMinutesOnly(strongestArea.minutes)} no recorte.`
    : essayCount
      ? `${essayCount} redacao(oes) avaliadas no recorte.`
      : questionCount
        ? `${questionCount} tentativa(s) de questao no periodo.`
        : "O modulo dominante aparece aqui.";
  const weakestAreaLabel = weakestQuestionSubject
    ? weakestQuestionSubject.label
    : weakestEssayCompetency
      ? `${weakestEssayCompetency.shortLabel} | ${weakestEssayCompetency.label}`
      : rangeSessions.length
        ? "Constancia"
        : "Sem leitura";

  setTextContent(analyticsDom.overviewTotalMinutesValue, formatMinutesOnly(totalMinutes));
  setTextContent(
    analyticsDom.overviewTotalMinutesHelper,
    totalMinutes ? `${rangeSessions.length} pratica(s) somando volume real neste recorte.` : "Sem minutos registrados ainda."
  );
  setTextContent(analyticsDom.overviewStreakValue, `${streak} dia${streak === 1 ? "" : "s"}`);
  setTextContent(
    analyticsDom.overviewStreakHelper,
    streak ? "Sequencia atual considerando dias seguidos com estudo." : "Sua proxima sessao abre uma nova sequencia."
  );
  setTextContent(analyticsDom.overviewQuestionCountValue, String(questionCount));
  setTextContent(
    analyticsDom.overviewQuestionCountHelper,
    questionCount ? `${formatPercent(questionAccuracy)} de acerto nas tentativas do recorte.` : "Estrutura pronta para integrar tentativas."
  );
  setTextContent(analyticsDom.overviewEssayCountValue, String(essayCount));
  setTextContent(
    analyticsDom.overviewEssayCountHelper,
    essayCount ? `Media atual de ${formatEssayScore(essayAverage)} nas redacoes avaliadas.` : "Quando houver correcoes, o volume entra aqui."
  );
  setTextContent(analyticsDom.overviewAveragePerformanceValue, formatPercent(averagePerformance));
  setTextContent(
    analyticsDom.overviewAveragePerformanceHelper,
    performanceValues.length ? "Combinando o que ja existe no sistema hoje." : "Assim que houver desempenho mensuravel, este indice sobe."
  );
  setTextContent(analyticsDom.overviewStrongAreaValue, strongestAreaLabel);
  setTextContent(analyticsDom.overviewStrongAreaHelper, strongestAreaHelper);
  setTextContent(analyticsDom.overviewWeakAreaValue, weakestAreaLabel);
  setTextContent(
    analyticsDom.overviewWeakAreaHelper,
    weakestQuestionSubject
      ? `${formatPercent(weakestQuestionSubject.accuracy)} de acerto em ${weakestQuestionSubject.total} tentativa(s).`
      : weakestEssayCompetency
        ? `Media de ${formatEssayScore(weakestEssayCompetency.average)} nesta competencia.`
        : "O principal gargalo fica claro aqui."
  );
  setTextContent(analyticsDom.overviewConsistencyValue, getConsistencyLabel(consistencyPercent));
  setTextContent(
    analyticsDom.overviewConsistencyHelper,
    rangeSessions.length ? `${activeDays} dia(s) ativos em ${rangeDays} dia(s) observados.` : "Leitura baseada em frequencia e ritmo."
  );
}

function renderRoutineAnalytics(rangeSessions) {
  const activeDays = countActiveDays(rangeSessions);
  const rangeDays = getRangeDayCount();
  const totalMinutes = sumMinutes(rangeSessions);
  const averageDayMinutes = activeDays ? roundOne(totalMinutes / activeDays) : 0;
  const averageSessionMinutes = getAverageSessionMinutes(rangeSessions);
  const frequencyPercent = activeDays ? roundOne((activeDays / rangeDays) * 100) : 0;
  const dominantWindow = getDominantStudyWindow(rangeSessions);
  const weekdayPoints = buildWeekdayAggregatePoints(rangeSessions);
  const hourPoints = buildHourBucketPoints(rangeSessions);
  const strongestWeekday = getMostActiveWeekday(rangeSessions);
  const largestGap = getLargestGapDays(rangeSessions);

  setTextContent(analyticsDom.routineDaysStudiedValue, String(activeDays));
  setTextContent(
    analyticsDom.routineDaysStudiedHelper,
    activeDays ? `Voce estudou em ${activeDays} dia(s) do recorte atual.` : "Nenhum dia ativo no recorte."
  );
  setTextContent(analyticsDom.routineBestHourValue, dominantWindow?.label || "Sem leitura");
  setTextContent(
    analyticsDom.routineBestHourHelper,
    dominantWindow ? `${dominantWindow.count} sessao(oes) e ${formatMinutesOnly(dominantWindow.value)} nessa faixa.` : "Seu pico de atividade aparece aqui."
  );
  setTextContent(analyticsDom.routineAverageDayValue, formatMinutesOnly(averageDayMinutes));
  setTextContent(analyticsDom.routineAverageDayHelper, activeDays ? "Carga media por dia realmente estudado." : "A carga media por dia estudado.");
  setTextContent(analyticsDom.routineAverageSessionValue, formatMinutesOnly(averageSessionMinutes));
  setTextContent(
    analyticsDom.routineAverageSessionHelper,
    rangeSessions.length ? `${rangeSessions.length} pratica(s) no recorte.` : "O tamanho tipico das suas praticas."
  );
  setTextContent(analyticsDom.routineFrequencyValue, formatPercent(frequencyPercent));
  setTextContent(
    analyticsDom.routineFrequencyHelper,
    `Consistencia classificada como ${getConsistencyLabel(frequencyPercent).toLowerCase()}.`
  );
  setTextContent(analyticsDom.routineGapValue, `${largestGap} dia${largestGap === 1 ? "" : "s"}`);
  setTextContent(
    analyticsDom.routineGapHelper,
    largestGap ? "Maior intervalo sem registros dentro do recorte." : "Sem pausas longas entre dias ativos."
  );

  renderAnalyticsBarChart(
    analyticsDom.routineWeekChart,
    weekdayPoints,
    "Sem dados suficientes para o ritmo semanal.",
    (value) => formatMinutesOnly(value)
  );
  renderAnalyticsBarChart(
    analyticsDom.routineHourChart,
    hourPoints,
    "Sem horario dominante ainda.",
    (value) => formatMinutesOnly(value)
  );
  renderListRows(
    analyticsDom.routineBehaviorList,
    [
      strongestWeekday
        ? {
            title: `${strongestWeekday.label} concentra seu melhor volume`,
            subtitle: "Dia da semana com maior carga acumulada.",
            meta: formatMinutesOnly(strongestWeekday.value),
          }
        : null,
      dominantWindow
        ? {
            title: `${dominantWindow.label} e sua janela mais ativa`,
            subtitle: `${dominantWindow.count} sessao(oes) iniciadas nessa faixa.`,
            meta: formatMinutesOnly(dominantWindow.value),
          }
        : null,
      rangeSessions.length
        ? {
            title: `${formatMinutesOnly(averageSessionMinutes)} por sessao em media`,
            subtitle: `${activeDays} dia(s) ativos no recorte selecionado.`,
            meta: formatPercent(frequencyPercent),
          }
        : null,
    ].filter(Boolean),
    "Registre praticas para destravar a leitura da rotina."
  );

  renderRoutineSummary();
}

function renderQuestionAnalytics(rangeQuestions) {
  const correctCount = rangeQuestions.filter((attempt) => attempt.isCorrect).length;
  const wrongCount = Math.max(0, rangeQuestions.length - correctCount);
  const accuracy = rangeQuestions.length ? roundOne((correctCount / rangeQuestions.length) * 100) : 0;
  const examStats = buildQuestionDimensionStats(rangeQuestions, "examName", (attempt) => attempt.examName);
  const subjectStats = buildQuestionDimensionStats(rangeQuestions, "subjectName", (attempt) => attempt.subjectName);
  const weakestSubject = [...subjectStats]
    .filter((item) => item.total >= 2)
    .sort((left, right) => {
      if (left.accuracy !== right.accuracy) return left.accuracy - right.accuracy;
      return right.total - left.total;
    })[0] || null;
  const strongestExam = [...examStats]
    .filter((item) => item.total >= 2)
    .sort((left, right) => {
      if (right.accuracy !== left.accuracy) return right.accuracy - left.accuracy;
      return right.total - left.total;
    })[0] || null;

  setTextContent(analyticsDom.questionAnsweredValue, String(rangeQuestions.length));
  setTextContent(
    analyticsDom.questionAnsweredHelper,
    rangeQuestions.length ? `${examStats.length} vestibular(es) no recorte atual.` : "Sem tentativas integradas ainda."
  );
  setTextContent(analyticsDom.questionCorrectValue, String(correctCount));
  setTextContent(
    analyticsDom.questionCorrectHelper,
    correctCount ? `${formatPercent(accuracy)} do total resolvido.` : "O volume de acertos aparece aqui."
  );
  setTextContent(analyticsDom.questionWrongValue, String(wrongCount));
  setTextContent(
    analyticsDom.questionWrongHelper,
    wrongCount ? "Os erros ajudam a revelar as materias mais sensiveis." : "Erros por recorte entram neste bloco."
  );
  setTextContent(analyticsDom.questionAccuracyValue, formatPercent(accuracy));
  setTextContent(
    analyticsDom.questionAccuracyHelper,
    rangeQuestions.length ? "Comparando acertos e erros do recorte selecionado." : "Quando houver dados, a tendencia fica clara."
  );

  renderListRows(
    analyticsDom.questionExamList,
    examStats.slice(0, 6).map((item) => ({
      title: item.label,
      subtitle: `${item.correct} acerto(s) e ${item.wrong} erro(s)`,
      meta: formatPercent(item.accuracy),
    })),
    "Sem dados de vestibular ainda."
  );
  renderListRows(
    analyticsDom.questionSubjectList,
    subjectStats.slice(0, 6).map((item) => ({
      title: item.label,
      subtitle: item.topics.length ? `Assuntos: ${formatCompactList(item.topics, 2)}` : `${item.total} tentativa(s) registradas`,
      meta: formatPercent(item.accuracy),
    })),
    "As materias mais fortes e mais fracas aparecem aqui."
  );
  renderAnalyticsBarChart(
    analyticsDom.questionTrendChart,
    buildQuestionTrendPoints(rangeQuestions),
    "Nenhuma serie de tentativas encontrada.",
    (value) => formatPercent(value)
  );
  renderInsightCards(
    analyticsDom.questionInsightList,
    [
      strongestExam
        ? {
            title: `${strongestExam.label} e seu vestibular mais forte`,
            copy: `Sua taxa de acerto ficou em ${formatPercent(strongestExam.accuracy)} nesse recorte.`,
          }
        : null,
      weakestSubject
        ? {
            title: `${weakestSubject.label} pede revisao`,
            copy: `A materia tem ${formatPercent(weakestSubject.accuracy)} de acerto e concentra os principais erros atuais.`,
          }
        : null,
      rangeQuestions.length
        ? {
            title: "Modulo pronto para analise mais profunda",
            copy: "Quando o banco de questoes ganhar historico mais denso, este bloco vai cruzar vestibular, assunto e tendencia automaticamente.",
          }
        : null,
    ].filter(Boolean),
    "Modulo pronto para receber dados reais de questoes."
  );
}

function renderEssayAnalytics(rangeEssays) {
  const essayAverage = getEssayAverageScore(rangeEssays);
  const previousAverage = getEssayAverageScore(getEssaySubmissionsForPreviousRange());
  const latestEssay = rangeEssays[0] || null;
  const bestEssay = [...rangeEssays].sort((left, right) => (Number(right.totalScore) || 0) - (Number(left.totalScore) || 0))[0] || null;
  const competencyMetrics = buildEssayCompetencyMetrics(rangeEssays);
  const weakestCompetency = competencyMetrics[competencyMetrics.length - 1] || null;
  const stableCompetency = [...competencyMetrics]
    .filter((item) => item.average > 0)
    .sort((left, right) => {
      if (left.variation !== right.variation) return left.variation - right.variation;
      return right.average - left.average;
    })[0] || null;
  const themeStats = buildEssayThemeStats(rangeEssays);
  const trendPoints = [...rangeEssays]
    .slice(0, 6)
    .reverse()
    .map((essay) => ({
      label: formatEssayDate(getEssayReferenceDate(essay)),
      value: Number(essay.totalScore) || 0,
    }));

  setTextContent(analyticsDom.essayTotalValue, String(rangeEssays.length));
  setTextContent(
    analyticsDom.essayTotalHelper,
    rangeEssays.length ? describeEssayComparison(essayAverage, previousAverage, "neste recorte") : "Nenhuma redacao corrigida ainda."
  );
  setTextContent(
    analyticsDom.essayAverageValue,
    rangeEssays.length ? `${Math.round(essayAverage)} / 1000` : "0 / 1000"
  );
  setTextContent(
    analyticsDom.essayAverageHelper,
    rangeEssays.length ? "Media geral das redacoes avaliadas no periodo atual." : "A media do recorte aparece aqui."
  );
  setTextContent(
    analyticsDom.essayLastScoreValue,
    latestEssay ? `${Math.round(Number(latestEssay.totalScore) || 0)} / 1000` : "Sem nota"
  );
  setTextContent(
    analyticsDom.essayLastScoreHelper,
    latestEssay ? `${latestEssay.themeTitle || "Redacao"} em ${formatEssayDate(getEssayReferenceDate(latestEssay))}.` : "A leitura mais recente do seu texto."
  );
  setTextContent(
    analyticsDom.essayBestScoreValue,
    bestEssay ? `${Math.round(Number(bestEssay.totalScore) || 0)} / 1000` : "Sem nota"
  );
  setTextContent(
    analyticsDom.essayBestScoreHelper,
    bestEssay ? `${bestEssay.themeTitle || "Redacao"} segue como seu teto atual.` : "Seu teto atual de desempenho."
  );
  setTextContent(
    analyticsDom.essayWeakCompetencyValue,
    weakestCompetency ? `${weakestCompetency.shortLabel} | ${weakestCompetency.label}` : "Sem leitura"
  );
  setTextContent(
    analyticsDom.essayWeakCompetencyHelper,
    weakestCompetency ? `Media de ${formatEssayScore(weakestCompetency.average)} nesse ponto.` : "O ponto que mais derruba sua nota."
  );
  setTextContent(
    analyticsDom.essayStableCompetencyValue,
    stableCompetency ? `${stableCompetency.shortLabel} | ${stableCompetency.label}` : "Sem leitura"
  );
  setTextContent(
    analyticsDom.essayStableCompetencyHelper,
    stableCompetency ? `Oscilacao de ${stableCompetency.variation} pontos nas ultimas redacoes do recorte.` : "A competencia que mais se sustenta."
  );

  renderAnalyticsBarChart(
    analyticsDom.essayTrendChart,
    trendPoints,
    "Sem historico de redacoes para comparar.",
    (value) => `${Math.round(value)}`
  );
  renderListRows(
    analyticsDom.essayCompetencyBoard,
    competencyMetrics.map((item) => ({
      title: `${item.shortLabel} | ${item.label}`,
      subtitle: item.variation <= 40 ? "Competencia mais estavel no recorte." : "Ainda oscila entre as redacoes avaliadas.",
      meta: formatEssayScore(item.average),
    })),
    "As competencias avaliadas aparecem aqui."
  );
  renderListRows(
    analyticsDom.essayThemeList,
    themeStats.slice(0, 6).map((item) => ({
      title: item.title,
      subtitle: `${item.total} redacao(oes) com esse tema`,
      meta: item.latestScore ? `${Math.round(item.latestScore)} pts` : "Sem nota",
    })),
    "Quando voce escrever, os temas entram aqui."
  );
  renderInsightCards(
    analyticsDom.essayInsightList,
    [
      weakestCompetency
        ? {
            title: `Sua maior dificuldade atual esta em ${weakestCompetency.shortLabel}`,
            copy: `${weakestCompetency.label} segue derrubando sua media neste recorte.`,
          }
        : null,
      stableCompetency
        ? {
            title: `${stableCompetency.shortLabel} e sua area mais estavel`,
            copy: `Essa competencia sustenta melhor a nota geral e oscila menos nas ultimas correcoes.`,
          }
        : null,
      latestEssay && rangeEssays[1]
        ? {
            title: "Sua ultima redacao mudou o ritmo recente",
            copy: `A nota mais recente ficou ${Number(latestEssay.totalScore) >= Number(rangeEssays[1].totalScore) ? "acima" : "abaixo"} da penultima avaliacao.`,
          }
        : null,
    ].filter(Boolean),
    "Envie redacoes para receber insights por competencia."
  );
}

function renderEnglishAnalytics(rangeSessions) {
  const englishSessions = rangeSessions.filter((session) => session.subjectKey === DEFAULT_SUBJECT_KEY);
  const englishMinutes = sumMinutes(englishSessions);
  const englishActiveDays = countActiveDays(englishSessions);
  const englishConsistency = englishSessions.length
    ? roundOne((englishActiveDays / getRangeDayCount()) * 100)
    : 0;
  const verbStats = buildWordStats(getVerbsFromSessions(englishSessions));
  const latestObservation = getLatestObservationText(englishSessions[0]);
  const trendMap = new Map();

  englishSessions.forEach((session) => {
    const dateKey = session.dateKey;
    trendMap.set(dateKey, roundOne((trendMap.get(dateKey) || 0) + (Number(session.minutes) || 0)));
  });

  const trendPoints = [...trendMap.entries()]
    .sort((left, right) => left[0].localeCompare(right[0]))
    .slice(-7)
    .map(([dateKey, minutes]) => ({
      label: formatShortDate(dateKey),
      value: minutes,
    }));

  setTextContent(analyticsDom.englishPracticeCountValue, String(englishSessions.length));
  setTextContent(
    analyticsDom.englishPracticeCountHelper,
    englishSessions.length ? `${englishActiveDays} dia(s) com ingles no recorte.` : "Nenhuma pratica de ingles no recorte."
  );
  setTextContent(analyticsDom.englishMinutesValue, formatMinutesOnly(englishMinutes));
  setTextContent(
    analyticsDom.englishMinutesHelper,
    englishSessions.length ? "Carga total dedicada ao idioma." : "Carga total dedicada ao ingles."
  );
  setTextContent(analyticsDom.englishVerbCountValue, String(verbStats.length));
  setTextContent(
    analyticsDom.englishVerbCountHelper,
    verbStats.length ? `${verbStats[0].word} lidera as revisoes recentes.` : "Volume de verbos unicos revisados."
  );
  setTextContent(
    analyticsDom.englishObservationValue,
    latestObservation ? truncateText(latestObservation, 42) : "Sem observacao"
  );
  setTextContent(
    analyticsDom.englishObservationHelper,
    latestObservation ? "Ultima observacao ou nota curta registrada no modulo." : "O ultimo registro relevante da pratica."
  );
  setTextContent(analyticsDom.englishConsistencyValue, getConsistencyLabel(englishConsistency));
  setTextContent(
    analyticsDom.englishConsistencyHelper,
    englishSessions.length ? `${englishActiveDays} dia(s) ativos de ingles no recorte.` : "Leitura simples da frequencia de ingles."
  );

  renderChipList(
    analyticsDom.englishVerbList,
    verbStats.slice(0, 10).map((item) => createDetailChip(item.word, `${item.count}x`)),
    "Nenhum verbo registrado no recorte."
  );
  renderListRows(
    analyticsDom.englishObservationList,
    buildEnglishObservationRows(englishSessions),
    "Sem observacoes recentes de ingles."
  );
  renderAnalyticsBarChart(
    analyticsDom.englishTrendChart,
    trendPoints,
    "O ritmo de ingles aparece aqui quando houver dados.",
    (value) => formatMinutesOnly(value)
  );
  renderInsightCards(
    analyticsDom.englishInsightList,
    [
      englishSessions.length
        ? {
            title: `Seu ingles esta com consistencia ${getConsistencyLabel(englishConsistency).toLowerCase()}`,
            copy: `O modulo apareceu em ${englishActiveDays} dia(s) e somou ${formatMinutesOnly(englishMinutes)} no recorte.`,
          }
        : null,
      verbStats.length
        ? {
            title: `${verbStats[0].word} e o verbo mais recorrente`,
            copy: "Os verbos registrados ajudam a revelar o tipo de pratica que mais se repete no seu dia a dia.",
          }
        : null,
      englishSessions.length && getLargestGapDays(englishSessions) >= 3
        ? {
            title: "O ingles teve pausas longas",
            copy: "Vale retomar sessoes curtas para nao deixar o idioma cair para segundo plano.",
          }
        : null,
    ].filter(Boolean),
    "Sem leitura suficiente para gerar insights de ingles."
  );
}

function renderRecommendations(rangeSessions, rangeEssays, rangeQuestions) {
  const englishSessions = rangeSessions.filter((session) => session.subjectKey === DEFAULT_SUBJECT_KEY);
  const recommendations = [];
  const routineFrequency = rangeSessions.length ? roundOne((countActiveDays(rangeSessions) / getRangeDayCount()) * 100) : 0;
  const weakestCompetency = buildEssayCompetencyMetrics(rangeEssays).slice(-1)[0] || null;
  const weakestQuestionSubject = buildQuestionDimensionStats(
    rangeQuestions,
    "subjectName",
    (attempt) => attempt.subjectName
  )
    .filter((item) => item.total >= 2)
    .sort((left, right) => {
      if (left.accuracy !== right.accuracy) return left.accuracy - right.accuracy;
      return right.total - left.total;
    })[0] || null;

  if (routineFrequency < 45) {
    recommendations.push({
      title: "Retome a constancia com sessoes menores",
      copy: "Sua frequencia esta baixa no recorte atual. Priorize sessoes curtas e repetiveis para recolocar o ritmo no eixo.",
    });
  }

  if (!rangeQuestions.length) {
    recommendations.push({
      title: "Ative o banco de questoes nesta semana",
      copy: "O dashboard ja esta pronto para interpretar acertos, erros e vestibulares. Falta apenas volume real de tentativas.",
    });
  }

  if (weakestQuestionSubject) {
    recommendations.push({
      title: `Reforce ${weakestQuestionSubject.label}`,
      copy: `Essa materia concentra a menor taxa de acerto do recorte e merece revisao direcionada antes da proxima rodada de questoes.`,
    });
  }

  if (weakestCompetency) {
    recommendations.push({
      title: `Revise ${weakestCompetency.shortLabel} na redacao`,
      copy: `${weakestCompetency.label} segue como o principal freio da sua nota. Uma revisao focada nessa competencia tende a gerar ganho mais rapido.`,
    });
  }

  if (englishSessions.length && getLargestGapDays(englishSessions) >= 3) {
    recommendations.push({
      title: "Nao deixe o ingles esfriar",
      copy: "O idioma teve pausas longas. Retome com observacoes curtas e um verbo estudado por sessao para ganhar consistencia de novo.",
    });
  }

  renderInsightCards(
    analyticsDom.dashboardRecommendationsList,
    recommendations.slice(0, 4),
    "Assim que houver historico suficiente, o painel vai indicar prioridades reais de retomada e reforco."
  );
}

function renderHistoryAnalytics(rangeEssays) {
  renderTodaySummary();

  const todayKey = toDateKey(new Date());
  const todaySessions = getSessionsByDate(todayKey);
  const todayMinutes = sumMinutes(todaySessions);
  const todayStateLabel = todayMinutes >= 120 ? "Forte" : todayMinutes >= 45 ? "Ativo" : todayMinutes > 0 ? "Leve" : "Livre";

  setTextContent(todayStateValue, todayStateLabel);
  setTextContent(todayPhraseCountValue, getObservationKeyword(todaySessions));
  renderEssayRows(
    analyticsDom.recentEssayTimeline,
    rangeEssays.length ? rangeEssays.slice(0, 6) : getEssaySubmissionsForRange("all").slice(0, 6),
    "Nenhuma redacao avaliada ate agora."
  );
}

function createCompactAnalyticsRow(title, subtitle, meta) {
  const row = document.createElement("article");
  row.className = "dashboard-compact-row";

  const copy = document.createElement("div");
  const titleNode = document.createElement("strong");
  titleNode.textContent = title;
  const subtitleNode = document.createElement("span");
  subtitleNode.textContent = subtitle;

  copy.appendChild(titleNode);
  copy.appendChild(subtitleNode);

  const metaNode = document.createElement("em");
  metaNode.textContent = meta;

  row.appendChild(copy);
  row.appendChild(metaNode);
  return row;
}

function renderCompactAnalyticsRows(container, rows, emptyMessage) {
  if (!container) {
    return;
  }

  container.replaceChildren();

  if (!rows.length) {
    container.appendChild(createEmptyMessage(emptyMessage));
    return;
  }

  rows.forEach((row) => {
    container.appendChild(createCompactAnalyticsRow(row.title, row.subtitle, row.meta));
  });
}

function buildSessionTimelinePoints(list, limit = 8) {
  const grouped = new Map();

  sortSessionsByStartDesc(list).forEach((session) => {
    const dateKey = session.dateKey || toDateKey(getSessionStartDate(session));
    grouped.set(dateKey, roundOne((grouped.get(dateKey) || 0) + (Number(session.minutes) || 0)));
  });

  return [...grouped.entries()]
    .sort((left, right) => left[0].localeCompare(right[0]))
    .slice(-limit)
    .map(([dateKey, minutes]) => ({
      label: formatShortDate(dateKey),
      value: minutes,
    }));
}

function buildOverallTrendPoints(rangeSessions, rangeQuestions, rangeEssays, limit = 8) {
  const grouped = new Map();

  rangeSessions.forEach((session) => {
    const dateKey = session.dateKey || toDateKey(getSessionStartDate(session));
    const current = grouped.get(dateKey) || 0;
    grouped.set(dateKey, current + (Number(session.minutes) || 0));
  });

  rangeQuestions.forEach((attempt) => {
    const dateKey = toDateKey(getQuestionAttemptDate(attempt) || new Date());
    const current = grouped.get(dateKey) || 0;
    grouped.set(dateKey, current + (attempt.isCorrect ? 18 : 9));
  });

  rangeEssays.forEach((essay) => {
    const referenceDate = getEssayReferenceDate(essay);
    const dateKey = toDateKey(referenceDate || new Date());
    const current = grouped.get(dateKey) || 0;
    grouped.set(dateKey, current + Math.max(24, roundOne((Number(essay.totalScore) || 0) / 20)));
  });

  return [...grouped.entries()]
    .sort((left, right) => left[0].localeCompare(right[0]))
    .slice(-limit)
    .map(([dateKey, value]) => ({
      label: formatShortDate(dateKey),
      value: roundOne(value),
    }));
}

function renderLineChart(container, points, emptyMessage, formatValue = (value) => String(value)) {
  if (!container) {
    return;
  }

  container.replaceChildren();

  if (!points.length || points.every((point) => Number(point.value) <= 0)) {
    container.appendChild(createEmptyMessage(emptyMessage));
    return;
  }

  const normalizedPoints = points.map((point) => ({
    label: point.label,
    value: Number(point.value) || 0,
  }));
  const maxValue = Math.max(...normalizedPoints.map((point) => point.value), 1);
  const width = 100;
  const height = 100;
  const usableHeight = 72;
  const startY = 14;
  const stepX = normalizedPoints.length > 1 ? width / (normalizedPoints.length - 1) : 0;

  const coordinates = normalizedPoints.map((point, index) => {
    const x = normalizedPoints.length === 1 ? width / 2 : stepX * index;
    const y = startY + (usableHeight - ((point.value / maxValue) * usableHeight));
    return { x, y, point };
  });

  const linePath = coordinates
    .map((coordinate, index) => `${index === 0 ? "M" : "L"} ${coordinate.x.toFixed(2)} ${coordinate.y.toFixed(2)}`)
    .join(" ");
  const areaPath = `${linePath} L ${coordinates[coordinates.length - 1].x.toFixed(2)} ${(startY + usableHeight).toFixed(2)} L ${coordinates[0].x.toFixed(2)} ${(startY + usableHeight).toFixed(2)} Z`;

  const wrapper = document.createElement("div");
  wrapper.className = "line-chart";

  const svg = createSvgElement("svg");
  svg.classList.add("line-chart-svg");
  svg.setAttribute("viewBox", `0 0 ${width} ${height}`);
  svg.setAttribute("preserveAspectRatio", "none");

  [0, 0.5, 1].forEach((ratio) => {
    const grid = createSvgElement("line");
    const y = startY + (usableHeight * ratio);
    grid.setAttribute("x1", "0");
    grid.setAttribute("x2", String(width));
    grid.setAttribute("y1", y.toFixed(2));
    grid.setAttribute("y2", y.toFixed(2));
    grid.setAttribute("class", "line-chart-grid");
    svg.appendChild(grid);
  });

  const area = createSvgElement("path");
  area.setAttribute("d", areaPath);
  area.setAttribute("class", "line-chart-area");
  svg.appendChild(area);

  const path = createSvgElement("path");
  path.setAttribute("d", linePath);
  path.setAttribute("class", "line-chart-path");
  svg.appendChild(path);

  coordinates.forEach((coordinate) => {
    const point = createSvgElement("circle");
    point.setAttribute("cx", coordinate.x.toFixed(2));
    point.setAttribute("cy", coordinate.y.toFixed(2));
    point.setAttribute("r", "2.8");
    point.setAttribute("class", "line-chart-point");
    point.setAttribute("aria-label", `${coordinate.point.label}: ${formatValue(coordinate.point.value, coordinate.point)}`);
    svg.appendChild(point);
  });

  const labels = document.createElement("div");
  labels.className = "line-chart-labels";
  labels.style.setProperty("--chart-count", String(normalizedPoints.length));

  normalizedPoints.forEach((point) => {
    const label = document.createElement("span");
    label.textContent = point.label;
    labels.appendChild(label);
  });

  wrapper.appendChild(svg);
  wrapper.appendChild(labels);
  container.appendChild(wrapper);
}

function buildValueMapByDate(list, getDateKey, getValue) {
  const map = new Map();

  list.forEach((item) => {
    const dateKey = String(getDateKey(item) || "").trim();

    if (!dateKey) {
      return;
    }

    map.set(dateKey, roundOne((map.get(dateKey) || 0) + (Number(getValue(item)) || 0)));
  });

  return map;
}

function buildQuestionStatsMapByDate(list) {
  const map = new Map();

  list.forEach((attempt) => {
    const date = getQuestionAttemptDate(attempt);

    if (!isValidDate(date)) {
      return;
    }

    const dateKey = toDateKey(date);
    const current = map.get(dateKey) || { total: 0, correct: 0 };
    current.total += 1;
    current.correct += attempt.isCorrect ? 1 : 0;
    map.set(dateKey, current);
  });

  return map;
}

function buildEssayStatsMapByDate(list) {
  const map = new Map();

  list.forEach((essay) => {
    const date = getEssayReferenceDate(essay);

    if (!isValidDate(date)) {
      return;
    }

    const dateKey = toDateKey(date);
    const current = map.get(dateKey) || { total: 0, score: 0 };
    current.total += 1;
    current.score += Number(essay.totalScore) || 0;
    map.set(dateKey, current);
  });

  return map;
}

function buildOverallScoreMapByDate(rangeSessions, rangeQuestions, rangeEssays) {
  const map = new Map();

  rangeSessions.forEach((session) => {
    const dateKey = session.dateKey || toDateKey(getSessionStartDate(session));
    map.set(dateKey, roundOne((map.get(dateKey) || 0) + (Number(session.minutes) || 0)));
  });

  rangeQuestions.forEach((attempt) => {
    const date = getQuestionAttemptDate(attempt);

    if (!isValidDate(date)) {
      return;
    }

    const dateKey = toDateKey(date);
    map.set(dateKey, roundOne((map.get(dateKey) || 0) + (attempt.isCorrect ? 18 : 9)));
  });

  rangeEssays.forEach((essay) => {
    const date = getEssayReferenceDate(essay);

    if (!isValidDate(date)) {
      return;
    }

    const dateKey = toDateKey(date);
    map.set(dateKey, roundOne((map.get(dateKey) || 0) + Math.max(24, roundOne((Number(essay.totalScore) || 0) / 20))));
  });

  return map;
}

function getDashboardFocusDateKeys(rangeSessions, rangeQuestions, rangeEssays, limit = 8) {
  const keys = new Set();

  rangeSessions.forEach((session) => {
    const dateKey = String(session.dateKey || toDateKey(getSessionStartDate(session)) || "").trim();
    if (dateKey) {
      keys.add(dateKey);
    }
  });

  rangeQuestions.forEach((attempt) => {
    const date = getQuestionAttemptDate(attempt);
    if (isValidDate(date)) {
      keys.add(toDateKey(date));
    }
  });

  rangeEssays.forEach((essay) => {
    const date = getEssayReferenceDate(essay);
    if (isValidDate(date)) {
      keys.add(toDateKey(date));
    }
  });

  return [...keys].sort((left, right) => left.localeCompare(right)).slice(-limit);
}

function buildWeekdayCountPoints(list, getDate) {
  return WEEKDAY_LABELS.map((label, index) => {
    const value = list.reduce((total, item) => {
      const date = getDate(item);

      if (!isValidDate(date)) {
        return total;
      }

      const weekdayIndex = date.getDay() === 0 ? 6 : date.getDay() - 1;
      return weekdayIndex === index ? total + 1 : total;
    }, 0);

    return { label, value };
  });
}

function formatCountLabel(value, singular, plural) {
  const rounded = Math.round(Number(value) || 0);
  return `${rounded} ${rounded === 1 ? singular : plural}`;
}

function updateDashboardFocusViewUI() {
  dashboardFocusViewButtons.forEach((button) => {
    const isActive = String(button.dataset.dashboardFocusView || "") === dashboardFocusView;
    button.classList.toggle("is-active", isActive);
    button.setAttribute("aria-selected", String(isActive));
  });
}

function buildDashboardFocusConfig(rangeSessions, rangeEssays, rangeQuestions) {
  const englishSessions = rangeSessions.filter((session) => session.subjectKey === DEFAULT_SUBJECT_KEY);
  const totalMinutes = sumMinutes(rangeSessions);
  const activeDays = countActiveDays(rangeSessions);
  const routineFrequency = rangeSessions.length
    ? roundOne((activeDays / getRangeDayCount()) * 100)
    : 0;
  const questionCount = rangeQuestions.length;
  const questionCorrect = rangeQuestions.filter((attempt) => attempt.isCorrect).length;
  const questionAccuracy = questionCount ? roundOne((questionCorrect / questionCount) * 100) : 0;
  const essayAverage = getEssayAverageScore(rangeEssays);
  const recentDateKeys = getDashboardFocusDateKeys(rangeSessions, rangeQuestions, rangeEssays, 8);
  const sessionMinutesMap = buildValueMapByDate(
    rangeSessions,
    (session) => session.dateKey || toDateKey(getSessionStartDate(session)),
    (session) => session.minutes
  );
  const englishMinutesMap = buildValueMapByDate(
    englishSessions,
    (session) => session.dateKey || toDateKey(getSessionStartDate(session)),
    (session) => session.minutes
  );
  const questionStatsMap = buildQuestionStatsMapByDate(rangeQuestions);
  const essayStatsMap = buildEssayStatsMapByDate(rangeEssays);
  const overallScoreMap = buildOverallScoreMapByDate(rangeSessions, rangeQuestions, rangeEssays);
  const labels = recentDateKeys.map((dateKey) => formatShortDate(dateKey));
  const metrics = [
    { label: "Tempo total", value: formatMinutesOnly(totalMinutes) },
    { label: "Frequencia", value: formatPercent(routineFrequency) },
    { label: "Questoes", value: formatPercent(questionAccuracy) },
    { label: "Redacao", value: rangeEssays.length ? `${Math.round(essayAverage)} / 1000` : "0 / 1000" },
  ];

  const panoramaConfig = {
    title: "Panorama",
    note: "Curvas normalizadas para comparar tendencia. Passe o mouse para ver os valores reais.",
    emptyMessage: "Sem dados suficientes para montar o panorama.",
    labels,
    metrics,
    series: [
      {
        label: "Indice geral",
        color: "#8db4ff",
        points: recentDateKeys.map((dateKey) => ({
          value: overallScoreMap.get(dateKey) || 0,
        })),
        formatValue: (point) => `${Math.round(point.value || 0)} pts`,
      },
      {
        label: "Consistencia",
        color: "#f0c16b",
        points: recentDateKeys.map((dateKey) => ({
          value: sessionMinutesMap.get(dateKey) ? 100 : 0,
        })),
        formatValue: (point) => (point.value ? "Dia ativo" : "Sem registro"),
      },
      {
        label: "Questoes",
        color: "#7ed8c2",
        points: recentDateKeys.map((dateKey) => {
          const stats = questionStatsMap.get(dateKey) || { total: 0, correct: 0 };
          return {
            value: stats.total ? roundOne((stats.correct / stats.total) * 100) : 0,
            meta: stats,
          };
        }),
        formatValue: (point) => (
          point.meta?.total
            ? `${formatPercent(point.value)} em ${formatCountLabel(point.meta.total, "tentativa", "tentativas")}`
            : "Sem tentativas"
        ),
      },
      {
        label: "Redacao",
        color: "#f3a6c6",
        points: recentDateKeys.map((dateKey) => {
          const stats = essayStatsMap.get(dateKey) || { total: 0, score: 0 };
          return {
            value: stats.total ? roundOne(stats.score / stats.total) : 0,
            meta: stats,
          };
        }),
        formatValue: (point) => (
          point.meta?.total
            ? `${Math.round(point.value || 0)} / 1000`
            : "Sem redacoes"
        ),
      },
    ],
  };

  const evolutionConfig = {
    title: "Evolucao recente",
    note: "Uso por modulo no recorte atual. Passe o mouse para comparar volume e presenca recente.",
    emptyMessage: "Sem dados suficientes para montar a evolucao.",
    labels,
    metrics,
    series: [
      {
        label: "Estudo",
        color: "#8db4ff",
        points: recentDateKeys.map((dateKey) => ({
          value: sessionMinutesMap.get(dateKey) || 0,
        })),
        formatValue: (point) => formatMinutesOnly(point.value || 0),
      },
      {
        label: "Ingles",
        color: "#c7b3ff",
        points: recentDateKeys.map((dateKey) => ({
          value: englishMinutesMap.get(dateKey) || 0,
        })),
        formatValue: (point) => formatMinutesOnly(point.value || 0),
      },
      {
        label: "Questoes",
        color: "#7ed8c2",
        points: recentDateKeys.map((dateKey) => {
          const stats = questionStatsMap.get(dateKey) || { total: 0, correct: 0 };
          return { value: stats.total, meta: stats };
        }),
        formatValue: (point) => formatCountLabel(point.value, "resposta", "respostas"),
      },
      {
        label: "Redacao",
        color: "#f3a6c6",
        points: recentDateKeys.map((dateKey) => {
          const stats = essayStatsMap.get(dateKey) || { total: 0, score: 0 };
          return { value: stats.total, meta: stats };
        }),
        formatValue: (point) => formatCountLabel(point.value, "redacao", "redacoes"),
      },
    ],
  };

  const rhythmConfig = {
    title: "Ritmo semanal",
    note: "Distribuicao da semana por modulo. Passe o mouse para ver onde o ritmo concentra mais volume.",
    emptyMessage: "Sem dados suficientes para montar o ritmo semanal.",
    labels: WEEKDAY_LABELS,
    metrics,
    series: [
      {
        label: "Estudo",
        color: "#8db4ff",
        points: buildWeekdayAggregatePoints(rangeSessions).map((point) => ({ value: point.value })),
        formatValue: (point) => formatMinutesOnly(point.value || 0),
      },
      {
        label: "Ingles",
        color: "#c7b3ff",
        points: buildWeekdayAggregatePoints(englishSessions).map((point) => ({ value: point.value })),
        formatValue: (point) => formatMinutesOnly(point.value || 0),
      },
      {
        label: "Questoes",
        color: "#7ed8c2",
        points: buildWeekdayCountPoints(rangeQuestions, (attempt) => getQuestionAttemptDate(attempt)).map((point) => ({
          value: point.value,
        })),
        formatValue: (point) => formatCountLabel(point.value, "tentativa", "tentativas"),
      },
      {
        label: "Redacao",
        color: "#f3a6c6",
        points: buildWeekdayCountPoints(rangeEssays, (essay) => getEssayReferenceDate(essay)).map((point) => ({
          value: point.value,
        })),
        formatValue: (point) => formatCountLabel(point.value, "redacao", "redacoes"),
      },
    ],
  };

  const viewConfigMap = {
    panorama: panoramaConfig,
    evolucao: evolutionConfig,
    ritmo: rhythmConfig,
  };

  return viewConfigMap[dashboardFocusView] || panoramaConfig;
}

function renderDashboardFocusLegend(series) {
  const container = modernDashboardDom.dashboardFocusLegend;

  if (!container) {
    return;
  }

  container.innerHTML = (Array.isArray(series) ? series : []).map((item) => `
    <span class="dashboard-focus-legend-item">
      <span class="dashboard-focus-legend-swatch" style="--series-color:${escapeHtml(item.color)}"></span>
      ${escapeHtml(item.label)}
    </span>
  `).join("");
}

function renderDashboardFocusMetrics(metrics) {
  const container = modernDashboardDom.dashboardFocusMetrics;

  if (!container) {
    return;
  }

  const items = Array.isArray(metrics) ? metrics : [];

  if (!items.length) {
    container.replaceChildren(createEmptyMessage("Os indicadores aparecem aqui.", "detail-empty"));
    return;
  }

  container.innerHTML = items.map((item) => `
    <article class="dashboard-focus-metric">
      <span>${escapeHtml(item.label)}</span>
      <strong>${escapeHtml(item.value)}</strong>
    </article>
  `).join("");
}

function renderMultiSeriesChart(container, config, emptyMessage) {
  if (!container) {
    return;
  }

  container.replaceChildren();

  const labels = Array.isArray(config?.labels) ? config.labels : [];
  const series = (Array.isArray(config?.series) ? config.series : []).filter((item) => {
    return Array.isArray(item?.points) && item.points.length === labels.length;
  });
  const hasData = series.some((item) => item.points.some((point) => Number(point?.value) > 0));

  if (!labels.length || !series.length || !hasData) {
    container.appendChild(createEmptyMessage(emptyMessage));
    return;
  }

  const width = 100;
  const height = 100;
  const usableHeight = 72;
  const startY = 14;
  const stepX = labels.length > 1 ? width / (labels.length - 1) : 0;
  const xPositions = labels.map((_, index) => (labels.length === 1 ? width / 2 : stepX * index));

  const wrapper = document.createElement("div");
  wrapper.className = "multi-line-chart";

  const svg = createSvgElement("svg");
  svg.classList.add("multi-line-chart-svg");
  svg.setAttribute("viewBox", `0 0 ${width} ${height}`);
  svg.setAttribute("preserveAspectRatio", "none");

  [0, 0.5, 1].forEach((ratio) => {
    const grid = createSvgElement("line");
    const y = startY + (usableHeight * ratio);
    grid.setAttribute("x1", "0");
    grid.setAttribute("x2", String(width));
    grid.setAttribute("y1", y.toFixed(2));
    grid.setAttribute("y2", y.toFixed(2));
    grid.setAttribute("class", "multi-line-grid");
    svg.appendChild(grid);
  });

  const activeGuide = createSvgElement("line");
  activeGuide.setAttribute("class", "multi-line-active-guide");
  activeGuide.setAttribute("y1", String(startY));
  activeGuide.setAttribute("y2", String(startY + usableHeight));
  svg.appendChild(activeGuide);

  const normalizedSeries = series.map((item) => {
    const maxValue = Math.max(...item.points.map((point) => Number(point?.value) || 0), 1);
    const coordinates = item.points.map((point, index) => {
      const value = Number(point?.value) || 0;
      return {
        x: xPositions[index],
        y: startY + (usableHeight - ((value / maxValue) * usableHeight)),
        point,
      };
    });

    return { ...item, coordinates };
  });

  normalizedSeries.forEach((item) => {
    const path = createSvgElement("path");
    const linePath = item.coordinates
      .map((coordinate, index) => `${index === 0 ? "M" : "L"} ${coordinate.x.toFixed(2)} ${coordinate.y.toFixed(2)}`)
      .join(" ");
    path.setAttribute("d", linePath);
    path.setAttribute("class", "multi-line-path");
    path.style.setProperty("--series-color", item.color);
    svg.appendChild(path);

    item.coordinates.forEach((coordinate) => {
      const point = createSvgElement("circle");
      point.setAttribute("cx", coordinate.x.toFixed(2));
      point.setAttribute("cy", coordinate.y.toFixed(2));
      point.setAttribute("r", "2.6");
      point.setAttribute("class", "multi-line-point");
      point.style.setProperty("--series-color", item.color);
      svg.appendChild(point);
    });
  });

  const tooltip = document.createElement("div");
  tooltip.className = "dashboard-focus-tooltip";

  const updateTooltip = (index, clientX, clientY) => {
    const bounds = wrapper.getBoundingClientRect();
    const label = labels[index] || "";
    const rowsMarkup = normalizedSeries.map((item) => {
      const point = item.points[index] || { value: 0 };
      const formatter = typeof item.formatValue === "function"
        ? item.formatValue
        : (payload) => String(payload?.value || 0);

      return `
        <div class="dashboard-focus-tooltip-row">
          <span class="dashboard-focus-tooltip-swatch" style="--series-color:${escapeHtml(item.color)}"></span>
          <span>${escapeHtml(item.label)}</span>
          <strong>${escapeHtml(formatter(point))}</strong>
        </div>
      `;
    }).join("");

    tooltip.innerHTML = `<strong>${escapeHtml(label)}</strong>${rowsMarkup}`;
    tooltip.classList.add("is-visible");

    const left = Math.max(34, Math.min(clientX - bounds.left, bounds.width - 34));
    const top = Math.max(38, Math.min(clientY - bounds.top, bounds.height - 12));
    tooltip.style.left = `${left}px`;
    tooltip.style.top = `${top}px`;

    const x = xPositions[index];
    activeGuide.setAttribute("x1", x.toFixed(2));
    activeGuide.setAttribute("x2", x.toFixed(2));
    activeGuide.style.opacity = "1";
  };

  const hideTooltip = () => {
    tooltip.classList.remove("is-visible");
    activeGuide.style.opacity = "0";
  };

  labels.forEach((_, index) => {
    const hitbox = createSvgElement("rect");
    const previousX = xPositions[index - 1] ?? xPositions[index];
    const nextX = xPositions[index + 1] ?? xPositions[index];
    const xStart = index === 0 ? 0 : (previousX + xPositions[index]) / 2;
    const xEnd = index === labels.length - 1 ? width : (xPositions[index] + nextX) / 2;

    hitbox.setAttribute("x", xStart.toFixed(2));
    hitbox.setAttribute("y", "0");
    hitbox.setAttribute("width", Math.max(2, xEnd - xStart).toFixed(2));
    hitbox.setAttribute("height", String(height));
    hitbox.setAttribute("class", "multi-line-hitbox");
    hitbox.addEventListener("mouseenter", (event) => updateTooltip(index, event.clientX, event.clientY));
    hitbox.addEventListener("mousemove", (event) => updateTooltip(index, event.clientX, event.clientY));
    hitbox.addEventListener("mouseleave", hideTooltip);
    svg.appendChild(hitbox);
  });

  wrapper.addEventListener("mouseleave", hideTooltip);

  const labelRow = document.createElement("div");
  labelRow.className = "multi-line-chart-labels";
  labelRow.style.setProperty("--chart-count", String(labels.length));

  labels.forEach((label) => {
    const item = document.createElement("span");
    item.textContent = label;
    labelRow.appendChild(item);
  });

  wrapper.appendChild(svg);
  wrapper.appendChild(labelRow);
  wrapper.appendChild(tooltip);
  container.appendChild(wrapper);
}

function renderDashboardFocus(rangeSessions, rangeEssays, rangeQuestions) {
  try {
    const config = buildDashboardFocusConfig(rangeSessions, rangeEssays, rangeQuestions);

    updateDashboardFocusViewUI();
    setTextContent(modernDashboardDom.dashboardFocusTitle, config.title);
    setTextContent(modernDashboardDom.dashboardFocusNote, config.note);
    renderDashboardFocusLegend(config.series);
    renderDashboardFocusMetrics(config.metrics);
    renderMultiSeriesChart(
      modernDashboardDom.dashboardFocusChart,
      config,
      config.emptyMessage || "Sem dados suficientes para montar o grafico."
    );
  } catch (error) {
    console.error("Erro ao renderizar o grafico principal do painel:", error);
    setTextContent(modernDashboardDom.dashboardFocusTitle, "Panorama");
    setTextContent(
      modernDashboardDom.dashboardFocusNote,
      "Nao foi possivel montar o grafico agora. Tente atualizar a pagina."
    );
    renderDashboardFocusLegend([]);
    renderDashboardFocusMetrics([]);
    modernDashboardDom.dashboardFocusChart?.replaceChildren(
      createEmptyMessage("Nao foi possivel carregar o grafico principal.")
    );
  }
}

function renderModernDashboard(rangeSessions, rangeEssays, rangeQuestions) {
  renderDashboardFocus(rangeSessions, rangeEssays, rangeQuestions);
}

function renderDashboard() {
  const rangeSessions = getSessionsForRange();
  const rangeEssays = getEssaySubmissionsForRange();
  const rangeQuestions = getQuestionAttemptsForRange();

  updateAnalyticsRangeUI();
  renderModernDashboard(rangeSessions, rangeEssays, rangeQuestions);
  window.Start5Auth?.setHeaderMonthlyMinutes?.(sumMinutes(getCurrentMonthSessions()));
}

function findSessionById(sessionId) {
  return sessions.find((session) => session.id === sessionId) || null;
}

function getCurrentSessionPayload() {
  const customSubjectName = String(customSubjectInput?.value || "").trim();
  return {
    minutes: getMinutesToSave(),
    subjectKey: selectedSubjectKey,
    customSubjectName,
    topicText: String(topicInput?.value || "").trim(),
    verbs: selectedVerbs,
    phrases: selectedPhrases,
    englishDetails: {
      verbs: [...selectedVerbs],
      phrases: [...selectedPhrases],
    },
    notes: selectedNotes,
  };
}

async function saveSession() {
  if (isSavingSession) {
    return;
  }

  updateStudyMinutesValidity();

  if (!sessionForm?.reportValidity()) {
    return;
  }

  const payload = getCurrentSessionPayload();

  if (!Number.isFinite(payload.minutes) || payload.minutes < MIN_SESSION_MINUTES) {
    sessionHelper.textContent = `Informe pelo menos ${MIN_SESSION_MINUTES} min para salvar a pratica.`;
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
    await loadRoutinePlanFromApi();
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
    await loadRoutinePlanFromApi();
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
  if (menuToggle && !window.Start5Main?.sidebarNavigation?.isManaged) {
    menuToggle.addEventListener("click", toggleMenu);
  }

  if (menuPanel && !window.Start5Main?.sidebarNavigation?.isManaged) {
    menuPanel.addEventListener("click", (event) => {
      if (event.target === menuPanel) {
        closeMenu();
      }
    });
  }

  panelTabButtons.forEach((button) => {
    button.addEventListener("click", () => {
      setDashboardView(button.dataset.panelTab || "overview");
    });
  });

  window.addEventListener("hashchange", () => {
    setDashboardView(getDashboardViewFromHash(), { updateHash: false });
  });
  window.addEventListener("resize", refreshSessionActionsVisibility);

  analyticsRangeButtons.forEach((button) => {
    button.addEventListener("click", () => {
      setAnalyticsRange(button.dataset.analyticsRange || "30d");
    });
  });

  dashboardFocusViewButtons.forEach((button) => {
    button.addEventListener("click", () => {
      const nextView = String(button.dataset.dashboardFocusView || "panorama");

      if (nextView === dashboardFocusView) {
        return;
      }

      dashboardFocusView = nextView;
      renderDashboard();
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

  studyMinutesInput?.addEventListener("input", () => {
    updateStudyMinutesValidity();
    updateSessionHelper();
  });
  customSubjectInput?.addEventListener("input", () => {
    selectedSubjectKey = "outras";
    updateSubjectSelectionUI();
    updateSessionHelper();
  });
  topicInput?.addEventListener("input", updateSessionHelper);
  sessionForm?.addEventListener("scroll", updateSessionActionsVisibility);

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

  modalBackdrop?.addEventListener("cancel", (event) => {
    event.preventDefault();
    closeSessionModal();
  });

  closeDeleteModalButtons.forEach((button) => {
    button.addEventListener("click", closeDeleteModal);
  });

  deleteSessionBackdrop?.addEventListener("click", (event) => {
    if (event.target === deleteSessionBackdrop) {
      closeDeleteModal();
    }
  });

  deleteSessionBackdrop?.addEventListener("cancel", (event) => {
    event.preventDefault();
    closeDeleteModal();
  });

  sessionForm?.addEventListener("submit", (event) => {
    event.preventDefault();
    saveSession();
  });

  deleteSessionForm?.addEventListener("submit", (event) => {
    event.preventDefault();
    confirmDeleteSession();
  });

  todaySessionsList?.addEventListener("click", handleSessionActionClick);
  recentSessionsList?.addEventListener("click", handleSessionActionClick);

  document.addEventListener("keydown", (event) => {
    if (event.key !== "Escape") {
      return;
    }

    if (isModalLayerOpen(deleteSessionBackdrop)) {
      closeDeleteModal();
      return;
    }

    if (isModalLayerOpen(modalBackdrop)) {
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
  setDashboardView(getDashboardViewFromHash(), { updateHash: false });

  if (!window.Start5Auth?.ready) {
    return;
  }

  await window.Start5Auth.ready;

  if (!window.Start5Auth.getSession()) {
    return;
  }

  await loadQuestionAttemptsFromApi();
  await importLegacySessionsIfNeeded();
  await loadSessionsFromApi();
  await loadEssaySubmissionsFromApi();
  await loadRoutinePlanFromApi();
  renderDashboard();
}

initializeApp().catch((error) => {
  console.error("Erro ao inicializar o painel do Start 5:", error);
});
