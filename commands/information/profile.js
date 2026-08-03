const {
    SlashCommandBuilder,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    PermissionFlagsBits,
    MessageFlags,
    ComponentType
} = require('discord.js');

const {
    createEmbed,
    createErrorEmbed
} = require('../../utils/embeds');

const warningDatabase =
    require('../../database/warnings');

const {
    levels:
        levelDatabase,

    souls:
        soulDatabase,

    ranks:
        rankDatabase,

    titles:
        titleDatabase
} = require('../../database');

/**
 * Profile navigation pages.
 */
const PROFILE_PAGES = {
    SOUL:
        'profile_soul',

    RECORDS:
        'profile_records'
};

/**
 * Profile navigation remains active
 * for five minutes.
 */
const PROFILE_COLLECTOR_TIME =
    5 *
    60 *
    1_000;

/**
 * Arrancar Rank roles ordered from
 * strongest to weakest.
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
 * Official Espada throne roles.
 */
const ESPADA_RANK_ROLES =
    ARRANCAR_RANK_ROLES.slice(
        0,
        11
    );

/**
 * Format a readable number.
 *
 * @param {number|string|null|undefined} value
 * @returns {string}
 */
function formatNumber(
    value
) {
    const number =
        Number(
            value
        );

    if (
        !Number.isFinite(
            number
        )
    ) {
        return '0';
    }

    return number.toLocaleString(
        'en-US'
    );
}

/**
 * Format one Discord timestamp.
 *
 * @param {Date|string|number|null|undefined} value
 * @param {string} style
 * @returns {string}
 */
function formatDiscordDate(
    value,
    style = 'R'
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
            1_000
        );

    return `<t:${unixTimestamp}:${style}>`;
}

/**
 * Create a compact progress bar.
 *
 * @param {number} percentage
 * @param {number} length
 * @returns {string}
 */
function createProgressBar(
    percentage,
    length = 8
) {
    const safePercentage =
        Math.min(
            100,
            Math.max(
                0,
                Number(
                    percentage
                ) ||
                0
            )
        );

    const filled =
        Math.round(
            (
                safePercentage /
                100
            ) *
            length
        );

    return (
        '▰'.repeat(
            filled
        ) +
        '▱'.repeat(
            length -
            filled
        )
    );
}

/**
 * Find a member role by exact name.
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
 * Get the member's current Arrancar
 * Rank from Discord roles.
 *
 * @param {import('discord.js').GuildMember} member
 * @returns {string}
 */
function getArrancarRank(
    member
) {
    return (
        findMemberRole(
            member,
            ARRANCAR_RANK_ROLES
        )?.name ||
        '⚪ Unranked Arrancar'
    );
}

/**
 * Check whether the member holds an
 * official Espada throne.
 *
 * @param {import('discord.js').GuildMember} member
 * @returns {boolean}
 */
function isEspadaMember(
    member
) {
    return Boolean(
        findMemberRole(
            member,
            ESPADA_RANK_ROLES
        )
    );
}

/**
 * Get the Discord account type.
 *
 * @param {import('discord.js').User} user
 * @returns {string}
 */
function getAccountType(
    user
) {
    if (user.bot) {
        return '🤖 Construct';
    }

    if (user.system) {
        return '⚙️ System';
    }

    return '🌙 Soul';
}

/**
 * Get the member's primary Soul status.
 *
 * @param {import('discord.js').GuildMember} member
 * @param {Object|null} currentRankRecord
 * @returns {string}
 */
function getSoulStatus(
    member,
    currentRankRecord
) {
    if (
        member.id ===
        member.guild.ownerId
    ) {
        return '👑 RULER OF LAS NOCHES';
    }

    const currentRank =
        currentRankRecord
            ?.rank_name ||
        getArrancarRank(
            member
        );

    if (
        isEspadaMember(
            member
        )
    ) {
        return currentRank.toUpperCase();
    }

    if (
        currentRank !==
        '⚪ Unranked Arrancar'
    ) {
        return currentRank.toUpperCase();
    }

    if (member.user.bot) {
        return '🌑 GUARDIAN CONSTRUCT';
    }

    return '🌙 SOUL OF LAS NOCHES';
}

