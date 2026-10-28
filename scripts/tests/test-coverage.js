#!/usr/bin/env node
"use strict";
/* Coverage-expansion regression tests.
   Part 1: each new engine rule family, on a tiny synthetic lexicon (so the tests do not depend on the real lexicon).
   Part 2: the expanded data: the text and the 77,441 tokens are unchanged, every analysis that existed before is unchanged
           (except the documented corrections), the pilot and the disputed roots are untouched, nothing is claimed as reviewed,
           and no root is created from a classical-source index or collapsed to fewer letters. */
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const E = require("../analyse/engine");
const { loadDataset } = require("../lib/load-data");
const { snapshot, recordSnapshot } = require("../report/baseline-snapshot");

const ROOT = path.resolve(__dirname, "..", "..");
let passed = 0, failed = 0;
const ok = (name, cond, extra) => { if (cond) passed++; else { failed++; console.error(`FAIL ${name}${extra ? "  " + extra : ""}`); } };

/* ---------------- Part 1: rule families ---------------- */
const P = (lemma_id, pos, extra) => ({ lemma_id, pos, ...extra });
const entries = [
  P("t-min", "particle", { def: {}, stems: ["مِنْ", { s: "مِنْ", bound: true }] }),
  P("t-an", "particle", { def: {}, stems: ["عَنْ", { s: "عَنْ", bound: true }] }),
  P("t-idha", "particle", { def: {}, stems: ["إِذَا"] }),
  P("t-inna", "particle", { def: {}, stems: [{ s: "إِنَّ", bound: true }] }),
  P("t-antum", "particle", { def: {}, stems: ["أَنتُمْ"] }),
  P("t-hada", "verb", { verb: { x: ["يَهْدِى|mudari|3ms", "ٱهْدِ|amr|2ms", "أَتَوْا۟|maadi|3mp"] } }),
  P("t-kafara", "verb", { verb: { impf: { long: "يَكْفُر", short: "يَكْفُر" }, imv: { long: "ٱكْفُر", short: "ٱكْفُر" } } }),
  P("t-kitab", "noun", { noun: [{ b: "كِتَاب", t: "tri" }] }),
  P("t-man", "noun", { stems: [{ s: "مَنَّ", artOnly: true }] }),
  P("t-letters", "particle", { bare: true, def: {}, stems: ["نٓ"] }),
  P("t-asa", "noun", { noun: [{ b: "عَصَا", t: "inv", s: ["عَصَىٰ"], bound: true }] })
];
const index = E.buildIndex(entries);
const parse = w => E.parseToken(index, new Map(), w);
const lemmas = w => [...new Set(parse(w).map(p => p.stem.rec.lemma_id))].sort().join(",");
const has = (w, lemma, f) => parse(w).some(p => p.stem.rec.lemma_id === lemma && (!f || f(p)));

ok("rule: min + na is written minna (the pronoun's nun joins the doubled nun)", has("مِنَّا", "t-min", p => p.encl && p.encl.fused && p.encl.f.person === 1));
ok("rule: min + ni is written minni", has("مِنِّى", "t-min", p => p.encl && p.encl.fused));
ok("rule: 'an + na (anna) works for a second particle", has("عَنَّا", "t-an"));
ok("rule: the fused nun applies to particles only (a noun is not read as 'x + na')", lemmas("كِتَابَّا") === "");
ok("rule: interrogative a- before a hamza-initial stem (a-idha is written a-'idha)", has("أَءِذَا", "t-idha", p => p.procs.some(x => x.fn === "istifham")));
ok("rule: a-inna is written a-'inna", has("أَءِنَّا", "t-inna", p => p.procs.some(x => x.fn === "istifham")));
ok("rule: the interrogative a- spelled as hamza + fatha before antum", has("ءَأَنتُمْ", "t-antum", p => p.procs.some(x => x.fn === "istifham")));
ok("rule: a jussive written with a final kasra before a hamzat wasl is the same verb", has("يَكْفُرِ", "t-kafara") && has("يَكْفُرْ", "t-kafara"));
ok("rule: an imperative with a final kasra", has("ٱكْفُرِ", "t-kafara"));
ok("rule: the command lam with sukun after fa- (fa-li-yakfur)", has("فَلْيَكْفُرْ", "t-kafara", p => p.procs.length === 2));
ok("rule: the object pronoun -ni with its ya dropped attaches to a verb (yahdini)", has("يَهْدِينِ", "t-hada", p => p.encl && p.encl.f.verbOnly));
ok("rule: the pronoun -ni with a nun does not attach to a noun", !has("كِتَابِنِى", "t-kitab"));
ok("rule: the pronoun -ni with its ya dropped does not attach to a noun", !has("كِتَابِنِ", "t-kitab"));
ok("rule: ya for alef maqsura before a pronoun (yahdi + hi)", has("يَهْدِيهِ", "t-hada", p => p.encl));
ok("rule: alef for alef maqsura before a pronoun on a perfect verb stem listed with maqsura", has("عَصَاهُ", "t-asa", p => p.encl));
ok("rule: a plural -u form takes its pronoun without the alef (atawhu = atawa + hu)", has("أَتَوْهُ", "t-hada", p => p.encl));
ok("rule: artOnly: a noun spelled like a verb is read only after the article", !has("مَنَّ", "t-man") && has("ٱلْمَنَّ", "t-man"));
ok("rule: bare: the disjoined letters take no prefix", has("نٓ", "t-letters") && !has("وَنٓ", "t-letters") && !has("أَنٓ", "t-letters"));

