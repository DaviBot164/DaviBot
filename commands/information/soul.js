const {
    SlashCommandBuilder,
    PermissionFlagsBits,
    MessageFlags,
    ActionRowBuilder,
    StringSelectMenuBuilder,
    StringSelectMenuOptionBuilder,
    ComponentType
} = require('discord.js');

const {
    createEmbed,
    createErrorEmbed
} = require('../../utils/embeds');

const embedConfig =
    require('../../config/embed');

const {
    souls:
        soulDatabase,

    ranks:
        rankDatabase,

    titles:
        titleDatabase
} = require('../../database');

/**
 * Soul Record navigation menu ID.
 */
const SOUL_MENU_ID =
    'soul_record_page_menu';

/**
 * Soul Record page identifiers.
 */
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

/**
 * Soul Record page order.
 */
const SOUL_PAGE_ORDER = [
    SOUL_PAGES.overview,
    SOUL_PAGES.progression,
    SOUL_PAGES.hierarchy,
    SOUL_PAGES.chronicles,
    SOUL_PAGES.activity,
    SOUL_PAGES.statistics
];

/**
 * Soul Record page details.
 */
const SOUL_PAGE_DETAILS = {
    [SOUL_PAGES.overview]: {
        emoji:
            '📖',

        label:
            'Overview',

        description:
            'Identity, Title, Rank and standing'
    },

    [SOUL_PAGES.progression]: {
        emoji:
            '⭐',

        label:
            'Progression',

        description:
            'Level, XP, ranking and evolution'
    },

    [SOUL_PAGES.hierarchy]: {
        emoji:
            '⚔️',

        label:
            'Arrancar Hierarchy',

        description:
            'Current Rank and promotion history'
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
            'Messages, events, tickets and voice'
    },

    [SOUL_PAGES.statistics]: {
        emoji:
            '⚙️',

        label:
            'Statistics',

        description:
            'Account, server and record statistics'
    }
};

/**
 * Hollow Evolution roles ordered
 * from strongest to weakest.
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
 * Manual Arrancar Ranks ordered
 * from strongest to weakest.
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
            1000
        );

    return `<t:${unixTimestamp}:${style}>`;
}

/**
 * Calculate the number of complete days
 * between one date and the current time.
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

    const difference =
        Date.now() -
        date.getTime();

    return Math.max(
        0,
        Math.floor(
            difference /
            86_400_000
        )
    );
}

/**
 * Create a visual progress bar.
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
 * Get the current Hollow Evolution.
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

    return (
        evolutionRole?.name ||
        '👁️ Hollow'
    );
}

/**
 * Get the current Discord Arrancar Rank.
 *
 * @param {import('discord.js').GuildMember} member
 * @returns {string}
 */
