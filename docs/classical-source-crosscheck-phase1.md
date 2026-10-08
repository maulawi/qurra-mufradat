# Classical source cross-check — Phase 1 (audit only)

Status: **research notes, not expert-reviewed, partial.** No production data was changed. Machine-readable findings: `data/qurra/review/classical-crosscheck.json` (148 findings, all `needs_editorial_decision`).

**Coverage so far:** 63 review items covering 78 QURRA lemmas, in two passes. Pass 1 covered 18 items (51 findings). Pass 2 added 45 items (97 findings): the remaining P0 items named in the brief, four gloss re-reviews, and 19 pilot lemmas with provisional roots, which have **Maqayis evidence only**. This is a P0 evidence-gathering pass; it does not cover the ~61,285 analysed tokens, and P1 has not been started. Section K lists what is still unread.

## A. Sources used

| Id | Work | Used for | Locator |
|---|---|---|---|
| SRC-CLASSICAL-MUFRADAT | مفردات ألفاظ القرآن (al-Raghib al-Isfahani), supplied scan | lexical meaning, distinctions, Qur'anic usage | printed page = PDF page |
| SRC-CLASSICAL-MAQAYIS | معجم مقاييس اللغة (Ibn Faris), supplied scan | roots, radical structure, أصل المعنى | PDF page = printed page + 33 |

Both files are image-only scans, read page by page; difficult readings were checked against the page image. Citations give the printed page and the entry heading. The Maqayis edition and copyright details were read from its own front matter. The Mufradat PDF shows no edition details, so none are recorded. **Both books are research-only here:** their licence status is unknown, so the JSON holds paraphrased evidence only and no long quotation.

## B. Source roles

Mufradat answers "what does the word mean in the Qur'an, and how do near-synonyms differ". Maqayis answers "which root, and what is its basic idea". Where a point is outside a book's role the finding is `SOURCE_DOES_NOT_ADDRESS_IT`, not a disagreement. A missing entry is never treated as evidence that a QURRA analysis is wrong.

Three things are kept apart throughout: **radical analysis** (which letters the word is built from), **classical indexing** (where a lexicographer files it, which can differ, as with قرأ filed under قري, or صراط under the sin form), and **the QURRA root assignment** (the root QURRA itself assigns).

**Source indexing is not a QURRA root assignment.** A book that discusses زلزل under the triliteral family ز ل ل tells us how its author files the word; it does not make ز ل ل the root of زلزل. زلزل is a quadriliteral (رباعي) lexical root and must not be reduced to a triliteral. The JSON now records this explicitly: `source_indexing` (where the book discusses the word) is separate from `qurra_value` (the QURRA root and candidates), and `qurra_root_category` records `rubai` for the four-letter cases. The data model supports four-radical roots (`DATA_SCHEMA.md` §6a).

## C. Methodology

Lemma-level review, not token-level. For each item the QURRA root candidates and gloss were compared with each book's entry. Each check gets one finding type (AGREES, SUPPORTS_WITH_NUANCE, POSSIBLE_CORRECTION, DISAGREES, SOURCE_DOES_NOT_ADDRESS_IT, SOURCE_AMBIGUOUS, NEEDS_FURTHER_REVIEW). Homographs and contextual words are flagged `context_review_required`. Where a book was not read or an entry not found, that is stated. Nothing was inferred beyond what the page shows.

**Corrections to Pass 1 (citation errors, found in Pass 2).** Three Pass 1 findings recorded an entry as missing when it exists. They were revised in place (same review ids; each carries `revised_in_pass` and a `revision_note`):

| Review id | Item | Pass 1 | Corrected |
|---|---|---|---|
| cc1-015 | ab (father), Mufradat | no father entry found in pp. 58-60 | entry أبا is on pp. 57-58, at the start of the Alif book; it agrees with Maqayis |
| cc1-043 | aya, Maqayis | entry not located | entry is on p. 85, under أيي |
| cc1-046 | ma-water, Mufradat | entry not read | entry ماء is on p. 784 |

## D. Existing pilot findings

