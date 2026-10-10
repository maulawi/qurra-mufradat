# How word analysis is produced

Every word of the Qur'an can be opened in the word-analysis panel. This note says exactly where that analysis comes from, what it can and cannot claim, and how to extend it. Figures are in `docs/V1_COVERAGE_REPORT.md` (generated).

## What is shown, and what it is worth

Every analysis in the app is **QURRA-authored and provisional**. None is copied from a corpus, dataset or dictionary (QAC, QuranMorph, MASAQ, QAMAR, EQTB, QUL, Wikidata and others stay unimported; their licence status is in `docs/content-source-research.md`). None has been reviewed by a scholar, and the panel says so ("Provisional analysis") together with a plain sentence about the basis:

| Basis | Meaning |
|---|---|
| **pilot** | QURRA analysed this very word (the original 91-token pilot, with its candidates, conflicts and root decisions untouched). |
| **rule_default** | The *default reading of this spelling*: the same analysis is applied to every token that is spelled exactly like it. It is context-free, so in a particular verse it can be wrong (a homograph, a different parse). |

Nothing is ever shown as `reviewed` or `verified` unless a person has set that status in the data; the validator refuses a rule-based default that is not `provisional`.

## Coverage versus certainty (resolution classes)

**100% word-analysis coverage does NOT mean 100% morphological certainty.** The system guarantees that every Qur'anic token has an analysis record, and it keeps the uncertainty of each record explicit. "Covered" means "has a registered record"; the class below says how much that record claims.

| Class | Meaning | Shown as |
|---|---|---|
| **confident** | One reading; the lemma is established and the root is established. | Normal analysis (still provisional, never "reviewed" or "verified" unless a person sets that status). |
| **provisional** | The lemma is established; the root is open, disputed or unresolved. | "Provisional"; no root is shown or indexed. |
| **context-dependent** | A contextual reading is required (homographs such as *ma*, *man*, *in*, *an*, *la*). The spelling default is shown together with its alternatives. A token-level contextual analysis (`rule_context` form, built from `contexts` in the lexicon) overrides the spelling-level default for that one token. | "Context-dependent", with alternatives listed. |
| **unresolved** | An explicit analysis record exists (form, candidate readings as hints, note, provenance, `source_review_required`) but no morphological conclusion has been established. It carries no lemma and no root. | "Analysis: unresolved, expert review required". |

Current baseline (generated; see `docs/V1_COVERAGE_REPORT.md` and `docs/coverage-expansion-report.md`):

| | |
|---|---|
| Total tokens | 77,441 |
| Covered by an analysis record | 77,441 (100%) |
| Distinct spellings covered | 18,994 |
| Confident | 64,264 tokens |
| Provisional | 8,801 tokens |
| Context-dependent | 2,903 tokens |
| Unresolved | 1,473 tokens (1,419 distinct spellings) |

By design, every Juz and every surah shows "Word analysis · Complete". The unresolved share is deliberately not shown as a percentage on Juz cards; each uncertain word shows its own status in the word panel.

### The expert-review queue

The unresolved spellings are kept on purpose as explicit review records, not guessed. The queue is `data/qurra/review/unanalysed-spellings.json`. The word "unanalysed" in that file name (and in `scripts/report/unanalysed-audit.js`) is historical, technical terminology from the time when such words had no record. Today every entry in it is an explicit **unresolved** analysis record that still counts as covered. The file name is kept to avoid breaking tooling. V1 does not add more vocabulary batches; the queue goes to expert review.

Classical sources (for example al-Raghib's *Mufradat*, Ibn Faris' *Maqayis*) are evidence only: a source-indexing finding never becomes a QURRA root. Disputed roots (*zalzala*, *waswasa*, *damdama*) stay open candidates, there is no root ز ل ل, and a four-letter root is never reduced to three letters.

## The model

```
Token (derived from the ayah text)  ->  Form (segments: proclitic / stem / enclitic)  ->  Lemma  ->  Root
                                                         |                                  |
                                                    morphology                        status + candidates
```

The pilot's model is reused unchanged: forms, segments, lemmas, roots, glosses, statuses, provenance. Rule-based forms are ordinary forms with `basis: "rule_default"`, shared by every token with the same spelling (about 8,200 forms serve about 61,000 tokens), so the data stays small and `occurrence references` are computed, not stored.

## Pipeline

