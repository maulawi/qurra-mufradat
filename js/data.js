/* ==========================================================================
   QURRA Mufradat al-Qur'an — Data access layer (repository)

   Every screen calls these functions, never the raw dataset. The raw dataset
   (QM_DATASET) and the search index (QM_SEARCH_INDEX) are GENERATED from the
   hand-editable files under data/ by `node scripts/build.js`.

   Model (see STAGE_2_IMPLEMENTATION.md / STAGE_3_REPORT.md):
     Ayah -> Token -> Form -> Segment(s) -> Lemma -> Root
   Token != Form != Lemma != Root. Tokens exist for EVERY word of the Qur'an and
   are derived deterministically from the ayah text (token_id "surah:ayah:pos").
   Only analysed tokens have a Form (QM_DATASET.token_forms); every other token
   is shown honestly as "not yet analysed". A Form carries segments[] (any
   number of stems, proclitics, enclitics); lemma_id lives on stem segments and
   may be null; a lemma's root is an *assignment* with its own status.

   This file is the only place that knows the stored shapes. It hands the UI
   view objects (token.surfaceForm, lemma.form, ...). Nothing unresolved is ever
   presented as settled: what a learner may see per status is data
   (taxonomy.display_policy) and is applied here, so a hidden/unresolved root is
   absent from every view and from the search index.
   ========================================================================== */

