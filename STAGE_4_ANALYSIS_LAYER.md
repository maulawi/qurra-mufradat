# QURRA Mufradat: analysis / staging layer (Stage 4, branch `morphology-staging-pilot`)

> **No external morphology source is included or imported.** QAC, QuranMorph/Qabas, MASAQ, QAMAR, QUL, EQTB and Wikidata remain uncleared and `in_use: false` in `data/sources.json`; the validator rejects any record that cites them. Everything added to `data/` in this stage is QURRA-authored, `origin: qurra_editorial`, `status: provisional` (or disputed/unresolved), and unreviewed.

This stage adds the machinery a *cleared* source could later plug into, and exercises it with QURRA-authored data only.

## 1. The model is unchanged

Token → Form → Segment(s) → Lemma → Root. A Form may have several segments and several stems; `lemma_id` stays on the stem segment; the root stays an assignment on the lemma. Every existing validation rule is untouched (`test-validate.js` still has its original 48 tests, unmodified).

## 2. What was added, and why

| Addition | Where | Why it was necessary | Backwards compatible? |
|---|---|---|---|
| **Analysis set** (`data/qurra/analyses.json`) | one record per token: `candidates[]` + `chosen` | The model linked one token to one Form, so two analyses could not coexist, and a source could not contribute without overwriting. | Yes. `token-forms.json` still works for tokens without a set. A token may be in exactly one of the two (validated). |
| **Candidate analysis** | inside a set: `analysis_id`, `form_id`, `origin`, `status`, `source{source_id, source_version, source_ref, raw_tags[], external_ids[]}`, `lemma_scope`, `note` | Holds provenance per claim. It *references* a Form instead of copying segments: a Form is already "a shared analysis", so segments, lemma ids and features need no second home. | New file. |
| **`origin`** | on candidates, conflict decisions, optionally on `lemma.root` | `status` says how far something has been checked; `origin` says who made it. They were mixed. Vocabulary in `taxonomy.json`: `source_derived`, `qurra_editorial`, `qurra_root_assignment`, `expert_reviewed`, `unresolved`. | Optional on `lemma.root`. |
| **`chosen` pointer** | on the set | Makes the active analysis explicit. `chosen: null` means "no analysis is active", so the token shows as not yet analysed. | New. |
| **`lemma_scope`** (`segment`\|`token`) | on a candidate | Some sources give one lemma per whole token, QURRA puts it on the stem. `token` is only valid for a form with exactly one stem (otherwise ambiguous). | Optional, default `segment`. |
| **`external_ids[]`** | on candidates' `source`, optionally on lemmas | Keeps a source's own identifier (e.g. a lexicon id) without making it a QURRA id. | Optional. |
| **Conflicts** (`data/qurra/conflicts.json`) | separate records | A disagreement is a first-class record: type, competing values, decision, rationale, status. | New file. |
| **Alignment** (`scripts/lib/alignment.js`, `data/alignments/`) | library + optional per-source files | Source tokenisations differ from QURRA's (a source may count 77,429 tokens against 77,441), so a mapping to `token_id` and a report of what failed is needed. | New; no files exist. |
| **Tag mapping** (`scripts/lib/tagmap.js`, `data/mappings/`) | library + optional per-source files | Sources use their own tag sets; mapping to QURRA POS/features must be explicit and never guessed. | New; no files exist. |
| **Staging boundary** | `.gitignore`: `staging/` | Raw uncleared downloads must have somewhere to live that can never be committed. | New. |

**Proposed but deliberately NOT added:**
- **`pos_fine`** on Forms/segments: a fine tag belongs to the *source's* tag set, while a Form is shared between candidates. It would conflate sources. Raw tags live on the candidate (`source.raw_tags`); the mapped coarse POS and features go into the shared Form.
- A separate **source-analyses store** in `data/`: raw source records stay in `staging/` (ignored) until a source is cleared.

