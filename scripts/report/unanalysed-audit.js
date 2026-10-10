#!/usr/bin/env node
"use strict";
/* Coverage audit by DISTINCT SPELLING (read-only; nothing here is an analysis).

   Compares the analysis layer before the coverage expansion (the fingerprint in scripts/tests/fixtures/baseline-analysis-v1.json)
   with the layer now, and lists every spelling that is still unanalysed with:
     - its token count and example references,
     - a HEURISTIC guess of its category (noun / verb / particle / other), from the spelling alone,
     - whether its consonants match an existing lexicon lemma (a possible known variant),
     - whether it is a homograph that needs context,
     - how much coverage a lexicon entry for it would add.
   The category is a work-queue hint for editors. It is never written into the analysis data.

   Usage: node scripts/report/unanalysed-audit.js          writes data/qurra/review/unanalysed-spellings.json
          node scripts/report/unanalysed-audit.js --check  fails if that file is stale */
const fs = require("fs");
const path = require("path");
const { loadDataset } = require("../lib/load-data");
const { skeleton } = require("../lib/arabic");

const ROOT = path.resolve(__dirname, "..", "..");
const OUT = path.join(ROOT, "data", "qurra", "review", "unanalysed-spellings.json");
const ds = loadDataset(ROOT);
const baseFile = JSON.parse(fs.readFileSync(path.join(ROOT, "scripts", "tests", "fixtures", "baseline-analysis-v1.json"), "utf8"));
const baseRule = new Set(baseFile.rule_surfaces);
const report = JSON.parse(fs.readFileSync(path.join(ROOT, "data", "qurra", "generated", "report.json"), "utf8"));

/* ---- occurrences ---- */
const occ = new Map();                        // spelling -> { n, refs }
const pilotTokens = new Set(ds.effectiveTokenForms.map(t => t.token_id));
let pilotOnly = 0;
ds.tokens.forEach(t => {
  const o = occ.get(t.text) || { n: 0, refs: [] };
  o.n++; if (o.refs.length < 3) o.refs.push(t.token_id);
  occ.set(t.text, o);
});
// "analysed" here means a RESOLVED analysis: an explicit unresolved record (status unresolved) is coverage by the record system, not an analysis
const nowAnalysed = new Set(ds.forms.filter(f => f.basis === "rule_default" && f.status !== "unresolved").map(f => f.surface));
const isAnalysedNow = s => nowAnalysed.has(s);
const isAnalysedBefore = s => baseRule.has(s);

/* ---- before / after numbers (tokens: a pilot token counts through its own form) ---- */
const tokenAnalysedNow = t => pilotTokens.has(t.token_id) || isAnalysedNow(t.text);
const tokenAnalysedBefore = t => pilotTokens.has(t.token_id) || isAnalysedBefore(t.text);
const total = ds.tokens.length, spellings = occ.size;
const num = f => ds.tokens.filter(f).length;
const before = { tokens_analysed: num(tokenAnalysedBefore) };
const after = { tokens_analysed: num(tokenAnalysedNow) };
before.tokens_unanalysed = total - before.tokens_analysed; after.tokens_unanalysed = total - after.tokens_analysed;
before.spellings_analysed = [...occ.keys()].filter(isAnalysedBefore).length; after.spellings_analysed = [...occ.keys()].filter(isAnalysedNow).length;
before.spellings_unanalysed = spellings - before.spellings_analysed; after.spellings_unanalysed = spellings - after.spellings_analysed;
before.percent = +(before.tokens_analysed / total * 100).toFixed(2); after.percent = +(after.tokens_analysed / total * 100).toFixed(2);

/* ---- helpers for the heuristic hints ---- */
const strip = s => skeleton(s).replace(/[^ء-ي]/g, "");
const cons = s => s.replace(/[اوي]/g, "");
const PRE = ["وال", "فال", "بال", "كال", "لل", "ال", "وب", "ول", "وس", "فس", "وي", "وت", "ون", "وا", "فا", "و", "ف", "ب", "ل", "ك", "س"];
const SUF = ["ونهم", "ونها", "كما", "كم", "هم", "هن", "هما", "نا", "ها", "ون", "ين", "ان", "ات", "وا", "ته", "ت", "ه", "ك", "ي", "ا", "ن"];
function core(s) {
  let t = strip(s);
  for (const p of PRE) if (t.startsWith(p) && t.length - p.length >= 3) { t = t.slice(p.length); break; }
  for (const x of SUF) if (t.endsWith(x) && t.length - x.length >= 3) { t = t.slice(0, -x.length); break; }
  return t;
}
const lemmaByConsonants = new Map();
ds.lemmas.forEach(l => {
  const k = cons(core(l.form_vocalized)) || strip(l.form_vocalized);
  if (!lemmaByConsonants.has(k)) lemmaByConsonants.set(k, []);
  lemmaByConsonants.get(k).push(l.lemma_id);
});
const DIAC = /[ً-ٰٟ]/g;
function guessCategory(sp) {
  const bare = sp.replace(DIAC, "").replace(/[ۖ-ۭ]/g, "");
  const letters = strip(sp);
  if (/^ٱل/.test(sp) || /[ًٌٍ]$|ة$/.test(sp.replace(/[ۖ-ۭ]/g, ""))) return ["noun", "begins with the article or ends in tanween / ta marbuta"];
  if (/[ُ]وا[۟]?$|ْ[تن]/.test(sp) || /^[يتنأ][َُِ]/.test(sp)) return ["verb", "imperfect prefix or a perfect/plural verb ending"];
  if (letters.length <= 3) return ["particle_or_short_form", "three letters or fewer"];
  if (/ين$|ون$|ات$/.test(letters)) return ["noun", "plural ending"];
  return ["unknown", "no reliable cue in the spelling"];
}
// spellings left unanalysed on purpose because one spelling stands for several different words; they need context
const HOMOGRAPH = {
  "هُودًا": "the prophet Hud, or the Jews (hud)",
  "هُودٍ": "the prophet Hud, or 'Jews'",
  "هُودٌ": "the prophet Hud, or 'Jews'",
  "يَحْيَىٰ": "the name Yahya, or the verb 'to live'",
  "وَيَحْيَىٰ": "the name Yahya, or the verb 'to live'",
  "بِيَحْيَىٰ": "the name Yahya, or the verb 'to live'",
  "أَسْرَىٰ": "the verb 'to travel by night' (17:1), or the noun 'captives' (8:67)",
  "أَحْسَنَ": "the verb 'to do good', or the elative 'best' (accusative)",
  "عَادَ": "the verb 'to return', or the people of Aad"
};

