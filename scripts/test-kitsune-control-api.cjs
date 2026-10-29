'use strict';
const assert=require('node:assert/strict'),path=require('node:path');const {Readable}=require('node:stream');
const root=process.argv[2]||path.resolve(__dirname,'..');const {createHandler,startControlServer}=require(path.join(root,'handlers/control/server'));
const key='a'.repeat(64),guildId='123456789012345678',memberId='222222222222222222';let saves=[],reads=0,tests=0,invalidations=0,now=100000;
const guild={id:guildId,name:'Test server',members:{fetch:async id=>id===memberId?{id}:Promise.reject(Error('missing'))},roles:{fetch:async()=>null},channels:{fetch:async()=>null}};
const client={guilds:{cache:new Map([[guildId,guild]])}};
const handler=createHandler({client,key,clock:()=>now,repos:{learning:{getLearnedPhrases:async()=>{reads++;return[];},listUnknownPhrases:async()=>[],teachPhrase:async(...args)=>saves.push(args),forgetPhrase:async(...args)=>saves.push(args)},knowledge:{getKnowledge:async()=>[],saveKnowledge:async(...args)=>saves.push(args),removeKnowledge:async(...args)=>saves.push(args)}},runTest:async input=>{tests++;assert.equal(input.guildId,guildId);return'Offline test report';},invalidate:()=>invalidations++});
async function call(url,body,auth=true){const req=Readable.from(body?[Buffer.from(JSON.stringify(body))]:[]);req.url=url;req.method=body?'POST':'GET';req.headers={'content-type':'application/json',authorization:auth?'Bearer '+key:'wrong'};let status,data;const res={writeHead(s){status=s;},end(s){data=JSON.parse(s);}};await handler(req,res);return{status,data};}
(async()=>{
 assert.equal((await call('/v1/guilds',null,false)).status,401);assert.equal(reads,0);
 assert.equal((await call('/v1/status')).data.service,'kitsune-control');assert.equal((await call('/v1/guilds')).data.guilds[0].id,guildId);
 assert.equal((await call('/v1/state?guildId=333333333333333333')).status,404);assert.equal(reads,0);
 assert.equal((await call('/v1/state?guildId='+guildId)).status,200);assert.equal(reads,1);
 assert.equal((await call('/v1/save',{guildId,record:{kind:'meaning',name:'go ahead',meaning:'continue'}})).status,410);assert.equal(saves.length,0);assert.equal(invalidations,0);
 assert.equal((await call('/v1/save',{guildId,record:{kind:'meaning',name:'hello',meaning:'stop'}})).status,410);assert.equal(saves.length,0);
 assert.equal((await call('/v1/save',{guildId,record:{kind:'member',name:'tomy',targetId:memberId}})).status,200);assert.equal(saves.length,1);
 assert.equal((await call('/v1/save',{guildId,record:{kind:'member',name:'missing member',targetId:'444444444444444444'}})).status,400);assert.equal(saves.length,1);
 assert.equal((await call('/v1/save',{guildId,record:{kind:'role',name:'staff role',targetId:memberId}})).status,400);
 assert.equal((await call('/v1/test',{guildId,text:'kitsune hi',persona:'member'})).status,410);assert.equal(tests,0);
 assert.equal((await call('/v1/test',{guildId,text:'x'.repeat(1501),persona:'member'})).status,410);assert.equal(tests,0);
 assert.equal(startControlServer(client,{}),null);
 const prior=console.error;console.error=()=>{};try{assert.equal(startControlServer(client,{KITSUNE_CONTROL_ENABLED:'true',KITSUNE_CONTROL_KEY:'bad'}),null);}finally{console.error=prior;}
 for(let i=0;i<30;i++)await call('/v1/status');assert.equal((await call('/v1/status')).status,429);now+=60000;assert.equal((await call('/v1/status')).status,200);
 console.log('Owner Control API auth, guild isolation, built-in protection, member verification, isolated tests, rate caps and disabled-default checks passed. No network, Discord or database calls.');
})().catch(e=>{console.error(e);process.exitCode=1;});
