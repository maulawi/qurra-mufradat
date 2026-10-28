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
  rec("A verb opens its analysis: Arabic, meaning, POS, status, morphology", /كَفَرُوا/.test(t) && /disbelieve/i.test(t) && /Verb/.test(t) && /Provisional/.test(t) && /3rd person/.test(t) && /Plural/.test(t), t.slice(0, 260).replace(/\n/g, " | "));
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

  /* ---- an unresolved word has a record and says so ---- */
  await go("#/home");
  const UN = await page.evaluate(() => { for (const a of QMData.listAyahsInSurah(2)) for (const x of a.tokens) if (x.resolution === "unresolved") return x.id; return null; });
  await go("#/word/" + UN);
  t = await page.evaluate(() => document.getElementById("qm-detail-content").innerText);
  rec("An unresolved word says 'Expert review needed' and shows no invented lemma or root", /Expert review needed/i.test(t) && /Unresolved/.test(t) && /Possible lemmas|No analysis assigned/.test(t) && !/Root/.test(t.replace("Source information", "")) && (await page.$("[data-unresolved]")) !== null, t.slice(0, 260).replace(/\n/g, " | "));
  /* ---- provisional (root open) and context-dependent words show their real status ---- */
  for (const [cls, label] of [["provisional", /Root still open/], ["context_dependent", /Context-dependent/]]) {
    await go("#/home");
    const id = await page.evaluate(c => { for (const a of QMData.listAyahsInSurah(2)) for (const x of a.tokens) if (x.resolution === c) return x.id; return null; }, cls);
    await go("#/word/" + id);
    t = await page.evaluate(() => document.getElementById("qm-detail-content").innerText);
    rec("A " + cls + " word shows its own status label", id !== null && label.test(t), t.slice(0, 200).replace(/\s+/g, " "));
  }
  await go("#/home");
  const homeText = await view();
  const homeCards = await page.$$eval("[data-home-card]", e => e.map(x => x.getAttribute("href")));
  rec("Home: four destination cards (Juz, Surahs, Roots, Lemmas) and the compact beta banner only", homeCards.join() === "#/juz,#/surahs,#/roots,#/lemmas" && /Beta version/.test(homeText) && /Verification in progress\./.test(homeText) && !/scholar|unresolved|expert review/i.test(homeText), homeText.replace(/\s+/g, " ").slice(0, 200));
  await go("#/juz");
  const cards = await page.$$eval("[data-juz-index] .qm-juz-card .qm-badge", e => e.map(x => x.innerText.trim()));
  rec("Juz index: fully analysed Juz cards carry no coverage badge (no repeated 'Complete' / percentages)", cards.length === 0, JSON.stringify(cards.slice(0, 3)));
  const cards2 = await page.$$eval("[data-juz-index] .qm-juz-card", e => e.map(x => x.innerText.replace(/\s+/g, " ").trim()));
  rec("Juz index: 24, 25, 26 and 30 show no percentage and no long status text", [24, 25, 26, 30].every(n => !/\d%|Complete|Provisional/.test(cards2[n - 1])), JSON.stringify([24, 25, 26, 30].map(n => cards2[n - 1])));
  await go("#/surah/2");
  t = await view();
  rec("A fully analysed surah page has no coverage or disclaimer note", !/word analysis complete|scholar|unresolved|generated by rules/i.test(t) && (await page.$(".qm-info-note, .qm-demo-note")) === null, t.slice(0, 300).replace(/\n/g, " | "));
  await go("#/surahs"); t = await view();
  rec("Surahs index: no coverage note", !/%|provisional|scholar|word analysis/i.test(t) && (await page.$(".qm-info-note")) === null, t.slice(0, 160).replace(/\n/g, " | "));
  await go("#/lemmas"); t = await view();
  rec("Lemmas index: no lexicon-size or provisional paragraph", !/dictionary-form lemmas are recorded|provisional lexicon/i.test(t) && (await page.$(".qm-info-note")) === null, t.slice(0, 160).replace(/\n/g, " | "));
  await go("#/roots"); t = await view();
  rec("Roots index: one short neutral provisional line, no count or process text", (await page.$$eval(".qm-info-note", e => e.map(x => x.innerText))).join() === "All roots are provisional. Contested roots are not listed." && !/verification process/i.test(t) && (await page.$(".qm-demo-note")) === null);
  await go("#/roots", "ms"); t = await view();
  rec("Roots index in Bahasa Melayu: the same short line", /Semua akar kata bersifat sementara/.test(t) && !/proses pengesahan/i.test(t));
  await go("#/word/2:6:3");
  rec("Word panel basis line is short", /Default analysis; context may differ\.|Chosen for this verse|Analysed by QURRA/.test(await page.evaluate(() => document.getElementById("qm-detail-content").innerText)) && !/not yet reviewed by a scholar/i.test(await page.evaluate(() => document.getElementById("qm-detail-content").innerText)));
  await go("#/home", "ms"); t = await page.evaluate(() => document.querySelector(".qm-sidebar__footer .qm-badge").innerText);
  rec("Sidebar badge reads 'Versi beta' in Bahasa Melayu", /Versi beta/.test(t), t);
  await go("#/home"); t = await page.evaluate(() => document.querySelector(".qm-sidebar__footer .qm-badge").innerText);
  rec("Sidebar badge reads 'Beta version' in English", /Beta version/.test(t), t);

  /* ---- Juz navigation: index, per-Juz routes, switcher, sidebar, history ---- */
  await go("#/juz");
  rec("#/juz lists Juz 1–30", (await page.$$eval("[data-juz-index] a", e => e.map(x => x.getAttribute("href")))).join() === Array.from({ length: 30 }, (_, i) => "#/juz/" + (i + 1)).join());
  await page.click('[data-juz-index] a[href="#/juz/15"]'); await page.waitForTimeout(200);
  rec("Clicking Juz 15 on the index opens Juz 15", page.url().endsWith("#/juz/15") && /Juz 15/.test(await view()) && (await page.$$eval("[data-range]", e => e[0].dataset.range)) === "17:1-111");
  for (const n of [1, 2, 15, 30]) {
    await go("#/juz/" + n);
    const first = await page.$$eval("[data-range]", e => e[0].dataset.range);
    const w = expected.get(n)[0];
    rec(`#/juz/${n} opens Juz ${n}`, first === `${w.s}:${w.from}-${w.to}` && new RegExp(`Juz ${n}\\b`).test(await view()), first);
  }
  await go("#/juz/2");
  await page.click("[data-juz-next]"); await page.waitForTimeout(200);
  rec("Next goes from Juz 2 to Juz 3", page.url().endsWith("#/juz/3"));
  await page.goBack(); await page.waitForTimeout(200);
  rec("Browser Back returns to Juz 2", page.url().endsWith("#/juz/2") && /Juz 2\b/.test(await view()));
  await page.click('[data-juz-strip] a[href="#/juz/30"]'); await page.waitForTimeout(200);
  rec("The Juz strip jumps to Juz 30", page.url().endsWith("#/juz/30"));
  await page.click('.qm-sidebar a[data-nav="juz"], nav a[data-nav="juz"]'); await page.waitForTimeout(200);
  rec("The sidebar Juz link opens the index (not Juz 1)", page.url().endsWith("#/juz") && (await page.$$eval("[data-juz-index] a", e => e.length)) === 30);
  await go("#/juz/15");
  await page.click('[data-range^="17:"]'); await page.waitForTimeout(300);
  rec("A surah inside Juz 15 keeps the scoped route", /#\/juz\/15\/surah\/17$/.test(page.url()) && (await page.$$eval(".qm-ayah", e => e[0].dataset.ayah)) === "1");

  /* ---- Bahasa Melayu ---- */
  await go("#/juz/1", "ms");
  t = await view();
  rec("Juz page in Bahasa Melayu uses ayat", /ayat 1–141/.test(t) && /141 daripada 286 ayat/.test(t), t.slice(0, 220).replace(/\n/g, " | "));
  await go("#/word/2:6:3", "ms");
  t = await page.evaluate(() => document.getElementById("qm-detail-content").innerText);
  rec("Word panel in Bahasa Melayu: meaning, status", /kufur|ingkar/i.test(t) && /Sementara/.test(t), t.slice(0, 200).replace(/\n/g, " | "));

  /* ---- search ---- */
  await go("#/home");
  const sq = async q => { await page.fill("#qm-search-input, input[type=search]", q); await page.waitForTimeout(500); return page.$$eval("#qm-search-results a, .qm-search-results a", e => e.map(x => x.getAttribute("href"))); };
  let r = await sq("to disbelieve"); rec("Search finds a lemma by English meaning", r.some(h => /lemma\/kafara-1/.test(h)), JSON.stringify(r.slice(0, 8)));
  r = await sq("kufur"); rec("Search finds a lemma by Malay meaning", r.some(h => /lemma\/kafara-1/.test(h)), JSON.stringify(r.slice(0, 8)));
  r = await sq("ك ف ر"); rec("Search finds a provisional root by letters", r.some(h => /root\//.test(h)), JSON.stringify(r.slice(0, 8)));
  r = await sq("2:255"); rec("Search finds an ayah by reference", r.some(h => /surah\/2\/ayah\/255/.test(h)), JSON.stringify(r.slice(0, 8)));
  r = await sq("و س م"); rec("A disputed root candidate is not searchable as a root", !r.some(h => /root\//.test(h)), JSON.stringify(r.slice(0, 8)));

  /* ---- Regression: the long coverage-summary banner (div.qm-demo-note from demoNote()) must never come back ---- */
  const BANNER_TEXT = /Setiap satu daripada|rekod analisis perkataan|Semua analisis bersifat sementara|Mengikut bacaan|Every one of the [\d,]+ words|word-analysis record|By reading:|generated by rules|dijana oleh peraturan|belum disemak oleh sarjana|not reviewed by a scholar|complete coverage|liputan lengkap|analisis perkataan lengkap|word analysis complete/i;
  const bannerProbe = () => page.evaluate(() => {
    const view = document.getElementById("qm-view");
    const tinted = [...view.querySelectorAll("*")].filter(e => getComputedStyle(e).backgroundColor === "rgb(251, 240, 218)" && !e.closest(".qm-beta-banner") && !e.classList.contains("qm-badge")).length;
    return { boxes: view.querySelectorAll(".qm-demo-note").length, notes: view.querySelectorAll(".qm-info-note").length, tinted, text: view.innerText };
  });
  for (const lang of ["en", "ms"]) {
    for (const hash of ["#/surah/1", "#/surah/2", "#/surah/114", "#/juz/1", "#/juz/30", "#/juz/1/surah/2", "#/surahs", "#/juz", "#/lemmas", "#/roots"]) {
      await go(hash, lang);
      const b = await bannerProbe();
      const noteOk = hash === "#/roots" ? b.notes === 1 : b.notes === 0;
      rec(`[${lang}] ${hash}: no coverage-summary banner (no .qm-demo-note, no tinted box, no banner wording)`, b.boxes === 0 && b.tinted === 0 && noteOk && !BANNER_TEXT.test(b.text), `boxes=${b.boxes} tinted=${b.tinted} notes=${b.notes} ${(b.text.match(BANNER_TEXT) || [""])[0]}`);
    }
    // the banner's own wording must not appear in any rendered surah, whatever its size
    const allSurah = await page.evaluate(() => QMData.listSurahs().map(x => x.number));
    let leaked = [];
    for (const n of allSurah.filter(n => n % 7 === 1 || n === 114)) { await page.goto(BASE + "#/surah/" + n); await page.waitForTimeout(60); const b = await bannerProbe(); if (b.boxes || b.tinted || BANNER_TEXT.test(b.text)) leaked.push(n); }
    rec(`[${lang}] sampled surahs (every 7th + 114): none shows the coverage-summary banner`, leaked.length === 0, leaked.join());
    // word panel: concise status labels, no explanatory card or repeated paragraphs
    for (const [cls, expect] of [["unresolved", lang === "en" ? /Unresolved/ : /Belum selesai/], ["context_dependent", lang === "en" ? /Context-dependent/ : /Bergantung pada konteks/]]) {
      const wid = await page.evaluate(c => { for (const a of QMData.listAyahsInSurah(2)) for (const x of a.tokens) if (x.resolution === c) return x.id; return null; }, cls);
      if (wid === null) continue;
      await go("#/word/" + wid, lang);
      const d = await page.evaluate(() => ({ t: document.getElementById("qm-detail-content").innerText, cards: document.querySelectorAll("#qm-detail-content [data-unresolved].qm-card, #qm-detail-content .qm-demo-note").length, ps: document.querySelectorAll("#qm-detail-content [data-unresolved] > p").length }));
      rec(`[${lang}] ${cls} word panel: status label kept, no explanatory card, at most one plain line`, expect.test(d.t) && d.cards === 0 && d.ps <= 1 && !BANNER_TEXT.test(d.t) && !/Source review needed|Semakan sumber diperlukan/.test(d.t), d.t.slice(0, 200).replace(/\n/g, " | "));
    }
  }

  /* ---- 360 px: no horizontal overflow on a Juz page ---- */
  await page.setViewportSize({ width: 360, height: 740 });
  await go("#/juz/30");
  rec("360 px: Juz page does not scroll sideways", await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1 && document.body.scrollWidth <= innerWidth + 1));
  rec("no console errors", errs.length === 0, JSON.stringify(errs.slice(0, 3)));

  await browser.close();
  console.log(`browser-juz-analysis: ${passed} passed, ${failed} failed`);
  process.exit(failed ? 1 : 0);
})();
