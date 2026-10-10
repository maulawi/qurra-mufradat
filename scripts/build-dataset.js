#!/usr/bin/env node
"use strict";
/* ==========================================================================
   source data (data/)  ->  generated browser files (js/generated/)

     data/ (all JSON files)  --validate-->  js/generated/dataset.js       (QM_DATASET)
                                    js/generated/search-index.js  (QM_SEARCH_INDEX)

   Output is deterministic (no timestamps; key order follows the source files),
   so `--check` can verify in CI that the committed generated files are current.
   The browser app stays a static page: it loads these two files with <script>,
   so it works from file:// and GitHub Pages and keeps a synchronous data API.

   Usage:  node scripts/build-dataset.js            write generated files
           node scripts/build-dataset.js --check    fail if generated files are stale
   ========================================================================== */
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const { loadDataset, FILES } = require("./lib/load-data");
const { validate } = require("./lib/validate");
const { textNotice, metadataNotice } = require("./lib/tanzil");
const N = require("../js/normalize");
const Res = require("./lib/resolution");

const ROOT = path.resolve(__dirname, "..");
const OUT_DIR = path.join(ROOT, "js", "generated");
const check = process.argv.includes("--check");

const ds = loadDataset(ROOT);
const { errors, warnings } = validate(ds);
if (errors.length) {
  errors.forEach(e => console.error("ERROR " + e));
  console.error(`build-dataset: refusing to build — ${errors.length} validation error(s).`);
  process.exit(1);
}

const sha = s => crypto.createHash("sha256").update(s).digest("hex");
const sourceHashes = {};
Object.keys(FILES).forEach(k => { sourceHashes[FILES[k][0]] = sha(ds._files[k]).slice(0, 16); });

/* ---------------- dataset ---------------- */
// juz of an ayah = the last juz whose start is at or before it (data/meta/juz.json holds starts only).
function juzOf(surah, ayah) {
  let n = 1;
  ds.juz.forEach(j => { if (j.start.surah < surah || (j.start.surah === surah && j.start.ayah <= ayah)) n = j.juz; });
  return n;
}
const ayahsOut = ds.ayahs.map(a => ({ ayah_id: a.ayah_id, surah: a.surah, ayah: a.ayah, juz: juzOf(a.surah, a.ayah), text: a.text }));
const tokenCount = ds.tokens.length;

const POS_CODE = { noun: "n", verb: "v", particle: "p" };
const lemmaByIdAll = new Map(ds.lemmas.map(l => [l.lemma_id, l]));
// record resolution (see scripts/lib/resolution.js): [code k|p|x|u, alternatives|0, candidates|0, source_review_required 1|0, status unresolved 1|0]
const compactForm = f => [
  f.form_id.replace(/^frm-sd-/, ""), f.surface,
  f.segments.map(s => [s.type[0], s.surface, POS_CODE[s.pos] || 0, s.function || 0, s.lemma_id || 0, s.pronoun_features ? [s.pronoun_features.person, s.pronoun_features.number, s.pronoun_features.gender || 0] : 0]),
  f.morphology, f.segmentation_note || 0,
  [Res.CODE[f.resolution || Res.resolutionOfForm(f, lemmaByIdAll).resolution], (f.alternatives && f.alternatives.length) ? f.alternatives : 0, (f.candidates && f.candidates.length) ? f.candidates : 0, f.source_review_required ? 1 : 0, f.status === "unresolved" ? 1 : 0]];
const ruleForms = ds.forms.filter(f => f.basis === "rule_default").map(compactForm);
// readings chosen for one token (basis rule_context): the same compact form, plus the token they belong to
const contextForms = ds.forms.filter(f => f.basis === "rule_context");
const ctxCompact = contextForms.map(f => [...compactForm(f), f.context_token]);
// pilot (hand-written) forms get their resolution here, from their lemmas' roots
const pilotForms = ds.forms.filter(f => !f.basis).map(f => ({ ...f, resolution: Res.resolutionOfForm(f, lemmaByIdAll).resolution, ...(Res.resolutionOfForm(f, lemmaByIdAll).source_review_required ? { source_review_required: true } : {}) }));
// tokens where the pilot recorded competing analyses: context-dependent at token level
const contextTokens = ds.analysisSets.filter(a => a.candidates.length > 1).map(a => a.token_id).sort();

