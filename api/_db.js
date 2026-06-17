// Shared database helper for the Mafatlal Task Tracker backend.
// Uses Vercel Postgres (provisioned from the Vercel dashboard, which sets
// the POSTGRES_URL env vars automatically). All app data lives in one
// key/value table — the same shape the app already used in localStorage,
// so the client sync layer is a drop-in.
const { sql } = require('@vercel/postgres');

let ensured = false;
async function ensure() {
  if (ensured) return;
  await sql`CREATE TABLE IF NOT EXISTS fd_store (
    key        TEXT PRIMARY KEY,
    value      JSONB NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
  )`;
  ensured = true;
}

module.exports = { sql, ensure };
