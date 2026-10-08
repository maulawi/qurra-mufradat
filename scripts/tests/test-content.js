#!/usr/bin/env node
"use strict";
/* Tests for the V1 content layer: licensing gate, ayah alignment, token alignment, translation editions,
   coverage calculation, search indexing and missing/unresolved handling. Alignment tests use SYNTHETIC records. */
const fs = require("fs");
const path = require("path");
const { loadDataset } = require("../lib/load-data");
const { validate } = require("../lib/validate");
const { alignAyahs } = require("../lib/ayah-alignment");
const { alignTokens } = require("../lib/token-alignment");
const { computeCoverage } = require("../report/coverage");
const { parse } = require("../import/import-pickthall");

const ROOT = path.resolve(__dirname, "..", "..");
const base = loadDataset(ROOT);
let passed = 0, failed = 0;
const ok = (name, cond, extra) => { if (cond) passed++; else { failed++; console.error(`FAIL ${name}${extra ? "  " + extra : ""}`); } };
const BIG = new Set(["ayahs", "tokens"]);
// Large read-only parts that no test mutates are shared instead of deep-cloned (keeps memory low; deep-cloning them dozens of times made the suites fail intermittently on a memory-constrained machine).
const SHARED = new Set(["effectiveTokenForms", "tagMaps", "alignments"]);
const clone = () => {
  const c = { ...base };
  for (const k of Object.keys(base)) {
    if (k === "_files" || typeof base[k] === "string") continue;
    c[k] = BIG.has(k) ? base[k].map(x => ({ ...x })) : SHARED.has(k) ? base[k] : structuredClone(base[k]);
  }
  return c;
};
function check(name, ds, expect) {
  const { errors } = validate(ds);
  const good = expect === null ? errors.length === 0 : errors.some(e => expect.test(e));
  ok(name, good, expect === null ? errors.slice(0, 3).join(" | ") : `expected ${expect}; got ${errors.slice(0, 3).join(" | ") || "(none)"}`);
}
const src = (ds, id) => ds.sources.find(s => s.source_id === id);
const edition = (ds, id) => ds.translationEditions.find(e => e.translation_id === id);

/* ---------- 1. the real data passes ---------- */
check("the real dataset validates", base, null);

/* ---------- 2. licensing gate ---------- */
{ const ds = clone(); delete src(ds, "PICKTHALL_EN_1930").gate; check("a source without a gate record is rejected", ds, /missing gate record/); }
{ const ds = clone(); src(ds, "PICKTHALL_EN_1930").clearance = undefined; check("a source without clearance is rejected", ds, /clearance "undefined"/); }
{ const ds = clone(); src(ds, "PICKTHALL_EN_1930").licence_url = ""; src(ds, "PICKTHALL_EN_1930").url = ""; check("CLEAR without a licence URL is rejected", ds, /CLEAR without a licence_url/); }
{ const ds = clone(); src(ds, "PICKTHALL_EN_1930").licence = ""; check("CLEAR without licence text is rejected", ds, /CLEAR without licence text/); }
{ const ds = clone(); src(ds, "PICKTHALL_EN_1930").gate.reason = ""; check("an empty gate field is rejected", ds, /gate\.reason is missing or empty/); }
{ const ds = clone(); src(ds, "QURANENC_EN").in_use = true; check("a CONDITIONAL source cannot be in use", ds, /CONDITIONAL but in_use is not false/); }
{ const ds = clone(); src(ds, "BASMEIH_MS").gate.decision = "USE"; check("a NOT_CLEARED source cannot have decision USE", ds, /NOT_CLEARED but gate\.decision is USE/); }
{ const ds = clone(); src(ds, "PICKTHALL_EN_1930").gate.decision = "DO_NOT_USE"; check("a CLEAR source whose decision is not USE is rejected", ds, /CLEAR but gate\.decision/); }
{
  ok("every registered source has a clearance and a complete gate", base.sources.every(s => s.clearance && s.gate && s.gate.decision && s.gate.reason));
  ok("no uncleared source is in use", base.sources.every(s => s.clearance === "CLEAR" || s.in_use === false));
  ok("QAC is NOT_CLEARED and unused", src(base, "QAC").clearance === "NOT_CLEARED" && src(base, "QAC").in_use === false);
  ok("no Malay translation source is cleared", base.sources.filter(s => /MS|BASMEIH/.test(s.source_id) && s.type === "translation").every(s => s.clearance !== "CLEAR"));
}

