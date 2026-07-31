const {
    EmbedBuilder
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
            'Your first words have been recorded beneath the crimson moon.',

        awakened_soul:
            'The dormant power within this Soul has begun to awaken.',

        rising_soul:
            'Umbra has witnessed this Soul rise beyond the shadows.',

        crimson_soul:
            'The Crimson Moon has acknowledged this Soul’s strength.',

        eternal_soul:
            'This name has been written permanently into the Chronicles.'
    };

    return (
        messages[
            achievementId
        ] ??
        'Umbra has recorded a new chapter in this Soul’s journey.'
    );
}

/**
 * Build the Achievement Unlocked embed.
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
        achievement.icon ||
        '🏆';

    return new EmbedBuilder()
        .setColor(
            '#8B0000'
        )

        .setAuthor({
            name:
                'Umbra Achievement System',

            iconURL:
                message.client.user
                    .displayAvatarURL({
                        size:
                            256,

                        forceStatic:
                            false
                    })
        })

        .setTitle(
            `${icon} Achievement Unlocked`
        )

        .setDescription(
            [
                `${message.author}, a new chapter has been added to your Soul Record.`,
                '',
                '━━━━━━━━━━━━━━━━━━━━',
                '',
                `${icon} **${achievement.name}**`,
                '',
                achievement.description,
                '',
                `*${getAchievementMessage(achievement.id)}*`,
                '',
                '━━━━━━━━━━━━━━━━━━━━'
            ].join(
                '\n'
            )
        )

        .setThumbnail(
            message.author
                .displayAvatarURL({
                    size:
                        512,

                    forceStatic:
                        false
                })
        )

        .addFields({
            name:
                '📜 Chronicle Entry',

            value:
                [
                    `**Category:** ${achievement.category}`,
                    `**Soul:** ${message.author}`,
                    `**Unlocked:** <t:${Math.floor(Date.now() / 1000)}:R>`
                ].join(
                    '\n'
                ),

            inline:
                false
        })

        .setFooter({
            text:
                '🌑 Every Soul has a story. Umbra remembers them all.'
        })

        .setTimestamp();
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
 * @returns {Promise<void>}
 */
async function sendAchievementNotification(
    message,
    achievement
) {
    if (
        !message.channel
            ?.isTextBased()
    ) {
        return;
    }

    const botMember =
        message.guild.members.me;

    if (!botMember) {
        return;
    }

    const permissions =
        message.channel.permissionsFor(
            botMember
        );

    if (
        !permissions?.has(
            'ViewChannel'
        ) ||
        !permissions?.has(
            'SendMessages'
        ) ||
        !permissions?.has(
            'EmbedLinks'
        )
    ) {
        console.warn(
            `⚠️ Umbra cannot send an Achievement notification in #${message.channel.name}.`
        );

        return;
    }

    const achievementEmbed =
        createAchievementEmbed(
            message,
            achievement
        );

    try {
        await message.channel.send({
            embeds:
                [achievementEmbed]
        });
    } catch (error) {
        console.error(
            `❌ Failed to send Achievement notification for ${message.author.tag}:`
        );

        console.error(
            error
        );
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
        !message?.inGuild?.()
    ) {
        return [];
    }

    if (
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
 * Level data already available to the caller.
 *
 * This will be useful inside the Level System,
 * where the newest Level record is already known.
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
            'A guild ID is required to check Level Achievements.'
        );
    }

    if (!userId) {
        throw new TypeError(
            'A user ID is required to check Level Achievements.'
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

        const fakeLevelRecord = {
            level:
                safeLevel,

            messageCount:
                0
        };

        const requirementMet =
            Boolean(
                rule.check(
                    fakeLevelRecord
                )
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

    checkMessageAchievements,
    checkLevelAchievements,

    sendAchievementNotification
};