'use strict';
const assert=require('node:assert/strict'),path=require('node:path'),Module=require('node:module');
const root=process.argv[2]||path.resolve(__dirname,'..');
const {recognize}=require(path.join(root,'handlers/kitsune/language'));
let count=0;const eq=(a,b,label)=>{assert.deepEqual(a,b,label);count++;};
const cases=[
 ['wasnt asking for advice btw','decline_advice'],['i didnt ask for tips','decline_advice'],
 ['i just wanted someone to talk to','chat_open'],['just kidding','joke_repair'],['relax i was joking','joke_repair'],
 ['can u say it another way','simplify'],['could you rephrase that','simplify'],
 ['wasnt talking about u i meant the answer','repair_answer'],
 ['my friend wanted someone to talk to',null],['i was asking for advice',null]
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
 send('kitsune pick tea / coffee');send('nah the other one');send('wait lemme explain');
 const cold=send('actually i meant something cold');eq(cold.req.category,'choice_preference');eq(session.pickOptions,null);eq(session.pending.kind,'choices');
 send('kitsune pick iced tea / cold water');assert.ok(['iced tea','cold water'].includes(session.pickSelected));count++;
 send('kitsune ngl im mentally drained rn');eq(send('wasnt asking for advice btw').req.category,'decline_advice');
 eq(send('just wanted someone to talk to').req.category,'chat_open');
 send('kitsune ur reply wasnt dumb just confusing');const simpler=send('can u say it another way');eq(simpler.req.category,'simplify');assert.ok(/unclear/.test(simpler.out.payload.content));count++;
 send('kitsune nice answer did u even read');eq(send('wasnt talking about u i meant the answer').req.category,'repair_answer');
 send('kitsune wow ur a genius arent u');eq(send('relax i was joking').req.category,'joke_repair');

}
session=null;eq(parse(msg('nah the other one'),100),null);eq(parse(msg('wait lemme explain'),100),null);
session={category:'pick',pickOptions:['tea','coffee'],pickSelected:'tea',messageId:'last',implicitUntil:200};
eq(parse(msg('nah the other one'),201),null);eq(parse(msg('nah the other one',{messageId:'other'}),100),null);
console.log(`${count} continuation, boundary and rephrasing checks passed.`);
