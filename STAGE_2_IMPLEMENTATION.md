> **Updated by Stage 3 (see STAGE_3_REPORT.md).** The architecture below still holds. Changes: the text now comes from the **official** Tanzil file (`data/raw/tanzil/`), covers all 6,236 ayahs and is `verified`; tokens are derived from the ayah text (stored only as `token-forms.json` for analysed tokens, `form_id` may be null); surah/juz metadata come from `TANZIL_METADATA`; ayah `juz` is derived. Counts below describe the 9-ayah pilot analysis only.

# QURRA Mufradat: Stage 2 implementation (content foundation)

> **Principle: unresolved data must remain unresolved; the system must not manufacture certainty.**
> A field that cannot be filled with defensible provenance is `null` with a status, never a guess.
> Statuses decide what a learner sees; they are enforced by data (`data/taxonomy.json`), not by scattered conditionals.

This stage replaced the hand-typed Stage 1 demo dataset with a real, validated, provenance-carrying data pipeline, using the existing 9-ayah pilot. It does **not** import the Qur'an, and it does **not** make any root authoritative.

## 1. Architecture at a glance

```
data/                      hand-editable SOURCE data (what you edit)
  sources.json             source registry (licence status, allowed use)
  taxonomy.json            all coded values + status/display policy
  raw/                     verbatim source extracts (never edited)
  meta/                    surahs.json, juz.json (juz -> starting ayah)
  qurra/                   normalised QURRA records
scripts/                   validate -> build -> test (Node, no dependencies)
js/generated/              GENERATED browser files (never edited)
  dataset.js               QM_DATASET
  search-index.js          QM_SEARCH_INDEX
js/data.js                 the only code that knows stored shapes (QMData)
js/normalize.js            Arabic search normalisation, shared by build and browser
```

Pipeline: `data/ → validate → js/generated/ → app`. The app is still a static page (no fetch, no backend): it loads the two generated files with `<script>`, so it works from `file://` and GitHub Pages and keeps a synchronous data API.

Run: `node scripts/build.js` (or `npm run build`). It validates, runs the tests, regenerates `js/generated/*`, and syntax-checks all JS. `npm run check` fails if generated files are stale.

## 2. Data model

Qur'an → Surah → Ayah → **Token** → **Form** → **Segment(s)** → **Lemma** → **Root**

| Entity | File | Id format | Notes |
|---|---|---|---|
| Surah | `meta/surahs.json` | `s001` | Only the 3 pilot surahs are present. `name_ms` is null: surah names are proper nouns and are not translated. |
| Juz | `meta/juz.json` | `1`..`30` | Stores the **starting ayah** only. Which ayah is in which juz, and which juz are "available", are derived. |
| Ayah | `qurra/ayahs.json` | `1:2` | `text` is canonical, verbatim, and must equal the raw source and the joined token texts (validated). |
| Token | `qurra/tokens.json` | `1:2:3` | One written word at one position. Points at a Form. Not a Form. |
| Form | `qurra/forms.json` | `frm-<lemma>-<8hex>` | A shared analysis (segments + morphology). Identical analyses are shared; the same surface with a different analysis is a different Form. |
| Segment | inside a Form | `<form_id>.s<n>` | `proclitic` / `stem` / `enclitic`. **A form may hold any number of stems.** `lemma_id` lives on **stem segments** and may be `null`. |
| Lemma | `qurra/lemmas.json` | `rahman-1` | Dictionary form. Carries a **root assignment** (below). |
| Root | `qurra/roots.json` | `root-r-h2-m` | Letters, canonical display, root type, core field. |
| Gloss | `qurra/glosses.json` | `gloss-<lemma>` | Lexical gloss, contextual explanations, learner note, example, editor note: kept as separate fields. |
| Ayah rendering | `qurra/ayah-translations.json` | by ayah | QURRA working rendering, labelled non-authoritative. |

**Root assignment.** A lemma's `root` is an assignment, not a bare id: `{ root_id | null, status, candidates[], rule_ids[], evidence[], review?, provenance }`. The evidence and status belong to the *assignment*; the Root entity only holds the letters and description.

**Deliberate separations:** Token ≠ Form (many tokens share a Form); Form ≠ Lemma (a stem points at a lemma, possibly none); Lemma ≠ Root (an assignment with its own status).

**Ids** are ASCII-safe (`[A-Za-z0-9._:-]`), deterministic and stable. No id is a displayed Arabic string or an array index. Form ids are `frm-<lemma-or-x>-<first 8 hex of sha1 of the analysis>`, generated once and then stored (editing an analysis later does not silently change an id). Root ids come from QURRA's own letter table in `taxonomy.json`, not any corpus's transliteration.

**Text.** Canonical text is only ever read from `text` fields. Search normalisation lives in `js/normalize.js` and in the generated index (`ar` keys); it is never displayed.

## 3. Source registry and provenance

