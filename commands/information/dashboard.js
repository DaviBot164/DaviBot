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
    kingdom: kingdomDatabase
} = require('../../database');

const rankConfig =
    require('../../config/ranks');

const KINGDOM_MENU_ID =
    'umbra_lasnoches_dashboard_menu';

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

const KINGDOM_PAGE_ORDER =
    Object.values(
        KINGDOM_PAGES
    );

const KINGDOM_PAGE_DETAILS = {
    [KINGDOM_PAGES.overview]: {
        emoji: '🏛️',
        label: 'TTS Overview',
        description:
            'Central status of THE Ⅹ SINS'
    },

    [KINGDOM_PAGES.command]: {
        emoji: '👑',
        label: 'High Command',
        description:
            'Leadership and staff structure'
    },

    [KINGDOM_PAGES.population]: {
        emoji: '👥',
        label: 'Population',
        description:
            'Members and server structure'
    },

    [KINGDOM_PAGES.progression]: {
        emoji: '📈',
        label: 'Progression',
        description:
            'Levels, XP and activity statistics'
    },

    [KINGDOM_PAGES.espada]: {
        emoji: '⚔️',
        label: 'Sin Ranks',
        description:
            'Rank occupancy and hierarchy'
    },

    [KINGDOM_PAGES.chronicles]: {
        emoji: '🏆',
        label: 'Chronicles',
        description:
            'Achievements and Titles'
    },

    [KINGDOM_PAGES.activity]: {
        emoji: '📊',
        label: 'Activity',
        description:
            'Recent progression and rank activity'
    }
};

const STAFF_ROLES = [
    '⚜️ Head Captain',
    '🛡️ Captain',
    '⚔️ Lieutenant'
];

const SIN_RANK_ROLES =
    Object.values(
        rankConfig.hierarchy
    )
        .map(
            rank =>
                rank.name
        )
        .filter(Boolean);

const HOLLOW_EVOLUTION_ROLES = [
    '👁️ Hollow',
    '🦴 Menos Grande',
    '⚪ Gillian',
    '🐺 Adjuchas',
    '👑 Vasto Lorde',
    '⚔️ Arrancar'
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
    if (!value) {
        return 'Not recorded';
    }

    const date =
        value instanceof Date
            ? value
            : new Date(value);

    if (Number.isNaN(
        date.getTime()
    )) {
        return 'Not recorded';
    }

    return `<t:${Math.floor(
        date.getTime() / 1000
    )}:${style}>`;
}

function calculatePercentage(
    completed,
    total
) {
    const current =
        Math.max(
            0,
            Number(completed) || 0
        );

    const maximum =
        Math.max(
            0,
            Number(total) || 0
        );

    if (!maximum) {
        return 0;
    }

    return Math.min(
        100,
        Math.round(
            current /
            maximum *
            100
        )
    );
}

function createProgressBar(
    percentage,
    length = 14
) {
    const safe =
        Math.min(
            100,
            Math.max(
                0,
                Number(percentage) || 0
            )
        );

    const filled =
        Math.round(
            safe / 100 * length
        );

    return (
        '▰'.repeat(filled) +
        '▱'.repeat(
            length - filled
        )
    );
}

function findGuildRole(
    guild,
    roleName
) {
    return (
        guild.roles.cache.find(
            role =>
                role.name === roleName
        ) ??
        null
    );
}

function getHumanRoleMembers(role) {
    if (!role) {
        return [];
    }

    return [...role.members.values()]
        .filter(
            member =>
                !member.user.bot
        )
        .sort(
            (a, b) =>
                a.displayName.localeCompare(
                    b.displayName
                )
        );
}

function formatMemberList(
    members,
    emptyText = 'Vacant',
    limit = 10
) {
    if (!members?.length) {
        return emptyText;
    }

    const visible =
        members.slice(
            0,
            limit
        );

    const lines =
        visible.map(
            member => `${member}`
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
        guild.members.cache.get(
            userId
        )?.toString() ??
        `<@${userId}>`
    );
}

