const {
    SlashCommandBuilder,
    MessageFlags
} = require('discord.js');

const {
    createEmbed,
    createErrorEmbed
} = require('../../utils/embeds');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('ping')
        .setDescription('Check the bot latency.'),

    async execute(interaction) {
        try {
            const apiLatency = Math.round(
                interaction.client.ws.ping
            );

            const interactionLatency =
                Date.now() - interaction.createdTimestamp;

            const embed = createEmbed({
                title: '🏓 Seraphiel Ping',
                description:
                    'Seraphiel is online and responding correctly.',
                thumbnail:
                    interaction.client.user.displayAvatarURL({
                        size: 256
                    }),
                fields: [
                    {
                        name: '🌐 API Latency',
                        value: `\`${apiLatency} ms\``,
                        inline: true
                    },
                    {
                        name: '⚡ Response Time',
                        value: `\`${interactionLatency} ms\``,
                        inline: true
                    },
                    {
                        name: '🛡️ Status',
                        value: '`\u2705 Operational`',
                        inline: false
                    }
                ]
            });

            embed.setAuthor({
                name: 'Seraphiel • Guardian of Your Community',
                iconURL:
                    interaction.client.user.displayAvatarURL({
                        size: 128
                    })
            });

            await interaction.reply({
                embeds: [embed]
            });
        } catch (error) {
            console.error('❌ Error executing /ping:', error);

            const errorEmbed = createErrorEmbed(
                '❌ Ping Error',
                'I could not calculate the current latency.'
            );

            if (interaction.replied || interaction.deferred) {
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