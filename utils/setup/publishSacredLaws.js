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

const {
    getGuildProfile
} = require('../../config/guildProfiles');

/*
 * Legacy export kept for compatibility.
 * Runtime color comes from the Guild Profile.
 */
const RULES_EMBED_COLOR =
    brand.themeColor;

/**
 * Get the configured Royal Laws channel.
 *
 * @param {import('discord.js').StringSelectMenuInteraction} interaction
 * @returns {Promise<import('discord.js').GuildTextBasedChannel|null>}
 */
async function getSacredLawsChannel(
    interaction
) {
    const profile =
        getGuildProfile(
            interaction.guildId
        );

    const channelId =
        profile.channels
            .sacredLawsChannelId;

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
                    'Royal Laws Channel Missing',
                    'The configured Royal Laws channel could not be found.'
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
                        `${profile.botName} cannot publish the Royal Laws in ${channel}.`,
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
 * Publish the server-aware Royal Laws.
 *
 * The legacy function name remains unchanged.
 *
 * @param {import('discord.js').StringSelectMenuInteraction} interaction
 * @returns {Promise<void>}
 */
async function publishSacredLaws(
    interaction
) {
    const profile =
        getGuildProfile(
            interaction.guildId
        );

    const channel =
        await getSacredLawsChannel(
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

    const rulesEmbed =
        createEmbed({
            title:
                '⚖️・ROYAL LAWS',

            description:
                [
                    '**Respect the kingdom. Respect its people. Fight with honor.**',
                    '',
                    `These laws bind everyone within **${profile.serverName}**.`
                ].join('\n'),

            color:
                profile.themeColor,

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
                        'Ⅱ・HONORABLE COMBAT',

                    value:
                        [
                            '• No exploiting, scripting or cheating.',
                            '• No tools that provide an unfair advantage.',
                            '• Do not intentionally abuse glitches.',
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
                            '• Use every channel for its intended purpose.'
                        ].join('\n'),

                    inline:
                        false
                },

                {
                    name:
                        'Ⅳ・ROYAL AUTHORITY',

                    value:
                        [
                            '• Respect staff decisions.',
                            '• Do not evade moderation actions.',
                            '• Do not start public arguments over punishments.',
                            '• Use support tickets for appeals or disputes.',
                            '',
                            '-# The Royal Laws bind the server staff as well.'
                        ].join('\n'),

                    inline:
                        false
                },

                {
                    name:
                        'Ⅴ・TICKETS & SUPPORT',

                    value:
                        [
                            '• Open a ticket only when help is needed.',
                            '• Explain the issue clearly.',
                            '• Provide evidence when possible.',
                            '• Do not create false or joke tickets.',
                            '• Wait patiently for a response.'
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
                            '• Help keep the kingdom safe and respectful.'
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
                        '🐉・FINAL DECREE',

                    value:
                        [
                            `By remaining in **${profile.serverName}**, you agree to obey these laws.`,
                            '',
                            '**Respect is required. Honor is expected.**'
                        ].join('\n'),

                    inline:
                        false
                }
            ],

            author: {
                name:
                    `${profile.botName} • ${profile.serverName}`,

                iconURL:
                    botAvatar
            },

            footer: {
                text:
                    `${profile.serverName} • Royal Laws`,

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
                'Royal Laws Published',
                `The Royal Laws were published in ${channel}.`
            )
        ],

        components:
            []
    });

    console.log(
        `Royal Laws published in #${channel.name} by ${interaction.user.tag}.`
    );
}

module.exports = {
    RULES_EMBED_COLOR,
    publishSacredLaws
};