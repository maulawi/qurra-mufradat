/* ==========================================================================
   QURRA Mufradat al-Qur'an — Screen renderers

   Each render* function returns { html, mount } — `html` is inserted into
   #qm-view by router.js, and `mount(viewEl)` (optional) runs afterward to
   wire up anything that plain anchors/hash-navigation can't do on their
   own (the filter bar, mostly). Navigation itself needs no JS: every link
   here is a real <a href="#/..."> and the browser's native hash handling
   plus router.js's hashchange listener do the rest.

   These functions only ever call QMData / QMFilters / QMWordDetail — never
   the raw dataset directly. That is what makes it possible to
   replace the generated dataset later without touching this file (ARCHITECTURE.md).

   Every learner-facing string here comes from QMI18n.t() (UI chrome) or
   QMI18n.pick() (multilingual data fields like gloss/coreField/translation
   — see DATA_SCHEMA.md §12). Surah proper names (nameAr/nameEn) and Arabic
   grammatical terms are never translated.
   ========================================================================== */

const QMRender = (function () {

  /* ---------------- small shared helpers ---------------- */

  function esc(s) {
    return String(s === null || s === undefined ? "" : s)
      .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  }

  function crumbs(items) {
    // items: [{label, href}] — last item has no href (current page)
    const parts = items.map((it, i) => {
      const isLast = i === items.length - 1;
      const label = esc(it.label);
      return isLast
        ? `<span aria-current="page">${label}</span>`
        : `<a href="${it.href}" data-route-link>${label}</a>`;
    });
    return `<nav class="qm-breadcrumbs" aria-label="Breadcrumb">${parts.join('<span class="qm-breadcrumbs__sep" aria-hidden="true">/</span>')}</nav>`;
  }

  function pageHeader({ eyebrow, title, titleAr, breadcrumbs, meta }) {
    return `
      <div class="qm-page-header">
        ${breadcrumbs ? crumbs(breadcrumbs) : ""}
        ${eyebrow ? `<div class="qm-page-header__eyebrow">${esc(eyebrow)}</div>` : ""}
        <h1>${titleAr ? `<span class="qm-arabic">${titleAr}</span> — ` : ""}${esc(title)}</h1>
        ${meta ? `<p class="qm-muted">${meta}</p>` : ""}
      </div>`;
  }

  function demoNote(html) {
    return `<div class="qm-demo-note"><span aria-hidden="true">ⓘ</span><span>${html}</span></div>`;
  }

  function emptyState(title, body, actionHtml) {
    return `<div class="qm-empty-state"><h3>${esc(title)}</h3><p>${body}</p>${actionHtml || ""}</div>`;
  }

  function posBadge(pos) {
    const cls = `qm-badge--pos-${QMData.posCss(pos)}`;
    const ar = QMWordDetail.ARABIC_TERMS.pos[pos] || "";
    return `<span class="qm-badge ${cls}">${QMWordDetail.arSpan(ar)} · ${QMI18n.t("enum.pos." + pos)}</span>`;
  }

  function notFound(kind) {
    const kindLabel = QMI18n.t("notfound.kind." + (kind || "page")) || QMI18n.t("notfound.kind.page");
    return {
      html: `<div class="qm-view">${pageHeader({ eyebrow: QMI18n.t("notfound.eyebrow"), title: QMI18n.t("notfound.title"), breadcrumbs: [{ label: QMI18n.t("nav.home"), href: "#/home" }, { label: QMI18n.t("notfound.title") }] })}
        ${emptyState(QMI18n.t("notfound.bodyTitleTemplate", { kind: kindLabel }),
          QMI18n.t("notfound.body"),
          `<a class="qm-btn qm-btn--primary" href="#/home" data-route-link>${QMI18n.t("notfound.backHome")}</a>`)}</div>`
    };
  }

  /* ---------------- Home ---------------- */

  function renderHome() {
    const juzList = QMData.listJuz();
    const analysedAyahs = QMData.listSurahs().reduce((n, x) => n + x.analysedAyahs.length, 0);

    const juzGrid = juzList.map(j => `
      <a href="#/juz/${j.number}" class="qm-card qm-card--interactive qm-juz-card" data-route-link>
        <span class="qm-juz-card__number">${j.number}</span>
        <span class="qm-juz-card__ar qm-arabic">${j.nameAr}</span>
        ${j.analysedAyahCount > 0
          ? `<span class="qm-badge qm-badge--demo">${QMI18n.t("juzCard.analysed")}</span>`
          : `<span class="qm-badge qm-muted">${QMI18n.t("juzCard.textOnly")}</span>`}
      </a>`).join("");

    const html = `
      <section class="qm-hero">
        <div class="qm-hero__content">
          <div class="qm-hero__arabic qm-arabic">مفردات القرآن</div>
          <h1 class="qm-hero__tagline">${QMI18n.t("home.tagline")}</h1>
          <p class="qm-hero__desc">${QMI18n.t("home.description")}</p>
          <div class="qm-hero__actions">
            <a class="qm-btn qm-btn--primary" href="#/juz/1" data-route-link>${QMI18n.t("home.ctaExplore")}</a>
            <a class="qm-btn qm-btn--secondary" href="#/roots" data-route-link>${QMI18n.t("home.ctaBrowse")}</a>
          </div>
        </div>
      </section>

      ${demoNote(QMI18n.t("home.demoNoteTemplate", { analysed: analysedAyahs }))}

      <h2>${QMI18n.t("home.browseByJuz")}</h2>
      <div class="qm-grid">${juzGrid}</div>
    `;
    return { html };
  }

  /* ---------------- Juz ---------------- */

  function juzMeta(juz) {
    const first = QMData.getSurah(juz.start.surah);
    return QMI18n.t("juz.startsAtTemplate", { surah: first ? first.nameEn : juz.start.surah, ayah: juz.start.ayah });
  }

  function renderJuz(juzNumber) {
    const juz = QMData.getJuz(juzNumber);
    if (!juz) return notFound("juz");

    const header = pageHeader({
      eyebrow: QMI18n.t("juz.eyebrow"),
      title: QMI18n.t("juz.titleTemplate", { n: juz.number }),
      titleAr: juz.nameAr,
      breadcrumbs: [{ label: QMI18n.t("nav.home"), href: "#/home" }, { label: QMI18n.t("juz.titleTemplate", { n: juz.number }) }],
      meta: juzMeta(juz)
    });

    let body;
    if (!juz.surahs.length) {
      body = emptyState(
        QMI18n.t("juz.notAvailableTitle"),
        QMI18n.t("juz.notAvailableBody"),
        `<div class="qm-row" style="justify-content:center">
          <a class="qm-btn qm-btn--primary" href="#/juz/1" data-route-link>${QMI18n.t("juz.viewJuz1")}</a>
          <a class="qm-btn qm-btn--secondary" href="#/juz/30" data-route-link>${QMI18n.t("juz.viewJuz30")}</a>
        </div>`
      );
    } else {
      body = `<h2>${QMI18n.t("juz.surahsInJuz")}</h2><div class="qm-stack">${juz.surahs.map(s => surahCard(s, juz.number)).join("")}</div>`;
    }

    return { html: `${header}${body}` };
  }

  /* ---------------- Surah list ---------------- */

  // juzNumber (optional): keeps the Juz context in the link, via #/juz/:n/surah/:m.
  function surahCard(s, juzNumber) {
    const href = juzNumber ? `#/juz/${juzNumber}/surah/${s.number}` : `#/surah/${s.number}`;
    return `
      <a href="${href}" class="qm-card qm-card--interactive qm-surah-card" data-route-link>
        <span class="qm-surah-card__num">${s.number}</span>
        <span class="qm-surah-card__names">
          <span class="qm-surah-card__ar qm-arabic">${s.nameAr}</span>
          <span class="qm-surah-card__en">${esc(s.nameEn)} · ${QMI18n.t("enum.revelation." + s.revelation)}</span>
        </span>
        <span class="qm-surah-card__meta">${s.analysedAyahs.length ? QMI18n.t("surahCard.ayahsAnalysedTemplate", { total: s.ayahCount, analysed: s.analysedAyahs.length }) : QMI18n.t("surahCard.ayahsTemplate", { total: s.ayahCount })}</span>
      </a>`;
  }

  function renderSurahs() {
    const surahs = QMData.listSurahs();
    const header = pageHeader({
      eyebrow: QMI18n.t("surahs.eyebrow"),
      title: QMI18n.t("surahs.title"),
      breadcrumbs: [{ label: QMI18n.t("nav.home"), href: "#/home" }, { label: QMI18n.t("surahs.title") }]
    });
    const note = demoNote(QMI18n.t("surahs.noteTemplate", { list: surahs.filter(s => s.analysedAyahs.length).map(s => s.nameEn).join(", ") }));
    const list = `<div class="qm-stack">${surahs.map(s => surahCard(s)).join("")}</div>`;
    return { html: `${header}${note}${list}` };
  }

  /* ---------------- Surah / Ayah ---------------- */

  function wordAnchor(t) {
    return `<a href="#/word/${t.id}" data-route-link class="qm-word qm-arabic" data-token="${t.id}" data-pos="${t.pos || ""}">${t.surfaceForm}</a>`;
  }

  function ayahBlock(ayah) {
    const words = ayah.tokens.map(wordAnchor).join(" ");
    return `
      <div class="qm-ayah" id="ayah-${ayah.ayahId}" data-ayah="${ayah.ayahId}">
        <p class="qm-ayah__text">${words}<span class="qm-ayah__marker">${ayah.ayahId}</span></p>
        ${ayah.translation ? `<details class="qm-ayah__translation-toggle">
          <summary class="qm-muted" style="cursor:pointer">${QMI18n.t("surah.showTranslation")}</summary>
          <p class="qm-muted">${esc(QMI18n.pick(ayah.translation))}</p>
          <p class="qm-muted" style="font-size:var(--qm-fs-xs)">${QMI18n.t("surah.translationNote")}</p>
        </details>` : ""}
      </div>`;
  }

  function applyFilterToWords(viewEl, filter) {
    viewEl.querySelectorAll(".qm-word[data-pos]").forEach(el => {
      el.classList.remove("qm-word--dimmed", "qm-word--match");
      if (filter && filter !== "all") {
        el.classList.add(el.getAttribute("data-pos") === filter ? "qm-word--match" : "qm-word--dimmed");
      }
    });
  }

  function renderSurah(surahNumber, opts) {
    opts = opts || {};
    const surah = QMData.getSurah(surahNumber);
    if (!surah) return notFound("surah");

    // Optional Juz context (#/juz/:n/surah/:m): only valid if that Juz really lists this surah.
    let juz = null;
    if (opts.juz !== undefined && opts.juz !== null) {
      juz = QMData.getJuz(opts.juz);
      if (!juz || !juz.surahIds.includes(surah.number)) return notFound("surah");
    }
    const ayahTarget = opts.highlightAyah !== undefined && opts.highlightAyah !== null ? Number(opts.highlightAyah) : null;

    const ayahs = QMData.listAyahsInSurah(surahNumber);
    const allTokens = ayahs.flatMap(a => a.tokens);

    const home = { label: QMI18n.t("nav.home"), href: "#/home" };
    const breadcrumbs = juz
      ? [home, { label: QMI18n.t("juz.titleTemplate", { n: juz.number }), href: `#/juz/${juz.number}` }, { label: surah.nameEn }]
      : [home, { label: QMI18n.t("surahs.title"), href: "#/surahs" }, { label: surah.nameEn }];

    const header = pageHeader({
      eyebrow: "SURAH " + surah.number,
      title: surah.nameEn,
      titleAr: surah.nameAr,
      breadcrumbs,
      meta: surah.analysedAyahs.length
        ? QMI18n.t("surah.metaAnalysedTemplate", { revelation: QMI18n.t("enum.revelation." + surah.revelation), ayahCount: surah.ayahCount, analysedCount: surah.analysedAyahs.length })
        : QMI18n.t("surah.metaTemplate", { revelation: QMI18n.t("enum.revelation." + surah.revelation), ayahCount: surah.ayahCount })
    });

    // A specific ayah was requested but this demo has no data for it: say so
    // plainly instead of silently showing the rest of the surah.
    if (ayahTarget !== null && !(Number.isInteger(ayahTarget) && ayahTarget >= 1 && ayahTarget <= surah.ayahCount)) {
      const surahHref = juz ? `#/juz/${juz.number}/surah/${surah.number}` : `#/surah/${surah.number}`;
      return {
        html: `${header}${emptyState(
          QMI18n.t("surah.ayahMissingTitle", { ayah: ayahTarget }),
          esc(QMI18n.t("surah.ayahMissingBody", { surah: surah.nameEn, count: surah.ayahCount })),
          `<a class="qm-btn qm-btn--primary" href="${surahHref}" data-route-link>${esc(QMI18n.t("surah.viewSurahTemplate", { surah: surah.nameEn }))}</a>`
        )}`
      };
    }

    const note = surah.analysedAyahs.length
      ? demoNote(QMI18n.t("surah.demoNoteTemplate", { list: surah.analysedAyahs.join(", ") }))
      : demoNote(QMI18n.t("surah.textOnlyNote"));

    const html = `
      ${header}
      ${note}
      <div id="qm-filterbar" class="qm-filterbar" role="group" aria-label="${QMI18n.t("filters.groupLabel")}"></div>
      <div id="qm-ayahs">${ayahs.map(a => ayahBlock(a)).join("")}</div>
    `;

    function mount(viewEl) {
      const filterBarEl = viewEl.querySelector("#qm-filterbar");
      let currentFilter = QMState.getState().selectedFilter || "all";

      function refreshBar() {
        QMFilters.renderFilterBar(filterBarEl, allTokens, currentFilter, onChange);
      }
      function onChange(newFilter) {
        currentFilter = newFilter;
        QMState.setFilter(newFilter);
        applyFilterToWords(viewEl, currentFilter);
        refreshBar();
      }
      refreshBar();
      applyFilterToWords(viewEl, currentFilter);

      if (ayahTarget !== null) {
        const target = viewEl.querySelector(`#ayah-${ayahTarget}`);
        if (target) {
          target.scrollIntoView({ block: "center", behavior: "auto" }); // instant: smooth-scrolling a 50,000 px page takes seconds
        }
      }
    }

    // keepScroll: this route scrolls to its own target, so the router must not reset to the top.
    return { html, mount, keepScroll: ayahTarget !== null };
  }

  /* ---------------- Roots ---------------- */

  function renderRoots() {
    const roots = QMData.listRoots();
    const header = pageHeader({
      eyebrow: QMI18n.t("roots.eyebrow"),
      title: QMI18n.t("roots.title"),
      breadcrumbs: [{ label: QMI18n.t("nav.home"), href: "#/home" }, { label: QMI18n.t("roots.title") }]
    });
    const note = demoNote(QMI18n.t("roots.demoNoteTemplate", { count: roots.length }) + " " + QMI18n.t("roots.provisionalNote"));
    const rows = roots.map(r => `
      <a href="#/root/${r.id}" class="qm-card qm-card--interactive qm-rootlemma-card" data-route-link>
        <span class="qm-rootlemma-card__ar">${r.display}</span>
        <span class="qm-rootlemma-card__gloss">${esc(QMI18n.pick(r.coreField))}</span>
      </a>`).join("");
    return { html: `${header}${note}<div class="qm-stack">${rows}</div>` };
  }

  function renderRoot(rootId) {
    const root = QMData.getRoot(rootId);
    if (!root) return notFound("root");

    const header = pageHeader({
      eyebrow: QMI18n.t("root.eyebrow"),
      title: root.display,
      breadcrumbs: [{ label: QMI18n.t("nav.home"), href: "#/home" }, { label: QMI18n.t("roots.title"), href: "#/roots" }, { label: root.display }]
    });

    const rootTypeAr = QMWordDetail.ARABIC_TERMS.rootType[root.rootType];
    const rootTypeLabel = `${QMI18n.t("enum.rootType." + root.rootType)}${rootTypeAr ? " · " + QMWordDetail.arSpan(rootTypeAr) : ""}`;

    const headword = `
      <div class="qm-headword qm-card">
        <div class="qm-headword__arabic">${root.display}</div>
        <div class="qm-headword__gloss">${esc(QMI18n.pick(root.coreField))}</div>
        <div style="margin-top:var(--qm-space-3)"><span class="qm-badge">${rootTypeLabel}</span>${root.state === "show_with_badge" ? ` <span class="qm-badge qm-badge--provisional">${QMI18n.t("rootState.provisionalBadge")}</span>` : ""}</div>
        ${root.state === "show_with_badge" ? `<p class="qm-muted" style="font-size:var(--qm-fs-xs);margin:var(--qm-space-2) 0 0">${QMI18n.t("rootState.provisionalNote")}</p>` : ""}
      </div>`;

    const lemmaRows = root.lemmas.map(l => `
      <a href="#/lemma/${l.id}" class="qm-rootlemma-card" data-route-link>
        <span class="qm-rootlemma-card__ar">${l.form}</span>
        <span class="qm-rootlemma-card__gloss">${esc(QMI18n.pick(l.gloss))}</span>
        ${posBadge(l.pos)}
      </a>`).join("");

    const occurrences = root.lemmas.flatMap(l => QMData.getOccurrencesForLemma(l.id));
    const occRows = occurrences.length
      ? occurrences.map(occurrenceRow).join("")
      : `<p class="qm-muted">${QMI18n.t("root.noOccurrences")}</p>`;

    const sourceId = root.provenance && root.provenance.core_field && root.provenance.core_field.source_id;

    const html = `
      ${header}
      ${headword}
      <h2>${QMI18n.t("root.relatedLemmas")}</h2>
      <div class="qm-stack">${lemmaRows || `<p class="qm-muted">${QMI18n.t("root.noLemmas")}</p>`}</div>
      <h2 style="margin-top:var(--qm-space-6)">${QMI18n.t("root.occurrencesTitle")}</h2>
      <div class="qm-card">${occRows}</div>
      ${sourceId ? `<p class="qm-muted" style="font-size:var(--qm-fs-xs);margin-top:var(--qm-space-4)">${QMI18n.t("root.coreFieldSourceTemplate", { name: QMI18n.t("source." + sourceId + ".name"), status: QMI18n.t("source." + sourceId + ".status") })}</p>` : ""}
    `;
    return { html };
  }

  /* ---------------- Lemmas ---------------- */

  function renderLemmas() {
    const lemmas = QMData.listLemmas();
    const header = pageHeader({
      eyebrow: QMI18n.t("lemmas.eyebrow"),
      title: QMI18n.t("lemmas.title"),
      breadcrumbs: [{ label: QMI18n.t("nav.home"), href: "#/home" }, { label: QMI18n.t("lemmas.title") }]
    });
    const note = demoNote(QMI18n.t("lemmas.demoNoteTemplate", { count: lemmas.length }));
    const rows = lemmas.map(l => `
      <a href="#/lemma/${l.id}" class="qm-card qm-card--interactive qm-rootlemma-card" data-route-link>
        <span class="qm-rootlemma-card__ar">${l.form}</span>
        <span class="qm-rootlemma-card__gloss">${esc(QMI18n.pick(l.gloss))}</span>
        ${posBadge(l.pos)}
      </a>`).join("");
    return { html: `${header}${note}<div class="qm-stack">${rows}</div>` };
  }

  function occurrenceRow(t) {
    const surah = QMData.getSurah(t.surahId);
    return `
      <div class="qm-occurrence-row">
        <a href="#/word/${t.id}" data-route-link class="qm-occurrence-row__word">${t.surfaceForm}</a>
        <a href="#/word/${t.id}" data-route-link class="qm-occurrence-row__ref">${surah ? surah.nameEn : "Surah " + t.surahId} ${t.surahId}:${t.ayahId}</a>
      </div>`;
  }

  function renderLemma(lemmaId) {
    const lemma = QMData.getLemma(lemmaId);
    if (!lemma) return notFound("lemma");

    const header = pageHeader({
      eyebrow: QMI18n.t("lemma.eyebrow"),
      title: lemma.form,
      breadcrumbs: [{ label: QMI18n.t("nav.home"), href: "#/home" }, { label: QMI18n.t("nav.lemmas"), href: "#/lemmas" }, { label: lemma.form }]
    });

    const derivationAr = lemma.derivationType && QMWordDetail.ARABIC_TERMS.derivationType[lemma.derivationType];
    const derivationLabel = lemma.derivationType
      ? `${QMI18n.t("enum.derivationType." + lemma.derivationType)}${derivationAr ? " · " + QMWordDetail.arSpan(derivationAr) : ""}`
      : "";

    const headword = `
      <div class="qm-headword qm-card">
        <div class="qm-headword__arabic">${lemma.form}</div>
        <div class="qm-headword__gloss">${esc(QMI18n.pick(lemma.gloss))}</div>
        <div style="margin-top:var(--qm-space-3)">${posBadge(lemma.pos)} ${derivationLabel ? `<span class="qm-badge">${derivationLabel}</span>` : ""}</div>
      </div>`;

    let fields = "";
    fields += `<dt>${QMI18n.t("lemma.fieldPos")}</dt><dd>${posBadge(lemma.pos)}</dd>`;
    if (derivationLabel) fields += `<dt>${QMI18n.t("lemma.fieldDerivation")}</dt><dd>${derivationLabel}</dd>`;
    if (lemma.verbForm) fields += `<dt>${QMI18n.t("lemma.fieldVerbForm")}</dt><dd>${esc(lemma.verbForm)}</dd>`;
    if (lemma.root) {
      fields += `<dt>${QMI18n.t("lemma.fieldRoot")}</dt><dd><a href="#/root/${lemma.root.id}" data-route-link class="qm-arabic">${lemma.root.display}</a>${lemma.rootState === "show_with_badge" ? ` <span class="qm-badge qm-badge--provisional">${QMI18n.t("rootState.provisionalBadge")}</span>` : ""}</dd>`;
    } else if (lemma.rootState === "under_review") fields += `<dt>${QMI18n.t("lemma.fieldRoot")}</dt><dd class="qm-muted">${QMI18n.t("rootState.underReview")}</dd>`;
    else if (lemma.rootState === "not_applicable") fields += `<dt>${QMI18n.t("lemma.fieldRoot")}</dt><dd class="qm-muted">${QMI18n.t("rootState.notApplicable")}</dd>`;
    else fields += `<dt>${QMI18n.t("lemma.fieldRoot")}</dt><dd class="qm-muted">${QMI18n.t("lemma.noRoot")}</dd>`;
    if (lemma.learnerNote) fields += `<dt>${QMI18n.t("lemma.fieldLearnerNote")}</dt><dd>${esc(QMI18n.pick(lemma.learnerNote))}</dd>`;

    const occurrences = QMData.getOccurrencesForLemma(lemma.id);
    const occHtml = occurrences.length
      ? occurrences.map(occurrenceRow).join("")
      : `<p class="qm-muted">${QMI18n.t("lemma.noOccurrences")}</p>`;

    const html = `
      ${header}
      ${headword}
      <dl class="qm-fieldlist qm-card" style="margin-bottom:var(--qm-space-5)">${fields}</dl>
      <h2>${QMI18n.t("lemma.occurrencesTitle")}</h2>
      <div class="qm-card">${occHtml}</div>
    `;
    return { html };
  }

  return {
    renderHome, renderJuz, renderSurahs, renderSurah,
    renderRoots, renderRoot, renderLemmas, renderLemma,
    notFound, applyFilterToWords, esc
  };
})();
