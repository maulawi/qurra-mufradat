"use strict";
/* How firmly a word-analysis record is established. This is a property of the ANALYSIS, separate from the review status
   (provisional / reviewed / verified): QURRA analyses are all unreviewed, and a record can still be well founded or open.

   Every Qur'anic token has a record. The record says one of four things:
     confident          one reading in the QURRA lexicon; segmentation, lemma and (where a root applies) root are established
     provisional        the lemma and segmentation are given, but the root is unresolved or disputed, so part of the record is open
     context_dependent  the spelling has more than one possible reading (homograph); the reading shown is a default and the
                        alternatives are listed, or no default is shown at all
     unresolved         the word could not be analysed safely: no lemma is asserted; candidates are hints only
   source_review_required is a separate flag: a classical source or a person has to look at the record (open root, or unresolved word).
   Nothing here is review. A record is never reviewed or verified because of its resolution. */

const RESOLUTIONS = ["confident", "provisional", "context_dependent", "unresolved"];
const CODE = { confident: "k", provisional: "p", context_dependent: "x", unresolved: "u" };
const FROM_CODE = Object.fromEntries(Object.entries(CODE).map(([k, v]) => [v, k]));

/** true when a lemma's root is not established, so a record built on it is open at the root level (particles have no root by policy) */
function rootIsOpen(lemma) {
  if (!lemma || lemma.pos === "particle") return false;
  const st = lemma.root && lemma.root.status;
  return st === "unresolved" || st === "disputed";
}

/** lemmaById: Map lemma_id -> lemma; segments: the form's segments; alternatives: other possible lemma ids (may be empty) */
function resolutionOfForm(form, lemmaById, alternatives) {
  if (form.status === "unresolved" || form.resolution === "unresolved") return { resolution: "unresolved", source_review_required: true };
  const stems = (form.segments || []).filter(s => s.type === "stem");
  const open = stems.some(s => s.lemma_id && rootIsOpen(lemmaById.get(s.lemma_id)));
  const noLemma = stems.length === 0 || stems.every(s => !s.lemma_id);
  if (noLemma) return { resolution: "unresolved", source_review_required: true };
  const alts = alternatives || form.alternatives || [];
  const resolution = alts.length ? "context_dependent" : open ? "provisional" : "confident";
  return { resolution, source_review_required: open };
}

module.exports = { RESOLUTIONS, CODE, FROM_CODE, rootIsOpen, resolutionOfForm };
