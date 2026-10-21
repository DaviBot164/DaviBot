const {
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle
} = require('discord.js');

const channels =
    require('../../config/channels');

const brand =
    require('../../config/brand');

const {
    createEmbed
} = require('../embeds');

const {
    publishSetupMessage
} = require('./publishSetupMessage');

function buildPathComponents() {
    return [
        new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId(
                        'akane:path:slayer'
                    )
                    .setLabel(
                        'Become a Slayer'
                    )
                    .setEmoji('⚔️')
                    .setStyle(
                        ButtonStyle.Primary
                    ),

                new ButtonBuilder()
                    .setCustomId(
                        'akane:path:demon'
                    )
                    .setLabel(
                        'Become a Demon'
                    )
                    .setEmoji('🩸')
                    .setStyle(
                        ButtonStyle.Danger
                    )
            )
    ];
}

const { publishGuide } = require('./guidePresentation');
async function publishPathSelection(guild) {
    return publishGuide(guild,channels.slayers2,{
        title:'Choose Your Path',
        intro:'**Two paths. One Blood Moon. Your next chapter.**',
        fields:[
            {name:'⚔️ Slayer',value:'Join the Corps. Advance through Slayer, Mizunoe and Kinoe; aim for Hashira through Trials or staff promotion.',inline:true},
            {name:'🩸 Demon',value:'Step into the night. Advance through Demon and Lower Moon; aim for Upper Moon through Trials or staff promotion.',inline:true},
            {name:'Before you choose',value:'This selects your Blood Moon server faction. It does not change your Roblox character or in-game progression.'}
        ],quote:'Choose the path you want to build. Then give it a little effort.'
    },buildPathComponents());
}

module.exports = {
    buildPathComponents,
    publishPathSelection
};
