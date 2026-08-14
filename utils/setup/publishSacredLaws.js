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
 * THE Ⅹ SINS rules channel.
 *
 * @param {import('discord.js').StringSelectMenuInteraction} interaction
 * @returns {Promise<import('discord.js').TextBasedChannel|null>}
 */
async function getSacredLawsChannel(
    interaction
) {
    const sacredLawsChannel =
        await interaction.guild.channels
            .fetch(
                setupChannels
                    .sacredLawsChannelId
            )
            .catch(
                () => null
            );

    if (
        !sacredLawsChannel ||
        !sacredLawsChannel.isTextBased()
    ) {
        await interaction.editReply({
            embeds: [
                createErrorEmbed(
                    '❌ Rules Channel Missing',
                    'The configured rules channel could not be found.'
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
                    '❌ Bot Unavailable',
                    'The bot could not access its server member record.'
                )
            ],

            components:
                []
        });

        return null;
    }

    const channelPermissions =
        sacredLawsChannel.permissionsFor(
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
                    '❌ Missing Permissions',
                    [
                        `Cannot publish the Code of Sins in ${sacredLawsChannel}.`,
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

    return sacredLawsChannel;
}

/**
 * Publish the official
 * THE Ⅹ SINS rules.
 *
 * @param {import('discord.js').StringSelectMenuInteraction} interaction
 * @returns {Promise<void>}
 */
async function publishSacredLaws(
    interaction
) {
    const sacredLawsChannel =
        await getSacredLawsChannel(
            interaction
        );

    if (!sacredLawsChannel) {
        return;
    }

    const rulesEmbed =
        createEmbed({
            title:
                'Ⅹ・CODE OF SINS',

            description:
                [
                    '**Respect the server. Respect its members. Play fair.**',
                    '',
                    'These rules apply to everyone within **THE Ⅹ SINS**.'
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
                        'Ⅰ・RESPECT',

                    value:
                        [
                            '• No harassment or targeted bullying.',
                            '• No hate speech or discrimination.',
                            '• No personal attacks or humiliation.',
                            '• Keep toxicity and provocation under control.'
                        ].join('\n'),

                    inline:
                        false
                },

                {
                    name:
                        'Ⅱ・FAIR PLAY',

                    value:
                        [
                            '• No exploiting, scripting or cheating.',
                            '• No unauthorized tools that provide an unfair advantage.',
                            '• Do not intentionally abuse glitches against other players.',
                            '• Do not assist others in cheating.'
                        ].join('\n'),

                    inline:
                        false
                },

                {
                    name:
                        'Ⅲ・CHAT & CONTENT',

                    value:
                        [
                            '• No spam or message flooding.',
                            '• No NSFW or disturbing content.',
                            '• No scams, phishing or malicious links.',
                            '• No unauthorized advertising.',
                            '• Use channels for their intended purpose.'
                        ].join('\n'),

                    inline:
                        false
                },

                {
                    name:
                        'Ⅳ・STAFF & MODERATION',

                    value:
                        [
                            '• Respect Staff decisions.',
                            '• Do not evade moderation actions.',
                            '• Do not start public arguments over punishments.',
                            '• Use tickets for appeals or disputes.',
                            '',
                            '-# The Code of Sins applies to Staff as well.'
                        ].join('\n'),

                    inline:
                        false
                }
            ]
        });    rulesEmbed.addFields(
        {
            name:
                'Ⅴ・TICKETS & SUPPORT',

            value:
                [
                    '• Open tickets only when help is genuinely needed.',
                    '• Explain the issue clearly.',
                    '• Provide evidence when possible.',
                    '• Do not create false or joke tickets.',
                    '• Be patient while waiting for a response.'
                ].join('\n'),

            inline:
                false
        },

        {
            name:
                'Ⅵ・PRIVACY & SAFETY',

            value:
                [
                    '• Do not expose private information.',
                    '• Do not spread false accusations.',
                    '• Report serious violations when necessary.',
                    '• Help keep the community safe and respectful.'
                ].join('\n'),

            inline:
                false
        },

        {
            name:
                '⚖️・ENFORCEMENT',

            value:
                [
                    'Violations may result in:',
                    '',
                    '⚠️ Warning',
                    '🔇 Timeout',
                    '👢 Kick',
                    '🔨 Temporary Ban',
                    '⛔ Permanent Ban',
                    '',
                    '-# Severe violations may receive immediate action.'
                ].join('\n'),

            inline:
                false
        },

        {
            name:
                'Ⅹ・FINAL NOTICE',

            value:
                [
                    'By remaining in **THE Ⅹ SINS**, you agree to follow this code.',
                    '',
                    '**Respect is required. Fair play is expected.**'
                ].join('\n'),

            inline:
                false
        }
    );

    rulesEmbed.setAuthor({
        name:
            'THE Ⅹ SINS',

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
            'TTS • Code of Sins',

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

    await sacredLawsChannel.send({
        embeds: [
            rulesEmbed
        ],

        allowedMentions: {
            parse:
                []
        }
    });

    await interaction.editReply({
        embeds: [
            createSuccessEmbed(
                '✅ Code of Sins Published',
                `The Code of Sins was published in ${sacredLawsChannel}.`
            )
        ],

        components:
            []
    });

    console.log(
        '======================================'
    );

    console.log(
        'Ⅹ Code of Sins Published'
    );

    console.log(
        `📍 Channel: ${sacredLawsChannel.name}`
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