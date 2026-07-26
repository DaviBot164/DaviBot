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
 * Get and validate the Ticket Guide channel.
 *
 * @param {import('discord.js').StringSelectMenuInteraction} interaction
 * @returns {Promise<import('discord.js').TextBasedChannel|null>}
 */
async function getTicketGuideChannel(
    interaction
) {
    const ticketGuideChannel =
        await interaction.guild.channels.fetch(
            TICKET_GUIDE_CHANNEL_ID
        );

    if (
        !ticketGuideChannel ||
        !ticketGuideChannel.isTextBased()
    ) {
        await interaction.editReply({
            embeds: [
                createErrorEmbed(
                    '❌ Ticket Guide Channel Missing',
                    'Umbra could not find the configured Ticket Guide channel.'
                )
            ],

            components: []
        });

        return null;
    }

    const botMember =
        interaction.guild.members.me;

    if (!botMember) {
        await interaction.editReply({
            embeds: [
                createErrorEmbed(
                    '❌ Umbra Unavailable',
                    'Umbra could not access its server member information.'
                )
            ],

            components: []
        });

        return null;
    }

    const channelPermissions =
        ticketGuideChannel.permissionsFor(
            botMember
        );

    if (
        !channelPermissions?.has([
            PermissionFlagsBits.ViewChannel,
            PermissionFlagsBits.SendMessages,
            PermissionFlagsBits.EmbedLinks
        ])
    ) {
        await interaction.editReply({
            embeds: [
                createErrorEmbed(
                    '❌ Missing Umbra Permissions',
                    'Umbra requires **View Channel**, **Send Messages**, and **Embed Links** permissions in the Ticket Guide channel.'
                )
            ],

            components: []
        });

        return null;
    }

    return ticketGuideChannel;
}