```
data/lexicon/*.json        hand-written lexicon: lemmas, meanings (EN + BM), roots, stems, paradigms
        |  scripts/analyse/generate.js   (engine.js, templates.js)
        v
data/qurra/generated/{lemmas,glosses,roots,forms}.json   +  report.json
        |  loaded and validated with the pilot files (scripts/lib/load-data.js, validate.js)
        v
js/generated/dataset.js     (forms are shipped in a compact positional form, expanded on demand in js/data.js)
```

`node scripts/build.js` regenerates everything; `npm run check` fails if a generated file is stale.

### What the engine does

For each distinct spelling in the Qur'an it looks for parses made of:

1. optional prefixes, in the only order they can stack: interrogative *a-*, *wa-* / *fa-*, then *bi- li- ka- sa- la-* or the vocative *ya-*, then the article;
2. a **stem that is in the lexicon**, matched exactly after Uthmani spellings are canonicalised (mark order, a silent sukun, small recitation signs and an initial assimilation shadda are not compared);
3. an optional attached pronoun (*-hu -ha -hum -ka -kum -na -ni -ya ...*).

A stem is never invented: it exists because a lexicon entry lists it (nouns with their case endings and plurals, verbs with their conjugation, particles and pronouns with their bound forms) or because a template generated it from a lexicon entry. Generated spellings that do not occur in the Qur'an are simply never used.

If a spelling has **one** parse it is analysed. If it has several: a lexicon `prefer` rule may choose between named lemmas (e.g. *ma* as noun over negative particle, with a visible note); parses that differ only in person/gender keep only the features they share; one lemma with several segmentations takes the whole-word reading; otherwise it is reported as **ambiguous and left unanalysed** (23 tokens today; the report lists every default that has other readings).

### Meanings, roots and lemmas

* Lemma meanings (`en`, `ms`) are QURRA's own short wording; they are lexical glosses, kept separate from ayah translations.
* A root is attached only where the dictionary root is not in doubt; otherwise the lemma keeps `root_id: null` with status `disputed` or `unresolved` and its candidates, and the root is **not displayed and not indexed**. Closed-class words (particles, pronouns, demonstratives) have `null_policy`: they are explainable without a root. The root verification protocol is **not frozen**; every root is labelled provisional.
* Words that are really two words written as one (*mimma*, *amma*, *fimma*) are `fused` entries: two segments, each with its own lemma, plus a note.

### Conflicts with the pilot

A rule default is never applied over a pilot analysis. Where a default would differ from a pilot form of the same spelling, the difference is listed in `data/qurra/generated/report.json` (`pilot_conflicts`) for a human to look at; the pilot keeps its record, candidates, statuses and provenance.

## Rules added in the coverage expansion

The expansion (see `docs/coverage-expansion-report.md`) added ten engine rules and flags: nun fusion with a pronoun (minna, minni), the interrogative a- before a hamza-initial stem, jussive and imperative with a final kasra, the command lam with sukun, the object pronoun -ni (with its ya dropped, verbs only), stem spellings before a pronoun (ya / alef for alef maqsura), -tumu before a hamzat wasl, the stem flags `artOnly` and `bare` and free-standing plural forms, attested-form lists (`f`) for weak, hamzated and doubled verbs, and a report of every context-free default that has other readings. Each has tests in `scripts/tests/test-coverage.js`. A word is analysed when it has a form, segments and a lemma; a root is not required.

## Known limits

* Spelling-level defaults are context-free, so homographs (e.g. *ma*, *in*, *la*) take a default reading and list alternatives; where the lexicon has a token-specific `contexts` entry, that reading overrides the default for that token.
* Where the lexicon stops, the word gets an explicit **unresolved** record (not a missing one). Those records are the expert-review queue, `data/qurra/review/unanalysed-spellings.json`.
* Mood and case are not modelled (they are undecided items in `docs/morphology-conventions.md`).
* Some lemma choices (for example *inna* and *anna* as separate lemmas, the treatment of *wa-* as a conjunction in every case) are conventions, not scholarly findings.

## Extending the lexicon

1. Add an entry to a file in `data/lexicon/` (see the existing entries for the shorthand: `n`, `nf`, `nt`, `bp`, `sm`, `sf`, `adj` for nouns; `sv`, `hv`, `nq`, `verb`, `x` for verbs; `stems`/`bound` for particles; `fused`; `more` for extra spellings of an existing lemma).
2. `node scripts/analyse/generate.js`, then `node scripts/build.js`.
3. The new lemma appears in search (Arabic, English and Malay meaning, root), in lemma and root pages, and in every word that has the spelling.
