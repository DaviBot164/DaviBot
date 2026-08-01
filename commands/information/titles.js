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

const {
    TITLE_CATEGORIES,
    TITLE_DEFINITIONS,
    TITLE_UNLOCK_TYPES
} = require('../../config/titles');

const {
    titles:
        titleDatabase
} = require('../../database');

/**
 * Select menu custom ID.
 */
const TITLE_CATEGORY_MENU_ID =
    'titles_category_menu';

/**
 * Overview page identifier.
 */
const OVERVIEW_PAGE_ID =
    'titles_overview';

/**
 * Category display order.
 */
const TITLE_CATEGORY_ORDER = [
    TITLE_CATEGORIES.GENERAL,
    TITLE_CATEGORIES.LEVEL,
    TITLE_CATEGORIES.ACHIEVEMENT,
    TITLE_CATEGORIES.EVOLUTION,
    TITLE_CATEGORIES.ARRANCAR,
    TITLE_CATEGORIES.ESPADA,
    TITLE_CATEGORIES.STAFF,
    TITLE_CATEGORIES.EVENT,
    TITLE_CATEGORIES.LEGENDARY
];

/**
 * Category display information.
 */
const CATEGORY_DETAILS = {
    [TITLE_CATEGORIES.GENERAL]: {
        emoji:
            '🌑',

        label:
            'General',

        description:
            'General Soul designations'
    },

    [TITLE_CATEGORIES.LEVEL]: {
        emoji:
            '⭐',

        label:
            'Progression',

        description:
            'Level and spiritual growth Titles'
    },

    [TITLE_CATEGORIES.ACHIEVEMENT]: {
        emoji:
            '🏆',

        label:
            'Achievements',

        description:
            'Titles unlocked through Soul Chronicles'
    },

    [TITLE_CATEGORIES.EVOLUTION]: {
        emoji:
            '👁️',

        label:
            'Evolution',

        description:
            'Hollow Evolution Titles'
    },

    [TITLE_CATEGORIES.ARRANCAR]: {
        emoji:
            '⚔️',

        label:
            'Arrancar',

        description:
            'Arrancar hierarchy Titles'
    },

    [TITLE_CATEGORIES.ESPADA]: {
        emoji:
            '👑',

        label:
            'Espada',

        description:
            'Titles belonging to the Espada thrones'
    },

    [TITLE_CATEGORIES.STAFF]: {
        emoji:
            '🛡️',

        label:
            'High Command',

        description:
            'Leadership and staff Titles'
    },

    [TITLE_CATEGORIES.EVENT]: {
        emoji:
            '🎮',

        label:
            'Events',

        description:
            'Titles earned through official events'
    },

    [TITLE_CATEGORIES.LEGENDARY]: {
        emoji:
            '🌙',

        label:
            'Legendary',

        description:
            'Rare and manually granted Titles'
    }
};

/**
 * Rarity display order.
 */
const RARITY_ORDER = [
    'Common',
    'Uncommon',
    'Rare',
    'Epic',
    'Legendary',
    'Mythic'
];

/**
 * Rarity display information.
 */
const RARITY_DETAILS = {
    Common: {
        emoji:
            '⚪',

        label:
            'Common',

        color:
            '#B8B8B8'
    },

    Uncommon: {
        emoji:
            '🟢',

        label:
            'Uncommon',

        color:
            '#57F287'
    },

    Rare: {
        emoji:
            '🔵',

        label:
            'Rare',

        color:
            '#5865F2'
    },

    Epic: {
        emoji:
            '🟣',

        label:
            'Epic',

        color:
            '#9B59B6'
    },

    Legendary: {
        emoji:
            '🟡',

        label:
            'Legendary',

        color:
            '#D4AF37'
    },

    Mythic: {
        emoji:
            '🔴',

        label:
            'Mythic',

        color:
            '#ED4245'
    }
};

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
    style = 'D'
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
            1000
        );

    return `<t:${unixTimestamp}:${style}>`;
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
    length = 16
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
 * Get rarity display information.
 *
 * @param {string|null|undefined} rarity
 * @returns {{
 *     emoji: string,
 *     label: string,
 *     color: string
 * }}
 */
