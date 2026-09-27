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
    parseDuration,
    MAX_TIMEOUT_MS
} = require('../../utils/duration');

const {
    canModerate,
    formatDuration,
    recordModerationAction
} = require('../../handlers/moderationService');

module.exports = {
    data:
        new SlashCommandBuilder()
            .setName('timeout')
            .setDescription(
                'Temporarily silence a member.'
            )
            .setDefaultMemberPermissions(
                PermissionFlagsBits.ModerateMembers
            )
            .addUserOption(option =>
                option
                    .setName('member')
                    .setDescription(
                        'Member to timeout.'
                    )
                    .setRequired(true)
            )
            .addStringOption(option =>
                option
                    .setName('duration')
                    .setDescription(
                        'Duration: 30s, 10m, 2h, 1d, 1w.'
                    )
                    .setRequired(true)
                    .setMaxLength(10)
            )
            .addStringOption(option =>
                option
                    .setName('reason')
                    .setDescription(
                        'Reason for the timeout.'
                    )
                    .setRequired(true)
                    .setMaxLength(500)
            ),

    async execute(interaction) {
        const target =
            interaction.options.getMember(
                'member'
            );

        const durationInput =
            interaction.options.getString(
                'duration',
                true
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
                        'Timeout Failed',
                        'That member could not be found in this server.'
                    )
                ]
            });

            return;
        }

        const duration =
            parseDuration(
                durationInput
            );

        if (!duration) {
            await interaction.reply({
                flags:
                    MessageFlags.Ephemeral,

                embeds: [
                    errorEmbed(
                        'Invalid Duration',
                        [
                            'Use a duration such as:',
                            '`30s`, `10m`, `2h`, `1d`, `1w`',
                            '',
                            'Maximum timeout: **28 days**.'
                        ].join('\n')
                    )
                ]
            });

            return;
        }

        if (duration > MAX_TIMEOUT_MS) {
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
                        'Timeout Failed',
                        check.reason
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
                        'Timeout Failed',
                        'Akane cannot timeout this member.'
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
                duration,
                reason
            );

            const expiresAt =
                new Date(
                    Date.now() +
                    duration
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
                        'timeout',

                    reason,

                    durationMs:
                        duration,

                    channelId:
                        interaction.channelId,

                    metadata: {
                        username:
                            target.user.username
                    },

                    active:
                        true,

                    expiresAt,

                    target
                });

            try {
                await target.send({
                    embeds: [
                        errorEmbed(
                            'You Have Been Timed Out',
                            [
                                `Server: **${interaction.guild.name}**`,
                                `Duration: **${formatDuration(duration)}**`,
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
                        'Member Timed Out',
                        [
                            `${target} has been timed out.`,
                            `Duration: **${formatDuration(duration)}**`,
                            `Case: **#${moderationCase.id}**`,
                            `Reason: ${reason}`
                        ].join('\n')
                    )
                ]
            });
        } catch (error) {
            console.error(
                'Timeout command failed:',
                error
            );

            await interaction.editReply({
                embeds: [
                    errorEmbed(
                        'Timeout Failed',
                        'Akane could not timeout this member.'
                    )
                ]
            });
        }
    }
};