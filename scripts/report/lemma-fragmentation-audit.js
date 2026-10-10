#!/usr/bin/env node
"use strict";
/* Read-only audit: which lemma ids might be the same lexical lemma? Detection only; nothing is merged or changed.
   Candidate signals, for any two lemmas (at least one added by the coverage expansion):
     S1 same bare lemma spelling (marks removed, alef and hamza variants folded)        -> possible duplicate
     S2 same root and same part of speech, different spelling                            -> possible related lemmas (review)
     S3 one lemma's bare spelling is the other's plus a feminine/plural/relative ending -> possible inflectional variant */
const fs = require("fs");
const path = require("path");
const { loadDataset } = require("../lib/load-data");
const ROOT = path.resolve(__dirname, "..", "..");
const ds = loadDataset(ROOT);
const base = JSON.parse(fs.readFileSync(path.join(ROOT, "scripts/tests/fixtures/baseline-analysis-v1.json"), "utf8")).records.lemmas;
const roots = new Map(ds.roots.map(r => [r.root_id, r.display]));
const gl = new Map(ds.glosses.map(g => [g.lemma_id, g.lexical.en]));
const bare = s => s.replace(/[\u064B-\u065F\u0670\u06D6-\u06ED\u0640]/g, "").replace(/[آأإٱ]/g, "ا").replace(/ى/g, "ي").replace(/ء/g, "").replace(/ة/g, "ه");
const L = ds.lemmas.map(l => ({ id: l.lemma_id, form: l.form_vocalized, bare: bare(l.form_vocalized), pos: l.pos, root: l.root.root_id ? roots.get(l.root.root_id) : null, cand: (l.root.candidates || []).join("/"), en: gl.get(l.lemma_id), added: !base[l.lemma_id] }));
const pairs = [];
const seen = new Set();
const add = (sig, a, b) => { const k = [a.id, b.id].sort().join("|") + sig; if (seen.has(k)) return; seen.add(k); if (a.added || b.added) pairs.push({ signal: sig, a: a.id, b: b.id, forms: a.form + " / " + b.form, root: a.root || b.root || a.cand || b.cand || null, pos: a.pos === b.pos ? a.pos : a.pos + "/" + b.pos, glosses: (a.en || "") + " | " + (b.en || "") }); };
const byBare = new Map(); L.forEach(l => { if (!byBare.has(l.bare)) byBare.set(l.bare, []); byBare.get(l.bare).push(l); });
for (const g of byBare.values()) for (let i = 0; i < g.length; i++) for (let j = i + 1; j < g.length; j++) add("S1", g[i], g[j]);
const byRoot = new Map(); L.forEach(l => { if (!l.root) return; const k = l.root + "|" + l.pos; if (!byRoot.has(k)) byRoot.set(k, []); byRoot.get(k).push(l); });
for (const g of byRoot.values()) for (let i = 0; i < g.length; i++) for (let j = i + 1; j < g.length; j++) if (g[i].bare !== g[j].bare) {
  const [x, y] = g[i].bare.length <= g[j].bare.length ? [g[i], g[j]] : [g[j], g[i]];
  if (y.bare.startsWith(x.bare) && y.bare.length - x.bare.length <= 2 || y.bare.endsWith(x.bare) && y.bare.length - x.bare.length <= 2 || x.bare.length >= 3 && y.bare.replace(/[اوي]/g, "") === x.bare.replace(/[اوي]/g, "")) add("S3", g[i], g[j]);
  else add("S2", g[i], g[j]);
}
pairs.sort((p, q) => p.signal.localeCompare(q.signal) || p.a.localeCompare(q.a));
const out = { note: "Detection only. Nothing was merged. Classification (confirmed / review / separate) is in docs/lemma-fragmentation-audit.md.", added_lemmas: L.filter(l => l.added).length, candidates: pairs };
fs.writeFileSync(path.join(ROOT, "data/qurra/review/lemma-fragmentation-candidates.json"), JSON.stringify(out, null, 1) + "\n");
console.log("added", out.added_lemmas, "S1", pairs.filter(p => p.signal === "S1").length, "S3", pairs.filter(p => p.signal === "S3").length, "S2", pairs.filter(p => p.signal === "S2").length);
