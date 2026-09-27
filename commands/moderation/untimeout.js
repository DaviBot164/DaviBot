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
    resolveActiveCases
} = require('../../database/moderationCases');

const {
    canModerate,
    recordModerationAction
} = require('../../handlers/moderationService');

module.exports = {
    data:
        new SlashCommandBuilder()
            .setName('untimeout')
            .setDescription(
                'Remove a member’s active timeout.'
            )
            .setDefaultMemberPermissions(
                PermissionFlagsBits.ModerateMembers
            )
            .addUserOption(option =>
                option
                    .setName('member')
                    .setDescription(
                        'Member whose timeout will be removed.'
                    )
                    .setRequired(true)
            )
            .addStringOption(option =>
                option
                    .setName('reason')
                    .setDescription(
                        'Reason for removing the timeout.'
                    )
                    .setMaxLength(500)
            ),

    async execute(interaction) {
        const target =
            interaction.options.getMember(
                'member'
            );

        const reason =
            interaction.options.getString(
                'reason'
            ) ??
            'Timeout removed by staff.';

        if (!target) {
            await interaction.reply({
                flags:
                    MessageFlags.Ephemeral,

                embeds: [
                    errorEmbed(
                        'Timeout Removal Failed',
                        'That member could not be found in this server.'
                    )
                ]
            });

            return;
        }

        const check =
            canModerate(
                interaction.member,
                target
            );

        if (!check.allowed) {
            await interaction.reply({
                flags:
                    MessageFlags.Ephemeral,

                embeds: [
                    errorEmbed(
                        'Timeout Removal Failed',
                        check.reason
                    )
                ]
            });

            return;
        }

        if (!target.isCommunicationDisabled()) {
            await interaction.reply({
                flags:
                    MessageFlags.Ephemeral,

                embeds: [
                    errorEmbed(
                        'No Active Timeout',
                        `${target} is not currently timed out.`
                    )
                ]
            });

            return;
        }

        if (!target.moderatable) {
            await interaction.reply({
                flags:
                    MessageFlags.Ephemeral,

                embeds: [
                    errorEmbed(
                        'Timeout Removal Failed',
                        'Akane cannot modify this member.'
                    )
                ]
            });

            return;
        }

        await interaction.deferReply({
            flags:
                MessageFlags.Ephemeral
        });

        try {
            await target.timeout(
                null,
                reason
            );

            await resolveActiveCases(
                interaction.guild.id,
                target.id,
                'timeout',
                {
                    resolvedBy:
                        interaction.user.id,

                    reason
                }
            );

            const moderationCase =
                await recordModerationAction({
                    guild:
                        interaction.guild,

                    userId:
                        target.id,

                    moderatorId:
                        interaction.user.id,

                    action:
                        'untimeout',

                    reason,

                    channelId:
                        interaction.channelId,

                    metadata: {
                        username:
                            target.user.username
                    },

                    active:
                        false,

                    target
                });

            try {
                await target.send({
                    embeds: [
                        successEmbed(
                            'Timeout Removed',
                            [
                                `Your timeout in **${interaction.guild.name}** has been removed.`,
                                `Case: **#${moderationCase.id}**`,
                                `Reason: ${reason}`
                            ].join('\n')
                        )
                    ]
                });
            } catch {
                // Member DMs may be disabled.
            }

            await interaction.editReply({
                embeds: [
                    successEmbed(
                        'Timeout Removed',
                        [
                            `${target} can communicate again.`,
                            `Case: **#${moderationCase.id}**`,
                            `Reason: ${reason}`
                        ].join('\n')
                    )
                ]
            });
        } catch (error) {
            console.error(
                'Untimeout command failed:',
                error
            );

            await interaction.editReply({
                embeds: [
                    errorEmbed(
                        'Timeout Removal Failed',
                        'Akane could not remove this timeout.'
                    )
                ]
            });
        }
    }
};