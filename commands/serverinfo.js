const {
    SlashCommandBuilder,
    ChannelType
} = require('discord.js');

const { createEmbed } = require('../utils/embeds');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('serverinfo')
        .setDescription('View information about this server.'),

    async execute(interaction) {

        const { guild } = interaction;

        const owner = await guild.fetchOwner();

        const textChannels = guild.channels.cache.filter(
            channel => channel.type === ChannelType.GuildText
        ).size;

        const voiceChannels = guild.channels.cache.filter(
            channel => channel.type === ChannelType.GuildVoice
        ).size;

        const categories = guild.channels.cache.filter(
            channel => channel.type === ChannelType.GuildCategory
        ).size;

        const embed = createEmbed(interaction)
            .setAuthor({
                name: `${guild.name} • Server Information`,
                iconURL: guild.iconURL({ size: 1024 })
            })
            .setThumbnail(guild.iconURL({ size: 1024 }))

            .addFields(
                {
                    name: '🏠 GENERAL INFORMATION',
                    value:
                        `**Server Name:** ${guild.name}\n` +
                        `**Server ID:** \`${guild.id}\`\n` +
                        `**Owner:** ${owner}\n` +
                        `**Members:** ${guild.memberCount}\n` +
                        `**Created:** <t:${Math.floor(guild.createdTimestamp / 1000)}:F>`
                },
                {
                    name: '📊 SERVER STATISTICS',
                    value:
                        `**Text Channels:** ${textChannels}\n` +
                        `**Voice Channels:** ${voiceChannels}\n` +
                        `**Categories:** ${categories}\n` +
                        `**Roles:** ${guild.roles.cache.size}\n` +
                        `**Emojis:** ${guild.emojis.cache.size}`,
                    inline: true
                },
                {
                    name: '⚙️ SERVER SETTINGS',
                    value:
                        `**AFK Timeout:** ${guild.afkTimeout / 60} min\n` +
                        `**Locale:** ${guild.preferredLocale}`,
                    inline: true
                }
            );

        const bannerURL = guild.bannerURL({
            size: 2048
        });

        if (bannerURL) {
            embed.setImage(bannerURL);
        }

        await interaction.reply({
            embeds: [embed]
        });

    }
};