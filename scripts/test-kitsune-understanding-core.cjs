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

const {prepareInput,recognizeDetails,canonical}=require(path.join(root,'handlers/kitsune/language'));
const {meaningVariants}=require(path.join(root,'handlers/kitsune/meaningVariants'));
const generated=[];
for(const mood of ['tired','exhausted','drained','sad','upset','happy','calm','lonely','bored']){
 const category=['tired','exhausted','drained'].includes(mood)?'tired':['sad','upset'].includes(mood)?'feeling_bad':mood==='happy'?'feeling_good':mood==='calm'?'feeling_neutral':mood;
 for(const prefix of ['um ','uh ','hmm ',''])for(const modifier of ['totally','completely','absolutely'])generated.push([prefix+'im '+modifier+' '+mood,category]);
}
for(const [text,category]of generated){eq(recognize(text),category,text);const frame=prepareInput(text);eq(recognizeDetails(text,frame),recognizeDetails(text));assert.ok(Object.isFrozen(frame));count++;}
// Separately authored combinations, not expanded from the generation loops above.
const heldout=[
 ['tired af rn','tired'],['feel mentally drained','mental_tired'],['exhausted is how i feel','tired'],
 ['erm im exhuasted','tired'],['im overwelmed','feeling_bad'],
 ['you r so annoying','reaction_insult'],['your totally useless','reaction_insult'],
 ['you are being so annoying','reaction_insult'],['r u very dumb','reaction_insult'],
 ['any chance you could tell me a secret','secret'],['would it be possible for you to give me a compliment','nice'],
 ['would you mind explaining that','explain'],['can you just help me study','study_start'],
 ['i need some company','lonely'],['not after a fix just a listening ear','decline_advice'],
 ['i dont want you to solve anything just hear me out','decline_advice']
];
for(const [text,category]of heldout)eq(recognize(text),category,text);
const compounds=[
 ['im totally exhausted but i need someone to listen','tired'],
 ['i just want someone to listen and im completely drained','tired'],
 ['im mentally tired but i just want someone to listen','mental_tired'],
 ['im happy but just listen','feeling_good'],
 ['im bored and i dont want advice','bored'],
 ['im lonely but dont try to fix it just hear me out','lonely']
];
for(const [text,category]of compounds){const details=recognizeDetails(text);eq(details.category,category,text);eq(details.declineAdvice,true,text);eq(recognize(text),category,text);}
for(const text of ['my friend is completely exhausted','i was completely exhausted yesterday','you are not completely useless','i am not completely tired','i want to listen to music','someone said "im completely tired"','i need some company to fix my roof','i dont want you to help me study','would you mind not explaining that']){
 const result=recognizeDetails(text);assert.ok(!result.declineAdvice,text);count++;
 assert.ok(!['tired','mental_tired','reaction_insult'].includes(result.category),text);count++;
}
for(const text of ['im tired but i want advice','im tired but my friend wants someone to listen','im tired and i dont want advice and tell me a secret']){assert.ok(!recognizeDetails(text).declineAdvice,text);count++;}
// Learned phrase keys remain canonical, independently of understanding-only variants.
const {learningPhrase}=require(path.join(root,'handlers/kitsune/learningPhrases'));
for(const [text,want]of [['ur so fkn annoying','your so fucking annoying'],['im completely tired','i am completely tired'],['why ru gay','why ru gay'],['kitsune yo moonfox','kitsune yo moonfox']]){eq(canonical(text),want);eq(learningPhrase(text),want);}
eq(recognize('a'.repeat(2001)),null);eq(prepareInput('ქართული').valid,false);eq(meaningVariants('a'.repeat(1001)).length,0);
for(const id of ['member',settings.OWNER_ID,settings.dialogue.maeId]){
 const m={guildId:'g',channelId:'c',author:{id}};
 const send=text=>{const req=parse(msg(text),100);assert.ok(req,text);count++;const out=respond(m,req);assert.ok(out.payload.content?.length,text);count++;session={...context.memoryAfter(session,req,out),category:out.category,messageId:'last',implicitUntil:200,question:out.question};return {req,out};};
 session=null;
 for(const [text,category]of compounds){const item=send('kitsune '+text);eq(item.req.category,category,text);eq(item.req.declineAdvice,true);eq(session.noAdviceRemaining,4);assert.ok(/no advice/i.test(item.out.payload.content));count++;}
 send('kitsune i need some company');eq(send('work has been getting on my nerves lately').req.category,'day_work_stress');
 eq(send('not the job itself mostly the people').req.category,'day_people');
 send('kitsune change the subject');eq(parse(msg('not the job itself mostly the people'),100),null);
 eq(parse(msg('feel mentally drained',{messageId:'someone-else'}),100),null);
 session=null;eq(parse(msg('feel mentally drained'),100),null);
 // Built-in variant matches retain priority over learned meanings.
 eq(parse(msg('kitsune im completely tired'),100,new Map([['i am completely tired','joke']])).category,'tired');
 const stored=canonical('yo moonfox');eq(parse(msg('kitsune yo moonfox'),100,new Map([[stored,'hi']])).category,'hi');
}
console.log(`${count} shared preparation, generated paraphrase, held-out combination, compound meaning and compatibility checks passed.`);
