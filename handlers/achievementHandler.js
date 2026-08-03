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
        '#8B0000'
    );
}

/**
 * Return a thematic message for an
 * unlocked Achievement.
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
 * Create a compact Achievement
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
        'No Achievement description is available.';

    const category =
        achievement?.category ||
        'General';

    const unlockedAt =
        Math.floor(
            Date.now() /
            1_000
        );

    return new EmbedBuilder()
        .setColor(
            getAchievementColor(
                category
            )
        )
        .setAuthor({
            name:
                'Umbra • Achievement Unlocked',

            iconURL:
                message.client.user
                    .displayAvatarURL({
                        size:
                            128,

                        forceStatic:
                            false
                    })
        })
        .setTitle(
            `${icon} ${name}`
        )
        .setDescription(
            [
                `${message.author} completed a new Soul Chronicle.`,
                '',
                description,
                '',
                `*${getAchievementMessage(
                    achievement?.id
                )}*`
            ].join('\n')
        )
        .addFields(
            {
                name:
                    '📚 Category',

                value:
                    `\`${category}\``,

                inline:
                    true
            },
            {
                name:
                    '🕒 Unlocked',

                value:
                    `<t:${unlockedAt}:R>`,

                inline:
                    true
            }
        )
        .setThumbnail(
            message.author
                .displayAvatarURL({
                    size:
                        256,

                    forceStatic:
                        false
                })
        )
        .setFooter({
            text:
                'Umbra • Soul Archives'
        })
        .setTimestamp();
}

/**
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
 * into the channel where it was unlocked.
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
    if (
        !message.channel
            ?.isTextBased()
    ) {
        return null;
    }

    const botMember =
        message.guild.members.me;

    if (
        !canSendAchievementNotification(
            message.channel,
            botMember
        )
    ) {
        console.warn(
            `⚠️ Umbra cannot send an Achievement notification in #${message.channel.name}.`
        );

        return null;
    }

    const achievementEmbed =
        createAchievementEmbed(
            message,
            achievement
        );

    try {
        return await message.channel.send({
            embeds: [
                achievementEmbed
            ],

            allowedMentions: {
                parse:
                    []
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
                !result.unlocked ||
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
}

/**
 * Check Level-based Achievements using
 * existing Level data.
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
                Number(level) || 0
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

        const requirementMet =
            Boolean(
                rule.check({
                    level:
                        safeLevel,

                    messageCount:
                        0
                })
            );

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
                result.unlocked &&
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

    getAchievementColor,
    getAchievementMessage,
    createAchievementEmbed,

    canSendAchievementNotification,
    sendAchievementNotification,

    checkMessageAchievements,
    checkLevelAchievements
};