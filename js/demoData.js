/* ==========================================================================
   QURRA Mufradat al-Qur'an — DEMO DATA (Stage 1 prototype)

   ⚠️  THIS IS NOT THE QUR'AN DATABASE. ⚠️
   This file contains a small, hand-built, illustrative dataset covering
   Surah Al-Fatihah (complete), Qur'an 2:2, and Qur'an 105:1 — selected to
   demonstrate every structural feature of the blueprint's data model
   (noun, plural noun, derived noun, verb, particle, segmentation, a root
   with multiple lemmas, a lemma with multiple occurrences) in miniature.

   It is NOT scholar-verified, NOT sourced from an authoritative morphology
   corpus, and NOT a substitute for the real data-acquisition and
   validation pipeline described in the blueprint (§10–§11). Every
   provenance entry below says so explicitly. Replace this file with real,
   verified data in Stage 2+ — see ARCHITECTURE.md "Future data
   replacement" for how the rest of the app is insulated from that change.

   MULTILINGUAL FIELDS (v0.2): learner-facing free text that the UI
   displays (lemma.gloss, root.coreField, ayah.translation, juz.note, a
   couple of editorial notes) is an object keyed by language —
   { en: "...", ms: "..." } — rather than a plain string. Arabic fields
   (form, letters, surfaceForm, segment.surface) stay plain strings: they
   are never translated. See DATA_SCHEMA.md §12 "Multilingual fields."

   Schema reference: see DATA_SCHEMA.md for full field-by-field docs.
   ========================================================================== */

/* ---------------------------------------------------------------------- */
/* 0. SOURCE REGISTRY — every field below points here, never to a literal  */
/*    string, so a real source can later replace a placeholder in one     */
/*    place. Nothing here is a real citation yet — see each "status".     */
/*    The displayed name/status text itself lives in translations/*.js    */
/*    (keys "source.<id>.name" / "source.<id>.status") so it can be       */
/*    bilingual; this registry stays the language-independent anchor.     */
/* ---------------------------------------------------------------------- */

const QM_SOURCE_REGISTRY = {
  "src-quran-text": { id: "src-quran-text", type: "text" },
  "src-morphology": { id: "src-morphology", type: "corpus" },
  "src-qurra-editorial": { id: "src-qurra-editorial", type: "editorial" },
  "src-verified-conjugation": { id: "src-verified-conjugation", type: "editorial" },
  "src-raghib-mufradat": { id: "src-raghib-mufradat", type: "classical-lexicon" }
};

/* ---------------------------------------------------------------------- */
/* 1. ROOTS                                                                */
/* ---------------------------------------------------------------------- */

const QM_ROOTS = {
  "rhm": { id: "rhm", letters: "رحم", rootType: "sahih_salim",
    coreField: { en: "mercy, compassion, gentleness", ms: "rahmat, kasih sayang, kelembutan" },
    provenance: { coreField: "src-qurra-editorial" } },
  "hmd": { id: "hmd", letters: "حمد", rootType: "sahih_salim",
    coreField: { en: "praise, commendation", ms: "pujian, sanjungan" },
    provenance: { coreField: "src-qurra-editorial" } },
  "rbb": { id: "rbb", letters: "ربب", rootType: "mudaaf",
    coreField: { en: "lordship, nurturing, ownership", ms: "ketuhanan, pemeliharaan, pemilikan" },
    provenance: { coreField: "src-qurra-editorial" } },
  "ʿlm": { id: "ʿlm", letters: "علم", rootType: "sahih_salim",
    coreField: { en: "knowledge; a world/realm (a distinct, lexically specialized sense — see the alam-1 lemma note)", ms: "ilmu, pengetahuan; alam/dunia (makna leksikal yang berbeza dan khusus — rujuk nota lemma alam-1)" },
    provenance: { coreField: "src-qurra-editorial" } },
  "mlk": { id: "mlk", letters: "ملك", rootType: "sahih_salim",
    coreField: { en: "ownership, dominion, sovereignty", ms: "pemilikan, kekuasaan, kedaulatan" },
    provenance: { coreField: "src-qurra-editorial" } },
  "ywm": { id: "ywm", letters: "يوم", rootType: "lafif_maqrun",
    coreField: { en: "day, time", ms: "hari, masa" },
    provenance: { coreField: "src-qurra-editorial" } },
  "dyn": { id: "dyn", letters: "دين", rootType: "ajwaf",
    coreField: { en: "judgment, recompense; religion, a way of life", ms: "pembalasan, ganjaran; agama, cara hidup" },
    provenance: { coreField: "src-qurra-editorial" } },
  "ʿbd": { id: "ʿbd", letters: "عبد", rootType: "sahih_salim",
    coreField: { en: "worship, servitude", ms: "ibadah, penghambaan" },
    provenance: { coreField: "src-qurra-editorial" } },
  "ʿwn": { id: "ʿwn", letters: "عون", rootType: "ajwaf",
    coreField: { en: "help, assistance, support", ms: "bantuan, pertolongan, sokongan" },
    provenance: { coreField: "src-qurra-editorial" } },
  "hdy": { id: "hdy", letters: "هدي", rootType: "naqis",
    coreField: { en: "guidance", ms: "petunjuk, hidayah" },
    provenance: { coreField: "src-qurra-editorial" } },
  "ṣrṭ": { id: "ṣrṭ", letters: "صرط", rootType: "sahih_salim",
    coreField: { en: "a path, a way", ms: "jalan, lorong" },
    provenance: { coreField: "src-qurra-editorial" } },
  "qwm": { id: "qwm", letters: "قوم", rootType: "ajwaf",
    coreField: { en: "standing, uprightness", ms: "berdiri tegak, keteguhan" },
    provenance: { coreField: "src-qurra-editorial" } },
  "nʿm": { id: "nʿm", letters: "نعم", rootType: "sahih_salim",
    coreField: { en: "blessing, favor, bestowal", ms: "nikmat, kurniaan, anugerah" },
    provenance: { coreField: "src-qurra-editorial" } },
  "ghyr": { id: "ghyr", letters: "غير", rootType: "ajwaf",
    coreField: { en: "otherness, difference", ms: "selain, perbezaan" },
    provenance: { coreField: "src-qurra-editorial" } },
  "ghḍb": { id: "ghḍb", letters: "غضب", rootType: "sahih_salim",
    coreField: { en: "anger, wrath", ms: "kemarahan, kemurkaan" },
    provenance: { coreField: "src-qurra-editorial" } },
  "ḍll": { id: "ḍll", letters: "ضلل", rootType: "mudaaf",
    coreField: { en: "going astray, error", ms: "kesesatan, kekeliruan" },
    provenance: { coreField: "src-qurra-editorial" } },
  "ktb": { id: "ktb", letters: "كتب", rootType: "sahih_salim",
    coreField: { en: "writing, prescription, that which is written", ms: "penulisan, ketetapan, apa yang tertulis" },
    provenance: { coreField: "src-qurra-editorial" } },
  "ryb": { id: "ryb", letters: "ريب", rootType: "ajwaf",
    coreField: { en: "doubt, suspicion", ms: "keraguan, syak wasangka" },
    provenance: { coreField: "src-qurra-editorial" } },
  "ṣḥb": { id: "ṣḥb", letters: "صحب", rootType: "sahih_salim",
    coreField: { en: "companionship, accompanying", ms: "persahabatan, menemani" },
    provenance: { coreField: "src-qurra-editorial" } },
  "fyl": { id: "fyl", letters: "فيل", rootType: "ajwaf",
    coreField: { en: "elephant", ms: "gajah" },
    provenance: { coreField: "src-qurra-editorial" } },
  "rʾy": { id: "rʾy", letters: "رأي", rootType: "naqis",
    coreField: { en: "seeing, perceiving (also hamzated on the middle radical)", ms: "melihat, memerhati (turut berhamzah pada huruf tengah)" },
    provenance: { coreField: "src-qurra-editorial" } },
  "fʿl": { id: "fʿl", letters: "فعل", rootType: "sahih_salim",
    coreField: { en: "doing, acting", ms: "melakukan, bertindak" },
    provenance: { coreField: "src-qurra-editorial" } },
  "wqy": { id: "wqy", letters: "وقي", rootType: "lafif_mafruq",
    coreField: { en: "guarding, protecting, being mindful of", ms: "menjaga, melindungi, bertakwa/berwaspada terhadap" },
    provenance: { coreField: "src-qurra-editorial" } }
};