function getRarityDetails(
    rarity
) {
    return (
        RARITY_DETAILS[
            rarity
        ] || {
            emoji:
                '⚪',

            label:
                rarity ||
                'Unknown',

            color:
                embedConfig.colors.title
        }
    );
}

/**
 * Convert unlocked Soul Titles into
 * a Set containing their Title IDs.
 *
 * @param {Object[]} unlockedTitles
 * @returns {Set<string>}
 */
function createUnlockedTitleIdSet(
    unlockedTitles
) {
    return new Set(
        unlockedTitles.map(
            title =>
                title.titleId
        )
    );
}

/**
 * Find the active Title.
 *
 * @param {Object[]} unlockedTitles
 * @returns {Object|null}
 */
function findActiveTitle(
    unlockedTitles
) {
    return (
        unlockedTitles.find(
            title =>
                title.isActive
        ) ||
        null
    );
}

/**
 * Find the most recently unlocked Title.
 *
 * @param {Object[]} unlockedTitles
 * @returns {Object|null}
 */
function findLatestUnlockedTitle(
    unlockedTitles
) {
    if (
        !Array.isArray(
            unlockedTitles
        ) ||
        unlockedTitles.length === 0
    ) {
        return null;
    }

    return [...unlockedTitles]
        .sort(
            (
                firstTitle,
                secondTitle
            ) =>
                new Date(
                    secondTitle.unlockedAt ||
                    0
                ).getTime() -
                new Date(
                    firstTitle.unlockedAt ||
                    0
                ).getTime()
        )[0] ||
        null;
}

/**
 * Get every configured Title belonging
 * to one category.
 *
 * @param {string} category
 * @returns {Object[]}
 */
function getCategoryTitles(
    category
) {
    return TITLE_DEFINITIONS.filter(
        title =>
            title.category ===
            category
    );
}

/**
 * Count unlocked Titles belonging
 * to one category.
 *
 * @param {string} category
 * @param {Set<string>} unlockedTitleIds
 * @returns {number}
 */
function countUnlockedCategoryTitles(
    category,
    unlockedTitleIds
) {
    return getCategoryTitles(
        category
    ).filter(
        title =>
            unlockedTitleIds.has(
                title.id
            )
    ).length;
}

/**
 * Count total configured Titles belonging
 * to one rarity.
 *
 * @param {string} rarity
 * @returns {number}
 */
function countTotalRarityTitles(
    rarity
) {
    return TITLE_DEFINITIONS.filter(
        title =>
            title.rarity ===
            rarity
    ).length;
}

/**
 * Count unlocked Titles belonging
 * to one rarity.
 *
 * @param {string} rarity
 * @param {Set<string>} unlockedTitleIds
 * @returns {number}
 */
function countUnlockedRarityTitles(
    rarity,
    unlockedTitleIds
) {
    return TITLE_DEFINITIONS.filter(
        title =>
            title.rarity ===
                rarity &&
            unlockedTitleIds.has(
                title.id
            )
    ).length;
}

/**
 * Calculate completion percentage.
 *
 * @param {number} unlocked
 * @param {number} total
 * @returns {number}
 */
function calculateCompletion(
    unlocked,
    total
) {
    if (
        total <=
        0
    ) {
        return 0;
    }

    return Math.min(
        100,
        Math.round(
            (
                unlocked /
                total
            ) *
            100
        )
    );
}

/**
 * Create readable unlock requirement text.
 *
 * @param {Object} title
 * @returns {string}
 */
