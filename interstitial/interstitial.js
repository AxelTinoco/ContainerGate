/**
 * ContainerGate - interstitial/interstitial.js
 * Página intermedia que se muestra ANTES de cargar la URL externa.
 * La página real nunca se carga hasta que el usuario elige contenedor.
 */

(function () {
  "use strict";

  // Atajo para traducir cadenas dinámicas
  const t = (key, subs) => browser.i18n.getMessage(key, subs) || key;

  const ICON_MAP = {
    fingerprint: "🔏",
    briefcase: "💼",
    dollar: "💵",
    cart: "🛒",
    circle: "⚪",
    gift: "🎁",
    vacation: "🏖️",
    food: "🍔",
    fruit: "🍎",
    pet: "🐾",
    tree: "🌲",
    chill: "😎",
    fence: "🚧",
  };

  const COLOR_MAP = {
    blue: "#3b82f6",
    turquoise: "#06b6d4",
    green: "#22c55e",
    yellow: "#eab308",
    orange: "#f97316",
    red: "#ef4444",
    pink: "#ec4899",
    purple: "#a855f7",
  };

  // ─── Leer la URL destino desde los query params ──────────────────────────

  const params = new URLSearchParams(window.location.search);
  const targetUrl = params.get("url") || "";
  let domain = "";
  try { domain = new URL(targetUrl).hostname; } catch (_) {}

  const overlay = document.getElementById("cg-overlay");

  // Mostrar la URL destino en el título de la pestaña para que se vea en la barra
  document.title = t("openLinkTitle", [domain || t("linkWord")]);

  // ─── Pintar info de la URL ───────────────────────────────────────────────

  document.getElementById("cg-domain").textContent = domain || targetUrl;
  const urlFull = document.getElementById("cg-url-full");
  urlFull.textContent = targetUrl.length > 70 ? targetUrl.slice(0, 67) + "…" : targetUrl;
  urlFull.title = targetUrl;
  document.getElementById("cg-remember-domain").textContent = domain || t("thisSite");

  // ─── Cargar contenedores y construir las tarjetas ────────────────────────

  async function init() {
    let containers = [];
    try {
      containers = await browser.contextualIdentities.query({});
    } catch (err) {
      console.error("[ContainerGate] No se pudieron leer los contenedores:", err);
    }

    const grid = document.getElementById("cg-grid");

    if (!containers.length) {
      const empty = document.createElement("div");
      empty.className = "cg-empty";
      empty.textContent = t("noContainers");
      grid.replaceWith(empty);
    } else {
      containers.forEach((c) => {
        const icon = ICON_MAP[c.icon] || "📦";
        const color = COLOR_MAP[c.color] || "#6b7280";

        const card = document.createElement("button");
        card.className = "cg-container-card";
        card.style.setProperty("--cg-color", color);

        const dot = document.createElement("span");
        dot.className = "cg-card-dot";
        dot.style.background = color;

        const iconEl = document.createElement("span");
        iconEl.className = "cg-card-icon";
        iconEl.textContent = icon;

        const nameEl = document.createElement("span");
        nameEl.className = "cg-card-name";
        nameEl.textContent = c.name;

        card.append(dot, iconEl, nameEl);
        card.addEventListener("click", () => choose(c.cookieStoreId));
        grid.appendChild(card);
      });
    }

    requestAnimationFrame(() => {
      overlay.classList.add("cg-visible");
      // Mover el foco dentro del diálogo: primer contenedor o, si no hay,
      // el botón "Abrir sin contenedor".
      const firstCard = document.querySelector(".cg-container-card");
      (firstCard || document.getElementById("cg-open-normal")).focus();
    });
  }

  // Devuelve los elementos enfocables visibles dentro del modal
  function getFocusable() {
    return Array.from(
      document.querySelectorAll(
        '#cg-modal button, #cg-modal input, #cg-modal [tabindex]:not([tabindex="-1"])'
      )
    ).filter((el) => !el.disabled && el.offsetParent !== null);
  }

  // ─── Acciones ────────────────────────────────────────────────────────────

  function choose(containerId) {
    const remember = document.getElementById("cg-remember").checked;
    browser.runtime.sendMessage({
      type: "CG_CONTAINER_CHOSEN",
      url: targetUrl,
      domain,
      containerId,
      remember,
    });
  }

  document.getElementById("cg-open-normal").addEventListener("click", () => {
    browser.runtime.sendMessage({ type: "CG_OPEN_NORMAL", url: targetUrl });
  });

  document.getElementById("cg-close").addEventListener("click", () => {
    browser.runtime.sendMessage({ type: "CG_CANCEL" });
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      browser.runtime.sendMessage({ type: "CG_CANCEL" });
      return;
    }

    // Trampa de foco: Tab no debe salir del diálogo modal
    if (e.key === "Tab") {
      const focusable = getFocusable();
      if (!focusable.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }
  });

  init();
})();
