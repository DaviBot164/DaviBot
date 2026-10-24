'use strict';
const assert=require('node:assert/strict'),path=require('node:path');
const root=process.argv[2]||path.resolve(__dirname,'..');
const {createCooldownStatus}=require(path.join(root,'handlers/kitsune/cooldownStatus'));
let checks=0;const eq=(a,b,label)=>{assert.deepEqual(a,b,label);checks++;};const ok=(a,label)=>{assert.ok(a,label);checks++;};
const flush=async()=>{for(let i=0;i<5;i++)await Promise.resolve();};
function harness(options={}){
 let now=100000,serial=0;const timers=new Map(),users=new Map([['g:u',103000]]),channels=new Map([['c',{until:102000,busy:false}]]),edits=[];
 const status=createCooldownStatus({users,channels,clock:()=>now,setTimer:(fn,ms)=>{const id=++serial;timers.set(id,{fn,at:now+ms});return id;},clearTimer:id=>timers.delete(id),...options});
 const sent={edit:async payload=>{edits.push(payload);}};const info={guildId:'g',channelId:'c',userId:'u'};
 return{status,sent,info,edits,timers,users,channels,async advance(ms){const end=now+ms;for(;;){const next=[...timers].sort((a,b)=>a[1].at-b[1].at)[0];if(!next||next[1].at>end)break;now=next[1].at;timers.delete(next[0]);next[1].fn();await flush();}now=end;await flush();}};
}
(async()=>{
 let h=harness();eq(h.status.start(h.sent,{content:'Hello.'},h.info),true);await flush();ok(/3s/.test(h.edits.at(-1).content));
 await h.advance(1000);ok(/2s/.test(h.edits.at(-1).content));await h.advance(1000);ok(/1s/.test(h.edits.at(-1).content));await h.advance(1000);ok(/Ready/.test(h.edits.at(-1).content));eq(h.status.size(),0);eq(h.timers.size,0);
 for(const edit of h.edits){eq(edit.allowedMentions,{parse:[],repliedUser:false});eq((edit.content.match(/Hello\./g)||[]).length,1,'body not duplicated');}
 h=harness();h.status.start(h.sent,{content:'Hello.'},h.info);await flush();await h.advance(1000);h.channels.get('c').until=106000;await h.advance(1000);ok(/4s/.test(h.edits.at(-1).content),'actual new channel activity extends timer');h.status.dispose();eq(h.timers.size,0);
 h=harness();h.status.start(h.sent,{content:'Hello.'},h.info);await flush();const size=h.edits.length;
 for(let i=0;i<20;i++)h.status.warn(h.info);await flush();ok(h.edits.length<=size+1,'early bursts do not create edit storms');ok(/not processed/.test(h.edits.at(-1).content));await h.advance(3000);ok(/Ready/.test(h.edits.at(-1).content));
 h=harness();h.channels.get('c').busy=true;h.status.start(h.sent,{content:'Hello.'},h.info);await flush();ok(/responding/.test(h.edits.at(-1).content));await h.advance(10000);ok(/paused/.test(h.edits.at(-1).content));eq(h.status.size(),0);eq(h.timers.size,0,'lifetime bounded');
 h=harness();h.status.start({edit:async()=>{throw Error('deleted or edit denied');}},{content:'Hello.'},h.info);await flush();eq(h.status.size(),0);eq(h.timers.size,0);
 h=harness();eq(h.status.start({}, {content:'Hello'},h.info),false);eq(h.status.start(h.sent,{content:'a'.repeat(1700)},h.info),false);eq(h.status.start(h.sent,{files:[{}]},h.info),false);eq(h.status.size(),0);
 h=harness({maxEntries:2});for(const userId of ['a','b','c'])h.status.start(h.sent,{content:'Hi'}, {...h.info,userId});await flush();eq(h.status.size(),2);h.status.dispose();eq(h.timers.size,0);
 // A delayed failure of an old edit cannot delete a replacement indicator.
 h=harness();let reject;h.status.start({edit:()=>new Promise((_,no)=>{reject=no;})},{content:'old'},h.info);h.status.start(h.sent,{content:'new'},h.info);await flush();reject(Error('old failed'));await flush();eq(h.status.size(),1);h.status.dispose();
 console.log(checks+' real-deadline countdown, shared-channel extension, early notice, bounded-timer and edit-failure checks passed. No real database or Discord calls.');
})().catch(error=>{console.error(error);process.exitCode=1;});
