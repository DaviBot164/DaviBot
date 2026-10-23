'use strict';
const assert=require('node:assert/strict'),path=require('node:path'),Module=require('node:module');
const root=process.argv[2]||path.resolve(__dirname,'..');
const {recognize}=require(path.join(root,'handlers/kitsune/language'));
let count=0;const eq=(a,b,label)=>{assert.deepEqual(a,b,label);count++;};
const cases=[];
for(const phrase of ['just listen','please listen to me','let me vent','hear me out','i just need to vent','can i vent','i need to get this off my chest','not looking for solutions','im not looking for solutions','i dont want advice just listen','just listen i dont need tips','i dont want suggestions but hear me out'])cases.push([phrase,'decline_advice']);
for(const [text,want]of cases)eq(recognize(text),want,text);
for(const phrase of ['my friend needs to vent','do not listen to me','i need advice','i am looking for solutions','listen to music'])assert.notEqual(recognize(phrase),'decline_advice');
const original=Module._load;let session;
const parserPath=path.join(root,'handlers/kitsune/parser.js'),responsePath=path.join(root,'handlers/kitsune/responses.js'),statePath=path.join(root,'handlers/kitsune/state.js');
const pools={};
Object.assign(pools,require(path.join(root,'config/kitsuneReplies')));
for(const [category,pool] of Object.entries(require(path.join(root,'config/kitsunePersonality')).ownerReplies)) pools['owner_'+category]=pool;
for(const [category,pool] of Object.entries(require(path.join(root,'config/kitsuneDialogue')).pools)) pools['dialogue_'+category]=pool;
const settings={OWNER_ID:'1357721282061533311',dialogue:{maeId:'1380278195961729084'},replies:pools,STATE_TTL:1800000};
Module._load=function(request,parent){
 if([parserPath,responsePath,statePath].includes(parent?.filename)&&request==='./settings')return settings;
 if(parent?.filename===parserPath&&request==='./state')return{getSession:()=>session};
 if(parent?.filename===responsePath&&request==='discord.js')return{escapeMarkdown:x=>x};
 if(parent?.filename===responsePath&&request==='./help')return{buildHelp:()=>({})};
 return original.apply(this,arguments);
};
let parse,respond,context;
try{parse=require(parserPath).parseRequest;respond=require(responsePath).buildResponse;context=require(path.join(root,'handlers/kitsune/context'));}finally{Module._load=original;}
const msg=(content,reference)=>({content,reference,mentions:{}});

