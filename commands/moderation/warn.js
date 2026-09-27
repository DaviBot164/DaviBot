const {
    SlashCommandBuilder,
    PermissionFlagsBits,
    MessageFlags
} = require('discord.js');

const {
    errorEmbed,
    successEmbed
} = require('../../utils/embeds');

const {
    canModerate,
    recordModerationAction
} = require('../../handlers/moderationService');

module.exports = {
    data:
        new SlashCommandBuilder()
            .setName('warn')
            .setDescription(
                'Issue an official warning to a member.'
            )
            .setDefaultMemberPermissions(
                PermissionFlagsBits.ModerateMembers
            )
            .addUserOption(option =>
                option
                    .setName('member')
                    .setDescription(
                        'Member to warn.'
                    )
                    .setRequired(true)
            )
            .addStringOption(option =>
                option
                    .setName('reason')
                    .setDescription(
                        'Reason for the warning.'
                    )
                    .setRequired(true)
                    .setMaxLength(500)
            ),

    async execute(interaction) {
        const target =
            interaction.options.getMember(
                'member'
            );

        const reason =
            interaction.options.getString(
                'reason',
                true
            );

        if (!target) {
            await interaction.reply({
                flags:
                    MessageFlags.Ephemeral,

                embeds: [
                    errorEmbed(
                        'Warning Failed',
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
                        'Warning Failed',
                        check.reason
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
            const moderationCase =
                await recordModerationAction({
                    guild:
                        interaction.guild,

                    userId:
                        target.id,

                    moderatorId:
                        interaction.user.id,

                    action:
                        'warn',

                    reason,

                    channelId:
                        interaction.channelId,

                    metadata: {
                        username:
                            target.user.username
                    },

                    active:
                        true,

                    target
                });

            try {
                await target.send({
                    embeds: [
                        errorEmbed(
                            'Official Warning',
                            [
                                `Server: **${interaction.guild.name}**`,
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
                        'Warning Issued',
                        [
                            `${target} received an official warning.`,
                            `Case: **#${moderationCase.id}**`,
                            `Reason: ${reason}`
                        ].join('\n')
                    )
                ]
            });
        } catch (error) {
            console.error(
                'Warn command failed:',
                error
            );

            await interaction.editReply({
                embeds: [
                    errorEmbed(
                        'Warning Failed',
                        'Akane could not create the moderation case.'
                    )
                ]
            });
        }
    }
};