# QURRA morphology pilot: expert review package

> **Status: PREPARED, NOT SENT.** Nothing here has been sent to anyone. It is generated from the repository data (`data/qurra/*`) and the pilot audit. Review scope: **65 records (39 P0 + 26 P1)**. Please do **not** sign off all 92 records; the other 27 (P2, routine) are listed only so you can see what was left out.

## 1. Purpose
The QURRA morphology layer records, for each written word of the Qur'an, a segmentation, a lemma, a part of speech and grammatical features, so that learners can explore vocabulary. The text itself is the official Tanzil Uthmani text, unmodified. The layer is currently a **pilot of 92 records** (91 analysed words plus one deliberately held, `112:4:4`) written by QURRA editors from their own knowledge of Arabic grammar. **Nothing was copied from any corpus.** It is an architecture and methodology test, not a claim of coverage: 91 of 77,441 words have any analysis.

## 2. Data model
- **Token**: one written word at one position (`surah:ayah:position`).
- **Form**: a shared analysis of a token: an ordered list of **segments** (proclitic, stem, enclitic; a form may hold more than one stem) plus features.
- **Lemma**: the dictionary form. A lemma id sits on a *stem* segment, not on the token. A stem may have no lemma yet (null).
- **Root**: an assignment *on the lemma*, never on the token, with its own status.
- A token may have several **candidate analyses**; one is *chosen*, or none (the token is then deliberately shown as unanalysed). **Conflicts** record disagreements.

## 3. Current conventions (all subject to your confirmation)
See `docs/morphology-conventions.md` for the rules the pilot already follows, and the list of questions that are deliberately open. In short: proclitic → stem → enclitic; pronoun suffixes are enclitics; verb prefixes and number/case/feminine endings stay in the stem; the noun lemma is the singular; the verb lemma is the past 3rd person; closed-class words (pronouns, interrogative and relative nouns, particles) have no root.

## 4. Status versus origin
- **status** says how far something has been checked: `provisional` (written, unreviewed), `disputed` (documented disagreement, no value asserted), `unresolved` (nothing asserted), `null_policy` (intentionally empty), `reviewed`/`verified` (reserved for human review).
- **origin** says who made the claim: here always `qurra_editorial` (written by QURRA editors; it does **not** imply review). `expert_reviewed` may be used only after a reviewer's decision is applied.
- Every record in this pilot is **provisional, disputed, unresolved or null by policy**. None is reviewed.

## 5. Root policy (not frozen)
A QURRA root is the underlying radicals of the lemma's lexical base, reversing inflection and regular derivation, placed where classical lexicographers index it when they agree. If radical analysis and lexicographic indexing differ, both are kept, not forced into one. Closed-class words have no root. A disputed lemma shows no root and lists candidates only. The 28 roots in the data are placeholders: none has been assigned under a frozen protocol or backed by recorded evidence. **You are not asked to freeze the protocol.**

## 6. Conflict policy
A disagreement is a record with competing values, a decision (or none), a rationale and a status. A `disputed` or `unresolved` conflict carries **no decision**, and the affected token stays unanalysed. A `provisional` decision is a QURRA editor's working choice with the alternative kept visible.