function splitRecords(
    records,
    maxLength = 1000
) {
    const chunks = [];
    let current = '';

    for (const record of records) {
        const separator =
            current
                ? '\n\n━━━━━━━━━━━━━━━━━━━━\n\n'
                : '';

        const next =
            `${current}${separator}${record}`;

        if (
            next.length > maxLength &&
            current
        ) {
            chunks.push(current);
            current = record;
        } else {
            current = next;
        }
    }

    if (current) {
        chunks.push(current);
    }

    return chunks;
}

function createDashboardMenu(
    selectedPage,
    disabled = false
) {
    const menu =
        new StringSelectMenuBuilder()
            .setCustomId(
                KINGDOM_MENU_ID
            )
            .setPlaceholder(
                'Select a TTS dashboard page'
            )
            .setMinValues(1)
            .setMaxValues(1)
            .setDisabled(disabled)
            .addOptions(
                KINGDOM_PAGE_ORDER.map(
                    pageId => {
                        const details =
                            KINGDOM_PAGE_DETAILS[
                                pageId
                            ];

                        return new StringSelectMenuOptionBuilder()
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
    color = embedConfig.colors.primary
}) {
    const botAvatar =
        interaction.client.user
            .displayAvatarURL({
                size: 512,
                forceStatic: false
            });

    const guildIcon =
        interaction.guild.iconURL({
            size: 512,
            forceStatic: false
        }) ?? botAvatar;

    return createEmbed({
        title,

        description: [
            description,
            '',
            embedConfig.branding.divider
        ].join('\n'),

        color,

        thumbnail:
            guildIcon,

        author: {
            name:
                `${interaction.guild.name} • Dashboard`,

            iconURL:
                guildIcon
        },

        footer: {
            text:
                `Evelynn • TTS Dashboard • ${interaction.user.username}`,

            iconURL:
                botAvatar
        }
    });
}

function getRoleMembers(
    guild,
    roleNames
) {
    const uniqueMemberIds =
        new Set();

    const lines = [];
    let missingRoles = 0;

    for (const roleName of roleNames) {
        const role =
            findGuildRole(
                guild,
                roleName
            );

        if (!role) {
            missingRoles += 1;

            lines.push(
                `**${roleName}:** \`Role Missing\``
            );

            continue;
        }

        const members =
            getHumanRoleMembers(
                role
            );

        for (const member of members) {
            uniqueMemberIds.add(
                member.id
            );
        }

        lines.push(
            `**${roleName}:** \`${formatNumber(
                members.length
            )}\``
        );
    }

    return {
        uniqueMemberIds,
        missingRoles,
        lines
    };
}

function getSinRankStatus(guild) {
    let occupied = 0;
    let missing = 0;
    let conflicts = 0;

    const holders =
        new Set();

    for (const roleName of SIN_RANK_ROLES) {
        const role =
            findGuildRole(
                guild,
                roleName
            );

        if (!role) {
            missing += 1;
            continue;
        }

        const members =
            getHumanRoleMembers(
                role
            );

        if (members.length) {
            occupied += 1;
        }

        if (members.length > 1) {
            conflicts += 1;
        }

        for (const member of members) {
            holders.add(
                member.id
            );
        }
    }

    return {
        occupied,

        vacant:
            Math.max(
                0,
                SIN_RANK_ROLES.length -
                occupied -
                missing
            ),

        missing,

        uniqueHolders:
            holders.size,

        conflicts
    };
}

function countHighCommandMembers(guild) {
    const memberIds =
        new Set([
            guild.ownerId
        ]);

    for (const roleName of STAFF_ROLES) {
        const role =
            findGuildRole(
                guild,
                roleName
            );

        for (
            const member
            of getHumanRoleMembers(role)
        ) {
            memberIds.add(
                member.id
            );
        }
    }

    return memberIds.size;
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

function buildOverviewPage(context) {
    const {
        interaction,
        kingdomStatistics
    } = context;

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
                channel.type === 4
        );

    const owner =
        guild.members.cache.get(
            guild.ownerId
        );

    const rankStatus =
        getSinRankStatus(
            guild
        );

    const progression =
        kingdomStatistics?.progression ??
        {};

    const achievements =
        kingdomStatistics?.achievements ??
        {};

    const titles =
        kingdomStatistics?.titles ??
        {};

    const ranks =
        kingdomStatistics?.ranks ??
        {};

    const archive =
        kingdomStatistics?.archiveSummary ??
        {};

    const rankCoverage =
        calculatePercentage(
            rankStatus.occupied,
            SIN_RANK_ROLES.length
        );

    const databaseCoverage =
        calculatePercentage(
            progression.registeredSouls,
            humans.size
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
                `**Owner:** ${owner ?? 'Unknown'}`,
                `**Created:** ${formatDiscordDate(
                    guild.createdAt,
                    'F'
                )}`,
                `**Age:** ${formatDiscordDate(
                    guild.createdAt,
                    'R'
                )}`
            ].join('\n'),

            inline: false
        },

        {
            name:
                '👥 Members',

            value: [
                `**Total:** \`${formatNumber(
                    guild.memberCount
                )}\``,
                `**Members:** \`${formatNumber(
                    humans.size
                )}\``,
                `**Bots:** \`${formatNumber(
                    bots.size
                )}\``,
                `**Database Records:** \`${formatNumber(
                    progression.registeredSouls
                )}\``,
                '',
                `\`${createProgressBar(
                    databaseCoverage,
                    12
                )}\` **${databaseCoverage}% recorded**`
            ].join('\n'),

            inline: true
        },

        {
            name:
                '🏗️ Structure',

            value: [
                `**Categories:** \`${formatNumber(
                    categories.size
                )}\``,
                `**Text Channels:** \`${formatNumber(
                    textChannels.size
                )}\``,
                `**Voice Channels:** \`${formatNumber(
                    voiceChannels.size
                )}\``,
                `**Roles:** \`${formatNumber(
                    Math.max(
                        0,
                        guild.roles.cache.size - 1
                    )
                )}\``,
                `**Staff Members:** \`${formatNumber(
                    countHighCommandMembers(
                        guild
                    )
                )}\``
            ].join('\n'),

            inline: true
        },

        {
            name:
                '⚔️ Sin Rank Occupancy',

            value: [
                `\`${createProgressBar(
                    rankCoverage,
                    16
                )}\` **${rankCoverage}% occupied**`,
                '',
                `**Occupied:** \`${formatNumber(
                    rankStatus.occupied
                )} / ${formatNumber(
                    SIN_RANK_ROLES.length
                )}\``,
                `**Vacant:** \`${formatNumber(
                    rankStatus.vacant
                )}\``,
                `**Missing Roles:** \`${formatNumber(
                    rankStatus.missing
                )}\``,
                `**Unique Holders:** \`${formatNumber(
                    rankStatus.uniqueHolders
                )}\``
            ].join('\n'),

            inline: false
        }
    );

    if (kingdomStatistics) {
        embed.addFields(
            {
                name:
                    '📈 Progression',

                value: [
                    `**Highest Level:** \`${formatNumber(
                        progression.highestLevel
                    )}\``,
                    `**Average Level:** \`${formatDecimal(
                        progression.averageLevel
                    )}\``,
                    `**Total XP:** \`${formatNumber(
                        progression.totalXp
                    )}\``,
                    `**Messages:** \`${formatNumber(
                        progression.totalMessages
                    )}\``,
                    `**Active Records:** \`${formatNumber(
                        progression.activeSouls
                    )}\``
                ].join('\n'),

                inline: true
            },

            {
                name:
                    '🏆 Achievements & Titles',

                value: [
                    `**Achievement Unlocks:** \`${formatNumber(
                        achievements.totalUnlocks
                    )}\``,
                    `**Title Unlocks:** \`${formatNumber(
                        titles.totalUnlocks
                    )}\``,
                    `**Active Titles:** \`${formatNumber(
                        titles.activeTitles
                    )}\``,
                    `**Rare Titles:** \`${formatNumber(
                        titles.rareUnlocks
                    )}\``,
                    `**Ranked Members:** \`${formatNumber(
                        ranks.activeRankedSouls
                    )}\``
                ].join('\n'),

                inline: true
            },

            {
                name:
                    '📚 Archive',

                value: [
                    `**Records:** \`${formatNumber(
                        archive.totalArchiveRecords
                    )}\``,
                    `**Participants:** \`${formatNumber(
                        archive.participatingSouls
                    )}\``,
                    `**Achievements / Member:** \`${formatDecimal(
                        archive.averageAchievementUnlocks,
                        2
                    )}\``,
                    `**Titles / Member:** \`${formatDecimal(
                        archive.averageTitleUnlocks,
                        2
                    )}\``,
                    `**Updated:** ${formatDiscordDate(
                        kingdomStatistics.generatedAt,
                        'R'
                    )}`
                ].join('\n'),

                inline: false
            }
        );
    } else {
        embed.addFields({
            name:
                '⚠️ Database Unavailable',

            value:
                'Discord information is available, but PostgreSQL statistics could not be loaded.',

            inline: false
        });
    }

    embed.addFields({
        name:
            '🧭 Related Commands',

        value: [
            '`/leaderboard` — rankings',
            '`/rank` — current rank',
            '`/titles` — title collection',
            '`/rankhistory` — rank history'
        ].join('\n'),

        inline: false
    });

    return embed;
}function buildHighCommandPage(context) {
    const { interaction } =
        context;

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
                '👑 TTS High Command',

            description:
                'Leadership and staff structure of THE Ⅹ SINS.',

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
                    `**Joined:** ${formatDiscordDate(
                        owner.joinedAt,
                        'D'
                    )}`
                ].join('\n')
                : 'Owner information could not be loaded.',

        inline: false
    });

    const leadershipIds =
        new Set(
            owner
                ? [owner.id]
                : []
        );

    let missingRoles = 0;

    for (const roleName of STAFF_ROLES) {
        const role =
            findGuildRole(
                guild,
                roleName
            );

        if (!role) {
            missingRoles += 1;

            embed.addFields({
                name:
                    roleName,

                value:
                    '⚠️ Role Missing',

                inline: false
            });

            continue;
        }

        const members =
            getHumanRoleMembers(
                role
            );

        for (const member of members) {
            leadershipIds.add(
                member.id
            );
        }

        embed.addFields({
            name:
                roleName,

            value: [
                formatMemberList(
                    members,
                    'No members assigned.',
                    10
                ),
                '',
                `-# Assigned: ${formatNumber(
                    members.length
                )}`
            ].join('\n'),

            inline: false
        });
    }

    const configured =
        STAFF_ROLES.length -
        missingRoles;

    const percentage =
        calculatePercentage(
            configured,
            STAFF_ROLES.length
        );

    embed.addFields(
        {
            name:
                '📊 Staff Status',

            value: [
                `**Recognized Leaders:** \`${formatNumber(
                    leadershipIds.size
                )}\``,
                `**Configured Roles:** \`${formatNumber(
                    configured
                )} / ${formatNumber(
                    STAFF_ROLES.length
                )}\``,
                `**Missing Roles:** \`${formatNumber(
                    missingRoles
                )}\``,
                '',
                `\`${createProgressBar(
                    percentage,
                    14
                )}\` **${percentage}% configured**`
            ].join('\n'),

            inline: false
        },

        {
            name:
                '🛡️ Authority Structure',

            value: [
                '**Owner** — full server authority',
                '**Head Captain** — senior administration',
                '**Captain** — administration and hierarchy management',
                '**Lieutenant** — moderation and member support',
                '',
                '-# Actual permissions are controlled by Discord roles.'
            ].join('\n'),

            inline: false
        }
    );

    return embed;
}

