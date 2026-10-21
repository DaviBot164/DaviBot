// Conservative phrase recognition: never replace pieces inside other words.
const { normalize } = require('./aliases');
const conversation = require('../../config/akaneConversation');
const { aliases } = require('./aliases');
const known = new Map(aliases);
for (const [category, phrases] of Object.entries(conversation.aliases)) {
    for (const phrase of phrases) known.set(normalize(phrase), category);
}
const expansions = new Map(Object.entries({
    idk: 'i do not know', idc: 'i do not care', tbh: 'to be honest',
    ngl: 'not going to lie', rn: 'right now', atm: 'at the moment',
    pls: 'please', plz: 'please', bc: 'because', cuz: 'because',
    u: 'you', ur: 'your', im: 'i am', "i'm": 'i am',
    "you're": 'you are', "don't": 'do not', dont: 'do not',
    "can't": 'cannot', cant: 'cannot', r: 'are',
    wyd: 'what are you doing', hru: 'how are you',
    wdym: 'what do you mean', wym: 'what do you mean', wsym: 'what do you mean'
}));
function canonical(value) {
    return normalize(value).replace(/[\p{L}\p{N}]+(?:'[\p{L}]+)?/gu,
        token => expansions.get(token) ?? token);
}
const canonicalKnown = new Map();
for (const [phrase, category] of known) canonicalKnown.set(canonical(phrase), category);
canonicalKnown.set('i do not know', 'uncertain');
canonicalKnown.set('what are you doing', 'curious');
canonicalKnown.set('i do not care', 'disagree');
function recognize(value) {
    let text = normalize(value);
    if (known.has(text)) return known.get(text);
    text = canonical(text);
    // Discourse markers change delivery, not the subject of the sentence.
    text = text.replace(/^(?:(?:to be honest|not going to lie|honestly|well|okay|ok)[,\s]+)+/u, '')
        .replace(/(?:[,\s]+(?:please|right now|at the moment|though|honestly))+$/u, '')
        .replace(/[!?.,…:;]+$/u, '').trim();
    return canonicalKnown.get(text) ?? null;
}
module.exports = { recognize, canonical };
