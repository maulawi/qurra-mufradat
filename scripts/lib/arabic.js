"use strict";
/* Arabic consonant skeleton, used ONLY to check that two spellings are the same word
   (segment surfaces vs token text, source token vs QURRA token). Never displayed. */
function skeleton(s) {
  return String(s).replace(/[ؐ-ًؚ-ٰٟۖ-ۭـ]/g, "")
    .replace(/[آأإٱاء]/g, "").replace(/ى/g, "ي").replace(/ة/g, "ه");
}
module.exports = { skeleton };
