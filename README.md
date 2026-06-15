# Mafatlal Digital Team Task Tracker — Enterprise Team Task Management Platform

A unified, Microsoft 365–native work management platform that converts Outlook
communication into actionable tasks and gives every department — Marketing, Corp
Comm, HR, Sales, Operations, Manufacturing, IT and Management — a single workspace
to **create, assign, track, approve and collaborate** on work.

Built with **Microsoft Fluent Design**, it feels like a natural extension of
Outlook, Teams, Planner and SharePoint while delivering the power of Asana /
ClickUp / Monday.com.

---

## ▶ Run it

No build step, no dependencies. Either:

1. **Double-click `index.html`** — it runs directly in any modern browser, **or**
2. Serve the folder over HTTP (recommended for full fidelity):

   ```powershell
   # Built-in PowerShell static server (no Node/Python needed)
   powershell -NoProfile -ExecutionPolicy Bypass -File .claude\serve.ps1 -Port 8777
   # then open http://localhost:8777/
   ```

The app opens on a **username + password sign-in screen**. After signing in you
land on a dashboard scoped to your role (admin sees everything; members see
their own work + team performance).

## 🎨 Branding

The app is branded in **Mafatlal red** with the **"Since 1905" shield**:
- Red command bar + white shield logo, red sign-in screen, "Mafatlal" script wordmark.
- Functional accents (buttons, links, charts) stay blue for readability.

The shield/wordmark you see are a faithful **SVG recreation**
(`assets/img/mafatlal-shield.svg`, `mafatlal-shield-white.svg`) so it stays crisp
at any size. **To use the exact official artwork** on the sign-in screen, save
your logo PNG as:

```
assets/img/mafatlal-logo.png
```

