const {pool}=require('./connection');
const config=require('../config/akaneLearning');
const run=(client,text,values=[])=>client.query({text,values,query_timeout:2000});
async function connect() {
    let expired=false,timer;
    const pending=pool.connect();
    pending.then(client=>{if(expired)client.release();},()=>{});
    try {
        return await Promise.race([pending,new Promise((_,reject)=>{
            timer=setTimeout(()=>{expired=true;reject(new Error('Learning database connection timed out.'));},2500);
        })]);
    } finally {clearTimeout(timer);}
}
async function withClient(callback) {
    const client=await connect();
    try{return await callback(client);}finally{client.release();}
}
async function locked(guildId,callback) {
    return withClient(async client=>{
        await run(client,'BEGIN');
        try {
            // All writers share this lock: capacity checks also hold across bot instances.
            await run(client,'SELECT pg_advisory_xact_lock(hashtextextended($1, 0))',['akane-learning:'+guildId]);
            const result=await callback(client);
            await run(client,'COMMIT');return result;
        } catch(error){await run(client,'ROLLBACK').catch(()=>{});throw error;}
    });
}
async function getLearnedPhrases(guildId) {
    return withClient(async client=>(await run(client,
        'SELECT phrase, intent FROM akane_learned_phrases WHERE guild_id=$1 ORDER BY phrase LIMIT $2',
        [guildId,config.maxAliasesPerGuild])).rows);
}
async function teachPhrase(guildId,phrase,intent,taughtBy) {
    if(!Object.hasOwn(config.intents,intent))throw new Error('Choose a supported meaning.');
    return locked(guildId,async client=>{
        const existing=await run(client,'SELECT intent FROM akane_learned_phrases WHERE guild_id=$1 AND phrase=$2',[guildId,phrase]);
        if(!existing.rows.length) {
            const count=await run(client,'SELECT COUNT(*)::integer AS count FROM akane_learned_phrases WHERE guild_id=$1',[guildId]);
            if(count.rows[0].count>=config.maxAliasesPerGuild)throw new Error('Learned phrase limit reached. Forget an old phrase first.');
        }
        await run(client,`INSERT INTO akane_learned_phrases (guild_id,phrase,intent,taught_by)
            VALUES ($1,$2,$3,$4) ON CONFLICT (guild_id,phrase) DO UPDATE SET
            intent=EXCLUDED.intent,taught_by=EXCLUDED.taught_by,updated_at=NOW()`,[guildId,phrase,intent,taughtBy]);
        await run(client,'DELETE FROM akane_unknown_phrases WHERE guild_id=$1 AND phrase=$2',[guildId,phrase]);
    });
}
async function forgetPhrase(guildId,phrase) {
    return locked(guildId,async client=>(await run(client,
        'DELETE FROM akane_learned_phrases WHERE guild_id=$1 AND phrase=$2 RETURNING phrase',[guildId,phrase])).rows.length>0);
}
async function recordUnknownPhrase(guildId,phrase) {
    return locked(guildId,async client=>{
        // Fixed retention from first sighting: repeated spam cannot keep data forever.
        await run(client,'DELETE FROM akane_unknown_phrases WHERE guild_id=$1 AND expires_at<=NOW()',[guildId]);
        if((await run(client,'SELECT 1 FROM akane_learned_phrases WHERE guild_id=$1 AND phrase=$2',[guildId,phrase])).rows.length)return false;
        const updated=await run(client,`UPDATE akane_unknown_phrases SET
            seen_count=LEAST(seen_count::bigint+1,2147483647)::integer,last_seen_at=NOW()
            WHERE guild_id=$1 AND phrase=$2 RETURNING phrase`,[guildId,phrase]);
        if(updated.rows.length)return true;
        const count=await run(client,'SELECT COUNT(*)::integer AS count FROM akane_unknown_phrases WHERE guild_id=$1',[guildId]);
        if(count.rows[0].count>=config.maxUnknownPerGuild)return false;
        await run(client,`INSERT INTO akane_unknown_phrases (guild_id,phrase,expires_at)
            VALUES ($1,$2,NOW()+($3::integer * INTERVAL '1 day'))`,[guildId,phrase,config.unknownRetentionDays]);
        return true;
    });
}
async function listUnknownPhrases(guildId,page=1) {
    return withClient(async client=>{
        await run(client,'DELETE FROM akane_unknown_phrases WHERE guild_id=$1 AND expires_at<=NOW()',[guildId]);
        return (await run(client,`SELECT phrase,seen_count FROM akane_unknown_phrases
            WHERE guild_id=$1 AND expires_at>NOW() ORDER BY seen_count DESC,phrase LIMIT 10 OFFSET $2`,[guildId,(page-1)*10])).rows;
    });
}
async function listLearnedPhrases(guildId,page=1) {
    return withClient(async client=>(await run(client,`SELECT phrase,intent FROM akane_learned_phrases
        WHERE guild_id=$1 ORDER BY phrase LIMIT 10 OFFSET $2`,[guildId,(page-1)*10])).rows);
}
async function dismissUnknownPhrase(guildId,phrase) {
    return withClient(async client=>(await run(client,
        'DELETE FROM akane_unknown_phrases WHERE guild_id=$1 AND phrase=$2 RETURNING phrase',[guildId,phrase])).rows.length>0);
}
async function clearUnknownPhrases(guildId) {
    return locked(guildId,async client=>{
        const result=await run(client,'DELETE FROM akane_unknown_phrases WHERE guild_id=$1',[guildId]);
        return result.rowCount;
    });
}

module.exports={clearUnknownPhrases,getLearnedPhrases,teachPhrase,forgetPhrase,recordUnknownPhrase,listUnknownPhrases,listLearnedPhrases,dismissUnknownPhrase};
