/* ============================================================
   View: My Tasks — Excel-style list/grid view
   ============================================================ */
(function () {
  const FD = window.FD, UI = window.FD_UI;
  let sortKey = 'due', sortDir = 1;
  const filters = { q: '', dept: 'all', status: 'all', priority: 'all', assignee: 'all' };

  function render(root) {
    root.innerHTML = `
      <div class="page">
        <div class="page-head">
          <div><h1 class="page-title">Tasks</h1><div class="page-sub" id="taskCount"></div></div>
          <div class="page-actions">
            <button class="btn" id="exportBtn">${UI.icon('download')} Export</button>
            <button class="btn primary" id="newBtn">${UI.icon('add')} New Task</button>
          </div>
        </div>

        <div class="toolbar">
          <div class="search-box">${UI.icon('search')}<input id="qInput" placeholder="Filter tasks…" value="${filters.q}"/></div>
          <select class="select" id="fDept"><option value="all">All departments</option>${FD.data.departments.map((d) => optSel(d.id, d.name, filters.dept)).join('')}</select>
          <select class="select" id="fStatus"><option value="all">All statuses</option>${optSel('open', 'Open & In Progress', filters.status)}${optSel('delayed', 'Delayed & Overdue', filters.status)}${FD.data.STATUS.map((s) => optSel(s, s, filters.status)).join('')}</select>
          <select class="select" id="fPriority"><option value="all">All priorities</option>${FD.data.PRI.map((p) => optSel(p, p, filters.priority)).join('')}</select>
          ${FD.isAdmin() ? `<select class="select" id="fAssignee"><option value="all">Anyone</option>${FD.data.users.map((u) => optSel(u.id, u.name, filters.assignee)).join('')}</select>` : ''}
          <div class="spacer"></div>
          <button class="btn subtle sm" id="clearFilters">Clear</button>
        </div>

        <div class="tbl-wrap" id="tblWrap"></div>
      </div>`;

    UI.hydrateIcons(root);
    bindToolbar(root);
    renderTable(root);

    root.querySelector('#newBtn').onclick = () => UI.openTaskPane();
    root.querySelector('#exportBtn').onclick = () => UI.toast({ title: 'Exported to Excel', sub: 'Tasks_Export.xlsx saved to OneDrive', icon: 'download' });
    FD.onView('tasks:changed', () => renderTable(root));
  }

  function bindToolbar(root) {
    const q = root.querySelector('#qInput');
    q.oninput = () => { filters.q = q.value; renderTable(root); };
    root.querySelector('#fDept').onchange = (e) => { filters.dept = e.target.value; renderTable(root); };
    root.querySelector('#fStatus').onchange = (e) => { filters.status = e.target.value; renderTable(root); };
    root.querySelector('#fPriority').onchange = (e) => { filters.priority = e.target.value; renderTable(root); };
    const fa = root.querySelector('#fAssignee');
    if (fa) fa.onchange = (e) => { filters.assignee = e.target.value; renderTable(root); };
    root.querySelector('#clearFilters').onclick = () => {
      Object.assign(filters, { q: '', dept: 'all', status: 'all', priority: 'all', assignee: 'all' });
      render(root);
    };
  }

  function renderTable(root) {
    let list = FD.filterTasks(filters);
    list = sortList(list);
    root.querySelector('#taskCount').textContent = `${list.length} task${list.length !== 1 ? 's' : ''} · sorted by ${sortKey}`;

    const cols = [
      { key: 'name', label: 'Task' },
      { key: 'assignee', label: 'Assignee' },
      { key: 'dept', label: 'Department' },
      { key: 'priority', label: 'Priority' },
      { key: 'status', label: 'Status' },
      { key: 'due', label: 'Due' },
      { key: 'progress', label: 'Progress' },
    ];

    root.querySelector('#tblWrap').innerHTML = `
      <table class="tbl">
        <thead><tr>
          ${cols.map((c) => `<th data-sort="${c.key}">${c.label} ${sortKey === c.key ? `<span class="sort-ind">${sortDir > 0 ? '▲' : '▼'}</span>` : ''}</th>`).join('')}
        </tr></thead>
        <tbody>
          ${list.length ? list.map((t) => rowHtml(t)).join('') : `<tr><td colspan="7"><div class="empty">${UI.icon('tasks')}<div>No tasks match your filters</div></div></td></tr>`}
        </tbody>
      </table>`;

    UI.hydrateIcons(root.querySelector('#tblWrap'));
    root.querySelectorAll('th[data-sort]').forEach((th) => th.onclick = () => {
      const k = th.getAttribute('data-sort');
      if (sortKey === k) sortDir *= -1; else { sortKey = k; sortDir = 1; }
      renderTable(root);
    });
    root.querySelectorAll('tr[data-task]').forEach((tr) => tr.onclick = (e) => {
      if (e.target.closest('.row-check')) return;
      UI.openTaskPane(tr.getAttribute('data-task'));
    });
  }

  function rowHtml(t) {
    const u = FD.userById(t.assignee);
    const overdue = FD.isOverdue(t);
    return `<tr data-task="${t.id}">
      <td>
        <div class="t-name">${t.name} ${t.recurring ? UI.icon('repeat') : ''} ${t.source === 'email' ? UI.icon('outlook') : ''}</div>
        <div class="t-meta">${t.id}${t.project ? ' · ' + (FD.projectById(t.project) || {}).name : ''}</div>
      </td>
      <td><div style="display:flex;align-items:center;gap:8px">${UI.avatar(t.assignee, 'sm')}<span>${u.name.split(' ')[0]}</span></div></td>
      <td>${UI.deptChip(t.dept)}</td>
      <td>${UI.priorityBadge(t.priority)}</td>
      <td>${UI.statusBadge(t.status)}</td>
      <td><span class="cell-due ${overdue ? 'overdue' : ''}">${FD.dueLabel(t.due)}</span></td>
      <td><div style="display:flex;align-items:center;gap:8px"><div class="progress-bar" style="width:70px"><i style="width:${t.progress}%"></i></div><span class="muted" style="font-size:11px">${t.progress}%</span></div></td>
    </tr>`;
  }

  function sortList(list) {
    const rank = { Critical: 0, High: 1, Medium: 2, Low: 3 };
    return list.sort((a, b) => {
      let av, bv;
      if (sortKey === 'priority') { av = rank[a.priority]; bv = rank[b.priority]; }
      else if (sortKey === 'assignee') { av = FD.userById(a.assignee).name; bv = FD.userById(b.assignee).name; }
      else if (sortKey === 'dept') { av = FD.deptById(a.dept).name; bv = FD.deptById(b.dept).name; }
      else { av = a[sortKey]; bv = b[sortKey]; }
      if (av < bv) return -1 * sortDir;
      if (av > bv) return 1 * sortDir;
      return 0;
    });
  }

  function optSel(v, label, sel) { return `<option value="${v}" ${v === sel ? 'selected' : ''}>${label}</option>`; }

  // Called by other views (e.g. the clickable dashboard KPI cards) to open
  // Tasks pre-filtered. Resets all filters first, then applies the patch.
  function setFilter(patch) {
    Object.assign(filters, { q: '', dept: 'all', status: 'all', priority: 'all', assignee: 'all' }, patch || {});
  }

  window.FD_VIEWS = window.FD_VIEWS || {};
  window.FD_VIEWS.tasks = { title: 'Tasks', render, setFilter };
})();
