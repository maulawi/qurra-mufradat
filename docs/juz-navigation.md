# Juz membership and navigation

## Data

`data/meta/juz.json` holds only the official **start position** of each of the 30 Juz (Tanzil metadata, unmodified). Everything else is derived, deterministically, at build time:

* the Juz of an ayah is the last Juz whose start is at or before it (`scripts/build-dataset.js`, `juz` field of every ayah in `js/generated/dataset.js`);
* a Juz's membership is therefore a partition of the 6,236 ayahs: each ayah is in exactly one Juz, none is missing;
* the ranges per surah are contiguous runs of ayahs of one Juz (`QMData.getJuz(n).ranges`), with first and last ayah and total ayah count.

Juz 1 is Al-Fatihah 1–7 and Al-Baqarah 1–141 (not the whole of Al-Baqarah).

## Pages

| Route | Shows |
|---|---|
| `#/juz/N` | the Juz's real boundaries and one card per surah range ("Al-Baqara · ayahs 1–141 — 141 of 286 ayahs") |
| `#/juz/N/surah/M` | only ayahs of that range, breadcrumb keeps the Juz |
| `#/juz/N/surah/M/ayah/K` | the same, scrolled to ayah K (an ayah outside the Juz range is reported, never silently shown) |
| `#/surah/M`, `#/surah/M/ayah/K`, `#/word/S:A:P` | unchanged |

## Tests

* `scripts/tests/test-juz.js` (in `npm test` and the build): 30 Juz, 6,236 ayahs each once, monotone membership, exact start of every Juz, known boundaries, contiguous per-surah ranges.
* `scripts/tests/browser/browser-juz-analysis.js` (needs a browser; see its header): all 30 Juz pages equal the official ranges, every ayah reachable through Juz pages, click a range, deep link, word panel, Bahasa Melayu, search, 360 px.
