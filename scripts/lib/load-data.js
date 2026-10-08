"use strict";
/* Reads the hand-editable source files into one in-memory dataset object.
   Pure I/O plus two mechanical steps: applying a file's `defaults` to its records, and materialising
   the token layer from the ayah text (scripts/lib/tokenize.js). All rules live in validate.js. */
const fs = require("fs");
const path = require("path");
const { materializeTokens, effectiveTokenForms } = require("./tokenize");

const FILES = {
  sources: ["data/sources.json", "sources"],
  taxonomy: ["data/taxonomy.json", null],
  surahs: ["data/meta/surahs.json", "surahs"],
  juz: ["data/meta/juz.json", "juz"],
  ayahs: ["data/qurra/ayahs.json", "ayahs"],
  tokenForms: ["data/qurra/token-forms.json", "token_forms"],
  analysisSets: ["data/qurra/analyses.json", "analysis_sets"],
  conflicts: ["data/qurra/conflicts.json", "conflicts"],
  forms: ["data/qurra/forms.json", "forms"],
  lemmas: ["data/qurra/lemmas.json", "lemmas"],
  roots: ["data/qurra/roots.json", "roots"],
  glosses: ["data/qurra/glosses.json", "glosses"],
  translationEditions: ["data/translations/editions.json", "editions"]
};
const RAW = {
  rawText: "data/raw/tanzil/quran-uthmani.txt",
  rawMeta: "data/raw/tanzil/quran-data.js",
  notice: "NOTICE"
};

function loadDataset(rootDir) {
  const ds = { _files: {} };
  const problems = [];
  for (const [name, [rel, key]] of Object.entries(FILES)) {
    const p = path.join(rootDir, rel);
    let parsed;
    try {
      const text = fs.readFileSync(p, "utf8");
      ds._files[name] = text;
      parsed = JSON.parse(text);
    } catch (e) {
      problems.push(`${rel}: cannot read/parse (${e.message})`);
      ds[name] = key ? [] : {};
      continue;
    }
    if (key && !Array.isArray(parsed[key])) {
      problems.push(`${rel}: expected a top-level "${key}" array`);
      ds[name] = [];
    } else {
      ds[name] = key ? parsed[key] : parsed;
    }
    if (parsed.defaults && Array.isArray(ds[name])) {          // records inherit the file's defaults
      ds[name] = ds[name].map(r => Object.assign({}, parsed.defaults, r));
    }
  }
  for (const [name, rel] of Object.entries(RAW)) {
    try {
      ds[name] = fs.readFileSync(path.join(rootDir, rel), "utf8");
      ds._files[name] = ds[name];
    } catch (e) {
      problems.push(`${rel}: cannot read (${e.message})`);
      ds[name] = "";
      ds._files[name] = "";
    }
  }
  // Optional, per-source files. None exist in production today: external sources are uncleared and are not imported.
  //   data/mappings/<source_id>.tags.json   (tag mapping)        data/alignments/<source_id>.json   (token alignment)
  for (const [name, dir] of [["tagMaps", "data/mappings"], ["alignments", "data/alignments"]]) {
    ds[name] = [];
    const abs = path.join(rootDir, dir);
    if (!fs.existsSync(abs)) continue;
    for (const f of fs.readdirSync(abs).filter(f => f.endsWith(".json")).sort()) {
      try { ds[name].push({ file: dir + "/" + f, data: JSON.parse(fs.readFileSync(path.join(abs, f), "utf8")) }); }
      catch (e) { problems.push(dir + "/" + f + ": cannot read/parse (" + e.message + ")"); }
    }
  }
  // The rule-based analysis layer is generated (scripts/analyse/generate.js) into data/qurra/generated/; it is appended to the
  // hand-written pilot records and never replaces them.
  for (const [name, key] of [["lemmas", "lemmas"], ["roots", "roots"], ["glosses", "glosses"], ["forms", "forms"]]) {
    const rel = "data/qurra/generated/" + name + ".json";
    const abs = path.join(rootDir, rel);
    if (!fs.existsSync(abs)) continue;
    try {
      const text = fs.readFileSync(abs, "utf8");
      ds._files["generated:" + name] = text;
      ds[name] = ds[name].concat(JSON.parse(text)[key]);
    } catch (e) { problems.push(rel + ": cannot read/parse (" + e.message + ")"); }
  }
  // Translation editions: the registry lists each edition and its file; the text lives in that file (records: [{ayah_id, text, ...}]).
  ds.translationTexts = {};
  ds.translationReports = {};
  for (const ed of ds.translationEditions) {
    if (!ed || typeof ed.file !== "string") continue;
    try { ds.translationTexts[ed.translation_id] = JSON.parse(fs.readFileSync(path.join(rootDir, ed.file), "utf8")); ds._files["translation:" + ed.translation_id] = fs.readFileSync(path.join(rootDir, ed.file), "utf8"); }
    catch (e) { problems.push(ed.file + ": cannot read/parse (" + e.message + ")"); }
    if (ed.alignment_report) {
      try { ds.translationReports[ed.translation_id] = JSON.parse(fs.readFileSync(path.join(rootDir, ed.alignment_report), "utf8")); }
      catch (e) { problems.push(ed.alignment_report + ": cannot read/parse (" + e.message + ")"); }
    }
  }
  ds.effectiveTokenForms = effectiveTokenForms(ds.tokenForms, ds.analysisSets);
  ds.tokens = materializeTokens(ds.ayahs.filter(a => typeof a.text === "string" && a.provenance), ds.tokenForms, ds.analysisSets);
  ds._loadProblems = problems;
  return ds;
}

module.exports = { loadDataset, FILES, RAW };
