/* ============================================================
   Mafatlal Digital Team Task Tracker — App bootstrap, router & global chrome wiring
   ============================================================ */
(function () {
  const FD = window.FD, UI = window.FD_UI, VIEWS = window.FD_VIEWS;
  const content = document.getElementById('content');
  let current = null;

  const ROUTE_TITLES = {
    dashboard: 'Dashboard', tasks: 'Tasks', board: 'Board', calendar: 'Calendar',
    timeline: 'Timeline', team: 'Team', approvals: 'Approvals', corpcomm: 'Corp Comm',
    documents: 'Documents', reports: 'Reports', analytics: 'Marketing Analytics',
    influencers: 'Influencers', expenses: 'Marketing Expenses', ai: 'AI Assistant', integrations: 'Microsoft 365', settings: 'Settings',
  };
  const ADMIN_ONLY = { team: true };

  function go(route) {
    if (!VIEWS[route]) route = 'dashboard';
    if (ADMIN_ONLY[route] && !FD.isAdmin()) route = 'dashboard';
    current = route;
    if (location.hash !== '#' + route) location.hash = route;
    // active nav
    document.querySelectorAll('.nav-item').forEach((n) => n.classList.toggle('active', n.getAttribute('data-route') === route));
    // close mobile nav
    document.querySelector('.app-body').classList.remove('nav-open');
    content.innerHTML = '';
    VIEWS[route].render(content);
    content.scrollTop = 0;
  }

  // ---- Theme ----
  function setTheme(theme) {
    FD.state.theme = theme;
    document.documentElement.setAttribute('data-theme', theme);
    try { localStorage.setItem('fd-theme', theme); } catch (e) {}
  }
  function toggleTheme() { setTheme(FD.state.theme === 'light' ? 'dark' : 'light'); if (current) go(current); }

  // ---- Nav badges ----
  function refreshBadges() {
    const myTasks = FD.state.tasks.filter((t) => t.assignee === FD.state.currentUser && t.status !== 'Completed').length;
    document.getElementById('navTaskCount').textContent = myTasks || '';
    const ap = FD.approvalsQueue().length;
    document.getElementById('navApprovalCount').textContent = ap || '';
    refreshNotifBadge();
  }

  function refreshNotifBadge() {
    const dot = document.getElementById('notifDot');
    if (!dot || !window.FD_NOTIF) return;
    const n = window.FD_NOTIF.unreadCount(FD.state.currentUser);
    if (n > 0) { dot.style.display = 'flex'; dot.textContent = n > 9 ? '9+' : String(n); dot.classList.add('count'); }
    else { dot.style.display = 'none'; dot.textContent = ''; }
  }

  // ---- Global search ----
  function wireSearch() {
    const input = document.getElementById('globalSearch');
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && input.value.trim()) {
        const results = FD.filterTasks({ q: input.value.trim() });
        showSearch(input.value.trim(), results);
      }
      if (e.key === 'Escape') input.blur();
    });
    document.addEventListener('keydown', (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === '/') { e.preventDefault(); input.focus(); }
    });
  }
  function showSearch(q, results) {
    UI.modal({
      title: 'Search results for "' + q + '"', width: 560,
      body: results.length ? results.slice(0, 12).map((t) => `
        <div class="list-row" data-task="${t.id}" style="cursor:pointer">
          ${UI.priorityBadge(t.priority)}
          <div style="flex:1"><div style="font-weight:600;font-size:13px">${t.name}</div>
            <div class="muted" style="font-size:11px">${UI.deptChip(t.dept)} · ${FD.dueLabel(t.due)}</div></div>
          ${UI.avatar(t.assignee, 'sm')}</div>`).join('')
        : `<div class="empty">${UI.icon('search')}<div>No tasks found</div></div>`,
      onMount: (m, close) => {
        UI.hydrateIcons(m);
        m.querySelectorAll('[data-task]').forEach((el) => el.onclick = () => { close(); UI.openTaskPane(el.getAttribute('data-task')); });
      },
    });
  }

  // ---- Profile chip & menu ----
  function updateProfileChip(user) {
    const btn = document.getElementById('profileBtn');
    btn.title = user.name;
    btn.innerHTML = `<span class="avatar" style="--c:${user.color};background:${user.color}">${user.initials}</span>`;
  }

  function toggleProfileMenu() {
    const existing = document.getElementById('profileMenu');
    if (existing) { existing.remove(); return; }
    const user = FD.userById(FD.state.currentUser);
    const menu = document.createElement('div');
    menu.className = 'profile-menu';
    menu.id = 'profileMenu';
    menu.innerHTML = `
      <div class="pm-head">
        <span class="av lg" style="background:${user.color}">${user.initials}</span>
        <div>
          <div style="font-weight:600">${user.name} ${user.isAdmin ? '<span class="lt-admin">Admin</span>' : ''}</div>
          <div class="muted" style="font-size:11.5px">${user.email}</div>
        </div>
      </div>
      <div class="pm-item" id="pmProfile">${UI.icon('user')} My details</div>
      <div class="pm-item" id="pmSettings">${UI.icon('settings')} Settings</div>
      <div class="pm-item" id="pmPassword">${UI.icon('shield')} Change my password</div>
      <div class="pm-item" id="pmLogout" style="color:var(--critical)">${UI.icon('close')} Sign out</div>`;
    document.body.appendChild(menu);
    menu.querySelector('#pmProfile').onclick = () => { menu.remove(); window.FD_VIEWS.settings.profileModal(FD.state.currentUser); };
    menu.querySelector('#pmSettings').onclick = () => { menu.remove(); go('settings'); };
    menu.querySelector('#pmPassword').onclick = () => { menu.remove(); window.FD_VIEWS.settings.changePasswordModal(); };
    menu.querySelector('#pmLogout').onclick = () => window.FD_ACCOUNTS.logout();
    const onDoc = (e) => { if (!menu.contains(e.target) && !document.getElementById('profileBtn').contains(e.target)) { menu.remove(); document.removeEventListener('click', onDoc); } };
    setTimeout(() => document.addEventListener('click', onDoc), 0);
  }

  // ---- Chrome wiring (runs once, after sign-in) ----
  function applyRoleNav() {
    document.querySelectorAll('.nav-item[data-admin="true"]').forEach((n) => {
      n.style.display = FD.isAdmin() ? '' : 'none';
    });
  }

  function startApp(user) {
    FD.state.currentUser = user.id;
    updateProfileChip(user);
    applyRoleNav();
    FD.on('auth:changed', applyRoleNav);

    // nav clicks
    document.querySelectorAll('.nav-item').forEach((n) => n.addEventListener('click', () => go(n.getAttribute('data-route'))));

    // command bar
    document.getElementById('newTaskBtn').onclick = () => UI.openTaskPane();
    document.getElementById('voiceTaskBtn').onclick = () => {
      UI.openTaskPane();
      const v = document.getElementById('voiceName'); // start dictation in the same gesture
      if (v) v.click();
    };
    document.getElementById('aiBtn').onclick = () => go('ai');
    document.getElementById('themeToggle').onclick = toggleTheme;
    document.getElementById('notifBtn').onclick = (e) => UI.toggleNotifications(e.currentTarget);
    document.getElementById('profileBtn').onclick = toggleProfileMenu;
    document.getElementById('navToggle').onclick = (e) => {
      e.stopPropagation();
      const body = document.querySelector('.app-body');
      if (window.innerWidth <= 900) body.classList.toggle('nav-open');
      else body.classList.toggle('nav-collapsed');
    };
    // Close the mobile nav drawer when tapping outside it
    document.addEventListener('click', (e) => {
      const body = document.querySelector('.app-body');
      if (window.innerWidth > 900 || !body.classList.contains('nav-open')) return;
      const nav = document.getElementById('sideNav');
      if (nav && !nav.contains(e.target)) body.classList.remove('nav-open');
    });

    wireSearch();

    // keep badges + dependent views fresh
    FD.on('tasks:changed', refreshBadges);
    FD.on('notif:changed', refreshNotifBadge);
    refreshBadges();

    // keep the avatar chip in sync when details change
    FD.on('profile:changed', (uid) => { if (uid === FD.state.currentUser) updateProfileChip(FD.userById(uid)); });

    // run notification checks now and periodically (assigned events fire immediately)
    if (window.FD_NOTIF) {
      window.FD_NOTIF.runChecks();
      FD.on('tasks:changed', () => window.FD_NOTIF.checkDeadlines());
      setInterval(() => window.FD_NOTIF.runChecks(), 5 * 60 * 1000);
    }

    // route
    const initial = (location.hash || '#dashboard').slice(1);
    go(initial);
    window.addEventListener('hashchange', () => { const r = location.hash.slice(1); if (r && r !== current) go(r); });

    // welcome + first-run prompts
    setTimeout(() => {
      UI.toast({ title: 'Welcome, ' + user.name, sub: user.isAdmin ? 'Signed in as Administrator' : 'Signed in as team member', icon: 'sparkle', duration: 4200 });
      if (window.FD_ACCOUNTS.isDefaultPassword(user.id)) {
        setTimeout(() => UI.toast({ title: 'Using the starter password', sub: 'Change it anytime from your profile menu (top right)', kind: 'warn', icon: 'shield', duration: 6000 }), 1200);
      }
      // first sign-in: ask members to add their own details
      if (!window.FD_ACCOUNTS.isProfileComplete(user.id)) {
        setTimeout(() => window.FD_VIEWS.settings.profileModal(user.id, { firstRun: true }), 900);
      }
    }, 500);
  }

  async function init() {
    // restore theme
    let saved = 'light';
    try { saved = localStorage.getItem('fd-theme') || 'light'; } catch (e) {}
    setTheme(saved);
    UI.hydrateIcons(document);

    // register the service worker (PWA + notifications); harmless if unsupported
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('sw.js').catch(() => {});
      navigator.serviceWorker.addEventListener('message', (e) => {
        if (e.data && e.data.type === 'notif-click' && e.data.data && e.data.data.taskId) {
          UI.openTaskPane(e.data.data.taskId);
        }
      });
    }

    // local accounts gate
    window.FD_ACCOUNTS.loadCustomMembers();
    await window.FD_ACCOUNTS.ensureSeeded();
    window.FD_ACCOUNTS.applyProfiles();
    const sess = window.FD_ACCOUNTS.session();
    if (sess) startApp(sess);
    else window.FD_LOGIN.show(startApp);
  }

  window.FD_APP = { go, setTheme, refreshBadges };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
