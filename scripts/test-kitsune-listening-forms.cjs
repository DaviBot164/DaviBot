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

const examples=[
 ['im mentally tired','mental_tired'],['mentally exhausted rn ngl','mental_tired'],
 ['its my mind thats tired not my body','mental_tired'],['not sleepy just drained','tired'],
 ['i just want someone to listen','decline_advice'],
 ['not asking for a solution just some company','decline_advice'],
 ['dont try to fix it just hear me out','decline_advice'],
 ['advice isnt what i need rn','decline_advice']
];
for(const [text,category]of examples)eq(recognize(text),category,text);
for(const id of ['member',settings.OWNER_ID,settings.dialogue.maeId]){
 const m={guildId:'g',channelId:'c',author:{id}};
 const send=text=>{const req=parse(msg(text),100);assert.ok(req,text);count++;const out=respond(m,req);assert.ok(out.payload.content?.length,text);count++;session={...context.memoryAfter(session,req,out),category:out.category,messageId:'last',implicitUntil:200,question:out.question};return {req,out};};
 session=null;
 for(const [text,category]of examples){const item=send('kitsune '+text);eq(item.req.category,category,text);assert.ok(!/main request|did not find|clearer cue|did not follow/.test(item.out.payload.content));count++;if(category==='decline_advice')eq(session.noAdviceRemaining,4);}
 send('kitsune can you help me with studying');assert.ok(!/pick|read|choose|exercise|try finding/i.test(send('i dont understand the topic').out.payload.content));count++;
 send('kitsune tip');eq(session.noAdviceRemaining,0);
 eq(parse(msg('i just want someone to listen',{messageId:'another-person'}),100),null);
 session=null;eq(parse(msg('i just want someone to listen'),100),null);
}
for(const subject of ['mind','brain','head'])for(const word of ['tired','exhausted','drained','worn out'])for(const intro of ['its','it is',"it's"])eq(recognize(intro+' my '+subject+' thats '+word+' not my body'),'mental_tired');
for(const word of ['tired','exhausted','drained','worn out'])for(const lead of ['not sleepy just ','im not sleepy but ','i feel not sleepy only '])eq(recognize(lead+word),'tired');
for(const who of ['someone','somebody','you'])for(const verb of ['want','need','would like'])eq(recognize('i just '+verb+' '+who+' to listen'),'decline_advice');
for(const solution of ['a solution','solutions','advice','any tips'])for(const company of ['some company','someone to talk to','a listening ear'])eq(recognize('not asking for '+solution+' just '+company),'decline_advice');
for(const word of ['fix','solve'])for(const listen of ['listen','listen to me','hear me out'])eq(recognize('dont try to '+word+' it just '+listen),'decline_advice');
for(const text of ['i dont want someone to listen','my friend wants someone to listen','i am asking for advice','advice is what i need','i am not asking for company','my mind is not tired','its my body thats tired not my mind','not tired just sleepy','i want to listen to music','dont listen to me','not asking for a solution to this equation']){
 const category=recognize(text);assert.ok(!['mental_tired','decline_advice'].includes(category),text);count++;
}
console.log(count+' listening paraphrase, mind/body contrast and negation-scope checks passed.');
