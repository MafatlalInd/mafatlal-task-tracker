/* ============================================================
   View: Marketing Expenses — monthly, by division & cost head
   Divisions: Healthcare, Home Fashion, Uniform, Corporate, Online
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
  // Cost heads (Meta Ads is a group with three children).
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

  const SEED_MONTH = FD.data.iso(FD.data.TODAY).slice(0, 7); // current month YYYY-MM
  const SEED = {
    health: { smRetainer: 60000, perfRetainer: 80000, shopify: 0, metaLead: 150000, metaAwareness: 50000, metaShopping: 0, googleAds: 90000, seoRetainer: 40000, influencer: 30000, tools: 15000, other: 10000 },
    home: { smRetainer: 70000, perfRetainer: 90000, shopify: 25000, metaLead: 80000, metaAwareness: 60000, metaShopping: 120000, googleAds: 110000, seoRetainer: 45000, influencer: 80000, tools: 18000, other: 12000 },
    uniform: { smRetainer: 40000, perfRetainer: 50000, shopify: 0, metaLead: 70000, metaAwareness: 30000, metaShopping: 0, googleAds: 60000, seoRetainer: 30000, influencer: 15000, tools: 10000, other: 8000 },
    corp: { smRetainer: 50000, perfRetainer: 0, shopify: 0, metaLead: 0, metaAwareness: 80000, metaShopping: 0, googleAds: 20000, seoRetainer: 35000, influencer: 20000, tools: 12000, other: 15000 },
    online: { smRetainer: 80000, perfRetainer: 120000, shopify: 40000, metaLead: 200000, metaAwareness: 90000, metaShopping: 180000, googleAds: 160000, seoRetainer: 60000, influencer: 100000, tools: 25000, other: 20000 },
  };

  // Previous month seeded too (scaled), so month-on-month has data to compare.
  const SEED_PREV_MONTH = (function () { const dt = new Date(SEED_MONTH + '-01T00:00:00'); dt.setMonth(dt.getMonth() - 1); return FD.data.iso(dt).slice(0, 7); })();
  const PREV_FACTOR = { health: 0.92, home: 0.85, uniform: 0.96, corp: 1.08, online: 0.80 };
  function buildPrev() {
    const out = {};
    DIVS.forEach((d) => { out[d.id] = {}; ALL_KEYS.forEach((k) => { out[d.id][k] = Math.round((SEED[d.id][k] || 0) * PREV_FACTOR[d.id] / 1000) * 1000; }); });
    return out;
  }

  let month = SEED_MONTH;

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
  function setCell(m, div, key, val) {
    const all = load(); all[m] = all[m] || {}; all[m][div] = all[m][div] || {}; all[m][div][key] = val; save(all);
  }
  const divTotal = (m, div) => ALL_KEYS.reduce((s, k) => s + cell(m, div, k), 0);
  const catTotal = (m, key) => DIVS.reduce((s, d) => s + cell(m, d.id, key), 0);
  const metaDiv = (m, div) => cell(m, div, 'metaLead') + cell(m, div, 'metaAwareness') + cell(m, div, 'metaShopping');
  const grand = (m) => DIVS.reduce((s, d) => s + divTotal(m, d.id), 0);

  const fmt = (n) => '₹' + Math.round(n).toLocaleString('en-IN');
  const fmtL = (n) => n >= 100000 ? '₹' + (n / 100000).toFixed(n % 100000 ? 1 : 0) + 'L' : '₹' + Math.round(n).toLocaleString('en-IN');
  const monthLabel = (m) => new Date(m + '-01T00:00:00').toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  const shiftMonth = (m, delta) => { const dt = new Date(m + '-01T00:00:00'); dt.setMonth(dt.getMonth() + delta); return FD.data.iso(dt).slice(0, 7); };

  function render(root) {
    root.innerHTML = `
      <div class="page">
        <div class="page-head">
          <div><h1 class="page-title">${UI.icon('report')} Marketing Expenses</h1>
            <div class="page-sub">Monthly spend by division &amp; cost head${FD.isAdmin() ? '' : ' · view only'}</div></div>
          <div class="page-actions">
            <div class="seg" style="padding:2px">
              <button id="prevM" class="" style="width:32px;justify-content:center">${UI.icon('chevronD')}</button>
              <button class="active" style="min-width:130px;justify-content:center" id="monthLbl">${monthLabel(month)}</button>
              <button id="nextM" style="width:32px;justify-content:center">${UI.icon('chevronR')}</button>
            </div>
            <button class="btn" id="expExport">${UI.icon('download')} Export CSV</button>
          </div>
        </div>
        <div id="expBody"></div>
      </div>`;
    UI.hydrateIcons(root);
    root.querySelector('#prevM').style.transform = 'rotate(90deg)';
    root.querySelector('#prevM').onclick = () => { month = shiftMonth(month, -1); render(root); };
    root.querySelector('#nextM').onclick = () => { month = shiftMonth(month, 1); render(root); };
    root.querySelector('#expExport').onclick = () => exportCSV();
    paint(root);
  }

  function paint(root) {
    const m = month, admin = FD.isAdmin();
    const segs = DIVS.map((d) => ({ value: divTotal(m, d.id), color: d.color })).filter((s) => s.value > 0);
    const top = DIVS.slice().sort((a, b) => divTotal(m, b.id) - divTotal(m, a.id))[0];

    const numCell = (div, key) => admin
      ? `<input class="exp-cell" type="number" min="0" step="1000" data-div="${div}" data-key="${key}" value="${cell(m, div, key) || ''}" placeholder="0"/>`
      : `<span>${cell(m, div, key) ? fmt(cell(m, div, key)) : '—'}</span>`;

    let body = '';
    CATS.forEach((c) => {
      if (c.children) {
        body += `<tr class="exp-group"><td><b>${c.group}</b></td>${DIVS.map((d) => `<td><b>${fmt(metaDiv(m, d.id))}</b></td>`).join('')}<td class="exp-rowtot"><b>${fmt(DIVS.reduce((s, d) => s + metaDiv(m, d.id), 0))}</b></td></tr>`;
        c.children.forEach((ch) => {
          body += `<tr class="exp-child"><td>${ch.label}</td>${DIVS.map((d) => `<td>${numCell(d.id, ch.key)}</td>`).join('')}<td class="exp-rowtot">${fmt(catTotal(m, ch.key))}</td></tr>`;
        });
      } else {
        body += `<tr><td>${c.label}</td>${DIVS.map((d) => `<td>${numCell(d.id, c.key)}</td>`).join('')}<td class="exp-rowtot">${fmt(catTotal(m, c.key))}</td></tr>`;
      }
    });

    root.querySelector('#expBody').innerHTML = `
      <div class="grid cols-12" style="margin-bottom:16px">
        <div class="card">
          <div class="card-head"><div><div class="card-title">Spend by Division</div><div class="card-sub">${monthLabel(m)}</div></div>
            <div style="font-size:20px;font-weight:700">${fmtL(grand(m))}</div></div>
          ${segs.length ? `<div style="display:flex;flex-wrap:wrap;gap:10px">
            ${DIVS.map((d) => `<div style="flex:1 1 150px"><div style="display:flex;justify-content:space-between;font-size:12px;margin-bottom:4px"><span style="font-weight:600">${d.name}</span><span class="muted">${grand(m) ? Math.round(divTotal(m, d.id) / grand(m) * 100) : 0}%</span></div>
              <div class="progress-bar"><i style="width:${grand(m) ? divTotal(m, d.id) / grand(m) * 100 : 0}%;background:${d.color}"></i></div>
              <div style="font-size:13px;font-weight:600;margin-top:4px">${fmt(divTotal(m, d.id))}</div></div>`).join('')}
          </div>` : '<div class="empty">No spend recorded for this month</div>'}
        </div>
        <div class="card" style="display:flex;flex-direction:column;align-items:center;justify-content:center">
          <div class="card-head" style="width:100%"><div class="card-title">Division Share</div></div>
          ${segs.length ? C.donut({ size: 150, thickness: 22, center: fmtL(grand(m)), centerSub: 'total', segments: segs }) : `<div class="empty" style="padding:30px">${UI.icon('report')}<div>Add amounts to see the split</div></div>`}
        </div>
      </div>

      ${momCard(m)}

      <div class="tbl-wrap">
        <table class="tbl exp-table"><thead><tr>
          <th style="min-width:200px">Cost Head</th>${DIVS.map((d) => `<th><span style="display:inline-flex;align-items:center;gap:6px"><span style="width:8px;height:8px;border-radius:2px;background:${d.color}"></span>${d.name}</span></th>`).join('')}<th>Total</th>
        </tr></thead>
        <tbody>${body}</tbody>
        <tfoot><tr class="exp-total"><td><b>Monthly Total</b></td>${DIVS.map((d) => `<td><b>${fmt(divTotal(m, d.id))}</b></td>`).join('')}<td><b>${fmt(grand(m))}</b></td></tr></tfoot>
        </table>
      </div>
      ${admin ? '<div class="muted" style="font-size:12px;margin-top:10px">Tap a cell to edit · amounts in ₹ · changes save automatically and persist per month.</div>' : ''}`;
    UI.hydrateIcons(root.querySelector('#expBody'));

    root.querySelectorAll('.exp-cell').forEach((inp) => inp.onchange = () => {
      setCell(m, inp.getAttribute('data-div'), inp.getAttribute('data-key'), parseInt(inp.value, 10) || 0);
      paint(root);
    });
  }

  function momCard(m) {
    const pm = shiftMonth(m, -1);
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
      <table class="tbl" style="border:0"><thead><tr><th>Division</th><th ${ra}>${monthLabel(pm).split(' ')[0]}</th><th ${ra}>${monthLabel(m).split(' ')[0]}</th><th ${ra}>Change</th></tr></thead>
      <tbody>
        ${DIVS.map((d) => { const cur = divTotal(m, d.id), prev = divTotal(pm, d.id); return `<tr>
          <td><div style="display:flex;align-items:center;gap:7px"><span style="width:8px;height:8px;border-radius:2px;background:${d.color}"></span>${d.name}</div></td>
          <td ${ra} class="muted">${fmt(prev)}</td><td ${ra}><b>${fmt(cur)}</b></td><td ${ra}>${chg(cur, prev)}</td></tr>`; }).join('')}
      </tbody>
      <tfoot><tr style="background:var(--bg-selected)"><td><b>Total</b></td><td ${ra}><b>${fmt(grand(pm))}</b></td><td ${ra}><b>${fmt(grand(m))}</b></td><td ${ra}>${chg(grand(m), grand(pm))}</td></tr></tfoot>
      </table>
      <div class="muted" style="font-size:11px;margin-top:8px">▲ red = spend increased · ▼ green = spend decreased</div>
    </div>`;
  }

  function exportCSV() {
    const m = month, E = window.FD_EXPORT;
    const headers = ['Cost Head'].concat(DIVS.map((d) => d.name)).concat(['Total']);
    const rows = [];
    CATS.forEach((c) => {
      if (c.children) {
        rows.push([c.group + ' (total)'].concat(DIVS.map((d) => metaDiv(m, d.id))).concat([DIVS.reduce((s, d) => s + metaDiv(m, d.id), 0)]));
        c.children.forEach((ch) => rows.push(['  ' + ch.label].concat(DIVS.map((d) => cell(m, d.id, ch.key))).concat([catTotal(m, ch.key)])));
      } else {
        rows.push([c.label].concat(DIVS.map((d) => cell(m, d.id, c.key))).concat([catTotal(m, c.key)]));
      }
    });
    rows.push(['MONTHLY TOTAL'].concat(DIVS.map((d) => divTotal(m, d.id))).concat([grand(m)]));
    E.csv('Marketing_Expenses_' + m + '.csv', headers, rows);
    UI.toast({ title: 'Expenses exported', sub: monthLabel(m) + ' · CSV', icon: 'download', kind: 'ok' });
  }

  window.FD_VIEWS = window.FD_VIEWS || {};
  window.FD_VIEWS.expenses = { title: 'Marketing Expenses', render };
})();
