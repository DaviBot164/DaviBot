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
 * Ticket Guide channel.
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
                    '❌ Support Codex Missing',
                    'Umbra could not locate the configured Ticket Guide channel.'
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
                    'Umbra could not access its Las Noches member record.'
                )
            ],

            components: []
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
                    '❌ Missing Umbra Permissions',
                    [
                        'Umbra requires:',
                        '',
                        '• View Channel',
                        '• Send Messages',
                        '• Embed Links'
                    ].join('\n')
                )
            ],

            components: []
        });

        return null;
    }

    return ticketGuideChannel;
}

/**
 * Publish the official
 * Las Noches Support Codex.
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

    const guideEmbed =
        createEmbed({
            title:
                '🎫 Support Codex',

            description:
                [
                    '## Every Soul deserves a fair hearing.',
                    '',
                    'Umbra provides a private support system where members may safely communicate with the **Las Noches Authorities**.',
                    '',
                    'Read this codex before opening a ticket so your request can be reviewed quickly and fairly.'
                ].join('\n'),

            color:
                '#6F42C1',

            thumbnail:
                interaction.client.user.displayAvatarURL({
                    size: 512,
                    forceStatic: false
                }),

            fields: [
                {
                    name:
                        '╭・🎫 WHAT IS A TICKET?',

                    value:
                        [
                            'A ticket is a private support chamber created by Umbra.',
                            '',
                            'Normally visible only to:',
                            '',
                            '• The Soul who opened it',
                            '• Las Noches Authorities',
                            '• Umbra',
                            '',
                            '> Every discussion remains private unless moderation requires otherwise.'
                        ].join('\n'),

                    inline:
                        false
                },
                {
                    name:
                        '├・✅ WHEN SHOULD YOU OPEN ONE?',

                    value:
                        [
                            'Open a ticket whenever private assistance is genuinely required.',
                            '',
                            'Examples include:',
                            '',
                            '• Reporting a member',
                            '• Appealing moderation',
                            '• Verification issues',
                            '• Bot problems',
                            '• Private evidence',
                            '• Serious rule violations',
                            '• Questions that should not be discussed publicly'
                        ].join('\n'),

                    inline:
                        false
                },
                {
                    name:
                        '├・❌ WHEN SHOULD YOU NOT OPEN ONE?',

                    value:
                        [
                            'Do not misuse Umbra’s support system.',
                            '',
                            'Tickets are not intended for:',
                            '',
                            '• Spam',
                            '• Jokes',
                            '• General conversations',
                            '• Repeated requests',
                            '• Promotion requests',
                            '• Questions already answered in the Knowledge Archive',
                            '',
                            '> Abuse of the Ticket System may result in moderation.'
                        ].join('\n'),

                    inline:
                        false
                },                {
                    name:
                        '├・📝 HOW TO CREATE A STRONG REPORT',

                    value:
                        [
                            'Clear information allows the Las Noches Authorities to respond more effectively.',
                            '',
                            'When opening a ticket:',
                            '',
                            '• Explain the issue clearly',
                            '• Include the correct usernames',
                            '• Describe when and where it happened',
                            '• Attach screenshots or evidence when possible',
                            '• Avoid repeated messages',
                            '• Remain respectful and patient',
                            '',
                            '**Never edit, hide, or falsify evidence.**'
                        ].join('\n'),

                    inline:
                        false
                },
                {
                    name:
                        '├・🛡️ HOW THE PROCESS WORKS',

                    value:
                        [
                            'The support process normally follows these steps:',
                            '',
                            '1. Umbra creates a private ticket chamber.',
                            '2. The requesting Soul explains the issue.',
                            '3. Evidence is reviewed.',
                            '4. Las Noches Authorities may ask additional questions.',
                            '5. A decision or solution is provided.',
                            '6. The ticket is closed when the case is complete.',
                            '',
                            '-# A closed ticket may be reopened if further review is required.'
                        ].join('\n'),

                    inline:
                        false
                },
                {
                    name:
                        '├・🔒 PRIVACY & SECURITY',

                    value:
                        [
                            'Tickets are private, but all Royal Laws still apply.',
                            '',
                            '• Never share passwords or login codes',
                            '• Never send malicious files or links',
                            '• Never expose private personal information',
                            '• Never threaten or harass staff',
                            '• Submit only evidence relevant to the case',
                            '',
                            'Umbra and authorized staff may preserve important information for Kingdom Records and moderation history.'
                        ].join('\n'),

                    inline:
                        false
                },
                {
                    name:
                        '├・⏳ RESPONSE TIMES',

                    value:
                        [
                            'Las Noches staff may not always respond immediately.',
                            '',
                            'Please remember:',
                            '',
                            '• Staff members may be busy or offline',
                            '• Complex reports may require investigation',
                            '• Repeated mentions will not speed up the process',
                            '• Additional evidence may be requested',
                            '• Every genuine request will be reviewed',
                            '',
                            '> Patience protects the fairness of every judgement.'
                        ].join('\n'),

                    inline:
                        false
                },
                {
                    name:
                        '├・📍 HOW TO OPEN A TICKET',

                    value:
                        [
                            'After reading this Support Codex, go to:',
                            '',
                            '**🎫・create-ticket**',
                            '',
                            'Use the **Open Ticket** button on Umbra’s support panel.',
                            '',
                            'Only maintain one active ticket at a time unless a staff member instructs you otherwise.'
                        ].join('\n'),

                    inline:
                        false
                },
                {
                    name:
                        '╰・🌙 FINAL SUPPORT DECREE',

                    value:
                        [
                            'Every request will be reviewed according to the available information and evidence.',
                            '',
                            'Be honest.',
                            'Provide clear records.',
                            'Respect the Las Noches Authorities.',
                            'Remain patient.',
                            '',
                            `**Codex published:** <t:${publishedAt}:F>`,
                            `-# <t:${publishedAt}:R>`,
                            '',
                            '> **Umbra preserves every worthy request beneath the eternal night.**'
                        ].join('\n'),

                    inline:
                        false
                }
            ]
        });

    guideEmbed.setAuthor({
        name:
            'Umbra • Guardian of Las Noches',

        iconURL:
            interaction.client.user.displayAvatarURL({
                size: 256,
                forceStatic: false
            })
    });

    guideEmbed.setFooter({
        text:
            'Las Noches • Support Codex',

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

    guideEmbed.setTimestamp();

    await ticketGuideChannel.send({
        embeds: [
            guideEmbed
        ],

        allowedMentions: {
            parse: []
        }
    });

    await interaction.editReply({
        embeds: [
            createSuccessEmbed(
                '✅ Support Codex Published',
                `Umbra successfully published the Las Noches Support Codex in ${ticketGuideChannel}.`
            )
        ],

        components: []
    });

    console.log(
        '======================================'
    );

    console.log(
        '🎫 Las Noches Support Codex Published'
    );

    console.log(
        `📍 Channel: ${ticketGuideChannel.name}`
    );

    console.log(
        `🛡️ Published By: ${interaction.user.tag}`
    );

    console.log(
        `🏰 Kingdom: ${interaction.guild.name}`
    );

    console.log(
        '======================================'
    );
}

module.exports = {
    publishTicketGuide
};