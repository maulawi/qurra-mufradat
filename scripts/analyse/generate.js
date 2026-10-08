#!/usr/bin/env node
"use strict";
/* Generates the QURRA rule-based analysis layer from the hand-written lexicon (data/lexicon/*.json).

   Writes data/qurra/generated/{lemmas,glosses,roots,forms}.json and data/qurra/generated/report.json.
   Deterministic: same lexicon + same Qur'anic text => byte-identical output. `--check` fails if the files are stale.

   QURRA-authored and provisional. Nothing is taken from QAC, QuranMorph, MASAQ, QAMAR, QUL, Wikidata or any other
   morphology dataset. See docs/word-analysis-method.md. */
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const E = require("./engine");
const rootModel = require("../lib/rootmodel");
const { expandVerb, expandHollow, expandDefective } = require("./templates");

const ROOT = path.resolve(__dirname, "..", "..");
const rd = rel => JSON.parse(fs.readFileSync(path.join(ROOT, rel), "utf8"));
const OUT_DIR = path.join(ROOT, "data", "qurra", "generated");
const SRC_LEX = "QURRA_LEXICON", SRC_RULE = "QURRA_RULE_ANALYSIS";

function loadLexicon() {
  const dir = path.join(ROOT, "data", "lexicon");
  const entries = [], prefer = [];
  for (const f of fs.readdirSync(dir).filter(f => f.endsWith(".json")).sort()) {
    const j = JSON.parse(fs.readFileSync(path.join(dir, f), "utf8"));
    (j.entries || []).forEach(e => entries.push({ ...e, _file: f }));
    (j.prefer || []).forEach(p => prefer.push(p));
  }
  return { entries, prefer };
}

