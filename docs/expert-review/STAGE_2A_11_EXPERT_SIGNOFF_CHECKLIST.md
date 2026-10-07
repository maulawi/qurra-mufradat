# QURRA Root Verification Protocol: Expert Sign-Off Checklist

> **Status: PREPARED, NOT SENT.** Nothing in this folder has been sent to, or discussed with, any external party.
> It is kept separate from production data on purpose. The app does not read anything under `docs/`.
> The root protocol it covers (v1.0-rc) is **not frozen**; no root in the dataset has been assigned under it.

**How to use this document.** It asks a qualified reviewer to approve, revise or reject methodology rules for the `root` field in an educational Qur'anic vocabulary app. The reviewer is not asked to annotate any lemma. Please answer from classical sources and your own competence. Nothing here asks you to consult or agree with any modern database. Disagreement and rejection are welcome and will be recorded as given.

**Background in brief.** QURRA wants a `root` field it can defend as its own editorial work, with evidence from classical lexica kept separately. The proposed definition is:

> **QURRA root** = the underlying radicals of a lemma's lexical base, reversing inflection and regular derivation, placed where classical lexicographers index it whenever the two agree. Where indexing and radical analysis differ, the radical analysis is displayed as `root` and the indexing heading is stored separately. It is not a claim about historical or Proto-Semitic derivation.

Candidate analyses quoted below are the project's understanding of the tradition and may be wrong. Please correct them.

## 1. Reviewer qualification (competence, not credentials)

The reviewer should be able to do all of the following **without assistance**:

