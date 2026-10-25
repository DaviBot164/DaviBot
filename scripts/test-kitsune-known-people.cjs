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
async function main(){
 const ids={mae:'1380278195961729084',ash:'1322228925421850644',davi:'1357721282061533311'};
 const aliases=new Map([['who is mae','stop']]);
 for(const [name,key]of [['mae','mae'],['ash','ash'],['davi','davi'],['daviti','davi']]){
  for(const prefix of ['who is','do you know']){
   session=null;const phrase=prefix+' '+name;eq(recognize(phrase),'known_person_'+key);
   const req=parse(msg('kitsune '+phrase+'?'),100,aliases);eq(req.category,'known_person_'+key);eq(req.understanding.rule,'identity.known_person');
   for(const userId of ['member',settings.OWNER_ID,ids.mae]){const out=respond({guildId:'g',channelId:'c',author:{id:userId}},req);assert.ok(out.payload.content.includes('<@'+ids[key]+'>'));count++;assert.ok(out.payload.content.length<110);count++;if(key==='mae'){assert.ok(out.payload.content.includes('Mae (Davi)'));count++;}eq(out.session,false);}
  }
 }
 session=null;eq(parse(msg('who is mae?'),100),null);
 for(const phrase of ['someone asked who is mae','who is mae insulting','who is tomy','who is not mae'])assert.ok(!String(recognize(phrase)).startsWith('known_person_'));count+=4;
 session={category:'music_chat',topicCategory:'music_chat',messageId:'last',implicitUntil:200};eq(parse(msg('who is mae?'),100).category,'known_person_mae');eq(parse(msg('who is mae?',{messageId:'other'}),100),null);eq(parse(msg('who is mae?'),201),null);
 console.log(count+' built-in person lookup, alias priority, short identity reply, tone and context boundary checks passed. No Discord or database calls.');
}
main().catch(e=>{console.error(e);process.exitCode=1;});