`data/sources.json` registers every source with `licence`, `licence_status` (`verified | conditional | unresolved | internal | provisional`), `in_use`, `allowed_use`, `notes`. Entries with `in_use: false` (MASAQ, QuranMorph, QAC, Wikidata) are registered only so their absence is explicit; **the validator rejects any record that cites a source with `in_use: false`**. No source is marked commercially cleared, because research has not established that for any of them.

Provenance is entity-level (`provenance: { text: { source_id } , ... }`) with field-group granularity where it matters (ayah text; form morphology; lemma; gloss; conjugation; root letters vs core field). The word-detail "Source information" panel lists the sources behind what is shown, with their licence status.

## 4. Statuses and learner display

Statuses: `imported`, `draft`, `provisional`, `reviewed`, `verified`, `disputed`, `unresolved`, `null_policy`.

`taxonomy.json → display_policy` maps (layer, status) → `show | show_with_badge | under_review | not_applicable | hide`. `js/data.js` applies it, so a hidden root is absent from every view and from the search index. Defaults:

| Root status | Learner sees |
|---|---|
| `verified`, `reviewed` | the root |
| `provisional` | the root **with a visible "Provisional" badge and note** |
| `disputed`, `unresolved` | "Root under review" (no value, not searchable) |
| `null_policy` | "No root is assigned for this kind of word." |
| `draft`, `imported` | nothing |

Changing one value (e.g. `root.provisional` to `hide`) and rebuilding hides all provisional roots everywhere; `scripts/tests/test-data-layer.js` proves this.

## 5. Validation rules (`scripts/lib/validate.js`)

The build fails (non-zero exit) on: duplicate ids; non-ASCII-safe ids; missing required fields; unsupported status; unknown or not-in-use `source_id`; a token whose `form_id` does not exist; a form whose stem `lemma_id` does not exist; a lemma whose `root_id` does not exist; duplicate or non-contiguous token positions; `token_id` not equal to `<ayah_id>:<position>`; malformed Arabic (non-Arabic characters, bad spacing, U+FFFD); ayah text that differs from the raw source extract or from its tokens joined; a form whose segments do not add up to its surface (unless a `segmentation_note` documents the orthographic fusion); juz that disagrees with the start table or the source's own juz field; non-canonical root letters or display; and the **root gate** below.

Intentionally valid: `lemma_id: null` on a stem; `root_id: null` with status `unresolved` / `disputed` / `null_policy`; forms with more than one stem. `scripts/tests/test-validate.js` covers 29 cases (defects must fail, unresolved data must pass).

### Root assignment gate (structural part, enforced)

- `disputed`, `unresolved`, `null_policy` ⇒ `root_id` must be null (disputed items are never silently assigned).
- `reviewed`, `verified` ⇒ a `root_id`, non-empty `evidence[]` (each with `source_id`, `edition`, `headword`, `source_root_spelling`, `role`), `rule_ids[]`, and `review.reviewer_id` + `review.date`.
- Root letters must use the canonical alphabet (hamza as ء, weak letters only و / ي) and `display` must equal the letters joined by single spaces.

What the validator cannot check (reviewer qualification, the frozen protocol itself) stays a process requirement.

## 6. Pilot scope

Existing demo scope, kept: Al-Fatihah 1:1-7, Al-Baqarah 2:2, Al-Fil 105:1 (9 ayahs, 43 tokens, 40 forms, 36 lemmas, 23 roots). It covers nouns, verbs and particles; repeated surface forms (three Forms are each shared by two tokens); multi-segment words (proclitic + stem + enclitic, e.g. وَإِيَّاكَ); orthographic-fusion notes; and lemmas/roots in every status (provisional, disputed, unresolved, null-policy). **No true homograph (same surface, different analysis) exists in the pilot**, so that case is supported by the model (a Form id comes from the analysis, not the surface) but not exercised by real data; no homograph was invented to fill the gap. The multi-stem case (one Form with two stems) is exercised only by test fixtures, not by pilot data.

**Not** claimed: that any morphology is complete or reviewed; that the pilot is representative of the full Qur'an.

## 7. What is production-ready, provisional, blocked

**Production-ready (infrastructure):** schema; taxonomy; source registry; provenance model; status and display policy; validator and its tests; build pipeline; search index and normalisation; ASCII id scheme; root gate; bilingual UI integration; the unmodified-text guarantee (text must equal the raw extract).

