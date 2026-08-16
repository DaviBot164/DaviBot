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
 * Chronicle Title category menu.
 */
const TITLE_CATEGORY_MENU_ID =
    'titles_category_menu';

/**
 * Collection overview page.
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
    TITLE_CATEGORIES.SIN_RANK,
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
            'Titles unlocked through Soul Achievements'
    },

    [TITLE_CATEGORIES.EVOLUTION]: {
        emoji:
            '👁️',

        label:
            'Evolution',

        description:
            'Hollow Evolution Titles'
    },

    [TITLE_CATEGORIES.SIN_RANK]: {
        emoji:
            '⚔️',

        label:
            'Sin Ranks',

        description:
            'Titles belonging to the Ten Sins'
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
 * Format a number with readable
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
 * Convert unlocked Soul Titles
 * into a Set containing their IDs.
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
 * Get every configured Title
 * belonging to one category.
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
 * Count total Titles belonging
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
 * Calculate collection completion.
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
}/**
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

        case TITLE_UNLOCK_TYPES.SIN_RANK:
            return (
                `Receive the Sin Rank **${unlock.rankName}**.`
            );

        case TITLE_UNLOCK_TYPES.STAFF_ROLE:
            return (
                `Hold the High Command role **${unlock.roleName}**.`
            );

        case TITLE_UNLOCK_TYPES.EVENT:
            if (
                unlock.eventRequirement ===
                'WINNER'
            ) {
                return (
                    'Win an official THE Ⅹ SINS event.'
                );
            }

            return (
                'Participate in an official THE Ⅹ SINS event.'
            );

        case TITLE_UNLOCK_TYPES.MANUAL:
            return (
                'Receive this Title directly from the High Command.'
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
                'View active Title and collection progress'
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
                `THE Ⅹ SINS • Chronicle Titles • Opened by ${interaction.user.username}`,

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
}

/**
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
}/**
 * Build the Collection Overview page.
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
    const unlockedTitleIds =
        createUnlockedTitleIdSet(
            unlockedTitles
        );

    const activeTitle =
        findActiveTitle(
            unlockedTitles
        );

    const latestTitle =
        findLatestUnlockedTitle(
            unlockedTitles
        );

    const totalTitles =
        TITLE_DEFINITIONS.length;

    const unlockedCount =
        unlockedTitles.length;

    const completion =
        calculateCompletion(
            unlockedCount,
            totalTitles
        );

    const categoryProgress =
        TITLE_CATEGORY_ORDER
            .map(
                category =>
                    formatCategoryProgress(
                        category,
                        unlockedTitleIds
                    )
            )
            .join('\n\n');

    const rarityProgress =
        RARITY_ORDER
            .map(
                rarity =>
                    formatRarityProgress(
                        rarity,
                        unlockedTitleIds
                    )
            )
            .join('\n\n');

    return createTitlesEmbed(
        interaction,
        member,

        '📖 Chronicle Title Archives',

        [
            `A record of every designation earned by **${member.displayName}**.`,

            '',

            `**Active Title**`,
            activeTitle
                ? `> ${activeTitle.displayName || activeTitle.name}`
                : '> *No active Title*',

            '',

            `**Collection Progress**`,
            `\`${createProgressBar(completion, 18)}\` **${completion}%**`,
            `-# ${formatNumber(unlockedCount)} / ${formatNumber(totalTitles)} Titles unlocked`,

            '',

            `**Latest Unlock**`,
            latestTitle
                ? `> ${latestTitle.displayName || latestTitle.name} • ${formatDiscordDate(latestTitle.unlockedAt, 'R')}`
                : '> *No Titles unlocked yet.*'
        ].join('\n'),

        embedConfig.colors.title
    )
        .addFields(
            {
                name:
                    '📚 Title Categories',

                value:
                    categoryProgress,

                inline:
                    false
            },

            {
                name:
                    '💎 Rarity Collection',

                value:
                    rarityProgress,

                inline:
                    false
            }
        );
}

/**
 * Build a category page.
 *
 * @param {import('discord.js').ChatInputCommandInteraction} interaction
 * @param {import('discord.js').GuildMember} member
 * @param {Object[]} unlockedTitles
 * @param {string} category
 * @returns {import('discord.js').EmbedBuilder}
 */
