"use strict";
/* ==========================================================================
   QURRA rule-based word analysis (provisional, QURRA-authored).

   Input : the QURRA lexicon (data/lexicon/*.json, written by hand) and the Qur'anic token spellings.
   Output: for every distinct token spelling that has EXACTLY ONE parse, a Form
           (proclitics + stem + enclitic pronoun, with the stem tied to a lexicon lemma).

   Nothing here is copied from QAC, QuranMorph, MASAQ, QAMAR, QUL, Wikidata or any other corpus.
   A spelling is analysed only if a lexicon stem matches it exactly (after mark-order canonicalisation);
   a spelling with several parses is reported as ambiguous and left unanalysed unless the lexicon says
   which parse to prefer. Context is never consulted: an analysis is the DEFAULT reading of the spelling.
   ========================================================================== */

/* ---------------- canonical comparison of Uthmani strings ---------------- */
const MARK_RANK = { "ّ": 1, "َ": 2, "ُ": 2, "ِ": 2, "ً": 2, "ٌ": 2, "ٍ": 2, "ْ": 3, "ٰ": 4, "ٓ": 5, "ٔ": 6, "ٕ": 6 };
const isMark = ch => /[\u0610-\u061A\u064B-\u065F\u0670\u06D6-\u06ED]/.test(ch);
// recitation marks that never distinguish words: small high marks, the "zero" after silent alef, and the small waw/ya on pronouns
const IGNORED = /[\u06D6-\u06ED]/;

function canon(s) {
  const out = [];
  // a hamza written on a tatweel ("\u0640\u064e\u0654") is the letter hamza; any other tatweel is dropped
  const chars = [...String(s).replace(/\u0622/g, "\u0627\u0653").replace(/\u0640([\u064b-\u0653]*)\u0654/g, "\u0621$1").replace(/\u0640/g, "")];
  for (let i = 0; i < chars.length; i++) {
    const ch = chars[i];
    if (!isMark(ch)) {
      const marks = [];
      // sukun is never part of the comparison: the text drops or keeps it for recitation reasons (kuntum / kun-tum, min / min-hum)
      while (i + 1 < chars.length && isMark(chars[i + 1])) { i++; if (!IGNORED.test(chars[i]) && chars[i] !== "\u0652" && !(chars[i] === "\u0653" && /[\u0648\u0649\u064A]/.test(ch))) marks.push(chars[i]); }
      if (marks.includes("\u0670")) { const k = marks.indexOf("\u064E"); if (k >= 0) marks.splice(k, 1); }   // the dagger alef already implies the fatha
      const uniq = [...new Set(marks)];                                   // a repeated mark (typed twice) is one mark
      marks.length = 0; marks.push(...uniq);
      marks.sort((a, b) => (MARK_RANK[a] || 9) - (MARK_RANK[b] || 9));
      out.push(ch, ...marks);
    } else if (!IGNORED.test(ch)) out.push(ch);
  }
  return out.join("");
}
/** indexes at which a new base letter starts (plus the end): the only places a clitic boundary may fall */
function boundaries(s) {
  const b = [];
  const chars = [...s];
  let pos = 0;
  chars.forEach(ch => { if (!isMark(ch)) b.push(pos); pos += ch.length; });
  b.push(s.length);
  return b;
}
const stripShaddaFirst = c => { const m = /^(.)\u0651/.exec(c); return m ? c[0] + c.slice(2) : c; };
/** matching key: canonical, without the doubling a previous word's final nun can put on the first letter, and without a final sukun / madda mark (idgham, ikhfa, pause) */
const loose = c => stripShaddaFirst(c).replace(/[\u0652\u0653]$/, "");
const lkey = s => loose(canon(s));

