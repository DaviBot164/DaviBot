// Bounded structural rewrites for existing intents, not fuzzy keyword scoring.
const vocabulary = require('../../config/akaneSocialVocabulary');
const escape = word => word.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
const moods = ['tired','sleepy','exhausted','drained','worn out','sad','upset','happy','calm','fine','okay','stressed','overwhelmed','lonely','bored','hungry'];
const descriptors = [...new Set([...moods,...vocabulary.positive,...vocabulary.negative,'rude','mean'])].map(escape).join('|');
const mood = moods.map(escape).join('|');
function meaningVariants(text, raw=text) {
    if (text.length>1000 || /["“”]/u.test(raw) || /\b(?:said|says|told|called|quoted|quote)\b/u.test(text)) return [];
    let next=text.replace(/^(?:(?:um|uh|erm|hmm|basically) )+/u,'');
    next=next.replace(/\b(?:exhuasted|exausted)\b/gu,'exhausted').replace(/\b(?:overwelmed|overwhelmd)\b/gu,'overwhelmed');
    next=next.replace(new RegExp(`^(?:you r|your) (?=(?:being )?(?:(?:so|really|very|fucking|totally|completely|just|not|a|an) )*(?:${descriptors})(?: |$))`,'u'),'you are ');
    next=next.replace(new RegExp(`^r you (?=(?:(?:so|really|very|a|an) )*(?:${descriptors})(?: |$))`,'u'),'are you ');
    next=next.replace(new RegExp(`^you are being (?=(?:(?:so|really|very|fucking) )*(?:${descriptors})$)`,'u'),'you are ');
    // Modifiers attach only to a known predicate. Never drop "not", a subject or a clause.
    const subject='(?:i am(?: feeling)?|i feel|feeling|you are|you look|you sound|(?:your|that|the) (?:answer|reply|response) (?:is|was))';
    next=next.replace(new RegExp(`^(${subject} )(?:(?:totally|completely|absolutely|pretty damn|so damn|really freaking|freaking|frickin|super) )+(?=(?:${descriptors})(?: |$))`,'u'),'$1really ');
    next=next.replace(new RegExp(`^((?:i am(?: feeling)?|i feel|feeling) (?:(?:really|so|very) )?(?:${mood})) (?:af|as fuck|as hell)$`,'u'),'$1');
    next=next.replace(new RegExp(`^(?:feel|am feeling) (?=(?:mentally )?(?:(?:really|so|very) )*(?:${mood})$)`,'u'),'i feel ');
    if(new RegExp(`^(?:(?:really|very|so|kind of|a little) )*(?:${mood})(?: (?:af|as fuck|as hell))?$`,'u').test(next))next='i am '+next.replace(/ (?:af|as fuck|as hell)$/u,'');
    const inverted=next.match(new RegExp(`^(${mood}) is (?:how i feel|what i am)$`,'u'));
    if(inverted)next='i feel '+inverted[1];
    if(/^i (?:just |only )?(?:want|need|would like) (?:(?:some|a little) )?(?:company|a listening ear|someone to talk to)$/u.test(next))next='i just want someone to listen';
    if(/^(?:i am )?not (?:after|looking for|asking for) (?:a fix|an answer|any fixes|a solution|solutions|advice) (?:but )?(?:just|only) (?:some )?(?:company|a listening ear|someone to listen)$/u.test(next))next='not asking for a solution just some company';
    if(/^i do not (?:want|need) you to (?:fix|solve) (?:it|this|that|anything) (?:but |and )?(?:just |only )?(?:listen|hear me out)$/u.test(next))next='do not try to fix it just hear me out';
    next=next.replace(/^(?:would it be possible for you to|any chance you could|can you just|could you just) (?=(?:explain|tell|give|help|make|pick|choose|say|be|talk|chat)\b)/u,'can you ');
    const polite=next.match(/^would you mind (explaining|telling|giving|helping) (.+)$/u);
    if(polite)next=({explaining:'explain',telling:'tell',giving:'give',helping:'help'})[polite[1]]+' '+polite[2];
    return next!==text ? [next] : [];
}
const moodCategories = new Set(['tired','mental_tired','feeling_bad','feeling_good','feeling_neutral','lonely','bored']);
function compoundMeaning(text, raw, lookup) {
    if (text.length>1000 || /["“”]/u.test(raw) || /\b(?:said|says|told|called|quoted|quote)\b/u.test(text)) return null;
    const clauses=text.split(/\s+(?:but|and)\s+/u);
    if(clauses.length!==2)return null;
    const meanings=clauses.map(clause=>{
        const direct=lookup(clause);
        if(direct)return direct;
        const variants=meaningVariants(clause,clause);
        return variants.length ? lookup(variants[0]) : null;
    });
    const moodIndex=meanings.findIndex(category=>moodCategories.has(category));
    if(moodIndex<0 || meanings[1-moodIndex]!=='decline_advice')return null;
    return {category:meanings[moodIndex],declineAdvice:true};
}
module.exports={meaningVariants,compoundMeaning};
