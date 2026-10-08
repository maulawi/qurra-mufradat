#!/usr/bin/env node
/* ==========================================================================
   ONE-TIME CONTENT AUTHORING (Stage 4 pilot expansion). Not part of the build.

   Writes the QURRA-authored test set into data/qurra/*.json: forms, lemmas, glosses, a few roots,
   analysis sets (candidate analyses with an explicit `chosen` pointer) and conflicts.

   EVERYTHING HERE IS QURRA-AUTHORED, written by hand from the editors' own knowledge of Arabic
   grammar. NOTHING is copied or derived from QAC, QuranMorph, Qabas, MASAQ, QAMAR, QUL, EQTB,
   Wikidata or any other morphology dataset. All records are origin "qurra_editorial", status
   "provisional" (or disputed/unresolved), and none has been reviewed by a qualified scholar.
   Where the analysis is uncertain the record says so (unresolved / disputed) instead of guessing.

   Refuses to run twice (it stops if its first lemma already exists).
   Usage: node scripts/legacy/author-stage4-pilot.js
   ========================================================================== */
"use strict";
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const ROOT = path.resolve(__dirname, "..", "..");
const rd = rel => JSON.parse(fs.readFileSync(path.join(ROOT, rel), "utf8"));
const wr = (rel, obj) => fs.writeFileSync(path.join(ROOT, rel), JSON.stringify(obj, null, 2) + "\n", "utf8");

const ayahsFile = rd("data/qurra/ayahs.json");
const AYAH = new Map(ayahsFile.ayahs.map(a => [a.ayah_id, a.text.split(" ")]));
const tokenText = id => { const [s, a, p] = id.split(":"); return AYAH.get(`${s}:${a}`)[Number(p) - 1]; };

const formsF = rd("data/qurra/forms.json"), lemmasF = rd("data/qurra/lemmas.json"), glossF = rd("data/qurra/glosses.json"),
  rootsF = rd("data/qurra/roots.json"), setsF = rd("data/qurra/analyses.json"), confF = rd("data/qurra/conflicts.json");
if (lemmasF.lemmas.some(l => l.lemma_id === "qaala-1")) { console.error("already applied"); process.exit(2); }

const SRC = "QURRA_PILOT_ANALYSIS";

/* ---------------- segment / morphology helpers ---------------- */
const proc = (surface, fn) => ({ type: "proclitic", surface, pos: "particle", function: fn });
const P_JARR = s => proc(s, "jarr"), P_ATF = s => proc(s, "atf"), P_AL = s => proc(s, "definite_article");
const stem = (surface, pos, lemma) => ({ type: "stem", surface, pos, lemma_id: lemma });
const enc = (surface, person, number, gender) => ({ type: "enclitic", surface, pos: "noun", pronoun_features: { person, number, gender } });
const N = (o) => Object.assign({ number: "mufrad", gender: "mudhakkar" }, o);
const def = (state, cause) => cause ? { state, cause } : { state };
const V = (aspect, person, number, gender, voice) => ({ aspect, person, number, gender, voice: voice || "active" });

/* ---------------- lemmas, glosses ---------------- */
const NP = "unresolved"; // placeholder used for readability
const protocolProv = { source_id: "QURRA_ROOT_PROTOCOL", status: "pending_expert_review" };
const rootAssign = (kind, arg) => {
  const base = { root_id: null, status: "unresolved", candidates: [], rule_ids: [], evidence: [], origin: "qurra_editorial", provenance: protocolProv };
  if (kind === "unresolved") return base;
  if (kind === "null") return Object.assign(base, { status: "null_policy" });
  if (kind === "disputed") return Object.assign(base, { status: "disputed", candidates: arg });
  if (kind === "provisional") return Object.assign(base, { root_id: arg, status: "provisional", provenance: { source_id: arg.startsWith("root-s2-m-d") || ["root-w-l-d", "root-w-s-3", "root-m-d-d", "root-t-b-b"].includes(arg) ? "QURRA_PILOT_ROOTS" : "QURRA_DEMO_ROOTS", status: "provisional_not_assigned_under_protocol" } });
  throw new Error(kind);
};

