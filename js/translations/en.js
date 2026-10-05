/* ==========================================================================
   QURRA Mufradat al-Qur'an — UI strings (English)

   Every learner-facing UI string lives here (and in translations/ms.js),
   keyed the same way in both files. Arabic linguistic terminology (اسم،
   فعل، حرف، جمع تكسير...) is NOT translated and does not live here — see
   the ARABIC_TERMS constant in js/wordDetail.js and the inline Arabic in
   js/render.js, which are shared, language-independent display data.
   ========================================================================== */

const QM_I18N_EN = {
  common: {
    skipToMain: "Skip to main content",
    search: "Search",
    searchPlaceholder: "Search word, lemma, or root…",
    searchVocabularyLabel: "Search vocabulary",
    close: "Close",
    back: "Back",
    noMatchesTemplate: 'No matches in the demo dataset for "{query}".',
    languageLabel: "Language",
    languageEn: "English",
    languageMs: "Bahasa Melayu"
  },

  badge: {
    demo: "Prototype · Demo data"
  },

  nav: {
    home: "Home",
    juz: "Juz",
    surahs: "Surahs",
    roots: "Roots",
    lemmas: "Lemmas"
  },

  detailOverlay: {
    closeAriaLabel: "Close word details"
  },

  home: {
    tagline: "Explore the words of the Qur'an, one Juz at a time.",
    description: "QURRA Mufradat is a vocabulary-and-morphology reference for the Qur'an — every word broken down into its root, lemma, and grammatical form, without flashcards, quizzes, or a full-text search engine to get in the way.",
    ctaExplore: "Explore the Qur'an",
    ctaBrowse: "Browse Vocabulary",
    demoNoteTemplate: 'This is an early architecture &amp; UI prototype. Only <strong>{available} of {total}</strong> Juz (Juz 1 and Juz 30) carry real demo word data right now — the rest are shown so the full structure is visible, and are clearly marked "Not yet available."',
    browseByJuz: "Browse by Juz"
  },

  juzCard: {
    demo: "Demo data",
    notAvailable: "Not yet available"
  },

  juz: {
    eyebrow: "JUZ",
    titleTemplate: "Juz {n}",
    notAvailableTitle: "Not yet available in this prototype",
    notAvailableBody: "This Juz doesn't carry demo word data yet. Full Qur'an coverage is a later development stage — see ROADMAP.md in the project files.",
    viewJuz1: "View Juz 1 demo",
    viewJuz30: "View Juz 30 demo",
    surahsInJuz: "Surahs in this Juz (demo)"
  },

  surahs: {
    eyebrow: "VOCABULARY",
    title: "Surahs",
    demoNoteTemplate: "This prototype includes a small, representative set of surahs ({list}) rather than the complete Qur'an."
  },

  surahCard: {
    demoAyahsTemplate: "{demo} of {total} ayahs in demo"
  },

  surah: {
    metaTemplate: "{revelation} · {ayahCount} ayahs in the full Mushaf — {demoCount} included in this demo",
    demoNoteTemplate: "Only the following ayah(s) of this surah are included in this prototype: {list}.",
    showTranslation: "Show translation (English, paraphrase)"
  },

  roots: {
    eyebrow: "VOCABULARY",
    title: "Roots",
    demoNoteTemplate: "{count} roots are included in this demo dataset — enough to show a root with multiple lemmas (و ق ي, ر ح م, هـ د ي), not a complete root index."
  },

  root: {
    eyebrow: "ROOT",
    relatedLemmas: "Related lemmas",
    occurrencesTitle: "Qur'anic occurrences (demo)",
    noOccurrences: "None of this root's lemmas occur in the demo dataset yet.",
    noLemmas: "No lemmas recorded for this root in the demo dataset.",
    coreFieldSourceTemplate: "Core field source: {name} — {status}"
  },

  lemmas: {
    eyebrow: "VOCABULARY",
    title: "Lemmas",
    demoNoteTemplate: "{count} dictionary-form lemmas are included in this demo dataset."
  },

  lemma: {
    eyebrow: "LEMMA",
    fieldPos: "Part of speech",
    fieldDerivation: "Derivation",
    fieldVerbForm: "Verb form",
    fieldRoot: "Root",
    noRoot: "None recorded (common for particles and frozen forms)",
    occurrencesTitle: "Occurrences (Juz / Surah / Ayah)",
    noOccurrences: "This lemma has no token occurrences in the current demo dataset — included to show how the lemma/root structure stays honest about coverage gaps rather than inventing an example."
  },

  notfound: {
    eyebrow: "Not found",
    title: "Page not found",
    bodyTitleTemplate: "This {kind} isn't in the demo dataset",
    body: "This prototype covers a small, clearly-labelled demo dataset rather than the full Qur'an. Try Surah Al-Fatihah, Al-Baqarah ayah 2, or Surah Al-Fil ayah 1.",
    backHome: "Back to Home",
    kind: { word: "word", page: "page", juz: "Juz", surah: "Surah", root: "root", lemma: "lemma" }
  },

  filters: {
    all: "All",
    noun: "Noun",
    verb: "Verb",
    particle: "Particle"
  },

  detail: {
    morphDetails: "Morphological details",
    breakdown: "Breakdown",
    lemmaRoot: "Lemma &amp; root",
    sourceInfo: "Source information",
    singleUnit: "This word is a single morphological unit — no attached prefixes or suffixes.",
    conjugationWithheld: "Basic conjugation withheld — not yet scholar-verified (see the blueprint §8 display rule).",
    noRootRecorded: "This word has no recorded root — common for particles and a few frozen forms (see DATA_SCHEMA.md).",
    viewLemma: "View lemma",
    viewRoot: "View root",
    viewInQuran: "View in Qur'an",
    locationTemplate: "Qur'an {surah}:{ayah}, word {position}",
    wordNotFoundTitle: "Word not found",
    wordNotFoundBody: "This token isn't in the demo dataset.",
    pronounTemplate: "{person} pronoun"
  },

  fields: {
    number: "Number",
    gender: "Gender"
  },

  noun: {
    pluralType: "Plural type",
    definiteness: "Definiteness",
    referenceClass: "Reference class",
    declension: "Declension"
  },

  verb: {
    form: "Form",
    person: "Person",
    voice: "Voice"
  },

  particle: {
    function: "Function in this verse"
  },

  person: {
    1: "1st person",
    2: "2nd person",
    3: "3rd person"
  },

  search: {
    posNoun: "noun",
    posVerb: "verb",
    posParticle: "particle",
    lemmaPrefix: "lemma",
    rootLabel: "root"
  },

  enum: {
    number: { mufrad: "Singular", muthanna: "Dual", "jamʿ": "Plural" },
    pluralType: {
      jamʿ_mudhakkar_salim: "Sound masculine plural",
      jamʿ_muannath_salim: "Sound feminine plural",
      jamʿ_taksir: "Broken plural"
    },
    gender: { mudhakkar: "Masculine", muannath: "Feminine" },
    definitenessState: { "maʿrifa": "Definite", nakira: "Indefinite" },
    definitenessCause: {
      bi_al: "the definite article (ال)",
      idafa: "a construct/possessive structure (إضافة)",
      alam: "being a proper noun",
      ishara: "being a demonstrative",
      mawsul: "being a relative pronoun"
    },
    referenceClass: {
      alam: "Proper noun", ishara: "Demonstrative", mawsul: "Relative pronoun",
      istifham: "Interrogative", pronoun: "Pronoun"
    },
    derivationType: {
      jamid: "Primitive noun (not derived from a verb)",
      masdar: "Verbal noun",
      ism_faʿil: "Active participle",
      ism_mafʿul: "Passive participle",
      sifa_mushabbaha: "Assimilate adjective"
    },
    declension: { mabni: "Indeclinable", "muʿrab": "Declinable" },
    form: { maadi: "Perfective", "mudariʿ": "Imperfective", amr: "Imperative" },
    voice: { active: "Active", passive: "Passive" },
    functionHere: {
      jarr: "Preposition",
      atf: 'Conjunction ("and")',
      nafy_al_jins: "Categorical negation",
      nafy_simple: "Simple negation",
      nahy: "Prohibition",
      "duʿa": "Supplication marker",
      jazm_nafy: "Negates + jussive marker",
      istifham: "Interrogative prefix"
    },
    segmentFunction: {
      jarr: "preposition", atf: 'conjunction ("and")', definite_article: "definite article",
      istifham: "interrogative prefix"
    },
    rootType: {
      sahih_salim: "Sound root", ajwaf: "Hollow (weak middle letter)",
      naqis: "Defective (weak final letter)", mudaaf: "Doubled",
      lafif_mafruq: "Doubly-weak, separated", lafif_maqrun: "Doubly-weak, adjacent"
    },
    pos: { ism: "Noun", "fiʿl": "Verb", harf: "Particle" },
    revelation: { Meccan: "Meccan", Medinan: "Medinan" }
  },

  conjugation: {
    perfective: "Perfective",
    imperfective: "Imperfective",
    imperative: "Imperative"
  },

  source: {
    "src-quran-text": {
      name: "Qur'anic text source",
      status: "PLACEHOLDER. The blueprint (§10) recommends Tanzil.net's verified Uthmani text as the real V1 source. This demo's Arabic text was carefully hand-checked for a handful of extremely well-known verses, but has not been run through the real two-source verification check (blueprint §11) and must not be treated as production-ready."
    },
    "src-morphology": {
      name: "Morphology analysis",
      status: "PLACEHOLDER. Real candidates and their licensing trade-offs are discussed in blueprint §10 (Quranic Arabic Corpus, MASAQ). The segmentation and morphological tags in this demo were written by hand for illustration only, not drawn from either corpus."
    },
    "src-qurra-editorial": {
      name: "QURRA editorial gloss / demo classification",
      status: "Demo/sample content written for this prototype. Not reviewed by a qualified Arabic-grammar scholar (blueprint §11 Stage 5)."
    },
    "src-verified-conjugation": {
      name: "Verified conjugation",
      status: "Demo/sample conjugations shown for UI-demonstration purposes. Marked 'stored_verified' only so the prototype can show what a verified citation triplet looks like once it exists — these specific forms have not actually been through scholarly review."
    },
    "src-raghib-mufradat": {
      name: "al-Raghib al-Isfahani — Mufradat al-Qur'an (classical reference)",
      status: "PLACEHOLDER, not consulted for this demo. Discussed in blueprint §2 as a future (Later-stage, not V1) source for deeper lexical notes, properly page-cited from the actual edition. No page numbers are asserted anywhere in this prototype."
    }
  }
};
