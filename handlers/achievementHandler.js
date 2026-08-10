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

/**
 * Achievements checked whenever a valid
 * server message is created.
 *
 * A Soul may unlock several Achievements
 * from the same message if multiple
 * requirements are satisfied.
 */
const MESSAGE_ACHIEVEMENT_RULES = [
    {
        achievementId:
            'first_words',

        /**
         * Unlock after Umbra has recorded
         * at least one message.
         *
         * @param {Object} levelRecord
         * @returns {boolean}
         */
        check(levelRecord) {
            return (
                Number(
                    levelRecord
                        ?.messageCount || 0
                ) >= 1
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
        check(levelRecord) {
            return (
                Number(
                    levelRecord
                        ?.level || 0
                ) >= 5
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
        check(levelRecord) {
            return (
                Number(
                    levelRecord
                        ?.level || 0
                ) >= 10
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
        check(levelRecord) {
            return (
                Number(
                    levelRecord
                        ?.level || 0
                ) >= 25
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
        check(levelRecord) {
            return (
                Number(
                    levelRecord
                        ?.level || 0
                ) >= 50
            );
        }
    }
];

/**
 * Achievement category colors.
 */
const ACHIEVEMENT_CATEGORY_COLORS = {
    Activity:
        '#8B0000',

    Progression:
        '#6A0DAD',

    Exploration:
        '#5865F2',

    Community:
        '#57F287',

    Special:
        '#D4AF37'
};

/**
 * Default Achievement color.
 */
const DEFAULT_ACHIEVEMENT_COLOR =
    '#8B0000';

/**
 * Return a valid Achievement color.
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
 * Return a thematic message for an
 * unlocked Achievement.
 *
 * Preserved for compatibility with other
 * Umbra systems even though the compact
 * notification no longer displays it.
 *
 * @param {string} achievementId
 * @returns {string}
 */
function getAchievementMessage(
    achievementId
) {
    const messages = {
        first_words:
            'Your first words have been recorded beneath the moon.',

        awakened_soul:
            'The dormant power within this Soul has begun to awaken.',

        rising_soul:
            'Umbra has witnessed this Soul rise beyond the shadows.',

        crimson_soul:
            'The moon has acknowledged this Soul’s growing strength.',

        eternal_soul:
            'This name has been written permanently into the Chronicles.'
    };

    return (
        messages[
            achievementId
        ] ||
        'Umbra has recorded a new chapter in this Soul’s journey.'
    );
}

/**
 * Create a minimal Achievement unlock Embed.
 *
 * The Soul Progression channel should show
 * only the information a member needs:
 *
 * - Achievement name
 * - Soul
 * - Requirement / description
 *
 * Detailed Chronicle information remains
 * available through Umbra's profile and
 * archive systems.
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
            ].join('\n')
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
}

/**
 * Find the configured Soul Progression
 * channel for Achievement notifications.
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
}/**
 * Check whether Umbra may send an
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
 * Safely send an Achievement notification
 * into the configured Soul Progression channel.
 *
 * Failure to send the notification does not
 * remove the Achievement from the database.
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

    if (!notificationChannel) {
        console.warn(
            `⚠️ Soul Progression channel was not found for Achievement notification in ${message.guild.name}.`
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
            `⚠️ Umbra cannot send an Achievement notification in #${notificationChannel.name}.`
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
            `❌ Failed to send Achievement notification for ${message.author.tag}:`
        );

        console.error(
            error
        );

        return null;
    }
}

/**
 * Load the latest Level data available
 * for the Soul.
 *
 * This function does not add XP.
 * It only reads the existing Level record.
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
            `❌ Achievement Level check failed for ${message.author.tag}:`
        );

        console.error(
            error
        );

        return null;
    }
}

/**
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

    if (!levelRecord) {
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
                `❌ Achievement rule ${rule.achievementId} failed:`
            );

            console.error(
                error
            );

            continue;
        }

        if (!requirementMet) {
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
                `🏆 ${message.author.tag} unlocked ${result.achievement.name} in ${message.guild.name}.`
            );

            await sendAchievementNotification(
                message,
                result.achievement
            );
        } catch (error) {
            console.error(
                `❌ Failed to unlock ${rule.achievementId} for ${message.author.tag}:`
            );

            console.error(
                error
            );
        }
    }

    return unlockedAchievements;
}/**
 * Check Level-based Achievements using
 * existing Level data.
 *
 * This helper only unlocks the Achievement.
 * Notification routing is handled elsewhere
 * because this function does not receive
 * a Discord Message object.
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
    if (!guildId) {
        throw new TypeError(
            'A guild ID is required.'
        );
    }

    if (!userId) {
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
                ) || 0
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
                `❌ Level Achievement rule ${rule.achievementId} failed for ${userId}:`
            );

            console.error(
                error
            );

            continue;
        }

        if (!requirementMet) {
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
                `❌ Level Achievement ${rule.achievementId} failed for ${userId}:`
            );

            console.error(
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