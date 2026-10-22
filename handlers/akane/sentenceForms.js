// Shared bounded request shapes. No keyword-only guessing or word reordering.
function requestForm(text) {
 if(/^(?:(?:can|could|would) you (?:please )?)?(?:pick|choose)(?: (?:again|another|once more)| a different one)(?: please)?$/u.test(text))return 'again';
 if(/^(?:can|could|would) you (?:please )?help me (?:study|learn|with (?:my )?(?:studies|school work|homework))$/u.test(text))return 'study_start';
 if(/^(?:i (?:do not|do not really) understand (?:your|that|the) (?:answer|reply|response)|i am not sure what you mean|what do you mean by (?:that|this))$/u.test(text))return 'explain';
 return null;
}
function moodBoundary(text) {
 const match=text.match(/^((?:i am|i feel|i am feeling) (?:(?:really|very|so|kind of|a little) )?(?:sad|upset|down|unhappy|tired|exhausted|drained|lonely|stressed)) (?:but|and) (?:i (?:do not want|do not need|did not ask for)|no) (?:any |your )?(?:advice|tips|suggestions)$/u);
 if(!match)return null;
 const category=/\b(?:tired|exhausted|drained)\b/u.test(match[1])?'tired':/\blonely\b/u.test(match[1])?'lonely':'feeling_bad';
 return {category,declineAdvice:true};
}
function wantsListening(text) {
 const listen='(?:(?:please )?(?:just |only )?(?:listen(?: to me)?|hear me out)|let me vent)';
 const refusal='(?:(?:i )?(?:do not want|do not need|am not looking for)|not looking for|no) (?:any |your )?(?:advice|tips|suggestions|solutions)';
 if(new RegExp(`^(?:${listen}|${refusal} (?:and |but )?${listen}|${listen} (?:and |but )?${refusal})$`,'u').test(text))return true;
 return /^(?:i (?:just |only )?(?:need|want|wanted) to vent|(?:can|could) i (?:just )?vent|i (?:just )?need to get (?:this|that|it) off my chest|(?:i am )?not looking for (?:any )?solutions)$/u.test(text);
}
module.exports={requestForm,moodBoundary,wantsListening};
