/* ============================================================
   View: Marketing Calendar & Gantt
   Digital marketing campaigns and content scheduled across
   channels, on a month timeline. Bars are clickable; the
   calendar can be filtered by channel / content type.
   ============================================================ */
(function () {
  const FD = window.FD, UI = window.FD_UI;
  let mode = 'campaigns';   // 'campaigns' | 'content'
  let chFilter = 'all';

  const CH = {
    multi: { label: 'Multi-channel', color: '#0078d4' },
    paid: { label: 'Paid Ads', color: '#ca5010' },
    display: { label: 'Display & Search', color: '#c19c00' },
    social: { label: 'Social', color: '#5b5fc7' },
    email: { label: 'Email', color: '#038387' },
    seo: { label: 'SEO & Content', color: '#107c10' },
    influencer: { label: 'Influencer', color: '#c13584' },
    pr: { label: 'PR', color: '#8764b8' },
  };
  const CT = { Social: '#5b5fc7', SEO: '#107c10', Email: '#038387', Paid: '#ca5010', Design: '#c19c00', PR: '#8764b8', Influencer: '#c13584' };
  const STC = { Active: '#107c10', Scheduled: '#c19c00', Planned: '#8a8886', Completed: '#0078d4' };

  const dLabel = (isoDate) => new Date(isoDate + 'T00:00:00').toLocaleDateString('en-US', { day: 'numeric', month: 'short' });
  const inr = (n) => '₹' + (n >= 100000 ? (n / 100000).toFixed(n % 100000 ? 1 : 0) + 'L' : Number(n).toLocaleString('en-IN'));
  const addDays = (iso, days) => new Date(new Date(iso + 'T00:00:00').getTime() + days * 86400000).toISOString().slice(0, 10);

  // Persisted reschedules (drag) — applied over the seed schedule each load.
  const SKEY = 'fd-mkt-schedule-v1';
  function loadOverrides() { try { return JSON.parse(localStorage.getItem(SKEY) || '{}'); } catch (e) { return {}; } }
  function saveOverride(kind, key, start, end) {
    const o = loadOverrides(); o[kind] = o[kind] || {}; o[kind][key] = { start, end };
    try { localStorage.setItem(SKEY, JSON.stringify(o)); } catch (e) {}
  }
  function applyOverrides() {
    const o = loadOverrides();
    FD.data.marketing.campaigns.forEach((c) => { const ov = (o.campaigns || {})[c.name]; if (ov) { c.start = ov.start; c.end = ov.end; } });
    FD.data.marketing.contentSchedule.forEach((c) => { const ov = (o.content || {})[c.title]; if (ov) { c.start = ov.start; c.end = ov.end; } });
  }

  function render(root) {
    applyOverrides();
    const filterOpts = mode === 'campaigns'
      ? `<option value="all">All channels</option>` + Object.keys(CH).map((k) => `<option value="${k}" ${chFilter === k ? 'selected' : ''}>${CH[k].label}</option>`).join('')
      : `<option value="all">All content types</option>` + Object.keys(CT).map((k) => `<option value="${k}" ${chFilter === k ? 'selected' : ''}>${k}</option>`).join('');
    root.innerHTML = `
      <div class="page">
        <div class="page-head">
          <div><h1 class="page-title">${UI.icon('calendar')} Marketing Calendar &amp; Gantt</h1>
            <div class="page-sub">Drag a bar to reschedule · click it for details</div></div>
          <div class="page-actions">
            <select class="select" id="chFilter">${filterOpts}</select>
            <div class="seg" id="modeSeg">
              <button data-mode="campaigns" class="${mode === 'campaigns' ? 'active' : ''}">${UI.icon('bolt')} Campaigns</button>
              <button data-mode="content" class="${mode === 'content' ? 'active' : ''}">${UI.icon('megaphone')} Content</button>
            </div>
            <button class="btn primary" id="tlNew">${UI.icon('add')} ${mode === 'campaigns' ? 'New campaign' : 'New content'}</button>
          </div>
        </div>
        <div id="ganttHost"></div>
      </div>`;
    UI.hydrateIcons(root);
    root.querySelectorAll('#modeSeg button').forEach((b) => b.onclick = () => { mode = b.getAttribute('data-mode'); chFilter = 'all'; render(root); });
    root.querySelector('#chFilter').onchange = (e) => { chFilter = e.target.value; paint(root); };
    root.querySelector('#tlNew').onclick = () => UI.toast({ title: mode === 'campaigns' ? 'New campaign' : 'New content', sub: 'Schedule builder would open here' });
    paint(root);
  }

  function paint(root) {
    const today = FD.data.TODAY;
    const start = new Date(today.getFullYear(), today.getMonth() - 1, 1);
    const end = new Date(today.getFullYear(), today.getMonth() + 4, 0);
    const totalDays = Math.round((end - start) / 86400000);

    const months = [];
    let cur = new Date(start);
    while (cur <= end) {
      const mStart = new Date(cur.getFullYear(), cur.getMonth(), 1);
      const mEnd = new Date(cur.getFullYear(), cur.getMonth() + 1, 0);
      const from = Math.max(0, Math.round((mStart - start) / 86400000));
      const to = Math.min(totalDays, Math.round((mEnd - start) / 86400000));
      months.push({ label: mStart.toLocaleDateString('en-US', { month: 'short', year: '2-digit' }), pct: ((to - from) / totalDays) * 100 });
      cur = new Date(cur.getFullYear(), cur.getMonth() + 1, 1);
    }
    const pos = (isoDate) => { const dt = new Date(isoDate + 'T00:00:00'); return Math.max(0, Math.min(100, ((dt - start) / 86400000 / totalDays) * 100)); };
    const todayPct = pos(FD.data.iso(today));

    let source, rows, legend;
    if (mode === 'campaigns') {
      source = FD.data.marketing.campaigns.filter((c) => c.start && c.end && (chFilter === 'all' || c.ch === chFilter));
      rows = source.map((c) => ({
        label: c.name, sub: (CH[c.ch] || {}).label + ' · ' + dLabel(c.start) + ' → ' + dLabel(c.end),
        color: (CH[c.ch] || { color: '#0078d4' }).color, left: pos(c.start), width: Math.max(3, pos(c.end) - pos(c.start)),
        fill: c.budget ? Math.round(c.spend / c.budget * 100) : 0, text: c.status, owner: c.owner,
      }));
      legend = Object.keys(CH).map((k) => `<span class="legend-item"><span class="sw" style="background:${CH[k].color}"></span>${CH[k].label}</span>`).join('');
    } else {
      source = FD.data.marketing.contentSchedule.filter((c) => chFilter === 'all' || c.type === chFilter);
      rows = source.map((c) => ({
        label: c.title, sub: c.type + ' · publishes ' + dLabel(c.end),
        color: CT[c.type] || '#0078d4', left: pos(c.start), width: Math.max(3, pos(c.end) - pos(c.start)),
        fill: 0, text: c.type, owner: c.owner,
      }));
      legend = Object.keys(CT).map((k) => `<span class="legend-item"><span class="sw" style="background:${CT[k]}"></span>${k}</span>`).join('');
    }

    root.querySelector('#ganttHost').innerHTML = `
      <div class="card" style="padding:14px;margin-bottom:14px">
        <div class="legend" style="row-gap:8px">${legend}<span class="legend-item" style="margin-left:auto"><span style="width:14px;height:3px;background:var(--critical);display:inline-block"></span> Today</span></div>
      </div>
      ${rows.length ? `<div class="gantt"><div class="gantt-scroll"><div style="min-width:920px">
        <div class="gantt-head">
          <div class="gantt-label" style="font-weight:600;font-size:12px;color:var(--text-2)">${mode === 'campaigns' ? 'Campaign' : 'Content piece'}</div>
          <div style="flex:1;display:flex;position:relative">${months.map((m) => `<div class="gantt-month" style="flex:0 0 ${m.pct}%">${m.label}</div>`).join('')}</div>
        </div>
        ${rows.map((r, i) => `
          <div class="gantt-row" data-idx="${i}" style="cursor:pointer">
            <div class="gantt-label">
              <div style="display:flex;align-items:center;gap:7px">${UI.avatar(r.owner, 'sm')}
                <div style="min-width:0"><div style="font-weight:600;font-size:13px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${r.label}</div>
                <div class="muted" style="font-size:11px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${r.sub}</div></div></div>
            </div>
            <div class="gantt-track">
              <div class="gantt-today" style="left:${todayPct}%"></div>
              <div class="gantt-bar" style="left:${r.left}%;width:${r.width}%;background:${r.color}">
                ${r.fill ? `<div class="bar-fill" style="width:${100 - r.fill}%;right:0;left:auto"></div>` : ''}
                <span style="position:relative;z-index:1">${r.text}${r.fill ? ' · ' + r.fill + '% spent' : ''}</span>
              </div>
            </div>
          </div>`).join('')}
      </div></div>
      <div style="padding:10px 14px;border-top:1px solid var(--stroke);font-size:12px;color:var(--text-2)">
        ${mode === 'campaigns' ? 'Bars show each campaign\'s run dates; the shaded part is budget remaining.' : 'Bars show each content piece\'s production window; it goes live on the right edge.'}
      </div></div>`
      : `<div class="card"><div class="empty">${UI.icon('calendar')}<div>No ${mode === 'campaigns' ? 'campaigns' : 'content'} for this filter</div></div></div>`}`;

    const openDetails = (item) => { if (mode === 'campaigns') campaignDetails(item); else contentDetails(item); };
    root.querySelectorAll('.gantt-row[data-idx]').forEach((rowEl) => {
      const item = source[+rowEl.getAttribute('data-idx')];
      const bar = rowEl.querySelector('.gantt-bar');
      const track = rowEl.querySelector('.gantt-track');
      const label = rowEl.querySelector('.gantt-label');
      label.style.cursor = 'pointer';
      label.onclick = () => openDetails(item);
      bar.style.cursor = 'grab';
      let dragging = false, moved = 0, startX = 0, trackW = 0, origLeft = 0, barW = 0, dayDelta = 0;
      const span = bar.querySelector('span');
      bar.addEventListener('pointerdown', (e) => {
        dragging = true; moved = 0; dayDelta = 0; startX = e.clientX;
        trackW = track.getBoundingClientRect().width; origLeft = parseFloat(bar.style.left); barW = parseFloat(bar.style.width);
        try { bar.setPointerCapture(e.pointerId); } catch (err) {}
        bar.style.cursor = 'grabbing'; bar.style.transition = 'none'; bar.style.zIndex = '5';
        e.preventDefault();
      });
      bar.addEventListener('pointermove', (e) => {
        if (!dragging) return;
        const dx = e.clientX - startX; moved = Math.max(moved, Math.abs(dx));
        let newLeft = origLeft + (dx / trackW * 100);
        newLeft = Math.max(0, Math.min(100 - barW, newLeft));
        dayDelta = Math.round((newLeft - origLeft) / 100 * totalDays);
        bar.style.left = newLeft + '%';
        if (span) span.textContent = dLabel(addDays(item.start, dayDelta)) + ' → ' + dLabel(addDays(item.end, dayDelta));
      });
      const endDrag = () => {
        if (!dragging) return; dragging = false; bar.style.cursor = 'grab'; bar.style.zIndex = '';
        if (moved < 4) { paint(root); openDetails(item); return; }
        if (dayDelta !== 0) {
          const ns = addDays(item.start, dayDelta), ne = addDays(item.end, dayDelta);
          item.start = ns; item.end = ne;
          saveOverride(mode === 'campaigns' ? 'campaigns' : 'content', item.name || item.title, ns, ne);
          UI.toast({ title: 'Rescheduled', sub: (item.name || item.title) + ' · ' + dLabel(ns) + ' → ' + dLabel(ne), kind: 'ok', icon: 'calendar' });
        }
        paint(root);
      };
      bar.addEventListener('pointerup', endDrag);
      bar.addEventListener('pointercancel', endDrag);
    });
  }

  function campaignDetails(c) {
    const pctSpent = c.budget ? Math.round(c.spend / c.budget * 100) : 0;
    UI.modal({
      title: c.name, width: 480,
      body: `
        <div style="display:flex;gap:8px;margin-bottom:16px">
          <span class="badge" style="background:${CH[c.ch].color}1a;color:${CH[c.ch].color}">${CH[c.ch].label}</span>
          <span class="st"><span class="dot" style="background:${STC[c.status] || '#8a8886'}"></span>${c.status}</span></div>
        <div class="stat-line"><span class="muted">Channel</span><b>${c.channel}</b></div>
        <div class="stat-line"><span class="muted">Run dates</span><b>${dLabel(c.start)} → ${dLabel(c.end)}</b></div>
        <div class="stat-line"><span class="muted">Budget</span><b>${inr(c.budget)}</b></div>
        <div class="stat-line"><span class="muted">Spent</span><b>${inr(c.spend)} · ${pctSpent}%</b></div>
        <div style="margin:6px 0 10px"><div class="progress-bar"><i style="width:${pctSpent}%;background:${CH[c.ch].color}"></i></div></div>
        <div class="stat-line"><span class="muted">Reach</span><b>${(c.reach || 0).toLocaleString('en-IN')}</b></div>
        <div class="stat-line"><span class="muted">Conversions</span><b>${(c.conv || 0).toLocaleString('en-IN')}</b></div>
        <div class="stat-line"><span class="muted">Owner</span><b>${(FD.userById(c.owner) || {}).name || '—'}</b></div>`,
      foot: `<button class="btn subtle" data-close>Close</button><button class="btn primary" id="toAnalytics">${UI.icon('report')} View in Analytics</button>`,
      onMount: (m, close) => { m.querySelector('#toAnalytics').onclick = () => { close(); window.FD_APP.go('analytics'); UI.toast({ title: 'Marketing Analytics', sub: 'Open the Campaigns tab for full metrics', icon: 'report' }); }; },
    });
  }

  function contentDetails(c) {
    UI.modal({
      title: c.title, width: 440,
      body: `
        <div style="margin-bottom:14px"><span class="badge" style="background:${(CT[c.type] || '#0078d4')}1a;color:${CT[c.type] || '#0078d4'}">${c.type}</span></div>
        <div class="stat-line"><span class="muted">Production window</span><b>${dLabel(c.start)} → ${dLabel(c.end)}</b></div>
        <div class="stat-line"><span class="muted">Goes live</span><b>${dLabel(c.end)}</b></div>
        <div class="stat-line"><span class="muted">Owner</span><b>${(FD.userById(c.owner) || {}).name || '—'}</b></div>`,
      foot: `<button class="btn subtle" data-close>Close</button>`,
    });
  }

  window.FD_VIEWS = window.FD_VIEWS || {};
  window.FD_VIEWS.timeline = { title: 'Marketing Calendar', render };
})();
