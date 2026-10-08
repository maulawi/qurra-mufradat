"use strict";
/* ==========================================================================
   Source-specific tag mapping:  source tag  ->  QURRA coarse POS + features (+ a fine label).

   No external tag set is populated. A future cleared source ships its own
   mapping file, data/mappings/<source_id>.tags.json:

     { "source_id": "...", "tagset": "...", "synthetic": false,
       "tags": { "<raw tag>": { "pos": "noun|verb|particle", "features": { "<taxonomy category>": "<id>" }, "fine": "<label>" } } }

   The mapping is QURRA's own work (it only names the source's tags). The core
   schema never changes when a mapping is added: raw tags are kept on the
   candidate analysis (`raw_tags`), the mapped coarse POS / features go into the
   QURRA Form, and any tag that is not mapped is reported, never guessed.
   ========================================================================== */

/** Taxonomy category names a mapping may set (snake_case, as in data/taxonomy.json). */
const FEATURE_CATEGORIES = [
  "number", "gender", "voice", "plural_type", "definiteness_state", "definiteness_cause", "reference_class",
  "declension", "derivation_type", "verb_aspect", "verb_form", "particle_function", "person", "segment_function"
];

function validateTagMap(file, map, taxonomy, ctx) {
  const errors = [];
  const where = file;
  const pos = new Set((taxonomy.pos || []).map(p => p.id));
  if (!map || typeof map !== "object") return [`${where}: not an object`];
  if (!map.source_id) errors.push(`${where}: missing source_id`);
  if (!map.tagset) errors.push(`${where}: missing tagset`);
  if (ctx && ctx.sources) {
    const src = ctx.sources.get(map.source_id);
    if (ctx.production) {
      if (map.synthetic === true) errors.push(`${where}: a synthetic mapping may not live in production data`);
      if (!src) errors.push(`${where}: unknown source_id "${map.source_id}"`);
      else if (src.in_use === false) errors.push(`${where}: source "${map.source_id}" is registered as in_use=false (not cleared)`);
    }
  }
  if (!map.tags || typeof map.tags !== "object" || !Object.keys(map.tags).length) { errors.push(`${where}: tags must be a non-empty object`); return errors; }
  for (const [raw, m] of Object.entries(map.tags)) {
    const w = `${where} tag "${raw}"`;
    if (!pos.has(m.pos)) errors.push(`${w}: pos "${m.pos}" is not a QURRA POS (${[...pos].join("|")})`);
    for (const [cat, val] of Object.entries(m.features || {})) {
      if (!FEATURE_CATEGORIES.includes(cat)) { errors.push(`${w}: unknown feature category "${cat}"`); continue; }
      const allowed = new Set((taxonomy[cat] || []).map(v => String(v.id)));
      if (!allowed.has(String(val))) errors.push(`${w}: feature ${cat}="${val}" is not in the taxonomy`);
    }
  }
  return errors;
}

/** Maps one raw tag. Never guesses: an unmapped tag is an explicit failure. */
function mapTag(map, rawTag) {
  const m = map.tags && Object.prototype.hasOwnProperty.call(map.tags, rawTag) ? map.tags[rawTag] : null;
  if (!m) return { ok: false, error: `unmapped tag "${rawTag}" (source ${map.source_id}, tagset ${map.tagset})` };
  return { ok: true, pos: m.pos, features: { ...(m.features || {}) }, fine: m.fine || null, raw: rawTag };
}

/** Which of the tags a source actually uses are not covered by the mapping. */
function coverage(map, tagsUsed) {
  const unmapped = [...new Set(tagsUsed)].filter(t => !mapTag(map, t).ok).sort();
  return { used: new Set(tagsUsed).size, unmapped };
}

module.exports = { validateTagMap, mapTag, coverage, FEATURE_CATEGORIES };
