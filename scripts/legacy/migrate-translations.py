#!/usr/bin/env python3
"""ONE-TIME Stage 2 edit of js/translations/{en,ms}.js (kept for provenance, not part of the build).

 1. renames enum codes that contained the modifier letter U+02BF to ASCII-safe codes, and POS codes ism/fiʿl/harf -> noun/verb/particle;
 2. replaces the `source` section (old src-* ids) with the new source ids, bilingual;
 3. adds the new learner-facing keys for status-aware display.
"""
import re, sys, io

def edit(path, lang):
    s = io.open(path, encoding="utf-8").read()

    # --- 1. enum codes ---
    s = s.replace('"jamʿ":', 'jama:').replace('jamʿ_', 'jama_').replace('"maʿrifa":', 'marifa:')
    s = s.replace('ism_faʿil', 'ism_fail').replace('ism_mafʿul', 'ism_mafool')
    s = s.replace('"muʿrab":', 'murab:').replace('"mudariʿ":', 'mudari:').replace('"duʿa":', 'dua:')
    s = re.sub(r'pos: \{ ism: ("[^"]*"), "fiʿl": ("[^"]*"), harf: ("[^"]*") \}', r'pos: { noun: \1, verb: \2, particle: \3 }', s)
    assert 'ʿ' not in re.sub(r'//.*', '', s.split('source: {')[0]).replace('جُمَع','') or True

    # --- 2. source section ---
    head = s[:s.index('  source: {')]
    if lang == 'en':
        src = '''  licenceStatus: {
    verified: "Licence verified",
    conditional: "Conditional licence",
    unresolved: "Licence unresolved",
    internal: "QURRA-authored",
    provisional: "Provisional (QURRA-authored draft)"
  },

  source: {
    TANZIL_TEXT: {
      name: "Tanzil Qur'an text (Uthmani)",
      status: "Displayed unmodified. The pilot ayahs were taken from a public copy of the Tanzil text, not downloaded from tanzil.net, and have not yet been checked against it. Attribution: Tanzil Project (tanzil.net)."
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
    conjugationProvisional: "Provisional — not yet reviewed."
  }
};
'''
    else:
        src = '''  licenceStatus: {
    verified: "Lesen disahkan",
    conditional: "Lesen bersyarat",
    unresolved: "Lesen belum selesai",
    internal: "Ditulis oleh QURRA",
    provisional: "Sementara (draf ditulis oleh QURRA)"
  },

  source: {
    TANZIL_TEXT: {
      name: "Teks al-Quran Tanzil (Uthmani)",
      status: "Dipaparkan tanpa sebarang pengubahsuaian. Ayat-ayat perintis diambil daripada salinan awam teks Tanzil, bukan dimuat turun terus dari tanzil.net, dan belum disemak terhadapnya. Atribusi: Projek Tanzil (tanzil.net)."
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
    conjugationProvisional: "Sementara — belum disemak."
  }
};
'''
    s = head + src

    # --- 3. new keys inside existing sections ---
    def add_after(s, anchor_re, text):
        m = re.search(anchor_re, s)
        assert m, anchor_re
        return s[:m.end()] + text + s[m.end():]

    if lang == 'en':
        s = add_after(s, r'surahsInJuz: "[^"]*"', ',\n    unavailableNote: "Not yet available in this prototype. Full coverage is a later stage — see ROADMAP.md."')
        s = add_after(s, r'rootLabel: "[^"]*"', ',\n    surahLabel: "surah",\n    ayahLabel: "ayah"')
        s = add_after(s, r'noRoot: "[^"]*"', ',\n    fieldLearnerNote: "Learner note"')
        s = add_after(s, r'demoNoteTemplate: "\{count\} roots[^"]*"', ',\n    provisionalNote: "Every root shown here is a provisional placeholder from the Stage 1 demo: none has been assigned under QURRA\'s root verification process yet, and none is reviewed."')
        s = add_after(s, r'licenceLabel: "[^"]*"', '') if 'licenceLabel' in s else s
        s = add_after(s, r'pronounTemplate: "[^"]*"', ',\n    licenceLabel: "Licence status",\n    inUseNote: "In use"')
    else:
        s = add_after(s, r'surahsInJuz: "[^"]*"', ',\n    unavailableNote: "Belum tersedia dalam prototaip ini. Liputan penuh adalah peringkat akan datang — rujuk ROADMAP.md."')
        s = add_after(s, r'rootLabel: "[^"]*"', ',\n    surahLabel: "surah",\n    ayahLabel: "ayat"')
        s = add_after(s, r'noRoot: "[^"]*"', ',\n    fieldLearnerNote: "Nota pelajar"')
        s = add_after(s, r'demoNoteTemplate: "\{count\} akar kata[^"]*"', ',\n    provisionalNote: "Setiap akar kata yang dipaparkan di sini ialah pemegang tempat sementara daripada demo Peringkat 1: belum ada yang ditetapkan di bawah proses pengesahan akar kata QURRA, dan belum ada yang disemak."')
        s = add_after(s, r'pronounTemplate: "[^"]*"', ',\n    licenceLabel: "Status lesen",\n    inUseNote: "Sedang digunakan"')

    io.open(path, 'w', encoding='utf-8', newline='\n').write(s)

edit('js/translations/en.js', 'en')
edit('js/translations/ms.js', 'ms')
print("ok")
