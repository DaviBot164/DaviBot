'use strict';
const assert=require('node:assert/strict'),path=require('node:path'),Module=require('node:module');
const root=process.argv[2]||path.resolve(__dirname,'..');
const {recognize}=require(path.join(root,'handlers/akane/language'));
let count=0;const eq=(a,b,label)=>{assert.deepEqual(a,b,label);count++;};
for(const text of ['lets talk about something fun instead','let us talk about something lighter','can we talk about something else'])eq(recognize(text),'topic_change',text);
for(const text of ['can you explain it more simply','explain that in simpler words','make it simpler'])eq(recognize(text),'simplify',text);
const {correctedChoice}=require(path.join(root,'handlers/akane/language'));
eq(correctedChoice('actually i meant tea or water'),'tea / water');eq(correctedChoice('i meant tea or coffee or water'),null);
const original=Module._load;let session;
const parserPath=path.join(root,'handlers/akane/parser.js'),responsePath=path.join(root,'handlers/akane/responses.js'),statePath=path.join(root,'handlers/akane/state.js');
const pools={};
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
 send('akane pick tea / coffee');eq(session.pickOptions,['tea','coffee']);
 send('actually i meant tea or water');eq(session.pickOptions,['tea','water']);
 const changed=send('choose again');assert.ok(!changed.out.payload.content.includes('coffee'));count++;
 send('lets talk about something fun instead');eq(session.pickOptions,null);
 eq(parse(msg('actually i meant tea or water'),100),null);
 send('akane can you help me with something');send('with studying');send('yes');
 const tried=send('i already tried that');eq(tried.req.category,'study_alternative');eq(session.pending.kind,'study_step');
 const different=send('can you suggest a different approach');eq(different.req.category,'study_alternative');assert.notEqual(different.out.payload.content,tried.out.payload.content);count++;
 const repair=send('akane you misunderstood me');eq(repair.req.category,'repair');eq(session.pending.kind,'repair');eq(session.category,'study_alternative');
 const detail=send('i meant your answer, not you');eq(detail.req.category,'repair_answer');eq(session.category,'study_alternative');eq(session.pending,null);
 const simpler=send('can you explain it more simply');eq(simpler.req.category,'simplify');assert.ok(simpler.out.payload.content.includes('explaining one idea'));count++;
}
session=null;eq(parse(msg('i already tried that'),100),null);eq(parse(msg('actually i meant tea or water'),100),null);
session={category:'study_step',pending:{kind:'study_step'},messageId:'last',implicitUntil:200};
eq(parse(msg('i already tried that'),201),null);eq(parse(msg('i already tried that',{messageId:'other'}),100),null);
session={category:'pick',pickOptions:['tea','coffee'],messageId:'last',implicitUntil:200};
eq(parse(msg('actually i meant tea or water',{messageId:'other'}),100),null);
console.log(`${count} correction, alternative-method and simplification checks passed.`);
