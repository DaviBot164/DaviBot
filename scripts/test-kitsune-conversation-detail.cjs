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









let turns;
for(const addressed of [false,true]){
 const tail=['what do you mean by an exchange','give me an example','simpler please','okay no more tips'];
 turns=chain(['kitsune good just gaming','lost again lol','any small tip',...tail.map(t=>addressed?'kitsune '+t:t)]);
 ok(/back-and-forth/.test(turns[3].reply));ok(/blocks.*counterattack/.test(turns[4].reply));ok(/short back-and-forth/.test(turns[5].reply));ok(/Enough advice/.test(turns[6].reply));
}
turns=chain(['kitsune good just gaming','roblox','project slayers','mostly pvp','i keep attacking too early','thats why i lose','not asking for advice yet','just telling you']);ok(/Project Slayers/.test(turns[2].reply));ok(/attacking too early/.test(turns[4].reply));ok(/your observation/.test(turns[5].reply));ok(/listen without adding tips/.test(turns[7].reply));
const help=['kitsune ash helped me','with the server rules','mae explained them','someone said daviti explained them but im not sure'];
turns=chain([...help,'actually that person was wrong','forget that report','who explained the rules','who helped me']);ok(/withdrawn/.test(turns[4].reply));ok(turns[6].reply.startsWith('Mae'));ok(turns[7].reply.startsWith('Ash'));
turns=chain(['kitsune ask me something easy no options','ask another question','moonlight and silence','maybe a few stars too','no people around','what did i add','remove the stars','whats left']);ok(/No people/.test(turns[5].reply));ok(/stars/.test(turns[5].reply));ok(!/stars/.test(turns[7].reply));ok(/No people/.test(turns[7].reply));
const titleStart=['kitsune ask me something easy no options','ask another question','ask another question'];
for(const title of ['maybe silent moon','my title is silent moon']){
 turns=chain([...titleStart,title,'does that fit','suggest a shorter title','i prefer mine','what title did i choose']);ok(/silent moon/.test(turns[4].reply));ok(/shorter option.*moon/.test(turns[5].reply));ok(/silent moon/.test(turns[7].reply));
}
turns=chain([...titleStart,'my title is silent moon','suggest a shorter title','what title did i choose','yes use that','what title did i choose']);ok(/silent moon/.test(turns[5].reply));ok(/“moon”/.test(turns[7].reply));
turns=chain(['hey lady kitsu daviti helped me today','with the server rules','dont get jealous lol','im just grateful','someone called him stupid i told them to stop','not my words','im defending him not insulting him']);ok(/leave the jealous teasing aside/.test(turns[2].reply));ok(/grateful/.test(turns[3].reply));ok(/aimed at Davi/.test(turns[4].reply));ok(/someone else/.test(turns[5].reply));ok(/defending Davi/.test(turns[6].reply));
state.sessions.clear();now=1000;send('kitsune good just gaming','core_game_update');send('any small tip','core_game_continuation');let t=send('what do you mean by an exchange','core_game_continuation');eq(t.session.core.gameAdvicePhase,'exchange');t=send('no more tips','core_game_continuation');ok(t.session.noAdviceRemaining>0);eq(t.session.core.gameAdvice,null);
const {recognizeContinuation,titleResponse}=require(path.join(root,'handlers/kitsune/conversationContinuations'));
for(const text of ['give me an example','simpler','what do you mean by an exchange'])eq(recognizeContinuation(text,{core:{topic:'game'}}),null,'no invented explanation '+text);
for(const text of ['my title is silent moon','maybe silent moon','what title did i choose'])eq(recognizeContinuation(text,{}),null,'no title outside matching prompt');
const memory={userTitle:'silent moon',selectedTitle:'silent moon'};const before=JSON.stringify(memory);titleResponse({form:'suggest'},memory);eq(JSON.stringify(memory),before,'no render mutation');
let report=runLab({...input,persona:'member',seed:17,text:[...help,'forget that report','kitsune i checked it was daviti','kitsune who explained the rules'].join(' || ')});ok(!/Davi explained/.test(report.turns[5].reply));ok(report.turns[6].reply.startsWith('Mae'),'cancelled report cannot overwrite the confirmed explainer');
for(const persona of ['owner','mae','ash']){turns=chain([...titleStart,'my title is silver sky','suggest a shorter title','i prefer mine','what title did i choose'],persona);ok(/silver sky/.test(turns[6].reply));}

turns=chain(['kitsune daviti helped me','with the server rules','dont get jealous','kitsune i like daviti']);ok(!/little jealous|jealous eyebrow/.test(turns[3].reply),'respect explicit no-jealous-teasing request');
report=runLab({...input,persona:'member',seed:17,text:[...titleStart,'my title is quiet forest','suggest a shorter title','ask another question','kitsune what title did i choose'].join(' || ')});ok(!/quiet forest/.test(report.turns[6].reply),'new question drops prior title');
console.log(count+' advice explanation, match narration, title ownership, report withdrawal and social-scope checks passed. No real database or Discord calls.');
