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
 * Get and validate the main Information channel.
 *
 * Sacred Laws, Server Guide, Role Information
 * and FAQ are published inside this channel.
 *
 * @param {import('discord.js').StringSelectMenuInteraction} interaction
 * @returns {Promise<import('discord.js').TextBasedChannel|null>}
 */
async function getInformationChannel(
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
                    [
                        'Umbra could not find the configured Information channel.',
                        '',
                        `Configured Channel ID: \`${setupChannels.informationChannelId}\``
                    ].join('\n')
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
        informationChannel.permissionsFor(
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
                    [
                        `Umbra cannot publish the Sacred Laws in ${informationChannel}.`,
                        '',
                        'Required permissions:',
                        '• **View Channel**',
                        '• **Send Messages**',
                        '• **Embed Links**'
                    ].join('\n')
                )
            ],

            components: []
        });

        return null;
    }

    return informationChannel;
}

/**
 * Publish the Sacred Laws embed inside
 * the main Crimson Eclipse Information channel.
 *
 * @param {import('discord.js').StringSelectMenuInteraction} interaction
 * @returns {Promise<void>}
 */
async function publishSacredLaws(
    interaction
) {
    const informationChannel =
        await getInformationChannel(
            interaction
        );

    if (!informationChannel) {
        return;
    }

    const rulesEmbed =
        createEmbed({
            title:
                '📜 Sacred Laws of Crimson Eclipse',

            description:
                [
                    'Welcome to **Crimson Eclipse**.',
                    '',
                    'Before beginning your journey, every **Soul** must respect the laws of the Order.',
                    '',
                    'These laws exist to protect the community beneath the crimson moon.'
                ].join('\n'),

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
                        '⚖️ I — Respect the Order',

                    value:
                        [
                            'Treat every Soul with respect.',
                            '',
                            '• No harassment or bullying',
                            '• No hate speech or discrimination',
                            '• No personal attacks',
                            '• No excessive toxicity',
                            '• No attempts to provoke unnecessary conflict'
                        ].join('\n'),

                    inline:
                        false
                },
                {
                    name:
                        '⚔️ II — Fair Play',

                    value:
                        [
                            'All members must play fairly.',
                            '',
                            '• No exploiting',
                            '• No cheating',
                            '• No scripting',
                            '• No unauthorized third-party tools',
                            '• No abusing glitches against other players',
                            '',
                            '**Anyone caught scripting or exploiting may be permanently banned without exceptions.**'
                        ].join('\n'),

                    inline:
                        false
                },
                {
                    name:
                        '💬 III — Chat Conduct',

                    value:
                        [
                            'Keep all conversations appropriate and readable.',
                            '',
                            '• No spam or message flooding',
                            '• No NSFW or disturbing content',
                            '• No scam, phishing, or malicious links',
                            '• No unauthorized advertising',
                            '• No excessive mentions',
                            '• Use each channel for its intended purpose'
                        ].join('\n'),

                    inline:
                        false
                },
                {
                    name:
                        '🛡️ IV — Staff Decisions',

                    value:
                        [
                            'Respect the decisions made by the **Shadow Wardens**.',
                            '',
                            '• Do not insult or harass staff',
                            '• Do not evade moderation actions',
                            '• Do not create public arguments about punishments',
                            '• Use the ticket system for questions or appeals',
                            '',
                            'Staff members are also required to follow these laws.'
                        ].join('\n'),

                    inline:
                        false
                },
                {
                    name:
                        '🎫 V — Ticket System',

                    value:
                        [
                            'Use Umbra’s ticket system only when support is genuinely needed.',
                            '',
                            '• Do not create fake tickets',
                            '• Do not troll the support team',
                            '• Explain the issue clearly',
                            '• Provide evidence when necessary',
                            '• Remain patient while waiting for a response'
                        ].join('\n'),

                    inline:
                        false
                },
                {
                    name:
                        '🌑 VI — Protect the Community',

                    value:
                        [
                            'Help Crimson Eclipse remain welcoming and organized.',
                            '',
                            '• Support new members when possible',
                            '• Do not spread false accusations',
                            '• Do not expose private information',
                            '• Report serious violations to the Shadow Wardens',
                            '• Do not encourage others to break the rules'
                        ].join('\n'),

                    inline:
                        false
                },
                {
                    name:
                        '⚖️ Guardian Punishments',

                    value:
                        [
                            'Punishments depend on severity, evidence, and previous violations.',
                            '',
                            '⚠️ **Warning**',
                            '🔇 **Timeout**',
                            '👢 **Kick**',
                            '🔨 **Temporary or Permanent Ban**',
                            '',
                            'Severe violations may result in an immediate ban without earlier warnings.'
                        ].join('\n'),

                    inline:
                        false
                },
                {
                    name:
                        '📖 Final Decree',

                    value:
                        [
                            'By remaining within Crimson Eclipse, every member agrees to follow these Sacred Laws.',
                            '',
                            '*Every Soul leaves a mark beneath the crimson moon.*'
                        ].join('\n'),

                    inline:
                        false
                }
            ]
        });

    rulesEmbed.setAuthor({
        name:
            'Umbra • Guardian of Crimson Eclipse',

        iconURL:
            interaction.client.user
                .displayAvatarURL({
                    size:
                        256,

                    forceStatic:
                        false
                })
    });

    rulesEmbed.setFooter({
        text:
            '🌑 Crimson Eclipse • Sacred Laws',

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

    rulesEmbed.setTimestamp();

    await informationChannel.send({
        embeds:
            [rulesEmbed],

        allowedMentions: {
            parse:
                []
        }
    });

    await interaction.editReply({
        embeds: [
            createSuccessEmbed(
                '✅ Sacred Laws Published',
                `Umbra successfully published the Sacred Laws in ${informationChannel}.`
            )
        ],

        components: []
    });

    console.log(
        '======================================'
    );

    console.log(
        '📜 Sacred Laws Published Through Setup Wizard'
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
    publishSacredLaws
};