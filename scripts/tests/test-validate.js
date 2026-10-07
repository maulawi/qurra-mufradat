#!/usr/bin/env node
"use strict";
/* Mutation tests for the validator: start from the real dataset (must be valid), apply one defect at a
   time, and assert the validator reports it. Also asserts that intentionally-unresolved data is VALID. */
const path = require("path");
const { loadDataset } = require("../lib/load-data");
const { validate } = require("../lib/validate");

const ROOT = path.resolve(__dirname, "..", "..");
const base = loadDataset(ROOT);
// Fast clone: the two big arrays (ayahs, tokens) are copied one level deep (the tests only mutate their top-level fields);
// everything else is deep-cloned. Strings (raw text) are immutable and shared.
const BIG = new Set(["ayahs", "tokens"]);
const clone = () => {
  const c = { ...base };
  for (const k of Object.keys(base)) {
    if (k === "_files" || typeof base[k] === "string") continue;
    c[k] = BIG.has(k) ? base[k].map(x => ({ ...x })) : structuredClone(base[k]);
  }
  return c;
};

let failed = 0, passed = 0;
function check(name, ds, expectErrorMatching) {
  const { errors } = validate(ds);
  const ok = expectErrorMatching === null ? errors.length === 0 : errors.some(e => expectErrorMatching.test(e));
  if (ok) passed++; else { failed++; console.error(`FAIL ${name}\n  expected ${expectErrorMatching === null ? "no errors" : "error matching " + expectErrorMatching}\n  got: ${errors.slice(0, 4).join(" | ") || "(none)"}`); }
}
const find = (arr, key, id) => arr.find(x => x[key] === id);

check("baseline dataset is valid", clone(), null);

/* ---- intentionally unresolved data must be VALID ---- */
{
  const ds = clone();
  const stem = find(ds.forms, "form_id", ds.tokens[0].form_id).segments.find(s => s.type === "stem");
  stem.lemma_id = null;
  check("stem lemma_id = null is valid", ds, null);
}
{
  const ds = clone();
  const l = find(ds.lemmas, "lemma_id", "rahman-1");
  l.root = { root_id: null, status: "unresolved", candidates: [], rule_ids: [], evidence: [], provenance: { source_id: "QURRA_ROOT_PROTOCOL", status: "pending_expert_review" } };
  check("root_id = null with status unresolved is valid", ds, null);
}
{
  // A form with TWO stem segments (multi-stem) must be valid, with a lemma on one and null on the other.
  const ds = clone();
  const f = ds.forms[0];
  const stem = f.segments.find(s => s.type === "stem");
  f.segments.push({ segment_id: f.form_id + ".s9", type: "stem", surface: stem.surface, pos: stem.pos, lemma_id: null });
  f.segmentation_note = { en: "test fixture", ms: "ujian" };
  check("a form with two stem segments is valid", ds, null);
}

