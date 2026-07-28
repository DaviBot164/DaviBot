const {
    Events,
    PermissionFlagsBits
} = require('discord.js');

const {
    createEmbed
} = require('../utils/embeds');

const {
    levels: levelDatabase
} = require('../database');

/**
 * Level System configuration.
 */
const LEVEL_CONFIG = {
    enabled:
        true,

    /*
     * XP received for one eligible message.
     */
    minimumXp:
        10,

    maximumXp:
        20,

    /*
     * One XP reward every 60 seconds.
     */
    cooldownMilliseconds:
        60_000,

    /*
     * Very short messages will not earn XP.
     */
    minimumMessageLength:
        8,

    /*
     * Prevent identical messages from earning XP
     * repeatedly during this period.
     */
    duplicateWindowMilliseconds:
        10 * 60 * 1000,

    /*
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
function wait(milliseconds) {
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
    return String(content)
        .normalize('NFKC')
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
        normalizedContent.startsWith('!') ||
        normalizedContent.startsWith('?') ||
        normalizedContent.startsWith('.')
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
        ) || [];

    if (
        meaningfulCharacters.length < 3
    ) {
        return false;
    }

    /*
     * Prevent messages such as:
     * aaaaaaaaaa
     * 1111111111
     */
    const uniqueCharacters =
        new Set(
            meaningfulCharacters
        );

    if (
        meaningfulCharacters.length >= 8 &&
        uniqueCharacters.size < 2
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
        recentMessages.get(key);

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
 * Create a visual XP progress bar.
 *
 * @param {number} percentage
 * @param {number} length
 * @returns {string}
 */
function createProgressBar(
    percentage,
    length = 10
) {
    const safePercentage =
        Math.min(
            100,
            Math.max(
                0,
                Number(percentage) || 0
            )
        );

    const filledBlocks =
        Math.round(
            (
                safePercentage /
                100
            ) *
            length
        );

    const emptyBlocks =
        length -
        filledBlocks;

    return (
        '█'.repeat(filledBlocks) +
        '░'.repeat(emptyBlocks)
    );
}

/**
 * Grant every Level reward the member
 * has earned but does not currently have.
 *
 * @param {import('discord.js').GuildMember} member
 * @param {number} level
 * @returns {Promise<import('discord.js').Role[]>}
 */
async function grantLevelRewards(
    member,
    level
) {
    const earnedRewards =
        await levelDatabase
            .getEarnedLevelRewards(
                member.guild.id,
                level
            );

    if (
        earnedRewards.length === 0
    ) {
        return [];
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
            '⚠️ Umbra cannot grant Level rewards because Manage Roles is missing.'
        );

        return [];
    }

    const grantedRoles = [];

    for (
        const reward
        of earnedRewards
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
            !role.editable ||
            role.position >=
                botMember.roles.highest.position
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
        } catch (error) {
            console.error(
                `❌ Failed to grant Level reward role ${role.name}:`
            );

            console.error(error);
        }
    }

    return grantedRoles;
}

/**
 * Send a Level Up announcement.
 *
 * @param {import('discord.js').Message} message
 * @param {Object} levelResult
 * @param {import('discord.js').Role[]} grantedRoles
 * @returns {Promise<void>}
 */
async function sendLevelUpMessage(
    message,
    levelResult,
    grantedRoles
) {
    if (
        !message.channel.isTextBased()
    ) {
        return;
    }

    const progress =
        levelResult.data.progress;

    const progressBar =
        createProgressBar(
            progress.progressPercent
        );

    const descriptionLines = [
        `${message.author}, your strength has grown beneath the crimson moon.`,
        '',
        `🌑 **New Level:** \`${levelResult.newLevel}\``,
        `⭐ **Total XP:** \`${levelResult.data.xp.toLocaleString()}\``,
        '',
        `\`${progressBar}\``,
        `Next Level Progress: **${progress.progressPercent}%**`
    ];

    if (
        grantedRoles.length > 0
    ) {
        descriptionLines.push(
            '',
            '━━━━━━━━━━━━━━━━━━━━',
            '',
            '🎖️ **Reward Unlocked**',
            grantedRoles
                .map(role => `${role}`)
                .join('\n')
        );
    }

    const levelUpEmbed =
        createEmbed({
            title:
                '🌑 A Soul Has Ascended',

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
        await message.channel.send({
            content:
                `${message.author}`,

            embeds:
                [levelUpEmbed],

            allowedMentions: {
                users:
                    [message.author.id]
            }
        });
    } catch (error) {
        console.error(
            '❌ Failed to send Umbra Level Up message:'
        );

        console.error(error);
    }
}

/**
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
        message.content || '';

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

    const grantedRoles =
        await grantLevelRewards(
            message.member,
            levelResult.newLevel
        );

    await sendLevelUpMessage(
        message,
        levelResult,
        grantedRoles
    );

    console.log(
        '======================================'
    );

    console.log(
        '🌑 Umbra Level Up'
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
        `🎖️ Rewards Granted: ${grantedRoles.length}`
    );

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
    async execute(message) {
        try {
            await processLevelMessage(
                message
            );
        } catch (error) {
            console.error(
                '❌ Umbra Level System error:'
            );

            console.error(error);
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
                ]
                of recentMessages.entries()
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

if (
    typeof cleanupTimer.unref ===
    'function'
) {
    cleanupTimer.unref();
}