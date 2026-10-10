# V1 content roadmap

Ranked by what a learner gains. The product is the chain **Juz → Surah → Ayah → Word → Word analysis**, so word analysis comes first; translation work is second. Current figures: `docs/V1_COVERAGE_REPORT.md` (generated). Method: `docs/word-analysis-method.md`.

## P0: make the word panel useful for more words, more correctly

1. **Expert review of the unresolved queue.** V1 has complete word-analysis coverage (every token has a record), but 1,473 tokens (1,419 spellings) are explicit *unresolved* records in `data/qurra/review/unanalysed-spellings.json` (historical file name). Broad vocabulary expansion is finished for V1; these records go to expert review rather than being guessed. See `docs/word-analysis-method.md`.
2. **Per-verse disambiguation of the defaults.** The rule-based analysis reads each spelling the same way everywhere. The words where this matters most are listed in the lexicon as `prefer` rules (*ma*, *in*, *la*, *ahsan*, ...). A context layer (an `analysis_set` per verse for the few hundred most common homographs) would fix them without touching the rest.
3. **Review the generated lemmas and meanings.** Everything is provisional. A reviewer can work lemma by lemma (one lemma = all its words); status moves from `provisional` to `reviewed` in the data and the panel changes its label automatically.
4. **Malay ayah translation.** No Malay translation is cleared (see `docs/content-source-research.md`). Needs a licence (written permission) or a commissioned, QURRA-owned translation.

## P1: depth

5. **Roots.** About 444 lemmas carry a provisional root, 18 are disputed and 42 unresolved (not shown, not indexed). The root verification protocol is not frozen; freezing it unlocks `reviewed` roots.
6. **Resolve the pilot conflicts** (`docs/expert-review/`). Not started.
7. **Eight Pickthall ayahs** merged under one verse number in the transcription: hand split against a print edition, or leave without text.
8. **Word meanings in context** (as distinct from lexical glosses), after glosses are reviewed.
9. **Mood and case** in morphology (undecided in `docs/morphology-conventions.md`).

## P2: polish

10. Classical lexicon links (Lane) as references, not copied text.
11. A second public-domain English translation for comparison.
12. Per-surah / per-Juz "most frequent words" study lists built from the analysed tokens.
