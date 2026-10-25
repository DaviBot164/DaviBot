'use strict';
const assert=require('node:assert/strict'),path=require('node:path'),fs=require('node:fs'),vm=require('node:vm');
const root=process.argv[2]||path.resolve(__dirname,'..');
class Builder{setName(){return this;}setDescription(){return this;}}
async function run(options={}){
 const calls=[],logs=[];let command,ensures=0;
 const member={id:'u',joinedAt:new Date(0),user:{bot:!!options.bot}};
 const deps={
  'discord.js':{SlashCommandBuilder:Builder,MessageFlags:{Ephemeral:64}},
  '../../utils/dailyPresentation':{dailyEmbed(result){calls.push('embed');if(options.embedFail)throw Error('secret raw');return result;}},
  '../../utils/embeds':{errorEmbed:()=>({error:true})},
  '../../database/users':{async ensureUser(g,u){assert.equal(g,'g');assert.equal(u,'u');calls.push('ensure');ensures++;if(options.profileFail||(options.refreshProfileFail&&ensures>1))throw Error('profile failed');return{};}},
  '../../database/dailyRewards':{async claimDaily(g,u){assert.equal(g,'g');assert.equal(u,'u');calls.push('claim');if(options.claimFail)throw Error('claim failed');return{claimed:!options.duplicate,levelsGained:options.noLevel?0:1};}},
  '../../handlers/autoPromotion':{async checkAutoPromotion(){calls.push('promotion');if(options.promotionFail)throw Error('promotion failed');}},
  '../../handlers/progressionUnlocks':{async refreshProgressionUnlocks(){calls.push('refresh');if(options.refreshFail)throw Error('refresh failed');}}
 };
 vm.runInNewContext(fs.readFileSync(path.join(root,'commands/progression/daily.js'),'utf8'),{require(name){assert.ok(Object.hasOwn(deps,name),name);return deps[name];},module:{set exports(v){command=v;}},console:{error(...v){logs.push(v);}}});
 const interaction={user:{id:'u'},guild:{id:'g',members:{async fetch(){calls.push('member');if(options.missing)throw Error('missing');return member;}}},async deferReply(o){assert.equal(o.flags,64);calls.push('defer');if(options.deferFail)throw Error('defer failed');},async editReply(){calls.push('receipt');if(options.receiptFail)throw{code:10008,message:'secret raw',token:'secret raw'};}};
 let error;try{await command.execute(interaction);}catch(e){error=e;}
 return{calls,logs,error};
}
(async()=>{
 for(const options of [{},{receiptFail:true},{embedFail:true}]){
  const r=await run(options);assert.equal(r.error,undefined);assert.equal(r.calls.filter(x=>x==='claim').length,1);assert.ok(r.calls.includes('promotion'));assert.ok(r.calls.includes('refresh'));
  assert.ok(r.calls.indexOf('claim')<r.calls.indexOf('embed'));assert.ok(r.calls.indexOf('embed')<r.calls.indexOf('refresh'));
  if(options.receiptFail||options.embedFail){assert.ok(JSON.stringify(r.logs).includes('Daily receipt delivery failed'));assert.ok(!JSON.stringify(r.logs).includes('secret raw'));}
 }
 for(const options of [{promotionFail:true},{refreshProfileFail:true}]){const r=await run({...options,receiptFail:true});assert.equal(r.error,undefined);assert.ok(r.calls.includes('refresh'));}
 const refresh=await run({refreshFail:true});assert.equal(refresh.error,undefined);assert.ok(refresh.logs.length);
 const noLevel=await run({noLevel:true,receiptFail:true});assert.ok(!noLevel.calls.includes('promotion'));assert.ok(noLevel.calls.includes('refresh'));
 for(const receiptFail of [false,true]){const r=await run({duplicate:true,receiptFail});assert.equal(r.error,undefined);assert.equal(r.calls.filter(x=>x==='claim').length,1);assert.ok(!r.calls.includes('promotion'));assert.ok(!r.calls.includes('refresh'));}
 for(const options of [{missing:true},{bot:true},{deferFail:true},{profileFail:true},{claimFail:true}]){
  const r=await run(options);assert.ok(!r.calls.includes('promotion'));assert.ok(!r.calls.includes('refresh'));
  if(!options.claimFail)assert.ok(!r.calls.includes('claim'));
  if(options.deferFail||options.profileFail||options.claimFail)assert.ok(r.error);
 }
 console.log('Daily receipt failure, committed-result isolation, no retry, duplicate, authorization and independent progression checks passed. No database or Discord calls.');
})().catch(e=>{console.error(e);process.exitCode=1;});
