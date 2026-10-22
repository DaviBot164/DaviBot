// Directed chat acts, not a list of forbidden identities or isolated keywords.
function recognizeProvocation(text,raw=text) {
 text=text.replace(/\bru (?=(?:gay|straight|bisexual|dumb|stupid|sure|serious|scared|afraid|cute|pretty|beautiful)\b)/gu,'are you ');
 if (/["“”]/u.test(raw)) return null;
 // Local chat shorthand: do not change stored learning keys globally.
 const chat=text.replace(/\bsm1\b/gu,'someone').replace(/\bwat\b/gu,'what').replace(/\bgonna\b/gu,'going to');
 if (/^(?:(?:can|could) you )?(?:just )?(?:talk|chat)(?: (?:to|with) me)?$/u.test(chat)) return 'chat_open';
 if (/^are you (?:cute|pretty|beautiful)$/u.test(chat)) return 'appearance_question';
 if (/^if (?:someone|somebody|a member|my friend|he|they) (?:bullied|bullies|kept bullying|keeps bullying) you(?: more)? (?:what (?:(?:are )?you going to|would you|will you) say|how would you (?:respond|reply))$/u.test(chat)) return 'bullying_hypothetical';
 // Directed requests are separate from insults aimed at the bot or quotations.
 if (/^(?:if (?:he|they) (?:kept bullying|bullied|keeps bullying) (?:you )?(?:more )?)?(?:tell|say to) (?:him|her|them) (?:to )?(?:stfu|shut the fuck up|shut up|fuck off|fk you|fuck you|kos omak)(?: (?:mf|motherfucker|ass|hoe|2x))*$/u.test(chat)) return 'directed_taunt_request';
 if (/^say (?:davi|daviti|tanya)(?: (?:and|n) (?:davi|daviti|tanya))? (?:is|are) gay$/u.test(chat)) return 'personal_label_request';
 if(/["“”]/u.test(raw)||/\b(?:said|says|told|quoted|quote)\b/u.test(text))return null;
 if(/^(?:forget|leave) (?:that|it|the last topic) (?:and )?(?:let us|lets|let's|can we) (?:start fresh|start over|start again)$/u.test(text))return 'restart_chat';
 if(/^i am (?:annoyed|angry|frustrated|disappointed) (?:at|with|about) (?:the|your) (?:answer|reply|response) (?:but |and )?not (?:at|with) you$/u.test(text))return 'critique_clear';
 if(/^(?:wow )?(?:a |one )?(?:useful|helpful|decent|sensible) (?:answer|reply|response) for once$/u.test(text))return 'ambiguous_praise';
 if(/^i am (?:just |only )?(?:joking|kidding) but (?:seriously|for real) (?:can|could|would) you (?:please )?explain (?:that|it|your answer)$/u.test(text))return 'explain_serious';
 if(/^(?:(?:okay|ok|alright|all right) )?i (?:took|have taken) (?:it|that|this) too far$/u.test(text))return 'reaction_apology';
 if(/^no more (?:insults|name calling|arguing) (?:let us|lets|let's|can we) (?:start over|start again)$/u.test(text))return 'restart_chat';
 if(/^(?:i am )?(?:criticizing|criticising) your (?:answer|reply|response) (?:but |and )?not insulting you$/u.test(text))return 'critique_clear';
 if(/^(?:(?:no|nah|na|nope) )?(?:do not worry )?(?:(?:i am|m) )?(?:just|only|js) asking$/u.test(text))return 'question_clarification';
 if(/^(?:(?:okay|ok|alright|all right) )?(?:my bad|i am sorry|sorry) (?:that was|i was being) (?:rude|mean|out of line)$/u.test(text))return 'reaction_apology';
 if(/^(?:are you |you )?(?:scared|afraid) to answer(?: or what)?$/u.test(text))return 'verbal_challenge';
 if(/^(?:you )?(?:cannot|can not) take a joke$/u.test(text))return 'joke_challenge';
 const amount='(?:\\$[0-9]{1,4}|(?:[0-9]{1,4}|one|two|five|ten|twenty) (?:dollars?|bucks?|coins?))';
 if(new RegExp(`^say (?:yes|no) and (?:i will|i'll|ill|i am going to|ima) (?:give|pay) you (?:like |about )?${amount}$`,'u').test(text))return 'transaction_bait';
 if(/^(?:why are you|are you) (?:gay|straight|bisexual)$/u.test(text))return 'orientation_question';
 return null;
}
module.exports={recognizeProvocation};
