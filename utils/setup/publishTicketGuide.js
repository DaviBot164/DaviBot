const {
    PermissionFlagsBits
} = require('discord.js');

const {
    createEmbed,
    createSuccessEmbed,
    createErrorEmbed
} = require('../embeds');

const brand =
    require('../../config/brand');

const setupChannels =
    require('../../config/setupChannels');

const TICKET_GUIDE_CHANNEL_ID =
    setupChannels.ticketGuideChannelId ??
    '1530989678553989261';

const SUPPORT_EMBED_COLOR =
    brand.themeColor;

/**
 * Get the configured support guide channel.
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
                    'The configured support guide channel could not be found.'
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
                        `Evelynn cannot publish the support guide in ${channel}.`,
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
 * Publish the official
 * LUNAR SEIREITEI support guide.
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
                '☾・SOUL SANCTUARY',

            description:
                [
                    '**Private guidance beneath the eternal moon.**',
                    '',
                    `The Soul Sanctuary provides confidential support for members of **${brand.serverName}**.`
                ].join('\n'),

            color:
                SUPPORT_EMBED_COLOR,

            thumbnail:
                guildIcon,

            fields: [
                {
                    name:
                        '🎫・WHEN TO OPEN A TICKET',

                    value:
                        [
                            '• Member reports',
                            '• Moderation appeals',
                            '• Verification problems',
                            '• Server or bot issues',
                            '• Private or sensitive evidence',
                            '• Serious violations of the Sacred Laws'
                        ].join('\n'),

                    inline:
                        false
                },

                {
                    name:
                        '✕・DO NOT USE TICKETS FOR',

                    value:
                        [
                            '• Spam, jokes or test tickets',
                            '• General conversation',
                            '• Captain Rank or promotion requests',
                            '• Questions already answered in the FAQ',
                            '• Matters that can be handled in public channels'
                        ].join('\n'),

                    inline:
                        false
                },

                {
                    name:
                        '📝・PREPARE YOUR REPORT',

                    value:
                        [
                            'Explain what happened clearly and honestly.',
                            'Include usernames, dates and relevant evidence when available.',
                            '',
                            '**Never edit, conceal or falsify evidence.**'
                        ].join('\n'),

                    inline:
                        false
                },

                {
                    name:
                        '🔒・PRIVACY',

                    value:
                        [
                            'Ticket discussions must remain private.',
                            '',
                            'Never share passwords, login codes or unrelated personal information.',
                            'Evelynn and the High Command will never request your credentials.'
                        ].join('\n'),

                    inline:
                        false
                },

                {
                    name:
                        '⏳・WHAT HAPPENS NEXT?',

                    value:
                        [
                            '1. Open a ticket and explain the issue.',
                            '2. A High Command member reviews the case.',
                            '3. Additional details or evidence may be requested.',
                            '4. A decision, answer or solution is provided.',
                            '5. The ticket is closed when the matter is resolved.'
                        ].join('\n'),

                    inline:
                        false
                },

                {
                    name:
                        '☾・ENTER THE SANCTUARY',

                    value:
                        [
                            'Use the **Open Ticket** button to begin.',
                            '',
                            'Keep only one active ticket unless the High Command instructs otherwise.'
                        ].join('\n'),

                    inline:
                        false
                }
            ],

            author: {
                name:
                    `${brand.botName} • ${brand.botTitle}`,

                iconURL:
                    botAvatar
            },

            footer: {
                text:
                    `${brand.serverName} • Soul Sanctuary`,

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
                `The Soul Sanctuary guide was published in ${channel}.`
            )
        ],

        components:
            []
    });

    console.log(
        `Soul Sanctuary guide published in #${channel.name} by ${interaction.user.tag}.`
    );
}

module.exports = {
    TICKET_GUIDE_CHANNEL_ID,
    SUPPORT_EMBED_COLOR,
    getTicketGuideChannel,
    publishTicketGuide
};