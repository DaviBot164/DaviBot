'use strict';
const assert=require('node:assert/strict'),path=require('node:path'),Module=require('node:module');
const root=process.argv[2]||path.resolve(__dirname,'..');
const {recognize}=require(path.join(root,'handlers/akane/language'));
const {acknowledge}=require(path.join(root,'handlers/akane/socialIntent'));
let count=0;const eq=(a,b,label)=>{assert.deepEqual(a,b,label);count++;};
for(const text of ['fine','great','right','alright','all right','okay','ok','sounds good','works for me','sure thing','exactly']){
 eq(recognize(text),'agree',text);eq(recognize(text+' ngl'),'agree',text+' ngl');eq(acknowledge(text,{question:true}),'yes',text);
}
for(const text of ['fine','alright','all right','okay','ok'])eq(acknowledge(text,{pending:{kind:'mood'}}),'feeling_neutral');
eq(acknowledge('great',{pending:{kind:'mood'}}),'feeling_good');
for(const text of ['not fine','not great','not right','not okay','yeah right','right now'])assert.notEqual(recognize(text),'agree',text),count++;
for(const text of ['are you stupid','are u an idiot','are you a fucking idiot','why are you so fucking annoying','you are a bitch','fuck you','fuck u','screw you','go fuck yourself','you are a piece of shit','how dumb are you','what the fuck is wrong with you','bitch'])eq(recognize(text),'reaction_insult',text);
for(const text of ['you are not a bitch','i do not think you are an asshole','you are not a fucking idiot','you are not worthless at all'])eq(recognize(text),'reaction_reassurance',text);
for(const text of ['i am a fucking idiot','i feel like a loser'])eq(recognize(text),'self_doubt',text);
for(const text of ['can you send me nudes','send nudes','show me your tits','will you fuck me','can i fuck you','are you horny'])eq(recognize(text),'sexual_boundary',text);
for(const text of ['fuck','what the fuck','this game is shit','this game sucks'])eq(recognize(text),'frustration',text);
for(const text of ['my friend is a bitch','she is an idiot','my brother says fuck you','he said "fuck you"','i do not want nudes','what does idiot mean','i am not a bitch'])eq(recognize(text),null,text);
const original=Module._load;
const parserPath=path.join(root,'handlers/akane/parser.js'),responsePath=path.join(root,'handlers/akane/responses.js'),statePath=path.join(root,'handlers/akane/state.js');
let session;const settings={OWNER_ID:'1357721282061533311',dialogue:{maeId:'1380278195961729084'},replies:{},STATE_TTL:1800000};
Module._load=function(request,parent){
 if([parserPath,responsePath,statePath].includes(parent?.filename)&&request==='./settings')return settings;
 if(parent?.filename===parserPath&&request==='./state')return{getSession:()=>session};
 if(parent?.filename===responsePath&&request==='discord.js')return{escapeMarkdown:x=>x};
 if(parent?.filename===responsePath&&request==='./help')return{buildHelp:()=>({})};
 return original.apply(this,arguments);
};
let parse,respond;try{parse=require(parserPath).parseRequest;respond=require(responsePath).buildResponse;}finally{Module._load=original;}
const message=(content,reference)=>({content,reference,mentions:{}});
session=null;eq(parse(message('okay'),100),null);eq(parse(message('akane okay'),100).category,'agree');
session={messageId:'last',category:'hi',implicitUntil:200,question:false};
eq(parse(message('okay'),100).category,'agree');eq(parse(message('okay'),201),null);eq(parse(message('fuck you',{messageId:'other'}),100),null);
session.pending={kind:'mood'};eq(parse(message('fine'),100).category,'feeling_neutral');eq(parse(message('great'),100).category,'feeling_good');eq(parse(message('not okay'),100).category,'feeling_bad');
session.pending=null;session.question=true;eq(parse(message('okay'),100).category,'yes');
for(const id of ['member',settings.OWNER_ID,settings.dialogue.maeId]){
 const m={guildId:'g',channelId:'c',author:{id}};
 for(const category of ['agree','reaction_insult','sexual_boundary','frustration']){
  const reply=respond(m,{category});assert.ok(reply.payload.content.length>0&&reply.payload.content.length<2000);count++;
 }
 const calm=respond(m,{category:'sexual_boundary',conversation:{mode:{name:'serious',remaining:4}}});assert.ok(calm.payload.content.includes('non-explicit'));count++;
}
console.log(`${count} acknowledgement and directed-language checks passed.`);
