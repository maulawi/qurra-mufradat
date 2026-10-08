/* ==========================================================================
   QURRA Mufradat al-Qur'an — Hash router

   Plain hash routing (#/home, #/juz/1, #/surah/2/ayah/2, #/word/2:2:7, ...)
   so the app works unmodified as a static GitHub Pages site and survives a
   refresh on any route (the whole app is one index.html; the server never
   needs to know about these paths because they live after the "#").
   ========================================================================== */

const QMRouter = (function () {

  const routes = [
    { pattern: /^\/home\/?$/, navKey: "home", handler: () => QMRender.renderHome() },
    { pattern: /^\/?$/, navKey: "home", handler: () => QMRender.renderHome() },

    { pattern: /^\/juz\/(\d+)\/surah\/(\d+)\/ayah\/(\d+)\/?$/, navKey: "juz", handler: (m) => QMRender.renderSurah(m[2], { juz: m[1], highlightAyah: m[3] }) },
    { pattern: /^\/juz\/(\d+)\/surah\/(\d+)\/?$/, navKey: "juz", handler: (m) => QMRender.renderSurah(m[2], { juz: m[1] }) },
    { pattern: /^\/juz\/(\d+)\/?$/, navKey: "juz", handler: (m) => QMRender.renderJuz(m[1]) },

    { pattern: /^\/surahs\/?$/, navKey: "surahs", handler: () => QMRender.renderSurahs() },
    { pattern: /^\/surah\/(\d+)\/ayah\/(\d+)\/?$/, navKey: "surahs", handler: (m) => QMRender.renderSurah(m[1], { highlightAyah: m[2] }) },
    { pattern: /^\/surah\/(\d+)\/?$/, navKey: "surahs", handler: (m) => QMRender.renderSurah(m[1]) },

    { pattern: /^\/roots\/?$/, navKey: "roots", handler: () => QMRender.renderRoots() },
    { pattern: /^\/root\/(.+)$/, navKey: "roots", handler: (m) => QMRender.renderRoot(decodeURIComponent(m[1])) },

    { pattern: /^\/lemmas\/?$/, navKey: "lemmas", handler: () => QMRender.renderLemmas() },
    { pattern: /^\/lemma\/(.+)$/, navKey: "lemmas", handler: (m) => QMRender.renderLemma(decodeURIComponent(m[1])) },

    // A single word: resolve its Surah/Ayah location, render that screen,
    // and auto-open the detail overlay for this token (wired in main.js).
    { pattern: /^\/word\/(.+)$/, navKey: "surahs", handler: (m) => renderWordRoute(decodeURIComponent(m[1])) }
  ];

  function renderWordRoute(tokenId) {
    const token = QMData.getToken(tokenId);
    if (!token) return QMRender.notFound("word");
    const result = QMRender.renderSurah(token.surahId, { highlightAyah: token.ayahId });
    const innerMount = result.mount;
    result.mount = function (viewEl) {
      if (innerMount) innerMount(viewEl);
      if (window.QMDetailOverlay) window.QMDetailOverlay.open(tokenId);
    };
    return result;
  }

  // <body> (not the window) is the page's scroll container — see the
  // `html, body { height: 100% }` rules — so every plausible scroller is reset.
  function resetScroll() {
    window.scrollTo(0, 0);
    [document.scrollingElement, document.documentElement, document.body, document.getElementById("qm-main")]
      .forEach(el => { if (el) el.scrollTop = 0; });
  }

  // opts.preserveScroll: re-render in place (e.g. after a language switch)
  // without jumping back to the top.
  function parseAndRender(opts) {
    opts = opts || {};
    const raw = window.location.hash || "#/home";
    const path = raw.replace(/^#/, "");

    // Any route other than a word route dismisses the word-detail overlay
    // (a word route re-opens it itself, via its mount below).
    if (!/^\/word\//.test(path) && window.QMDetailOverlay && window.QMDetailOverlay.isOpen()) {
      window.QMDetailOverlay.close({ restoreFocus: false });
    }

    let matched = null;
    let match = null;
    for (const r of routes) {
      const m = path.match(r.pattern);
      if (m) { matched = r; match = m; break; }
    }

    const view = document.getElementById("qm-view");
    let result;
    if (matched) {
      result = matched.handler(match);
    } else {
      result = QMRender.notFound("page");
    }

    view.innerHTML = result.html;

    // Start every navigation at the top, unless the screen deliberately
    // scrolls to a target itself (result.keepScroll — the ayah/word routes).
    if (!opts.preserveScroll && !result.keepScroll) resetScroll();

    if (result.mount) result.mount(view);

    QMState.setRoute({ path });
    QMNavigation.setActiveNav(matched ? matched.navKey : null);
  }

  function init() {
    window.addEventListener("hashchange", () => parseAndRender());
    window.addEventListener("DOMContentLoaded", () => parseAndRender());
    // In case the script runs after DOMContentLoaded already fired.
    if (document.readyState !== "loading") parseAndRender();
  }

  return { init, parseAndRender };
})();
