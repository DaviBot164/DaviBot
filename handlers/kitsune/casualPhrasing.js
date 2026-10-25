// Whole-clause rewrites for reviewed paraphrases. Never rewrites learning keys or quoted fragments.
function casualPhrasing(text,memory){
 let m=text.match(/^(ash|mae|davi|daviti|(?:a|my) friend) gave me a hand$/u);
 if(m)return m[1]+' helped me';
 const general={
  'that reply was not what i asked for':'your answer missed the point',
  'not insulting you':'i did not mean that as an insult',
  'just answer more directly':'try again without the attitude',
  'never mind lets reset':'never mind lets start over',
  'never mind let us reset':'never mind lets start over',
  'ask me something easy no options':'ask something without giving me options'
 };
 if(Object.hasOwn(general,text))return general[text];
 if(memory?.topic==='help'){
  m=text.match(/^(davi|daviti|ash|mae) was the one who explained (?:them|the rules)$/u);if(m)return m[1]+' explained the rules';
  m=text.match(/^the link came from (davi|daviti|ash|mae)$/u);if(m)return m[1]+' sent me the link';
  if(text==='who explained everything')return 'who explained the rules';
  if(/^(?:and )?who shared the link$/u.test(text))return 'who sent the link';
 }
 if(memory?.nonPersonal){
  if(text==='no people around')return 'no people at all';
  if(text==='what did i add')return 'what details do we have';
  m=text.match(/^(?:lets|let us) switch to (?:the |a )?(forest|seaside)$/u);if(m)return 'a '+m[1]+' instead';
  m=text.match(/^keep only (?:the )?(.+)$/u);if(m)return 'remove everything except '+m[1];
  m=text.match(/^add (?:some |a |the )?(moonlight|silence|waves|stars|cool breeze)$/u);if(m)return m[1]==='cool breeze'?'a cool breeze':m[1];
  m=text.match(/^take out (?:the )?(.+)$/u);if(m)return 'remove '+m[1];
  if(['what have we got so far','whats left','what is left'].includes(text))return 'what details do we have';
 }
 return text;
}
module.exports={casualPhrasing};
