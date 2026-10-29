'use strict';
const {getRanks,getAllRanks,getRankForLevel}=require('../../config/progression');
const {current,enabled,factionName}=require('../../utils/guildContext');
const {xpForLevel}=require('../../utils/leveling');
function progressSummary(user){
 if(!user?.faction)return {state:'choose',description:'Choose a path to begin your rank journey. Your existing level and XP are kept.',fields:[]};
 const ranks=getRanks(user.faction);if(!ranks.length)return {state:'invalid',description:'Your saved path needs a staff check. Your progress has not been changed.',fields:[]};
 const level=Number(user.level),xp=Number(user.xp);if(!Number.isSafeInteger(level)||level<1||!Number.isSafeInteger(xp)||xp<0)return {state:'invalid',description:'I could not read your progress safely. Ask staff to check your profile.',fields:[]};
 const held=getAllRanks(user.faction).find(rank=>rank.id===user.rank),eligible=getRankForLevel(user.faction,level);
 const next=eligible&&(!held||eligible.level>held.level)?eligible:ranks.find(rank=>rank.level>(held?.level??0));
 const required=xpForLevel(level),percent=Math.min(100,Math.floor(xp/required*100));
 const fields=[{name:'Your progress',value:`**${factionName(user.faction)}** · Level **${level}**\nRank: **${held?.name??'Not assigned'}**`},{name:'Next level',value:`${xp.toLocaleString('en-US')} / ${required.toLocaleString('en-US')} XP · **${percent}%**\n${Math.max(0,required-xp).toLocaleString('en-US')} XP remaining to Level ${level+1}.`}];
 if(!next)return {state:'complete',description:'You hold the highest rank on this path. You can still earn levels, achievements and titles.',fields};
 const remaining=Math.max(0,next.level-level);let detail=`Required: **Level ${next.level}**\n`;
 if(next.automatic){detail+=remaining?`**${remaining} ${remaining===1?'level':'levels'} remaining.**\nAutomatic promotion when the level requirement is met.`:'**Level requirement met.**\nYour rank update is pending. If it does not appear, contact staff; extra levels are not required.';}
 else{detail+=remaining?`**${remaining} ${remaining===1?'level':'levels'} remaining** for the level requirement.\n`:'**Level requirement met.**\n';detail+=enabled('trials')?'A trial or staff promotion is still required. Level alone does not grant this rank.':'Staff promotion is still required. Level alone does not grant this rank.';}
 fields.push({name:'Next rank · '+next.name,value:detail});
 if(!current().progression?.extended&&held&&!ranks.some(rank=>rank.id===held.id))fields.push({name:'Your held rank is preserved',value:'Expanded ranks are currently disabled. Your next step follows this server’s active rank path.'});
 return {state:next.automatic?(remaining?'leveling':'pending'):'trial',description:'Your next step, based on this server’s current rank path. Server progress is separate from your in-game character.',fields};
}
module.exports={progressSummary};
