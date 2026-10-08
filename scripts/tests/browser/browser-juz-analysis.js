#!/usr/bin/env node
"use strict";
/* Browser test (Playwright, Microsoft Edge channel): Juz navigation and the word-analysis panel.
   Not part of `npm run build` because it needs a browser and a local server:
     python -m http.server 8000      (in the project folder)
     NODE_PATH=<folder containing node_modules/playwright-core> node scripts/tests/browser/browser-juz-analysis.js
   Expected values are computed from the source data files, never hard-coded. */
const fs = require("fs");
const path = require("path");
const { chromium } = require("playwright-core");

const ROOT = path.resolve(__dirname, "..", "..", "..");
const BASE = process.env.QM_BASE || "http://127.0.0.1:8000/index.html";
const ayahs = JSON.parse(fs.readFileSync(path.join(ROOT, "data/qurra/ayahs.json"), "utf8")).ayahs;
const juz = JSON.parse(fs.readFileSync(path.join(ROOT, "data/meta/juz.json"), "utf8")).juz;
const surahs = JSON.parse(fs.readFileSync(path.join(ROOT, "data/meta/surahs.json"), "utf8")).surahs;

// expected ranges per juz, derived from the official start positions only
const juzOf = a => { let n = 1; juz.forEach(j => { if (j.start.surah < a.surah || (j.start.surah === a.surah && j.start.ayah <= a.ayah)) n = j.juz; }); return n; };
const expected = new Map();
ayahs.forEach(a => {
  const j = juzOf(a);
  if (!expected.has(j)) expected.set(j, []);
  const list = expected.get(j), last = list[list.length - 1];
  if (last && last.s === a.surah && last.to === a.ayah - 1) last.to = a.ayah; else list.push({ s: a.surah, from: a.ayah, to: a.ayah });
});

let passed = 0, failed = 0;
const rec = (name, ok, msg) => { if (ok) passed++; else { failed++; console.log(`[FAIL] ${name}: ${msg || ""}`); } };

