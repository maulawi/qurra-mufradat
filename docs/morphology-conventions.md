# QURRA morphology conventions (pilot)

> **Status: descriptive, not normative.** This lists only the conventions that the pilot audit found to be followed consistently by all current records. **None has been confirmed by an external expert**: every row is subject to reviewer confirmation. It does not add rules, and it does not decide the questions in section 3.
>
> Scope: the QURRA-authored pilot of 92 records (91 analysed words plus one held) (`data/qurra/`). Nothing here is derived from any external morphology dataset.

## 1. Conventions followed consistently

"Written down" says whether the rule already exists in a project document or is enforced by the validator. "Pattern only" means it is an observed pattern that was never written down. **Reviewer-confirmed: no, for every row.**

| # | Convention | Written down | Reviewer-confirmed |
|---|---|---|---|
| 1 | Segments run proclitic → stem → enclitic. | Yes: `DATA_SCHEMA.md` §1; enforced by the validator | No |
| 2 | The stem is where the lemma lives (`lemma_id` on the stem segment; null is allowed). | Yes: `STAGE_2_IMPLEMENTATION.md` §2; enforced | No |
| 3 | Attached pronoun suffixes (object, possessive, and the subject-pronoun suffix such as `-ta`) are enclitic segments. | Partly: `DATA_SCHEMA.md` §1 (enclitics "usually pronouns") | No |
| 4 | Imperfect prefixes (`نَ تَ يَ أَ`) and sound-plural endings stay inside the stem. | Pattern only | No |
| 5 | The lemma of a noun is its singular (plurals and duals map to it). | Pattern only | No |
| 6 | The lemma of a verb is its past 3rd person (imperative and imperfect forms map to it). | Pattern only | No |
| 7 | Same part of speech, different functions: one lemma (the function is recorded per word). | Pattern only | No |
| 8 | Different part of speech: a separate lemma (for example `ma-1` particle and `ma-2` noun). | Pattern only | No |
| 9 | Pronouns, demonstratives, relatives and interrogatives are nouns carrying a `reference_class`. | Partly: `DATA_SCHEMA.md` §4 (`reference_class`) | No |
| 10 | Closed-class words (particles, pronouns, interrogative and relative nouns) have no root: status `null_policy`. | Yes: `data/taxonomy.json` statuses; protocol text (not frozen) | No |
| 11 | The same surface with a different analysis gives a different Form (the Form id comes from the analysis, not the spelling). | Yes: `STAGE_2_IMPLEMENTATION.md` §2 | No |
| 12 | A disputed or unresolved item asserts no root and carries no decision. | Yes: enforced by the validator | No |
| 13 | An unresolved or disputed token-level conflict leaves the token unanalysed (no chosen analysis). | Yes: enforced by the validator | No |

## 2. Open technical issue R1 (segment-surface Unicode)

**What:** the segment surfaces in the pilot are stored with a different order of combining marks from the token text. Tanzil writes shadda before the vowel mark (`ل ّ َ`); the pilot's segment text has the vowel first. They display identically. Of the 91 analysed tokens' chosen analyses:

- 63 reconstruct the token **exactly**;
- 25 are equal only after Unicode normalisation (mark order);
- 3 differ because the alef of the article is not written (`1:2:2`, `2:2:7`, `2:34:3`).

5,748 of the 6,236 ayahs of the canonical text are not in normalised (NFC) form. The validator compares consonant skeletons (which ignore marks and alefs), so it does not see any of this. Display is unaffected; an exact string comparison on segments would be.

**Policy: undecided.** Whether QURRA should keep Tanzil's mark order in segment surfaces or canonicalise them, and where such a rule would be checked, has not been decided. No data was changed for this issue.

## 3. Deliberately undecided

These are open. The pilot contains records that touch each of them, and none has been silently resolved.

1. **Feminine `-t` segmentation:** whether the `-t` of `111:1:1 تَبَّتْ` and `99:1:2 زُلْزِلَتِ` should be a separate segment (the subject pronoun `-ta` of `1:7:3` and `8:17:7` is).
2. **Kaf in `ذَٰلِكَ`:** whether it should be split as the kaf of `إِيَّاكَ` is (`1:5:1`, recorded conflict `cf-seg-iyyaka`).
3. **Fusion and elision notation:** how an elided article alef or lam fusion is to be shown (`2:34:3`, `2:2:7`, `1:2:2`).
4. **Null versus unknown versus not recorded:** what a null or omitted feature means for pronouns and closed-class nouns, and how "unknown" is to be told apart.
5. **`أَحَد` lemma identity:** one lemma or two (`112:1:4` against `112:4:5`).
6. **`كُفُو` lemma identity:** one lemma or two spelling variants (`112:4:4`, recorded conflict `cf-lemma-kufu`, token held unanalysed).
7. **`مَلَك` lemma identity:** which singular is the lemma of `ملائكة` (`2:34:3`).
8. **`إِلَٰه` against `اللَّه`:** separate lemmas or one (`2:255:3`, recorded conflict `cf-lemma-ilah`).
9. **Mood and case representation:** the jussive verbs and case endings are not recorded; whether they should be is open.
10. **Root treatment of `أحد`:** how lexicographic indexing (ء ح د) and radical analysis (و ح د) are to be stored together.
11. **Reduplicated and quadriliteral root convention:** `وسوس`, `زلزل`, `دمدم` (recorded as disputed; the three verbs have no `verb_form`). The data model now allows four-radical roots (`root_category` `rubai`, `DATA_SCHEMA.md` §6a) and does not reduce them to a triliteral; whether to assign the four-letter root to these words is still an editorial decision. A classical source that indexes such a word under a related triliteral (for example ز ل ل) is recorded as **source indexing**, not as the QURRA root.
12. **Classification of `ي و م`:** stored as `lafif_maqrun`, a type this project defines for the 2nd and 3rd letters.
13. **Is the alternative analysis of `كان` genuine:** the "auxiliary particle" alternative at `2:34:11` (recorded conflict `cf-pos-kaana`) may not be a position any scholar holds.
14. **Is the `إله` alternative genuine:** the `اللَّه` alternative at `2:255:3` (recorded conflict `cf-lemma-ilah`).
15. **Feminine elative as lemma:** whether a feminine elative (`كُبْرَىٰ`, `أُخْرَىٰ`, `دُنْيَا`, `أُولَىٰ`) is its own lemma or a form of the masculine (`أَكْبَر`, `ءَاخَر`, `أَدْنَىٰ`, `أَوَّل`). The pilot keeps them separate and the coverage expansion followed it (see `docs/lemma-fragmentation-audit.md`).

## 4. Root length and source indexing (model note)

- A root is not limited to three radicals. Allowed lengths come from the taxonomy (`thulathi` 3, `rubai` 4); a new category is a taxonomy entry only.
- The QURRA root assignment and a classical source's indexing heading are different things and may differ in letters and in number of letters. Source indexing is evidence only.

The root protocol itself remains **not frozen**.
