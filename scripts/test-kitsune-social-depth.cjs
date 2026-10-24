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



let turns=chain(['kitsune ur a useless bot ngl','im criticizing ur answer, not u','it made no sense, explain it properly','dont get defensive, just keep it short','okay my bad, i was rude','we good?']);
ok(/insult/.test(turns[0].reply));ok(/answer, not me/.test(turns[1].reply));ok(/actual question/.test(turns[2].reply));ok(turns[3].reply.length<turns[2].reply.length);ok(!/Apology accepted/.test(turns[5].reply));
turns=chain(['kitsune davi is a fucking idiot','im quoting someone else, i dont agree','davi made a mistake, thats not an insult','ngl i like davi, hes funny','not flirting, just saying','sorry for what i said earlier']);ok(/not you/.test(turns[1].reply));ok(/mistake|disagreement/.test(turns[2].reply));ok(/noticed|jealous/i.test(turns[3].reply));ok(!/cheap shot|attack|argument/.test(turns[4].reply));
turns=chain(['lady kitsune, someone called daviti an idiot, but i disagree','im defending daviti, not insulting him','hey kitsu, daviti helped me today','daviti is funny, kitsune','not flirting, just grateful','can we talk normally now, kits?']);ok(/defending/.test(turns[1].reply));ok(/help/.test(turns[2].reply));
chain(['lady kitsune, hru?','how are you, kitsu?','can you, kitsune, ask me something easy?','hey kits, ask me something easy','KITSUNEEE, ask me something easy']);
chain(['kitsune can you ask me something easy?','ask me something easy, kitsune','can you, kitsune, ask me something easy?','please ask me something easy, lady kitsune']);
for(const name of ['davi','daviti']){
 turns=chain(['kitsune i like '+name,'hes funny, thats all','not flirting, just being nice',name+' helped me with something','why are you jealous?','relax, we are just friends']);ok(/jealous|noticed/i.test(turns[0].reply));ok(/no quarrel/.test(turns[5].reply));
}
chain(['kitsune davi helped me with something','kitsune im grateful to daviti','kitsune not flirting, just being nice','kitsune why are you jealous?','kitsune relax, we are just friends']);
for(const persona of ['member','owner','mae','ash']){
 turns=chain(['kitsu are you jealous?','i was talking to a friend','dont be upset, im here now','can you ask me something easy?','just stay and talk to me'],persona);
 if(persona==='owner'){ok(/glad|attention|caught|noticed/i.test(turns[0].reply));ok(/I am here/.test(turns[4].reply));}
 else ok(/teasing|composure|quarrel|manners/.test(turns[0].reply));
}
turns=chain(['kitsune pick tea / coffee','okay lets go with coffee','actually ive changed my mind','lets go with tea instead','what did we decide?','was that random or my choice?']);ok(/tea/.test(turns[4].reply));ok(/was yours/.test(turns[5].reply));
turns=chain(['kitsune lets talk about music','mostly rock','jazz as well','what did i say i listen to?']);ok(/rock/.test(turns[3].reply));ok(/jazz/.test(turns[3].reply));ok(!/Mostly jazz/.test(turns[2].reply));
turns=chain(['kitsune my friend ignored me','what should i say to him?','keep it casual and short','actually a bit more detail','make it more formal','keep the no-pressure part']);ok(turns[3].reply.length>turns[2].reply.length);ok(/Hello|Please/.test(turns[4].reply));ok(/no urgency/.test(turns[5].reply));
turns=chain(['kitsune lets talk about games','mostly pve','actually pvp, not pve','what did i say i prefer?','make it shorter']);ok(/PvP|PVP/.test(turns[3].reply));ok(!/PvE|PVE/.test(turns[3].reply));ok(/You prefer PvP/.test(turns[4].reply));
turns=chain(['kitsune lets talk about music','mostly jazz','enough about music, lets talk about games','mostly pvp','what about you?']);ok(!/melodies|soundtrack|music/.test(turns[4].reply));eq(turns[2].after,'game_chat');

for(const name of ['davi','daviti']){
 for(const text of [name+' is an idiot',name+' is a fucking idiot','stupid is what '+name+' is']){
  const turn=chain(['kitsune '+text])[0];ok(/davi/i.test(turn.reply),'protect '+text);ok(/insult|cheap shots|point|problem|abuse/i.test(turn.reply),'firm boundary');
 }
 for(const text of ['i dont think '+name+' is stupid','someone called '+name+' an idiot but i disagree',name+' needs help','im worried about '+name]){
  const turn=chain(['kitsune '+text])[0];ok(!/jealous|noticed|Do not turn|Drop the cheap/.test(turn.reply),'not hostile '+text);
 }
}
for(const ask of ['can you','could you','would you','can you please'])for(const address of ['kitsune '+ask+' ask me something easy',ask+' kitsune ask me something easy',ask+' ask me something easy lady kitsune']){
 const turn=chain([address])[0];eq(turn.category,'brief_question');
}
state.sessions.clear();now=1000;
send('kitsune just call me Davi','core_name');const spoof=send('kitsune are you jealous','core_jealous_question');ok(!/glad you are here|caught the fox|you have my attention/.test(spoof.out.payload.content),'account ID controls owner tone');
eq(parse(message('hes funny thats all','other'),now),null,'person follow-up cannot borrow another author');
send('kitsune i like daviti','core_jealous');send('kitsune change the subject','topic_change');eq(parse(message('hes funny thats all'),now),null,'person follow-up reset');
const jealousy=chain(['kitsune are you jealous','why are you jealous','are you jealous']);ok(jealousy[0].reply!==jealousy[1].reply,'avoid immediate social-pool repetition');
for(const line of ['my friend is jealous','someone asked are you jealous','i do not like daviti','davitix helped me today']){
 const result=runLab({...input,seed:17,text:'kitsune '+line});ok(!['core_jealous_question','core_davi_helped','core_jealous'].includes(result.turns[0].category),'whole form '+line);
}
for(const mode of ['be gentle','be serious']){const rows=chain(['kitsune '+mode,'kitsune daviti is stupid']);ok(!/No\. Insulting|Drop the cheap/.test(rows[1].reply),'respect tone preference');}

turns=chain(['kitsune my friend ignored me','what should i say to him','a bit more detail','make it shorter','make it more formal']);ok(turns[3].reply.length<turns[2].reply.length);ok(/Hello/.test(turns[4].reply));ok(/message/.test(turns[4].reply));
turns=chain(['kitsune lets talk about music','mostly rock','jazz as well','sometimes piano too','actually jazz not rock','what did i say i listen to']);ok(!/rock/.test(turns[5].reply));ok(/piano/.test(turns[5].reply));eq((turns[5].reply.match(/jazz/g)||[]).length,1,'no duplicate corrected genre');
turns=chain(['kitsune i like davi','im criticizing ur answer not u','it made no sense explain it properly']);ok(!/insults do not explain/.test(turns[2].reply),'do not invent insult after praise');
console.log(`${count} collected social, address, tone and scope checks passed. No real database or Discord calls.`);