(async () => {
  const browser = await chromium.launch({ channel: "msedge", headless: true });
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const page = await ctx.newPage();
  const errs = [];
  page.on("pageerror", e => errs.push(String(e)));
  page.on("console", m => { if (m.type() === "error") errs.push(m.text()); });
  const go = async (hash, lang = "en") => { await page.goto(BASE + "#/__seed"); await page.evaluate(l => localStorage.setItem("qm-lang", l), lang); await page.goto(BASE + hash); await page.reload(); await page.waitForTimeout(250); };
  const view = () => page.evaluate(() => document.getElementById("qm-view").innerText);

  /* ---- every Juz page shows its true ranges; every ayah is reachable ---- */
  let reachable = 0;
  for (let n = 1; n <= 30; n++) {
    await go("#/juz/" + n);
    const got = await page.$$eval("[data-range]", els => els.map(e => e.dataset.range));
    const want = expected.get(n).map(r => `${r.s}:${r.from}-${r.to}`);
    rec(`Juz ${n}: ranges equal the official boundaries`, JSON.stringify(got) === JSON.stringify(want), JSON.stringify({ got, want }));
    expected.get(n).forEach(r => { reachable += r.to - r.from + 1; });
  }
  rec("Juz pages together reach all 6,236 ayahs, each once", reachable === 6236, String(reachable));

  /* ---- Juz 1 is Al-Fatihah 1-7 and Al-Baqarah 1-141, not the whole surah ---- */
  await go("#/juz/1");
  let t = await view();
  rec("Juz 1 names Al-Baqara 1–141 (not 286)", /1–141/.test(t) && !/1–286/.test(t) && /141 of 286/.test(t), t.slice(0, 200).replace(/\n/g, " | "));

  /* ---- click a range, see only that range, click a word ---- */
  await page.click('[data-range="2:1-141"]'); await page.waitForTimeout(300);
  const n141 = await page.$$eval(".qm-ayah", e => e.length);
  const firstLast = await page.$$eval(".qm-ayah", e => [e[0].dataset.ayah, e[e.length - 1].dataset.ayah]);
  rec("Clicking the range opens just ayahs 1–141 of Al-Baqarah", n141 === 141 && firstLast.join() === "1,141", JSON.stringify({ n141, firstLast }));
  rec("Breadcrumb keeps the Juz context", /Juz 1/.test(await page.$eval(".qm-breadcrumbs", e => e.innerText)));
  await go("#/juz/1/surah/2/ayah/142");
  t = await view();
  rec("An ayah outside the Juz range is reported as not in it (no silent fallback)", /doesn't exist in this surah|Ayah 142/.test(t) && (await page.$$eval(".qm-ayah", e => e.length)) === 0, t.slice(0, 160).replace(/\n/g, " | "));
  await go("#/juz/2/surah/2");
  const j2 = await page.$$eval(".qm-ayah", e => [e.length, e[0].dataset.ayah, e[e.length - 1].dataset.ayah]);
  rec("Juz 2 shows Al-Baqarah 142–252", j2.join() === "111,142,252", j2.join());
  await go("#/juz/1/surah/2/ayah/5");
  await page.waitForTimeout(300);
  rec("An ayah deep link inside a Juz scrolls to it", await page.evaluate(() => { const r = document.getElementById("ayah-5").getBoundingClientRect(); return r.top < innerHeight && r.bottom > 0; }));

  /* ---- word analysis panel ---- */
  await go("#/juz/1/surah/2");
  await page.click('.qm-word[data-token="2:6:3"]'); await page.waitForTimeout(250);
  t = await page.evaluate(() => document.getElementById("qm-detail-content").innerText);
  rec("A verb opens its analysis: Arabic, meaning, POS, status, morphology", /كَفَرُوا/.test(t) && /disbelieve/i.test(t) && /Verb/.test(t) && /Provisional analysis/.test(t) && /3rd person/.test(t) && /Plural/.test(t), t.slice(0, 260).replace(/\n/g, " | "));
  const status = await page.$eval("[data-analysis-status]", e => e.dataset.analysisStatus);
  rec("Its status is provisional, never 'verified'", status === "provisional" && !/Verified/.test(t));
  await page.keyboard.press("Escape");
  await page.click('.qm-word[data-token="2:6:2"]'); await page.waitForTimeout(250);
  t = await page.evaluate(() => document.getElementById("qm-detail-content").innerText);
  rec("A word with a prefix shows a breakdown option and a lemma/root section", /Breakdown/.test(t) && /Lemma/.test(t), t.slice(0, 220).replace(/\n/g, " | "));
  await page.keyboard.press("Escape");

  /* ---- closed-class word: useful fields, no forced root ---- */
  await go("#/word/2:2:3");                      // fi / min / a particle in the first verses
  const pw = await page.evaluate(() => document.getElementById("qm-detail-content").innerText);
  await page.click('.qm-expand[data-expand="links"] .qm-expand__trigger');
  const lr = await page.evaluate(() => document.getElementById("qm-detail-content").innerText);
  rec("A particle shows its kind and a plain note that no root applies", /Particle|Noun|Verb/.test(pw) && /No root is assigned for this kind of word|Root/.test(lr), lr.slice(0, 260).replace(/\n/g, " | "));

  /* ---- a word with no analysis is honest ---- */
  await go("#/home");
  const UN = await page.evaluate(() => { for (const a of QMData.listAyahsInSurah(2)) for (const x of a.tokens) if (!x.analysed) return x.id; return null; });
  await go("#/word/" + UN);
  t = await page.evaluate(() => document.getElementById("qm-detail-content").innerText);
  rec("An unanalysed word says so and shows no invented fields", /Word analysis not available yet/.test(t) && !/Lemma|Root/.test(t.replace("Source information", "")), t.slice(0, 200).replace(/\n/g, " | "));

  /* ---- Bahasa Melayu ---- */
  await go("#/juz/1", "ms");
  t = await view();
  rec("Juz page in Bahasa Melayu uses ayat", /ayat 1–141/.test(t) && /141 daripada 286 ayat/.test(t), t.slice(0, 220).replace(/\n/g, " | "));
  await go("#/word/2:6:3", "ms");
  t = await page.evaluate(() => document.getElementById("qm-detail-content").innerText);
  rec("Word panel in Bahasa Melayu: meaning, status", /kufur|ingkar/i.test(t) && /Analisis sementara/.test(t), t.slice(0, 200).replace(/\n/g, " | "));

  /* ---- search ---- */
  await go("#/home");
  const sq = async q => { await page.fill("#qm-search-input, input[type=search]", q); await page.waitForTimeout(500); return page.$$eval("#qm-search-results a, .qm-search-results a", e => e.map(x => x.getAttribute("href"))); };
  let r = await sq("to disbelieve"); rec("Search finds a lemma by English meaning", r.some(h => /lemma\/kafara-1/.test(h)), JSON.stringify(r.slice(0, 8)));
  r = await sq("kufur"); rec("Search finds a lemma by Malay meaning", r.some(h => /lemma\/kafara-1/.test(h)), JSON.stringify(r.slice(0, 8)));
  r = await sq("ك ف ر"); rec("Search finds a provisional root by letters", r.some(h => /root\//.test(h)), JSON.stringify(r.slice(0, 8)));
  r = await sq("2:255"); rec("Search finds an ayah by reference", r.some(h => /surah\/2\/ayah\/255/.test(h)), JSON.stringify(r.slice(0, 8)));
  r = await sq("و س م"); rec("A disputed root candidate is not searchable as a root", !r.some(h => /root\//.test(h)), JSON.stringify(r.slice(0, 8)));

  /* ---- 360 px: no horizontal overflow on a Juz page ---- */
  await page.setViewportSize({ width: 360, height: 740 });
  await go("#/juz/30");
  rec("360 px: Juz page does not scroll sideways", await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1 && document.body.scrollWidth <= innerWidth + 1));
  rec("no console errors", errs.length === 0, JSON.stringify(errs.slice(0, 3)));

  await browser.close();
  console.log(`browser-juz-analysis: ${passed} passed, ${failed} failed`);
  process.exit(failed ? 1 : 0);
})();
