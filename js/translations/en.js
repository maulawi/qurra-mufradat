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
    demo: "Beta version"
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
    tagline: "Explore the Qur’an, word by word.",
    sectionsLabel: "Explore QURRA Mufradat",
    cardJuz: "Browse by Juz",
    cardSurahs: "All 114 Surahs",
    cardRoots: "Explore roots",
    cardLemmas: "Dictionary forms",
    betaTitle: "Beta version",
    betaBody: "Verification in progress."
  },

  juzCard: {
    analysed: "Word analysis",
    textOnly: "Text only"
  },

  juz: {
    ayahRangeTemplate: "ayahs {range}",
    wholeSurahTemplate: "whole surah · {count} ayahs",
    partOfSurahTemplate: "{count} of {total} ayahs",
    totalAyahsTemplate: "{count} ayahs in this Juz",
    surahInJuzTemplate: "Juz {juz}: ayahs {from}–{to} of {total}",
    eyebrow: "JUZ",
    indexTitle: "Juz 1–30",
    indexIntro: "Choose a Juz to see its surahs.",
    allJuz: "All Juz",
    prevJuz: "← Juz {n}",
    nextJuz: "Juz {n} →",
    titleTemplate: "Juz {n}",
    notAvailableTitle: "Not available yet",
    notAvailableBody: "This Juz has no word data yet.",
    viewJuz1: "View Juz 1",
    viewJuz30: "View Juz 30",
    surahsInJuz: "Surahs in this Juz",
    startsAtTemplate: "Begins at {surah} {ayah}"
  },

  surahs: {
    eyebrow: "VOCABULARY",
    title: "Surahs"
  },

  surahCard: {
    ayahsTemplate: "{total} ayahs",
    ayahsAnalysedTemplate: "{total} ayahs · {pct}% analysed"
  },

  surah: {
    metaTemplate: "{revelation} · {ayahCount} ayahs",
    metaAnalysedTemplate: "{revelation} · {ayahCount} ayahs · {analysedCount} of {tokenCount} words analysed",
    demoNoteTemplate: "Some words are not analysed yet.",
    textOnlyNote: "Qur'anic text only; no word analysis yet.",
    showTranslation: "Show translation",
    langName: { en: "English", ms: "Malay" },
    noTranslationInLang: "No translation in your language is available for this ayah yet.",
    translationNote: "Working rendering; not an authoritative translation.",
    ayahMissingTitle: "Ayah {ayah} doesn't exist in this surah",
    ayahMissingBody: "{surah} has {count} ayahs.",
    viewSurahTemplate: "View {surah}"
  },

  roots: {
    eyebrow: "VOCABULARY",
    title: "Roots",
    provisionalNote: "All roots are provisional. Contested roots are not listed."
  },

  root: {
    eyebrow: "ROOT",
    relatedLemmas: "Related lemmas",
    occurrencesTitle: "Qur'anic occurrences",
    noOccurrences: "No occurrences recorded.",
    noLemmas: "No lemmas recorded.",
    coreFieldSourceTemplate: "Core field source: {name}"
  },

  lemmas: {
    eyebrow: "VOCABULARY",
    title: "Lemmas"
  },

  lemma: {
    occurrencesCountTemplate: "{total} occurrences",
    occurrencesPartialTemplate: "{total} occurrences; showing the first {shown} in Qur'an order",
    eyebrow: "LEMMA",
    fieldPos: "Part of speech",
    fieldDerivation: "Derivation",
    fieldVerbForm: "Verb form",
    fieldRoot: "Root",
    noRoot: "None recorded",
    fieldLearnerNote: "Learner note",
    occurrencesTitle: "Occurrences (Juz / Surah / Ayah)",
    noOccurrences: "No occurrences recorded."
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
    status: {"provisional":"Provisional","reviewed":"Reviewed","verified":"Verified","imported":"Imported","unresolved":"Unresolved"},
    resolution: {"confident":"Single reading","provisional":"Root still open","context_dependent":"Context-dependent","unresolved":"Unresolved"},
    unresolvedTitle: "Expert review needed",
    unresolvedBody: "No analysis assigned yet.",
    contextTitle: "Expert review needed",
    contextBody: "Multiple readings are possible; the verse decides.",
    candidatesLabel: "Possible lemmas (not asserted)",
    alternativesLabel: "Other possible readings",
    sourceReviewNote: "Source review needed.",
    basisUnresolved: "No analysis assigned yet.",
    basis: {"rule_context":"Chosen for this verse; other readings exist.","rule_default":"Default analysis; context may differ.","pilot":"Analysed by QURRA."},
    morphDetails: "Morphological details",
    breakdown: "Breakdown",
    lemmaRoot: "Lemma &amp; root",
    sourceInfo: "Source information",
    singleUnit: "Single unit; no prefixes or suffixes.",
    conjugationWithheld: "Conjugation withheld pending review.",
    noRootRecorded: "No root recorded.",
    viewLemma: "View lemma",
    viewRoot: "View root",
    viewInQuran: "View in Qur'an",
    locationTemplate: "Qur'an {surah}:{ayah}, word {position}",
    wordNotFoundTitle: "Word not found",
    wordNotFoundBody: "This word doesn't exist.",
    pronounTemplate: "{person} pronoun",
    lemmaUnresolved: "No lemma assigned yet.",
    notAnalysedTitle: "Not analysed yet",
    notAnalysedBody: "Only the Qur'anic text and its location are shown.",
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
      atf: "Conjunction",
      shart: "Conditional / temporal particle",
      nafy_al_jins: "Categorical negation",
      nafy_simple: "Simple negation",
      nahy: "Prohibition",
      dua: "Supplication marker",
      jazm_nafy: "Negates + jussive marker",
      istifham: "Interrogative particle",
      tawkid: "Emphasis particle (inna / anna)",
      nasb: "Subjunctive particle",
      nafy_nasb: "Negation + subjunctive",
      istithna: "Exception particle",
      qad: "Particle qad (certainty)",
      tarajji: "Particle of hope (la'alla)",
      tanbih: "Alerting particle",
      nida: "Vocative particle",
      ghaya: "Particle of limit (until)"
    },
    segmentFunction: {
      jarr: "preposition", atf: 'conjunction ("and")', definite_article: "definite article",
      istifham: "interrogative prefix"
    },
    rootType: {
      sahih_salim: "Sound root", ajwaf: "Hollow (weak middle letter)",
      naqis: "Defective (weak final letter)", mudaaf: "Doubled",
      lafif_mafruq: "Doubly-weak, separated", lafif_maqrun: "Doubly-weak, adjacent",
      mithal: "Assimilated (weak first letter)",
      mahmuz: "Hamzated root (hamza as a root letter)"
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
    QURRA_PILOT_ANALYSIS: {
      name: "QURRA expanded pilot analyses",
      status: "Segmentation, lemma and feature analyses written by hand by QURRA for a test set of about 50 words. Not copied from any dataset and not reviewed by a qualified Arabic-grammar scholar."
    },
    QURRA_LEXICON: { name: "QURRA lexicon", status: "Lemmas, meanings and roots written by QURRA's editors from their own knowledge of Arabic. Provisional: not reviewed by a qualified scholar, and not copied from any dictionary or dataset." },
    QURRA_RULE_ANALYSIS: { name: "QURRA rule-based analysis", status: "The default reading of each spelling: QURRA's rules for prefixes, endings and pronouns applied to the exact Qur'anic spelling. Context is not consulted, so it can differ in a particular verse. Provisional." },
    QURRA_PILOT_ROOTS: {
      name: "QURRA expanded pilot root placeholders",
      status: "Root letters entered by hand for a few plainly regular verbs. They have not been assigned under QURRA's root verification process and carry no recorded evidence, so they are shown only as provisional placeholders."
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
    provisionalNote: "Not yet reviewed.",
    underReview: "Root under review",
    notApplicable: "No root is assigned for this kind of word."
  },

  status: {
    attribution: "Qur'anic text: Tanzil Project (tanzil.net), Creative Commons Attribution 3.0.",
    conjugationProvisional: "Not yet reviewed."
  }
};
