/* ==========================================================================
   QURRA Mufradat al-Qur'an — Word detail content

   Builds the progressive-disclosure detail view for one token: always
   visible (surface form, gloss, اسم/فعل/حرف), then expandable sections
   for morphology, segmentation, lemma/root links, and source info — per
   the spec's five-level disclosure order. Noun / verb / particle each
   get their own morphology rendering, since their fields genuinely
   differ (blueprint §4).

   All learner-facing labels come from QMI18n.t()/QMI18n.pick() — see
   translations/en.js + translations/ms.js — so this file holds no
   hardcoded English or Malay strings. Arabic grammatical terminology
   (اسم، فعل، جمع تكسير، صحيح سالم...) is never translated: it lives in
   ARABIC_TERMS below, a single language-independent source shared by
   both UI languages, so the Arabic term can never drift between them.
   ========================================================================== */

const QMWordDetail = (function () {

  // Arabic grammatical terms shown alongside the (translated) field value — e.g. "جمع تكسير" next to
  // "Broken plural" / "Jamak Taksir". Never translated. Built from data/taxonomy.json (via QMData), not
  // hard-coded here; `null` means no standard short Arabic term applies (e.g. a primitive/jamid noun).
  const ARABIC_TERMS = QMData.arabicTerms();

  /** Translated label for an enum value, e.g. enumLabel('pluralType', 'jamʿ_taksir') → "Broken plural" / "Jamak Taksir". */
  function enumLabel(category, key) {
    if (key === null || key === undefined) return "—";
    return QMI18n.t(`enum.${category}.${key}`);
  }

  /** An Arabic grammatical term set in the Arabic face, inline within UI-language text (never translated). */
  function arSpan(text) {
    return `<span class="qm-ar-term" lang="ar">${text}</span>`;
  }

  /** Same, but paired with its (untranslated) Arabic term when one exists: "Broken plural · جمع تكسير". */
  function enumLabelWithArabic(category, key) {
    if (key === null || key === undefined) return "—";
    const label = enumLabel(category, key);
    const ar = ARABIC_TERMS[category] && ARABIC_TERMS[category][key];
    return ar ? `${label} · ${arSpan(ar)}` : label;
  }

  function expandSection(id, title, bodyHtml, openByDefault) {
    return `
      <div class="qm-expand${openByDefault ? " is-open" : ""}" data-expand="${id}">
        <button type="button" class="qm-expand__trigger" aria-expanded="${!!openByDefault}" aria-controls="qm-expand-body-${id}">
          <span>${title}</span>
          <span class="qm-expand__icon" aria-hidden="true">⌄</span>
        </button>
        <div class="qm-expand__body" id="qm-expand-body-${id}">${bodyHtml}</div>
      </div>`;
  }

  function fieldRow(label, value) {
    if (value === null || value === undefined || value === "—") return "";
    return `<dt>${label}</dt><dd>${value}</dd>`;
  }

  function morphologyFieldsForIsm(m) {
    let rows = "";
    rows += fieldRow(QMI18n.t("fields.number"), enumLabel("number", m.number));
    if (m.pluralType) rows += fieldRow(QMI18n.t("noun.pluralType"), enumLabelWithArabic("pluralType", m.pluralType));
    rows += fieldRow(QMI18n.t("fields.gender"), enumLabel("gender", m.gender));
    if (m.definiteness) {
      const state = enumLabel("definitenessState", m.definiteness.state);
      const cause = m.definiteness.cause ? ` (${QMI18n.t("enum.definitenessCause." + m.definiteness.cause)})` : "";
      rows += fieldRow(QMI18n.t("noun.definiteness"), state + cause);
    }
    if (m.referenceClass) rows += fieldRow(QMI18n.t("noun.referenceClass"), enumLabelWithArabic("referenceClass", m.referenceClass));
    if (m.declension) rows += fieldRow(QMI18n.t("noun.declension"), enumLabelWithArabic("declension", m.declension));
    return rows;
  }

  function morphologyFieldsForFil(m) {
    let rows = "";
    rows += fieldRow(QMI18n.t("verb.form"), enumLabelWithArabic("form", m.aspect));
    rows += fieldRow(QMI18n.t("verb.person"), m.person ? QMI18n.t("person." + m.person) : "—");
    rows += fieldRow(QMI18n.t("fields.number"), enumLabel("number", m.number));
    rows += fieldRow(QMI18n.t("fields.gender"), enumLabel("gender", m.gender));
    rows += fieldRow(QMI18n.t("verb.voice"), enumLabel("voice", m.voice));
    return rows;
  }

  function morphologyFieldsForHarf(m) {
    return fieldRow(QMI18n.t("particle.function"), enumLabelWithArabic("functionHere", m.functionHere));
  }

  function conjugationBlock(lemma) {
    if (lemma.conjugationWithheld) {
      return `<p class="qm-muted" style="font-size:var(--qm-fs-xs)">${QMI18n.t("detail.conjugationWithheld")}</p>`;
    }
    const c = lemma.conjugation;
    if (!c) return "";
    const cell = (label, word) => word
      ? `<div class="qm-conjugation__cell"><span class="qm-conjugation__word qm-arabic">${word}</span><span class="qm-conjugation__label">${label}</span></div>`
      : `<div class="qm-conjugation__cell"><span class="qm-conjugation__word qm-muted">—</span><span class="qm-conjugation__label">${label}</span></div>`;
    const note = c.note ? `<p class="qm-muted" style="font-size:var(--qm-fs-xs);margin-top:var(--qm-space-2)">${QMI18n.pick(c.note)}</p>` : "";
    // Provisional (unreviewed) conjugations are shown, but never without a visible label.
    const badge = c.state === "show_with_badge" ? `<p class="qm-muted" style="font-size:var(--qm-fs-xs);margin-top:var(--qm-space-2)"><span class="qm-badge qm-badge--provisional">${QMI18n.t("rootState.provisionalBadge")}</span> ${QMI18n.t("status.conjugationProvisional")}</p>` : "";
    return `<div class="qm-conjugation">${cell(QMI18n.t("conjugation.perfective"), c.maadi)}${cell(QMI18n.t("conjugation.imperfective"), c.mudari)}${cell(QMI18n.t("conjugation.imperative"), c.amr)}</div>${badge}${note}`;
  }

  function segmentChip(seg) {
    const cls = `qm-segment qm-segment--${seg.type}`;
    let label = seg.type === "stem" ? "stem" : (seg.function ? enumLabel("segmentFunction", seg.function) : seg.type);
    if (seg.type === "enclitic" && seg.pronounFeatures) {
      const pf = seg.pronounFeatures;
      const personPhrase = pf.person ? QMI18n.t("person." + pf.person) : "";
      const numberPart = pf.number ? " · " + enumLabel("number", pf.number) : "";
      label = QMI18n.t("detail.pronounTemplate", { person: personPhrase }) + numberPart;
    }
    return `<div class="${cls}"><span class="qm-segment__surface qm-arabic">${seg.surface}</span><span class="qm-segment__label">${label}</span></div>`;
  }

  function breakdownBlock(token) {
    if (token.segments.length <= 1) return `<p class="qm-muted">${QMI18n.t("detail.singleUnit")}</p>`;
    const chips = token.segments.map((seg, i) => {
      const chip = segmentChip(seg);
      return i < token.segments.length - 1 ? chip + `<span class="qm-segment__plus" aria-hidden="true">+</span>` : chip;
    }).join("");
    const note = token.segmentationNote ? `<p class="qm-muted" style="font-size:var(--qm-fs-xs);margin-top:var(--qm-space-2)">${QMI18n.pick(token.segmentationNote)}</p>` : "";
    return `<div class="qm-breakdown">${chips}</div>${note}`;
  }

  function provenanceBlock(token) {
    const rows = token.sourceIds.map(id => {
      const src = QMData.getSource(id);
      const name = QMI18n.t(`source.${id}.name`);
      const status = QMI18n.t(`source.${id}.status`);
      const licence = src ? `${QMI18n.t("detail.licenceLabel")}: ${QMI18n.t("licenceStatus." + src.licence_status)}` : "";
      return `<li><strong>${name}</strong><br><span class="qm-muted" style="font-size:var(--qm-fs-xs)">${licence}${licence ? " — " : ""}${status}</span></li>`;
    }).join("");
    return `<ul class="qm-stack" style="gap:var(--qm-space-3)">${rows}</ul>`;
  }

  /** The root part of the lemma/root section: a root only when the display policy allows it, otherwise an honest note. */
  function rootBlock(lemma) {
    if (lemma.root) {
      const badge = lemma.rootState === "show_with_badge"
        ? `<div><span class="qm-badge qm-badge--provisional">${QMI18n.t("rootState.provisionalBadge")}</span> <span class="qm-muted" style="font-size:var(--qm-fs-xs)">${QMI18n.t("rootState.provisionalNote")}</span></div>` : "";
      return `<div>
            <div class="qm-arabic" style="font-size:var(--qm-fs-lg)">${lemma.root.display}</div>
            <div class="qm-muted" style="font-size:var(--qm-fs-sm)">${QMI18n.pick(lemma.root.coreField)}</div>
            ${badge}
          </div>`;
    }
    if (lemma.rootState === "under_review") return `<p class="qm-muted" style="font-size:var(--qm-fs-xs)">${QMI18n.t("rootState.underReview")}</p>`;
    if (lemma.rootState === "not_applicable") return `<p class="qm-muted" style="font-size:var(--qm-fs-xs)">${QMI18n.t("rootState.notApplicable")}</p>`;
    return "";
  }

  /**
   * A word of the Qur'an that has no word analysis yet (the large majority until a cleared morphology
   * source exists). Shows only what is known (the canonical text and its location) and says plainly that
   * the analysis is not available: no placeholder part of speech, lemma or root is shown.
   */
  function renderUnanalysed(token) {
    const surahName = QMData.getSurah(token.surahId);
    const locationText = QMI18n.t("detail.locationTemplate", { surah: token.surahId, ayah: token.ayahId, position: token.position });
    const locationHtml = `<a href="#/surah/${token.surahId}/ayah/${token.ayahId}" data-route-link>${surahName ? surahName.nameEn : "Surah " + token.surahId} ${token.surahId}:${token.ayahId}</a>`;
    return `
      <div class="qm-worddetail__header">
        <div class="qm-worddetail__surface qm-arabic" id="qm-detail-title" lang="ar">${token.surfaceForm}</div>
        <div class="qm-worddetail__location">${locationText} — ${locationHtml}</div>
      </div>
      <div class="qm-card" style="margin-bottom:var(--qm-space-4)">
        <p style="margin:0"><strong>${QMI18n.t("detail.notAnalysedTitle")}</strong></p>
        <p class="qm-muted" style="margin:var(--qm-space-2) 0 0">${QMI18n.t("detail.notAnalysedBody")}</p>
      </div>
      ${expandSection("source", QMI18n.t("detail.sourceInfo"), provenanceBlock(token), false)}
    `;
  }

  /** Links to lemmas that are only hints (candidates) or other possible readings; the lemma page itself says what it is. */
  function lemmaHints(ids, label) {
    const items = (ids || []).map(id => QMData.getLemma(id)).filter(Boolean).map(l =>
      `<li><a href="#/lemma/${l.id}" data-route-link><span class="qm-arabic" lang="ar">${l.form}</span></a> <span class="qm-muted" style="font-size:var(--qm-fs-xs)">${QMI18n.pick(l.gloss)}</span></li>`).join("");
    return items ? `<div style="margin-top:var(--qm-space-3)"><p class="qm-muted" style="margin:0 0 var(--qm-space-1);font-size:var(--qm-fs-xs)">${label}</p><ul class="qm-stack" style="gap:var(--qm-space-1)">${items}</ul></div>` : "";
  }

  /**
   * A word that has an analysis record but no asserted analysis: the record says so (unresolved, or context-dependent with no
   * default reading). Shows the text, the location, what is open and why, and any candidate lemmas as hints. Nothing is guessed.
   */
  function renderUnresolved(token) {
    const surahName = QMData.getSurah(token.surahId);
    const locationText = QMI18n.t("detail.locationTemplate", { surah: token.surahId, ayah: token.ayahId, position: token.position });
    const locationHtml = `<a href="#/surah/${token.surahId}/ayah/${token.ayahId}" data-route-link>${surahName ? surahName.nameEn : "Surah " + token.surahId} ${token.surahId}:${token.ayahId}</a>`;
    const ctxt = token.resolution === "context_dependent";
    return `
      <div class="qm-worddetail__header">
        <div class="qm-worddetail__surface qm-arabic" id="qm-detail-title" lang="ar">${token.surfaceForm}</div>
        <div class="qm-worddetail__status" style="margin:var(--qm-space-2) 0"><span class="qm-badge qm-badge--provisional" data-analysis-status="${token.status}" data-resolution="${token.resolution}">${QMI18n.t("detail.resolution." + (ctxt ? "context_dependent" : "unresolved"))}</span></div>
        <div class="qm-worddetail__location">${locationText} — ${locationHtml}</div>
      </div>
      <div class="qm-card" style="margin-bottom:var(--qm-space-4)" data-unresolved>
        <p style="margin:0"><strong>${QMI18n.t(ctxt ? "detail.contextTitle" : "detail.unresolvedTitle")}</strong></p>
        <p class="qm-muted" style="margin:var(--qm-space-2) 0 0">${QMI18n.t(ctxt ? "detail.contextBody" : "detail.unresolvedBody")}</p>
        ${token.segmentationNote ? `<p class="qm-muted" style="margin:var(--qm-space-2) 0 0;font-size:var(--qm-fs-xs)">${QMI18n.pick(token.segmentationNote)}</p>` : ""}
        ${lemmaHints(token.candidates, QMI18n.t("detail.candidatesLabel"))}
        <p class="qm-muted" style="margin:var(--qm-space-3) 0 0;font-size:var(--qm-fs-xs)">${QMI18n.t("detail.sourceReviewNote")}</p>
      </div>
      ${expandSection("source", QMI18n.t("detail.sourceInfo"), provenanceBlock(token), false)}
    `;
  }

  function render(tokenId) {
    const token = QMData.getToken(tokenId);
    if (!token) return `<div class="qm-empty-state"><h3 id="qm-detail-title">${QMI18n.t("detail.wordNotFoundTitle")}</h3><p>${QMI18n.t("detail.wordNotFoundBody")}</p></div>`;
    if (!token.analysed) return renderUnanalysed(token);
    if (token.status === "unresolved") return renderUnresolved(token);
    const lemma = token.lemma;
    const posClass = `qm-badge--pos-${QMData.posCss(token.pos)}`;

    let morphologyRows = "";
    if (token.pos === "noun") morphologyRows = morphologyFieldsForIsm(token.morphology);
    else if (token.pos === "verb") morphologyRows = morphologyFieldsForFil(token.morphology);
    else morphologyRows = morphologyFieldsForHarf(token.morphology);

    const conj = token.pos === "verb" && lemma ? conjugationBlock(lemma) : "";

    const surahName = QMData.getSurah(token.surahId);
    const locationText = QMI18n.t("detail.locationTemplate", { surah: token.surahId, ayah: token.ayahId, position: token.position });
    const locationHtml = `<a href="#/surah/${token.surahId}/ayah/${token.ayahId}" data-route-link>${surahName ? surahName.nameEn : "Surah " + token.surahId} ${token.surahId}:${token.ayahId}</a>`;

    const posLabel = `${arSpan(ARABIC_TERMS.pos[token.pos])} · ${QMI18n.t("enum.pos." + token.pos)}`;

    const html = `
      <div class="qm-worddetail__header">
        <div class="qm-worddetail__surface qm-arabic" id="qm-detail-title" lang="ar">${token.surfaceForm}</div>
        <div class="qm-worddetail__gloss">${lemma ? QMI18n.pick(lemma.gloss) : ""}</div>
        <div class="qm-worddetail__tags">
          <span class="qm-badge ${posClass}">${posLabel}</span>
          ${lemma && lemma.derivationType ? `<span class="qm-badge">${enumLabelWithArabic("derivationType", lemma.derivationType)}</span>` : ""}
        </div>
        <div class="qm-worddetail__status" style="margin:var(--qm-space-2) 0"><span class="qm-badge qm-badge--provisional" data-analysis-status="${token.status}">${QMI18n.t("detail.status." + token.status)}</span> <span class="qm-muted" style="font-size:var(--qm-fs-xs)">${QMI18n.t("detail.basis." + token.analysisBasis)}</span>
          ${token.resolution && token.resolution !== "confident" ? ` <span class="qm-badge" data-resolution="${token.resolution}">${QMI18n.t("detail.resolution." + token.resolution)}</span>` : ""}
          ${token.sourceReviewRequired ? `<div class="qm-muted" style="font-size:var(--qm-fs-xs);margin-top:var(--qm-space-1)">${QMI18n.t("detail.sourceReviewNote")}</div>` : ""}
          ${token.alternatives && token.alternatives.length ? lemmaHints(token.alternatives, QMI18n.t("detail.alternativesLabel")) : ""}</div>
        <div class="qm-worddetail__location">${locationText} — ${locationHtml}</div>
      </div>

      ${expandSection("morph", QMI18n.t("detail.morphDetails"), `<dl class="qm-fieldlist">${morphologyRows}</dl>${conj}`, true)}

      ${expandSection("breakdown", QMI18n.t("detail.breakdown"), breakdownBlock(token), false)}

      ${expandSection("links", QMI18n.t("detail.lemmaRoot"), lemma ? `
        <div class="qm-stack">
          <div>
            <div class="qm-arabic" style="font-size:var(--qm-fs-lg)">${lemma.form}</div>
            <div class="qm-muted" style="font-size:var(--qm-fs-sm)">${QMI18n.pick(lemma.gloss)}</div>
            ${lemma.learnerNote ? `<div class="qm-muted" style="font-size:var(--qm-fs-xs);margin-top:var(--qm-space-1)">${QMI18n.pick(lemma.learnerNote)}</div>` : ""}
          </div>
          ${rootBlock(lemma)}
          <div class="qm-worddetail__links">
            <a class="qm-btn qm-btn--secondary qm-btn--sm" href="#/lemma/${lemma.id}" data-route-link>${QMI18n.t("detail.viewLemma")}</a>
            ${lemma.root ? `<a class="qm-btn qm-btn--secondary qm-btn--sm" href="#/root/${lemma.root.id}" data-route-link>${QMI18n.t("detail.viewRoot")}</a>` : ""}
            <a class="qm-btn qm-btn--ghost qm-btn--sm" href="#/surah/${token.surahId}/ayah/${token.ayahId}" data-route-link>${QMI18n.t("detail.viewInQuran")}</a>
          </div>
        </div>` : `<p class="qm-muted">${QMI18n.t("detail.lemmaUnresolved")}</p>`, false)}

      ${expandSection("source", QMI18n.t("detail.sourceInfo"), provenanceBlock(token), false)}
    `;
    return html;
  }

  function wireExpandables(container) {
    container.querySelectorAll(".qm-expand__trigger").forEach(trigger => {
      trigger.addEventListener("click", () => {
        const section = trigger.closest(".qm-expand");
        const open = section.classList.toggle("is-open");
        trigger.setAttribute("aria-expanded", String(open));
      });
    });
  }

  return { render, wireExpandables, ARABIC_TERMS, arSpan };
})();
