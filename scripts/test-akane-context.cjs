'use strict';
const assert = require('node:assert/strict');
const path = require('node:path');
const Module = require('node:module');
const root = process.argv[2] || path.resolve(__dirname,'..');
const load = name => require(path.join(root,name));
const { contextualCategory, memoryAfter, decorate } = load('handlers/akane/context.js');
let count=0;
function eq(a,b){assert.deepEqual(a,b);count++;}
const base=(cat,content='Base reply')=>({payload:{content},category:cat,question:false,session:true});
eq(contextualCategory('bad',null),null);
eq(contextualCategory('bad',{pending:{kind:'mood'}}),'feeling_bad');
eq(contextualCategory('fine',{pending:{kind:'mood'}}),'feeling_good');
eq(contextualCategory('bad',{pending:{kind:'repair'}}),null);
eq(contextualCategory('be serious',null),'tone_serious');
eq(contextualCategory("that's not what I meant",null),'repair');
eq(contextualCategory('tea / coffee',{pending:{kind:'choices'}}),'context_choices');
eq(contextualCategory('tea / coffee',null),null);
for(const tone of ['owner','public','mae']) {
 let prev={};
 const control={category:'tone_gentle',conversation:prev,context:'nice'};
 const reply=decorate(base('tone_gentle'),tone,control);
 prev=memoryAfter(prev,control,reply);eq(prev.mode,{name:'gentle',remaining:4});
 for(let i=4;i>0;i--){
  const request={category:'roast',conversation:prev};
  const next=decorate(base('roast','HARSH'),tone,request);
  assert.ok(!next.payload.content.includes('HARSH'));count++;
  prev=memoryAfter(prev,request,next);eq(prev.mode?.remaining??0,i-1);
 }
 eq(decorate(base('roast','HARSH'),tone,{category:'roast',conversation:prev}).payload.content,'HARSH');
 const repaired=decorate(base('repair'),tone,{category:'repair',context:'nice',conversation:prev});
 eq(repaired.category,'nice');eq(repaired.pending.kind,'repair');
 const mood=decorate(base('mood'),tone,{category:'mood',conversation:prev});eq(mood.pending.kind,'mood');
 const explained=decorate(base('nice'),tone,{category:'explain',followup:true,conversation:{pending:{kind:'mood'}}});eq(explained.pending.kind,'mood');
 const stopped=decorate({...base('stop'),session:false},tone,{category:'stop',conversation:{mode:{name:'gentle',remaining:4}}});eq(stopped.session,false);
 const unsure=decorate(base('uncertain'),tone,{category:'uncertain',context:'mood',conversation:{pending:{kind:'mood'}}});eq(unsure.pending,undefined);
 const choosing=decorate(base('uncertain'),tone,{category:'uncertain',conversation:prev});eq(choosing.pending.kind,'choices');
 const repeated=decorate(base('roast','HARSH'),tone,{category:'again',conversation:{mode:{name:'gentle',remaining:4}}});assert.ok(!repeated.payload.content.includes('HARSH'));count++;
}
let history={};for(let i=0;i<20;i++)history=memoryAfter(history,{category:'hi'},base('hi'));eq(history.history.length,4);
// Isolated settings/reaction stubs; real parser, language and context modules.
let session;
const parserPath=path.join(root,'handlers/akane/parser.js');
const original=Module._load;
Module._load=function(request,parent){
 if(parent?.filename===parserPath){
  if(request==='./settings')return {OWNER_ID:'owner',dialogue:{maeId:'mae'},reactionPools:{insult:['x']}};
  if(request==='./state')return {getSession:()=>session};
  if(request==='../../config/akaneReactions')return {detectReaction:t=>t.includes('stupid')?'insult':null};
 }
 return original.apply(this,arguments);
};
let parseRequest;try{({parseRequest}=require(parserPath));}finally{Module._load=original;}
const msg=(content,reference)=>({content,reference,mentions:{}});
session=null;eq(parseRequest(msg('be nicer'),100),null);
session={messageId:'last',category:'mood',pending:{kind:'mood'},implicitUntil:200};
eq(parseRequest(msg('bad'),100).category,'feeling_bad');
eq(parseRequest(msg('bad'),201),null);
eq(parseRequest(msg('bad',{messageId:'other'}),100),null);
eq(parseRequest(msg('akane bad',{messageId:'other'}),100).category,'fallback');
eq(parseRequest(msg('be serious'),100).category,'tone_serious');
eq(parseRequest(msg('be serious'),100).conversation,session);
eq(parseRequest(msg('unrelated chat'),100),null);
session.pending={kind:'choices'};
eq(parseRequest(msg('tea / coffee'),100).argument,'tea / coffee');
eq(parseRequest(msg('tea / coffee',{messageId:'other'}),100),null);
eq(parseRequest(msg('tbh idk'),100).category,'uncertain');
session.pending={kind:'repair'};eq(parseRequest(msg('tone'),100).category,'repair_detail');
eq(decorate(base('tone_gentle'),'public',{category:'tone_gentle',conversation:{question:true}}).question,true);
eq(decorate(base('fallback'),'public',{category:'context_choices'}).pending.kind,'choices');
console.log(`${count} offline context checks passed.`);
// Exercise the real response wrapper and successful-send memory integration.
const fakeReplies={general:['General'],hi:['Hello'],nice:['A compliment.'],roast:['HARSH'],rate:['7/10. Dramatic judging.'],tip:['Take a break.'],owner_general:['Hello, handsome.'],owner_stop:['Good night, handsome.'],owner_mood:['Fine.'],owner_nice:['Lovely, handsome.'],owner_roast:['A gentle tease.'],owner_fallback:['Clearer, handsome?'],dialogue_mae_fallback:['Clearer, Mae?']};
const fakeSettings={USER_COOLDOWN:3000,CHANNEL_COOLDOWN:2000,SESSION_TTL:120000,STATE_TTL:1800000,OWNER_ID:'owner',dialogue:{maeId:'mae'},replies:fakeReplies,reactionPools:{}};
const responsePath=path.join(root,'handlers/akane/responses.js');
const statePath=path.join(root,'handlers/akane/state.js');
const mainPath=path.join(root,'handlers/akaneReplyHandler.js');
const discord={escapeMarkdown:x=>x.replace(/\*/g,'\\*'),PermissionFlagsBits:{ViewChannel:1,ReadMessageHistory:2,SendMessages:4,SendMessagesInThreads:8,EmbedLinks:16}};
Module._load=function(request,parent){
 if([responsePath,statePath,parserPath].includes(parent?.filename)&&request==='./settings')return fakeSettings;
 if(parent?.filename===mainPath&&request==='./akane/settings')return fakeSettings;
 if([mainPath,responsePath].includes(parent?.filename)&&request==='discord.js')return discord;
 if(parent?.filename===responsePath&&request==='./help')return {buildHelp:()=>({})};
 if(parent?.filename===mainPath&&request==='./akane/help')return {plainHelp:()=> 'Help'};
 return original.apply(this,arguments);
};
let buildResponse,store,handleAkaneReply;
try{
 ({buildResponse}=require(responsePath));store=require(statePath);
 // Discard the isolated parser cache so the main handler uses actual sessions.
 delete require.cache[parserPath];
 // Reaction module should not need real bot configuration during these tests.
 const innerLoad=Module._load;
 Module._load=function(request,parent){if(parent?.filename===parserPath&&request==='../../config/akaneReactions')return {detectReaction:()=>null};return innerLoad.apply(this,arguments);};
 ({handleAkaneReply}=require(mainPath));
} finally {Module._load=original;}
const userMessage={guildId:'g',channelId:'c',author:{id:'u'}};
for(const id of ['u','owner','mae']){
 const m={...userMessage,author:{id}};
 const reply=buildResponse(m,{category:'tone_serious'});eq(reply.modeChange,'serious');
 const mood=buildResponse(m,{category:'mood'});eq(mood.pending.kind,'mood');
 const choice=buildResponse(m,{category:'context_choices',argument:'tea / coffee'});eq(choice.category,'pick');assert.ok(/tea|coffee/.test(choice.payload.content));count++;
}
(async()=>{
 let serial=0;
 const message={...userMessage,content:'akane be nicer',inGuild:()=>true,guild:{members:{me:{}}},channel:{permissionsFor:()=>({has:()=>true}),isThread:()=>false},reply:async()=>({id:String(++serial)})};
 eq(await handleAkaneReply(message),true);
 let saved=store.getSession(message,Date.now());eq(saved.mode.remaining,4);
 store.users.clear();store.channels.clear();
 message.content='akane roast';
 message.reply=async()=>{throw Error('Simulated send failure');};
 const log=console.error;console.error=()=>{};
 try{eq(await handleAkaneReply(message),false);}finally{console.error=log;}
 eq(store.getSession(message,Date.now()).mode.remaining,4);
 store.users.clear();store.channels.clear();
 message.reply=async payload=>{assert.ok(!payload.content.includes('HARSH'));count++;return{id:String(++serial)};};
 eq(await handleAkaneReply(message),true);eq(store.getSession(message,Date.now()).mode.remaining,3);
 // Stop clears even while a cooldown is active.
 message.content='akane stop';eq(await handleAkaneReply(message),false);eq(store.getSession(message,Date.now()),null);
 console.log(`${count} total context and send-path checks passed.`);
})().catch(error=>{console.error(error);process.exitCode=1;});
