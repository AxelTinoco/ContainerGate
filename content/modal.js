/**
 * ContainerGate - content/modal.js
 * Inyecta y gestiona el modal de selección de contenedor.
 */

(function () {
  "use strict";

  if (window.__cgModalInjected) return;
  window.__cgModalInjected = true;

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

  // ─── Escuchar mensajes del background ───────────────────────────────────

  browser.runtime.onMessage.addListener((message) => {
    if (message.type === "CG_SHOW_MODAL") {
      showModal(message);
    }
  });

  // ─── Construir y mostrar el modal ────────────────────────────────────────

  function showModal({ url, domain, containers, whitelist, rules }) {
    // Prevenir doble modal
    if (document.getElementById("cg-overlay")) return;

    const overlay = document.createElement("div");
    overlay.id = "cg-overlay";
    overlay.setAttribute("role", "dialog");
    overlay.setAttribute("aria-modal", "true");
    overlay.setAttribute("aria-label", "ContainerGate - Seleccionar contenedor");

    overlay.innerHTML = buildModalHTML(url, domain, containers);
    document.body.appendChild(overlay);

    // Animación de entrada
    requestAnimationFrame(() => overlay.classList.add("cg-visible"));

    bindEvents(overlay, url, domain);
  }

  function buildModalHTML(url, domain, containers) {
    const shortUrl = url.length > 60 ? url.slice(0, 57) + "…" : url;

    const containerCards = containers.map((c) => {
      const icon = ICON_MAP[c.icon] || "📦";
      const color = COLOR_MAP[c.color] || "#6b7280";
      return `
        <button class="cg-container-card" data-id="${c.id}" data-name="${escapeHtml(c.name)}" style="--cg-color: ${color}">
          <span class="cg-card-dot" style="background:${color}"></span>
          <span class="cg-card-icon">${icon}</span>
          <span class="cg-card-name">${escapeHtml(c.name)}</span>
        </button>`;
    }).join("");

    return `
      <div id="cg-modal">
        <div class="cg-header">
          <div class="cg-logo">
            <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
              <rect width="28" height="28" rx="8" fill="#0D1B2A"/>
              <path d="M7 10.5L14 7L21 10.5V17.5L14 21L7 17.5V10.5Z" stroke="#00C2FF" stroke-width="1.5" fill="none"/>
              <path d="M11 14L13 16L17 12" stroke="#00C2FF" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </div>
          <div class="cg-title-block">
            <h1 class="cg-title">ContainerGate</h1>
            <p class="cg-subtitle">¿En qué contenedor quieres abrir este enlace?</p>
          </div>
          <button class="cg-close" id="cg-close" aria-label="Cancelar">✕</button>
        </div>

        <div class="cg-url-block">
          <span class="cg-domain">${escapeHtml(domain)}</span>
          <span class="cg-url-full" title="${escapeHtml(url)}">${escapeHtml(shortUrl)}</span>
        </div>

        <div class="cg-containers-label">Contenedores disponibles</div>
        <div class="cg-container-grid" id="cg-grid">
          ${containerCards}
        </div>

        <div class="cg-footer">
          <label class="cg-remember-label">
            <input type="checkbox" id="cg-remember" />
            <span>Recordar para <strong>${escapeHtml(domain)}</strong></span>
          </label>
          <div class="cg-footer-actions">
            <button class="cg-btn cg-btn-normal" id="cg-open-normal">
              Abrir sin contenedor
            </button>
          </div>
        </div>
      </div>`;
  }

  // ─── Eventos ─────────────────────────────────────────────────────────────

  function bindEvents(overlay, url, domain) {
    // Clic en una tarjeta de contenedor
    overlay.querySelectorAll(".cg-container-card").forEach((card) => {
      card.addEventListener("click", () => {
        const containerId = card.dataset.id;
        const remember = overlay.querySelector("#cg-remember").checked;
        browser.runtime.sendMessage({
          type: "CG_CONTAINER_CHOSEN",
          url,
          domain,
          containerId,
          remember,
        });
        removeModal(overlay);
      });
    });

    // Abrir sin contenedor
    overlay.querySelector("#cg-open-normal").addEventListener("click", () => {
      browser.runtime.sendMessage({ type: "CG_OPEN_NORMAL", url });
      removeModal(overlay);
    });

    // Cerrar / cancelar
    overlay.querySelector("#cg-close").addEventListener("click", () => {
      browser.runtime.sendMessage({ type: "CG_CANCEL" });
      removeModal(overlay);
    });

    // Clic en el fondo
    overlay.addEventListener("click", (e) => {
      if (e.target === overlay) {
        browser.runtime.sendMessage({ type: "CG_CANCEL" });
        removeModal(overlay);
      }
    });

    // Escape key
    document.addEventListener("keydown", function onKey(e) {
      if (e.key === "Escape") {
        browser.runtime.sendMessage({ type: "CG_CANCEL" });
        removeModal(overlay);
        document.removeEventListener("keydown", onKey);
      }
    });
  }

  function removeModal(overlay) {
    overlay.classList.remove("cg-visible");
    setTimeout(() => overlay.remove(), 250);
  }

  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }
})();
