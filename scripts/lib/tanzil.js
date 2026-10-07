"use strict";
/* Parsing of the two official Tanzil files kept verbatim under data/raw/tanzil/:
     quran-uthmani.txt   (pipe format "surah|ayah|text", with the copyright block)
     quran-data.js       (Tanzil Quran Metadata: surahs, juz, ...)
   Used by scripts/import-tanzil.js and by the validator, so import and validation can never disagree. */
const vm = require("vm");

const LINE_RE = /^(\d+)\|(\d+)\|(.*)$/;

/** The two spellings of the opening basmala that Tanzil prefixes onto ayah 1 of most surahs (95:1 and 97:1 carry an extra shadda in the official file). */
function basmalaForms(lines) {
  const first = lines.get("1:1");
  const variants = [first];
  const odd = "بِّسْمِ" + first.slice(first.indexOf(" "));
  if (odd !== first) variants.push(odd);
  return variants;
}

/** @returns {{header: string[], lines: Map<string,string>, order: string[]}} lines keyed "surah:ayah" -> verbatim text */
function parseText(raw) {
  const header = [];
  const lines = new Map();
  const order = [];
  for (const l of raw.split("\n")) {
    if (l.startsWith("#")) { header.push(l); continue; }
    const m = LINE_RE.exec(l.replace(/\r$/, ""));
    if (!m) continue;
    const key = `${Number(m[1])}:${Number(m[2])}`;
    if (lines.has(key)) throw new Error("duplicate line in raw Tanzil text: " + key);
    lines.set(key, m[3]);
    order.push(key);
  }
  return { header, lines, order };
}

/** Split an official line into { prefix, text }. Only ayah 1 of a surah other than 1 and 9 may carry the basmala prefix. */
function splitBasmala(key, line, variants) {
  const [s, a] = key.split(":").map(Number);
  if (a === 1 && s !== 1 && s !== 9) {
    for (const v of variants) if (line.startsWith(v + " ")) return { prefix: v, text: line.slice(v.length + 1) };
  }
  return { prefix: null, text: line };
}

/** Evaluates Tanzil's quran-data.js (a plain `var QuranData = {...}` script) in a sandbox. */
function parseMetadata(js) {
  const ctx = {};
  vm.createContext(ctx);
  vm.runInContext(js + "\nthis.QuranData = QuranData;", ctx);
  const q = ctx.QuranData;
  const surahs = q.Sura.slice(1, 115).map((r, i) => ({ number: i + 1, ayahs: r[1], order: r[2], rukus: r[3], nameAr: r[4], translit: r[5], meaning: r[6], type: r[7] }));
  const juz = q.Juz.slice(1, 31).map((r, i) => ({ juz: i + 1, surah: r[0], ayah: r[1] }));
  return { surahs, juz };
}

/**
 * The copyright and terms block that Tanzil supplies with its text, as its exact lines (including the leading "#"),
 * from "Tanzil Quran Text ..." through "Please check updates at ...". It is read from the raw file, never retyped,
 * so every derived file carries precisely what the source says. (The raw file stays the authoritative copy.)
 */
function textNotice(rawText) {
  const lines = rawText.split("\n").map(l => l.replace(/\r$/, "")).filter(l => l.startsWith("#"));
  const start = lines.findIndex(l => /Tanzil Quran Text \(/.test(l));
  const end = lines.findIndex(l => /Please check updates at/.test(l));
  if (start < 0 || end < start) throw new Error("copyright block not found in the raw Tanzil text");
  return lines.slice(start, end + 1);
}

/** The header comment lines (`// ...`) that Tanzil supplies at the top of its metadata file, verbatim. */
function metadataNotice(rawMeta) {
  const lines = rawMeta.split("\n").map(l => l.replace(/\r$/, "")).slice(0, 8).filter(l => l.startsWith("//") && l.trim() !== "//");
  if (!lines.some(l => /Copyright/.test(l))) throw new Error("copyright header not found in the raw Tanzil metadata");
  return lines;
}

module.exports = { parseText, splitBasmala, basmalaForms, parseMetadata, textNotice, metadataNotice };
