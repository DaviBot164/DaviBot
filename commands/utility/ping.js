const {
    SlashCommandBuilder
} = require('discord.js');

const {
    createEmbed,
    createErrorEmbed
} = require('../../utils/embeds');

const {
    getGuildProfile
} = require('../../config/guildProfiles');

function getStatus(
    latency
) {
    if (latency < 150) {
        return '🟢 Stable';
    }

    if (latency < 300) {
        return '🟡 Delayed';
    }

    return '🔴 High Latency';
}

module.exports = {
    category:
        'general',

    data:
        new SlashCommandBuilder()
            .setName(
                'ping'
            )
            .setDescription(
                "Check the bot's current latency and status."
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
            const apiLatency =
                Math.max(
                    0,
                    Math.round(
                        interaction.client.ws.ping
                    )
                );

            const responseTime =
                Math.max(
                    0,
                    Date.now() -
                        interaction.createdTimestamp
                );

            const botAvatar =
                interaction.client.user
                    .displayAvatarURL({
                        size:
                            256,

                        forceStatic:
                            false
                    });

            const embed =
                createEmbed({
                    title:
                        `⚡ ${profile.botName} Status`,

                    description:
                        `**${profile.botName}, ${profile.botTitle} of ${profile.shortName}, is online.**`,

                    color:
                        profile.themeColor,

                    thumbnail:
                        botAvatar,

                    fields: [
                        {
                            name:
                                '◆ Status',

                            value:
                                getStatus(
                                    apiLatency
                                ),

                            inline:
                                false
                        },

                        {
                            name:
                                'Gateway',

                            value:
                                `${apiLatency} ms`,

                            inline:
                                true
                        },

                        {
                            name:
                                'Response',

                            value:
                                `${responseTime} ms`,

                            inline:
                                true
                        }
                    ]
                });

            embed.setAuthor({
                name:
                    `${profile.botName} • ${profile.botTitle}`,

                iconURL:
                    botAvatar
            });

            embed.setFooter({
                text:
                    `${profile.serverName} • System Check • Requested by ${interaction.user.username}`,

                iconURL:
                    botAvatar
            });

            await interaction.reply({
                embeds: [
                    embed
                ]
            });
        } catch (error) {
            console.error(
                '❌ Ping command error:',
                error
            );

            await interaction.reply({
                embeds: [
                    createErrorEmbed(
                        `❌ ${profile.botName} Status Unavailable`,
                        `${profile.botName} could not calculate the current latency.`
                    )
                ]
            });
        }
    }
};