# QURRA Mufradat al-Qur'an — Roadmap

This roadmap sketches the stages between this prototype and a full
product. **Only Stage 1 is built.** Nothing below it has been started, and
nothing past it should be inferred as promised or scheduled — it exists to
give later work (by a developer, or by Claude Code in a future session)
a sense of direction without over-committing this stage to decisions that
haven't been made yet.

### Stage 1 — Frontend architecture + UI prototype *(this delivery)*
Application shell, hash routing, the repository/data-access layer, a small
hand-authored demo dataset, and every core screen (Home, Juz, Surah/Ayah,
word detail, Root, Lemma), styled to the QURRA visual identity, responsive,
and RTL/accessibility-aware. No real Qur'an data pipeline, no backend.

### Stage 2 — Scholarly data ingestion pipeline
Design and build the actual process for producing verified
root/lemma/token/segmentation/morphology/conjugation data at scale —
almost certainly a mix of an established morphological corpus, editorial
review, and the verified-conjugation gating pattern already modelled in
Stage 1 (`generationMethod`). This is real scholarly and engineering work,
not a UI task, and deliberately was not started in Stage 1.

### Stage 3 — Full Qur'an coverage
Once the pipeline exists, progressively populate all 30 Juz — likely Juz
by Juz, matching the `juz.available` flag already present in the Stage 1
data model, so partial progress is always representable without a schema
change.

### Stage 4 — Real search
Replace the lightweight substring search (`QMData.searchVocabulary`) with
something that scales to the full dataset — likely a prebuilt index rather
than a linear scan — while keeping the same function signature so nothing
calling it has to change.

### Stage 5 — Expanded filters
Once real data carries frequency counts, verb-form distributions, and
broader root-type coverage, add the secondary filters the blueprint
anticipates (root type, verb form, frequency) — gated, as in Stage 1, by
`QMData.availablePosFilters`-style checks so a filter is never shown
without real data behind it.

### Stage 6 — Source citations
Replace the current placeholder `QM_SOURCE_REGISTRY` entries with real,
verifiable citations once actual sources (a published mufradat work, a
verified morphological dataset, editorial review) have genuinely been
consulted — never earlier than that.

### Stage 7 — Learner-facing enhancements
Candidates (not commitments): saved/bookmarked words, a personal glossary,
light progress indicators — stopping well short of gamification,
flashcards, or spaced repetition, which the product's own scope
(§"DO NOT OVERBUILD" in the Stage 1 brief) explicitly excludes unless a
future stage deliberately revisits that decision.

### Stage 8 — Feminine and broader morphological coverage
Stage 1's demo dataset is entirely grammatically masculine (a known,
documented gap — see DATA_SCHEMA.md §11). Any expansion of the dataset
should close this before claiming broad morphological coverage.

### Stage 9 — QURRA ecosystem integration
Cross-linking between QURRA Mufradat and QURRA Grammar (and, longer-term,
Hifz Lab) — for example, a word-detail card linking out to the relevant
QURRA Grammar concept for a given morphological feature. Depends on both
products' data models stabilizing first; not attempted in Stage 1 beyond
sharing the same general technology pattern (static HTML/CSS/JS, hash
routing, GitHub Pages, VS Code + Claude Code workflow).

---

**Explicitly out of scope until a stage above says otherwise:** login,
backend, database, authentication, payment, admin dashboard, CMS,
analytics, gamification, flashcards, quizzes, spaced repetition,
memorization tools, AI chat, a deep lexicon, tafsir, i'rab/grammatical
case, and any "regular/irregular" root classification.