**Taxonomy additions** (the pilot needed them): particle function `shart` (conditional), root type `mithal` (weak first letter), plus the vocabularies for `origin`, `conflict_type`, `lemma_scope`. EN/BM labels were added for the two new values.

## 3. Rules enforced (see `scripts/lib/validate.js`)

- A token has exactly one active-analysis source: a direct `token_forms` entry **or** an analysis set. `chosen` must be one of its candidates, or null; a draft/unresolved/disputed candidate may not be chosen.
- A candidate's form must exist and its surface must equal the token text (and the existing segment-surface reconstruction check applies to the form).
- A candidate cites a registered, `in_use` source. `source_derived` additionally needs `source_version` and `source_ref`.
- **Origin never overstates review**: `expert_reviewed` requires status reviewed/verified and a review block; status `reviewed`/`verified` requires an `expert_reviewed` (or protocol) origin.
- **Conflicts are never resolved automatically**: `disputed`/`unresolved` conflicts carry no decision. A provisional/reviewed decision needs a chosen competing id and a written rationale. A token whose segmentation/lemma/POS/feature is in open dispute has no active analysis; a root conflict must agree with the lemmas' root statuses (no root while disputed; a decided root must equal the lemma's root).
- **Validator hardening (pre-review pass):** unknown morphology, `definiteness` and `pronoun_features` keys are rejected; a stem's POS must equal its lemma's POS; `function_here` must belong to the lemma's `function_inventory`; and for a root conflict every competing value must appear in the lemma's `root.candidates` (a consistency rule, it prefers no candidate).
- Optional per-source files (`data/mappings/*.json`, `data/alignments/*.json`) are validated if present; a synthetic mapping, an unknown source or an `in_use: false` source is rejected.

## 4. The external-source interface (design; nothing is imported)

1. **Stage** the raw download under `staging/<source_id>/` (git-ignored).
2. **Align** source tokens to `token_id` (`alignRecords`), read the report of unmatched, ambiguous and uncovered items.
3. **Map tags** with `data/mappings/<source_id>.tags.json` (`mapTag` fails on any unmapped tag).
4. **Create candidate analyses** with `origin: source_derived`, the source's version and reference, raw tags and external ids. A new source adds candidates; it never overwrites another's.
5. **Record conflicts** where candidates disagree; leave them `disputed` until a person decides.
6. Only a source whose licence is cleared may be registered `in_use: true` and have files committed. Until then, all of this stays in `staging/`.

Roots are untouched by this interface: a source's roots can only ever be comparison data. Root assignment stays QURRA's, provisional, and the root protocol is **not frozen**.

## 5. The QURRA-authored test set (`scripts/legacy/author-stage4-pilot.js`)

49 tokens in 22 ayahs (`112:1–4` complete, `111:1–5`, `114`, `99:1`, `91:14`, `2:255`, `2:34`, `2:23`, `2:87`, `96:1`, `8:17`, `13:3`, `6:29`, `101:2`), 53 candidate analyses, 15 conflicts, 37 new lemmas (all provisional), 5 new provisional placeholder roots, 37 new EN+BM glosses. It covers weak, hamzated, geminate and reduplicated-quadriliteral forms, broken plurals, attached pronouns (including three- and two-enclitic words), a derived verb form (not X), participles, homograph particles (`ma-1`/`ma-2`, `in-1` conditional vs negative), a form shared across surahs, and disputed lemma/root cases (اسم, الله, ابن, إبليس, أحد, ملك/ملائكة, ربّ, the reduplicated quadriliterals).

Of the 37 new lemmas: 6 root assignments are provisional placeholders, 9 disputed (with candidates, no root shown), 16 unresolved, 6 null by policy (closed-class words). One token (`112:4:4`) is held with no active analysis because its lemma conflict is unresolved. This is an architecture test, **not** a claim of morphological coverage: 91 of 77,441 tokens now have an analysis.
