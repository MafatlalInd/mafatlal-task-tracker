/* ============================================================
   Mafatlal Digital Team Task Tracker — Notifications engine
   Per-user notifications + OS/browser notifications for:
     1. Task assigned to a member
     2. Task taking too long (overdue / due today / slow progress)
     3. Campaign underperforming
   Background push (app closed) requires a backend — see sw.js.
   ============================================================ */
(function () {
  const FD = window.FD;
  const KEY = "fd-notifications-v1";   // { userId: [ notif, ... ] }
  const SENT_KEY = "fd-notif-sent-v1"; // dedupe reminder keys

  function loadAll() { try { return JSON.parse(localStorage.getItem(KEY) || "{}"); } catch (e) { return {}; } }
  function saveAll(d) { try { localStorage.setItem(KEY, JSON.stringify(d)); } catch (e) {} }
  function loadSent() { try { return JSON.parse(localStorage.getItem(SENT_KEY) || "{}"); } catch (e) { return {}; } }
  function saveSent(d) { try { localStorage.setItem(SENT_KEY, JSON.stringify(d)); } catch (e) {} }

  function forUser(uid) { return (loadAll()[uid] || []); }
  function unreadCount(uid) { return forUser(uid).filter((n) => !n.read).length; }

  function timeAgo(ts) {
    const s = Math.max(0, Math.round((Date.now() - ts) / 1000));
    if (s < 60) return "Just now";
    if (s < 3600) return Math.floor(s / 60) + "m ago";
    if (s < 86400) return Math.floor(s / 3600) + "h ago";
    return Math.floor(s / 86400) + "d ago";
  }

  function add(uid, n) {
    if (!uid) return;
    const all = loadAll();
    const list = all[uid] = all[uid] || [];
    const notif = Object.assign({ id: "n" + Date.now() + Math.floor(Math.random() * 1e4), ts: Date.now(), read: false }, n);
    list.unshift(notif);
    if (list.length > 60) list.length = 60;
    saveAll(all);
    FD.emit("notif:changed", uid);
    if (uid === FD.state.currentUser) showOS(notif);
    return notif;
  }

  function markAllRead(uid) {
    const all = loadAll();
    (all[uid] || []).forEach((n) => n.read = true);
    saveAll(all);
    FD.emit("notif:changed", uid);
  }

  // ---- OS / browser notification ----
  function permission() { return (window.Notification && Notification.permission) || "unsupported"; }
  function requestPermission() {
    if (!window.Notification) return Promise.resolve("unsupported");
    return Notification.requestPermission();
  }
  function showOS(n) {
    if (!(window.Notification && Notification.permission === "granted")) return;
    const opts = { body: n.body || "", icon: "assets/img/app-icon-192.png", badge: "assets/img/app-icon-192.png", tag: n.id, data: { taskId: n.taskId || null } };
    if (navigator.serviceWorker && navigator.serviceWorker.ready) {
      navigator.serviceWorker.ready.then((reg) => reg.showNotification("🔔 " + n.title, opts))
        .catch(() => { try { new Notification(n.title, opts); } catch (e) {} });
    } else {
      try { const nn = new Notification(n.title, opts); nn.onclick = () => { window.focus(); if (n.taskId) window.FD_UI.openTaskPane(n.taskId); }; } catch (e) {}
    }
  }

  // ---- Trigger 1: task assigned ----
  function onAssigned(task, actorId) {
    const recipients = new Set();
    if (task.assignee && task.assignee !== actorId) recipients.add(task.assignee);
    (task.collaborators || []).forEach((c) => { if (c !== actorId) recipients.add(c); });
    recipients.forEach((uid) => add(uid, {
      type: "assigned", icon: "tasks", color: "#0078d4",
      title: "New task assigned",
      body: ((FD.userById(actorId) || {}).name || "Someone") + ' assigned you "' + task.name + '" · due ' + FD.dueLabel(task.due),
      taskId: task.id,
    }));
  }

  // ---- Trigger 2: task taking too long ----
  function checkDeadlines() {
    const sent = loadSent();
    FD.state.tasks.forEach((t) => {
      if (t.status === "Completed" || !t.assignee) return;
      const days = FD.daysFromToday(t.due);
      let key, title, body, color;
      if (days < 0) { key = "overdue:" + t.id; title = "Task overdue"; color = "#d13438"; body = '"' + t.name + '" was due ' + Math.abs(days) + ' day' + (Math.abs(days) > 1 ? 's' : '') + ' ago — please complete it.'; }
      else if (days === 0) { key = "today:" + t.id; title = "Task due today"; color = "#ca5010"; body = '"' + t.name + '" is due today.'; }
      else if (t.status === "In Progress" && (t.progress || 0) < 50 && days <= 2) { key = "slow:" + t.id; title = "Task needs attention"; color = "#c19c00"; body = '"' + t.name + '" is only ' + (t.progress || 0) + '% done and due ' + FD.dueLabel(t.due).toLowerCase() + '.'; }
      if (key && !sent[key]) {
        add(t.assignee, { type: "deadline", icon: "clock", color: color, title: title, body: body, taskId: t.id });
        sent[key] = true;
      }
    });
    saveSent(sent);
  }

  // ---- Trigger 3: campaign underperforming ----
  function checkCampaigns() {
    const sent = loadSent();
    (FD.data.marketing.campaigns || []).forEach((c) => {
      if (c.status !== "Active") return;
      const spendRatio = c.budget ? c.spend / c.budget : 0;
      const cpa = c.conv ? c.spend / c.conv : Infinity;
      let under = false, reason = "";
      if (c.spend > 0 && c.conv === 0) { under = true; reason = "spend with no conversions yet"; }
      else if (spendRatio > 0.6 && cpa > 800) { under = true; reason = "high cost per conversion (₹" + Math.round(cpa).toLocaleString("en-IN") + ")"; }
      if (under) {
        const key = "camp:" + c.name;
        if (!sent[key]) {
          add(c.owner, { type: "campaign", icon: "megaphone", color: "#ca5010", title: "Campaign underperforming", body: '"' + c.name + '" — ' + reason + ". Review & optimise." });
          sent[key] = true;
        }
      }
    });
    saveSent(sent);
  }

  function runChecks() { try { checkDeadlines(); checkCampaigns(); } catch (e) { console.warn("[notif] check failed", e); } }

  // Wire up event triggers
  FD.on("task:created", (t) => onAssigned(t, t.createdBy || FD.state.currentUser));
  FD.on("task:reassigned", (p) => onAssigned(p.task, FD.state.currentUser));

  window.FD_NOTIF = {
    forUser, unreadCount, add, markAllRead, timeAgo,
    permission, requestPermission, runChecks, checkDeadlines, checkCampaigns,
  };
})();
