#!/usr/bin/env node
"use strict";
/* Juz membership: every ayah in exactly one of the 30 juz, with correct boundaries, derived only from the official start positions. */
const fs = require("fs"), path = require("path"), vm = require("vm");
const ROOT = path.resolve(__dirname, "..", "..");
const ctx = {}; vm.runInNewContext(fs.readFileSync(path.join(ROOT, "js/generated/dataset.js"), "utf8") + "\nthis.D = QM_DATASET;", ctx);
const D = ctx.D;
let passed = 0, failed = 0;
const ok = (n, c, x) => { if (c) passed++; else { failed++; console.error("FAIL " + n + (x ? "  " + x : "")); } };

ok("30 juz", D.juz.length === 30);
ok("6,236 ayahs", D.ayahs.length === 6236);
ok("every ayah has exactly one juz in 1..30", D.ayahs.every(a => Number.isInteger(a.juz) && a.juz >= 1 && a.juz <= 30));
const counts = new Array(31).fill(0); D.ayahs.forEach(a => counts[a.juz]++);
ok("every juz is non-empty and the counts sum to 6,236", counts.slice(1).every(n => n > 0) && counts.reduce((x, y) => x + y, 0) === 6236);
// juz is monotone in Qur'an order (no ayah can be in two juz, none skipped)
let mono = true; for (let i = 1; i < D.ayahs.length; i++) if (D.ayahs[i].juz < D.ayahs[i - 1].juz || D.ayahs[i].juz > D.ayahs[i - 1].juz + 1) mono = false;
ok("juz numbers never go backwards or skip", mono);
// boundaries: the first ayah of juz n is its official start, and the previous ayah is in juz n-1
D.juz.forEach(j => {
  const i = D.ayahs.findIndex(a => a.surah === j.start.surah && a.ayah === j.start.ayah);
  ok(`juz ${j.juz} starts at ${j.start.surah}:${j.start.ayah}`, i >= 0 && D.ayahs[i].juz === j.juz && (i === 0 || D.ayahs[i - 1].juz === j.juz - 1));
});
const known = { 1: [1, 1, 2, 141], 2: [2, 142, 2, 252], 3: [2, 253, 3, 92], 15: [17, 1, 18, 74], 29: [67, 1, 77, 50], 30: [78, 1, 114, 6] };
for (const [n, [s1, a1, s2, a2]] of Object.entries(known)) {
  const list = D.ayahs.filter(a => a.juz === Number(n));
  const f = list[0], l = list[list.length - 1];
  ok(`juz ${n} runs ${s1}:${a1} to ${s2}:${a2}`, f.surah === s1 && f.ayah === a1 && l.surah === s2 && l.ayah === a2, `${f.surah}:${f.ayah}-${l.surah}:${l.ayah}`);
}
{
  const j1 = D.ayahs.filter(a => a.juz === 1), by = {}; j1.forEach(a => { (by[a.surah] = by[a.surah] || []).push(a.ayah); });
  ok("juz 1 = Al-Fatihah 1-7 and Al-Baqarah 1-141 (not the whole surah)", Object.keys(by).join() === "1,2" && by[1].length === 7 && by[2].length === 141 && by[2][140] === 141);
}
// ranges are contiguous per surah and add up
{
  let total = 0, good = true;
  for (let n = 1; n <= 30; n++) {
    const list = D.ayahs.filter(a => a.juz === n), bySur = new Map();
    list.forEach(a => { if (!bySur.has(a.surah)) bySur.set(a.surah, []); bySur.get(a.surah).push(a.ayah); });
    bySur.forEach(arr => { for (let i = 1; i < arr.length; i++) if (arr[i] !== arr[i - 1] + 1) good = false; });
    total += list.length;
  }
  ok("per-surah ranges are contiguous; total 6,236", good && total === 6236);
}
console.log(`test-juz: ${passed} passed, ${failed} failed`);
process.exit(failed ? 1 : 0);
