const {enabled}=require('../utils/guildContext');
const groups={progression:['profile','leaderboard','corps','path','setrank','removerank','rankhistory','testlevel'],moderation:['unban','history','announce','ban','kick','clear','timeout','untimeout','lock','unlock','slowmode','warn','warnings','unwarn','case','emergency'],tickets:['ticketpanel'],welcome:['testwelcome']};
function moduleFor(name){return Object.entries(groups).find(([,names])=>names.includes(name))?.[0];}
function allowed(interaction){let feature=moduleFor(interaction.commandName);const id=String(interaction.customId??'');if(id.startsWith('kitsune:path'))feature='progression';if(/^(?:kitsune:)?ticket/u.test(id))feature='tickets';return !feature||enabled(feature);}
module.exports={moduleFor,allowed};
