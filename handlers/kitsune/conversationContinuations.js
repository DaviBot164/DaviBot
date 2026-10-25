// Scoped answers and requests, not an unbounded transcript or general English parser.
function recognizeContinuation(text,session){
 const core=session?.core??{};
 const game=core.topic==='game'||/^game_/u.test(session?.topicCategory??session?.category??'');
 if(game){
  if(/^(?:no more tips|not asking for advice yet)$/u.test(text))return {kind:'game_continuation',data:{form:'stop',noAdvice:true}};
  if(text==='just telling you')return {kind:'game_continuation',data:{form:'telling',noAdvice:true}};
  if(text==='project slayers')return {kind:'game_continuation',data:{form:'game_name'}};
  if(text==='i keep attacking too early')return {kind:'game_continuation',data:{form:'early'}};
  if(/^(?:thats|that is) why i lose$/u.test(text))return {kind:'game_continuation',data:{form:'reason'}};
  if(core.gameAdvice&&!core.noAdvice){
   if(text==='what do you mean by an exchange')return {kind:'game_continuation',data:{form:'exchange',advice:true}};
   if(text==='give me an example')return {kind:'game_continuation',data:{form:'example',advice:true}};
   if(text==='simpler')return {kind:'game_continuation',data:{form:'simpler',advice:true}};
  }

  if(/^(?:got any advice|any small tip|any advice)$/u.test(text))return {kind:'game_continuation',data:{form:'advice',advice:true}};
  if(/^(?:something short|just one thing)$/u.test(text)&&core.gameAdvice&&!core.noAdvice)return {kind:'game_continuation',data:{form:'short',advice:true}};
  if(/^(?:thats|that is) enough advice$/u.test(text))return {kind:'game_continuation',data:{form:'stop',noAdvice:true}};
  if(text==='roblox')return {kind:'game_continuation',data:{form:'platform'}};
  if(text==='he was just better than me')return {kind:'game_continuation',data:{form:'opponent'}};
  if(text==='not blaming anyone')return {kind:'game_continuation',data:{form:'no_blame'}};
  if(/^(?:just )?(?:i )?want to improve$/u.test(text))return {kind:'game_continuation',data:{form:'improve'}};
 }
 if(core.nonPersonal){
  if(core.questionStyle==='open'&&core.questionIndex===2){
   const title=text.match(/^(?:maybe|my title is) ([a-z]+(?: [a-z]+){0,5})$/u);
   if(title&&title[1].length<=64&&!/^(?:not|do not|someone|he said|she said)\b/u.test(title[1]))return {kind:'light_title',data:{form:'choose',title:title[1]}};
   if(text==='does that fit'&&core.userTitle)return {kind:'light_title',data:{form:'fit'}};
   if(text==='suggest a shorter title'&&core.userTitle)return {kind:'light_title',data:{form:'suggest'}};
   if(text==='i prefer mine'&&core.userTitle)return {kind:'light_title',data:{form:'mine'}};
   if(text==='what title did i choose')return {kind:'light_title',data:{form:'recall'}};
   if(text==='yes use that'&&core.pendingTitle)return {kind:'light_title',data:{form:'accept'}};
  }

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
 const detailReplies={
  exchange:'An exchange is one brief back-and-forth in a fight: one player attacks, and the other responds.',
  example:'For example, you attack, your opponent blocks, and then they counterattack. That short back-and-forth is an exchange.',
  simpler:memory.gameAdvicePhase==='example'||memory.gameAdvicePhase==='exchange'?'An exchange is a short back-and-forth in a fight.':'Look at one mistake from the last match.',
  game_name:'Project Slayers, then. What has your recent match been like?',
  early:'You keep attacking too early, from what you noticed. I am following; you can tell me more.',
  reason:memory.matchIssue==='early_attack'?'You think attacking too early is part of why you lose. That is your observation; we do not have to turn it into advice.':'What part of the match do you think led to the loss?',
  telling:'You are just telling me, understood. I will listen without adding tips.'
 };
 if(data.advice){core.noAdvice=false;core.gameAdvice='one_mistake';core.gameAdvicePhase=data.form;}
 if(data.form==='game_name')core.gameName='project_slayers';
 if(data.form==='early')core.matchIssue='early_attack';
 if(data.noAdvice){core.noAdvice=true;core.gameAdvice=null;}
 return {core,content:detailReplies[data.form]??replies[data.form]};
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

function titleResponse(data,memory){
 const core={...memory};let content;
 if(data.form==='choose'){core.userTitle=data.title;core.selectedTitle=data.title;core.pendingTitle=null;content='Your title is “'+data.title+'”.';}
 if(data.form==='fit')content='“'+memory.userTitle+'” fits a calm instrumental scene: it suggests a quiet atmosphere.';
 if(data.form==='suggest'){
  const words=memory.userTitle.split(' ');core.pendingTitle=words[words.length-1];
  content=words.length>1?'A shorter option is “'+core.pendingTitle+'”. Your own title is still “'+memory.userTitle+'”.':'Your title is already one word; I would keep it as it is.';
 }
 if(data.form==='mine'){core.selectedTitle=memory.userTitle;core.pendingTitle=null;content='We will keep your title, “'+memory.userTitle+'”.';}
 if(data.form==='accept'){core.selectedTitle=memory.pendingTitle;core.pendingTitle=null;content='We will use “'+core.selectedTitle+'”.';}
 if(data.form==='recall')content=memory.selectedTitle?'You chose “'+memory.selectedTitle+'”.':'You have not chosen a title yet.';
 return {core,content};
}
module.exports={recognizeContinuation,continuationResponse,soundResponse,titleResponse};
