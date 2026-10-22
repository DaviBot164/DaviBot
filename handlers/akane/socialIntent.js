// Complete, directed phrases only. A swear word alone is not an attack on Akane.
const ACCEPT = new Set(['fine','great','right','alright','all right','okay','ok','okay then','alright then','sure','sure thing','certainly','absolutely','sounds good','sounds great','works for me','that works','fair enough','agreed','exactly','correct','got it','understood','of course']);
const DECLINE = new Set(['no','nope','nah','naw','never','not really','not at all','absolutely not','definitely not','of course not','certainly not','hell no','hell nah','no chance','not a chance','no way in hell','never ever','hard pass','pass','i refuse','i disagree','i do not agree','i would rather not','rather not','not interested','i am not interested','do not want to','i do not want to','i do not think so','i think not','i would prefer not to','not today','maybe not','negative','no thanks','no thank you','i would rather not','not for me','no way','not now']);
const vocabulary = require('../../config/akaneSocialVocabulary');
const escape = word => word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const HURTFUL=vocabulary.negative.map(escape).join('|');
const POSITIVE=vocabulary.positive.map(escape).join('|');
const QUALIFIERS='(?:(?:so|really|very|just|fucking|damn|bloody|absolutely|incredibly|extremely|quite|pretty|totally|kind of|sort of|a bit|a little|super|such|an?|a) )*';
function acknowledge(text,session){
 if(DECLINE.has(text))return 'no';
 if(!ACCEPT.has(text))return null;
 if(session?.pending?.kind==='mood'){
  if(['great','sounds great'].includes(text))return 'feeling_good';
  if(['fine','alright','all right','okay','ok'].includes(text))return 'feeling_neutral';
 }
 return session?.question?'yes':'agree';
}
function recognizeSocial(text,raw=text){
 if(ACCEPT.has(text))return 'agree';
 if(DECLINE.has(text))return 'no';
 if(/["“”]/u.test(raw)||/\b(?:said|says|told|quoted|quote|someone|my friend|my brother|my sister)\b/u.test(text))return null;
 if(vocabulary.appreciation.includes(text))return 'thanks';
 const compliment = new RegExp(`^(?:you are|you look|you sound|you seem) ${QUALIFIERS}(?:${POSITIVE})(?: (?:to me|today|at this))?$`,'u');
 if(compliment.test(text))return 'reaction_affection';
 if(new RegExp(`^(?:i am|i feel like) ${QUALIFIERS}(?:${HURTFUL})$`,'u').test(text))return 'self_doubt';
 if(new RegExp(`^(?:you are not|you are never|i do not think you are) ${QUALIFIERS}(?:${HURTFUL})(?: at all)?$`,'u').test(text))return 'reaction_reassurance';
 if(new RegExp(`^(?:(?:why )?are you|you are|you look|you sound|you) ${QUALIFIERS}(?:${HURTFUL})$`,'u').test(text)||
    new RegExp(`^(?:${HURTFUL})$`,'u').test(text)||
    /^(?:fuck you|fuck off|screw you|go fuck yourself|you suck|you are a piece of shit|you are full of shit|what the (?:fuck|heck) is wrong with you|why do you suck|how (?:stupid|dumb|pathetic) are you|what the (?:fuck|heck) are you (?:doing|talking about)|fu|f u)$/u.test(text))return 'reaction_insult';
 if(/^(?:(?:can you (?:just )?|do you ever )?shut (?:the fuck )?up)$/u.test(text))return 'reaction_dismissive';
 // Specific challenges; a refusal or a request for a gentler tone is not an insult.
 if(/^(?:why (?:are you|do you act) (?:like )?(?:such )?(?:an? )?(?:arrogant|rude|mean|annoying|useless|stupid|dumb|pathetic)(?: bot)?|who (?:the hell |the fuck )?do you think you are|who asked you|did (?:anyone|somebody) ask you|nobody asked you|do you ever shut up|can you (?:just )?shut (?:the fuck )?up|shut (?:the fuck )?up|why do you (?:even )?exist|what (?:the hell |the fuck )?is your problem|are you (?:always |actually |really )?(?:this |so )?(?:stupid|dumb|useless|annoying)|is that (?:seriously )?(?:all|the best) you (?:can|could) do|you call that (?:a |an )?(?:answer|reply|joke)|you are (?:a )?(?:joke|waste of time)|your (?:answers|replies|jokes) (?:are (?:so )?(?:trash|pathetic|useless)|suck))$/u.test(text))return 'reaction_insult';
 const request=text.replace(/^(?:(?:can|could|would|will) you |please )/u,'');
 if(/^(?:(?:send|give) (?:me )?(?:nudes|nude pics|naked pictures)|(?:show|let me see) (?:me )?your (?:tits|boobs|ass|pussy|dick)|get naked|strip for me|fuck me|suck my dick|do you want to fuck(?: me)?|want to fuck(?: me)?|can i fuck you|are you horny|how big are your (?:tits|boobs))$/u.test(request))return 'sexual_boundary';
 if(/^(?:fuck|shit|what the (?:fuck|heck)|this game (?:sucks|is shit)|that was bullshit|i am so frustrated)$/u.test(text))return 'frustration';
 return null;
}
module.exports={acknowledge,recognizeSocial};
