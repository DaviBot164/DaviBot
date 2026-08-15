const {
    SlashCommandBuilder,
    PermissionFlagsBits,
    MessageFlags,
    ActionRowBuilder,
    StringSelectMenuBuilder,
    StringSelectMenuOptionBuilder
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
        label:
            'Overview',

        emoji:
            '📜',

        description:
            'View the Soul’s current Rank and recent history.'
    },

    [HISTORY_PAGES.promotions]: {
        label:
            'Promotions',

        emoji:
            '⬆️',

        description:
            'View previous Sin Rank assignments.'
    },

    [HISTORY_PAGES.removals]: {
        label:
            'Removals',

        emoji:
            '⬇️',

        description:
            'View previous Sin Rank removals.'
    },

    [HISTORY_PAGES.complete]: {
        label:
            'Complete Archive',

        emoji:
            '🗃️',

        description:
            'View the complete Sin Rank history archive.'
    }
};

/**
 * Format a Discord timestamp safely.
 *
 * @param {string|Date|null} value
 * @param {string} style
 * @returns {string}
 */
function formatTimestamp(
    value,
    style = 'R'
) {
    if (!value) {
        return 'Unknown date';
    }

    const date =
        new Date(value);

    if (
        Number.isNaN(
            date.getTime()
        )
    ) {
        return 'Unknown date';
    }

    return `<t:${Math.floor(
        date.getTime() / 1000
    )}:${style}>`;
}

/**
 * Shorten text for embeds.
 *
 * @param {unknown} value
 * @param {number} limit
 * @returns {string}
 */
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
        : `${text.slice(
            0,
            limit - 3
        )}...`;
}

/**
 * Get a configured Sin Rank by name.
 *
 * @param {string|null} name
 * @returns {Object|null}
 */
function getConfiguredRank(
    name
) {
    if (!name) {
        return null;
    }

    return (
        Object.values(
            rankConfig.hierarchy
        ).find(
            rank =>
                rank.name === name
        ) ??
        null
    );
}

/**
 * Format a Rank name.
 *
 * Historical values that no longer
 * exist in the current configuration
 * are preserved.
 *
 * @param {string|null} rankName
 * @returns {string}
 */
function formatRank(
    rankName
) {
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

/**
 * Classify one Rank History record.
 *
 * @param {Object} record
 * @returns {'promotion'|'removal'|'other'}
 */
function classifyHistory(
    record
) {
    const action =
        String(
            record?.action ??
            ''
        ).toUpperCase();

    if (
        action === 'REMOVE' ||
        action === 'REMOVED' ||
        action === 'DEMOTION' ||
        action === 'REVOKE'
    ) {
        return 'removal';
    }

    if (
        action === 'SET' ||
        action === 'ASSIGN' ||
        action === 'PROMOTION'
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

/**
 * Filter Rank History records by page.
 *
 * @param {Array<Object>} records
 * @param {string} page
 * @returns {Array<Object>}
 */
function filterHistory(
    records,
    page
) {
    if (
        page ===
        HISTORY_PAGES.promotions
    ) {
        return records.filter(
            record =>
                classifyHistory(
                    record
                ) === 'promotion'
        );
    }

    if (
        page ===
        HISTORY_PAGES.removals
    ) {
        return records.filter(
            record =>
                classifyHistory(
                    record
                ) === 'removal'
        );
    }

    return records;
}/**
 * Get visual details for one Rank History entry.
 *
 * @param {'promotion'|'removal'|'other'} type
 * @returns {{
 *     emoji: string,
 *     label: string
 * }}
 */
function getHistoryTypeDetails(
    type
) {
    switch (type) {
        case 'promotion':
            return {
                emoji:
                    '⬆️',

                label:
                    'Rank Assigned'
            };

        case 'removal':
            return {
                emoji:
                    '◇',

                label:
                    'Rank Removed'
            };

        default:
            return {
                emoji:
                    '◆',

                label:
                    'Rank Change'
            };
    }
}

/**
 * Create the Rank History navigation menu.
 *
 * @param {string} selectedPage
 * @param {boolean} disabled
 * @returns {ActionRowBuilder}
 */
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
                'Choose an archive section...'
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
        of HISTORY_PAGE_ORDER
    ) {
        const details =
            HISTORY_PAGE_DETAILS[
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
                    pageId ===
                    selectedPage
                )
        );
    }

    return new ActionRowBuilder()
        .addComponents(
            menu
        );
}

