const {
    SlashCommandBuilder,
    MessageFlags,
    ActionRowBuilder,
    StringSelectMenuBuilder,
    StringSelectMenuOptionBuilder,
    ComponentType,
    ChannelType
} = require('discord.js');

const {
    createEmbed,
    createErrorEmbed
} = require('../../utils/embeds');

const embedConfig =
    require('../../config/embed');

const {
    kingdom: kingdomDatabase
} = require('../../database');

const rankConfig =
    require('../../config/ranks');

const DASHBOARD_MENU_ID =
    'umbra_tts_dashboard_menu';

const MENU_TIMEOUT =
    10 * 60 * 1000;

const DASHBOARD_PAGES = {
    overview:
        'tts_dashboard_overview',

    command:
        'tts_dashboard_command',

    population:
        'tts_dashboard_population',

    progression:
        'tts_dashboard_progression',

    ranks:
        'tts_dashboard_ranks',

    collection:
        'tts_dashboard_collection',

    activity:
        'tts_dashboard_activity'
};

const DASHBOARD_PAGE_ORDER =
    Object.values(
        DASHBOARD_PAGES
    );

const PAGE_DETAILS = {
    [DASHBOARD_PAGES.overview]: {
        emoji: '🏛️',
        label: 'Overview',
        description:
            'Central status of THE Ⅹ SINS'
    },

    [DASHBOARD_PAGES.command]: {
        emoji: '👑',
        label: 'High Command',
        description:
            'Leadership and staff structure'
    },

    [DASHBOARD_PAGES.population]: {
        emoji: '👥',
        label: 'Population',
        description:
            'Members and server records'
    },

    [DASHBOARD_PAGES.progression]: {
        emoji: '📈',
        label: 'Progression',
        description:
            'Levels, XP and message activity'
    },

    [DASHBOARD_PAGES.ranks]: {
        emoji: '⚔️',
        label: 'Sin Ranks',
        description:
            'Sin Rank occupancy and hierarchy'
    },

    [DASHBOARD_PAGES.collection]: {
        emoji: '🏆',
        label: 'Achievements & Titles',
        description:
            'Achievement and Title statistics'
    },

    [DASHBOARD_PAGES.activity]: {
        emoji: '📊',
        label: 'Recent Activity',
        description:
            'Recent progression and Rank activity'
    }
};

const SIN_RANKS =
    Object.values(
        rankConfig.hierarchy
    );

const HIGH_COMMAND_ROLES = [
    {
        id:
            rankConfig.highCommand
                ?.ruler,

        fallbackName:
            '👑・SOVEREIGN'
    },
    {
        id:
            rankConfig.highCommand
                ?.headCaptain,

        fallbackName:
            '⚜️・HEAD CAPTAIN'
    },
    {
        id:
            rankConfig.highCommand
                ?.captain,

        fallbackName:
            '🛡️・CAPTAIN'
    },
    {
        id:
            rankConfig.highCommand
                ?.lieutenant,

        fallbackName:
            '⚔️・LIEUTENANT'
    }
];

const TITLE_RARITY_ORDER = [
    'Common',
    'Uncommon',
    'Rare',
    'Epic',
    'Legendary',
    'Mythic'
];

const TITLE_RARITY_ICONS = {
    Common: '⚪',
    Uncommon: '🟢',
    Rare: '🔵',
    Epic: '🟣',
    Legendary: '🟡',
    Mythic: '🔴'
};

function formatNumber(value) {
    const number =
        Number(value);

    return Number.isFinite(number)
        ? number.toLocaleString('en-US')
        : '0';
}

function formatDecimal(
    value,
    digits = 1
) {
    const number =
        Number(value);

    return Number.isFinite(number)
        ? number.toFixed(digits)
        : Number(0).toFixed(digits);
}

