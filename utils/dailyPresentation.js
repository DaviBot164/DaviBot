const { createEmbed } = require('./embeds');
const { streakInfo } = require('../config/missions');
function bar(current,total,size=10){const n=Math.max(0,Math.min(size,Math.floor(current/total*size)));return '▰'.repeat(n)+'▱'.repeat(size-n);}
function dailyEmbed(result) {
    const streak=Math.max(0,Number(result.streak)||0);
    const info=streakInfo(Math.max(1,streak));
    const remaining=Math.max(0,Number(result.remainingMs)||0);
    const next=result.nextClaimAt ? new Date(result.nextClaimAt).getTime() : Date.now()+remaining;
    const lines=result.claimed ? [
        `**Daily Drop:** +${result.reward} XP`,
        `Base **${result.baseReward ?? info.base} XP**${result.streakBonus ? ` • Streak bonus **+${result.streakBonus} XP**` : ''}`,
        `**Streak:** ${streak} day${streak===1?'':'s'} • **Level ${result.level}**`,
        result.streakReset ? 'A fresh run starts here. Your previous XP is safe.' : '',
        result.levelsGained ? `⚔️ **Level up!** +${result.levelsGained}` : '',
        '',
        `**30-day track • Day ${info.day}**`,bar(info.day,30),
        `Next bonus in **${info.nextIn} claim${info.nextIn===1?'':'s'}**: **+${info.nextBonus} XP**`,
        '',`Next drop: <t:${Math.floor(next/1000)}:R>`,
        'Claim again 24–48 hours after this drop to continue the streak.',
        '', '*Kitsune: Another day, another little victory. Keep that rhythm.*'
    ] : [
        'Your daily drop has already been collected.',
        `**Streak:** ${streak} day${streak===1?'':'s'}`,
        `Next drop: <t:${Math.floor(next/1000)}:R>`,
        '', 'While you wait, open **Missions** from the training panel.'
    ];
    return createEmbed(result.claimed?'🦊 Daily Drop • Collected':'🌙 Daily Drop • Recharging',lines.filter(x=>x!==null).join('\n'));
}
module.exports={dailyEmbed,bar};
