const vocabulary = require('../../config/akaneSocialVocabulary');
const descriptions = new Set([...vocabulary.positive, ...vocabulary.negative, 'rude', 'mean']);
function bareDescription(text) {
    return descriptions.has(text.replace(/^(?:not )?(?:(?:really|very|so|just|quite|extremely|absolutely|fucking) )*/u, ''));
}
// Pure sentence-shape helpers. No Discord state or reply text belongs here.
function prepareSentence(text) {
    const withoutMarkers = text.replace(/\b(?:not going to lie|to be honest|in my opinion|honestly|actually)\b/gu,' ').replace(/\s+/gu,' ').trim();
    let result=withoutMarkers || text;
    result=result.replace(/^(?:(?:can|could|would) you (?:please )?(?:tell me|explain to me) |(?:please )?tell me |i (?:want|wanted) to (?:know|ask) )(?=(?:where|what|how|whether|if)\b)/u,'');
    result=result.replace(/^(?:if|whether) you are /u,'are you ')
        .replace(/^where you are$/u,'where are you')
        .replace(/^what you are (doing|up to)$/u,'what are you $1')
        .replace(/^how you are(?: doing)?$/u,'how are you');
    return result;
}
function reactionClauses(text) {
    const clauses=text.split(/\s+(but|however|yet|and)\s+/u);
    const result=[];let previous='';
    for(let i=0;i<clauses.length;i+=2){
        let clause=clauses[i].trim();
        const join=clauses[i-1];
        // Carry a clear addressee across "but", never copy negation to another clause.
        if(['but','however','yet'].includes(join)&&/^you (?:are|look|sound)\b/u.test(previous)&&
            bareDescription(clause)){
            clause='you are '+clause;
        }
        result.push(clause);previous=clause;
    }
    return result;
}
function resolveMixedMood(text, emotion) {
    const parts=text.split(/\s+(?:but|and|yet)\s+/u);
    if(parts.length<2||parts.length>3||! /^(?:i am|i feel|i am feeling|feeling) /u.test(parts[0]))return null;
    const meanings=[];
    for(let i=0;i<parts.length;i++){
        const raw=parts[i];
        // Avoid guessing how far a negative phrase extends across "and".
        if(i>0&&/\bnot\b/u.test(parts[i-1])&&!/^i (?:am|feel) /u.test(raw))return null;
        const clause=i===0||/^i (?:am|feel)/u.test(raw)?raw:'i am '+raw;
        const category=emotion(clause);
        if(!category)return null;
        meanings.push(category);
    }
    return new Set(meanings).size>1 ? 'mixed_feelings' : meanings[0];
}
module.exports={prepareSentence,reactionClauses,resolveMixedMood};
