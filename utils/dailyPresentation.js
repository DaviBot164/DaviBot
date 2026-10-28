const {createEmbed}=require('./embeds');
const {streakInfo}=require('../config/missions');
function bar(current,total,size=10){const length=Number.isFinite(Number(size))?Math.max(1,Math.min(20,Math.floor(Number(size)))):10;const value=Number(current),goal=Number(total);const ratio=Number.isFinite(value)&&Number.isFinite(goal)&&goal>0?Math.max(0,Math.min(1,value/goal)):0;const filled=Math.floor(ratio*length);return '▰'.repeat(filled)+'▱'.repeat(length-filled);}
function dailyEmbed(result){
 const streak=Math.max(0,Math.floor(Number(result.streak)||0)),info=streakInfo(Math.max(1,streak));
 const remaining=Number(result.remainingMs),next=result.nextClaimAt?new Date(result.nextClaimAt).getTime():Number.isFinite(remaining)&&remaining>0?Date.now()+remaining:NaN;
 const nextText=Number.isFinite(next)?`<t:${Math.floor(next/1000)}:R>\n<t:${Math.floor(next/1000)}:f>`:'Open Daily Drop again to check availability.';
 const lines=result.claimed?[`**+${result.reward} XP collected.**`,`Base **${result.baseReward??info.base} XP**${result.streakBonus?` · Streak bonus **+${result.streakBonus} XP**`:''}`,result.levelsGained?`Level up · You are now **Level ${result.level}**.`:'',result.streakReset?'A fresh streak starts here. Your previous XP is safe.':''].filter(Boolean):['Your reward has already been collected.','Your XP is safe — the next drop unlocks at the time below.'];
 return createEmbed(result.claimed?'🌙 Daily Drop · Collected':'🌙 Daily Drop · On cooldown',lines.join('\n')).addFields(
 {name:'🔥 Daily streak',value:`**${streak} day${streak===1?'':'s'}**\nClaim every 24–48 hours to keep it going.`,inline:true},
 {name:'🎁 Next streak bonus',value:`**+${info.nextBonus} XP** in **${info.nextIn} more claim${info.nextIn===1?'':'s'}**.`,inline:true},
 {name:`30-day track · Day ${info.day}/30`,value:`\`${bar(info.day,30)}\`\nBonus milestones: **3 · 7 · 14 · 30**. The track repeats after day 30.`},
 {name:'⏱️ Next daily drop',value:nextText},
 {name:'Keep making progress',value:'Open **Missions** from the training panel to check your personal goals.'});
}
module.exports={dailyEmbed,bar};
