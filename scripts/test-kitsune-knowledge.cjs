'use strict';
const assert=require('node:assert/strict'),path=require('node:path'),Module=require('node:module');
const root=process.argv[2]||path.resolve(__dirname,'..');
const model=require(path.join(root,'handlers/kitsune/knowledge'));
let checks=0;const eq=(a,b)=>{assert.deepEqual(a,b);checks++;};
eq(model.lookupKey('who is Tomy?'),'tomy');eq(model.lookupKey('what does moonbound mean?'),'moonbound');eq(model.nameKey('ტომი'),'ტომი');eq(model.nameKey('/daily'),'daily');
for(const name of ['davi','daviti','mae','ash','kitsune','https://example.com','<@123456789012345678>']){assert.throws(()=>model.validate({name,kind:'member'}));checks++;}
for(const explanation of ['TOKEN=secret','gsk_abcdefghijklmnop','<@123456789012345678>','`execute`','https://private.example/key','x'.repeat(501)]){assert.throws(()=>model.validate({name:'moon term',kind:'term',explanation}));checks++;}
for(const kind of Object.keys(model.kinds)){const v=model.validate({name:'moon term',kind,explanation:'A human explanation.'});eq(v.kind,kind);assert.ok(model.render({name:'moon term',kind,explanation:v.explanation}).length);checks++;}
eq(model.render({name:'tomy',kind:'member',explanation:'',target_id:'123456789012345678'}),'tomy — <@123456789012345678>.');
eq(model.render({name:'tomy',kind:'member',explanation:'A friend.',target_id:'123456789012345678'}),'tomy — <@123456789012345678>. A friend.');
eq(model.render({name:'moon term',kind:'term',explanation:'A term.'}),'moon term: A term.');
eq(model.render({name:'training',kind:'channel',target_id:'123456789012345678',explanation:''}),'training — <#123456789012345678>.');
// Real repository functions, an isolated transactional protocol stub; no pg or credentials.
const repoPath=path.join(root,'database/kitsuneKnowledge.js'),oldLoad=Module._load;
const records=new Map(),unknown=new Set(['g|tomy']),queries=[];let snapshot,releases=0,fail=false;
const key=(g,n)=>g+'|'+n;
const client={release(){releases++;},async query({text,values:v=[]}){const sql=text.replace(/\s+/g,' ').trim();queries.push({sql,v});
 if(sql==='BEGIN'){snapshot={records:new Map(records),unknown:new Set(unknown)};return{rows:[]};}
 if(sql==='ROLLBACK'){records.clear();for(const x of snapshot.records)records.set(...x);unknown.clear();for(const x of snapshot.unknown)unknown.add(x);return{rows:[]};}
 if(sql==='COMMIT'||sql.startsWith('SELECT pg_advisory'))return{rows:[]};
 if(sql.startsWith('SELECT COUNT'))return{rows:[{count:[...records.keys()].filter(k=>k.startsWith(v[0]+'|')).length}]};
 if(sql.startsWith('SELECT name FROM'))return{rows:records.has(key(...v))?[{name:v[1]}]:[]};
 if(sql.startsWith('INSERT INTO')){if(fail)throw Error('write failed');records.set(key(v[0],v[1]),{name:v[1],kind:v[2],explanation:v[3],target_id:v[4]});return{rows:[]};}
 if(sql.startsWith('DELETE FROM kitsune_unknown')){unknown.delete(key(...v));return{rows:[]};}
 if(sql.startsWith('DELETE FROM kitsune_knowledge'))return{rows:records.delete(key(...v))?[{name:v[1]}]:[]};
 if(sql.startsWith('SELECT name,kind'))return{rows:[...records].filter(([k])=>k.startsWith(v[0]+'|')).map(([,r])=>r).slice(sql.includes('OFFSET')?v[1]:0,sql.includes('OFFSET')?v[1]+10:300)};
 throw Error('Unexpected query '+sql);
}};
Module._load=function(request,parent){if(parent?.filename===repoPath&&request==='./connection')return{pool:{connect:async()=>client}};return oldLoad.apply(this,arguments);};
let repo;try{repo=require(repoPath);}finally{Module._load=oldLoad;}
async function main(){
 await repo.saveKnowledge('g',{name:'tomy',kind:'member',targetId:'123456789012345678'},'owner');eq(unknown.has('g|tomy'),false);eq((await repo.getKnowledge('g'))[0].target_id,'123456789012345678');eq(await repo.getKnowledge('other'),[]);
 await repo.saveKnowledge('g',{name:'tomy',kind:'member',targetId:'222222222222222222',explanation:'Updated.'},'owner');eq(records.size,1);eq((await repo.listKnowledge('g'))[0].explanation,'Updated.');
 fail=true;await assert.rejects(()=>repo.saveKnowledge('g',{name:'moon term',kind:'term',explanation:'A term.'},'owner'));checks++;eq(records.size,1);eq(queries.at(-1).sql,'ROLLBACK');fail=false;
 await assert.rejects(()=>repo.saveKnowledge('g',{name:'tomy',kind:'member'},'owner'));checks++;
 for(let i=records.size;i<300;i++)records.set('g|entry '+i,{name:'entry '+i,kind:'term',explanation:'x'});
 await assert.rejects(()=>repo.saveKnowledge('g',{name:'full limit',kind:'term',explanation:'x'},'owner'),/limit reached/);checks++;
 await repo.saveKnowledge('g',{name:'tomy',kind:'member',targetId:'123456789012345678'},'owner');eq(records.size,300);
 eq(await repo.removeKnowledge('other','tomy'),false);eq(await repo.removeKnowledge('g','tomy'),true);eq(await repo.removeKnowledge('g','tomy'),false);assert.ok(releases>0);checks++;
 // Runtime cache: no external DB, TTL, invalidation, server scope and raw lookup.
 const runtimePath=path.join(root,'handlers/kitsune/knowledgeRuntime.js'),envBefore=process.env.NF_DAVIBOT_DATABASE_POSTGRES_URI;let reads=0;
 process.env.NF_DAVIBOT_DATABASE_POSTGRES_URI='mock-only';
 Module._load=function(request,parent){if(parent?.filename===runtimePath&&request==='../../database/kitsuneKnowledge')return{getKnowledge:async guild=>{reads++;return guild==='g'?[{name:'tomy',kind:'member',target_id:'123456789012345678',explanation:''}]:[];}};return oldLoad.apply(this,arguments);};
 try{const runtime=require(runtimePath);eq(runtime.inputForKnowledge({content:'kitsune who is ტომი?'},null,100),'who is ტომი?');eq(runtime.inputForKnowledge({content:'ტომი'},null,100),null);eq((await runtime.findKnowledge('g','who is tomy?')).kind,'member');await runtime.findKnowledge('g','tomy');eq(reads,1);eq(await runtime.findKnowledge('other','tomy'),null);runtime.invalidate('g');await runtime.findKnowledge('g','tomy');eq(reads,3);}finally{Module._load=oldLoad;if(envBefore===undefined)delete process.env.NF_DAVIBOT_DATABASE_POSTGRES_URI;else process.env.NF_DAVIBOT_DATABASE_POSTGRES_URI=envBefore;}
 // Real knowledge command helper: selected server objects, update/list/delete and mention-safe output.
 const commandPath=path.join(root,'handlers/kitsune/knowledgeCommand.js');let savedInput=null,listedGuild=null;
 const fakeRepo={async saveKnowledge(g,input,owner){eq(g,'g');eq(owner,'owner');savedInput=input;return model.validate(input);},async listKnowledge(g){listedGuild=g;return Array.from({length:10},()=>({name:'x'.repeat(80),kind:'fact',explanation:'y'.repeat(500)}));},async removeKnowledge(g,name){eq(g,'g');eq(name,'tomy');return true;}};
 Module._load=function(request,parent){if(parent?.filename===commandPath&&request==='../../database/kitsuneKnowledge')return fakeRepo;return oldLoad.apply(this,arguments);};
 try{
  const command=require(commandPath);
  const interaction=(sub='remember',kind='member',name='tomy',memberPresent=true)=>({guildId:'g',user:{id:'owner'},guild:{members:{fetch:async()=>memberPresent?{id:'123456789012345678'}:Promise.reject(Error('not in guild'))}},options:{getSubcommand:()=>sub,getInteger:()=>1,getString:k=>k==='name'?name:k==='kind'?kind:'A saved explanation.',getUser:()=>({id:'123456789012345678'}),getRole:()=>({id:'123456789012345678',guild:{id:'other'}}),getChannel:()=>({id:'123456789012345678',guildId:'other'})}});
  let reply='';const respond=async text=>{reply=text;};
  await command.execute(interaction(),respond);eq(savedInput.targetId,'123456789012345678');assert.match(reply,/Saved: tomy/);checks++;
  savedInput=null;await command.execute(interaction('remember','member','other friend',false),respond);eq(savedInput,null);assert.match(reply,/could not be verified/);checks++;
  for(const kind of ['role','channel']){await command.execute(interaction('remember',kind,'moon '+kind),respond);eq(savedInput,null);assert.match(reply,/from this server/);checks++;}
  await command.execute(interaction('remember','term','moon term'),respond);eq(savedInput.kind,'term');
  await command.execute(interaction('knowledge'),respond);eq(listedGuild,'g');assert.ok(reply.length<1900);checks++;
  await command.execute(interaction('unremember'),respond);assert.match(reply,/removed/i);checks++;
 }finally{Module._load=oldLoad;}
 console.log(checks+' server knowledge validation, rendering, transaction rollback/capacity, scope, update/delete and cache checks passed. No database, Discord or AI calls.');
}
main().catch(e=>{console.error(e);process.exitCode=1;});
