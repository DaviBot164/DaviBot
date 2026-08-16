const {
    SlashCommandBuilder,
    MessageFlags,
    ActionRowBuilder,
    StringSelectMenuBuilder,
    StringSelectMenuOptionBuilder,
    ComponentType
} = require('discord.js');

const {
    createErrorEmbed
} = require('../../utils/embeds');

const embedConfig =
    require('../../config/embed');

const rankConfig =
    require('../../config/ranks');

const {
    souls:
        soulDatabase,

    ranks:
        rankDatabase,

    titles:
        titleDatabase
} = require('../../database');

const SOUL_MENU_ID =
    'soul_record_page_menu';

const SOUL_PAGES = {
    overview:
        'soul_overview',

    progression:
        'soul_progression',

    hierarchy:
        'soul_hierarchy',

    chronicles:
        'soul_chronicles',

    activity:
        'soul_activity',

    statistics:
        'soul_statistics'
};

const SOUL_PAGE_ORDER = [
    SOUL_PAGES.overview,
    SOUL_PAGES.progression,
    SOUL_PAGES.hierarchy,
    SOUL_PAGES.chronicles,
    SOUL_PAGES.activity,
    SOUL_PAGES.statistics
];

const SOUL_PAGE_DETAILS = {
    [SOUL_PAGES.overview]: {
        emoji:
            '📖',

        label:
            'Overview',

        description:
            'Identity, rank and server standing'
    },

    [SOUL_PAGES.progression]: {
        emoji:
            '⭐',

        label:
            'Progression',

        description:
            'Level, XP and evolution'
    },

    [SOUL_PAGES.hierarchy]: {
        emoji:
            '⚔️',

        label:
            'Sin Rank',

        description:
            'Current rank and rank history'
    },

    [SOUL_PAGES.chronicles]: {
        emoji:
            '🏆',

        label:
            'Chronicles',

        description:
            'Achievements and Chronicle Titles'
    },

    [SOUL_PAGES.activity]: {
        emoji:
            '📊',

        label:
            'Activity',

        description:
            'Community and progression activity'
    },

    [SOUL_PAGES.statistics]: {
        emoji:
            '⚙️',

        label:
            'Statistics',

        description:
            'Account and server record statistics'
    }
};

const HOLLOW_EVOLUTION_ROLES = [
    '👑 Vasto Lorde',
    '🐺 Adjuchas',
    '⚪ Gillian',
    '🦴 Menos Grande',
    '👁️ Hollow'
];

const SIN_RANK_ROLES =
    Object.values(
        rankConfig.hierarchy
    );

function formatNumber(
    value
) {
    const number =
        Number(value);

    return Number.isFinite(number)
        ? number.toLocaleString(
            'en-US'
        )
        : '0';
}

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
            : new Date(value);

    if (
        Number.isNaN(
            date.getTime()
        )
    ) {
        return 'Unknown';
    }

    return `<t:${Math.floor(
        date.getTime() / 1000
    )}:${style}>`;
}

