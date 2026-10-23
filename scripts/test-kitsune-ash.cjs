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

const ash='1322228925421850644';
eq(toneFor(ash),'ash');eq(toneFor(settings.OWNER_ID),'owner');eq(toneFor(settings.dialogue.maeId),'mae');eq(toneFor('stranger'),'public');
for(const [text,category] of [['kitsune hi','hi'],['hru','mood'],['good','feeling_good'],['wyd','activity'],['im playing','gaming'],['wbu','activity'],['kitsune thanks','thanks'],['kitsune can you help me study','study_start'],['sure','study_step']]){
 const turn=send(text,category,ash);
 ok(!/\b(?:Mae|Davi|handsome|sweetheart|darling|princess|girl)\b/i.test(turn.out.payload.content),'Ash address: '+text);
}
for(const [key,pool]of Object.entries(settings.replies)){
 if(!/^(?:conversation|dialogue)_ash_/.test(key))continue;
 for(const line of pool)ok(!/\b(?:Mae|princess|girl|sister|queen)\b/i.test(line),'friendly male pool: '+key);
 const originalPool=settings.replies[key.replace('_ash_','_mae_')];
 ok(originalPool!==pool,'separate friendly pool: '+key);
}
state.sessions.clear();
const mae=send('kitsune hi','hi',settings.dialogue.maeId);ok(!/\bAsh\b/.test(mae.out.payload.content),'Mae unchanged');
console.log(count+' Ash identity, friendly dialogue, address isolation and existing-tone checks passed. No real database or Discord calls.');