/* ---------------- clitics ---------------- */
const FATHA = "َ", DAMMA = "ُ", KASRA = "ِ", SUKUN = "ْ", SHADDA = "ّ";
const PRO = (k, o) => ({ canon: canon(k), ...o });
// proclitics, in the only order they can stack: interrogative, conjunction, preposition/particle, article (handled apart)
const PROCLITICS = [
  { canon: canon("أَ"), stage: 0, fn: "istifham", on: ["noun", "verb", "particle"] },
  { canon: canon("وَ"), stage: 1, fn: "atf", on: ["noun", "verb", "particle"] },
  { canon: canon("فَ"), stage: 1, fn: "atf", on: ["noun", "verb", "particle"] },
  { canon: canon("بِ"), stage: 2, fn: "jarr", on: ["noun"] },
  { canon: canon("لِ"), stage: 2, fn: "jarr", on: ["noun"] },
  { canon: canon("لِ"), stage: 2, fn: null, on: ["verb"], aspect: "mudari" },          // lam of purpose / command before an imperfect verb
  { canon: canon("كَ"), stage: 2, fn: "jarr", on: ["noun"] },
  { canon: canon("سَ"), stage: 2, fn: null, on: ["verb"], aspect: "mudari" },
  { canon: canon("يَٰ"), stage: 2, fn: "nida", on: ["noun", "particle"] },                 // vocative: ya qawmi, ya musa, ya layta
  { canon: canon("لَ"), stage: 2, fn: null, on: ["noun", "verb", "particle"] }           // emphatic lam
];
const ENCLITICS = [
  ["هُ", 3, "mufrad", "mudhakkar"], ["هِ", 3, "mufrad", "mudhakkar"], ["هَا", 3, "mufrad", "muannath"],
  ["هُمَا", 3, "muthanna", null], ["هِمَا", 3, "muthanna", null], ["هُمُ", 3, "jama", "mudhakkar"], ["هِمُ", 3, "jama", "mudhakkar"], ["كُمُ", 2, "jama", "mudhakkar"],
  ["هُمْ", 3, "jama", "mudhakkar"], ["هِمْ", 3, "jama", "mudhakkar"], ["هُنَّ", 3, "jama", "muannath"], ["هِنَّ", 3, "jama", "muannath"],
  ["كَ", 2, "mufrad", "mudhakkar"], ["كِ", 2, "mufrad", "muannath"], ["كُمَا", 2, "muthanna", null], ["كُمْ", 2, "jama", "mudhakkar"], ["كُنَّ", 2, "jama", "muannath"],
  ["نَا", 1, "jama", null], ["نِى", 1, "mufrad", null], ["ىَ", 1, "mufrad", null], ["ىٓ", 1, "mufrad", null], ["ى", 1, "mufrad", null], ["ِى", 1, "mufrad", null], ["يَ", 1, "mufrad", null]
].map(([k, person, number, gender]) => ({ canon: canon(k), person, number, gender, noverb: person === 1 && number === "mufrad" && !/\u0646/.test(k) }));

/* ---------------- lexicon -> stem index ---------------- */
function addStem(index, key, rec) {
  const k = lkey(key);
  if (!index.has(k)) index.set(k, []);
  const list = index.get(k);
  const dup = list.find(x => x.lemma_id === rec.lemma_id && JSON.stringify(x.morph) === JSON.stringify(rec.morph) && x.ending === rec.ending && x.bound === rec.bound);
  if (!dup) list.push({ ...rec, key: k });
}

const CASE_DEF = [DAMMA, FATHA, KASRA];            // endings that may carry an article, a pronoun suffix, or stand annexed
const CASE_INDEF = ["ٌ", "ٍ"];

