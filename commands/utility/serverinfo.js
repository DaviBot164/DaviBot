const {
    SlashCommandBuilder,
    ChannelType,
    MessageFlags
} = require('discord.js');

const {
    createEmbed,
    createErrorEmbed
} = require('../../utils/embeds');

/**
 * Count channels of a specific Discord type.
 *
 * @param {import('discord.js').Guild} guild
 * @param {number} channelType
 * @returns {number}
 */
function countChannelsByType(
    guild,
    channelType
) {
    return guild.channels.cache.filter(
        channel =>
            channel.type === channelType
    ).size;
}

/**
 * Format the guild verification level.
 *
 * @param {number} verificationLevel
 * @returns {string}
 */
function formatVerificationLevel(
    verificationLevel
) {
    const levels = {
        0: 'None',
        1: 'Low',
        2: 'Medium',
        3: 'High',
        4: 'Very High'
    };

    return (
        levels[verificationLevel] ??
        'Unknown'
    );
}

module.exports = {
    category:
        'information',

    data:
        new SlashCommandBuilder()
            .setName(
                'serverinfo'
            )
            .setDescription(
                'View the official records of Las Noches.'
            )
            .setDMPermission(
                false
            ),

    /**
     * Execute the /serverinfo command.
     *
     * @param {import('discord.js').ChatInputCommandInteraction} interaction
     * @returns {Promise<void>}
     */
    async execute(
        interaction
    ) {
        try {
            const { guild } =
                interaction;

            if (!guild) {
                await interaction.reply({
                    embeds: [
                        createErrorEmbed(
                            '❌ Las Noches Unavailable',
                            'This command can only be used inside Las Noches.'
                        )
                    ],

                    flags:
                        MessageFlags.Ephemeral
                });

                return;
            }

            const owner =
                await guild.fetchOwner();

            const textChannels =
                countChannelsByType(
                    guild,
                    ChannelType.GuildText
                );

            const voiceChannels =
                countChannelsByType(
                    guild,
                    ChannelType.GuildVoice
                );

            const forumChannels =
                countChannelsByType(
                    guild,
                    ChannelType.GuildForum
                );

            const categories =
                countChannelsByType(
                    guild,
                    ChannelType.GuildCategory
                );

            const serverIcon =
                guild.iconURL({
                    size:
                        1024,

                    forceStatic:
                        false
                });

            const bannerURL =
                guild.bannerURL({
                    size:
                        2048,

                    forceStatic:
                        false
                });

            const createdTimestamp =
                Math.floor(
                    guild.createdTimestamp /
                    1_000
                );

            const botCount =
                guild.members.cache.filter(
                    member =>
                        member.user.bot
                ).size;

            const humanCount =
                Math.max(
                    0,
                    guild.memberCount -
                    botCount
                );

            const embed =
                createEmbed({
                    title:
                        '🏰 Las Noches Records',

                    description:
                        `Official information for **${guild.name}**.`,

                    color:
                        '#6F42C1',

                    thumbnail:
                        serverIcon,

                    fields: [
                        {
                            name:
                                '👑 Kingdom',

                            value:
                                [
                                    `**Ruler:** ${owner}`,
                                    `**Souls:** \`${guild.memberCount}\``,
                                    `**Residents:** \`${humanCount}\``,
                                    `**Bots:** \`${botCount}\``
                                ].join(
                                    '\n'
                                ),

                            inline:
                                true
                        },
                        {
                            name:
                                '📊 Structure',

                            value:
                                [
                                    `**Text:** \`${textChannels}\``,
                                    `**Voice:** \`${voiceChannels}\``,
                                    `**Forums:** \`${forumChannels}\``,
                                    `**Districts:** \`${categories}\``
                                ].join(
                                    '\n'
                                ),

                            inline:
                                true
                        },
                        {
                            name:
                                '🎖️ Resources',

                            value:
                                [
                                    `**Roles:** \`${guild.roles.cache.size}\``,
                                    `**Emojis:** \`${guild.emojis.cache.size}\``,
                                    `**Stickers:** \`${guild.stickers.cache.size}\``,
                                    `**Boosts:** \`${guild.premiumSubscriptionCount ?? 0}\``
                                ].join(
                                    '\n'
                                ),

                            inline:
                                true
                        },
                        {
                            name:
                                '📅 Founded',

                            value:
                                [
                                    `<t:${createdTimestamp}:F>`,
                                    `<t:${createdTimestamp}:R>`
                                ].join(
                                    '\n'
                                ),

                            inline:
                                false
                        },
                        {
                            name:
                                '⚙️ Settings',

                            value:
                                [
                                    `**Locale:** \`${guild.preferredLocale}\``,
                                    `**Verification:** \`${formatVerificationLevel(
                                        guild.verificationLevel
                                    )}\``,
                                    `**Boost Level:** \`${guild.premiumTier}\``,
                                    `**AFK Timeout:** \`${Math.floor(
                                        guild.afkTimeout /
                                        60
                                    )} minutes\``
                                ].join(
                                    '\n'
                                ),

                            inline:
                                false
                        }
                    ]
                });

            embed.setAuthor({
                name:
                    `${guild.name} • Kingdom Archive`,

                iconURL:
                    serverIcon ||
                    interaction.client.user
                        .displayAvatarURL({
                            size:
                                128,

                            forceStatic:
                                false
                        })
            });

            embed.setFooter({
                text:
                    `Umbra • Guardian of Las Noches • Requested by ${interaction.user.username}`,

                iconURL:
                    interaction.client.user
                        .displayAvatarURL({
                            size:
                                128,

                            forceStatic:
                                false
                        })
            });

            if (bannerURL) {
                embed.setImage(
                    bannerURL
                );
            }

            await interaction.reply({
                embeds: [
                    embed
                ]
            });
        } catch (error) {
            console.error(
                '❌ Error executing Umbra /serverinfo:',
                error
            );

            const errorEmbed =
                createErrorEmbed(
                    '❌ Kingdom Records Unavailable',
                    'Umbra could not retrieve the official records of Las Noches.'
                );

            if (
                interaction.replied ||
                interaction.deferred
            ) {
                await interaction
                    .followUp({
                        embeds: [
                            errorEmbed
                        ],

                        flags:
                            MessageFlags.Ephemeral
                    })
                    .catch(
                        () => null
                    );

                return;
            }

            await interaction
                .reply({
                    embeds: [
                        errorEmbed
                    ],

                    flags:
                        MessageFlags.Ephemeral
                })
                .catch(
                    () => null
                );
        }
    }
};