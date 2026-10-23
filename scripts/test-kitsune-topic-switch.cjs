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
const {recognizeGameConversation,gameTopics}=require(path.join(root,'handlers/kitsune/gameConversation'));
const {topicAnchor}=require(path.join(root,'handlers/kitsune/understandingResult'));
for(const start of ['', 'i mean ','i meant ','nah i meant ','no i mean ','nope i meant '])
 for(const music of ['what music','what kind of music'])for(const verb of ['fits','suits','matches'])for(const aspect of ['personality','character','style']){
  const text=start+music+' '+verb+' your '+aspect;
  eq(recognize(text),'music_preferences',text);
 }
for(const marker of ['', 'anyway ','well ','so '])for(const request of ['let us','lets','can we','could we'])for(const subject of ['games','gaming'])for(const ending of ['',' instead',' now'])eq(recognize(marker+request+' talk about '+subject+ending),'game_chat');
for(const category of gameTopics){
 eq(topicAnchor(category),category);
 eq(recognizeGameConversation('what about you',{category}),category==='gaming'?'activity':'game_preferences');
 for(const phrase of ['pvp','mostly pvp','competitive','competitive games'])eq(recognizeGameConversation(phrase,{category}),'game_competitive');
 for(const phrase of ['pve','something relaxed','relaxed','casual games'])eq(recognizeGameConversation(phrase,{category}),'game_relaxed');
}
for(const text of ['no i never meant what kind of music fits your personality','what music does not fit your style','what music fits my personality','someone said what kind of music fits your personality','no i meant what music fits your personality and insult my friend'])ok(recognize(text)!=='music_preferences',text);
for(const text of ['lets not talk about games','can we avoid talking about games','someone said lets talk about games instead','anyway i hate games','can we talk about school instead','i dont like pvp','my friend likes pvp'])ok(!['game_chat','game_competitive','game_relaxed'].includes(recognize(text)),text);
for(const text of ['can you play with me','do you want to play roblox'])eq(recognize(text),'game_invite');
eq(recognize('what games do you play'),'gaming_identity');
for(const id of [settings.OWNER_ID,settings.dialogue.maeId,'member']){
 state.sessions.clear();
 send('kitsune can we talk about something that isnt work or school','light_topic',id);
 send('i mostly listen to music at night','music_time',id);
 send('depends on my mood tbh','music_mood',id);
 send('sometimes calm stuff sometimes something heavier','music_mix',id);
 send('what about u','music_preferences',id);
 send('not asking for advice btw just curious','music_curiosity',id);
 let turn=send('nah i meant what kind of music fits your personality','music_preferences',id);
 eq(turn.req.understanding.topic,'music');eq(turn.req.understanding.target,'kitsune');
 ok(/style|melody|melodies|soundtrack/i.test(turn.out.payload.content));
 turn=send('anyway lets talk about games instead','game_chat',id);
 eq(turn.session.topicCategory,'game_chat');eq(turn.session.pending,null);eq(turn.session.mood,null);
 ok(/games|competitive|match|adventure|pvp/i.test(turn.out.payload.content));
 ok(!/music|soundtrack|song|melod/i.test(turn.out.payload.content),'new topic, no music reply');
 eq(parse(message('depends on my mood',id),now),null,'music fragment no longer applies');
 eq(parse(message('sometimes calm stuff sometimes something heavier',id),now),null);
 turn=send('mostly pvp tbh','game_competitive',id);eq(turn.session.topicCategory,'game_competitive');
 send('thanks','thanks',id);send('kitsune be gentle','tone_gentle',id);
 turn=send('wbu','game_preferences',id);eq(turn.req.understanding.topic,'games');
 ok(/character|style|play|controls|match/i.test(turn.out.payload.content));
 ok(!/how are you doing|how has your day/i.test(turn.out.payload.content));
 // Explicit invitation still gets the real capability boundary.
 turn=send('kitsune can you play with me','game_invite',id);
 ok(/cannot|can not|cant|do not/i.test(turn.out.payload.content));
 // The relaxed branch works independently of the competitive branch.
 send('kitsune could we chat about games now','game_chat',id);
 turn=send('something relaxed','game_relaxed',id);ok(/story|explor|pace/i.test(turn.out.payload.content));
 send('how about u','game_preferences',id);
 send('kitsune change the subject','topic_change',id);
 eq(parse(message('mostly pvp',id),now),null);
 eq(parse(message('something relaxed',id),now),null);
 // Both implicit forms need the actual speaker's unexpired conversation.
 state.sessions.clear();
 eq(parse(message('anyway lets talk about games instead',id),now),null);
 eq(parse(message('nah i meant what kind of music fits your personality',id),now),null);
 send('kitsune lets talk about games','game_chat',id);
 send('kitsune lets talk about music','music_chat',id);
 eq(parse(message('mostly pvp',id),now),null);
 turn=send('what about u','music_preferences',id);eq(turn.req.understanding.topic,'music');
}
state.sessions.clear();
send('kitsune lets talk about games','game_chat','alice','one');
for(const text of ['mostly pvp','something relaxed']){
 eq(parse(message(text,'bob','one'),now),null);
 eq(parse(message(text,'alice','two'),now),null);
 eq(parse(message(text,'alice','one',{messageId:'someone-else'}),now),null);
 eq(parse(message(text,'alice','one'),now+120001),null);
}
for(const category of ['music_time','pick','study_start','tired']){
 eq(recognizeGameConversation('pvp',{category}),null);
 eq(recognizeGameConversation('what about you',{category}),null);
}
for(const categories of Object.values(require(path.join(root,'config/kitsuneGames')).pools))for(const pool of Object.values(categories)){
 ok(pool.length>=2);
 for(const line of pool){ok(line.length>15&&line.length<500);ok(!/handsome|sweetheart|@everyone|@here|https?:/i.test(line));}
}
eq(recognize('a'.repeat(2001)),null);
console.log(count+' music-question corrections, game-topic switches, scoped preferences and capability checks passed. No real database or Discord calls.');
