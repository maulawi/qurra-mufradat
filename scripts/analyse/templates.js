"use strict";
/* Verb templates for SOUND roots (three strong radicals; no hamza, no weak letter, no doubled radical).
   A template yields the stem bases used by engine.verbStems(); the engine then adds person endings and keeps only
   the spellings that really occur in the Qur'an. Weak, hamzated and doubled verbs are written out by hand in the lexicon. */
const A = "َ", U = "ُ", I = "ِ", SUK = "ْ", SH = "ّ", DAGGER = "ٰ", WASLA = "ٱ";
const V = { a: A, i: I, u: U };

/** letters: ["ك","ف","ر"], vf: "I".."X", iv: impf vowel of form I ("a"|"i"|"u"), pv: perfect vowel of form I */
function expandVerb(letters, vf, iv, pv) {
  const [c1, c2, c3] = letters;
  const verb = {};
  switch (vf) {
    case "I": {
      const perf = c1 + A + c2 + V[pv || "a"] + c3;
      const impf = "ي" + A + c1 + SUK + c2 + V[iv || "u"] + c3;
      const imv = WASLA + c1 + SUK + c2 + V[iv || "u"] + c3;
      return { perf: { long: perf }, impf: { long: impf, short: impf }, imv: { long: imv, short: imv }, pperf: { long: c1 + U + c2 + I + c3 }, pimpf: { long: "ي" + U + c1 + SUK + c2 + A + c3, short: "ي" + U + c1 + SUK + c2 + A + c3 } };
    }
    case "II": return { perf: { long: c1 + A + c2 + SH + A + c3 }, impf: { long: "ي" + U + c1 + A + c2 + SH + I + c3, short: "ي" + U + c1 + A + c2 + SH + I + c3 }, imv: { long: c1 + A + c2 + SH + I + c3, short: c1 + A + c2 + SH + I + c3 },
      pperf: { long: c1 + U + c2 + SH + I + c3 }, pimpf: { long: "ي" + U + c1 + A + c2 + SH + A + c3, short: "ي" + U + c1 + A + c2 + SH + A + c3 } };
    case "III": return { perf: { long: c1 + A + DAGGER + c2 + A + c3 }, impf: { long: "ي" + U + c1 + A + DAGGER + c2 + I + c3, short: "ي" + U + c1 + A + DAGGER + c2 + I + c3 }, imv: { long: c1 + A + DAGGER + c2 + I + c3, short: c1 + A + DAGGER + c2 + I + c3 },
      pperf: { long: c1 + U + "و" + c2 + I + c3 }, pimpf: { long: "ي" + U + c1 + A + DAGGER + c2 + A + c3, short: "ي" + U + c1 + A + DAGGER + c2 + A + c3 } };
    case "IV": return { perf: { long: "أ" + A + c1 + SUK + c2 + A + c3 }, impf: { long: "ي" + U + c1 + SUK + c2 + I + c3, short: "ي" + U + c1 + SUK + c2 + I + c3 }, imv: { long: "أ" + A + c1 + SUK + c2 + I + c3, short: "أ" + A + c1 + SUK + c2 + I + c3 },
      pperf: { long: "أ" + U + c1 + SUK + c2 + I + c3 }, pimpf: { long: "ي" + U + c1 + SUK + c2 + A + c3, short: "ي" + U + c1 + SUK + c2 + A + c3 } };
    case "V": return { perf: { long: "ت" + A + c1 + A + c2 + SH + A + c3 }, impf: { long: "ي" + A + "ت" + A + c1 + A + c2 + SH + A + c3, short: "ي" + A + "ت" + A + c1 + A + c2 + SH + A + c3 }, imv: { long: "ت" + A + c1 + A + c2 + SH + A + c3, short: "ت" + A + c1 + A + c2 + SH + A + c3 } };
    case "VI": return { perf: { long: "ت" + A + c1 + A + DAGGER + c2 + A + c3 }, impf: { long: "ي" + A + "ت" + A + c1 + A + DAGGER + c2 + A + c3, short: "ي" + A + "ت" + A + c1 + A + DAGGER + c2 + A + c3 }, imv: { long: "ت" + A + c1 + A + DAGGER + c2 + A + c3, short: "ت" + A + c1 + A + DAGGER + c2 + A + c3 } };
    case "VII": return { perf: { long: WASLA + "ن" + SUK + c1 + A + c2 + A + c3 }, impf: { long: "ي" + A + "ن" + SUK + c1 + A + c2 + I + c3, short: "ي" + A + "ن" + SUK + c1 + A + c2 + I + c3 }, imv: { long: WASLA + "ن" + SUK + c1 + I + c2 + SUK + c3, short: WASLA + "ن" + SUK + c1 + I + c2 + SUK + c3 } };
    case "VIII": return { perf: { long: WASLA + c1 + SUK + "ت" + A + c2 + A + c3 }, impf: { long: "ي" + A + c1 + SUK + "ت" + A + c2 + I + c3, short: "ي" + A + c1 + SUK + "ت" + A + c2 + I + c3 }, imv: { long: WASLA + c1 + SUK + "ت" + I + c2 + SUK + c3, short: WASLA + c1 + SUK + "ت" + I + c2 + SUK + c3 },
      pperf: { long: WASLA + c1 + U + "ت" + U + c2 + I + c3 } };
    case "X": return { perf: { long: WASLA + "س" + SUK + "ت" + A + c1 + SUK + c2 + A + c3 }, impf: { long: "ي" + A + "س" + SUK + "ت" + A + c1 + SUK + c2 + I + c3, short: "ي" + A + "س" + SUK + "ت" + A + c1 + SUK + c2 + I + c3 }, imv: { long: WASLA + "س" + SUK + "ت" + A + c1 + SUK + c2 + I + c3, short: WASLA + "س" + SUK + "ت" + A + c1 + SUK + c2 + I + c3 },
      pperf: { long: WASLA + "س" + SUK + "ت" + U + c1 + SUK + c2 + I + c3 } };
    default: throw new Error("no template for form " + vf);
  }
}
module.exports = { expandVerb };