function getDiscordArrancarRank(
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
 * Get the member's Las Noches standing.
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

    if (
        member.user.bot
    ) {
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

    return member.roles.highest.toString();
}

/**
 * Create the Soul Record navigation menu.
 *
 * @param {string} selectedPage
 * @param {boolean} disabled
 * @returns {ActionRowBuilder<StringSelectMenuBuilder>}
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
        const details =
            SOUL_PAGE_DETAILS[
                pageId
            ];

        menu.addOptions(
            new StringSelectMenuOptionBuilder()
                .setLabel(
                    details.label
                )
                .setDescription(
                    details.description
                )
                .setEmoji(
                    details.emoji
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
 * Safely load Arrancar Rank history.
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
 * Safely load every unlocked Title.
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
}/**
 * Format one recent Achievement.
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
        `-# Unlocked ${formatDiscordDate(unlockedAt, 'R')}`
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
        `-# Unlocked ${formatDiscordDate(title?.unlockedAt, 'R')}`
    ].join('\n');
}

/**
 * Format one Rank history entry.
 *
 * Different Rank database versions may
 * return slightly different property names,
 * so this formatter accepts safe fallbacks.
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

    let rankChangeDisplay;

    if (
        previousRank &&
        newRank
    ) {
        rankChangeDisplay =
            `${previousRank} → ${newRank}`;
    } else if (newRank) {
        rankChangeDisplay =
            newRank;
    } else if (previousRank) {
        rankChangeDisplay =
            `${previousRank} → No Rank`;
    } else {
        rankChangeDisplay =
            'Rank record unavailable';
    }

    return [
        `⚔️ **${action}** • ${rankChangeDisplay}`,
        `-# ${reason}`,
        `-# Recorded ${formatDiscordDate(createdAt, 'R')}`
    ].join('\n');
}

/**
 * Calculate Soul Record completion.
 *
 * This is a presentation score based on
 * currently available Umbra systems.
 *
 * @param {Object} options
 * @param {Object} options.soulRecord
 * @param {Object[]} options.titles
 * @param {Object[]} options.rankHistory
 * @param {import('discord.js').GuildMember} options.member
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
    rankHistory,
    member
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
                    progression.xp || 0
                ) >
                0
        },
        {
            label:
                'Achievement recorded',

            complete:
                Number(
                    achievements.unlocked || 0
                ) >
                0
        },
        {
            label:
                'Additional Title unlocked',

            complete:
                Array.isArray(
                    titles
                ) &&
                titles.length >
                1
        },
        {
            label:
                'Arrancar hierarchy record',

            complete:
                (
                    Array.isArray(
                        rankHistory
                    ) &&
                    rankHistory.length >
                    0
                ) ||
                getDiscordArrancarRank(
                    member
                ) !==
                    '⚪ Unranked Arrancar'
        },
        {
            label:
                'Las Noches activity recorded',

            complete:
                Number(
                    progression.messageCount ||
                    activity.messageCount ||
                    0
                ) >
                0
        },
        {
            label:
                'Hollow Evolution advanced',

            complete:
                getHollowEvolution(
                    member
                ) !==
                    '👁️ Hollow'
        }
    ];

    const completed =
        checks.filter(
            check =>
                check.complete
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
        percentage,
        completed,
        total,
        checks
    };
}

/**
 * Create the shared Soul Record Embed.
 *
 * @param {Object} options
 * @param {import('discord.js').ChatInputCommandInteraction} options.interaction
 * @param {import('discord.js').GuildMember} options.member
 * @param {import('discord.js').User} options.fullUser
 * @param {string} options.title
 * @param {string} options.description
 * @param {string} options.color
 * @param {boolean} [options.showBanner]
 * @returns {import('discord.js').EmbedBuilder}
 */
function createSoulEmbed({
    interaction,
    member,
    fullUser,
    title,
    description,
    color =
        embedConfig.colors.archive,
    showBanner = false
}) {
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

    const embed =
        createEmbed({
            title,

            description:
                [
                    description,
                    '',
                    embedConfig
                        .branding
                        .divider,
                    '',
                    '*Every evolution, Rank, Title and Chronicle is preserved within the eternal Soul Archives.*'
                ].join('\n'),

            color,

            thumbnail:
                avatarURL,

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
            }
        });

    embed.setAuthor({
        name:
            `${member.displayName} • Las Noches Soul Archives`,

        iconURL:
            avatarURL
    });

    if (
        showBanner &&
        bannerURL
    ) {
        embed.setImage(
            bannerURL
        );
    }

    return embed;
}

/**
 * Build the Soul Record Overview page.
 *
 * @param {Object} context
 * @returns {import('discord.js').EmbedBuilder}
 */
