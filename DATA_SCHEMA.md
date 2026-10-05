# QURRA Mufradat al-Qur'an — Data Schema

This document explains the conceptual data model behind `js/demoData.js`, so
that the demo dataset can eventually be replaced with a real, scholarly
dataset **without changing the UI**. It follows the structure defined in the
"QURRA Mufradat al-Qur'an — Blueprint" product specification.

If you are about to work on real data ingestion (Stage 2+), read this file
first — it documents several deliberate modelling decisions, not just the
shape of the objects.

---

## 1. The core idea: Token → Segment → Lemma → Root

Every word printed in the Mushaf is a **Token** (one word, one position, one
Qur'anic occurrence). A Token is made of one or more **Segments** — a
proclitic (attached prefix, e.g. بِ، لِ، الـ), exactly **one** stem, and
zero or more enclitics (attached suffixes, usually pronouns).

Only the **stem segment** points to a **Lemma** (a dictionary citation
form — "مُتَّقٍ", "فَعَلَ", "لَمْ"). Proclitics and enclitics never carry a
`lemmaId`; they carry their own small inline `function`/`gloss`
(proclitics) or `pronounFeatures` (enclitics) instead, because they are
function words or pronoun markers, not separate dictionary entries.

A Lemma may point to a **Root** (the three-or-so-letter consonantal root,
e.g. و ق ي). Particles and a handful of frozen/pronoun-like nouns
(كَيْفَ، ذَٰلِكَ) have `rootId: null` — this is linguistically correct, not
a data gap, and the UI shows it as "no recorded root" rather than hiding
the field or inventing one.

```
Token (one Mushaf word, one occurrence)
 └─ Segments[] (ordered: proclitic(s) → stem → enclitic(s))
     └─ stem segment only → Lemma (dictionary form)
                              └─ Root (optional — not all lemmas have one)
```

**Why this matters for the UI:** a lemma's explanation (gloss, derivation,
conjugation) is written **once**, on the Lemma record. Every Token that
uses that lemma links to it rather than repeating the explanation. This is
why `js/data.js`'s `getToken()` resolves `token.lemma` by reference instead
of duplicating lemma fields onto every token — see §9.

---

## 2. Object shapes

### `root`
```js
{
  id: "wqy",
  letters: "وقي",
  rootType: "lafif_mafruq", // see §4 — NOT "regular/irregular"
  coreField: { en: "guarding, protecting, being mindful of", ms: "menjaga, melindungi, bertakwa" },
  provenance: { coreField: "src-qurra-editorial" }
}
```
`coreField` is a **multilingual field** (§12) — `letters` and `rootType` are
Arabic/coded data and stay as plain, language-independent values.

### `lemma`
```js
{
  id: "muttaqin-1",
  form: "مُتَّقٍ",
  pos: "ism",                 // "ism" | "fiʿl" | "harf"
  rootId: "wqy",               // or null
  derivationType: "ism_faʿil",  // ism-only; see §4
  derivedFromVerbForm: "VIII",  // ism-only, optional
  verbForm: "VIII",             // fiʿl-only
  functionInventory: ["jarr"],  // harf-only — see §5
  gloss: { en: "...", ms: "...", source: "src-qurra-editorial" },
  conjugation: {                // fiʿl-only, optional
    maadi: "اِتَّقَى", mudari: "يَتَّقِي", amr: "اِتَّقِ",
    generationMethod: "stored_verified",   // see §6
    source: "src-verified-conjugation",
    note: { en: "...", ms: "..." }          // optional, multilingual — see §12
  }
}
```
`gloss` is a multilingual field (§12); `form`, `rootId`, `derivationType`,
`verbForm`, and `functionInventory` are Arabic/coded data, translated at
*render time* (via `enum.*` translation keys), never stored per-language.

### `token`
```js
{
  id: "2:2:7",            // "surah:ayah:position"
  surahId: 2, ayahId: 2, position: 7,
  surfaceForm: "لِّلْمُتَّقِينَ",
  pos: "ism",
  segments: [
    { type: "proclitic", surface: "لِّ", function: "jarr", gloss: "for/to" },
    { type: "stem", surface: "لْمُتَّقِينَ", lemmaId: "muttaqin-1" }
  ],
  morphology: { number: "jamʿ", gender: "mudhakkar", ... },  // pos-specific, see §4/§5
  segmentationNote: "...",  // optional — see §7
  provenance: { text: "src-quran-text", morphology: "src-morphology" }
}
```

