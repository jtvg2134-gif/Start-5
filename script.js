const body = document.body;
const menuToggle = document.getElementById("menuToggle");
const menuPanel = document.getElementById("menuPanel");

const DAILY_GOALS = {
  cansado: 10,
  normal: 15,
  focado: 20,
};

const MEDALS = [
  { key: "bronze", name: "Bronze", target: 150, description: "Primeiro nível de constância" },
  { key: "silver", name: "Prata", target: 300, description: "Ritmo consistente" },
  { key: "gold", name: "Ouro", target: 600, description: "Constância acima da média" },
];

const AUTO_DURATION_BY_STATE = {
  cansado: 10,
  normal: 15,
  focado: 20,
};

const ALLOWED_DURATIONS_BY_STATE = {
  cansado: ["10"],
  normal: ["15"],
  focado: ["20", "extra"],
};

const VALID_STATES = Object.keys(DAILY_GOALS);
const LEGACY_IMPORT_PREFIX = "start5_legacy_imported_";

let sessions = [];
let selectedState = "normal";
let selectedDuration = 15;

const startSessionButton = document.getElementById("startSessionButton");

const modalBackdrop = document.getElementById("sessionModalBackdrop");
const closeSessionModalButtons = document.querySelectorAll("[data-close-session-modal]");
const stateButtons = [...document.querySelectorAll("[data-state]")];
const durationButtons = [...document.querySelectorAll("[data-duration]")];
const extraMinutesBox = document.getElementById("extraMinutesBox");
const extraMinutesInput = document.getElementById("extraMinutesInput");
const saveSessionButton = document.getElementById("saveSessionButton");
const sessionHelper = document.getElementById("sessionHelper");

const scoreNumber = document.getElementById("scoreNumber");
const vsYesterdayValue = document.getElementById("vsYesterdayValue");
const vsMonthValue = document.getElementById("vsMonthValue");
const currentStateValue = document.getElementById("currentStateValue");
const goalValue = document.getElementById("goalValue");
const doneValue = document.getElementById("doneValue");
const streakValue = document.getElementById("streakValue");

const achievementsSubtitle = document.getElementById("achievementsSubtitle");
const currentMedalCard = document.getElementById("currentMedalCard");
const currentMedalBadge = document.getElementById("currentMedalBadge");
const currentMedalName = document.getElementById("currentMedalName");
const currentMedalMinutes = document.getElementById("currentMedalMinutes");
const currentMedalTarget = document.getElementById("currentMedalTarget");
const currentMedalExtra = document.getElementById("currentMedalExtra");
const medalCards = [...document.querySelectorAll(".achievements-grid .medal-card[data-medal]")];

const todaySessionsList = document.getElementById("todaySessionsList");
const todayDateLabel = document.getElementById("todayDateLabel");
const todayMinutesValue = document.getElementById("todayMinutesValue");
const todayCountValue = document.getElementById("todayCountValue");
const todayStateValue = document.getElementById("todayStateValue");
const todayAverageValue = document.getElementById("todayAverageValue");
const todayBestValue = document.getElementById("todayBestValue");
const todayHighlightTitle = document.getElementById("todayHighlightTitle");
const todayHighlightText = document.getElementById("todayHighlightText");

function closeMenu() {
  body.classList.remove("menu-open");

  if (menuToggle) {
    menuToggle.setAttribute("aria-expanded", "false");
    menuToggle.setAttribute("aria-label", "Abrir menu");
  }
}

function openMenu() {
  body.classList.add("menu-open");

  if (menuToggle) {
    menuToggle.setAttribute("aria-expanded", "true");
    menuToggle.setAttribute("aria-label", "Fechar menu");
  }
}

function toggleMenu() {
  if (body.classList.contains("menu-open")) {
    closeMenu();
    return;
  }

  openMenu();
}

