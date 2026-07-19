const {
    SlashCommandBuilder,
    ChannelType,
    MessageFlags
} = require('discord.js');

const {
    createEmbed,
    createErrorEmbed
} = require('../../utils/embeds');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('serverinfo')
        .setDescription('View information about this server.'),

    async execute(interaction) {
        try {
            const { guild } = interaction;

            const owner = await guild.fetchOwner();

            const textChannels = guild.channels.cache.filter(
                channel =>
                    channel.type === ChannelType.GuildText
            ).size;

            const voiceChannels = guild.channels.cache.filter(
                channel =>
                    channel.type === ChannelType.GuildVoice
            ).size;

            const categories = guild.channels.cache.filter(
                channel =>
                    channel.type === ChannelType.GuildCategory
            ).size;

            const serverIcon = guild.iconURL({
                size: 1024
            });

            const createdTimestamp = Math.floor(
                guild.createdTimestamp / 1000
            );

            const embed = createEmbed({
                title: '🏠 Server Information',
                description:
                    `Detailed information about **${guild.name}**.`,
                thumbnail: serverIcon,
                fields: [
                    {
                        name: '🏠 General Information',
                        value:
                            `**Server Name:** ${guild.name}\n` +
                            `**Server ID:** \`${guild.id}\`\n` +
                            `**Owner:** ${owner}\n` +
                            `**Members:** ${guild.memberCount}\n` +
                            `**Created:** <t:${createdTimestamp}:F>\n` +
                            `**Server Age:** <t:${createdTimestamp}:R>`,
                        inline: false
                    },
                    {
                        name: '📊 Server Statistics',
                        value:
                            `**Text Channels:** ${textChannels}\n` +
                            `**Voice Channels:** ${voiceChannels}\n` +
                            `**Categories:** ${categories}\n` +
                            `**Roles:** ${guild.roles.cache.size}\n` +
                            `**Emojis:** ${guild.emojis.cache.size}`,
                        inline: true
                    },
                    {
                        name: '⚙️ Server Settings',
                        value:
                            `**AFK Timeout:** ${guild.afkTimeout / 60} min\n` +
                            `**Locale:** ${guild.preferredLocale}`,
                        inline: true
                    }
                ]
            });

            embed.setAuthor({
                name: `${guild.name} • Server Information`,
                iconURL:
                    serverIcon ||
                    interaction.client.user.displayAvatarURL({
                        size: 128
                    })
            });

            const bannerURL = guild.bannerURL({
                size: 2048
            });

            if (bannerURL) {
                embed.setImage(bannerURL);
            }

            await interaction.reply({
                embeds: [embed]
            });
        } catch (error) {
            console.error(
                '❌ Error executing /serverinfo:',
                error
            );

            const errorEmbed = createErrorEmbed(
                '❌ Server Information Error',
                'I could not retrieve information about this server.'
            );

            if (
                interaction.replied ||
                interaction.deferred
            ) {
                return interaction.followUp({
                    embeds: [errorEmbed],
                    flags: MessageFlags.Ephemeral
                });
            }

            await interaction.reply({
                embeds: [errorEmbed],
                flags: MessageFlags.Ephemeral
            });
        }
    }
};