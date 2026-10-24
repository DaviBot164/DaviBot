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







for(const id of [settings.OWNER_ID,settings.dialogue.maeId,'1322228925421850644','member']){
 state.sessions.clear();const turn=send('kitsune mommy','core_mommy',id);
 eq(/daddy/i.test(turn.out.payload.content),id===settings.OWNER_ID,'owner nickname by account ID');
 if(id!==settings.OWNER_ID)ok(/no|nickname|normally/i.test(turn.out.payload.content),'member boundary');
 const normal=send('kitsune thanks','thanks',id);ok(!/daddy/i.test(normal.out.payload.content),'nickname not injected into every reply');
}
state.sessions.clear();send('kitsune just call me Davi','core_name');
const spoof=send('kitsune mommy','core_mommy');ok(!/daddy/i.test(spoof.out.payload.content),'display name cannot impersonate owner');
state.sessions.clear();send('kitsune just call me Tanya','core_name');
const nameTurn=send('kitsune thanks','thanks');ok(/tanya/i.test(nameTurn.out.payload.content),'requested name is used');
state.sessions.clear();send('kitsune please take me seriously','tone_serious');const serious=send('kitsune you are annoying','reaction_insult');ok(!/no point|material|tantrum/i.test(serious.out.payload.content));
const gratitude=send('kitsune thanks','thanks');ok(!/manners|civilized|chaos/i.test(gratitude.out.payload.content),'serious gratitude plain');
const constrained=send('kitsune tell me a joke but keep it short','core_joke_short');ok(/skip jokes/i.test(constrained.out.payload.content),'compound request honors serious mode');
send('kitsune you can joke again','tone_reset');eq(state.getSession(message(''),now).mode,null);
for(const text of ['davi helped me','davi needs help','im worried about davi']){
 state.sessions.clear();const req=parse(message('kitsune '+text),now),out=respond(message('kitsune '+text),req);ok(!/jealous|fondly|cheap shot/i.test(out.payload.content),'serious Davi context');
}
state.sessions.clear();const jealous=send('kitsune i like davi','reaction_davi');ok(/jealous|noticed/i.test(jealous.out.payload.content),'playful jealousy');
state.sessions.clear();let r=send('kitsune ur davi is stupid','core_protect');ok(/davi|insult|cheap shots/i.test(r.out.payload.content));
state.sessions.clear();r=send('kitsune someone called davi an idiot','core_report_davi');ok(/not blame you|reporting/i.test(r.out.payload.content),'do not attack reporter');
state.sessions.clear();r=send('kitsune i dont think davi is stupid','core_defend_davi');ok(/defending|not.*insult/i.test(r.out.payload.content));
state.sessions.clear();r=send('kitsune sorry but that answer hurt','core_feedback_hurt');ok(/sorry|bothered|address/i.test(r.out.payload.content),'acknowledge hurt as well as apology');eq(r.session.mode?.name,'gentle');
for(const text of ['im sleepy but not tired','im not tired my friend is','i was tired yesterday','im no longer tired']){
 state.sessions.clear();const req=parse(message('kitsune '+text),now),out=respond(message('kitsune '+text),req);
 if(text.includes('my friend')){eq(req.understanding.target,'friend');ok(/friend/i.test(out.payload.content));}
 if(text==='i was tired yesterday')ok(/earlier|feeling now/i.test(out.payload.content),'past not current');
 if(text==='im no longer tired'){eq(req.understanding.polarity,'negated');ok(/no longer/i.test(out.payload.content));}
 if(text==='im sleepy but not tired')ok(/sleepy/i.test(out.payload.content) && /not (?:worn out|tired)/i.test(out.payload.content),'retain sleepiness and denied fatigue');
}
state.sessions.clear();const a=send('kitsune hru','mood'),b=send('kitsune hru','mood');ok(a.out.payload.content!==b.out.payload.content,'mood answer rotation');
const cfg=require(path.join(root,'config/kitsuneEmoji'));ok(!cfg.pools.publicWarm.includes('😏'),'no smirk in default friendly expression pool');
// Conservative corrections do not rewrite legitimate neighboring words or remove negation.
for(const text of ['im paying','im praying','my friend is not nervous','someone said im cold','dont say hi','i didnt ask you to say hi','my friend gave me advice']){
 state.sessions.clear();const req=parse(message('kitsune '+text),now);ok(!['core_hello','core_state','tired'].includes(req?.category),'no false positive: '+text);
}
console.log(count+' owner/friend/public tone, nickname consent, identity isolation, social scope and negative-control checks passed. No real database or Discord calls.');
