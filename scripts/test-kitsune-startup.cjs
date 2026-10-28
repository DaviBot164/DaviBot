'use strict';
const assert=require('node:assert/strict'),path=require('node:path'),fs=require('node:fs'),vm=require('node:vm');
const root=process.argv[2]||path.resolve(__dirname,'..');
const {connectionOptions}=require(path.join(root,'database/connectionOptions'));
for(const mode of ['prefer','require','verify-ca','verify-full']){
 const options=connectionOptions({NODE_ENV:'production',NF_DAVIBOT_DATABASE_POSTGRES_URI:'postgresql://user:pass@host/db?sslmode='+mode+'&sslrootcert=%2Fca.pem&application_name=kitsune'});
 const uri=new URL(options.connectionString);assert.equal(uri.searchParams.get('sslmode'),'verify-full');assert.equal(uri.searchParams.get('sslrootcert'),'/ca.pem');assert.equal(uri.searchParams.get('application_name'),'kitsune');assert.equal(uri.password,'pass');assert.equal(options.ssl.rejectUnauthorized,true);
}
for(const mode of ['disable','no-verify'])assert.equal(new URL(connectionOptions({NF_DAVIBOT_DATABASE_POSTGRES_URI:'postgres://u:p@h/db?sslmode='+mode}).connectionString).searchParams.get('sslmode'),mode);
assert.equal(connectionOptions({}).ssl,false);assert.equal(connectionOptions({NODE_ENV:'production'}).ssl.rejectUnauthorized,true);
for(const value of ['invalid private password','https://user:secret@host/db']){
 assert.throws(()=>connectionOptions({NF_DAVIBOT_DATABASE_POSTGRES_URI:value}),e=>!e.message.includes(value)&&!e.message.includes('user:secret'));
}
let captured;
vm.runInNewContext(fs.readFileSync(path.join(root,'database/connection.js'),'utf8'),{require(name){if(name==='pg')return{Pool:class{constructor(o){captured=o;}query(){return Promise.resolve();}end(){}}};return require(path.join(root,'database',name));},module:{exports:{}}});
assert.equal(typeof captured,'object');
async function readyCase(failure,matched=false){
 const logs=[];let calls=0,scheduler=0,event;
 const env={NF_DAVIBOT_DATABASE_POSTGRES_URI:'postgres://secret:password@host/db',TOKEN:'fake-discord-secret',GROQ_API_KEY:'fake-groq-secret'};
 vm.runInNewContext(fs.readFileSync(path.join(root,'events/ready.js'),'utf8'),{require(name){if(name==='../handlers/rankReconciliation')return{startRankReconciliation(){}};if(name==='discord.js')return{Events:{ClientReady:'ready'}};if(name==='../config/brand')return{name:'Kitsune',server:'Blood Moon'};return{startMatchExpiryScheduler(){scheduler++;}};},process:{env},module:{set exports(v){event=v;}},console:{log(...v){logs.push(v.join(' '));},error(...v){logs.push(v.join(' '));}}});
 event.execute({user:{username:matched?'Kitsune':'Previous',tag:'Previous#9453',setUsername(){calls++;if(failure==='sync')throw Error('sync failure');if(failure)return Promise.reject(failure);return Promise.resolve();}},commands:new Map()});
 await new Promise(resolve=>setImmediate(resolve));
 assert.equal(calls,matched?0:1);assert.equal(scheduler,1,'rename failure never blocks scheduler');
 return logs.join('\n');
}
(async()=>{
 const log=await readyCase({code:50035,status:400,rawError:{errors:{username:{_errors:[{code:'USERNAME_INVALID',message:'Rejected fake-discord-secret fake-groq-secret postgres://secret:password@host/db Bearer abc gsk_123456'}]}}},requestBody:{secret:'must not log'},stack:'must not log'});
 for(const x of ['50035','400','USERNAME_INVALID','[redacted]'])assert.ok(log.includes(x));
 for(const x of ['fake-discord-secret','fake-groq-secret','secret:password','Bearer abc','gsk_123456','must not log'])assert.ok(!log.includes(x));
 assert.match(await readyCase(null),/Bot name synced/);assert.ok(!(await readyCase(null,true)).includes('Bot name synced'));
 assert.match(await readyCase('sync'),/Bot remains online/);assert.match(await readyCase({code:50035}),/"username":\[\]/);
 console.log('Startup TLS option, certificate preservation, URI privacy, rename diagnostics, redaction and scheduler isolation checks passed. No database or Discord calls.');
})().catch(e=>{console.error(e);process.exitCode=1;});
