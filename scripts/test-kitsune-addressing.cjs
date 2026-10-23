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
 for(const prefix of ['', 'hey ', 'yo, ', 'hi! ', 'Hello ']){
  for(const separator of [' ', ', ', '! ', ': ', ' 🦊 ']){
   const text=prefix+name.toUpperCase()+separator+'hru?';
   state.sessions.clear();const turn=send(text,'mood');
   eq(namedAddress(text)?.[1],'hru?','shared extraction');
   const input=learning.inputForLearning(message(text),null,now);
   eq(input?.phrase,'how are you','learning has no alias in key');eq(input?.collect,true);
  }
 }
 state.sessions.clear();send(name+' hi','hi');send('hru','mood');send('good','feeling_good');
 eq(namedAddress(name)?.[1],'','bare alias');
 state.sessions.clear();eq(parse(message(name),now)?.category,'general','bare call');
 state.sessions.clear();eq(parse(message(name+' unfamiliar blorple'),now)?.category,'fallback');
 eq(learning.inputForLearning(message(name+' unfamiliar blorple'),null,now)?.phrase,'unfamiliar blorple');
}
for(const text of ['kitten hi','kitsunex hi','kitbag hi','kitchen hi','toolkit hi','first aid kit','my kit is ready','i told kitsu hi','someone said hey kit hi',"kit's ready",'kitsune-chanx hi','kitsuuuu hi']){
 state.sessions.clear();eq(namedAddress(text),null,'whole name: '+text);
 eq(parse(message(text),now),null,'ambient chat: '+text);
 eq(learning.inputForLearning(message(text),null,now),null,'no ambient collection: '+text);
}
state.sessions.clear();eq(parse(message('<@bot> hi'),now),null,'numeric mention syntax still required');
const m=message('<@123> hi');m.client.user.id='123';eq(parse(m,now)?.category,'hi','actual bot mention works');
console.log(count+' alias, greeting style, whole-name boundary, follow-up and learning-consistency checks passed. No real database or Discord calls.');