function build() {
  const tax = rd("data/taxonomy.json");
  const slug = tax.root_letters.letters;
  const lemmasP = rd("data/qurra/lemmas.json").lemmas, rootsP = rd("data/qurra/roots.json").roots;
  const pilotLemma = new Map(lemmasP.map(l => [l.lemma_id, l]));
  const rootExists = new Map(rootsP.map(r => [r.display, r]));
  const { entries, prefer } = loadLexicon();

  /* ---- lemmas, glosses, roots (new ones only; pilot lemmas are never redefined) ---- */
  const lemmas = [], glosses = [], roots = new Map();
  const lemmaPos = new Map(lemmasP.map(l => [l.lemma_id, l.pos]));
  const seenIds = new Set();
  for (const e of entries) {
    if (!e.lemma_id) continue;                              // a lexicon item that only lists fused spellings
    if (e.more) {                                           // extra spellings for a lemma defined elsewhere
      if (!lemmaPos.has(e.lemma_id) && !pilotLemma.has(e.lemma_id)) throw new Error(`lexicon: "more" entry for unknown lemma ${e.lemma_id}`);
      e.pos = lemmaPos.get(e.lemma_id) || pilotLemma.get(e.lemma_id).pos;
      continue;
    }
    if (seenIds.has(e.lemma_id) && !e.more) throw new Error(`lexicon: duplicate lemma_id ${e.lemma_id} (${e._file})`);
    seenIds.add(e.lemma_id);
    if (e.existing) { if (!pilotLemma.has(e.lemma_id)) throw new Error(`lexicon: ${e.lemma_id} is marked existing but is not in lemmas.json`); e.pos = pilotLemma.get(e.lemma_id).pos; continue; }
    if (pilotLemma.has(e.lemma_id)) throw new Error(`lexicon: ${e.lemma_id} already exists in lemmas.json; mark the entry "existing": true`);
    for (const k of ["lemma", "pos", "en", "ms"]) if (!e[k]) throw new Error(`lexicon ${e.lemma_id}: missing ${k}`);
    lemmaPos.set(e.lemma_id, e.pos);
    const l = { lemma_id: e.lemma_id, form_vocalized: e.lemma, pos: e.pos };
    if (e.dt) l.derivation_type = e.dt;
    if (e.vf) l.verb_form = e.vf;
    if (e.pos === "particle") l.function_inventory = e.fn || [];
    const rootRec = { root_id: null, status: "unresolved", candidates: [], rule_ids: [], evidence: [], origin: "qurra_editorial" };
    const protoProv = { source_id: "QURRA_ROOT_PROTOCOL", status: "pending_expert_review" };
    if (e.root && e.rs !== "unresolved" && e.rs !== "disputed") {
      /* The number of radicals is not fixed at three: the allowed lengths come from taxonomy.root_category. */
      const letters = rootModel.splitRoot(e.root);
      const bad = rootModel.problemsWithRoot(e.root, tax);
      if (bad.length) throw new Error(`lexicon ${e.lemma_id}: ${bad.map(b => b.message).join("; ")}`);
      const rid = "root-" + letters.map(c => slug[c]).join("-");
      if (!rootExists.has(e.root) && !roots.has(e.root)) {
        if (!e.root_en || !e.root_ms) throw new Error(`lexicon ${e.lemma_id}: first use of root "${e.root}" needs root_en and root_ms`);
        roots.set(e.root, { root_id: rid, letters, display: e.root, ...(letters.length === 3 ? {} : { root_category: rootModel.categoryByCount(tax).get(letters.length) }), root_type: rootModel.rootTypeOf(letters), core_field: { en: e.root_en, ms: e.root_ms }, status: "provisional",
          provenance: { letters: { source_id: SRC_LEX }, core_field: { source_id: SRC_LEX } } });
      }
      Object.assign(rootRec, { root_id: rid, status: "provisional", provenance: { source_id: SRC_LEX, status: "provisional_not_assigned_under_protocol" } });
    } else if (e.root) {
      Object.assign(rootRec, { status: e.rs, candidates: [e.root].concat(e.root_alt || []), provenance: protoProv });
    } else if (e.pos === "particle" || e.rs === "null_policy") {
      Object.assign(rootRec, { status: "null_policy", provenance: protoProv });
    } else rootRec.provenance = protoProv;
    lemmas.push({ ...l, root: rootRec, status: "provisional", provenance: { lemma: { source_id: SRC_LEX } } });
    glosses.push({ gloss_id: "gloss-" + e.lemma_id, lemma_id: e.lemma_id, lexical: { en: e.en, ms: e.ms }, contextual_explanations: [],
      learner_note: e.note ? { en: e.note[0], ms: e.note[1] } : null, usage_note: null, example: null, editor_note: null, status: "provisional", provenance: { source_id: "QURRA_GLOSS" } });
  }

  // noun shorthands: n (masc. triptote) nf (fem. triptote) nt (fem. in -ta marbuta) bp (broken plurals) sm / sf (sound plurals) adj (all forms of an adjective or participle)
  for (const e of entries) {
    const items = (e.noun || []).slice();
    (e.n || []).forEach(b => items.push({ b }));
    (e.nf || []).forEach(b => items.push({ b, g: "muannath" }));
    (e.nt || []).forEach(b => items.push({ b: (/[\u064B-\u0650\u0670]$/.test(E.canon(b)) ? b : b + "\u064E") + "\u0629", t: "fem", g: "muannath" }));
    (e.bp || []).forEach(b => items.push({ b, n: "jama", pl: "jama_taksir" }));
    (e.bpf || []).forEach(b => items.push({ b, n: "jama", pl: "jama_taksir", g: "muannath" }));
    (e.sm || []).forEach(b => items.push({ b, t: "sm", n: "jama", pl: "jama_mudhakkar_salim" }));
    (e.sf || []).forEach(b => items.push({ b, t: "sf", n: "jama", g: "muannath", pl: "jama_muannath_salim" }));
    (e.adj || []).forEach(b => {
      items.push({ b }, { b: (/[\u064B-\u0650\u0670]$/.test(E.canon(b)) ? b : b + "\u064E") + "\u0629", t: "fem", g: "muannath" }, { b, t: "sm", n: "jama", pl: "jama_mudhakkar_salim" }, { b, t: "sf", n: "jama", g: "muannath", pl: "jama_muannath_salim" }, { b, t: "dual", n: "muthanna" });
    });
    if (items.length) e.noun = items;
  }

  // sound verbs are expanded from a template (see templates.js): sv = impf vowel (form I) or true (derived forms)
  for (const e of entries) {
    if (e.hv && !e.verb) e.verb = expandHollow((e.letters || e.root).split(" "), e.hv);
    if (e.nq && !e.verb) e.verb = expandDefective(e.nq);
    if (e.sv && !e.verb) {
      const letters = (e.letters || e.root || "").split(" ");
      if (letters.length !== 3) throw new Error(`lexicon ${e.lemma_id}: sv needs 3 root letters`);
      e.verb = expandVerb(letters, e.vf || "I", e.sv === true ? undefined : e.sv, e.pv);
    }
    if (e.x) e.verb = { ...(e.verb || {}), x: ((e.verb && e.verb.x) || []).concat(e.x) };
  }

  /* ---- stem index and per-spelling parses ---- */
  const index = E.buildIndex(entries);
  const ayahs = rd("data/qurra/ayahs.json").ayahs;
  const freq = new Map();
  ayahs.forEach(a => a.text.split(" ").forEach(w => freq.set(w, (freq.get(w) || 0) + 1)));
  const spellings = [...freq.keys()].sort((a, b) => freq.get(b) - freq.get(a) || (a < b ? -1 : 1));
  const entryOf = new Map(entries.map(e => [e.lemma_id, e]));
  const fnOf = lemmaId => { const l = pilotLemma.get(lemmaId) || lemmas.find(x => x.lemma_id === lemmaId); return l; };

  const forms = [], ambiguous = [], unmatched = [];
  const parseKey = p => JSON.stringify([p.procs.map(x => x.surface), p.article && p.article.surface, p.stem.surface, p.stem.rec.lemma_id, p.encl && p.encl.surface]);
  for (const sp of spellings) {
    const parses = E.parseToken(index, lemmaPos, sp);
    if (!parses.length) { unmatched.push(sp); continue; }
    // group by segmentation + lemma
    const groups = new Map();
    parses.forEach(p => { const k = parseKey(p); if (!groups.has(k)) groups.set(k, []); groups.get(k).push(p); });
    let chosen = null, note = null;
    if (groups.size === 1) chosen = [...groups.values()][0];
    else {
      const lemmaSet = new Set([...groups.values()].map(g => g[0].stem.rec.lemma_id));
      const rule = prefer.find(x => (x.surface ? E.canon(x.surface) === E.canon(sp) : lemmaSet.has(x.lemma_id) && (x.over || []).length && [...lemmaSet].every(l => l === x.lemma_id || x.over.includes(l))));
      if (rule) {
        const hit = [...groups.values()].filter(g => g[0].stem.rec.lemma_id === rule.lemma_id);
        if (hit.length === 1) { chosen = hit[0]; note = rule.note || null; }
      }
      if (!chosen && lemmaSet.size === 1) {            // one lemma, several segmentations (an optional prefix or pronoun): the whole-word reading wins
        const gs = [...groups.values()].map(g => ({ g, n: g[0].procs.length + (g[0].article ? 1 : 0) + (g[0].encl ? 1 : 0) })).sort((a, b) => a.n - b.n);
        if (gs.length === 1 || gs[0].n < gs[1].n) chosen = gs[0].g;
      }
      if (!chosen) {                                   // the reading with fewer weak prefixes (interrogative a-, emphatic la-) wins, if that is unique
        const weak = g => g[0].procs.filter(p => p.fn === null || p.fn === "istifham").length;
        const gs = [...groups.values()].map(g => ({ g, n: weak(g) })).sort((a, b) => a.n - b.n);
        if (gs[0].n < gs[1].n) chosen = gs[0].g;
      }
      if (!chosen) { ambiguous.push({ surface: sp, count: freq.get(sp), readings: [...groups.values()].map(g => g[0].stem.rec.lemma_id + (g[0].encl ? "+pron" : "") + (g[0].article ? "+al" : "")) }); continue; }
    }
    forms.push(makeForm(sp, chosen, note));
  }

  function makeForm(sp, parses, note) {
    const p = parses[0];
    const id = "frm-sd-" + crypto.createHash("sha1").update(sp).digest("hex").slice(0, 10);
    const segs = [];
    const add = s => segs.push({ segment_id: `${id}.s${segs.length + 1}`, ...s });
    p.procs.forEach(x => { const s = { type: "proclitic", surface: x.surface, pos: "particle" }; if (x.fn) s.function = x.fn; add(s); });
    if (p.article) add({ type: "proclitic", surface: p.article.surface, pos: "particle", function: "definite_article" });
    const rec = p.stem.rec;
    if (rec.multi) {                                   // a fused spelling: cut the token's own slice at the part boundaries
      let rem = p.stem.surface;
      rec.multi.forEach(([surf, lemmaId], n) => {
        let piece = rem;
        if (n < rec.multi.length - 1) {
          const k = E.boundaries(rem).find(j => j > 0 && E.lkey(rem.slice(0, j)) === E.lkey(surf));
          if (k === undefined) throw new Error(`lexicon fused entry: cannot cut "${rem}" at "${surf}"`);
          piece = rem.slice(0, k); rem = rem.slice(k);
        }
        add({ type: "stem", surface: piece, pos: lemmaPos.get(lemmaId), lemma_id: lemmaId });
      });
    }
    else add({ type: "stem", surface: p.stem.surface, pos: rec.pos, lemma_id: rec.lemma_id });
    if (p.encl) {
      const pf = { person: p.encl.f.person, number: p.encl.f.number };
      if (p.encl.f.gender) pf.gender = p.encl.f.gender;
      add({ type: "enclitic", surface: p.encl.surface, pos: "noun", pronoun_features: pf });
    }
    // morphology: keys on which every parse agrees (a spelling that is 3fs or 2ms keeps aspect/number/voice, not person/gender)
    const ms = parses.map(x => x.stem.rec.morph);
    const morph = {};
    Object.keys(ms[0]).forEach(k => { if (ms.every(m => JSON.stringify(m[k]) === JSON.stringify(ms[0][k]))) morph[k] = ms[0][k]; });
    if (rec.pos === "noun" && morph.definiteness === undefined && !rec.morph.reference_class) {
      if (p.article) morph.definiteness = { state: "marifa", cause: "bi_al" };
      else if (p.encl) morph.definiteness = { state: "marifa", cause: "idafa" };
      else if (parses.every(x => x.stem.rec.ending === "indef")) morph.definiteness = { state: "nakira" };
    }
    const f = { form_id: id, surface: sp, segments: segs, morphology: morph, status: "provisional", basis: "rule_default", provenance: { morphology: { source_id: SRC_RULE }, form: { source_id: SRC_RULE } } };
    const merged = parses.length > 1 && ms.some(m => JSON.stringify(m) !== JSON.stringify(ms[0]));
    if (!note && rec.note) note = rec.note;
    if (!note && p.article && p.article.fusedLam) note = ["The lam of the article is written together with the stem's first lam (one doubled lam).", "Lam alif lam ditulis bersama lam pertama kata dasar (satu lam bersabdu)."];
    if (!note && p.encl && p.encl.fused) note = ["The nun of the pronoun -na is written together with the doubled nun before it.", "Nun pada kata ganti -na ditulis bersama nun bersabdu sebelumnya."];
    if (note) f.segmentation_note = { en: note[0], ms: note[1] };
    else if (merged) f.segmentation_note = { en: "This spelling fits more than one person/gender; only the features common to every reading are shown.", ms: "Ejaan ini sesuai dengan lebih daripada satu orang/jantina; hanya ciri yang sama bagi semua bacaan dipaparkan." };
    return f;
  }

  /* ---- stable ordering ---- */
  lemmas.sort((a, b) => a.lemma_id.localeCompare(b.lemma_id));
  glosses.sort((a, b) => a.gloss_id.localeCompare(b.gloss_id));
  const rootList = [...roots.values()].sort((a, b) => a.root_id.localeCompare(b.root_id));
  forms.sort((a, b) => a.form_id.localeCompare(b.form_id));

  /* ---- pilot conflicts: where a rule default differs from a pilot analysis of the same spelling (reported, never applied) ---- */
  const formsP = rd("data/qurra/forms.json").forms, byIdP = new Map(formsP.map(f => [f.form_id, f]));
  const sig = f => f.segments.map(s => s.type[0] + ":" + (s.lemma_id || s.function || "")).join("|");
  const genBySurface = new Map(forms.map(f => [f.surface, f]));
  const conflicts = [];
  formsP.forEach(pf => {
    const g = genBySurface.get(pf.surface);
    if (g && sig(g) !== sig(pf)) conflicts.push({ surface: pf.surface, pilot_form: pf.form_id, pilot: sig(pf), rule_default: sig(g), rule_form: g.form_id });
  });
  const seenC = new Set();
  const conflictsU = conflicts.filter(c => { const k = c.pilot_form + c.rule_form; if (seenC.has(k)) return false; seenC.add(k); return true; });

  const unmatchedTop = unmatched.slice(0, 400).map(s => [s, freq.get(s)]);
  const report = {
    note: "Generated by scripts/analyse/generate.js. Counts are over distinct spellings and over token occurrences.",
    lexicon_entries: entries.length, new_lemmas: lemmas.length, new_roots: rootList.length,
    spellings_total: spellings.length, spellings_analysed: forms.length, spellings_ambiguous: ambiguous.length, spellings_unmatched: unmatched.length,
    occurrences_analysed: forms.reduce((n, f) => n + freq.get(f.surface), 0), occurrences_ambiguous: ambiguous.reduce((n, a) => n + a.count, 0),
    pilot_conflicts: conflictsU,
    ambiguous_top: ambiguous.slice(0, 200),
    unmatched_top: unmatchedTop
  };
  return { lemmas, glosses, roots: rootList, forms, report };
}

