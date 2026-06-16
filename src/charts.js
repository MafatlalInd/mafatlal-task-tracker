/* ============================================================
   Mafatlal Digital Team Task Tracker — Lightweight SVG charts (no libraries)
   ============================================================ */
(function () {
  const NS = "http://www.w3.org/2000/svg";
  const css = (v) => getComputedStyle(document.documentElement).getPropertyValue(v).trim();

  function donut(opts) {
    // opts: { size, thickness, segments:[{value,color,label}] }
    const size = opts.size || 160;
    const th = opts.thickness || 20;
    const r = (size - th) / 2;
    const cx = size / 2, cy = size / 2;
    const total = opts.segments.reduce((s, x) => s + x.value, 0) || 1;
    const circ = 2 * Math.PI * r;
    let offset = 0;
    let rings = "";
    opts.segments.forEach((seg) => {
      const len = (seg.value / total) * circ;
      rings += `<circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="${seg.color}" stroke-width="${th}"
        stroke-dasharray="${len} ${circ - len}" stroke-dashoffset="${-offset}"
        transform="rotate(-90 ${cx} ${cy})" stroke-linecap="butt"></circle>`;
      offset += len;
    });
    const center = opts.center
      ? `<text x="${cx}" y="${cy - 2}" text-anchor="middle" font-size="26" font-weight="700" fill="${css('--text')}">${opts.center}</text>
         <text x="${cx}" y="${cy + 18}" text-anchor="middle" font-size="11" fill="${css('--text-3')}">${opts.centerSub || ""}</text>`
      : "";
    return `<svg viewBox="0 0 ${size} ${size}" width="${size}" height="${size}">
      <circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="${css('--bg-surface-3')}" stroke-width="${th}"></circle>
      ${rings}${center}</svg>`;
  }

  // Bars rendered in HTML/CSS so value + axis labels stay crisp at any width.
  function bars(opts) {
    const h = opts.height || 160;
    const max = opts.max || Math.max(...opts.data.map((d) => d.value), 1);
    return `<div class="hbars" style="height:${h}px">${opts.data.map((d) => {
      const pct = max ? Math.max(2, Math.round((d.value / max) * 100)) : 0;
      return `<div class="hbar-col" title="${d.label}: ${d.value}">
        <div class="hbar-val">${opts.fmt ? opts.fmt(d.value) : d.value}</div>
        <div class="hbar-track"><div class="hbar-fill" style="height:${pct}%;background:${d.color || css('--ms-blue')}"></div></div>
        <div class="hbar-lbl">${d.label}</div>
      </div>`;
    }).join('')}</div>`;
  }

  function groupedBars(opts) {
    const h = opts.height || 180;
    const max = Math.max(...opts.data.flatMap((d) => [d.a, d.b]), 1);
    const aC = opts.aColor || css('--ms-blue'), bC = opts.bColor || css('--low');
    return `<div class="hbars" style="height:${h}px">${opts.data.map((d) => `
      <div class="hbar-col" title="${d.label}">
        <div class="hbar-group">
          <div class="hbar-track"><div class="hbar-fill" style="height:${Math.max(2, Math.round(d.a / max * 100))}%;background:${aC}"></div></div>
          <div class="hbar-track"><div class="hbar-fill" style="height:${Math.max(2, Math.round(d.b / max * 100))}%;background:${bC}"></div></div>
        </div>
        <div class="hbar-lbl">${d.label}</div>
      </div>`).join('')}</div>`;
  }

  // Line geometry stays in a stretchable SVG; axis labels are HTML below it.
  function line(opts) {
    const w = 100, h = opts.height || 160;
    const padT = 6, padB = 6;
    const chartH = h - padT - padB;
    const all = opts.series.flatMap((s) => s.points);
    const max = Math.max(...all, 1), min = Math.min(...all, 0);
    const range = max - min || 1;
    const n = opts.labels.length;
    const xStep = w / (n - 1 || 1);
    const yOf = (v) => padT + chartH - ((v - min) / range) * chartH;
    let out = "";
    for (let g = 0; g <= 3; g++) {
      const y = padT + (chartH / 3) * g;
      out += `<line x1="0" y1="${y}" x2="${w}" y2="${y}" stroke="${css('--stroke')}" stroke-width="0.3"></line>`;
    }
    opts.series.forEach((s) => {
      const pts = s.points.map((v, i) => `${i * xStep},${yOf(v)}`).join(" ");
      if (s.fill) out += `<polygon points="0,${padT + chartH} ${pts} ${w},${padT + chartH}" fill="${s.color}" opacity="0.08"></polygon>`;
      out += `<polyline points="${pts}" fill="none" stroke="${s.color}" stroke-width="1.6" stroke-linejoin="round" stroke-linecap="round" vector-effect="non-scaling-stroke"></polyline>`;
    });
    return `<div class="line-chart">
      <svg viewBox="0 0 ${w} ${h}" preserveAspectRatio="none" width="100%" height="${h}">${out}</svg>
      <div class="chart-xlabels">${opts.labels.map((l) => `<span>${l}</span>`).join('')}</div>
    </div>`;
  }

  function gauge(value, label) {
    const size = 130, th = 14, r = (size - th) / 2, cx = size / 2, cy = size / 2;
    const circ = 2 * Math.PI * r;
    const len = (value / 100) * circ;
    const color = value >= 85 ? css("--ok") : value >= 60 ? css("--medium") : css("--danger");
    return `<svg viewBox="0 0 ${size} ${size}" width="${size}" height="${size}">
      <circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="${css('--bg-surface-3')}" stroke-width="${th}"></circle>
      <circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="${color}" stroke-width="${th}"
        stroke-dasharray="${len} ${circ}" stroke-linecap="round" transform="rotate(-90 ${cx} ${cy})"></circle>
      <text x="${cx}" y="${cy - 1}" text-anchor="middle" font-size="28" font-weight="700" fill="${css('--text')}">${value}%</text>
      <text x="${cx}" y="${cy + 17}" text-anchor="middle" font-size="10" fill="${css('--text-3')}">${label || ""}</text>
    </svg>`;
  }

  window.FD_CHARTS = { donut, bars, groupedBars, line, gauge };
})();