function calculateDaysSince(
    value
) {
    if (!value) {
        return 0;
    }

    const date =
        value instanceof Date
            ? value
            : new Date(value);

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

function createProgressBar(
    percentage,
    length = 14
) {
    const safePercentage =
        Math.min(
            100,
            Math.max(
                0,
                Number(percentage) || 0
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
            length - filled
        )
    );
}

function findMemberRole(
    member,
    roles
) {
    return (
        roles
            .map(
                role =>
                    member.roles.cache.find(
                        memberRole =>
                            memberRole.name ===
                            role.name
                    )
            )
            .find(Boolean) ||
        null
    );
}

function getHollowEvolution(
    member
) {
    return (
        findMemberRole(
            member,
            HOLLOW_EVOLUTION_ROLES.map(
                name => ({
                    name
                })
            )
        )?.name ||
        HOLLOW_EVOLUTION_ROLES.at(-1)
    );
}

function getSinRank(
    member
) {
    return (
        findMemberRole(
            member,
            Object.values(
                SIN_RANK_ROLES
            )
        )?.name ||
        rankConfig.hierarchy.unranked.name
    );
}/**
 * Get the member's THE Ⅹ SINS standing.
 *
 * @param {import('discord.js').GuildMember} member
 * @param {import('discord.js').Guild} guild
 * @returns {string}
 */
function getServerStanding(
    member,
    guild
) {
    if (
        member.id ===
        guild.ownerId
    ) {
        return '👑 Ruler of THE Ⅹ SINS';
    }

    const staffRoles = [
        '⚜️ Head Captain',
        '🛡️ Captain',
        '⚔️ Lieutenant'
    ];

    const staffRole =
        findMemberRole(
            member,
            staffRoles
        );

    if (staffRole) {
        return staffRole.name;
    }

    if (
        member.permissions.has(
            require('discord.js')
                .PermissionFlagsBits
                .Administrator
        )
    ) {
        return '🛡️ Captain';
    }

    if (
        member.permissions.has(
            require('discord.js')
                .PermissionFlagsBits
                .ModerateMembers
        ) ||
        member.permissions.has(
            require('discord.js')
                .PermissionFlagsBits
                .KickMembers
        ) ||
        member.permissions.has(
            require('discord.js')
                .PermissionFlagsBits
                .BanMembers
        )
    ) {
        return '⚔️ Lieutenant';
    }

    if (
        member.user.bot
    ) {
        return '🌑 Guardian of THE Ⅹ SINS';
    }

    return '🌙 Resident of THE Ⅹ SINS';
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

    return member.roles.highest.toString();
}

/**
 * Create the Soul Record menu.
 *
 * @param {string} selectedPage
 * @param {boolean} disabled
 * @returns {ActionRowBuilder}
 */
function createSoulMenu(
    selectedPage,
    disabled = false
) {
    const menu =
        new StringSelectMenuBuilder()
            .setCustomId(
                SOUL_MENU_ID
            )
            .setPlaceholder(
                'Select a Soul Record section'
            )
            .setMinValues(
                1
            )
            .setMaxValues(
                1
            )
            .setDisabled(
                disabled
            );

    for (
        const pageId
        of SOUL_PAGE_ORDER
    ) {
        const page =
            SOUL_PAGE_DETAILS[
                pageId
            ];

        menu.addOptions(
            new StringSelectMenuOptionBuilder()
                .setLabel(
                    page.label
                )
                .setDescription(
                    page.description
                )
                .setEmoji(
                    page.emoji
                )
                .setValue(
                    pageId
                )
                .setDefault(
                    selectedPage ===
                    pageId
                )
        );
    }

    return new ActionRowBuilder()
        .addComponents(
            menu
        );
}

/**
 * Safely load Sin Rank history.
 *
 * @param {string} guildId
 * @param {string} userId
 * @returns {Promise<Object[]>}
 */
async function getSafeRankHistory(
    guildId,
    userId
) {
    try {
        const history =
            await rankDatabase
                .getRankHistory(
                    guildId,
                    userId,
                    5
                );

        return Array.isArray(
            history
        )
            ? history
            : [];
    } catch (error) {
        console.warn(
            `⚠️ Soul Rank history unavailable for ${userId}: ${error.message}`
        );

        return [];
    }
}

/**
 * Safely load unlocked Chronicle Titles.
 *
 * @param {string} guildId
 * @param {string} userId
 * @returns {Promise<Object[]>}
 */
async function getSafeSoulTitles(
    guildId,
    userId
) {
    try {
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
            `⚠️ Soul Titles unavailable for ${userId}: ${error.message}`
        );

        return [];
    }
}

/**
 * Format one Achievement.
 *
 * @param {Object} achievement
 * @returns {string}
 */