// [id, form, pos, extra, root, en, ms, noteEn?, noteMs?]
const L = [
  ["qaala-1", "قَالَ", "verb", { verb_form: "I" }, rootAssign("unresolved"), "to say", "berkata, mengatakan"],
  ["huwa-1", "هُوَ", "noun", {}, rootAssign("null"), "he; it (pronoun)", "dia; ia (kata ganti nama)"],
  ["ahad-1", "أَحَد", "noun", {}, rootAssign("disputed", ["ء ح د", "و ح د"]), "one; anyone", "satu; seorang pun"],
  ["samad-1", "صَمَد", "noun", {}, rootAssign("provisional", "root-s2-m-d"), "the Self-Sufficient One, to whom all turn", "Yang Maha Mencukupi, tempat bergantung segala sesuatu"],
  ["walada-1", "وَلَدَ", "verb", { verb_form: "I" }, rootAssign("provisional", "root-w-l-d"), "to beget; to give birth", "melahirkan; beranak"],
  ["kaana-1", "كَانَ", "verb", { verb_form: "I" }, rootAssign("unresolved"), "to be; to exist", "adalah; ada"],
  ["hayy-1", "حَيّ", "noun", { derivation_type: "sifa_mushabbaha" }, rootAssign("unresolved"), "living, alive", "hidup"],
  ["qayyum-1", "قَيُّوم", "noun", {}, rootAssign("unresolved"), "self-subsisting; the One who sustains all", "berdiri sendiri; Yang mengurus segala sesuatu"],
  ["akhadha-1", "أَخَذَ", "verb", { verb_form: "I" }, rootAssign("unresolved"), "to take; to seize", "mengambil; menimpa"],
  ["idhn-1", "إِذْن", "noun", {}, rootAssign("unresolved"), "permission, leave", "izin, kebenaran"],
  ["yad-1", "يَد", "noun", { derivation_type: "jamid" }, rootAssign("unresolved"), "hand", "tangan"],
  ["wasia-1", "وَسِعَ", "verb", { verb_form: "I" }, rootAssign("provisional", "root-w-s-3"), "to encompass; to be wide enough for", "meliputi; muat"],
  ["malak-1", "مَلَك", "noun", {}, rootAssign("disputed", ["م ل ك", "ء ل ك"]), "angel", "malaikat"],
  ["iblis-1", "إِبْلِيس", "noun", { derivation_type: "jamid" }, rootAssign("disputed", ["ب ل س"]), "Iblis (a proper name)", "Iblis (nama khas)"],
  ["abaa-1", "أَبَى", "verb", { verb_form: "I" }, rootAssign("unresolved"), "to refuse", "enggan; menolak"],
  ["qaraa-1", "قَرَأَ", "verb", { verb_form: "I" }, rootAssign("unresolved"), "to read; to recite", "membaca"],
  ["rama-1", "رَمَى", "verb", { verb_form: "I" }, rootAssign("unresolved"), "to throw; to shoot", "melempar; melontar"],
  ["madda-1", "مَدَّ", "verb", { verb_form: "I" }, rootAssign("provisional", "root-m-d-d"), "to stretch out; to extend", "membentangkan; menghamparkan"],
  ["ibn-1", "ٱبْن", "noun", { derivation_type: "jamid" }, rootAssign("disputed", ["ب ن و", "ب ن ي"]), "son", "anak lelaki"],
  ["in-1", "إِنْ", "particle", { function_inventory: ["shart", "nafy_simple"] }, rootAssign("null"), "if; (not)", "jika; tidak (menafikan)",
    "Two roles appear in the pilot: conditional (2:23) and negation (6:29); see the function shown for each word.", "Dua peranan muncul dalam perintis ini: syarat (2:23) dan nafi (6:29); lihat fungsi yang dipaparkan bagi setiap perkataan."],
  ["min-1", "مِنْ", "particle", { function_inventory: ["jarr"] }, rootAssign("null"), "from; of", "daripada; dari"],
  ["man-1", "مَن", "noun", {}, rootAssign("null"), "who; whoever", "siapa; sesiapa"],
  ["ma-1", "مَا", "particle", { function_inventory: ["nafy_simple"] }, rootAssign("null"), "not", "tidak; bukan"],
  ["ma-2", "مَا", "noun", {}, rootAssign("null"), "what; that which", "apa; apa yang",
    "The same spelling as the negative particle (ma-1) but a noun here: relative or interrogative, depending on the verse.", "Ejaan sama dengan kata nafi (ma-1) tetapi di sini ialah kata nama: penghubung atau soalan, bergantung pada ayat."],
  ["ilah-1", "إِلَٰه", "noun", {}, rootAssign("unresolved"), "god; deity; one worshipped", "tuhan; yang disembah"],
  ["kufu-1", "كُفُو", "noun", {}, rootAssign("unresolved"), "equal; comparable", "setara; sebanding"],
  ["kufu-2", "كُفُؤ", "noun", {}, rootAssign("unresolved"), "equal; comparable", "setara; sebanding",
    "An alternative spelling of the lemma of 112:4:4, kept while the choice between kufu-1 and kufu-2 is unresolved.", "Ejaan alternatif bagi lemma 112:4:4, disimpan selagi pilihan antara kufu-1 dan kufu-2 belum diputuskan."],
  ["ab-1", "أَب", "noun", { derivation_type: "jamid" }, rootAssign("unresolved"), "father", "bapa"],
  ["tabba-1", "تَبَّ", "verb", { verb_form: "I" }, rootAssign("provisional", "root-t-b-b"), "to perish; to be ruined", "binasa; rugi"],
  ["imraa-1", "امْرَأَة", "noun", { derivation_type: "jamid" }, rootAssign("unresolved"), "woman; wife", "wanita; isteri"],
  ["aadha-1", "عَاذَ", "verb", { verb_form: "I" }, rootAssign("unresolved"), "to seek refuge", "berlindung"],
  ["malik-2", "مَلِك", "noun", {}, rootAssign("provisional", "root-m-l-k"), "king; sovereign", "raja; penguasa",
    "A different lemma from مَالِك (malik-1, 'owner') although both are placed under the same provisional root.", "Lemma yang berbeza daripada مَالِك (malik-1, 'pemilik') walaupun kedua-duanya diletakkan di bawah akar kata sementara yang sama."],
  ["waswas-1", "وَسْوَاس", "noun", { derivation_type: "masdar" }, rootAssign("disputed", ["و س و س", "و س س"]), "whispering; the whisperer", "bisikan; pembisik"],
  ["waswasa-1", "وَسْوَسَ", "verb", {}, rootAssign("disputed", ["و س و س", "و س س"]), "to whisper (evil suggestions)", "membisikkan (hasutan)"],
  ["zalzala-1", "زَلْزَلَ", "verb", {}, rootAssign("disputed", ["ز ل ز ل", "ز ل ل"]), "to shake violently", "menggoncang dengan kuat"],
  ["zilzal-1", "زِلْزَال", "noun", { derivation_type: "masdar" }, rootAssign("disputed", ["ز ل ز ل", "ز ل ل"]), "violent shaking; earthquake", "gegaran kuat; gempa"],
  ["damdama-1", "دَمْدَمَ", "verb", {}, rootAssign("disputed", ["د م د م", "د م م"]), "to crush; to destroy utterly", "membinasakan sepenuhnya"]
];
const lemmaPos = Object.fromEntries(L.map(x => [x[0], x[2]]));
for (const [id, form, pos, extra, root, en, ms, noteEn, noteMs] of L) {
  lemmasF.lemmas.push(Object.assign({ lemma_id: id, form_vocalized: form, pos }, extra, {
    root, status: "provisional", provenance: { lemma: { source_id: SRC } }
  }));
  glossF.glosses.push({
    gloss_id: "gloss-" + id, lemma_id: id, lexical: { en, ms }, contextual_explanations: [],
    learner_note: noteEn ? { en: noteEn, ms: noteMs } : null, usage_note: null, example: null, editor_note: null,
    status: "provisional", provenance: { source_id: "QURRA_GLOSS" }
  });
}
lemmasF.lemmas.sort((a, b) => a.lemma_id.localeCompare(b.lemma_id));
glossF.glosses.sort((a, b) => a.gloss_id.localeCompare(b.gloss_id));

