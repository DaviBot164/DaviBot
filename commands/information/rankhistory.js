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

const rankDatabase =
    require('../../database/ranks');

const rankConfig =
    require('../../config/ranks');

const HISTORY_MENU_ID =
    'umbra_rankhistory_menu';

const MENU_TIMEOUT =
    10 * 60 * 1000;

const HISTORY_PAGES = {
    overview:
        'overview',

    promotions:
        'promotions',

    removals:
        'removals',

    complete:
        'complete'
};

const HISTORY_PAGE_ORDER = [
    HISTORY_PAGES.overview,
    HISTORY_PAGES.promotions,
    HISTORY_PAGES.removals,
    HISTORY_PAGES.complete
];

const HISTORY_PAGE_DETAILS = {
    [HISTORY_PAGES.overview]: {
        label: 'Overview',
        emoji: '📜',
        description:
            'Current Sin Rank and recent history'
    },

    [HISTORY_PAGES.promotions]: {
        label: 'Promotions',
        emoji: '⬆️',
        description:
            'Previous Sin Rank assignments'
    },

    [HISTORY_PAGES.removals]: {
        label: 'Removals',
        emoji: '⬇️',
        description:
            'Previous Sin Rank removals'
    },

    [HISTORY_PAGES.complete]: {
        label: 'Complete Archive',
        emoji: '🗃️',
        description:
            'Complete recorded Sin Rank history'
    }
};

const CONFIGURED_RANKS =
    Object.entries(
        rankConfig.hierarchy
    ).map(
        (
            [
                key,
                rank
            ],
            index
        ) => ({
            ...rank,
            key,
            index
        })
    );

function formatTimestamp(
    value,
    style = 'R'
) {
    const date =
        new Date(value);

    if (
        !value ||
        Number.isNaN(
            date.getTime()
        )
    ) {
        return 'Unknown date';
    }

    const timestamp =
        Math.floor(
            date.getTime() / 1000
        );

    return `<t:${timestamp}:${style}>`;
}

function shorten(
    value,
    limit = 180
) {
    if (!value) {
        return 'No information recorded.';
    }

    const text =
        String(value)
            .replace(
                /\s+/g,
                ' '
            )
            .replace(
                /`/g,
                'ˋ'
            )
            .trim();

    return text.length <= limit
        ? text
        : (
            `${text.slice(
                0,
                limit - 3
            )}...`
        );
}

function getConfiguredRank(name) {
    if (!name) {
        return null;
    }

    return (
        CONFIGURED_RANKS.find(
            rank =>
                rank.name === name
        ) ?? null
    );
}

function formatRank(rankName) {
    if (!rankName) {
        return rankConfig
            .hierarchy
            .unranked
            .name;
    }

    return (
        getConfiguredRank(
            rankName
        )?.name ??
        rankName
    );
}

function classifyHistory(record) {
    const action =
        String(
            record?.action ?? ''
        ).toUpperCase();

    if (
        [
            'REMOVE',
            'REMOVED',
            'DEMOTION',
            'REVOKE'
        ].includes(action)
    ) {
        return 'removal';
    }

    if (
        [
            'SET',
            'ASSIGN',
            'PROMOTION'
        ].includes(action)
    ) {
        return 'promotion';
    }

    if (
        record?.new_rank &&
        !record?.old_rank
    ) {
        return 'promotion';
    }

    if (
        !record?.new_rank &&
        record?.old_rank
    ) {
        return 'removal';
    }

    return 'other';
}

function getHistoryTypeDetails(type) {
    switch (type) {
        case 'promotion':
            return {
                emoji: '⬆️',
                label: 'Rank Assigned'
            };

        case 'removal':
            return {
                emoji: '◇',
                label: 'Rank Removed'
            };

        default:
            return {
                emoji: '◆',
                label: 'Rank Changed'
            };
    }
}

function createRankHistoryMenu(
    selectedPage,
    disabled = false
) {
    const menu =
        new StringSelectMenuBuilder()
            .setCustomId(
                HISTORY_MENU_ID
            )
            .setPlaceholder(
                'Choose a Rank History page'
            )
            .setDisabled(disabled);

    for (
        const pageId
        of HISTORY_PAGE_ORDER
    ) {
        const details =
            HISTORY_PAGE_DETAILS[pageId];

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
                    pageId ===
                    selectedPage
                )
        );
    }

    return new ActionRowBuilder()
        .addComponents(menu);
}

function createRankHistoryEmbed({
    interaction,
    member,
    title,
    description,
    color = '#B026FF'
}) {
    const avatarURL =
        member.user
            .displayAvatarURL({
                size: 1024,
                forceStatic: false
            });

    return createEmbed({
        title,
        description,
        color,

        thumbnail:
            avatarURL,

        author: {
            name:
                `${member.displayName} • Sin Rank History`,

            iconURL:
                avatarURL
        },

        footer: {
            text:
                `THE Ⅹ SINS • Opened by ${interaction.user.username}`,

            iconURL:
                interaction.client.user
                    .displayAvatarURL({
                        size: 128,
                        forceStatic: false
                    })
        }
    });
}function formatHistoryEntry(
    entry,
    position
) {
    const details =
        getHistoryTypeDetails(
            classifyHistory(entry)
        );

    const oldRank =
        formatRank(
            entry?.old_rank
        );

    const newRank =
        formatRank(
            entry?.new_rank
        );

    const moderator =
        entry?.moderator_id
            ? `<@${entry.moderator_id}>`
            : 'Unknown';

    const rankChange =
        (
            entry?.old_rank ||
            entry?.new_rank
        )
            ? `${oldRank} → ${newRank}`
            : newRank;

    return [
        `### ${position}. ${details.emoji} ${details.label}`,
        `**Rank:** ${rankChange}`,
        `**High Command:** ${moderator}`,
        `**Reason:** ${
            shorten(
                entry?.reason,
                160
            )
        }`,
        `**Recorded:** ${
            formatTimestamp(
                entry?.created_at
            )
        }`,

        entry?.id
            ? (
                `-# Archive Record #${entry.id}`
            )
            : null
    ]
        .filter(Boolean)
        .join('\n');
}

