/* ============================================================
   Mafatlal Digital Team Task Tracker — CSV export utility
   Pure client-side: builds a CSV and triggers a download.
   Opens directly in Excel / Google Sheets.
   ============================================================ */
(function () {
  function esc(v) {
    if (v === null || v === undefined) v = "";
    v = String(v);
    if (/[",\n\r]/.test(v)) v = '"' + v.replace(/"/g, '""') + '"';
    return v;
  }
  function toCSV(headers, rows) {
    const lines = [headers.map(esc).join(",")];
    rows.forEach((r) => lines.push(r.map(esc).join(",")));
    return lines.join("\r\n");
  }
  function download(filename, text, mime) {
    try {
      // BOM so Excel reads UTF-8 (₹, accents) correctly
      const blob = new Blob(["﻿" + text], { type: (mime || "text/csv") + ";charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url; a.download = filename;
      document.body.appendChild(a); a.click();
      setTimeout(() => { URL.revokeObjectURL(url); a.remove(); }, 120);
    } catch (e) { console.warn("[export] failed", e); }
  }
  function csv(filename, headers, rows) { download(filename, toCSV(headers, rows), "text/csv"); }
  function today() { try { return new Date().toISOString().slice(0, 10); } catch (e) { return "export"; } }

  window.FD_EXPORT = { csv, toCSV, download, today };
})();
