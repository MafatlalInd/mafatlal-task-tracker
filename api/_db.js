// Shared database helper for the Mafatlal Task Tracker backend.
//
// Uses node-postgres ("pg"), which connects to ANY Postgres over standard TCP
// using the connection string Vercel provides. We deliberately avoid
// @vercel/postgres here because its HTTP driver only talks to Neon-style
// endpoints and fails ("fetch failed") with other database setups.
//
// Connection string resolution: Vercel provisions Postgres in a few flavors.
// The classic integration sets POSTGRES_URL; the Neon-based one can set
// DATABASE_URL (or a prefixed variant). We accept any of them.
const { Pool } = require('pg');

function connectionString() {
  const env = process.env;
  if (env.POSTGRES_URL) return env.POSTGRES_URL;
  if (env.DATABASE_URL) return env.DATABASE_URL;
  if (env.POSTGRES_PRISMA_URL) return env.POSTGRES_PRISMA_URL;
  if (env.POSTGRES_URL_NON_POOLING) return env.POSTGRES_URL_NON_POOLING;
  // Last resort: any env var that holds a postgres:// connection string
  // (handles prefixed names Vercel sometimes generates, e.g. STORAGE_POSTGRES_URL).
  const key = Object.keys(env).find((k) => /^postgres(ql)?:\/\//.test(env[k] || ''));
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
  pool = new Pool({
    connectionString: cs,
    // Vercel/Neon/most managed Postgres require TLS. Accept their cert.
    ssl: { rejectUnauthorized: false },
    max: 3,
    idleTimeoutMillis: 10000,
    connectionTimeoutMillis: 8000,
  });
  return pool;
}

let ensured = false;
async function ensure() {
  const p = getPool();
  if (!ensured) {
    await p.query(`CREATE TABLE IF NOT EXISTS fd_store (
      key        TEXT PRIMARY KEY,
      value      JSONB NOT NULL,
      updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
    )`);
    ensured = true;
  }
  return p;
}

module.exports = { getPool, ensure };