/* ---------------- a few provisional placeholder roots (plainly regular verbs only) ---------------- */
const slug = { "ء": "2", "ب": "b", "ت": "t", "د": "d", "س": "s", "ص": "s2", "ع": "3", "ل": "l", "م": "m", "و": "w" };
const newRoots = [
  ["ص م د", "sahih_salim", "being self-sufficient; being the one all turn to", "kecukupan; tempat bergantung"],
  ["و ل د", "mithal", "birth, offspring", "kelahiran, keturunan"],
  ["و س ع", "mithal", "being wide, encompassing", "keluasan, meliputi"],
  ["م د د", "mudaaf", "stretching out, extending", "membentang, menghulurkan"],
  ["ت ب ب", "mudaaf", "perishing, ruin", "kebinasaan, kerugian"]
];
for (const [display, type, en, ms] of newRoots) {
  const letters = display.split(" ");
  rootsF.roots.push({
    root_id: "root-" + letters.map(l => slug[l]).join("-"), letters, display, root_type: type, core_field: { en, ms },
    status: "provisional", provenance: { letters: { source_id: "QURRA_PILOT_ROOTS" }, core_field: { source_id: "QURRA_GLOSS" } }
  });
}
rootsF.roots.sort((a, b) => a.root_id.localeCompare(b.root_id));

