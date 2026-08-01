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
    kingdom:
        kingdomDatabase
} = require('../../database');

/**
 * Kingdom Dashboard navigation menu ID.
 */
const KINGDOM_MENU_ID =
    'umbra_lasnoches_dashboard_menu';

/**
 * Kingdom Dashboard page identifiers.
 */
const KINGDOM_PAGES = {
    overview:
        'lasnoches_dashboard_overview',

    command:
        'lasnoches_dashboard_command',

    population:
        'lasnoches_dashboard_population',

    progression:
        'lasnoches_dashboard_progression',

    espada:
        'lasnoches_dashboard_espada',

    chronicles:
        'lasnoches_dashboard_chronicles',

    activity:
        'lasnoches_dashboard_activity'
};

/**
 * Kingdom Dashboard page order.
 */
const KINGDOM_PAGE_ORDER = [
    KINGDOM_PAGES.overview,
    KINGDOM_PAGES.command,
    KINGDOM_PAGES.population,
    KINGDOM_PAGES.progression,
    KINGDOM_PAGES.espada,
    KINGDOM_PAGES.chronicles,
    KINGDOM_PAGES.activity
];

/**
 * Kingdom Dashboard page details.
 */
const KINGDOM_PAGE_DETAILS = {
    [KINGDOM_PAGES.overview]: {
        emoji:
            '🏰',

        label:
            'Kingdom Overview',

        description:
            'Central status of Las Noches'
    },

    [KINGDOM_PAGES.command]: {
        emoji:
            '👑',

        label:
            'High Command',

        description:
            'Leadership and administrative divisions'
    },

    [KINGDOM_PAGES.population]: {
        emoji:
            '👥',

        label:
            'Population',

        description:
            'Members, evolution and hierarchy census'
    },

    [KINGDOM_PAGES.progression]: {
        emoji:
            '⭐',

        label:
            'Progression',

        description:
            'Levels, XP and message statistics'
    },

    [KINGDOM_PAGES.espada]: {
        emoji:
            '⚔️',

        label:
            'Espada Status',

        description:
            'Throne occupancy and hierarchy summary'
    },

    [KINGDOM_PAGES.chronicles]: {
        emoji:
            '🏆',

        label:
            'Chronicles',

        description:
            'Achievements and Chronicle Titles'
    },

    [KINGDOM_PAGES.activity]: {
        emoji:
            '📈',

        label:
            'Kingdom Activity',

        description:
            'Recent archive and hierarchy activity'
    }
};

/**
 * Administrative roles displayed
 * inside the Kingdom Dashboard.
 */
const STAFF_ROLES = [
    '⚜️ Head Captain',
    '🛡️ Captain',
    '⚔️ Lieutenant'
];

/**
 * Official Espada positions.
 */
