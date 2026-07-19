const {
    SlashCommandBuilder,
    MessageFlags
} = require('discord.js');

const {
    createEmbed
} = require('../../utils/embeds');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('help')
        .setDescription('Displays all available commands.'),

    async execute(interaction) {
        const embed = createEmbed({
            title: '📖 DaviBot Help',
            description:
                'Welcome to **DaviBot**!\n\n' +
                'Here are the commands currently available.',
            fields: [
                {
                    name: '📜 General',
                    value:
                        '• `/ping`\n' +
                        '• `/help`\n' +
                        '• `/testwelcome`',
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
                        '• `/ban`\n' +
                        '• `/timeout`\n' +
                        '• `/untimeout`\n' +
                        '• `/warn`\n' +
                        '• `/warnings`',
                    inline: false
                }
            ]
        });

        await interaction.reply({
            embeds: [embed],
            flags: MessageFlags.Ephemeral
        });
    }
};