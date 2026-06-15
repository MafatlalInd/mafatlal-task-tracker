/* ============================================================
   View: Calendar — Outlook-style month grid
   - Your own task deadlines + meetings
   - View a colleague's calendar IF they shared it with you
   - Share your calendar with colleagues who ask
   ============================================================ */
(function () {
  const FD = window.FD, UI = window.FD_UI;
  let viewMonth;
  let viewingUser; // whose calendar we're looking at

  function render(root) {
    if (!viewMonth) viewMonth = new Date(FD.data.TODAY.getFullYear(), FD.data.TODAY.getMonth(), 1);
    if (!viewingUser) viewingUser = FD.state.currentUser;

    const viewable = FD.calendarsIcanView();
    const owner = FD.userById(viewingUser);
    const isOwn = viewingUser === FD.state.currentUser;

    root.innerHTML = `
      <div class="page">
        <div class="page-head">
          <div><h1 class="page-title">Calendar</h1>
            <div class="page-sub">${isOwn ? 'Your task deadlines and meetings' : 'Viewing ' + owner.name + "'s calendar"} · two-way Outlook sync</div></div>
          <div class="page-actions">
            <div class="legend">
              <span class="legend-item"><span class="sw" style="background:var(--ms-blue)"></span>Task deadline</span>
              <span class="legend-item"><span class="sw" style="background:var(--teams)"></span>Meeting</span>
            </div>
            ${isOwn ? `<button class="btn" id="shareBtn">${UI.icon('users')} Share my calendar</button>
              <button class="btn primary" id="cNew">${UI.icon('add')} New Task</button>` : ''}
          </div>
        </div>

        <div class="toolbar" style="margin-bottom:14px">
          <label class="muted" style="font-size:12px;font-weight:600">Calendar:</label>
          <select class="select" id="whoseCal">
            ${viewable.map((u) => `<option value="${u.id}" ${u.id === viewingUser ? 'selected' : ''}>${u.id === FD.state.currentUser ? 'My calendar' : u.name + (FD.isAdmin() ? ' (admin view)' : ' (shared with you)')}</option>`).join('')}
          </select>
          <button class="btn subtle sm" id="reqBtn" title="Ask a colleague to share their calendar">${UI.icon('send')} Request a calendar</button>
        </div>

        <div class="card" style="padding:14px">
          <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:14px">
            <div style="display:flex;align-items:center;gap:8px">
              <button class="icon-btn" id="prevM" style="color:var(--text-2);transform:rotate(90deg)">${UI.icon('chevronD')}</button>
              <div id="monthLabel" style="font-size:17px;font-weight:600;min-width:170px;text-align:center"></div>
              <button class="icon-btn" id="nextM" style="color:var(--text-2)">${UI.icon('chevronR')}</button>
              <button class="btn subtle sm" id="todayBtn">Today</button>
            </div>
            <div class="muted" style="font-size:12px;display:flex;align-items:center;gap:6px">${UI.avatar(viewingUser, 'sm')} ${owner.name}</div>
          </div>
          <div id="calBody"></div>
        </div>
      </div>`;
    UI.hydrateIcons(root);

    root.querySelector('#prevM').onclick = () => { viewMonth = new Date(viewMonth.getFullYear(), viewMonth.getMonth() - 1, 1); paint(root); };
    root.querySelector('#nextM').onclick = () => { viewMonth = new Date(viewMonth.getFullYear(), viewMonth.getMonth() + 1, 1); paint(root); };
    root.querySelector('#todayBtn').onclick = () => { viewMonth = new Date(FD.data.TODAY.getFullYear(), FD.data.TODAY.getMonth(), 1); paint(root); };
    root.querySelector('#whoseCal').onchange = (e) => { viewingUser = e.target.value; render(root); };
    root.querySelector('#reqBtn').onclick = () => requestModal();
    if (root.querySelector('#cNew')) root.querySelector('#cNew').onclick = () => UI.openTaskPane();
    if (root.querySelector('#shareBtn')) root.querySelector('#shareBtn').onclick = () => shareModal(root);
    paint(root);
  }

  function paint(root) {
    root.querySelector('#monthLabel').textContent = viewMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    const year = viewMonth.getFullYear(), month = viewMonth.getMonth();
    const startDow = new Date(year, month, 1).getDay();
    const gridStart = new Date(year, month, 1 - startDow);
    const todayIso = FD.data.iso(FD.data.TODAY);

    // Tasks visible on this calendar: the viewed user's own tasks (+ admin sees all of theirs)
    const calTasks = FD.state.tasks.filter((t) => t.assignee === viewingUser || (t.collaborators || []).indexOf(viewingUser) > -1);
    const calMeetings = FD.data.meetings.filter((m) => m.organizer === viewingUser || (m.attendees || []).indexOf(viewingUser) > -1);

    const dows = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    let cells = dows.map((dn) => `<div class="cal-dow">${dn}</div>`).join('');

    for (let i = 0; i < 42; i++) {
      const cur = new Date(gridStart.getTime() + i * 86400000);
      const ciso = FD.data.iso(cur);
      const out = cur.getMonth() !== month;
      const isToday = ciso === todayIso;
      const dayTasks = calTasks.filter((t) => t.due === ciso);
      const dayMeetings = calMeetings.filter((m) => m.date === ciso);
      const events = [
        ...dayMeetings.map((m) => ({ kind: 'meeting', label: m.time + ' ' + m.title })),
        ...dayTasks.map((t) => ({ kind: 'task', label: t.name, id: t.id })),
      ];
      const shown = events.slice(0, 3);
      const more = events.length - shown.length;
      cells += `<div class="cal-cell ${out ? 'out' : ''} ${isToday ? 'today' : ''}">
        <div class="cal-num">${cur.getDate()}</div>
        ${shown.map((ev) => `<div class="cal-ev ${ev.kind}" ${ev.id ? `data-task="${ev.id}"` : ''}>${UI.icon(ev.kind === 'meeting' ? 'teams' : 'tasks')}<span style="overflow:hidden;text-overflow:ellipsis">${ev.label}</span></div>`).join('')}
        ${more > 0 ? `<div class="cal-more">+${more} more</div>` : ''}
      </div>`;
    }
    root.querySelector('#calBody').innerHTML = `<div class="cal-grid">${cells}</div>`;
    UI.hydrateIcons(root.querySelector('#calBody'));
    root.querySelectorAll('[data-task]').forEach((el) => el.onclick = () => UI.openTaskPane(el.getAttribute('data-task')));
  }

  // Share my calendar with selected colleagues
  function shareModal(root) {
    const shared = FD.whoIShareWith().map((u) => u.id);
    UI.modal({
      title: 'Share my calendar', width: 460,
      body: `
        <div class="banner info" style="margin-bottom:16px">${UI.icon('users')}
          <div>Pick the colleagues who can view your calendar. They'll see your task deadlines and meetings (read-only). You can revoke anytime.</div></div>
        <div class="collab-picker" id="shareList">
          ${FD.data.users.filter((u) => u.id !== FD.state.currentUser && !u.isAdmin).map((u) => `
            <button type="button" class="collab-chip ${shared.indexOf(u.id) > -1 ? 'on' : ''}" data-uid="${u.id}">
              <span class="av sm" style="background:${u.color}">${u.initials}</span>${u.name.split(' ')[0]}</button>`).join('')}
        </div>`,
      foot: `<button class="btn subtle" data-close>Cancel</button><button class="btn primary" id="shSave">${UI.icon('check')} Save sharing</button>`,
      onMount: (m, close) => {
        m.querySelectorAll('.collab-chip').forEach((c) => c.onclick = () => c.classList.toggle('on'));
        m.querySelector('#shSave').onclick = () => {
          FD.data.users.filter((u) => u.id !== FD.state.currentUser && !u.isAdmin).forEach((u) => {
            const on = m.querySelector(`.collab-chip[data-uid="${u.id}"]`).classList.contains('on');
            if (on) FD.shareCalendar(u.id); else FD.unshareCalendar(u.id);
          });
          const list = FD.whoIShareWith();
          UI.toast({ title: 'Calendar sharing updated', sub: list.length ? 'Shared with ' + list.map((u) => u.name.split(' ')[0]).join(', ') : 'Not shared with anyone', kind: 'ok', icon: 'users' });
          close();
          render(root);
        };
      },
    });
  }

  // Request access to a colleague's calendar (sends them a request)
  function requestModal() {
    UI.modal({
      title: 'Request a calendar', width: 440,
      body: `
        <div class="field"><label>Whose calendar do you need?</label>
          <select class="select" id="reqWho" style="width:100%">
            ${FD.data.users.filter((u) => u.id !== FD.state.currentUser && !FD.canViewCalendar(u.id)).map((u) => `<option value="${u.id}">${u.name}</option>`).join('') || '<option disabled>You can already view everyone available</option>'}
          </select></div>
        <div class="field"><label>Note (optional)</label><textarea id="reqNote" placeholder="Why you need access…"></textarea></div>`,
      foot: `<button class="btn subtle" data-close>Cancel</button><button class="btn primary" id="reqSend">${UI.icon('send')} Send request</button>`,
      onMount: (m, close) => {
        m.querySelector('#reqSend').onclick = () => {
          const who = m.querySelector('#reqWho').value;
          const u = FD.userById(who);
          UI.toast({ title: 'Request sent', sub: (u ? u.name : 'They') + ' will be asked to share their calendar', icon: 'send' });
          close();
        };
      },
    });
  }

  window.FD_VIEWS = window.FD_VIEWS || {};
  window.FD_VIEWS.calendar = { title: 'Calendar', render };
})();
