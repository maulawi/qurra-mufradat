#!/usr/bin/env node
"use strict";
/* Tests for the analysis / staging layer (analysis sets, origin, conflicts, alignment, tag mapping).
   Everything involving an "external source" uses the SYNTHETIC fixture; no real external data exists in the repo. */
const fs = require("fs");
const path = require("path");
const { loadDataset } = require("../lib/load-data");
const { validate } = require("../lib/validate");
const { alignRecords, formatReport, validateAlignmentFile } = require("../lib/alignment");
const { validateTagMap, mapTag, coverage } = require("../lib/tagmap");

const ROOT = path.resolve(__dirname, "..", "..");
const base = loadDataset(ROOT);
const fx = JSON.parse(fs.readFileSync(path.join(__dirname, "fixtures", "synthetic-source.json"), "utf8"));

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
const setOf = (ds, tok) => ds.analysisSets.find(s => s.token_id === tok);
const addSynthetic = ds => { ds.sources.push({ source_id: "SYNTHETIC_TEST", name: "Synthetic", type: "corpus", version: "synthetic-0", url: null, licence: "n/a (test)", licence_status: "internal", licence_url: "https://example.invalid/synthetic", clearance: "CLEAR", gate: { commercial_use: "n/a", redistribution: "n/a", static_bundling: "n/a", derivatives: "n/a", attribution: "n/a", modification: "n/a", third_party_material: "none", upstream: "none (synthetic)", decision: "USE", reason: "synthetic test source" }, in_use: true, allowed_use: "tests only", notes: "synthetic" }); return ds; };

/* ================= the real pilot data ================= */
{
  const { errors } = validate(base);
  ok("production data validates (0 errors)", errors.length === 0, errors.slice(0, 3).join(" | "));
  ok("49 analysis sets, 53 candidate analyses, 15 conflicts", base.analysisSets.length === 49 && base.analysisSets.reduce((n, s) => n + s.candidates.length, 0) === 53 && base.conflicts.length === 15);
  ok("every candidate is origin qurra_editorial, status provisional", base.analysisSets.every(s => s.candidates.every(c => c.origin === "qurra_editorial" && c.status === "provisional")));
  ok("nothing claims expert review", !JSON.stringify(base.analysisSets).includes("expert_reviewed") && !JSON.stringify(base.conflicts).includes("expert_reviewed") && base.lemmas.every(l => l.root.origin !== "expert_reviewed"));
  ok("no external source appears in any analysis", base.analysisSets.every(s => s.candidates.every(c => c.source.source_id === "QURRA_PILOT_ANALYSIS")));
  ok("multiple analyses exist for one token (4 tokens have alternatives)", base.analysisSets.filter(s => s.candidates.length > 1).length === 4);
  ok("a held token has no active analysis (112:4:4)", setOf(base, "112:4:4").chosen === null && base.tokens.find(t => t.token_id === "112:4:4").form_id === null);
  ok("an active token resolves through its chosen candidate", base.tokens.find(t => t.token_id === "2:255:3").form_id === setOf(base, "2:255:3").candidates.find(c => c.analysis_id === setOf(base, "2:255:3").chosen).form_id);
  ok("no token is both direct and in an analysis set", base.analysisSets.every(s => !base.tokenForms.some(t => t.token_id === s.token_id)));
  const disputedRoot = ["ism-1", "ahad-1", "ibn-1", "iblis-1", "malak-1", "waswas-1", "waswasa-1", "zalzala-1", "zilzal-1", "damdama-1"];
  ok("disputed lemmas carry candidates but no root", disputedRoot.every(id => { const l = base.lemmas.find(x => x.lemma_id === id); return l.root.status === "disputed" && l.root.root_id === null && l.root.candidates.length >= 1; }));
  ok("اللَّه stays unresolved; امْرَأَة stays unresolved", ["allah-1", "imraa-1"].every(id => { const l = base.lemmas.find(x => x.lemma_id === id); return l.root.status === "unresolved" && !l.root.root_id; }));
  ok("no root is reviewed or verified", base.lemmas.every(l => l.root.status !== "reviewed" && l.root.status !== "verified") && base.roots.every(r => r.status === "provisional"));
}

