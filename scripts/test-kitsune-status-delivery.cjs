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







const mainPath=path.join(root,'handlers/kitsuneReplyHandler.js');
const transportSettings={...settings,USER_COOLDOWN:3000,CHANNEL_COOLDOWN:2000,SESSION_TTL:120000};
let starts=0,warnings=0,throwStatus=false;
Module._load=function(request,parent){
 if(parent?.filename===mainPath&&request==='./kitsune/learningRuntime')return{inputForLearning:()=>null,enabled:()=>false};
 if(parent?.filename===mainPath&&request==='discord.js')return{PermissionFlagsBits:{SendMessagesInThreads:1,SendMessages:2,ViewChannel:4,ReadMessageHistory:8,EmbedLinks:16}};
 if(parent?.filename===mainPath&&request==='./kitsune/settings')return transportSettings;
 if(parent?.filename===mainPath&&request==='./kitsune/help')return{plainHelp:()=> 'Help'};
 if(parent?.filename===mainPath&&request==='./kitsune/cooldownStatus')return{createCooldownStatus:()=>({start(sent,payload,info){starts++;eq(state.channels.get(info.channelId).busy,false,'countdown starts after delivery unlock');ok(state.channels.get(info.channelId).until>Date.now());if(throwStatus)throw Error('status mock failure');},warn(){warnings++;}})};
 return original.apply(this,arguments);
};
let handle;try{handle=require(mainPath).handleKitsuneReply;}finally{Module._load=original;}
(async()=>{
 state.sessions.clear();state.users.clear();state.channels.clear();let sent=0,fail=false;
 const m={...message('kitsune hi'),inGuild:()=>true,guild:{members:{me:{}}},channel:{permissionsFor:()=>({has:()=>true}),isThread:()=>false},reply:async()=>{if(fail)throw Error('send mock failure');return{id:String(++sent)}}};
 eq(await handle(m),true);eq(starts,1);m.content='kitsune thanks';eq(await handle(m),false);eq(warnings,1);eq(sent,1,'no extra reply for early message');
 m.content='lets stop';eq(await handle(m),false);eq(warnings,1,'stop still clears silently during cooldown');eq(state.getSession(m,Date.now()),null);
 state.users.clear();state.channels.clear();m.content='kitsune hi';throwStatus=true;eq(await handle(m),true,'visual helper cannot fail delivered response');eq(sent,2);
 state.users.clear();state.channels.clear();throwStatus=false;fail=true;const n=starts;const log=console.error;console.error=()=>{};try{eq(await handle(m),false);}finally{console.error=log;}eq(starts,n,'failed send creates no countdown');
 console.log(count+' actual reply delivery, real cooldown integration, stop and best-effort status checks passed. No real database or Discord calls.');
})().catch(error=>{console.error(error);process.exitCode=1;});
