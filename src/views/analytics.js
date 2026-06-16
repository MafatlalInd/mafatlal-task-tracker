/* ============================================================
   View: Marketing Analytics
   Google Analytics (multiple properties) · Search Console ·
   Meta (multiple ad accounts) · Campaigns
   Demo data + Connect seams (live data needs API credentials).
   ============================================================ */
(function () {
  const FD = window.FD, UI = window.FD_UI, C = window.FD_CHARTS;
  const M = FD.data.marketing;
  let tab = 'web';

  // ---- Date range (base demo figures represent a 30-day window) ----
  const RANGE_KEY = 'fd-mkt-range', BASE_DAYS = 30, DAY = 86400000;
  const PRESETS = [
    { id: '7d', label: 'Last 7 days', days: 7 },
    { id: '28d', label: 'Last 28 days', days: 28 },
    { id: '30d', label: 'Last 30 days', days: 30 },
    { id: '90d', label: 'Last 90 days', days: 90 },
    { id: '12m', label: 'Last 12 months', days: 365 },
    { id: 'custom', label: 'Custom range', days: 0 },
  ];
  function iso(dt) { return dt.toISOString().slice(0, 10); }
  function defaultRange() {
    const end = FD.data.TODAY;
    const start = new Date(end.getTime() - 29 * DAY);
    return { id: '30d', from: iso(start), to: iso(end) };
  }
  function getRange() {
    try { const r = JSON.parse(localStorage.getItem(RANGE_KEY)); if (r && r.from && r.to) return r; } catch (e) {}
    return defaultRange();
  }
  function setRange(r) { try { localStorage.setItem(RANGE_KEY, JSON.stringify(r)); } catch (e) {} }
  function rangeDays() {
    const r = getRange();
    const d = Math.round((new Date(r.to + 'T00:00:00') - new Date(r.from + 'T00:00:00')) / DAY) + 1;
    return Math.max(1, d);
  }
  // Scale base (30-day) figures to the selected window length.
  function rangeFactor() { return rangeDays() / BASE_DAYS; }
  function rangeLabel() {
    const r = getRange();
    const p = PRESETS.find((x) => x.id === r.id);
    if (p && r.id !== 'custom') return p.label;
    const fmt = (s) => new Date(s + 'T00:00:00').toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' });
    return fmt(r.from) + ' – ' + fmt(r.to);
  }

  // ---- Account storage (multiple per connector) ----
  const ACCTS_KEY = 'fd-mkt-accounts', SEL_KEY = 'fd-mkt-selected', CONN_KEY = 'fd-mkt-connections';
  function allAccounts() {
    let store = null;
    try { store = JSON.parse(localStorage.getItem(ACCTS_KEY)); } catch (e) {}
    if (!store || !store.gsc || !store.metabiz) {
      store = store || {};
      if (!store.ga4) store.ga4 = M.gaAccounts.slice();
      if (!store.meta) store.meta = M.metaAccounts.slice();
      if (!store.gsc) store.gsc = M.gscAccounts.slice();
      if (!store.metabiz) store.metabiz = M.metaBizAccounts.slice();
      saveAll(store);
    }
    store.ga4 = store.ga4 || []; store.meta = store.meta || []; store.gsc = store.gsc || []; store.metabiz = store.metabiz || [];
    return store;
  }
  function saveAll(s) { try { localStorage.setItem(ACCTS_KEY, JSON.stringify(s)); } catch (e) {} }
  function accounts(conn) { return allAccounts()[conn] || []; }
  function addAccount(conn, a) { const s = allAccounts(); s[conn] = s[conn] || []; s[conn].push(a); saveAll(s); }
  function removeAccount(conn, id) { const s = allAccounts(); s[conn] = (s[conn] || []).filter((x) => x.id !== id); saveAll(s); }
  function selected(conn) { try { return (JSON.parse(localStorage.getItem(SEL_KEY)) || {})[conn] || 'all'; } catch (e) { return 'all'; } }
  function setSelected(conn, id) { let s = {}; try { s = JSON.parse(localStorage.getItem(SEL_KEY)) || {}; } catch (e) {} s[conn] = id; try { localStorage.setItem(SEL_KEY, JSON.stringify(s)); } catch (e) {} }
  function factor(conn) {
    const sel = selected(conn);
    if (sel === 'all') return 1;
    const a = accounts(conn).find((x) => x.id === sel);
    return a ? a.share : 1;
  }
  // Single-connector state (Search Console)
  function conns() { try { return JSON.parse(localStorage.getItem(CONN_KEY) || '{}'); } catch (e) { return {}; } }
  function setConn(id, v) { const c = conns(); c[id] = v; try { localStorage.setItem(CONN_KEY, JSON.stringify(c)); } catch (e) {} }
  function isConnected(id) { return !!conns()[id]; }

  const connector = (id) => FD.data.analyticsConnectors.find((c) => c.id === id);

  // ---- Number helpers ----
  const num = (v) => Math.round(v).toLocaleString('en-IN');
  const kshort = (v) => v >= 1000 ? (v / 1000).toFixed(v >= 100000 ? 0 : 1) + 'K' : Math.round(v).toString();

  function render(root) {
    root.innerHTML = `
      <div class="page">
        <div class="page-head">
          <div><h1 class="page-title">Marketing Analytics</h1><div class="page-sub">Website, search &amp; social performance · <span id="rangeSub">${rangeLabel()}</span></div></div>
          <div class="page-actions">
            <button class="btn" id="rangeBtn">${UI.icon('calendar')} <span id="rangeLbl">${rangeLabel()}</span> ${UI.icon('chevronD')}</button>
            <button class="btn" id="anExport">${UI.icon('download')} Export report</button>
          </div>
        </div>

        <div class="grid cols-3" id="connBar" style="margin-bottom:18px"></div>

        <div class="seg" id="anTabs" style="margin-bottom:18px">
          <button data-tab="web" class="${tab === 'web' ? 'active' : ''}">${UI.icon('report')} Website</button>
          <button data-tab="search" class="${tab === 'search' ? 'active' : ''}">${UI.icon('search')} Search</button>
          <button data-tab="social" class="${tab === 'social' ? 'active' : ''}">${UI.icon('megaphone')} Social</button>
          <button data-tab="campaigns" class="${tab === 'campaigns' ? 'active' : ''}">${UI.icon('bolt')} Campaigns</button>
        </div>
        <div id="anBody"></div>
      </div>`;
    UI.hydrateIcons(root);
    paintConnectors(root);
    root.querySelectorAll('#anTabs button').forEach((b) => b.onclick = () => { tab = b.getAttribute('data-tab'); render(root); });
    root.querySelector('#anExport').onclick = () => openExportMenu(root);
    root.querySelector('#rangeBtn').onclick = () => openRangeModal(root);
    paintBody(root);
  }

  function refreshRange(root) {
    const lbl = root.querySelector('#rangeLbl'); if (lbl) lbl.textContent = rangeLabel();
    const sub = root.querySelector('#rangeSub'); if (sub) sub.textContent = rangeLabel();
    paintBody(root);
  }

  function openRangeModal(root) {
    const r = getRange();
    const today = iso(FD.data.TODAY);
    UI.modal({
      title: 'Select date range', width: 480,
      body: `
        <div class="pane-section-title">Quick ranges</div>
        <div style="display:flex;flex-wrap:wrap;gap:8px;margin-bottom:6px">
          ${PRESETS.filter((p) => p.id !== 'custom').map((p) => `<button class="btn sm ${r.id === p.id ? 'primary' : ''}" data-preset="${p.id}">${p.label}</button>`).join('')}
        </div>
        <div class="pane-section-title">Custom range</div>
        <div class="field-row">
          <div class="field"><label>From</label><input type="date" class="input" id="rFrom" value="${r.from}" max="${today}" style="width:100%"/></div>
          <div class="field"><label>To</label><input type="date" class="input" id="rTo" value="${r.to}" max="${today}" style="width:100%"/></div>
        </div>
        <div class="muted" style="font-size:12px">Metrics scale to the selected window. Comparisons remain period-over-period.</div>`,
      foot: `<button class="btn subtle" data-close>Cancel</button><button class="btn primary" id="rApply">${UI.icon('check')} Apply range</button>`,
      onMount: (m, close) => {
        m.querySelectorAll('[data-preset]').forEach((b) => b.onclick = () => {
          const p = PRESETS.find((x) => x.id === b.getAttribute('data-preset'));
          const end = FD.data.TODAY, start = new Date(end.getTime() - (p.days - 1) * DAY);
          setRange({ id: p.id, from: iso(start), to: iso(end) });
          close(); refreshRange(root);
          UI.toast({ title: 'Showing ' + p.label.toLowerCase(), icon: 'calendar' });
        });
        m.querySelector('#rApply').onclick = () => {
          const from = m.querySelector('#rFrom').value, to = m.querySelector('#rTo').value;
          if (!from || !to || from > to) { UI.toast({ title: 'Pick a valid range', sub: 'From must be on or before To', kind: 'err' }); return; }
          setRange({ id: 'custom', from, to });
          close(); refreshRange(root);
          UI.toast({ title: 'Custom range applied', sub: rangeLabel(), kind: 'ok', icon: 'calendar' });
        };
      },
    });
  }

  function paintBody(root) {
    if (tab === 'web') web(root);
    else if (tab === 'search') search(root);
    else if (tab === 'social') social(root);
    else campaigns(root);
  }

  // ---- Connector cards (multi-account for GA & Meta, single for GSC) ----
  function paintConnectors(root) {
    const nounOf = (conn, count) => conn === 'ga4' ? ('propert' + (count === 1 ? 'y' : 'ies'))
      : conn === 'gsc' ? ('site' + (count === 1 ? '' : 's'))
      : conn === 'metabiz' ? ('Business account' + (count === 1 ? '' : 's'))
      : ('ad account' + (count === 1 ? '' : 's'));
    root.querySelector('#connBar').innerHTML = FD.data.analyticsConnectors.map((c) => {
      const count = accounts(c.id).length;
      return `<div class="card" style="display:flex;align-items:center;gap:12px;padding:14px 16px">
        <span class="kpi-icon" style="background:${c.color}1a;color:${c.color};width:38px;height:38px">${UI.icon(c.icon)}</span>
        <div style="flex:1"><div style="font-weight:600;font-size:13px">${c.name}</div>
          <div class="muted" style="font-size:11px">${count ? count + ' ' + nounOf(c.id, count) + ' connected' : c.desc}</div></div>
        ${count ? `<span class="badge" style="background:rgba(16,124,16,.12);color:var(--ok);margin-right:6px"><span class="dot" style="background:var(--ok)"></span>${count}</span>` : ''}
        <button class="btn ${count ? 'subtle' : 'primary'} sm" data-manage="${c.id}">${UI.icon(count ? 'settings' : 'add')} ${count ? 'Manage' : 'Add account'}</button>
      </div>`;
    }).join('');
    UI.hydrateIcons(root.querySelector('#connBar'));
    root.querySelectorAll('[data-manage]').forEach((b) => b.onclick = () => manageModal(b.getAttribute('data-manage'), root));
  }

  // ---- Manage multiple accounts (GA / Meta) ----
  const META = {
    ga4: { kind: 'Google Analytics property', tab: 'Website', tag: 'GA', idLabel: 'Measurement ID', idPlaceholder: 'G-XXXXXXXXXX', namePlaceholder: 'e.g. Mafatlal Blog', key: 'mid' },
    gsc: { kind: 'Search Console site', tab: 'Search', tag: 'GSC', idLabel: 'Site URL (property)', idPlaceholder: 'https://www.example.com/', namePlaceholder: 'e.g. blog.mafatlals.com', key: 'site' },
    metabiz: { kind: 'Meta Business account (Page)', tab: 'Social', tag: 'PAGE', idLabel: 'Page / Business account ID', idPlaceholder: 'e.g. 1789045210 or @handle', namePlaceholder: 'e.g. Mafatlal Retail — Instagram', key: 'biz' },
    meta: { kind: 'Meta ad account', tab: 'Campaigns', tag: 'ADS', idLabel: 'Ad Account ID', idPlaceholder: 'act_XXXXXXXXX', namePlaceholder: 'e.g. Mafatlal Exports — Meta Ads', key: 'acc' },
  };

  function manageModal(conn, root) {
    const c = connector(conn);
    const cfg = META[conn];
    function body() {
      const list = accounts(conn);
      return `
        <div class="banner info" style="margin-bottom:16px">${UI.icon(c.icon)}
          <div>Add every ${cfg.kind} you manage. Switch between them (or view all combined) from the ${cfg.tab} tab. Live data needs <b>${c.hint}</b>.</div></div>
        <div class="pane-section-title">Connected accounts (${list.length})</div>
        <div id="acctList">
          ${list.length ? list.map((a) => `
            <div class="attach" data-row="${a.id}">
              <span class="file-ic" style="background:${c.color}">${cfg.tag}</span>
              <div style="flex:1"><div style="font-weight:600;font-size:13px">${a.name}</div>
                <div class="muted" style="font-size:11px">${a[cfg.key]}</div></div>
              <button class="btn subtle sm" data-remove="${a.id}">${UI.icon('trash')}</button>
            </div>`).join('') : `<div class="muted" style="font-size:13px;padding:8px 0">No accounts yet — add your first below.</div>`}
        </div>
        <div class="pane-section-title">Add an account</div>
        <div class="field"><label>Account name</label><input class="input" id="acName" placeholder="${cfg.namePlaceholder}" style="width:100%"/></div>
        <div class="field"><label>${cfg.idLabel}</label><input class="input" id="acId" placeholder="${cfg.idPlaceholder}" style="width:100%"/></div>`;
    }
    const m = UI.modal({
      title: 'Manage ' + c.name, width: 520, body: body(),
      foot: `<button class="btn subtle" data-close>Done</button><button class="btn primary" id="acAdd">${UI.icon('add')} Add account</button>`,
      onMount: (mod, close) => wire(mod, close),
    });
    function wire(mod, close) {
      mod.querySelectorAll('[data-remove]').forEach((b) => b.onclick = () => {
        removeAccount(conn, b.getAttribute('data-remove'));
        if (selected(conn) === b.getAttribute('data-remove')) setSelected(conn, 'all');
        refresh(mod, close);
      });
      mod.querySelector('#acAdd').onclick = () => {
        const name = mod.querySelector('#acName').value.trim();
        const id = mod.querySelector('#acId').value.trim();
        if (!name || !id) { UI.toast({ title: 'Enter a name and ID', kind: 'err' }); return; }
        const acct = { id: 'acc' + Date.now(), name, share: 0.2 };
        acct[cfg.key] = id;
        if (conn === 'meta') acct.spend = 0;
        addAccount(conn, acct);
        UI.toast({ title: 'Account added', sub: name + ' connected', kind: 'ok', icon: 'plug' });
        refresh(mod, close);
      };
    }
    function refresh(mod, close) {
      mod.querySelector('.modal-body').innerHTML = body();
      UI.hydrateIcons(mod);
      wire(mod, close);
      paintConnectors(root);
      paintBody(root);
    }
  }

  // ---- Account selector strip ----
  function acctSelector(conn, root) {
    const accs = accounts(conn), sel = selected(conn), cfg = META[conn];
    const label = conn === 'ga4' ? 'Property' : conn === 'gsc' ? 'Site' : conn === 'metabiz' ? 'Business account' : 'Ad account';
    const cur = accs.find((a) => a.id === sel) || {};
    return `<div class="toolbar" style="margin-bottom:14px">
      <label class="muted" style="font-size:12px;font-weight:600">${label}:</label>
      <select class="select" id="acctSel" style="min-width:240px">
        <option value="all" ${sel === 'all' ? 'selected' : ''}>All accounts (combined)</option>
        ${accs.map((a) => `<option value="${a.id}" ${sel === a.id ? 'selected' : ''}>${a.name}</option>`).join('')}
      </select>
      ${sel !== 'all' ? `<span class="chip">${UI.icon('report')} ${cur[cfg.key] || ''}</span>` : `<span class="chip">${accs.length} accounts</span>`}
      <div class="spacer"></div>
      <button class="btn subtle sm" id="acctManage">${UI.icon('settings')} Manage accounts</button>
    </div>`;
  }
  function wireSelector(root, conn) {
    const sel = root.querySelector('#acctSel');
    if (sel) sel.onchange = (e) => { setSelected(conn, e.target.value); paintBody(root); };
    const mg = root.querySelector('#acctManage');
    if (mg) mg.onclick = () => manageModal(conn, root);
  }

  function kpi(label, value, m, color) {
    return `<div class="kpi">
      <div class="kpi-top"><span class="kpi-label">${label}</span>
        <span class="kpi-trend ${m.up ? 'up' : 'down'}">${UI.icon(m.up ? 'arrowUp' : 'arrowDown')}${m.delta}</span></div>
      <div class="kpi-val" style="font-size:26px;margin-top:6px;${color ? 'color:' + color : ''}">${value}</div>
    </div>`;
  }

  // ---- Website (GA4, multi-property) ----
  function web(root) {
    const host = root.querySelector('#anBody');
    if (!accounts('ga4').length) { host.innerHTML = emptyConnect('ga4', root); wireEmpty(host, 'ga4', root); return; }
    const fAcct = factor('ga4'), f = fAcct * rangeFactor(), g = M.gaNum, d = M.ga;
    host.innerHTML = acctSelector('ga4', root) + `
      <div class="grid kpi-grid" style="margin-bottom:16px">
        ${kpi('Users', num(g.users * f), d.users, 'var(--mafatlal-red)')}
        ${kpi('Sessions', num(g.sessions * f), d.sessions)}
        ${kpi('Pageviews', num(g.pageviews * f), d.pageviews)}
        ${kpi('Conversions', num(g.conversions * f), d.conversions, 'var(--ok)')}
      </div>
      <div class="grid cols-12" style="margin-bottom:16px">
        <div class="card">
          <div class="card-head"><div><div class="card-title">Traffic Growth</div><div class="card-sub">Users vs sessions · last 6 months</div></div>
            <div class="legend"><span class="legend-item"><span class="sw" style="background:var(--mafatlal-red)"></span>Users</span><span class="legend-item"><span class="sw" style="background:var(--ms-blue)"></span>Sessions</span></div></div>
          ${C.line({ height: 180, labels: M.trafficTrend.map((x) => x.label),
            series: [
              { points: M.trafficTrend.map((x) => Math.round(x.users * fAcct)), color: css('--mafatlal-red'), fill: true },
              { points: M.trafficTrend.map((x) => Math.round(x.sessions * fAcct)), color: css('--ms-blue'), fill: true },
            ] })}
        </div>
        <div class="card" style="display:flex;flex-direction:column;align-items:center">
          <div class="card-head" style="width:100%"><div class="card-title">Traffic Sources</div></div>
          <div style="display:flex;align-items:center;gap:16px;flex-wrap:wrap;justify-content:center">
            ${C.donut({ size: 140, thickness: 20, center: '100%', centerSub: 'traffic', segments: M.sources.map((s) => ({ value: s.value, color: s.color })) })}
            <div style="display:flex;flex-direction:column;gap:6px">
              ${M.sources.map((s) => `<span class="legend-item"><span class="sw" style="background:${s.color}"></span>${s.name} <b style="margin-left:auto;padding-left:10px">${s.value}%</b></span>`).join('')}
            </div>
          </div>
        </div>
      </div>
      <div class="card">
        <div class="card-head"><div class="card-title">Top Pages</div><div class="card-sub">Pageviews this month</div></div>
        <table class="tbl" style="border:0"><thead><tr><th>Page</th><th>Views</th><th>Change</th><th>Engagement</th></tr></thead><tbody>
          ${M.topPages.map((p) => `<tr><td class="t-name">${p.path}</td><td>${num(p.views * f)}</td>
            <td style="color:${p.change.startsWith('-') ? 'var(--critical)' : 'var(--ok)'};font-weight:600">${p.change}</td>
            <td><div class="progress-bar" style="width:120px"><i style="width:${Math.min(100, p.views / 200)}%"></i></div></td></tr>`).join('')}
        </tbody></table>
      </div>`;
    UI.hydrateIcons(host);
    wireSelector(root, 'ga4');
  }

  // ---- Social (Meta Business accounts — organic post performance + history) ----
  function social(root) {
    const host = root.querySelector('#anBody');
    if (!accounts('metabiz').length) { host.innerHTML = emptyConnect('metabiz', root); wireEmpty(host, 'metabiz', root); return; }
    const fAcct = factor('metabiz'), f = fAcct * rangeFactor(), mt = M.metaBizNum, d = M.meta;
    const acctName = selected('metabiz') === 'all' ? 'All Business accounts' : (accounts('metabiz').find((a) => a.id === selected('metabiz')) || {}).name;
    const fmtDate = (s) => new Date(s + 'T00:00:00').toLocaleDateString('en-US', { day: 'numeric', month: 'short' });
    host.innerHTML = acctSelector('metabiz', root) + `
      <div class="grid cols-3" style="margin-bottom:16px">
        ${kpi('Reach', kshort(mt.reach * f), d.reach, 'var(--mafatlal-red)')}
        ${kpi('Engagement', kshort(mt.engagement * f), d.engagement)}
        ${kpi('Followers', num(mt.followers * fAcct), d.followers, 'var(--ok)')}
      </div>

      <div class="card" style="margin-bottom:16px">
        <div class="card-head"><div><div class="card-title">Post Performance Over Time</div><div class="card-sub">Past 6 months · ${acctName}</div></div>
          <div class="legend"><span class="legend-item"><span class="sw" style="background:var(--mafatlal-red)"></span>Reach</span><span class="legend-item"><span class="sw" style="background:var(--teams)"></span>Engagement</span></div></div>
        ${C.line({ height: 180, labels: M.postTrend.map((x) => x.label),
          series: [
            { points: M.postTrend.map((x) => Math.round(x.reach * fAcct)), color: css('--mafatlal-red'), fill: true },
            { points: M.postTrend.map((x) => Math.round(x.eng * fAcct * 12)), color: css('--teams'), fill: true },
          ] })}
        <div class="muted" style="font-size:11px;text-align:center;margin-top:6px">Engagement plotted ×12 for readability against reach.</div>
      </div>

      <div class="card" style="margin-bottom:16px">
        <div class="card-head"><div class="card-title">Follower Growth</div><div class="card-sub">${acctName}</div></div>
        ${C.bars({ height: 170, data: M.meta.growth.map((g) => ({ label: g.label, value: Math.round(g.value * fAcct), color: css('--teams') })), fmt: (v) => (v / 1000).toFixed(1) + 'k' })}
      </div>

      ${postWiseTable()}`;
    UI.hydrateIcons(host);
    wireSelector(root, 'metabiz');

    function postWiseTable() {
      const sel = selected('metabiz');
      const showAll = sel === 'all';
      const pageName = (id) => (accounts('metabiz').find((a) => a.id === id) || {}).name || '—';
      let posts = M.pastPosts.filter((p) => showAll || p.acct === sel);
      const eng = (p) => p.likes + p.comments + p.shares;
      const engRate = (p) => p.reach ? ((eng(p) / p.reach) * 100).toFixed(1) + '%' : '—';
      return `<div class="card">
        <div class="card-head"><div><div class="card-title">Post-wise Analytics</div>
          <div class="card-sub">${showAll ? 'Every post across ' + accounts('metabiz').length + ' brand pages' : pageName(sel)} · ${posts.length} posts</div></div></div>
        ${posts.length ? `<table class="tbl" style="border:0"><thead><tr>
            <th>Date</th>${showAll ? '<th>Page</th>' : ''}<th>Post</th><th>Type</th><th>Reach</th><th>Likes</th><th>Comments</th><th>Shares</th><th>Engagement</th><th>Eng. rate</th>
          </tr></thead><tbody>
          ${posts.map((p) => `<tr>
            <td class="muted" style="white-space:nowrap">${fmtDate(p.date)}</td>
            ${showAll ? `<td><span class="chip" style="font-size:11px">${pageName(p.acct)}</span></td>` : ''}
            <td class="t-name">${p.title}</td>
            <td><span class="chip">${p.type}</span></td>
            <td>${num(p.reach)}</td>
            <td>${num(p.likes)}</td>
            <td>${num(p.comments)}</td>
            <td>${num(p.shares)}</td>
            <td><b>${num(eng(p))}</b></td>
            <td><span class="badge" style="background:rgba(16,124,16,.1);color:var(--ok)">${engRate(p)}</span></td>
          </tr>`).join('')}
        </tbody></table>` : `<div class="empty" style="padding:30px">${UI.icon('megaphone')}<div>No posts for this page yet</div></div>`}
      </div>`;
    }
  }

  function emptyConnect(conn, root) {
    const c = connector(conn);
    const thing = conn === 'ga4' ? 'Google Analytics properties' : conn === 'gsc' ? 'Search Console sites' : conn === 'metabiz' ? 'Meta Business accounts' : 'Meta ad accounts';
    const seeing = conn === 'ga4' ? 'website traffic' : conn === 'gsc' ? 'search performance' : conn === 'metabiz' ? 'social post performance' : 'ad performance';
    return `<div class="card"><div class="empty">${UI.icon(c.icon)}
      <div style="font-weight:600;color:var(--text-2)">No ${thing} yet</div>
      <div style="font-size:12px;margin:6px 0 14px">Add one to start seeing ${seeing}.</div>
      <button class="btn primary sm" id="emptyAdd">${UI.icon('add')} Add account</button></div></div>`;
  }
  function wireEmpty(host, conn, root) { const b = host.querySelector('#emptyAdd'); if (b) b.onclick = () => manageModal(conn, root); UI.hydrateIcons(host); }

  // ---- Search (Search Console, multi-site) ----
  function search(root) {
    const host = root.querySelector('#anBody');
    if (!accounts('gsc').length) { host.innerHTML = emptyConnect('gsc', root); wireEmpty(host, 'gsc', root); return; }
    const s = M.search, f = factor('gsc') * rangeFactor(), g = M.gscNum;
    host.innerHTML = acctSelector('gsc', root) + `
      <div class="grid kpi-grid" style="margin-bottom:16px">
        ${kpi('Total Clicks', num(g.clicks * f), s.clicks, 'var(--mafatlal-red)')}
        ${kpi('Impressions', kshort(g.impressions * f), s.impressions)}
        ${kpi('Avg CTR', s.ctr.value, s.ctr)}
        ${kpi('Avg Position', s.position.value, s.position, 'var(--ok)')}
      </div>
      <div class="card">
        <div class="card-head"><div><div class="card-title">Top Search Queries</div><div class="card-sub">${selected('gsc') === 'all' ? 'Combined across ' + accounts('gsc').length + ' sites' : (accounts('gsc').find((a) => a.id === selected('gsc')) || {}).name}</div></div></div>
        <table class="tbl" style="border:0"><thead><tr><th>Query</th><th>Clicks</th><th>Impressions</th><th>Avg position</th></tr></thead><tbody>
          ${s.queries.map((q) => `<tr><td class="t-name">${q.q}</td><td>${num(q.clicks * f)}</td><td>${num(q.impr * f)}</td>
            <td><span class="badge" style="background:${q.pos <= 3 ? 'rgba(16,124,16,.12)' : q.pos <= 10 ? 'rgba(193,156,0,.13)' : 'rgba(209,52,56,.1)'};color:${q.pos <= 3 ? 'var(--ok)' : q.pos <= 10 ? 'var(--medium)' : 'var(--critical)'}">${q.pos.toFixed(1)}</span></td></tr>`).join('')}
        </tbody></table>
      </div>`;
    UI.hydrateIcons(host);
    wireSelector(root, 'gsc');
  }

  // ---- Campaigns ----
  function campaigns(root) {
    const host = root.querySelector('#anBody');
    const fmt = (n) => '₹' + (n >= 100000 ? (n / 100000).toFixed(1) + 'L' : n.toLocaleString());
    const statusColor = { 'Active': 'var(--ok)', 'Scheduled': 'var(--medium)', 'Planned': 'var(--text-3)', 'Completed': 'var(--ms-blue)' };
    host.innerHTML = `
      <div class="card">
        <div class="card-head"><div><div class="card-title">Marketing Campaigns</div><div class="card-sub">Budget, spend &amp; performance</div></div>
          <button class="btn primary sm" id="newCampaign">${UI.icon('add')} New campaign</button></div>
        <table class="tbl" style="border:0"><thead><tr><th>Campaign</th><th>Channel</th><th>Status</th><th>Budget</th><th>Spend</th><th>Reach</th><th>Conversions</th><th>Owner</th></tr></thead><tbody>
          ${M.campaigns.map((c) => `<tr>
            <td class="t-name">${c.name}</td>
            <td><span class="chip">${c.channel}</span></td>
            <td><span class="st"><span class="dot" style="background:${statusColor[c.status]}"></span>${c.status}</span></td>
            <td>${fmt(c.budget)}</td>
            <td>${c.spend ? fmt(c.spend) : '—'} ${c.spend ? `<div class="progress-bar" style="width:70px;margin-top:4px"><i style="width:${Math.round(c.spend / c.budget * 100)}%"></i></div>` : ''}</td>
            <td>${c.reach ? c.reach.toLocaleString() : '—'}</td>
            <td>${c.conv ? '<b>' + c.conv.toLocaleString() + '</b>' : '—'}</td>
            <td>${UI.avatar(c.owner, 'sm')}</td>
          </tr>`).join('')}
        </tbody></table>
      </div>
      <div class="grid cols-3" style="margin-top:16px">
        <div class="kpi"><div class="kpi-label">Active campaigns</div><div class="kpi-val">${M.campaigns.filter((c) => c.status === 'Active').length}</div></div>
        <div class="kpi"><div class="kpi-label">Total reach</div><div class="kpi-val" style="color:var(--mafatlal-red)">${(M.campaigns.reduce((s, c) => s + c.reach, 0) / 1000).toFixed(0)}K</div></div>
        <div class="kpi"><div class="kpi-label">Conversions</div><div class="kpi-val" style="color:var(--ok)">${M.campaigns.reduce((s, c) => s + c.conv, 0).toLocaleString()}</div></div>
      </div>`;
    UI.hydrateIcons(host);
    host.querySelector('#newCampaign').onclick = () => UI.toast({ title: 'New campaign', sub: 'Campaign builder would open here' });
  }

  // ---- Export (CSV) of every analytics dataset ----
  function openExportMenu(root) {
    const E = window.FD_EXPORT, dt = E.today();
    const pageName = (id) => (accounts('metabiz').find((a) => a.id === id) || {}).name || '';
    const uname = (id) => (FD.userById(id) || {}).name || '';
    const fGa = factor('ga4'), fGaR = fGa * rangeFactor();
    const fGscR = factor('gsc') * rangeFactor();
    const fMeta = factor('metabiz');
    const items = [
      { label: 'Website — Traffic by month', sub: 'Google Analytics', icon: 'report',
        fn: () => E.csv('GA_traffic_' + dt + '.csv', ['Month', 'Users', 'Sessions'], M.trafficTrend.map((x) => [x.label, Math.round(x.users * fGa), Math.round(x.sessions * fGa)])) },
      { label: 'Website — Top pages', sub: 'Google Analytics', icon: 'report',
        fn: () => E.csv('GA_top_pages_' + dt + '.csv', ['Page', 'Views', 'Change'], M.topPages.map((p) => [p.path, Math.round(p.views * fGaR), p.change])) },
      { label: 'Search — Top queries', sub: 'Search Console', icon: 'search',
        fn: () => E.csv('SearchConsole_queries_' + dt + '.csv', ['Query', 'Clicks', 'Impressions', 'Avg position'], M.search.queries.map((q) => [q.q, Math.round(q.clicks * fGscR), Math.round(q.impr * fGscR), q.pos])) },
      { label: 'Social — Post-wise analytics', sub: 'Meta Business pages', icon: 'megaphone',
        fn: () => { const sel = selected('metabiz'); const posts = M.pastPosts.filter((p) => sel === 'all' || p.acct === sel);
          E.csv('Meta_posts_' + dt + '.csv', ['Date', 'Page', 'Post', 'Type', 'Reach', 'Likes', 'Comments', 'Shares', 'Engagement'], posts.map((p) => [p.date, pageName(p.acct), p.title, p.type, p.reach, p.likes, p.comments, p.shares, p.likes + p.comments + p.shares])); } },
      { label: 'Social — Follower growth', sub: 'Meta Business pages', icon: 'megaphone',
        fn: () => E.csv('Meta_followers_' + dt + '.csv', ['Week', 'Followers'], M.meta.growth.map((g) => [g.label, Math.round(g.value * fMeta)])) },
      { label: 'Ad campaigns', sub: 'Meta Ads & others', icon: 'bolt',
        fn: () => E.csv('Campaigns_' + dt + '.csv', ['Campaign', 'Channel', 'Status', 'Budget (INR)', 'Spend (INR)', 'Reach', 'Conversions', 'Owner'], M.campaigns.map((c) => [c.name, c.channel, c.status, c.budget, c.spend, c.reach, c.conv, uname(c.owner)])) },
    ];
    UI.modal({
      title: 'Export data (CSV)', width: 480,
      body: `<div class="muted" style="font-size:12.5px;margin-bottom:12px">Each download is a .csv file (opens in Excel / Google Sheets) and reflects the current account &amp; date-range selection.</div>` +
        items.map((it, idx) => `<div class="attach" data-x="${idx}" style="cursor:pointer">
          <span class="notif-ic" style="background:var(--ms-blue-wash);color:var(--ms-blue);width:32px;height:32px">${UI.icon(it.icon)}</span>
          <div style="flex:1"><div style="font-weight:600;font-size:13px">${it.label}</div><div class="muted" style="font-size:11px">${it.sub}</div></div>
          ${UI.icon('download')}</div>`).join(''),
      foot: `<button class="btn subtle" data-close>Done</button>`,
      onMount: (m) => {
        UI.hydrateIcons(m);
        m.querySelectorAll('[data-x]').forEach((el) => el.onclick = () => {
          const it = items[+el.getAttribute('data-x')];
          it.fn();
          UI.toast({ title: 'Exported', sub: it.label + '.csv', icon: 'download', kind: 'ok' });
        });
      },
    });
  }

  function monthLabel() { return FD.data.TODAY.toLocaleDateString('en-US', { month: 'long', year: 'numeric' }); }
  function css(v) { return getComputedStyle(document.documentElement).getPropertyValue(v).trim(); }

  window.FD_VIEWS = window.FD_VIEWS || {};
  window.FD_VIEWS.analytics = { title: 'Marketing Analytics', render };
})();
