/* ============================================================
   View: Reports — team / department / management
   ============================================================ */
(function () {
  const FD = window.FD, UI = window.FD_UI, C = window.FD_CHARTS;
  let tab = 'team';

  function render(root) {
    root.innerHTML = `
      <div class="page">
        <div class="page-head">
          <div><h1 class="page-title">Reports</h1><div class="page-sub">Productivity, department and management reporting</div></div>
          <div class="page-actions">
            <button class="btn" id="exXl">${UI.icon('download')} Excel</button>
            <button class="btn" id="exPdf">${UI.icon('download')} PDF</button>
            <button class="btn" id="exPpt">${UI.icon('download')} PowerPoint</button>
            <button class="btn primary" id="exPbi">${UI.icon('report')} Power BI</button>
          </div>
        </div>
        <div class="seg" id="repTabs" style="margin-bottom:18px">
          <button data-tab="team" class="${tab === 'team' ? 'active' : ''}">Team Reports</button>
          <button data-tab="dept" class="${tab === 'dept' ? 'active' : ''}">Department Reports</button>
          <button data-tab="mgmt" class="${tab === 'mgmt' ? 'active' : ''}">Management Reports</button>
        </div>
        <div id="repBody"></div>
      </div>`;
    UI.hydrateIcons(root);
    root.querySelectorAll('#repTabs button').forEach((b) => b.onclick = () => { tab = b.getAttribute('data-tab'); render(root); });
    ['exXl', 'Excel'].length;
    root.querySelector('#exXl').onclick = () => exp('Excel', 'xlsx');
    root.querySelector('#exPdf').onclick = () => exp('PDF', 'pdf');
    root.querySelector('#exPpt').onclick = () => exp('PowerPoint', 'pptx');
    root.querySelector('#exPbi').onclick = () => UI.toast({ title: 'Opening Power BI', sub: 'Embedded executive dashboard', icon: 'report' });
    paint(root);
  }

  function exp(name, ext) { UI.toast({ title: 'Exported to ' + name, sub: 'Report_' + tab + '.' + ext + ' saved to OneDrive', icon: 'download' }); }

  function paint(root) {
    const host = root.querySelector('#repBody');
    if (tab === 'team') host.innerHTML = teamReport();
    else if (tab === 'dept') host.innerHTML = deptReport();
    else host.innerHTML = mgmtReport();
    UI.hydrateIcons(host);
  }

  function teamReport() {
    const wl = FD.workloadByUser();
    const m = FD.metrics();
    return `
      <div class="grid cols-3" style="margin-bottom:16px">
        <div class="kpi"><div class="kpi-label">Completion Rate</div><div class="kpi-val">${m.completionRate}%</div><div class="kpi-trend up">${UI.icon('arrowUp')}+6% vs last month</div></div>
        <div class="kpi"><div class="kpi-label">Avg. Tasks / Person</div><div class="kpi-val">${(FD.state.tasks.length / FD.data.users.length).toFixed(1)}</div><div class="kpi-trend flat">balanced</div></div>
        <div class="kpi"><div class="kpi-label">Delayed Tasks</div><div class="kpi-val" style="color:var(--critical)">${m.delayed}</div><div class="kpi-trend down">${UI.icon('arrowDown')}-2 this week</div></div>
      </div>
      <div class="grid cols-2">
        <div class="card"><div class="card-head"><div class="card-title">Productivity by Member</div></div>
          ${C.bars({ height: 200, data: wl.slice(0, 7).map((w) => ({ label: w.user.name.split(' ')[0], value: w.count, color: w.overdue ? getCss('--high') : getCss('--ms-blue') })) })}
        </div>
        <div class="card"><div class="card-head"><div class="card-title">Member Detail</div></div>
          <table class="tbl" style="border:0"><thead><tr><th>Member</th><th>Active</th><th>Overdue</th><th>Load</th></tr></thead><tbody>
            ${wl.map((w) => `<tr><td><div style="display:flex;gap:8px;align-items:center">${UI.avatar(w.user.id, 'sm')}${w.user.name}</div></td>
              <td>${w.count}</td><td>${w.overdue ? `<span style="color:var(--critical);font-weight:600">${w.overdue}</span>` : '0'}</td>
              <td><span class="badge ${w.count >= 4 ? 'pri-High' : 'pri-Low'}">${w.count >= 4 ? 'High' : 'Normal'}</span></td></tr>`).join('')}
          </tbody></table>
        </div>
      </div>`;
  }

  function deptReport() {
    const stats = FD.deptStats();
    return `
      <div class="card" style="margin-bottom:16px"><div class="card-head"><div class="card-title">Department Performance</div></div>
        ${C.groupedBars({ height: 200, aColor: getCss('--ms-blue'), bColor: getCss('--low'),
          data: stats.map((s) => ({ label: s.name.split(' ')[0].slice(0, 5), a: s.total, b: s.done })) })}
        <div class="legend" style="margin-top:8px"><span class="legend-item"><span class="sw" style="background:var(--ms-blue)"></span>Total</span><span class="legend-item"><span class="sw" style="background:var(--low)"></span>Completed</span></div>
      </div>
      <div class="tbl-wrap"><table class="tbl"><thead><tr><th>Department</th><th>Total</th><th>Completed</th><th>Delayed</th><th>Completion</th><th>Pending Approvals</th><th>Utilization</th></tr></thead><tbody>
        ${stats.map((s) => {
          const pend = FD.state.tasks.filter((t) => t.dept === s.id && t.status === 'Waiting for Approval').length;
          const util = Math.min(100, 40 + s.total * 6);
          return `<tr><td><div style="display:flex;gap:8px;align-items:center"><span style="width:10px;height:10px;border-radius:3px;background:${s.color}"></span><b>${s.name}</b></div></td>
            <td>${s.total}</td><td>${s.done}</td><td style="${s.late ? 'color:var(--critical);font-weight:600' : ''}">${s.late}</td>
            <td><div style="display:flex;align-items:center;gap:8px"><div class="progress-bar" style="width:80px"><i style="width:${s.rate}%;background:${s.color}"></i></div>${s.rate}%</div></td>
            <td>${pend || '—'}</td><td>${util}%</td></tr>`;
        }).join('')}
      </tbody></table></div>`;
  }

  function mgmtReport() {
    const m = FD.metrics();
    return `
      <div class="grid cols-2" style="margin-bottom:16px">
        <div class="card" style="display:flex;flex-direction:column;align-items:center"><div class="card-head" style="width:100%"><div class="card-title">SLA Compliance</div></div>
          ${C.gauge(m.sla, 'On-time delivery')}
          <div class="muted" style="font-size:12px;margin-top:8px">Target: 90% · ${m.sla >= 90 ? 'Meeting target' : 'Below target'}</div>
        </div>
        <div class="card"><div class="card-head"><div class="card-title">Strategic Projects</div></div>
          ${FD.data.projects.map((p) => `<div style="margin-bottom:14px">
            <div style="display:flex;justify-content:space-between;font-size:13px;margin-bottom:5px"><span style="font-weight:600">${p.name}</span><span class="muted">${p.progress}%</span></div>
            <div class="progress-bar"><i style="width:${p.progress}%;background:${p.color}"></i></div></div>`).join('')}
        </div>
      </div>
      <div class="card"><div class="card-head"><div><div class="card-title">Monthly Summary</div><div class="card-sub">June 2026 · auto-generated for leadership</div></div>
        <button class="btn sm">${UI.icon('outlook')} Email to board</button></div>
        <div class="grid cols-3">
          <div class="stat-line"><span class="muted">Total tasks managed</span><b>${m.total}</b></div>
          <div class="stat-line"><span class="muted">Completed this period</span><b>${m.completed}</b></div>
          <div class="stat-line"><span class="muted">Completion rate</span><b>${m.completionRate}%</b></div>
          <div class="stat-line"><span class="muted">Overdue / delayed</span><b style="color:var(--critical)">${m.delayed}</b></div>
          <div class="stat-line"><span class="muted">Awaiting approval</span><b>${m.waiting}</b></div>
          <div class="stat-line"><span class="muted">SLA compliance</span><b>${m.sla}%</b></div>
        </div>
      </div>`;
  }

  function getCss(v) { return getComputedStyle(document.documentElement).getPropertyValue(v).trim(); }

  window.FD_VIEWS = window.FD_VIEWS || {};
  window.FD_VIEWS.reports = { title: 'Reports', render };
})();
