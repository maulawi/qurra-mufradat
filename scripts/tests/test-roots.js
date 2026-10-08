#!/usr/bin/env node
"use strict";
/* Regression tests for the root model: a root is NOT limited to three radicals.
   - quadriliteral (رباعي) roots such as ز ل ز ل are valid and are never reduced to a triliteral;
   - classical source indexing (for example under ز ل ل) is evidence only and never overwrites a QURRA root assignment;
   - new root categories come from data/taxonomy.json without a code change. */
const fs = require("fs");
const path = require("path");
const { loadDataset } = require("../lib/load-data");
const { validate } = require("../lib/validate");
const rootModel = require("../lib/rootmodel");

const ROOT = path.resolve(__dirname, "..", "..");
const base = loadDataset(ROOT);
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
let passed = 0, failed = 0;
function ok(name, cond, detail) { if (cond) passed++; else { failed++; console.error(`FAIL ${name}${detail ? "\n  " + detail : ""}`); } }
function valid(name, ds) { const { errors } = validate(ds); ok(name, errors.length === 0, errors.slice(0, 3).join(" | ")); }
function rejects(name, ds, re) { const { errors } = validate(ds); ok(name, errors.some(e => re.test(e)), "got: " + (errors.slice(0, 3).join(" | ") || "(no errors)")); }
const find = (arr, key, id) => arr.find(x => x[key] === id);
const letters = d => d.split(" ");
const slug = base.taxonomy.root_letters.letters;
const idOf = l => "root-" + l.map(c => slug[c]).join("-");
const rootRec = (display, extra) => {
  const l = letters(display);
  return { root_id: idOf(l), letters: l, display, root_type: "sahih_salim", core_field: { en: "test root" }, status: "provisional", provenance: { letters: { source_id: "QURRA_DEMO_ROOTS" }, core_field: { source_id: "QURRA_GLOSS" } }, ...extra };
};

/* ---- taxonomy ---- */
ok("taxonomy defines the triliteral category (3)", rootModel.categoryByCount(base.taxonomy).get(3) === "thulathi");
ok("taxonomy defines the quadriliteral category (4)", rootModel.categoryByCount(base.taxonomy).get(4) === "rubai");

/* ---- a quadriliteral root is valid ---- */
{
  const ds = clone();
  ds.roots.push(rootRec("ز ل ز ل", { root_category: "rubai" }));
  valid("ز ل ز ل is accepted as a valid root (4 radicals, root_category rubai)", ds);
}
{
  const ds = clone();
  ds.roots.push(rootRec("ز ل ز ل"));
  valid("a valid 4-radical root is accepted without an explicit root_category", ds);
}
{
  const ds = clone();
  const r = rootRec("ز ل ز ل", { root_category: "rubai" });
  ds.roots.push(r);
  ok("the root id of ز ل ز ل is its own four letters, not those of ز ل ل", r.root_id === "root-z-l-z-l" && r.root_id !== idOf(letters("ز ل ل")));
  const ds2 = clone();
  ds2.roots.push({ ...r, root_id: idOf(letters("ز ل ل")) });
  rejects("a four-letter root cannot carry the id of the triliteral ز ل ل", ds2, /root_id .* must be "root-z-l-z-l"/);
}
{
  const ds = clone();
  ds.roots.push(rootRec("ز ل ز ل", { root_category: "thulathi" }));
  rejects("root_category must match the number of letters", ds, /does not match the 4-letter root/);
}
{
  const ds = clone();
  ds.roots.push({ ...rootRec("ز ل"), root_id: "root-z-l" });
  rejects("a two-letter root is still rejected (not an allowed length)", ds, /letters must be an array of 3 or 4 letters/);
}
{
  const ds = clone();
  ds.roots.push(rootRec("ز ل ز ل ز"));
  rejects("a five-letter root is rejected until a five-letter category is defined", ds, /letters must be an array of 3 or 4 letters/);
}
{
  const ds = clone();
  ds.taxonomy.root_category.push({ id: "khumasi", ar: "خماسي", radicals: 5 });
  ds.roots.push(rootRec("ز ل ز ل ز", { root_category: "khumasi" }));
  valid("a new root category is added in the taxonomy only: five letters become valid with no code change", ds);
}
{
  const ds = clone();
  ds.taxonomy.root_category = ds.taxonomy.root_category.filter(c => c.radicals !== 4);
  ds.roots.push(rootRec("ز ل ز ل"));
  rejects("allowed lengths are read from the taxonomy (removing the 4-letter category rejects ز ل ز ل)", ds, /letters must be an array of 3 letters/);
}

