'use strict';
const assert=require('node:assert/strict'),path=require('node:path'),Module=require('node:module');
const root=process.argv[2]||path.resolve(__dirname,'..');
const {recognize}=require(path.join(root,'handlers/kitsune/language'));
let count=0;const eq=(a,b,label)=>{assert.deepEqual(a,b,label);count++;};
const cases=[
 ['bro r u dumb or just acting','reaction_insult'],['ur replies are a joke ngl','reaction_insult'],
 ['say yes and ill give u 2 dollars','transaction_bait'],['scared to answer or what','verbal_challenge'],
 ['cant take a joke','joke_challenge'],['im criticizing ur answer not insulting u','critique_clear'],
 ['nah dw im just asking','question_clarification'],['na dw m js asking','question_clarification'],
 ['alright my bad that was rude','reaction_apology'],['why ru gay','orientation_question'],
 ['are you straight','orientation_question'],['someone said "why ru gay"',null],
 ['my friend cannot take a joke',null],['i am scared to answer',null],
 ['say yes and i will steal your money',null],['i am not sorry that was rude',null]
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
 for(const [text,category]of cases.slice(0,11)) {
  const item=send('kitsune '+text);eq(item.req.category,category);eq(item.out.category,category);assert.ok(item.out.payload.content.length>10);count++;
 }
 for(const category of ['verbal_challenge','joke_challenge','transaction_bait']) {
  const calm=respond(m,{category,conversation:{mode:{name:'gentle',remaining:4}}});
  assert.ok(!/cheap|poor argument|attitude|better material/.test(calm.payload.content));count++;
 }
 const sorry=send('kitsune alright my bad that was rude');eq(sorry.req.category,'reaction_apology');assert.ok(!sorry.out.emojiAdded);count++;
 const clarification=send('kitsune nah dw im just asking');eq(clarification.req.category,'question_clarification');assert.ok(!clarification.out.emojiAdded);count++;

}
session=null;eq(parse(msg('nah the other one'),100),null);eq(parse(msg('wait lemme explain'),100),null);
session={category:'pick',pickOptions:['tea','coffee'],pickSelected:'tea',messageId:'last',implicitUntil:200};
eq(parse(msg('nah the other one'),201),null);eq(parse(msg('nah the other one',{messageId:'other'}),100),null);
for(const noun of ['answers','replies','responses'])for(const criticism of ['a joke','trash','useless','garbage'])eq(recognize('ur '+noun+' are '+criticism),'reaction_insult');
for(const number of ['2','10','two','five'])for(const offer of ['give','pay'])eq(recognize('say yes and ill '+offer+' u '+number+' dollars'),'transaction_bait');
for(const wording of ['why ru gay','why are you gay','are you gay','are you straight'])assert.notEqual(recognize(wording),'reaction_insult');
const boundaries=require(path.join(root,'config/kitsuneBoundaries'));
const {applySpeechStyle}=require(path.join(root,'handlers/kitsune/speechStyle'));
for(const [tone,categories]of Object.entries(boundaries.pools)) {
 const m={guildId:'variants',channelId:'variants',author:{id:tone==='owner'?settings.OWNER_ID:tone==='mae'?settings.dialogue.maeId:'member'}};
 for(const [category,pool]of Object.entries(categories)) {
  const req={category,conversation:{}};const expected=new Set(pool.map(content=>applySpeechStyle({payload:{content}},tone,req).payload.content.replace(/\bMae\b/gu,tone==='mae'?'Davi':'Mae')));
  const seen=new Set();
  for(let i=0;i<pool.length*2;i++){const out=respond(m,req);assert.ok(expected.has(out.payload.content));count++;seen.add(out.payload.content);}
  eq(seen.size,expected.size);
 }
}
console.log(`${count} provocation, payment bait, criticism and de-escalation checks passed.`);