/* ================= alignment ================= */
{
  const r = alignRecords(fx.records, base.tokens);
  ok("alignment: unambiguous records match (SYN-0001..0003)", ["SYN-0001", "SYN-0002", "SYN-0003"].every(ref => r.matched.some(m => m.ref === ref)) && r.matched.find(m => m.ref === "SYN-0001").token_id === "112:1:1");
  ok("alignment: two records for one token are ambiguous, neither is matched", r.ambiguous.length === 1 && r.ambiguous[0].token_id === "112:1:4" && r.ambiguous[0].refs.join() === "SYN-0004,SYN-0005" && !r.matched.some(m => m.token_id === "112:1:4"));
  ok("alignment: text mismatch is reported (SYN-0006)", r.unmatched.some(u => u.ref === "SYN-0006" && u.reason === "text_mismatch"));
  ok("alignment: position out of range is reported (SYN-0007)", r.unmatched.some(u => u.ref === "SYN-0007" && u.reason === "position_out_of_range"));
  ok("alignment: unknown ayah is reported (SYN-0008)", r.unmatched.some(u => u.ref === "SYN-0008" && u.reason === "no_such_ayah"));
  ok("alignment: QURRA tokens of touched ayahs that no record reached are listed (ambiguous ones are not uncovered)", r.uncovered.includes("112:2:1") && r.uncovered.includes("112:2:2") && !r.uncovered.includes("112:1:1") && !r.uncovered.includes("112:1:4"));
  ok("alignment: counts add up", r.summary.records === fx.records.length && r.summary.matched + r.summary.unmatched + r.summary.ambiguous * 2 === fx.records.length);
  const rep = formatReport(r);
  ok("alignment report names every unmatched record", ["SYN-0006", "SYN-0007", "SYN-0008"].every(x => rep.includes(x)) && rep.includes("AMBIGUOUS") && rep.includes("UNCOVERED"));
  ok("alignment: deterministic", JSON.stringify(alignRecords(fx.records, base.tokens)) === JSON.stringify(r));

  const srcMap = new Map(base.sources.map(s => [s.source_id, s]));
  const ids = new Set(base.tokens.map(t => t.token_id));
  const file = { source_id: "QAC", source_version: "x", entries: [{ ref: "a", token_id: "1:1:1", status: "matched" }] };
  ok("alignment file for an in_use=false source is rejected", validateAlignmentFile("f.json", file, { sources: srcMap, tokenIds: ids }).some(e => /in_use=false/.test(e)));
  ok("alignment file for an unknown source is rejected", validateAlignmentFile("f.json", { ...file, source_id: "NOPE" }, { sources: srcMap, tokenIds: ids }).some(e => /unknown source_id/.test(e)));
  const good = { source_id: "QURRA_PILOT_ANALYSIS", source_version: "v", entries: [{ ref: "a", token_id: "1:1:1", status: "matched" }, { ref: "b", token_id: null, status: "unmatched" }] };
  ok("a well-formed alignment file passes", validateAlignmentFile("f.json", good, { sources: srcMap, tokenIds: ids }).length === 0);
  ok("an alignment entry pointing at a nonexistent token is rejected", validateAlignmentFile("f.json", { ...good, entries: [{ ref: "a", token_id: "1:1:99", status: "matched" }] }, { sources: srcMap, tokenIds: ids }).some(e => /nonexistent token/.test(e)));
}

/* ================= tag mapping ================= */
{
  const tax = base.taxonomy;
  const srcMap = new Map(base.sources.map(s => [s.source_id, s]));
  ok("synthetic tag map is valid as a fixture", validateTagMap("fx", fx.tagmap, tax, { sources: srcMap, production: false }).length === 0);
  ok("a synthetic tag map is rejected in production", validateTagMap("data/mappings/x.json", fx.tagmap, tax, { sources: srcMap, production: true }).some(e => /synthetic/.test(e)));
  ok("a map for an in_use=false source is rejected in production", validateTagMap("f", { ...fx.tagmap, source_id: "QAC", synthetic: false }, tax, { sources: srcMap, production: true }).some(e => /in_use=false/.test(e)));
  ok("a map for an unknown source is rejected in production", validateTagMap("f", { ...fx.tagmap, source_id: "NOPE", synthetic: false }, tax, { sources: srcMap, production: true }).some(e => /unknown source_id/.test(e)));
  const bad = JSON.parse(JSON.stringify(fx.tagmap));
  bad.tags.BAD_POS = { pos: "adjective" }; bad.tags.BAD_CAT = { pos: "noun", features: { colour: "red" } }; bad.tags.BAD_VAL = { pos: "noun", features: { number: "triple" } };
  const errs = validateTagMap("fx", bad, tax, { sources: srcMap, production: false });
  ok("tag map: invalid POS, unknown feature category and unknown feature value are all reported", errs.some(e => /BAD_POS.*not a QURRA POS/.test(e)) && errs.some(e => /unknown feature category "colour"/.test(e)) && errs.some(e => /number="triple"/.test(e)));
  ok("mapTag maps a known tag", mapTag(fx.tagmap, "SYN_V_PERF").ok && mapTag(fx.tagmap, "SYN_V_PERF").pos === "verb" && mapTag(fx.tagmap, "SYN_V_PERF").fine === "synthetic_verb_perfect");
  const miss = mapTag(fx.tagmap, "SYN_UNKNOWN");
  ok("mapTag fails on an unmapped tag instead of guessing", miss.ok === false && /unmapped tag/.test(miss.error));
  ok("coverage lists exactly the unmapped tags", JSON.stringify(coverage(fx.tagmap, ["SYN_N", "X1", "X1", "X2"]).unmapped) === JSON.stringify(["X1", "X2"]));
  ok("mapTag does not match inherited object keys", mapTag(fx.tagmap, "constructor").ok === false && mapTag(fx.tagmap, "__proto__").ok === false);
}

