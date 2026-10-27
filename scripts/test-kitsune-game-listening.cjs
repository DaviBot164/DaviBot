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
const input={guildId:'test-guild',channelId:'game-listening',userId:settings.OWNER_ID,persona:'member',seed:17};
const lines=['kitsune i lost another pvp match, no advice please','i keep attacking too early','just listen and keep it short','okay, now one small tip based only on what i told you','explain what you mean','simpler please','okay, no more tips'];
const result=runLab({...input,text:lines.join(' || ')});
for(const turn of result.turns){eq(turn.status,'matched',turn.input);eq(turn.after,'game_chat',turn.input+' retains game context');}
ok(/no advice/i.test(result.turns[0].reply),'opening respects advice boundary');
ok(!/try|should|wait|pause/i.test(result.turns[1].reply),'narrated mistake is not permission for advice');
eq(result.turns[2].reply,'I am listening. No tips.','brief listening');
eq(result.turns[3].reply,'Wait a little longer before your next attack.','tip uses only stated mistake');
ok(/you said you attack too early/i.test(result.turns[4].reply),'explanation refers to own prior advice');
eq(result.turns[5].reply,'Pause before attacking.','simplification preserves tip');
ok(/just chat/i.test(result.turns[6].reply),'stops advice');
const missing=runLab({...input,text:'kitsune i lost a match, no tips || now one small tip based only on what i told you'});
ok(/only mentioned losing/i.test(missing.turns[1].reply),'does not invent mistake');
for(const text of ['i keep attacking too early','just listen and keep it short','now one small tip based only on what i told you','explain what you mean']){
 const isolated=runLab({...input,text});ok(isolated.turns[0].status==='ignored','no ambient unaddressed game follow-up: '+text);
}
const reset=runLab({...input,text:'kitsune i lost another pvp match no advice || i keep attacking too early || kitsune change the subject || explain what you mean'});
ok(reset.turns[3].status==='ignored','topic change closes game repair context');
console.log(count+' full-lab compound game opening, no-advice boundary, grounded tip, explanation, simplification and scope checks passed. No external calls.');
