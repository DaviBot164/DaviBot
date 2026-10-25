const {pool}=require('./connection');
const {validate}=require('../handlers/kitsune/knowledge');
const run=(client,text,values=[])=>client.query({text,values,query_timeout:2000});
async function use(callback){let late=false,timer;const pending=pool.connect();pending.then(c=>{if(late)c.release();},()=>{});let client;try{client=await Promise.race([pending,new Promise((_,reject)=>{timer=setTimeout(()=>{late=true;reject(Error('Knowledge database timed out.'));},2500);})]);}finally{clearTimeout(timer);}try{return await callback(client);}finally{client.release();}}
async function saveKnowledge(guildId,input,ownerId){
 const row=validate(input);const target=input.targetId??null;
 if(['member','role','channel'].includes(row.kind)&&!/^\d{16,22}$/u.test(target??''))throw Error('Select the matching server member, role or channel.');
 return use(async c=>{await run(c,'BEGIN');try{
  await run(c,'SELECT pg_advisory_xact_lock(hashtextextended($1, 0))',['kitsune-learning:'+guildId]);
  const existing=await run(c,'SELECT name FROM kitsune_knowledge WHERE guild_id=$1 AND name=$2',[guildId,row.key]);
  if(!existing.rows.length){const count=await run(c,'SELECT COUNT(*)::integer AS count FROM kitsune_knowledge WHERE guild_id=$1',[guildId]);if(count.rows[0].count>=300)throw Error('Knowledge limit reached. Remove an unused entry first.');}
  await run(c,`INSERT INTO kitsune_knowledge(guild_id,name,kind,explanation,target_id,taught_by) VALUES($1,$2,$3,$4,$5,$6)
   ON CONFLICT(guild_id,name) DO UPDATE SET kind=EXCLUDED.kind,explanation=EXCLUDED.explanation,target_id=EXCLUDED.target_id,taught_by=EXCLUDED.taught_by,updated_at=NOW()`,[guildId,row.key,row.kind,row.explanation,['member','role','channel'].includes(row.kind)?target:null,ownerId]);
  await run(c,'DELETE FROM kitsune_unknown_phrases WHERE guild_id=$1 AND phrase=$2',[guildId,row.key]);
  await run(c,'COMMIT');return row;
 }catch(e){await run(c,'ROLLBACK').catch(()=>{});throw e;}});
}
async function getKnowledge(guildId){return use(async c=>(await run(c,'SELECT name,kind,explanation,target_id FROM kitsune_knowledge WHERE guild_id=$1 ORDER BY name LIMIT 300',[guildId])).rows);}
async function listKnowledge(guildId,page=1){return use(async c=>(await run(c,'SELECT name,kind,explanation,target_id FROM kitsune_knowledge WHERE guild_id=$1 ORDER BY name LIMIT 10 OFFSET $2',[guildId,(page-1)*10])).rows);}
async function removeKnowledge(guildId,name){return use(async c=>(await run(c,'DELETE FROM kitsune_knowledge WHERE guild_id=$1 AND name=$2 RETURNING name',[guildId,name])).rows.length>0);}
module.exports={saveKnowledge,getKnowledge,listKnowledge,removeKnowledge};
