'use strict';
const assert=require('node:assert/strict'),path=require('node:path'),Module=require('node:module');
const root=process.argv[2]||path.resolve(__dirname,'..');
const {recognize,recognizeDetails,canonical}=require(path.join(root,'handlers/kitsune/language'));
let count=0;
const eq=(actual,expected,label)=>{assert.deepEqual(actual,expected,label);count++;};
const ok=(value,label)=>{assert.ok(value,label);count++;};
const original=Module._load;
const parserPath=path.join(root,'handlers/kitsune/parser.js'),responsePath=path.join(root,'handlers/kitsune/responses.js'),statePath=path.join(root,'handlers/kitsune/state.js');
const pools={...require(path.join(root,'config/kitsuneReplies'))};
for(const [key,value]of Object.entries(require(path.join(root,'config/kitsunePersonality')).ownerReplies))pools['owner_'+key]=value;
for(const [key,value]of Object.entries(require(path.join(root,'config/kitsuneDialogue')).pools))pools['dialogue_'+key]=value;
const settings={OWNER_ID:'1357721282061533311',dialogue:{maeId:'1380278195961729084'},replies:pools,STATE_TTL:1800000};
Module._load=function(request,parent){
 if([parserPath,responsePath,statePath].includes(parent?.filename)&&request==='./settings')return settings;
 if(parent?.filename===responsePath&&request==='discord.js')return{escapeMarkdown:x=>x};
 if(parent?.filename===responsePath&&request==='./help')return{buildHelp:()=>({})};
 return original.apply(this,arguments);
};
let parse,respond,context,state,toneFor;
try{
 parse=require(parserPath).parseRequest;respond=require(responsePath).buildResponse;toneFor=require(responsePath).toneFor;
 context=require(path.join(root,'handlers/kitsune/context'));state=require(statePath);
}finally{Module._load=original;}
let now=1000;
function message(text,id='member',channelId='chat',reference){return{content:text,guildId:'guild',channelId,author:{id},client:{user:{id:'bot'}},mentions:{},reference};}
function send(text,category,id='member',channel='chat'){
 const m=message(text,id,channel),req=parse(m,now);
 ok(req,'recognized turn: '+text);eq(req.category,category,text);
 const before=state.getSession(m,now),out=respond(m,req);
 ok(out.payload.content?.length,'reply: '+text);
 ok(!/try the (?:main )?request|shorter sentence|did not quite follow|did not find the main request/i.test(out.payload.content),'no fallback: '+text);
 state.sessions.set(state.sessionKey(m),{...context.memoryAfter(before,req,out),category:out.category,question:out.question??false,messageId:'last-'+now,implicitUntil:now+120000,expiresAt:now+120000});
 now+=5000;
 return{req,out,session:state.getSession(m,now)};
}







const {runLab,resetLab,formatReport}=require(path.join(root,'handlers/kitsune/testLab'));
const input={guildId:'guild',channelId:'lab-channel',userId:settings.OWNER_ID,botId:'123'};
const snapshot=()=>JSON.stringify({sessions:[...state.sessions],users:[...state.users],channels:[...state.channels]});
state.sessions.clear();state.users.clear();state.channels.clear();
send('kitsune pick tea / water','pick','live-person');send('kitsune hi','hi',settings.OWNER_ID);const liveBag=state.getReplyState(message('',settings.OWNER_ID));const originalBag=JSON.stringify([...liveBag.bags]);const before=snapshot();
let result=runLab({...input,text:'kitsune pick tea / water || thanks || the other one',seed:17});
eq(result.turns.length,3);eq(result.turns[0].category,'pick');eq(result.turns[2].category,'pick_other');eq(snapshot(),before,'simulation leaves live state intact');
const again=runLab({...input,text:'kitsune pick tea / water || thanks || the other one',seed:17});eq(again,result,'same seed and reset reproduces full scenario');
resetLab(input);result=runLab({...input,text:'kitsune can you help me study?'});eq(result.turns[0].category,'study_start');
result=runLab({...input,text:'sure'});eq(result.turns[0].category,'study_step','continue separate slash turn');
resetLab(input);result=runLab({...input,text:'sure',expected:'study_step'});eq(result.turns[0].status,'ignored');eq(result.turns[0].pass,false);
for(const persona of ['member','owner','mae','ash']){
 result=runLab({...input,persona,text:'kitsune mommy',seed:2});eq(/daddy/i.test(result.turns[0].reply),persona==='owner','simulated tone isolation');
}
result=runLab({...input,text:'kitsune hi',seed:3,expected:'hi'});eq(result.turns[0].pass,true);ok(/EXPECTED: hi \| PASS/.test(formatReport(result)));
result=runLab({...input,text:'kitsune hi',seed:3,expected:'tired'});eq(result.turns[0].pass,false);
for(const bad of [{userId:'member'},{persona:'constructor'},{persona:'toString'},{text:''},{text:'x'.repeat(1501)},{text:Array(11).fill('hi').join(' || ')},{seed:-1},{seed:1.5}]){
 assert.throws(()=>runLab({...input,text:'kitsune hi',...bad}));count++;
}
assert.throws(()=>resetLab({...input,userId:'member'}));count++;
resetLab(input);runLab({...input,text:'kitsune can you help me study?'});
result=runLab({...input,channelId:'different',text:'sure'});eq(result.turns[0].status,'ignored','channel isolation');
result=runLab({...input,guildId:'different',text:'sure'});eq(result.turns[0].status,'ignored','guild isolation');
result=runLab({...input,persona:'owner',text:'sure'});eq(result.turns[0].status,'ignored','persona isolation');
eq(snapshot(),before,'all simulation scenarios leave live state intact');eq(JSON.stringify([...liveBag.bags]),originalBag,'real owner reply bags stay untouched');
const help=runLab({...input,text:'kitsune help',seed:3});eq(help.turns[0].category,'help');ok(typeof help.turns[0].reply==='string');
const realNow=Date.now;let fakeNow=realNow();Date.now=()=>fakeNow;
try{runLab({...input,channelId:'expiry',text:'kitsune can you help me study?'});fakeNow+=121000;const expired=runLab({...input,channelId:'expiry',text:'sure'});eq(expired.turns[0].status,'ignored','real two-minute conversation expiry');}finally{Date.now=realNow;}
console.log(count+' isolated lab, reproducible seed, expectation, authorization and conversation-boundary checks passed. No real database or Discord calls.');
