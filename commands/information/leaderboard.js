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

const DISPLAY_LIMIT = 10;
const QUERY_LIMIT = 30;
const MENU_TIMEOUT = 10 * 60 * 1000;

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

const PAGE_DETAILS = {
    [LEADERBOARD_PAGES.overview]: {
        emoji: '🏆',
        label: 'Overview',
        description:
            'View every THE Ⅹ SINS champion'
    },

    [LEADERBOARD_PAGES.levels]: {
        emoji: '⭐',
        label: 'Soul Levels',
        description:
            'Highest recorded Soul Levels'
    },

    [LEADERBOARD_PAGES.xp]: {
        emoji: '✨',
        label: 'Spiritual Power',
        description:
            'Members with the highest total XP'
    },

    [LEADERBOARD_PAGES.messages]: {
        emoji: '💬',
        label: 'Message Activity',
        description:
            'Most active recorded members'
    },

    [LEADERBOARD_PAGES.achievements]: {
        emoji: '🏆',
        label: 'Achievements',
        description:
            'Members with the most Achievements'
    },

    [LEADERBOARD_PAGES.titles]: {
        emoji: '🏷️',
        label: 'Titles',
        description:
            'Largest unlocked Title collections'
    }
};

const RANKING_DETAILS = {
    [LEADERBOARD_PAGES.levels]: {
        dataKey: 'levels',
        valueKey: 'level',
        participantKey: 'levels',
        title: '⭐ Soul Level Leaderboard',
        description:
            'Members ranked by their highest recorded Soul Level.',
        statusNote:
            'Bots and departed members are excluded.',
        fieldTitle:
            '⭐ Top Soul Levels',
        personalLabel:
            'Level',
        color:
            embedConfig.colors.archive
    },

    [LEADERBOARD_PAGES.xp]: {
        dataKey: 'xp',
        valueKey: 'xp',
        participantKey: 'xp',
        title:
            '✨ Spiritual Power Leaderboard',
        description:
            'Members ranked by their total Spiritual Power.',
        statusNote:
            'Spiritual Power is measured through recorded XP.',
        fieldTitle:
            '✨ Highest Spiritual Power',
        personalLabel:
            'Spiritual Power',
        color:
            embedConfig.colors.primary
    },

    [LEADERBOARD_PAGES.messages]: {
        dataKey: 'messages',
        valueKey: 'messageCount',
        participantKey: 'messages',
        title:
            '💬 Message Activity Leaderboard',
        description:
            'The most active recorded members of THE Ⅹ SINS.',
        statusNote:
            'Only recorded messages contribute to this ranking.',
        fieldTitle:
            '💬 Most Active Members',
        personalLabel:
            'Messages',
        color:
            embedConfig.colors.support
    },

    [LEADERBOARD_PAGES.achievements]: {
        dataKey: 'achievements',
        valueKey: 'achievementCount',
        participantKey: 'achievements',
        title:
            '🏆 Achievement Leaderboard',
        description:
            'Members ranked by their unlocked Achievements.',
        statusNote:
            'At least one Achievement is required.',
        fieldTitle:
            '🏆 Top Achievement Holders',
        personalLabel:
            'Achievements',
        color:
            embedConfig.colors.success
    },

    [LEADERBOARD_PAGES.titles]: {
        dataKey: 'titles',
        valueKey: 'titleCount',
        participantKey: 'titles',
        title:
            '🏷️ Title Leaderboard',
        description:
            'Members ranked by their unlocked Title collections.',
        statusNote:
            'Every unlocked Title contributes.',
        fieldTitle:
            '🏷️ Top Title Collectors',
        personalLabel:
            'Titles',
        color:
            embedConfig.colors.title
    }
};

const POSITION_MEDALS = {
    1: '🥇',
    2: '🥈',
    3: '🥉'
};

function formatNumber(value) {
    const number =
        Number(value);

    return Number.isFinite(number)
        ? number.toLocaleString('en-US')
        : '0';
}

function formatDiscordDate(
    value,
    style = 'R'
) {
    const date =
        value instanceof Date
            ? value
            : new Date(value);

    if (
        !value ||
        Number.isNaN(
            date.getTime()
        )
    ) {
        return 'Not recorded';
    }

    const timestamp =
        Math.floor(
            date.getTime() / 1000
        );

    return `<t:${timestamp}:${style}>`;
}

