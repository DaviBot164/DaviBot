const {
    SlashCommandBuilder,
    PermissionFlagsBits,
    MessageFlags
} = require('discord.js');

const {
    successEmbed,
    errorEmbed
} = require('../../utils/embeds');

const {
    getCase,
    resolveCase
} = require('../../database/moderationCases');

module.exports = {
    data:
        new SlashCommandBuilder()
            .setName('unwarn')
            .setDescription(
                'Remove an active warning by case ID.'
            )
            .setDefaultMemberPermissions(
                PermissionFlagsBits.ModerateMembers
            )
            .addIntegerOption(option =>
                option
                    .setName('case')
                    .setDescription(
                        'Warning case ID.'
                    )
                    .setRequired(true)
                    .setMinValue(1)
            )
            .addStringOption(option =>
                option
                    .setName('reason')
                    .setDescription(
                        'Reason for removing the warning.'
                    )
                    .setMaxLength(500)
            ),

    async execute(interaction) {
        const caseId =
            interaction.options.getInteger(
                'case',
                true
            );

        const reason =
            interaction.options.getString(
                'reason'
            ) ??
            'Warning removed by staff.';

        await interaction.deferReply({
            flags:
                MessageFlags.Ephemeral
        });

        try {
            const moderationCase =
                await getCase(
                    interaction.guild.id,
                    caseId
                );

            if (!moderationCase) {
                await interaction.editReply({
                    embeds: [
                        errorEmbed(
                            'Warning Not Found',
                            `Case **#${caseId}** does not exist in this server.`
                        )
                    ]
                });

                return;
            }

            if (
                moderationCase.action !==
                'warn'
            ) {
                await interaction.editReply({
                    embeds: [
                        errorEmbed(
                            'Invalid Case',
                            `Case **#${caseId}** is not a warning.`
                        )
                    ]
                });

                return;
            }

            if (!moderationCase.active) {
                await interaction.editReply({
                    embeds: [
                        errorEmbed(
                            'Warning Already Removed',
                            `Case **#${caseId}** is no longer active.`
                        )
                    ]
                });

                return;
            }

            const resolved =
                await resolveCase(
                    interaction.guild.id,
                    caseId,
                    {
                        resolvedBy:
                            interaction.user.id,

                        reason
                    }
                );

            if (!resolved) {
                await interaction.editReply({
                    embeds: [
                        errorEmbed(
                            'Warning Removal Failed',
                            'The warning could not be updated.'
                        )
                    ]
                });

                return;
            }

            await interaction.editReply({
                embeds: [
                    successEmbed(
                        'Warning Removed',
                        [
                            `Case **#${caseId}** has been removed.`,
                            `Member: <@${resolved.userId}>`,
                            `Reason: ${reason}`
                        ].join('\n')
                    )
                ]
            });
        } catch (error) {
            console.error(
                'Unwarn command failed:',
                error
            );

            await interaction.editReply({
                embeds: [
                    errorEmbed(
                        'Warning Removal Failed',
                        'Akane could not remove the warning.'
                    )
                ]
            });
        }
    }
};