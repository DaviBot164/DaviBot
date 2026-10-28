const {createEmbed}=require('../embeds');
const {themeFor,BOARD_BONUS}=require('../../config/missions');
const {bar}=require('../dailyPresentation');
function decorateQuestPanel(panel,data){
 const theme=data.theme??themeFor(data.cycleId),quests=data.quests??[];
 const claimed=quests.filter(q=>q.claimed).length,ready=quests.filter(q=>q.completed&&!q.claimed).length,active=quests.length-claimed-ready;
 const readyXP=quests.filter(q=>q.completed&&!q.claimed).reduce((total,q)=>total+Number(q.reward),0);
 const embed=createEmbed(`📜 Missions · ${theme.name}`,[`**${claimed}/${quests.length} rewards collected** · ${ready} ready · ${active} in progress`,ready?`**+${readyXP} XP** is ready below. Choose the green mission button to collect it.`:claimed===quests.length?'Board complete. Your next missions arrive when this cycle resets.':'Make progress naturally, then return to collect your rewards.'].join('\n'));
 for(const q of quests){const name=theme.names[q.id]??q.name;const current=Math.max(0,Math.min(Number(q.current)||0,Number(q.required)||0)),required=Number(q.required)||0;const goal=q.id==='blood_moon_devotion'?'Collect your daily drop.':`Send ${required} XP-eligible messages this cycle.`;embed.addFields({name:`${q.claimed?'✅':q.completed?'🎁':'💬'} ${name}`,value:[goal,`\`${bar(current,required)}\` **${current}/${required}**`,`**+${q.reward} XP** · ${q.claimed?'Collected':q.completed?'Ready — collect below':'In progress'}`].join('\n')});}
 const bonus=data.boardBonus??BOARD_BONUS;
 embed.addFields({name:data.boardBonusClaimed?'🏆 Board bonus · Collected':'🏆 Clear the board',value:data.boardBonusClaimed?`Your **+${bonus} XP** board bonus has been collected.`:`Collect all **${quests.length}** mission rewards to receive an extra **+${bonus} XP**. It is included with the final claim.`});
 const reset=new Date(data.nextResetAt).getTime();
 embed.addFields({name:'⏱️ Cycle resets',value:Number.isFinite(reset)?`<t:${Math.floor(reset/1000)}:R> · <t:${Math.floor(reset/1000)}:f>\nCollect ready rewards before the reset.`:'Open Missions again to check the reset time.'},{name:'How progress counts',value:'Only messages eligible for XP count. Rapid spam does not help. Open **Missions** again from the training panel to refresh your progress.'});
 // Keep the existing action and cycle IDs. A label must distinguish claiming from viewing.
 for(const row of panel.components??[])for(const button of row.components??[]){const id=button.data?.custom_id??button.customId;const quest=quests.find(q=>typeof id==='string'&&id.includes(`${q.id}:`));if(quest&&typeof button.setLabel==='function'){const name=theme.names[quest.id]??quest.name;button.setLabel(`${quest.claimed?'Collected · ':quest.completed?'Claim · ':''}${name}`.slice(0,80));}}
 return{...panel,embeds:[embed],allowedMentions:{parse:[]}};
}
module.exports={decorateQuestPanel};
