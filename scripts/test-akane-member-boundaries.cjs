'use strict';
const assert=require('node:assert/strict'),path=require('node:path'),Module=require('node:module');
const root=process.argv[2]||path.resolve(__dirname,'..');
const {recognize}=require(path.join(root,'handlers/akane/language'));
let count=0;const eq=(a,b,label)=>{assert.deepEqual(a,b,label);count++;};
const cases=[];
for(const phrase of ['just listen','please listen to me','let me vent','hear me out','i just need to vent','can i vent','i need to get this off my chest','not looking for solutions','im not looking for solutions','i dont want advice just listen','just listen i dont need tips','i dont want suggestions but hear me out'])cases.push([phrase,'decline_advice']);
for(const [text,want]of cases)eq(recognize(text),want,text);
for(const phrase of ['my friend needs to vent','do not listen to me','i need advice','i am looking for solutions','listen to music'])assert.notEqual(recognize(phrase),'decline_advice');
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

const examples=[
 ['mf','reaction_insult'],['ur mf','reaction_insult'],['ur so bad','reaction_insult'],
 ['stfu mf','reaction_dismissive'],['bla bla bla stfu mf ass oe','reaction_dismissive'],
 ['all that attitude and still no useful answer','verbal_challenge'],
 ['nobody asked for ur opinion','verbal_challenge'],
 ['u aint getting any love with that attitude','personal_taunt'],
 ['u aint getting love','personal_taunt'],
 ['someone called me a racial slur','abuse_report'],['my friend told me to stfu','abuse_report'],
 ['im gay','identity_disclosure'],['ur gay','orientation_question'],['ur so gay','orientation_question'],
 ['that answer was bad not you','answer_feedback'],['lets talk normally now','normal_chat'],
 ['kos omak','reaction_insult'],['why ur nigger','racial_boundary'],['stfu nigger','racial_boundary'],
 ['u will never let chatgpt fall in love with u cuz ur flat nigger','racial_boundary']
];
for(const [text,category]of examples)eq(recognize(text),category,text);
for(const id of ['member',settings.OWNER_ID,settings.dialogue.maeId]){
 const m={guildId:'g',channelId:'c',author:{id}};
 const send=text=>{const req=parse(msg(text),100);assert.ok(req,text);count++;const out=respond(m,req);assert.ok(out.payload.content?.length,text);count++;session={...context.memoryAfter(session,req,out),category:out.category,messageId:'last',implicitUntil:200,question:out.question};return {req,out};};
 session=null;
 for(const [text,category]of examples){const item=send('akane '+text);eq(item.req.category,category,text);assert.ok(!/main request|did not find|clearer cue/.test(item.out.payload.content),text);count++;}
 send('akane lets talk normally now');eq(session.mode.name,'serious');
 eq(parse(msg('',{messageId:'last'}),100),null);
 eq(parse(msg('stfu mf',{messageId:'another-person'}),100),null);
 send('akane change the subject');
 session=null;eq(parse(msg('stfu mf'),100),null);
}
for(const text of ['my friend is gay','i am not gay','you are not bad','the game is bad','someone said "stfu nigger"','i read about racial slurs','do not call anyone a racial slur','you said a slur','tell him stfu','ng','you are not a nigger','you should not use nigger','do not say nigger']){
 const category=recognize(text);assert.ok(!['racial_boundary','personal_taunt','identity_disclosure','abuse_report'].includes(category),text);count++;
}
for(const slur of ['nigger','nigga','n1gger','n1gga','nigg3r']){
 for(const form of ['you are '+slur,'why are you '+slur,'shut up '+slur])eq(recognize(form),'racial_boundary',form);
 eq(recognize('someone called me '+slur),'abuse_report');
 assert.notEqual(recognize('my friend said "'+slur+'"'),'racial_boundary');count++;
}
const variants=require(path.join(root,'config/akaneMemberBoundaries')).pools;
for(const [tone,categories]of Object.entries(variants))for(const [category,pool]of Object.entries(categories)){
 const m={guildId:'all-pools',channelId:'all-pools',author:{id:tone==='owner'?settings.OWNER_ID:tone==='mae'?settings.dialogue.maeId:'member'}};
 for(let i=0;i<pool.length*2;i++){
  const out=respond(m,{category,conversation:{}});assert.ok(out.payload.content?.length>10);count++;
  assert.ok(!/nigg|n1gg|kos omak|motherfucker/i.test(out.payload.content));count++;
 }
}
console.log(count+' directed abuse, racial boundaries, reports, criticism and normal-chat checks passed.');