function formatAchievement(
    achievement
) {
    const icon =
        achievement?.icon ||
        '🏆';

    const name =
        achievement?.name ||
        'Unknown Chronicle';

    const description =
        achievement?.description ||
        'No Chronicle description is available.';

    const unlockedAt =
        achievement?.unlockedAt ||
        achievement?.unlocked_at ||
        null;

    return [
        `${icon} **${name}**`,
        `-# ${description}`,
        `-# Unlocked ${formatDiscordDate(
            unlockedAt,
            'R'
        )}`
    ].join('\n');
}

/**
 * Format one unlocked Chronicle Title.
 *
 * @param {Object} title
 * @returns {string}
 */
function formatSoulTitle(
    title
) {
    const activeMarker =
        title?.isActive
            ? '👑'
            : '🏷️';

    const displayName =
        title?.displayName ||
        title?.name ||
        'Unknown Chronicle Title';

    const rarity =
        title?.rarity ||
        'Unknown';

    const category =
        title?.category ||
        'Unknown';

    return [
        `${activeMarker} **${displayName}**`,
        `-# ${rarity} • ${category}`,
        `-# Unlocked ${formatDiscordDate(
            title?.unlockedAt,
            'R'
        )}`
    ].join('\n');
}

/**
 * Format one Sin Rank history record.
 *
 * @param {Object} record
 * @returns {string}
 */
function formatRankHistoryRecord(
    record
) {
    const action =
        record?.action ||
        record?.change_type ||
        record?.history_type ||
        'UPDATED';

    const previousRank =
        record?.old_rank ||
        record?.previous_rank ||
        record?.oldRank ||
        null;

    const newRank =
        record?.new_rank ||
        record?.rank_name ||
        record?.newRank ||
        null;

    const reason =
        record?.reason ||
        'No reason was recorded.';

    const createdAt =
        record?.created_at ||
        record?.createdAt ||
        null;

    let rankChange;

    if (
        previousRank &&
        newRank
    ) {
        rankChange =
            `${previousRank} → ${newRank}`;
    } else if (
        newRank
    ) {
        rankChange =
            newRank;
    } else if (
        previousRank
    ) {
        rankChange =
            `${previousRank} → No Rank`;
    } else {
        rankChange =
            'Rank record unavailable';
    }

    return [
        `⚔️ **${action}** • ${rankChange}`,
        `-# ${reason}`,
        `-# Recorded ${formatDiscordDate(
            createdAt,
            'R'
        )}`
    ].join('\n');
}/**
 * Calculate Soul Record completion.
 *
 * @param {Object} options
 * @param {Object} options.soulRecord
 * @param {Object[]} options.titles
 * @param {Object[]} options.rankHistory
 * @returns {{
 *     percentage: number,
 *     completed: number,
 *     total: number,
 *     checks: Array<{
 *         label: string,
 *         complete: boolean
 *     }>
 * }}
 */
function calculateSoulCompletion({
    soulRecord,
    titles,
    rankHistory
}) {
    const progression =
        soulRecord?.progression ||
        {};

    const achievements =
        soulRecord?.achievements ||
        {};

    const activity =
        soulRecord?.activity ||
        {};

    const checks = [
        {
            label:
                'Soul Record created',

            complete:
                Boolean(
                    progression.recordCreatedAt ||
                    progression.level >= 0
                )
        },

        {
            label:
                'Active Chronicle Title',

            complete:
                Boolean(
                    soulRecord?.title?.id
                )
        },

        {
            label:
                'Spiritual progression started',

            complete:
                Number(
                    progression.xp ||
                    0
                ) > 0
        },

        {
            label:
                'Achievement recorded',

            complete:
                Number(
                    achievements.unlocked ||
                    0
                ) > 0
        },

        {
            label:
                'Additional Title unlocked',

            complete:
                Array.isArray(
                    titles
                ) &&
                titles.length > 1
        },

        {
            label:
                'Sin Rank recorded',

            complete:
                Array.isArray(
                    rankHistory
                ) &&
                rankHistory.length > 0
        },

        {
            label:
                'Community activity recorded',

            complete:
                Number(
                    activity.messages ||
                    0
                ) > 0 ||
                Number(
                    activity.voiceMinutes ||
                    0
                ) > 0
        }
    ];

    const completed =
        checks.filter(
            check =>
                check.complete
        ).length;

    const total =
        checks.length;

    return {
        percentage:
            total > 0
                ? Math.round(
                    (
                        completed /
                        total
                    ) *
                    100
                )
                : 0,

        completed,
        total,
        checks
    };
}

