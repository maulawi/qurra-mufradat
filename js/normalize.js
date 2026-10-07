/* ==========================================================================
   QURRA Mufradat al-Qur'an — Arabic search normalisation

   ONE implementation shared by the build (scripts/build-dataset.js, which
   writes normalised keys into the search index) and the browser (which
   normalises the user's query), so both sides always agree.

   This is for MATCHING ONLY. The canonical Qur'anic text is never replaced
   by, or derived from, these functions: displayed text always comes from the
   stored `text` fields verbatim.
   ========================================================================== */

(function (root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  else root.QMNormalize = api;
})(typeof self !== "undefined" ? self : this, function () {

  // Arabic marks (harakat, shadda, dagger alef, Qur'anic annotation signs) and tatweel.
  const ARABIC_MARKS = /[ؐ-ًؚ-ٰٟۖ-ۜ۟-۪ۨ-ۭـ]/g;
  const ARABIC_CHAR = /[؀-ۿ]/;

  /**
   * Loose normalisation: drops marks; unifies alef forms (incl. alef wasla), ya/alef-maqsura, ta marbuta.
   * The Uthmani text writes some long a vowels as a dagger alef (U+0670: كِتَٰب) where ordinary spelling has a
   * full alef (كتاب), and the reverse for others (الرحمن). Matching therefore uses TWO variants: the default drops
   * the dagger alef; { daggerAsAlef: true } turns it into a full alef. A query matches if either variant does.
   */
  function normalizeArabic(s, opts) {
    return String(s || "")
      .replace(/ٰ/g, opts && opts.daggerAsAlef ? "ا" : "")
      .replace(ARABIC_MARKS, "")
      .replace(/[آأإٱ]/g, "ا")
      .replace(/ى/g, "ي")
      .replace(/ة/g, "ه");
  }

  /** Letters typed with spaces ("ر ح م"), as roots are displayed, become one string. Ordinary multi-word input is untouched. */
  function collapseSpacedLetters(q) {
    return /^[؀-ۿ](?:\s+[؀-ۿ])+$/.test(q) ? q.replace(/\s+/g, "") : q;
  }

  /**
   * Latin-script matching key for transliterated names: lower-case, accents folded, hyphens/apostrophes/spaces
   * removed, doubled letters collapsed and the letter h dropped, so "Al-Faatiha", "al fatihah" and "Fatiha" all
   * agree. Deliberately lossy; used only to find surahs by name.
   */
  function normalizeLatin(s) {
    return String(s || "").normalize("NFD").replace(/[̀-ͯ]/g, "")
      .toLowerCase().replace(/[\s\-'’‘`ʿʾ]/g, "")
      .replace(/(.)\1+/g, "$1").replace(/h/g, "");
  }

  return { normalizeArabic, collapseSpacedLetters, normalizeLatin, ARABIC_CHAR };
});
