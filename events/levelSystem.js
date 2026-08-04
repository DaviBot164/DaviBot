const {
    Events,
    PermissionFlagsBits
} = require('discord.js');

const {
    createEmbed
} = require('../utils/embeds');

const {
    levels:
        levelDatabase
} = require('../database');

const {
    sendLevelFeed
} = require('../utils/kingdomFeed');

/**
 * Official Las Noches Soul Progression channel.
 *
 * Compact Level Up notifications are published
 * here instead of the main general chat.
 */
const SOUL_PROGRESSION_CHANNEL_ID =
    '1534145341430038558';

/**
 * Level System configuration.
 */
const LEVEL_CONFIG = {
    enabled:
        true,

    /**
     * XP received for one eligible message.
     */
    minimumXp:
        10,

    maximumXp:
        20,

    /**
     * One XP reward every 60 seconds.
     */
    cooldownMilliseconds:
        60_000,

    /**
     * Very short messages will not earn XP.
     */
    minimumMessageLength:
        8,

    /**
     * Prevent identical messages from earning
     * XP repeatedly during this period.
     */
    duplicateWindowMilliseconds:
        10 * 60 * 1000,

    /**
     * Delay XP processing briefly so AutoMod
     * has time to delete violating messages.
     */
    autoModDelayMilliseconds:
        1_200
};

/**
 * Recent valid message content.
 *
 * Key:
 * guildId:userId
 */
const recentMessages =
    new Map();

/**
 * Wait for a specified duration.
 *
 * @param {number} milliseconds
 * @returns {Promise<void>}
 */
function wait(
    milliseconds
) {
    return new Promise(resolve => {
        const timer =
            setTimeout(
                resolve,
                milliseconds
            );

        if (
            typeof timer.unref ===
            'function'
        ) {
            timer.unref();
        }
    });
}

/**
 * Generate random XP.
 *
 * @param {number} minimum
 * @param {number} maximum
 * @returns {number}
 */
function generateRandomXp(
    minimum,
    maximum
) {
    return Math.floor(
        Math.random() *
        (
            maximum -
            minimum +
            1
        )
    ) + minimum;
}

/**
 * Normalize content for duplicate detection.
 *
 * @param {string} content
 * @returns {string}
 */
function normalizeMessageContent(
    content
) {
    return String(
        content
    )
        .normalize(
            'NFKC'
        )
        .toLowerCase()
        .replace(
            /[\u200B-\u200D\uFEFF]/g,
            ''
        )
        .replace(
            /\s+/g,
            ' '
        )
        .trim();
}

/**
 * Check whether a message contains enough
 * meaningful text to earn XP.
 *
 * @param {string} content
 * @returns {boolean}
 */
function hasMeaningfulContent(
    content
) {
    const normalizedContent =
        normalizeMessageContent(
            content
        );

    if (
        normalizedContent.length <
        LEVEL_CONFIG.minimumMessageLength
    ) {
        return false;
    }

    /*
     * Text commands should not grant XP.
     */
    if (
        normalizedContent.startsWith(
            '!'
        ) ||
        normalizedContent.startsWith(
            '?'
        ) ||
        normalizedContent.startsWith(
            '.'
        )
    ) {
        return false;
    }

    /*
     * Require at least three letters or numbers.
     * Emoji-only and symbol-only messages give no XP.
     */
    const meaningfulCharacters =
        normalizedContent.match(
            /[\p{L}\p{N}]/gu
        ) ??
        [];

    if (
        meaningfulCharacters.length <
        3
    ) {
        return false;
    }

    /*
     * Prevent messages such as:
     *
     * aaaaaaaaaa
     * 1111111111
     */
    const uniqueCharacters =
        new Set(
            meaningfulCharacters
        );

    if (
        meaningfulCharacters.length >=
            8 &&
        uniqueCharacters.size <
            2
    ) {
        return false;
    }

    return true;
}

/**
 * Check whether the same message was recently
 * submitted by the same member.
 *
 * @param {import('discord.js').Message} message
 * @returns {boolean}
 */
function isRecentDuplicate(
    message
) {
    const normalizedContent =
        normalizeMessageContent(
            message.content
        );

    const key =
        `${message.guild.id}:` +
        `${message.author.id}`;

    const previousMessage =
        recentMessages.get(
            key
        );

    const now =
        Date.now();

    if (
        previousMessage &&
        previousMessage.content ===
            normalizedContent &&
        now -
            previousMessage.createdAt <
            LEVEL_CONFIG
                .duplicateWindowMilliseconds
    ) {
        return true;
    }

    recentMessages.set(
        key,
        {
            content:
                normalizedContent,

            createdAt:
                now
        }
    );

    return false;
}

