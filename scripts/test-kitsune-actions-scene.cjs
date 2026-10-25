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








let turns=chain(['kitsune ash helped me out','with understanding the rules','i was confused before, but now i get it','actually mae explained them, ash just sent the link','who explained the rules?','who sent the link?','who helped me?']);
ok(!/explained|understand|follow them/.test(turns[1].reply),'subject alone proves no explanation');ok(/understand/.test(turns[2].reply));ok(/Mae explained.*Ash sent/.test(turns[3].reply));ok(/Mae/.test(turns[4].reply));ok(/Ash/.test(turns[5].reply));ok(/Ash/.test(turns[6].reply));
turns=chain(['kitsune ash helped me','with the server rules','mae explained the rules','ash sent me the link','who explained the rules?','who sent the link?']);ok(/Mae/.test(turns[4].reply));ok(/Ash/.test(turns[5].reply));
turns=chain(['kitsune ask me smth chill nothing personal','seaside','waves and a cool breeze','actually no breeze, just waves','what details do we have?','what would u add?']);ok(/waves/i.test(turns[4].reply));ok(!/breeze/i.test(turns[4].reply));
turns=chain(['kitsune ask me smth chill nothing personal','seaside','not too crowded','actually a few people are fine','what would u add?','not a lighthouse, something else','just one detail']);ok(/few people/.test(turns[3].reply));ok(!/lighthouse/.test(turns[5].reply));ok(/boat/.test(turns[6].reply));
state.sessions.clear();now=1000;
send('kitsune ash helped me out','core_help_started');let t=send('with understanding the rules','core_help_detail');eq(t.session.core.helpStage,'subject');eq(t.session.core.actions,undefined);eq(t.session.core.understood,undefined);
t=send('who explained the rules','core_help_actions');ok(/not said/.test(t.out.payload.content),'unknown explainer');t=send('who sent the link','core_help_actions');ok(/not said/.test(t.out.payload.content),'unknown sender');
send('mae explained them ash just sent the link','core_help_actions');t=send('who explained the rules','core_help_actions');eq(t.session.core.person,'ash','helper stays independent');eq(t.session.core.actions.explainedRules.person,'mae');eq(t.session.core.actions.sentLink.person,'ash');
send('daviti explained the rules','core_help_actions');t=send('who sent the link','core_help_actions');eq(t.session.core.actions.explainedRules.person,'davi');eq(t.session.core.actions.sentLink.person,'ash','changing explainer preserves sender');
t=send('i was confused before but now i get it','core_help_understood');eq(t.session.core.wasConfused,true);eq(t.session.core.understood,true);
send('nvm lets start over','restart_chat');eq(parse(message('who sent the link'),now),null);eq(parse(message('mae explained the rules'),now),null);
send('kitsune ask me something chill nothing personal','core_nonpersonal_question');send('seaside','core_light_answer');send('waves and a cool breeze','core_light_details');t=send('no breeze just waves','core_light_edit');eq(t.session.core.sceneDetails,['waves']);eq(t.session.core.excludedDetails,['breeze']);
send('not too crowded','core_light_limit');t=send('a few people are fine','core_light_crowd');eq(t.session.core.noCrowds,true);eq(t.session.core.crowdLimit,'few');
send('what would you add','core_light_suggest');t=send('not a lighthouse something else','core_light_suggest');eq(t.session.core.suggestion,'boat');ok(t.session.core.rejectedSuggestions.includes('lighthouse'));
t=send('not a boat something else','core_light_suggest');eq(t.session.core.suggestion,'driftwood');t=send('not driftwood something else','core_light_suggest');eq(t.session.core.suggestion,null);ok(!/lighthouse|boat/.test(t.out.payload.content),'do not resurrect rejected objects');
t=send('crowded is fine','core_light_crowd');eq(t.session.core.noCrowds,false);t=send('what details do we have','core_light_recall');ok(!/uncrowded/.test(t.out.payload.content));
t=send('a cool breeze','core_light_details');ok(t.session.core.sceneDetails.includes('breeze'));ok(!t.session.core.excludedDetails.includes('breeze'),'explicit re-add replaces removal');
eq(parse(message('no breeze just waves','other'),now),null);eq(parse(message('what details do we have','member','elsewhere'),now),null);
send('kitsune change the subject','topic_change');eq(parse(message('not a lighthouse something else'),now),null);
for(const persona of ['owner','mae','ash','member'])chain(['kitsune ash helped me out','with understanding the rules','mae explained them ash just sent the link','who explained the rules','who sent the link'],persona);
const {recognizeHelpActions}=require(path.join(root,'handlers/kitsune/helpActions'));
for(const line of ['mae did not explain the rules','did mae explain the rules','someone said mae explained the rules','ash never sent me the link'])eq(recognizeHelpActions(line,{topic:'help'}),null,'no false action '+line);
const {recoverIntent}=require(path.join(root,'handlers/kitsune/intentRecovery'));const {prepareInput}=require(path.join(root,'handlers/kitsune/language'));
for(const line of ['no breeze just waves','a few people are fine','not a lighthouse something else','what details do we have'])eq(recoverIntent(prepareInput(line),null),null,'no cross-topic scene '+line);
for(const seed of [1,17,81]){const rows=runLab({...input,seed,text:'KITSUNE Ash helped me out! || with understanding the rules || Mae explained them Ash just sent the link || who explained the rules || who sent me the link'}).turns;for(const row of rows)eq(row.status,'matched','seed '+seed);}

state.sessions.clear();send('kitsune ash helped me','core_help_started');send('with the server rules','core_help_detail');send('mae explained the rules','core_help_actions');send('ash sent me the link','core_help_actions');t=send('who explained the rules','core_help_actions');eq(t.req.understanding.target,'mae');eq(t.req.understanding.intent,'recall_action');t=send('who sent the link','core_help_actions');eq(t.req.understanding.target,'ash');
const before=JSON.stringify(t.session.core.actions);const req=parse(message('kitsune who explained the rules'),now);respond(message('kitsune who explained the rules'),req);eq(JSON.stringify(state.getSession(message(''),now).core.actions),before,'rendering does not mutate existing facts');
console.log(`${count} independent action-role, evidence, scene removal/recall, constraint and rejected-suggestion checks passed. No real database or Discord calls.`);
