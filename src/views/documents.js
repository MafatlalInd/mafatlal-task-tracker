/* ============================================================
   View: Documents — OneDrive integration
   ============================================================ */
(function () {
  const FD = window.FD, UI = window.FD_UI;

  function render(root) {
    const docs = FD.state.documents;
    const statusColor = { 'Draft': '#8a8886', 'In Review': '#c19c00', 'Approved': '#107c10', 'Final': '#0078d4' };
    root.innerHTML = `
      <div class="page">
        <div class="page-head">
          <div><h1 class="page-title">Documents</h1><div class="page-sub">${UI.icon('onedrive')} Synced with OneDrive · version history &amp; co-authoring</div></div>
          <div class="page-actions">
            <button class="btn" id="newFolder">${UI.icon('folder')} New folder</button>
            <button class="btn primary" id="upload">${UI.icon('paperclip')} Upload</button>
          </div>
        </div>

        <div class="banner info" style="margin-bottom:18px">${UI.icon('onedrive')}
          <div>All documents are stored in <b>OneDrive / SharePoint</b>. Edits open in the Microsoft 365 web apps with live co-authoring and full version history.</div>
        </div>

        <div class="tbl-wrap">
          <table class="tbl">
            <thead><tr><th>Name</th><th>Project</th><th>Owner</th><th>Version</th><th>Status</th><th>Modified</th><th>Size</th><th></th></tr></thead>
            <tbody>
              ${docs.map((d) => `
                <tr data-doc="${d.id}">
                  <td><div style="display:flex;align-items:center;gap:10px">${UI.fileBadge(d.type)}<span class="t-name">${d.name}</span></div></td>
                  <td>${d.project ? UI.deptChip(FD.projectById(d.project).dept) + ' ' + (FD.projectById(d.project).name) : '<span class="muted">—</span>'}</td>
                  <td><div style="display:flex;align-items:center;gap:8px">${UI.avatar(d.owner, 'sm')}${FD.userById(d.owner).name.split(' ')[0]}</div></td>
                  <td><span class="chip">${UI.icon('history')} ${d.version}</span></td>
                  <td><span class="badge" style="background:${statusColor[d.status]}1a;color:${statusColor[d.status]}">${d.status}</span></td>
                  <td class="muted">${FD.dueLabel(d.modified)}</td>
                  <td class="muted">${d.size}</td>
                  <td><button class="btn subtle sm" data-open="${d.id}">${UI.icon('eye')} Open</button></td>
                </tr>`).join('')}
            </tbody>
          </table>
        </div>
      </div>`;
    UI.hydrateIcons(root);
    root.querySelector('#upload').onclick = () => UI.toast({ title: 'Upload to OneDrive', sub: 'File picker would open here', icon: 'onedrive' });
    root.querySelector('#newFolder').onclick = () => UI.toast({ title: 'Folder created in OneDrive' });
    root.querySelectorAll('[data-open]').forEach((b) => b.onclick = (e) => { e.stopPropagation(); openDoc(b.getAttribute('data-open')); });
    root.querySelectorAll('[data-doc]').forEach((r) => r.onclick = () => openDoc(r.getAttribute('data-doc')));
  }

  function openDoc(id) {
    const d = FD.state.documents.find((x) => x.id === id);
    UI.modal({
      title: d.name, width: 520,
      body: `
        <div style="display:flex;align-items:center;gap:14px;margin-bottom:18px">
          ${UI.fileBadge(d.type)}
          <div><div style="font-weight:600">${d.name}</div><div class="muted" style="font-size:12px">${d.size} · ${d.status} · owned by ${FD.userById(d.owner).name}</div></div>
        </div>
        <div class="pane-section-title">${UI.icon('history')} Version history</div>
        ${['v3', 'v2', 'v1'].slice(0, parseInt(d.version.slice(1)) || 1).map((v, i) => `
          <div class="list-row"><span class="chip">${v}</span>
            <div style="flex:1"><div style="font-size:13px;font-weight:600">${i === 0 ? 'Current version' : 'Previous version'}</div>
            <div class="muted" style="font-size:11px">Edited by ${FD.userById(d.owner).name} · ${i + 1} day${i ? 's' : ''} ago</div></div>
            ${i === 0 ? '<span class="badge" style="background:rgba(16,124,16,.12);color:var(--ok)">Latest</span>' : `<button class="btn subtle sm">Restore</button>`}
          </div>`).join('')}`,
      foot: `<button class="btn subtle" data-close>Close</button>
        <button class="btn" id="coauthor">${UI.icon('users')} Co-author</button>
        <button class="btn primary" id="openM365">${UI.icon('link')} Open in Microsoft 365</button>`,
      onMount: (m, close) => {
        m.querySelector('#openM365').onclick = () => { UI.toast({ title: 'Opening in Microsoft 365', sub: 'Launches the web app with co-authoring' }); close(); };
        m.querySelector('#coauthor').onclick = () => UI.toast({ title: 'Co-authoring link copied', sub: 'Share to start editing together' });
      },
    });
  }

  window.FD_VIEWS = window.FD_VIEWS || {};
  window.FD_VIEWS.documents = { title: 'Documents', render };
})();