**Provisional (content, shown with labels):** all segmentation and morphology (hand-written Stage 1 demo); all lemmas and glosses; all 23 roots (placeholders from the Stage 1 demo, not assigned under any protocol, no evidence); conjugation forms; ayah renderings; juz start positions and surah metadata (cross-checked against the text mirror's own metadata only).

**Blocked / unresolved:**
- *Text licence verification.* The pilot ayahs came from a public copy of the Tanzil text (Hugging Face `quranlab/quran`), not from tanzil.net. Byte-fidelity is unverified and the mirror's own licence is "mixed-per-config". Someone must download the text from tanzil.net under its terms and diff it against `data/raw/tanzil-uthmani-pilot.json` before production use. Attribution to Tanzil is shown in the Source panel.
- *Lemma source.* No licensed lemma source is cleared (MASAQ and QuranMorph unresolved; QAC not used). The lemma layer is source-agnostic and QURRA-authored for the pilot.
- *Roots.* The protocol is pending expert review (`docs/expert-review/`, not sent). No authoritative root can enter until it is frozen.
- *Full-Qur'an morphology.* Not imported.

## 8. How future data is inserted

- **A verified root:** add/confirm the Root in `roots.json`; on the lemma set `root = { root_id, status: "reviewed", rule_ids, evidence: [...], review: { reviewer_id, date }, candidates: [], provenance }`. The validator enforces the gate; the learner display switches from badge to plain automatically.
- **A lemma for an unresolved stem:** add the lemma to `lemmas.json` (+ a `glosses.json` record) and set the stem segment's `lemma_id`.
- **A new source:** register it in `sources.json` first (`in_use: true` only once cleared), then cite it by `source_id`.
- **More ayahs:** add the raw extract under `data/raw/`, then ayahs/tokens/forms; the validator checks text equality and contiguity. Juz and surah metadata need only the missing surahs.
- **Replacing the pilot's provisional layers:** edit the JSON and run `node scripts/build.js`. Nothing in `js/` needs to change.

## 9. Architectural decisions (and why)

1. **Generated JS, not runtime `fetch`.** Keeps `file://` and GitHub Pages working with a synchronous API (as the Stage 1 architecture promised). Cost: Node is needed to rebuild; the browser needs nothing.
2. **`lemma_id` on stem segments**, not on the Form: the "correct level" when a form has more than one stem. `QMData` derives `primaryLemmaId` (first resolved stem) for views.
3. **Root as an assignment on the lemma** (status, evidence, rule ids live with the claim). The Root entity stays simple.
4. **ASCII-safe codes.** The Stage 1 codes contained U+02BF (`jamʿ`, `fiʿl`, `ism_faʿil`, …). They were renamed (`jama`, `verb`, `ism_fail`, …); translation keys were migrated. POS is now `noun | verb | particle`.
5. **Provisional roots stay visible, labelled.** The instruction was to show a root only when verified. Hiding all roots would have emptied the Roots/Root pages (a Stage 1.5 feature) and left a learner-facing demo with no root layer. The default policy therefore shows the Stage 1 placeholders with a visible "Provisional" badge and note on every root view. To follow the strict reading, set `display_policy.root.provisional` to `hide` in `taxonomy.json` and rebuild; this is a one-line change and is tested.
6. **Old Stage 1 root ids changed** (e.g. `wqy` → `root-w-q-y`) because several contained non-ASCII letters; old deep links such as `#/root/wqy` no longer resolve.
7. **Conjugation `stored_verified` removed** as misleading; replaced by a status (`provisional`) and a visible label.
8. **Lexical gloss vs learner note split** for the three glosses that mixed them (`la-1`, `lam-1`, `iyyaa-1`). The original wording is preserved in `learner_note`; the short lexical gloss for `iyyaa-1` is a new QURRA draft and is marked as such by its status.

## 10. Findings during the work

- **The Stage 1 demo had two words of 1:7 in the wrong order** (it listed ... غَيْرِ عَلَيْهِمْ الْمَغْضُوبِ ... where the text is ... غَيْرِ الْمَغْضُوبِ عَلَيْهِمْ ...). The migration's consonant-skeleton check caught it; each analysis now follows its word. Token ids `1:7:6` and `1:7:7` therefore point at different words than in Stage 1.
- The Stage 1 demo text was hand-typed in a simplified orthography; displayed text is now the Uthmani text (alef wasla, dagger alef, etc.). Segment spellings were adapted, so segment surfaces are analysis display, not canonical text.
- The text mirror covers all 6,236 ayahs; only the 9 pilot ayahs (and the 30 juz start positions) were taken. The full text was **not** imported.

## 11. Legacy / one-time scripts

`scripts/legacy/` holds the one-time migration from the Stage 1 demo (`migrate-stage1-demo.js`, `migrate-translations.py`). The Stage 1 `demoData.js` is not kept as a file: it is byte-identical to `js/demoData.js` in the first commit (`git show 398f4f4:js/demoData.js`), which the migration script reads from git. They are kept for provenance and are not part of the build; the migration refuses to overwrite hand-edited data without `--force`.

## 12. Verification performed

- `node scripts/build.js`: validation OK; 29 validator tests and 26 data-layer tests pass; syntax check of all JS files.
- Browser QA (Edge via Playwright; 360 / 390 / 768 / 1440 px; EN and BM): the 166-check Stage 1.5 regression suite (all 35 route patterns, F1-F5, search, filters, mobile nav, overflow, console, network) passes unchanged except for renamed ids; a 50-check Stage 2 suite (verbatim text for all 9 ayahs, multi-segment rendering, status-aware display, provenance panel, search kinds, null-lemma safety, overflow of new UI) passes. No console output and no failed requests.
