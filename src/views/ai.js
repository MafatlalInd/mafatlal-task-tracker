/* ============================================================
   View: AI Assistant — Meeting MOM, Email→Task, Workload analysis
   ============================================================ */
(function () {
  const FD = window.FD, UI = window.FD_UI;
  let tab = 'meeting';

  function render(root) {
    root.innerHTML = `
      <div class="page">
        <div class="page-head">
          <div><h1 class="page-title sparkle-grad">${UI.icon('sparkle')} AI Assistant</h1>
            <div class="page-sub">Turn meetings and emails into action — powered by your Microsoft 365 data</div></div>
        </div>
        <div class="seg" id="aiTabs" style="margin-bottom:18px">
          <button data-tab="meeting" class="${tab === 'meeting' ? 'active' : ''}">${UI.icon('users')} Meeting Assistant</button>
          <button data-tab="email" class="${tab === 'email' ? 'active' : ''}">${UI.icon('outlook')} Email Assistant</button>
          <button data-tab="workload" class="${tab === 'workload' ? 'active' : ''}">${UI.icon('report')} Workload Analyzer</button>
        </div>
        <div id="aiBody"></div>
      </div>`;
    UI.hydrateIcons(root);
    root.querySelectorAll('#aiTabs button').forEach((b) => b.onclick = () => { tab = b.getAttribute('data-tab'); render(root); });
    if (tab === 'meeting') meeting(root);
    else if (tab === 'email') email(root);
    else workload(root);
  }

  // ---- Meeting Assistant ----
  function meeting(root) {
    const mtg = FD.data.aiMeeting;
    const host = root.querySelector('#aiBody');
    if (!mtg.title && !(mtg.actionItems && mtg.actionItems.length)) {
      host.innerHTML = `<div class="banner ai" style="margin-bottom:18px">${UI.icon('sparkle')}
        <div>After every Outlook/Teams meeting, the Tracker generates minutes, extracts action items, and lets you assign them as tasks in one click.</div></div>
        <div class="card"><div class="empty">${UI.icon('users')}<div style="font-weight:600;color:var(--text-2)">No meeting connected yet</div>
        <div style="font-size:12px;margin-top:4px">Connect Outlook/Teams to auto-generate minutes &amp; action items.</div></div></div>`;
      UI.hydrateIcons(host); return;
    }
    host.innerHTML = `
      <div class="banner ai" style="margin-bottom:18px">${UI.icon('sparkle')}
        <div>After every Outlook/Teams meeting, the Tracker generates minutes, extracts action items, and lets you assign them as tasks in one click.</div></div>
      <div class="grid cols-12">
        <div class="card">
          <div class="card-head"><div><div class="card-title">${mtg.title}</div><div class="card-sub">${FD.dueLabel(mtg.date)} · ${mtg.attendees.length} attendees</div></div>
            <span class="chip" style="color:var(--ms-blue)">${UI.icon('sparkle')} AI-generated MOM</span></div>
          <div class="pane-section-title">Summary</div>
          <p style="font-size:13px;line-height:1.6;color:var(--text-2)">${mtg.summary}</p>
          <div class="pane-section-title">Extracted action items</div>
          <div id="actionItems">
            ${mtg.actionItems.map((a, i) => `
              <div class="attach" style="align-items:flex-start" data-ai="${i}">
                <span style="margin-top:2px">${UI.priorityBadge(a.priority)}</span>
                <div style="flex:1">
                  <div style="font-weight:600;font-size:13px">${a.text}</div>
                  <div class="muted" style="font-size:11px;margin-top:4px;display:flex;align-items:center;gap:6px">${UI.avatar(a.owner, 'sm')} ${FD.userById(a.owner).name} · due ${FD.dueLabel(a.due)}</div>
                </div>
                <button class="btn sm" data-create="${i}">${UI.icon('add')} Create task</button>
              </div>`).join('')}
          </div>
        </div>
        <div class="card" style="height:fit-content">
          <div class="card-title" style="margin-bottom:12px">One-click actions</div>
          <button class="btn primary" id="createAll" style="width:100%;justify-content:center;margin-bottom:10px">${UI.icon('bolt')} Create all ${mtg.actionItems.length} tasks</button>
          <button class="btn" id="emailMom" style="width:100%;justify-content:center;margin-bottom:10px">${UI.icon('outlook')} Email MOM to attendees</button>
          <button class="btn" id="postTeams" style="width:100%;justify-content:center">${UI.icon('teams')} Post to Teams channel</button>
          <div class="divider"></div>
          <div class="card-sub" style="margin-bottom:8px">Attendees</div>
          ${mtg.attendees.map((id) => `<div class="list-row" style="padding:7px 0">${UI.avatar(id, 'sm')}<span style="font-size:13px">${FD.userById(id).name}</span></div>`).join('')}
        </div>
      </div>`;
    UI.hydrateIcons(host);
    host.querySelectorAll('[data-create]').forEach((b) => b.onclick = () => {
      const a = mtg.actionItems[+b.getAttribute('data-create')];
      FD.createTask({ name: a.text, assignee: a.owner, priority: a.priority, due: a.due, dept: FD.userById(a.owner).dept, desc: 'From meeting: ' + mtg.title, source: 'meeting' });
      b.outerHTML = `<span class="badge" style="background:rgba(16,124,16,.12);color:var(--ok)">${UI.icon('check')} Created</span>`;
      UI.hydrateIcons(host);
      UI.toast({ title: 'Task created', sub: FD.userById(a.owner).name + ' notified in Teams' });
    });
    host.querySelector('#createAll').onclick = () => {
      mtg.actionItems.forEach((a) => FD.createTask({ name: a.text, assignee: a.owner, priority: a.priority, due: a.due, dept: FD.userById(a.owner).dept, source: 'meeting' }));
      UI.toast({ title: mtg.actionItems.length + ' tasks created', sub: 'All owners notified · deadlines synced to Outlook', kind: 'ok' });
      meeting(root);
    };
    host.querySelector('#emailMom').onclick = () => UI.toast({ title: 'MOM emailed', sub: 'Sent to all attendees via Outlook', icon: 'outlook' });
    host.querySelector('#postTeams').onclick = () => UI.toast({ title: 'Posted to Teams', sub: 'Shared in the meeting channel', icon: 'teams' });
  }

  // ---- Email Assistant ----
  function email(root) {
    const host = root.querySelector('#aiBody');
    host.innerHTML = `
      <div class="banner ai" style="margin-bottom:18px">${UI.icon('sparkle')}
        <div>The Tracker scans your Outlook inbox, detects actionable emails, and suggests a task with assignee, priority and due date — review and create.</div></div>
      ${FD.data.emails.length ? `<div class="grid cols-2" id="emailGrid">${FD.data.emails.map((e) => emailCard(e)).join('')}</div>`
        : `<div class="card"><div class="empty">${UI.icon('inbox')}<div style="font-weight:600;color:var(--text-2)">No inbox connected yet</div><div style="font-size:12px;margin-top:4px">Connect Outlook to detect actionable emails and turn them into tasks.</div></div></div>`}`;
    UI.hydrateIcons(host);
    FD.data.emails.forEach((e) => {
      const btn = host.querySelector(`#mk-${e.id}`);
      if (btn) btn.onclick = () => {
        FD.createTask({
          name: e.subject, desc: e.preview, assignee: e.suggest.assignee, priority: e.suggest.priority,
          due: e.suggest.due, dept: FD.userById(e.suggest.assignee).dept, source: 'email',
          emailSubject: e.subject, emailFrom: e.from, emailSnippet: e.preview,
        });
        host.querySelector(`#card-${e.id}`).style.opacity = '.5';
        btn.outerHTML = `<span class="badge" style="background:rgba(16,124,16,.12);color:var(--ok)">${UI.icon('check')} Task created</span>`;
        UI.hydrateIcons(host);
        UI.toast({ title: 'Task created from email', sub: 'Conversation attached · ' + FD.userById(e.suggest.assignee).name + ' assigned' });
      };
    });
  }

  function emailCard(e) {
    return `<div class="card" id="card-${e.id}">
      <div style="display:flex;align-items:center;gap:10px;margin-bottom:12px">
        <span class="av" style="background:var(--ms-blue)">${e.from.split(' ').map((x) => x[0]).join('')}</span>
        <div style="flex:1"><div style="font-weight:600;font-size:13px">${e.from} ${e.unread ? '<span style="width:7px;height:7px;background:var(--ms-blue);border-radius:50%;display:inline-block;margin-left:4px"></span>' : ''}</div>
          <div class="muted" style="font-size:11px">${e.time} · ${UI.icon('outlook')} Outlook</div></div>
      </div>
      <div style="font-weight:600;font-size:14px;margin-bottom:6px">${e.subject}</div>
      <div class="muted" style="font-size:13px;line-height:1.5;margin-bottom:14px">${e.preview}</div>
      <div class="banner ai" style="margin-bottom:12px;font-size:12px">${UI.icon('sparkle')}
        <div><b>AI suggestion:</b> Assign to ${FD.userById(e.suggest.assignee).name.split(' ')[0]} · ${e.suggest.priority} priority · due ${FD.dueLabel(e.suggest.due)}</div></div>
      <button class="btn primary sm" id="mk-${e.id}" style="width:100%;justify-content:center">${UI.icon('add')} Create task from email</button>
    </div>`;
  }

  // ---- Workload Analyzer ----
  function workload(root) {
    const wl = FD.workloadByUser();
    const overloaded = wl.filter((w) => w.count >= 4 || w.overdue > 0);
    const gaps = FD.data.users.filter((u) => !wl.find((w) => w.user.id === u.id) || wl.find((w) => w.user.id === u.id).count <= 1);
    const host = root.querySelector('#aiBody');
    host.innerHTML = `
      <div class="banner ai" style="margin-bottom:18px">${UI.icon('sparkle')}
        <div>The analyzer continuously scans assignments to flag overloaded people, missed deadlines, resource gaps and priority conflicts — and recommends rebalancing.</div></div>
      <div class="grid cols-3" style="margin-bottom:16px">
        <div class="kpi"><div class="kpi-top"><span class="kpi-icon" style="background:rgba(202,80,16,.12);color:var(--high)">${UI.icon('flag')}</span></div><div class="kpi-val">${overloaded.length}</div><div class="kpi-label">Overloaded employees</div></div>
        <div class="kpi"><div class="kpi-top"><span class="kpi-icon" style="background:rgba(209,52,56,.12);color:var(--critical)">${UI.icon('clock')}</span></div><div class="kpi-val">${wl.reduce((s, w) => s + w.overdue, 0)}</div><div class="kpi-label">Missed deadlines</div></div>
        <div class="kpi"><div class="kpi-top"><span class="kpi-icon" style="background:rgba(16,124,16,.12);color:var(--ok)">${UI.icon('users')}</span></div><div class="kpi-val">${gaps.length}</div><div class="kpi-label">Available capacity</div></div>
      </div>
      <div class="grid cols-2">
        <div class="card"><div class="card-head"><div class="card-title">${UI.icon('flag')} Needs rebalancing</div></div>
          ${overloaded.map((w) => `<div class="list-row">
            ${UI.avatar(w.user.id)}
            <div style="flex:1"><div style="font-weight:600;font-size:13px">${w.user.name}</div>
              <div class="muted" style="font-size:11px">${w.count} active${w.overdue ? ` · <span style="color:var(--critical)">${w.overdue} overdue</span>` : ''}</div></div>
            <button class="btn sm" data-rebalance="${w.user.id}">${UI.icon('sparkle')} Suggest</button>
          </div>`).join('') || '<div class="empty">Workload is balanced</div>'}
        </div>
        <div class="card"><div class="card-head"><div class="card-title">${UI.icon('bolt')} AI recommendations</div></div>
          ${recommendations(overloaded, gaps).map((r) => `<div class="list-row" style="align-items:flex-start">
            <span class="notif-ic" style="background:var(--ms-blue-wash);color:var(--ms-blue);width:28px;height:28px">${UI.icon(r.icon)}</span>
            <div style="font-size:13px;line-height:1.5">${r.text}</div></div>`).join('')}
        </div>
      </div>`;
    UI.hydrateIcons(host);
    host.querySelectorAll('[data-rebalance]').forEach((b) => b.onclick = () => {
      const u = FD.userById(b.getAttribute('data-rebalance'));
      const target = gaps[0] ? gaps[0].name.split(' ')[0] : 'a teammate';
      UI.toast({ title: 'Rebalance suggested', sub: `Move 1 task from ${u.name.split(' ')[0]} to ${target}`, icon: 'sparkle' });
    });
  }

  function recommendations(overloaded, gaps) {
    const recs = [];
    if (overloaded[0]) recs.push({ icon: 'arrowDown', text: `<b>${overloaded[0].user.name.split(' ')[0]}</b> has ${overloaded[0].count} active tasks. Consider reassigning lower-priority items to balance load.` });
    if (gaps[0]) recs.push({ icon: 'users', text: `<b>${gaps[0].name.split(' ')[0]}</b> has spare capacity and can take on additional work this week.` });
    recs.push({ icon: 'clock', text: 'Two Critical tasks share the same deadline tomorrow — stagger one to reduce risk.' });
    recs.push({ icon: 'outlook', text: 'Schedule a 15-min Outlook check-in for delayed tasks to unblock them early.' });
    return recs;
  }

  window.FD_VIEWS = window.FD_VIEWS || {};
  window.FD_VIEWS.ai = { title: 'AI Assistant', render };
})();
