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







let variants=0;
for(const action of ['say hello','say hi','ask me a question','tell me something interesting','help me study'])for(const form of [action,'please '+action,'could you '+action,'could you please '+action,action+' please'])for(const variant of [form,form.toUpperCase()+'!!!',form+' 🙂']){
 state.sessions.clear();const m=message('kitsune '+variant),req=parse(m,now),out=req&&respond(m,req);
 ok(req,'variant recognized: '+variant);ok(!/shorter sentence|not sure what you meant|clearer cue|did not find|try the request without|one clear direction/i.test(out.payload?.content??''),'variant action: '+variant);variants++;
}
for(const text of ['lady kitsune hru','how are you kitsune','can you kitsu help me study','kitsuneee hi']){
 state.sessions.clear();const req=parse(message(text),now);ok(req && !['fallback','clarify','reaction_question'].includes(req.category),'flexible addressing: '+text);
}
for(const text of ['someone said say hi','do not give me advice','not ok rn','im not tired']){
 state.sessions.clear();const req=parse(message('kitsune '+text),now);ok(!['joke','tip','tired','core_hello'].includes(req.category),'negative scope: '+text);
}
state.sessions.clear();const typo=parse(message('kitsune sttfu'),now);eq(typo.category,'reaction_dismissive','observed abbreviated typo');
console.log(variants+' generated phrasing/case/emoji variants and '+count+' bounded-rewrite checks passed. No real database or Discord calls.');