The pilot's 91 tokens, conflicts, statuses and candidate roots are untouched. Fourteen disputed-root pilot cases now have classical evidence: ism, ahad, ibn/banu, nas, insan/ins, malak, shaytan, aya, ma-water, nisa, damdama, zalzala, waswas, iblis. **No item contradicts a pilot value.** Where the books favour one candidate, that is a recommendation for an editorial decision only.

## E. Root findings

| Item | QURRA | Mufradat | Maqayis | Candidate supported |
|---|---|---|---|---|
| ism | disputed س م و / و س م | p.428: from سمو | p.469: "it is said" from سمو | س م و |
| ahad | disputed ء ح د / و ح د | pp.66-67: origin وحد | p.47: origin is waw | و ح د |
| ibn/banu | disputed ب ن و / ب ن ي | p.147: from بنو | p.138: بنو separate from بني (build) | ب ن و |
| nas | disputed ء ن س / ن و س | p.828: three views (أنس, نسي, نوس), none preferred | not addressed | none; ن س ي is a recorded third view |
| insan/ins | disputed ء ن س / ن س ي | p.94: أنس; نسي as minority | p.76: أنس | ء ن س |
| malak | disputed م ل ك / ء ل ك | p.82: ألك (originally مَأْلَك) | p.71: ألك, angel not mentioned | ء ل ك (one source) |
| shaytan | disputed ش ط ن / ش ي ط | p.454: nun original, شطن; شاط minority | p.503: same | ش ط ن |
| aya | disputed ء ي ي / ء و ي | pp.101-102: prefers التأيّي (أيي), أوى alternative | p.85: indexed أيي; reports Sibawayh's waw-ayn | **both attested** |
| ma-water | disputed م و ه / م و ء | p.784: origin موه | p.934: موه | م و ه |
| nisa | disputed ن س و / ن س ء | p.804: plural of امرأة from another word | not addressed (pp.987-988) | **neither** |
| damdama | disputed د م د م / د م م | pp.317-318: own heading دمدم, linked to الدمام | p.330: discussed under the doubled entry دمّ | **د م د م stays the QURRA candidate (رباعي).** Maqayis indexing is source indexing only |
| zalzala | disputed ز ل ز ل / ز ل ل | pp.381-382: discussed in the entry زل; repetition echoes the sense of الزلل | p.431: discussed under the doubled entry زلّ | **ز ل ز ل stays the QURRA candidate (رباعي).** Both books index the word under ز ل: source indexing, not a root assignment |
| waswas | disputed و س و س / و س س | p.869: own four-letter heading وسوس | p.1040: indexed as a two-letter entry وسّ | **و س و س stays the QURRA candidate (رباعي).** Maqayis indexing is source indexing only |
| iblis | disputed ب ل س | p.143: "it is said" from أبلس | p.137: derived from بلس | ب ل س |
| allah/ilah | unresolved ء ل ه | pp.82-83: أله; two minority views | p.69: أله; وله excluded | ء ل ه |
| ab | unresolved | pp.57-58: أبو (nourishing) | p.39: أبو | ء ب و (both) |
| akh | unresolved | p.68: أخو | p.49: أخو, hamza substituted | ء خ و |
| akhadha | unresolved | p.67 | p.47 | ء خ ذ |
| abaa | unresolved | p.58: أبى | p.39: أبي | ء ب ي |
| aadha (عاذ) | unresolved | pp.594-595 | p.693 | ع و ذ |
| kufu | unresolved | p.718: كفؤ | p.896: كفأ | ك ف ء |
| qayyum | unresolved | p.691: under قوم, pattern فيعول | p.839: قوم, word not named | ق و م (one source naming it) |
| qaraa | unresolved | pp.668-669: heading قرأ | pp.852-853: indexed under قري | ق ر أ (index differs) |
| rama | unresolved | p.366 | p.400 | ر م ي |
| imraa | unresolved | p.766: under مرأ | not located | م ر أ (one source) |
| qaala | unresolved | pp.689-690 | p.839 | ق و ل |
| kaana | unresolved | pp.730-731 | p.880: كون | ك و ن |
| jahannam | unresolved | pp.209-210: reported Persian loan | not addressed | **none; loanword view** |
| laysa | unresolved | no entry | no entry | **none** |
| idhn (noun) | unresolved | p.71: أذن | pp.50-51: أذن | ء ذ ن |
| yad | unresolved | pp.889-891: يد | p.1069: biliteral يد | convention question |

