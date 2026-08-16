const {
    PermissionFlagsBits
} = require('discord.js');

const {
    createEmbed
} = require('./embeds');

const kingdomFeedConfig =
    require('../config/kingdomFeed');

const rankConfig =
    require('../config/ranks');

const MAX_VISIBLE_TITLES =
    10;

/**
 * Format a number.
 *
 * @param {number|string|null|undefined} value
 * @returns {string}
 */
function formatNumber(
    value
) {
    const number =
        Number(
            value
        );

    return Number.isFinite(
        number
    )
        ? number.toLocaleString(
            'en-US'
        )
        : '0';
}

/**
 * Check whether a feed event
 * is enabled.
 *
 * @param {'achievements'|'titles'|'ranks'|'levels'} eventType
 * @returns {boolean}
 */
function isFeedEventEnabled(
    eventType
) {
    return Boolean(
        kingdomFeedConfig.enabled &&
        kingdomFeedConfig
            .events?.[
                eventType
            ]
    );
}

/**
 * Find the configured feed channel.
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

    const channelId =
        String(
            kingdomFeedConfig.channelId ||
            ''
        ).trim();

    if (channelId) {
        const channel =
            guild.channels.cache.get(
                channelId
            );

        if (
            channel?.isTextBased() &&
            !channel.isThread()
        ) {
            return channel;
        }
    }

    const channelName =
        String(
            kingdomFeedConfig.channelName ||
            ''
        ).trim();

    if (!channelName) {
        return null;
    }

    return (
        guild.channels.cache.find(
            channel =>
                channel.isTextBased() &&
                !channel.isThread() &&
                channel.name ===
                    channelName
        ) ||
        null
    );
}

/**
 * Check whether the bot can
 * publish to the feed.
 *
 * @param {import('discord.js').GuildTextBasedChannel} channel
 * @returns {boolean}
 */
function canSendToKingdomFeed(
    channel
) {
    const botMember =
        channel?.guild?.members.me;

    if (!botMember) {
        return false;
    }

    const permissions =
        channel.permissionsFor(
            botMember
        );

    return Boolean(
        permissions?.has([
            PermissionFlagsBits.ViewChannel,
            PermissionFlagsBits.SendMessages,
            PermissionFlagsBits.EmbedLinks
        ])
    );
}

/**
 * Create a shared TTS feed embed.
 *
 * @param {Object} options
 * @param {import('discord.js').Guild} options.guild
 * @param {string} options.title
 * @param {string} options.description
 * @param {string} options.color
 * @param {import('discord.js').User|null} [options.user]
 * @param {Object[]} [options.fields]
 * @returns {import/**
 * Send an embed to the feed.
 *
 * Feed failures never interrupt
 * progression systems.
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
                `⚠️ Progression feed channel not found in ${guild?.name || 'Unknown Server'}.`
            );

            return false;
        }

        if (
            !canSendToKingdomFeed(
                channel
            )
        ) {
            console.warn(
                `⚠️ Evelynn cannot publish in #${channel.name}.`
            );

            return false;
        }

        await channel.send({
            embeds: [
                embed
            ],

            allowedMentions: {
                parse:
                    []
            }
        });

        return true;
    } catch (error) {
        console.error(
            '❌ Progression feed error:',
            error
        );

        return false;
    }
}

/**
 * Normalize an Achievement.
 *
 * @param {Object|null|undefined} achievement
 * @returns {Object}
 */
function normalizeAchievement(
    achievement
) {
    return {
        name:
            achievement?.name ||
            'Unknown Achievement',

        description:
            achievement?.description ||
            'No description available.',

        icon:
            achievement?.icon ||
            '🏆',

        category:
            achievement?.category ||
            'General'
    };
}

/**
 * Normalize a Title.
 *
 * @param {Object|null|undefined} title
 * @returns {Object}
 */
function normalizeTitle(
    title
) {
    return {
        displayName:
            title?.displayName ||
            title?.name ||
            'Unknown Title',

        rarity:
            title?.rarity ||
            'Common',

        category:
            title?.category ||
            'General'
    };
}

/**
 * Format unlocked Titles.
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
        ).map(
            normalizeTitle
        );

    if (
        normalizedTitles.length ===
        0
    ) {
        return 'No Titles available.';
    }

    const visibleTitles =
        normalizedTitles.slice(
            0,
            MAX_VISIBLE_TITLES
        );

    const lines =
        visibleTitles.map(
            title =>
                `◆ **${title.displayName}** — ${title.rarity}`
        );

    const remaining =
        normalizedTitles.length -
        visibleTitles.length;

    if (
        remaining >
        0
    ) {
        lines.push(
            `+${formatNumber(remaining)} more`
        );
    }

    return lines.join(
        '\n'
    );
}

/**
 * Format a configured Sin Rank name.
 *
 * @param {string|null|undefined} rank
 * @returns {string}
 */
