# V1 content contract

What "covered" means for each layer of a QURRA word and ayah, and what may be shown when it is not. The contract is enforced by `scripts/lib/validate.js` and measured by `docs/V1_COVERAGE_REPORT.md` (generated).

Chain: Qur'an → Surah → Ayah → Token → word/segment breakdown → lemma → root → word meaning → full-ayah translation → EN + BM → searchable.

## Statuses

| Status | Meaning |
|---|---|
| complete | every record in scope has a value |
| partial | some records have a value; the rest are *missing*, never filled |
| unavailable | no cleared source exists; the field is absent |
| unresolved | evidence or alignment is insufficient; no value asserted |
| provisional | a value exists, QURRA-authored or imported, not reviewed; labelled in the UI |
| licensed | the source is CLEAR and its attribution is recorded |
| not-cleared | the source is not CLEAR; nothing from it is in the data |

A missing value stays missing. No layer is filled to raise a percentage.

## Per-layer contract

| | Layer | V1 requirement | Today | Source |
|---|---|---|---|---|
| A | Qur'anic text | all 6,236 ayahs, verbatim, never edited | complete | Tanzil (CC BY 3.0) |
| B | Ayah metadata | surah/ayah/juz, names, counts, revelation | complete | Tanzil metadata |
| C | Tokenisation | every ayah split by the single rule in `scripts/lib/tokenize.js`; id `surah:ayah:pos` | complete (77,441 tokens) | derived from A |
| D | Word/segment breakdown | forms with proclitic/stem/enclitic segments | partial: about four fifths of all tokens (pilot + rule-based defaults), the rest honestly unanalysed | QURRA, provisional (`docs/word-analysis-method.md`) |
| E | Lemma | on the stem segment of a form | partial: ~580 lemmas | QURRA lexicon, provisional |
| F | Root | only where legitimately supported; status, candidates, evidence kept | partial/provisional (most lemmas of the lexicon); protocol **not frozen**; disputed/unresolved roots are never shown, never searchable | QURRA lexicon, provisional |
| G | Word meaning (EN) | lexical gloss per lemma, separate from contextual translation | partial: every analysed word | QURRA lexicon, provisional |
| H | Word meaning (BM) | as G | partial: every analysed word | QURRA lexicon, provisional |
| I | Ayah translation (EN) | any cleared full edition, verbatim, per-ayah | partial: 6,228 of 6,236 ayahs (Pickthall 1930) | public domain |
| J | Ayah translation (BM) | a cleared edition | unavailable: none is cleared | none |
| K | Searchability | every shown value, deterministic at build time | complete for text, surah names, lemma/root/gloss values shown, published translations | generated |
| L | Provenance | `source_id` (+ version, ref) on every imported or authored record | complete for existing records | validator |
| M | Licensing | every source has a gate record; only CLEAR is bundled | enforced | validator |

## Rules that make the contract binding

1. **Gate.** Every source in `data/sources.json` has `clearance` (CLEAR / CONDITIONAL / UNCLEAR / NOT_CLEARED) and a full `gate` record (commercial use, redistribution, static bundling, derivatives, attribution, modification, third-party material, upstream, decision, reason). The validator rejects CLEAR without licence text and URL (QURRA-authored `QURRA_*` sources are exempt from the URL), a non-CLEAR source in use, and a decision of USE for anything not CLEAR.
2. **Translations are editions.** `data/translations/editions.json` registers each edition (id, language, translator, source, version, clearance, scope, status, published). The validator rejects an edition whose source is not CLEAR and in use, duplicate edition ids, duplicate or orphan ayah ids, empty text, and any published edition that is not CLEAR or is a draft.
3. **Alignment gate.** An ayah is imported only if source and QURRA agree on its (surah, ayah) identity and the source holds exactly one text entry for it. Missing, extra, duplicate, merged and renumbered verses are reported in the edition's alignment file and left **without text**; the validator fails if an unresolved ayah carries text, or if a full edition lacks text for an ayah that is not listed as unresolved.
4. **Gloss ≠ translation.** A gloss is the lexical meaning of a lemma. A translation is a rendering of a whole ayah. They live in different files and different UI blocks and are never derived from each other.
5. **No generation.** Nothing is machine-translated, and no translation, root, lemma or segmentation is written to fill a gap.
6. **Display policy.** `data/taxonomy.json` `display_policy` decides what a learner sees per layer and status; the search index only contains values that policy shows.
7. **Static.** Everything is plain files plus generated JavaScript. No backend, database, account or API.

## Per-token answerability

`QMData.getToken(id)` always returns the ayah, canonical surface form, status and a `coverage` object saying, for each of text / form / lemma / root / English gloss / Malay gloss, whether the value is available, or `unavailable` / under review / not applicable. Search keys are derived at build time from the canonical text. A word with no analysis says so; it never shows a guessed part of speech or root.

## Data layout

```
data/raw/            sources kept verbatim (Tanzil). Never edited.
staging/             downloaded third-party files (git-ignored), identified by SHA-256
data/translations/   editions.json, <edition>.json, <edition>.alignment.json
data/qurra/          QURRA-authored and reviewed layers
js/generated/        dataset.js, search-index.js, translations.js (built; never edited)
scripts/import/      one importer per cleared source
scripts/lib/         ayah-alignment.js, token-alignment.js, validate.js, ...
scripts/report/      coverage.js, source-research.js (generated docs, with --check)
```

A new source is added by (1) recording its gate in `data/sources.json`, (2) if CLEAR, an importer under `scripts/import/` that checks the raw file's SHA-256, aligns by identity, and writes the edition plus an alignment report, (3) `node scripts/build.js`.
