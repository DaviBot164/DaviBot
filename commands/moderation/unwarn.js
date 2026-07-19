const {
    SlashCommandBuilder,
    PermissionFlagsBits,
    MessageFlags
} = require('discord.js');

const {
    createEmbed,
    createErrorEmbed
} = require('../../utils/embeds');

const warningDatabase =
    require('../../database/warnings');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('unwarn')
        .setDescription(
            'Remove one warning or all warnings from a server member.'
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
                            'ID of the warning to remove'
                        )
                        .setMinValue(1)
                        .setRequired(true)
                )
        )

        .addSubcommand(subcommand =>
            subcommand
                .setName('all')
                .setDescription(
                    'Remove all warnings from a member.'
                )

                .addUserOption(option =>
                    option
                        .setName('user')
                        .setDescription(
                            'Member whose warnings should be removed'
                        )
                        .setRequired(true)
                )
        )

        .setDefaultMemberPermissions(
            PermissionFlagsBits.ModerateMembers
        ),

    async execute(interaction) {
        try {
            const subcommand =
                interaction.options.getSubcommand();

            await interaction.deferReply({
                flags: MessageFlags.Ephemeral
            });

            if (subcommand === 'single') {
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
                    const embed = createErrorEmbed(
                        '❌ Warning Not Found',
                        `No warning with ID **#${warningId}** exists in this server.`
                    );

                    return interaction.editReply({
                        embeds: [embed]
                    });
                }

                const deletedWarning =
                    await warningDatabase.deleteWarningById(
                        interaction.guild.id,
                        warningId
                    );

                const remainingWarnings =
                    await warningDatabase.countWarnings(
                        interaction.guild.id,
                        deletedWarning.user_id
                    );

                const embed = createEmbed({
                    title: '🗑️ Warning Removed',

                    description:
                        `Warning **#${deletedWarning.id}** was removed successfully.`,

                    fields: [
                        {
                            name: '👤 User',
                            value:
                                `<@${deletedWarning.user_id}>\n` +
                                `\`${deletedWarning.user_id}\``,
                            inline: true
                        },
                        {
                            name: '👮 Removed By',
                            value:
                                `${interaction.user}\n` +
                                `\`${interaction.user.id}\``,
                            inline: true
                        },
                        {
                            name: '📝 Original Reason',
                            value: deletedWarning.reason,
                            inline: false
                        },
                        {
                            name: '📚 Remaining Warnings',
                            value:
                                String(remainingWarnings),
                            inline: true
                        }
                    ]
                });

                return interaction.editReply({
                    embeds: [embed]
                });
            }

            if (subcommand === 'all') {
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

                if (warningCount === 0) {
                    const embed = createErrorEmbed(
                        '❌ No Warnings Found',
                        `${user.tag} does not have any warnings in this server.`
                    );

                    return interaction.editReply({
                        embeds: [embed]
                    });
                }

                const deletedCount =
                    await warningDatabase.deleteAllWarnings(
                        interaction.guild.id,
                        user.id
                    );

                const embed = createEmbed({
                    title: '🗑️ All Warnings Removed',

                    description:
                        `All warnings for ${user} were removed successfully.`,

                    thumbnail:
                        user.displayAvatarURL({
                            size: 256
                        }),

                    fields: [
                        {
                            name: '👤 User',
                            value:
                                `${user}\n\`${user.id}\``,
                            inline: true
                        },
                        {
                            name: '👮 Removed By',
                            value:
                                `${interaction.user}\n` +
                                `\`${interaction.user.id}\``,
                            inline: true
                        },
                        {
                            name: '🗑️ Deleted Warnings',
                            value:
                                String(deletedCount),
                            inline: true
                        }
                    ]
                });

                return interaction.editReply({
                    embeds: [embed]
                });
            }
        } catch (error) {
            console.error(
                'Unwarn command error:',
                error
            );

            const embed = createErrorEmbed(
                '❌ Unwarn Failed',
                'The warning could not be removed. Please check the database connection.'
            );

            if (
                interaction.deferred ||
                interaction.replied
            ) {
                return interaction.editReply({
                    embeds: [embed]
                });
            }

            return interaction.reply({
                embeds: [embed],
                flags: MessageFlags.Ephemeral
            });
        }
    }
};