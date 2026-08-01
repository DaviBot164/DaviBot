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
 * Hollow Evolution roles ordered
 * from the strongest to the weakest.
 */
const HOLLOW_EVOLUTION_ROLES = [
    '⚔️ Arrancar',
    '👑 Vasto Lorde',
    '🐺 Adjuchas',
    '⚪ Gillian',
    '🦴 Menos Grande',
    '👁️ Hollow'
];

/**
 * Manual Arrancar ranks ordered
 * from the strongest to the weakest.
 */
const ARRANCAR_RANK_ROLES = [
    '👑 Espada 0',
    'Ⅰ Espada',
    'Ⅱ Espada',
    'Ⅲ Espada',
    'Ⅳ Espada',
    'Ⅴ Espada',
    'Ⅵ Espada',
    'Ⅶ Espada',
    'Ⅷ Espada',
    'Ⅸ Espada',
    'Ⅹ Espada',
    '🌘 Privaron Espada',
    '⚔️ Fracción',
    '🦴 Numeros',
    '⚪ Unranked Arrancar'
];

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
 * @param {number|Date|null} value
 * @returns {string}
 */
function formatDiscordDate(
    value
) {
    if (!value) {
        return 'Unknown';
    }

    const date =
        value instanceof Date
            ? value
            : new Date(
                value
            );

    if (
        Number.isNaN(
            date.getTime()
        )
    ) {
        return 'Unknown';
    }

    const unixTimestamp =
        Math.floor(
            date.getTime() /
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
 * Find the first member role matching
 * one of the supplied role names.
 *
 * @param {import('discord.js').GuildMember} member
 * @param {string[]} roleNames
 * @returns {import('discord.js').Role|null}
 */
function findMemberRole(
    member,
    roleNames
) {
    for (
        const roleName
        of roleNames
    ) {
        const role =
            member.roles.cache.find(
                cachedRole =>
                    cachedRole.name ===
                    roleName
            );

        if (role) {
            return role;
        }
    }

    return null;
}

/**
 * Get the member's current Hollow
 * Evolution stage.
 *
 * @param {import('discord.js').GuildMember} member
 * @returns {string}
 */
function getHollowEvolution(
    member
) {
    const evolutionRole =
        findMemberRole(
            member,
            HOLLOW_EVOLUTION_ROLES
        );

    if (!evolutionRole) {
        return '👁️ Hollow';
    }

    return evolutionRole.name;
}

/**
 * Get the member's manually assigned
 * Arrancar rank.
 *
 * @param {import('discord.js').GuildMember} member
 * @returns {string}
 */
function getArrancarRank(
    member
) {
    const rankRole =
        findMemberRole(
            member,
            ARRANCAR_RANK_ROLES
        );

    if (!rankRole) {
        return '⚪ Unranked Arrancar';
    }

    return rankRole.name;
}

/**
 * Get the member's Las Noches
 * administrative standing.
 *
 * This is separate from Hollow Evolution
 * and the manual Arrancar rank.
 *
 * @param {import('discord.js').GuildMember} member
 * @param {import('discord.js').Guild} guild
 * @returns {string}
 */
function getLasNochesStanding(
    member,
    guild
) {
    if (
        member.id ===
        guild.ownerId
    ) {
        return '👑 Ruler of Las Noches';
    }

    const namedStaffRoles = [
        '⚜️ Head Captain',
        '🛡️ Captain',
        '⚔️ Lieutenant'
    ];

    const namedStaffRole =
        findMemberRole(
            member,
            namedStaffRoles
        );

    if (namedStaffRole) {
        return namedStaffRole.name;
    }

    if (
        member.permissions.has(
            PermissionFlagsBits.Administrator
        )
    ) {
        return '🛡️ Captain';
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
        return '⚔️ Lieutenant';
    }

    if (member.user.bot) {
        return '🌑 Guardian of Las Noches';
    }

    return '🌙 Resident of Las Noches';
}

/**
 * Get the highest visible Discord role.
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
}/**
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

    const serverRankDisplay =
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
        `⭐ **Soul Level:** \`${progression.level}\``,
        `🏆 **Las Noches Standing:** \`${serverRankDisplay}\``,
        `✨ **Total Spiritual Power:** \`${formatNumber(progression.xp)} XP\``,
        `💬 **Messages Recorded:** \`${formatNumber(progression.messageCount)}\``,
        '',
        `**Level ${progression.level} → ${progression.level + 1}**`,
        `\`${progressBar}\` **${progress.progressPercent}%**`,
        '',
        `⭐ \`${formatNumber(progress.progressXp)} / ${formatNumber(progress.requiredForNextLevel)} XP\``,
        `🌙 **Power Required:** \`${formatNumber(remainingXp)} XP\``
    ].join('\n');
}

/**
 * Format one unlocked Achievement.
 *
 * @param {Object} achievement
 * @returns {string}
 */
function formatAchievement(
    achievement
) {
    const icon =
        achievement.icon ||
        '🏆';

    const name =
        achievement.name ||
        'Unknown Chronicle';

    const description =
        achievement.description ||
        'No description available.';

    const unlockedAt =
        achievement.unlockedAt
            ? Math.floor(
                new Date(
                    achievement.unlockedAt
                ).getTime() /
                1000
            )
            : null;

    const unlockedDisplay =
        unlockedAt
            ? `<t:${unlockedAt}:R>`
            : 'Unknown';

    return [
        `${icon} **${name}**`,
        `-# ${description}`,
        `-# Recorded ${unlockedDisplay}`
    ].join('\n');
}

/**
 * Build the Achievement section.
 *
 * @param {Object} achievementData
 * @returns {string}
 */
function buildAchievementDisplay(
    achievementData
) {
    const unlocked =
        Number(
            achievementData.unlocked || 0
        );

    const total =
        Number(
            achievementData.total || 0
        );

    const recent =
        Array.isArray(
            achievementData.recent
        )
            ? achievementData.recent
            : [];

    const progressPercent =
        total > 0
            ? Math.min(
                100,
                Math.floor(
                    (
                        unlocked /
                        total
                    ) *
                    100
                )
            )
            : 0;

    const progressBar =
        createProgressBar(
            progressPercent,
            10
        );

    const lines = [
        `🏆 **Recorded:** \`${formatNumber(unlocked)} / ${formatNumber(total)}\``,
        `\`${progressBar}\` **${progressPercent}%**`
    ];

    if (
        recent.length === 0
    ) {
        lines.push(
            '',
            '🌑 No Soul Chronicles have been unlocked yet.'
        );

        return lines.join('\n');
    }

    lines.push(
        '',
        '**Recently Recorded**',
        ''
    );

    for (
        const achievement
        of recent
    ) {
        lines.push(
            formatAchievement(
                achievement
            ),
            ''
        );
    }

    return lines
        .join('\n')
        .trim();
}

/**
 * Build the Chronicle section.
 *
 * @param {Object} chronicleData
 * @returns {string}
 */
function buildChronicleDisplay(
    chronicleData
) {
    const total =
        Number(
            chronicleData.total || 0
        );

    const recent =
        Array.isArray(
            chronicleData.recent
        )
            ? chronicleData.recent
            : [];

    if (
        recent.length === 0
    ) {
        return [
            `**Archive Entries:** \`${formatNumber(total)}\``,
            '',
            '📖 No additional Soul Archive entries have been written yet.'
        ].join('\n');
    }

    return [
        `**Archive Entries:** \`${formatNumber(total)}\``,
        '',
        ...recent.map(
            entry =>
                typeof entry ===
                'string'
                    ? entry
                    : String(entry)
        )
    ].join('\n');
}

/**
 * Build the Hollow Evolution display.
 *
 * @param {import('discord.js').GuildMember} member
 * @returns {string}
 */
function buildEvolutionDisplay(
    member
) {
    const currentEvolution =
        getHollowEvolution(
            member
        );

    const currentIndex =
        HOLLOW_EVOLUTION_ROLES
            .indexOf(
                currentEvolution
            );

    const nextEvolution =
        currentIndex > 0
            ? HOLLOW_EVOLUTION_ROLES[
                currentIndex - 1
            ]
            : null;

    const lines = [
        `**Current Evolution:** ${currentEvolution}`
    ];

    if (nextEvolution) {
        lines.push(
            `**Next Evolution:** ${nextEvolution}`,
            '',
            '-# Evolution advances through Soul Levels and activity.'
        );
    } else {
        lines.push(
            '',
            '🌙 This Soul has reached the final Hollow Evolution.'
        );
    }

    return lines.join('\n');
}

/**
 * Build the manual Arrancar rank display.
 *
 * @param {import('discord.js').GuildMember} member
 * @returns {string}
 */
function buildArrancarRankDisplay(
    member
) {
    const arrancarRank =
        getArrancarRank(
            member
        );

    return [
        `**Current Rank:** ${arrancarRank}`,
        '',
        '-# Arrancar ranks are granted manually by the Ruler and the High Command of Las Noches.'
    ].join('\n');
}module.exports = {
    category:
        'information',

    data:
        new SlashCommandBuilder()
            .setName(
                'soul'
            )
            .setDescription(
                'Open a Soul Record from the archives of Las Noches.'
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

            const profileImageURL =
                bannerURL ??
                avatarURL;

            const progressionDisplay =
                buildProgressionDisplay(
                    soulRecord.progression
                );

            const achievementDisplay =
                buildAchievementDisplay(
                    soulRecord.achievements
                );

            const chronicleDisplay =
                buildChronicleDisplay(
                    soulRecord.chronicles
                );

            const evolutionDisplay =
                buildEvolutionDisplay(
                    member
                );

            const arrancarRankDisplay =
                buildArrancarRankDisplay(
                    member
                );

            const guardianDisplay =
                getGuardianStatus(
                    soulRecord.guardian
                );

            const lasNochesStanding =
                getLasNochesStanding(
                    member,
                    interaction.guild
                );

            const highestRole =
                getHighestRole(
                    member
                );

            const titleDisplay =
                soulRecord.title
                    ?.displayName ||
                '🌑 Nameless Soul';

            const soulEmbed =
                createEmbed({
                    title:
                        `📖 ${fullUser.username}'s Soul Record`,

                    description:
                        [
                            `Umbra has opened the official Soul Archives of ${fullUser}.`,
                            '',
                            '━━━━━━━━━━━━━━━━━━━━',
                            '',
                            '*Every evolution, achievement and mark is remembered beneath the eternal moon of Las Noches.*'
                        ].join(
                            '\n'
                        ),

                    thumbnail:
                        avatarURL,

                    image:
                        profileImageURL,

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
                                '⭐ Spiritual Progression',

                            value:
                                progressionDisplay,

                            inline:
                                false
                        },
                        {
                            name:
                                '🩸 Hollow Evolution',

                            value:
                                evolutionDisplay,

                            inline:
                                false
                        },
                        {
                            name:
                                '⚔️ Arrancar Rank',

                            value:
                                arrancarRankDisplay,

                            inline:
                                false
                        },
                        {
                            name:
                                '👑 Las Noches Standing',

                            value:
                                [
                                    `**Standing:** ${lasNochesStanding}`,
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
                                '🏆 Soul Chronicles',

                            value:
                                achievementDisplay,

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
                                '📖 Soul Archives',

                            value:
                                chronicleDisplay,

                            inline:
                                false
                        },
                        {
                            name:
                                '🏰 Las Noches Activity',

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
                                    '**Entered Las Noches**',
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
                    `${fullUser.username} • Las Noches Soul Archives`,

                iconURL:
                    avatarURL
            });

            soulEmbed.setFooter({
                text:
                    `🌙 Umbra • Guardian of Las Noches • Opened by ${interaction.user.username}`,

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
                        'Please verify that the selected Soul is still inside Las Noches and try again.'
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