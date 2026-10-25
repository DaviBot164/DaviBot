// Private owner-triggered inference only. No database, live chat, learning or moderation imports.
const config=require('../../config/kitsuneAiLab');
const {OWNER_ID}=require('./settings');
const endpoint='https://api.groq.com/openai/v1/chat/completions';
const {buildPrompt:prompt}=require('./aiPersona');
function createAiLab({fetchFn=(...args)=>globalThis.fetch(...args),env=process.env,clock=Date.now,limits=config}={}){
 const labs=new Map();let busy=false,day='',requests=0;
 function authorize(input){if(input.userId!==OWNER_ID||!input.guildId||!input.channelId)throw Error('Only Davi can use this private AI lab in a server channel.');}
 function cleanup(now){for(const[key,lab]of labs)if(now-lab.usedAt>=limits.ttlMs)labs.delete(key);}
 function resetAiLab(input){authorize(input);if(busy)throw Error('An AI test is running. Wait for it to finish before resetting.');let count=0;for(const[key,lab]of labs)if(lab.guildId===input.guildId&&lab.channelId===input.channelId&&lab.userId===input.userId){labs.delete(key);count++;}return count;}
 async function completion(messages,key){
  const controller=new AbortController();let timer;
  try{
   return await Promise.race([
    (async()=>{
     const response=await fetchFn(endpoint,{method:'POST',redirect:'error',signal:controller.signal,headers:{Authorization:'Bearer '+key,'Content-Type':'application/json'},body:JSON.stringify({model:limits.model,messages,temperature:0.6,max_completion_tokens:limits.maxCompletionTokens,reasoning_effort:'low',include_reasoning:false,stream:false})});
     if(!response.ok){const status=response.status;return {error:status===429?'Groq rate limit reached. Wait before testing again.':status===401||status===403?'Groq rejected the key or model access. Check the secret and Free Plan account.':status===400||status===404?'Groq rejected the configured model or request. Check current model availability.':'Groq is temporarily unavailable. No automatic retry was made.'};}
     const body=await response.json();const choice=body?.choices?.[0],reply=choice?.message?.content;
     if(typeof reply!=='string'||!reply.trim()||reply.length>10_000||/<(?:think|analysis)>/iu.test(reply))return {error:'Groq returned no usable final reply. No history was committed for this turn.'};
     return {reply:reply.trim().slice(0,limits.maxReply),truncated:choice.finish_reason==='length'||reply.trim().length>limits.maxReply};
    })(),
    new Promise(resolve=>{timer=setTimeout(()=>{controller.abort();resolve({error:'Groq request timed out. No automatic retry was made.'});},limits.timeoutMs);timer.unref?.();})
   ]);
  }catch{return {error:'Groq request failed. Check connectivity or try again later. No automatic retry was made.'};}
  finally{clearTimeout(timer);}
 }
 async function runAiLab(input){
  authorize(input);
  if(env.KITSUNE_AI_LAB_ENABLED!=='true')throw Error('Private AI lab is disabled. Set KITSUNE_AI_LAB_ENABLED=true to opt in.');
  const apiKey=env.GROQ_API_KEY?.trim();if(!apiKey)throw Error('Set GROQ_API_KEY as a secret environment variable. Do not paste it into Discord.');
  const persona=input.persona??'member';if(!['owner','member','mae','ash'].includes(persona))throw Error('Choose owner, member, mae or ash.');
  if(typeof input.text!=='string'||input.text.length>limits.maxInput)throw Error('Use 1-1500 characters of fictional test dialogue.');
  if(/(?:gsk_|sk-)[a-z0-9_-]{16,}|(?:groq_api_key|token|password)\s*=/iu.test(input.text))throw Error('This looks like a credential. Remove secrets from the test text.');
  const lines=input.text.split(/\r?\n|\s*\|\|\s*/u).map(s=>s.trim()).filter(Boolean);
  if(!lines.length||lines.length>limits.maxTurns)throw Error('Use 1-10 test turns separated by ||.');
  if(input.expected)throw Error('Expected rule categories apply only to built-in tests, not generated AI replies.');
  if(input.seed!==undefined&&(!Number.isInteger(input.seed)||input.seed<0||input.seed>2147483647))throw Error('Seed must be a nonnegative 32-bit test seed.');
  if(busy)throw Error('Another private AI test is running. Wait for its report.');
  busy=true;
  try{
   const now=clock();cleanup(now);const today=new Date(now).toISOString().slice(0,10);if(day!==today){day=today;requests=0;}
   const key=JSON.stringify([input.guildId,input.channelId,input.userId,persona]);let lab=labs.get(key);
   if(!lab||input.seed!==undefined){lab={guildId:input.guildId,channelId:input.channelId,userId:input.userId,history:[],usedAt:now};if(!labs.has(key)&&labs.size>=limits.maxSessions)labs.delete(labs.keys().next().value);labs.set(key,lab);}
   const turns=[];
   for(const text of lines){
    if(requests>=limits.dailyRequests){turns.push({input:text,status:'stopped',error:'Local trial cap reached ('+limits.dailyRequests+' requests per UTC day per running bot process).'});break;}
    requests++;
    const messages=[{role:'system',content:prompt(persona)},...lab.history,{role:'user',content:text}];
    const result=await completion(messages,apiKey);
    if(result.error){turns.push({input:text,status:'error',error:result.error});break;}
    lab.history=[...lab.history,{role:'user',content:text},{role:'assistant',content:result.reply}];
    while(lab.history.length>limits.historyMessages||lab.history.reduce((sum,m)=>sum+m.content.length,0)>limits.historyChars)lab.history.splice(0,2);
    lab.usedAt=clock();turns.push({input:text,status:'generated',reply:result.reply,truncated:result.truncated});
   }
   return {persona,model:limits.model,turns,remaining:Math.max(0,limits.dailyRequests-requests),limitations:'Private external Groq trial. Only submitted simulated dialogue is sent. No live chat, database or learned aliases. Seed resets history; AI replies are not deterministic. Free Plan status must be checked in your Groq account.'};
  }finally{busy=false;}
 }
 function formatAiReport(result){return ['Kitsune private AI lab | Groq',`Persona: ${result.persona} | Model: ${result.model}`,result.limitations,'Local requests remaining today: '+result.remaining,'',...result.turns.map((turn,i)=>`${i+1}. INPUT: ${turn.input}\nSTATUS: ${turn.status}${turn.truncated?' | shortened by limit':''}\nREPLY: ${turn.reply??turn.error}\n`)].join('\n');}
 return {runAiLab,resetAiLab,formatAiReport};
}
module.exports={createAiLab,...createAiLab()};