function splitHistoryRecords(
    records,
    maxLength = 1000
) {
    const chunks = [];
    let current = '';

    for (const record of records) {
        const next =
            current
                ? `${current}\n\n${record}`
                : record;

        if (next.length > maxLength) {
            if (current) {
                chunks.push(current);
            }

            current =
                record.slice(
                    0,
                    maxLength
                );

            continue;
        }

        current = next;
    }

    if (current) {
        chunks.push(current);
    }

    return chunks;
}

function countHistoryType(
    history,
    type
) {
    return history.filter(
        entry =>
            classifyHistory(entry) ===
            type
    ).length;
}

function findHighestRank(
    history,
    currentRank
) {
    const rankNames = [];

    if (currentRank?.rank_name) {
        rankNames.push(
            currentRank.rank_name
        );
    }

    for (const entry of history) {
        if (entry?.old_rank) {
            rankNames.push(
                entry.old_rank
            );
        }

        if (entry?.new_rank) {
            rankNames.push(
                entry.new_rank
            );
        }
    }

    const configuredRanks =
        rankNames
            .map(getConfiguredRank)
            .filter(Boolean)
            .filter(
                rank =>
                    rank.key !==
                    'unranked'
            )
            .sort(
                (
                    first,
                    second
                ) =>
                    first.index -
                    second.index
            );

    if (configuredRanks.length > 0) {
        return configuredRanks[0].name;
    }

    return (
        rankNames[0] ??
        rankConfig.hierarchy
            .unranked.name
    );
}

function addHistoryFields(
    embed,
    history,
    firstFieldName
) {
    if (history.length === 0) {
        return embed;
    }

    const formatted =
        history.map(
            (
                entry,
                index
            ) =>
                formatHistoryEntry(
                    entry,
                    index + 1
                )
        );

    const chunks =
        splitHistoryRecords(
            formatted
        );

    for (
        let index = 0;
        index < chunks.length;
        index += 1
    ) {
        embed.addFields({
            name:
                index === 0
                    ? firstFieldName
                    : `${firstFieldName} — Continued`,

            value:
                chunks[index]
        });
    }

    return embed;
}

