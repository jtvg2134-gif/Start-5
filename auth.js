const rawPage = window.location.pathname.split("/").pop().toLowerCase();
const currentPage = rawPage || "login.html";
const protectedPages = new Set(["index.html", "dashboard.html", "admin.html"]);
const adminPages = new Set(["admin.html"]);
const isLoginPage = currentPage === "login.html";

let currentSession = null;
let authRedirecting = false;

function redirectTo(page) {
  window.location.replace(page);
}

function getDefaultPage(user) {
  return user?.role === "admin" ? "admin.html" : "index.html";
}

function setAuthReady() {
  document.body?.classList.add("auth-ready");
}

function updateAdminVisibility() {
  const isAdmin = currentSession?.role === "admin";

  document.querySelectorAll("[data-admin-only]").forEach((element) => {
    element.hidden = !isAdmin;
  });
}

function hydrateUserLabels() {
  if (!currentSession) return;

  document.querySelectorAll("[data-auth-name]").forEach((element) => {
    element.textContent = currentSession.name;
  });

  document.querySelectorAll("[data-auth-email]").forEach((element) => {
    element.textContent = currentSession.email;
  });
}

function bindLogoutButtons() {
  document.querySelectorAll("[data-logout]").forEach((button) => {
    button.addEventListener("click", async (event) => {
      event.preventDefault();
      await logout();
    });
  });
}

function normalizeApiError(payload, fallbackMessage) {
  if (payload && typeof payload.error === "string" && payload.error.trim()) {
    return payload.error.trim();
  }

  return fallbackMessage;
}

async function apiRequest(url, options = {}) {
  const nextOptions = { ...options };
  const headers = new Headers(nextOptions.headers || {});

  if (!headers.has("Accept")) {
    headers.set("Accept", "application/json");
  }

  if (
    nextOptions.body &&
    typeof nextOptions.body === "object" &&
    !(nextOptions.body instanceof FormData)
  ) {
    headers.set("Content-Type", "application/json");
    nextOptions.body = JSON.stringify(nextOptions.body);
  }

  const response = await fetch(url, {
    credentials: "include",
    ...nextOptions,
    headers,
  });

  const contentType = response.headers.get("content-type") || "";
  const isJson = contentType.includes("application/json");
  const payload = isJson ? await response.json() : null;

  if (!response.ok) {
    const error = new Error(
      normalizeApiError(payload, "Nao foi possivel concluir a requisicao.")
    );
    error.status = response.status;
    error.payload = payload;
    throw error;
  }

  return payload;
}

async function fetchCurrentUser() {
  try {
    const response = await apiRequest("/api/auth/me");
    currentSession = response?.user || null;
  } catch (error) {
    if (error.status === 401) {
      currentSession = null;
      return null;
    }

    throw error;
  }

  return currentSession;
}

function getSession() {
  return currentSession;
}

async function logout() {
  try {
    await apiRequest("/api/auth/logout", { method: "POST" });
  } catch (error) {
    console.error("Erro ao encerrar sessao:", error);
  }

  currentSession = null;
  redirectTo("login.html");
}

function prepareProtectedPage() {
  bindLogoutButtons();
  hydrateUserLabels();
  updateAdminVisibility();
  setAuthReady();
}

