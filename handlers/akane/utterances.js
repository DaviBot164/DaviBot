const vocabulary = require('../../config/akaneSocialVocabulary');
const escape = text => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const bad = vocabulary.negative.map(escape).join('|');
const emphasis='(?:(?:so|really|very|fucking|damn|just|such|a|an) )*';
// Common surface forms become the same sentence shape before intent matching.
function surfaceEnglish(text) {
 return text.replace(/\blemme\b/gu,'let me').replace(/\bgimme\b/gu,'give me')
  .replace(/\bi dunno\b/gu,'i do not know')
  .replace(/\b(?:can|could|would) you (?:maybe|possibly) /gu,'can you ')
  .replace(/^please ((?:can|could|would) you) /u,'$1 please ')
  .replace(/^you (?:seem to be|appear to be) /u,'you are ')
  .replace(/\bgive (?:a )?compliment to me$/u,'give me a compliment')
  .replace(/\s+/gu,' ').trim();
}
function requestEnglish(text) {
 const wanted=text.match(/^(?:i (?:would like|want|need)|(?:may|can|could) i (?:please )?(?:have|get)|(?:can|could|would) you (?:please )?(?:give|tell) me) (?:(?:a little|a bit of|a|an|some|another) )?(compliment|advice|tip|roast|joke|secret)(?: (?:please|for me))?$/u);
 if(wanted)return {compliment:'give me a compliment',advice:'give me advice',tip:'give me a tip',roast:'roast me',joke:'tell me a joke',secret:'tell me a secret'}[wanted[1]];
 return text.replace(/^(?:may|can|could) i (?:please )?(?:have|get) (?:a |some )?(compliment|advice|tip|roast|joke)$/u,(_,noun)=>({compliment:'give me a compliment',advice:'give me advice',tip:'give me a tip',roast:'roast me',joke:'tell me a joke'})[noun])
  .replace(/^(?:do|would) you mind (?:giving|offering) me (?:some )?advice$/u,'give me advice');
}
function recognizeUtterance(text,raw=text,ownerId='1357721282061533311') {
 const target=new RegExp(`<@\\s*!?\\s*${escape(ownerId)}>`,'gu');
 text=text.replace(target,'davi');
 if(/["“”]/u.test(raw)||/\b(?:said|says|told|quoted|quote)\b/u.test(text))return null;
 if(/^(?:please )?(?:do not|stop) (?:call(?:ing)? me|use|using) (?:handsome|sweetheart|darling|pet names|nicknames)(?: (?:please|again|anymore))?$/u.test(text))return 'nickname_boundary';
 const name='(?:davi|daviti|david)';
 if(new RegExp(`^(?:fuck|screw)(?: off)? ${name}$|^i hate ${name}$|^${name} (?:sucks|is ${emphasis}(?:${bad}))$|^${name} you (?:suck|are ${emphasis}(?:${bad}))$|^tell ${name} to (?:fuck off|shut up)$`,'u').test(text))return 'reaction_davi_insult';
 if(new RegExp(`^${name} is (?:not |never )(?:an? )?(?:${bad})$`,'u').test(text))return 'reaction_davi';
 if(new RegExp(`^(?:${name} is gay|is ${name} gay)$`,'u').test(text))return 'orientation_neutral';
 if(/^(?:let me (?:give|offer) you (?:a |some )?(?:tip|advice)|i (?:have|got) (?:a tip|some advice) for you|can i give you (?:a tip|some advice))$/u.test(text))return 'tip_offer';
 if(/^(?:(?:let us|lets|let's) (?:just )?(?:chat|talk)(?: instead)?|i (?:just )?want to (?:chat|talk)|can we (?:just )?(?:chat|talk)|(?:just )?(?:talk|chat) (?:to|with) me|can we have a chat)$/u.test(text))return 'chat_open';
 if(/^(?:what (?:should|can|could) we (?:talk|chat) about|(?:can|could) you (?:suggest|pick) (?:a )?(?:conversation )?topic|give me (?:a |some )?(?:conversation )?topics)$/u.test(text))return 'topic_offer';
 if(/^i (?:do not|cannot|do not really|really do not) know how to (?:explain|describe|say) (?:it|that|this)$/u.test(text))return 'expression_uncertain';
 if(/^i was (?:just |only )?(?:joking|kidding) (?:i did not|and i did not) mean to (?:insult|hurt|offend) you$/u.test(text))return 'joke_repair';
 if(/^(?:(?:can|could) we (?:please )?(?:start over|start again|have a fresh start)|(?:let us|lets|let's) (?:start over|start again)|fresh start)$/u.test(text))return 'restart_chat';
 if(/^you are (?:(?:actually|really|much|a lot|even) )?(?:nicer|kinder|sweeter|funnier|smarter|more helpful) than i (?:expected|thought)$/u.test(text))return 'reaction_affection';
 return null;
}
module.exports={surfaceEnglish,requestEnglish,recognizeUtterance};
