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

const SUPPORT_EMBED_COLOR =
    '#B026FF';

/**
 * Get the support channel.
 *
 * @param {import('discord.js').StringSelectMenuInteraction} interaction
 * @returns {Promise<import('discord.js').TextBasedChannel|null>}
 */
async function getTicketGuideChannel(
    interaction
) {
    const channel =
        await interaction.guild.channels
            .fetch(
                TICKET_GUIDE_CHANNEL_ID
            )
            .catch(
                () => null
            );

    if (
        !channel ||
        !channel.isTextBased() ||
        channel.isThread()
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
        channel.permissionsFor(
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
                        `Evelynn cannot publish support information in ${channel}.`,
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

    return channel;
}

/**
 * Publish the THE Ⅹ SINS
 * support guide.
 *
 * @param {import('discord.js').StringSelectMenuInteraction} interaction
 * @returns {Promise<void>}
 */
async function publishTicketGuide(
    interaction
) {
    const channel =
        await getTicketGuideChannel(
            interaction
        );

    if (!channel) {
        return;
    }

    const botAvatar =
        interaction.client.user
            .displayAvatarURL({
                size:
                    256,

                forceStatic:
                    false
            });

    const guildIcon =
        interaction.guild.iconURL({
            size:
                128,

            forceStatic:
                false
        }) ??
        botAvatar;

    const guideEmbed =
        createEmbed({
            title:
                'Ⅹ・SUPPORT',

            description:
                '**Private help when you need it.**',

            color:
                SUPPORT_EMBED_COLOR,

            thumbnail:
                botAvatar,

            fields: [
                {
                    name:
                        '🎫・WHEN TO OPEN A TICKET',

                    value:
                        [
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
                            '• Promotion requests',
                            '• Questions already answered in the FAQ'
                        ].join('\n'),

                    inline:
                        false
                },

                {
                    name:
                        '📝・MAKE IT CLEAR',

                    value:
                        [
                            'Explain the issue clearly.',
                            'Include usernames, details and evidence when available.',
                            '',
                            '**Never falsify evidence.**'
                        ].join('\n'),

                    inline:
                        false
                },

                {
                    name:
                        '🔒・PRIVACY',

                    value:
                        [
                            'Keep ticket discussions private.',
                            'Never share passwords, login codes or unrelated personal information.'
                        ].join('\n'),

                    inline:
                        false
                },

                {
                    name:
                        '⏳・WHAT HAPPENS NEXT?',

                    value:
                        [
                            '1. Explain the issue.',
                            '2. Staff reviews it.',
                            '3. More evidence may be requested.',
                            '4. A decision or solution is provided.'
                        ].join('\n'),

                    inline:
                        false
                },

                {
                    name:
                        'Ⅹ・OPEN A TICKET',

                    value:
                        'Use the **Open Ticket** button and keep only one active ticket unless Staff asks otherwise.',

                    inline:
                        false
                }
            ],

            author: {
                name:
                    'Evelynn • THE Ⅹ SINS',

                iconURL:
                    botAvatar
            },

            footer: {
                text:
                    'TTS • Support',

                iconURL:
                    guildIcon
            }
        });

    await channel.send({
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
                `The support guide was published in ${channel}.`
            )
        ],

        components:
            []
    });

    console.log(
        `Ⅹ Support guide published in #${channel.name} by ${interaction.user.tag}.`
    );
}

module.exports = {
    TICKET_GUIDE_CHANNEL_ID,
    SUPPORT_EMBED_COLOR,
    publishTicketGuide
};