/* ---------------- forms ---------------- */
const formIds = new Map();     // key -> form
function makeForm(tokenId, segs, morph, note) {
  const surface = tokenText(tokenId);
  const key = JSON.stringify({ surface, segments: segs, morphology: morph });
  if (formIds.has(key)) return formIds.get(key);
  const existing = formsF.forms.find(f => f.surface === surface && JSON.stringify({ surface: f.surface, segments: f.segments.map(({ segment_id, ...r }) => r), morphology: f.morphology }) === key);
  if (existing) { formIds.set(key, existing); return existing; }
  const stemSeg = segs.find(s => s.type === "stem");
  const hash = crypto.createHash("sha1").update(key).digest("hex").slice(0, 8);
  const formId = `frm-${stemSeg && stemSeg.lemma_id ? stemSeg.lemma_id : "x"}-${hash}`;
  const form = {
    form_id: formId, surface, segments: segs.map((s, n) => Object.assign({ segment_id: `${formId}.s${n + 1}` }, s)), morphology: morph,
    status: "provisional", provenance: { morphology: { source_id: SRC } }
  };
  if (note) form.segmentation_note = note;
  formsF.forms.push(form);
  formIds.set(key, form);
  return form;
}

/* ---------------- the test set ---------------- */
// [token, segments, morphology, alternatives?]   alternatives: [{id, segs, morph, label}]
const T = [];
const t = (tok, segs, morph, alts) => T.push({ tok, segs, morph, alts: alts || [] });

