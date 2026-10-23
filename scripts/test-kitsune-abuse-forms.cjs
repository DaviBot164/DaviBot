'use strict';
const assert=require('node:assert/strict'),path=require('node:path'),Module=require('node:module');
const root=process.argv[2]||path.resolve(__dirname,'..');
const {recognize}=require(path.join(root,'handlers/kitsune/language'));
let count=0;const eq=(a,b,label)=>{assert.deepEqual(a,b,label);count++;};
const cases=[];
for(const phrase of ['just listen','please listen to me','let me vent','hear me out','i just need to vent','can i vent','i need to get this off my chest','not looking for solutions','im not looking for solutions','i dont want advice just listen','just listen i dont need tips','i dont want suggestions but hear me out'])cases.push([phrase,'decline_advice']);
for(const [text,want]of cases)eq(recognize(text),want,text);
for(const phrase of ['my friend needs to vent','do not listen to me','i need advice','i am looking for solutions','listen to music'])assert.notEqual(recognize(phrase),'decline_advice');
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

const examples=[['wtf was that answer','answer_feedback'],['that answer was sh1t','answer_feedback'],['ur so fkn annoying','reaction_insult'],['i never called u a mf','disavow_insult']];
for(const [text,category]of examples)eq(recognize(text),category,text);
for(const id of ['member',settings.OWNER_ID,settings.dialogue.maeId]){
 const m={guildId:'g',channelId:'c',author:{id}};
 const send=text=>{const req=parse(msg(text),100);assert.ok(req,text);count++;const out=respond(m,req);assert.ok(out.payload.content?.length,text);count++;session={...context.memoryAfter(session,req,out),category:out.category,messageId:'last',implicitUntil:200,question:out.question};return {req,out};};
 session=null;
 for(const [text,category]of examples){const item=send('kitsune '+text);eq(item.req.category,category,text);assert.ok(!/main request|did not find|clearer cue/.test(item.out.payload.content));count++;}
 eq(parse(msg('ur so fkn annoying',{messageId:'someone-else'}),100),null);
 session=null;eq(parse(msg('ur so fkn annoying'),100),null);
}
for(const lead of ['what the fuck','what the hell','what the heck','wtf','wth'])for(const noun of ['answer','reply','response'])eq(recognize(lead+' was that '+noun),'answer_feedback');
for(const subject of ['your','that','this','the'])for(const noun of ['answer','reply','response'])for(const word of ['shit','sh1t','bs'])eq(recognize(subject+' '+noun+' was '+word),'answer_feedback');
for(const prefix of ['ur','you are','you'])for(const emphasis of ['so fkn','really fucking','very fkin'])for(const word of ['annoying','dumb','useless'])eq(recognize(prefix+' '+emphasis+' '+word),'reaction_insult');
for(const denial of ['i never called','i didnt call','i did not call'])for(const noun of ['a mf','an asshole','a bitch'])eq(recognize(denial+' u '+noun),'disavow_insult');
for(const text of ['my friend called you a mf','i called u a mf','i never called him a mf','your reply was not shit','that game was shit','i am so fucking tired','someone said "ur so fkn annoying"']){
 const category=recognize(text);assert.ok(!['answer_feedback','disavow_insult','reaction_insult'].includes(category),text);count++;
}
const {analyzeChatAbuse}=require(path.join(root,'handlers/kitsune/chatAbuse'));
eq(analyzeChatAbuse('i never called you a motherfucker').severity,'none');
eq(analyzeChatAbuse('that answer was shit').severity,'criticism');
eq(analyzeChatAbuse('someone called you a motherfucker'),null);
console.log(count+' emphatic profanity, answer criticism and denial-scope checks passed.');
