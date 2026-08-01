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
 * Las Noches silver color.
 */
const LAS_NOCHES_COLOR =
    '#E8E8E8';

/**
 * Active Title gold color.
 */
const ACTIVE_TITLE_COLOR =
    '#D4AF37';

/**
 * Visual divider.
 */
const WIDE_DIVIDER =
    '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━';

/**
 * Select menu custom ID.
 */
const TITLE_CATEGORY_MENU_ID =
    'titles_category_menu';

/**
 * Overview page ID.
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
 * Rarity display information.
 */
const RARITY_DETAILS = {
    Common: {
        emoji:
            '⚪',

        label:
            'Common'
    },

    Uncommon: {
        emoji:
            '🟢',

        label:
            'Uncommon'
    },

    Rare: {
        emoji:
            '🔵',

        label:
            'Rare'
    },

    Epic: {
        emoji:
            '🟣',

        label:
            'Epic'
    },

    Legendary: {
        emoji:
            '🟡',

        label:
            'Legendary'
    },

    Mythic: {
        emoji:
            '🔴',

        label:
            'Mythic'
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
 * @returns {string}
 */
function formatDiscordDate(
    value
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

    return (
        `<t:${unixTimestamp}:D> ` +
        `(<t:${unixTimestamp}:R>)`
    );
}

/**
 * Get rarity display data.
 *
 * @param {string|null|undefined} rarity
 * @returns {{emoji: string, label: string}}
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
                'Unknown'
        }
    );
}

/**
 * Find one Title definition.
 *
 * @param {string} titleId
 * @returns {Object|null}
 */
function findTitleDefinition(
    titleId
) {
    return (
        TITLE_DEFINITIONS.find(
            title =>
                title.id ===
                titleId
        ) ||
        null
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
 * Find the active Title from a list
 * of unlocked Soul Titles.
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
 * Create readable unlock requirement text.
 *
 * @param {Object} title
 * @returns {string}
 */
function formatUnlockRequirement(
    title
) {
    const unlock =
        title?.unlock || {};

    switch (unlock.type) {
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
                    `Hold **${unlock.roleName}** or be the Ruler of Las Noches.`
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
                'Must be personally granted by the Las Noches High Command.'
            );

        default:
            return (
                'The unlock requirement is not currently available.'
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
                'Select a Title archive'
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
                'Title Overview'
            )
            .setDescription(
                'View active Title and archive progress'
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
 * Create the shared Titles embed.
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
    color = LAS_NOCHES_COLOR
) {
    const avatarURL =
        member.user.displayAvatarURL({
            size:
                1024,

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
                    WIDE_DIVIDER,
                    '',
                    '*Every earned designation is preserved within the eternal Soul Archives.*'
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
                            size:
                                128,

                            forceStatic:
                                false
                        })
            }
        });

    embed.setAuthor({
        name:
            `${member.displayName} • Title Archives`,

        iconURL:
            avatarURL
    });

    return embed;
}/**
 * Build the overview page.
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

    const progressPercent =
        totalTitles > 0
            ? Math.min(
                100,
                Math.floor(
                    (
                        unlockedCount /
                        totalTitles
                    ) *
                    100
                )
            )
            : 0;

    const embed =
        createTitlesEmbed(
            interaction,
            member,
            '📖 Soul Title Archives',
            `Umbra has opened the complete Title archive of ${member}.`,
            activeTitle
                ? ACTIVE_TITLE_COLOR
                : LAS_NOCHES_COLOR
        );

    embed.addFields(
        {
            name:
                '👑 Active Chronicle Title',

            value:
                activeTitle
                    ? [
                        `**${activeTitle.displayName}**`,
                        '',
                        `**Rarity:** ${getRarityDetails(activeTitle.rarity).emoji} ${getRarityDetails(activeTitle.rarity).label}`,
                        `**Category:** ${activeTitle.category}`,
                        `**Activated:** ${formatDiscordDate(activeTitle.activatedAt)}`,
                        '',
                        `-# ${activeTitle.description}`
                    ].join('\n')
                    : [
                        '🌑 No active Title is currently selected.',
                        '',
                        '-# Use `/settitle` after unlocking a Title.'
                    ].join('\n'),

            inline:
                false
        },
        {
            name:
                '📊 Archive Progress',

            value:
                [
                    `🏷️ **Titles Unlocked:** \`${formatNumber(unlockedCount)} / ${formatNumber(totalTitles)}\``,
                    `🔒 **Titles Locked:** \`${formatNumber(lockedCount)}\``,
                    `📈 **Archive Completion:** \`${progressPercent}%\``
                ].join('\n'),

            inline:
                false
        }
    );

    for (
        const category
        of TITLE_CATEGORY_ORDER
    ) {
        const categoryTitles =
            getCategoryTitles(
                category
            );

        const unlockedCategoryCount =
            countUnlockedCategoryTitles(
                category,
                unlockedTitleIds
            );

        const details =
            CATEGORY_DETAILS[
                category
            ] || {
                emoji:
                    '📜',

                label:
                    category
            };

        embed.addFields({
            name:
                `${details.emoji} ${details.label}`,

            value:
                [
                    `**Unlocked:** \`${formatNumber(unlockedCategoryCount)} / ${formatNumber(categoryTitles.length)}\``,
                    `-# ${details.description || 'Title category'}`
                ].join('\n'),

            inline:
                true
        });
    }

    return embed;
}

/**
 * Format one unlocked Title.
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
            ? '👑 **ACTIVE**'
            : '✅ **UNLOCKED**';

    return [
        `${activeMarker} • ${titleDefinition.displayName}`,
        `**Rarity:** ${rarity.emoji} ${rarity.label}`,
        `**Description:** ${titleDefinition.description}`,
        `**Unlocked:** ${formatDiscordDate(unlockedTitle?.unlockedAt)}`
    ].join('\n');
}

/**
 * Format one locked Title.
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
        `**Rarity:** ${rarity.emoji} ${rarity.label}`,
        `**Requirement:** ${formatUnlockRequirement(titleDefinition)}`
    ].join('\n');
}

/**
 * Build one Title category page.
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

    const embed =
        createTitlesEmbed(
            interaction,
            member,
            `${categoryDetails.emoji} ${categoryDetails.label} Titles`,
            categoryDetails.description
        );

    embed.addFields({
        name:
            '📊 Category Progress',

        value:
            [
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
                titleDefinition => {
                    const unlockedTitle =
                        unlockedTitleMap.get(
                            titleDefinition.id
                        );

                    return formatUnlockedTitle(
                        titleDefinition,
                        unlockedTitle
                    );
                }
            );

        embed.addFields({
            name:
                '✅ Unlocked Titles',

            value:
                unlockedEntries.join(
                    '\n\n━━━━━━━━━━━━━━━━━━━━\n\n'
                ),

            inline:
                false
        });
    } else {
        embed.addFields({
            name:
                '✅ Unlocked Titles',

            value:
                [
                    '🌑 No Titles from this category have been unlocked yet.',
                    '',
                    '-# Continue progressing through Las Noches to expand this archive.'
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

        embed.addFields({
            name:
                '🔒 Locked Titles',

            value:
                lockedEntries.join(
                    '\n\n━━━━━━━━━━━━━━━━━━━━\n\n'
                ),

            inline:
                false
        });
    } else {
        embed.addFields({
            name:
                '🏆 Category Completed',

            value:
                [
                    'Every Title within this category has been unlocked.',
                    '',
                    '-# This section of the Soul Archives is complete.'
                ].join('\n'),

            inline:
                false
        });
    }

    return embed;
}

/**
 * Build the requested Titles page.
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
                'Open a Soul’s unlocked and locked Title archives.'
            )

            .addUserOption(option =>
                option
                    .setName(
                        'user'
                    )
                    .setDescription(
                        'Select the Soul whose Title archives you want to view'
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
                            'This command can only be used inside Las Noches.'
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
             * Guarantee that the Soul owns
             * the default Nameless Soul Title.
             */
            await titleDatabase
                .ensureDefaultSoulTitle(
                    interaction.guild.id,
                    member.id
                );

            const unlockedTitles =
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
                            5 * 60 * 1000
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
                                        '❌ Private Title Archive',
                                        'Only the Soul who opened this Title archive may control its navigation.'
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
                                        '❌ Unknown Title Archive',
                                        'Umbra could not recognize the selected Title category.'
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
                         * Reload Titles before every
                         * page update so newly unlocked
                         * Titles appear without reopening
                         * the command.
                         */
                        const refreshedTitles =
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
                                refreshedTitles
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
                                '❌ Title Navigation Failed',
                                'Umbra could not open the selected section of the Title Archives.'
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
                async () => {
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
                    '❌ Title Archives Unavailable',
                    [
                        'Umbra could not open the requested Title archives.',
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