'use strict';
const assert=require('node:assert/strict'),path=require('node:path'),Module=require('node:module');
const root=process.argv[2]||path.resolve(__dirname,'..');
const {recognize}=require(path.join(root,'handlers/kitsune/language'));
let count=0;const eq=(a,b,label)=>{assert.deepEqual(a,b,label);count++;};
const cases=[
 ['fk u','reaction_insult'],['fuk u','reaction_insult'],['fu','reaction_insult'],['f u','reaction_insult'],
 ['stfu','reaction_dismissive'],['gtfo','reaction_dismissive'],['ur a mf','reaction_insult'],['u btch','reaction_insult'],
 ['you are a b!tch','reaction_insult'],['you are a b*tch','reaction_insult'],['you are a dumb@ss','reaction_insult'],
 ['ur such a mofo','reaction_insult'],['u r an idi0t','reaction_insult'],['ur dumb af','reaction_insult'],
 ['your answer is bs','answer_feedback'],['ur reply is sh1t','answer_feedback'],
 ['this game is sh*t','frustration'],['wtf','frustration'],['ffs','frustration'],
 ['you are not a btch','reaction_reassurance'],['fk davi','reaction_davi_insult'],
 ['my friend said stfu',null],['someone said "fk u"',null],['butterfly',null],['shuffle',null]
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
 send('kitsune hi');
 for(const text of ['fk u','stfu','ur a mf','u btch','ur dumb af']) {
  const item=send(text);eq(item.req.category,text==='stfu'?'reaction_dismissive':'reaction_insult');
  assert.ok(!/kitsune help/i.test(item.out.payload.content));count++;
 }
 eq(send('your reply is bs').req.category,'answer_feedback');
 eq(send('this game is sh1t').req.category,'frustration');
 eq(send('wtf').req.category,'frustration');
 const gentle=respond(m,{category:'reaction_insult',conversation:{mode:{name:'gentle',remaining:4}}});
 assert.ok(/reset|bothered/i.test(gentle.payload.content));count++;

}
session=null;eq(parse(msg('nah the other one'),100),null);eq(parse(msg('wait lemme explain'),100),null);
session={category:'pick',pickOptions:['tea','coffee'],pickSelected:'tea',messageId:'last',implicitUntil:200};
eq(parse(msg('nah the other one'),201),null);eq(parse(msg('nah the other one',{messageId:'other'}),100),null);
for(const token of ['btch','bch','b*tch','b!tch','b1tch','mf','mfer','mofo','m0f0','dumbass','dumbazz','dumb@ss','dumba55','dumbfck','dumbfuck','idi0t','asshole','a$$hole','a55hole','sob','stoopid','dmb']) {
 eq(recognize('u are a '+token),'reaction_insult');
 eq(recognize('you are not a '+token),'reaction_reassurance');
 eq(recognize('someone said "you are a '+token+'"'),null);
}
const {analyzeChatAbuse}=require(path.join(root,'handlers/kitsune/chatAbuse'));
for(const word of ['dumb','stupid','loser','annoying','useless','trash','clown','pathetic','cringe']) {
 eq(analyzeChatAbuse('you are '+word).severity,'mild');
 for(const prefix of ['you are ','you are so ','you are really '])eq(recognize(prefix+word),'reaction_insult');
}
for(const word of ['bitch','cunt','motherfucker','asshole','bastard','piece of shit','shithead'])eq(analyzeChatAbuse('you are a '+word).severity,'severe');
eq(analyzeChatAbuse('you are not stupid').severity,'none');
console.log(`${count} abbreviation, profanity scope and member response checks passed.`);
