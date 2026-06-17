/* ============================================================
   View: Marketing Expenses — monthly, by division & cost head
   Divisions: Healthcare, Home Fashion, Uniform, Corporate, Online
   - Add expense (division, cost head, month, amount)
   - Single-month (editable) or custom date range (aggregated)
   - Month-on-month comparison · CSV export
   Editable by Admin; everyone can view & export.
   ============================================================ */
(function () {
  const FD = window.FD, UI = window.FD_UI, C = window.FD_CHARTS;
  const KEY = 'fd-expenses-v1';

  const DIVS = [
    { id: 'health', name: 'Healthcare', color: '#107c10' },
    { id: 'home', name: 'Home Fashion', color: '#c13584' },
    { id: 'uniform', name: 'Uniform', color: '#0078d4' },
    { id: 'corp', name: 'Corporate', color: '#605e5c' },
    { id: 'online', name: 'Online', color: '#ca5010' },
  ];
  const CATS = [
    { key: 'smRetainer', label: 'Social Media Agency Retainer' },
    { key: 'perfRetainer', label: 'Performance Marketing Retainer' },
    { key: 'shopify', label: 'Shopify Cost' },
    { group: 'Meta Ad Cost', children: [
      { key: 'metaLead', label: 'Lead-Gen Ads' },
      { key: 'metaAwareness', label: 'Awareness Ads' },
      { key: 'metaShopping', label: 'Shopping Ads' },
    ] },
    { key: 'googleAds', label: 'Google Ads' },
    { key: 'seoRetainer', label: 'SEO Agency Retainer' },
    { key: 'influencer', label: 'Influencer Collaboration' },
    { key: 'tools', label: 'Marketing Tools' },
    { key: 'other', label: 'Other Costs' },
  ];
  const ALL_KEYS = CATS.reduce((a, c) => a.concat(c.children ? c.children.map((x) => x.key) : [c.key]), []);
  // flat list for the Add-expense dropdown
  const FLAT = [];
  CATS.forEach((c) => { if (c.children) c.children.forEach((ch) => FLAT.push({ key: ch.key, label: 'Meta Ads — ' + ch.label })); else FLAT.push({ key: c.key, label: c.label }); });

  const SEED_MONTH = FD.data.iso(FD.data.TODAY).slice(0, 7);
  const SEED = {
    health: { smRetainer: 60000, perfRetainer: 80000, shopify: 0, metaLead: 150000, metaAwareness: 50000, metaShopping: 0, googleAds: 90000, seoRetainer: 40000, influencer: 30000, tools: 15000, other: 10000 },
    home: { smRetainer: 70000, perfRetainer: 90000, shopify: 25000, metaLead: 80000, metaAwareness: 60000, metaShopping: 120000, googleAds: 110000, seoRetainer: 45000, influencer: 80000, tools: 18000, other: 12000 },
    uniform: { smRetainer: 40000, perfRetainer: 50000, shopify: 0, metaLead: 70000, metaAwareness: 30000, metaShopping: 0, googleAds: 60000, seoRetainer: 30000, influencer: 15000, tools: 10000, other: 8000 },
    corp: { smRetainer: 50000, perfRetainer: 0, shopify: 0, metaLead: 0, metaAwareness: 80000, metaShopping: 0, googleAds: 20000, seoRetainer: 35000, influencer: 20000, tools: 12000, other: 15000 },
    online: { smRetainer: 80000, perfRetainer: 120000, shopify: 40000, metaLead: 200000, metaAwareness: 90000, metaShopping: 180000, googleAds: 160000, seoRetainer: 60000, influencer: 100000, tools: 25000, other: 20000 },
  };
  const SEED_PREV_MONTH = (function () { const dt = new Date(SEED_MONTH + '-01T00:00:00'); dt.setMonth(dt.getMonth() - 1); return FD.data.iso(dt).slice(0, 7); })();
  const PREV_FACTOR = { health: 0.92, home: 0.85, uniform: 0.96, corp: 1.08, online: 0.80 };
  function buildPrev() { const out = {}; DIVS.forEach((d) => { out[d.id] = {}; ALL_KEYS.forEach((k) => { out[d.id][k] = Math.round((SEED[d.id][k] || 0) * PREV_FACTOR[d.id] / 1000) * 1000; }); }); return out; }

  // state
  let month = SEED_MONTH;
  let rangeMode = false, rangeFrom = SEED_PREV_MONTH, rangeTo = SEED_MONTH;

  function load() { try { return JSON.parse(localStorage.getItem(KEY) || '{}'); } catch (e) { return {}; } }
  function save(d) { try { localStorage.setItem(KEY, JSON.stringify(d)); } catch (e) {} }
  function monthData(m) {
    const all = load();
    if (all[m]) return all[m];
    if (m === SEED_MONTH) { all[m] = JSON.parse(JSON.stringify(SEED)); save(all); return all[m]; }
    if (m === SEED_PREV_MONTH) { all[m] = buildPrev(); save(all); return all[m]; }
    return {};
  }
  function cell(m, div, key) { return ((monthData(m)[div] || {})[key]) || 0; }
  function setCell(m, div, key, val) { const all = load(); all[m] = all[m] || {}; all[m][div] = all[m][div] || {}; all[m][div][key] = val; save(all); }

  const fmt = (n) => '₹' + Math.round(n).toLocaleString('en-IN');
  const fmtL = (n) => n >= 100000 ? '₹' + (n / 100000).toFixed(n % 100000 ? 1 : 0) + 'L' : '₹' + Math.round(n).toLocaleString('en-IN');
  const monthLabel = (m) => new Date(m + '-01T00:00:00').toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  const monthShort = (m) => new Date(m + '-01T00:00:00').toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
  const shiftMonth = (m, delta) => { const dt = new Date(m + '-01T00:00:00'); dt.setMonth(dt.getMonth() + delta); return FD.data.iso(dt).slice(0, 7); };
  function monthsBetween(a, b) { if (a > b) { const t = a; a = b; b = t; } const out = []; let dt = new Date(a + '-01T00:00:00'); const end = new Date(b + '-01T00:00:00'); while (dt <= end) { out.push(FD.data.iso(dt).slice(0, 7)); dt.setMonth(dt.getMonth() + 1); } return out; }

  // period-aware getters (single month or aggregated range)
  function periodMonths() { return rangeMode ? monthsBetween(rangeFrom, rangeTo) : [month]; }
  function gCell(div, key) { return periodMonths().reduce((s, m) => s + cell(m, div, key), 0); }
  const gDivTotal = (div) => ALL_KEYS.reduce((s, k) => s + gCell(div, k), 0);
  const gCatTotal = (key) => DIVS.reduce((s, d) => s + gCell(d.id, key), 0);
  const gMeta = (div) => gCell(div, 'metaLead') + gCell(div, 'metaAwareness') + gCell(div, 'metaShopping');
  const gGrand = () => DIVS.reduce((s, d) => s + gDivTotal(d.id), 0);
  const periodLabel = () => rangeMode ? (monthShort(rangeFrom) + ' – ' + monthShort(rangeTo)) : monthLabel(month);

  function render(root) {
    const periodCtrl = rangeMode
      ? `<span class="muted" style="font-size:12px;font-weight:600">From</span><input type="month" class="input" id="rFrom" value="${rangeFrom}" style="width:130px">
         <span class="muted" style="font-size:12px;font-weight:600">to</span><input type="month" class="input" id="rTo" value="${rangeTo}" style="width:130px">
         <button class="btn subtle sm" id="singleBtn">${UI.icon('calendar')} Single month</button>`
      : `<div class="seg" style="padding:2px">
           <button id="prevM" style="width:32px;justify-content:center">${UI.icon('chevronD')}</button>
           <button class="active" style="min-width:130px;justify-content:center;padding:0" id="monthLbl"><input type="month" id="monthPick" value="${month}" style="border:0;background:transparent;font-weight:600;font-family:inherit;color:inherit;text-align:center;width:130px"></button>
           <button id="nextM" style="width:32px;justify-content:center">${UI.icon('chevronR')}</button>
         </div>
         <button class="btn subtle sm" id="rangeBtn">${UI.icon('calendar')} Custom range</button>`;
    root.innerHTML = `
      <div class="page">
        <div class="page-head">
          <div><h1 class="page-title">${UI.icon('report')} Marketing Expenses</h1>
            <div class="page-sub">Monthly spend by division &amp; cost head${FD.isAdmin() ? '' : ' · view only'}</div></div>
          <div class="page-actions">
            ${periodCtrl}
            ${FD.isAdmin() ? `<button class="btn primary" id="addExp">${UI.icon('add')} Add expense</button>` : ''}
            <button class="btn" id="expExport">${UI.icon('download')} Export CSV</button>
          </div>
        </div>
        <div id="expBody"></div>
      </div>`;
    UI.hydrateIcons(root);
    if (rangeMode) {
      root.querySelector('#singleBtn').onclick = () => { rangeMode = false; render(root); };
      root.querySelector('#rFrom').onchange = (e) => { rangeFrom = e.target.value; render(root); };
      root.querySelector('#rTo').onchange = (e) => { rangeTo = e.target.value; render(root); };
    } else {
      root.querySelector('#prevM').style.transform = 'rotate(90deg)';
      root.querySelector('#prevM').onclick = () => { month = shiftMonth(month, -1); render(root); };
      root.querySelector('#nextM').onclick = () => { month = shiftMonth(month, 1); render(root); };
      root.querySelector('#monthPick').onchange = (e) => { if (e.target.value) { month = e.target.value; render(root); } };
      root.querySelector('#rangeBtn').onclick = () => { rangeMode = true; render(root); };
    }
    if (root.querySelector('#addExp')) root.querySelector('#addExp').onclick = () => addExpenseModal(root);
    root.querySelector('#expExport').onclick = () => exportCSV();
    paint(root);
  }

  function paint(root) {
    const admin = FD.isAdmin(), editable = admin && !rangeMode;
    const segs = DIVS.map((d) => ({ value: gDivTotal(d.id), color: d.color })).filter((s) => s.value > 0);

    const numCell = (div, key) => editable
      ? `<input class="exp-cell" type="number" min="0" step="1000" data-div="${div}" data-key="${key}" value="${cell(month, div, key) || ''}" placeholder="0"/>`
      : `<span>${gCell(div, key) ? fmt(gCell(div, key)) : '—'}</span>`;

    let body = '';
    CATS.forEach((c) => {
      if (c.children) {
        body += `<tr class="exp-group"><td><b>${c.group}</b></td>${DIVS.map((d) => `<td><b>${fmt(gMeta(d.id))}</b></td>`).join('')}<td class="exp-rowtot"><b>${fmt(DIVS.reduce((s, d) => s + gMeta(d.id), 0))}</b></td></tr>`;
        c.children.forEach((ch) => { body += `<tr class="exp-child"><td>${ch.label}</td>${DIVS.map((d) => `<td>${numCell(d.id, ch.key)}</td>`).join('')}<td class="exp-rowtot">${fmt(gCatTotal(ch.key))}</td></tr>`; });
      } else {
        body += `<tr><td>${c.label}</td>${DIVS.map((d) => `<td>${numCell(d.id, c.key)}</td>`).join('')}<td class="exp-rowtot">${fmt(gCatTotal(c.key))}</td></tr>`;
      }
    });

    root.querySelector('#expBody').innerHTML = `
      <div class="grid cols-12" style="margin-bottom:16px">
        <div class="card">
          <div class="card-head"><div><div class="card-title">Spend by Division</div><div class="card-sub">${rangeMode ? periodLabel() + ' (' + periodMonths().length + ' months)' : monthLabel(month)}</div></div>
            <div style="font-size:20px;font-weight:700">${fmtL(gGrand())}</div></div>
          ${segs.length ? `<div style="display:flex;flex-wrap:wrap;gap:10px">
            ${DIVS.map((d) => `<div style="flex:1 1 150px"><div style="display:flex;justify-content:space-between;font-size:12px;margin-bottom:4px"><span style="font-weight:600">${d.name}</span><span class="muted">${gGrand() ? Math.round(gDivTotal(d.id) / gGrand() * 100) : 0}%</span></div>
              <div class="progress-bar"><i style="width:${gGrand() ? gDivTotal(d.id) / gGrand() * 100 : 0}%;background:${d.color}"></i></div>
              <div style="font-size:13px;font-weight:600;margin-top:4px">${fmt(gDivTotal(d.id))}</div></div>`).join('')}
          </div>` : '<div class="empty">No spend recorded for this period</div>'}
        </div>
        <div class="card" style="display:flex;flex-direction:column;align-items:center;justify-content:center">
          <div class="card-head" style="width:100%"><div class="card-title">Division Share</div></div>
          ${segs.length ? C.donut({ size: 150, thickness: 22, center: fmtL(gGrand()), centerSub: 'total', segments: segs }) : `<div class="empty" style="padding:30px">${UI.icon('report')}<div>Add amounts to see the split</div></div>`}
        </div>
      </div>

      ${rangeMode ? '' : momCard(month)}

      <div class="tbl-wrap">
        <table class="tbl exp-table"><thead><tr>
          <th style="min-width:200px">Cost Head</th>${DIVS.map((d) => `<th><span style="display:inline-flex;align-items:center;gap:6px"><span style="width:8px;height:8px;border-radius:2px;background:${d.color}"></span>${d.name}</span></th>`).join('')}<th>Total</th>
        </tr></thead>
        <tbody>${body}</tbody>
        <tfoot><tr class="exp-total"><td><b>${rangeMode ? 'Range Total' : 'Monthly Total'}</b></td>${DIVS.map((d) => `<td><b>${fmt(gDivTotal(d.id))}</b></td>`).join('')}<td><b>${fmt(gGrand())}</b></td></tr></tfoot>
        </table>
      </div>
      ${editable ? '<div class="muted" style="font-size:12px;margin-top:10px">Tap a cell to edit, or use “Add expense”. Amounts in ₹ · changes save automatically per month.</div>'
        : rangeMode ? '<div class="muted" style="font-size:12px;margin-top:10px">Aggregated across ' + periodMonths().length + ' months — switch to a single month to edit.</div>' : ''}`;
    UI.hydrateIcons(root.querySelector('#expBody'));

    root.querySelectorAll('.exp-cell').forEach((inp) => inp.onchange = () => {
      setCell(month, inp.getAttribute('data-div'), inp.getAttribute('data-key'), parseInt(inp.value, 10) || 0);
      paint(root);
    });
  }

  // Add a single expense to a division / cost head / month
  function addExpenseModal(root) {
    if (!FD.isAdmin()) { UI.toast({ title: 'Admins only', kind: 'err' }); return; }
    const defMonth = rangeMode ? rangeTo : month;
    UI.modal({
      title: 'Add expense', width: 480,
      body: `
        <div class="field-row">
          <div class="field"><label>Division</label><select class="select" id="ae-div" style="width:100%">${DIVS.map((d) => `<option value="${d.id}">${d.name}</option>`).join('')}</select></div>
          <div class="field"><label>Cost head</label><select class="select" id="ae-cat" style="width:100%">${FLAT.map((c) => `<option value="${c.key}">${c.label}</option>`).join('')}</select></div>
        </div>
        <div class="field-row">
          <div class="field"><label>Month</label><input type="month" class="input" id="ae-month" value="${defMonth}" style="width:100%"/></div>
          <div class="field"><label>Amount (₹)</label><input type="number" class="input" id="ae-amt" min="0" placeholder="e.g. 50000" style="width:100%"/></div>
        </div>
        <label style="display:flex;align-items:center;gap:8px;font-size:13px;color:var(--text-2)"><input type="checkbox" id="ae-add" checked style="accent-color:var(--mafatlal-red)"/> Add to any existing amount for that month (uncheck to overwrite)</label>`,
      foot: `<button class="btn subtle" data-close>Cancel</button><button class="btn primary" id="ae-save">${UI.icon('add')} Add expense</button>`,
      onMount: (mod, close) => {
        mod.querySelector('#ae-save').onclick = () => {
          const div = mod.querySelector('#ae-div').value, key = mod.querySelector('#ae-cat').value;
          const mm = mod.querySelector('#ae-month').value, amt = parseInt(mod.querySelector('#ae-amt').value, 10);
          if (!mm || !amt || amt <= 0) { UI.toast({ title: 'Enter a month and a positive amount', kind: 'err' }); return; }
          const next = mod.querySelector('#ae-add').checked ? cell(mm, div, key) + amt : amt;
          setCell(mm, div, key, next);
          UI.toast({ title: 'Expense added', sub: (DIVS.find((d) => d.id === div) || {}).name + ' · ' + (FLAT.find((f) => f.key === key) || {}).label + ' · ' + fmt(amt) + ' (' + monthLabel(mm) + ')', kind: 'ok', icon: 'report' });
          close();
          rangeMode = false; month = mm; render(root); // jump to that month so the change is visible
        };
      },
    });
  }

  function momCard(m) {
    const pm = shiftMonth(m, -1);
    const dt = (mm, div) => ALL_KEYS.reduce((s, k) => s + cell(mm, div, k), 0);
    const gt = (mm) => DIVS.reduce((s, d) => s + dt(mm, d.id), 0);
    const chg = (cur, prev) => {
      if (prev === 0) return cur > 0 ? '<span style="color:var(--medium);font-weight:600;font-size:12px">New</span>' : '<span class="muted">—</span>';
      const pct = Math.round((cur - prev) / prev * 100);
      if (pct === 0) return '<span class="muted">0%</span>';
      const up = pct > 0;
      return `<span style="color:${up ? 'var(--critical)' : 'var(--ok)'};font-weight:600;font-size:12px">${up ? '▲' : '▼'} ${Math.abs(pct)}%</span>`;
    };
    const ra = 'style="text-align:right"';
    return `<div class="card" style="margin-bottom:16px">
      <div class="card-head"><div><div class="card-title">Month-on-Month</div><div class="card-sub">${monthLabel(m)} vs ${monthLabel(pm)}</div></div></div>
      <table class="tbl" style="border:0"><thead><tr><th>Division</th><th ${ra}>${monthShort(pm)}</th><th ${ra}>${monthShort(m)}</th><th ${ra}>Change</th></tr></thead>
      <tbody>
        ${DIVS.map((d) => { const cur = dt(m, d.id), prev = dt(pm, d.id); return `<tr>
          <td><div style="display:flex;align-items:center;gap:7px"><span style="width:8px;height:8px;border-radius:2px;background:${d.color}"></span>${d.name}</div></td>
          <td ${ra} class="muted">${fmt(prev)}</td><td ${ra}><b>${fmt(cur)}</b></td><td ${ra}>${chg(cur, prev)}</td></tr>`; }).join('')}
      </tbody>
      <tfoot><tr style="background:var(--bg-selected)"><td><b>Total</b></td><td ${ra}><b>${fmt(gt(pm))}</b></td><td ${ra}><b>${fmt(gt(m))}</b></td><td ${ra}>${chg(gt(m), gt(pm))}</td></tr></tfoot>
      </table>
      <div class="muted" style="font-size:11px;margin-top:8px">▲ red = spend increased · ▼ green = spend decreased</div>
    </div>`;
  }

  function exportCSV() {
    const E = window.FD_EXPORT;
    const headers = ['Cost Head'].concat(DIVS.map((d) => d.name)).concat(['Total']);
    const rows = [];
    CATS.forEach((c) => {
      if (c.children) {
        rows.push([c.group + ' (total)'].concat(DIVS.map((d) => gMeta(d.id))).concat([DIVS.reduce((s, d) => s + gMeta(d.id), 0)]));
        c.children.forEach((ch) => rows.push(['  ' + ch.label].concat(DIVS.map((d) => gCell(d.id, ch.key))).concat([gCatTotal(ch.key)])));
      } else {
        rows.push([c.label].concat(DIVS.map((d) => gCell(d.id, c.key))).concat([gCatTotal(c.key)]));
      }
    });
    rows.push([(rangeMode ? 'RANGE TOTAL' : 'MONTHLY TOTAL')].concat(DIVS.map((d) => gDivTotal(d.id))).concat([gGrand()]));
    const tag = rangeMode ? (rangeFrom + '_to_' + rangeTo) : month;
    E.csv('Marketing_Expenses_' + tag + '.csv', headers, rows);
    UI.toast({ title: 'Expenses exported', sub: periodLabel() + ' · CSV', icon: 'download', kind: 'ok' });
  }

  window.FD_VIEWS = window.FD_VIEWS || {};
  window.FD_VIEWS.expenses = { title: 'Marketing Expenses', render };
})();
