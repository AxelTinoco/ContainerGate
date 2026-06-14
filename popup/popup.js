/**
 * ContainerGate - popup.js
 * Lógica del popup del toolbar: lista blanca y reglas.
 */

const COLOR_MAP = {
  blue: "#3b82f6", turquoise: "#06b6d4", green: "#22c55e",
  yellow: "#eab308", orange: "#f97316", red: "#ef4444",
  pink: "#ec4899", purple: "#a855f7",
};

// ─── Tab switching ────────────────────────────────────────────────────────

document.querySelectorAll(".tab").forEach((tab) => {
  tab.addEventListener("click", () => {
    document.querySelectorAll(".tab").forEach((t) => t.classList.remove("active"));
    document.querySelectorAll(".tab-content").forEach((c) => c.classList.remove("active"));
    tab.classList.add("active");
    document.getElementById(`tab-${tab.dataset.tab}`).classList.add("active");
  });
});

// ─── Whitelist ────────────────────────────────────────────────────────────

async function loadWhitelist() {
  const whitelist = await browser.runtime.sendMessage({ type: "CG_GET_WHITELIST" });
  const list = document.getElementById("whitelist-list");
  list.innerHTML = "";

  if (!whitelist.length) {
    list.innerHTML = '<li class="empty-state">No hay dominios en la lista blanca</li>';
    return;
  }

  whitelist.forEach((domain) => {
    const li = document.createElement("li");
    li.className = "item-row";
    li.innerHTML = `
      <span class="item-domain">${escHtml(domain)}</span>
      <button class="btn btn-ghost" data-domain="${escHtml(domain)}">✕ Eliminar</button>`;
    li.querySelector("button").addEventListener("click", async () => {
      const updated = whitelist.filter((d) => d !== domain);
      await browser.runtime.sendMessage({ type: "CG_SET_WHITELIST", whitelist: updated });
      showToast("Dominio eliminado");
      loadWhitelist();
    });
    list.appendChild(li);
  });
}

document.getElementById("whitelist-add").addEventListener("click", async () => {
  const input = document.getElementById("whitelist-input");
  const raw = input.value.trim().toLowerCase().replace(/^https?:\/\//, "").replace(/\/.*$/, "");
  if (!raw) return;

  const whitelist = await browser.runtime.sendMessage({ type: "CG_GET_WHITELIST" });
  if (!whitelist.includes(raw)) {
    whitelist.push(raw);
    await browser.runtime.sendMessage({ type: "CG_SET_WHITELIST", whitelist });
    showToast("Dominio agregado ✓");
  }
  input.value = "";
  loadWhitelist();
});

document.getElementById("whitelist-input").addEventListener("keydown", (e) => {
  if (e.key === "Enter") document.getElementById("whitelist-add").click();
});

// ─── Rules ────────────────────────────────────────────────────────────────

async function loadRules() {
  const [rules, containers] = await Promise.all([
    browser.runtime.sendMessage({ type: "CG_GET_RULES" }),
    browser.runtime.sendMessage({ type: "CG_GET_CONTAINERS" }),
  ]);

  const containerMap = {};
  containers.forEach((c) => { containerMap[c.cookieStoreId] = c; });

  const list = document.getElementById("rules-list");
  list.innerHTML = "";

  const entries = Object.entries(rules);
  if (!entries.length) {
    list.innerHTML = '<li class="empty-state">No hay reglas guardadas</li>';
    return;
  }

  entries.forEach(([domain, containerId]) => {
    const container = containerMap[containerId];
    const color = container ? (COLOR_MAP[container.color] || "#6b7280") : "#6b7280";
    const name = container ? container.name : containerId;

    const li = document.createElement("li");
    li.className = "item-row";
    li.innerHTML = `
      <span class="item-domain">${escHtml(domain)}</span>
      <span class="item-container-badge">
        <span class="item-dot" style="background:${color}"></span>
        ${escHtml(name)}
      </span>
      <button class="btn btn-ghost" data-domain="${escHtml(domain)}">✕</button>`;
    li.querySelector("button").addEventListener("click", async () => {
      await browser.runtime.sendMessage({ type: "CG_DELETE_RULE", domain });
      showToast("Regla eliminada");
      loadRules();
    });
    list.appendChild(li);
  });
}

// ─── Toast ────────────────────────────────────────────────────────────────

function showToast(msg) {
  let toast = document.querySelector(".cg-toast");
  if (!toast) {
    toast = document.createElement("div");
    toast.className = "cg-toast";
    document.body.appendChild(toast);
  }
  toast.textContent = msg;
  toast.classList.add("show");
  setTimeout(() => toast.classList.remove("show"), 1800);
}

function escHtml(str) {
  return String(str)
    .replace(/&/g, "&amp;").replace(/</g, "&lt;")
    .replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

// ─── Init ─────────────────────────────────────────────────────────────────

loadWhitelist();
loadRules();