/**
 * Build a compact completion summary.
 *
 * @param {Object} completion
 * @returns {string}
 */
function formatCompletionSummary(
    completion
) {
    return [
        `\`${createProgressBar(
            completion.percentage
        )}\``,
        `**${completion.percentage}% complete**`,
        `${completion.completed}/${completion.total} records`
    ].join('\n');
}

/**
 * Format one safe value.
 *
 * @param {unknown} value
 * @param {string} fallback
 * @returns {string}
 */
function safeValue(
    value,
    fallback = 'Unknown'
) {
    if (
        value === null ||
        value === undefined ||
        value === ''
    ) {
        return fallback;
    }

    return String(value);
}

/**
 * Get the member's active Chronicle Title.
 *
 * @param {Object} soulRecord
 * @returns {string}
 */
function getActiveTitle(
    soulRecord
) {
    return (
        soulRecord?.title?.displayName ||
        soulRecord?.title?.name ||
        'No active Chronicle Title'
    );
}

/**
 * Build the Soul Record overview.
 *
 * @param {Object} options
 * @returns {import('discord.js').EmbedBuilder}
 */
function buildOverviewPage({
    interaction,
    member,
    soulRecord,
    titles,
    rankHistory
}) {
    const user =
        member.user;

    const progression =
        soulRecord?.progression ||
        {};

    const level =
        Number(
            progression.level ||
            0
        );

    const xp =
        Number(
            progression.xp ||
            0
        );

    const rank =
        getSinRank(
            member
        );

    const evolution =
        getHollowEvolution(
            member
        );

    const standing =
        getServerStanding(
            member,
            interaction.guild
        );

    const completion =
        calculateSoulCompletion({
            soulRecord,
            titles,
            rankHistory
        });

    const embed =
        createEmbed({
            title:
                `📖 ${member.displayName}'s Soul Record`,

            description:
                `A compact record of progression within **THE Ⅹ SINS**.`,

            color:
                embedConfig.colors.accent,

            thumbnail:
                user.displayAvatarURL({
                    size:
                        256,

                    forceStatic:
                        false
                }),

            footer:
                'Evelynn • THE Ⅹ SINS • Soul Record',

            timestamp:
                true
        });

    embed.addFields(
        {
            name:
                '🜏 Identity',

            value:
                [
                    `**User:** ${user}`,
                    `**Standing:** ${standing}`,
                    `**Joined:** ${formatDiscordDate(
                        member.joinedAt
                    )}`
                ].join('\n'),

            inline:
                false
        },

        {
            name:
                '⚔️ Position',

            value:
                [
                    `**Sin Rank:** ${rank}`,
                    `**Evolution:** ${evolution}`,
                    `**Highest Role:** ${getHighestRole(
                        member
                    )}`
                ].join('\n'),

            inline:
                false
        },

        {
            name:
                '⭐ Progression',

            value:
                [
                    `**Level:** \`${formatNumber(
                        level
                    )}\``,
                    `**Spiritual Power:** \`${formatNumber(
                        xp
                    )} XP\``,
                    `**Active Title:** ${getActiveTitle(
                        soulRecord
                    )}`
                ].join('\n'),

            inline:
                false
        },

        {
            name:
                '📜 Record Completion',

            value:
                formatCompletionSummary(
                    completion
                ),

            inline:
                false
        }
    );

    return embed;
}/**
 * Build the progression page.
 *
 * @param {Object} options
 * @returns {import('discord.js').EmbedBuilder}
 */
