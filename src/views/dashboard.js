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
    const depts = FD.deptStats();
    const workload = FD.workloadByUser();
    const best = FD.bestMemberOfMonth();
    const myMeetings = FD.data.meetings.filter((mt) => (mt.attendees || []).indexOf(me.id) > -1 || mt.organizer === me.id);
    const todayMeetings = myMeetings.filter((mt) => mt.date === FD.data.iso(FD.data.TODAY));

    const kpis = [
      { label: admin ? 'Total Tasks' : 'My Tasks', val: m.total, icon: 'tasks', color: '#e2231a' },
      { label: 'Open', val: m.open, icon: 'inbox', color: '#ca5010' },
      { label: 'Completed', val: m.completed, icon: 'check', color: '#107c10' },
      { label: 'Delayed', val: m.delayed, icon: 'clock', color: '#d13438' },
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
            <div class="kpi">
              <div class="kpi-top"><span class="kpi-icon" style="background:${k.color}1a;color:${k.color}">${UI.icon(k.icon)}</span></div>
              <div class="kpi-val">${k.val}</div>
              <div class="kpi-label">${k.label}</div>
            </div>`).join('')}
        </div>

        ${bestMemberCard(best)}

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
        <thead><tr><th>Member</th><th>Department</th><th>Active</th><th>Completed</th><th>Overdue</th><th>Avg progress</th><th></th></tr></thead>
        <tbody>
          ${members.map((mem) => {
            const tks = FD.myTasks(mem.id);
            const active = tks.filter((t) => t.status !== 'Completed');
            const overdue = active.filter((t) => FD.isOverdue(t)).length;
            const done = tks.filter((t) => t.status === 'Completed').length;
            const avg = active.length ? Math.round(active.reduce((s, t) => s + (t.progress || 0), 0) / active.length) : 0;
            return `<tr>
              <td><div style="display:flex;align-items:center;gap:8px">${UI.avatar(mem.id, 'sm')}<b>${mem.name}</b></div></td>
              <td>${UI.deptChip(mem.dept)}</td>
              <td>${active.length}</td>
              <td>${done}</td>
              <td>${overdue ? `<span style="color:var(--critical);font-weight:600">${overdue}</span>` : '0'}</td>
              <td><div style="display:flex;align-items:center;gap:8px"><div class="progress-bar" style="width:90px"><i style="width:${avg}%"></i></div><span class="muted" style="font-size:11px">${avg}%</span></div></td>
              <td><button class="btn sm" data-assign="${mem.id}">${UI.icon('add')} Assign</button></td>
            </tr>`;
          }).join('')}
        </tbody>
      </table>
    </div>`;
  }

  function bestMemberCard(best) {
    if (!best) {
      return `<div class="card" style="background:linear-gradient(120deg, rgba(255,185,0,.08), rgba(0,120,212,.05));border-color:rgba(255,185,0,.3)">
        <div style="display:flex;align-items:center;gap:14px">
          <span class="kpi-icon" style="background:rgba(255,185,0,.18);color:#c19c00;width:44px;height:44px">${UI.icon('flag')}</span>
          <div><div class="card-title">⭐ Best Team Member of the Month</div>
            <div class="muted" style="font-size:13px;margin-top:2px">Awarded automatically once tasks are completed this month. Keep going!</div></div>
        </div></div>`;
    }
    const u = best.user;
    return `<div class="card" id="bestMemberProfile" style="cursor:pointer;background:linear-gradient(120deg, rgba(255,185,0,.1), rgba(0,120,212,.06));border-color:rgba(255,185,0,.35)">
      <div style="display:flex;align-items:center;gap:16px;flex-wrap:wrap">
        <div style="position:relative">
          <span class="av lg" style="background:${u.color};width:52px;height:52px;font-size:18px">${u.initials}</span>
          <span style="position:absolute;bottom:-4px;right:-4px;font-size:18px">⭐</span>
        </div>
        <div style="flex:1;min-width:180px">
          <div style="font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:.5px;color:#c19c00">Best Team Member of the Month</div>
          <div style="font-size:18px;font-weight:700;margin-top:2px">${u.name}</div>
          <div class="muted" style="font-size:12px">${u.role} · ${FD.deptById(u.dept).name}</div>
        </div>
        <div style="display:flex;gap:22px">
          <div style="text-align:center"><div style="font-size:22px;font-weight:700;color:var(--ok)">${best.completed}</div><div class="muted" style="font-size:11px">Completed</div></div>
          <div style="text-align:center"><div style="font-size:22px;font-weight:700">${best.rate}%</div><div class="muted" style="font-size:11px">Completion</div></div>
          <div style="text-align:center"><div style="font-size:22px;font-weight:700;color:var(--mafatlal-red)">${best.score}</div><div class="muted" style="font-size:11px">Score</div></div>
        </div>
      </div></div>`;
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