function buildOverviewPage(
    context
) {
    const {
        interaction,
        member,
        fullUser,
        soulRecord,
        titles,
        rankHistory
    } =
        context;

    const activeTitle =
        soulRecord?.title ||
        titles.find(
            title =>
                title.isActive
        ) ||
        null;

    const activeTitleDisplay =
        activeTitle?.displayName ||
        '🌑 Nameless Soul';

    const evolution =
        getHollowEvolution(
            member
        );

    const rank =
        getDiscordArrancarRank(
            member
        );

    const standing =
        getLasNochesStanding(
            member,
            interaction.guild
        );

    const progression =
        soulRecord?.progression ||
        {};

    const completion =
        calculateSoulCompletion({
            soulRecord,
            titles,
            rankHistory,
            member
        });

    const embed =
        createSoulEmbed({
            interaction,
            member,
            fullUser,

            title:
                `📖 ${fullUser.username}'s Soul Record`,

            description:
                `Umbra has opened the official Soul Record of ${fullUser} from the archives of Las Noches.`,

            color:
                embedConfig.colors.accent,

            showBanner:
                true
        });

    embed.addFields(
        {
            name:
                '🌙 Soul Identity',

            value:
                [
                    `**Soul Name:** ${fullUser.username}`,
                    `**Display Name:** ${member.displayName}`,
                    `**Identification:** \`${fullUser.id}\``,
                    `**Account Type:** ${fullUser.bot ? '🤖 Guardian Construct' : '👤 Recorded Soul'}`
                ].join('\n'),

            inline:
                false
        },
        {
            name:
                '🏷️ Active Chronicle Title',

            value:
                [
                    `**${activeTitleDisplay}**`,
                    activeTitle?.rarity
                        ? `-# ${activeTitle.rarity} • ${activeTitle.category}`
                        : '-# Default Soul designation'
                ].join('\n'),

            inline:
                false
        },
        {
            name:
                '⚔️ Current Hierarchy',

            value:
                [
                    `**Evolution:** ${evolution}`,
                    `**Arrancar Rank:** ${rank}`,
                    `**Standing:** ${standing}`,
                    `**Highest Role:** ${getHighestRole(member)}`
                ].join('\n'),

            inline:
                false
        },
        {
            name:
                '⭐ Spiritual Summary',

            value:
                [
                    `**Soul Level:** \`${formatNumber(progression.level)}\``,
                    `**Spiritual Power:** \`${formatNumber(progression.xp)} XP\``,
                    `**Server Ranking:** \`${progression.serverRank ? `#${progression.serverRank}` : 'Unranked'}\``,
                    `**Messages Recorded:** \`${formatNumber(progression.messageCount)}\``
                ].join('\n'),

            inline:
                true
        },
        {
            name:
                '📚 Archive Summary',

            value:
                [
                    `**Titles Unlocked:** \`${formatNumber(titles.length)}\``,
                    `**Achievements:** \`${formatNumber(soulRecord?.achievements?.unlocked)} / ${formatNumber(soulRecord?.achievements?.total)}\``,
                    `**Rank Records:** \`${formatNumber(rankHistory.length)}\``,
                    `**Warnings:** \`${formatNumber(soulRecord?.guardian?.warningCount)}\``
                ].join('\n'),

            inline:
                true
        },
        {
            name:
                '📈 Soul Record Completion',

            value:
                [
                    `\`${createProgressBar(completion.percentage, 16)}\` **${completion.percentage}%**`,
                    `-# ${completion.completed} of ${completion.total} archive milestones completed.`
                ].join('\n'),

            inline:
                false
        }
    );

    return embed;
}

/**
 * Build the Spiritual Progression page.
 *
 * @param {Object} context
 * @returns {import('discord.js').EmbedBuilder}
 */
