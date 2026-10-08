"use strict";
/* Computes V1 content coverage from the hand-editable data (the same files the build uses) and writes
   docs/V1_COVERAGE_REPORT.md. Every number is counted, never estimated. `--check` fails if the report is stale.
   A field "counts" only when it exists AND the display policy would show it to a learner.
   A token's analysis is the pilot assignment if there is one, otherwise the default analysis of its exact spelling. */
const fs = require("fs");
const path = require("path");
const { loadDataset } = require("../lib/load-data");

const ROOT = path.join(__dirname, "..", "..");
const OUT = path.join(ROOT, "docs", "V1_COVERAGE_REPORT.md");
const pct = (n, d) => d ? (100 * n / d).toFixed(2) + "%" : "n/a";
const num = n => n.toLocaleString("en-US");

function computeCoverage(ds) {
  const policy = ds.taxonomy.display_policy;
  const visible = (layer, status) => ["show", "show_with_badge"].includes(policy[layer][status]);
  const formById = new Map(ds.forms.map(f => [f.form_id, f]));
  const ruleBySurface = new Map(ds.forms.filter(f => f.basis === "rule_default").map(f => [f.surface, f]));
  const pilotForm = new Map(ds.effectiveTokenForms.map(t => [t.token_id, t.form_id]));
  const lemmaById = new Map(ds.lemmas.map(l => [l.lemma_id, l]));
  const glossByLemma = new Map(ds.glosses.map(g => [g.lemma_id, g]));

  // ayah translations: published editions only count as "translated"
  const eds = ds.translationEditions;
  const textsOf = ed => new Set(ds.translationTexts[ed.translation_id].records.map(r => r.ayah_id));
  const langAyahs = lang => { const s = new Set(); eds.filter(e => e.language === lang && e.published && e.clearance === "CLEAR").forEach(e => textsOf(e).forEach(a => s.add(a))); return s; };
  const enA = langAyahs("en"), msA = langAyahs("ms");
  const workingA = lang => { const s = new Set(); eds.filter(e => e.language === lang && !e.published).forEach(e => textsOf(e).forEach(a => s.add(a))); return s; };

  // per-form facts, computed once
  const facts = new Map();
  const factsOf = f => {
    let r = facts.get(f.form_id);
    if (r) return r;
    const stems = f.segments.filter(s => s.type === "stem" && s.lemma_id && lemmaById.has(s.lemma_id));
    let root = false, rootNA = false, en = false, ms = false;
    for (const s of stems) {
      const l = lemmaById.get(s.lemma_id);
      if (l.root.root_id && visible("root", l.root.status)) root = true;
      if (l.root.status === "null_policy") rootNA = true;
      const g = glossByLemma.get(s.lemma_id);
      if (g && visible("gloss", g.status)) { if (g.lexical.en) en = true; if (g.lexical.ms) ms = true; }
    }
    r = { lemma: stems.length > 0, pos: f.segments.some(s => s.type === "stem" && s.pos), root, rootNA, en, ms, morph: !!f.morphology && visible("morphology", f.status), segments: f.segments.length, multi: f.segments.length > 1 };
    r.complete = r.lemma && r.pos && r.en && r.ms && r.morph && (r.root || r.rootNA);
    facts.set(f.form_id, r);
    return r;
  };

  const total = ds.tokens.length;
  const T = { total, searchable: total, with_form: 0, with_segmentation: 0, with_multi_segment: 0, with_lemma: 0, with_pos: 0, with_root: 0, root_not_applicable: 0, with_en_gloss: 0, with_ms_gloss: 0, with_morphology: 0, complete: 0, from_pilot: 0, from_rule_default: 0 };
  const formsUsed = new Set(), lemmasUsed = new Set(), rootsShown = new Set();
  const byJuz = new Map(), byStatus = {};
  const juzOf = new Map(); // ayah -> juz
  ds.ayahs.forEach(a => { let n = 1; ds.juz.forEach(j => { if (j.start.surah < a.surah || (j.start.surah === a.surah && j.start.ayah <= a.ayah)) n = j.juz; }); juzOf.set(a.ayah_id, n); });
  let segments = 0;
  for (const t of ds.tokens) {
    const jz = juzOf.get(t.ayah_id);
    if (!byJuz.has(jz)) byJuz.set(jz, { tokens: 0, analysed: 0, complete: 0 });
    const J = byJuz.get(jz); J.tokens++;
    const pid = pilotForm.get(t.token_id);
    const f = pid ? formById.get(pid) : ruleBySurface.get(t.text);
    if (!f) continue;
    const r = factsOf(f);
    J.analysed++; if (r.complete) J.complete++;
    T.with_form++; T.with_segmentation++; segments += r.segments;
    if (pid) T.from_pilot++; else T.from_rule_default++;
    byStatus[f.status] = (byStatus[f.status] || 0) + 1;
    formsUsed.add(f.form_id);
    f.segments.forEach(s => { if (s.type === "stem" && s.lemma_id) lemmasUsed.add(s.lemma_id); });
    if (r.multi) T.with_multi_segment++;
    if (r.lemma) T.with_lemma++; if (r.pos) T.with_pos++; if (r.en) T.with_en_gloss++; if (r.ms) T.with_ms_gloss++; if (r.morph) T.with_morphology++;
    if (r.root) { T.with_root++; f.segments.forEach(s => { const l = s.lemma_id && lemmaById.get(s.lemma_id); if (l && l.root.root_id && visible("root", l.root.status)) rootsShown.add(l.root.root_id); }); }
    else if (r.rootNA) T.root_not_applicable++;
    if (r.complete) T.complete++;
  }
  // origin of the analyses the pilot chose (candidates, conflicts: unchanged)
  const origin = { source_derived: 0, qurra_editorial: 0, qurra_root_assignment: 0, expert_reviewed: 0, unresolved: 0, deliberately_unanalysed: 0 };
  for (const set of ds.analysisSets) {
    if (set.chosen === null || set.chosen === undefined) { origin.deliberately_unanalysed++; continue; }
    const c = set.candidates.find(x => x.analysis_id === set.chosen);
    if (c) origin[c.origin] = (origin[c.origin] || 0) + 1;
  }
  const rootStatus = {};
  ds.lemmas.forEach(l => { rootStatus[l.root.status] = (rootStatus[l.root.status] || 0) + 1; });

  const clr = { CLEAR: 0, CONDITIONAL: 0, UNCLEAR: 0, NOT_CLEARED: 0 };
  ds.sources.forEach(s => { clr[s.clearance] = (clr[s.clearance] || 0) + 1; });
  const unresolvedAyahs = eds.reduce((m, e) => { const r = ds.translationReports[e.translation_id]; if (r) m[e.translation_id] = r.unresolved_ayahs; return m; }, {});
  const rule = ds.forms.filter(f => f.basis === "rule_default");

  return {
    ayahs: { total: ds.ayahs.length, text: ds.ayahs.length, en_translation: enA.size, ms_translation: msA.size, en_working: workingA("en").size, ms_working: workingA("ms").size, unresolved_alignment: unresolvedAyahs },
    surahs: ds.surahs.length, juz: ds.juz.length,
    tokens: T, segments, unique_forms: formsUsed.size, unique_lemmas_used: lemmasUsed.size, lemmas_total: ds.lemmas.length,
    unique_roots_shown: rootsShown.size, roots_total: ds.roots.length, root_status_of_lemmas: rootStatus,
    unique_spellings: new Set(ds.tokens.map(t => t.text)).size, rule_default_spellings: rule.length,
    by_status: byStatus, by_juz: [...byJuz.entries()].sort((a, b) => a[0] - b[0]).map(([j, v]) => ({ juz: j, ...v })),
    chosen_analysis_origin: origin, direct_form_assignments: ds.tokenForms.filter(t => !ds.analysisSets.some(s => s.token_id === t.token_id)).length,
    sources: { total: ds.sources.length, by_clearance: clr, in_use: ds.sources.filter(s => s.in_use).length },
    editions: eds.map(e => ({ id: e.translation_id, language: e.language, published: e.published, clearance: e.clearance, ayahs: textsOf(e).size, scope: e.scope }))
  };
}

