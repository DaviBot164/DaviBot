// Shared bounded request shapes. No keyword-only guessing or word reordering.
function requestForm(text) {
 if(/^(?:let us|lets|let's|can we|could we) (?:just )?(?:stop|end (?:this|the) (?:chat|conversation))(?: (?:now|here|for now))?$/u.test(text))return 'stop';
 if(/^(?:let us|lets|let's|can we|could we) (?:just )?(?:leave|drop|pause) (?:that|it|this|the topic)(?: for (?:now|a bit))?$/u.test(text))return 'topic_change';
 // A bounded exclusion of both familiar stress topics; never infer a boundary
 // from an isolated "not" or from someone else's preference.
 if(/^(?:(?:can|could|shall) we (?:please )?|let us |lets |let's )(?:talk|chat) about (?:something|anything) (?:that is not|other than|besides|except) (?:work|school) (?:or|and) (?:work|school)$/u.test(text) && /\bwork\b/u.test(text) && /\bschool\b/u.test(text))return 'light_topic';
 if(/^what would you do (?:in my (?:place|shoes|position)|if you were me)$/u.test(text))return 'advice_resume';
 if(/^(?:(?:yes|yeah|okay|right) )?(?:that|it|your explanation) (?:makes|is making) (?:(?:much|a lot) )?(?:more )?sense(?: to me)?(?: now)?$/u.test(text))return 'feedback_understood';
 if(/^(?:(?:now|actually) )?(?:(?:a little|some|a bit of|your) )?advice (?:would|could|might) help(?: me)?(?: now|after all)?$/u.test(text) || /^i (?:would like|want|could use|need) (?:(?:a little|some|a bit of|your) )?advice (?:now|after all)$/u.test(text))return 'advice_resume';
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
 const noSolution='(?:i )?do not (?:(?:really|actually) )?(?:need|want) (?:(?:a|any|your|another) )?(?:fix|solution|advice|tips|suggestions)';
 if(new RegExp('^'+noSolution+'$','u').test(text))return true;
 const finish='(?:please )?(?:just |only )?(?:let me finish(?: talking)?|let me explain|hear me out)';
 if(new RegExp('^(?:'+finish+'|'+noSolution+' (?:but |and )?'+finish+'|'+finish+' (?:but |and )?'+noSolution+')$','u').test(text))return true;
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
