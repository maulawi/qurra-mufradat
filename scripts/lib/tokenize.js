"use strict";
/* The ONE definition of the token layer.

   A token is one whitespace-delimited written word of an ayah's canonical text.
     token_id = "<surah>:<ayah>:<position>"   (position counts from 1)
     text     = the n-th word, verbatim (never a normalised form)
   This is deterministic: the same ayah text always yields the same tokens and ids.
   Tokens exist for every word of the Qur'an; only the analysed ones have a Form
   (data/qurra/token-forms.json). Surface text is never an identity: two tokens with
   the same text are different tokens, and may have different Forms. */

const tokenizeText = text => text.split(" ");

function materializeTokens(ayahs, tokenForms) {
  const forms = new Map((tokenForms || []).map(t => [t.token_id, t]));
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

module.exports = { tokenizeText, materializeTokens };
