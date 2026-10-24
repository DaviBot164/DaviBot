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




const {names}=require(path.join(root,'config/kitsuneAddressing'));
const {namedAddress}=require(path.join(root,'handlers/kitsune/addressing'));
const learning=require(path.join(root,'handlers/kitsune/learningRuntime'));
for(const name of names){
 const patterns=[['lady '+name+', hru?','mood'],['Hey, lady '+name+'! hru?','mood'],['my lady '+name+' hru','mood'],['Ms. '+name+' hru','mood']];
 if(name!=='kit')patterns.push(['how are you, '+name+'?','mood'],['can you, '+name+', help me study?','study_start'],['can you help me study '+name,'study_start'],['im tired '+name,'tired']);
 for(const [text,category]of patterns){
  state.sessions.clear();send(text,category);
  const input=learning.inputForLearning(message(text),null,now);
  ok(input?.phrase,'learning extracts name-free phrase');ok(!input.phrase.includes(name),'alias not stored');eq(input.collect,true);
 }
}
for(const id of [settings.OWNER_ID,settings.dialogue.maeId,'1322228925421850644','member']){
 for(const text of ['Lady Kitsune, hi','hi, kitsu','hello kitsune','kitsune, hi, kitsu']){
  state.sessions.clear();send(text,'hi',id);
 }
 state.sessions.clear();send('can you, kitsune, help me study?','study_start',id);send('sure','study_step',id);
}
for(const [text,phrase]of [['how are you, kitsune?','how are you'],['can you, kitsu, help me study?','can you help me study'],['lady kitsune unfamiliar blorple','unfamiliar blorple']])eq(learning.inputForLearning(message(text),null,now)?.phrase,phrase);
for(const text of ['kitten hi','kitsunex hi','my toolkit','first aid kit','my kit is ready','i told kitsu hi','someone said hey kit hi',"kit's ready",'kitsune-chanx hi','kitsuuuu hi','"hey kitsune hru"',"'hey kitsu hru'",'`kitsune hi`','> kitsune hi','visit https://example.com/kitsune','email a@kitsune.com','how are you kitsuneology']){
 state.sessions.clear();eq(namedAddress(text),null,'not a call: '+text);eq(parse(message(text),now),null);eq(learning.inputForLearning(message(text),null,now),null);
}
state.sessions.clear();send('kitsune someone called u useless but i disagree','reported_disagreement');
state.sessions.clear();eq(parse(message('hi'),now),null,'no name and no session');
console.log(count+' flexible name-position, honorific, extraction, quoted-name and friendly-tone checks passed. No real database or Discord calls.');
