/* ============================================================
   View: Influencers — directory + collaboration charges
   Team members can add influencers they collaborate with,
   including contact details and rates (per post/reel/etc.).
   ============================================================ */
(function () {
  const FD = window.FD, UI = window.FD_UI;
  const KEY = "fd-influencers-v2";
  const PLATFORMS = ["Instagram", "YouTube", "Facebook", "X (Twitter)", "LinkedIn", "Other"];
  const UNITS = ["Post", "Reel", "Video", "Story", "Campaign", "Month"];
  const STATUSES = ["Prospect", "Active", "Past"];
  const PCOLOR = { "Instagram": "#c13584", "YouTube": "#ff0000", "Facebook": "#1877f2", "X (Twitter)": "#1d1d1f", "LinkedIn": "#0a66c2", "Other": "#605e5c" };
  const SCOLOR = { "Prospect": "#c19c00", "Active": "#107c10", "Past": "#8a8886" };
  const filters = { q: "", platform: "all", status: "all" };

  function load() {
    try { const r = localStorage.getItem(KEY); if (r) return JSON.parse(r); } catch (e) {}
    const seed = FD.data.influencers.slice();
    save(seed);
    return seed;
  }
  function save(list) { try { localStorage.setItem(KEY, JSON.stringify(list)); } catch (e) {} }
  function all() { return load(); }
  // Each member sees only the influencers they manage; admin sees everyone's.
  // The stored list always holds every member's records (so saves never drop
  // another member's data) — we only filter what's shown.
  function visibleList() {
    const list = all();
    if (FD.isAdmin()) return list;
    const me = FD.state.currentUser;
    return list.filter((i) => i.managedBy === me);
  }
  function fmt(n) { return "₹" + (n >= 100000 ? (n / 100000).toFixed(n % 100000 ? 1 : 0) + "L" : Number(n).toLocaleString("en-IN")); }
  function kfollowers(n) { return n >= 1000 ? (n / 1000).toFixed(n >= 100000 ? 0 : 1) + "K" : String(n); }

  function render(root) {
    root.innerHTML = `
      <div class="page">
        <div class="page-head">
          <div><h1 class="page-title">${UI.icon('megaphone')} Influencers</h1>
            <div class="page-sub">Influencer directory &amp; collaboration charges</div></div>
          <div class="page-actions">
            <button class="btn" id="infImport">${UI.icon('inbox')} Import CSV</button>
            <button class="btn" id="infExport">${UI.icon('download')} Export CSV</button>
            <button class="btn primary" id="addInf">${UI.icon('add')} Add influencer</button>
          </div>
        </div>
        <div class="grid cols-3" id="infKpis" style="margin-bottom:16px"></div>
        <div class="toolbar">
          <div class="search-box">${UI.icon('search')}<input id="infQ" placeholder="Search name, handle, category…" value="${filters.q}"/></div>
          <select class="select" id="infPlatform"><option value="all">All platforms</option>${PLATFORMS.map((p) => opt(p, p, filters.platform)).join('')}</select>
          <select class="select" id="infStatus"><option value="all">All statuses</option>${STATUSES.map((s) => opt(s, s, filters.status)).join('')}</select>
        </div>
        <div class="tbl-wrap" id="infTable"></div>
      </div>`;
    UI.hydrateIcons(root);
    root.querySelector('#addInf').onclick = () => editModal(null, root);
    root.querySelector('#infImport').onclick = () => importModal(root);
    root.querySelector('#infExport').onclick = () => {
      const rows = filtered();
      window.FD_EXPORT.csv('Influencers_' + window.FD_EXPORT.today() + '.csv',
        ['Name', 'Platform', 'Handle', 'Category', 'Followers', 'Charge (INR)', 'Per', 'Status', 'Managed by', 'Email', 'Phone', 'Notes'],
        rows.map((i) => [i.name, i.platform, i.handle, i.category, i.followers, i.rateAmount, i.rateUnit, i.status, (FD.userById(i.managedBy) || {}).name || '', i.email, i.phone, i.notes]));
      UI.toast({ title: 'Influencers exported', sub: rows.length + ' records · CSV', icon: 'download', kind: 'ok' });
    };
    const q = root.querySelector('#infQ'); q.oninput = () => { filters.q = q.value; paint(root); };
    root.querySelector('#infPlatform').onchange = (e) => { filters.platform = e.target.value; paint(root); };
    root.querySelector('#infStatus').onchange = (e) => { filters.status = e.target.value; paint(root); };
    paint(root);
  }

  function filtered() {
    let list = visibleList();
    if (filters.platform !== "all") list = list.filter((i) => i.platform === filters.platform);
    if (filters.status !== "all") list = list.filter((i) => i.status === filters.status);
    if (filters.q) {
      const s = filters.q.toLowerCase();
      list = list.filter((i) => (i.name + i.handle + i.category + i.platform).toLowerCase().includes(s));
    }
    return list;
  }

  function paint(root) {
    const list = visibleList();
    const active = list.filter((i) => i.status === "Active");
    const totalReach = list.reduce((s, i) => s + (i.followers || 0), 0);
    const activeSpend = active.reduce((s, i) => s + (i.rateAmount || 0), 0);
    root.querySelector('#infKpis').innerHTML = [
      { label: "Influencers", val: list.length, color: "var(--mafatlal-red)" },
      { label: "Active collaborations", val: active.length, color: "var(--ok)" },
      { label: "Active rate value", val: fmt(activeSpend), color: "" },
    ].map((k) => `<div class="kpi"><div class="kpi-label">${k.label}</div><div class="kpi-val" style="font-size:24px;${k.color ? 'color:' + k.color : ''}">${k.val}</div>${k.label === 'Influencers' ? `<div class="muted" style="font-size:11px;margin-top:4px">${kfollowers(totalReach)} combined reach</div>` : ''}</div>`).join('');

    const rows = filtered();
    const me = FD.state.currentUser, admin = FD.isAdmin();
    root.querySelector('#infTable').innerHTML = rows.length ? `
      <table class="tbl"><thead><tr>
        <th>Influencer</th><th>Platform</th><th>Category</th><th>Followers</th><th>Collaboration charge</th><th>Status</th><th>Managed by</th><th></th>
      </tr></thead><tbody>
        ${rows.map((i) => {
          const canEdit = admin || i.managedBy === me;
          return `<tr data-edit="${i.id}" style="cursor:pointer">
            <td><div class="t-name">${i.name}</div><div class="t-meta">${i.handle || ''}</div></td>
            <td><span class="badge" style="background:${PCOLOR[i.platform]}1a;color:${PCOLOR[i.platform]}">${i.platform}</span></td>
            <td>${i.category || '<span class="muted">—</span>'}</td>
            <td>${kfollowers(i.followers || 0)}</td>
            <td><b>${fmt(i.rateAmount || 0)}</b> <span class="muted">/ ${i.rateUnit}</span></td>
            <td><span class="st"><span class="dot" style="background:${SCOLOR[i.status]}"></span>${i.status}</span></td>
            <td><div style="display:flex;align-items:center;gap:7px">${UI.avatar(i.managedBy, 'sm')}<span>${(FD.userById(i.managedBy) || {}).name || '—'}</span></div></td>
            <td style="white-space:nowrap" onclick="event.stopPropagation()">
              ${canEdit ? `<button class="btn subtle sm" data-edit2="${i.id}">${UI.icon('edit')}</button>
              <button class="btn danger sm" data-del="${i.id}">${UI.icon('trash')}</button>` : '<span class="muted" style="font-size:11px">View only</span>'}
            </td>
          </tr>`;
        }).join('')}
      </tbody></table>` : `<div class="empty">${UI.icon('megaphone')}<div>No influencers match your filters</div></div>`;
    UI.hydrateIcons(root.querySelector('#infTable'));

    root.querySelectorAll('[data-edit]').forEach((tr) => tr.onclick = () => { const i = byId(tr.getAttribute('data-edit')); if (FD.isAdmin() || i.managedBy === me) editModal(i, root); else viewModal(i); });
    root.querySelectorAll('[data-edit2]').forEach((b) => b.onclick = (e) => { e.stopPropagation(); editModal(byId(b.getAttribute('data-edit2')), root); });
    root.querySelectorAll('[data-del]').forEach((b) => b.onclick = (e) => { e.stopPropagation(); removeConfirm(byId(b.getAttribute('data-del')), root); });
  }

  function byId(id) { return all().find((i) => i.id === id); }

  function editModal(inf, root) {
    const isNew = !inf;
    const i = inf || { platform: "Instagram", rateUnit: "Reel", status: "Prospect", managedBy: FD.state.currentUser };
    const admin = FD.isAdmin();
    UI.modal({
      title: isNew ? 'Add influencer' : 'Edit influencer', width: 560,
      body: `
        <div class="field-row">
          <div class="field"><label>Name <span style="color:var(--critical)">*</span></label><input class="input" id="f-name" value="${i.name || ''}" placeholder="e.g. Aisha Khanna" style="width:100%"/></div>
          <div class="field"><label>Platform</label><select class="select" id="f-platform" style="width:100%">${PLATFORMS.map((p) => opt(p, p, i.platform)).join('')}</select></div>
        </div>
        <div class="field-row">
          <div class="field"><label>Handle / Username</label><input class="input" id="f-handle" value="${i.handle || ''}" placeholder="@handle" style="width:100%"/></div>
          <div class="field"><label>Profile URL</label><input class="input" id="f-url" value="${i.url || ''}" placeholder="https://…" style="width:100%"/></div>
        </div>
        <div class="field-row">
          <div class="field"><label>Category / Niche</label><input class="input" id="f-category" value="${i.category || ''}" placeholder="e.g. Fashion & Lifestyle" style="width:100%"/></div>
          <div class="field"><label>Followers</label><input class="input" type="number" id="f-followers" value="${i.followers || ''}" placeholder="e.g. 150000" style="width:100%"/></div>
        </div>
        <div class="pane-section-title" style="margin-top:8px">Collaboration charges</div>
        <div class="field-row">
          <div class="field"><label>Charge amount (₹)</label><input class="input" type="number" id="f-rate" value="${i.rateAmount || ''}" placeholder="e.g. 45000" style="width:100%"/></div>
          <div class="field"><label>Per</label><select class="select" id="f-unit" style="width:100%">${UNITS.map((u) => opt(u, u, i.rateUnit)).join('')}</select></div>
        </div>
        <div class="pane-section-title" style="margin-top:8px">Contact &amp; status</div>
        <div class="field-row">
          <div class="field"><label>Email</label><input class="input" id="f-email" value="${i.email || ''}" placeholder="name@example.com" style="width:100%"/></div>
          <div class="field"><label>Phone</label><input class="input" id="f-phone" value="${i.phone || ''}" placeholder="+91 …" style="width:100%"/></div>
        </div>
        <div class="field-row">
          <div class="field"><label>Status</label><select class="select" id="f-status" style="width:100%">${STATUSES.map((s) => opt(s, s, i.status)).join('')}</select></div>
          <div class="field"><label>Managed by</label><select class="select" id="f-managed" style="width:100%" ${admin ? '' : 'disabled'}>${FD.data.users.filter((u) => !u.isAdmin).map((u) => opt(u.id, u.name, i.managedBy)).join('')}</select></div>
        </div>
        <div class="field"><label>Notes</label><textarea id="f-notes" placeholder="Past collaborations, terms, fit…">${i.notes || ''}</textarea></div>`,
      foot: `<button class="btn subtle" data-close>Cancel</button><button class="btn primary" id="f-save">${UI.icon('check')} ${isNew ? 'Add influencer' : 'Save changes'}</button>`,
      onMount: (m, close) => {
        m.querySelector('#f-save').onclick = () => {
          const name = m.querySelector('#f-name').value.trim();
          if (!name) { UI.toast({ title: 'Name is required', kind: 'err' }); return; }
          const rec = {
            id: isNew ? 'inf' + Date.now() : i.id,
            name, platform: m.querySelector('#f-platform').value,
            handle: m.querySelector('#f-handle').value.trim(), url: m.querySelector('#f-url').value.trim(),
            category: m.querySelector('#f-category').value.trim(), followers: parseInt(m.querySelector('#f-followers').value, 10) || 0,
            rateAmount: parseInt(m.querySelector('#f-rate').value, 10) || 0, rateUnit: m.querySelector('#f-unit').value,
            email: m.querySelector('#f-email').value.trim(), phone: m.querySelector('#f-phone').value.trim(),
            status: m.querySelector('#f-status').value, managedBy: admin ? m.querySelector('#f-managed').value : (i.managedBy || FD.state.currentUser),
            notes: m.querySelector('#f-notes').value.trim(),
          };
          const list = all();
          if (isNew) list.unshift(rec); else { const idx = list.findIndex((x) => x.id === i.id); if (idx > -1) list[idx] = rec; }
          save(list);
          UI.toast({ title: isNew ? 'Influencer added' : 'Influencer updated', sub: name + ' · ' + fmt(rec.rateAmount) + ' / ' + rec.rateUnit, kind: 'ok', icon: 'megaphone' });
          close(); paint(root);
        };
      },
    });
  }

  function viewModal(i) {
    UI.modal({
      title: i.name, width: 460,
      body: `
        <div style="display:flex;gap:8px;margin-bottom:14px"><span class="badge" style="background:${PCOLOR[i.platform]}1a;color:${PCOLOR[i.platform]}">${i.platform}</span>
          <span class="st"><span class="dot" style="background:${SCOLOR[i.status]}"></span>${i.status}</span></div>
        <div class="stat-line"><span class="muted">Handle</span><b>${i.handle || '—'}</b></div>
        <div class="stat-line"><span class="muted">Category</span><b>${i.category || '—'}</b></div>
        <div class="stat-line"><span class="muted">Followers</span><b>${kfollowers(i.followers || 0)}</b></div>
        <div class="stat-line"><span class="muted">Collaboration charge</span><b>${fmt(i.rateAmount || 0)} / ${i.rateUnit}</b></div>
        <div class="stat-line"><span class="muted">Contact</span><b>${i.email || i.phone || '—'}</b></div>
        <div class="stat-line"><span class="muted">Managed by</span><b>${(FD.userById(i.managedBy) || {}).name || '—'}</b></div>
        ${i.notes ? `<div class="pane-section-title">Notes</div><div class="muted" style="font-size:13px">${i.notes}</div>` : ''}`,
      foot: `<button class="btn subtle" data-close>Close</button>`,
    });
  }

  function removeConfirm(i, root) {
    UI.modal({
      title: 'Remove influencer', width: 420,
      body: `<p style="margin-top:0">Remove <b>${i.name}</b> from the directory? This can't be undone.</p>`,
      foot: `<button class="btn subtle" data-close>Cancel</button><button class="btn danger" id="rmGo">${UI.icon('trash')} Remove</button>`,
      onMount: (m, close) => {
        m.querySelector('#rmGo').onclick = () => { save(all().filter((x) => x.id !== i.id)); UI.toast({ title: 'Influencer removed', kind: 'warn' }); close(); paint(root); };
      },
    });
  }

  // ---- CSV import ----------------------------------------------------------
  // Tolerant CSV parser: handles quoted fields, escaped quotes, CRLF, and a BOM.
  function parseCSV(text) {
    text = String(text || '').replace(/^﻿/, '');
    const rows = []; let row = [], cur = '', inQ = false;
    for (let i = 0; i < text.length; i++) {
      const c = text[i];
      if (inQ) {
        if (c === '"') { if (text[i + 1] === '"') { cur += '"'; i++; } else inQ = false; }
        else cur += c;
      } else if (c === '"') inQ = true;
      else if (c === ',') { row.push(cur); cur = ''; }
      else if (c === '\n') { row.push(cur); rows.push(row); row = []; cur = ''; }
      else if (c !== '\r') cur += c;
    }
    if (cur !== '' || row.length) { row.push(cur); rows.push(row); }
    return rows.filter((r) => r.some((c) => c.trim() !== ''));
  }

  // Turn parsed rows into influencer records owned by the right member.
  function buildRecords(rows) {
    if (!rows.length) return [];
    const norm = (s) => String(s || '').trim();
    const inSet = (v, set, dflt) => { const m = set.find((x) => x.toLowerCase() === norm(v).toLowerCase()); return m || dflt; };
    const header = rows[0].map((h) => h.trim().toLowerCase());
    const looksHeader = header.some((h) => h === 'name' || h.indexOf('name') > -1) &&
      header.some((h) => /platform|handle|charge|follower|status/.test(h));
    const find = (...names) => { for (const n of names) { const k = header.findIndex((h) => h.indexOf(n) > -1); if (k > -1) return k; } return -1; };
    let idx, dataRows;
    if (looksHeader) {
      idx = { name: find('name'), platform: find('platform'), handle: find('handle', 'username'), url: find('url', 'profile'),
        category: find('category', 'niche'), followers: find('follower'), rate: find('charge', 'rate', 'amount'),
        unit: find('per', 'unit'), status: find('status'), managed: find('managed'), email: find('email'),
        phone: find('phone', 'mobile'), notes: find('note') };
      dataRows = rows.slice(1);
    } else { // positional, matching the Export column order
      idx = { name: 0, platform: 1, handle: 2, category: 3, followers: 4, rate: 5, unit: 6, status: 7, managed: 8, email: 9, phone: 10, notes: 11, url: -1 };
      dataRows = rows;
    }
    const cell = (r, k) => (k > -1 && k < r.length ? norm(r[k]) : '');
    const admin = FD.isAdmin(), me = FD.state.currentUser;
    const owner = (nameCell) => {
      if (!admin) return me;                       // members can only own their own
      const n = norm(nameCell).toLowerCase();
      if (!n) return me;
      const u = FD.data.users.find((x) => !x.isAdmin && x.name.toLowerCase() === n);
      return u ? u.id : me;
    };
    const out = [];
    dataRows.forEach((r, n) => {
      const name = cell(r, idx.name);
      if (!name) return;
      out.push({
        id: 'inf' + Date.now().toString(36) + n + Math.random().toString(36).slice(2, 5),
        name,
        platform: inSet(cell(r, idx.platform), PLATFORMS, 'Other'),
        handle: cell(r, idx.handle), url: cell(r, idx.url),
        category: cell(r, idx.category),
        followers: parseInt(cell(r, idx.followers).replace(/[^0-9]/g, ''), 10) || 0,
        rateAmount: parseInt(cell(r, idx.rate).replace(/[^0-9]/g, ''), 10) || 0,
        rateUnit: inSet(cell(r, idx.unit), UNITS, 'Post'),
        email: cell(r, idx.email), phone: cell(r, idx.phone),
        status: inSet(cell(r, idx.status), STATUSES, 'Prospect'),
        managedBy: owner(cell(r, idx.managed)),
        notes: cell(r, idx.notes),
      });
    });
    return out;
  }

  // Generates a starter CSV (header + two example rows) on the fly.
  function downloadTemplate() {
    window.FD_EXPORT.csv('influencers-template.csv',
      ['Name', 'Platform', 'Handle', 'Category', 'Followers', 'Charge (INR)', 'Per', 'Status', 'Managed by', 'Email', 'Phone', 'Notes'],
      [
        ['Aisha Khanna', 'Instagram', '@aisha.khanna', 'Fashion & Lifestyle', '150000', '45000', 'Reel', 'Active', '', 'aisha@example.com', '+91 90000 11111', 'Example row — delete before importing'],
        ['Rohan Mehta', 'YouTube', '@rohanmehtavlogs', 'Tech & Gadgets', '320000', '80000', 'Video', 'Prospect', '', 'rohan@example.com', '+91 90000 22222', 'Example row — delete before importing'],
      ]);
    UI.toast({ title: 'Template downloaded', sub: 'Fill it in, then import here', icon: 'download', kind: 'ok' });
  }

  function importModal(root) {
    const admin = FD.isAdmin();
    UI.modal({
      title: 'Import influencers', width: 580,
      body: `
        <p class="muted" style="margin-top:0;font-size:13px;line-height:1.5">
          Upload or paste a CSV. A header row is recommended; columns can be in any order:<br>
          <code>Name, Platform, Handle, Category, Followers, Charge (INR), Per, Status, Email, Phone, Notes</code><br>
          ${admin ? 'Add a <b>Managed by</b> column (member name) to assign owners — unknown names are assigned to you.' : 'All imported influencers are added to <b>your</b> list only.'}
          Existing data is kept — imports are added on top.
        </p>
        <div style="margin-bottom:12px"><button class="btn subtle sm" id="impTemplate">${UI.icon('download')} Download template</button>
          <span class="muted" style="font-size:12px;margin-left:8px">New to this? Start here.</span></div>
        <div class="field"><label>CSV file</label><input class="input" type="file" id="impFile" accept=".csv,text/csv" style="width:100%"/></div>
        <div class="field"><label>…or paste CSV text</label><textarea id="impText" placeholder="Name,Platform,Handle,Category,Followers,Charge (INR),Per,Status,Email,Phone,Notes&#10;Aisha Khanna,Instagram,@aisha,Fashion,150000,45000,Reel,Active,aisha@mail.com,+91 90000 00000,Great fit" style="min-height:120px"></textarea></div>
        <div id="impPreview" class="muted" style="font-size:12px;min-height:16px"></div>`,
      foot: `<button class="btn subtle" data-close>Cancel</button><button class="btn primary" id="impGo">${UI.icon('inbox')} Import</button>`,
      onMount: (m, close) => {
        const ta = m.querySelector('#impText'), pv = m.querySelector('#impPreview');
        m.querySelector('#impTemplate').onclick = downloadTemplate;
        function preview() {
          const txt = (ta.value || '').trim();
          if (!txt) { pv.textContent = ''; return; }
          let recs = []; try { recs = buildRecords(parseCSV(txt)); } catch (e) {}
          pv.textContent = recs.length ? (recs.length + ' influencer' + (recs.length > 1 ? 's' : '') + ' ready to import.') : 'No valid rows detected yet.';
        }
        m.querySelector('#impFile').onchange = (e) => {
          const f = e.target.files && e.target.files[0]; if (!f) return;
          const rd = new FileReader();
          rd.onload = () => { ta.value = String(rd.result || ''); preview(); };
          rd.readAsText(f);
        };
        ta.oninput = preview;
        m.querySelector('#impGo').onclick = () => {
          const txt = (ta.value || '').trim();
          if (!txt) { UI.toast({ title: 'Add a CSV file or paste text first', kind: 'err' }); return; }
          let recs = []; try { recs = buildRecords(parseCSV(txt)); } catch (e) {}
          if (!recs.length) { UI.toast({ title: 'No valid rows found', sub: 'Check that a Name column is present', kind: 'err' }); return; }
          const list = all();
          recs.forEach((r) => list.unshift(r));
          save(list);
          UI.toast({ title: recs.length + ' influencer' + (recs.length > 1 ? 's' : '') + ' imported', sub: admin ? 'Visible across the team' : 'Added to your list', kind: 'ok', icon: 'inbox' });
          close(); paint(root);
        };
      },
    });
  }

  function opt(v, label, sel) { return `<option value="${v}" ${v === sel ? 'selected' : ''}>${label}</option>`; }

  window.FD_VIEWS = window.FD_VIEWS || {};
  window.FD_VIEWS.influencers = { title: 'Influencers', render };
})();
