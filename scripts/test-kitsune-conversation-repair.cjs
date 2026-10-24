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





let turns=chain(['hey kits, ur answer kinda missed the point','didnt mean that as an insult btw','could u try again without the attitude?','nvm, lets start over','ask me smth chill, nothing personal']);
ok(/missed your point/.test(turns[0].reply));ok(/not mean it as an insult/.test(turns[1].reply));ok(/straightforward/.test(turns[2].reply));eq(turns[3].category,'restart_chat');ok(/fictional scene/.test(turns[4].reply));
chain(['kitsune your answer was confusing','didnt mean that as an insult btw','could u try again without the attitude?','nvm, lets start over','ask me smth chill, nothing personal']);
turns=chain(['kitsune daviti helped me, why u acting jealous?','im not hitting on him','someone called him dumb, i told them to stop','dont confuse me with the person who said it','anyway, can we talk about music?']);
ok(/helped/.test(turns[0].reply));ok(/not.*flirting/.test(turns[1].reply));ok(/not blame you/.test(turns[2].reply));ok(/not you/.test(turns[3].reply));eq(turns[4].after,'music_chat');
chain(['kitsune daviti helped me','im not hitting on him','someone called him dumb, i told them to stop','dont confuse me with the person who said it','anyway, can we talk about music?']);
for(const persona of ['owner','member','mae','ash']){
 const rows=chain(Array(8).fill('kitsune mommy'),persona);
 eq(rows.every(row=>/daddy/i.test(row.reply)),persona==='owner','owner-only response '+persona);
 for(let i=1;i<rows.length;i++)ok(rows[i].reply!==rows[i-1].reply,'no immediate nickname repeat '+persona);
 ok(new Set(rows.map(row=>row.reply)).size>=3,'nickname variety '+persona);
 if(persona!=='owner')for(const row of rows)ok(/nickname|normally|Kitsune/.test(row.reply),'member boundary');
}
state.sessions.clear();now=1000;
send('kitsune mommy','core_mommy');let oldIndex=state.getSession(message(''),now).core.socialIndex;let t=send('kitsune mommy','core_mommy');ok(t.session.core.socialIndex!==oldIndex,'semantic nonrepeat selection');
send('kitsune just call me Davi','core_name');t=send('kitsune mommy','core_mommy');ok(!/daddy/i.test(t.out.payload.content),'display name cannot unlock owner nickname');
send('kitsune be gentle','tone_gentle');t=send('kitsune mommy','core_mommy');ok(/Please do not/.test(t.out.payload.content),'gentle member boundary');
send('kitsune normal mode','tone_reset');t=send('kitsune thanks','thanks');ok(!/daddy/i.test(t.out.payload.content),'no nickname spillover');
send('kitsune i like daviti','core_jealous');send('nvm lets start over','restart_chat');eq(state.getSession(message(''),now).core,null);eq(state.getSession(message(''),now).thread,null);
t=send('someone called him dumb i told them to stop','core_report_person');ok(!/davi|aimed at you/i.test(t.out.payload.content),'unknown pronoun not assigned Davi');eq(t.req.understanding.reported,true);eq(t.req.understanding.target,null);
send('kitsune daviti helped me','core_davi_helped');send('im not hitting on him','core_social_grateful');t=send('someone called him dumb i told them to stop','core_report_davi');eq(t.req.understanding.target,'davi');eq(t.req.understanding.reported,true);
t=send('dont confuse me with the person who said it','core_quote_correction');ok(/not you/.test(t.out.payload.content));
send('kitsune change the subject','topic_change');t=send('dont confuse me with the person who said it','core_quote_correction');ok(/Which statement/.test(t.out.payload.content),'no invented prior report');
const light=chain(['kitsune ask me something chill nothing personal','another one','another question']);
for(const row of light)ok(!/your name|where do you live|family|age|secret|work|school/i.test(row.reply),'nonpersonal prompt');
const {recoverIntent}=require(path.join(root,'handlers/kitsune/intentRecovery'));const {prepareInput}=require(path.join(root,'handlers/kitsune/language'));
for(const text of ['i am hitting on him','i meant it as an insult','someone called him smart i told them to stop','my friend calls you mommy','do not ask me something chill nothing personal']){
 const req=recoverIntent(prepareInput(text),null);ok(!['social_grateful','intent_clarify','report_person','mommy','nonpersonal_question'].includes(req?.kind),'negative control '+text);
}
for(const seed of [1,17,81]){
 const rows=runLab({...input,seed,text:'KITSUNE your reply missed the point! || did not mean that as an insult || can you try again without your attitude || never mind lets start fresh || could you ask me a light question nothing personal'}).turns;
 for(const row of rows)eq(row.status,'matched','held-out polite seed '+seed);
}
console.log(`${count} answer repair, pronoun/report scope, nonpersonal question and owner-only nickname variety checks passed. No real database or Discord calls.`);
