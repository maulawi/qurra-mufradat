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

  // Arabic grammatical terms shown alongside the (translated) field value —
  // e.g. "جمع تكسير" next to "Broken plural" / "Jamak Taksir". Never
  // translated, never duplicated per-language. `null` means no standard
  // short Arabic term applies (e.g. a primitive/jamid noun).
  const ARABIC_TERMS = {
    pluralType: { "jamʿ_mudhakkar_salim": "جمع مذكر سالم", "jamʿ_muannath_salim": "جمع مؤنث سالم", "jamʿ_taksir": "جمع تكسير" },
    definitenessState: { "maʿrifa": null, nakira: null },
    referenceClass: { alam: "علم", ishara: "اسم إشارة", mawsul: "اسم موصول", istifham: "اسم استفهام", pronoun: "ضمير" },
    derivationType: { jamid: "جامد", masdar: "مصدر", "ism_faʿil": "اسم فاعل", "ism_mafʿul": "اسم مفعول", sifa_mushabbaha: "صفة مشبهة" },
    declension: { mabni: "مبني", "muʿrab": "معرب" },
    form: { maadi: "ماضي", "mudariʿ": "مضارع", amr: "أمر" },
    functionHere: {
      jarr: "حرف جر", atf: "حرف عطف", "nafy_al_jins": "لا النافية للجنس", "nafy_simple": null,
      nahy: "نهي", "duʿa": null, "jazm_nafy": "جزم / نفي", istifham: null
    },
    rootType: {
      sahih_salim: "صحيح سالم", ajwaf: "أجوف", naqis: "ناقص",
      mudaaf: "مضعّف", lafif_mafruq: "لفيف مفروق", lafif_maqrun: "لفيف مقرون"
    },
    pos: { ism: "اسم", "fiʿl": "فعل", harf: "حرف" }
  };

  /** Translated label for an enum value, e.g. enumLabel('pluralType', 'jamʿ_taksir') → "Broken plural" / "Jamak Taksir". */
  function enumLabel(category, key) {
    if (key === null || key === undefined) return "—";
    return QMI18n.t(`enum.${category}.${key}`);
  }

  /** Same, but paired with its (untranslated) Arabic term when one exists: "Broken plural · جمع تكسير". */
  function enumLabelWithArabic(category, key) {
    if (key === null || key === undefined) return "—";
    const label = enumLabel(category, key);
    const ar = ARABIC_TERMS[category] && ARABIC_TERMS[category][key];
    return ar ? `${label} · ${ar}` : label;
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
    rows += fieldRow(QMI18n.t("verb.form"), enumLabelWithArabic("form", m.form));
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
    if (!lemma.conjugation) return "";
    const c = lemma.conjugation;
    if (c.generationMethod !== "stored_verified" && c.generationMethod !== "stored_verified_partial") {
      return `<p class="qm-muted" style="font-size:var(--qm-fs-xs)">${QMI18n.t("detail.conjugationWithheld")}</p>`;
    }
    const cell = (label, word) => word
      ? `<div class="qm-conjugation__cell"><span class="qm-conjugation__word qm-arabic">${word}</span><span class="qm-conjugation__label">${label}</span></div>`
      : `<div class="qm-conjugation__cell"><span class="qm-conjugation__word qm-muted">—</span><span class="qm-conjugation__label">${label}</span></div>`;
    const note = c.note ? `<p class="qm-muted" style="font-size:var(--qm-fs-xs);margin-top:var(--qm-space-2)">${QMI18n.pick(c.note)}</p>` : "";
    return `<div class="qm-conjugation">${cell(QMI18n.t("conjugation.perfective"), c.maadi)}${cell(QMI18n.t("conjugation.imperfective"), c.mudari)}${cell(QMI18n.t("conjugation.imperative"), c.amr)}</div>${note}`;
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

  function provenanceBlock(token, lemma) {
    const ids = new Set();
    Object.values(token.provenance || {}).forEach(id => ids.add(id));
    if (lemma && lemma.gloss && lemma.gloss.source) ids.add(lemma.gloss.source);
    if (lemma && lemma.conjugation && lemma.conjugation.source) ids.add(lemma.conjugation.source);
    if (lemma && lemma.root && lemma.root.provenance && lemma.root.provenance.coreField) ids.add(lemma.root.provenance.coreField);

    const rows = Array.from(ids).map(id => {
      const name = QMI18n.t(`source.${id}.name`);
      const status = QMI18n.t(`source.${id}.status`);
      return `<li><strong>${name}</strong><br><span class="qm-muted" style="font-size:var(--qm-fs-xs)">${status}</span></li>`;
    }).join("");
    return `<ul class="qm-stack" style="gap:var(--qm-space-3)">${rows}</ul>`;
  }

  function render(tokenId) {
    const token = QMData.getToken(tokenId);
    if (!token) return `<div class="qm-empty-state"><h3>${QMI18n.t("detail.wordNotFoundTitle")}</h3><p>${QMI18n.t("detail.wordNotFoundBody")}</p></div>`;
    const lemma = token.lemma;
    const posClass = `qm-badge--pos-${token.pos === "fiʿl" ? "fil" : token.pos}`;

    let morphologyRows = "";
    if (token.pos === "ism") morphologyRows = morphologyFieldsForIsm(token.morphology);
    else if (token.pos === "fiʿl") morphologyRows = morphologyFieldsForFil(token.morphology);
    else morphologyRows = morphologyFieldsForHarf(token.morphology);

    const conj = token.pos === "fiʿl" ? conjugationBlock(lemma) : "";

    const surahName = QMData.getSurah(token.surahId);
    const locationText = QMI18n.t("detail.locationTemplate", { surah: token.surahId, ayah: token.ayahId, position: token.position });
    const locationHtml = `<a href="#/surah/${token.surahId}/ayah/${token.ayahId}" data-route-link>${surahName ? surahName.nameEn : "Surah " + token.surahId} ${token.surahId}:${token.ayahId}</a>`;

    const posLabel = `${ARABIC_TERMS.pos[token.pos]} · ${QMI18n.t("enum.pos." + token.pos)}`;

    const html = `
      <div class="qm-worddetail__header">
        <div class="qm-worddetail__surface qm-arabic">${token.surfaceForm}</div>
        <div class="qm-worddetail__gloss">${lemma ? QMI18n.pick(lemma.gloss) : ""}</div>
        <div class="qm-worddetail__tags">
          <span class="qm-badge ${posClass}">${posLabel}</span>
          ${lemma && lemma.derivationType ? `<span class="qm-badge">${enumLabelWithArabic("derivationType", lemma.derivationType)}</span>` : ""}
        </div>
        <div class="qm-worddetail__location">${locationText} — ${locationHtml}</div>
      </div>

      ${expandSection("morph", QMI18n.t("detail.morphDetails"), `<dl class="qm-fieldlist">${morphologyRows}</dl>${conj}`, true)}

      ${expandSection("breakdown", QMI18n.t("detail.breakdown"), breakdownBlock(token), false)}

      ${lemma ? expandSection("links", QMI18n.t("detail.lemmaRoot"), `
        <div class="qm-stack">
          <div>
            <div class="qm-arabic" style="font-size:var(--qm-fs-lg)">${lemma.form}</div>
            <div class="qm-muted" style="font-size:var(--qm-fs-sm)">${QMI18n.pick(lemma.gloss)}</div>
          </div>
          ${lemma.root ? `<div>
            <div class="qm-arabic" style="font-size:var(--qm-fs-lg)">${lemma.root.letters.split("").join(" ")}</div>
            <div class="qm-muted" style="font-size:var(--qm-fs-sm)">${QMI18n.pick(lemma.root.coreField)}</div>
          </div>` : `<p class="qm-muted" style="font-size:var(--qm-fs-xs)">${QMI18n.t("detail.noRootRecorded")}</p>`}
          <div class="qm-worddetail__links">
            <a class="qm-btn qm-btn--secondary qm-btn--sm" href="#/lemma/${lemma.id}" data-route-link>${QMI18n.t("detail.viewLemma")}</a>
            ${lemma.root ? `<a class="qm-btn qm-btn--secondary qm-btn--sm" href="#/root/${lemma.root.id}" data-route-link>${QMI18n.t("detail.viewRoot")}</a>` : ""}
            <a class="qm-btn qm-btn--ghost qm-btn--sm" href="#/surah/${token.surahId}/ayah/${token.ayahId}" data-route-link>${QMI18n.t("detail.viewInQuran")}</a>
          </div>
        </div>`, false) : ""}

      ${expandSection("source", QMI18n.t("detail.sourceInfo"), provenanceBlock(token, lemma), false)}
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

  return { render, wireExpandables, ARABIC_TERMS };
})();
