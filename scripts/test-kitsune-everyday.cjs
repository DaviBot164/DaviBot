'use strict';
const assert=require('node:assert/strict'),path=require('node:path'),Module=require('node:module');
const root=process.argv[2]||path.resolve(__dirname,'..');
const {recognize}=require(path.join(root,'handlers/kitsune/language'));
let checks=0;const eq=(a,b,label)=>{assert.deepEqual(a,b,label);checks++;};
const groups={
 location:['where are you','where r u','where are you now','where u at','wya','where do you live','where are you from'],
 activity:['what are you doing','what r u doing','wyd','what you doing','what are you up to','wyd rn'],
 game_invite:['wanna play','wanna play minecraft','wanna play valorant with me','would u like to play chess','do you want to play','do u wanna play with me','can you play with me','wanna play roblox','join my game','play with me','are you down to play','are you down for roblox','lets play'],
 availability:['are you here','r u busy','are you online','you free','got a minute','do you have time to talk'],
 plans:['what are your plans','what are you gonna do later','any plans for tonight','what should we do'],
 day_chat:['how was your day','how has your day been','did you have a good day','how was your morning'],
 preferences:['what do you like','what is your favorite color','do you like music'],
 gaming_identity:['do you play roblox','what games do you play','are you a gamer']
};
for(const [category,examples]of Object.entries(groups))for(const text of examples){eq(recognize(text),category,text);eq(recognize(text+'?'),category,text+'?');eq(recognize('ngl '+text),category,'ngl '+text);}
for(const text of ['my friend wants to play','i do not want to play','i was playing','my brother is busy','where is my friend','what game does he play'])eq(recognize(text),null,text);
const bank=require(path.join(root,'config/kitsuneEveryday'));
for(const categories of Object.values(bank.pools))for(const line of categories.game_invite){assert.ok(/cannot|can not/iu.test(line));checks++;}
let session;
const parserPath=path.join(root,'handlers/kitsune/parser.js'),responsePath=path.join(root,'handlers/kitsune/responses.js'),statePath=path.join(root,'handlers/kitsune/state.js');
const old=Module._load;
const replies={};const settings={OWNER_ID:'1357721282061533311',dialogue:{maeId:'1380278195961729084'},replies,STATE_TTL:1800000};
Module._load=function(request,parent){
 if([responsePath,statePath,parserPath].includes(parent?.filename)&&request==='./settings')return settings;
 if(parent?.filename===parserPath&&request==='./state')return{getSession:()=>session};
 if(parent?.filename===responsePath&&request==='discord.js')return{escapeMarkdown:x=>x};
 if(parent?.filename===responsePath&&request==='./help')return{buildHelp:()=>({})};
 return old.apply(this,arguments);
};
let parse,respond;try{parse=require(parserPath).parseRequest;respond=require(responsePath).buildResponse;}finally{Module._load=old;}
const message=(content,reference)=>({content,reference,client:{user:{id:'999'}},mentions:{}});
session=null;eq(parse(message('wanna play'),100),null);eq(parse(message('kitsune wanna play'),100).category,'game_invite');
session={messageId:'last',category:'hi',implicitUntil:200};eq(parse(message('wyd'),100).category,'activity');eq(parse(message('wyd'),201),null);eq(parse(message('wyd',{messageId:'other'}),100),null);
for(const id of ['public',settings.OWNER_ID,settings.dialogue.maeId]){
 const m={guildId:'g',channelId:'c',author:{id}};
 for(const category of Object.keys(bank.pools.public)){
  const r=respond(m,{category});assert.ok(r.payload.content.length>0&&r.payload.content.length<2000);checks++;
  const explained=respond(m,{category:'explain',context:category,followup:true});assert.ok(explained.payload.content.length>0);checks++;
  const calm=respond(m,{category,conversation:{mode:{name:'serious',remaining:4}}});assert.ok(calm.payload.content.length>0);checks++;
 }
 const r=respond(m,{category:'game_invite'});assert.ok(/cannot|can not/iu.test(r.payload.content));checks++;
}
console.log(`${checks} everyday English checks passed.`);