/* ---------------------------------------------------------------------- */
/* 2. LEMMAS                                                               */
/* ---------------------------------------------------------------------- */

const QM_LEMMAS = {
  "ism-1": { id: "ism-1", form: "اسْم", pos: "ism", rootId: null, derivationType: "jamid",
    gloss: { en: "name", ms: "nama", source: "src-qurra-editorial" },
    note: "Root debated among grammarians (س-م-و vs و-س-م) — intentionally omitted here rather than asserted." },

  "allah-1": { id: "allah-1", form: "اللَّه", pos: "ism", rootId: null, derivationType: null,
    gloss: { en: "Allah — the One God", ms: "Allah — Tuhan Yang Maha Esa", source: "src-qurra-editorial" } },

  "rahman-1": { id: "rahman-1", form: "رَحْمَٰن", pos: "ism", rootId: "rhm", derivationType: "sifa_mushabbaha",
    gloss: { en: "the Most Gracious / All-Merciful", ms: "Yang Maha Pemurah / Maha Pengasih", source: "src-qurra-editorial" } },

  "raheem-1": { id: "raheem-1", form: "رَحِيم", pos: "ism", rootId: "rhm", derivationType: "sifa_mushabbaha",
    gloss: { en: "the Most Merciful", ms: "Yang Maha Penyayang", source: "src-qurra-editorial" } },

  "hamd-1": { id: "hamd-1", form: "حَمْد", pos: "ism", rootId: "hmd", derivationType: "masdar",
    gloss: { en: "praise", ms: "pujian", source: "src-qurra-editorial" } },

  "rabb-1": { id: "rabb-1", form: "رَبّ", pos: "ism", rootId: "rbb", derivationType: "jamid",
    gloss: { en: "Lord, Master, Sustainer", ms: "Tuhan, Pemilik, Pemelihara", source: "src-qurra-editorial" } },

  "alam-1": { id: "alam-1", form: "عَالَم", pos: "ism", rootId: "ʿlm", derivationType: "jamid",
    gloss: { en: "world, realm (of creation)", ms: "alam, dunia (ciptaan)", source: "src-qurra-editorial" },
    note: "A distinct lexeme from عَالِم ('knower' — the ism fa'il of عَلِمَ), historically related to the same root but not derivationally the same word; classed here as jamid rather than as an ism fa'il." },

  "malik-1": { id: "malik-1", form: "مَالِك", pos: "ism", rootId: "mlk", derivationType: "ism_faʿil", derivedFromVerbForm: "I",
    gloss: { en: "Master, Owner, Sovereign", ms: "Pemilik, Penguasa, Raja", source: "src-qurra-editorial" } },

  "yawm-1": { id: "yawm-1", form: "يَوْم", pos: "ism", rootId: "ywm", derivationType: "jamid",
    gloss: { en: "day", ms: "hari", source: "src-qurra-editorial" } },

  "deen-1": { id: "deen-1", form: "دِين", pos: "ism", rootId: "dyn", derivationType: "jamid",
    gloss: { en: "judgment, recompense; religion, a way of life", ms: "pembalasan, ganjaran; agama, cara hidup", source: "src-qurra-editorial" } },

  "iyyaa-1": { id: "iyyaa-1", form: "إِيَّا", pos: "ism", rootId: null, derivationType: null,
    gloss: { en: "(a pronoun base that always takes an attached object-pronoun suffix, e.g. إِيَّاكَ \"You alone\")", ms: "(kata dasar ganti nama yang sentiasa disertai akhiran kata ganti objek, cth. إِيَّاكَ \"Engkau sahaja\")", source: "src-qurra-editorial" } },

  "abada-1": { id: "abada-1", form: "عَبَدَ", pos: "fiʿl", rootId: "ʿbd", verbForm: "I",
    gloss: { en: "to worship", ms: "menyembah, beribadah", source: "src-qurra-editorial" },
    conjugation: { maadi: "عَبَدَ", mudari: "يَعْبُدُ", amr: "اُعْبُدْ", generationMethod: "stored_verified", source: "src-verified-conjugation" } },

  "istaana-1": { id: "istaana-1", form: "اِسْتَعَانَ", pos: "fiʿl", rootId: "ʿwn", verbForm: "X",
    gloss: { en: "to seek help, to ask for assistance", ms: "memohon pertolongan, meminta bantuan", source: "src-qurra-editorial" },
    conjugation: { maadi: "اِسْتَعَانَ", mudari: "يَسْتَعِينُ", amr: "اِسْتَعِنْ", generationMethod: "stored_verified", source: "src-verified-conjugation" } },

  "hada-1": { id: "hada-1", form: "هَدَى", pos: "fiʿl", rootId: "hdy", verbForm: "I",
    gloss: { en: "to guide", ms: "memberi petunjuk", source: "src-qurra-editorial" },
    conjugation: { maadi: "هَدَى", mudari: "يَهْدِي", amr: "اِهْدِ", generationMethod: "stored_verified", source: "src-verified-conjugation" } },

  "sirat-1": { id: "sirat-1", form: "صِرَاط", pos: "ism", rootId: "ṣrṭ", derivationType: "jamid",
    gloss: { en: "path, way", ms: "jalan, lorong", source: "src-qurra-editorial" } },

  "mustaqim-1": { id: "mustaqim-1", form: "مُسْتَقِيم", pos: "ism", rootId: "qwm", derivationType: "ism_faʿil", derivedFromVerbForm: "X",
    gloss: { en: "straight, upright", ms: "lurus, tegak", source: "src-qurra-editorial" } },

  "alladhina-1": { id: "alladhina-1", form: "الَّذِينَ", pos: "ism", rootId: null, derivationType: null,
    gloss: { en: "those who", ms: "mereka yang / orang-orang yang", source: "src-qurra-editorial" } },

  "anama-1": { id: "anama-1", form: "أَنْعَمَ", pos: "fiʿl", rootId: "nʿm", verbForm: "IV",
    gloss: { en: "to bestow favor/blessing upon", ms: "mengurniakan nikmat ke atas", source: "src-qurra-editorial" },
    conjugation: { maadi: "أَنْعَمَ", mudari: "يُنْعِمُ", amr: "أَنْعِمْ", generationMethod: "stored_verified", source: "src-verified-conjugation" } },

  "ala-1": { id: "ala-1", form: "عَلَى", pos: "harf", rootId: null, functionInventory: ["jarr"],
    gloss: { en: "on, upon", ms: "atas, ke atas", source: "src-qurra-editorial" } },

  "ghayr-1": { id: "ghayr-1", form: "غَيْر", pos: "ism", rootId: "ghyr", derivationType: "jamid",
    gloss: { en: "other than, not", ms: "selain, bukan", source: "src-qurra-editorial" } },

  "maghdub-1": { id: "maghdub-1", form: "مَغْضُوب", pos: "ism", rootId: "ghḍb", derivationType: "ism_mafʿul", derivedFromVerbForm: "I",
    gloss: { en: "one who is the object of [divine] anger", ms: "orang yang dimurkai [Allah]", source: "src-qurra-editorial" } },

  "la-1": { id: "la-1", form: "لَا", pos: "harf", rootId: null,
    functionInventory: ["nafy_al_jins", "nafy_simple", "nahy", "duʿa"],
    gloss: { en: "no, not — a negation particle whose exact grammatical role depends on context (see its two occurrences in this demo)", ms: "tidak — kata nafi yang peranan nahunya bergantung kepada konteks (rujuk dua kemunculannya dalam demo ini)", source: "src-qurra-editorial" } },

  "dall-1": { id: "dall-1", form: "ضَالّ", pos: "ism", rootId: "ḍll", derivationType: "ism_faʿil", derivedFromVerbForm: "I",
    gloss: { en: "one who has gone astray", ms: "orang yang sesat", source: "src-qurra-editorial" } },

  "kitab-1": { id: "kitab-1", form: "كِتَاب", pos: "ism", rootId: "ktb", derivationType: "jamid",
    gloss: { en: "book, decree, that which is written", ms: "kitab, ketetapan, apa yang tertulis", source: "src-qurra-editorial" } },

  "rayb-1": { id: "rayb-1", form: "رَيْب", pos: "ism", rootId: "ryb", derivationType: "jamid",
    gloss: { en: "doubt, suspicion", ms: "keraguan, syak wasangka", source: "src-qurra-editorial" } },

  "fi-1": { id: "fi-1", form: "فِي", pos: "harf", rootId: null, functionInventory: ["jarr"],
    gloss: { en: "in", ms: "di dalam", source: "src-qurra-editorial" } },

  "huda-1": { id: "huda-1", form: "هُدًى", pos: "ism", rootId: "hdy", derivationType: "masdar",
    gloss: { en: "guidance", ms: "petunjuk, hidayah", source: "src-qurra-editorial" } },

  "muttaqin-1": { id: "muttaqin-1", form: "مُتَّقٍ", pos: "ism", rootId: "wqy", derivationType: "ism_faʿil", derivedFromVerbForm: "VIII",
    gloss: { en: "one who is God-conscious / mindful of God", ms: "orang-orang yang bertakwa", source: "src-qurra-editorial" } },

  "ittaqa-1": { id: "ittaqa-1", form: "اِتَّقَى", pos: "fiʿl", rootId: "wqy", verbForm: "VIII",
    gloss: { en: "to be mindful of God, to guard oneself against wrongdoing", ms: "bertakwa kepada Allah, menjaga diri daripada kesalahan", source: "src-qurra-editorial" },
    conjugation: { maadi: "اِتَّقَى", mudari: "يَتَّقِي", amr: "اِتَّقِ", generationMethod: "stored_verified", source: "src-verified-conjugation" },
    note: "Included to demonstrate that one root (و ق ي) carries more than one lemma. It has no token occurrences in this small demo — see its Lemma page for how the UI handles that honestly." },

  "lam-1": { id: "lam-1", form: "لَمْ", pos: "harf", rootId: null, functionInventory: ["jazm_nafy"],
    gloss: { en: "not (negates a مضارع verb with past-time meaning; also a jussive/jazm marker)", ms: "tidak (menafikan kata kerja مضارع dengan makna lampau; turut berfungsi sebagai penanda jazam)", source: "src-qurra-editorial" } },

  "raa-1": { id: "raa-1", form: "رَأَى", pos: "fiʿl", rootId: "rʾy", verbForm: "I",
    gloss: { en: "to see", ms: "melihat", source: "src-qurra-editorial" },
    conjugation: { maadi: "رَأَى", mudari: "يَرَى", amr: null, generationMethod: "stored_verified_partial", source: "src-verified-conjugation",
      note: {
        en: "Imperative intentionally omitted in this demo. رأى's أمر is an unusually truncated classical form, and the blueprint (§8) is explicit that V1 should never display a conjugation form that hasn't actually been verified — this entry shows that rule in action rather than guessing.",
        ms: "Bentuk أمر sengaja tidak disertakan dalam demo ini. أمر bagi رأى adalah bentuk klasik yang terpotong secara tidak lazim, dan cetak biru (§8) menegaskan bahawa V1 tidak seharusnya memaparkan sebarang bentuk tasrif yang belum disahkan — entri ini menunjukkan peraturan tersebut dilaksanakan, bukan meneka-neka."
      } } },

  "faala-1": { id: "faala-1", form: "فَعَلَ", pos: "fiʿl", rootId: "fʿl", verbForm: "I",
    gloss: { en: "to do, to act", ms: "melakukan, bertindak", source: "src-qurra-editorial" },
    conjugation: { maadi: "فَعَلَ", mudari: "يَفْعَلُ", amr: "اِفْعَلْ", generationMethod: "stored_verified", source: "src-verified-conjugation" } },

  "sahib-1": { id: "sahib-1", form: "صَاحِب", pos: "ism", rootId: "ṣḥb", derivationType: "ism_faʿil", derivedFromVerbForm: "I",
    gloss: { en: "companion, one who accompanies", ms: "sahabat, teman yang menemani", source: "src-qurra-editorial" } },

  "fil-1": { id: "fil-1", form: "فِيل", pos: "ism", rootId: "fyl", derivationType: "jamid",
    gloss: { en: "elephant", ms: "gajah", source: "src-qurra-editorial" } },

  "kayfa-1": { id: "kayfa-1", form: "كَيْفَ", pos: "ism", rootId: null, derivationType: null,
    gloss: { en: "how", ms: "bagaimana", source: "src-qurra-editorial" } },

  "dhalika-1": { id: "dhalika-1", form: "ذَٰلِكَ", pos: "ism", rootId: null, derivationType: null,
    gloss: { en: "that", ms: "itu", source: "src-qurra-editorial" } }
};