function buildProgressionPage(
    context
) {
    const {
        interaction,
        member,
        fullUser,
        soulRecord
    } =
        context;

    const progression =
        soulRecord?.progression ||
        {};

    const progress =
        progression.progress ||
        {};

    const level =
        Number(
            progression.level || 0
        );

    const xp =
        Number(
            progression.xp || 0
        );

    const progressXp =
        Number(
            progress.progressXp || 0
        );

    const requiredXp =
        Number(
            progress.requiredForNextLevel || 0
        );

    const nextLevelXp =
        Number(
            progress.nextLevelXp || 0
        );

    const percentage =
        Number(
            progress.progressPercent || 0
        );

    const remainingXp =
        Math.max(
            0,
            nextLevelXp -
            xp
        );

    const currentEvolution =
        getHollowEvolution(
            member
        );

    const currentEvolutionIndex =
        HOLLOW_EVOLUTION_ROLES.indexOf(
            currentEvolution
        );

    const nextEvolution =
        currentEvolutionIndex >
        0
            ? HOLLOW_EVOLUTION_ROLES[
                currentEvolutionIndex -
                1
            ]
            : null;

    const embed =
        createSoulEmbed({
            interaction,
            member,
            fullUser,

            title:
                '⭐ Spiritual Progression',

            description:
                `${fullUser}'s spiritual growth, Soul Level and Hollow Evolution records.`,

            color:
                embedConfig.colors.archive
        });

    embed.addFields(
        {
            name:
                '⭐ Soul Level',

            value:
                [
                    `**Current Level:** \`${formatNumber(level)}\``,
                    `**Total Spiritual Power:** \`${formatNumber(xp)} XP\``,
                    `**Las Noches Ranking:** \`${progression.serverRank ? `#${progression.serverRank}` : 'Unranked'}\``
                ].join('\n'),

            inline:
                false
        },
        {
            name:
                `✨ Level ${level} → ${level + 1}`,

            value:
                [
                    `\`${createProgressBar(percentage, 18)}\` **${percentage}%**`,
                    '',
                    `**Current Progress:** \`${formatNumber(progressXp)} / ${formatNumber(requiredXp)} XP\``,
                    `**Remaining Power:** \`${formatNumber(remainingXp)} XP\``
                ].join('\n'),

            inline:
                false
        },
        {
            name:
                '👁️ Hollow Evolution',

            value:
                [
                    `**Current Stage:** ${currentEvolution}`,
                    nextEvolution
                        ? `**Next Stage:** ${nextEvolution}`
                        : '**Next Stage:** Final Evolution reached',
                    '',
                    nextEvolution
                        ? '-# Evolution advances through Soul Levels, activity and spiritual growth.'
                        : '-# This Soul has reached the highest configured Hollow Evolution stage.'
                ].join('\n'),

            inline:
                false
        },
        {
            name:
                '📜 Progression Records',

            value:
                [
                    `**Messages Recorded:** \`${formatNumber(progression.messageCount)}\``,
                    `**Last XP Record:** ${formatDiscordDate(progression.lastXpAt, 'R')}`,
                    `**Record Created:** ${formatDiscordDate(progression.recordCreatedAt, 'D')}`,
                    `**Record Updated:** ${formatDiscordDate(progression.recordUpdatedAt, 'R')}`
                ].join('\n'),

            inline:
                false
        }
    );

    return embed;
}

/**
 * Build the Arrancar Hierarchy page.
 *
 * @param {Object} context
 * @returns {import('discord.js').EmbedBuilder}
 */
