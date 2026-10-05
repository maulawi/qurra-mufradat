/* ==========================================================================
   QURRA Mufradat al-Qur'an — Filters

   The All/Ism/Fiʿl/Harf filter bar used on Surah/Ayah screens. Per the
   spec: only expose filters the current demo data actually supports —
   never a chip that would silently return zero results.
   ========================================================================== */

const QMFilters = (function () {

  // Arabic chip terms never change with UI language; the label text beside
  // them comes from QMI18n.t("filters.*").
  const POS_AR = { all: "الكل", ism: "اسم", "fiʿl": "فعل", harf: "حرف" };
  const POS_KEY = { all: "filters.all", ism: "filters.noun", "fiʿl": "filters.verb", harf: "filters.particle" };

  function filterTokensByPos(tokens, filter) {
    if (!filter || filter === "all") return tokens;
    return tokens.filter(t => t.pos === filter);
  }

  /**
   * Renders a chip row into `container`. `onChange(filterValue)` fires on
   * click. Only chips for parts-of-speech actually present in `tokens`
   * are shown, alongside "All".
   */
  function renderFilterBar(container, tokens, currentFilter, onChange) {
    const present = QMData.availablePosFilters(tokens);
    if (present.length <= 1) {
      // Nothing meaningful to filter (e.g. a single-POS selection) — don't show a useless bar.
      container.innerHTML = "";
      return;
    }

    const countFor = pos => filterTokensByPos(tokens, pos).length;
    const chips = ["all", ...present];

    container.innerHTML = chips.map(pos => {
      const active = currentFilter === pos ? " is-active" : "";
      const count = pos === "all" ? tokens.length : countFor(pos);
      return `<button type="button" class="qm-chip${active}" data-filter="${pos}" aria-pressed="${currentFilter === pos}">
        <span class="qm-arabic">${POS_AR[pos]}</span> · ${QMI18n.t(POS_KEY[pos])} <span class="qm-chip__count">${count}</span>
      </button>`;
    }).join("");

    container.querySelectorAll("[data-filter]").forEach(btn => {
      btn.addEventListener("click", () => onChange(btn.getAttribute("data-filter")));
    });
  }

  return { filterTokensByPos, renderFilterBar };
})();
