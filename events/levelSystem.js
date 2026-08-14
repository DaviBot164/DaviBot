const {
    Events,
    PermissionFlagsBits,
    AttachmentBuilder
} = require('discord.js');

const fs =
    require('fs');

const path =
    require('path');

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

const LEVEL_UP_CHANNEL_ID =
    '1534145341430038558';

const LEVEL_BANNERS =
    Object.freeze({
        common: {
            minimumLevel:
                1,

            maximumLevel:
                24,

            fileName:
                'level-common.png',

            color:
                '#22D3EE'
        },

        gold: {
            minimumLevel:
                25,

            maximumLevel:
                74,

            fileName:
                'level-gold.png',

            color:
                '#FFB000'
        },

        elite: {
            minimumLevel:
                75,

            maximumLevel:
                Infinity,

            fileName:
                'level-elite.png',

            color:
                '#FF2BD6'
        }
    });

const LEVEL_CONFIG = {
    enabled:
        true,

    minimumXp:
        20,

    maximumXp:
        30,

    cooldownMilliseconds:
        30_000,

    minimumMessageLength:
        8,

    duplicateWindowMilliseconds:
        10 * 60 * 1000,

    autoModDelayMilliseconds:
        1_200
};

const recentMessages =
    new Map();

/**
 * Resolve the correct
 * Level Up banner.
 *
 * @param {number} level
 * @returns {{
 *     tier: string,
 *     fileName: string,
 *     filePath: string,
 *     color: string
 * }}
 */
function getLevelBanner(
    level
) {
    const numericLevel =
        Math.max(
            1,
            Number(
                level
            ) ||
            1
        );

    let tier =
        'common';

    if (
        numericLevel >=
        LEVEL_BANNERS
            .elite
            .minimumLevel
    ) {
        tier =
            'elite';
    } else if (
        numericLevel >=
        LEVEL_BANNERS
            .gold
            .minimumLevel
    ) {
        tier =
            'gold';
    }

    const banner =
        LEVEL_BANNERS[
            tier
        ];

    return {
        tier,

        fileName:
            banner.fileName,

        filePath:
            path.join(
                __dirname,
                '..',
                'assets',
                'images',
                'level-banners',
                banner.fileName
            ),

        color:
            banner.color
    };
}

/**
 * Wait briefly before
 * processing XP.
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

        timer.unref?.();
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
    return (
        Math.floor(
            Math.random() *
            (
                maximum -
                minimum +
                1
            )
        ) +
        minimum
    );
}

/**
 * Normalize message content.
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
 * Check whether a message
 * contains meaningful text.
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
 * Check recent duplicate messages.
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
        `${message.guild.id}:${message.author.id}`;

    const now =
        Date.now();

    const previousMessage =
        recentMessages.get(
            key
        );

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
}/**
 * Check whether Evelynn can
 * manage one reward role.
 *
 * @param {import('discord.js').Role} role
 * @param {import('discord.js').GuildMember} botMember
 * @returns {boolean}
 */
function canManageRewardRole(
    role,
    botMember
) {
    return Boolean(
        role &&
        !role.managed &&
        role.editable &&
        role.position <
            botMember.roles.highest.position
    );
}

/**
 * Synchronize progression roles.
 *
 * Only the highest earned
 * configured reward roles remain.
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
        !Array.isArray(
            allRewards
        ) ||
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
            '⚠️ Evelynn cannot synchronize Level rewards.'
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

    const rewardRoleIds =
        new Set(
            allRewards.map(
                reward =>
                    reward.roleId
            )
        );

    const earnedRewards =
        allRewards.filter(
            reward =>
                Number(
                    reward.level
                ) <=
                Number(
                    level
                )
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
            const roleId
            of rewardRoleIds
        ) {
            const role =
                member.guild.roles.cache.get(
                    roleId
                );

            if (
                !role ||
                !member.roles.cache.has(
                    role.id
                ) ||
                !canManageRewardRole(
                    role,
                    botMember
                )
            ) {
                continue;
            }

            try {
                await member.roles.remove(
                    role,
                    `Level progression sync • Level ${level}`
                );

                removedRoles.push(
                    role
                );
            } catch (error) {
                console.error(
                    `❌ Failed to remove progression role ${role.name}:`,
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
    }

    const highestRewardLevel =
        Math.max(
            ...earnedRewards.map(
                reward =>
                    Number(
                        reward.level
                    )
            )
        );

    const highestRewards =
        earnedRewards.filter(
            reward =>
                Number(
                    reward.level
                ) ===
                highestRewardLevel
        );

    const highestRoleIds =
        new Set(
            highestRewards.map(
                reward =>
                    reward.roleId
            )
        );

    for (
        const roleId
        of rewardRoleIds
    ) {
        if (
            highestRoleIds.has(
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
            ) ||
            !canManageRewardRole(
                role,
                botMember
            )
        ) {
            continue;
        }

        try {
            await member.roles.remove(
                role,
                `Level progression sync • Level ${level}`
            );

            removedRoles.push(
                role
            );
        } catch (error) {
            console.error(
                `❌ Failed to remove progression role ${role.name}:`,
                error
            );
        }
    }

    for (
        const reward
        of highestRewards
    ) {
        const role =
            member.guild.roles.cache.get(
                reward.roleId
            );

        if (
            !role ||
            member.roles.cache.has(
                role.id
            ) ||
            !canManageRewardRole(
                role,
                botMember
            )
        ) {
            continue;
        }

        try {
            await member.roles.add(
                role,
                `Level reward • Level ${reward.level}`
            );

            grantedRoles.push(
                role
            );
        } catch (error) {
            console.error(
                `❌ Failed to grant progression role ${role.name}:`,
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
 * Find the Level Up channel.
 *
 * @param {import('discord.js').Message} message
 * @returns {Promise<import('discord.js').GuildTextBasedChannel|null>}
 */
