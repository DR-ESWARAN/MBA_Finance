#!/usr/bin/env node
// Builds the static site into ./public from ./content and ./static.
// Usage: node build.js   (needs pandoc on PATH to turn notes Markdown into HTML)
// To add a subject: put files under content/<sem>/<subject>/ (subject.json, bank.js, notes/, mindmaps/)
// and set "live": true for it in content/catalog.json.
const fs = require("fs");
const path = require("path");
const { execFileSync } = require("child_process");

const ROOT = __dirname, OUT = path.join(ROOT, "public"), C = path.join(ROOT, "content");
const cat = JSON.parse(fs.readFileSync(path.join(C, "catalog.json"), "utf8"));

function rm(p) { fs.rmSync(p, { recursive: true, force: true }); }
function mk(p) { fs.mkdirSync(p, { recursive: true }); }
function write(rel, html) { const f = path.join(OUT, rel); mk(path.dirname(f)); fs.writeFileSync(f, html); }
function copyDir(a, b) { mk(b); for (const f of fs.readdirSync(a)) { const s = path.join(a, f), d = path.join(b, f); fs.statSync(s).isDirectory() ? copyDir(s, d) : fs.copyFileSync(s, d); } }
const esc = s => String(s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

function page({ title, depth, crumbs = [], body, hero = "", scripts = "" }) {
  const up = depth ? "../".repeat(depth) : "./";
  const cr = crumbs.length ? `<div class="crumb">${crumbs.map(([t, h]) => h ? `<a href="${h}">${esc(t)}</a>` : esc(t)).join(" › ")}</div>` : "";
  return `<!doctype html>
<html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>${esc(title)}</title>
<meta name="description" content="${esc(cat.tagline)}">
<meta name="theme-color" content="#2357d9">
<link rel="icon" href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 64 64'%3E%3Crect width='64' height='64' rx='14' fill='%232357d9'/%3E%3Ctext x='32' y='42' font-size='26' font-family='Arial' font-weight='700' fill='white' text-anchor='middle'%3EMBA%3C/text%3E%3C/svg%3E">
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="${up}assets/style.css">
</head><body>
<header class="bar"><div class="in"><a class="logo" href="${up}"><span class="mk">MBA</span><span>Finance <b>Study Hub</b></span></a><span class="sp"></span><a class="lnk" href="${up}sem2/">Sem 2</a></div></header>
<div class="wrap">
${cr ? `<div class="top">${cr}</div>` : ""}
${hero}
${body}
<div class="foot"><b>MBA Finance Study Hub</b> · made for classmates · content from the LMS study material</div>
</div>${scripts}</body></html>`;
}

function countdown(date) {
  if (!date) return "";
  return `<span class="pillg" data-exam="${date}">Exam <b>${new Date(date + "T00:00:00").toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}</b></span><script>(function(){var e=document.currentScript.previousElementSibling,d=Math.ceil((new Date(e.dataset.exam+"T09:00:00+05:30")-Date.now())/864e5);if(d>=0)e.innerHTML+=" · <b>"+(d===0?"today":d+(d===1?" day":" days")+" left")+"</b>";})();</script>`;
}
const ic = t => `<span class="ic"${t.length > 4 ? ' style="font-size:11px"' : ""}>${esc(t)}</span>`;
function badge(s) {
  return s === "live" ? `<span class="badge b-live">Live</span>` : s === "done" ? `<span class="badge b-done">Completed</span>` : `<span class="badge b-soon">Coming soon</span>`;
}

function md2html(file) {
  let md = fs.readFileSync(file, "utf8");
  md = md.split(/\n\s*\n/).slice(3).join("\n\n"); // drop the 3 print title lines
  let html = execFileSync("pandoc", ["-f", "gfm", "-t", "html5", "--wrap=none"], { input: md }).toString();
  html = html.replace(/<table/g, '<div class="tbl"><table').replace(/<\/table>/g, "</table></div>");
  // print notes use bold-only paragraphs as headings; promote them for screen
  html = html.replace(/<p><strong>([^<]{2,90})<\/strong><\/p>/g, (m, t) => /^\d/.test(t) ? `<h2>${t}</h2>` : `<h3>${t}</h3>`);
  html = html.replace(/<p>(\d+\\?\.\s[^<]{2,80})<\/p>/g, (m, t) => `<h2>${t.replace("\\", "")}</h2>`);
  return html;
}

// ---------------- build ----------------
rm(OUT); mk(OUT);
copyDir(path.join(ROOT, "static"), OUT);

// Home
write("index.html", page({
  title: cat.site, depth: 0,
  hero: `<section class="hero"><div class="eyebrow">DY Patil Online MBA · Finance</div><h1>Study smarter for every semester</h1><p>Notes, mind maps, module practice and full 70-question timed mocks. Built from the LMS material. Free, no login, made for the phone.</p><div class="meta">${countdown((cat.semesters.find(s => s.status === "live") || {}).examDate)}<span class="pillg">Sem 2 · <b>${(cat.semesters.find(s => s.status === "live") || { subjects: [] }).subjects.filter(x => x.live).length} subject live</b></span></div><div class="cta"><a class="btn gold" href="sem2/">Go to Semester 2</a></div></section>`,
  body: `<div class="section">Semesters</div>
<div class="grid">${cat.semesters.map((s, i) => {
    const n = s.subjects.filter(x => x.live).length;
    const sub = s.status === "live" ? `${n} of ${s.subjects.length} subjects ready` : s.note || "Coming soon";
    return `<a class="tile${s.status === "live" ? " feat" : ""}" href="${s.id}/">${ic("S" + (i + 1))}<div class="bd">${badge(s.status)}<h3>${esc(s.name)}</h3><p>${esc(sub)}</p></div></a>`;
  }).join("")}</div>`
}));

for (const sem of cat.semesters) {
  const semCr = [["Home", "../"], [sem.name]];
  const tiles = sem.subjects.length ? `<div class="grid">${sem.subjects.map(sb => sb.live
    ? `<a class="tile feat" href="${sb.id}/">${ic(sb.code)}<div class="bd">${badge("live")}<h3>${esc(sb.name)}</h3><p>Notes · mind maps · mock${sb.elective ? " · Elective" : ""}</p></div></a>`
    : `<div class="tile off">${ic(sb.code)}<div class="bd">${badge("soon")}<h3>${esc(sb.name)}</h3><p>${sb.elective ? "Elective" : "Core subject"}</p></div></div>`).join("")}</div>`
    : `<div class="note">This semester has not started yet. Subjects will appear here.</div>`;
  write(`${sem.id}/index.html`, page({
    title: `${sem.name} · ${cat.site}`, depth: 1, crumbs: semCr,
    hero: `<section class="hero"><div class="eyebrow">${sem.status === "live" ? "Live now" : sem.status === "done" ? "Completed" : "Coming soon"}</div><h1>${esc(sem.name)}</h1><p>${esc(sem.note || "Subjects will appear here when the semester starts.")}</p>${sem.examDate ? `<div class="meta">${countdown(sem.examDate)}</div>` : ""}</section>`,
    body: `${sem.subjects.length ? '<div class="section">Subjects</div>' : ""}${tiles}`
  }));

  for (const sb of sem.subjects.filter(x => x.live)) {
    const dir = path.join(C, sem.id, sb.id);
    const cfg = JSON.parse(fs.readFileSync(path.join(dir, "subject.json"), "utf8"));
    const base = `${sem.id}/${sb.id}`;
    const subCr = [["Home", "../../"], [sem.name, "../"], [sb.code]];
    fs.copyFileSync(path.join(dir, "bank.js"), path.join(mk(path.join(OUT, base)) || path.join(OUT, base), "bank.js"));
    global.window = {}; delete require.cache[path.join(dir, "bank.js")]; require(path.join(dir, "bank.js"));
    let nQ = window.QBANK.rows.length;
    const hasLms = cfg.lmsPractice && fs.existsSync(path.join(dir, cfg.lmsPractice));
    let nL = 0;
    if (hasLms) {
      fs.copyFileSync(path.join(dir, cfg.lmsPractice), path.join(OUT, base, "lms.js"));
      require(path.join(dir, cfg.lmsPractice)); nL = window.LMSBANK.rows.length; nQ += nL;
      write(`${base}/lms.html`, page({
        title: `${sb.code} LMS Practice · ${cat.site}`, depth: 2, crumbs: [...subCr.slice(0, 2), [sb.code, "./"], ["LMS practice"]],
        body: `<div id="app"><p class="sub">Loading…</p></div><noscript>Please turn on JavaScript to take the quiz.</noscript>`,
        scripts: `<script>window.QUIZ_CFG={key:${JSON.stringify(base + "/lms")},mockN:${nL},mockMin:${Math.ceil(nL * 90 / 70)},label:"LMS practice assignment test"};</script><script src="lms.js"></script><script>window.QBANK=window.LMSBANK;</script><script src="../../assets/quiz.js"></script>`
      }));
    }

    // Notes, cheat sheets, mind maps per module
    for (const m of cfg.modules) {
      const tabs = k => `<div class="tabs">${[["notes", "Notes"], ["cheat", "Cheat sheet"], ["mindmap", "Mind map"]].map(([id, t]) =>
        `<a href="${id === "mindmap" ? `mindmap-m${m.n}.html` : `${id}-m${m.n}.html`}" class="${id === k ? "on" : ""}">${t}</a>`).join("")}</div>`;
      const pager = k => `<div class="nav" style="margin-top:14px">${m.n > 1 ? `<a class="btn ghost" href="${k}-m${m.n - 1}.html">‹ Module ${m.n - 1}</a>` : ""}<a class="btn ghost" href="quiz.html?mode=practice&m=${m.n}">Practise M${m.n} questions</a>${m.n < cfg.modules.length ? `<a class="btn ghost" href="${k}-m${m.n + 1}.html">Module ${m.n + 1} ›</a>` : ""}</div>`;
      for (const [k, label] of [["notes", "Notes"], ["cheat", "Cheat sheet"]]) {
        const f = path.join(dir, "notes", `m${m.n}-${k}.md`);
        if (!fs.existsSync(f)) continue;
        write(`${base}/${k}-m${m.n}.html`, page({
          title: `${sb.code} M${m.n} ${label}`, depth: 2, crumbs: [...subCr.slice(0, 2), [sb.code, "./"], [`Module ${m.n}`]],
          body: `<h1>Module ${m.n} · ${esc(m.title)}</h1><p class="sub">${esc(sb.name)} · ${label}</p>${tabs(k)}<article class="doc">${md2html(f)}</article>${pager(k)}`
        }));
      }
      const mmf = path.join(dir, "mindmaps", `m${m.n}.html`);
      if (fs.existsSync(mmf)) {
        const bar = `<div style="position:sticky;top:0;z-index:9;display:flex;gap:8px;flex-wrap:wrap;align-items:center;padding:10px 12px;margin:-14px -14px 14px;background:#0d1117ee;border-bottom:1px solid #30363d;font:600 14px -apple-system,Segoe UI,Roboto,sans-serif"><a href="./" style="color:#58a6ff;text-decoration:none">‹ ${esc(sb.code)}</a><span style="flex:1"></span><a href="notes-m${m.n}.html" style="color:#c9d1d9;text-decoration:none">Notes</a><a href="cheat-m${m.n}.html" style="color:#c9d1d9;text-decoration:none">Cheat sheet</a>${m.n > 1 ? `<a href="mindmap-m${m.n - 1}.html" style="color:#c9d1d9;text-decoration:none">‹ M${m.n - 1}</a>` : ""}${m.n < cfg.modules.length ? `<a href="mindmap-m${m.n + 1}.html" style="color:#c9d1d9;text-decoration:none">M${m.n + 1} ›</a>` : ""}</div>`;
        const theme = `<style>:root{--bg:#140b24;--card:#1f1433;--card2:#281a40;--accent:#b48cff;--accent4:#e9c25a;--line:#3a2a58;--muted:#a99cc4}header{background:linear-gradient(135deg,#3b1670,#5b2a9e)!important;border-color:#e9c25a66!important}header .sub{color:#e9c25a!important}</style>`;
        let mm = fs.readFileSync(mmf, "utf8").replace(/<\/head>/i, theme + "</head>").replace(/<body([^>]*)>/i, `<body$1>${bar.replace(/#0d1117ee/, "#22093fee").replace(/#30363d/, "#e9c25a").replace(/#58a6ff/, "#e9c25a")}`);
        write(`${base}/mindmap-m${m.n}.html`, mm);
      }
    }

    // Quiz page (mock / practice / wrong)
    write(`${base}/quiz.html`, page({
      title: `${sb.code} Quiz · ${cat.site}`, depth: 2, crumbs: [...subCr.slice(0, 2), [sb.code, "./"], ["Quiz"]],
      body: `<div id="app"><p class="sub">Loading…</p></div><noscript>Please turn on JavaScript to take the quiz.</noscript>`,
      scripts: `<script>window.QUIZ_CFG={key:${JSON.stringify(base)}};</script><script src="bank.js"></script>${hasLms ? `<script src="lms.js"></script><script>QBANK.rows=QBANK.rows.concat(LMSBANK.rows);</script>` : ""}<script src="../../assets/quiz.js"></script>`
    }));

    // Subject hub
    const rows = cfg.modules.map(m => `<div class="row"><span class="num">${m.n}</span><div class="t">Module ${m.n}<small>${esc(m.title)}</small></div><div class="chips"><a class="chip" href="notes-m${m.n}.html">Notes</a><a class="chip" href="cheat-m${m.n}.html">Cheat sheet</a><a class="chip" href="mindmap-m${m.n}.html">Mind map</a><a class="chip" href="quiz.html?mode=practice&m=${m.n}">AI Ques</a>${hasLms ? `<a class="chip" href="lms.html?mode=mock&m=${m.n}">Practice Assignment</a>` : ""}</div></div>`).join("");
    const lms = (x, name, n) => x
      ? `<a class="tile" href="quiz.html?mode=${x}">${ic(String(n))}<div class="bd">${badge("live")}<h3>${name}</h3><p>${n} questions</p></div></a>`
      : `<div class="tile off">${ic(String(n))}<div class="bd">${badge("soon")}<h3>${name}</h3><p>${n} questions from the LMS</p></div></div>`;
    write(`${base}/index.html`, page({
      title: `${sb.name} · ${cat.site}`, depth: 2, crumbs: subCr,
      hero: `<section class="hero"><div class="eyebrow">${esc(sem.name)} · ${esc(sb.code)}</div><h1>${esc(sb.name)}</h1><p>${cfg.modules.length} modules · ${nQ}-question bank · 70-question, 90-minute mock like the real exam.</p><div class="meta">${countdown(sem.examDate)}</div><div class="cta"><a class="btn gold" href="quiz.html?mode=mock">Start mock exam</a><a class="btn line" href="quiz.html?mode=practice">Practise</a></div></section>`,
      body: `<div class="section">Test yourself</div><div class="grid">
<a class="tile feat" href="quiz.html?mode=mock">${ic("70")}<div class="bd"><span class="badge b-live">Exam mode</span><h3>Mock exam</h3><p>70 random questions from ${nQ} (Ebook + LMS) · 90 minutes · review at the end</p></div></a>
<a class="tile" href="quiz.html?mode=practice">${ic(String(nQ))}<div class="bd"><span class="badge b-done">Untimed</span><h3>Practice by module</h3><p>Ebook + LMS questions, instant answers with explanations</p></div></a>
<a class="tile" href="quiz.html?mode=wrong">${ic("✗")}<div class="bd"><span class="badge b-done">Your device</span><h3>Retry wrong answers</h3><p>Questions you missed, saved on this phone</p></div></a>
${hasLms ? "" : lms(null, "LMS practice set", 75)}
${lms(cfg.lmsGraded, "LMS graded assignments", 30)}
</div>
${hasLms ? `<div class="section">LMS practice assignments</div><div class="grid">
<a class="tile feat" href="lms.html?mode=mock">${ic(String(nL))}<div class="bd"><span class="badge b-live">All modules · timed</span><h3>Practice assignment test</h3><p>All ${nL} questions, or pick one module inside · timed · explanations at the end</p></div></a>
<a class="tile" href="lms.html?mode=practice">${ic("?")}<div class="bd"><span class="badge b-done">Untimed</span><h3>Learn the LMS questions</h3><p>Instant answer, explanation, other options and related concepts</p></div></a>
</div>` : ""}
<div class="section">Modules</div><div class="list">${rows}</div>
<p class="sub" style="margin-top:18px;font-size:13px">Questions come only from the LMS: Ebooks, Study Notes, Objective Question Banks and practice assignments. Each answer shows its source.</p>`
    }));
  }
}

// Cloudflare Pages: no trailing-slash redirects needed; add 404
write("404.html", page({ title: "Not found", depth: 0, body: `<h1>Page not found</h1><p class="sub"><a href="/">Go to the home page</a></p>` }));
console.log("Built into", OUT);
