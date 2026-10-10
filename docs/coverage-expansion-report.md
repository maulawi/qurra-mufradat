# Word-analysis coverage: final report (record coverage)

**Word-analysis coverage = tokens with a registered analysis record: 77,441 / 77,441 = 100%.** Every Juz and every surah is at 100%. Zero tokens lack a record.

Coverage means "has an analysis record". It does not mean "fully resolved". Uncertainty is stored and shown, not hidden.

## Status breakdown (tokens)

| Status | Tokens |
|---|---|
| Confident (single reading, lemma and root established) | 64,264 |
| Provisional (lemma known, root unresolved or disputed) | 8,801 |
| Context-dependent (homograph; default shown with alternatives) | 2,903 |
| Unresolved (explicit record, `source_review_required`, expert review required) | 1,473 |

By distinct spelling: 16,392 confident, 1,036 provisional, 147 context-dependent, 1,419 unresolved (18,994 spellings in all). 42 tokens carry token-specific contextual readings.

## Lexicon

- Lexicon entries: 4,496. New lemmas this effort: 3,683. New roots: 1,301. Total lemmas 3,756, roots 1,329.
- Disputed roots with status "disputed": none created. زلزل, وسوس and دمدم are untouched. No root ز ل ل exists.
- 13 `source_review_required` lemmas keep their roots open.
- Unresolved records carry no lemma and no root. The remaining expert-review items are those 1,419 spellings (1,473 tokens), listed in `data/qurra/review/unanalysed-spellings.json`.

## Integrity

- Text fingerprint and 77,441 tokens unchanged. Only the 8 documented baseline corrections changed.
- Pilot data unchanged; pilot token forms always win over rule forms.
- No source_indexing finding created a QURRA root.
- `npm test`, `npm run check`, `npm run validate`, `npm run build` and the browser test (65 checks) all pass.

# Word-analysis coverage expansion: report

Status: **provisional, QURRA-authored, not expert-reviewed.** No classical book was read for this pass, no external morphology dataset was used, no root was decided, and no disputed record was touched. Machine-readable audit: `data/qurra/review/unanalysed-spellings.json` (regenerate with `node scripts/report/unanalysed-audit.js`).

## Update: second pass (spellings that occur at least twice)

After the first pass (below), a focused lexicon-quality audit and a second vocabulary pass were done. Numbers after this pass:

| | First pass | After second pass |
|---|---:|---:|
| Tokens analysed | 68,106 (87.95%) | **69,769 (90.09%)** |
| Tokens not analysed | 9,335 | **7,672** |
| Distinct spellings analysed by the rule engine | 11,253 | **12,278** |
| Distinct spellings not analysed (of 18,994) | 7,741 | **6,716** |
| Lexicon entries | 1,247 | 1,574 |
| New lemmas in the generated lexicon | 574 | 1,356 |
| Provisional roots created by the lexicon | 501 | **609** (baseline 257) |

Gain over the baseline of the whole expansion: +8,484 tokens, +4,105 spellings (79.14% → 90.09%).

- **Part 1, lemma fragmentation audit**: see `docs/lemma-fragmentation-audit.md`. No confirmed duplicates; six possibly over-merged lemmas and seven possibly split pairs are listed for editorial review; nothing was merged or renamed.
- **Part 2**: spellings that occur at least twice were analysed in batches I–K (files 18–20). Of the original ~1,300, 667 spellings (1,334 tokens) are still unanalysed, with 141 at 3–4 occurrences (424 tokens) and 3 more frequent ones; they are listed in `data/qurra/review/unanalysed-spellings.json`. They were left because a sound entry needs a word-by-word decision that was not safe to make quickly (rare roots, uncertain vowelling of the lemma, or homographs), not because a rule is missing.
- **Left unanalysed on purpose (homograph or context needed)**: أَحْسَنَ and فَأَحْسَنَ / وَأَحْسَنَ / أَحْسَنَهُۥٓ (verb or elative), عَادَ (verb or the people of ʿĀd), ظَنَّآ, هُودًا / هُودٍ (the prophet Hud or "Jews"), يَحْيَىٰ (the name or the verb). 23 tokens are in the engine's ambiguity list; the others are recorded as `homograph_context_required`.
- **Context-free defaults added** are listed in `report.json` (`defaults_with_other_readings`, 201 spellings), including نَفَرَ (verb nafara over the noun nafar).
- **Roots**: no existing root assignment changed; the 13 `source_review_required` lemmas are still open; زلزل / وسوس / دمدم are untouched and still disputed (four-letter candidates first); no ز ل ل root exists; no four-letter root became three-letter; source indexing created or changed no root.
- **Corrections to earlier analyses**: still only the 8 documented ones (`scripts/tests/fixtures/documented-changes.json`). Two dual forms written by this pass were found wrong (a dual of a noun in -ة must be built on the -t stem) and were corrected before release; no earlier analysis was affected.
- **Unrelated fix made in the same working tree**: Juz navigation (a `#/juz` index, previous/next/all-Juz links); see `docs/juz-navigation.md`. No morphology data was touched by it.