function formatUnlockRequirement(
    title
) {
    const unlock =
        title?.unlock ||
        {};

    switch (
        unlock.type
    ) {
        case TITLE_UNLOCK_TYPES.DEFAULT:
            return (
                'Automatically granted to every recorded Soul.'
            );

        case TITLE_UNLOCK_TYPES.LEVEL:
            return (
                `Reach Soul Level **${formatNumber(unlock.level)}**.`
            );

        case TITLE_UNLOCK_TYPES.ACHIEVEMENT:
            return (
                `Unlock the Achievement \`${unlock.achievementId}\`.`
            );

        case TITLE_UNLOCK_TYPES.EVOLUTION:
            return (
                `Reach the Hollow Evolution stage **${unlock.roleName}**.`
            );

        case TITLE_UNLOCK_TYPES.ARRANCAR_RANK:
            return (
                `Receive the Arrancar Rank **${unlock.rankName}**.`
            );

        case TITLE_UNLOCK_TYPES.STAFF_ROLE:
            if (
                unlock.ownerFallback
            ) {
                return (
                    `Hold **${unlock.roleName}** or become the Ruler of Las Noches.`
                );
            }

            return (
                `Hold the High Command role **${unlock.roleName}**.`
            );

        case TITLE_UNLOCK_TYPES.EVENT:
            if (
                unlock.eventRequirement ===
                'WINNER'
            ) {
                return (
                    'Win an official Las Noches event.'
                );
            }

            return (
                'Participate in an official Las Noches event.'
            );

        case TITLE_UNLOCK_TYPES.MANUAL:
            return (
                'Receive this Title directly from the Las Noches High Command.'
            );

        default:
            return (
                'The unlock requirement is currently unavailable.'
            );
    }
}

/**
 * Create the category selection menu.
 *
 * @param {string} selectedPage
 * @param {boolean} disabled
 * @returns {ActionRowBuilder<StringSelectMenuBuilder>}
 */
function createCategoryMenu(
    selectedPage,
    disabled = false
) {
    const menu =
        new StringSelectMenuBuilder()
            .setCustomId(
                TITLE_CATEGORY_MENU_ID
            )
            .setPlaceholder(
                'Select a Chronicle Title archive'
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

    menu.addOptions(
        new StringSelectMenuOptionBuilder()
            .setLabel(
                'Collection Overview'
            )
            .setDescription(
                'View active Title and full collection progress'
            )
            .setEmoji(
                '📖'
            )
            .setValue(
                OVERVIEW_PAGE_ID
            )
            .setDefault(
                selectedPage ===
                OVERVIEW_PAGE_ID
            )
    );

    for (
        const category
        of TITLE_CATEGORY_ORDER
    ) {
        const details =
            CATEGORY_DETAILS[
                category
            ];

        menu.addOptions(
            new StringSelectMenuOptionBuilder()
                .setLabel(
                    details?.label ||
                    category
                )
                .setDescription(
                    details?.description ||
                    `${category} Titles`
                )
                .setEmoji(
                    details?.emoji ||
                    '📜'
                )
                .setValue(
                    category
                )
                .setDefault(
                    selectedPage ===
                    category
                )
        );
    }

    return new ActionRowBuilder()
        .addComponents(
            menu
        );
}

/**
 * Create the shared Chronicle Title Embed.
 *
 * @param {import('discord.js').ChatInputCommandInteraction} interaction
 * @param {import('discord.js').GuildMember} member
 * @param {string} title
 * @param {string} description
 * @param {string} color
 * @returns {import('discord.js').EmbedBuilder}
 */
function createTitlesEmbed(
    interaction,
    member,
    title,
    description,
    color =
        embedConfig.colors.title
) {
    const avatarURL =
        member.user.displayAvatarURL({
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
                '*Every earned designation is preserved permanently within the Soul Archives.*'
            ].join('\n'),

        color,

        thumbnail:
            avatarURL,

        author: {
            name:
                `${member.displayName} • Chronicle Title Archives`,

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
        }
    });
}/**
 * Format one rarity collection row.
 *
 * @param {string} rarity
 * @param {Set<string>} unlockedTitleIds
 * @returns {string}
 */
function formatRarityProgress(
    rarity,
    unlockedTitleIds
) {
    const details =
        getRarityDetails(
            rarity
        );

    const total =
        countTotalRarityTitles(
            rarity
        );

    const unlocked =
        countUnlockedRarityTitles(
            rarity,
            unlockedTitleIds
        );

    const percentage =
        calculateCompletion(
            unlocked,
            total
        );

    return [
        `${details.emoji} **${details.label}**`,
        `\`${createProgressBar(percentage, 10)}\` **${percentage}%**`,
        `-# ${formatNumber(unlocked)} / ${formatNumber(total)} Titles unlocked`
    ].join('\n');
}

/**
 * Format one category collection row.
 *
 * @param {string} category
 * @param {Set<string>} unlockedTitleIds
 * @returns {string}
 */
