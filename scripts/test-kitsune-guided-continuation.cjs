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









const start=['kitsune ash gave me a hand','with the server rules','mae explained the rules','ash sent me the link'];
let turns=chain([...start,'i mean daviti helped me not ash','who helped me','who sent the link','who explained the rules']);ok(turns[5].reply.startsWith('Davi'));ok(turns[6].reply.startsWith('Ash'));ok(turns[7].reply.startsWith('Mae'));
turns=chain([...start,'i mean daviti sent the link not ash','who helped me','who sent the link','who explained the rules']);ok(turns[5].reply.startsWith('Ash'));ok(turns[6].reply.startsWith('Davi'));ok(turns[7].reply.startsWith('Mae'));
turns=chain([...start,'actually it wasnt ash it was daviti','i mean who helped me','who helped me','who sent the link']);ok(/Do you mean who helped/.test(turns[4].reply));ok(turns[6].reply.startsWith('Davi'));ok(turns[7].reply.startsWith('Ash'));
turns=chain([...start,'actually it wasnt ash it was daviti','who helped me','who sent the link']);ok(turns[5].reply.startsWith('Ash'));ok(turns[6].reply.startsWith('Ash'));
turns=chain([...start,'someone said daviti explained them but im not sure','who explained the rules','i checked it was mae','who explained everything']);ok(/unconfirmed/.test(turns[4].reply));ok(turns[5].reply.startsWith('Mae'));ok(turns[7].reply.startsWith('Mae'));
turns=chain([...start,'someone said daviti explained them but im not sure','i checked it was daviti','who explained everything','who sent the link']);ok(turns[6].reply.startsWith('Davi'));ok(turns[7].reply.startsWith('Ash'));
for(const prefix of ['', 'kitsune ']){
 turns=chain(['kitsune good just gaming','lost again lol','dont need tips just company',prefix+'got any advice',prefix+'something short',prefix+'lets leave games and talk about music',prefix+'mostly calm stuff']);ok(/Try focusing/.test(turns[3].reply));ok(/one mistake/.test(turns[4].reply));ok(/Music/.test(turns[5].reply));ok(!/game|match/.test(turns[6].reply));
}
turns=chain(['kitsune good just gaming','roblox','mostly pvp','lost again lol','he was just better than me','not blaming anyone','just wanna improve','any small tip']);ok(/Roblox/.test(turns[1].reply));ok(/better/.test(turns[4].reply));ok(/not blaming/.test(turns[5].reply));ok(/improve/.test(turns[6].reply));ok(/Try focusing/.test(turns[7].reply));
turns=chain(['kitsune lets talk about games','mostly pvp','lost again lol','any small tip','just one thing','okay thats enough advice','lets just chat','wbu']);ok(/one mistake/.test(turns[4].reply));ok(/Enough advice/.test(turns[5].reply));
turns=chain(['kitsune ask me something easy no options','probably waves','they sound peaceful','what about rain','i like that too','what sound did i choose','ask another question','nothing personal tho']);ok(/waves/.test(turns[1].reply));ok(/peaceful/.test(turns[2].reply));ok(/waves and rain/.test(turns[5].reply));ok(/fictional/.test(turns[7].reply));
turns=chain(['kitsune ask me something easy no options','probably waves','actually rain not waves','what sound did i choose','keep it quiet','ask another question','something different this time']);ok(/rain/.test(turns[3].reply));ok(!/waves/.test(turns[3].reply));ok(/soft and quiet/.test(turns[4].reply));ok(turns[5].reply!==turns[6].reply);
// Successful-send state carries listening limits; explicit permission resets them.
state.sessions.clear();now=1000;send('kitsune good just gaming','core_game_update');let turn=send('dont need tips just company','core_game_update');ok(turn.session.noAdviceRemaining>0);turn=send('got any advice','core_game_continuation');eq(turn.session.noAdviceRemaining,0);eq(turn.session.core.noAdvice,false);turn=send('thats enough advice','core_game_continuation');ok(turn.session.noAdviceRemaining>0);eq(turn.session.core.noAdvice,true);
const {recognizeContinuation,continuationResponse,soundResponse}=require(path.join(root,'handlers/kitsune/conversationContinuations'));
for(const text of ['got any advice','roblox','just one thing','probably waves','i like that too'])eq(recognizeContinuation(text,{}),null,'no borrowed context '+text);
for(const text of ['my friend wants to improve','do not give any small tip','someone said got any advice','he said he was just better than me'])eq(recognizeContinuation(text,{core:{topic:'game'}}),null,'reported/negated clause is not request '+text);
const memory={topic:'game',noAdvice:true};const before=JSON.stringify(memory);continuationResponse({form:'advice',advice:true},memory);eq(JSON.stringify(memory),before,'no mutation before successful delivery');
const sound={nonPersonal:true,soundChoices:['waves'],pendingSound:'rain'};const snapshot=JSON.stringify(sound);soundResponse({form:'add',sound:'rain'},sound);eq(JSON.stringify(sound),snapshot,'sound arrays copied');

for(const [clarification,index]of [['i mean who sent the link',6],['i mean who explained the rules',7]]){
 turns=chain([...start,'it wasnt ash it was daviti',clarification,'who sent the link','who explained the rules']);ok(turns[index].reply.startsWith('Davi'));
}
for(const persona of ['owner','mae','ash']){
 turns=chain([...start,'i mean daviti helped me not ash','who sent the link'],persona);ok(/Ash/i.test(turns[5].reply));
}
let report=runLab({...input,persona:'member',seed:17,text:[...start,'it wasnt ash it was daviti','kitsune change the subject','i mean who helped me'].join(' || ')});eq(report.turns[6].status,'ignored','reset discards correction target');
report=runLab({...input,persona:'member',seed:17,text:'kitsune ask me something easy no options || probably waves || ask another question || i like that too'});eq(report.turns[3].status,'ignored','no stale sound proposal in next question');
console.log(count+' scoped helper correction, verified reports, advice permission and open-question continuation checks passed. No real database or Discord calls.');
