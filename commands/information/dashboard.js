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

const HOLLOW_EVOLUTION_ROLES = [
    '👁️ Hollow',
    '🦴 Menos Grande',
    '⚪ Gillian',
    '🐺 Adjuchas',
    '👑 Vasto Lorde',
    '⚔️ Arrancar'
];

const ARRANCAR_HIERARCHY_ROLES = [
    '🌘 Privaron Espada',
    '⚔️ Fracción',
    '🦴 Numeros',
    '⚪ Unranked Arrancar'
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
}function splitRecords(
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

function getEspadaStatus(guild) {
    let occupied = 0;
    let missing = 0;
    let conflicts = 0;

    const holders =
        new Set();

    for (const roleName of ESPADA_ROLES) {
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
                ESPADA_ROLES.length -
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
}function buildOverviewPage(context) {
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
        getEspadaStatus(
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
            ESPADA_ROLES.length
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
                    ESPADA_ROLES.length
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
}

function buildHighCommandPage(context) {
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
}function buildPopulationPage(context) {
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

    const hierarchy =
        getRoleMembers(
            guild,
            ARRANCAR_HIERARCHY_ROLES
        );

    const espada =
        getRoleMembers(
            guild,
            ESPADA_ROLES
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
                'Member structure, evolution stages and rank hierarchy.',

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
                '⚔️ Arrancar Hierarchy',

            value:
                hierarchy.lines.join('\n'),

            inline: true
        },

        {
            name:
                '👑 Sin Rank Roles',

            value:
                espada.lines.join('\n'),

            inline: true
        },

        {
            name:
                '📊 Population Summary',

            value: [
                `**Evolution Holders:** \`${formatNumber(
                    evolution.uniqueMemberIds.size
                )}\``,
                `**Hierarchy Holders:** \`${formatNumber(
                    hierarchy.uniqueMemberIds.size
                )}\``,
                `**Rank Holders:** \`${formatNumber(
                    espada.uniqueMemberIds.size
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
                `**Missing Hierarchy Roles:** \`${formatNumber(
                    hierarchy.missingRoles
                )}\``,
                `**Missing Rank Roles:** \`${formatNumber(
                    espada.missingRoles
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
                'Evolution roles represent progression stages, while hierarchy roles represent manually assigned standing.',
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
}function formatRankPosition(
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
            '-# The configured role could not be found.'
        ].join('\n');
    }

    const members =
        getHumanRoleMembers(
            role
        );

    if (!members.length) {
        return [
            `### ${roleName}`,
            '🌑 **Vacant**',
            '-# No member currently holds this position.'
        ].join('\n');
    }

    if (members.length > 1) {
        return [
            `### ${roleName}`,
            `⚠️ **Conflict: ${formatNumber(
                members.length
            )} holders**`,
            '',
            formatMemberList(
                members,
                'Vacant',
                5
            ),
            '',
            '-# Only one member should hold each official rank.'
        ].join('\n');
    }

    const member =
        members[0];

    return [
        `### ${roleName}`,
        `${member}`,
        `**Username:** ${member.user.tag}`,
        `**User ID:** \`${member.id}\``,
        `**Joined:** ${formatDiscordDate(
            member.joinedAt,
            'D'
        )}`
    ].join('\n');
}

function buildRankPage(context) {
    const {
        interaction,
        kingdomStatistics
    } = context;

    const guild =
        interaction.guild;

    const status =
        getEspadaStatus(
            guild
        );

    const ranks =
        kingdomStatistics?.ranks ??
        {};

    const rankHistory =
        kingdomStatistics?.rankHistory ??
        {};

    const occupancy =
        calculatePercentage(
            status.occupied,
            ESPADA_ROLES.length
        );

    const embed =
        createDashboardEmbed({
            interaction,

            title:
                '⚔️ Sin Rank Status',

            description:
                'Current rank occupancy, hierarchy and assignment status.',

            color:
                embedConfig.colors.rank
        });

    embed.addFields({
        name:
            '📊 Rank Overview',

        value: [
            `\`${createProgressBar(
                occupancy,
                16
            )}\` **${occupancy}% occupied**`,
            '',
            `**Occupied:** \`${formatNumber(
                status.occupied
            )} / ${formatNumber(
                ESPADA_ROLES.length
            )}\``,
            `**Vacant:** \`${formatNumber(
                status.vacant
            )}\``,
            `**Unique Holders:** \`${formatNumber(
                status.uniqueHolders
            )}\``,
            `**Missing Roles:** \`${formatNumber(
                status.missing
            )}\``,
            `**Conflicts:** \`${formatNumber(
                status.conflicts
            )}\``
        ].join('\n'),

        inline: false
    });

    if (kingdomStatistics) {
        embed.addFields(
            {
                name:
                    '📜 Rank Records',

                value: [
                    `**Active Ranked Members:** \`${formatNumber(
                        ranks.activeRankedSouls
                    )}\``,
                    `**Rank Assignments:** \`${formatNumber(
                        ranks.totalAssignments
                    )}\``,
                    `**Promotions:** \`${formatNumber(
                        rankHistory.promotions
                    )}\``,
                    `**Demotions:** \`${formatNumber(
                        rankHistory.demotions
                    )}\``
                ].join('\n'),

                inline: true
            },

            {
                name:
                    '⚠️ Integrity',

                value: [
                    `**Missing Roles:** \`${formatNumber(
                        status.missing
                    )}\``,
                    `**Multiple Holders:** \`${formatNumber(
                        status.conflicts
                    )}\``
                ].join('\n'),

                inline: true
            }
        );
    }

    const positionRecords =
        splitRecords(
            ESPADA_ROLES.map(
                roleName =>
                    formatRankPosition(
                        guild,
                        roleName
                    )
            ),
            900
        );

    for (
        const [index, record]
        of positionRecords.entries()
    ) {
        embed.addFields({
            name:
                index === 0
                    ? '👑 Rank Positions'
                    : `👑 Rank Positions ${index + 1}`,

            value:
                record,

            inline: false
        });
    }

    embed.addFields({
        name:
            '🧭 Related Commands',

        value: [
            '`/rank` — view a member rank',
            '`/setrank` — assign a rank',
            '`/removerank` — remove a rank',
            '`/rankhistory` — view rank history'
        ].join('\n'),

        inline: false
    });

    return embed;
}function formatRecentAchievement(
    guild,
    achievement
) {
    return [
        `${achievement.icon || '🏆'} **${
            achievement.name ||
            'Unknown Achievement'
        }**`,

        `**Member:** ${formatMemberMention(
            guild,
            achievement.userId
        )}`,

        `**Category:** ${
            achievement.category ||
            'Unknown'
        }`,

        `**Unlocked:** ${
            formatDiscordDate(
                achievement.unlockedAt,
                'R'
            )
        }`,

        achievement.description
            ? `-# ${achievement.description}`
            : null
    ]
        .filter(Boolean)
        .join('\n');
}

function formatRecentTitle(
    guild,
    title
) {
    return [
        `🏷️ **${
            title.displayName ||
            title.name ||
            'Unknown Title'
        }**`,

        `**Member:** ${formatMemberMention(
            guild,
            title.userId
        )}`,

        `**Rarity:** ${
            title.rarity ||
            'Unknown'
        }`,

        `**Category:** ${
            title.category ||
            'Unknown'
        }`,

        `**Unlocked:** ${
            formatDiscordDate(
                title.unlockedAt,
                'R'
            )
        }`,

        title.isActive
            ? '👑 **Currently Active**'
            : null,

        title.description
            ? `-# ${title.description}`
            : null
    ]
        .filter(Boolean)
        .join('\n');
}

function addRecordFields(
    embed,
    records,
    {
        title,
        emptyText
    }
) {
    if (!records.length) {
        embed.addFields({
            name: title,
            value: emptyText,
            inline: false
        });

        return;
    }

    const chunks =
        splitRecords(
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
                        ? title
                        : `${title} — Continued`,

                value:
                    chunk,

                inline: false
            });
        }
    );
}

