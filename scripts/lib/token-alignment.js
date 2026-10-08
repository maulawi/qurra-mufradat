"use strict";
/* ==========================================================================
   Token alignment: an EXTERNAL source's word records  <->  QURRA tokens.

   A source record:  { ref, surah, ayah, position, text }
     position  1-based word position in the SOURCE's own tokenisation of that ayah.

   Each record is classified, never forced:
     exact          the text equals the QURRA token's text, byte for byte
     normalized     equal after Unicode normalisation / mark and alef-variant normalisation
     orthographic   the consonant skeletons agree but the spelling differs (e.g. an elided alef)
     one_to_many    one source record spells several QURRA tokens (a deterministic span)
     many_to_one    several source records are consecutive parts of one QURRA token
     unresolved     anything else: no such ayah / position out of range / text disagrees /
                    several records claim one token without forming it

   alignment_status is "aligned" for the first five kinds and "unresolved" otherwise.
   An unresolved record never becomes a match. Unmatched source records and unmatched QURRA
   tokens (in the ayahs the source covers) are both listed.
   ========================================================================== */
const { skeleton } = require("./arabic");
const { normalizeArabic } = require("../../js/normalize");

const nfc = s => String(s).normalize("NFC");
const MARKS = /[ؐ-ًؚ-ٰٟۖ-ۭـ]/g;

function classify(srcText, tokText) {
  if (srcText === tokText) return "exact";
  if (nfc(srcText) === nfc(tokText) || normalizeArabic(srcText) === normalizeArabic(tokText)) return "normalized";
  if (skeleton(srcText) === skeleton(tokText)) return "orthographic";
  return null;
}

function alignTokens(records, tokens) {
  const byAyah = new Map();
  tokens.forEach(t => { if (!byAyah.has(t.ayah_id)) byAyah.set(t.ayah_id, []); byAyah.get(t.ayah_id).push(t); });
  byAyah.forEach(list => list.sort((a, b) => a.position - b.position));

  const out = [];
  const claimed = new Map();      // token_id -> [record refs that claim it]
  const touched = new Set();
  const groups = new Map();       // "ayah:pos" -> records (to detect many_to_one)
  records.forEach(r => { const k = `${r.surah}:${r.ayah}:${r.position}`; if (!groups.has(k)) groups.set(k, []); groups.get(k).push(r); });

  const res = (r, kind, status, ids, detail) => out.push({ ref: r.ref, kind, alignment_status: status, token_ids: ids || [], detail: detail || null });
  const claim = (ids, ref) => ids.forEach(id => { if (!claimed.has(id)) claimed.set(id, []); claimed.get(id).push(ref); });

  for (const [key, recs] of groups) {
    const [s, a, p] = key.split(":").map(Number);
    const ayahId = `${s}:${a}`;
    const list = byAyah.get(ayahId);
    if (!list) { recs.forEach(r => res(r, "unresolved", "unresolved", [], "no_such_ayah " + ayahId)); continue; }
    touched.add(ayahId);
    const tok = list[p - 1];
    if (!tok) { recs.forEach(r => res(r, "unresolved", "unresolved", [], `position_out_of_range ${key}`)); continue; }

    if (recs.length === 1) {
      const r = recs[0];
      const kind = classify(r.text, tok.text);
      if (kind) { res(r, kind, "aligned", [tok.token_id]); claim([tok.token_id], r.ref); continue; }
      // one source record spelling several consecutive QURRA tokens?
      const words = String(r.text).split(/\s+/).filter(Boolean);
      if (words.length > 1 && list.length >= p - 1 + words.length) {
        const span = list.slice(p - 1, p - 1 + words.length);
        if (span.every((t, i) => classify(words[i], t.text))) { const ids = span.map(t => t.token_id); res(r, "one_to_many", "aligned", ids, `spans ${ids.length} tokens`); claim(ids, r.ref); continue; }
      }
      res(r, "unresolved", "unresolved", [], `text_mismatch ${tok.token_id}: source "${r.text}" vs QURRA "${tok.text}"`);
      continue;
    }
    // several source records at one position: parts of this token, or an unresolved clash
    const joined = recs.map(r => r.text).join("");
    if (classify(joined, tok.text)) { recs.forEach(r => { res(r, "many_to_one", "aligned", [tok.token_id], `part of ${tok.token_id}`); claim([tok.token_id], r.ref); }); }
    else recs.forEach(r => res(r, "unresolved", "unresolved", [], `ambiguous: ${recs.length} records claim ${tok.token_id} but do not form it`));
  }

  const unmatchedSource = out.filter(x => x.alignment_status === "unresolved");
  const unmatchedQurra = [];
  touched.forEach(ayahId => byAyah.get(ayahId).forEach(t => { if (!claimed.has(t.token_id)) unmatchedQurra.push(t.token_id); }));
  const kinds = {};
  out.forEach(x => { kinds[x.kind] = (kinds[x.kind] || 0) + 1; });
  return {
    records: out, unmatched_source: unmatchedSource, unmatched_qurra: unmatchedQurra,
    summary: { records: records.length, aligned: out.length - unmatchedSource.length, unresolved: unmatchedSource.length, unmatched_qurra_tokens: unmatchedQurra.length, by_kind: kinds }
  };
}

function formatTokenReport(r) {
  const s = r.summary;
  const lines = [`token alignment: ${s.records} source records -> ${s.aligned} aligned, ${s.unresolved} unresolved; ${s.unmatched_qurra_tokens} QURRA tokens unmatched; by kind ${JSON.stringify(s.by_kind)}`];
  r.unmatched_source.forEach(u => lines.push(`  UNRESOLVED  ${u.ref}: ${u.detail}`));
  r.unmatched_qurra.forEach(t => lines.push(`  UNMATCHED   ${t}`));
  return lines.join("\n");
}

module.exports = { alignTokens, formatTokenReport, classify };
