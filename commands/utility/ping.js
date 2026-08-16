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
            'Check Evelynn’s current latency and status.'
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

            const status =
                apiLatency < 150
                    ? '🟢 Stable'
                    : apiLatency < 300
                        ? '🟡 Delayed'
                        : '🔴 High Latency';

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
                        '🌙 Evelynn Status',

                    description:
                        '**Guardian of THE Ⅹ SINS is online.**',

                    color:
                        '#6F42C1',

                    thumbnail:
                        botAvatar,

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
                                '🛡️ Status',

                            value:
                                status,

                            inline:
                                false
                        }
                    ]
                });

            embed.setAuthor({
                name:
                    'Evelynn • Guardian of THE Ⅹ SINS',

                iconURL:
                    botAvatar
            });

            embed.setFooter({
                text:
                    `THE Ⅹ SINS System Check • Requested by ${interaction.user.username}`,

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
                '❌ Error executing Evelynn /ping:',
                error
            );

            const errorEmbed =
                createErrorEmbed(
                    '❌ Evelynn Status Unavailable',
                    'Evelynn could not calculate the current latency.'
                );

            if (interaction.deferred) {
                await interaction
                    .editReply({
                        embeds: [
                            errorEmbed
                        ]
                    })
                    .catch(
                        () => null
                    );

                return;
            }

            if (interaction.replied) {
                await interaction
                    .followUp({
                        embeds: [
                            errorEmbed
                        ],

                        flags:
                            MessageFlags.Ephemeral
                    })
                    .catch(
                        () => null
                    );

                return;
            }

            await interaction
                .reply({
                    embeds: [
                        errorEmbed
                    ],

                    flags:
                        MessageFlags.Ephemeral
                })
                .catch(
                    () => null
                );
        }
    }
};