"use strict";
/* ==========================================================================
   Alignment of an EXTERNAL source's token records to QURRA token ids.

   No external source is imported. This module only defines how a future,
   cleared source would be aligned, and what a failed alignment looks like.

   A source record:  { ref, surah, ayah, position, text }
     ref       the source's own identifier for the record (kept, never discarded)
     position  1-based word position within the ayah, in the SOURCE's tokenisation

   Outcomes (nothing is ever silently dropped or forced):
     matched    exactly one source record for the QURRA token and the consonant skeletons agree
     unmatched  the record cannot be placed: no such ayah / position out of range / text disagrees
     ambiguous  more than one source record claims the same QURRA token (e.g. the source splits
                a written word into several records); none of them is matched automatically
     uncovered  QURRA tokens of the ayahs the source touches that no source record reached
   ========================================================================== */

const { skeleton } = require("./arabic");

/**
 * @param {Array} sourceRecords
 * @param {Array} tokens  QURRA token layer (token_id, ayah_id, position, text)
 */
function alignRecords(sourceRecords, tokens) {
  const byId = new Map(tokens.map(t => [t.token_id, t]));
  const ayahsPresent = new Set(tokens.map(t => t.ayah_id));
  const claims = new Map();            // token_id -> [records that point at it with agreeing text]
  const matched = [], unmatched = [], ambiguous = [];
  const touchedAyahs = new Set();

  for (const r of sourceRecords) {
    const ayahId = `${r.surah}:${r.ayah}`;
    if (!ayahsPresent.has(ayahId)) { unmatched.push({ ref: r.ref, reason: "no_such_ayah", detail: ayahId }); continue; }
    touchedAyahs.add(ayahId);
    const tokenId = `${ayahId}:${r.position}`;
    const tok = byId.get(tokenId);
    if (!tok) { unmatched.push({ ref: r.ref, reason: "position_out_of_range", detail: tokenId }); continue; }
    if (skeleton(r.text) !== skeleton(tok.text)) {
      unmatched.push({ ref: r.ref, reason: "text_mismatch", detail: `${tokenId}: source "${r.text}" vs QURRA "${tok.text}"` });
      continue;
    }
    if (!claims.has(tokenId)) claims.set(tokenId, []);
    claims.get(tokenId).push(r);
  }

  for (const [tokenId, recs] of claims) {
    if (recs.length === 1) matched.push({ ref: recs[0].ref, token_id: tokenId });
    else ambiguous.push({ token_id: tokenId, refs: recs.map(r => r.ref) });
  }
  const reached = new Set([...claims.keys()]);
  const uncovered = tokens.filter(t => touchedAyahs.has(t.ayah_id) && !reached.has(t.token_id)).map(t => t.token_id);

  return {
    matched, unmatched, ambiguous, uncovered,
    summary: { records: sourceRecords.length, matched: matched.length, unmatched: unmatched.length, ambiguous: ambiguous.length, uncovered_tokens: uncovered.length }
  };
}

/** Plain-text report listing EVERY record that did not align. */
function formatReport(result) {
  const s = result.summary;
  const lines = [`alignment: ${s.records} source records -> ${s.matched} matched, ${s.unmatched} unmatched, ${s.ambiguous} ambiguous; ${s.uncovered_tokens} QURRA tokens uncovered`];
  result.unmatched.forEach(u => lines.push(`  UNMATCHED  ${u.ref}: ${u.reason} (${u.detail})`));
  result.ambiguous.forEach(a => lines.push(`  AMBIGUOUS  ${a.token_id}: claimed by ${a.refs.join(", ")}`));
  result.uncovered.forEach(t => lines.push(`  UNCOVERED  ${t}`));
  return lines.join("\n");
}

/**
 * Validates a committed alignment file (data/alignments/<source_id>.json):
 *   { source_id, source_version, entries: [{ ref, token_id|null, status: matched|unmatched|ambiguous, note? }] }
 * A source that is not registered and in use may not have an alignment in production.
 */
function validateAlignmentFile(file, data, ctx) {
  const errors = [];
  const where = file;
  const src = ctx.sources.get(data.source_id);
  if (!src) errors.push(`${where}: unknown source_id "${data.source_id}"`);
  else if (src.in_use === false) errors.push(`${where}: source "${data.source_id}" is registered as in_use=false (not cleared)`);
  if (!data.source_version) errors.push(`${where}: source_version is required`);
  if (!Array.isArray(data.entries)) { errors.push(`${where}: entries must be an array`); return errors; }
  const refs = new Set();
  data.entries.forEach((e, i) => {
    const w = `${where} entries[${i}]`;
    if (!e.ref) errors.push(`${w}: missing ref`);
    if (refs.has(e.ref)) errors.push(`${w}: duplicate ref "${e.ref}"`);
    refs.add(e.ref);
    if (!["matched", "unmatched", "ambiguous"].includes(e.status)) errors.push(`${w}: status must be matched|unmatched|ambiguous`);
    if (e.status === "matched" && !ctx.tokenIds.has(e.token_id)) errors.push(`${w}: matched entry points at nonexistent token "${e.token_id}"`);
    if (e.status !== "matched" && e.token_id) errors.push(`${w}: only matched entries may carry a token_id`);
  });
  return errors;
}

module.exports = { alignRecords, formatReport, validateAlignmentFile };
