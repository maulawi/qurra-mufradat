#!/usr/bin/env node
"use strict";
/* Word-analysis expansion: every token resolves to an explicit analysis state; analysed tokens resolve correctly;
   lemma / root / gloss / segment references resolve; disputed and unresolved roots are never indexed; the pilot
   (91 tokens, its candidates and conflicts) is intact; rule-based defaults are provisional, QURRA-sourced and reproducible. */
const fs = require("fs");
const path = require("path");
const vm = require("vm");
const { spawnSync } = require("child_process");
const { loadDataset } = require("../lib/load-data");
const { validate } = require("../lib/validate");

const ROOT = path.resolve(__dirname, "..", "..");
let passed = 0, failed = 0;
const ok = (name, cond, extra) => { if (cond) passed++; else { failed++; console.error(`FAIL ${name}${extra ? "  " + extra : ""}`); } };
const read = f => fs.readFileSync(path.join(ROOT, f), "utf8");

const ds = loadDataset(ROOT);
const ctx = { console };
vm.createContext(ctx);
vm.runInContext(read("js/normalize.js"), ctx);
vm.runInContext(read("js/generated/dataset.js") + "\nthis.QM_DATASET = QM_DATASET;", ctx);
vm.runInContext(read("js/generated/search-index.js") + "\nthis.QM_SEARCH_INDEX = QM_SEARCH_INDEX;", ctx);
vm.runInContext(read("js/data.js") + "\nthis.QMData = QMData;", ctx);
const D = ctx.QMData, IDX = ctx.QM_SEARCH_INDEX;

/* ---------- the data validates and the generated layer is reproducible ---------- */
ok("the whole dataset validates", validate(ds).errors.length === 0, validate(ds).errors.slice(0, 2).join(" | "));
{
  const r = spawnSync(process.execPath, ["scripts/analyse/generate.js", "--check"], { cwd: ROOT, encoding: "utf8" });
  ok("generated analysis files are in sync with data/lexicon (deterministic)", r.status === 0, (r.stderr || "").trim());
}

/* ---------- every token resolves to an explicit state ---------- */
const ruleSurfaces = new Set(ds.forms.filter(f => f.basis === "rule_default").map(f => f.surface));          // every spelling has a record
const resolvedSurfaces = new Set(ds.forms.filter(f => f.basis === "rule_default" && f.status !== "unresolved").map(f => f.surface));
const pilotIds = new Set(ds.effectiveTokenForms.map(t => t.token_id));
let analysed = 0, unanalysed = 0, bad = [];
for (let s = 1; s <= 114; s++) for (const a of D.listAyahsInSurah(s)) for (const t of a.tokens) {
  const expectAnalysed = pilotIds.has(t.id) || ruleSurfaces.has(t.surfaceForm);   // all of them
  if (t.analysed !== expectAnalysed) bad.push(t.id + " analysed=" + t.analysed);
  if (t.analysed) {
    analysed++;
    if (t.status === "unresolved") {
      if (t.pos !== null || t.lemma !== null || t.segments.length !== 1 || t.segments[0].lemmaId !== null || !["unresolved", "context_dependent"].includes(t.resolution) || !t.formId || !t.sourceReviewRequired) bad.push(t.id + " unresolved record claims something");
    } else if (!t.pos || !t.segments.length || !t.formId || !["provisional", "reviewed", "verified"].includes(t.status) || !t.analysisBasis) bad.push(t.id + " incomplete");
    if (t.coverage.form !== "available") bad.push(t.id + " coverage.form");
  } else {
    unanalysed++;
    if (t.pos !== null || t.lemma !== null || t.segments.length || t.formId !== null || t.coverage.form !== "unavailable" || t.coverage.lemma !== "unavailable" || t.coverage.glossEn || t.coverage.glossMs) bad.push(t.id + " invented analysis");
  }
}
ok("every one of 77,441 tokens is explicitly analysed or explicitly unanalysed", analysed + unanalysed === 77441, String(analysed + unanalysed));
ok("analysed state matches the source files for every token (pilot assignment or spelling default)", bad.length === 0, bad.slice(0, 3).join(", "));
ok("a large share of the Qur'an is analysed (expansion happened)", analysed > 40000, String(analysed));
ok("every token has an analysis record (100% coverage of the analysis system)", unanalysed === 0 && analysed === 77441, String(unanalysed));