const dataset = {
  meta: {
    schema_version: "2.0.0",
    taxonomy_version: ds.taxonomy.taxonomy_version,
    sources_registry_version: null,
    counts: {
      surahs: ds.surahs.length, ayahs: ds.ayahs.length, tokens: tokenCount, analysed_tokens: ds.effectiveTokenForms.length, forms: ds.forms.filter(f => !f.basis).length, rule_forms: ruleForms.length,
      lemmas: ds.lemmas.length, roots: ds.roots.length, glosses: ds.glosses.length
    },
    // candidate analyses and conflicts are not shipped to the browser; only the chosen assignments are
    analysis_layer: { analysis_sets: ds.analysisSets.length, candidate_analyses: ds.analysisSets.reduce((n, x) => n + x.candidates.length, 0), conflicts: ds.conflicts.length },
    source_files_sha256_16: sourceHashes
  },
  taxonomy: ds.taxonomy,
  sources: ds.sources,
  surahs: ds.surahs,
  juz: ds.juz,
  ayahs: ayahsOut,
  // the Token -> Form assignments in force: direct assignments plus the chosen candidate of every analysis set
  token_forms: ds.effectiveTokenForms,
  forms: pilotForms,
  context_tokens: contextTokens,
  // rule-based default analyses, one per distinct spelling (shared by every token with that spelling), in a compact positional form:
  // [id, surface, [[type, surface, pos, function, lemma_id, [person, number, gender]]...], morphology, note]
  rule_forms: ruleForms,
  context_forms: ctxCompact,
  lemmas: ds.lemmas,
  roots: ds.roots,
  glosses: ds.glosses,
  // metadata only; the texts live in js/generated/translations.js (loaded separately: ~1 MB)
  translation_editions: ds.translationEditions.map(ed => {
    const recs = ds.translationTexts[ed.translation_id].records, rep = ds.translationReports[ed.translation_id];
    const e = { ...ed, ayah_count: recs.length, unresolved_ayahs: rep ? rep.unresolved_ayahs : [] };
    delete e.file; delete e.alignment_report;
    return e;
  })
};
const translations = {
  note: "Generated. Ayah translations by edition: texts[translation_id][ayah_id]. Only editions registered in data/translations/editions.json; see each edition's clearance and attribution in QM_DATASET.translation_editions.",
  texts: Object.fromEntries(ds.translationEditions.map(ed => [ed.translation_id,
    Object.fromEntries(ds.translationTexts[ed.translation_id].records.map(r => [r.ayah_id, r.text]))])),
  working_status: Object.fromEntries(ds.translationEditions.map(ed => [ed.translation_id, Object.fromEntries(ds.translationTexts[ed.translation_id].records.filter(r => r.status).map(r => [r.ayah_id, r.status]))]))
};
dataset.meta.sources_registry_version = JSON.parse(ds._files.sources).registry_version;

/* ---------------- search index ---------------- */
const policy = ds.taxonomy.display_policy;
const visible = (layer, status) => ["show", "show_with_badge"].includes(policy[layer][status]);
const lemmaById = new Map(ds.lemmas.map(l => [l.lemma_id, l]));
const rootById = new Map(ds.roots.map(r => [r.root_id, r]));

const ar = [];     // [normalizedArabicKey, kind, id]
const latin = [];  // [normalizedLatinKey, kind, id, lang]
const latinRaw = []; // [lowercased text, kind, id, lang] for substring matching on phrases