function buildCategoryPage(
    interaction,
    member,
    unlockedTitles,
    category
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

    const unlockedTitleIds =
        createUnlockedTitleIdSet(
            unlockedTitles
        );

    const unlockedCount =
        countUnlockedCategoryTitles(
            category,
            unlockedTitleIds
        );

    const completion =
        calculateCompletion(
            unlockedCount,
            categoryTitles.length
        );

    const titleRows =
        categoryTitles.length > 0
            ? categoryTitles
                .map(
                    title => {
                        const unlocked =
                            unlockedTitleIds.has(
                                title.id
                            );

                        const rarity =
                            getRarityDetails(
                                title.rarity
                            );

                        const status =
                            unlocked
                                ? '✅'
                                : '🔒';

                        return [
                            `${status} ${rarity.emoji} **${title.displayName || title.name}**`,
                            `-# ${title.description}`,
                            `-# ${unlocked ? 'Unlocked' : formatUnlockRequirement(title)}`
                        ].join('\n');
                    }
                )
                .join('\n\n')
            : '*No Titles are currently configured in this archive.*';

    return createTitlesEmbed(
        interaction,
        member,

        `${details.emoji} ${details.label} Titles`,

        [
            details.description,

            '',

            `\`${createProgressBar(completion, 18)}\` **${completion}%**`,

            `-# ${formatNumber(unlockedCount)} / ${formatNumber(categoryTitles.length)} unlocked`
        ].join('\n'),

        embedConfig.colors.title
    )
        .addFields({
            name:
                '📜 Chronicle Records',

            value:
                titleRows,

            inline:
                false
        });
}

/**
 * Build the user's unlocked Title archive.
 *
 * @param {import('discord.js').ChatInputCommandInteraction} interaction
 * @param {import('discord.js').GuildMember} member
 * @param {Object[]} unlockedTitles
 * @returns {import('discord.js').EmbedBuilder}
 */
function buildUnlockedTitlesPage(
    interaction,
    member,
    unlockedTitles
) {
    const activeTitle =
        findActiveTitle(
            unlockedTitles
        );

    const sortedTitles =
        [...unlockedTitles]
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
            );

    const rows =
        sortedTitles.length > 0
            ? sortedTitles
                .map(
                    title => {
                        const definition =
                            TITLE_DEFINITIONS.find(
                                configuredTitle =>
                                    configuredTitle.id ===
                                    title.titleId
                            );

                        const rarity =
                            getRarityDetails(
                                definition?.rarity
                            );

                        const active =
                            activeTitle?.titleId ===
                            title.titleId;

                        return [
                            `${active ? '⭐' : '📜'} ${rarity.emoji} **${title.displayName || title.name}**`,
                            `-# ${formatDiscordDate(title.unlockedAt, 'R')}`
                        ].join('\n');
                    }
                )
                .join('\n\n')
            : '*This Soul has not unlocked any Chronicle Titles yet.*';

    return createTitlesEmbed(
        interaction,
        member,

        '📜 Unlocked Chronicle Titles',

        [
            `**${member.displayName}** has unlocked **${formatNumber(unlockedTitles.length)}** Chronicle Title${unlockedTitles.length === 1 ? '' : 's'}.`,

            '',

            activeTitle
                ? `**Active:** ${activeTitle.displayName || activeTitle.name}`
                : '**Active:** *None*'
        ].join('\n'),

        embedConfig.colors.title
    )
        .addFields({
            name:
                'Soul Archive',

            value:
                rows,

            inline:
                false
        });
}

/**
 * Resolve the requested archive page.
 *
 * @param {import('discord.js').ChatInputCommandInteraction} interaction
 * @param {import('discord.js').GuildMember} member
 * @param {Object[]} unlockedTitles
 * @param {string} page
 * @returns {import('discord.js').EmbedBuilder}
 */
function buildTitlesPage(
    interaction,
    member,
    unlockedTitles,
    page
) {
    if (
        page ===
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
            page
        )
    ) {
        return buildCategoryPage(
            interaction,
            member,
            unlockedTitles,
            page
        );
    }

    return buildOverviewPage(
        interaction,
        member,
        unlockedTitles
    );
}

/**
 * Create the final response payload.
 *
 * @param {import('discord.js').ChatInputCommandInteraction} interaction
 * @param {import('discord.js').GuildMember} member
 * @param {Object[]} unlockedTitles
 * @param {string} page
 * @returns {{
 *     embeds: import('discord.js').EmbedBuilder[],
 *     components: ActionRowBuilder[]
 * }}
 */
