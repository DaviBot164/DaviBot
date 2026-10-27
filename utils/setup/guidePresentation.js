const { createEmbed } = require('../embeds');
const { publishSetupMessage } = require('./publishSetupMessage');
function buildGuide(guild,spec){
    if(!spec)throw new Error('Unknown setup guide.');
    const embed=createEmbed(spec.title,spec.intro).setColor(require('../../config/brand').color);
    embed.addFields(...spec.fields);
    if(spec.quote)embed.addFields({name:'🦊 A word from Kitsune',value:`*${spec.quote}*`});
    const icon=guild.iconURL({size:256});if(icon)embed.setThumbnail(icon);
    return embed;
}
async function publishGuide(guild,channelId,spec,components=[]){
    if(!channelId)throw new Error('Choose a destination channel in Studio first.');
    const channel=await guild.channels.fetch(channelId);
    if(!channel?.isTextBased?.()||typeof channel.send!=='function')throw new Error(`Guide channel unavailable: ${spec.title}`);
    return publishSetupMessage(channel,{embeds:[buildGuide(guild,spec)],components,allowedMentions:{parse:[]}},spec.title,spec.key??spec.title);
}
module.exports={buildGuide,publishGuide};