### `ayah`
```js
{ surahId: 2, ayahId: 2, tokenIds: ["2:2:1", ..., "2:2:7"], translation: { en: "...", ms: "..." } }
```
The displayed Arabic ayah text is **derived**, not stored twice: `getAyah()`
in `js/data.js` builds it by joining each token's `surfaceForm`, so the
Mushaf text and the word-level data can never drift out of sync.
`translation` is a multilingual field (§12) — it replaces the earlier
English-only `translationEn` string.

### `surah`
```js
{ number: 2, nameAr: "البقرة", nameEn: "Al-Baqarah", ayahCount: 286, revelation: "Medinan", demoAyahs: [2] }
```
`ayahCount` is the real total in the Mushaf; `demoAyahs` lists only the
ayahs this *prototype* actually has token data for. The UI always shows
both numbers so it's never ambiguous that this is a partial demo.
`nameAr`/`nameEn` are proper nouns and are **never translated** — a Malay UI
still shows "Al-Baqarah", not a Malay surah name (see §12). `revelation` is
a plain code (`"Meccan"`/`"Medinan"`), not a multilingual field — its label
is resolved per-language at render time from `enum.revelation.*`, the same
mechanism used for every other coded/enum value.

### `juz`
```js
{ number: 1, nameAr: "الجزء الأول", available: true, surahIds: [1, 2], note: { en: "...", ms: "..." } }
```
`available: false` Juz (28 of the 30) have `surahIds: []` and a note
explaining they're not yet populated — this is how the full 30-card grid on
Home stays honest without looking broken (see ARCHITECTURE.md §5). `note` is
a multilingual field (§12).

### Source registry entry
```js
"src-qurra-editorial": { id: "src-qurra-editorial", type: "editorial" }
```
Every field that carries scholarly weight (a gloss, a core field, a
conjugation, morphology) references a source **id** here — never a literal
citation string inline. See §8. The registry itself only records each
source's language-independent `id`/`type`; its displayed `name` and
`status` text live in `js/translations/en.js` / `ms.js` under
`source.<id>.name` / `source.<id>.status` (§12) so that disclaimer text is
translated like any other UI string instead of being hardcoded in English
on the data object.

---

## 3. Independent (non-exclusive) attributes — not a single "type" enum

Per the blueprint, اسم (noun) and فعل (verb) attributes are modelled as a
set of **independent fields**, not a single mutually-exclusive "word type"
dropdown. A noun is simultaneously described by number, gender,
definiteness, reference class, derivation type, and declension — these can
combine in many ways and none of them implies the others. `morphology`
objects on a token carry only the fields that apply; an absent field is
simply omitted rather than set to a placeholder.

## 4. اسم (noun) fields

| Field | Values | Notes |
|---|---|---|
| `number` | `mufrad` / `muthanna` / `jamʿ` | |
| `pluralType` | `jamʿ_mudhakkar_salim` / `jamʿ_muannath_salim` / `jamʿ_taksir` | only when `number: "jamʿ"` |
| `gender` | `mudhakkar` / `muannath` | |
| `definiteness` | `{ state, cause }` | `state`: `maʿrifa`/`nakira`; `cause`: `bi_al`/`idafa`/`alam`/`ishara`/`mawsul` |
| `referenceClass` | `alam`/`ishara`/`mawsul`/`istifham`/`pronoun`/`null` | |
| `derivationType` (on the **lemma**) | `jamid`/`masdar`/`ism_faʿil`/`ism_mafʿul`/`sifa_mushabbaha` | |
| `declension` | `mabni`/`muʿrab` | |

## 5. فعل (verb) fields — and why we never say "tense"

| Field | Values |
|---|---|
| `form` | `maadi` / `mudariʿ` / `amr` — labelled in the UI as **Perfective / Imperfective / Imperative**, never "past/present/future tense". Arabic aspect does not map cleanly onto English tense, and the blueprint is explicit on this point. |
| `person` | 1 / 2 / 3 |
| `number` | `mufrad`/`muthanna`/`jamʿ` |
| `gender` | `mudhakkar`/`muannath` |
| `voice` | `active`/`passive` |
| `verbForm` (on the **lemma**) | I–X (the classical "form" system) |

