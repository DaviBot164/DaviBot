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









let turns=chain(['hey kitsu ash gave me a hand','he helped me understand the rules','mae was the one who explained them','the link came from ash','who explained everything','and who shared the link']);ok(turns[4].reply.startsWith('Mae'));ok(turns[5].reply.startsWith('Ash'));ok(!/He explained/.test(turns[1].reply),'understanding assistance alone does not identify explainer');
turns=chain(['kitsune ash helped me','with the server rules','mae was the one who explained them','the link came from ash','who explained everything','who shared the link']);ok(turns[4].reply.startsWith('Mae'));ok(turns[5].reply.startsWith('Ash'));
for(const addressed of [false,true]){
 const lines=['yo kits hru','good just gaming','lost again lol','not angry tho','just a bit disappointed','dont need tips just company','wbu?'];
 turns=chain(lines.map((line,i)=>addressed&&i?'kitsune '+line:line));
 ok(/playing/.test(turns[1].reply));ok(/loss/.test(turns[2].reply));ok(/Not angry/.test(turns[3].reply));ok(/disappointed/.test(turns[4].reply));ok(/No tips/.test(turns[5].reply));ok(/cannot play/.test(turns[6].reply));ok(!/How are you doing/.test(turns[6].reply));
}
turns=chain(['kitsune lets talk about games','mostly pvp','lost again lol','not angry tho','just a bit disappointed','dont need tips just company','wbu?']);ok(/No tips/.test(turns[5].reply));ok(/cannot play/.test(turns[6].reply));
for(const start of ['lady kitsune that reply wasnt what i asked for','kitsune your answer was confusing']){
 turns=chain([start,'not insulting u btw','just answer more directly','nvm lets reset','ask me something easy no options','nothing about work or school']);ok(/not mean it as an insult/.test(turns[1].reply));ok(!/ or /.test(turns[4].reply));ok(/away from work and school/.test(turns[5].reply));
}
turns=chain(['kitsune ask me smth chill nothing personal','seaside','waves and a cool breeze','lets switch to the forest','keep only the breeze','add some moonlight','what have we got so far','take out the moonlight','whats left']);ok(/forest/.test(turns[3].reply));ok(!/waves/.test(turns[6].reply));ok(/moonlight/.test(turns[6].reply));ok(!/moonlight/.test(turns[8].reply));
// A fresh scene starts empty; an explicit follow-up may request a known prior detail.
ok(/breeze/.test(turns[8].reply),'explicit keep request carries the prior breeze');
turns=chain(['kitsune ask me smth chill nothing personal','seaside','waves and a cool breeze','keep only the breeze','add some moonlight','what have we got so far','take out the moonlight','whats left']);ok(/breeze.*moonlight/.test(turns[5].reply));ok(/breeze/.test(turns[7].reply));ok(!/waves|moonlight/.test(turns[7].reply));
for(const name of ['ash','mae','daviti']){
 turns=chain(['kitsune '+name+' gave me a hand','with the server rules',name+' was the one who explained them','the link came from '+name,'who shared the link']);ok(/sent you the link/.test(turns[4].reply));
}
state.sessions.clear();now=1000;
let t=send('kitsune good just gaming','core_game_update');t=send('dont need tips just company','core_game_update');ok(t.req.declineAdvice);ok(t.session.noAdviceRemaining>0);t=send('wbu','core_game_update');eq(t.session.core.noAdvice,true);
const {casualPhrasing}=require(path.join(root,'handlers/kitsune/casualPhrasing'));
for(const text of ['ash did not give me a hand','someone said ash gave me a hand','my friend said that reply was not what i asked for','do not switch to the forest','add some moonlight if you want'])eq(casualPhrasing(text,{topic:'help',nonPersonal:true}),text,'whole clause guard');
for(const text of ['the link came from ash','who explained everything','lets switch to the forest','what is left'])eq(casualPhrasing(text,{}),text,'no borrowed context');

for(const persona of ['owner','mae','ash']){
 turns=chain(['hey kitsu ash gave me a hand','with the server rules','mae was the one who explained them','the link came from ash','who shared the link'],persona);ok(/Ash/i.test(turns[4].reply),persona+': '+turns[4].reply);
}
turns=chain(['kitsune ask me smth chill nothing personal','seaside','waves and a cool breeze','lets switch to the forest','what have we got so far']);ok(!/waves|breeze/.test(turns[4].reply),'switch alone carries no old details');
let result=runLab({...input,persona:'member',seed:17,text:'kitsune ash gave me a hand || with the server rules || kitsune change the subject || who shared the link?'});eq(result.turns[3].status,'ignored','no implicit use of cleared help roles');
result=runLab({...input,persona:'member',seed:17,text:'kitsune ash helped me || kitsune she helped me understand the rules'});ok(!/helped you understand/.test(result.turns[1].reply),'incompatible pronoun does not assert understanding');
console.log(count+' casual paraphrase, game companionship, reply correction and scene-variant checks passed. No real database or Discord calls.');
