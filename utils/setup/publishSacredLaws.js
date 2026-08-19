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

const RULES_EMBED_COLOR =
    brand.themeColor;

/**
 * Get the Lunar Seireitei
 * Sacred Laws channel.
 *
 * @param {import('discord.js').StringSelectMenuInteraction} interaction
 * @returns {Promise<import('discord.js').TextBasedChannel|null>}
 */
async function getSacredLawsChannel(
    interaction
) {
    const channel =
        await interaction.guild.channels
            .fetch(
                setupChannels
                    .sacredLawsChannelId
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
                        `Evelynn cannot publish the Sacred Laws in ${channel}.`,
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
 * Lunar Seireitei Sacred Laws.
 *
 * @param {import('discord.js').StringSelectMenuInteraction} interaction
 * @returns {Promise<void>}
 */
async function publishSacredLaws(
    interaction
) {
    const channel =
        await getSacredLawsChannel(
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

    const rulesEmbed =
        createEmbed({
            title:
                '☾・SACRED LAWS',

            description:
                [
                    '**Respect the server. Respect its members. Play fair.**',
                    '',
                    `These laws apply to everyone within **${brand.serverName}**.`
                ].join('\n'),

            color:
                RULES_EMBED_COLOR,

            thumbnail:
                interaction.guild.iconURL({
                    size:
                        512,

                    forceStatic:
                        false
                }) ??
                botAvatar,

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
                        'Ⅳ・HIGH COMMAND & MODERATION',

                    value:
                        [
                            '• Respect High Command decisions.',
                            '• Do not evade moderation actions.',
                            '• Do not start public arguments over punishments.',
                            '• Use tickets for appeals or disputes.',
                            '',
                            '-# The Sacred Laws apply to High Command as well.'
                        ].join('\n'),

                    inline:
                        false
                },

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
                        '☾・FINAL NOTICE',

                    value:
                        [
                            `By remaining in **${brand.serverName}**, you agree to follow these laws.`,
                            '',
                            '**Respect is required. Fair play is expected.**'
                        ].join('\n'),

                    inline:
                        false
                }
            ],

            author: {
                name:
                    `${brand.botName} • ${brand.serverName}`,

                iconURL:
                    botAvatar
            },

            footer: {
                text:
                    `${brand.serverName} • Sacred Laws`,

                iconURL:
                    guildIcon
            }
        });

    await channel.send({
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
                '✅ Sacred Laws Published',
                `The Sacred Laws were published in ${channel}.`
            )
        ],

        components:
            []
    });

    console.log(
        `Sacred Laws published in #${channel.name} by ${interaction.user.tag}.`
    );
}

module.exports = {
    RULES_EMBED_COLOR,
    publishSacredLaws
};