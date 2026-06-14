/**
 * ContainerGate - background.js
 * Intercepta URLs que llegan desde aplicaciones externas al navegador
 * y muestra un selector de contenedor.
 */

const STORAGE_KEYS = {
  WHITELIST: "cg_whitelist",       // dominios que nunca preguntan
  RULES: "cg_rules",               // domain -> containerId guardados
};

// Tabs pendientes de decisión: tabId -> { url, resolve }
const pendingTabs = new Map();

// ─────────────────────────────────────────────
// Utilidades de storage
// ─────────────────────────────────────────────

async function getWhitelist() {
  const result = await browser.storage.local.get(STORAGE_KEYS.WHITELIST);
  return result[STORAGE_KEYS.WHITELIST] || [];
}

async function getRules() {
  const result = await browser.storage.local.get(STORAGE_KEYS.RULES);
  return result[STORAGE_KEYS.RULES] || {};
}

async function saveRules(rules) {
  await browser.storage.local.set({ [STORAGE_KEYS.RULES]: rules });
}

function getDomain(url) {
  try {
    return new URL(url).hostname;
  } catch {
    return null;
  }
}

// ─────────────────────────────────────────────
// Detectar si la tab viene de fuera del navegador
// (opener es null y no tiene tab referente)
// ─────────────────────────────────────────────

function isExternalNavigation(details) {
  // Firefox expone openerTabId: si no tiene opener, viene de fuera
  return details.openerTabId === undefined || details.openerTabId === null;
}

// ─────────────────────────────────────────────
// Abrir URL en un contenedor específico
// ─────────────────────────────────────────────

async function openInContainer(url, containerId, currentTabId) {
  const cookieStoreId = containerId === "firefox-default"
    ? "firefox-default"
    : containerId;

  await browser.tabs.create({
    url,
    cookieStoreId,
    active: true,
  });

  // Cerrar la tab original que fue interceptada
  try {
    await browser.tabs.remove(currentTabId);
  } catch (_) {}
}

// ─────────────────────────────────────────────
// Pedir al content script que muestre el modal
// ─────────────────────────────────────────────

async function showContainerModal(tabId, url) {
  const containers = await browser.contextualIdentities.query({});
  const whitelist = await getWhitelist();
  const rules = await getRules();
  const domain = getDomain(url);

  await browser.tabs.sendMessage(tabId, {
    type: "CG_SHOW_MODAL",
    url,
    domain,
    containers: containers.map((c) => ({
      id: c.cookieStoreId,
      name: c.name,
      color: c.color,
      icon: c.icon,
    })),
    whitelist,
    rules,
  });
}

// ─────────────────────────────────────────────
// Listener: nueva tab creada
// ─────────────────────────────────────────────

browser.tabs.onCreated.addListener(async (tab) => {
  // Esperar a que la tab tenga URL
  if (!tab.url || tab.url === "about:blank" || tab.url === "about:newtab") {
    pendingTabs.set(tab.id, { waitingForUrl: true });
  }
});

// ─────────────────────────────────────────────
// Listener: tab actualizada (obtenemos la URL real)
// ─────────────────────────────────────────────

browser.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  if (changeInfo.status !== "complete") return;
  if (!tab.url || tab.url.startsWith("about:") || tab.url.startsWith("moz-extension:")) return;

  const isPending = pendingTabs.get(tabId);

  // Solo procesamos tabs que arrancaron sin URL (externas)
  if (!isPending || !isPending.waitingForUrl) return;

  pendingTabs.delete(tabId);

  const domain = getDomain(tab.url);
  if (!domain) return;

  // Revisar lista blanca
  const whitelist = await getWhitelist();
  if (whitelist.includes(domain)) return;

  // Revisar si ya hay una regla guardada para este dominio
  const rules = await getRules();
  if (rules[domain]) {
    const containerId = rules[domain];
    if (containerId !== "ask") {
      await openInContainer(tab.url, containerId, tabId);
      return;
    }
  }

  // Mostrar modal de selección
  try {
    await showContainerModal(tabId, tab.url);
  } catch (err) {
    console.error("[ContainerGate] No se pudo mostrar el modal:", err);
  }
});

// ─────────────────────────────────────────────
// Listener: mensajes desde content script o popup
// ─────────────────────────────────────────────

browser.runtime.onMessage.addListener(async (message, sender) => {
  switch (message.type) {

    // Usuario eligió un contenedor
    case "CG_CONTAINER_CHOSEN": {
      const { url, containerId, remember, domain } = message;
      const tabId = sender.tab?.id;

      // Guardar regla si pidió recordar
      if (remember && domain) {
        const rules = await getRules();
        rules[domain] = containerId;
        await saveRules(rules);
      }

      await openInContainer(url, containerId, tabId);
      break;
    }

    // Usuario eligió abrir sin contenedor
    case "CG_OPEN_NORMAL": {
      const { url } = message;
      const tabId = sender.tab?.id;

      await browser.tabs.create({ url, active: true });
      try { await browser.tabs.remove(tabId); } catch (_) {}
      break;
    }

    // Usuario canceló
    case "CG_CANCEL": {
      const tabId = sender.tab?.id;
      try { await browser.tabs.remove(tabId); } catch (_) {}
      break;
    }

    // Popup pide la lista de containers
    case "CG_GET_CONTAINERS": {
      const containers = await browser.contextualIdentities.query({});
      return Promise.resolve(containers);
    }

    // Popup pide whitelist
    case "CG_GET_WHITELIST": {
      return Promise.resolve(await getWhitelist());
    }

    // Popup actualiza whitelist
    case "CG_SET_WHITELIST": {
      await browser.storage.local.set({ [STORAGE_KEYS.WHITELIST]: message.whitelist });
      return Promise.resolve(true);
    }

    // Popup pide reglas
    case "CG_GET_RULES": {
      return Promise.resolve(await getRules());
    }

    // Popup borra una regla
    case "CG_DELETE_RULE": {
      const rules = await getRules();
      delete rules[message.domain];
      await saveRules(rules);
      return Promise.resolve(true);
    }
  }
});
