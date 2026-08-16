const {
    SlashCommandBuilder,
    MessageFlags,
    ActionRowBuilder,
    StringSelectMenuBuilder,
    StringSelectMenuOptionBuilder
} = require('discord.js');

const {
    createEmbed,
    createErrorEmbed
} = require('../../utils/embeds');

const embedConfig = require('../../config/embed');

const {
    TITLE_CATEGORIES,
    TITLE_DEFINITIONS,
    TITLE_UNLOCK_TYPES
} = require('../../config/titles');

const { titles: titleDatabase } = require('../../database');

const TITLE_MENU_PREFIX = 'titles_category_menu';
const OVERVIEW_PAGE_ID = 'titles_overview';

const TITLE_CATEGORY_ORDER = [
    TITLE_CATEGORIES.ACHIEVEMENT,
    TITLE_CATEGORIES.SIN_RANK,
    TITLE_CATEGORIES.STAFF
];

const CATEGORY_DETAILS = {
    [TITLE_CATEGORIES.ACHIEVEMENT]: {
        emoji: '🏆',
        label: 'Achievements',
        description: 'Titles earned through Soul Achievements'
    },

    [TITLE_CATEGORIES.SIN_RANK]: {
        emoji: '⚔️',
        label: 'Sin Ranks',
        description: 'Dominion and the Ten Sins'
    },

    [TITLE_CATEGORIES.STAFF]: {
        emoji: '🛡️',
        label: 'High Command',
        description: 'Titles held by THE Ⅹ SINS leadership'
    }
};

const RARITY_ORDER = [
    'Common',
    'Uncommon',
    'Rare',
    'Epic',
    'Legendary',
    'Mythic'
];

const RARITY_DETAILS = {
    Common: {
        emoji: '⚪',
        label: 'Common'
    },

    Uncommon: {
        emoji: '🟢',
        label: 'Uncommon'
    },

    Rare: {
        emoji: '🔵',
        label: 'Rare'
    },

    Epic: {
        emoji: '🟣',
        label: 'Epic'
    },

    Legendary: {
        emoji: '🟡',
        label: 'Legendary'
    },

    Mythic: {
        emoji: '🔴',
        label: 'Mythic'
    }
};

const TITLE_DEFINITION_MAP = new Map(
    TITLE_DEFINITIONS.map(
        title => [
            title.id,
            title
        ]
    )
);

function formatNumber(value) {
    const number = Number(value);

    return Number.isFinite(number)
        ? number.toLocaleString('en-US')
        : '0';
}

function formatDiscordDate(
    value,
    style = 'D'
) {
    if (!value) {
        return 'Not recorded';
    }

    const date = value instanceof Date
        ? value
        : new Date(value);

    if (Number.isNaN(date.getTime())) {
        return 'Not recorded';
    }

    return `<t:${Math.floor(date.getTime() / 1000)}:${style}>`;
}

function createProgressBar(
    percentage,
    length = 16
) {
    const safePercentage = Math.min(
        100,
        Math.max(
            0,
            Number(percentage) || 0
        )
    );

    const filled = Math.round(
        (safePercentage / 100) *
        length
    );

    return (
        '▰'.repeat(filled) +
        '▱'.repeat(length - filled)
    );
}

function calculateCompletion(
    unlocked,
    total
) {
    if (total <= 0) {
        return 0;
    }

    return Math.min(
        100,
        Math.round(
            (unlocked / total) *
            100
        )
    );
}

function getRarityDetails(rarity) {
    return RARITY_DETAILS[rarity] ?? {
        emoji: '⚪',
        label: rarity || 'Unknown'
    };
}

function normalizeUnlockedTitles(
    unlockedTitles
) {
    if (!Array.isArray(unlockedTitles)) {
        return [];
    }

    return unlockedTitles
        .filter(
            title =>
                TITLE_DEFINITION_MAP.has(
                    title.titleId
                )
        )
        .map(
            title => ({
                ...title,
                ...TITLE_DEFINITION_MAP.get(
                    title.titleId
                ),
                titleId:
                    title.titleId
            })
        );
}

function getUnlockedTitleIds(
    unlockedTitles
) {
    return new Set(
        unlockedTitles.map(
            title => title.titleId
        )
    );
}

function getCategoryTitles(category) {
    return TITLE_DEFINITIONS.filter(
        title =>
            title.category ===
            category
    );
}

function findActiveTitle(
    unlockedTitles
) {
    return (
        unlockedTitles.find(
            title => title.isActive
        ) ??
        null
    );
}

function findLatestTitle(
    unlockedTitles
) {
    return [...unlockedTitles].sort(
        (
            first,
            second
        ) =>
            new Date(
                second.unlockedAt || 0
            ).getTime() -
            new Date(
                first.unlockedAt || 0
            ).getTime()
    )[0] ?? null;
}

