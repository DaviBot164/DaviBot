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







const ids=[settings.OWNER_ID,settings.dialogue.maeId,'1322228925421850644','member'];
for(const id of ids){
 state.sessions.clear();const first=send('kitsune pick tea / water','pick',id);const chosen=first.out.pickSelected;
 send('thanks','thanks',id);let r=send('what did you pick?','core_choice_info',id);ok(r.out.payload.content.includes(chosen),'recall exact pick after thanks');
 r=send('pick the other one','pick_other',id);ok(r.out.pickSelected!==chosen,'other option uses stored choice');
 const other=r.out.pickSelected;
 send('why?','why',id);r=send('what are the options now?','core_choice_info',id);ok(r.out.payload.content.includes('tea')&&r.out.payload.content.includes('water'));
 send('i meant tea or coffee','pick',id);r=send('what are the options now?','core_choice_info',id);ok(!r.out.payload.content.includes('water'),'old option gone');
 send('kitsune lets talk about music instead','core_music_topic',id);eq(state.getSession(message('',id),now).pickOptions,null,'real new topic clears pick');
 send('quiet music','core_music_quiet',id);send('sometimes louder though','core_music_mix',id);send('both depends on my mood','core_music_mood',id);send('wbu','music_preferences',id);
 send('kitsune lets talk about games','game_chat',id);send('both tbh','core_game_both',id);send('depends who im playing with','core_game_company',id);send('usually with friends','core_game_friends',id);send('wbu','game_preferences',id);
 send('kitsune can you help me study?','study_start',id);send('yes but later','core_defer',id);eq(state.getSession(message('',id),now).pending,null,'deferral clears pending study');
 send('lets talk instead','chat_open',id);send('i meant help with a game','core_game_help',id);send('can you help with that?','core_game_help',id);
 send('kitsune change the subject','topic_change',id);eq(state.getSession(message('',id),now).core,null,'reset clears recovery topic');
 state.sessions.clear();send('kitsune davi is nice','reaction_davi',id);send('he is funny too','core_davi_followup',id);send('i mean davi','core_davi_followup',id);
 send('kitsune change the subject','topic_change',id);r=send('what do you think about him?','core_who',id);ok(/who/i.test(r.out.payload.content),'do not borrow closed person');
 state.sessions.clear();send('kitsune ask me something easy','brief_question',id);r=send('actually the other one','brief_other_option',id);ok(/which one you chose first/i.test(r.out.payload.content),'do not guess previous unchosen option');
 send('changed my mind lol','core_changed_mind',id);r=send('what was the question again?','core_question_repeat',id);ok(/music or movies/i.test(r.out.payload.content),'repeat exact saved question');
 state.sessions.clear();send('kitsune give me advice','tip',id);r=send('shorter','core_explain',id);ok(r.out.payload.content.split(/[.!?]/).filter(Boolean).length<=1,'one sentence');
 send('one sentence please','core_explain',id);r=send('give me an example','core_explain',id);ok(/for example|which words/i.test(r.out.payload.content),'example or honest detail request');
 state.sessions.clear();send('kitsune hear me out','decline_advice',id);send('i had an argument with a friend','core_argument',id);r=send('im upset but not with you','core_argument',id);ok(/not at me|not make it about myself/i.test(r.out.payload.content));
 send('please dont interrupt','core_listen_quiet',id);r=send('okay now what do you think?','core_opinion',id);ok(/friend|intent/i.test(r.out.payload.content),'listening control preserved argument topic');
}
// No cross-user or cross-channel recovery memory, and no ambient interception.
state.sessions.clear();send('kitsune davi helped me','core_davi_helped','alice');eq(parse(message('he is funny too','bob'),now),null);eq(parse(message('he is funny too','alice','elsewhere'),now),null);
for(const text of ['maybe later','not okay','can i explain','quiet music','he explained the rules','mommy']){state.sessions.clear();eq(parse(message(text),now),null,'no unaddressed inactive conversation');}
console.log(count+' long-chain, choice retention, topic reset, scoped question and recovery-context checks passed. No real database or Discord calls.');