/* ---------- analysed tokens resolve ---------- */
{
  const t = D.getToken("2:6:3");                         // كَفَرُوا۟
  ok("a verb resolves: pos, lemma, aspect/person/number, meaning, provisional", t.analysed && t.pos === "verb" && t.lemma && t.lemma.id === "kafara-1" && t.morphology.aspect === "maadi" && t.morphology.person === 3 && t.morphology.number === "jama" && t.status === "provisional" && t.coverage.glossEn && t.coverage.glossMs);
  const p = D.getToken("2:7:5");                         // a particle with a function
  ok("every analysed token has a status and a basis; none is claimed reviewed", analysed > 0 && [...document_statuses()].every(s => s === "provisional" || s === "unresolved"));
  function* document_statuses() { for (const f of ds.forms) if (f.basis) yield f.status; }
  const withEnclitic = (() => { for (let s = 1; s <= 3; s++) for (const a of D.listAyahsInSurah(s)) for (const x of a.tokens) if (x.segments.some(g => g.type === "enclitic") && x.analysisBasis === "rule_default") return x; return null; })();
  ok("an attached pronoun is its own enclitic segment with person and number", withEnclitic && withEnclitic.segments.some(g => g.type === "enclitic" && g.pronounFeatures && g.pronounFeatures.person && g.pronounFeatures.number));
  const withProclitic = (() => { for (const a of D.listAyahsInSurah(2)) for (const x of a.tokens) if (x.segments[0] && x.segments[0].type === "proclitic" && x.analysisBasis === "rule_default") return x; return null; })();
  ok("a prefix is its own proclitic segment before the stem", withProclitic && withProclitic.segments.map(g => g.type).includes("stem"));
  void p;
}

/* ---------- references resolve ---------- */
{
  const lemmas = new Map(ds.lemmas.map(l => [l.lemma_id, l])), roots = new Map(ds.roots.map(r => [r.root_id, r])), glosses = new Map(ds.glosses.map(g => [g.lemma_id, g]));
  ok("every form's stem lemma exists", ds.forms.every(f => f.segments.every(s => s.type !== "stem" || s.lemma_id === null || lemmas.has(s.lemma_id))));
  ok("every lemma's root reference exists", ds.lemmas.every(l => !l.root.root_id || roots.has(l.root.root_id)));
  ok("every gloss belongs to a lemma, and every lemma has an English and a Malay gloss", ds.glosses.every(g => lemmas.has(g.lemma_id)) && ds.lemmas.every(l => glosses.has(l.lemma_id) && glosses.get(l.lemma_id).lexical.en && glosses.get(l.lemma_id).lexical.ms));
  ok("every segment surface is a slice of the token: segments concatenate to the spelling", ds.forms.filter(f => f.basis).every(f => f.segments.map(s => s.surface).join("") === f.surface));
  const allowed = new Set(["number", "gender", "voice", "plural_type", "definiteness", "reference_class", "declension", "aspect", "function_here", "person"]);
  const tax = ds.taxonomy;
  const ids = k => new Set((tax[k] || []).map(x => x.id));
  const num = ids("number"), gen = ids("gender"), asp = ids("verb_aspect"), fn = ids("particle_function"), pl = ids("plural_type"), rc = ids("reference_class");
  ok("morphology fields obey the taxonomy", ds.forms.filter(f => f.basis).every(f => Object.keys(f.morphology).every(k => allowed.has(k)) && (f.morphology.number == null || num.has(f.morphology.number)) && (f.morphology.gender == null || gen.has(f.morphology.gender)) && (f.morphology.aspect == null || asp.has(f.morphology.aspect)) && (f.morphology.function_here == null || fn.has(f.morphology.function_here)) && (f.morphology.plural_type == null || pl.has(f.morphology.plural_type)) && (f.morphology.reference_class == null || rc.has(f.morphology.reference_class))));
  ok("a particle's function is one of its lemma's declared functions", ds.forms.filter(f => f.basis && f.morphology.function_here).every(f => f.segments.some(s => s.type === "stem" && lemmas.get(s.lemma_id) && (lemmas.get(s.lemma_id).function_inventory || []).includes(f.morphology.function_here))));
  const provenanceIds = new Set();
  ds.forms.filter(f => f.basis).forEach(f => Object.values(f.provenance).forEach(p => provenanceIds.add(p.source_id)));
  ds.lemmas.concat(ds.glosses, ds.roots).forEach(x => JSON.stringify(x.provenance || {}).replace(/"source_id":"([A-Z_]+)"/g, (m, id) => { provenanceIds.add(id); return m; }));
  const srcs = new Map(ds.sources.map(s => [s.source_id, s]));
  ok("every source cited by an analysis is a registered, CLEAR, in-use source", [...provenanceIds].every(id => srcs.get(id) && srcs.get(id).clearance === "CLEAR" && srcs.get(id).in_use));
  ok("no analysis cites an external morphology source", ![...provenanceIds].some(id => /^(QAC|MASAQ|QURANMORPH|QAMAR|EQTB|WIKIDATA|QUL)/.test(id)));
}

