// Reasons need a compatible active topic; do not attach "because of work" to a random choice.
const dayTopics = new Set(['day_okay','day_tiring','day_work','day_study','day_people','feeling_bad','tired','mental_tired','bad_day_context','day_tasks','day_no_break','day_explanation']);
function recognizeDayConversation(text, session = null) {
 if (/^(?:today|my day) (?:was|is|has been) (?:(?:pretty|quite|mostly|actually) )?(?:okay|ok|fine|alright)(?: overall)?$/u.test(text)) return 'day_okay';
 if(/^(?:(?:nothing|not anything) (?:funny|playful)(?: right now)? (?:just )?(?:a )?(?:normal|ordinary|quiet) conversation|(?:i (?:just )?want|let us have|can we have) (?:a )?(?:normal|ordinary|quiet) conversation(?: instead)?|no jokes (?:just )?(?:talk|a normal conversation))$/u.test(text))return 'normal_chat';
 if(/^(?:(?:today|my day) (?:was|is|has been)|i (?:had|have had)) (?:(?:really|very|so|pretty|such a|a) )*(?:exhausting|tiring|draining|stressful|rough|long|busy)(?: day)?$/u.test(text))return 'day_tiring';
 if(/^(?:but |and )?i (?:am(?: feeling)?|feel) (?:(?:a bit|a little|much|slightly) )?better(?: now|already)?$/u.test(text))return 'day_easing';
 if(/^my (?:boss|manager|teacher) (?:kept giving me|gave me|keeps giving me|assigned me) (?:extra|more|too much) (?:work|tasks|homework)$/u.test(text))return 'day_tasks';
 if(/^(?:but |and )?(?:talking about (?:it|this|that)|saying it out loud) (?:helped|helps)(?: (?:a little|a bit|somewhat))?$/u.test(text))return 'day_relief';
 if(!session || !dayTopics.has(session.category))return null;
 if(/^(?:and )?i (?:barely had time for (?:a )?break|did not (?:get|have|take) (?:a |any )?break|had no time (?:for a break|to rest))$/u.test(text))return 'day_no_break';
 if(/^(?:(?:that is|thats) why|which is why) i (?:am|feel) (?:so |really |very )?(?:tired|drained|exhausted)$/u.test(text))return 'day_explanation';
 const changed=text.match(/^it (?:was|is) not (?:the |my )?(work|job|school|studying|homework|people|family|friends) (?:but )?it (?:was|is) (?:the |my )?(work|job|school|studying|homework|people|family|friends)$/u);
 if(changed && changed[1]!==changed[2])return ['work','job'].includes(changed[2])?'day_work':['school','studying','homework'].includes(changed[2])?'day_study':'day_people';
 const short=text.match(/^(?:mostly |mainly )?(?:my )?(work|job|school|studying|homework|people|family|friends)$/u);
 const reason=short??text.match(/^(?:mostly |mainly |probably )?(?:because of|because it was|it was because of|because|due to|it is) (?:my |the )?(work|job|school|studying|homework|people|family|friends)$/u);
 if(!reason)return null;
 return ['work','job'].includes(reason[1])?'day_work':['school','studying','homework'].includes(reason[1])?'day_study':'day_people';
}
module.exports={recognizeDayConversation};