حرف (particle) function is **contextual** — the same particle lemma can
serve different grammatical roles depending on the sentence. This is why
`lemma.functionInventory` (every role this particle *can* play) and
`token.morphology.functionHere` (the role it *actually plays in this
occurrence*) are kept as two separate fields rather than one. The word-detail
UI deliberately surfaces this as "Function in this verse", not "Function",
to keep that distinction visible to a learner.

## 6. Root soundness/type — not "regular/irregular"

`root.rootType` uses the traditional morphological classification instead
of an ambiguous regular/irregular toggle (explicitly rejected in the
blueprint):

- `sahih_salim` — sound root, no weak letters
- `ajwaf` — hollow (weak middle radical, و/ي)
- `naqis` — defective (weak final radical)
- `mudaaf` — doubled/geminate (two identical radicals, e.g. ر ب ب)
- `lafif_mafruq` — two weak radicals, **not** adjacent (e.g. و ق ي — 1st and 3rd)
- `lafif_maqrun` — two weak radicals, adjacent (e.g. ي و م — 2nd and 3rd)

*(Editorial note: an earlier version of the product blueprint's own sample
JSON classified و ق ي as `naqis`. That undercounts it — a weak letter in
**both** the first and third position makes it `lafif_mafruq`, which is the
classification used here. Worth fixing in the blueprint doc at some point;
not corrected retroactively as part of this build to avoid scope creep.)*

## 7. Segmentation is sample data, not a stripping algorithm

Segmentation in this prototype is **hand-authored sample data**, not the
output of a prefix-stripping algorithm (explicitly out of scope for this
stage). Two things to know before extending it:

- **Sun-letter / moon-letter assimilation** is applied per word when the
  proclitic is the definite article (ال): sun letters (ر ت ث د ذ ز س ش ص ض
  ط ظ ل ن) get a bare `"ال"` proclitic with the assimilation shadda shown on
  the stem; moon letters get an explicit sukoon, `"الْ"`.
- **Orthographic fusion**: لِ (the jarr proclitic) followed by ال + a noun
  starting with ل (as in الله) spells as a doubled, fused لّ
  (لِلَّهِ، لِّلْمُتَّقِينَ) with hamzat-wasl elision. Concatenating segment
  surfaces literally does **not** reproduce this spelling. Rather than
  faking a "clean" segmentation or silently showing an inaccurate
  reconstruction, affected tokens carry a `segmentationNote` string
  explaining the fusion. See tokens `1:2:2` and `2:2:7`.

## 8. Provenance / source registry

No root, lemma, or token field carries a literal citation string. Instead,
every field group (gloss, coreField, conjugation, morphology, text) carries
a `source` id that resolves against `QM_SOURCE_REGISTRY`. Every registry
entry's `status` field is an explicit, human-readable disclaimer — most say
some version of "demo/sample content, not yet scholar-verified." This is
intentional: **no step of this prototype claims a real source has been
consulted that hasn't been.** `src-raghib-mufradat` exists in the registry
as a named placeholder for a future, real source, but is not attached to
any actual content in this demo dataset.

## 9. Lemma explanations are never duplicated onto tokens

A token never repeats its lemma's gloss, derivation type, or conjugation.
`js/data.js`'s `getToken()` resolves `token.lemma` by reference
(`getLemma(stemSegment.lemmaId)`); the word-detail UI reads lemma-level
fields from `token.lemma`, not from the token itself. If you're adding real
data, keep this separation — it's what lets `js/data.js`'s `getOccurrencesForLemma()`
show every occurrence of a word without the lemma's explanation being
copy-pasted dozens of times.

## 10. Verified-vs-draft conjugation gating

A verb lemma's `conjugation.generationMethod` field gates whether the UI
displays the ماضي/مضارع/أمر triplet at all:

- `"stored_verified"` — full triplet shown.
- `"stored_verified_partial"` — shown, but a form can legitimately be
  `null` (see `raa-1`, رَأَى, whose أمر is intentionally omitted with an
  explanatory `note` rather than guessed).