/**
 * Format a number using separators.
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
 * Check whether Umbra can manage a role.
 *
 * @param {import('discord.js').Role} role
 * @param {import('discord.js').GuildMember} botMember
 * @returns {boolean}
 */
function canManageRewardRole(
    role,
    botMember
) {
    if (
        !role ||
        role.managed
    ) {
        return false;
    }

    if (
        !role.editable ||
        role.position >=
            botMember.roles.highest.position
    ) {
        return false;
    }

    return true;
}

/**
 * Synchronize a Soul's progression roles.
 *
 * Umbra keeps only the highest configured
 * Level reward the Soul has earned.
 *
 * Lower progression roles are removed.
 * Staff, verification, cosmetic and game
 * roles remain untouched.
 *
 * If several roles are configured for the
 * same highest Level, all of them remain.
 *
 * @param {import('discord.js').GuildMember} member
 * @param {number} level
 * @returns {Promise<{
 *     grantedRoles: import('discord.js').Role[],
 *     removedRoles: import('discord.js').Role[],
 *     highestRewardLevel: number|null
 * }>}
 */
async function synchronizeLevelRewards(
    member,
    level
) {
    const allRewards =
        await levelDatabase
            .getLevelRewards(
                member.guild.id
            );

    if (
        allRewards.length ===
        0
    ) {
        return {
            grantedRoles:
                [],

            removedRoles:
                [],

            highestRewardLevel:
                null
        };
    }

    const botMember =
        member.guild.members.me;

    if (
        !botMember ||
        !botMember.permissions.has(
            PermissionFlagsBits.ManageRoles
        )
    ) {
        console.warn(
            '⚠️ Umbra cannot synchronize Level rewards because Manage Roles is missing.'
        );

        return {
            grantedRoles:
                [],

            removedRoles:
                [],

            highestRewardLevel:
                null
        };
    }

    const configuredRewardRoleIds =
        new Set(
            allRewards.map(
                reward =>
                    reward.roleId
            )
        );

    const earnedRewards =
        allRewards.filter(
            reward =>
                reward.level <=
                level
        );

    const grantedRoles =
        [];

    const removedRoles =
        [];

    if (
        earnedRewards.length ===
        0
    ) {
        for (
            const roleId of
            configuredRewardRoleIds
        ) {
            const role =
                member.guild.roles.cache.get(
                    roleId
                );

            if (
                !role ||
                !member.roles.cache.has(
                    role.id
                )
            ) {
                continue;
            }

            if (
                !canManageRewardRole(
                    role,
                    botMember
                )
            ) {
                console.warn(
                    `⚠️ Umbra cannot remove Level reward role: ${role.name}`
                );

                continue;
            }

            try {
                await member.roles.remove(
                    role,
                    `Umbra Level Progression Sync • Current Level ${level}`
                );

                removedRoles.push(
                    role
                );

                console.log(
                    `🗑️ Removed progression role ${role.name} from ${member.user.tag}.`
                );
            } catch (error) {
                console.error(
                    `❌ Failed to remove Level reward role ${role.name}:`
                );

                console.error(
                    error
                );
            }
        }

        return {
            grantedRoles,
            removedRoles,

            highestRewardLevel:
                null
        };
    }    const highestRewardLevel =
        Math.max(
            ...earnedRewards.map(
                reward =>
                    reward.level
            )
        );

    const highestRewards =
        earnedRewards.filter(
            reward =>
                reward.level ===
                highestRewardLevel
        );

    const highestRewardRoleIds =
        new Set(
            highestRewards.map(
                reward =>
                    reward.roleId
            )
        );

    /*
     * Remove lower progression roles.
     */
    for (
        const roleId of
        configuredRewardRoleIds
    ) {
        if (
            highestRewardRoleIds.has(
                roleId
            )
        ) {
            continue;
        }

        const role =
            member.guild.roles.cache.get(
                roleId
            );

        if (
            !role ||
            !member.roles.cache.has(
                role.id
            )
        ) {
            continue;
        }

        if (
            !canManageRewardRole(
                role,
                botMember
            )
        ) {
            console.warn(
                `⚠️ Umbra cannot remove Level reward role: ${role.name}`
            );

            continue;
        }

        try {
            await member.roles.remove(
                role,
                `Umbra Level Progression Sync • Current Level ${level}`
            );

            removedRoles.push(
                role
            );

            console.log(
                `🗑️ Removed lower progression role ${role.name} from ${member.user.tag}.`
            );
        } catch (error) {
            console.error(
                `❌ Failed to remove Level reward role ${role.name}:`
            );

            console.error(
                error
            );
        }
    }

    /*
     * Grant every role configured at the
     * highest currently earned Level.
     */
    for (
        const reward of
        highestRewards
    ) {
        const role =
            member.guild.roles.cache.get(
                reward.roleId
            );

        if (!role) {
            console.warn(
                `⚠️ Level reward role was not found: ${reward.roleId}`
            );

            continue;
        }

        if (
            member.roles.cache.has(
                role.id
            )
        ) {
            continue;
        }

        if (
            !canManageRewardRole(
                role,
                botMember
            )
        ) {
            console.warn(
                `⚠️ Umbra cannot grant Level reward role: ${role.name}`
            );

            continue;
        }

        try {
            await member.roles.add(
                role,
                `Umbra Level Reward • Level ${reward.level}`
            );

            grantedRoles.push(
                role
            );

            console.log(
                `🎖️ Granted progression role ${role.name} to ${member.user.tag}.`
            );
        } catch (error) {
            console.error(
                `❌ Failed to grant Level reward role ${role.name}:`
            );

            console.error(
                error
            );
        }
    }

    return {
        grantedRoles,
        removedRoles,
        highestRewardLevel
    };
}