/**
 * Get Las Noches administrative standing.
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

    const namedRole =
        findMemberRole(
            member,
            [
                '⚜️ Head Captain',
                '🛡️ Captain',
                '⚔️ Lieutenant'
            ]
        );

    if (namedRole) {
        return namedRole.name;
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
        return '🌑 Guardian Construct';
    }

    return '🌙 Resident of Las Noches';
}

/**
 * Get the member's highest visible role.
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

    return member.roles
        .highest
        .toString();
}

/**
 * Get a readable timeout state.
 *
 * @param {import('discord.js').GuildMember} member
 * @returns {string}
 */
function getTimeoutStatus(
    member
) {
    if (
        !member.isCommunicationDisabled()
    ) {
        return '🟢 Clear';
    }

    const until =
        member
            .communicationDisabledUntilTimestamp;

    if (!until) {
        return '🔇 Active';
    }

    return (
        '🔇 Active until ' +
        formatDiscordDate(
            until,
            'R'
        )
    );
}

/**
 * Format the warning state.
 *
 * @param {number|string} warningCount
 * @returns {string}
 */
function formatWarningCount(
    warningCount
) {
    if (
        typeof warningCount !==
        'number'
    ) {
        return '⚠️ Unavailable';
    }

    if (
        warningCount ===
        0
    ) {
        return '🟢 Clear';
    }

    return (
        `⚠️ ${warningCount} Warning` +
        `${warningCount === 1 ? '' : 's'}`
    );
}/**
 * Safely count a member's warnings.
 *
 * @param {string} guildId
 * @param {string} userId
 * @returns {Promise<number|string>}
 */
async function getWarningCount(
    guildId,
    userId
) {
    try {
        return await warningDatabase
            .countWarnings(
                guildId,
                userId
            );
    } catch (error) {
        console.warn(
            `⚠️ Profile warning count unavailable for ${userId}: ${error.message}`
        );

        return 'Unavailable';
    }
}

/**
 * Safely load one Level record.
 *
 * @param {string} guildId
 * @param {string} userId
 * @returns {Promise<Object>}
 */
async function getLevelRecord(
    guildId,
    userId
) {
    try {
        const record =
            await levelDatabase
                .getUserLevel(
                    guildId,
                    userId
                );

        if (record) {
            return {
                ...record,

                progress:
                    record.progress ||
                    levelDatabase
                        .calculateLevelProgress(
                            record.xp || 0
                        )
            };
        }
    } catch (error) {
        console.warn(
            `⚠️ Profile Level record unavailable for ${userId}: ${error.message}`
        );
    }

    return {
        xp:
            0,

        level:
            0,

        messageCount:
            0,

        progress:
            levelDatabase
                .calculateLevelProgress(
                    0
                )
    };
}

/**
 * Safely load the member's leaderboard rank.
 *
 * @param {string} guildId
 * @param {string} userId
 * @returns {Promise<number|null>}
 */
async function getServerRank(
    guildId,
    userId
) {
    try {
        return await levelDatabase
            .getUserRank(
                guildId,
                userId
            );
    } catch (error) {
        console.warn(
            `⚠️ Profile server Rank unavailable for ${userId}: ${error.message}`
        );

        return null;
    }
}

/**
 * Safely load the complete Soul Record.
 *
 * @param {string} guildId
 * @param {string} userId
 * @returns {Promise<Object|null>}
 */
async function getSoulRecord(
    guildId,
    userId
) {
    try {
        return await soulDatabase
            .ensureSoulRecord(
                guildId,
                userId
            );
    } catch (error) {
        console.warn(
            `⚠️ Profile Soul Record unavailable for ${userId}: ${error.message}`
        );

        return null;
    }
}

/**
 * Safely load the current Arrancar Rank.
 *
 * @param {string} guildId
 * @param {string} userId
 * @returns {Promise<Object|null>}
 */
async function getCurrentRankRecord(
    guildId,
    userId
) {
    try {
        return await rankDatabase
            .getCurrentRank(
                guildId,
                userId
            );
    } catch (error) {
        console.warn(
            `⚠️ Profile Arrancar Rank unavailable for ${userId}: ${error.message}`
        );

        return null;
    }
}

/**
 * Safely count Arrancar career records.
 *
 * @param {string} guildId
 * @param {string} userId
 * @returns {Promise<number>}
 */
