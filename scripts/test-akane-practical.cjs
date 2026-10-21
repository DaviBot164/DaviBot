'use strict';
const assert=require('node:assert/strict'),path=require('node:path'),Module=require('node:module');
const root=process.argv[2]||path.resolve(__dirname,'..');
const {recognize}=require(path.join(root,'handlers/akane/language'));
let count=0;const eq=(a,b,label)=>{assert.deepEqual(a,b,label);count++;};
const cases=[
 ['tbh idk what to do','feeling_stuck'],['idk what i should do ngl','feeling_stuck'],
 ['ur actually pretty cool','reaction_affection'],['ur really helpful','reaction_affection'],
 ['ur friend is cute',null],['your game is cool',null],
 ['thanks for helping me','thanks'],['thank you for your help','thanks'],['thx for the advice','thanks'],
 ['im not feeling good','not_well'],['i do not feel very well','not_well'],
 ['my friend is not feeling good',null],['im not tired','not_tired'],
 ['this game is stupid','frustration'],['that match was unfair','frustration'],
 ['my friend is stupid','people_problem'],['my teammate is a jerk','people_problem'],
 ['im sad but i want to play','mood_and_play'],['i am upset but i still want to play something','mood_and_play'],
 ['can you help me with something','help_offer'],['could you please help me out','help_offer'],
 ['do you remember what i said','memory_scope'],['what did i just say','memory_scope'],
 ['why did you say that','explain'],['what did you mean by that','explain'],
 ['what do you think about it','reference_detail'],['should i do that','reference_detail'],
 ['you are stupid','reaction_insult'],['you are not stupid','reaction_reassurance']
];
for(const [text,expected]of cases)eq(recognize(text),expected,text);
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
session={category:'feeling_stuck',messageId:'last',implicitUntil:200,history:[]};
eq(parse(msg('why did you say that'),100).category,'explain');
eq(parse(msg('why did you say that'),100).context,'feeling_stuck');
eq(parse(msg('why did you say that'),201),null);
eq(parse(msg('why did you say that',{messageId:'other'}),100),null);
session=null;eq(parse(msg('thanks for helping me'),100),null);eq(parse(msg('akane thanks for helping me'),100).category,'thanks');
for(const id of ['member',settings.OWNER_ID,settings.dialogue.maeId])for(const category of ['feeling_stuck','not_well','not_tired','people_problem','mood_and_play','memory_scope','reference_detail']){
 const m={guildId:'g',channelId:'c',author:{id}};
 const out=respond(m,{category});eq(out.category,category);assert.ok(out.payload.content.length>20&&out.payload.content.length<1000);count++;
 const explain=respond(m,{category:'explain',context:category,followup:true});eq(explain.category,category);assert.ok(!explain.payload.content.includes('main point in a short sentence'));count++;
}
console.log(`${count} real-conversation repair checks passed.`);
