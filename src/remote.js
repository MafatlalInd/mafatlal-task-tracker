/* ============================================================
   Mafatlal Digital Team Task Tracker — Remote sync layer
   Turns the per-browser localStorage app into a shared, multi-device
   app backed by /api/data (Vercel Postgres).

   How it works, with zero changes to the rest of the app:
     1. On boot we PULL all server data into localStorage, THEN load the
        app scripts — so every downstream module sees shared data as if
        it had always been local.
     2. We wrap localStorage.setItem so every save also PUSHES to the
        server (fire-and-forget). The app keeps calling setItem as before.
     3. We POLL every few seconds and fold server changes back into the
        running app (live task / notification updates across devices).

   Per-device keys (session, theme, Graph config) are never synced.
   If the server is unreachable, the app silently falls back to the local
   cache — it still works offline, just not shared.
   ============================================================ */
(function () {
  var API = "/api/data";
  // Only keys with this prefix are shared. Everything the app stores uses it.
  var PREFIX = "fd-";
  // Keys that must stay per-device (who's logged in here, this device's theme,
  // this browser's MSAL/Graph client id). Never pushed or pulled.
  var NO_SYNC = { "fd-session": 1, "fd-theme": 1, "fd-graph-config": 1 };

  var native = {
    set: localStorage.setItem.bind(localStorage),
    get: localStorage.getItem.bind(localStorage),
    remove: localStorage.removeItem.bind(localStorage),
  };

  function shouldSync(key) {
    return key && key.indexOf(PREFIX) === 0 && !NO_SYNC[key];
  }

  // ---- Push one key to the server (fire-and-forget, never throws) ----
  function push(key, rawValue) {
    var value;
    try { value = JSON.parse(rawValue); } catch (e) { value = rawValue; }
    try {
      fetch(API, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key: key, value: value }),
        keepalive: true,
      }).catch(function () {});
    } catch (e) {}
  }

  // ---- Wrap setItem / removeItem so ordinary saves sync automatically ----
  localStorage.setItem = function (key, value) {
    native.set(key, value);
    if (shouldSync(key)) push(key, value);
  };
  localStorage.removeItem = function (key) {
    native.remove(key);
    if (shouldSync(key)) {
      try {
        fetch(API + "?key=" + encodeURIComponent(key), { method: "DELETE", keepalive: true }).catch(function () {});
      } catch (e) {}
    }
  };

  // Snapshot of what the server last gave us, so the poller can tell what
  // actually changed (avoids needless re-renders).
  var lastSnapshot = {};

  // ---- Pull everything from the server into localStorage ----
  function pullAll() {
    return fetch(API, { cache: "no-store" })
      .then(function (r) { return r.json(); })
      .then(function (all) {
        if (!all || typeof all !== "object") return {};
        Object.keys(all).forEach(function (key) {
          if (!shouldSync(key)) return;
          native.set(key, JSON.stringify(all[key]));
          lastSnapshot[key] = JSON.stringify(all[key]);
        });
        return all;
      });
  }

  // ---- Load the real application scripts, in order, after the pull ----
  // index.html lists them as <script type="application/fd-deferred" data-src=…>
  // so the browser does not run them until we say so.
  function loadApp() {
    var nodes = document.querySelectorAll('script[type="application/fd-deferred"]');
    for (var i = 0; i < nodes.length; i++) {
      var src = nodes[i].getAttribute("data-src");
      if (!src) continue;
      var s = document.createElement("script");
      s.src = src;
      s.async = false; // preserves execution order for dynamically added scripts
      document.body.appendChild(s);
    }
  }

  // ---- Poll: fold server-side changes into the running app ----
  function startPolling() {
    var INTERVAL = 12000;
    setInterval(function () {
      // Don't fight an in-flight render; just fetch and diff.
      fetch(API, { cache: "no-store" })
        .then(function (r) { return r.json(); })
        .then(function (all) {
          if (!all || typeof all !== "object") return;
          var tasksChanged = false, notifChanged = false, anyChanged = false;
          Object.keys(all).forEach(function (key) {
            if (!shouldSync(key)) return;
            var serialized = JSON.stringify(all[key]);
            if (lastSnapshot[key] === serialized) return;
            lastSnapshot[key] = serialized;
            native.set(key, serialized);
            anyChanged = true;
            if (key === "fd-tasks-v1") tasksChanged = true;
            if (key === "fd-notifications-v1") notifChanged = true;
          });
          if (!anyChanged || !window.FD) return;
          // Live-refresh the parts of the UI that are time-sensitive.
          if (tasksChanged && typeof window.FD.reloadTasks === "function") {
            window.FD.reloadTasks();
          }
          if (notifChanged && window.FD.emit) {
            window.FD.emit("notifications:changed");
          }
        })
        .catch(function () {});
    }, INTERVAL);
  }

  // ---- One-time migration: upload local data the server doesn't have yet ----
  // The sync layer pushes on every save and pulls on load, but data created
  // BEFORE sync was enabled only lives in this browser. Without this, those
  // tasks/expenses/etc. would be stranded here and invisible on other devices.
  // We only push keys the server is missing — never overwrite newer server data.
  function pushLocalOnlyKeys(serverData) {
    serverData = serverData || {};
    for (var i = 0; i < localStorage.length; i++) {
      var key = localStorage.key(i);
      if (!shouldSync(key)) continue;
      if (Object.prototype.hasOwnProperty.call(serverData, key)) continue; // server already has it
      var raw = native.get(key);
      if (raw == null) continue;
      push(key, raw);
      lastSnapshot[key] = raw; // so the poller doesn't treat our own upload as a remote change
    }
  }

  // ---- Boot sequence ----
  function boot() {
    var done = false;
    function go() {
      if (done) return;
      done = true;
      loadApp();
      startPolling();
    }
    // If the server is slow/unreachable, don't block the app forever —
    // fall back to the local cache after a short timeout.
    var safety = setTimeout(go, 4000);
    pullAll()
      .then(function (serverData) {
        clearTimeout(safety);
        pushLocalOnlyKeys(serverData); // migrate pre-existing local data up
        go();
      })
      .catch(function () { clearTimeout(safety); go(); });
  }

  window.FD_REMOTE = { pullAll: pullAll, push: push, pushLocalOnlyKeys: pushLocalOnlyKeys };
  boot();
})();
