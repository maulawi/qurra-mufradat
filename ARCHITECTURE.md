# QURRA Mufradat al-Qur'an — Architecture

Stage 1 deliverable: a static, dependency-free frontend prototype. No
backend, no database, no build step, no framework. This document explains
how the pieces fit together and — most importantly — **how to swap the
demo dataset for a real one later without rewriting the UI.**

As of v0.2, the UI is bilingual (English default, Bahasa Melayu as a
second interface language) — see §11 for how that was added on top of
this same architecture, without a rebuild.

## 1. Technology

Plain HTML, CSS, and vanilla JavaScript. Every JS file is a classic
(non-module) `<script>` that defines one top-level `const` — a module
object built with an IIFE (`const X = (function () { ...; return {...}; })();`).
Top-level `const`/`let` declared this way are visible to every other
`<script>` tag on the same page (they share the page's script scope), so
`index.html` simply loads the files in dependency order and every module
can call every other one directly — no bundler, no `import`/`export`, no
`npm install` required to run it.

```
index.html
 └─ css/ (tokens → base → layout → components → vocabulary → responsive)
 └─ js/  (translations/en → translations/ms → i18n → state → demoData → data →
          filters → wordDetail → render → navigation → router → main)
```

That load order matters: each file only uses globals defined by files
loaded before it.

## 2. Module responsibilities

| File | Responsibility |
|---|---|
| `js/translations/en.js`, `js/translations/ms.js` | `QM_I18N_EN`/`QM_I18N_MS` — every learner-facing UI string, keyed identically in both files. No JS logic; plain nested string dictionaries. See §11. |
| `js/i18n.js` | `QMI18n` — the translation engine: key lookup (`t()`), multilingual-data-field lookup (`pick()`), current-language persistence, and applying `[data-i18n*]` attributes in `index.html`'s static chrome. See §11. |
| `js/state.js` | `QMState` — the few bits of UI state not encoded in the URL (active filter, open/closed detail panel, search term). A plain object + subscribe/notify, no framework. |
| `js/demoData.js` | The raw demo dataset (`QM_ROOTS`, `QM_LEMMAS`, `QM_TOKENS`, `QM_AYAHS`, `QM_SURAHS`, `QM_JUZ`, `QM_SOURCE_REGISTRY`). **The only file a real-data replacement needs to touch** — see §7. |
| `js/data.js` | `QMData` — the repository/data-access layer. Every other module calls `QMData.getX()`/`listX()` functions; nothing outside this file ever reads `QM_TOKENS` etc. directly. |
| `js/filters.js` | `QMFilters` — the All/اسم/فعل/حرف chip bar; only renders chips for parts of speech actually present in the tokens being shown. |
| `js/wordDetail.js` | `QMWordDetail` — builds the progressive-disclosure HTML for one token's detail panel (always-visible header, then four expandable sections). |
| `js/render.js` | `QMRender` — one function per screen (Home, Juz, Surahs, Surah/Ayah, Roots, Root, Lemmas, Lemma). Each returns `{ html, mount }`; `mount(viewEl)` wires up anything plain links can't do (the filter bar). |
| `js/navigation.js` | `QMNavigation` — active nav-link highlighting, the mobile search toggle, and the sidebar/mobile search-as-you-type UI. |
| `js/router.js` | `QMRouter` — the hash router: matches `location.hash` against a small route table, calls the matching `QMRender` function, inserts the HTML, and runs `mount`. |
| `js/main.js` | Bootstrap. Owns the one truly global widget — the word-detail overlay (open/close, Escape key, scrim click, focus return) — and starts `QMNavigation`/`QMRouter` on load. |

## 3. Routing

Hash-based, so the whole app is one static `index.html` and works
unmodified on GitHub Pages (no server-side rewrite rules needed) and
survives a refresh on any route (the server only ever sees a request for
`index.html`; everything after `#` is handled client-side).

| Route | Renders |
|---|---|
| `#/home` (or empty) | Home — hero + 30-card Juz grid |
| `#/juz/:n` | Juz screen — Surah list, or an honest "not yet available" state |
| `#/juz/:n/surah/:m` | Same as `#/surah/:m` (Juz→Surah drill-down) |
| `#/surahs` | All demo surahs |
| `#/surah/:n` | Surah/Ayah reading screen, with the POS filter bar |
| `#/surah/:n/ayah/:m` | Same screen, scrolled to and highlighting ayah `m` |
| `#/word/:tokenId` | Resolves the token's Surah/Ayah, renders that screen, and auto-opens the word-detail overlay for it — this is what makes a word "shareable" as a direct link |
| `#/roots`, `#/root/:id` | Root index / Root detail (related lemmas + occurrences) |
| `#/lemmas`, `#/lemma/:id` | Lemma index / Lemma detail (fields + occurrences) |
| anything else | A clearly-labelled "not in the demo dataset" state, never a blank screen |

`QMRouter.init()` listens for both `hashchange` and the initial page load,
so a deep link (e.g. someone opens `#/word/2:2:7` directly, or hits
refresh on it) renders correctly from a cold start.

## 4. Rendering model

There is no virtual DOM and no component framework. Each `QMRender.renderX()`
function builds an HTML string from data (via `QMData`) and returns it;
`router.js` sets `#qm-view`'s `innerHTML` to that string. This is
deliberately simple and is enough for a prototype of this size — anything
dynamic *within* a screen after it's rendered (the filter bar's live
counts, the word-detail accordion) is wired up by the small `mount()`
callback each render function can optionally return.

