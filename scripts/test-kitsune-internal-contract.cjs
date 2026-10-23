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

const {recognizeDetails,inspectUnderstanding}=require(path.join(root,'handlers/kitsune/language'));
const {understandingResult,nextTopic}=require(path.join(root,'handlers/kitsune/understandingResult'));
const matrix=[
 ['ur stupid','reaction_insult','kitsune','affirmed'],
 ['ur not stupid','reaction_reassurance','kitsune','negated'],
 ['i never called u a mf','disavow_insult','kitsune','negated'],
 ['your answer was confusing','answer_confusing','answer','unspecified'],
 ['someone called me a racial slur','abuse_report','self','unspecified'],
 ['someone told davi to stfu what do u think','reported_davi_quote','davi','unspecified'],
 ['im mentally tired','mental_tired','self','affirmed'],
 ['i just want someone to listen','decline_advice','self','unspecified']
];
let correct=0,wrong=0,missed=0,falsePositive=0;
for(const [text,category,target,polarity]of matrix){
 const details=recognizeDetails(text);
 if(!details.category)missed++;else if(details.category!==category)wrong++;else correct++;
 eq(details.category,category,text);eq(details.understanding.category,category);
 eq(details.understanding.target,target);eq(details.understanding.polarity,polarity);
 eq(details.understanding.version,1);assert.ok(Object.isFrozen(details.understanding));count++;
 const trace=inspectUnderstanding(text);eq(trace.category,category);
 assert.ok(trace.understanding.rule);count++;
 for(let i=1;i<trace.candidates.length;i++)assert.ok(trace.candidates[i-1].priority<trace.candidates[i].priority);
 eq(trace.understanding.reported,category.startsWith('reported_')||category==='abuse_report');
}
for(const text of ['quantum toast bicycle','my friend is completely exhausted','i was completely exhausted yesterday','someone said "im completely tired"']){
 const details=recognizeDetails(text);if(details.category)falsePositive++;
 eq(details.category,null,text);eq(details.understanding.status,'unmatched');
}
const compound=recognizeDetails('im totally exhausted but i need someone to listen').understanding;
eq(compound.mood,'tired');eq(compound.listening,true);eq(compound.source,'composition');
const variant=recognizeDetails('um im completely exhausted').understanding;
eq(variant.source,'variant');assert.ok(variant.rule.startsWith('variant.'));count++;
for(const category of ['davi','mae','member'])eq(understandingResult(category).target,category);
eq(understandingResult('directed_taunt_request').target,'third_party');
eq(understandingResult('identity_disclosure').target,'self');
const unknown=understandingResult('fallback');eq(unknown.status,'needs_clarification');
const {spawnSync}=require('node:child_process');
for(const args of [['im mentally tired'],['--topic','day_work','not the job itself mostly the people']]){
 const run=spawnSync(process.execPath,[path.join(root,'scripts/inspect-kitsune-understanding.cjs'),...args],{encoding:'utf8'});
 eq(run.status,0,run.stderr);const data=JSON.parse(run.stdout);
 if(args[0]==='--topic')eq(data.effectiveUnderstanding.category,'day_people');else eq(data.understanding.target,'self');
}
eq(spawnSync(process.execPath,[path.join(root,'scripts/inspect-kitsune-understanding.cjs')],{encoding:'utf8'}).status,2);
for(const id of ['member',settings.OWNER_ID,settings.dialogue.maeId]){
 const m={guildId:'g',channelId:'c',author:{id}};
 const send=text=>{
  const req=parse(msg(text),100);assert.ok(req,text);count++;
  const out=respond(m,req);assert.ok(out.payload.content?.length,text);count++;
  eq(req.understanding.category,req.category);
  session={...context.memoryAfter(session,req,out),category:out.category,messageId:'last',implicitUntil:200,question:out.question};
  return {req,out};
 };
 session=null;
 send('kitsune today was exhausting');eq(session.topicCategory,'day_tiring');
 send('mostly because of work');eq(session.topicCategory,'day_work');
 send('kitsune be serious');eq(session.topicCategory,'day_work');eq(session.mode.name,'serious');
 send('thanks');eq(session.topicCategory,'day_work');
 eq(send('not the job itself mostly the people').req.category,'day_people');eq(session.topicCategory,'day_people');
 send('kitsune change the subject');eq(session.topicCategory,null);eq(session.mood,null);
 eq(parse(msg('not the job itself mostly the people'),100),null);
 send('kitsune can you help me with studying');eq(session.topicCategory,'study_start');
 send('thanks');eq(session.topicCategory,'study_start');
 eq(send('i already tried reading it twice').req.category,'study_alternative');
 send('kitsune pick tea / coffee');eq(session.topicCategory,null);
 eq(parse(msg('i already tried reading it twice'),100),null);
 send('kitsune im mentally tired');eq(session.mood,'mentally_tired');
 send('kitsune i just want someone to listen');eq(session.noAdviceRemaining,4);eq(session.topicCategory,'mental_tired');
 send('kitsune a little advice would help now');eq(session.noAdviceRemaining,0);
 send('kitsune can we start over');eq(session.topicCategory,null);eq(session.pending,null);eq(session.mode,null);eq(session.mood,null);
 session=null;
 const learned=parse(msg('kitsune yo moonfox'),100,new Map([['yo moonfox','hi']]));
 eq(learned.understanding.source,'learned');eq(learned.understanding.rule,'approved_alias');
 eq(parse(msg('kitsune pick tea / coffee'),100).understanding.source,'choice');
 eq(parse(msg('mostly because of work'),100),null);
}
eq(nextTopic({category:'day_work'},{category:'thanks'},{category:'reaction_thanks'}),'day_work');
eq(nextTopic({topicCategory:'study_start'},{category:'restart_chat'},{category:'hi'}),null);
eq({correct,wrong,missed,falsePositive},{correct:8,wrong:0,missed:0,falsePositive:0});
console.log(count+' structured-result, rule-priority, diagnostic CLI and independent-topic checks passed.');
console.log('Audit cases: '+correct+' correct; '+wrong+' wrong; '+missed+' missed; '+falsePositive+' false positives. These are offline cases, not general-English accuracy.');
