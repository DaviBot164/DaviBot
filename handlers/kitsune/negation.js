const {wantsListening} = require('./sentenceForms');
const vocabulary = require('../../config/kitsuneSocialVocabulary');
const escape = text => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const negative = vocabulary.negative.map(escape).join('|');
// Bounded sentence forms: do not infer sentiment from a stray "not".
function recognizeNegation(text) {
 if(wantsListening(text))return 'decline_advice';
 if(/^(?:just )?(?:talk|chat) (?:to|with) me (?:and )?do not (?:give|offer) me (?:any )?advice$/u.test(text))return 'decline_advice';
 if(/^(?:neither|neither one|neither of them|none of those)(?: i (?:have )?changed my mind)?$/u.test(text))return 'choices_rejected';
 if (/^(?:please )?(?:do not|stop|quit) (?:be|being) (?:so |really |very )?(?:rude|mean|harsh)(?: (?:to|with) me)?(?: please)?$/u.test(text)) return 'tone_gentle';
 if (/^(?:i (?:do not|would not) want|i do not need|no|not looking for) (?:any |your |some )?(?:advice|tips|suggestions)(?: (?:right now|please))?$/u.test(text)) return 'decline_advice';
 if (/^(?:i am|i feel) (?:not (?:sad|upset|down|angry|stressed|anxious) (?:anymore|any more)|no longer (?:sad|upset|down|angry|stressed|anxious))$/u.test(text)) return 'mood_recovered';
 if (/^(?:i am|i feel) (?:not (?:happy|good|okay|ok) (?:anymore|any more)|no longer (?:happy|okay|ok))$/u.test(text)) return 'mood_lowered';
 if (/^(?:i am not|i do not feel) (?:angry|mad|upset)(?: (?:at|with) you)(?: (?:at all|anymore))?$/u.test(text)) return 'tension_clear';
 if (new RegExp(`^i (?:never|did not) (?:call(?:ed)? you|(?:say|said) you (?:were|are)) (?:(?:a|an|so|really|very|fucking) )*(?:${negative})$`,'u').test(text)) return 'disavow_insult';
 if (/^i (?:want to|would like to|would rather) (?:just )?(?:talk|chat)(?: (?:and )?not (?:play|game|play games))$/u.test(text) || /^i do not want to (?:play|game|play games) (?:i (?:want to|would rather) )?(?:talk|chat)(?: instead)?$/u.test(text)) return 'talk_choice';
 return null;
}
module.exports={recognizeNegation};
