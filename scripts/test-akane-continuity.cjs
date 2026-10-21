'use strict';
const assert=require('node:assert/strict'),path=require('node:path'),Module=require('node:module');
const root=process.argv[2]||path.resolve(__dirname,'..');
const {recognize}=require(path.join(root,'handlers/akane/language'));
let count=0;const eq=(a,b,label)=>{assert.deepEqual(a,b,label);count++;};
const cases=[
 ['i dont want to talk about it','topic_boundary'],['i would rather not talk about that','topic_boundary'],
 ['thats better','feedback_better'],['that is much better','feedback_better'],
 ['lets change the subject','topic_change'],["let's change the subject",'topic_change'],
 ['why did you choose that','explain'],['why did you pick it','explain'],
 ['choose again','again'],['pick again','again'],
 ['i was angry earlier but im calm now','feeling_neutral'],
 ['i like your jokes but not when im upset','tone_gentle'],
 ['can you explain that without making fun of me','explain_gentle'],
 ['could you explain it without jokes','explain_gentle'],
 ['my friend is calm now',null],['i like your jokes but my friend is upset',null]
];
for(const [text,want]of cases)eq(recognize(text),want,text);
const {extractChoice}=require(path.join(root,'handlers/akane/language'));
eq(extractChoice('choose again'),null);eq(extractChoice('pick again'),null);eq(extractChoice('pick tea / coffee'),'tea / coffee');
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
 send('akane im feeling sad');eq(send('because i had a bad day').req.category,'bad_day_context');
 eq(send('i dont want to talk about it').req.category,'topic_boundary');eq(session.pending,null);
 eq(parse(msg('because i had a bad day'),100),null);
 send('akane i dont know whether to play or study');eq(session.pickOptions,['play','study']);
 const why=send('why did you choose that');eq(why.out.category,'pick');assert.ok(/random/i.test(why.out.payload.content));count++;
 eq(session.pickOptions,['play','study']);
 for(let i=0;i<4;i++){
  const again=send('choose again');eq(again.out.category,'pick');assert.ok(/play|study/.test(again.out.payload.content));count++;
  eq(session.pickOptions,['play','study']);
 }
 send('lets change the subject');eq(session.pickOptions,null);
 const gentle=send('akane can you explain that without making fun of me');eq(gentle.out.modeChange,'gentle');eq(session.mode.name,'gentle');
 eq(send('thats better').req.category,'feedback_better');eq(session.mode.name,'gentle');
}
session=null;eq(parse(msg('because i had a bad day'),100),null);eq(parse(msg('choose again'),100),null);
session={category:'feeling_bad',messageId:'last',implicitUntil:200};
eq(parse(msg('because i had a bad day'),201),null);eq(parse(msg('because i had a bad day',{messageId:'other'}),100),null);
const missing=respond({guildId:'g',channelId:'c',author:{id:'member'}},{category:'again',context:'pick',conversation:{}});eq(missing.category,'fallback');
console.log(`${count} context continuation and repeat-choice checks passed.`);
