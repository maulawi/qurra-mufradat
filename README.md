# QURRA Mufradat al-Qur'an (مفردات القرآن)

A vocabulary-and-morphology reference for the words of the Qur'an —
organized Juz → Surah → Ayah → Word, with every word breakable down into
its segmentation, lemma, and root. Part of the QURRA product family
(alongside QURRA Grammar).

**This is NOT:** a grammar parser, an i'rab/case-analysis tool, a tafsir
app, a full-text search engine, a flashcard/quiz app, or a complete
morphological database. See ROADMAP.md for what those would be.

## Current stage

**Stage 1 — Frontend architecture + UI prototype, v0.2: Bahasa Melayu
support.**

This is a working, clickable prototype that establishes the application's
architecture, routing, components, data model, and visual identity — with
a small, clearly-labelled **demo dataset**, not the complete Qur'an. See
"What this is / isn't" below, and ROADMAP.md for what comes after this
stage.

As of v0.2, the UI is fully bilingual: **English (default) and Bahasa
Melayu**, switchable at any time via the "EN | BM" (desktop) / "EN / BM"
(mobile) language switcher. The choice persists across page reloads
(`localStorage`). Qur'anic text, Arabic word/root/lemma forms, and Arabic
grammatical terminology (اسم، فعل، جمع تكسير...) are never translated —
they're language-independent and display identically regardless of UI
language. See **ARCHITECTURE.md §11** for the i18n architecture and
**DATA_SCHEMA.md §12** for how the data model supports it.

## How to run locally

No install step is required — this is plain HTML/CSS/JavaScript with no
build process.

**Option A — VS Code Live Server (recommended):**
1. Open this folder in VS Code.
2. Install the "Live Server" extension if you don't have it.
3. Right-click `index.html` → "Open with Live Server".

**Option B — any static file server:**
```
python3 -m http.server 8000
# then open http://localhost:8000 in a browser
```

**Option C — open `index.html` directly.** Works for a quick look, though
a local server is recommended (some browsers restrict font loading from
`file://`).

## How to deploy to GitHub Pages

1. Push this repository to GitHub.
2. In the repo's **Settings → Pages**, set the source to the branch and
   root folder containing `index.html`.
3. That's it — no build step. The app uses hash-based routing
   (`#/surah/2/ayah/2`), so every route works as a direct link and survives
   a page refresh with zero server configuration.

## Project structure

```
qurra-mufradat/
├── index.html              # App shell: nav, main view target, detail overlay, script tags
├── README.md                # This file
├── ARCHITECTURE.md          # Routing, rendering, state, data flow, future data replacement
├── DATA_SCHEMA.md           # Token/Segment/Lemma/Root model, field reference, provenance
├── ROADMAP.md                # Stage 1 → Stage 9 outline
├── css/
│   ├── tokens.css           # Design tokens: color, type, spacing, shadow, motion
│   ├── base.css              # Resets, Arabic text defaults, badges, focus states
│   ├── layout.css            # App shell: sidebar, topbar, bottom nav, page scaffolding
│   ├── components.css        # Buttons, cards, search, filters, the detail overlay, accordions
│   ├── vocabulary.css        # Hero, ayah/word display, word-detail content, root/lemma pages
│   └── responsive.css        # Breakpoints (390 / 768 / 1280px) and the mobile bottom sheet
├── js/
│   ├── translations/
│   │   ├── en.js                   # QM_I18N_EN — every UI string, English
│   │   └── ms.js                   # QM_I18N_MS — every UI string, Bahasa Melayu
│   ├── i18n.js                 # QMI18n — translation engine, language persistence, switcher wiring
│   ├── state.js               # QMState — tiny global UI state (filter, detail panel, search)
│   ├── demoData.js            # The demo dataset — the ONE file a real dataset would replace
│   ├── data.js                 # QMData — the repository layer; the only consumer of demoData.js
│   ├── filters.js              # QMFilters — the All/Noun/Verb/Particle chip bar
│   ├── wordDetail.js           # QMWordDetail — the progressive-disclosure word panel
│   ├── render.js                # QMRender — one function per screen
│   ├── navigation.js            # QMNavigation — active nav state, search-as-you-type
│   ├── router.js                 # QMRouter — the hash router
│   └── main.js                    # Bootstrap + the word-detail overlay (open/close/focus/Escape)
└── assets/                   # (reserved — no binary assets shipped in this stage)
```

