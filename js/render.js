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

  /** A quiet, neutral one-line note. Not an alert: used only where a short fact helps the reader. */
  function infoNote(html) {
    return `<p class="qm-info-note">${html}</p>`;
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

  /** percentage with one decimal, or a whole number when exact */
  function pctOf(n, d) { return d ? (Math.round(1000 * n / d) / 10).toString() : "0"; }
  /** Share of a Juz's words that have an analysis record (shown only when the Juz is not fully analysed). */
  function coverageLabel(analysed, total) { return pctOf(analysed, total) + "%"; }

  function occCaption(total, shown) {
    return total > shown ? QMI18n.t("lemma.occurrencesPartialTemplate", { total: total.toLocaleString("en-US"), shown }) : QMI18n.t("lemma.occurrencesCountTemplate", { total: total.toLocaleString("en-US") });
  }

  /* ---------------- Home ---------------- */

  function juzCards(juzList) {
    return juzList.map(j => `
      <a href="#/juz/${j.number}" class="qm-card qm-card--interactive qm-juz-card" data-route-link>
        <span class="qm-juz-card__number">${j.number}</span>
        <span class="qm-juz-card__ar qm-arabic">${j.nameAr}</span>
        ${j.analysedTokenCount === 0
          ? `<span class="qm-badge qm-muted">${QMI18n.t("juzCard.textOnly")}</span>`
          : j.analysedTokenCount < j.tokenCount
          ? `<span class="qm-badge qm-badge--demo" data-coverage="partial">${QMI18n.t("juzCard.analysed")} · ${coverageLabel(j.analysedTokenCount, j.tokenCount)}</span>`
          : ""}
      </a>`).join("");
  }

  /** Local, decorative hero artwork: nested pointed arches around an eight-point star. No external asset. */
  const HERO_ART = `<svg class="qm-hero__art" viewBox="0 0 220 300" preserveAspectRatio="xMaxYMid meet" aria-hidden="true" focusable="false">
      <g fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round">
        <path d="M14 300V132C14 66 74 30 110 4c36 26 96 62 96 128v168" stroke-width="2.2"/>
        <path d="M34 300V136C34 78 82 46 110 26c28 20 76 52 76 110v164" stroke-width="1.4" opacity=".7"/>
        <path d="M54 300V140c0-44 36-70 56-84 20 14 56 40 56 84v160" stroke-width="1" opacity=".5"/>
        <rect x="86" y="116" width="48" height="48" stroke-width="1.5" opacity=".85"/>
        <rect x="86" y="116" width="48" height="48" stroke-width="1.5" opacity=".85" transform="rotate(45 110 140)"/>
        <circle cx="110" cy="140" r="8" stroke-width="1.2" opacity=".7"/>
      </g>
    </svg>`;

  const HOME_CARDS = [
    { nav: "juz", href: "#/juz", icon: "juz", title: "nav.juz", sub: "home.cardJuz" },
    { nav: "surahs", href: "#/surahs", icon: "surahs", title: "nav.surahs", sub: "home.cardSurahs" },
    { nav: "roots", href: "#/roots", icon: "roots", title: "nav.roots", sub: "home.cardRoots" },
    { nav: "lemmas", href: "#/lemmas", icon: "lemmas", title: "nav.lemmas", sub: "home.cardLemmas" }
  ];

  function homeCards() {
    return HOME_CARDS.map(c => `
      <a href="${c.href}" class="qm-home-card" data-route-link data-home-card="${c.nav}">
        <span class="qm-home-card__icon" aria-hidden="true"><svg class="qm-icon"><use href="#qm-i-${c.icon}"/></svg></span>
        <span class="qm-home-card__text">
          <span class="qm-home-card__title">${QMI18n.t(c.title)}</span>
          <span class="qm-home-card__sub">${QMI18n.t(c.sub)}</span>
        </span>
        <svg class="qm-icon qm-home-card__chevron" aria-hidden="true"><use href="#qm-i-chevron"/></svg>
      </a>`).join("");
  }

  function renderHome() {
    const html = `
      <section class="qm-hero">
        ${HERO_ART}
        <div class="qm-hero__content">
          <div class="qm-hero__arabic qm-arabic" lang="ar">مفردات القرآن</div>
          <h1 class="qm-hero__tagline">${QMI18n.t("home.tagline")}</h1>
          <div class="qm-hero__rule" aria-hidden="true"><span></span><i></i><span></span></div>
        </div>
      </section>

      <nav class="qm-home-grid" aria-label="${esc(QMI18n.t("home.sectionsLabel"))}">${homeCards()}</nav>

      <div class="qm-beta-banner" role="note">
        <svg class="qm-icon qm-beta-banner__icon" aria-hidden="true"><use href="#qm-i-info"/></svg>
        <div class="qm-beta-banner__text">
          <strong>${QMI18n.t("home.betaTitle")}</strong>
          <span>${QMI18n.t("home.betaBody")}</span>
        </div>
      </div>
    `;
    return { html };
  }

  /* ---------------- Juz ---------------- */

  function juzMeta(juz) {
    const first = QMData.getSurah(juz.start.surah);
    return QMI18n.t("juz.startsAtTemplate", { surah: first ? first.nameEn : juz.start.surah, ayah: juz.start.ayah });
  }

  /** #/juz — every Juz, from the existing Juz data. */
  function renderJuzIndex() {
    const header = pageHeader({
      eyebrow: QMI18n.t("juz.eyebrow"),
      title: QMI18n.t("juz.indexTitle"),
      breadcrumbs: [{ label: QMI18n.t("nav.home"), href: "#/home" }, { label: QMI18n.t("nav.juz") }],
      meta: QMI18n.t("juz.indexIntro")
    });
    return { html: `${header}<div class="qm-grid" data-juz-index>${juzCards(QMData.listJuz())}</div>` };
  }

  /** Previous / next Juz links and a strip of all Juz, so any Juz is one click away. */
  function juzSwitcher(current) {
    const all = QMData.listJuz();
    const prev = all.find(j => j.number === current - 1), next = all.find(j => j.number === current + 1);
    const nav = `<div class="qm-row" style="justify-content:space-between;gap:.5rem;margin:.75rem 0">
        ${prev ? `<a class="qm-btn qm-btn--secondary" href="#/juz/${prev.number}" data-route-link data-juz-prev>${QMI18n.t("juz.prevJuz", { n: prev.number })}</a>` : "<span></span>"}
        <a class="qm-btn qm-btn--secondary" href="#/juz" data-route-link>${QMI18n.t("juz.allJuz")}</a>
        ${next ? `<a class="qm-btn qm-btn--secondary" href="#/juz/${next.number}" data-route-link data-juz-next>${QMI18n.t("juz.nextJuz", { n: next.number })}</a>` : "<span></span>"}
      </div>`;
    const strip = `<nav class="qm-row" style="flex-wrap:wrap;gap:.35rem;margin-bottom:1rem" aria-label="${QMI18n.t("juz.allJuz")}" data-juz-strip>
        ${all.map(j => `<a class="qm-btn qm-btn--secondary" style="padding:.15rem .55rem${j.number === current ? ";font-weight:700" : ""}" href="#/juz/${j.number}" data-route-link${j.number === current ? ' aria-current="page"' : ""}>${j.number}</a>`).join("")}
      </nav>`;
    return nav + strip;
  }

  function renderJuz(juzNumber) {
    const juz = QMData.getJuz(juzNumber);
    if (!juz) return notFound("juz");

    const header = pageHeader({
      eyebrow: QMI18n.t("juz.eyebrow"),
      title: QMI18n.t("juz.titleTemplate", { n: juz.number }),
      titleAr: juz.nameAr,
      breadcrumbs: [{ label: QMI18n.t("nav.home"), href: "#/home" }, { label: QMI18n.t("juz.titleTemplate", { n: juz.number }) }],
      meta: juzMeta(juz) + " · " + QMI18n.t("juz.totalAyahsTemplate", { count: juz.totalAyahs })
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
      body = `<h2>${QMI18n.t("juz.surahsInJuz")}</h2><div class="qm-stack">${juz.ranges.map(r => rangeCard(r, juz.number)).join("")}</div>`;
    }

    return { html: `${header}${juzSwitcher(juz.number)}${body}` };
  }

  /** One surah's share of a Juz: "Al-Baqarah 1–141", linking to just that range. */
  function rangeCard(r, juzNumber) {
    const s = r.surah, whole = r.from === 1 && r.to === s.ayahCount;
    const label = r.from === r.to ? String(r.from) : r.from + "–" + r.to;
    return `
      <a href="#/juz/${juzNumber}/surah/${s.number}" class="qm-card qm-card--interactive qm-surah-card" data-route-link data-range="${s.number}:${r.from}-${r.to}">
        <span class="qm-surah-card__num">${s.number}</span>
        <span class="qm-surah-card__names">
          <span class="qm-surah-card__ar qm-arabic">${s.nameAr}</span>
          <span class="qm-surah-card__en">${esc(s.nameEn)} · ${QMI18n.t("juz.ayahRangeTemplate", { range: label })}</span>
        </span>
        <span class="qm-surah-card__meta">${QMI18n.t(whole ? "juz.wholeSurahTemplate" : "juz.partOfSurahTemplate", { count: r.count, total: s.ayahCount })}</span>
      </a>`;
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
        <span class="qm-surah-card__meta">${s.analysedTokenCount && s.analysedTokenCount < s.tokenCount ? QMI18n.t("surahCard.ayahsAnalysedTemplate", { total: s.ayahCount, pct: pctOf(s.analysedTokenCount, s.tokenCount) }) : QMI18n.t("surahCard.ayahsTemplate", { total: s.ayahCount })}</span>
      </a>`;
  }

  function renderSurahs() {
    const surahs = QMData.listSurahs();
    const header = pageHeader({
      eyebrow: QMI18n.t("surahs.eyebrow"),
      title: QMI18n.t("surahs.title"),
      breadcrumbs: [{ label: QMI18n.t("nav.home"), href: "#/home" }, { label: QMI18n.t("surahs.title") }]
    });
    const list = `<div class="qm-stack">${surahs.map(s => surahCard(s)).join("")}</div>`;
    return { html: `${header}${list}` };
  }

  /* ---------------- Surah / Ayah ---------------- */

  function wordAnchor(t) {
    return `<a href="#/word/${t.id}" data-route-link class="qm-word qm-arabic" data-token="${t.id}" data-pos="${t.pos || ""}">${t.surfaceForm}</a>`;
  }

  /** Every available translation of the ayah, each labelled with its translator and language; nothing is shown when there is none. */
  function translationBlock(ayah) {
    if (!ayah.translations.length) return "";
    const lang = QMI18n.getLang();
    const items = ayah.translations.map(t => `
          <div class="qm-ayah__translation" data-translation="${esc(t.id)}" lang="${esc(t.language)}">
            <p class="qm-muted"><strong>${esc(t.translator)}${t.year ? " (" + t.year + ")" : ""} · ${esc(QMI18n.t("surah.langName." + t.language))}</strong></p>
            <p class="qm-muted">${esc(t.text)}</p>
            ${t.published ? "" : `<p class="qm-muted" style="font-size:var(--qm-fs-xs)">${QMI18n.t("surah.translationNote")}</p>`}
          </div>`).join("");
    const hasLang = ayah.translations.some(t => t.language === lang && t.published);
    const gap = hasLang ? "" : `<p class="qm-muted" style="font-size:var(--qm-fs-xs)">${QMI18n.t("surah.noTranslationInLang")}</p>`;
    return `<details class="qm-ayah__translation-toggle">
          <summary class="qm-muted" style="cursor:pointer">${QMI18n.t("surah.showTranslation")}</summary>${items}${gap}
        </details>`;
  }

  function ayahBlock(ayah) {
    const words = ayah.tokens.map(wordAnchor).join(" ");
    return `
      <div class="qm-ayah" id="ayah-${ayah.ayahId}" data-ayah="${ayah.ayahId}">
        <p class="qm-ayah__text">${words}<span class="qm-ayah__marker">${ayah.ayahId}</span></p>
        ${translationBlock(ayah)}
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
    let juz = null, juzRange = null;
    if (opts.juz !== undefined && opts.juz !== null) {
      juz = QMData.getJuz(opts.juz);
      if (!juz || !juz.surahIds.includes(surah.number)) return notFound("surah");
      juzRange = juz.ranges.find(r => r.surahId === surah.number);
    }
    const ayahTarget = opts.highlightAyah !== undefined && opts.highlightAyah !== null ? Number(opts.highlightAyah) : null;

    const ayahs = QMData.listAyahsInSurah(surahNumber).filter(a => !juzRange || (a.ayahId >= juzRange.from && a.ayahId <= juzRange.to));
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
      meta: juzRange ? QMI18n.t("juz.surahInJuzTemplate", { juz: juz.number, from: juzRange.from, to: juzRange.to, total: surah.ayahCount }) : surah.analysedTokenCount === surah.tokenCount && surah.tokenCount > 0
        ? QMI18n.t("surah.metaTemplate", { revelation: QMI18n.t("enum.revelation." + surah.revelation), ayahCount: surah.ayahCount })
        : surah.analysedTokenCount
        ? QMI18n.t("surah.metaAnalysedTemplate", { revelation: QMI18n.t("enum.revelation." + surah.revelation), ayahCount: surah.ayahCount, analysedCount: surah.analysedTokenCount.toLocaleString("en-US"), tokenCount: surah.tokenCount.toLocaleString("en-US") })
        : QMI18n.t("surah.metaTemplate", { revelation: QMI18n.t("enum.revelation." + surah.revelation), ayahCount: surah.ayahCount })
    });

    // A specific ayah was requested but this demo has no data for it: say so
    // plainly instead of silently showing the rest of the surah.
    if (ayahTarget !== null && !(Number.isInteger(ayahTarget) && ayahTarget >= (juzRange ? juzRange.from : 1) && ayahTarget <= (juzRange ? juzRange.to : surah.ayahCount))) {
      const surahHref = juz ? `#/juz/${juz.number}/surah/${surah.number}` : `#/surah/${surah.number}`;
      return {
        html: `${header}${emptyState(
          QMI18n.t("surah.ayahMissingTitle", { ayah: ayahTarget }),
          esc(QMI18n.t("surah.ayahMissingBody", { surah: surah.nameEn, count: surah.ayahCount })),
          `<a class="qm-btn qm-btn--primary" href="${surahHref}" data-route-link>${esc(QMI18n.t("surah.viewSurahTemplate", { surah: surah.nameEn }))}</a>`
        )}`
      };
    }

    // Fully analysed surahs need no page-level note: each word shows its own status. Only a gap is worth one quiet line.
    const note = surah.analysedTokenCount === surah.tokenCount && surah.tokenCount > 0
      ? ""
      : surah.analysedTokenCount
      ? infoNote(QMI18n.t("surah.demoNoteTemplate"))
      : infoNote(QMI18n.t("surah.textOnlyNote"));

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
    const note = infoNote(QMI18n.t("roots.provisionalNote"));
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

    const occTotal = root.lemmas.reduce((n, l) => n + QMData.getOccurrenceCount(l.id), 0);
    const occurrences = root.lemmas.flatMap(l => QMData.getOccurrencesForLemma(l.id, 100)).slice(0, 200);
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
      <p class="qm-muted">${occCaption(occTotal, occurrences.length)}</p>
      <div class="qm-card">${occRows}</div>
      ${sourceId ? `<details class="qm-muted" style="font-size:var(--qm-fs-xs);margin-top:var(--qm-space-4)" data-core-source><summary style="cursor:pointer">${QMI18n.t("root.coreFieldSourceTemplate", { name: QMI18n.t("source." + sourceId + ".name") })}</summary><p style="margin:var(--qm-space-1) 0 0">${QMI18n.t("source." + sourceId + ".status")}</p></details>` : ""}
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
    const rows = lemmas.map(l => `
      <a href="#/lemma/${l.id}" class="qm-card qm-card--interactive qm-rootlemma-card" data-route-link>
        <span class="qm-rootlemma-card__ar">${l.form}</span>
        <span class="qm-rootlemma-card__gloss">${esc(QMI18n.pick(l.gloss))}</span>
        ${posBadge(l.pos)}
      </a>`).join("");
    return { html: `${header}<div class="qm-stack">${rows}</div>` };
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

    const occTotal = QMData.getOccurrenceCount(lemma.id), occurrences = QMData.getOccurrencesForLemma(lemma.id, 200);
    const occHtml = occurrences.length
      ? occurrences.map(occurrenceRow).join("")
      : `<p class="qm-muted">${QMI18n.t("lemma.noOccurrences")}</p>`;

    const html = `
      ${header}
      ${headword}
      <dl class="qm-fieldlist qm-card" style="margin-bottom:var(--qm-space-5)">${fields}</dl>
      <h2>${QMI18n.t("lemma.occurrencesTitle")}</h2>
      <p class="qm-muted">${occCaption(occTotal, occurrences.length)}</p>
      <div class="qm-card">${occHtml}</div>
    `;
    return { html };
  }

  return {
    renderHome, renderJuz, renderJuzIndex, renderSurahs, renderSurah,
    renderRoots, renderRoot, renderLemmas, renderLemma,
    notFound, applyFilterToWords, esc
  };
})();
