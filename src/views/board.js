/* ============================================================
   View: Board — Kanban with drag & drop
   ============================================================ */
(function () {
  const FD = window.FD, UI = window.FD_UI;
  let deptFilter = 'all';
  const COLS = [
    { status: 'Open', color: '#8a8886' },
    { status: 'In Progress', color: '#0078d4' },
    { status: 'Waiting for Approval', color: '#c19c00' },
    { status: 'On Hold', color: '#8764b8' },
    { status: 'Completed', color: '#107c10' },
  ];

  function render(root) {
    root.innerHTML = `
      <div class="page">
        <div class="page-head">
          <div><h1 class="page-title">Board</h1><div class="page-sub">Drag cards between columns to update status · syncs to Microsoft Planner</div></div>
          <div class="page-actions">
            <select class="select" id="bDept"><option value="all">All departments</option>${FD.data.departments.map((d) => `<option value="${d.id}">${d.name}</option>`).join('')}</select>
            <button class="btn primary" id="bNew">${UI.icon('add')} New Task</button>
          </div>
        </div>
        <div class="kanban" id="kanban"></div>
      </div>`;
    UI.hydrateIcons(root);
    root.querySelector('#bNew').onclick = () => UI.openTaskPane();
    root.querySelector('#bDept').onchange = (e) => { deptFilter = e.target.value; renderBoard(root); };
    renderBoard(root);
    FD.onView('tasks:changed', () => renderBoard(root));
  }

  function renderBoard(root) {
    const tasks = FD.visibleTasks().filter((t) => deptFilter === 'all' || t.dept === deptFilter);
    root.querySelector('#kanban').innerHTML = COLS.map((col) => {
      const items = tasks.filter((t) => statusGroup(t.status) === col.status);
      return `
        <div class="kcol">
          <div class="kcol-head"><span class="kdot" style="background:${col.color}"></span>
            <span class="ktitle">${col.status}</span><span class="kcount">${items.length}</span></div>
          <div class="kcol-body" data-status="${col.status}">
            ${items.map((t) => cardHtml(t)).join('')}
          </div>
        </div>`;
    }).join('');
    UI.hydrateIcons(root.querySelector('#kanban'));
    wireDnd(root);
  }

  function statusGroup(s) {
    if (s === 'Delayed') return 'In Progress';
    return s;
  }

  function cardHtml(t) {
    const overdue = FD.isOverdue(t);
    return `<div class="kcard" draggable="true" data-task="${t.id}">
      <div class="kcard-top">${UI.priorityBadge(t.priority)} ${t.recurring ? `<span class="chip" style="font-size:10px">${UI.icon('repeat')}</span>` : ''}</div>
      <div class="kcard-title">${t.name}</div>
      <div style="display:flex;gap:6px;flex-wrap:wrap">${UI.deptChip(t.dept)}${overdue ? `<span class="badge pri-Critical" style="font-size:10px">${UI.icon('clock')} Overdue</span>` : ''}</div>
      <div class="progress-mini"><i style="width:${t.progress}%"></i></div>
      <div class="kcard-foot">
        <div class="kcard-meta">
          <span>${UI.icon('calendar')}${FD.dueLabel(t.due)}</span>
          ${t.attachments && t.attachments.length ? `<span>${UI.icon('paperclip')}${t.attachments.length}</span>` : ''}
        </div>
        ${UI.avatar(t.assignee, 'sm')}
      </div>
    </div>`;
  }

  function wireDnd(root) {
    let dragId = null;
    root.querySelectorAll('.kcard').forEach((card) => {
      card.addEventListener('dragstart', () => { dragId = card.getAttribute('data-task'); card.classList.add('dragging'); });
      card.addEventListener('dragend', () => card.classList.remove('dragging'));
      card.addEventListener('click', () => UI.openTaskPane(card.getAttribute('data-task')));
    });
    root.querySelectorAll('.kcol-body').forEach((body) => {
      body.addEventListener('dragover', (e) => { e.preventDefault(); body.classList.add('drag-over'); });
      body.addEventListener('dragleave', () => body.classList.remove('drag-over'));
      body.addEventListener('drop', (e) => {
        e.preventDefault(); body.classList.remove('drag-over');
        const newStatus = body.getAttribute('data-status');
        const t = FD.getTask(dragId);
        if (t && t.status !== newStatus) {
          FD.updateTask(dragId, { status: newStatus });
          const msgs = {
            'Completed': { title: 'Task completed 🎉', sub: 'Team notified in Teams · reviewer informed' },
            'Waiting for Approval': { title: 'Submitted for approval', sub: 'Approval request emailed via Outlook' },
          };
          UI.toast(msgs[newStatus] || { title: 'Moved to ' + newStatus, sub: 'Synced to Microsoft Planner' });
        }
      });
    });
  }

  window.FD_VIEWS = window.FD_VIEWS || {};
  window.FD_VIEWS.board = { title: 'Board', render };
})();
