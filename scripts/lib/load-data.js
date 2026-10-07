"use strict";
/* Reads the hand-editable source files into one in-memory dataset object.
   Pure I/O plus two mechanical steps: applying a file's `defaults` to its records, and materialising
   the token layer from the ayah text (scripts/lib/tokenize.js). All rules live in validate.js. */
const fs = require("fs");
const path = require("path");
const { materializeTokens } = require("./tokenize");

const FILES = {
  sources: ["data/sources.json", "sources"],
  taxonomy: ["data/taxonomy.json", null],
  surahs: ["data/meta/surahs.json", "surahs"],
  juz: ["data/meta/juz.json", "juz"],
  ayahs: ["data/qurra/ayahs.json", "ayahs"],
  tokenForms: ["data/qurra/token-forms.json", "token_forms"],
  forms: ["data/qurra/forms.json", "forms"],
  lemmas: ["data/qurra/lemmas.json", "lemmas"],
  roots: ["data/qurra/roots.json", "roots"],
  glosses: ["data/qurra/glosses.json", "glosses"],
  ayahTranslations: ["data/qurra/ayah-translations.json", "ayah_translations"]
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
  ds.tokens = materializeTokens(ds.ayahs.filter(a => typeof a.text === "string" && a.provenance), ds.tokenForms);
  ds._loadProblems = problems;
  return ds;
}

module.exports = { loadDataset, FILES, RAW };
