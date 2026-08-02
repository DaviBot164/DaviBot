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

const LEADERBOARD_MENU_ID =
    'umbra_leaderboard_page_menu';

const LEADERBOARD_DISPLAY_LIMIT =
    10;

const LEADERBOARD_QUERY_LIMIT =
    30;

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

const LEADERBOARD_PAGE_ORDER = [
    LEADERBOARD_PAGES.overview,
    LEADERBOARD_PAGES.levels,
    LEADERBOARD_PAGES.xp,
    LEADERBOARD_PAGES.messages,
    LEADERBOARD_PAGES.achievements,
    LEADERBOARD_PAGES.titles
];

const LEADERBOARD_PAGE_DETAILS = {
    [LEADERBOARD_PAGES.overview]: {
        emoji:
            '🏆',

        label:
            'Overview',

        description:
            'View every Las Noches champion'
    },

    [LEADERBOARD_PAGES.levels]: {
        emoji:
            '⭐',

        label:
            'Soul Levels',

        description:
            'Highest recorded Soul Levels'
    },

    [LEADERBOARD_PAGES.xp]: {
        emoji:
            '✨',

        label:
            'Spiritual Power',

        description:
            'Members with the highest total XP'
    },

    [LEADERBOARD_PAGES.messages]: {
        emoji:
            '💬',

        label:
            'Message Activity',

        description:
            'Most active members of Las Noches'
    },

    [LEADERBOARD_PAGES.achievements]: {
        emoji:
            '🏆',

        label:
            'Achievements',

        description:
            'Members with the most Achievements'
    },

    [LEADERBOARD_PAGES.titles]: {
        emoji:
            '🏷️',

        label:
            'Chronicle Titles',

        description:
            'Largest unlocked Title collections'
    }
};

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
    length = 10
) {
    const safePercentage =
        Math.min(
            100,
            Math.max(
                0,
                Number(
                    percentage
                ) || 0
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

    return (
        '▰'.repeat(
            filledBlocks
        ) +
        '▱'.repeat(
            length -
            filledBlocks
        )
    );
}

/**
 * Get a visual ranking position.
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
        `\`#${formatNumber(
            position
        )}\``
    );
}

/**
 * Return the page number.
 *
 * @param {string} pageId
 * @returns {number}
 */
function getPageNumber(
    pageId
) {
    const index =
        LEADERBOARD_PAGE_ORDER
            .indexOf(
                pageId
            );

    return index >= 0
        ? index + 1
        : 1;
}

/**
 * Create the interactive page menu.
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
                'Choose a Las Noches ranking...'
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
 * @param {string} options.pageId
 * @param {string} options.title
 * @param {string} options.description
 * @param {string} [options.color]
 * @returns {import('discord.js').EmbedBuilder}
 */
function createLeaderboardEmbed({
    interaction,
    pageId,
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
                    256,

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
                    .divider
            ].join(
                '\n'
            ),

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
                (
                    `Page ${getPageNumber(
                        pageId
                    )} / ${LEADERBOARD_PAGE_ORDER.length}` +
                    ' • Umbra • Guardian of Las Noches'
                ),

            iconURL:
                botAvatar
        }
    });
}

/**
 * Resolve a database row into a
 * current non-bot server member.
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
 * Prepare public leaderboard rows.
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
 * Get the highest value in a ranking.
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
                    ] || 0
                )
        )
    );
}

/**
 * Calculate progress relative to
 * the first-place member.
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
 * Split ranking entries into safe
 * Discord field values.
 *
 * @param {string[]} entries
 * @param {number} maxLength
 * @returns {string[]}
 */
function splitLeaderboardEntries(
    entries,
    maxLength = 1_000
) {
    const chunks = [];

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
 * Format the requesting member's
 * personal ranking.
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
            '🌑 You are not currently ranked.',
            '',
            '-# Continue progressing through Las Noches to enter this leaderboard.'
        ].join(
            '\n'
        );
    }

    return [
        `**Position:** \`#${formatNumber(
            position.rank
        )}\``,
        `**${statisticLabel}:** ${statisticValue}`
    ].join(
        '\n'
    );
}

/**
 * Load every leaderboard dataset.
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
    ] = await Promise.all([
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
}/**
 * Check whether a position belongs
 * to the first three places.
 *
 * @param {number} position
 * @returns {boolean}
 */