// Two matching variants per Arabic key (see js/normalize.js): dagger alef dropped / dagger alef as full alef.
function pushAr(text, kind, id) {
  const a = N.normalizeArabic(text), b = N.normalizeArabic(text, { daggerAsAlef: true });
  ar.push([a, kind, id]);
  if (b !== a) ar.push([b, kind, id]);
}
ds.lemmas.forEach(l => pushAr(l.form_vocalized, "lemma", l.lemma_id));
ds.surahs.forEach(s => {
  pushAr(s.name_ar, "surah", String(s.number));
  latin.push([N.normalizeLatin(s.name_en), "surah", String(s.number), "en"]);
});
ds.glosses.forEach(g => {
  const l = lemmaById.get(g.lemma_id);
  if (!l || !visible("gloss", g.status)) return;           // hidden glosses are not searchable
  ["en", "ms"].forEach(lang => { if (g.lexical[lang]) latinRaw.push([g.lexical[lang].toLowerCase(), "lemma", g.lemma_id, lang]); });
});
// A root is searchable only if at least one lemma's root assignment would be displayed to learners.
const searchableRoots = new Set();
ds.lemmas.forEach(l => { if (l.root.root_id && visible("root", l.root.status)) searchableRoots.add(l.root.root_id); });
[...searchableRoots].sort().forEach(id => {
  const r = rootById.get(id);
  pushAr(r.letters.join(""), "root", id);
  ["en", "ms"].forEach(lang => { if (r.core_field[lang]) latinRaw.push([r.core_field[lang].toLowerCase(), "root", id, lang]); });
});
const byKey = (a, b) => (a[1] + a[2] + a[0]).localeCompare(b[1] + b[2] + b[0]);
ar.sort(byKey); latin.sort(byKey); latinRaw.sort(byKey);

// Normalised ayah text (matching only, never displayed), aligned with dataset.ayahs. Word hits are found by scanning these.
const ayahNorm = ds.ayahs.map(a => N.normalizeArabic(a.text));
const ayahNormAlt = ds.ayahs.map(a => N.normalizeArabic(a.text, { daggerAsAlef: true }));

const index = {
  version: 1,
  normalization: "js/normalize.js (marks removed; alef/ya/ta-marbuta unified)",
  note: "Generated. Contains only fields that are populated and visible under taxonomy.display_policy: unresolved/disputed roots and hidden glosses are intentionally absent. ayah_norm[i] / ayah_norm_alt[i] are the two normalised variants of dataset.ayahs[i].text (matching only; never displayed).",
  ar, latin, latin_text: latinRaw, ayah_norm: ayahNorm, ayah_norm_alt: ayahNormAlt
};

/* ---------------- write / check ---------------- */
function render(name, constName, obj) {
  // Tanzil asks that its notice be reproduced in files derived from its text: carried verbatim from the raw files.
  const notice = [
    "This file contains, or is derived from, the Tanzil Quran text and metadata (https://tanzil.net).",
    "See also the NOTICE file. The notices supplied by Tanzil, verbatim:", "",
    ...textNotice(ds.rawText), "", ...metadataNotice(ds.rawMeta)
  ].join("\n");
  const header = `/* GENERATED by scripts/build-dataset.js — DO NOT EDIT. Edit data/*.json and run: node scripts/build.js\n\n${notice}\n*/\n`;
  return `${header}const ${constName} = ${JSON.stringify(obj, null, 1)};\n`;
}
/** Pickthall's text is public domain and carries no Tanzil text; the file therefore carries only its own attribution. */
function renderTranslations(obj) {
  const header = ["/* GENERATED by scripts/build-dataset.js — DO NOT EDIT. Edit data/translations/* and run: node scripts/build.js", "",
    "Translation texts. en-pickthall-1930: Marmaduke Pickthall, The Meaning of the Glorious Koran (1930), public domain; text as transcribed in the gutenberg.org e-text #16955 (wrapped lines joined; otherwise verbatim). The en/ms working renderings are QURRA's own prototype wording. See the NOTICE file.", "*/", ""].join("\n");
  return header + "const QM_TRANSLATIONS = " + JSON.stringify(obj) + ";\n";
}
const outputs = {
  "dataset.js": render("dataset.js", "QM_DATASET", dataset),
  "search-index.js": render("search-index.js", "QM_SEARCH_INDEX", index),
  "translations.js": renderTranslations(translations)
};

fs.mkdirSync(OUT_DIR, { recursive: true });
let stale = 0;
for (const [name, content] of Object.entries(outputs)) {
  const p = path.join(OUT_DIR, name);
  if (check) {
    const cur = fs.existsSync(p) ? fs.readFileSync(p, "utf8") : null;
    if (cur !== content) { stale++; console.error(`STALE js/generated/${name} — run: node scripts/build.js`); }
  } else {
    fs.writeFileSync(p, content, "utf8");
    console.log(`wrote js/generated/${name} (${(content.length / 1024).toFixed(1)} KB)`);
  }
}
warnings.forEach(w => console.log("warn  " + w));
if (check) {
  if (stale) process.exit(1);
  console.log("build-dataset --check: generated files are up to date");
}
