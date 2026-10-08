"use strict";
/* ==========================================================================
   Dataset validation. Fails loudly on structural problems; deliberately does
   NOT fail on intentionally unresolved fields (lemma_id null, root_id null,
   status unresolved/disputed/null_policy are all valid).

   validate(ds) -> { errors: string[], warnings: string[] }
   ========================================================================== */

const rootModel = require("./rootmodel");
const { parseText, splitBasmala, basmalaForms, parseMetadata, textNotice, metadataNotice } = require("./tanzil");

const ID_RE = /^[A-Za-z0-9][A-Za-z0-9._:\-]*$/;           // ASCII-safe ids only
const ARABIC_TEXT_RE = /^[؀-ۿ]+(?: [؀-ۿ]+)*$/; // Arabic block + single spaces, no edges
const ARABIC_TOKEN_RE = /^[؀-ۿ]+$/;
// Supported keys inside a Form's morphology object (all validated against data/taxonomy.json where they are coded).
const MORPHOLOGY_KEYS = new Set(["number", "gender", "voice", "plural_type", "definiteness", "reference_class", "declension", "aspect", "function_here", "person"]);
const DEFINITENESS_KEYS = new Set(["state", "cause"]);
const PRONOUN_KEYS = new Set(["person", "number", "gender"]);
const LICENCE_STATUSES = new Set(["verified", "conditional", "unresolved", "internal", "provisional"]);

const { skeleton } = require("./arabic");
const { validateTagMap } = require("./tagmap");
const { validateAlignmentFile } = require("./alignment");

