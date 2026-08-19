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

const warningDatabase =
    require('../../database/warnings');

module.exports = {
    category: 'moderation',

    data: new SlashCommandBuilder()
        .setName('unwarn')
        .setDescription(
            'Remove one or all warning records from a Soul.'
        )

        .addSubcommand(subcommand =>
            subcommand
                .setName('single')
                .setDescription(
                    'Remove one warning by its ID.'
                )

                .addIntegerOption(option =>
                    option
                        .setName('warning_id')
                        .setDescription(
                            'ID of the warning record to remove'
                        )
                        .setMinValue(1)
                        .setRequired(true)
                )
        )

        .addSubcommand(subcommand =>
            subcommand
                .setName('all')
                .setDescription(
                    'Remove all warnings from a Soul.'
                )

                .addUserOption(option =>
                    option
                        .setName('user')
                        .setDescription(
                            'Select the Soul whose warnings should be removed'
                        )
                        .setRequired(true)
                )
        )

        .setDefaultMemberPermissions(
            PermissionFlagsBits.ModerateMembers
        )

        .setDMPermission(false),

    /**
     * Execute the /unwarn command.
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
                            '❌ LUNAR SEIREITEI Only Command',
                            'This command can only be used inside LUNAR SEIREITEI.'
                        )
                    ],

                    flags:
                        MessageFlags.Ephemeral
                });

                return;
            }

            const subcommand =
                interaction.options.getSubcommand();

            await interaction.deferReply({
                flags:
                    MessageFlags.Ephemeral
            });

            if (
                subcommand ===
                'single'
            ) {
                await removeSingleWarning(
                    interaction
                );

                return;
            }

            if (
                subcommand ===
                'all'
            ) {
                await removeAllWarnings(
                    interaction
                );

                return;
            }

            await interaction.editReply({
                embeds: [
                    createErrorEmbed(
                        '❌ Unknown Warning Action',
                        'Evelynn could not recognize the selected warning action.'
                    )
                ]
            });
        } catch (error) {
            await handleModerationCommandError({
                interaction,
                error,

                commandName:
                    'unwarn',

                title:
                    '❌ Warning Removal Failed',

                description:
                    'Evelynn could not remove the warning record. Please check the database connection.'
            });
        }
    }
};

/**
 * Remove one warning record by its ID.
 *
 * @param {import('discord.js').ChatInputCommandInteraction} interaction
 * @returns {Promise<void>}
 */
async function removeSingleWarning(
    interaction
) {
    const warningId =
        interaction.options.getInteger(
            'warning_id',
            true
        );

    const warning =
        await warningDatabase.getWarningById(
            interaction.guild.id,
            warningId
        );

    if (!warning) {
        await interaction.editReply({
            embeds: [
                createErrorEmbed(
                    '❌ Warning Record Not Found',
                    `No warning with ID **#${warningId}** exists within LUNAR SEIREITEI.`
                )
            ]
        });

        return;
    }

    const deletedWarning =
        await warningDatabase.deleteWarningById(
            interaction.guild.id,
            warningId
        );

    if (!deletedWarning) {
        await interaction.editReply({
            embeds: [
                createErrorEmbed(
                    '❌ Warning Removal Failed',
                    'Evelynn could not remove the selected warning record.'
                )
            ]
        });

        return;
    }

    const remainingWarnings =
        await warningDatabase.countWarnings(
            interaction.guild.id,
            deletedWarning.user_id
        );

    const targetUser =
        await interaction.client.users
            .fetch(
                deletedWarning.user_id
            )
            .catch(
                () => null
            );

    const embed =
        createEmbed({
            title:
                '🗑️ Sacred Warning Removed',

            description:
                `Warning record **#${deletedWarning.id}** was removed successfully.`,

            fields: [
                {
                    name:
                        '🌙 Soul',

                    value:
                        `<@${deletedWarning.user_id}>\n` +
                        `\`${deletedWarning.user_id}\``,

                    inline:
                        true
                },
                {
                    name:
                        '🛡️ Removed By',

                    value:
                        `${interaction.user}\n` +
                        `\`${interaction.user.id}\``,

                    inline:
                        true
                },
                {
                    name:
                        '📜 Original Reason',

                    value:
                        deletedWarning.reason ||
                        'No reason was recorded.',

                    inline:
                        false
                },
                {
                    name:
                        '📚 Remaining Warnings',

                    value:
                        `\`${remainingWarnings}\``,

                    inline:
                        true
                }
            ]
        });

    embed.setFooter({
        text:
            `🌙 Evelynn Warning Records • Removed by ${interaction.user.username}`,

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

    const logFields = [
        {
            name:
                '🆔 Removed Warning',

            value:
                `\`#${deletedWarning.id}\``,

            inline:
                true
        },
        {
            name:
                '📚 Remaining Warnings',

            value:
                `\`${remainingWarnings}\``,

            inline:
                true
        }
    ];

    if (!targetUser) {
        logFields.push({
            name:
                '🌙 Soul ID',

            value:
                `\`${deletedWarning.user_id}\``,

            inline:
                true
        });
    }

    await sendModLog({
        guild:
            interaction.guild,

        action:
            '🗑️ Sacred Warning Removed',

        user:
            targetUser,

        moderator:
            interaction.user,

        reason:
            deletedWarning.reason ||
            'No reason was recorded.',

        fields:
            logFields
    });
}

/**
 * Remove every warning record from a Soul.
 *
 * @param {import('discord.js').ChatInputCommandInteraction} interaction
 * @returns {Promise<void>}
 */
async function removeAllWarnings(
    interaction
) {
    const user =
        interaction.options.getUser(
            'user',
            true
        );

    const warningCount =
        await warningDatabase.countWarnings(
            interaction.guild.id,
            user.id
        );

    if (
        warningCount ===
        0
    ) {
        await interaction.editReply({
            embeds: [
                createErrorEmbed(
                    '❌ No Warning Records Found',
                    `${user.tag} has no warnings within LUNAR SEIREITEI.`
                )
            ]
        });

        return;
    }

    const deletedCount =
        await warningDatabase.deleteAllWarnings(
            interaction.guild.id,
            user.id
        );

    const embed =
        createEmbed({
            title:
                '🗑️ All Sacred Warnings Removed',

            description:
                [
                    `All warning records for ${user} were removed successfully.`,
                    '',
                    '*Evelynn has cleared this Soul’s Guardian record within LUNAR SEIREITEI.*'
                ].join('\n'),

            thumbnail:
                user.displayAvatarURL({
                    size:
                        256,

                    forceStatic:
                        false
                }),

            fields: [
                {
                    name:
                        '🌙 Soul',

                    value:
                        `${user}\n` +
                        `\`${user.id}\``,

                    inline:
                        true
                },
                {
                    name:
                        '🛡️ Removed By',

                    value:
                        `${interaction.user}\n` +
                        `\`${interaction.user.id}\``,

                    inline:
                        true
                },
                {
                    name:
                        '🗑️ Deleted Records',

                    value:
                        `\`${deletedCount}\``,

                    inline:
                        true
                },
                {
                    name:
                        '🌙 LUNAR SEIREITEI Status',

                    value:
                        '🟢 Warning record cleared',

                    inline:
                        false
                }
            ]
        });

    embed.setFooter({
        text:
            `🌙 Evelynn Warning Records • Cleared by ${interaction.user.username}`,

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
            '🗑️ All Sacred Warnings Removed',

        user,

        moderator:
            interaction.user,

        reason:
            'All warning records were cleared by a LUNAR SEIREITEI moderator.',

        fields: [
            {
                name:
                    '🗑️ Deleted Records',

                value:
                    `\`${deletedCount}\``,

                inline:
                    true
            },
            {
                name:
                    '🌙 LUNAR SEIREITEI Status',

                value:
                    '🟢 Warning record cleared',

                inline:
                    false
            }
        ]
    });
}