function formatCategoryProgress(
    category,
    unlockedTitleIds
) {
    const details =
        CATEGORY_DETAILS[
            category
        ] || {
            emoji:
                '📜',

            label:
                category,

            description:
                `${category} Titles`
        };

    const categoryTitles =
        getCategoryTitles(
            category
        );

    const unlockedCount =
        countUnlockedCategoryTitles(
            category,
            unlockedTitleIds
        );

    const percentage =
        calculateCompletion(
            unlockedCount,
            categoryTitles.length
        );

    return [
        `${details.emoji} **${details.label}**`,
        `\`${createProgressBar(percentage, 8)}\` **${percentage}%**`,
        `-# ${formatNumber(unlockedCount)} / ${formatNumber(categoryTitles.length)} unlocked`
    ].join('\n');
}

/**
 * Build the Chronicle Collection Overview.
 *
 * @param {import('discord.js').ChatInputCommandInteraction} interaction
 * @param {import('discord.js').GuildMember} member
 * @param {Object[]} unlockedTitles
 * @returns {import('discord.js').EmbedBuilder}
 */
function buildOverviewPage(
    interaction,
    member,
    unlockedTitles
) {
    const activeTitle =
        findActiveTitle(
            unlockedTitles
        );

    const latestTitle =
        findLatestUnlockedTitle(
            unlockedTitles
        );

    const unlockedTitleIds =
        createUnlockedTitleIdSet(
            unlockedTitles
        );

    const totalTitles =
        TITLE_DEFINITIONS.length;

    const unlockedCount =
        unlockedTitles.length;

    const lockedCount =
        Math.max(
            0,
            totalTitles -
            unlockedCount
        );

    const collectionPercentage =
        calculateCompletion(
            unlockedCount,
            totalTitles
        );

    const activeRarity =
        getRarityDetails(
            activeTitle?.rarity
        );

    const latestRarity =
        getRarityDetails(
            latestTitle?.rarity
        );

    const embed =
        createTitlesEmbed(
            interaction,
            member,
            '📖 Chronicle Title Collection',
            `Umbra has opened the complete Chronicle Title archive of ${member}.`,
            activeTitle
                ? activeRarity.color
                : embedConfig.colors.title
        );

    embed.addFields(
        {
            name:
                '👑 Active Chronicle Title',

            value:
                activeTitle
                    ? [
                        embedConfig
                            .branding
                            .divider,
                        '',
                        `## ${activeTitle.displayName}`,
                        '',
                        `${activeRarity.emoji} **${activeRarity.label}** • ${activeTitle.category}`,
                        '',
                        `-# ${activeTitle.description}`,
                        '',
                        `**Activated:** ${formatDiscordDate(activeTitle.activatedAt, 'F')}`,
                        '',
                        embedConfig
                            .branding
                            .divider
                    ].join('\n')
                    : [
                        '🌑 No active Chronicle Title is currently selected.',
                        '',
                        'Use `/settitle` after unlocking a new designation.'
                    ].join('\n'),

            inline:
                false
        },
        {
            name:
                '🏆 Chronicle Collection',

            value:
                [
                    `\`${createProgressBar(collectionPercentage, 18)}\` **${collectionPercentage}%**`,
                    '',
                    `🏷️ **Unlocked:** \`${formatNumber(unlockedCount)} / ${formatNumber(totalTitles)}\``,
                    `🔒 **Remaining:** \`${formatNumber(lockedCount)}\``,
                    `📈 **Collection Completion:** \`${collectionPercentage}%\``
                ].join('\n'),

            inline:
                false
        }
    );

    if (latestTitle) {
        embed.addFields({
            name:
                '📖 Latest Chronicle Unlock',

            value:
                [
                    `${latestRarity.emoji} **${latestTitle.displayName}**`,
                    `**Rarity:** ${latestRarity.label}`,
                    `**Category:** ${latestTitle.category}`,
                    `**Unlocked:** ${formatDiscordDate(latestTitle.unlockedAt, 'R')}`,
                    '',
                    `-# ${latestTitle.description}`
                ].join('\n'),

            inline:
                false
        });
    }

    const rarityRows =
        RARITY_ORDER.map(
            rarity =>
                formatRarityProgress(
                    rarity,
                    unlockedTitleIds
                )
        );

    const rarityChunks = [];

    let currentRarityChunk =
        '';

    for (
        const rarityRow
        of rarityRows
    ) {
        const nextChunk =
            currentRarityChunk
                ? `${currentRarityChunk}\n\n${rarityRow}`
                : rarityRow;

        if (
            nextChunk.length >
            1_000
        ) {
            if (currentRarityChunk) {
                rarityChunks.push(
                    currentRarityChunk
                );
            }

            currentRarityChunk =
                rarityRow;
        } else {
            currentRarityChunk =
                nextChunk;
        }
    }

    if (currentRarityChunk) {
        rarityChunks.push(
            currentRarityChunk
        );
    }

    rarityChunks.forEach(
        (
            chunk,
            index
        ) => {
            embed.addFields({
                name:
                    index === 0
                        ? '🌟 Rarity Collection'
                        : '🌟 Rarity Collection — Continued',

                value:
                    chunk,

                inline:
                    false
            });
        }
    );

    const categoryRows =
        TITLE_CATEGORY_ORDER.map(
            category =>
                formatCategoryProgress(
                    category,
                    unlockedTitleIds
                )
        );

    const categoryChunks = [];

    let currentCategoryChunk =
        '';

    for (
        const categoryRow
        of categoryRows
    ) {
        const nextChunk =
            currentCategoryChunk
                ? `${currentCategoryChunk}\n\n${categoryRow}`
                : categoryRow;

        if (
            nextChunk.length >
            1_000
        ) {
            if (currentCategoryChunk) {
                categoryChunks.push(
                    currentCategoryChunk
                );
            }

            currentCategoryChunk =
                categoryRow;
        } else {
            currentCategoryChunk =
                nextChunk;
        }
    }

    if (currentCategoryChunk) {
        categoryChunks.push(
            currentCategoryChunk
        );
    }

    categoryChunks.forEach(
        (
            chunk,
            index
        ) => {
            embed.addFields({
                name:
                    index === 0
                        ? '📚 Category Completion'
                        : '📚 Category Completion — Continued',

                value:
                    chunk,

                inline:
                    false
            });
        }
    );

    embed.addFields({
        name:
            '🧭 Recommended Workflow',

        value:
            [
                '`/titles` — inspect this collection',
                '`/settitle` — activate an unlocked Title',
                '`/soul` — view the active Title inside the complete Soul Record',
                '',
                '-# High Command may use `/granttitle` and `/revoketitle` for Manual or Event Titles.'
            ].join('\n'),

        inline:
            false
    });

    return embed;
}

