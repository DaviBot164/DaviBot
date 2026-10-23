'use strict';
const assert=require('node:assert/strict'),path=require('node:path'),Module=require('node:module');
const root=process.argv[2]||path.resolve(__dirname,'..');
const {recognize}=require(path.join(root,'handlers/kitsune/language'));
let count=0;const eq=(a,b,label)=>{assert.deepEqual(a,b,label);count++;};
const cases=[
 ['your answer was confusing','answer_confusing'],['your reply is hard to follow','answer_confusing'],
 ['can u explain it without repeating yourself','explain_fresh'],['thats still the same answer','repetition_feedback'],
 ['im not insulting u im asking for a better explanation','explain_fresh'],
 ['i dont wanna talk about them tho','topic_boundary'],['i would rather not talk about those people','topic_boundary'],
 ['my friend is repeating himself',null],['that is the same answer but it is fine',null],['i am insulting you',null]
];
for(const [text,want]of cases)eq(recognize(text),want,text);
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
 send('kitsune today was exhausting');send('mostly because of work');
 eq(send('actually it wasnt the work it was the people').req.category,'day_people');
 eq(send('i dont wanna talk about them tho').req.category,'topic_boundary');
 send('lets talk about something else');eq(parse(msg('it wasnt the work it was the people'),100),null);
 const bad=send('kitsune your answer was confusing');eq(bad.req.category,'answer_confusing');assert.ok(!/stupid/i.test(bad.out.payload.content));count++;
 const first=send('can u explain it without repeating yourself');eq(first.req.category,'explain_fresh');
 const second=send('thats still the same answer');eq(second.req.category,'repetition_feedback');assert.notEqual(first.out.payload.content,second.out.payload.content);count++;
 const third=send('im not insulting u im asking for a better explanation');eq(third.req.category,'explain_fresh');assert.notEqual(second.out.payload.content,third.out.payload.content);count++;
 eq(session.explanationStep,3);send('lets start over');eq(session.explanationStep,0);
 send('kitsune pick tea / coffee');const choice=send('can you explain it without repeating yourself');assert.ok(/random/.test(choice.out.payload.content));count++;

}
session=null;eq(parse(msg('nah the other one'),100),null);eq(parse(msg('wait lemme explain'),100),null);
session={category:'pick',pickOptions:['tea','coffee'],pickSelected:'tea',messageId:'last',implicitUntil:200};
eq(parse(msg('nah the other one'),201),null);eq(parse(msg('nah the other one',{messageId:'other'}),100),null);
const {recognizeDayConversation}=require(path.join(root,'handlers/kitsune/dayConversation'));
for(const [noun,category]of [['work','day_work'],['school','day_study'],['people','day_people'],['family','day_people']]) {
 const other=noun==='work'?'people':'work';
 eq(recognizeDayConversation(`it was not the ${other} it was the ${noun}`,{category:'day_work'}),category);
 eq(recognizeDayConversation(`it was not the ${other} it was the ${noun}`,{category:'pick'}),null);
}
for(const noun of ['answer','reply','response'])for(const word of ['confusing','unclear','hard to follow'])eq(recognize('your '+noun+' was '+word),'answer_confusing');
for(const object of ['them','those people','work','school','my boss'])eq(recognize('i dont want to talk about '+object),'topic_boundary');
const {repairExplanation}=require(path.join(root,'handlers/kitsune/explanationRepair'));
eq(repairExplanation({category:'repetition_feedback'}).payload.content,'Which answer do you mean? Paste the sentence or step you want explained.');
console.log(`${count} reason correction, topic boundary and explanation repair checks passed.`);