/** Nouns: generate the case-ending variants of each base. `b` is written without any final vowel. */
function nounStems(index, e) {
  for (const f of e.noun || []) {
    const t = f.t || "tri";
    const morph = { number: f.n || "mufrad", gender: f.g === undefined ? "mudhakkar" : f.g };
    if (f.pl) morph.plural_type = f.pl;
    if (f.ref) morph.reference_class = f.ref;
    const base = f.b;
    const R = (key, ending, extra) => addStem(index, key, { lemma_id: e.lemma_id, pos: "noun", morph, ending, bound: !!(extra && extra.bound), noart: !!e.noart });
    if (t === "tri") {                                   // triptote: كِتَٰب
      CASE_DEF.forEach(v => R(base + v, "def", { bound: true }));
      CASE_INDEF.forEach(v => R(base + v, "indef"));
      R(base + "ًا", "indef"); R(base + "ً", "indef"); R(base, "bare");
    } else if (t === "fem") {                            // feminine in -ة: رَحْمَة (bound forms take ت)
      const stemT = base.slice(0, -1) + "ت";
      CASE_DEF.forEach(v => { R(base.slice(0, -1) + "ة" + v, "def"); R(stemT + v, "def", { bound: true }); });
      CASE_INDEF.forEach(v => R(base + v, "indef"));
      R(base + "ً", "indef"); R(base, "bare");
      CASE_DEF.forEach(v => R(base.slice(0, -1) + "ت" + v, "def", { bound: true }));
    } else if (t === "dip") {                            // diptote: no tanween, genitive = accusative unless article/annexed
      R(base + DAMMA, "def", { bound: true }); R(base + FATHA, "def", { bound: true }); R(base + KASRA, "def", { bound: true }); R(base, "bare");
    } else if (t === "sm") {                             // sound masculine plural
      R(base + "ُونَ", "def"); R(base + "ِينَ", "def"); R(base + "ُو", "def", { bound: true }); R(base + "ِى", "def", { bound: true }); R(base + "ِيَ", "def", { bound: true });
    } else if (t === "sf") {                             // sound feminine plural: base + َٰت
      const b2 = base + "َٰت";
      CASE_DEF.forEach(v => R(b2 + v, "def", { bound: true })); CASE_INDEF.forEach(v => R(b2 + v, "indef")); R(b2 + "ٍ", "indef");
      R(b2 + KASRA, "def", { bound: true });
    } else if (t === "dual") {
      R(base + "َانِ", "def"); R(base + "َيْنِ", "def"); R(base + "َا", "def", { bound: true }); R(base + "َىْ", "def", { bound: true });
    } else if (t === "inv") {                            // indeclinable / explicit surfaces
      [].concat(f.s || [base]).forEach(s => R(s, "def", { bound: !!f.bound }));
    }
  }
  for (const s of e.stems || []) {
    const o = typeof s === "string" ? { s } : s;
    const morph = { ...(e.def || {}), ...(o.m || {}) };
    const rec = { lemma_id: e.lemma_id, pos: e.pos, morph, ending: o.ending || "def", bound: !!o.bound, noart: !!(e.noart || o.noart), after: o.after || null, note: o.note || null, art_ok: !!o.art_ok, prep_ok: !!(e.prep_ok || o.prep_ok) };
    addStem(index, o.s, rec);
    if (/^\u0671\u0644/.test(o.s)) addStem(index, o.s.replace(/^\u0671/, ""), { ...rec, after: "\u0644\u0650" });   // li + al-X is written li-lX
  }
  for (const s of e.bound || []) {
    const o = typeof s === "string" ? { s } : s;
    addStem(index, o.s, { lemma_id: e.lemma_id, pos: e.pos, morph: { ...(e.def || {}), ...(o.m || {}) }, ending: "def", bound: true, boundOnly: true, noart: !!e.noart });
  }
}

