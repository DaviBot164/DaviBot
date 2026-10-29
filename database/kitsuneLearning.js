// Read-only compatibility export. Existing taught phrase data is retained.
const {query}=require('./connection');
async function getLearnedPhrases(guildId){return (await query('SELECT phrase,intent FROM kitsune_learned_phrases WHERE guild_id=$1 ORDER BY phrase LIMIT 300',[guildId])).rows;}
module.exports={getLearnedPhrases};