/* ---------- 3. translation editions ---------- */
{ const ds = clone(); edition(ds, "en-pickthall-1930").source_id = "BASMEIH_MS"; check("an edition whose source is not cleared is rejected", ds, /is not CLEAR \/ in_use/); }
{ const ds = clone(); edition(ds, "en-pickthall-1930").language = "fr"; check("an edition with an unknown language is rejected", ds, /language "fr"/); }
{ const ds = clone(); ds.translationEditions.push({ ...edition(ds, "en-pickthall-1930") }); check("a duplicate translation_id is rejected", ds, /duplicate translation_id/); }
{ const ds = clone(); const r = ds.translationTexts["en-pickthall-1930"].records; r.push({ ayah_id: r[0].ayah_id, text: "again" }); check("a duplicate ayah translation is rejected", ds, /duplicate translation for 1:1/); }
{ const ds = clone(); ds.translationTexts["en-pickthall-1930"].records[0].ayah_id = "999:1"; check("a translation for a non-existent ayah is rejected", ds, /ayah_id "999:1" does not exist/); }
{ const ds = clone(); ds.translationTexts["en-pickthall-1930"].records[0].text = ""; check("an empty translation is rejected", ds, /text is empty/); }
{ const ds = clone(); ds.translationTexts["en-pickthall-1930"].records[0].text = "x Project Gutenberg y"; check("provider trademark wording in text is rejected", ds, /trademark/); }
{ const ds = clone(); const f = ds.translationTexts["en-pickthall-1930"]; f.records.push({ ayah_id: "17:32", text: "guess" }); check("an ayah the alignment report calls unresolved cannot carry text", ds, /unresolved in the alignment report but has text/); }
{ const ds = clone(); const f = ds.translationTexts["en-pickthall-1930"]; f.records = f.records.filter(r => r.ayah_id !== "2:255"); check("a full edition missing an ayah that is not reported unresolved is rejected", ds, /no text for 2:255/); }
{ const ds = clone(); edition(ds, "en-qurra-working").published = true; edition(ds, "en-qurra-working").status = "draft"; check("a draft edition cannot be published", ds, /published edition must be CLEAR and not draft/); }
{
  const rep = base.translationReports["en-pickthall-1930"];
  ok("Pickthall: 6228 ayahs with text, 8 unresolved, every other ayah present", base.translationTexts["en-pickthall-1930"].records.length === 6228 && rep.unresolved_ayahs.length === 8);
  ok("Pickthall raw SHA-256 is recorded", /^[0-9a-f]{64}$/.test(rep.source_sha256));
  const m = new Map(base.translationTexts["en-pickthall-1930"].records.map(r => [r.ayah_id, r.text]));
  ok("1:1 is the Pickthall wording, verbatim", m.get("1:1") === "In the name of Allah, the Beneficent, the Merciful.");
  ok("no Pickthall text contains a line break or doubled space", [...m.values()].every(t => !/\n|  /.test(t)));
  ok("no basmala header or surah heading leaked into a translation", [...m.values()].every(t => !/Total Verses|Chapter \d/.test(t)));
}

/* ---------- 4. ayah alignment (synthetic) ---------- */
{
  const q = [{ ayah_id: "1:1", surah: 1, ayah: 1, text: "بِسْمِ" }, { ayah_id: "1:2", surah: 1, ayah: 2, text: "ٱلْحَمْدُ" }, { ayah_id: "2:1", surah: 2, ayah: 1, text: "الم" }];
  let r = alignAyahs([{ ref: "a", surah: 1, ayah: 1 }, { ref: "b", surah: 1, ayah: 2 }, { ref: "c", surah: 2, ayah: 1 }], q);
  ok("alignment: all exact", r.summary.exact === 3 && r.unresolved_ayahs.length === 0);
  r = alignAyahs([{ ref: "a", surah: 1, ayah: 1 }, { ref: "z", surah: 9, ayah: 9 }], q);
  ok("alignment: missing ayahs are listed, not invented", r.missing.join() === "1:2,2:1" && r.unresolved_ayahs.length === 2);
  ok("alignment: an extra source ayah is listed and not aligned", r.extra.length === 1 && r.extra[0].ayah_id === "9:9");
  r = alignAyahs([{ ref: "a", surah: 1, ayah: 1 }, { ref: "a2", surah: 1, ayah: 1 }, { ref: "b", surah: 1, ayah: 2 }, { ref: "c", surah: 2, ayah: 1 }], q);
  ok("alignment: a duplicate is unresolved (never first-wins or last-wins)", r.duplicates.length === 1 && r.unresolved_ayahs.join() === "1:1" && !r.exact.includes("1:1"));
  r = alignAyahs([{ ref: "a", surah: 1, ayah: 1, entries: 2 }, { ref: "b", surah: 1, ayah: 2 }, { ref: "c", surah: 2, ayah: 1 }], q);
  ok("alignment: a merged-verse entry is a numbering mismatch and unresolved", r.numbering_mismatch.length === 1 && r.unresolved_ayahs.join() === "1:1");
  r = alignAyahs([{ ref: "a", surah: 1, ayah: 1 }, { ref: "b", surah: 1, ayah: 2 }, { ref: "c", surah: 2, ayah: 1 }], q, { declaredCounts: { 1: 7, 2: 1 }, basmalaHeaders: [1] });
  ok("alignment: a surah-length disagreement is reported", r.count_mismatch.length === 1 && r.count_mismatch[0].surah === 1);
  ok("alignment: a basmala header is recorded and never attached to an ayah", r.basmala.attached_to_ayahs === 0 && r.basmala.source_header_surahs.join() === "1");
  r = alignAyahs([{ ref: "a", surah: 1, ayah: 1, arabic: "بسم" }, { ref: "b", surah: 1, ayah: 2, arabic: "الحمد" }, { ref: "c", surah: 2, ayah: 1, arabic: "الم" }], q);
  ok("alignment: Arabic that differs only after normalisation is reported but accepted", r.normalization.some(x => x.ayah_id === "1:2" && x.kind === "normalized_equal") && r.exact.includes("1:2"));
  r = alignAyahs([{ ref: "a", surah: 1, ayah: 1, arabic: "xyz" }, { ref: "b", surah: 1, ayah: 2 }, { ref: "c", surah: 2, ayah: 1 }], q);
  ok("alignment: different Arabic is unresolved", r.unresolved_ayahs.join() === "1:1");
}

