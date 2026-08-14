const {
    EmbedBuilder,
    PermissionFlagsBits
} = require('discord.js');

const {
    achievements:
        achievementDatabase,

    levels:
        levelDatabase
} = require('../database');

const kingdomFeedConfig =
    require('../config/kingdomFeed');

/*
 * Achievements checked whenever
 * a valid server message is created.
 *
 * Internal Achievement IDs remain
 * unchanged for database compatibility.
 */
const MESSAGE_ACHIEVEMENT_RULES = [
    {
        achievementId:
            'first_words',

        /**
         * Unlock after at least
         * one recorded message.
         *
         * @param {Object} levelRecord
         * @returns {boolean}
         */
        check(
            levelRecord
        ) {
            return (
                Number(
                    levelRecord
                        ?.messageCount ||
                    0
                ) >=
                1
            );
        }
    },
    {
        achievementId:
            'awakened_soul',

        /**
         * Unlock at Level 5.
         *
         * @param {Object} levelRecord
         * @returns {boolean}
         */
        check(
            levelRecord
        ) {
            return (
                Number(
                    levelRecord
                        ?.level ||
                    0
                ) >=
                5
            );
        }
    },
    {
        achievementId:
            'rising_soul',

        /**
         * Unlock at Level 10.
         *
         * @param {Object} levelRecord
         * @returns {boolean}
         */
        check(
            levelRecord
        ) {
            return (
                Number(
                    levelRecord
                        ?.level ||
                    0
                ) >=
                10
            );
        }
    },
    {
        achievementId:
            'crimson_soul',

        /**
         * Unlock at Level 25.
         *
         * @param {Object} levelRecord
         * @returns {boolean}
         */
        check(
            levelRecord
        ) {
            return (
                Number(
                    levelRecord
                        ?.level ||
                    0
                ) >=
                25
            );
        }
    },
    {
        achievementId:
            'eternal_soul',

        /**
         * Unlock at Level 50.
         *
         * @param {Object} levelRecord
         * @returns {boolean}
         */
        check(
            levelRecord
        ) {
            return (
                Number(
                    levelRecord
                        ?.level ||
                    0
                ) >=
                50
            );
        }
    }
];

/*
 * TTS neon Achievement palette.
 */
const ACHIEVEMENT_CATEGORY_COLORS = {
    Activity:
        '#22D3EE',

    Progression:
        '#B026FF',

    Exploration:
        '#5865F2',

    Community:
        '#57F287',

    Special:
        '#FFB000'
};

const DEFAULT_ACHIEVEMENT_COLOR =
    '#B026FF';

/**
 * Return the Achievement color
 * for a category.
 *
 * @param {string|null|undefined} category
 * @returns {string}
 */
function getAchievementColor(
    category
) {
    return (
        ACHIEVEMENT_CATEGORY_COLORS[
            category
        ] ||
        DEFAULT_ACHIEVEMENT_COLOR
    );
}

/**
 * Return the optional message
 * associated with an Achievement.
 *
 * Preserved because other systems
 * may still use this helper.
 *
 * @param {string} achievementId
 * @returns {string}
 */
function getAchievementMessage(
    achievementId
) {
    const messages = {
        first_words:
            'Your first activity has been recorded.',

        awakened_soul:
            'Your progression has begun.',

        rising_soul:
            'Your presence continues to grow.',

        crimson_soul:
            'You have reached a major progression milestone.',

        eternal_soul:
            'You have reached one of the highest progression milestones.'
    };

    return (
        messages[
            achievementId
        ] ||
        'A new Achievement has been recorded.'
    );
}

/**
 * Build a compact Achievement
 * unlock Embed.
 *
 * @param {import('discord.js').Message} message
 * @param {Object} achievement
 * @returns {EmbedBuilder}
 */
function createAchievementEmbed(
    message,
    achievement
) {
    const icon =
        achievement?.icon ||
        '🏆';

    const name =
        achievement?.name ||
        'Unknown Achievement';

    const description =
        achievement?.description ||
        'Achievement unlocked.';

    const category =
        achievement?.category ||
        'General';

    return new EmbedBuilder()
        .setColor(
            getAchievementColor(
                category
            )
        )
        .setTitle(
            '🏆 ACHIEVEMENT UNLOCKED'
        )
        .setDescription(
            [
                `${icon} **${name}**`,
                `${message.author} • ${description}`
            ].join(
                '\n'
            )
        )
        .setThumbnail(
            message.author
                .displayAvatarURL({
                    size:
                        128,

                    forceStatic:
                        false
                })
        );
}/**
 * Find the configured Achievement
 * notification channel.
 *
 * Search priority:
 * 1. Configured channel ID
 * 2. Configured channel name
 *
 * @param {import('discord.js').Guild} guild
 * @returns {import('discord.js').GuildTextBasedChannel|null}
 */
