const {
    SlashCommandBuilder,
    PermissionFlagsBits
} = require('discord.js');

const {
    createErrorEmbed,
    createModerationEmbed
} = require('../../utils/embeds');

const warningDatabase =
    require('../../database/warnings');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('unwarn')
        .setDescription(
            'Remove a warning by its warning ID.'
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

        .setDefaultMemberPermissions(
            PermissionFlagsBits.ModerateMembers
        ),

    async execute(interaction) {
        try {
            const warningId =
                interaction.options.getInteger(
                    'warning_id',
                    true
                );

            await interaction.deferReply();

            const warning =
                await warningDatabase.getWarningById(
                    interaction.guild.id,
                    warningId
                );

            if (!warning) {
                const embed = createErrorEmbed(
                    '❌ Warning Not Found',
                    `Warning #${warningId} does not exist in this server.`
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

            if (!deletedWarning) {
                const embed = createErrorEmbed(
                    '❌ Warning Removal Failed',
                    `Warning #${warningId} could not be removed.`
                );

                return interaction.editReply({
                    embeds: [embed]
                });
            }

            const remainingWarnings =
                await warningDatabase.countWarnings(
                    interaction.guild.id,
                    deletedWarning.user_id
                );

            let targetUser = null;

            try {
                targetUser =
                    await interaction.client.users.fetch(
                        deletedWarning.user_id
                    );
            } catch {
                targetUser = null;
            }

            const embed = createModerationEmbed({
                action: '🗑️ Warning Removed',
                user: targetUser || {
                    id: deletedWarning.user_id,
                    tag: 'Unknown User',
                    displayAvatarURL: () => null
                },
                moderator: interaction.user,
                reason: deletedWarning.reason
            });

            embed.addFields(
                {
                    name: '🆔 Removed Warning',
                    value: `#${deletedWarning.id}`,
                    inline: true
                },
                {
                    name: '📚 Remaining Warnings',
                    value: String(remainingWarnings),
                    inline: true
                },
                {
                    name: '👮 Original Moderator',
                    value: `<@${deletedWarning.moderator_id}>`,
                    inline: true
                }
            );

            return interaction.editReply({
                embeds: [embed]
            });
        } catch (error) {
            console.error(
                'Unwarn command error:',
                error
            );

            const embed = createErrorEmbed(
                '❌ Warning Removal Failed',
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
                ephemeral: true
            });
        }
    }
};