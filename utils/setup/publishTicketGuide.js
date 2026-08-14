const {
    PermissionFlagsBits
} = require('discord.js');

const {
    createEmbed,
    createSuccessEmbed,
    createErrorEmbed
} = require('../embeds');

const TICKET_GUIDE_CHANNEL_ID =
    '1530989678553989261';

/**
 * Get and validate the
 * THE Ⅹ SINS support channel.
 *
 * @param {import('discord.js').StringSelectMenuInteraction} interaction
 * @returns {Promise<import('discord.js').TextBasedChannel|null>}
 */
async function getTicketGuideChannel(
    interaction
) {
    const ticketGuideChannel =
        await interaction.guild.channels
            .fetch(
                TICKET_GUIDE_CHANNEL_ID
            )
            .catch(
                () => null
            );

    if (
        !ticketGuideChannel ||
        !ticketGuideChannel.isTextBased()
    ) {
        await interaction.editReply({
            embeds: [
                createErrorEmbed(
                    '❌ Support Channel Missing',
                    'The configured support channel could not be found.'
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
        ticketGuideChannel.permissionsFor(
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
                        `Evelynn cannot publish support information in ${ticketGuideChannel}.`,
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

    return ticketGuideChannel;
}

/**
 * Publish the official
 * THE Ⅹ SINS support guide.
 *
 * @param {import('discord.js').StringSelectMenuInteraction} interaction
 * @returns {Promise<void>}
 */
async function publishTicketGuide(
    interaction
) {
    const ticketGuideChannel =
        await getTicketGuideChannel(
            interaction
        );

    if (!ticketGuideChannel) {
        return;
    }

    const guideEmbed =
        createEmbed({
            title:
                'Ⅹ・SUPPORT',

            description:
                [
                    '**Private help when you need it.**',
                    '',
                    'Use the Ticket System for matters that require Staff assistance.'
                ].join('\n'),

            color:
                '#5B3A78',

            thumbnail:
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
                        '🎫・WHEN TO OPEN A TICKET',

                    value:
                        [
                            'Open a ticket for:',
                            '',
                            '• Member reports',
                            '• Moderation appeals',
                            '• Verification issues',
                            '• Server or bot problems',
                            '• Private evidence',
                            '• Serious rule violations'
                        ].join('\n'),

                    inline:
                        false
                },

                {
                    name:
                        '✕・DO NOT USE TICKETS FOR',

                    value:
                        [
                            '• Spam or jokes',
                            '• General conversation',
                            '• Repeated requests',
                            '• Promotion requests',
                            '• Questions already answered in the FAQ',
                            '',
                            '-# Misuse of the Ticket System may result in moderation.'
                        ].join('\n'),

                    inline:
                        false
                },

                {
                    name:
                        '📝・MAKE IT CLEAR',

                    value:
                        [
                            'Explain what happened and include:',
                            '',
                            '• Correct usernames',
                            '• Relevant details',
                            '• Screenshots or evidence when available',
                            '',
                            '**Never falsify evidence.**'
                        ].join('\n'),

                    inline:
                        false
                }
            ]
        });    guideEmbed.addFields(
        {
            name:
                '🔒・PRIVACY & SAFETY',

            value:
                [
                    'Keep ticket discussions private.',
                    '',
                    '• Never share passwords or login codes',
                    '• Never send malicious files or links',
                    '• Do not expose private personal information',
                    '• Share only evidence relevant to the case'
                ].join('\n'),

            inline:
                false
        },

        {
            name:
                '⏳・WHAT HAPPENS NEXT?',

            value:
                [
                    'After opening a ticket:',
                    '',
                    '1. Explain the issue clearly.',
                    '2. Staff reviews the information.',
                    '3. Additional evidence may be requested.',
                    '4. A decision or solution is provided.',
                    '',
                    '-# Response time depends on Staff availability.'
                ].join('\n'),

            inline:
                false
        },

        {
            name:
                'Ⅹ・OPEN A TICKET',

            value:
                [
                    'Use the **Open Ticket** button on the support panel.',
                    '',
                    'Keep only one active ticket unless Staff asks you to open another.'
                ].join('\n'),

            inline:
                false
        }
    );

    guideEmbed.setAuthor({
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

    guideEmbed.setFooter({
        text:
            'TTS • Support',

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

    guideEmbed.setTimestamp();

    await ticketGuideChannel.send({
        embeds: [
            guideEmbed
        ],

        allowedMentions: {
            parse:
                []
        }
    });

    await interaction.editReply({
        embeds: [
            createSuccessEmbed(
                '✅ Support Guide Published',
                `The support guide was published in ${ticketGuideChannel}.`
            )
        ],

        components:
            []
    });

    console.log(
        '======================================'
    );

    console.log(
        'Ⅹ Support Guide Published'
    );

    console.log(
        `📍 Channel: ${ticketGuideChannel.name}`
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
    publishTicketGuide
};