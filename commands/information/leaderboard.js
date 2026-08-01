const {
    SlashCommandBuilder,
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

const leaderboardDatabase =
    require('../../database/leaderboards');

/**
 * Interactive leaderboard menu ID.
 */
const LEADERBOARD_MENU_ID =
    'umbra_leaderboard_page_menu';

/**
 * Number of ranked Souls displayed
 * on each leaderboard page.
 */
const LEADERBOARD_DISPLAY_LIMIT =
    10;

/**
 * Number of database rows loaded before
 * inactive, departed and bot users are removed.
 */
const LEADERBOARD_QUERY_LIMIT =
    30;

/**
 * Leaderboard page identifiers.
 */
const LEADERBOARD_PAGES = {
    overview:
        'leaderboard_overview',

    levels:
        'leaderboard_levels',

    xp:
        'leaderboard_xp',

    messages:
        'leaderboard_messages',

    achievements:
        'leaderboard_achievements',

    titles:
        'leaderboard_titles'
};

/**
 * Leaderboard page order.
 */
const LEADERBOARD_PAGE_ORDER = [
    LEADERBOARD_PAGES.overview,
    LEADERBOARD_PAGES.levels,
    LEADERBOARD_PAGES.xp,
    LEADERBOARD_PAGES.messages,
    LEADERBOARD_PAGES.achievements,
    LEADERBOARD_PAGES.titles
];

/**
 * Leaderboard page display information.
 */
const LEADERBOARD_PAGE_DETAILS = {
    [LEADERBOARD_PAGES.overview]: {
        emoji:
            '🏆',

        label:
            'Leaderboard Overview',

        description:
            'View every Las Noches ranking category'
    },

    [LEADERBOARD_PAGES.levels]: {
        emoji:
            '⭐',

        label:
            'Soul Levels',

        description:
            'Highest Soul Levels in Las Noches'
    },

    [LEADERBOARD_PAGES.xp]: {
        emoji:
            '✨',

        label:
            'Spiritual Power',

        description:
            'Souls with the highest total XP'
    },

    [LEADERBOARD_PAGES.messages]: {
        emoji:
            '💬',

        label:
            'Message Activity',

        description:
            'Most active recorded Souls'
    },

    [LEADERBOARD_PAGES.achievements]: {
        emoji:
            '🏆',

        label:
            'Achievements',

        description:
            'Souls with the most Chronicles'
    },

    [LEADERBOARD_PAGES.titles]: {
        emoji:
            '🏷️',

        label:
            'Chronicle Titles',

        description:
            'Largest Chronicle Title collections'
    }
};

/**
 * Medal display by leaderboard position.
 */
const POSITION_MEDALS = {
    1:
        '🥇',

    2:
        '🥈',

    3:
        '🥉'
};

/**
 * Format a numeric value.
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
    style = 'R'
) {
    if (!value) {
        return 'Not recorded';
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
        return 'Not recorded';
    }

    const unixTimestamp =
        Math.floor(
            date.getTime() /
            1_000
        );

    return `<t:${unixTimestamp}:${style}>`;
}

/**
 * Create a compact visual progress bar.
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
 * Get the visual medal belonging
 * to one leaderboard position.
 *
 * @param {number} position
 * @returns {string}
 */
function getPositionMedal(
    position
) {
    return (
        POSITION_MEDALS[
            Number(
                position
            )
        ] ||
        `\`#${formatNumber(position)}\``
    );
}

/**
 * Create the interactive leaderboard menu.
 *
 * @param {string} selectedPage
 * @param {boolean} disabled
 * @returns {ActionRowBuilder<StringSelectMenuBuilder>}
 */
function createLeaderboardMenu(
    selectedPage,
    disabled = false
) {
    const menu =
        new StringSelectMenuBuilder()
            .setCustomId(
                LEADERBOARD_MENU_ID
            )
            .setPlaceholder(
                'Select a Las Noches ranking'
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
        of LEADERBOARD_PAGE_ORDER
    ) {
        const details =
            LEADERBOARD_PAGE_DETAILS[
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
 * Create the shared leaderboard Embed.
 *
 * @param {Object} options
 * @param {import('discord.js').ChatInputCommandInteraction} options.interaction
 * @param {string} options.title
 * @param {string} options.description
 * @param {string} [options.color]
 * @returns {import('discord.js').EmbedBuilder}
 */
function createLeaderboardEmbed({
    interaction,
    title,
    description,
    color =
        embedConfig.colors.accent
}) {
    const guildIcon =
        interaction.guild.iconURL({
            extension:
                'png',

            size:
                1024,

            forceStatic:
                false
        });

    const botAvatar =
        interaction.client.user
            .displayAvatarURL({
                extension:
                    'png',

                size:
                    1024,

                forceStatic:
                    false
            });

    return createEmbed({
        title,

        description:
            [
                description,
                '',
                embedConfig
                    .branding
                    .divider,
                '',
                '*The most accomplished Souls of Las Noches are preserved within these eternal rankings.*'
            ].join('\n'),

        color,

        thumbnail:
            guildIcon ||
            botAvatar,

        author: {
            name:
                `${interaction.guild.name} • Soul Rankings`,

            iconURL:
                guildIcon ||
                botAvatar
        },

        footer: {
            text:
                `🌙 Umbra • Guardian of Las Noches • Opened by ${interaction.user.username}`,

            iconURL:
                botAvatar
        }
    });
}

/**
 * Resolve one leaderboard database row
 * into a current Las Noches member.
 *
 * Departed users and bot accounts are
 * not shown in public rankings.
 *
 * @param {import('discord.js').Guild} guild
 * @param {Object} row
 * @returns {Object|null}
 */
function resolveLeaderboardMember(
    guild,
    row
) {
    const member =
        guild.members.cache.get(
            row.userId
        );

    if (
        !member ||
        member.user.bot
    ) {
        return null;
    }

    return {
        ...row,
        member
    };
}

/**
 * Remove departed users and bots,
 * then limit the visible ranking.
 *
 * @param {import('discord.js').Guild} guild
 * @param {Object[]} rows
 * @returns {Object[]}
 */
function prepareLeaderboardRows(
    guild,
    rows
) {
    if (
        !Array.isArray(
            rows
        )
    ) {
        return [];
    }

    return rows
        .map(
            row =>
                resolveLeaderboardMember(
                    guild,
                    row
                )
        )
        .filter(
            Boolean
        )
        .slice(
            0,
            LEADERBOARD_DISPLAY_LIMIT
        );
}

/**
 * Find the highest value from one
 * prepared leaderboard.
 *
 * @param {Object[]} rows
 * @param {string} property
 * @returns {number}
 */
function getHighestLeaderboardValue(
    rows,
    property
) {
    if (
        !Array.isArray(
            rows
        ) ||
        rows.length ===
            0
    ) {
        return 0;
    }

    return Math.max(
        ...rows.map(
            row =>
                Number(
                    row[
                        property
                    ] ||
                    0
                )
        )
    );
}

/**
 * Calculate one ranked entry's visual
 * percentage compared with first place.
 *
 * @param {number} value
 * @param {number} highestValue
 * @returns {number}
 */
function calculateRelativePercentage(
    value,
    highestValue
) {
    if (
        highestValue <=
        0
    ) {
        return 0;
    }

    return Math.min(
        100,
        Math.max(
            0,
            Math.round(
                (
                    Number(
                        value || 0
                    ) /
                    highestValue
                ) *
                100
            )
        )
    );
}

/**
 * Split ranked entries into safe
 * Discord Embed field values.
 *
 * @param {string[]} entries
 * @param {number} maxLength
 * @returns {string[]}
 */
function splitLeaderboardEntries(
    entries,
    maxLength = 1_000
) {
    const chunks =
        [];

    let currentChunk =
        '';

    for (
        const entry
        of entries
    ) {
        const separator =
            currentChunk
                ? '\n\n━━━━━━━━━━━━━━━━━━━━\n\n'
                : '';

        const nextChunk =
            `${currentChunk}${separator}${entry}`;

        if (
            nextChunk.length >
            maxLength
        ) {
            if (currentChunk) {
                chunks.push(
                    currentChunk
                );
            }

            currentChunk =
                entry;
        } else {
            currentChunk =
                nextChunk;
        }
    }

    if (currentChunk) {
        chunks.push(
            currentChunk
        );
    }

    return chunks;
}

/**
 * Format the requesting Soul's personal
 * leaderboard position.
 *
 * @param {Object|null} position
 * @param {string} statisticLabel
 * @param {string} statisticValue
 * @returns {string}
 */
function formatPersonalPosition(
    position,
    statisticLabel,
    statisticValue
) {
    if (!position) {
        return [
            '🌑 You are not currently recorded in this ranking.',
            '',
            '-# Continue progressing through Las Noches to enter the leaderboard.'
        ].join('\n');
    }

    return [
        `**Position:** \`#${formatNumber(position.rank)}\``,
        `**${statisticLabel}:** ${statisticValue}`
    ].join('\n');
}/**
 * Load every leaderboard dataset required
 * by the interactive ranking system.
 *
 * @param {import('discord.js').Guild} guild
 * @param {string} requestingUserId
 * @returns {Promise<Object>}
 */
async function loadLeaderboardData(
    guild,
    requestingUserId
) {
    await guild.members
        .fetch()
        .catch(
            () => null
        );

    const [
        levelRows,
        xpRows,
        messageRows,
        achievementRows,
        titleRows,

        personalLevelPosition,
        personalXpPosition,
        personalMessagePosition,
        personalAchievementPosition,
        personalTitlePosition,

        levelSoulCount,
        achievementSoulCount,
        titleSoulCount
    ] =
        await Promise.all([
            leaderboardDatabase
                .getLevelLeaderboard(
                    guild.id,
                    LEADERBOARD_QUERY_LIMIT
                ),

            leaderboardDatabase
                .getXpLeaderboard(
                    guild.id,
                    LEADERBOARD_QUERY_LIMIT
                ),

            leaderboardDatabase
                .getMessageLeaderboard(
                    guild.id,
                    LEADERBOARD_QUERY_LIMIT
                ),

            leaderboardDatabase
                .getAchievementLeaderboard(
                    guild.id,
                    LEADERBOARD_QUERY_LIMIT
                ),

            leaderboardDatabase
                .getTitleLeaderboard(
                    guild.id,
                    LEADERBOARD_QUERY_LIMIT
                ),

            leaderboardDatabase
                .getLevelPosition(
                    guild.id,
                    requestingUserId
                ),

            leaderboardDatabase
                .getXpPosition(
                    guild.id,
                    requestingUserId
                ),

            leaderboardDatabase
                .getMessagePosition(
                    guild.id,
                    requestingUserId
                ),

            leaderboardDatabase
                .getAchievementPosition(
                    guild.id,
                    requestingUserId
                ),

            leaderboardDatabase
                .getTitlePosition(
                    guild.id,
                    requestingUserId
                ),

            leaderboardDatabase
                .countLevelLeaderboardSouls(
                    guild.id
                ),

            leaderboardDatabase
                .countAchievementLeaderboardSouls(
                    guild.id
                ),

            leaderboardDatabase
                .countTitleLeaderboardSouls(
                    guild.id
                )
        ]);

    return {
        levels:
            prepareLeaderboardRows(
                guild,
                levelRows
            ),

        xp:
            prepareLeaderboardRows(
                guild,
                xpRows
            ),

        messages:
            prepareLeaderboardRows(
                guild,
                messageRows
            ),

        achievements:
            prepareLeaderboardRows(
                guild,
                achievementRows
            ),

        titles:
            prepareLeaderboardRows(
                guild,
                titleRows
            ),

        personalPositions: {
            levels:
                personalLevelPosition,

            xp:
                personalXpPosition,

            messages:
                personalMessagePosition,

            achievements:
                personalAchievementPosition,

            titles:
                personalTitlePosition
        },

        participantCounts: {
            levels:
                Number(
                    levelSoulCount || 0
                ),

            xp:
                Number(
                    levelSoulCount || 0
                ),

            messages:
                Number(
                    levelSoulCount || 0
                ),

            achievements:
                Number(
                    achievementSoulCount || 0
                ),

            titles:
                Number(
                    titleSoulCount || 0
                )
        }
    };
}

/**
 * Format one Soul Level ranking entry.
 *
 * @param {Object} row
 * @param {number} highestLevel
 * @returns {string}
 */
function formatLevelEntry(
    row,
    highestLevel
) {
    const percentage =
        calculateRelativePercentage(
            row.level,
            highestLevel
        );

    return [
        `### ${getPositionMedal(row.rank)} ${row.member.displayName}`,
        `${row.member}`,
        `⭐ **Soul Level:** \`${formatNumber(row.level)}\``,
        `✨ **Spiritual Power:** \`${formatNumber(row.xp)} XP\``,
        `💬 **Messages:** \`${formatNumber(row.messageCount)}\``,
        `\`${createProgressBar(percentage, 10)}\` **${percentage}% of first place**`
    ].join('\n');
}

/**
 * Format one Spiritual Power ranking entry.
 *
 * @param {Object} row
 * @param {number} highestXp
 * @returns {string}
 */
function formatXpEntry(
    row,
    highestXp
) {
    const percentage =
        calculateRelativePercentage(
            row.xp,
            highestXp
        );

    return [
        `### ${getPositionMedal(row.rank)} ${row.member.displayName}`,
        `${row.member}`,
        `✨ **Spiritual Power:** \`${formatNumber(row.xp)} XP\``,
        `⭐ **Soul Level:** \`${formatNumber(row.level)}\``,
        `💬 **Messages:** \`${formatNumber(row.messageCount)}\``,
        `\`${createProgressBar(percentage, 10)}\` **${percentage}% of first place**`
    ].join('\n');
}

/**
 * Format one Message Activity entry.
 *
 * @param {Object} row
 * @param {number} highestMessageCount
 * @returns {string}
 */
function formatMessageEntry(
    row,
    highestMessageCount
) {
    const percentage =
        calculateRelativePercentage(
            row.messageCount,
            highestMessageCount
        );

    return [
        `### ${getPositionMedal(row.rank)} ${row.member.displayName}`,
        `${row.member}`,
        `💬 **Messages Recorded:** \`${formatNumber(row.messageCount)}\``,
        `⭐ **Soul Level:** \`${formatNumber(row.level)}\``,
        `✨ **Spiritual Power:** \`${formatNumber(row.xp)} XP\``,
        `\`${createProgressBar(percentage, 10)}\` **${percentage}% of first place**`
    ].join('\n');
}

/**
 * Add formatted ranking entries to one
 * leaderboard Embed.
 *
 * @param {import('discord.js').EmbedBuilder} embed
 * @param {string} fieldTitle
 * @param {string[]} entries
 * @returns {void}
 */
function addRankingFields(
    embed,
    fieldTitle,
    entries
) {
    if (
        !Array.isArray(
            entries
        ) ||
        entries.length ===
            0
    ) {
        embed.addFields({
            name:
                '🌑 No Ranked Souls',

            value:
                [
                    'No current Las Noches members are recorded in this ranking.',
                    '',
                    '-# The leaderboard will update automatically when qualifying data becomes available.'
                ].join('\n'),

            inline:
                false
        });

        return;
    }

    const chunks =
        splitLeaderboardEntries(
            entries
        );

    chunks.forEach(
        (
            chunk,
            index
        ) => {
            embed.addFields({
                name:
                    index ===
                    0
                        ? fieldTitle
                        : `${fieldTitle} — Continued`,

                value:
                    chunk,

                inline:
                    false
            });
        }
    );
}

/**
 * Build the main Leaderboard Overview.
 *
 * @param {Object} context
 * @returns {import('discord.js').EmbedBuilder}
 */
function buildOverviewPage(
    context
) {
    const {
        interaction,
        leaderboardData
    } =
        context;

    const topLevelSoul =
        leaderboardData.levels[0] ||
        null;

    const topXpSoul =
        leaderboardData.xp[0] ||
        null;

    const topMessageSoul =
        leaderboardData.messages[0] ||
        null;

    const topAchievementSoul =
        leaderboardData.achievements[0] ||
        null;

    const topTitleSoul =
        leaderboardData.titles[0] ||
        null;

    const embed =
        createLeaderboardEmbed({
            interaction,

            title:
                '🏆 Las Noches Leaderboards',

            description:
                [
                    'Umbra has opened the official rankings of Las Noches.',
                    '',
                    'Select a category below to inspect the Top Souls and your current position.'
                ].join('\n'),

            color:
                embedConfig.colors.accent
        });

    embed.addFields(
        {
            name:
                '⭐ Soul Level Champion',

            value:
                topLevelSoul
                    ? [
                        `🥇 ${topLevelSoul.member}`,
                        `**Level:** \`${formatNumber(topLevelSoul.level)}\``,
                        `**XP:** \`${formatNumber(topLevelSoul.xp)}\``
                    ].join('\n')
                    : 'No ranked Soul is currently available.',

            inline:
                true
        },
        {
            name:
                '✨ Spiritual Power Champion',

            value:
                topXpSoul
                    ? [
                        `🥇 ${topXpSoul.member}`,
                        `**XP:** \`${formatNumber(topXpSoul.xp)}\``,
                        `**Level:** \`${formatNumber(topXpSoul.level)}\``
                    ].join('\n')
                    : 'No ranked Soul is currently available.',

            inline:
                true
        },
        {
            name:
                '💬 Activity Champion',

            value:
                topMessageSoul
                    ? [
                        `🥇 ${topMessageSoul.member}`,
                        `**Messages:** \`${formatNumber(topMessageSoul.messageCount)}\``,
                        `**Level:** \`${formatNumber(topMessageSoul.level)}\``
                    ].join('\n')
                    : 'No ranked Soul is currently available.',

            inline:
                true
        },
        {
            name:
                '🏆 Chronicle Champion',

            value:
                topAchievementSoul
                    ? [
                        `🥇 ${topAchievementSoul.member}`,
                        `**Achievements:** \`${formatNumber(topAchievementSoul.achievementCount)}\``,
                        `**Latest Unlock:** ${formatDiscordDate(topAchievementSoul.latestUnlockAt, 'R')}`
                    ].join('\n')
                    : 'No Achievement rankings are currently available.',

            inline:
                true
        },
        {
            name:
                '🏷️ Title Collector',

            value:
                topTitleSoul
                    ? [
                        `🥇 ${topTitleSoul.member}`,
                        `**Titles:** \`${formatNumber(topTitleSoul.titleCount)}\``,
                        `**Active Title:** ${topTitleSoul.activeTitleDisplayName || 'Not recorded'}`
                    ].join('\n')
                    : 'No Chronicle Title rankings are currently available.',

            inline:
                true
        },
        {
            name:
                '📊 Ranking Participation',

            value:
                [
                    `⭐ **Progression Souls:** \`${formatNumber(leaderboardData.participantCounts.levels)}\``,
                    `🏆 **Achievement Souls:** \`${formatNumber(leaderboardData.participantCounts.achievements)}\``,
                    `🏷️ **Title Collectors:** \`${formatNumber(leaderboardData.participantCounts.titles)}\``
                ].join('\n'),

            inline:
                true
        },
        {
            name:
                '🧭 Ranking Categories',

            value:
                [
                    '`⭐ Soul Levels` — highest recorded Level',
                    '`✨ Spiritual Power` — highest total XP',
                    '`💬 Message Activity` — most recorded messages',
                    '`🏆 Achievements` — most unlocked Chronicles',
                    '`🏷️ Chronicle Titles` — largest Title collections'
                ].join('\n'),

            inline:
                false
        },
        {
            name:
                '🌙 Connected Archives',

            value:
                [
                    '`/profile` — compact Soul profile',
                    '`/soul` — complete interactive Soul Record',
                    '`/titles` — Chronicle Title collection',
                    '`/espada` — current throne hierarchy'
                ].join('\n'),

            inline:
                false
        }
    );

    return embed;
}

/**
 * Build the Soul Level ranking page.
 *
 * @param {Object} context
 * @returns {import('discord.js').EmbedBuilder}
 */
function buildLevelPage(
    context
) {
    const {
        interaction,
        leaderboardData
    } =
        context;

    const rows =
        leaderboardData.levels;

    const highestLevel =
        getHighestLeaderboardValue(
            rows,
            'level'
        );

    const embed =
        createLeaderboardEmbed({
            interaction,

            title:
                '⭐ Soul Level Leaderboard',

            description:
                'The highest recorded Soul Levels currently active within Las Noches.',

            color:
                embedConfig.colors.archive
        });

    embed.addFields({
        name:
            '📊 Ranking Status',

        value:
            [
                `**Ranked Souls:** \`${formatNumber(leaderboardData.participantCounts.levels)}\``,
                `**Displayed:** \`${formatNumber(rows.length)}\``,
                '',
                '-# Departed members and Discord bots are excluded from public rankings.'
            ].join('\n'),

        inline:
            false
    });

    addRankingFields(
        embed,
        '⭐ Top Soul Levels',
        rows.map(
            row =>
                formatLevelEntry(
                    row,
                    highestLevel
                )
        )
    );

    const personalPosition =
        leaderboardData
            .personalPositions
            .levels;

    embed.addFields({
        name:
            '🌙 Your Position',

        value:
            formatPersonalPosition(
                personalPosition,
                'Soul Level',
                personalPosition
                    ? `\`${formatNumber(personalPosition.level)}\``
                    : 'Not recorded'
            ),

        inline:
            false
    });

    return embed;
}

/**
 * Build the Spiritual Power ranking page.
 *
 * @param {Object} context
 * @returns {import('discord.js').EmbedBuilder}
 */
function buildXpPage(
    context
) {
    const {
        interaction,
        leaderboardData
    } =
        context;

    const rows =
        leaderboardData.xp;

    const highestXp =
        getHighestLeaderboardValue(
            rows,
            'xp'
        );

    const embed =
        createLeaderboardEmbed({
            interaction,

            title:
                '✨ Spiritual Power Leaderboard',

            description:
                'Souls ranked by their complete recorded spiritual power.',

            color:
                embedConfig.colors.rank
        });

    embed.addFields({
        name:
            '📊 Ranking Status',

        value:
            [
                `**Ranked Souls:** \`${formatNumber(leaderboardData.participantCounts.xp)}\``,
                `**Displayed:** \`${formatNumber(rows.length)}\``,
                '',
                '-# Total XP determines this ranking.'
            ].join('\n'),

        inline:
            false
    });

    addRankingFields(
        embed,
        '✨ Top Spiritual Power',
        rows.map(
            row =>
                formatXpEntry(
                    row,
                    highestXp
                )
        )
    );

    const personalPosition =
        leaderboardData
            .personalPositions
            .xp;

    embed.addFields({
        name:
            '🌙 Your Position',

        value:
            formatPersonalPosition(
                personalPosition,
                'Spiritual Power',
                personalPosition
                    ? `\`${formatNumber(personalPosition.xp)} XP\``
                    : 'Not recorded'
            ),

        inline:
            false
    });

    return embed;
}

/**
 * Build the Message Activity ranking page.
 *
 * @param {Object} context
 * @returns {import('discord.js').EmbedBuilder}
 */
function buildMessagePage(
    context
) {
    const {
        interaction,
        leaderboardData
    } =
        context;

    const rows =
        leaderboardData.messages;

    const highestMessageCount =
        getHighestLeaderboardValue(
            rows,
            'messageCount'
        );

    const embed =
        createLeaderboardEmbed({
            interaction,

            title:
                '💬 Message Activity Leaderboard',

            description:
                'The most active recorded Souls within the channels of Las Noches.',

            color:
                embedConfig.colors.support
        });

    embed.addFields({
        name:
            '📊 Ranking Status',

        value:
            [
                `**Ranked Souls:** \`${formatNumber(leaderboardData.participantCounts.messages)}\``,
                `**Displayed:** \`${formatNumber(rows.length)}\``,
                '',
                '-# Guardian-approved message records determine this ranking.'
            ].join('\n'),

        inline:
            false
    });

    addRankingFields(
        embed,
        '💬 Most Active Souls',
        rows.map(
            row =>
                formatMessageEntry(
                    row,
                    highestMessageCount
                )
        )
    );

    const personalPosition =
        leaderboardData
            .personalPositions
            .messages;

    embed.addFields({
        name:
            '🌙 Your Position',

        value:
            formatPersonalPosition(
                personalPosition,
                'Messages Recorded',
                personalPosition
                    ? `\`${formatNumber(personalPosition.messageCount)}\``
                    : 'Not recorded'
            ),

        inline:
            false
    });

    return embed;
}/**
 * Format one Achievement ranking entry.
 *
 * @param {Object} row
 * @param {number} highestAchievementCount
 * @returns {string}
 */
function formatAchievementEntry(
    row,
    highestAchievementCount
) {
    const percentage =
        calculateRelativePercentage(
            row.achievementCount,
            highestAchievementCount
        );

    return [
        `### ${getPositionMedal(row.rank)} ${row.member.displayName}`,
        `${row.member}`,
        `🏆 **Achievements:** \`${formatNumber(row.achievementCount)}\``,
        `📅 **Latest Unlock:** ${formatDiscordDate(row.latestUnlockAt, 'R')}`,
        `\`${createProgressBar(percentage, 10)}\` **${percentage}% of first place**`
    ].join('\n');
}

/**
 * Format one Chronicle Title ranking entry.
 *
 * @param {Object} row
 * @param {number} highestTitleCount
 * @returns {string}
 */
function formatTitleEntry(
    row,
    highestTitleCount
) {
    const percentage =
        calculateRelativePercentage(
            row.titleCount,
            highestTitleCount
        );

    return [
        `### ${getPositionMedal(row.rank)} ${row.member.displayName}`,
        `${row.member}`,
        `🏷️ **Titles Unlocked:** \`${formatNumber(row.titleCount)}\``,
        `👑 **Active Title:** ${row.activeTitleDisplayName || 'Not recorded'}`,
        row.activeTitleRarity
            ? `🌟 **Rarity:** ${row.activeTitleRarity}`
            : null,
        `📅 **Latest Unlock:** ${formatDiscordDate(row.latestUnlockAt, 'R')}`,
        `\`${createProgressBar(percentage, 10)}\` **${percentage}% of first place**`
    ]
        .filter(
            Boolean
        )
        .join('\n');
}

/**
 * Build the Achievement ranking page.
 *
 * @param {Object} context
 * @returns {import('discord.js').EmbedBuilder}
 */
function buildAchievementPage(
    context
) {
    const {
        interaction,
        leaderboardData
    } =
        context;

    const rows =
        leaderboardData.achievements;

    const highestAchievementCount =
        getHighestLeaderboardValue(
            rows,
            'achievementCount'
        );

    const embed =
        createLeaderboardEmbed({
            interaction,

            title:
                '🏆 Achievement Leaderboard',

            description:
                'Souls ranked by the number of unlocked Soul Chronicles.',

            color:
                embedConfig.colors.success
        });

    embed.addFields({
        name:
            '📊 Ranking Status',

        value:
            [
                `**Ranked Souls:** \`${formatNumber(leaderboardData.participantCounts.achievements)}\``,
                `**Displayed:** \`${formatNumber(rows.length)}\``,
                '',
                '-# Only members with at least one unlocked Achievement appear in this ranking.'
            ].join('\n'),

        inline:
            false
    });

    addRankingFields(
        embed,
        '🏆 Top Chronicle Holders',
        rows.map(
            row =>
                formatAchievementEntry(
                    row,
                    highestAchievementCount
                )
        )
    );

    const personalPosition =
        leaderboardData
            .personalPositions
            .achievements;

    embed.addFields({
        name:
            '🌙 Your Position',

        value:
            formatPersonalPosition(
                personalPosition,
                'Achievements',
                personalPosition
                    ? `\`${formatNumber(personalPosition.achievementCount)}\``
                    : 'Not recorded'
            ),

        inline:
            false
    });

    return embed;
}

/**
 * Build the Chronicle Title ranking page.
 *
 * @param {Object} context
 * @returns {import('discord.js').EmbedBuilder}
 */
function buildTitlePage(
    context
) {
    const {
        interaction,
        leaderboardData
    } =
        context;

    const rows =
        leaderboardData.titles;

    const highestTitleCount =
        getHighestLeaderboardValue(
            rows,
            'titleCount'
        );

    const embed =
        createLeaderboardEmbed({
            interaction,

            title:
                '🏷️ Chronicle Title Leaderboard',

            description:
                'Souls ranked by the size of their unlocked Chronicle Title collections.',

            color:
                embedConfig.colors.title
        });

    embed.addFields({
        name:
            '📊 Ranking Status',

        value:
            [
                `**Ranked Souls:** \`${formatNumber(leaderboardData.participantCounts.titles)}\``,
                `**Displayed:** \`${formatNumber(rows.length)}\``,
                '',
                '-# Every permanently unlocked Title contributes to this ranking.'
            ].join('\n'),

        inline:
            false
    });

    addRankingFields(
        embed,
        '🏷️ Top Title Collectors',
        rows.map(
            row =>
                formatTitleEntry(
                    row,
                    highestTitleCount
                )
        )
    );

    const personalPosition =
        leaderboardData
            .personalPositions
            .titles;

    embed.addFields({
        name:
            '🌙 Your Position',

        value:
            formatPersonalPosition(
                personalPosition,
                'Titles Unlocked',
                personalPosition
                    ? `\`${formatNumber(personalPosition.titleCount)}\``
                    : 'Not recorded'
            ),

        inline:
            false
    });

    return embed;
}

/**
 * Build the requested leaderboard page.
 *
 * @param {Object} context
 * @param {string} selectedPage
 * @returns {import('discord.js').EmbedBuilder}
 */
function buildLeaderboardPage(
    context,
    selectedPage
) {
    switch (
        selectedPage
    ) {
        case LEADERBOARD_PAGES.levels:
            return buildLevelPage(
                context
            );

        case LEADERBOARD_PAGES.xp:
            return buildXpPage(
                context
            );

        case LEADERBOARD_PAGES.messages:
            return buildMessagePage(
                context
            );

        case LEADERBOARD_PAGES.achievements:
            return buildAchievementPage(
                context
            );

        case LEADERBOARD_PAGES.titles:
            return buildTitlePage(
                context
            );

        case LEADERBOARD_PAGES.overview:
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
                'leaderboard'
            )
            .setDescription(
                'Open the interactive Soul rankings of Las Noches.'
            )
            .setDMPermission(
                false
            ),

    /**
     * Execute the /leaderboard command.
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
                            'Soul leaderboards can only be opened inside Las Noches.'
                        )
                    ],

                    flags:
                        MessageFlags.Ephemeral
                });

                return;
            }

            await interaction.deferReply();

            let leaderboardData =
                await loadLeaderboardData(
                    interaction.guild,
                    interaction.user.id
                );

            let context = {
                interaction,
                leaderboardData
            };

            let selectedPage =
                LEADERBOARD_PAGES.overview;

            const initialEmbed =
                buildLeaderboardPage(
                    context,
                    selectedPage
                );

            const replyMessage =
                await interaction.editReply({
                    embeds: [
                        initialEmbed
                    ],

                    components: [
                        createLeaderboardMenu(
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
                                        '❌ Private Ranking Archive',
                                        'Only the Soul who opened this leaderboard may control its navigation.'
                                    )
                                ],

                                flags:
                                    MessageFlags.Ephemeral
                            });

                            return;
                        }

                        if (
                            menuInteraction.customId !==
                            LEADERBOARD_MENU_ID
                        ) {
                            return;
                        }

                        const requestedPage =
                            menuInteraction.values[0];

                        if (
                            !LEADERBOARD_PAGE_ORDER.includes(
                                requestedPage
                            )
                        ) {
                            await menuInteraction.reply({
                                embeds: [
                                    createErrorEmbed(
                                        '❌ Unknown Ranking',
                                        'Umbra could not recognize the selected leaderboard category.'
                                    )
                                ],

                                flags:
                                    MessageFlags.Ephemeral
                            });

                            return;
                        }

                        selectedPage =
                            requestedPage;

                        /*
                         * Reload every dataset before each
                         * page transition so new XP, messages,
                         * Achievements and Titles are visible
                         * without reopening /leaderboard.
                         */
                        leaderboardData =
                            await loadLeaderboardData(
                                interaction.guild,
                                interaction.user.id
                            );

                        context = {
                            interaction,
                            leaderboardData
                        };

                        const updatedEmbed =
                            buildLeaderboardPage(
                                context,
                                selectedPage
                            );

                        await menuInteraction.update({
                            embeds: [
                                updatedEmbed
                            ],

                            components: [
                                createLeaderboardMenu(
                                    selectedPage
                                )
                            ]
                        });
                    } catch (menuError) {
                        console.error(
                            '❌ Umbra /leaderboard navigation error:',
                            menuError
                        );

                        const navigationErrorEmbed =
                            createErrorEmbed(
                                '❌ Leaderboard Navigation Failed',
                                [
                                    'Umbra could not open the selected ranking.',
                                    '',
                                    'Please try opening `/leaderboard` again.'
                                ].join('\n')
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
                                createLeaderboardMenu(
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
                '❌ Umbra /leaderboard command error:',
                error
            );

            const errorEmbed =
                createErrorEmbed(
                    '❌ Soul Rankings Unavailable',
                    [
                        'Umbra could not open the Las Noches leaderboards.',
                        '',
                        'Please verify that PostgreSQL is connected and inspect the Northflank logs if the problem continues.'
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