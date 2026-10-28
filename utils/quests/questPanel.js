const {ActionRowBuilder,ButtonBuilder,ButtonStyle}=require('discord.js');
const {QUESTS}=require('../../config/missions');
const {decorateQuestPanel}=require('./missionView');
const BUTTON_PREFIX='kitsune:quest:claim:';
const ICONS=Object.freeze({active_soul:'💬',dedicated_warrior:'⚔️',blood_moon_devotion:'🌙'});
const UUID_PATTERN=/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
function buildQuestPanel(data){
 if(typeof data.cycleId!=='string'||!UUID_PATTERN.test(data.cycleId))throw Error('Invalid quest cycle ID.');
 const row=new ActionRowBuilder();
 for(const quest of data.quests){const config=Object.hasOwn(QUESTS,quest.id)?QUESTS[quest.id]:null;if(!config)continue;const available=quest.completed&&!quest.claimed;
 row.addComponents(new ButtonBuilder().setCustomId(`${BUTTON_PREFIX}${quest.id}:${data.cycleId}`).setLabel(config.name).setEmoji(ICONS[quest.id]??'📜').setStyle(available?ButtonStyle.Success:ButtonStyle.Secondary).setDisabled(!available));}
 return decorateQuestPanel({components:row.components.length?[row]:[]},data);
}
module.exports={BUTTON_PREFIX,buildQuestPanel};