function renderReport(c) {
  const a = c.ayahs, t = c.tokens, o = c.chosen_analysis_origin;
  const row = (n, d) => `${num(n)} | ${pct(n, d)}`;
  const L = [];
  L.push("# V1 coverage report", "",
    "> GENERATED by `node scripts/report/coverage.js` from the data files. Do not edit by hand. Every figure is a count; \"counts\" means the value exists *and* the display policy would show it to a learner.", "",
    "## Text, tokenisation and translation", "",
    "| Measure | Count | Of total |", "|---|---:|---:|",
    `| Surahs / Juz | ${c.surahs} / ${c.juz} | |`,
    `| Ayahs with Qur'anic text | ${row(a.text, a.total)} |`,
    `| Ayahs with a published **English** translation (Pickthall 1930) | ${row(a.en_translation, a.total)} |`,
    `| Ayahs with a published **Malay** translation | ${row(a.ms_translation, a.total)} |`,
    `| Ayahs with an English QURRA working rendering (provisional, not a translation of record) | ${row(a.en_working, a.total)} |`,
    `| Ayahs with a Malay QURRA working rendering (provisional, not a translation of record) | ${row(a.ms_working, a.total)} |`,
    `| Tokens in total | ${num(t.total)} | |`,
    `| Tokens searchable by Arabic surface/normalised form | ${row(t.searchable, t.total)} |`, "",
    "Ayahs left without text because the source's alignment is unresolved:", "");
  Object.entries(a.unresolved_alignment).forEach(([id, list]) => L.push(`- \`${id}\`: ${list.length ? list.join(", ") : "none"}`));
  L.push("", "## Word analysis (QURRA-authored and provisional; no external morphology is imported)", "",
    "| Measure | Tokens | Of all tokens |", "|---|---:|---:|",
    `| Tokens with a form (word/segment breakdown) | ${row(t.with_form, t.total)} |`,
    `| &nbsp;&nbsp;of which segmented into more than one part (prefix / pronoun / fused) | ${row(t.with_multi_segment, t.total)} |`,
    `| Tokens with a lemma | ${row(t.with_lemma, t.total)} |`,
    `| Tokens with a part of speech | ${row(t.with_pos, t.total)} |`,
    `| Tokens with morphology shown | ${row(t.with_morphology, t.total)} |`,
    `| Tokens with an English word meaning | ${row(t.with_en_gloss, t.total)} |`,
    `| Tokens with a Malay word meaning | ${row(t.with_ms_gloss, t.total)} |`,
    `| Tokens with a root shown (provisional) | ${row(t.with_root, t.total)} |`,
    `| Tokens where no root applies (closed-class words, by policy) | ${row(t.root_not_applicable, t.total)} |`,
    `| **Complete analysis** (form, lemma, POS, EN + BM meaning, morphology, and a root or "no root applies") | ${row(t.complete, t.total)} |`,
    `| Tokens with no analysis | ${row(t.total - t.with_form, t.total)} |`, "",
    "| Where the analysis comes from | Tokens |", "|---|---:|",
    `| Pilot (analysed for that very token) | ${num(t.from_pilot)} |`,
    `| Default reading of the token's exact spelling (rule-based) | ${num(t.from_rule_default)} |`,
    `| Source-derived (external dataset) | ${num(o.source_derived)} |`, "",
    "| Status | Tokens |", "|---|---:|");
  Object.entries(c.by_status).forEach(([s, n]) => L.push(`| ${s} | ${num(n)} |`));
  L.push("", "| Unique counts | Number |", "|---|---:|",
    `| Distinct spellings in the Qur'an | ${num(c.unique_spellings)} |`,
    `| Distinct spellings with a rule-based default analysis | ${num(c.rule_default_spellings)} |`,
    `| Distinct forms used by analysed tokens | ${num(c.unique_forms)} |`,
    `| Segments in those forms (counted per token) | ${num(c.segments)} |`,
    `| Lemmas recorded / lemmas with at least one analysed token | ${num(c.lemmas_total)} / ${num(c.unique_lemmas_used)} |`,
    `| Roots recorded / roots shown to learners | ${num(c.roots_total)} / ${num(c.unique_roots_shown)} |`, "",
    "Root status of the recorded lemmas: " + Object.entries(c.root_status_of_lemmas).map(([k, v]) => `${k} ${v}`).join(", ") + ". Roots that are disputed or unresolved are never shown or indexed as roots.", "",
    "### Who made the pilot analyses", "",
    "| Origin of the chosen pilot analysis | Tokens |", "|---|---:|",
    `| QURRA editorial (provisional, unreviewed) | ${o.qurra_editorial} |`,
    `| QURRA root assignment | ${o.qurra_root_assignment} |`, `| Expert reviewed | ${o.expert_reviewed} |`,
    `| Deliberately unanalysed | ${o.deliberately_unanalysed} |`,
    `| Direct form assignments (Stage 1 demo, no analysis set) | ${c.direct_form_assignments} |`, "",
    "## Coverage by Juz", "", "| Juz | Tokens | Analysed | Analysed % | Complete % |", "|---:|---:|---:|---:|---:|");
  c.by_juz.forEach(j => L.push(`| ${j.juz} | ${num(j.tokens)} | ${num(j.analysed)} | ${pct(j.analysed, j.tokens)} | ${pct(j.complete, j.tokens)} |`));
  L.push("", "## Licensing", "",
    "| Clearance | Sources |", "|---|---:|",
    `| CLEAR | ${c.sources.by_clearance.CLEAR} |`, `| CONDITIONAL | ${c.sources.by_clearance.CONDITIONAL} |`,
    `| UNCLEAR | ${c.sources.by_clearance.UNCLEAR} |`, `| NOT_CLEARED | ${c.sources.by_clearance.NOT_CLEARED} |`,
    `| **Registered / in use** | ${c.sources.total} / ${c.sources.in_use} |`, "",
    "Only CLEAR sources are in use. See `docs/content-source-research.md` for every source's gate record.", "",
    "## Translation editions", "", "| Edition | Language | Published | Clearance | Scope | Ayahs with text |", "|---|---|---|---|---|---:|");
  c.editions.forEach(e => L.push(`| ${e.id} | ${e.language} | ${e.published ? "yes" : "no"} | ${e.clearance} | ${e.scope} | ${e.ayahs} |`));
  return L.join("\n") + "\n";
}

if (require.main === module) {
  const ds = loadDataset(ROOT);
  const text = renderReport(computeCoverage(ds));
  if (process.argv.includes("--check")) {
    if (!fs.existsSync(OUT) || fs.readFileSync(OUT, "utf8") !== text) { console.error("STALE docs/V1_COVERAGE_REPORT.md — run: node scripts/report/coverage.js"); process.exit(1); }
    console.log("coverage report: up to date");
  } else { fs.writeFileSync(OUT, text); console.log("wrote docs/V1_COVERAGE_REPORT.md"); }
}
module.exports = { computeCoverage, renderReport };
