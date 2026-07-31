const {
    SlashCommandBuilder,
    PermissionFlagsBits,
    MessageFlags
} = require('discord.js');

const {
    createEmbed,
    createErrorEmbed
} = require('../../utils/embeds');

const {
    souls:
        soulDatabase
} = require('../../database');

/**
 * Format a number using separators.
 *
 * @param {number|string|null} value
 * @returns {string}
 */
function formatNumber(
    value
) {
    const numericValue =
        Number(value);

    if (
        !Number.isFinite(
            numericValue
        )
    ) {
        return '0';
    }

    return numericValue.toLocaleString(
        'en-US'
    );
}

/**
 * Format a Discord timestamp.
 *
 * @param {number|null} timestamp
 * @returns {string}
 */
function formatDiscordDate(
    timestamp
) {
    if (!timestamp) {
        return 'Unknown';
    }

    const unixTimestamp =
        Math.floor(
            timestamp /
            1000
        );

    return [
        `<t:${unixTimestamp}:F>`,
        `-# <t:${unixTimestamp}:R>`
    ].join('\n');
}

/**
 * Create Umbra's visual XP progress bar.
 *
 * @param {number} percentage
 * @param {number} length
 * @returns {string}
 */
function createProgressBar(
    percentage,
    length = 12
) {
    const safePercentage =
        Math.min(
            100,
            Math.max(
                0,
                Number(percentage) || 0
            )
        );

    const filledBlocks =
        Math.round(
            (
                safePercentage /
                100
            ) *
            length
        );

    const emptyBlocks =
        length -
        filledBlocks;

    return (
        '▰'.repeat(
            filledBlocks
        ) +
        '▱'.repeat(
            emptyBlocks
        )
    );
}

/**
 * Get the Soul's Order standing.
 *
 * @param {import('discord.js').GuildMember} member
 * @param {import('discord.js').Guild} guild
 * @returns {string}
 */
function getOrderStanding(
    member,
    guild
) {
    if (
        member.id ===
        guild.ownerId
    ) {
        return '👑 Crimson Lord';
    }

    if (
        member.permissions.has(
            PermissionFlagsBits.Administrator
        )
    ) {
        return '⚜️ Eclipse Keeper';
    }

    if (
        member.permissions.has(
            PermissionFlagsBits.ModerateMembers
        ) ||
        member.permissions.has(
            PermissionFlagsBits.KickMembers
        ) ||
        member.permissions.has(
            PermissionFlagsBits.BanMembers
        )
    ) {
        return '🛡️ Shadow Warden';
    }

    if (member.user.bot) {
        return '🤖 Order Guardian';
    }

    return '🌑 Soul of the Order';
}

/**
 * Get the highest visible role.
 *
 * @param {import('discord.js').GuildMember} member
 * @returns {string}
 */
function getHighestRole(
    member
) {
    if (
        member.roles.highest.id ===
        member.guild.id
    ) {
        return 'None';
    }

    return member
        .roles
        .highest
        .toString();
}

/**
 * Get a readable Guardian status.
 *
 * @param {Object} guardian
 * @returns {string}
 */
function getGuardianStatus(
    guardian
) {
    if (
        guardian.warningCount ===
        null
    ) {
        return '⚠️ Unavailable';
    }

    if (
        guardian.warningCount ===
        0
    ) {
        return '🟢 Clear';
    }

    if (
        guardian.warningCount ===
        1
    ) {
        return '⚠️ 1 Guardian Mark';
    }

    return (
        `⚠️ ${guardian.warningCount} Guardian Marks`
    );
}

/**
 * Build the Soul progression block.
 *
 * @param {Object} progression
 * @returns {string}
 */