function buildChroniclesPage(
    context
) {
    const {
        interaction,
        kingdomStatistics
    } = context;

    const embed =
        createDashboardEmbed({
            interaction,

            title:
                '🏆 TTS Chronicles',

            description:
                'Achievements and Titles earned across THE Ⅹ SINS.',

            color:
                embedConfig.colors.title
        });

    if (!kingdomStatistics) {
        embed.addFields({
            name:
                '⚠️ Chronicle Core Unavailable',

            value: [
                'Achievement and Title statistics could not be loaded.',
                '',
                '-# Verify the PostgreSQL connection and database module.'
            ].join('\n'),

            inline: false
        });

        return embed;
    }

    const achievements =
        kingdomStatistics.achievements ??
        {};

    const titles =
        kingdomStatistics.titles ??
        {};

    const titleRarities =
        kingdomStatistics.titleRarities ??
        {};

    const recentAchievements =
        Array.isArray(
            kingdomStatistics
                .recentAchievements
        )
            ? kingdomStatistics
                .recentAchievements
            : [];

    const recentTitles =
        Array.isArray(
            kingdomStatistics
                .recentTitles
        )
            ? kingdomStatistics
                .recentTitles
            : [];

    const registeredMembers =
        kingdomStatistics
            .progression
            ?.registeredSouls ?? 0;

    const achievementParticipation =
        calculatePercentage(
            achievements.soulsWithAchievements,
            registeredMembers
        );

    const titleParticipation =
        calculatePercentage(
            titles.soulsWithTitles,
            registeredMembers
        );

    embed.addFields(
        {
            name:
                '🏆 Achievements',

            value: [
                `**Available:** \`${formatNumber(
                    achievements.availableAchievements
                )}\``,

                `**Total Unlocks:** \`${formatNumber(
                    achievements.totalUnlocks
                )}\``,

                `**Members with Achievements:** \`${formatNumber(
                    achievements.soulsWithAchievements
                )}\``,

                '',

                `\`${createProgressBar(
                    achievementParticipation,
                    12
                )}\` **${achievementParticipation}% participation**`,

                '',

                `**First Unlock:** ${
                    formatDiscordDate(
                        achievements.firstUnlockAt,
                        'D'
                    )
                }`,

                `**Latest Unlock:** ${
                    formatDiscordDate(
                        achievements.latestUnlockAt,
                        'R'
                    )
                }`
            ].join('\n'),

            inline: true
        },

        {
            name:
                '🏷️ Chronicle Titles',

            value: [
                `**Available:** \`${formatNumber(
                    titles.availableTitles
                )}\``,

                `**Total Unlocks:** \`${formatNumber(
                    titles.totalUnlocks
                )}\``,

                `**Members with Titles:** \`${formatNumber(
                    titles.soulsWithTitles
                )}\``,

                `**Active Titles:** \`${formatNumber(
                    titles.activeTitles
                )}\``,

                `**Legendary / Mythic:** \`${formatNumber(
                    titles.rareUnlocks
                )}\``,

                '',

                `\`${createProgressBar(
                    titleParticipation,
                    12
                )}\` **${titleParticipation}% participation**`
            ].join('\n'),

            inline: true
        },

        {
            name:
                '🌟 Title Rarity',

            value:
                buildRaritySummary(
                    titleRarities
                ),

            inline: false
        }
    );

    addRecordFields(
        embed,

        recentAchievements.map(
            achievement =>
                formatRecentAchievement(
                    interaction.guild,
                    achievement
                )
        ),

        {
            title:
                '📖 Recent Achievement Unlocks',

            emptyText:
                '🌑 No recent Achievement unlocks are recorded.'
        }
    );

    addRecordFields(
        embed,

        recentTitles.map(
            title =>
                formatRecentTitle(
                    interaction.guild,
                    title
                )
        ),

        {
            title:
                '🏷️ Recent Title Unlocks',

            emptyText:
                '🌑 No recent Title unlocks are recorded.'
        }
    );

    embed.addFields({
        name:
            '🧭 Related Commands',

        value: [
            '`/titles` — view Chronicle Titles',
            '`/leaderboard` — view progression rankings',
            '`/level` — view progression',
            '`/rank` — view current rank'
        ].join('\n'),

        inline: false
    });

    return embed;
}function formatRecentRankAction(
    guild,
    record
) {
    const isRemoval =
        record.action === 'REMOVE';

    return [
        `### ${
            isRemoval
                ? '🌑 Rank Revocation'
                : '⚔️ Rank Assignment'
        }`,

        `**Member:** ${formatMemberMention(
            guild,
            record.userId
        )}`,

        `**Previous:** ${
            record.oldRank ||
            'None'
        }`,

        `**New:** ${
            record.newRank ||
            'No active Rank'
        }`,

        record.moderatorId
            ? `**Staff:** ${formatMemberMention(
                guild,
                record.moderatorId
            )}`
            : '**Staff:** Not recorded',

        `**Reason:** ${
            record.reason ||
            'No reason recorded.'
        }`,

        `**Recorded:** ${
            formatDiscordDate(
                record.createdAt,
                'R'
            )
        }`
    ].join('\n');
}

