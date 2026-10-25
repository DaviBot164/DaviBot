'use strict';
const assert=require('node:assert/strict'),path=require('node:path'),Module=require('node:module');
const root=process.argv[2]||path.resolve(__dirname,'..');
const {recognize}=require(path.join(root,'handlers/kitsune/language'));
let count=0;const eq=(a,b,label)=>{assert.deepEqual(a,b,label);count++;};
const cases=[
 ['someone said "ur useless" but i disagree','reported_disagreement'],
 ['my friend called u dumb i didnt','reported_distance'],
 ['someone told davi to stfu what do u think','reported_davi_quote'],
 ['im annoyed at the answer not at u','critique_clear'],
 ['wow a useful answer for once','ambiguous_praise'],
 ['im joking but seriously can u explain that','explain_serious'],
 ['okay i took that too far','reaction_apology'],
 ['no more insults lets start over','restart_chat'],
 ['my friend called u dumb',null],['my friend called u dumb i agree',null],
 ['im not annoyed at the answer',null],['he took that too far',null]
];
for(const [text,want]of cases)eq(recognize(text),want,text);
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
for(const id of ['member',settings.OWNER_ID,settings.dialogue.maeId]){
 const m={guildId:'g',channelId:'c',author:{id}};
 const send=(text)=>{
  const req=parse(msg(text),100);assert.ok(req,text);count++;
  const out=respond(m,req);assert.ok(out.payload.content?.length>0,text);count++;
  session={...context.memoryAfter(session,req,out),category:out.category,messageId:'last',implicitUntil:200,question:out.question};
  return {req,out};
 };
 session=null;
 for(const [text,category]of cases.slice(0,8)) {
  const item=send('kitsune '+text);eq(item.req.category,category);
  assert.ok(item.out.payload.content.length>10);count++;
  if(category==='explain_serious')eq(session.mode.name,'serious');
 }
 eq(session.mode,null);eq(session.pickOptions,null);eq(session.explanationStep,0);
 for(const qualifier of ['kinda','sorta','a bit','a little','really']) {
  const item=send('kitsune ur annoying but '+qualifier+' funny');eq(item.req.mixedSocial,true);eq(item.out.category,'mixed_social');
 }
 send('kitsune pick tea / coffee');send('kitsune no more insults lets start over');eq(session.pickOptions,null);
 eq(parse(msg('my friend called u dumb i didnt',{messageId:'other'}),100),null);

}
session=null;eq(parse(msg('nah the other one'),100),null);eq(parse(msg('wait lemme explain'),100),null);
session={category:'pick',pickOptions:['tea','coffee'],pickSelected:'tea',messageId:'last',implicitUntil:200};
eq(parse(msg('nah the other one'),201),null);eq(parse(msg('nah the other one',{messageId:'other'}),100),null);
for(const word of ['dumb','stupid','useless','an idiot'])for(const source of ['my friend','my teammate','someone'])eq(recognize(source+' called u '+word+' i didnt'),'reported_distance');
for(const feeling of ['annoyed','angry','frustrated','disappointed'])for(const noun of ['answer','reply','response'])eq(recognize('im '+feeling+' at your '+noun+' not at u'),'critique_clear');
for(const directive of ['stfu','shut up','fuck off'])for(const source of ['someone','my friend','they'])eq(recognize(source+' told davi to '+directive+' what do u think'),'reported_davi_quote');
const pragmaticPools=require(path.join(root,'config/kitsunePragmatics')).pools;
const {applySpeechStyle}=require(path.join(root,'handlers/kitsune/speechStyle'));
for(const [tone,categories]of Object.entries(pragmaticPools)) {
 const m={guildId:'pool-variants',channelId:'pool-variants',author:{id:tone==='owner'?settings.OWNER_ID:tone==='mae'?settings.dialogue.maeId:'member'}};
 const req={category:'reported_distance',conversation:{}};
 const expected=new Set(categories.reported_distance.map(content=>applySpeechStyle({payload:{content}},tone,req).payload.content.replace(/\bMae\b/gu,tone==='mae'?'Davi':'Mae')));
 const seen=new Set();
 for(let i=0;i<expected.size*2;i++){const out=respond(m,req);assert.ok(expected.has(out.payload.content));count++;seen.add(out.payload.content);}
 eq(seen.size,expected.size);
}
console.log(`${count} reported speaker, mixed teasing, serious explanation and reset checks passed.`);
