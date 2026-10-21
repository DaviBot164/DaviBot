'use strict';
const assert=require('node:assert/strict'),path=require('node:path'),Module=require('node:module');
const root=process.argv[2]||path.resolve(__dirname,'..');
const {recognize}=require(path.join(root,'handlers/akane/language'));
let count=0;const eq=(a,b,label)=>{assert.deepEqual(a,b,label);count++;};
const cases=[
 ['can you tell me where you are','location'],['could you please tell me what you are doing','activity'],
 ['tell me how you are','mood'],['i wanted to ask if you are busy','availability'],
 ['im really tired ngl','tired'],['ngl im really tired','tired'],['im ngl really tired','tired'],
 ['im really tired tbh','tired'],['im honestly really tired','tired'],['im really tired rn ngl','tired'],
 ['you are cute but stupid','reaction_insult'],['you are not stupid but ugly','reaction_insult'],
 ['you are stupid but not ugly','reaction_insult'],['you are cute but rude','rude'],
 ['you are not stupid at all','reaction_reassurance'],['you are not ugly and stupid','reaction_reassurance'],
 ['my friend is cute but stupid',null],['he said "you are stupid"',null],
 ['i am happy but tired','mixed_feelings'],['i feel tired and hungry','mixed_feelings'],
 ['i am sad but happy','mixed_feelings'],['i am not sad and tired',null],
 ['i am not sad and i am tired','mixed_feelings'],['my friend is happy but tired',null],
 ['i was happy but tired',null],['i am happy and excited','feeling_good'],
 ['tell me a joke','joke'],['can you tell me a funny joke please','joke'],['give me a joke','joke'],
 ['commands','help'],['server commands','help'],
 ['can you help me','help_offer'],['i need your help','help_offer'],
 ['what is your favourite food','food_preferences'],['what do you like to eat','food_preferences'],
 ['distraction','bored'],['quiet','pause'],['why not','why'],
 ['you are not a person',null],['my friend told me a joke',null],
 ['i want to know where you are','location'],['i want to know the weather',null]
];
for(const [text,expected]of cases)eq(recognize(text),expected,text);
for(const mood of ['tired','sad','hungry','happy'])for(const marker of ['ngl','tbh','honestly']){
 const expected={tired:'tired',sad:'feeling_bad',hungry:'hungry',happy:'feeling_good'}[mood];
 for(const text of [`${marker} im really ${mood}`,`im ${marker} really ${mood}`,`im really ${mood} ${marker}`])eq(recognize(text),expected,text);
}
const original=Module._load;let session;
const parserPath=path.join(root,'handlers/akane/parser.js'),responsePath=path.join(root,'handlers/akane/responses.js'),statePath=path.join(root,'handlers/akane/state.js');
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
try{parse=require(parserPath).parseRequest;respond=require(responsePath).buildResponse;context=require(path.join(root,'handlers/akane/context'));}finally{Module._load=original;}
const msg=(content,reference)=>({content,reference,mentions:{}});
session=null;eq(parse(msg('no thanks'),100),null);eq(parse(msg('akane no thanks'),100).category,'no');eq(parse(msg('akane yes'),100).category,'clarify');
session={category:'mood',messageId:'last',implicitUntil:200,pending:{kind:'mood'}};
eq(parse(msg('fine'),100).category,'feeling_neutral');eq(parse(msg('bad ngl'),100).category,'feeling_bad');
eq(parse(msg('no thanks'),100).category,'no');eq(parse(msg('no thanks'),100).followup,false);
eq(parse(msg('can you tell me where you are'),100).category,'location');
eq(parse(msg('can you tell me where you are'),201),null);
eq(parse(msg('can you tell me where you are',{messageId:'someone-else'}),100),null);
for(const id of ['member',settings.OWNER_ID,settings.dialogue.maeId]){
 const m={guildId:'g',channelId:'c',author:{id}};
 for(const category of ['joke','help_offer','mixed_feelings','food_preferences']){
  const reply=respond(m,{category});assert.ok(reply.payload.content.length>0&&reply.payload.content.length<2000);count++;
  const reason=respond(m,{category:'why',context:category,followup:true});assert.ok(reason.payload.content.length>0);count++;
 }
 const seriousJoke=respond(m,{category:'joke',conversation:{mode:{name:'serious',remaining:4}}});assert.ok(seriousJoke.payload.content.includes('skip jokes'));count++;
 const joke=respond(m,{category:'again',context:'joke',followup:true});eq(joke.category,'joke');
 const unknown=respond(m,{category:'reaction_question'});eq(unknown.category,'clarify');assert.ok(!unknown.payload.content.includes('akane help'));count++;
 const hello=respond(m,{category:'hi',conversation:{mode:{name:'gentle',remaining:4}}});eq(hello.pending.kind,'mood');
}
console.log(`${count} sentence understanding and response checks passed.`);
