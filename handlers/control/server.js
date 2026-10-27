// Opt-in owner API. No public browser CORS, OAuth bypass, arbitrary SQL or Groq calls.
const http=require('node:http'),crypto=require('node:crypto');
const {learningPhrase}=require('../kitsune/learningPhrases');
const {recognize,extractChoice}=require('../kitsune/language');
const {contextualCategory}=require('../kitsune/context');
const {validate,nameKey}=require('../kitsune/knowledge');
const learningConfig=require('../../config/kitsuneLearning');
const {OWNER_ID}=require('../kitsune/settings');
function createHandler({client,key,repos,runTest,invalidate=()=>{},clock=Date.now}){
 let windowStart=0,count=0;
 const reply=(res,status,data)=>{res.writeHead(status,{'Content-Type':'application/json','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'});res.end(JSON.stringify(data));};
 const authenticate=req=>{const incoming=String(req.headers.authorization??'');const expected='Bearer '+key;return Buffer.byteLength(incoming)===Buffer.byteLength(expected)&&crypto.timingSafeEqual(Buffer.from(incoming),Buffer.from(expected));};
 return async(req,res)=>{
  try{
   if(!authenticate(req))return reply(res,401,{error:'Unauthorized'});
   if(req.method!=='GET'&&req.method!=='POST')return reply(res,405,{error:'Method not allowed'});
   const now=clock();if(now-windowStart>=60_000){windowStart=now;count=0;}if(++count>30)return reply(res,429,{error:'Rate limited'});
   if(String(req.url??'').length>2048)return reply(res,400,{error:'Invalid URL'});
   const url=new URL(req.url,'http://control.local');
   if(req.method==='GET'&&url.pathname==='/v1/status')return reply(res,200,{service:'kitsune-control',ready:true,version:1});
   if(req.method==='GET'&&url.pathname==='/v1/guilds')return reply(res,200,{guilds:[...client.guilds.cache.values()].map(g=>({id:g.id,name:g.name})).slice(0,200)});
   let body={};if(req.method==='POST'){
    if(!String(req.headers['content-type']??'').startsWith('application/json'))return reply(res,415,{error:'JSON required'});
    let size=0;const chunks=[];for await(const chunk of req){size+=chunk.length;if(size>16000)return reply(res,413,{error:'Body too large'});chunks.push(chunk);}body=JSON.parse(Buffer.concat(chunks).toString('utf8'));
   }
   const guildId=req.method==='GET'?url.searchParams.get('guildId'):body.guildId;
   if(typeof guildId!=='string'||!/^\d{16,22}$/u.test(guildId))return reply(res,400,{error:'Invalid guild'});
   const guild=client.guilds.cache.get(guildId);if(!guild)return reply(res,404,{error:'Guild unavailable'});
   if(req.method==='POST'&&url.pathname==='/v1/test'){
    if(typeof body.text!=='string'||!body.text.trim()||body.text.length>1500)return reply(res,400,{error:'Invalid test'});
    if(!['member','owner'].includes(body.persona))return reply(res,400,{error:'Invalid persona'});
    const report=await runTest({guildId,channelId:'control-lab',userId:OWNER_ID,text:body.text,persona:body.persona,seed:17});return reply(res,200,{report});
   }
   if(req.method==='GET'&&url.pathname==='/v1/state'){const [learned,knowledge,unknown]=await Promise.all([repos.learning.getLearnedPhrases(guildId),repos.knowledge.getKnowledge(guildId),repos.learning.listUnknownPhrases(guildId,1)]);return reply(res,200,{learned,knowledge,unknown});}
   if(req.method!=='POST'||!['/v1/save','/v1/remove'].includes(url.pathname))return reply(res,404,{error:'Not found'});
   const record=body.record;if(!record||typeof record!=='object'||Array.isArray(record))return reply(res,400,{error:'Invalid record'});
   if(record.kind==='meaning'){
    const phrase=learningPhrase(record.name);if(!phrase||/^kitsune\b/u.test(phrase))return reply(res,400,{error:'Invalid phrase'});
    if(url.pathname==='/v1/remove')await repos.learning.forgetPhrase(guildId,phrase);
    else{
     if(!Object.hasOwn(learningConfig.intents,record.meaning))return reply(res,400,{error:'Invalid meaning'});
     if(recognize(record.name)||contextualCategory(record.name,null)||extractChoice(record.name))return reply(res,409,{error:'Built-in meaning protected'});
     await repos.learning.teachPhrase(guildId,phrase,record.meaning,OWNER_ID);
    }
   }else if(url.pathname==='/v1/remove'){
    const name=nameKey(record.name);if(!name)return reply(res,400,{error:'Invalid name'});await repos.knowledge.removeKnowledge(guildId,name);
   }else{
    const valid=validate(record);
    if(recognize(valid.key)||contextualCategory(valid.key,null)||extractChoice(valid.key))return reply(res,409,{error:'Built-in name protected'});
    if(['member','role','channel'].includes(valid.kind)){
     if(!/^\d{16,22}$/u.test(record.targetId??''))return reply(res,400,{error:'Invalid target'});
     if(valid.kind==='member'){const member=await guild.members.fetch(record.targetId).catch(()=>null);if(!member)return reply(res,400,{error:'Member unavailable'});}
     if(valid.kind==='role'){const role=await guild.roles.fetch(record.targetId).catch(()=>null);if(!role||role.guild.id!==guildId)return reply(res,400,{error:'Role unavailable'});}
     if(valid.kind==='channel'){const channel=await guild.channels.fetch(record.targetId).catch(()=>null);if(!channel||channel.guildId!==guildId)return reply(res,400,{error:'Channel unavailable'});}
    }
    await repos.knowledge.saveKnowledge(guildId,{name:valid.key,kind:valid.kind,explanation:valid.explanation,targetId:record.targetId},OWNER_ID);
   }
   invalidate(guildId);return reply(res,200,{ok:true});
  }catch{return reply(res,400,{error:'Request could not be completed'});}
 };
}
function startControlServer(client,env=process.env){
 if(env.KITSUNE_CONTROL_ENABLED!=='true')return null;
 const key=env.KITSUNE_CONTROL_KEY??'',port=Number(env.KITSUNE_CONTROL_PORT??8080);
 if(!/^[a-f0-9]{64}$/iu.test(key)||!Number.isSafeInteger(port)||port<1024||port>65535){console.error('Control API disabled: check key and port configuration.');return null;}
 const lab=require('../kitsune/testLab');
 const server=http.createServer(createHandler({client,key,repos:{learning:require('../../database/kitsuneLearning'),knowledge:require('../../database/kitsuneKnowledge')},runTest:input=>lab.formatReport(lab.runLab(input)),invalidate(guild){require('../kitsune/learningRuntime').invalidateAliases(guild);require('../kitsune/knowledgeRuntime').invalidate(guild);}}));
 server.requestTimeout=15_000;server.headersTimeout=10_000;server.keepAliveTimeout=3000;
 server.on('error',()=>console.error('Control API could not listen. Bot remains online.'));
 server.listen(port,'0.0.0.0',()=>console.log('Control API listening on configured port.'));
 return server;
}
module.exports={createHandler,startControlServer};