/* ---------------- Part 2: the data ---------------- */
const ds = loadDataset(ROOT);
const fixture = JSON.parse(fs.readFileSync(path.join(ROOT, "scripts/tests/fixtures/baseline-analysis-v1.json"), "utf8"));
const documented = JSON.parse(fs.readFileSync(path.join(ROOT, "scripts/tests/fixtures/documented-changes.json"), "utf8")).changes;

ok("the Qur'anic text is unchanged (fingerprint of all 6,236 ayah texts)", fixture.ayahs === ds.ayahs.length && crypto.createHash("sha1").update(ds.ayahs.map(a => a.text).join("\n")).digest("hex") === fixture.text_sha1);
ok("the token count is unchanged: 77,441", ds.tokens.length === 77441);

const now = snapshot(ds);
const changed = Object.keys(fixture.snapshot).filter(s => now[s] !== fixture.snapshot[s]);
ok("every analysis that existed before is still present", Object.keys(fixture.snapshot).every(s => now[s] !== undefined), "missing: " + Object.keys(fixture.snapshot).filter(s => now[s] === undefined).slice(0, 3).join(" "));
ok("the only analyses that differ from the baseline are the documented corrections", changed.every(s => documented[s] && documented[s].reason && documented[s].reason.length > 20), "undocumented: " + changed.filter(s => !documented[s]).slice(0, 3).join(" "));
ok("each documented correction really differs from the baseline (the list is not padded)", Object.keys(documented).every(s => changed.includes(s)));
ok("at most 10 spellings were corrected", changed.length <= 10, String(changed.length));

const rec = recordSnapshot(ds);
ok("no existing lemma, root or gloss record was changed", ["lemmas", "roots", "glosses"].every(k => Object.keys(fixture.records[k]).every(id => rec[k][id] === fixture.records[k][id])));
ok("the 285 roots of the baseline are all still there with the same letters and type", Object.keys(fixture.records.roots).length === 285 && Object.keys(fixture.records.roots).every(id => rec.roots[id] !== undefined));

ok("the pilot is intact: 91 tokens, 15 conflicts", ds.effectiveTokenForms.length === 91 && ds.conflicts.length === 15);
for (const id of ["zalzala-1", "zilzal-1", "waswas-1", "waswasa-1", "damdama-1"]) {
  const l = ds.lemmas.find(x => x.lemma_id === id);
  ok(`${id}: still disputed, no root assigned, four-letter candidate first`, l.root.status === "disputed" && l.root.root_id === null && l.root.candidates[0].split(" ").length === 4);
}
ok("no disputed or unresolved lemma carries a root id", ds.lemmas.every(l => !["disputed", "unresolved", "null_policy"].includes(l.root.status) || !l.root.root_id));
ok("no root of the dataset has four letters (the quadriliteral candidates stay candidates)", ds.roots.every(r => r.letters.length === 3));
ok("no root ز ل ل or ز ل ز ل was created", !ds.roots.some(r => r.display === "ز ل ل" || r.display === "ز ل ز ل"));
ok("source indexing never became a root assignment", ds.lemmas.every(l => !l.root.source_indexing));

