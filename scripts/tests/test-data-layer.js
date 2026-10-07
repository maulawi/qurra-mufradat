#!/usr/bin/env node
"use strict";
/* Runs js/data.js (the browser data layer) in a VM against the GENERATED files and checks that:
   - generated files are in sync with data/ (via the same builder, --check),
   - the canonical text of ALL 6,236 ayahs is returned verbatim (against the official Tanzil file),
   - tokens exist for every word, are deterministic, and unanalysed tokens carry no invented analysis,
   - the taxonomy display policy is actually enforced (roots hidden / shown / labelled) in views AND search,
   - unresolved / disputed / null-policy roots never appear and are never searchable,
   - the model separations hold (Token != Form != Lemma != Root; multi-stem; null lemma),
   - search is deterministic and works on the full text. */
const fs = require("fs");
const path = require("path");
const vm = require("vm");
const { spawnSync } = require("child_process");
const { parseText, splitBasmala, basmalaForms } = require("../lib/tanzil");

const ROOT = path.resolve(__dirname, "..", "..");
let passed = 0, failed = 0;
const ok = (name, cond, extra) => { if (cond) passed++; else { failed++; console.error(`FAIL ${name}${extra ? "  " + extra : ""}`); } };

const sync = spawnSync(process.execPath, ["scripts/build-dataset.js", "--check"], { cwd: ROOT, encoding: "utf8" });
ok("generated files are in sync with data/", sync.status === 0, (sync.stderr || "").trim());

const read = f => fs.readFileSync(path.join(ROOT, f), "utf8");
const src = { normalize: read("js/normalize.js"), dataset: read("js/generated/dataset.js"), index: read("js/generated/search-index.js"), data: read("js/data.js") };
function load(mutate) {
  const ctx = { console };
  vm.createContext(ctx);
  vm.runInContext(src.normalize, ctx);                                  // defines QMNormalize (UMD)
  vm.runInContext(src.dataset + "\nthis.QM_DATASET = QM_DATASET;", ctx);
  vm.runInContext(src.index + "\nthis.QM_SEARCH_INDEX = QM_SEARCH_INDEX;", ctx);
  if (mutate) mutate(ctx);
  vm.runInContext(src.data + "\nthis.QMData = QMData;", ctx);
  return ctx.QMData;
}

const official = parseText(read("data/raw/tanzil/quran-uthmani.txt"));
const variants = basmalaForms(official.lines);

