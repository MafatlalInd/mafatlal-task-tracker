/* ============================================================
   Mafatlal Digital Team Task Tracker — Microsoft Entra ID (Azure AD) authentication
   via MSAL.js (Authorization Code Flow with PKCE)

   HOW TO GO LIVE
   1. Register an app in Microsoft Entra admin center
      (see docs/AZURE_SETUP.md for step-by-step).
   2. Paste your Application (client) ID below.
   3. Serve the app from the redirect URI you registered
      (e.g. http://localhost:8777).

   With no clientId configured the platform runs in DEMO MODE:
   all Microsoft 365 calls are simulated and logged to console.
   ============================================================ */
(function () {
  // ── CONFIG ─────────────────────────────────────────────────
  // You can hard-code the clientId here, OR (easier) use the
  // "Connect Microsoft 365" wizard on the Microsoft 365 page —
  // it saves the ID locally and no code editing is needed.
  window.FD_GRAPH_CONFIG = {
    clientId: "",            // ← Application (client) ID from Entra ID
    tenantId: "common",      // or your Directory (tenant) ID for single-tenant
    redirectUri: window.location.origin + window.location.pathname,
    scopes: [
      "User.Read",
      "Calendars.ReadWrite",
      "Mail.Read",
      "Mail.Send",
      "Tasks.ReadWrite",
      "Files.ReadWrite",
    ],
  };
  // Wizard-saved config (localStorage) overrides the empty default
  try {
    const saved = JSON.parse(localStorage.getItem("fd-graph-config") || "null");
    if (saved && saved.clientId && !window.FD_GRAPH_CONFIG.clientId) {
      window.FD_GRAPH_CONFIG.clientId = saved.clientId;
      window.FD_GRAPH_CONFIG.tenantId = saved.tenantId || "common";
    }
  } catch (e) {}
  // ───────────────────────────────────────────────────────────

  const MSAL_CDN = "https://alcdn.msauth.net/browser/3.10.0/js/msal-browser.min.js";
  let pca = null;          // PublicClientApplication
  let account = null;      // signed-in AccountInfo
  let initPromise = null;

  const cfg = () => window.FD_GRAPH_CONFIG;
  const isConfigured = () => !!cfg().clientId;
  const isSignedIn = () => !!account;

  // Load msal-browser from CDN only when actually configured —
  // demo mode never makes a network request.
  function loadMsal() {
    if (window.msal) return Promise.resolve();
    return new Promise((resolve, reject) => {
      const s = document.createElement("script");
      s.src = MSAL_CDN;
      s.onload = resolve;
      s.onerror = () => reject(new Error("Failed to load MSAL from CDN"));
      document.head.appendChild(s);
    });
  }

  async function init() {
    if (!isConfigured()) return null;
    if (initPromise) return initPromise;
    initPromise = (async () => {
      await loadMsal();
      pca = new window.msal.PublicClientApplication({
        auth: {
          clientId: cfg().clientId,
          authority: "https://login.microsoftonline.com/" + cfg().tenantId,
          redirectUri: cfg().redirectUri,
        },
        cache: { cacheLocation: "localStorage" },
      });
      await pca.initialize();
      // Restore a cached session if present
      const cached = pca.getAllAccounts();
      if (cached.length) account = cached[0];
      return pca;
    })();
    return initPromise;
  }

  async function signIn() {
    if (!isConfigured()) throw new Error("No clientId configured — see src/msgraph/auth.js");
    await init();
    const result = await pca.loginPopup({ scopes: cfg().scopes });
    account = result.account;
    pca.setActiveAccount(account);
    window.FD && window.FD.emit("auth:changed", account);
    return account;
  }

  async function signOut() {
    if (!pca || !account) { account = null; return; }
    await pca.logoutPopup({ account });
    account = null;
    window.FD && window.FD.emit("auth:changed", null);
  }

  // Silent-first token acquisition with popup fallback.
  async function getToken() {
    if (!isConfigured()) throw new Error("Demo mode — no token available");
    await init();
    if (!account) await signIn();
    try {
      const res = await pca.acquireTokenSilent({ scopes: cfg().scopes, account });
      return res.accessToken;
    } catch (e) {
      const res = await pca.acquireTokenPopup({ scopes: cfg().scopes });
      account = res.account;
      return res.accessToken;
    }
  }

  // Save config from the in-app wizard and reset MSAL so the
  // next signIn() uses the new registration. No code editing needed.
  function configure(opts) {
    const c = cfg();
    c.clientId = (opts.clientId || "").trim();
    c.tenantId = (opts.tenantId || "common").trim() || "common";
    try { localStorage.setItem("fd-graph-config", JSON.stringify({ clientId: c.clientId, tenantId: c.tenantId })); } catch (e) {}
    pca = null; account = null; initPromise = null;
    return isConfigured();
  }

  function disconnect() {
    try { localStorage.removeItem("fd-graph-config"); } catch (e) {}
    cfg().clientId = ""; cfg().tenantId = "common";
    pca = null; account = null; initPromise = null;
    window.FD && window.FD.emit("auth:changed", null);
  }

  window.FD_AUTH = {
    isConfigured, isSignedIn, init, signIn, signOut, getToken, configure, disconnect,
    get account() { return account; },
  };

  // Eagerly restore cached sessions on load (no-op in demo mode)
  if (isConfigured()) init().then(() => {
    if (account && window.FD) window.FD.emit("auth:changed", account);
  }).catch((e) => console.warn("[Auth] init failed:", e.message));
})();
