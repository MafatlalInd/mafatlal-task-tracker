# Deploy to Vercel with a shared database

This turns the app from **per-browser** storage into **one shared database** that
all 10 accounts read and write — assign a task on your PC, Suniti sees it on her
phone. Everything runs on Vercel's free tier.

---

## What changed in the code

| File | Purpose |
|------|---------|
| `api/data.js` | The backend. Reads/writes all app data in one database table. |
| `api/_db.js` | Creates the database table automatically on first use. |
| `src/remote.js` | Client sync: pulls shared data on load, pushes every save, polls every 12s. |
| `package.json` | Declares the `@vercel/postgres` dependency (installed by Vercel). |
| `vercel.json` | Tells Vercel: serve the site + run `/api/*` as functions. |
| `index.html` | Loads `remote.js` first, then the app (so it sees shared data). |

The app's screens are **unchanged** — only the storage layer moved to a server.

---

## One-time setup (about 5 minutes)

### 1. Create a free Vercel account
Go to **https://vercel.com** → Sign up (use your GitHub account, or email).

### 2. Get this project onto Vercel
**Option A — via GitHub (recommended):**
1. Push this folder to a GitHub repo.
2. In Vercel: **Add New… → Project → Import** your repo.
3. Framework Preset: **Other**. Leave build settings empty. Click **Deploy**.

**Option B — via the Vercel CLI:**
```
npm i -g vercel
vercel            # from this folder; follow the prompts
vercel --prod
```

### 3. Add the database (this is what makes data shared)
1. In your Vercel project → **Storage** tab → **Create Database** → **Postgres**.
2. Accept the defaults, **Create**, then **Connect** it to this project.
   Vercel automatically adds the `POSTGRES_URL` environment variables — you don't
   copy anything by hand.
3. **Redeploy** (Deployments tab → ⋯ → Redeploy) so the app picks up the database.

That's it. The table is created automatically the first time someone saves.

### 4. (Optional) Point your GoDaddy domain at it
In Vercel → project → **Settings → Domains** → add your domain, then follow the
DNS instructions in your GoDaddy cPanel. The web address stays the same; only the
hosting moves to Vercel.

---

## How to confirm it's working
1. Open the live URL, log in, create a task.
2. Open the **same URL on your phone** (or another browser) and log in as that member.
3. The task appears within ~12 seconds. 🎉

---

## Good to know / limits
- **First load** pulls everyone's shared data; if the server is briefly
  unreachable the app falls back to the last local copy (still works offline).
- **Per-device by design:** who is logged in on this device, the light/dark theme,
  and the Outlook client-id are intentionally **not** shared.
- **Concurrency:** saves are last-write-wins per data section. For a 10-person team
  with normal usage this is fine; two people editing the *exact same* section in the
  same 12-second window is the only case where one change could overwrite another.
- **Security note (recommended next step):** the `/api/data` endpoint is currently
  open and login still happens in the browser. Good enough to get the team running,
  but before wider rollout we should add **server-side login** (sessions/tokens) so
  account data isn't readable by anyone who finds the API URL. Ask me to add this.
