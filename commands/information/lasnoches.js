const {
    SlashCommandBuilder,
    MessageFlags,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    ComponentType
} = require('discord.js');

const {
    createEmbed,
    createErrorEmbed
} = require('../../utils/embeds');

const {
    kingdom:
        kingdomDatabase
} = require('../../database');

/**
 * Las Noches silver embed color.
 */
const LAS_NOCHES_COLOR =
    '#E8E8E8';

/**
 * Achievement and leaderboard color.
 */
const ACHIEVEMENT_COLOR =
    '#D4AF37';

/**
 * Visual divider used throughout
 * the Las Noches kingdom panel.
 */
const WIDE_DIVIDER =
    '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━';

/**
 * Button identifiers.
 */
const PAGE_IDS = {
    highCommand:
        'lasnoches_high_command',

    espada:
        'lasnoches_espada',

    population:
        'lasnoches_population',

    achievements:
        'lasnoches_achievements',

    overview:
        'lasnoches_overview'
};

/**
 * Administrative roles displayed
 * inside the Las Noches command.
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
 * automatically by the Level System.
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
 * Find a Discord role using its
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
 * Get non-bot members belonging
 * to a specific role.
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
 * Convert a member list into a
 * readable Discord display.
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
        !Array.isArray(members) ||
        members.length === 0
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

    if (remaining > 0) {
        lines.push(
            `-# +${remaining} additional Souls`
        );
    }

    return lines.join('\n');
}

/**
 * Format a numeric value using
 * readable separators.
 *
 * @param {number|string|null|undefined} value
 * @returns {string}
 */
