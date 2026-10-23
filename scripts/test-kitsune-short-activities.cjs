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
let parse,respond,context,state;
try{
 parse=require(parserPath).parseRequest;respond=require(responsePath).buildResponse;
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
const {learningPhrase}=require(path.join(root,'handlers/kitsune/learningPhrases'));
const activities=[['playing','gaming'],['playng','gaming'],['playin','gaming'],['playign','gaming'],['gaming','gaming'],['gamin','gaming'],['gameing','gaming'],['working','busy'],['workng','busy'],['workin','busy']];
for(const [word,category]of activities)for(const prefix of ['','just ','im ','am '])for(const suffix of ['',' rn',' tbh']){
 const text=prefix+word+suffix;eq(recognize(text),category,text);
}
for(const text of ['not playng','im not playing','my friend is playng','he is gaming','i was playing yesterday','are you playing','playng or working','someone said playng','"playng"','working on your nerves'])ok(!['gaming','busy'].includes(recognize(text)),text);
// Valid lexical words and ambiguous commands must not be autocorrected.
for(const text of ['plying','paying','praying','planning','play','work','game'])ok(!['gaming','busy'].includes(recognize(text)),text);
for(const id of [settings.OWNER_ID,settings.dialogue.maeId,'member']){
 for(const [word,category]of activities){
  state.sessions.clear();
  send('kitsune hi','hi',id);
  let turn=send('how are you?','mood',id);eq(turn.session.pending.kind,'mood');
  turn=send(word,category,id);
  eq(turn.req.understanding.source,'variant');eq(turn.session.pending,null,'activity does not leave a mood question pending');
  ok(!/how are you doing|which feeling|your mood/i.test(turn.out.payload.content));
  if(category==='gaming')eq(turn.session.topicCategory,'gaming');
 }
 state.sessions.clear();
 eq(parse(message('playng',id),now),null,'no session or name: ignore ambient chat');
 send('kitsune playng','gaming',id);
 eq(parse(message('playng',id,'elsewhere'),now),null);
 eq(parse(message('playng',id,'chat',{messageId:'someone-else'}),now),null);
 eq(parse(message('playng',id),now+120001),null);
 // Built-in understanding wins, while storage keys are unchanged.
 const m=message('kitsune playng',id);
 eq(parse(m,now,new Map([['playng','secret']])).category,'gaming');
 send('kitsune can you help me with something','help_offer',id);
 eq(send('gaming','activity_start',id).req.category,'activity_start','explicit help-topic expectation stays authoritative');
}
eq(learningPhrase('playng'),'playng');eq(canonical('playng'),'playng');
eq(recognize('a'.repeat(2001)),null);
console.log(count+' short-activity typo, greeting continuation, subject-scope and learning-key checks passed. No real database or Discord calls.');
