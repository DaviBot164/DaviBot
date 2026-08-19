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

const {
    handleModerationCommandError
} = require('../../utils/moderation');

const {
    sendModLog
} = require('../../utils/modLogs');

module.exports = {
    category: 'moderation',

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
                    'Reason for changing slowmode'
                )
                .setMaxLength(500)
                .setRequired(false)
        )

        .setDefaultMemberPermissions(
            PermissionFlagsBits.ManageChannels
        )

        .setDMPermission(false),

    /**
     * Execute the /slowmode command.
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

            const channel =
                interaction.channel;

            const seconds =
                interaction.options.getInteger(
                    'seconds',
                    true
                );

            const reason =
                interaction.options.getString(
                    'reason'
                ) ||
                'No reason was provided.';

            const supportedChannelTypes = [
                ChannelType.GuildText,
                ChannelType.GuildAnnouncement
            ];

            if (
                !channel ||
                !supportedChannelTypes.includes(
                    channel.type
                )
            ) {
                await interaction.reply({
                    embeds: [
                        createErrorEmbed(
                            '❌ Unsupported Channel',
                            'This command can only be used in a text or announcement channel.'
                        )
                    ],

                    flags:
                        MessageFlags.Ephemeral
                });

                return;
            }

            const botMember =
                interaction.guild.members.me;

            if (!botMember) {
                await interaction.reply({
                    embeds: [
                        createErrorEmbed(
                            '❌ Evelynn Unavailable',
                            'Evelynn could not access its LUNAR SEIREITEI member information.'
                        )
                    ],

                    flags:
                        MessageFlags.Ephemeral
                });

                return;
            }

            const botPermissions =
                channel.permissionsFor(
                    botMember
                );

            if (
                !botPermissions?.has(
                    PermissionFlagsBits.ManageChannels
                )
            ) {
                await interaction.reply({
                    embeds: [
                        createErrorEmbed(
                            '❌ Missing Evelynn Permission',
                            'Evelynn requires the **Manage Channels** permission in this channel.'
                        )
                    ],

                    flags:
                        MessageFlags.Ephemeral
                });

                return;
            }

            if (
                channel.rateLimitPerUser ===
                seconds
            ) {
                const currentSetting =
                    seconds === 0
                        ? 'already disabled'
                        : `already set to **${formatDuration(
                            seconds
                        )}**`;

                await interaction.reply({
                    embeds: [
                        createErrorEmbed(
                            '🐢 Slowmode Unchanged',
                            `Slowmode is ${currentSetting} in ${channel}.`
                        )
                    ],

                    flags:
                        MessageFlags.Ephemeral
                });

                return;
            }

            await interaction.deferReply({
                flags:
                    MessageFlags.Ephemeral
            });

            await channel.setRateLimitPerUser(
                seconds,
                `Slowmode changed by ${interaction.user.tag}: ${reason}`
            );

            const isDisabled =
                seconds === 0;

            const durationText =
                isDisabled
                    ? 'Disabled'
                    : formatDuration(
                        seconds
                    );

            const action =
                isDisabled
                    ? '✅ Slowmode Lifted'
                    : '🐢 Slowmode Enforced';

            const statusText =
                isDisabled
                    ? 'Souls may now send messages without a delay.'
                    : 'Souls must now wait between messages in this channel.';

            const embed =
                createChannelModerationEmbed({
                    action,

                    channel,

                    moderator:
                        interaction.user,

                    reason
                });

            embed.addFields(
                {
                    name:
                        '⏱️ Slowmode',

                    value:
                        durationText,

                    inline:
                        true
                },
                {
                    name:
                        '🌙 LUNAR SEIREITEI Status',

                    value:
                        statusText,

                    inline:
                        false
                }
            );

            await interaction.editReply({
                embeds: [
                    embed
                ]
            });

            await sendModLog({
                guild:
                    interaction.guild,

                action,

                channel,

                moderator:
                    interaction.user,

                reason,

                fields: [
                    {
                        name:
                            '⏱️ Slowmode',

                        value:
                            durationText,

                        inline:
                            true
                    },
                    {
                        name:
                            '🌙 LUNAR SEIREITEI Status',

                        value:
                            statusText,

                        inline:
                            false
                    }
                ]
            });
        } catch (error) {
            await handleModerationCommandError({
                interaction,
                error,

                commandName:
                    'slowmode',

                title:
                    '❌ Slowmode Failed',

                description:
                    'Evelynn could not change slowmode. Check its permissions and Northflank logs.'
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
function formatDuration(
    totalSeconds
) {
    if (
        totalSeconds <
        60
    ) {
        return (
            `${totalSeconds} second` +
            `${totalSeconds === 1 ? '' : 's'}`
        );
    }

    if (
        totalSeconds <
        3600
    ) {
        const minutes =
            Math.floor(
                totalSeconds /
                60
            );

        const seconds =
            totalSeconds %
            60;

        if (
            seconds ===
            0
        ) {
            return (
                `${minutes} minute` +
                `${minutes === 1 ? '' : 's'}`
            );
        }

        return (
            `${minutes} minute` +
            `${minutes === 1 ? '' : 's'} and ` +
            `${seconds} second` +
            `${seconds === 1 ? '' : 's'}`
        );
    }

    const hours =
        Math.floor(
            totalSeconds /
            3600
        );

    const remainingSeconds =
        totalSeconds %
        3600;

    const minutes =
        Math.floor(
            remainingSeconds /
            60
        );

    if (
        minutes ===
        0
    ) {
        return (
            `${hours} hour` +
            `${hours === 1 ? '' : 's'}`
        );
    }

    return (
        `${hours} hour` +
        `${hours === 1 ? '' : 's'} and ` +
        `${minutes} minute` +
        `${minutes === 1 ? '' : 's'}`
    );
}