function buildPopulationPage(context) {
    const {
        interaction,
        kingdomStatistics
    } = context;

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

    const evolution =
        getRoleMembers(
            guild,
            HOLLOW_EVOLUTION_ROLES
        );

    const sinRanks =
        getRoleMembers(
            guild,
            SIN_RANK_ROLES
        );

    const progression =
        kingdomStatistics?.progression ??
        {};

    const coverage =
        calculatePercentage(
            progression.registeredSouls,
            humanMembers.size
        );

    const embed =
        createDashboardEmbed({
            interaction,

            title:
                '👥 TTS Population',

            description:
                'Member structure, evolution stages and THE Ⅹ SINS rank hierarchy.',

            color:
                embedConfig.colors.support
        });

    embed.addFields(
        {
            name:
                '👥 General Population',

            value: [
                `**Total Members:** \`${formatNumber(
                    guild.memberCount
                )}\``,
                `**Members:** \`${formatNumber(
                    humanMembers.size
                )}\``,
                `**Bots:** \`${formatNumber(
                    botMembers.size
                )}\``,
                `**Database Records:** \`${formatNumber(
                    progression.registeredSouls
                )}\``,
                `**Active Records:** \`${formatNumber(
                    progression.activeSouls
                )}\``,
                '',
                `\`${createProgressBar(
                    coverage,
                    14
                )}\` **${coverage}% database coverage**`
            ].join('\n'),

            inline: false
        },

        {
            name:
                '👁️ Evolution Roles',

            value:
                evolution.lines.join('\n'),

            inline: true
        },

        {
            name:
                '⚔️ Sin Ranks',

            value:
                sinRanks.lines.join('\n'),

            inline: true
        },

        {
            name:
                '📊 Population Summary',

            value: [
                `**Evolution Holders:** \`${formatNumber(
                    evolution.uniqueMemberIds.size
                )}\``,
                `**Rank Holders:** \`${formatNumber(
                    sinRanks.uniqueMemberIds.size
                )}\``,
                `**High Command:** \`${formatNumber(
                    countHighCommandMembers(
                        guild
                    )
                )}\``,
                '',
                `**Missing Evolution Roles:** \`${formatNumber(
                    evolution.missingRoles
                )}\``,
                `**Missing Rank Roles:** \`${formatNumber(
                    sinRanks.missingRoles
                )}\``
            ].join('\n'),

            inline: false
        },

        {
            name:
                '📖 Notes',

            value: [
                'Members may appear in more than one role group.',
                '',
                'Evolution roles represent progression stages, while Sin Ranks represent manually assigned standing.',
                '',
                '-# Role-group totals should not be added together as unique members.'
            ].join('\n'),

            inline: false
        }
    );

    return embed;
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
                    : `#${formatNumber(
                        position
                    )}`;

    const statistic =
        {
            level:
                `⭐ Level ${formatNumber(
                    record.level
                )}`,

            xp:
                `✨ ${formatNumber(
                    record.xp
                )} XP`,

            messages:
                `💬 ${formatNumber(
                    record.messageCount
                )} messages`
        }[type] ??
        `⭐ Level ${formatNumber(
            record.level
        )}`;

    return [
        `${medal} ${formatMemberMention(
            guild,
            record.userId
        )}`,
        `**${statistic}**`,
        `-# Level ${formatNumber(
            record.level
        )} • ${formatNumber(
            record.xp
        )} XP • ${formatNumber(
            record.messageCount
        )} messages`
    ].join('\n');
}

