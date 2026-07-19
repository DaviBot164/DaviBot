const {
    SlashCommandBuilder,
    PermissionFlagsBits,
    MessageFlags,
    ChannelType
} = require('discord.js');

const {
    createErrorEmbed,
    createChannelModerationEmbed
} = require('../../utils/embeds');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('slowmode')
        .setDescription(
            'Set or disable slowmode in the current channel.'
        )

        .addIntegerOption(option =>
            option
                .setName('seconds')
                .setDescription(
                    'Slowmode duration in seconds. Use 0 to disable it.'
                )
                .setMinValue(0)
                .setMaxValue(21600)
                .setRequired(true)
        )

        .addStringOption(option =>
            option
                .setName('reason')
                .setDescription(
                    'Reason for changing the slowmode'
                )
                .setMaxLength(500)
                .setRequired(false)
        )

        .setDefaultMemberPermissions(
            PermissionFlagsBits.ManageChannels
        ),

    async execute(interaction) {
        try {
            if (!interaction.inGuild()) {
                const embed = createErrorEmbed(
                    '❌ Slowmode Failed',
                    'This command can only be used inside a server.'
                );

                return interaction.reply({
                    embeds: [embed],
                    flags: MessageFlags.Ephemeral
                });
            }

            const channel = interaction.channel;

            const seconds =
                interaction.options.getInteger(
                    'seconds',
                    true
                );

            const reason =
                interaction.options.getString('reason') ||
                'No reason provided.';

            const supportedChannelTypes = [
                ChannelType.GuildText,
                ChannelType.GuildAnnouncement
            ];

            if (
                !channel ||
                !supportedChannelTypes.includes(channel.type)
            ) {
                const embed = createErrorEmbed(
                    '❌ Unsupported Channel',
                    'This command can only be used in a text or announcement channel.'
                );

                return interaction.reply({
                    embeds: [embed],
                    flags: MessageFlags.Ephemeral
                });
            }

            const botMember =
                interaction.guild.members.me;

            const botPermissions =
                channel.permissionsFor(botMember);

            if (
                !botPermissions?.has(
                    PermissionFlagsBits.ManageChannels
                )
            ) {
                const embed = createErrorEmbed(
                    '❌ Missing Permission',
                    'DaviBot needs the **Manage Channels** permission in this channel.'
                );

                return interaction.reply({
                    embeds: [embed],
                    flags: MessageFlags.Ephemeral
                });
            }

            if (channel.rateLimitPerUser === seconds) {
                const currentSetting =
                    seconds === 0
                        ? 'disabled'
                        : `already set to **${formatDuration(seconds)}**`;

                const embed = createErrorEmbed(
                    '🐢 Slowmode Unchanged',
                    `Slowmode is ${currentSetting} in ${channel}.`
                );

                return interaction.reply({
                    embeds: [embed],
                    flags: MessageFlags.Ephemeral
                });
            }

            await interaction.deferReply({
                flags: MessageFlags.Ephemeral
            });

            await channel.setRateLimitPerUser(
                seconds,
                `Slowmode changed by ${interaction.user.tag}: ${reason}`
            );

            const isDisabled = seconds === 0;

            const embed =
                createChannelModerationEmbed({
                    action: isDisabled
                        ? '✅ Slowmode Disabled'
                        : '🐢 Slowmode Enabled',
                    channel,
                    moderator: interaction.user,
                    reason
                });

            embed.addFields({
                name: '⏱️ Slowmode',
                value: isDisabled
                    ? 'Disabled'
                    : formatDuration(seconds),
                inline: true
            });

            return interaction.editReply({
                embeds: [embed]
            });
        } catch (error) {
            console.error(
                'Slowmode command error:',
                error
            );

            const embed = createErrorEmbed(
                '❌ Slowmode Failed',
                'The slowmode could not be changed. Check DaviBot’s permissions and Northflank logs.'
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

/**
 * Convert seconds into a readable duration.
 *
 * @param {number} totalSeconds
 * @returns {string}
 */
function formatDuration(totalSeconds) {
    if (totalSeconds < 60) {
        return `${totalSeconds} second${
            totalSeconds === 1 ? '' : 's'
        }`;
    }

    if (totalSeconds < 3600) {
        const minutes =
            Math.floor(totalSeconds / 60);

        const seconds =
            totalSeconds % 60;

        if (seconds === 0) {
            return `${minutes} minute${
                minutes === 1 ? '' : 's'
            }`;
        }

        return (
            `${minutes} minute${
                minutes === 1 ? '' : 's'
            } and ` +
            `${seconds} second${
                seconds === 1 ? '' : 's'
            }`
        );
    }

    const hours =
        Math.floor(totalSeconds / 3600);

    const remainingSeconds =
        totalSeconds % 3600;

    const minutes =
        Math.floor(remainingSeconds / 60);

    if (minutes === 0) {
        return `${hours} hour${
            hours === 1 ? '' : 's'
        }`;
    }

    return (
        `${hours} hour${
            hours === 1 ? '' : 's'
        } and ` +
        `${minutes} minute${
            minutes === 1 ? '' : 's'
        }`
    );
}