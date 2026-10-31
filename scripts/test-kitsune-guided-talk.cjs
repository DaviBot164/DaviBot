'use strict';
const assert=require('node:assert/strict'),path=require('node:path');
const root=process.argv[2]||path.resolve(__dirname,'..'),engine=require(path.join(root,'handlers/hub/talk-engine'));
const context=require(path.join(root,'utils/guildContext')),settings=require(path.join(root,'config/serverSettings'));
const G='1528399924218298368',U='1357721282061533311',V='222222222222222222';
(async()=>{
 const reached=new Set(['talk']),queue=['talk'];while(queue.length){const id=queue.shift();for(const next of engine.nodes[id].choices){assert.ok(engine.nodes[next],id+' -> '+next);if(!reached.has(next)){reached.add(next);queue.push(next);}}}
 assert.equal(reached.size,Object.keys(engine.nodes).length);
 for(const [node,n]of Object.entries(engine.nodes)){
  assert.equal(n.lines.en.length,n.lines.ka.length);assert.equal(new Set(n.choices).size,n.choices.length);assert.ok(n.choices.length<=6);
  for(const lang of ['en','ka']){let s=engine.start(lang,node);for(let k=0;k<n.lines[lang].length;k++){const v=engine.view(s);assert.ok(v.reply.length<4000);assert.ok(n.label[lang].length<=80);const other=engine.change(s,lang==='en'?'ka':'en');assert.equal(other.node,s.node);assert.equal(other.index,s.index);assert.deepEqual(other.seen,s.seen);for(const choice of v.choices){const changed=engine.change(s,choice.id);assert.equal(changed.node,choice.id);}s.index=(s.index+1)%n.lines[lang].length;}}
 }
 let state=engine.start();state=engine.change(state,'joke');const first=engine.view(state).reply;state=engine.change(state,'joke');assert.notEqual(engine.view(state).reply,first);state=engine.change(state,'back');assert.equal(engine.view(state).reply,first);
 const untouched=structuredClone(state);engine.change(state,'ka');assert.deepEqual(state,untouched);assert.throws(()=>engine.change(state,'board'));
 const walk=['company','quiet','rain','ticket','platform','board','ka'];const result=engine.replay({actions:walk});assert.equal(result.state.node,'board');assert.equal(result.state.lang,'ka');assert.equal(result.transcript.length,walk.length+1);assert.throws(()=>engine.replay({actions:['board']}));assert.throws(()=>engine.replay({actions:Array(121).fill('menu')}));assert.throws(()=>engine.replay({language:'fr'}));
 const {createRuntime}=require(path.join(root,'handlers/hub/talk-runtime'));let now=1000;const runtime=createRuntime({clock:()=>now});
 await context.run(G,settings.defaults('Community'),async()=>{
  let payload,denied=0,deletes=0;const i={guildId:G,user:{id:U},customId:`kitsune:hub:${G}:public:talk:0`,reply:async()=>{denied++;},deferReply:async()=>{},deferUpdate:async()=>{},editReply:async p=>{payload=p;},deleteReply:async()=>{deletes++;}};
  const buttons=()=>payload.components.flatMap(r=>r.toJSON().components);
  assert.equal(await runtime.handle(i),true);
  for(const lang of ['en','ka'])for(const node of Object.keys(engine.nodes)){
   const p=runtime.render({id:'123456abcdef',guild:G,user:U,revision:120,state:engine.start(lang,node)});assert.ok(p.components.length<=5);const ids=p.components.flatMap(r=>r.toJSON().components).map(c=>{assert.ok(c.label.length<=80);assert.ok(c.custom_id.length<=100);return c.custom_id;});assert.equal(new Set(ids).size,ids.length);assert.ok(ids.at(-1).endsWith(':close'));assert.deepEqual(p.allowedMentions,{parse:[]});
  }
  const old=buttons().find(c=>c.custom_id.endsWith(':company')).custom_id;
  i.customId=old;await runtime.handle(i);assert.equal(payload.embeds[0].toJSON().description,engine.nodes.company.lines.en[0]);
  await runtime.handle(i);assert.equal(denied,1,'Reject stale revision');
  const current=buttons().find(c=>c.custom_id.endsWith(':ka')).custom_id;
  i.customId=current;i.user.id=V;await runtime.handle(i);assert.equal(denied,2);i.user.id=U;i.guildId=V;await runtime.handle(i);assert.equal(denied,3);i.guildId=G;
  i.customId=current;await runtime.handle(i);assert.equal(payload.embeds[0].toJSON().description,engine.nodes.company.lines.ka[0]);
  i.customId=buttons().find(c=>c.custom_id.endsWith(':quiet')).custom_id;
  let release;const gate=new Promise(r=>{release=r;});i.editReply=async p=>{await gate;payload=p;};const pending=runtime.handle(i);await runtime.handle(i);assert.equal(denied,4,'Reject concurrent click');release();await pending;
  i.editReply=async p=>{payload=p;};i.customId=buttons().at(-1).custom_id;await runtime.handle(i);assert.equal(deletes,1);await runtime.handle(i);assert.equal(denied,5);
  i.customId=`kitsune:hub:${G}:public:talk:0`;await runtime.handle(i);i.customId=buttons()[0].custom_id;now+=30*60_000;await runtime.handle(i);assert.equal(denied,6);
  const disabled=settings.defaults('Off');disabled.modules.conversation=false;await context.run(G,disabled,async()=>{i.customId=`kitsune:hub:${G}:public:talk:0`;await runtime.handle(i);assert.equal(denied,7);});
  i.customId='unrelated';assert.equal(await runtime.handle(i),false);
 });
 console.log('Guided talk depth: 37 reachable bilingual nodes, valid choices, reply cycling, language continuity, back history, replay validation, Discord limits, private ownership, guild scope, stale/concurrent clicks, expiry, close and module gates passed. No external calls.');
})().catch(e=>{console.error(e);process.exitCode=1;});
