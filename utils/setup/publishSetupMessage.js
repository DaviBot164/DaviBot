const {guildId}=require('../guildContext');
async function findSetupMessage(channel,clientUserId,embedTitle){const messages=await channel.messages.fetch({limit:100});return messages.find(message=>message.author.id===clientUserId&&message.embeds.some(embed=>embed.title===embedTitle))??null;}
async function publishSetupMessage(channel,payload,embedTitle,pageKey=embedTitle){
 const bot=channel.client.user.id;const targetGuild=channel.guildId??channel.guild?.id;
 if(!guildId()){const old=await findSetupMessage(channel,bot,embedTitle);return old?old.edit(payload):channel.send(payload);}
 if(targetGuild!==guildId())throw Error('Setup channel belongs to another guild.');
 const {pool}=require('../../database/connection');const client=await pool.connect();
 try{await client.query('SELECT pg_advisory_lock(hashtextextended($1,0))',['kitsune-setup:'+targetGuild+':'+pageKey]);
 const row=(await client.query('SELECT channel_id,message_id FROM kitsune_setup_posts WHERE guild_id=$1 AND page_key=$2',[targetGuild,pageKey])).rows[0];let existing=null;
 if(row?.channel_id===channel.id){try{existing=await channel.messages.fetch(row.message_id);}catch(error){if(error.code!==10008)throw error;}if(existing&&existing.author.id!==bot)throw Error('Stored setup message is not owned by this bot.');}
 if(!row)existing=await findSetupMessage(channel,bot,embedTitle);
 const message=existing?await existing.edit(payload):await channel.send(payload);
 await client.query('INSERT INTO kitsune_setup_posts(guild_id,page_key,channel_id,message_id) VALUES($1,$2,$3,$4) ON CONFLICT(guild_id,page_key) DO UPDATE SET channel_id=EXCLUDED.channel_id,message_id=EXCLUDED.message_id',[targetGuild,pageKey,channel.id,message.id]);return message;
 }finally{await client.query('SELECT pg_advisory_unlock(hashtextextended($1,0))',['kitsune-setup:'+targetGuild+':'+pageKey]).catch(()=>{});client.release();}
}
module.exports={publishSetupMessage};
