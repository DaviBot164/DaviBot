'use strict';
const assert=require('node:assert/strict'),path=require('node:path'),Module=require('node:module');
const root=process.argv[2]||path.resolve(__dirname,'..');
const {recognize}=require(path.join(root,'handlers/kitsune/language'));
let count=0;const eq=(a,b,label)=>{assert.deepEqual(a,b,label);count++;};
const cases=[
 ['im feeling sad','feeling_bad'],['i am feeling tired','tired'],['i am just feeling sad','feeling_bad'],
 ['i am feeling happy','feeling_good'],['i feel sad','feeling_bad'],['i just feel sad','feeling_bad'],
 ['im tired but not sleepy','tired'],['i am sleepy but not tired','tired'],
 ['i was sad earlier but im okay now','feeling_neutral'],
 ['i was happy before but now i am sad','feeling_bad'],
 ['i was tired yesterday but i am happy now','feeling_good'],
 ['my friend was sad earlier but is okay now',null],['i was sad earlier',null],
 ['your answer was rude but you are not stupid','rude'],
 ['my friend said you are useless but i disagree','reported_disagreement'],
 ['my sister thinks you are stupid but i do not agree','reported_disagreement'],
 ['my friend said you are useless',null],['my friend said you are useless but i agree',null],
 ['are you always this dramatic or just today','playful_question'],
 ['are you always sarcastic','playful_question'],['are you always stupid','reaction_insult']
];
for(const [text,want]of cases)eq(recognize(text),want,text);
const {extractChoice}=require(path.join(root,'handlers/kitsune/language'));
for(const text of ['i dont know whether to play or study','idk if i should play or study','i cannot decide whether to play or study'])eq(extractChoice(text),'play / study',text);
for(const text of ['my friend does not know whether to play or study','i do not know whether you are nice or mean','i do not know whether to play or study or sleep'])eq(extractChoice(text),null,text);
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
for(const id of ['member',settings.OWNER_ID,settings.dialogue.maeId]){
 const m={guildId:'g',channelId:'c',author:{id}};
 session={category:'decline_advice',noAdviceRemaining:4,messageId:'last',implicitUntil:200};
 for(const text of ['kitsune im feeling sad','kitsune im tired but not sleepy']){
  const req=parse(msg(text),100);eq(req.category,text.includes('tired')?'tired':'feeling_bad');
  const out=respond(m,req);eq(out.category,req.category);assert.ok(!/\badvice\b/i.test(out.payload.content));count++;
  assert.ok(!out.payload.content.includes('No need to turn it into a task'));count++;
 }
 const choice=parse(msg('kitsune i dont know whether to play or study'),100);eq(choice.category,'pick');eq(choice.argument,'play / study');
 const chosen=respond(m,choice);eq(chosen.category,'pick');assert.ok(/play|study/.test(chosen.payload.content));count++;
 const feedback=parse(msg('kitsune your answer was rude, but you are not stupid'),100);eq(feedback.category,'rude');
 const softened=respond(m,feedback);eq(softened.modeChange,'gentle');
 for(const category of ['reported_disagreement','playful_question']){
  const out=respond(m,{category});eq(out.category,category);assert.ok(out.payload.content.length>20);count++;
  const reason=respond(m,{category:'explain',context:category});eq(reason.category,category);
 }
}
session=null;eq(parse(msg('i dont know whether to play or study'),100),null);
session={category:'general',messageId:'last',implicitUntil:200};
eq(parse(msg('i dont know whether to play or study'),100).category,'pick');
eq(parse(msg('i dont know whether to play or study'),201),null);
eq(parse(msg('i dont know whether to play or study',{messageId:'other'}),100),null);
console.log(`${count} mood-shape, choice and mixed-sentence checks passed.`);