const QMData = (function () {

  const D = QM_DATASET;
  const IDX = QM_SEARCH_INDEX;
  const TAX = D.taxonomy;
  const POLICY = TAX.display_policy;

  const index = (arr, key) => new Map(arr.map(x => [x[key], x]));
  const SURAH = index(D.surahs, "number");
  const JUZ = index(D.juz, "juz");
  const AYAH = index(D.ayahs, "ayah_id");
  const TOKEN_FORM = index(D.token_forms, "token_id");
  const FORM = index(D.forms, "form_id");
  // Rule-based default analyses (provisional, QURRA-generated): one compact record per spelling, applied to every token with that spelling.
  // A pilot analysis of a specific token always wins over the default for its spelling.
  const RULE_FORMS = D.rule_forms || [];
  const RULE_BY_SURFACE = new Map(RULE_FORMS.map(r => [r[1], r]));
  // Readings chosen for ONE token (a spelling with several readings): same compact record + the token id. They win over the spelling's default.
  const CONTEXT_FORMS = D.context_forms || [];
  const CONTEXT_BY_TOKEN = new Map(CONTEXT_FORMS.map(r => [r[6], r]));
  const RULE_BY_ID = new Map(RULE_FORMS.concat(CONTEXT_FORMS).map(r => ["frm-sd-" + r[0], r]));
  const RES_NAME = { k: "confident", p: "provisional", x: "context_dependent", u: "unresolved" };
  const CONTEXT_TOKENS = new Set(D.context_tokens || []);          // pilot tokens with competing analyses
  const POS_NAME = { n: "noun", v: "verb", p: "particle" }, SEG_TYPE = { p: "proclitic", s: "stem", e: "enclitic" };
  const ruleCache = new Map();
  function expandRule(r) {
    const id = "frm-sd-" + r[0];
    let f = ruleCache.get(id);
    if (!f) {
      const meta = r[5] || null;
      f = { form_id: id, surface: r[1], morphology: r[3], status: meta && meta[4] ? "unresolved" : "provisional", basis: r[6] ? "rule_context" : "rule_default",
        resolution: meta ? RES_NAME[meta[0]] : "confident", alternatives: meta && meta[1] ? meta[1] : undefined, candidates: meta && meta[2] ? meta[2] : undefined, source_review_required: !!(meta && meta[3]), provenance: { form: { source_id: "QURRA_RULE_ANALYSIS" }, morphology: { source_id: "QURRA_RULE_ANALYSIS" } },
        segmentation_note: r[4] || undefined,
        segments: r[2].map((s, i) => { const o = { segment_id: id + ".s" + (i + 1), type: SEG_TYPE[s[0]], surface: s[1], pos: POS_NAME[s[2]] || null };
          if (s[3]) o.function = s[3]; if (s[0] === "s") o.lemma_id = s[4] || null;
          if (s[5]) o.pronoun_features = { person: s[5][0], number: s[5][1], ...(s[5][2] ? { gender: s[5][2] } : {}) }; return o; }) };
      ruleCache.set(id, f);
    }
    return f;
  }
  /** the Token -> Form assignment in force for a token: the pilot's own, else the default for its spelling, else none */
  function formAssignment(tokenId, word) {
    const tf = TOKEN_FORM.get(tokenId);
    if (tf) return tf;
    const c = CONTEXT_BY_TOKEN.get(tokenId);
    if (c) return { token_id: tokenId, form_id: "frm-sd-" + c[0], status: "provisional", basis: "rule_context", provenance: { form: { source_id: "QURRA_RULE_ANALYSIS" } } };
    const r = RULE_BY_SURFACE.get(word);
    return r ? { token_id: tokenId, form_id: "frm-sd-" + r[0], status: r[5] && r[5][4] ? "unresolved" : "provisional", basis: "rule_default", provenance: { form: { source_id: "QURRA_RULE_ANALYSIS" } } } : null;
  }
  const LEMMA = index(D.lemmas, "lemma_id");
  const ROOT = index(D.roots, "root_id");
  const GLOSS = index(D.glosses, "lemma_id");
  const T = (typeof QM_TRANSLATIONS !== "undefined") ? QM_TRANSLATIONS : { texts: {}, working_status: {} };
  const EDITIONS = D.translation_editions || [];
  const EDITION = index(EDITIONS, "translation_id");
  const SOURCE = index(D.sources, "source_id");

  /* ---------------- taxonomy & display policy ---------------- */

  const POS = new Map(TAX.pos.map(p => [p.id, p]));
  // taxonomy category -> the UI's enum category name (translation keys are enum.<uiName>.<id>)
  const UI_CATEGORY = {
    plural_type: "pluralType", definiteness_state: "definitenessState", reference_class: "referenceClass",
    derivation_type: "derivationType", declension: "declension", verb_aspect: "form", particle_function: "functionHere",
    root_type: "rootType", segment_function: "segmentFunction", pos: "pos"
  };
  /** { category: { id: arabicTerm|null } } — Arabic grammatical terms, never translated. Built from the taxonomy, not hard-coded in the UI. */
  function arabicTerms() {
    const out = {};
    Object.keys(UI_CATEGORY).forEach(tc => {
      out[UI_CATEGORY[tc]] = {};
      (TAX[tc] || []).forEach(v => { out[UI_CATEGORY[tc]][v.id] = v.ar === undefined ? null : v.ar; });
    });
    return out;
  }
  function listPos() { return TAX.pos.map(p => ({ ...p })); }
  /** CSS suffix for a POS id (qm-badge--pos-<css>). */
  function posCss(pos) { return (POS.get(pos) || {}).css || "harf"; }

  /** What a learner may see for a layer in a given status: show | show_with_badge | under_review | not_applicable | hide. */
  function displayState(layer, status) {
    return (POLICY[layer] && POLICY[layer][status]) || "hide";
  }
  const visibleState = s => s === "show" || s === "show_with_badge";

  const camelKey = k => k.replace(/_([a-z])/g, (m, c) => c.toUpperCase());
  function camelDeep(v) {
    if (Array.isArray(v)) return v.map(camelDeep);
    if (v && typeof v === "object") return Object.fromEntries(Object.entries(v).map(([k, x]) => [camelKey(k), camelDeep(x)]));
    return v;
  }

  /* ---------------- structure indexes (derived once at load) ---------------- */

  const AYAHS_BY_SURAH = new Map();        // surah number -> ayah records in order
  const JUZ_SURAHS = new Map();
  const JUZ_RANGES = new Map();            // juz number -> [{surahId, from, to, count}] in Qur'an order
  D.ayahs.forEach(a => {
    if (!AYAHS_BY_SURAH.has(a.surah)) AYAHS_BY_SURAH.set(a.surah, []);
    AYAHS_BY_SURAH.get(a.surah).push(a);
    if (!JUZ_SURAHS.has(a.juz)) JUZ_SURAHS.set(a.juz, new Set());
    JUZ_SURAHS.get(a.juz).add(a.surah);
    // juz membership: ayah ranges per surah (an ayah belongs to exactly one juz; juz.start in the metadata is the only input)
    if (!JUZ_RANGES.has(a.juz)) JUZ_RANGES.set(a.juz, []);
    const rs = JUZ_RANGES.get(a.juz), last = rs[rs.length - 1];
    if (last && last.surahId === a.surah && last.to === a.ayah - 1) { last.to = a.ayah; last.count++; }
    else rs.push({ surahId: a.surah, from: a.ayah, to: a.ayah, count: 1 });
  });
  const RESOLUTION_BY_SURAH = new Map(), RESOLUTION_BY_JUZ = new Map();   // number -> { confident, provisional, context_dependent, unresolved }
  const ANALYSED_AYAHS = new Map();        // surah number -> sorted ayah numbers with at least one analysed token
  const ANALYSED_BY_JUZ = new Map();       // juz number -> count of such ayahs
  const TOKENS_BY_SURAH = new Map(), ANALYSED_TOKENS_BY_SURAH = new Map();   // surah number -> words / analysed words
  const TOKENS_BY_JUZ = new Map(), ANALYSED_TOKENS_BY_JUZ = new Map();
  (function () {
    const bump = (m, k, n) => m.set(k, (m.get(k) || 0) + n);
    D.ayahs.forEach(a => {
      const words = a.text.split(" ");
      let analysed = 0;
      const tally = (m, k, res) => { let o = m.get(k); if (!o) { o = { confident: 0, provisional: 0, context_dependent: 0, unresolved: 0 }; m.set(k, o); } o[res]++; };
      words.forEach((w, i) => {
        const tid = a.ayah_id + ":" + (i + 1), tf = TOKEN_FORM.get(tid), rr = CONTEXT_BY_TOKEN.get(tid) || RULE_BY_SURFACE.get(w);
        if (!tf && !rr) return;
        analysed++;
        let res;
        if (CONTEXT_TOKENS.has(tid)) res = "context_dependent";
        else if (tf) res = (FORM.get(tf.form_id) || {}).resolution || "provisional";
        else res = RES_NAME[(rr[5] || ["k"])[0]];
        tally(RESOLUTION_BY_SURAH, a.surah, res); tally(RESOLUTION_BY_JUZ, a.juz, res);
      });
      bump(TOKENS_BY_SURAH, a.surah, words.length); bump(ANALYSED_TOKENS_BY_SURAH, a.surah, analysed);
      bump(TOKENS_BY_JUZ, a.juz, words.length); bump(ANALYSED_TOKENS_BY_JUZ, a.juz, analysed);
      if (analysed) {
        if (!ANALYSED_AYAHS.has(a.surah)) ANALYSED_AYAHS.set(a.surah, []);
        ANALYSED_AYAHS.get(a.surah).push(a.ayah);
        bump(ANALYSED_BY_JUZ, a.juz, 1);
      }
    });
  })();

  /* ---------------- Surah / Juz ---------------- */

  function surahView(s) {
    return {
      id: s.surah_id, number: s.number, nameAr: s.name_ar, nameEn: s.name_en, nameMs: s.name_ms, meaningEn: s.meaning_en,
      ayahCount: s.ayah_count, revelation: s.revelation, revelationOrder: s.revelation_order, status: s.status,
      analysedAyahs: (ANALYSED_AYAHS.get(s.number) || []).slice(),    // ayahs with at least one analysed word
      tokenCount: TOKENS_BY_SURAH.get(s.number) || 0, analysedTokenCount: ANALYSED_TOKENS_BY_SURAH.get(s.number) || 0,
      resolution: { ...(RESOLUTION_BY_SURAH.get(s.number) || {}) }
    };
  }
  function juzView(j) {
    const surahIds = Array.from(JUZ_SURAHS.get(j.juz) || []).sort((a, b) => a - b);
    const ranges = (JUZ_RANGES.get(j.juz) || []).map(r => ({ ...r }));
    const first = ranges[0], last = ranges[ranges.length - 1];
    return { number: j.juz, nameAr: j.name_ar, start: { ...j.start }, surahIds, note: j.note, analysedAyahCount: ANALYSED_BY_JUZ.get(j.juz) || 0, tokenCount: TOKENS_BY_JUZ.get(j.juz) || 0, analysedTokenCount: ANALYSED_TOKENS_BY_JUZ.get(j.juz) || 0, resolution: { ...(RESOLUTION_BY_JUZ.get(j.juz) || {}) },
      ranges, totalAyahs: ranges.reduce((n, r) => n + r.count, 0),
      firstAyah: first ? { surah: first.surahId, ayah: first.from } : null, lastAyah: last ? { surah: last.surahId, ayah: last.to } : null };
  }

  function listJuz() { return D.juz.map(juzView).sort((a, b) => a.number - b.number); }
  function getJuz(juzNumber) {
    const j = JUZ.get(Number(juzNumber));
    if (!j) return null;
    const v = juzView(j);
    return { ...v, surahs: v.surahIds.map(getSurah).filter(Boolean), ranges: v.ranges.map(r => ({ ...r, surah: getSurah(r.surahId) })) };
  }
  function listSurahs() { return D.surahs.map(surahView).sort((a, b) => a.number - b.number); }
  function getSurah(surahNumber) {
    const s = SURAH.get(Number(surahNumber));
    return s ? surahView(s) : null;
  }
  /** The first Juz a surah appears in (a surah can span several Juz). */
  function getJuzForSurah(surahNumber) {
    for (const juz of listJuz()) if (juz.surahIds.includes(Number(surahNumber))) return juz;
    return null;
  }

  /* ---------------- Ayah ---------------- */

  const wordsCache = new Map();
  function wordsOf(ayah) {
    let w = wordsCache.get(ayah.ayah_id);
    if (!w) { w = ayah.text.split(" "); wordsCache.set(ayah.ayah_id, w); }   // the one tokenisation rule (scripts/lib/tokenize.js)
    return w;
  }

  function listAyahsInSurah(surahNumber) {
    return (AYAHS_BY_SURAH.get(Number(surahNumber)) || []).map(a => ayahView(a));
  }
  function getAyah(surahNumber, ayahNumber) {
    const a = AYAH.get(`${Number(surahNumber)}:${Number(ayahNumber)}`);
    return a ? ayahView(a) : null;
  }
  function ayahView(a) {
    const translations = translationsFor(a.ayah_id);
    const words = wordsOf(a);
    return {
      id: a.ayah_id, surahId: a.surah, ayahId: a.ayah, juz: a.juz,
      text: a.text,                                   // canonical text, verbatim — never a normalised form
      tokenIds: words.map((w, i) => `${a.ayah_id}:${i + 1}`),
      tokens: words.map((w, i) => getToken(`${a.ayah_id}:${i + 1}`)),
      translations                                     // [] when no edition has text for this ayah (missing stays missing)
    };
  }

  /** Every edition that has text for the ayah: published editions first, QURRA working renderings after. */
  function translationsFor(ayahId) {
    const out = [];
    EDITIONS.forEach(ed => {
      const text = (T.texts[ed.translation_id] || {})[ayahId];
      if (typeof text !== "string") return;
      const st = (T.working_status[ed.translation_id] || {})[ayahId] || ed.status;
      if (!["show", "show_with_badge"].includes(POLICY.translation[st])) return;           // the display policy decides
      out.push({ id: ed.translation_id, language: ed.language, title: ed.title, translator: ed.translator, year: ed.year || null,
        published: ed.published, status: st, attribution: ed.attribution, note: ed.note || null, text });
    });
    return out.sort((x, y) => (y.published - x.published) || x.id.localeCompare(y.id));
  }
  function listTranslationEditions() { return EDITIONS.map(e => ({ ...e })); }

  /* ---------------- Token / Form / Segment ---------------- */

  const tokenCache = new Map();
  function segmentView(s) {
    const v = { id: s.segment_id, type: s.type, surface: s.surface, pos: s.pos };
    if (s.function) v.function = s.function;
    if (s.gloss_en) v.gloss = s.gloss_en;
    if (s.pronoun_features) v.pronounFeatures = { ...s.pronoun_features, person: s.pronoun_features.person === undefined ? undefined : Number(s.pronoun_features.person) };
    if (s.type === "stem") v.lemmaId = s.lemma_id;
    return v;
  }

  function getForm(formId) {
    const f = FORM.get(formId) || (RULE_BY_ID.has(formId) ? expandRule(RULE_BY_ID.get(formId)) : null);
    if (!f) return null;
    const segments = f.segments.map(segmentView);
    const stems = segments.filter(s => s.type === "stem");
    const primary = stems.find(s => s.lemmaId) || stems[0] || null;
    return {
      id: f.form_id, surface: f.surface, segments, stemCount: stems.length,
      lemmaIds: stems.map(s => s.lemmaId).filter(Boolean),
      primaryLemmaId: primary ? primary.lemmaId : null,
      pos: primary ? primary.pos : null,
      morphology: camelDeep(f.morphology),
      segmentationNote: f.segmentation_note || null,
      status: f.status, provenance: f.provenance,
      resolution: f.resolution || "provisional", alternatives: f.alternatives || [], candidates: f.candidates || [], sourceReviewRequired: !!f.source_review_required
    };
  }

  const TOKEN_ID_RE = /^(\d{1,3}):(\d{1,3}):(\d{1,3})$/;
  /** Any token of the Qur'an. Unanalysed tokens have pos null, no segments, no lemma. */
  function getToken(tokenId) {
    if (tokenCache.has(tokenId)) return tokenCache.get(tokenId);
    const m = TOKEN_ID_RE.exec(tokenId);
    if (!m) return null;
    const ayah = AYAH.get(`${Number(m[1])}:${Number(m[2])}`);
    const position = Number(m[3]);
    if (!ayah) return null;
    const words = wordsOf(ayah);
    if (position < 1 || position > words.length) return null;
    const canonicalId = `${ayah.ayah_id}:${position}`;
    if (canonicalId !== tokenId) return null;                // "01:1:1" is not a token id
    const tf = formAssignment(tokenId, words[position - 1]);
    const form = tf ? getForm(tf.form_id) : null;
    const lemma = form && form.primaryLemmaId ? getLemma(form.primaryLemmaId) : null;
    const view = {
      id: tokenId, surahId: ayah.surah, ayahId: ayah.ayah, position,
      surfaceForm: words[position - 1],                       // canonical, verbatim
      analysed: !!form,
      pos: form ? form.pos : null,
      segments: form ? form.segments : [],
      morphology: form ? form.morphology : {},
      segmentationNote: form ? form.segmentationNote : null,
      formId: form ? form.id : null, stemCount: form ? form.stemCount : 0,
      status: tf ? tf.status : "imported",
      resolution: form ? (CONTEXT_TOKENS.has(tokenId) ? "context_dependent" : form.resolution) : null,   // confident | provisional | context_dependent | unresolved
      alternatives: form ? form.alternatives : [], candidates: form ? form.candidates : [], sourceReviewRequired: form ? form.sourceReviewRequired : false,
      analysisBasis: tf ? (tf.basis || "pilot") : null,       // "rule_default" (default reading of the spelling) | "pilot" (analysed for this token)
      lemma,
      sourceIds: sourceIdsForToken(ayah, form, lemma),
      // what is known about this word, said plainly: "unavailable" means no cleared value exists, never a guess
      coverage: {
        text: "complete", form: form ? "available" : "unavailable", lemma: lemma ? "available" : "unavailable",
        root: lemma ? displayState("root", lemma.rootStatus) : "unavailable",
        glossEn: !!(lemma && lemma.gloss.en && lemma.gloss.en !== "—"), glossMs: !!(lemma && lemma.gloss.ms && lemma.gloss.ms !== "—")
      }
    };
    tokenCache.set(tokenId, view);
    return view;
  }

  /* ---------------- Gloss layer (lexical gloss / learner note / contextual / usage kept apart) ---------------- */

  function glossFor(lemmaId) {
    const g = GLOSS.get(lemmaId);
    if (!g || !visibleState(displayState("gloss", g.status))) return null;
    return { en: g.lexical.en, ms: g.lexical.ms };
  }
  function noteField(lemmaId, field) {
    const g = GLOSS.get(lemmaId);
    if (!g || !g[field] || !visibleState(displayState("gloss", g.status))) return null;
    return { en: g[field].en, ms: g[field].ms };
  }

  /* ---------------- Lemma / Root ---------------- */

  function rootRecordView(r) {
    return {
      id: r.root_id, letters: r.letters.join(""), display: r.display, rootType: r.root_type,
      coreField: { en: r.core_field.en, ms: r.core_field.ms }, status: r.status, provenance: r.provenance
    };
  }
  /** Which root (if any) this lemma may show a learner, and in what state. Unresolved/disputed/null-policy yield no root. */
  function rootStateOf(rec) {
    const state = displayState("root", rec.root.status);
    const root = rec.root.root_id && visibleState(state) && ROOT.get(rec.root.root_id)
      ? rootRecordView(ROOT.get(rec.root.root_id)) : null;
    return { state: root ? state : (visibleState(state) ? "under_review" : state), root };
  }

  function lemmaShallow(rec) {
    const g = GLOSS.get(rec.lemma_id);
    const cj = rec.conjugation;
    const cjState = cj ? displayState("conjugation", cj.status) : null;
    return {
      id: rec.lemma_id, form: rec.form_vocalized, pos: rec.pos,
      derivationType: rec.derivation_type, verbForm: rec.verb_form, derivedFromVerbForm: rec.derived_from_verb_form,
      functionInventory: rec.function_inventory,
      gloss: glossFor(rec.lemma_id) || { en: "—", ms: "—" },
      learnerNote: noteField(rec.lemma_id, "learner_note"),
      usageNote: noteField(rec.lemma_id, "usage_note"),
      conjugation: cj && visibleState(cjState)
        ? { maadi: cj.forms.maadi, mudari: cj.forms.mudari, amr: cj.forms.amr, note: cj.note || null, status: cj.status, state: cjState, source: cj.provenance.source_id }
        : null,
      conjugationWithheld: !!cj && !visibleState(cjState),
      rootStatus: rec.root.status,
      rootCandidates: rec.root.candidates.slice(),
      status: rec.status,
      glossStatus: g ? g.status : null
    };
  }

  function getLemma(lemmaId) {
    const rec = LEMMA.get(lemmaId);
    if (!rec) return null;
    const v = lemmaShallow(rec);
    const rs = rootStateOf(rec);
    v.root = rs.root;
    v.rootState = rs.state;                 // show | show_with_badge | under_review | not_applicable | hide
    v.sourceIds = sourceIdsForLemma(rec, rs.root);
    return v;
  }

  /** Lemmas whose root assignment may be shown for this root. */
  function visibleLemmasOfRoot(rootId) {
    return D.lemmas.filter(l => l.root.root_id === rootId && visibleState(displayState("root", l.root.status)));
  }

  /**
   * `lemmas` here are shallow (no nested root) — getLemma() attaches a root, and a root's lemmas
   * each pointing back to a resolved root would recurse. A root page only needs each lemma's own fields.
   * A root that no lemma may currently display returns null (the route shows "not found").
   */
  function getRoot(rootId) {
    const r = ROOT.get(rootId);
    if (!r) return null;
    const lemmas = visibleLemmasOfRoot(rootId);
    if (!lemmas.length) return null;
    const v = rootRecordView(r);
    v.lemmas = lemmas.map(lemmaShallow);
    v.state = displayState("root", lemmas[0].root.status);
    v.sourceIds = Array.from(new Set(lemmas.flatMap(l => [l.root.provenance.source_id]).concat([r.provenance.core_field.source_id])));
    return v;
  }
  function listRoots() {
    return D.roots.map(r => getRoot(r.root_id)).filter(Boolean).sort((a, b) => a.letters.localeCompare(b.letters, "ar"));
  }
  function listLemmas() {
    return D.lemmas.map(l => getLemma(l.lemma_id)).sort((a, b) => a.form.localeCompare(b.form, "ar"));
  }

  /** Every analysed token whose form has a stem pointing at this lemma, in Qur'an order. */
  // lemma id -> token ids in Qur'an order, built once on first use from every token's form (pilot assignment first, else the spelling's default)
  let LEMMA_TOKENS = null;
  function lemmaTokenIndex() {
    if (LEMMA_TOKENS) return LEMMA_TOKENS;
    LEMMA_TOKENS = new Map();
    const lemmasOfForm = new Map();
    const lemmasFor = formId => {
      let l = lemmasOfForm.get(formId);
      if (!l) { const f = FORM.get(formId) || (RULE_BY_ID.has(formId) ? expandRule(RULE_BY_ID.get(formId)) : null); l = f ? [...new Set(f.segments.filter(s => s.type === "stem" && s.lemma_id).map(s => s.lemma_id))] : []; lemmasOfForm.set(formId, l); }
      return l;
    };
    D.ayahs.forEach(a => a.text.split(" ").forEach((w, i) => {
      const tid = a.ayah_id + ":" + (i + 1), tf = formAssignment(tid, w);
      if (tf) lemmasFor(tf.form_id).forEach(l => { if (!LEMMA_TOKENS.has(l)) LEMMA_TOKENS.set(l, []); LEMMA_TOKENS.get(l).push(tid); });
    }));
    return LEMMA_TOKENS;
  }
  function getOccurrenceCount(lemmaId) { return (lemmaTokenIndex().get(lemmaId) || []).length; }
  /** occurrences in Qur'an order; limit caps how many token views are built (a very common lemma has thousands) */
  function getOccurrencesForLemma(lemmaId, limit) {
    const ids = lemmaTokenIndex().get(lemmaId) || [];
    return ids.slice(0, limit === undefined ? ids.length : limit).map(getToken).filter(Boolean);
  }

  /* ---------------- Sources / provenance ---------------- */

  function getSource(sourceId) { return SOURCE.get(sourceId) || null; }

  function sourceIdsForToken(ayah, form, lemma) {
    const ids = [];
    if (ayah.provenance && ayah.provenance.text) ids.push(ayah.provenance.text.source_id);
    else ids.push("TANZIL_TEXT");
    if (form && form.provenance && form.provenance.morphology) ids.push(form.provenance.morphology.source_id);
    if (lemma) lemma.sourceIds.forEach(id => ids.push(id));
    return Array.from(new Set(ids));
  }
  function sourceIdsForLemma(rec, root) {
    const ids = [];
    if (rec.provenance && rec.provenance.lemma) ids.push(rec.provenance.lemma.source_id);
    const g = GLOSS.get(rec.lemma_id);
    if (g && visibleState(displayState("gloss", g.status))) ids.push(g.provenance.source_id);
    if (rec.conjugation && visibleState(displayState("conjugation", rec.conjugation.status))) ids.push(rec.conjugation.provenance.source_id);
    if (root) {
      ids.push(rec.root.provenance.source_id);
      ids.push(ROOT.get(root.id).provenance.core_field.source_id);
    }
    return Array.from(new Set(ids));
  }

  /* ---------------- Search (index generated at build time; see scripts/build-dataset.js) ---------------- */

  const ARABIC_CHAR = QMNormalize.ARABIC_CHAR;
  const KIND_ORDER = { ayah: 0, surah: 1, token: 2, lemma: 3, root: 4 };
  const MAX_RESULTS = 20;

  /**
   * Arabic queries (marks, alef variants and letter spacing normalised) match words of the Qur'anic text
   * (via the normalised ayah text in the index), lemma forms, root letters and surah names. Latin queries
   * match lemma glosses and root core-fields in every language they exist in, plus surah names. "2:255"
   * style queries match an ayah. Only fields that are populated and visible under the display policy are
   * in the index. Deliberately simple substring matching, deterministic order (Qur'an order).
   */
  function searchVocabulary(query) {
    const q = (query || "").trim();
    if (!q) return [];
    const hits = [];               // [kind, id]
    const push = (kind, id, via) => hits.push([kind, id, via || null]);

    const ref = q.match(/^(\d{1,3})\s*[:.\/]\s*(\d{1,3})$/);
    if (ref && AYAH.has(`${Number(ref[1])}:${Number(ref[2])}`)) push("ayah", `${Number(ref[1])}:${Number(ref[2])}`);

    if (ARABIC_CHAR.test(q)) {
      const needle = QMNormalize.normalizeArabic(QMNormalize.collapseSpacedLetters(q));
      // "الرحمن" should also reach "رحمن": also try without a leading definite article.
      const bare = needle.length > 4 && needle.startsWith("ال") ? needle.slice(2) : null;
      const matches = text => text.includes(needle) || (bare !== null && text.includes(bare));
      IDX.ar.forEach(([key, kind, id]) => { if (matches(key)) push(kind, id); });
      if (needle.length > 0) {
        const phrase = needle.indexOf(" ") !== -1;
        let tokenHits = 0;
        for (let i = 0; i < IDX.ayah_norm.length && tokenHits < MAX_RESULTS; i++) {
          const a = IDX.ayah_norm[i], b = IDX.ayah_norm_alt[i];          // the two normalised variants of the ayah text
          if (!matches(a) && !matches(b)) continue;
          const ayah = D.ayahs[i];
          if (phrase) { push("ayah", ayah.ayah_id); tokenHits++; continue; }
          const wa = a.split(" "), wb = b.split(" ");
          for (let p = 0; p < wa.length && tokenHits < MAX_RESULTS; p++) {
            if (matches(wa[p]) || matches(wb[p])) { push("token", ayah.ayah_id + ":" + (p + 1)); tokenHits++; }
          }
        }
      }
    } else {
      const latin = QMNormalize.normalizeLatin(q);
      if (latin) IDX.latin.forEach(([key, kind, id]) => { if (key.includes(latin)) push(kind, id); });
      const lower = q.toLowerCase();
      IDX.latin_text.forEach(([text, kind, id]) => { if (text.includes(lower)) push(kind, id); });
      // full-ayah translations: published editions only, lowercase substring, Qur'an order
      if (lower.length >= 3) {
        let n = 0;
        for (let i = 0; i < D.ayahs.length && n < MAX_RESULTS; i++) {
          const id = D.ayahs[i].ayah_id;
          if (EDITIONS.some(ed => ed.published && ((T.texts[ed.translation_id] || {})[id] || "").toLowerCase().includes(lower))) { push("ayah", id, "translation"); n++; }
        }
      }
    }

    const seen = new Set();
    const results = [];
    hits.forEach(([kind, id, via]) => {
      const key = kind + ":" + id;
      if (seen.has(key)) return;
      seen.add(key);
      let r = null;
      if (kind === "token") { const token = getToken(id); if (token) r = { kind, token }; }
      else if (kind === "lemma") { const lemma = getLemma(id); if (lemma) r = { kind, lemma }; }
      else if (kind === "root") { const root = getRoot(id); if (root) r = { kind, root }; }
      else if (kind === "surah") { const surah = getSurah(id); if (surah) r = { kind, surah }; }
      else if (kind === "ayah") { const [s, a] = id.split(":"); const ayah = getAyah(s, a); if (ayah) r = via ? { kind, ayah, via } : { kind, ayah }; }
      if (r) results.push(r);
    });
    const order = r => r.via ? 5 : KIND_ORDER[r.kind];
    const tokenKey = r => r.kind === "token" ? r.token.surahId * 1e6 + r.token.ayahId * 1e3 + r.token.position
      : r.kind === "ayah" ? r.ayah.surahId * 1e6 + r.ayah.ayahId * 1e3 : 0;
    // A very common word must not crowd out the lemma / root / surah hits: structured results get up to 12 slots, words fill the rest.
    const byTranslation = results.filter(r => r.via).sort((a, b) => tokenKey(a) - tokenKey(b)).slice(0, 5);   // translation-text hits never crowd out lemma / root / surah hits
    const others = results.filter(r => r.kind !== "token" && !r.via).sort((a, b) => order(a) - order(b) || tokenKey(a) - tokenKey(b)).slice(0, 12);
    const words = results.filter(r => r.kind === "token").sort((a, b) => tokenKey(a) - tokenKey(b)).slice(0, MAX_RESULTS - others.length - byTranslation.length);
    return others.concat(words, byTranslation).sort((a, b) => order(a) - order(b) || tokenKey(a) - tokenKey(b));
  }

  /* ---------------- Filters ---------------- */

  /** Which POS filter values make sense to show, computed from the tokens actually in view — never a hard-coded list that could go stale. */
  function availablePosFilters(tokens) {
    const present = new Set(tokens.map(t => t.pos).filter(Boolean));
    return TAX.pos.map(p => p.id).filter(p => present.has(p));
  }

  /* ---------------- helpers ---------------- */

  function byQuranOrder(a, b) {
    if (a.surahId !== b.surahId) return a.surahId - b.surahId;
    if (a.ayahId !== b.ayahId) return a.ayahId - b.ayahId;
    return a.position - b.position;
  }

  return {
    listJuz, getJuz,
    listSurahs, getSurah, getJuzForSurah,
    listAyahsInSurah, getAyah, listTranslationEditions,
    getToken, getForm,
    getLemma, getOccurrencesForLemma, getOccurrenceCount, listLemmas,
    getRoot, listRoots,
    getSource,
    searchVocabulary,
    availablePosFilters,
    arabicTerms, listPos, posCss, displayState
  };
})();