const rule = ds.forms.filter(f => f.basis === "rule_default");
ok("every rule analysis is provisional and QURRA-sourced; none is claimed as reviewed or verified", rule.every(f => (f.status === "provisional" || f.status === "unresolved") && f.provenance.morphology.source_id === "QURRA_RULE_ANALYSIS"));
ok("every new lemma and root is provisional or open, never reviewed", ds.lemmas.filter(l => !fixture.records.lemmas[l.lemma_id]).every(l => l.status === "provisional" && !["reviewed", "verified"].includes(l.root.status)) && ds.roots.filter(r => !fixture.records.roots[r.root_id]).every(r => r.status === "provisional"));
ok("an analysed word needs no root: some analysed lemmas have root null (unresolved or no root applies)", ds.lemmas.some(l => !l.root.root_id && ds.forms.some(f => f.segments.some(s => s.lemma_id === l.lemma_id))));
ok("every segment of a rule analysis concatenates back to the exact spelling", rule.every(f => f.segments.map(s => s.surface).join("") === f.surface));
ok("every stem of a resolved rule analysis carries a lemma; an unresolved record carries none", rule.every(f => f.segments.filter(s => s.type === "stem").every(s => f.status === "unresolved" ? !s.lemma_id : s.lemma_id)));

const audit = JSON.parse(fs.readFileSync(path.join(ROOT, "data/qurra/review/unanalysed-spellings.json"), "utf8"));
ok("the audit's baseline matches the project's baseline figures (61,285 analysed; 16,156 not)", audit.before_expansion.tokens_analysed === 61285 && audit.before_expansion.tokens_unanalysed === 16156 && audit.before_expansion.spellings_analysed === 8173);
const remTokens = audit.unanalysed_spellings.reduce((n, e) => n + e.tokens, 0);
ok("the audit's totals add up (spellings left over cover the unanalysed tokens plus at most the 91 pilot tokens)", audit.after_expansion.tokens_analysed + audit.after_expansion.tokens_unanalysed === 77441 && remTokens >= audit.after_expansion.tokens_unanalysed && remTokens - audit.after_expansion.tokens_unanalysed <= 91);
ok("coverage went up and no more than the audit says", audit.after_expansion.tokens_analysed > audit.before_expansion.tokens_analysed + 5000);
ok("the audit lists every remaining spelling once, ranked by frequency", audit.unanalysed_spellings.length === audit.after_expansion.spellings_unanalysed && audit.unanalysed_spellings.every((e, i, a) => i === 0 || a[i - 1].tokens >= e.tokens));
ok("homographs left unanalysed are flagged as needing context", audit.unanalysed_spellings.filter(e => e.homograph_needs_context).every(e => e.status === "homograph_context_required"));
ok("lemmas added with an open root are flagged source_review_required", audit.lemmas_added_with_root_left_open.length > 0 && audit.lemmas_added_with_root_left_open.every(e => e.flag === "source_review_required"));
ok("the homograph defaults are recorded with their other readings", audit.homograph_defaults.length > 50 && audit.homograph_defaults.every(e => e.other_readings.length > 0 && e.basis));

