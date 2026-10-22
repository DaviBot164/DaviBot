const {recognizeProvocation} = require('./provocation');
const {recognizeExplanationRepair} = require('./explanationRepair');
const {recognizeDayConversation} = require('./dayConversation');
const {requestForm,moodBoundary} = require('./sentenceForms');
const { analyzeChatAbuse, expandAbuse } = require('./chatAbuse');
const { analyzePragmatics } = require('./pragmatics');
const { surfaceEnglish, requestEnglish, recognizeUtterance } = require('./utterances');
const { recognizeNegation } = require('./negation');
const { recognizePractical } = require('../../config/akanePractical');
const { recognizeSocial, acknowledge } = require('./socialIntent');
const { prepareSentence, reactionClauses, resolveMixedMood } = require('./sentenceParser');
const { recognizeEveryday } = require('../../config/akaneEveryday');
const { normalize, aliases } = require('./aliases');
const conversation = require('../../config/akaneConversation');
const english = require('../../config/akaneEnglish');
const OWNER_ID='1357721282061533311';
const MAX_INPUT=2000;
const socialVocabulary = require('../../config/akaneSocialVocabulary');
function canonical(value) {
    return surfaceEnglish(expandAbuse(normalize(value).slice(0,MAX_INPUT))
        .replace(/\b(he+y+|hi+i+|helloo+|hii+)\b/gu,'hello')
        .replace(/\b(ple+a+se+|ple+ase+|plz+)\b/gu,'please')
        .replace(/\bso+r+y+\b/gu,'sorry')
        .replace(/[a-z0-9]+(?:'[a-z]+)?/gu,word=>english.slang[word]??word))
        .replace(new RegExp('\\bur\\s+(?=(?:(?:so|really|very|pretty|kind of|not|a|an|just|actually|incredibly|quite) )*(?:'+[...socialVocabulary.positive,...socialVocabulary.negative,'rude','mean','bot','robot'].join('|')+')\\b)','gu'),'you are ')
        .replace(/\bur (?=not as (?:clever|smart|bright|helpful|useful|funny) as )/gu,'you are ')
        .replace(/\bur\b/gu,'your')
        .replace(/\bso{3,}\b/gu,'so')
        .replace(/\bver{1,}y{2,}\b/gu,'very')
        .replace(/^you (?=(?:so |really |very |not )+(?:[a-z]+))/u,'you are ')
        .replace(/\s+/gu,' ').trim();
}
function tidy(value) {
    return canonical(value).replace(/[!?.,…:;]+/gu,' ').replace(/\s+/gu,' ').trim();
}
function stripMarkers(value) {
    return value.replace(/^(?:(?:to be honest|not going to lie|in my opinion|honestly|well|okay|ok|actually|by the way|for real|oh my god)[,\s]+)+/u,'')
        .replace(/^(?:hey|hello|yo)\s+(?=i |you |can |could |would |how |what |be |stop )/u,'')
        .replace(/(?:\s+(?:please|right now|at the moment|though|honestly|today|bro|dude|mate|for real|lol|lmao|haha|xd|not going to lie|to be honest|in my opinion|actually|by the way))+$/u,'').trim();
}
const known=new Map();
function add(category,phrase){
    if(!/[a-z]/iu.test(phrase)||/[^\x00-\x7f]/u.test(phrase))return;
    known.set(tidy(phrase),category==='affection'?'reaction_affection':category);
}
for(const [phrase,category]of aliases)add(category,phrase);
for(const [category,phrases]of Object.entries(conversation.aliases))for(const phrase of phrases)add(category,phrase);
for(const [category,phrases]of Object.entries(english.phrases))for(const phrase of phrases)add(category,phrase);
const intensifier='(?:(?:really|very|so|pretty|quite|super|extremely|a little|a bit|kind of|sort of|too|absolutely|just) )*';
function emotion(text) {
    // Present-tense self-reports only: not somebody else's mood or a past event.
    const transition=text.match(/^i was (?:sad|upset|happy|tired|angry|okay|fine|calm)(?: (?:earlier|before|yesterday))? but (?:now )?i am (.+?)(?: now)?$/u);
    if(transition)return emotion('i am '+transition[1]);
    const contrast=text.match(/^i am (tired|sleepy) but (?:i am )?not (?:tired|sleepy)$/u);
    if(contrast)return 'tired';
    const m=text.match(/^(?:i am(?: (?:(?:just|really) )?feeling)?|i (?:just |really )?feel|feeling) (.+)$/u);
    if(!m)return null;
    const detail=m[1].replace(/ (?:now|at the moment)$/u,'').split(/\s+(?:because|since|after)\s+/u)[0].replace(/^not (?:very|really|so) /u,'not ');
    const families=[
        ['feeling_bad','sad|upset|unhappy|down|miserable|stressed|anxious|frustrated|angry|overwhelmed|not happy|not okay|not ok|not good|not doing well'],
        ['tired','tired|sleepy|exhausted|drained|worn out|burnt out|burned out'],
        ['feeling_good','happy|good|great|amazing|fantastic|excited|doing well|doing great'],
        ['feeling_neutral','calm|relaxed|okay|ok|fine|alright|all right|not bad|not sad|not tired'],
        ['bored','bored|bored out of my mind'],['hungry','hungry|starving'],['lonely','lonely|alone']
    ];
    for(const [category,words]of families)if(new RegExp(`^${intensifier}(?:${words})$`,'u').test(detail))return category;
    return null;
}
function reaction(value) {
    const raw=String(value??'');
    const text=stripMarkers(tidy(raw.replace(new RegExp(`<@!?${OWNER_ID}>`,'gu'),' Davi ')));
    // Quoted or reported speech should not become a personal accusation.
    if(/["“”]/u.test(raw)||/\b(?:said|says|told|quoted|quote|someone|my friend|my brother|my sister)\b/u.test(text))return null;
    const negative=socialVocabulary.negative.join('|');
    const nice=socialVocabulary.positive.join('|');
    const clauses=reactionClauses(text);
    let best=null;let priority=0;
    const offer=(category,p)=>{if(p>priority){best=category;priority=p;}};
    for(let clause of clauses){
        clause=clause.replace(/ at all$/u,'').replace(/^(?:i think |i feel like |honestly |sorry )/u,'').replace(/^(?:can|could|would) you (?=be my )/u,'').trim();
        if(new RegExp(`^(?:you are not|you are never|i do not think you are) ${intensifier}(?:an? )?(?:${negative})$`,'u').test(clause)||/^i do not hate you$/u.test(clause))offer('reassurance',4);
        else if(new RegExp(`^(?:you are|you look|you sound|you) ${intensifier}(?:an? )?(?:${negative})$`,'u').test(clause)||/^(?:i hate you|you suck|trash bot|stupid bot)$/u.test(clause))offer('insult',10);
        if(new RegExp(`^(?:davi|daviti) (?:is |looks |sounds )?${intensifier}(?:an? )?(?:${negative})$`,'u').test(clause)||/^i hate davi$/u.test(clause))offer('davi_insult',11);
        else if(/^(?:(?:do you|you) (?:like|love|know|miss) (?:davi|daviti)|(?:tell me|what do you think) about (?:davi|daviti)|(?:davi|daviti)(?: is .+)?|i (?:like|love|miss) davi)$/u.test(clause))offer('davi',5);
        if(/^(?:who are you|what are you|what is your name|tell me about yourself)$/u.test(clause))offer('identity',7);
        if(/^(?:are you (?:angry|mad|upset)|why are you (?:angry|mad)|why so angry)$/u.test(clause))offer('anger',7);
        if(/^(?:you are (?:just |only )?a (?:bot|robot)|are you (?:a )?(?:bot|robot|real)|just a bot)$/u.test(clause))offer('bot',7);
        if(/^(?:your (?:answer|reply|response)|that) (?:was|is) (?:really |very |so )?(?:rude|mean|harsh)$/u.test(clause))offer('rude',9);
        if(new RegExp(`^(?:you are (?:being )?${intensifier}(?:rude|mean)|why are you ${intensifier}(?:rude|mean)|that was rude|be nicer)$`,'u').test(clause))offer('rude',9);
        if(/^(?:shut up|be quiet|go away|who asked)$/u.test(clause))offer('dismissive',8);
        if(/^(?:you are mine|you belong to me)$/u.test(clause))offer('possessive',8);
        if(/^(?:be my (?:gf|bf|girlfriend|boyfriend|wife|husband)|(?:will|would) you be my (?:girlfriend|boyfriend)|marry me|date me|are you single|do you love me|do you like me|do you have a (?:boyfriend|girlfriend))$/u.test(clause))offer('romance',6);
        if(new RegExp(`^(?:you are|you look|you sound) ${intensifier}(?:${nice})$`,'u').test(clause)||/^(?:i love you(?: too|so much)?|love you|good girl|kiss me)$/u.test(clause))offer('affection',6);
        if(/^(?:sorry|i am sorry|my bad|i apologize|my mistake)(?: for .+)?$/u.test(clause))offer('apology',2);
    }
    return best;
}
function extractChoice(value) {
    if(requestForm(prepareSentence(stripMarkers(tidy(value))))==='again')return null;
    const text=String(value??'').normalize('NFKC').trim();
    if (/^(?:choose|pick)(?: (?:again|another|once more)| a different one)$/iu.test(text)) return null;
    const undecided=prepareSentence(stripMarkers(tidy(text))).match(/^i (?:do not know|cannot decide|am not sure) (?:whether to|if i should|whether i should) (.{1,100}?) or (.{1,100})$/u);
    if(undecided && !undecided.slice(1).some(part=>/\b(?:and|or|but)\b/u.test(part))) return undecided.slice(1).join(' / ');
    const m=text.match(/^(?:(?:can|could|would)\s+(?:you|u)\s+)?(?:please\s+)?(?:pick|choose)(?:\s+(?:between|from))?\s+(.+)$/iu);
    return m?m[1].replace(/[?]+$/u,'').replace(/\s+(?:please|pls|plz)[.!?]*$/iu,'').trim():null;
}
function recognize(value) {
    const raw=String(value??'');if(raw.length>MAX_INPUT)return null;
    if(/[^\x00-\x7f]/u.test(raw)&&/[\p{L}]/u.test(raw.replace(/[a-z]/giu,'')))return null;
    if(/^(?:😂|🤣|😆)+$/u.test(raw.trim()))return 'laugh';
    if(/^(?:🙄|🤔|😭)+$/u.test(raw.trim()))return 'clarify';
    const normalized=tidy(raw);
    const provocation=recognizeProvocation(prepareSentence(stripMarkers(normalized)),raw);if(provocation)return provocation;
    const repair=recognizeExplanationRepair(prepareSentence(stripMarkers(normalized)));if(repair)return repair;
    const day=recognizeDayConversation(prepareSentence(stripMarkers(normalized)));if(day)return day;
    const compound=moodBoundary(prepareSentence(stripMarkers(normalized)));if(compound)return compound.category;
    const form=requestForm(prepareSentence(stripMarkers(normalized)));if(form)return form;
    const framed=analyzePragmatics(prepareSentence(stripMarkers(normalized)),raw,OWNER_ID);
    if(framed)return framed.category;
    const abuse=analyzeChatAbuse(prepareSentence(stripMarkers(normalized)),raw);
    if(abuse)return abuse.category;
    const acknowledgement=acknowledge(prepareSentence(normalized),null);
    if(acknowledgement) return acknowledgement;
    const utterance=recognizeUtterance(prepareSentence(normalized),raw,OWNER_ID) ?? recognizeUtterance(prepareSentence(stripMarkers(normalized)),raw,OWNER_ID);
    if(utterance)return utterance;
    const negativeIntent=recognizeNegation(prepareSentence(stripMarkers(normalized)));
    if(negativeIntent) return negativeIntent;
    const practical=recognizePractical(prepareSentence(normalized)) ?? recognizePractical(prepareSentence(stripMarkers(normalized)));
    if(practical) return practical;
    const directSocial=recognizeSocial(prepareSentence(normalized),raw);
    if(directSocial) return directSocial;
    const text=requestEnglish(prepareSentence(stripMarkers(normalized)));
    const social = recognizeSocial(text,raw); if(social) return social;
    // Negation and directed reactions take precedence over shallow keyword matches.
    if(/^(?:what do you think (?:of|about)|tell me about) mae$/u.test(text))return 'mae';
    if (/^(?:i (?:never|did not) (?:say|said|mean) (?:that|you (?:are|were) .+)|that is not what i said)$/u.test(text)) return 'repair';
    const found=reaction(raw);if(found)return found==='rude'?'rude':`reaction_${found}`;
    if (/^(?:(?:can|could|would) you (?:please )?)?(?:tell me (?:a |another )?(?:funny )?joke|give me a joke|say something funny|joke)$/u.test(text)) return 'joke';
    if (/^(?:(?:can|could|would) you (?:please )?)?(?:help me|give me some help|i need (?:some )?help|i need your help)$/u.test(text)) return 'help_offer';
    if (/^(?:what is your (?:favorite|favourite) (?:food|drink)|what do you like to (?:eat|drink)|do you (?:eat|drink|like food))$/u.test(text)) return 'food_preferences';
    if (['commands','server commands'].includes(text)) return 'help';
    if (text==='why not') return 'why';
    if (text==='distraction') return 'bored';
    if (text==='quiet') return 'pause';
    const everyday = recognizeEveryday(text); if(everyday) return everyday;
    if(known.has(text))return known.get(text);
    if(known.has(normalized))return known.get(normalized);
    if(/^(?:am i (?:stupid|ugly|useless)|i hate myself|i am (?:so |really |such )?(?:an? )?(?:stupid|dumb|ugly|useless|a failure)|i feel (?:stupid|useless)|i suck)$/u.test(text))return 'self_doubt';
    const mood=emotion(text);if(mood)return mood;
    const mixed=resolveMixedMood(text,emotion);if(mixed)return mixed;
    if(/^(?:i (?:had|have) (?:a |such a )?(?:really |very )?(?:bad|rough|terrible|awful) day|my day (?:was|is) (?:bad|rough|terrible|awful))$/u.test(text))return 'feeling_bad';
    if(/^(?:i (?:had|have) (?:a )?(?:great|good|lovely|amazing) day|my day (?:was|is) (?:great|good|lovely|amazing))$/u.test(text))return 'feeling_good';
    const request=requestEnglish(text).replace(/^(?:(?:can|could|would) you (?:please )?|i (?:want|need) you to |i would like you to |please )/u,'');
    const requests=[
        ['nice',/^(?:give me (?:a |another )?compliment|compliment me|say something nice(?: to me)?|tell me something nice)$/u],
        ['roast',/^(?:roast me|tease me|give me (?:a |another )?roast|make fun of me)$/u],
        ['tip',/^(?:give me (?:some |a little |a piece of )?advice|give me a tip|help me decide|any advice)$/u],
        ['secret',/^(?:tell me (?:a |your )?(?:little )?secret|share a secret)$/u],
        ['rate',/^(?:rate me|give me a rating|give me a score)$/u],
        ['curious',/^(?:tell me something|talk to me|say something|what are you doing|what are you thinking about)$/u],
        ['bored',/^(?:distract me|entertain me|cheer me up|make me laugh)$/u],
        ['explain',/^(?:explain(?: that| it| your answer)?|tell me what you mean|say that again in simpler words)$/u],
        ['repair',/^(?:that is not what i (?:meant|asked)|you (?:misunderstood|missed my point)|i meant something else)$/u],
        ['tone_gentle',/^(?:do not (?:roast|tease|insult) me|do not be (?:mean|rude)|stop being (?:mean|rude)|be (?:a little |a bit )?(?:nicer|gentler|nice|gentle)|stop teasing(?: me)?|soften your tone)$/u],
        ['tone_serious',/^(?:be serious|stop joking|no jokes|answer seriously)$/u],
        ['topic_change',/^(?:change (?:the subject|topic)|talk about something else)$/u]
    ];
    for(const [category,pattern]of requests)if(pattern.test(request))return category;
    if(/^(?:ha){2,8}$|^(?:he){2,8}$|^l(?:o+l+)+$|^lmao+$|^lmfao+$|^rofl$|^xd+$/u.test(text))return 'laugh';
    return null;
}
function correctedChoice(value) {
 const text=prepareSentence(stripMarkers(tidy(value)));
 const match=text.match(/^i meant (.{1,100}?) (?:or|\/) (.{1,100})$/u);
 if(!match || match.slice(1).some(part=>/\b(?:or|and|but)\b/u.test(part)))return null;
 return match.slice(1).join(' / ');
}
function recognizeDetails(value) {
 const text=prepareSentence(stripMarkers(tidy(value)));
 const compound=String(value??'').length<=MAX_INPUT?moodBoundary(text):null;
 return compound??{category:recognize(value)};
}
module.exports={canonical,recognize,recognizeDetails,extractChoice,correctedChoice,detectEnglishReaction:reaction};
