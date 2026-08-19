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

const embedConfig =
    require('../../config/embed');

const {
    TITLE_CATEGORIES,
    TITLE_DEFINITIONS,
    TITLE_UNLOCK_TYPES
} = require('../../config/titles');

const {
    titles: titleDatabase
} = require('../../database');

const TITLE_MENU_PREFIX =
    'titles_category_menu';

const OVERVIEW_PAGE_ID =
    'titles_overview';

const TITLE_CATEGORY_ORDER = [
    TITLE_CATEGORIES.ACHIEVEMENT,
    TITLE_CATEGORIES.SIN_RANK,
    TITLE_CATEGORIES.STAFF
];

const CATEGORY_DETAILS = {
    [TITLE_CATEGORIES.ACHIEVEMENT]: {
        emoji: '🏆',
        label: 'Achievements',
        description:
            'Titles earned through Soul Achievements'
    },

    [TITLE_CATEGORIES.SIN_RANK]: {
        emoji: '⚔️',
        label: 'Captain Ranks',
        description:
            'Dominion and the Ten Sins'
    },

    [TITLE_CATEGORIES.STAFF]: {
        emoji: '🛡️',
        label: 'High Command',
        description:
            'Titles held by LUNAR SEIREITEI leadership'
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
    Common: [
        '⚪',
        'Common'
    ],

    Uncommon: [
        '🟢',
        'Uncommon'
    ],

    Rare: [
        '🔵',
        'Rare'
    ],

    Epic: [
        '🟣',
        'Epic'
    ],

    Legendary: [
        '🟡',
        'Legendary'
    ],

    Mythic: [
        '🔴',
        'Mythic'
    ]
};

const TITLE_DEFINITION_MAP =
    new Map(
        TITLE_DEFINITIONS.map(
            title => [
                title.id,
                title
            ]
        )
    );

function getRarityDetails(rarity) {
    const [emoji, label] =
        RARITY_DETAILS[rarity] ?? [
            '⚪',
            rarity || 'Unknown'
        ];

    return {
        emoji,
        label
    };
}

function formatDiscordDate(
    value,
    style = 'D'
) {
    const date =
        new Date(value);

    if (
        !value ||
        Number.isNaN(
            date.getTime()
        )
    ) {
        return 'Not recorded';
    }

    return (
        `<t:${
            Math.floor(
                date.getTime() / 1000
            )
        }:${style}>`
    );
}

function calculateCompletion(
    unlocked,
    total
) {
    return total > 0
        ? Math.min(
            100,
            Math.round(
                (unlocked / total) *
                100
            )
        )
        : 0;
}

function createProgressBar(
    percentage,
    length = 8
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
        '▰'.repeat(filled) +
        '▱'.repeat(
            length - filled
        )
    );
}

function normalizeUnlockedTitles(titles) {
    if (!Array.isArray(titles)) {
        return [];
    }

    return titles
        .filter(title =>
            TITLE_DEFINITION_MAP.has(
                title.titleId
            )
        )
        .map(title => ({
            ...title,
            ...TITLE_DEFINITION_MAP.get(
                title.titleId
            ),
            titleId:
                title.titleId
        }));
}

function getCategoryTitles(category) {
    return TITLE_DEFINITIONS.filter(
        title =>
            title.category ===
            category
    );
}

