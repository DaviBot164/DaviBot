'use strict';
const assert=require('node:assert/strict'),path=require('node:path'),Module=require('node:module');
const root=process.argv[2]||path.resolve(__dirname,'..');
const {recognize}=require(path.join(root,'handlers/kitsune/language'));
let count=0;const eq=(a,b,label)=>{assert.deepEqual(a,b,label);count++;};
const cases=[
 ['just listen for a minute','decline_advice'],['listen to me for a sec','decline_advice'],['let me vent for a moment','decline_advice'],
 ['ur reply made no sense','answer_confusing'],['not saying ur dumb just explain it properly','simplify'],
 ['can u make it shorter','simplify'],['yeah thats clearer','feedback_understood'],
 ['wow so helpful totally answered my question','ambiguous_praise'],['i was being sarcastic btw','sarcasm_clear'],
 ['my boss kept giving me extra work','day_tasks'],['but talking about it helped a little','day_relief'],
 ['my boss stopped giving me extra work',null],['i was not being sarcastic',null],['my friend was being sarcastic',null]
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
 send('kitsune today was exhausting');eq(send('just listen for a minute').req.category,'decline_advice');
 eq(send('my boss kept giving me extra work').req.category,'day_tasks');
 eq(send('and i barely had time for a break').req.category,'day_no_break');
 eq(send('thats why im so tired').req.category,'day_explanation');
 eq(send('but talking about it helped a little').req.category,'day_relief');
 send('kitsune change the subject');eq(parse(msg('and i barely had time for a break'),100),null);
 send('kitsune ur reply made no sense');eq(send('not saying ur dumb just explain it properly').req.category,'simplify');
 const short=send('can u make it shorter');eq(short.req.category,'simplify');assert.ok(short.out.payload.content.length<110);count++;
 eq(send('yeah thats clearer').req.category,'feedback_understood');
 eq(send('kitsune wow so helpful totally answered my question').req.category,'ambiguous_praise');
 eq(send('i was being sarcastic btw').req.category,'sarcasm_clear');
 const restart=send('can we start over');assert.ok(!/joke|music|secret/.test(restart.out.payload.content));count++;
 eq(session.noAdviceRemaining,0);

}
session=null;eq(parse(msg('nah the other one'),100),null);eq(parse(msg('wait lemme explain'),100),null);
session={category:'pick',pickOptions:['tea','coffee'],pickSelected:'tea',messageId:'last',implicitUntil:200};
eq(parse(msg('nah the other one'),201),null);eq(parse(msg('nah the other one',{messageId:'other'}),100),null);
const {applyEmojiStyle}=require(path.join(root,'handlers/kitsune/emojiStyle'));
let memory={},foxCount=0,total=0;
for(let i=0;i<80;i++) {
 const req={category:'hi',conversation:memory};const out=applyEmojiStyle({category:'hi',session:true,payload:{content:'Hello.'}},'owner',req);
 if(out.emojiAdded){total++;if(out.emojiLast==='🦊')foxCount++;}
 memory=context.memoryAfter(memory,req,out);
}
assert.ok(foxCount>=6 && foxCount<total,'fox is frequent without appearing every time');count++;
eq(total,20);
for(const text of ['just listen for a minute','can u make it shorter','i was being sarcastic btw']) {
 session=null;eq(parse(msg(text),100),null);
 session={category:'day_tasks',messageId:'last',implicitUntil:200};eq(parse(msg(text,{messageId:'other'}),100),null);
}
console.log(`${count} story, repair, sarcasm clarification and fox preference checks passed.`);
