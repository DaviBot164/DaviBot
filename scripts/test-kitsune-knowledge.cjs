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
 console.log(checks+' knowledge validation, rendering, guild isolation, transaction rollback, capacity and approved member-link checks passed. Database mocked.');
}
main().catch(error=>{console.error(error);process.exitCode=1;});
