// Structured expectations only: no raw conversation text is stored.
const EXPECTATIONS = Object.freeze({
 not_well:'wellbeing', feeling_stuck:'help_topic', help_offer:'help_topic',
 emotional_detail:'mood_support', study_start:'study_step', study_step:'study_step', study_breakdown:'study_step', study_alternative:'study_step'
});
const answers = {
 wellbeing:{
  emotional_detail:['my mood','mood','emotionally','emotional','mentally','my feelings','just my mood','it is my mood','i mean my mood'],
  physical_detail:['physically','physical','my body','physically unwell','i mean physically','it is physical'],
  mixed_wellbeing:['both','both of them','a bit of both','both really']
 },
 help_topic:{
  study_start:['with studying','studying','study','with school','school','with homework','homework','with learning','learning','with my studies','my studies','i need to study'],
  activity_start:['something to do','an activity','activity','finding something to do','a game','gaming','with gaming'],
  choice_start:['choosing','a choice','choices','deciding','between options','help choosing','with a decision'],
  tip:['advice','some advice','a tip'], help:['commands','server commands','a command']
 },
 study_step:{
  study_alternative:['i already tried that','already tried that','i tried that already','that did not work','it did not work','another way','a different approach','can you suggest a different approach','can you suggest another way','something different'],
  study_step:['yes','yeah','sure','okay','ok','how','how do i start','what first','what should i do first','first step','show me'],
  study_breakdown:['too much','it is too much','that is too much','too hard','i cannot focus','i cannot concentrate','i keep getting distracted']
 },
 mood_support:{
  topic_change:['a distraction','distraction','something else'],
  tip:['advice','some advice'], pause:['a pause','pause','a break','break']
 }
};
function followupCategory(text,session) {
 const options=answers[session?.pending?.kind];
 if(!options)return null;
 for(const [category,phrases]of Object.entries(options))if(phrases.includes(text))return category;
 return null;
}
function attachExpectation(response,request) {
 if (!response.session || ['help','stop'].includes(request.category)) return response;
 if(response.pending)return response;
 const kind=EXPECTATIONS[response.category];
 if(kind) return {...response,pending:{kind}};
 if(['context_hesitant','context_echo','context_changed'].includes(request.category) && request.conversation?.pending) {
  return {...response,pending:request.conversation.pending};
 }
 return response;
}
module.exports={followupCategory,attachExpectation};
