const { SlashCommandBuilder } = require('discord.js');
const { createEmbed } = require('../utils/embeds');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('help')
        .setDescription('Displays all available commands.'),

    async execute(interaction) {

        const embed = createEmbed(interaction)
            .setTitle('📖 DaviBot Help')
            .setDescription(
                'Welcome to **DaviBot**!\n\nHere are the commands currently available.'
            )
            .addFields(
                {
                    name: '📜 General',
                    value:
                        '• `/ping`\n' +
                        '• `/help`',
                    inline: true
                },
                {
                    name: '👤 Information',
                    value:
                        '• `/userinfo`\n' +
                        '• `/serverinfo`\n' +
                        '• `/avatar`\n' +
                        '• `/profile`',
                    inline: true
                },
                {
                    name: '🛡️ Moderation',
                    value:
                        '• `/clear`\n' +
                        '• `/kick`\n' +
                        '• `/ban`',
                    inline: true
                }
            );

        await interaction.reply({
            embeds: [embed]
        });

    }
};