/* ============================================================
   Mafatlal Digital Team Task Tracker — Voice input
   Wraps the browser SpeechRecognition API (Web Speech).
   Works in Chrome / Edge / Safari over HTTPS, with mic permission.
   ============================================================ */
(function () {
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  let active = null;

  function supported() { return !!SR; }

  // opts: { lang, onInterim(text), onResult(finalText), onError(code), onEnd() }
  // returns a stop() function.
  function listen(opts) {
    opts = opts || {};
    if (!SR) { if (opts.onError) opts.onError("unsupported"); return function () {}; }
    if (active) { try { active.stop(); } catch (e) {} active = null; }
    const rec = new SR();
    rec.lang = opts.lang || "en-IN";
    rec.interimResults = true;
    rec.continuous = false;
    rec.maxAlternatives = 1;
    let finalText = "";
    rec.onresult = (e) => {
      let interim = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const t = e.results[i][0].transcript;
        if (e.results[i].isFinal) finalText += t; else interim += t;
      }
      if (opts.onInterim) opts.onInterim((finalText + " " + interim).trim());
    };
    rec.onerror = (e) => { if (opts.onError) opts.onError(e.error || "error"); };
    rec.onend = () => { active = null; if (opts.onResult) opts.onResult(finalText.trim()); if (opts.onEnd) opts.onEnd(); };
    try { rec.start(); active = rec; } catch (e) { if (opts.onError) opts.onError("start-failed"); }
    return function () { try { rec.stop(); } catch (e) {} };
  }

  function stop() { if (active) { try { active.stop(); } catch (e) {} } }

  window.FD_VOICE = { supported, listen, stop };
})();