/* ---------------- verb paradigms ---------------- */
const PERSONS = {                   // key -> [person, number, gender]
  "3ms": [3, "mufrad", "mudhakkar"], "3fs": [3, "mufrad", "muannath"], "3md": [3, "muthanna", "mudhakkar"], "3fd": [3, "muthanna", "muannath"],
  "3mp": [3, "jama", "mudhakkar"], "3fp": [3, "jama", "muannath"], "2ms": [2, "mufrad", "mudhakkar"], "2fs": [2, "mufrad", "muannath"],
  "2d": [2, "muthanna", null], "2mp": [2, "jama", "mudhakkar"], "2fp": [2, "jama", "muannath"], "1s": [1, "mufrad", null], "1p": [1, "jama", null]
};
const PERF_END = { "3ms": ["long", "َ"], "3fs": ["long", "َتْ"], "3md": ["long", "َا"], "3fd": ["long", "َتَا"], "3mp": ["long", "ُوا۟"], "3fp": ["short", "ْنَ"],
  "2ms": ["short", "ْتَ"], "2fs": ["short", "ْتِ"], "2d": ["short", "ْتُمَا"], "2mp": ["short", "ْتُمْ"], "2fp": ["short", "ْتُنَّ"], "1s": ["short", "ْتُ"], "1p": ["short", "ْنَا"] };
const IMPF_END = [   // person, ending kind, ending
  ["3ms", "long", ["ُ", "َ", "ْ"]], ["3fs", "long", ["ُ", "َ", "ْ"]], ["2ms", "long", ["ُ", "َ", "ْ"]], ["1s", "long", ["ُ", "َ", "ْ"]], ["1p", "long", ["ُ", "َ", "ْ"]],
  ["3md", "long", ["َانِ", "َا"]], ["3fd", "long", ["َانِ", "َا"]], ["2d", "long", ["َانِ", "َا"]],
  ["3mp", "long", ["ُونَ", "ُوا۟"]], ["2mp", "long", ["ُونَ", "ُوا۟"]], ["2fs", "long", ["ِينَ", "ِى"]],
  ["3fp", "short", ["ْنَ"]], ["2fp", "short", ["ْنَ"]]
];
const IMPF_JUSSIVE_SHORT = ["3ms", "3fs", "2ms", "1s", "1p"];
const IMPF_PREFIX = { "3": "ي", "2": "ت", "1": "" };
function impfPrefix(person, key) { return key.startsWith("3") && !key.startsWith("3f") ? "ي" : key.startsWith("3f") ? "ت" : key.startsWith("2") ? "ت" : key === "1s" ? "أ" : "ن"; }

/** swap the leading prefix letter of a 3ms imperfect base ("يَقُول", "يُؤْمِن") for the prefix of another person */
function reprefix(base3, key) {
  const m = /^[\u064A\u062A\u0646\u0623]([\u064B-\u0652]*)/.exec(base3);
  if (!m) return null;
  let letter = impfPrefix(null, key);
  let rest = base3.slice(m[0].length);
  let vowels = m[1];
  if (key === "1s") {                                 // أَ / أُ ; a verb whose stem starts with hamza merges: أَأْمُر -> آمُر (not generated)
    return letter + vowels + rest;
  }
  return letter + vowels + rest;
}