function buildProgressionPage(context) {
    const {
        interaction,
        kingdomStatistics
    } = context;

    const embed =
        createDashboardEmbed({
            interaction,

            title:
                '📈 TTS Progression',

            description:
                'Levels, XP and activity statistics across THE Ⅹ SINS.',

            color:
                embedConfig.colors.archive
        });

    if (!kingdomStatistics) {
        embed.addFields({
            name:
                '⚠️ Progression Core Unavailable',

            value: [
                'Evelynn could not load PostgreSQL progression records.',
                '',
                'Discord-based dashboard data remains available.',
                '',
                '-# Check the database connection and runtime logs.'
            ].join('\n'),

            inline: false
        });

        return embed;
    }

    const progression =
        kingdomStatistics.progression ??
        {};

    const leaderboards =
        kingdomStatistics.leaderboards ??
        {};

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

    embed.addFields(
        {
            name:
                '📊 Progression Overview',

            value: [
                `**Registered Records:** \`${formatNumber(
                    progression.registeredSouls
                )}\``,
                `**Active Records:** \`${formatNumber(
                    progression.activeSouls
                )}\``,
                `**Highest Level:** \`${formatNumber(
                    progression.highestLevel
                )}\``,
                `**Average Level:** \`${formatDecimal(
                    progression.averageLevel
                )}\``,
                `**Average XP:** \`${formatNumber(
                    Math.round(
                        Number(
                            progression.averageXp
                        ) || 0
                    )
                )} XP\``,
                `**Average Messages:** \`${formatNumber(
                    Math.round(
                        Number(
                            progression.averageMessages
                        ) || 0
                    )
                )}\``,
                '',
                `\`${createProgressBar(
                    activePercentage,
                    16
                )}\` **${activePercentage}% active**`
            ].join('\n'),

            inline: false
        },

        {
            name:
                '✨ Collective XP',

            value: [
                `**Total XP:** \`${formatNumber(
                    progression.totalXp
                )}\``,
                `**Highest XP:** \`${formatNumber(
                    progression.highestXp
                )}\``,
                `**Total Messages:** \`${formatNumber(
                    progression.totalMessages
                )}\``,
                `**Highest Messages:** \`${formatNumber(
                    progression.highestMessageCount
                )}\``
            ].join('\n'),

            inline: false
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

            inline: true
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

            inline: true
        },

        {
            name:
                '💬 Activity Leader',

            value:
                formatProgressionLeader(
                    interaction.guild,
                    messages[0],
                    'messages'
                ),

            inline: false
        },

        {
            name:
                '📅 Timeline',

            value: [
                `**First Record:** ${formatDiscordDate(
                    progression.firstSoulRecordAt,
                    'D'
                )}`,
                `**Latest Update:** ${formatDiscordDate(
                    progression.latestProgressionUpdateAt,
                    'R'
                )}`,
                '',
                '-# Use `/leaderboard` for detailed rankings.'
            ].join('\n'),

            inline: false
        }
    );

    return embed;
}function buildSinRankPage(context) {
    const {
        interaction,
        kingdomStatistics
    } = context;

    const guild =
        interaction.guild;

    const status =
        getSinRankStatus(
            guild
        );

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

    const rankRecords =
        kingdomStatistics?.recentRanks ??
        [];

    const rankFields =
        [];

    for (
        const rank
        of Object.values(
            rankConfig.hierarchy
        )
    ) {
        const role =
            findGuildRole(
                guild,
                rank.name
            );

        const members =
            getHumanRoleMembers(
                role
            );

        rankFields.push({
            name:
                rank.name,

            value: [
                role
                    ? `**Holders:** \`${formatNumber(
                        members.length
                    )}\``
                    : '**Status:** `Role Missing`',

                role && members.length
                    ? formatMemberList(
                        members,
                        'Vacant',
                        8
                    )
                    : role
                        ? 'Vacant'
                        : '⚠️ Role ID/name is not available in Discord.'
            ].join('\n'),

            inline: false
        });
    }

    embed.addFields(
        {
            name:
                '📊 Rank Overview',

            value: [
                `**Configured Ranks:** \`${formatNumber(
                    Object.keys(
                        rankConfig.hierarchy
                    ).length
                )}\``,
                `**Occupied:** \`${formatNumber(
                    status.occupied
                )}\``,
                `**Vacant:** \`${formatNumber(
                    status.vacant
                )}\``,
                `**Missing Roles:** \`${formatNumber(
                    status.missing
                )}\``,
                `**Unique Holders:** \`${formatNumber(
                    status.uniqueHolders
                )}\``,
                `**Conflicts:** \`${formatNumber(
                    status.conflicts
                )}\``
            ].join('\n'),

            inline: false
        },

        ...rankFields
    );

    if (rankRecords.length) {
        embed.addFields({
            name:
                '📜 Recent Rank Activity',

            value:
                rankRecords
                    .slice(0, 5)
                    .map(
                        record => [
                            `${formatMemberMention(
                                guild,
                                record.userId
                            )}`,
                            `**${record.rankName ?? record.rank ?? 'Unknown Rank'}**`,
                            record.assignedAt
                                ? formatDiscordDate(
                                    record.assignedAt,
                                    'R'
                                )
                                : ''
                        ]
                            .filter(Boolean)
                            .join(' • ')
                    )
                    .join('\n'),

            inline: false
        });
    }

    embed.addFields({
        name:
            '📖 Rank Rules',

        value: [
            'Sin Ranks are manually assigned through the rank management system.',
            'A member should hold only the rank intended for their current standing.',
            '',
            '-# Rank definitions are loaded from `config/ranks.js`.'
        ].join('\n'),

        inline: false
    });

    return embed;
}