/* ---------------------------------------------------------------------- */
/* 3. TOKENS — segments inline (proclitics/enclitics never carry a        */
/*    lemmaId; only a stem segment does — see DATA_SCHEMA.md).            */
/* ---------------------------------------------------------------------- */

const QM_TOKENS = {
  /* ---- Surah 1 · Al-Fatihah ---- */
  "1:1:1": { id: "1:1:1", surahId: 1, ayahId: 1, position: 1, surfaceForm: "بِسْمِ", pos: "ism",
    segments: [ { type: "proclitic", surface: "بِ", function: "jarr", gloss: "with/by" }, { type: "stem", surface: "سْمِ", lemmaId: "ism-1" } ],
    morphology: { number: "mufrad", gender: "mudhakkar", definiteness: { state: "maʿrifa", cause: "idafa" }, referenceClass: null },
    provenance: { text: "src-quran-text", morphology: "src-morphology" } },

  "1:1:2": { id: "1:1:2", surahId: 1, ayahId: 1, position: 2, surfaceForm: "اللَّهِ", pos: "ism",
    segments: [ { type: "stem", surface: "اللَّهِ", lemmaId: "allah-1" } ],
    morphology: { number: "mufrad", gender: "mudhakkar", definiteness: { state: "maʿrifa", cause: "alam" }, referenceClass: "alam" },
    provenance: { text: "src-quran-text", morphology: "src-morphology" } },

  "1:1:3": { id: "1:1:3", surahId: 1, ayahId: 1, position: 3, surfaceForm: "الرَّحْمَٰنِ", pos: "ism",
    segments: [ { type: "proclitic", surface: "ال", function: "definite_article" }, { type: "stem", surface: "رَّحْمَٰنِ", lemmaId: "rahman-1" } ],
    morphology: { number: "mufrad", gender: "mudhakkar", definiteness: { state: "maʿrifa", cause: "bi_al" }, referenceClass: null },
    provenance: { text: "src-quran-text", morphology: "src-morphology" } },

  "1:1:4": { id: "1:1:4", surahId: 1, ayahId: 1, position: 4, surfaceForm: "الرَّحِيمِ", pos: "ism",
    segments: [ { type: "proclitic", surface: "ال", function: "definite_article" }, { type: "stem", surface: "رَّحِيمِ", lemmaId: "raheem-1" } ],
    morphology: { number: "mufrad", gender: "mudhakkar", definiteness: { state: "maʿrifa", cause: "bi_al" }, referenceClass: null },
    provenance: { text: "src-quran-text", morphology: "src-morphology" } },

  "1:2:1": { id: "1:2:1", surahId: 1, ayahId: 2, position: 1, surfaceForm: "الْحَمْدُ", pos: "ism",
    segments: [ { type: "proclitic", surface: "الْ", function: "definite_article" }, { type: "stem", surface: "حَمْدُ", lemmaId: "hamd-1" } ],
    morphology: { number: "mufrad", gender: "mudhakkar", definiteness: { state: "maʿrifa", cause: "bi_al" }, referenceClass: null },
    provenance: { text: "src-quran-text", morphology: "src-morphology" } },

  "1:2:2": { id: "1:2:2", surahId: 1, ayahId: 2, position: 2, surfaceForm: "لِلَّهِ", pos: "ism",
    segments: [ { type: "proclitic", surface: "لِ", function: "jarr", gloss: "for/to" }, { type: "stem", surface: "اللَّهِ", lemmaId: "allah-1" } ],
    morphology: { number: "mufrad", gender: "mudhakkar", definiteness: { state: "maʿrifa", cause: "alam" }, referenceClass: "alam" },
    segmentationNote: {
      en: "Arabic spelling merges لِ + اللَّه into one written form (لِلَّهِ) — the breakdown shown here is the underlying morphemic analysis, not a literal letter-by-letter split. See DATA_SCHEMA.md.",
      ms: "Ejaan Arab menggabungkan لِ + اللَّه menjadi satu bentuk tulisan (لِلَّهِ) — pecahan yang dipaparkan di sini ialah analisis morfem yang mendasari, bukan pemisahan huruf demi huruf secara literal. Rujuk DATA_SCHEMA.md."
    },
    provenance: { text: "src-quran-text", morphology: "src-morphology" } },

  "1:2:3": { id: "1:2:3", surahId: 1, ayahId: 2, position: 3, surfaceForm: "رَبِّ", pos: "ism",
    segments: [ { type: "stem", surface: "رَبِّ", lemmaId: "rabb-1" } ],
    morphology: { number: "mufrad", gender: "mudhakkar", definiteness: { state: "maʿrifa", cause: "idafa" }, referenceClass: null },
    provenance: { text: "src-quran-text", morphology: "src-morphology" } },

  "1:2:4": { id: "1:2:4", surahId: 1, ayahId: 2, position: 4, surfaceForm: "الْعَالَمِينَ", pos: "ism",
    segments: [ { type: "proclitic", surface: "الْ", function: "definite_article" }, { type: "stem", surface: "عَالَمِينَ", lemmaId: "alam-1" } ],
    morphology: { number: "jamʿ", pluralType: "jamʿ_mudhakkar_salim", gender: "mudhakkar", definiteness: { state: "maʿrifa", cause: "bi_al" }, referenceClass: null },
    provenance: { text: "src-quran-text", morphology: "src-morphology" } },

  "1:3:1": { id: "1:3:1", surahId: 1, ayahId: 3, position: 1, surfaceForm: "الرَّحْمَٰنِ", pos: "ism",
    segments: [ { type: "proclitic", surface: "ال", function: "definite_article" }, { type: "stem", surface: "رَّحْمَٰنِ", lemmaId: "rahman-1" } ],
    morphology: { number: "mufrad", gender: "mudhakkar", definiteness: { state: "maʿrifa", cause: "bi_al" }, referenceClass: null },
    provenance: { text: "src-quran-text", morphology: "src-morphology" } },

  "1:3:2": { id: "1:3:2", surahId: 1, ayahId: 3, position: 2, surfaceForm: "الرَّحِيمِ", pos: "ism",
    segments: [ { type: "proclitic", surface: "ال", function: "definite_article" }, { type: "stem", surface: "رَّحِيمِ", lemmaId: "raheem-1" } ],
    morphology: { number: "mufrad", gender: "mudhakkar", definiteness: { state: "maʿrifa", cause: "bi_al" }, referenceClass: null },
    provenance: { text: "src-quran-text", morphology: "src-morphology" } },

  "1:4:1": { id: "1:4:1", surahId: 1, ayahId: 4, position: 1, surfaceForm: "مَالِكِ", pos: "ism",
    segments: [ { type: "stem", surface: "مَالِكِ", lemmaId: "malik-1" } ],
    morphology: { number: "mufrad", gender: "mudhakkar", definiteness: { state: "maʿrifa", cause: "idafa" }, referenceClass: null },
    provenance: { text: "src-quran-text", morphology: "src-morphology" } },

  "1:4:2": { id: "1:4:2", surahId: 1, ayahId: 4, position: 2, surfaceForm: "يَوْمِ", pos: "ism",
    segments: [ { type: "stem", surface: "يَوْمِ", lemmaId: "yawm-1" } ],
    morphology: { number: "mufrad", gender: "mudhakkar", definiteness: { state: "maʿrifa", cause: "idafa" }, referenceClass: null },
    provenance: { text: "src-quran-text", morphology: "src-morphology" } },

  "1:4:3": { id: "1:4:3", surahId: 1, ayahId: 4, position: 3, surfaceForm: "الدِّينِ", pos: "ism",
    segments: [ { type: "proclitic", surface: "ال", function: "definite_article" }, { type: "stem", surface: "دِّينِ", lemmaId: "deen-1" } ],
    morphology: { number: "mufrad", gender: "mudhakkar", definiteness: { state: "maʿrifa", cause: "bi_al" }, referenceClass: null },
    provenance: { text: "src-quran-text", morphology: "src-morphology" } },

  "1:5:1": { id: "1:5:1", surahId: 1, ayahId: 5, position: 1, surfaceForm: "إِيَّاكَ", pos: "ism",
    segments: [ { type: "stem", surface: "إِيَّا", lemmaId: "iyyaa-1" }, { type: "enclitic", surface: "كَ", pronounFeatures: { person: 2, number: "mufrad", gender: "mudhakkar" } } ],
    morphology: { number: null, gender: null, definiteness: null, referenceClass: "pronoun", declension: "mabni" },
    provenance: { text: "src-quran-text", morphology: "src-morphology" } },

  "1:5:2": { id: "1:5:2", surahId: 1, ayahId: 5, position: 2, surfaceForm: "نَعْبُدُ", pos: "fiʿl",
    segments: [ { type: "stem", surface: "نَعْبُدُ", lemmaId: "abada-1" } ],
    morphology: { form: "mudariʿ", person: 1, number: "jamʿ", gender: null, voice: "active" },
    provenance: { text: "src-quran-text", morphology: "src-morphology" } },

  "1:5:3": { id: "1:5:3", surahId: 1, ayahId: 5, position: 3, surfaceForm: "وَإِيَّاكَ", pos: "ism",
    segments: [ { type: "proclitic", surface: "وَ", function: "atf", gloss: "and" }, { type: "stem", surface: "إِيَّا", lemmaId: "iyyaa-1" }, { type: "enclitic", surface: "كَ", pronounFeatures: { person: 2, number: "mufrad", gender: "mudhakkar" } } ],
    morphology: { number: null, gender: null, definiteness: null, referenceClass: "pronoun", declension: "mabni" },
    provenance: { text: "src-quran-text", morphology: "src-morphology" } },

  "1:5:4": { id: "1:5:4", surahId: 1, ayahId: 5, position: 4, surfaceForm: "نَسْتَعِينُ", pos: "fiʿl",
    segments: [ { type: "stem", surface: "نَسْتَعِينُ", lemmaId: "istaana-1" } ],
    morphology: { form: "mudariʿ", person: 1, number: "jamʿ", gender: null, voice: "active" },
    provenance: { text: "src-quran-text", morphology: "src-morphology" } },

  "1:6:1": { id: "1:6:1", surahId: 1, ayahId: 6, position: 1, surfaceForm: "اهْدِنَا", pos: "fiʿl",
    segments: [ { type: "stem", surface: "اِهْدِ", lemmaId: "hada-1" }, { type: "enclitic", surface: "نَا", pronounFeatures: { person: 1, number: "jamʿ", gender: null } } ],
    morphology: { form: "amr", person: 2, number: "mufrad", gender: "mudhakkar", voice: "active" },
    provenance: { text: "src-quran-text", morphology: "src-morphology" } },

  "1:6:2": { id: "1:6:2", surahId: 1, ayahId: 6, position: 2, surfaceForm: "الصِّرَاطَ", pos: "ism",
    segments: [ { type: "proclitic", surface: "ال", function: "definite_article" }, { type: "stem", surface: "صِّرَاطَ", lemmaId: "sirat-1" } ],
    morphology: { number: "mufrad", gender: "mudhakkar", definiteness: { state: "maʿrifa", cause: "bi_al" }, referenceClass: null },
    provenance: { text: "src-quran-text", morphology: "src-morphology" } },

  "1:6:3": { id: "1:6:3", surahId: 1, ayahId: 6, position: 3, surfaceForm: "الْمُسْتَقِيمَ", pos: "ism",
    segments: [ { type: "proclitic", surface: "الْ", function: "definite_article" }, { type: "stem", surface: "مُسْتَقِيمَ", lemmaId: "mustaqim-1" } ],
    morphology: { number: "mufrad", gender: "mudhakkar", definiteness: { state: "maʿrifa", cause: "bi_al" }, referenceClass: null },
    provenance: { text: "src-quran-text", morphology: "src-morphology" } },

  "1:7:1": { id: "1:7:1", surahId: 1, ayahId: 7, position: 1, surfaceForm: "صِرَاطَ", pos: "ism",
    segments: [ { type: "stem", surface: "صِرَاطَ", lemmaId: "sirat-1" } ],
    morphology: { number: "mufrad", gender: "mudhakkar", definiteness: { state: "maʿrifa", cause: "idafa" }, referenceClass: null },
    provenance: { text: "src-quran-text", morphology: "src-morphology" } },

  "1:7:2": { id: "1:7:2", surahId: 1, ayahId: 7, position: 2, surfaceForm: "الَّذِينَ", pos: "ism",
    segments: [ { type: "stem", surface: "الَّذِينَ", lemmaId: "alladhina-1" } ],
    morphology: { number: "jamʿ", gender: "mudhakkar", definiteness: { state: "maʿrifa", cause: "mawsul" }, referenceClass: "mawsul", declension: "mabni" },
    provenance: { text: "src-quran-text", morphology: "src-morphology" } },

  "1:7:3": { id: "1:7:3", surahId: 1, ayahId: 7, position: 3, surfaceForm: "أَنْعَمْتَ", pos: "fiʿl",
    segments: [ { type: "stem", surface: "أَنْعَمْ", lemmaId: "anama-1" }, { type: "enclitic", surface: "تَ", pronounFeatures: { person: 2, number: "mufrad", gender: "mudhakkar" } } ],
    morphology: { form: "maadi", person: 2, number: "mufrad", gender: "mudhakkar", voice: "active" },
    provenance: { text: "src-quran-text", morphology: "src-morphology" } },

  "1:7:4": { id: "1:7:4", surahId: 1, ayahId: 7, position: 4, surfaceForm: "عَلَيْهِمْ", pos: "harf",
    segments: [ { type: "stem", surface: "عَلَيْ", lemmaId: "ala-1" }, { type: "enclitic", surface: "هِمْ", pronounFeatures: { person: 3, number: "jamʿ", gender: "mudhakkar" } } ],
    morphology: { functionHere: "jarr" },
    provenance: { text: "src-quran-text", morphology: "src-morphology" } },

  "1:7:5": { id: "1:7:5", surahId: 1, ayahId: 7, position: 5, surfaceForm: "غَيْرِ", pos: "ism",
    segments: [ { type: "stem", surface: "غَيْرِ", lemmaId: "ghayr-1" } ],
    morphology: { number: "mufrad", gender: "mudhakkar", definiteness: { state: "maʿrifa", cause: "idafa" }, referenceClass: null },
    provenance: { text: "src-quran-text", morphology: "src-morphology" } },

  "1:7:6": { id: "1:7:6", surahId: 1, ayahId: 7, position: 6, surfaceForm: "عَلَيْهِمْ", pos: "harf",
    segments: [ { type: "stem", surface: "عَلَيْ", lemmaId: "ala-1" }, { type: "enclitic", surface: "هِمْ", pronounFeatures: { person: 3, number: "jamʿ", gender: "mudhakkar" } } ],
    morphology: { functionHere: "jarr" },
    provenance: { text: "src-quran-text", morphology: "src-morphology" } },

  "1:7:7": { id: "1:7:7", surahId: 1, ayahId: 7, position: 7, surfaceForm: "الْمَغْضُوبِ", pos: "ism",
    segments: [ { type: "proclitic", surface: "الْ", function: "definite_article" }, { type: "stem", surface: "مَغْضُوبِ", lemmaId: "maghdub-1" } ],
    morphology: { number: "mufrad", gender: "mudhakkar", definiteness: { state: "maʿrifa", cause: "bi_al" }, referenceClass: null },
    provenance: { text: "src-quran-text", morphology: "src-morphology" } },

  "1:7:8": { id: "1:7:8", surahId: 1, ayahId: 7, position: 8, surfaceForm: "وَلَا", pos: "harf",
    segments: [ { type: "proclitic", surface: "وَ", function: "atf", gloss: "and" }, { type: "stem", surface: "لَا", lemmaId: "la-1" } ],
    morphology: { functionHere: "nafy_simple" },
    provenance: { text: "src-quran-text", morphology: "src-morphology" } },

  "1:7:9": { id: "1:7:9", surahId: 1, ayahId: 7, position: 9, surfaceForm: "الضَّالِّينَ", pos: "ism",
    segments: [ { type: "proclitic", surface: "ال", function: "definite_article" }, { type: "stem", surface: "ضَّالِّينَ", lemmaId: "dall-1" } ],
    morphology: { number: "jamʿ", pluralType: "jamʿ_mudhakkar_salim", gender: "mudhakkar", definiteness: { state: "maʿrifa", cause: "bi_al" }, referenceClass: null },
    provenance: { text: "src-quran-text", morphology: "src-morphology" } },

  /* ---- Surah 2 · Al-Baqarah, ayah 2 ---- */
  "2:2:1": { id: "2:2:1", surahId: 2, ayahId: 2, position: 1, surfaceForm: "ذَٰلِكَ", pos: "ism",
    segments: [ { type: "stem", surface: "ذَٰلِكَ", lemmaId: "dhalika-1" } ],
    morphology: { number: "mufrad", gender: "mudhakkar", definiteness: { state: "maʿrifa", cause: "ishara" }, referenceClass: "ishara", declension: "mabni" },
    provenance: { text: "src-quran-text", morphology: "src-morphology" } },

  "2:2:2": { id: "2:2:2", surahId: 2, ayahId: 2, position: 2, surfaceForm: "الْكِتَابُ", pos: "ism",
    segments: [ { type: "proclitic", surface: "الْ", function: "definite_article" }, { type: "stem", surface: "كِتَابُ", lemmaId: "kitab-1" } ],
    morphology: { number: "mufrad", gender: "mudhakkar", definiteness: { state: "maʿrifa", cause: "bi_al" }, referenceClass: null },
    provenance: { text: "src-quran-text", morphology: "src-morphology" } },

  "2:2:3": { id: "2:2:3", surahId: 2, ayahId: 2, position: 3, surfaceForm: "لَا", pos: "harf",
    segments: [ { type: "stem", surface: "لَا", lemmaId: "la-1" } ],
    morphology: { functionHere: "nafy_al_jins" },
    provenance: { text: "src-quran-text", morphology: "src-morphology" } },

  "2:2:4": { id: "2:2:4", surahId: 2, ayahId: 2, position: 4, surfaceForm: "رَيْبَ", pos: "ism",
    segments: [ { type: "stem", surface: "رَيْبَ", lemmaId: "rayb-1" } ],
    morphology: { number: "mufrad", gender: "mudhakkar", definiteness: { state: "nakira" }, referenceClass: null },
    provenance: { text: "src-quran-text", morphology: "src-morphology" } },

  "2:2:5": { id: "2:2:5", surahId: 2, ayahId: 2, position: 5, surfaceForm: "فِيهِ", pos: "harf",
    segments: [ { type: "stem", surface: "فِي", lemmaId: "fi-1" }, { type: "enclitic", surface: "هِ", pronounFeatures: { person: 3, number: "mufrad", gender: "mudhakkar" } } ],
    morphology: { functionHere: "jarr" },
    provenance: { text: "src-quran-text", morphology: "src-morphology" } },

  "2:2:6": { id: "2:2:6", surahId: 2, ayahId: 2, position: 6, surfaceForm: "هُدًى", pos: "ism",
    segments: [ { type: "stem", surface: "هُدًى", lemmaId: "huda-1" } ],
    morphology: { number: "mufrad", gender: "mudhakkar", definiteness: { state: "nakira" }, referenceClass: null },
    provenance: { text: "src-quran-text", morphology: "src-morphology" } },

  "2:2:7": { id: "2:2:7", surahId: 2, ayahId: 2, position: 7, surfaceForm: "لِّلْمُتَّقِينَ", pos: "ism",
    segments: [ { type: "proclitic", surface: "لِ", function: "jarr", gloss: "for" }, { type: "proclitic", surface: "ال", function: "definite_article" }, { type: "stem", surface: "مُتَّقِينَ", lemmaId: "muttaqin-1" } ],
    morphology: { number: "jamʿ", pluralType: "jamʿ_mudhakkar_salim", gender: "mudhakkar", definiteness: { state: "maʿrifa", cause: "bi_al" }, referenceClass: null, grammaticalCase: null },
    segmentationNote: {
      en: "Arabic spelling merges لِ + ال into one doubled-lam form (لِّ) — the breakdown shown here is the underlying morphemic analysis, not a literal letter-by-letter split. See DATA_SCHEMA.md.",
      ms: "Ejaan Arab menggabungkan لِ + ال menjadi satu bentuk lam bergeganda (لِّ) — pecahan yang dipaparkan di sini ialah analisis morfem yang mendasari, bukan pemisahan huruf demi huruf secara literal. Rujuk DATA_SCHEMA.md."
    },
    provenance: { text: "src-quran-text", morphology: "src-morphology" } },

  /* ---- Surah 105 · Al-Fil, ayah 1 ---- */
  "105:1:1": { id: "105:1:1", surahId: 105, ayahId: 1, position: 1, surfaceForm: "أَلَمْ", pos: "harf",
    segments: [ { type: "proclitic", surface: "أَ", function: "istifham", gloss: "(interrogative prefix)" }, { type: "stem", surface: "لَمْ", lemmaId: "lam-1" } ],
    morphology: { functionHere: "jazm_nafy" },
    provenance: { text: "src-quran-text", morphology: "src-morphology" } },

  "105:1:2": { id: "105:1:2", surahId: 105, ayahId: 1, position: 2, surfaceForm: "تَرَ", pos: "fiʿl",
    segments: [ { type: "stem", surface: "تَرَ", lemmaId: "raa-1" } ],
    morphology: { form: "mudariʿ", person: 2, number: "mufrad", gender: "mudhakkar", voice: "active" },
    provenance: { text: "src-quran-text", morphology: "src-morphology" } },

  "105:1:3": { id: "105:1:3", surahId: 105, ayahId: 1, position: 3, surfaceForm: "كَيْفَ", pos: "ism",
    segments: [ { type: "stem", surface: "كَيْفَ", lemmaId: "kayfa-1" } ],
    morphology: { number: null, gender: null, definiteness: null, referenceClass: "istifham", declension: "mabni" },
    provenance: { text: "src-quran-text", morphology: "src-morphology" } },

  "105:1:4": { id: "105:1:4", surahId: 105, ayahId: 1, position: 4, surfaceForm: "فَعَلَ", pos: "fiʿl",
    segments: [ { type: "stem", surface: "فَعَلَ", lemmaId: "faala-1" } ],
    morphology: { form: "maadi", person: 3, number: "mufrad", gender: "mudhakkar", voice: "active" },
    provenance: { text: "src-quran-text", morphology: "src-morphology" } },

  "105:1:5": { id: "105:1:5", surahId: 105, ayahId: 1, position: 5, surfaceForm: "رَبُّكَ", pos: "ism",
    segments: [ { type: "stem", surface: "رَبُّ", lemmaId: "rabb-1" }, { type: "enclitic", surface: "كَ", pronounFeatures: { person: 2, number: "mufrad", gender: "mudhakkar" } } ],
    morphology: { number: "mufrad", gender: "mudhakkar", definiteness: { state: "maʿrifa", cause: "idafa" }, referenceClass: null },
    provenance: { text: "src-quran-text", morphology: "src-morphology" } },

  "105:1:6": { id: "105:1:6", surahId: 105, ayahId: 1, position: 6, surfaceForm: "بِأَصْحَابِ", pos: "ism",
    segments: [ { type: "proclitic", surface: "بِ", function: "jarr", gloss: "with/against" }, { type: "stem", surface: "أَصْحَابِ", lemmaId: "sahib-1" } ],
    morphology: { number: "jamʿ", pluralType: "jamʿ_taksir", gender: "mudhakkar", definiteness: { state: "maʿrifa", cause: "idafa" }, referenceClass: null },
    provenance: { text: "src-quran-text", morphology: "src-morphology" } },

  "105:1:7": { id: "105:1:7", surahId: 105, ayahId: 1, position: 7, surfaceForm: "الْفِيلِ", pos: "ism",
    segments: [ { type: "proclitic", surface: "الْ", function: "definite_article" }, { type: "stem", surface: "فِيلِ", lemmaId: "fil-1" } ],
    morphology: { number: "mufrad", gender: "mudhakkar", definiteness: { state: "maʿrifa", cause: "idafa" }, referenceClass: null },
    provenance: { text: "src-quran-text", morphology: "src-morphology" } }
};

