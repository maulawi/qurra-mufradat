# Lemma fragmentation audit (574 lemmas added by the coverage expansion)

Detection only. **Nothing was merged, split or renamed; all lemma ids are preserved.** Candidate pairs (`scripts/report/lemma-fragmentation-audit.js` → `data/qurra/review/lemma-fragmentation-candidates.json`): 453 pairs by three signals (same bare spelling; same root and part of speech with a near spelling; same root and part of speech, different spelling). The 228 same-part-of-speech pairs with a near spelling were read one by one; the rest are verb/noun pairs and root siblings, which are expected.

## 1. Confirmed duplicates

**None.** No two lemmas have the same spelling, part of speech and meaning. The earlier worry (inflectional variants split into separate lemmas) did not occur: sound plurals, feminines, dual and case forms of one word are generated from one lemma (for example `adj`, `sm`, `sf`, `bp`, dual), and orthographic variants (dagger alef against explicit alef, ya against maqsura) are listed as extra bases of the same lemma (`wahy-1`, `siraj-1`, `qiyam-1`, `sa'y-1`).

## 2. Cases for editorial review (not changed)

**A. One lemma that may hold two lexemes (over-merged).** The sources of the two spellings are different words with a related sense; the lemma's gloss covers both.

| Lemma | Holds | Question |
|---|---|---|
| `ukul-1` | أُكُل (fruit, produce) and أَكْل (eating) | two lexemes? |
| `kharj-1` | خَرْج (payment) and خَرَاج (tribute) | two lexemes? |
| `kibar-1` | كِبَر (old age) and كِبْر (pride) | two lexemes? |
| `khasar-1` | خَسَار, خُسْرَان, خُسْر (three verbal nouns of one verb) | one lemma or three? |
| `fisq-1` | فِسْق and فُسُوق | one lemma (two verbal nouns)? |
| `shukr-1` | شُكْر and شُكُور | one lemma (two verbal nouns)? |

**B. Two lemmas that may be one.**

| Pair | Why | Note |
|---|---|---|
| `akhar-1` (ءَاخَر) and `ukhra-1` (أُخْرَىٰ, pilot) | feminine of the same word | the earlier pilot splits masculine and feminine; see D |
| `adna-1` (أَدْنَىٰ) and `dunya-1` (pilot) | dunya is the feminine of adna | same convention question |
| `kubra-1` (كُبْرَىٰ) and `akbar-1` (أَكْبَر) | feminine of the elative | same |
| `halal-1` (حَلَٰل) and `hill-1` (حِلّ) | both glossed "lawful" | different words in the dictionaries; review the glosses |
| `nasir-1` (نَصِير) and `nasir-2` (نَاصِر) | both glossed "helper" | different patterns (adjective of intensity / active participle) |
| `qadir-1` (قَدِير) and `qadir-2` (قَادِر) | both "able" | same |
| `kufu-1` and `kufu-2` (pilot) | spelling variants | already recorded as pilot conflict `cf-lemma-kufu` |

**C. Convention question behind several items.** The project does not yet decide whether a feminine elative (kubra, ukhra, dunya, ula) is its own lemma or a form of the masculine. The pilot treats them as separate lemmas; the new lemmas follow that. Deciding it once would settle B in one step. It is listed in `docs/morphology-conventions.md` as an open item.

## 3. Correctly separate

- **Verb and verbal noun of one root** (aamana / iman / amn; adala / adl; ahada / ahd): different parts of speech.
- **Different derived forms of one verb** (qadara / qaddara; qaraba / qarraba; hamala / hammala; sakhira / sakhkhara; fasala / fassala; salla / sala): different meanings and valency, as in the existing lexicon.
- **Elative against adjective** (aala-1 / ali-1; ahda-1 / hadin-1; akbar-1 / kabir-1; aqrab-1 / qarib-1).
- **Homographs** that differ by one vowel (deen-1 / dayn-1; janna-1 / jinna-1; walad-1 / walid-1; ashadd-1 / ashudd-1; rajul-1 / rijl-1; dhakar-1 / dhikr-1; daf-1 / dif-1; man-1 / manna-2; awla-1 / ula-1; salam-1 / sullam-1; baad-1 / budd-1; bayat-1 / bayt-1; bada-1 / badaa-1; thawab-1 / thawb-1; hasb-1 / hasib-1).
- **Near-synonyms with different words** (aam-1 / sana-1 "year"; fakiha-1 / thamara-1 "fruit"; halafa-1 / aqsama-1 "to swear").
- **Masdar against participle against adjective of one root** (kadhib-1 / kadhib-2 / kadhdhab-1; zahr-1 / zahir-1 / zahir-2; shakir-1 / shakur-1 / shukr-1; sabir-1 / sabbar-1 / sabr-1).

## Recommendation

No change now. Decide the feminine-elative convention (C) and the six over-merged lemmas (A) in one editorial pass. Merging or splitting changes lemma ids and the pilot's records, so it should be done together with the review of the pilot's own lemma conflicts.
