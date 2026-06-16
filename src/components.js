/* ============================================================
   Mafatlal Digital Team Task Tracker — Shared UI components & helpers
   ============================================================ */
(function () {
  const FD = window.FD;

  // ---------- Icons (Fluent-style line icons) ----------
  // Clean, consistent line-icons (Lucide-style, 24px grid). Rendered medium-small.
  const P = {
    menu: 'M4 6h16M4 12h16M4 18h16',
    search: 'M11 19a8 8 0 1 0 0-16 8 8 0 0 0 0 16zM21 21l-4.3-4.3',
    add: 'M12 5v14M5 12h14',
    sparkle: 'M12 3l-1.9 5.8a2 2 0 0 1-1.3 1.3L3 12l5.8 1.9a2 2 0 0 1 1.3 1.3L12 21l1.9-5.8a2 2 0 0 1 1.3-1.3L21 12l-5.8-1.9a2 2 0 0 1-1.3-1.3zM5 3v4M19 17v4M3 5h4M17 19h4',
    theme: 'M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9z',
    bell: 'M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 0 1-3.46 0',
    dashboard: 'M3 3h7v9H3zM14 3h7v5h-7zM14 12h7v9h-7zM3 16h7v5H3z',
    tasks: 'M3 6l1.5 1.5L7 5M3 12l1.5 1.5L7 11M3 18l1.5 1.5L7 17M11 6h10M11 12h10M11 18h10',
    board: 'M5 3h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2zM9 4v16M15 4v16',
    calendar: 'M8 2v4M16 2v4M3 10h18M5 4h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z',
    timeline: 'M8 6h12M8 12h12M8 18h8M3.5 6h.01M3.5 12h.01M3.5 18h.01',
    approve: 'M9 12l2 2 4-4M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18z',
    megaphone: 'M3 11l16-5v12L3 13v-2zM11.6 16.8a3 3 0 1 1-5.8-1.6M19 8a3 3 0 0 1 0 6',
    doc: 'M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8zM14 2v6h6M9 13h6M9 17h6',
    report: 'M3 3v16a2 2 0 0 0 2 2h16M18 17V9M13 17V5M8 17v-3',
    plug: 'M9 2v6M15 2v6M7 8h10v3a5 5 0 0 1-10 0V8zM12 16v6',
    settings: 'M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z',
    clock: 'M12 6v6l4 2M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20z',
    check: 'M20 6L9 17l-5-5',
    close: 'M18 6L6 18M6 6l12 12',
    chevronD: 'M6 9l6 6 6-6',
    chevronR: 'M9 6l6 6-6 6',
    user: 'M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z',
    users: 'M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75',
    flag: 'M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1zM4 22v-7',
    edit: 'M12 20h9M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4z',
    trash: 'M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M10 11v6M14 11v6',
    paperclip: 'M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48',
    teams: 'M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z',
    outlook: 'M22 7l-10 6L2 7M4 5h16a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2z',
    onedrive: 'M17.5 19a4.5 4.5 0 1 0-1.3-8.8A7 7 0 1 0 4 16.9',
    shield: 'M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z',
    arrowUp: 'M12 19V5M5 12l7-7 7 7',
    arrowDown: 'M12 5v14M19 12l-7 7-7-7',
    filter: 'M22 3H2l8 9.46V19l4 2v-8.54z',
    download: 'M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3',
    grid: 'M3 3h7v7H3zM14 3h7v7h-7zM14 14h7v7h-7zM3 14h7v7H3z',
    repeat: 'M17 2l4 4-4 4M3 11v-1a4 4 0 0 1 4-4h14M7 22l-4-4 4-4M21 13v1a4 4 0 0 1-4 4H3',
    send: 'M22 2L11 13M22 2l-7 20-4-9-9-4z',
    play: 'M6 3l14 9-14 9z',
    link: 'M10 13a5 5 0 0 0 7 0l3-3a5 5 0 0 0-7-7l-1.5 1.5M14 11a5 5 0 0 0-7 0l-3 3a5 5 0 0 0 7 7l1.5-1.5',
    eye: 'M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7zM12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z',
    inbox: 'M22 12h-6l-2 3h-4l-2-3H2M5.45 5.11L2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z',
    bolt: 'M13 2L3 14h9l-1 8 10-12h-9z',
    folder: 'M20 20a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.69-.9L9.6 3.9A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2z',
    history: 'M3 12a9 9 0 1 0 3-6.7L3 8M3 3v5h5M12 7v5l4 2',
  };
  function icon(name, cls) {
    const dpath = P[name] || P.tasks;
    return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" class="fdi ${cls || ''}"><path d="${dpath}"/></svg>`;
  }
  // Replace [data-icon] placeholders inside a root element
  function hydrateIcons(root) {
    (root || document).querySelectorAll('[data-icon]').forEach((el) => {
      el.innerHTML = icon(el.getAttribute('data-icon'));
      el.removeAttribute('data-icon');
    });
  }

  // ---------- Small renderers ----------
  function avatar(userId, size) {
    const u = FD.userById(userId);
    if (!u) return '';
    return `<span class="av ${size || ''}" style="background:${u.color}" title="${u.name}">${u.initials}</span>`;
  }
  function avatarStack(ids, max) {
    max = max || 4;
    const shown = ids.slice(0, max);
    const extra = ids.length - shown.length;
    return `<span class="av-stack">${shown.map((id) => avatar(id, 'sm')).join('')}${
      extra > 0 ? `<span class="av sm" style="background:var(--text-3)">+${extra}</span>` : ''
    }</span>`;
  }
  function priorityBadge(p) {
    return `<span class="badge pri-${p}"><span class="dot"></span>${p}</span>`;
  }
  function statusBadge(s) {
    const cls = 'st-' + s.replace(/ for Approval/, '').replace(/\s/g, '-');
    return `<span class="st ${cls}"><span class="dot"></span>${s}</span>`;
  }
  function deptChip(deptId) {
    const dp = FD.deptById(deptId);
    if (!dp) return '';
    return `<span class="dept-chip" style="background:${dp.color}1a;color:${dp.color}">${dp.name}</span>`;
  }
  function fileBadge(type) {
    const map = { pptx: ['PPT', '#d24726'], xlsx: ['XLS', '#107c41'], docx: ['DOC', '#185abd'], pdf: ['PDF', '#d13438'], img: ['IMG', '#8764b8'], zip: ['ZIP', '#605e5c'] };
    const m = map[type] || ['FILE', '#605e5c'];
    return `<span class="file-ic" style="background:${m[1]}">${m[0]}</span>`;
  }

  // ---------- Toast ----------
  function toast(opts) {
    if (typeof opts === 'string') opts = { title: opts };
    const region = document.getElementById('toastRegion');
    const el = document.createElement('div');
    el.className = 'toast ' + (opts.kind || 'ok');
    const ic = opts.kind === 'err' ? 'close' : opts.kind === 'warn' ? 'flag' : opts.icon || 'check';
    el.innerHTML = `<span style="color:var(--${opts.kind === 'err' ? 'danger' : opts.kind === 'warn' ? 'warn' : 'ok'})">${icon(ic)}</span>
      <div class="toast-text"><div class="tt-title">${opts.title}</div>${opts.sub ? `<div class="tt-sub">${opts.sub}</div>` : ''}</div>`;
    region.appendChild(el);
    setTimeout(() => { el.style.transition = 'opacity .3s'; el.style.opacity = '0'; setTimeout(() => el.remove(), 300); }, opts.duration || 3600);
  }

  // ---------- Modal ----------
  function modal(opts) {
    const scrim = document.getElementById('modalScrim');
    const m = document.getElementById('modal');
    m.style.maxWidth = (opts.width || 560) + 'px';
    m.innerHTML = `
      <div class="modal-head"><div class="modal-title">${opts.title}</div>
        <button class="icon-btn" style="color:var(--text-2)" data-close>${icon('close')}</button></div>
      <div class="modal-body">${opts.body}</div>
      ${opts.foot ? `<div class="modal-foot">${opts.foot}</div>` : ''}`;
    scrim.classList.add('open');
    hydrateIcons(m);
    const close = () => scrim.classList.remove('open');
    m.querySelectorAll('[data-close]').forEach((b) => b.onclick = close);
    scrim.onclick = (e) => { if (e.target === scrim) close(); };
    if (opts.onMount) opts.onMount(m, close);
    return { close, el: m };
  }

  // ---------- Task pane (Outlook-style right panel) ----------
  function openTaskPane(taskId, presets) {
    const pane = document.getElementById('taskPane');
    const scrim = document.getElementById('paneScrim');
    const isNew = !taskId;
    const t = isNew ? Object.assign(draftTask(), presets || {}) : FD.getTask(taskId);
    if (!t) return;

    const users = FD.data.users, depts = FD.data.departments, projects = FD.data.projects;
    const opt = (arr, sel, valKey, labelKey) => arr.map((x) =>
      `<option value="${x[valKey]}" ${x[valKey] === sel ? 'selected' : ''}>${x[labelKey]}</option>`).join('');

    const overdue = FD.isOverdue(t);
    pane.innerHTML = `
      <div class="pane-head">
        <div style="flex:1">
          <div style="display:flex;align-items:center;gap:8px;margin-bottom:8px">
            ${deptChip(t.dept)} ${t.recurring ? `<span class="chip">${icon('repeat')} ${t.recurring}</span>` : ''}
            ${t.source === 'email' ? `<span class="chip" style="color:var(--ms-blue)">${icon('outlook')} From email</span>` : ''}
          </div>
          ${isNew
            ? `<input class="control" id="f-name" placeholder="Task name" value="${t.name}" style="font-size:18px;font-weight:600;border:0;padding:0;background:transparent"/>`
            : `<div style="font-size:18px;font-weight:600;line-height:1.3" id="f-name-static">${t.name}</div>`}
        </div>
        <button class="icon-btn" style="color:var(--text-2)" id="paneClose">${icon('close')}</button>
      </div>
      <div class="pane-body">
        ${overdue && !isNew ? `<div class="banner info" style="background:rgba(209,52,56,.08);border-color:rgba(209,52,56,.2);margin-bottom:16px;color:var(--critical)">${icon('clock')} This task is overdue. An escalation email has been queued in Outlook.</div>` : ''}

        ${t.source === 'email' && t.emailSubject ? `
          <div class="pane-section-title">Linked Outlook email</div>
          <div class="email-quote">
            <div class="eq-from">${t.emailFrom} · ${t.emailSubject}</div>
            <div style="margin-top:6px">${t.emailSnippet || ''}</div>
          </div>` : ''}

        <div class="pane-section-title">Details</div>
        <div class="field"><label>Description</label>
          <textarea id="f-desc" placeholder="Add a description…">${t.desc || ''}</textarea></div>

        <div class="field-row">
          <div class="field"><label>Assignee</label>
            <select class="select" id="f-assignee">${opt(users, t.assignee, 'id', 'name')}</select></div>
          <div class="field"><label>Reviewer / Approver</label>
            <select class="select" id="f-reviewer">${opt(users, t.reviewer, 'id', 'name')}</select></div>
        </div>
        <div class="field">
          <label>Also involves <span class="muted">(these members will also see this task)</span></label>
          <div class="collab-picker" id="f-collab">
            ${users.filter((u) => !u.isAdmin).map((u) => {
              const on = (t.collaborators || []).indexOf(u.id) > -1;
              return `<button type="button" class="collab-chip ${on ? 'on' : ''}" data-uid="${u.id}">
                <span class="av sm" style="background:${u.color}">${u.initials}</span>${u.name.split(' ')[0]}</button>`;
            }).join('')}
          </div>
        </div>
        <div class="field-row">
          <div class="field"><label>Department</label>
            <select class="select" id="f-dept">${opt(depts, t.dept, 'id', 'name')}</select></div>
          <div class="field"><label>Project</label>
            <select class="select" id="f-project"><option value="">— None —</option>${opt(projects, t.project, 'id', 'name')}</select></div>
        </div>
        <div class="field-row">
          <div class="field"><label>Priority</label>
            <select class="select" id="f-priority">${FD.data.PRI.map((p) => `<option ${p === t.priority ? 'selected' : ''}>${p}</option>`).join('')}</select></div>
          <div class="field"><label>Due date</label>
            <input type="date" class="input" id="f-due" value="${t.due}"/></div>
        </div>
        <div class="field-row">
          <div class="field"><label>Status</label>
            <select class="select" id="f-status">${FD.data.STATUS.map((s) => `<option ${s === t.status ? 'selected' : ''}>${s}</option>`).join('')}</select></div>
          <div class="field"><label>Progress: <span id="prog-val">${t.progress}%</span></label>
            <input type="range" id="f-progress" min="0" max="100" step="5" value="${t.progress}" style="width:100%"/></div>
        </div>

        <div class="field">
          <label style="display:flex;align-items:center;gap:8px;cursor:pointer">
            <input type="checkbox" id="f-calsync" ${t.calendarSync ? 'checked' : ''} style="accent-color:var(--ms-blue)"/>
            ${icon('calendar')} Sync deadline to Outlook Calendar</label>
        </div>

        ${t.attachments && t.attachments.length ? `
          <div class="pane-section-title">${icon('paperclip')} Attachments (OneDrive)</div>
          ${t.attachments.map((a) => `<div class="attach">${fileBadge(a.type)}
            <div style="flex:1"><div style="font-weight:600;font-size:13px">${a.name}</div>
            <div class="muted" style="font-size:11px">OneDrive · synced</div></div>
            <button class="icon-btn" style="color:var(--text-3)">${icon('download')}</button></div>`).join('')}` : ''}

        ${!isNew ? activityHtml(t) : ''}
      </div>
      <div class="pane-foot">
        ${isNew
          ? `<button class="btn primary" id="paneSave" style="flex:1">${icon('check')} Create task</button>
             <button class="btn subtle" id="paneCancel">Cancel</button>`
          : `<button class="btn primary" id="paneSave" style="flex:1">${icon('check')} Save changes</button>
             ${t.status === 'In Progress' || t.status === 'Open'
                ? `<button class="btn" id="paneSubmit">${icon('send')} Submit for approval</button>` : ''}
             <button class="btn subtle" id="paneDelete" title="Delete">${icon('trash')}</button>`}
      </div>`;

    hydrateIcons(pane);
    scrim.classList.add('open');
    pane.classList.add('open');

    const close = () => { pane.classList.remove('open'); scrim.classList.remove('open'); };
    pane.querySelector('#paneClose').onclick = close;
    scrim.onclick = close;
    if (pane.querySelector('#paneCancel')) pane.querySelector('#paneCancel').onclick = close;

    const prog = pane.querySelector('#f-progress');
    if (prog) prog.oninput = () => pane.querySelector('#prog-val').textContent = prog.value + '%';

    // collaborator chips toggle
    pane.querySelectorAll('#f-collab .collab-chip').forEach((chip) => {
      chip.onclick = () => chip.classList.toggle('on');
    });
    const collectCollab = () => Array.from(pane.querySelectorAll('#f-collab .collab-chip.on')).map((c) => c.getAttribute('data-uid'));

    const collect = () => ({
      name: isNew ? (pane.querySelector('#f-name').value || 'Untitled task') : t.name,
      desc: pane.querySelector('#f-desc').value,
      assignee: pane.querySelector('#f-assignee').value,
      reviewer: pane.querySelector('#f-reviewer').value,
      collaborators: collectCollab(),
      dept: pane.querySelector('#f-dept').value,
      project: pane.querySelector('#f-project').value || null,
      priority: pane.querySelector('#f-priority').value,
      due: pane.querySelector('#f-due').value,
      status: pane.querySelector('#f-status').value,
      progress: parseInt(pane.querySelector('#f-progress').value, 10),
      calendarSync: pane.querySelector('#f-calsync').checked,
    });

    pane.querySelector('#paneSave').onclick = () => {
      const patch = collect();
      if (isNew) {
        FD.createTask(patch);
        toast({ title: 'Task created', sub: patch.calendarSync ? 'Synced to Outlook Calendar · assignee notified in Teams' : 'Assignee notified in Teams', icon: 'add' });
      } else {
        FD.updateTask(t.id, patch);
        toast({ title: 'Task updated', sub: 'Changes synced across Microsoft 365' });
      }
      close();
    };
    const submitBtn = pane.querySelector('#paneSubmit');
    if (submitBtn) submitBtn.onclick = () => {
      FD.updateTask(t.id, Object.assign(collect(), { status: 'Waiting for Approval' }));
      toast({ title: 'Submitted for approval', sub: 'Approval email sent to ' + FD.userById(t.reviewer).name + ' via Outlook', kind: 'ok', icon: 'send' });
      close();
    };
    const delBtn = pane.querySelector('#paneDelete');
    if (delBtn) delBtn.onclick = () => { FD.deleteTask(t.id); toast({ title: 'Task deleted', kind: 'warn' }); close(); };
  }

  function draftTask() {
    return {
      name: '', desc: '', assignee: FD.state.currentUser, reviewer: 'u9',
      dept: FD.userById(FD.state.currentUser).dept, project: null, priority: 'Medium',
      due: FD.data.iso(new Date(FD.data.TODAY.getTime() + 5 * 86400000)),
      status: 'Open', progress: 0, calendarSync: true, attachments: [], recurring: null, source: 'manual',
    };
  }

  function activityHtml(t) {
    const acts = [
      { who: t.assignee, txt: 'updated progress to ' + t.progress + '%', time: '2h ago' },
      { who: 'u9', txt: 'set priority to ' + t.priority, time: 'Yesterday' },
      { who: t.assignee, txt: t.source === 'email' ? 'created this task from an Outlook email' : 'created this task', time: '3 days ago' },
    ];
    return `<div class="pane-section-title">${icon('history')} Activity & audit trail</div>
      <div class="timeline-rail">${acts.map((a) => `
        <div class="activity">${avatar(a.who, 'sm')}
          <div class="activity-body"><span class="who">${FD.userById(a.who).name}</span> ${a.txt}
            <div class="activity-time">${a.time}</div></div></div>`).join('')}</div>`;
  }

  // ---------- Notifications flyout (per-user, real) ----------
  function toggleNotifications(anchorBtn) {
    const fly = document.getElementById('notifFlyout');
    if (!fly.hidden) { fly.hidden = true; return; }
    const N = window.FD_NOTIF;
    const me = FD.state.currentUser;
    const list = N ? N.forUser(me) : [];
    const perm = N ? N.permission() : 'unsupported';

    fly.innerHTML = `
      <div class="flyout-head"><div style="font-weight:600">Notifications</div>
        ${list.length ? '<button class="btn subtle sm" id="markRead">Mark all read</button>' : ''}</div>
      ${perm !== 'granted' && perm !== 'unsupported' ? `
        <div class="notif-enable" id="notifEnable">${icon('bell')}
          <div style="flex:1"><b>Get alerts on this device</b><div class="muted" style="font-size:11px">Turn on notifications for new tasks, deadlines &amp; campaigns</div></div>
          <button class="btn primary sm" id="enableBtn">Enable</button></div>` : ''}
      <div class="flyout-body">
        ${list.length ? list.map((n) => `
          <div class="notif-item ${n.read ? '' : 'unread'}" ${n.taskId ? `data-task="${n.taskId}"` : ''} style="${n.taskId ? 'cursor:pointer' : ''}">
            <span class="notif-ic" style="background:${(n.color || '#0078d4')}1a;color:${n.color || '#0078d4'}">${icon(n.icon || 'bell')}</span>
            <div style="flex:1"><div class="notif-text">${n.body ? '<b>' + n.title + '</b> · ' + n.body : (n.text || n.title)}</div>
              <div class="notif-time">${N ? N.timeAgo(n.ts) : (n.time || '')}</div></div>
          </div>`).join('') : `<div class="empty" style="padding:34px 16px">${icon('bell')}<div style="font-weight:600;color:var(--text-2)">No notifications</div><div style="font-size:12px;margin-top:4px">You're all caught up</div></div>`}
      </div>`;
    fly.hidden = false;
    hydrateIcons(fly);

    const enable = fly.querySelector('#enableBtn');
    if (enable) enable.onclick = () => N.requestPermission().then((p) => {
      toast(p === 'granted' ? { title: 'Notifications on', sub: 'You\'ll get alerts on this device', kind: 'ok' } : { title: 'Notifications not enabled', kind: 'warn' });
      fly.hidden = true;
    });
    const mr = fly.querySelector('#markRead');
    if (mr) mr.onclick = () => { N.markAllRead(me); fly.hidden = true; };
    fly.querySelectorAll('[data-task]').forEach((el) => el.onclick = () => { fly.hidden = true; N.markAllRead(me); openTaskPane(el.getAttribute('data-task')); });

    const onDoc = (e) => { if (!fly.contains(e.target) && e.target !== anchorBtn && !anchorBtn.contains(e.target)) { fly.hidden = true; document.removeEventListener('click', onDoc); } };
    setTimeout(() => document.addEventListener('click', onDoc), 0);
  }

  window.FD_UI = {
    icon, hydrateIcons, avatar, avatarStack, priorityBadge, statusBadge,
    deptChip, fileBadge, toast, modal, openTaskPane, toggleNotifications,
  };
})();
