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
let parse,respond,context,state;
try{
 parse=require(parserPath).parseRequest;respond=require(responsePath).buildResponse;
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
// Both independently resolving clauses retain their meaning in either order.
for(const mood of ['kinda drained','im really tired','feeling overwhelmed','i feel lonely']){
 const want=mood.includes('overwhelmed')?'feeling_bad':mood.includes('lonely')?'lonely':'tired';
 for(const refusal of ['dont really need advice','i dont actually want any tips','no suggestions']){
  for(const join of [', ',' but ',' and '])for(const reversed of [false,true]){
   const text=(reversed?refusal+join+mood:mood+join+refusal)+' tho';
   const got=recognizeDetails(text);eq(got.category,want,text);eq(got.declineAdvice,true,text);eq(got.understanding.listening,true,text);
  }
 }
}
const heldout=[
 ['ngl kinda drained, dont really need advice tho','tired'],
 ['just a lot going on lately','day_overload'],
 ['there has been too much happening recently','day_overload'],
 ['mostly people expecting too much from me','day_pressure'],
 ['my friends expect too much of me','day_pressure'],
 ['not saying theyre bad people, im just overwhelmed','day_fairness'],
 ['im not saying they are bad people but im only stressed','day_fairness'],
 ['actually what would u do in my place','advice_resume'],
 ['what would you do if you were me','advice_resume'],
 ['ngl that explanation went over my head','answer_confusing'],
 ['your reply went straight over my head','answer_confusing'],
 ['not saying its wrong, i just didnt get it','answer_confusing'],
 ['im not saying that was wrong but i couldnt follow the explanation','answer_confusing'],
 ['could u put it in simpler words','simplify'],
 ['would you please explain your answer in plain english','simplify'],
 ['wow yeah totally understood everything','ambiguous_praise'],
 ['that was sarcasm btw, im still confused','sarcasm_clear'],
 ['i was being sarcastic but i still dont get it','sarcasm_clear'],
 ['my bad, lets start fresh','restart_chat'],
 ['sorry can we start again','restart_chat']
];
for(const [text,want]of heldout)eq(recognize(text),want,text);
// Negation, subjects, reports and unknown third clauses must not be erased.
for(const text of [
 'my friend is drained dont really need advice','im not drained dont really need advice',
 'i was drained yesterday dont need advice','im tired but my friend doesnt need advice',
 'im tired dont need advice and tell me a secret','someone said "kinda drained dont really need advice"',
 'i dont need advice to repair the car','i do need advice','i dont need to listen to music'
])ok(!recognizeDetails(text).declineAdvice,'not a self-state/listening compound: '+text);
for(const text of ['nothing went over my head','your answer did not go over my head','that plane went over my head','she said your explanation went over my head'])ok(recognize(text)!=='answer_confusing',text);
for(const text of ['people dont expect too much from me','my friend said everyone expects too much from me','they are bad people and i am overwhelmed'])ok(!['day_pressure','day_fairness'].includes(recognize(text)),text);
ok(recognize('what would you not do in my place')!=='advice_resume');
ok(recognize('dont start fresh')!=='restart_chat');
eq(recognize('a'.repeat(2001)),null);
// The posted complete dialogues, including implicit turns and explicit advice changes.
for(const id of [settings.OWNER_ID,settings.dialogue.maeId,'member']){
 state.sessions.clear();
 let turn=send('kitsune kinda drained, dont really need advice tho','tired',id);
 eq(turn.req.declineAdvice,true);eq(turn.session.noAdviceRemaining,4);
 ok(/no advice/i.test(turn.out.payload.content));
 for(const [text,category]of [
  ['just a lot going on lately','day_overload'],
  ['mostly people expecting too much from me','day_pressure'],
  ['not saying theyre bad people, im just overwhelmed','day_fairness']
 ]){
  turn=send(text,category,id);eq(turn.session.topicCategory,category);
  ok(!/you should|try doing|start with|take a break/i.test(turn.out.payload.content),'listens without advice');
 }
 turn=send('actually, what would u do in my place?','advice_resume',id);
 eq(turn.session.noAdviceRemaining,0);ok(/expect|realistically/i.test(turn.out.payload.content));
 send('kitsune change the subject','topic_change',id);
 eq(parse(message('mostly because of work',id),now),null,'old topic is closed');
 state.sessions.clear();
 send('kitsune ngl that explanation went over my head','answer_confusing',id);
 send('not saying its wrong, i just didnt get it','answer_confusing',id);
 turn=send('could u put it in simpler words?','simplify',id);
 ok(/which|part|sentence/i.test(turn.out.payload.content),'does not invent an unseen explanation');
 send('wow yeah totally understood everything','ambiguous_praise',id);
 send('that was sarcasm btw, im still confused','sarcasm_clear',id);
 turn=send('my bad, lets start fresh','restart_chat',id);
 eq(turn.session.topicCategory,null);eq(turn.session.pending,null);eq(turn.session.noAdviceRemaining,0);
 // For known content, simpler wording should actually use that content.
 turn=send('kitsune pick tea / coffee','pick',id);
 turn=send('could u put it in simpler words','simplify',id);
 ok(/random/i.test(turn.out.payload.content),'explains the real prior choice');
}
// Actual session keys: one speaker/channel cannot lend its context to another.
state.sessions.clear();
send('kitsune kinda drained dont really need advice','tired','alice','one');
eq(parse(message('just a lot going on lately','bob','one'),now),null);
eq(parse(message('just a lot going on lately','alice','two'),now),null);
eq(parse(message('just a lot going on lately','alice','one',{messageId:'someone-else'}),now),null);
ok(parse(message('just a lot going on lately','alice','one'),now));
eq(parse(message('just a lot going on lately','alice','one'),now+120001),null);
// Understanding variants do not rewrite stored learning keys.
eq(canonical('dont really need advice tho'),'do not really need advice though');
console.log(count+' informal listening, pressure, comprehension idiom and full-conversation checks passed. No real database or Discord calls.');
