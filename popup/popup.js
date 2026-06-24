/**
 * ContainerGate - popup.js
 * Lógica del popup del toolbar: lista blanca y reglas.
 */

const COLOR_MAP = {
  blue: "#3b82f6", turquoise: "#06b6d4", green: "#22c55e",
  yellow: "#eab308", orange: "#f97316", red: "#ef4444",
  pink: "#ec4899", purple: "#a855f7",
};

// Atajo para traducir cadenas dinámicas
const t = (key) => browser.i18n.getMessage(key) || key;

// ─── Tab switching (patrón ARIA Tabs) ─────────────────────────────────────

const tabs = Array.from(document.querySelectorAll(".tab"));

function activateTab(tab, setFocus = true) {
  tabs.forEach((el) => {
    const selected = el === tab;
    el.classList.toggle("active", selected);
    el.setAttribute("aria-selected", selected ? "true" : "false");
    el.tabIndex = selected ? 0 : -1;
  });
  document.querySelectorAll(".tab-content").forEach((c) => c.classList.remove("active"));
  document.getElementById(`tab-${tab.dataset.tab}`).classList.add("active");
  if (setFocus) tab.focus();
}

tabs.forEach((tab, i) => {
  tab.addEventListener("click", () => activateTab(tab, false));
  tab.addEventListener("keydown", (e) => {
    let next = null;
    if (e.key === "ArrowRight" || e.key === "ArrowDown") next = tabs[(i + 1) % tabs.length];
    else if (e.key === "ArrowLeft" || e.key === "ArrowUp") next = tabs[(i - 1 + tabs.length) % tabs.length];
    else if (e.key === "Home") next = tabs[0];
    else if (e.key === "End") next = tabs[tabs.length - 1];
    if (next) {
      e.preventDefault();
      activateTab(next);
    }
  });
});

// ─── Whitelist ────────────────────────────────────────────────────────────

async function loadWhitelist() {
  const whitelist = await browser.runtime.sendMessage({ type: "CG_GET_WHITELIST" });
  const list = document.getElementById("whitelist-list");
  list.innerHTML = "";

  if (!whitelist.length) {
    list.innerHTML = `<li class="empty-state">${escHtml(t("whitelistEmpty"))}</li>`;
    return;
  }

  whitelist.forEach((domain) => {
    const li = document.createElement("li");
    li.className = "item-row";
    li.innerHTML = `
      <span class="item-domain">${escHtml(domain)}</span>
      <button class="btn btn-ghost" data-domain="${escHtml(domain)}">${escHtml(t("btnRemove"))}</button>`;
    li.querySelector("button").addEventListener("click", async () => {
      const updated = whitelist.filter((d) => d !== domain);
      await browser.runtime.sendMessage({ type: "CG_SET_WHITELIST", whitelist: updated });
      showToast(t("toastDomainRemoved"));
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
    showToast(t("toastDomainAdded"));
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
    list.innerHTML = `<li class="empty-state">${escHtml(t("rulesEmpty"))}</li>`;
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
      <button class="btn btn-ghost" data-domain="${escHtml(domain)}">${escHtml(t("btnRemoveShort"))}</button>`;
    li.querySelector("button").addEventListener("click", async () => {
      await browser.runtime.sendMessage({ type: "CG_DELETE_RULE", domain });
      showToast(t("toastRuleRemoved"));
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