/**
 * Publish the Crimson Eclipse Ticket Guide.
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

    const publishedAt =
        Math.floor(
            Date.now() / 1000
        );

    const ticketGuideEmbed =
        createEmbed({
            title:
                '🎫 Umbra Support Guide',

            description:
                [
                    'The Ticket System allows every Soul to privately contact the **Shadow Wardens**.',
                    '',
                    'Read this guide before creating a ticket so your request can be handled quickly and fairly.',
                    '',
                    '*Honest information helps the Guardians protect the Order.*'
                ].join('\n'),

            thumbnail:
                interaction.client.user.displayAvatarURL({
                    size: 512,
                    forceStatic: false
                }),

            fields: [
                {
                    name:
                        '🎫 What Is a Ticket?',

                    value:
                        [
                            'A ticket is a private support channel created by Umbra.',
                            '',
                            'A ticket can normally be viewed by:',
                            '',
                            `• The Soul who created it`,
                            '• Shadow Wardens',
                            '• Umbra',
                            '',
                            'Other members cannot view your private support conversation.'
                        ].join('\n'),

                    inline:
                        false
                },
                {
                    name:
                        '✅ When Should You Create One?',

                    value:
                        [
                            'Create a ticket when private staff assistance is genuinely needed.',
                            '',
                            'Suitable reasons include:',
                            '',
                            '• Reporting a member',
                            '• Appealing a warning, timeout, kick, or ban',
                            '• Reporting a server or bot problem',
                            '• Providing private screenshots or evidence',
                            '• Requesting help from Shadow Wardens',
                            '• Reporting harassment, scams, or serious rule violations'
                        ].join('\n'),

                    inline:
                        false
                },
                {
                    name:
                        '❌ When Should You Not Create One?',

                    value:
                        [
                            'Do not misuse the Umbra support system.',
                            '',
                            'Tickets must not be created for:',
                            '',
                            '• Jokes or trolling',
                            '• Spam',
                            '• Fake reports',
                            '• General conversations',
                            '• Asking for staff roles or promotions',
                            '• Questions already answered in the Server Guide',
                            '• Repeatedly opening tickets about the same resolved issue',
                            '',
                            'Abusing the Ticket System may result in moderation action.'
                        ].join('\n'),

                    inline:
                        false
                },
                {
                    name:
                        '📝 How to Create a Good Ticket',

                    value:
                        [
                            'A clear ticket helps the Shadow Wardens respond faster.',
                            '',
                            'When opening a ticket:',
                            '',
                            '• Explain the issue clearly',
                            '• Include the correct usernames',
                            '• Describe when and where the incident happened',
                            '• Attach screenshots or evidence when possible',
                            '• Avoid sending repeated messages',
                            '• Remain respectful and patient',
                            '',
                            '**Never edit or falsify evidence.**'
                        ].join('\n'),

                    inline:
                        false
                },
                {
                    name:
                        '🛡️ What Happens After You Open It?',

                    value:
                        [
                            'The support process normally follows these steps:',
                            '',
                            '1. Umbra creates a private ticket channel.',
                            '2. You explain the issue and provide evidence.',
                            '3. A Shadow Warden reviews the request.',
                            '4. Staff may ask additional questions.',
                            '5. The issue is handled or a decision is explained.',
                            '6. The ticket is closed when support is complete.',
                            '',
                            'A closed ticket may be reopened by the Shadow Wardens if further review is required.'
                        ].join('\n'),

                    inline:
                        false
                },
                {
                    name:
                        '🔒 Privacy and Safety',

                    value:
                        [
                            'Tickets are private, but they are still subject to the Sacred Laws.',
                            '',
                            '• Do not share passwords or private login information',
                            '• Do not send malicious files or links',
                            '• Do not threaten or harass staff',
                            '• Do not reveal another person’s private information',
                            '• Only provide evidence related to the report',
                            '',
                            'Umbra and the Shadow Wardens may preserve relevant information for moderation records.'
                        ].join('\n'),

                    inline:
                        false
                },
                {
                    name:
                        '⏳ Response Times',

                    value:
                        [
                            'Shadow Wardens may not always respond immediately.',
                            '',
                            'Please remember:',
                            '',
                            '• Staff members may be busy or offline',
                            '• Complex reports may require investigation',
                            '• Repeated mentions will not make the process faster',
                            '• Remain patient while your request is reviewed',
                            '',
                            'Every genuine request will be reviewed as soon as possible.'
                        ].join('\n'),

                    inline:
                        false
                },
                {
                    name:
                        '📍 How to Open a Ticket',

                    value:
                        [
                            'After reading this guide, go to:',
                            '',
                            '**🎫・create-ticket**',
                            '',
                            'Use the **Open Ticket** button on Umbra’s support panel.',
                            '',
                            'Only create one active ticket at a time unless a Shadow Warden instructs you otherwise.'
                        ].join('\n'),

                    inline:
                        false
                },
                {
                    name:
                        '🌑 Final Support Decree',

                    value:
                        [
                            'Every ticket will be reviewed fairly according to the available information.',
                            '',
                            'Be honest.',
                            'Provide evidence.',
                            'Respect the Shadow Wardens.',
                            'Remain patient.',
                            '',
                            `**Guide published:** <t:${publishedAt}:F>`,
                            `-# <t:${publishedAt}:R>`,
                            '',
                            '*Umbra watches over every request beneath the crimson moon.*'
                        ].join('\n'),

                    inline:
                        false
                }
            ]
        });

    ticketGuideEmbed.setAuthor({
        name:
            'Umbra • Guardian of Crimson Eclipse',

        iconURL:
            interaction.client.user.displayAvatarURL({
                size: 256,
                forceStatic: false
            })
    });

    ticketGuideEmbed.setFooter({
        text:
            '🌑 Crimson Eclipse • Support Archive',

        iconURL:
            interaction.guild.iconURL({
                size: 128,
                forceStatic: false
            }) ??
            interaction.client.user.displayAvatarURL({
                size: 128,
                forceStatic: false
            })
    });

    ticketGuideEmbed.setTimestamp();

    await ticketGuideChannel.send({
        embeds:
            [ticketGuideEmbed],

        allowedMentions: {
            parse: []
        }
    });

    await interaction.editReply({
        embeds: [
            createSuccessEmbed(
                '✅ Ticket Guide Published',
                `Umbra successfully published the Ticket Guide in ${ticketGuideChannel}.`
            )
        ],

        components: []
    });

    console.log(
        '======================================'
    );

    console.log(
        '🎫 Ticket Guide Published Through Setup Wizard'
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