function buildChroniclesPage(context) {
    const {
        interaction,
        kingdomStatistics
    } = context;

    const achievements =
        kingdomStatistics?.achievements ??
        {};

    const titles =
        kingdomStatistics?.titles ??
        {};

    const rarityStatistics =
        titles.rarityStatistics ??
        {};

    const embed =
        createDashboardEmbed({
            interaction,

            title:
                '🏆 TTS Chronicles',

            description:
                'Achievements and Chronicle Titles earned throughout THE Ⅹ SINS.',

            color:
                embedConfig.colors.gold
        });

    embed.addFields(
        {
            name:
                '🏆 Achievements',

            value: [
                `**Definitions:** \`${formatNumber(
                    achievements.totalDefinitions
                )}\``,
                `**Total Unlocks:** \`${formatNumber(
                    achievements.totalUnlocks
                )}\``,
                `**Unique Holders:** \`${formatNumber(
                    achievements.uniqueHolders
                )}\``,
                `**Average / Member:** \`${formatDecimal(
                    achievements.averagePerMember,
                    2
                )}\``,
                `**Latest Unlock:** ${formatDiscordDate(
                    achievements.latestUnlockAt,
                    'R'
                )}`
            ].join('\n'),

            inline: false
        },

        {
            name:
                '📜 Chronicle Titles',

            value: [
                `**Definitions:** \`${formatNumber(
                    titles.totalDefinitions
                )}\``,
                `**Total Unlocks:** \`${formatNumber(
                    titles.totalUnlocks
                )}\``,
                `**Unique Holders:** \`${formatNumber(
                    titles.uniqueHolders
                )}\``,
                `**Active Titles:** \`${formatNumber(
                    titles.activeTitles
                )}\``,
                `**Average / Member:** \`${formatDecimal(
                    titles.averagePerMember,
                    2
                )}\``
            ].join('\n'),

            inline: false
        },

        {
            name:
                '🎨 Title Rarity',

            value:
                buildRaritySummary(
                    rarityStatistics
                ),

            inline: false
        }
    );

    if (
        achievements.recent &&
        achievements.recent.length
    ) {
        embed.addFields({
            name:
                '🏅 Recent Achievements',

            value:
                achievements.recent
                    .slice(0, 8)
                    .map(
                        achievement => [
                            formatMemberMention(
                                interaction.guild,
                                achievement.userId
                            ),
                            `**${achievement.name ?? 'Achievement'}**`,
                            achievement.unlockedAt
                                ? formatDiscordDate(
                                    achievement.unlockedAt,
                                    'R'
                                )
                                : ''
                        ]
                            .filter(Boolean)
                            .join(' • ')
                    )
                    .join('\n'),

            inline: false
        });
    }

    if (
        titles.recent &&
        titles.recent.length
    ) {
        embed.addFields({
            name:
                '📜 Recent Titles',

            value:
                titles.recent
                    .slice(0, 8)
                    .map(
                        title => [
                            formatMemberMention(
                                interaction.guild,
                                title.userId
                            ),
                            `**${title.name ?? 'Title'}**`,
                            title.unlockedAt
                                ? formatDiscordDate(
                                    title.unlockedAt,
                                    'R'
                                )
                                : ''
                        ]
                            .filter(Boolean)
                            .join(' • ')
                    )
                    .join('\n'),

            inline: false
        });
    }

    return embed;
}