const ESPADA_ROLES = [
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
 * Hollow Evolution roles managed
 * by the Soul Level system.
 */
const HOLLOW_EVOLUTION_ROLES = [
    '👁️ Hollow',
    '🦴 Menos Grande',
    '⚪ Gillian',
    '🐺 Adjuchas',
    '👑 Vasto Lorde',
    '⚔️ Arrancar'
];

/**
 * Additional manually assigned
 * Arrancar hierarchy roles.
 */
const ARRANCAR_HIERARCHY_ROLES = [
    '🌘 Privaron Espada',
    '⚔️ Fracción',
    '🦴 Numeros',
    '⚪ Unranked Arrancar'
];

/**
 * Chronicle Title rarity display order.
 */
const TITLE_RARITY_ORDER = [
    'Common',
    'Uncommon',
    'Rare',
    'Epic',
    'Legendary',
    'Mythic'
];

/**
 * Chronicle Title rarity icons.
 */
const TITLE_RARITY_ICONS = {
    Common:
        '⚪',

    Uncommon:
        '🟢',

    Rare:
        '🔵',

    Epic:
        '🟣',

    Legendary:
        '🟡',

    Mythic:
        '🔴'
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
 * Format a decimal value.
 *
 * @param {number|string|null|undefined} value
 * @param {number} digits
 * @returns {string}
 */
function formatDecimal(
    value,
    digits = 1
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
        return '0.0';
    }

    return numericValue.toFixed(
        digits
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
            1_000
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
 * Calculate completion percentage.
 *
 * @param {number} completed
 * @param {number} total
 * @returns {number}
 */
function calculatePercentage(
    completed,
    total
) {
    const safeCompleted =
        Math.max(
            0,
            Number(
                completed
            ) ||
            0
        );

    const safeTotal =
        Math.max(
            0,
            Number(
                total
            ) ||
            0
        );

    if (
        safeTotal ===
        0
    ) {
        return 0;
    }

    return Math.min(
        100,
        Math.round(
            (
                safeCompleted /
                safeTotal
            ) *
            100
        )
    );
}

/**
 * Find one Discord role by its
 * exact configured name.
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
 * Get every non-bot member holding
 * one Discord role.
 *
 * @param {import('discord.js').Role|null} role
 * @returns {import('discord.js').GuildMember[]}
 */
function getHumanRoleMembers(
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
 * Format a member list.
 *
 * @param {import('discord.js').GuildMember[]} members
 * @param {string} emptyText
 * @param {number} limit
 * @returns {string}
 */
function formatMemberList(
    members,
    emptyText = '🌑 Vacant',
    limit = 10
) {
    if (
        !Array.isArray(
            members
        ) ||
        members.length ===
            0
    ) {
        return emptyText;
    }

    const visibleMembers =
        members.slice(
            0,
            limit
        );

    const lines =
        visibleMembers.map(
            member =>
                `${member}`
        );

    const remaining =
        members.length -
        visibleMembers.length;

    if (
        remaining >
        0
    ) {
        lines.push(
            `-# +${formatNumber(remaining)} additional Souls`
        );
    }

    return lines.join('\n');
}

/**
 * Resolve a database user ID into
 * a GuildMember mention.
 *
 * @param {import('discord.js').Guild} guild
 * @param {string|null|undefined} userId
 * @returns {string}
 */
function formatSoulMention(
    guild,
    userId
) {
    if (!userId) {
        return 'Unknown Soul';
    }

    const member =
        guild.members.cache.get(
            userId
        );

    if (member) {
        return `${member}`;
    }

    return `<@${userId}>`;
}

/**
 * Split long records into safe Discord
 * Embed field values.
 *
 * @param {string[]} records
 * @param {number} maxLength
 * @returns {string[]}
 */
function splitKingdomRecords(
    records,
    maxLength = 1_000
) {
    const chunks =
        [];

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
            if (
                currentChunk
            ) {
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

    if (
        currentChunk
    ) {
        chunks.push(
            currentChunk
        );
    }

    return chunks;
}

/**
 * Create the Kingdom Dashboard
 * navigation menu.
 *
 * @param {string} selectedPage
 * @param {boolean} disabled
 * @returns {ActionRowBuilder<StringSelectMenuBuilder>}
 */
function createKingdomMenu(
    selectedPage,
    disabled = false
) {
    const menu =
        new StringSelectMenuBuilder()
            .setCustomId(
                KINGDOM_MENU_ID
            )
            .setPlaceholder(
                'Select a Las Noches kingdom record'
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
        of KINGDOM_PAGE_ORDER
    ) {
        const details =
            KINGDOM_PAGE_DETAILS[
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
 * Create the shared Kingdom Dashboard
 * Embed foundation.
 *
 * @param {Object} options
 * @param {import('discord.js').ChatInputCommandInteraction} options.interaction
 * @param {string} options.title
 * @param {string} options.description
 * @param {string} [options.color]
 * @returns {import('discord.js').EmbedBuilder}
 */
function createKingdomEmbed({
    interaction,
    title,
    description,
    color =
        embedConfig.colors.accent
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
                '*Every Soul, Chronicle and throne is preserved beneath the eternal moon of Las Noches.*'
            ].join('\n'),

        color,

        thumbnail:
            guildIcon ||
            botAvatar,

        author: {
            name:
                `${interaction.guild.name} • Kingdom Dashboard`,

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
}

/**
 * Count the current Espada throne state.
 *
 * @param {import('discord.js').Guild} guild
 * @returns {{
 *     occupied: number,
 *     vacant: number,
 *     missing: number,
 *     uniqueHolders: number,
 *     conflicts: number
 * }}
 */
function getEspadaStatus(
    guild
) {
    let occupied =
        0;

    let missing =
        0;

    let conflicts =
        0;

    const uniqueHolderIds =
        new Set();

    for (
        const roleName
        of ESPADA_ROLES
    ) {
        const role =
            findGuildRole(
                guild,
                roleName
            );

        if (!role) {
            missing +=
                1;

            continue;
        }

        const members =
            getHumanRoleMembers(
                role
            );

        if (
            members.length >
            0
        ) {
            occupied +=
                1;
        }

        if (
            members.length >
            1
        ) {
            conflicts +=
                1;
        }

        for (
            const member
            of members
        ) {
            uniqueHolderIds.add(
                member.id
            );
        }
    }

    return {
        occupied,

        vacant:
            Math.max(
                0,
                ESPADA_ROLES.length -
                occupied -
                missing
            ),

        missing,

        uniqueHolders:
            uniqueHolderIds.size,

        conflicts
    };
}

/**
 * Count recognized High Command members.
 *
 * @param {import('discord.js').Guild} guild
 * @returns {number}
 */
function countHighCommandMembers(
    guild
) {
    const memberIds =
        new Set();

    memberIds.add(
        guild.ownerId
    );

    for (
        const roleName
        of STAFF_ROLES
    ) {
        const role =
            findGuildRole(
                guild,
                roleName
            );

        for (
            const member
            of getHumanRoleMembers(
                role
            )
        ) {
            memberIds.add(
                member.id
            );
        }
    }

    return memberIds.size;
}

/**
 * Build a readable Title rarity summary.
 *
 * @param {Object} rarityStatistics
 * @returns {string}
 */
function buildRaritySummary(
    rarityStatistics
) {
    return TITLE_RARITY_ORDER
        .map(
            rarity => {
                const details =
                    rarityStatistics?.[
                        rarity
                    ] ||
                    {};

                return (
                    `${TITLE_RARITY_ICONS[rarity] || '⚪'} ` +
                    `**${rarity}:** ` +
                    `\`${formatNumber(details.unlockCount)} unlocks\` ` +
                    `• \`${formatNumber(details.soulCount)} Souls\``
                );
            }
        )
        .join('\n');
}/**
 * Build the central Kingdom Overview.
 *
 * @param {Object} context
 * @returns {import('discord.js').EmbedBuilder}
 */
function buildOverviewPage(
    context
) {
    const {
        interaction,
        kingdomStatistics
    } =
        context;

    const guild =
        interaction.guild;

    const humanMembers =
        guild.members.cache.filter(
            member =>
                !member.user.bot
        );

    const botMembers =
        guild.members.cache.filter(
            member =>
                member.user.bot
        );

    const textChannels =
        guild.channels.cache.filter(
            channel =>
                channel.isTextBased() &&
                !channel.isThread()
        );

    const voiceChannels =
        guild.channels.cache.filter(
            channel =>
                channel.isVoiceBased()
        );

    const categoryChannels =
        guild.channels.cache.filter(
            channel =>
                channel.type ===
                4
        );

    const owner =
        guild.members.cache.get(
            guild.ownerId
        );

    const espadaStatus =
        getEspadaStatus(
            guild
        );

    const progression =
        kingdomStatistics
            ?.progression ||
        {};

    const achievements =
        kingdomStatistics
            ?.achievements ||
        {};

    const titles =
        kingdomStatistics
            ?.titles ||
        {};

    const ranks =
        kingdomStatistics
            ?.ranks ||
        {};

    const archiveSummary =
        kingdomStatistics
            ?.archiveSummary ||
        {};

    const thronePercentage =
        calculatePercentage(
            espadaStatus.occupied,
            ESPADA_ROLES.length
        );

    const registeredSoulPercentage =
        calculatePercentage(
            progression.registeredSouls,
            humanMembers.size
        );

    const embed =
        createKingdomEmbed({
            interaction,

            title:
                '🏰 Las Noches Kingdom Dashboard',

            description:
                [
                    'Umbra has opened the central status of Las Noches.',
                    '',
                    'This dashboard summarizes the kingdom population, progression, hierarchy and Chronicle archives.'
                ].join('\n'),

            color:
                embedConfig.colors.accent
        });

    embed.addFields(
        {
            name:
                '🌙 Kingdom Identity',

            value:
                [
                    `**Kingdom:** ${guild.name}`,
                    `**Kingdom ID:** \`${guild.id}\``,
                    `**Ruler:** ${owner || 'Unknown Soul'}`,
                    `**Established:** ${formatDiscordDate(guild.createdAt, 'F')}`,
                    `**Kingdom Age:** ${formatDiscordDate(guild.createdAt, 'R')}`
                ].join('\n'),

            inline:
                false
        },
        {
            name:
                '👥 Population Status',

            value:
                [
                    `**Total Members:** \`${formatNumber(guild.memberCount)}\``,
                    `**Human Souls:** \`${formatNumber(humanMembers.size)}\``,
                    `**Guardians and Bots:** \`${formatNumber(botMembers.size)}\``,
                    `**Database Soul Records:** \`${formatNumber(progression.registeredSouls)}\``,
                    '',
                    `\`${createProgressBar(registeredSoulPercentage, 12)}\` **${registeredSoulPercentage}% recorded**`
                ].join('\n'),

            inline:
                true
        },
        {
            name:
                '🏛️ Kingdom Structure',

            value:
                [
                    `**Categories:** \`${formatNumber(categoryChannels.size)}\``,
                    `**Text Channels:** \`${formatNumber(textChannels.size)}\``,
                    `**Voice Channels:** \`${formatNumber(voiceChannels.size)}\``,
                    `**Roles:** \`${formatNumber(Math.max(0, guild.roles.cache.size - 1))}\``,
                    `**High Command Souls:** \`${formatNumber(countHighCommandMembers(guild))}\``
                ].join('\n'),

            inline:
                true
        },
        {
            name:
                '⚔️ Espada Throne Status',

            value:
                [
                    `\`${createProgressBar(thronePercentage, 16)}\` **${thronePercentage}% occupied**`,
                    '',
                    `👑 **Occupied Thrones:** \`${formatNumber(espadaStatus.occupied)} / ${formatNumber(ESPADA_ROLES.length)}\``,
                    `🌑 **Vacant Thrones:** \`${formatNumber(espadaStatus.vacant)}\``,
                    `⚠️ **Missing Roles:** \`${formatNumber(espadaStatus.missing)}\``,
                    `⚔️ **Unique Throne Holders:** \`${formatNumber(espadaStatus.uniqueHolders)}\``
                ].join('\n'),

            inline:
                false
        }
    );

    if (
        kingdomStatistics
    ) {
        embed.addFields(
            {
                name:
                    '⭐ Kingdom Progression',

                value:
                    [
                        `**Highest Level:** \`${formatNumber(progression.highestLevel)}\``,
                        `**Average Level:** \`${formatDecimal(progression.averageLevel)}\``,
                        `**Total Spiritual Power:** \`${formatNumber(progression.totalXp)} XP\``,
                        `**Total Messages:** \`${formatNumber(progression.totalMessages)}\``,
                        `**Active Progression Souls:** \`${formatNumber(progression.activeSouls)}\``
                    ].join('\n'),

                inline:
                    true
            },
            {
                name:
                    '🏆 Chronicle Archives',

                value:
                    [
                        `**Achievement Unlocks:** \`${formatNumber(achievements.totalUnlocks)}\``,
                        `**Title Unlocks:** \`${formatNumber(titles.totalUnlocks)}\``,
                        `**Active Titles:** \`${formatNumber(titles.activeTitles)}\``,
                        `**Legendary and Mythic Unlocks:** \`${formatNumber(titles.rareUnlocks)}\``,
                        `**Active Ranked Souls:** \`${formatNumber(ranks.activeRankedSouls)}\``
                    ].join('\n'),

                inline:
                    true
            },
            {
                name:
                    '📚 Kingdom Archive Summary',

                value:
                    [
                        `**Total Archive Records:** \`${formatNumber(archiveSummary.totalArchiveRecords)}\``,
                        `**Participating Souls:** \`${formatNumber(archiveSummary.participatingSouls)}\``,
                        `**Average Achievements per Soul:** \`${formatDecimal(archiveSummary.averageAchievementUnlocks, 2)}\``,
                        `**Average Titles per Soul:** \`${formatDecimal(archiveSummary.averageTitleUnlocks, 2)}\``,
                        `**Statistics Generated:** ${formatDiscordDate(kingdomStatistics.generatedAt, 'R')}`
                    ].join('\n'),

                inline:
                    false
            }
        );
    } else {
        embed.addFields({
            name:
                '⚠️ Kingdom Database Unavailable',

            value:
                [
                    'Discord-based population and hierarchy data is still available.',
                    '',
                    'PostgreSQL progression, Achievement, Title and activity statistics could not be loaded.'
                ].join('\n'),

            inline:
                false
        });
    }

    embed.addFields({
        name:
            '🧭 Connected Kingdom Systems',

        value:
            [
                '`/leaderboard` — competitive Soul rankings',
                '`/espada` — interactive throne system',
                '`/soul` — complete Soul archive',
                '`/titles` — Chronicle Title collection',
                '`/rankhistory` — Arrancar career history'
            ].join('\n'),

        inline:
            false
    });

    return embed;
}

/**
 * Build the High Command page.
 *
 * @param {Object} context
 * @returns {import('discord.js').EmbedBuilder}
 */
function buildHighCommandPage(
    context
) {
    const {
        interaction
    } =
        context;

    const guild =
        interaction.guild;

    const owner =
        guild.members.cache.get(
            guild.ownerId
        );

    const embed =
        createKingdomEmbed({
            interaction,

            title:
                '👑 High Command of Las Noches',

            description:
                'Umbra has opened the official leadership and administrative records of the kingdom.',

            color:
                embedConfig.colors.rank
        });

    embed.addFields({
        name:
            '👑 Ruler of Las Noches',

        value:
            owner
                ? [
                    `${owner}`,
                    `**Username:** ${owner.user.tag}`,
                    `**Soul ID:** \`${owner.id}\``,
                    `**Entered Las Noches:** ${formatDiscordDate(owner.joinedAt, 'D')}`
                ].join('\n')
                : [
                    '🌑 The Ruler could not be located.',
                    '',
                    '-# Refresh the server member cache and try again.'
                ].join('\n'),

        inline:
            false
    });

    const leadershipIds =
        new Set();

    if (
        owner
    ) {
        leadershipIds.add(
            owner.id
        );
    }

    let missingStaffRoles =
        0;

    for (
        const roleName
        of STAFF_ROLES
    ) {
        const role =
            findGuildRole(
                guild,
                roleName
            );

        if (!role) {
            missingStaffRoles +=
                1;

            embed.addFields({
                name:
                    roleName,

                value:
                    [
                        '⚠️ **Role Missing**',
                        '-# Umbra could not locate this administrative division.'
                    ].join('\n'),

                inline:
                    false
            });

            continue;
        }

        const members =
            getHumanRoleMembers(
                role
            );

        for (
            const member
            of members
        ) {
            leadershipIds.add(
                member.id
            );
        }

        embed.addFields({
            name:
                roleName,

            value:
                [
                    formatMemberList(
                        members,
                        '🌑 No Souls currently hold this position.',
                        10
                    ),
                    '',
                    `-# Members assigned: ${formatNumber(members.length)}`
                ].join('\n'),

            inline:
                false
        });
    }

    const staffedDivisions =
        STAFF_ROLES.length -
        missingStaffRoles;

    const staffConfigurationPercentage =
        calculatePercentage(
            staffedDivisions,
            STAFF_ROLES.length
        );

    embed.addFields(
        {
            name:
                '📊 High Command Status',

            value:
                [
                    `**Recognized Leaders:** \`${formatNumber(leadershipIds.size)}\``,
                    `**Configured Staff Divisions:** \`${formatNumber(staffedDivisions)} / ${formatNumber(STAFF_ROLES.length)}\``,
                    `**Missing Staff Roles:** \`${formatNumber(missingStaffRoles)}\``,
                    '',
                    `\`${createProgressBar(staffConfigurationPercentage, 14)}\` **${staffConfigurationPercentage}% configured**`
                ].join('\n'),

            inline:
                false
        },
        {
            name:
                '🛡️ Authority Structure',

            value:
                [
                    '**Ruler** — complete authority over Las Noches',
                    '**Head Captain** — senior administration',
                    '**Captain** — administration and hierarchy management',
                    '**Lieutenant** — moderation and member support',
                    '',
                    '-# Actual permissions remain controlled by Discord roles and channel overrides.'
                ].join('\n'),

            inline:
                false
        }
    );

    return embed;
}

/**
 * Count unique Souls across a collection
 * of named Discord roles.
 *
 * @param {import('discord.js').Guild} guild
 * @param {string[]} roleNames
 * @returns {{
 *     uniqueMemberIds: Set<string>,
 *     missingRoles: number,
 *     lines: string[]
 * }}
 */
function getRolePopulationSummary(
    guild,
    roleNames
) {
    const uniqueMemberIds =
        new Set();

    const lines =
        [];

    let missingRoles =
        0;

    for (
        const roleName
        of roleNames
    ) {
        const role =
            findGuildRole(
                guild,
                roleName
            );

        if (!role) {
            missingRoles +=
                1;

            lines.push(
                `**${roleName}:** \`Role Missing\``
            );

            continue;
        }

        const members =
            getHumanRoleMembers(
                role
            );

        for (
            const member
            of members
        ) {
            uniqueMemberIds.add(
                member.id
            );
        }

        lines.push(
            `**${roleName}:** \`${formatNumber(members.length)}\``
        );
    }

    return {
        uniqueMemberIds,
        missingRoles,
        lines
    };
}

/**
 * Build the Population and Structure page.
 *
 * @param {Object} context
 * @returns {import('discord.js').EmbedBuilder}
 */
function buildPopulationPage(
    context
) {
    const {
        interaction,
        kingdomStatistics
    } =
        context;

    const guild =
        interaction.guild;

    const humanMembers =
        guild.members.cache.filter(
            member =>
                !member.user.bot
        );

    const botMembers =
        guild.members.cache.filter(
            member =>
                member.user.bot
        );

    const evolutionSummary =
        getRolePopulationSummary(
            guild,
            HOLLOW_EVOLUTION_ROLES
        );

    const hierarchySummary =
        getRolePopulationSummary(
            guild,
            ARRANCAR_HIERARCHY_ROLES
        );

    const espadaSummary =
        getRolePopulationSummary(
            guild,
            ESPADA_ROLES
        );

    const progression =
        kingdomStatistics
            ?.progression ||
        {};

    const databaseCoverage =
        calculatePercentage(
            progression.registeredSouls,
            humanMembers.size
        );

    const embed =
        createKingdomEmbed({
            interaction,

            title:
                '👥 Population and Structure of Las Noches',

            description:
                'Umbra has opened the complete population census of human members, Hollow evolution stages and Arrancar hierarchy divisions.',

            color:
                embedConfig.colors.support
        });

    embed.addFields(
        {
            name:
                '👥 General Population',

            value:
                [
                    `**Total Server Members:** \`${formatNumber(guild.memberCount)}\``,
                    `**Human Souls:** \`${formatNumber(humanMembers.size)}\``,
                    `**Bots and Guardians:** \`${formatNumber(botMembers.size)}\``,
                    `**Database Soul Records:** \`${formatNumber(progression.registeredSouls)}\``,
                    `**Active Progression Records:** \`${formatNumber(progression.activeSouls)}\``,
                    '',
                    `\`${createProgressBar(databaseCoverage, 14)}\` **${databaseCoverage}% database coverage**`
                ].join('\n'),

            inline:
                false
        },
        {
            name:
                '👁️ Hollow Evolution Census',

            value:
                evolutionSummary
                    .lines
                    .join('\n'),

            inline:
                true
        },
        {
            name:
                '🌙 Arrancar Hierarchy Census',

            value:
                hierarchySummary
                    .lines
                    .join('\n'),

            inline:
                true
        },
        {
            name:
                '📊 Spiritual Population Summary',

            value:
                [
                    `**Evolution Souls:** \`${formatNumber(evolutionSummary.uniqueMemberIds.size)}\``,
                    `**Manual Hierarchy Souls:** \`${formatNumber(hierarchySummary.uniqueMemberIds.size)}\``,
                    `**Espada Souls:** \`${formatNumber(espadaSummary.uniqueMemberIds.size)}\``,
                    `**Recognized High Command:** \`${formatNumber(countHighCommandMembers(guild))}\``,
                    '',
                    `**Missing Evolution Roles:** \`${formatNumber(evolutionSummary.missingRoles)}\``,
                    `**Missing Hierarchy Roles:** \`${formatNumber(hierarchySummary.missingRoles)}\``,
                    `**Missing Espada Roles:** \`${formatNumber(espadaSummary.missingRoles)}\``
                ].join('\n'),

            inline:
                false
        },
        {
            name:
                '📖 Census Notes',

            value:
                [
                    'A Soul may appear in multiple groups.',
                    '',
                    'Hollow Evolution roles represent progression stages, while Arrancar hierarchy roles represent manually assigned standing.',
                    '',
                    '-# Population totals across role groups should not be added together as unique server members.'
                ].join('\n'),

            inline:
                false
        }
    );

    return embed;
}/**
 * Format one compact leaderboard entry.
 *
 * @param {import('discord.js').Guild} guild
 * @param {Object} record
 * @param {'level'|'xp'|'messages'} type
 * @returns {string}
 */
function formatProgressionLeader(
    guild,
    record,
    type
) {
    if (!record) {
        return '🌑 No ranked Soul is currently available.';
    }

    const position =
        Number(
            record.rank || 0
        );

    const medal =
        position === 1
            ? '🥇'
            : position === 2
                ? '🥈'
                : position === 3
                    ? '🥉'
                    : `#${formatNumber(position)}`;

    let statisticLine =
        '';

    switch (
        type
    ) {
        case 'xp':
            statisticLine =
                `✨ ${formatNumber(record.xp)} XP`;
            break;

        case 'messages':
            statisticLine =
                `💬 ${formatNumber(record.messageCount)} messages`;
            break;

        case 'level':
        default:
            statisticLine =
                `⭐ Level ${formatNumber(record.level)}`;
            break;
    }

    return [
        `${medal} ${formatSoulMention(guild, record.userId)}`,
        `**${statisticLine}**`,
        `-# Level ${formatNumber(record.level)} • ${formatNumber(record.xp)} XP • ${formatNumber(record.messageCount)} messages`
    ].join('\n');
}

/**
 * Build the Kingdom Progression page.
 *
 * @param {Object} context
 * @returns {import('discord.js').EmbedBuilder}
 */
function buildProgressionPage(
    context
) {
    const {
        interaction,
        kingdomStatistics
    } =
        context;

    const embed =
        createKingdomEmbed({
            interaction,

            title:
                '⭐ Kingdom Progression Statistics',

            description:
                'Umbra has opened the collective Level, spiritual power and activity records of Las Noches.',

            color:
                embedConfig.colors.archive
        });

    if (
        !kingdomStatistics
    ) {
        embed.addFields({
            name:
                '⚠️ Progression Core Unavailable',

            value:
                [
                    'Umbra could not load the PostgreSQL progression records.',
                    '',
                    'The Discord-based Kingdom pages remain available.',
                    '',
                    '-# Verify the database connection and inspect the Northflank logs.'
                ].join('\n'),

            inline:
                false
        });

        return embed;
    }

    const progression =
        kingdomStatistics.progression ||
        {};

    const leaderboards =
        kingdomStatistics.leaderboards ||
        {};

    const levelLeaderboard =
        Array.isArray(
            leaderboards.levels
        )
            ? leaderboards.levels
            : [];

    const xpLeaderboard =
        Array.isArray(
            leaderboards.xp
        )
            ? leaderboards.xp
            : [];

    const messageLeaderboard =
        Array.isArray(
            leaderboards.messages
        )
            ? leaderboards.messages
            : [];

    const topLevelSoul =
        levelLeaderboard[0] ||
        null;

    const topXpSoul =
        xpLeaderboard[0] ||
        null;

    const topMessageSoul =
        messageLeaderboard[0] ||
        null;

    const activePercentage =
        calculatePercentage(
            progression.activeSouls,
            progression.registeredSouls
        );

    embed.addFields(
        {
            name:
                '📊 Progression Overview',

            value:
                [
                    `**Registered Soul Records:** \`${formatNumber(progression.registeredSouls)}\``,
                    `**Active Progression Souls:** \`${formatNumber(progression.activeSouls)}\``,
                    `**Highest Soul Level:** \`${formatNumber(progression.highestLevel)}\``,
                    `**Average Soul Level:** \`${formatDecimal(progression.averageLevel)}\``,
                    `**Average Spiritual Power:** \`${formatNumber(Math.round(Number(progression.averageXp || 0)))} XP\``,
                    `**Average Messages:** \`${formatNumber(Math.round(Number(progression.averageMessages || 0)))}\``,
                    '',
                    `\`${createProgressBar(activePercentage, 16)}\` **${activePercentage}% active records**`
                ].join('\n'),

            inline:
                false
        },
        {
            name:
                '✨ Collective Spiritual Power',

            value:
                [
                    `**Total Kingdom XP:** \`${formatNumber(progression.totalXp)}\``,
                    `**Highest Individual XP:** \`${formatNumber(progression.highestXp)}\``,
                    `**Total Messages Recorded:** \`${formatNumber(progression.totalMessages)}\``,
                    `**Highest Message Count:** \`${formatNumber(progression.highestMessageCount)}\``
                ].join('\n'),

            inline:
                false
        },
        {
            name:
                '⭐ Soul Level Champion',

            value:
                formatProgressionLeader(
                    interaction.guild,
                    topLevelSoul,
                    'level'
                ),

            inline:
                true
        },
        {
            name:
                '✨ Spiritual Power Champion',

            value:
                formatProgressionLeader(
                    interaction.guild,
                    topXpSoul,
                    'xp'
                ),

            inline:
                true
        },
        {
            name:
                '💬 Activity Champion',

            value:
                formatProgressionLeader(
                    interaction.guild,
                    topMessageSoul,
                    'messages'
                ),

            inline:
                false
        },
        {
            name:
                '📅 Progression Timeline',

            value:
                [
                    `**First Soul Record:** ${formatDiscordDate(progression.firstSoulRecordAt, 'D')}`,
                    `**Latest Progression Update:** ${formatDiscordDate(progression.latestProgressionUpdateAt, 'R')}`,
                    '',
                    '-# Detailed competitive rankings are available through `/leaderboard`.'
                ].join('\n'),

            inline:
                false
        }
    );

    return embed;
}

/**
 * Format one Espada throne record.
 *
 * @param {import('discord.js').Guild} guild
 * @param {string} roleName
 * @returns {string}
 */
function formatEspadaThrone(
    guild,
    roleName
) {
    const role =
        findGuildRole(
            guild,
            roleName
        );

    if (!role) {
        return [
            `### ${roleName}`,
            '⚠️ **Role Missing**',
            '-# Create the role using the exact configured name.'
        ].join('\n');
    }

    const members =
        getHumanRoleMembers(
            role
        );

    if (
        members.length ===
        0
    ) {
        return [
            `### ${roleName}`,
            '🌑 **Vacant Throne**',
            '-# This position currently awaits a worthy Arrancar.'
        ].join('\n');
    }

    if (
        members.length >
        1
    ) {
        return [
            `### ${roleName}`,
            `⚠️ **Hierarchy Conflict: ${formatNumber(members.length)} holders**`,
            '',
            formatMemberList(
                members,
                '🌑 Vacant',
                5
            ),
            '',
            '-# Only one Soul should hold each official Espada throne.'
        ].join('\n');
    }

    const holder =
        members[0];

    return [
        `### ${roleName}`,
        `${holder}`,
        `**Username:** ${holder.user.tag}`,
        `**Soul ID:** \`${holder.id}\``,
        `**Entered Las Noches:** ${formatDiscordDate(holder.joinedAt, 'D')}`
    ].join('\n');
}

/**
 * Build the Espada Status page.
 *
 * @param {Object} context
 * @returns {import('discord.js').EmbedBuilder}
 */
function buildEspadaPage(
    context
) {
    const {
        interaction,
        kingdomStatistics
    } =
        context;

    const guild =
        interaction.guild;

    const espadaStatus =
        getEspadaStatus(
            guild
        );

    const ranks =
        kingdomStatistics
            ?.ranks ||
        {};

    const rankHistory =
        kingdomStatistics
            ?.rankHistory ||
        {};

    const occupancyPercentage =
        calculatePercentage(
            espadaStatus.occupied,
            ESPADA_ROLES.length
        );

    const embed =
        createKingdomEmbed({
            interaction,

            title:
                '⚔️ Espada Throne Status',

            description:
                'Umbra has opened the official throne structure and Arrancar hierarchy summary of Las Noches.',

            color:
                embedConfig.colors.rank
        });

    embed.addFields(
        {
            name:
                '👑 Throne Occupancy',

            value:
                [
                    `\`${createProgressBar(occupancyPercentage, 18)}\` **${occupancyPercentage}% occupied**`,
                    '',
                    `**Configured Thrones:** \`${formatNumber(ESPADA_ROLES.length)}\``,
                    `**Occupied Thrones:** \`${formatNumber(espadaStatus.occupied)}\``,
                    `**Vacant Thrones:** \`${formatNumber(espadaStatus.vacant)}\``,
                    `**Missing Roles:** \`${formatNumber(espadaStatus.missing)}\``,
                    `**Unique Holders:** \`${formatNumber(espadaStatus.uniqueHolders)}\``,
                    `**Hierarchy Conflicts:** \`${formatNumber(espadaStatus.conflicts)}\``
                ].join('\n'),

            inline:
                false
        }
    );

    const throneRecords =
        ESPADA_ROLES.map(
            roleName =>
                formatEspadaThrone(
                    guild,
                    roleName
                )
        );

    const throneChunks =
        splitKingdomRecords(
            throneRecords
        );

    throneChunks.forEach(
        (
            chunk,
            index
        ) => {
            embed.addFields({
                name:
                    index ===
                    0
                        ? '⚔️ Official Throne Records'
                        : '⚔️ Official Throne Records — Continued',

                value:
                    chunk,

                inline:
                    false
            });
        }
    );

    if (
        kingdomStatistics
    ) {
        embed.addFields(
            {
                name:
                    '🌙 Database Hierarchy Summary',

                value:
                    [
                        `**Active Ranked Souls:** \`${formatNumber(ranks.activeRankedSouls)}\``,
                        `**Database Espada Records:** \`${formatNumber(ranks.activeEspada)}\``,
                        `**Privaron Espada:** \`${formatNumber(ranks.privaronEspada)}\``,
                        `**Fracción:** \`${formatNumber(ranks.fraccion)}\``,
                        `**Numeros:** \`${formatNumber(ranks.numeros)}\``,
                        `**Unranked Arrancar:** \`${formatNumber(ranks.unrankedArrancar)}\``
                    ].join('\n'),

                inline:
                    true
            },
            {
                name:
                    '📜 Hierarchy Archive',

                value:
                    [
                        `**Total Rank Records:** \`${formatNumber(rankHistory.totalRankRecords)}\``,
                        `**Assignments:** \`${formatNumber(rankHistory.rankAssignments)}\``,
                        `**Initial Assignments:** \`${formatNumber(rankHistory.initialAssignments)}\``,
                        `**Rank Changes:** \`${formatNumber(rankHistory.rankChanges)}\``,
                        `**Revocations:** \`${formatNumber(rankHistory.rankRemovals)}\``
                    ].join('\n'),

                inline:
                    true
            },
            {
                name:
                    '📅 Hierarchy Timeline',

                value:
                    [
                        `**Oldest Active Assignment:** ${formatDiscordDate(ranks.oldestActiveAssignmentAt, 'D')}`,
                        `**Latest Active Assignment:** ${formatDiscordDate(ranks.latestActiveAssignmentAt, 'R')}`,
                        `**First Archived Action:** ${formatDiscordDate(rankHistory.firstRankActionAt, 'D')}`,
                        `**Latest Archived Action:** ${formatDiscordDate(rankHistory.latestRankActionAt, 'R')}`,
                        '',
                        '-# Use `/espada` for the full interactive throne system and `/rankhistory` for one Soul’s complete career.'
                    ].join('\n'),

                inline:
                    false
            }
        );
    }

    return embed;
}

/**
 * Format one recent Achievement.
 *
 * @param {import('discord.js').Guild} guild
 * @param {Object} achievement
 * @returns {string}
 */
function formatRecentAchievement(
    guild,
    achievement
) {
    return [
        `${achievement.icon || '🏆'} **${achievement.name || 'Unknown Achievement'}**`,
        `**Soul:** ${formatSoulMention(guild, achievement.userId)}`,
        `**Category:** ${achievement.category || 'Unknown'}`,
        `**Unlocked:** ${formatDiscordDate(achievement.unlockedAt, 'R')}`,
        `-# ${achievement.description || 'No description was recorded.'}`
    ].join('\n');
}

/**
 * Format one recent Chronicle Title.
 *
 * @param {import('discord.js').Guild} guild
 * @param {Object} title
 * @returns {string}
 */
function formatRecentTitle(
    guild,
    title
) {
    return [
        `🏷️ **${title.displayName || title.name || 'Unknown Title'}**`,
        `**Soul:** ${formatSoulMention(guild, title.userId)}`,
        `**Rarity:** ${title.rarity || 'Unknown'}`,
        `**Category:** ${title.category || 'Unknown'}`,
        `**Unlocked:** ${formatDiscordDate(title.unlockedAt, 'R')}`,
        title.isActive
            ? '👑 **Currently Active**'
            : null,
        `-# ${title.description || 'No description was recorded.'}`
    ]
        .filter(
            Boolean
        )
        .join('\n');
}

/**
 * Build the Chronicles page.
 *
 * @param {Object} context
 * @returns {import('discord.js').EmbedBuilder}
 */
function buildChroniclesPage(
    context
) {
    const {
        interaction,
        kingdomStatistics
    } =
        context;

    const embed =
        createKingdomEmbed({
            interaction,

            title:
                '🏆 Kingdom Chronicle Archives',

            description:
                'Umbra has opened the collective Achievement and Chronicle Title records of Las Noches.',

            color:
                embedConfig.colors.title
        });

    if (
        !kingdomStatistics
    ) {
        embed.addFields({
            name:
                '⚠️ Chronicle Core Unavailable',

            value:
                [
                    'Achievement and Chronicle Title statistics could not be loaded.',
                    '',
                    '-# Verify the PostgreSQL connection and Kingdom database module.'
                ].join('\n'),

            inline:
                false
        });

        return embed;
    }

    const achievements =
        kingdomStatistics.achievements ||
        {};

    const titles =
        kingdomStatistics.titles ||
        {};

    const titleRarities =
        kingdomStatistics.titleRarities ||
        {};

    const recentAchievements =
        Array.isArray(
            kingdomStatistics.recentAchievements
        )
            ? kingdomStatistics.recentAchievements
            : [];

    const recentTitles =
        Array.isArray(
            kingdomStatistics.recentTitles
        )
            ? kingdomStatistics.recentTitles
            : [];

    const achievementParticipation =
        calculatePercentage(
            achievements.soulsWithAchievements,
            kingdomStatistics.progression?.registeredSouls
        );

    const titleParticipation =
        calculatePercentage(
            titles.soulsWithTitles,
            kingdomStatistics.progression?.registeredSouls
        );

    embed.addFields(
        {
            name:
                '🏆 Achievement Archive',

            value:
                [
                    `**Available Achievements:** \`${formatNumber(achievements.availableAchievements)}\``,
                    `**Total Unlocks:** \`${formatNumber(achievements.totalUnlocks)}\``,
                    `**Souls with Achievements:** \`${formatNumber(achievements.soulsWithAchievements)}\``,
                    '',
                    `\`${createProgressBar(achievementParticipation, 12)}\` **${achievementParticipation}% participation**`,
                    '',
                    `**First Unlock:** ${formatDiscordDate(achievements.firstUnlockAt, 'D')}`,
                    `**Latest Unlock:** ${formatDiscordDate(achievements.latestUnlockAt, 'R')}`
                ].join('\n'),

            inline:
                true
        },
        {
            name:
                '🏷️ Chronicle Title Archive',

            value:
                [
                    `**Available Titles:** \`${formatNumber(titles.availableTitles)}\``,
                    `**Total Unlocks:** \`${formatNumber(titles.totalUnlocks)}\``,
                    `**Souls with Titles:** \`${formatNumber(titles.soulsWithTitles)}\``,
                    `**Active Titles:** \`${formatNumber(titles.activeTitles)}\``,
                    `**Legendary and Mythic:** \`${formatNumber(titles.rareUnlocks)}\``,
                    '',
                    `\`${createProgressBar(titleParticipation, 12)}\` **${titleParticipation}% participation**`
                ].join('\n'),

            inline:
                true
        },
        {
            name:
                '🌟 Chronicle Title Rarity Distribution',

            value:
                buildRaritySummary(
                    titleRarities
                ),

            inline:
                false
        }
    );

    if (
        recentAchievements.length >
        0
    ) {
        const achievementChunks =
            splitKingdomRecords(
                recentAchievements.map(
                    achievement =>
                        formatRecentAchievement(
                            interaction.guild,
                            achievement
                        )
                )
            );

        achievementChunks.forEach(
            (
                chunk,
                index
            ) => {
                embed.addFields({
                    name:
                        index ===
                        0
                            ? '📖 Recent Achievement Unlocks'
                            : '📖 Recent Achievement Unlocks — Continued',

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
                '📖 Recent Achievement Unlocks',

            value:
                '🌑 No recent Achievement unlocks are recorded.',

            inline:
                false
        });
    }

    if (
        recentTitles.length >
        0
    ) {
        const titleChunks =
            splitKingdomRecords(
                recentTitles.map(
                    title =>
                        formatRecentTitle(
                            interaction.guild,
                            title
                        )
                )
            );

        titleChunks.forEach(
            (
                chunk,
                index
            ) => {
                embed.addFields({
                    name:
                        index ===
                        0
                            ? '🏷️ Recent Chronicle Title Unlocks'
                            : '🏷️ Recent Chronicle Title Unlocks — Continued',

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
                '🏷️ Recent Chronicle Title Unlocks',

            value:
                '🌑 No recent Chronicle Title unlocks are recorded.',

            inline:
                false
        });
    }

    return embed;
}/**
 * Format one recent Arrancar Rank action.
 *
 * @param {import('discord.js').Guild} guild
 * @param {Object} record
 * @returns {string}
 */
function formatRecentRankAction(
    guild,
    record
) {
    const action =
        record.action ===
        'REMOVE'
            ? '🌑 Rank Revocation'
            : '⚔️ Rank Assignment';

    return [
        `### ${action}`,
        `**Soul:** ${formatSoulMention(guild, record.userId)}`,
        `**Previous Rank:** ${record.oldRank || 'None'}`,
        `**New Rank:** ${record.newRank || 'No active Rank'}`,
        record.moderatorId
            ? `**High Command:** ${formatSoulMention(guild, record.moderatorId)}`
            : '**High Command:** Not recorded',
        `**Reason:** ${record.reason || 'No reason was recorded.'}`,
        `**Recorded:** ${formatDiscordDate(record.createdAt, 'F')}`,
        `-# ${formatDiscordDate(record.createdAt, 'R')}`
    ].join('\n');
}

/**
 * Build the Kingdom Activity page.
 *
 * @param {Object} context
 * @returns {import('discord.js').EmbedBuilder}
 */
function buildActivityPage(
    context
) {
    const {
        interaction,
        kingdomStatistics
    } =
        context;

    const embed =
        createKingdomEmbed({
            interaction,

            title:
                '📈 Kingdom Activity Records',

            description:
                'Umbra has opened the recent progression, Chronicle and hierarchy activity of Las Noches.',

            color:
                embedConfig.colors.success
        });

    if (
        !kingdomStatistics
    ) {
        embed.addFields({
            name:
                '⚠️ Activity Core Unavailable',

            value:
                [
                    'Umbra could not load recent Kingdom activity.',
                    '',
                    '-# Verify PostgreSQL and inspect the Northflank logs.'
                ].join('\n'),

            inline:
                false
        });

        return embed;
    }

    const activity =
        kingdomStatistics.activity ||
        {};

    const last24Hours =
        activity.last24Hours ||
        {};

    const last7Days =
        activity.last7Days ||
        {};

    const recentRanks =
        Array.isArray(
            kingdomStatistics.recentRanks
        )
            ? kingdomStatistics.recentRanks
            : [];

    const activity24Total =
        Number(
            last24Hours.progressionUpdates || 0
        ) +
        Number(
            last24Hours.achievementUnlocks || 0
        ) +
        Number(
            last24Hours.titleUnlocks || 0
        ) +
        Number(
            last24Hours.rankActions || 0
        );

    const activity7Total =
        Number(
            last7Days.progressionUpdates || 0
        ) +
        Number(
            last7Days.achievementUnlocks || 0
        ) +
        Number(
            last7Days.titleUnlocks || 0
        ) +
        Number(
            last7Days.rankActions || 0
        );

    embed.addFields(
        {
            name:
                '🕒 Last 24 Hours',

            value:
                [
                    `⭐ **Progression Updates:** \`${formatNumber(last24Hours.progressionUpdates)}\``,
                    `🏆 **Achievement Unlocks:** \`${formatNumber(last24Hours.achievementUnlocks)}\``,
                    `🏷️ **Title Unlocks:** \`${formatNumber(last24Hours.titleUnlocks)}\``,
                    `⚔️ **Hierarchy Actions:** \`${formatNumber(last24Hours.rankActions)}\``,
                    '',
                    `**Total Recorded Activity:** \`${formatNumber(activity24Total)}\``
                ].join('\n'),

            inline:
                true
        },
        {
            name:
                '📅 Last 7 Days',

            value:
                [
                    `⭐ **Progression Updates:** \`${formatNumber(last7Days.progressionUpdates)}\``,
                    `🏆 **Achievement Unlocks:** \`${formatNumber(last7Days.achievementUnlocks)}\``,
                    `🏷️ **Title Unlocks:** \`${formatNumber(last7Days.titleUnlocks)}\``,
                    `⚔️ **Hierarchy Actions:** \`${formatNumber(last7Days.rankActions)}\``,
                    '',
                    `**Total Recorded Activity:** \`${formatNumber(activity7Total)}\``
                ].join('\n'),

            inline:
                true
        },
        {
            name:
                '🌙 Activity Summary',

            value:
                [
                    activity24Total >
                    0
                        ? '🟢 The Kingdom has recorded activity during the last 24 hours.'
                        : '🌑 No new Kingdom archive activity was recorded during the last 24 hours.',
                    '',
                    activity7Total >
                    0
                        ? `**Weekly Activity Records:** \`${formatNumber(activity7Total)}\``
                        : '**Weekly Activity Records:** `0`',
                    '',
                    `**Statistics Generated:** ${formatDiscordDate(kingdomStatistics.generatedAt, 'R')}`
                ].join('\n'),

            inline:
                false
        }
    );

    if (
        recentRanks.length >
        0
    ) {
        const rankChunks =
            splitKingdomRecords(
                recentRanks.map(
                    record =>
                        formatRecentRankAction(
                            interaction.guild,
                            record
                        )
                )
            );

        rankChunks.forEach(
            (
                chunk,
                index
            ) => {
                embed.addFields({
                    name:
                        index ===
                        0
                            ? '📜 Recent Hierarchy Actions'
                            : '📜 Recent Hierarchy Actions — Continued',

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
                '📜 Recent Hierarchy Actions',

            value:
                [
                    '🌑 No recent Arrancar Rank actions are recorded.',
                    '',
                    '-# Future assignments, changes and revocations will appear here.'
                ].join('\n'),

            inline:
                false
        });
    }

    embed.addFields({
        name:
            '🧭 Detailed Archives',

        value:
            [
                '`/leaderboard` — competitive progression standings',
                '`/rankhistory` — complete hierarchy history for one Soul',
                '`/titles` — Chronicle Title collection',
                '`/soul` — full personal progression archive'
            ].join('\n'),

        inline:
            false
    });

    return embed;
}

/**
 * Build the requested Kingdom page.
 *
 * @param {Object} context
 * @param {string} selectedPage
 * @returns {import('discord.js').EmbedBuilder}
 */
function buildKingdomPage(
    context,
    selectedPage
) {
    switch (
        selectedPage
    ) {
        case KINGDOM_PAGES.command:
            return buildHighCommandPage(
                context
            );

        case KINGDOM_PAGES.population:
            return buildPopulationPage(
                context
            );

        case KINGDOM_PAGES.progression:
            return buildProgressionPage(
                context
            );

        case KINGDOM_PAGES.espada:
            return buildEspadaPage(
                context
            );

        case KINGDOM_PAGES.chronicles:
            return buildChroniclesPage(
                context
            );

        case KINGDOM_PAGES.activity:
            return buildActivityPage(
                context
            );

        case KINGDOM_PAGES.overview:
        default:
            return buildOverviewPage(
                context
            );
    }
}

module.exports = {
    category:
        'information',

    data:
        new SlashCommandBuilder()
            .setName(
                'lasnoches'
            )
            .setDescription(
                'Open the interactive Kingdom Dashboard of Las Noches.'
            )
            .setDMPermission(
                false
            ),

    /**
     * Execute the /lasnoches command.
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
                            'The Kingdom Dashboard can only be opened inside Las Noches.'
                        )
                    ],

                    flags:
                        MessageFlags.Ephemeral
                });

                return;
            }

            await interaction.deferReply();

            await interaction.guild.members
                .fetch()
                .catch(
                    () => null
                );

            let kingdomStatistics =
                await kingdomDatabase
                    .getKingdomStatistics(
                        interaction.guild.id,
                        {
                            leaderboardLimit:
                                5,

                            recentAchievementLimit:
                                5,

                            recentTitleLimit:
                                5,

                            recentRankLimit:
                                5
                        }
                    )
                    .catch(error => {
                        console.error(
                            '⚠️ Umbra could not load Kingdom statistics:',
                            error
                        );

                        return null;
                    });

            let context = {
                interaction,
                kingdomStatistics
            };

            let selectedPage =
                KINGDOM_PAGES.overview;

            const initialEmbed =
                buildKingdomPage(
                    context,
                    selectedPage
                );

            const replyMessage =
                await interaction.editReply({
                    embeds: [
                        initialEmbed
                    ],

                    components: [
                        createKingdomMenu(
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
                                        '❌ Private Kingdom Dashboard',
                                        'Only the Soul who opened this Kingdom Dashboard may control its navigation.'
                                    )
                                ],

                                flags:
                                    MessageFlags.Ephemeral
                            });

                            return;
                        }

                        if (
                            menuInteraction.customId !==
                            KINGDOM_MENU_ID
                        ) {
                            return;
                        }

                        const requestedPage =
                            menuInteraction.values[0];

                        if (
                            !KINGDOM_PAGE_ORDER.includes(
                                requestedPage
                            )
                        ) {
                            await menuInteraction.reply({
                                embeds: [
                                    createErrorEmbed(
                                        '❌ Unknown Kingdom Record',
                                        'Umbra could not recognize the selected Kingdom Dashboard page.'
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
                         * Refresh Discord members and
                         * PostgreSQL Kingdom statistics
                         * before every page transition.
                         */
                        await interaction.guild.members
                            .fetch()
                            .catch(
                                () => null
                            );

                        kingdomStatistics =
                            await kingdomDatabase
                                .getKingdomStatistics(
                                    interaction.guild.id,
                                    {
                                        leaderboardLimit:
                                            5,

                                        recentAchievementLimit:
                                            5,

                                        recentTitleLimit:
                                            5,

                                        recentRankLimit:
                                            5
                                    }
                                )
                                .catch(error => {
                                    console.error(
                                        '⚠️ Umbra Kingdom live refresh failed:',
                                        error
                                    );

                                    return null;
                                });

                        context = {
                            interaction,
                            kingdomStatistics
                        };

                        const updatedEmbed =
                            buildKingdomPage(
                                context,
                                selectedPage
                            );

                        await menuInteraction.update({
                            embeds: [
                                updatedEmbed
                            ],

                            components: [
                                createKingdomMenu(
                                    selectedPage
                                )
                            ]
                        });
                    } catch (menuError) {
                        console.error(
                            '❌ Umbra /lasnoches navigation error:',
                            menuError
                        );

                        const navigationErrorEmbed =
                            createErrorEmbed(
                                '❌ Kingdom Navigation Failed',
                                [
                                    'Umbra could not open the selected Kingdom record.',
                                    '',
                                    'Please try opening `/lasnoches` again.'
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
                                createKingdomMenu(
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
                '❌ Umbra /lasnoches command error:',
                error
            );

            const errorEmbed =
                createErrorEmbed(
                    '❌ Kingdom Dashboard Unavailable',
                    [
                        'Umbra could not open the central Kingdom Dashboard of Las Noches.',
                        '',
                        'Please verify the PostgreSQL connection, configured hierarchy roles and Northflank logs.'
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