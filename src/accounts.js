/* ============================================================
   Mafatlal Digital Team Task Tracker — Local account system (no Outlook required)
   - Admin account + team member accounts with passwords
   - Passwords stored as SHA-256 hashes in this browser's
     localStorage (local/demo auth — for true multi-device
     login move this to a backend later)
   - Admin can reset any password from Settings
   ============================================================ */
(function () {
  const STORE_KEY = "fd-accounts-v1";
  const SESSION_KEY = "fd-session";

  // Initial passwords set by the administrator.
  // Members should change theirs after first sign-in (Settings → My password).
  const DEFAULT_PASSWORDS = {
    u9: "Admin@2026",   // Admin (digital@mafatlals.com)
    u1: "Suniti@123",
    u3: "Yash@123",
    u2: "Ishita@123",
    u7: "Karan@123",
    u5: "Aditya@123",
    u6: "Suresh@123",
    u4: "Sushil@123",
    u8: "Hiya@123",
    u10: "Mohit@123",
  };

  async function hash(pw) {
    const s = "flowdesk|" + pw;
    try {
      if (window.crypto && crypto.subtle) {
        const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(s));
        return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, "0")).join("");
      }
    } catch (e) { /* fall through */ }
    // Fallback (very old browsers / non-secure contexts)
    let h = 5381;
    for (let i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) >>> 0;
    return "x" + h.toString(16);
  }

  function load() { try { return JSON.parse(localStorage.getItem(STORE_KEY) || "{}"); } catch (e) { return {}; } }
  function save(d) { try { localStorage.setItem(STORE_KEY, JSON.stringify(d)); } catch (e) {} }

  // Seed default credentials on first run (per browser)
  async function ensureSeeded() {
    const d = load();
    let changed = false;
    for (const uid of Object.keys(DEFAULT_PASSWORDS)) {
      if (!d[uid]) { d[uid] = { hash: await hash(DEFAULT_PASSWORDS[uid]), isDefault: true }; changed = true; }
    }
    if (changed) save(d);
  }

  function findUser(identifier) {
    const id = (identifier || "").trim().toLowerCase();
    return window.FD.data.users.find(
      (u) => u.email.toLowerCase() === id || u.name.toLowerCase() === id
    ) || null;
  }

  async function login(identifier, password) {
    const user = findUser(identifier);
    if (!user) throw new Error("No account found — use your name or email");
    const rec = load()[user.id];
    if (!rec || rec.hash !== await hash(password)) throw new Error("Incorrect password");
    try { localStorage.setItem(SESSION_KEY, user.id); } catch (e) {}
    window.FD.state.currentUser = user.id;
    window.FD.emit("auth:changed", user);
    return user;
  }

  function logout() {
    try { localStorage.removeItem(SESSION_KEY); } catch (e) {}
    location.reload();
  }

  function session() {
    let id = null;
    try { id = localStorage.getItem(SESSION_KEY); } catch (e) {}
    return window.FD.data.users.find((u) => u.id === id) || null;
  }

  // Admin reset (no old password needed) / self change (verify old first)
  async function setPassword(userId, newPw) {
    if (!newPw || newPw.length < 6) throw new Error("Password must be at least 6 characters");
    const d = load();
    d[userId] = { hash: await hash(newPw), isDefault: false };
    save(d);
  }
  async function changeOwnPassword(userId, oldPw, newPw) {
    const rec = load()[userId];
    if (!rec || rec.hash !== await hash(oldPw)) throw new Error("Current password is incorrect");
    await setPassword(userId, newPw);
  }

  function isDefaultPassword(userId) {
    const rec = load()[userId];
    return !!(rec && rec.isDefault);
  }

  function isAdmin(userId) {
    const u = window.FD.userById(userId || window.FD.state.currentUser);
    return !!(u && u.isAdmin);
  }

  // ----- Profiles: members fill in their own details -----
  const PROFILE_KEY = "fd-profiles-v1";
  function loadProfiles() { try { return JSON.parse(localStorage.getItem(PROFILE_KEY) || "{}"); } catch (e) { return {}; } }
  function saveProfilesRaw(d) { try { localStorage.setItem(PROFILE_KEY, JSON.stringify(d)); } catch (e) {} }

  function initialsOf(name) {
    const parts = (name || "").trim().split(/\s+/).filter(Boolean);
    if (!parts.length) return "??";
    return (parts.length > 1 ? parts[0][0] + parts[parts.length - 1][0] : parts[0].slice(0, 2)).toUpperCase();
  }

  function applyProfileTo(userId) {
    const u = window.FD.userById(userId);
    const p = loadProfiles()[userId];
    if (!u || !p) return;
    if (p.name) { u.name = p.name; u.initials = initialsOf(p.name); }
    if (p.role) u.role = p.role;
    if (p.dept) u.dept = p.dept;
  }

  // Overlay saved profiles onto the seed users (run once at startup)
  function applyProfiles() {
    Object.keys(loadProfiles()).forEach(applyProfileTo);
  }

  function saveProfile(userId, patch) {
    const d = loadProfiles();
    d[userId] = Object.assign({}, d[userId], patch, { complete: true });
    saveProfilesRaw(d);
    applyProfileTo(userId);
    window.FD.emit("profile:changed", userId);
  }

  // Admin's profile is considered complete; members must fill theirs once.
  function isProfileComplete(userId) {
    if (isAdmin(userId)) return true;
    return !!(loadProfiles()[userId] || {}).complete;
  }

  // ----- Team members added by the admin (persisted per browser) -----
  const MEMBERS_KEY = "fd-members-v1";
  const PALETTE = ["#0078d4", "#5b5fc7", "#ca5010", "#107c10", "#038387", "#8764b8", "#0099bc", "#c19c00", "#498205", "#0b6a6e", "#a4373a", "#5c2e91"];
  function loadMembers() { try { return JSON.parse(localStorage.getItem(MEMBERS_KEY) || "[]"); } catch (e) { return []; } }
  function saveMembers(a) { try { localStorage.setItem(MEMBERS_KEY, JSON.stringify(a)); } catch (e) {} }

  // Append any admin-created members onto the roster (run at startup).
  function loadCustomMembers() {
    loadMembers().forEach((m) => { if (!window.FD.userById(m.id)) window.FD.data.users.push(m); });
  }

  function emailTaken(email) {
    const e = (email || "").trim().toLowerCase();
    return window.FD.data.users.some((u) => u.email.toLowerCase() === e);
  }

  async function addTeamMember(d) {
    const users = window.FD.data.users;
    if (!d.name || !d.name.trim()) throw new Error("Name is required");
    if (!d.email || !d.email.trim()) throw new Error("Email is required");
    if (emailTaken(d.email)) throw new Error("That email is already in use");
    if (!d.password || d.password.length < 6) throw new Error("Password must be at least 6 characters");
    let n = 11; while (users.find((u) => u.id === "u" + n)) n++;
    const id = "u" + n;
    const user = {
      id, name: d.name.trim(), initials: initialsOf(d.name),
      color: PALETTE[(n - 1) % PALETTE.length],
      role: (d.role && d.role.trim()) || "Team Member",
      dept: d.dept || "mkt", email: d.email.trim().toLowerCase(), custom: true,
    };
    users.push(user);
    const members = loadMembers(); members.push(user); saveMembers(members);
    await setPassword(id, d.password);
    window.FD.emit("members:changed", id);
    return user;
  }

  function removeTeamMember(id) {
    const users = window.FD.data.users;
    const u = window.FD.userById(id);
    if (!u || u.isAdmin || !u.custom) return false;   // only admin-created members can be removed
    const i = users.indexOf(u); if (i > -1) users.splice(i, 1);
    saveMembers(loadMembers().filter((x) => x.id !== id));
    const creds = load(); delete creds[id]; save(creds);
    const profs = loadProfiles(); delete profs[id]; saveProfilesRaw(profs);
    window.FD.emit("members:changed", id);
    return true;
  }

  window.FD_ACCOUNTS = {
    ensureSeeded, login, logout, session, setPassword, changeOwnPassword,
    isAdmin, isDefaultPassword, DEFAULT_PASSWORDS,
    applyProfiles, saveProfile, isProfileComplete,
    loadCustomMembers, addTeamMember, removeTeamMember,
  };
})();