function verbStems(index, e) {
  const v = e.verb;
  if (!v) return;
  const active = (aspect, key, surface, voice) => {
    const [person, number, gender] = PERSONS[key];
    addStem(index, surface, { lemma_id: e.lemma_id, pos: "verb", morph: { aspect, person, number, gender, voice: voice || "active" }, ending: "def", bound: true, noart: true });
    if (/\u0646\u0652\u0646\u064E$/.test(surface) || /\u0646\u0652\u0646\u064E\u0627$/.test(surface)) addStem(index, surface.replace(/\u0646\u0652\u0646/, "\u0646\u0651"), { lemma_id: e.lemma_id, pos: "verb", morph: { aspect, person, number, gender, voice: voice || "active" }, ending: "def", bound: true, noart: true });
  };
  const gen = (voice, perf, impf) => {
    if (perf) {
      const long = perf.long || perf.s, short = perf.short || perf.long || perf.s;
      for (const [key, [kind, end]] of Object.entries(PERF_END)) {
        const base = kind === "long" ? long : short;
        if (!base) continue;
        if (kind === "long" && key === "3ms") [].concat(perf.v3 === undefined ? "\u064E" : perf.v3).forEach(v => active("maadi", key, base + v, voice));
        else active("maadi", key, base + end, voice);
      }
    }
    if (impf) {
      const long = impf.long || impf.s, short = impf.short || impf.long || impf.s;
      for (const [key, kind, ends] of IMPF_END) {
        const b3 = kind === "long" ? long : short;
        if (!b3) continue;
        const base = reprefix(b3, key);
        if (!base) continue;
        ends.forEach(end => active("mudari", key, base + end, voice));
      }
      if (impf.short || impf.long) IMPF_JUSSIVE_SHORT.forEach(key => { const b = reprefix(impf.short || impf.long, key); if (b) active("mudari", key, b + "\u0652", voice); });
    }
  };
  gen("active", v.perf, v.impf);
  gen("passive", v.pperf, v.pimpf);
  if (v.imv) {                                        // imperative: ms (bare), fs, d, mp, fp
    const long = v.imv.long || v.imv.s, short = v.imv.short || v.imv.s;
    const imv = (key, surface) => { const [person, number, gender] = PERSONS[key]; addStem(index, surface, { lemma_id: e.lemma_id, pos: "verb", morph: { aspect: "amr", person, number, gender, voice: "active" }, ending: "def", bound: true, noart: true }); };
    if (short) imv("2ms", short + "ْ");
    if (long) { imv("2ms", long + (v.imv.v === undefined ? "" : v.imv.v)); imv("2fs", long + "ِى"); imv("2d", long + "َا"); imv("2mp", long + "ُوا۟"); }
    if (short) imv("2fp", short + "ْنَ");
  }
  for (const x of v.x || []) {                        // explicit: "surface|aspect|key[|voice]"
    const [surface, aspect, key, voice] = x.split("|");
    if (!PERSONS[key]) throw new Error(`lexicon ${e.lemma_id}: unknown person key "${key}" in "${x}"`);
    active(aspect, key, surface, voice);
  }
}

function buildIndex(entries, pilotLemmas) {
  const index = new Map();
  for (const e of entries) {
    nounStems(index, e); verbStems(index, e);
    for (const f of e.fused || []) {                     // two words written as one: each part keeps its own lemma
      const joined = f.parts.map(p => p[0]).join("");
      if (canon(joined) !== canon(f.s)) throw new Error("lexicon fused entry: parts do not add up to " + f.s);
      addStem(index, f.s, { lemma_id: f.parts.map(p => p[1]).join("+"), pos: "particle", morph: {}, ending: "def", bound: false, noart: true, after: null, note: f.note || null, multi: f.parts });
      if (f.after) addStem(index, f.after_s || f.s, { lemma_id: f.parts.map(p => p[1]).join("+"), pos: "particle", morph: {}, ending: "def", bound: false, noart: true, after: f.after, note: f.note || null, multi: f.parts });
    }
  }
  return index;
}

/* ---------------- parsing ---------------- */
function lookup(index, key) { return index.get(lkey(key)) || []; }

/**
 * All parses of a token. A parse: { procs:[{surface,canon,fn,def}], article:{surface}|null, stem:{surface, rec}, encl:{surface, f}|null }
 */
