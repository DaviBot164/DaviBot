const {tokens}=require('../../config/akaneChatAbuse');
const mild='(?:dumb|stupid|idiot|loser|annoying|useless|trash|clown|pathetic|cringe)';
const strong='(?:bitch|cunt|motherfucker|asshole|bastard|piece of shit|shithead)';
const negative=`(?:${mild}|${strong})`;
const emphasis='(?:(?:so|really|very|such|a|an|fucking|damn|just|actually|total|complete|absolute) )*';
function expandAbuse(value) {
 return value.replace(/\S+/gu,word=>{
  if(tokens[word])return tokens[word];
  const match=word.match(/^([("“]*)(.*?)([,.!?;:"”)]+)$/u);
  return match && tokens[match[2]] ? match[1]+tokens[match[2]]+match[3] : word;
 })
  .replace(/\b(?:you r|ur) (?=(?:(?:not|never|a|an|so|such|fucking|really|very|total|complete) )*(?:bitch|cunt|motherfucker|asshole|bastard|idiot|loser|dumb|stupid|useless)\b)/gu,'you are ')
  .replace(/\b(?:stfu|s t f u)\b/gu,'shut the fuck up')
  .replace(/\bgtfo\b/gu,'get the fuck out')
  .replace(/\b(?:fu|f u)\b/gu,'fuck you')
  .replace(/\s+/gu,' ').trim();
}
function analyzeChatAbuse(value,raw=value) {
 if(/["“”]/u.test(raw))return null;
 let text=expandAbuse(value);
 // A denial containing "called" must be resolved before the reported-speech guard.
 if(new RegExp(`^i (?:never|did not) (?:call(?:ed)? you|(?:say|said) you (?:were|are)) ${emphasis}${negative}$`,'u').test(text))return {category:'disavow_insult',severity:'none'};
 if(/\b(?:said|says|told|called|quote|quoted)\b/u.test(text))return null;
 // Local predicate repair preserves stored alias keys and possession such as "your reply".
 text=text.replace(new RegExp(`^your (?=${emphasis}${negative}(?: |$))`,'u'),'you are ');
 if(/^(?:what the (?:fuck|hell|heck)|wtf|wth) (?:was|is) (?:that|this|your|the) (?:answer|reply|response)$/u.test(text))return {category:'answer_feedback',severity:'criticism'};
 // Scope first: denial, criticism of an answer and a game are separate cases.
 if(new RegExp(`^you (?:are )?(?:not|never) ${emphasis}${negative}$`,'u').test(text))return {category:'reaction_reassurance',severity:'none'};
 if(new RegExp(`^(?:your|that|this|the) (?:answer|reply|response) (?:is|was) ${emphasis}(?:${negative}|shit|bullshit)(?: (?:as fuck|af|as hell))?$`,'u').test(text))return {category:'answer_feedback',severity:'criticism'};
 if(new RegExp(`^(?:this|that|the|my) (?:game|match|round) (?:is|was) ${emphasis}(?:shit|bullshit|trash|stupid|dumb)$`,'u').test(text))return {category:'frustration',severity:'none'};
 if(/^(?:what the fuck|wtf|what the hell|wth|ffs|for fucks sake|for fuck sake|damn|shit|fuck)$/u.test(text))return {category:'frustration',severity:'none'};
 if(new RegExp(`^(?:(?:fuck|screw) (?:davi|daviti|david)|(?:davi|daviti|david) (?:is )?${emphasis}${negative})$`,'u').test(text))return {category:'reaction_davi_insult',severity:'severe'};
 if(/^(?:shut (?:the fuck )?up|get the fuck out)$/u.test(text))return {category:'reaction_dismissive',severity:'severe'};
 const question=new RegExp(`^(?:are you|why are you|why are you being) ${emphasis}${negative}(?: or (?:just )?(?:pretending|what))?$`,'u');
 if(question.test(text))return {category:'reaction_insult',severity:new RegExp(strong,'u').test(text)?'severe':'mild'};
 const direct=new RegExp(`^(?:you (?:are )?${emphasis}${negative}(?: (?:as fuck|af|as hell))?|${negative}(?: you)?|(?:fuck|screw) you(?: too)?|you (?:suck|suck ass)|shut (?:the fuck )?up(?: you ${emphasis}${negative})?|get the fuck out|kys|kill yourself)$`,'u');
 if(direct.test(text))return {category:'reaction_insult',severity:new RegExp(strong+'|fuck|kys|kill yourself','u').test(text)?'severe':'mild'};
 return null;
}
module.exports={expandAbuse,analyzeChatAbuse};