async function getLevelUpChannel(
    message
) {
    const channel =
        await message.guild.channels
            .fetch(
                LEVEL_UP_CHANNEL_ID
            )
            .catch(
                () => null
            );

    if (
        !channel ||
        !channel.isTextBased() ||
        channel.isThread()
    ) {
        console.warn(
            `⚠️ Level Up channel not found: ${LEVEL_UP_CHANNEL_ID}`
        );

        return null;
    }

    const botMember =
        message.guild.members.me;

    const permissions =
        botMember
            ? channel.permissionsFor(
                botMember
            )
            : null;

    if (
        !permissions?.has([
            PermissionFlagsBits.ViewChannel,
            PermissionFlagsBits.SendMessages,
            PermissionFlagsBits.EmbedLinks,
            PermissionFlagsBits.AttachFiles
        ])
    ) {
        console.warn(
            `⚠️ Evelynn cannot publish Level Up messages in #${channel.name}.`
        );

        return null;
    }

    return channel;
}

/**
 * Send a compact Level Up
 * announcement.
 *
 * @param {import('discord.js').Message} message
 * @param {Object} levelResult
 * @param {Object} rewardResult
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

    if (
        !targetChannel
    ) {
        return;
    }

    const banner =
        getLevelBanner(
            levelResult.newLevel
        );

    const description = [
        `${message.author} reached **Level ${levelResult.newLevel}**.`
    ];

    if (
        rewardResult.grantedRoles.length >
        0
    ) {
        description.push(
            '',
            `◆ ${rewardResult.grantedRoles
                .map(
                    role =>
                        `${role}`
                )
                .join(' ')}`
        );
    }

    const embed =
        createEmbed({
            title:
                '⚡ LEVEL UP',

            description:
                description.join(
                    '\n'
                ),

            color:
                banner.color,

            thumbnail:
                message.author
                    .displayAvatarURL({
                        size:
                            256,

                        forceStatic:
                            false
                    }),

            author: {
                name:
                    'Evelynn • THE Ⅹ SINS',

                iconURL:
                    message.client.user
                        .displayAvatarURL({
                            size:
                                128,

                            forceStatic:
                                false
                        })
            },

            footer: {
                text:
                    'TTS • Progression'
            }
        });

    let bannerAttachment =
        null;

    if (
        fs.existsSync(
            banner.filePath
        )
    ) {
        bannerAttachment =
            new AttachmentBuilder(
                banner.filePath,
                {
                    name:
                        banner.fileName
                }
            );

        embed.setImage(
            `attachment://${banner.fileName}`
        );
    } else {
        console.warn(
            `⚠️ Level Up banner not found: ${banner.filePath}`
        );
    }

    try {
        await targetChannel.send({
            embeds: [
                embed
            ],

            files:
                bannerAttachment
                    ? [
                        bannerAttachment
                    ]
                    : [],

            allowedMentions: {
                users: [
                    message.author.id
                ],

                roles:
                    rewardResult
                        .grantedRoles
                        .map(
                            role =>
                                role.id
                        )
            }
        });
    } catch (error) {
        console.error(
            '❌ Level Up notification failed:',
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
        message.webhookId ||
        !message.member
    ) {
        return;
    }

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

    if (
        !hasMeaningfulContent(
            message.content ??
            ''
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

    await sendLevelUpMessage(
        message,
        levelResult,
        rewardResult
    );

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

    console.log(
        `⚡ Level Up: ${message.author.tag} • ${levelResult.previousLevel} → ${levelResult.newLevel}`
    );
}

module.exports = {
    name:
        Events.MessageCreate,

    once:
        false,

    /**
     * Run the Level System.
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
                '❌ Evelynn Level System error:',
                error
            );
        }
    }
};

/**
 * Remove expired duplicate
 * message records.
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

        10 *
        60 *
        1_000
    );

cleanupTimer.unref?.();