function buildProgressionPage({
    soulRecord
}) {
    const progression =
        soulRecord?.progression ||
        {};

    const level =
        Number(
            progression.level ||
            0
        );

    const xp =
        Number(
            progression.xp ||
            0
        );

    const nextLevelXp =
        Number(
            progression.nextLevelXp ||
            progression.requiredXp ||
            0
        );

    const percentage =
        nextLevelXp > 0
            ? Math.min(
                100,
                (
                    xp /
                    nextLevelXp
                ) *
                100
            )
            : 0;

    const embed =
        createEmbed({
            title:
                '⭐ Soul Progression',

            description:
                'Current level, Spiritual Power and evolution.',

            color:
                embedConfig.colors.primary
        });

    embed.addFields(
        {
            name:
                'Level',

            value:
                `\`${formatNumber(level)}\``,

            inline:
                true
        },

        {
            name:
                'Spiritual Power',

            value:
                `\`${formatNumber(xp)} XP\``,

            inline:
                true
        },

        {
            name:
                'Evolution',

            value:
                soulRecord?.evolution ||
                'Unknown',

            inline:
                true
        }
    );

    if (
        nextLevelXp > 0
    ) {
        embed.addFields({
            name:
                'Next Level',

            value:
                [
                    `\`${createProgressBar(
                        percentage
                    )}\``,
                    `**${Math.round(
                        percentage
                    )}%** • ${formatNumber(
                        nextLevelXp
                    )} XP required`
                ].join('\n'),

            inline:
                false
        });
    }

    return embed;
}

/**
 * Build the Sin Rank page.
 *
 * @param {Object} options
 * @returns {import('discord.js').EmbedBuilder}
 */
function buildHierarchyPage({
    member,
    rankHistory
}) {
    const rank =
        getSinRank(
            member
        );

    const evolution =
        getHollowEvolution(
            member
        );

    const embed =
        createEmbed({
            title:
                '⚔️ Sin Rank Record',

            description:
                'Current Sin Rank and recent rank history.',

            color:
                embedConfig.colors.accent
        });

    embed.addFields({
        name:
            'Current Position',

        value:
            [
                `**Sin Rank:** ${rank}`,
                `**Evolution:** ${evolution}`
            ].join('\n'),

        inline:
            false
    });

    const history =
        Array.isArray(
            rankHistory
        )
            ? rankHistory.slice(
                0,
                5
            )
            : [];

    embed.addFields({
        name:
            '📜 Rank History',

        value:
            history.length > 0
                ? history
                    .map(
                        formatRankHistoryRecord
                    )
                    .join('\n\n')
                : 'No Sin Rank history has been recorded yet.',

        inline:
            false
    });

    return embed;
}

/**
 * Build the Chronicles page.
 *
 * @param {Object} options
 * @returns {import('discord.js').EmbedBuilder}
 */
function buildChroniclesPage({
    soulRecord,
    titles
}) {
    const achievements =
        Array.isArray(
            soulRecord?.achievements?.recent
        )
            ? soulRecord.achievements.recent
            : [];

    const unlockedTitles =
        Array.isArray(
            titles
        )
            ? titles.slice(
                0,
                5
            )
            : [];

    const embed =
        createEmbed({
            title:
                '🏆 Chronicles',

            description:
                'Achievements and Chronicle Titles.',

            color:
                embedConfig.colors.primary
        });

    embed.addFields({
        name:
            '🏆 Recent Achievements',

        value:
            achievements.length > 0
                ? achievements
                    .map(
                        formatAchievement
                    )
                    .join('\n\n')
                : 'No achievements have been recorded yet.',

        inline:
            false
    });

    embed.addFields({
        name:
            '🏷️ Chronicle Titles',

        value:
            unlockedTitles.length > 0
                ? unlockedTitles
                    .map(
                        formatSoulTitle
                    )
                    .join('\n\n')
                : 'No Chronicle Titles have been unlocked yet.',

        inline:
            false
    });

    return embed;
}