**Root-convention cases.** Four groups show the split between source indexing and the QURRA root: قرأ (Mufradat قرأ, Maqayis under قري), صراط (Maqayis p.569 says the sad form is a substitution and the word "has been mentioned under the sin"; the sin entry was not located), and the three four-radical words زلزل, وسوس and دمدم (see below). These reflect how a lexicographer files a word, not an error in a QURRA candidate.

**Correction to the earlier wording on the four-radical words.** Earlier text in this file and in the JSON said the evidence supported ز ل ل, and described و س س and د م م as candidates the books "attest". That mixed up source indexing with the QURRA root. The wording and the `candidate_supported` field have been corrected: the four-letter forms ز ل ز ل, و س و س and د م د م remain the QURRA candidates, and the triliteral headings are recorded as source indexing. The finding types of the three zalzala findings, and the Maqayis finding for damdama, changed from AGREES to SUPPORTS_WITH_NUANCE for the same reason. No production data was affected.

**Provisional roots checked against Maqayis only (pilot lemmas, 19 items):** ع ب د, ع ل م, ن ع م, ض ل ل, د ي ن, ف ع ل, غ ي ر, ه د ي, ح م د, ر ح م, ر ي ب, ص ح ب, ص م د, ر ب ب (and the classical entry is under ربّ; ر ب و not read), و ل د, و س ع, ك ت ب, غ ض ب, and ص ر ط (see above). Each entry supports the QURRA root. Mufradat has not been read for these.

## F. Lemma findings

Nothing found that contradicts a lemma identity. Two points for editors: (1) kufu-1 and kufu-2 (كُفُو / كُفُؤ) are spelling variants of one word that both books treat under one entry; (2) idhn-1 is the noun "permission", and the particle إذن is a different word with the same spelling (see H). The Qur'an's آذى (to harm) has no QURRA lemma; its evidence is recorded in the JSON as a no-lemma item (Mufradat pp.71-72 under أذى; Maqayis p.51 under أذي, ء ذ ي).

## G. Gloss findings

- **hand (yad):** correct base sense; the lexical range also includes power, possession and favour. Keep the gloss; add a note.
- **brother (akh):** correct; the range extends to kinsman and companion. Keep; optional note.
- **day (yawm):** correct; add "period; time" as a lexical note.
- **Allah / ilah:** lexical content supported by both books is "the one worshipped; deity" (ilah), and that الله is the same word with the article, restricted in use to the Creator. Statements such as "the One God", the views on bewilderment and veiling, and the quotation on the attributes are interpretation, not lexical definition. Recommendation: for ilah-1 use the lexical gloss; for allah-1 treat "the One God" as an explanatory note rather than the gloss. Editorial decision.
- **qayyum:** "sustains all" is supported by Mufradat (p.691: the one who stands over and guards everything and gives it what it subsists by); "self-subsisting" is not in the passage read.
- **damdama:** "destroy, annihilate" is supported; "crush" and "utterly" are QURRA's wording.
- **samad:** "to whom all turn" is supported (Maqayis p.553); "self-sufficient" was not seen in the page read.
- **kaana:** the classical definitions stress time and occurrence; "to be; to exist" is acceptable but loses that.
- **qaraa:** sound; the base idea is "to gather/join".

## H. Homograph / context findings

Flagged `context_review_required`: ahad, yad, aya, ma-water, hayat (استحيا), idhn, kaana and the four particle items.

- **ما (ma-1, ma-2):** Mufradat pp.784-786 lists ten uses: five as a noun (relative, indefinite, interrogative, conditional, exclamatory) and five as a particle (verbal-noun forming, negative, preventive, one that lets a word govern, extra emphasis). QURRA's two lemmas ("not", "what; that which") are a coarse default. Not addressed in Maqayis (only ماء, water, p.934).
- **لا (la-1):** Mufradat pp.753-754: pure negation, prohibition, class negation, and rejection of earlier speech (as in لا أقسم). Not addressed in Maqayis.
- **مَن / مِن (man-1, min-1):** Mufradat pp.778-779 gives them separate entries and adds a distinct word منّ (favour). QURRA's two lemmas match the first two.
- **إنّ / إنْ / أنّ / أنْ (inna-1, in-1, an-2, anna-1):** Mufradat pp.92-93. إنْ has four uses (conditional, lightened, negative, emphasising); QURRA's "if; (not)" covers two. Not addressed in Maqayis.
- **إذن:** noun "permission" (ء ذ ن) versus the particle "then".
- **ليس:** no entry in either book.

