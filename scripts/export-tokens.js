#!/usr/bin/env node
"use strict";
/* Writes the complete, deterministic token layer to a file (it is derived, not stored in the repo):
     node scripts/export-tokens.js out.json     -> [{token_id, ayah_id, position, text, form_id}]
     node scripts/export-tokens.js out.csv      -> token_id,ayah_id,position,text,form_id
   Useful for inspection and for diffing between builds: the output for an unchanged text is byte-identical. */
const fs = require("fs");
const path = require("path");
const { loadDataset } = require("./lib/load-data");

const out = process.argv[2];
if (!out) { console.error("usage: node scripts/export-tokens.js <out.json|out.csv>"); process.exit(2); }
const ds = loadDataset(path.resolve(__dirname, ".."));
const rows = ds.tokens.map(t => ({ token_id: t.token_id, ayah_id: t.ayah_id, position: t.position, text: t.text, form_id: t.form_id }));
if (out.endsWith(".csv")) {
  fs.writeFileSync(out, "token_id,ayah_id,position,text,form_id\n" + rows.map(r => [r.token_id, r.ayah_id, r.position, r.text, r.form_id || ""].join(",")).join("\n") + "\n", "utf8");
} else {
  fs.writeFileSync(out, JSON.stringify(rows) + "\n", "utf8");
}
console.log(`export-tokens: ${rows.length} tokens -> ${out}`);