/**
 * Build the Activity page.
 *
 * @param {Object} options
 * @returns {import('discord.js').EmbedBuilder}
 */
function buildActivityPage({
    soulRecord
}) {
    const activity =
        soulRecord?.activity ||
        {};

    const messages =
        Number(
            activity.messages ||
            0
        );

    const voiceMinutes =
        Number(
            activity.voiceMinutes ||
            0
        );

    const events =
        Number(
            activity.events ||
            0
        );

    const tickets =
        Number(
            activity.tickets ||
            0
        );

    const embed =
        createEmbed({
            title:
                '📊 Soul Activity',

            description:
                'Community activity recorded by THE Ⅹ SINS.',

            color:
                embedConfig.colors.primary
        });

    embed.addFields(
        {
            name:
                '💬 Messages',

            value:
                `\`${formatNumber(
                    messages
                )}\``,

            inline:
                true
        },

        {
            name:
                '🎙️ Voice',

            value:
                `\`${formatNumber(
                    voiceMinutes
                )} min\``,

            inline:
                true
        },

        {
            name:
                '🎉 Events',

            value:
                `\`${formatNumber(
                    events
                )}\``,

            inline:
                true
        },

        {
            name:
                '🎫 Tickets',

            value:
                `\`${formatNumber(
                    tickets
                )}\``,

            inline:
                true
        }
    );

    return embed;
}

/**
 * Build the Statistics page.
 *
 * @param {Object} options
 * @returns {import('discord.js').EmbedBuilder}
 */
function buildStatisticsPage({
    member,
    soulRecord
}) {
    const accountCreated =
        member.user.createdAt;

    const joinedAt =
        member.joinedAt;

    const daysInServer =
        calculateDaysSince(
            joinedAt
        );

    const embed =
        createEmbed({
            title:
                '⚙️ Soul Statistics',

            description:
                'Account and server record statistics.',

            color:
                embedConfig.colors.accent
        });

    embed.addFields(
        {
            name:
                '👤 Account',

            value:
                [
                    `**Created:** ${formatDiscordDate(
                        accountCreated
                    )}`,
                    `**ID:** \`${member.id}\``
                ].join('\n'),

            inline:
                false
        },

        {
            name:
                '🌙 Server',

            value:
                [
                    `**Joined:** ${formatDiscordDate(
                        joinedAt
                    )}`,
                    `**Days in server:** \`${formatNumber(
                        daysInServer
                    )}\``,
                    `**Highest Role:** ${getHighestRole(
                        member
                    )}`
                ].join('\n'),

            inline:
                false
        },

        {
            name:
                '📖 Record',

            value:
                [
                    `**Record Created:** ${
                        soulRecord?.progression?.recordCreatedAt
                            ? formatDiscordDate(
                                soulRecord.progression.recordCreatedAt
                            )
                            : 'Unknown'
                    }`,
                    `**Current Title:** ${getActiveTitle(
                        soulRecord
                    )}`
                ].join('\n'),

            inline:
                false
        }
    );

    return embed;
}/**
 * Load the complete Soul Record context.
 *
 * @param {import('discord.js').GuildMember} member
 * @returns {Promise<Object>}
 */
async function loadSoulContext(
    member
) {
    const guildId =
        member.guild.id;

    const userId =
        member.id;

    const soulRecord =
        await soulDatabase
            .ensureSoulRecord(
                guildId,
                userId
            );

    const rankHistory =
        await getSafeRankHistory(
            guildId,
            userId
        );

    const titles =
        await getSafeSoulTitles(
            guildId,
            userId
        );

    return {
        soulRecord,
        rankHistory,
        titles
    };
}

/**
 * Build the selected Soul Record page.
 *
 * @param {string} pageId
 * @param {Object} context
 * @returns {import('discord.js').EmbedBuilder}
 */
