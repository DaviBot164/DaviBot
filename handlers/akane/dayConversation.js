// Reasons need a compatible active topic; do not attach "because of work" to a random choice.
const dayTopics = new Set(['day_tiring','day_work','day_study','day_people','feeling_bad','tired','mental_tired','bad_day_context']);
function recognizeDayConversation(text, session = null) {
 if(/^(?:(?:nothing|not anything) (?:funny|playful)(?: right now)? (?:just )?(?:a )?(?:normal|ordinary|quiet) conversation|(?:i (?:just )?want|let us have|can we have) (?:a )?(?:normal|ordinary|quiet) conversation(?: instead)?|no jokes (?:just )?(?:talk|a normal conversation))$/u.test(text))return 'normal_chat';
 if(/^(?:(?:today|my day) (?:was|is|has been)|i (?:had|have had)) (?:(?:really|very|so|pretty|such a|a) )*(?:exhausting|tiring|draining|stressful|rough|long|busy)(?: day)?$/u.test(text))return 'day_tiring';
 if(/^(?:but |and )?i (?:am(?: feeling)?|feel) (?:(?:a bit|a little|much|slightly) )?better(?: now|already)?$/u.test(text))return 'day_easing';
 if(!session || !dayTopics.has(session.category))return null;
 const short=text.match(/^(?:mostly |mainly )?(?:my )?(work|job|school|studying|homework|people|family|friends)$/u);
 const reason=short??text.match(/^(?:mostly |mainly |probably )?(?:because of|because it was|it was because of|because|due to|it is) (?:my |the )?(work|job|school|studying|homework|people|family|friends)$/u);
 if(!reason)return null;
 return ['work','job'].includes(reason[1])?'day_work':['school','studying','homework'].includes(reason[1])?'day_study':'day_people';
}
module.exports={recognizeDayConversation};