/* ================= analysis sets ================= */
{
  const ds = clone();
  const set = setOf(ds, "2:255:3");
  const extra = structuredClone(set.candidates[0]); extra.analysis_id = "an-2.255.3-c";
  set.candidates.push(extra);
  check("multiple analyses for one token (three candidates) are valid", ds, null);
}
{ const ds = clone(); setOf(ds, "2:255:3").chosen = "an-nope"; check("a chosen pointer to a non-candidate is rejected", ds, /is not one of this token's candidates/); }
{ const ds = clone(); setOf(ds, "2:255:3").chosen = null; ds.conflicts = ds.conflicts.filter(c => c.conflict_id !== "cf-lemma-ilah"); check("chosen = null (no active analysis) is valid", ds, null); }
{ const ds = clone(); delete setOf(ds, "2:255:3").chosen; check("a missing chosen field is rejected", ds, /missing "chosen"/); }
{ const ds = clone(); const s = setOf(ds, "2:255:3"); s.candidates.find(c => c.analysis_id === s.chosen).status = "draft"; check("a draft candidate may not be the active analysis", ds, /may not be active/); }
{ const ds = clone(); ds.tokenForms.push({ token_id: "2:255:3", form_id: setOf(ds, "2:255:3").candidates[0].form_id, status: "provisional", provenance: { form: { source_id: "QURRA_DEMO_MORPHOLOGY" } } }); check("a token in both token_forms and an analysis set is rejected", ds, /both a direct token_forms assignment and an analysis set/); }
{ const ds = clone(); ds.analysisSets.push(structuredClone(setOf(ds, "2:255:3"))); check("two analysis sets for one token are rejected", ds, /more than one analysis set|duplicate analysis_id/); }
{ const ds = clone(); setOf(ds, "2:255:3").candidates[1].analysis_id = setOf(ds, "2:255:3").candidates[0].analysis_id; check("duplicate analysis ids are rejected", ds, /duplicate analysis_id/); }
{ const ds = clone(); setOf(ds, "2:255:3").candidates[0].form_id = "frm-nope"; check("a candidate pointing at a nonexistent form is rejected", ds, /form_id "frm-nope" does not exist/); }
{ const ds = clone(); const c = setOf(ds, "2:255:3").candidates[0]; c.form_id = setOf(ds, "112:1:4").candidates[0].form_id; check("a candidate whose form surface differs from the token text is rejected", ds, /does not equal the token text/); }
{ const ds = clone(); setOf(ds, "2:255:3").candidates = []; check("an analysis set without candidates is rejected", ds, /candidates must be a non-empty array/); }
{ const ds = clone(); ds.analysisSets.push({ token_id: "2:255:999", chosen: null, candidates: [structuredClone(setOf(ds, "2:255:3").candidates[0])] }); check("an analysis set for a nonexistent token is rejected", ds, /token "2:255:999" does not exist/); }

/* ---- segment surface reconstruction still enforced for candidate forms ---- */
{ const ds = clone(); const f = ds.forms.find(x => x.form_id === setOf(ds, "2:255:9").candidates[0].form_id); f.segments[0].surface = "تَأْ"; check("candidate form whose segments do not add up to its surface is rejected", ds, /segment surfaces do not add up/); }

/* ================= origin vs status ================= */
{ const ds = clone(); setOf(ds, "2:255:3").candidates[0].origin = "guessed"; check("an unknown origin is rejected", ds, /unsupported origin "guessed"/); }
{ const ds = clone(); delete setOf(ds, "2:255:3").candidates[0].origin; check("a candidate without origin is rejected", ds, /missing origin/); }
{ const ds = clone(); setOf(ds, "2:255:3").candidates[0].origin = "expert_reviewed"; check("origin expert_reviewed with a provisional status is rejected (nothing may claim review)", ds, /requires status reviewed or verified/); }
{ const ds = clone(); const c = setOf(ds, "2:255:3").candidates[0]; c.origin = "expert_reviewed"; c.status = "reviewed"; check("origin expert_reviewed without a review block is rejected", ds, /requires review\.reviewer_id/); }
{ const ds = clone(); setOf(ds, "2:255:3").candidates[0].status = "reviewed"; check("status reviewed with origin qurra_editorial is rejected", ds, /status "reviewed" requires origin expert_reviewed/); }
{ const ds = clone(); const c = setOf(ds, "2:255:3").candidates[0]; c.origin = "expert_reviewed"; c.status = "reviewed"; c.review = { reviewer_id: "synthetic-reviewer", date: "2026-01-01" }; check("origin and status are independent and consistent when both are set properly", ds, null); }
{ const ds = clone(); ds.lemmas.find(l => l.lemma_id === "qaala-1").root.origin = "expert_reviewed"; check("a root assignment cannot claim expert review while unresolved", ds, /requires status reviewed or verified/); }

/* ================= provenance / source references ================= */
{ const ds = clone(); setOf(ds, "2:255:3").candidates[0].source.source_id = "NOT_REGISTERED"; check("a candidate citing an unregistered source is rejected", ds, /unknown source_id "NOT_REGISTERED"/); }
{ const ds = clone(); const c = setOf(ds, "2:255:3").candidates[0]; c.source.source_id = "QAC"; check("a candidate citing an in_use=false source (QAC) is rejected", ds, /in_use=false/); }
{ const ds = clone(); const c = setOf(ds, "2:255:3").candidates[0]; c.source.source_id = "MASAQ_MORPHOLOGY"; check("a candidate citing MASAQ (in_use=false) is rejected", ds, /in_use=false/); }
{ const ds = addSynthetic(clone()); const c = setOf(ds, "2:255:3").candidates[0]; c.origin = "source_derived"; c.source = { source_id: "SYNTHETIC_TEST" }; check("source_derived requires source_version and source_ref", ds, /requires source\.source_version/); }
{ const ds = addSynthetic(clone()); const c = setOf(ds, "2:255:3").candidates[0]; c.origin = "source_derived"; c.source = { source_id: "SYNTHETIC_TEST", source_version: "synthetic-0" }; check("source_derived without source_ref is rejected", ds, /requires source\.source_ref/); }
{ const ds = addSynthetic(clone()); const c = setOf(ds, "2:255:3").candidates[0]; c.origin = "source_derived"; c.source = { source_id: "SYNTHETIC_TEST", source_version: "synthetic-0", source_ref: "SYN-0123", raw_tags: ["SYN_N"], external_ids: [{ system: "synthetic-lexicon", id: "L-1" }] }; c.lemma_scope = "segment"; check("a complete SYNTHETIC source_derived analysis (version, ref, raw tag, external id) is valid", ds, null); }
{ const ds = addSynthetic(clone()); const c = setOf(ds, "2:255:3").candidates[0]; c.source = { source_id: "SYNTHETIC_TEST", raw_tags: "SYN_N" }; check("raw_tags must be an array of strings", ds, /raw_tags must be an array/); }
{ const ds = clone(); setOf(ds, "2:255:3").candidates[0].source.external_ids = [{ system: "x" }]; check("malformed external_ids on a candidate are rejected", ds, /needs non-empty string system and id/); }
{ const ds = clone(); ds.lemmas.find(l => l.lemma_id === "qaala-1").external_ids = [{ system: "synthetic-lexicon", id: "L-9" }]; check("valid external_ids on a lemma are accepted", ds, null); }
{ const ds = clone(); ds.lemmas.find(l => l.lemma_id === "qaala-1").external_ids = "L-9"; check("external_ids on a lemma must be an array", ds, /external_ids must be an array/); }

/* ================= lemma_scope ================= */
{ const ds = clone(); setOf(ds, "2:255:3").candidates[0].lemma_scope = "whole"; check("an unknown lemma_scope is rejected", ds, /lemma_scope "whole" is not in the taxonomy/); }
{ const ds = clone(); setOf(ds, "2:255:3").candidates[0].lemma_scope = "token"; check("lemma_scope token on a single-stem form is valid", ds, null); }
{
  const ds = clone();
  const c = setOf(ds, "2:255:9").candidates[0];
  const f = ds.forms.find(x => x.form_id === c.form_id);
  const st = f.segments.find(s => s.type === "stem");
  f.segments.push({ segment_id: f.form_id + ".s9", type: "stem", surface: "", pos: "noun", lemma_id: null });
  f.segmentation_note = { en: "synthetic", ms: "sintetik" };
  c.lemma_scope = "token";
  void st;
  check("lemma_scope token on a form with two stems is rejected (ambiguous)", ds, /lemma_scope "token" is only valid for a form with exactly one stem|non-Arabic|malformed/);
}

/* ================= conflicts ================= */
{ const ds = clone(); ds.conflicts.find(c => c.conflict_id === "cf-pos-kaana").decision.chosen = null; check("a provisional decision must choose a competing value", ds, /needs decision\.chosen to be one of its competing ids/); }
{ const ds = clone(); ds.conflicts.find(c => c.conflict_id === "cf-pos-kaana").decision.rationale = ""; check("a decision needs a written rationale", ds, /needs a written rationale/); }
{ const ds = clone(); ds.conflicts.find(c => c.conflict_id === "cf-lemma-kufu").decision = { chosen: "kufu1", origin: "qurra_editorial", rationale: "auto" }; check("an unresolved conflict must not be resolved automatically", ds, /must not carry a decision/); }
{ const ds = clone(); ds.conflicts.find(c => c.conflict_id === "cf-root-ahad").decision = { chosen: "ahd", origin: "qurra_editorial", rationale: "x" }; check("a disputed root conflict must not carry a decision", ds, /must not carry a decision/); }
{ const ds = clone(); setOf(ds, "112:4:4").chosen = "an-112.4.4-a"; check("an unresolved token conflict with an active analysis is rejected (it must stay unanalysed)", ds, /still has an active analysis/); }
{ const ds = clone(); ds.conflicts.find(c => c.conflict_id === "cf-pos-kaana").competing = [ds.conflicts.find(c => c.conflict_id === "cf-pos-kaana").competing[0]]; check("a conflict needs at least two competing values", ds, /at least two competing values/); }
{ const ds = clone(); ds.conflicts.find(c => c.conflict_id === "cf-pos-kaana").competing[0].analysis_id = "an-112.4.4-a"; check("a competing analysis_id must belong to the subject token", ds, /is not a candidate of 2:34:11/); }
{ const ds = clone(); ds.conflicts.find(c => c.conflict_id === "cf-pos-kaana").type = "morphology"; check("an unknown conflict type is rejected", ds, /type "morphology" is not in the taxonomy/); }
{ const ds = clone(); ds.conflicts.find(c => c.conflict_id === "cf-pos-kaana").subject = { token_id: "2:34:999" }; check("a conflict about a nonexistent token is rejected", ds, /subject token "2:34:999" does not exist/); }
{ const ds = clone(); ds.conflicts.find(c => c.conflict_id === "cf-pos-kaana").status = "approved"; check("an unsupported conflict status is rejected", ds, /conflict status must be one of/); }
{ const ds = clone(); ds.conflicts.push(structuredClone(ds.conflicts[0])); check("duplicate conflict ids are rejected", ds, /duplicate conflict_id/); }
{ const ds = clone(); ds.conflicts.find(c => c.conflict_id === "cf-root-ahad").subject = {}; check("a root conflict needs lemma ids", ds, /needs subject\.lemma_ids/); }
{ const ds = clone(); ds.lemmas.find(l => l.lemma_id === "ahad-1").root.status = "provisional"; check("a disputed root conflict with a lemma marked provisional is rejected", ds, /root status is "provisional" but the conflict is disputed/); }
{ const ds = clone(); ds.conflicts.find(c => c.conflict_id === "cf-root-rabb").competing[0].value = "ر ب ك"; check("a provisional root decision must agree with the lemma's root", ds, /differs from lemma rabb-1's root/); }
{ const ds = clone(); const c = ds.conflicts.find(c => c.conflict_id === "cf-pos-kaana"); c.status = "reviewed"; check("a reviewed conflict decision needs expert_reviewed origin and a review block", ds, /requires status reviewed or verified|requires review\.reviewer_id|status "reviewed" requires origin/); }

/* ================= materialised token layer ================= */
{
  const eff = base.effectiveTokenForms;
  ok("effective token forms = direct (43) + chosen candidates (48)", eff.length === 43 + 48 && base.tokens.filter(t => t.form_id).length === eff.length);
  ok("the token layer is unchanged in size", base.tokens.length === 77441);
}

console.log(`test-analysis: ${passed} passed, ${failed} failed`);
process.exit(failed ? 1 : 0);