function buildSoulPage(
    pageId,
    context
) {
    switch (pageId) {
        case SOUL_PAGES.progression:
            return buildProgressionPage(
                context
            );

        case SOUL_PAGES.hierarchy:
            return buildHierarchyPage(
                context
            );

        case SOUL_PAGES.chronicles:
            return buildChroniclesPage(
                context
            );

        case SOUL_PAGES.activity:
            return buildActivityPage(
                context
            );

        case SOUL_PAGES.statistics:
            return buildStatisticsPage(
                context
            );

        case SOUL_PAGES.overview:
        default:
            return buildOverviewPage(
                context
            );
    }
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
                'View a Soul Record.'
            )
            .setDMPermission(
                false
            ),

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
                            'Soul Record Unavailable',
                            'This command can only be used inside THE Ⅹ SINS.'
                        )
                    ],

                    flags:
                        MessageFlags.Ephemeral
                });

                return;
            }

            const member =
                interaction.member;

            const context =
                await loadSoulContext(
                    member
                );

            let selectedPage =
                SOUL_PAGES.overview;

            const renderPage =
                async (
                    pageId,
                    update = false
                ) => {
                    const embed =
                        buildSoulPage(
                            pageId,
                            {
                                ...context,

                                interaction,
                                member
                            }
                        );

                    const payload = {
                        embeds: [
                            embed
                        ],

                        components: [
                            createSoulMenu(
                                pageId
                            )
                        ]
                    };

                    if (update) {
                        await interaction
                            .editReply(
                                payload
                            );

                        return;
                    }

                    await interaction.reply(
                        payload
                    );
                };

            await renderPage(
                selectedPage
            );

            const message =
                await interaction.fetchReply();

            const collector =
                message.createMessageComponentCollector({
                    componentType:
                        ComponentType.StringSelect,

                    time:
                        300_000
                });

            collector.on(
                'collect',
                async component => {
                    if (
                        component.user.id !==
                        interaction.user.id
                    ) {
                        await component.reply({
                            embeds: [
                                createErrorEmbed(
                                    'Private Soul Record',
                                    'Only the Soul who opened this record may control its navigation.'
                                )
                            ],

                            flags:
                                MessageFlags.Ephemeral
                        });

                        return;
                    }

                    const pageId =
                        component.values?.[0];

                    if (
                        !SOUL_PAGE_ORDER.includes(
                            pageId
                        )
                    ) {
                        await component.reply({
                            embeds: [
                                createErrorEmbed(
                                    'Invalid Soul Record Page',
                                    'Evelynn could not recognize that Soul Record section.'
                                )
                            ],

                            flags:
                                MessageFlags.Ephemeral
                        });

                        return;
                    }

                    selectedPage =
                        pageId;

                    await component.deferUpdate();

                    const embed =
                        buildSoulPage(
                            selectedPage,
                            {
                                ...context,

                                interaction,
                                member
                            }
                        );

                    await interaction.editReply({
                        embeds: [
                            embed
                        ],

                        components: [
                            createSoulMenu(
                                selectedPage
                            )
                        ]
                    });
                }
            );

            collector.on(
                'end',
                async () => {
                    await interaction
                        .editReply({
                            components: [
                                createSoulMenu(
                                    selectedPage,
                                    true
                                )
                            ]
                        })
                        .catch(
                            () => null
                        );
                }
            );
        } catch (error) {
            console.error(
                '❌ Evelynn /soul command error:',
                error
            );

            const errorMessage = {
                embeds: [
                    createErrorEmbed(
                        'Soul Record Unavailable',
                        'Evelynn could not open this Soul Record.'
                    )
                ],

                flags:
                    MessageFlags.Ephemeral
            };

            if (
                interaction.deferred
            ) {
                await interaction
                    .editReply(
                        errorMessage
                    )
                    .catch(
                        () => null
                    );

                return;
            }

            if (
                interaction.replied
            ) {
                await interaction
                    .followUp(
                        errorMessage
                    )
                    .catch(
                        () => null
                    );

                return;
            }

            await interaction
                .reply(
                    errorMessage
                )
                .catch(
                    () => null
                );
        }
    }
};