function validate(ds) {
  const errors = [];
  const warnings = [];
  const err = (where, msg) => errors.push(`${where}: ${msg}`);
  const warn = (where, msg) => warnings.push(`${where}: ${msg}`);
  (ds._loadProblems || []).forEach(p => errors.push(p));

  const tax = ds.taxonomy || {};
  const setOf = cat => new Set((tax[cat] || []).map(x => x.id));
  const T = {
    pos: setOf("pos"), segType: setOf("segment_type"), segFn: setOf("segment_function"), number: setOf("number"),
    gender: setOf("gender"), voice: setOf("voice"), pluralType: setOf("plural_type"), defState: setOf("definiteness_state"),
    defCause: setOf("definiteness_cause"), refClass: setOf("reference_class"), declension: setOf("declension"),
    derivation: setOf("derivation_type"), aspect: setOf("verb_aspect"), verbForm: setOf("verb_form"),
    particleFn: setOf("particle_function"), person: setOf("person"), rootType: setOf("root_type"), status: setOf("status")
  };
  if (!T.status.size) err("taxonomy", "no statuses defined");
  const letterSlug = (tax.root_letters && tax.root_letters.letters) || {};
  const rootCatByCount = rootModel.categoryByCount(tax);
  const allowedCounts = [...rootCatByCount.keys()].sort((a, b) => a - b).join(" or ");
  if (!rootCatByCount.size) err("taxonomy", "no root_category defined (each entry needs an id and an integer radicals)");
  const gate = tax.review_gate || {};
  const mustBeNull = new Set(gate.root_must_be_null || []);
  const needsEvidence = new Set(gate.root_requires_evidence || []);

  function checkEnum(where, field, value, set) {
    if (value === null || value === undefined) return;
    if (!set.has(String(value))) err(where, `${field}="${value}" is not in the taxonomy`);
  }
  function checkId(where, id) {
    if (typeof id !== "string" || !ID_RE.test(id)) err(where, `id "${id}" is not ASCII-safe (allowed: letters, digits, . _ : -)`);
  }
  function checkStatus(where, status) {
    if (!T.status.has(status)) err(where, `unsupported status "${status}"`);
  }
  function required(where, obj, fields) {
    for (const f of fields) if (obj[f] === undefined || obj[f] === null || obj[f] === "") err(where, `missing required field "${f}"`);
  }
  function unique(name, arr, key) {
    const seen = new Map();
    arr.forEach((x, i) => {
      const id = x && x[key];
      if (id === undefined) return;
      if (seen.has(id)) err(`${name}[${i}]`, `duplicate ${key} "${id}"`);
      seen.set(id, x);
      checkId(`${name}[${i}]`, id);
    });
    return seen;
  }
  function checkArabicText(where, label, s, { phrase = false } = {}) {
    if (typeof s !== "string" || !s) return err(where, `${label} is empty`);
    if (/�/.test(s)) err(where, `${label} contains U+FFFD (corrupted text)`);
    if (!(phrase ? ARABIC_TEXT_RE : ARABIC_TOKEN_RE).test(s)) err(where, `${label} "${s}" contains non-Arabic characters or malformed spacing`);
  }

  /* ---------- sources ---------- */
  const GATE_KEYS = ["commercial_use", "redistribution", "static_bundling", "derivatives", "attribution", "modification", "third_party_material", "upstream", "decision", "reason"];
  const CLEARANCES = new Set(((ds.taxonomy || {}).clearance || []).map(x => x.id));
  const GATE_DECISIONS = new Set(((ds.taxonomy || {}).gate_decision || []).map(x => x.id));
  const nonEmpty = v => typeof v === "string" && v.trim().length > 0;
  /** The licensing gate: nothing is bundled unless its licence chain is recorded and the source is CLEAR. */
  function checkSourceGate(w, s) {
    if (!CLEARANCES.has(s.clearance)) { err(w, `clearance "${s.clearance}" is not one of ${[...CLEARANCES].join("|")}`); return; }
    const g = s.gate;
    if (!g || typeof g !== "object") { err(w, "missing gate record"); return; }
    GATE_KEYS.forEach(k => { if (!nonEmpty(g[k])) err(w, `gate.${k} is missing or empty`); });
    if (!GATE_DECISIONS.has(g.decision)) err(w, `gate.decision "${g.decision}" is not one of ${[...GATE_DECISIONS].join("|")}`);
    if (s.clearance === "CLEAR") {
      if (!nonEmpty(s.licence)) err(w, "clearance CLEAR without licence text");
      if (!/^QURRA_/.test(s.source_id) && !nonEmpty(s.licence_url) && !nonEmpty(s.url)) err(w, "clearance CLEAR without a licence_url or url (only QURRA-authored sources, QURRA_*, may omit it)");
      if (g.decision !== "USE") err(w, `clearance CLEAR but gate.decision is "${g.decision}"`);
      if (s.licence_status === "unverified" || s.licence_status === "unknown") err(w, "clearance CLEAR but licence_status is not established");
    } else {
      if (s.in_use !== false) err(w, `clearance ${s.clearance} but in_use is not false (only CLEAR sources may be used)`);
      if (g.decision === "USE") err(w, `clearance ${s.clearance} but gate.decision is USE`);
    }
  }
  const sources = unique("sources", ds.sources || [], "source_id");
  (ds.sources || []).forEach((s, i) => {
    const w = `sources[${i}]`;
    required(w, s, ["source_id", "name", "type", "version", "licence", "licence_status", "allowed_use", "notes"]);
    if (s.in_use === undefined) err(w, `missing "in_use"`);
    if (!LICENCE_STATUSES.has(s.licence_status)) err(w, `licence_status "${s.licence_status}" is not one of ${[...LICENCE_STATUSES].join("|")}`);
    checkSourceGate(w, s);
    if (s.licence_status === "verified" && s.in_use) warn(w, "licence_status 'verified' — make sure research actually established commercial clearance");
  });

  const usedSources = new Set();
  function checkProvenance(where, prov) {
    (function walk(node, p) {
      if (!node || typeof node !== "object") return;
      if (typeof node.source_id === "string") {
        usedSources.add(node.source_id);
        const src = sources.get(node.source_id);
        if (!src) err(p, `references unknown source_id "${node.source_id}"`);
        else if (src.in_use === false) err(p, `references source "${node.source_id}" which is registered as in_use=false (not cleared for use)`);
      }
      Object.entries(node).forEach(([k, v]) => { if (v && typeof v === "object") walk(v, `${p}.${k}`); });
    })(prov, `${where}.provenance`);
  }
  function entity(where, rec, { provenanceRequired = true } = {}) {
    checkStatus(where, rec.status);
    if (provenanceRequired && !rec.provenance) err(where, "missing provenance");
    if (rec.provenance) checkProvenance(where, rec.provenance);
  }

  /* ---------- surahs / juz ---------- */
  const surahs = unique("surahs", ds.surahs || [], "surah_id");
  const surahByNumber = new Map();
  (ds.surahs || []).forEach((s, i) => {
    const w = `surahs[${i}]`;
    required(w, s, ["surah_id", "number", "name_ar", "name_en", "ayah_count", "revelation"]);
    if (surahByNumber.has(s.number)) err(w, `duplicate surah number ${s.number}`);
    surahByNumber.set(s.number, s);
    if (!Number.isInteger(s.number) || s.number < 1 || s.number > 114) err(w, `number ${s.number} out of range 1..114`);
    if (!Number.isInteger(s.ayah_count) || s.ayah_count < 1) err(w, `ayah_count must be a positive integer`);
    if (s.revelation !== "Meccan" && s.revelation !== "Medinan") err(w, `revelation must be Meccan or Medinan`);
    if (s.name_ar) checkArabicText(w, "name_ar", s.name_ar, { phrase: true });
    entity(w, s);
  });

  // The complete Qur'an: exactly 114 surahs, numbered 1..114.
  if ((ds.surahs || []).length !== 114) err("surahs", `expected 114 surahs, found ${(ds.surahs || []).length}`);
  for (let n = 1; n <= 114; n++) if (!surahByNumber.has(n)) err("surahs", `missing surah ${n}`);

  // Cross-check against the official Tanzil metadata file kept verbatim in data/raw/tanzil/.
  let officialMeta = null;
  try { officialMeta = parseMetadata(ds.rawMeta); } catch (e) { err("data/raw/tanzil/quran-data.js", `cannot parse (${e.message})`); }
  if (officialMeta) {
    officialMeta.surahs.forEach(o => {
      const m = surahByNumber.get(o.number);
      if (!m) return;
      if (m.ayah_count !== o.ayahs) err(`surah ${o.number}`, `ayah_count ${m.ayah_count} differs from official metadata (${o.ayahs})`);
      if (m.name_ar !== o.nameAr) err(`surah ${o.number}`, `name_ar differs from official metadata`);
      if (m.name_en !== o.translit) err(`surah ${o.number}`, `name_en "${m.name_en}" differs from official transliteration "${o.translit}"`);
      if (m.revelation !== o.type) err(`surah ${o.number}`, `revelation "${m.revelation}" differs from official metadata (${o.type})`);
      if (m.revelation_order !== o.order) err(`surah ${o.number}`, `revelation_order differs from official metadata`);
    });
  }

  const juzList = ds.juz || [];
  unique("juz", juzList.map(j => ({ id: String(j.juz) })), "id");
  if (juzList.length !== 30) err("juz", `expected 30 entries, found ${juzList.length}`);
  juzList.forEach((j, i) => {
    const w = `juz[${i}]`;
    required(w, j, ["juz", "name_ar", "start"]);
    if (j.juz !== i + 1) err(w, `juz entries must be ordered 1..30 (found ${j.juz} at index ${i})`);
    if (!j.start || !Number.isInteger(j.start.surah) || !Number.isInteger(j.start.ayah)) err(w, "start must be {surah, ayah} integers");
    if (i > 0 && juzList[i - 1].start && j.start) {
      const a = juzList[i - 1].start, b = j.start;
      if (!(b.surah > a.surah || (b.surah === a.surah && b.ayah > a.ayah))) err(w, "start must come after the previous juz start");
    }
    const sMeta = j.start && surahByNumber.get(j.start.surah);
    if (sMeta && j.start.ayah > sMeta.ayah_count) err(w, `start ayah ${j.start.ayah} exceeds surah ${j.start.surah} ayah_count`);
    entity(w, j);
  });
  if (officialMeta) officialMeta.juz.forEach(o => {
    const j = juzList[o.juz - 1];
    if (j && j.start && (j.start.surah !== o.surah || j.start.ayah !== o.ayah)) err(`juz[${o.juz - 1}]`, `start ${j.start.surah}:${j.start.ayah} differs from official metadata (${o.surah}:${o.ayah})`);
  });
  function juzOf(surah, ayah) {
    let n = null;
    juzList.forEach(j => {
      if (!j.start) return;
      if (j.start.surah < surah || (j.start.surah === surah && j.start.ayah <= ayah)) n = j.juz;
    });
    return n;
  }

  /* ---------- lemmas / roots / glosses (needed before forms) ---------- */
  const roots = unique("roots", ds.roots || [], "root_id");
  const lemmas = unique("lemmas", ds.lemmas || [], "lemma_id");
  const seenLetters = new Map();
  (ds.roots || []).forEach((r, i) => {
    const w = `roots[${i}]`;
    required(w, r, ["root_id", "letters", "display", "root_type", "core_field"]);
    /* The number of radicals is not fixed: the allowed lengths come from taxonomy.root_category (thulathi = 3, rubai = 4, ...). */
    if (!Array.isArray(r.letters) || !rootCatByCount.has(r.letters.length)) err(w, `letters must be an array of ${allowedCounts} letters (taxonomy.root_category)`);
    else {
      if (r.root_category !== undefined && r.root_category !== rootCatByCount.get(r.letters.length)) err(w, `root_category "${r.root_category}" does not match the ${r.letters.length}-letter root (expected "${rootCatByCount.get(r.letters.length)}")`);
      r.letters.forEach(l => { if (!letterSlug[l]) err(w, `letter "${l}" is not an allowed canonical root letter (no diacritics; hamza must be ء; weak letters و/ي only)`); });
      if (r.display !== r.letters.join(" ")) err(w, `display "${r.display}" must equal letters joined by single spaces ("${r.letters.join(" ")}")`);
      const expectId = "root-" + r.letters.map(l => letterSlug[l]).join("-");
      if (r.root_id !== expectId) err(w, `root_id "${r.root_id}" must be "${expectId}" (derived from QURRA's own letter table)`);
      const key = r.letters.join("");
      if (seenLetters.has(key)) err(w, `duplicate root letters "${r.display}" (also ${seenLetters.get(key)})`); else seenLetters.set(key, r.root_id);
    }
    checkEnum(w, "root_type", r.root_type, T.rootType);
    if (!r.core_field || typeof r.core_field.en !== "string") err(w, "core_field.en is required");
    entity(w, r);
  });

  const referencedRoots = new Set();
  (ds.lemmas || []).forEach((l, i) => {
    const w = `lemmas[${i}](${l.lemma_id})`;
    required(w, l, ["lemma_id", "form_vocalized", "pos", "root"]);
    checkEnum(w, "pos", l.pos, T.pos);
    checkEnum(w, "derivation_type", l.derivation_type, T.derivation);
    checkEnum(w, "verb_form", l.verb_form, T.verbForm);
    checkEnum(w, "derived_from_verb_form", l.derived_from_verb_form, T.verbForm);
    (l.function_inventory || []).forEach(f => checkEnum(w, "function_inventory", f, T.particleFn));
    checkArabicText(w, "form_vocalized", l.form_vocalized, { phrase: true });
    entity(w, l);

    const a = l.root || {};
    const rw = `${w}.root`;
    checkStatus(rw, a.status);
    if (!a.provenance) err(rw, "missing provenance"); else checkProvenance(rw, a.provenance);
    if (a.root_id !== null && a.root_id !== undefined) {
      if (!roots.has(a.root_id)) err(rw, `root_id "${a.root_id}" does not exist`);
      else referencedRoots.add(a.root_id);
    }
    if (mustBeNull.has(a.status) && a.root_id) err(rw, `status "${a.status}" must not carry a root_id (disputed/unresolved/null-policy items stay empty)`);
    if (a.status === "provisional" && !a.root_id) err(rw, `status "provisional" requires a root_id (use unresolved for an empty value)`);
    if (needsEvidence.has(a.status)) {
      if (!a.root_id) err(rw, `status "${a.status}" requires a root_id`);
      if (!Array.isArray(a.evidence) || !a.evidence.length) err(rw, `status "${a.status}" requires recorded evidence`);
      if (!a.rule_ids || !a.rule_ids.length) err(rw, `status "${a.status}" requires rule_ids`);
      if (!a.review || !a.review.reviewer_id || !a.review.date) err(rw, `status "${a.status}" requires review.reviewer_id and review.date`);
    }
    if (!Array.isArray(a.evidence)) err(rw, "evidence must be an array (may be empty)");
    (a.evidence || []).forEach((ev, n) => required(`${rw}.evidence[${n}]`, ev, ["source_id", "edition", "headword", "source_root_spelling", "role"]));
    if (!Array.isArray(a.candidates)) err(rw, "candidates must be an array (may be empty)");
    else a.candidates.forEach((c, n) => rootModel.problemsWithRoot(c, tax).forEach(p => {
      /* A wrong length or format is an error; a non-canonical letter in an existing candidate is only a warning (candidates are editorial and are never assigned). */
      if (p.kind === "letters") warnings.push(`${rw}.candidates[${n}]: ${p.message}`); else err(`${rw}.candidates[${n}]`, p.message);
    }));
    /* source_indexing: where a classical source discusses the word. Evidence only; it never sets the QURRA root. */
    if (a.source_indexing !== undefined) {
      if (!Array.isArray(a.source_indexing)) err(rw, "source_indexing must be an array when present");
      else a.source_indexing.forEach((s, n) => {
        const sw = `${rw}.source_indexing[${n}]`;
        required(sw, s, ["source_id", "indexed_under"]);
        if (typeof s.indexed_under === "string") rootModel.problemsWithIndexing(s.indexed_under, tax).forEach(p => err(sw, p));
        if ("root_id" in s || "assigns_root" in s) err(sw, "source indexing is evidence only and must not carry a root_id or assign a root");
      });
    }

    if (l.conjugation) {
      const c = l.conjugation, cw = `${w}.conjugation`;
      checkStatus(cw, c.status);
      if (!c.provenance) err(cw, "missing provenance"); else checkProvenance(cw, c.provenance);
      ["maadi", "mudari", "amr"].forEach(k => {
        if (!c.forms || !(k in c.forms)) err(cw, `forms.${k} must be present (null when withheld)`);
        else if (c.forms[k] !== null) checkArabicText(cw, `forms.${k}`, c.forms[k], { phrase: true });
      });
    }
  });

  const glossByLemma = new Map();
  unique("glosses", ds.glosses || [], "gloss_id");
  (ds.glosses || []).forEach((g, i) => {
    const w = `glosses[${i}]`;
    required(w, g, ["gloss_id", "lemma_id", "lexical"]);
    if (!lemmas.has(g.lemma_id)) err(w, `lemma_id "${g.lemma_id}" does not exist`);
    if (glossByLemma.has(g.lemma_id)) err(w, `second gloss for lemma "${g.lemma_id}"`);
    glossByLemma.set(g.lemma_id, g);
    if (!g.lexical || typeof g.lexical.en !== "string" || !g.lexical.en.trim()) err(w, "lexical.en is required");
    if (g.lexical && g.lexical.ms !== undefined && typeof g.lexical.ms !== "string") err(w, "lexical.ms must be a string when present");
    if (!Array.isArray(g.contextual_explanations)) err(w, "contextual_explanations must be an array");
    ["learner_note", "usage_note"].forEach(f => { if (g[f] !== null && g[f] !== undefined && (typeof g[f].en !== "string" || !g[f].en.trim())) err(w, f + " must be null or an object with a non-empty en string"); });
    entity(w, g);
  });

  /* ---------- forms ---------- */
  const forms = unique("forms", ds.forms || [], "form_id");
  const referencedLemmas = new Set();
  (ds.forms || []).forEach((f, i) => {
    const w = `forms[${i}](${f.form_id})`;
    required(w, f, ["form_id", "surface", "segments", "morphology"]);
    checkArabicText(w, "surface", f.surface);
    entity(w, f);
    if (!Array.isArray(f.segments) || !f.segments.length) return err(w, "segments must be a non-empty array");
    unique(`${w}.segments`, f.segments, "segment_id");
    let stems = 0;
    f.segments.forEach((s, n) => {
      const sw = `${w}.segments[${n}]`;
      required(sw, s, ["segment_id", "type", "surface", "pos"]);
      if (s.segment_id && !String(s.segment_id).startsWith(f.form_id + ".")) err(sw, `segment_id must start with "${f.form_id}."`);
      checkEnum(sw, "type", s.type, T.segType);
      checkEnum(sw, "pos", s.pos, T.pos);
      if (s.function !== undefined) { if (!T.segFn.has(s.function) && !T.particleFn.has(s.function)) err(sw, `function "${s.function}" is not in the taxonomy`); }
      checkArabicText(sw, "surface", s.surface);
      if (s.type === "stem") {
        stems++;
        if (!("lemma_id" in s)) err(sw, `stem segments must declare lemma_id (null is valid)`);
        else if (s.lemma_id !== null) {
          if (!lemmas.has(s.lemma_id)) err(sw, `lemma_id "${s.lemma_id}" does not exist`);
          else referencedLemmas.add(s.lemma_id);
        }
      } else if ("lemma_id" in s) err(sw, `only stem segments may carry lemma_id`);
      if (s.pronoun_features) {
        checkEnum(sw, "pronoun_features.number", s.pronoun_features.number, T.number);
        checkEnum(sw, "pronoun_features.gender", s.pronoun_features.gender, T.gender);
        checkEnum(sw, "pronoun_features.person", s.pronoun_features.person, T.person);
      }
    });
    if (stems < 1) err(w, "a form needs at least one stem segment");
    // The concatenated segment skeleton must match the surface skeleton, unless the orthographic fusion is documented.
    const joined = skeleton(f.segments.map(s => s.surface).join(""));
    if (joined !== skeleton(f.surface) && !f.segmentation_note) err(w, "segment surfaces do not add up to the form surface and no segmentation_note explains the fusion");

    const m = f.morphology || {};
    const mw = `${w}.morphology`;
    checkEnum(mw, "number", m.number, T.number);
    checkEnum(mw, "gender", m.gender, T.gender);
    checkEnum(mw, "voice", m.voice, T.voice);
    checkEnum(mw, "plural_type", m.plural_type, T.pluralType);
    checkEnum(mw, "reference_class", m.reference_class, T.refClass);
    checkEnum(mw, "declension", m.declension, T.declension);
    checkEnum(mw, "aspect", m.aspect, T.aspect);
    checkEnum(mw, "function_here", m.function_here, T.particleFn);
    checkEnum(mw, "person", m.person, T.person);
    if (m.definiteness) { checkEnum(mw, "definiteness.state", m.definiteness.state, T.defState); checkEnum(mw, "definiteness.cause", m.definiteness.cause, T.defCause); }

    // R3: unknown feature keys are errors, so that a typo or an unsupported feature can never pass silently.
    Object.keys(m).forEach(k => { if (!MORPHOLOGY_KEYS.has(k)) err(mw, `unknown morphology key "${k}" (supported: ${[...MORPHOLOGY_KEYS].join(", ")})`); });
    if (m.definiteness && typeof m.definiteness === "object") Object.keys(m.definiteness).forEach(k => { if (!DEFINITENESS_KEYS.has(k)) err(mw, `unknown definiteness key "${k}"`); });
    f.segments.forEach((s, n) => { if (s.pronoun_features) Object.keys(s.pronoun_features).forEach(k => { if (!PRONOUN_KEYS.has(k)) err(`${w}.segments[${n}]`, `unknown pronoun_features key "${k}"`); }); });

    // R4: a stem's POS must agree with its lemma's POS, and function_here must belong to the lemma's declared inventory.
    const stemSegs = f.segments.filter(s => s.type === "stem" && s.lemma_id && lemmas.has(s.lemma_id));
    stemSegs.forEach(s => { const l = lemmas.get(s.lemma_id); if (l.pos !== s.pos) err(w, `stem "${s.surface}" has pos "${s.pos}" but its lemma ${l.lemma_id} has pos "${l.pos}"`); });
    if (m.function_here !== undefined && m.function_here !== null && stemSegs.length) {
      const belongs = stemSegs.some(s => { const l = lemmas.get(s.lemma_id); return l.pos === "particle" && Array.isArray(l.function_inventory) && l.function_inventory.includes(m.function_here); });
      if (!belongs) err(mw, `function_here "${m.function_here}" is not in the declared function_inventory of any particle lemma of this form (${stemSegs.map(s => s.lemma_id).join(", ")})`);
    }
  });

  /* ---------- ayahs / tokens ---------- */
  const ayahs = unique("ayahs", ds.ayahs || [], "ayah_id");
  const tokens = unique("tokens", ds.tokens || [], "token_id");
  const tokensByAyah = new Map();
  const referencedForms = new Set();
  (ds.tokens || []).forEach((t, i) => {
    const w = `tokens[${i}](${t.token_id})`;
    required(w, t, ["token_id", "ayah_id", "position", "text"]);
    if (!ayahs.has(t.ayah_id)) err(w, `ayah_id "${t.ayah_id}" does not exist`);
    if (!Number.isInteger(t.position) || t.position < 1) err(w, `position must be a positive integer`);
    if (t.token_id !== `${t.ayah_id}:${t.position}`) err(w, `token_id must equal "<ayah_id>:<position>" ("${t.ayah_id}:${t.position}")`);
    checkArabicText(w, "text", t.text);
    if (t.form_id !== null && t.form_id !== undefined) {
      if (!forms.has(t.form_id)) err(w, `form_id "${t.form_id}" does not exist`);
      else {
        referencedForms.add(t.form_id);
        const f = forms.get(t.form_id);
        if (f.surface !== t.text) err(w, `token text does not equal its form's surface (form ${t.form_id} is "${f.surface}")`);
      }
    }
    entity(w, t);
    if (!tokensByAyah.has(t.ayah_id)) tokensByAyah.set(t.ayah_id, []);
    tokensByAyah.get(t.ayah_id).push(t);
  });
  for (const [aid, list] of tokensByAyah) {
    const positions = list.map(t => t.position).sort((a, b) => a - b);
    positions.forEach((p, n) => {
      if (p !== n + 1) err(`tokens of ayah ${aid}`, `positions must be contiguous from 1 (found ${positions.slice(0, 12).join(",")})`);
    });
    if (new Set(positions).size !== positions.length) err(`tokens of ayah ${aid}`, "duplicate token positions");
  }

  // Token -> Form assignments (analysed tokens only).
  unique("token_forms", ds.tokenForms || [], "token_id");
  (ds.tokenForms || []).forEach((tf, i) => {
    const w = `token_forms[${i}](${tf.token_id})`;
    required(w, tf, ["token_id", "form_id"]);
    if (!tokens.has(tf.token_id)) err(w, `token "${tf.token_id}" does not exist in the token layer`);
    else if (tokens.get(tf.token_id).form_id !== tf.form_id) err(w, `assignment was not applied to the token layer`);
    if (!forms.has(tf.form_id)) err(w, `form_id "${tf.form_id}" does not exist`);
    entity(w, tf);
  });

  // Rule-based default analyses (data/qurra/generated/forms.json): one form per distinct spelling, applied to every token with that exact text.
  const tokenSurfaces = new Set((ds.tokens || []).map(t => t.text));
  const ruleSurfaces = new Map();
  (ds.forms || []).forEach((f, i) => {
    if (f.basis === undefined) return;
    const w = `forms[${i}](${f.form_id})`;
    if (f.basis !== "rule_default") return err(w, `unknown basis "${f.basis}"`);
    if (f.status !== "provisional") err(w, `a rule-based default analysis must be provisional (found "${f.status}"): only a person can review it`);
    const prov = f.provenance && ((f.provenance.form && f.provenance.form.source_id) || (f.provenance.morphology && f.provenance.morphology.source_id));
    if (prov !== "QURRA_RULE_ANALYSIS") err(w, "a rule-based default analysis must cite source QURRA_RULE_ANALYSIS");
    if (!tokenSurfaces.has(f.surface)) err(w, `surface "${f.surface}" is not the text of any token`);
    if (ruleSurfaces.has(f.surface)) err(w, `second default analysis for the spelling "${f.surface}" (also ${ruleSurfaces.get(f.surface)})`);
    ruleSurfaces.set(f.surface, f.form_id);
    if (Array.isArray(f.segments) && f.segments.map(x => x.surface).join("") !== f.surface) err(w, "segment surfaces must be consecutive slices of the token text");
    referencedForms.add(f.form_id);
  });

  // Official raw text: every ayah must reproduce its official line exactly.
  let rawLines = null;
  let variants = null;
  try {
    const parsed = parseText(ds.rawText);
    rawLines = parsed.lines;
    if (!parsed.header.some(h => /Creative Commons Attribution 3\.0/.test(h))) err("data/raw/tanzil/quran-uthmani.txt", "copyright block (Creative Commons Attribution 3.0) is missing: it must be kept verbatim");
    if (rawLines.size !== 6236) err("data/raw/tanzil/quran-uthmani.txt", `expected 6236 ayah lines, found ${rawLines.size}`);
    variants = rawLines.has("1:1") ? basmalaForms(rawLines) : null;
  } catch (e) { err("data/raw/tanzil/quran-uthmani.txt", `cannot parse (${e.message})`); }

  // Tanzil's terms: the copyright notice is reproduced in all derived files. Check that the notice carried by the
  // derived data files and the NOTICE file is exactly the one in the raw files (generated JS is covered by --check).
  try {
    const want = textNotice(ds.rawText), wantMeta = metadataNotice(ds.rawMeta);
    const same = (a, b) => Array.isArray(a) && a.length === b.length && a.every((l, i) => l === b[i]);
    const top = name => { try { return JSON.parse(ds._files[name])._notice; } catch (e) { return undefined; } };
    if (!same(top("ayahs"), want)) err("data/qurra/ayahs.json", "_notice must equal the copyright block of data/raw/tanzil/quran-uthmani.txt (run scripts/import-tanzil.js)");
    if (!same(top("surahs"), wantMeta)) err("data/meta/surahs.json", "_notice must equal the header of data/raw/tanzil/quran-data.js (run scripts/import-tanzil.js)");
    if (!same(top("juz"), wantMeta)) err("data/meta/juz.json", "_notice must equal the header of data/raw/tanzil/quran-data.js (run scripts/import-tanzil.js)");
    want.concat(wantMeta).forEach(l => { if (!ds.notice.includes(l)) err("NOTICE", `missing the Tanzil notice line: ${l.slice(0, 60)}`); });
  } catch (e) { err("NOTICE", `cannot check the Tanzil notice (${e.message})`); }

  const ayahCountBySurah = new Map();
  let prevAyah = null;
  (ds.ayahs || []).forEach((a, i) => {
    const w = `ayahs[${i}](${a.ayah_id})`;
    required(w, a, ["ayah_id", "surah", "ayah", "text"]);
    if (a.ayah_id !== `${a.surah}:${a.ayah}`) err(w, `ayah_id must equal "<surah>:<ayah>"`);
    const s = surahByNumber.get(a.surah);
    if (!s) err(w, `surah ${a.surah} is not in data/meta/surahs.json`);
    else if (!Number.isInteger(a.ayah) || a.ayah < 1 || a.ayah > s.ayah_count) err(w, `ayah ${a.ayah} outside 1..${s.ayah_count}`);
    ayahCountBySurah.set(a.surah, (ayahCountBySurah.get(a.surah) || 0) + 1);
    if (prevAyah && !((a.surah === prevAyah.surah && a.ayah === prevAyah.ayah + 1) || (a.surah === prevAyah.surah + 1 && a.ayah === 1))) err(w, `ayahs must be in Qur'an order without gaps (previous was ${prevAyah.ayah_id})`);
    prevAyah = a;
    checkArabicText(w, "text", a.text, { phrase: true });
    entity(w, a);

    const list = (tokensByAyah.get(a.ayah_id) || []).slice().sort((x, y) => x.position - y.position);
    if (list.map(t => t.text).join(" ") !== a.text) err(w, "ayah text must equal its tokens' texts joined by single spaces (text and tokens have drifted apart)");

    if (rawLines && a.provenance && a.provenance.text && a.provenance.text.source_id === "TANZIL_TEXT") {
      const line = rawLines.get(a.ayah_id);
      if (line === undefined) return err(w, "no line in data/raw/tanzil/quran-uthmani.txt for a TANZIL_TEXT ayah");
      let expected = a.text;
      if (a.source_prefix !== undefined) {
        if (a.source_prefix !== "basmala") err(w, `unknown source_prefix "${a.source_prefix}"`);
        else {
          const sp = variants && splitBasmala(a.ayah_id, line, variants);
          if (!sp || !sp.prefix) err(w, "source_prefix=basmala but the official line does not start with the basmala (or this is not ayah 1 of a surah other than 1 and 9)");
          else expected = sp.prefix + " " + a.text;
        }
      } else if (variants && splitBasmala(a.ayah_id, line, variants).prefix) err(w, "official line starts with the basmala header but the record has no source_prefix (the header would be shown as part of the ayah)");
      if (line !== expected) err(w, "ayah text differs from the official Tanzil line — canonical text must never be edited");
    }
  });
  surahByNumber.forEach((s, n) => {
    const have = ayahCountBySurah.get(n) || 0;
    if (have !== s.ayah_count) err(`surah ${n}`, `has ${have} ayah records but ayah_count is ${s.ayah_count} (missing or extra ayahs)`);
  });
  if ((ds.ayahs || []).length !== 6236) err("ayahs", `expected 6236 ayahs, found ${(ds.ayahs || []).length}`);
  if (rawLines) rawLines.forEach((_, k) => { if (!ayahs.has(k)) err("raw", `official ayah ${k} has no QURRA ayah record (missing ayah)`); });

  /* ---------- translation editions (full-ayah translations, kept apart from lexical glosses) ---------- */
  const LANGS = new Set(((ds.taxonomy || {}).language || []).map(x => x.id));
  const TSCOPES = new Set(((ds.taxonomy || {}).translation_scope || []).map(x => x.id));
  const STATUS_IDS = new Set(((ds.taxonomy || {}).status || []).map(x => x.id));
  const editions = unique("translation_editions", ds.translationEditions || [], "translation_id");
  (ds.translationEditions || []).forEach((ed, i) => {
    const w = `translation_editions[${i}]`;
    required(w, ed, ["translation_id", "language", "title", "translator", "source_id", "version", "clearance", "scope", "status", "file", "attribution"]);
    if (typeof ed.published !== "boolean") err(w, "published must be true or false");
    if (!LANGS.has(ed.language)) err(w, `language "${ed.language}" is not in the taxonomy`);
    if (!TSCOPES.has(ed.scope)) err(w, `scope "${ed.scope}" is not full|partial`);
    if (!STATUS_IDS.has(ed.status)) err(w, `status "${ed.status}" is not in the taxonomy`);
    const src = sources.get(ed.source_id);
    if (!src) err(w, `unknown source_id "${ed.source_id}"`);
    else {
      usedSources.add(ed.source_id);
      if (src.clearance !== "CLEAR" || src.in_use !== true) err(w, `source "${ed.source_id}" is not CLEAR / in_use: its text must not be bundled`);
      if (ed.clearance !== src.clearance) err(w, `edition clearance "${ed.clearance}" differs from its source's "${src.clearance}"`);
    }
    if (ed.published && (ed.clearance !== "CLEAR" || ed.status === "draft")) err(w, "a published edition must be CLEAR and not draft");
    const file = (ds.translationTexts || {})[ed.translation_id];
    if (!file) return;                               // the loader already reported an unreadable file
    if (file.translation_id !== ed.translation_id) err(w, `file declares translation_id "${file.translation_id}"`);
    const seen = new Set();
    (file.records || []).forEach((t, j) => {
      const rw = `${ed.translation_id}.records[${j}]`;
      required(rw, t, ["ayah_id", "text"]);
      if (!ayahs.has(t.ayah_id)) err(rw, `ayah_id "${t.ayah_id}" does not exist`);
      if (seen.has(t.ayah_id)) err(rw, `duplicate translation for ${t.ayah_id}`);
      seen.add(t.ayah_id);
      if (typeof t.text !== "string" || !t.text.trim()) err(rw, "text is empty");
      else {
        if (/�/.test(t.text)) err(rw, "text contains U+FFFD (corrupted text)");
        if (/project gutenberg/i.test(t.text)) err(rw, "text contains the e-text provider's trademark/licence wording (header text leaked into the data)");
      }
      if (t.status !== undefined && !STATUS_IDS.has(t.status)) err(rw, `status "${t.status}" is not in the taxonomy`);
      if (t.provenance) checkProvenance(rw, t.provenance);
    });
    // alignment gate: every ayah the report calls unresolved is absent; every absent ayah is accounted for
    const rep = (ds.translationReports || {})[ed.translation_id];
    if (ed.alignment_report && !rep) err(w, "alignment_report is declared but could not be read");
    if (rep) {
      const unresolved = new Set(rep.unresolved_ayahs || []);
      unresolved.forEach(id => { if (seen.has(id)) err(w, `ayah ${id} is unresolved in the alignment report but has text (unresolved alignment silently accepted)`); });
      if (ed.scope === "full") ayahs.forEach((_, id) => { if (!seen.has(id) && !unresolved.has(id)) err(w, `full edition has no text for ${id} and the report does not list it as unresolved`); });
      if (rep.summary && rep.summary.exact !== seen.size) err(w, `alignment report says ${rep.summary.exact} exact ayahs but the file has ${seen.size}`);
    }
  });

  /* ---------- analysis sets, origin, conflicts, per-source files (Stage 4 staging layer) ---------- */
  const ORIGINS = new Set((tax.origin || []).map(x => x.id));
  const CONFLICT_TYPES = new Set((tax.conflict_type || []).map(x => x.id));
  const SCOPES = new Set((tax.lemma_scope || []).map(x => x.id));
  const NOT_ACTIVE = new Set(["draft", "unresolved", "disputed", "null_policy"]);   // may not be a chosen analysis

  /** origin and status are separate: origin says who/what made the claim, status says how far it has been checked. */
  function checkOrigin(w, rec, { required: req = true } = {}) {
    if (rec.origin === undefined || rec.origin === null) { if (req) err(w, "missing origin"); return; }
    if (!ORIGINS.has(rec.origin)) { err(w, `unsupported origin "${rec.origin}"`); return; }
    if (rec.origin === "expert_reviewed") {
      if (rec.status !== "reviewed" && rec.status !== "verified") err(w, `origin "expert_reviewed" requires status reviewed or verified (found "${rec.status}"): nothing may claim expert review it does not have`);
      if (!rec.review || !rec.review.reviewer_id || !rec.review.date) err(w, `origin "expert_reviewed" requires review.reviewer_id and review.date`);
    }
    if ((rec.status === "reviewed" || rec.status === "verified") && rec.origin !== "expert_reviewed" && rec.origin !== "qurra_root_assignment") {
      err(w, `status "${rec.status}" requires origin expert_reviewed (or qurra_root_assignment under the frozen protocol), not "${rec.origin}"`);
    }
  }
  function checkExternalIds(w, ids) {
    if (ids === undefined) return;
    if (!Array.isArray(ids)) return err(w, "external_ids must be an array");
    ids.forEach((e, i) => { if (!e || typeof e.system !== "string" || !e.system || typeof e.id !== "string" || !e.id) err(`${w}.external_ids[${i}]`, "needs non-empty string system and id"); });
  }

  const directTokens = new Set((ds.tokenForms || []).map(t => t.token_id));
  const analysisIdSeen = new Map();
  const setByToken = new Map();
  (ds.analysisSets || []).forEach((set, i) => {
    const w = `analysis_sets[${i}](${set.token_id})`;
    required(w, set, ["token_id", "candidates"]);
    const token = tokens.get(set.token_id);
    if (!token) err(w, `token "${set.token_id}" does not exist`);
    if (setByToken.has(set.token_id)) err(w, "more than one analysis set for this token");
    setByToken.set(set.token_id, set);
    if (directTokens.has(set.token_id)) err(w, "the token has both a direct token_forms assignment and an analysis set; it must have exactly one");
    if (!Array.isArray(set.candidates) || !set.candidates.length) return err(w, "candidates must be a non-empty array");
    set.candidates.forEach((c, n) => {
      const cw = `${w}.candidates[${n}]`;
      required(cw, c, ["analysis_id", "form_id", "origin", "status", "source"]);
      checkId(cw, c.analysis_id);
      if (analysisIdSeen.has(c.analysis_id)) err(cw, `duplicate analysis_id "${c.analysis_id}"`);
      analysisIdSeen.set(c.analysis_id, set.token_id);
      checkStatus(cw, c.status);
      checkOrigin(cw, c);
      const f = forms.get(c.form_id);
      if (!f) err(cw, `form_id "${c.form_id}" does not exist`);
      else {
        referencedForms.add(c.form_id);
        if (token && f.surface !== token.text) err(cw, `form surface "${f.surface}" does not equal the token text "${token.text}"`);
      }
      if (c.source) {
        checkProvenance(cw, { source: c.source });          // registered, and not in_use=false
        if (c.origin === "source_derived") {
          if (!c.source.source_version) err(cw, "a source_derived analysis requires source.source_version");
          if (!c.source.source_ref) err(cw, "a source_derived analysis requires source.source_ref");
        }
        if (c.source.raw_tags !== undefined && (!Array.isArray(c.source.raw_tags) || c.source.raw_tags.some(t => typeof t !== "string"))) err(cw, "source.raw_tags must be an array of strings");
        checkExternalIds(`${cw}.source`, c.source.external_ids);
      }
      if (c.lemma_scope !== undefined) {
        if (!SCOPES.has(c.lemma_scope)) err(cw, `lemma_scope "${c.lemma_scope}" is not in the taxonomy`);
        else if (c.lemma_scope === "token" && f && f.segments.filter(s => s.type === "stem").length !== 1) err(cw, `lemma_scope "token" is only valid for a form with exactly one stem (this form has ${f.segments.filter(s => s.type === "stem").length}): a whole-token lemma cannot be attached unambiguously`);
      }
    });
    if (set.chosen !== null && set.chosen !== undefined) {
      const ch = set.candidates.find(c => c.analysis_id === set.chosen);
      if (!ch) err(w, `chosen "${set.chosen}" is not one of this token's candidates`);
      else if (NOT_ACTIVE.has(ch.status)) err(w, `chosen analysis has status "${ch.status}", which may not be active`);
    } else if (set.chosen === undefined) err(w, `missing "chosen" (use null when no analysis is active)`);
  });

  /* conflicts */
  unique("conflicts", ds.conflicts || [], "conflict_id");
  const CONFLICT_STATUSES = new Set(["disputed", "unresolved", "provisional", "reviewed", "verified"]);
  (ds.conflicts || []).forEach((c, i) => {
    const w = `conflicts[${i}](${c.conflict_id})`;
    required(w, c, ["conflict_id", "type", "subject", "competing", "decision", "status"]);
    if (!CONFLICT_TYPES.has(c.type)) err(w, `type "${c.type}" is not in the taxonomy`);
    if (!CONFLICT_STATUSES.has(c.status)) err(w, `conflict status must be one of ${[...CONFLICT_STATUSES].join("|")} (found "${c.status}")`);
    const subj = c.subject || {};
    const lemmaIds = subj.lemma_ids || [];
    if (c.type === "root") {
      if (!lemmaIds.length) err(w, "a root conflict needs subject.lemma_ids");
    } else if (!subj.token_id) err(w, `a ${c.type} conflict needs subject.token_id`);
    if (subj.token_id && !tokens.has(subj.token_id)) err(w, `subject token "${subj.token_id}" does not exist`);
    lemmaIds.forEach(id => { if (!lemmas.has(id)) err(w, `subject lemma "${id}" does not exist`); });
    const comp = Array.isArray(c.competing) ? c.competing : [];
    if (comp.length < 2) err(w, "a conflict needs at least two competing values");
    const compIds = new Set();
    comp.forEach((x, n) => {
      if (!x || !x.id || !x.label) err(`${w}.competing[${n}]`, "needs id and label");
      else if (compIds.has(x.id)) err(`${w}.competing[${n}]`, `duplicate competing id "${x.id}"`);
      compIds.add(x && x.id);
      if (x && x.analysis_id && analysisIdSeen.get(x.analysis_id) !== subj.token_id) err(`${w}.competing[${n}]`, `analysis_id "${x.analysis_id}" is not a candidate of ${subj.token_id}`);
    });
    const d = c.decision || {};
    if (c.status === "disputed" || c.status === "unresolved") {
      if (d.chosen !== null && d.chosen !== undefined) err(w, `an ${c.status} conflict must not carry a decision (disagreements are never resolved automatically)`);
    } else {
      if (!d.chosen || !compIds.has(d.chosen)) err(w, `a ${c.status} conflict needs decision.chosen to be one of its competing ids`);
      if (typeof d.rationale !== "string" || !d.rationale.trim()) err(w, "a decision needs a written rationale");
      checkOrigin(`${w}.decision`, { origin: d.origin, status: c.status, review: c.review });
    }
    // a token whose segmentation/lemma/POS/feature is in open dispute has no active analysis
    if ((c.status === "disputed" || c.status === "unresolved") && c.type !== "root" && setByToken.has(subj.token_id) && setByToken.get(subj.token_id).chosen) {
      err(w, `the conflict is ${c.status} but token ${subj.token_id} still has an active analysis; set its analysis set's chosen to null`);
    }
    // root conflicts must agree with the lemmas' root assignments
    if (c.type === "root") lemmaIds.forEach(id => {
      const l = lemmas.get(id);
      if (!l) return;
      const rs = l.root.status;
      // the lemma and the conflict must agree on what the candidates are (consistency only; no candidate is preferred)
      comp.forEach(x => { if (x && x.value && !(l.root.candidates || []).includes(x.value)) err(w, `competing value "${x.value}" is not listed in lemma ${id}'s root.candidates (they must agree)`); });
      if (c.status === "disputed" || c.status === "unresolved") {
        if (rs !== "disputed" && rs !== "unresolved") err(w, `lemma ${id} root status is "${rs}" but the conflict is ${c.status}`);
        if (l.root.root_id) err(w, `lemma ${id} carries a root while its root conflict is ${c.status}`);
      } else if (l.root.root_id && d.chosen) {
        const chosen = comp.find(x => x.id === d.chosen);
        const root = roots.get(l.root.root_id);
        if (chosen && chosen.value && root && root.display !== chosen.value) err(w, `decision value "${chosen.value}" differs from lemma ${id}'s root "${root.display}"`);
      }
    });
  });

  /* origin on root assignments, external ids on lemmas */
  (ds.lemmas || []).forEach(l => {
    if (l.root && l.root.origin !== undefined) checkOrigin(`lemmas(${l.lemma_id}).root`, { origin: l.root.origin, status: l.root.status, review: l.root.review });
    checkExternalIds(`lemmas(${l.lemma_id})`, l.external_ids);
  });

  /* per-source files (none exist in production today) */
  (ds.tagMaps || []).forEach(({ file, data }) => validateTagMap(file, data, tax, { sources, production: true }).forEach(e => errors.push(e)));
  (ds.alignments || []).forEach(({ file, data }) => validateAlignmentFile(file, data, { sources, tokenIds: new Set(tokens.keys()) }).forEach(e => errors.push(e)));

  /* ---------- orphans (warnings only) ---------- */
  (ds.forms || []).forEach(f => { if (!referencedForms.has(f.form_id)) warn(`form ${f.form_id}`, "not referenced by any token"); });
  (ds.roots || []).forEach(r => { if (!referencedRoots.has(r.root_id)) warn(`root ${r.root_id}`, "not referenced by any lemma"); });
  (ds.lemmas || []).forEach(l => {
    if (!referencedLemmas.has(l.lemma_id)) warn(`lemma ${l.lemma_id}`, "has no occurrences (allowed, shown honestly in the UI)");
    if (!glossByLemma.has(l.lemma_id)) warn(`lemma ${l.lemma_id}`, "has no gloss record");
  });

  return { errors, warnings, stats: {
    sources: (ds.sources || []).length, surahs: (ds.surahs || []).length, ayahs: (ds.ayahs || []).length, tokens: (ds.tokens || []).length,
    forms: (ds.forms || []).length, lemmas: (ds.lemmas || []).length, roots: (ds.roots || []).length, glosses: (ds.glosses || []).length
  } };
}

module.exports = { validate, skeleton };
