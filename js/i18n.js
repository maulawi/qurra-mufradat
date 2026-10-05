/* ==========================================================================
   QURRA Mufradat al-Qur'an — i18n layer

   Centralizes every learner-facing UI string behind translation keys
   (see translations/en.js, translations/ms.js) instead of hardcoding
   English/Malay text throughout the UI modules. The selected language
   persists in localStorage and defaults to English. Arabic Qur'anic text,
   Arabic word forms, roots, lemma forms, and Arabic grammatical
   terminology are never translated — they are language-independent data,
   untouched by this module.

   Usage:
     QMI18n.t("nav.home")                      → "Home" / "Utama"
     QMI18n.t("detail.locationTemplate", {...}) → template with {placeholders} filled in
     QMI18n.pick(lemma.gloss)                   → lemma.gloss[currentLang] (falls back to .en)
     QMI18n.getLang() / QMI18n.setLang("ms")
     QMI18n.applyStaticTranslations()           → re-applies [data-i18n*] attributes in index.html chrome

   Adding a third language later means adding translations/xx.js and one
   entry in DICTS/LANGS below — no other module needs to change, because
   everything else calls QMI18n.t()/pick() rather than holding strings.
   ========================================================================== */

const QMI18n = (function () {

  const STORAGE_KEY = "qm-lang";
  const DEFAULT_LANG = "en";
  const LANGS = ["en", "ms"]; // add future languages here once translations/xx.js exists
  const DICTS = { en: QM_I18N_EN, ms: QM_I18N_MS };

  let currentLang = DEFAULT_LANG;

  function readStoredLang() {
    try {
      const stored = window.localStorage.getItem(STORAGE_KEY);
      return LANGS.includes(stored) ? stored : null;
    } catch (e) {
      return null; // localStorage unavailable (private mode, etc.) — fall back to default, no crash
    }
  }

  function storeLang(lang) {
    try { window.localStorage.setItem(STORAGE_KEY, lang); } catch (e) { /* best-effort only */ }
  }

  function lookup(dict, key) {
    const parts = key.split(".");
    let node = dict;
    for (const part of parts) {
      if (node == null || typeof node !== "object") return undefined;
      node = node[part];
    }
    return node;
  }

  function fillTemplate(str, params) {
    if (!params) return str;
    return str.replace(/\{(\w+)\}/g, (match, name) => (params[name] !== undefined ? params[name] : match));
  }

  /** Translate a key, optionally filling in {placeholders} from `params`. Falls back to English, then to the bare key (with a console warning) if truly missing — so a missing key is visible in dev tools rather than silently blank. */
  function t(key, params) {
    let value = lookup(DICTS[currentLang], key);
    if (value === undefined && currentLang !== "en") value = lookup(DICTS.en, key);
    if (value === undefined) {
      console.warn("[QMI18n] missing translation key:", key);
      return key;
    }
    return typeof value === "string" ? fillTemplate(value, params) : value;
  }

  /** Picks the current language out of a multilingual data field like lemma.gloss = {en, ms, source}. Falls back to English, then to any value present, so a field missing a language never renders blank. */
  function pick(field) {
    if (field == null) return "";
    if (typeof field === "string") return field; // already a plain string — nothing to pick
    if (field[currentLang] !== undefined) return field[currentLang];
    if (field.en !== undefined) return field.en;
    const firstKey = Object.keys(field).find(k => k !== "source");
    return firstKey ? field[firstKey] : "";
  }

  function getLang() { return currentLang; }

  function updateSwitcherUI() {
    document.querySelectorAll("[data-lang-switch]").forEach(btn => {
      const isActive = btn.getAttribute("data-lang-switch") === currentLang;
      btn.classList.toggle("is-active", isActive);
      btn.setAttribute("aria-pressed", String(isActive));
    });
  }

  function applyStaticTranslations(root) {
    const scope = root || document;
    scope.querySelectorAll("[data-i18n]").forEach(el => {
      el.textContent = t(el.getAttribute("data-i18n"));
    });
    scope.querySelectorAll("[data-i18n-html]").forEach(el => {
      el.innerHTML = t(el.getAttribute("data-i18n-html"));
    });
    scope.querySelectorAll("[data-i18n-placeholder]").forEach(el => {
      el.setAttribute("placeholder", t(el.getAttribute("data-i18n-placeholder")));
    });
    scope.querySelectorAll("[data-i18n-aria-label]").forEach(el => {
      el.setAttribute("aria-label", t(el.getAttribute("data-i18n-aria-label")));
    });
    updateSwitcherUI();
  }

  function setLang(lang) {
    if (!LANGS.includes(lang) || lang === currentLang) return;
    currentLang = lang;
    storeLang(lang);
    document.documentElement.setAttribute("lang", lang);
    // The UI (English or Malay) is always LTR; only Arabic content/components
    // (.qm-arabic, via its own CSS) ever render right-to-left. See DATA_SCHEMA.md.
    document.documentElement.setAttribute("dir", "ltr");
    applyStaticTranslations(document);
    document.dispatchEvent(new CustomEvent("qm:langchange", { detail: { lang } }));
  }

  function wireSwitchers() {
    document.querySelectorAll("[data-lang-switch]").forEach(btn => {
      btn.addEventListener("click", () => setLang(btn.getAttribute("data-lang-switch")));
    });
  }

  function init() {
    currentLang = readStoredLang() || DEFAULT_LANG;
    document.documentElement.setAttribute("lang", currentLang);
    document.documentElement.setAttribute("dir", "ltr");
    applyStaticTranslations(document);
    wireSwitchers();
  }

  return { init, t, pick, getLang, setLang, applyStaticTranslations, LANGS };
})();
