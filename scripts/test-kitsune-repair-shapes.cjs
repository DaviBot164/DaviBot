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

const {recognizeDetails}=require(path.join(root,'handlers/kitsune/language'));
const {recognizeDayConversation}=require(path.join(root,'handlers/kitsune/dayConversation'));
const examples=[
 ['dont need a fix just let me finish','decline_advice'],
 ['could u explain that a bit differently','explain_fresh'],
 ['not calling u dumb i just didnt get the explanation','answer_confusing'],
 ['okay that makes more sense now','feedback_understood'],
 ['actually forget that lets start fresh','restart_chat']
];
for(const [text,category]of examples)eq(recognize(text),category,text);
for(const id of ['member',settings.OWNER_ID,settings.dialogue.maeId]){
 const m={guildId:'g',channelId:'c',author:{id}};
 const send=text=>{const req=parse(msg(text),100);assert.ok(req,text);count++;const out=respond(m,req);assert.ok(out.payload.content?.length,text);count++;session={...context.memoryAfter(session,req,out),category:out.category,messageId:'last',implicitUntil:200,question:out.question};return {req,out};};
 session=null;
 send('kitsune um im completely drained');
 send('i just need someone to hear me out');
 eq(send('its not really the work its how people treat me').req.category,'day_people');
 eq(send('dont need a fix just let me finish').req.category,'decline_advice');eq(session.noAdviceRemaining,4);eq(session.topicCategory,'day_people');
 send('kitsune change the subject');eq(parse(msg('its not really the work its how people treat me'),100),null);
 session=null;
 const fresh=send('kitsune could u explain that a bit differently');
 eq(fresh.req.category,'explain_fresh');assert.ok(/which answer|paste the sentence/i.test(fresh.out.payload.content));count++;
 eq(send('not calling u dumb i just didnt get the explanation').req.category,'answer_confusing');
 eq(send('okay that makes more sense now').req.category,'feedback_understood');
 send('kitsune be serious');send('kitsune i just want someone to listen');
 eq(send('actually forget that lets start fresh').req.category,'restart_chat');
 eq(session.topicCategory,null);eq(session.mode,null);eq(session.pending,null);eq(session.noAdviceRemaining,0);
 eq(parse(msg('its not really the work its how people treat me'),100),null);
 eq(parse(msg('dont need a fix just let me finish',{messageId:'someone-else'}),100),null);
 session=null;eq(parse(msg('not calling u dumb i just didnt get the explanation'),100),null);
}
for(const referent of ['it','that','your answer'])for(const degree of ['a bit','a little','slightly'])for(const request of ['can you','could you','would you'])eq(recognize(request+' explain '+referent+' '+degree+' differently'),'explain_fresh');
for(const insult of ['dumb','stupid','an idiot'])for(const verb of ['get','understand','follow'])for(const noun of ['explanation','answer','reply'])eq(recognize('not calling you '+insult+' i just did not '+verb+' the '+noun),'answer_confusing');
for(const refusal of ['do not need a fix','i do not want advice','i do not need any solution'])for(const finish of ['just let me finish','please let me finish talking','only hear me out'])eq(recognize(refusal+' '+finish),'decline_advice');
for(const source of ['it is','its',"it's"])for(const job of ['work','job','school'])for(const people of ['people','coworkers','classmates']){
 const text=source+' not really the '+job+' '+source+' how '+people+' treat me';
 eq(recognizeDayConversation(text,{category:'tired'}),'day_people');
 eq(recognizeDayConversation(text,{category:'pick'}),null);
 eq(recognizeDayConversation(text),null);
}
for(const start of ['let us','lets',"let's",'can we'])for(const ending of ['start fresh','start over','start again'])eq(recognize('forget that '+start+' '+ending),'restart_chat');
for(const text of ['do not let me finish','i need a fix just let me finish','that does not make more sense now','forget to start fresh','someone said "forget that lets start fresh"','not calling him dumb i just didnt get the explanation']){
 const category=recognize(text);assert.ok(!['decline_advice','feedback_understood','restart_chat','answer_confusing'].includes(category),text);count++;
}
console.log(count+' reason-correction, listening-boundary, explanation and restart shape checks passed.');