Word links, nav links, breadcrumbs, and "View root"/"View lemma" links are
all plain `<a href="#/...">` tags — clicking them is native browser
navigation, not intercepted by JS. This is why so little event-wiring code
exists: hash navigation *is* the click handler.

## 5. Data flow & the "honest demo" pattern

`QM_JUZ` always has all 30 entries; only Juz 1 and Juz 30 are
`available: true`. The Home grid and Juz screens render every Juz exactly
the same way regardless of availability — an unavailable one just gets a
dimmed card and, if opened, an explanatory empty state with a link back to
a working demo Juz. This is deliberate: a 2-card grid would misrepresent
the product; a 30-card grid where 28 cards are dead links would look
broken. Rendering all 30 **and being honest about which are populated**
satisfies both constraints. The same pattern — show the real shape, mark
what's missing — is used for a surah's `demoAyahs` vs. its full `ayahCount`,
and for a lemma with zero token occurrences (`ittaqa-1`).

## 6. State management

`QMState` holds exactly five things: `currentRoute`, `selectedFilter`,
`selectedTokenId`, `detailOpen`, `searchTerm`. Nothing else is global
mutable state — everything else is either in the URL (the route) or
recomputed from `demoData.js` on each render via `QMData`. No state
library; a `Set` of subscriber callbacks is enough at this scale.

## 7. Future data replacement (the most important part)

**Goal: swap `js/demoData.js` for a real dataset without touching
`render.js`, `wordDetail.js`, `filters.js`, `router.js`, `navigation.js`,
or any CSS.**

This works because of one rule, held throughout the codebase: **no file
outside `js/data.js` ever reads `QM_TOKENS`, `QM_LEMMAS`, `QM_ROOTS`,
`QM_AYAHS`, `QM_SURAHS`, `QM_JUZ`, or `QM_SOURCE_REGISTRY` directly.**
Every other module calls one of `QMData`'s functions:

```
listJuz, getJuz, listSurahs, getSurah, getJuzForSurah,
listAyahsInSurah, getAyah, getToken,
getLemma, getOccurrencesForLemma, listLemmas,
getRoot, listRoots, getSource,
searchVocabulary, availablePosFilters
```

To bring in real data, a future stage can replace `demoData.js` with:

- the same flat global objects (simplest — no other file changes at all), or
- lazily-loaded, Juz-chunked JSON files fetched on demand, with `js/data.js`'s
  function *bodies* rewritten to `fetch()`/cache instead of reading an
  in-memory object — the **function signatures stay the same**, so nothing
  that calls `QMData.getAyah(...)` needs to change, or
- a real backend/API, with `js/data.js` becoming a thin fetch wrapper.

