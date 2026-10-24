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

let turns=chain(['kitsune a friend left me on read','maybe they had a busy day','i dont wanna jump to conclusions','how can i check in politely?','keep it casual and short']);
ok(/possibility/.test(turns[1].reply));ok(/You could say/.test(turns[3].reply));ok(/No rush/.test(turns[4].reply));
turns=chain(['kitsune my friend ignored me','what should i say to him?','keep it casual and short','less formal please','dont make it sound like im blaming him']);
ok(turns[2].reply.length<turns[1].reply.length);ok(!/Which sentence/.test(turns[4].reply));
turns=chain(['kitsune lets talk about music','mostly rock','actually jazz, not rock','only when im working','what did i say i listen to?']);
ok(/jazz/i.test(turns[4].reply));ok(!/rock/.test(turns[4].reply));ok(/only while working/.test(turns[4].reply));
turns=chain(['kitsune pick tea / coffee','i prefer coffee','okay lets go with coffee','what did we decide?','was that random or my choice?']);
ok(/coffee/.test(turns[3].reply));ok(/was yours/.test(turns[4].reply));ok(/original random draw was \*\*tea/.test(turns[4].reply));
turns=chain(['kitsune can you help me study?','sure','wait a second','actually lets talk about music instead','mostly jazz','okay continue']);
eq(turns[5].after,'music_chat');ok(!/exercise|paragraph/.test(turns[5].reply));
turns=chain(['kitsune tell me a short joke','another one about games','actually not games, something about animals','keep it wholesome','shorter please']);
ok(/fox|cat|rabbit/.test(turns[2].reply));ok(/fox|cat|rabbit/.test(turns[3].reply));ok(turns[4].reply.length<turns[3].reply.length);ok(!/Which sentence/.test(turns[4].reply));ok(/purr|hare|con-clusions/.test(turns[4].reply),'shortens the same animal joke');
turns=chain(['kitsune my friend ignored me','what should i say to him?','actually forget that, lets talk about music','mostly jazz','make it shorter']);
ok(/jazz/i.test(turns[4].reply));ok(!/message|friend|You could say/.test(turns[4].reply));
const {analyzeFollowThrough}=require(path.join(root,'handlers/kitsune/followThrough'));
const {prepareInput}=require(path.join(root,'handlers/kitsune/language'));
for(const line of ['my friend likes jazz not rock','someone said keep it casual and short','what did we decide','less formal please','only when i am working'])eq(analyzeFollowThrough(prepareInput(line),null),null,'no context '+line);
for(const text of ['mostly jazz','what did i say i listen to?','keep it casual and short']){resetLab(input);const result=runLab({...input,seed:17,text});eq(result.turns[0].status,'ignored',text);}
for(const persona of ['owner','mae','ash'])chain(['kitsune a friend left me on read','how can i check in politely?','less formal please'],persona);
state.sessions.clear();now=1000;
send('kitsune lets talk about music','music_chat');send('mostly rock','flow_music_genre');let t=send('actually jazz not rock','flow_music_correct');eq(t.session.thread.genre,'jazz');
t=send('only when im working','flow_music_place');eq(t.session.thread.only,true);
send('kitsune change the subject','topic_change');eq(state.getSession(message(''),now).thread,null);eq(parse(message('what did i say i listen to'),now),null);
send('kitsune my friend ignored me','flow_friend_event');send('what should i say to him','flow_draft');send('keep it casual and short','flow_draft_edit');t=send('less formal please','flow_draft_edit');eq(t.session.thread.style.short,true);eq(t.session.thread.style.casual,true);
send('kitsune lets talk about music','music_chat');eq(state.getSession(message(''),now).thread?.draft,undefined);
eq(parse(message('keep it casual and short'),now),null);eq(parse(message('mostly jazz','other'),now),null);
now+=120001;eq(parse(message('mostly jazz'),now),null,'expiry');
for(const seed of [1,2,17,91]){
 const result=runLab({...input,seed,text:'KITSUNE a friend left me on read! || maybe they had a busy day || how can i check in politely? || keep it casual and short'});
 for(const turn of result.turns)eq(turn.status,'matched','variant seed '+seed);
}
let memory=chain(['kitsune pick tea / coffee','what did we decide?','was that random or my choice?']);ok(/random draw/.test(memory[2].reply));ok(/not made a final choice/.test(memory[2].reply));
chain(['kitsune my friend ignored me','what should i say to him?','make it shorter','less formal please','dont make it sound like im blaming him']);
chain(['kitsune my friend ignored me','what should i say to him?','actually never mind lets talk about music','mostly jazz','make it shorter']);
for(const text of ['make it shorter','what did we decide?','how can i check in politely?']){
 resetLab(input);const result=runLab({...input,seed:17,text});ok(!String(result.turns[0].reply).includes('Hey, got'),'no invented prior draft');
}
console.log(`${count} collected paraphrase, draft editing, corrected recall, topic replacement and joke-shortening checks passed. No real database or Discord calls.`);
