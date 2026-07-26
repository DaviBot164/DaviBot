const {
    SlashCommandBuilder,
    MessageFlags
} = require('discord.js');

const {
    createEmbed,
    createErrorEmbed
} = require('../../utils/embeds');

module.exports = {
    category: 'general',

    data: new SlashCommandBuilder()
        .setName('ping')
        .setDescription(
            'Check Umbra’s current latency and status.'
        )
        .setDMPermission(false),

    /**
     * Execute the /ping command.
     *
     * @param {import('discord.js').ChatInputCommandInteraction} interaction
     * @returns {Promise<void>}
     */
    async execute(interaction) {
        try {
            const apiLatency =
                Math.round(
                    interaction.client.ws.ping
                );

            const responseTime =
                Date.now() -
                interaction.createdTimestamp;

            const status =
                apiLatency < 150
                    ? '🟢 Stable'
                    : apiLatency < 300
                        ? '🟡 Delayed'
                        : '🔴 High Latency';

            const embed =
                createEmbed({
                    title:
                        '🌑 Umbra Status',

                    description:
                        [
                            '**Guardian of Crimson Eclipse**',
                            '',
                            'Umbra is awake and watching over the Order.'
                        ].join('\n'),

                    thumbnail:
                        interaction.client.user
                            .displayAvatarURL({
                                size: 256,
                                forceStatic: false
                            }),

                    fields: [
                        {
                            name:
                                '🌐 API Latency',

                            value:
                                `\`${apiLatency} ms\``,

                            inline:
                                true
                        },
                        {
                            name:
                                '⚡ Response Time',

                            value:
                                `\`${responseTime} ms\``,

                            inline:
                                true
                        },
                        {
                            name:
                                '🛡️ Guardian Status',

                            value:
                                `\`${status}\``,

                            inline:
                                false
                        }
                    ]
                });

            embed.setAuthor({
                name:
                    'Umbra • Guardian of Crimson Eclipse',

                iconURL:
                    interaction.client.user
                        .displayAvatarURL({
                            size: 128,
                            forceStatic: false
                        })
            });

            await interaction.reply({
                embeds: [embed]
            });
        } catch (error) {
            console.error(
                '❌ Error executing Umbra /ping:',
                error
            );

            const errorEmbed =
                createErrorEmbed(
                    '❌ Umbra Status Unavailable',
                    'Umbra could not calculate the current latency.'
                );

            if (
                interaction.replied ||
                interaction.deferred
            ) {
                await interaction.followUp({
                    embeds: [
                        errorEmbed
                    ],
                    flags:
                        MessageFlags.Ephemeral
                });

                return;
            }

            await interaction.reply({
                embeds: [
                    errorEmbed
                ],
                flags:
                    MessageFlags.Ephemeral
            });
        }
    }
};