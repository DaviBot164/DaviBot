const { SlashCommandBuilder } = require('discord.js');
module.exports = {
    data: new SlashCommandBuilder().setName('ping').setDescription('Check bot response time.'),
    async execute(interaction) {
        const started = Date.now();
        await interaction.reply({ content: 'Checking connection…' });
        await interaction.editReply({ content: `Response: ${Date.now() - started} ms · Gateway: ${Math.max(0, Math.round(interaction.client.ws.ping))} ms`, allowedMentions: { parse: [] } });
    }
};
