'use strict';
const assert=require('node:assert/strict'),path=require('node:path'),Module=require('node:module');
const root=process.argv[2]||path.resolve(__dirname,'..');
const {recognize}=require(path.join(root,'handlers/akane/language'));
let count=0;const eq=(a,b,label)=>{assert.deepEqual(a,b,label);count++;};
const cases=[
 ['nothing funny rn just a normal conversation','normal_chat'],['can we have a quiet conversation','normal_chat'],
 ['i just want a normal conversation instead','normal_chat'],['no jokes just talk','normal_chat'],
 ['today was exhausting','day_tiring'],['my day has been really stressful','day_tiring'],['i had a tiring day','day_tiring'],
 ['but im feeling a bit better now','day_easing'],['i feel slightly better','day_easing'],
 ['my friend feels better now',null],['today was not exhausting',null],['mostly because of work',null],['not because of work',null]
];
for(const [text,want]of cases)eq(recognize(text),want,text);
const original=Module._load;let session;
const parserPath=path.join(root,'handlers/akane/parser.js'),responsePath=path.join(root,'handlers/akane/responses.js'),statePath=path.join(root,'handlers/akane/state.js');
const pools={};
Object.assign(pools,require(path.join(root,'config/akaneReplies')));
for(const [category,pool] of Object.entries(require(path.join(root,'config/akanePersonality')).ownerReplies)) pools['owner_'+category]=pool;
for(const [category,pool] of Object.entries(require(path.join(root,'config/akaneDialogue')).pools)) pools['dialogue_'+category]=pool;
const settings={OWNER_ID:'1357721282061533311',dialogue:{maeId:'1380278195961729084'},replies:pools,STATE_TTL:1800000};
Module._load=function(request,parent){
 if([parserPath,responsePath,statePath].includes(parent?.filename)&&request==='./settings')return settings;
 if(parent?.filename===parserPath&&request==='./state')return{getSession:()=>session};
 if(parent?.filename===responsePath&&request==='discord.js')return{escapeMarkdown:x=>x};
 if(parent?.filename===responsePath&&request==='./help')return{buildHelp:()=>({})};
 return original.apply(this,arguments);
};
let parse,respond,context;
try{parse=require(parserPath).parseRequest;respond=require(responsePath).buildResponse;context=require(path.join(root,'handlers/akane/context'));}finally{Module._load=original;}
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
 const opening=send('akane just wanted someone to talk to');assert.ok(!/joke|music|secret/.test(opening.out.payload.content));count++;
 const normal=send('nothing funny rn just a normal conversation');eq(normal.req.category,'normal_chat');eq(normal.out.modeChange,'serious');
 const day=send('today was exhausting');eq(day.req.category,'day_tiring');assert.ok(!day.out.emojiAdded);count++;
 const work=send('mostly because of work');eq(work.req.category,'day_work');eq(work.out.category,'day_work');
 const bank=require(path.join(root,'config/akaneDayConversation')).pools[id===settings.OWNER_ID?'owner':id===settings.dialogue.maeId?'mae':'public'].day_work;
 const style=require(path.join(root,'handlers/akane/speechStyle')).applySpeechStyle;
 assert.ok(bank.some(content=>style({payload:{content}},id===settings.OWNER_ID?'owner':id===settings.dialogue.maeId?'mae':'public',work.req).payload.content===work.out.payload.content));count++;
 const better=send('but im feeling a bit better now');eq(better.req.category,'day_easing');
 send('akane change the subject');eq(parse(msg('mostly because of work'),100),null);
 send('akane pick tea / coffee');eq(parse(msg('mostly because of work'),100),null);
 send('akane today was tiring');eq(parse(msg('mostly because of work',{messageId:'other'}),100),null);
 eq(parse(msg('mostly because of work'),201),null);

}
session=null;eq(parse(msg('nah the other one'),100),null);eq(parse(msg('wait lemme explain'),100),null);
session={category:'pick',pickOptions:['tea','coffee'],pickSelected:'tea',messageId:'last',implicitUntil:200};
eq(parse(msg('nah the other one'),201),null);eq(parse(msg('nah the other one',{messageId:'other'}),100),null);
const {recognizeDayConversation}=require(path.join(root,'handlers/akane/dayConversation'));
for(const adjective of ['exhausting','tiring','draining','stressful','rough','long','busy'])for(const subject of ['today was','my day is','my day has been','i had a']) {
 eq(recognize(subject+' '+adjective+(subject==='i had a'?' day':'')),'day_tiring');
}
for(const [reason,category]of [['work','day_work'],['job','day_work'],['school','day_study'],['homework','day_study'],['people','day_people'],['family','day_people']]) {
 for(const prefix of ['mostly because of ','because of my ','mainly ',''])eq(recognizeDayConversation(prefix+reason,{category:'day_tiring'}),category);
 eq(recognizeDayConversation('because of '+reason,{category:'pick'}),null);
}
const banks=require(path.join(root,'config/akaneDayConversation')).pools;
for(const [tone,categories]of Object.entries(banks)) {
 const m={guildId:'all-variants',channelId:'variants',author:{id:tone==='owner'?settings.OWNER_ID:tone==='mae'?settings.dialogue.maeId:'member'}};
 const style=require(path.join(root,'handlers/akane/speechStyle')).applySpeechStyle;
 for(const [category,pool]of Object.entries(categories)) {
  const req={category,conversation:{}};
  const expected=new Set(pool.map(content=>style({payload:{content}},tone,req).payload.content));
  const seen=new Set();
  for(let i=0;i<pool.length*2;i++) {
   const out=respond(m,req);eq(out.category,category);
   assert.ok(expected.has(out.payload.content),category+' variant belongs to the right pool');count++;
   seen.add(out.payload.content);
  }
  eq(seen.size,expected.size,'every reply variant exercised');
 }
}
console.log(`${count} ordinary conversation, reason scope and mood change checks passed.`);