/* ---------------------------------------------------------------------- */
/* 4. AYAHS — ordered token id lists + a working (non-authoritative)      */
/*    bilingual rendering, written for this prototype, not quoted from    */
/*    any specific published translation (see blueprint §10 on            */
/*    translation licensing).                                             */
/* ---------------------------------------------------------------------- */

const QM_AYAHS = {
  "1:1": { surahId: 1, ayahId: 1, tokenIds: ["1:1:1","1:1:2","1:1:3","1:1:4"],
    translation: { en: "In the name of Allah, the Most Gracious, the Most Merciful.", ms: "Dengan nama Allah, Yang Maha Pemurah, Yang Maha Penyayang." } },
  "1:2": { surahId: 1, ayahId: 2, tokenIds: ["1:2:1","1:2:2","1:2:3","1:2:4"],
    translation: { en: "All praise belongs to Allah, Lord of all the worlds.", ms: "Segala puji bagi Allah, Tuhan sekalian alam." } },
  "1:3": { surahId: 1, ayahId: 3, tokenIds: ["1:3:1","1:3:2"],
    translation: { en: "The Most Gracious, the Most Merciful.", ms: "Yang Maha Pemurah, Yang Maha Penyayang." } },
  "1:4": { surahId: 1, ayahId: 4, tokenIds: ["1:4:1","1:4:2","1:4:3"],
    translation: { en: "Master of the Day of Judgment.", ms: "Yang Menguasai hari Pembalasan." } },
  "1:5": { surahId: 1, ayahId: 5, tokenIds: ["1:5:1","1:5:2","1:5:3","1:5:4"],
    translation: { en: "You alone we worship, and You alone we ask for help.", ms: "Hanya Engkaulah yang kami sembah, dan hanya kepada Engkaulah kami memohon pertolongan." } },
  "1:6": { surahId: 1, ayahId: 6, tokenIds: ["1:6:1","1:6:2","1:6:3"],
    translation: { en: "Guide us to the straight path.", ms: "Tunjukilah kami jalan yang lurus." } },
  "1:7": { surahId: 1, ayahId: 7, tokenIds: ["1:7:1","1:7:2","1:7:3","1:7:4","1:7:5","1:7:6","1:7:7","1:7:8","1:7:9"],
    translation: { en: "The path of those You have blessed — not of those who have earned anger, nor of those who have gone astray.", ms: "Iaitu jalan orang-orang yang telah Engkau kurniakan nikmat ke atas mereka — bukan jalan orang-orang yang dimurkai, dan bukan pula jalan orang-orang yang sesat." } },
  "2:2": { surahId: 2, ayahId: 2, tokenIds: ["2:2:1","2:2:2","2:2:3","2:2:4","2:2:5","2:2:6","2:2:7"],
    translation: { en: "This is the Book; there is no doubt in it — a guidance for the God-conscious.", ms: "Inilah Kitab yang tidak ada keraguan padanya; menjadi petunjuk bagi orang-orang yang bertakwa." } },
  "105:1": { surahId: 105, ayahId: 1, tokenIds: ["105:1:1","105:1:2","105:1:3","105:1:4","105:1:5","105:1:6","105:1:7"],
    translation: { en: "Have you not seen how your Lord dealt with the companions of the elephant?", ms: "Tidakkah engkau perhatikan bagaimana Tuhanmu bertindak terhadap angkatan tentera bergajah?" } }
};

