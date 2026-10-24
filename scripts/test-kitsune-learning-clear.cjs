'use strict';
const assert=require('node:assert/strict'),path=require('node:path'),Module=require('node:module');
const root=process.argv[2]||path.resolve(__dirname,'..'),original=Module._load;
let count=0;const eq=(a,b)=>{assert.deepEqual(a,b);count++;};
async function main(){
 const repoPath=path.join(root,'database/kitsuneLearning.js');
 const pending=new Map([['g',['one','two','three']],['other',['keep me']]]),learned=new Map([['g',['learned one']]]);
 const calls=[];let releases=0,snapshot,fail=false;
 const client={release(){releases++;},async query({text,values=[]}){
  const sql=text.replace(/\s+/g,' ').trim();calls.push({sql,values});
  if(sql==='BEGIN'){snapshot=new Map([...pending].map(([g,v])=>[g,[...v]]));return{rows:[]};}
  if(sql==='ROLLBACK'){pending.clear();for(const entry of snapshot)pending.set(...entry);return{rows:[]};}
  if(sql==='COMMIT'||sql.startsWith('SELECT pg_advisory'))return{rows:[]};
  eq(sql,'DELETE FROM kitsune_unknown_phrases WHERE guild_id=$1');
  if(fail)throw new Error('simulated delete failure');
  const rows=pending.get(values[0])??[];pending.delete(values[0]);return{rowCount:rows.length,rows:[]};
 }};
 Module._load=function(request,parent){if(parent?.filename===repoPath&&request==='./connection')return{pool:{connect:async()=>client}};return original.apply(this,arguments);};
 let repo;try{repo=require(repoPath);}finally{Module._load=original;}
 eq(await repo.clearUnknownPhrases('g'),3);eq(pending.has('g'),false);eq(pending.get('other'),['keep me']);eq(learned.get('g'),['learned one']);
 eq(calls[0].sql,'BEGIN');assert.ok(calls[1].sql.startsWith('SELECT pg_advisory_xact_lock'));count++;
 eq(calls[1].values,['kitsune-learning:g']);eq(calls[2].values,['g']);eq(calls.at(-1).sql,'COMMIT');eq(releases,1);
 eq(await repo.clearUnknownPhrases('g'),0);
 const hostile="g'; DELETE FROM kitsune_learned_phrases; --";
 eq(await repo.clearUnknownPhrases(hostile),0);eq(calls.at(-2).values,[hostile]);assert.ok(!calls.at(-2).sql.includes(hostile));count++;
 pending.set('g',['survive']);fail=true;
 await assert.rejects(repo.clearUnknownPhrases('g'),/simulated/);count++;
 eq(calls.at(-1).sql,'ROLLBACK');eq(pending.get('g'),['survive']);eq(releases,4);fail=false;
 // Only the existing owner ID can invoke the command, even if another user is an admin.
 class Builder{
  constructor(){this.json={options:[]};}
  setName(v){this.json.name=v;return this;}setDescription(v){this.json.description=v;return this;}
  setDefaultMemberPermissions(v){this.json.default_member_permissions=String(v);return this;}setDMPermission(v){this.json.dm_permission=v;return this;}
  setRequired(v){this.json.required=v;return this;}setMinLength(){return this;}setMaxLength(){return this;}setMinValue(){return this;}setMaxValue(){return this;}
  addChoices(...v){this.json.choices=v;return this;}addSubcommand(fn){const b=new Builder();fn(b);this.json.options.push(b.json);return this;}
  addStringOption(fn){return this.addSubcommand(fn);}addIntegerOption(fn){return this.addSubcommand(fn);}toJSON(){return this.json;}
 }
 const cmdPath=path.join(root,'commands/information/kitsune.js');let cleared=0,enabled=true,broken=false,removed=27;
 Module._load=function(request,parent){
  if(parent?.filename===cmdPath){
   if(request==='discord.js')return{SlashCommandBuilder:Builder,PermissionFlagsBits:{Administrator:8n},MessageFlags:{Ephemeral:64},escapeMarkdown:x=>x};
   if(request==='../../handlers/kitsune/settings')return{OWNER_ID:'owner'};
   if(request==='../../handlers/kitsune/learningRuntime')return{enabled:()=>enabled,invalidateAliases(){throw Error('Learned cache must not be touched');}};
   if(request==='../../database/kitsuneLearning')return{clearUnknownPhrases:async guild=>{eq(guild,'g');cleared++;if(broken)throw{code:'MOCK'};return removed;}};
  }
  return original.apply(this,arguments);
 };
 let command;try{command=require(cmdPath);}finally{Module._load=original;}
 const schema=command.data.toJSON();eq(schema.options.length,8);eq(schema.dm_permission,false);
 const option=schema.options.find(x=>x.name==='clearunknown');assert.ok(option);count++;eq(option.options,[]);
 const interaction=(id='owner',guildId='g')=>{
  const replies=[];return{user:{id},guildId,replies,
   options:{getSubcommand:()=>'clearunknown',getString(){throw Error('No phrase argument should be needed');}},
   reply:async payload=>{replies.push(payload);},deferReply:async payload=>{replies.push(payload);},editReply:async payload=>{replies.push(payload);}};
 };
 let i=interaction('admin');await command.execute(i);eq(cleared,0);eq(i.replies[0].flags,64);
 i=interaction('owner',null);await command.execute(i);eq(cleared,0);eq(i.replies[0].flags,64);
 i=interaction();await command.execute(i);eq(cleared,1);eq(i.replies[0].flags,64);
 assert.ok(/27 unknown phrases/.test(i.replies[1].content));count++;
 assert.ok(/Learned phrases are still saved/.test(i.replies[1].content));count++;
 assert.ok(/appear again/.test(i.replies[1].content));count++;eq(i.replies[1].allowedMentions,{parse:[]});
 removed=0;i=interaction();await command.execute(i);assert.ok(/already empty/.test(i.replies[1].content));count++;
 removed=1;i=interaction();await command.execute(i);assert.ok(/1 unknown phrase from/.test(i.replies[1].content));count++;
 enabled=false;const before=cleared;i=interaction();await command.execute(i);eq(cleared,before);assert.ok(/PostgreSQL/.test(i.replies[1].content));count++;enabled=true;
 broken=true;i=interaction();const err=console.error;console.error=()=>{};try{await command.execute(i);}finally{console.error=err;}
 assert.ok(/temporarily unavailable/.test(i.replies[1].content));count++;assert.ok(!/Cleared/.test(i.replies[1].content));count++;
 console.log(count+' bulk unknown-list clearing, guild scope, authorization and rollback checks passed. No real database or Discord calls.');
}
main().catch(error=>{console.error(error);process.exitCode=1;});
