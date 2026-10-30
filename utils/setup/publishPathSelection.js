const {serverText}=require("../guildContext");
const { ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const channels = require('../../config/channels');
const brand = require('../../config/brand');
const { createEmbed } = require('../embeds');
const { publishSetupMessage } = require('./publishSetupMessage');
function buildPathComponents() {
    return [
        new ActionRowBuilder()
            .addComponents(new ButtonBuilder()
            .setCustomId('kitsune:path:slayer')
            .setLabel(serverText('Become a Slayer'))
            .setEmoji('⚔️')
            .setStyle(ButtonStyle.Primary), new ButtonBuilder()
            .setCustomId('kitsune:path:demon')
            .setLabel(serverText('Become a Demon'))
            .setEmoji('🩸')
            .setStyle(ButtonStyle.Danger))
    ];
}
const { publishGuide } = require('./guidePresentation');
function pathSpec() {
    const settings=require('../guildContext').current();
    if(settings.theme==='neutral')return {key:'path_selection',title:'Choose Your Path',intro:'Choose a community progression path.',fields:[{name:settings.paths.slayer,value:require('../../config/progression').getRanks('slayer').map(r=>r.name).join(' → ')},{name:settings.paths.demon,value:require('../../config/progression').getRanks('demon').map(r=>r.name).join(' → ')}]};
    return {
        key:'path_selection', title: 'Choose Your Path',
        intro: serverText('**Two paths. One Blood Moon. Your next chapter.**'),
        fields: [
            { name: serverText('⚔️ Slayer'), value: require('../../config/setupGuides').rankLines('slayer'), inline: true },
            { name: serverText('🩸 Demon'), value: require('../../config/setupGuides').rankLines('demon'), inline: true },
            { name: 'Before you choose', value: serverText('This selects your Blood Moon server faction. It does not verify your account, unlock verified-only channels, or change your Roblox character. Final ranks require a trial or staff promotion.') }
        ], quote: 'Choose the path you want to build. Then give it a little effort.'
    };
}
async function publishPathSelection(guild){return publishGuide(guild,channels.slayers2,pathSpec(),buildPathComponents());}
module.exports = {
    buildPathComponents,pathSpec,
    publishPathSelection
};