function formatDiscordDate(
    value,
    style = 'F'
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

function calculatePercentage(
    completed,
    total
) {
    const maximum =
        Math.max(
            0,
            Number(total) || 0
        );

    if (maximum === 0) {
        return 0;
    }

    return Math.min(
        100,
        Math.max(
            0,
            Math.round(
                (
                    Number(completed) /
                    maximum
                ) *
                100
            )
        )
    );
}

function createProgressBar(
    percentage,
    length = 14
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

function createDashboardMenu(
    selectedPage,
    disabled = false
) {
    const menu =
        new StringSelectMenuBuilder()
            .setCustomId(
                DASHBOARD_MENU_ID
            )
            .setPlaceholder(
                'Select a Dashboard page'
            )
            .setDisabled(disabled)
            .addOptions(
                DASHBOARD_PAGE_ORDER.map(
                    pageId => {
                        const page =
                            PAGE_DETAILS[
                                pageId
                            ];

                        return new StringSelectMenuOptionBuilder()
                            .setLabel(
                                page.label
                            )
                            .setDescription(
                                page.description
                            )
                            .setEmoji(
                                page.emoji
                            )
                            .setValue(
                                pageId
                            )
                            .setDefault(
                                pageId ===
                                selectedPage
                            );
                    }
                )
            );

    return new ActionRowBuilder()
        .addComponents(menu);
}

function createDashboardEmbed({
    interaction,
    title,
    description,
    color
}) {
    const botAvatar =
        interaction.client.user
            .displayAvatarURL({
                size: 256,
                forceStatic: false
            });

    const guildIcon =
        interaction.guild.iconURL({
            size: 512,
            forceStatic: false
        }) ?? botAvatar;

    return createEmbed({
        title,
        description,

        color:
            color ??
            embedConfig.colors.primary,

        thumbnail:
            guildIcon,

        author: {
            name:
                `${interaction.guild.name} • Server Dashboard`,

            iconURL:
                guildIcon
        },

        footer: {
            text:
                `Evelynn • THE Ⅹ SINS • ${interaction.user.username}`,

            iconURL:
                botAvatar
        }
    });
}function getConfiguredRole(
    guild,
    roleId,
    fallbackName
) {
    if (roleId) {
        const role =
            guild.roles.cache.get(
                roleId
            );

        if (role) {
            return role;
        }
    }

    return guild.roles.cache.find(
        role =>
            role.name ===
            fallbackName
    ) ?? null;
}

function getHumanMembers(role) {
    if (!role) {
        return [];
    }

    return [...role.members.values()]
        .filter(
            member =>
                !member.user.bot
        )
        .sort(
            (
                first,
                second
            ) =>
                first.displayName
                    .localeCompare(
                        second.displayName
                    )
        );
}

function formatMemberList(
    members,
    limit = 10
) {
    if (!members.length) {
        return 'Vacant';
    }

    const visible =
        members.slice(0, limit);

    const lines =
        visible.map(
            member =>
                member.toString()
        );

    const remaining =
        members.length -
        visible.length;

    if (remaining > 0) {
        lines.push(
            `-# +${formatNumber(
                remaining
            )} more`
        );
    }

    return lines.join('\n');
}

function formatMemberMention(
    guild,
    userId
) {
    if (!userId) {
        return 'Unknown member';
    }

    return (
        guild.members.cache
            .get(userId)
            ?.toString() ??
        `<@${userId}>`
    );
}

function getSinRankStatus(guild) {
    let occupied = 0;
    let missing = 0;
    let conflicts = 0;

    const holders =
        new Set();

    for (const rank of SIN_RANKS) {
        const role =
            getConfiguredRole(
                guild,
                rank.id,
                rank.name
            );

        if (!role) {
            missing += 1;
            continue;
        }

        const members =
            getHumanMembers(role);

        if (members.length > 0) {
            occupied += 1;
        }

        if (
            rank !==
                rankConfig.hierarchy
                    .unranked &&
            members.length > 1
        ) {
            conflicts += 1;
        }

        for (const member of members) {
            holders.add(member.id);
        }
    }

    return {
        occupied,

        vacant:
            Math.max(
                0,
                SIN_RANKS.length -
                occupied -
                missing
            ),

        missing,
        conflicts,

        uniqueHolders:
            holders.size
    };
}

function countHighCommandMembers(guild) {
    const memberIds =
        new Set([
            guild.ownerId
        ]);

    for (
        const roleConfig
        of HIGH_COMMAND_ROLES
    ) {
        const role =
            getConfiguredRole(
                guild,
                roleConfig.id,
                roleConfig.fallbackName
            );

        for (
            const member
            of getHumanMembers(role)
        ) {
            memberIds.add(
                member.id
            );
        }
    }

    return memberIds.size;
}

function buildOverviewPage({
    interaction,
    statistics
}) {
    const guild =
        interaction.guild;

    const humans =
        guild.members.cache.filter(
            member =>
                !member.user.bot
        );

    const bots =
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

    const categories =
        guild.channels.cache.filter(
            channel =>
                channel.type ===
                ChannelType.GuildCategory
        );

    const progression =
        statistics?.progression ?? {};

    const achievements =
        statistics?.achievements ?? {};

    const titles =
        statistics?.titles ?? {};

    const rankStatistics =
        statistics?.ranks ?? {};

    const rankStatus =
        getSinRankStatus(guild);

    const databaseCoverage =
        calculatePercentage(
            progression.registeredSouls,
            humans.size
        );

    const rankCoverage =
        calculatePercentage(
            rankStatus.occupied,
            SIN_RANKS.length
        );

    const embed =
        createDashboardEmbed({
            interaction,

            title:
                '🏛️ THE Ⅹ SINS Dashboard',

            description:
                'Central server, progression and hierarchy overview.',

            color:
                embedConfig.colors.primary
        });

    embed.addFields(
        {
            name:
                'Ⅹ・Server Identity',

            value: [
                `**Server:** ${guild.name}`,
                `**Server ID:** \`${guild.id}\``,
                `**Owner:** <@${guild.ownerId}>`,
                `**Created:** ${
                    formatDiscordDate(
                        guild.createdAt
                    )
                }`,
                `**Age:** ${
                    formatDiscordDate(
                        guild.createdAt,
                        'R'
                    )
                }`
            ].join('\n')
        },

        {
            name:
                '👥 Members',

            value: [
                `**Total:** \`${formatNumber(guild.memberCount)}\``,
                `**Members:** \`${formatNumber(humans.size)}\``,
                `**Bots:** \`${formatNumber(bots.size)}\``,
                `**Database Records:** \`${
                    formatNumber(
                        progression.registeredSouls
                    )
                }\``,
                '',
                `\`${createProgressBar(
                    databaseCoverage,
                    12
                )}\` **${databaseCoverage}% recorded**`
            ].join('\n'),

            inline:
                true
        },

        {
            name:
                '🏗️ Structure',

            value: [
                `**Categories:** \`${formatNumber(categories.size)}\``,
                `**Text Channels:** \`${formatNumber(textChannels.size)}\``,
                `**Voice Channels:** \`${formatNumber(voiceChannels.size)}\``,
                `**Roles:** \`${
                    formatNumber(
                        Math.max(
                            0,
                            guild.roles.cache.size - 1
                        )
                    )
                }\``,
                `**High Command:** \`${
                    formatNumber(
                        countHighCommandMembers(
                            guild
                        )
                    )
                }\``
            ].join('\n'),

            inline:
                true
        },

        {
            name:
                '⚔️ Sin Rank Occupancy',

            value: [
                `\`${createProgressBar(
                    rankCoverage,
                    14
                )}\` **${rankCoverage}% occupied**`,
                '',
                `**Occupied:** \`${formatNumber(rankStatus.occupied)}\``,
                `**Vacant:** \`${formatNumber(rankStatus.vacant)}\``,
                `**Missing Roles:** \`${formatNumber(rankStatus.missing)}\``,
                `**Unique Holders:** \`${formatNumber(rankStatus.uniqueHolders)}\``,
                `**Ranked Records:** \`${
                    formatNumber(
                        rankStatistics.activeRankedSouls
                    )
                }\``
            ].join('\n')
        }
    );

    if (statistics) {
        embed.addFields(
            {
                name:
                    '📈 Progression',

                value: [
                    `**Highest Level:** \`${formatNumber(progression.highestLevel)}\``,
                    `**Average Level:** \`${formatDecimal(progression.averageLevel)}\``,
                    `**Total XP:** \`${formatNumber(progression.totalXp)}\``,
                    `**Messages:** \`${formatNumber(progression.totalMessages)}\``
                ].join('\n'),

                inline:
                    true
            },

            {
                name:
                    '🏆 Achievements & Titles',

                value: [
                    `**Achievement Unlocks:** \`${formatNumber(achievements.totalUnlocks)}\``,
                    `**Title Unlocks:** \`${formatNumber(titles.totalUnlocks)}\``,
                    `**Active Titles:** \`${formatNumber(titles.activeTitles)}\``,
                    `**Unique Title Holders:** \`${formatNumber(titles.uniqueHolders)}\``
                ].join('\n'),

                inline:
                    true
            },

            {
                name:
                    '🕒 Last Updated',

                value:
                    formatDiscordDate(
                        statistics.generatedAt,
                        'R'
                    )
            }
        );
    } else {
        embed.addFields({
            name:
                '⚠️ Database Unavailable',

            value:
                'Discord information is available, but PostgreSQL statistics could not be loaded.'
        });
    }

    embed.addFields({
        name:
            '🧭 Related Commands',

        value: [
            '`/leaderboard` — rankings',
            '`/rank` — progression rank',
            '`/titles` — Title collection',
            '`/rankhistory` — Sin Rank history'
        ].join('\n')
    });

    return embed;
}function buildHighCommandPage({
    interaction
}) {
    const guild =
        interaction.guild;

    const owner =
        guild.members.cache.get(
            guild.ownerId
        );

    const embed =
        createDashboardEmbed({
            interaction,

            title:
                '👑 THE Ⅹ SINS High Command',

            description:
                'Leadership and staff structure.',

            color:
                embedConfig.colors.rank
        });

    embed.addFields({
        name:
            '👑 Server Owner',

        value:
            owner
                ? [
                    `${owner}`,
                    `**Username:** ${owner.user.tag}`,
                    `**User ID:** \`${owner.id}\``,
                    `**Joined:** ${
                        formatDiscordDate(
                            owner.joinedAt,
                            'D'
                        )
                    }`
                ].join('\n')
                : 'Owner information could not be loaded.'
    });

    const leadershipIds =
        new Set([
            guild.ownerId
        ]);

    let configuredRoles = 0;
    let missingRoles = 0;

    for (
        const roleConfig
        of HIGH_COMMAND_ROLES
    ) {
        const role =
            getConfiguredRole(
                guild,
                roleConfig.id,
                roleConfig.fallbackName
            );

        if (!role) {
            missingRoles += 1;

            embed.addFields({
                name:
                    roleConfig.fallbackName,

                value:
                    '⚠️ Role Missing'
            });

            continue;
        }

        configuredRoles += 1;

        const members =
            getHumanMembers(role);

        for (const member of members) {
            leadershipIds.add(
                member.id
            );
        }

        embed.addFields({
            name:
                role.name,

            value: [
                formatMemberList(
                    members
                ),
                '',
                `-# Assigned: ${formatNumber(
                    members.length
                )}`
            ].join('\n')
        });
    }

    const percentage =
        calculatePercentage(
            configuredRoles,
            HIGH_COMMAND_ROLES.length
        );

    embed.addFields(
        {
            name:
                '📊 High Command Status',

            value: [
                `**Recognized Members:** \`${formatNumber(leadershipIds.size)}\``,
                `**Configured Roles:** \`${formatNumber(configuredRoles)} / ${formatNumber(HIGH_COMMAND_ROLES.length)}\``,
                `**Missing Roles:** \`${formatNumber(missingRoles)}\``,
                '',
                `\`${createProgressBar(
                    percentage
                )}\` **${percentage}% configured**`
            ].join('\n')
        },

        {
            name:
                '🛡️ Authority Structure',

            value: [
                '**Sovereign** — server leadership',
                '**Head Captain** — senior administration',
                '**Captain** — administration',
                '**Lieutenant** — moderation and support',
                '',
                '-# Actual authority is controlled by Discord permissions.'
            ].join('\n')
        }
    );

    return embed;
}

function buildPopulationPage({
    interaction,
    statistics
}) {
    const guild =
        interaction.guild;

    const humans =
        guild.members.cache.filter(
            member =>
                !member.user.bot
        );

    const bots =
        guild.members.cache.filter(
            member =>
                member.user.bot
        );

    const progression =
        statistics?.progression ?? {};

    const rankStatus =
        getSinRankStatus(guild);

    const coverage =
        calculatePercentage(
            progression.registeredSouls,
            humans.size
        );

    const rankLines =
        SIN_RANKS.map(rank => {
            const role =
                getConfiguredRole(
                    guild,
                    rank.id,
                    rank.name
                );

            if (!role) {
                return (
                    `**${rank.name}:** ` +
                    '`Role Missing`'
                );
            }

            return (
                `**${rank.name}:** ` +
                `\`${formatNumber(
                    getHumanMembers(role)
                        .length
                )}\``
            );
        });

    const embed =
        createDashboardEmbed({
            interaction,

            title:
                '👥 THE Ⅹ SINS Population',

            description:
                'Member records and Sin Rank distribution.',

            color:
                embedConfig.colors.support
        });

    return embed.addFields(
        {
            name:
                '👥 General Population',

            value: [
                `**Total Members:** \`${formatNumber(guild.memberCount)}\``,
                `**Members:** \`${formatNumber(humans.size)}\``,
                `**Bots:** \`${formatNumber(bots.size)}\``,
                `**Database Records:** \`${formatNumber(progression.registeredSouls)}\``,
                `**Active Records:** \`${formatNumber(progression.activeSouls)}\``,
                '',
                `\`${createProgressBar(
                    coverage
                )}\` **${coverage}% database coverage**`
            ].join('\n')
        },

        {
            name:
                '⚔️ Sin Rank Distribution',

            value:
                rankLines
                    .join('\n')
                    .slice(0, 1024)
        },

        {
            name:
                '📊 Population Summary',

            value: [
                `**Sin Rank Holders:** \`${formatNumber(rankStatus.uniqueHolders)}\``,
                `**High Command Members:** \`${formatNumber(countHighCommandMembers(guild))}\``,
                `**Occupied Ranks:** \`${formatNumber(rankStatus.occupied)}\``,
                `**Vacant Ranks:** \`${formatNumber(rankStatus.vacant)}\``,
                `**Missing Rank Roles:** \`${formatNumber(rankStatus.missing)}\``
            ].join('\n')
        },

        {
            name:
                '📖 Notes',

            value: [
                'Sin Ranks are manually assigned positions.',
                'High Command roles are counted separately.',
                '',
                '-# Members may appear in more than one administrative group.'
            ].join('\n')
        }
    );
}

function formatProgressionLeader(
    guild,
    record,
    type
) {
    if (!record) {
        return 'No ranked member is currently available.';
    }

    const position =
        Number(record.rank) || 0;

    const medal =
        position === 1
            ? '🥇'
            : position === 2
                ? '🥈'
                : position === 3
                    ? '🥉'
                    : `#${formatNumber(position)}`;

    const statistics = {
        level:
            `⭐ Level ${formatNumber(record.level)}`,

        xp:
            `✨ ${formatNumber(record.xp)} XP`,

        messages:
            `💬 ${formatNumber(record.messageCount)} messages`
    };

    return [
        `${medal} ${
            formatMemberMention(
                guild,
                record.userId
            )
        }`,
        `**${statistics[type] ?? statistics.level}**`,
        `-# Level ${formatNumber(record.level)} • ${formatNumber(record.xp)} XP • ${formatNumber(record.messageCount)} messages`
    ].join('\n');
}

function buildProgressionPage({
    interaction,
    statistics
}) {
    const embed =
        createDashboardEmbed({
            interaction,

            title:
                '📈 THE Ⅹ SINS Progression',

            description:
                'Levels, XP and message activity.',

            color:
                embedConfig.colors.archive
        });

    if (!statistics) {
        embed.addFields({
            name:
                '⚠️ Progression Unavailable',

            value:
                'Evelynn could not load PostgreSQL progression records.'
        });

        return embed;
    }

    const progression =
        statistics.progression ?? {};

    const leaderboards =
        statistics.leaderboards ?? {};

    const levels =
        Array.isArray(
            leaderboards.levels
        )
            ? leaderboards.levels
            : [];

    const xp =
        Array.isArray(
            leaderboards.xp
        )
            ? leaderboards.xp
            : [];

    const messages =
        Array.isArray(
            leaderboards.messages
        )
            ? leaderboards.messages
            : [];

    const activePercentage =
        calculatePercentage(
            progression.activeSouls,
            progression.registeredSouls
        );

    return embed.addFields(
        {
            name:
                '📊 Progression Overview',

            value: [
                `**Registered Records:** \`${formatNumber(progression.registeredSouls)}\``,
                `**Active Records:** \`${formatNumber(progression.activeSouls)}\``,
                `**Highest Level:** \`${formatNumber(progression.highestLevel)}\``,
                `**Average Level:** \`${formatDecimal(progression.averageLevel)}\``,
                `**Total XP:** \`${formatNumber(progression.totalXp)}\``,
                `**Total Messages:** \`${formatNumber(progression.totalMessages)}\``,
                '',
                `\`${createProgressBar(
                    activePercentage
                )}\` **${activePercentage}% active**`
            ].join('\n')
        },

        {
            name:
                '⭐ Level Leader',

            value:
                formatProgressionLeader(
                    interaction.guild,
                    levels[0],
                    'level'
                ),

            inline:
                true
        },

        {
            name:
                '✨ XP Leader',

            value:
                formatProgressionLeader(
                    interaction.guild,
                    xp[0],
                    'xp'
                ),

            inline:
                true
        },

        {
            name:
                '💬 Activity Leader',

            value:
                formatProgressionLeader(
                    interaction.guild,
                    messages[0],
                    'messages'
                )
        },

        {
            name:
                '📅 Timeline',

            value: [
                `**First Record:** ${
                    formatDiscordDate(
                        progression.firstSoulRecordAt,
                        'D'
                    )
                }`,
                `**Latest Update:** ${
                    formatDiscordDate(
                        progression.latestProgressionUpdateAt,
                        'R'
                    )
                }`,
                '',
                '-# Use `/leaderboard` for detailed rankings.'
            ].join('\n')
        }
    );
}function buildSinRankPage({
    interaction,
    statistics
}) {
    const guild =
        interaction.guild;

    const status =
        getSinRankStatus(guild);

    const embed =
        createDashboardEmbed({
            interaction,

            title:
                '⚔️ THE Ⅹ SINS — Sin Ranks',

            description:
                'Current manually assigned Sin Rank hierarchy.',

            color:
                embedConfig.colors.rank
        });

    embed.addFields({
        name:
            '📊 Sin Rank Overview',

        value: [
            `**Configured Ranks:** \`${formatNumber(SIN_RANKS.length)}\``,
            `**Occupied:** \`${formatNumber(status.occupied)}\``,
            `**Vacant:** \`${formatNumber(status.vacant)}\``,
            `**Missing Roles:** \`${formatNumber(status.missing)}\``,
            `**Unique Holders:** \`${formatNumber(status.uniqueHolders)}\``,
            `**Conflicts:** \`${formatNumber(status.conflicts)}\``
        ].join('\n')
    });

    for (const rank of SIN_RANKS) {
        const role =
            getConfiguredRole(
                guild,
                rank.id,
                rank.name
            );

        const members =
            getHumanMembers(role);

        embed.addFields({
            name:
                rank.name,

            value:
                role
                    ? [
                        `**Holders:** \`${formatNumber(members.length)}\``,
                        formatMemberList(
                            members,
                            8
                        )
                    ].join('\n')
                    : '⚠️ Configured role could not be found.'
        });
    }

    const recentRanks =
        statistics?.recentRanks ?? [];

    if (recentRanks.length > 0) {
        const lines =
            recentRanks
                .slice(0, 5)
                .map(record => [
                    formatMemberMention(
                        guild,
                        record.userId
                    ),
                    `**${
                        record.rankName ??
                        record.rank ??
                        'Sin Rank'
                    }**`,
                    record.assignedAt
                        ? formatDiscordDate(
                            record.assignedAt,
                            'R'
                        )
                        : null
                ]
                    .filter(Boolean)
                    .join(' • ')
                );

        embed.addFields({
            name:
                '📜 Recent Sin Rank Activity',

            value:
                lines
                    .join('\n')
                    .slice(0, 1024)
        });
    }

    embed.addFields({
        name:
            '📖 Sin Rank Rules',

        value: [
            'Sin Ranks are manually assigned through the Rank system.',
            'A member should hold only their intended Sin Rank.',
            '',
            '-# Rank definitions are loaded from `config/ranks.js`.'
        ].join('\n')
    });

    return embed;
}

function buildRaritySummary(
    rarityStatistics
) {
    return TITLE_RARITY_ORDER
        .map(rarity => {
            const details =
                rarityStatistics?.[rarity] ??
                {};

            return (
                `${TITLE_RARITY_ICONS[rarity]} ` +
                `**${rarity}:** ` +
                `\`${formatNumber(
                    details.unlockCount
                )} unlocks\` • ` +
                `\`${formatNumber(
                    details.soulCount
                )} members\``
            );
        })
        .join('\n');
}

function buildCollectionPage({
    interaction,
    statistics
}) {
    const achievements =
        statistics?.achievements ?? {};

    const titles =
        statistics?.titles ?? {};

    const embed =
        createDashboardEmbed({
            interaction,

            title:
                '🏆 Achievements & Titles',

            description:
                'Achievement and Title records across THE Ⅹ SINS.',

            color:
                embedConfig.colors.gold
        });

    embed.addFields(
        {
            name:
                '🏆 Achievements',

            value: [
                `**Definitions:** \`${formatNumber(achievements.totalDefinitions)}\``,
                `**Total Unlocks:** \`${formatNumber(achievements.totalUnlocks)}\``,
                `**Unique Holders:** \`${formatNumber(achievements.uniqueHolders)}\``,
                `**Average / Member:** \`${formatDecimal(achievements.averagePerMember, 2)}\``,
                `**Latest Unlock:** ${
                    formatDiscordDate(
                        achievements.latestUnlockAt,
                        'R'
                    )
                }`
            ].join('\n')
        },

        {
            name:
                '🏷️ Titles',

            value: [
                `**Definitions:** \`${formatNumber(titles.totalDefinitions)}\``,
                `**Total Unlocks:** \`${formatNumber(titles.totalUnlocks)}\``,
                `**Unique Holders:** \`${formatNumber(titles.uniqueHolders)}\``,
                `**Active Titles:** \`${formatNumber(titles.activeTitles)}\``,
                `**Average / Member:** \`${formatDecimal(titles.averagePerMember, 2)}\``
            ].join('\n')
        },

        {
            name:
                '🎨 Title Rarity',

            value:
                buildRaritySummary(
                    titles.rarityStatistics
                )
        }
    );

    const recentAchievements =
        Array.isArray(
            achievements.recent
        )
            ? achievements.recent
            : [];

    if (recentAchievements.length > 0) {
        embed.addFields({
            name:
                '🏅 Recent Achievements',

            value:
                recentAchievements
                    .slice(0, 5)
                    .map(record => [
                        formatMemberMention(
                            interaction.guild,
                            record.userId
                        ),
                        `**${record.name ?? 'Achievement'}**`,
                        record.unlockedAt
                            ? formatDiscordDate(
                                record.unlockedAt,
                                'R'
                            )
                            : null
                    ]
                        .filter(Boolean)
                        .join(' • ')
                    )
                    .join('\n')
                    .slice(0, 1024)
        });
    }

    const recentTitles =
        Array.isArray(titles.recent)
            ? titles.recent
            : [];

    if (recentTitles.length > 0) {
        embed.addFields({
            name:
                '🏷️ Recent Titles',

            value:
                recentTitles
                    .slice(0, 5)
                    .map(record => [
                        formatMemberMention(
                            interaction.guild,
                            record.userId
                        ),
                        `**${record.name ?? 'Title'}**`,
                        record.unlockedAt
                            ? formatDiscordDate(
                                record.unlockedAt,
                                'R'
                            )
                            : null
                    ]
                        .filter(Boolean)
                        .join(' • ')
                    )
                    .join('\n')
                    .slice(0, 1024)
        });
    }

    return embed;
}

function buildActivityPage({
    interaction,
    statistics
}) {
    const embed =
        createDashboardEmbed({
            interaction,

            title:
                '📊 Recent Server Activity',

            description:
                'Recent progression, Achievement, Title and Sin Rank activity.',

            color:
                embedConfig.colors.primary
        });

    const recentLevels =
        statistics?.recentLevels ?? [];

    const recentAchievements =
        statistics?.recentAchievements ??
        statistics?.achievements?.recent ??
        [];

    const recentTitles =
        statistics?.recentTitles ??
        statistics?.titles?.recent ??
        [];

    const recentRanks =
        statistics?.recentRanks ?? [];

    const levelLines =
        recentLevels
            .slice(0, 5)
            .map(record =>
                `⭐ ${
                    formatMemberMention(
                        interaction.guild,
                        record.userId
                    )
                } reached **Level ${
                    formatNumber(
                        record.level
                    )
                }** ${
                    formatDiscordDate(
                        record.createdAt ??
                        record.updatedAt,
                        'R'
                    )
                }`
            );

    const achievementLines =
        recentAchievements
            .slice(0, 5)
            .map(record =>
                `🏆 ${
                    formatMemberMention(
                        interaction.guild,
                        record.userId
                    )
                } unlocked **${
                    record.name ??
                    'Achievement'
                }** ${
                    formatDiscordDate(
                        record.unlockedAt,
                        'R'
                    )
                }`
            );

    const titleLines =
        recentTitles
            .slice(0, 5)
            .map(record =>
                `🏷️ ${
                    formatMemberMention(
                        interaction.guild,
                        record.userId
                    )
                } unlocked **${
                    record.name ??
                    'Title'
                }** ${
                    formatDiscordDate(
                        record.unlockedAt,
                        'R'
                    )
                }`
            );

    const rankLines =
        recentRanks
            .slice(0, 5)
            .map(record =>
                `⚔️ ${
                    formatMemberMention(
                        interaction.guild,
                        record.userId
                    )
                } received **${
                    record.rankName ??
                    record.rank ??
                    'Sin Rank'
                }** ${
                    formatDiscordDate(
                        record.assignedAt,
                        'R'
                    )
                }`
            );

    return embed.addFields(
        {
            name:
                '⭐ Recent Levels',

            value:
                levelLines.length
                    ? levelLines.join('\n')
                    : 'No recent Level activity.'
        },

        {
            name:
                '🏆 Recent Achievements',

            value:
                achievementLines.length
                    ? achievementLines.join('\n')
                    : 'No recent Achievement activity.'
        },

        {
            name:
                '🏷️ Recent Titles',

            value:
                titleLines.length
                    ? titleLines.join('\n')
                    : 'No recent Title activity.'
        },

        {
            name:
                '⚔️ Recent Sin Ranks',

            value:
                rankLines.length
                    ? rankLines.join('\n')
                    : 'No recent Sin Rank activity.'
        }
    );
}function buildDashboardPage(
    pageId,
    context
) {
    switch (pageId) {
        case DASHBOARD_PAGES.command:
            return buildHighCommandPage(
                context
            );

        case DASHBOARD_PAGES.population:
            return buildPopulationPage(
                context
            );

        case DASHBOARD_PAGES.progression:
            return buildProgressionPage(
                context
            );

        case DASHBOARD_PAGES.ranks:
            return buildSinRankPage(
                context
            );

        case DASHBOARD_PAGES.collection:
            return buildCollectionPage(
                context
            );

        case DASHBOARD_PAGES.activity:
            return buildActivityPage(
                context
            );

        case DASHBOARD_PAGES.overview:
        default:
            return buildOverviewPage(
                context
            );
    }
}

async function loadDashboardStatistics(
    guildId
) {
    try {
        return await kingdomDatabase
            .getKingdomStatistics(
                guildId,
                {
                    leaderboardLimit: 5,
                    recentAchievementLimit: 5,
                    recentTitleLimit: 5,
                    recentRankLimit: 5
                }
            );
    } catch (error) {
        console.error(
            '⚠️ Evelynn could not load Server Dashboard statistics:',
            error
        );

        return null;
    }
}

async function sendDashboardError(
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
}

module.exports = {
    category:
        'information',

    data:
        new SlashCommandBuilder()
            .setName('dashboard')
            .setDescription(
                'Open THE Ⅹ SINS Server Dashboard.'
            )
            .setDMPermission(false),

    async execute(interaction) {
        try {
            if (!interaction.inGuild()) {
                await sendDashboardError(
                    interaction,
                    '❌ THE Ⅹ SINS Only Command',
                    'The Server Dashboard can only be opened inside THE Ⅹ SINS.'
                );

                return;
            }

            await interaction.deferReply();

            await interaction.guild.members
                .fetch()
                .catch(() => null);

            const statistics =
                await loadDashboardStatistics(
                    interaction.guild.id
                );

            const context = {
                interaction,
                statistics
            };

            let selectedPage =
                DASHBOARD_PAGES.overview;

            const createPagePayload =
                (
                    pageId,
                    disabled = false
                ) => ({
                    embeds: [
                        buildDashboardPage(
                            pageId,
                            context
                        )
                    ],

                    components: [
                        createDashboardMenu(
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
                                DASHBOARD_MENU_ID,

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
                                        '❌ Private Dashboard',
                                        'Only the member who opened this Dashboard may control it.'
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
                            !DASHBOARD_PAGE_ORDER.includes(
                                requestedPage
                            )
                        ) {
                            await component.reply({
                                embeds: [
                                    createErrorEmbed(
                                        '❌ Unknown Dashboard Page',
                                        'Evelynn could not recognize that Dashboard page.'
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
                            '❌ Evelynn /dashboard navigation error:',
                            error
                        );

                        const payload = {
                            embeds: [
                                createErrorEmbed(
                                    '❌ Dashboard Navigation Failed',
                                    'Evelynn could not open that Dashboard page.'
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
                '❌ Evelynn /dashboard command error:',
                error
            );

            await sendDashboardError(
                interaction,
                '❌ Server Dashboard Unavailable',
                'Evelynn could not open THE Ⅹ SINS Server Dashboard.'
            );
        }
    }
};