function setupLoginPage() {
  const authForm = document.getElementById("authForm");
  const authTitle = document.getElementById("authTitle");
  const authSubtitle = document.getElementById("authSubtitle");
  const authFeedback = document.getElementById("authFeedback");
  const authSubmitButton = document.getElementById("authSubmitButton");
  const authNameField = document.getElementById("authNameField");
  const authConfirmField = document.getElementById("authConfirmField");
  const authNameInput = document.getElementById("authNameInput");
  const authEmailInput = document.getElementById("authEmailInput");
  const authPasswordInput = document.getElementById("authPasswordInput");
  const authConfirmInput = document.getElementById("authConfirmInput");
  const switchButtons = [...document.querySelectorAll("[data-auth-view]")];

  if (!authForm || !authEmailInput || !authPasswordInput) {
    setAuthReady();
    return;
  }

  let mode = "login";

  function setFeedback(message, type = "") {
    if (!authFeedback) return;

    authFeedback.textContent = message;
    authFeedback.dataset.state = type;
  }

  function setLoading(isLoading) {
    authForm.querySelectorAll("input, button").forEach((element) => {
      element.disabled = isLoading;
    });

    if (!authSubmitButton) return;

    authSubmitButton.textContent = isLoading
      ? mode === "register"
        ? "Criando..."
        : "Entrando..."
      : mode === "register"
        ? "Criar conta"
        : "Entrar";
  }

  function setMode(nextMode) {
    mode = nextMode;
    const isRegister = mode === "register";

    switchButtons.forEach((button) => {
      const isActive = button.dataset.authView === mode;
      button.classList.toggle("is-active", isActive);
      button.setAttribute("aria-pressed", String(isActive));
    });

    if (authNameField) authNameField.classList.toggle("is-hidden", !isRegister);
    if (authConfirmField) authConfirmField.classList.toggle("is-hidden", !isRegister);

    if (authTitle) {
      authTitle.textContent = isRegister ? "Crie sua conta" : "Acesse sua conta";
    }

    if (authSubtitle) {
      authSubtitle.textContent = isRegister
        ? "Cadastre-se para entrar no Start 5 e manter seu proprio historico."
        : "Use seu e-mail e senha para entrar no Start 5.";
    }

    if (authSubmitButton) {
      authSubmitButton.textContent = isRegister ? "Criar conta" : "Entrar";
    }

    if (!isRegister) {
      if (authNameInput) authNameInput.value = "";
      if (authConfirmInput) authConfirmInput.value = "";
    }

    setFeedback("");
  }

  function normalizeEmail(value) {
    return value.trim().toLowerCase();
  }

  switchButtons.forEach((button) => {
    button.addEventListener("click", () => {
      setMode(button.dataset.authView || "login");
    });
  });

  authForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const email = normalizeEmail(authEmailInput.value);
    const password = authPasswordInput.value.trim();

    if (!email || !password) {
      setFeedback("Preencha e-mail e senha para continuar.", "error");
      return;
    }

    if (mode === "register") {
      const name = authNameInput?.value.trim() || "";
      const confirmPassword = authConfirmInput?.value.trim() || "";

      if (name.length < 2) {
        setFeedback("Informe um nome com pelo menos 2 caracteres.", "error");
        return;
      }

      if (password.length < 6) {
        setFeedback("A senha precisa ter pelo menos 6 caracteres.", "error");
        return;
      }

      if (password !== confirmPassword) {
        setFeedback("As senhas nao conferem.", "error");
        return;
      }
    }

    setLoading(true);
    setFeedback("");

    try {
      const response =
        mode === "register"
          ? await apiRequest("/api/auth/register", {
              method: "POST",
              body: {
                name: authNameInput?.value.trim() || "",
                email,
                password,
              },
            })
          : await apiRequest("/api/auth/login", {
              method: "POST",
              body: { email, password },
            });

      currentSession = response?.user || null;
      setFeedback(
        mode === "register" ? "Conta criada. Redirecionando..." : "Login feito. Redirecionando...",
        "success"
      );
      setTimeout(() => {
        redirectTo(getDefaultPage(currentSession));
      }, 180);
    } catch (error) {
      setFeedback(error.message || "Nao foi possivel concluir o acesso.", "error");
      setLoading(false);
    }
  });

  setMode("login");
  setAuthReady();
}

const ready = (async () => {
  try {
    await fetchCurrentUser();

    if (protectedPages.has(currentPage) && !currentSession) {
      authRedirecting = true;
      redirectTo("login.html");
      return null;
    }

    if (adminPages.has(currentPage) && currentSession?.role !== "admin") {
      authRedirecting = true;
      redirectTo("index.html");
      return currentSession;
    }

    if (isLoginPage && currentSession) {
      authRedirecting = true;
      redirectTo(getDefaultPage(currentSession));
      return currentSession;
    }

    if (isLoginPage) {
      setupLoginPage();
      return currentSession;
    }

    prepareProtectedPage();
    return currentSession;
  } catch (error) {
    console.error("Erro ao inicializar autenticacao:", error);

    if (protectedPages.has(currentPage)) {
      authRedirecting = true;
      redirectTo("login.html");
      return null;
    }

    setupLoginPage();
    return null;
  }
})();

window.Start5Auth = {
  apiRequest,
  ready,
  getSession,
  logout,
};