## 7. P0 records: structure or methodology (39)
| Token | Word | Lemma | Why it is here |
|---|---|---|---|
| 2:34:3 | لِلْمَلَٰٓئِكَةِ | malak-1 | article's alef is not in the written word after لِ; no rule yet for notating elision (segmentation note added, rule undecided) |
| 2:2:7 | لِّلْمُتَّقِينَ | muttaqin-1 | fusion of لِ + ال documented; article shown without sukun before a moon letter |
| 1:2:2 | لِلَّهِ | allah-1 | fusion of لِ + اللَّه documented; elision/fusion notation undecided |
| 111:1:1 | تَبَّتْ | tabba-1 | feminine -t kept inside the stem; geminate verb |
| 99:1:2 | زُلْزِلَتِ | zalzala-1 | feminine -t kept inside the stem; reduplicated quadriliteral verb (passive) |
| 1:7:3 | أَنْعَمْتَ | anama-1 | subject pronoun -ta split off as an enclitic (compare 111:1:1) |
| 8:17:7 | رَمَيْتَ | rama-1 | subject pronoun -ta split off; defective verb; stem allomorph رَمَيْ |
| 1:5:1 | إِيَّاكَ | iyyaa-1 | kaf split as a pronoun enclitic (conflict cf-seg-iyyaka); closed-class features null |
| 1:5:3 | وَإِيَّاكَ | iyyaa-1 | three segments (conjunction + stem + enclitic); same kaf question |
| 2:2:1 | ذَٰلِكَ | dhalika-1 | kaf NOT split here, unlike إِيَّاكَ |
| 2:255:26 | بِإِذْنِهِۦ | idhn-1 | three segments: preposition + hamzated noun + pronoun |
| 111:4:1 | وَٱمْرَأَتُهُۥ | imraa-1 | three segments; امرأة root unresolved |
| 2:34:11 | وَكَانَ | kaana-1 | competing analyses: verb vs auxiliary particle (conflict cf-pos-kaana) |
| 111:2:1 | مَآ | ma-1 | competing analyses: negation vs interrogative (conflict cf-feature-ma) |
| 2:255:3 | إِلَٰهَ | ilah-1 | competing lemmas: إله vs الله (conflict cf-lemma-ilah) |
| 112:4:4 | كُفُوًا | kufu-1 | competing lemmas كُفُو / كُفُؤ; token deliberately left unanalysed (conflict cf-lemma-kufu) |
| 2:255:14 | مَا | ma-2 | homograph مَا (relative); same surface as 101:2:1 |
| 101:2:1 | مَا | ma-2 | homograph مَا (interrogative) |
| 2:23:1 | وَإِن | in-1 | homograph particle إن: conditional |
| 6:29:2 | إِنْ | in-1 | homograph particle إن: negation |
| 112:1:2 | هُوَ | huwa-1 | meaning of null/omitted features for a pronoun |
| 2:255:20 | مَن | man-1 | meaning of null/omitted features for an interrogative noun |
| 111:1:2 | يَدَآ | yad-1 | dual; gender recorded null; lost-radical noun |
| 112:1:4 | أَحَدٌ | ahad-1 | lemma identity of أحد; root: indexing vs radical analysis |
| 112:4:5 | أَحَدٌۢ | ahad-1 | same lemma as 112:1:4 ('anyone' vs 'one') |
| 114:5:2 | يُوَسْوِسُ | waswasa-1 | reduplicated quadriliteral verb: root convention; no verb_form |
| 114:4:3 | ٱلْوَسْوَاسِ | waswas-1 | reduplicated family; masdar vs agent noun |
| 99:1:4 | زِلْزَالَهَا | zilzal-1 | reduplicated family; masdar |
| 91:14:3 | فَدَمْدَمَ | damdama-1 | reduplicated quadriliteral verb with conjunction |
| 112:3:2 | يَلِدْ | walada-1 | jussive mood not recorded; assimilated verb, provisional root و ل د |
| 112:3:4 | يُولَدْ | walada-1 | passive jussive; mood not recorded; root evidence |
| 111:1:5 | وَتَبَّ | tabba-1 | geminate verb with conjunction; provisional root ت ب ب |
| 13:3:3 | مَدَّ | madda-1 | geminate verb; provisional root م د د |
| 2:255:9 | تَأْخُذُهُۥ | akhadha-1 | hamzated verb; imperfect prefix inside the stem; pronoun enclitic |
| 96:1:1 | ٱقْرَأْ | qaraa-1 | hamzated imperative with hamzat al-wasl |
| 2:255:30 | أَيْدِيهِمْ | yad-1 | broken plural of يد with pronoun; lost-radical noun; gender null |
| 111:1:3 | أَبِى | ab-1 | long-vowel noun: ending kept in the stem |
| 112:4:2 | يَكُن | kaana-1 | jussive mood not recorded; كان lemma |
| 105:1:2 | تَرَ | raa-1 | jussive mood not recorded; hamzated verb (Stage 1 record) |

