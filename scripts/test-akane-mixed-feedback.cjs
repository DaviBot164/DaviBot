'use strict';
const assert=require('node:assert/strict'),path=require('node:path'),Module=require('node:module');
const root=process.argv[2]||path.resolve(__dirname,'..');
const {recognize}=require(path.join(root,'handlers/akane/language'));
let count=0;const eq=(a,b,label)=>{assert.deepEqual(a,b,label);count++;};
const cases=[];
for(const insult of ['dumbass','stupid','useless','idi0t'])for(const noun of ['answer','reply','response']) {
 cases.push([`ur not a ${insult}, that ${noun} just made no sense`,'answer_confusing']);
 cases.push([`that ${noun} was confusing but you are not a ${insult}`,'answer_confusing']);
}
for(const token of ['fk u','fuk u','fuck you','stfu'])for(const source of ['someone','my friend','they'])cases.push([`${source} said "${token}", but i disagree`,'reported_disagreement']);
for(const praise of ['brilliant','great','nice','amazing'])for(const noun of ['answer','reply','response'])cases.push([`wow another ${praise} ${noun}, did u even read my question?`,'answer_feedback']);
cases.push(['someone said "fk u"',null],['my friend said fk u',null],['you are a dumbass','reaction_insult'],['you are not stupid','reaction_reassurance']);
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
 for(const text of ['akane ur not a dumbass that answer just made no sense','akane someone said "fk u" but i disagree','akane wow another brilliant answer did u even read my question']) {
  const {req,out}=send(text);assert.notEqual(req.category,'reaction_insult');count++;assert.ok(!/akane help/.test(out.payload.content));count++;
 }
 const shorter=send('can u say it another way');eq(shorter.req.category,'simplify');assert.ok(/which part was wrong/.test(shorter.out.payload.content));count++;

}
session=null;eq(parse(msg('nah the other one'),100),null);eq(parse(msg('wait lemme explain'),100),null);
session={category:'pick',pickOptions:['tea','coffee'],pickSelected:'tea',messageId:'last',implicitUntil:200};
eq(parse(msg('nah the other one'),201),null);eq(parse(msg('nah the other one',{messageId:'other'}),100),null);
console.log(`${count} mixed criticism, reported abbreviations and rephrasing checks passed.`);
