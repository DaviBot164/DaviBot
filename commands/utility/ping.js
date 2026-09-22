const { SlashCommandBuilder } = require('discord.js');
const { createEmbed } = require('../../utils/embeds');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('ping')
        .setDescription('Check Akane latency.'),

    async execute(interaction) {
        const latency = interaction.client.ws.ping;

        await interaction.reply({
            embeds: [
                createEmbed(
                    'Moon Signal',
                    `Latency: **${latency}ms**`
                )
            ]
        });
    }
};