function toDateKey(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function parseDateKey(dateKey) {
  return new Date(`${dateKey}T12:00:00`);
}

function shiftDate(date, amount) {
  const nextDate = new Date(date);
  nextDate.setDate(nextDate.getDate() + amount);
  return nextDate;
}

function isValidDate(value) {
  return value instanceof Date && !Number.isNaN(value.getTime());
}

function getSafeState(state) {
  return VALID_STATES.includes(state) ? state : "normal";
}

function getSessionStartDate(session) {
  const fallbackDate = session?.date || toDateKey(new Date());
  const rawValue = session?.startedAt || session?.createdAt || `${fallbackDate}T12:00:00`;
  const parsedDate = new Date(rawValue);
  return isValidDate(parsedDate) ? parsedDate : parseDateKey(fallbackDate);
}

function getSessionEndDate(session) {
  const parsedDate = session?.endedAt ? new Date(session.endedAt) : null;

  if (isValidDate(parsedDate)) {
    return parsedDate;
  }

  return new Date(getSessionStartDate(session).getTime() + (Number(session?.minutes) || 0) * 60000);
}

function normalizeSession(session) {
  const safeMinutes = Number(session?.minutes) || 0;
  const safeState = getSafeState(session?.state);
  const startDate = getSessionStartDate(session);
  const endDate = getSessionEndDate({
    ...session,
    minutes: safeMinutes,
    startedAt: startDate.toISOString(),
  });
  const createdAtDate = session?.createdAt ? new Date(session.createdAt) : startDate;
  const safeCreatedAt = isValidDate(createdAtDate) ? createdAtDate : startDate;

  return {
    ...session,
    date: session?.date || toDateKey(startDate),
    minutes: safeMinutes,
    state: safeState,
    startedAt: startDate.toISOString(),
    endedAt: endDate.toISOString(),
    createdAt: safeCreatedAt.toISOString(),
    type: session?.type || (safeMinutes > 20 ? "extra" : "padrao"),
  };
}

function createSessionRecord(date, minutes, state, hour = 12, minute = 0) {
  const startedAt = new Date(date);
  startedAt.setHours(hour, minute, 0, 0);

  return normalizeSession({
    date: toDateKey(startedAt),
    minutes,
    state,
    startedAt: startedAt.toISOString(),
    endedAt: new Date(startedAt.getTime() + minutes * 60000).toISOString(),
    createdAt: startedAt.toISOString(),
    type: minutes > 20 ? "extra" : "padrao",
  });
}

function roundOne(value) {
  return Math.round(value * 10) / 10;
}

function formatNumber(value) {
  const rounded = roundOne(value);
  return Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(1).replace(".", ",");
}

function formatMinutesOnly(minutes) {
  return `${formatNumber(minutes)} min`;
}

function formatSignedMinutes(value) {
  if (value === 0) return "0 min";
  const sign = value > 0 ? "+" : "-";
  return `${sign}${formatMinutesOnly(Math.abs(value))}`;
}

function formatDuration(minutes) {
  const safeMinutes = roundOne(minutes);

  if (safeMinutes < 60) {
    return `${formatNumber(safeMinutes)} min`;
  }

  const hours = Math.floor(safeMinutes / 60);
  const remaining = roundOne(safeMinutes - hours * 60);

  if (remaining === 0) {
    return `${hours}h`;
  }

  return `${hours}h ${formatNumber(remaining)}min`;
}

function capitalize(text) {
  if (!text) return "";
  return text.charAt(0).toUpperCase() + text.slice(1);
}

function sumMinutes(list) {
  return roundOne(list.reduce((total, item) => total + item.minutes, 0));
}

function formatFullDate(dateValue) {
  const date = dateValue instanceof Date ? dateValue : new Date(dateValue);

  if (!isValidDate(date)) return "--";

  return capitalize(
    date.toLocaleDateString("pt-BR", {
      weekday: "long",
      day: "2-digit",
      month: "long",
    })
  );
}

function formatShortDate(dateValue) {
  const date = dateValue instanceof Date ? dateValue : new Date(dateValue);

  if (!isValidDate(date)) return "--/--";

  return date.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
  });
}