function createTitlesResponse(
    interaction,
    member,
    unlockedTitles,
    page
) {
    return {
        embeds: [
            buildTitlesPage(
                interaction,
                member,
                unlockedTitles,
                page
            )
        ],

        components: [
            createCategoryMenu(
                page
            )
        ]
    };
}/**
 * Get the requested member.
 *
 * Falls back to the command user when
 * no user option was provided.
 *
 * @param {import('discord.js').ChatInputCommandInteraction} interaction
 * @returns {Promise<import('discord.js').GuildMember|null>}
 */
async function resolveTargetMember(
    interaction
) {
    const requestedUser =
        interaction.options.getUser(
            'user'
        );

    if (!requestedUser) {
        return interaction.member;
    }

    try {
        return await interaction.guild
            .members
            .fetch(
                requestedUser.id
            );
    } catch {
        return null;
    }
}

/**
 * Send a safe error response.
 *
 * @param {import('discord.js').ChatInputCommandInteraction} interaction
 * @param {string} message
 * @returns {Promise<void>}
 */
async function sendTitlesError(
    interaction,
    message
) {
    const embed =
        createErrorEmbed(
            'Chronicle Titles',
            message
        );

    if (
        interaction.deferred
    ) {
        await interaction.editReply({
            embeds: [
                embed
            ],

            components:
                []
        });

        return;
    }

    if (
        interaction.replied
    ) {
        await interaction.followUp({
            flags:
                MessageFlags.Ephemeral,

            embeds: [
                embed
            ]
        });

        return;
    }

    await interaction.reply({
        flags:
            MessageFlags.Ephemeral,

        embeds: [
            embed
        ]
    });
}

module.exports = {
    category:
        'information',

    data:
        new SlashCommandBuilder()
            .setName(
                'titles'
            )
            .setDescription(
                'View Chronicle Titles and Soul progression.'
            )
            .addUserOption(
                option =>
                    option
                        .setName(
                            'user'
                        )
                        .setDescription(
                            'View another Soul\'s Chronicle Titles.'
                        )
                        .setRequired(
                            false
                        )
            )
            .setDMPermission(
                false
            ),

    /**
     * Execute /titles.
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
                await sendTitlesError(
                    interaction,
                    'This command can only be used inside THE Ⅹ SINS.'
                );

                return;
            }

            const member =
                await resolveTargetMember(
                    interaction
                );

            if (!member) {
                await sendTitlesError(
                    interaction,
                    'The requested Soul could not be found.'
                );

                return;
            }

            const unlockedTitles =
                await titleDatabase
                    .getSoulTitles(
                        interaction.guild.id,
                        member.id
                    );

            const response =
                createTitlesResponse(
                    interaction,
                    member,
                    unlockedTitles,
                    OVERVIEW_PAGE_ID
                );

            await interaction.reply(
                response
            );
        } catch (error) {
            console.error(
                '❌ THE Ⅹ SINS /titles command error:',
                error
            );

            await sendTitlesError(
                interaction,
                'The Chronicle Title archive could not be opened.'
            ).catch(
                () => null
            );
        }
    }
};

/**
 * Handle Chronicle Title category
 * selection menus.
 *
 * This listener is intentionally exported
 * so index.js can route the interaction
 * through the central interaction handler.
 *
 * @param {import('discord.js').StringSelectMenuInteraction} interaction
 * @returns {Promise<boolean>}
 */
async function handleTitlesInteraction(
    interaction
) {
    if (
        !interaction.isStringSelectMenu()
    ) {
        return false;
    }

    if (
        interaction.customId !==
        TITLE_CATEGORY_MENU_ID
    ) {
        return false;
    }

    try {
        const member =
            await interaction.guild
                .members
                .fetch(
                    interaction.user.id
                );

        const unlockedTitles =
            await titleDatabase
                .getSoulTitles(
                    interaction.guild.id,
                    member.id
                );

        const selectedPage =
            interaction.values?.[0] ||
            OVERVIEW_PAGE_ID;

        const response =
            createTitlesResponse(
                interaction,
                member,
                unlockedTitles,
                selectedPage
            );

        await interaction.update(
            response
        );

        return true;
    } catch (error) {
        console.error(
            '❌ THE Ⅹ SINS Chronicle Titles interaction error:',
            error
        );

        if (
            !interaction.replied &&
            !interaction.deferred
        ) {
            await interaction.reply({
                flags:
                    MessageFlags.Ephemeral,

                content:
                    '❌ The Chronicle Title archive could not be updated.'
            }).catch(
                () => null
            );
        }

        return true;
    }
}

module.exports.handleTitlesInteraction =
    handleTitlesInteraction;