const fs=require('node:fs'),vm=require('node:vm');
async function main(){
 session=null;
 eq(parse(msg('kitsune hi'),100).category,'hi');
 eq(parse(msg('KITSUNE hi'),100).category,'hi');
 eq(parse(msg('akane hi'),100),null);eq(parse(msg('Akane hi'),100),null);
 eq(require(path.join(root,'config/brand')).name,'Kitsune');
 eq(require(path.join(root,'config/brand')).footer,'Blood Moon • Kitsune');
 const files=[];function walk(dir){for(const e of fs.readdirSync(dir,{withFileTypes:true})){if(e.name==='node_modules'||e.name==='.git')continue;const p=path.join(dir,e.name);if(e.isDirectory())walk(p);else if(/\.(?:js|cjs|json|sql)$/u.test(e.name))files.push(p);}}walk(root);
 const allowed=new Set([path.join(root,'database/migrateKitsuneStorage.js'),path.join(root,'scripts/test-kitsune-storage-engine.cjs'),__filename]);
 for(const file of files){if(allowed.has(file))continue;assert.ok(!/akane|აკანე/iu.test(fs.readFileSync(file,'utf8')),file);count++;}
 let moduleChecks=0;
 for(const file of files.filter(x=>/\.(?:js|cjs)$/u.test(x))){
  const source=fs.readFileSync(file,'utf8');
  for(const match of source.matchAll(/require\(['"](\.[^'"]+)['"]\)/gu)){
   const target=path.resolve(path.dirname(file),match[1]);
   assert.ok([target,target+'.js',target+'.json',path.join(target,'index.js')].some(p=>fs.existsSync(p)),file+': '+match[1]);moduleChecks++;
  }
 }
 count+=moduleChecks;
 // Real migration function against a transactional PostgreSQL protocol simulation.
 const migrationPath=path.join(root,'database/migrateKitsuneStorage.js');
 let relations=new Map(),constraints=[],snapshot,calls=[],failure=null,releases=0;
 function seed(){
  relations=new Map([
   ['akane_users',{kind:'r',rows:[{guild_id:'g',user_id:'u',level:42,xp:777}]}],
   ['akane_learned_phrases',{kind:'r',rows:[{phrase:'moonfox greeting',intent:'hello'}]}],
   ['akane_unknown_phrases',{kind:'r',rows:[{phrase:'unfamiliar phrase'}]}],
   ['akane_users_pkey',{kind:'i',parent:'akane_users'}],
   ['idx_akane_users_custom',{kind:'i',parent:'akane_users'}],
   ['akane_users_id_seq',{kind:'S',parent:'akane_users',next:88}],
   ['other_data',{kind:'r',rows:[{keep:true}]}],
   ['akane_unrelated_index',{kind:'i',parent:'other_data'}]
  ]);
  constraints=[{name:'akane_users_pkey',table_name:'akane_users',type:'p'},{name:'akane_users_level_check',table_name:'akane_users',type:'c'}];
  calls=[];failure=null;
 }
 seed();
 const clone=x=>JSON.parse(JSON.stringify(x));
 const restore=()=>{relations=new Map(snapshot.relations);constraints=clone(snapshot.constraints);};
 const client={release(){releases++;},async query(text,values=[]){
  calls.push({text,values});
  if(text==='BEGIN'){snapshot={relations:clone([...relations]),constraints:clone(constraints)};return{rows:[]};}
  if(text==='ROLLBACK'){restore();return{rows:[]};}
  if(text==='COMMIT'||text.startsWith('SET LOCAL')||text.startsWith('SELECT pg_advisory'))return{rows:[]};
  if(text==='SELECT current_schema() AS name')return{rows:[{name:'public'}]};
  if(text.startsWith('SELECT to_regclass')){const names=[...values[0].matchAll(/"((?:[^"]|"")*)"/gu)].map(m=>m[1].replace(/""/g,'"'));return{rows:[{object:relations.has(names[1])?names[1]:null}]};}
  if(text.includes('FROM pg_constraint'))return{rows:constraints.filter(x=>x.table_name.startsWith('kitsune_')&&x.name.includes('akane')).map(x=>({...x}))};
  if(text.includes('JOIN pg_index'))return{rows:[...relations].filter(([n,x])=>x.kind==='i'&&x.parent.startsWith('kitsune_')&&n.includes('akane')).map(([name])=>({name}))};
  if(text.includes('JOIN pg_depend'))return{rows:[...relations].filter(([n,x])=>x.kind==='S'&&x.parent.startsWith('kitsune_')&&n.includes('akane')).map(([name])=>({name}))};
  if(text.includes("c.relkind IN ('r','p')"))return{rows:[...relations].filter(([n,x])=>['r','p'].includes(x.kind)&&n.startsWith('akane_')).map(([name])=>({name}))};
  if(text.startsWith('ALTER ')){
   if(failure&&text.includes(failure))throw new Error('simulated rename failure');
   const names=[...text.matchAll(/"((?:[^"]|"")*)"/gu)].map(m=>m[1].replace(/""/g,'"'));
   if(text.includes('RENAME CONSTRAINT')){
    const [schema,table,oldName,newName]=names;
    const row=constraints.find(x=>x.table_name===table&&x.name===oldName);assert.ok(row);count++;
    row.name=newName;
    if(row.type==='p'){const value=relations.get(oldName);relations.delete(oldName);relations.set(newName,value);}
   }else{
    const [schema,oldName,newName]=names;assert.ok(relations.has(oldName));count++;
    const row=relations.get(oldName);relations.delete(oldName);relations.set(newName,row);
    if(row.kind==='r'){for(const value of relations.values())if(value.parent===oldName)value.parent=newName;for(const c of constraints)if(c.table_name===oldName)c.table_name=newName;}
   }
   return{rows:[]};
  }
  throw Error('Unexpected SQL: '+text);
 }};
 const loader=Module._load;
 Module._load=function(request,parent){if(parent?.filename===migrationPath&&request==='./connection')return{pool:{connect:async()=>client}};return loader.apply(this,arguments);};
 let migrate;try{migrate=require(migrationPath).migrateKitsuneStorage;}finally{Module._load=loader;}
 const expectedRows=clone(relations.get('akane_users').rows);
 const stats=await migrate();
 eq(stats,{tables:3,constraints:2,indexes:1,sequences:1});
 eq(relations.get('kitsune_users').rows,expectedRows);
 eq(relations.get('kitsune_learned_phrases').rows[0].intent,'hello');
 eq(relations.get('kitsune_unknown_phrases').rows[0].phrase,'unfamiliar phrase');
 eq(relations.get('kitsune_users_id_seq').next,88);
 eq(relations.get('other_data').rows,[{keep:true}]);eq(relations.has('akane_unrelated_index'),true);
 assert.ok(constraints.every(x=>x.name.startsWith('kitsune_')));count++;
 assert.ok(!calls.some(x=>/\b(?:DROP|DELETE|TRUNCATE|UPDATE|INSERT)\b/u.test(x.text)));count++;
 eq(calls.at(-1).text,'COMMIT');eq(releases,1);
 eq(await migrate(),{tables:0,constraints:0,indexes:0,sequences:0});
 seed();relations.set('kitsune_users',{kind:'r',rows:[{existing:true}]});
 await assert.rejects(migrate(),/conflict/);count++;eq(calls.at(-1).text,'ROLLBACK');eq(calls.some(x=>x.text.startsWith('ALTER')),false);
 eq(relations.get('akane_users').rows,expectedRows);eq(relations.get('kitsune_users').rows,[{existing:true}]);
 seed();failure='RENAME CONSTRAINT';
 await assert.rejects(migrate(),/simulated/);count++;eq(calls.at(-1).text,'ROLLBACK');eq(relations.get('akane_users').rows,expectedRows);eq(relations.has('kitsune_users'),false);
 seed();relations.set('idx_kitsune_users_custom',{kind:'i',parent:'other_data'});
 await assert.rejects(migrate(),/index rename conflict/);count++;eq(relations.has('akane_users'),true);eq(relations.has('kitsune_users'),false);
 // The gateway asks Discord to use the configured name; the installer never logs in.
 let nameCalls=0;
 const user={username:'Previous',tag:'Previous#1',setUsername:async name=>{eq(name,'Kitsune');nameCalls++;user.username=name;}};
 let ready;
 vm.runInNewContext(fs.readFileSync(path.join(root,'events/ready.js'),'utf8'),{
  require:name=>name==='discord.js'?{Events:{ClientReady:'ready'}}:name==='../config/brand'?{name:'Kitsune',server:'Blood Moon'}:{startMatchExpiryScheduler(){}},
  module:{set exports(value){ready=value;}},console:{log(){},error(){}},process:{env:{}}
 });
 ready.execute({user,commands:new Map()});await Promise.resolve();ready.execute({user,commands:new Map()});eq(nameCalls,1);
 console.log(count+' full rename, module-resolution, prefix, storage rollback and identity checks passed. No live database or Discord calls.');
}
main().catch(error=>{console.error(error);process.exitCode=1;});
