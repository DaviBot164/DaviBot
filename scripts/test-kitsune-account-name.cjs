'use strict';
const fs=require('node:fs'),vm=require('node:vm'),path=require('node:path'),assert=require('node:assert/strict');
const root=process.argv[2]||path.resolve(__dirname,'..'),brand=require(path.join(root,'config/brand'));
assert.equal(brand.name,'Kitsune');assert.equal(brand.accountName,'KitsuneBM');assert.equal(brand.nickname,'Kitsune 🦊');
async function run({matched=false,nameFail=false,nickFail=false,missing=false,noGuild=false,fetch=false}={}){
 let event,names=0,nicks=0,schedules=0,fetches=0;const logs=[];
 const member={nickname:matched?brand.nickname:'Previous',async setNickname(value){nicks++;assert.equal(value,brand.nickname);if(nickFail)throw{code:50013,status:403,token:'secret'};}};
 const guild={members:{me:fetch?null:member,async fetchMe(){fetches++;return member;}}};
 vm.runInNewContext(fs.readFileSync(path.join(root,'events/ready.js'),'utf8'),{require(name){if(name==='../handlers/rankReconciliation')return{startRankReconciliation(){}};if(name==='discord.js')return{Events:{ClientReady:'ready'}};if(name==='../config/brand')return brand;return{startMatchExpiryScheduler(){schedules++;}};},process:{env:{GUILD_ID:noGuild?undefined:'primary',NF_DAVIBOT_DATABASE_POSTGRES_URI:'mock'}},console:{log(...v){logs.push(v.join(' '));},error(...v){logs.push(v.join(' '));}},module:{set exports(v){event=v;}}});
 event.execute({user:{username:matched?brand.accountName:'Previous',tag:'Previous#1',async setUsername(value){names++;assert.equal(value,'KitsuneBM');if(nameFail)throw{code:50035,status:400};}},commands:new Map(),guilds:{cache:new Map(missing?[]:[['primary',guild],['other',{members:{me:{setNickname(){throw Error('must not edit other guild');}}}}]])}});
 await new Promise(resolve=>setImmediate(resolve));
 assert.equal(names,matched?0:1);assert.equal(nicks,matched||missing||noGuild?0:1);assert.equal(schedules,1);assert.equal(fetches,fetch&&!missing&&!noGuild?1:0);assert.ok(!logs.join('').includes('secret'));
 if(nameFail)assert.ok(logs.some(x=>x.includes('Bot name sync failed')));
 if(nickFail)assert.ok(logs.some(x=>x.includes('Bot nickname sync failed')));
}
(async()=>{for(const options of [{},{matched:true},{nameFail:true},{nickFail:true},{nameFail:true,nickFail:true},{missing:true},{noGuild:true},{fetch:true}])await run(options);console.log('Account name, primary-server-only nickname, matching-name skip, fetch and independent failure checks passed. No Discord calls.');})().catch(e=>{console.error(e);process.exitCode=1;});