function isTopThree(
    position
) {
    const numericPosition =
        Number(
            position
        );

    return (
        numericPosition >= 1 &&
        numericPosition <= 3
    );
}

/**
 * Create a ranking entry heading.
 *
 * @param {Object} row
 * @returns {string[]}
 */
function buildRankingHeader(
    row
) {
    const position =
        Number(
            row.rank
        );

    if (
        isTopThree(
            position
        )
    ) {
        const championLabel =
            position === 1
                ? ' • Champion'
                : '';

        return [
            `### ${getPositionMedal(
                position
            )} ${row.member.displayName}${championLabel}`,
            `${row.member}`
        ];
    }

    return [
        `${getPositionMedal(
            position
        )} **${row.member.displayName}** • ${row.member}`
    ];
}

/**
 * Build one relative progress line.
 *
 * @param {number} percentage
 * @returns {string}
 */
function buildRelativeProgressLine(
    percentage
) {
    return (
        `\`${createProgressBar(
            percentage,
            10
        )}\` **${percentage}%**`
    );
}

/**
 * Format one Soul Level entry.
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
        ...buildRankingHeader(
            row
        ),
        `⭐ **Level:** \`${formatNumber(
            row.level
        )}\``,
        `✨ **XP:** \`${formatNumber(
            row.xp
        )}\``,
        `💬 **Messages:** \`${formatNumber(
            row.messageCount
        )}\``,
        buildRelativeProgressLine(
            percentage
        )
    ].join(
        '\n'
    );
}

/**
 * Format one Spiritual Power entry.
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
        ...buildRankingHeader(
            row
        ),
        `✨ **Spiritual Power:** \`${formatNumber(
            row.xp
        )} XP\``,
        `⭐ **Level:** \`${formatNumber(
            row.level
        )}\``,
        `💬 **Messages:** \`${formatNumber(
            row.messageCount
        )}\``,
        buildRelativeProgressLine(
            percentage
        )
    ].join(
        '\n'
    );
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
        ...buildRankingHeader(
            row
        ),
        `💬 **Messages:** \`${formatNumber(
            row.messageCount
        )}\``,
        `⭐ **Level:** \`${formatNumber(
            row.level
        )}\``,
        `✨ **XP:** \`${formatNumber(
            row.xp
        )}\``,
        buildRelativeProgressLine(
            percentage
        )
    ].join(
        '\n'
    );
}

/**
 * Format one Achievement entry.
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
        ...buildRankingHeader(
            row
        ),
        `🏆 **Achievements:** \`${formatNumber(
            row.achievementCount
        )}\``,
        `📅 **Latest Unlock:** ${formatDiscordDate(
            row.latestUnlockAt,
            'R'
        )}`,
        buildRelativeProgressLine(
            percentage
        )
    ].join(
        '\n'
    );
}

/**
 * Format one Chronicle Title entry.
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
        ...buildRankingHeader(
            row
        ),
        `🏷️ **Titles:** \`${formatNumber(
            row.titleCount
        )}\``,
        `👑 **Active Title:** ${
            row.activeTitleDisplayName ||
            'Not recorded'
        }`,
        row.activeTitleRarity
            ? `🌟 **Rarity:** ${row.activeTitleRarity}`
            : null,
        `📅 **Latest Unlock:** ${formatDiscordDate(
            row.latestUnlockAt,
            'R'
        )}`,
        buildRelativeProgressLine(
            percentage
        )
    ]
        .filter(
            Boolean
        )
        .join(
            '\n'
        );
}

/**
 * Add ranking entries to an Embed.
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
        entries.length === 0
    ) {
        embed.addFields({
            name:
                '🌑 No Ranked Members',

            value:
                [
                    'No current Las Noches members are recorded in this ranking.',
                    '',
                    '-# This ranking will update when qualifying data becomes available.'
                ].join(
                    '\n'
                ),

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
                    index === 0
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

    const topLevelMember =
        leaderboardData.levels[0] ||
        null;

    const topXpMember =
        leaderboardData.xp[0] ||
        null;

    const topMessageMember =
        leaderboardData.messages[0] ||
        null;

    const topAchievementMember =
        leaderboardData.achievements[0] ||
        null;

    const topTitleMember =
        leaderboardData.titles[0] ||
        null;

    const embed =
        createLeaderboardEmbed({
            interaction,

            pageId:
                LEADERBOARD_PAGES.overview,

            title:
                '🏆 Las Noches Leaderboards',

            description:
                [
                    'The strongest and most accomplished members of Las Noches.',
                    '',
                    'Choose a ranking category from the menu below.'
                ].join(
                    '\n'
                ),

            color:
                '#6F42C1'
        });

    embed.addFields(
        {
            name:
                '👑 Progression Champions',

            value:
                [
                    topLevelMember
                        ? (
                            `🥇 **Highest Level:** ${topLevelMember.member}\n` +
                            `└ Level \`${formatNumber(
                                topLevelMember.level
                            )}\``
                        )
                        : '🥇 **Highest Level:** Not recorded',

                    '',

                    topXpMember
                        ? (
                            `✨ **Spiritual Power:** ${topXpMember.member}\n` +
                            `└ \`${formatNumber(
                                topXpMember.xp
                            )} XP\``
                        )
                        : '✨ **Spiritual Power:** Not recorded',

                    '',

                    topMessageMember
                        ? (
                            `💬 **Most Active:** ${topMessageMember.member}\n` +
                            `└ \`${formatNumber(
                                topMessageMember.messageCount
                            )} messages\``
                        )
                        : '💬 **Most Active:** Not recorded'
                ].join(
                    '\n'
                ),

            inline:
                false
        },
        {
            name:
                '📜 Chronicle Champions',

            value:
                [
                    topAchievementMember
                        ? (
                            `🏆 **Achievements:** ${topAchievementMember.member}\n` +
                            `└ \`${formatNumber(
                                topAchievementMember.achievementCount
                            )}\` unlocked`
                        )
                        : '🏆 **Achievements:** Not recorded',

                    '',

                    topTitleMember
                        ? (
                            `🏷️ **Title Collector:** ${topTitleMember.member}\n` +
                            `└ \`${formatNumber(
                                topTitleMember.titleCount
                            )}\` titles`
                        )
                        : '🏷️ **Title Collector:** Not recorded'
                ].join(
                    '\n'
                ),

            inline:
                false
        },
        {
            name:
                '📊 Ranking Archive',

            value:
                [
                    `⭐ **Progression Members:** \`${formatNumber(
                        leaderboardData
                            .participantCounts
                            .levels
                    )}\``,
                    `🏆 **Achievement Members:** \`${formatNumber(
                        leaderboardData
                            .participantCounts
                            .achievements
                    )}\``,
                    `🏷️ **Title Collectors:** \`${formatNumber(
                        leaderboardData
                            .participantCounts
                            .titles
                    )}\``
                ].join(
                    '\n'
                ),

            inline:
                true
        },
        {
            name:
                '🌙 Available Rankings',

            value:
                [
                    '⭐ Soul Levels',
                    '✨ Spiritual Power',
                    '💬 Message Activity',
                    '🏆 Achievements',
                    '🏷️ Chronicle Titles'
                ].join(
                    '\n'
                ),

            inline:
                true
        }
    );

    return embed;
}

/**
 * Build the Soul Level page.
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

            pageId:
                LEADERBOARD_PAGES.levels,

            title:
                '⭐ Soul Level Leaderboard',

            description:
                'Members ranked by their highest recorded Soul Level.',

            color:
                embedConfig.colors.archive
        });

    embed.addFields({
        name:
            '📊 Ranking Status',

        value:
            [
                `**Ranked Members:** \`${formatNumber(
                    leaderboardData
                        .participantCounts
                        .levels
                )}\``,
                `**Displayed:** \`${formatNumber(
                    rows.length
                )}\``,
                '',
                '-# Bots and departed members are excluded.'
            ].join(
                '\n'
            ),

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
                    ? `\`${formatNumber(
                        personalPosition.level
                    )}\``
                    : 'Not recorded'
            ),

        inline:
            false
    });

    return embed;
}

/**
 * Build the Spiritual Power page.
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

            pageId:
                LEADERBOARD_PAGES.xp,

            title:
                '✨ Spiritual Power Leaderboard',

            description:
                'Members ranked by their total recorded XP.',

            color:
                embedConfig.colors.rank
        });

    embed.addFields({
        name:
            '📊 Ranking Status',

        value:
            [
                `**Ranked Members:** \`${formatNumber(
                    leaderboardData
                        .participantCounts
                        .xp
                )}\``,
                `**Displayed:** \`${formatNumber(
                    rows.length
                )}\``,
                '',
                '-# Total XP determines this ranking.'
            ].join(
                '\n'
            ),

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
                    ? `\`${formatNumber(
                        personalPosition.xp
                    )} XP\``
                    : 'Not recorded'
            ),

        inline:
            false
    });

    return embed;
}

/**
 * Build the Message Activity page.
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

            pageId:
                LEADERBOARD_PAGES.messages,

            title:
                '💬 Message Activity Leaderboard',

            description:
                'The most active recorded members of Las Noches.',

            color:
                embedConfig.colors.support
        });

    embed.addFields({
        name:
            '📊 Ranking Status',

        value:
            [
                `**Ranked Members:** \`${formatNumber(
                    leaderboardData
                        .participantCounts
                        .messages
                )}\``,
                `**Displayed:** \`${formatNumber(
                    rows.length
                )}\``,
                '',
                '-# Only recorded messages contribute to this ranking.'
            ].join(
                '\n'
            ),

        inline:
            false
    });

    addRankingFields(
        embed,
        '💬 Most Active Members',
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
                'Messages',
                personalPosition
                    ? `\`${formatNumber(
                        personalPosition
                            .messageCount
                    )}\``
                    : 'Not recorded'
            ),

        inline:
            false
    });

    return embed;
}

/**
 * Build the Achievement page.
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

            pageId:
                LEADERBOARD_PAGES.achievements,

            title:
                '🏆 Achievement Leaderboard',

            description:
                'Members ranked by their unlocked Soul Chronicles.',

            color:
                embedConfig.colors.success
        });

    embed.addFields({
        name:
            '📊 Ranking Status',

        value:
            [
                `**Ranked Members:** \`${formatNumber(
                    leaderboardData
                        .participantCounts
                        .achievements
                )}\``,
                `**Displayed:** \`${formatNumber(
                    rows.length
                )}\``,
                '',
                '-# At least one Achievement is required.'
            ].join(
                '\n'
            ),

        inline:
            false
    });

    addRankingFields(
        embed,
        '🏆 Top Achievement Holders',
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
                    ? `\`${formatNumber(
                        personalPosition
                            .achievementCount
                    )}\``
                    : 'Not recorded'
            ),

        inline:
            false
    });

    return embed;
}

/**
 * Build the Chronicle Title page.
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

            pageId:
                LEADERBOARD_PAGES.titles,

            title:
                '🏷️ Chronicle Title Leaderboard',

            description:
                'Members ranked by their unlocked Chronicle Title collections.',

            color:
                embedConfig.colors.title
        });

    embed.addFields({
        name:
            '📊 Ranking Status',

        value:
            [
                `**Ranked Members:** \`${formatNumber(
                    leaderboardData
                        .participantCounts
                        .titles
                )}\``,
                `**Displayed:** \`${formatNumber(
                    rows.length
                )}\``,
                '',
                '-# Every permanently unlocked Title contributes.'
            ].join(
                '\n'
            ),

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
                'Titles',
                personalPosition
                    ? `\`${formatNumber(
                        personalPosition
                            .titleCount
                    )}\``
                    : 'Not recorded'
            ),

        inline:
            false
    });

    return embed;
}

/**
 * Build the selected leaderboard page.
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
}module.exports = {
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
                    ]
                });

            const collector =
                replyMessage
                    .createMessageComponentCollector({
                        componentType:
                            ComponentType.StringSelect,

                        time:
                            10 * 60 * 1_000
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
                                        'Only the member who opened this leaderboard may control it.'
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

                        await menuInteraction.deferUpdate();

                        selectedPage =
                            requestedPage;

                        /*
                         * Refresh all datasets before changing
                         * pages so the latest progression,
                         * messages, Achievements and Titles
                         * are displayed.
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

                        await menuInteraction.editReply({
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
                                'Umbra could not open the selected ranking. Please reopen `/leaderboard` and try again.'
                            );

                        if (
                            menuInteraction.deferred
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

                        if (
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
                        'Check the PostgreSQL connection and Northflank logs if the problem continues.'
                    ].join(
                        '\n'
                    )
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