1. Read and navigate entries in a classical root-ordered Arabic lexicon (for example Lisan al-Arab, Sihah / Mukhtar al-Sihah, Qamus al-Muhit, Lane's Lexicon) and understand its abbreviations, cross-references and arrangement.
2. Analyse Arabic morphology: verb forms I–X, weak, hamzated and geminate verbs, nominal patterns, broken plurals, participles, masdars.
3. Distinguish a lexicon's indexing choice from a morphological claim about radicals.
4. Recognise the main points on which the grammatical and lexicographic traditions (for example Basran / Kufan) disagree.
5. Give a written rationale that another expert could audit.

The reviewer must also be able to work independently of modern corpora, and should state any prior involvement in Qur'anic corpus annotation (a conflict-of-interest declaration, not a disqualification).

## 2. EC-Q: reduplicated quadriliterals

**Items:** زَلْزَلَ، وَسْوَسَ، دَمْدَمَ

**Current proposal (an editorial convention, not a linguistic fact):** `root` = four-letter form (ز ل ز ل); `root_alternatives[]` = doubled triliteral (ز ل ل); `lexicographic_heading` = whatever each consulted lexicon uses.

**Questions:**
1. Is a four-letter `root` linguistically defensible for an educational root field?
2. If not, which should be displayed: (A) four-letter, (B) doubled triliteral, (C) another representation (please specify)?
3. Should the answer differ by item?
4. Would a learner be misled by grouping or not grouping the word with ز ل ل?

The reviewer may reject the proposal. Decision: APPROVE / APPROVE WITH MODIFICATION / REJECT / NEEDS MORE EVIDENCE.

## 3. G1: geminate (shadda) nouns

**Items:** رَبّ، ضَالّ, plus any further noun examples the reviewer thinks decisive.

**Current proposal:** verbs with a shadda on the stem → two identical radicals. Nouns with shadda → not inferred from shadda alone; evidence required (class B).

**Questions:**
1. When can a shadda on a noun be read as two identical radicals (for example participles of Form I geminate verbs)?
2. What other sources can produce a shadda (assimilation, pattern gemination such as فَعَّال / فَعِّيل, loss of a weak radical, final-radical doubling)? Please list the categories.
3. Can you approve a short decision rule (a sequence of yes/no tests a non-expert annotator could follow)? If so, write it.
4. For رَبّ: what must the evidence show before a single root is displayed, and what should happen if lexica differ?

## 4. W1/W2: weak-radical identification (nouns without a verb)

**Items:** يَد، يَوْم، دِين

**Current proposal:** W1: determine the radical from non-elided forms (imperfect, masdar, dual, plural, derived forms). If none exists, use explicit classical lexicographic evidence. W2: if forms or lexica conflict, the reviewer decides and records the evidence form.

**Questions:**
1. What is the minimum evidence for assigning a weak radical when there is no verb? Which of these suffice, alone or combined: dual form; plural form; derived form (diminutive, denominal verb, relative adjective); explicit lexicon statement of class (واوي / يائي); agreement of more than one lexicon; the reviewer's own analysis with a written rationale?
2. Is a lexicon's placement itself acceptable as evidence, or only an explicit statement?
3. When dual/plural forms point both ways, should `root` stay null or follow a priority rule?

## 5. N2: nouns with a lost lām

**Primary test:** يَد

**Questions:**
1. What constitutes sufficient evidence for reconstructing a missing third radical? (Acceptable evidence / insufficient evidence.)
2. Is one authoritative lexicon enough, or are two required? If two, does it matter if one derives from the other?
3. Should the reconstructed radical be shown to learners with a "reconstructed" flag?
4. Should the lexicon's own heading (possibly two letters) be stored separately as `lexicographic_heading`?

## 6. D1: homograph disambiguation

**Test pair:** سَأَلَ ("ask") vs. سَالَ ("flow"). Principle: the same consonantal spelling does not mean the same lemma.

**Proposed matching order (change freely):**

| Step | Check | If it settles the match |
|---|---|---|
| 1 | Fully vocalised lemma form and POS match the lexicon's headword | Accept |
| 2 | Meaning matches exactly one article's sense range | Accept |
| 3 | Imperfect / masdar forms attested in the Qur'an match one article | Accept |
| 4 | Still ambiguous | Reviewer decides from Qur'anic context; record the verse |
| 5 | Still ambiguous | UNRESOLVED |

**Questions:** Is this the right order? Should Qur'anic context be a tie-breaker only, or a primary signal? What should the annotator do when a lexicon lists the same word under two roots in separate articles? Please give the matching result for سَأَلَ / سَالَ from classical sources only.

## 7. P1: productive vs. lexicalised participles and adjectives

**Items:** مُسْتَقِيم، مَغْضُوب، مَسْجِد, plus other examples.

**Current proposal:** a regular participle inherits the root of its base verb; a lexicalised noun or adjective is reviewed independently.

**Questions:**
1. What test separates (A) a productive participle (inherit the verb's root) from (B) a lexicalised item (independent review)? Possible tests: own article in the lexicon; meaning no longer predictable from the verb; plural or feminine behaviour a participle would not have; attested as a noun or name.
2. Where would you place مُسْتَقِيم, مَغْضُوب, مَسْجِد?
3. May lexicalised items whose root is still transparent (مَسْجِد ← س ج د) inherit, or must they be reviewed independently?

## 8. Initial alif and hamza

**Examples:** أَخَذَ، آمَنَ، آيَة، مَاء

Please separate the **linguistic analysis** (hamza radical, weak letter, vowel seat, or hamzat al-wasl) from **QURRA spelling normalisation** (any hamza radical is written ء, whatever the seat; the spelling rule makes no claim about the analysis).

**Questions:** What tests distinguish a true hamza radical from an alif that is a vowel seat or weak radical? How should آ be treated? Is "an initial alif is a hamza radical only when the imperfect or a derived form shows ء; otherwise it is reviewed" a safe rule? Is writing every hamza radical as ء acceptable for learners?

## 9. Verb-particles

**Items:** لَيْسَ، عَسَى. Options: (A) root-bearing verbs; (B) null (treated as particles); (C) a special category requiring individual review.

Which option, and on what grounds (conjugation, morphology, classical grammarians' classification, lexicon placement)? If (A), what are the roots and what supports them? Does the answer extend to other defective verbs? Please do not decide on the basis that the morphology is unusual; give the argument.

## 10. RED items: disputed or unresolved

Answer each with one of: **ASSIGN / DISPUTED / NULL / UNRESOLVED**. Candidate analyses are the project's understanding and are for the reviewer to correct.

| Item | Candidate analyses | Current QURRA status | Question |
|---|---|---|---|
| اسْم | س م و (Basran); و س م (Kufan); possibly others | DISPUTED, no root | Is there a defensible indexing convention QURRA could adopt and label as such, or should it stay DISPUTED? |
| ابْن | ب ن و; ب ن ي; possibly ء ب ن | DISPUTED, no root | Same question. Does hamzat al-wasl affect the analysis? |
| اللَّه | ء ل ه; و ل ه; ل ي ه; non-derived (جامد) | UNRESOLVED, no root | Which status? Is "non-derived" a recognised position QURRA could cite instead of a root? |
| إِبْلِيس | ب ل س (Arabic derivation); foreign name | not yet in the dataset | Is there a classical consensus? If not, NULL or DISPUTED? |
| امْرَأَة | م ر ء (feminine of امْرُؤ) | not yet in the dataset | Is م ر ء the settled classical placement? |
| رَبّ | ر ب ب; ر ب و | provisional placeholder (ر ب ب) | Which status, and what evidence rule? |

## 11. Reviewer decision table

Decisions: APPROVE / APPROVE WITH MODIFICATION / REJECT / NEEDS MORE EVIDENCE.

| Rule | Current QURRA proposal | Reviewer decision | Reviewer rationale | Required change |
|---|---|---|---|---|
| Root definition | Hybrid; radicals first; indexing stored separately | | | |
| EC-Q | 4-letter root; doubled triliteral as alternative | | | |
| G1 (nouns, رَبّ) | Shadda alone is not evidence for nouns | | | |
| W1/W2 | Non-elided forms, then lexicon evidence, then reviewer | | | |
| N2 | Reviewer-cited dual/plural/derived evidence | | | |
| D1 | Vocalisation → POS → meaning → derived forms → Qur'anic use | | | |
| P1 | Productive participles inherit; lexicalised items reviewed | | | |
| Hamza/alif | ء spelling normalisation; analysis recorded separately | | | |
| Verb-particles | Special review | | | |
| اسْم / ابْن / اللَّه / إِبْلِيس / امْرَأَة / رَبّ | DISPUTED / NULL / UNRESOLVED / class B | | | |
| Particle null policy | root = null for closed-class words | | | |
| Disputed-root policy (classes A–D) | Never silently assign class C | | | |

## 12. Protocol freeze criteria

QURRA Root Verification Protocol v1.0 can be frozen only when **all** of these hold:

1. Every YELLOW rule has a recorded reviewer decision; none is REJECT or NEEDS MORE EVIDENCE.
2. Every RED item has a recorded status with rationale.
3. D1 has an approved step-by-step procedure and a worked سَأَلَ / سَالَ example from classical sources only.
4. N2 has an approved evidence standard (acceptable, insufficient, number of lexica).
5. EC-Q is approved or replaced.
6. The reviewer's comments on the root definition are resolved.
7. No unresolved methodological contradiction between rules.
8. A conflict-of-interest declaration is filed; the reviewer saw no Wikidata / QAC data for these decisions.
9. Reviewer decisions are recorded verbatim (including dissent), the protocol is revised, and the reviewer re-reads and signs the revised text.
10. The final text is versioned and dated (with a content hash) before any pilot lemma is selected.
11. The pilot selection method is fixed and logged before any comparison source is consulted.
12. The pilot lemma list comes from a source independent of QAC-derived lemma data, or the dependency is declared.
13. A procedure exists for post-freeze changes (version bump, reason, reviewer sign-off, re-review of affected items).
14. If the reviewer is unavailable or rejects a core rule, the protocol stays unfrozen.

## 13. What happens after approval

1. Revise the protocol text with the reviewer's decisions (v1.0-rc).
2. The reviewer re-reads and signs the revised text.
3. Freeze v1.0: record version, date and hash.
4. Fix the pilot-selection method; select and log the lemmas before consulting any comparison dataset.
5. Run the pilot under the production gate (see `STAGE_2_IMPLEMENTATION.md`, "Root assignment gate"), using comparison sources only after each decision and flagging them.
6. Evaluate disagreement rates and rule ambiguity; revise only through the change procedure.

## Do not use as evidence

QAC root values; Wikidata root values; Sharjah Historical Dictionary; Siwar; LLM output; unreferenced online root lists; undocumented datasets. These may be used for comparison and QA after a decision is logged, never as the evidence that establishes a QURRA root.
