const {
    SlashCommandBuilder,
    ChannelType,
    MessageFlags
} = require('discord.js');

const {
    createEmbed,
    createErrorEmbed
} = require('../../utils/embeds');

const {
    getGuildProfile
} = require('../../config/guildProfiles');

function countChannelsByType(
    guild,
    channelType
) {
    return guild.channels.cache.filter(
        channel =>
            channel.type === channelType
    ).size;
}

function formatVerificationLevel(
    verificationLevel
) {
    const levels = {
        0:
            'None',

        1:
            'Low',

        2:
            'Medium',

        3:
            'High',

        4:
            'Very High'
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
                'View information about the current server.'
            )
            .setDMPermission(
                false
            ),

    async execute(
        interaction
    ) {
        const profile =
            getGuildProfile(
                interaction.guildId
            );

        try {
            const { guild } =
                interaction;

            if (!guild) {
                await interaction.reply({
                    embeds: [
                        createErrorEmbed(
                            '❌ Server Only Command',
                            'This command can only be used inside a server.'
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

            const totalChannels =
                textChannels +
                voiceChannels +
                forumChannels;

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

            const botAvatar =
                interaction.client.user
                    .displayAvatarURL({
                        size:
                            256,

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
                        '♛・SERVER INFORMATION',

                    description:
                        `Official information for **${guild.name}**.`,

                    color:
                        profile.themeColor,

                    thumbnail:
                        serverIcon ||
                        botAvatar,

                    fields: [
                        {
                            name:
                                '♛・SERVER',

                            value:
                                [
                                    `**Sovereign:** ${owner}`,
                                    `**Members:** \`${humanCount}\``,
                                    `**Bots:** \`${botCount}\``
                                ].join('\n'),

                            inline:
                                true
                        },

                        {
                            name:
                                '◆・STRUCTURE',

                            value:
                                [
                                    `**Channels:** \`${totalChannels}\``,
                                    `**Roles:** \`${guild.roles.cache.size}\``,
                                    `**Boosts:** \`${guild.premiumSubscriptionCount ?? 0}\``
                                ].join('\n'),

                            inline:
                                true
                        },

                        {
                            name:
                                '🛡️・SECURITY',

                            value:
                                [
                                    `**Verification:** \`${formatVerificationLevel(
                                        guild.verificationLevel
                                    )}\``,
                                    `**Boost Level:** \`${guild.premiumTier}\``
                                ].join('\n'),

                            inline:
                                true
                        },

                        {
                            name:
                                '📅・CREATED',

                            value:
                                [
                                    `<t:${createdTimestamp}:F>`,
                                    `-# <t:${createdTimestamp}:R>`
                                ].join('\n'),

                            inline:
                                false
                        }
                    ]
                });

            embed.setAuthor({
                name:
                    `${profile.botName} • ${profile.serverName}`,

                iconURL:
                    botAvatar
            });

            embed.setFooter({
                text:
                    `${profile.serverName} • Requested by ${interaction.user.username}`,

                iconURL:
                    botAvatar
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
                '❌ Server information command error:',
                error
            );

            const errorEmbed =
                createErrorEmbed(
                    '❌ Server Information Unavailable',
                    `${profile.botName} could not retrieve the server information.`
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