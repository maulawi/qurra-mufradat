# QURRA Mufradat: Stage 3 (real content acquisition and population)

> **Principle unchanged:** unresolved data stays unresolved. This stage populated everything that has a verified, licensed source (the complete Qur'anic text, structure and tokens) and left everything else explicitly unresolved.

## 1. What changed in one paragraph

The official Tanzil text (v1.1) and Tanzil metadata (v1.0) were downloaded, their licence terms read, and the Stage 2 pilot diffed against them. The complete Qur'an (114 surahs, 6,236 ayahs, 77,441 word tokens) is now in the dataset, verbatim. Morphology, lemmas and roots were **not** extended: no cleared source exists, so 99.94% of tokens are shown as "not yet analysed". The 9-ayah pilot analysis (hand-written, provisional) is unchanged. The Stage 2 architecture was kept; two scale adjustments were made (§6).

## 2. Workstream A: official text verification

| Item | Result |
|---|---|
| Source | https://tanzil.net/download/ (official), Tanzil Quran Text, Uthmani, **version 1.1**, file header copyright 2007-2026 |
| Licence (read from https://tanzil.net/docs/Text_License and the file header) | CC BY 3.0: verbatim copies only, changing the text is not allowed; source (Tanzil Project) must be clearly indicated with a link to tanzil.net; the copyright block must be kept and reproduced in derived files |
| How obtained | The download form requires ticking an "I agree" terms checkbox. That was done on QURRA's behalf **after you approved it explicitly**. Parameters: `quranType=uthmani`, `outType=txt-2`, all optional symbols off (no pause marks, sajdah signs, rub-el-hizb signs or tatweel) |
| Files kept verbatim | `data/raw/tanzil/quran-uthmani.txt` (SHA-256 `bf4f57b9...12c6b63`, see sources.json; includes the copyright block), `data/raw/tanzil/quran-data.js` (SHA-256 `9e9930c5...bac4ca4`) |
| Licence status recorded | `TANZIL_TEXT` and `TANZIL_METADATA`: `verified`, with the obligations listed in `data/sources.json` |

**Differences found in the Stage 2 pilot (all 9 ayahs diffed against the official file):**

| Comparison | Result |
|---|---|
| Pilot vs the official file with the options used here | 8 of 9 ayahs identical. **105:1 differs only because the official line starts with the basmala** (`بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ` + the ayah). |
| Pilot vs the official **default** download (pause marks, tatweel, sajdah signs on) | 6 of 9 differ: 1:1, 1:2, 1:3, 1:4 and 105:1 contain a tatweel before the dagger alef (e.g. `ٱلرَّحْمَـٰنِ`), 2:2 additionally has two pause marks (`ۛ`), 105:1 also the basmala prefix. 1:5, 1:6, 1:7 are identical. |
| Corrections needed to the pilot data | **None to the text.** The pilot text is a valid official variant; provenance is now the official file instead of a third-party mirror. |
| Whole Qur'an: the Hugging Face mirror used in Stage 2 vs the official file | Identical for all 6,236 ayahs after the basmala header is separated. The only unexplained detail is in the *official* file: the basmala prefix of 95:1 and 97:1 is spelled with an extra shadda (`بِّسْمِ`); the ayahs themselves are identical. |

**Findings about the official file** (recorded in `data/sources.json` and enforced by the validator): the basmala is prefixed onto ayah 1 of every surah except 1 and 9 (110 lines, two spellings). `data/qurra/ayahs.json` separates it as `source_prefix: "basmala"`; the validator proves `prefix + " " + text` reproduces the official line exactly, so nothing is lost or edited. Pause marks are not included, by choice (a Tanzil-supported option, keeps word tokens clean); they can be re-added from a new official download.

**Full text imported: YES** (licence permits it; attribution is displayed in the app footer and the Source panel).

## 3. Workstream B: structural metadata

- `data/meta/surahs.json`: all 114 surahs from the official metadata (Arabic name, Tanzil transliteration, English meaning, ayah count, revelation place and order). `name_ms` stays null (proper names are not translated).
- `data/meta/juz.json`: all 30 juz **start positions** from the official metadata; nothing else about juz is stored. Which ayah is in which juz, and which surahs a juz contains, are derived at build time (no ranges in application code).
- Provenance `TANZIL_METADATA`. The validator cross-checks every surah (name, transliteration, ayah count, revelation place and order) and every juz start against the verbatim `quran-data.js`.
- Surah transliterations are now Tanzil's (`Al-Faatiha`, not the Stage 1 `Al-Fatihah`). This is a visible change.

## 4. Workstream C: full tokenisation

- Rule (`scripts/lib/tokenize.js`, the single definition): a token is one single-space-delimited word of the canonical ayah text; `token_id = surah:ayah:position`.
- **77,441 tokens**, deterministic (`node scripts/export-tokens.js out.csv` twice gives byte-identical output; SHA-256 of the CSV is reproducible).
- Token ≠ Form: only the 43 analysed tokens have a Form (`data/qurra/token-forms.json`); the same surface text elsewhere is a different token with no analysis. Surface text is never an identity.
- Validation: duplicate/missing/non-contiguous positions, broken ayah references, malformed ids, token/ayah text mismatch, token-form references.

## 5. Workstreams D, E: morphology, lemmas, roots (licensing gate)

Nothing was imported. `data/sources.json` marks MASAQ, QuranMorph, QAC and Wikidata `in_use: false` / `unresolved`, and the validator rejects any record that cites them. So:

| Layer | State |
|---|---|
| Forms / segments | 40 forms, 66 segments (24 multi-segment forms; two with three segments) for the 43 pilot tokens. All 77,398 other tokens: no form. |
| Lemmas | 36, all `provisional` (QURRA-authored Stage 1 demo). No new lemma was created. |
| Root assignments | 36 lemmas: 26 `provisional`, 8 `null_policy`, 1 `unresolved` (اللَّه), 1 `disputed` (اسْم). Roots: 23, all `provisional` placeholders. **0 verified, 0 reviewed.** |
| Root protocol | **Pending expert review, not frozen.** The review package stays in `docs/expert-review/` and has not been sent. |

## 6. Architecture adjustments (not a redesign)

1. **Tokens are derived, not stored.** Storing 77k token records would have added ~5 MB of repetitive source files. The token layer is a deterministic function of the ayah text plus the small `token-forms.json`; the validator materialises all tokens and applies the same checks as before. `form_id` is now nullable on tokens.
2. **Compact raw/normalised separation.** `ayahs.json` has one record per line and inherits `defaults`; the generated dataset carries the ayah text once, and the search index carries two normalised variants of each ayah (matching only, never displayed).
3. **Search normalisation: dagger alef.** Uthmani spelling writes some long ā as a dagger alef (`كِتَٰب`) and not others (`الرحمن`); typed queries follow ordinary spelling. Two variants are indexed (dagger dropped / dagger as alef) so both `كتاب` and `الرحمن` match. Found by a failing test.
4. **Instant scroll to a deep-linked ayah** (was smooth): smooth-scrolling a 54,000 px page took seconds.

## 7. Workstream F: QURRA gloss layer

36 glosses (EN 36, BM 36), all `provisional`, source `QURRA_GLOSS`, kept in separate fields: `lexical`, `contextual_explanations[]`, `learner_note`, `usage_note` (new, null everywhere), `example`, `editor_note`. **No new glosses were authored:** a gloss attaches to a lemma and no new lemma may be created without a cleared source; inventing lemmas to hang glosses on would manufacture analysis. The structure is ready; the controlled batch of 36 is the existing Stage 1/2 drafts, unreviewed and labelled.

## 8. Search

Searchable, where data exists: Arabic words of the whole Qur'anic text (normalised, dagger-alef tolerant, leading ال tolerant), phrases (return ayahs), lemma forms, provisional root letters, English and BM glosses (lemmas, roots), surah names (Arabic and loose transliteration), ayah references (`2:255`). Not indexed: unresolved/disputed/null roots, hidden glosses, null values. Deterministic order (Qur'an order); results capped at 20 with structured results reserved 12 slots so a common word cannot crowd out lemma/root/surah hits.

## 9. Validation

`node scripts/build.js` (about 40 s, almost all of it the 45 mutation tests): validate (0.7 s) → validator tests (45) → generate (1 s) → data-layer tests (40) → syntax check of 25 JS files. New checks: 114 surahs, 6,236 ayahs, per-surah counts and Qur'an order without gaps, every ayah equals the official line, copyright block present, metadata equals the official metadata, token positions/ids, token-form references, basmala separation. 0 failures, 3 warnings (two reminders that a `verified` licence is only as wide as its stated terms; one lemma with no occurrences).

## 10. Performance (static architecture kept; no backend)

| Measure | Result |
|---|---|
| Generated JS | dataset 1.98 MB + index 1.52 MB raw; **gzip 357 KB + 393 KB** (GitHub Pages serves gzip) |
| Initial load (local, uncompressed, Edge) | DOMContentLoaded 210 ms @1440, 70 ms @360 |
| Surah 2 (286 ayahs, 6,117 words) render | 620 ms @1440, 520 ms @360 |
| Search (word across the Qur'an) | 1-3 ms |
| Word-detail render | under 1 ms |
| JS heap | 15-20 MB |

No bottleneck requiring a redesign. The largest cost is DOM construction for a 6,000-word surah page (acceptable; virtual scrolling would be the first lever if needed).

## 11. Production readiness

**READY:** the Qur'anic text, 114-surah and 30-juz metadata, ayah ids, the token layer, text provenance and attribution, the validator/build pipeline, search over the full text, the unanalysed-word UI.
**PROVISIONAL (labelled in the UI):** all segmentation/morphology, lemmas, glosses, conjugation forms, ayah renderings and the 23 placeholder roots for the 9 pilot ayahs.
**UNRESOLVED:** lemma, morphology and root for 77,398 tokens; `اسْم` (disputed) and `اللَّه` (unresolved) roots.
**BLOCKED:** a cleared morphology/lemma source (MASAQ, QuranMorph unresolved; QAC and Wikidata not permitted); the frozen root protocol and expert review; pause marks/sajdah signs (not included by choice).

## 12. Honest limits

- "Verified" for `TANZIL_TEXT` means: official source, terms read, and complete byte-for-byte reproduction by the validator. It is not a statement about any other layer and not legal advice.
- The licence click-through was accepted on QURRA's behalf with your approval; that is a decision to record.
- The 9-ayah analysis predates the root protocol and is not scholar-reviewed.