function formatRankName(
    rank
) {
    if (!rank) {
        return 'Unranked';
    }

    const configuredRank =
        Object.values(
            rankConfig.hierarchy
        ).find(
            rankDetails =>
                rankDetails.name ===
                rank
        );

    return (
        configuredRank?.name ||
        String(
            rank
        )
    );
}/**
 * Send an Achievement notification.
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
                `${normalizedAchievement.icon}・ACHIEVEMENT UNLOCKED`,

            description:
                `${member} unlocked **${normalizedAchievement.name}**.`,

            color:
                kingdomFeedConfig
                    .colors
                    .achievement,

            user:
                member.user,

            fields: [
                {
                    name:
                        '🏆・ACHIEVEMENT',

                    value:
                        [
                            `**${normalizedAchievement.name}**`,
                            normalizedAchievement.description
                        ].join('\n'),

                    inline:
                        false
                },

                {
                    name:
                        '◆・CATEGORY',

                    value:
                        normalizedAchievement.category,

                    inline:
                        true
                },

                {
                    name:
                        '⚙️・SOURCE',

                    value:
                        source ||
                        'Automatic progression',

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
 * Send newly unlocked Titles.
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

    const embed =
        createKingdomFeedEmbed({
            guild:
                member.guild,

            title:
                safeTitles.length ===
                1
                    ? '♜・TITLE UNLOCKED'
                    : `♜・${formatNumber(
                        safeTitles.length
                    )} TITLES UNLOCKED`,

            description:
                safeTitles.length ===
                1
                    ? `${member} earned a new Title.`
                    : `${member} earned multiple Titles.`,

            color:
                kingdomFeedConfig
                    .colors
                    .title,

            user:
                member.user,

            fields: [
                {
                    name:
                        '♜・TITLES',

                    value:
                        formatUnlockedTitles(
                            normalizedTitles
                        ),

                    inline:
                        false
                },

                {
                    name:
                        '⚙️・SOURCE',

                    value:
                        source ||
                        'Automatic progression',

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
 * Determine the type of
 * one Rank change.
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

    const rankOrder =
        Object.values(
            rankConfig.hierarchy
        )
            .map(
                rankDetails =>
                    rankDetails.name
            )
            .filter(
                rankName =>
                    rankName !==
                    rankConfig.hierarchy
                        .unranked
                        .name
            );

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
}/**
 * Send a Sin Rank change.
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

    const changeType =
        revoked
            ? 'revocation'
            : classifyRankChange(
                oldRank,
                newRank
            );

    const titles = {
        assignment:
            '⚔️・SIN RANK ASSIGNED',

        promotion:
            '♛・SIN PROMOTION',

        demotion:
            '⬇️・SIN DEMOTION',

        change:
            '⚔️・SIN RANK CHANGED',

        revocation:
            '◇・SIN RANK REMOVED'
    };

    const color =
        changeType ===
        'revocation'
            ? kingdomFeedConfig
                .colors
                .revocation
            : kingdomFeedConfig
                .colors
                .promotion;

    const fields = [
        {
            name:
                '✦・MEMBER',

            value:
                `${member}`,

            inline:
                true
        },

        {
            name:
                '♛・STAFF',

            value:
                moderator
                    ? `${moderator}`
                    : 'Not recorded',

            inline:
                true
        },

        {
            name:
                '⚔️・PREVIOUS',

            value:
                formatRankName(
                    oldRank
                ),

            inline:
                true
        },

        {
            name:
                revoked
                    ? '◇・CURRENT'
                    : 'Ⅹ・NEW RANK',

            value:
                revoked
                    ? 'Unranked'
                    : formatRankName(
                        newRank
                    ),

            inline:
                true
        },

        {
            name:
                '📜・REASON',

            value:
                reason ||
                'No reason provided.',

            inline:
                false
        }
    ];

    if (historyId) {
        fields.push({
            name:
                '🆔・RECORD',

            value:
                `\`#${historyId}\``,

            inline:
                true
        });
    }

    const embed =
        createKingdomFeedEmbed({
            guild:
                member.guild,

            title:
                titles[
                    changeType
                ],

            description:
                revoked
                    ? `${member} no longer holds a Sin Rank.`
                    : `${member} received a new position within **THE Ⅹ SINS**.`,

            color,

            user:
                member.user,

            fields
        });

    return sendKingdomFeedEmbed(
        member.guild,
        embed
    );
}/**
 * Check whether a Level
 * is a configured milestone.
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

    return Boolean(
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
 * Send a Level milestone.
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
        Number(
            newLevel
        ) <=
        Number(
            previousLevel
        )
    ) {
        return false;
    }

    const fields = [
        {
            name:
                '⭐・LEVEL',

            value:
                [
                    `\`${formatNumber(
                        previousLevel
                    )}\` → \`${formatNumber(
                        newLevel
                    )}\``
                ].join('\n'),

            inline:
                true
        },

        {
            name:
                '◆・XP',

            value:
                `\`${formatNumber(
                    totalXp
                )} XP\``,

            inline:
                true
        }
    ];

    if (
        messageCount !==
        null
    ) {
        fields.push({
            name:
                '💬・MESSAGES',

            value:
                `\`${formatNumber(
                    messageCount
                )}\``,

            inline:
                true
        });
    }

    const embed =
        createKingdomFeedEmbed({
            guild:
                member.guild,

            title:
                `⭐・LEVEL ${formatNumber(
                    newLevel
                )} MILESTONE`,

            description:
                `${member} reached a new progression milestone.`,

            color:
                kingdomFeedConfig
                    .colors
                    .level,

            user:
                member.user,

            fields
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