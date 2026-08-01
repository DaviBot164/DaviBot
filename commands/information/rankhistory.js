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

const rankDatabase =
    require('../../database/ranks');

/**
 * Rank History navigation menu ID.
 */
const RANK_HISTORY_MENU_ID =
    'umbra_rank_history_page_menu';

/**
 * Rank History page identifiers.
 */
const RANK_HISTORY_PAGES = {
    overview:
        'rank_history_overview',

    timeline:
        'rank_history_timeline',

    promotions:
        'rank_history_promotions',

    demotions:
        'rank_history_demotions',

    revocations:
        'rank_history_revocations',

    statistics:
        'rank_history_statistics'
};

/**
 * Rank History page order.
 */
const RANK_HISTORY_PAGE_ORDER = [
    RANK_HISTORY_PAGES.overview,
    RANK_HISTORY_PAGES.timeline,
    RANK_HISTORY_PAGES.promotions,
    RANK_HISTORY_PAGES.demotions,
    RANK_HISTORY_PAGES.revocations,
    RANK_HISTORY_PAGES.statistics
];

/**
 * Rank History page display details.
 */
const RANK_HISTORY_PAGE_DETAILS = {
    [RANK_HISTORY_PAGES.overview]: {
        emoji:
            '📖',

        label:
            'Career Overview',

        description:
            'Current Rank and career summary'
    },

    [RANK_HISTORY_PAGES.timeline]: {
        emoji:
            '📜',

        label:
            'Full Timeline',

        description:
            'Every recorded Rank change'
    },

    [RANK_HISTORY_PAGES.promotions]: {
        emoji:
            '⬆️',

        label:
            'Promotions',

        description:
            'Upward movement through the hierarchy'
    },

    [RANK_HISTORY_PAGES.demotions]: {
        emoji:
            '⬇️',

        label:
            'Demotions',

        description:
            'Downward movement through the hierarchy'
    },

    [RANK_HISTORY_PAGES.revocations]: {
        emoji:
            '🌑',

        label:
            'Revocations',

        description:
            'Removed Arrancar Rank records'
    },

    [RANK_HISTORY_PAGES.statistics]: {
        emoji:
            '📊',

        label:
            'Career Statistics',

        description:
            'Highest Rank and hierarchy totals'
    }
};

/**
 * Official manually assignable Arrancar
 * Ranks ordered from highest to lowest.
 */
const ARRANCAR_RANK_ORDER = [
    '👑 Espada 0',
    'Ⅰ Espada',
    'Ⅱ Espada',
    'Ⅲ Espada',
    'Ⅳ Espada',
    'Ⅴ Espada',
    'Ⅵ Espada',
    'Ⅶ Espada',
    'Ⅷ Espada',
    'Ⅸ Espada',
    'Ⅹ Espada',
    '🌘 Privaron Espada',
    '⚔️ Fracción',
    '🦴 Numeros',
    '⚪ Unranked Arrancar'
];

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
    style = 'F'
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
 * Calculate complete days elapsed
 * since one date.
 *
 * @param {Date|string|number|null|undefined} value
 * @returns {number}
 */
function calculateDaysSince(
    value
) {
    if (!value) {
        return 0;
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
        return 0;
    }

    return Math.max(
        0,
        Math.floor(
            (
                Date.now() -
                date.getTime()
            ) /
            86_400_000
        )
    );
}

/**
 * Return the hierarchy index of one Rank.
 *
 * Lower indexes represent stronger Ranks.
 *
 * @param {string|null|undefined} rankName
 * @returns {number}
 */
function getRankIndex(
    rankName
) {
    const index =
        ARRANCAR_RANK_ORDER.indexOf(
            rankName
        );

    return index ===
        -1
        ? ARRANCAR_RANK_ORDER.length
        : index;
}

/**
 * Determine the type of one Rank
 * history record.
 *
 * @param {Object} entry
 * @returns {'PROMOTION'|'DEMOTION'|'REVOCATION'|'ASSIGNMENT'|'CHANGE'}
 */