/* ---------------------------------------------------------------------- */
/* 5. SURAHS — nameAr/nameEn are proper nouns and stay as-is in both UI   */
/*    languages (DATA_SCHEMA.md §12); revelation ("Meccan"/"Medinan") is  */
/*    a code translated at render time via enum.revelation.*.             */
/* ---------------------------------------------------------------------- */

const QM_SURAHS = {
  1:   { number: 1,   nameAr: "الفاتحة", nameEn: "Al-Fatihah", ayahCount: 7,   revelation: "Meccan",  demoAyahs: [1,2,3,4,5,6,7] },
  2:   { number: 2,   nameAr: "البقرة",  nameEn: "Al-Baqarah", ayahCount: 286, revelation: "Medinan", demoAyahs: [2] },
  105: { number: 105, nameAr: "الفيل",   nameEn: "Al-Fil",     ayahCount: 5,   revelation: "Meccan",  demoAyahs: [1] }
};

/* ---------------------------------------------------------------------- */
/* 6. JUZ — only Juz 1 and Juz 30 are "available" (carry real surah/ayah  */
/*    demo data); the rest exist only as inactive cards on Home/Juz pages */
/*    so the grid of 30 never looks broken.                                */
/* ---------------------------------------------------------------------- */

const QM_JUZ_ORDINALS_AR = [
  "الأول","الثاني","الثالث","الرابع","الخامس","السادس","السابع","الثامن","التاسع","العاشر",
  "الحادي عشر","الثاني عشر","الثالث عشر","الرابع عشر","الخامس عشر","السادس عشر","السابع عشر","الثامن عشر","التاسع عشر","العشرون",
  "الحادي والعشرون","الثاني والعشرون","الثالث والعشرون","الرابع والعشرون","الخامس والعشرون","السادس والعشرون","السابع والعشرون","الثامن والعشرون","التاسع والعشرون","الثلاثون"
];

