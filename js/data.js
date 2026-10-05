/* ==========================================================================
   QURRA Mufradat al-Qur'an — Data access layer (repository)

   Every screen calls these functions, never QM_TOKENS / QM_LEMMAS / etc.
   directly. That is the whole point: when demoData.js is replaced with a
   real, chunked, Juz-based dataset (blueprint §12), only the bodies of
   these functions need to change — every screen, route, and component
   keeps working unmodified. See ARCHITECTURE.md "Future data replacement".
   ========================================================================== */

const QMData = (function () {

  /* ---------------- Juz ---------------- */

  function listJuz() {
    return Object.values(QM_JUZ).sort((a, b) => a.number - b.number);
  }

  function getJuz(juzNumber) {
    const juz = QM_JUZ[Number(juzNumber)];
    return juz ? { ...juz, surahs: juz.surahIds.map(getSurah).filter(Boolean) } : null;
  }

  /* ---------------- Surah ---------------- */

  function listSurahs() {
    return Object.values(QM_SURAHS).sort((a, b) => a.number - b.number);
  }

  function getSurah(surahNumber) {
    const s = QM_SURAHS[Number(surahNumber)];
    return s ? { ...s } : null;
  }

  /** Which Juz a surah's demo data lives under (first match — a surah can span several Juz in the real Mushaf). */
  function getJuzForSurah(surahNumber) {
    for (const juz of listJuz()) {
      if (juz.surahIds.includes(Number(surahNumber))) return juz;
    }
    return null;
  }

  /* ---------------- Ayah ---------------- */

  function listAyahsInSurah(surahNumber) {
    const surah = getSurah(surahNumber);
    if (!surah) return [];
    return surah.demoAyahs.map(ayahNumber => getAyah(surahNumber, ayahNumber)).filter(Boolean);
  }

  function getAyah(surahNumber, ayahNumber) {
    const key = `${Number(surahNumber)}:${Number(ayahNumber)}`;
    const a = QM_AYAHS[key];
    if (!a) return null;
    const tokens = a.tokenIds.map(getToken).filter(Boolean);
    const text = tokens.map(t => t.surfaceForm).join(" ");
    return { ...a, tokens, text };
  }

  /* ---------------- Token / Segment ---------------- */

  function getToken(tokenId) {
    const t = QM_TOKENS[tokenId];
    if (!t) return null;
    const stemSegment = t.segments.find(s => s.type === "stem");
    const lemma = stemSegment ? getLemma(stemSegment.lemmaId) : null;
    return { ...t, lemma };
  }

  /* ---------------- Lemma ---------------- */

  function getLemma(lemmaId) {
    const l = QM_LEMMAS[lemmaId];
    if (!l) return null;
    return { ...l, root: l.rootId ? getRoot(l.rootId) : null };
  }

  /** Every token occurrence whose stem points at this lemma, ordered by Qur'an position. */
  function getOccurrencesForLemma(lemmaId) {
    return Object.values(QM_TOKENS)
      .filter(t => t.segments.some(s => s.type === "stem" && s.lemmaId === lemmaId))
      .map(t => getToken(t.id))
      .sort(byQuranOrder);
  }

  /* ---------------- Root ---------------- */

  /**
   * Note: `lemmas` here are shallow (the raw QM_LEMMAS record, not run
   * through getLemma) deliberately — getLemma() itself calls getRoot() to
   * attach a lemma's root, and a root's lemmas each pointing back to a
   * fully-resolved root would recurse forever. A root page only needs each
   * lemma's own fields (form/gloss/pos/id), not its root a second time.
   */
  function getRoot(rootId) {
    const r = QM_ROOTS[rootId];
    if (!r) return null;
    const lemmas = Object.values(QM_LEMMAS).filter(l => l.rootId === rootId).map(l => ({ ...l }));
    return { ...r, lemmas };
  }

  function listRoots() {
    return Object.values(QM_ROOTS)
      .map(r => getRoot(r.id))
      .sort((a, b) => a.letters.localeCompare(b.letters, "ar"));
  }

  function listLemmas() {
    return Object.values(QM_LEMMAS)
      .map(l => getLemma(l.id))
      .sort((a, b) => a.form.localeCompare(b.form, "ar"));
  }

  /* ---------------- Source registry ---------------- */

  function getSource(sourceId) {
    return QM_SOURCE_REGISTRY[sourceId] || null;
  }

  /* ---------------- Search (lightweight, demo-dataset-only — see blueprint §9/§23) ---------------- */

  /**
   * Searches Arabic surface forms, lemma forms, and root letters.
   * Deliberately simple (substring match, no fuzzy/diacritic-insensitive
   * matching yet — that is real work the blueprint defers past V1). The
   * function signature is kept narrow on purpose so a real search index
   * can replace the body later without the sidebar/search UI changing.
   */
  function searchVocabulary(query) {
    const q = (query || "").trim();
    if (!q) return [];
    const stripDiacritics = s => (s || "").replace(/[ؐ-ًؚ-ٟۖ-ۜ۟-۪ۨ-ۭ]/g, "");
    const needle = stripDiacritics(q);
    const results = [];

    Object.values(QM_TOKENS).forEach(t => {
      if (stripDiacritics(t.surfaceForm).includes(needle)) {
        results.push({ kind: "token", token: getToken(t.id) });
      }
    });
    Object.values(QM_LEMMAS).forEach(l => {
      if (stripDiacritics(l.form).includes(needle) || l.gloss.en.toLowerCase().includes(q.toLowerCase())) {
        results.push({ kind: "lemma", lemma: getLemma(l.id) });
      }
    });
    Object.values(QM_ROOTS).forEach(r => {
      if (stripDiacritics(r.letters).includes(needle)) {
        results.push({ kind: "root", root: getRoot(r.id) });
      }
    });

    // De-duplicate lemma hits that came from both a token stem and the lemma form itself.
    const seen = new Set();
    return results.filter(r => {
      const key = r.kind + ":" + (r.token ? r.token.id : r.lemma ? r.lemma.id : r.root.id);
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    }).slice(0, 20);
  }

  /* ---------------- Filters (blueprint §15 — only filters the demo data actually supports) ---------------- */

  /** Which filter values make sense to show, computed from the tokens actually in view — never a hardcoded list that could go stale or offer an option with zero results. */
  function availablePosFilters(tokens) {
    const present = new Set(tokens.map(t => t.pos));
    return ["ism", "fiʿl", "harf"].filter(p => present.has(p));
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
    listAyahsInSurah, getAyah,
    getToken,
    getLemma, getOccurrencesForLemma, listLemmas,
    getRoot, listRoots,
    getSource,
    searchVocabulary,
    availablePosFilters
  };
})();
