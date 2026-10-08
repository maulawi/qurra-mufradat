"use strict";
/* Imports the Pickthall (1930) English translation from the staged e-text (staging/gutenberg-16955/pg16955.txt,
   kept outside git) into data/translations/en-pickthall-1930.json, aligned to QURRA's ayahs by (surah, ayah).
   - Only the "P:" (Pickthall) side is read; the two other translations in the file are ignored.
   - Wrapped lines are joined with one space; nothing else is changed.
   - A verse number that carries more than one Pickthall entry is NOT guessed: the ayah is reported and left out.
   Usage: node scripts/import/import-pickthall.js [--check]   (--check: fail if outputs would change) */
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const { alignAyahs, formatAyahReport } = require("../lib/ayah-alignment");

const ROOT = path.join(__dirname, "..", "..");
const RAW = path.join(ROOT, "staging", "gutenberg-16955", "pg16955.txt");
const SHA = "3b96fa3ad318ab9d91db53b25100d5169fafe3a1ecb993e7c36ffff55bf9d8bc";
const OUT = path.join(ROOT, "data", "translations", "en-pickthall-1930.json");
const REPORT = path.join(ROOT, "data", "translations", "en-pickthall-1930.alignment.json");

function parse(text) {
  const lines = text.replace(/\r\n/g, "\n").split("\n");
  const records = [], declared = {};
  let surah = 0, cur = null, side = null;
  const flush = () => { if (cur) { cur.text = cur.parts.map(p => p.join(" ")).filter(Boolean).join(" ");
    records.push({ ref: `pg16955 ${String(cur.surah).padStart(3, "0")}.${String(cur.ayah).padStart(3, "0")}`, surah: cur.surah, ayah: cur.ayah, text: cur.parts.length === 1 ? cur.parts[0].join(" ") : cur.parts.map(p => p.join(" ")).join(" "), entries: cur.parts.length }); } cur = null; side = null; };
  for (const line of lines) {
    let m;
    if ((m = /^ Chapter (\d+):/.exec(line))) { flush(); surah = Number(m[1]); continue; }
    if ((m = /^ Total Verses: (\d+)/.exec(line)) && surah) { declared[surah] = Number(m[1]); continue; }
    if ((m = /^(\d{3})\.(\d{3})\s*$/.exec(line))) { flush(); cur = { surah: Number(m[1]), ayah: Number(m[2]), parts: [] }; continue; }
    if (/^-{20,}/.test(line)) { flush(); continue; }
    if (!cur) continue;
    if ((m = /^([YPS]): ?(.*)$/.exec(line))) { side = m[1]; if (side === "P") cur.parts.push([m[2].trim()]); continue; }
    if (!line.trim()) { side = null; continue; }
    if (side === "P") cur.parts[cur.parts.length - 1].push(line.trim());
  }
  flush();
  return { records, declared };
}

function build() {
  if (!fs.existsSync(RAW)) throw new Error("staged e-text not found: " + RAW + " (it is kept outside git; see data/sources.json PICKTHALL_EN_1930)");
  const buf = fs.readFileSync(RAW);
  const sha = crypto.createHash("sha256").update(buf).digest("hex");
  if (sha !== SHA) throw new Error(`SHA-256 mismatch: expected ${SHA}, got ${sha}`);
  const { records, declared } = parse(buf.toString("utf8"));
  const ayahs = JSON.parse(fs.readFileSync(path.join(ROOT, "data/qurra/ayahs.json"), "utf8")).ayahs;
  const rep = alignAyahs(records, ayahs, { declaredCounts: declared });
  const byId = new Map(records.map(r => [`${r.surah}:${r.ayah}`, r]));
  const out = { translation_id: "en-pickthall-1930", source_id: "PICKTHALL_EN_1930", source_sha256: SHA,
    _comment: "Derived from the staged e-text by scripts/import/import-pickthall.js; wrapped lines joined, text otherwise verbatim. Ayahs not listed here are unresolved (see the alignment report) and carry no text.",
    records: rep.exact.map(id => ({ ayah_id: id, text: byId.get(id).text })) };
  const report = { translation_id: "en-pickthall-1930", source_sha256: SHA, summary: rep.summary,
    unresolved_ayahs: rep.unresolved_ayahs, numbering_mismatch: rep.numbering_mismatch, missing: rep.missing, extra: rep.extra,
    duplicates: rep.duplicates, count_mismatch: rep.count_mismatch, basmala: rep.basmala, normalization: rep.normalization };
  return { out, report, rep };
}

if (require.main === module) {
  const check = process.argv.includes("--check");
  const { out, report, rep } = build();
  const files = [[OUT, JSON.stringify(out, null, 1) + "\n"], [REPORT, JSON.stringify(report, null, 1) + "\n"]];
  console.log(formatAyahReport(rep));
  for (const [p, s] of files) {
    if (check) { if (!fs.existsSync(p) || fs.readFileSync(p, "utf8") !== s) { console.error("STALE: " + path.relative(ROOT, p)); process.exitCode = 1; } }
    else { fs.writeFileSync(p, s); console.log("wrote " + path.relative(ROOT, p)); }
  }
}
module.exports = { parse, build };
