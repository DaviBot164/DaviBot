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




const learning=require(path.join(root,'handlers/kitsune/learningRuntime'));
const identities=[settings.OWNER_ID,settings.dialogue.maeId,'1322228925421850644','member'];
for(const id of identities){
 state.sessions.clear();
 for(const [text,category]of [['kitsu hi','hi'],['hru','mood'],['pretty good, u?','brief_reciprocal'],['just chilling','brief_chilling'],['kinda bored tho','bored'],['any ideas?','brief_ideas'],['nothing involving games','brief_no_games'],['nah, something else','brief_other']]){
  const turn=send(text,category,id);
  if(category==='brief_no_games')eq(turn.session.shortChat.noGames,true);
  if(category==='brief_other'){eq(turn.session.shortChat.noGames,true);ok(!/play|gaming|game of/u.test(turn.out.payload.content),'respect games exclusion');}
 }
 send('kitsune pick tea / coffee','pick',id);eq(state.getSession(message('',id),now).shortChat,null,'independent topic clears brief memory');
 state.sessions.clear();
 for(const [text,category]of [['hey kits hru','mood'],['not great tbh','feeling_bad'],['dont wanna get into it','brief_privacy'],['just distract me','brief_distraction'],['that wasnt what i meant','brief_repair'],['not a joke, maybe a question','brief_question'],['ask me something easy','brief_question'],['idk, u go first','brief_first']]){
  const turn=send(text,category,id);
  if(category==='brief_first')ok(/character|fox/u.test(turn.out.payload.content),'answer own question honestly');
 }
 send('kitsune change the subject','topic_change',id);eq(state.getSession(message('',id),now).shortChat,null,'reset clears brief topic');
}
for(const subject of ['','im ','i feel '])for(const mood of ['good','pretty good','fine','okay'])for(const reciprocal of ['u?','and u?','wbu?','hbu?']){
 state.sessions.clear();send('kitsune hru','mood');send(subject+mood+', '+reciprocal,'brief_reciprocal');
}
for(const text of ['not great','im not great rn','not so good tbh','i feel not very good'])eq(recognize(text),'feeling_bad',text);
for(const text of ['my friend is chilling','i was chilling yesterday','i am not relaxing','someone said just distract me','do not distract me','not asking for a question','not great at games','i am not good and you are great'])ok(!String(recognize(text)).startsWith('brief_'),'no broad guess: '+text);
for(const text of ['pretty good, u?','just chilling','any ideas?','nothing involving games','ask me something easy']){
 state.sessions.clear();eq(parse(message(text),now),null,'no ambient interception');
}
state.sessions.clear();send('kitsune ask me something easy','brief_question');
const previous=state.getSession(message(''),now);const first=previous.shortChat.questionIndex;
const reply=send('u go first','brief_first');eq(reply.session.shortChat.questionIndex,first,'same question answered');
send('music','brief_answer');
eq(learning.inputForLearning(message('kitsu pretty good u'),null,now)?.phrase,'pretty good you','learning keeps original meaning');
console.log(count+' short reciprocal, relaxation, distraction, question, privacy and complete-chain checks passed. No real database or Discord calls.');
