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
            'View information about the Crimson Eclipse Order.'
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
                        '❌ Order Unavailable',
                        'This command can only be used inside a server.'
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
                    size: 1024,
                    forceStatic: false
                });

            const bannerURL =
                guild.bannerURL({
                    size: 2048,
                    forceStatic: false
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
                        '🌑 Crimson Eclipse Records',

                    description:
                        [
                            `Umbra has opened the records of **${guild.name}**.`,
                            '',
                            '*An Order forged beneath the crimson moon.*'
                        ].join('\n'),

                    thumbnail:
                        serverIcon,

                    fields: [
                        {
                            name:
                                '👑 Order Information',

                            value:
                                `**Order Name:** ${guild.name}\n` +
                                `**Order ID:** \`${guild.id}\`\n` +
                                `**Crimson Lord:** ${owner}\n` +
                                `**Total Souls:** \`${guild.memberCount}\`\n` +
                                `**Humans:** \`${humanCount}\`\n` +
                                `**Bots:** \`${botCount}\``,

                            inline:
                                false
                        },
                        {
                            name:
                                '📅 Order History',

                            value:
                                `**Founded:** <t:${createdTimestamp}:F>\n` +
                                `**Age:** <t:${createdTimestamp}:R>`,

                            inline:
                                false
                        },
                        {
                            name:
                                '📊 Eclipse Statistics',

                            value:
                                `**Text Channels:** \`${textChannels}\`\n` +
                                `**Voice Channels:** \`${voiceChannels}\`\n` +
                                `**Forum Channels:** \`${forumChannels}\`\n` +
                                `**Categories:** \`${categories}\``,

                            inline:
                                true
                        },
                        {
                            name:
                                '🎖️ Order Structure',

                            value:
                                `**Roles:** \`${guild.roles.cache.size}\`\n` +
                                `**Emojis:** \`${guild.emojis.cache.size}\`\n` +
                                `**Stickers:** \`${guild.stickers.cache.size}\``,

                            inline:
                                true
                        },
                        {
                            name:
                                '⚙️ Order Settings',

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
                    `${guild.name} • Order Records`,

                iconURL:
                    serverIcon ||
                    interaction.client.user
                        .displayAvatarURL({
                            size: 128,
                            forceStatic: false
                        })
            });

            embed.setFooter({
                text:
                    `🌑 Umbra Server Records • Requested by ${interaction.user.username}`,

                iconURL:
                    interaction.client.user
                        .displayAvatarURL({
                            size: 128,
                            forceStatic: false
                        })
            });

            if (bannerURL) {
                embed.setImage(
                    bannerURL
                );
            }

            await interaction.reply({
                embeds: [embed]
            });
        } catch (error) {
            console.error(
                '❌ Error executing Umbra /serverinfo:',
                error
            );

            const errorEmbed =
                createErrorEmbed(
                    '❌ Order Records Unavailable',
                    'Umbra could not retrieve the records of this Order.'
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