function parseToken(index, lemmaPos, token) {
  const results = [];
  const bs = boundaries(token);
  const seenKeys = new Set();
  const slice = (i, j) => token.slice(i, j);

  function tryStem(i, procs, articleSeg) {
    const rest = token.slice(i);
    if (!rest) return;
    // stem + optional enclitic pronoun
    const bsRest = boundaries(rest);
    for (const k of bsRest) {
      if (k === 0) continue;
      const stemPart = rest.slice(0, k), tail = rest.slice(k);
      let encl = null, fusedNun = false;
      if (tail) {
        const tc = canon(tail).replace(/\u0653$/, "");
        encl = ENCLITICS.find(f => f.canon === tc);
        if (!encl && tc === "\u0627" && /\u0646\u0651\u064E$/.test(canon(stemPart))) { encl = ENCLITICS.find(f => f.canon === canon("\u0646\u064E\u0627")); fusedNun = true; }
        if (!encl) continue;
      }
      const variants = [stemPart];
      if (encl) {
        const sc = canon(stemPart);
        if (/\u064F\u0648$/.test(sc)) variants.push(stemPart + "\u0627");                                   // kadhdhabu + hu: the silent alef of -u is not written
        if (/\u064F\u0645$/.test(sc)) variants.push(stemPart.replace(/\u0645\u0652?$/, "\u0645\u064F\u0648"));  // -tum + pronoun: -tumu
        if (/\u0646\u0670$/.test(sc)) variants.push(stemPart.replace(/\u0670$/, "\u0627"));            // -na + pronoun is written -na with a dagger alef
      }
      for (const sp of variants) {
        const key = lkey(sp);
        const cands = [];
        (index.get(key) || []).forEach(r => cands.push({ r, viaArticle: !!articleSeg }));
        for (const { r, viaArticle } of cands) {
          if (articleSeg) {
            if (!viaArticle) continue;
            if (r.noart || r.pos !== "noun" || r.ending !== "def" || r.boundOnly && !encl) continue;
          }
          if (!articleSeg && viaArticle) continue;
          if (encl && !r.bound) continue;
          if (encl && encl.noverb && r.pos === "verb") continue;
          if (r.boundOnly && !encl) continue;
          if (r.after && !(procs.length && procs[procs.length - 1].canon === canon(r.after))) continue;
          let ok = true;
          for (const p of procs) {
            if (!p.on.includes(r.pos) && !(p.stage === 2 && p.fn === "jarr" && r.prep_ok)) ok = false;
            if (p.aspect && r.morph.aspect !== p.aspect) ok = false;
          }
          if (!ok) continue;
          results.push({ procs: procs.slice(), article: articleSeg ? { surface: articleSeg.surface, fusedLam: !!articleSeg.fusedLam } : null, stem: { surface: stemPart, rec: r }, encl: encl ? { surface: tail, f: encl, fused: fusedNun } : null });
        }
      }
    }
  }

  function withArticle(i, procs) {
    const rest = token.slice(i);
    if (/^\u0671\u0644\u0651/.test(canon(rest))) {         // the article's lam and the stem's first lam are one doubled lam
      const j1 = boundaries(rest)[1];
      tryStem(i + j1, procs, { surface: rest.slice(0, j1), sun: true, fusedLam: true });
    }
    // lunar: "ٱلْ" + letter ; sun: "ٱل" + letter with shadda; after لِ the alef is dropped
    const alefLess = procs.length && procs[procs.length - 1].canon === canon("لِ");
    for (const j of boundaries(rest)) {
      if (j === 0) continue;
      const head = canon(rest.slice(0, j));
      const next = rest.slice(j);
      if (head === (alefLess ? "\u0644" : "\u0671\u0644")) {                      // the article (sukun is ignored); after li- the alef is dropped
        const isSun = /^.\u0651/.test(canon(next));                                 // a sun letter carries the doubling
        tryStem(i + j, procs, { surface: rest.slice(0, j), sun: isSun });
      }
    }
  }

  function rec(i, minStage, procs) {
    tryStem(i, procs, null);
    withArticle(i, procs);
    for (const p of PROCLITICS) {
      if (p.stage < minStage) continue;
      for (const j of bs) {
        if (j <= i) continue;
        const c0 = canon(token.slice(i, j)), c = i === 0 ? stripShaddaFirst(c0) : c0;
        if (c === p.canon) rec(j, p.stage + 1, procs.concat([{ ...p, surface: token.slice(i, j) }]));
        if (c.length > p.canon.length) break;
      }
    }
  }
  rec(0, 0, []);
  return results;
}

module.exports = { canon, boundaries, buildIndex, parseToken, PROCLITICS, ENCLITICS, stripShaddaFirst, lookup, lkey };
