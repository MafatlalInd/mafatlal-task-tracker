// Central data endpoint — the shared "backend" for all 10 accounts.
//   GET  /api/data            → { key: value, ... }  (everything)
//   GET  /api/data?key=K      → value | null         (one key)
//   POST /api/data  {key,value}                       (upsert one key)
//   DELETE /api/data?key=K                            (remove one key)
//
// The client (src/remote.js) mirrors this into localStorage so the rest of
// the app keeps working exactly as before, but data is now shared on a server
// instead of trapped in one browser.
const { sql, ensure } = require('./_db');

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Cache-Control', 'no-store');
  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    await ensure();

    if (req.method === 'GET') {
      const key = req.query && req.query.key;
      if (key) {
        const { rows } = await sql`SELECT value FROM fd_store WHERE key = ${key}`;
        return res.status(200).json(rows[0] ? rows[0].value : null);
      }
      const { rows } = await sql`SELECT key, value FROM fd_store`;
      const out = {};
      rows.forEach((r) => { out[r.key] = r.value; });
      return res.status(200).json(out);
    }

    if (req.method === 'POST') {
      let body = req.body;
      if (typeof body === 'string') { try { body = JSON.parse(body); } catch (e) { body = {}; } }
      const key = body && body.key;
      if (!key) return res.status(400).json({ error: 'key required' });
      const value = JSON.stringify(body.value === undefined ? null : body.value);
      await sql`
        INSERT INTO fd_store (key, value, updated_at)
        VALUES (${key}, ${value}::jsonb, now())
        ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = now()`;
      return res.status(200).json({ ok: true });
    }

    if (req.method === 'DELETE') {
      const key = req.query && req.query.key;
      if (key) await sql`DELETE FROM fd_store WHERE key = ${key}`;
      return res.status(200).json({ ok: true });
    }

    return res.status(405).json({ error: 'method not allowed' });
  } catch (e) {
    return res.status(500).json({ error: String((e && e.message) || e) });
  }
};