async function getRankHistoryCount(
    guildId,
    userId
) {
    try {
        return await rankDatabase
            .countRankHistory(
                guildId,
                userId
            );
    } catch (error) {
        console.warn(
            `⚠️ Profile Rank history unavailable for ${userId}: ${error.message}`
        );

        return 0;
    }
}

/**
 * Safely load every unlocked Chronicle Title.
 *
 * @param {string} guildId
 * @param {string} userId
 * @returns {Promise<Object[]>}
 */
async function getUnlockedTitles(
    guildId,
    userId
) {
    try {
        await titleDatabase
            .ensureDefaultSoulTitle(
                guildId,
                userId
            );

        const titles =
            await titleDatabase
                .getSoulTitles(
                    guildId,
                    userId
                );

        return Array.isArray(
            titles
        )
            ? titles
            : [];
    } catch (error) {
        console.warn(
            `⚠️ Profile Chronicle Titles unavailable for ${userId}: ${error.message}`
        );

        return [];
    }
}

/**
 * Load the member's highest earned
 * progression reward role.
 *
 * @param {import('discord.js').GuildMember} member
 * @param {number} level
 * @returns {Promise<string>}
 */
async function getProgressionRole(
    member,
    level
) {
    try {
        const earnedRewards =
            await levelDatabase
                .getEarnedLevelRewards(
                    member.guild.id,
                    level
                );

        const sortedRewards =
            [...earnedRewards].sort(
                (
                    firstReward,
                    secondReward
                ) =>
                    secondReward.level -
                    firstReward.level
            );

        for (
            const reward
            of sortedRewards
        ) {
            const role =
                member.guild.roles.cache.get(
                    reward.roleId
                );

            if (
                role &&
                member.roles.cache.has(
                    role.id
                )
            ) {
                return `${role} • Level ${reward.level}`;
            }
        }

        return 'None unlocked';
    } catch (error) {
        console.warn(
            `⚠️ Profile progression role unavailable for ${member.id}: ${error.message}`
        );

        return 'Unavailable';
    }
}

/**
 * Find the active Chronicle Title.
 *
 * @param {Object|null} soulRecord
 * @param {Object[]} unlockedTitles
 * @returns {Object|null}
 */
function getActiveChronicleTitle(
    soulRecord,
    unlockedTitles
) {
    return (
        unlockedTitles.find(
            title =>
                title.isActive
        ) ||
        soulRecord?.title ||
        null
    );
}

/**
 * Calculate profile completion.
 *
 * @param {Object} options
 * @param {Object|null} options.soulRecord
 * @param {Object[]} options.unlockedTitles
 * @param {Object|null} options.currentRankRecord
 * @param {Object} options.levelRecord
 * @param {import('discord.js').User} options.fullUser
 * @returns {{
 *     completed: number,
 *     total: number,
 *     percentage: number
 * }}
 */
function calculateProfileCompletion({
    soulRecord,
    unlockedTitles,
    currentRankRecord,
    levelRecord,
    fullUser
}) {
    const checks = [
        Boolean(
            soulRecord
        ),

        Number(
            levelRecord.level || 0
        ) > 0,

        Number(
            levelRecord.xp || 0
        ) > 0,

        unlockedTitles.length > 1,

        Boolean(
            currentRankRecord
        ),

        Number(
            soulRecord
                ?.achievements
                ?.unlocked || 0
        ) > 0,

        Boolean(
            fullUser.bannerURL()
        )
    ];

    const completed =
        checks.filter(
            Boolean
        ).length;

    const total =
        checks.length;

    const percentage =
        total > 0
            ? Math.round(
                (
                    completed /
                    total
                ) *
                100
            )
            : 0;

    return {
        completed,
        total,
        percentage
    };
}

/**
 * Build compact Soul identity text.
 *
 * @param {import('discord.js').User} user
 * @param {import('discord.js').GuildMember} member
 * @returns {string}
 */
function buildSoulIdentityDisplay(
    user,
    member
) {
    return [
        `👤 **${member.displayName}**`,
        `${getAccountType(user)}`,
        `🆔 \`${user.id}\``
    ].join('\n');
}

/**
 * Build compact Spiritual Power details.
 *
 * @param {Object} levelRecord
 * @param {number|null} serverRank
 * @returns {string}
 */
