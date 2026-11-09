/* Quiz engine: mock (timed exam), practice (instant feedback), wrong (retry saved mistakes).
   Needs window.QBANK (from bank.js) and window.QUIZ_CFG = {key, title}. */
(function () {
  "use strict";
  var B = window.QBANK, CFG = window.QUIZ_CFG || {};
  var KEY = CFG.key || "quiz";
  var MOCK_N = 70, MOCK_MIN = 90;
  var app = document.getElementById("app");
  var params = new URLSearchParams(location.search);
  var MODE = params.get("mode") || "mock";
  var MOD = params.get("m"); // module number or null

  // ---------- storage (never trust it to exist) ----------
  function sget(k, d) { try { var v = localStorage.getItem(k); return v ? JSON.parse(v) : d; } catch (e) { return d; } }
  function sset(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} }
  function sdel(k) { try { localStorage.removeItem(k); } catch (e) {} }
  var WKEY = "wrong:" + KEY, SKEY = "mock:" + KEY, HKEY = "hist:" + KEY;

  // ---------- helpers ----------
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }
  function hash(s) { var h = 5381; for (var i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) | 0; return "q" + (h >>> 0).toString(36); }
  function shuffle(a) { a = a.slice(); for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)); var t = a[i]; a[i] = a[j]; a[j] = t; } return a; }
  var L = "ABCDEFGH";

  // ---------- build question objects ----------
  var ALL = B.rows.map(function (r) {
    var opts = r[2] === "TF" ? ["True", "False"] : r[2];
    return { id: hash(r[0] + "|" + r[1]), m: r[0], q: r[1], opts: opts, a: r[3], why: r[4], src: r[5], tf: r[2] === "TF" };
  });
  var BYID = {}; ALL.forEach(function (q) { BYID[q.id] = q; });
  function optOrder(q) {
    var idx = q.opts.map(function (_, i) { return i; });
    var fixed = q.tf || q.opts.some(function (o) { return /all of (the )?above|none of (the )?above|both/i.test(o); });
    return fixed ? idx : shuffle(idx);
  }
  function srcLabel(s) { return s === "QB" ? "LMS Objective QB" : s === "SN" ? "Study Notes" : "Ebook"; }
  function modName(m) { return "M" + m + " · " + (B.modules[m] || ""); }

  function pickMock() {
    var groups = {}; ALL.forEach(function (q) { (groups[q.m] = groups[q.m] || []).push(q); });
    var N = Math.min(MOCK_N, ALL.length), picked = [], mods = Object.keys(groups);
    var quota = {}, given = 0;
    mods.forEach(function (m) { quota[m] = Math.floor(N * groups[m].length / ALL.length); given += quota[m]; });
    var rest = shuffle(mods); var k = 0;
    while (given < N) { var m = rest[k++ % rest.length]; if (quota[m] < groups[m].length) { quota[m]++; given++; } }
    mods.forEach(function (m) { picked = picked.concat(shuffle(groups[m]).slice(0, quota[m])); });
    return shuffle(picked);
  }

  // ---------- state ----------
  var S = null, tick = null;

  function newSession(mode, qs) {
    S = { mode: mode, ids: qs.map(function (q) { return q.id; }), ord: {}, ans: {}, flag: {}, cur: 0, done: false };
    qs.forEach(function (q) { S.ord[q.id] = optOrder(q); });
    if (mode === "mock") S.endAt = Date.now() + MOCK_MIN * 60000;
    save();
  }
  function save() { if (S && S.mode === "mock" && !S.done) sset(SKEY, S); }

  // ---------- start screens ----------
  function start() {
    var saved = sget(SKEY, null);
    var wrong = sget(WKEY, {});
    var nWrong = Object.keys(wrong).filter(function (id) { return BYID[id]; }).length;
    var h = "";
    if (MODE === "mock") {
      var n = Math.min(MOCK_N, ALL.length);
      h += card("<h1>Mock exam</h1><p class='sub'>" + n + " random questions from a bank of " + ALL.length + ", spread across all 5 modules. " + MOCK_MIN + " minutes. One question per screen. Answers and reasons are shown only after you submit, like the real exam.</p>" +
        (saved && !saved.done && saved.endAt > Date.now() ? "<div class='note'>You have an unfinished mock (" + Object.keys(saved.ans).length + " answered). </div><div class='nav'><button class='btn' id='resume'>Resume it</button><button class='btn ghost' id='go'>Start a new one</button></div>" :
          "<div class='nav'><button class='btn' id='go'>Start mock</button></div>") + histHtml());
    } else if (MODE === "wrong") {
      h += card("<h1>Retry my wrong answers</h1><p class='sub'>Questions you got wrong in any mock or practice, saved on this device only. Get one right and it leaves the list.</p>" +
        (nWrong ? "<div class='nav'><button class='btn' id='go'>Start (" + nWrong + " questions)</button><button class='btn ghost' id='clear'>Clear list</button></div>" : "<div class='note'>No wrong answers saved yet. Take a mock or practice set first.</div>"));
    } else {
      var pool = poolFor(MOD);
      h += card("<h1>Practice" + (MOD ? " · Module " + MOD : " · All modules") + "</h1><p class='sub'>" + (MOD ? esc(B.modules[MOD] || "") + ". " : "") + pool.length + " questions, untimed. Tap an answer to see right or wrong and the reason at once.</p>" +
        "<div class='chips' style='margin-bottom:14px'>" + chip(null) + Object.keys(B.modules).map(chip).join("") + "</div>" +
        "<div class='nav'><button class='btn' id='go'>Start</button></div>");
    }
    app.innerHTML = h;
    on("go", function () {
      if (MODE === "mock") { sdel(SKEY); newSession("mock", pickMock()); startTimer(); }
      else if (MODE === "wrong") newSession("wrong", shuffle(Object.keys(sget(WKEY, {})).filter(function (id) { return BYID[id]; }).map(function (id) { return BYID[id]; })));
      else newSession("practice", shuffle(poolFor(MOD)));
      render();
    });
    on("resume", function () { S = saved; startTimer(); render(); });
    on("clear", function () { sdel(WKEY); start(); });
  }
  function chip(m) {
    var on = (m === null && !MOD) || String(m) === MOD;
    var href = "?mode=practice" + (m ? "&m=" + m : "");
    return "<a class='chip' style='" + (on ? "background:var(--brand);color:#fff;border-color:var(--brand)" : "") + "' href='" + href + "'>" + (m ? "M" + m : "All") + "</a>";
  }
  function poolFor(m) { return m ? ALL.filter(function (q) { return String(q.m) === String(m); }) : ALL.slice(); }
  function histHtml() {
    var h = sget(HKEY, []); if (!h.length) return "";
    return "<div class='section'>Your past mocks (this device)</div><table class='modtbl'>" + h.slice(-8).reverse().map(function (x) {
      return "<tr><td>" + esc(new Date(x.t).toLocaleString()) + "</td><td>" + x.s + " / " + x.n + " (" + Math.round(100 * x.s / x.n) + "%)</td></tr>";
    }).join("") + "</table>";
  }
  function card(inner) { return "<div class='qcard'>" + inner + "</div>"; }
  function on(id, fn) { var el = document.getElementById(id); if (el) el.addEventListener("click", fn); }

  // ---------- timer ----------
  function startTimer() {
    clearInterval(tick);
    tick = setInterval(function () {
      var t = document.getElementById("timer"); var left = S.endAt - Date.now();
      if (left <= 0) { clearInterval(tick); finish(true); return; }
      if (t) { t.textContent = fmt(left); t.classList.toggle("low", left < 5 * 60000); }
    }, 1000);
  }
  function fmt(ms) { var s = Math.max(0, Math.round(ms / 1000)); var m = Math.floor(s / 60); return (m < 10 ? "0" : "") + m + ":" + ("0" + (s % 60)).slice(-2); }

  // ---------- question screen ----------
  function render() {
    var id = S.ids[S.cur], q = BYID[id], ord = S.ord[id], chosen = S.ans[id];
    var isMock = S.mode === "mock", answered = chosen !== undefined;
    var nAns = Object.keys(S.ans).length;
    var h = "<div class='qbar'><div class='info'><b>Q " + (S.cur + 1) + "</b> of " + S.ids.length + " · " + nAns + " answered</div>" +
      (isMock ? "<div class='timer' id='timer'>" + fmt(S.endAt - Date.now()) + "</div>" : "<div class='info' style='flex:0;white-space:nowrap'>" + score() + " correct</div>") + "</div>";
    h += "<div class='progress'><i style='width:" + (100 * (S.cur + 1) / S.ids.length) + "%'></i></div>";
    h += "<div class='qcard'><div class='qmeta'><span>" + esc(modName(q.m)) + "</span>" +
      (isMock ? "<button class='flagbtn" + (S.flag[id] ? " on" : "") + "' id='flag'>" + (S.flag[id] ? "★ Flagged" : "☆ Flag") + "</button>" : "") + "</div>";
    h += "<p class='qtext'>" + esc(q.q) + "</p><div class='opts'>";
    ord.forEach(function (oi, k) {
      var cls = "opt";
      if (isMock) { if (chosen === oi) cls += " sel"; }
      else if (answered) { if (oi === q.a) cls += " right"; else if (oi === chosen) cls += " wrong"; }
      h += "<button class='" + cls + "' data-o='" + oi + "'" + (!isMock && answered ? " disabled" : "") + "><span class='l'>" + L[k] + "</span><span>" + esc(q.opts[oi]) + "</span></button>";
    });
    h += "</div>";
    if (!isMock && answered) h += "<div class='why'>" + (chosen === q.a ? "<b>Correct.</b> " : "<b style='color:var(--bad)'>Not quite.</b> Answer: <b>" + esc(q.opts[q.a]) + "</b>. ") + esc(q.why) + " <span style='color:var(--muted)'>(" + srcLabel(q.src) + ")</span></div>";
    var last = S.cur === S.ids.length - 1;
    h += "<div class='nav'><button class='btn ghost' id='prev'" + (S.cur === 0 ? " disabled" : "") + ">‹ Prev</button>" +
      (last ? "<button class='btn' id='end'>" + (isMock ? "Submit" : "Finish") + "</button>" : "<button class='btn' id='next'>Next ›</button>") + "</div>";
    h += "</div>";
    // palette below question
    h += "<div class='qgrid'>" + S.ids.map(function (qid, i) {
      var c = []; if (i === S.cur) c.push("cur");
      if (S.ans[qid] !== undefined) { if (isMock) c.push("ans"); else c.push(S.ans[qid] === BYID[qid].a ? "r" : "w"); }
      if (S.flag[qid]) c.push("flg");
      return "<button data-j='" + i + "' class='" + c.join(" ") + "'>" + (i + 1) + "</button>";
    }).join("") + "</div>";
    if (isMock) h += "<div class='legend'><span>Blue = answered</span><span>Purple dot = flagged</span><span>Outline = current</span></div>" +
      "<div class='nav' style='margin-top:16px'><button class='btn ghost' id='end2'>Submit exam now</button></div><div id='confirm'></div>";
    else h += "<div class='nav' style='margin-top:16px'><button class='btn ghost' id='end2'>End and see results</button></div>";
    app.innerHTML = h;

    Array.prototype.forEach.call(app.querySelectorAll(".opt"), function (b) {
      b.addEventListener("click", function () {
        var oi = +b.getAttribute("data-o");
        if (!isMock && answered) return;
        S.ans[id] = oi; if (!isMock) trackWrong(q, oi); save(); render();
      });
    });
    Array.prototype.forEach.call(app.querySelectorAll(".qgrid button"), function (b) {
      b.addEventListener("click", function () { S.cur = +b.getAttribute("data-j"); save(); render(); window.scrollTo(0, 0); });
    });
    on("prev", function () { S.cur--; save(); render(); window.scrollTo(0, 0); });
    on("next", function () { S.cur++; save(); render(); window.scrollTo(0, 0); });
    on("flag", function () { S.flag[id] = !S.flag[id]; save(); render(); });
    var askEnd = function () {
      if (!isMock) return finish(false);
      var left = S.ids.length - Object.keys(S.ans).length;
      document.getElementById("confirm").innerHTML = "<div class='note'>" + (left ? "<b>" + left + " unanswered.</b> " : "") + "Submit the exam now?</div><div class='nav'><button class='btn' id='yes'>Yes, submit</button><button class='btn ghost' id='no'>Keep going</button></div>";
      on("yes", function () { finish(false); });
      on("no", function () { document.getElementById("confirm").innerHTML = ""; });
      document.getElementById("confirm").scrollIntoView({ behavior: "smooth" });
    };
    on("end", askEnd); on("end2", askEnd);
  }
  function score() { var s = 0; S.ids.forEach(function (id) { if (S.ans[id] === BYID[id].a) s++; }); return s; }
  function trackWrong(q, oi) {
    var w = sget(WKEY, {});
    if (oi === q.a) delete w[q.id]; else w[q.id] = (w[q.id] || 0) + 1;
    sset(WKEY, w);
  }

  // ---------- results ----------
  function finish(timeUp) {
    clearInterval(tick);
    S.done = true;
    if (S.mode === "mock") {
      S.ids.forEach(function (id) { if (S.ans[id] !== undefined) trackWrong(BYID[id], S.ans[id]); });
      var hist = sget(HKEY, []); hist.push({ t: Date.now(), s: score(), n: S.ids.length }); sset(HKEY, hist.slice(-30));
      sdel(SKEY);
    }
    results(timeUp, "w");
  }
  function results(timeUp, filter) {
    var n = S.ids.length, s = score(), skipped = S.ids.filter(function (id) { return S.ans[id] === undefined; }).length;
    var wrong = n - s - skipped, mods = {};
    S.ids.forEach(function (id) { var q = BYID[id]; var m = mods[q.m] = mods[q.m] || [0, 0]; m[1]++; if (S.ans[id] === q.a) m[0]++; });
    var h = "<div class='qcard score'>" + (timeUp ? "<div class='note'>Time is up. Your exam was submitted automatically.</div>" : "") +
      "<div class='big'>" + s + " / " + n + "</div><div class='pct'>" + Math.round(100 * s / n) + "%</div>" +
      "<div class='stats'><div class='stat'><b style='color:var(--ok)'>" + s + "</b><span>Correct</span></div><div class='stat'><b style='color:var(--bad)'>" + wrong + "</b><span>Wrong</span></div><div class='stat'><b>" + skipped + "</b><span>Skipped</span></div></div>" +
      "<table class='modtbl'>" + Object.keys(mods).sort().map(function (m) { return "<tr><td>" + esc(modName(m)) + "</td><td>" + mods[m][0] + " / " + mods[m][1] + "</td></tr>"; }).join("") + "</table>" +
      "<div class='nav'><a class='btn' href='?mode=" + (S.mode === "practice" ? "practice" + (MOD ? "&m=" + MOD : "") : S.mode) + "'>Try again</a><a class='btn ghost' href='?mode=wrong'>Retry wrong ones</a></div></div>";
    h += "<div class='filters'>" + [["w", "Wrong (" + wrong + ")"], ["s", "Skipped (" + skipped + ")"], ["f", "Flagged"], ["a", "All"]].map(function (f) {
      return "<button data-f='" + f[0] + "' class='" + (filter === f[0] ? "on" : "") + "'>" + f[1] + "</button>";
    }).join("") + "</div><div class='rv'>";
    var shown = 0;
    S.ids.forEach(function (id, i) {
      var q = BYID[id], c = S.ans[id], st = c === undefined ? "s" : c === q.a ? "r" : "w";
      if (filter === "w" && st !== "w") return; if (filter === "s" && st !== "s") return; if (filter === "f" && !S.flag[id]) return;
      shown++;
      h += "<div class='item " + st + "'><div class='q'>" + (i + 1) + ". " + esc(q.q) + "</div><div class='a'>" +
        (st === "w" ? "Your answer: <span class='y'>" + esc(q.opts[c]) + "</span><br>" : st === "s" ? "<span style='color:var(--muted)'>Not answered</span><br>" : "") +
        "Correct: <span class='c'>" + esc(q.opts[q.a]) + "</span></div><div class='reason'>" + esc(q.why) + " · " + esc(modName(q.m)) + " · " + srcLabel(q.src) + "</div></div>";
    });
    if (!shown) h += "<p class='sub'>Nothing here.</p>";
    h += "</div>";
    app.innerHTML = h;
    window.scrollTo(0, 0);
    Array.prototype.forEach.call(app.querySelectorAll(".filters button"), function (b) {
      b.addEventListener("click", function () { results(false, b.getAttribute("data-f")); });
    });
  }

  start();
})();
