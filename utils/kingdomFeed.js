const {
    PermissionFlagsBits
} = require('discord.js');

const {
    createEmbed
} = require('./embeds');

const kingdomFeedConfig =
    require('../config/kingdomFeed');

/**
 * Maximum number of Titles displayed
 * in one Kingdom Feed notification.
 */
const MAX_VISIBLE_TITLES =
    10;

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
    style = 'F'
) {
    const date =
        value
            ? (
                value instanceof Date
                    ? value
                    : new Date(
                        value
                    )
            )
            : new Date();

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
 * Check whether one Feed event type
 * is currently enabled.
 *
 * @param {'achievements'|'titles'|'ranks'|'levels'} eventType
 * @returns {boolean}
 */
function isFeedEventEnabled(
    eventType
) {
    if (
        !kingdomFeedConfig.enabled
    ) {
        return false;
    }

    return Boolean(
        kingdomFeedConfig
            .events?.[
                eventType
            ]
    );
}

/**
 * Find the configured Kingdom Feed
 * text channel.
 *
 * Search priority:
 * 1. Configured channel ID
 * 2. Configured channel name
 *
 * @param {import('discord.js').Guild} guild
 * @returns {import('discord.js').GuildTextBasedChannel|null}
 */
function findKingdomFeedChannel(
    guild
) {
    if (
        !guild ||
        !kingdomFeedConfig.enabled
    ) {
        return null;
    }

    const configuredChannelId =
        String(
            kingdomFeedConfig.channelId ||
            ''
        ).trim();

    if (
        configuredChannelId
    ) {
        const channelById =
            guild.channels.cache.get(
                configuredChannelId
            );

        if (
            channelById &&
            channelById.isTextBased() &&
            !channelById.isThread()
        ) {
            return channelById;
        }
    }

    const configuredChannelName =
        String(
            kingdomFeedConfig.channelName ||
            ''
        ).trim();

    if (
        !configuredChannelName
    ) {
        return null;
    }

    return (
        guild.channels.cache.find(
            channel =>
                channel.isTextBased() &&
                !channel.isThread() &&
                channel.name ===
                    configuredChannelName
        ) ||
        null
    );
}

/**
 * Check whether Umbra can send embeds
 * inside the Kingdom Feed channel.
 *
 * @param {import('discord.js').GuildTextBasedChannel} channel
 * @returns {boolean}
 */
function canSendToKingdomFeed(
    channel
) {
    if (
        !channel ||
        !channel.guild
    ) {
        return false;
    }

    const botMember =
        channel.guild.members.me;

    if (!botMember) {
        return false;
    }

    const permissions =
        channel.permissionsFor(
            botMember
        );

    if (!permissions) {
        return false;
    }

    return (
        permissions.has(
            PermissionFlagsBits.ViewChannel
        ) &&
        permissions.has(
            PermissionFlagsBits.SendMessages
        ) &&
        permissions.has(
            PermissionFlagsBits.EmbedLinks
        )
    );
}

/**
 * Create the shared Kingdom Feed Embed.
 *
 * @param {Object} options
 * @param {import('discord.js').Guild} options.guild
 * @param {string} options.title
 * @param {string} options.description
 * @param {string} options.color
 * @param {import('discord.js').User|null} [options.user]
 * @param {Object[]} [options.fields]
 * @returns {import('discord.js').EmbedBuilder}
 */
function createKingdomFeedEmbed({
    guild,
    title,
    description,
    color,
    user = null,
    fields = []
}) {
    const guildIcon =
        guild.iconURL({
            extension:
                'png',

            size:
                1024,

            forceStatic:
                false
        });

    const userAvatar =
        user?.displayAvatarURL({
            extension:
                'png',

            size:
                1024,

            forceStatic:
                false
        }) ||
        null;

    return createEmbed({
        title,

        description:
            [
                description,
                '',
                '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━',
                '',
                '*A new event has been preserved within the eternal chronicles of Las Noches.*'
            ].join('\n'),

        color,

        thumbnail:
            userAvatar ||
            guildIcon,

        author: {
            name:
                `${guild.name} • Kingdom Chronicle`,

            iconURL:
                guildIcon ||
                userAvatar
        },

        fields,

        footer: {
            text:
                kingdomFeedConfig
                    .footer
                    .text
        }
    });
}

/**
 * Send one Embed into the configured
 * Kingdom Feed channel.
 *
 * Feed failures must never interrupt
 * Achievement, Title, Rank or Level logic.
 *
 * @param {import('discord.js').Guild} guild
 * @param {import('discord.js').EmbedBuilder} embed
 * @returns {Promise<boolean>}
 */
async function sendKingdomFeedEmbed(
    guild,
    embed
) {
    try {
        const channel =
            findKingdomFeedChannel(
                guild
            );

        if (!channel) {
            console.warn(
                `⚠️ Kingdom Feed channel was not found in ${guild?.name || 'Unknown Guild'}.`
            );

            return false;
        }

        if (
            !canSendToKingdomFeed(
                channel
            )
        ) {
            console.warn(
                `⚠️ Umbra cannot send Kingdom Feed embeds in #${channel.name}.`
            );

            return false;
        }

        await channel.send({
            embeds: [
                embed
            ]
        });

        return true;
    } catch (error) {
        console.error(
            '❌ Umbra Kingdom Feed send error:',
            error
        );

        return false;
    }
}

/**
 * Normalize one Achievement object.
 *
 * @param {Object|null|undefined} achievement
 * @returns {Object}
 */
function normalizeAchievement(
    achievement
) {
    return {
        id:
            achievement?.achievementId ||
            achievement?.id ||
            'unknown_achievement',

        name:
            achievement?.name ||
            'Unknown Achievement',

        description:
            achievement?.description ||
            'No description was recorded.',

        icon:
            achievement?.icon ||
            '🏆',

        category:
            achievement?.category ||
            'General',

        unlockedAt:
            achievement?.unlockedAt ||
            new Date()
    };
}

/**
 * Normalize one Chronicle Title object.
 *
 * @param {Object|null|undefined} title
 * @returns {Object}
 */
function normalizeTitle(
    title
) {
    return {
        id:
            title?.titleId ||
            title?.id ||
            'unknown_title',

        name:
            title?.name ||
            'Unknown Title',

        displayName:
            title?.displayName ||
            title?.name ||
            'Unknown Chronicle Title',

        description:
            title?.description ||
            'No description was recorded.',

        rarity:
            title?.rarity ||
            'Common',

        category:
            title?.category ||
            'General',

        unlockSource:
            title?.unlockSource ||
            'Unknown Source',

        unlockedAt:
            title?.unlockedAt ||
            new Date()
    };
}

/**
 * Format multiple unlocked Titles.
 *
 * @param {Object[]} titles
 * @returns {string}
 */
function formatUnlockedTitles(
    titles
) {
    const normalizedTitles =
        (
            Array.isArray(
                titles
            )
                ? titles
                : []
        )
            .map(
                normalizeTitle
            );

    if (
        normalizedTitles.length ===
        0
    ) {
        return 'No Chronicle Titles were supplied.';
    }

    const visibleTitles =
        normalizedTitles.slice(
            0,
            MAX_VISIBLE_TITLES
        );

    const lines =
        visibleTitles.map(
            title =>
                [
                    `🏷️ **${title.displayName}**`,
                    `-# ${title.rarity} • ${title.category}`
                ].join('\n')
        );

    const remaining =
        normalizedTitles.length -
        visibleTitles.length;

    if (
        remaining >
        0
    ) {
        lines.push(
            `-# +${formatNumber(remaining)} additional Chronicle Titles`
        );
    }

    return lines.join('\n\n');
}/**
 * Send an Achievement unlock into the
 * public Kingdom Feed.
 *
 * @param {Object} options
 * @param {import('discord.js').GuildMember} options.member
 * @param {Object} options.achievement
 * @param {string|null} [options.source]
 * @returns {Promise<boolean>}
 */
async function sendAchievementFeed({
    member,
    achievement,
    source = null
}) {
    if (
        !member ||
        !isFeedEventEnabled(
            'achievements'
        )
    ) {
        return false;
    }

    const normalizedAchievement =
        normalizeAchievement(
            achievement
        );

    const embed =
        createKingdomFeedEmbed({
            guild:
                member.guild,

            title:
                `${normalizedAchievement.icon} Achievement Unlocked`,

            description:
                `${member} has unlocked a new Soul Chronicle within Las Noches.`,

            color:
                kingdomFeedConfig
                    .colors
                    .achievement,

            user:
                member.user,

            fields: [
                {
                    name:
                        '🌙 Soul',

                    value:
                        `${member}\n` +
                        `\`${member.id}\``,

                    inline:
                        true
                },
                {
                    name:
                        '🏆 Achievement',

                    value:
                        `${normalizedAchievement.icon} **${normalizedAchievement.name}**`,

                    inline:
                        true
                },
                {
                    name:
                        '📚 Category',

                    value:
                        normalizedAchievement.category,

                    inline:
                        true
                },
                {
                    name:
                        '📖 Description',

                    value:
                        normalizedAchievement.description,

                    inline:
                        false
                },
                {
                    name:
                        '🕒 Unlocked At',

                    value:
                        [
                            formatDiscordDate(
                                normalizedAchievement.unlockedAt,
                                'F'
                            ),
                            formatDiscordDate(
                                normalizedAchievement.unlockedAt,
                                'R'
                            )
                        ].join('\n'),

                    inline:
                        true
                },
                {
                    name:
                        '⚙️ Unlock Source',

                    value:
                        source ||
                        'Automatic Soul progression',

                    inline:
                        true
                }
            ]
        });

    return sendKingdomFeedEmbed(
        member.guild,
        embed
    );
}

/**
 * Send newly unlocked Chronicle Titles
 * into the public Kingdom Feed.
 *
 * @param {Object} options
 * @param {import('discord.js').GuildMember} options.member
 * @param {Object[]} options.titles
 * @param {string|null} [options.source]
 * @returns {Promise<boolean>}
 */
async function sendTitleFeed({
    member,
    titles,
    source = null
}) {
    if (
        !member ||
        !isFeedEventEnabled(
            'titles'
        )
    ) {
        return false;
    }

    const safeTitles =
        Array.isArray(
            titles
        )
            ? titles
            : [];

    if (
        safeTitles.length ===
        0
    ) {
        return false;
    }

    const normalizedTitles =
        safeTitles.map(
            normalizeTitle
        );

    const firstTitle =
        normalizedTitles[0];

    const embed =
        createKingdomFeedEmbed({
            guild:
                member.guild,

            title:
                safeTitles.length ===
                1
                    ? '🏷️ Chronicle Title Unlocked'
                    : `🏷️ ${formatNumber(safeTitles.length)} Chronicle Titles Unlocked`,

            description:
                safeTitles.length ===
                1
                    ? `${member} has unlocked a new Chronicle Title.`
                    : `${member} has unlocked multiple Chronicle Titles within Las Noches.`,

            color:
                kingdomFeedConfig
                    .colors
                    .title,

            user:
                member.user,

            fields: [
                {
                    name:
                        '🌙 Soul',

                    value:
                        `${member}\n` +
                        `\`${member.id}\``,

                    inline:
                        true
                },
                {
                    name:
                        '🏷️ Titles Unlocked',

                    value:
                        `\`${formatNumber(safeTitles.length)}\``,

                    inline:
                        true
                },
                {
                    name:
                        '🌟 Highest Visible Rarity',

                    value:
                        firstTitle?.rarity ||
                        'Common',

                    inline:
                        true
                },
                {
                    name:
                        '📜 Chronicle Titles',

                    value:
                        formatUnlockedTitles(
                            normalizedTitles
                        ),

                    inline:
                        false
                },
                {
                    name:
                        '⚙️ Unlock Source',

                    value:
                        source ||
                        firstTitle?.unlockSource ||
                        'Automatic Soul progression',

                    inline:
                        false
                },
                {
                    name:
                        '🕒 Recorded At',

                    value:
                        formatDiscordDate(
                            firstTitle?.unlockedAt,
                            'F'
                        ),

                    inline:
                        false
                }
            ]
        });

    return sendKingdomFeedEmbed(
        member.guild,
        embed
    );
}

/**
 * Determine whether one Rank change
 * represents a promotion or demotion.
 *
 * @param {string|null|undefined} oldRank
 * @param {string|null|undefined} newRank
 * @returns {'promotion'|'demotion'|'assignment'|'change'}
 */
function classifyRankChange(
    oldRank,
    newRank
) {
    if (
        !oldRank &&
        newRank
    ) {
        return 'assignment';
    }

    const rankOrder = [
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

    const oldIndex =
        rankOrder.indexOf(
            oldRank
        );

    const newIndex =
        rankOrder.indexOf(
            newRank
        );

    if (
        oldIndex ===
            -1 ||
        newIndex ===
            -1
    ) {
        return 'change';
    }

    if (
        newIndex <
        oldIndex
    ) {
        return 'promotion';
    }

    if (
        newIndex >
        oldIndex
    ) {
        return 'demotion';
    }

    return 'change';
}

/**
 * Send one Arrancar Rank assignment,
 * change or revocation to Kingdom Feed.
 *
 * @param {Object} options
 * @param {import('discord.js').GuildMember} options.member
 * @param {import('discord.js').User|null} [options.moderator]
 * @param {string|null} [options.oldRank]
 * @param {string|null} [options.newRank]
 * @param {string} options.reason
 * @param {number|string|null} [options.historyId]
 * @param {boolean} [options.revoked]
 * @returns {Promise<boolean>}
 */
async function sendRankFeed({
    member,
    moderator = null,
    oldRank = null,
    newRank = null,
    reason,
    historyId = null,
    revoked = false
}) {
    if (
        !member ||
        !isFeedEventEnabled(
            'ranks'
        )
    ) {
        return false;
    }

    const rankChangeType =
        revoked
            ? 'revocation'
            : classifyRankChange(
                oldRank,
                newRank
            );

    const titleMap = {
        assignment:
            '⚔️ Arrancar Rank Assigned',

        promotion:
            '👑 Arrancar Promotion',

        demotion:
            '⬇️ Arrancar Demotion',

        change:
            '⚔️ Arrancar Rank Changed',

        revocation:
            '🌑 Arrancar Rank Revoked'
    };

    const color =
        rankChangeType ===
        'revocation'
            ? kingdomFeedConfig
                .colors
                .revocation
            : kingdomFeedConfig
                .colors
                .promotion;

    const embed =
        createKingdomFeedEmbed({
            guild:
                member.guild,

            title:
                titleMap[
                    rankChangeType
                ],

            description:
                revoked
                    ? `${member} no longer holds a manually assigned Arrancar Rank.`
                    : `${member} has received a new position within the hierarchy of Las Noches.`,

            color,

            user:
                member.user,

            fields: [
                {
                    name:
                        '🌙 Soul',

                    value:
                        `${member}\n` +
                        `\`${member.id}\``,

                    inline:
                        true
                },
                {
                    name:
                        '👑 High Command',

                    value:
                        moderator
                            ? `${moderator}\n\`${moderator.id}\``
                            : 'Not recorded',

                    inline:
                        true
                },
                {
                    name:
                        '📜 Previous Rank',

                    value:
                        oldRank ||
                        'No previous Rank',

                    inline:
                        true
                },
                {
                    name:
                        revoked
                            ? '🌑 Current Rank'
                            : '⚔️ New Rank',

                    value:
                        revoked
                            ? 'No manually assigned Arrancar Rank'
                            : (
                                newRank ||
                                'Not recorded'
                            ),

                    inline:
                        true
                },
                {
                    name:
                        '🆔 Hierarchy Record',

                    value:
                        historyId
                            ? `\`#${historyId}\``
                            : '`Pending Archive`',

                    inline:
                        true
                },
                {
                    name:
                        '🕒 Recorded At',

                    value:
                        [
                            formatDiscordDate(
                                new Date(),
                                'F'
                            ),
                            formatDiscordDate(
                                new Date(),
                                'R'
                            )
                        ].join('\n'),

                    inline:
                        true
                },
                {
                    name:
                        '📖 Reason',

                    value:
                        reason ||
                        'No reason was provided.',

                    inline:
                        false
                }
            ]
        });

    return sendKingdomFeedEmbed(
        member.guild,
        embed
    );
}

/**
 * Check whether one Level should appear
 * in the public Kingdom Feed.
 *
 * @param {number|string|null|undefined} level
 * @returns {boolean}
 */
function isLevelMilestone(
    level
) {
    const safeLevel =
        Math.max(
            0,
            Math.floor(
                Number(
                    level
                ) ||
                0
            )
        );

    return (
        Array.isArray(
            kingdomFeedConfig
                .levelMilestones
        ) &&
        kingdomFeedConfig
            .levelMilestones
            .includes(
                safeLevel
            )
    );
}

/**
 * Send a major Level milestone into
 * the public Kingdom Feed.
 *
 * @param {Object} options
 * @param {import('discord.js').GuildMember} options.member
 * @param {number} options.previousLevel
 * @param {number} options.newLevel
 * @param {number} options.totalXp
 * @param {number|null} [options.messageCount]
 * @returns {Promise<boolean>}
 */
async function sendLevelFeed({
    member,
    previousLevel,
    newLevel,
    totalXp,
    messageCount = null
}) {
    if (
        !member ||
        !isFeedEventEnabled(
            'levels'
        ) ||
        !isLevelMilestone(
            newLevel
        ) ||
        Number(newLevel) <=
            Number(previousLevel)
    ) {
        return false;
    }

    const embed =
        createKingdomFeedEmbed({
            guild:
                member.guild,

            title:
                `⭐ Level ${formatNumber(newLevel)} Milestone`,

            description:
                `${member} has reached a major Soul Level milestone within Las Noches.`,

            color:
                kingdomFeedConfig
                    .colors
                    .level,

            user:
                member.user,

            fields: [
                {
                    name:
                        '🌙 Soul',

                    value:
                        `${member}\n` +
                        `\`${member.id}\``,

                    inline:
                        true
                },
                {
                    name:
                        '⭐ Previous Level',

                    value:
                        `\`${formatNumber(previousLevel)}\``,

                    inline:
                        true
                },
                {
                    name:
                        '🌕 New Soul Level',

                    value:
                        `\`${formatNumber(newLevel)}\``,

                    inline:
                        true
                },
                {
                    name:
                        '✨ Spiritual Power',

                    value:
                        `\`${formatNumber(totalXp)} XP\``,

                    inline:
                        true
                },
                {
                    name:
                        '💬 Messages Recorded',

                    value:
                        messageCount ===
                            null
                            ? 'Not recorded'
                            : `\`${formatNumber(messageCount)}\``,

                    inline:
                        true
                },
                {
                    name:
                        '🕒 Milestone Reached',

                    value:
                        [
                            formatDiscordDate(
                                new Date(),
                                'F'
                            ),
                            formatDiscordDate(
                                new Date(),
                                'R'
                            )
                        ].join('\n'),

                    inline:
                        false
                }
            ]
        });

    return sendKingdomFeedEmbed(
        member.guild,
        embed
    );
}

module.exports = {
    findKingdomFeedChannel,
    canSendToKingdomFeed,
    isFeedEventEnabled,
    isLevelMilestone,

    sendKingdomFeedEmbed,
    sendAchievementFeed,
    sendTitleFeed,
    sendRankFeed,
    sendLevelFeed
};