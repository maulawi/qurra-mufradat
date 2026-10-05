/* ==========================================================================
   QURRA Mufradat al-Qur'an — Application state

   Deliberately tiny: a plain object plus a handful of setters, no
   framework/state library (per spec). The router (router.js) is the
   source of truth for "where am I" — this module holds the few bits of
   UI state that aren't encoded in the URL (the active filter, the
   open/closed word-detail panel, the search term).
   ========================================================================== */

const QMState = (function () {
  const state = {
    currentRoute: null,       // the parsed route object from router.js
    selectedFilter: "all",    // "all" | "ism" | "fiʿl" | "harf"
    selectedTokenId: null,    // token id shown in the detail panel, if open
    detailOpen: false,
    searchTerm: ""
  };

  const listeners = new Set();

  function subscribe(fn) {
    listeners.add(fn);
    return () => listeners.delete(fn);
  }

  function notify() {
    listeners.forEach(fn => fn(state));
  }

  function setRoute(route) {
    state.currentRoute = route;
    notify();
  }

  function setFilter(filter) {
    state.selectedFilter = filter;
    notify();
  }

  function openDetail(tokenId) {
    state.selectedTokenId = tokenId;
    state.detailOpen = true;
    notify();
  }

  function closeDetail() {
    state.detailOpen = false;
    state.selectedTokenId = null;
    notify();
  }

  function setSearchTerm(term) {
    state.searchTerm = term;
    notify();
  }

  function getState() {
    return state;
  }

  return { subscribe, setRoute, setFilter, openDetail, closeDetail, setSearchTerm, getState };
})();