function formatUnlockRequirement(title) {
    const unlock = title.unlock ?? {};

    switch (unlock.type) {
        case TITLE_UNLOCK_TYPES.ACHIEVEMENT:
            return (
                `Earn the **${title.displayName}** Achievement.`
            );

        case TITLE_UNLOCK_TYPES.SIN_RANK:
            return (
                `Receive the **${unlock.rankName}** rank.`
            );

        case TITLE_UNLOCK_TYPES.STAFF_ROLE:
            return (
                `Hold the **${unlock.roleName}** role.`
            );

        default:
            return (
                'Unlock requirement unavailable.'
            );
    }
}

function createCategoryMenu(
    memberId,
    selectedPage
) {
    const menu = new StringSelectMenuBuilder()
        .setCustomId(
            `${TITLE_MENU_PREFIX}:${memberId}`
        )
        .setPlaceholder(
            'Select a Title archive'
        )
        .addOptions(
            new StringSelectMenuOptionBuilder()
                .setLabel(
                    'Collection Overview'
                )
                .setDescription(
                    'View the complete Title collection'
                )
                .setEmoji('📖')
                .setValue(
                    OVERVIEW_PAGE_ID
                )
                .setDefault(
                    selectedPage ===
                    OVERVIEW_PAGE_ID
                )
        );    for (
        const category
        of TITLE_CATEGORY_ORDER
    ) {
        const details =
            CATEGORY_DETAILS[category];

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

function createTitlesEmbed(
    interaction,
    member,
    title,
    description
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

        description: [
            description,
            '',
            embedConfig.branding.divider,
            '',
            '*Every earned designation is preserved within the Soul Archives.*'
        ].join('\n'),

        color:
            embedConfig.colors.title,

        thumbnail:
            avatarURL,

        author: {
            name:
                `${member.displayName} • Title Archives`,

            iconURL:
                avatarURL
        },

        footer: {
            text:
                `THE Ⅹ SINS • Titles • Opened by ${interaction.user.username}`,

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

function formatCategoryProgress(
    category,
    unlockedTitleIds
) {
    const details =
        CATEGORY_DETAILS[category];

    const titles =
        getCategoryTitles(category);

    const unlocked =
        titles.filter(
            title =>
                unlockedTitleIds.has(
                    title.id
                )
        ).length;

    const completion =
        calculateCompletion(
            unlocked,
            titles.length
        );

    return [
        `${details.emoji} **${details.label}**`,
        `\`${createProgressBar(completion, 8)}\` **${completion}%**`,
        `-# ${unlocked} / ${titles.length} unlocked`
    ].join('\n');
}

function formatRarityProgress(
    rarity,
    unlockedTitleIds
) {
    const details =
        getRarityDetails(rarity);

    const titles =
        TITLE_DEFINITIONS.filter(
            title =>
                title.rarity ===
                rarity
        );

    if (titles.length === 0) {
        return null;
    }

    const unlocked =
        titles.filter(
            title =>
                unlockedTitleIds.has(
                    title.id
                )
        ).length;

    const completion =
        calculateCompletion(
            unlocked,
            titles.length
        );

    return [
        `${details.emoji} **${details.label}**`,
        `\`${createProgressBar(completion, 8)}\` **${completion}%**`,
        `-# ${unlocked} / ${titles.length} unlocked`
    ].join('\n');
}

function buildOverviewPage(
    interaction,
    member,
    unlockedTitles
) {
    const unlockedTitleIds =
        getUnlockedTitleIds(
            unlockedTitles
        );

    const activeTitle =
        findActiveTitle(
            unlockedTitles
        );

    const latestTitle =
        findLatestTitle(
            unlockedTitles
        );

    const completion =
        calculateCompletion(
            unlockedTitles.length,
            TITLE_DEFINITIONS.length
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
            .filter(Boolean)
            .join('\n\n');

    return createTitlesEmbed(
        interaction,
        member,
        '📖 Title Archives',
        [
            `Every designation earned by **${member.displayName}**.`,
            '',
            '**Active Title**',

            activeTitle
                ? `> ${activeTitle.displayName}`
                : '> *No active Title*',

            '',
            '**Collection Progress**',
            `\`${createProgressBar(completion, 18)}\` **${completion}%**`,
            `-# ${unlockedTitles.length} / ${TITLE_DEFINITIONS.length} Titles unlocked`,
            '',
            '**Latest Unlock**',

            latestTitle
                ? `> ${latestTitle.displayName} • ${formatDiscordDate(
                    latestTitle.unlockedAt,
                    'R'
                )}`
                : '> *No Titles unlocked yet.*'
        ].join('\n')
    ).addFields(
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

function buildCategoryPage(
    interaction,
    member,
    unlockedTitles,
    category
) {
    const details =
        CATEGORY_DETAILS[category];

    const titles =
        getCategoryTitles(category);

    const unlockedTitleIds =
        getUnlockedTitleIds(
            unlockedTitles
        );

    const unlockedCount =
        titles.filter(
            title =>
                unlockedTitleIds.has(
                    title.id
                )
        ).length;

    const completion =
        calculateCompletion(
            unlockedCount,
            titles.length
        );

    const fields =
        titles.map(
            title => {
                const unlocked =
                    unlockedTitleIds.has(
                        title.id
                    );

                const rarity =
                    getRarityDetails(
                        title.rarity
                    );

                return {
                    name: [
                        unlocked
                            ? '✅'
                            : '🔒',

                        rarity.emoji,
                        title.displayName
                    ].join(' ')
                        .slice(
                            0,
                            256
                        ),

                    value: [
                        title.description,

                        unlocked
                            ? '✅ Unlocked'
                            : `🔒 ${formatUnlockRequirement(
                                title
                            )}`
                    ].join('\n')
                        .slice(
                            0,
                            1024
                        ),

                    inline:
                        false
                };
            }
        );

    return createTitlesEmbed(
        interaction,
        member,
        `${details.emoji} ${details.label}`,
        [
            details.description,
            '',
            `\`${createProgressBar(completion, 18)}\` **${completion}%**`,
            `-# ${unlockedCount} / ${titles.length} unlocked`
        ].join('\n')
    ).addFields(
        fields
    );
}

function buildTitlesPage(
    interaction,
    member,
    unlockedTitles,
    page
) {
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
}function createTitlesResponse(
    interaction,
    member,
    unlockedTitles,
    page
) {
    const knownTitles =
        normalizeUnlockedTitles(
            unlockedTitles
        );

    return {
        embeds: [
            buildTitlesPage(
                interaction,
                member,
                knownTitles,
                page
            )
        ],

        components: [
            createCategoryMenu(
                member.id,
                page
            )
        ]
    };
}

async function resolveTargetMember(
    interaction
) {
    const user =
        interaction.options.getUser(
            'user'
        );

    if (!user) {
        return interaction.member;
    }

    return interaction.guild
        .members
        .fetch(
            user.id
        )
        .catch(
            () => null
        );
}

async function sendTitlesError(
    interaction,
    message
) {
    const embed =
        createErrorEmbed(
            'Title Archives',
            message
        );

    if (interaction.deferred) {
        await interaction.editReply({
            embeds: [
                embed
            ],

            components:
                []
        });

        return;
    }

    if (interaction.replied) {
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

async function handleTitlesInteraction(
    interaction
) {
    if (
        !interaction.isStringSelectMenu() ||
        !interaction.customId.startsWith(
            `${TITLE_MENU_PREFIX}:`
        )
    ) {
        return false;
    }

    try {
        const memberId =
            interaction.customId.slice(
                TITLE_MENU_PREFIX.length +
                1
            );

        const member =
            await interaction.guild
                .members
                .fetch(
                    memberId
                );

        const unlockedTitles =
            await titleDatabase
                .getSoulTitles(
                    interaction.guild.id,
                    member.id
                );

        const selectedPage =
            interaction.values?.[0] ??
            OVERVIEW_PAGE_ID;

        await interaction.update(
            createTitlesResponse(
                interaction,
                member,
                unlockedTitles,
                selectedPage
            )
        );

        return true;
    } catch (error) {
        console.error(
            '❌ THE Ⅹ SINS Titles interaction error:',
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
                    '❌ The Title archive could not be updated.'
            }).catch(
                () => null
            );
        }

        return true;
    }
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
                'View THE Ⅹ SINS Titles and collection progress.'
            )
            .addUserOption(
                option =>
                    option
                        .setName(
                            'user'
                        )
                        .setDescription(
                            'View another member\'s Titles.'
                        )
                        .setRequired(
                            false
                        )
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
                    'The requested member could not be found.'
                );

                return;
            }

            const unlockedTitles =
                await titleDatabase
                    .getSoulTitles(
                        interaction.guild.id,
                        member.id
                    );

            await interaction.reply(
                createTitlesResponse(
                    interaction,
                    member,
                    unlockedTitles,
                    OVERVIEW_PAGE_ID
                )
            );
        } catch (error) {
            console.error(
                '❌ THE Ⅹ SINS /titles command error:',
                error
            );

            await sendTitlesError(
                interaction,
                'The Title archive could not be opened.'
            ).catch(
                () => null
            );
        }
    },

    handleTitlesInteraction
};