/**
 * Create the shared Rank History embed.
 *
 * @param {Object} options
 * @param {import('discord.js').ChatInputCommandInteraction} options.interaction
 * @param {import('discord.js').GuildMember} options.member
 * @param {string} options.title
 * @param {string} options.description
 * @param {string} [options.color]
 * @returns {import('discord.js').EmbedBuilder}
 */
function createRankHistoryEmbed({
    interaction,
    member,
    title,
    description,
    color =
        '#B026FF'
}) {
    const avatar =
        member.user.displayAvatarURL({
            size:
                1024,

            forceStatic:
                false
        });

    const botAvatar =
        interaction.client.user
            .displayAvatarURL({
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

                '━━━━━━━━━━━━━━━━━━━━',

                '',

                '-# THE Ⅹ SINS • Rank Archive'
            ].join('\n'),

        color,

        thumbnail:
            avatar,

        author: {
            name:
                `${member.displayName} • Rank History`,

            iconURL:
                avatar
        },

        footer: {
            text:
                `THE Ⅹ SINS • Opened by ${interaction.user.username}`,

            iconURL:
                botAvatar
        }
    });
}

/**
 * Format one Rank History record.
 *
 * @param {Object} entry
 * @param {number} position
 * @returns {string}
 */
function formatHistoryEntry(
    entry,
    position
) {
    const type =
        classifyHistory(
            entry
        );

    const details =
        getHistoryTypeDetails(
            type
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

    const reason =
        shorten(
            entry?.reason,
            160
        );

    const rankChange =
        entry?.old_rank ||
        entry?.new_rank
            ? `${oldRank} → ${newRank}`
            : newRank;

    return [
        `### ${position}. ${details.emoji} ${details.label}`,

        `**Rank:** ${rankChange}`,

        `**High Command:** ${moderator}`,

        `**Reason:** ${reason}`,

        `**Recorded:** ${formatTimestamp(
            entry?.created_at
        )}`,

        entry?.id
            ? `-# Archive Record #${entry.id}`
            : null
    ]
        .filter(Boolean)
        .join('\n');
}

/**
 * Split formatted history records into
 * Discord-safe field values.
 *
 * @param {string[]} records
 * @param {number} maxLength
 * @returns {string[]}
 */
function splitHistoryRecords(
    records,
    maxLength = 1000
) {
    const chunks = [];

    let current =
        '';

    for (
        const record
        of records
    ) {
        const next =
            current
                ? `${current}\n\n${record}`
                : record;

        if (
            next.length >
            maxLength
        ) {
            if (current) {
                chunks.push(
                    current
                );
            }

            current =
                record;

            continue;
        }

        current =
            next;
    }

    if (current) {
        chunks.push(
            current
        );
    }

    return chunks;
}/**
 * Count history records of one type.
 *
 * @param {Object[]} history
 * @param {'promotion'|'removal'} type
 * @returns {number}
 */
function countHistoryType(
    history,
    type
) {
    return history.filter(
        entry =>
            classifyHistory(
                entry
            ) === type
    ).length;
}

/**
 * Find the highest configured Rank
 * ever recorded for a Soul.
 *
 * @param {Object[]} history
 * @param {Object|null} currentRank
 * @returns {string|null}
 */
function findHighestRank(
    history,
    currentRank
) {
    const names = [];

    if (
        currentRank?.rank_name
    ) {
        names.push(
            currentRank.rank_name
        );
    }

    for (
        const entry
        of history
    ) {
        if (
            entry?.old_rank
        ) {
            names.push(
                entry.old_rank
            );
        }

        if (
            entry?.new_rank
        ) {
            names.push(
                entry.new_rank
            );
        }
    }

    const configured =
        names
            .map(
                name =>
                    getConfiguredRank(
                        name
                    )
            )
            .filter(Boolean);

    if (
        !configured.length
    ) {
        return names[0] ?? null;
    }

    return configured
        .sort(
            (
                first,
                second
            ) =>
                Object.keys(
                    rankConfig.hierarchy
                ).indexOf(
                    first.key
                ) -
                Object.keys(
                    rankConfig.hierarchy
                ).indexOf(
                    second.key
                )
        )[0]
        ?.name ?? null;
}

/**
 * Build the overview page.
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
        currentRank,
        history,
        totalHistoryCount
    } = context;

    const currentRankName =
        currentRank?.rank_name ??
        rankConfig
            .hierarchy
            .unranked
            .name;

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

    const highestRank =
        findHighestRank(
            history,
            currentRank
        ) ??
        rankConfig
            .hierarchy
            .unranked
            .name;

    const embed =
        createRankHistoryEmbed({
            interaction,

            member,

            title:
                '📖 Rank Career',

            description:
                `${member} • complete Sin Rank archive.`,

            color:
                '#B026FF'
        });

    embed.addFields(
        {
            name:
                '⚔️ Current Rank',

            value:
                `## ${formatRank(
                    currentRankName
                )}`,

            inline:
                true
        },

        {
            name:
                '♛ Highest Rank',

            value:
                `**${formatRank(
                    highestRank
                )}**`,

            inline:
                true
        },

        {
            name:
                '📊 Archive',

            value:
                [
                    `**Total:** \`${totalHistoryCount}\``,

                    `**Promotions:** \`${promotions}\``,

                    `**Removals:** \`${removals}\``
                ].join('\n'),

            inline:
                true
        }
    );

    if (
        currentRank?.assigned_at
    ) {
        embed.addFields({
            name:
                '🕒 Current Rank Since',

            value:
                formatTimestamp(
                    currentRank.assigned_at,
                    'D'
                ),

            inline:
                false
        });
    }

    if (
        history.length
    ) {
        const latest =
            history[0];

        const details =
            getHistoryTypeDetails(
                classifyHistory(
                    latest
                )
            );

        embed.addFields({
            name:
                '📜 Latest Record',

            value:
                [
                    `${details.emoji} **${details.label}**`,

                    `**Rank:** ${formatRank(
                        latest?.old_rank
                    )} → ${formatRank(
                        latest?.new_rank
                    )}`,

                    `**Recorded:** ${formatTimestamp(
                        latest?.created_at
                    )}`,

                    `**Reason:** ${shorten(
                        latest?.reason,
                        180
                    )}`
                ].join('\n'),

            inline:
                false
        });
    }

    return embed;
}

/**
 * Build a filtered history page.
 *
 * @param {Object} context
 * @param {'promotion'|'removal'} type
 * @param {string} title
 * @param {string} description
 * @returns {import('discord.js').EmbedBuilder}
 */
function buildFilteredPage(
    context,
    type,
    title,
    description
) {
    const records =
        filterHistory(
            context.history,
            type === 'promotion'
                ? HISTORY_PAGES.promotions
                : HISTORY_PAGES.removals
        );

    const embed =
        createRankHistoryEmbed({
            interaction:
                context.interaction,

            member:
                context.member,

            title,

            description,

            color:
                type === 'promotion'
                    ? '#57F287'
                    : '#ED4245'
        });

    embed.addFields({
        name:
            '📊 Archive',

        value:
            [
                `**Matching Records:** \`${records.length}\``,

                `**Total Records:** \`${context.totalHistoryCount}\``
            ].join('\n'),

        inline:
            false
    });

    if (
        !records.length
    ) {
        embed.addFields({
            name:
                '◇ No Records',

            value:
                type === 'promotion'
                    ? 'No previous Sin Rank assignments have been recorded.'
                    : 'No previous Sin Rank removals have been recorded.',

            inline:
                false
        });

        return embed;
    }

    const formatted =
        records.map(
            (
                entry,
                index
            ) =>
                formatHistoryEntry(
                    entry,
                    index + 1
                )
        );

    splitHistoryRecords(
        formatted
    ).forEach(
        (
            chunk,
            index
        ) => {
            embed.addFields({
                name:
                    index === 0
                        ? '📜 Recorded Changes'
                        : '📜 Recorded Changes — Continued',

                value:
                    chunk,

                inline:
                    false
            });
        }
    );

    return embed;
}

/**
 * Build the complete archive page.
 *
 * @param {Object} context
 * @returns {import('discord.js').EmbedBuilder}
 */
function buildCompletePage(
    context
) {
    const {
        interaction,
        member,
        history,
        totalHistoryCount
    } = context;

    const embed =
        createRankHistoryEmbed({
            interaction,

            member,

            title:
                '🗃️ Complete Archive',

            description:
                `${member} • complete recorded Rank history.`,

            color:
                '#B026FF'
        });

    embed.addFields({
        name:
            '📊 Archive Status',

        value:
            [
                `**Loaded:** \`${history.length}\``,

                `**Total:** \`${totalHistoryCount}\``
            ].join('\n'),

        inline:
            false
    });

    if (
        !history.length
    ) {
        embed.addFields({
            name:
                '◇ Empty Archive',

            value:
                'No Rank history has been recorded for this Soul.',

            inline:
                false
        });

        return embed;
    }

    const records =
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

    splitHistoryRecords(
        records
    ).forEach(
        (
            chunk,
            index
        ) => {
            embed.addFields({
                name:
                    index === 0
                        ? '📜 Rank Records'
                        : '📜 Rank Records — Continued',

                value:
                    chunk,

                inline:
                    false
            });
        }
    );

    return embed;
}

/**
 * Build the requested Rank History page.
 *
 * @param {Object} context
 * @param {string} page
 * @returns {import('discord.js').EmbedBuilder}
 */
function buildRankHistoryPage(
    context,
    page
) {
    switch (page) {
        case HISTORY_PAGES.promotions:
            return buildFilteredPage(
                context,
                'promotion',
                '⬆️ Promotions',
                `${context.member} • previous Sin Rank assignments.`
            );

        case HISTORY_PAGES.removals:
            return buildFilteredPage(
                context,
                'removal',
                '◇ Rank Removals',
                `${context.member} • previous Sin Rank removals.`
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
}/**
 * Resolve the requested Soul.
 *
 * @param {import('discord.js').ChatInputCommandInteraction} interaction
 * @returns {Promise<import('discord.js').GuildMember|null>}
 */
async function resolveMember(
    interaction
) {
    const user =
        interaction.options.getUser(
            'user'
        );

    if (!user) {
        return interaction.member;
    }

    return (
        interaction.guild.members
            .cache.get(
                user.id
            ) ??
        await interaction.guild.members
            .fetch(
                user.id
            )
            .catch(
                () => null
            )
    );
}

/**
 * Check whether the requester may inspect
 * another Soul's Rank History.
 *
 * Members may always inspect their own
 * archive. High Command may inspect others.
 *
 * @param {import('discord.js').GuildMember} requester
 * @param {import('discord.js').GuildMember} target
 * @returns {boolean}
 */
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
    ).some(
        roleId =>
            requester.roles.cache.has(
                roleId
            )
    );
}

/**
 * Load the Rank History data.
 *
 * @param {import('discord.js').Guild} guild
 * @param {string} userId
 * @param {number} limit
 * @returns {Promise<{
 *     currentRank: Object|null,
 *     history: Object[],
 *     totalHistoryCount: number
 * }>}
 */
async function loadRankHistory(
    guild,
    userId,
    limit
) {
    const currentRank =
        await rankDatabase.getCurrentRank(
            guild.id,
            userId
        );

    const history =
        await rankDatabase.getRankHistory(
            guild.id,
            userId,
            limit
        );

    let totalHistoryCount =
        history.length;

    if (
        typeof rankDatabase
            .countRankHistory ===
        'function'
    ) {
        totalHistoryCount =
            await rankDatabase.countRankHistory(
                guild.id,
                userId
            );
    }

    return {
        currentRank,

        history:
            Array.isArray(history)
                ? history
                : [],

        totalHistoryCount:
            Number(
                totalHistoryCount
            ) || 0
    };
}

module.exports = {
    category:
        'information',

    data:
        new SlashCommandBuilder()
            .setName(
                'rankhistory'
            )
            .setDescription(
                'View a Soul’s complete Sin Rank history.'
            )

            .addUserOption(
                option =>
                    option
                        .setName(
                            'user'
                        )
                        .setDescription(
                            'Soul whose Rank history you want to inspect.'
                        )
                        .setRequired(
                            false
                        )
            )

            .addIntegerOption(
                option =>
                    option
                        .setName(
                            'limit'
                        )
                        .setDescription(
                            'Maximum number of records to load.'
                        )
                        .setMinValue(
                            5
                        )
                        .setMaxValue(
                            50
                        )
                        .setRequired(
                            false
                        )
            )

            .setDMPermission(
                false
            ),

    /**
     * Execute /rankhistory.
     *
     * @param {import('discord.js').ChatInputCommandInteraction} interaction
     * @returns {Promise<void>}
     */
    async execute(
        interaction
    ) {
        try {
            const member =
                await resolveMember(
                    interaction
                );

            if (!member) {
                await interaction.reply({
                    embeds: [
                        createErrorEmbed(
                            '❌ Soul Not Found',

                            'The selected Soul could not be found in THE Ⅹ SINS.'
                        )
                    ],

                    flags:
                        MessageFlags.Ephemeral
                });

                return;
            }

            if (
                !canViewHistory(
                    interaction.member,
                    member
                )
            ) {
                await interaction.reply({
                    embeds: [
                        createErrorEmbed(
                            '❌ Archive Access Denied',

                            [
                                'You may only inspect your own Rank history.',
                                '',
                                'High Command may inspect another Soul’s archive.'
                            ].join('\n')
                        )
                    ],

                    flags:
                        MessageFlags.Ephemeral
                });

                return;
            }

            const limit =
                interaction.options
                    .getInteger(
                        'limit'
                    ) ??
                25;

            await interaction.deferReply({
                flags:
                    MessageFlags.Ephemeral
            });

            const rankData =
                await loadRankHistory(
                    interaction.guild,
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

            await interaction.editReply({
                embeds: [
                    buildRankHistoryPage(
                        context,
                        selectedPage
                    )
                ],

                components: [
                    createRankHistoryMenu(
                        selectedPage
                    )
                ]
            });

            const message =
                await interaction.fetchReply();

            const collector =
                message.createMessageComponentCollector({
                    filter:
                        componentInteraction =>
                            componentInteraction
                                .customId ===
                                HISTORY_MENU_ID,

                    time:
                        10 * 60 * 1000
                });

            collector.on(
                'collect',
                async componentInteraction => {
                    try {
                        if (
                            componentInteraction
                                .user.id !==
                            interaction.user.id
                        ) {
                            await componentInteraction.reply({
                                embeds: [
                                    createErrorEmbed(
                                        '❌ Private Archive',

                                        'Only the Soul who opened this archive may use its navigation.'
                                    )
                                ],

                                flags:
                                    MessageFlags.Ephemeral
                            });

                            return;
                        }

                        const requestedPage =
                            componentInteraction
                                .values[0];

                        if (
                            !HISTORY_PAGE_ORDER.includes(
                                requestedPage
                            )
                        ) {
                            await componentInteraction.reply({
                                embeds: [
                                    createErrorEmbed(
                                        '❌ Invalid Archive Page',

                                        'Evelynn could not recognize that archive section.'
                                    )
                                ],

                                flags:
                                    MessageFlags.Ephemeral
                            });

                            return;
                        }

                        selectedPage =
                            requestedPage;

                        const freshData =
                            await loadRankHistory(
                                interaction.guild,
                                member.id,
                                limit
                            );

                        const freshContext = {
                            interaction,

                            member,

                            currentRank:
                                freshData.currentRank,

                            history:
                                freshData.history,

                            totalHistoryCount:
                                freshData.totalHistoryCount
                        };

                        await componentInteraction.update({
                            embeds: [
                                buildRankHistoryPage(
                                    freshContext,
                                    selectedPage
                                )
                            ],

                            components: [
                                createRankHistoryMenu(
                                    selectedPage
                                )
                            ]
                        });
                    } catch (
                        navigationError
                    ) {
                        console.error(
                            '❌ Evelynn /rankhistory navigation error:',
                            navigationError
                        );

                        if (
                            componentInteraction
                                .deferred ||
                            componentInteraction
                                .replied
                        ) {
                            await componentInteraction
                                .followUp({
                                    embeds: [
                                        createErrorEmbed(
                                            '❌ Navigation Failed',

                                            'Evelynn could not open that archive section.'
                                        )
                                    ],

                                    flags:
                                        MessageFlags.Ephemeral
                                })
                                .catch(
                                    () => null
                                );

                            return;
                        }

                        await componentInteraction
                            .reply({
                                embeds: [
                                    createErrorEmbed(
                                        '❌ Navigation Failed',

                                        'Evelynn could not open that archive section.'
                                    )
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
                                createRankHistoryMenu(
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
                '❌ Evelynn /rankhistory command error:',
                error
            );

            const errorEmbed =
                createErrorEmbed(
                    '❌ Rank History Failed',

                    [
                        'Evelynn could not load the Rank Archive.',
                        '',
                        'Check the Rank database and try again.'
                    ].join('\n')
                );

            if (
                interaction.deferred ||
                interaction.replied
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