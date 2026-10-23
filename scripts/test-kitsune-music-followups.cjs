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
const {recognizeMusicConversation,musicTopics}=require(path.join(root,'handlers/kitsune/musicConversation'));
const {recognizeDayConversation}=require(path.join(root,'handlers/kitsune/dayConversation'));
const {topicAnchor}=require(path.join(root,'handlers/kitsune/understandingResult'));
for(const lead of ['i','i mostly','i usually','i often','i sometimes'])for(const time of ['at night','in the evening','before bed','during the day'])eq(recognize(lead+' listen to music '+time),'music_time');
for(const category of musicTopics){
 for(const text of ['depends on my mood','it depends on my mood','the music depends on my mood'])eq(recognizeMusicConversation(text,{category}),'music_mood');
 for(const text of ['what about you','how about you','and you'])eq(recognizeMusicConversation(text,{category}),'music_preferences');
 for(const calm of ['calm stuff','quiet music','something soft'])for(const heavy of ['something heavier','some loud music','heavy music'])eq(recognizeMusicConversation('sometimes '+calm+' sometimes '+heavy,{category}),'music_mix');
 eq(topicAnchor(category),category);
}
for(const topic of ['day_pressure','day_limits','day_fairness','day_more_time','day_reaction_worry']){
 for(const start of ['maybe i could','i might','i can'])for(const action of ['ask for more time','request some more time'])eq(recognizeDayConversation(start+' '+action+' instead',{category:topic}),'day_more_time');
 for(const emotion of ['upset','angry','annoyed','disappointed'])eq(recognizeDayConversation('but what if they get '+emotion,{category:topic}),'day_reaction_worry');
}
for(const text of ['actually lets leave that for now','can we just drop it for now','let us pause the topic for a bit','could we leave this'])eq(recognize(text),'topic_change',text);
for(const text of ['i dont listen to music at night','my friend listens to music at night','i used to listen to music at night','someone said i listen to music at night','i listen to music at night but i hate it'])ok(recognize(text)!=='music_time',text);
for(const text of ['i cannot ask for more time','i could not ask for more time','my friend could ask for more time','what if they do not get upset','they are upset','what if i get upset'])ok(!['day_more_time','day_reaction_worry'].includes(recognizeDayConversation(canonical(text),{category:'day_limits'})),text);
for(const category of ['pick','study_start','general','tired']){
 eq(recognizeDayConversation('maybe i could ask for more time instead',{category}),null);
 eq(recognizeDayConversation('but what if they get upset',{category}),null);
 eq(recognizeMusicConversation('depends on my mood',{category}),null);
 eq(recognizeMusicConversation('what about you',{category}),null);
}
for(const id of [settings.OWNER_ID,settings.dialogue.maeId,'member']){
 state.sessions.clear();
 send('kitsune people expect too much from me','day_pressure',id);
 send('what would u do in my place?','advice_resume',id);
 send('i cant just say no to everyone tho','day_limits',id);
 let turn=send('maybe i could ask for more time instead','day_more_time',id);
 ok(/more time|realistic date/i.test(turn.out.payload.content));
 turn=send('but what if they get upset?','day_reaction_worry',id);
 ok(/might|possibility|worried|uncertainty|cannot know/i.test(turn.out.payload.content),'hypothetical, not asserted anger');
 turn=send('actually lets leave that for now','topic_change',id);
 eq(turn.session.topicCategory,null);eq(turn.session.pending,null);
 eq(parse(message('but what if they get upset',id),now),null);
 eq(parse(message('maybe i could ask for more time instead',id),now),null);
 // The posted music conversation, including shorthand reciprocal questions.
 state.sessions.clear();
 turn=send('kitsune can we talk about something that isnt work or school?','light_topic',id);
 eq(turn.session.topicCategory,'music_chat');
 turn=send('i mostly listen to music at night','music_time',id);eq(turn.session.topicCategory,'music_time');
 ok(/night|evening|quieter hour/i.test(turn.out.payload.content));
 send('depends on my mood tbh','music_mood',id);
 send('sometimes calm stuff, sometimes something heavier','music_mix',id);
 turn=send('what about u?','music_preferences',id);
 ok(/style|melody|soundtrack|melodies/i.test(turn.out.payload.content));
 ok(!/how are you doing|how has your day|how are things today/i.test(turn.out.payload.content),'stays with music');
 turn=send('not asking for advice btw, just curious','music_curiosity',id);
 eq(turn.session.noAdviceRemaining,4);eq(turn.req.understanding.topic,'music');eq(turn.req.understanding.listening,true);
 // Topic and reciprocity survive thanks and tone controls.
 send('thanks','thanks',id);send('kitsune be serious','tone_serious',id);
 turn=send('wbu','music_preferences',id);ok(!/how are you doing/i.test(turn.out.payload.content));
 send('kitsune change the subject','topic_change',id);
 eq(parse(message('depends on my mood',id),now),null);
 eq(parse(message('sometimes calm stuff sometimes something heavier',id),now),null);
 eq(parse(message('not asking for advice btw just curious',id),now),null);
 // A new concrete subject replaces music; vague "you?" cannot revive it.
 send('kitsune lets talk about music','music_chat',id);
 send('kitsune pick tea / coffee','pick',id);
 turn=send('what about u','mood',id);ok(turn.req.category!=='music_preferences');
 // Listening-only pressure conversations reflect the proposed plan without advice.
 state.sessions.clear();
 send('kitsune people expect too much from me','day_pressure',id);
 send('just listen','decline_advice',id);
 turn=send('maybe i could ask for more time instead','day_more_time',id);
 ok(!/you could|you should|try |name a realistic/i.test(turn.out.payload.content));
 turn=send('but what if they get upset','day_reaction_worry',id);
 ok(!/you could|you should|you can acknowledge/i.test(turn.out.payload.content));
}
// Session isolation and expiry still apply to all implicit music fragments.
state.sessions.clear();
send('kitsune lets talk about music','music_chat','alice','one');
for(const text of ['depends on my mood','sometimes calm stuff sometimes something heavier']){
 eq(parse(message(text,'bob','one'),now),null);
 eq(parse(message(text,'alice','two'),now),null);
 eq(parse(message(text,'alice','one',{messageId:'someone-else'}),now),null);
 eq(parse(message(text,'alice','one'),now+120001),null);
}
for(const [tone,categories]of Object.entries(require(path.join(root,'config/kitsuneMusic')).pools))for(const [category,pool]of Object.entries(categories)){
 ok(Array.isArray(pool)&&pool.length>=2,tone+' '+category);
 for(const line of pool){ok(line.length>15&&line.length<500);ok(!/handsome|sweetheart|https?:|@everyone|@here/i.test(line));}
}
eq(recognize('a'.repeat(2001)),null);
console.log(count+' music-topic continuity, reciprocal shorthand, advice alternatives and hypothetical-reaction checks passed. No real database or Discord calls.');
