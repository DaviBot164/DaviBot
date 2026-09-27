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
    recordModerationAction
} = require('../../handlers/moderationService');

const MAX_SLOWMODE = 21_600;

function formatSlowmode(seconds) {
    if (seconds === 0) {
        return 'Off';
    }

    if (seconds < 60) {
        return `${seconds}s`;
    }

    if (seconds % 3600 === 0) {
        return `${seconds / 3600}h`;
    }

    if (seconds % 60 === 0) {
        return `${seconds / 60}m`;
    }

    return `${seconds}s`;
}

module.exports = {
    data:
        new SlashCommandBuilder()
            .setName('slowmode')
            .setDescription(
                'Set or disable slowmode in a text channel.'
            )
            .setDefaultMemberPermissions(
                PermissionFlagsBits.ManageChannels
            )
            .addIntegerOption(option =>
                option
                    .setName('seconds')
                    .setDescription(
                        'Slowmode delay in seconds (0–21600).'
                    )
                    .setRequired(true)
                    .setMinValue(0)
                    .setMaxValue(
                        MAX_SLOWMODE
                    )
            )
            .addChannelOption(option =>
                option
                    .setName('channel')
                    .setDescription(
                        'Channel to update. Defaults to the current channel.'
                    )
            )
            .addStringOption(option =>
                option
                    .setName('reason')
                    .setDescription(
                        'Reason for changing slowmode.'
                    )
                    .setMaxLength(500)
            ),

    async execute(interaction) {
        const seconds =
            interaction.options.getInteger(
                'seconds',
                true
            );

        const channel =
            interaction.options.getChannel(
                'channel'
            ) ??
            interaction.channel;

        const reason =
            interaction.options.getString(
                'reason'
            ) ??
            'Slowmode changed by staff.';

        if (
            !channel ||
            !channel.isTextBased() ||
            typeof channel.setRateLimitPerUser !==
                'function'
        ) {
            await interaction.reply({
                flags:
                    MessageFlags.Ephemeral,

                embeds: [
                    errorEmbed(
                        'Slowmode Failed',
                        'Slowmode cannot be changed in that channel.'
                    )
                ]
            });

            return;
        }

        const botMember =
            interaction.guild.members.me;

        const permissions =
            channel.permissionsFor(
                botMember
            );

        if (
            !permissions?.has(
                PermissionFlagsBits.ManageChannels
            )
        ) {
            await interaction.reply({
                flags:
                    MessageFlags.Ephemeral,

                embeds: [
                    errorEmbed(
                        'Slowmode Failed',
                        'Akane needs Manage Channels permission for that channel.'
                    )
                ]
            });

            return;
        }

        await interaction.deferReply({
            flags:
                MessageFlags.Ephemeral
        });

        const previousSlowmode =
            channel.rateLimitPerUser ??
            0;

        try {
            await channel.setRateLimitPerUser(
                seconds,
                reason
            );

            let moderationCase;

            try {
                moderationCase =
                    await recordModerationAction({
                        guild:
                            interaction.guild,

                        userId:
                            null,

                        moderatorId:
                            interaction.user.id,

                        action:
                            'slowmode',

                        reason,

                        channelId:
                            channel.id,

                        metadata: {
                            previousSlowmode,
                            newSlowmode:
                                seconds
                        },

                        active:
                            false
                    });
            } catch (error) {
                /*
                 * Restore the original slowmode
                 * if database recording fails.
                 */
                try {
                    await channel.setRateLimitPerUser(
                        previousSlowmode,
                        'Akane slowmode rollback'
                    );
                } catch (rollbackError) {
                    console.error(
                        'Slowmode rollback failed:',
                        rollbackError
                    );
                }

                throw error;
            }

            await interaction.editReply({
                embeds: [
                    successEmbed(
                        seconds === 0
                            ? 'Slowmode Disabled'
                            : 'Slowmode Updated',
                        [
                            `Channel: ${channel}`,
                            `Slowmode: **${formatSlowmode(seconds)}**`,
                            `Previous: **${formatSlowmode(previousSlowmode)}**`,
                            `Case: **#${moderationCase.id}**`,
                            `Reason: ${reason}`
                        ].join('\n')
                    )
                ]
            });
        } catch (error) {
            console.error(
                'Slowmode command failed:',
                error
            );

            await interaction.editReply({
                embeds: [
                    errorEmbed(
                        'Slowmode Failed',
                        'Akane could not change the channel slowmode.'
                    )
                ]
            });
        }
    }
};