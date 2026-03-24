(function initializeQuestionBankPage() {
  const state = {
    reference: null,
    overview: null,
    questions: [],
    catalog: null,
    mode: "questions",
    sessionMode: "practice",
    selectedProofId: 0,
    selectedQuestionId: 0,
    selectedCatalogKey: "",
    selectedCatalogDocumentKind: "prova",
    activeProofSession: null,
    questionDetail: null,
    selectedAnswer: "",
    draftAnswers: {},
    sessionOutcome: null,
    lastResult: null,
    isLoadingList: false,
    isLoadingQuestion: false,
    isSubmittingAnswer: false,
    isSubmittingSession: false,
  };

  const questionBankHeroPills = document.getElementById("questionBankHeroPills");
  const questionBankAvailableLabel = document.getElementById("questionBankAvailableLabel");
  const questionBankAvailableValue = document.getElementById("questionBankAvailableValue");
  const questionBankAnsweredLabel = document.getElementById("questionBankAnsweredLabel");
  const questionBankAnsweredValue = document.getElementById("questionBankAnsweredValue");
  const questionBankCorrectLabel = document.getElementById("questionBankCorrectLabel");
  const questionBankCorrectValue = document.getElementById("questionBankCorrectValue");
  const questionBankWrongLabel = document.getElementById("questionBankWrongLabel");
  const questionBankWrongValue = document.getElementById("questionBankWrongValue");
  const questionBankAccuracyLabel = document.getElementById("questionBankAccuracyLabel");
  const questionBankAccuracyValue = document.getElementById("questionBankAccuracyValue");
  const questionBankReviewLabel = document.getElementById("questionBankReviewLabel");
  const questionBankReviewValue = document.getElementById("questionBankReviewValue");

  const questionBankFilterForm = document.getElementById("questionBankFilterForm");
  const questionBankVestibularFilter = document.getElementById("questionBankVestibularFilter");
  const questionBankYearFilter = document.getElementById("questionBankYearFilter");
  const questionBankMatterFilter = document.getElementById("questionBankMatterFilter");
  const questionBankDifficultyFilter = document.getElementById("questionBankDifficultyFilter");
  const questionBankDayFilter = document.getElementById("questionBankDayFilter");
  const questionBankBookletFilter = document.getElementById("questionBankBookletFilter");
  const questionBankStatusFilter = document.getElementById("questionBankStatusFilter");
  const questionBankSearchButton = document.getElementById("questionBankSearchButton");
  const questionBankResetButton = document.getElementById("questionBankResetButton");
  const questionBankPageFeedback = document.getElementById("questionBankPageFeedback");

  const questionBankStudyStack = document.getElementById("questionBankStudyStack");

  const questionBankProofTitle = document.getElementById("questionBankProofTitle");
  const questionBankProofCaption = document.getElementById("questionBankProofCaption");
  const questionBankProofActions = document.getElementById("questionBankProofActions");
  const questionBankProofFrame = document.getElementById("questionBankProofFrame");

  const questionBankJumpForm = document.getElementById("questionBankJumpForm");
  const questionBankQuestionNumberInput = document.getElementById("questionBankQuestionNumberInput");
  const questionBankJumpButton = document.getElementById("questionBankJumpButton");
  const questionBankPrevButton = document.getElementById("questionBankPrevButton");
  const questionBankNextButton = document.getElementById("questionBankNextButton");
  const questionBankQuestionMeta = document.getElementById("questionBankQuestionMeta");
  const questionBankModeSwitch = document.getElementById("questionBankModeSwitch");
  const questionBankProgressCopy = document.getElementById("questionBankProgressCopy");
  const questionBankSessionStatus = document.getElementById("questionBankSessionStatus");
  const questionBankNumberRail = document.getElementById("questionBankNumberRail");
  const questionBankSessionResult = document.getElementById("questionBankSessionResult");
  const questionBankWorkspace = document.getElementById("questionBankWorkspace");

  const SESSION_MODE_STORAGE_KEY = "start5:question-bank:mode";

  function escapeHtml(value) {
    return String(value || "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#39;");
  }

  function titleCase(value) {
    return String(value || "")
      .split(/[\s_-]+/g)
      .filter(Boolean)
      .map((item) => item.charAt(0).toUpperCase() + item.slice(1))
      .join(" ");
  }

  function formatLabel(value, fallback = "Sem dado") {
    const normalized = String(value || "").trim();

    if (!normalized) {
      return fallback;
    }

    const lookup = {
      facil: "Facil",
      media: "Media",
      dificil: "Dificil",
      unanswered: "Nao resolvidas",
      wrong: "Erradas",
      favorites: "Favoritas",
      review: "Revisar depois",
      all: "Todas",
      ready: "Pronta",
      missing: "Pendente",
      review_pending: "Em revisao",
    };

    return lookup[normalized] || titleCase(normalized);
  }

  function isCatalogMode() {
    return Boolean(state.catalog?.active);
  }

  function formatDate(value) {
    if (!value) {
      return "Sem data";
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return "Sem data";
    }

    return date.toLocaleString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  function joinInline(parts) {
    return (Array.isArray(parts) ? parts : [])
      .map((part) => String(part || "").trim())
      .filter(Boolean)
      .join(" - ");
  }

  function readStoredJson(key) {
    try {
      const value = window.localStorage.getItem(key);
      return value ? JSON.parse(value) : null;
    } catch {
      return null;
    }
  }

  function writeStoredJson(key, value) {
    try {
      window.localStorage.setItem(key, JSON.stringify(value));
    } catch {
      // Mantem a sessao funcional mesmo sem persistencia local.
    }
  }

  function removeStoredJson(key) {
    try {
      window.localStorage.removeItem(key);
    } catch {
      // Sem impacto para o fluxo principal.
    }
  }

  function getCurrentUserId() {
    return String(window.Start5Auth?.getSession?.()?.id || "anon");
  }

  function getDraftStorageKey(proofId) {
    const normalizedProofId = Number(proofId) || 0;
    return `start5:question-bank:draft:${getCurrentUserId()}:${normalizedProofId}`;
  }

  function loadStoredSessionMode() {
    if (!questionBankModeSwitch) {
      return "practice";
    }

    try {
      const storedMode = String(window.localStorage.getItem(SESSION_MODE_STORAGE_KEY) || "").trim().toLowerCase();
      return storedMode === "simulado" ? "simulado" : "practice";
    } catch {
      return "practice";
    }
  }

  function persistSessionMode() {
    try {
      window.localStorage.setItem(SESSION_MODE_STORAGE_KEY, state.sessionMode);
    } catch {
      // Sem impacto para o fluxo principal.
    }
  }

  function getActiveQuestionSession() {
    if (
      state.activeProofSession &&
      Number(state.activeProofSession.proofId || 0) === Number(state.selectedProofId || 0)
    ) {
      return state.activeProofSession;
    }

    return getQuestionSessions().find((session) => Number(session.proofId) === Number(state.selectedProofId)) || null;
  }

  function restoreDraftForProof(proofId, sessionQuestions = []) {
    const storedDraft = readStoredJson(getDraftStorageKey(proofId)) || {};
    const validIds = new Set(
      (Array.isArray(sessionQuestions) ? sessionQuestions : [])
        .map((question) => Number(question.id) || 0)
        .filter((value) => value > 0)
    );
    const answers = {};

    Object.entries(storedDraft.answers || {}).forEach(([questionId, answer]) => {
      const normalizedQuestionId = Number(questionId) || 0;

      if (!validIds.size || validIds.has(normalizedQuestionId)) {
        answers[normalizedQuestionId] = String(answer || "");
      }
    });

    state.draftAnswers = answers;
    state.sessionOutcome = storedDraft.outcome || null;

    if (storedDraft.mode === "simulado" || storedDraft.mode === "practice") {
      state.sessionMode = storedDraft.mode;
      persistSessionMode();
    }
  }

  function persistDraftForCurrentProof() {
    const proofId = Number(state.selectedProofId) || 0;

    if (!proofId || isCatalogMode()) {
      return;
    }

    const hasAnswers = Object.values(state.draftAnswers).some(Boolean);
    const hasOutcome = Boolean(state.sessionOutcome);

    if (!hasAnswers && !hasOutcome) {
      removeStoredJson(getDraftStorageKey(proofId));
      return;
    }

    writeStoredJson(getDraftStorageKey(proofId), {
      proofId,
      mode: state.sessionMode,
      answers: state.draftAnswers,
      outcome: state.sessionOutcome,
      updatedAt: new Date().toISOString(),
    });
  }

  function clearDraftForCurrentProof() {
    const proofId = Number(state.selectedProofId) || 0;

    if (proofId) {
      removeStoredJson(getDraftStorageKey(proofId));
    }

    state.draftAnswers = {};
    state.sessionOutcome = null;
  }

  function getFilters() {
    return {
      vestibular: questionBankVestibularFilter?.value || "",
      ano: questionBankYearFilter?.value || "",
      materia: questionBankMatterFilter?.value || "",
      dificuldade: questionBankDifficultyFilter?.value || "",
      dia: questionBankDayFilter?.value || "",
      caderno: questionBankBookletFilter?.value || "",
      status: questionBankStatusFilter?.value || "all",
    };
  }

  function setPageFeedback(message, stateName = "") {
    if (!questionBankPageFeedback) {
      return;
    }

    questionBankPageFeedback.textContent = message || "";
    questionBankPageFeedback.dataset.state = stateName;
  }

  function buildQueryString(filters) {
    const searchParams = new URLSearchParams();

    Object.entries(filters || {}).forEach(([key, value]) => {
      if (value) {
        searchParams.set(key, value);
      }
    });

    return searchParams.toString();
  }

  function populateSelect(select, options, currentValue, emptyLabel) {
    if (!select) {
      return;
    }

    const normalizedOptions = Array.isArray(options) ? options : [];
    const optionMarkup = [`<option value="">${escapeHtml(emptyLabel)}</option>`];

    normalizedOptions.forEach((option) => {
      if (option && typeof option === "object") {
        const optionValue = String(option.value ?? option.id ?? "");
        const optionLabel = String(
          option.label ??
          (option.sigla && option.nome ? `${option.sigla} - ${option.nome}` : option.nome ?? option.value ?? "")
        );

        optionMarkup.push(
          `<option value="${escapeHtml(optionValue)}">${escapeHtml(optionLabel)}</option>`
        );
        return;
      }

      optionMarkup.push(
        `<option value="${escapeHtml(String(option || ""))}">${escapeHtml(formatLabel(option, String(option || "")))}</option>`
      );
    });

    select.innerHTML = optionMarkup.join("");

    if (currentValue && [...select.options].some((option) => option.value === currentValue)) {
      select.value = currentValue;
    }
  }

  function syncFilterMode() {
    const catalogMode = isCatalogMode();

    if (questionBankMatterFilter) {
      if (catalogMode) {
        questionBankMatterFilter.value = "";
      }
      questionBankMatterFilter.disabled = catalogMode;
    }

    if (questionBankDifficultyFilter) {
      if (catalogMode) {
        questionBankDifficultyFilter.value = "";
      }
      questionBankDifficultyFilter.disabled = catalogMode;
    }

    if (questionBankStatusFilter) {
      if (catalogMode) {
        questionBankStatusFilter.value = "all";
      }
      questionBankStatusFilter.disabled = catalogMode;
    }

    if (questionBankDayFilter) {
      questionBankDayFilter.disabled = !catalogMode;
    }

    if (questionBankBookletFilter) {
      questionBankBookletFilter.disabled = !catalogMode;
    }

    if (questionBankSearchButton) {
      if (state.isLoadingList) {
        questionBankSearchButton.textContent = catalogMode ? "Montando..." : "Buscando...";
      } else {
        questionBankSearchButton.textContent = catalogMode ? "Montar sessao" : "Buscar questoes";
      }
    }
  }

  function getCatalogSessionByKey(sessionKey) {
    const sessions = Array.isArray(state.catalog?.sessions) ? state.catalog.sessions : [];
    return sessions.find((session) => String(session.key || "") === String(sessionKey || "")) || null;
  }

  function getQuestionStatus(question) {
    const draftAnswer = state.draftAnswers?.[Number(question?.id) || 0] || "";
    const outcomeResult = state.sessionOutcome?.resultsByQuestionId?.[Number(question?.id) || 0] || null;

    if (outcomeResult) {
      return outcomeResult.acertou
        ? { label: "Acertou", state: "correct" }
        : { label: "Errou", state: "wrong" };
    }

    if (state.sessionMode === "simulado" && draftAnswer) {
      return { label: "Respondida", state: "answered" };
    }

    if (question?.user?.lastAttemptCorrect === true) {
      return { label: "Acertou", state: "correct" };
    }

    if (question?.user?.lastAttemptCorrect === false) {
      return { label: "Errou", state: "wrong" };
    }

    if (question?.user?.reviewLater) {
      return { label: "Revisar", state: "review" };
    }

    if (question?.user?.answered || draftAnswer) {
      return { label: "Respondida", state: "answered" };
    }

    return { label: "Nova", state: "" };
  }

  function buildQuestionSessions(list = state.questions) {
    const sessionsByProofId = new Map();

    (Array.isArray(list) ? list : []).forEach((question) => {
      const proofId = Number(question.provaId || question.prova?.id || 0);

      if (!proofId) {
        return;
      }

      let session = sessionsByProofId.get(proofId);

      if (!session) {
        session = {
          proofId,
          vestibularSigla: String(question.vestibular?.sigla || ""),
          vestibularNome: String(question.vestibular?.nome || ""),
          ano: Number(question.prova?.ano) || 0,
          fase: String(question.prova?.fase || ""),
          versao: String(question.prova?.versao || ""),
          pdfViewerUrl: String(question.prova?.pdfViewerUrl || ""),
          pdfOriginalName: String(question.prova?.pdfOriginalName || ""),
          questions: [],
          totalQuestions: 0,
          answeredCount: 0,
          correctCount: 0,
          wrongCount: 0,
          accuracyPercentage: 0,
        };

        sessionsByProofId.set(proofId, session);
      }

      session.questions.push(question);

      if (!session.pdfViewerUrl && question.prova?.pdfViewerUrl) {
        session.pdfViewerUrl = String(question.prova.pdfViewerUrl || "");
      }

      if (!session.pdfOriginalName && question.prova?.pdfOriginalName) {
        session.pdfOriginalName = String(question.prova.pdfOriginalName || "");
      }
    });

    return [...sessionsByProofId.values()]
      .map((session) => {
        session.questions.sort((left, right) => {
          const leftNumber = Number(left.numero) || 0;
          const rightNumber = Number(right.numero) || 0;

          if (leftNumber !== rightNumber) {
            return leftNumber - rightNumber;
          }

          return (Number(left.id) || 0) - (Number(right.id) || 0);
        });

        session.totalQuestions = session.questions.length;
        session.answeredCount = session.questions.filter((question) => Boolean(question.user?.answered)).length;
        session.correctCount = session.questions.filter((question) => question.user?.lastAttemptCorrect === true).length;
        session.wrongCount = session.questions.filter((question) => question.user?.lastAttemptCorrect === false).length;
        session.accuracyPercentage = session.answeredCount
          ? Math.round((session.correctCount / session.answeredCount) * 100)
          : 0;
        session.questionNumbers = session.questions
          .map((question) => Number(question.numero) || 0)
          .filter((value) => value > 0);

        return session;
      })
      .sort((left, right) => {
        if (left.ano !== right.ano) {
          return right.ano - left.ano;
        }

        return left.proofId - right.proofId;
      });
  }

  function getQuestionSessions() {
    return buildQuestionSessions(state.questions);
  }

  function getActiveQuestionIndex() {
    const session = getActiveQuestionSession();

    if (!session) {
      return -1;
    }

    return session.questions.findIndex((question) => Number(question.id) === Number(state.selectedQuestionId));
  }

  function getRelativeQuestionId(offset) {
    const session = getActiveQuestionSession();

    if (!session) {
      return 0;
    }

    const currentIndex = getActiveQuestionIndex();

    if (currentIndex === -1) {
      return Number(session.questions[0]?.id) || 0;
    }

    return Number(session.questions[currentIndex + offset]?.id) || 0;
  }

  function getQuestionIdByNumber(questionNumber) {
    const session = getActiveQuestionSession();

    if (!session) {
      return 0;
    }

    const normalizedNumber = Number(questionNumber) || 0;
    const question = session.questions.find((item) => Number(item.numero) === normalizedNumber);
    return Number(question?.id) || 0;
  }

  function getDefaultCatalogDocumentKind(session) {
    if (session?.proof?.viewerUrl) {
      return "prova";
    }

    if (session?.answerKey?.viewerUrl) {
      return "gabarito";
    }

    return "prova";
  }

  function getActiveCatalogDocument(session) {
    const preferredKind = state.selectedCatalogDocumentKind === "gabarito" ? "gabarito" : "prova";

    if (preferredKind === "gabarito" && session?.answerKey?.viewerUrl) {
      return {
        kind: "gabarito",
        label: "Gabarito",
        url: String(session.answerKey.viewerUrl || ""),
        originalName: String(session.answerKey.nomeOriginal || ""),
      };
    }

    if (session?.proof?.viewerUrl) {
      return {
        kind: "prova",
        label: "Prova",
        url: String(session.proof.viewerUrl || ""),
        originalName: String(session.proof.nomeOriginal || ""),
      };
    }

    if (session?.answerKey?.viewerUrl) {
      return {
        kind: "gabarito",
        label: "Gabarito",
        url: String(session.answerKey.viewerUrl || ""),
        originalName: String(session.answerKey.nomeOriginal || ""),
      };
    }

    return {
      kind: preferredKind,
      label: preferredKind === "gabarito" ? "Gabarito" : "Prova",
      url: "",
      originalName: "",
    };
  }

  function buildQuestionSessionTitle(session) {
    return [session?.vestibularSigla, session?.ano].filter(Boolean).join(" ");
  }

  function buildQuestionSessionSubtitle(session) {
    const parts = [];

    if (session?.fase) {
      parts.push(session.fase);
    }

    if (session?.versao) {
      parts.push(session.versao);
    }

    if (!parts.length && session?.totalQuestions) {
      parts.push(`${session.totalQuestions} questoes`);
    }

    return joinInline(parts);
  }

  function buildCatalogSessionOptionLabel(session) {
    return joinInline([
      `${session?.vestibular || ""} ${session?.ano || ""}`.trim(),
      session?.dia ? `Dia ${session.dia}` : "",
      session?.caderno || "",
    ]);
  }

  function buildQuestionSessionOptionLabel(session) {
    return joinInline([
      buildQuestionSessionTitle(session),
      buildQuestionSessionSubtitle(session),
    ]);
  }

  function getPdfFrameUrl(url) {
    const normalizedUrl = String(url || "").trim();

    if (!normalizedUrl) {
      return "";
    }

    return normalizedUrl.includes("#")
      ? normalizedUrl
      : `${normalizedUrl}#toolbar=0&navpanes=0&scrollbar=1&view=FitH`;
  }

  function updateStudyStackVisibility() {
    if (!questionBankStudyStack) {
      return;
    }

    if (state.isLoadingList) {
      questionBankStudyStack.hidden = false;
      return;
    }

    if (isCatalogMode()) {
      questionBankStudyStack.hidden = !getCatalogSessionByKey(state.selectedCatalogKey);
      return;
    }

    questionBankStudyStack.hidden = !getQuestionSessions().length;
  }

  function updateModeSwitchUI() {
    const buttons = [...(questionBankModeSwitch?.querySelectorAll("[data-session-mode]") || [])];

    buttons.forEach((button) => {
      const isActive = String(button.dataset.sessionMode || "") === state.sessionMode;
      button.classList.toggle("is-active", isActive);
      button.setAttribute("aria-selected", String(isActive));
    });
  }

  function setSessionMode(nextMode) {
    state.sessionMode = nextMode === "simulado" ? "simulado" : "practice";
    persistSessionMode();
    state.lastResult = state.sessionMode === "simulado" ? null : state.lastResult;
    updateModeSwitchUI();
    renderQuestionNavigator();
    renderWorkspace();
  }

  function getSessionDraftAnsweredCount(session) {
    if (!session) {
      return 0;
    }

    return session.questions.filter((question) => Boolean(state.draftAnswers?.[Number(question.id) || 0])).length;
  }

  function hasSessionCorrectionAvailable(session) {
    return Boolean(session?.questions?.length);
  }

  async function loadProofSession(proofId) {
    const normalizedProofId = Number(proofId) || 0;

    if (!normalizedProofId || isCatalogMode()) {
      state.activeProofSession = null;
      state.draftAnswers = {};
      state.sessionOutcome = null;
      return null;
    }

    const filters = getFilters();
    const searchParams = new URLSearchParams({
      prova: String(normalizedProofId),
      limit: "200",
    });

    ["vestibular", "ano", "materia", "dificuldade", "status"].forEach((key) => {
      const value = String(filters[key] || "").trim();

      if (value && !(key === "status" && value === "all")) {
        searchParams.set(key, value);
      }
    });

    const response = await window.Start5Auth.apiRequest(`/api/question-bank/questions?${searchParams.toString()}`);
    const proofQuestions = Array.isArray(response.questions) ? response.questions : [];
    const nextSession = buildQuestionSessions(proofQuestions)[0] || null;

    state.activeProofSession = nextSession;

    if (nextSession) {
      restoreDraftForProof(normalizedProofId, nextSession.questions);
    } else {
      state.draftAnswers = {};
      state.sessionOutcome = null;
    }

    return nextSession;
  }

  function renderSessionStatusCards() {
    if (!questionBankSessionStatus) {
      return;
    }

    if (isCatalogMode()) {
      const catalogSession = getCatalogSessionByKey(state.selectedCatalogKey);

      if (!catalogSession) {
        questionBankSessionStatus.innerHTML = '<div class="question-bank-empty">Abra uma prova para ver o status.</div>';
        return;
      }

      questionBankSessionStatus.innerHTML = `
        <article class="question-bank-status-card">
          <strong>${escapeHtml(catalogSession.statusLabel)}</strong>
          <span>${escapeHtml(catalogSession.hasProof ? "Prova pronta." : "Sem arquivo principal.")}</span>
        </article>
        <article class="question-bank-status-card">
          <strong>${escapeHtml(catalogSession.hasAnswerKey ? "Gabarito disponivel" : "Sem gabarito" )}</strong>
          <span>${escapeHtml(catalogSession.hasAnswerKey ? "Correcao disponivel." : "Correcao ainda indisponivel.")}</span>
        </article>
        <article class="question-bank-status-card">
          <strong>Resolucao pendente</strong>
          <span>Publique as questoes para responder aqui.</span>
        </article>
      `;
      return;
    }

    const session = getActiveQuestionSession();

    if (!session) {
      questionBankSessionStatus.innerHTML = '<div class="question-bank-empty">Abra uma prova para ver o status.</div>';
      return;
    }

    const draftAnsweredCount = getSessionDraftAnsweredCount(session);
    const finalizedSummary = state.sessionOutcome?.summary || null;
    const answeredCount = state.sessionMode === "simulado"
      ? Math.max(draftAnsweredCount, Number(finalizedSummary?.answeredCount || 0))
      : session.answeredCount;
    const accuracyText = state.sessionMode === "simulado"
      ? finalizedSummary
        ? `${finalizedSummary.accuracyPercentage || 0}% no ultimo simulado`
        : `${draftAnsweredCount} marcada(s)`
      : `${session.accuracyPercentage}% de acerto`;

    questionBankSessionStatus.innerHTML = `
      <article class="question-bank-status-card">
        <strong>${escapeHtml(state.sessionMode === "simulado" ? "Simulado" : "Pratica")}</strong>
        <span>${escapeHtml(state.sessionMode === "simulado" ? "Corrige no final." : "Corrige na hora.")}</span>
      </article>
      <article class="question-bank-status-card">
        <strong>${escapeHtml(String(answeredCount || 0))} / ${escapeHtml(String(session.totalQuestions || 0))}</strong>
        <span>Andamento da prova.</span>
      </article>
      <article class="question-bank-status-card">
        <strong>${escapeHtml(accuracyText)}</strong>
        <span>${escapeHtml(hasSessionCorrectionAvailable(session) ? "Correcao ativa." : "Sem gabarito cadastrado.")}</span>
      </article>
    `;
  }

  function renderQuestionNumberRail() {
    if (!questionBankNumberRail) {
      return;
    }

    if (isCatalogMode()) {
      questionBankNumberRail.innerHTML = '<div class="question-bank-empty">A numeracao aparece aqui quando a prova for publicada.</div>';
      return;
    }

    const session = getActiveQuestionSession();

    if (!session || !session.questions.length) {
      questionBankNumberRail.innerHTML = '<div class="question-bank-empty">Os numeros aparecem aqui.</div>';
      return;
    }

    questionBankNumberRail.innerHTML = session.questions.map((question) => {
      const status = getQuestionStatus(question);
      const isCurrent = Number(question.id) === Number(state.selectedQuestionId);

      return `
        <button
          type="button"
          class="question-bank-number-button ${isCurrent ? "is-current" : ""}"
          data-question-number-id="${Number(question.id) || 0}"
          data-state="${escapeHtml(status.state)}"
          aria-label="${escapeHtml(`Questao ${question.numero} - ${status.label}`)}"
        >
          ${escapeHtml(String(question.numero || "?"))}
        </button>
      `;
    }).join("");
  }

  function renderSessionResult() {
    if (!questionBankSessionResult) {
      return;
    }

    if (!state.sessionOutcome) {
      questionBankSessionResult.hidden = true;
      questionBankSessionResult.innerHTML = "";
      return;
    }

    const summary = state.sessionOutcome.summary || {};

    questionBankSessionResult.hidden = false;
    questionBankSessionResult.innerHTML = `
      <div class="question-bank-panel-head">
        <div>
          <p class="section-label">Resultado</p>
          <h3 class="analysis-title">Resumo</h3>
        </div>
        <p class="question-bank-proof-caption">${escapeHtml(state.sessionOutcome.mode === "simulado" ? "Ultimo simulado corrigido." : "Ultima verificacao.")}</p>
      </div>
      <div class="question-bank-session-result-grid">
        <article class="question-bank-session-result-card"><span>Acertos</span><strong>${escapeHtml(String(summary.correctCount || 0))}</strong></article>
        <article class="question-bank-session-result-card"><span>Erros</span><strong>${escapeHtml(String(summary.wrongCount || 0))}</strong></article>
        <article class="question-bank-session-result-card"><span>Percentual</span><strong>${escapeHtml(String(summary.accuracyPercentage || 0))}%</strong></article>
        <article class="question-bank-session-result-card"><span>Melhor materia</span><strong>${escapeHtml(summary.bestSubject || "Sem leitura")}</strong></article>
      </div>
    `;
  }

  function renderSessionProgressCopy() {
    if (!questionBankProgressCopy) {
      return;
    }

    if (isCatalogMode()) {
      questionBankProgressCopy.textContent = "A resolucao aparece aqui quando a prova entrar no banco.";
      return;
    }

    const session = getActiveQuestionSession();

    if (!session) {
      questionBankProgressCopy.textContent = "Progresso salvo automaticamente.";
      return;
    }

    const draftAnsweredCount = getSessionDraftAnsweredCount(session);

    if (state.sessionMode === "simulado") {
      if (state.sessionOutcome?.summary) {
        questionBankProgressCopy.textContent = `${state.sessionOutcome.summary.correctCount || 0} acerto(s) e ${state.sessionOutcome.summary.wrongCount || 0} erro(s) no ultimo simulado.`;
        return;
      }

      questionBankProgressCopy.textContent = draftAnsweredCount
        ? `${draftAnsweredCount} resposta(s) salvas no simulado.`
        : "Marque e finalize para corrigir.";
      return;
    }

    questionBankProgressCopy.textContent = session.answeredCount
      ? `${session.answeredCount} questao(oes) ja corrigidas nesta prova.`
      : "Corrija cada questao na hora.";
  }

  function renderSummary() {
    if (isCatalogMode()) {
      const summary = state.catalog?.summary || {};

      if (questionBankAvailableLabel) questionBankAvailableLabel.textContent = "Sessoes";
      if (questionBankAnsweredLabel) questionBankAnsweredLabel.textContent = "Prontas";
      if (questionBankCorrectLabel) questionBankCorrectLabel.textContent = "Pendentes";
      if (questionBankWrongLabel) questionBankWrongLabel.textContent = "Sem prova";
      if (questionBankAccuracyLabel) questionBankAccuracyLabel.textContent = "Sem gabarito";
      if (questionBankReviewLabel) questionBankReviewLabel.textContent = "Revisao";

      if (questionBankAvailableValue) questionBankAvailableValue.textContent = String(summary.totalSessions || 0);
      if (questionBankAnsweredValue) questionBankAnsweredValue.textContent = String(summary.readySessions || 0);
      if (questionBankCorrectValue) questionBankCorrectValue.textContent = String(summary.reviewSessions || 0);
      if (questionBankWrongValue) questionBankWrongValue.textContent = String(summary.missingProofSessions || 0);
      if (questionBankAccuracyValue) questionBankAccuracyValue.textContent = String(summary.missingAnswerKeySessions || 0);
      if (questionBankReviewValue) {
        questionBankReviewValue.textContent = String(
          (summary.reviewSessions || 0) + (summary.missingProofSessions || 0) + (summary.missingAnswerKeySessions || 0)
        );
      }

      return;
    }

    const overview = state.overview || {};

    if (questionBankAvailableLabel) questionBankAvailableLabel.textContent = "Disponiveis";
    if (questionBankAnsweredLabel) questionBankAnsweredLabel.textContent = "Respondidas";
    if (questionBankCorrectLabel) questionBankCorrectLabel.textContent = "Acertos";
    if (questionBankWrongLabel) questionBankWrongLabel.textContent = "Erros";
    if (questionBankAccuracyLabel) questionBankAccuracyLabel.textContent = "Taxa de acerto";
    if (questionBankReviewLabel) questionBankReviewLabel.textContent = "Para revisar";

    if (questionBankAvailableValue) questionBankAvailableValue.textContent = String(overview.totalAvailable || 0);
    if (questionBankAnsweredValue) questionBankAnsweredValue.textContent = String(overview.answeredQuestions || 0);
    if (questionBankCorrectValue) questionBankCorrectValue.textContent = String(overview.correctQuestions || 0);
    if (questionBankWrongValue) questionBankWrongValue.textContent = String(overview.wrongQuestions || 0);
    if (questionBankAccuracyValue) questionBankAccuracyValue.textContent = `${Math.round((overview.accuracyRate || 0) * 100)}%`;
    if (questionBankReviewValue) questionBankReviewValue.textContent = String(overview.reviewQuestions || 0);
  }

  function renderHeroPills() {
    if (!questionBankHeroPills) {
      return;
    }

    const filters = getFilters();
    const activeFilters = [
      filters.vestibular ? "Vestibular" : "",
      filters.ano ? `Ano ${filters.ano}` : "",
      filters.dia ? `Dia ${filters.dia}` : "",
      filters.caderno ? filters.caderno : "",
      !isCatalogMode() && filters.materia ? formatLabel(filters.materia) : "",
      !isCatalogMode() && filters.dificuldade ? formatLabel(filters.dificuldade) : "",
      !isCatalogMode() && filters.status && filters.status !== "all" ? formatLabel(filters.status) : "",
    ].filter(Boolean);

    if (isCatalogMode()) {
      const summary = state.catalog?.summary || {};

      questionBankHeroPills.innerHTML = [
        `<span class="analytics-pill">${escapeHtml(String(summary.totalSessions || 0))} sessoes</span>`,
        `<span class="analytics-pill analytics-pill-muted">${escapeHtml(String(summary.readySessions || 0))} prontas</span>`,
        activeFilters.length
          ? `<span class="analytics-pill analytics-pill-muted">${escapeHtml(activeFilters.join(" / "))}</span>`
          : '<span class="analytics-pill analytics-pill-muted">Filtro por ano, dia e caderno</span>',
      ].join("");
      return;
    }

    const overview = state.overview || {};

    questionBankHeroPills.innerHTML = [
      `<span class="analytics-pill">${escapeHtml(String(overview.totalAvailable || 0))} questoes</span>`,
      `<span class="analytics-pill analytics-pill-muted">${escapeHtml(String(overview.favoriteQuestions || 0))} favoritas</span>`,
      activeFilters.length
        ? `<span class="analytics-pill analytics-pill-muted">${escapeHtml(activeFilters.join(" / "))}</span>`
        : '<span class="analytics-pill analytics-pill-muted">Sem filtros extras</span>',
    ].join("");
  }

  function renderFilters() {
    const filters = getFilters();
    const catalogMode = isCatalogMode();
    const catalogReference = state.catalog?.reference || {};

    populateSelect(
      questionBankVestibularFilter,
      catalogMode ? (catalogReference.vestibulares || []) : (state.reference?.vestibulares || []),
      filters.vestibular,
      "Todos"
    );
    populateSelect(
      questionBankYearFilter,
      catalogMode ? (catalogReference.anos || []) : (state.reference?.anos || []),
      filters.ano,
      "Todos"
    );
    populateSelect(
      questionBankMatterFilter,
      state.reference?.materias || [],
      filters.materia,
      "Todas"
    );
    populateSelect(
      questionBankDayFilter,
      catalogMode ? (catalogReference.dias || []) : [],
      filters.dia,
      "Todos"
    );
    populateSelect(
      questionBankBookletFilter,
      catalogMode ? (catalogReference.cadernos || []) : [],
      filters.caderno,
      "Todos"
    );

    syncFilterMode();
  }

  function renderSessionRail() {
    updateStudyStackVisibility();
  }

  function renderProofPanel() {
    if (!questionBankProofTitle || !questionBankProofCaption || !questionBankProofActions || !questionBankProofFrame) {
      return;
    }

    if (state.isLoadingList) {
      questionBankProofTitle.textContent = "Montando sua sessao";
      questionBankProofCaption.textContent = "Preparando PDF.";
      questionBankProofActions.innerHTML = "";
      questionBankProofFrame.innerHTML = '<div class="question-bank-proof-empty">Carregando a prova...</div>';
      return;
    }

    if (isCatalogMode()) {
      const sessions = Array.isArray(state.catalog?.sessions) ? state.catalog.sessions : [];
      const session = getCatalogSessionByKey(state.selectedCatalogKey);

      if (!session) {
        questionBankProofTitle.textContent = "Nenhuma prova encontrada";
        questionBankProofCaption.textContent = "Ajuste os filtros para carregar uma prova.";
        questionBankProofActions.innerHTML = "";
        questionBankProofFrame.innerHTML = '<div class="question-bank-proof-empty">Nao encontrado!</div>';
        return;
      }

      const activeDocument = getActiveCatalogDocument(session);
      const activeUrl = getPdfFrameUrl(activeDocument.url);

      questionBankProofTitle.textContent = joinInline([`${session.vestibular} ${session.ano}`, `Dia ${session.dia}`, session.caderno]);
      questionBankProofCaption.textContent = activeDocument.url
        ? joinInline([activeDocument.label, session.caderno])
        : "PDF indisponivel nesta sessao.";

      questionBankProofActions.innerHTML = [
        sessions.length > 1
          ? `
            <label class="question-bank-proof-picker">
              <span class="question-bank-label">Prova</span>
              <select class="admin-modal-input" data-proof-picker="catalog">
                ${sessions.map((entry) => `
                  <option value="${escapeHtml(String(entry.key || ""))}" ${String(entry.key || "") === String(state.selectedCatalogKey || "") ? "selected" : ""}>
                    ${escapeHtml(buildCatalogSessionOptionLabel(entry))}
                  </option>
                `).join("")}
              </select>
            </label>
          `
          : "",
        session.proof?.viewerUrl
          ? `<button type="button" class="question-bank-document-button ${state.selectedCatalogDocumentKind === "prova" ? "is-active" : ""}" data-document-kind="prova">Ver prova</button>`
          : "",
        session.answerKey?.viewerUrl
          ? `<button type="button" class="question-bank-document-button ${state.selectedCatalogDocumentKind === "gabarito" ? "is-active" : ""}" data-document-kind="gabarito">Ver gabarito</button>`
          : "",
        activeDocument.url
          ? `<a class="question-bank-proof-link" href="${escapeHtml(activeDocument.url)}" target="_blank" rel="noreferrer">Abrir em nova aba</a>`
          : "",
      ].filter(Boolean).join("");

      questionBankProofFrame.innerHTML = activeUrl
        ? `<iframe class="question-bank-proof-embed" src="${escapeHtml(activeUrl)}" title="${escapeHtml(activeDocument.originalName || questionBankProofTitle.textContent)}" loading="lazy"></iframe>`
        : '<div class="question-bank-proof-empty">Nenhum PDF disponivel nesta sessao.</div>';
      return;
    }

    const sessions = getQuestionSessions();
    const session = getActiveQuestionSession();

    if (!session) {
      questionBankProofTitle.textContent = "Nenhuma prova encontrada";
      questionBankProofCaption.textContent = "Ajuste os filtros para continuar.";
      questionBankProofActions.innerHTML = "";
      questionBankProofFrame.innerHTML = '<div class="question-bank-proof-empty">Nao encontrado!</div>';
      return;
    }

    const activeProofUrl = getPdfFrameUrl(state.questionDetail?.prova?.pdfViewerUrl || session.pdfViewerUrl);
    const activeProofName = String(state.questionDetail?.prova?.pdfOriginalName || session.pdfOriginalName || "");

    questionBankProofTitle.textContent = joinInline([
      buildQuestionSessionTitle(session),
      buildQuestionSessionSubtitle(session),
    ]);
    questionBankProofCaption.textContent = joinInline([
      `${session.totalQuestions} questoes`,
      session.answeredCount ? `${session.answeredCount} respondidas` : "sessao pronta",
    ]);

    questionBankProofActions.innerHTML = [
      sessions.length > 1
        ? `
          <label class="question-bank-proof-picker">
            <span class="question-bank-label">Prova</span>
            <select class="admin-modal-input" data-proof-picker="question">
              ${sessions.map((entry) => `
                <option value="${Number(entry.proofId) || 0}" ${Number(entry.proofId) === Number(state.selectedProofId) ? "selected" : ""}>
                  ${escapeHtml(buildQuestionSessionOptionLabel(entry))}
                </option>
              `).join("")}
            </select>
          </label>
        `
        : "",
      activeProofUrl
        ? `<a class="question-bank-proof-link" href="${escapeHtml(activeProofUrl)}" target="_blank" rel="noreferrer">Abrir PDF</a>`
        : '<span class="question-pill">PDF nao disponivel</span>',
    ].join("");

    questionBankProofFrame.innerHTML = activeProofUrl
      ? `<iframe class="question-bank-proof-embed" src="${escapeHtml(activeProofUrl)}" title="${escapeHtml(activeProofName || questionBankProofTitle.textContent)}" loading="lazy"></iframe>`
      : '<div class="question-bank-proof-empty">PDF ainda nao publicado para esta prova.</div>';
  }

  function renderQuestionNavigator() {
    const catalogMode = isCatalogMode();
    const session = catalogMode ? getCatalogSessionByKey(state.selectedCatalogKey) : getActiveQuestionSession();
    const hasQuestionSession = !catalogMode && Boolean(session);
    const currentIndex = hasQuestionSession ? getActiveQuestionIndex() : -1;
    const currentQuestionNumber = Number(state.questionDetail?.numero) || Number(session?.questionNumbers?.[0]) || 0;
    const draftAnsweredCount = hasQuestionSession ? getSessionDraftAnsweredCount(session) : 0;

    [...(questionBankModeSwitch?.querySelectorAll("[data-session-mode]") || [])].forEach((button) => {
      button.disabled = catalogMode;
    });
    updateModeSwitchUI();

    if (questionBankQuestionNumberInput && document.activeElement !== questionBankQuestionNumberInput) {
      questionBankQuestionNumberInput.value = hasQuestionSession && currentQuestionNumber ? String(currentQuestionNumber) : "";
    }

    if (questionBankQuestionNumberInput) {
      if (hasQuestionSession && Array.isArray(session.questionNumbers) && session.questionNumbers.length) {
        const minNumber = Math.min(...session.questionNumbers);
        const maxNumber = Math.max(...session.questionNumbers);
        questionBankQuestionNumberInput.min = String(minNumber);
        questionBankQuestionNumberInput.max = String(maxNumber);
      }

      questionBankQuestionNumberInput.disabled = !hasQuestionSession || state.isLoadingQuestion;
    }

    if (questionBankJumpButton) {
      questionBankJumpButton.disabled = !hasQuestionSession || state.isLoadingQuestion;
      questionBankJumpButton.textContent = state.isLoadingQuestion ? "Abrindo..." : "Abrir questao";
    }

    if (questionBankPrevButton) {
      questionBankPrevButton.disabled = !hasQuestionSession || state.isLoadingQuestion || currentIndex <= 0;
    }

    if (questionBankNextButton) {
      questionBankNextButton.disabled =
        !hasQuestionSession ||
        state.isLoadingQuestion ||
        currentIndex === -1 ||
        currentIndex >= ((session?.questions?.length || 0) - 1);
    }

    if (!questionBankQuestionMeta) {
      renderSessionStatusCards();
      renderQuestionNumberRail();
      renderSessionResult();
      renderSessionProgressCopy();
      return;
    }

    if (catalogMode && session) {
      questionBankQuestionMeta.textContent = "Sessao sem questoes publicadas.";
      renderSessionStatusCards();
      renderQuestionNumberRail();
      renderSessionResult();
      renderSessionProgressCopy();
      return;
    }

    if (!hasQuestionSession) {
      questionBankQuestionMeta.textContent = "Ajuste os filtros para abrir uma prova.";
      renderSessionStatusCards();
      renderQuestionNumberRail();
      renderSessionResult();
      renderSessionProgressCopy();
      return;
    }

    if (state.sessionMode === "simulado") {
      questionBankQuestionMeta.textContent = joinInline([
        currentQuestionNumber ? `Questao ${currentQuestionNumber}` : "",
        `de ${session.totalQuestions}`,
        `${draftAnsweredCount} marcada(s)`,
      ]);
      renderSessionStatusCards();
      renderQuestionNumberRail();
      renderSessionResult();
      renderSessionProgressCopy();
      return;
    }

    renderSessionStatusCards();
    renderQuestionNumberRail();
    renderSessionResult();
    renderSessionProgressCopy();

    questionBankQuestionMeta.textContent = joinInline([
      currentQuestionNumber ? `Questao ${currentQuestionNumber}` : "",
      `de ${session.totalQuestions}`,
      session.answeredCount ? `${session.answeredCount} respondidas` : "",
    ]);
  }

  function renderCatalogWorkspace() {
    if (!questionBankWorkspace) {
      return;
    }

    const session = getCatalogSessionByKey(state.selectedCatalogKey);

    if (!session) {
      questionBankWorkspace.innerHTML = '<div class="question-bank-empty">Ajuste os filtros para abrir uma prova.</div>';
      return;
    }

    const notes = Array.isArray(session.notes) ? session.notes : [];

    questionBankWorkspace.innerHTML = `
      <div class="question-workspace-shell">
        <div class="question-workspace-meta question-workspace-meta-quiet">
          <span class="question-pill">${escapeHtml(session.vestibular)}</span>
          <span class="question-pill">${escapeHtml(String(session.ano || ""))}</span>
          <span class="question-pill">${escapeHtml(`Dia ${session.dia}`)}</span>
          <span class="question-pill">${escapeHtml(session.caderno)}</span>
        </div>

        <div class="question-workspace-state question-workspace-state-soft">
          <strong class="question-workspace-feedback-title">Questoes ainda nao publicadas.</strong>
          <p class="question-workspace-copy">Use a prova aberta acima enquanto esta sessao entra no banco.</p>
        </div>

        ${notes.length ? `
          <div class="question-workspace-state question-workspace-state-soft">
            <strong class="question-workspace-feedback-title">Observacoes</strong>
            <ul class="question-session-note-list">
              ${notes.map((note) => `<li>${escapeHtml(note)}</li>`).join("")}
            </ul>
          </div>
        ` : ""}
      </div>
    `;
  }

  function renderQuestionWorkspace() {
    if (!questionBankWorkspace) {
      return;
    }

    if (state.isLoadingQuestion) {
      questionBankWorkspace.innerHTML = '<div class="question-bank-empty">Abrindo questao...</div>';
      return;
    }

    const question = state.questionDetail;

    if (!question) {
      questionBankWorkspace.innerHTML = '<div class="question-bank-empty">Abra uma prova pelos filtros para continuar.</div>';
      return;
    }

    const draftAnswer = state.draftAnswers?.[Number(question.id) || 0] || "";
    const outcomeResult = state.sessionOutcome?.resultsByQuestionId?.[Number(question.id) || 0] || null;
    const resultPayload = (state.lastResult && Number(state.lastResult.questaoId) === Number(question.id))
      ? state.lastResult
      : outcomeResult;
    const showResult = Boolean(resultPayload);
    const selectedAnswer = state.sessionMode === "simulado"
      ? (draftAnswer || state.selectedAnswer || "")
      : (state.selectedAnswer || draftAnswer || "");
    const answerButtonLabel = state.sessionMode === "simulado"
      ? "Salvar resposta"
      : "Verificar resposta";
    const feedbackTone = showResult ? (resultPayload.acertou ? "correct" : "wrong") : "";
    const feedbackMarkup = showResult ? `
      <div class="question-workspace-feedback" data-tone="${escapeHtml(feedbackTone)}">
        <strong class="question-workspace-feedback-title">${escapeHtml(resultPayload.acertou ? "Voce acertou." : "Voce errou.")}</strong>
        <p class="question-workspace-feedback-copy">
          Marcada: ${escapeHtml(resultPayload.respostaMarcada)}. Correta: ${escapeHtml(resultPayload.respostaCorreta)}.
        </p>
      </div>
    ` : "";
    const footerPills = [
      question.user?.isFavorite ? "Favorita" : "",
      question.user?.reviewLater ? "Revisar depois" : "",
      state.sessionMode === "simulado" && draftAnswer ? "Marcada no simulado" : "",
      question.stats?.totalAnswers ? `${question.stats.totalAnswers} respostas` : "",
      question.stats?.accuracyPercentage ? `${question.stats.accuracyPercentage}% acerto geral` : "",
    ].filter(Boolean);
    const footerCopy = state.sessionMode === "simulado"
      ? (draftAnswer ? "Resposta salva nesta prova." : "Marque uma alternativa para seguir.")
      : (question.user?.lastAttempt
        ? `Ultima tentativa em ${formatDate(question.user.lastAttempt.createdAt)}.`
        : "Selecione uma alternativa e verifique a resposta.");
    const footerMarkup = (footerPills.length || footerCopy) ? `
      <div class="question-workspace-state question-workspace-state-soft">
        ${footerPills.length ? `
          <div class="question-workspace-meta question-workspace-meta-quiet">
            ${footerPills.map((item) => `<span class="question-pill">${escapeHtml(item)}</span>`).join("")}
          </div>
        ` : ""}
        ${footerCopy ? `<p class="question-workspace-copy">${escapeHtml(footerCopy)}</p>` : ""}
      </div>
    ` : "";

    questionBankWorkspace.innerHTML = `
      <div class="question-workspace-shell">
        <div class="question-workspace-meta question-workspace-meta-quiet">
          <span class="question-pill">${escapeHtml(question.vestibular.sigla)} ${escapeHtml(String(question.prova.ano || ""))}</span>
          <span class="question-pill">${escapeHtml(formatLabel(question.materia, "Sem materia"))}</span>
          <span class="question-pill">${escapeHtml(formatLabel(question.dificuldade))}</span>
        </div>

        <div class="question-workspace-prompt-row">
          <span class="question-workspace-number">${escapeHtml(String(question.numero || "?"))}</span>
          <p class="question-workspace-prompt">${escapeHtml(question.enunciado || "Sem enunciado")}</p>
        </div>

        ${question.alternatives.length ? `
          <form id="questionBankAnswerForm">
            <div class="question-choice-list">
              ${question.alternatives.map((alternative) => {
                const isSelected = selectedAnswer === alternative.letra;
                const isCorrect = showResult && alternative.letra === resultPayload.respostaCorreta;
                const isWrong = showResult && alternative.letra === resultPayload.respostaMarcada && !resultPayload.acertou;
                const classes = [
                  "question-choice",
                  isSelected ? "is-selected" : "",
                  isCorrect ? "is-correct" : "",
                  isWrong ? "is-wrong" : "",
                ].filter(Boolean).join(" ");

                return `
                  <label class="${classes}">
                    <input type="radio" name="answer" value="${escapeHtml(alternative.letra)}" ${isSelected ? "checked" : ""} />
                    <span class="question-choice-letter">${escapeHtml(alternative.letra)}</span>
                    <span class="question-choice-text">${escapeHtml(alternative.texto)}</span>
                  </label>
                `;
              }).join("")}
            </div>

            <div class="question-workspace-actions">
              <button type="submit" class="modal-button modal-button-primary" ${(selectedAnswer && !state.isSubmittingAnswer && !state.isSubmittingSession) ? "" : "disabled"}>
                ${escapeHtml(
                  state.isSubmittingAnswer || state.isSubmittingSession
                    ? (state.sessionMode === "simulado" ? "Salvando..." : "Verificando...")
                    : answerButtonLabel
                )}
              </button>
              <button type="button" class="modal-button modal-button-secondary" data-toggle-favorite="true">
                ${escapeHtml(question.user?.isFavorite ? "Remover favorita" : "Favoritar")}
              </button>
              <button type="button" class="modal-button modal-button-secondary" data-toggle-review="true">
                ${escapeHtml(question.user?.reviewLater ? "Remover revisao" : "Revisar depois")}
              </button>
              ${state.sessionMode === "simulado" ? `
                <button type="button" class="modal-button modal-button-secondary" data-finalize-session="true" ${Object.values(state.draftAnswers || {}).some(Boolean) ? "" : "disabled"}>
                  Finalizar e corrigir
                </button>
              ` : ""}
            </div>
          </form>
        ` : '<div class="question-bank-empty">Alternativas ainda nao publicadas.</div>'}

        ${feedbackMarkup}
        ${footerMarkup}
      </div>
    `;
  }

  function renderWorkspace() {
    if (isCatalogMode()) {
      renderCatalogWorkspace();
      return;
    }

    renderQuestionWorkspace();
  }

  async function loadQuestionDetail(questionId) {
    if (!questionId) {
      state.selectedQuestionId = 0;
      state.questionDetail = null;
      state.selectedAnswer = "";
      state.lastResult = null;
      renderSessionRail();
      renderProofPanel();
      renderQuestionNavigator();
      renderWorkspace();
      return;
    }

    state.isLoadingQuestion = true;
    state.selectedQuestionId = Number(questionId) || 0;
    renderSessionRail();
    renderProofPanel();
    renderQuestionNavigator();
    renderWorkspace();

    try {
      const response = await window.Start5Auth.apiRequest(`/api/question-bank/questions/${questionId}`);
      state.questionDetail = response.question || null;
      state.selectedProofId = Number(state.questionDetail?.prova?.id || state.questionDetail?.provaId || state.selectedProofId) || 0;
      state.selectedAnswer =
        state.draftAnswers?.[Number(questionId) || 0] ||
        state.questionDetail?.user?.lastAttempt?.respostaMarcada ||
        "";
      state.lastResult = null;
      setPageFeedback("");
    } catch (error) {
      setPageFeedback(error.message || "Nao foi possivel abrir a questao.", "error");
      state.questionDetail = null;
      state.selectedAnswer = "";
      state.lastResult = null;
    } finally {
      state.isLoadingQuestion = false;
      renderSessionRail();
      renderProofPanel();
      renderQuestionNavigator();
      renderWorkspace();
    }
  }

  function clearQuestionSelection() {
    state.selectedProofId = 0;
    state.selectedQuestionId = 0;
    state.activeProofSession = null;
    state.questionDetail = null;
    state.selectedAnswer = "";
    state.draftAnswers = {};
    state.sessionOutcome = null;
    state.lastResult = null;
  }

  async function loadQuestionList(options = {}) {
    const filters = getFilters();
    state.isLoadingList = true;

    if (questionBankSearchButton) {
      questionBankSearchButton.disabled = true;
    }

    if (questionBankResetButton) {
      questionBankResetButton.disabled = true;
    }

    syncFilterMode();
    renderSessionRail();
    renderProofPanel();
    renderQuestionNavigator();
    renderWorkspace();

    try {
      const queryString = buildQueryString(filters);
      const response = await window.Start5Auth.apiRequest(
        `/api/question-bank/questions${queryString ? `?${queryString}` : ""}`
      );

      state.reference = response.reference || {};
      state.overview = response.overview || {};
      state.questions = Array.isArray(response.questions) ? response.questions : [];
      state.catalog = response.catalog || null;
      state.mode = isCatalogMode() ? "catalog" : "questions";

      renderSummary();
      renderHeroPills();
      renderFilters();

      if (isCatalogMode()) {
        const sessions = Array.isArray(state.catalog?.sessions) ? state.catalog.sessions : [];
        const hasCurrentSelection = sessions.some((session) => String(session.key || "") === String(state.selectedCatalogKey || ""));

        clearQuestionSelection();
        state.activeProofSession = null;
        state.draftAnswers = {};
        state.sessionOutcome = null;
        state.selectedCatalogKey = options.preserveSelection && hasCurrentSelection
          ? state.selectedCatalogKey
          : String(sessions[0]?.key || "");
        state.selectedCatalogDocumentKind = getDefaultCatalogDocumentKind(getCatalogSessionByKey(state.selectedCatalogKey));

        setPageFeedback(
          sessions.length ? "" : "Nao encontrado!",
          sessions.length ? "" : "warning"
        );

        renderSessionRail();
        renderProofPanel();
        renderQuestionNavigator();
        renderWorkspace();
        return;
      }

      setPageFeedback("");
      state.selectedCatalogKey = "";
      state.selectedCatalogDocumentKind = "prova";

      const sessions = getQuestionSessions();
      if (!sessions.length) {
        const hasPublishedBase = Number(state.overview?.totalAvailable || 0) > 0;
        setPageFeedback(hasPublishedBase ? "Nao encontrado!" : "Nenhuma prova publicada ainda.", "warning");
      }
      const hasCurrentProof = sessions.some((session) => Number(session.proofId) === Number(state.selectedProofId));
      state.selectedProofId = options.preserveSelection && hasCurrentProof
        ? state.selectedProofId
        : Number(sessions[0]?.proofId) || 0;

      if (!state.selectedProofId) {
        state.activeProofSession = null;
        state.draftAnswers = {};
        state.sessionOutcome = null;
      }

      const activeSession = state.selectedProofId
        ? await loadProofSession(state.selectedProofId)
        : null;
      const hasSelectedQuestion = activeSession?.questions.some((question) => Number(question.id) === Number(state.selectedQuestionId));
      const nextQuestionId = options.preserveSelection && hasSelectedQuestion
        ? state.selectedQuestionId
        : Number(activeSession?.questions[0]?.id) || 0;

      if (options.skipDetailLoad) {
        if (!nextQuestionId) {
          clearQuestionSelection();
        } else {
          state.selectedProofId = Number(activeSession?.proofId) || state.selectedProofId;
          state.selectedQuestionId = nextQuestionId;
        }

        renderSessionRail();
        renderProofPanel();
        renderQuestionNavigator();
        renderWorkspace();
        return;
      }

      if (nextQuestionId) {
        await loadQuestionDetail(nextQuestionId);
      } else {
        clearQuestionSelection();
        renderSessionRail();
        renderProofPanel();
        renderQuestionNavigator();
        renderWorkspace();
      }
    } catch (error) {
      console.error("Erro ao carregar questoes:", error);
      state.questions = [];
      state.catalog = null;
      clearQuestionSelection();
      setPageFeedback(error.message || "Nao foi possivel carregar a aba de questoes.", "error");

      if (questionBankProofTitle) {
        questionBankProofTitle.textContent = "Nao foi possivel abrir a prova";
      }

      if (questionBankProofCaption) {
        questionBankProofCaption.textContent = "Tente atualizar os filtros em instantes.";
      }

      if (questionBankProofActions) {
        questionBankProofActions.innerHTML = "";
      }

      if (questionBankProofFrame) {
        questionBankProofFrame.innerHTML = '<div class="question-bank-proof-empty">Nao foi possivel montar o PDF agora.</div>';
      }

      if (questionBankWorkspace) {
        questionBankWorkspace.innerHTML = '<div class="question-bank-empty">A area de resolucao nao pode ser montada agora.</div>';
      }
    } finally {
      state.isLoadingList = false;

      if (questionBankSearchButton) {
        questionBankSearchButton.disabled = false;
      }

      if (questionBankResetButton) {
        questionBankResetButton.disabled = false;
      }

      syncFilterMode();
      renderSessionRail();
      renderProofPanel();
      renderQuestionNavigator();

      if (!state.isLoadingQuestion) {
        renderWorkspace();
      }
    }
  }

  async function submitAnswer() {
    const question = state.questionDetail;

    if (!question || !state.selectedAnswer) {
      return;
    }

    if (state.sessionMode === "simulado") {
      state.draftAnswers[Number(question.id) || 0] = state.selectedAnswer;
      state.lastResult = null;
      persistDraftForCurrentProof();
      renderQuestionNavigator();
      renderWorkspace();
      return;
    }

    try {
      state.isSubmittingAnswer = true;
      renderWorkspace();

      const response = await window.Start5Auth.apiRequest(`/api/question-bank/questions/${question.id}/attempts`, {
        method: "POST",
        body: {
          respostaMarcada: state.selectedAnswer,
        },
      });

      state.questionDetail = response.question || question;
      state.overview = response.overview || state.overview;
      state.lastResult = response.result || null;
      state.selectedAnswer = response.result?.respostaMarcada || state.selectedAnswer;
      renderSummary();
      renderHeroPills();
      await loadQuestionList({ preserveSelection: true, skipDetailLoad: true });
      renderProofPanel();
      renderQuestionNavigator();
      renderWorkspace();
    } catch (error) {
      setPageFeedback(error.message || "Nao foi possivel registrar sua resposta.", "error");
    } finally {
      state.isSubmittingAnswer = false;
      renderWorkspace();
    }
  }

  async function finalizeSimulatedSession() {
    const session = getActiveQuestionSession();

    if (!session || !session.questions.length) {
      return;
    }

    const answeredQuestions = session.questions.filter((question) => Boolean(state.draftAnswers?.[Number(question.id) || 0]));

    if (!answeredQuestions.length) {
      setPageFeedback("Marque pelo menos uma questao antes de corrigir o simulado.", "warning");
      return;
    }

    try {
      state.isSubmittingSession = true;
      renderWorkspace();
      setPageFeedback("Corrigindo o simulado...", "info");

      const results = [];

      for (const question of answeredQuestions) {
        const answer = state.draftAnswers?.[Number(question.id) || 0] || "";

        if (!answer) {
          continue;
        }

        const response = await window.Start5Auth.apiRequest(`/api/question-bank/questions/${question.id}/attempts`, {
          method: "POST",
          body: {
            respostaMarcada: answer,
          },
        });

        results.push(response.result || null);
        state.overview = response.overview || state.overview;
      }

      const validResults = results.filter(Boolean);
      const correctCount = validResults.filter((result) => result.acertou).length;
      const wrongCount = Math.max(0, validResults.length - correctCount);
      const subjectStats = new Map();

      validResults.forEach((result) => {
        const sourceQuestion = session.questions.find((question) => Number(question.id) === Number(result.questaoId));
        const subjectLabel = String(sourceQuestion?.materia || "Sem materia");
        const current = subjectStats.get(subjectLabel) || { total: 0, correct: 0 };
        current.total += 1;
        current.correct += result.acertou ? 1 : 0;
        subjectStats.set(subjectLabel, current);
      });

      const subjectRanking = [...subjectStats.entries()]
        .map(([label, stats]) => ({
          label,
          accuracy: stats.total ? Math.round((stats.correct / stats.total) * 100) : 0,
          total: stats.total,
        }))
        .sort((left, right) => {
          if (right.accuracy !== left.accuracy) return right.accuracy - left.accuracy;
          return right.total - left.total;
        });

      state.sessionOutcome = {
        mode: "simulado",
        resultsByQuestionId: Object.fromEntries(
          validResults.map((result) => [Number(result.questaoId) || 0, result])
        ),
        summary: {
          answeredCount: validResults.length,
          correctCount,
          wrongCount,
          accuracyPercentage: validResults.length ? Math.round((correctCount / validResults.length) * 100) : 0,
          bestSubject: subjectRanking[0]?.label || "Sem leitura",
        },
      };

      clearDraftForCurrentProof();
      state.sessionOutcome = {
        mode: "simulado",
        resultsByQuestionId: Object.fromEntries(
          validResults.map((result) => [Number(result.questaoId) || 0, result])
        ),
        summary: {
          answeredCount: validResults.length,
          correctCount,
          wrongCount,
          accuracyPercentage: validResults.length ? Math.round((correctCount / validResults.length) * 100) : 0,
          bestSubject: subjectRanking[0]?.label || "Sem leitura",
        },
      };
      persistDraftForCurrentProof();

      await loadQuestionList({ preserveSelection: true, skipDetailLoad: true });

      if (state.selectedQuestionId) {
        await loadQuestionDetail(state.selectedQuestionId);
      } else {
        renderSessionRail();
        renderProofPanel();
        renderQuestionNavigator();
        renderWorkspace();
      }

      setPageFeedback("Simulado corrigido com sucesso.", "info");
    } catch (error) {
      setPageFeedback(error.message || "Nao foi possivel corrigir o simulado agora.", "error");
    } finally {
      state.isSubmittingSession = false;
      renderQuestionNavigator();
      renderWorkspace();
    }
  }

  async function toggleQuestionState(key) {
    const question = state.questionDetail;

    if (!question) {
      return;
    }

    const currentValue = key === "isFavorite" ? Boolean(question.user?.isFavorite) : Boolean(question.user?.reviewLater);

    try {
      const response = await window.Start5Auth.apiRequest(`/api/question-bank/questions/${question.id}/state`, {
        method: "PATCH",
        body: {
          [key]: !currentValue,
        },
      });

      state.questionDetail = response.question || state.questionDetail;
      state.overview = response.overview || state.overview;
      renderSummary();
      renderHeroPills();
      await loadQuestionList({ preserveSelection: true, skipDetailLoad: true });
      renderProofPanel();
      renderQuestionNavigator();
      renderWorkspace();
    } catch (error) {
      setPageFeedback(error.message || "Nao foi possivel atualizar esse marcador.", "error");
    }
  }

  async function openQuestionByInput() {
    if (isCatalogMode()) {
      setPageFeedback("Sessao ainda sem questoes publicadas.", "warning");
      return;
    }

    const questionNumber = Number(questionBankQuestionNumberInput?.value || 0);
    const questionId = getQuestionIdByNumber(questionNumber);

    if (!questionId) {
      setPageFeedback("Esse numero de questao nao esta disponivel nesta prova filtrada.", "warning");
      return;
    }

    setPageFeedback("");
    await loadQuestionDetail(questionId);
  }

  questionBankFilterForm?.addEventListener("submit", async (event) => {
    event.preventDefault();
    await loadQuestionList({ preserveSelection: false });
  });

  questionBankResetButton?.addEventListener("click", async () => {
    questionBankFilterForm?.reset();

    if (questionBankStatusFilter) {
      questionBankStatusFilter.value = "all";
    }

    await loadQuestionList({ preserveSelection: false });
  });

  questionBankModeSwitch?.addEventListener("click", (event) => {
    const button = event.target.closest("[data-session-mode]");

    if (!button || isCatalogMode()) {
      return;
    }

    setSessionMode(button.dataset.sessionMode || "practice");
  });

  questionBankProofActions?.addEventListener("click", (event) => {
    const documentButton = event.target.closest("[data-document-kind]");

    if (!documentButton) {
      return;
    }

    state.selectedCatalogDocumentKind = String(documentButton.dataset.documentKind || "prova");
    renderProofPanel();
  });

  questionBankProofActions?.addEventListener("change", async (event) => {
    const proofPicker = event.target.closest("[data-proof-picker]");

    if (!proofPicker) {
      return;
    }

    if (proofPicker.dataset.proofPicker === "catalog") {
      state.selectedCatalogKey = String(proofPicker.value || "");
      state.selectedCatalogDocumentKind = getDefaultCatalogDocumentKind(getCatalogSessionByKey(state.selectedCatalogKey));
      renderSessionRail();
      renderProofPanel();
      renderQuestionNavigator();
      renderWorkspace();
      return;
    }

    const proofId = Number(proofPicker.value || 0);

    if (!proofId) {
      return;
    }

    state.selectedProofId = proofId;
    const session = await loadProofSession(proofId);

    if (!session) {
      renderSessionRail();
      renderProofPanel();
      renderQuestionNavigator();
      renderWorkspace();
      return;
    }

    const hasSelectedQuestion = session.questions.some((question) => Number(question.id) === Number(state.selectedQuestionId));
    const targetQuestionId = hasSelectedQuestion ? state.selectedQuestionId : Number(session.questions[0]?.id) || 0;

    if (targetQuestionId) {
      await loadQuestionDetail(targetQuestionId);
      return;
    }

    renderSessionRail();
    renderProofPanel();
    renderQuestionNavigator();
    renderWorkspace();
  });

  questionBankJumpForm?.addEventListener("submit", async (event) => {
    event.preventDefault();
    await openQuestionByInput();
  });

  questionBankPrevButton?.addEventListener("click", async () => {
    const previousQuestionId = getRelativeQuestionId(-1);

    if (previousQuestionId) {
      await loadQuestionDetail(previousQuestionId);
    }
  });

  questionBankNextButton?.addEventListener("click", async () => {
    const nextQuestionId = getRelativeQuestionId(1);

    if (nextQuestionId) {
      await loadQuestionDetail(nextQuestionId);
    }
  });

  questionBankWorkspace?.addEventListener("change", (event) => {
    const answerInput = event.target.closest('input[name="answer"]');

    if (!answerInput) {
      return;
    }

    state.selectedAnswer = answerInput.value || "";
    if (state.sessionMode === "simulado" && state.questionDetail) {
      state.draftAnswers[Number(state.questionDetail.id) || 0] = state.selectedAnswer;
      persistDraftForCurrentProof();
      renderQuestionNavigator();
    }
    renderWorkspace();
  });

  questionBankWorkspace?.addEventListener("submit", async (event) => {
    if (event.target.id !== "questionBankAnswerForm") {
      return;
    }

    event.preventDefault();
    await submitAnswer();
  });

  questionBankWorkspace?.addEventListener("click", async (event) => {
    if (event.target.closest("[data-toggle-favorite]")) {
      await toggleQuestionState("isFavorite");
      return;
    }

    if (event.target.closest("[data-toggle-review]")) {
      await toggleQuestionState("reviewLater");
      return;
    }

    if (event.target.closest("[data-open-next]")) {
      const nextQuestionId = getRelativeQuestionId(1);

      if (nextQuestionId) {
        await loadQuestionDetail(nextQuestionId);
      }
    }

    if (event.target.closest("[data-finalize-session]")) {
      await finalizeSimulatedSession();
    }
  });

  questionBankNumberRail?.addEventListener("click", async (event) => {
    const button = event.target.closest("[data-question-number-id]");

    if (!button) {
      return;
    }

    const questionId = Number(button.dataset.questionNumberId || 0);

    if (questionId) {
      await loadQuestionDetail(questionId);
    }
  });

  state.sessionMode = loadStoredSessionMode();
  updateModeSwitchUI();
  loadQuestionList({ preserveSelection: false });
})();
