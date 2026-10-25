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
const query='did mae send the link too?';
let turns;
for(const answer of ['yes','yes she did','actually yes she did']){
 turns=chain([...start,query,answer,'who sent the link?','who explained the rules?']);ok(/Ash and Mae/.test(turns[6].reply),answer);ok(turns[7].reply.startsWith('Mae'));
}
for(const answer of ['no','no she didnt','not sure','i dont know yet','not yet she will later']){
 turns=chain([...start,query,answer,'who sent the link?','who explained the rules?']);ok(turns[6].reply.startsWith('Ash'),answer);ok(!/Mae/.test(turns[6].reply));ok(turns[7].reply.startsWith('Mae'));
}
turns=chain([...start,query,'i dont know yet','actually yes she did','who sent the link?']);ok(/Ash and Mae/.test(turns[7].reply));
turns=chain([...start,'did ash explain the rules too?','yes he did','who explained the rules?','who sent the link?']);ok(/Mae and Ash/.test(turns[6].reply));ok(turns[7].reply.startsWith('Ash'));
turns=chain([...start,query,'did ash explain the rules too?','yes he did','who explained the rules?','who sent the link?']);ok(/Mae and Ash/.test(turns[7].reply));ok(!/Mae/.test(turns[8].reply));
turns=chain([...start,query,'yes she did','actually no i was mistaken','who sent the link?','who explained the rules?']);ok(!/Mae/.test(turns[7].reply));ok(turns[8].reply.startsWith('Mae'));
turns=chain([...start,query,'yes she did','who sent the link?','no only ash','who sent the link?']);ok(/Ash and Mae/.test(turns[6].reply));ok(!/Mae/.test(turns[8].reply));
turns=chain([...start,query,'yes he did','i mean mae','who sent the link?']);ok(/Do you mean Mae/.test(turns[5].reply));ok(/Ash and Mae/.test(turns[7].reply));
turns=chain([...start,query,'i mean mae','who sent the link?','who explained the rules?']);ok(/confirming/.test(turns[5].reply));ok(!/Mae/.test(turns[6].reply));ok(turns[7].reply.startsWith('Mae'));
turns=chain([...start,query,'yes but i mean the rules not the link','who sent the link?','who explained the rules?']);ok(/Do you mean/.test(turns[5].reply));ok(!/Mae/.test(turns[6].reply));
const offered=['kitsune ask me smth chill nothing personal','seaside','waves','what would u add?','yes add that'];
for(const edit of ['remove the lighthouse','actually remove it','remove everything except the waves']){
 turns=chain([...offered,edit,'what details do we have?','what would u add?']);ok(/waves/.test(turns[6].reply));ok(!/lighthouse/.test(turns[6].reply));ok(/boat/.test(turns[7].reply));
}
turns=chain([...offered,'remove the waves keep the lighthouse','what details do we have?']);ok(!/waves/.test(turns[6].reply));ok(/lighthouse/.test(turns[6].reply));
turns=chain([...offered,'replace the lighthouse with a small boat','what details do we have?']);ok(/waves.*boat/.test(turns[6].reply));ok(!/lighthouse/.test(turns[6].reply));
turns=chain([...offered,'replace the lighthouse with a small boat','remove it','what details do we have?']);ok(!/boat|lighthouse/.test(turns[7].reply));ok(/waves/.test(turns[7].reply));
turns=chain([...offered,'remove the lighthouse','add it back','what details do we have?']);ok(/waves.*lighthouse/.test(turns[7].reply));
turns=chain([...offered,'replace the lighthouse with a small boat','actually keep both','what details do we have?']);ok(/waves/.test(turns[7].reply));ok(/boat/.test(turns[7].reply));ok(/lighthouse/.test(turns[7].reply));
turns=chain([...offered,'actually a forest instead','what details do we have?','what would u add?']);ok(/forest/.test(turns[6].reply));ok(!/waves|lighthouse/.test(turns[6].reply));ok(/path/.test(turns[7].reply));
turns=chain(['kitsune ask me smth chill nothing personal','seaside','waves and a cool breeze','what would u add?','yes add that','actually a forest instead keep the breeze','what details do we have?','what would u add?']);ok(/forest.*breeze/.test(turns[6].reply));ok(!/waves|lighthouse/.test(turns[6].reply));ok(/path/.test(turns[7].reply));
turns=chain([...offered,'actually a forest instead','what details do we have?','yes add that']);ok(/no pending suggestion/.test(turns[7].reply));
for(const persona of ['owner','mae','ash']){
 turns=chain([...start,query,'yes she did','who sent the link?'],persona);ok(/Ash and (?:Mae|Davi)/.test(turns[6].reply));
}
// Reset drops pending answers and scene references, including explicitly addressed follow-ups.
let report=runLab({...input,persona:'member',seed:17,text:[...start,query,'kitsune change the subject','kitsune yes she did','kitsune who sent the link?'].join(' || ')});
ok(!/Mae sent|Ash and Mae/.test(report.turns[6].reply));ok(!/Ash sent|Mae sent/.test(report.turns[7].reply));
const {recognizeHelpActions,helpActionsResponse}=require(path.join(root,'handlers/kitsune/helpActions'));
const memory={topic:'help',person:'ash',actions:{sentLink:{person:'ash',name:'Ash'}},pendingQuestion:{role:'sentLink',actor:{person:'mae',name:'Mae'}}};
for(const text of ['yes','no','not sure','yes he did']){const before=JSON.stringify(memory);const data=recognizeHelpActions(text,memory);ok(data);helpActionsResponse(data,memory);eq(JSON.stringify(memory),before,'no mutation before delivery');}
for(const text of ['yes she might have','no he was talking about a game','yes but not sure','someone said yes she did'])eq(recognizeHelpActions(text,memory),null,'unsupported answer must not assert facts');
const {recognizeSceneEdit,sceneEditResponse}=require(path.join(root,'handlers/kitsune/sceneEditing'));
const scene={nonPersonal:true,selected:'seaside',sceneDetails:['waves'],acceptedSuggestions:['lighthouse'],lastSceneDetail:'lighthouse'};
for(const text of ['remove it','replace the lighthouse with a small boat','a forest instead']){const before=JSON.stringify(scene);sceneEditResponse(recognizeSceneEdit(text,scene),scene);eq(JSON.stringify(scene),before,'scene render copies memory');}
console.log(count+' pending-question answer, role correction, scene editing, restoration and context-reset checks passed. No real database or Discord calls.');