function files(out) {
  const j = o => JSON.stringify(o, null, 1) + "\n";
  const note = "GENERATED by scripts/analyse/generate.js from data/lexicon/*.json. Do not edit; edit the lexicon and run: node scripts/analyse/generate.js";
  return {
    "lemmas.json": j({ _comment: note, lemmas: out.lemmas }),
    "glosses.json": j({ _comment: note, glosses: out.glosses }),
    "roots.json": j({ _comment: note, roots: out.roots }),
    "forms.json": j({ _comment: note, forms: out.forms }),
    "report.json": j(out.report)
  };
}

if (require.main === module) {
  const out = build();
  const fl = files(out);
  fs.mkdirSync(OUT_DIR, { recursive: true });
  const check = process.argv.includes("--check");
  let stale = 0;
  for (const [name, text] of Object.entries(fl)) {
    const p = path.join(OUT_DIR, name);
    if (check) { if (!fs.existsSync(p) || fs.readFileSync(p, "utf8") !== text) { console.error("STALE data/qurra/generated/" + name + " — run: node scripts/analyse/generate.js"); stale++; } }
    else fs.writeFileSync(p, text);
  }
  const r = out.report;
  console.log(`lexicon ${r.lexicon_entries} entries -> ${r.new_lemmas} new lemmas, ${r.new_roots} new roots; ` +
    `${r.spellings_analysed}/${r.spellings_total} spellings analysed (${r.occurrences_analysed} tokens), ${r.spellings_ambiguous} ambiguous (${r.occurrences_ambiguous} tokens), ${r.pilot_conflicts.length} pilot conflicts`);
  if (check) { if (stale) process.exit(1); console.log("analysis generation: up to date"); }
}
module.exports = { build, files };