The default analysis for these words is **supported only as a coarse default**; none should be read as a final contextual analysis.

## I. Possible corrections (for editorial decision, nothing applied)

1. nas-1: add ن س ي to the candidate list (recorded by al-Raghib, p.828).
2. sirat-1: record that the classical index for the word is the sin form (Maqayis p.569); the sin entry has not yet been read.
3. yad-1, akh-1, yawm-1: widen the lexical gloss range (notes, not replacements).
4. allah-1: separate the lexical gloss from the theological explanation (see G).
5. qayyum-1, damdama-1, samad-1: review the gloss wording against the sources (see G).

## J. Disagreements

**None found.** No classical source contradicts a QURRA value. The two books differ from each other on three points, all of indexing: قرأ (Mufradat قرأ, Maqayis قري); وسوس, دمدم and زلزل (Mufradat own heading or the zl family, Maqayis the doubled entry); and آية (Mufradat prefers ء ي ي, Maqayis indexes under أيي but reports Sibawayh's waw).

## K. Unresolved questions and work not done

- **Pilot lemmas with provisional roots not yet read in either book:** raa (رأي), istaana (عون), ittaqa and muttaqin (وقي), madda (مدّ), tabba (تبّ), fil (فيل). Mustaqim (ق و م) is covered by the قوم root, not by its own entry.
- **Mufradat not yet read** for the 19 Maqayis-only items in section E.
- **Maqayis not located** for imraa (مرأ). The Maqayis sin entry that Maqayis p.569 points to for صراط was not located.
- **Null-policy function words not read:** على, في, الذين, ذلك, هو, إيا, كيف, لم and the other pilot function words. Only the four named particle families were reviewed.
- **Not started:** P1 and P2.
- Whether a biliteral-indexed word (يد) should have a triliteral root, and how reduplicated forms and weak-final forms are represented, are data-model conventions the sources do not settle.

## Quadriliteral audit (flags only)

`data/qurra/review/quadriliteral-audit.json` (made by `scripts/report/quadriliteral-audit.js`, read-only) records where four-radical roots may occur. It changes nothing.

- **Root inventory:** all 285 roots in the dataset are three-letter; none has four letters.
- **Lemmas with four-letter root candidates (all disputed, no root assigned):** zalzala-1, zilzal-1, waswas-1, waswasa-1, damdama-1.
- **Reduplicated words found in the text (heuristic spelling scan, includes false positives):** the three above, plus the stems صلصل, سلسل, صرصر, زحزح, حصحص, عسعس, رفرف, هدهد, صفصف and others. These have no analysis today; whether any is quadriliteral is an editorial question. Words such as ودود or لؤلؤ may be doubled triliteral or non-Arabic and are only flagged.
- **Not covered:** quadriliteral words that are not reduplicated cannot be found from spelling alone.

## Quality-control counts

| Measure | Pass 1 | Pass 2 | Total |
|---|---|---|---|
| Review items | 18 | 45 | 63 |
| Lemmas covered | 29 | 55 | 78 (distinct; 6 were revisited in Pass 2) |
| Root candidates / roots covered | 21 | 30 | 49 (distinct) |
| Findings | 51 | 97 | 148 |
| AGREES | 24 | 48 | 74* |
| SUPPORTS_WITH_NUANCE | 16 | 36 | 53* |
| SOURCE_DOES_NOT_ADDRESS_IT | 7 | 11 | 15* |
| SOURCE_AMBIGUOUS | 2 | 1 | 3 |
| POSSIBLE_CORRECTION | 2 | 1 | 3 |
| DISAGREES | 0 | 0 | 0 |
| Context-dependent items | 5 | 7 | 12 |

\* The three revised Pass 1 findings changed type (see C) and the wording correction on the four-radical words changed some types, so the Pass 1 and Pass 2 columns do not add exactly to the totals; the total column is the current state of the JSON.