function buildHierarchyPage(
    context
) {
    const {
        interaction,
        member,
        fullUser,
        rankHistory
    } =
        context;

    const rank =
        getDiscordArrancarRank(
            member
        );

    const evolution =
        getHollowEvolution(
            member
        );

    const standing =
        getLasNochesStanding(
            member,
            interaction.guild
        );

    const embed =
        createSoulEmbed({
            interaction,
            member,
            fullUser,

            title:
                '⚔️ Arrancar Hierarchy Record',

            description:
                `${fullUser}'s official hierarchy, evolution and promotion records.`,

            color:
                embedConfig.colors.rank
        });

    embed.addFields(
        {
            name:
                '👑 Current Position',

            value:
                [
                    `**Arrancar Rank:** ${rank}`,
                    `**Hollow Evolution:** ${evolution}`,
                    `**Las Noches Standing:** ${standing}`,
                    `**Highest Discord Role:** ${getHighestRole(member)}`
                ].join('\n'),

            inline:
                false
        },
        {
            name:
                '📚 Hierarchy Archive',

            value:
                [
                    `**Recent Records Loaded:** \`${formatNumber(rankHistory.length)}\``,
                    '',
                    '-# Rank Titles remain permanently unlocked after they are earned, even when the active Rank changes.'
                ].join('\n'),

            inline:
                false
        }
    );

    if (
        rankHistory.length >
        0
    ) {
        embed.addFields({
            name:
                '📜 Recent Rank History',

            value:
                rankHistory
                    .slice(
                        0,
                        5
                    )
                    .map(
                        formatRankHistoryRecord
                    )
                    .join(
                        '\n\n━━━━━━━━━━━━━━━━━━━━\n\n'
                    ),

            inline:
                false
        });
    } else {
        embed.addFields({
            name:
                '📜 Recent Rank History',

            value:
                [
                    'No manually recorded Rank changes were found for this Soul.',
                    '',
                    '-# High Command promotions and removals will appear here automatically.'
                ].join('\n'),

            inline:
                false
        });
    }

    return embed;
}/**
 * Build the Chronicle Achievements
 * and Titles page.
 *
 * @param {Object} context
 * @returns {import('discord.js').EmbedBuilder}
 */
function buildChroniclesPage(
    context
) {
    const {
        interaction,
        member,
        fullUser,
        soulRecord,
        titles
    } =
        context;

    const achievements =
        soulRecord?.achievements ||
        {};

    const recentAchievements =
        Array.isArray(
            achievements.recent
        )
            ? achievements.recent
            : [];

    const unlockedAchievementCount =
        Number(
            achievements.unlocked || 0
        );

    const totalAchievementCount =
        Number(
            achievements.total || 0
        );

    const achievementPercentage =
        totalAchievementCount > 0
            ? Math.min(
                100,
                Math.round(
                    (
                        unlockedAchievementCount /
                        totalAchievementCount
                    ) *
                    100
                )
            )
            : 0;

    const activeTitle =
        titles.find(
            title =>
                title.isActive
        ) ||
        soulRecord?.title ||
        null;

    const rareTitles =
        titles.filter(
            title =>
                [
                    'Epic',
                    'Legendary',
                    'Mythic'
                ].includes(
                    title.rarity
                )
        );

    const recentTitles =
        [...titles]
            .sort(
                (
                    firstTitle,
                    secondTitle
                ) =>
                    new Date(
                        secondTitle.unlockedAt || 0
                    ).getTime() -
                    new Date(
                        firstTitle.unlockedAt || 0
                    ).getTime()
            )
            .slice(
                0,
                5
            );

    const embed =
        createSoulEmbed({
            interaction,
            member,
            fullUser,

            title:
                '🏆 Soul Chronicles',

            description:
                `${fullUser}'s recorded Achievements, unlocked Titles and permanent Chronicle designations.`,

            color:
                embedConfig.colors.title
        });

    embed.addFields(
        {
            name:
                '🏷️ Chronicle Title Archive',

            value:
                [
                    `**Active Title:** ${activeTitle?.displayName || '🌑 Nameless Soul'}`,
                    `**Titles Unlocked:** \`${formatNumber(titles.length)}\``,
                    `**Rare Titles:** \`${formatNumber(rareTitles.length)}\``,
                    '',
                    '-# Use `/titles` to inspect the full locked and unlocked Title archive.'
                ].join('\n'),

            inline:
                false
        },
        {
            name:
                '🏆 Achievement Progress',

            value:
                [
                    `**Chronicles Recorded:** \`${formatNumber(unlockedAchievementCount)} / ${formatNumber(totalAchievementCount)}\``,
                    `\`${createProgressBar(achievementPercentage, 16)}\` **${achievementPercentage}%**`
                ].join('\n'),

            inline:
                false
        }
    );

    if (
        recentTitles.length >
        0
    ) {
        embed.addFields({
            name:
                '📚 Recently Unlocked Titles',

            value:
                recentTitles
                    .map(
                        formatSoulTitle
                    )
                    .join(
                        '\n\n━━━━━━━━━━━━━━━━━━━━\n\n'
                    ),

            inline:
                false
        });
    } else {
        embed.addFields({
            name:
                '📚 Recently Unlocked Titles',

            value:
                'No Chronicle Titles have been recorded yet.',

            inline:
                false
        });
    }

    if (
        recentAchievements.length >
        0
    ) {
        embed.addFields({
            name:
                '📖 Latest Achievements',

            value:
                recentAchievements
                    .slice(
                        0,
                        3
                    )
                    .map(
                        formatAchievement
                    )
                    .join(
                        '\n\n━━━━━━━━━━━━━━━━━━━━\n\n'
                    ),

            inline:
                false
        });
    } else {
        embed.addFields({
            name:
                '📖 Latest Achievements',

            value:
                [
                    'No Achievements have been recorded yet.',
                    '',
                    '-# Continue progressing through Las Noches to expand this Chronicle archive.'
                ].join('\n'),

            inline:
                false
        });
    }

    return embed;
}

