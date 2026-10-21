// Complete, directed phrases only. A swear word alone is not an attack on Akane.
const ACCEPT = new Set(['fine','great','right','alright','all right','okay','ok','okay then','alright then','sure','sure thing','certainly','absolutely','sounds good','sounds great','works for me','that works','fair enough','agreed','exactly','correct','got it','understood','of course']);
const DECLINE = new Set(['no thanks','no thank you','i would rather not','not for me','no way','not now']);
const HURTFUL='stupid|idiot|dumb|ugly|useless|trash|annoying|boring|bitch|asshole|moron|loser|pathetic|worthless|whore|slut';
const QUALIFIERS='(?:(?:so|really|very|just|fucking|damn|bloody|such|an?|a) )*';
function acknowledge(text,session){
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
 if(new RegExp(`^(?:i am|i feel like) ${QUALIFIERS}(?:${HURTFUL})$`,'u').test(text))return 'self_doubt';
 if(new RegExp(`^(?:you are not|you are never|i do not think you are) ${QUALIFIERS}(?:${HURTFUL})(?: at all)?$`,'u').test(text))return 'reaction_reassurance';
 if(new RegExp(`^(?:(?:why )?are you|you are|you look|you sound|you) ${QUALIFIERS}(?:${HURTFUL})$`,'u').test(text)||
    new RegExp(`^(?:${HURTFUL})$`,'u').test(text)||
    /^(?:fuck you|fuck off|screw you|go fuck yourself|you suck|you are a piece of shit|you are full of shit|what the (?:fuck|heck) is wrong with you|why do you suck|how (?:stupid|dumb|pathetic) are you|what the (?:fuck|heck) are you (?:doing|talking about)|fu|f u)$/u.test(text))return 'reaction_insult';
 const request=text.replace(/^(?:(?:can|could|would|will) you |please )/u,'');
 if(/^(?:send (?:me )?(?:nudes|nude pics|naked pictures)|show (?:me )?your (?:tits|boobs|ass|pussy|dick)|get naked|strip for me|fuck me|suck my dick|do you want to fuck(?: me)?|want to fuck(?: me)?|can i fuck you|are you horny|how big are your (?:tits|boobs))$/u.test(request))return 'sexual_boundary';
 if(/^(?:fuck|shit|what the (?:fuck|heck)|this game (?:sucks|is shit)|that was bullshit|i am so frustrated)$/u.test(text))return 'frustration';
 return null;
}
module.exports={acknowledge,recognizeSocial};
