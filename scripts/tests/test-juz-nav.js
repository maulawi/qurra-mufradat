#!/usr/bin/env node
"use strict";
/* Juz navigation: #/juz is an index of Juz 1-30, #/juz/:n renders Juz n (no fallback to Juz 1), every Juz page links to
   its neighbours and to all other Juz, and a surah link keeps the scoped route #/juz/:n/surah/:m.
   Loads the real UI modules in a vm with a stub window; ranges come from the dataset, never hard-coded. */
const fs = require("fs"), path = require("path"), vm = require("vm");
const ROOT = path.resolve(__dirname, "..", "..");
const files = ["js/translations/en.js", "js/translations/ms.js", "js/i18n.js", "js/state.js", "js/normalize.js", "js/generated/dataset.js",
  "js/generated/search-index.js", "js/generated/translations.js", "js/data.js", "js/filters.js", "js/wordDetail.js", "js/render.js", "js/router.js"];
const src = files.map(f => fs.readFileSync(path.join(ROOT, f), "utf8")).join("\n;\n") + "\nthis.QMRender = QMRender; this.QMRouter = QMRouter; this.QMData = QMData; this.D = QM_DATASET;";
const store = {};
const win = { localStorage: { getItem: k => (k in store ? store[k] : null), setItem: (k, v) => { store[k] = String(v); } }, location: { hash: "" }, addEventListener() {} };
const ctx = { window: win, document: { querySelectorAll: () => [], documentElement: { setAttribute() {} }, addEventListener() {}, dispatchEvent() {}, readyState: "complete" }, CustomEvent: function () {}, console };
ctx.globalThis = ctx;
vm.createContext(ctx);
vm.runInContext(src, ctx);
const { QMRender, D } = ctx;

let passed = 0, failed = 0;
const ok = (n, c, x) => { if (c) passed++; else { failed++; console.error("FAIL " + n + (x ? "  " + x : "")); } };
const links = html => Array.from(html.matchAll(/href="([^"]+)"/g)).map(m => m[1]);

// the route table: #/juz and #/juz/:n both exist, and nothing in the router hard-codes a Juz
const routerSrc = fs.readFileSync(path.join(ROOT, "js/router.js"), "utf8");
ok("router has a #/juz index route", /\\\/juz\\\/\?\$\/, navKey: "juz", handler: \(\) => QMRender\.renderJuzIndex\(\)/.test(routerSrc));
ok("router has #/juz/:n and scoped #/juz/:n/surah/:m routes", /juz\\\/\(\\d\+\)\\\/\?\$\/, navKey: "juz", handler: \(m\) => QMRender\.renderJuz\(m\[1\]\)/.test(routerSrc) && /juz\\\/\(\\d\+\)\\\/surah\\\/\(\\d\+\)\\\/\?\$/.test(routerSrc));
const indexHtml = fs.readFileSync(path.join(ROOT, "index.html"), "utf8");
ok("sidebar and bottom nav Juz links open the index, not Juz 1", !/href="#\/juz\/1"[^>]*data-nav="juz"/.test(indexHtml) && (indexHtml.match(/href="#\/juz"[^>]*data-nav="juz"/g) || []).length === 2);

// index lists all 30
{
  const h = QMRender.renderJuzIndex().html, ls = links(h);
  for (let n = 1; n <= 30; n++) ok(`index links to Juz ${n}`, ls.includes("#/juz/" + n));
  ok("index shows exactly 30 Juz cards", (h.match(/qm-juz-card"/g) || []).length === 30);
}

// each tested Juz renders its own ranges (computed from the dataset) and its own title
const rangesOf = n => {
  const out = []; D.ayahs.filter(a => a.juz === n).forEach(a => { const l = out[out.length - 1]; if (l && l.s === a.surah) l.to = a.ayah; else out.push({ s: a.surah, from: a.ayah, to: a.ayah }); });
  return out;
};
for (const n of [1, 2, 15, 30]) {
  const r = QMRender.renderJuz(String(n)).html, want = rangesOf(n).map(x => `${x.s}:${x.from}-${x.to}`);
  const got = Array.from(r.matchAll(/data-range="([^"]+)"/g)).map(m => m[1]);
  ok(`Juz ${n}: ranges equal the dataset`, JSON.stringify(got) === JSON.stringify(want), JSON.stringify({ got, want }));
  ok(`Juz ${n}: title says Juz ${n}`, new RegExp(`Juz ${n}<`).test(r) || r.includes(`Juz ${n}`));
  const ls = links(r);
  ok(`Juz ${n}: can navigate to every other Juz`, Array.from({ length: 30 }, (_, i) => i + 1).every(k => ls.includes("#/juz/" + k)));
  ok(`Juz ${n}: links back to the index`, ls.includes("#/juz"));
  ok(`Juz ${n}: previous link ${n > 1 ? "#/juz/" + (n - 1) : "absent"}`, n > 1 ? /data-juz-prev/.test(r) && r.match(/href="([^"]+)"[^>]*data-juz-prev/)[1] === "#/juz/" + (n - 1) : !/data-juz-prev/.test(r));
  ok(`Juz ${n}: next link ${n < 30 ? "#/juz/" + (n + 1) : "absent"}`, n < 30 ? r.match(/href="([^"]+)"[^>]*data-juz-next/)[1] === "#/juz/" + (n + 1) : !/data-juz-next/.test(r));
  // surah cards keep the scoped route
  const s = rangesOf(n);
  ok(`Juz ${n}: surah cards use #/juz/${n}/surah/:m`, s.every(x => ls.includes(`#/juz/${n}/surah/${x.s}`)));
  // and that route renders that surah restricted to the Juz range
  const sr = QMRender.renderSurah(String(s[0].s), { juz: String(n) }).html;
  const ayahNums = Array.from(sr.matchAll(/data-ayah="(\d+)"/g)).map(m => Number(m[1]));
  ok(`#/juz/${n}/surah/${s[0].s} shows only ayahs ${s[0].from}-${s[0].to}`, ayahNums.length > 0 && Math.min(...ayahNums) === s[0].from && Math.max(...ayahNums) === s[0].to, `${Math.min(...ayahNums)}-${Math.max(...ayahNums)}`);
}
ok("a Juz that does not exist is not found (no fallback to Juz 1)", /not|found/i.test(QMRender.renderJuz("31").html) && !/data-range/.test(QMRender.renderJuz("31").html));
ok("a surah that is not in the Juz is not found", !/data-ayah/.test(QMRender.renderSurah("114", { juz: "1" }).html));

console.log(`test-juz-nav: ${passed} passed, ${failed} failed`);
process.exit(failed ? 1 : 0);
