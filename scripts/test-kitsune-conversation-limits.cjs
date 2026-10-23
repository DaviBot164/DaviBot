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
// Varied requests with both excluded topics retain the same bounded intent.
for(const start of ['can we','could we','shall we','let us','lets'])
 for(const verb of ['talk','chat'])for(const boundary of ['that isnt','other than','besides','except'])
 for(const topics of ['work or school','school and work']){
  const text=start+' '+verb+' about something '+boundary+' '+topics;
  eq(recognize(text),'light_topic',text);
 }
for(const text of ['can we talk about work or school','can we not talk about something other than work or school','someone said can we talk about something other than work or school','can we talk about something other than work or work','can we talk about something that is work or school','i want to work at a school'])ok(recognize(text)!=='light_topic',text);
for(const id of [settings.OWNER_ID,settings.dialogue.maeId,'member']){
 state.sessions.clear();
 send('kitsune kinda drained dont really need advice tho','tired',id);
 send('just a lot going on lately','day_overload',id);
 send('mostly people expecting too much from me','day_pressure',id);
 send('not saying theyre bad people im just overwhelmed','day_fairness',id);
 let turn=send('actually what would u do in my place','advice_resume',id);
 eq(turn.session.topicCategory,'day_fairness');eq(turn.session.noAdviceRemaining,0);
 for(const text of ['i cant just say no to everyone tho','i cannot simply turn down everybody','i cannot refuse every request']){
  turn=send(text,'day_limits',id);eq(turn.session.topicCategory,'day_limits');
  // Suggestions require the recent explicit request, not just a mood disclosure.
  if(turn.req.conversation.history.some(row=>row.request==='advice_resume'))ok(/smaller commitment|later time/i.test(turn.out.payload.content));
 }
 turn=send('can we talk about something that isnt work or school?','light_topic',id);
 // The old pressure topic closes, and the newly offered music topic is retained.
 eq(turn.session.topicCategory,'music_chat');eq(turn.session.pending,null);eq(turn.session.mood,null);
 ok(/music|song/i.test(turn.out.payload.content));ok(!/work|school|expectations/i.test(turn.out.payload.content));
 eq(parse(message('i cant just say no to everyone',id),now),null,'pressure continuation closed');
 eq(parse(message('mostly because of work',id),now),null,'no stale work context');
 // The exact public-account conversation remains usable before the new topic.
 state.sessions.clear();
 send('kitsune ngl that explanation went over my head','answer_confusing',id);
 send('not saying its wrong i just didnt get it','answer_confusing',id);
 turn=send('could u put it in simpler words','simplify',id);
 ok(/show me one unclear sentence/i.test(turn.out.payload.content),'simplifies its own clarification request');
 send('wow yeah totally understood everything','ambiguous_praise',id);
 send('that was sarcasm btw im still confused','sarcasm_clear',id);
 send('my bad lets start fresh','restart_chat',id);
 turn=send('can we talk about something that isnt work or school','light_topic',id);
 ok(/song/i.test(turn.out.payload.content));
 // A listening preference cannot silently turn into unsolicited boundary advice.
 state.sessions.clear();
 send('kitsune people expect too much from me','day_pressure',id);
 send('just listen','decline_advice',id);
 turn=send('i cannot just say no to everyone','day_limits',id);
 ok(!/you could|try |you should|smaller commitment|later time/i.test(turn.out.payload.content));
 eq(turn.session.noAdviceRemaining,3);
 // Full standalone requests work, while context fragments never borrow a topic.
 state.sessions.clear();
 turn=send('kitsune could we chat about something besides school and work','light_topic',id);
 eq(parse(message('i cannot refuse everybody',id),now),null);
 send('kitsune pick tea / coffee','pick',id);
 eq(parse(message('i cannot refuse everybody',id),now),null);
 send('kitsune can you help me study','study_start',id);
 eq(parse(message('i cannot refuse everybody',id),now),null);
}
// Meaningful negation and subjects remain separate from the scoped limitation.
state.sessions.clear();
send('kitsune people expect too much from me','day_pressure');
for(const text of ['i can just say no to everyone','my friend cannot say no to everyone','i cannot say yes to everyone','someone said i cannot refuse everyone','i cannot just say no to everyone and i hate them'])ok(parse(message(text),now)?.category!=='day_limits',text);
eq(parse(message('i cannot refuse everyone','other'),now),null);
eq(parse(message('i cannot refuse everyone','member','elsewhere'),now),null);
console.log(count+' advice-limit continuation, topic exclusion, listening scope and clarification checks passed. No real database or Discord calls.');
