const {
    SlashCommandBuilder,
    PermissionFlagsBits,
    MessageFlags
} = require('discord.js');

const {
    createEmbed,
    createErrorEmbed
} = require('../../utils/embeds');

module.exports = {
    category: 'moderation',

    data: new SlashCommandBuilder()
        .setName('clear')
        .setDescription(
            'Remove multiple messages from a channel.'
        )
        .addIntegerOption(option =>
            option
                .setName('amount')
                .setDescription(
                    'Number of messages to delete (1-100)'
                )
                .setRequired(true)
                .setMinValue(1)
                .setMaxValue(100)
        )
        .setDefaultMemberPermissions(
            PermissionFlagsBits.ManageMessages
        )
        .setDMPermission(false),

    /**
     * Execute the /clear command.
     *
     * @param {import('discord.js').ChatInputCommandInteraction} interaction
     * @returns {Promise<void>}
     */
    async execute(interaction) {
        try {
            if (!interaction.inGuild()) {
                await interaction.reply({
                    embeds: [
                        createErrorEmbed(
                            '❌ Order Only Command',
                            'This command can only be used inside a server.'
                        )
                    ],
                    flags:
                        MessageFlags.Ephemeral
                });

                return;
            }

            const amount =
                interaction.options.getInteger(
                    'amount',
                    true
                );

            const botMember =
                await interaction.guild.members.fetchMe();

            if (
                !botMember.permissions.has(
                    PermissionFlagsBits.ManageMessages
                )
            ) {
                await interaction.reply({
                    embeds: [
                        createErrorEmbed(
                            '❌ Missing Umbra Permission',
                            'Umbra requires the **Manage Messages** permission to clear messages.'
                        )
                    ],
                    flags:
                        MessageFlags.Ephemeral
                });

                return;
            }

            if (
                !interaction.member.permissions.has(
                    PermissionFlagsBits.ManageMessages
                )
            ) {
                await interaction.reply({
                    embeds: [
                        createErrorEmbed(
                            '❌ Permission Denied',
                            'Only a Shadow Warden with **Manage Messages** may use this command.'
                        )
                    ],
                    flags:
                        MessageFlags.Ephemeral
                });

                return;
            }

            const channelPermissions =
                interaction.channel.permissionsFor(
                    botMember
                );

            if (
                !channelPermissions?.has(
                    PermissionFlagsBits.ManageMessages
                )
            ) {
                await interaction.reply({
                    embeds: [
                        createErrorEmbed(
                            '❌ Channel Permission Missing',
                            `Umbra cannot manage messages inside ${interaction.channel}.`
                        )
                    ],
                    flags:
                        MessageFlags.Ephemeral
                });

                return;
            }

            await interaction.deferReply({
                flags:
                    MessageFlags.Ephemeral
            });

            const deletedMessages =
                await interaction.channel.bulkDelete(
                    amount,
                    true
                );

            const deletedCount =
                deletedMessages.size;

            const embed =
                createEmbed({
                    title:
                        '🧹 Channel Purged',

                    description:
                        [
                            `Umbra removed **${deletedCount}** message${
                                deletedCount === 1
                                    ? ''
                                    : 's'
                            } from ${interaction.channel}.`,
                            '',
                            '*The channel has been cleansed beneath the crimson moon.*'
                        ].join('\n'),

                    fields: [
                        {
                            name:
                                '📺 Channel',

                            value:
                                `${interaction.channel}\n` +
                                `\`${interaction.channel.id}\``,

                            inline:
                                true
                        },
                        {
                            name:
                                '🛡️ Shadow Warden',

                            value:
                                `${interaction.user}\n` +
                                `\`${interaction.user.id}\``,

                            inline:
                                true
                        },
                        {
                            name:
                                '🗑️ Deleted Messages',

                            value:
                                `\`${deletedCount}\``,

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

            await interaction.editReply({
                embeds: [embed]
            });
        } catch (error) {
            console.error(
                '❌ Umbra /clear command error:',
                error
            );

            const errorEmbed =
                createErrorEmbed(
                    '❌ Channel Purge Failed',
                    'Umbra could not delete the requested messages. Discord cannot bulk-delete messages older than 14 days.'
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