## Architecture overview

Vanilla JS, no framework, no bundler. Each `js/*.js` file defines one
global module (an IIFE assigned to a `const`), loaded via classic
`<script>` tags in dependency order. Screens are rendered as HTML strings
from data (via a `QMData` repository layer) and inserted into the page;
navigation is native hash-link navigation, not an intercepted click
handler. Full detail in **ARCHITECTURE.md**.

## Demo data

`js/demoData.js` contains a small, hand-authored dataset covering Surah
Al-Fatihah (complete), Surah Al-Baqarah ayah 2, and Surah Al-Fil ayah 1 —
23 roots, 36 lemmas, 43 tokens. It was chosen specifically to demonstrate
every part of the data model: a simple noun, plural nouns (sound and
broken), a derived noun, verbs (including one with a withheld conjugation
form), a particle whose function is genuinely contextual, a segmented word
(including a documented spelling-fusion case), a root with multiple
lemmas, and a lemma with multiple occurrences. **It is explicitly demo
data — it does not represent or imply coverage of the complete Qur'an**,
and every piece of scholarly content (glosses, root fields, conjugations)
is traceable to a source-registry entry that honestly states it is
unverified demo content. Full explanation in **DATA_SCHEMA.md**.

## What's functional in this prototype

- Home screen with hero, CTAs, and a full 30-card Juz grid (2 populated, 28 honestly marked "not yet available")
- Juz → Surah → Ayah navigation, and a direct Surahs/Roots/Lemmas index
- Clickable Qur'anic word → five-level progressive-disclosure word detail panel (drawer on mobile, side panel on desktop)
- Root pages (related lemmas + Qur'anic occurrences) and Lemma pages (fields + occurrences)
- A working All/اسم/فعل/حرف filter that only ever shows options the current data actually supports
- A lightweight search across surface forms, lemma forms, and root letters
- Full hash routing — every screen is a direct, refresh-safe link
- Responsive layout (tested at ~390 / 768 / 1440px) with no horizontal overflow
- RTL Arabic rendering throughout, alongside an LTR English/Malay UI (never a full-page RTL flip)
- Bilingual UI (English default, Bahasa Melayu), persisted across reloads, with every learner-facing string centralized behind a translation layer — see ARCHITECTURE.md §11
- Keyboard accessibility, focus states, and `prefers-reduced-motion` support

## What is intentionally demo-only / not implemented

- Only 3 surahs and 9 ayahs carry real token data — not the complete Qur'an
- Segmentation is hand-authored sample data, not an algorithm
- Verb conjugations only display when marked `stored_verified`/`stored_verified_partial`; otherwise the UI honestly withholds them
- No i'rab / grammatical case — deliberately excluded from this product stage
- No "regular/irregular" root classification — replaced with the traditional soundness taxonomy (sahih/ajwaf/naqis/mudaaf/lafif)
- No backend, database, authentication, or API
- No login, flashcards, quizzes, spaced repetition, gamification, AI chat, tafsir, or deep lexicon
- No third UI language (e.g. Arabic UI, Indonesian) — only English + Bahasa Melayu in this stage, though the i18n layer is designed to add one later without rewriting components (ARCHITECTURE.md §11)

## Known limitations

- Every token in the demo dataset is grammatically masculine — no feminine example yet (see DATA_SCHEMA.md §11)
- Search is a simple substring match, not fuzzy or diacritic-normalized beyond basic stripping
- `src-raghib-mufradat` exists in the source registry as a named placeholder for a future source and is not actually attached to any content yet

## Next development stages

See **ROADMAP.md** for the full Stage 2–9 outline (scholarly data
ingestion pipeline, full Qur'an coverage, real search, expanded filters,
source citations, learner-facing enhancements, and QURRA ecosystem
integration). None of these are started in this delivery.