// 112 al-Ikhlas
t("112:1:1", [stem("قُلْ", "verb", "qaala-1")], V("amr", 2, "mufrad", "mudhakkar"));
t("112:1:2", [stem("هُوَ", "noun", "huwa-1")], N({ reference_class: "pronoun", declension: "mabni", definiteness: null }));
const ALLAH = [stem("ٱللَّهُ", "noun", "allah-1")], ALLAH_M = N({ definiteness: def("marifa", "alam"), reference_class: "alam" });
t("112:1:3", ALLAH, ALLAH_M);
t("112:1:4", [stem("أَحَدٌ", "noun", "ahad-1")], N({ definiteness: def("nakira") }));
t("112:2:2", [P_AL("ٱل"), stem("صَّمَدُ", "noun", "samad-1")], N({ definiteness: def("marifa", "bi_al") }));
t("112:3:1", [stem("لَمْ", "particle", "lam-1")], { function_here: "jazm_nafy" });
t("112:3:2", [stem("يَلِدْ", "verb", "walada-1")], V("mudari", 3, "mufrad", "mudhakkar"));
t("112:3:4", [stem("يُولَدْ", "verb", "walada-1")], V("mudari", 3, "mufrad", "mudhakkar", "passive"));
t("112:4:2", [stem("يَكُن", "verb", "kaana-1")], V("mudari", 3, "mufrad", "mudhakkar"));
t("112:4:4", [stem("كُفُوًا", "noun", "kufu-1")], N({ definiteness: def("nakira") }),
  [{ id: "b", segs: [stem("كُفُوًا", "noun", "kufu-2")], morph: N({ definiteness: def("nakira") }), label: "lemma كُفُؤ (kufu-2)" }]);
t("112:4:5", [stem("أَحَدٌۢ", "noun", "ahad-1")], N({ definiteness: def("nakira") }));
// 111 al-Masad
t("111:1:1", [stem("تَبَّتْ", "verb", "tabba-1")], V("maadi", 3, "mufrad", "muannath"));
t("111:1:2", [stem("يَدَآ", "noun", "yad-1")], { number: "muthanna", gender: null, definiteness: def("marifa", "idafa") });
t("111:1:3", [stem("أَبِى", "noun", "ab-1")], N({ definiteness: def("marifa", "idafa") }));
t("111:1:5", [P_ATF("وَ"), stem("تَبَّ", "verb", "tabba-1")], V("maadi", 3, "mufrad", "mudhakkar"));
t("111:2:1", [stem("مَآ", "particle", "ma-1")], { function_here: "nafy_simple" },
  [{ id: "b", segs: [stem("مَآ", "noun", "ma-2")], morph: { number: null, gender: null, definiteness: null, reference_class: "istifham", declension: "mabni" }, label: "interrogative noun (ma-2)" }]);
t("111:4:1", [P_ATF("وَ"), stem("ٱمْرَأَتُ", "noun", "imraa-1"), enc("هُۥ", 3, "mufrad", "mudhakkar")], N({ gender: "muannath", definiteness: def("marifa", "idafa") }));
// 114 an-Nas
t("114:1:2", [stem("أَعُوذُ", "verb", "aadha-1")], V("mudari", 1, "mufrad", null));
t("114:1:3", [P_JARR("بِ"), stem("رَبِّ", "noun", "rabb-1")], N({ definiteness: def("marifa", "idafa") }));
t("114:2:1", [stem("مَلِكِ", "noun", "malik-2")], N({ definiteness: def("marifa", "idafa") }));
t("114:4:3", [P_AL("ٱلْ"), stem("وَسْوَاسِ", "noun", "waswas-1")], N({ definiteness: def("marifa", "bi_al") }));
t("114:5:2", [stem("يُوَسْوِسُ", "verb", "waswasa-1")], V("mudari", 3, "mufrad", "mudhakkar"));
// 99, 91
t("99:1:2", [stem("زُلْزِلَتِ", "verb", "zalzala-1")], V("maadi", 3, "mufrad", "muannath", "passive"));
t("99:1:4", [stem("زِلْزَالَ", "noun", "zilzal-1"), enc("هَا", 3, "mufrad", "muannath")], N({ definiteness: def("marifa", "idafa") }));
t("91:14:3", [P_ATF("فَ"), stem("دَمْدَمَ", "verb", "damdama-1")], V("maadi", 3, "mufrad", "mudhakkar"));
// 2:255 (ayat al-kursi)
t("2:255:1", ALLAH, ALLAH_M);
t("2:255:3", [stem("إِلَٰهَ", "noun", "ilah-1")], N({ definiteness: def("nakira") }),
  [{ id: "b", segs: [stem("إِلَٰهَ", "noun", "allah-1")], morph: N({ definiteness: def("nakira") }), label: "lemma اللَّه (allah-1)" }]);
