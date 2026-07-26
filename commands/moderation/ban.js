const {
    SlashCommandBuilder,
    PermissionFlagsBits,
    MessageFlags
} = require('discord.js');

const {
    createErrorEmbed,
    createModerationEmbed
} = require('../../utils/embeds');

const {
    hasBotPermission,
    getModerationError
} = require('../../utils/moderation');

const {
    sendModLog
} = require('../../utils/modLogs');

module.exports = {
    category: 'moderation',

    data: new SlashCommandBuilder()
        .setName('ban')
        .setDescription(
            'Ban a Soul from the Order.'
        )

        .addUserOption(option =>
            option
                .setName('user')
                .setDescription(
                    'Select the Soul you want to ban'
                )
                .setRequired(true)
        )

        .addStringOption(option =>
            option
                .setName('reason')
                .setDescription(
                    'Reason for the ban'
                )
                .setMaxLength(500)
                .setRequired(false)
        )

        .addIntegerOption(option =>
            option
                .setName('delete_messages')
                .setDescription(
                    'Delete messages sent during the selected number of days'
                )
                .addChoices(
                    {
                        name:
                            'Do not delete messages',
                        value: 0
                    },
                    {
                        name:
                            'Delete messages from the last day',
                        value: 1
                    },
                    {
                        name:
                            'Delete messages from the last 7 days',
                        value: 7
                    }
                )
                .setRequired(false)
        )

        .setDefaultMemberPermissions(
            PermissionFlagsBits.BanMembers
        )

        .setDMPermission(false),

    /**
     * Execute the /ban command.
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

            const user =
                interaction.options.getUser(
                    'user',
                    true
                );

            const member =
                interaction.options.getMember(
                    'user'
                );

            const reason =
                interaction.options.getString(
                    'reason'
                ) ||
                'No reason was provided.';

            const deleteMessageDays =
                interaction.options.getInteger(
                    'delete_messages'
                ) || 0;

            const botMember =
                interaction.guild.members.me;

            if (
                !botMember ||
                !hasBotPermission(
                    botMember,
                    PermissionFlagsBits.BanMembers
                )
            ) {
                await interaction.reply({
                    embeds: [
                        createErrorEmbed(
                            '❌ Missing Umbra Permission',
                            'Umbra requires the **Ban Members** permission to carry out this action.'
                        )
                    ],

                    flags:
                        MessageFlags.Ephemeral
                });

                return;
            }

            if (
                user.id ===
                interaction.user.id
            ) {
                await interaction.reply({
                    embeds: [
                        createErrorEmbed(
                            '❌ Ban Failed',
                            'You cannot ban yourself from the Order.'
                        )
                    ],

                    flags:
                        MessageFlags.Ephemeral
                });

                return;
            }

            if (
                user.id ===
                interaction.client.user.id
            ) {
                await interaction.reply({
                    embeds: [
                        createErrorEmbed(
                            '❌ Ban Failed',
                            'Umbra cannot ban itself.'
                        )
                    ],

                    flags:
                        MessageFlags.Ephemeral
                });

                return;
            }

            if (
                user.id ===
                interaction.guild.ownerId
            ) {
                await interaction.reply({
                    embeds: [
                        createErrorEmbed(
                            '❌ Ban Failed',
                            'The Crimson Lord cannot be banned.'
                        )
                    ],

                    flags:
                        MessageFlags.Ephemeral
                });

                return;
            }

            if (member) {
                const moderationError =
                    getModerationError({
                        interaction,
                        target: member,
                        botMember
                    });

                if (moderationError) {
                    await interaction.reply({
                        embeds: [
                            createErrorEmbed(
                                '❌ Ban Failed',
                                moderationError
                            )
                        ],

                        flags:
                            MessageFlags.Ephemeral
                    });

                    return;
                }

                if (!member.bannable) {
                    await interaction.reply({
                        embeds: [
                            createErrorEmbed(
                                '❌ Ban Failed',
                                'Umbra cannot ban this Soul. Check its permissions and role position.'
                            )
                        ],

                        flags:
                            MessageFlags.Ephemeral
                    });

                    return;
                }
            }

            await interaction.deferReply();

            await interaction.guild.members.ban(
                user.id,
                {
                    deleteMessageSeconds:
                        deleteMessageDays *
                        24 *
                        60 *
                        60,

                    reason:
                        `${reason} | Shadow Warden: ${interaction.user.tag}`
                }
            );

            const embed =
                createModerationEmbed({
                    action:
                        '🔨 Soul Banished',

                    user,

                    moderator:
                        interaction.user,

                    reason
                });

            embed.addFields({
                name:
                    '🗑️ Deleted Messages',

                value:
                    deleteMessageDays === 0
                        ? 'No messages were deleted.'
                        : `Messages from the last ${deleteMessageDays} day${
                            deleteMessageDays === 1
                                ? ''
                                : 's'
                        } were deleted.`,

                inline:
                    false
            });

            await interaction.editReply({
                embeds: [embed]
            });

            try {
                await sendModLog({
                    guild:
                        interaction.guild,

                    action:
                        '🔨 Soul Banished',

                    user,

                    moderator:
                        interaction.user,

                    reason,

                    fields: [
                        {
                            name:
                                '🗑️ Deleted Messages',

                            value:
                                deleteMessageDays === 0
                                    ? 'No messages deleted'
                                    : `Messages from the last ${deleteMessageDays} day${
                                        deleteMessageDays === 1
                                            ? ''
                                            : 's'
                                    }`,

                            inline:
                                false
                        }
                    ]
                });
            } catch (logError) {
                console.error(
                    '❌ Umbra failed to send the ban moderation log:',
                    logError
                );
            }
        } catch (error) {
            console.error(
                '❌ Umbra /ban command error:',
                error
            );

            const errorEmbed =
                createErrorEmbed(
                    '❌ Ban Failed',
                    'Umbra encountered an unexpected error while trying to ban this Soul.'
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