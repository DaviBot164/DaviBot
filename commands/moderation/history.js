const {
    SlashCommandBuilder,
    PermissionFlagsBits,
    MessageFlags,
    EmbedBuilder
} = require('discord.js');

const {
    getWarnings,
    countWarnings
} = require('../../database/warnings');

const {
    getMemberAutoModCases,
    countMemberAutoModCases
} = require('../../database/automodCases');

/**
 * Convert a date into a Discord timestamp.
 *
 * @param {string|Date|null} dateValue
 * @param {string} style
 * @returns {string}
 */
function formatDiscordTimestamp(
    dateValue,
    style = 'R'
) {
    if (!dateValue) {
        return 'No records';
    }

    const date = new Date(dateValue);

    if (Number.isNaN(date.getTime())) {
        return 'Unknown date';
    }

    const unixTimestamp = Math.floor(
        date.getTime() / 1000
    );

    return `<t:${unixTimestamp}:${style}>`;
}

/**
 * Shorten database text for an embed.
 *
 * @param {string|null} text
 * @param {number} maximumLength
 * @returns {string}
 */
function shortenText(
    text,
    maximumLength = 130
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
 * Find the oldest date from multiple records.
 *
 * @param {Array<Object>} records
 * @returns {string|Date|null}
 */
function findOldestDate(records) {
    if (!records.length) {
        return null;
    }

    return records.reduce(
        (oldest, record) => {
            const currentDate =
                new Date(record.created_at);

            if (
                Number.isNaN(
                    currentDate.getTime()
                )
            ) {
                return oldest;
            }

            if (!oldest) {
                return currentDate;
            }

            return (
                currentDate < oldest
                    ? currentDate
                    : oldest
            );
        },
        null
    );
}

/**
 * Find the newest date from multiple records.
 *
 * @param {Array<Object>} records
 * @returns {string|Date|null}
 */
function findNewestDate(records) {
    if (!records.length) {
        return null;
    }

    return records.reduce(
        (newest, record) => {
            const currentDate =
                new Date(record.created_at);

            if (
                Number.isNaN(
                    currentDate.getTime()
                )
            ) {
                return newest;
            }

            if (!newest) {
                return currentDate;
            }

            return (
                currentDate > newest
                    ? currentDate
                    : newest
            );
        },
        null
    );
}

/**
 * Build a compact list of recent warnings.
 *
 * @param {Array<Object>} warnings
 * @returns {string}
 */
function formatRecentWarnings(warnings) {
    if (!warnings.length) {
        return 'No warnings recorded.';
    }

    return warnings
        .slice(0, 3)
        .map(warning => {
            return [
                `**Warning #${warning.id}**`,
                shortenText(
                    warning.reason,
                    120
                ),
                formatDiscordTimestamp(
                    warning.created_at,
                    'R'
                )
            ].join(' • ');
        })
        .join('\n');
}

/**
 * Build a compact list of recent AutoMod cases.
 *
 * @param {Array<Object>} autoModCases
 * @returns {string}
 */
function formatRecentCases(autoModCases) {
    if (!autoModCases.length) {
        return 'No AutoMod cases recorded.';
    }

    return autoModCases
        .slice(0, 3)
        .map(autoModCase => {
            return [
                `**Case #${autoModCase.id}**`,
                shortenText(
                    autoModCase.reason,
                    120
                ),
                formatDiscordTimestamp(
                    autoModCase.created_at,
                    'R'
                )
            ].join(' • ');
        })
        .join('\n');
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('history')
        .setDescription(
            'View the moderation history of a server member.'
        )

        .addUserOption(option =>
            option
                .setName('user')
                .setDescription(
                    'The member whose history you want to view'
                )
                .setRequired(true)
        )

        .setDefaultMemberPermissions(
            PermissionFlagsBits.ModerateMembers
        ),

    /**
     * Display a combined moderation history.
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

        await interaction.deferReply({
            flags:
                MessageFlags.Ephemeral
        });

        let warnings;
        let autoModCases;
        let warningCount;
        let autoModCaseCount;

        try {
            [
                warnings,
                autoModCases,
                warningCount,
                autoModCaseCount
            ] = await Promise.all([
                getWarnings(
                    interaction.guild.id,
                    targetUser.id
                ),

                getMemberAutoModCases(
                    interaction.guild.id,
                    targetUser.id,
                    50
                ),

                countWarnings(
                    interaction.guild.id,
                    targetUser.id
                ),

                countMemberAutoModCases(
                    interaction.guild.id,
                    targetUser.id
                )
            ]);
        } catch (error) {
            console.error(
                `❌ Failed to retrieve moderation history for ${targetUser.tag}:`
            );

            console.error(error);

            await interaction.editReply({
                content:
                    '❌ The moderation history could not be retrieved from the database.'
            });

            return;
        }

        const totalActions =
            warningCount +
            autoModCaseCount;

        const allRecords = [
            ...warnings,
            ...autoModCases
        ];

        const firstActionDate =
            findOldestDate(allRecords);

        const lastActionDate =
            findNewestDate(allRecords);

        let guildMember = null;

        try {
            guildMember =
                await interaction.guild.members
                    .fetch(targetUser.id);
        } catch {
            guildMember = null;
        }

        const joinedServer =
            guildMember?.joinedAt
                ? (
                    formatDiscordTimestamp(
                        guildMember.joinedAt,
                        'F'
                    ) +
                    '\n' +
                    formatDiscordTimestamp(
                        guildMember.joinedAt,
                        'R'
                    )
                )
                : 'Member is not currently in the server.';

        const accountCreated =
            (
                formatDiscordTimestamp(
                    targetUser.createdAt,
                    'F'
                ) +
                '\n' +
                formatDiscordTimestamp(
                    targetUser.createdAt,
                    'R'
                )
            );

        const statusText =
            totalActions === 0
                ? '✅ Clean moderation record'
                : totalActions <= 2
                    ? '🟡 Low activity'
                    : totalActions <= 5
                        ? '🟠 Moderate activity'
                        : '🔴 High moderation activity';

        const embed =
            new EmbedBuilder()
                .setColor(
                    totalActions === 0
                        ? '#2ECC71'
                        : '#8B0000'
                )

                .setAuthor({
                    name:
                        'Evelynn Moderation History',

                    iconURL:
                        interaction.client.user
                            .displayAvatarURL({
                                extension: 'png',
                                size: 256
                            })
                })

                .setTitle(
                    `📂 Moderation History — ${targetUser.username}`
                )

                .setDescription(
                    [
                        `Complete stored moderation summary for ${targetUser}.`,
                        '',
                        `**Status:** ${statusText}`
                    ].join('\n')
                )

                .addFields(
                    {
                        name: '👤 Member',
                        value:
                            `${targetUser}\n` +
                            `\`${targetUser.id}\``,
                        inline: true
                    },
                    {
                        name: '⚠️ Warnings',
                        value:
                            `\`${warningCount}\``,
                        inline: true
                    },
                    {
                        name: '🛡️ AutoMod Cases',
                        value:
                            `\`${autoModCaseCount}\``,
                        inline: true
                    },
                    {
                        name:
                            '📊 Total Stored Actions',
                        value:
                            `\`${totalActions}\``,
                        inline: true
                    },
                    {
                        name:
                            '📅 First Moderation Action',
                        value:
                            firstActionDate
                                ? (
                                    formatDiscordTimestamp(
                                        firstActionDate,
                                        'F'
                                    ) +
                                    '\n' +
                                    formatDiscordTimestamp(
                                        firstActionDate,
                                        'R'
                                    )
                                )
                                : 'No actions recorded.',
                        inline: true
                    },
                    {
                        name:
                            '🕒 Last Moderation Action',
                        value:
                            lastActionDate
                                ? (
                                    formatDiscordTimestamp(
                                        lastActionDate,
                                        'F'
                                    ) +
                                    '\n' +
                                    formatDiscordTimestamp(
                                        lastActionDate,
                                        'R'
                                    )
                                )
                                : 'No actions recorded.',
                        inline: true
                    },
                    {
                        name:
                            '⚠️ Recent Warnings',
                        value:
                            formatRecentWarnings(
                                warnings
                            ),
                        inline: false
                    },
                    {
                        name:
                            '🛡️ Recent AutoMod Cases',
                        value:
                            formatRecentCases(
                                autoModCases
                            ),
                        inline: false
                    },
                    {
                        name:
                            '📥 Joined Server',
                        value:
                            joinedServer,
                        inline: true
                    },
                    {
                        name:
                            '🗓️ Account Created',
                        value:
                            accountCreated,
                        inline: true
                    }
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