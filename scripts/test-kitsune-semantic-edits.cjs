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


let turns=chain(['kitsune my friend hasnt replied yet','maybe they need some space','i dont want to pressure them','help me write a gentle follow-up','make it shorter but keep the meaning']);
ok(/possibility/.test(turns[1].reply));ok(/message/i.test(turns[3].reply));ok(/message/.test(turns[4].reply));ok(/No rush/.test(turns[4].reply));ok(turns[4].reply.length<turns[3].reply.length);
turns=chain(['kitsune my friend ignored me','what should i say to him?','make it shorter but keep the meaning','mention my earlier message','dont ask them to reply immediately']);
for(const i of [2,3,4]){ok(/message/.test(turns[i].reply));ok(/No rush/.test(turns[i].reply));ok(!/immediately|right now/.test(turns[i].reply));}
turns=chain(['kitsune lets talk about music','mostly jazz','sometimes piano too','actually not jazz anymore','what did i say i listen to?']);ok(/piano/.test(turns[4].reply));ok(!/jazz/.test(turns[4].reply));
turns=chain(['kitsune pick tea / coffee','okay lets go with coffee','actually ive changed my mind','neither, lets leave it','what did we decide?']);ok(/cancelled/.test(turns[2].reply));ok(/no active final choice/.test(turns[4].reply));ok(!/settled on|\*\*coffee\*\*/.test(turns[4].reply));
turns=chain(['kitsune my friend ignored me','what should i say to him?','lets leave that and talk about games','mostly pve','make it shorter']);eq(turns[2].after,'game_chat');ok(/PvE/.test(turns[4].reply));ok(!/Which sentence|message/.test(turns[4].reply));ok(turns[4].reply.length<turns[3].reply.length);
turns=chain(['kitsune a friend left me on read','help me write a gentle follow-up','keep it casual and short']);ok(/saw your message/.test(turns[0].reply));ok(!/Was there no reply/.test(turns[0].reply));ok(/message/.test(turns[2].reply));
state.sessions.clear();now=1000;
send('kitsune pick tea / coffee','pick');send('lets go with coffee','flow_choice_decide');let t=send('i have changed my mind','flow_choice_cancel');eq(t.session.pickSelected,null);eq(t.session.thread.cancelled,true);t=send('neither lets leave it','flow_choice_cancel');eq(t.session.pickOptions,null);eq(t.session.pickSelected,null);
t=send('what did we decide','flow_choice_recall');ok(/no active final choice/.test(t.out.payload.content));t=send('was that random or my choice','flow_choice_source');ok(/cancelled/.test(t.out.payload.content));
send('kitsune pick water / juice','pick');t=send('what did we decide','flow_choice_recall');ok(/water|juice/.test(t.out.payload.content));ok(!/cancelled/.test(t.out.payload.content));
send('kitsune change the subject','topic_change');eq(parse(message('what did we decide'),now),null);
send('kitsune lets talk about music','music_chat');send('mostly jazz','flow_music_genre');send('sometimes piano too','flow_music_genre');t=send('not jazz anymore','flow_music_remove');eq(t.session.thread.genre,undefined);eq(t.session.thread.alternate,'piano');t=send('what did i say i listen to','flow_music_recall');ok(!/jazz/.test(t.out.payload.content));t=send('not piano anymore','flow_music_remove');eq(t.session.thread.alternate,undefined);t=send('what did i say i listen to','flow_music_recall');ok(/no current genre preference/.test(t.out.payload.content));
send('kitsune my friend ignored me','flow_friend_event');send('help me write a gentle follow-up','flow_draft');send('keep it casual and short','flow_draft_edit');t=send('dont ask them to reply immediately','flow_draft_edit');eq(t.session.thread.style.short,true);eq(t.session.thread.style.casual,true);eq(t.session.thread.style.noRush,true);ok(/message/.test(t.out.payload.content));
send('lets leave that and talk about games','flow_game_start');eq(state.getSession(message(''),now).thread,null);eq(parse(message('mention my earlier message'),now),null);
const {analyzeFollowThrough}=require(path.join(root,'handlers/kitsune/followThrough'));const {prepareInput}=require(path.join(root,'handlers/kitsune/language'));
for(const line of ['maybe they need some space','mention my earlier message','not jazz anymore','neither lets leave it','i do not want to pressure them'])eq(analyzeFollowThrough(prepareInput(line),null),null,'scope '+line);
for(const line of ['my friend likes piano too','someone said not jazz anymore','i am not saying i changed my mind'])eq(analyzeFollowThrough(prepareInput(line),{thread:{kind:'music',genre:'jazz'}}),null,'negative '+line);
for(const persona of ['owner','mae','ash'])chain(['kitsune my friend has not replied yet','maybe they need some space','help me write a gentle follow up','make it shorter but keep the meaning'],persona);
for(const seed of [1,17,81]){
 let result=runLab({...input,seed,text:'KITSUNE my friend hasnt replied yet! || maybe they need some space || help me write a gentle follow-up || make it shorter but keep the meaning'});for(const row of result.turns)eq(row.status,'matched','seed '+seed);
}
chain(['kitsune my friend hasnt replied','help me write a gentle follow-up','mention my earlier message']);
turns=chain(['kitsune pick tea / coffee','i have changed my mind','wait a second','continue','what did we decide?']);ok(!/null|undefined|settled on/.test(turns[3].reply));ok(/cancelled/.test(turns[4].reply));
turns=chain(['kitsune lets talk about games','mostly pvp','make it shorter']);ok(/other players/.test(turns[2].reply));
console.log(`${count} unanswered-message, meaning-preserving draft, preference removal, decision cancellation and game-switch checks passed. No real database or Discord calls.`);