/**
 * Build the Las Noches activity page.
 *
 * @param {Object} context
 * @returns {import('discord.js').EmbedBuilder}
 */
function buildActivityPage(
    context
) {
    const {
        interaction,
        member,
        fullUser,
        soulRecord
    } =
        context;

    const progression =
        soulRecord?.progression ||
        {};

    const tickets =
        soulRecord?.tickets ||
        {};

    const events =
        soulRecord?.events ||
        {};

    const voice =
        soulRecord?.voice ||
        {};

    const guardian =
        soulRecord?.guardian ||
        {};

    const reputation =
        soulRecord?.reputation ||
        {};

    const embed =
        createSoulEmbed({
            interaction,
            member,
            fullUser,

            title:
                '📊 Las Noches Activity',

            description:
                `${fullUser}'s participation, support, Guardian and community activity records.`,

            color:
                embedConfig.colors.support
        });

    embed.addFields(
        {
            name:
                '💬 Message Activity',

            value:
                [
                    `**Messages Recorded:** \`${formatNumber(progression.messageCount)}\``,
                    `**Last XP Record:** ${formatDiscordDate(progression.lastXpAt, 'R')}`,
                    '',
                    '-# Only valid messages that pass Guardian checks contribute to progression.'
                ].join('\n'),

            inline:
                false
        },
        {
            name:
                '🎙️ Voice Activity',

            value:
                [
                    `**Recorded Voice Time:** \`${formatNumber(voice.totalMinutes)} minutes\``
                ].join('\n'),

            inline:
                true
        },
        {
            name:
                '🎉 Event Activity',

            value:
                [
                    `**Joined:** \`${formatNumber(events.joined)}\``,
                    `**Completed:** \`${formatNumber(events.completed)}\``
                ].join('\n'),

            inline:
                true
        },
        {
            name:
                '🎫 Support Activity',

            value:
                [
                    `**Tickets Created:** \`${formatNumber(tickets.created)}\``,
                    `**Tickets Closed:** \`${formatNumber(tickets.closed)}\``
                ].join('\n'),

            inline:
                true
        },
        {
            name:
                '🛡️ Guardian Record',

            value:
                [
                    `**Warning Count:** \`${formatNumber(guardian.warningCount)}\``,
                    `**Current Status:** ${guardian.status || 'Unknown'}`
                ].join('\n'),

            inline:
                true
        },
        {
            name:
                '🌙 Reputation',

            value:
                [
                    `**Total Reputation:** \`${formatNumber(reputation.total)}\``,
                    `**Received:** \`${formatNumber(reputation.received)}\``,
                    `**Given:** \`${formatNumber(reputation.given)}\``
                ].join('\n'),

            inline:
                true
        }
    );

    return embed;
}

/**
 * Build the account and archive
 * statistics page.
 *
 * @param {Object} context
 * @returns {import('discord.js').EmbedBuilder}
 */
