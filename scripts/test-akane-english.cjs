'use strict';
const assert=require('node:assert/strict'),path=require('node:path'),Module=require('node:module');
const root=process.argv[2]||path.resolve(__dirname,'..');
const language=require(path.join(root,'handlers/akane/language'));
let checks=0;const eq=(actual,expected,label)=>{assert.deepEqual(actual,expected,label);checks++;};
const cases=[
 ['omg ur so cute lol','reaction_affection'],['why r u so rude','rude'],['can u be my gf','reaction_romance'],['im not very happy','feeling_bad'],['idgaf','topic_change'],['wya','location'],['stfu','reaction_dismissive'],['fml','feeling_bad'],
 ['tbh idk','uncertain'],['ngl im really tired rn','tired'],['u r not stupid','reaction_reassurance'],
 ['ur cute','reaction_affection'],['ur not stupid','reaction_reassurance'],['ur name',null],
 ['wdym','explain'],['wym','explain'],['wsym','explain'],['hbu','mood'],['wbu','mood'],
 ['ikr','agree'],['tysm','thanks'],['thx bro','thanks'],['mb','reaction_apology'],['sry','reaction_apology'],
 ['brb','pause'],['afk','pause'],['gtg','stop'],['ttyl','stop'],['gn','goodnight'],['gm','morning'],
 ['can u give me a compliment pls','nice'],['could you roast me please','roast'],
 ['would you give me some advice','tip'],['i want you to tell me a secret','secret'],
 ['can you explain that please','explain'],['can you stop being rude','tone_gentle'],
 ['dont roast me','tone_gentle'],['do not be mean','tone_gentle'],
 ['you are stupid','reaction_insult'],['you are not stupid','reaction_reassurance'],
 ["i don't think you're stupid",'reaction_reassurance'],['sorry but you are cute','reaction_affection'],
 ['sorry but you are stupid','reaction_insult'],['you are not stupid but you are ugly','reaction_insult'],
 ['my friend is stupid',null],['my girlfriend is here',null],['my friend says you are stupid',null],
 ['he said "you are stupid"',null],['i do not love you',null],['you are not cute',null],
 ['i am not happy','feeling_bad'],['i am not tired','feeling_neutral'],['i am not sad','feeling_neutral'],
 ['i was tired',null],['my friend is tired',null],['i am happy for my friend',null],
 ['i am hungry','hungry'],['im lonely','lonely'],['i am playing roblox','gaming'],
 ['i am listening to music','music'],['play some music','music'],['i am useless','self_doubt'],
 ['i feel so stressed','feeling_bad'],['i feel a bit exhausted','tired'],['my day was awful','feeling_bad'],
 ['i had a good day','feeling_good'],['i am sad because work was rough','feeling_bad'],
 ['i am sad but happy','mixed_feelings'],['the word idk appears here',null],['idk but this is a complicated story',null],
 ['do you like Davi','reaction_davi'],['Davi is not stupid','reaction_davi'],['Davi is stupid','reaction_davi_insult'],
 ['what do you think about Mae','mae'],['you are rude','rude'],['ur just a bot','reaction_bot'],
 ['are u a bot','reaction_bot'],['do you love me','reaction_romance'],['love u','reaction_affection'],
 ['hey there','hi'],['heyyyy','hi'],['lol','laugh'],['lmaooo','laugh'],['😂','laugh'],['😭','clarify'],
 ['tbh','conversation_marker'],['hello stupid world',null],['the stupid bot is broken',null],
 ['stupidly good',null],['გამარჯობა',null],['i feel tiredness',null],['not really happy',null]
];
for(const [text,category]of cases)eq(language.recognize(text),category,text);
// A broad corpus of genuinely equivalent sentences, plus negative controls.
for(const [feeling,category]of [['sad','feeling_bad'],['happy','feeling_good'],['tired','tired'],['hungry','hungry'],['lonely','lonely'],['bored','bored']]){
 for(const subject of ['i am','im',"I'm",'i feel'])for(const emphasis of ['','really ','so ','a bit '])for(const wrapping of [x=>x,x=>'tbh '+x,x=>'ngl '+x+' rn']){
  const text=wrapping(`${subject} ${emphasis}${feeling}`);eq(language.recognize(text),category,text);
 }
 eq(language.recognize(`my friend is ${feeling}`),null);
 eq(language.recognize(`i was ${feeling}`),null);
}
eq(language.extractChoice('Can u pick between Tea / Coffee?'),'Tea / Coffee');
eq(language.extractChoice('choose red / blue pls'),'red / blue');
// Use real parser and real context; session and settings are isolated, no Discord.
let session;
const parserPath=path.join(root,'handlers/akane/parser.js'),original=Module._load;
Module._load=function(request,parent){if(parent?.filename===parserPath){
 if(request==='./settings')return{OWNER_ID:'1357721282061533311',dialogue:{maeId:'1380278195961729084'},reactionPools:{}};
 if(request==='./state')return{getSession:()=>session};
}return original.apply(this,arguments);};
let parse;try{parse=require(parserPath).parseRequest;}finally{Module._load=original;}
const msg=(content,reference)=>({content,reference,client:{user:{id:'999'}},mentions:{}});
session=null;eq(parse(msg('ur cute'),100),null);eq(parse(msg('akane ur cute'),100).category,'reaction_affection');
eq(parse(msg('<@999> hru'),100).category,'mood');eq(parse(msg('<@888> hru'),100),null);
session={messageId:'latest',category:'mood',question:false,pending:{kind:'mood'},implicitUntil:200};
eq(parse(msg('bad'),100).category,'feeling_bad');eq(parse(msg('ur cute'),100).category,'reaction_affection');
eq(parse(msg('ur cute'),201),null);eq(parse(msg('ur cute',{messageId:'someone-else'}),100),null);
eq(parse(msg('Can u pick between Tea / Coffee?'),100).argument,'Tea / Coffee');
eq(parse(msg('😂'),100).category,'laugh');eq(parse(msg('აკანე გამარჯობა'),100),null);
eq(parse(msg('yes'),100).category,'clarify');session.question=true;eq(parse(msg('yep'),100).category,'yes');
console.log(`${checks} English recognition and parser checks passed.`);
// New categories must have working response pools for all three caller types.
const responsePath=path.join(root,'handlers/akane/responses.js');
const statePath=path.join(root,'handlers/akane/state.js');
const reactionPools=require(path.join(root,'config/akaneReactions')).pools;
const friend=require(path.join(root,'config/akaneDialogue'));
const replies={};
for(const cat of ['general','hi','nice','roast','tip','secret','luck','rate','davi','member','yes','no','rude','thanks','fallback','mood','stop']){
 replies[cat]=[cat==='rate'?'{score}/10. Random score.':`Base ${cat}.`];
 replies['owner_'+cat]=[cat==='rate'?'{score}/10, handsome.':`For you, handsome. ${cat}.`];
}
for(const cat of ['flirt','tension','identity','bot','question','apology'])replies['owner_'+cat]=[`Of course, handsome. ${cat}.`];
for(const [cat,pool]of Object.entries(reactionPools))replies['reaction_'+cat]=pool;
for(const [cat,pool]of Object.entries(friend.pools))replies['dialogue_'+cat]=pool;
const settings={OWNER_ID:'1357721282061533311',dialogue:friend,replies,STATE_TTL:1800000};
Module._load=function(request,parent){
 if([responsePath,statePath].includes(parent?.filename)&&request==='./settings')return settings;
 if(parent?.filename===responsePath&&request==='discord.js')return{escapeMarkdown:x=>x};
 if(parent?.filename===responsePath&&request==='./help')return{buildHelp:()=>({})};
 return original.apply(this,arguments);
};
let respond;try{respond=require(responsePath).buildResponse;}finally{Module._load=original;}
for(const id of ['ordinary',settings.OWNER_ID,friend.maeId]){
 const message={guildId:'guild',channelId:'channel',author:{id}};
 for(const category of ['hungry','gaming','music','lonely','feeling_neutral','self_doubt','location','conversation_marker','clarify','fallback','reaction_affection','reaction_insult','reaction_reassurance','reaction_davi','reaction_bot']){
  const response=respond(message,{category});
  assert.ok(typeof response.payload.content==='string'&&response.payload.content.length>0&&response.payload.content.length<=2000,category);checks++;
 }
 const gentle=respond(message,{category:'roast',conversation:{mode:{name:'gentle',remaining:4}}});assert.ok(gentle.payload.content.includes('skip'));checks++;
 const mood=respond(message,{category:'mood'});eq(mood.pending.kind,'mood');
}
console.log(`${checks} total English recognition, parser and response checks passed.`);