function buildSpiritualPowerDisplay(
    levelRecord,
    serverRank
) {
    const progress =
        levelRecord.progress ||
        levelDatabase
            .calculateLevelProgress(
                levelRecord.xp || 0
            );

    const level =
        Number(
            levelRecord.level || 0
        );

    const xp =
        Number(
            levelRecord.xp || 0
        );

    return [
        `✨ **Level ${formatNumber(level)}**`,
        `\`${createProgressBar(
            progress.progressPercent,
            8
        )}\` **${formatNumber(
            progress.progressPercent
        )}%**`,
        `-# ${formatNumber(
            progress.progressXp
        )} / ${formatNumber(
            progress.requiredForNextLevel
        )} XP`,
        `⚡ \`${formatNumber(xp)} XP\` • 🏆 \`${
            serverRank
                ? `#${serverRank}`
                : 'Unranked'
        }\` • 💬 \`${formatNumber(
            levelRecord.messageCount
        )}\``
    ].join('\n');
}

/**
 * Build compact Chronicle Title details.
 *
 * @param {Object|null} activeTitle
 * @param {Object[]} unlockedTitles
 * @returns {string}
 */
function buildChronicleDisplay(
    activeTitle,
    unlockedTitles
) {
    return [
        `🏷️ ${
            activeTitle?.displayName ||
            '🌑 Nameless Soul'
        }`,
        `${
            activeTitle?.rarity ||
            'Default'
        } • 📖 ${formatNumber(
            unlockedTitles.length
        )} unlocked`
    ].join('\n');
}

/**
 * Build compact Arrancar Rank details.
 *
 * @param {import('discord.js').GuildMember} member
 * @param {Object|null} currentRankRecord
 * @param {number} historyCount
 * @returns {string}
 */
function buildHierarchyDisplay(
    member,
    currentRankRecord,
    historyCount
) {
    const currentRank =
        currentRankRecord
            ?.rank_name ||
        getArrancarRank(
            member
        );

    return [
        `⚔️ ${currentRank}`,
        `${
            isEspadaMember(
                member
            )
                ? '👑 Throne Active'
                : '🌙 No Throne'
        } • 📜 ${formatNumber(
            historyCount
        )} records`
    ].join('\n');
}/**
 * Build compact Achievement details.
 *
 * @param {Object|null} soulRecord
 * @returns {string}
 */
function buildAchievementDisplay(
    soulRecord
) {
    const achievements =
        soulRecord?.achievements ||
        {};

    const unlocked =
        Number(
            achievements.unlocked ||
            0
        );

    const total =
        Number(
            achievements.total ||
            0
        );

    const percentage =
        total > 0
            ? Math.min(
                100,
                Math.round(
                    (
                        unlocked /
                        total
                    ) *
                    100
                )
            )
            : 0;

    return [
        `🏆 \`${formatNumber(
            unlocked
        )} / ${formatNumber(
            total
        )}\``,
        `\`${createProgressBar(
            percentage,
            8
        )}\` **${percentage}%**`
    ].join('\n');
}

/**
 * Build compact Guardian details.
 *
 * @param {import('discord.js').GuildMember} member
 * @param {number|string} warningCount
 * @returns {string}
 */
function buildGuardianDisplay(
    member,
    warningCount
) {
    return [
        `🛡️ Warnings: ${formatWarningCount(
            warningCount
        )}`,
        `🔒 Communication: ${getTimeoutStatus(
            member
        )}`
    ].join('\n');
}

/**
 * Build compact Kingdom standing.
 *
 * @param {import('discord.js').GuildMember} member
 * @param {import('discord.js').Guild} guild
 * @param {string} progressionRole
 * @returns {string}
 */
function buildStandingDisplay(
    member,
    guild,
    progressionRole
) {
    return [
        `👑 ${getLasNochesStanding(
            member,
            guild
        )}`,
        `🎖️ ${progressionRole}`
    ].join('\n');
}

/**
 * Build compact Soul history.
 *
 * @param {import('discord.js').User} user
 * @param {import('discord.js').GuildMember} member
 * @returns {string}
 */
function buildSoulHistoryDisplay(
    user,
    member
) {
    return [
        `🌌 Created ${formatDiscordDate(
            user.createdAt,
            'R'
        )}`,
        `🏰 Joined ${formatDiscordDate(
            member.joinedAt,
            'R'
        )}`
    ].join('\n');
}

/**
 * Build compact completion details.
 *
 * @param {{
 *     completed: number,
 *     total: number,
 *     percentage: number
 * }} completion
 * @returns {string}
 */
