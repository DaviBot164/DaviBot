const {lookupKey}=require('./knowledge');
const {namedAddress}=require('./addressing');
const cache=new Map();let backoff=0;
function inputForKnowledge(message,session,now){
 const content=String(message.content??'').trim();if(content.length>300)return null;
 const named=namedAddress(content),mention=content.match(/^<@!?(\d+)>[\s,:;.!?…]*(.*)$/su);
 const addressed=named||(mention&&mention[1]===message.client?.user?.id?[mention[0],mention[2]]:null);
 const reply=Boolean(session&&message.reference?.messageId===session.messageId);
 if(!addressed&&(message.reference&&!reply||!session||!reply&&now>=(session.implicitUntil??0)))return null;
 const raw=addressed?addressed[1]:content;
 return lookupKey(raw)?raw:null;
}
function invalidate(guildId){cache.delete(guildId);}
async function findKnowledge(guildId,text){
 const key=lookupKey(text);if(!key||!process.env.NF_DAVIBOT_DATABASE_POSTGRES_URI||Date.now()<backoff)return null;
 const now=Date.now();let entry=cache.get(guildId);
 if(!entry||now>=entry.until){
  if(!entry?.pending){
   if(!cache.has(guildId)&&cache.size>=50)cache.delete(cache.keys().next().value);
   entry={until:0,rows:[],pending:null};cache.set(guildId,entry);
   entry.pending=(async()=>{try{entry.rows=await require('../../database/kitsuneKnowledge').getKnowledge(guildId);entry.until=Date.now()+60_000;}catch{backoff=Date.now()+30_000;}finally{entry.pending=null;}})();
  }
  await entry.pending;
 }
 return entry.rows.find(row=>row.name===key)??null;
}
module.exports={findKnowledge,invalidate,inputForKnowledge};