function classifyRankHistoryEntry(
    entry
) {
    if (
        entry?.action ===
            'REMOVE' ||
        !entry?.new_rank
    ) {
        return 'REVOCATION';
    }

    if (
        !entry?.old_rank
    ) {
        return 'ASSIGNMENT';
    }

    const oldIndex =
        getRankIndex(
            entry.old_rank
        );

    const newIndex =
        getRankIndex(
            entry.new_rank
        );

    if (
        newIndex <
        oldIndex
    ) {
        return 'PROMOTION';
    }

    if (
        newIndex >
        oldIndex
    ) {
        return 'DEMOTION';
    }

    return 'CHANGE';
}

/**
 * Return visual information for one
 * Rank history record type.
 *
 * @param {string} type
 * @returns {{
 *     emoji: string,
 *     label: string,
 *     color: string
 * }}
 */
function getHistoryTypeDetails(
    type
) {
    switch (
        type
    ) {
        case 'PROMOTION':
            return {
                emoji:
                    '⬆️',

                label:
                    'Promotion',

                color:
                    embedConfig.colors.success
            };

        case 'DEMOTION':
            return {
                emoji:
                    '⬇️',

                label:
                    'Demotion',

                color:
                    embedConfig.colors.warning
            };

        case 'REVOCATION':
            return {
                emoji:
                    '🌑',

                label:
                    'Rank Revocation',

                color:
                    embedConfig.colors.moderation
            };

        case 'ASSIGNMENT':
            return {
                emoji:
                    '🏅',

                label:
                    'Initial Assignment',

                color:
                    embedConfig.colors.rank
            };

        default:
            return {
                emoji:
                    '⚔️',

                label:
                    'Rank Change',

                color:
                    embedConfig.colors.rank
            };
    }
}

/**
 * Create the interactive Rank History menu.
 *
 * @param {string} selectedPage
 * @param {boolean} disabled
 * @returns {ActionRowBuilder<StringSelectMenuBuilder>}
 */
