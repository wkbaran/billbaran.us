// Demo shim, inlined as the first script of every page under /demos/.
//
// The demos are each app's real page fed with invented data. This keeps them
// static and offline:
//   - fetch() to another origin never leaves the browser unless the host is
//     in __DEMO__.allowHosts (it gets an empty 204 instead);
//   - JSON documents named in __DEMO__.shift have every ISO timestamp moved
//     forward by (now - __DEMO__.anchor), so a snapshot always looks fresh;
//   - __DEMO__.ops fakes a write endpoint: POSTs get 202, and the queued ops
//     come back as results in __DEMO__.ops.document a few seconds later;
//   - files named in __DEMO__.stub answer with that JSON instead of the
//     network (for documents a snapshot doesn't have, like a live manifest);
//   - inside the portfolio's iframe, __DEMO__.theme ({key, toggle}) keeps the
//     app's light/dark mode matching the portfolio page: the page's mode is
//     written to the app's own storage key before the app reads it, and later
//     flips click the app's own toggle, so the app updates itself as usual;
//   - __DEMO__.webmcp installs a stand-in WebMCP host where the browser has
//     none, so the portfolio page can play the agent: it records the tools
//     the app registers with document.modelContext.registerTool() and exposes
//     them as window.__demoAgent (list, call, onChange). Calls go through the
//     tool's own execute(), so the app's checks and consent dialog all apply.
//     With a native modelContext each registration is passed on to it too;
//   - service workers are not registered;
//   - links to other sites open in a new tab (inside the portfolio's iframe
//     most of them, GitHub included, refuse to load);
//   - a small "invented data" marker is shown, plus a back link when the page
//     is opened outside the portfolio's iframe.
(() => {
  "use strict";
  const cfg = window.__DEMO__ || {};
  const realFetch = window.fetch.bind(window);
  const allow = new Set(cfg.allowHosts || []);
  const shift = new Set(cfg.shift || []);
  const anchor = cfg.anchor ? Date.parse(cfg.anchor) : NaN;
  const delta = Number.isFinite(anchor) ? Date.now() - anchor : 0;
  const ISO = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?Z$/;

  function moveTimes(value) {
    if (typeof value === "string") return ISO.test(value) ? new Date(Date.parse(value) + delta).toISOString() : value;
    if (Array.isArray(value)) return value.map(moveTimes);
    if (value && typeof value === "object") {
      const out = {};
      for (const [k, v] of Object.entries(value)) out[k] = moveTimes(v);
      return out;
    }
    return value;
  }

  const json = (status, body) =>
    new Response(body === undefined ? null : JSON.stringify(body), {
      status,
      headers: { "content-type": "application/json" },
    });

  // ---- fake write endpoint ---------------------------------------------
  const OPS_KEY = `demo.${cfg.name || "page"}.ops`;
  const APPLY_AFTER_MS = 12_000;
  function queued() {
    try {
      return JSON.parse(sessionStorage.getItem(OPS_KEY) || "[]");
    } catch {
      return [];
    }
  }
  function remember(list) {
    try {
      sessionStorage.setItem(OPS_KEY, JSON.stringify(list));
    } catch {
      /* the demo just forgets on reload */
    }
  }
  function withOps(doc) {
    const now = Date.now();
    const list = queued();
    const done = list.filter((q) => now - q.at >= APPLY_AFTER_MS);
    const waiting = list.filter((q) => now - q.at < APPLY_AFTER_MS);
    doc.opResults = done.map(({ op }) => ({
      id: op.id,
      type: op.type,
      symbol: op.params?.symbol ?? op.target?.symbol ?? null,
      alertId: op.target?.alertId ?? null,
      ok: true,
      message: `Applied (demo): ${op.type}.`,
      appliedAt: new Date(now).toISOString(),
    }));
    if (done.length) doc.opsProcessedThrough = new Date(now).toISOString();
    // Dismissed revisits leave the queue, as they would after a real drain.
    const dismissed = new Set(done.filter((q) => q.op.type === "revisit.dismiss").map((q) => q.op.target?.revisitId));
    if (dismissed.size && Array.isArray(doc.revisitQueue)) {
      doc.revisitQueue = doc.revisitQueue.filter((r) => !dismissed.has(r.id) && !dismissed.has(r.revisitId));
    }
    // Point the page's countdown at when the oldest waiting op will apply.
    if (waiting.length) doc.opsNextCheckAt = new Date(waiting[0].at + APPLY_AFTER_MS).toISOString();
    return doc;
  }

  window.fetch = async (input, init = {}) => {
    const url = new URL(typeof input === "string" ? input : input.url, location.href);
    const method = (init.method || (typeof input === "object" && input.method) || "GET").toUpperCase();

    if (url.origin !== location.origin) {
      if (allow.has(url.hostname)) return realFetch(input, init);
      console.info("[demo] blocked request to", url.hostname);
      return new Response(null, { status: 204 });
    }
    const file = url.pathname.split("/").pop();
    if (cfg.stub && Object.hasOwn(cfg.stub, file)) return json(200, cfg.stub[file]);
    if (cfg.ops && file === cfg.ops.endpoint) {
      if (method !== "POST") return json(405, { error: "POST only" });
      const op = JSON.parse(init.body || "{}");
      remember([...queued(), { op, at: Date.now() }]);
      return json(202, { id: op.id, queued: true });
    }
    if (shift.has(file) || (cfg.ops && file === cfg.ops.document)) {
      const resp = await realFetch(url.pathname, { cache: "no-store" });
      if (!resp.ok) return resp;
      let doc = moveTimes(await resp.json());
      if (cfg.ops && file === cfg.ops.document) doc = withOps(doc);
      return json(200, doc);
    }
    return realFetch(input, init);
  };

  if ("serviceWorker" in navigator) {
    try {
      Object.defineProperty(navigator.serviceWorker, "register", {
        value: () => Promise.resolve({ scope: location.pathname }),
      });
    } catch {
      /* read-only in this browser; the worker is harmless anyway */
    }
  }

  for (const [key, value] of Object.entries(cfg.storage || {})) {
    try {
      if (localStorage.getItem(key) === null) localStorage.setItem(key, value);
    } catch {
      /* storage blocked: the page falls back to its locked state */
    }
  }

  // ---- WebMCP stand-in ------------------------------------------------------------
  // Records every tool the app registers, for the portfolio's agent console.
  // Where the browser has WebMCP of its own, each registration is passed on to
  // it as well, so a real agent and the console see the same tools.
  if (cfg.webmcp) {
    const native = document.modelContext || navigator.modelContext || null;
    const nativeOk = native && typeof native.registerTool === "function";
    const tools = new Map();
    const listeners = new Set();
    const changed = () => listeners.forEach((f) => { try { f(); } catch { /* a closed listener */ } });
    const host = {
      registerTool(tool, options = {}) {
        tools.set(tool.name, tool);
        // The current spec unregisters by aborting the signal passed here.
        options.signal?.addEventListener("abort", () => {
          if (tools.get(tool.name) === tool) { tools.delete(tool.name); changed(); }
        });
        changed();
        return nativeOk ? native.registerTool(tool, options) : undefined;
      },
      unregisterTool(name) {
        if (tools.delete(name)) changed();
        if (nativeOk && typeof native.unregisterTool === "function") return native.unregisterTool(name);
      },
    };
    try {
      Object.defineProperty(document, "modelContext", { value: host, configurable: true });
    } catch {
      /* can't shadow it here: the console stays empty, real agents still work */
    }
    window.__demoAgent = {
      native: Boolean(nativeOk),
      list: () => [...tools.values()].map(({ name, description, inputSchema, annotations }) => ({ name, description, inputSchema, annotations })),
      call: (name, args) => {
        const tool = tools.get(name);
        if (!tool) return Promise.reject(new Error(`No tool named ${name} is registered right now.`));
        return Promise.resolve(tool.execute(args ?? {}, {}));
      },
      onChange: (f) => { listeners.add(f); return () => listeners.delete(f); },
    };
  }

  // ---- follow the portfolio page's theme ----------------------------------------
  let host = null;
  try {
    if (window.top !== window && window.parent.location.origin === location.origin) host = window.parent.document.documentElement;
  } catch {
    /* framed by another origin: leave the app's theme alone */
  }
  if (host && cfg.theme) {
    // The portfolio is dark unless it says light (see Base.astro).
    const hostMode = () => (host.getAttribute("data-theme") === "light" ? "light" : "dark");
    try {
      localStorage.setItem(cfg.theme.key, hostMode());
    } catch {
      /* the app falls back to its own default */
    }
    const ownMode = () => (document.documentElement.getAttribute("data-theme") === "light" ? "light" : "dark");
    new MutationObserver(() => {
      if (hostMode() === ownMode()) return;
      const toggle = document.querySelector(cfg.theme.toggle);
      if (toggle) toggle.click();
    }).observe(host, { attributes: true, attributeFilter: ["data-theme"] });
  }

  // ---- marker --------------------------------------------------------------
  const framed = window.top !== window;
  // Covers links the page adds later too: decide at click time.
  document.addEventListener("click", (e) => {
    const a = e.target instanceof Element ? e.target.closest("a[href]") : null;
    if (!a || a.target) return; // the page chose a target itself (e.g. a named chart tab)
    const url = new URL(a.getAttribute("href"), location.href);
    if (url.origin === location.origin || !/^https?:$/.test(url.protocol)) return;
    a.target = "_blank";
    a.rel = "noopener";
  }, true);

  document.addEventListener("DOMContentLoaded", () => {
    const tag = document.createElement("div");
    tag.setAttribute("role", "note");
    tag.style.cssText =
      "position:fixed;right:10px;bottom:10px;z-index:2147483647;font:600 12px/1.2 system-ui,sans-serif;" +
      "padding:6px 11px;border-radius:999px;" +
      "background:#111;color:#fff;opacity:.82;pointer-events:auto;box-shadow:0 2px 8px rgba(0,0,0,.3)";
    tag.textContent = "Demo with invented data";
    if (!framed) {
      const back = document.createElement("a");
      back.href = "/projects/" + (cfg.project || cfg.name || "") + "/";
      back.textContent = "Back to billbaran.us";
      back.style.cssText = "color:inherit;margin-left:10px";
      tag.append(back);
    }
    document.body.append(tag);
  });
})();
