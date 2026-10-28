'use strict';
// One background worker, guild-scoped keyset pages; no XP changes or prestige grants.
function createReconciler({settings,query,changeRank,context,progression,factions,pause=()=>new Promise(resolve=>setTimeout(resolve,350)),report=console.log}){
 const jobs=new Map();let tail=Promise.resolve();
 async function run(guild){const counts={promoted:0,skipped:0,failed:0};let cursor='';
  for(;;){const row=await settings.getSettings(guild);if(!row.value.modules.progression||!row.value.progression?.extended)break;
   const {rows}=await query("SELECT user_id FROM kitsune_users WHERE guild_id=$1 AND user_id>$2 AND faction IN ('slayer','demon') ORDER BY user_id LIMIT 100",[guild.id,cursor]);if(!rows.length)break;
   for(const entry of rows){cursor=entry.user_id;try{const latest=await settings.getSettings(guild);if(!latest.value.modules.progression||!latest.value.progression?.extended)return counts;
    await context.run(guild,latest.value,async()=>{const {rows:profiles}=await query('SELECT faction,rank,level FROM kitsune_users WHERE guild_id=$1 AND user_id=$2',[guild.id,entry.user_id]);const user=profiles[0];if(!user||!Number.isSafeInteger(Number(user.level))||Number(user.level)<1){counts.skipped++;return;}
     const target=progression.getRankForLevel(user.faction,Number(user.level)),held=factions.getRank(user.faction,user.rank);if(!target?.automatic||(held&&target.level<=held.level)){counts.skipped++;return;}
     const roleId=latest.value.roles[progression.RANK_ROLE_KEYS[target.id]];if(!roleId){counts.skipped++;return;}
     const role=await guild.roles.fetch(roleId);if(!role||role.managed||!role.editable){counts.skipped++;return;}
     const member=await guild.members.fetch(entry.user_id);if(!member||member.user?.bot){counts.skipped++;return;}
     const higherRole=progression.getAllRanks(user.faction).some(rank=>rank.level>target.level&&member.roles?.cache?.has(latest.value.roles[progression.RANK_ROLE_KEYS[rank.id]]));if(higherRole){counts.skipped++;return;}
     const result=await changeRank(member,null,{automatic:true,announce:false,refreshUnlocks:false});if(result.changed)counts.promoted++;else counts.skipped++;await pause();
    });
   }catch(error){if(error?.code===10007)counts.skipped++;else counts.failed++;}}
  }
  return counts;
 }
 function enqueue(guild){const prior=jobs.get(guild.id);if(prior){prior.again=true;return prior.promise;}const job={again:false,promise:null};job.promise=tail.catch(()=>{}).then(async()=>{let result;do{job.again=false;result=await run(guild);}while(job.again);report('Rank sync completed:',guild.id,JSON.stringify(result));return result;}).catch(error=>{report('Rank sync incomplete:',guild.id,'Save settings or restart to retry.');return {failed:1};}).finally(()=>jobs.delete(guild.id));jobs.set(guild.id,job);tail=job.promise;return job.promise;}
 return {enqueue};
}
let worker;
function queueRankReconciliation(guild){if(!worker)worker=createReconciler({settings:require('../database/guildSettings'),query:require('../database/connection').query,changeRank:require('./rankService').changeRank,context:require('../utils/guildContext'),progression:require('../config/progression'),factions:require('./factionHandler')});return worker.enqueue(guild);}
function startRankReconciliation(client){for(const guild of client.guilds.cache.values())void queueRankReconciliation(guild);}
module.exports={createReconciler,queueRankReconciliation,startRankReconciliation};
