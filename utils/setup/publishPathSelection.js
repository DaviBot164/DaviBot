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

async function publishPathSelection(guild) {
    const channel =
        guild.channels.cache.get(
            channels.slayers2
        );

    if (!channel?.isTextBased()) {
        throw new Error(
            'Slayers 2 channel could not be found.'
        );
    }

    const title =
        'Choose Your Path';

    const embed =
        createEmbed(
            title,
            [
                'The Blood Moon watches as two paths stand before you.',
                '',
                '⚔️ **Slayer Path**',
                'Join the Demon Slayer Corps, grow stronger and rise through the Slayer ranks.',
                '',
                '🩸 **Demon Path**',
                'Embrace the night, grow in power and ascend through the Demon ranks.',
                '',
                '**Choose carefully. Your path defines your progression.**'
            ].join('\n')
        )
            .setFooter({
                text:
                    brand.footer
            });

    return publishSetupMessage(
        channel,
        {
            embeds: [
                embed
            ],
            components:
                buildPathComponents()
        },
        title
    );
}

module.exports = {
    buildPathComponents,
    publishPathSelection
};