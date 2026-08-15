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
 * Achievement → Discord Role mapping.
 *
 * Internal Achievement IDs remain
 * unchanged for database compatibility.
 */
const ACHIEVEMENT_ROLE_IDS =
    Object.freeze({
        first_words:
            '1531402234913620039',

        awakened_soul:
            '1531402597993414849',

        rising_soul:
            '1531402543173730425',

        crimson_soul:
            '1531402484923502794',

        eternal_soul:
            '1531402379973365970'
    });

/**
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

/**
 * TTS Achievement palette.
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
 * Safely assign the Discord Role associated
 * with an unlocked Achievement.
 *
 * Missing roles or insufficient permissions
 * must never break the Achievement system.
 *
 * @param {import('discord.js').GuildMember|null} member
 * @param {string} achievementId
 * @returns {Promise<boolean>}
 */
async function assignAchievementRole(
    member,
    achievementId
) {
    if (
        !member ||
        !achievementId
    ) {
        return false;
    }

    const roleId =
        ACHIEVEMENT_ROLE_IDS[
            achievementId
        ];

    if (!roleId) {
        return false;
    }

    const role =
        member.guild.roles.cache.get(
            roleId
        );

    if (!role) {
        console.warn(
            `⚠️ Achievement Role not found: ${roleId} (${achievementId})`
        );

        return false;
    }

    const botMember =
        member.guild.members.me;

    if (
        !botMember
    ) {
        console.warn(
            `⚠️ Evelynn bot member unavailable while assigning Achievement Role: ${achievementId}`
        );

        return false;
    }

    if (
        !botMember.permissions.has(
            PermissionFlagsBits.ManageRoles
        )
    ) {
        console.warn(
            `⚠️ Evelynn lacks Manage Roles for Achievement Role: ${role.name}`
        );

        return false;
    }

    if (
        role.position >=
        botMember.roles.highest.position
    ) {
        console.warn(
            `⚠️ Achievement Role is higher than Evelynn's highest role: ${role.name}`
        );

        return false;
    }

    if (
        member.roles.cache.has(
            role.id
        )
    ) {
        return true;
    }

    try {
        await member.roles.add(
            role,
            `Achievement unlocked: ${achievementId}`
        );

        console.log(
            `🏆 Achievement Role assigned: ${role.name} → ${member.user.tag}`
        );

        return true;
    } catch (error) {
        console.error(
            `❌ Achievement Role assignment failed: ${achievementId} for ${member.user.tag}:`,
            error
        );

        return false;
    }
}

/**
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
}/**
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

            /*
             * Assign the corresponding
             * Achievement Role.
             *
             * Failure here must never
             * prevent the Achievement
             * notification.
             */
            await assignAchievementRole(
                message.member,
                rule.achievementId
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
 * Role assignment is handled here as part
 * of the same successful unlock flow.
 *
 * @param {Object} options
 * @param {string} options.guildId
 * @param {string} options.userId
 * @param {number} options.level
 * @param {import('discord.js').GuildMember|null} options.member
 * @returns {Promise<Object[]>}
 */
async function checkLevelAchievements({
    guildId,
    userId,
    level,
    member = null
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
                !result?.unlocked ||
                !result.achievement
            ) {
                continue;
            }

            unlockedAchievements.push(
                result.achievement
            );

            /*
             * Assign the corresponding
             * Achievement Role.
             */
            if (
                member
            ) {
                await assignAchievementRole(
                    member,
                    rule.achievementId
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
}module.exports = {
    MESSAGE_ACHIEVEMENT_RULES,

    ACHIEVEMENT_ROLE_IDS,

    ACHIEVEMENT_CATEGORY_COLORS,

    DEFAULT_ACHIEVEMENT_COLOR,

    getAchievementColor,

    getAchievementMessage,

    createAchievementEmbed,

    assignAchievementRole,

    findAchievementNotificationChannel,

    canSendAchievementNotification,

    sendAchievementNotification,

    getMessageLevelRecord,

    checkMessageAchievements,

    checkLevelAchievements
};