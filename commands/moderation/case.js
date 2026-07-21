const {
    SlashCommandBuilder,
    PermissionFlagsBits,
    MessageFlags,
    EmbedBuilder
} = require('discord.js');

const {
    getMemberAutoModCases,
    countMemberAutoModCases
} = require('../../database/automodCases');

/**
 * Convert a database date into Discord timestamps.
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
        `<t:${unixTimestamp}:f> ` +
        `(<t:${unixTimestamp}:R>)`
    );
}

/**
 * Shorten text so the embed remains readable.
 *
 * @param {string|null} text
 * @param {number} maximumLength
 * @returns {string}
 */
function shortenText(
    text,
    maximumLength = 160
) {
    if (!text) {
        return 'No information stored.';
    }

    const cleanText = String(text)
        .replace(/\s+/g, ' ')
        .replace(/`/g, 'ˋ')
        .trim();

    if (
        cleanText.length <=
        maximumLength
    ) {
        return cleanText;
    }

    return (
        cleanText.slice(
            0,
            maximumLength - 3
        ) + '...'
    );
}

/**
 * Format timeout duration stored in milliseconds.
 *
 * @param {string|number|null} durationMilliseconds
 * @returns {string}
 */
function formatDuration(
    durationMilliseconds
) {
    const duration =
        Number(durationMilliseconds);

    if (
        !Number.isFinite(duration) ||
        duration <= 0
    ) {
        return 'None';
    }

    const totalSeconds =
        Math.floor(duration / 1_000);

    const days =
        Math.floor(
            totalSeconds / 86_400
        );

    const hours =
        Math.floor(
            (totalSeconds % 86_400) /
            3_600
        );

    const minutes =
        Math.floor(
            (totalSeconds % 3_600) /
            60
        );

    const seconds =
        totalSeconds % 60;

    const parts = [];

    if (days > 0) {
        parts.push(`${days}d`);
    }

    if (hours > 0) {
        parts.push(`${hours}h`);
    }

    if (minutes > 0) {
        parts.push(`${minutes}m`);
    }

    if (
        seconds > 0 &&
        parts.length === 0
    ) {
        parts.push(`${seconds}s`);
    }

    return parts.join(' ') || 'None';
}

/**
 * Create one readable case entry.
 *
 * @param {Object} autoModCase
 * @returns {string}
 */
function formatCaseEntry(autoModCase) {
    const deletedStatus =
        autoModCase.message_deleted
            ? '✅ Deleted'
            : '❌ Not deleted';

    const timeoutStatus =
        autoModCase.timeout_applied
            ? (
                '✅ Timeout: ' +
                formatDuration(
                    autoModCase
                        .timeout_duration_ms
                )
            )
            : '❌ No timeout';

    return [
        `### 🛡️ Case #${autoModCase.id}`,
        `**Reason:** ${shortenText(autoModCase.reason, 180)}`,
        `**Action:** ${shortenText(autoModCase.action, 180)}`,
        `**Channel:** <#${autoModCase.channel_id}>`,
        `**Result:** ${deletedStatus} • ${timeoutStatus}`,
        `**Created:** ${formatDiscordTimestamp(autoModCase.created_at)}`
    ].join('\n');
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('cases')
        .setDescription(
            'View the AutoMod cases of a server member.'
        )

        .addUserOption(option =>
            option
                .setName('user')
                .setDescription(
                    'The member whose AutoMod cases you want to view'
                )
                .setRequired(true)
        )

        .addIntegerOption(option =>
            option
                .setName('limit')
                .setDescription(
                    'Number of recent cases to display'
                )
                .setMinValue(1)
                .setMaxValue(10)
                .setRequired(false)
        )

        .setDefaultMemberPermissions(
            PermissionFlagsBits.ModerateMembers
        ),

    /**
     * Display a member's recent AutoMod cases.
     *
     * @param {import('discord.js').ChatInputCommandInteraction} interaction
     * @returns {Promise<void>}
     */
    async execute(interaction) {
        if (!interaction.inGuild()) {
            await interaction.reply({
                content:
                    '❌ This command can only be used inside a server.',
                flags:
                    MessageFlags.Ephemeral
            });

            return;
        }

        const targetUser =
            interaction.options.getUser(
                'user',
                true
            );

        const requestedLimit =
            interaction.options.getInteger(
                'limit'
            ) ?? 5;

        await interaction.deferReply({
            flags:
                MessageFlags.Ephemeral
        });

        let autoModCases;
        let totalCases;

        try {
            [
                autoModCases,
                totalCases
            ] = await Promise.all([
                getMemberAutoModCases(
                    interaction.guild.id,
                    targetUser.id,
                    requestedLimit
                ),

                countMemberAutoModCases(
                    interaction.guild.id,
                    targetUser.id
                )
            ]);
        } catch (error) {
            console.error(
                `❌ Failed to retrieve AutoMod cases for ${targetUser.tag}:`
            );

            console.error(error);

            await interaction.editReply({
                content:
                    '❌ The AutoMod cases could not be retrieved from the database.'
            });

            return;
        }

        if (autoModCases.length === 0) {
            const emptyEmbed =
                new EmbedBuilder()
                    .setColor('#2F3136')

                    .setAuthor({
                        name:
                            'Seraphiel Case System',

                        iconURL:
                            interaction.client.user
                                .displayAvatarURL({
                                    extension: 'png',
                                    size: 256
                                })
                    })

                    .setTitle(
                        '🛡️ No AutoMod Cases'
                    )

                    .setDescription(
                        `${targetUser} does not have any AutoMod cases in this server.`
                    )

                    .setThumbnail(
                        targetUser
                            .displayAvatarURL({
                                extension: 'png',
                                size: 256
                            })
                    )

                    .setFooter({
                        text:
                            `User ID: ${targetUser.id}`
                    })

                    .setTimestamp();

            await interaction.editReply({
                embeds: [emptyEmbed]
            });

            return;
        }

        const caseEntries =
            autoModCases.map(
                formatCaseEntry
            );

        const embed =
            new EmbedBuilder()
                .setColor('#8B0000')

                .setAuthor({
                    name:
                        'Seraphiel Case System',

                    iconURL:
                        interaction.client.user
                            .displayAvatarURL({
                                extension: 'png',
                                size: 256
                            })
                })

                .setTitle(
                    `🛡️ AutoMod History — ${targetUser.username}`
                )

                .setDescription(
                    [
                        `Showing the latest **${autoModCases.length}** of **${totalCases}** AutoMod cases.`,
                        '',
                        caseEntries.join(
                            '\n\n━━━━━━━━━━━━━━━━━━━━\n\n'
                        )
                    ].join('\n')
                )

                .addFields({
                    name:
                        '📊 Case Summary',

                    value:
                        `**Member:** ${targetUser}\n` +
                        `**Total Cases:** \`${totalCases}\`\n` +
                        `**Displayed:** \`${autoModCases.length}\``,

                    inline: false
                })

                .setThumbnail(
                    targetUser
                        .displayAvatarURL({
                            extension: 'png',
                            size: 256
                        })
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