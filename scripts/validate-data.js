#!/usr/bin/env node
"use strict";
/* Validates data/ (sources, taxonomy, meta, raw, qurra). Exit code 1 on any error. */
const path = require("path");
const { loadDataset } = require("./lib/load-data");
const { validate } = require("./lib/validate");

const ROOT = path.resolve(__dirname, "..");
const ds = loadDataset(ROOT);
const { errors, warnings, stats } = validate(ds);

warnings.forEach(w => console.log("warn  " + w));
if (errors.length) {
  errors.forEach(e => console.error("ERROR " + e));
  console.error(`\nvalidate-data: FAILED with ${errors.length} error(s), ${warnings.length} warning(s).`);
  process.exit(1);
}
console.log(`validate-data: OK — ${JSON.stringify(stats)} (${warnings.length} warning(s))`);