/**
 * Resolve the Soul Progression channel.
 *
 * The configured channel is always preferred.
 * The original message channel is not used as
 * a fallback so general chat remains clean.
 *
 * @param {import('discord.js').Message} message
 * @returns {Promise<import('discord.js').GuildTextBasedChannel|null>}
 */
async function getLevelUpChannel(
    message
) {
    const configuredChannel =
        await message.guild.channels
            .fetch(
                SOUL_PROGRESSION_CHANNEL_ID
            )
            .catch(
                () => null
            );

    if (
        !configuredChannel ||
        !configuredChannel.isTextBased() ||
        configuredChannel.isThread()
    ) {
        console.warn(
            `⚠️ Soul Progression channel was not found: ${SOUL_PROGRESSION_CHANNEL_ID}`
        );

        return null;
    }

    const botMember =
        message.guild.members.me;

    const permissions =
        botMember
            ? configuredChannel
                .permissionsFor(
                    botMember
                )
            : null;

    if (
        !permissions?.has([
            PermissionFlagsBits.ViewChannel,
            PermissionFlagsBits.SendMessages,
            PermissionFlagsBits.EmbedLinks
        ])
    ) {
        console.warn(
            `⚠️ Umbra cannot send Level Up messages in #${configuredChannel.name}.`
        );

        return null;
    }

    return configuredChannel;
}

/**
 * Send a compact Las Noches Level Up
 * announcement.
 *
 * Detailed XP progress remains available
 * inside the interactive /profile command.
 *
 * @param {import('discord.js').Message} message
 * @param {Object} levelResult
 * @param {Object} rewardResult
 * @param {import('discord.js').Role[]} rewardResult.grantedRoles
 * @param {import('discord.js').Role[]} rewardResult.removedRoles
 * @param {number|null} rewardResult.highestRewardLevel
 * @returns {Promise<void>}
 */
