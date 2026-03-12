const adminUsersValue = document.getElementById("adminUsersValue");
const adminAdminsValue = document.getElementById("adminAdminsValue");
const adminSessionsValue = document.getElementById("adminSessionsValue");
const adminMinutesValue = document.getElementById("adminMinutesValue");
const adminActiveUsersValue = document.getElementById("adminActiveUsersValue");
const adminUsersTableBody = document.getElementById("adminUsersTableBody");

function formatAdminNumber(value) {
  const safeValue = Number(value) || 0;
  return Number.isInteger(safeValue) ? String(safeValue) : safeValue.toFixed(1).replace(".", ",");
}

function formatAdminMinutes(value) {
  return `${formatAdminNumber(value)} min`;
}

function formatAdminDate(value) {
  if (!value) return "Sem registro";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "Sem registro";

  return date.toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function renderAdminOverview(overview) {
  if (adminUsersValue) adminUsersValue.textContent = String(overview.totalUsers || 0);
  if (adminAdminsValue) adminAdminsValue.textContent = String(overview.adminUsers || 0);
  if (adminSessionsValue) adminSessionsValue.textContent = String(overview.totalSessions || 0);
  if (adminMinutesValue) adminMinutesValue.textContent = formatAdminMinutes(overview.totalMinutes || 0);
  if (adminActiveUsersValue) adminActiveUsersValue.textContent = String(overview.activeUsers || 0);
}

function renderEmptyRow(message) {
  if (!adminUsersTableBody) return;

  adminUsersTableBody.replaceChildren();
  const row = document.createElement("tr");
  const cell = document.createElement("td");
  cell.colSpan = 6;
  cell.className = "admin-empty";
  cell.textContent = message;
  row.appendChild(cell);
  adminUsersTableBody.appendChild(row);
}

function createCell(text) {
  const cell = document.createElement("td");
  cell.textContent = text;
  return cell;
}

function renderAdminUsers(users) {
  if (!adminUsersTableBody) return;

  if (!Array.isArray(users) || users.length === 0) {
    renderEmptyRow("Nenhum usuário encontrado.");
    return;
  }

  const rows = users.map((user) => {
    const row = document.createElement("tr");
    row.appendChild(createCell(user.name || "Sem nome"));
    row.appendChild(createCell(user.maskedEmail || user.email || "Privado"));
    row.appendChild(createCell(user.role === "admin" ? "Admin" : "Usuário"));
    row.appendChild(createCell(formatAdminNumber(user.totalSessions)));
    row.appendChild(createCell(formatAdminMinutes(user.totalMinutes)));
    row.appendChild(createCell(formatAdminDate(user.lastSessionAt)));
    return row;
  });

  adminUsersTableBody.replaceChildren(...rows);
}

async function loadAdminData() {
  try {
    await window.Start5Auth?.ready;

    const [overviewResponse, usersResponse] = await Promise.all([
      window.Start5Auth.apiRequest("/api/admin/overview"),
      window.Start5Auth.apiRequest("/api/admin/users"),
    ]);

    renderAdminOverview(overviewResponse.overview || {});
    renderAdminUsers(usersResponse.users || []);
  } catch (error) {
    console.error("Erro ao carregar admin:", error);
    renderEmptyRow("Não foi possível carregar os dados do admin.");
  }
}

loadAdminData();
