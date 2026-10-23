'use strict';
const assert=require('node:assert/strict'),path=require('node:path'),Module=require('node:module');
const root=process.argv[2]||path.resolve(__dirname,'..');
const {recognize}=require(path.join(root,'handlers/kitsune/language'));
let count=0;const eq=(a,b,label)=>{assert.deepEqual(a,b,label);count++;};
const cases=[
 ['ngl im kinda drained rn','tired'],['idk how to explain it tho','expression_uncertain'],
 ['wasnt talking about u btw','target_correction'],['i was not talking about you','target_correction'],
 ['nah the other one','pick_other'],['choose the other option please','pick_other'],
 ['wait lemme explain','explain_wait'],['hold on let me explain','explain_wait'],
 ['u fr','confirm_request'],['are u for real','confirm_request'],
 ['bro what r u on about','explain'],['dude what are you talking about','explain'],
 ['nice answer did u even read','answer_feedback'],
 ['wow ur a genius arent u','ambiguous_tease'],['you are so clever arent you','ambiguous_tease'],
 ['ur reply was dumb didnt say u were','answer_feedback'],
 ['ur reply wasnt dumb just confusing','answer_confusing'],
 ['your answer is not stupid it is just unclear','answer_confusing'],
 ['dumb wasnt what i called you','disavow_insult'],
 ['my friend was not talking about you',null],['my reply was confusing',null],
 ['brother of mine is a genius',null],['my friend said you are a genius arent you',null]
];
for(const [text,want]of cases)eq(recognize(text),want,text);
for(const noun of ['answer','reply','response'])for(const word of ['dumb','stupid','useless']){
 eq(recognize(`ur ${noun} wasnt ${word} just confusing`),'answer_confusing');
 eq(recognize(`ur ${noun} was ${word} didnt say u were`),'answer_feedback');
}
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
 const noContext=send('kitsune u fr');eq(noContext.out.payload.content,'Which part are you asking about?');
 send('kitsune pick tea / coffee');const first=session.pickSelected;assert.ok(['tea','coffee'].includes(first));count++;
 const other=send('nah the other one');eq(other.out.category,'pick');assert.notEqual(session.pickSelected,first);count++;
 send('the other one');eq(session.pickSelected,first);
 const confirm=send('u fr');eq(confirm.out.category,'pick');assert.ok(/random/i.test(confirm.out.payload.content));count++;
 send('wait lemme explain');eq(session.pending.kind,'repair');eq(session.pickOptions,['tea','coffee']);
 const multi=respond(m,{category:'pick_other',conversation:{pickOptions:['a','b','c'],pickSelected:'a'}});eq(multi.category,'clarify');
 for(const category of ['target_correction','answer_confusing','ambiguous_tease']){
  const out=respond(m,{category});eq(out.category,category);assert.ok(out.payload.content.length>15);count++;
 }
 const polite=respond(m,{category:'ambiguous_tease',conversation:{mode:{name:'gentle',remaining:4}}});assert.ok(polite.payload.content.includes('straightforward'));count++;
}
session=null;eq(parse(msg('nah the other one'),100),null);eq(parse(msg('wait lemme explain'),100),null);
session={category:'pick',pickOptions:['tea','coffee'],pickSelected:'tea',messageId:'last',implicitUntil:200};
eq(parse(msg('nah the other one'),201),null);eq(parse(msg('nah the other one',{messageId:'other'}),100),null);
console.log(`${count} casual chat, other-choice and feedback checks passed.`);
