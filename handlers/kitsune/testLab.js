// Isolated text-only dialogue lab. Never emits events, writes learning data or sends chat messages.
const {TEST_SCOPE,createTestScope,getSession,sessionKey}=require('./state');
const {parseRequest}=require('./parser');
const {buildResponse}=require('./responses');
const {memoryAfter}=require('./context');
const {OWNER_ID,dialogue}=require('./settings');
const friends=require('../../config/kitsuneFriends');
const profiles={owner:OWNER_ID,mae:dialogue.maeId,ash:Object.keys(friends).find(id=>friends[id].name==='Ash'),member:'kitsune-test-member'};
const TTL=15*60_000,MAX=32;
const labs=new Map();
function seeded(seed){let value=(seed>>>0)||1;return(min,max)=>{if(max===undefined){max=min;min=0;}value^=value<<13;value^=value>>>17;value^=value<<5;return min+(value>>>0)%(max-min);};}
function cleanup(now){for(const[key,lab]of labs)if(now-lab.usedAt>=TTL)labs.delete(key);}
function keyOf({guildId,channelId,userId,persona}){return [guildId,channelId,userId,persona].join(':');}
function resetLab(input){if(input.userId!==OWNER_ID)throw Error('Only Davi can reset the dialogue lab.');let count=0;for(const[key,lab]of labs)if(lab.guildId===input.guildId&&lab.channelId===input.channelId&&lab.userId===input.userId){labs.delete(key);count++;}return count;}
function runLab(input){
 if(input.userId!==OWNER_ID)throw Error('Only Davi can use the dialogue lab.');
 if(!input.guildId||!input.channelId)throw Error('Use the dialogue lab in a server channel.');
 const persona=input.persona??'member';if(!Object.hasOwn(profiles,persona)||typeof profiles[persona]!=='string')throw Error('Choose owner, mae, ash or member.');
 if(typeof input.text!=='string'||input.text.length>1500)throw Error('Use at most 1500 characters.');
 const lines=input.text.split(/\r?\n|\s*\|\|\s*/u).map(line=>line.trim()).filter(Boolean);
 if(!lines.length||lines.length>10)throw Error('Use 1–10 turns, separated by a new line or ||.');
 if(input.seed!==undefined && (!Number.isInteger(input.seed)||input.seed<0||input.seed>2147483647))throw Error('Seed must be an integer from 0 to 2147483647.');
 if(input.expected && lines.length!==1)throw Error('Expected category is for a single turn.');
 const now=Date.now();cleanup(now);const key=keyOf({...input,persona});
 let lab=labs.get(key);
 if(!lab||Number.isInteger(input.seed)){
  if(!lab&&labs.size>=MAX)labs.delete(labs.keys().next().value);
  const seed=Number.isInteger(input.seed)?input.seed:12345;
  lab={guildId:input.guildId,channelId:input.channelId,userId:input.userId,scope:createTestScope(seeded(seed)),seed,clock:now,usedAt:now};labs.set(key,lab);
 }
 labs.delete(key);labs.set(key,lab);lab.usedAt=now;lab.clock=now;
 const records=[];
 for(const text of lines){
  const message={content:text,guildId:input.guildId,channelId:'lab:'+input.channelId,author:{id:profiles[persona]},client:{user:{id:input.botId??'kitsune-test-bot',displayAvatarURL:()=>input.botAvatar??'https://cdn.discordapp.com/embed/avatars/0.png'}},mentions:{members:new Map(),users:new Map()},[TEST_SCOPE]:lab.scope};
  const previous=getSession(message,lab.clock);
  const request=parseRequest(message,lab.clock);
  if(!request){records.push({input:text,status:'ignored',before:previous?.category??null,after:previous?.category??null,topic:previous?.topicCategory??null,reason:'No supported addressed request or active-context follow-up.',...(input.expected?{expected:input.expected,pass:false}:{})});lab.clock+=5000;continue;}
  const response=buildResponse(message,request);
  const k=sessionKey(message);lab.scope.sessions.delete(k);
  if(response.session)lab.scope.sessions.set(k,{...memoryAfter(previous,request,response),category:response.category,question:response.question??false,messageId:'lab-'+lab.clock,implicitUntil:lab.clock+120000,expiresAt:lab.clock+120000});
  const after=getSession(message,lab.clock);
  records.push({input:text,status:request.understanding.status,category:request.category,rule:request.recovery?'recovery.'+request.recovery.kind:request.understanding.rule,source:request.understanding.source,before:previous?.category??null,after:after?.category??null,topic:after?.topicCategory??null,reply:response.payload.content??(response.payload.embeds?.map(embed=>{const data=embed.toJSON?.()??embed.data??embed;return [data.title,data.description,...(data.fields??[]).map(field=>field.name+': '+field.value)].filter(Boolean).join('\n');}).join('\n')||'[Embed response]'),...(input.expected?{expected:input.expected,pass:request.category===input.expected}:{})});
  lab.clock+=5000;
 }
 // Match real expiry between separate slash invocations without artificial five-second waits.
 const active=[...lab.scope.sessions.values()][0];if(active){active.implicitUntil=now+120000;active.expiresAt=now+120000;}lab.clock=now;
 return {persona,seed:lab.seed,turns:records,limitations:'Built-in rules only; no learned server aliases, XP, moderation, real chat memory or external AI calls.'};
}
function formatReport(result){return ['Kitsune private dialogue lab',`Persona: ${result.persona} | Seed: ${result.seed}`,result.limitations,'',...result.turns.map((turn,index)=>`${index+1}. INPUT: ${turn.input}\nSTATUS: ${turn.status}${turn.category?' | '+turn.category:''}\nRULE: ${turn.rule??turn.reason}\nCONTEXT: ${turn.before??'none'} -> ${turn.after??'none'}${turn.topic?' | topic: '+turn.topic:''}\n${turn.expected?'EXPECTED: '+turn.expected+' | '+(turn.pass?'PASS':'FAIL')+'\n':''}REPLY: ${turn.reply??'[No reply]'}\n`)].join('\n');}
module.exports={runLab,resetLab,formatReport};