## 8. P1 records: linguistically important (26)
| Token | Word | Lemma | Why it is here |
|---|---|---|---|
| 2:34:8 | إِبْلِيسَ | iblis-1 | disputed root; proper name |
| 2:34:9 | أَبَىٰ | abaa-1 | hamzated defective verb; root unresolved |
| 112:2:2 | ٱلصَّمَدُ | samad-1 | gloss wording for صمد; provisional root |
| 2:255:6 | ٱلْحَىُّ | hayy-1 | doubly weak noun; root unresolved |
| 2:255:7 | ٱلْقَيُّومُ | qayyum-1 | pattern and gloss; root unresolved |
| 112:1:3 | ٱللَّهُ | allah-1 | الله: lemma/root; shares one Form with 2:255:1 |
| 2:255:1 | ٱللَّهُ | allah-1 | الله: shares one Form with 112:1:3 |
| 1:1:2 | ٱللَّهِ | allah-1 | الله (Stage 1) |
| 1:2:3 | رَبِّ | rabb-1 | رب: class-B root question (ر ب ب / ر ب و) |
| 105:1:5 | رَبُّكَ | rabb-1 | رب with pronoun suffix (Stage 1) |
| 114:1:3 | بِرَبِّ | rabb-1 | رب with preposition |
| 96:1:2 | بِٱسْمِ | ism-1 | اسم: disputed root; alef kept here, elided in 1:1:1 |
| 1:1:1 | بِسْمِ | ism-1 | اسم: disputed root; alef elided |
| 2:87:11 | ٱبْنَ | ibn-1 | ابن: disputed root; lemma citation uses alef wasla |
| 114:2:1 | مَلِكِ | malik-2 | مَلِك: a different lemma from مَالِك, same provisional root |
| 1:4:1 | مَٰلِكِ | malik-1 | مَالِك (Stage 1) |
| 105:1:7 | ٱلْفِيلِ | fil-1 | definiteness cause 'idafa' although the article is present (Stage 1) |
| 1:7:9 | ٱلضَّآلِّينَ | dall-1 | geminate noun with provisional root ض ل ل (Stage 1) |
| 1:4:2 | يَوْمِ | yawm-1 | weak noun without a verb; provisional root; root type of ي و م |
| 1:4:3 | ٱلدِّينِ | deen-1 | weak noun; provisional root (Stage 1) |
| 2:2:4 | رَيْبَ | rayb-1 | hollow noun; provisional root (Stage 1) |
| 105:1:3 | كَيْفَ | kayfa-1 | closed-class features null (Stage 1) |
| 1:7:5 | غَيْرِ | ghayr-1 | hollow noun; provisional root (Stage 1) |
| 2:255:41 | وَسِعَ | wasia-1 | assimilated verb; provisional root و س ع |
| 2:23:11 | مِّن | min-1 | min-1 particle lemma |
| 1:7:2 | ٱلَّذِينَ | alladhina-1 | article kept inside the relative pronoun (not split) |

(P2: 27 routine records, out of scope: 1:1:3, 1:1:4, 1:2:1, 1:2:4, 1:3:1, 1:3:2, 1:5:2, 1:5:4, 1:6:1, 1:6:2, 1:6:3, 1:7:1, 1:7:4, 1:7:6, 1:7:7, 1:7:8, 2:2:2, 2:2:3, 2:2:5, 2:2:6, 105:1:1, 105:1:4, 105:1:6, 112:1:1, 112:3:1, 114:1:2, 8:17:12.)

## 9. The 15 recorded conflicts
Generated from `data/qurra/conflicts.json`; decisions are shown as stored and have not been altered.

| # | Id | Type | Subject | Competing values | Status | Current decision |
|---|---|---|---|---|---|---|
| 1 | cf-root-ism | root | ism-1 (اسْم) | س م و<br>vs و س م | disputed | none (left open) |
| 2 | cf-root-allah | root | allah-1 (اللَّه) | ء ل ه<br>vs no derivation (a proper name) | unresolved | none (left open) |
| 3 | cf-root-ahad | root | ahad-1 (أَحَد) | ء ح د<br>vs و ح د | disputed | none (left open) |
| 4 | cf-root-ibn | root | ibn-1 (ٱبْن) | ب ن و<br>vs ب ن ي | disputed | none (left open) |
| 5 | cf-root-iblis | root | iblis-1 (إِبْلِيس) | ب ل س<br>vs a non-Arabic name (no root) | disputed | none (left open) |
| 6 | cf-root-malak | root | malak-1 (مَلَك) | م ل ك<br>vs ء ل ك | disputed | none (left open) |
| 7 | cf-root-rabb | root | rabb-1 (رَبّ) | ر ب ب<br>vs ر ب و | provisional | **provisional**: ر ب ب. Class-B variation. The Stage 1 placeholder ر ب ب is kept provisionally and ر ب و is recorded as the alternative; evidence from at least two classical lexica is still required under the protocol. |
| 8 | cf-root-waswas | root | waswas-1 (وَسْوَاس), waswasa-1 (وَسْوَسَ) | و س و س (four-letter)<br>vs و س س (doubled triliteral) | disputed | none (left open) |
| 9 | cf-root-zalzal | root | zalzala-1 (زَلْزَلَ), zilzal-1 (زِلْزَال) | ز ل ز ل (four-letter)<br>vs ز ل ل (doubled triliteral) | disputed | none (left open) |
| 10 | cf-root-damdam | root | damdama-1 (دَمْدَمَ) | د م د م (four-letter)<br>vs د م م (doubled triliteral) | disputed | none (left open) |
| 11 | cf-lemma-ilah | lemma | 2:255:3 (إِلَٰهَ) | lemma إِلَٰه (ilah-1)<br>vs lemma اللَّه (allah-1) | provisional | **provisional**: lemma إِلَٰه (ilah-1). Here the word is indefinite, in the negation 'no god', so it is treated as a different lemma from the proper name; the alternative is kept visible. |
| 12 | cf-lemma-kufu | lemma | 112:4:4 (كُفُوًا) | lemma كُفُو (kufu-1)<br>vs lemma كُفُؤ (kufu-2) | unresolved | none (left open) |
| 13 | cf-pos-kaana | pos | 2:34:11 (وَكَانَ) | verb with a lemma (kaana-1)<br>vs auxiliary particle, no lemma asserted | provisional | **provisional**: verb with a lemma (kaana-1). Traditional grammar treats كان as a verb that inflects for person, number and gender; the particle reading is kept as an alternative. |
| 14 | cf-feature-ma | feature | 111:2:1 (مَآ) | negation (particle ma-1)<br>vs interrogative noun (ma-2) | provisional | **provisional**: negation (particle ma-1). The negative reading is the common one for 'ma aghna...'; the interrogative reading is recorded as an alternative and not excluded. |
| 15 | cf-seg-iyyaka | segmentation | 1:5:1 (إِيَّاكَ) | stem إِيَّا + enclitic pronoun كَ (as in the Stage 1 pilot)<br>vs one unit إِيَّاكَ | provisional | **provisional**: stem إِيَّا + enclitic pronoun كَ (as in the Stage 1 pilot). Kept as segmented in the Stage 1 pilot; grammarians differ on whether the kaf is a pronoun, so the single-unit analysis is recorded as an alternative. |