The login screen detects that file automatically and shows it in place of the
recreation — no code change needed. (The red command bar keeps the white shield,
since a red-on-white logo wouldn't show on a red bar.)

## 📣 Marketing module

Built for the Marketing department:
- **Marketing → Analytics** — a Google Analytics / Search Console / Meta dashboard:
  - **Website (GA4):** users, sessions, pageviews, conversions, a 6-month traffic-growth chart, traffic-source breakdown, and top pages.
  - **Search (Search Console):** clicks, impressions, CTR, average position, and top queries.
  - **Social (Meta):** reach, engagement, follower growth, and top posts.
  - **Campaigns:** budget, spend, reach and conversions per campaign.
- Each source has a **Connect** button. It runs on demo data now; entering a
  Measurement ID / site / page ID flips it to "Live". **Real GA4 / Search Console
  / Meta data needs server-side API calls** (GA Data API, Search Console API, Meta
  Graph API) with OAuth — that's the integration to wire up next, same pattern as
  Microsoft Graph.

## 👤 Admin — Team management

- **Team** (admin-only nav item) — every member as a card showing active /
  completed / overdue counts and average progress; expand to see their tasks with
  progress bars, and **Assign** a task to them in one click.
- The **admin Dashboard** now has a **Team Tasks & Progress** table — each
  member's workload at a glance with inline **Assign** buttons.
- Members never see the Team view or each other's task lists (see visibility below).

## 🔐 Roles & visibility

- **Admin** (`digital@mafatlals.com`) — sees all tasks, all performance, all
  approvals; can manage every account.
- **Team members** — see **only their own tasks** plus any task they're a
  collaborator on (the "Also involves" field on a task makes it visible to
  everyone listed). They can **create and assign** tasks to anyone. On the
  dashboard they see **their own performance** and **team performance numbers**
  (department + per-member completion counts) — but **not** colleagues' task
  details.
- **Best Team Member of the Month** is shown to everyone on the dashboard,
  scored on completed + on-time tasks.
- **Calendar sharing** — a member's calendar is private by default; from the
  Calendar page they can **Share my calendar** with chosen colleagues (or
  **Request a calendar** from someone). Admin can view any calendar.
- The workspace starts **empty** — no seed tasks. Everyone builds their own.
  Tasks persist per browser (see the backend note below for true sync).

## 👥 Accounts

| Account | Email | Starter password | Role |
|---|---|---|---|
| **Admin** | digital@mafatlals.com | `Admin@2026` | Administrator |
| Suniti | suniti@mafatlals.com | `Suniti@123` | Marketing Lead |
| Yash | yash@mafatlals.com | `Yash@123` | Sales Director |
| Ishita | ishita@mafatlals.com | `Ishita@123` | Comms Manager |
| Karan | karan@mafatlals.com | `Karan@123` | IT Manager |
| Aditya | aditya@mafatlals.com | `Aditya@123` | Ops Manager |
| Suresh | suresh@mafatlals.com | `Suresh@123` | Plant Head |
| Sushil | sushil@mafatlals.com | `Sushil@123` | HR Partner |
| Hiya | hiya@mafatlals.com | `Hiya@123` | Brand Designer |
| Mohit | mohit@mafatlals.com | `Mohit@123` | Content Strategist |

- **First sign-in:** each member is asked to complete their profile — full
  name, designation and department. Until then they appear as "Team Member".
- Details are editable anytime: profile menu (top-right avatar) → **My details**.
- **Admin** can edit any member's details and reset any password:
  **Settings → Team Accounts** (shows who has a pending profile / starter password).
- Everyone can change their own password from the profile menu.
- Passwords are stored as SHA-256 hashes in the browser's localStorage
  (`src/accounts.js`). This is local sign-in for a single shared machine /
  demo: each browser seeds the same starter passwords, but password *changes*
  apply only to that browser. For true multi-device accounts, move the
  account store to a backend.

---

## ✨ What's implemented

| Area | Highlights |
|------|-----------|
| **Executive Dashboard** | KPI cards (Total / Open / Completed / Delayed), completion trend, status distribution, department performance, team utilization, SLA gauge, today's synced Outlook meetings, "needs attention" queue |
| **Task Management** | Create/edit via Outlook-style right pane — name, description, project, department, assignee, reviewer, priority, due date, calendar-sync toggle, tags, attachments, progress, status, audit trail |
| **Views** | **List** (Excel-style sortable/filterable grid) · **Kanban** (drag & drop) · **Calendar** (Outlook month view, tasks + meetings) · **Timeline & Gantt** (project roadmap + task planning) |
| **Approval workflow** | Assigned → In Progress → Submitted → Approved → Closed · Approve / Reject / Request changes with comments |
| **Corp Comm module** | Request → Design → Review → Approval → Publish pipeline, 7 creative categories, drag-and-drop stages |
| **Recurring tasks** | Daily / Weekly / Monthly / Quarterly / Yearly templates (Social reports, Monthly MIS, Factory audits, Vendor reviews…) |
| **Documents** | OneDrive-style library, version history, status, co-authoring, "Open in Microsoft 365" |
| **Reports** | Team / Department / Management tabs · Excel · PDF · PowerPoint · Power BI export actions |
| **AI features** | Meeting Assistant (MOM + action-item extraction → one-click tasks), Email Assistant (Outlook email → suggested task), Workload Analyzer (overload / missed-deadline / capacity insights) |
| **Microsoft 365** | Connection hub for Outlook, Calendar, Teams, OneDrive, Entra ID SSO, Planner, SharePoint, Power BI + the Outlook Add-in feature set |
| **Platform** | Dark mode, responsive layout, global search (Ctrl + /), notifications flyout, toasts, role-based permissions matrix, audit trail |

---

## 🏗 Architecture

Zero-dependency static SPA — plain `<script>` includes, no bundler, so it runs
from `file://` or any static host.

```
index.html              App shell (command bar, left nav, panes)
assets/css/styles.css   Fluent design system + light/dark themes
src/
  data.js               Seed data (mock Microsoft 365 workspace)
  store.js              State + pub/sub + task ops + Graph integration seams
  msgraph/
    auth.js             MSAL.js / Entra ID sign-in (demo-mode fallback)
    graph.js            Live Microsoft Graph client (calendar, mail, Teams)
  charts.js             Dependency-free SVG charts (donut, bars, line, gauge)
  components.js         Icons, badges, avatars, task pane, modals, toasts
  views/                One module per screen (dashboard, tasks, board, …)
  app.js                Router + global chrome wiring
outlook-addin/
  manifest.xml          Office Add-in manifest (message read task pane)
  taskpane.html         "Create task from email" pane (Office.js)
  assets/               Generated add-in icons
docs/AZURE_SETUP.md     Entra ID registration + add-in sideload guide
.claude/serve.ps1       Optional PowerShell static server
```

**State flow:** views read from `FD.state` and subscribe to `FD.on('tasks:changed', …)`.
All mutations go through `FD.createTask / updateTask / deleteTask`, which emit
events so every open view stays in sync.

---

## 🔌 Wiring up real Microsoft Graph (production path)

Every Microsoft integration in this prototype is **mocked behind a single seam**
so going live is a matter of filling in API calls — the UI doesn't change.

Look at `graphHooks` in [`src/store.js`](src/store.js). Each task mutation already
calls the right hook; today they `console.log`, in production they call Graph:

| Feature | Microsoft Graph endpoint |
|---------|--------------------------|
| Email → Task | `GET /me/messages` → prefill task from `subject` / `body` |
| Calendar sync (deadlines) | `POST /me/events` on create, `PATCH` on due-date change |
| Meetings → Dashboard | `GET /me/calendarView` |
| Teams notifications | `POST /teams/{id}/channels/{id}/messages` |
| Reminders / escalations | `POST /me/sendMail` (digest, overdue, approval) |
| Documents | `GET/PUT /me/drive` (OneDrive) · `/sites/{id}/drive` (SharePoint) |
| SSO | **MSAL.js** + Microsoft Entra ID (Azure AD) app registration |
| Planner sync | `GET/POST /planner/plans/{id}/tasks` |
| Power BI | `powerbi-client` embed token |

**Steps to productionize** — most of this is now already built:

1. ✅ **MSAL.js sign-in** is implemented in `src/msgraph/auth.js` —
   register an app in Entra ID and paste the client ID (one config block).
2. ✅ **Graph client** is implemented in `src/msgraph/graph.js` — calendar
   events, approval/reminder/escalation mail, Teams messages, calendar view,
   inbox reads. `graphHooks` in `store.js` automatically switches from demo
   logging to live calls once you sign in.
3. ✅ **Outlook Add-in** is scaffolded in `outlook-addin/` — manifest + Office.js
   task pane that reads the open email and pre-fills the task form.
4. ⬜ Persist tasks to your backend (the store is the single integration point).

Full walkthrough: **[docs/AZURE_SETUP.md](docs/AZURE_SETUP.md)**.

---

## 🎨 Design language

- **Microsoft Fluent** — Segoe UI / Inter typography, Microsoft Blue (#0078D4),
  neutral grays, minimal accents, depth via Fluent elevation shadows.
- Outlook-inspired layout: top command bar, left navigation, right task pane.
- Full **dark mode** and responsive behavior down to mobile.

---

## ⚠️ Scope note

This is a **complete, runnable front-end platform with realistic mock data**.
Live Microsoft Graph sync, Entra ID SSO and the Outlook Add-in require an Azure
tenant + app registration (credentials not bundled). The integration seams are
in place so those connect without reworking the UI — see the section above.
