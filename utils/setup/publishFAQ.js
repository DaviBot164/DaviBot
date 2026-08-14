const {
    PermissionFlagsBits
} = require('discord.js');

const {
    createEmbed,
    createSuccessEmbed,
    createErrorEmbed
} = require('../embeds');

const setupChannels =
    require('../../config/setupChannels');

/**
 * Get and validate the
 * THE Ⅹ SINS information channel.
 *
 * @param {import('discord.js').StringSelectMenuInteraction} interaction
 * @returns {Promise<import('discord.js').TextBasedChannel|null>}
 */
async function getFAQChannel(
    interaction
) {
    const informationChannel =
        await interaction.guild.channels
            .fetch(
                setupChannels
                    .informationChannelId
            )
            .catch(
                () => null
            );

    if (
        !informationChannel ||
        !informationChannel.isTextBased()
    ) {
        await interaction.editReply({
            embeds: [
                createErrorEmbed(
                    '❌ Information Channel Missing',
                    'The configured information channel could not be found.'
                )
            ],

            components:
                []
        });

        return null;
    }

    const botMember =
        interaction.guild.members.me;

    if (!botMember) {
        await interaction.editReply({
            embeds: [
                createErrorEmbed(
                    '❌ Evelynn Unavailable',
                    'Evelynn could not access her server member record.'
                )
            ],

            components:
                []
        });

        return null;
    }

    const permissions =
        informationChannel.permissionsFor(
            botMember
        );

    if (
        !permissions?.has([
            PermissionFlagsBits.ViewChannel,
            PermissionFlagsBits.SendMessages,
            PermissionFlagsBits.EmbedLinks
        ])
    ) {
        await interaction.editReply({
            embeds: [
                createErrorEmbed(
                    '❌ Missing Permissions',
                    [
                        `Evelynn cannot publish the FAQ in ${informationChannel}.`,
                        '',
                        'Required:',
                        '• View Channel',
                        '• Send Messages',
                        '• Embed Links'
                    ].join('\n')
                )
            ],

            components:
                []
        });

        return null;
    }

    return informationChannel;
}

/**
 * Publish the official
 * THE Ⅹ SINS FAQ.
 *
 * @param {import('discord.js').StringSelectMenuInteraction} interaction
 * @returns {Promise<void>}
 */
async function publishFAQ(
    interaction
) {
    const informationChannel =
        await getFAQChannel(
            interaction
        );

    if (!informationChannel) {
        return;
    }

    const faqEmbed =
        createEmbed({
            title:
                'Ⅹ・FAQ',

            description:
                [
                    '**Quick answers to common questions.**',
                    '',
                    'Check here before opening a support ticket.'
                ].join('\n'),

            color:
                '#5B3A78',

            thumbnail:
                interaction.guild.iconURL({
                    size:
                        512,

                    forceStatic:
                        false
                }) ??
                interaction.client.user
                    .displayAvatarURL({
                        size:
                            512,

                        forceStatic:
                            false
                    }),

            fields: [
                {
                    name:
                        '✦・HOW DO I GET ACCESS?',

                    value:
                        [
                            'Verify your Roblox account through **Bloxlink**.',
                            '',
                            '**◇・UNSWORN** → **✦・SWORN**',
                            '',
                            'If verification fails, open a support ticket.'
                        ].join('\n'),

                    inline:
                        false
                },

                {
                    name:
                        '📜・WHERE ARE THE RULES?',

                    value:
                        [
                            'Read the **Code of Sins** in the information section.',
                            '',
                            'The Code applies to every member and Staff role.'
                        ].join('\n'),

                    inline:
                        false
                },

                {
                    name:
                        '🎫・HOW DO I CONTACT STAFF?',

                    value:
                        [
                            'Open a private support ticket.',
                            '',
                            'Use tickets for reports, appeals, verification issues, private evidence or server problems.'
                        ].join('\n'),

                    inline:
                        false
                },

                {
                    name:
                        '⚖️・CAN I APPEAL A PUNISHMENT?',

                    value:
                        [
                            '**Yes.** Submit an appeal through the Ticket System.',
                            '',
                            'Explain what happened and include relevant evidence.',
                            '',
                            '-# An appeal does not guarantee the punishment will be removed.'
                        ].join('\n'),

                    inline:
                        false
                }
            ]
        });    faqEmbed.addFields(
        {
            name:
                '🤖・WHO IS EVELYNN?',

            value:
                [
                    '**Evelynn** is the public guardian and companion of **THE Ⅹ SINS**.',
                    '',
                    'She manages server systems through the internal **Umbra Core**.'
                ].join('\n'),

            inline:
                false
        },

        {
            name:
                '🛡️・WHY WAS MY MESSAGE REMOVED?',

            value:
                [
                    'Automated protection may remove messages containing:',
                    '',
                    '• Prohibited language',
                    '• Spam',
                    '• Unauthorized invites',
                    '• Malicious links',
                    '• Filter bypass attempts'
                ].join('\n'),

            inline:
                false
        },

        {
            name:
                '⚔️・ARE EXPLOITS ALLOWED?',

            value:
                [
                    '**No.**',
                    '',
                    'Scripts, exploits, cheats and unfair tools are forbidden.',
                    '',
                    '-# Serious violations may result in immediate moderation.'
                ].join('\n'),

            inline:
                false
        },

        {
            name:
                '◆・HOW DO I PROGRESS?',

            value:
                [
                    'Stay active and participate in the community.',
                    '',
                    'You may earn levels, achievements, titles and progression roles.',
                    '',
                    'Sin ranks are earned separately through competition.'
                ].join('\n'),

            inline:
                false
        },

        {
            name:
                'Ⅹ・STILL NEED HELP?',

            value:
                [
                    'Ask in the appropriate community channel for general questions.',
                    '',
                    'For private or moderation-related matters, open a support ticket.'
                ].join('\n'),

            inline:
                false
        }
    );

    faqEmbed.setAuthor({
        name:
            'Evelynn • THE Ⅹ SINS',

        iconURL:
            interaction.client.user
                .displayAvatarURL({
                    size:
                        256,

                    forceStatic:
                        false
                })
    });

    faqEmbed.setFooter({
        text:
            'TTS • FAQ',

        iconURL:
            interaction.guild.iconURL({
                size:
                    128,

                forceStatic:
                    false
            }) ??
            interaction.client.user
                .displayAvatarURL({
                    size:
                        128,

                    forceStatic:
                        false
                })
    });

    faqEmbed.setTimestamp();

    await informationChannel.send({
        embeds: [
            faqEmbed
        ],

        allowedMentions: {
            parse:
                []
        }
    });

    await interaction.editReply({
        embeds: [
            createSuccessEmbed(
                '✅ FAQ Published',
                `The FAQ was published in ${informationChannel}.`
            )
        ],

        components:
            []
    });

    console.log(
        '======================================'
    );

    console.log(
        'Ⅹ FAQ Published'
    );

    console.log(
        `📍 Channel: ${informationChannel.name}`
    );

    console.log(
        `🛡️ Published By: ${interaction.user.tag}`
    );

    console.log(
        `🏰 Server: ${interaction.guild.name}`
    );

    console.log(
        '======================================'
    );
}

module.exports = {
    publishFAQ
};