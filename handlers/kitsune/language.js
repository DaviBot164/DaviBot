const {understandingResult} = require('./understandingResult');
const {meaningVariants,compoundMeaning} = require('./meaningVariants');
const {recognizeMemberBoundary} = require('./memberBoundaries');
const {recognizeProvocation} = require('./provocation');
const {recognizeExplanationRepair} = require('./explanationRepair');
const {recognizeDayConversation} = require('./dayConversation');
const {recognizeMusicConversation} = require('./musicConversation');
const {recognizeGameConversation} = require('./gameConversation');
const {requestForm,moodBoundary} = require('./sentenceForms');
const { analyzeChatAbuse, expandAbuse } = require('./chatAbuse');
const { analyzePragmatics } = require('./pragmatics');
const { surfaceEnglish, requestEnglish, recognizeUtterance } = require('./utterances');
const { recognizeNegation } = require('./negation');
const { recognizePractical } = require('../../config/kitsunePractical');
const { recognizeSocial, acknowledge } = require('./socialIntent');
const { prepareSentence, reactionClauses, resolveMixedMood } = require('./sentenceParser');
const { recognizeEveryday } = require('../../config/kitsuneEveryday');
const { normalize, aliases } = require('./aliases');
const conversation = require('../../config/kitsuneConversation');
const english = require('../../config/kitsuneEnglish');
const OWNER_ID='1357721282061533311';
const MAX_INPUT=2000;
const socialVocabulary = require('../../config/kitsuneSocialVocabulary');
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
function prepareInput(value) {
    const raw=String(value??'');
    const valid=raw.length<=MAX_INPUT && !/[\p{L}]/u.test(raw.replace(/[a-z]/giu,''));
    if(!valid)return Object.freeze({raw,valid:false,normalized:'',sentence:'',plainSentence:''});
    const normalized=tidy(raw);
    return Object.freeze({raw,valid:true,normalized,sentence:prepareSentence(stripMarkers(normalized)),plainSentence:prepareSentence(normalized)});
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
function extractChoice(value, suppliedFrame=null) {
    const raw=String(value??'');
    const frame=suppliedFrame?.raw===raw?suppliedFrame:prepareInput(raw);
    const sentence=frame.valid?frame.sentence:prepareSentence(stripMarkers(tidy(value)));
    if(requestForm(sentence)==='again')return null;
    const text=String(value??'').normalize('NFKC').trim();
    if (/^(?:choose|pick)(?: (?:again|another|once more)| a different one)$/iu.test(text)) return null;
    const undecided=sentence.match(/^i (?:do not know|cannot decide|am not sure) (?:whether to|if i should|whether i should) (.{1,100}?) or (.{1,100})$/u);
    if(undecided && !undecided.slice(1).some(part=>/\b(?:and|or|but)\b/u.test(part))) return undecided.slice(1).join(' / ');
    const m=text.match(/^(?:(?:can|could|would)\s+(?:you|u)\s+)?(?:please\s+)?(?:pick|choose)(?:\s+(?:between|from))?\s+(.+)$/iu);
    return m?m[1].replace(/[?]+$/u,'').replace(/\s+(?:please|pls|plz)[.!?]*$/iu,'').trim():null;
}
// Earlier entries have higher precedence. Normal recognition stops at the first.
function recognitionRules(frame) {
 const raw=frame.raw,text=frame.sentence,plain=frame.plainSentence;
 const requestText=requestEnglish(text);
 return [
  ['member_boundary',()=>recognizeMemberBoundary(text,raw)],
  ['provocation',()=>recognizeProvocation(text,raw)],
  ['explanation_repair',()=>recognizeExplanationRepair(text)],
  ['day_statement',()=>recognizeDayConversation(text)],
  ['music_statement',()=>recognizeMusicConversation(text)],
  ['game_statement',()=>recognizeGameConversation(text)],
  ['sentence_form',()=>requestForm(text)],
  ['pragmatics',()=>analyzePragmatics(text,raw,OWNER_ID)?.category],
  ['chat_abuse',()=>analyzeChatAbuse(text,raw)?.category],
  ['acknowledgement',()=>acknowledge(plain,null)],
  ['utterance',()=>recognizeUtterance(plain,raw,OWNER_ID)??(plain!==text?recognizeUtterance(text,raw,OWNER_ID):null)],
  ['negation',()=>recognizeNegation(text)],
  ['practical',()=>recognizePractical(plain)??(plain!==text?recognizePractical(text):null)],
  ['direct_social',()=>recognizeSocial(plain,raw)],
  ['request_social',()=>requestText!==plain?recognizeSocial(requestText,raw):null]
 ];
}
function recognizeCore(value, suppliedFrame=null, onMatch=null) {
    const raw=String(value??'');
    const frame=suppliedFrame?.raw===raw?suppliedFrame:prepareInput(raw);
    if(!frame.valid)return null;
    if(/^(?:😂|🤣|😆)+$/u.test(raw.trim()))return 'laugh';
    if(/^(?:🙄|🤔|😭)+$/u.test(raw.trim()))return 'clarify';
    const normalized=frame.normalized;
    const select=(rule,category)=>{if(onMatch)onMatch(rule,category);return category;};
    for(const [rule,run]of recognitionRules(frame)) {const category=run();if(category)return select(rule,category);}
    const text=requestEnglish(frame.sentence);
    // Negation and directed reactions take precedence over shallow keyword matches.
    if(/^(?:what do you think (?:of|about)|tell me about) mae$/u.test(text))return select('legacy.mae','mae');
    if (/^(?:i (?:never|did not) (?:say|said|mean) (?:that|you (?:are|were) .+)|that is not what i said)$/u.test(text)) return select('legacy.repair','repair');
    const found=reaction(raw);if(found)return select('direct_reaction',found==='rude'?'rude':`reaction_${found}`);
    if (/^(?:(?:can|could|would) you (?:please )?)?(?:tell me (?:a |another )?(?:funny )?joke|give me a joke|say something funny|joke)$/u.test(text)) return select('legacy.joke','joke');
    if (/^(?:(?:can|could|would) you (?:please )?)?(?:help me|give me some help|i need (?:some )?help|i need your help)$/u.test(text)) return select('legacy.help_offer','help_offer');
    if (/^(?:what is your (?:favorite|favourite) (?:food|drink)|what do you like to (?:eat|drink)|do you (?:eat|drink|like food))$/u.test(text)) return select('legacy.food_preferences','food_preferences');
    if (['commands','server commands'].includes(text)) return select('legacy.help','help');
    if (text==='why not') return select('legacy.why','why');
    if (text==='distraction') return select('legacy.bored','bored');
    if (text==='quiet') return select('legacy.pause','pause');
    const everyday = recognizeEveryday(text); if(everyday) return select('everyday',everyday);
    if(known.has(text))return select('known_alias',known.get(text));
    if(known.has(normalized))return select('known_alias',known.get(normalized));
    if(/^(?:am i (?:stupid|ugly|useless)|i hate myself|i am (?:so |really |such )?(?:an? )?(?:stupid|dumb|ugly|useless|a failure)|i feel (?:stupid|useless)|i suck)$/u.test(text))return select('legacy.self_doubt','self_doubt');
    const mood=emotion(text);if(mood)return select('self_state',mood);
    const mixed=resolveMixedMood(text,emotion);if(mixed)return select('mixed_state',mixed);
    if(/^(?:i (?:had|have) (?:a |such a )?(?:really |very )?(?:bad|rough|terrible|awful) day|my day (?:was|is) (?:bad|rough|terrible|awful))$/u.test(text))return select('legacy.feeling_bad','feeling_bad');
    if(/^(?:i (?:had|have) (?:a )?(?:great|good|lovely|amazing) day|my day (?:was|is) (?:great|good|lovely|amazing))$/u.test(text))return select('legacy.feeling_good','feeling_good');
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
    for(const [category,pattern]of requests)if(pattern.test(request))return select('request.'+category,category);
    if(/^(?:ha){2,8}$|^(?:he){2,8}$|^l(?:o+l+)+$|^lmao+$|^lmfao+$|^rofl$|^xd+$/u.test(text))return select('legacy.laugh','laugh');
    return null;
}
function correctedChoice(value, suppliedFrame=null) {
 const raw=String(value??'');
 const frame=suppliedFrame?.raw===raw?suppliedFrame:prepareInput(raw);
 const text=frame.valid?frame.sentence:prepareSentence(stripMarkers(tidy(value)));
 const match=text.match(/^i meant (.{1,100}?) (?:or|\/) (.{1,100})$/u);
 if(!match || match.slice(1).some(part=>/\b(?:or|and|but)\b/u.test(part)))return null;
 return match.slice(1).join(' / ');
}
function recognizeDetails(value, suppliedFrame=null) {
 const raw=String(value??'');
 const frame=suppliedFrame?.raw===raw?suppliedFrame:prepareInput(raw);
 const finish=(details,rule,source='rules')=>({...details,understanding:understandingResult(details.category,{...details,rule,source})});
 if(!frame.valid)return finish({category:null},'input.invalid','input');
 const compound=moodBoundary(frame.sentence);
 if(compound)return finish(compound,'mood_boundary');
 let selected='legacy';
 const direct=recognizeCore(raw,frame,rule=>{selected=rule;});
 if(direct)return finish({category:direct},selected);
 const composed=compoundMeaning(frame.sentence,raw,text=>recognizeCore(text));
 if(composed)return finish(composed,'compound.mood_and_listening','composition');
 for(const alternative of meaningVariants(frame.sentence,raw)) {
  const candidateFrame=prepareInput(alternative);
  const candidateCompound=moodBoundary(candidateFrame.sentence);
  if(candidateCompound)return finish(candidateCompound,'variant.mood_boundary','variant');
  const category=recognizeCore(alternative,candidateFrame,rule=>{selected=rule;});
  if(category)return finish({category},'variant.'+selected,'variant');
 }
 return finish({category:null},'unmatched','none');
}
function inspectUnderstanding(value){
 const frame=prepareInput(value),details=recognizeDetails(value,frame);
 const candidates=frame.valid?recognitionRules(frame).flatMap(([rule,run],priority)=>{const category=run();return category?[{rule,priority,category}]:[];}):[];
 return {prepared:{valid:frame.valid,normalized:frame.normalized,sentence:frame.sentence},...details,candidates,overlap:new Set(candidates.map(x=>x.category)).size>1};
}

function recognize(value) {return recognizeDetails(value).category;}

module.exports={canonical,prepareInput,recognize,recognizeDetails,inspectUnderstanding,extractChoice,correctedChoice,detectEnglishReaction:reaction};
