#!/usr/bin/env node
/* ==========================================================================
   ONE-TIME MIGRATION (Stage 1 demo -> Stage 2 schema). NOT part of the normal
   build. Kept for provenance: it documents exactly how data/qurra/*.json and
   data/meta/*.json were produced from js/demoData.js (read from git history,
   commit 398f4f4: `git show 398f4f4:js/demoData.js`) plus a text extract.

   Everything it writes is then hand-editable source data; running it again
   would overwrite hand edits, so it refuses to run if data/qurra/ exists
   unless --force is given.

   Usage:
     node scripts/legacy/migrate-stage1-demo.js <path-to-uthmani-rows.json> [--force]

   <uthmani-rows.json> is the row list of the public text mirror used for the
   pilot ayahs (fields: verse_key, text, juz). Only the 9 pilot ayahs and the
   30 juz start positions are read from it; the full text is NOT imported.

   It invents nothing: roots, lemmas, glosses, morphology and renderings all
   come from the Stage 1 demo; only their shape, ids and statuses change.
   ========================================================================== */
"use strict";
const fs = require("fs");
const path = require("path");
const vm = require("vm");
const crypto = require("crypto");

const ROOT = path.resolve(__dirname, "..", "..");
const rowsPath = process.argv[2];
const force = process.argv.includes("--force");
if (!rowsPath) { console.error("usage: migrate-stage1-demo.js <uthmani-rows.json> [--force]"); process.exit(2); }
if (fs.existsSync(path.join(ROOT, "data", "qurra", "tokens.json")) && !force) {
  console.error("data/qurra already exists; refusing to overwrite hand-edited data (use --force)."); process.exit(2);
}

// ---- load the Stage 1 demo globals ----
// The Stage 1 demo data is not kept as a file any more: it is byte-identical to js/demoData.js in the first commit.
const demoSrc = require("child_process").execFileSync("git", ["show", "398f4f4:js/demoData.js"], { cwd: ROOT, encoding: "utf8" });
const ctx = {};
vm.createContext(ctx);
vm.runInContext(demoSrc + "\nthis.QM_ROOTS=QM_ROOTS;this.QM_LEMMAS=QM_LEMMAS;this.QM_TOKENS=QM_TOKENS;this.QM_AYAHS=QM_AYAHS;this.QM_SURAHS=QM_SURAHS;this.QM_JUZ=QM_JUZ;", ctx);
const { QM_ROOTS, QM_LEMMAS, QM_TOKENS, QM_AYAHS, QM_SURAHS, QM_JUZ } = ctx;

const taxonomy = JSON.parse(fs.readFileSync(path.join(ROOT, "data", "taxonomy.json"), "utf8"));
const LETTER_SLUG = taxonomy.root_letters.letters;

const rows = JSON.parse(fs.readFileSync(rowsPath, "utf8"));
const rowByKey = new Map(rows.map(r => [r.verse_key, r]));

// ---- ASCII-safe code remapping (the Stage 1 codes contained the modifier letter U+02BF) ----
const CODE_MAP = {
  "jamʿ": "jama", "jamʿ_mudhakkar_salim": "jama_mudhakkar_salim", "jamʿ_muannath_salim": "jama_muannath_salim",
  "jamʿ_taksir": "jama_taksir", "maʿrifa": "marifa", "ism_faʿil": "ism_fail", "ism_mafʿul": "ism_mafool",
  "mudariʿ": "mudari", "muʿrab": "murab", "duʿa": "dua"
};
const POS_MAP = { ism: "noun", "fiʿl": "verb", harf: "particle" };
const code = v => (typeof v === "string" && CODE_MAP[v]) ? CODE_MAP[v] : v;
const snake = k => ({ pluralType: "plural_type", referenceClass: "reference_class", functionHere: "function_here", grammaticalCase: "grammatical_case", form: "aspect" }[k] || k);

function mapMorphology(m) {
  const out = {};
  for (const [k, v] of Object.entries(m)) {
    if (k === "definiteness") out.definiteness = v === null ? null : { state: code(v.state), cause: v.cause === undefined ? undefined : v.cause };
    else out[snake(k)] = code(v);
  }
  return JSON.parse(JSON.stringify(out)); // drop undefined
}

