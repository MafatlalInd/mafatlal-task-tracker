/* ============================================================
   View: Dashboard — role-aware
   - Admin: org-wide performance
   - Member: their OWN performance + team performance numbers
   - Best Team Member of the Month (everyone can see)
   ============================================================ */
(function () {
  const FD = window.FD, UI = window.FD_UI, C = window.FD_CHARTS;

  function render(root) {
    const me = FD.userById(FD.state.currentUser);
    const admin = FD.isAdmin();
    const scopeTasks = admin ? FD.state.tasks : FD.myTasks();
    const m = FD.metrics(scopeTasks);
    const hoursLogged = scopeTasks.reduce((s, t) => s + (Number(t.hours) || 0), 0);
    const hoursEst = scopeTasks.reduce((s, t) => s + (Number(t.estHours) || 0), 0);
    const fmtH = (h) => (Math.round(h * 10) / 10) + 'h';
    const depts = FD.deptStats();
    const workload = FD.workloadByUser();
    const myMeetings = FD.data.meetings.filter((mt) => (mt.attendees || []).indexOf(me.id) > -1 || mt.organizer === me.id);
    const todayMeetings = myMeetings.filter((mt) => mt.date === FD.data.iso(FD.data.TODAY));

    const kpis = [
      { label: admin ? 'Total Tasks' : 'My Tasks', val: m.total, icon: 'tasks', color: '#e2231a', filter: 'all' },
      { label: 'Open', val: m.open, icon: 'inbox', color: '#ca5010', filter: 'open' },
      { label: 'Completed', val: m.completed, icon: 'check', color: '#107c10', filter: 'Completed' },
      { label: 'Delayed', val: m.delayed, icon: 'clock', color: '#d13438', filter: 'delayed' },
    ];

    const statusColors = { 'Open': '#8a8886', 'In Progress': '#0078d4', 'Waiting for Approval': '#c19c00', 'Completed': '#107c10', 'On Hold': '#8764b8', 'Delayed': '#d13438' };
    const statusCounts = FD.data.STATUS.map((s) => ({ label: s, value: scopeTasks.filter((t) => t.status === s).length })).filter((x) => x.value);

    const empty = m.total === 0;

    root.innerHTML = `
      <div class="page">
        <div class="page-head">
          <div>
            <h1 class="page-title">Good ${greeting()}, ${me.name.split(' ')[0]} 👋</h1>
            <div class="page-sub">${admin ? 'Organisation overview' : 'Your performance'} · ${FD.data.TODAY.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</div>
          </div>
          <div class="page-actions">
            <button class="btn primary" id="dashNew">${UI.icon('add')} New Task</button>
          </div>
        </div>

        <div class="grid kpi-grid" style="margin-bottom:16px">
          ${kpis.map((k) => `
            <div class="kpi clickable" data-filter="${k.filter}" role="button" tabindex="0" title="View ${k.label}">
              <div class="kpi-top"><span class="kpi-icon" style="background:${k.color}1a;color:${k.color}">${UI.icon(k.icon)}</span><span class="kpi-go" aria-hidden="true">${UI.icon('chevronR')}</span></div>
              <div class="kpi-val">${k.val}</div>
              <div class="kpi-label">${k.label}</div>
            </div>`).join('')}
        </div>

        ${bestMemberCard()}

        <div class="grid cols-12" style="margin:16px 0">
          <div class="card">
            <div class="card-head"><div><div class="card-title">${admin ? 'Task Completion Trend' : 'My Completion Trend'}</div><div class="card-sub">Created vs completed · last 6 weeks</div></div>
              <div class="legend"><span class="legend-item"><span class="sw" style="background:var(--mafatlal-red)"></span>Created</span><span class="legend-item"><span class="sw" style="background:var(--low)"></span>Completed</span></div></div>
            ${empty ? emptyBox('No activity yet', 'Create a task to start tracking your trend')
              : C.line({ height: 170, labels: trend(scopeTasks).map((x) => x.label),
                series: [
                  { points: trend(scopeTasks).map((x) => x.created), color: css('--mafatlal-red'), fill: true },
                  { points: trend(scopeTasks).map((x) => x.completed), color: css('--low'), fill: true },
                ] })}
          </div>
          <div class="card" style="display:flex;flex-direction:column;align-items:center">
            <div class="card-head" style="width:100%"><div class="card-title">${admin ? 'Status Distribution' : 'My Tasks by Status'}</div></div>
            ${empty ? emptyBox('Nothing here yet', 'Your task breakdown will appear here')
              : `<div style="display:flex;align-items:center;gap:18px;flex-wrap:wrap;justify-content:center">
                ${C.donut({ size: 150, thickness: 22, center: m.total, centerSub: 'tasks', segments: statusCounts.map((s) => ({ value: s.value, color: statusColors[s.label] })) })}
                <div style="display:flex;flex-direction:column;gap:7px">
                  ${statusCounts.map((s) => `<span class="legend-item"><span class="sw" style="background:${statusColors[s.label]}"></span>${s.label} <b style="margin-left:auto;padding-left:8px">${s.value}</b></span>`).join('')}
                </div></div>`}
          </div>
        </div>

        <div class="grid cols-3" style="margin-bottom:16px">
          <div class="card">
            <div class="card-head"><div class="card-title">Team Performance</div><div class="card-sub">By department</div></div>
            ${depts.length ? depts.map((dp) => `
              <div style="margin-bottom:12px">
                <div style="display:flex;justify-content:space-between;font-size:13px;margin-bottom:5px">
                  <span style="font-weight:600">${dp.name}</span><span class="muted">${dp.done}/${dp.total} · ${dp.rate}%</span></div>
                <div class="progress-bar"><i style="width:${dp.rate}%;background:${dp.color}"></i></div>
              </div>`).join('') : emptyBox('No team data yet', 'Department performance appears as tasks are added')}
          </div>

          <div class="card">
            <div class="card-head"><div class="card-title">Team Member Performance</div><div class="card-sub">Completed · active</div></div>
            ${workload.length ? workload.slice(0, 6).map((w) => `
              <div class="list-row">${UI.avatar(w.user.id)}
                <div style="flex:1"><div style="font-weight:600;font-size:13px">${w.user.name}</div>
                  <div class="muted" style="font-size:11px">${w.user.role}</div></div>
                <span class="chip" style="background:rgba(16,124,16,.1);color:var(--ok)">${w.completed} done</span>
                <span class="chip">${w.count} active</span>
              </div>`).join('') : emptyBox('No data yet', 'Team performance appears as work begins')}
          </div>

          <div class="card">
            <div class="card-head"><div class="card-title">${admin ? 'SLA Compliance' : 'My On-time Rate'}</div></div>
            <div style="display:flex;justify-content:center;padding:6px 0">${C.gauge(m.sla, admin ? 'On-time' : 'My on-time')}</div>
            <div class="divider"></div>
            <div class="stat-line"><span class="muted">${admin ? 'Approvals pending' : 'Awaiting approval'}</span><b>${m.waiting}</b></div>
            <div class="stat-line"><span class="muted">Completion rate</span><b>${m.completionRate}%</b></div>
            <div class="stat-line"><span class="muted">Hours logged</span><b>${fmtH(hoursLogged)}${hoursEst ? ` <span class="muted" style="font-weight:400">/ ${fmtH(hoursEst)} est</span>` : ''}</b></div>
            <div class="stat-line"><span class="muted">Overdue tasks</span><b style="color:var(--critical)">${m.delayed}</b></div>
          </div>
        </div>

        ${admin ? teamProgressCard() : ''}

        <div class="grid cols-2">
          <div class="card">
            <div class="card-head"><div><div class="card-title">${UI.icon('calendar')} My Meetings Today</div></div></div>
            ${todayMeetings.length ? todayMeetings.map((mt) => `
              <div class="list-row">
                <div style="text-align:center;min-width:54px"><div style="font-weight:700;font-size:15px">${mt.time}</div><div class="muted" style="font-size:11px">${mt.dur}m</div></div>
                <div style="width:3px;align-self:stretch;background:var(--teams);border-radius:3px;margin:2px 0"></div>
                <div style="flex:1"><div style="font-weight:600;font-size:13px">${mt.title}</div></div>
                <button class="btn subtle sm">Join</button>
              </div>`).join('') : emptyBox('No meetings today', 'Your Outlook meetings will appear here')}
          </div>

          <div class="card">
            <div class="card-head"><div class="card-title">${UI.icon('flag')} ${admin ? 'Needs Attention' : 'My Priorities'}</div></div>
            ${attentionTasks().length ? attentionTasks().map((t) => `
              <div class="list-row" data-task="${t.id}" style="cursor:pointer">
                ${UI.priorityBadge(t.priority)}
                <div style="flex:1"><div style="font-weight:600;font-size:13px">${t.name}</div>
                  <div class="muted" style="font-size:11px;margin-top:2px">${UI.deptChip(t.dept)} · ${FD.dueLabel(t.due)}</div></div>
                ${FD.isOverdue(t) ? `<span style="color:var(--critical)">${UI.icon('clock')}</span>` : ''}
                ${UI.avatar(t.assignee, 'sm')}
              </div>`).join('') : emptyBox('All clear', 'No urgent tasks right now')}
          </div>
        </div>
      </div>`;

    UI.hydrateIcons(root);
    // KPI cards open Tasks pre-filtered to the matching set.
    const openFiltered = (f) => {
      const tv = window.FD_VIEWS.tasks;
      if (tv && tv.setFilter) tv.setFilter({ status: f });
      window.FD_APP.go('tasks');
    };
    root.querySelectorAll('.kpi[data-filter]').forEach((el) => {
      el.onclick = () => openFiltered(el.getAttribute('data-filter'));
      el.onkeydown = (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openFiltered(el.getAttribute('data-filter')); } };
    });
    root.querySelector('#dashNew').onclick = () => UI.openTaskPane();
    root.querySelectorAll('[data-task]').forEach((el) => el.onclick = () => UI.openTaskPane(el.getAttribute('data-task')));
    const mbtn = root.querySelector('#bestMemberProfile');
    if (mbtn) mbtn.onclick = () => window.FD_APP.go('reports');
    root.querySelectorAll('[data-assign]').forEach((b) => b.onclick = (e) => { e.stopPropagation(); UI.openTaskPane(null, { assignee: b.getAttribute('data-assign'), dept: FD.userById(b.getAttribute('data-assign')).dept }); });
    const tlink = root.querySelector('#viewTeam');
    if (tlink) tlink.onclick = () => window.FD_APP.go('team');
  }

  function teamProgressCard() {
    const members = FD.data.users.filter((u) => !u.isAdmin);
    return `<div class="card" style="margin-bottom:16px">
      <div class="card-head">
        <div><div class="card-title">${UI.icon('users')} Team Tasks &amp; Progress</div><div class="card-sub">Live view of every member's workload</div></div>
        <button class="btn subtle sm" id="viewTeam">Open Team ${UI.icon('chevronR')}</button>
      </div>
      <table class="tbl" style="border:0">
        <thead><tr><th>Member</th><th>Department</th><th>Active</th><th>Completed</th><th>Overdue</th><th>Hours</th><th>Avg progress</th><th></th></tr></thead>
        <tbody>
          ${members.map((mem) => {
            const tks = FD.myTasks(mem.id);
            const active = tks.filter((t) => t.status !== 'Completed');
            const overdue = active.filter((t) => FD.isOverdue(t)).length;
            const done = tks.filter((t) => t.status === 'Completed').length;
            const hrs = tks.reduce((s, t) => s + (Number(t.hours) || 0), 0);
            const avg = active.length ? Math.round(active.reduce((s, t) => s + (t.progress || 0), 0) / active.length) : 0;
            return `<tr>
              <td><div style="display:flex;align-items:center;gap:8px">${UI.avatar(mem.id, 'sm')}<b>${mem.name}</b></div></td>
              <td>${UI.deptChip(mem.dept)}</td>
              <td>${active.length}</td>
              <td>${done}</td>
              <td>${overdue ? `<span style="color:var(--critical);font-weight:600">${overdue}</span>` : '0'}</td>
              <td>${hrs ? (Math.round(hrs * 10) / 10) + 'h' : '—'}</td>
              <td><div style="display:flex;align-items:center;gap:8px"><div class="progress-bar" style="width:90px"><i style="width:${avg}%"></i></div><span class="muted" style="font-size:11px">${avg}%</span></div></td>
              <td><button class="btn sm" data-assign="${mem.id}">${UI.icon('add')} Assign</button></td>
            </tr>`;
          }).join('')}
        </tbody>
      </table>
    </div>`;
  }

  function bestMemberCard() {
    const month = FD.data.TODAY.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    const ranked = FD.memberScores().filter((s) => s.completed > 0).sort((a, b) => b.score - a.score);
    if (!ranked.length) {
      return `<div class="eotm">
        <div class="eotm-head"><span class="trophy">🏆</span> Team Member of the Month · ${month}</div>
        <div class="eotm-body"><div class="muted" style="font-size:13px">The race is on! As tasks get completed this month, the leader is crowned here automatically. 🚀</div></div>
      </div>`;
    }
    const win = ranked[0], u = win.user;
    const medals = ['🥇', '🥈', '🥉'];
    return `<div class="eotm" id="bestMemberProfile" style="cursor:pointer">
      <div class="eotm-head"><span class="trophy">🏆</span> Team Member of the Month · ${month}</div>
      <div class="eotm-body">
        <div class="eotm-winner">
          <div class="eotm-avatar"><span class="eotm-crown">👑</span><span class="av" style="background:${u.color}">${u.initials}</span></div>
          <div>
            <div class="eotm-name">${u.name}</div>
            <div class="eotm-role">${u.role} · ${FD.deptById(u.dept).name}</div>
          </div>
        </div>
        <div class="eotm-stats">
          <div class="eotm-stat"><b style="color:var(--ok)">${win.completed}</b><span>Completed</span></div>
          <div class="eotm-stat"><b>${win.onTime}</b><span>On time</span></div>
          <div class="eotm-stat"><b style="color:var(--mafatlal-red)">${win.score}</b><span>Points</span></div>
        </div>
      </div>
      ${ranked.length > 1 ? `<div class="eotm-podium">
        ${ranked.slice(0, 3).map((s, i) => `<div class="eotm-rank ${i === 0 ? 'first' : ''}">
          <span class="medal">${medals[i]}</span>${UI.avatar(s.user.id, 'sm')}
          <div style="flex:1;min-width:0"><div class="rk-name" style="white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${s.user.name}</div><div class="rk-score">${s.completed} done · ${s.score} pts</div></div>
        </div>`).join('')}
      </div>` : ''}
    </div>`;
  }

  function attentionTasks() {
    const me = FD.state.currentUser;
    const pool = FD.isAdmin() ? FD.state.tasks : FD.myTasks(me);
    return pool.filter((t) => t.status !== 'Completed').sort((a, b) => {
      const score = (t) => (FD.isOverdue(t) ? 100 : 0) + ({ Critical: 40, High: 30, Medium: 20, Low: 10 }[t.priority]) - FD.daysFromToday(t.due);
      return score(b) - score(a);
    }).slice(0, 6);
  }

  function trend(tasks) {
    const buckets = [];
    for (let w = 5; w >= 0; w--) buckets.push({ label: w === 0 ? 'This wk' : w + 'w ago', created: 0, completed: 0 });
    tasks.forEach((t) => {
      const place = (isoDate, key) => {
        if (!isoDate) return;
        const off = -FD.daysFromToday(isoDate); // days ago
        const wk = Math.floor(off / 7);
        if (wk >= 0 && wk <= 5) buckets[5 - wk][key]++;
      };
      place(t.createdAt, 'created');
      if (t.status === 'Completed') place(t.completedOn || t.createdAt, 'completed');
    });
    return buckets;
  }

  function emptyBox(title, sub) {
    return `<div class="empty" style="padding:34px 16px">${UI.icon('inbox')}<div style="font-weight:600;color:var(--text-2)">${title}</div><div style="font-size:12px;margin-top:4px">${sub}</div></div>`;
  }
  function greeting() { const h = 10; return h < 12 ? 'morning' : h < 17 ? 'afternoon' : 'evening'; }
  function css(v) { return getComputedStyle(document.documentElement).getPropertyValue(v).trim(); }

  window.FD_VIEWS = window.FD_VIEWS || {};
  window.FD_VIEWS.dashboard = { title: 'Dashboard', render };
})();
