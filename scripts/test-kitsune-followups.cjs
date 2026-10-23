'use strict';
const assert=require('node:assert/strict'),path=require('node:path'),Module=require('node:module');
const root=process.argv[2]||path.resolve(__dirname,'..');
const {recognize}=require(path.join(root,'handlers/kitsune/language'));
let count=0;const eq=(a,b,label)=>{assert.deepEqual(a,b,label);count++;};
for(const text of ['i just feel sad','i really feel sad','i just feel upset','i just feel stressed'])eq(recognize(text),'feeling_bad',text);
for(const text of ['i just feel tired','i really feel sleepy'])eq(recognize(text),'tired',text);
const original=Module._load;let session;
const parserPath=path.join(root,'handlers/kitsune/parser.js'),responsePath=path.join(root,'handlers/kitsune/responses.js'),statePath=path.join(root,'handlers/kitsune/state.js');
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
try{parse=require(parserPath).parseRequest;respond=require(responsePath).buildResponse;context=require(path.join(root,'handlers/kitsune/context'));}finally{Module._load=original;}
const msg=(content,reference)=>({content,reference,mentions:{}});
const {followupCategory,attachExpectation}=require(path.join(root,'handlers/kitsune/followups'));
const mood={pending:{kind:'wellbeing'}};
for(const text of ['my mood','emotionally','mentally','i mean my mood'])eq(followupCategory(text,mood),'emotional_detail',text);
for(const text of ['physically','my body','i mean physically'])eq(followupCategory(text,mood),'physical_detail',text);
eq(followupCategory('both',mood),'mixed_wellbeing');
for(const text of ['my mood','physically','with studying'])eq(followupCategory(text,null),null,text);
eq(followupCategory('physically',{pending:{kind:'help_topic'}}),null);
for(const text of ['with studying','studying','homework','with school'])eq(followupCategory(text,{pending:{kind:'help_topic'}}),'study_start',text);
for(const text of ['advice','a distraction','a pause'])assert.ok(followupCategory(text,{pending:{kind:'mood_support'}})),count++;
for(const id of ['member',settings.OWNER_ID,settings.dialogue.maeId]){
 const m={guildId:'g',channelId:'c',author:{id}};
 for(const [start,short,category]of [['not_well','my mood','emotional_detail'],['not_well','physically','physical_detail'],['feeling_stuck','with studying','study_start'],['help_offer','homework','study_start']]){
  const first=respond(m,{category:start});assert.ok(first.pending);count++;
  session={...context.memoryAfter(null,{category:start},first),category:first.category,messageId:'last',implicitUntil:200};
  eq(parse(msg(short),100).category,category,short);
  eq(parse(msg(short),201),null);eq(parse(msg(short,{messageId:'other'}),100),null);
  const next=respond(m,parse(msg(short),100));eq(next.category,category);assert.ok(next.payload.content.length>10);count++;
  if(category==='study_start'){
   session={...context.memoryAfter(session,{category},next),category:next.category,messageId:'next',implicitUntil:200};
   eq(parse(msg('yes'),100).category,'study_step');eq(parse(msg('too hard'),100).category,'study_breakdown');
  }
 }
 const first=respond(m,{category:'not_well'});
 const explained=respond(m,{category:'explain',context:'not_well',conversation:{pending:first.pending}});eq(explained.pending.kind,'wellbeing');
 const hesitant=respond(m,{category:'context_hesitant',conversation:{pending:first.pending}});eq(hesitant.pending.kind,'wellbeing');
 const topic=respond(m,{category:'topic_change',conversation:{pending:first.pending}});eq(topic.pending,null);
}
session=null;for(const text of ['my mood','physically','with studying'])eq(parse(msg(text),100),null,text);
session={category:'not_well',pending:{kind:'wellbeing'},messageId:'last',implicitUntil:200};
eq(parse(msg('kitsune i just feel sad'),100).category,'feeling_bad');
console.log(`${count} clarification and short-answer checks passed.`);