/* ---- the list of what is still unanalysed ---- */
const remaining = [];
let id = 0;
for (const [sp, o] of occ) {
  if (isAnalysedNow(sp)) continue;
  const [category, basis] = guessCategory(sp);
  const k = cons(core(sp)) || core(sp);
  const known = (lemmaByConsonants.get(k) || []).slice(0, 4);
  const hg = HOMOGRAPH[sp] || null;
  const e = {
    spelling: sp, tokens: o.n, examples: o.refs,
    likely_category: category, category_basis: basis,
    known_variant_of: known.length ? known : null,
    existing_rule_can_analyse: false,
    gap: known.length ? "a lexicon form is missing for a lemma with the same consonants" : "no lemma with these consonants in the lexicon",
    homograph_needs_context: !!hg, ...(hg ? { homograph_note: hg } : {}),
    confidence: hg ? "context_required" : known.length ? "medium" : category === "unknown" ? "low" : "low",
    expected_coverage_gain_tokens: o.n,
    status: hg ? "homograph_context_required" : "needs_lexicon_entry"
  };
  remaining.push(e);
}
remaining.sort((a, b) => b.tokens - a.tokens || (a.spelling < b.spelling ? -1 : 1));
remaining.forEach((e, i) => { e.rank = i + 1; });

const byCat = {};
remaining.forEach(e => { byCat[e.likely_category] = byCat[e.likely_category] || { spellings: 0, tokens: 0 }; byCat[e.likely_category].spellings++; byCat[e.likely_category].tokens += e.tokens; });
const freqBands = {};
remaining.forEach(e => { const b = e.tokens >= 10 ? "10+" : e.tokens >= 5 ? "5-9" : e.tokens >= 3 ? "3-4" : e.tokens === 2 ? "2" : "1"; freqBands[b] = freqBands[b] || { spellings: 0, tokens: 0 }; freqBands[b].spellings++; freqBands[b].tokens += e.tokens; });

// lemmas added by the expansion whose root is deliberately left open: a root needs classical-source evidence first
const baseLemmas = new Set(Object.keys(baseFile.records.lemmas));
const needSource = ds.lemmas.filter(l => !baseLemmas.has(l.lemma_id) && ["unresolved", "disputed"].includes(l.root.status)).map(l => ({ lemma_id: l.lemma_id, form: l.form_vocalized, root_status: l.root.status, flag: "source_review_required" }));
const out = {
  schema: "qurra-unanalysed-spellings/1",
  note: "Read-only audit of the spellings that still have no analysis. Categories are heuristic hints from the spelling alone (never analysis data). Nothing in this file changes the analysis layer, any root, or any disputed decision.",
  tokens_in_text: total, distinct_spellings: spellings,
  before_expansion: before, after_expansion: after,
  gained: { tokens: after.tokens_analysed - before.tokens_analysed, spellings: after.spellings_analysed - before.spellings_analysed },
  remaining_by_likely_category: byCat,
  remaining_by_frequency: freqBands,
  lemmas_added_with_root_left_open: needSource,
  homograph_defaults: report.defaults_with_other_readings,
  ambiguous_left_unanalysed: report.ambiguous_top,
  unanalysed_spellings: remaining
};
const text = JSON.stringify(out) + "\n";
if (process.argv.includes("--check")) {
  if (!fs.existsSync(OUT) || fs.readFileSync(OUT, "utf8") !== text) { console.error("STALE data/qurra/review/unanalysed-spellings.json — run: node scripts/report/unanalysed-audit.js"); process.exit(1); }
  console.log("unanalysed-spellings audit: up to date");
} else {
  fs.mkdirSync(path.dirname(OUT), { recursive: true });
  fs.writeFileSync(OUT, text);
  console.log("before", JSON.stringify(before)); console.log("after ", JSON.stringify(after));
  console.log("remaining spellings", remaining.length, "categories", JSON.stringify(byCat)); console.log("bands", JSON.stringify(freqBands));
}
