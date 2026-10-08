#!/usr/bin/env node
"use strict";
/* Full pipeline: validate -> validator tests -> generate dataset + search index -> data-layer tests -> syntax-check every JS file.
   Fails loudly (non-zero exit) at the first failing step. */
const { spawnSync } = require("child_process");
const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
function run(label, args) {
  console.log(`\n== ${label}`);
  const r = spawnSync(process.execPath, args, { cwd: ROOT, stdio: "inherit" });
  if (r.status !== 0) { console.error(`\nbuild: step failed: ${label}`); process.exit(r.status || 1); }
}

run("rule-based analysis layer (lexicon -> data/qurra/generated)", ["scripts/analyse/generate.js"]);
run("validate data", ["scripts/validate-data.js"]);
run("validator tests", ["scripts/tests/test-validate.js"]);
run("analysis/staging layer tests (synthetic source only)", ["scripts/tests/test-analysis.js"]);
run("generate dataset + search index", ["scripts/build-dataset.js"]);
run("data-layer tests (display policy, model separations)", ["scripts/tests/test-data-layer.js"]);
run("content tests (licensing gate, alignment, translations, coverage, search)", ["scripts/tests/test-content.js"]);
run("word-analysis tests (every token resolves, pilot intact, roots held back)", ["scripts/tests/test-wordanalysis.js"]);
run("juz membership tests", ["scripts/tests/test-juz.js"]);
run("coverage report", ["scripts/report/coverage.js"]);
run("source research document", ["scripts/report/source-research.js"]);

// "lint": syntax-check every JS file the browser loads or the build runs (no third-party linter is used in this repo).
const files = [];
(function walk(dir) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (e.name === "node_modules" || e.name === ".git" || e.name === "legacy") continue;
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p); else if (e.name.endsWith(".js")) files.push(p);
  }
})(path.join(ROOT, "js"));
(function walk(dir) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (e.name === "legacy") continue;
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p); else if (e.name.endsWith(".js")) files.push(p);
  }
})(path.join(ROOT, "scripts"));
console.log(`\n== syntax check (${files.length} JS files)`);
let bad = 0;
for (const f of files) {
  const r = spawnSync(process.execPath, ["--check", f], { encoding: "utf8" });
  if (r.status !== 0) { bad++; console.error(r.stderr); }
}
if (bad) { console.error(`build: ${bad} file(s) failed the syntax check`); process.exit(1); }
console.log("syntax check: OK");
console.log("\nbuild: OK");