function buildCompletionDisplay(
    completion
) {
    return [
        `\`${createProgressBar(
            completion.percentage,
            8
        )}\` **${completion.percentage}%**`,
        `-# ${completion.completed}/${completion.total} milestones completed`
    ].join('\n');
}

/**
 * Build the main profile summary.
 *
 * @param {Object} context
 * @returns {string}
 */
function buildProfileSummary(
    context
) {
    const {
        member,
        currentRankRecord,
        activeTitle,
        levelRecord,
        serverRank
    } = context;

    const currentRank =
        currentRankRecord
            ?.rank_name ||
        getArrancarRank(
            member
        );

    const level =
        Number(
            levelRecord.level ||
            0
        );

    return [
        `## ${getSoulStatus(
            member,
            currentRankRecord
        )}`,
        `${currentRank}`,
        `${
            activeTitle?.displayName ||
            '🌑 Nameless Soul'
        }`,
        `✨ Level ${formatNumber(
            level
        )} • 🏆 ${
            serverRank
                ? `#${serverRank}`
                : 'Unranked'
        }`
    ].join('\n');
}

/**
 * Build profile buttons.
 *
 * @param {'profile_soul'|'profile_records'} activePage
 * @param {string} avatarURL
 * @param {string|null} bannerURL
 * @param {boolean} disabled
 * @returns {ActionRowBuilder[]}
 */
function buildProfileComponents(
    activePage,
    avatarURL,
    bannerURL,
    disabled =
        false
) {
    const navigationRow =
        new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId(
                        PROFILE_PAGES
                            .SOUL
                    )
                    .setLabel(
                        'Soul'
                    )
                    .setEmoji(
                        '🌙'
                    )
                    .setStyle(
                        activePage ===
                            PROFILE_PAGES
                                .SOUL
                            ? ButtonStyle.Primary
                            : ButtonStyle.Secondary
                    )
                    .setDisabled(
                        disabled
                    ),

                new ButtonBuilder()
                    .setCustomId(
                        PROFILE_PAGES
                            .RECORDS
                    )
                    .setLabel(
                        'Records'
                    )
                    .setEmoji(
                        '📚'
                    )
                    .setStyle(
                        activePage ===
                            PROFILE_PAGES
                                .RECORDS
                            ? ButtonStyle.Primary
                            : ButtonStyle.Secondary
                    )
                    .setDisabled(
                        disabled
                    )
            );

    const linkRow =
        new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setLabel(
                        'Avatar'
                    )
                    .setEmoji(
                        '🖼️'
                    )
                    .setStyle(
                        ButtonStyle.Link
                    )
                    .setURL(
                        avatarURL
                    )
            );

    if (bannerURL) {
        linkRow.addComponents(
            new ButtonBuilder()
                .setLabel(
                    'Banner'
                )
                .setEmoji(
                    '🌌'
                )
                .setStyle(
                    ButtonStyle.Link
                )
                .setURL(
                    bannerURL
                )
        );
    }

    return [
        navigationRow,
        linkRow
    ];
}

/**
 * Build the main Soul page.
 *
 * @param {Object} context
 * @returns {import('discord.js').EmbedBuilder}
 */
function buildSoulEmbed(
    context
) {
    const {
        fullUser,
        member,
        avatarURL,
        levelRecord,
        serverRank,
        activeTitle,
        unlockedTitles,
        currentRankRecord,
        rankHistoryCount,
        soulRecord,
        interaction
    } = context;

    return createEmbed({
        title:
            `🌙 ${fullUser.username}`,

        description:
            buildProfileSummary(
                context
            ),

        color:
            '#6F42C1',

        thumbnail:
            avatarURL,

        author: {
            name:
                `${member.displayName} • Soul Card`,

            iconURL:
                avatarURL
        },

        footer: {
            text:
                `Umbra • Soul 1/2 • Requested by ${interaction.user.username}`,

            iconURL:
                interaction.client.user
                    .displayAvatarURL({
                        extension:
                            'png',

                        size:
                            128,

                        forceStatic:
                            false
                    })
        },

        fields: [
            {
                name:
                    '👤 Soul',

                value:
                    buildSoulIdentityDisplay(
                        fullUser,
                        member
                    ),

                inline:
                    true
            },
            {
                name:
                    '✨ Spiritual Power',

                value:
                    buildSpiritualPowerDisplay(
                        levelRecord,
                        serverRank
                    ),

                inline:
                    true
            },
            {
                name:
                    '🏷️ Chronicle',

                value:
                    buildChronicleDisplay(
                        activeTitle,
                        unlockedTitles
                    ),

                inline:
                    true
            },
            {
                name:
                    '⚔️ Hierarchy',

                value:
                    buildHierarchyDisplay(
                        member,
                        currentRankRecord,
                        rankHistoryCount
                    ),

                inline:
                    true
            },
            {
                name:
                    '🏆 Achievements',

                value:
                    buildAchievementDisplay(
                        soulRecord
                    ),

                inline:
                    true
            }
        ]
    });
}

/**
 * Build the secondary Records page.
 *
 * @param {Object} context
 * @returns {import('discord.js').EmbedBuilder}
 */
function buildRecordsEmbed(
    context
) {
    const {
        fullUser,
        member,
        avatarURL,
        warningCount,
        progressionRole,
        completion,
        interaction
    } = context;

    return createEmbed({
        title:
            `📚 ${fullUser.username} • Records`,

        description:
            'Administrative and historical records preserved by Umbra.',

        color:
            '#4B2E83',

        thumbnail:
            avatarURL,

        author: {
            name:
                `${member.displayName} • Kingdom Archives`,

            iconURL:
                avatarURL
        },

        footer: {
            text:
                `Umbra • Records 2/2 • Requested by ${interaction.user.username}`,

            iconURL:
                interaction.client.user
                    .displayAvatarURL({
                        extension:
                            'png',

                        size:
                            128,

                        forceStatic:
                            false
                    })
        },

        fields: [
            {
                name:
                    '🎖️ Kingdom Standing',

                value:
                    buildStandingDisplay(
                        member,
                        interaction.guild,
                        progressionRole
                    ),

                inline:
                    true
            },
            {
                name:
                    '🌑 Highest Role',

                value:
                    getHighestRole(
                        member
                    ),

                inline:
                    true
            },
            {
                name:
                    '🛡️ Guardian',

                value:
                    buildGuardianDisplay(
                        member,
                        warningCount
                    ),

                inline:
                    false
            },
            {
                name:
                    '📈 Completion',

                value:
                    buildCompletionDisplay(
                        completion
                    ),

                inline:
                    true
            },
            {
                name:
                    '📅 History',

                value:
                    buildSoulHistoryDisplay(
                        fullUser,
                        member
                    ),

                inline:
                    true
            }
        ]
    });
}module.exports = {
    category:
        'information',

    data:
        new SlashCommandBuilder()
            .setName(
                'profile'
            )
            .setDescription(
                'Open a compact premium Las Noches Soul profile.'
            )
            .addUserOption(option =>
                option
                    .setName(
                        'user'
                    )
                    .setDescription(
                        'Select the Soul whose profile you want to inspect'
                    )
                    .setRequired(
                        false
                    )
            )
            .setDMPermission(
                false
            ),

    /**
     * Execute the /profile command.
     *
     * @param {import('discord.js').ChatInputCommandInteraction} interaction
     * @returns {Promise<void>}
     */
    async execute(
        interaction
    ) {
        try {
            if (
                !interaction.inGuild()
            ) {
                await interaction.reply({
                    embeds: [
                        createErrorEmbed(
                            '❌ Las Noches Only Command',
                            'Soul profiles can only be opened inside Las Noches.'
                        )
                    ],

                    flags:
                        MessageFlags.Ephemeral
                });

                return;
            }

            await interaction.deferReply();

            const selectedUser =
                interaction.options.getUser(
                    'user'
                ) ??
                interaction.user;

            const member =
                await interaction.guild.members
                    .fetch(
                        selectedUser.id
                    )
                    .catch(
                        () => null
                    );

            if (!member) {
                await interaction.editReply({
                    embeds: [
                        createErrorEmbed(
                            '❌ Soul Not Found',
                            'The selected Soul is not currently inside Las Noches.'
                        )
                    ],

                    components:
                        []
                });

                return;
            }

            const fullUser =
                await selectedUser.fetch(
                    true
                );

            const [
                warningCount,
                levelRecord,
                serverRank,
                soulRecord,
                currentRankRecord,
                rankHistoryCount,
                unlockedTitles
            ] = await Promise.all([
                getWarningCount(
                    interaction.guild.id,
                    fullUser.id
                ),

                getLevelRecord(
                    interaction.guild.id,
                    fullUser.id
                ),

                getServerRank(
                    interaction.guild.id,
                    fullUser.id
                ),

                getSoulRecord(
                    interaction.guild.id,
                    fullUser.id
                ),

                getCurrentRankRecord(
                    interaction.guild.id,
                    fullUser.id
                ),

                getRankHistoryCount(
                    interaction.guild.id,
                    fullUser.id
                ),

                getUnlockedTitles(
                    interaction.guild.id,
                    fullUser.id
                )
            ]);

            const progressionRole =
                await getProgressionRole(
                    member,
                    Number(
                        levelRecord.level || 0
                    )
                );

            const activeTitle =
                getActiveChronicleTitle(
                    soulRecord,
                    unlockedTitles
                );

            const avatarURL =
                fullUser.displayAvatarURL({
                    extension:
                        'png',

                    size:
                        2048,

                    forceStatic:
                        false
                });

            const bannerURL =
                fullUser.bannerURL({
                    extension:
                        'png',

                    size:
                        2048,

                    forceStatic:
                        false
                });

            const completion =
                calculateProfileCompletion({
                    soulRecord,
                    unlockedTitles,
                    currentRankRecord,
                    levelRecord,
                    fullUser
                });

            const context = {
                interaction,
                fullUser,
                member,
                avatarURL,
                bannerURL,
                levelRecord,
                serverRank,
                soulRecord,
                currentRankRecord,
                rankHistoryCount,
                unlockedTitles,
                activeTitle,
                warningCount,
                progressionRole,
                completion
            };

            let activePage =
                PROFILE_PAGES.SOUL;

            const profileMessage =
                await interaction.editReply({
                    embeds: [
                        buildSoulEmbed(
                            context
                        )
                    ],

                    components:
                        buildProfileComponents(
                            activePage,
                            avatarURL,
                            bannerURL
                        )
                });

            const collector =
                profileMessage
                    .createMessageComponentCollector({
                        componentType:
                            ComponentType.Button,

                        time:
                            PROFILE_COLLECTOR_TIME
                    });

            collector.on(
                'collect',

                async buttonInteraction => {
                    if (
                        buttonInteraction.user.id !==
                        interaction.user.id
                    ) {
                        await buttonInteraction.reply({
                            content:
                                'Only the member who opened this profile may control it.',

                            flags:
                                MessageFlags.Ephemeral
                        });

                        return;
                    }

                    if (
                        buttonInteraction.customId !==
                            PROFILE_PAGES.SOUL &&
                        buttonInteraction.customId !==
                            PROFILE_PAGES.RECORDS
                    ) {
                        return;
                    }

                    activePage =
                        buttonInteraction.customId;

                    const activeEmbed =
                        activePage ===
                            PROFILE_PAGES.SOUL
                            ? buildSoulEmbed(
                                context
                            )
                            : buildRecordsEmbed(
                                context
                            );

                    await buttonInteraction.update({
                        embeds: [
                            activeEmbed
                        ],

                        components:
                            buildProfileComponents(
                                activePage,
                                avatarURL,
                                bannerURL
                            )
                    });
                }
            );

            collector.on(
                'end',

                async () => {
                    try {
                        await interaction.editReply({
                            components:
                                buildProfileComponents(
                                    activePage,
                                    avatarURL,
                                    bannerURL,
                                    true
                                )
                        });
                    } catch {
                        /*
                         * The message may have been
                         * deleted before expiry.
                         */
                    }
                }
            );
        } catch (error) {
            console.error(
                '❌ Umbra /profile command error:'
            );

            console.error(
                error
            );

            const errorEmbed =
                createErrorEmbed(
                    '❌ Soul Profile Unavailable',
                    'Umbra could not open the requested Soul profile.'
                );

            if (
                interaction.deferred
            ) {
                await interaction
                    .editReply({
                        embeds: [
                            errorEmbed
                        ],

                        components:
                            []
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
                        embeds: [
                            errorEmbed
                        ],

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
                    embeds: [
                        errorEmbed
                    ],

                    flags:
                        MessageFlags.Ephemeral
                })
                .catch(
                    () => null
                );
        }
    }
};