/**
 * Format one unlocked Chronicle Title.
 *
 * @param {Object} titleDefinition
 * @param {Object|null} unlockedTitle
 * @returns {string}
 */
function formatUnlockedTitle(
    titleDefinition,
    unlockedTitle
) {
    const rarity =
        getRarityDetails(
            titleDefinition.rarity
        );

    const activeMarker =
        unlockedTitle?.isActive
            ? '👑 **ACTIVE TITLE**'
            : '✅ **UNLOCKED**';

    return [
        `${activeMarker}`,
        `### ${titleDefinition.displayName}`,
        `${rarity.emoji} **${rarity.label}** • ${titleDefinition.category}`,
        `**Unlocked:** ${formatDiscordDate(unlockedTitle?.unlockedAt, 'D')} (${formatDiscordDate(unlockedTitle?.unlockedAt, 'R')})`,
        `-# ${titleDefinition.description}`
    ].join('\n');
}

/**
 * Format one locked Chronicle Title.
 *
 * @param {Object} titleDefinition
 * @returns {string}
 */
function formatLockedTitle(
    titleDefinition
) {
    const rarity =
        getRarityDetails(
            titleDefinition.rarity
        );

    return [
        `🔒 **${titleDefinition.displayName}**`,
        `${rarity.emoji} **${rarity.label}**`,
        `**Requirement:** ${formatUnlockRequirement(titleDefinition)}`,
        `-# ${titleDefinition.description}`
    ].join('\n');
}

/**
 * Split formatted entries into safe
 * Discord Embed field values.
 *
 * @param {string[]} entries
 * @param {number} maxLength
 * @returns {string[]}
 */