function formatNumber(
    value
) {
    const numericValue =
        Number(value);

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
 * @param {number|Date|string|null} value
 * @returns {string}
 */
function formatDiscordDate(
    value
) {
    if (!value) {
        return 'Unknown';
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
        return 'Unknown';
    }

    const unixTimestamp =
        Math.floor(
            date.getTime() /
            1000
        );

    return (
        `<t:${unixTimestamp}:D> ` +
        `(<t:${unixTimestamp}:R>)`
    );
}

/**
 * Resolve a database user ID into
 * a readable GuildMember mention.
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
 * Create the navigation button row.
 *
 * Discord allows a maximum of five
 * buttons inside one Action Row.
 *
 * @param {string} activePage
 * @param {boolean} disabled
 * @returns {ActionRowBuilder<ButtonBuilder>}
 */
function createNavigationRow(
    activePage,
    disabled = false
) {
    return new ActionRowBuilder()
        .addComponents(
            new ButtonBuilder()
                .setCustomId(
                    PAGE_IDS.highCommand
                )
                .setLabel(
                    'Command'
                )
                .setEmoji(
                    '👑'
                )
                .setStyle(
                    activePage ===
                    PAGE_IDS.highCommand
                        ? ButtonStyle.Primary
                        : ButtonStyle.Secondary
                )
                .setDisabled(
                    disabled
                ),

            new ButtonBuilder()
                .setCustomId(
                    PAGE_IDS.espada
                )
                .setLabel(
                    'Espada'
                )
                .setEmoji(
                    '⚔️'
                )
                .setStyle(
                    activePage ===
                    PAGE_IDS.espada
                        ? ButtonStyle.Primary
                        : ButtonStyle.Secondary
                )
                .setDisabled(
                    disabled
                ),

            new ButtonBuilder()
                .setCustomId(
                    PAGE_IDS.population
                )
                .setLabel(
                    'Population'
                )
                .setEmoji(
                    '👁️'
                )
                .setStyle(
                    activePage ===
                    PAGE_IDS.population
                        ? ButtonStyle.Primary
                        : ButtonStyle.Secondary
                )
                .setDisabled(
                    disabled
                ),

            new ButtonBuilder()
                .setCustomId(
                    PAGE_IDS.achievements
                )
                .setLabel(
                    'Records'
                )
                .setEmoji(
                    '🏆'
                )
                .setStyle(
                    activePage ===
                    PAGE_IDS.achievements
                        ? ButtonStyle.Primary
                        : ButtonStyle.Secondary
                )
                .setDisabled(
                    disabled
                ),

            new ButtonBuilder()
                .setCustomId(
                    PAGE_IDS.overview
                )
                .setLabel(
                    'Overview'
                )
                .setEmoji(
                    '📊'
                )
                .setStyle(
                    activePage ===
                    PAGE_IDS.overview
                        ? ButtonStyle.Primary
                        : ButtonStyle.Secondary
                )
                .setDisabled(
                    disabled
                )
        );
}

/**
 * Create the shared base embed.
 *
 * @param {import('discord.js').ChatInputCommandInteraction} interaction
 * @param {string} title
 * @param {string} pageDescription
 * @param {string} color
 * @returns {import('discord.js').EmbedBuilder}
 */
function createKingdomEmbed(
    interaction,
    title,
    pageDescription,
    color = LAS_NOCHES_COLOR
) {
    const guildIcon =
        interaction.guild.iconURL({
            size:
                1024,

            forceStatic:
                false
        });

    const botAvatar =
        interaction.client.user
            .displayAvatarURL({
                size:
                    1024,

                forceStatic:
                    false
            });

    const embed =
        createEmbed({
            title,

            description:
                [
                    pageDescription,
                    '',
                    WIDE_DIVIDER,
                    '',
                    '*Every Soul and throne is preserved beneath the eternal moon of Las Noches.*'
                ].join('\n'),

            color,

            thumbnail:
                guildIcon ??
                botAvatar,

            footer: {
                text:
                    `🌙 Umbra • Guardian of Las Noches • Opened by ${interaction.user.username}`,

                iconURL:
                    interaction.client.user
                        .displayAvatarURL({
                            size:
                                128,

                            forceStatic:
                                false
                        })
            }
        });

    embed.setAuthor({
        name:
            `${interaction.guild.name} • Central Kingdom Records`,

        iconURL:
            guildIcon ??
            botAvatar
    });

    return embed;
}/**
 * Build the High Command page.
 *
 * @param {import('discord.js').ChatInputCommandInteraction} interaction
 * @returns {import('discord.js').EmbedBuilder}
 */
function buildHighCommandPage(
    interaction
) {
    const embed =
        createKingdomEmbed(
            interaction,
            '👑 High Command of Las Noches',
            'Umbra has opened the official leadership records of the eternal kingdom.'
        );

    const owner =
        interaction.guild.members.cache.get(
            interaction.guild.ownerId
        );

    embed.addFields({
        name:
            '👑 Ruler of Las Noches',

        value:
            owner
                ? [
                    `${owner}`,
                    `-# ${owner.user.tag}`,
                    `-# Soul ID: ${owner.id}`
                ].join('\n')
                : '🌑 The ruler could not be located.',

        inline:
            false
    });

    for (
        const roleName
        of STAFF_ROLES
    ) {
        const role =
            findGuildRole(
                interaction.guild,
                roleName
            );

        if (!role) {
            embed.addFields({
                name:
                    roleName,

                value:
                    [
                        '⚠️ Role Missing',
                        '-# Umbra could not locate this administrative role.'
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

        embed.addFields({
            name:
                roleName,

            value:
                formatMemberList(
                    members,
                    '🌑 Vacant',
                    10
                ),

            inline:
                false
        });
    }

    const leadershipIds =
        new Set();

    if (owner) {
        leadershipIds.add(
            owner.id
        );
    }

    for (
        const roleName
        of STAFF_ROLES
    ) {
        const role =
            findGuildRole(
                interaction.guild,
                roleName
            );

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
    }

    embed.addFields({
        name:
            '📊 High Command Status',

        value:
            [
                `👑 **Recognized Leaders:** \`${leadershipIds.size}\``,
                `⚜️ **Administrative Divisions:** \`${STAFF_ROLES.length + 1}\``,
                '',
                '-# Lieutenants may moderate members, but they cannot manage the Arrancar Rank hierarchy.'
            ].join('\n'),

        inline:
            false
    });

    return embed;
}

/**
 * Build the Espada hierarchy page.
 *
 * @param {import('discord.js').ChatInputCommandInteraction} interaction
 * @returns {import('discord.js').EmbedBuilder}
 */
function buildEspadaPage(
    interaction
) {
    const embed =
        createKingdomEmbed(
            interaction,
            '⚔️ Espada Throne Records',
            'Umbra has opened the official hierarchy of the strongest Arrancar in Las Noches.'
        );

    let occupiedPositions =
        0;

    let missingRoles =
        0;

    const uniqueEspada =
        new Set();

    for (
        const roleName
        of ESPADA_ROLES
    ) {
        const role =
            findGuildRole(
                interaction.guild,
                roleName
            );

        if (!role) {
            missingRoles +=
                1;

            embed.addFields({
                name:
                    roleName,

                value:
                    [
                        '⚠️ Role Missing',
                        '-# Create this Discord role using the exact configured name.'
                    ].join('\n'),

                inline:
                    true
            });

            continue;
        }

        const members =
            getHumanRoleMembers(
                role
            );

        if (
            members.length === 0
        ) {
            embed.addFields({
                name:
                    roleName,

                value:
                    [
                        '🌑 Vacant',
                        '-# This throne awaits a worthy Soul.'
                    ].join('\n'),

                inline:
                    true
            });

            continue;
        }

        occupiedPositions +=
            1;

        for (
            const member
            of members
        ) {
            uniqueEspada.add(
                member.id
            );
        }

        if (
            members.length === 1
        ) {
            const holder =
                members[0];

            embed.addFields({
                name:
                    roleName,

                value:
                    [
                        `${holder}`,
                        `-# ${holder.user.tag}`,
                        `-# Soul ID: ${holder.id}`
                    ].join('\n'),

                inline:
                    true
            });

            continue;
        }

        embed.addFields({
            name:
                roleName,

            value:
                [
                    `⚠️ **${members.length} holders detected**`,
                    '',
                    formatMemberList(
                        members,
                        '🌑 Vacant',
                        5
                    ),
                    '',
                    '-# Only one Soul should hold each Espada position.'
                ].join('\n'),

            inline:
                true
        });
    }

    const vacantPositions =
        ESPADA_ROLES.length -
        occupiedPositions -
        missingRoles;

    embed.addFields({
        name:
            '📊 Espada Hierarchy Status',

        value:
            [
                `⚔️ **Active Espada Souls:** \`${uniqueEspada.size}\``,
                `👑 **Occupied Thrones:** \`${occupiedPositions} / ${ESPADA_ROLES.length}\``,
                `🌑 **Vacant Thrones:** \`${Math.max(0, vacantPositions)}\``,
                `⚠️ **Missing Roles:** \`${missingRoles}\``
            ].join('\n'),

        inline:
            false
    });

    return embed;
}

/**
 * Build the population page.
 *
 * @param {import('discord.js').ChatInputCommandInteraction} interaction
 * @returns {import('discord.js').EmbedBuilder}
 */
function buildPopulationPage(
    interaction
) {
    const embed =
        createKingdomEmbed(
            interaction,
            '👁️ Population of Las Noches',
            'Umbra has opened the spiritual population records of every evolution and Arrancar class.'
        );

    const evolutionLines = [];

    const evolutionMemberIds =
        new Set();

    let missingEvolutionRoles =
        0;

    for (
        const roleName
        of HOLLOW_EVOLUTION_ROLES
    ) {
        const role =
            findGuildRole(
                interaction.guild,
                roleName
            );

        if (!role) {
            missingEvolutionRoles +=
                1;

            evolutionLines.push(
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
            evolutionMemberIds.add(
                member.id
            );
        }

        evolutionLines.push(
            `**${roleName}:** \`${members.length}\``
        );
    }

    const hierarchyLines = [];

    const hierarchyMemberIds =
        new Set();

    let missingHierarchyRoles =
        0;

    for (
        const roleName
        of ARRANCAR_HIERARCHY_ROLES
    ) {
        const role =
            findGuildRole(
                interaction.guild,
                roleName
            );

        if (!role) {
            missingHierarchyRoles +=
                1;

            hierarchyLines.push(
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
            hierarchyMemberIds.add(
                member.id
            );
        }

        hierarchyLines.push(
            `**${roleName}:** \`${members.length}\``
        );
    }

    const espadaMemberIds =
        new Set();

    for (
        const roleName
        of ESPADA_ROLES
    ) {
        const role =
            findGuildRole(
                interaction.guild,
                roleName
            );

        const members =
            getHumanRoleMembers(
                role
            );

        for (
            const member
            of members
        ) {
            espadaMemberIds.add(
                member.id
            );
        }
    }

    embed.addFields(
        {
            name:
                '👁️ Hollow Evolution',

            value:
                evolutionLines.join(
                    '\n'
                ),

            inline:
                true
        },
        {
            name:
                '🌙 Arrancar Hierarchy',

            value:
                hierarchyLines.join(
                    '\n'
                ),

            inline:
                true
        },
        {
            name:
                '📊 Spiritual Census',

            value:
                [
                    `👥 **Evolution Records:** \`${evolutionMemberIds.size}\` unique Souls`,
                    `⚔️ **Manual Hierarchy Records:** \`${hierarchyMemberIds.size}\` unique Souls`,
                    `👑 **Espada Souls:** \`${espadaMemberIds.size}\``,
                    '',
                    `⚠️ **Missing Evolution Roles:** \`${missingEvolutionRoles}\``,
                    `⚠️ **Missing Hierarchy Roles:** \`${missingHierarchyRoles}\``,
                    '',
                    '-# Evolution and Arrancar Rank are independent systems, so one Soul may appear in both records.'
                ].join('\n'),

            inline:
                false
        }
    );

    return embed;
}/**
 * Build one Level leaderboard display.
 *
 * @param {import('discord.js').Guild} guild
 * @param {Object[]} leaderboard
 * @returns {string}
 */
function buildLevelLeaderboardDisplay(
    guild,
    leaderboard
) {
    if (
        !Array.isArray(leaderboard) ||
        leaderboard.length === 0
    ) {
        return [
            '🌑 No Soul Level records are available yet.',
            '-# Activity will appear after Souls begin earning XP.'
        ].join('\n');
    }

    return leaderboard
        .map(
            record => {
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
                                : `\`#${position}\``;

                return [
                    `${medal} ${formatSoulMention(guild, record.userId)}`,
                    `-# Level ${formatNumber(record.level)} • ${formatNumber(record.xp)} XP`
                ].join('\n');
            }
        )
        .join('\n\n');
}

/**
 * Build the message activity leaderboard.
 *
 * @param {import('discord.js').Guild} guild
 * @param {Object[]} leaderboard
 * @returns {string}
 */
function buildMessageLeaderboardDisplay(
    guild,
    leaderboard
) {
    if (
        !Array.isArray(leaderboard) ||
        leaderboard.length === 0
    ) {
        return [
            '🌑 No message activity has been recorded yet.',
            '-# Umbra will update this archive as Souls speak within Las Noches.'
        ].join('\n');
    }

    return leaderboard
        .map(
            record => {
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
                                : `\`#${position}\``;

                return [
                    `${medal} ${formatSoulMention(guild, record.userId)}`,
                    `-# ${formatNumber(record.messageCount)} messages • Level ${formatNumber(record.level)}`
                ].join('\n');
            }
        )
        .join('\n\n');
}

/**
 * Build the Achievement leaderboard.
 *
 * @param {import('discord.js').Guild} guild
 * @param {Object[]} leaderboard
 * @returns {string}
 */
function buildAchievementLeaderboardDisplay(
    guild,
    leaderboard
) {
    if (
        !Array.isArray(leaderboard) ||
        leaderboard.length === 0
    ) {
        return [
            '🌑 No Soul Chronicles have been unlocked yet.',
            '-# Achievement standings will appear after the first Chronicle is recorded.'
        ].join('\n');
    }

    return leaderboard
        .map(
            record => {
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
                                : `\`#${position}\``;

                return [
                    `${medal} ${formatSoulMention(guild, record.userId)}`,
                    `-# ${formatNumber(record.achievementCount)} Chronicles recorded`
                ].join('\n');
            }
        )
        .join('\n\n');
}

/**
 * Build the most recently unlocked
 * Kingdom Achievement records.
 *
 * @param {import('discord.js').Guild} guild
 * @param {Object[]} recentAchievements
 * @returns {string}
 */
function buildRecentAchievementDisplay(
    guild,
    recentAchievements
) {
    if (
        !Array.isArray(recentAchievements) ||
        recentAchievements.length === 0
    ) {
        return [
            '📖 No recent Soul Chronicles are available.',
            '-# New unlocks will be preserved here automatically.'
        ].join('\n');
    }

    return recentAchievements
        .map(
            achievement => {
                const icon =
                    achievement.icon ||
                    '🏆';

                const name =
                    achievement.name ||
                    'Unknown Chronicle';

                const unlockedAt =
                    formatDiscordDate(
                        achievement.unlockedAt
                    );

                return [
                    `${icon} **${name}**`,
                    `${formatSoulMention(guild, achievement.userId)}`,
                    `-# ${achievement.description || 'No description available.'}`,
                    `-# Recorded ${unlockedAt}`
                ].join('\n');
            }
        )
        .join(
            '\n\n━━━━━━━━━━━━━━━━━━━━\n\n'
        );
}

/**
 * Build the Kingdom Records and
 * leaderboard page using PostgreSQL.
 *
 * @param {import('discord.js').ChatInputCommandInteraction} interaction
 * @param {Object|null} kingdomStatistics
 * @returns {import('discord.js').EmbedBuilder}
 */
function buildAchievementsPage(
    interaction,
    kingdomStatistics
) {
    const embed =
        createKingdomEmbed(
            interaction,
            '🏆 Kingdom Records of Las Noches',
            'Umbra has opened the progression, activity and Achievement records preserved within PostgreSQL.',
            ACHIEVEMENT_COLOR
        );

    if (!kingdomStatistics) {
        embed.addFields({
            name:
                '⚠️ Kingdom Core Unavailable',

            value:
                [
                    'Umbra could not load the Kingdom statistics database.',
                    '',
                    '-# The remaining Las Noches pages are still available.'
                ].join('\n'),

            inline:
                false
        });

        return embed;
    }

    const progression =
        kingdomStatistics.progression || {};

    const achievements =
        kingdomStatistics.achievements || {};

    const ranks =
        kingdomStatistics.ranks || {};

    const rankHistory =
        kingdomStatistics.rankHistory || {};

    const leaderboards =
        kingdomStatistics.leaderboards || {};

    const levelLeaderboard =
        Array.isArray(
            leaderboards.levels
        )
            ? leaderboards.levels
            : [];

    const messageLeaderboard =
        Array.isArray(
            leaderboards.messages
        )
            ? leaderboards.messages
            : [];

    const achievementLeaderboard =
        Array.isArray(
            leaderboards.achievements
        )
            ? leaderboards.achievements
            : [];

    const recentAchievements =
        Array.isArray(
            kingdomStatistics.recentAchievements
        )
            ? kingdomStatistics.recentAchievements
            : [];

    const averageLevel =
        Number(
            progression.averageLevel || 0
        ).toFixed(
            1
        );

    embed.addFields(
        {
            name:
                '⭐ Highest Spiritual Power',

            value:
                buildLevelLeaderboardDisplay(
                    interaction.guild,
                    levelLeaderboard
                ),

            inline:
                false
        },
        {
            name:
                '💬 Most Active Souls',

            value:
                buildMessageLeaderboardDisplay(
                    interaction.guild,
                    messageLeaderboard
                ),

            inline:
                false
        },
        {
            name:
                '🏆 Most Soul Chronicles',

            value:
                buildAchievementLeaderboardDisplay(
                    interaction.guild,
                    achievementLeaderboard
                ),

            inline:
                false
        },
        {
            name:
                '📖 Recently Recorded Chronicles',

            value:
                buildRecentAchievementDisplay(
                    interaction.guild,
                    recentAchievements
                ),

            inline:
                false
        },
        {
            name:
                '🌙 Kingdom Progression',

            value:
                [
                    `👥 **Registered Soul Records:** \`${formatNumber(progression.registeredSouls)}\``,
                    `⭐ **Highest Soul Level:** \`${formatNumber(progression.highestLevel)}\``,
                    `✨ **Highest Spiritual Power:** \`${formatNumber(progression.highestXp)} XP\``,
                    `📊 **Average Soul Level:** \`${averageLevel}\``,
                    `🌌 **Total Kingdom XP:** \`${formatNumber(progression.totalXp)}\``,
                    `💬 **Total Messages Recorded:** \`${formatNumber(progression.totalMessages)}\``
                ].join('\n'),

            inline:
                false
        },
        {
            name:
                '🏅 Achievement Archive',

            value:
                [
                    `📚 **Available Achievements:** \`${formatNumber(achievements.availableAchievements)}\``,
                    `🏆 **Total Chronicle Unlocks:** \`${formatNumber(achievements.totalUnlocks)}\``,
                    `🌙 **Souls with Achievements:** \`${formatNumber(achievements.soulsWithAchievements)}\``
                ].join('\n'),

            inline:
                true
        },
        {
            name:
                '⚔️ Hierarchy Archive',

            value:
                [
                    `👑 **Active Ranked Souls:** \`${formatNumber(ranks.activeRankedSouls)}\``,
                    `⚔️ **Active Espada:** \`${formatNumber(ranks.activeEspada)}\``,
                    `🌘 **Privaron Espada:** \`${formatNumber(ranks.privaronEspada)}\``,
                    `⚔️ **Fracción:** \`${formatNumber(ranks.fraccion)}\``,
                    `🦴 **Numeros:** \`${formatNumber(ranks.numeros)}\``,
                    `⚪ **Unranked Arrancar:** \`${formatNumber(ranks.unrankedArrancar)}\``
                ].join('\n'),

            inline:
                true
        },
        {
            name:
                '📜 Rank History Records',

            value:
                [
                    `📚 **Total Records:** \`${formatNumber(rankHistory.totalRankRecords)}\``,
                    `🏅 **Assignments:** \`${formatNumber(rankHistory.rankAssignments)}\``,
                    `🌑 **Removals:** \`${formatNumber(rankHistory.rankRemovals)}\``,
                    '',
                    '**Latest Hierarchy Action:**',
                    formatDiscordDate(
                        rankHistory.latestRankActionAt
                    )
                ].join('\n'),

            inline:
                false
        }
    );

    return embed;
}

/**
 * Build the kingdom overview page.
 *
 * @param {import('discord.js').ChatInputCommandInteraction} interaction
 * @returns {import('discord.js').EmbedBuilder}
 */
function buildOverviewPage(
    interaction
) {
    const embed =
        createKingdomEmbed(
            interaction,
            '📊 Las Noches Kingdom Overview',
            'Umbra has opened the central statistics and structural records of the kingdom.'
        );

    const humanMembers =
        interaction.guild.members.cache.filter(
            member =>
                !member.user.bot
        );

    const botMembers =
        interaction.guild.members.cache.filter(
            member =>
                member.user.bot
        );

    const textChannels =
        interaction.guild.channels.cache.filter(
            channel =>
                channel.isTextBased() &&
                !channel.isThread()
        );

    const voiceChannels =
        interaction.guild.channels.cache.filter(
            channel =>
                channel.isVoiceBased()
        );

    const categories =
        interaction.guild.channels.cache.filter(
            channel =>
                channel.type === 4
        );

    const activeEspadaIds =
        new Set();

    let occupiedEspadaPositions =
        0;

    for (
        const roleName
        of ESPADA_ROLES
    ) {
        const role =
            findGuildRole(
                interaction.guild,
                roleName
            );

        const members =
            getHumanRoleMembers(
                role
            );

        if (
            members.length >
            0
        ) {
            occupiedEspadaPositions +=
                1;
        }

        for (
            const member
            of members
        ) {
            activeEspadaIds.add(
                member.id
            );
        }
    }

    const owner =
        interaction.guild.members.cache.get(
            interaction.guild.ownerId
        );

    embed.addFields(
        {
            name:
                '🌙 Kingdom Identity',

            value:
                [
                    `**Kingdom Name:** ${interaction.guild.name}`,
                    `**Kingdom ID:** \`${interaction.guild.id}\``,
                    `**Ruler:** ${owner || 'Unknown'}`,
                    `**Established:** ${formatDiscordDate(interaction.guild.createdTimestamp)}`
                ].join('\n'),

            inline:
                false
        },
        {
            name:
                '👥 Population',

            value:
                [
                    `**Total Members:** \`${interaction.guild.memberCount}\``,
                    `**Registered Souls:** \`${humanMembers.size}\``,
                    `**Guardians and Bots:** \`${botMembers.size}\``
                ].join('\n'),

            inline:
                true
        },
        {
            name:
                '🏰 Kingdom Structure',

            value:
                [
                    `**Categories:** \`${categories.size}\``,
                    `**Text Channels:** \`${textChannels.size}\``,
                    `**Voice Channels:** \`${voiceChannels.size}\``,
                    `**Roles:** \`${Math.max(0, interaction.guild.roles.cache.size - 1)}\``
                ].join('\n'),

            inline:
                true
        },
        {
            name:
                '⚔️ Espada Status',

            value:
                [
                    `**Active Espada Souls:** \`${activeEspadaIds.size}\``,
                    `**Occupied Thrones:** \`${occupiedEspadaPositions} / ${ESPADA_ROLES.length}\``,
                    `**Vacant Thrones:** \`${ESPADA_ROLES.length - occupiedEspadaPositions}\``
                ].join('\n'),

            inline:
                false
        }
    );

    return embed;
}

/**
 * Build the requested Las Noches page.
 *
 * @param {import('discord.js').ChatInputCommandInteraction} interaction
 * @param {string} pageId
 * @param {Object|null} kingdomStatistics
 * @returns {import('discord.js').EmbedBuilder}
 */
function buildPage(
    interaction,
    pageId,
    kingdomStatistics
) {
    switch (pageId) {
        case PAGE_IDS.espada:
            return buildEspadaPage(
                interaction
            );

        case PAGE_IDS.population:
            return buildPopulationPage(
                interaction
            );

        case PAGE_IDS.achievements:
            return buildAchievementsPage(
                interaction,
                kingdomStatistics
            );

        case PAGE_IDS.overview:
            return buildOverviewPage(
                interaction
            );

        case PAGE_IDS.highCommand:
        default:
            return buildHighCommandPage(
                interaction
            );
    }
}module.exports = {
    category:
        'information',

    data:
        new SlashCommandBuilder()
            .setName(
                'lasnoches'
            )
            .setDescription(
                'Open the central kingdom records of Las Noches.'
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
                            'This command can only be used inside Las Noches.'
                        )
                    ],

                    flags:
                        MessageFlags.Ephemeral
                });

                return;
            }

            await interaction.deferReply();

            /*
             * Refresh members so role statistics,
             * staff lists and population records
             * are as current as possible.
             */
            await interaction.guild.members
                .fetch()
                .catch(
                    () => null
                );

            /*
             * Kingdom Core is optional for the
             * four Discord-based pages.
             *
             * If PostgreSQL statistics fail,
             * the panel still opens and only
             * the Records page shows a warning.
             */
            const kingdomStatistics =
                await kingdomDatabase
                    .getKingdomStatistics(
                        interaction.guild.id,
                        {
                            leaderboardLimit:
                                5,

                            recentAchievementLimit:
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

            let activePage =
                PAGE_IDS.highCommand;

            const initialEmbed =
                buildPage(
                    interaction,
                    activePage,
                    kingdomStatistics
                );

            const replyMessage =
                await interaction.editReply({
                    embeds: [
                        initialEmbed
                    ],

                    components: [
                        createNavigationRow(
                            activePage
                        )
                    ],

                    fetchReply:
                        true
                });

            const collector =
                replyMessage.createMessageComponentCollector({
                    componentType:
                        ComponentType.Button,

                    time:
                        5 * 60 * 1000
                });

            collector.on(
                'collect',
                async buttonInteraction => {
                    try {
                        if (
                            buttonInteraction.user.id !==
                            interaction.user.id
                        ) {
                            await buttonInteraction.reply({
                                embeds: [
                                    createErrorEmbed(
                                        '❌ Private Kingdom Panel',
                                        'Only the Soul who opened this Las Noches panel may control its navigation.'
                                    )
                                ],

                                flags:
                                    MessageFlags.Ephemeral
                            });

                            return;
                        }

                        if (
                            !Object.values(
                                PAGE_IDS
                            ).includes(
                                buttonInteraction.customId
                            )
                        ) {
                            return;
                        }

                        activePage =
                            buttonInteraction.customId;

                        const updatedEmbed =
                            buildPage(
                                interaction,
                                activePage,
                                kingdomStatistics
                            );

                        await buttonInteraction.update({
                            embeds: [
                                updatedEmbed
                            ],

                            components: [
                                createNavigationRow(
                                    activePage
                                )
                            ]
                        });
                    } catch (buttonError) {
                        console.error(
                            '❌ Umbra Las Noches navigation error:',
                            buttonError
                        );

                        const navigationErrorEmbed =
                            createErrorEmbed(
                                '❌ Navigation Failed',
                                'Umbra could not open the selected kingdom record page.'
                            );

                        if (
                            buttonInteraction.deferred ||
                            buttonInteraction.replied
                        ) {
                            await buttonInteraction
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

                        await buttonInteraction
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
                async () => {
                    await interaction
                        .editReply({
                            components: [
                                createNavigationRow(
                                    activePage,
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
                    '❌ Kingdom Records Unavailable',
                    [
                        'Umbra could not open the central records of Las Noches.',
                        '',
                        'Please inspect the Northflank logs and verify the PostgreSQL connection and configured kingdom roles.'
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