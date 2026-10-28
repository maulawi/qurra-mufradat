/* ==========================================================================
   QURRA Mufradat al-Qur'an — UI strings (Bahasa Melayu)

   Keys match translations/en.js exactly. Arabic linguistic terminology
   (اسم، فعل، حرف، جمع تكسير...) is NOT translated — see the note at the
   top of en.js. Terminology here favours the transliterated Arabic-Malay
   grammar terms familiar from Malaysian Islamic/Arabic-grammar education
   (wazan, mabni/mu'rab, tasrif) over literal machine-style translation.
   ========================================================================== */

const QM_I18N_MS = {
  common: {
    skipToMain: "Langkau ke kandungan utama",
    search: "Cari",
    searchPlaceholder: "Cari perkataan, lemma, atau akar kata…",
    searchVocabularyLabel: "Cari kosa kata",
    close: "Tutup",
    back: "Kembali",
    noMatchesTemplate: 'Tiada padanan untuk "{query}".',
    languageLabel: "Bahasa",
    languageEn: "Bahasa Inggeris",
    languageMs: "Bahasa Melayu"
  },

  badge: {
    demo: "Versi beta"
  },

  nav: {
    home: "Utama",
    juz: "Juzuk",
    surahs: "Surah",
    roots: "Akar Kata",
    lemmas: "Lemma"
  },

  detailOverlay: {
    closeAriaLabel: "Tutup butiran perkataan"
  },

  home: {
    tagline: "Terokai al-Quran, perkataan demi perkataan.",
    sectionsLabel: "Terokai QURRA Mufradat",
    cardJuz: "Layari mengikut Juzuk",
    cardSurahs: "Semua 114 Surah",
    cardRoots: "Terokai akar kata",
    cardLemmas: "Bentuk kamus",
    betaTitle: "Versi beta",
    betaBody: "Pengesahan sedang dijalankan."
  },

  juzCard: {
    analysed: "Analisis perkataan",
    textOnly: "Teks sahaja"
  },

  juz: {
    ayahRangeTemplate: "ayat {range}",
    wholeSurahTemplate: "seluruh surah · {count} ayat",
    partOfSurahTemplate: "{count} daripada {total} ayat",
    totalAyahsTemplate: "{count} ayat dalam Juz ini",
    surahInJuzTemplate: "Juz {juz}: ayat {from}–{to} daripada {total}",
    eyebrow: "JUZUK",
    indexTitle: "Juzuk 1–30",
    indexIntro: "Pilih juzuk untuk melihat surahnya.",
    allJuz: "Semua juzuk",
    prevJuz: "← Juzuk {n}",
    nextJuz: "Juzuk {n} →",
    titleTemplate: "Juzuk {n}",
    notAvailableTitle: "Belum tersedia",
    notAvailableBody: "Juzuk ini belum mempunyai data perkataan.",
    viewJuz1: "Lihat Juzuk 1",
    viewJuz30: "Lihat Juzuk 30",
    surahsInJuz: "Surah dalam Juzuk ini",
    startsAtTemplate: "Bermula di {surah} {ayah}"
  },

  surahs: {
    eyebrow: "KOSA KATA",
    title: "Surah"
  },

  surahCard: {
    ayahsTemplate: "{total} ayat",
    ayahsAnalysedTemplate: "{total} ayat · {pct}% dianalisis"
  },

  surah: {
    metaTemplate: "{revelation} · {ayahCount} ayat",
    metaAnalysedTemplate: "{revelation} · {ayahCount} ayat · {analysedCount} daripada {tokenCount} perkataan dianalisis",
    demoNoteTemplate: "Sesetengah perkataan belum dianalisis.",
    textOnlyNote: "Teks al-Quran sahaja; belum ada analisis perkataan.",
    showTranslation: "Tunjuk terjemahan",
    langName: { en: "Inggeris", ms: "Melayu" },
    noTranslationInLang: "Terjemahan dalam bahasa anda belum ada untuk ayat ini.",
    translationNote: "Terjemahan kerja; bukan terjemahan yang berautoriti.",
    ayahMissingTitle: "Ayat {ayah} tiada dalam surah ini",
    ayahMissingBody: "{surah} mempunyai {count} ayat.",
    viewSurahTemplate: "Lihat {surah}"
  },

  roots: {
    eyebrow: "KOSA KATA",
    title: "Akar Kata",
    provisionalNote: "Semua akar kata bersifat sementara. Akar kata yang dipertikaikan tidak disenaraikan."
  },

  root: {
    eyebrow: "AKAR KATA",
    relatedLemmas: "Lemma Berkaitan",
    occurrencesTitle: "Kemunculan dalam al-Quran",
    noOccurrences: "Tiada kemunculan direkodkan.",
    noLemmas: "Tiada lemma direkodkan.",
    coreFieldSourceTemplate: "Sumber makna teras: {name}"
  },

  lemmas: {
    eyebrow: "KOSA KATA",
    title: "Lemma"
  },

  lemma: {
    occurrencesCountTemplate: "{total} kemunculan",
    occurrencesPartialTemplate: "{total} kemunculan; memaparkan {shown} yang pertama mengikut susunan al-Quran",
    eyebrow: "LEMMA",
    fieldPos: "Jenis Kata",
    fieldDerivation: "Terbitan",
    fieldVerbForm: "Wazan",
    fieldRoot: "Akar Kata",
    noRoot: "Tiada direkodkan",
    fieldLearnerNote: "Nota pelajar",
    occurrencesTitle: "Kemunculan (Juzuk / Surah / Ayat)",
    noOccurrences: "Tiada kemunculan direkodkan."
  },

  notfound: {
    eyebrow: "Tidak dijumpai",
    title: "Halaman tidak dijumpai",
    bodyTitleTemplate: "{kind} ini tidak wujud",
    body: "Semak alamat, atau mulakan daripada senarai Juzuk atau surah.",
    backHome: "Kembali ke Laman Utama",
    kind: { word: "Perkataan", page: "Halaman", juz: "Juzuk", surah: "Surah", root: "Akar kata", lemma: "Lemma" }
  },

  filters: {
    groupLabel: "Tapis mengikut jenis kata",
    all: "Semua",
    noun: "Kata Nama",
    verb: "Kata Kerja",
    particle: "Kata Tugas"
  },

  detail: {
    status: {"provisional":"Sementara","reviewed":"Telah disemak","verified":"Telah disahkan","imported":"Diimport","unresolved":"Belum selesai"},
    resolution: {"confident":"Satu bacaan","provisional":"Akar kata masih terbuka","context_dependent":"Bergantung pada konteks","unresolved":"Belum selesai"},
    unresolvedTitle: "Semakan pakar diperlukan",
    unresolvedBody: "Belum ada analisis ditetapkan.",
    contextTitle: "Semakan pakar diperlukan",
    contextBody: "Beberapa bacaan mungkin; ayat menentukannya.",
    candidatesLabel: "Lemma yang mungkin (tidak ditetapkan)",
    alternativesLabel: "Bacaan lain yang mungkin",
    sourceReviewNote: "Semakan sumber diperlukan.",
    basisUnresolved: "Belum ada analisis ditetapkan.",
    basis: {"rule_context":"Dipilih untuk ayat ini; ada bacaan lain.","rule_default":"Analisis lalai; konteks mungkin berbeza.","pilot":"Dianalisis oleh QURRA."},
    morphDetails: "Butiran Morfologi",
    breakdown: "Pecahan Perkataan",
    lemmaRoot: "Lemma &amp; Akar Kata",
    sourceInfo: "Maklumat Sumber",
    singleUnit: "Satu unit; tiada awalan atau akhiran.",
    conjugationWithheld: "Tasrif ditahan sehingga disemak.",
    noRootRecorded: "Tiada akar kata direkodkan.",
    viewLemma: "Lihat Lemma",
    viewRoot: "Lihat Akar Kata",
    viewInQuran: "Lihat dalam al-Quran",
    locationTemplate: "al-Quran {surah}:{ayah}, perkataan {position}",
    wordNotFoundTitle: "Perkataan Tidak Dijumpai",
    wordNotFoundBody: "Perkataan ini tidak wujud.",
    pronounTemplate: "Kata ganti nama {person}",
    lemmaUnresolved: "Lemma belum ditetapkan.",
    notAnalysedTitle: "Belum dianalisis",
    notAnalysedBody: "Hanya teks al-Quran dan lokasinya dipaparkan.",
    licenceLabel: "Status lesen",
    inUseNote: "Sedang digunakan"
  },

  fields: {
    number: "Bilangan",
    gender: "Jantina"
  },

  noun: {
    pluralType: "Jenis Jamak",
    definiteness: "Takrif",
    referenceClass: "Jenis Rujukan",
    declension: "Kemu'raban"
  },

  verb: {
    form: "Bentuk",
    person: "Orang",
    voice: "Ragam"
  },

  particle: {
    function: "Fungsi dalam ayat ini"
  },

  person: {
    1: "orang pertama",
    2: "orang kedua",
    3: "orang ketiga"
  },

  search: {
    posNoun: "kata nama",
    posVerb: "kata kerja",
    posParticle: "kata tugas",
    lemmaPrefix: "lemma",
    rootLabel: "akar kata",
    surahLabel: "surah",
    ayahLabel: "ayat"
  },

  enum: {
    number: { mufrad: "Tunggal", muthanna: "Dwi (Mutsanna)", jama: "Jamak" },
    pluralType: {
      jama_mudhakkar_salim: "Jamak Muzakkar Salim",
      jama_muannath_salim: "Jamak Muannath Salim",
      jama_taksir: "Jamak Taksir"
    },
    gender: { mudhakkar: "Lelaki (Muzakkar)", muannath: "Perempuan (Muannath)" },
    definitenessState: { marifa: "Makrifah", nakira: "Nakirah" },
    definitenessCause: {
      bi_al: "kata sandang ال",
      idafa: "struktur idafah/sandaran (إضافة)",
      alam: "ia adalah kata nama khas",
      ishara: "ia adalah kata tunjuk",
      mawsul: "ia adalah kata nama relatif"
    },
    referenceClass: {
      alam: "Kata Nama Khas", ishara: "Kata Tunjuk", mawsul: "Kata Nama Relatif",
      istifham: "Kata Tanya", pronoun: "Kata Ganti Nama"
    },
    derivationType: {
      jamid: "Kata Nama Asal (bukan terbitan daripada kata kerja)",
      masdar: "Kata Nama Terbitan (Masdar)",
      ism_fail: "Isim Fa'il",
      ism_mafool: "Isim Maf'ul",
      sifa_mushabbaha: "Sifah Musyabbahah"
    },
    declension: { mabni: "Mabni (tidak berubah)", murab: "Mu'rab (boleh berubah)" },
    form: { maadi: "Fi'il Madhi", mudari: "Fi'il Mudhari'", amr: "Fi'il Amar" },
    voice: { active: "Aktif", passive: "Pasif" },
    functionHere: {
      jarr: "Kata Sendi Nama",
      atf: "Kata Hubung",
      shart: "Kata Syarat",
      nafy_al_jins: "Nafi Jenis",
      nafy_simple: "Nafi Mudah",
      nahy: "Larangan",
      dua: "Penanda Doa",
      jazm_nafy: "Menafi + Penanda Jazam",
      istifham: "Partikel Soal",
      tawkid: "Partikel penegas (inna / anna)",
      nasb: "Partikel subjunktif",
      nafy_nasb: "Penafian + subjunktif",
      istithna: "Partikel pengecualian",
      qad: "Partikel qad (kepastian)",
      tarajji: "Partikel harapan (la'alla)",
      tanbih: "Partikel peringatan",
      nida: "Partikel panggilan",
      ghaya: "Partikel had (sehingga)"
    },
    segmentFunction: {
      jarr: "kata sendi nama", atf: 'kata hubung ("dan")', definite_article: "kata sandang tertentu",
      istifham: "awalan soal"
    },
    rootType: {
      sahih_salim: "Akar Sahih Salim", ajwaf: "Ajwaf (huruf lemah di tengah)",
      naqis: "Naqis (huruf lemah di akhir)", mudaaf: "Mudha'af (berganda)",
      lafif_mafruq: "Lafif Mafruq (dua huruf lemah berasingan)", lafif_maqrun: "Lafif Maqrun (dua huruf lemah berturutan)",
      mithal: "Mithal (huruf pertama lemah)",
      mahmuz: "Akar berhamzah (hamzah sebagai huruf akar)"
    },
    pos: { noun: "Kata Nama", verb: "Kata Kerja", particle: "Kata Tugas" },
    revelation: { Meccan: "Makkiyyah", Medinan: "Madaniyyah" }
  },

  conjugation: {
    perfective: "Fi'il Madhi",
    imperfective: "Fi'il Mudhari'",
    imperative: "Fi'il Amar"
  },

  licenceStatus: {
    verified: "Lesen disahkan",
    conditional: "Lesen bersyarat",
    unresolved: "Lesen belum selesai",
    internal: "Ditulis oleh QURRA",
    provisional: "Sementara (draf ditulis oleh QURRA)"
  },

  source: {
    TANZIL_TEXT: {
      name: "Teks al-Quran Tanzil (Uthmani)",
      status: "Teks al-Quran Tanzil yang rasmi, Uthmani versi 1.1, dipaparkan tanpa sebarang pengubahsuaian. Terma lesen dan sumber yang tepat direkodkan dalam daftar sumber; atribusi kepada Projek Tanzil (tanzil.net) dipaparkan pada pengaki halaman."
    },
    QURRA_EDITORIAL: {
      name: "Metadata editorial QURRA",
      status: "Metadata surah dan Juzuk disediakan oleh QURRA untuk prototaip ini; belum disemak terhadap sumber metadata utama."
    },
    QURRA_DEMO_MORPHOLOGY: {
      name: "Segmentasi dan morfologi demo QURRA",
      status: "Ditulis secara manual untuk demo Peringkat 1. Tidak diimport daripada mana-mana korpus dan belum disemak oleh pakar tatabahasa Arab yang bertauliah."
    },
    QURRA_GLOSS: {
      name: "Makna kosa kata QURRA",
      status: "Makna kosa kata ringkas yang digubal oleh QURRA (bukan terjemahan al-Quran). Draf yang belum disemak."
    },
    QURRA_DEMO_TRANSLATION: {
      name: "Terjemahan kerja ayat demo QURRA",
      status: "Terjemahan kerja yang ditulis untuk prototaip ini. Tidak dipetik daripada mana-mana terjemahan yang diterbitkan dan belum disemak."
    },
    QURRA_DEMO_CONJUGATION: {
      name: "Bentuk tasrif demo QURRA",
      status: "Bentuk rujukan yang dimasukkan secara manual untuk prototaip ini. Belum disemak."
    },
    QURRA_PILOT_ANALYSIS: {
      name: "Analisis perintis QURRA yang diperluas",
      status: "Analisis segmentasi, lemma dan ciri yang ditulis secara manual oleh QURRA bagi set ujian kira-kira 50 perkataan. Tidak disalin daripada mana-mana set data dan belum disemak oleh pakar tatabahasa Arab yang bertauliah."
    },
    QURRA_LEXICON: { name: "Leksikon QURRA", status: "Lemma, makna dan akar kata ditulis oleh penyunting QURRA berdasarkan pengetahuan bahasa Arab mereka sendiri. Sementara: belum disemak oleh sarjana yang layak, dan tidak disalin daripada mana-mana kamus atau set data." },
    QURRA_RULE_ANALYSIS: { name: "Analisis berasaskan peraturan QURRA", status: "Bacaan lalai bagi setiap ejaan: peraturan QURRA untuk awalan, akhiran dan kata ganti diterapkan pada ejaan al-Quran yang tepat. Konteks tidak dirujuk, jadi ia mungkin berbeza dalam ayat tertentu. Sementara." },
    QURRA_PILOT_ROOTS: {
      name: "Akar kata sementara perintis QURRA yang diperluas",
      status: "Huruf akar kata yang dimasukkan secara manual bagi beberapa kata kerja yang jelas biasa. Belum ditetapkan di bawah proses pengesahan akar kata QURRA dan tiada bukti direkodkan, maka hanya dipaparkan sebagai pemegang tempat sementara."
    },
    QURRA_DEMO_ROOTS: {
      name: "Akar kata sementara demo QURRA",
      status: "Huruf akar kata yang dimasukkan secara manual dalam demo Peringkat 1. Belum ditetapkan di bawah proses pengesahan akar kata QURRA dan tiada bukti direkodkan, maka hanya dipaparkan sebagai pemegang tempat sementara."
    },
    QURRA_ROOT_PROTOCOL: {
      name: "Protokol pengesahan akar kata QURRA",
      status: "Menunggu semakan pakar. Tiada akar kata yang dipaparkan dalam aplikasi ini telah ditetapkan di bawahnya."
    }
  },

  rootState: {
    provisionalBadge: "Sementara",
    provisionalNote: "Belum disemak.",
    underReview: "Akar kata dalam semakan",
    notApplicable: "Tiada akar kata ditetapkan bagi jenis perkataan ini."
  },

  status: {
    attribution: "Teks al-Quran: Projek Tanzil (tanzil.net), Creative Commons Attribution 3.0.",
    conjugationProvisional: "Belum disemak."
  }
};
