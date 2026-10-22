'use strict';
const assert=require('node:assert/strict'),path=require('node:path'),Module=require('node:module');
const root=process.argv[2]||path.resolve(__dirname,'..');
const {recognize}=require(path.join(root,'handlers/akane/language'));
let count=0;const eq=(a,b,label)=>{assert.deepEqual(a,b,label);count++;};
const cases=[
 ['ngl kinda tired mentally rn','mental_tired'],['tired is what i am, not angry','tired'],
 ['idk how else to put it tbh','expression_uncertain'],['mean to sound rude i didnt','intent_clear'],
 ['r u actually this dumb or just pretending','reaction_insult'],
 ['a useful answer can u manage that for once','sarcastic_challenge'],
 ['wow another useless reply impressive','answer_feedback'],
 ['ur not as clever as u think u are','sarcastic_challenge'],
 ['dumb isnt what i called u','disavow_insult'],
 ['i said your answer was stupid not you','answer_feedback'],
 ['someone called u useless but i dont agree','reported_disagreement'],
 ['davi what a fucking idiot','reaction_davi_insult'],
 ['ur precious davi cant do anything right','reaction_davi_insult'],
 ['someone said "fuck davi" what do u think','reported_davi_quote'],
 ['i did not mean to sound rude','intent_clear'],
 ['my friend said you are useless but i disagree','reported_disagreement'],
 ['someone said "you are stupid" do you agree','reported_insult_question'],
 ['ur nice friend is stupid',null],['my friend is mentally tired',null],['i was mentally tired yesterday',null],
 ['i do not feel mentally tired',null],['tired is what my friend is',null],
 ['someone said "fuck davi"',null],['he said "you are stupid"',null],
 ['my friend says you are stupid',null],['davi is gay','orientation_neutral'],
 ['Davi is not stupid','reaction_davi'],['fuck davi','reaction_davi_insult']
];
for(const [text,want]of cases)eq(recognize(text),want,text);
for(const word of ['dumb','stupid','useless','annoying','pathetic','clueless']){
 eq(recognize(`are you this ${word} or just pretending`),'reaction_insult',word);
 eq(recognize(`${word} isnt what i called you`),'disavow_insult',word);
 eq(recognize(`i said your reply was ${word} not you`),'answer_feedback',word);
 eq(recognize(`someone called you ${word} but i disagree`),'reported_disagreement',word);
 eq(recognize(`davi what a ${word}`),'reaction_davi_insult',word);
}
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
const {analyzePragmatics}=require(path.join(root,'handlers/akane/pragmatics'));
eq(analyzePragmatics('dumb is not what i called you').scope,'correction');
eq(analyzePragmatics('i said your answer was stupid not you').scope,'answer');
eq(analyzePragmatics('someone called you dumb but i disagree').scope,'reported');
for(const id of ['member',settings.OWNER_ID,settings.dialogue.maeId]){
 const m={guildId:'g',channelId:'c',author:{id}};
 session=null;
 for(const [text,expected]of cases.slice(0,17)){
  const req=parse(msg('akane '+text),100);eq(req.category,expected,text);
  const out=respond(m,req);assert.ok(out.payload.content.length>10&&out.payload.content.length<2000);count++;
  assert.ok(!out.payload.content.includes('clear request')&&!out.payload.content.includes('shorter sentence'));count++;
  if(id===settings.OWNER_ID){assert.ok(!/handsome|sweetheart|darling/iu.test(out.payload.content));count++;}
 }
 for(const category of ['answer_feedback','intent_clear','sarcastic_challenge','reported_davi_quote','reported_insult_question']){
  const why=respond(m,{category:'explain',context:category});eq(why.category,category);
 }
}
for(const category of ['reaction_insult','sarcastic_challenge','answer_feedback']){
 const calm=respond({guildId:'g',channelId:'c',author:{id:'member'}},{category,conversation:{mode:{name:'gentle',remaining:4}}});
 assert.ok(!/attitude|audition|dramatic challenge|sharp review/iu.test(calm.payload.content));count++;
}
session=null;eq(parse(msg('ur not as clever as u think u are'),100),null);
session={category:'general',messageId:'last',implicitUntil:200};
eq(parse(msg('ur not as clever as u think u are'),100).category,'sarcastic_challenge');
eq(parse(msg('ur not as clever as u think u are'),201),null);
eq(parse(msg('ur not as clever as u think u are',{messageId:'other'}),100),null);
console.log(`${count} inversion, sarcasm, scope and reported-speech checks passed.`);