const QM_JUZ_NOTE_JUZ1 = {
  en: "Covers Surah Al-Fatihah in full, and the opening of Al-Baqarah (ayahs 1–141 in the full Mushaf). This demo includes complete word data for Al-Fatihah and for Al-Baqarah ayah 2.",
  ms: "Merangkumi Surah al-Fatihah secara lengkap, dan permulaan Surah al-Baqarah (ayat 1–141 dalam Mushaf penuh). Demo ini merangkumi data perkataan yang lengkap bagi al-Fatihah dan bagi al-Baqarah ayat 2."
};
const QM_JUZ_NOTE_JUZ30 = {
  en: "Covers Surahs 78–114 in the full Mushaf (Juz ‘Amma). This demo includes Surah Al-Fil, ayah 1 — chosen specifically to demonstrate a broken plural and additional segmentation patterns not seen in Juz 1.",
  ms: "Merangkumi Surah 78–114 dalam Mushaf penuh (Juzuk 'Amma). Demo ini merangkumi Surah al-Fil, ayat 1 — dipilih khas untuk menunjukkan jamak taksir dan corak pecahan perkataan tambahan yang tiada dalam Juzuk 1."
};
const QM_JUZ_NOTE_UNAVAILABLE = {
  en: "Not yet available in this prototype. Full coverage is a later stage — see ROADMAP.md.",
  ms: "Belum tersedia dalam prototaip ini. Liputan penuh adalah peringkat akan datang — rujuk ROADMAP.md."
};

const QM_JUZ = {};
for (let n = 1; n <= 30; n++) {
  QM_JUZ[n] = {
    number: n,
    nameAr: "الجزء " + QM_JUZ_ORDINALS_AR[n - 1],
    available: (n === 1 || n === 30),
    surahIds: n === 1 ? [1, 2] : (n === 30 ? [105] : []),
    note: n === 1 ? QM_JUZ_NOTE_JUZ1 : (n === 30 ? QM_JUZ_NOTE_JUZ30 : QM_JUZ_NOTE_UNAVAILABLE)
  };
}
