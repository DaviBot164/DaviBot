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
const settings=require(path.join(root,'handlers/kitsune/settings'));
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




let turns=chain(['yo kitsu, u jealous or nah?','chill, me n daviti r just friends','he helped me, thats it','wasnt tryna make u mad','can u ask me smth easy?']);ok(!/davi/i.test(turns[0].reply),'do not introduce Davi without context');ok(/help/.test(turns[2].reply));ok(/quarrel/.test(turns[3].reply));eq(turns[4].category,'brief_question');
turns=chain(['kitsune are you jealous?','chill, me n daviti r just friends','he helped me, thats it','wasnt tryna make u mad','can u ask me smth easy?']);ok(!/davi/i.test(turns[0].reply));
turns=chain(['kitsune ur not useless, that reply just confused me','someone said ur dumb, wasnt me tho','im defending u, not mocking u','ngl daviti didnt do anything wrong','lets chill n talk normally']);ok(/answer, not me/.test(turns[0].reply));ok(/not.*yours|not.*insult/.test(turns[1].reply));ok(/not.*attack/.test(turns[2].reply));ok(/defending Davi/.test(turns[3].reply));eq(turns[4].category,'normal_chat');
chain(['kitsune someone said ur dumb, wasnt me tho','kitsune im defending u, not mocking u','kitsune ngl daviti didnt do anything wrong','kitsune lets chill n talk normally']);
turns=chain(['kitsune wow, big attitude for a bot that cant answer','ur reply was trash, didnt say u were','not asking for drama, just explain','aight my bad, lets reset','so, can u ask me a simple question?']);ok(/attitude/.test(turns[0].reply));ok(/attitude/.test(turns[2].reply));ok(!/insult/.test(turns[2].reply));eq(turns[3].category,'restart_chat');eq(turns[4].category,'brief_question');
turns=chain(['kitsune lets talk about games','mostly pve','actually pvp not pve','what did i say i prefer','make it shorter','shorter please']);ok(/prefer PvP/.test(turns[4].reply));ok(!/means|other players/.test(turns[4].reply));eq(turns[5].reply,turns[4].reply);
turns=chain(['kitsune lets talk about games','mostly pve','make it shorter']);ok(/enemies/.test(turns[2].reply),'definition shortening still works');
for(const persona of ['owner','mae','ash','member']){
 const rows=chain(['kitsu u jealous or nah?','chill me and daviti r just friends','wasnt tryna make u mad','so can u ask me something easy'],persona);
 ok(!/davi/i.test(rows[0].reply),'no arbitrary named target '+persona);ok(!/insult|cheap shots|attack/.test(rows[2].reply),'reassurance calm '+persona);
}
state.sessions.clear();now=1000;
send('kitsune u jealous or nah','core_jealous_question');let t=send('he helped me thats it','core_who');ok(/Who/.test(t.out.payload.content),'no unintroduced pronoun target');
send('kitsune i like daviti','core_jealous');t=send('he helped me thats it','core_davi_helped');eq(t.session.core.person,'davi');
send('kitsune change the subject','topic_change');t=send('he helped me thats it','core_who');ok(/Who/.test(t.out.payload.content));
send('kitsune lets talk about games','game_chat');send('mostly pve','game_relaxed');send('pvp not pve','flow_game_correct');send('what did i say i prefer','flow_game_recall');t=send('make it shorter','flow_game_short');eq(t.session.thread.replyKind,'recall');
send('aight my bad lets reset','restart_chat');eq(state.getSession(message(''),now).thread,null);eq(state.getSession(message(''),now).core,null);
const {recoverIntent}=require(path.join(root,'handlers/kitsune/intentRecovery'));const {prepareInput}=require(path.join(root,'handlers/kitsune/language'));
for(const text of ['my friend is jealous or not','someone said are you jealous','i was tryna make you mad','i am mocking you not defending you','daviti did do something wrong']){
 const request=recoverIntent(prepareInput(text),null);ok(!['jealous_question','intent_reassure','defend_bot','defend_davi'].includes(request?.kind),'negation/subject '+text);
}

for(const seed of [1,17,81]){
 const rows=runLab({...input,seed,text:'YO KITSU u jealous or nah? || relax me and daviti r just friends || he helped me thats it || wasnt trying to make u mad || so could u ask me a simple question'}).turns;
 for(const row of rows)eq(row.status,'matched','held-out seed '+seed);ok(!/davi/i.test(rows[0].reply));
}
chain(['kitsune u jealous','not tryna make u mad','so please ask me something easy']);
chain(['kitsune ur not useless but that reply just confused me','kitsune someone said ur useless it wasnt me','kitsune im defending u not mocking u']);
state.sessions.clear();let ref=send('kitsune tell me a secret','secret').session.templateRef;
send('kitsune ur reply was trash didnt say u were','answer_feedback');eq(state.getSession(message(''),now).templateRef,ref,'critique retains the actual explanation reference');
send('not asking for drama just explain','core_answer_repair');eq(state.getSession(message(''),now).templateRef,ref,'explanation keeps its own reference');
let request=parse(message('kitsune someone said ur dumb wasnt me tho'),now);eq(request.understanding.reported,true);eq(request.understanding.target,'kitsune');
request=parse(message('kitsune im defending u not mocking u'),now);eq(request.understanding.target,'kitsune');eq(request.understanding.polarity,'negated');
request=parse(message('kitsune ngl daviti didnt do anything wrong'),now);eq(request.understanding.target,'davi');eq(request.understanding.polarity,'negated');
console.log(`${count} casual shorthand, denial/report scope, reassurance, restart and reply-purpose shortening checks passed. No real database or Discord calls.`);
