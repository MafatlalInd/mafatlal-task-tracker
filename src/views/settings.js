/* ============================================================
   View: Settings — recurring tasks, roles, preferences
   ============================================================ */
(function () {
  const FD = window.FD, UI = window.FD_UI;

  const ROLES = [
    { role: 'Administrator', who: 'IT, Management', perms: 'Full access · manage users, integrations, audit' },
    { role: 'Manager / Approver', who: 'Dept heads', perms: 'Approve, assign, view all department tasks & reports' },
    { role: 'Member', who: 'Employees', perms: 'Create & update own tasks, collaborate, view team board' },
    { role: 'Viewer', who: 'Stakeholders', perms: 'Read-only dashboards and reports' },
  ];

  function render(root) {
    const me = FD.userById(FD.state.currentUser);
    const amAdmin = window.FD_ACCOUNTS && window.FD_ACCOUNTS.isAdmin();
    root.innerHTML = `
      <div class="page">
        <div class="page-head"><div><h1 class="page-title">Settings</h1><div class="page-sub">Accounts, recurring tasks, roles & workspace preferences</div></div></div>

        ${amAdmin ? `
        <div class="card" style="margin-bottom:16px">
          <div class="card-head"><div><div class="card-title">${UI.icon('users')} Team Accounts</div>
            <div class="card-sub">You are the administrator — you can reset any member's password</div></div></div>
          <table class="tbl" style="border:0"><thead><tr><th>Member</th><th>Email</th><th>Department</th><th>Designation</th><th>Profile</th><th>Password</th><th></th></tr></thead><tbody>
            ${FD.data.users.map((u) => `<tr>
              <td><div style="display:flex;gap:8px;align-items:center">${UI.avatar(u.id, 'sm')}<b>${u.name}</b> ${u.isAdmin ? '<span class="lt-admin">Admin</span>' : ''}</div></td>
              <td class="muted">${u.email}</td>
              <td>${UI.deptChip(u.dept)}</td>
              <td>${u.role === 'Team Member' ? '<span class="muted">—</span>' : u.role}</td>
              <td>${window.FD_ACCOUNTS.isProfileComplete(u.id) ? '<span class="badge pri-Low">Complete</span>' : '<span class="badge pri-Medium">Pending</span>'}</td>
              <td>${window.FD_ACCOUNTS.isDefaultPassword(u.id) ? '<span class="badge pri-Medium">Starter</span>' : '<span class="badge pri-Low">Changed</span>'}</td>
              <td style="white-space:nowrap"><button class="btn subtle sm" data-edit="${u.id}">${UI.icon('edit')} Edit</button>
                <button class="btn sm" data-reset="${u.id}">${UI.icon('shield')} Reset password</button></td>
            </tr>`).join('')}
          </tbody></table>
        </div>` : `
        <div class="card" style="margin-bottom:16px">
          <div class="card-head"><div><div class="card-title">${UI.icon('user')} My Account</div></div></div>
          <div style="display:flex;align-items:center;gap:12px;flex-wrap:wrap">
            <span class="av lg" style="background:${me.color}">${me.initials}</span>
            <div style="flex:1;min-width:180px"><div style="font-weight:600">${me.name}</div><div class="muted" style="font-size:12px">${me.email} · ${me.role}${me.role === 'Team Member' ? ' <span class="badge pri-Medium" style="margin-left:6px">Profile pending</span>' : ''}</div></div>
            <button class="btn" id="myProfile">${UI.icon('edit')} Edit my details</button>
            <button class="btn" id="myPw">${UI.icon('shield')} Change my password</button>
          </div>
        </div>`}

        <div class="grid cols-2">
          <div class="card">
            <div class="card-head"><div class="card-title">${UI.icon('repeat')} Recurring Tasks</div><button class="btn sm" id="addRec">${UI.icon('add')} New</button></div>
            <table class="tbl" style="border:0"><thead><tr><th>Task</th><th>Cadence</th><th>Owner</th><th>Next run</th></tr></thead><tbody>
              ${FD.data.recurringTemplates.map((r) => `<tr><td class="t-name">${r.name}</td>
                <td><span class="chip">${r.cadence}</span></td>
                <td><div style="display:flex;gap:8px;align-items:center">${UI.avatar(r.owner, 'sm')}${FD.userById(r.owner).name.split(' ')[0]}</div></td>
                <td class="muted">${FD.dueLabel(r.next)}</td></tr>`).join('')}
            </tbody></table>
          </div>

          <div class="card">
            <div class="card-head"><div class="card-title">${UI.icon('shield')} Roles & Permissions</div></div>
            ${ROLES.map((r) => `<div style="padding:11px 0;border-bottom:1px solid var(--stroke)">
              <div style="display:flex;justify-content:space-between;align-items:center"><b style="font-size:13px">${r.role}</b><span class="chip" style="font-size:11px">${r.who}</span></div>
              <div class="muted" style="font-size:12px;margin-top:4px">${r.perms}</div></div>`).join('')}
          </div>
        </div>

        <div class="grid cols-2" style="margin-top:16px">
          <div class="card">
            <div class="card-head"><div class="card-title">Notifications</div></div>
            ${[['Task assigned to me', true], ['Approval required', true], ['Deadline approaching (24h)', true], ['Task overdue / escalation', true], ['Daily task digest (Outlook)', true], ['Teams channel mentions', false]].map((n) => `
              <div class="stat-line"><span>${n[0]}</span><label class="switch"><input type="checkbox" ${n[1] ? 'checked' : ''} style="accent-color:var(--ms-blue);width:16px;height:16px"></label></div>`).join('')}
          </div>
          <div class="card">
            <div class="card-head"><div class="card-title">Appearance & workspace</div></div>
            <div class="stat-line"><span>Theme</span>
              <div class="seg"><button id="setLight" class="${FD.state.theme === 'light' ? 'active' : ''}">Light</button><button id="setDark" class="${FD.state.theme === 'dark' ? 'active' : ''}">Dark</button></div></div>
            <div class="stat-line"><span>Default view</span><select class="select"><option>Dashboard</option><option>My Tasks</option><option>Board</option></select></div>
            <div class="stat-line"><span>Week starts on</span><select class="select"><option>Sunday</option><option>Monday</option></select></div>
            <div class="stat-line"><span>Time zone</span><select class="select"><option>India Standard Time (IST)</option><option>UTC</option></select></div>
            <div class="divider"></div>
            <div style="display:flex;align-items:center;gap:10px"><span class="av lg" style="background:${me.color}">${me.initials}</span>
              <div><div style="font-weight:600">${me.name}</div><div class="muted" style="font-size:12px">${me.email} · ${amAdmin ? 'Administrator' : 'Member'}</div></div></div>
          </div>
        </div>
      </div>`;
    UI.hydrateIcons(root);
    root.querySelector('#addRec').onclick = () => UI.toast({ title: 'New recurring task', sub: 'Configure cadence and owner' });
    root.querySelector('#setLight').onclick = () => window.FD_APP.setTheme('light');
    root.querySelector('#setDark').onclick = () => window.FD_APP.setTheme('dark');
    const myPw = root.querySelector('#myPw');
    if (myPw) myPw.onclick = changePasswordModal;
    const myProfile = root.querySelector('#myProfile');
    if (myProfile) myProfile.onclick = () => profileModal(FD.state.currentUser);
    root.querySelectorAll('[data-reset]').forEach((b) => b.onclick = () => resetPasswordModal(b.getAttribute('data-reset'), root));
    root.querySelectorAll('[data-edit]').forEach((b) => b.onclick = () => profileModal(b.getAttribute('data-edit')));
  }

  // Admin: set a new password for any member
  function resetPasswordModal(userId, root) {
    const u = FD.userById(userId);
    UI.modal({
      title: 'Reset password — ' + u.name, width: 420,
      body: `
        <div style="display:flex;align-items:center;gap:10px;margin-bottom:16px">
          ${UI.avatar(u.id)}<div><b>${u.name}</b><div class="muted" style="font-size:12px">${u.email}</div></div></div>
        <div class="field"><label>New password (min 6 characters)</label>
          <input type="text" class="input" id="rpNew" placeholder="e.g. ${u.name}@456" style="width:100%"/></div>
        <div class="muted" style="font-size:12px">Share the new password with ${u.name} directly. They can change it after signing in.</div>`,
      foot: `<button class="btn subtle" data-close>Cancel</button><button class="btn primary" id="rpGo">${UI.icon('shield')} Set password</button>`,
      onMount: (m, close) => {
        m.querySelector('#rpGo').onclick = async () => {
          try {
            await window.FD_ACCOUNTS.setPassword(userId, m.querySelector('#rpNew').value);
            UI.toast({ title: 'Password reset', sub: u.name + ' can now sign in with the new password', kind: 'ok', icon: 'shield' });
            close();
            if (root) render(root);
          } catch (e) { UI.toast({ title: 'Could not reset', sub: e.message, kind: 'err' }); }
        };
      },
    });
  }

  // Profile editor — used at first sign-in, from the profile menu,
  // and by Admin to edit any member's details.
  function profileModal(userId, opts) {
    opts = opts || {};
    const u = FD.userById(userId);
    const firstRun = !!opts.firstRun;
    UI.modal({
      title: firstRun ? 'Welcome! Complete your profile' : 'Edit details — ' + u.name,
      width: 460,
      body: `
        ${firstRun ? `<div class="banner info" style="margin-bottom:16px">${UI.icon('user')}
          <div>Tell us who you are — your name, designation and department. This is how you'll appear on tasks, boards and reports. You can change it anytime from your profile menu.</div></div>` : ''}
        <div class="field"><label>Full name</label>
          <input class="input" id="pfName" value="${u.name}" placeholder="e.g. Suniti Sharma" style="width:100%"/></div>
        <div class="field"><label>Designation / Role</label>
          <input class="input" id="pfRole" value="${u.role === 'Team Member' ? '' : u.role}" placeholder="e.g. Senior Marketing Executive" style="width:100%"/></div>
        <div class="field"><label>Department</label>
          <select class="select" id="pfDept" style="width:100%">
            ${FD.data.departments.map((d) => `<option value="${d.id}" ${d.id === u.dept ? 'selected' : ''}>${d.name}</option>`).join('')}
          </select></div>`,
      foot: `${firstRun ? '<button class="btn subtle" data-close>Later</button>' : '<button class="btn subtle" data-close>Cancel</button>'}
        <button class="btn primary" id="pfSave">${UI.icon('check')} Save details</button>`,
      onMount: (m, close) => {
        m.querySelector('#pfSave').onclick = () => {
          const name = m.querySelector('#pfName').value.trim();
          if (!name) { UI.toast({ title: 'Name is required', kind: 'err' }); return; }
          window.FD_ACCOUNTS.saveProfile(userId, {
            name: name,
            role: m.querySelector('#pfRole').value.trim() || 'Team Member',
            dept: m.querySelector('#pfDept').value,
          });
          UI.toast({ title: 'Profile saved', sub: name + ' · ' + (FD.deptById(m.querySelector('#pfDept').value) || {}).name, kind: 'ok', icon: 'user' });
          close();
          // refresh whatever view is open so the new details show everywhere
          const route = (location.hash || '#dashboard').slice(1);
          window.FD_APP.go(route);
        };
      },
    });
  }

  // Anyone: change own password (requires the current one)
  function changePasswordModal() {
    const me = FD.userById(FD.state.currentUser);
    UI.modal({
      title: 'Change my password', width: 420,
      body: `
        <div class="field"><label>Current password</label>
          <input type="password" class="input" id="cpOld" style="width:100%"/></div>
        <div class="field"><label>New password (min 6 characters)</label>
          <input type="password" class="input" id="cpNew" style="width:100%"/></div>
        <div class="field"><label>Confirm new password</label>
          <input type="password" class="input" id="cpNew2" style="width:100%"/></div>`,
      foot: `<button class="btn subtle" data-close>Cancel</button><button class="btn primary" id="cpGo">${UI.icon('shield')} Update password</button>`,
      onMount: (m, close) => {
        m.querySelector('#cpGo').onclick = async () => {
          const nw = m.querySelector('#cpNew').value;
          if (nw !== m.querySelector('#cpNew2').value) {
            UI.toast({ title: 'Passwords do not match', kind: 'err' }); return;
          }
          try {
            await window.FD_ACCOUNTS.changeOwnPassword(me.id, m.querySelector('#cpOld').value, nw);
            UI.toast({ title: 'Password updated', sub: 'Use it next time you sign in', kind: 'ok', icon: 'shield' });
            close();
          } catch (e) { UI.toast({ title: 'Could not update', sub: e.message, kind: 'err' }); }
        };
      },
    });
  }

  window.FD_VIEWS = window.FD_VIEWS || {};
  window.FD_VIEWS.settings = { title: 'Settings', render, changePasswordModal, profileModal };
})();