function buildActivityPage(context) {
    const {
        interaction,
        kingdomStatistics
    } = context;

    const embed =
        createDashboardEmbed({
            interaction,

            title:
                '📊 TTS Activity',

            description:
                'Recent progression, achievement, title and rank activity.',

            color:
                embedConfig.colors.primary
        });

    const recentLevels =
        kingdomStatistics?.recentLevels ??
        [];

    const recentAchievements =
        kingdomStatistics?.recentAchievements ??
        [];

    const recentTitles =
        kingdomStatistics?.recentTitles ??
        [];

    const recentRanks =
        kingdomStatistics?.recentRanks ??
        [];

    const activityLines = [];

    for (
        const record
        of recentLevels.slice(0, 5)
    ) {
        activityLines.push(
            `⭐ ${formatMemberMention(
                interaction.guild,
                record.userId
            )} reached **Level ${formatNumber(
                record.level
            )}** ${formatDiscordDate(
                record.createdAt ??
                record.updatedAt,
                'R'
            )}`
        );
    }

    if (!activityLines.length) {
        activityLines.push(
            'No recent level activity recorded.'
        );
    }

    embed.addFields({
        name:
            '⭐ Recent Levels',

        value:
            activityLines.join('\n'),

        inline: false
    });

    const achievementLines =
        recentAchievements
            .slice(0, 5)
            .map(
                record =>
                    `🏆 ${formatMemberMention(
                        interaction.guild,
                        record.userId
                    )} unlocked **${
                        record.name ??
                        'Achievement'
                    }** ${record.unlockedAt
                        ? formatDiscordDate(
                            record.unlockedAt,
                            'R'
                        )
                        : ''
                    }`
            );

    embed.addFields({
        name:
            '🏆 Recent Achievements',

        value:
            achievementLines.length
                ? achievementLines.join('\n')
                : 'No recent achievement activity recorded.',

        inline: false
    });

    const titleLines =
        recentTitles
            .slice(0, 5)
            .map(
                record =>
                    `📜 ${formatMemberMention(
                        interaction.guild,
                        record.userId
                    )} unlocked **${
                        record.name ??
                        'Title'
                    }** ${record.unlockedAt
                        ? formatDiscordDate(
                            record.unlockedAt,
                            'R'
                        )
                        : ''
                    }`
            );

    embed.addFields({
        name:
            '📜 Recent Titles',

        value:
            titleLines.length
                ? titleLines.join('\n')
                : 'No recent title activity recorded.',

        inline: false
    });

    const rankLines =
        recentRanks
            .slice(0, 5)
            .map(
                record =>
                    `⚔️ ${formatMemberMention(
                        interaction.guild,
                        record.userId
                    )} received **${
                        record.rankName ??
                        record.rank ??
                        'Sin Rank'
                    }** ${record.assignedAt
                        ? formatDiscordDate(
                            record.assignedAt,
                            'R'
                        )
                        : ''
                    }`
            );

    embed.addFields({
        name:
            '⚔️ Recent Sin Ranks',

        value:
            rankLines.length
                ? rankLines.join('\n')
                : 'No recent rank activity recorded.',

        inline: false
    });

    return embed;
}

