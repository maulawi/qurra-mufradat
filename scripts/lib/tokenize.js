"use strict";
/* The ONE definition of the token layer.

   A token is one whitespace-delimited written word of an ayah's canonical text.
     token_id = "<surah>:<ayah>:<position>"   (position counts from 1)
     text     = the n-th word, verbatim (never a normalised form)
   This is deterministic: the same ayah text always yields the same tokens and ids.
   Tokens exist for every word of the Qur'an; only the analysed ones have a Form.
   Surface text is never an identity: two tokens with the same text are different
   tokens, and may have different Forms.

   Which Form a token has comes from exactly ONE of two places:
     - data/qurra/token-forms.json   (a single, direct assignment), or
     - data/qurra/analyses.json      (an analysis set: several candidate analyses and an
                                      explicit `chosen` pointer; a null `chosen` means the
                                      token deliberately has no active analysis yet).
   A token present in both is a validation error. `effectiveTokenForms` merges the two. */

const tokenizeText = text => text.split(" ");

/** The Token -> Form assignments in force: direct assignments plus the `chosen` candidate of every analysis set. */
function effectiveTokenForms(tokenForms, analysisSets) {
  const out = (tokenForms || []).map(t => ({ ...t }));
  const direct = new Set(out.map(t => t.token_id));
  for (const set of analysisSets || []) {
    if (!set || !set.chosen || direct.has(set.token_id)) continue;     // a duplicate is reported by the validator
    const cand = (set.candidates || []).find(c => c.analysis_id === set.chosen);
    if (!cand) continue;                                                // reported by the validator
    out.push({
      token_id: set.token_id, form_id: cand.form_id, status: cand.status,
      provenance: { form: { source_id: cand.source && cand.source.source_id } },
      analysis_id: cand.analysis_id
    });
  }
  return out;
}

function materializeTokens(ayahs, tokenForms, analysisSets) {
  const forms = new Map(effectiveTokenForms(tokenForms, analysisSets).map(t => [t.token_id, t]));
  const out = [];
  for (const a of ayahs) {
    tokenizeText(a.text).forEach((word, i) => {
      const id = `${a.ayah_id}:${i + 1}`;
      const tf = forms.get(id);
      out.push({
        token_id: id, ayah_id: a.ayah_id, position: i + 1, text: word,
        form_id: tf ? tf.form_id : null,
        status: tf ? tf.status : "imported",
        provenance: tf ? { text: a.provenance.text, form: tf.provenance.form } : { text: a.provenance.text }
      });
    });
  }
  return out;
}

module.exports = { tokenizeText, materializeTokens, effectiveTokenForms };
