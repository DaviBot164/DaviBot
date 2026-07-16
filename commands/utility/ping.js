const { SlashCommandBuilder } = require('discord.js');
const { createEmbed } = require('../../utils/embeds');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('ping')
        .setDescription('Check the bot latency.'),

    async execute(interaction) {

        const apiLatency = Math.round(interaction.client.ws.ping);

        const embed = createEmbed(interaction)
            .setAuthor({
                name: '🏓 Empire Ping',
                iconURL: interaction.client.user.displayAvatarURL()
            })
            .setDescription('The bot is online and responding correctly.')
            .addFields({
                name: '🌐 API Latency',
                value: `\`${apiLatency} ms\``,
                inline: true
            });

        await interaction.reply({
            embeds: [embed]
        });

    }
};