The sections below describe the first pass and keep its numbers.

## What "analysed" means here

A token is analysed when it has a defensible **form → segment(s) → lemma** analysis (with part of speech and morphology). A root is not required: a lemma may keep `root_id: null` (status `unresolved`, `disputed` or `null_policy`) and its words are still analysed. Root coverage is reported separately.

## Before and after

| | Before | After |
|---|---:|---:|
| Tokens analysed | 61,285 (79.14%) | **68,106 (87.95%)** |
| Tokens not analysed | 16,156 | **9,335** |
| Distinct spellings analysed by the rule engine | 8,173 | **11,253** |
| Distinct spellings not analysed (of 18,994) | 10,821 | **7,741** |
| Lexicon entries | 581 | 1,247 |
| Lemmas in the generated lexicon | 506 (+ 73 pilot) | 1,080 (+ 73 pilot) |
| Provisional roots created by the lexicon | 257 | 501 |

Gain: **+6,821 tokens, +3,080 spellings.** Of the 9,335 tokens still unanalysed, 6,413 are spellings that occur once.

Other numbers: new lexicon entries 666 (574 new lemmas, 92 extra-spelling or fused entries); new roots 244, all provisional and none with four letters; new engine rules and flags 10 (below); analyses that changed from the baseline 8 spellings (all documented below); analyses that existed before and are unchanged 8,198 of 8,206 (the pilot's own forms included).

## New morphology rules (each has regression tests in `scripts/tests/test-coverage.js`)

1. **Nun fusion with a pronoun.** `min` / `'an` + `-na` or `-ni` are written with a doubled nun (minna, minni, 'anna): the pronoun's nun joins the particle's. Particles only; not before the emphatic lam.
2. **Interrogative a- before a hamza-initial stem.** a + idha is written a-'idha; a-'inna; a-'innakum (hamza on a ya seat); a + antum can be spelled with a hamza + fatha (a-antum).
3. **Jussive and imperative with a final kasra** before a following hamzat wasl (fa-li-yatawakkali, wa-bashshiri).
4. **The command lam with sukun** after wa- / fa- (fa-l-yatawakkal).
5. **The object pronoun -ni.** Written with its ya dropped (yahdini, ittaquni) and attaching to verbs only; the pronoun -ni with a nun no longer attaches to nouns (a noun takes -ya).
6. **Stem spelling before a pronoun.** Alef maqsura is written ya (yahdi → yahdihi); a perfect verb's alef maqsura is written alef (rama → ramahu); a plural perfect keeps no alef before a pronoun (atawhu).
7. **-tum before a hamzat wasl** is spelled -tumu; and -tumu + pronoun (-tumuhunna).
8. **Stem flags.** `artOnly` (a noun spelled like a verb is read only after the article), `bare` (the disjoined letters take no prefix, article or pronoun), and free-standing plural forms (a pronoun on them is a different spelling and is not derived).
9. **Attested forms (`f` in the lexicon).** Weak, hamzated and doubled verbs list the spellings that occur, grouped by aspect and person. Nothing is generated beyond what is listed.
10. **Default-reading report.** Every spelling that has several readings and gets a context-free default is recorded with its other readings in `data/qurra/generated/report.json` (`defaults_with_other_readings`, 194 spellings, 3,177 tokens).

## Homographs and context-dependent words

The architecture stores **one default reading per exact spelling**. It cannot represent a reading that depends on the verse. So:

- **Where one spelling has several readings and a default is shown**, the default and the alternatives are recorded (rule 10). The largest: ما (ma-2 "what" over ma-1 "not", 1,752 tokens including with prefixes), لَهُمْ (li + pronoun over hum, about 450), يَٰٓأَيُّهَا, ٱبْنِ, أَعْلَمُ, أَلَا. The panel already says the reading is a context-free default. In this pass the defaults for مَن, مِن, لَا, إِن, أَن keep their earlier readings; no default was added for them.
- **Where the readings differ in grammar, not just in meaning, and no default is safe, the spelling is left unanalysed** and flagged `homograph_context_required`: أَحْسَنَ (verb "to do good" or elative "best", 15 tokens), هُودًا / هُودٍ / هُودٌ (the prophet Hud or "Jews", 9), يَحْيَىٰ and prefixed forms (the name Yahya or the verb "to live", 7), عَادَ (3), أَسْرَىٰ (verb or "captives", 2). That is 36 tokens, plus the 23 tokens of 6 spellings the engine reports as ambiguous.
- **حَقَّ**: the earlier default (noun haqq) is kept; the verb reading is listed in the lexicon only for the unambiguous حَقَّتْ.
- **Eight corrections.** The earlier default for these spellings was a wrong reading: an interrogative a- + a 1st-person or perfect verb, where the spelling plus its pronoun is the fourth-form verb. They were corrected and are listed with reasons in `scripts/tests/fixtures/documented-changes.json`: فَقَدَرَ, وَأَشْهَدَهُمْ, أَسْمَعَهُمْ, لَّأَسْمَعَهُمْ, أَذَاقَهُم, أَذْهَبَ, أَدْرِى, أَدْرِىٓ (11 tokens). Every other earlier analysis is byte-for-byte unchanged (fingerprint test).
- **Context-aware gain.** The homograph and ambiguous spellings are worth 59 tokens (0.08%). Resolving them by context would not move the percentage much; the large remaining gap is vocabulary, not ambiguity.

## What was deliberately not done

- **Roots.** No disputed root was decided. زلزل, وسوس and دمدم stay disputed with their four-letter candidates first; no ز ل ل root exists; no root is made from classical source indexing; no root has four letters. New lemmas get a provisional root only where the dictionary root is not in doubt. Thirteen added lemmas keep their root open and are listed as `source_review_required` in the audit: bint-1, burhan-1, haman-1, ihda-1, imru-1, injil-1, ismail-1, masih-1, muttaki-1, salsal-1 (a reduplicated word whose root convention is an open editorial question), shuayb-1, unas-1, yunus-1.
- **Lemma unity.** Where one lemma could be two (for example haqq noun / haqqa verb), they are separate lemmas.
- **Classical sources.** Not consulted. Words whose root needs a source stay open (above).
- **The 5,000 or so rare spellings** (6,413 occur once). They need one lexicon entry each, written by hand; no rule can derive them safely.

## Remaining work, by size

| Spelling frequency | Spellings | Tokens |
|---|---:|---:|
| 10 or more | 1 | 15 |
| 5-9 | 2 | 11 |
| 3-4 | 264 | 793 |
| 2 | 1,061 | 2,122 |
| 1 | 6,413 | 6,413 |

Entries for every spelling that occurs at least twice would add about 2,941 tokens (to about 91.7%). The singletons are the last 8.3%. The heuristic category of the remaining spellings (never stored as analysis): 3,198 tokens look verbal, 2,673 nominal, 991 short forms, 2,492 unclear; the audit file lists each spelling with its examples and whether its consonants match an existing lemma (2,516 spellings, 3,059 tokens do: a lexicon form is missing for a lemma that exists).

## Top 50 remaining spellings (by token count)

أَحْسَنَ 15 (homograph); هُودًا 6 (homograph); وَمَلَإِي۟هِۦ 5; يَحْيَىٰ 4 (homograph); then 3 tokens each: ءَانَسْتُ, أَجْرَمُوا۟, أَدُلُّكُمْ, أَشْيَآءَهُمْ, أَصَٰبَكُمْ, أَفَآءَ, بُشْرًۢا, بِسِيمَٰهُمْ, تَبْخَسُوا۟, تَعْتَذِرُوا۟, تَقَرَّ, تَمَسُّوهَا, تَمَسُّوهُنَّ, تَمِيدَ, تَنتَهِ, تَنَزَّلُ, تَهِنُوا۟, تُخْفُوهُ, تُغْنِ, تُنظِرُونِ, ثَمَّ, جَبَّارًا, جَبَّارٍ, جَزَآؤُهُمْ, جَزَٰٓؤُا۟, جَنَّتَانِ, جَهْرَةً, حَاجَةً, حَرْثَ, حَظًّا, حَمَإٍ, حَيَاتُنَا, حَٰشِرِينَ, حُبًّا, حُرُمٌ, حُطَٰمًا, خَابَ, خَالِصَةً, خَاوِيَةٌ, خَفَّتْ, خَلِيلًا, خَٰشِعَةً, خَٰشِعِينَ, خُضْرٍ, دَكًّا, ذَآئِقَةُ.

## How to reproduce

`node scripts/analyse/generate.js` (regenerate), `node scripts/report/unanalysed-audit.js` (audit), `node scripts/report/baseline-snapshot.js` (compare with the pre-expansion fingerprint), `npm test`, `npm run check`.
