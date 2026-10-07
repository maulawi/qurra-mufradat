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
    if (overlay.hidden) lastFocusedEl = document.activeElement; // only on a fresh open, not word → word
    overlay.hidden = false;
    QMState.openDetail(tokenId);
    const closeBtn = overlay.querySelector(".qm-detail-panel__close");
    if (closeBtn) closeBtn.focus();
  }

  // The word route re-renders the whole view, so the link that was clicked is
  // usually a detached node by the time the panel closes. Re-find the word's
  // link in the current DOM instead; fall back to the remembered element.
  function restoreFocus(tokenId) {
    const word = tokenId && Array.from(document.querySelectorAll(".qm-word"))
      .find(a => a.getAttribute("data-token") === tokenId);
    const target = word || (lastFocusedEl && lastFocusedEl.isConnected ? lastFocusedEl : null);
    if (target && typeof target.focus === "function") target.focus({ preventScroll: true });
  }

  // Closing a #/word/X panel in place leaves the hash at #/word/X, so clicking
  // the same word again would not fire hashchange. Swap the URL (no hashchange,
  // no re-render) for the equivalent surah/ayah URL the page behind it shows.
  function leaveWordRoute(tokenId) {
    if (!/^#\/word\//.test(window.location.hash)) return;
    const token = tokenId && QMData.getToken(tokenId);
    if (!token) return;
    try {
      window.history.replaceState(null, "", `#/surah/${token.surahId}/ayah/${token.ayahId}`);
    } catch (e) { /* best-effort only */ }
  }

  // close({ restoreFocus: false }) is used by the router when navigating
  // elsewhere: the URL has already changed and focus must not be pulled back.
  function close(opts) {
    const { overlay } = els();
    if (!overlay || overlay.hidden) return;
    const tokenId = QMState.getState().selectedTokenId;
    const byNavigation = !!(opts && opts.restoreFocus === false);
    overlay.hidden = true;
    QMState.closeDetail();
    if (byNavigation) return;
    leaveWordRoute(tokenId);
    restoreFocus(tokenId);
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

  // Skip link: move focus to <main> without letting "#qm-main" reach the hash
  // router (which would treat it as an unknown route).
  const skipLink = document.querySelector(".qm-skip-link");
  if (skipLink) {
    skipLink.addEventListener("click", (e) => {
      e.preventDefault();
      const main = document.getElementById("qm-main");
      if (main) main.focus();
    });
  }

  // Language switch: re-render the current route (screen content is
  // generated per-render from QMI18n, so this is enough to pick up the
  // new language) and, if the word-detail panel is open, refresh it too
  // — unless the current route IS the word route, which already
  // re-opens the panel fresh as part of its own render.
  document.addEventListener("qm:langchange", () => {
    QMRouter.parseAndRender({ preserveScroll: true });
    const path = (window.location.hash || "#/home").replace(/^#/, "");
    if (!/^\/word\//.test(path)) QMDetailOverlay.refresh();
  });
})();
