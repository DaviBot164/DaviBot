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
    recordModerationAction
} = require('../../handlers/moderationService');

module.exports = {
    data:
        new SlashCommandBuilder()
            .setName('unban')
            .setDescription(
                'Remove a user’s server ban.'
            )
            .setDefaultMemberPermissions(
                PermissionFlagsBits.BanMembers
            )
            .addStringOption(option =>
                option
                    .setName('user_id')
                    .setDescription(
                        'Discord user ID to unban.'
                    )
                    .setRequired(true)
                    .setMinLength(17)
                    .setMaxLength(20)
            )
            .addStringOption(option =>
                option
                    .setName('reason')
                    .setDescription(
                        'Reason for removing the ban.'
                    )
                    .setMaxLength(500)
            ),

    async execute(interaction) {
        const userId =
            interaction.options.getString(
                'user_id',
                true
            ).trim();

        const reason =
            interaction.options.getString(
                'reason'
            ) ??
            'Ban removed by staff.';

        if (!/^\d{17,20}$/.test(userId)) {
            await interaction.reply({
                flags:
                    MessageFlags.Ephemeral,

                embeds: [
                    errorEmbed(
                        'Unban Failed',
                        'Enter a valid Discord user ID.'
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
            let ban;

            try {
                ban =
                    await interaction.guild.bans.fetch(
                        userId
                    );
            } catch {
                await interaction.editReply({
                    embeds: [
                        errorEmbed(
                            'Ban Not Found',
                            'That user is not currently banned.'
                        )
                    ]
                });

                return;
            }

            await interaction.guild.members.unban(
                userId,
                reason
            );

            await resolveActiveCases(
                interaction.guild.id,
                userId,
                'ban',
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

                    userId,

                    moderatorId:
                        interaction.user.id,

                    action:
                        'unban',

                    reason,

                    channelId:
                        interaction.channelId,

                    metadata: {
                        username:
                            ban.user.username
                    },

                    active:
                        false
                });

            await interaction.editReply({
                embeds: [
                    successEmbed(
                        'User Unbanned',
                        [
                            `**${ban.user.username}** has been unbanned.`,
                            `User ID: \`${userId}\``,
                            `Case: **#${moderationCase.id}**`,
                            `Reason: ${reason}`
                        ].join('\n')
                    )
                ]
            });
        } catch (error) {
            console.error(
                'Unban command failed:',
                error
            );

            await interaction.editReply({
                embeds: [
                    errorEmbed(
                        'Unban Failed',
                        'Akane could not remove this ban.'
                    )
                ]
            });
        }
    }
};