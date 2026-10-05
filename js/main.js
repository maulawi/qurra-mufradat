/* ==========================================================================
   QURRA Mufradat al-Qur'an — Bootstrap

   Wires up the one piece of global UI that isn't owned by a single screen:
   the word-detail overlay (drawer on mobile, side panel on desktop), plus
   starting the router and navigation chrome. Kept deliberately small —
   this is the only file that needs to run once, globally, on load.
   ========================================================================== */

const QMDetailOverlay = (function () {
  let lastFocusedEl = null;

  function els() {
    return {
      overlay: document.getElementById("qm-detail-overlay"),
      content: document.getElementById("qm-detail-content"),
      panel: document.getElementById("qm-detail-panel"),
      closeBtns: document.querySelectorAll("[data-detail-close]")
    };
  }

  function open(tokenId) {
    const { overlay, content } = els();
    if (!overlay || !content) return;
    content.innerHTML = QMWordDetail.render(tokenId);
    QMWordDetail.wireExpandables(content);
    lastFocusedEl = document.activeElement;
    overlay.hidden = false;
    QMState.openDetail(tokenId);
    const closeBtn = overlay.querySelector(".qm-detail-panel__close");
    if (closeBtn) closeBtn.focus();
  }

  function close() {
    const { overlay } = els();
    if (!overlay || overlay.hidden) return;
    overlay.hidden = true;
    QMState.closeDetail();
    if (lastFocusedEl && typeof lastFocusedEl.focus === "function") lastFocusedEl.focus();
  }

  function isOpen() {
    const { overlay } = els();
    return overlay && !overlay.hidden;
  }

  // Re-renders the currently-open panel's content in place (no focus/open
  // state change) — used after a language switch so an open word-detail
  // panel reflects the new language without closing it.
  function refresh() {
    if (!isOpen()) return;
    const tokenId = QMState.getState().selectedTokenId;
    if (!tokenId) return;
    const { content } = els();
    if (!content) return;
    content.innerHTML = QMWordDetail.render(tokenId);
    QMWordDetail.wireExpandables(content);
  }

  function init() {
    const { overlay, closeBtns } = els();
    if (!overlay) return;
    closeBtns.forEach(btn => btn.addEventListener("click", close));
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && isOpen()) close();
    });
  }

  return { open, close, isOpen, refresh, init };
})();

// Exposed for router.js (loaded before this file, but only *calls*
// window.QMDetailOverlay at hashchange/DOMContentLoaded time, after this
// script has already run and set it).
window.QMDetailOverlay = QMDetailOverlay;

(function boot() {
  QMI18n.init();
  QMDetailOverlay.init();
  QMNavigation.init();
  QMRouter.init();

  // Language switch: re-render the current route (screen content is
  // generated per-render from QMI18n, so this is enough to pick up the
  // new language) and, if the word-detail panel is open, refresh it too
  // — unless the current route IS the word route, which already
  // re-opens the panel fresh as part of its own render.
  document.addEventListener("qm:langchange", () => {
    QMRouter.parseAndRender();
    const path = (window.location.hash || "#/home").replace(/^#/, "");
    if (!/^\/word\//.test(path)) QMDetailOverlay.refresh();
  });
})();
