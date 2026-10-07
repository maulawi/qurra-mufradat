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
    noMatchesTemplate: 'No matches for "{query}".',
    languageLabel: "Language",
    languageEn: "English",
    languageMs: "Bahasa Melayu"
  },

  badge: {
    demo: "Prototype · Word analysis: pilot"
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
    description: "QURRA Mufradat is a vocabulary explorer for the Qur'an: the complete Qur'anic text, word by word, Juz by Juz. Word analysis (root, lemma, grammatical form) is so far available only for a limited pilot sample and is provisional.",
    ctaExplore: "Explore the Qur'an",
    ctaBrowse: "Browse Vocabulary",
    demoNoteTemplate: 'The complete Qur\'anic text (114 surahs, 6,236 ayahs) is included. Word-by-word analysis (lemma, root, morphology) exists so far only for a small pilot sample of <strong>{analysed} ayahs</strong> and is provisional; every other word shows its text only, marked "not yet analysed".',
    browseByJuz: "Browse by Juz"
  },

  juzCard: {
    analysed: "Word analysis (pilot)",
    textOnly: "Text only"
  },

  juz: {
    eyebrow: "JUZ",
    titleTemplate: "Juz {n}",
    notAvailableTitle: "Not yet available in this prototype",
    notAvailableBody: "This Juz doesn't carry demo word data yet. Full Qur'an coverage is a later development stage — see ROADMAP.md in the project files.",
    viewJuz1: "View Juz 1 demo",
    viewJuz30: "View Juz 30 demo",
    surahsInJuz: "Surahs in this Juz",
    startsAtTemplate: "Begins at {surah} {ayah}",
    unavailableNote: "Not yet available in this prototype. Full coverage is a later stage — see ROADMAP.md."
  },

  surahs: {
    eyebrow: "VOCABULARY",
    title: "Surahs",
    noteTemplate: "All 114 surahs are included. Word-by-word analysis is available only for a pilot sample in: {list}."
  },

  surahCard: {
    ayahsTemplate: "{total} ayahs",
    ayahsAnalysedTemplate: "{total} ayahs · {analysed} with word analysis"
  },

  surah: {
    metaTemplate: "{revelation} · {ayahCount} ayahs",
    metaAnalysedTemplate: "{revelation} · {ayahCount} ayahs — {analysedCount} with word analysis (pilot)",
    demoNoteTemplate: "Word-by-word analysis is available only for ayah(s) {list} of this surah (pilot). Every other word shows the Qur'anic text only.",
    textOnlyNote: "No word-by-word analysis is available for this surah yet. Words show the Qur'anic text only.",
    showTranslation: "Show translation (English, paraphrase)",
    translationNote: "Working rendering written for the prototype — not an authoritative translation.",
    ayahMissingTitle: "Ayah {ayah} doesn't exist in this surah",
    ayahMissingBody: "{surah} has {count} ayahs.",
    viewSurahTemplate: "View {surah}"
  },

  roots: {
    eyebrow: "VOCABULARY",
    title: "Roots",
    demoNoteTemplate: "{count} roots are included in this demo dataset — enough to show a root with multiple lemmas (و ق ي, ر ح م, هـ د ي), not a complete root index.",
    provisionalNote: "Every root shown here is a provisional placeholder from the Stage 1 demo: none has been assigned under QURRA's root verification process yet, and none is reviewed."
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
    fieldLearnerNote: "Learner note",
    occurrencesTitle: "Occurrences (Juz / Surah / Ayah)",
    noOccurrences: "This lemma has no token occurrences in the current demo dataset — included to show how the lemma/root structure stays honest about coverage gaps rather than inventing an example."
  },

  notfound: {
    eyebrow: "Not found",
    title: "Page not found",
    bodyTitleTemplate: "This {kind} doesn't exist",
    body: "Check the address, or start from the list of Juz or surahs.",
    backHome: "Back to Home",
    kind: { word: "word", page: "page", juz: "Juz", surah: "Surah", root: "root", lemma: "lemma" }
  },

  filters: {
    groupLabel: "Filter by part of speech",
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
    wordNotFoundBody: "This word doesn't exist.",
    pronounTemplate: "{person} pronoun",
    lemmaUnresolved: "No lemma has been identified for this word yet.",
    notAnalysedTitle: "Word analysis not available yet",
    notAnalysedBody: "This word has no lemma, root or morphology recorded yet. Nothing is guessed: the analysis will appear here once it comes from a reviewed, licensed source.",
    licenceLabel: "Licence status",
    inUseNote: "In use"
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
    rootLabel: "root",
    surahLabel: "surah",
    ayahLabel: "ayah"
  },

  enum: {
    number: { mufrad: "Singular", muthanna: "Dual", jama: "Plural" },
    pluralType: {
      jama_mudhakkar_salim: "Sound masculine plural",
      jama_muannath_salim: "Sound feminine plural",
      jama_taksir: "Broken plural"
    },
    gender: { mudhakkar: "Masculine", muannath: "Feminine" },
    definitenessState: { marifa: "Definite", nakira: "Indefinite" },
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
      ism_fail: "Active participle",
      ism_mafool: "Passive participle",
      sifa_mushabbaha: "Assimilate adjective"
    },
    declension: { mabni: "Indeclinable", murab: "Declinable" },
    form: { maadi: "Perfective", mudari: "Imperfective", amr: "Imperative" },
    voice: { active: "Active", passive: "Passive" },
    functionHere: {
      jarr: "Preposition",
      atf: 'Conjunction ("and")',
      nafy_al_jins: "Categorical negation",
      nafy_simple: "Simple negation",
      nahy: "Prohibition",
      dua: "Supplication marker",
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
    pos: { noun: "Noun", verb: "Verb", particle: "Particle" },
    revelation: { Meccan: "Meccan", Medinan: "Medinan" }
  },

  conjugation: {
    perfective: "Perfective",
    imperfective: "Imperfective",
    imperative: "Imperative"
  },

  licenceStatus: {
    verified: "Licence verified",
    conditional: "Conditional licence",
    unresolved: "Licence unresolved",
    internal: "QURRA-authored",
    provisional: "Provisional (QURRA-authored draft)"
  },

  source: {
    TANZIL_TEXT: {
      name: "Tanzil Qur'an text (Uthmani)",
      status: "Official Tanzil Quran text, Uthmani version 1.1, displayed unmodified. The licence terms and the exact source are recorded in the source registry; attribution to the Tanzil Project (tanzil.net) is shown in the page footer."
    },
    QURRA_EDITORIAL: {
      name: "QURRA editorial metadata",
      status: "Surah and Juz metadata prepared by QURRA for the prototype; not yet checked against a primary metadata source."
    },
    QURRA_DEMO_MORPHOLOGY: {
      name: "QURRA demo segmentation and morphology",
      status: "Written by hand for the Stage 1 demo. Not imported from any corpus and not reviewed by a qualified Arabic-grammar scholar."
    },
    QURRA_GLOSS: {
      name: "QURRA vocabulary glosses",
      status: "Short vocabulary glosses drafted by QURRA (not a translation of the Qur'an). Unreviewed drafts."
    },
    QURRA_DEMO_TRANSLATION: {
      name: "QURRA demo ayah renderings",
      status: "Working renderings written for the prototype. Not quoted from any published translation and not reviewed."
    },
    QURRA_DEMO_CONJUGATION: {
      name: "QURRA demo conjugation forms",
      status: "Citation forms entered by hand for the prototype. Not reviewed."
    },
    QURRA_DEMO_ROOTS: {
      name: "QURRA demo root placeholders",
      status: "Root letters entered by hand in the Stage 1 demo. They have not been assigned under QURRA's root verification process and carry no recorded evidence, so they are shown only as provisional placeholders."
    },
    QURRA_ROOT_PROTOCOL: {
      name: "QURRA root verification protocol",
      status: "Pending expert review. No root shown in the app has been assigned under it yet."
    }
  },

  rootState: {
    provisionalBadge: "Provisional",
    provisionalNote: "Provisional placeholder root: not yet assigned under QURRA's root verification process and not reviewed.",
    underReview: "Root under review",
    notApplicable: "No root is assigned for this kind of word."
  },

  status: {
    attribution: "Qur'anic text: Tanzil Project (tanzil.net), Creative Commons Attribution 3.0.",
    conjugationProvisional: "Provisional — not yet reviewed."
  }
};
