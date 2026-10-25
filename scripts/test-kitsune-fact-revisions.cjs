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









const start=['kitsune ash helped me','with the server rules','mae explained the rules','ash sent me the link'];
for(const [edit,sender,explainer]of [
 ['actually ash explained them, not mae','Ash','Ash'],
 ['actually ash didnt send the link',null,'Mae'],
 ['she explained them simply','Ash','Mae'],
 ['actually mae sent the link too','Ash and Mae','Mae'],
 ['ash didnt send it, mae did','Mae','Mae'],
 ['mae didnt send the link','Ash','Mae'],
 ['nah mae sent it, not ash','Mae','Mae']]){
 const turns=chain([...start,edit,'who sent the link?','who explained the rules?']);
 if(sender)ok(turns[5].reply.startsWith(sender),edit+': '+turns[5].reply);else ok(/not said/.test(turns[5].reply),edit);
 ok(turns[6].reply.startsWith(explainer),edit);
}
let turns=chain([...start,'mae sent the link too','actually ash didnt send it','who sent the link?','who explained the rules?']);ok(turns[6].reply.startsWith('Mae'));ok(turns[7].reply.startsWith('Mae'));
for(const edit of ['someone said mae sent the link, but im not sure','did mae send the link too?','if mae sends another link, ill read it']){
 turns=chain([...start,edit,'who sent the link?','who explained the rules?']);ok(turns[5].reply.startsWith('Ash'));ok(turns[6].reply.startsWith('Mae'));
}
turns=chain(['kitsune ash helped me','with the server rules','daviti sent me the link','he explained them too','i mean ash','who explained the rules?','who sent the link?']);ok(turns[5].reply.startsWith('Ash'));ok(turns[6].reply.startsWith('Davi'));
const scene=['kitsune ask me smth chill nothing personal','seaside','waves and a cool breeze','actually no breeze just waves'];
turns=chain([...scene,'add the breeze back','what details do we have?']);ok(/waves.*breeze/.test(turns[5].reply));
const offered=['kitsune ask me smth chill nothing personal','seaside','waves','what would u add?'];
turns=chain([...offered,'yes add that','what details do we have?']);ok(/waves.*lighthouse/.test(turns[5].reply));
turns=chain([...offered,'what details do we have?','no dont add the lighthouse','what details do we have?','what would u add?']);ok(!/lighthouse/.test(turns[4].reply));ok(!/lighthouse/.test(turns[6].reply));ok(/boat/.test(turns[7].reply));
// Address variants use the real parser; roles and account identity remain independent.
for(const line of ['lady kitsune, ash didnt send it, mae did','ash didnt send it, mae did, kitsune','hey kitsu, nah mae sent it not ash']){
 turns=chain([...start,line,'who sent the link?']);ok(turns[5].reply.startsWith('Mae'));
}
const {recognizeHelpActions,helpActionsResponse}=require(path.join(root,'handlers/kitsune/helpActions'));
const memory={topic:'help',person:'ash',helperName:'Ash',actions:{sentLink:{person:'ash',name:'Ash'},explainedRules:{person:'mae',name:'Mae'}}};
const snapshot=JSON.stringify(memory);
for(const text of ['mae sent the link too','ash did not send it mae did','she explained them simply','did mae send the link too','someone said mae sent the link but i am not sure']){
 const data=recognizeHelpActions(text,memory);ok(data,text);helpActionsResponse(data,memory);eq(JSON.stringify(memory),snapshot,'no render mutation');
}
for(const text of ['someone denied that ash sent the link','mae did not send the link because ash did','what if mae sent the link','ash might have sent the link','mae sent the link to someone else'])eq(recognizeHelpActions(text,memory),null,'bounded unsupported clause: '+text);

turns=chain([...start,'kitsune change the subject','kitsune a friend helped me','with the server rules','who sent the link?','who explained the rules?']);ok(/not said/.test(turns[7].reply));ok(/not said/.test(turns[8].reply));
turns=chain([...start,'ash sent the link too','ash sent the link too','who sent the link?']);eq(turns[6].reply,'Ash sent you the link.','duplicate addition stays unique');
turns=chain(['kitsune a friend helped me','with the server rules','she explained them too','i mean mae','who explained the rules?']);ok(/Who do you mean/.test(turns[2].reply));ok(turns[4].reply.startsWith('Mae'));
for(const mode of ['member','owner','mae','ash']){
 turns=chain([...start,'nah mae sent it not ash','who sent the link?'],mode);ok(!/Ash sent/.test(turns[5].reply),'persona-independent action correction');
}
turns=chain([...offered,'yes add that','what would u add?']);ok(!/lighthouse/.test(turns[5].reply),'accepted suggestion is not proposed again');
turns=chain(['kitsune ask me smth chill nothing personal','seaside','add that']);ok(/no pending suggestion/.test(turns[2].reply),'do not invent unoffered detail');
for(const line of ['ash explained the link','mae sent the rules','he sent them too'])eq(recognizeHelpActions(line,memory),null,'verb/object guard '+line);
console.log(count+' action correction, addition, denial, pronoun, evidence-scope and scene consent checks passed. No real database or Discord calls.');