function getActivityTotal(
    activity
) {
    return Object.values(
        activity ?? {}
    ).reduce(
        (
            total,
            value
        ) =>
            total +
            (
                Number(value) || 0
            ),
        0
    );
}

function buildActivityWindow(
    activity
) {
    return [
        `⭐ **Progression:** \`${formatNumber(
            activity.progressionUpdates
        )}\``,

        `🏆 **Achievements:** \`${formatNumber(
            activity.achievementUnlocks
        )}\``,

        `🏷️ **Titles:** \`${formatNumber(
            activity.titleUnlocks
        )}\``,

        `⚔️ **Rank Actions:** \`${formatNumber(
            activity.rankActions
        )}\``,

        '',

        `**Total:** \`${formatNumber(
            getActivityTotal(
                activity
            )
        )}\``
    ].join('\n');
}

function buildActivityPage(
    context
) {
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
                'Recent progression, Achievement, Title and rank activity.',

            color:
                embedConfig.colors.success
        });

    if (!kingdomStatistics) {
        embed.addFields({
            name:
                '⚠️ Activity Core Unavailable',

            value: [
                'Recent activity could not be loaded.',
                '',
                '-# Check the PostgreSQL connection and runtime logs.'
            ].join('\n'),

            inline: false
        });

        return embed;
    }

    const activity =
        kingdomStatistics.activity ??
        {};

    const last24Hours =
        activity.last24Hours ??
        {};

    const last7Days =
        activity.last7Days ??
        {};

    const recentRanks =
        Array.isArray(
            kingdomStatistics.recentRanks
        )
            ? kingdomStatistics.recentRanks
            : [];

    const total24 =
        getActivityTotal(
            last24Hours
        );

    const total7 =
        getActivityTotal(
            last7Days
        );

    embed.addFields(
        {
            name:
                '🕒 Last 24 Hours',

            value:
                buildActivityWindow(
                    last24Hours
                ),

            inline: true
        },

        {
            name:
                '📅 Last 7 Days',

            value:
                buildActivityWindow(
                    last7Days
                ),

            inline: true
        },

        {
            name:
                '📈 Activity Summary',

            value: [
                total24 > 0
                    ? '🟢 Activity recorded during the last 24 hours.'
                    : '🌑 No new activity recorded during the last 24 hours.',

                '',

                `**24h:** \`${formatNumber(
                    total24
                )}\``,

                `**7d:** \`${formatNumber(
                    total7
                )}\``,

                `**Generated:** ${
                    formatDiscordDate(
                        kingdomStatistics.generatedAt,
                        'R'
                    )
                }`
            ].join('\n'),

            inline: false
        }
    );

    addRecordFields(
        embed,

        recentRanks.map(
            record =>
                formatRecentRankAction(
                    interaction.guild,
                    record
                )
        ),

        {
            title:
                '📜 Recent Rank Actions',

            emptyText:
                [
                    '🌑 No recent rank actions are recorded.',
                    '',
                    '-# Future assignments, changes and revocations will appear here.'
                ].join('\n')
        }
    );

    embed.addFields({
        name:
            '🧭 Detailed Records',

        value: [
            '`/leaderboard` — progression standings',
            '`/rankhistory` — complete rank history',
            '`/titles` — Title collection',
            '`/soul` — personal progression archive'
        ].join('\n'),

        inline: false
    });

    return embed;
}function buildDashboardPage(
    context,
    selectedPage
) {
    const builders = {
        [KINGDOM_PAGES.overview]:
            buildOverviewPage,

        [KINGDOM_PAGES.command]:
            buildHighCommandPage,

        [KINGDOM_PAGES.population]:
            buildPopulationPage,

        [KINGDOM_PAGES.progression]:
            buildProgressionPage,

        [KINGDOM_PAGES.espada]:
            buildRankPage,

        [KINGDOM_PAGES.chronicles]:
            buildChroniclesPage,

        [KINGDOM_PAGES.activity]:
            buildActivityPage
    };

    return (
        builders[selectedPage] ??
        buildOverviewPage
    )(context);
}