// ---- roots: canonical letters (hamza written U+0621), ASCII ids ----
function canonLetters(s) { return Array.from(s).map(c => (c === "أ" || c === "إ" || c === "ؤ" || c === "ئ") ? "ء" : c); }
function rootIdFor(letters) {
  return "root-" + letters.map(l => { if (!LETTER_SLUG[l]) throw new Error("no slug for " + l); return LETTER_SLUG[l]; }).join("-");
}
const rootIdMap = {}; // old id -> new id
const roots = Object.values(QM_ROOTS).map(r => {
  const letters = canonLetters(r.letters);
  const id = rootIdFor(letters);
  rootIdMap[r.id] = id;
  return {
    root_id: id,
    letters,
    display: letters.join(" "),
    root_type: r.rootType,
    core_field: { en: r.coreField.en, ms: r.coreField.ms },
    status: "provisional",
    provenance: { letters: { source_id: "QURRA_DEMO_ROOTS" }, core_field: { source_id: "QURRA_GLOSS" } }
  };
}).sort((a, b) => a.root_id.localeCompare(b.root_id));

// ---- lemma root assignment status (NO new roots invented; only statuses assigned) ----
const DISPUTED = { "ism-1": ["س م و", "و س م"] };      // candidates exactly as recorded in the Stage 1 demo note
const UNRESOLVED = new Set(["allah-1"]);              // protocol RED item; no candidates recorded here
const CLOSED_CLASS = new Set(["ala-1", "la-1", "fi-1", "lam-1", "iyyaa-1", "alladhina-1", "dhalika-1", "kayfa-1"]); // particles, pronouns, demonstratives, relatives, interrogatives

function rootAssignment(l) {
  const base = { root_id: null, status: "unresolved", candidates: [], rule_ids: [], evidence: [], provenance: { source_id: "QURRA_ROOT_PROTOCOL", status: "pending_expert_review" } };
  if (l.rootId) {
    return Object.assign(base, {
      root_id: rootIdMap[l.rootId], status: "provisional",
      provenance: { source_id: "QURRA_DEMO_ROOTS", status: "stage1_placeholder_not_assigned_under_protocol" }
    });
  }
  if (DISPUTED[l.id]) return Object.assign(base, { status: "disputed", candidates: DISPUTED[l.id] });
  if (UNRESOLVED.has(l.id)) return Object.assign(base, { status: "unresolved" });
  if (CLOSED_CLASS.has(l.id)) return Object.assign(base, { status: "null_policy" });
  throw new Error("no root status decision for lemma " + l.id);
}

// ---- lemmas + glosses ----
const GLOSS_SPLIT = {
  "la-1": {
    lexical: { en: "no, not", ms: "tidak" },
    learner_note: { en: "A negation particle whose exact grammatical role depends on context (see its occurrences in this demo).", ms: "Kata nafi yang peranan nahunya bergantung kepada konteks (rujuk kemunculannya dalam demo ini)." }
  },
  "lam-1": {
    lexical: { en: "not", ms: "tidak" },
    learner_note: { en: "Negates a مضارع verb with past-time meaning; also a jussive/jazm marker.", ms: "Menafikan kata kerja مضارع dengan makna lampau; turut berfungsi sebagai penanda jazam." }
  },
  "iyyaa-1": {
    lexical: { en: "(object-pronoun base)", ms: "(kata dasar ganti nama objek)" },
    learner_note: { en: "A pronoun base that always takes an attached object-pronoun suffix, e.g. إِيَّاكَ \"You alone\".", ms: "Kata dasar ganti nama yang sentiasa disertai akhiran kata ganti objek, cth. إِيَّاكَ \"Engkau sahaja\"." }
  }
};

const lemmas = [];
const glosses = [];
for (const l of Object.values(QM_LEMMAS).sort((a, b) => a.id.localeCompare(b.id))) {
  const rec = { lemma_id: l.id, form_vocalized: l.form, pos: POS_MAP[l.pos] };
  if (l.derivationType) rec.derivation_type = code(l.derivationType);
  if (l.verbForm) rec.verb_form = l.verbForm;
  if (l.derivedFromVerbForm) rec.derived_from_verb_form = l.derivedFromVerbForm;
  if (l.functionInventory) rec.function_inventory = l.functionInventory.map(code);
  if (l.conjugation) {
    const c = l.conjugation;
    rec.conjugation = {
      forms: { maadi: c.maadi, mudari: c.mudari, amr: c.amr },
      status: "provisional",
      provenance: { source_id: "QURRA_DEMO_CONJUGATION" }
    };
    if (c.note) rec.conjugation.note = { en: c.note.en, ms: c.note.ms };
  }
  rec.root = rootAssignment(l);
  rec.status = "provisional";
  rec.provenance = { lemma: { source_id: "QURRA_DEMO_MORPHOLOGY" } };
  lemmas.push(rec);

  const split = GLOSS_SPLIT[l.id];
  glosses.push({
    gloss_id: "gloss-" + l.id,
    lemma_id: l.id,
    lexical: split ? split.lexical : { en: l.gloss.en, ms: l.gloss.ms },
    contextual_explanations: [],
    learner_note: split ? split.learner_note : null,
    example: null,
    editor_note: l.note || null,
    status: "provisional",
    provenance: { source_id: "QURRA_GLOSS" }
  });
}

