'use strict';
const assert=require('node:assert/strict'),path=require('node:path'),Module=require('node:module');
const root=process.argv[2]||path.resolve(__dirname,'..');
const {recognize}=require(path.join(root,'handlers/akane/language'));
let count=0;const eq=(a,b,label)=>{assert.deepEqual(a,b,label);count++;};
const cases=[
 ['im not sad anymore','mood_recovered'],['i am no longer sad','mood_recovered'],['i feel not upset any more','mood_recovered'],
 ['im not happy anymore','mood_lowered'],['i am no longer okay','mood_lowered'],
 ['i dont want advice','decline_advice'],['no advice please','decline_advice'],['i do not need your advice','decline_advice'],
 ['i want to talk, not play','talk_choice'],['i would rather chat not game','talk_choice'],
 ['i dont want to play i want to talk','talk_choice'],
 ['i never called you stupid','disavow_insult'],['i never said you were stupid','disavow_insult'],['i did not call you a clown','disavow_insult'],
 ['im not angry at you','tension_clear'],['i am not mad with you','tension_clear'],
 ['dont be rude to me','tone_gentle'],['please dont be mean to me','tone_gentle'],['stop being harsh with me','tone_gentle'],
 ['i dont think you are annoying','reaction_reassurance'],['you are not useless','reaction_reassurance'],
 ['you are useless','reaction_insult'],['you are a clown','reaction_insult'],
 ['my friend is no longer sad',null],['i never called my friend stupid',null],
 ['i do not want to talk about advice',null]
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
const {recognizeNegation}=require(path.join(root,'handlers/akane/negation'));
for(const text of ['i never said you were kind','he said i never called you stupid','i want to talk about playing','i am not sad','never mind'])eq(recognizeNegation(text),null,text);
for(const id of ['member',settings.OWNER_ID,settings.dialogue.maeId]){
 const m={guildId:'g',channelId:'c',author:{id}};
 const send=(text)=>{
  const req=parse(msg(text),100);assert.ok(req,text);count++;
  const out=respond(m,req);assert.ok(out.payload.content?.length>0,text);count++;
  session={...context.memoryAfter(session,req,out),category:out.category,messageId:'last',implicitUntil:200,question:out.question};
  return {req,out};
 };
 session=null;
 send('akane idk where to start');eq(session.pending.kind,'help_topic');
 send('with studying');eq(session.pending.kind,'study_step');
 send('yes');eq(session.pending.kind,'study_step');
 eq(send('too hard').req.category,'study_breakdown');eq(session.pending.kind,'study_step');
 eq(send('i cannot focus').req.category,'study_breakdown');
 send('change the subject');eq(session.pending,null);
 eq(parse(msg('too hard'),100),null);
 send('akane i dont want advice');eq(session.noAdviceRemaining,4);
 for(const cat of ['emotional_detail','feeling_bad','bored']){
  const req={category:cat,conversation:session};const out=respond(m,req);
  assert.ok(!/\badvice\b/i.test(out.payload.content));count++;
  session={...context.memoryAfter(session,req,out),category:out.category,messageId:'last',implicitUntil:200};
 }
 const explicit=send('akane tip');eq(explicit.req.category,'tip');eq(session.noAdviceRemaining,0);
 send('akane dont be rude to me');eq(session.mode.name,'gentle');
 const soft=send('you are useless');assert.ok(!soft.out.payload.content.includes('best shot'));count++;
 for(const category of ['mood_recovered','mood_lowered','decline_advice','talk_choice','disavow_insult','tension_clear','reaction_reassurance']){
  const out=respond(m,{category});eq(out.category,category);assert.ok(out.payload.content.length>10);count++;
  const why=respond(m,{category:'explain',context:category});eq(why.category,category);
 }
}
session=null;eq(parse(msg('too hard'),100),null);eq(parse(msg('no advice please'),100),null);
session={category:'study_step',pending:{kind:'study_step'},messageId:'last',implicitUntil:200};
eq(parse(msg('too hard'),201),null);eq(parse(msg('too hard',{messageId:'other'}),100),null);
console.log(`${count} negation, preference and sustained-followup checks passed.`);