async function sendLevelUpMessage(
    message,
    levelResult,
    rewardResult
) {
    const targetChannel =
        await getLevelUpChannel(
            message
        );

    if (!targetChannel) {
        return;
    }

    const serverRank =
        await levelDatabase
            .getUserRank(
                message.guild.id,
                message.author.id
            )
            .catch(
                () => null
            );

    const descriptionLines = [
        `${message.author} has reached a new milestone within Las Noches.`,
        '',
        `🌙 **Level:** \`${levelResult.newLevel}\``,
        `⭐ **Total XP:** \`${formatNumber(levelResult.data.xp)}\``,
        `🏆 **Server Rank:** ${
            serverRank
                ? `\`#${serverRank}\``
                : '`Unranked`'
        }`
    ];

    if (
        rewardResult.grantedRoles.length >
        0
    ) {
        descriptionLines.push(
            '',
            '🎖️ **Reward Unlocked**',
            rewardResult.grantedRoles
                .map(
                    role =>
                        `${role}`
                )
                .join('\n')
        );
    }

    if (
        rewardResult.removedRoles.length >
        0
    ) {
        descriptionLines.push(
            '',
            '🌘 **Previous Reward Replaced**',
            rewardResult.removedRoles
                .map(
                    role =>
                        `~~${role.name}~~`
                )
                .join('\n')
        );
    }

    descriptionLines.push(
        '',
        '*Continue strengthening your spirit within Las Noches.*'
    );

    const levelUpEmbed =
        createEmbed({
            title:
                '🌙 A Soul Has Ascended',

            description:
                descriptionLines.join(
                    '\n'
                ),

            thumbnail:
                message.author
                    .displayAvatarURL({
                        extension:
                            'png',

                        size:
                            256,

                        forceStatic:
                            false
                    })
        });

    try {
        await targetChannel.send({
            embeds: [
                levelUpEmbed
            ],

            allowedMentions: {
                users: [
                    message.author.id
                ]
            }
        });
    } catch (error) {
        console.error(
            '❌ Failed to send Umbra Level Up message:'
        );

        console.error(
            error
        );
    }
}/**
 * Process XP for one message.
 *
 * @param {import('discord.js').Message} message
 * @returns {Promise<void>}
 */
async function processLevelMessage(
    message
) {
    if (
        !LEVEL_CONFIG.enabled ||
        !message.inGuild() ||
        message.author.bot ||
        message.webhookId
    ) {
        return;
    }

    if (!message.member) {
        return;
    }

    /*
     * Wait briefly so Guardian can process
     * and delete violating messages first.
     */
    await wait(
        LEVEL_CONFIG
            .autoModDelayMilliseconds
    );

    if (
        message.deleted ||
        !message.guild ||
        !message.channel
    ) {
        return;
    }

    const content =
        message.content ??
        '';

    if (
        !hasMeaningfulContent(
            content
        )
    ) {
        return;
    }

    if (
        isRecentDuplicate(
            message
        )
    ) {
        return;
    }

    const xpAmount =
        generateRandomXp(
            LEVEL_CONFIG.minimumXp,
            LEVEL_CONFIG.maximumXp
        );

    const levelResult =
        await levelDatabase.addXp(
            message.guild.id,
            message.author.id,
            xpAmount,
            LEVEL_CONFIG
                .cooldownMilliseconds
        );

    if (
        !levelResult.awarded
    ) {
        return;
    }

    console.log(
        `⭐ ${message.author.tag} received ${levelResult.xpAwarded} XP in ${message.guild.name}.`
    );

    if (
        !levelResult.leveledUp
    ) {
        return;
    }

    const rewardResult =
        await synchronizeLevelRewards(
            message.member,
            levelResult.newLevel
        );

    /*
     * Send one compact Level Up notification
     * into the Soul Progression channel.
     */
    await sendLevelUpMessage(
        message,
        levelResult,
        rewardResult
    );

    /*
     * Keep the existing Kingdom Feed logic.
     *
     * sendLevelFeed may publish only configured
     * major milestones, depending on the
     * Kingdom Feed configuration.
     */
    await sendLevelFeed({
        member:
            message.member,

        previousLevel:
            levelResult.previousLevel,

        newLevel:
            levelResult.newLevel,

        totalXp:
            levelResult.data.xp,

        messageCount:
            levelResult.data.messageCount
    });

    const serverRank =
        await levelDatabase
            .getUserRank(
                message.guild.id,
                message.author.id
            )
            .catch(
                () => null
            );

    console.log(
        '======================================'
    );

    console.log(
        '🌙 Umbra Level Up'
    );

    console.log(
        `👤 Soul: ${message.author.tag}`
    );

    console.log(
        `⭐ Level: ${levelResult.previousLevel} → ${levelResult.newLevel}`
    );

    console.log(
        `🏰 Server: ${message.guild.name}`
    );

    console.log(
        `🏆 Server Rank: ${
            serverRank ??
            'Unknown'
        }`
    );

    console.log(
        `🎖️ Rewards Granted: ${rewardResult.grantedRoles.length}`
    );

    console.log(
        `🗑️ Lower Rewards Removed: ${rewardResult.removedRoles.length}`
    );

    if (
        rewardResult.highestRewardLevel
    ) {
        console.log(
            `🌙 Highest Reward Level: ${rewardResult.highestRewardLevel}`
        );
    }

    console.log(
        '======================================'
    );
}

module.exports = {
    name:
        Events.MessageCreate,

    once:
        false,

    /**
     * Run Umbra Level System for every
     * eligible server message.
     *
     * @param {import('discord.js').Message} message
     * @returns {Promise<void>}
     */
    async execute(
        message
    ) {
        try {
            await processLevelMessage(
                message
            );
        } catch (error) {
            console.error(
                '❌ Umbra Level System error:'
            );

            console.error(
                error
            );
        }
    }
};

/**
 * Remove old duplicate-message records
 * from memory.
 */
const cleanupTimer =
    setInterval(
        () => {
            const now =
                Date.now();

            for (
                const [
                    key,
                    data
                ] of recentMessages.entries()
            ) {
                if (
                    now -
                        data.createdAt >
                    LEVEL_CONFIG
                        .duplicateWindowMilliseconds
                ) {
                    recentMessages.delete(
                        key
                    );
                }
            }
        },

        10 * 60 * 1000
    );

cleanupTimer.unref?.();