async function loadDashboardContext(
    interaction
) {
    let kingdomStatistics =
        null;

    try {
        kingdomStatistics =
            await kingdomDatabase
                .getKingdomStatistics(
                    interaction.guild.id
                );
    } catch (error) {
        console.error(
            '[Dashboard] Failed to load kingdom statistics:',
            error
        );
    }

    return {
        interaction,
        kingdomStatistics
    };
}

async function renderDashboardPage(
    interaction,
    pageId
) {
    const context =
        await loadDashboardContext(
            interaction
        );

    let embed;

    switch (pageId) {
        case KINGDOM_PAGES.overview:
            embed =
                buildOverviewPage(
                    context
                );
            break;

        case KINGDOM_PAGES.command:
            embed =
                buildHighCommandPage(
                    context
                );
            break;

        case KINGDOM_PAGES.population:
            embed =
                buildPopulationPage(
                    context
                );
            break;

        case KINGDOM_PAGES.progression:
            embed =
                buildProgressionPage(
                    context
                );
            break;

        case KINGDOM_PAGES.espada:
            embed =
                buildSinRankPage(
                    context
                );
            break;

        case KINGDOM_PAGES.chronicles:
            embed =
                buildChroniclesPage(
                    context
                );
            break;

        case KINGDOM_PAGES.activity:
            embed =
                buildActivityPage(
                    context
                );
            break;

        default:
            embed =
                buildOverviewPage(
                    context
                );
            break;
    }

    return {
        embed,

        components: [
            createDashboardMenu(
                pageId
            )
        ]
    };
}async function buildKingdomPage(
    context,
    selectedPage
) {
    switch (selectedPage) {
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
            return buildSinRankPage(
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
                'dashboard'
            )
            .setDescription(
                'Open the interactive Kingdom Dashboard of Las Noches.'
            )
            .setDMPermission(
                false
            ),

    /**
     * Execute the /dashboard command.
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
                await buildKingdomPage(
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
                            await buildKingdomPage(
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
                            '❌ Umbra /dashboard navigation error:',
                            menuError
                        );

                        const navigationErrorEmbed =
                            createErrorEmbed(
                                '❌ Kingdom Navigation Failed',
                                [
                                    'Umbra could not open the selected Kingdom record.',
                                    '',
                                    'Please try opening `/dashboard` again.'
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
                '❌ Umbra /dashboard command error:',
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