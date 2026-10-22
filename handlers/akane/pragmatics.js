const { expandAbuse } = require('./chatAbuse');
const vocabulary = require('../../config/akaneSocialVocabulary');
const escape = text => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const negative = vocabulary.negative.map(escape).join('|');
const emphasis = '(?:(?:so|really|very|fucking|damn|just|such|a|an|quite|extremely) )*';
const names = '(?:davi|daviti|david)';
const result=(category,scope)=>({category,scope});

function report(text) {
 const clean=expandAbuse(text.replace(/["“”]/gu,'').replace(/\s+/gu,' ').trim());
 const source='(?:someone|somebody|my friend|my teammate|he|she|they)';
 if(new RegExp(`^${source} (?:called|calls) you ${emphasis}(?:${negative}) (?:but )?i (?:did not|never did)$`,'u').test(clean))return result('reported_distance','reported');
 const disagreement='(?:but i (?:disagree|do not agree|do not think so))';
 const opinion='(?:what do you think(?: about that)?|do you agree|is that fair)';
 const attack=`(?:you (?:are )?${emphasis}(?:${negative})|you (?:suck|are useless)|(?:fuck|screw) you|shut (?:the fuck )?up)`;
 if(new RegExp(`^${source} (?:said|says|called|calls|told me) (?:that )?${attack} ${disagreement}$`,'u').test(clean))return result('reported_disagreement','reported');
 if(new RegExp(`^${source} (?:told|tells) ${names} to (?:shut (?:the fuck )?up|fuck off|go away) ${opinion}$`,'u').test(clean))return result('reported_davi_quote','reported');
 const daviAttack=`(?:(?:fuck|screw) ${names}|${names} (?:is )?${emphasis}(?:${negative}))`;
 if(new RegExp(`^${source} (?:said|says|called|calls|told me) (?:that )?${daviAttack} (?:${disagreement}|${opinion})$`,'u').test(clean))return result('reported_davi_quote','reported');
 if(new RegExp(`^${source} (?:said|says|called|calls|told me) (?:that )?${attack} ${opinion}$`,'u').test(clean))return result('reported_insult_question','reported');
 return null;
}

function correction(text) {
 if(new RegExp('^(?:i am )?not (?:calling|saying) you (?:are )?'+emphasis+'(?:'+negative+') (?:but |and )?i (?:just )?(?:did not|do not|could not) (?:get|understand|follow) (?:the|your|that) (?:explanation|answer|reply|response)$','u').test(text))return result('answer_confusing','answer');
 if(new RegExp(`^(?:i am )?not (?:saying|calling) you (?:are )?${emphasis}(?:${negative}) (?:but |and )?(?:just )?(?:explain (?:it|that)(?: properly|clearly)?|make (?:it|that) clearer)$`,'u').test(text))return result('simplify','answer');
 const denial=`you (?:are )?not ${emphasis}(?:${negative})`;
 const criticism='(?:your|that|the) (?:answer|reply|response) (?:(?:just |really )?(?:made|makes) no sense|(?:was|is) (?:(?:just|really|so) )?(?:confusing|unclear|hard to follow))';
 if(new RegExp(`^(?:${denial} (?:but |and )?${criticism}|${criticism} (?:but |and )?${denial})$`,'u').test(text))return result('answer_confusing','answer');

 if(new RegExp(`^your (?:answer|reply|response) (?:was|is) ${emphasis}(?:${negative}) (?:i )?did not (?:say|mean) you (?:were|are)$`,'u').test(text))return result('answer_feedback','answer');
 if(new RegExp(`^your (?:answer|reply|response) (?:was|is) not ${emphasis}(?:${negative}) (?:it (?:was|is) )?(?:just|only) (?:confusing|unclear|hard to follow)$`,'u').test(text))return result('answer_confusing','answer');
 if(new RegExp(`^(?:${negative}) (?:is|was) (?:not|never) what i (?:called|call) you$`,'u').test(text))return result('disavow_insult','correction');
 if(new RegExp(`^i (?:said|meant|called) your (?:answer|reply|response) (?:was |is )?${emphasis}(?:${negative}) (?:and )?not you$`,'u').test(text))return result('answer_feedback','answer');
 if(/^(?:i did not mean to (?:sound|be|come across as) rude|mean to (?:sound|be|come across as) rude i did not)$/u.test(text))return result('intent_clear','correction');
 return null;
}

function moodFragment(text) {
 const m=text.match(/^(tired|sad|happy|angry|bored|sleepy) (?:is (?:what i am|how i feel)|i am)(?: (?:but |and )?not (tired|sad|happy|angry|bored|sleepy))?$/u);
 if(m && m[1]!==m[2])return result(({tired:'tired',sleepy:'tired',sad:'feeling_bad',angry:'feeling_bad',happy:'feeling_good',bored:'bored'})[m[1]],'self');
 if(/^(?:(?:i am|i feel|i am feeling) )?(?:(?:kind of|sort of|really|very|so|a bit|a little) )*(?:mentally (?:tired|exhausted|drained)|(?:tired|exhausted|drained) mentally)$/u.test(text))return result('mental_tired','self');
 if(/^(?:i (?:do not|do not really|really do not|cannot) know|i am not sure|not sure) how (?:else )?to (?:put|phrase|explain|describe) (?:it|this|that)(?: into words)?$/u.test(text))return result('expression_uncertain','self');
 return null;
}

function evaluation(text) {
 if(/^your (?:answers|replies|responses) are (?:just |such )?(?:a joke|trash|useless|garbage)$/u.test(text))return result('reaction_insult','addressee');
 if(/^(?:your|that|the) (?:answer|reply|response) (?:was|is) (?:(?:really|very|so|just) )?(?:confusing|unclear|hard to follow)$/u.test(text))return result('answer_confusing','answer');
 if(/^(?:your|that|the) (?:answer|reply|response) (?:made|makes) no sense$/u.test(text))return result('answer_confusing','answer');
 if(/^(?:wow |oh )?(?:so |very )?(?:helpful|useful|brilliant) (?:totally |really )?answered my (?:question|request)$/u.test(text))return result('ambiguous_praise','ambiguous');
 if(/^(?:i (?:was|am) being sarcastic|i (?:was|am) sarcastic|that was sarcasm)(?: (?:by the way|though))?$/u.test(text))return result('sarcasm_clear','correction');
 if(/^(?:(?:wow|oh great|oh good) )?(?:another |yet another )?(?:nice|great|brilliant|amazing|wonderful|genius) (?:answer|reply|response) (?:did|do) you even (?:read|understand)(?: (?:it|that|(?:my|the) (?:question|message|request)))?$/u.test(text))return result('answer_feedback','answer');

 if(/^(?:nice|great|brilliant|lovely) (?:answer|reply|response) (?:did|do) you even (?:read(?: (?:it|that|the question))?|look at (?:it|the question))$/u.test(text))return result('answer_feedback','answer');
 if(/^(?:wow )?you are (?:a )?(?:genius|so clever|so smart|brilliant) (?:are not you|are you)$/u.test(text))return result('ambiguous_tease','ambiguous');
 if(new RegExp(`^are you ${emphasis}(?:actually |always )?(?:this |so )?(?:${negative}) or (?:(?:are you )?(?:just |only )?(?:pretending|acting|joking|messing with me)|what)$`,'u').test(text))return result('reaction_insult','addressee');
 if(/^(?:a|one) (?:useful|sensible|coherent|decent) (?:answer|reply|response) (?:can|could) you (?:manage|give|produce) (?:that|one)(?: for once)?$/u.test(text))return result('sarcastic_challenge','answer');
 if(new RegExp(`^(?:(?:wow|great|nice|oh good) )?(?:another|yet another) ${emphasis}(?:${negative}) (?:answer|reply|response)(?: (?:impressive|amazing|brilliant|well done))?$`,'u').test(text))return result('answer_feedback','answer');
 if(/^you are not as (?:clever|smart|bright|helpful|useful|funny) as you think(?: you are)?$/u.test(text))return result('sarcastic_challenge','addressee');
 if(new RegExp(`^${names} (?:what ${emphasis}|you ${emphasis})(?:${negative})$`,'u').test(text))return result('reaction_davi_insult','davi');
 if(new RegExp(`^(?:your (?:precious|beloved|favorite|favourite) )?${names} (?:cannot|can never) do (?:anything|a thing) right$`,'u').test(text))return result('reaction_davi_insult','davi');
 return null;
}

function analyzePragmatics(text,raw=text,ownerId='1357721282061533311') {
 text=text.replace(new RegExp(`<@\\s*!?\\s*${escape(ownerId)}>`, 'gu'),'davi');
 const reported=report(text);if(reported)return reported;
 // A bare quote/report is not attributed to the current speaker.
 if(/["“”]/u.test(raw))return null;
 const corrected=correction(text);if(corrected)return corrected;
 if(/\b(?:said|says|told|called|quoted|quote)\b/u.test(text))return null;
 return moodFragment(text)??evaluation(text);
}
module.exports={analyzePragmatics};
