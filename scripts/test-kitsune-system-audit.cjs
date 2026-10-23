'use strict';
const assert=require('node:assert/strict'),path=require('node:path'),Module=require('node:module');
const root=process.argv[2]||path.resolve(__dirname,'..');
const {recognize}=require(path.join(root,'handlers/kitsune/language'));
let count=0;const eq=(a,b,label)=>{assert.deepEqual(a,b,label);count++;};
const cases=[];
for(const prefix of ['', 'ngl ', 'tbh '])for(const suffix of ['', ' rn', ' 😔', ' 🦊', ' rn 😔', ' 😔 rn']) {
 cases.push([prefix+'im sad'+suffix,'feeling_bad']);
 cases.push([prefix+'ur not stupid'+suffix,'reaction_reassurance']);
}
for(const form of ['pick again please','can u choose again','could you please pick once more','choose a different one please'])cases.push([form,'again']);
for(const form of ['could u help me study','can you help me learn','would you please help me with my homework'])cases.push([form,'study_start']);
for(const form of ['i dont understand your answer','im not sure what you mean','what do you mean by this'])cases.push([form,'explain']);
for(const word of ['mf','btch','idi0t','loser'])for(const form of [`are u a ${word}`,`why r u such a ${word}`])cases.push([form,'reaction_insult']);
cases.push(['ur not a mf','reaction_reassurance'],['ur not a btch','reaction_reassurance']);
for(const [text,want]of cases)eq(recognize(text),want,text);
for(const text of ['my friend is sad 😔','i am not sure what my friend means','someone said "are u a mf"','are you not a mf','butterfly'])eq(recognize(text),null,text);
const original=Module._load;let session;
const parserPath=path.join(root,'handlers/kitsune/parser.js'),responsePath=path.join(root,'handlers/kitsune/responses.js'),statePath=path.join(root,'handlers/kitsune/state.js');
const pools={};
Object.assign(pools,require(path.join(root,'config/kitsuneReplies')));
for(const [category,pool] of Object.entries(require(path.join(root,'config/kitsunePersonality')).ownerReplies)) pools['owner_'+category]=pool;
for(const [category,pool] of Object.entries(require(path.join(root,'config/kitsuneDialogue')).pools)) pools['dialogue_'+category]=pool;
const settings={OWNER_ID:'1357721282061533311',dialogue:{maeId:'1380278195961729084'},replies:pools,STATE_TTL:1800000};
Module._load=function(request,parent){
 if([parserPath,responsePath,statePath].includes(parent?.filename)&&request==='./settings')return settings;
 if(parent?.filename===parserPath&&request==='./state')return{getSession:()=>session};
 if(parent?.filename===responsePath&&request==='discord.js')return{escapeMarkdown:x=>x};
 if(parent?.filename===responsePath&&request==='./help')return{buildHelp:()=>({})};
 return original.apply(this,arguments);
};
let parse,respond,context;
try{parse=require(parserPath).parseRequest;respond=require(responsePath).buildResponse;context=require(path.join(root,'handlers/kitsune/context'));}finally{Module._load=original;}
const msg=(content,reference)=>({content,reference,mentions:{}});
for(const id of ['member',settings.OWNER_ID,settings.dialogue.maeId]){
 const m={guildId:'g',channelId:'c',author:{id}};
 const send=(text)=>{
  const req=parse(msg(text),100);assert.ok(req,text);count++;
  const out=respond(m,req);assert.ok(out.payload.content?.length>0,text);count++;
  session={...context.memoryAfter(session,req,out),category:out.category,messageId:'last',implicitUntil:200,question:out.question};
  return {req,out};
 };
 session=null;
 send('kitsune pick tea / coffee');
 for(const text of ['pick again please','can u choose again','choose a different one please']) {
  const item=send(text);eq(item.req.category,'again');eq(item.out.category,'pick');eq(session.pickOptions,['tea','coffee']);
 }
 const low=send('kitsune i feel sad but i dont want any advice');eq(low.req.category,'feeling_bad');eq(low.req.declineAdvice,true);eq(session.noAdviceRemaining,4);
 assert.ok(/No advice; I am listening/.test(low.out.payload.content));count++;
 assert.ok(!low.out.emojiAdded);count++;
 for(const text of ['im tired and no tips','i am lonely but i do not need suggestions']) {
  const item=send('kitsune '+text);eq(item.req.declineAdvice,true);eq(session.noAdviceRemaining,4);assert.ok(!item.out.emojiAdded);count++;
 }
 send('kitsune hi 🦊');eq(session.category,'hi');
 eq(parse(msg('kitsune '+ 'x'.repeat(2001)),100),null);
 session={category:'nice',messageId:'last',implicitUntil:200,pending:{kind:'mood'}};
 eq(parse(msg('great',{messageId:'someone-else'}),100),null);

}
session=null;eq(parse(msg('nah the other one'),100),null);eq(parse(msg('wait lemme explain'),100),null);
session={category:'pick',pickOptions:['tea','coffee'],pickSelected:'tea',messageId:'last',implicitUntil:200};
eq(parse(msg('nah the other one'),201),null);eq(parse(msg('nah the other one',{messageId:'other'}),100),null);
const {recognizeDetails,extractChoice}=require(path.join(root,'handlers/kitsune/language'));
for(const word of ['sad','upset','tired','exhausted','lonely','stressed'])for(const refusal of ['i do not want advice','i do not need any tips','no suggestions']) {
 const details=recognizeDetails('i feel '+word+' but '+refusal);eq(details.declineAdvice,true);
}
for(const text of ['pick again please','can u choose again'])eq(extractChoice(text),null);
eq(extractChoice('pick tea / coffee'),'tea / coffee');
console.log(`${count} audit regression and sentence-form checks passed.`);
