/* ============================================================
   Mafatlal Digital Team Task Tracker — Seed data (mock Microsoft 365 workspace)
   Anchored to a fixed "today" so the demo is reproducible.
   ============================================================ */
(function () {
  // Fixed reference date for a stable demo (matches product brief).
  const TODAY = new Date(2026, 5, 12); // 2026-06-12 (months are 0-based)
  const day = 86400000;
  const d = (offsetDays) => new Date(TODAY.getTime() + offsetDays * day);
  // Local-date ISO (YYYY-MM-DD) — avoids the UTC day-shift that toISOString
  // causes in timezones ahead of UTC (e.g. India / IST).
  const iso = (dt) => {
    const m = String(dt.getMonth() + 1).padStart(2, "0");
    const day = String(dt.getDate()).padStart(2, "0");
    return dt.getFullYear() + "-" + m + "-" + day;
  };

  const departments = [
    { id: "mkt", name: "Marketing", color: "#0078d4" },
    { id: "comm", name: "Corporate Communications", color: "#5b5fc7" },
    { id: "hr", name: "HR", color: "#107c10" },
    { id: "sales", name: "Sales", color: "#ca5010" },
    { id: "ops", name: "Operations", color: "#038387" },
    { id: "mfg", name: "Manufacturing", color: "#8764b8" },
    { id: "it", name: "IT", color: "#0099bc" },
    { id: "mgmt", name: "Management", color: "#605e5c" },
  ];

  // Members start with a neutral role — each person fills in their own
  // designation & department from their profile (Settings / first sign-in).
  const users = [
    { id: "u1", name: "Suniti", initials: "SN", color: "#0078d4", role: "Team Member", dept: "mkt", email: "suniti@mafatlals.com" },
    { id: "u2", name: "Ishita", initials: "IS", color: "#5b5fc7", role: "Team Member", dept: "comm", email: "ishita@mafatlals.com" },
    { id: "u3", name: "Yash", initials: "YS", color: "#ca5010", role: "Team Member", dept: "sales", email: "yash@mafatlals.com" },
    { id: "u4", name: "Sushil", initials: "SL", color: "#107c10", role: "Team Member", dept: "hr", email: "sushil@mafatlals.com" },
    { id: "u5", name: "Aditya", initials: "AY", color: "#038387", role: "Team Member", dept: "ops", email: "aditya@mafatlals.com" },
    { id: "u6", name: "Suresh", initials: "SR", color: "#8764b8", role: "Team Member", dept: "mfg", email: "suresh@mafatlals.com" },
    { id: "u7", name: "Karan", initials: "KR", color: "#0099bc", role: "Team Member", dept: "it", email: "karan@mafatlals.com" },
    { id: "u8", name: "Hiya", initials: "HY", color: "#c19c00", role: "Team Member", dept: "mkt", email: "hiya@mafatlals.com" },
    { id: "u9", name: "Admin", initials: "AD", color: "#d13438", role: "Administrator", dept: "mgmt", email: "digital@mafatlals.com", isAdmin: true },
    { id: "u10", name: "Mohit", initials: "MT", color: "#498205", role: "Team Member", dept: "comm", email: "mohit@mafatlals.com" },
  ];

  // Project categories (used in the task "Project" field).
  const projects = [
    { id: "pj1", name: "Website/App Development", color: "#0078d4" },
    { id: "pj2", name: "Leadership Driven", color: "#5b5fc7" },
    { id: "pj3", name: "Miscellaneous", color: "#605e5c" },
    { id: "pj4", name: "Content Creation", color: "#c13584" },
    { id: "pj5", name: "Reporting / Success Story", color: "#107c10" },
    { id: "pj6", name: "Daily Operation", color: "#ca5010" },
    { id: "pj7", name: "Performance Marketing", color: "#0099bc" },
    { id: "pj8", name: "Whatsapp / Email Communication", color: "#038387" },
  ];

  const PRI = ["Critical", "High", "Medium", "Low"];
  const STATUS = ["Open", "In Progress", "Waiting for Approval", "Completed", "On Hold", "Delayed"];

  // Task factory
  let tid = 0;
  const T = (o) => {
    tid++;
    return Object.assign({
      id: "T-" + (1000 + tid),
      progress: 0,
      reviewer: "u9",
      tags: [],
      source: "manual",
      calendarSync: true,
      teamsChannel: null,
      attachments: [],
      recurring: null,
      activity: [],
    }, o);
  };

  // Tasks start EMPTY — a clean slate for every account. Team members and
  // the admin create their own tasks; they persist per browser via the store.
  // (The T() factory is retained so seed tasks can be re-added if ever needed.)
  void T;
  const tasks = [];

  // Recurring task templates — empty; the team adds their own.
  const recurringTemplates = [];

  // Calendar meetings start empty — members add their own and can share
  // their calendar with colleagues who ask.
  const meetings = [];

  // Outlook emails (for the AI email assistant) — empty until inbox is connected.
  const emails = [];

  const notifications = [];

  const documents = [];

  // Corp Comm pipeline items start empty.
  const commItems = [];

  // AI meeting (minutes + action items) — empty until a meeting is connected.
  const aiMeeting = { title: "", date: iso(d(0)), attendees: [], summary: "", actionItems: [] };

  // ----- Marketing analytics -----
  // Empty by default — connect accounts (or a backend) to populate with live data.
  const noDelta = { delta: "—", up: true };
  const months6 = ["Jan", "Feb", "Mar", "Apr", "May", "Jun"];
  const marketing = {
    trafficTrend: months6.map((label) => ({ label, users: 0, sessions: 0 })),
    ga: { users: noDelta, sessions: noDelta, pageviews: noDelta, engagement: { value: "—", delta: "—", up: true }, bounce: { value: "—", delta: "—", up: true }, conversions: noDelta },
    sources: [],
    topPages: [],
    search: { clicks: noDelta, impressions: noDelta, ctr: { value: "—", delta: "—", up: true }, position: { value: "—", delta: "—", up: true }, queries: [] },
    meta: { reach: noDelta, engagement: noDelta, followers: noDelta, growth: [], posts: [] },
    campaigns: [],
    contentSchedule: [],
    gaNum: { users: 0, sessions: 0, pageviews: 0, conversions: 0 },
    metaNum: { reach: 0, engagement: 0, followers: 0, spend: 0 },
    gaAccounts: [],
    metaAccounts: [],
    gscNum: { clicks: 0, impressions: 0 },
    gscAccounts: [],
    metaBizNum: { reach: 0, engagement: 0, followers: 0 },
    metaBizAccounts: [],
    postTrend: months6.map((label) => ({ label, reach: 0, eng: 0 })),
    pastPosts: [],
  };

  // Completion trend buckets (filled in live from real tasks by the store).
  const completionTrend = [
    { label: "W1", created: 0, completed: 0 },
    { label: "W2", created: 0, completed: 0 },
    { label: "W3", created: 0, completed: 0 },
    { label: "W4", created: 0, completed: 0 },
    { label: "W5", created: 0, completed: 0 },
    { label: "W6", created: 0, completed: 0 },
  ];

  // Influencer directory — empty; the team adds their own.
  const influencers = [];

  window.FD_DATA = {
    TODAY, iso, departments, users, projects, tasks, recurringTemplates,
    meetings, emails, notifications, documents, commItems, aiMeeting,
    completionTrend, marketing, influencers, PRI, STATUS,
    analyticsConnectors: [
      { id: "ga4", name: "Google Analytics 4", desc: "Website traffic, users & conversions", icon: "report", color: "#e37400", status: "available", hint: "Measurement ID (G-XXXXXXX) + GA Data API" },
      { id: "gsc", name: "Google Search Console", desc: "Search clicks, impressions & rankings", icon: "search", color: "#4285f4", status: "available", hint: "Verified site property + Search Console API" },
      { id: "metabiz", name: "Meta Business Suite", desc: "Organic social post & page performance", icon: "megaphone", color: "#1877f2", status: "available", hint: "Facebook Page / Instagram Business account + Graph API token" },
      { id: "meta", name: "Meta Ads", desc: "Paid campaign reach & spend", icon: "bolt", color: "#0866ff", status: "available", hint: "Meta Business ad account + Graph API token" },
    ],
    integrations: [
      { id: "outlook", name: "Microsoft Outlook", desc: "Email-to-task, reminders, escalations", status: "connected", icon: "outlook", color: "#0078d4", lastSync: "Just now" },
      { id: "calendar", name: "Outlook Calendar", desc: "Two-way deadline & meeting sync", status: "connected", icon: "calendar", color: "#0078d4", lastSync: "2 min ago" },
      { id: "teams", name: "Microsoft Teams", desc: "Channel notifications & collaboration", status: "connected", icon: "teams", color: "#5b5fc7", lastSync: "1 min ago" },
      { id: "onedrive", name: "OneDrive", desc: "File attachments & co-authoring", status: "connected", icon: "onedrive", color: "#0364b8", lastSync: "5 min ago" },
      { id: "entra", name: "Microsoft Entra ID", desc: "Single sign-on (Azure AD)", status: "connected", icon: "shield", color: "#0078d4", lastSync: "Session active" },
      { id: "planner", name: "Microsoft Planner", desc: "Bucket & plan synchronization", status: "available", icon: "board", color: "#31752f", lastSync: "—" },
      { id: "sharepoint", name: "SharePoint", desc: "Document libraries & sites", status: "available", icon: "doc", color: "#038387", lastSync: "—" },
      { id: "powerbi", name: "Power BI", desc: "Embedded executive dashboards", status: "available", icon: "report", color: "#f2c811", lastSync: "—" },
    ],
  };
})();