## 10. Questions for the reviewer
Please answer each with one decision from section 11 and a short reason.

1. **Segmentation.** (a) `2:34:3`, `2:2:7`, `1:2:2`: how should the elided alef of the article (and the lam fusion) be notated? (b) Should the feminine `-t` of `111:1:1` and `99:1:2` be a separate segment, given that the subject pronoun `-ta` of `1:7:3` and `8:17:7` is? (c) Should the kaf of `2:2:1 ذَٰلِكَ` be split as the kaf of `1:5:1 إِيَّاكَ` is?
2. **Features.** How should "not applicable", "unknown" and "not recorded" be told apart for pronouns and closed-class nouns (`1:5:1`, `112:1:2`, `2:255:14`, `2:255:20`, `111:1:2`, `2:255:30`)? Is leaving out mood (jussive: `112:3:2`, `112:3:4`, `112:4:2`, `105:1:2`) and case acceptable?
3. **Lemma identity.** Is `أَحَد` (`112:1:4`, `112:4:5`) one lemma or two? Are `كُفُو` and `كُفُؤ` the same lemma? Is a singular `مَلَك` the right lemma for `2:34:3`? Is `إِلَٰه` (`2:255:3`) a different lemma from `اللَّه`?
4. **Competing analyses.** Is treating كان as an auxiliary particle (`2:34:11`) a position any grammarian holds, or should that alternative be removed? Is the interrogative reading of `111:2:1` a genuine alternative? Is the الله alternative for `2:255:3` a genuine position?
5. **Roots.** For `أحد`, `ابن`, `إبليس`, `ملائكة` and `اسم`, are the candidate lists complete and correct? For `أحد`, how should indexing (ء ح د) and radical analysis (و ح د) be recorded? For the reduplicated families (`وسوس`, `زلزل`, `دمدم`), is a four-letter root, a doubled triliteral, or neither the better display? Are the provisional placeholders (و ل د, و س ع, م د د, ت ب ب, ص م د) acceptable or should they stay unresolved?
6. **Root type.** What type is `ي و م` (first and second letters weak)? It is currently stored as `lafif_maqrun`, which this project defines for the 2nd and 3rd letters.
7. **Glosses.** Are the glosses for `صمد`, `قيوم`, `إله` and `إبليس` acceptable as neutral lexical glosses? (A separate native check of the Bahasa Melayu glosses is needed.)

## 11. Review decision vocabulary
`APPROVE` · `APPROVE_WITH_MODIFICATION` · `REJECT` · `NEEDS_MORE_EVIDENCE` · `OUT_OF_SCOPE`

## 12. How to record your decisions
One entry per record or question:

```json
{ "record": "2:34:3", "decision": "APPROVE_WITH_MODIFICATION", "reviewer_id": "<your id>", "date": "YYYY-MM-DD",
  "rationale": "<short reason>", "requested_change": "<what should change, or null>" }
```

Decisions are kept in a separate file and applied only by QURRA editors after you have read the result. A record becomes `reviewed` (origin `expert_reviewed`) only then, never by being listed here.

## 13. A technical note for the reviewer (R1)
Segment spellings in the pilot were typed with a different order of combining marks (vowel before shadda) from the Tanzil text (shadda before vowel). They look identical on screen. Whether the project should keep Tanzil's mark order or canonicalise segment surfaces is **undecided** and is a technical, not a linguistic, question; you do not need to rule on it.
