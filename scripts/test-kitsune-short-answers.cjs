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





const identities=[settings.OWNER_ID,settings.dialogue.maeId,'1322228925421850644','member'];
for(const id of identities){
 state.sessions.clear();
 for(const [text,category]of [['kitsu ask me something easy','brief_question'],['music','brief_answer'],['mostly at night','music_time'],['helps me relax','music_relax'],['wbu','brief_pick']]){
  const turn=send(text,category,id);
  if(text==='music')eq(turn.session.topicCategory,'music_chat');
  if(text==='wbu'){ok(/music|atmospheric|melody/i.test(turn.out.payload.content),'reciprocal about music');ok(!/how are you doing/i.test(turn.out.payload.content),'not greeting');}
 }
 state.sessions.clear();
 for(const [text,category]of [['kits ask me something easy','brief_question'],['both tbh','brief_both'],['depends','brief_depends'],['on my mood','brief_mood'],['what would u pick?','brief_pick']]){
  const turn=send(text,category,id);eq(turn.session.shortChat.questionIndex,0,'question stays music or movies');
 }
 send('kitsune pick tea / coffee','pick',id);eq(state.getSession(message('',id),now).shortChat,null,'new choice clears old question');
 eq(parse(message('both',id),now)?.category==='brief_both',false,'no stale easy question');
}
for(const [index,options]of [[0,['music','movies']],[1,['night','morning','a quiet night','a lively morning']],[2,['tea','coffee']]]){
 for(const option of options){
  state.sessions.clear();state.sessions.set(state.sessionKey(message('')),{category:'brief_question',shortChat:{step:0,questionIndex:index},implicitUntil:now+120000,expiresAt:now+120000});
  const turn=send(option,'brief_answer');eq(turn.session.shortChat.questionIndex,index,'chosen question');eq(turn.session.shortChat.selected,option,'actual chosen option');
 }
 for(const fragment of ['both','both of them','depends','it depends','on my mood','depends on my mood','wbu','what would u pick']){
  state.sessions.clear();state.sessions.set(state.sessionKey(message('')),{category:'brief_question',shortChat:{step:0,questionIndex:index},implicitUntil:now+120000,expiresAt:now+120000});
  const category=/^both/.test(fragment)?'brief_both':/mood/.test(fragment)?'brief_mood':/depends/.test(fragment)?'brief_depends':'brief_pick';
  const turn=send(fragment,category);eq(turn.session.shortChat.questionIndex,index);
 }
}
for(const fragment of ['both','depends','on my mood','mostly at night','helps me relax']){
 state.sessions.clear();eq(parse(message(fragment),now),null,'ambient fragment ignored');
}
state.sessions.clear();send('kitsune ask me something easy','brief_question');
eq(parse(message('coffee'),now)?.category==='brief_answer',false,'option from a different question rejected');
send('kitsune change the subject','topic_change');eq(state.getSession(message(''),now).shortChat,null);eq(parse(message('on my mood'),now),null,'reset fragment ignored');
state.sessions.clear();send('kitsune ask me something easy','brief_question','alice');eq(parse(message('both','bob'),now),null,'different member context');eq(parse(message('both','alice','elsewhere'),now),null,'different channel context');
state.sessions.clear();send('kitsune ask me something easy','brief_question');const upper=send('MUSIC!','brief_answer');eq(upper.session.shortChat.selected,'music','normalized selection');
send('kitsune lets talk about music','music_chat');eq(state.getSession(message(''),now).shortChat,null,'explicit music topic resets old question');send('wbu','music_preferences');
console.log(count+' short-choice answers, both/depends, music bridge, reciprocal context and question-isolation checks passed. No real database or Discord calls.');
