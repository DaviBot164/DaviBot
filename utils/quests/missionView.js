const { createEmbed } = require('../embeds');
const { themeFor, BOARD_BONUS } = require('../../config/missions');
const { bar } = require('../dailyPresentation');
function decorateQuestPanel(panel,data) {
    const theme=data.theme??themeFor(data.cycleId);
    const quests=data.quests??[];
    const claimed=quests.filter(q=>q.claimed).length;
    const ready=quests.filter(q=>q.completed&&!q.claimed).length;
    const embed=createEmbed(`🦊 Mission Board • ${theme.name}`,[
        `*Akane: ${theme.quote}*`,
        '',`**Rewards collected:** ${claimed}/${quests.length} • **Ready to claim:** ${ready}`,
        `**Clear bonus:** +${data.boardBonus??BOARD_BONUS} XP${data.boardBonusClaimed?' • Collected':' • Collect all three mission rewards'}`,
        '',`Refresh: <t:${Math.floor(new Date(data.nextResetAt).getTime()/1000)}:R>`,
        'Message progress counts only activity eligible for XP. Rapid spam does not speed it up.'
    ].join('\n'));
    for(const q of quests){
        const name=theme.names[q.id]??q.name;
        const goal=q.id==='blood_moon_devotion'?'Collect your daily drop.':`Send ${q.required} XP-eligible messages during this cycle.`;
        embed.addFields({name:`${q.claimed?'✅':q.completed?'🎁':'◻️'} ${name}`,value:[
            goal,`${bar(q.current,q.required)} **${q.current}/${q.required}**`,
            `**+${q.reward} XP** • ${q.claimed?'Collected':q.completed?'Ready to collect':'In progress'}`
        ].join('\n')});
    }
    // Retain the established component IDs and cycle IDs; only labels change.
    for(const row of panel.components??[])for(const button of row.components??[]){
        const customId=button.data?.custom_id??button.customId;
        const quest=quests.find(q=>typeof customId==='string'&&customId.includes(`${q.id}:`));
        if(quest&&typeof button.setLabel==='function')button.setLabel((theme.names[quest.id]??quest.name).slice(0,80));
    }
    return {...panel,embeds:[embed],allowedMentions:{parse:[]}};
}
module.exports={decorateQuestPanel};
