/* ============================================================
   View: Timeline & Gantt — project roadmap
   ============================================================ */
(function () {
  const FD = window.FD, UI = window.FD_UI;
  let mode = 'projects'; // 'projects' | 'tasks'

  function render(root) {
    root.innerHTML = `
      <div class="page">
        <div class="page-head">
          <div><h1 class="page-title">Timeline &amp; Gantt</h1><div class="page-sub">Project roadmap and department planning</div></div>
          <div class="page-actions">
            <div class="seg" id="modeSeg">
              <button data-mode="projects" class="${mode === 'projects' ? 'active' : ''}">${UI.icon('timeline')} Projects</button>
              <button data-mode="tasks" class="${mode === 'tasks' ? 'active' : ''}">${UI.icon('tasks')} Tasks</button>
            </div>
          </div>
        </div>
        <div id="ganttHost"></div>
      </div>`;
    UI.hydrateIcons(root);
    root.querySelectorAll('#modeSeg button').forEach((b) => b.onclick = () => { mode = b.getAttribute('data-mode'); render(root); });
    paint(root);
  }

  function paint(root) {
    // Window: 30 days before today to 75 days after, shown by month
    const start = new Date(FD.data.TODAY.getFullYear(), FD.data.TODAY.getMonth() - 1, 1);
    const end = new Date(FD.data.TODAY.getFullYear(), FD.data.TODAY.getMonth() + 3, 0);
    const totalDays = Math.round((end - start) / 86400000);

    // Build month headers
    const months = [];
    let cur = new Date(start);
    while (cur <= end) {
      const mStart = new Date(cur.getFullYear(), cur.getMonth(), 1);
      const mEnd = new Date(cur.getFullYear(), cur.getMonth() + 1, 0);
      const from = Math.max(0, Math.round((mStart - start) / 86400000));
      const to = Math.min(totalDays, Math.round((mEnd - start) / 86400000));
      months.push({ label: mStart.toLocaleDateString('en-US', { month: 'short', year: '2-digit' }), pct: ((to - from) / totalDays) * 100 });
      cur = new Date(cur.getFullYear(), cur.getMonth() + 1, 1);
    }

    const pos = (isoDate) => {
      const dt = new Date(isoDate + 'T00:00:00');
      return Math.max(0, Math.min(100, ((dt - start) / 86400000 / totalDays) * 100));
    };
    const todayPct = pos(FD.data.iso(FD.data.TODAY));

    let rows;
    if (mode === 'projects') {
      rows = FD.data.projects.map((p) => ({
        label: p.name, sub: FD.deptById(p.dept).name, color: p.color,
        left: pos(p.start), width: pos(p.end) - pos(p.start), fill: p.progress, text: p.progress + '%',
      }));
    } else {
      rows = FD.visibleTasks().filter((t) => t.status !== 'Completed').slice(0, 14).map((t) => {
        const dueP = pos(t.due);
        const startP = Math.max(0, dueP - 8); // synthesize a span for visualization
        return {
          label: t.name, sub: FD.userById(t.assignee).name.split(' ')[0], color: FD.deptById(t.dept).color,
          left: startP, width: Math.max(4, dueP - startP), fill: t.progress, text: t.priority, id: t.id,
          overdue: FD.isOverdue(t),
        };
      });
    }

    root.querySelector('#ganttHost').innerHTML = `
      <div class="gantt"><div class="gantt-scroll"><div style="min-width:960px">
        <div class="gantt-head">
          <div class="gantt-label" style="font-weight:600;font-size:12px;color:var(--text-2)">${mode === 'projects' ? 'Project' : 'Task'}</div>
          <div style="flex:1;display:flex;position:relative">
            ${months.map((m) => `<div class="gantt-month" style="flex:0 0 ${m.pct}%">${m.label}</div>`).join('')}
          </div>
        </div>
        ${rows.map((r) => `
          <div class="gantt-row" ${r.id ? `data-task="${r.id}"` : ''} style="${r.id ? 'cursor:pointer' : ''}">
            <div class="gantt-label">
              <div style="font-weight:600;font-size:13px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${r.label}</div>
              <div class="muted" style="font-size:11px">${r.sub}</div>
            </div>
            <div class="gantt-track">
              <div class="gantt-today" style="left:${todayPct}%"></div>
              <div class="gantt-bar" style="left:${r.left}%;width:${r.width}%;background:${r.overdue ? 'var(--critical)' : r.color}">
                <div class="bar-fill" style="width:${100 - r.fill}%;right:0;left:auto"></div>
                <span style="position:relative;z-index:1">${r.text}</span>
              </div>
            </div>
          </div>`).join('')}
      </div></div>
      <div style="padding:10px 14px;border-top:1px solid var(--stroke);display:flex;gap:18px;font-size:12px;color:var(--text-2)">
        <span class="legend-item"><span style="width:14px;height:3px;background:var(--critical);display:inline-block"></span> Today</span>
        <span class="legend-item">Bars show ${mode === 'projects' ? 'project duration; shaded = remaining' : 'task window; red = overdue'}</span>
      </div></div>`;

    root.querySelectorAll('[data-task]').forEach((el) => el.onclick = () => UI.openTaskPane(el.getAttribute('data-task')));
  }

  window.FD_VIEWS = window.FD_VIEWS || {};
  window.FD_VIEWS.timeline = { title: 'Timeline', render };
})();