/* ---------- 5. e-text parser: merged and duplicate numbering ---------- */
{
  const text = [" Chapter 1:", " Total Verses: 3", "", "001.001", "Y: a", "", "P: one", "  wrapped", "", "S: x", "-----------------------------------------------------",
    "001.002", "P: two", "P: three", "-----------------------------------------------------", "001.003", "P: four", "-----------------------------------------------------"].join("\n");
  const { records, declared } = parse(text);
  ok("parser: wrapped lines are joined with one space", records[0].text === "one wrapped");
  ok("parser: two P entries under one number are counted, not overwritten", records[1].entries === 2);
  ok("parser: declared verse count is read", declared[1] === 3);
  ok("parser: the other translators' columns are ignored", !records.some(r => /[ax]$/.test(r.text) && r.text === "a"));
}

/* ---------- 6. token alignment (synthetic) ---------- */
{
  const toks = [{ token_id: "1:1:1", ayah_id: "1:1", position: 1, text: "بِسْمِ" }, { token_id: "1:1:2", ayah_id: "1:1", position: 2, text: "ٱللَّهِ" }, { token_id: "1:1:3", ayah_id: "1:1", position: 3, text: "ٱلرَّحْمَٰنِ" }];
  const rec = (p, text) => ({ ref: "s" + p, surah: 1, ayah: 1, position: p, text });
  let r = alignTokens([rec(1, "بِسْمِ"), rec(2, "ٱللَّهِ"), rec(3, "ٱلرَّحْمَٰنِ")], toks);
  ok("tokens: exact match", r.summary.by_kind.exact === 3 && r.summary.unresolved === 0 && r.unmatched_qurra.length === 0);
  r = alignTokens([rec(1, "بسم")], toks);
  ok("tokens: a marks-stripped form is aligned as normalized, flagged by kind", r.records[0].kind === "normalized" && r.records[0].alignment_status === "aligned");
  r = alignTokens([rec(1, "بِسْمِ ٱللَّهِ")], toks);
  ok("tokens: one source word spelling two tokens is one_to_many", r.records[0].kind === "one_to_many" && r.records[0].token_ids.length === 2);
  r = alignTokens([rec(1, "بِ"), rec(1, "سْمِ")], toks);
  ok("tokens: two source parts forming one token are many_to_one", r.records.every(x => x.kind === "many_to_one"));
  r = alignTokens([rec(1, "غير")], toks);
  ok("tokens: a disagreeing word is unresolved, never forced", r.records[0].alignment_status === "unresolved" && r.unmatched_source.length === 1);
  r = alignTokens([rec(9, "بِسْمِ")], toks);
  ok("tokens: a position beyond the ayah is unresolved", r.records[0].alignment_status === "unresolved" && /out_of_range/.test(r.records[0].detail));
  r = alignTokens([{ ref: "x", surah: 99, ayah: 1, position: 1, text: "بسم" }], toks);
  ok("tokens: an unknown ayah is unresolved", r.records[0].detail.startsWith("no_such_ayah"));
  r = alignTokens([rec(1, "بِسْمِ")], toks);
  ok("tokens: QURRA tokens the source did not cover are listed as unmatched", r.unmatched_qurra.join() === "1:1:2,1:1:3");
  r = alignTokens([rec(1, "بِ"), rec(1, "x")], toks);
  ok("tokens: several records that do not form the token are an unresolved clash", r.records.every(x => x.alignment_status === "unresolved"));
}