/* ---- defects that must fail loudly ---- */
{ const ds = clone(); ds.tokens.push(JSON.parse(JSON.stringify(ds.tokens[0]))); check("duplicate token id", ds, /duplicate token_id/); }
{ const ds = clone(); ds.lemmas.push(JSON.parse(JSON.stringify(ds.lemmas[0]))); check("duplicate lemma id", ds, /duplicate lemma_id/); }
{ const ds = clone(); ds.forms.push(JSON.parse(JSON.stringify(ds.forms[0]))); check("duplicate form id", ds, /duplicate form_id/); }
{ const ds = clone(); ds.tokens[0].form_id = "frm-does-not-exist"; check("token -> nonexistent form", ds, /form_id "frm-does-not-exist" does not exist/); }
{
  const ds = clone();
  find(ds.forms, "form_id", ds.tokens[0].form_id).segments.find(s => s.type === "stem").lemma_id = "no-such-lemma";
  check("form -> nonexistent lemma", ds, /lemma_id "no-such-lemma" does not exist/);
}
{ const ds = clone(); find(ds.lemmas, "lemma_id", "rahman-1").root.root_id = "root-x"; check("lemma -> nonexistent root", ds, /root_id "root-x" does not exist/); }
{
  const ds = clone();
  const t = ds.tokens.find(x => x.ayah_id === "1:2" && x.position === 2);
  t.position = 1; t.token_id = "1:2:1";
  check("duplicate token positions", ds, /duplicate token_id|duplicate token positions|positions must be contiguous/);
}
{ const ds = clone(); ds.tokens.find(x => x.position === 2).position = 7; check("token position gap / id mismatch", ds, /token_id must equal|contiguous/); }
{ const ds = clone(); ds.lemmas[0].status = "approved-ish"; check("unsupported status", ds, /unsupported status "approved-ish"/); }
{ const ds = clone(); ds.tokens[0].status = "final"; check("unsupported token status", ds, /unsupported status "final"/); }
{ const ds = clone(); delete ds.lemmas[0].form_vocalized; check("missing required field", ds, /missing required field "form_vocalized"/); }
{ const ds = clone(); ds.forms[0].surface = "abc"; check("malformed Arabic (latin letters in surface)", ds, /non-Arabic|does not equal its form's surface/); }
{ const ds = clone(); ds.ayahs[0].text = ds.ayahs[0].text + " "; check("malformed Arabic spacing in ayah", ds, /malformed spacing|non-Arabic/); }
{ const ds = clone(); ds.ayahs[0].text = ds.ayahs[0].text.replace("ٱ", "ا"); check("canonical text edited vs raw source", ds, /differs from the official|drifted apart/); }
{ const ds = clone(); const tk = ds.tokens.find(t => t.text.includes("ٱ")); tk.text = tk.text.replace("ٱ", "ا"); check("token text drifts from ayah text", ds, /drifted apart|does not equal its form/); }
{ const ds = clone(); ds.lemmas[0].id = "x"; ds.lemmas[0].lemma_id = "bad id é"; check("non-ASCII / unsafe id", ds, /not ASCII-safe/); }
{
  const ds = clone();
  find(ds.lemmas, "lemma_id", "ism-1").root.root_id = "root-3-l-m";
  check("disputed lemma silently assigned a root", ds, /must not carry a root_id/);
}
{
  const ds = clone();
  const l = find(ds.lemmas, "lemma_id", "rahman-1");
  l.root.status = "reviewed";
  check("reviewed root without evidence/reviewer", ds, /requires recorded evidence/);
}
{ const ds = clone(); ds.roots[0].display = ds.roots[0].display.replace(/ /g, ""); check("root display not canonical", ds, /display .* must equal letters joined/); }
{ const ds = clone(); ds.roots[0].letters[0] = "أ"; check("root letter not canonical (hamza seat)", ds, /not an allowed canonical root letter/); }
{ const ds = clone(); find(ds.lemmas, "lemma_id", "rahman-1").root.provenance = { source_id: "QAC" }; check("provenance from a not-cleared source (QAC)", ds, /in_use=false/); }
{ const ds = clone(); find(ds.lemmas, "lemma_id", "rahman-1").root.provenance = { source_id: "NO_SUCH" }; check("provenance with unknown source", ds, /unknown source_id/); }
{ const ds = clone(); ds.juz[3].start.ayah = 94; check("juz start differs from the official metadata", ds, /differs from official metadata/); }

/* ---- full-Qur'an text and structure ---- */
{ const ds = clone(); ds.ayahs.splice(100, 1); check("missing ayah (record removed)", ds, /missing or extra ayahs|without gaps|no QURRA ayah record|expected 6236/); }
{ const ds = clone(); ds.ayahs.push({ ...ds.ayahs[5], ayah_id: "1:6" }); check("duplicate ayah id", ds, /duplicate ayah_id/); }
{ const ds = clone(); ds.surahs.splice(50, 1); check("missing surah", ds, /expected 114 surahs|missing surah 51/); }
{ const ds = clone(); ds.surahs.push({ ...ds.surahs[0], surah_id: "s999" }); check("duplicate surah number", ds, /duplicate surah number|expected 114/); }
{ const ds = clone(); ds.surahs[10].number = 200; check("invalid surah number", ds, /out of range 1..114/); }
{ const ds = clone(); ds.ayahs[3].ayah = 99; ds.ayahs[3].ayah_id = "1:99"; check("invalid ayah number", ds, /outside 1\.\.7/); }
{ const ds = clone(); ds.surahs[1].ayah_count = 285; check("surah ayah_count differs from the official metadata", ds, /differs from official metadata/); }
{ const ds = clone(); ds.rawText = ds.rawText.replace("ٱلْحَمْدُ", "الْحَمْدُ"); check("raw source line changed (text vs official)", ds, /differs from the official Tanzil line/); }
{ const ds = clone(); const a = ds.ayahs.find(x => x.source_prefix); delete a.source_prefix; check("basmala header not separated from ayah 1", ds, /starts with the basmala header/); }
{ const ds = clone(); ds.rawText = ds.rawText.replace(/Creative Commons Attribution 3\.0/g, "x"); check("copyright block removed from raw text", ds, /copyright block/); }
{ const ds = clone(); ds.notice = ds.notice.replace("Copyright (C) 2007-2026 Tanzil Project", "x"); check("NOTICE file missing the Tanzil copyright line", ds, /missing the Tanzil notice line/); }
{ const ds = clone(); ds._files = { ...ds._files, ayahs: ds._files.ayahs.replace(/"_notice": \[[^\]]*\],/, "") }; check("derived ayahs.json without the Tanzil notice", ds, /_notice must equal/); }
{ const ds = clone(); ds._files = { ...ds._files, surahs: ds._files.surahs.replace("Copyright (C) 2008-2009 Tanzil.info", "x") }; check("derived surahs.json with an altered Tanzil notice", ds, /_notice must equal/); }
{ const ds = clone(); ds.tokenForms.push({ token_id: "1:1:99", form_id: ds.forms[0].form_id, status: "provisional", provenance: { form: { source_id: "QURRA_DEMO_MORPHOLOGY" } } }); check("token_form for a nonexistent token", ds, /does not exist in the token layer/); }
{ const ds = clone(); ds.tokens.find(t => t.form_id === null).form_id = ds.forms[0].form_id; check("token silently given a form (not in token_forms)", ds, /does not equal its form's surface/); }
{ const ds = clone(); ds.tokens = ds.tokens.filter(t => t.token_id !== "2:5:3"); check("missing token position", ds, /contiguous|drifted apart/); }
{ const ds = clone(); ds.tokens.find(t => t.token_id === "2:5:3").ayah_id = "2:999"; check("token with invalid ayah reference", ds, /ayah_id "2:999" does not exist|token_id must equal/); }
{ const ds = clone(); ds.tokens.find(t => t.token_id === "2:5:3").token_id = "2:5:3 é"; check("malformed token id", ds, /not ASCII-safe|token_id must equal/); }
{ const ds = clone(); check_unanalysed_ok: { ds.tokens.find(t => t.token_id === "2:5:3").form_id = null; } check("unanalysed token (form_id null) is valid", ds, null); }
{ const ds = clone(); ds.sources[0].licence_status = "cleared"; check("invalid licence_status", ds, /licence_status "cleared"/); }
{
  const ds = clone();
  const f = find(ds.forms, "form_id", ds.tokens[0].form_id);
  f.segments = f.segments.filter(s => s.type !== "stem");
  check("form without a stem", ds, /at least one stem/);
}

console.log(`test-validate: ${passed} passed, ${failed} failed`);
process.exit(failed ? 1 : 0);