t("2:255:6", [P_AL("ٱلْ"), stem("حَىُّ", "noun", "hayy-1")], N({ definiteness: def("marifa", "bi_al") }));
t("2:255:7", [P_AL("ٱلْ"), stem("قَيُّومُ", "noun", "qayyum-1")], N({ definiteness: def("marifa", "bi_al") }));
t("2:255:9", [stem("تَأْخُذُ", "verb", "akhadha-1"), enc("هُۥ", 3, "mufrad", "mudhakkar")], V("mudari", 3, "mufrad", "muannath"));
t("2:255:14", [stem("مَا", "noun", "ma-2")], { number: null, gender: null, definiteness: null, reference_class: "mawsul", declension: "mabni" });
t("2:255:20", [stem("مَن", "noun", "man-1")], { number: "mufrad", gender: null, definiteness: null, reference_class: "istifham", declension: "mabni" });
t("2:255:26", [P_JARR("بِ"), stem("إِذْنِ", "noun", "idhn-1"), enc("هِۦ", 3, "mufrad", "mudhakkar")], N({ definiteness: def("marifa", "idafa") }));
t("2:255:30", [stem("أَيْدِي", "noun", "yad-1"), enc("هِمْ", 3, "jama", "mudhakkar")], { number: "jama", plural_type: "jama_taksir", gender: null, definiteness: def("marifa", "idafa") });
t("2:255:41", [stem("وَسِعَ", "verb", "wasia-1")], V("maadi", 3, "mufrad", "mudhakkar"));
t("101:2:1", [stem("مَا", "noun", "ma-2")], { number: null, gender: null, definiteness: null, reference_class: "istifham", declension: "mabni" });
// 2:34
t("2:34:3", [P_JARR("لِ"), P_AL("ٱلْ"), stem("مَلَٰٓئِكَةِ", "noun", "malak-1")], { number: "jama", plural_type: "jama_taksir", gender: "muannath", definiteness: def("marifa", "bi_al") });
t("2:34:8", [stem("إِبْلِيسَ", "noun", "iblis-1")], N({ definiteness: def("marifa", "alam"), reference_class: "alam" }));
t("2:34:9", [stem("أَبَىٰ", "verb", "abaa-1")], V("maadi", 3, "mufrad", "mudhakkar"));
t("2:34:11", [P_ATF("وَ"), stem("كَانَ", "verb", "kaana-1")], V("maadi", 3, "mufrad", "mudhakkar"),
  [{ id: "b", segs: [P_ATF("وَ"), stem("كَانَ", "particle", null)], morph: { function_here: null }, label: "auxiliary particle, no lemma asserted" }]);
