/* ============================================================
   View: Microsoft 365 Integrations
   ============================================================ */
(function () {
  const FD = window.FD, UI = window.FD_UI;

  function render(root) {
    const ints = FD.data.integrations;
    root.innerHTML = `
      <div class="page">
        <div class="page-head">
          <div><h1 class="page-title">Microsoft 365</h1><div class="page-sub">Connections that make the Tracker a natural extension of your Microsoft workspace</div></div>
          <span class="chip" style="color:var(--ok)"><span class="sync-dot"></span> ${ints.filter((i) => i.status === 'connected').length} connected</span>
        </div>

        ${authBanner()}

        <div class="grid cols-3">
          ${ints.map((i) => card(i)).join('')}
        </div>

        <div class="card" style="margin-top:18px">
          <div class="card-head"><div class="card-title">${UI.icon('outlook')} Outlook Add-in</div><span class="chip" style="color:var(--ok)">Installed</span></div>
          <div class="muted" style="font-size:13px;margin-bottom:14px">The Mafatlal Digital Team Task Tracker sidebar lives inside Outlook so your team can act on email without switching context.</div>
          <div class="grid cols-3">
            ${[['add', 'Create task from email'], ['user', 'Assign & set priority'], ['eye', 'View task status'], ['timeline', 'Update progress'], ['board', 'See related project'], ['calendar', 'Sync to calendar']].map((f) => `
              <div class="list-row" style="border:0;padding:8px 0"><span class="notif-ic" style="background:var(--ms-blue-wash);color:var(--ms-blue);width:30px;height:30px">${UI.icon(f[0])}</span><span style="font-size:13px;font-weight:600">${f[1]}</span></div>`).join('')}
          </div>
        </div>
      </div>`;
    UI.hydrateIcons(root);
    const connectBtn = root.querySelector('#msConnect');
    if (connectBtn) connectBtn.onclick = () => connectWizard(root);
    const signInBtn = root.querySelector('#msSignIn');
    if (signInBtn) signInBtn.onclick = async () => {
      try {
        const acct = await window.FD_AUTH.signIn();
        UI.toast({ title: 'Signed in', sub: acct.username + ' · live Microsoft Graph sync enabled', kind: 'ok', icon: 'shield' });
        render(root);
      } catch (e) {
        UI.toast({ title: 'Sign-in failed', sub: e.message, kind: 'err' });
      }
    };
    const signOutBtn = root.querySelector('#msSignOut');
    if (signOutBtn) signOutBtn.onclick = async () => {
      await window.FD_AUTH.signOut();
      UI.toast({ title: 'Signed out', sub: 'Back to demo mode', kind: 'warn' });
      render(root);
    };
    root.querySelectorAll('[data-int]').forEach((b) => b.onclick = () => {
      const i = FD.data.integrations.find((x) => x.id === b.getAttribute('data-int'));
      if (i.status === 'available') { i.status = 'connected'; i.lastSync = 'Just now'; UI.toast({ title: i.name + ' connected', sub: 'OAuth consent granted via Entra ID' }); render(root); }
      else UI.toast({ title: i.name, sub: 'Last sync: ' + i.lastSync });
    });
  }

  function authBanner() {
    const A = window.FD_AUTH;
    if (A && A.isConfigured() && A.isSignedIn()) {
      return `<div class="banner info" style="margin-bottom:18px">${UI.icon('shield')}
        <div style="flex:1">Signed in with <b>Microsoft Entra ID</b> as <b>${A.account.username}</b> — live Microsoft Graph sync is active. Calendar events, approval emails and escalations are real.</div>
        <button class="btn sm" id="msSignOut">Sign out</button></div>`;
    }
    if (A && A.isConfigured()) {
      return `<div class="banner info" style="margin-bottom:18px">${UI.icon('shield')}
        <div style="flex:1">Entra ID app registration detected. Sign in to enable <b>live Microsoft Graph sync</b> (calendar, mail, OneDrive).</div>
        <button class="btn primary sm" id="msSignIn">${UI.icon('shield')} Sign in with Microsoft</button></div>`;
    }
    return `<div class="banner info" style="margin-bottom:18px">${UI.icon('shield')}
      <div style="flex:1">Running in <b>demo mode</b> — Microsoft 365 actions are simulated. Connect your real Outlook account in about 5 minutes (a one-time Client ID from your IT/admin is required).</div>
      <button class="btn primary sm" id="msConnect">${UI.icon('plug')} Connect Microsoft 365</button></div>`;
  }

  function connectWizard(root) {
    UI.modal({
      title: 'Connect Microsoft 365', width: 620,
      body: `
        <div class="banner info" style="margin-bottom:16px">${UI.icon('shield')}
          <div>Microsoft requires every app that accesses Outlook to be registered <b>once</b> in your organization's admin portal. This gives you a <b>Client ID</b> — paste it below and sign in. Nothing else to install.</div></div>

        <div class="pane-section-title">Step 1 — Get a Client ID (you or your IT admin)</div>
        <ol style="font-size:13px;line-height:1.7;color:var(--text-2);margin:0 0 8px;padding-left:20px">
          <li>Open <b>entra.microsoft.com</b> → App registrations → <b>New registration</b></li>
          <li>Name: <b>Mafatlal Digital Task Tracker</b> · Account type: <i>this organization only</i></li>
          <li>Redirect URI: choose <b>Single-page application (SPA)</b> → enter <code>${location.origin + location.pathname}</code></li>
          <li>API permissions → Microsoft Graph → Delegated → add <b>User.Read, Calendars.ReadWrite, Mail.Read, Mail.Send, Tasks.ReadWrite, Files.ReadWrite</b> → Grant admin consent</li>
          <li>Copy the <b>Application (client) ID</b> from the Overview page</li>
        </ol>
        <button class="btn subtle sm" id="copyItMail" style="margin-bottom:6px">${UI.icon('outlook')} Copy a ready-made request email for IT</button>

        <div class="pane-section-title">Step 2 — Paste it here</div>
        <div class="field"><label>Application (client) ID <span style="color:var(--critical)">*</span></label>
          <input class="input" id="wzClientId" placeholder="e.g. 1a2b3c4d-1234-5678-9abc-def012345678" style="width:100%"/></div>
        <div class="field"><label>Directory (tenant) ID <span class="muted">(optional — leave blank if unsure)</span></label>
          <input class="input" id="wzTenantId" placeholder="common" style="width:100%"/></div>`,
      foot: `<button class="btn subtle" data-close>Cancel</button>
        <button class="btn primary" id="wzGo">${UI.icon('shield')} Save & sign in with Microsoft</button>`,
      onMount: (m, close) => {
        m.querySelector('#copyItMail').onclick = () => {
          const mail = 'Subject: App registration request - Mafatlal Digital Task Tracker\n\n' +
            'Hi IT team,\n\n' +
            'Please register a new application in Microsoft Entra ID (Azure AD) for our task management platform and share the Application (client) ID with me:\n\n' +
            '1. entra.microsoft.com -> App registrations -> New registration\n' +
            '2. Name: Mafatlal Digital Task Tracker | Supported accounts: this organization only\n' +
            '3. Redirect URI: Single-page application (SPA) -> ' + location.origin + location.pathname + '\n' +
            '4. API permissions (Microsoft Graph, Delegated): User.Read, Calendars.ReadWrite, Mail.Read, Mail.Send, Tasks.ReadWrite, Files.ReadWrite\n' +
            '5. Grant admin consent for the organization\n' +
            '6. Send me the Application (client) ID and Directory (tenant) ID from the Overview page\n\n' +
            'Thank you!';
          navigator.clipboard && navigator.clipboard.writeText(mail);
          UI.toast({ title: 'Email copied', sub: 'Paste it into a new Outlook message to your IT team', icon: 'outlook' });
        };
        m.querySelector('#wzGo').onclick = async () => {
          const id = m.querySelector('#wzClientId').value.trim();
          if (!/^[0-9a-fA-F-]{36}$/.test(id)) {
            UI.toast({ title: 'Invalid Client ID', sub: 'It should look like 1a2b3c4d-1234-5678-9abc-def012345678', kind: 'err' });
            return;
          }
          window.FD_AUTH.configure({ clientId: id, tenantId: m.querySelector('#wzTenantId').value });
          close();
          try {
            const acct = await window.FD_AUTH.signIn();
            UI.toast({ title: 'Outlook connected 🎉', sub: 'Signed in as ' + acct.username + ' — live sync active', kind: 'ok', icon: 'shield' });
          } catch (e) {
            UI.toast({ title: 'Sign-in failed', sub: e.message + ' — check the Client ID / redirect URI with IT', kind: 'err', duration: 7000 });
          }
          render(root);
        };
      },
    });
  }

  function card(i) {
    const connected = i.status === 'connected';
    return `<div class="card" style="display:flex;flex-direction:column;gap:12px">
      <div style="display:flex;align-items:center;gap:12px">
        <span class="kpi-icon" style="background:${i.color}1a;color:${i.color};width:42px;height:42px">${UI.icon(i.icon)}</span>
        <div style="flex:1"><div style="font-weight:600">${i.name}</div><div class="muted" style="font-size:12px">${i.desc}</div></div>
      </div>
      <div style="display:flex;align-items:center;justify-content:space-between;margin-top:auto">
        <span class="badge" style="background:${connected ? 'rgba(16,124,16,.12)' : 'var(--bg-surface-3)'};color:${connected ? 'var(--ok)' : 'var(--text-2)'}">
          <span class="dot" style="background:${connected ? 'var(--ok)' : 'var(--text-3)'}"></span>${connected ? 'Connected' : 'Available'}</span>
        <button class="btn ${connected ? 'subtle' : 'primary'} sm" data-int="${i.id}">${connected ? 'Manage' : 'Connect'}</button>
      </div>
      ${connected ? `<div class="muted" style="font-size:11px;border-top:1px solid var(--stroke);padding-top:8px">${UI.icon('repeat')} Last sync: ${i.lastSync}</div>` : ''}
    </div>`;
  }

  window.FD_VIEWS = window.FD_VIEWS || {};
  window.FD_VIEWS.integrations = { title: 'Microsoft 365', render };
})();