// ---- Uthmani segment spellings (the Stage 1 demo spelled the text in a simplified way) ----
const STEM_OVERRIDE = {
  "1:1:2": "ٱللَّهِ", "1:2:2": "ٱللَّهِ", "1:2:4": "عَٰلَمِينَ", "1:4:1": "مَٰلِكِ", "1:6:1": "ٱهْدِ",
  "1:6:2": "صِّرَٰطَ", "1:7:1": "صِرَٰطَ", "1:7:2": "ٱلَّذِينَ", "1:7:9": "ضَّآلِّينَ", "2:2:2": "كِتَٰبُ", "105:1:6": "أَصْحَٰبِ"
};
function uthmaniSegmentSurface(tokenId, seg) {
  if (seg.type === "stem" && STEM_OVERRIDE[tokenId]) return STEM_OVERRIDE[tokenId];
  if (seg.type === "proclitic" && seg.function === "definite_article") return seg.surface.replace(/^ال/, "ٱل");
  return seg.surface;
}

// ---- ayahs / tokens / forms ----
const forms = [];
const formByKey = new Map();
const tokens = [];
const ayahs = [];
const ayahTranslations = [];

const juzStarts = {};
for (const r of rows) if (!(r.juz in juzStarts)) juzStarts[r.juz] = { surah: r.surah, ayah: r.ayah };
function juzOf(surah, ayah) {
  let n = 1;
  for (let j = 1; j <= 30; j++) {
    const s = juzStarts[j];
    if (s.surah < surah || (s.surah === surah && s.ayah <= ayah)) n = j;
  }
  return n;
}

const ayahKeys = Object.keys(QM_AYAHS).sort((a, b) => {
  const [as, aa] = a.split(":").map(Number), [bs, ba] = b.split(":").map(Number);
  return as - bs || aa - ba;
});

// The Stage 1 demo listed two words of 1:7 in the wrong order relative to the Qur'anic text
// (it had ... غَيْرِ عَلَيْهِمْ الْمَغْضُوبِ ...). Map new position -> old demo index so each analysis
// follows its word. Found by the skeleton check below; documented in STAGE_2_IMPLEMENTATION.md.
const ORDER_FIX = { "1:7": [0, 1, 2, 3, 4, 6, 5, 7, 8] };
// Consonant skeleton (marks, alef/hamza seats, tatweel removed) used only to assert that an old
// analysis really belongs to the new word. Never displayed.
function skeleton(s) {
  return s.replace(/[ؐ-ًؚ-ٰٟۖ-ۭـ]/g, "")
    .replace(/[آأإٱاء]/g, "").replace(/ى/g, "ي").replace(/ة/g, "ه");
}

