const {
    SlashCommandBuilder,
    PermissionFlagsBits,
    MessageFlags
} = require('discord.js');

const {
    createEmbed,
    createErrorEmbed
} = require('../../utils/embeds');

const {
    handleModerationCommandError
} = require('../../utils/moderation');

const {
    sendModLog
} = require('../../utils/modLogs');

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
                            '❌ THE Ⅹ SINS Only Command',
                            'This command can only be used inside THE Ⅹ SINS.'
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
                await interaction.guild.members
                    .fetchMe();

            if (
                !botMember.permissions.has(
                    PermissionFlagsBits.ManageMessages
                )
            ) {
                await interaction.reply({
                    embeds: [
                        createErrorEmbed(
                            '❌ Missing Evelynn Permission',
                            'Evelynn requires the **Manage Messages** permission to clear messages.'
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
                            'Only a THE Ⅹ SINS moderator with **Manage Messages** may use this command.'
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
                            `Evelynn cannot manage messages inside ${interaction.channel}.`
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
                            `Evelynn removed **${deletedCount}** message${
                                deletedCount === 1
                                    ? ''
                                    : 's'
                            } from ${interaction.channel}.`,
                            '',
                            '*The channel has been cleansed beneath the moon of THE Ⅹ SINS.*'
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
                                '🛡️ Moderator',

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
                    'Evelynn • Guardian of THE Ⅹ SINS',

                iconURL:
                    interaction.client.user
                        .displayAvatarURL({
                            size:
                                128,

                            forceStatic:
                                false
                        })
            });

            await interaction.editReply({
                embeds: [
                    embed
                ]
            });

            await sendModLog({
                guild:
                    interaction.guild,

                action:
                    '🧹 Channel Purged',

                channel:
                    interaction.channel,

                moderator:
                    interaction.user,

                reason:
                    'Messages were removed with the /clear command.',

                fields: [
                    {
                        name:
                            '🗑️ Requested Messages',

                        value:
                            `\`${amount}\``,

                        inline:
                            true
                    },
                    {
                        name:
                            '✅ Deleted Messages',

                        value:
                            `\`${deletedCount}\``,

                        inline:
                            true
                    }
                ]
            });
        } catch (error) {
            await handleModerationCommandError({
                interaction,
                error,

                commandName:
                    'clear',

                title:
                    '❌ Channel Purge Failed',

                description:
                    'Evelynn could not delete the requested messages. Discord cannot bulk-delete messages older than 14 days.'
            });
        }
    }
};