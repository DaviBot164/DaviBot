'use strict';
const assert=require('node:assert/strict'),path=require('node:path'),Module=require('node:module');
const root=process.argv[2]||path.resolve(__dirname,'..');
const {recognize}=require(path.join(root,'handlers/akane/language'));
let count=0;const eq=(a,b,label)=>{assert.deepEqual(a,b,label);count++;};
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
const {applyEmojiStyle}=require(path.join(root,'handlers/akane/emojiStyle'));
const emojiConfig=require(path.join(root,'config/akaneEmoji'));
const base=(category='hi',content='Hello. How are you?')=>({category,session:true,question:true,payload:{content}});
const allEmoji=/[\p{Extended_Pictographic}\p{Regional_Indicator}]/gu;
const {applySpeechStyle}=require(path.join(root,'handlers/akane/speechStyle'));
for(const tone of ['owner','mae','public']) {
 let memory={},seen=new Set(),recent=[];
 for(let turn=1;turn<=80;turn++) {
  const req={category:'hi',conversation:memory};const out=applyEmojiStyle(base(),tone,req);
  eq(Boolean(out.emojiAdded),turn%4===0);
  if(out.emojiAdded) {
   assert.ok(!recent.includes(out.emojiLast));count++;
   recent=[...recent,out.emojiLast].slice(-2);seen.add(out.emojiLast);
  }
  memory=context.memoryAfter(memory,req,out);
  assert.ok((memory.emojiRecent??[]).length<=2);count++;
 }
 assert.ok(seen.size>=6,'broad emoji variety for '+tone);count++;
 for(const [category,group]of [['thanks','thanks'],['secret','secret'],['joke','amused']]) {
  const req={category,conversation:{emojiTurns:3}};
  const out=applyEmojiStyle(base(category),tone,req);
  assert.ok(emojiConfig.expressions[group][tone].includes(out.emojiLast));count++;
 }
 for(const category of ['feeling_bad','day_tiring','day_work','day_easing','decline_advice','physical_detail','sexual_boundary']) {
  eq(applyEmojiStyle(base(category),tone,{category,conversation:{emojiTurns:4}}).emojiAdded,undefined);
 }
 for(const name of ['serious','gentle'])eq(applyEmojiStyle(base(),tone,{category:'hi',conversation:{emojiTurns:4,mode:{name,remaining:4}}}).emojiAdded,undefined);
 const snapshot={emojiTurns:3,emojiCount:2,emojiLast:'🦊',emojiRecent:['😌','🦊']};
 const before=JSON.stringify(snapshot);const req={category:'hi',conversation:snapshot};
 eq(applyEmojiStyle(base(),tone,req),applyEmojiStyle(base(),tone,req));eq(JSON.stringify(snapshot),before);
 eq(applyEmojiStyle(base('hi','Hello 🦊'),tone,req).payload.content,'Hello 🦊');
}
for(const content of ['Of course... we can leave that behind.','Of course… we can leave that behind.','Of course. We can leave that behind.']) {
 const out=applySpeechStyle({payload:{content}},'owner',{category:'topic_change',conversation:{ownerTurns:4}});
 eq(out.payload.content,'Davi, we can leave that behind.');
}
for(const category of ['nice','reaction_affection','reaction_romance']) {
 const out=applyEmojiStyle(base(category),'owner',{category,conversation:{emojiTurns:3}});
 assert.ok(emojiConfig.expressions.shy.owner.includes(out.emojiLast));count++;
}
for(const category of emojiConfig.sharp) {
 const out=applyEmojiStyle(base(category),'public',{category,conversation:{emojiTurns:3}});
 assert.ok(emojiConfig.pools.public.includes(out.emojiLast));count++;
}
console.log(`${count} expression variety, cadence, tone and punctuation checks passed.`);