function formatTime(dateValue) {
  const date = dateValue instanceof Date ? dateValue : new Date(dateValue);

  if (!isValidDate(date)) return "--:--";

  return date.toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getSessionsByDate(dateKey) {
  return sessions
    .filter((session) => session.date === dateKey)
    .sort((left, right) => getSessionStartDate(left) - getSessionStartDate(right));
}

function getDayTotal(dateKey) {
  return sumMinutes(getSessionsByDate(dateKey));
}

function isSameMonth(dateKey, referenceDate) {
  const date = parseDateKey(dateKey);
  return (
    date.getMonth() === referenceDate.getMonth() &&
    date.getFullYear() === referenceDate.getFullYear()
  );
}

function isPreviousMonth(dateKey, referenceDate) {
  const date = parseDateKey(dateKey);
  const previousMonth = new Date(referenceDate.getFullYear(), referenceDate.getMonth() - 1, 1);

  return (
    date.getMonth() === previousMonth.getMonth() &&
    date.getFullYear() === previousMonth.getFullYear()
  );
}

function getMonthTotal(referenceDate = new Date()) {
  return sumMinutes(sessions.filter((session) => isSameMonth(session.date, referenceDate)));
}

function getPreviousMonthTotal(referenceDate = new Date()) {
  return sumMinutes(
    sessions.filter((session) => isPreviousMonth(session.date, referenceDate))
  );
}

function getCurrentState(todayKey) {
  const todaySessions = getSessionsByDate(todayKey);
  if (!todaySessions.length) return "normal";
  return getSafeState(todaySessions[todaySessions.length - 1].state);
}

function getStreak() {
  let streak = 0;
  const today = new Date();

  for (let offset = 0; offset < 365; offset += 1) {
    const dateKey = toDateKey(shiftDate(today, -offset));
    const total = getDayTotal(dateKey);

    if (total > 0) {
      streak += 1;
      continue;
    }

    break;
  }

  return streak;
}

function getCurrentMedal(monthTotal) {
  let currentMedal = null;

  for (const medal of MEDALS) {
    if (monthTotal >= medal.target) {
      currentMedal = medal;
    }
  }

  return currentMedal;
}

function getNextMedal(monthTotal) {
  return MEDALS.find((medal) => monthTotal < medal.target) || null;
}

function getRealTodaySessions() {
  return getSessionsByDate(toDateKey(new Date())).slice().reverse();
}

function getDominantState(sessionList) {
  const totalsByState = {};

  sessionList.forEach((session) => {
    if (!totalsByState[session.state]) {
      totalsByState[session.state] = { minutes: 0, count: 0 };
    }

    totalsByState[session.state].minutes += session.minutes;
    totalsByState[session.state].count += 1;
  });

  const dominantEntry = Object.entries(totalsByState).sort((left, right) => {
    const byMinutes = right[1].minutes - left[1].minutes;

    if (byMinutes !== 0) return byMinutes;
    return right[1].count - left[1].count;
  })[0];

  return dominantEntry ? dominantEntry[0] : "normal";
}

function readStoredJson(key, fallback = null) {
  try {
    const rawValue = localStorage.getItem(key);
    return rawValue ? JSON.parse(rawValue) : fallback;
  } catch (error) {
    console.error("Erro ao ler dado legado:", error);
    return fallback;
  }
}

function getLegacyImportKey() {
  const currentUser = window.Start5Auth?.getSession?.();
  return currentUser ? `${LEGACY_IMPORT_PREFIX}${currentUser.id}` : null;
}

function getLegacySessionsForCurrentUser() {
  const collections = [];
  const sharedSessions = readStoredJson("start5_sessions", []);

  if (Array.isArray(sharedSessions) && sharedSessions.length) {
    collections.push(...sharedSessions);
  }

  const currentUser = window.Start5Auth?.getSession?.();
  const legacyUser = readStoredJson("start5_active_user", null);

  if (
    currentUser &&
    legacyUser &&
    String(legacyUser.email || "").trim().toLowerCase() ===
      String(currentUser.email || "").trim().toLowerCase()
  ) {
    const legacyUserSessions = readStoredJson(`start5_sessions_${legacyUser.id}`, []);

    if (Array.isArray(legacyUserSessions) && legacyUserSessions.length) {
      collections.push(...legacyUserSessions);
    }
  }

  return collections.map((session) => normalizeSession(session));
}

async function importLegacySessionsIfNeeded() {
  const importKey = getLegacyImportKey();

  if (!importKey || localStorage.getItem(importKey) === "done") {
    return;
  }

  const legacySessions = getLegacySessionsForCurrentUser();

  if (!legacySessions.length) {
    localStorage.setItem(importKey, "done");
    return;
  }

  await window.Start5Auth.apiRequest("/api/sessions/import", {
    method: "POST",
    body: { sessions: legacySessions },
  });

  localStorage.setItem(importKey, "done");
}

async function loadSessionsFromApi() {
  const response = await window.Start5Auth.apiRequest("/api/sessions");
  sessions = Array.isArray(response?.sessions)
    ? response.sessions.map((session) => normalizeSession(session))
    : [];
}

function openSessionModal() {
  closeMenu();

  if (!modalBackdrop) return;

  modalBackdrop.classList.add("is-visible");
  modalBackdrop.setAttribute("aria-hidden", "false");
  body.classList.add("modal-open");
  setSelectedState("normal");
}

function closeSessionModal() {
  if (!modalBackdrop) return;

  modalBackdrop.classList.remove("is-visible");
  modalBackdrop.setAttribute("aria-hidden", "true");
  body.classList.remove("modal-open");

  if (extraMinutesBox) extraMinutesBox.classList.remove("is-visible");
  if (extraMinutesInput) extraMinutesInput.value = "";
}

function updateStateButtons() {
  stateButtons.forEach((button) => {
    const isActive = button.dataset.state === selectedState;
    button.classList.toggle("is-active", isActive);
    button.setAttribute("aria-pressed", String(isActive));
  });
}

function updateDurationButtons() {
  const allowedDurations = ALLOWED_DURATIONS_BY_STATE[selectedState];

  durationButtons.forEach((button) => {
    const value = button.dataset.duration;
    const isAllowed = allowedDurations.includes(value);
    const isExtraActive = value === "extra" && extraMinutesBox?.classList.contains("is-visible");
    const isNormalActive = value !== "extra" && Number(value) === selectedDuration && isAllowed;
    const isActive = isExtraActive || isNormalActive;

    button.disabled = !isAllowed;
    button.classList.toggle("is-disabled", !isAllowed);
    button.classList.toggle("is-active", isActive);
    button.setAttribute("aria-pressed", String(isActive));
  });
}

function updateSessionHelper() {
  if (!sessionHelper) return;

  if (selectedState === "cansado") {
    sessionHelper.textContent = "Dia cansado • 10 min";
    return;
  }

  if (selectedState === "normal") {
    sessionHelper.textContent = "Dia normal • 15 min";
    return;
  }

  if (selectedState === "focado" && !extraMinutesBox?.classList.contains("is-visible")) {
    sessionHelper.textContent = "Dia focado • 20 min";
    return;
  }

  const value = Number(extraMinutesInput?.value);

  if (!value || value <= 20) {
    sessionHelper.textContent = "Horas extras • digite acima de 20 min";
    return;
  }

  sessionHelper.textContent = `Horas extras • ${value} min`;
}

function setSelectedState(state) {
  selectedState = getSafeState(state);
  selectedDuration = AUTO_DURATION_BY_STATE[selectedState];

  if (selectedState !== "focado") {
    if (extraMinutesBox) extraMinutesBox.classList.remove("is-visible");
    if (extraMinutesInput) extraMinutesInput.value = "";
  }

  updateStateButtons();
  updateDurationButtons();
  updateSessionHelper();
}

function getMinutesToSave() {
  if (selectedState === "focado" && extraMinutesBox?.classList.contains("is-visible")) {
    const value = Number(extraMinutesInput?.value);
    return value > 20 ? value : null;
  }

  return selectedDuration;
}

function renderTodaySessions() {
  if (!todaySessionsList) return;

  const todaySessions = getRealTodaySessions();

  if (!todaySessions.length) {
    todaySessionsList.innerHTML = `
      <div class="session-empty">
        Você ainda não registrou nenhuma sessão hoje.
      </div>
    `;
    return;
  }

  todaySessionsList.innerHTML = todaySessions
    .map((session) => {
      const startDate = getSessionStartDate(session);
      const endDate = getSessionEndDate(session);

      return `
        <article class="session-item">
          <div class="session-row">
            <div class="session-main">
              <span class="session-state ${session.state}">${capitalize(session.state)}</span>
              <span class="session-day">${formatShortDate(startDate)}</span>
            </div>

            <span class="session-minutes">${formatNumber(session.minutes)} min</span>
          </div>

          <div class="session-times">
            <span class="session-time-pill">Início ${formatTime(startDate)}</span>
            <span class="session-time-pill">Fim ${formatTime(endDate)}</span>
          </div>
        </article>
      `;
    })
    .join("");
}

function renderTodaySummaryPanel() {
  if (!todayMinutesValue || !todayCountValue || !todayStateValue) return;

  const todayKey = toDateKey(new Date());
  const todaySessionsAscending = getSessionsByDate(todayKey);
  const todaySessions = todaySessionsAscending.slice().reverse();
  const totalMinutes = sumMinutes(todaySessions);
  const totalCount = todaySessions.length;
  const latestStateKey = totalCount
    ? getSafeState(todaySessionsAscending[totalCount - 1].state)
    : "normal";
  const latestState = capitalize(latestStateKey);
  const averageMinutes = totalCount ? roundOne(totalMinutes / totalCount) : 0;
  const bestSessionMinutes = totalCount
    ? Math.max(...todaySessions.map((session) => session.minutes))
    : 0;
  const dominantState = capitalize(getDominantState(todaySessions));
  const goal = DAILY_GOALS[latestStateKey] || 15;
  const differenceToGoal = roundOne(totalMinutes - goal);
  const firstSession = totalCount ? todaySessionsAscending[0] : null;
  const lastSession = totalCount ? todaySessionsAscending[totalCount - 1] : null;

  todayMinutesValue.textContent = formatDuration(totalMinutes);
  todayCountValue.textContent = String(totalCount);
  todayStateValue.textContent = latestState;

  if (todayAverageValue) {
    todayAverageValue.textContent = formatDuration(averageMinutes);
  }

  if (todayBestValue) {
    todayBestValue.textContent = formatDuration(bestSessionMinutes);
  }

  if (!todayHighlightTitle || !todayHighlightText) return;

  if (!totalCount) {
    todayHighlightTitle.textContent = "Nenhuma sessão registrada hoje.";
    todayHighlightText.textContent =
      "Quando você salvar a primeira sessão, este bloco mostra o ritmo do dia, a melhor sessão e a distância até a meta.";
    return;
  }

  if (differenceToGoal < 0) {
    todayHighlightTitle.textContent = `Faltam ${formatDuration(
      Math.abs(differenceToGoal)
    )} para bater a meta de hoje.`;
  } else if (differenceToGoal === 0) {
    todayHighlightTitle.textContent = "Meta de hoje concluída no limite.";
  } else {
    todayHighlightTitle.textContent = `${formatDuration(differenceToGoal)} acima da meta de hoje.`;
  }

  const sessionWindowText =
    totalCount > 1 && firstSession && lastSession
      ? `Primeira sessão começou às ${formatTime(
          getSessionStartDate(firstSession)
        )} e a última termina às ${formatTime(getSessionEndDate(lastSession))}.`
      : `Sessão de ${formatTime(getSessionStartDate(lastSession))} até ${formatTime(
          getSessionEndDate(lastSession)
        )}.`;

  todayHighlightText.textContent =
    `Ritmo médio de ${formatDuration(averageMinutes)}, maior sessão de ${formatDuration(
      bestSessionMinutes
    )} e estado dominante ${dominantState}. ` + sessionWindowText;
}

function renderDayHistory() {
  if (todayDateLabel) {
    todayDateLabel.textContent = formatFullDate(new Date());
  }

  renderTodaySessions();
  renderTodaySummaryPanel();
}

function renderProgress() {
  const today = new Date();
  const todayKey = toDateKey(today);
  const yesterdayKey = toDateKey(shiftDate(today, -1));
  const todayTotal = getDayTotal(todayKey);
  const yesterdayTotal = getDayTotal(yesterdayKey);
  const monthTotal = getMonthTotal(today);
  const previousMonthTotal = getPreviousMonthTotal(today);
  const currentState = getCurrentState(todayKey);
  const goal = DAILY_GOALS[currentState] || 15;
  const percent = goal > 0 ? Math.round((todayTotal / goal) * 100) : 0;
  const streak = getStreak();

  if (scoreNumber) scoreNumber.textContent = `${percent}%`;
  if (vsYesterdayValue) {
    vsYesterdayValue.textContent = formatSignedMinutes(todayTotal - yesterdayTotal);
  }
  if (vsMonthValue) {
    vsMonthValue.textContent = formatSignedMinutes(monthTotal - previousMonthTotal);
  }
  if (currentStateValue) currentStateValue.textContent = capitalize(currentState);
  if (goalValue) goalValue.textContent = formatMinutesOnly(goal);
  if (doneValue) doneValue.textContent = formatDuration(todayTotal);
  if (streakValue) streakValue.textContent = `${streak} dias`;
}

function renderMedals() {
  if (!currentMedalCard) return;

  const monthTotal = getMonthTotal();
  const currentMedal = getCurrentMedal(monthTotal);
  const nextMedal = getNextMedal(monthTotal);

  currentMedalCard.classList.remove("bronze", "silver", "gold");

  if (currentMedal) {
    currentMedalCard.classList.add(currentMedal.key);
    if (currentMedalBadge) currentMedalBadge.textContent = "Atual";
    if (currentMedalName) currentMedalName.textContent = currentMedal.name;
    if (currentMedalMinutes) {
      currentMedalMinutes.textContent = `${formatMinutesOnly(
        monthTotal
      )} acumulados • ${formatDuration(monthTotal)}`;
    }
    if (currentMedalTarget) {
      currentMedalTarget.textContent = `Meta da medalha: ${currentMedal.target} min`;
    }

    const extraMinutes = roundOne(monthTotal - currentMedal.target);

    if (currentMedalExtra) {
      currentMedalExtra.textContent =
        extraMinutes > 0 ? `+${formatNumber(extraMinutes)} min acima da meta` : "Meta alcançada";
    }

    if (achievementsSubtitle) {
      if (nextMedal) {
        const missing = roundOne(nextMedal.target - monthTotal);
        achievementsSubtitle.textContent = `Faltam ${formatMinutesOnly(
          missing
        )} para alcançar ${nextMedal.name}.`;
      } else {
        achievementsSubtitle.textContent = "Você já alcançou a medalha máxima do mês.";
      }
    }
  } else {
    const firstMedal = MEDALS[0];
    const missing = roundOne(firstMedal.target - monthTotal);

    if (currentMedalBadge) currentMedalBadge.textContent = "Em progresso";
    if (currentMedalName) currentMedalName.textContent = "Sem medalha ainda";
    if (currentMedalMinutes) currentMedalMinutes.textContent = `${formatMinutesOnly(monthTotal)} acumulados`;
    if (currentMedalTarget) currentMedalTarget.textContent = `Primeira meta: ${firstMedal.target} min`;
    if (currentMedalExtra) currentMedalExtra.textContent = `Faltam ${formatMinutesOnly(missing)} para a Bronze.`;
    if (achievementsSubtitle) {
      achievementsSubtitle.textContent = "Continue registrando seus minutos para desbloquear a primeira medalha.";
    }
  }

  medalCards.forEach((card) => {
    const medal = MEDALS.find((item) => item.key === card.dataset.medal);

    if (!medal) return;

    const unlocked = monthTotal >= medal.target;
    const isCurrent = currentMedal?.key === medal.key;
    const status = card.querySelector(".medal-status");

    card.classList.toggle("level-unlocked", unlocked);
    card.classList.toggle("level-locked", !unlocked);
    card.classList.toggle("level-current", Boolean(isCurrent));

    if (!status) return;

    if (isCurrent) {
      status.textContent = "Atual";
      return;
    }

    status.textContent = unlocked ? "Desbloqueada" : "Bloqueada";
  });
}

function renderDashboard() {
  renderProgress();
  renderMedals();
  renderDayHistory();
}

function setSaveSessionLoading(isLoading) {
  if (!saveSessionButton) return;

  saveSessionButton.disabled = isLoading;
  saveSessionButton.textContent = isLoading ? "Salvando..." : "Salvar sessão";
}

if (menuToggle) {
  menuToggle.addEventListener("click", toggleMenu);
}

if (menuPanel) {
  menuPanel.addEventListener("click", (event) => {
    if (!event.target.closest(".menu-nav")) {
      closeMenu();
    }
  });
}

stateButtons.forEach((button) => {
  button.addEventListener("click", () => {
    setSelectedState(button.dataset.state);
  });
});

durationButtons.forEach((button) => {
  button.addEventListener("click", () => {
    if (button.disabled) return;

    const value = button.dataset.duration;

    if (value === "extra") {
      if (selectedState !== "focado") return;

      if (extraMinutesBox) extraMinutesBox.classList.add("is-visible");

      if (extraMinutesInput) {
        if (!extraMinutesInput.value || Number(extraMinutesInput.value) <= 20) {
          extraMinutesInput.value = "25";
        }

        selectedDuration = Number(extraMinutesInput.value);
        extraMinutesInput.focus();
      }

      updateDurationButtons();
      updateSessionHelper();
      return;
    }

    selectedDuration = Number(value);

    if (extraMinutesBox) extraMinutesBox.classList.remove("is-visible");
    if (extraMinutesInput) extraMinutesInput.value = "";

    updateDurationButtons();
    updateSessionHelper();
  });
});

if (extraMinutesInput) {
  extraMinutesInput.addEventListener("input", () => {
    const value = Number(extraMinutesInput.value);

    if (value > 20) {
      selectedDuration = value;
    }

    updateDurationButtons();
    updateSessionHelper();
  });
}

if (startSessionButton) {
  startSessionButton.addEventListener("click", openSessionModal);
}

closeSessionModalButtons.forEach((button) => {
  button.addEventListener("click", closeSessionModal);
});

if (modalBackdrop) {
  modalBackdrop.addEventListener("click", (event) => {
    if (event.target === modalBackdrop) {
      closeSessionModal();
    }
  });
}

if (saveSessionButton) {
  saveSessionButton.addEventListener("click", async () => {
    const minutes = getMinutesToSave();

    if (!minutes || (minutes <= 20 && extraMinutesBox?.classList.contains("is-visible"))) {
      alert("Para Horas extras, digite um valor acima de 20 minutos.");
      return;
    }

    const now = new Date();
    const nextSession = createSessionRecord(
      now,
      minutes,
      selectedState,
      now.getHours(),
      now.getMinutes()
    );

    setSaveSessionLoading(true);

    try {
      await window.Start5Auth?.ready;
      await window.Start5Auth.apiRequest("/api/sessions", {
        method: "POST",
        body: nextSession,
      });
      await loadSessionsFromApi();
      renderDashboard();
      closeSessionModal();
    } catch (error) {
      console.error("Erro ao salvar sessão:", error);
      alert("Não foi possível salvar sua sessão agora.");
    } finally {
      setSaveSessionLoading(false);
    }
  });
}

document.addEventListener("keydown", (event) => {
  if (event.key !== "Escape") return;

  if (modalBackdrop?.classList.contains("is-visible")) {
    closeSessionModal();
    return;
  }

  if (body.classList.contains("menu-open")) {
    closeMenu();
  }
});

async function initializeApp() {
  try {
    await window.Start5Auth?.ready;
    await importLegacySessionsIfNeeded();
    await loadSessionsFromApi();
  } catch (error) {
    console.error("Erro ao carregar sessões:", error);
    sessions = [];
  }

  renderDashboard();
  setSelectedState("normal");
}

initializeApp();
