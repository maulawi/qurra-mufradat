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
    noMatchesTemplate: 'Tiada padanan dalam set data demo untuk "{query}".',
    languageLabel: "Bahasa",
    languageEn: "Bahasa Inggeris",
    languageMs: "Bahasa Melayu"
  },

  badge: {
    demo: "Prototaip · Data demo"
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
    description: "QURRA Mufradat ialah rujukan kosa kata dan morfologi al-Quran — setiap perkataan dipecahkan kepada akar kata, lemma, dan bentuk tatabahasanya, tanpa kad imbas, kuiz, atau enjin carian teks penuh yang mengganggu.",
    ctaExplore: "Terokai al-Quran",
    ctaBrowse: "Layari Kosa Kata",
    demoNoteTemplate: 'Ini adalah prototaip awal seni bina &amp; antara muka pengguna. Hanya <strong>{available} daripada {total}</strong> Juzuk (Juzuk 1 dan Juzuk 30) mempunyai data perkataan demo sebenar buat masa ini — selebihnya dipaparkan supaya struktur penuh kelihatan, dan ditanda dengan jelas sebagai "Belum tersedia."',
    browseByJuz: "Layari mengikut Juzuk"
  },

  juzCard: {
    demo: "Data demo",
    notAvailable: "Belum tersedia"
  },

  juz: {
    eyebrow: "JUZUK",
    titleTemplate: "Juzuk {n}",
    notAvailableTitle: "Belum tersedia dalam prototaip ini",
    notAvailableBody: "Juzuk ini masih belum mempunyai data perkataan demo. Liputan penuh al-Quran adalah peringkat pembangunan akan datang — rujuk ROADMAP.md dalam fail projek.",
    viewJuz1: "Lihat demo Juzuk 1",
    viewJuz30: "Lihat demo Juzuk 30",
    surahsInJuz: "Surah dalam Juzuk ini (demo)"
  },

  surahs: {
    eyebrow: "KOSA KATA",
    title: "Surah",
    demoNoteTemplate: "Prototaip ini merangkumi set surah yang kecil dan mewakili ({list}), bukan keseluruhan al-Quran."
  },

  surahCard: {
    demoAyahsTemplate: "{demo} daripada {total} ayat dalam demo"
  },

  surah: {
    metaTemplate: "{revelation} · {ayahCount} ayat dalam Mushaf penuh — {demoCount} disertakan dalam demo ini",
    demoNoteTemplate: "Hanya ayat berikut bagi surah ini disertakan dalam prototaip ini: {list}.",
    showTranslation: "Tunjuk terjemahan (parafrasa Bahasa Melayu)"
  },

  roots: {
    eyebrow: "KOSA KATA",
    title: "Akar Kata",
    demoNoteTemplate: "{count} akar kata disertakan dalam set data demo ini — cukup untuk menunjukkan satu akar kata dengan beberapa lemma (و ق ي, ر ح م, هـ د ي), bukan indeks akar kata yang lengkap."
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
    occurrencesTitle: "Kemunculan (Juzuk / Surah / Ayat)",
    noOccurrences: "Lemma ini tiada kemunculan perkataan dalam set data demo semasa — disertakan untuk menunjukkan bagaimana struktur lemma/akar kata kekal jujur tentang jurang liputan data, bukan mereka-reka contoh."
  },

  notfound: {
    eyebrow: "Tidak dijumpai",
    title: "Halaman tidak dijumpai",
    bodyTitleTemplate: "{kind} ini tiada dalam set data demo",
    body: "Prototaip ini merangkumi set data demo yang kecil dan ditanda jelas, bukan keseluruhan al-Quran. Cuba Surah al-Fatihah, al-Baqarah ayat 2, atau Surah al-Fil ayat 1.",
    backHome: "Kembali ke Laman Utama",
    kind: { word: "Perkataan", page: "Halaman", juz: "Juzuk", surah: "Surah", root: "Akar kata", lemma: "Lemma" }
  },

  filters: {
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
    wordNotFoundBody: "Unit perkataan ini tiada dalam set data demo.",
    pronounTemplate: "Kata ganti nama {person}"
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
    rootLabel: "akar kata"
  },

  enum: {
    number: { mufrad: "Tunggal", muthanna: "Dwi (Mutsanna)", "jamʿ": "Jamak" },
    pluralType: {
      jamʿ_mudhakkar_salim: "Jamak Muzakkar Salim",
      jamʿ_muannath_salim: "Jamak Muannath Salim",
      jamʿ_taksir: "Jamak Taksir"
    },
    gender: { mudhakkar: "Lelaki (Muzakkar)", muannath: "Perempuan (Muannath)" },
    definitenessState: { "maʿrifa": "Makrifah", nakira: "Nakirah" },
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
      ism_faʿil: "Isim Fa'il",
      ism_mafʿul: "Isim Maf'ul",
      sifa_mushabbaha: "Sifah Musyabbahah"
    },
    declension: { mabni: "Mabni (tidak berubah)", "muʿrab": "Mu'rab (boleh berubah)" },
    form: { maadi: "Fi'il Madhi", "mudariʿ": "Fi'il Mudhari'", amr: "Fi'il Amar" },
    voice: { active: "Aktif", passive: "Pasif" },
    functionHere: {
      jarr: "Kata Sendi Nama",
      atf: 'Kata Hubung ("dan")',
      nafy_al_jins: "Nafi Jenis",
      nafy_simple: "Nafi Mudah",
      nahy: "Larangan",
      "duʿa": "Penanda Doa",
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
    pos: { ism: "Kata Nama", "fiʿl": "Kata Kerja", harf: "Kata Tugas" },
    revelation: { Meccan: "Makkiyyah", Medinan: "Madaniyyah" }
  },

  conjugation: {
    perfective: "Fi'il Madhi",
    imperfective: "Fi'il Mudhari'",
    imperative: "Fi'il Amar"
  },

  source: {
    "src-quran-text": {
      name: "Sumber teks al-Quran",
      status: "PLACEHOLDER. Cetak biru (§10) mengesyorkan teks Uthmani yang disahkan daripada Tanzil.net sebagai sumber V1 sebenar. Teks Arab dalam demo ini telah disemak secara manual untuk beberapa ayat yang sangat dikenali, tetapi belum melalui semakan dua-sumber sebenar (cetak biru §11) dan tidak boleh dianggap sedia untuk pengeluaran."
    },
    "src-morphology": {
      name: "Analisis morfologi",
      status: "PLACEHOLDER. Calon sumber sebenar dan pertimbangan lesen dibincangkan dalam cetak biru §10 (Quranic Arabic Corpus, MASAQ). Segmentasi dan tag morfologi dalam demo ini ditulis secara manual untuk tujuan ilustrasi sahaja, tidak diambil daripada mana-mana korpus tersebut."
    },
    "src-qurra-editorial": {
      name: "Makna editorial QURRA / pengelasan demo",
      status: "Kandungan demo/contoh ditulis khas untuk prototaip ini. Belum disemak oleh pakar tatabahasa Arab yang bertauliah (cetak biru §11 Peringkat 5)."
    },
    "src-verified-conjugation": {
      name: "Tasrif disahkan",
      status: "Tasrif demo/contoh dipaparkan untuk tujuan demonstrasi antara muka sahaja. Ditanda 'stored_verified' semata-mata supaya prototaip dapat menunjukkan rupa tasrif tiga-bentuk yang telah disahkan — bentuk-bentuk ini sebenarnya belum melalui semakan ilmiah."
    },
    "src-raghib-mufradat": {
      name: "al-Raghib al-Isfahani — Mufradat al-Qur'an (rujukan klasik)",
      status: "PLACEHOLDER, tidak dirujuk untuk demo ini. Dibincangkan dalam cetak biru §2 sebagai sumber masa hadapan (peringkat kemudian, bukan V1) untuk nota leksikal yang lebih mendalam, dengan petikan muka surat daripada edisi sebenar. Tiada nombor muka surat didakwa di mana-mana dalam prototaip ini."
    }
  }
};