function buildStatisticsPage(
    context
) {
    const {
        interaction,
        member,
        fullUser,
        soulRecord,
        titles,
        rankHistory
    } =
        context;

    const progression =
        soulRecord?.progression ||
        {};

    const completion =
        calculateSoulCompletion({
            soulRecord,
            titles,
            rankHistory,
            member
        });

    const accountAgeDays =
        calculateDaysSince(
            fullUser.createdAt
        );

    const serverDays =
        calculateDaysSince(
            member.joinedAt
        );

    const completedChecks =
        completion.checks
            .filter(
                check =>
                    check.complete
            )
            .map(
                check =>
                    `✅ ${check.label}`
            );

    const incompleteChecks =
        completion.checks
            .filter(
                check =>
                    !check.complete
            )
            .map(
                check =>
                    `⬜ ${check.label}`
            );

    const embed =
        createSoulEmbed({
            interaction,
            member,
            fullUser,

            title:
                '⚙️ Soul Record Statistics',

            description:
                `${fullUser}'s Discord account, Las Noches membership and database archive statistics.`,

            color:
                embedConfig.colors.primary
        });

    embed.addFields(
        {
            name:
                '📅 Discord Account',

            value:
                [
                    `**Created:** ${formatDiscordDate(fullUser.createdAt, 'F')}`,
                    `**Account Age:** \`${formatNumber(accountAgeDays)} days\``,
                    `**User ID:** \`${fullUser.id}\``,
                    `**Bot Account:** ${fullUser.bot ? 'Yes' : 'No'}`
                ].join('\n'),

            inline:
                false
        },
        {
            name:
                '🏰 Las Noches Membership',

            value:
                [
                    `**Joined:** ${formatDiscordDate(member.joinedAt, 'F')}`,
                    `**Time Inside Las Noches:** \`${formatNumber(serverDays)} days\``,
                    `**Highest Role:** ${getHighestRole(member)}`,
                    `**Administrative Standing:** ${getLasNochesStanding(member, interaction.guild)}`
                ].join('\n'),

            inline:
                false
        },
        {
            name:
                '🗄️ Database Record',

            value:
                [
                    `**Record Created:** ${formatDiscordDate(progression.recordCreatedAt, 'F')}`,
                    `**Record Updated:** ${formatDiscordDate(progression.recordUpdatedAt, 'R')}`,
                    `**Soul Record Opened:** ${formatDiscordDate(soulRecord?.openedAt, 'R')}`,
                    `**Guild ID:** \`${interaction.guild.id}\``
                ].join('\n'),

            inline:
                false
        },
        {
            name:
                '📈 Soul Completion',

            value:
                [
                    `\`${createProgressBar(completion.percentage, 18)}\` **${completion.percentage}%**`,
                    `**Completed Milestones:** \`${completion.completed} / ${completion.total}\``
                ].join('\n'),

            inline:
                false
        }
    );

    if (
        completedChecks.length >
        0
    ) {
        embed.addFields({
            name:
                '✅ Completed Archive Milestones',

            value:
                completedChecks.join('\n'),

            inline:
                false
        });
    }

    if (
        incompleteChecks.length >
        0
    ) {
        embed.addFields({
            name:
                '⬜ Remaining Archive Milestones',

            value:
                incompleteChecks.join('\n'),

            inline:
                false
        });
    }

    return embed;
}

/**
 * Build the requested Soul Record page.
 *
 * @param {Object} context
 * @param {string} selectedPage
 * @returns {import('discord.js').EmbedBuilder}
 */