/* ---- not silently normalised ---- */
ok("splitRoot keeps all four letters of ز ل ز ل", rootModel.splitRoot("ز ل ز ل").join(" ") === "ز ل ز ل" && rootModel.splitRoot("ز ل ز ل").length === 4);
ok("a quadriliteral sound root is typed sahih_salim, not mudaaf (that class is for triliteral doubled roots)", rootModel.rootTypeOf(["ز", "ل", "ز", "ل"]) === "sahih_salim");
ok("a three-letter doubled root keeps its class (ز ل ل is mudaaf)", rootModel.rootTypeOf(["ز", "ل", "ل"]) === "mudaaf");
{
  let threw = false;
  try { rootModel.rootTypeOf(["و", "س", "و", "س"]); } catch (e) { threw = /not defined by the project/.test(e.message); }
  ok("a four-letter root with a weak letter is not auto-typed (an editor must choose)", threw);
}
{
  const bad = rootModel.problemsWithRoot("ز ل ز ل", base.taxonomy);
  ok("problemsWithRoot reports nothing for ز ل ز ل", bad.length === 0);
}
{
  /* The production data: the four-letter forms stay the first candidate and are not rewritten to the doubled triliteral. */
  for (const id of ["zalzala-1", "zilzal-1"]) {
    const l = find(base.lemmas, "lemma_id", id);
    ok(`${id}: first candidate is the four-letter ز ل ز ل`, l.root.candidates[0] === "ز ل ز ل", JSON.stringify(l.root.candidates));
    ok(`${id}: no root is assigned (status stays ${l.root.status}, root_id null)`, l.root.root_id === null && l.root.status === "disputed");
    ok(`${id}: ز ل ل is not the assigned root`, !base.roots.some(r => r.display === "ز ل ل" && r.root_id === l.root.root_id));
  }
  ok("no production root was auto-created as ز ل ل or ز ل ز ل", !base.roots.some(r => r.display === "ز ل ل" || r.display === "ز ل ز ل"));
  const c = find(base.conflicts, "conflict_id", "cf-root-zalzal");
  ok("conflict cf-root-zalzal still lists the four-letter value first", c.competing[0].value === "ز ل ز ل" && c.decision.chosen === null);
}

/* ---- source indexing never overwrites the QURRA assignment ---- */
{
  const ds = clone();
  const four = rootRec("ز ل ز ل", { root_category: "rubai" });
  ds.roots.push(four);
  const l = find(ds.lemmas, "lemma_id", "abada-1");        // a spare provisional lemma used as the fixture
  const before = l.root.root_id;
  l.root.root_id = four.root_id;
  l.root.candidates = [];
  l.root.source_indexing = [{ source_id: "QURRA_ROOT_PROTOCOL", indexed_under: "ز ل ل", location: "fixture" }];
  valid("a lemma assigned ز ل ز ل may carry source indexing under ز ل ل", ds);
  ok("after validation the QURRA root_id is still ز ل ز ل (indexing did not overwrite it)", l.root.root_id === four.root_id && l.root.root_id !== before && l.root.source_indexing[0].indexed_under === "ز ل ل");
}
{
  const ds = clone();
  const l = find(ds.lemmas, "lemma_id", "abada-1");
  l.root.source_indexing = [{ source_id: "QURRA_ROOT_PROTOCOL", indexed_under: "ز ل ل", root_id: "root-z-l-l" }];
  rejects("source indexing that tries to carry a root_id is rejected", ds, /evidence only and must not carry a root_id/);
}
{
  const ds = clone();
  find(ds.lemmas, "lemma_id", "abada-1").root.source_indexing = [{ source_id: "QURRA_ROOT_PROTOCOL", indexed_under: "ز" }];
  rejects("source indexing needs at least two letters", ds, /needs at least 2 letters/);
}
{
  const ds = clone();
  find(ds.lemmas, "lemma_id", "abada-1").root.source_indexing = [{ source_id: "QURRA_ROOT_PROTOCOL", indexed_under: "ي د" }];
  valid("source indexing may be a two-letter heading (a classical source can index يد as biliteral)", ds);
}
{
  const ds = clone();
  find(ds.lemmas, "lemma_id", "abada-1").root.candidates = ["ز ل"];
  rejects("a root candidate of a wrong length is rejected", ds, /has 2 letters; allowed lengths: 3, 4/);
}

/* ---- the classical cross-check keeps the two ideas apart ---- */
{
  const cc = JSON.parse(fs.readFileSync(path.join(ROOT, "data/qurra/review/classical-crosscheck.json"), "utf8"));
  ok("the cross-check states the difference between QURRA assignment and source indexing", /Source indexing/.test(cc.method_note) && /never replaces the QURRA root/.test(cc.method_note));
  const z = cc.findings.filter(f => f.key === "zalzala");
  ok("zalzala findings exist", z.length >= 2);
  z.forEach(f => {
    ok(`${f.review_id}: QURRA root candidates keep ز ل ز ل first`, f.qurra_value.root.candidates[0] === "ز ل ز ل");
    ok(`${f.review_id}: category is quadriliteral (rubai)`, f.qurra_root_category === "rubai");
    ok(`${f.review_id}: source indexing under ز ل is recorded as indexing, separate from the QURRA root`, Array.isArray(f.source_indexing) && f.source_indexing.every(s => s.indexed_under === "ز ل"));
    ok(`${f.review_id}: the finding never recommends replacing ز ل ز ل by ز ل ل`, !/Strong evidence for ز ل ل/.test(f.recommendation) && /Do not treat the evidence as support for replacing/.test(f.recommendation));
  });
  ["waswas", "damdama"].forEach(k => cc.findings.filter(f => f.key === k).forEach(f => ok(`${f.review_id} (${k}): quadriliteral candidate kept, indexing separate`, f.qurra_root_category === "rubai" && Array.isArray(f.source_indexing))));
}

/* ---- the audit file exists and flags the known cases without assigning anything ---- */
{
  const a = JSON.parse(fs.readFileSync(path.join(ROOT, "data/qurra/review/quadriliteral-audit.json"), "utf8"));
  const ids = a.B_lemmas_with_four_letter_root_candidates.map(x => x.lemma_id).sort().join(",");
  ok("the audit flags exactly the five lemmas that have four-letter root candidates", ids === "damdama-1,waswas-1,waswasa-1,zalzala-1,zilzal-1", ids);
  ok("the audit records that no root is assigned", a.B_lemmas_with_four_letter_root_candidates.every(x => x.root_id === null));
}

console.log(`test-roots: ${passed} passed, ${failed} failed`);
process.exit(failed ? 1 : 0);