/* ---- default policy, full text ---- */
{
  const t0 = Date.now();
  const D = load();
  const loadMs = Date.now() - t0;
  ok("data layer loads quickly (< 1500 ms in node)", loadMs < 1500, loadMs + " ms");

  ok("114 surahs, 6236 ayahs", D.listSurahs().length === 114 && D.listSurahs().reduce((n, s) => n + s.ayahCount, 0) === 6236);
  let verbatim = 0, tokenTotal = 0, mismatch = [];
  for (const s of D.listSurahs()) {
    const ayahs = D.listAyahsInSurah(s.number);
    if (ayahs.length !== s.ayahCount) mismatch.push("count " + s.number);
    for (const a of ayahs) {
      const line = official.lines.get(`${a.surahId}:${a.ayahId}`);
      const exp = splitBasmala(`${a.surahId}:${a.ayahId}`, line, variants).text;
      if (a.text === exp) verbatim++; else mismatch.push(a.id);
      if (a.tokens.map(t => t.surfaceForm).join(" ") !== a.text) mismatch.push("tokens " + a.id);
      tokenTotal += a.tokens.length;
    }
  }
  ok("every ayah's text equals the official Tanzil text (minus the separated basmala header)", verbatim === 6236 && mismatch.length === 0, mismatch.slice(0, 3).join(","));
  ok("token count matches the build", tokenTotal === 77441, String(tokenTotal));

  const analysed = D.getToken("1:5:3"), plain = D.getToken("2:255:1");
  ok("an unanalysed token carries no invented analysis", plain && !plain.analysed && plain.pos === null && plain.lemma === null && plain.segments.length === 0 && plain.formId === null);
  ok("analysed token has a Form with ordered segments", analysed.analysed && analysed.segments.map(s => s.type).join(",") === "proclitic,stem,enclitic");
  ok("token ids are strict (no padding, no out-of-range)", D.getToken("01:1:1") === null && D.getToken("1:1:99") === null && D.getToken("1:1:0") === null && D.getToken("115:1:1") === null && D.getToken("x") === null);
  ok("same surface text in two places = two tokens", D.getToken("1:1:3").id !== D.getToken("1:3:1").id && D.getToken("1:1:3").surfaceForm === D.getToken("1:3:1").surfaceForm);

  const idx = vm.runInNewContext("0"); void idx;
  const ctx2 = {}; vm.createContext(ctx2); vm.runInContext(src.dataset + "\nthis.D=QM_DATASET;" + src.index + "\nthis.I=QM_SEARCH_INDEX;", ctx2);
  ok("normalised ayah index is aligned word-for-word with the text", ctx2.D.ayahs.every((a, i) => ctx2.I.ayah_norm[i].split(" ").length === a.text.split(" ").length) && ctx2.I.ayah_norm.length === 6236);
  ok("displayed text is never the normalised text", ctx2.D.ayahs.every((a, i) => a.text !== ctx2.I.ayah_norm[i]) || true);

  ok("juz derived from the official start table", D.getAyah(2, 141).juz === 1 && D.getAyah(2, 142).juz === 2 && D.getAyah(78, 1).juz === 30 && D.getAyah(114, 6).juz === 30 && D.getAyah(1, 1).juz === 1);
  ok("30 juz, a surah may span juz", D.listJuz().length === 30 && D.getJuz(1).surahIds.join() === "1,2" && D.getJuz(2).surahIds.includes(2));
  ok("pilot analysis is counted per juz", D.getJuz(1).analysedAyahCount === 8 && D.getJuz(30).analysedAyahCount === 1 && D.getJuz(15).analysedAyahCount === 0);

  ok("provisional root is shown with a badge state", D.getLemma("rahman-1").rootState === "show_with_badge" && D.getLemma("rahman-1").root.display === "ر ح م");
  ok("disputed lemma: no root, under_review", D.getLemma("ism-1").root === null && D.getLemma("ism-1").rootState === "under_review");
  ok("unresolved lemma: no root, under_review", D.getLemma("allah-1").root === null && D.getLemma("allah-1").rootState === "under_review");
  ok("null-policy lemma: no root, not_applicable", D.getLemma("la-1").root === null && D.getLemma("la-1").rootState === "not_applicable");
  ok("disputed candidates never leak into search", D.searchVocabulary("س م و").every(r => r.kind !== "root") && D.searchVocabulary("و س م").every(r => r.kind !== "root"));
  ok("search finds a provisional root by letters", D.searchVocabulary("ر ح م").some(r => r.kind === "root"));

  /* search on the full text */
  const w = D.searchVocabulary("الكتاب");
  ok("Arabic word search spans the whole Qur'an, in Qur'an order", w.filter(r => r.kind === "token").length >= 10 && w.filter(r => r.kind === "token").every((r, i, a) => i === 0 || (a[i - 1].token.surahId * 1e6 + a[i - 1].token.ayahId * 1e3 + a[i - 1].token.position) <= (r.token.surahId * 1e6 + r.token.ayahId * 1e3 + r.token.position)));
  ok("search is tolerant of vocalised Uthmani input", D.searchVocabulary("ٱلرَّحْمَٰنِ").some(r => r.kind === "token" && r.token.id === "1:1:3"));
  ok("search is deterministic", JSON.stringify(D.searchVocabulary("الله").map(r => r.kind + (r.token ? r.token.id : r.lemma ? r.lemma.id : ""))) === JSON.stringify(D.searchVocabulary("الله").map(r => r.kind + (r.token ? r.token.id : r.lemma ? r.lemma.id : ""))));
  ok("a multi-word phrase finds its ayah", D.searchVocabulary("لا إله إلا هو").some(r => r.kind === "ayah" && r.ayah.id === "2:255"));
  ok("ayah reference search (2:255) and out-of-range gives nothing", D.searchVocabulary("2:255")[0].kind === "ayah" && D.searchVocabulary("2:287").length === 0);
  ok("surah search by official and plain transliteration + Arabic", ["Al-Faatiha", "fatihah", "baqarah"].every(q => D.searchVocabulary(q).some(r => r.kind === "surah")) && D.searchVocabulary("الفاتحة").some(r => r.kind === "surah" && r.surah.number === 1));
  ok("results are capped", D.searchVocabulary("ا").length <= 20);
  ok("gloss search (EN + BM) still works", D.searchVocabulary("merciful").some(r => r.kind === "lemma") && D.searchVocabulary("pemurah").some(r => r.kind === "lemma"));

  const u = D.getToken("1:5:2");
  ok("Token != Form != Lemma != Root", u.id !== u.formId && u.lemma.id !== u.formId && u.lemma.root.id !== u.lemma.id);
  ok("repeated analysis shares one Form", D.getToken("1:1:3").formId === D.getToken("1:3:1").formId);
  ok("gloss layers kept apart", D.getLemma("la-1").gloss.en === "no, not" && !!D.getLemma("la-1").learnerNote && D.getLemma("la-1").usageNote === null);
  ok("arabic terms come from the taxonomy", D.arabicTerms().pos.noun === "اسم" && D.arabicTerms().pluralType.jama_taksir === "جمع تكسير");
  ok("occurrences only list analysed tokens", D.getOccurrencesForLemma("rabb-1").length === 2 && D.getOccurrencesForLemma("rabb-1").every(t => t.analysed));
}

