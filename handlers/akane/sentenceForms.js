// Shared bounded request shapes. No keyword-only guessing or word reordering.
function requestForm(text) {
 const worn='(?:tired|exhausted|drained|worn out)';
 // Explicit mind/body contrast, without inferring a mental state from generic tiredness.
 if(new RegExp(`^(?:(?:it is|its|it's) )?my (?:mind|brain|head) (?:is|that is|thats|that's) ${worn} (?:but )?not my body$`,'u').test(text) || new RegExp(`^my (?:mind|brain) (?:is|feels) ${worn}$`,'u').test(text))return 'mental_tired';
 if(new RegExp(`^(?:(?:i am|i feel) )?not sleepy (?:but )?(?:just |only )?${worn}$`,'u').test(text) || new RegExp(`^(?:(?:i am|i feel) )?(?:just |only )?${worn} (?:but )?not sleepy$`,'u').test(text))return 'tired';
 if(/^(?:(?:can|could|would) you (?:please )?)?(?:make (?:it|that|your answer) (?:shorter|simpler)|shorten (?:it|that|your answer)|keep it short)(?: please)?$/u.test(text))return 'simplify';
 if(/^(?:(?:yes|yeah|okay|right) )?(?:that is|thats|that's|that sounds|it is) (?:(?:much|a lot) )?(?:clearer|easier to understand)$/u.test(text))return 'feedback_understood';
 if(/^(?:(?:can|could|would) you (?:please )?)?(?:pick|choose)(?: (?:again|another|once more)| a different one)(?: please)?$/u.test(text))return 'again';
 if(/^(?:can|could|would) you (?:please )?help me (?:study|learn|with (?:my )?(?:studies|school work|homework))$/u.test(text))return 'study_start';
 if(/^(?:i (?:do not|do not really) understand (?:your|that|the) (?:answer|reply|response)|i am not sure what you mean|what do you mean by (?:that|this))$/u.test(text))return 'explain';
 return null;
}
function moodBoundary(text) {
 // Preserve the stated tiredness when a different emotion is denied.
 if (/^(?:i am|i feel|i am feeling) (?:(?:really|very|so|a little|kind of) )?(?:tired|exhausted|drained) but (?:i am |i feel )?not (?:angry|mad|upset)(?: (?:at|with) you)?$/u.test(text)) return {category:'tired',declineAdvice:false};
 const match=text.match(/^((?:i am|i feel|i am feeling) (?:(?:really|very|so|kind of|a little) )?(?:sad|upset|down|unhappy|tired|exhausted|drained|lonely|stressed)) (?:but|and) (?:i (?:do not want|do not need|did not ask for)|no) (?:any |your )?(?:advice|tips|suggestions)$/u);
 if(!match)return null;
 const category=/\b(?:tired|exhausted|drained)\b/u.test(match[1])?'tired':/\blonely\b/u.test(match[1])?'lonely':'feeling_bad';
 return {category,declineAdvice:true};
}
function wantsListening(text) {
 // Match desires and refusals as clauses; a mention of "advice" alone is insufficient.
 const company='(?:(?:just |only )?(?:some )?(?:company|someone to (?:talk to|listen)|a listening ear))';
 const solution='(?:(?:a |any |your )?(?:solution|solutions|advice|tips|suggestions))';
 if(/^(?:i )?(?:just |only )?(?:want|need|would like) (?:someone|somebody|you) to (?:just |only )?(?:listen(?: to me)?|hear me out)$/u.test(text))return true;
 if(new RegExp(`^(?:i am )?not (?:asking|looking) for ${solution} (?:but |and )?${company}$`,'u').test(text))return true;
 if(/^(?:please )?do not (?:try to )?(?:fix|solve) (?:it|this|that|things) (?:but |and )?(?:just |only )?(?:listen(?: to me)?|hear me out)$/u.test(text))return true;
 if(/^(?:advice|tips|suggestions|a solution|solutions) (?:is|are) not what i (?:need|want)(?: right now)?$/u.test(text))return true;
 text=text.replace(/ (?:for (?:a |one )?(?:minute|second|moment|sec)|a sec)$/u,'');
 if (/^(?:i )?(?:just |only )?(?:want to|would like to) (?:just )?(?:talk|chat)(?: (?:to|with) you)? (?:but |and )?no (?:advice|tips|suggestions)$/u.test(text) || /^no (?:advice|tips|suggestions) (?:i )?(?:just |only )?(?:want to )?(?:talk|chat)$/u.test(text)) return true;
 const listen='(?:(?:please )?(?:just |only )?(?:listen(?: to me)?|hear me out)|let me vent)';
 const refusal='(?:(?:i )?(?:do not want|do not need|am not looking for)|not looking for|no) (?:any |your )?(?:advice|tips|suggestions|solutions)';
 if(new RegExp(`^(?:${listen}|${refusal} (?:and |but )?${listen}|${listen} (?:and |but )?${refusal})$`,'u').test(text))return true;
 return /^(?:i (?:just |only )?(?:need|want|wanted) to vent|(?:can|could) i (?:just )?vent|i (?:just )?need to get (?:this|that|it) off my chest|(?:i am )?not looking for (?:any )?solutions)$/u.test(text);
}
module.exports={requestForm,moodBoundary,wantsListening};