function findAchievementNotificationChannel(
    guild
) {
    if (
        !guild ||
        !kingdomFeedConfig.enabled ||
        !kingdomFeedConfig
            .events
            ?.achievements
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
 * Check whether Evelynn can send an
 * Achievement notification.
 *
 * @param {import('discord.js').GuildTextBasedChannel} channel
 * @param {import('discord.js').GuildMember|null} botMember
 * @returns {boolean}
 */
function canSendAchievementNotification(
    channel,
    botMember
) {
    if (
        !channel ||
        !channel.isTextBased() ||
        !botMember
    ) {
        return false;
    }

    const permissions =
        channel.permissionsFor(
            botMember
        );

    if (
        !permissions
    ) {
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
 * Send an Achievement notification
 * to the configured progression channel.
 *
 * Notification failure does not remove
 * the Achievement from PostgreSQL.
 *
 * @param {import('discord.js').Message} message
 * @param {Object} achievement
 * @returns {Promise<import('discord.js').Message|null>}
 */
async function sendAchievementNotification(
    message,
    achievement
) {
    const notificationChannel =
        findAchievementNotificationChannel(
            message.guild
        );

    if (
        !notificationChannel
    ) {
        console.warn(
            `⚠️ Achievement channel not found in ${message.guild.name}`
        );

        return null;
    }

    const botMember =
        message.guild.members.me;

    if (
        !canSendAchievementNotification(
            notificationChannel,
            botMember
        )
    ) {
        console.warn(
            `⚠️ Evelynn cannot send Achievement notifications in #${notificationChannel.name}`
        );

        return null;
    }

    const achievementEmbed =
        createAchievementEmbed(
            message,
            achievement
        );

    try {
        return await notificationChannel.send({
            embeds: [
                achievementEmbed
            ],

            allowedMentions: {
                users: [
                    message.author.id
                ]
            }
        });
    } catch (error) {
        console.error(
            `❌ Achievement notification failed for ${message.author.tag}:`,
            error
        );

        return null;
    }
}

/**
 * Load the latest Level record
 * for a member.
 *
 * This function only reads existing
 * Level data and does not add XP.
 *
 * @param {import('discord.js').Message} message
 * @returns {Promise<Object|null>}
 */
async function getMessageLevelRecord(
    message
) {
    try {
        return await levelDatabase
            .getUserLevel(
                message.guild.id,
                message.author.id
            );
    } catch (error) {
        console.error(
            `❌ Achievement Level check failed for ${message.author.tag}:`,
            error
        );

        return null;
    }
}/**
 * Check every Achievement that may be
 * unlocked through message activity.
 *
 * @param {import('discord.js').Message} message
 * @returns {Promise<Object[]>}
 */
async function checkMessageAchievements(
    message
) {
    if (
        !message?.inGuild?.() ||
        message.author.bot
    ) {
        return [];
    }

    const levelRecord =
        await getMessageLevelRecord(
            message
        );

    if (
        !levelRecord
    ) {
        return [];
    }

    const unlockedAchievements =
        [];

    for (
        const rule
        of MESSAGE_ACHIEVEMENT_RULES
    ) {
        let requirementMet =
            false;

        try {
            requirementMet =
                Boolean(
                    rule.check(
                        levelRecord,
                        message
                    )
                );
        } catch (error) {
            console.error(
                `❌ Achievement rule failed: ${rule.achievementId}`,
                error
            );

            continue;
        }

        if (
            !requirementMet
        ) {
            continue;
        }

        try {
            const result =
                await achievementDatabase
                    .unlockAchievement(
                        message.guild.id,
                        message.author.id,
                        rule.achievementId
                    );

            if (
                !result?.unlocked ||
                !result.achievement
            ) {
                continue;
            }

            unlockedAchievements.push(
                result.achievement
            );

            console.log(
                `🏆 Achievement unlocked: ${result.achievement.name} by ${message.author.tag}`
            );

            await sendAchievementNotification(
                message,
                result.achievement
            );
        } catch (error) {
            console.error(
                `❌ Achievement unlock failed: ${rule.achievementId} for ${message.author.tag}`,
                error
            );
        }
    }

    return unlockedAchievements;
}

/**
 * Check Level-based Achievements
 * using existing Level data.
 *
 * This helper unlocks Achievements only.
 * Notification routing is handled elsewhere.
 *
 * @param {Object} options
 * @param {string} options.guildId
 * @param {string} options.userId
 * @param {number} options.level
 * @returns {Promise<Object[]>}
 */
async function checkLevelAchievements({
    guildId,
    userId,
    level
}) {
    if (
        !guildId
    ) {
        throw new TypeError(
            'A guild ID is required.'
        );
    }

    if (
        !userId
    ) {
        throw new TypeError(
            'A user ID is required.'
        );
    }

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

    const unlockedAchievements =
        [];

    for (
        const rule
        of MESSAGE_ACHIEVEMENT_RULES
    ) {
        if (
            rule.achievementId ===
            'first_words'
        ) {
            continue;
        }

        let requirementMet =
            false;

        try {
            requirementMet =
                Boolean(
                    rule.check({
                        level:
                            safeLevel,

                        messageCount:
                            0
                    })
                );
        } catch (error) {
            console.error(
                `❌ Level Achievement rule failed: ${rule.achievementId} for ${userId}`,
                error
            );

            continue;
        }

        if (
            !requirementMet
        ) {
            continue;
        }

        try {
            const result =
                await achievementDatabase
                    .unlockAchievement(
                        guildId,
                        userId,
                        rule.achievementId
                    );

            if (
                result?.unlocked &&
                result.achievement
            ) {
                unlockedAchievements.push(
                    result.achievement
                );
            }
        } catch (error) {
            console.error(
                `❌ Level Achievement unlock failed: ${rule.achievementId} for ${userId}`,
                error
            );
        }
    }

    return unlockedAchievements;
}

module.exports = {
    MESSAGE_ACHIEVEMENT_RULES,

    ACHIEVEMENT_CATEGORY_COLORS,
    DEFAULT_ACHIEVEMENT_COLOR,

    getAchievementColor,
    getAchievementMessage,
    createAchievementEmbed,

    findAchievementNotificationChannel,
    canSendAchievementNotification,
    sendAchievementNotification,

    getMessageLevelRecord,

    checkMessageAchievements,
    checkLevelAchievements
};