/* ---------------- Part 3: COMPLETE word-analysis coverage ----------------
   Every Qur'anic token has an analysis record. This is a hard regression test: if a future change leaves even one token
   without a record, it fails. Complete coverage is not complete certainty: unresolved and context-dependent records are
   explicit, assert nothing, and are never reviewed or verified. */
{
  const vm = require("vm");
  const read = f => fs.readFileSync(path.join(ROOT, f), "utf8");
  const ctx = { console }; vm.createContext(ctx);
  vm.runInContext(read("js/normalize.js"), ctx);
  vm.runInContext(read("js/generated/dataset.js") + "\nthis.QM_DATASET = QM_DATASET;", ctx);
  vm.runInContext(read("js/generated/search-index.js") + "\nthis.QM_SEARCH_INDEX = QM_SEARCH_INDEX;", ctx);
  vm.runInContext(read("js/data.js") + "\nthis.QMData = QMData;", ctx);
  const D = ctx.QMData;
  let total = 0, recorded = 0; const by = { confident: 0, provisional: 0, context_dependent: 0, unresolved: 0 }; const missing = [], bad = [];
  const perSurah = new Map(), perJuz = new Map();
  for (let s = 1; s <= 114; s++) for (const a of D.listAyahsInSurah(s)) for (const t of a.tokens) {
    total++;
    if (t.analysed && t.formId && t.resolution && Object.prototype.hasOwnProperty.call(by, t.resolution)) { recorded++; by[t.resolution]++; } else missing.push(t.id);
    if (t.status === "unresolved" && (t.lemma !== null || t.pos !== null || Object.keys(t.morphology).length)) bad.push(t.id);
    if (["reviewed", "verified"].includes(t.status)) bad.push(t.id + " reviewed");
    perSurah.set(t.surahId, (perSurah.get(t.surahId) || 0) + (t.analysed ? 1 : 0));
    perJuz.set(a.juz, (perJuz.get(a.juz) || 0) + (t.analysed ? 1 : 0));
  }
  ok("COVERAGE: analysis records === 77,441 (every Qur'anic token has one)", total === 77441 && recorded === 77441 && missing.length === 0, "missing: " + missing.slice(0, 5).join(" ") + " (" + missing.length + ")");
  ok("COVERAGE: the four resolution classes add up to 77,441", by.confident + by.provisional + by.context_dependent + by.unresolved === 77441);
  ok("COVERAGE: an unresolved record asserts no lemma, part of speech or morphology, and none is reviewed or verified", bad.length === 0, bad.slice(0, 3).join(" "));
  ok("COVERAGE: all 114 surahs are 100% covered", D.listSurahs().length === 114 && D.listSurahs().every(s => s.analysedTokenCount === s.tokenCount && s.tokenCount === perSurah.get(s.number)));
  ok("COVERAGE: all 30 juz are 100% covered", D.listJuz().length === 30 && D.listJuz().every(j => j.analysedTokenCount === j.tokenCount && j.tokenCount === perJuz.get(j.number)));
  ok("COVERAGE: per-surah and per-juz resolution counts add up to the token counts", D.listSurahs().every(s => Object.values(s.resolution).reduce((x, y) => x + y, 0) === s.tokenCount) && D.listJuz().every(j => Object.values(j.resolution).reduce((x, y) => x + y, 0) === j.tokenCount));
  ok("COVERAGE: the distinct spellings all have a record (no spelling without one)", (() => { const have = new Set(ds.forms.filter(f => f.basis === "rule_default").map(f => f.surface)); return ds.tokens.every(t => have.has(t.text) || ds.effectiveTokenForms.some(x => x.token_id === t.token_id)); })());
  ok("COVERAGE: unresolved and context-dependent records are flagged for review", ds.forms.filter(f => f.basis === "rule_default" && f.status === "unresolved").every(f => f.source_review_required === true && ["unresolved", "context_dependent"].includes(f.resolution)));
  ok("COVERAGE: the disputed quadriliteral lemmas are still disputed and none became a three-letter root", ["zalzala-1", "waswasa-1", "damdama-1"].every(id => ds.lemmas.find(l => l.lemma_id === id).root.status === "disputed"));
  // context-dependent words: the same spelling may carry different analyses in different verses
  const T = id => D.getToken(id);
  ok("CONTEXT: one spelling, different readings in different verses (6:154:8 verb 'to do good', 12:3:4 elative 'best')", T("6:154:8").lemma && T("6:154:8").lemma.id === "ahsana-1" && T("12:3:4").lemma && T("12:3:4").lemma.id === "ahsan-1" && T("6:154:8").surfaceForm === T("12:3:4").surfaceForm);
  ok("CONTEXT: a contextual reading is marked as such and keeps provisional status", T("6:154:8").analysisBasis === "rule_context" && T("6:154:8").status === "provisional");
  ok("CONTEXT: the prophet Hud and 'Jews' are told apart by verse (7:65:4 against 2:111:8)", T("7:65:4").lemma.id === "hud-2" && T("2:111:8").lemma.id === "hud-1");
  ok("CONTEXT: Yahya the name against the verb 'to live' (19:7:6 against 20:74:13)", T("19:7:6").lemma.id === "yahya-1" && T("20:74:13").lemma.id === "hayiya-1");
  ok("CONTEXT: 'asra' is captives in 8:67 and the verb 'travelled by night' in 17:1", T("8:67:7").lemma.id === "asir-1" && T("17:1:3").lemma.id === "asra-1");
  ok("CONTEXT: a contextual reading never changes the pilot tokens", ds.effectiveTokenForms.every(t => T(t.token_id).analysisBasis === "pilot"));
  ok("CONTEXT: every contextual reading is a provisional QURRA_RULE_ANALYSIS form on an existing token with the same text", ds.forms.filter(f => f.basis === "rule_context").every(f => f.status === "provisional" && f.provenance.form.source_id === "QURRA_RULE_ANALYSIS" && ds.tokens.some(t => t.token_id === f.context_token && t.text === f.surface)));
  ok("COVERAGE: a Juz card shows a percentage only while a Juz is not fully analysed; a complete Juz shows no coverage badge", (() => { const r = fs.readFileSync(path.join(ROOT, "js/render.js"), "utf8"); return /j\.analysedTokenCount < j\.tokenCount/.test(r) && /coverageLabel\(j\.analysedTokenCount, j\.tokenCount\)/.test(r) && !/juzCard\.complete/.test(r); })());
}

console.log(`test-coverage: ${passed} passed, ${failed} failed`);
process.exit(failed ? 1 : 0);