function buildOverviewPage(context) {
    const {
        interaction,
        member,
        currentRank,
        history,
        totalHistoryCount
    } = context;

    const currentRankName =
        formatRank(
            currentRank?.rank_name
        );

    const highestRank =
        findHighestRank(
            history,
            currentRank
        );

    const promotions =
        countHistoryType(
            history,
            'promotion'
        );

    const removals =
        countHistoryType(
            history,
            'removal'
        );

    const embed =
        createRankHistoryEmbed({
            interaction,
            member,

            title:
                '📖 Sin Rank Career',

            description:
                `${member} • recorded Sin Rank history.`
        });

    embed.addFields(
        {
            name:
                '⚔️ Current Rank',

            value:
                `**${currentRankName}**`,

            inline:
                true
        },

        {
            name:
                '♛ Highest Rank',

            value:
                `**${highestRank}**`,

            inline:
                true
        },

        {
            name:
                '📊 Archive',

            value: [
                `**Total:** \`${totalHistoryCount}\``,
                `**Promotions:** \`${promotions}\``,
                `**Removals:** \`${removals}\``
            ].join('\n'),

            inline:
                true
        }
    );

    if (currentRank?.assigned_at) {
        embed.addFields({
            name:
                '🕒 Current Rank Since',

            value:
                formatTimestamp(
                    currentRank.assigned_at,
                    'D'
                )
        });
    }

    const latest =
        history[0];

    if (latest) {
        const details =
            getHistoryTypeDetails(
                classifyHistory(latest)
            );

        embed.addFields({
            name:
                '📜 Latest Record',

            value: [
                `${details.emoji} **${details.label}**`,
                `**Rank:** ${
                    formatRank(
                        latest.old_rank
                    )
                } → ${
                    formatRank(
                        latest.new_rank
                    )
                }`,
                `**Recorded:** ${
                    formatTimestamp(
                        latest.created_at
                    )
                }`,
                `**Reason:** ${
                    shorten(
                        latest.reason
                    )
                }`
            ].join('\n')
        });
    }

    return embed;
}function buildFilteredPage(
    context,
    type
) {
    const isPromotion =
        type === 'promotion';

    const records =
        context.history.filter(
            entry =>
                classifyHistory(entry) ===
                type
        );

    const embed =
        createRankHistoryEmbed({
            interaction:
                context.interaction,

            member:
                context.member,

            title:
                isPromotion
                    ? '⬆️ Sin Rank Promotions'
                    : '◇ Sin Rank Removals',

            description:
                isPromotion
                    ? (
                        `${context.member} • previous ` +
                        'Sin Rank assignments.'
                    )
                    : (
                        `${context.member} • previous ` +
                        'Sin Rank removals.'
                    ),

            color:
                isPromotion
                    ? '#57F287'
                    : '#ED4245'
        });

    embed.addFields({
        name:
            '📊 Archive',

        value: [
            `**Matching Records:** \`${records.length}\``,
            `**Total Records:** \`${context.totalHistoryCount}\``
        ].join('\n')
    });

    if (records.length === 0) {
        embed.addFields({
            name:
                '◇ No Records',

            value:
                isPromotion
                    ? (
                        'No previous Sin Rank ' +
                        'assignments have been recorded.'
                    )
                    : (
                        'No previous Sin Rank ' +
                        'removals have been recorded.'
                    )
        });

        return embed;
    }

    return addHistoryFields(
        embed,
        records,
        '📜 Recorded Changes'
    );
}

function buildCompletePage(context) {
    const embed =
        createRankHistoryEmbed({
            interaction:
                context.interaction,

            member:
                context.member,

            title:
                '🗃️ Complete Sin Rank Archive',

            description:
                `${context.member} • complete recorded Sin Rank history.`
        });

    embed.addFields({
        name:
            '📊 Archive Status',

        value: [
            `**Loaded:** \`${context.history.length}\``,
            `**Total:** \`${context.totalHistoryCount}\``
        ].join('\n')
    });

    if (context.history.length === 0) {
        embed.addFields({
            name:
                '◇ Empty Archive',

            value:
                'No Sin Rank history has been recorded for this member.'
        });

        return embed;
    }

    return addHistoryFields(
        embed,
        context.history,
        '📜 Sin Rank Records'
    );
}

function buildRankHistoryPage(
    context,
    page
) {
    switch (page) {
        case HISTORY_PAGES.promotions:
            return buildFilteredPage(
                context,
                'promotion'
            );

        case HISTORY_PAGES.removals:
            return buildFilteredPage(
                context,
                'removal'
            );

        case HISTORY_PAGES.complete:
            return buildCompletePage(
                context
            );

        case HISTORY_PAGES.overview:
        default:
            return buildOverviewPage(
                context
            );
    }
}

async function resolveMember(interaction) {
    const user =
        interaction.options.getUser(
            'user'
        );

    if (!user) {
        return interaction.member;
    }

    return (
        interaction.guild.members
            .cache.get(user.id) ??
        await interaction.guild.members
            .fetch(user.id)
            .catch(() => null)
    );
}

