// Scoped answers and requests, not an unbounded transcript or general English parser.
function recognizeContinuation(text,session){
 const core=session?.core??{};
 const game=core.topic==='game'||/^game_/u.test(session?.topicCategory??session?.category??'');
 if(game){
  if(/^(?:got any advice|any small tip|any advice)$/u.test(text))return {kind:'game_continuation',data:{form:'advice',advice:true}};
  if(/^(?:something short|just one thing)$/u.test(text)&&core.gameAdvice&&!core.noAdvice)return {kind:'game_continuation',data:{form:'short',advice:true}};
  if(/^(?:thats|that is) enough advice$/u.test(text))return {kind:'game_continuation',data:{form:'stop',noAdvice:true}};
  if(text==='roblox')return {kind:'game_continuation',data:{form:'platform'}};
  if(text==='he was just better than me')return {kind:'game_continuation',data:{form:'opponent'}};
  if(text==='not blaming anyone')return {kind:'game_continuation',data:{form:'no_blame'}};
  if(/^(?:just )?(?:i )?want to improve$/u.test(text))return {kind:'game_continuation',data:{form:'improve'}};
 }
 if(core.nonPersonal){
  if(/^(?:ask another question|something different this time)$/u.test(text))return {kind:'nonpersonal_question',data:{open:core.questionStyle==='open'}};
  if(/^nothing personal$/u.test(text))return {kind:'light_sound',data:{form:'privacy'}};
  if(core.questionStyle==='open'&&core.questionIndex===0){
   const choice=text.match(/^(?:probably )?(waves|rain)$/u);
   if(choice)return {kind:'light_sound',data:{form:'choose',sound:choice[1]}};
   const correction=text.match(/^(waves|rain) not (waves|rain)$/u);
   if(correction&&correction[1]!==correction[2])return {kind:'light_sound',data:{form:'choose',sound:correction[1]}};
   if(text==='they sound peaceful'&&core.soundChoices?.length)return {kind:'light_sound',data:{form:'peaceful'}};
   if(text==='what about rain')return {kind:'light_sound',data:{form:'offer',sound:'rain'}};
   if(text==='i like that too'&&core.pendingSound)return {kind:'light_sound',data:{form:'add',sound:core.pendingSound}};
   if(text==='what sound did i choose')return {kind:'light_sound',data:{form:'recall'}};
   if(text==='keep it quiet')return {kind:'light_sound',data:{form:'quiet'}};
  }
 }
 return null;
}
function continuationResponse(data,memory){
 const core={...memory,topic:'game'};
 const replies={platform:'Roblox, then. What kind of game are you playing there?',opponent:'They played better that time, from what you saw. What stood out about the match?',no_blame:'You are not blaming anyone, understood. We can talk about the match without turning it into an argument.',improve:'You want to improve, then. What part would you like to get better at?',advice:'Try focusing on one thing next match: notice what happens just before you lose an exchange, then practise responding to that.',short:'Focus on one mistake from the last match.',stop:'Enough advice, understood. We can just chat.'};
 if(data.advice){core.noAdvice=false;core.gameAdvice='one_mistake';}
 if(data.noAdvice){core.noAdvice=true;core.gameAdvice=null;}
 return {core,content:replies[data.form]};
}
function soundResponse(data,memory){
 const core={...memory};let content;
 if(data.form==='choose'){core.soundChoices=[data.sound];core.pendingSound=null;content='You chose '+data.sound+' for the scene.';}
 if(data.form==='offer'){core.pendingSound=data.sound;content='Soft rain could give the scene a peaceful background. Would you like to add that sound too?';}
 if(data.form==='add'){core.soundChoices=[...new Set([...(memory.soundChoices??[]),data.sound])];core.pendingSound=null;content='Added '+data.sound+' alongside your earlier sound choice.';}
 if(data.form==='recall')content=memory.soundChoices?.length?'You chose '+memory.soundChoices.join(' and ')+'.':'You have not chosen a sound yet.';
 if(data.form==='peaceful')content='Those sounds feel peaceful to you. A gentle background fits the scene.';
 if(data.form==='quiet'){core.quietSound=true;content='We will keep the sound soft and quiet.';}
 if(data.form==='privacy'){core.nonPersonal=true;content='Nothing personal, understood. We will keep this about fictional scenes.';}
 return {core,content};
}
module.exports={recognizeContinuation,continuationResponse,soundResponse};
