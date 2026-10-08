"use strict";
/* QURRA root model helpers (shared by the validator, the generator and the tests).

   A root is an ordered list of canonical letters. Its length is NOT fixed at three: the allowed lengths come from
   data/taxonomy.json -> root_category (thulathi = 3, rubai = 4). A further category (for example a five-letter one)
   is added by adding one taxonomy entry; no code change is needed.

   Two separate ideas are kept apart everywhere in the project:
     * the QURRA root assignment  = the root QURRA itself assigns to a lemma (root.root_id, or a candidate in root.candidates);
     * source indexing            = the root/family/heading under which a classical source happens to discuss the word
                                    (root.source_indexing[]). Source indexing is evidence only. It never creates, changes or
                                    replaces a QURRA root assignment, and it may have a different number of letters. */

const WEAK = new Set(["و", "ي"]);
const MIN_INDEX_LETTERS = 2; // a classical source may index a word under a two-letter heading (for example يد)

/** [{ id, radicals }] from the taxonomy; unusable entries are ignored. */
function categories(tax) {
  return ((tax && tax.root_category) || []).filter(c => c && typeof c.id === "string" && Number.isInteger(c.radicals) && c.radicals >= 1);
}

/** Map radical count -> category id. */
function categoryByCount(tax) {
  return new Map(categories(tax).map(c => [c.radicals, c.id]));
}

/** "ز ل ز ل" -> ["ز","ل","ز","ل"]. Only splits; it never removes, merges or rewrites letters. */
function splitRoot(display) {
  return String(display).trim().split(/ +/).filter(Boolean);
}

/** Weakness/soundness class (root_type). Defined by the traditional rules for three-letter roots.
    For any other length it returns "sahih_salim" only when the root has no weak letter and no hamza;
    otherwise the class is not defined by this project and an editor must choose it. */
function rootTypeOf(letters) {
  const weak = c => WEAK.has(c);
  if (letters.length === 3) {
    const [a, b, c] = letters;
    if (weak(a) && weak(c) && !weak(b)) return "lafif_mafruq";
    if (weak(b) && weak(c)) return "lafif_maqrun";
    if (weak(b)) return "ajwaf";
    if (weak(c)) return "naqis";
    if (weak(a)) return "mithal";
    if (b === c) return "mudaaf";
    if (letters.includes("ء")) return "mahmuz";
    return "sahih_salim";
  }
  if (letters.some(weak) || letters.includes("ء")) {
    throw new Error(`root "${letters.join(" ")}" has ${letters.length} letters and a weak letter or hamza: its root_type is not defined by the project; an editor must set it`);
  }
  return "sahih_salim";
}

/** Problems with a root written as letters (assignment or candidate). Returns [{ kind, message }] (empty = fine);
    kind is "length", "letters" (a letter that is not canonical) or "format". */
function problemsWithRoot(display, tax) {
  const slug = (tax.root_letters && tax.root_letters.letters) || {};
  const byCount = categoryByCount(tax);
  const letters = splitRoot(display);
  const out = [];
  if (!byCount.has(letters.length)) out.push({ kind: "length", message: `"${display}" has ${letters.length} letters; allowed lengths: ${[...byCount.keys()].sort((a, b) => a - b).join(", ")}` });
  letters.forEach(l => { if (!slug[l]) out.push({ kind: "letters", message: `letter "${l}" in "${display}" is not an allowed canonical root letter` }); });
  if (letters.join(" ") !== String(display)) out.push({ kind: "format", message: `"${display}" is not written as single-space-separated letters` });
  return out;
}

/** Problems with a source-indexing heading (a classical source may use a different number of letters). */
function problemsWithIndexing(display, tax) {
  const slug = (tax.root_letters && tax.root_letters.letters) || {};
  const letters = splitRoot(display);
  const out = [];
  if (letters.length < MIN_INDEX_LETTERS) out.push(`indexed_under "${display}" needs at least ${MIN_INDEX_LETTERS} letters`);
  letters.forEach(l => { if (!slug[l]) out.push(`letter "${l}" in indexed_under "${display}" is not an allowed canonical root letter`); });
  if (letters.join(" ") !== String(display)) out.push(`indexed_under "${display}" is not written as single-space-separated letters`);
  return out;
}

module.exports = { categories, categoryByCount, splitRoot, rootTypeOf, problemsWithRoot, problemsWithIndexing, MIN_INDEX_LETTERS };