function buildSoulPage(
    context,
    selectedPage
) {
    switch (
        selectedPage
    ) {
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
                'Open an interactive Soul Record from the archives of Las Noches.'
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
            if (
                !interaction.inGuild()
            ) {
                await interaction.reply({
                    embeds: [
                        createErrorEmbed(
                            '❌ Las Noches Only Command',
                            'Soul Records can only be opened inside Las Noches.'
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

            const [
                fullUser,
                soulRecord,
                rankHistory,
                titles
            ] =
                await Promise.all([
                    selectedUser.fetch(
                        true
                    ),

                    soulDatabase
                        .ensureSoulRecord(
                            interaction.guild.id,
                            selectedUser.id
                        ),

                    getSafeRankHistory(
                        interaction.guild.id,
                        selectedUser.id
                    ),

                    getSafeSoulTitles(
                        interaction.guild.id,
                        selectedUser.id
                    )
                ]);

            const context = {
                interaction,
                member,
                fullUser,
                soulRecord,
                rankHistory,
                titles
            };

            let selectedPage =
                SOUL_PAGES.overview;

            const initialEmbed =
                buildSoulPage(
                    context,
                    selectedPage
                );

            const replyMessage =
                await interaction.editReply({
                    embeds: [
                        initialEmbed
                    ],

                    components: [
                        createSoulMenu(
                            selectedPage
                        )
                    ],

                    fetchReply:
                        true
                });

            const collector =
                replyMessage
                    .createMessageComponentCollector({
                        componentType:
                            ComponentType.StringSelect,

                        time:
                            10 * 60 * 1000
                    });

            collector.on(
                'collect',
                async menuInteraction => {
                    try {
                        if (
                            menuInteraction.user.id !==
                            interaction.user.id
                        ) {
                            await menuInteraction.reply({
                                embeds: [
                                    createErrorEmbed(
                                        '❌ Private Soul Record',
                                        'Only the Soul who opened this archive may control its navigation.'
                                    )
                                ],

                                flags:
                                    MessageFlags.Ephemeral
                            });

                            return;
                        }

                        if (
                            menuInteraction.customId !==
                            SOUL_MENU_ID
                        ) {
                            return;
                        }

                        const requestedPage =
                            menuInteraction.values[0];

                        if (
                            !SOUL_PAGE_ORDER.includes(
                                requestedPage
                            )
                        ) {
                            await menuInteraction.reply({
                                embeds: [
                                    createErrorEmbed(
                                        '❌ Unknown Soul Archive',
                                        'Umbra could not recognize the selected Soul Record section.'
                                    )
                                ],

                                flags:
                                    MessageFlags.Ephemeral
                            });

                            return;
                        }

                        selectedPage =
                            requestedPage;

                        const updatedEmbed =
                            buildSoulPage(
                                context,
                                selectedPage
                            );

                        await menuInteraction.update({
                            embeds: [
                                updatedEmbed
                            ],

                            components: [
                                createSoulMenu(
                                    selectedPage
                                )
                            ]
                        });
                    } catch (menuError) {
                        console.error(
                            '❌ Umbra /soul navigation error:',
                            menuError
                        );

                        const navigationErrorEmbed =
                            createErrorEmbed(
                                '❌ Soul Record Navigation Failed',
                                'Umbra could not open the selected Soul Record section.'
                            );

                        if (
                            menuInteraction.deferred ||
                            menuInteraction.replied
                        ) {
                            await menuInteraction
                                .followUp({
                                    embeds: [
                                        navigationErrorEmbed
                                    ],

                                    flags:
                                        MessageFlags.Ephemeral
                                })
                                .catch(
                                    () => null
                                );

                            return;
                        }

                        await menuInteraction
                            .reply({
                                embeds: [
                                    navigationErrorEmbed
                                ],

                                flags:
                                    MessageFlags.Ephemeral
                            })
                            .catch(
                                () => null
                            );
                    }
                }
            );

            collector.on(
                'end',
                async (
                    collected,
                    reason
                ) => {
                    if (
                        reason ===
                        'messageDelete' ||
                        reason ===
                        'channelDelete' ||
                        reason ===
                        'guildDelete'
                    ) {
                        return;
                    }

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
                '❌ Umbra /soul command error:',
                error
            );

            const errorEmbed =
                createErrorEmbed(
                    '❌ Soul Record Unavailable',
                    [
                        'Umbra could not open the requested Soul Record.',
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