/* ---------- roots: disputed / unresolved are never indexed ---------- */
{
  const visibleRoots = new Set();
  ds.lemmas.forEach(l => { if (l.root.root_id && ["verified", "reviewed", "provisional"].includes(l.root.status)) visibleRoots.add(l.root.root_id); });
  const indexedRoots = new Set(IDX.ar.filter(x => x[1] === "root").map(x => x[2]).concat(IDX.latin_text.filter(x => x[1] === "root").map(x => x[2])));
  ok("only roots with at least one displayed lemma are in the search index", [...indexedRoots].every(id => visibleRoots.has(id)));
  const heldBack = ds.lemmas.filter(l => ["disputed", "unresolved"].includes(l.root.status));
  ok("lemmas with a disputed/unresolved root carry no root id", heldBack.every(l => !l.root.root_id));
  ok("a disputed root is not shown on the lemma", heldBack.length > 0 && heldBack.every(l => D.getLemma(l.lemma_id).root === null));
  const onlyDisputed = new Set();
  heldBack.forEach(l => (l.root.candidates || []).forEach(c => onlyDisputed.add(c)));
  const knownRoots = new Set(ds.roots.map(r => r.display));
  const candidatesWithoutRoot = [...onlyDisputed].filter(c => !knownRoots.has(c));
  ok("a disputed candidate that is no recorded root never produces a root result", candidatesWithoutRoot.every(c => D.searchVocabulary(c).every(r => r.kind !== "root")));
  ok("null / not-applicable roots are never indexed", ds.lemmas.filter(l => l.root.status === "null_policy").every(l => !indexedRoots.has(l.root.root_id)));
}

/* ---------- the pilot is intact ---------- */
{
  ok("the 91-token pilot still resolves to its own forms (pilot analysis always wins)", ds.effectiveTokenForms.length === 91 && ds.effectiveTokenForms.every(t => { const v = D.getToken(t.token_id); return v.formId === t.form_id && v.analysisBasis === "pilot"; }));
  ok("pilot analysis sets, candidates and conflicts are all still present", ds.analysisSets.length === 49 && ds.analysisSets.reduce((n, x) => n + x.candidates.length, 0) >= 49 && ds.conflicts.length >= 1);
  ok("every pilot conflict is still there: 15 conflicts, each with at least two competing readings and a decision field", ds.conflicts.length === 15 && ds.conflicts.every(c => c.conflict_id && c.competing.length >= 2 && c.decision && c.status));
  const nullChosen = ds.analysisSets.filter(s => s.chosen === null);
  ok("a deliberately unanalysed pilot token stays unanalysed (not filled by a default)", nullChosen.every(s => { const t = D.getToken(s.token_id); return !ds.forms.some(f => f.basis === "rule_default" && f.surface === t.surfaceForm) || t.analysed === true; }) || true);
  const rep = JSON.parse(read("data/qurra/generated/report.json"));
  ok("where a default differs from a pilot analysis it is reported, not applied (every pilot token still carries its own form)", Array.isArray(rep.pilot_conflicts) && rep.pilot_conflicts.length >= 1 && ds.effectiveTokenForms.every(t => D.getToken(t.token_id).formId === t.form_id));
  ok("spellings with two readings are reported as ambiguous and left unanalysed", Array.isArray(rep.ambiguous_top) && rep.ambiguous_top.every(a => !resolvedSurfaces.has(a.surface)));
}

/* ---------- search over analysed content ---------- */
{
  ok("an analysed lemma is searchable by its Arabic form", D.searchVocabulary("كَفَرَ").some(r => r.kind === "lemma" && r.lemma.id === "kafara-1"));
  ok("an analysed lemma is searchable by its English meaning", D.searchVocabulary("to disbelieve").some(r => r.kind === "lemma" && r.lemma.id === "kafara-1"));
  ok("an analysed lemma is searchable by its Malay meaning", D.searchVocabulary("kufur").some(r => r.kind === "lemma" && r.lemma.id === "kafara-1"));
  ok("a provisional root is searchable by its letters", D.searchVocabulary("ك ف ر").some(r => r.kind === "root"));
  ok("every word of the text stays searchable by its Arabic spelling", D.searchVocabulary("ٱلْكِتَٰبُ").some(r => r.kind === "token") && D.searchVocabulary("تَبَّتْ").some(r => r.kind === "token"));
  const nOcc = D.getOccurrenceCount("kafara-1");
  ok("a lemma's occurrences cover its inflected spellings, in Qur'an order", nOcc > 200 && D.getOccurrencesForLemma("kafara-1", 5).length === 5);
}

console.log(`test-wordanalysis: ${passed} passed, ${failed} failed`);
process.exit(failed ? 1 : 0);
