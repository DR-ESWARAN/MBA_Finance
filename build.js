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

function page({ title, depth, crumbs = [], body, scripts = "" }) {
  const up = depth ? "../".repeat(depth) : "./";
  const cr = crumbs.length ? `<div class="crumb">${crumbs.map(([t, h]) => h ? `<a href="${h}">${esc(t)}</a>` : esc(t)).join(" › ")}</div>` : "";
  return `<!doctype html>
<html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>${esc(title)}</title>
<meta name="description" content="${esc(cat.tagline)}">
<meta name="theme-color" content="#2357d9">
<link rel="icon" href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 64 64'%3E%3Crect width='64' height='64' rx='14' fill='%232357d9'/%3E%3Ctext x='32' y='42' font-size='26' font-family='Arial' font-weight='700' fill='white' text-anchor='middle'%3EMBA%3C/text%3E%3C/svg%3E">
<link rel="stylesheet" href="${up}assets/style.css">
</head><body><div class="wrap">
<div class="top">${cr}</div>
${body}
<div class="foot">${esc(cat.site)} · made for classmates · content from the LMS study material</div>
</div>${scripts}</body></html>`;
}

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
  body: `<h1>${esc(cat.site)}</h1><p class="sub">${esc(cat.tagline)}</p>
<div class="grid">${cat.semesters.map(s => {
    const n = s.subjects.filter(x => x.live).length;
    const sub = s.status === "live" ? `${n} of ${s.subjects.length} subjects ready` : s.note || "Coming soon";
    return `<a class="tile" href="${s.id}/">${badge(s.status)}<h3>${esc(s.name)}</h3><p>${esc(sub)}</p></a>`;
  }).join("")}</div>`
}));

for (const sem of cat.semesters) {
  const semCr = [["Home", "../"], [sem.name]];
  const tiles = sem.subjects.length ? `<div class="grid">${sem.subjects.map(sb => sb.live
    ? `<a class="tile" href="${sb.id}/">${badge("live")}<h3>${esc(sb.name)}</h3><p>${esc(sb.code)}${sb.elective ? " · Elective" : ""}</p></a>`
    : `<div class="tile off">${badge("soon")}<h3>${esc(sb.name)}</h3><p>${esc(sb.code)}${sb.elective ? " · Elective" : ""}</p></div>`).join("")}</div>`
    : `<div class="note">This semester has not started yet. Subjects will appear here.</div>`;
  write(`${sem.id}/index.html`, page({
    title: `${sem.name} · ${cat.site}`, depth: 1, crumbs: semCr,
    body: `<h1>${esc(sem.name)}</h1><p class="sub">${esc(sem.note || "")}</p>${tiles}`
  }));

  for (const sb of sem.subjects.filter(x => x.live)) {
    const dir = path.join(C, sem.id, sb.id);
    const cfg = JSON.parse(fs.readFileSync(path.join(dir, "subject.json"), "utf8"));
    const base = `${sem.id}/${sb.id}`;
    const subCr = [["Home", "../../"], [sem.name, "../"], [sb.code]];
    fs.copyFileSync(path.join(dir, "bank.js"), path.join(mk(path.join(OUT, base)) || path.join(OUT, base), "bank.js"));
    global.window = {}; delete require.cache[path.join(dir, "bank.js")]; require(path.join(dir, "bank.js"));
    const nQ = window.QBANK.rows.length;

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
        let mm = fs.readFileSync(mmf, "utf8").replace(/<body([^>]*)>/i, `<body$1>${bar}`);
        write(`${base}/mindmap-m${m.n}.html`, mm);
      }
    }

    // Quiz page (mock / practice / wrong)
    write(`${base}/quiz.html`, page({
      title: `${sb.code} Quiz · ${cat.site}`, depth: 2, crumbs: [...subCr.slice(0, 2), [sb.code, "./"], ["Quiz"]],
      body: `<div id="app"><p class="sub">Loading…</p></div><noscript>Please turn on JavaScript to take the quiz.</noscript>`,
      scripts: `<script>window.QUIZ_CFG={key:${JSON.stringify(base)}};</script><script src="bank.js"></script><script src="../../assets/quiz.js"></script>`
    }));

    // Subject hub
    const rows = cfg.modules.map(m => `<div class="row"><div class="t">Module ${m.n}<small>${esc(m.title)}</small></div><div class="chips"><a class="chip" href="notes-m${m.n}.html">Notes</a><a class="chip" href="cheat-m${m.n}.html">Cheat sheet</a><a class="chip" href="mindmap-m${m.n}.html">Mind map</a><a class="chip" href="quiz.html?mode=practice&m=${m.n}">Practice</a></div></div>`).join("");
    const lms = (x, name, n) => x
      ? `<a class="tile" href="quiz.html?mode=${x}">${badge("live")}<h3>${name}</h3><p>${n} questions</p></a>`
      : `<div class="tile off">${badge("soon")}<h3>${name}</h3><p>${n} questions from the LMS</p></div>`;
    write(`${base}/index.html`, page({
      title: `${sb.name} · ${cat.site}`, depth: 2, crumbs: subCr,
      body: `<h1>${esc(sb.name)}</h1><p class="sub">${esc(sem.name)} · ${esc(sem.note || "")}</p>
<div class="grid">
<a class="tile" href="quiz.html?mode=mock">${badge("live")}<h3>Mock exam</h3><p>70 random questions · 90 minutes · score and review at the end</p></a>
<a class="tile" href="quiz.html?mode=practice"><span class="badge b-done">Untimed</span><h3>Practice by module</h3><p>${nQ} questions with instant answers and reasons</p></a>
<a class="tile" href="quiz.html?mode=wrong"><span class="badge b-done">Your device</span><h3>Retry wrong answers</h3><p>Questions you missed, saved on this phone</p></a>
${lms(cfg.lmsPractice, "LMS practice set", 75)}
${lms(cfg.lmsGraded, "LMS graded assignments", 30)}
</div>
<div class="section">Modules</div><div class="list">${rows}</div>
<p class="sub" style="margin-top:18px;font-size:13px">Questions come only from the LMS Ebooks, Study Notes and Objective Question Banks. Each answer shows its source.</p>`
    }));
  }
}

// Cloudflare Pages: no trailing-slash redirects needed; add 404
write("404.html", page({ title: "Not found", depth: 0, body: `<h1>Page not found</h1><p class="sub"><a href="/">Go to the home page</a></p>` }));
console.log("Built into", OUT);
