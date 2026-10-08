#!/usr/bin/env node
"use strict";
/* Audit (read-only): where might the data contain quadriliteral (four-radical) roots?
   It changes nothing. It writes data/qurra/review/quadriliteral-audit.json with:
     A. the root inventory by number of letters;
     B. lemma root candidates / assignments with four letters;
     C. lemmas whose spelling has a reduplicated pattern (c1 c2 c1 c2), or a verb of four consonants without a verb_form;
     D. a heuristic scan of the Qur'an text for reduplicated four-consonant words (clitics stripped), with counts and refs.
   Everything here is a flag for editorial review. Nothing is a decision, and no root is assigned or changed. */
const fs = require("fs");
const path = require("path");
const { loadDataset } = require("../lib/load-data");
const { skeleton } = require("../lib/arabic");
const rootModel = require("../lib/rootmodel");

const ROOT = path.resolve(__dirname, "..", "..");
const ds = loadDataset(ROOT);
const WEAKISH = new Set(["و", "ي"]);

const canon = s => skeleton(s).replace(/[^ء-ي]/g, "");
const abab = s => s.length === 4 && s[0] === s[2] && s[1] === s[3];

/* A */
const byCount = {};
ds.roots.forEach(r => { (byCount[r.letters.length] = byCount[r.letters.length] || []).push(r.display); });
const inventory = Object.keys(byCount).sort().map(k => ({ letters: Number(k), category: rootModel.categoryByCount(ds.taxonomy).get(Number(k)) || null, count: byCount[k].length, roots: Number(k) === 3 ? undefined : byCount[k] }));

/* B */
const withFour = [];
ds.lemmas.forEach(l => {
  const c = ((l.root && l.root.candidates) || []).filter(x => rootModel.splitRoot(x).length === 4);
  const assigned = l.root && l.root.root_id ? ds.roots.find(r => r.root_id === l.root.root_id) : null;
  if (c.length || (assigned && assigned.letters.length === 4)) {
    withFour.push({ lemma_id: l.lemma_id, form: l.form_vocalized, pos: l.pos, status: l.root.status, root_id: l.root.root_id || null, four_letter_candidates: c, all_candidates: l.root.candidates || [], note: "recorded as disputed; no root assigned" });
  }
});

/* C */
const spelled = [];
ds.lemmas.forEach(l => {
  const sk = canon(l.form_vocalized);
  const reasons = [];
  if (abab(sk)) reasons.push("reduplicated spelling (c1 c2 c1 c2)");
  if (l.pos === "verb" && !l.verb_form && sk.length === 4 && !(l.root && l.root.root_id)) reasons.push("verb of four consonants without a verb_form and without an assigned root");
  if (reasons.length) spelled.push({ lemma_id: l.lemma_id, form: l.form_vocalized, pos: l.pos, skeleton: sk, root_status: l.root.status, candidates: l.root.candidates || [], reasons });
});

/* D */
const PREFIX = ["وال", "فال", "بال", "كال", "لل", "ال", "و", "ف", "ب", "ك", "ل", "س"];
const SUFFIX = ["ونه", "وها", "ونها", "كم", "هم", "هما", "نا", "ها", "ون", "ين", "وا", "ان", "ات", "ت", "ه", "ك", "ي", "ة", "ا", "ن"];
const hits = new Map();
ds.tokens.forEach(t => {
  const sk = canon(t.text);
  const forms = new Set([sk]);
  for (const p of PREFIX) if (sk.startsWith(p)) forms.add(sk.slice(p.length));
  [...forms].forEach(f => { for (const s of SUFFIX) if (f.endsWith(s)) forms.add(f.slice(0, f.length - s.length)); });
  const found = [...forms].find(f => abab(f));
  if (found) {
    const h = hits.get(found) || { stem_skeleton: found, count: 0, analysed: 0, surfaces: new Set(), refs: [] };
    h.count++; if (t.form_id) h.analysed++;
    h.surfaces.add(t.text); if (h.refs.length < 4) h.refs.push(t.token_id);
    hits.set(found, h);
  }
});
const tokenHits = [...hits.values()].map(h => ({ ...h, surfaces: [...h.surfaces].slice(0, 6) })).sort((a, b) => b.count - a.count);

const out = {
  schema: "qurra-quadriliteral-audit/1",
  note: "Read-only audit. Every entry is a flag for editorial review; no root was assigned, changed or removed. Section D is a spelling heuristic and will include false positives (for example words that merely repeat a pair of letters) and may miss quadriliteral words that are not reduplicated.",
  A_root_inventory_by_letter_count: inventory,
  B_lemmas_with_four_letter_root_candidates: withFour,
  C_lemma_spellings_flagged: spelled,
  D_reduplicated_words_in_the_text: tokenHits,
  not_covered: "Non-reduplicated quadriliteral words (for example a verb built on four different consonants) cannot be found by spelling alone; they need the lexicon or an editor."
};
fs.writeFileSync(path.join(ROOT, "data/qurra/review/quadriliteral-audit.json"), JSON.stringify(out, null, 2) + "\n");
console.log("A", JSON.stringify(inventory));
console.log("B", withFour.map(x => x.lemma_id).join(", "));
console.log("C", spelled.map(x => `${x.lemma_id}(${x.skeleton})`).join(", "));
console.log("D", tokenHits.map(h => `${h.stem_skeleton}:${h.count}/${h.analysed}`).join("  "));
