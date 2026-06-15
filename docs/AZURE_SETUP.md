# Going live: Microsoft Entra ID + Graph + Outlook Add-in

The Tracker ships in **demo mode** — every Microsoft 365 call is simulated and
logged to the browser console. This guide turns those into real calls.

---

## Part 1 — Register the app in Microsoft Entra ID

1. Sign in to the [Microsoft Entra admin center](https://entra.microsoft.com)
   with an account that can register applications
   (e.g. your `@mafatlals.com` admin account).
2. **Identity → Applications → App registrations → New registration**
   - **Name:** `Mafatlal Digital Task Tracker`
   - **Supported account types:** *Accounts in this organizational directory only*
     (single tenant) for an internal tool.
   - **Redirect URI:** select **Single-page application (SPA)** and enter the URL
     you serve the Tracker from, e.g. `http://localhost:8777/` for development.
     (`localhost` is the only host where HTTP is allowed — production must be HTTPS.)
3. Click **Register** and copy the **Application (client) ID** and
   **Directory (tenant) ID** from the Overview page.

### Grant API permissions

**API permissions → Add a permission → Microsoft Graph → Delegated permissions**, add:

| Permission | Used for |
|---|---|
| `User.Read` | Sign-in, profile |
| `Calendars.ReadWrite` | Task deadlines → Outlook Calendar, meeting sync |
| `Mail.Read` | AI Email Assistant (email → task) |
| `Mail.Send` | Reminders, escalations, approval emails, daily digest |
| `Tasks.ReadWrite` | Microsoft To Do / Planner task sync |
| `Files.ReadWrite` | OneDrive attachments |
| `ChannelMessage.Send` *(optional)* | Teams channel notifications |

Then click **Grant admin consent for \<your org\>** so users aren't prompted
individually.

### Configure the Tracker

Open [`src/msgraph/auth.js`](../src/msgraph/auth.js) and fill in:

```js
window.FD_GRAPH_CONFIG = {
  clientId: "<Application (client) ID>",
  tenantId: "<Directory (tenant) ID>",   // or keep "common" for multi-tenant
  ...
};
```

Reload the app → **Microsoft 365** page → **Sign in with Microsoft**.
Once signed in, task creation/status changes issue real Graph calls:

| Action in the Tracker | Real Graph call |
|---|---|
| Create task (calendar sync on) | `POST /me/events` (with 24h reminder) |
| Assign task to someone else | `POST /me/sendMail` to the assignee |
| Submit for approval | `POST /me/sendMail` to the reviewer |
| Overdue escalation | `POST /me/sendMail` |
| Complete task | `PATCH /me/events/{id}` |

The full client is in [`src/msgraph/graph.js`](../src/msgraph/graph.js) —
`getCalendarView` and `getRecentMessages` are ready for wiring the dashboard
meeting list and the AI Email Assistant to live data.

---

## Part 2 — Sideload the Outlook Add-in

The add-in lives in [`outlook-addin/`](../outlook-addin/):
`manifest.xml` + `taskpane.html` (+ generated icons in `assets/`).

1. **Host the repo over HTTPS.** Outlook requires HTTPS for add-in content
   (Azure Static Web Apps free tier, SharePoint, or any HTTPS host works).
   You can preview the pane locally first — just open
   `outlook-addin/taskpane.html` in a browser; it falls back to a demo email.
2. Edit `manifest.xml` and replace every `https://flowdesk.example.com`
   with your HTTPS base URL.
3. Sideload it:
   - **Outlook on the web:** an email → **⋯ → Get Add-ins → My add-ins →
     Add a custom add-in → Add from file** → select `manifest.xml`.
   - This also makes it appear in new Outlook for Windows.
4. Open any email → ribbon → **Task Tracker → Create Task**. The pane reads the
   live subject/sender/body via Office.js and pre-fills the task form.

**Production note:** the pane currently saves created tasks to `localStorage`
as a placeholder. Point the `create()` function in `taskpane.html` at your
Tracker backend API (the `// PRODUCTION:` comment marks the spot).

---

## Part 3 — What's next (optional)

- **Teams notifications:** call `FD_MSGRAPH.sendTeamsMessage(teamId, channelId, html)`
  with IDs from `GET /me/joinedTeams` / `GET /teams/{id}/channels`.
- **Planner sync:** `POST /planner/plans/{planId}/tasks` mirroring Tracker tasks.
- **Power BI:** embed reports with `powerbi-client` and an embed token.
- **Backend:** replace the in-memory store (`src/store.js`) with your API;
  every mutation already funnels through `createTask/updateTask/deleteTask`.
