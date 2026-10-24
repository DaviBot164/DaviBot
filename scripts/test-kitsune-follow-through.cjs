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

function chain(lines,persona='member'){
 const result=runLab({...input,persona,seed:17,text:lines.join(' || ')});
 for(const turn of result.turns){ok(turn.status==='matched',turn.input+': '+turn.status+' '+turn.reply);ok(!['fallback','clarify','reaction_question'].includes(turn.category),turn.input);}
 return result.turns;
}
const friend=chain(['kitsune hear me out','i had an argument with a friend','im upset, but not with you','please dont interrupt','okay, now what do you think?','he ignored what i said','maybe he was just busy','i dont want to assume the worst','what should i say to him?','something short and polite']);
ok(/possibility|do not know/.test(friend[6].reply));ok(/You could say/.test(friend[8].reply));ok(friend[9].reply.length<friend[8].reply.length,'shorter concrete draft');
for(const line of ['kitsune my friend ignored me','kitsune i feel ignored','kitsune what should i say to my friend?','kitsune help me write a polite message'])chain([line]);
ok(!/your friend/.test(chain(['kitsune i feel ignored'])[0].reply),'do not invent friend');
const boundary=chain(['kitsune i dont want to play today','my friends keep asking','i already said no','how do i say it nicely?','without sounding rude']);
ok(/You could say/.test(boundary[3].reply));ok(/not playing|not play/.test(boundary[4].reply));
const choice=chain(['kitsune pick music / movies','why movies?','i actually prefer music','then why did you pick movies?','okay, lets go with music']);
ok(/\*\*music\*\*/.test(choice[0].reply));ok(/current choice is \*\*music\*\*/.test(choice[1].reply));ok(/random/.test(choice[3].reply));ok(/your choice/.test(choice[4].reply));
const jokes=chain(['kitsune tell me a short joke','another one, but about games','no sarcasm this time','actually, something wholesome','thats more like it']);
ok(jokes[0].reply.length<250);ok(/game|loading|treasure|health|checkpoint|party|healer/i.test(jokes[1].reply));ok(/gentle|sarcasm/.test(jokes[2].reply));ok(/better|gentle/.test(jokes[4].reply));
const music=chain(['kitsune lets talk about music','i mostly listen at work','mostly rock','not always though','sometimes quiet piano','depends how my day went','what about you?']);
ok(/working/.test(music[1].reply));ok(/rock/.test(music[2].reply));ok(/piano/.test(music[4].reply));ok(/character/.test(music[6].reply));
chain(['kitsune ask me something easy','music','mostly rock','especially when im working','what about you?']);
const pause=chain(['kitsune can you help me study?','sure','wait a second','not yet','okay, continue','actually, lets stop']);
ok(/paused/.test(pause[3].reply));eq(pause[4].after,'study_step');ok(/exercise|paragraph/.test(pause[4].reply));
for(const persona of ['owner','mae','ash'])chain(['kitsune my friend ignored me','maybe he was just busy','what should i say to him?'],persona);
for(const line of ['he ignored what i said','mostly rock','sometimes quiet piano','without sounding rude','okay continue','not yet']){
 resetLab(input);const result=runLab({...input,seed:17,text:line});eq(result.turns[0].status,'ignored','unscoped '+line);
}
const {prepareInput}=require(path.join(root,'handlers/kitsune/language'));
const {analyzeFollowThrough,followThroughMemory}=require(path.join(root,'handlers/kitsune/followThrough'));
for(const line of ['my friend likes rock','my friend is working','why are you useless','my friend told a joke'])eq(analyzeFollowThrough(prepareInput(line),{topicCategory:'music_chat',pickOptions:['tea','coffee'],pickSelected:'tea'}),null,line);
eq(followThroughMemory({thread:{kind:'music',genre:'rock'},suspended:{category:'music_chat'}},{category:'topic_change'},{}),{thread:null,suspended:null});
for(const line of ['could you tell me a short joke','please tell me a wholesome joke about games','tell me a gaming joke'])chain(['kitsune '+line]);
chain(['kitsune tell me a joke','no sarcasm this time','another one, but about games','something wholesome']);
const serious=chain(['kitsune be serious','kitsune tell me a short joke']);ok(/skip jokes/.test(serious[1].reply));
console.log(`${count} full-chain continuation, scoped draft, choice premise, joke modifier, music and pause checks passed. No real database or Discord calls.`);
state.sessions.clear();now=1000;
send('kitsune can you help me study?','study_start');send('sure','study_step');
let turn=send('wait a second','pause');eq(turn.session.topicCategory,'study_step');eq(turn.session.suspended.category,'study_step');
turn=send('not yet','flow_hold');eq(turn.session.suspended.category,'study_step');
turn=send('okay continue','flow_resume');eq(turn.session.category,'study_step');eq(turn.session.suspended,null);eq(turn.session.pending.kind,'study_step');
send('kitsune lets talk about music','music_chat');turn=send('mostly rock','flow_music_genre');eq(turn.session.thread.genre,'rock');
turn=send('sometimes quiet piano','flow_music_genre');eq(turn.session.thread.genre,'rock');eq(turn.session.thread.alternate,'quiet piano');
turn=send('kitsune change the subject','topic_change');eq(turn.session.thread,null);eq(parse(message('mostly rock'),now),null);
eq(parse(message('mostly rock','someone-else'),now),null);
send('kitsune pick tea / coffee','pick');const initial=state.getSession(message(''),now).pickSelected;
const other=initial==='tea'?'coffee':'tea';turn=send('i prefer '+other,'flow_choice_prefer');eq(turn.session.pickSelected,initial,'preference alone does not silently rewrite random draw');eq(turn.session.thread.origin,initial);
turn=send('lets go with '+other,'flow_choice_decide');eq(turn.session.pickSelected,other);eq(turn.session.thread.origin,initial);eq(turn.session.thread.source,'user');
turn=send('why '+other,'flow_choice_why');ok(/your choice/.test(turn.out.payload.content));
send('wait a second','pause');turn=send('not yet','flow_hold');eq(turn.session.pickOptions,['tea','coffee']);turn=send('continue','flow_resume');eq(turn.session.pickSelected,other);
send('kitsune stop','stop');eq(state.getSession(message(''),now).thread,null);eq(parse(message('continue'),now),null);
send('kitsune my friend ignored me','flow_friend_event');turn=send('what should i say to him','flow_draft');eq(turn.session.thread.draft,'checkin');ok(!JSON.stringify(turn.session.thread).includes('ignored me'),'semantic slots do not retain transcript');
now+=120001;eq(parse(message('maybe he was busy'),now),null,'expired follow-up ignored');
console.log(`${count} total continuation and memory lifecycle checks passed.`);
