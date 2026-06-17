/* ============================================================
   View: Approvals — corporate approval workflow
   Assigned → In Progress → Submitted → Approved → Closed
   ============================================================ */
(function () {
  const FD = window.FD, UI = window.FD_UI;

  function render(root) {
    const queue = FD.approvalsQueue();
    root.innerHTML = `
      <div class="page">
        <div class="page-head">
          <div><h1 class="page-title">Approvals</h1><div class="page-sub">${queue.length} item${queue.length !== 1 ? 's' : ''} awaiting your decision · approval requests arrive via Outlook</div></div>
        </div>

        <div class="card" style="margin-bottom:18px;padding:16px 18px">
          <div class="card-title" style="margin-bottom:14px">Approval workflow</div>
          <div style="display:flex;align-items:center;gap:6px;flex-wrap:wrap">
            ${['Assigned', 'In Progress', 'Submitted', 'Approved', 'Closed'].map((s, i, arr) => `
              <div style="display:flex;align-items:center;gap:6px">
                <span class="chip" style="background:var(--ms-blue-wash);color:var(--ms-blue);font-weight:600">${i + 1}. ${s}</span>
                ${i < arr.length - 1 ? `<span style="color:var(--text-3)">${UI.icon('chevronR')}</span>` : ''}
              </div>`).join('')}
          </div>
        </div>

        <div id="approvalList"></div>
      </div>`;
    UI.hydrateIcons(root);
    paint(root);
    FD.onView('tasks:changed', () => { const sub = root.querySelector('.page-sub'); if (!sub) return; const q = FD.approvalsQueue(); sub.innerHTML = `${q.length} item${q.length !== 1 ? 's' : ''} awaiting your decision · approval requests arrive via Outlook`; paint(root); });
  }

  function paint(root) {
    const queue = FD.approvalsQueue();
    const host = root.querySelector('#approvalList');
    if (!queue.length) {
      host.innerHTML = `<div class="card"><div class="empty">${UI.icon('approve')}<div>All caught up — no pending approvals 🎉</div></div></div>`;
      UI.hydrateIcons(host);
      return;
    }
    host.innerHTML = `<div class="grid cols-2">${queue.map((t) => cardHtml(t)).join('')}</div>`;
    UI.hydrateIcons(host);
    queue.forEach((t) => {
      host.querySelector(`#ap-approve-${t.id}`).onclick = () => decide(t, 'approve', root);
      host.querySelector(`#ap-reject-${t.id}`).onclick = () => decide(t, 'reject', root);
      host.querySelector(`#ap-changes-${t.id}`).onclick = () => decide(t, 'changes', root);
      host.querySelector(`#ap-open-${t.id}`).onclick = () => UI.openTaskPane(t.id);
    });
  }

  function cardHtml(t) {
    const a = FD.userById(t.assignee);
    return `<div class="card">
      <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:10px;margin-bottom:10px">
        <div>
          <div style="display:flex;gap:8px;margin-bottom:8px">${UI.deptChip(t.dept)} ${UI.priorityBadge(t.priority)}</div>
          <div style="font-size:15px;font-weight:600;cursor:pointer" id="ap-open-${t.id}">${t.name}</div>
        </div>
        <div class="muted" style="font-size:12px;text-align:right;white-space:nowrap">${UI.icon('clock')} ${FD.dueLabel(t.due)}</div>
      </div>
      <div class="muted" style="font-size:13px;margin-bottom:12px">${t.desc || ''}</div>
      <div style="display:flex;align-items:center;gap:8px;margin-bottom:14px;font-size:12px">
        ${UI.avatar(t.assignee, 'sm')}<span>Submitted by <b>${a.name}</b></span>
        <span class="muted">· ${t.progress}% complete</span>
      </div>
      ${t.attachments && t.attachments.length ? `<div class="attach" style="margin-bottom:14px">${UI.fileBadge(t.attachments[0].type)}<div style="flex:1;font-size:13px;font-weight:600">${t.attachments[0].name}</div><button class="btn subtle sm">${UI.icon('eye')} Preview</button></div>` : ''}
      <div style="display:flex;gap:8px">
        <button class="btn primary sm" id="ap-approve-${t.id}" style="flex:1">${UI.icon('check')} Approve</button>
        <button class="btn sm" id="ap-changes-${t.id}">${UI.icon('edit')} Request changes</button>
        <button class="btn danger sm" id="ap-reject-${t.id}">${UI.icon('close')} Reject</button>
      </div>
    </div>`;
  }

  function decide(t, kind, root) {
    if (kind === 'approve') {
      UI.modal({
        title: 'Approve task', width: 460,
        body: `<p style="margin-top:0">Approve <b>${t.name}</b>? This will mark it complete and notify the team.</p>
          <div class="field"><label>Comment (optional)</label><textarea id="cmt" placeholder="Great work — approved."></textarea></div>`,
        foot: `<button class="btn subtle" data-close>Cancel</button><button class="btn primary" id="confirm">${UI.icon('check')} Approve & close</button>`,
        onMount: (m, close) => {
          m.querySelector('#confirm').onclick = () => {
            FD.updateTask(t.id, { status: 'Completed', progress: 100 });
            UI.toast({ title: 'Approved & closed', sub: FD.userById(t.assignee).name + ' notified in Teams', kind: 'ok' });
            close();
          };
        },
      });
    } else if (kind === 'reject') {
      UI.modal({
        title: 'Reject task', width: 460,
        body: `<p style="margin-top:0">Reject <b>${t.name}</b>? It will return to the assignee.</p>
          <div class="field"><label>Reason for rejection <span style="color:var(--critical)">*</span></label><textarea id="cmt" placeholder="Explain what needs to change…"></textarea></div>`,
        foot: `<button class="btn subtle" data-close>Cancel</button><button class="btn danger" id="confirm">${UI.icon('close')} Reject</button>`,
        onMount: (m, close) => {
          m.querySelector('#confirm').onclick = () => {
            FD.updateTask(t.id, { status: 'In Progress' });
            UI.toast({ title: 'Task rejected', sub: 'Returned to ' + FD.userById(t.assignee).name + ' with your feedback', kind: 'warn' });
            close();
          };
        },
      });
    } else {
      FD.updateTask(t.id, { status: 'In Progress' });
      UI.toast({ title: 'Changes requested', sub: 'Assignee notified via Outlook & Teams', kind: 'warn', icon: 'edit' });
    }
  }

  window.FD_VIEWS = window.FD_VIEWS || {};
  window.FD_VIEWS.approvals = { title: 'Approvals', render };
})();
