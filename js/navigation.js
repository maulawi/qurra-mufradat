/* ==========================================================================
   QURRA Mufradat al-Qur'an — Navigation chrome

   Active nav-link highlighting (sidebar + mobile bottom nav), the mobile
   search toggle, and the lightweight search-as-you-type experience shared
   by the sidebar and mobile search inputs. Doesn't know anything about
   routing itself — router.js tells it which nav key is active; this
   module just reflects that in the DOM.
   ========================================================================== */

const QMNavigation = (function () {

  function setActiveNav(navKey) {
    document.querySelectorAll("[data-nav]").forEach(el => {
      el.classList.toggle("is-active", el.getAttribute("data-nav") === navKey);
    });
  }

  function resultLabel(result) {
    if (result.kind === "token") {
      const t = result.token;
      const posShort = t.pos === "fiʿl" ? QMI18n.t("search.posVerb")
        : t.pos === "ism" ? QMI18n.t("search.posNoun")
        : QMI18n.t("search.posParticle");
      return {
        href: `#/word/${t.id}`,
        word: t.surfaceForm,
        meta: `${t.surahId}:${t.ayahId} · ${posShort}`
      };
    }
    if (result.kind === "lemma") {
      const l = result.lemma;
      return { href: `#/lemma/${l.id}`, word: l.form, meta: `${QMI18n.t("search.lemmaPrefix")} · ${QMI18n.pick(l.gloss)}` };
    }
    const r = result.root;
    return { href: `#/root/${r.id}`, word: r.letters.split("").join(" "), meta: QMI18n.t("search.rootLabel") };
  }

  function wireSearch(inputEl, resultsEl) {
    if (!inputEl || !resultsEl) return;

    function run() {
      const q = inputEl.value;
      if (!q.trim()) {
        resultsEl.hidden = true;
        resultsEl.innerHTML = "";
        return;
      }
      const results = QMData.searchVocabulary(q);
      if (!results.length) {
        resultsEl.hidden = false;
        resultsEl.innerHTML = `<div class="qm-search-empty">${QMRender.esc(QMI18n.t("common.noMatchesTemplate", { query: q }))}</div>`;
        return;
      }
      resultsEl.hidden = false;
      resultsEl.innerHTML = results.map(r => {
        const { href, word, meta } = resultLabel(r);
        return `<a href="${href}" data-route-link class="qm-search-result" data-search-nav>
          <span class="qm-search-result__word">${word}</span>
          <span class="qm-search-result__meta">${QMRender.esc(meta)}</span>
        </a>`;
      }).join("");
    }

    inputEl.addEventListener("input", run);
    inputEl.addEventListener("focus", run);

    resultsEl.addEventListener("click", (e) => {
      if (e.target.closest("[data-search-nav]")) {
        resultsEl.hidden = true;
        inputEl.value = "";
      }
    });

    document.addEventListener("click", (e) => {
      if (!resultsEl.contains(e.target) && e.target !== inputEl) resultsEl.hidden = true;
    });
    inputEl.addEventListener("keydown", (e) => {
      if (e.key === "Escape") { resultsEl.hidden = true; inputEl.blur(); }
    });
  }

  function wireMobileSearchToggle() {
    const toggle = document.getElementById("qm-mobile-search-toggle");
    const panel = document.getElementById("qm-mobile-search");
    if (!toggle || !panel) return;
    toggle.addEventListener("click", () => {
      const willShow = panel.hidden;
      panel.hidden = !willShow;
      toggle.setAttribute("aria-expanded", String(willShow));
      if (willShow) {
        const input = document.getElementById("qm-mobile-search-input");
        if (input) input.focus();
      }
    });
  }

  function init() {
    wireSearch(document.getElementById("qm-search-input"), document.getElementById("qm-search-results"));
    wireSearch(document.getElementById("qm-mobile-search-input"), document.getElementById("qm-mobile-search-results"));
    wireMobileSearchToggle();
  }

  return { init, setActiveNav };
})();
