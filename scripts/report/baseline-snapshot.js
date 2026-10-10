#!/usr/bin/env node
"use strict";
/* Records (or checks) a fingerprint of every analysed spelling: surface -> short hash of its segments (type, surface,
   lemma, function) and morphology. The coverage expansion may ADD analyses; this fingerprint proves that the analyses that
   existed before were not changed. Usage: node scripts/report/baseline-snapshot.js [--write]   (default: print a comparison). */
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const { loadDataset } = require("../lib/load-data");

const ROOT = path.resolve(__dirname, "..", "..");
const FIXTURE = path.join(ROOT, "scripts", "tests", "fixtures", "baseline-analysis-v1.json");
const h = o => crypto.createHash("sha1").update(JSON.stringify(o)).digest("hex").slice(0, 8);

function snapshot(ds) {
  const out = {};
  ds.forms.forEach(f => {
    if (out[f.surface] !== undefined && f.basis === "rule_default") return;   // a pilot analysis always wins over a rule default for the same spelling
    out[f.surface] = h([f.segments.map(s => [s.type, s.surface, s.lemma_id || null, s.function || null, s.pos]), f.morphology, f.basis || "pilot"]);
  });
  return out;
}
/** fingerprints of the lemma, root and gloss records (the expansion may add records but must not change these) */
function recordSnapshot(ds) {
  const m = arr => Object.fromEntries(arr.map(([k, o]) => [k, h(o)]));
  return {
    lemmas: m(ds.lemmas.map(l => [l.lemma_id, l])),
    roots: m(ds.roots.map(r => [r.root_id, r])),
    glosses: m(ds.glosses.map(g => [g.gloss_id, g]))
  };
}
module.exports = { snapshot, recordSnapshot, FIXTURE };

if (require.main === module) {
  const ds = loadDataset(ROOT);
  const snap = snapshot(ds);
  if (process.argv.includes("--write")) {
    const tokens = ds.tokens.length;
    fs.writeFileSync(FIXTURE, JSON.stringify({ note: "Fingerprint of the analyses that existed before the coverage expansion (surface -> hash of segments + morphology). Do not edit by hand.", spellings: Object.keys(snap).length, tokens_in_text: tokens, records: recordSnapshot(ds), rule_surfaces: [...new Set(ds.forms.filter(f => f.basis === "rule_default").map(f => f.surface))].sort(), snapshot: snap }) + "\n");
    console.log("wrote", FIXTURE, Object.keys(snap).length, "spellings");
  } else {
    const base = JSON.parse(fs.readFileSync(FIXTURE, "utf8")).snapshot;
    let changed = 0, missing = 0;
    Object.keys(base).forEach(s => { if (snap[s] === undefined) missing++; else if (snap[s] !== base[s]) changed++; });
    console.log(`baseline spellings ${Object.keys(base).length}; now ${Object.keys(snap).length}; changed ${changed}; missing ${missing}; added ${Object.keys(snap).filter(s => base[s] === undefined).length}`);
  }
}
