/* ============================================================
   View: Corp Comm — Request → Design → Review → Approval → Publish
   ============================================================ */
(function () {
  const FD = window.FD, UI = window.FD_UI;
  const STAGES = [
    { key: 'Request', color: '#8a8886' },
    { key: 'Design', color: '#0078d4' },
    { key: 'Review', color: '#c19c00' },
    { key: 'Approval', color: '#ca5010' },
    { key: 'Published', color: '#107c10' },
  ];
  const CATEGORIES = ['Social Media Posts', 'Campaigns', 'Website Updates', 'Product Launches', 'Branding Activities', 'PR Activities', 'Design Requests'];

  function render(root) {
    root.innerHTML = `
      <div class="page">
        <div class="page-head">
          <div><h1 class="page-title">${UI.icon('megaphone')} Corporate Communication</h1>
            <div class="page-sub">Creative workflow for Marketing &amp; Corp Comm — Request → Design → Review → Approval → Publish</div></div>
          <div class="page-actions">
            <button class="btn primary" id="ccNew">${UI.icon('add')} New Request</button>
          </div>
        </div>

        <div class="toolbar" style="margin-bottom:18px">
          ${CATEGORIES.map((c) => `<span class="chip">${c} <b style="margin-left:4px">${FD.state.commItems.filter((i) => i.category === c).length}</b></span>`).join('')}
        </div>

        <div class="kanban" id="ccBoard"></div>
      </div>`;
    UI.hydrateIcons(root);
    root.querySelector('#ccNew').onclick = () => newRequest(root);
    paint(root);
  }

  function paint(root) {
    root.querySelector('#ccBoard').innerHTML = STAGES.map((st) => {
      const items = FD.state.commItems.filter((i) => i.stage === st.key);
      return `<div class="kcol">
        <div class="kcol-head"><span class="kdot" style="background:${st.color}"></span>
          <span class="ktitle">${st.key}</span><span class="kcount">${items.length}</span></div>
        <div class="kcol-body" data-stage="${st.key}">
          ${items.map((i) => cardHtml(i)).join('') || '<div class="muted" style="font-size:12px;text-align:center;padding:14px">Empty</div>'}
        </div>
      </div>`;
    }).join('');
    UI.hydrateIcons(root.querySelector('#ccBoard'));
    wireDnd(root);
  }

  function cardHtml(i) {
    return `<div class="kcard" draggable="true" data-id="${i.id}">
      <div class="kcard-top">${UI.priorityBadge(i.priority)}</div>
      <div class="kcard-title">${i.title}</div>
      <div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:8px"><span class="chip" style="font-size:11px">${i.category}</span></div>
      <div class="kcard-foot">
        <span class="kcard-meta"><span>${UI.icon('calendar')}${FD.dueLabel(i.due)}</span></span>
        ${UI.avatar(i.owner, 'sm')}
      </div>
    </div>`;
  }

  function wireDnd(root) {
    let dragId = null;
    root.querySelectorAll('.kcard').forEach((card) => {
      card.addEventListener('dragstart', () => { dragId = card.getAttribute('data-id'); card.classList.add('dragging'); });
      card.addEventListener('dragend', () => card.classList.remove('dragging'));
    });
    root.querySelectorAll('.kcol-body').forEach((body) => {
      body.addEventListener('dragover', (e) => { e.preventDefault(); body.classList.add('drag-over'); });
      body.addEventListener('dragleave', () => body.classList.remove('drag-over'));
      body.addEventListener('drop', (e) => {
        e.preventDefault(); body.classList.remove('drag-over');
        const stage = body.getAttribute('data-stage');
        const item = FD.state.commItems.find((x) => x.id === dragId);
        if (item && item.stage !== stage) {
          item.stage = stage;
          paint(root);
          const msg = stage === 'Published' ? { title: 'Published! 🚀', sub: item.title + ' is live · shared to Teams channel' }
            : stage === 'Approval' ? { title: 'Sent for approval', sub: 'Approver notified via Outlook' }
            : { title: 'Moved to ' + stage };
          UI.toast(msg);
        }
      });
    });
  }

  function newRequest(root) {
    UI.modal({
      title: 'New creative request', width: 520,
      body: `
        <div class="field"><label>Title</label><input class="input" id="r-title" placeholder="e.g. Festive campaign key visual"/></div>
        <div class="field"><label>Category</label><select class="select" id="r-cat">${CATEGORIES.map((c) => `<option>${c}</option>`).join('')}</select></div>
        <div class="field-row">
          <div class="field"><label>Owner</label><select class="select" id="r-owner">${FD.data.users.filter((u) => u.dept === 'mkt' || u.dept === 'comm').map((u) => `<option value="${u.id}">${u.name}</option>`).join('')}</select></div>
          <div class="field"><label>Priority</label><select class="select" id="r-pri">${FD.data.PRI.map((p) => `<option ${p === 'Medium' ? 'selected' : ''}>${p}</option>`).join('')}</select></div>
        </div>
        <div class="field"><label>Due date</label><input type="date" class="input" id="r-due" value="${FD.data.iso(new Date(FD.data.TODAY.getTime() + 7 * 86400000))}"/></div>`,
      foot: `<button class="btn subtle" data-close>Cancel</button><button class="btn primary" id="create">${UI.icon('add')} Create request</button>`,
      onMount: (m, close) => {
        m.querySelector('#create').onclick = () => {
          FD.state.commItems.unshift({
            id: 'c' + Date.now(), title: m.querySelector('#r-title').value || 'Untitled request',
            category: m.querySelector('#r-cat').value, stage: 'Request',
            owner: m.querySelector('#r-owner').value, priority: m.querySelector('#r-pri').value,
            due: m.querySelector('#r-due').value,
          });
          paint(root);
          UI.toast({ title: 'Request created', sub: 'Added to the Request stage' });
          close();
        };
      },
    });
  }

  window.FD_VIEWS = window.FD_VIEWS || {};
  window.FD_VIEWS.corpcomm = { title: 'Corp Comm', render };
})();
