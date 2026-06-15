/* ============================================================
   Mafatlal Digital Team Task Tracker — Sign-in screen (username + password)
   ============================================================ */
(function () {
  function show(onSuccess) {
    const overlay = document.createElement("div");
    overlay.className = "login-overlay";
    overlay.id = "loginOverlay";
    overlay.innerHTML = `
      <div class="login-card">
        <div class="login-brand" id="loginBrand">
          <img class="login-logo" src="assets/img/mafatlal-shield.svg" alt="Mafatlal — Since 1905" />
          <div class="login-wordmark">Mafatlal</div>
          <div class="login-title">Digital Team Task Tracker</div>
          <div class="login-sub">Internal task management workspace</div>
        </div>
        <div class="login-head">Sign in to your account</div>
        <form id="loginForm" autocomplete="on">
          <label class="login-label" for="loginUser">Username</label>
          <input class="input login-field" id="loginUser" type="text" placeholder="name or email" autocomplete="username" autofocus />
          <label class="login-label" for="loginPw">Password</label>
          <div class="login-pw-wrap">
            <input class="input login-field" id="loginPw" type="password" placeholder="Password" autocomplete="current-password" />
            <button type="button" class="login-eye" id="loginEye" title="Show password" tabindex="-1"></button>
          </div>
          <div class="login-err" id="loginErr"></div>
          <button type="submit" class="btn primary login-submit" id="loginGo">Sign in</button>
        </form>
        <div class="login-foot">Use the username and password set by your administrator.<br/>Forgot it? Ask the Admin to reset it.</div>
      </div>`;
    document.body.appendChild(overlay);

    // If an official logo file exists (any common format), use it in place of
    // the recreation. Drop your file in assets/img/ as "mafatlal-logo.<ext>".
    (function upgradeLogo() {
      const candidates = [
        "assets/img/mafatlal-logo.png",
        "assets/img/mafatlal-logo.svg",
        "assets/img/mafatlal-logo.jpg",
        "assets/img/mafatlal-logo.jpeg",
        "assets/img/mafatlal-logo.webp",
      ];
      let i = 0;
      const probe = new Image();
      probe.onload = () => {
        const brand = overlay.querySelector("#loginBrand");
        if (brand) brand.innerHTML =
          '<img class="login-logo" style="height:auto;width:230px;max-width:80%" src="' + candidates[i] + '" alt="Mafatlal" />' +
          '<div class="login-title" style="margin-top:14px">Digital Team Task Tracker</div>' +
          '<div class="login-sub">Internal task management workspace</div>';
      };
      probe.onerror = () => { i++; if (i < candidates.length) probe.src = candidates[i]; };
      probe.src = candidates[i];
    })();

    const UI = window.FD_UI;
    const eye = overlay.querySelector("#loginEye");
    eye.innerHTML = UI.icon("eye");
    const pw = overlay.querySelector("#loginPw");
    eye.onclick = () => {
      pw.type = pw.type === "password" ? "text" : "password";
      eye.classList.toggle("on", pw.type === "text");
    };

    overlay.querySelector("#loginForm").onsubmit = async (e) => {
      e.preventDefault();
      const err = overlay.querySelector("#loginErr");
      const go = overlay.querySelector("#loginGo");
      const user = overlay.querySelector("#loginUser").value.trim();
      err.textContent = "";
      if (!user || !pw.value) { err.textContent = "Enter your username and password"; return; }
      go.disabled = true; go.textContent = "Signing in…";
      try {
        const account = await window.FD_ACCOUNTS.login(user, pw.value);
        overlay.classList.add("fade-out");
        setTimeout(() => overlay.remove(), 250);
        onSuccess(account);
      } catch (ex) {
        err.textContent = ex.message;
        go.disabled = false; go.textContent = "Sign in";
        pw.value = ""; pw.focus();
      }
    };
  }

  window.FD_LOGIN = { show };
})();
