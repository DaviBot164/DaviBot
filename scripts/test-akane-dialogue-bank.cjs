'use strict';
const assert=require('node:assert/strict'),path=require('node:path'),Module=require('node:module');
const root=process.argv[2]||path.resolve(__dirname,'..');
const bank=require(path.join(root,'config/akaneDialogueExpansion'));
const voice=require(path.join(root,'config/akaneVoice'));
let count=0;const check=(truth,label)=>{assert.ok(truth,label);count++;};
let total=0;
for(const [tone,categories]of Object.entries(bank)){
 check(Object.isFrozen(categories),'Frozen categories');
 for(const [category,pool]of Object.entries(categories)){
  check(Object.isFrozen(pool),'Frozen pool');check(new Set(pool).size===pool.length,'Unique pool');
  for(const text of pool){total++;check(typeof text==='string'&&text.trim()===text&&text.length>10&&text.length<1500,tone+'/'+category);check(!/[\u10a0-\u10ff]|\{score\}|\|/u.test(text),'English, complete lines');
   if(tone==='mae')check(!/handsome|sweetheart|darling|romantic/iu.test(text),'Mae stays friendly');
  }
 }
}
check(total===315,'315 new replies');
const original=Module._load;
const responsePath=path.join(root,'handlers/akane/responses.js'),statePath=path.join(root,'handlers/akane/state.js');
const replies={};
const settings={OWNER_ID:'1357721282061533311',dialogue:{maeId:'1380278195961729084'},replies,STATE_TTL:1800000};
Module._load=function(request,parent){
 if([responsePath,statePath].includes(parent?.filename)&&request==='./settings')return settings;
 if(parent?.filename===responsePath&&request==='discord.js')return{escapeMarkdown:x=>x};
 if(parent?.filename===responsePath&&request==='./help')return{buildHelp:()=>({})};
 return original.apply(this,arguments);
};
let response,state;try{response=require(responsePath);state=require(statePath);}finally{Module._load=original;}
for(const [tone,id]of [['public','member'],['owner',settings.OWNER_ID],['mae',settings.dialogue.maeId]]){
 const message={guildId:'g',channelId:'c',author:{id}};
 for(const [category,pool]of Object.entries(bank[tone])){
  const key=`conversation_${tone}_${category}`;
  const active=voice.pools[tone]?.[category]??pool;
  check(active.every(line=>replies[key].includes(line)),'The active personality pool is registered');
  const next=response.buildResponse(message,{category});
  check(typeof next.payload.content==='string'&&next.payload.content.length<2000,'Working response');
  const drawState={bags:new Map()};
  const expected=new Set(replies[key]);
  const seen=new Set();let last;
  for(let i=0;i<expected.size;i++){last=state.drawReply(drawState,key);seen.add(last);}
  check(seen.size===expected.size,'Bag avoids repeats before exhaustion');
  check(state.drawReply(drawState,key)!==last,'Bag boundary avoids immediate repeat');
 }
}
// An active gentle tone must still override a roast after adding dialogue.
const softened=response.buildResponse({guildId:'g',channelId:'c',author:{id:'member'}},{category:'roast',conversation:{mode:{name:'gentle',remaining:4}}});
check(softened.payload.content.includes('skip'),'Gentle tone preserved');
console.log(`${count} dialogue-bank checks passed; ${total} new replies validated.`);
