const config = require('../../config/akaneLearning');
const {canonical} = require('./language');
// Canonical text only: never store message IDs, author IDs, attachments or transcripts.
function learningPhrase(value) {
    const raw=String(value??'').trim();
    if(raw.length<2 || raw.length>config.maxPhraseLength || !/^[a-z0-9 '\-!?.,;:()]+$/iu.test(raw))return null;
    if(/\d{8,}|[a-z0-9]{32,}/iu.test(raw))return null;
    const text=canonical(raw).replace(/[!?.,;:()]+/gu,' ').replace(/\s+/gu,' ').trim();
    return text.length>=2 && text.length<=config.maxPhraseLength && /[a-z]/u.test(text)?text:null;
}
module.exports={learningPhrase};
