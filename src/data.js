/* ============================================================
   Mafatlal Digital Team Task Tracker — Seed data (mock Microsoft 365 workspace)
   Anchored to a fixed "today" so the demo is reproducible.
   ============================================================ */
(function () {
  // Fixed reference date for a stable demo (matches product brief).
  const TODAY = new Date(2026, 5, 12); // 2026-06-12 (months are 0-based)
  const day = 86400000;
  const d = (offsetDays) => new Date(TODAY.getTime() + offsetDays * day);
  const iso = (dt) => dt.toISOString().slice(0, 10);

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

  const projects = [
    { id: "p1", name: "Monsoon 2026 Campaign", dept: "mkt", color: "#0078d4", start: iso(d(-40)), end: iso(d(35)), progress: 62, lead: "u1" },
    { id: "p2", name: "Brand Refresh — Phase 2", dept: "comm", color: "#5b5fc7", start: iso(d(-25)), end: iso(d(50)), progress: 38, lead: "u2" },
    { id: "p3", name: "Q3 Sales Enablement", dept: "sales", color: "#ca5010", start: iso(d(-15)), end: iso(d(45)), progress: 24, lead: "u3" },
    { id: "p4", name: "Factory Branding Audit", dept: "mfg", color: "#8764b8", start: iso(d(-10)), end: iso(d(20)), progress: 55, lead: "u6" },
    { id: "p5", name: "HR Onboarding Revamp", dept: "hr", color: "#107c10", start: iso(d(-30)), end: iso(d(15)), progress: 80, lead: "u4" },
    { id: "p6", name: "ERP Migration", dept: "it", color: "#0099bc", start: iso(d(-50)), end: iso(d(60)), progress: 45, lead: "u7" },
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

  // Recurring task templates
  const recurringTemplates = [
    { id: "r1", name: "Social Media Report", cadence: "Monthly", dept: "mkt", owner: "u1", next: iso(d(19)) },
    { id: "r2", name: "Monthly MIS — Operations", cadence: "Monthly", dept: "ops", owner: "u5", next: iso(d(18)) },
    { id: "r3", name: "Marketing Campaign Review", cadence: "Weekly", dept: "mkt", owner: "u1", next: iso(d(2)) },
    { id: "r4", name: "Factory Branding Audit", cadence: "Quarterly", dept: "mfg", owner: "u6", next: iso(d(20)) },
    { id: "r5", name: "Vendor Review", cadence: "Quarterly", dept: "ops", owner: "u5", next: iso(d(6)) },
    { id: "r6", name: "Annual Compliance Filing", cadence: "Yearly", dept: "mgmt", owner: "u9", next: iso(d(120)) },
  ];

  // Calendar meetings start empty — members add their own and can share
  // their calendar with colleagues who ask.
  const meetings = [];

  // Outlook emails (for the AI email assistant + email-to-task)
  const emails = [
    { id: "e1", from: "Yash", fromEmail: "yash@mafatlals.com", subject: "Need updated pricing sheet for West zone distributors", preview: "Hi team, the West zone distributors are asking for the revised FY26 pricing sheet. Can someone prepare and send this by Friday? It's blocking two onboarding deals.", time: "8:42 AM", date: iso(d(0)), unread: true, suggest: { priority: "High", due: iso(d(3)), assignee: "u3" } },
    { id: "e2", from: "Suresh", fromEmail: "suresh@mafatlals.com", subject: "Signage non-compliance at Nashik gate 2", preview: "Found outdated branding at gate 2 during the walkthrough. We should add this to the audit action list and get the vendor to replace it before the management visit.", time: "Yesterday", date: iso(d(-1)), unread: true, suggest: { priority: "Medium", due: iso(d(5)), assignee: "u6" } },
    { id: "e3", from: "Ishita", fromEmail: "ishita@mafatlals.com", subject: "Press release approval needed", preview: "The sustainability press release draft is ready for legal + management review. Please review and approve so we can publish on schedule.", time: "Yesterday", date: iso(d(-1)), unread: false, suggest: { priority: "Medium", due: iso(d(4)), assignee: "u2" } },
    { id: "e4", from: "Karan", fromEmail: "karan@mafatlals.com", subject: "VPN access requests piling up", preview: "We have 12 pending VPN access requests from the new joiners. Need someone to process these this week before they start.", time: "Mon", date: iso(d(-2)), unread: false, suggest: { priority: "Low", due: iso(d(6)), assignee: "u7" } },
  ];

  const notifications = [];

  const documents = [];

  // Corp Comm pipeline items start empty.
  const commItems = [];

  // AI meeting -> minutes of meeting + action items
  const aiMeeting = {
    title: "Management Review — May MIS",
    date: iso(d(0)),
    attendees: ["u9", "u5", "u7", "u1"],
    summary: "The leadership team reviewed May operational performance. Overall task completion improved to 78%, but IT flagged a delay in the ERP finance migration that risks the audit timeline. Marketing confirmed the Monsoon campaign is on track for launch. Operations raised a vendor SLA concern with two print partners.",
    actionItems: [
      { text: "Escalate ERP finance migration delay and re-baseline timeline", owner: "u7", priority: "Critical", due: iso(d(2)) },
      { text: "Prepare vendor SLA breach summary for the two print partners", owner: "u5", priority: "High", due: iso(d(4)) },
      { text: "Share final Monsoon launch calendar with leadership", owner: "u1", priority: "Medium", due: iso(d(3)) },
      { text: "Circulate May MIS deck to all department heads", owner: "u5", priority: "Low", due: iso(d(1)) },
    ],
  };

  // ----- Marketing analytics (mock — Google Analytics / Search Console / Meta) -----
  // Demo data showing healthy growth. Replace with live API data once connected.
  const marketing = {
    trafficTrend: [
      { label: "Jan", users: 8200, sessions: 11200 },
      { label: "Feb", users: 9100, sessions: 12800 },
      { label: "Mar", users: 10400, sessions: 14600 },
      { label: "Apr", users: 11800, sessions: 16900 },
      { label: "May", users: 13200, sessions: 18800 },
      { label: "Jun", users: 15600, sessions: 22400 },
    ],
    ga: {
      users: { value: "15,600", delta: "+18.2%", up: true },
      sessions: { value: "22,400", delta: "+19.1%", up: true },
      pageviews: { value: "68,900", delta: "+15.4%", up: true },
      engagement: { value: "2m 14s", delta: "+8.0%", up: true },
      bounce: { value: "38.2%", delta: "-4.1%", up: true },
      conversions: { value: "412", delta: "+22.0%", up: true },
    },
    sources: [
      { name: "Organic Search", value: 46, color: "#107c10" },
      { name: "Direct", value: 22, color: "#0078d4" },
      { name: "Social", value: 18, color: "#5b5fc7" },
      { name: "Referral", value: 9, color: "#c19c00" },
      { name: "Paid", value: 5, color: "#e2231a" },
    ],
    topPages: [
      { path: "/", views: 18400, change: "+12%" },
      { path: "/monsoon-collection", views: 11200, change: "+64%" },
      { path: "/products/suiting", views: 8600, change: "+9%" },
      { path: "/sustainability", views: 6100, change: "+38%" },
      { path: "/about", views: 4200, change: "+3%" },
      { path: "/contact", views: 2800, change: "-2%" },
    ],
    search: {
      clicks: { value: "9,840", delta: "+24%", up: true },
      impressions: { value: "312K", delta: "+16%", up: true },
      ctr: { value: "3.2%", delta: "+0.5pt", up: true },
      position: { value: "12.4", delta: "-1.7", up: true },
      queries: [
        { q: "mafatlal fabrics", clicks: 1840, impr: 28400, pos: 2.1 },
        { q: "mafatlal suiting", clicks: 1320, impr: 22100, pos: 3.4 },
        { q: "premium shirting india", clicks: 890, impr: 41200, pos: 8.7 },
        { q: "monsoon collection 2026", clicks: 760, impr: 18900, pos: 5.2 },
        { q: "sustainable textiles brand", clicks: 540, impr: 33600, pos: 11.3 },
      ],
    },
    meta: {
      reach: { value: "184K", delta: "+31%", up: true },
      engagement: { value: "12.4K", delta: "+19%", up: true },
      followers: { value: "48,200", delta: "+1,840", up: true },
      growth: [
        { label: "Wk1", value: 46200 },
        { label: "Wk2", value: 46700 },
        { label: "Wk3", value: 47300 },
        { label: "Wk4", value: 48200 },
      ],
      posts: [
        { title: "Monsoon launch reel", reach: 62400, eng: 4820, type: "Reel" },
        { title: "Sustainability milestone", reach: 38100, eng: 2940, type: "Post" },
        { title: "Behind the scenes — mill", reach: 24600, eng: 1810, type: "Story" },
        { title: "Festive teaser", reach: 19800, eng: 1560, type: "Reel" },
      ],
    },
    campaigns: [
      { name: "Monsoon 2026 Launch", channel: "Multi-channel", status: "Active", budget: 1200000, spend: 740000, reach: 420000, conv: 1240, owner: "u1" },
      { name: "Sustainability Story", channel: "Social + PR", status: "Active", budget: 450000, spend: 180000, reach: 156000, conv: 380, owner: "u2" },
      { name: "Festive Teaser", channel: "Meta Ads", status: "Scheduled", budget: 800000, spend: 0, reach: 0, conv: 0, owner: "u8" },
      { name: "Brand Refresh — Display", channel: "Display + Search", status: "Active", budget: 600000, spend: 410000, reach: 285000, conv: 720, owner: "u1" },
      { name: "Diwali Pre-buzz", channel: "Influencer", status: "Planned", budget: 950000, spend: 0, reach: 0, conv: 0, owner: "u10" },
    ],
    // Numeric bases (combined "All accounts" totals) used to derive per-account figures.
    gaNum: { users: 15600, sessions: 22400, pageviews: 68900, conversions: 412 },
    metaNum: { reach: 184000, engagement: 12400, followers: 48200, spend: 0 },
    // Default connected accounts (share = portion of the combined total).
    gaAccounts: [
      { id: "ga1", name: "Mafatlal — Corporate Website", mid: "G-MFTL00001", share: 0.52 },
      { id: "ga2", name: "Mafatlal Shop (E-commerce)", mid: "G-MFTL00002", share: 0.33 },
      { id: "ga3", name: "Monsoon Campaign Microsite", mid: "G-MFTL00003", share: 0.15 },
    ],
    metaAccounts: [
      { id: "meta1", name: "Mafatlal Fabrics — Meta Ads", acc: "act_100200300", share: 0.46, spend: 740000 },
      { id: "meta2", name: "Mafatlal Retail — Meta Ads", acc: "act_100200400", share: 0.34, spend: 410000 },
      { id: "meta3", name: "Mafatlal Home — Meta Ads", acc: "act_100200500", share: 0.20, spend: 180000 },
    ],
    gscNum: { clicks: 9840, impressions: 312000 },
    gscAccounts: [
      { id: "gsc1", name: "mafatlals.com (Corporate)", site: "https://www.mafatlals.com/", share: 0.58 },
      { id: "gsc2", name: "shop.mafatlals.com", site: "https://shop.mafatlals.com/", share: 0.30 },
      { id: "gsc3", name: "Monsoon microsite", site: "https://monsoon.mafatlals.com/", share: 0.12 },
    ],
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

  window.FD_DATA = {
    TODAY, iso, departments, users, projects, tasks, recurringTemplates,
    meetings, emails, notifications, documents, commItems, aiMeeting,
    completionTrend, marketing, PRI, STATUS,
    analyticsConnectors: [
      { id: "ga4", name: "Google Analytics 4", desc: "Website traffic, users & conversions", icon: "report", color: "#e37400", status: "available", hint: "Measurement ID (G-XXXXXXX) + GA Data API" },
      { id: "gsc", name: "Google Search Console", desc: "Search clicks, impressions & rankings", icon: "search", color: "#4285f4", status: "available", hint: "Verified site property + Search Console API" },
      { id: "meta", name: "Meta (Facebook & Instagram)", desc: "Reach, engagement & follower growth", icon: "megaphone", color: "#0866ff", status: "available", hint: "Meta Business page + Graph API token" },
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
