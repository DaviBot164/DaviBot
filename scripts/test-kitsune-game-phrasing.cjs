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


const {runLab}=require(path.join(root,'handlers/kitsune/testLab'));
const input={guildId:'phrasing',channelId:'phrasing',userId:settings.OWNER_ID,persona:'member',seed:17};
const lines=['kitsune lost another match, dont give me tips','i rushed my attacks again','not asking you to fix it','actually, one short suggestion would help','what do you mean?','say it more simply','thats enough, lets talk about music','something calm'];
const result=runLab({...input,text:lines.join(' || ')});
for(const turn of result.turns)eq(turn.status,'matched',turn.input);
ok(/listening/i.test(result.turns[0].reply),'opens with listening');
ok(!/wait|pause|try|should/i.test(result.turns[1].reply),'narration is not advice permission');
ok(/without adding tips/i.test(result.turns[2].reply),'declines repair');
eq(result.turns[3].reply,'Wait a little longer before your next attack.','permission opens grounded advice');
ok(/you said you attack too early/i.test(result.turns[4].reply),'explains own advice, not topic switch');
eq(result.turns[5].reply,'Pause before attacking.','simplifies actual advice');
eq(result.turns[6].after,'music_chat','switches to music');eq(result.turns[7].after,'music_chat','quiet preference follows music');
ok(/quiet music/i.test(result.turns[7].reply),'acknowledges calm music');
for(const first of ['kitsune lost another match no tips','kitsune i lost a pvp match no advice please']){
 const x=runLab({...input,text:first+' || what do you mean?'});eq(x.turns[1].reply,'I mean I can listen without offering advice.','clarification alone never grants advice');
}
const afterMusic=runLab({...input,text:lines.join(' || ')+' || i rushed my attacks again'});eq(afterMusic.turns.at(-1).status,'ignored','game narration does not reactivate after topic switch');
const quoted=runLab({...input,text:'kitsune lost another match no advice || someone said one short suggestion would help'});eq(quoted.turns[1].status,'ignored','reported permission is not user consent');
console.log(count+' full-lab game paraphrase, no-advice, grounded explanation, simplification and music transition checks passed. No external calls.');
