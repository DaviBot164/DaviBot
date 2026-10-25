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
let parse,respond,context,state;
try{
 parse=require(parserPath).parseRequest;respond=require(responsePath).buildResponse;
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
for(const start of ['lets',"let's",'let us','can we','could we'])for(const action of ['stop','end this chat','end the conversation'])for(const end of ['',' now',' for now'])eq(recognize(start+' '+action+end),'stop');
for(const text of ['dont stop','lets not stop','can we stop studying','my friend said lets stop','lets stop him from playing','stop the music','can we end the world'])ok(recognize(text)!=='stop',text);
for(const id of [settings.OWNER_ID,settings.dialogue.maeId,'member']){
 state.sessions.clear();
 send('kitsune hi','hi',id);send('hru','mood',id);send('good','feeling_good',id);
 send('wyd','activity',id);send('im playing','gaming',id);
 const turn=send('wbu','activity',id);
 ok(/talk|chat|answer|reply|conversation|expression/i.test(turn.out.payload.content));
 ok(!/holding the controls|tactical fights|sharp contest/i.test(turn.out.payload.content),'reciprocity about activity');
 send('kitsune can you help me study','study_start',id);
 send('sure','study_step',id);send('too hard','study_breakdown',id);send('another way?','study_alternative',id);send('nah','no',id);
 const req=parse(message('lets stop',id),now);eq(req.category,'stop');
 const out=respond(message('lets stop',id),req);eq(out.session,false);eq(out.category,'stop');ok(out.payload.content.length>0);
 // Taste questions still refer to taste after an explicit games discussion.
 send('kitsune lets talk about games','game_chat',id);send('mostly pvp','game_competitive',id);send('wbu','game_preferences',id);
}
// Force every activity reply so coverage never depends on the shuffled choice.
for(const [id,tone]of [[settings.OWNER_ID,'owner'],[settings.dialogue.maeId,'mae'],['member','public']]){
 const key='conversation_'+tone+'_activity';
 for(const line of settings.replies[key]){
  state.sessions.clear();
  send('kitsune im playing','gaming',id);
  state.getReplyState(message('wbu',id)).bags.set(key,{remaining:[line],last:null});
  const turn=send('wbu','activity',id);
  ok(/talk|chat|answer|reply|conversation|expression/i.test(turn.out.payload.content),'valid activity reply: '+line);
  ok(!/holding the controls|tactical fights|sharp contest/i.test(turn.out.payload.content),'activity rather than game taste');
 }
}
// Exercise the real send/stop path with mocked Discord transport and learning.
const mainPath=path.join(root,'handlers/kitsuneReplyHandler.js');
const transportSettings={...settings,USER_COOLDOWN:3000,CHANNEL_COOLDOWN:2000,SESSION_TTL:120000};
Module._load=function(request,parent){
 if(parent?.filename===mainPath&&request==='./kitsune/knowledgeRuntime')return{findKnowledge:async()=>null};
 if(parent?.filename===mainPath&&request==='./kitsune/learningRuntime')return{inputForLearning:()=>null,enabled:()=>false};
 if(parent?.filename===mainPath&&request==='discord.js')return{PermissionFlagsBits:{SendMessagesInThreads:1,SendMessages:2,ViewChannel:4,ReadMessageHistory:8,EmbedLinks:16}};
 if(parent?.filename===mainPath&&request==='./kitsune/settings')return transportSettings;
 if(parent?.filename===mainPath&&request==='./kitsune/help')return{plainHelp:()=> 'Help'};
 return original.apply(this,arguments);
};
let handle;
try{handle=require(mainPath).handleKitsuneReply;}finally{Module._load=original;}
(async()=>{
 state.sessions.clear();state.users.clear();state.channels.clear();
 let replies=0;
 const m={...message('kitsune can you help me study'),inGuild:()=>true,guild:{members:{me:{}}},channel:{permissionsFor:()=>({has:()=>true}),isThread:()=>false},reply:async()=>({id:'sent-'+(++replies)})};
 eq(await handle(m),true);ok(state.getSession(m,Date.now()));
 // Cooldown suppresses sending, but stopping must still remove the context.
 m.content='lets stop';eq(await handle(m),false);eq(state.getSession(m,Date.now()),null);eq(replies,1);
 state.users.clear();state.channels.clear();m.content='sure';eq(await handle(m),false);eq(replies,1);
 // Outside cooldown, the same short stop also sends an acknowledgement.
 m.content='kitsune can you help me study';eq(await handle(m),true);
 state.users.clear();state.channels.clear();m.content='lets stop';eq(await handle(m),true);eq(state.getSession(m,Date.now()),null);eq(replies,3);
 m.content='another way';eq(await handle(m),false);eq(replies,3);
 console.log(count+' short study turns, stop forms, activity reciprocity and actual send-path checks passed. No real database or Discord calls.');
})().catch(error=>{console.error(error);process.exitCode=1;});