In every case, the UI, routing, filters, and word-detail rendering are
untouched. This is the acceptance test for this architecture: a correct
data-layer swap should only ever require edits inside `js/data.js` (and
possibly `js/demoData.js`'s replacement).

## 8. Accessibility

Skip link to main content; every interactive control is a real `<a>` or
`<button>` (never a `<div onclick>`); `:focus-visible` styling throughout;
`aria-expanded`/`aria-controls` on the word-detail accordions;
`role="dialog"`/`aria-modal="true"` on the detail overlay, with focus moved
to its close button on open and returned to the triggering element on
close; Escape closes the overlay; 44px minimum touch targets on buttons;
`prefers-reduced-motion` disables the overlay's slide/fade animation.

## 9. Deploying to GitHub Pages

1. Push this folder's contents to a GitHub repository.
2. In the repo's Settings → Pages, set the source to the branch/root
   containing `index.html` (no build step, no `dist/` folder needed).
3. GitHub Pages serves static files as-is; because routing is hash-based,
   every route works from a direct link and survives a refresh with zero
   server configuration.

## 10. Local development

No install step is required to view it. From this folder:

```
# any static file server works, e.g.:
python3 -m http.server 8000
# then open http://localhost:8000
```

Or open `index.html` directly with VS Code's **Live Server** extension.
Opening `index.html` via `file://` also works for a quick look, though a
local server is recommended (some browsers restrict `fetch`/font loading
from `file://`).

## 11. i18n architecture (v0.2 — English + Bahasa Melayu)

This was added as an incremental change on top of the Stage 1 architecture
above, not a rewrite. Every module listed in §2 keeps its original
responsibility; `QMI18n` is a new, small layer that the existing modules
call into instead of holding literal strings.

**Two kinds of translatable content, two different mechanisms:**

1. **UI chrome strings** ("Home", "Search", "No results found.", every
   field label, every button) live as translation keys in
   `js/translations/en.js` / `ms.js` and are resolved with
   `QMI18n.t("some.key", params)`. Keys are dot-paths into a nested object
   (`nav.home`, `detail.locationTemplate`); `t()` fills in `{placeholder}`
   params, falls back to English if the current language is missing a key,
   and — if the key is missing from *both* — logs a `console.warn` and
   returns the bare key, so a missing translation is visibly wrong in dev
   tools rather than silently blank in production.
2. **Multilingual data fields** (`lemma.gloss`, `root.coreField`,
   `ayah.translation`, `juz.note` — see DATA_SCHEMA.md §12) are resolved
   with `QMI18n.pick(field)` instead, since they're `{en, ms}` objects on
   the data itself, not translation-table keys.

Arabic Qur'anic text, Arabic word/root/lemma forms, and Arabic grammatical
terminology (اسم، فعل، جمع تكسير...) go through **neither** mechanism —
they are language-independent display data (the `ARABIC_TERMS` constant in
`js/wordDetail.js`, re-exported for `js/render.js`, plus the raw Arabic
fields already on the data model) and are rendered as-is regardless of UI
language. This is what makes "never translate Arabic grammatical
terminology" an architectural guarantee rather than a per-string rule to
remember.

**Static HTML chrome** (the text already sitting in `index.html` — nav
labels, search placeholders, the demo badge, aria-labels) is translated via
`data-i18n` / `data-i18n-placeholder` / `data-i18n-aria-label` attributes,
applied by `QMI18n.applyStaticTranslations()`. Everything *generated* by
`render.js`/`wordDetail.js`/`filters.js`/`navigation.js` just calls
`QMI18n.t()`/`.pick()` directly while building its HTML string — there's no
separate templating step.

**Language selection, persistence, and re-render flow:**

- The selected language is stored in `localStorage` (`qm-lang`), wrapped in
  try/catch so private-browsing mode degrades to "no persistence" instead
  of crashing. Default is English; `QMI18n.LANGS = ["en", "ms"]` is the
  only place the set of supported languages is declared.
- The switcher ("EN | BM" in the sidebar footer on tablet/desktop, "EN /
  BM" in the top bar on mobile — text only, no flags, per spec) is plain
  `[data-lang-switch="en"|"ms"]` buttons; `QMI18n` wires their clicks and
  toggles an `is-active` class, so the active language is always visually
  unambiguous.
- Switching language calls `QMI18n.setLang()`, which stores the choice,
  updates `document.documentElement`'s `lang` attribute (`dir` always stays
  `"ltr"` — see below), re-applies static-chrome translations, and fires a
  `qm:langchange` `CustomEvent`.
- `main.js` listens for `qm:langchange` and calls `QMRouter.parseAndRender()`
  to re-render the current route from scratch in the new language (cheap,
  since every render function is already a pure function of `QMData` +
  `QMI18n`), then — unless the current route *is* `#/word/:id` (which
  already re-opens the panel fresh as part of its own render) — refreshes
  the word-detail overlay in place if one is open, via a small
  `QMDetailOverlay.refresh()` that re-renders its content without changing
  focus or open/closed state.
- No route, component, or module needs special "does this re-render on
  language change" logic beyond that one listener, because nothing caches
  rendered HTML — every screen is already rebuilt from data on every
  `parseAndRender()` call.

**RTL stays scoped, never global:** switching to Bahasa Melayu (or back to
English) never sets `dir="rtl"` on the document — both UI languages are
LTR. Only Arabic content (`.qm-arabic`-scoped elements, which already
existed in Stage 1 for Qur'anic text, Arabic terms, and root letters) is
right-to-left, via its own CSS rather than a document-level `dir` flip.
This means a BM screen reading left-to-right can still correctly show an
inline right-to-left Arabic phrase — the two directions coexist per
element, not per page.

**Adding a third language later** means adding `js/translations/xx.js` and
one entry in `QMI18n`'s `LANGS`/`DICTS` — no other module changes, because
every module already calls `QMI18n.t()`/`.pick()` instead of holding
strings. (Per the current product scope, no third language is implemented
in v0.2 — this is a note on extensibility, not a roadmap commitment.)
