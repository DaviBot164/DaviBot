'use strict';
const assert=require('node:assert/strict'),path=require('node:path');
const root=process.argv[2]||path.resolve(__dirname,'..');
const {createAiLab}=require(path.join(root,'handlers/kitsune/aiTestLab'));
const {OWNER_ID}=require(path.join(root,'handlers/kitsune/settings'));
const config=require(path.join(root,'config/kitsuneAiLab'));
let checks=0;const eq=(a,b,label)=>{assert.deepEqual(a,b,label);checks++;};const ok=(v,label)=>{assert.ok(v,label);checks++;};
const input={userId:OWNER_ID,guildId:'g',channelId:'c',persona:'member',text:'kitsune hi',seed:17};
const env={KITSUNE_AI_LAB_ENABLED:'true',GROQ_API_KEY:'gsk_test_secret_not_real_123456789'};
let calls=[],mode='good',now=Date.UTC(2026,9,25),release;
const response=(content='Hello. What is on your mind?')=>({ok:true,json:async()=>({choices:[{message:{content,reasoning:'DO NOT DISPLAY REASONING'},finish_reason:'stop'}]})});
async function fetchFn(url,options){
 calls.push({url,options,body:JSON.parse(options.body)});
 if(mode==='badkey')return {ok:false,status:401,json:async()=>{throw Error(env.GROQ_API_KEY);}};
 if(mode==='rate')return {ok:false,status:429};
 if(mode==='network')throw Error('Connection failed '+env.GROQ_API_KEY);
 if(mode==='invalid')return {ok:true,json:async()=>{throw Error('JSON secret '+env.GROQ_API_KEY);}};
 if(mode==='long')return response('a'.repeat(3000));
 if(mode==='tools')return {ok:true,json:async()=>({choices:[{message:{tool_calls:[{name:'ban'}]}}]})};
 if(mode==='empty')return response('');
 if(mode==='reason')return response('<think>private reasoning</think> hello');
 if(mode==='wait')return await new Promise(resolve=>{release=()=>resolve(response());});
 if(mode==='abort')return await new Promise((resolve,reject)=>options.signal.addEventListener('abort',()=>reject(Error('aborted'))));
 return response();
}
async function rejects(lab,arg,pattern){await assert.rejects(()=>lab.runAiLab(arg),pattern);checks++;}
(async()=>{
 const lab=createAiLab({env,fetchFn,clock:()=>now});
 await rejects(lab,{...input,userId:'admin'},/Only Davi/);eq(calls.length,0);
 await rejects(lab,{...input,guildId:null},/Only Davi/);
 await rejects(createAiLab({env:{},fetchFn}),input,/disabled/);
 await rejects(createAiLab({env:{KITSUNE_AI_LAB_ENABLED:'true'},fetchFn}),input,/GROQ_API_KEY/);
 await rejects(lab,{...input,text:env.GROQ_API_KEY},/credential/);
 await rejects(lab,{...input,text:'TOKEN=not-a-real-token'},/credential/);
 await rejects(lab,{...input,persona:'administrator'},/Choose/);
 await rejects(lab,{...input,text:'x'.repeat(1501)},/1500/);
 await rejects(lab,{...input,text:' '},/1–10|1-10/);
 await rejects(lab,{...input,text:Array(11).fill('hi').join(' || ')},/1-10/);
 await rejects(lab,{...input,seed:-1},/Seed/);
 await rejects(lab,{...input,expected:'hi'},/Expected/);eq(calls.length,0);
 let result=await lab.runAiLab({...input,text:'kitsune hi || how u been?'});
 eq(calls.length,2);eq(calls[0].url,'https://api.groq.com/openai/v1/chat/completions');eq(calls[0].options.redirect,'error');eq(calls[0].options.headers.Authorization,'Bearer '+env.GROQ_API_KEY);
 eq(calls[0].body.model,'openai/gpt-oss-20b');eq(calls[0].body.include_reasoning,false);eq(calls[0].body.max_completion_tokens,1024);ok(!Object.hasOwn(calls[0].body,'tools'));
 eq(calls[0].body.messages.map(m=>m.role),['system','user']);eq(calls[1].body.messages.map(m=>m.role),['system','user','assistant','user']);
 const text=lab.formatAiReport(result);ok(!text.includes(env.GROQ_API_KEY));ok(!text.includes('DO NOT DISPLAY REASONING'));ok(text.includes('external Groq'));eq(result.turns[1].status,'generated');
 calls=[];await lab.runAiLab({...input,seed:undefined,text:'next'});eq(calls[0].body.messages.length,6,'continue only private simulation');
 calls=[];await lab.runAiLab({...input,channelId:'other'});eq(calls[0].body.messages.length,2,'channel isolation');
 calls=[];await lab.runAiLab({...input,persona:'owner'});ok(calls[0].body.messages[0].content.includes('bot owner'));eq(calls[0].body.messages.length,2);
 calls=[];await lab.runAiLab({...input,persona:'mae'});ok(calls[0].body.messages[0].content.includes('not the bot owner'));
 calls=[];await lab.runAiLab({...input});eq(calls[0].body.messages.length,2,'seed restarts AI history');ok(!Object.hasOwn(calls[0].body,'seed'),'no false deterministic seed');
 calls=[];now+=config.ttlMs+1;await lab.runAiLab({...input,seed:undefined});eq(calls[0].body.messages.length,2,'private history expires');
 eq(lab.resetAiLab(input),1);calls=[];await lab.runAiLab({...input,seed:undefined});eq(calls[0].body.messages.length,2,'reset drops private history');
 for(const failed of ['badkey','rate','network','empty','reason','invalid','tools']){
  mode=failed;calls=[];result=await lab.runAiLab({...input,text:'failed || not sent'});eq(calls.length,1,'no retry or later-turn request after '+failed);eq(result.turns[0].status,'error');ok(!lab.formatAiReport(result).includes(env.GROQ_API_KEY));
  mode='good';calls=[];await lab.runAiLab({...input,seed:undefined,text:'after failure'});eq(calls[0].body.messages.length,2,'failed turn not committed');
 }
 mode='long';result=await lab.runAiLab(input);eq(result.turns[0].reply.length,config.maxReply);eq(result.turns[0].truncated,true);mode='good';
 const capped=createAiLab({env,fetchFn,clock:()=>now,limits:{...config,dailyRequests:2}});calls=[];result=await capped.runAiLab({...input,text:'one || two || three'});eq(calls.length,2);eq(result.turns[2].status,'stopped');eq(result.remaining,0);await capped.runAiLab(input);eq(calls.length,2,'seed cannot reset quota');capped.resetAiLab(input);await capped.runAiLab(input);eq(calls.length,2,'reset cannot reset quota');now+=86400_000;await capped.runAiLab(input);eq(calls.length,3,'new UTC day replenishes trial quota');
 mode='wait';const locked=createAiLab({env,fetchFn});const pending=locked.runAiLab(input);await rejects(locked,input,/running/);assert.throws(()=>locked.resetAiLab(input),/running/);checks++;release();await pending;mode='good';await locked.runAiLab(input);
 mode='abort';const timeout=createAiLab({env,fetchFn,limits:{...config,timeoutMs:10}});const keepAlive=setTimeout(()=>{},100);result=await timeout.runAiLab(input);clearTimeout(keepAlive);eq(result.turns[0].status,'error');ok(/timed out|failed/.test(result.turns[0].error));mode='good';
 const history=createAiLab({env,fetchFn});for(let i=0;i<10;i++)await history.runAiLab({...input,seed:undefined,text:'turn '+i});ok(calls.at(-1).body.messages.length<=14,'bounded history');
 console.log(checks+' private AI authorization, opt-in, isolation, request caps, redaction, error, timeout and history checks passed. All HTTP calls mocked; no Discord or database calls.');
})().catch(error=>{console.error(error);process.exitCode=1;});