function createProgressBar(
    percentage,
    length = 10
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

function getPositionMedal(position) {
    return (
        POSITION_MEDALS[
            Number(position)
        ] ??
        `\`#${formatNumber(position)}\``
    );
}

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
                'Choose a leaderboard'
            )
            .setDisabled(disabled);

    for (
        const pageId
        of LEADERBOARD_PAGE_ORDER
    ) {
        const details =
            PAGE_DETAILS[pageId];

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
        .addComponents(menu);
}

function createLeaderboardEmbed({
    interaction,
    pageId,
    title,
    description,
    color
}) {
    const guildIcon =
        interaction.guild.iconURL({
            size: 1024,
            forceStatic: false
        });

    const botAvatar =
        interaction.client.user
            .displayAvatarURL({
                size: 256,
                forceStatic: false
            });

    return createEmbed({
        title,
        description,

        color:
            color ??
            embedConfig.colors.accent,

        thumbnail:
            guildIcon ?? botAvatar,

        author: {
            name:
                `${interaction.guild.name} • Leaderboards`,

            iconURL:
                guildIcon ?? botAvatar
        },

        footer: {
            text:
                `Page ${
                    LEADERBOARD_PAGE_ORDER.indexOf(
                        pageId
                    ) + 1
                } / ${LEADERBOARD_PAGE_ORDER.length} • Evelynn • THE Ⅹ SINS`,

            iconURL:
                botAvatar
        }
    });
}function prepareRows(
    guild,
    rows
) {
    if (!Array.isArray(rows)) {
        return [];
    }

    return rows
        .map(row => {
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
        })
        .filter(Boolean)
        .slice(0, DISPLAY_LIMIT);
}

