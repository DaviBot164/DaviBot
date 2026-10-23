'use strict';
const assert=require('node:assert/strict'),path=require('node:path'),Module=require('node:module');
const root=process.argv[2]||path.resolve(__dirname,'..');
const {recognize}=require(path.join(root,'handlers/kitsune/language'));
let count=0;const eq=(a,b,label)=>{assert.deepEqual(a,b,label);count++;};
const cases=[];
for(const phrase of ['just listen','please listen to me','let me vent','hear me out','i just need to vent','can i vent','i need to get this off my chest','not looking for solutions','im not looking for solutions','i dont want advice just listen','just listen i dont need tips','i dont want suggestions but hear me out'])cases.push([phrase,'decline_advice']);
for(const [text,want]of cases)eq(recognize(text),want,text);
for(const phrase of ['my friend needs to vent','do not listen to me','i need advice','i am looking for solutions','listen to music'])assert.notEqual(recognize(phrase),'decline_advice');
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
 const send=text=>{const req=parse(msg(text),100);assert.ok(req,text);count++;const out=respond(m,req);assert.ok(out.payload.content?.length,text);count++;session={...context.memoryAfter(session,req,out),category:out.category,messageId:'last',implicitUntil:200,question:out.question};return {req,out};};
 session=null;
 send('kitsune i just want someone to listen');eq(session.noAdviceRemaining,4);
 eq(send('work has been getting on my nerves lately').req.category,'day_work_stress');
 eq(send('not the job itself mostly the people').req.category,'day_people');
 eq(send('i dont wanna name anyone').req.category,'day_privacy');
 eq(session.noAdviceRemaining,1);
 send('kitsune change the subject');eq(parse(msg('not the job itself mostly the people'),100),null);eq(parse(msg('i dont wanna name anyone'),100),null);
 session=null;
 send('kitsune not asking for a solution just some company');
 eq(send('i keep trying but nothing seems to work').req.category,'effort_stuck');
 eq(send('im not giving up tho').req.category,'effort_continue');
 const advice=send('actually a little advice would help now');eq(advice.req.category,'advice_resume');eq(session.noAdviceRemaining,0);eq(session.pending.kind,'help_topic');assert.ok(/what are you trying/i.test(advice.out.payload.content));count++;
 eq(send('with studying').req.category,'study_start');
 send('kitsune pick tea / coffee');eq(parse(msg('not the job itself mostly the people'),100),null);
 eq(parse(msg('i keep trying but nothing seems to work'),100),null);
 eq(parse(msg('i dont wanna name anyone',{messageId:'someone-else'}),100),null);
 session=null;eq(parse(msg('im not giving up tho'),100),null);
}
for(const phrase of ['a little advice would help now','some advice could help','your advice might help me now','i could use some advice now','i want advice after all'])eq(recognize(phrase),'advice_resume');
for(const phrase of ['advice would not help now','i dont want advice now','my friend needs advice now','work has not been getting on my nerves','i am giving up'])assert.notEqual(recognize(phrase),'advice_resume',phrase);
const {recognizeDayConversation}=require(path.join(root,'handlers/kitsune/dayConversation'));
for(const subject of ['work','my job','school','studying'])for(const predicate of ['getting on my nerves','stressing me out','wearing me down'])eq(recognizeDayConversation(subject+' has been '+predicate+' lately'),['work','my job'].includes(subject)?'day_work_stress':'day_study');
for(const phrase of ['i do not want to name anyone','i would rather not say their names','i do not wish to name names']){
 eq(recognizeDayConversation(phrase,{category:'day_people'}),'day_privacy');eq(recognizeDayConversation(phrase,{category:'pick'}),null);
}
for(const predicate of ['nothing seems to work','nothing is working','it does not work'])eq(recognizeDayConversation('i keep trying but '+predicate,{category:'decline_advice',noAdviceRemaining:3}),'effort_stuck');
for(const phrase of ['i am not giving up','i will not give up','i am not quitting','i will not quit'])eq(recognizeDayConversation(phrase,{category:'effort_stuck'}),'effort_continue');
console.log(count+' listening-story continuation, privacy and explicit advice-switch checks passed.');
