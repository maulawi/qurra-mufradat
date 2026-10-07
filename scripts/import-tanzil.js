#!/usr/bin/env node
"use strict";
/* ==========================================================================
   Official Tanzil files (data/raw/tanzil/, kept verbatim)  ->  QURRA records

     quran-uthmani.txt  ->  data/qurra/ayahs.json   (6,236 ayahs, canonical text)
     quran-data.js      ->  data/meta/surahs.json   (114 surahs)
                            data/meta/juz.json      (30 juz start positions)

   Deterministic and re-runnable. It NEVER edits ayah text: the only operation
   is to separate the basmala that Tanzil prefixes onto ayah 1 of most surahs
   (every surah except 1 and 9) from the ayah itself; the prefix is recorded as
   `source_prefix: "basmala"` and the validator re-joins it to prove the raw
   line is reproduced exactly. Existing juz Arabic names are preserved.

   Usage: node scripts/import-tanzil.js
   ========================================================================== */
const fs = require("fs");
const path = require("path");
const { parseText, splitBasmala, basmalaForms, parseMetadata, textNotice, metadataNotice } = require("./lib/tanzil");

const ROOT = path.resolve(__dirname, "..");
const read = rel => fs.readFileSync(path.join(ROOT, rel), "utf8");
const write = (rel, obj) => fs.writeFileSync(path.join(ROOT, rel), JSON.stringify(obj, null, 1).replace(/^ +/gm, m => "  ".repeat(m.length)) + "\n", "utf8");

const text = parseText(read("data/raw/tanzil/quran-uthmani.txt"));
const meta = parseMetadata(read("data/raw/tanzil/quran-data.js"));
const variants = basmalaForms(text.lines);
// Tanzil asks that its notice be reproduced in derived files: carried verbatim from the raw files as `_notice`.
const TEXT_NOTICE = textNotice(read("data/raw/tanzil/quran-uthmani.txt"));
const META_NOTICE = metadataNotice(read("data/raw/tanzil/quran-data.js"));

if (text.lines.size !== 6236) throw new Error(`expected 6236 ayah lines, found ${text.lines.size}`);

const ayahs = [];
for (const key of text.order) {
  const [s, a] = key.split(":").map(Number);
  const { prefix, text: body } = splitBasmala(key, text.lines.get(key), variants);
  const rec = { ayah_id: key, surah: s, ayah: a, text: body };
  if (prefix) rec.source_prefix = "basmala";
  ayahs.push(rec);
}
ayahs.sort((x, y) => x.surah - y.surah || x.ayah - y.ayah);

// One ayah per line keeps the 1.3 MB file diffable and reviewable.
const header = {
  _notice: TEXT_NOTICE,
  _comment: "Canonical Qur'anic text, one record per ayah, derived verbatim from data/raw/tanzil/quran-uthmani.txt by scripts/import-tanzil.js. Do not edit by hand. Records inherit `defaults`. source_prefix=basmala marks the 110 ayahs whose official line starts with the basmala header, which is kept in the raw file and is not part of `text`. Tokens are derived from `text` by scripts/lib/tokenize.js (split on single spaces); only analysed tokens are listed in token-forms.json.",
  defaults: { status: "imported", provenance: { text: { source_id: "TANZIL_TEXT" } } }
};
const NL = "\n";
fs.writeFileSync(path.join(ROOT, "data/qurra/ayahs.json"),
  "{" + NL + '  "_notice": ' + JSON.stringify(header._notice) + "," + NL + '  "_comment": ' + JSON.stringify(header._comment) + "," + NL +
  '  "defaults": ' + JSON.stringify(header.defaults) + "," + NL +
  '  "ayahs": [' + NL +
  ayahs.map(a => "    " + JSON.stringify(a)).join("," + NL) + NL +
  "  ]" + NL + "}" + NL, "utf8");

const surahs = meta.surahs.map(m => ({
  surah_id: "s" + String(m.number).padStart(3, "0"), number: m.number, name_ar: m.nameAr, name_en: m.translit, name_ms: null,
  meaning_en: m.meaning, ayah_count: m.ayahs, revelation: m.type, revelation_order: m.order,
  status: "imported", provenance: { source_id: "TANZIL_METADATA" }
}));
write("data/meta/surahs.json", { _notice: META_NOTICE, surahs });

const prevJuz = JSON.parse(read("data/meta/juz.json")).juz;
const juz = meta.juz.map((j, i) => ({
  juz: j.juz, name_ar: prevJuz[i].name_ar, start: { surah: j.surah, ayah: j.ayah }, note: null,
  status: "imported", provenance: { source_id: "TANZIL_METADATA" }
}));
write("data/meta/juz.json", { _notice: META_NOTICE, juz });

console.log(`import-tanzil: ${ayahs.length} ayahs, ${surahs.length} surahs, ${juz.length} juz; ${ayahs.filter(a => a.source_prefix).length} basmala prefixes separated`);
