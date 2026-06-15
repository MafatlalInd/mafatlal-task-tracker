/* ============================================================
   Mafatlal Digital Team Task Tracker — Microsoft Graph client
   Real implementations of the integration seams used by
   src/store.js graphHooks. Active only when FD_AUTH is
   configured AND the user is signed in; otherwise the store
   falls back to demo-mode console logging.
   ============================================================ */
(function () {
  const BASE = "https://graph.microsoft.com/v1.0";

  async function call(path, opts) {
    opts = opts || {};
    const token = await window.FD_AUTH.getToken();
    const res = await fetch(BASE + path, {
      method: opts.method || "GET",
      headers: Object.assign({
        Authorization: "Bearer " + token,
        "Content-Type": "application/json",
      }, opts.headers || {}),
      body: opts.body ? JSON.stringify(opts.body) : undefined,
    });
    if (res.status === 204) return null;
    const json = await res.json();
    if (!res.ok) throw new Error((json.error && json.error.message) || ("Graph error " + res.status));
    return json;
  }

  const isLive = () => window.FD_AUTH.isConfigured() && window.FD_AUTH.isSignedIn();

  // ----- Calendar: task deadline → Outlook Calendar event -----
  function createCalendarEvent(task) {
    return call("/me/events", {
      method: "POST",
      body: {
        subject: "[Task Tracker] " + task.name,
        body: { contentType: "Text", content: (task.desc || "") + "\n\nTask " + task.id + " · Priority: " + task.priority },
        start: { dateTime: task.due + "T09:00:00", timeZone: "India Standard Time" },
        end: { dateTime: task.due + "T09:30:00", timeZone: "India Standard Time" },
        isReminderOn: true,
        reminderMinutesBeforeStart: 1440, // 24h milestone reminder
        categories: ["Mafatlal Task Tracker"],
      },
    });
  }

  function updateCalendarEvent(eventId, task) {
    return call("/me/events/" + eventId, {
      method: "PATCH",
      body: {
        subject: "[Task Tracker] " + task.name,
        start: { dateTime: task.due + "T09:00:00", timeZone: "India Standard Time" },
        end: { dateTime: task.due + "T09:30:00", timeZone: "India Standard Time" },
      },
    });
  }

  // ----- Meetings: Outlook calendar → Task dashboard -----
  function getCalendarView(startIso, endIso) {
    return call("/me/calendarView?startDateTime=" + startIso + "T00:00:00&endDateTime=" + endIso + "T23:59:59&$top=50&$orderby=start/dateTime");
  }

  // ----- Mail: reminders, escalations, approvals, digest -----
  function sendMail(to, subject, html) {
    return call("/me/sendMail", {
      method: "POST",
      body: {
        message: {
          subject: subject,
          body: { contentType: "HTML", content: html },
          toRecipients: [{ emailAddress: { address: to } }],
        },
        saveToSentItems: true,
      },
    });
  }

  function getRecentMessages(top) {
    return call("/me/messages?$top=" + (top || 10) + "&$select=subject,from,bodyPreview,receivedDateTime&$orderby=receivedDateTime desc");
  }

  // ----- Teams: channel notification -----
  // Requires ChannelMessage.Send + the team/channel IDs from your tenant.
  function sendTeamsMessage(teamId, channelId, html) {
    return call("/teams/" + teamId + "/channels/" + channelId + "/messages", {
      method: "POST",
      body: { body: { contentType: "html", content: html } },
    });
  }

  // ----- Convenience wrappers used by store.js hooks -----
  function notifyAssignee(task, assigneeEmail) {
    return sendMail(
      assigneeEmail,
      "Task assigned: " + task.name,
      "<p>You've been assigned <b>" + task.name + "</b> (" + task.priority + " priority), due <b>" + task.due + "</b>.</p><p>" + (task.desc || "") + "</p><p>— Mafatlal Digital Team Task Tracker</p>"
    );
  }
  function requestApproval(task, reviewerEmail) {
    return sendMail(
      reviewerEmail,
      "Approval required: " + task.name,
      "<p><b>" + task.name + "</b> has been submitted for your approval.</p><p>Progress: " + task.progress + "% · Due: " + task.due + "</p><p>— Mafatlal Digital Team Task Tracker</p>"
    );
  }
  function sendOverdueEscalation(task, toEmail) {
    return sendMail(
      toEmail,
      "OVERDUE: " + task.name,
      "<p><b>" + task.name + "</b> is past its due date (" + task.due + ").</p><p>— Mafatlal Digital Team Task Tracker escalation</p>"
    );
  }

  window.FD_MSGRAPH = {
    isLive, call,
    createCalendarEvent, updateCalendarEvent, getCalendarView,
    sendMail, getRecentMessages, sendTeamsMessage,
    notifyAssignee, requestApproval, sendOverdueEscalation,
  };
})();
