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
    category: 'information',

    data: new SlashCommandBuilder()
        .setName('serverinfo')
        .setDescription(
            'View the official records of Las Noches.'
        )
        .setDMPermission(false),

    /**
     * Execute the /serverinfo command.
     *
     * @param {import('discord.js').ChatInputCommandInteraction} interaction
     * @returns {Promise<void>}
     */
    async execute(interaction) {
        try {
            const { guild } =
                interaction;

            if (!guild) {
                const guildErrorEmbed =
                    createErrorEmbed(
                        '❌ Las Noches Unavailable',
                        'This command can only be used inside Las Noches.'
                    );

                await interaction.reply({
                    embeds: [
                        guildErrorEmbed
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

            const categories =
                countChannelsByType(
                    guild,
                    ChannelType.GuildCategory
                );

            const forumChannels =
                countChannelsByType(
                    guild,
                    ChannelType.GuildForum
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
                        '🏰 Las Noches Kingdom Records',

                    description:
                        [
                            `Umbra has opened the official records of **${guild.name}**.`,
                            '',
                            '*Every Soul, throne and structure is preserved beneath the eternal moon.*'
                        ].join('\n'),

                    thumbnail:
                        serverIcon,

                    fields: [
                        {
                            name:
                                '👑 Kingdom Information',

                            value:
                                `**Kingdom Name:** ${guild.name}\n` +
                                `**Kingdom ID:** \`${guild.id}\`\n` +
                                `**Ruler:** ${owner}\n` +
                                `**Total Souls:** \`${guild.memberCount}\`\n` +
                                `**Residents:** \`${humanCount}\`\n` +
                                `**Automata:** \`${botCount}\``,

                            inline:
                                false
                        },
                        {
                            name:
                                '📅 Kingdom History',

                            value:
                                `**Founded:** <t:${createdTimestamp}:F>\n` +
                                `**Age:** <t:${createdTimestamp}:R>`,

                            inline:
                                false
                        },
                        {
                            name:
                                '📊 Las Noches Statistics',

                            value:
                                `**Text Channels:** \`${textChannels}\`\n` +
                                `**Voice Channels:** \`${voiceChannels}\`\n` +
                                `**Forum Channels:** \`${forumChannels}\`\n` +
                                `**Districts:** \`${categories}\``,

                            inline:
                                true
                        },
                        {
                            name:
                                '🎖️ Kingdom Structure',

                            value:
                                `**Roles:** \`${guild.roles.cache.size}\`\n` +
                                `**Emojis:** \`${guild.emojis.cache.size}\`\n` +
                                `**Stickers:** \`${guild.stickers.cache.size}\``,

                            inline:
                                true
                        },
                        {
                            name:
                                '⚙️ Kingdom Settings',

                            value:
                                `**AFK Timeout:** \`${Math.floor(
                                    guild.afkTimeout /
                                    60
                                )} minutes\`\n` +
                                `**Locale:** \`${guild.preferredLocale}\`\n` +
                                `**Verification:** \`${formatVerificationLevel(
                                    guild.verificationLevel
                                )}\`\n` +
                                `**Boost Level:** \`${guild.premiumTier}\`\n` +
                                `**Boosts:** \`${guild.premiumSubscriptionCount ?? 0}\``,

                            inline:
                                false
                        }
                    ]
                });

            embed.setAuthor({
                name:
                    `${guild.name} • Kingdom Records`,

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
                    `🌙 Umbra • Guardian of Las Noches • Requested by ${interaction.user.username}`,

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
                await interaction.followUp({
                    embeds: [
                        errorEmbed
                    ],

                    flags:
                        MessageFlags.Ephemeral
                });

                return;
            }

            await interaction.reply({
                embeds: [
                    errorEmbed
                ],

                flags:
                    MessageFlags.Ephemeral
            });
        }
    }
};