// 96:1, 8:17, 13:3, 2:87
t("96:1:1", [stem("ٱقْرَأْ", "verb", "qaraa-1")], V("amr", 2, "mufrad", "mudhakkar"));
t("96:1:2", [P_JARR("بِ"), stem("ٱسْمِ", "noun", "ism-1")], N({ definiteness: def("marifa", "idafa") }));
t("8:17:7", [stem("رَمَيْ", "verb", "rama-1"), enc("تَ", 2, "mufrad", "mudhakkar")], V("maadi", 2, "mufrad", "mudhakkar"));
t("8:17:12", [stem("رَمَىٰ", "verb", "rama-1")], V("maadi", 3, "mufrad", "mudhakkar"));
t("13:3:3", [stem("مَدَّ", "verb", "madda-1")], V("maadi", 3, "mufrad", "mudhakkar"));
t("2:87:11", [stem("ٱبْنَ", "noun", "ibn-1")], N({ definiteness: def("marifa", "idafa") }));
// homograph particles
t("2:23:1", [P_ATF("وَ"), stem("إِن", "particle", "in-1")], { function_here: "shart" });
t("6:29:2", [stem("إِنْ", "particle", "in-1")], { function_here: "nafy_simple" });
t("2:23:11", [stem("مِّن", "particle", "min-1")], { function_here: "jarr" });

// held: no active analysis while the conflict is open
const HELD = new Set(["112:4:4"]);

const mkCand = (tok, label, form, n) => ({
  analysis_id: `an-${tok.replace(/:/g, ".")}-${label}`, form_id: form.form_id, origin: "qurra_editorial", status: "provisional",
  source: { source_id: SRC, source_version: "stage-4-pilot", source_ref: null, raw_tags: [], external_ids: [] }, lemma_scope: "segment"
});
for (const x of T) {
  const aForm = makeForm(x.tok, x.segs, x.morph);
  const cands = [mkCand(x.tok, "a", aForm)];
  for (const alt of x.alts) {
    const c = mkCand(x.tok, alt.id, makeForm(x.tok, alt.segs, alt.morph)); c.note = alt.label; cands.push(c);
  }
  setsF.analysis_sets.push({ token_id: x.tok, chosen: HELD.has(x.tok) ? null : cands[0].analysis_id, candidates: cands });
}
formsF.forms.sort((a, b) => a.form_id.localeCompare(b.form_id));

/* ---------------- conflicts ---------------- */
const rv = (id, label, value) => ({ id, label, value });
const C = (conflict_id, type, subject, competing, status, decision, extra) => confF.conflicts.push(Object.assign({ conflict_id, type, subject, competing, decision, status }, extra || {}));
const none = { chosen: null, origin: "unresolved", rationale: "" };
C("cf-root-ism", "root", { lemma_ids: ["ism-1"] }, [rv("smw", "س م و", "س م و"), rv("wsm", "و س م", "و س م")], "disputed", none);
C("cf-root-allah", "root", { lemma_ids: ["allah-1"] }, [rv("alh", "ء ل ه", "ء ل ه"), rv("none", "no derivation (a proper name)", null)], "unresolved", none);
C("cf-root-ahad", "root", { lemma_ids: ["ahad-1"] }, [rv("ahd", "ء ح د", "ء ح د"), rv("whd", "و ح د", "و ح د")], "disputed", none);
C("cf-root-ibn", "root", { lemma_ids: ["ibn-1"] }, [rv("bnw", "ب ن و", "ب ن و"), rv("bny", "ب ن ي", "ب ن ي")], "disputed", none);
C("cf-root-iblis", "root", { lemma_ids: ["iblis-1"] }, [rv("bls", "ب ل س", "ب ل س"), rv("foreign", "a non-Arabic name (no root)", null)], "disputed", none);
C("cf-root-malak", "root", { lemma_ids: ["malak-1"] }, [rv("mlk", "م ل ك", "م ل ك"), rv("alk", "ء ل ك", "ء ل ك")], "disputed", none);
C("cf-root-rabb", "root", { lemma_ids: ["rabb-1"] }, [rv("rbb", "ر ب ب", "ر ب ب"), rv("rbw", "ر ب و", "ر ب و")], "provisional",
  { chosen: "rbb", origin: "qurra_editorial", rationale: "Class-B variation. The Stage 1 placeholder ر ب ب is kept provisionally and ر ب و is recorded as the alternative; evidence from at least two classical lexica is still required under the protocol." });
