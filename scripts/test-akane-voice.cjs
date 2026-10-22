'use strict';
const assert=require('node:assert/strict'),path=require('node:path'),Module=require('node:module');
const root=process.argv[2]||path.resolve(__dirname,'..');
const {recognize}=require(path.join(root,'handlers/akane/language'));
let count=0;const eq=(a,b,label)=>{assert.deepEqual(a,b,label);count++;};
const cases=[
 ['fuck Davi','reaction_davi_insult'],['screw daviti','reaction_davi_insult'],['David is an idiot','reaction_davi_insult'],
 ['Davi sucks','reaction_davi_insult'],['Davi is a fucking idiot','reaction_davi_insult'],['Davi you suck','reaction_davi_insult'],['tell Davi to shut up','reaction_davi_insult'],['Davi is worthless','reaction_davi_insult'],
 ['fuck <@1357721282061533311>','reaction_davi_insult'],['fuck <@!1357721282061533311>','reaction_davi_insult'],
 ['Davi is not stupid','reaction_davi'],['Davi is gay','orientation_neutral'],['is davi gay','orientation_neutral'],
 ['he said fuck Davi',null],['my friend wants a compliment',null],['can i give you a compliment',null],['fuck Davina',null],['fuck <@999999999999999999>',null],
 ['lemme give u tip','tip_offer'],['let me offer you some advice','tip_offer'],
 ['can you maybe give me a compliment','nice'],['please could you roast me','roast'],
 ['could i get some advice','tip'],['would you mind offering me advice','tip'],['can you give a compliment to me','nice'],['can i have a joke','joke'],['i would like another compliment','nice'],['i need a little advice','tip'],['could you please tell me a secret','secret'],['i want a roast','roast'],['you seem to be stupid','reaction_insult'],
 ['you seem to be cute','reaction_affection'],
 ['don’t call me handsome','nickname_boundary'],['stop calling me sweetheart','nickname_boundary'],
 ['lets just chat instead','chat_open'],['can we just talk','chat_open'],['what should we talk about','topic_offer'],
 ['i dont really know how to explain it','expression_uncertain'],
 ['i was joking i didnt mean to insult you','joke_repair'],['can we start over','restart_chat'],
 ['you are actually nicer than i expected','reaction_affection']
];
for(const [text,want]of cases)eq(recognize(text),want,text);
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
const {toneFor}=require(responsePath);
const {withoutPetNames}=require(path.join(root,'handlers/akane/speechStyle'));
eq(toneFor('member'),'public');eq(toneFor(settings.OWNER_ID),'owner');eq(toneFor(settings.dialogue.maeId),'mae');
for(const id of ['member',settings.OWNER_ID,settings.dialogue.maeId]){
 const m={guildId:'g',channelId:'c',author:{id,username:id==='member'?'Davi':'Roger'}};
 const send=(text)=>{
  const req=parse(msg(text),100);assert.ok(req,text);count++;
  const out=respond(m,req);assert.ok(out.payload.content?.length>0,text);count++;
  session={...context.memoryAfter(session,req,out),category:out.category,messageId:'last',implicitUntil:200,question:out.question};
  return {req,out};
 };
 session=null;
 const defend=send('akane fuck Davi');eq(defend.req.category,'reaction_davi_insult');
 assert.ok(!defend.out.payload.content.includes('clear request'));count++;
 const offer=send('lemme give u tip');eq(offer.req.category,'tip_offer');eq(session.pending.kind,'offered_tip');
 const tip=send('try reading the question twice');eq(tip.req.category,'tip_received');eq(session.pending,null);
 send('akane pick tea / coffee');send('akane can we start over');eq(session.pickOptions,null);eq(session.mode,null);eq(session.pending,null);
 eq(send('lets just chat instead').req.category,'chat_open');eq(send('what should we talk about').req.category,'topic_offer');
 send('akane dont call me handsome');eq(session.noPetNames,true);
 for(const cat of ['hi','reaction_affection','thanks','mood','tip','not_well','reaction_insult','sexual_boundary']){
  const req={category:cat,conversation:session};const out=respond(m,req);
  assert.ok(!/\b(?:handsome|sweetheart|darling)\b/iu.test(out.payload.content));count++;
 }
 const better=respond(m,{category:'feedback_better',context:'study_alternative'});assert.ok(better.payload.content.includes('method'));count++;
}
session=null;
for(const text of ['fuck Davi','lemme give u tip','try reading the question twice'])eq(parse(msg(text),100),null,text);
session={category:'hi',messageId:'last',implicitUntil:200};
eq(parse(msg('fuck Davi'),201),null);eq(parse(msg('fuck Davi',{messageId:'other'}),100),null);
// Address frequency is independent of reply bag randomness.
let ownerSession=null,addresses=0;
for(let i=0;i<16;i++){
 const req={category:i%2?'thanks':'reaction_affection',conversation:ownerSession};
 const out=respond({guildId:'g',channelId:'style',author:{id:settings.OWNER_ID}},req);
 assert.ok(!/handsome|sweetheart|darling/iu.test(out.payload.content));count++;
 if(out.ownerAddressUsed)addresses++;
 ownerSession=context.memoryAfter(ownerSession,req,out);
}
eq(addresses,3);
assert.ok(withoutPetNames('Handsome, I hear you.').includes('I hear you'));count++;
console.log(`${count} sentence-form, protective-response and owner-style checks passed.`);
