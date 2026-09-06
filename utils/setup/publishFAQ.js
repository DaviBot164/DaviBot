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
const FAQ_EMBED_COLOR =
    brand.themeColor;

/**
 * Get the configured information channel.
 *
 * @param {import('discord.js').StringSelectMenuInteraction} interaction
 * @returns {Promise<import('discord.js').GuildTextBasedChannel|null>}
 */
async function getFAQChannel(
    interaction
) {
    const profile =
        getGuildProfile(
            interaction.guildId
        );

    const channelId =
        profile.channels
            .informationChannelId;

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
                    'Information Channel Missing',
                    'The configured information channel could not be found.'
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
                        `${profile.botName} cannot publish the FAQ in ${channel}.`,
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
 * Publish a server-aware FAQ.
 *
 * @param {import('discord.js').StringSelectMenuInteraction} interaction
 * @returns {Promise<void>}
 */
async function publishFAQ(
    interaction
) {
    const profile =
        getGuildProfile(
            interaction.guildId
        );

    const channel =
        await getFAQChannel(
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

    const faqEmbed =
        createEmbed({
            title:
                '◆・FAQ',

            description:
                `**Quick answers for members of ${profile.serverName}.**`,

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
                        '⛩️・HOW DO I GET ACCESS?',

                    value:
                        [
                            'Verify your Roblox account through **Bloxlink**.',
                            '',
                            `**◇・${profile.roles.unverifiedName.toUpperCase()}** → **◆・${profile.roles.verifiedName.toUpperCase()}**`
                        ].join('\n'),

                    inline:
                        false
                },

                {
                    name:
                        '⚖️・WHERE ARE THE RULES?',

                    value:
                        'Read the **Royal Laws** before entering the community.',

                    inline:
                        false
                },

                {
                    name:
                        '🎫・HOW DO I CONTACT STAFF?',

                    value:
                        'Open a private support ticket for reports, appeals or server issues.',

                    inline:
                        false
                },

                {
                    name:
                        '📜・CAN I APPEAL?',

                    value:
                        [
                            '**Yes.**.** Open a support ticket and explain what happened.',
                            '',
                            '-# An appeal does not guarantee removal of a punishment.'
                        ].join('\n'),

                    inline:
                        false
                },

                {
                    name:
                        '🐉・WHO IS EVELYNN?',

                    value:
                        `**${profile.botName}** serves as the **${profile.botTitle}** and guardian of **${profile.serverName}**.`,

                    inline:
                        false
                },

                {
                    name:
                        '🛡️・WHY WAS MY MESSAGE REMOVED?',

                    value:
                        `${profile.botName} may remove prohibited language, spam, unauthorized invites, malicious links or filter bypass attempts.`,

                    inline:
                        false
                },

                {
                    name:
                        '⚔️・ARE EXPLOITS ALLOWED?',

                    value:
                        '**No.** Scripts, exploits, cheats and unfair tools are forbidden.',

                    inline:
                        false
                },

                {
                    name:
                        '✦・HOW DO I PROGRESS?',

                    value:
                        [
                            'Stay active to earn Levels, Achievements, Titles and progression roles.',
                            '',
                            `**${profile.rankSystemName}** are earned separately through the official **${profile.trialSystemName}**.`
                        ].join('\n'),

                    inline:
                        false
                },

                {
                    name:
                        '◆・STILL NEED HELP?',

                    value:
                        'For private or moderation-related matters, open a support ticket.',

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
                    `${profile.serverName} • FAQ`,

                iconURL:
                    guildIcon
            }
        });

    await channel.send({
        embeds: [
            faqEmbed
        ],

        allowedMentions: {
            parse:
                []
        }
    });

    await interaction.editReply({
        embeds: [
            createSuccessEmbed(
                'FAQ Published',
                `The FAQ was published in ${channel}.`
            )
        ],

        components:
            []
    });

    console.log(
        `FAQ published in #${channel.name} by ${interaction.user.tag}.`
    );
}

module.exports = {
    FAQ_EMBED_COLOR,
    publishFAQ
};