/* ---- hollow verbs (middle radical weak): قَالَ / بَاعَ / خَافَ ---- */
const ALEF = "\u0627", WAW = "\u0648", YA = "\u064A";
function expandHollow(letters, k) {
  const [c1, , c3] = letters;
  const sv = k === "u" ? U : k === "i" ? I : A;                      // short vowel of the middle
  const lv = k === "u" ? U + WAW : k === "i" ? I + YA : A + ALEF;     // long vowel of the middle
  return {
    perf: { long: c1 + A + ALEF + c3, short: c1 + (k === "u" ? U : I) + c3 },
    impf: { long: YA + A + c1 + lv + c3, short: YA + A + c1 + sv + c3 },
    imv: { long: c1 + lv + c3, short: c1 + sv + c3 },
    pperf: { long: c1 + I + YA + c3 }, pimpf: { long: YA + U + c1 + A + ALEF + c3, short: YA + U + c1 + A + ALEF + c3 }
  };
}

/* ---- defective verbs (final radical weak) written as explicit forms ----
   pb: perfect stem up to and including the 2nd radical, no vowel on it yet  (أَت)
   ib: 3ms imperfect stem likewise with its prefix                          (يَأْت)
   k : "y" (ends in ya / alef maqsura) or "w" (ends in waw);  iv: vowel of the imperfect ("i" | "a" | "u") */
