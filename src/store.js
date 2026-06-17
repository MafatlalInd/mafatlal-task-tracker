/* ============================================================
   Mafatlal Digital Team Task Tracker — In-memory store with pub/sub
   In production these mutations would call the Microsoft Graph
   API (see graphHooks below) and persist to your backend.
   ============================================================ */
(function () {
  const data = window.FD_DATA;

  const listeners = {};
  const viewSubs = [];   // subscriptions owned by the active view, cleared on navigation
  function on(evt, fn) { (listeners[evt] = listeners[evt] || []).push(fn); return () => off(evt, fn); }
  function off(evt, fn) { const a = listeners[evt]; if (a) { const i = a.indexOf(fn); if (i > -1) a.splice(i, 1); } }
  // View-scoped: auto-removed when the router navigates away (see clearViewListeners).
  function onView(evt, fn) { on(evt, fn); viewSubs.push({ evt, fn }); }
  function clearViewListeners() { viewSubs.forEach((s) => off(s.evt, s.fn)); viewSubs.length = 0; }
  // Crash-proof: one throwing listener can never break the emitter (or task creation).
  function emit(evt, payload) {
    (listeners[evt] || []).slice().forEach((fn) => { try { fn(payload); } catch (e) { console.warn('[emit] ' + evt + ' listener error:', e); } });
    (listeners["*"] || []).slice().forEach((fn) => { try { fn(evt, payload); } catch (e) {} });
  }

  // ----- Persistence (per browser; swap for a backend later) -----
  const TASKS_KEY = "fd-tasks-v1";
  function loadTasks() {
    try {
      const raw = localStorage.getItem(TASKS_KEY);
      if (raw) return JSON.parse(raw);
    } catch (e) {}
    return data.tasks.slice();
  }
  function saveTasks() {
    try { localStorage.setItem(TASKS_KEY, JSON.stringify(state.tasks)); } catch (e) {}
  }

  const state = {
    currentUser: "u9",
    tasks: loadTasks(),
    commItems: data.commItems.slice(),
    notifications: data.notifications.slice(),
    documents: data.documents.slice(),
    theme: "light",
    nextId: 2000,
  };

  // ----- Lookups -----
  const userById = (id) => data.users.find((u) => u.id === id);
  const deptById = (id) => data.departments.find((x) => x.id === id);
  const projectById = (id) => data.projects.find((p) => p.id === id);
  const isAdmin = (id) => { const u = userById(id || state.currentUser); return !!(u && u.isAdmin); };

  // ----- Role-based visibility -----
  // A member may see a task only if they own it, collaborate on it,
  // created it, or are its reviewer. Admin sees everything.
  function canSeeTask(t, userId) {
    userId = userId || state.currentUser;
    if (isAdmin(userId)) return true;
    return t.assignee === userId ||
      (t.collaborators || []).indexOf(userId) > -1 ||
      t.createdBy === userId ||
      t.reviewer === userId;
  }
  function visibleTasks(userId) {
    userId = userId || state.currentUser;
    return state.tasks.filter((t) => canSeeTask(t, userId));
  }

  // ----- Date helpers -----
  function daysFromToday(isoDate) {
    const t = new Date(isoDate + "T00:00:00");
    return Math.round((t - data.TODAY) / 86400000);
  }
  function isOverdue(task) {
    if (task.status === "Completed") return false;
    return daysFromToday(task.due) < 0;
  }
  function dueLabel(isoDate) {
    const n = daysFromToday(isoDate);
    if (n === 0) return "Today";
    if (n === 1) return "Tomorrow";
    if (n === -1) return "Yesterday";
    if (n < 0) return Math.abs(n) + "d overdue";
    if (n < 7) return "In " + n + "d";
    const dt = new Date(isoDate + "T00:00:00");
    return dt.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  }

  // ----- Task operations -----
  function getTask(id) { return state.tasks.find((t) => t.id === id); }

  function createTask(t) {
    const task = Object.assign({
      id: "T-" + state.nextId++,
      progress: 0, tags: [], attachments: [], status: "Open",
      reviewer: "u9", calendarSync: true, source: "manual", recurring: null,
      collaborators: [], createdBy: state.currentUser,
      createdAt: data.iso(data.TODAY),
    }, t);
    state.tasks.unshift(task);
    saveTasks();
    graphHooks.onTaskCreated(task);
    emit("tasks:changed");
    emit("task:created", task);
    return task;
  }

  function updateTask(id, patch) {
    const t = getTask(id);
    if (!t) return;
    const prevStatus = t.status;
    const prevAssignee = t.assignee;
    Object.assign(t, patch);
    if (patch.assignee && patch.assignee !== prevAssignee) {
      emit("task:reassigned", { task: t, from: prevAssignee });
    }
    if (patch.status && patch.status !== prevStatus) {
      if (patch.status === "Completed") { t.progress = 100; t.completedOn = data.iso(data.TODAY); }
      graphHooks.onStatusChanged(t, prevStatus);
      emit("task:status", { task: t, from: prevStatus });
    }
    saveTasks();
    emit("tasks:changed");
    emit("task:updated", t);
    return t;
  }

  function deleteTask(id) {
    state.tasks = state.tasks.filter((t) => t.id !== id);
    saveTasks();
    emit("tasks:changed");
  }

  // Re-read tasks from storage and refresh the UI. Called by the remote sync
  // layer (src/remote.js) when another device's changes arrive via polling.
  function reloadTasks() {
    state.tasks = loadTasks();
    emit("tasks:changed");
  }

  // ----- Filtering / sorting -----
  // Respects role visibility unless opts.scope === 'all' is requested by an admin.
  function filterTasks(opts) {
    opts = opts || {};
    let list = (opts.scope === "all" && isAdmin()) ? state.tasks.slice() : visibleTasks();
    if (opts.dept && opts.dept !== "all") list = list.filter((t) => t.dept === opts.dept);
    if (opts.status && opts.status !== "all") {
      // Grouped tokens (used by the clickable dashboard cards) match the KPI
      // numbers exactly: "Open" = Open + In Progress, "Delayed" = Delayed + overdue.
      if (opts.status === "open") list = list.filter((t) => t.status === "Open" || t.status === "In Progress");
      else if (opts.status === "delayed") list = list.filter((t) => t.status === "Delayed" || isOverdue(t));
      else list = list.filter((t) => t.status === opts.status);
    }
    if (opts.priority && opts.priority !== "all") list = list.filter((t) => t.priority === opts.priority);
    if (opts.assignee && opts.assignee !== "all") list = list.filter((t) => t.assignee === opts.assignee);
    if (opts.project && opts.project !== "all") list = list.filter((t) => t.project === opts.project);
    if (opts.q) {
      const q = opts.q.toLowerCase();
      list = list.filter((t) =>
        t.name.toLowerCase().includes(q) ||
        (t.desc || "").toLowerCase().includes(q) ||
        (t.tags || []).some((tg) => tg.toLowerCase().includes(q)) ||
        (userById(t.assignee) || {}).name?.toLowerCase().includes(q)
      );
    }
    return list;
  }

  // ----- Metrics -----
  // Pass a task list to scope it (e.g. a member's own tasks); defaults to all.
  function metrics(list) {
    const all = list || state.tasks;
    const total = all.length;
    const completed = all.filter((t) => t.status === "Completed").length;
    const open = all.filter((t) => t.status === "Open" || t.status === "In Progress").length;
    const delayed = all.filter((t) => t.status === "Delayed" || isOverdue(t)).length;
    const waiting = all.filter((t) => t.status === "Waiting for Approval").length;
    const completionRate = total ? Math.round((completed / total) * 100) : 0;
    const onTime = all.filter((t) => !isOverdue(t)).length;
    const sla = total ? Math.round((onTime / total) * 100) : 0;
    return { total, completed, open, delayed, waiting, completionRate, sla };
  }
  // A member's own performance (their tasks + the ones they collaborate on).
  function myTasks(userId) {
    userId = userId || state.currentUser;
    return state.tasks.filter((t) => t.assignee === userId || (t.collaborators || []).indexOf(userId) > -1);
  }

  // Aggregate performance numbers — visible to everyone (no task details).
  function deptStats() {
    return data.departments.map((dp) => {
      const list = state.tasks.filter((t) => t.dept === dp.id);
      const done = list.filter((t) => t.status === "Completed").length;
      const late = list.filter((t) => isOverdue(t) || t.status === "Delayed").length;
      return {
        ...dp, total: list.length, done, late,
        rate: list.length ? Math.round((done / list.length) * 100) : 0,
      };
    }).filter((x) => x.total > 0);
  }

  function workloadByUser() {
    return data.users.filter((u) => !u.isAdmin).map((u) => {
      const mine = myTasks(u.id);
      const active = mine.filter((t) => t.status !== "Completed");
      const overdue = active.filter((t) => isOverdue(t)).length;
      return { user: u, count: active.length, overdue, completed: mine.filter((t) => t.status === "Completed").length };
    }).filter((x) => x.count > 0 || x.completed > 0).sort((a, b) => b.count - a.count);
  }

  // ----- Best Team Member of the Month -----
  // Score = completed×10, on-time bonus ×5, overdue penalty ×4. Needs ≥1 done.
  function memberScores() {
    return data.users.filter((u) => !u.isAdmin).map((u) => {
      const mine = myTasks(u.id);
      const completed = mine.filter((t) => t.status === "Completed");
      const onTime = completed.filter((t) => !t.completedOn || !t.due || t.completedOn <= t.due).length;
      const overdue = mine.filter((t) => isOverdue(t)).length;
      const rate = mine.length ? Math.round((completed.length / mine.length) * 100) : 0;
      const score = completed.length * 10 + onTime * 5 - overdue * 4;
      return { user: u, completed: completed.length, total: mine.length, onTime, overdue, rate, score };
    });
  }
  function bestMemberOfMonth() {
    const ranked = memberScores().filter((s) => s.completed > 0).sort((a, b) => b.score - a.score);
    return ranked[0] || null;
  }

  // Approvals queue — only tasks where the current user is the reviewer
  // (admin sees all pending approvals).
  function approvalsQueue(userId) {
    userId = userId || state.currentUser;
    const pending = state.tasks.filter((t) => t.status === "Waiting for Approval");
    return isAdmin(userId) ? pending : pending.filter((t) => t.reviewer === userId);
  }

  // ----- Calendar sharing -----
  // Owners grant specific colleagues permission to view their calendar.
  const CAL_KEY = "fd-calendar-shares-v1";
  function loadShares() { try { return JSON.parse(localStorage.getItem(CAL_KEY) || "{}"); } catch (e) { return {}; } }
  function saveShares(s) { try { localStorage.setItem(CAL_KEY, JSON.stringify(s)); } catch (e) {} }
  function shareCalendar(viewerId, ownerId) {
    ownerId = ownerId || state.currentUser;
    const s = loadShares();
    s[ownerId] = s[ownerId] || [];
    if (s[ownerId].indexOf(viewerId) === -1) s[ownerId].push(viewerId);
    saveShares(s);
    emit("calendar:shared", { ownerId, viewerId });
  }
  function unshareCalendar(viewerId, ownerId) {
    ownerId = ownerId || state.currentUser;
    const s = loadShares();
    if (s[ownerId]) s[ownerId] = s[ownerId].filter((v) => v !== viewerId);
    saveShares(s);
    emit("calendar:shared", { ownerId, viewerId });
  }
  function canViewCalendar(ownerId, viewerId) {
    viewerId = viewerId || state.currentUser;
    if (ownerId === viewerId) return true;
    if (isAdmin(viewerId)) return true;
    const s = loadShares();
    return !!(s[ownerId] && s[ownerId].indexOf(viewerId) > -1);
  }
  function calendarsIcanView(viewerId) {
    viewerId = viewerId || state.currentUser;
    return data.users.filter((u) => canViewCalendar(u.id, viewerId));
  }
  function whoIShareWith(ownerId) {
    ownerId = ownerId || state.currentUser;
    return (loadShares()[ownerId] || []).map(userById).filter(Boolean);
  }

  // ----- Microsoft Graph integration seams -----
  // When FD_AUTH is configured + signed in (src/msgraph/auth.js),
  // these delegate to the real Graph client (src/msgraph/graph.js).
  // Otherwise they run in demo mode and log the call they'd make.
  const live = () => (window.FD_MSGRAPH && window.FD_MSGRAPH.isLive()) ? window.FD_MSGRAPH : null;
  const warn = (what) => (e) => console.warn("[Graph] " + what + " failed:", e.message);

  const graphHooks = {
    onTaskCreated(task) {
      const g = live();
      if (task.calendarSync) {
        if (g) g.createCalendarEvent(task).then((ev) => { task.graphEventId = ev.id; }).catch(warn("calendar event"));
        else console.log("[Graph demo] POST /me/events — calendar block for", task.name, task.due);
      }
      const assignee = userById(task.assignee);
      if (assignee && task.assignee !== state.currentUser) {
        if (g) g.notifyAssignee(task, assignee.email).catch(warn("assignee notification"));
        else console.log("[Graph demo] notify assignee:", assignee.name);
      }
    },
    onStatusChanged(task, from) {
      const g = live();
      if (task.status === "Waiting for Approval") {
        const reviewer = userById(task.reviewer);
        if (g && reviewer) g.requestApproval(task, reviewer.email).catch(warn("approval email"));
        else console.log("[Graph demo] approval email → reviewer:", reviewer && reviewer.name);
      } else if (task.status === "Completed" && task.graphEventId && g) {
        g.updateCalendarEvent(task.graphEventId, task).catch(warn("calendar update"));
      } else if (!g) {
        console.log("[Graph demo] status changed", task.id, from, "→", task.status);
      }
    },
    sendReminder(task) {
      const g = live();
      const assignee = userById(task.assignee);
      if (g && assignee) g.sendOverdueEscalation(task, assignee.email).catch(warn("escalation email"));
      else console.log("[Graph demo] reminder email →", assignee && assignee.name, "for", task.name);
    },
  };

  window.FD = {
    state, data, on, off, onView, clearViewListeners, emit,
    userById, deptById, projectById, isAdmin,
    canSeeTask, visibleTasks, myTasks,
    daysFromToday, isOverdue, dueLabel,
    getTask, createTask, updateTask, deleteTask, saveTasks, reloadTasks,
    filterTasks, metrics, deptStats, workloadByUser, approvalsQueue,
    memberScores, bestMemberOfMonth,
    shareCalendar, unshareCalendar, canViewCalendar, calendarsIcanView, whoIShareWith,
    graphHooks,
  };
})();
