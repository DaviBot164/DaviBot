'use strict';
const assert=require('node:assert/strict'),path=require('node:path'),Module=require('node:module');
const root=process.argv[2]||path.resolve(__dirname,'..');
const {recognize}=require(path.join(root,'handlers/kitsune/language'));
let count=0;const eq=(a,b,label)=>{assert.deepEqual(a,b,label);count++;};
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
async function main() {
 const config=require(path.join(root,'config/kitsuneLearning'));
 const {learningPhrase}=require(path.join(root,'handlers/kitsune/learningPhrases'));
 eq(learningPhrase('UR moonfox, RN!'),'your moonfox right now');
 for(const text of ['https://example.com','email@example.com','<@123456789012345678>','123456789','x'.repeat(161),'🦊','ქართული','a'])eq(learningPhrase(text),null,text);
 const phrases=new Map([['moonfox greeting','hi'],['moonfox listen','decline_advice'],['hello','reaction_insult'],['moonfox root','erase_database']]);
 session=null;eq(parse(msg('kitsune moonfox greeting'),100,phrases).category,'hi');
 eq(parse(msg('kitsune hello'),100,phrases).category,'hi');
 eq(parse(msg('moonfox greeting'),100,phrases),null);
 session={category:'day_tiring',messageId:'last',implicitUntil:200};
 eq(parse(msg('moonfox greeting'),100,phrases).category,'hi');
 eq(parse(msg('moonfox greeting',{messageId:'someone-else'}),100,phrases),null);
 eq(parse(msg('moonfox greeting'),201,phrases),null);
 assert.notEqual(parse(msg('kitsune moonfox root'),100,phrases).category,'erase_database');count++;
 const listen=parse(msg('moonfox listen'),100,phrases);eq(listen.category,'decline_advice');
 const listenOut=respond({guildId:'g',channelId:'c',author:{id:'member'}},listen);
 eq(context.memoryAfter(session,listen,listenOut).noAdviceRemaining,4);
 for(const [meaning,category]of Object.entries(config.intents)) {
  session={category:'day_tiring',messageId:'last',implicitUntil:200};
  const phrase='moonfox meaning '+meaning.replace(/_/g,' ');
  const req=parse(msg('kitsune '+phrase),100,new Map([[phrase,category]]));eq(req.category,category);
  for(const id of ['member',settings.OWNER_ID,settings.dialogue.maeId]) {
   const out=respond({guildId:'g',channelId:'c',author:{id}},req);assert.ok(out.payload.content?.length);count++;
  }
 }
 // Real SQL repository, simulated PostgreSQL client: no live database connection.
 const repoPath=path.join(root,'database/kitsuneLearning.js');
 const schemaPath=path.join(root,'database/kitsuneLearningSchema.js');
 const learned=new Map(),unknown=new Map(),queries=[];let releases=0,snapshot;
 const key=(g,p)=>g+'|'+p;
 const fakeClient={release(){releases++;},async query({text,values:v=[]}) {
  const sql=text.replace(/\s+/g,' ').trim();queries.push({sql,v});
  if(sql==='BEGIN'){snapshot={learned:new Map(learned),unknown:new Map([...unknown].map(([k,v])=>[k,{...v}]))};return{rows:[]};}
  if(sql==='ROLLBACK'){learned.clear();unknown.clear();for(const x of snapshot.learned)learned.set(...x);for(const x of snapshot.unknown)unknown.set(...x);return{rows:[]};}
  if(sql==='COMMIT'||sql.startsWith('SELECT pg_advisory'))return{rows:[]};
  const table=sql.includes('kitsune_learned_phrases')?learned:unknown;
  if(sql.startsWith('SELECT COUNT'))return{rows:[{count:[...table.values()].filter(r=>r.guild_id===v[0]).length}]};
  if(sql.startsWith('DELETE')&&sql.includes('expires_at')) {
   for(const [k,r]of unknown)if(r.guild_id===v[0]&&r.expired)unknown.delete(k);return{rows:[]};
  }
  if(sql.startsWith('DELETE')){const existed=table.delete(key(v[0],v[1]));return{rows:existed?[{phrase:v[1]}]:[]};}
  if(sql.startsWith('UPDATE')){const r=table.get(key(v[0],v[1]));if(r)r.seen_count++;return{rows:r?[r]:[]};}
  if(sql.startsWith('INSERT')) {
   const row=table===learned?{guild_id:v[0],phrase:v[1],intent:v[2],taught_by:v[3]}:{guild_id:v[0],phrase:v[1],seen_count:1};
   table.set(key(v[0],v[1]),row);return{rows:[]};
  }
  let rows=[...table.values()].filter(r=>r.guild_id===v[0]);
  if(sql.includes('phrase=$2'))rows=rows.filter(r=>r.phrase===v[1]);
  if(sql.includes('OFFSET'))rows=rows.slice(v[1],v[1]+10);
  return{rows};
 }};
 const baseLoad=Module._load;
 let repo;
 Module._load=function(request,parent){if(parent?.filename===repoPath&&request==='./connection')return{pool:{connect:async()=>fakeClient}};return baseLoad.apply(this,arguments);};
 try{repo=require(repoPath);}finally{Module._load=baseLoad;}
 await repo.teachPhrase('g','moonfox greeting','hello','owner');
 eq((await repo.getLearnedPhrases('g'))[0].intent,'hello');eq((await repo.getLearnedPhrases('other')).length,0);
 assert.ok(queries.some(q=>q.sql.startsWith('SELECT pg_advisory_xact_lock')));count++;
 const transaction=queries.slice(0,queries.findIndex(q=>q.sql==='COMMIT')+1);eq(transaction[0].sql,'BEGIN');assert.ok(transaction[1].sql.startsWith('SELECT pg_advisory'));count++;
 await repo.recordUnknownPhrase('g','moonfox unrecognized');await repo.recordUnknownPhrase('g','moonfox unrecognized');
 eq((await repo.listUnknownPhrases('g'))[0].seen_count,2);
 await repo.teachPhrase('g','moonfox unrecognized','chat','owner');eq((await repo.listUnknownPhrases('g')).length,0);
 await repo.recordUnknownPhrase('g','moonfox unrecognized');eq((await repo.listUnknownPhrases('g')).length,0);
 const payload="value'); DROP TABLE x; --";await repo.recordUnknownPhrase('safe',payload);
 assert.ok(queries.some(q=>q.v.includes(payload)&&!q.sql.includes(payload)));count++;
 eq(await repo.forgetPhrase('g','moonfox greeting'),true);eq(await repo.forgetPhrase('other','moonfox unrecognized'),false);
 eq(await repo.dismissUnknownPhrase('safe',payload),true);
 for(let i=0;i<config.maxAliasesPerGuild;i++)learned.set(key('full','phrase '+i),{guild_id:'full',phrase:'phrase '+i,intent:'hello'});
 await assert.rejects(repo.teachPhrase('full','one more phrase','hello','owner'),/limit reached/);count++;
 eq(queries.at(-1).sql,'ROLLBACK');
 for(let i=0;i<config.maxUnknownPerGuild;i++)unknown.set(key('full','phrase '+i),{guild_id:'full',phrase:'phrase '+i,seen_count:1});
 eq(await repo.recordUnknownPhrase('full','one more unknown'),false);
 unknown.get(key('full','phrase 0')).expired=true;eq(await repo.recordUnknownPhrase('full','one more unknown'),true);
 assert.ok(releases>10);count++;
 let ddl='';Module._load=function(request,parent){if(parent?.filename===schemaPath&&request==='./connection')return{query:async sql=>{ddl=sql;}};return baseLoad.apply(this,arguments);};
 try{await require(schemaPath).initializeKitsuneLearningSchema();}finally{Module._load=baseLoad;}
 assert.ok(ddl.includes('PRIMARY KEY (guild_id, phrase)')&&ddl.includes('expires_at')&&!ddl.includes('message_id'));count++;
 // Runtime caching, opt-in source scope, rate limiting and database fail-open.
 const runtimePath=path.join(root,'handlers/kitsune/learningRuntime.js');
 const previousEnv=process.env.NF_DAVIBOT_DATABASE_POSTGRES_URI;
 process.env.NF_DAVIBOT_DATABASE_POSTGRES_URI='mock-only';
 let reads=0,writes=0,broken=false;
 const runtimeRepo={getLearnedPhrases:async()=>{reads++;if(broken)throw{code:'OFFLINE'};return[{phrase:'moonfox greeting',intent:'hello'},{phrase:'bad intent',intent:'system_admin'}];},recordUnknownPhrase:async()=>{writes++;}};
 Module._load=function(request,parent){if(parent?.filename===runtimePath&&request==='../../database/kitsuneLearning')return runtimeRepo;return baseLoad.apply(this,arguments);};
 let runtime;
 try {
  runtime=require(runtimePath);
  const [a,b]=await Promise.all([runtime.getAliases('g'),runtime.getAliases('g')]);eq(a.get('moonfox greeting'),'hi');eq(b.get('bad intent'),undefined);eq(reads,1);
  await runtime.getAliases('g');eq(reads,1);runtime.invalidateAliases('g');await runtime.getAliases('g');eq(reads,2);
  const m={guildId:'g',author:{id:'u'},content:'moonfox unknown',client:{user:{id:'bot'}}};
  eq(runtime.inputForLearning(m,null,100),null);
  const input=runtime.inputForLearning({...m,content:'kitsune moonfox unknown'},null,100);eq(input.collect,true);
  eq(runtime.inputForLearning(m,{messageId:'last',implicitUntil:200},100).collect,false);
  eq(runtime.inputForLearning({...m,reference:{messageId:'other'}},{messageId:'last',implicitUntil:200},100),null);
  await runtime.collectUnknown(m,input);await runtime.collectUnknown(m,input);eq(writes,1);
  broken=true;const warn=console.warn;console.warn=()=>{};
  try{eq((await runtime.getAliases('broken')).size,0);const n=reads;await runtime.getAliases('broken');eq(reads,n);}finally{console.warn=warn;}
 } finally {Module._load=baseLoad;if(previousEnv===undefined)delete process.env.NF_DAVIBOT_DATABASE_POSTGRES_URI;else process.env.NF_DAVIBOT_DATABASE_POSTGRES_URI=previousEnv;}
 // Command registration and real owner authorization, with service calls mocked.
 class Builder {
  constructor(){this.json={options:[]};}
  setName(v){this.json.name=v;return this;}setDescription(v){this.json.description=v;return this;}
  setDefaultMemberPermissions(v){this.json.default_member_permissions=String(v);return this;}setDMPermission(v){this.json.dm_permission=v;return this;}
  setRequired(v){this.json.required=v;return this;}setMinLength(){return this;}setMaxLength(){return this;}setAutocomplete(){return this;}setMinValue(){return this;}setMaxValue(){return this;}
  addChoices(...v){this.json.choices=v;return this;}
  addSubcommand(fn){const b=new Builder();fn(b);this.json.options.push(b.json);return this;}
  addStringOption(fn){return this.addSubcommand(fn);}addIntegerOption(fn){return this.addSubcommand(fn);}addUserOption(fn){return this.addSubcommand(fn);}addRoleOption(fn){return this.addSubcommand(fn);}addChannelOption(fn){return this.addSubcommand(fn);}toJSON(){return this.json;}
 }
 const commandPath=path.join(root,'commands/information/kitsune.js');let taught=0,forgot=0,invalidated=0;
 const commandRepo={teachPhrase:async()=>{taught++;},forgetPhrase:async()=>{forgot++;return true;},listUnknownPhrases:async()=>[{phrase:'moonfox greeting',seen_count:2}],listLearnedPhrases:async()=>[],dismissUnknownPhrase:async()=>true};
 Module._load=function(request,parent){
  if(parent?.filename===commandPath){
   if(request==='discord.js')return{SlashCommandBuilder:Builder,PermissionFlagsBits:{Administrator:8n},MessageFlags:{Ephemeral:64},escapeMarkdown:x=>x};
   if(request==='../../handlers/kitsune/settings')return{OWNER_ID:'owner'};
   if(request==='../../handlers/kitsune/learningRuntime')return{enabled:()=>true,invalidateAliases:()=>{invalidated++;}};
   if(request==='../../database/kitsuneLearning')return commandRepo;
  }
  return baseLoad.apply(this,arguments);
 };
 let command;try{command=require(commandPath);}finally{Module._load=baseLoad;}
 const json=command.data.toJSON();eq(json.name,'kitsune');eq(json.options.length,11);assert.ok(json.options.find(x=>x.name==='teach').options[1].choices.length<=25);count++;
 const interaction=(id,sub,phrase='moonfox greeting',meaning='hello')=>{
  const replies=[];return{user:{id},guildId:'g',options:{getSubcommand:()=>sub,getInteger:()=>1,getString:name=>name==='meaning'?meaning:phrase},
   reply:async p=>{replies.push(p);},deferReply:async()=>{},editReply:async p=>{replies.push(p);},replies};
 };
 const stranger=interaction('someone','teach');await command.execute(stranger);eq(taught,0);eq(stranger.replies[0].flags,64);
 const owner=interaction('owner','teach');await command.execute(owner);eq(taught,1);eq(invalidated,1);
 const builtin=interaction('owner','teach','you are stupid');await command.execute(builtin);eq(taught,1);assert.ok(/built-in/.test(builtin.replies[0].content));count++;
 const untrusted=interaction('owner','teach','moonfox greeting','admin');await command.execute(untrusted);eq(taught,1);
 await command.execute(interaction('owner','forget'));eq(forgot,1);eq(invalidated,2);
 const list=interaction('owner','unknown');await command.execute(list);assert.ok(list.replies[0].content.includes('moonfox greeting'));count++;eq(list.replies[0].allowedMentions.parse,[]);
 // Startup wires learning schema after the existing schemas, without opening a real pool.
 const dbIndex=path.join(root,'database/index.js'),startup=[];
 Module._load=function(request,parent){
  if(parent?.filename===dbIndex) {
   if(request==='./connection')return{testConnection:async()=>startup.push('connection'),closeConnection:async()=>{}};
   const names={'./migrateKitsuneStorage':'migrateKitsuneStorage','./schema':'initializeSchema','./playerSchema':'initializePlayerSchema','./trainingPanels':'initializeTrainingPanels','./questSchema':'initializeQuestSchema','./matchSchema':'initializeMatchSchema','./kitsuneLearningSchema':'initializeKitsuneLearningSchema'};
   if(names[request])return{[names[request]]:async()=>startup.push(names[request])};
  }
  return baseLoad.apply(this,arguments);
 };
 try{await require(dbIndex).initializeDatabase();}finally{Module._load=baseLoad;}
 eq(startup.at(-1),'initializeKitsuneLearningSchema');eq(startup.length,8);eq(startup[1],'migrateKitsuneStorage');
 // Full send path still uses the normal parser, response renderer and successful-send commit.
 const mainPath=path.join(root,'handlers/kitsuneReplyHandler.js');let lookups=0,collected=0;
 const hook={enabled:()=>true,inputForLearning:runtime.inputForLearning,getAliases:async()=>{lookups++;return new Map([['moonfox greeting','hi']]);},collectUnknown:async()=>{collected++;}};
 Module._load=function(request,parent){
  if(parent?.filename===mainPath) {
   if(request==='discord.js')return{PermissionFlagsBits:{ViewChannel:1,ReadMessageHistory:2,SendMessages:4,SendMessagesInThreads:8,EmbedLinks:16}};
   if(request==='./kitsune/settings')return{...settings,USER_COOLDOWN:3000,CHANNEL_COOLDOWN:2000,SESSION_TTL:120000};
   if(request==='./kitsune/learningRuntime')return hook;
   if(request==='./kitsune/knowledgeRuntime')return{findKnowledge:async()=>null};
   if(request==='./kitsune/help')return{plainHelp:()=> 'Help'};
  }
  return baseLoad.apply(this,arguments);
 };
 let handler;try{handler=require(mainPath).handleKitsuneReply;}finally{Module._load=baseLoad;}
 const store=require(statePath);
 const sent=[];
 const incoming=(text,id)=>({guildId:'send-guild',guild:{id:'send-guild',members:{me:{id:'bot'}}},channelId:'send-'+id,
  author:{id:'sender-'+id,bot:false},content:text,client:{user:{id:'bot'}},inGuild:()=>true,
  channel:{isThread:()=>false,permissionsFor:()=>({has:()=>true})},reply:async payload=>{sent.push(payload);return{id:'response-'+id};}});
 session=null;eq(await handler(incoming('kitsune hi','known')),true);eq(lookups,0);
 eq(await handler(incoming('kitsune moonfox greeting','learned')),true);eq(lookups,1);eq(collected,0);
 eq(await handler(incoming('kitsune another unfamiliar moonfox phrase','unknown')),true);eq(collected,1);
 eq(sent.at(-1).allowedMentions,{parse:[],repliedUser:false});
 const failed=incoming('kitsune another unfamiliar moonfox phrase','failed');failed.reply=async()=>{throw new Error('mock send failed');};
 const errorLog=console.error;console.error=()=>{};
 try{eq(await handler(failed),false);}finally{console.error=errorLog;}
 eq(collected,1);eq(store.sessions.has(store.sessionKey(failed)),false);
 console.log(`${count} approved learning, SQL transaction, cache, quota, authorization and parser checks passed. No real database or Discord calls.`);
}
main().catch(error=>{console.error(error);process.exitCode=1;});