const PERS = ["3ms", "3fs", "3md", "3fd", "3mp", "3fp", "2ms", "2fs", "2d", "2mp", "2fp", "1s", "1p"];
function prefixFor(key) { return key.startsWith("3f") ? "\u062A" : key.startsWith("3") ? "\u064A" : key.startsWith("2") ? "\u062A" : key === "1s" ? "\u0623" : "\u0646"; }
function reprefixStem(ib, key) { return prefixFor(key) + ib.slice(1); }
function expandDefective(def) {
  const { pb, ib, k, iv, imvb } = def;
  const weak = k === "w" ? WAW : YA;
  const x = [];
  const add = (s, aspect, key) => x.push(`${s}|${aspect}|${key}`);
  const P = pb + A;
  // perfect
  add(P + (k === "w" ? ALEF : "\u0649\u0670"), "maadi", "3ms"); add(P + (k === "w" ? ALEF : "\u0649"), "maadi", "3ms");
  add(P + "\u062A\u0652", "maadi", "3fs"); add(P + weak + A + ALEF, "maadi", "3md"); add(P + "\u062A" + A + ALEF, "maadi", "3fd");
  add(P + WAW + SUK + ALEF + "\u06DF", "maadi", "3mp"); add(P + WAW + SUK + ALEF, "maadi", "3mp");
  add(P + weak + SUK + "\u0646" + A, "maadi", "3fp");
  [["2ms", "\u062A" + A], ["2fs", "\u062A" + I], ["2d", "\u062A" + U + "\u0645" + A + ALEF], ["2mp", "\u062A" + U + "\u0645" + SUK], ["2fp", "\u062A" + U + "\u0646" + SH + A], ["1s", "\u062A" + U], ["1p", "\u0646" + A + ALEF]]
    .forEach(([key, end]) => add(P + weak + SUK + end, "maadi", key));
  // imperfect
  const ending = {
    sg: k === "w" ? U + WAW : iv === "a" ? A + "\u0649\u0670" : I + "\u0649",
    sgAlt: k === "w" ? "" : iv === "a" ? A + "\u0649" : "",
    sub: k === "w" ? U + WAW + A + ALEF : iv === "a" ? A + "\u0649\u0670" : I + YA + A,
    jus: k === "w" ? U : iv === "a" ? A : I,
    fs: (k === "w" ? U : iv === "a" ? A : I) + YA + "\u0646" + I,
    dual: (k === "w" ? U + WAW : iv === "a" ? A + YA : I + YA) + A + ALEF + "\u0646" + I,
    mp: iv === "a" ? A + WAW + SUK + "\u0646" + A : U + WAW + "\u0646" + A,
    fp: (k === "w" ? U + WAW : iv === "a" ? A + YA : I + YA) + SUK + "\u0646" + A
  };
  for (const key of PERS) {
    const stem = reprefixStem(ib, key);
    if (["3ms", "3fs", "2ms", "1s", "1p"].includes(key)) {
      add(stem + ending.sg, "mudari", key); if (ending.sgAlt) add(stem + ending.sgAlt, "mudari", key);
      add(stem + ending.sub, "mudari", key); add(stem + ending.jus, "mudari", key);
    } else if (key === "2fs") add(stem + ending.fs, "mudari", key);
    else if (["3md", "3fd", "2d"].includes(key)) add(stem + ending.dual, "mudari", key);
    else if (["3mp", "2mp"].includes(key)) { add(stem + ending.mp, "mudari", key); add(stem + (iv === "a" ? A + WAW + SUK + ALEF : U + WAW + ALEF) + "\u06DF", "mudari", key); }
    else add(stem + ending.fp, "mudari", key);
  }
  // imperative
  const ib2 = imvb;
  if (ib2) {
    add(ib2 + ending.jus, "amr", "2ms"); add(ib2 + ending.fs.replace(YA + "\u0646" + I, YA), "amr", "2fs"); add(ib2 + (iv === "a" ? A : U) + WAW + SUK + ALEF, "amr", "2mp"); add(ib2 + (iv === "a" ? A : U) + WAW + SUK + ALEF + "\u06DF", "amr", "2mp");
    add(ib2 + ending.dual.slice(0, -2), "amr", "2d");
  }
  return { x };
}
module.exports.expandHollow = expandHollow;
module.exports.expandDefective = expandDefective;
