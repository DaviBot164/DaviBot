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

const channels =
    require('../../config/channels');

const {
    getGuildProfile
} = require('../../config/guildProfiles');

/*
 * Legacy exports kept for compatibility.
 * Runtime values come from the Guild Profile.
 */
const TICKET_GUIDE_CHANNEL_ID =
    channels.ticketGuideChannelId;

const SUPPORT_EMBED_COLOR =
    brand.themeColor;

/**
 * Get the configured support guide channel.
 *
 * @param {import('discord.js').StringSelectMenuInteraction} interaction
 * @returns {Promise<import('discord.js').GuildTextBasedChannel|null>}
 */
async function getTicketGuideChannel(
    interaction
) {
    const profile =
        getGuildProfile(
            interaction.guildId
        );

    const channelId =
        profile.channels
            .ticketGuideChannelId;

    const channel =
        channelId
            ? await interaction.guild.channels
                .fetch(
                    channelId
                )
                .catch(
                    () => null
                )
            : null;

    if (
        !channel ||
        !channel.isTextBased() ||
        channel.isThread()
    ) {
        await interaction.editReply({
            embeds: [
                createErrorEmbed(
                    'Support Channel Missing',
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

    if (
        !botMember
    ) {
        await interaction.editReply({
            embeds: [
                createErrorEmbed(
                    `${profile.botName} Unavailable`,
                    `${profile.botName} could not access the server member record.`
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
                    'Missing Permissions',
                    [
                        `${profile.botName} cannot publish the support guide in ${channel}.`,
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
 * Publish a server-aware support guide.
 *
 * @param {import('discord.js').StringSelectMenuInteraction} interaction
 * @returns {Promise<void>}
 */
async function publishTicketGuide(
    interaction
) {
    const profile =
        getGuildProfile(
            interaction.guildId
        );

    const channel =
        await getTicketGuideChannel(
            interaction
        );

    if (
        !channel
    ) {
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
                '🛡️・ROYAL SANCTUARY',

            description:
                [
                    '**Private guidance under the protection of the Crown.**',
                    '',
                    `The Royal Sanctuary provides confidential support for members of **${profile.serverName}**.`
                ].join('\n'),

            color:
                profile.themeColor,

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
                            '• Serious violations of the Royal Laws'
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
                            `• ${profile.rankSystemName} or promotion requests`,
                            '• Questions already answered in the FAQ',
                            '• Matters that can be handled in public channels'
                        ].join('\n'),

                    inline:
                        false
                },

                {
                    name:
                        '📜・PREPARE YOUR REPORT',

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
                            `${profile.botName} and the server staff will never request your credentials.`
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
                            '2. A staff member reviews the case.',
                            '3. Additional details or evidence may be requested.',
                            '4. A decision, answer or solution is provided.',
                            '5. The ticket is closed when the matter is resolved.'
                        ].join('\n'),

                    inline:
                        false
                },

                {
                    name:
                        '⚜・ENTER THE SANCTUARY',

                    value:
                        [
                            'Use the **Open Ticket** button to begin.',
                            '',
                            'Keep only one active ticket unless the staff instructs otherwise.'
                        ].join('\n'),

                    inline:
                        false
                }
            ],

            author: {
                name:
                    `${profile.botName} • ${profile.botTitle}`,

                iconURL:
                    botAvatar
            },

            footer: {
                text:
                    `${profile.serverName} • Royal Sanctuary`,

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
                'Support Guide Published',
                `The Royal Sanctuary guide was published in ${channel}.`
            )
        ],

        components:
            []
    });

    console.log(
        `Royal Sanctuary guide published in #${channel.name} by ${interaction.user.tag}.`
    );
}

module.exports = {
    TICKET_GUIDE_CHANNEL_ID,
    SUPPORT_EMBED_COLOR,
    getTicketGuideChannel,
    publishTicketGuide
};