async function loadLeaderboardData(
    guild,
    userId
) {
    await guild.members
        .fetch()
        .catch(() => null);

    const [
        levelRows,
        xpRows,
        messageRows,
        achievementRows,
        titleRows,
        personalLevel,
        personalXp,
        personalMessages,
        personalAchievements,
        personalTitles,
        levelCount,
        achievementCount,
        titleCount
    ] =
        await Promise.all([
            leaderboardDatabase
                .getLevelLeaderboard(
                    guild.id,
                    QUERY_LIMIT
                ),

            leaderboardDatabase
                .getXpLeaderboard(
                    guild.id,
                    QUERY_LIMIT
                ),

            leaderboardDatabase
                .getMessageLeaderboard(
                    guild.id,
                    QUERY_LIMIT
                ),

            leaderboardDatabase
                .getAchievementLeaderboard(
                    guild.id,
                    QUERY_LIMIT
                ),

            leaderboardDatabase
                .getTitleLeaderboard(
                    guild.id,
                    QUERY_LIMIT
                ),

            leaderboardDatabase
                .getLevelPosition(
                    guild.id,
                    userId
                ),

            leaderboardDatabase
                .getXpPosition(
                    guild.id,
                    userId
                ),

            leaderboardDatabase
                .getMessagePosition(
                    guild.id,
                    userId
                ),

            leaderboardDatabase
                .getAchievementPosition(
                    guild.id,
                    userId
                ),

            leaderboardDatabase
                .getTitlePosition(
                    guild.id,
                    userId
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

    const progressionCount =
        Number(levelCount || 0);

    return {
        levels:
            prepareRows(
                guild,
                levelRows
            ),

        xp:
            prepareRows(
                guild,
                xpRows
            ),

        messages:
            prepareRows(
                guild,
                messageRows
            ),

        achievements:
            prepareRows(
                guild,
                achievementRows
            ),

        titles:
            prepareRows(
                guild,
                titleRows
            ),

        personalPositions: {
            levels:
                personalLevel,

            xp:
                personalXp,

            messages:
                personalMessages,

            achievements:
                personalAchievements,

            titles:
                personalTitles
        },

        participantCounts: {
            levels:
                progressionCount,

            xp:
                progressionCount,

            messages:
                progressionCount,

            achievements:
                Number(
                    achievementCount || 0
                ),

            titles:
                Number(
                    titleCount || 0
                )
        }
    };
}

function calculateRelativePercentage(
    value,
    highestValue
) {
    if (
        Number(highestValue) <= 0
    ) {
        return 0;
    }

    return Math.min(
        100,
        Math.max(
            0,
            Math.round(
                (
                    Number(value || 0) /
                    Number(highestValue)
                ) *
                100
            )
        )
    );
}

function buildRankingHeader(row) {
    const position =
        Number(row.rank);

    if (
        position >= 1 &&
        position <= 3
    ) {
        const champion =
            position === 1
                ? ' • Champion'
                : '';

        return [
            `### ${getPositionMedal(position)} ${row.member.displayName}${champion}`,
            `${row.member}`
        ];
    }

    return [
        `${getPositionMedal(position)} **${row.member.displayName}** • ${row.member}`
    ];
}

function formatRankingEntry(
    row,
    pageId,
    highestValue
) {
    const details =
        RANKING_DETAILS[pageId];

    const percentage =
        calculateRelativePercentage(
            row[details.valueKey],
            highestValue
        );

    const lines = [
        ...buildRankingHeader(row)
    ];

    switch (pageId) {
        case LEADERBOARD_PAGES.levels:
            lines.push(
                `⭐ **Level:** \`${formatNumber(row.level)}\``,
                `✨ **XP:** \`${formatNumber(row.xp)}\``,
                `💬 **Messages:** \`${formatNumber(row.messageCount)}\``
            );
            break;

        case LEADERBOARD_PAGES.xp:
            lines.push(
                `✨ **Spiritual Power:** \`${formatNumber(row.xp)} XP\``,
                `⭐ **Level:** \`${formatNumber(row.level)}\``,
                `💬 **Messages:** \`${formatNumber(row.messageCount)}\``
            );
            break;

        case LEADERBOARD_PAGES.messages:
            lines.push(
                `💬 **Messages:** \`${formatNumber(row.messageCount)}\``,
                `⭐ **Level:** \`${formatNumber(row.level)}\``,
                `✨ **XP:** \`${formatNumber(row.xp)}\``
            );
            break;

        case LEADERBOARD_PAGES.achievements:
            lines.push(
                `🏆 **Achievements:** \`${formatNumber(row.achievementCount)}\``,
                `📅 **Latest Unlock:** ${
                    formatDiscordDate(
                        row.latestUnlockAt
                    )
                }`
            );
            break;

        case LEADERBOARD_PAGES.titles:
            lines.push(
                `🏷️ **Titles:** \`${formatNumber(row.titleCount)}\``,
                `👑 **Active Title:** ${
                    row.activeTitleDisplayName ??
                    'None'
                }`
            );

            if (row.activeTitleRarity) {
                lines.push(
                    `🌟 **Rarity:** ${row.activeTitleRarity}`
                );
            }

            lines.push(
                `📅 **Latest Unlock:** ${
                    formatDiscordDate(
                        row.latestUnlockAt
                    )
                }`
            );
            break;
    }

    lines.push(
        `\`${createProgressBar(
            percentage
        )}\` **${percentage}%**`
    );

    return lines.join('\n');
}

function splitEntries(
    entries,
    maxLength = 1000
) {
    const chunks = [];
    let current = '';

    for (const entry of entries) {
        const separator =
            current
                ? '\n\n━━━━━━━━━━━━\n\n'
                : '';

        const next =
            `${current}${separator}${entry}`;

        if (next.length > maxLength) {
            if (current) {
                chunks.push(current);
            }

            current =
                entry.slice(
                    0,
                    maxLength
                );
        } else {
            current = next;
        }
    }

    if (current) {
        chunks.push(current);
    }

    return chunks;
}

function addRankingFields(
    embed,
    title,
    entries
) {
    if (entries.length === 0) {
        embed.addFields({
            name:
                '🌑 No Ranked Members',

            value:
                'No current members are recorded in this ranking.'
        });

        return;
    }

    const chunks =
        splitEntries(entries);

    for (
        let index = 0;
        index < chunks.length;
        index += 1
    ) {
        embed.addFields({
            name:
                index === 0
                    ? title
                    : `${title} — Continued`,

            value:
                chunks[index]
        });
    }
}function formatPersonalPosition(
    position,
    pageId
) {
    if (!position) {
        return [
            '🌑 You are not currently ranked.',
            '',
            '-# Continue progressing to enter this leaderboard.'
        ].join('\n');
    }

    const details =
        RANKING_DETAILS[pageId];

    let value =
        `\`${formatNumber(
            position[details.valueKey]
        )}\``;

    if (
        pageId ===
        LEADERBOARD_PAGES.xp
    ) {
        value =
            `\`${formatNumber(
                position.xp
            )} XP\``;
    }

    return [
        `**Position:** \`#${formatNumber(position.rank)}\``,
        `**${details.personalLabel}:** ${value}`
    ].join('\n');
}

function buildOverviewPage({
    interaction,
    leaderboardData
}) {
    const topLevel =
        leaderboardData.levels[0];

    const topXp =
        leaderboardData.xp[0];

    const topMessages =
        leaderboardData.messages[0];

    const topAchievements =
        leaderboardData.achievements[0];

    const topTitles =
        leaderboardData.titles[0];

    const embed =
        createLeaderboardEmbed({
            interaction,

            pageId:
                LEADERBOARD_PAGES.overview,

            title:
                '🏆 THE Ⅹ SINS Leaderboards',

            description: [
                'The strongest and most accomplished members of THE Ⅹ SINS.',
                '',
                'Choose a ranking from the menu below.'
            ].join('\n'),

            color:
                '#6F42C1'
        });

    return embed.addFields(
        {
            name:
                '👑 Progression Champions',

            value: [
                topLevel
                    ? (
                        `🥇 **Highest Level:** ${topLevel.member}\n` +
                        `└ Level \`${formatNumber(topLevel.level)}\``
                    )
                    : '🥇 **Highest Level:** Not recorded',

                '',

                topXp
                    ? (
                        `✨ **Spiritual Power:** ${topXp.member}\n` +
                        `└ \`${formatNumber(topXp.xp)} XP\``
                    )
                    : '✨ **Spiritual Power:** Not recorded',

                '',

                topMessages
                    ? (
                        `💬 **Most Active:** ${topMessages.member}\n` +
                        `└ \`${formatNumber(topMessages.messageCount)} messages\``
                    )
                    : '💬 **Most Active:** Not recorded'
            ].join('\n')
        },

        {
            name:
                '🏆 Collection Champions',

            value: [
                topAchievements
                    ? (
                        `🏆 **Achievements:** ${topAchievements.member}\n` +
                        `└ \`${formatNumber(topAchievements.achievementCount)}\` unlocked`
                    )
                    : '🏆 **Achievements:** Not recorded',

                '',

                topTitles
                    ? (
                        `🏷️ **Title Collector:** ${topTitles.member}\n` +
                        `└ \`${formatNumber(topTitles.titleCount)}\` Titles`
                    )
                    : '🏷️ **Title Collector:** Not recorded'
            ].join('\n')
        },

        {
            name:
                '📊 Ranking Records',

            value: [
                `⭐ **Progression Members:** \`${
                    formatNumber(
                        leaderboardData
                            .participantCounts
                            .levels
                    )
                }\``,
                `🏆 **Achievement Members:** \`${
                    formatNumber(
                        leaderboardData
                            .participantCounts
                            .achievements
                    )
                }\``,
                `🏷️ **Title Collectors:** \`${
                    formatNumber(
                        leaderboardData
                            .participantCounts
                            .titles
                    )
                }\``
            ].join('\n'),

            inline:
                true
        },

        {
            name:
                '🌙 Available Rankings',

            value: [
                '⭐ Soul Levels',
                '✨ Spiritual Power',
                '💬 Message Activity',
                '🏆 Achievements',
                '🏷️ Titles'
            ].join('\n'),

            inline:
                true
        }
    );
}

function buildRankingPage(
    context,
    pageId
) {
    const {
        interaction,
        leaderboardData
    } = context;

    const details =
        RANKING_DETAILS[pageId];

    const rows =
        leaderboardData[
            details.dataKey
        ];

    const highestValue =
        rows.length > 0
            ? Math.max(
                ...rows.map(
                    row =>
                        Number(
                            row[
                                details.valueKey
                            ] || 0
                        )
                )
            )
            : 0;

    const embed =
        createLeaderboardEmbed({
            interaction,
            pageId,

            title:
                details.title,

            description:
                details.description,

            color:
                details.color
        });

    embed.addFields({
        name:
            '📊 Ranking Status',

        value: [
            `**Ranked Members:** \`${
                formatNumber(
                    leaderboardData
                        .participantCounts[
                            details.participantKey
                        ]
                )
            }\``,
            `**Displayed:** \`${
                formatNumber(
                    rows.length
                )
            }\``,
            '',
            `-# ${details.statusNote}`
        ].join('\n')
    });

    addRankingFields(
        embed,
        details.fieldTitle,
        rows.map(row =>
            formatRankingEntry(
                row,
                pageId,
                highestValue
            )
        )
    );

    embed.addFields({
        name:
            '🌙 Your Position',

        value:
            formatPersonalPosition(
                leaderboardData
                    .personalPositions[
                        details.dataKey
                    ],
                pageId
            )
    });

    return embed;
}

function buildLeaderboardPage(
    context,
    pageId
) {
    if (
        pageId ===
        LEADERBOARD_PAGES.overview
    ) {
        return buildOverviewPage(
            context
        );
    }

    if (
        RANKING_DETAILS[pageId]
    ) {
        return buildRankingPage(
            context,
            pageId
        );
    }

    return buildOverviewPage(
        context
    );
}

async function sendLeaderboardError(
    interaction,
    title,
    description
) {
    const payload = {
        embeds: [
            createErrorEmbed(
                title,
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
}module.exports = {
    category:
        'information',

    data:
        new SlashCommandBuilder()
            .setName('leaderboard')
            .setDescription(
                'Open THE Ⅹ SINS leaderboards.'
            )
            .setDMPermission(false),

    async execute(interaction) {
        try {
            if (!interaction.inGuild()) {
                await sendLeaderboardError(
                    interaction,
                    '❌ THE Ⅹ SINS Only Command',
                    'Leaderboards can only be opened inside THE Ⅹ SINS.'
                );

                return;
            }

            await interaction.deferReply();

            const leaderboardData =
                await loadLeaderboardData(
                    interaction.guild,
                    interaction.user.id
                );

            const context = {
                interaction,
                leaderboardData
            };

            let selectedPage =
                LEADERBOARD_PAGES.overview;

            const createPagePayload =
                (
                    pageId,
                    disabled = false
                ) => ({
                    embeds: [
                        buildLeaderboardPage(
                            context,
                            pageId
                        )
                    ],

                    components: [
                        createLeaderboardMenu(
                            pageId,
                            disabled
                        )
                    ]
                });

            const message =
                await interaction.editReply({
                    ...createPagePayload(
                        selectedPage
                    ),

                    fetchReply:
                        true
                });

            const collector =
                message
                    .createMessageComponentCollector({
                        componentType:
                            ComponentType.StringSelect,

                        filter:
                            component =>
                                component.customId ===
                                LEADERBOARD_MENU_ID,

                        time:
                            MENU_TIMEOUT
                    });

            collector.on(
                'collect',
                async component => {
                    try {
                        if (
                            component.user.id !==
                            interaction.user.id
                        ) {
                            await component.reply({
                                embeds: [
                                    createErrorEmbed(
                                        '❌ Private Leaderboard',
                                        'Only the member who opened this leaderboard may control it.'
                                    )
                                ],

                                flags:
                                    MessageFlags.Ephemeral
                            });

                            return;
                        }

                        const requestedPage =
                            component.values[0];

                        if (
                            !LEADERBOARD_PAGE_ORDER.includes(
                                requestedPage
                            )
                        ) {
                            await component.reply({
                                embeds: [
                                    createErrorEmbed(
                                        '❌ Unknown Ranking',
                                        'Evelynn could not recognize that leaderboard.'
                                    )
                                ],

                                flags:
                                    MessageFlags.Ephemeral
                            });

                            return;
                        }

                        selectedPage =
                            requestedPage;

                        await component.update(
                            createPagePayload(
                                selectedPage
                            )
                        );
                    } catch (error) {
                        console.error(
                            '❌ Evelynn /leaderboard navigation error:',
                            error
                        );

                        const payload = {
                            embeds: [
                                createErrorEmbed(
                                    '❌ Navigation Failed',
                                    'Evelynn could not open that leaderboard.'
                                )
                            ],

                            flags:
                                MessageFlags.Ephemeral
                        };

                        if (
                            component.replied ||
                            component.deferred
                        ) {
                            await component
                                .followUp(payload)
                                .catch(() => null);
                        } else {
                            await component
                                .reply(payload)
                                .catch(() => null);
                        }
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
                        [
                            'messageDelete',
                            'channelDelete',
                            'guildDelete'
                        ].includes(reason)
                    ) {
                        return;
                    }

                    await interaction
                        .editReply(
                            createPagePayload(
                                selectedPage,
                                true
                            )
                        )
                        .catch(() => null);
                }
            );
        } catch (error) {
            console.error(
                '❌ Evelynn /leaderboard command error:',
                error
            );

            await sendLeaderboardError(
                interaction,
                '❌ Leaderboards Unavailable',
                'Evelynn could not open THE Ⅹ SINS leaderboards.'
            );
        }
    }
};