/* ---------- 7. coverage and missing/unresolved handling ---------- */
{
  const c = computeCoverage(base);
  ok("coverage: 6236 ayahs, 77441 tokens", c.ayahs.total === 6236 && c.tokens.total === 77441);
  ok("coverage: English published = 6228, Malay published = 0 (no cleared Malay translation)", c.ayahs.en_translation === 6228 && c.ayahs.ms_translation === 0);
  ok("coverage: working renderings are not counted as translations", c.ayahs.en_working === 9 && c.ayahs.ms_working === 9);
  ok("coverage: the 91 pilot tokens keep their own analysis; no token is source-derived; the rest are QURRA rule defaults", c.tokens.from_pilot === 91 && c.chosen_analysis_origin.source_derived === 0 && c.tokens.with_form === c.tokens.from_pilot + c.tokens.from_rule_default && c.tokens.from_rule_default > 0);
  ok("coverage: a token counts as complete only with form, lemma, POS, both meanings, morphology and a root or no-root-applies", c.tokens.complete <= c.tokens.with_form && c.tokens.complete <= c.tokens.with_en_gloss && c.tokens.complete <= c.tokens.with_ms_gloss);
  ok("coverage: tokens with a root + tokens where none applies never exceed tokens with a lemma", c.tokens.with_root + c.tokens.root_not_applicable <= c.tokens.with_lemma);
  ok("coverage: Juz rows add up to every token", c.by_juz.length === 30 && c.by_juz.reduce((n, j) => n + j.tokens, 0) === c.tokens.total && c.by_juz.reduce((n, j) => n + j.analysed, 0) === c.tokens.with_form);
  ok("coverage: roots counted only when the display policy shows them", c.tokens.with_root < c.tokens.with_lemma && c.unique_roots_shown <= c.roots_total);
  const ds = clone(); ds.translationEditions = ds.translationEditions.filter(e => e.language !== "ms"); delete ds.translationTexts["ms-qurra-working"];
  ok("coverage: an edition removed -> its figures go to zero, nothing breaks", computeCoverage(ds).ayahs.ms_working === 0);
  ok("coverage: sources by clearance add up", Object.values(c.sources.by_clearance).reduce((a, b) => a + b, 0) === c.sources.total);
}

/* ---------- 8. search indexing (generated files) ---------- */
{
  const gen = f => fs.readFileSync(path.join(ROOT, "js", "generated", f), "utf8");
  const vm = require("vm");
  const load = (f, name) => { const ctx = {}; vm.runInNewContext(gen(f) + `\nthis.__v = ${name};`, ctx); return ctx.__v; };
  const T = load("translations.js", "QM_TRANSLATIONS"), IDX = load("search-index.js", "QM_SEARCH_INDEX"), D = load("dataset.js", "QM_DATASET");
  ok("translations.js carries exactly the registered editions", Object.keys(T.texts).sort().join() === D.translation_editions.map(e => e.translation_id).sort().join());
  ok("translations.js holds 6228 Pickthall ayahs and none of the 8 unresolved", Object.keys(T.texts["en-pickthall-1930"]).length === 6228 && !("17:32" in T.texts["en-pickthall-1930"]));
  ok("dataset.js has no translation text (it is in translations.js)", !JSON.stringify(D).includes("In the name of Allah, the Beneficent, the Merciful."));
  const unresolvedRootIds = new Set(base.lemmas.filter(l => ["unresolved", "disputed", "null_policy"].includes(l.root.status)).map(l => l.root.root_id).filter(Boolean));
  ok("no unresolved/disputed root is in the search index", !IDX.ar.some(([, kind, id]) => kind === "root" && unresolvedRootIds.has(id)) && !IDX.latin_text.some(([, kind, id]) => kind === "root" && unresolvedRootIds.has(id)));
  ok("only glosses the display policy shows are searchable", IDX.latin_text.filter(x => x[1] === "lemma").length <= base.glosses.length * 2);
  ok("generated files carry the Tanzil notice; translations.js carries the Pickthall credit", /Tanzil/.test(gen("dataset.js")) && /Pickthall/.test(gen("translations.js")) && !/Project Gutenberg/i.test(gen("translations.js")));
  ok("the working editions are not published", D.translation_editions.filter(e => !e.published).every(e => /working/.test(e.translation_id)));
}

console.log(`test-content: ${passed} passed, ${failed} failed`);
process.exit(failed ? 1 : 0);
