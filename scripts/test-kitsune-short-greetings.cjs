'use strict';
const assert=require('node:assert/strict'),path=require('node:path'),Module=require('node:module');
const root=process.argv[2]||path.resolve(__dirname,'..');
const {recognize,recognizeDetails,canonical}=require(path.join(root,'handlers/kitsune/language'));
let count=0;
const eq=(actual,expected,label)=>{assert.deepEqual(actual,expected,label);count++;};
const ok=(value,label)=>{assert.ok(value,label);count++;};
const original=Module._load;
const parserPath=path.join(root,'handlers/kitsune/parser.js'),responsePath=path.join(root,'handlers/kitsune/responses.js'),statePath=path.join(root,'handlers/kitsune/state.js');
const pools={...require(path.join(root,'config/kitsuneReplies'))};
for(const [key,value]of Object.entries(require(path.join(root,'config/kitsunePersonality')).ownerReplies))pools['owner_'+key]=value;
for(const [key,value]of Object.entries(require(path.join(root,'config/kitsuneDialogue')).pools))pools['dialogue_'+key]=value;
const settings={OWNER_ID:'1357721282061533311',dialogue:{maeId:'1380278195961729084'},replies:pools,STATE_TTL:1800000};
Module._load=function(request,parent){
 if([parserPath,responsePath,statePath].includes(parent?.filename)&&request==='./settings')return settings;
 if(parent?.filename===responsePath&&request==='discord.js')return{escapeMarkdown:x=>x};
 if(parent?.filename===responsePath&&request==='./help')return{buildHelp:()=>({})};
 return original.apply(this,arguments);
};
let parse,respond,context,state,toneFor;
try{
 parse=require(parserPath).parseRequest;respond=require(responsePath).buildResponse;toneFor=require(responsePath).toneFor;
 context=require(path.join(root,'handlers/kitsune/context'));state=require(statePath);
}finally{Module._load=original;}
let now=1000;
function message(text,id='member',channelId='chat',reference){return{content:text,guildId:'guild',channelId,author:{id},client:{user:{id:'bot'}},mentions:{},reference};}
function send(text,category,id='member',channel='chat'){
 const m=message(text,id,channel),req=parse(m,now);
 ok(req,'recognized turn: '+text);eq(req.category,category,text);
 const before=state.getSession(m,now),out=respond(m,req);
 ok(out.payload.content?.length,'reply: '+text);
 ok(!/try the (?:main )?request|shorter sentence|did not quite follow|did not find the main request/i.test(out.payload.content),'no fallback: '+text);
 state.sessions.set(state.sessionKey(m),{...context.memoryAfter(before,req,out),category:out.category,question:out.question??false,messageId:'last-'+now,implicitUntil:now+120000,expiresAt:now+120000});
 now+=5000;
 return{req,out,session:state.getSession(m,now)};
}


for(const greeting of ['Yo','Hey','Hi','Hello','yo,','hey!']){
 state.sessions.clear();send(greeting+' kitsune hru','mood');
}
for(const id of [settings.OWNER_ID,settings.dialogue.maeId,'1322228925421850644','member']){
 for(const [word,category]of [['well','feeling_good'],['good','feeling_good'],['great','feeling_good'],['fine','feeling_neutral'],['okay','feeling_neutral'],['not bad','feeling_neutral'],['not well','feeling_bad'],['not good','feeling_bad']]){
  for(const thanks of ['ty','thx','thanks','thank you']){
   state.sessions.clear();send('kitsune hi','hi',id);send('hru','mood',id);
   const turn=send('im '+word+' '+thanks+' for asking. ',category,id);
   ok(!/did not|shorter sentence|clearer cue/i.test(turn.out.payload.content),'answered wellbeing');
  }
 }
}
for(const phrase of ['well ty for asking','good thx','im well ty for asking.','i feel great thanks','thanks for asking']){
 eq(recognize(phrase),['thanks for asking','well ty for asking'].includes(phrase)?'thanks':'feeling_good',phrase);
 state.sessions.clear();eq(parse(message(phrase),now),null,'do not intercept ambient replies');
}
for(const phrase of ['my friend is well ty for asking','i was well ty for asking','i am not feeling good thanks','i am well but tired thanks','she said im well ty for asking'])ok(recognize(phrase)!=='feeling_good','no false positive: '+phrase);
for(const phrase of ['i told yo kitsune hru','someone said hey kitsune hru','yo kitsunex hru']){
 state.sessions.clear();eq(parse(message(phrase),now),null,'address boundaries: '+phrase);
}
state.sessions.clear();send('kitsune hi','hi');eq(parse(message("That's its 👨🏿‍🦲"),now),null,'ambiguous text must not end chat');
const learning=require(path.join(root,'handlers/kitsune/learningRuntime'));
const input=learning.inputForLearning(message('Yo kitsune hru'),null,now);
eq(input?.phrase,'how are you','learning matches greeting prefix');eq(input?.collect,true);
eq(learning.inputForLearning(message('someone said yo kitsune hru'),null,now),null);
console.log(count+' greeting-prefix, short wellbeing, thanks, negation and learning-extraction checks passed. No real database or Discord calls.');
