"use strict";
/* ==========================================================================
   Ayah alignment: an EXTERNAL source's ayah records  <->  QURRA ayahs.

   Identity is the pair (surah number, ayah number). Never array position, never the
   translated text, never punctuation, never string similarity.

   A source record:
     { ref, surah, ayah, text?, entries?, arabic? }
       ref      the source's own locator (kept in the report)
       text     the source text for this ayah (translations)
       entries  how many separate text entries the source holds under this one number
                (default 1; more than 1 means several verses are folded under one number)
       arabic   optional Arabic text of the source, compared with QURRA's

   Optional source-level facts:
     declaredCounts   { surah: ayahsTheSourceSaysTheSurahHas }
     basmalaHeaders   [surah, ...] surahs where the source prints a basmala line before ayah 1

   Nothing is "fixed": every discrepancy is listed, and every ayah that is not an exact
   match is `unresolved` and must be left out of any import.
   ========================================================================== */
const { skeleton } = require("./arabic");
const { normalizeArabic } = require("../../js/normalize");

function alignAyahs(records, qurraAyahs, opts) {
  opts = opts || {};
  const qurra = new Map(qurraAyahs.map(a => [a.ayah_id, a]));
  const bySurah = new Map();
  qurraAyahs.forEach(a => bySurah.set(a.surah, (bySurah.get(a.surah) || 0) + 1));

  const seen = new Map();                 // ayah_id -> [records]
  const extra = [];
  for (const r of records) {
    const id = `${r.surah}:${r.ayah}`;
    if (!qurra.has(id)) { extra.push({ ref: r.ref, ayah_id: id }); continue; }
    if (!seen.has(id)) seen.set(id, []);
    seen.get(id).push(r);
  }

  const exact = [], duplicates = [], numbering = [], normalization = [];
  for (const [id, recs] of seen) {
    if (recs.length > 1) { duplicates.push({ ayah_id: id, refs: recs.map(r => r.ref) }); continue; }
    const r = recs[0];
    if ((r.entries === undefined ? 1 : r.entries) !== 1) {
      numbering.push({ ayah_id: id, ref: r.ref, reason: (r.entries || 0) > 1 ? `${r.entries} text entries are folded under this one verse number (the following verse number(s) are absent)` : "no text entry under this verse number" });
      continue;
    }
    if (typeof r.arabic === "string") {
      const q = qurra.get(id).text;
      if (r.arabic === q) { /* byte-identical */ }
      else if (normalizeArabic(r.arabic) === normalizeArabic(q)) { normalization.push({ ayah_id: id, kind: "normalized_equal" }); }
      else if (skeleton(r.arabic) === skeleton(q)) { normalization.push({ ayah_id: id, kind: "orthographic_difference" }); continue; }
      else { normalization.push({ ayah_id: id, kind: "different_text" }); continue; }
    }
    exact.push(id);
  }
  const missing = qurraAyahs.filter(a => !seen.has(a.ayah_id)).map(a => a.ayah_id);

  // the source's own per-surah totals against QURRA's
  const countMismatch = [];
  for (const [s, n] of Object.entries(opts.declaredCounts || {})) {
    if (bySurah.get(Number(s)) !== n) countMismatch.push({ surah: Number(s), source_declares: n, qurra_has: bySurah.get(Number(s)) });
  }
  // basmala headers: QURRA keeps the basmala out of ayah 1 (source_prefix), so a header line is never attached to an ayah
  const basmala = { source_header_surahs: (opts.basmalaHeaders || []).slice().sort((a, b) => a - b), attached_to_ayahs: 0,
    note: "A basmala header line printed by the source before ayah 1 is not an ayah and is never added to an ayah's text." };

  const exactSet = new Set(exact);
  const unresolved = qurraAyahs.map(a => a.ayah_id).filter(id => !exactSet.has(id));
  const dupIds = duplicates.map(d => d.ayah_id);
  return {
    exact, missing, extra, duplicates, numbering_mismatch: numbering, count_mismatch: countMismatch, basmala, normalization,
    unresolved_ayahs: unresolved,
    summary: { source_records: records.length, qurra_ayahs: qurraAyahs.length, exact: exact.length, missing: missing.length, extra: extra.length, duplicate_ids: dupIds.length, numbering_mismatch: numbering.length, normalization_differences: normalization.length, unresolved: unresolved.length }
  };
}

function formatAyahReport(r) {
  const s = r.summary;
  const out = [`ayah alignment: ${s.source_records} source records vs ${s.qurra_ayahs} QURRA ayahs -> ${s.exact} exact, ${s.unresolved} unresolved (${s.missing} missing, ${s.numbering_mismatch} numbering, ${s.duplicate_ids} duplicate, ${s.extra} extra, ${s.normalization_differences} normalisation differences)`];
  r.numbering_mismatch.forEach(x => out.push(`  NUMBERING  ${x.ayah_id}: ${x.reason}`));
  r.missing.forEach(x => out.push(`  MISSING    ${x}`));
  r.duplicates.forEach(x => out.push(`  DUPLICATE  ${x.ayah_id}: ${x.refs.join(", ")}`));
  r.extra.forEach(x => out.push(`  EXTRA      ${x.ayah_id} (${x.ref})`));
  r.count_mismatch.forEach(x => out.push(`  COUNT      surah ${x.surah}: source declares ${x.source_declares}, QURRA has ${x.qurra_has}`));
  r.normalization.forEach(x => out.push(`  NORMALISATION ${x.ayah_id}: ${x.kind}`));
  return out.join("\n");
}

module.exports = { alignAyahs, formatAyahReport };
