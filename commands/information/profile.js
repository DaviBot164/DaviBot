const {
    SlashCommandBuilder,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    PermissionFlagsBits,
    MessageFlags
} = require('discord.js');

const {
    createEmbed,
    createErrorEmbed
} = require('../../utils/embeds');

const embedConfig =
    require('../../config/embed');

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
 * Manually managed Arrancar Rank roles,
 * ordered from strongest to weakest.
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
const ESPADA_RANK_ROLES = [
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
    'Ⅹ Espada'
];

/**
 * Format a number using readable
 * thousands separators.
 *
 * @param {number|string|null|undefined} value
 * @returns {string}
 */
function formatNumber(
    value
) {
    const numericValue =
        Number(
            value
        );

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
 * @param {Date|string|number|null|undefined} value
 * @param {string} style
 * @returns {string}
 */
function formatDiscordDate(
    value,
    style = 'F'
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
 * Calculate complete days elapsed
 * since one date.
 *
 * @param {Date|string|number|null|undefined} value
 * @returns {number}
 */
function calculateDaysSince(
    value
) {
    if (!value) {
        return 0;
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
        return 0;
    }

    return Math.max(
        0,
        Math.floor(
            (
                Date.now() -
                date.getTime()
            ) /
            86_400_000
        )
    );
}

/**
 * Create Umbra's visual progress bar.
 *
 * @param {number} percentage
 * @param {number} length
 * @returns {string}
 */
function createProgressBar(
    percentage,
    length = 14
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
 * Get the member's current Discord
 * Arrancar Rank role.
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

    return (
        rankRole?.name ||
        '⚪ Unranked Arrancar'
    );
}

/**
 * Check whether a member currently
 * occupies an Espada throne.
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
 * Get the account type.
 *
 * @param {import('discord.js').User} user
 * @returns {string}
 */
function getAccountType(
    user
) {
    if (
        user.bot
    ) {
        return '🤖 Guardian Construct';
    }

    if (
        user.system
    ) {
        return '⚙️ Discord System Account';
    }

    return '👤 Recorded Soul';
}

/**
 * Get the member's Las Noches
 * administrative standing.
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

    const namedRole =
        findMemberRole(
            member,
            namedStaffRoles
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

    if (
        member.user.bot
    ) {
        return '🌑 Guardian of Las Noches';
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
 * Count roles without @everyone.
 *
 * @param {import('discord.js').GuildMember} member
 * @returns {number}
 */
function getRoleCount(
    member
) {
    return member.roles.cache.filter(
        role =>
            role.id !==
            member.guild.id
    ).size;
}

/**
 * Get a readable timeout status.
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

    const timeoutTimestamp =
        member.communicationDisabledUntilTimestamp;

    if (!timeoutTimestamp) {
        return '🔇 Active';
    }

    return (
        '🔇 Active until ' +
        formatDiscordDate(
            timeoutTimestamp,
            'R'
        )
    );
}

/**
 * Format the warning count.
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

    if (
        warningCount ===
        1
    ) {
        return '⚠️ 1 Warning';
    }

    return `⚠️ ${warningCount} Warnings`;
}

/**
 * Safely count a Soul's warnings.
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
 * Safely load one Soul's server
 * leaderboard position.
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
 * Safely load the current Arrancar
 * database Rank.
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
 * Safely load every unlocked Title.
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
}/**
 * Safely load the member's highest
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
                return (
                    `${role} • Level ${reward.level}`
                );
            }
        }

        return '🌑 None Unlocked';
    } catch (error) {
        console.warn(
            `⚠️ Profile progression role unavailable for ${member.id}: ${error.message}`
        );

        return '⚠️ Unavailable';
    }
}

/**
 * Build the compact Soul progression block.
 *
 * @param {Object} levelRecord
 * @param {number|null} serverRank
 * @returns {string}
 */
function buildProgressionDisplay(
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

    const remainingXp =
        Math.max(
            0,
            Number(
                progress.nextLevelXp || 0
            ) -
            xp
        );

    const rankDisplay =
        serverRank
            ? `#${serverRank}`
            : 'Unranked';

    return [
        `⭐ **Soul Level:** \`${formatNumber(level)}\``,
        `🏆 **Server Rank:** \`${rankDisplay}\``,
        `✨ **Spiritual Power:** \`${formatNumber(xp)} XP\``,
        `💬 **Messages Recorded:** \`${formatNumber(levelRecord.messageCount)}\``,
        '',
        `**Level ${level} → ${level + 1}**`,
        `\`${createProgressBar(progress.progressPercent, 14)}\` **${formatNumber(progress.progressPercent)}%**`,
        `-# ${formatNumber(progress.progressXp)} / ${formatNumber(progress.requiredForNextLevel)} XP • ${formatNumber(remainingXp)} XP remaining`
    ].join('\n');
}

/**
 * Build Chronicle Title status.
 *
 * @param {Object|null} soulRecord
 * @param {Object[]} unlockedTitles
 * @returns {string}
 */
function buildChronicleDisplay(
    soulRecord,
    unlockedTitles
) {
    const activeTitle =
        unlockedTitles.find(
            title =>
                title.isActive
        ) ||
        soulRecord?.title ||
        null;

    const activeTitleDisplay =
        activeTitle?.displayName ||
        '🌑 Nameless Soul';

    const activeRarity =
        activeTitle?.rarity ||
        'Default';

    const activeCategory =
        activeTitle?.category ||
        'General';

    return [
        `🏷️ **Active Title:** ${activeTitleDisplay}`,
        `🌟 **Rarity:** ${activeRarity}`,
        `📚 **Category:** ${activeCategory}`,
        `📖 **Titles Unlocked:** \`${formatNumber(unlockedTitles.length)}\``
    ].join('\n');
}

/**
 * Build Arrancar hierarchy status.
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
    const discordRank =
        getArrancarRank(
            member
        );

    const databaseRank =
        currentRankRecord?.rank_name ||
        null;

    const currentRankDisplay =
        databaseRank ||
        discordRank;

    const espadaStatus =
        isEspadaMember(
            member
        )
            ? '👑 Active Espada Throne Holder'
            : '🌑 No Espada Throne';

    return [
        `⚔️ **Current Rank:** ${currentRankDisplay}`,
        `👑 **Espada Status:** ${espadaStatus}`,
        `📜 **Career Records:** \`${formatNumber(historyCount)}\``,
        currentRankRecord?.assigned_at
            ? `📅 **Assigned:** ${formatDiscordDate(currentRankRecord.assigned_at, 'R')}`
            : '📅 **Assigned:** Not recorded'
    ].join('\n');
}

/**
 * Build Achievement progress.
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
            achievements.unlocked || 0
        );

    const total =
        Number(
            achievements.total || 0
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

    const recent =
        Array.isArray(
            achievements.recent
        )
            ? achievements.recent
            : [];

    const latestAchievement =
        recent[0] ||
        null;

    return [
        `🏆 **Unlocked:** \`${formatNumber(unlocked)} / ${formatNumber(total)}\``,
        `\`${createProgressBar(percentage, 12)}\` **${percentage}%**`,
        latestAchievement
            ? `📖 **Latest:** ${latestAchievement.icon || '🏆'} ${latestAchievement.name || 'Unknown Chronicle'}`
            : '📖 **Latest:** No Achievement recorded'
    ].join('\n');
}

/**
 * Calculate compact profile completion.
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
        ) >
        0,

        Number(
            levelRecord.xp || 0
        ) >
        0,

        unlockedTitles.length >
        1,

        Boolean(
            currentRankRecord
        ),

        Number(
            soulRecord?.achievements?.unlocked ||
            0
        ) >
        0,

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
 * Build the profile navigation links.
 *
 * Discord buttons cannot directly execute
 * slash commands, so the profile displays
 * the recommended command paths instead.
 *
 * @returns {string}
 */
function buildArchiveNavigation() {
    return [
        '`/soul` — complete interactive Soul Record',
        '`/titles` — Chronicle Title collection',
        '`/rankhistory` — Arrancar career archive',
        '`/espada` — current Espada throne system'
    ].join('\n');
}

module.exports = {
    category:
        'information',

    data:
        new SlashCommandBuilder()
            .setName(
                'profile'
            )
            .setDescription(
                'Open a compact Las Noches Soul profile.'
            )

            .addUserOption(option =>
                option
                    .setName(
                        'user'
                    )
                    .setDescription(
                        'Select the Soul whose profile you want to view'
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
            ] =
                await Promise.all([
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

            const avatarURL =
                fullUser.displayAvatarURL({
                    extension:
                        'png',

                    size:
                        4096,

                    forceStatic:
                        false
                });

            const bannerURL =
                fullUser.bannerURL({
                    extension:
                        'png',

                    size:
                        4096,

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

            const profileEmbed =
                createEmbed({
                    title:
                        `🌙 ${fullUser.username}'s Soul Profile`,

                    description:
                        [
                            `Umbra has opened the compact Las Noches profile of ${fullUser}.`,
                            '',
                            embedConfig
                                .branding
                                .divider,
                            '',
                            '*This profile summarizes the Soul’s identity, progression, Chronicle status and hierarchy standing.*'
                        ].join('\n'),

                    color:
                        embedConfig.colors.accent,

                    thumbnail:
                        avatarURL,

                    image:
                        bannerURL ||
                        avatarURL,

                    author: {
                        name:
                            `${member.displayName} • Las Noches Profile`,

                        iconURL:
                            avatarURL
                    },

                    footer: {
                        text:
                            `🌙 Umbra • Guardian of Las Noches • Opened by ${interaction.user.username}`,

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
                                '👤 Soul Identity',

                            value:
                                [
                                    `**Username:** ${fullUser.username}`,
                                    `**Display Name:** ${member.displayName}`,
                                    `**Account Type:** ${getAccountType(fullUser)}`,
                                    `**Soul ID:** \`${fullUser.id}\``
                                ].join('\n'),

                            inline:
                                false
                        },
                        {
                            name:
                                '⭐ Soul Progression',

                            value:
                                buildProgressionDisplay(
                                    levelRecord,
                                    serverRank
                                ),

                            inline:
                                false
                        },
                        {
                            name:
                                '🏷️ Chronicle Status',

                            value:
                                buildChronicleDisplay(
                                    soulRecord,
                                    unlockedTitles
                                ),

                            inline:
                                true
                        },
                        {
                            name:
                                '⚔️ Arrancar Hierarchy',

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
                                false
                        },
                        {
                            name:
                                '🎖️ Las Noches Standing',

                            value:
                                [
                                    `**Standing:** ${getLasNochesStanding(member, interaction.guild)}`,
                                    `**Progression Role:** ${progressionRole}`,
                                    `**Highest Role:** ${getHighestRole(member)}`,
                                    `**Total Roles:** \`${getRoleCount(member)}\``
                                ].join('\n'),

                            inline:
                                false
                        },
                        {
                            name:
                                '🛡️ Guardian Status',

                            value:
                                [
                                    `**Warnings:** ${formatWarningCount(warningCount)}`,
                                    `**Timeout:** ${getTimeoutStatus(member)}`
                                ].join('\n'),

                            inline:
                                true
                        },
                        {
                            name:
                                '📈 Profile Completion',

                            value:
                                [
                                    `\`${createProgressBar(completion.percentage, 14)}\` **${completion.percentage}%**`,
                                    `-# ${completion.completed} of ${completion.total} profile milestones completed.`
                                ].join('\n'),

                            inline:
                                true
                        },
                        {
                            name:
                                '📅 Soul History',

                            value:
                                [
                                    `**Discord Account Created:** ${formatDiscordDate(fullUser.createdAt, 'F')}`,
                                    `**Account Age:** \`${formatNumber(calculateDaysSince(fullUser.createdAt))} days\``,
                                    '',
                                    `**Entered Las Noches:** ${formatDiscordDate(member.joinedAt, 'F')}`,
                                    `**Time in Las Noches:** \`${formatNumber(calculateDaysSince(member.joinedAt))} days\``
                                ].join('\n'),

                            inline:
                                false
                        },
                        {
                            name:
                                '🧭 Connected Archives',

                            value:
                                buildArchiveNavigation(),

                            inline:
                                false
                        }
                    ]
                });            const buttons =
                new ActionRowBuilder()
                    .addComponents(
                        new ButtonBuilder()
                            .setLabel(
                                'Open Avatar'
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
                buttons.addComponents(
                    new ButtonBuilder()
                        .setLabel(
                            'Open Banner'
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

            await interaction.editReply({
                embeds: [
                    profileEmbed
                ],

                components: [
                    buttons
                ]
            });
        } catch (error) {
            console.error(
                '❌ Umbra /profile command error:',
                error
            );

            const errorEmbed =
                createErrorEmbed(
                    '❌ Soul Profile Unavailable',
                    [
                        'Umbra could not open the requested Soul profile.',
                        '',
                        'Please verify that the selected Soul is still inside Las Noches and inspect the Northflank logs if the problem continues.'
                    ].join('\n')
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