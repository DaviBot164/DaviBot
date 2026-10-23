const config=require('../../config/kitsuneLearning');
const {learningPhrase}=require('./learningPhrases');
const cache=new Map(),rates=new Map();
let unavailableUntil=0;
const enabled=()=>config.enabled && Boolean(process.env.NF_DAVIBOT_DATABASE_POSTGRES_URI);
const repository=()=>require('../../database/kitsuneLearning');
function inputForLearning(message,session,now) {
    const content=String(message.content??'').trim();
    const named=content.match(/^(?:(?:yo|hey|hi|hello)[\s,:;.!?…]+)?kitsune(?=$|[\s\p{P}\p{S}])[\s,:;.!?…]*(.*)$/isu);
    const mention=content.match(/^<@!?(\d+)>[\s,:;.!?…]*(.*)$/su);
    const addressed=named || (mention && mention[1]===message.client?.user?.id?[mention[0],mention[2]]:null);
    const reply=Boolean(session && message.reference?.messageId===session.messageId);
    if(!addressed && (message.reference && !reply || !session || !reply && now>=(session.implicitUntil??0)))return null;
    const phrase=learningPhrase(addressed?addressed[1]:content);
    return phrase?{phrase,collect:Boolean(addressed||reply)}:null;
}
function failure(error) {
    if(Date.now()>=unavailableUntil)console.warn('Kitsune learning temporarily unavailable:',error.code??'database error');
    unavailableUntil=Date.now()+config.failureBackoffMs;
}
async function getAliases(guildId) {
    const now=Date.now();
    if(!enabled() || now<unavailableUntil)return new Map();
    const prior=cache.get(guildId);
    if(prior?.pending)return prior.pending;
    if(prior && now<prior.until)return prior.aliases;
    if(!cache.has(guildId) && cache.size>=config.maxCachedGuilds)cache.delete(cache.keys().next().value);
    const entry={aliases:new Map(),until:0,pending:null};cache.set(guildId,entry);
    entry.pending=(async()=>{
        try {
            const rows=await repository().getLearnedPhrases(guildId);
            const aliases=new Map(rows.filter(row=>Object.hasOwn(config.intents,row.intent))
                .map(row=>[row.phrase,config.intents[row.intent]]));
            if(cache.get(guildId)===entry){entry.aliases=aliases;entry.until=Date.now()+config.cacheTtlMs;}
            return aliases;
        } catch(error){failure(error);return new Map();}
        finally{entry.pending=null;}
    })();
    return entry.pending;
}
function invalidateAliases(guildId){cache.delete(guildId);}
async function collectUnknown(message,input) {
    const now=Date.now();
    if(!enabled() || !input?.collect || now<unavailableUntil)return;
    for(const [key,until]of rates)if(until<=now)rates.delete(key);
    const userKey=message.guildId+':'+message.author.id,guildKey='guild:'+message.guildId;
    if(now<(rates.get(userKey)??0) || now<(rates.get(guildKey)??0))return;
    while(rates.size>config.maxRateKeys-2)rates.delete(rates.keys().next().value);
    rates.set(userKey,now+config.recordCooldownMs);rates.set(guildKey,now+2000);
    try{await repository().recordUnknownPhrase(message.guildId,input.phrase);}catch(error){failure(error);}
}
module.exports={inputForLearning,getAliases,invalidateAliases,collectUnknown,enabled};
