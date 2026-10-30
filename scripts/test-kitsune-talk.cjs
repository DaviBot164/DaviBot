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
  for(const row of p.components)for(const c of row.toJSON().components){
   assert.ok(!c.options,'Chat must not include the server navigation dropdown');
   assert.ok(!['home','guide','rules','verify','progress','paths','knowledge','support','about'].includes(c.custom_id?.split(':')[4]));
  }
 }
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