function canViewHistory(
    requester,
    target
) {
    if (
        requester.id ===
        target.id
    ) {
        return true;
    }

    if (
        requester.permissions.has(
            PermissionFlagsBits.Administrator
        )
    ) {
        return true;
    }

    return Object.values(
        rankConfig.highCommand
    )
        .filter(Boolean)
        .some(
            roleId =>
                requester.roles.cache.has(
                    roleId
                )
        );
}

async function loadRankHistory(
    guildId,
    userId,
    limit
) {
    const [
        currentRank,
        loadedHistory
    ] =
        await Promise.all([
            rankDatabase.getCurrentRank(
                guildId,
                userId
            ),

            rankDatabase.getRankHistory(
                guildId,
                userId,
                limit
            )
        ]);

    const history =
        Array.isArray(loadedHistory)
            ? loadedHistory
            : [];

    let totalHistoryCount =
        history.length;

    if (
        typeof rankDatabase
            .countRankHistory ===
        'function'
    ) {
        totalHistoryCount =
            await rankDatabase
                .countRankHistory(
                    guildId,
                    userId
                );
    }

    return {
        currentRank,
        history,

        totalHistoryCount:
            Number(
                totalHistoryCount
            ) || 0
    };
}

async function sendRankHistoryError(
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
            .setName('rankhistory')
            .setDescription(
                'View a member’s Sin Rank history.'
            )
            .addUserOption(option =>
                option
                    .setName('user')
                    .setDescription(
                        'Member whose Sin Rank history you want to inspect.'
                    )
                    .setRequired(false)
            )
            .addIntegerOption(option =>
                option
                    .setName('limit')
                    .setDescription(
                        'Maximum number of records to load.'
                    )
                    .setMinValue(5)
                    .setMaxValue(50)
                    .setRequired(false)
            )
            .setDMPermission(false),

    async execute(interaction) {
        try {
            if (!interaction.inGuild()) {
                await sendRankHistoryError(
                    interaction,
                    '❌ Server Only Command',
                    'This command can only be used inside THE Ⅹ SINS.'
                );

                return;
            }

            const member =
                await resolveMember(
                    interaction
                );

            if (!member) {
                await sendRankHistoryError(
                    interaction,
                    '❌ Member Not Found',
                    'The selected member could not be found inside THE Ⅹ SINS.'
                );

                return;
            }

            if (
                !canViewHistory(
                    interaction.member,
                    member
                )
            ) {
                await sendRankHistoryError(
                    interaction,
                    '❌ Archive Access Denied',
                    [
                        'You may only inspect your own Sin Rank history.',
                        '',
                        'High Command may inspect another member’s archive.'
                    ].join('\n')
                );

                return;
            }

            const limit =
                interaction.options
                    .getInteger('limit') ??
                25;

            await interaction.deferReply({
                flags:
                    MessageFlags.Ephemeral
            });

            const rankData =
                await loadRankHistory(
                    interaction.guild.id,
                    member.id,
                    limit
                );

            const context = {
                interaction,
                member,

                currentRank:
                    rankData.currentRank,

                history:
                    rankData.history,

                totalHistoryCount:
                    rankData.totalHistoryCount
            };

            let selectedPage =
                HISTORY_PAGES.overview;

            const createPagePayload =
                (
                    page,
                    disabled = false
                ) => ({
                    embeds: [
                        buildRankHistoryPage(
                            context,
                            page
                        )
                    ],

                    components: [
                        createRankHistoryMenu(
                            page,
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
                                HISTORY_MENU_ID,

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
                                        '❌ Private Archive',
                                        'Only the member who opened this archive may control it.'
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
                            !HISTORY_PAGE_ORDER.includes(
                                requestedPage
                            )
                        ) {
                            await component.reply({
                                embeds: [
                                    createErrorEmbed(
                                        '❌ Invalid Archive Page',
                                        'Evelynn could not recognize that page.'
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
                            '❌ Evelynn /rankhistory navigation error:',
                            error
                        );

                        const payload = {
                            embeds: [
                                createErrorEmbed(
                                    '❌ Navigation Failed',
                                    'Evelynn could not open that archive page.'
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
                async () => {
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
                '❌ Evelynn /rankhistory command error:',
                error
            );

            await sendRankHistoryError(
                interaction,
                '❌ Rank History Failed',
                'Evelynn could not load the Sin Rank archive.'
            );
        }
    }
};