function splitTitleEntries(
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
 * Build one Chronicle Title category page.
 *
 * @param {import('discord.js').ChatInputCommandInteraction} interaction
 * @param {import('discord.js').GuildMember} member
 * @param {string} category
 * @param {Object[]} unlockedTitles
 * @returns {import('discord.js').EmbedBuilder}
 */
function buildCategoryPage(
    interaction,
    member,
    category,
    unlockedTitles
) {
    const categoryDetails =
        CATEGORY_DETAILS[
            category
        ] || {
            emoji:
                '📜',

            label:
                category,

            description:
                `${category} Titles`
        };

    const categoryTitles =
        getCategoryTitles(
            category
        );

    const unlockedTitleMap =
        new Map(
            unlockedTitles.map(
                title => [
                    title.titleId,
                    title
                ]
            )
        );

    const unlockedCategoryTitles =
        categoryTitles.filter(
            title =>
                unlockedTitleMap.has(
                    title.id
                )
        );

    const lockedCategoryTitles =
        categoryTitles.filter(
            title =>
                !unlockedTitleMap.has(
                    title.id
                )
        );

    const categoryPercentage =
        calculateCompletion(
            unlockedCategoryTitles.length,
            categoryTitles.length
        );

    const embed =
        createTitlesEmbed(
            interaction,
            member,
            `${categoryDetails.emoji} ${categoryDetails.label} Chronicle Titles`,
            [
                categoryDetails.description,
                '',
                `This archive contains every configured **${categoryDetails.label}** designation.`
            ].join('\n'),
            categoryPercentage ===
                100
                ? embedConfig.colors.success
                : embedConfig.colors.title
        );

    embed.addFields({
        name:
            '📊 Category Collection',

        value:
            [
                `\`${createProgressBar(categoryPercentage, 16)}\` **${categoryPercentage}%**`,
                '',
                `✅ **Unlocked:** \`${formatNumber(unlockedCategoryTitles.length)}\``,
                `🔒 **Locked:** \`${formatNumber(lockedCategoryTitles.length)}\``,
                `📚 **Total:** \`${formatNumber(categoryTitles.length)}\``
            ].join('\n'),

        inline:
            false
    });

    if (
        unlockedCategoryTitles.length >
        0
    ) {
        const unlockedEntries =
            unlockedCategoryTitles.map(
                titleDefinition =>
                    formatUnlockedTitle(
                        titleDefinition,
                        unlockedTitleMap.get(
                            titleDefinition.id
                        )
                    )
            );

        const unlockedChunks =
            splitTitleEntries(
                unlockedEntries
            );

        unlockedChunks.forEach(
            (
                chunk,
                index
            ) => {
                embed.addFields({
                    name:
                        index === 0
                            ? '✅ Unlocked Chronicle Titles'
                            : '✅ Unlocked Chronicle Titles — Continued',

                    value:
                        chunk,

                    inline:
                        false
                });
            }
        );
    } else {
        embed.addFields({
            name:
                '✅ Unlocked Chronicle Titles',

            value:
                [
                    '🌑 No Titles from this category have been unlocked yet.',
                    '',
                    '-# Continue progressing through Las Noches to expand this collection.'
                ].join('\n'),

            inline:
                false
        });
    }

    if (
        lockedCategoryTitles.length >
        0
    ) {
        const lockedEntries =
            lockedCategoryTitles.map(
                formatLockedTitle
            );

        const lockedChunks =
            splitTitleEntries(
                lockedEntries
            );

        lockedChunks.forEach(
            (
                chunk,
                index
            ) => {
                embed.addFields({
                    name:
                        index === 0
                            ? '🔒 Locked Chronicle Titles'
                            : '🔒 Locked Chronicle Titles — Continued',

                    value:
                        chunk,

                    inline:
                        false
                });
            }
        );
    } else {
        embed.addFields({
            name:
                '🏆 Category Completed',

            value:
                [
                    'Every Title within this category has been unlocked.',
                    '',
                    `\`${createProgressBar(100, 16)}\` **100%**`,
                    '',
                    '-# This Chronicle collection is complete.'
                ].join('\n'),

            inline:
                false
        });
    }

    return embed;
}

/**
 * Build the requested Chronicle Title page.
 *
 * @param {import('discord.js').ChatInputCommandInteraction} interaction
 * @param {import('discord.js').GuildMember} member
 * @param {string} selectedPage
 * @param {Object[]} unlockedTitles
 * @returns {import('discord.js').EmbedBuilder}
 */
function buildTitlesPage(
    interaction,
    member,
    selectedPage,
    unlockedTitles
) {
    if (
        selectedPage ===
        OVERVIEW_PAGE_ID
    ) {
        return buildOverviewPage(
            interaction,
            member,
            unlockedTitles
        );
    }

    if (
        TITLE_CATEGORY_ORDER.includes(
            selectedPage
        )
    ) {
        return buildCategoryPage(
            interaction,
            member,
            selectedPage,
            unlockedTitles
        );
    }

    return buildOverviewPage(
        interaction,
        member,
        unlockedTitles
    );
}module.exports = {
    category:
        'information',

    data:
        new SlashCommandBuilder()
            .setName(
                'titles'
            )
            .setDescription(
                'Open a Soul’s interactive Chronicle Title collection.'
            )

            .addUserOption(option =>
                option
                    .setName(
                        'user'
                    )
                    .setDescription(
                        'Select the Soul whose Chronicle Title collection you want to view'
                    )
                    .setRequired(
                        false
                    )
            )

            .setDMPermission(
                false
            ),

    /**
     * Execute the /titles command.
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
                            'Chronicle Title collections can only be opened inside Las Noches.'
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

            /*
             * Guarantee that the default
             * Nameless Soul Title exists.
             */
            await titleDatabase
                .ensureDefaultSoulTitle(
                    interaction.guild.id,
                    member.id
                );

            let unlockedTitles =
                await titleDatabase
                    .getSoulTitles(
                        interaction.guild.id,
                        member.id
                    );

            let selectedPage =
                OVERVIEW_PAGE_ID;

            const initialEmbed =
                buildTitlesPage(
                    interaction,
                    member,
                    selectedPage,
                    unlockedTitles
                );

            const replyMessage =
                await interaction.editReply({
                    embeds: [
                        initialEmbed
                    ],

                    components: [
                        createCategoryMenu(
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
                                        '❌ Private Chronicle Archive',
                                        'Only the Soul who opened this Chronicle Title collection may control its navigation.'
                                    )
                                ],

                                flags:
                                    MessageFlags.Ephemeral
                            });

                            return;
                        }

                        if (
                            menuInteraction.customId !==
                            TITLE_CATEGORY_MENU_ID
                        ) {
                            return;
                        }

                        const requestedPage =
                            menuInteraction.values[0];

                        const validPage =
                            requestedPage ===
                                OVERVIEW_PAGE_ID ||
                            TITLE_CATEGORY_ORDER.includes(
                                requestedPage
                            );

                        if (!validPage) {
                            await menuInteraction.reply({
                                embeds: [
                                    createErrorEmbed(
                                        '❌ Unknown Chronicle Archive',
                                        'Umbra could not recognize the selected Chronicle Title category.'
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
                         * Reload the collection before
                         * each page change.
                         *
                         * Newly unlocked, revoked or
                         * activated Titles will appear
                         * without reopening /titles.
                         */
                        unlockedTitles =
                            await titleDatabase
                                .getSoulTitles(
                                    interaction.guild.id,
                                    member.id
                                );

                        const updatedEmbed =
                            buildTitlesPage(
                                interaction,
                                member,
                                selectedPage,
                                unlockedTitles
                            );

                        await menuInteraction.update({
                            embeds: [
                                updatedEmbed
                            ],

                            components: [
                                createCategoryMenu(
                                    selectedPage
                                )
                            ]
                        });
                    } catch (menuError) {
                        console.error(
                            '❌ Umbra /titles navigation error:',
                            menuError
                        );

                        const navigationErrorEmbed =
                            createErrorEmbed(
                                '❌ Chronicle Navigation Failed',
                                [
                                    'Umbra could not open the selected Chronicle Title archive.',
                                    '',
                                    'Please try opening `/titles` again.'
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
                                createCategoryMenu(
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
                '❌ Umbra /titles command error:',
                error
            );

            const errorEmbed =
                createErrorEmbed(
                    '❌ Chronicle Title Collection Unavailable',
                    [
                        'Umbra could not open the requested Chronicle Title collection.',
                        '',
                        'Please inspect the PostgreSQL connection and Northflank logs before trying again.'
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