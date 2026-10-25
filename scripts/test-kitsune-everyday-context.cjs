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







let turns=chain(['hi kit','kit how u been?','kit I’m well','kit no I’m just tired','kit u have progress','nice mommy, kit','kit goodnigh','kit byee'],'owner');eq(turns[1].category,'mood');eq(turns[2].category,'feeling_good');eq(turns[3].category,'tired');ok(/daddy/i.test(turns[5].reply));eq(turns[6].category,'goodnight');eq(turns[7].category,'stop');
turns=chain(['kitsune ask me smth chill nothing personal','ask something without giving me options','moonlight and silence','maybe a few stars too','what would u add?','keep it simple']);ok(/moonlight.*silence/i.test(turns[2].reply));ok(/stars/i.test(turns[3].reply));ok(/window/.test(turns[4].reply));ok(turns[5].reply.length<turns[4].reply.length);
turns=chain(['kitsune ask me smth chill nothing personal','seaside','waves and a cool breeze','not too crowded tho','what would u add?','just one detail']);ok(/waves.*breeze/i.test(turns[2].reply));ok(/few people/.test(turns[3].reply));ok(/uncrowded/.test(turns[4].reply));ok(/lighthouse/.test(turns[5].reply));
turns=chain(['kitsune daviti helped me','with the server rules','actually it was ash, not daviti','he explained them simply','i get them now','who helped me?']);ok(/Ash/.test(turns[2].reply));ok(/Ash/.test(turns[5].reply));ok(!/Davi/.test(turns[5].reply));ok(/server rules/.test(turns[5].reply));
for(const subject of ['ash','a friend','my friend','John']){
 turns=chain(['kitsune '+subject+' helped me','with the server rules','they explained them simply','i understand them now','thats why im grateful','who helped me?']);ok(!/Davi|jealous|flirt/.test(turns[5].reply),'helper not forced to Davi');ok(/server rules/.test(turns[5].reply));
}
for(const persona of ['owner','mae','ash','member']){
 chain(['kitsune ask me something chill nothing personal','seaside','waves and a cool breeze','not too crowded','what would you add','just one detail'],persona);
 const rows=chain(['kitsune nice mommy'],persona);eq(/daddy/i.test(rows[0].reply),persona==='owner','recipient ID controls nickname');
}
const mae=chain(['kitsune hi','kitsune pick tea / coffee','kitsune mommy','kitsune give me advice'],'mae');ok(mae.some(row=>/Davi/.test(row.reply)),'Mae addressed as Davi');for(const row of mae){ok(!/\bMae\b/.test(row.reply),'no old directed Mae address');ok(!/daddy|handsome|sweetheart/i.test(row.reply),'no owner tone for Mae');}
const ash=chain(['kitsune hi','kitsune pick tea / coffee'],'ash');ok(ash.every(row=>!/\bDavi\b|\bMae\b/.test(row.reply)),'Ash address isolation');
state.sessions.clear();now=1000;
send('kitsune daviti helped me','core_davi_helped');send('with the server rules','core_help_detail');let t=send('it was ash not daviti','core_help_corrected');eq(t.session.core.person,'ash');eq(t.session.core.helpTopic,'server_rules');eq(t.req.understanding.target,'ash');
t=send('they explained them simply','core_help_explained');eq(t.req.understanding.target,'ash');send('thats why im grateful','core_help_grateful');t=send('who helped me','core_help_recall');ok(/Ash/.test(t.out.payload.content));
send('nvm lets start over','restart_chat');eq(parse(message('who helped me'),now),null);eq(parse(message('with the server rules'),now),null);
send('kitsune ask me something chill nothing personal','core_nonpersonal_question');send('seaside','core_light_answer');send('waves and a cool breeze','core_light_details');t=send('not too crowded','core_light_limit');eq(t.session.core.noCrowds,true);eq(t.session.core.sceneDetails,['waves','breeze']);t=send('what would you add','core_light_suggest');eq(t.session.core.suggestion,'lighthouse');
eq(parse(message('just one detail','other'),now),null);eq(parse(message('moonlight and silence','member','other-channel'),now),null);
send('kitsune change the subject','topic_change');eq(parse(message('moonlight and silence'),now),null);
const {namedAddress}=require(path.join(root,'handlers/kitsune/addressing'));ok(namedAddress('nice mommy, kit'));for(const text of ['a first aid kit','a nice kit','someone said nice mommy, kit','"nice mommy, kit"'])eq(namedAddress(text),null,'keep noun/report protected '+text);
const {recoverIntent}=require(path.join(root,'handlers/kitsune/intentRecovery'));const {prepareInput}=require(path.join(root,'handlers/kitsune/language'));
for(const text of ['ash did not help me','nobody helped me','my friend never helped me','i am not well','no i am not tired']){
 const req=recoverIntent(prepareInput(text),null);ok(!['help_started','tired_correction'].includes(req?.kind),'negation '+text);
}

eq(toneFor(settings.OWNER_ID),'owner');eq(toneFor(settings.dialogue.maeId),'mae');
const correction=chain(['kitsune a friend helped me','with the server rules','it was ash not my friend','they explained them simply','who helped me']);ok(/Ash/.test(correction[4].reply));
for(const seed of [1,17,81]){
 const rows=runLab({...input,seed,persona:'owner',text:'HI KIT || kit how have you been? || kit I’m well || nice mommy, kit || kit goodnigh || kit byee'}).turns;for(const row of rows)eq(row.status,'matched','short English variant '+seed);
}
chain(['kitsune mae helped me','with the server rules','she explained them simply','i get them now','who helped me']);
console.log(`${count} everyday short forms, scene composition, independent helpers and recipient-name isolation checks passed. No real database or Discord calls.`);
