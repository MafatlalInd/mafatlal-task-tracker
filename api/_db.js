// Shared database helper for the Mafatlal Task Tracker backend.
// Uses Vercel Postgres. All app data lives in one key/value table — the same
// shape the app already used in localStorage — so the client sync layer is a
// drop-in.
//
// Connection string resolution: Vercel provisions Postgres in a couple of
// flavors. The classic integration sets POSTGRES_URL; the newer Neon-based one
// can set DATABASE_URL (or a *_POSTGRES_URL prefixed variant). We accept any of
// them so the app connects regardless of which database type is attached.
const { createPool } = require('@vercel/postgres');

function connectionString() {
  const env = process.env;
  if (env.POSTGRES_URL) return env.POSTGRES_URL;
  if (env.POSTGRES_PRISMA_URL) return env.POSTGRES_PRISMA_URL;
  if (env.DATABASE_URL) return env.DATABASE_URL;
  // Last resort: any env var that looks like a Postgres connection string
  // (handles prefixed names Vercel sometimes generates, e.g. STORAGE_POSTGRES_URL).
  const key = Object.keys(env).find(
    (k) => /POSTGRES_URL|DATABASE_URL/.test(k) && /^postgres(ql)?:\/\//.test(env[k] || '')
  );
  return key ? env[key] : undefined;
}

let pool = null;
function getPool() {
  if (pool) return pool;
  const cs = connectionString();
  if (!cs) {
    throw new Error(
      'No Postgres connection string found. Connect a Postgres database to this ' +
      'Vercel project (Storage tab) and redeploy. Expected POSTGRES_URL or DATABASE_URL.'
    );
  }
  pool = createPool({ connectionString: cs });
  return pool;
}

let ensured = false;
async function ensure() {
  const p = getPool();
  if (ensured) return p;
  await p.sql`CREATE TABLE IF NOT EXISTS fd_store (
    key        TEXT PRIMARY KEY,
    value      JSONB NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
  )`;
  ensured = true;
  return p;
}

module.exports = { getPool, ensure };
