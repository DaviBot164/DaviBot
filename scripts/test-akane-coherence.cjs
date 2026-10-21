'use strict';
const assert=require('node:assert/strict'),path=require('node:path'),Module=require('node:module');
const root=process.argv[2]||path.resolve(__dirname,'..');
const {recognize}=require(path.join(root,'handlers/akane/language'));
let count=0;const eq=(a,b,label)=>{assert.deepEqual(a,b,label);count++;};
const cases=[
 ['you are adorable but obnoxious','reaction_insult'],
 ['you are clever but incompetent','reaction_insult'],
 ['you are not obnoxious but gorgeous','reaction_affection'],
 ['you are not obnoxious at all','reaction_reassurance'],
 ['you soooo annoying','reaction_insult'],['you veryyy cute','reaction_affection'],
 ['i never said you were stupid','repair'],['i did not mean that','repair'],
 ['my friend is clever but incompetent',null],['he said you are adorable but obnoxious',null],
 ['i am not sad and tired',null],['you are not ugly and stupid','reaction_reassurance']
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
session=null;
for(const text of ['same','me too','not anymore'])eq(parse(msg(text),100),null,text);
session={category:'tired',messageId:'last',implicitUntil:200,history:[{request:'tired',topic:'tired'}]};
for(const text of ['same','same here','me too'])eq(parse(msg(text),100).category,'tired',text);
session.history=[{request:'why',topic:'tired'}];eq(parse(msg('same'),100).category,'context_echo');
session.category='mood';session.history=[];
for(const text of ['same','me too','me neither'])eq(parse(msg(text),100).category,'context_echo',text);
for(const text of ['not anymore','no longer'])eq(parse(msg(text),100).category,'context_changed',text);
for(const text of ['maybe','perhaps','not sure'])eq(parse(msg(text),100).category,'context_hesitant',text);
eq(parse(msg('same'),201),null);eq(parse(msg('same',{messageId:'someone-else'}),100),null);
for(const text of ['akane you are cute but stupid','akane you are adorable but obnoxious','akane you are brilliant but a clown']){
 const req=parse(msg(text),100);eq(req.category,'reaction_insult',text);eq(req.mixedSocial,true,text);
 for(const id of ['member',settings.OWNER_ID,settings.dialogue.maeId]){
  const out=respond({guildId:'g',channelId:'c',author:{id}},req);eq(out.category,'mixed_social');
  assert.ok(out.payload.content.length>20);count++;
 }
}
for(const text of ['akane my friend is cute but stupid','akane you are not ugly and stupid'])assert.ok(!parse(msg(text),100).mixedSocial),count++;
for(const id of ['member',settings.OWNER_ID,settings.dialogue.maeId])for(const category of ['context_echo','context_changed','context_hesitant','mixed_social']){
 const out=respond({guildId:'g',channelId:'c',author:{id}},{category});eq(out.category,category);assert.ok(out.payload.content.length>10);count++;
 const why=respond({guildId:'g',channelId:'c',author:{id}},{category:'why',context:category});eq(why.category,category);
}
session.pending={kind:'mood'};eq(parse(msg('maybe'),100).category,'uncertain');
session.pending={kind:'choices'};eq(parse(msg('maybe'),100).category,'uncertain');
console.log(`${count} sentence and conversation coherence checks passed.`);
