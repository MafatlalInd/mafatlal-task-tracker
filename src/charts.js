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

  function bars(opts) {
    // opts: { data:[{label,value,color?}], height, max?, fmt? }
    const w = 100, n = opts.data.length;
    const h = opts.height || 160;
    const max = opts.max || Math.max(...opts.data.map((d) => d.value), 1);
    const gap = 8, bw = (w - gap * (n - 1)) / n;
    const padBottom = 22;
    const chartH = h - padBottom;
    let bars = "", labels = "";
    opts.data.forEach((d, i) => {
      const bh = (d.value / max) * (chartH - 6);
      const x = i * (bw + gap);
      const y = chartH - bh;
      const color = d.color || css("--ms-blue");
      bars += `<rect x="${x}" y="${y}" width="${bw}" height="${bh}" rx="2" fill="${color}">
        <title>${d.label}: ${d.value}</title></rect>`;
      bars += `<text x="${x + bw / 2}" y="${y - 3}" text-anchor="middle" font-size="6.5" font-weight="700" fill="${css('--text-2')}">${opts.fmt ? opts.fmt(d.value) : d.value}</text>`;
      labels += `<text x="${x + bw / 2}" y="${h - 6}" text-anchor="middle" font-size="6.5" fill="${css('--text-3')}">${d.label}</text>`;
    });
    return `<svg viewBox="0 0 ${w} ${h}" preserveAspectRatio="none" width="100%" height="${h}">${bars}${labels}</svg>`;
  }

  function groupedBars(opts) {
    // opts: { data:[{label, a, b}], aColor, bColor, height }
    const w = 100, n = opts.data.length;
    const h = opts.height || 180;
    const max = Math.max(...opts.data.flatMap((d) => [d.a, d.b]), 1);
    const groupGap = 6;
    const gw = (w - groupGap * (n - 1)) / n;
    const bw = (gw - 3) / 2;
    const padBottom = 20;
    const chartH = h - padBottom;
    let out = "";
    opts.data.forEach((d, i) => {
      const gx = i * (gw + groupGap);
      [["a", opts.aColor || css("--ms-blue"), d.a], ["b", opts.bColor || css("--low"), d.b]].forEach((pair, j) => {
        const bh = (pair[2] / max) * (chartH - 4);
        const x = gx + j * (bw + 3);
        out += `<rect x="${x}" y="${chartH - bh}" width="${bw}" height="${bh}" rx="1.5" fill="${pair[1]}"><title>${pair[2]}</title></rect>`;
      });
      out += `<text x="${gx + gw / 2}" y="${h - 5}" text-anchor="middle" font-size="6" fill="${css('--text-3')}">${d.label}</text>`;
    });
    return `<svg viewBox="0 0 ${w} ${h}" preserveAspectRatio="none" width="100%" height="${h}">${out}</svg>`;
  }

  function line(opts) {
    // opts: { series:[{points:[v..], color}], labels:[], height }
    const w = 100, h = opts.height || 160;
    const padB = 16, padT = 6;
    const chartH = h - padB - padT;
    const all = opts.series.flatMap((s) => s.points);
    const max = Math.max(...all, 1), min = Math.min(...all, 0);
    const range = max - min || 1;
    const n = opts.labels.length;
    const xStep = w / (n - 1 || 1);
    const yOf = (v) => padT + chartH - ((v - min) / range) * chartH;
    let out = "";
    // gridlines
    for (let g = 0; g <= 3; g++) {
      const y = padT + (chartH / 3) * g;
      out += `<line x1="0" y1="${y}" x2="${w}" y2="${y}" stroke="${css('--stroke')}" stroke-width="0.3"></line>`;
    }
    opts.series.forEach((s) => {
      let pts = s.points.map((v, i) => `${i * xStep},${yOf(v)}`).join(" ");
      const area = `0,${padT + chartH} ` + pts + ` ${w},${padT + chartH}`;
      if (s.fill) out += `<polygon points="${area}" fill="${s.color}" opacity="0.08"></polygon>`;
      out += `<polyline points="${pts}" fill="none" stroke="${s.color}" stroke-width="1.4" stroke-linejoin="round" stroke-linecap="round"></polyline>`;
      s.points.forEach((v, i) => { out += `<circle cx="${i * xStep}" cy="${yOf(v)}" r="1.3" fill="${s.color}"></circle>`; });
    });
    opts.labels.forEach((l, i) => {
      out += `<text x="${i * xStep}" y="${h - 4}" text-anchor="${i === 0 ? 'start' : i === n - 1 ? 'end' : 'middle'}" font-size="5.5" fill="${css('--text-3')}">${l}</text>`;
    });
    return `<svg viewBox="0 0 ${w} ${h}" preserveAspectRatio="none" width="100%" height="${h}">${out}</svg>`;
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
