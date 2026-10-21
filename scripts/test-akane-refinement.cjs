'use strict';
const assert=require('node:assert/strict'),path=require('node:path'),Module=require('node:module');
const root=process.argv[2]||path.resolve(__dirname,'..');
const {recognize}=require(path.join(root,'handlers/akane/language'));
let count=0;const eq=(a,b,label)=>{assert.deepEqual(a,b,label);count++;};
const cases=[
 ['neither i changed my mind','choices_rejected'],['neither of them','choices_rejected'],
 ['just talk to me dont give me advice','decline_advice'],['chat with me and dont offer me advice','decline_advice'],
 ['can you help me with studying','study_start'],['i need help with my homework','study_start'],
 ['could you please help me with schoolwork','study_start'],
 ['yes thats what i meant','feedback_understood'],['that is exactly what i meant','feedback_understood'],
 ['my friend needs help with studying',null],['can you help me with hacking',null]
];
for(const [text,want]of cases)eq(recognize(text),want,text);
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
 send('akane pick tea / coffee');send('actually i meant tea or water');eq(session.pickOptions,['tea','water']);
 eq(send('neither, i changed my mind').req.category,'choices_rejected');eq(session.pickOptions,null);
 send('akane im tired');eq(send('not physically, mentally').req.category,'mental_tired');
 eq(send('just talk to me, dont give me advice').req.category,'decline_advice');eq(session.noAdviceRemaining,4);
 send('akane can you help me with studying');eq(session.category,'study_start');eq(session.pending.kind,'study_step');
 eq(send('i dont understand the topic').req.category,'study_understanding');
 eq(send('i already tried reading it twice').req.category,'study_alternative');
 send('akane you misunderstood me');eq(session.pending.kind,'repair');
 send('i meant your answer, not you');eq(session.category,'study_alternative');
 send('can you explain it more simply');eq(send('yes, thats what i meant').req.category,'feedback_understood');
}
session=null;eq(parse(msg('not physically mentally'),100),null);eq(parse(msg('i dont understand the topic'),100),null);
session={category:'tired',messageId:'last',implicitUntil:200};eq(parse(msg('not physically mentally'),201),null);eq(parse(msg('not physically mentally',{messageId:'other'}),100),null);
console.log(`${count} clarification, refusal and direct-study checks passed.`);
