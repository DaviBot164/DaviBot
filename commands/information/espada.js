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
    levels:
        levelDatabase,

    ranks:
        rankDatabase
} = require('../../database');

/**
 * Official Espada positions ordered
 * from the highest throne to the lowest.
 */
const ESPADA_POSITIONS = [
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
];

/**
 * Espada panel select menu ID.
 */
const ESPADA_MENU_ID =
    'umbra_espada_page_menu';

/**
 * Interactive Espada page identifiers.
 */
const ESPADA_PAGES = {
    overview:
        'espada_overview',

    hierarchy:
        'espada_hierarchy',

    statistics:
        'espada_statistics',

    vacancies:
        'espada_vacancies',

    archive:
        'espada_archive'
};

/**
 * Espada page order.
 */
const ESPADA_PAGE_ORDER = [
    ESPADA_PAGES.overview,
    ESPADA_PAGES.hierarchy,
    ESPADA_PAGES.statistics,
    ESPADA_PAGES.vacancies,
    ESPADA_PAGES.archive
];

/**
 * Espada page display configuration.
 */
const ESPADA_PAGE_DETAILS = {
    [ESPADA_PAGES.overview]: {
        emoji:
            '👑',

        label:
            'Throne Overview',

        description:
            'Central status of the Espada thrones'
    },

    [ESPADA_PAGES.hierarchy]: {
        emoji:
            '⚔️',

        label:
            'Hierarchy',

        description:
            'View every active Espada throne holder'
    },

    [ESPADA_PAGES.statistics]: {
        emoji:
            '📊',

        label:
            'Statistics',

        description:
            'Levels, XP and hierarchy statistics'
    },

    [ESPADA_PAGES.vacancies]: {
        emoji:
            '🌑',

        label:
            'Vacant Thrones',

        description:
            'Inspect every currently unclaimed throne'
    },

    [ESPADA_PAGES.archive]: {
        emoji:
            '📖',

        label:
            'Promotion Archive',

        description:
            'Review recent Espada promotion records'
    }
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
 * Find one Discord role using
 * its exact configured name.
 *
 * @param {import('discord.js').Guild} guild
 * @param {string} roleName
 * @returns {import('discord.js').Role|null}
 */
function findGuildRole(
    guild,
    roleName
) {
    return (
        guild.roles.cache.find(
            role =>
                role.name ===
                roleName
        ) ||
        null
    );
}

/**
 * Get every non-bot member currently
 * holding one Espada role.
 *
 * @param {import('discord.js').Role|null} role
 * @returns {import('discord.js').GuildMember[]}
 */
function getRoleMembers(
    role
) {
    if (!role) {
        return [];
    }

    return role.members
        .filter(
            member =>
                !member.user.bot
        )
        .sort(
            (
                firstMember,
                secondMember
            ) =>
                firstMember.displayName
                    .localeCompare(
                        secondMember.displayName
                    )
        )
        .map(
            member =>
                member
        );
}

/**
 * Safely load Level and Rank archive
 * data for one Espada member.
 *
 * @param {import('discord.js').Guild} guild
 * @param {import('discord.js').GuildMember} member
 * @returns {Promise<Object>}
 */
async function getEspadaMemberData(
    guild,
    member
) {
    const [
        levelData,
        rankData,
        rankHistory
    ] =
        await Promise.all([
            levelDatabase
                .getUserLevel(
                    guild.id,
                    member.id
                )
                .catch(
                    () => null
                ),

            rankDatabase
                .getCurrentRank(
                    guild.id,
                    member.id
                )
                .catch(
                    () => null
                ),

            rankDatabase
                .getRankHistory(
                    guild.id,
                    member.id,
                    3
                )
                .catch(
                    () => []
                )
        ]);

    return {
        member,

        level:
            Number(
                levelData?.level || 0
            ),

        xp:
            Number(
                levelData?.xp || 0
            ),

        assignedAt:
            rankData?.assigned_at ||
            rankData?.assignedAt ||
            null,

        assignedBy:
            rankData?.assigned_by ||
            rankData?.assignedBy ||
            null,

        reason:
            rankData?.reason ||
            'No promotion reason was recorded.',

        rankHistory:
            Array.isArray(
                rankHistory
            )
                ? rankHistory
                : []
    };
}

/**
 * Count all unique active Espada Souls.
 *
 * @param {Object[]} positionRecords
 * @returns {number}
 */
function countUniqueEspada(
    positionRecords
) {
    const uniqueMemberIds =
        new Set();

    for (
        const positionRecord
        of positionRecords
    ) {
        for (
            const holder
            of positionRecord.holders
        ) {
            uniqueMemberIds.add(
                holder.member.id
            );
        }
    }

    return uniqueMemberIds.size;
}

/**
 * Flatten every active Espada holder.
 *
 * @param {Object[]} positionRecords
 * @returns {Object[]}
 */
function getAllEspadaHolders(
    positionRecords
) {
    return positionRecords.flatMap(
        positionRecord =>
            positionRecord.holders.map(
                holder => ({
                    ...holder,

                    positionName:
                        positionRecord.positionName
                })
            )
    );
}

/**
 * Calculate an average numeric value.
 *
 * @param {number[]} values
 * @returns {number}
 */
function calculateAverage(
    values
) {
    const safeValues =
        values.filter(
            value =>
                Number.isFinite(
                    Number(
                        value
                    )
                )
        );

    if (
        safeValues.length ===
        0
    ) {
        return 0;
    }

    const total =
        safeValues.reduce(
            (
                sum,
                value
            ) =>
                sum +
                Number(
                    value
                ),
            0
        );

    return Math.round(
        total /
        safeValues.length
    );
}

/**
 * Create the interactive Espada page menu.
 *
 * @param {string} selectedPage
 * @param {boolean} disabled
 * @returns {ActionRowBuilder<StringSelectMenuBuilder>}
 */
function createEspadaMenu(
    selectedPage,
    disabled = false
) {
    const menu =
        new StringSelectMenuBuilder()
            .setCustomId(
                ESPADA_MENU_ID
            )
            .setPlaceholder(
                'Select an Espada throne archive'
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
        of ESPADA_PAGE_ORDER
    ) {
        const details =
            ESPADA_PAGE_DETAILS[
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
 * Create the shared Espada Embed.
 *
 * @param {Object} options
 * @param {import('discord.js').ChatInputCommandInteraction} options.interaction
 * @param {string} options.title
 * @param {string} options.description
 * @param {string} [options.color]
 * @returns {import('discord.js').EmbedBuilder}
 */
function createEspadaEmbed({
    interaction,
    title,
    description,
    color =
        embedConfig.colors.rank
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
                '*The strongest Arrancar stand beneath the eternal moon of Las Noches.*'
            ].join('\n'),

        color,

        thumbnail:
            guildIcon ||
            botAvatar,

        author: {
            name:
                `${interaction.guild.name} • Espada Throne Records`,

            iconURL:
                guildIcon ||
                botAvatar
        },

        footer: {
            text:
                `🌙 Umbra • Guardian of Las Noches • Opened by ${interaction.user.username}`,

            iconURL:
                botAvatar
        }
    });
}/**
 * Format one active Espada throne.
 *
 * @param {Object} positionRecord
 * @returns {string}
 */
function formatHierarchyPosition(
    positionRecord
) {
    const {
        positionName,
        holders
    } =
        positionRecord;

    if (
        !Array.isArray(
            holders
        ) ||
        holders.length === 0
    ) {
        return [
            `### ${positionName}`,
            '🌑 **Vacant Throne**',
            '-# This position currently awaits a worthy Arrancar.'
        ].join('\n');
    }

    if (
        holders.length >
        1
    ) {
        return [
            `### ${positionName}`,
            '⚠️ **Hierarchy Conflict Detected**',
            '-# More than one Soul currently holds this throne.',
            '',
            ...holders.map(
                holder =>
                    [
                        `${holder.member}`,
                        `-# Level ${formatNumber(holder.level)} • ${formatNumber(holder.xp)} XP`
                    ].join('\n')
            )
        ].join('\n');
    }

    const holder =
        holders[0];

    return [
        `### ${positionName}`,
        `${holder.member}`,
        `⭐ **Soul Level:** \`${formatNumber(holder.level)}\``,
        `✨ **Spiritual Power:** \`${formatNumber(holder.xp)} XP\``,
        `📅 **Promoted:** ${formatDiscordDate(holder.assignedAt, 'D')} (${formatDiscordDate(holder.assignedAt, 'R')})`,
        holder.assignedBy
            ? `👑 **Assigned By:** <@${holder.assignedBy}>`
            : '👑 **Assigned By:** Not recorded'
    ].join('\n');
}

/**
 * Split formatted records into safe
 * Discord Embed field values.
 *
 * @param {string[]} records
 * @param {number} maxLength
 * @returns {string[]}
 */
function splitEspadaRecords(
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
 * Find the strongest active Espada
 * using the configured throne order.
 *
 * @param {Object[]} positionRecords
 * @returns {Object|null}
 */
function findHighestEspada(
    positionRecords
) {
    for (
        const positionRecord
        of positionRecords
    ) {
        if (
            positionRecord
                .holders
                .length >
            0
        ) {
            return {
                positionName:
                    positionRecord.positionName,

                holder:
                    positionRecord.holders[0]
            };
        }
    }

    return null;
}

/**
 * Find the Espada Soul with the
 * highest recorded Soul Level.
 *
 * @param {Object[]} holders
 * @returns {Object|null}
 */
function findHighestLevelHolder(
    holders
) {
    if (
        !Array.isArray(
            holders
        ) ||
        holders.length === 0
    ) {
        return null;
    }

    return [...holders]
        .sort(
            (
                firstHolder,
                secondHolder
            ) =>
                secondHolder.level -
                firstHolder.level
        )[0];
}

/**
 * Find the Espada Soul with the
 * highest recorded XP.
 *
 * @param {Object[]} holders
 * @returns {Object|null}
 */
function findHighestXpHolder(
    holders
) {
    if (
        !Array.isArray(
            holders
        ) ||
        holders.length === 0
    ) {
        return null;
    }

    return [...holders]
        .sort(
            (
                firstHolder,
                secondHolder
            ) =>
                secondHolder.xp -
                firstHolder.xp
        )[0];
}

/**
 * Find the most recent known throne
 * promotion from current Rank records.
 *
 * @param {Object[]} holders
 * @returns {Object|null}
 */
function findLatestPromotion(
    holders
) {
    const holdersWithDate =
        holders.filter(
            holder =>
                holder.assignedAt
        );

    if (
        holdersWithDate.length ===
        0
    ) {
        return null;
    }

    return [...holdersWithDate]
        .sort(
            (
                firstHolder,
                secondHolder
            ) =>
                new Date(
                    secondHolder.assignedAt
                ).getTime() -
                new Date(
                    firstHolder.assignedAt
                ).getTime()
        )[0];
}

/**
 * Find the oldest current throne holder.
 *
 * @param {Object[]} holders
 * @returns {Object|null}
 */
function findOldestPromotion(
    holders
) {
    const holdersWithDate =
        holders.filter(
            holder =>
                holder.assignedAt
        );

    if (
        holdersWithDate.length ===
        0
    ) {
        return null;
    }

    return [...holdersWithDate]
        .sort(
            (
                firstHolder,
                secondHolder
            ) =>
                new Date(
                    firstHolder.assignedAt
                ).getTime() -
                new Date(
                    secondHolder.assignedAt
                ).getTime()
        )[0];
}

/**
 * Build the central Throne Overview.
 *
 * @param {Object} context
 * @returns {import('discord.js').EmbedBuilder}
 */
function buildOverviewPage(
    context
) {
    const {
        interaction,
        positionRecords,
        missingRoles
    } =
        context;

    const activePositions =
        positionRecords.filter(
            record =>
                record.holders.length >
                0
        ).length;

    const vacantPositions =
        ESPADA_POSITIONS.length -
        activePositions;

    const occupancyPercentage =
        Math.round(
            (
                activePositions /
                ESPADA_POSITIONS.length
            ) *
            100
        );

    const activeEspada =
        countUniqueEspada(
            positionRecords
        );

    const allHolders =
        getAllEspadaHolders(
            positionRecords
        );

    const highestEspada =
        findHighestEspada(
            positionRecords
        );

    const strongestLevelHolder =
        findHighestLevelHolder(
            allHolders
        );

    const latestPromotion =
        findLatestPromotion(
            allHolders
        );

    const embed =
        createEspadaEmbed({
            interaction,

            title:
                '👑 The Thrones of Las Noches',

            description:
                [
                    'Umbra has opened the central throne chamber of the Espada.',
                    '',
                    '## THE THRONES',
                    '## OF LAS NOCHES'
                ].join('\n'),

            color:
                embedConfig.colors.rank
        });

    embed.addFields(
        {
            name:
                '👑 Throne Occupancy',

            value:
                [
                    `\`${createProgressBar(occupancyPercentage, 18)}\` **${occupancyPercentage}%**`,
                    '',
                    `⚔️ **Active Espada Souls:** \`${formatNumber(activeEspada)}\``,
                    `👑 **Occupied Thrones:** \`${formatNumber(activePositions)} / ${formatNumber(ESPADA_POSITIONS.length)}\``,
                    `🌑 **Vacant Thrones:** \`${formatNumber(vacantPositions)}\``
                ].join('\n'),

            inline:
                false
        },
        {
            name:
                '⚔️ Highest Active Throne',

            value:
                highestEspada
                    ? [
                        `**Position:** ${highestEspada.positionName}`,
                        `**Holder:** ${highestEspada.holder.member}`,
                        `**Soul Level:** \`${formatNumber(highestEspada.holder.level)}\``,
                        `**Spiritual Power:** \`${formatNumber(highestEspada.holder.xp)} XP\``
                    ].join('\n')
                    : '🌑 No Espada throne is currently occupied.',

            inline:
                true
        },
        {
            name:
                '⭐ Strongest Recorded Soul',

            value:
                strongestLevelHolder
                    ? [
                        `**Soul:** ${strongestLevelHolder.member}`,
                        `**Throne:** ${strongestLevelHolder.positionName}`,
                        `**Level:** \`${formatNumber(strongestLevelHolder.level)}\``,
                        `**XP:** \`${formatNumber(strongestLevelHolder.xp)}\``
                    ].join('\n')
                    : 'No active Espada data is available.',

            inline:
                true
        },
        {
            name:
                '📅 Latest Promotion',

            value:
                latestPromotion
                    ? [
                        `**Soul:** ${latestPromotion.member}`,
                        `**Throne:** ${latestPromotion.positionName}`,
                        `**Promoted:** ${formatDiscordDate(latestPromotion.assignedAt, 'R')}`
                    ].join('\n')
                    : 'No current promotion date is recorded.',

            inline:
                false
        },
        {
            name:
                '🧭 Recommended Workflow',

            value:
                [
                    '`/espada` — inspect the throne system',
                    '`/rankhistory` — review one Soul’s hierarchy history',
                    '`/soul` — open the complete Soul Record',
                    '',
                    '-# High Command may use `/setrank` and `/removerank` to manage the hierarchy.'
                ].join('\n'),

            inline:
                false
        }
    );

    if (
        missingRoles.length >
        0
    ) {
        embed.addFields({
            name:
                '⚠️ Missing Espada Roles',

            value:
                [
                    ...missingRoles.map(
                        record =>
                            `• ${record.positionName}`
                    ),
                    '',
                    '-# These Discord role names must match the configured throne names exactly.'
                ].join('\n'),

            inline:
                false
        });
    }

    return embed;
}

/**
 * Build the full Espada hierarchy page.
 *
 * @param {Object} context
 * @returns {import('discord.js').EmbedBuilder}
 */
function buildHierarchyPage(
    context
) {
    const {
        interaction,
        positionRecords
    } =
        context;

    const embed =
        createEspadaEmbed({
            interaction,

            title:
                '⚔️ Official Espada Hierarchy',

            description:
                'Every configured Espada throne and its current holder.'
        });

    const records =
        positionRecords.map(
            formatHierarchyPosition
        );

    const chunks =
        splitEspadaRecords(
            records
        );

    chunks.forEach(
        (
            chunk,
            index
        ) => {
            embed.addFields({
                name:
                    index === 0
                        ? '👑 Throne Records'
                        : '👑 Throne Records — Continued',

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
 * Build hierarchy statistics.
 *
 * @param {Object} context
 * @returns {import('discord.js').EmbedBuilder}
 */
function buildStatisticsPage(
    context
) {
    const {
        interaction,
        positionRecords
    } =
        context;

    const allHolders =
        getAllEspadaHolders(
            positionRecords
        );

    const activePositions =
        positionRecords.filter(
            record =>
                record.holders.length >
                0
        ).length;

    const conflictPositions =
        positionRecords.filter(
            record =>
                record.holders.length >
                1
        );

    const averageLevel =
        calculateAverage(
            allHolders.map(
                holder =>
                    holder.level
            )
        );

    const averageXp =
        calculateAverage(
            allHolders.map(
                holder =>
                    holder.xp
            )
        );

    const highestLevelHolder =
        findHighestLevelHolder(
            allHolders
        );

    const highestXpHolder =
        findHighestXpHolder(
            allHolders
        );

    const newestHolder =
        findLatestPromotion(
            allHolders
        );

    const oldestHolder =
        findOldestPromotion(
            allHolders
        );

    const embed =
        createEspadaEmbed({
            interaction,

            title:
                '📊 Espada Hierarchy Statistics',

            description:
                'Umbra has calculated the current balance of power among the Espada.'
        });

    embed.addFields(
        {
            name:
                '👑 Throne Status',

            value:
                [
                    `**Configured Thrones:** \`${ESPADA_POSITIONS.length}\``,
                    `**Occupied Thrones:** \`${activePositions}\``,
                    `**Unique Espada Souls:** \`${countUniqueEspada(positionRecords)}\``,
                    `**Hierarchy Conflicts:** \`${conflictPositions.length}\``
                ].join('\n'),

            inline:
                false
        },
        {
            name:
                '⭐ Average Power',

            value:
                [
                    `**Average Soul Level:** \`${formatNumber(averageLevel)}\``,
                    `**Average Spiritual Power:** \`${formatNumber(averageXp)} XP\``
                ].join('\n'),

            inline:
                false
        },
        {
            name:
                '🏆 Highest Soul Level',

            value:
                highestLevelHolder
                    ? [
                        `**Soul:** ${highestLevelHolder.member}`,
                        `**Throne:** ${highestLevelHolder.positionName}`,
                        `**Level:** \`${formatNumber(highestLevelHolder.level)}\``
                    ].join('\n')
                    : 'No active Espada data is available.',

            inline:
                true
        },
        {
            name:
                '✨ Highest Spiritual Power',

            value:
                highestXpHolder
                    ? [
                        `**Soul:** ${highestXpHolder.member}`,
                        `**Throne:** ${highestXpHolder.positionName}`,
                        `**XP:** \`${formatNumber(highestXpHolder.xp)}\``
                    ].join('\n')
                    : 'No active Espada data is available.',

            inline:
                true
        },
        {
            name:
                '🆕 Most Recent Throne Holder',

            value:
                newestHolder
                    ? [
                        `**Soul:** ${newestHolder.member}`,
                        `**Throne:** ${newestHolder.positionName}`,
                        `**Promoted:** ${formatDiscordDate(newestHolder.assignedAt, 'R')}`
                    ].join('\n')
                    : 'No promotion date is recorded.',

            inline:
                true
        },
        {
            name:
                '📜 Longest Current Reign',

            value:
                oldestHolder
                    ? [
                        `**Soul:** ${oldestHolder.member}`,
                        `**Throne:** ${oldestHolder.positionName}`,
                        `**Since:** ${formatDiscordDate(oldestHolder.assignedAt, 'D')}`
                    ].join('\n')
                    : 'No promotion date is recorded.',

            inline:
                true
        }
    );

    if (
        conflictPositions.length >
        0
    ) {
        embed.addFields({
            name:
                '⚠️ Hierarchy Conflicts',

            value:
                conflictPositions
                    .map(
                        record =>
                            `• **${record.positionName}** — ${record.holders.length} holders`
                    )
                    .join('\n'),

            inline:
                false
        });
    }

    return embed;
}

/**
 * Build the vacant throne page.
 *
 * @param {Object} context
 * @returns {import('discord.js').EmbedBuilder}
 */
function buildVacanciesPage(
    context
) {
    const {
        interaction,
        positionRecords
    } =
        context;

    const vacantRecords =
        positionRecords.filter(
            record =>
                record.holders.length ===
                0
        );

    const occupiedRecords =
        positionRecords.filter(
            record =>
                record.holders.length >
                0
        );

    const embed =
        createEspadaEmbed({
            interaction,

            title:
                '🌑 Vacant Espada Thrones',

            description:
                'Every throne currently awaiting a worthy Arrancar.',
            color:
                embedConfig.colors.archive
        });

    embed.addFields({
        name:
            '📊 Vacancy Status',

        value:
            [
                `**Vacant Thrones:** \`${vacantRecords.length}\``,
                `**Occupied Thrones:** \`${occupiedRecords.length}\``,
                `**Total Thrones:** \`${ESPADA_POSITIONS.length}\``
            ].join('\n'),

        inline:
            false
    });

    if (
        vacantRecords.length >
        0
    ) {
        embed.addFields({
            name:
                '🌑 Unclaimed Thrones',

            value:
                vacantRecords
                    .map(
                        record =>
                            [
                                `### ${record.positionName}`,
                                '🌑 **Vacant**',
                                '-# This throne awaits a new proclamation from the High Command.'
                            ].join('\n')
                    )
                    .join(
                        '\n\n━━━━━━━━━━━━━━━━━━━━\n\n'
                    ),

            inline:
                false
        });
    } else {
        embed.addFields({
            name:
                '👑 Complete Hierarchy',

            value:
                [
                    'Every configured Espada throne is currently occupied.',
                    '',
                    `\`${createProgressBar(100, 18)}\` **100%**`
                ].join('\n'),

            inline:
                false
        });
    }

    return embed;
}

/**
 * Format one recent promotion record.
 *
 * @param {Object} holder
 * @param {Object} historyRecord
 * @returns {string}
 */
function formatPromotionRecord(
    holder,
    historyRecord
) {
    const previousRank =
        historyRecord?.old_rank ||
        historyRecord?.previous_rank ||
        'No previous Rank';

    const newRank =
        historyRecord?.new_rank ||
        historyRecord?.rank_name ||
        holder.positionName;

    const action =
        historyRecord?.action ||
        'RANK UPDATE';

    const reason =
        historyRecord?.reason ||
        'No reason was recorded.';

    const createdAt =
        historyRecord?.created_at ||
        historyRecord?.createdAt ||
        holder.assignedAt;

    const moderatorId =
        historyRecord?.moderator_id ||
        historyRecord?.moderatorId ||
        holder.assignedBy;

    return [
        `### ${action}`,
        `**Soul:** ${holder.member}`,
        `**Hierarchy:** ${previousRank} → ${newRank}`,
        moderatorId
            ? `**High Command:** <@${moderatorId}>`
            : '**High Command:** Not recorded',
        `**Reason:** ${reason}`,
        `**Recorded:** ${formatDiscordDate(createdAt, 'F')} (${formatDiscordDate(createdAt, 'R')})`
    ].join('\n');
}

/**
 * Build the recent Espada promotion archive.
 *
 * @param {Object} context
 * @returns {import('discord.js').EmbedBuilder}
 */
function buildArchivePage(
    context
) {
    const {
        interaction,
        positionRecords
    } =
        context;

    const allHolders =
        getAllEspadaHolders(
            positionRecords
        );

    const promotionRecords =
        allHolders
            .flatMap(
                holder =>
                    holder.rankHistory.map(
                        historyRecord => ({
                            holder,
                            historyRecord,

                            createdAt:
                                historyRecord?.created_at ||
                                historyRecord?.createdAt ||
                                holder.assignedAt ||
                                0
                        })
                    )
            )
            .sort(
                (
                    firstRecord,
                    secondRecord
                ) =>
                    new Date(
                        secondRecord.createdAt
                    ).getTime() -
                    new Date(
                        firstRecord.createdAt
                    ).getTime()
            )
            .slice(
                0,
                10
            );

    const embed =
        createEspadaEmbed({
            interaction,

            title:
                '📖 Espada Promotion Archive',

            description:
                'Recent hierarchy records belonging to current Espada throne holders.'
        });

    if (
        promotionRecords.length ===
        0
    ) {
        embed.addFields({
            name:
                '🌑 No Records Available',

            value:
                [
                    'No recent Espada promotion records could be loaded.',
                    '',
                    '-# Use `/rankhistory` to inspect the complete archive of one specific Soul.'
                ].join('\n'),

            inline:
                false
        });

        return embed;
    }

    const formattedRecords =
        promotionRecords.map(
            record =>
                formatPromotionRecord(
                    record.holder,
                    record.historyRecord
                )
        );

    const chunks =
        splitEspadaRecords(
            formattedRecords
        );

    chunks.forEach(
        (
            chunk,
            index
        ) => {
            embed.addFields({
                name:
                    index === 0
                        ? '📜 Recent Hierarchy Records'
                        : '📜 Recent Hierarchy Records — Continued',

                value:
                    chunk,

                inline:
                    false
            });
        }
    );

    embed.addFields({
        name:
            '🧭 Complete Soul Archive',

        value:
            [
                'Use `/rankhistory user:@Soul` to open the full promotion, demotion and revocation history of one Soul.'
            ].join('\n'),

        inline:
            false
    });

    return embed;
}

/**
 * Build the requested Espada page.
 *
 * @param {Object} context
 * @param {string} selectedPage
 * @returns {import('discord.js').EmbedBuilder}
 */
function buildEspadaPage(
    context,
    selectedPage
) {
    switch (
        selectedPage
    ) {
        case ESPADA_PAGES.hierarchy:
            return buildHierarchyPage(
                context
            );

        case ESPADA_PAGES.statistics:
            return buildStatisticsPage(
                context
            );

        case ESPADA_PAGES.vacancies:
            return buildVacanciesPage(
                context
            );

        case ESPADA_PAGES.archive:
            return buildArchivePage(
                context
            );

        case ESPADA_PAGES.overview:
        default:
            return buildOverviewPage(
                context
            );
    }
}/**
 * Load the complete current Espada hierarchy.
 *
 * @param {import('discord.js').Guild} guild
 * @returns {Promise<{
 *     positionRecords: Object[],
 *     missingRoles: Object[]
 * }>}
 */
async function loadEspadaHierarchy(
    guild
) {
    await guild.members
        .fetch()
        .catch(
            () => null
        );

    const positionRecords =
        [];

    for (
        const positionName
        of ESPADA_POSITIONS
    ) {
        const role =
            findGuildRole(
                guild,
                positionName
            );

        const members =
            getRoleMembers(
                role
            );

        const holders =
            await Promise.all(
                members.map(
                    member =>
                        getEspadaMemberData(
                            guild,
                            member
                        )
                )
            );

        positionRecords.push({
            positionName,
            role,
            holders
        });
    }

    const missingRoles =
        positionRecords.filter(
            record =>
                !record.role
        );

    return {
        positionRecords,
        missingRoles
    };
}

module.exports = {
    category:
        'information',

    data:
        new SlashCommandBuilder()
            .setName(
                'espada'
            )
            .setDescription(
                'Open the interactive Espada throne system of Las Noches.'
            )
            .setDMPermission(
                false
            ),

    /**
     * Execute the /espada command.
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
                            'The Espada throne system can only be opened inside Las Noches.'
                        )
                    ],

                    flags:
                        MessageFlags.Ephemeral
                });

                return;
            }

            await interaction.deferReply();

            let hierarchyData =
                await loadEspadaHierarchy(
                    interaction.guild
                );

            let context = {
                interaction,

                positionRecords:
                    hierarchyData
                        .positionRecords,

                missingRoles:
                    hierarchyData
                        .missingRoles
            };

            let selectedPage =
                ESPADA_PAGES.overview;

            const initialEmbed =
                buildEspadaPage(
                    context,
                    selectedPage
                );

            const replyMessage =
                await interaction.editReply({
                    embeds: [
                        initialEmbed
                    ],

                    components: [
                        createEspadaMenu(
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
                                        '❌ Private Throne Archive',
                                        'Only the Soul who opened this Espada throne system may control its navigation.'
                                    )
                                ],

                                flags:
                                    MessageFlags.Ephemeral
                            });

                            return;
                        }

                        if (
                            menuInteraction.customId !==
                            ESPADA_MENU_ID
                        ) {
                            return;
                        }

                        const requestedPage =
                            menuInteraction.values[0];

                        if (
                            !ESPADA_PAGE_ORDER.includes(
                                requestedPage
                            )
                        ) {
                            await menuInteraction.reply({
                                embeds: [
                                    createErrorEmbed(
                                        '❌ Unknown Throne Archive',
                                        'Umbra could not recognize the selected Espada page.'
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
                         * Reload the entire hierarchy before
                         * every page change.
                         *
                         * Promotions, removals, Level changes
                         * and role updates appear without
                         * reopening /espada.
                         */
                        hierarchyData =
                            await loadEspadaHierarchy(
                                interaction.guild
                            );

                        context = {
                            interaction,

                            positionRecords:
                                hierarchyData
                                    .positionRecords,

                            missingRoles:
                                hierarchyData
                                    .missingRoles
                        };

                        const updatedEmbed =
                            buildEspadaPage(
                                context,
                                selectedPage
                            );

                        await menuInteraction.update({
                            embeds: [
                                updatedEmbed
                            ],

                            components: [
                                createEspadaMenu(
                                    selectedPage
                                )
                            ]
                        });
                    } catch (menuError) {
                        console.error(
                            '❌ Umbra /espada navigation error:',
                            menuError
                        );

                        const navigationErrorEmbed =
                            createErrorEmbed(
                                '❌ Throne Navigation Failed',
                                [
                                    'Umbra could not open the selected Espada throne archive.',
                                    '',
                                    'Please try opening `/espada` again.'
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
                                createEspadaMenu(
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
                '❌ Umbra /espada command error:',
                error
            );

            const errorEmbed =
                createErrorEmbed(
                    '❌ Espada Throne System Unavailable',
                    [
                        'Umbra could not open the official Espada hierarchy.',
                        '',
                        'Please verify the following:',
                        '• PostgreSQL is connected',
                        '• Espada roles still exist',
                        '• Rank and Level databases are initialized',
                        '• Umbra can view server members',
                        '',
                        'Inspect the Northflank logs if the problem continues.'
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