function formatUnlockRequirement(title) {
    const unlock =
        title.unlock ?? {};

    switch (unlock.type) {
        case TITLE_UNLOCK_TYPES
            .ACHIEVEMENT:
            return (
                `Earn the **${title.displayName}** Achievement.`
            );

        case TITLE_UNLOCK_TYPES
            .SIN_RANK:
            return (
                `Receive the **${unlock.rankName}** rank.`
            );

        case TITLE_UNLOCK_TYPES
            .STAFF_ROLE:
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
    viewerId,
    memberId,
    selectedPage
) {
    const menu =
        new StringSelectMenuBuilder()
            .setCustomId(
                `${TITLE_MENU_PREFIX}:${viewerId}:${memberId}`
            )
            .setPlaceholder(
                'Select a Title page'
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
            );

    for (
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
        .addComponents(menu);
}

function createTitlesEmbed(
    interaction,
    member,
    title,
    description
) {
    const avatarURL =
        member.user.displayAvatarURL({
            extension: 'png',
            size: 1024,
            forceStatic: false
        });

    return createEmbed({
        title,
        description,

        color:
            embedConfig.colors.title,

        thumbnail:
            avatarURL,

        author: {
            name:
                `${member.displayName} • Titles`,

            iconURL:
                avatarURL
        },

        footer: {
            text:
                `LUNAR SEIREITEI • Titles • Opened by ${interaction.user.username}`,

            iconURL:
                interaction.client.user
                    .displayAvatarURL({
                        size: 128,
                        forceStatic: false
                    })
        }
    });
}function formatCategoryProgress(
    category,
    unlockedIds
) {
    const details =
        CATEGORY_DETAILS[category];

    const titles =
        getCategoryTitles(category);

    const unlocked =
        titles.filter(
            title =>
                unlockedIds.has(
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
        `\`${createProgressBar(completion)}\` **${completion}%**`,
        `-# ${unlocked} / ${titles.length} unlocked`
    ].join('\n');
}

function formatRarityProgress(
    rarity,
    unlockedIds
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
                unlockedIds.has(
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
        `\`${createProgressBar(completion)}\` **${completion}%**`,
        `-# ${unlocked} / ${titles.length} unlocked`
    ].join('\n');
}

function buildOverviewPage(
    interaction,
    member,
    unlockedTitles
) {
    const unlockedIds =
        new Set(
            unlockedTitles.map(
                title =>
                    title.titleId
            )
        );

    const activeTitle =
        unlockedTitles.find(
            title =>
                title.isActive
        ) ?? null;

    const latestTitle =
        [...unlockedTitles]
            .sort(
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

    const completion =
        calculateCompletion(
            unlockedTitles.length,
            TITLE_DEFINITIONS.length
        );

    const categoryProgress =
        TITLE_CATEGORY_ORDER
            .map(category =>
                formatCategoryProgress(
                    category,
                    unlockedIds
                )
            )
            .join('\n\n');

    const rarityProgress =
        RARITY_ORDER
            .map(rarity =>
                formatRarityProgress(
                    rarity,
                    unlockedIds
                )
            )
            .filter(Boolean)
            .join('\n\n');

    return createTitlesEmbed(
        interaction,
        member,
        '📖 Title Collection',
        [
            `Titles unlocked by **${member.displayName}**.`,
            '',
            '**Active Title**',

            activeTitle
                ? `> ${activeTitle.displayName}`
                : '> *No active Title*',

            '',
            '**Collection Progress**',
            `\`${createProgressBar(
                completion,
                18
            )}\` **${completion}%**`,
            `-# ${unlockedTitles.length} / ${TITLE_DEFINITIONS.length} Titles unlocked`,
            '',
            '**Latest Unlock**',

            latestTitle
                ? (
                    `> ${latestTitle.displayName} • ` +
                    formatDiscordDate(
                        latestTitle.unlockedAt,
                        'R'
                    )
                )
                : '> *No Titles unlocked yet.*'
        ].join('\n')
    ).addFields(
        {
            name:
                '📚 Title Categories',

            value:
                categoryProgress
        },
        {
            name:
                '💎 Rarity Collection',

            value:
                rarityProgress
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

    const unlockedIds =
        new Set(
            unlockedTitles.map(
                title =>
                    title.titleId
            )
        );

    const unlockedCount =
        titles.filter(
            title =>
                unlockedIds.has(
                    title.id
                )
        ).length;

    const completion =
        calculateCompletion(
            unlockedCount,
            titles.length
        );

    const fields =
        titles.map(title => {
            const unlocked =
                unlockedIds.has(
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
                ]
                    .join(' ')
                    .slice(0, 256),

                value: [
                    title.description,

                    unlocked
                        ? '✅ Unlocked'
                        : (
                            `🔒 ${
                                formatUnlockRequirement(
                                    title
                                )
                            }`
                        )
                ]
                    .join('\n')
                    .slice(0, 1024)
            };
        });

    return createTitlesEmbed(
        interaction,
        member,
        `${details.emoji} ${details.label}`,
        [
            details.description,
            '',
            `\`${createProgressBar(
                completion,
                18
            )}\` **${completion}%**`,
            `-# ${unlockedCount} / ${titles.length} unlocked`
        ].join('\n')
    ).addFields(fields);
}

function createTitlesResponse(
    interaction,
    member,
    unlockedTitles,
    page
) {
    const knownTitles =
        normalizeUnlockedTitles(
            unlockedTitles
        );

    const selectedPage =
        TITLE_CATEGORY_ORDER.includes(
            page
        )
            ? page
            : OVERVIEW_PAGE_ID;

    const embed =
        selectedPage ===
        OVERVIEW_PAGE_ID
            ? buildOverviewPage(
                interaction,
                member,
                knownTitles
            )
            : buildCategoryPage(
                interaction,
                member,
                knownTitles,
                selectedPage
            );

    return {
        embeds: [
            embed
        ],

        components: [
            createCategoryMenu(
                interaction.user.id,
                member.id,
                selectedPage
            )
        ]
    };
}async function resolveTargetMember(
    interaction
) {
    const user =
        interaction.options.getUser(
            'user'
        );

    return user
        ? interaction.guild.members
            .fetch(user.id)
            .catch(() => null)
        : interaction.member;
}

async function sendTitlesError(
    interaction,
    description
) {
    const payload = {
        embeds: [
            createErrorEmbed(
                '❌ Titles Unavailable',
                description
            )
        ],

        components: []
    };

    if (interaction.deferred) {
        return interaction
            .editReply(payload)
            .catch(() => null);
    }

    if (interaction.replied) {
        return interaction
            .followUp({
                ...payload,

                flags:
                    MessageFlags.Ephemeral
            })
            .catch(() => null);
    }

    return interaction
        .reply({
            ...payload,

            flags:
                MessageFlags.Ephemeral
        })
        .catch(() => null);
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
        const [
            ,
            viewerId,
            memberId
        ] =
            interaction.customId
                .split(':');

        if (
            interaction.user.id !==
            viewerId
        ) {
            await interaction.reply({
                embeds: [
                    createErrorEmbed(
                        '❌ Private Title Menu',
                        'Only the member who opened this menu may control it.'
                    )
                ],

                flags:
                    MessageFlags.Ephemeral
            });

            return true;
        }

        const member =
            await interaction.guild
                .members
                .fetch(memberId);

        const unlockedTitles =
            await titleDatabase
                .getSoulTitles(
                    interaction.guild.id,
                    member.id
                );

        await interaction.update(
            createTitlesResponse(
                interaction,
                member,
                unlockedTitles,
                interaction.values[0] ??
                    OVERVIEW_PAGE_ID
            )
        );

        return true;
    } catch (error) {
        console.error(
            '❌ LUNAR SEIREITEI Titles interaction error:',
            error
        );

        if (
            !interaction.replied &&
            !interaction.deferred
        ) {
            await interaction
                .reply({
                    content:
                        '❌ The Title menu could not be updated.',

                    flags:
                        MessageFlags.Ephemeral
                })
                .catch(() => null);
        }

        return true;
    }
}

module.exports = {
    category: 'information',

    data:
        new SlashCommandBuilder()
            .setName('titles')
            .setDescription(
                'View LUNAR SEIREITEI Titles and collection progress.'
            )
            .addUserOption(option =>
                option
                    .setName('user')
                    .setDescription(
                        "View another member's Titles."
                    )
                    .setRequired(false)
            )
            .setDMPermission(false),

    async execute(interaction) {
        try {
            if (!interaction.inGuild()) {
                await sendTitlesError(
                    interaction,
                    'This command can only be used inside LUNAR SEIREITEI.'
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
                '❌ LUNAR SEIREITEI /titles command error:',
                error
            );

            await sendTitlesError(
                interaction,
                'The Title collection could not be opened.'
            );
        }
    },

    handleTitlesInteraction
};