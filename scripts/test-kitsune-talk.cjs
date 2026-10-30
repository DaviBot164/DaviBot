'use strict';
const assert=require('node:assert/strict'),path=require('node:path');
const root=process.argv[2]||path.resolve(__dirname,'..'),context=require(path.join(root,'utils/guildContext')),model=require(path.join(root,'config/serverSettings'));
const panel=require(path.join(root,'handlers/hub/panel')),chat=require(path.join(root,'handlers/hub/conversation')),summon=require(path.join(root,'handlers/hub/summon'));
const G='1528399924218298368',U='1357721282061533311',B='222222222222222222';
(async()=>{await context.run(G,model.defaults('Community'),async()=>{
 for(const [page,entry]of Object.entries(chat.pages))for(let offset=0;offset<entry.lines.length;offset++){
  const p=panel.buildPanel({guildId:G,userId:U,page,offset});assert.equal(p.embeds[0].toJSON().description,entry.lines[offset]);assert.ok(p.components.length<=5);
  for(const row of p.components){const r=row.toJSON();assert.ok(r.components.length<=5);for(const c of r.components){if(c.custom_id){assert.ok(c.custom_id.includes(U));assert.ok(c.custom_id.length<=100);}if(c.options)assert.ok(c.options.length<=25);}}
  assert.deepEqual(p.allowedMentions,{parse:[]});
  const customIds=p.components.flatMap(row=>row.toJSON().components).map(c=>c.custom_id).filter(Boolean);
  assert.equal(new Set(customIds).size,customIds.length,'Discord rejects duplicate custom IDs in '+page);
  for(const row of p.components)for(const c of row.toJSON().components){
   assert.ok(!c.options,'Chat must not include the server navigation dropdown');
   assert.ok(!['home','guide','rules','verify','progress','paths','knowledge','support','about'].includes(c.custom_id?.split(':')[4]));
  }
 }
 const runtime=require(path.join(root,'handlers/hub/runtime'));
 for(const page of Object.keys(chat.pages))for(const owner of [null,U]){
  let result=null;const i={guildId:G,user:{id:U},customId:panel.custom(G,owner,page),isModalSubmit:()=>false,deferReply:async()=>{},deferUpdate:async()=>{},editReply:async payload=>{const ids=payload.components.flatMap(r=>r.toJSON().components).map(c=>c.custom_id).filter(Boolean);assert.equal(new Set(ids).size,ids.length);result=payload;},reply:async()=>assert.fail('Unexpected rejection')};
  await runtime.handle(i);assert.ok(result?.embeds?.length,'Private/public chat transition failed: '+page);
 }
 let removed=0;
 const close={guildId:G,user:{id:U},customId:panel.custom(G,U,'close'),deferUpdate:async()=>{},deleteReply:async()=>{removed++;},reply:async()=>assert.fail('Private close rejected')};
 await runtime.handle(close);assert.equal(removed,1);
 close.customId=panel.custom(G,null,'close');close.reply=async()=>{};await runtime.handle(close);assert.equal(removed,1);
 const lounge=panel.buildPanel({guildId:G,page:'lounge'});assert.equal(lounge.components.length,1);assert.equal(lounge.components[0].toJSON().components.length,3);
 const home=panel.buildPanel({guildId:G}).components.flatMap(r=>r.toJSON().components);assert.ok(home.some(c=>c.custom_id?.includes(':talk:')));
 for(const text of ['kitsune','kitsu hi','kit help','<@'+B+'>','<@!'+B+'> menu'])assert.equal(summon.addressed(text,B),true);
 for(const text of ['I like kitsune','kitten','kitsune is annoying','<@999999999999999999>'])assert.equal(summon.addressed(text,B),false);
 let sends=0;const message={inGuild:()=>true,author:{id:U,bot:false},guild:{id:G},client:{user:{id:B}},content:'kitsune',reply:async p=>{sends++;assert.deepEqual(p.allowedMentions,{parse:[],repliedUser:false});assert.ok(p.components[0].toJSON().components[0].custom_id.includes(':public:'));}};
 assert.equal(await summon.handle(message),true);assert.equal(await summon.handle(message),true);assert.equal(sends,1);
 message.content='ordinary chat';assert.equal(await summon.handle(message),false);
 const disabled=model.defaults('Disabled');disabled.modules.conversation=false;await context.run(G,disabled,async()=>{message.content='kitsune';assert.equal(await summon.handle(message),false);});
 disabled.modules.conversation=true;disabled.modules.progression=false;context.run(G,disabled,()=>{assert.ok(panel.available('talk'));assert.ok(!panel.available('progress'));});
 });
 console.log('Guided talk: all response choices, repeated variants, private IDs, menu limits, exact summons, ambient silence, cooldown, disabled modules and no-ping delivery passed. No external calls.');
})().catch(e=>{console.error(e);process.exitCode=1;});
