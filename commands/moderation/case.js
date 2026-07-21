const {
    SlashCommandBuilder,
    PermissionFlagsBits,
    MessageFlags,
    EmbedBuilder
} = require('discord.js');

const {
    getAutoModCaseById
} = require('../../database/automodCases');

/**
 * Convert a database date into a Discord timestamp.
 *
 * @param {string|Date} dateValue
 * @returns {string}
 */
function formatDiscordTimestamp(dateValue) {
    const date = new Date(dateValue);

    if (Number.isNaN(date.getTime())) {
        return 'Unknown date';
    }

    const unixTimestamp = Math.floor(
        date.getTime() / 1000
    );

    return (
        `<t:${unixTimestamp}:F>\n` +
        `(<t:${unixTimestamp}:R>)`
    );
}

/**
 * Format a timeout duration stored in milliseconds.
 *
 * @param {string|number|null} durationMilliseconds
 * @returns {string}
 */
function formatDuration(durationMilliseconds) {
    const duration =
        Number(durationMilliseconds);

    if (
        !Number.isFinite(duration) ||
        duration <= 0
    ) {
        return 'No timeout';
    }

    const totalSeconds =
        Math.floor(duration / 1_000);

    const days =
        Math.floor(totalSeconds / 86_400);

    const hours =
        Math.floor(
            (totalSeconds % 86_400) / 3_600
        );

    const minutes =
        Math.floor(
            (totalSeconds % 3_600) / 60
        );

    const seconds =
        totalSeconds % 60;

    const parts = [];

    if (days > 0) {
        parts.push(
            `${days} day${days === 1 ? '' : 's'}`
        );
    }

    if (hours > 0) {
        parts.push(
            `${hours} hour${hours === 1 ? '' : 's'}`
        );
    }

    if (minutes > 0) {
        parts.push(
            `${minutes} minute${minutes === 1 ? '' : 's'}`
        );
    }

    if (
        seconds > 0 &&
        parts.length === 0
    ) {
        parts.push(
            `${seconds} second${seconds === 1 ? '' : 's'}`
        );
    }

    return parts.join(', ') || 'No timeout';
}

/**
 * Prevent message content from breaking an embed code block.
 *
 * @param {string|null} content
 * @returns {string}
 */
function formatMessageContent(content) {
    if (!content) {
        return 'No message content was stored.';
    }

    const cleanContent = String(content)
        .replace(/```/g, 'ˋˋˋ')
        .slice(0, 1_000);

    return `\`\`\`\n${cleanContent}\n\`\`\``;
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('case')
        .setDescription(
            'View a specific Seraphiel AutoMod case.'
        )

        .addIntegerOption(option =>
            option
                .setName('id')
                .setDescription(
                    'The AutoMod Case ID'
                )
                .setMinValue(1)
                .setRequired(true)
        )

        .setDefaultMemberPermissions(
            PermissionFlagsBits.ModerateMembers
        ),

    /**
     * Display a stored AutoMod case.
     *
     * @param {import('discord.js').ChatInputCommandInteraction} interaction
     * @returns {Promise<void>}
     */
    async execute(interaction) {
        if (!interaction.inGuild()) {
            await interaction.reply({
                content:
                    '❌ This command can only be used inside a server.',
                flags: MessageFlags.Ephemeral
            });

            return;
        }

        const caseId =
            interaction.options.getInteger(
                'id',
                true
            );

        await interaction.deferReply({
            flags: MessageFlags.Ephemeral
        });

        let autoModCase;

        try {
            autoModCase =
                await getAutoModCaseById(
                    interaction.guild.id,
                    caseId
                );
        } catch (error) {
            console.error(
                `❌ Failed to retrieve AutoMod Case #${caseId}:`
            );

            console.error(error);

            await interaction.editReply({
                content:
                    '❌ The AutoMod case could not be retrieved from the database.'
            });

            return;
        }

        if (!autoModCase) {
            await interaction.editReply({
                content:
                    `❌ AutoMod Case **#${caseId}** was not found in this server.`
            });

            return;
        }

        const userMention =
            `<@${autoModCase.user_id}>`;

        const channelMention =
            `<#${autoModCase.channel_id}>`;

        const messageDeleted =
            autoModCase.message_deleted
                ? '✅ Yes'
                : '❌ No';

        const timeoutApplied =
            autoModCase.timeout_applied
                ? '✅ Yes'
                : '❌ No';

        const timeoutDuration =
            formatDuration(
                autoModCase.timeout_duration_ms
            );

        const embed = new EmbedBuilder()
            .setColor('#8B0000')

            .setAuthor({
                name: 'Seraphiel Case System',
                iconURL:
                    interaction.client.user
                        .displayAvatarURL({
                            extension: 'png',
                            size: 256
                        })
            })

            .setTitle(
                `🛡️ AutoMod Case #${autoModCase.id}`
            )

            .setDescription(
                'Detailed information about this automatic moderation action.'
            )

            .addFields(
                {
                    name: '👤 Member',
                    value:
                        `${userMention}\n` +
                        `\`${autoModCase.user_id}\``,
                    inline: true
                },
                {
                    name: '📍 Channel',
                    value:
                        `${channelMention}\n` +
                        `\`${autoModCase.channel_id}\``,
                    inline: true
                },
                {
                    name: '🆔 Case ID',
                    value:
                        `\`${autoModCase.id}\``,
                    inline: true
                },
                {
                    name: '📜 Reason',
                    value:
                        autoModCase.reason ||
                        'No reason stored.',
                    inline: false
                },
                {
                    name: '⚔️ Action',
                    value:
                        autoModCase.action ||
                        'No action stored.',
                    inline: false
                },
                {
                    name: '🗑️ Message Deleted',
                    value: messageDeleted,
                    inline: true
                },
                {
                    name: '⏳ Timeout Applied',
                    value: timeoutApplied,
                    inline: true
                },
                {
                    name: '🕒 Timeout Duration',
                    value: timeoutDuration,
                    inline: true
                },
                {
                    name: '💬 Original Message',
                    value:
                        formatMessageContent(
                            autoModCase.message_content
                        ),
                    inline: false
                },
                {
                    name: '📅 Created',
                    value:
                        formatDiscordTimestamp(
                            autoModCase.created_at
                        ),
                    inline: false
                }
            )

            .setFooter({
                text:
                    `Requested by ${interaction.user.username}`,
                iconURL:
                    interaction.user
                        .displayAvatarURL({
                            extension: 'png',
                            size: 128
                        })
            })

            .setTimestamp();

        await interaction.editReply({
            embeds: [embed]
        });
    }
};