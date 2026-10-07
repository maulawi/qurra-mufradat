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
    demo: "Prototaip · Analisis perkataan: perintis"
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
    tagline: "Terokai setiap patah kata dalam al-Quran, Juzuk demi Juzuk.",
    description: "QURRA Mufradat ialah penjelajah kosa kata al-Quran: teks al-Quran yang lengkap, perkataan demi perkataan, Juzuk demi Juzuk. Analisis perkataan (akar kata, lemma, bentuk tatabahasa) setakat ini hanya ada bagi sampel perintis yang terhad dan bersifat sementara.",
    ctaExplore: "Terokai al-Quran",
    ctaBrowse: "Layari Kosa Kata",
    demoNoteTemplate: 'Teks al-Quran yang lengkap (114 surah, 6,236 ayat) disertakan. Analisis perkataan demi perkataan (lemma, akar kata, morfologi) setakat ini hanya ada bagi sampel perintis yang kecil iaitu <strong>{analysed} ayat</strong> dan bersifat sementara; setiap perkataan lain hanya memaparkan teksnya, ditanda "belum dianalisis".',
    browseByJuz: "Layari mengikut Juzuk"
  },

  juzCard: {
    analysed: "Analisis perkataan (perintis)",
    textOnly: "Teks sahaja"
  },

  juz: {
    eyebrow: "JUZUK",
    titleTemplate: "Juzuk {n}",
    notAvailableTitle: "Belum tersedia dalam prototaip ini",
    notAvailableBody: "Juzuk ini masih belum mempunyai data perkataan demo. Liputan penuh al-Quran adalah peringkat pembangunan akan datang — rujuk ROADMAP.md dalam fail projek.",
    viewJuz1: "Lihat demo Juzuk 1",
    viewJuz30: "Lihat demo Juzuk 30",
    surahsInJuz: "Surah dalam Juzuk ini",
    startsAtTemplate: "Bermula di {surah} {ayah}",
    unavailableNote: "Belum tersedia dalam prototaip ini. Liputan penuh adalah peringkat akan datang — rujuk ROADMAP.md."
  },

  surahs: {
    eyebrow: "KOSA KATA",
    title: "Surah",
    noteTemplate: "Kesemua 114 surah disertakan. Analisis perkataan demi perkataan hanya ada bagi sampel perintis dalam: {list}."
  },

  surahCard: {
    ayahsTemplate: "{total} ayat",
    ayahsAnalysedTemplate: "{total} ayat · {analysed} dengan analisis perkataan"
  },

  surah: {
    metaTemplate: "{revelation} · {ayahCount} ayat",
    metaAnalysedTemplate: "{revelation} · {ayahCount} ayat — {analysedCount} dengan analisis perkataan (perintis)",
    demoNoteTemplate: "Analisis perkataan demi perkataan hanya ada bagi ayat {list} surah ini (perintis). Setiap perkataan lain hanya memaparkan teks al-Quran.",
    textOnlyNote: "Belum ada analisis perkataan demi perkataan bagi surah ini. Perkataan hanya memaparkan teks al-Quran.",
    showTranslation: "Tunjuk terjemahan (parafrasa Bahasa Melayu)",
    translationNote: "Terjemahan kerja yang ditulis untuk prototaip ini — bukan terjemahan yang berautoriti.",
    ayahMissingTitle: "Ayat {ayah} tiada dalam surah ini",
    ayahMissingBody: "{surah} mempunyai {count} ayat.",
    viewSurahTemplate: "Lihat {surah}"
  },

  roots: {
    eyebrow: "KOSA KATA",
    title: "Akar Kata",
    demoNoteTemplate: "{count} akar kata disertakan dalam set data demo ini — cukup untuk menunjukkan satu akar kata dengan beberapa lemma (و ق ي, ر ح م, هـ د ي), bukan indeks akar kata yang lengkap.",
    provisionalNote: "Setiap akar kata yang dipaparkan di sini ialah pemegang tempat sementara daripada demo Peringkat 1: belum ada yang ditetapkan di bawah proses pengesahan akar kata QURRA, dan belum ada yang disemak."
  },

  root: {
    eyebrow: "AKAR KATA",
    relatedLemmas: "Lemma Berkaitan",
    occurrencesTitle: "Kemunculan dalam al-Quran (demo)",
    noOccurrences: "Tiada lemma bagi akar kata ini yang muncul dalam set data demo buat masa ini.",
    noLemmas: "Tiada lemma direkodkan bagi akar kata ini dalam set data demo.",
    coreFieldSourceTemplate: "Sumber makna teras: {name} — {status}"
  },

  lemmas: {
    eyebrow: "KOSA KATA",
    title: "Lemma",
    demoNoteTemplate: "{count} lemma (bentuk kamus) disertakan dalam set data demo ini."
  },

  lemma: {
    eyebrow: "LEMMA",
    fieldPos: "Jenis Kata",
    fieldDerivation: "Terbitan",
    fieldVerbForm: "Wazan",
    fieldRoot: "Akar Kata",
    noRoot: "Tiada direkodkan (lazim bagi kata tugas dan beberapa bentuk beku)",
    fieldLearnerNote: "Nota pelajar",
    occurrencesTitle: "Kemunculan (Juzuk / Surah / Ayat)",
    noOccurrences: "Lemma ini tiada kemunculan perkataan dalam set data demo semasa — disertakan untuk menunjukkan bagaimana struktur lemma/akar kata kekal jujur tentang jurang liputan data, bukan mereka-reka contoh."
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
    morphDetails: "Butiran Morfologi",
    breakdown: "Pecahan Perkataan",
    lemmaRoot: "Lemma &amp; Akar Kata",
    sourceInfo: "Maklumat Sumber",
    singleUnit: "Perkataan ini merupakan satu unit morfologi sahaja — tiada awalan atau akhiran yang bergabung.",
    conjugationWithheld: "Tasrif asas tidak dipaparkan — belum disahkan oleh pakar (rujuk peraturan paparan dalam cetak biru §8).",
    noRootRecorded: "Perkataan ini tiada akar kata direkodkan — lazim bagi kata tugas dan beberapa bentuk beku (rujuk DATA_SCHEMA.md).",
    viewLemma: "Lihat Lemma",
    viewRoot: "Lihat Akar Kata",
    viewInQuran: "Lihat dalam al-Quran",
    locationTemplate: "al-Quran {surah}:{ayah}, perkataan {position}",
    wordNotFoundTitle: "Perkataan Tidak Dijumpai",
    wordNotFoundBody: "Perkataan ini tidak wujud.",
    pronounTemplate: "Kata ganti nama {person}",
    lemmaUnresolved: "Lemma bagi perkataan ini belum dikenal pasti.",
    notAnalysedTitle: "Analisis perkataan belum tersedia",
    notAnalysedBody: "Perkataan ini belum mempunyai lemma, akar kata atau morfologi yang direkodkan. Tiada apa yang diteka: analisis akan dipaparkan di sini apabila diperoleh daripada sumber berlesen yang telah disemak.",
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
      atf: 'Kata Hubung ("dan")',
      nafy_al_jins: "Nafi Jenis",
      nafy_simple: "Nafi Mudah",
      nahy: "Larangan",
      dua: "Penanda Doa",
      jazm_nafy: "Menafi + Penanda Jazam",
      istifham: "Awalan Soal"
    },
    segmentFunction: {
      jarr: "kata sendi nama", atf: 'kata hubung ("dan")', definite_article: "kata sandang tertentu",
      istifham: "awalan soal"
    },
    rootType: {
      sahih_salim: "Akar Sahih Salim", ajwaf: "Ajwaf (huruf lemah di tengah)",
      naqis: "Naqis (huruf lemah di akhir)", mudaaf: "Mudha'af (berganda)",
      lafif_mafruq: "Lafif Mafruq (dua huruf lemah berasingan)", lafif_maqrun: "Lafif Maqrun (dua huruf lemah berturutan)"
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
    provisionalNote: "Akar kata sementara (pemegang tempat): belum ditetapkan di bawah proses pengesahan akar kata QURRA dan belum disemak.",
    underReview: "Akar kata dalam semakan",
    notApplicable: "Tiada akar kata ditetapkan bagi jenis perkataan ini."
  },

  status: {
    attribution: "Teks al-Quran: Projek Tanzil (tanzil.net), Creative Commons Attribution 3.0.",
    conjugationProvisional: "Sementara — belum disemak."
  }
};
