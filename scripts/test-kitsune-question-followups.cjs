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






let turns=chain(['kitsune ask me smth chill, nothing personal','seaside','why that question?','another one','no choices this time, just an easy question']);ok(/seaside/i.test(turns[1].reply));ok(/nonpersonal/.test(turns[2].reply));ok(!/ or /.test(turns[4].reply));
turns=chain(['kitsune ask me smth chill, nothing personal','a seaside view','i like the sound of waves','what about you?','ask something without giving me options']);ok(/waves/.test(turns[2].reply));ok(/forest|fox style/.test(turns[3].reply));ok(!/How are you|How are things/.test(turns[3].reply));ok(!/ or /.test(turns[4].reply));
for(const lines of [
 ['kitsune daviti helped me','with the server rules','i didnt understand them at first','he explained it simply','thats why im grateful'],
 ['kitsune daviti helped me','he explained the rules','i get them now','thats why im grateful','not flirting, just grateful']
]){
 turns=chain(lines);for(const row of turns)ok(!/flirt|jealous|affection|fondly/i.test(row.reply),'no unsolicited romance in help chain: '+row.input);
 ok(/rules/.test(turns[1].reply));ok(/grateful|appreciate|help/.test(turns[4].reply));
}
state.sessions.clear();now=1000;
send('kitsune ask me smth chill nothing personal','core_nonpersonal_question');let t=send('seaside','core_light_answer');eq(t.session.core.selected,'seaside');t=send('i like the sound of waves','core_light_waves');eq(t.session.core.reason,'waves');
t=send('what about you','core_light_reciprocal');eq(t.session.core.selected,'seaside');eq(t.session.core.reason,'waves');
send('why that question','core_light_reason');eq(state.getSession(message(''),now).core.nonPersonal,true);
t=send('no choices this time just an easy question','core_nonpersonal_question');eq(t.session.core.questionStyle,'open');t=send('another one','core_nonpersonal_question');eq(t.session.core.questionStyle,'open');ok(!/ or /.test(t.out.payload.content));
send('kitsune change the subject','topic_change');eq(parse(message('seaside'),now),null);eq(parse(message('i like the sound of waves'),now),null);
send('kitsune daviti helped me','core_davi_helped');t=send('with the server rules','core_help_detail');eq(t.session.core.helpTopic,'server_rules');t=send('he explained it simply','core_help_explained');eq(t.session.core.helpTopic,'server_rules');t=send('i get them now','core_help_understood');eq(t.session.core.helpStage,'understood');t=send('thats why im grateful','core_help_grateful');eq(t.session.core.person,'davi');eq(t.session.core.helpStage,'grateful');
const key=state.sessionKey(message(''));const before=JSON.stringify(state.sessions.get(key));eq(parse(message('with the server rules','other'),now),null);eq(parse(message('with the server rules','member','elsewhere'),now),null);eq(JSON.stringify(state.sessions.get(key)),before,'other users do not mutate context');
send('nvm lets start over','restart_chat');eq(parse(message('i get them now'),now),null);eq(parse(message('thats why im grateful'),now),null);
for(const persona of ['owner','mae','ash','member']){
 const rows=chain(['kitsune daviti helped me','with the server rules','he explained them simply','now they make sense','thats why im grateful'],persona);for(const row of rows)ok(!/flirt|jealous/i.test(row.reply),'help tone '+persona);
 chain(['kitsune ask me something chill nothing personal','seaside view','what about you','ask a question without options'],persona);
}
for(const seed of [1,17,81]){
 const rows=runLab({...input,seed,text:'KITSUNE ask me a light question nothing personal! || a seaside view || why did you ask that || how about you || could you ask something without giving me options'}).turns;
 for(const row of rows)eq(row.status,'matched','held-out seed '+seed);
}
const {recoverIntent}=require(path.join(root,'handlers/kitsune/intentRecovery'));const {prepareInput}=require(path.join(root,'handlers/kitsune/language'));
for(const line of ['seaside','a seaside view','i like the sound of waves','with the server rules','he explained it simply','i get them now','thats why im grateful'])eq(recoverIntent(prepareInput(line),null),null,'unscoped '+line);
for(const line of ['my friend likes the sound of waves','i do not like the sound of waves','someone said a seaside view']){
 const req=recoverIntent(prepareInput(line),{core:{nonPersonal:true,questionIndex:0,selected:'seaside'}});ok(!req?.kind.startsWith('light_'),'subject/negation '+line);
}
for(const line of ['she explained them simply','i did understand them at first','i do not get them now','he did not explain it simply']){
 const req=recoverIntent(prepareInput(line),{core:{person:'davi',topic:'help',helpTopic:'server_rules'}});ok(!req?.kind.startsWith('help_'),'help polarity '+line);
}
const neutral=chain(['kitsune daviti helped me','he is funny too']);ok(!/flirt|jealous/i.test(neutral[1].reply),'legacy follow-up stays neutral');
console.log(`${count} asked-question answer slots, reciprocal topic, open prompts and help-understanding-gratitude checks passed. No real database or Discord calls.`);