- absent / any other value — the UI shows a "withheld — not yet
  scholar-verified" message instead of a guess.

This directly implements the blueprint's rule that the product must never
display a conjugation form that hasn't actually been verified.

## 11. What this demo dataset deliberately does and doesn't cover

Included, specifically to exercise every part of the data model: a simple
noun, a plural noun (broken + sound), a derived noun (اسم فاعل), a verb
with a verified conjugation and one with a partially-withheld one, a
particle whose function is genuinely contextual, a segmented word
(including the لِ+ال fusion case), a root with more than one lemma (و ق ي,
ر ح م, هـ د ي), and a lemma with more than one Qur'anic occurrence.

**Known gap:** every token in this demo dataset is grammatically
masculine — there is no feminine-noun or feminine-verb example yet. Timing
constraint for this stage; worth adding in the next data pass.

**Not included, by design:** i'rab/grammatical case, tafsir, a complete
morphology database, a regular/irregular classification, any fabricated
root, conjugation, or citation. See ROADMAP.md.

## 12. Multilingual fields — the `{ en, ms, ... }` pattern

As of v0.2, the UI supports English and Bahasa Melayu (see ARCHITECTURE.md
for the full i18n architecture). This section documents how that affects
the **data model** specifically — the UI-string translation layer
(`js/i18n.js`, `js/translations/en.js`, `js/translations/ms.js`) is
documented separately and is not part of this schema.

**The rule:** only genuinely free-text, learner-facing explanatory content
is bilingual on the data object. Everything else — Arabic text, Arabic
roots/lemma forms, and coded/enum values (`pos`, `rootType`,
`derivationType`, `form`, `revelation`, …) — stays a single
language-independent value, exactly as before, and is translated **at
render time** by looking up an `enum.*` key in the UI translation layer.
This keeps the dataset from doubling in size for a second language, and
keeps Arabic grammatical terminology (which must never be "translated")
untouched by definition — it was never stored per-language in the first
place.

Fields that **are** multilingual, and nowhere else:

| Object | Field | Shape |
|---|---|---|
| `root` | `coreField` | `{ en, ms }` |
| `lemma` | `gloss` | `{ en, ms, source }` |
| `lemma.conjugation` | `note` (optional) | `{ en, ms }` |
| `token` | `segmentationNote` (optional) | `{ en, ms }` |
| `ayah` | `translation` | `{ en, ms }` |
| `juz` | `note` | `{ en, ms }` |

A multilingual field is read with `QMI18n.pick(field)` (never indexed
directly as `field.en`), which resolves the current UI language and falls
back to English — then to whatever language is actually present — if a
translation is missing, so a field that only has `en` (nothing has been
translated yet) never renders blank. `source` sits alongside `en`/`ms` on
`gloss` because it is a source-registry id, not translatable text — it is
not itself a language key, so `QMI18n.pick()` skips it when falling back.

**What stays untouched (not bilingual, deliberately):** `root.letters`,
every `lemma.form`/`token.surfaceForm`/segment `surface` (Arabic word
forms), `surah.nameAr`/`nameEn` (proper nouns), and every coded/enum field
(`pos`, `rootType`, `derivationType`, `form`, `voice`, `functionHere`,
`referenceClass`, `declension`, `pluralType`, `gender`, `number`,
`definiteness.state`/`.cause`, `revelation`, `verbForm`,
`conjugation.generationMethod`). Arabic grammatical terminology shown
alongside a translated label (e.g. "Noun · Kata Nama · اسم") comes from a
single shared `ARABIC_TERMS` constant in `js/wordDetail.js`, re-exported for
`js/render.js` — not from the data model at all — specifically so the
Arabic term can never drift between languages or be accidentally
translated.

**Adding a third language later** (per blueprint — not implemented in
v0.2, which is EN + BM only): add the new language's key (e.g. `"ar"`) to
each multilingual field *only where that language's content actually
exists* — do not pre-populate every field with placeholder or
machine-translated text just to "complete" the schema. A field missing the
new language falls back to English automatically via `QMI18n.pick()`, so
partial coverage is always safe to ship.
