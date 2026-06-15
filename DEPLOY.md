# Hosting the Mafatlal Digital Team Task Tracker on Vercel

The Tracker is a static site (no build step), so Vercel serves it as-is.
The repo already includes `vercel.json` and `.vercelignore`, so there is
nothing to configure — just deploy.

---

## ⚠️ Read this first — what hosting does and does NOT do

Hosting puts the Tracker at a public URL (e.g. `mafatlal-tracker.vercel.app`) that anyone
on any device can open. But the app currently stores everything **in the
browser** (localStorage), so:

| Question | Answer |
|---|---|
| Can people open it from anywhere? | ✅ Yes |
| Do tasks/accounts **sync between people & devices?** | ❌ No — each browser has its own separate copy |
| Does a password change on one laptop appear on another? | ❌ No |
| Are the starter passwords visible in the page source? | ⚠️ Yes (they're in `src/accounts.js`) |

**So hosting is great for:** a live demo, or a single shared computer.
**It is NOT yet:** a true multi-user system where your team shares one set of
tasks and logins.

To get real shared data + secure logins you need a small **backend + database**
(Vercel supports this with serverless functions + Vercel Postgres/KV, or
Supabase). That's a separate build — ask and I'll wire it up. Until then,
treat the hosted version as a demo and don't put confidential data on a public
URL (or turn on Vercel's Deployment Protection / password gate).

---

## Method 1 — GitHub + Vercel (no software to install) ✅ recommended

1. **Create a GitHub account** at https://github.com (free) if you don't have one.
2. **New repository** → name it `flowdesk` → Create.
3. On the repo page click **uploading an existing file**, then drag the entire
   contents of the `Team management` folder into the browser
   (keep the folder structure) → **Commit changes**.
4. Go to https://vercel.com → **Sign up with GitHub** (free Hobby plan).
5. **Add New… → Project** → **Import** your `flowdesk` repo.
6. Framework Preset: **Other** · Build Command: *(leave empty)* ·
   Output Directory: *(leave empty / `.`)* → **Deploy**.
7. After ~20 seconds you get a live URL like `https://flowdesk-xxxx.vercel.app`.

Every time you push changes to GitHub, Vercel redeploys automatically.

## Method 2 — Vercel CLI (needs Node.js installed)

```powershell
# one-time: install Node.js from https://nodejs.org , then:
npm i -g vercel
cd "C:\Users\Nikhil.Gore\Downloads\Team management"
vercel            # answer the prompts → preview URL
vercel --prod     # publish to your production URL
```

---

## Custom domain (optional)

In the Vercel project → **Settings → Domains** → add e.g. `tasks.mafatlals.com`
and point the DNS record Vercel shows you. HTTPS is automatic.

## Keeping the URL private

On the free plan the URL is public if shared. To restrict access:
Vercel project → **Settings → Deployment Protection → Vercel Authentication**
(requires a Vercel login to view) — good enough for an internal tool.