function createRankHistoryMenu(
    selectedPage,
    disabled = false
) {
    const menu =
        new StringSelectMenuBuilder()
            .setCustomId(
                RANK_HISTORY_MENU_ID
            )
            .setPlaceholder(
                'Select a hierarchy archive'
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
        of RANK_HISTORY_PAGE_ORDER
    ) {
        const details =
            RANK_HISTORY_PAGE_DETAILS[
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
 * Create the shared Rank History Embed.
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
        embedConfig.colors.rank
}) {
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
                '*Every promotion, demotion and revocation is preserved permanently within the hierarchy archives.*'
            ].join('\n'),

        color,

        thumbnail:
            avatarURL,

        author: {
            name:
                `${member.displayName} • Arrancar Career Archive`,

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
}

/**
 * Format one Rank history record.
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
        classifyRankHistoryEntry(
            entry
        );

    const details =
        getHistoryTypeDetails(
            type
        );

    const oldRank =
        entry?.old_rank ||
        'No previous Rank';

    const newRank =
        entry?.new_rank ||
        'No active Rank';

    const moderator =
        entry?.moderator_id
            ? `<@${entry.moderator_id}>`
            : 'Unknown High Command';

    const reason =
        entry?.reason ||
        'No reason was recorded.';

    return [
        `### ${position}. ${details.emoji} ${details.label}`,
        `**Hierarchy:** ${oldRank} → ${newRank}`,
        `**High Command:** ${moderator}`,
        `**Reason:** ${reason}`,
        `**Recorded:** ${formatDiscordDate(entry?.created_at, 'F')}`,
        `-# ${formatDiscordDate(entry?.created_at, 'R')}`,
        entry?.id
            ? `-# Archive Record: #${entry.id}`
            : null
    ]
        .filter(
            Boolean
        )
        .join('\n');
}

/**
 * Split formatted Rank records into
 * safe Discord Embed field values.
 *
 * @param {string[]} records
 * @param {number} maxLength
 * @returns {string[]}
 */
function splitHistoryRecords(
    records,
    maxLength = 1_000
) {
    const chunks = [];

    let currentChunk =
        '';

    for (
        const record
        of records
    ) {
        const separator =
            currentChunk
                ? '\n\n━━━━━━━━━━━━━━━━━━━━\n\n'
                : '';

        const nextChunk =
            `${currentChunk}${separator}${record}`;

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
                record;
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
 * Filter Rank history records by
 * one classified action type.
 *
 * @param {Object[]} history
 * @param {string} type
 * @returns {Object[]}
 */
function filterHistoryByType(
    history,
    type
) {
    return history.filter(
        entry =>
            classifyRankHistoryEntry(
                entry
            ) ===
            type
    );
}

/**
 * Find the highest Rank ever recorded.
 *
 * @param {Object[]} history
 * @param {Object|null} currentRank
 * @returns {string|null}
 */
function findHighestRankEver(
    history,
    currentRank
) {
    const rankNames =
        [];

    if (
        currentRank?.rank_name
    ) {
        rankNames.push(
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
            rankNames.push(
                entry.old_rank
            );
        }

        if (
            entry?.new_rank
        ) {
            rankNames.push(
                entry.new_rank
            );
        }
    }

    if (
        rankNames.length ===
        0
    ) {
        return null;
    }

    return [...new Set(
        rankNames
    )].sort(
        (
            firstRank,
            secondRank
        ) =>
            getRankIndex(
                firstRank
            ) -
            getRankIndex(
                secondRank
            )
    )[0];
}

/**
 * Find the first known Rank record.
 *
 * @param {Object[]} history
 * @returns {Object|null}
 */
function findFirstCareerRecord(
    history
) {
    if (
        !Array.isArray(
            history
        ) ||
        history.length ===
            0
    ) {
        return null;
    }

    return [...history]
        .sort(
            (
                firstEntry,
                secondEntry
            ) =>
                new Date(
                    firstEntry.created_at ||
                    0
                ).getTime() -
                new Date(
                    secondEntry.created_at ||
                    0
                ).getTime()
        )[0] ||
        null;
}

/**
 * Find the most recent Rank record.
 *
 * @param {Object[]} history
 * @returns {Object|null}
 */
function findLatestCareerRecord(
    history
) {
    if (
        !Array.isArray(
            history
        ) ||
        history.length ===
            0
    ) {
        return null;
    }

    return [...history]
        .sort(
            (
                firstEntry,
                secondEntry
            ) =>
                new Date(
                    secondEntry.created_at ||
                    0
                ).getTime() -
                new Date(
                    firstEntry.created_at ||
                    0
                ).getTime()
        )[0] ||
        null;
}/**
 * Count hierarchy records by type.
 *
 * @param {Object[]} history
 * @param {string} type
 * @returns {number}
 */
function countHistoryType(
    history,
    type
) {
    return filterHistoryByType(
        history,
        type
    ).length;
}

/**
 * Calculate how many days the Soul has
 * held the current active Rank.
 *
 * @param {Object|null} currentRank
 * @returns {number}
 */
function calculateCurrentReignDays(
    currentRank
) {
    if (
        !currentRank?.assigned_at
    ) {
        return 0;
    }

    return calculateDaysSince(
        currentRank.assigned_at
    );
}

/**
 * Determine whether a Rank belongs
 * to the official Espada thrones.
 *
 * @param {string|null|undefined} rankName
 * @returns {boolean}
 */
function isEspadaRank(
    rankName
) {
    return [
        '👑 Espada 0',
        'Ⅰ Espada',
        'Ⅱ Espada',
        'Ⅲ Espada',
        'Ⅳ Espada',
        'Ⅴ Espada',
        'Ⅵ Espada',
        'Ⅶ Espada',
        'Ⅷ Espada',
        'Ⅸ Espada',
        'Ⅹ Espada'
    ].includes(
        rankName
    );
}

/**
 * Build a filtered history page.
 *
 * @param {Object} context
 * @param {Object[]} records
 * @param {string} title
 * @param {string} description
 * @param {string} emptyTitle
 * @param {string} emptyDescription
 * @param {string} color
 * @returns {import('discord.js').EmbedBuilder}
 */
function buildFilteredHistoryPage({
    context,
    records,
    title,
    description,
    emptyTitle,
    emptyDescription,
    color
}) {
    const {
        interaction,
        member
    } =
        context;

    const embed =
        createRankHistoryEmbed({
            interaction,
            member,
            title,
            description,
            color
        });

    embed.addFields({
        name:
            '📊 Archive Status',

        value:
            [
                `**Matching Records:** \`${formatNumber(records.length)}\``,
                `**Complete Career Records:** \`${formatNumber(context.totalHistoryCount)}\``,
                '',
                '-# Records are ordered from newest to oldest.'
            ].join('\n'),

        inline:
            false
    });

    if (
        records.length ===
        0
    ) {
        embed.addFields({
            name:
                emptyTitle,

            value:
                [
                    emptyDescription,
                    '',
                    '-# Future hierarchy changes will appear here automatically.'
                ].join('\n'),

            inline:
                false
        });

        return embed;
    }

    const formattedRecords =
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

    const chunks =
        splitHistoryRecords(
            formattedRecords
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
                        ? '📜 Recorded Hierarchy Changes'
                        : '📜 Recorded Hierarchy Changes — Continued',

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
 * Build the Arrancar Career Overview.
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
    } =
        context;

    const currentRankDisplay =
        currentRank?.rank_name ||
        '⚪ No manually assigned Arrancar Rank';

    const highestRank =
        findHighestRankEver(
            history,
            currentRank
        ) ||
        'No Rank recorded';

    const firstRecord =
        findFirstCareerRecord(
            history
        );

    const latestRecord =
        findLatestCareerRecord(
            history
        );

    const currentReignDays =
        calculateCurrentReignDays(
            currentRank
        );

    const promotionCount =
        countHistoryType(
            history,
            'PROMOTION'
        );

    const demotionCount =
        countHistoryType(
            history,
            'DEMOTION'
        );

    const revocationCount =
        countHistoryType(
            history,
            'REVOCATION'
        );

    const assignmentCount =
        countHistoryType(
            history,
            'ASSIGNMENT'
        );

    const embed =
        createRankHistoryEmbed({
            interaction,
            member,

            title:
                `📖 ${member.user.username}'s Arrancar Career`,

            description:
                `Umbra has opened the complete hierarchy career archive of ${member}.`,

            color:
                embedConfig.colors.rank
        });

    embed.addFields(
        {
            name:
                '⚔️ Current Arrancar Rank',

            value:
                [
                    `## ${currentRankDisplay}`,
                    '',
                    currentRank
                        ? `**Assigned By:** ${currentRank.assigned_by ? `<@${currentRank.assigned_by}>` : 'Not recorded'}`
                        : '**Assigned By:** Not recorded',
                    currentRank
                        ? `**Assigned:** ${formatDiscordDate(currentRank.assigned_at, 'F')}`
                        : '**Assigned:** Not recorded',
                    currentRank
                        ? `**Current Reign:** \`${formatNumber(currentReignDays)} days\``
                        : '**Current Reign:** No active reign',
                    '',
                    `-# ${currentRank?.reason || 'No active Rank assignment is recorded.'}`
                ].join('\n'),

            inline:
                false
        },
        {
            name:
                '🏆 Highest Rank Achieved',

            value:
                [
                    `**${highestRank}**`,
                    '',
                    isEspadaRank(
                        highestRank
                    )
                        ? '👑 This Soul has reached an official Espada throne.'
                        : '-# Highest position found within the available hierarchy archive.'
                ].join('\n'),

            inline:
                false
        },
        {
            name:
                '📊 Career Summary',

            value:
                [
                    `**Total Records:** \`${formatNumber(totalHistoryCount)}\``,
                    `**Promotions:** \`${formatNumber(promotionCount)}\``,
                    `**Demotions:** \`${formatNumber(demotionCount)}\``,
                    `**Revocations:** \`${formatNumber(revocationCount)}\``,
                    `**Initial Assignments:** \`${formatNumber(assignmentCount)}\``
                ].join('\n'),

            inline:
                true
        },
        {
            name:
                '📅 Career Timeline',

            value:
                [
                    `**First Record:** ${firstRecord ? formatDiscordDate(firstRecord.created_at, 'D') : 'Not recorded'}`,
                    `**Latest Record:** ${latestRecord ? formatDiscordDate(latestRecord.created_at, 'R') : 'Not recorded'}`,
                    `**Career Age:** \`${firstRecord ? formatNumber(calculateDaysSince(firstRecord.created_at)) : '0'} days\``
                ].join('\n'),

            inline:
                true
        },
        {
            name:
                '🧭 Recommended Workflow',

            value:
                [
                    '`/rankhistory` — inspect this complete career archive',
                    '`/espada` — view the current throne hierarchy',
                    '`/soul` — open the full Soul Record',
                    '',
                    '-# High Command may use `/setrank` and `/removerank` to update the hierarchy.'
                ].join('\n'),

            inline:
                false
        }
    );

    if (latestRecord) {
        const latestType =
            classifyRankHistoryEntry(
                latestRecord
            );

        const latestDetails =
            getHistoryTypeDetails(
                latestType
            );

        embed.addFields({
            name:
                '📜 Latest Hierarchy Record',

            value:
                [
                    `${latestDetails.emoji} **${latestDetails.label}**`,
                    `**Hierarchy:** ${latestRecord.old_rank || 'No previous Rank'} → ${latestRecord.new_rank || 'No active Rank'}`,
                    `**Recorded:** ${formatDiscordDate(latestRecord.created_at, 'F')}`,
                    `-# ${latestRecord.reason || 'No reason was recorded.'}`
                ].join('\n'),

            inline:
                false
        });
    }

    return embed;
}

/**
 * Build the complete Rank timeline.
 *
 * @param {Object} context
 * @returns {import('discord.js').EmbedBuilder}
 */
function buildTimelinePage(
    context
) {
    const {
        interaction,
        member,
        history,
        totalHistoryCount
    } =
        context;

    const embed =
        createRankHistoryEmbed({
            interaction,
            member,

            title:
                '📜 Complete Hierarchy Timeline',

            description:
                `${member}'s promotion, demotion, assignment and revocation timeline.`,

            color:
                embedConfig.colors.archive
        });

    embed.addFields({
        name:
            '📊 Timeline Status',

        value:
            [
                `**Total Career Records:** \`${formatNumber(totalHistoryCount)}\``,
                `**Records Loaded:** \`${formatNumber(history.length)}\``,
                '',
                history.length <
                    totalHistoryCount
                    ? '-# Only the newest records allowed by the command limit are currently displayed.'
                    : '-# The complete available hierarchy timeline is displayed below.'
            ].join('\n'),

        inline:
            false
    });

    if (
        history.length ===
        0
    ) {
        embed.addFields({
            name:
                '🌑 Empty Career Archive',

            value:
                [
                    'No Arrancar Rank changes have been recorded for this Soul.',
                    '',
                    '-# The timeline will begin after the first Rank assignment.'
                ].join('\n'),

            inline:
                false
        });

        return embed;
    }

    const chronologicalHistory =
        [...history].sort(
            (
                firstEntry,
                secondEntry
            ) =>
                new Date(
                    secondEntry.created_at ||
                    0
                ).getTime() -
                new Date(
                    firstEntry.created_at ||
                    0
                ).getTime()
        );

    const formattedRecords =
        chronologicalHistory.map(
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
            formattedRecords
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
                        ? '⚔️ Career Timeline'
                        : '⚔️ Career Timeline — Continued',

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
 * Build the Promotions page.
 *
 * Initial assignments are included because
 * they represent entry into the hierarchy.
 *
 * @param {Object} context
 * @returns {import('discord.js').EmbedBuilder}
 */
function buildPromotionsPage(
    context
) {
    const promotions =
        context.history.filter(
            entry => {
                const type =
                    classifyRankHistoryEntry(
                        entry
                    );

                return (
                    type ===
                        'PROMOTION' ||
                    type ===
                        'ASSIGNMENT'
                );
            }
        );

    return buildFilteredHistoryPage({
        context,
        records:
            promotions,

        title:
            '⬆️ Arrancar Promotions',

        description:
            `${context.member}'s upward progression and entry records within the Las Noches hierarchy.`,

        emptyTitle:
            '🌑 No Promotions Recorded',

        emptyDescription:
            'This Soul has no promotion or initial Rank assignment records.',

        color:
            embedConfig.colors.success
    });
}

/**
 * Build the Demotions page.
 *
 * @param {Object} context
 * @returns {import('discord.js').EmbedBuilder}
 */
function buildDemotionsPage(
    context
) {
    const demotions =
        filterHistoryByType(
            context.history,
            'DEMOTION'
        );

    return buildFilteredHistoryPage({
        context,
        records:
            demotions,

        title:
            '⬇️ Arrancar Demotions',

        description:
            `${context.member}'s recorded downward movements within the hierarchy.`,

        emptyTitle:
            '✅ No Demotions Recorded',

        emptyDescription:
            'This Soul has no recorded Arrancar Rank demotions.',

        color:
            embedConfig.colors.warning
    });
}

/**
 * Build the Rank Revocations page.
 *
 * @param {Object} context
 * @returns {import('discord.js').EmbedBuilder}
 */
function buildRevocationsPage(
    context
) {
    const revocations =
        filterHistoryByType(
            context.history,
            'REVOCATION'
        );

    return buildFilteredHistoryPage({
        context,
        records:
            revocations,

        title:
            '🌑 Arrancar Rank Revocations',

        description:
            `${context.member}'s records of removed or revoked hierarchy positions.`,

        emptyTitle:
            '✅ No Revocations Recorded',

        emptyDescription:
            'This Soul has no recorded Arrancar Rank revocations.',

        color:
            embedConfig.colors.moderation
    });
}

/**
 * Build Career Statistics.
 *
 * @param {Object} context
 * @returns {import('discord.js').EmbedBuilder}
 */
function buildStatisticsPage(
    context
) {
    const {
        interaction,
        member,
        currentRank,
        history,
        totalHistoryCount
    } =
        context;

    const promotions =
        countHistoryType(
            history,
            'PROMOTION'
        );

    const assignments =
        countHistoryType(
            history,
            'ASSIGNMENT'
        );

    const demotions =
        countHistoryType(
            history,
            'DEMOTION'
        );

    const revocations =
        countHistoryType(
            history,
            'REVOCATION'
        );

    const changes =
        countHistoryType(
            history,
            'CHANGE'
        );

    const highestRank =
        findHighestRankEver(
            history,
            currentRank
        ) ||
        'No Rank recorded';

    const firstRecord =
        findFirstCareerRecord(
            history
        );

    const latestRecord =
        findLatestCareerRecord(
            history
        );

    const uniqueRanks =
        new Set();

    for (
        const entry
        of history
    ) {
        if (
            entry.old_rank
        ) {
            uniqueRanks.add(
                entry.old_rank
            );
        }

        if (
            entry.new_rank
        ) {
            uniqueRanks.add(
                entry.new_rank
            );
        }
    }

    if (
        currentRank?.rank_name
    ) {
        uniqueRanks.add(
            currentRank.rank_name
        );
    }

    const positiveMovement =
        promotions +
        assignments;

    const negativeMovement =
        demotions +
        revocations;

    const stabilityScore =
        totalHistoryCount >
        0
            ? Math.max(
                0,
                Math.min(
                    100,
                    Math.round(
                        (
                            positiveMovement /
                            Math.max(
                                1,
                                positiveMovement +
                                negativeMovement
                            )
                        ) *
                        100
                    )
                )
            )
            : 0;

    const embed =
        createRankHistoryEmbed({
            interaction,
            member,

            title:
                '📊 Arrancar Career Statistics',

            description:
                `Umbra has calculated ${member}'s complete hierarchy career statistics.`,

            color:
                embedConfig.colors.rank
        });

    embed.addFields(
        {
            name:
                '👑 Career Position',

            value:
                [
                    `**Current Rank:** ${currentRank?.rank_name || 'No active Rank'}`,
                    `**Highest Rank Ever:** ${highestRank}`,
                    `**Unique Ranks Held:** \`${formatNumber(uniqueRanks.size)}\``,
                    `**Current Reign:** \`${formatNumber(calculateCurrentReignDays(currentRank))} days\``
                ].join('\n'),

            inline:
                false
        },
        {
            name:
                '📚 Record Totals',

            value:
                [
                    `**Complete Records:** \`${formatNumber(totalHistoryCount)}\``,
                    `**Records Loaded:** \`${formatNumber(history.length)}\``,
                    `**Promotions:** \`${formatNumber(promotions)}\``,
                    `**Initial Assignments:** \`${formatNumber(assignments)}\``,
                    `**Demotions:** \`${formatNumber(demotions)}\``,
                    `**Revocations:** \`${formatNumber(revocations)}\``,
                    `**Other Changes:** \`${formatNumber(changes)}\``
                ].join('\n'),

            inline:
                true
        },
        {
            name:
                '📅 Career Duration',

            value:
                [
                    `**First Record:** ${firstRecord ? formatDiscordDate(firstRecord.created_at, 'D') : 'Not recorded'}`,
                    `**Latest Record:** ${latestRecord ? formatDiscordDate(latestRecord.created_at, 'R') : 'Not recorded'}`,
                    `**Recorded Career:** \`${firstRecord ? formatNumber(calculateDaysSince(firstRecord.created_at)) : '0'} days\``
                ].join('\n'),

            inline:
                true
        },
        {
            name:
                '⚔️ Career Momentum',

            value:
                [
                    `**Stability Score:** \`${stabilityScore}%\``,
                    '',
                    `⬆️ **Positive Movements:** \`${formatNumber(positiveMovement)}\``,
                    `⬇️ **Negative Movements:** \`${formatNumber(negativeMovement)}\``,
                    '',
                    '-# This visual score compares promotions and assignments against demotions and revocations.'
                ].join('\n'),

            inline:
                false
        }
    );

    if (
        uniqueRanks.size >
        0
    ) {
        const orderedRanks =
            [...uniqueRanks]
                .sort(
                    (
                        firstRank,
                        secondRank
                    ) =>
                        getRankIndex(
                            firstRank
                        ) -
                        getRankIndex(
                            secondRank
                        )
                );

        embed.addFields({
            name:
                '📜 Ranks Held During Career',

            value:
                orderedRanks
                    .map(
                        rank =>
                            `• ${rank}`
                    )
                    .join('\n'),

            inline:
                false
        });
    }

    return embed;
}

/**
 * Build the requested Rank History page.
 *
 * @param {Object} context
 * @param {string} selectedPage
 * @returns {import('discord.js').EmbedBuilder}
 */
function buildRankHistoryPage(
    context,
    selectedPage
) {
    switch (
        selectedPage
    ) {
        case RANK_HISTORY_PAGES.timeline:
            return buildTimelinePage(
                context
            );

        case RANK_HISTORY_PAGES.promotions:
            return buildPromotionsPage(
                context
            );

        case RANK_HISTORY_PAGES.demotions:
            return buildDemotionsPage(
                context
            );

        case RANK_HISTORY_PAGES.revocations:
            return buildRevocationsPage(
                context
            );

        case RANK_HISTORY_PAGES.statistics:
            return buildStatisticsPage(
                context
            );

        case RANK_HISTORY_PAGES.overview:
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
                'rankhistory'
            )
            .setDescription(
                'Open an interactive Arrancar career archive.'
            )

            .addUserOption(option =>
                option
                    .setName(
                        'user'
                    )
                    .setDescription(
                        'Select the Soul whose Arrancar career you want to inspect'
                    )
                    .setRequired(
                        false
                    )
            )

            .addIntegerOption(option =>
                option
                    .setName(
                        'limit'
                    )
                    .setDescription(
                        'Number of hierarchy records to load'
                    )
                    .setMinValue(
                        1
                    )
                    .setMaxValue(
                        25
                    )
                    .setRequired(
                        false
                    )
            )

            .setDMPermission(
                false
            ),

    /**
     * Execute the /rankhistory command.
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
                            'Arrancar career archives can only be opened inside Las Noches.'
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

            const limit =
                interaction.options.getInteger(
                    'limit'
                ) ??
                25;

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

            let [
                currentRank,
                history,
                totalHistoryCount
            ] =
                await Promise.all([
                    rankDatabase
                        .getCurrentRank(
                            interaction.guild.id,
                            member.id
                        ),

                    rankDatabase
                        .getRankHistory(
                            interaction.guild.id,
                            member.id,
                            limit
                        ),

                    rankDatabase
                        .countRankHistory(
                            interaction.guild.id,
                            member.id
                        )
                ]);

            let context = {
                interaction,
                member,
                currentRank,

                history:
                    Array.isArray(
                        history
                    )
                        ? history
                        : [],

                totalHistoryCount:
                    Number(
                        totalHistoryCount || 0
                    )
            };

            let selectedPage =
                RANK_HISTORY_PAGES.overview;

            const initialEmbed =
                buildRankHistoryPage(
                    context,
                    selectedPage
                );

            const replyMessage =
                await interaction.editReply({
                    embeds: [
                        initialEmbed
                    ],

                    components: [
                        createRankHistoryMenu(
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
                                        '❌ Private Career Archive',
                                        'Only the Soul who opened this Arrancar career archive may control its navigation.'
                                    )
                                ],

                                flags:
                                    MessageFlags.Ephemeral
                            });

                            return;
                        }

                        if (
                            menuInteraction.customId !==
                            RANK_HISTORY_MENU_ID
                        ) {
                            return;
                        }

                        const requestedPage =
                            menuInteraction.values[0];

                        if (
                            !RANK_HISTORY_PAGE_ORDER.includes(
                                requestedPage
                            )
                        ) {
                            await menuInteraction.reply({
                                embeds: [
                                    createErrorEmbed(
                                        '❌ Unknown Career Archive',
                                        'Umbra could not recognize the selected hierarchy page.'
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
                         * Reload hierarchy data before
                         * every page transition.
                         *
                         * Promotions, demotions and
                         * revocations appear without
                         * reopening /rankhistory.
                         */
                        [
                            currentRank,
                            history,
                            totalHistoryCount
                        ] =
                            await Promise.all([
                                rankDatabase
                                    .getCurrentRank(
                                        interaction.guild.id,
                                        member.id
                                    ),

                                rankDatabase
                                    .getRankHistory(
                                        interaction.guild.id,
                                        member.id,
                                        limit
                                    ),

                                rankDatabase
                                    .countRankHistory(
                                        interaction.guild.id,
                                        member.id
                                    )
                            ]);

                        context = {
                            interaction,
                            member,
                            currentRank,

                            history:
                                Array.isArray(
                                    history
                                )
                                    ? history
                                    : [],

                            totalHistoryCount:
                                Number(
                                    totalHistoryCount || 0
                                )
                        };

                        const updatedEmbed =
                            buildRankHistoryPage(
                                context,
                                selectedPage
                            );

                        await menuInteraction.update({
                            embeds: [
                                updatedEmbed
                            ],

                            components: [
                                createRankHistoryMenu(
                                    selectedPage
                                )
                            ]
                        });
                    } catch (menuError) {
                        console.error(
                            '❌ Umbra /rankhistory navigation error:',
                            menuError
                        );

                        const navigationErrorEmbed =
                            createErrorEmbed(
                                '❌ Career Navigation Failed',
                                [
                                    'Umbra could not open the selected hierarchy archive.',
                                    '',
                                    'Please try opening `/rankhistory` again.'
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
                '❌ Umbra /rankhistory command error:',
                error
            );

            const errorEmbed =
                createErrorEmbed(
                    '❌ Arrancar Career Archive Unavailable',
                    [
                        'Umbra could not open the requested Arrancar career archive.',
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