function buildProgressionDisplay(
    progression
) {
    const progress =
        progression.progress;

    const progressBar =
        createProgressBar(
            progress.progressPercent
        );

    const rankDisplay =
        progression.serverRank
            ? `#${progression.serverRank}`
            : 'Unranked';

    const remainingXp =
        Math.max(
            0,
            progress.nextLevelXp -
            progression.xp
        );

    return [
        `⭐ **Level:** \`${progression.level}\``,
        `🏆 **Realm Rank:** \`${rankDisplay}\``,
        `✨ **Total XP:** \`${formatNumber(progression.xp)}\``,
        `💬 **Messages Recorded:** \`${formatNumber(progression.messageCount)}\``,
        '',
        `**Level ${progression.level} → ${progression.level + 1}**`,
        `\`${progressBar}\` **${progress.progressPercent}%**`,
        '',
        `⭐ \`${formatNumber(progress.progressXp)} / ${formatNumber(progress.requiredForNextLevel)} XP\``,
        `🌙 **Remaining:** \`${formatNumber(remainingXp)} XP\``
    ].join('\n');
}

module.exports = {
    category:
        'information',

    data:
        new SlashCommandBuilder()
            .setName(
                'soul'
            )
            .setDescription(
                'Open Umbra’s complete record of a Soul.'
            )
            .addUserOption(option =>
                option
                    .setName(
                        'user'
                    )
                    .setDescription(
                        'Select the Soul whose record you want to open'
                    )
                    .setRequired(
                        false
                    )
            )
            .setDMPermission(
                false
            ),

    /**
     * Execute the /soul command.
     *
     * @param {import('discord.js').ChatInputCommandInteraction} interaction
     * @returns {Promise<void>}
     */
    async execute(
        interaction
    ) {
        try {
            await interaction.deferReply();

            const selectedUser =
                interaction.options.getUser(
                    'user'
                ) ??
                interaction.user;

            const [
                fullUser,
                member,
                soulRecord
            ] =
                await Promise.all([
                    selectedUser.fetch(
                        true
                    ),

                    interaction.guild.members.fetch(
                        selectedUser.id
                    ),

                    soulDatabase.ensureSoulRecord(
                        interaction.guild.id,
                        selectedUser.id
                    )
                ]);

            const avatarURL =
                fullUser.displayAvatarURL({
                    size:
                        4096,

                    forceStatic:
                        false
                });

            const bannerURL =
                fullUser.bannerURL({
                    size:
                        4096,

                    forceStatic:
                        false
                });

            const progressionDisplay =
                buildProgressionDisplay(
                    soulRecord.progression
                );

            const guardianDisplay =
                getGuardianStatus(
                    soulRecord.guardian
                );

            const orderStanding =
                getOrderStanding(
                    member,
                    interaction.guild
                );

            const highestRole =
                getHighestRole(
                    member
                );

            const titleDisplay =
                soulRecord.title
                    .displayName;

            const soulEmbed =
                createEmbed({
                    title:
                        `🌑 ${fullUser.username}'s Soul Record`,

                    description:
                        [
                            `Umbra has opened the Chronicle of ${fullUser}.`,
                            '',
                            '━━━━━━━━━━━━━━━━━━━━',
                            '',
                            '*Every Soul has a story. Umbra remembers them all.*'
                        ].join(
                            '\n'
                        ),

                    thumbnail:
                        avatarURL,

                    image:
                        bannerURL ??
                        avatarURL,

                    fields: [
                        {
                            name:
                                '📜 Soul Identity',

                            value:
                                [
                                    `**Soul Name:** ${fullUser.username}`,
                                    `**Display Name:** ${member.displayName}`,
                                    `**Soul ID:** \`${fullUser.id}\``,
                                    `**Current Title:** ${titleDisplay}`
                                ].join(
                                    '\n'
                                ),

                            inline:
                                false
                        },
                        {
                            name:
                                '⭐ Soul Progression',

                            value:
                                progressionDisplay,

                            inline:
                                false
                        },
                        {
                            name:
                                '👑 Order Standing',

                            value:
                                [
                                    `**Standing:** ${orderStanding}`,
                                    `**Highest Role:** ${highestRole}`,
                                    `**Reputation:** \`${formatNumber(soulRecord.reputation.total)}\``
                                ].join(
                                    '\n'
                                ),

                            inline:
                                false
                        },
                        {
                            name:
                                '🏆 Achievements',

                            value:
                                [
                                    `**Unlocked:** \`${formatNumber(soulRecord.achievements.unlocked)}\``,
                                    `**Known Achievements:** \`${formatNumber(soulRecord.achievements.total)}\``,
                                    '',
                                    soulRecord.achievements.recent.length > 0
                                        ? soulRecord.achievements.recent.join('\n')
                                        : '🌑 No achievements have been recorded yet.'
                                ].join(
                                    '\n'
                                ),

                            inline:
                                false
                        },
                        {
                            name:
                                '🛡️ Guardian Record',

                            value:
                                [
                                    `**Status:** ${soulRecord.guardian.status}`,
                                    `**Guardian Marks:** ${guardianDisplay}`
                                ].join(
                                    '\n'
                                ),

                            inline:
                                false
                        },
                        {
                            name:
                                '📖 Chronicles',

                            value:
                                [
                                    `**Recorded Entries:** \`${formatNumber(soulRecord.chronicles.total)}\``,
                                    '',
                                    soulRecord.chronicles.recent.length > 0
                                        ? soulRecord.chronicles.recent.join('\n')
                                        : '📖 No Chronicle entries have been written yet.'
                                ].join(
                                    '\n'
                                ),

                            inline:
                                false
                        },
                        {
                            name:
                                '🏛️ Order Activity',

                            value:
                                [
                                    `**Tickets Created:** \`${formatNumber(soulRecord.tickets.created)}\``,
                                    `**Tickets Closed:** \`${formatNumber(soulRecord.tickets.closed)}\``,
                                    `**Events Joined:** \`${formatNumber(soulRecord.events.joined)}\``,
                                    `**Events Completed:** \`${formatNumber(soulRecord.events.completed)}\``,
                                    `**Voice Time:** \`${formatNumber(soulRecord.voice.totalMinutes)} minutes\``
                                ].join(
                                    '\n'
                                ),

                            inline:
                                false
                        },
                        {
                            name:
                                '📅 Soul History',

                            value:
                                [
                                    '**Account Created**',
                                    formatDiscordDate(
                                        fullUser.createdTimestamp
                                    ),
                                    '',
                                    '**Entered the Realm**',
                                    formatDiscordDate(
                                        member.joinedTimestamp
                                    )
                                ].join(
                                    '\n'
                                ),

                            inline:
                                false
                        }
                    ]
                });

            soulEmbed.setAuthor({
                name:
                    `${fullUser.username} • Umbra Soul Record`,

                iconURL:
                    avatarURL
            });

            soulEmbed.setFooter({
                text:
                    `🌑 Umbra Core • Record opened by ${interaction.user.username}`,

                iconURL:
                    interaction.client.user
                        .displayAvatarURL({
                            size:
                                128,

                            forceStatic:
                                false
                        })
            });

            soulEmbed.setTimestamp();

            await interaction.editReply({
                embeds:
                    [soulEmbed]
            });
        } catch (error) {
            console.error(
                '❌ Umbra soul command error:'
            );

            console.error(
                error
            );

            const errorEmbed =
                createErrorEmbed(
                    '❌ Soul Record Unavailable',
                    [
                        'Umbra could not open the requested Soul Record.',
                        '',
                        'Please verify that the selected Soul is still inside this Realm and try again.'
                    ].join(
                        '\n'
                    )
                );

            if (
                interaction.deferred
            ) {
                await interaction
                    .editReply({
                        embeds:
                            [errorEmbed]
                    })
                    .catch(
                        () => null
                    );

                return;
            }

            if (
                interaction.replied
            ) {
                await interaction
                    .followUp({
                        embeds:
                            [errorEmbed],

                        flags:
                            MessageFlags.Ephemeral
                    })
                    .catch(
                        () => null
                    );

                return;
            }

            await interaction
                .reply({
                    embeds:
                        [errorEmbed],

                    flags:
                        MessageFlags.Ephemeral
                })
                .catch(
                    () => null
                );
        }
    }
};