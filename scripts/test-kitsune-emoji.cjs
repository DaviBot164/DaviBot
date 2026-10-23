'use strict';
const assert=require('node:assert/strict'),path=require('node:path'),Module=require('node:module');
const root=process.argv[2]||path.resolve(__dirname,'..');
const {recognize}=require(path.join(root,'handlers/kitsune/language'));
let count=0;const eq=(a,b,label)=>{assert.deepEqual(a,b,label);count++;};
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
const {applyEmojiStyle}=require(path.join(root,'handlers/kitsune/emojiStyle'));
const emojiConfig=require(path.join(root,'config/kitsuneEmoji'));
const base=(category='hi',content='Hello. How are you?')=>({category,session:true,question:true,payload:{content}});
const allEmoji=/[\p{Extended_Pictographic}\p{Regional_Indicator}]/gu;
for(const tone of ['owner','mae','public']) {
 let memory={},last=null,added=0;
 for(let turn=1;turn<=20;turn++) {
  const req={category:'hi',conversation:memory};
  const out=applyEmojiStyle(base(),tone,req);
  eq(Boolean(out.emojiAdded),turn%4===0,'four-reply cadence');
  if(out.emojiAdded){assert.notEqual(out.emojiLast,last);count++;last=out.emojiLast;added++;}
  assert.ok((out.payload.content.match(allEmoji)??[]).length<=1);count++;
  memory=context.memoryAfter(memory,req,out);
 }
 eq(added,5);
 eq(memory.emojiCount,5);
 for(const category of ['feeling_bad','mental_tired','physical_detail','emotional_detail','frustration','answer_feedback','answer_confusing','explain','tip','decline_advice','repair','help']) {
  const out=applyEmojiStyle(base(category),tone,{category,conversation:{emojiTurns:4}});
  eq(out.emojiAdded,undefined,category);
 }
 for(const mode of ['serious','gentle']) {
  const out=applyEmojiStyle(base('hi'),tone,{category:'hi',conversation:{emojiTurns:4,mode:{name:mode,remaining:4}}});eq(out.emojiAdded,undefined);
 }
 const preexisting=applyEmojiStyle(base('hi','Hello 🦊'),tone,{category:'hi',conversation:{emojiTurns:4}});
 eq(preexisting.payload.content,'Hello 🦊');eq(preexisting.emojiTurns,0);
 const saved={emojiTurns:3,emojiCount:0};const snapshot=JSON.stringify(saved);
 const unsent=applyEmojiStyle(base(),tone,{category:'hi',conversation:saved});
 eq(JSON.stringify(saved),snapshot,'failed send does not commit');
 eq(applyEmojiStyle(base(),tone,{category:'hi',conversation:saved}),unsent,'retry stable');
 const m={guildId:'g',channelId:'c',author:{id:tone==='owner'?settings.OWNER_ID:tone==='mae'?settings.dialogue.maeId:'member'}};
 const integrated=respond(m,{category:'hi',conversation:{emojiTurns:3}});
 assert.ok(integrated.emojiAdded);count++;
 assert.ok(emojiConfig.pools[tone==='public'?'publicWarm':tone].includes(integrated.emojiLast));count++;
 const payload=applyEmojiStyle({...base(),payload:{content:'Hello',files:[{}]}},tone,{category:'hi',conversation:{emojiTurns:4}});eq(payload.emojiAdded,undefined);
}
for(const tone of ['owner','mae','public']) {
 const out=applyEmojiStyle(base('reaction_insult'),tone,{category:'reaction_insult',conversation:{emojiTurns:4}});
 eq(Boolean(out.emojiAdded),tone==='public');
}
const explanation=applyEmojiStyle(base('feeling_bad'),'public',{category:'hi',conversation:{emojiTurns:4}});eq(explanation.emojiAdded,undefined);
console.log(`${count} emoji cadence, tone, restraint and successful-send memory checks passed.`);