C("cf-root-waswas", "root", { lemma_ids: ["waswas-1", "waswasa-1"] }, [rv("wswsw", "و س و س (four-letter)", "و س و س"), rv("wss", "و س س (doubled triliteral)", "و س س")], "disputed", none);
C("cf-root-zalzal", "root", { lemma_ids: ["zalzala-1", "zilzal-1"] }, [rv("zlzl", "ز ل ز ل (four-letter)", "ز ل ز ل"), rv("zll", "ز ل ل (doubled triliteral)", "ز ل ل")], "disputed", none);
C("cf-root-damdam", "root", { lemma_ids: ["damdama-1"] }, [rv("dmdm", "د م د م (four-letter)", "د م د م"), rv("dmm", "د م م (doubled triliteral)", "د م م")], "disputed", none);
C("cf-lemma-ilah", "lemma", { token_id: "2:255:3" },
  [{ id: "ilah", label: "lemma إِلَٰه (ilah-1)", analysis_id: "an-2.255.3-a" }, { id: "allah", label: "lemma اللَّه (allah-1)", analysis_id: "an-2.255.3-b" }], "provisional",
  { chosen: "ilah", origin: "qurra_editorial", rationale: "Here the word is indefinite, in the negation 'no god', so it is treated as a different lemma from the proper name; the alternative is kept visible." });
C("cf-lemma-kufu", "lemma", { token_id: "112:4:4" },
  [{ id: "kufu1", label: "lemma كُفُو (kufu-1)", analysis_id: "an-112.4.4-a" }, { id: "kufu2", label: "lemma كُفُؤ (kufu-2)", analysis_id: "an-112.4.4-b" }], "unresolved", none);
C("cf-pos-kaana", "pos", { token_id: "2:34:11" },
  [{ id: "verb", label: "verb with a lemma (kaana-1)", analysis_id: "an-2.34.11-a" }, { id: "aux", label: "auxiliary particle, no lemma asserted", analysis_id: "an-2.34.11-b" }], "provisional",
  { chosen: "verb", origin: "qurra_editorial", rationale: "Traditional grammar treats كان as a verb that inflects for person, number and gender; the particle reading is kept as an alternative." });
C("cf-feature-ma", "feature", { token_id: "111:2:1" },
  [{ id: "nafy", label: "negation (particle ma-1)", analysis_id: "an-111.2.1-a" }, { id: "istifham", label: "interrogative noun (ma-2)", analysis_id: "an-111.2.1-b" }], "provisional",
  { chosen: "nafy", origin: "qurra_editorial", rationale: "The negative reading is the common one for 'ma aghna...'; the interrogative reading is recorded as an alternative and not excluded." });
C("cf-seg-iyyaka", "segmentation", { token_id: "1:5:1" },
  [{ id: "split", label: "stem إِيَّا + enclitic pronoun كَ (as in the Stage 1 pilot)" }, { id: "single", label: "one unit إِيَّاكَ" }], "provisional",
  { chosen: "split", origin: "qurra_editorial", rationale: "Kept as segmented in the Stage 1 pilot; grammarians differ on whether the kaf is a pronoun, so the single-unit analysis is recorded as an alternative." });

wr("data/qurra/forms.json", formsF); wr("data/qurra/lemmas.json", lemmasF); wr("data/qurra/glosses.json", glossF);
wr("data/qurra/roots.json", rootsF); wr("data/qurra/analyses.json", Object.assign({}, setsF, { analysis_sets: setsF.analysis_sets }));
wr("data/qurra/conflicts.json", confF);
const nAn = setsF.analysis_sets.reduce((n, s) => n + s.candidates.length, 0);
console.log(`tokens=${T.length} analyses=${nAn} lemmas=${L.length} new roots=${newRoots.length} conflicts=${confF.conflicts.length}`);