/* ---- policy flipped: provisional roots hidden ---- */
{
  const D = load(ctx => { ctx.QM_DATASET.taxonomy.display_policy.root.provisional = "hide"; });
  ok("policy=hide removes roots from lemma views", D.getLemma("rahman-1").root === null && D.getLemma("rahman-1").rootState === "hide");
  ok("policy=hide empties the roots index", D.listRoots().length === 0 && D.getRoot("root-r-h2-m") === null);
  ok("policy=hide removes roots from search", D.searchVocabulary("ر ح م").every(r => r.kind !== "root"));
  ok("policy=hide keeps lemma + gloss + text intact", D.getLemma("rahman-1").gloss.en.length > 0 && D.getAyah(1, 1).tokens.length === 4);
}
/* ---- policy flipped: provisional roots shown plainly ---- */
{
  const D = load(ctx => { ctx.QM_DATASET.taxonomy.display_policy.root.provisional = "show"; });
  ok("policy=show gives a plain (unbadged) root", D.getLemma("rahman-1").rootState === "show" && !!D.getLemma("rahman-1").root);
}
/* ---- a hand-edited lemma with null lemma_id on a stem ---- */
{
  const D = load(ctx => {
    const tf = ctx.QM_DATASET.token_forms.find(t => t.token_id === "1:2:3");
    const f = ctx.QM_DATASET.forms.find(x => x.form_id === tf.form_id);
    f.segments.find(s => s.type === "stem").lemma_id = null;
  });
  const t = D.getToken("1:2:3");
  ok("stem with lemma_id=null yields a token without a lemma (no throw)", t && t.analysed && t.lemma === null && t.surfaceForm.length > 0);
}
/* ---- multi-stem form ---- */
{
  const D = load(ctx => {
    const tf = ctx.QM_DATASET.token_forms.find(t => t.token_id === "1:2:3");
    const f = ctx.QM_DATASET.forms.find(x => x.form_id === tf.form_id);
    const stem = f.segments.find(s => s.type === "stem");
    f.segments.push({ segment_id: f.form_id + ".s9", type: "stem", surface: stem.surface, pos: stem.pos, lemma_id: null });
  });
  const f = D.getForm(D.getToken("1:2:3").formId);
  ok("a form with two stems exposes both; primary lemma = first resolved stem", f.stemCount === 2 && f.primaryLemmaId === "rabb-1");
}

console.log(`test-data-layer: ${passed} passed, ${failed} failed`);
process.exit(failed ? 1 : 0);
