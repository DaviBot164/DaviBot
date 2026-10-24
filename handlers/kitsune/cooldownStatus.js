const config=require('../../config/kitsuneTesting');
function createCooldownStatus({users,channels,clock=Date.now,setTimer=setTimeout,clearTimer=clearTimeout,maxEntries=config.maxIndicators,lifetime=config.indicatorLifetimeMs}){
 const entries=new Map();
 const key=info=>info.guildId+':'+info.channelId+':'+info.userId;
 const allowedMentions={parse:[],repliedUser:false};
 function drop(entry){entry.closed=true;if(entry.timer)clearTimer(entry.timer);if(entries.get(entry.key)===entry)entries.delete(entry.key);}
 function remaining(entry){
  const state=channels.get(entry.info.channelId),now=clock();
  const user=users.get(entry.info.guildId+':'+entry.info.userId)??0;
  const other=entry.noticeUser?users.get(entry.info.guildId+':'+entry.noticeUser)??0:0;
  return {busy:Boolean(state?.busy),seconds:Math.max(0,Math.ceil((Math.max(user,other,state?.until??0)-now)/1000))};
 }
 async function pump(entry){
  if(entry.closed||entry.running)return;
  if(entry.timer){clearTimer(entry.timer);entry.timer=null;}
  entry.running=true;
  const {busy,seconds}=remaining(entry);
  const expired=clock()-entry.created>=lifetime;
  const ready=!busy&&seconds===0;
  const footer=expired&&!ready?'🦊 Cooldown status paused — the channel is still active.'
   :busy?'⏳ Kitsune is responding. Please wait.'
   :ready?'🦊 Ready • new channel activity can restart the cooldown.'
   :'🦊 Next reply in '+seconds+'s';
  const note=entry.notice?'\n⏳ An early message was not processed. Send it again when ready.':'';
  const content=[entry.payload.content,footer+note].filter(Boolean).join('\n\n');
  try{
   if(content!==entry.last){await entry.sent.edit({...entry.payload,content,allowedMentions});entry.last=content;}
  }catch{drop(entry);return;}
  finally{entry.running=false;}
  if(entry.closed)return;
  if(ready||expired){drop(entry);return;}
  entry.timer=setTimer(()=>{entry.timer=null;void pump(entry);},Math.min(1000,Math.max(1,lifetime-(clock()-entry.created))));
  entry.timer?.unref?.();
 }
 function start(sent,payload,info){
  if(!config.cooldownIndicator||typeof sent?.edit!=='function'||payload.files?.length||(payload.content?.length??0)>1650)return false;
  const k=key(info),previous=entries.get(k);if(previous)drop(previous);
  if(entries.size>=maxEntries)drop(entries.values().next().value);
  const entry={key:k,sent,payload:{...payload},info:{...info},created:clock(),timer:null,closed:false,running:false,last:null,notice:false};
  entries.set(k,entry);void pump(entry);return true;
 }
 function warn(info){
  const entry=entries.get(key(info))??[...entries.values()].reverse().find(row=>row.info.guildId===info.guildId&&row.info.channelId===info.channelId);
  if(!entry||entry.closed)return false;
  entry.notice=true;entry.noticeUser=info.userId;
  // Keep one edit loop per indicator; a burst cannot create new channel messages.
  if(!entry.running&&clock()-(entry.warnedAt??-Infinity)>=1000){entry.warnedAt=clock();void pump(entry);}
  return true;
 }
 return {start,warn,remaining:info=>remaining({info}),size:()=>entries.size,dispose:()=>{for(const entry of [...entries.values()])drop(entry);}};
}
module.exports={createCooldownStatus};