const rawAyahs = {};
for (const key of ayahKeys) {
  const a = QM_AYAHS[key];
  const row = rowByKey.get(key);
  if (!row) throw new Error("text mirror has no row for " + key);
  const words = row.text.split(" ");
  if (words.length !== a.tokenIds.length) throw new Error(`token count mismatch at ${key}: ${words.length} vs ${a.tokenIds.length}`);
  rawAyahs[key] = { text: row.text, juz_hint: row.juz };

  const tokenIds = [];
  a.tokenIds.forEach((_, i) => {
    const oldId = a.tokenIds[(ORDER_FIX[key] || [])[i] !== undefined ? ORDER_FIX[key][i] : i];
    const t = QM_TOKENS[oldId];
    if (skeleton(t.surfaceForm) !== skeleton(words[i])) throw new Error(`analysis ${oldId} (${t.surfaceForm}) does not match word ${key}:${i + 1} (${words[i]})`);
    const stem = t.segments.find(s => s.type === "stem");
    const segs = t.segments.map(s => {
      const seg = { type: s.type, surface: uthmaniSegmentSurface(oldId, s), pos: s.type === "stem" ? POS_MAP[t.pos] : (s.type === "proclitic" ? "particle" : "noun") };
      if (s.function) seg.function = s.function;
      if (s.gloss) seg.gloss_en = s.gloss;
      if (s.type === "stem") seg.lemma_id = s.lemmaId || null;
      if (s.pronounFeatures) seg.pronoun_features = Object.fromEntries(Object.entries(s.pronounFeatures).map(([k, v]) => [k, code(v)]));
      return seg;
    });
    const morphology = mapMorphology(t.morphology);
    const analysis = { surface: words[i], segments: segs, morphology };
    const key2 = JSON.stringify(analysis);
    let form = formByKey.get(key2);
    if (!form) {
      const hash = crypto.createHash("sha1").update(key2).digest("hex").slice(0, 8);
      const formId = `frm-${stem && stem.lemmaId ? stem.lemmaId : "x"}-${hash}`;
      form = {
        form_id: formId,
        surface: words[i],
        segments: segs.map((s, n) => Object.assign({ segment_id: `${formId}.s${n + 1}` }, s)),
        morphology,
        status: "provisional",
        provenance: { morphology: { source_id: "QURRA_DEMO_MORPHOLOGY" } }
      };
      if (t.segmentationNote) form.segmentation_note = { en: t.segmentationNote.en, ms: t.segmentationNote.ms };
      formByKey.set(key2, form);
      forms.push(form);
    }
    const tokenId = `${row.surah}:${row.ayah}:${i + 1}`;
    if (!ORDER_FIX[key] && tokenId !== oldId) throw new Error("token id drift " + oldId + " -> " + tokenId);
    tokenIds.push(tokenId);
    tokens.push({
      token_id: tokenId, ayah_id: key, position: i + 1, text: words[i], form_id: form.form_id,
      status: "provisional", provenance: { text: { source_id: "TANZIL_TEXT" }, form: { source_id: "QURRA_DEMO_MORPHOLOGY" } }
    });
  });

  ayahs.push({
    ayah_id: key, surah: row.surah, ayah: row.ayah, juz: juzOf(row.surah, row.ayah),
    text: row.text, token_ids: tokenIds, status: "imported", provenance: { text: { source_id: "TANZIL_TEXT" } }
  });
  ayahTranslations.push({
    ayah_id: key, text: { en: a.translation.en, ms: a.translation.ms },
    status: "provisional", provenance: { source_id: "QURRA_DEMO_TRANSLATION" }
  });
}
forms.sort((a, b) => a.form_id.localeCompare(b.form_id));

// ---- surahs + juz ----
const surahs = Object.values(QM_SURAHS).sort((a, b) => a.number - b.number).map(s => ({
  surah_id: "s" + String(s.number).padStart(3, "0"), number: s.number, name_ar: s.nameAr, name_en: s.nameEn, name_ms: null,
  ayah_count: s.ayahCount, revelation: s.revelation, status: "provisional", provenance: { source_id: "QURRA_EDITORIAL" }
}));
const juz = [];
for (let n = 1; n <= 30; n++) {
  const d = QM_JUZ[n];
  juz.push({
    juz: n, name_ar: d.nameAr, start: { surah: juzStarts[n].surah, ayah: juzStarts[n].ayah },
    note: (n === 1 || n === 30) ? { en: d.note.en, ms: d.note.ms } : null,
    status: "provisional", provenance: { source_id: "QURRA_EDITORIAL" }
  });
}

// ---- raw extract ----
const raw = {
  _source: "TANZIL_TEXT",
  _note: "Verbatim copy of 9 ayahs from the 'arabic-uthmani' config of the public Hugging Face dataset quranlab/quran (NOT downloaded from tanzil.net). Do not edit: this is source data. Byte-level fidelity to tanzil.net is unverified (see data/sources.json).",
  _juz_hint_note: "juz_hint is the mirror's own per-ayah juz field, used only as a cross-check against the juz start positions.",
  ayahs: rawAyahs
};

function write(rel, obj) {
  const p = path.join(ROOT, rel);
  fs.mkdirSync(path.dirname(p), { recursive: true });
  fs.writeFileSync(p, JSON.stringify(obj, null, 2) + "\n", "utf8");
  console.log("wrote", rel);
}
write("data/raw/tanzil-uthmani-pilot.json", raw);
write("data/meta/surahs.json", { surahs });
write("data/meta/juz.json", { juz });
write("data/qurra/ayahs.json", { ayahs });
write("data/qurra/tokens.json", { tokens });
write("data/qurra/forms.json", { forms });
write("data/qurra/lemmas.json", { lemmas });
write("data/qurra/roots.json", { roots });
write("data/qurra/glosses.json", { glosses });
write("data/qurra/ayah-translations.json", { ayah_translations: ayahTranslations });
console.log(`forms=${forms.length} tokens=${tokens.length} lemmas=${lemmas.length} roots=${roots.length}`);
