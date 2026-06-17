/* ============================================================
   View: Team (admin only)
   See each member's tasks + progress, and assign work to them.
   ============================================================ */
(function () {
  const FD = window.FD, UI = window.FD_UI;
  const expanded = {};

  function render(root) {
    if (!FD.isAdmin()) {
      root.innerHTML = `<div class="page"><div class="card"><div class="empty">${UI.icon('shield')}<div>This area is for administrators only.</div></div></div></div>`;
      UI.hydrateIcons(root);
      return;
    }
    const members = FD.data.users.filter((u) => !u.isAdmin);
    root.innerHTML = `
      <div class="page">
        <div class="page-head">
          <div><h1 class="page-title">Team</h1><div class="page-sub">${members.length} members · tasks, progress &amp; assignments</div></div>
          <div class="page-actions">
            <select class="select" id="teamDept"><option value="all">All departments</option>${FD.data.departments.map((d) => `<option value="${d.id}">${d.name}</option>`).join('')}</select>
            <button class="btn" id="teamAddMember">${UI.icon('users')} Add member</button>
            <button class="btn primary" id="teamAssign">${UI.icon('add')} Assign a task</button>
          </div>
        </div>
        <div class="grid cols-2" id="teamGrid"></div>
      </div>`;
    UI.hydrateIcons(root);
    root.querySelector('#teamAssign').onclick = () => UI.openTaskPane();
    root.querySelector('#teamAddMember').onclick = () => window.FD_VIEWS.settings.addMemberModal(root);
    root.querySelector('#teamDept').onchange = (e) => paint(root, e.target.value);
    paint(root, 'all');
    FD.onView('tasks:changed', () => { const dd = root.querySelector('#teamDept'); if (dd) paint(root, dd.value); });
  }

  function paint(root, dept) {
    const members = FD.data.users.filter((u) => !u.isAdmin && (dept === 'all' || u.dept === dept));
    root.querySelector('#teamGrid').innerHTML = members.map((m) => card(m)).join('') ||
      `<div class="card"><div class="empty">${UI.icon('users')}<div>No members in this department</div></div></div>`;
    UI.hydrateIcons(root.querySelector('#teamGrid'));
    members.forEach((m) => {
      const a = root.querySelector(`#assign-${m.id}`); if (a) a.onclick = (e) => { e.stopPropagation(); UI.openTaskPane(null, { assignee: m.id, dept: m.dept }); };
      const h = root.querySelector(`#hdr-${m.id}`); if (h) h.onclick = () => { expanded[m.id] = !expanded[m.id]; paint(root, dept); };
      root.querySelectorAll(`[data-task]`).forEach((el) => el.onclick = (e) => { e.stopPropagation(); UI.openTaskPane(el.getAttribute('data-task')); });
    });
  }

  function card(m) {
    const tasks = FD.myTasks(m.id);
    const active = tasks.filter((t) => t.status !== 'Completed');
    const completed = tasks.filter((t) => t.status === 'Completed').length;
    const overdue = active.filter((t) => FD.isOverdue(t)).length;
    const avg = active.length ? Math.round(active.reduce((s, t) => s + (t.progress || 0), 0) / active.length) : 0;
    const open = expanded[m.id];
    return `<div class="card" style="padding:0;overflow:hidden">
      <div id="hdr-${m.id}" style="display:flex;align-items:center;gap:12px;padding:14px 16px;cursor:pointer">
        ${UI.avatar(m.id, 'lg')}
        <div style="flex:1">
          <div style="font-weight:600">${m.name}</div>
          <div class="muted" style="font-size:12px">${m.role} · ${FD.deptById(m.dept).name}</div>
        </div>
        <div style="text-align:right">
          <div style="font-size:12px" class="muted">${active.length} active · ${completed} done${overdue ? ` · <span style="color:var(--critical);font-weight:600">${overdue} overdue</span>` : ''}</div>
          <div style="display:flex;align-items:center;gap:8px;justify-content:flex-end;margin-top:6px">
            <div class="progress-bar" style="width:90px"><i style="width:${avg}%"></i></div><span style="font-size:11px;font-weight:600">${avg}%</span>
          </div>
        </div>
        <button class="btn sm" id="assign-${m.id}">${UI.icon('add')} Assign</button>
        <span style="color:var(--text-3);transition:transform .15s;transform:rotate(${open ? '90deg' : '0deg'})">${UI.icon('chevronR')}</span>
      </div>
      ${open ? `<div style="border-top:1px solid var(--stroke);padding:6px 16px 12px">
        ${active.length ? active.map((t) => `
          <div class="list-row" data-task="${t.id}" style="cursor:pointer">
            ${UI.priorityBadge(t.priority)}
            <div style="flex:1"><div style="font-size:13px;font-weight:600">${t.name}</div>
              <div class="muted" style="font-size:11px">${FD.dueLabel(t.due)} · ${UI.statusBadge(t.status)}</div></div>
            <div class="progress-bar" style="width:70px"><i style="width:${t.progress}%"></i></div>
            <span class="muted" style="font-size:11px">${t.progress}%</span>
          </div>`).join('') : `<div class="muted" style="font-size:13px;padding:10px 0;text-align:center">No active tasks — assign one to get started</div>`}
      </div>` : ''}
    </div>`;
  }

  window.FD_VIEWS = window.FD_VIEWS || {};
  window.FD_VIEWS.team = { title: 'Team', render };
})();