async function loadDashboardData(
    guild
) {
    await guild.members
        .fetch()
        .catch(
            () => null
        );

    return kingdomDatabase
        .getKingdomStatistics(
            guild.id,
            {
                leaderboardLimit: 5,
                recentAchievementLimit: 5,
                recentTitleLimit: 5,
                recentRankLimit: 5
            }
        )
        .catch(error => {
            console.error(
                '⚠️ Evelynn Dashboard data load failed:',
                error
            );

            return null;
        });
}

async function sendDashboardError(
    interaction,
    title,
    description
) {
    const embed =
        createErrorEmbed(
            title,
            description
        );

    if (
        interaction.deferred
    ) {
        return interaction.editReply({
            embeds: [embed],
            components: []
        });
    }

    if (
        interaction.replied
    ) {
        return interaction.followUp({
            embeds: [embed],
            flags:
                MessageFlags.Ephemeral
        });
    }

    return interaction.reply({
        embeds: [embed],
        flags:
            MessageFlags.Ephemeral
    });
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
                'Open the TTS server dashboard.'
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
                return sendDashboardError(
                    interaction,
                    '❌ Server Only Command',
                    'The Dashboard can only be opened inside THE Ⅹ SINS.'
                );
            }

            await interaction.deferReply();

            let kingdomStatistics =
                await loadDashboardData(
                    interaction.guild
                );

            let selectedPage =
                KINGDOM_PAGES.overview;

            const getContext = () => ({
                interaction,
                kingdomStatistics
            });

            const message =
                await interaction.editReply({
                    embeds: [
                        buildDashboardPage(
                            getContext(),
                            selectedPage
                        )
                    ],

                    components: [
                        createDashboardMenu(
                            selectedPage
                        )
                    ],

                    fetchReply:
                        true
                });

            const collector =
                message.createMessageComponentCollector({
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
                            return menuInteraction.reply({
                                embeds: [
                                    createErrorEmbed(
                                        '❌ Private Dashboard',
                                        'Only the member who opened this Dashboard can control it.'
                                    )
                                ],

                                flags:
                                    MessageFlags.Ephemeral
                            });
                        }

                        if (
                            menuInteraction.customId !==
                            KINGDOM_MENU_ID
                        ) {
                            return;
                        }

                        const page =
                            menuInteraction.values[0];

                        if (
                            !KINGDOM_PAGE_ORDER.includes(
                                page
                            )
                        ) {
                            return menuInteraction.reply({
                                embeds: [
                                    createErrorEmbed(
                                        '❌ Unknown Dashboard Page',
                                        'Evelynn could not recognize the selected Dashboard page.'
                                    )
                                ],

                                flags:
                                    MessageFlags.Ephemeral
                            });
                        }

                        selectedPage =
                            page;

                        kingdomStatistics =
                            await loadDashboardData(
                                interaction.guild
                            );

                        await menuInteraction.update({
                            embeds: [
                                buildDashboardPage(
                                    getContext(),
                                    selectedPage
                                )
                            ],

                            components: [
                                createDashboardMenu(
                                    selectedPage
                                )
                            ]
                        });
                    } catch (error) {
                        console.error(
                            '❌ Evelynn Dashboard navigation error:',
                            error
                        );

                        if (
                            menuInteraction.replied ||
                            menuInteraction.deferred
                        ) {
                            return menuInteraction
                                .followUp({
                                    embeds: [
                                        createErrorEmbed(
                                            '❌ Dashboard Navigation Failed',
                                            'Evelynn could not open the selected Dashboard page.'
                                        )
                                    ],

                                    flags:
                                        MessageFlags.Ephemeral
                                })
                                .catch(
                                    () => null
                                );
                        }

                        await menuInteraction
                            .reply({
                                embeds: [
                                    createErrorEmbed(
                                        '❌ Dashboard Navigation Failed',
                                        'Evelynn could not open the selected Dashboard page.'
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
                                createDashboardMenu(
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
                '❌ Evelynn /dashboard error:',
                error
            );

            await sendDashboardError(
                interaction,
                '❌ Dashboard Unavailable',
                'Evelynn could not open the TTS Dashboard.'
            ).catch(
                responseError =>
                    console.error(
                        '❌ Dashboard error response failed:',
                        responseError
                    )
            );
        }
    }
};