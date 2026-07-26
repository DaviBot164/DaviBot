const {
    Events,
    EmbedBuilder,
    PermissionFlagsBits
} = require('discord.js');

const automodConfig =
    require('../config/automod');

const {
    addAutoModCase
} = require('../database/automodCases');

const {
    detectScam
} = require('../utils/scamDetector');

/**
 * Rapid-message history.
 *
 * Key:
 * guildId:userId
 */
const messageHistory = new Map();

/**
 * Duplicate-message history.
 *
 * Key:
 * guildId:userId
 */
const duplicateHistory = new Map();

/**
 * Discord invite link pattern.
 */
const DISCORD_INVITE_PATTERN =
    /(?:https?:\/\/)?(?:www\.)?(?:discord\.gg|discord(?:app)?\.com\/invite)\/[a-zA-Z0-9-]+/i;

/**
 * Escape characters that have a special
 * meaning inside a regular expression.
 *
 * @param {string} value
 * @returns {string}
 */
function escapeRegExp(value) {
    return value.replace(
        /[.*+?^${}()|[\]\\]/g,
        '\\$&'
    );
}

/**
 * Convert common number and symbol replacements
 * back into normal letters.
 *
 * Examples:
 * f@ggot
 * sh1t
 * b1tch
 *
 * @param {string} content
 * @returns {string}
 */
function normalizeLeetCharacters(content) {
    return String(content)
        .toLowerCase()
        .replace(/[@4]/g, 'a')
        .replace(/8/g, 'b')
        .replace(/3/g, 'e')
        .replace(/[1!|]/g, 'i')
        .replace(/0/g, 'o')
        .replace(/[$5]/g, 's')
        .replace(/[7+]/g, 't');
}

/**
 * Normalize message content.
 *
 * @param {string} content
 * @returns {string}
 */
function normalizeContent(content) {
    return normalizeLeetCharacters(content)
        .normalize('NFKC')
        .replace(
            /[\u200B-\u200D\uFEFF]/g,
            ''
        )
        .replace(/\s+/g, ' ')
        .trim();
}

/**
 * Create a flexible regular expression for
 * one configured word or phrase.
 *
 * It allows separators between letters:
 *
 * f.u.c.k
 * f_u_c_k
 * f-u-c-k
 * ყ ლ ე
 * ყ.ლ.ე
 *
 * @param {string} configuredWord
 * @returns {RegExp|null}
 */
function createProfanityPattern(
    configuredWord
) {
    const normalizedWord =
        normalizeContent(
            configuredWord
        );

    if (!normalizedWord) {
        return null;
    }

    const characters =
        Array.from(
            normalizedWord
        );

    const separatorPattern =
        '[\\s._*~`\\-–—|/\\\\]*';

    const wordPattern =
        characters
            .map(character => {
                if (character === ' ') {
                    return (
                        '[\\s._*~`\\-–—|/\\\\]+'
                    );
                }

                return escapeRegExp(
                    character
                );
            })
            .join(
                separatorPattern
            );

    /*
     * Unicode-aware boundaries prevent words
     * from matching inside unrelated words.
     */
    return new RegExp(
        `(^|[^\\p{L}\\p{N}])${wordPattern}(?=$|[^\\p{L}\\p{N}])`,
        'iu'
    );
}

/**
 * Search one configured word list.
 *
 * @param {string} content
 * @param {string[]} words
 * @returns {string|null}
 */
function findWordFromList(
    content,
    words
) {
    const normalizedContent =
        normalizeContent(content);

    for (const word of words) {
        const pattern =
            createProfanityPattern(
                word
            );

        if (
            pattern &&
            pattern.test(
                normalizedContent
            )
        ) {
            return word;
        }
    }

    return null;
}

/**
 * Detect configured profanity.
 *
 * @param {string} content
 * @returns {{
 *   word: string,
 *   severity: 'warning'|'timeout'
 * }|null}
 */
function findBadWord(content) {
    if (
        !automodConfig.badWords ||
        !automodConfig.badWords.enabled
    ) {
        return null;
    }

    const timeoutWord =
        findWordFromList(
            content,

            automodConfig.badWords
                .timeoutWords ?? []
        );

    if (timeoutWord) {
        return {
            word: timeoutWord,
            severity: 'timeout'
        };
    }

    const warningWord =
        findWordFromList(
            content,

            automodConfig.badWords
                .warningWords ?? []
        );

    if (warningWord) {
        return {
            word: warningWord,
            severity: 'warning'
        };
    }

    return null;
}

/**
 * Check whether a member bypasses AutoMod.
 *
 * @param {import('discord.js').GuildMember} member
 * @returns {boolean}
 */
function shouldBypassAutoMod(member) {
    if (!member) {
        return false;
    }

    if (
        member.id ===
        member.guild.ownerId
    ) {
        return true;
    }

    const permissionMap = {
        Administrator:
            PermissionFlagsBits.Administrator,

        ManageMessages:
            PermissionFlagsBits.ManageMessages
    };

    const bypassPermissions =
        Array.isArray(
            automodConfig.bypassPermissions
        )
            ? automodConfig.bypassPermissions
            : [];

    return bypassPermissions.some(
        permissionName => {
            const permission =
                permissionMap[
                    permissionName
                ];

            if (!permission) {
                return false;
            }

            return member.permissions.has(
                permission
            );
        }
    );
}

/**
 * Detect rapid-message spam.
 *
 * @param {import('discord.js').Message} message
 * @returns {boolean}
 */
function isMessageSpam(message) {
    if (
        !automodConfig.spam ||
        !automodConfig.spam.enabled
    ) {
        return false;
    }

    const key =
        `${message.guild.id}:` +
        `${message.author.id}`;

    const now =
        Date.now();

    const minimumTimestamp =
        now -
        automodConfig.spam
            .intervalMilliseconds;

    const previousTimestamps =
        messageHistory.get(key) ??
        [];

    const activeTimestamps =
        previousTimestamps.filter(
            timestamp =>
                timestamp >=
                minimumTimestamp
        );

    activeTimestamps.push(
        now
    );

    messageHistory.set(
        key,
        activeTimestamps
    );

    return (
        activeTimestamps.length >=
        automodConfig.spam
            .messageLimit
    );
}

/**
 * Detect repeated-message spam.
 *
 * @param {import('discord.js').Message} message
 * @returns {boolean}
 */
function isDuplicateSpam(message) {
    if (
        !automodConfig
            .duplicateMessages ||
        !automodConfig
            .duplicateMessages
            .enabled
    ) {
        return false;
    }

    const normalizedContent =
        normalizeContent(
            message.content
        );

    if (!normalizedContent) {
        return false;
    }

    const key =
        `${message.guild.id}:` +
        `${message.author.id}`;

    const now =
        Date.now();

    const previousData =
        duplicateHistory.get(
            key
        );

    if (
        !previousData ||
        previousData.content !==
            normalizedContent ||
        now -
            previousData.firstMessageAt >
            automodConfig
                .duplicateMessages
                .intervalMilliseconds
    ) {
        duplicateHistory.set(
            key,
            {
                content:
                    normalizedContent,

                count:
                    1,

                firstMessageAt:
                    now
            }
        );

        return false;
    }

    previousData.count += 1;

    duplicateHistory.set(
        key,
        previousData
    );

    return (
        previousData.count >=
        automodConfig
            .duplicateMessages
            .messageLimit
    );
}

/**
 * Count unique mentions.
 *
 * @param {import('discord.js').Message} message
 * @returns {number}
 */
function getMentionCount(message) {
    const userMentions =
        message.mentions.users.size;

    const roleMentions =
        message.mentions.roles.size;

    const everyoneMention =
        message.mentions.everyone
            ? 1
            : 0;

    return (
        userMentions +
        roleMentions +
        everyoneMention
    );
}

/**
 * Find Umbra AutoMod log channel.
 *
 * @param {import('discord.js').Guild} guild
 * @returns {import('discord.js').GuildTextBasedChannel|null}
 */
function findLogChannel(guild) {
    if (
        automodConfig.logChannelId
    ) {
        const channelById =
            guild.channels.cache.get(
                automodConfig
                    .logChannelId
            );

        if (
            channelById &&
            channelById.isTextBased()
        ) {
            return channelById;
        }
    }

    const channelByName =
        guild.channels.cache.find(
            channel =>
                channel.isTextBased() &&
                channel.name ===
                    automodConfig
                        .logChannelName
        );

    return channelByName ?? null;
}

/**
 * Send Umbra AutoMod log.
 *
 * @param {import('discord.js').Message} message
 * @param {string} reason
 * @param {string} action
 * @param {Object|null} savedCase
 * @returns {Promise<void>}
 */
async function sendAutoModLog(
    message,
    reason,
    action,
    savedCase
) {
    const logChannel =
        findLogChannel(
            message.guild
        );

    if (!logChannel) {
        console.warn(
            `⚠️ Umbra AutoMod log channel was not found in ${message.guild.name}.`
        );

        return;
    }

    const cleanContent =
        message.content
            ? message.content
                .slice(0, 1_000)
                .replace(
                    /```/g,
                    'ˋˋˋ'
                )
            : 'No text content';

    const caseNumber =
        savedCase?.id
            ? `#${savedCase.id}`
            : 'Not saved';

    const embed =
        new EmbedBuilder()
            .setColor(
                '#8B0000'
            )

            .setAuthor({
                name:
                    'Umbra AutoMod',

                iconURL:
                    message.client.user
                        .displayAvatarURL({
                            extension:
                                'png',

                            size:
                                256
                        })
            })

            .setTitle(
                `🛡️ AutoMod Case ${caseNumber}`
            )

            .setDescription(
                'Umbra detected and recorded a violation within the Order.'
            )

            .addFields(
                {
                    name:
                        '🌑 Soul',

                    value:
                        `${message.author}\n` +
                        `\`${message.author.id}\``,

                    inline:
                        true
                },
                {
                    name:
                        '📺 Channel',

                    value:
                        `${message.channel}\n` +
                        `\`${message.channel.id}\``,

                    inline:
                        true
                },
                {
                    name:
                        '🆔 Case ID',

                    value:
                        savedCase?.id
                            ? `\`${savedCase.id}\``
                            : '`Database error`',

                    inline:
                        false
                },
                {
                    name:
                        '🚨 Violation',

                    value:
                        reason,

                    inline:
                        false
                },
                {
                    name:
                        '🛡️ Guardian Action',

                    value:
                        action,

                    inline:
                        false
                },
                {
                    name:
                        '💬 Detected Message',

                    value:
                        `\`\`\`\n${cleanContent}\n\`\`\``,

                    inline:
                        false
                }
            )

            .setThumbnail(
                message.author
                    .displayAvatarURL({
                        extension:
                            'png',

                        size:
                            256
                    })
            )

            .setTimestamp()

            .setFooter({
                text:
                    `🌑 Umbra • Soul ID: ${message.author.id}`
            });

    try {
        await logChannel.send({
            embeds: [
                embed
            ]
        });
    } catch (error) {
        console.error(
            '❌ Failed to send Umbra AutoMod log:'
        );

        console.error(
            error
        );
    }
}

/**
 * Delete a violating message.
 *
 * @param {import('discord.js').Message} message
 * @returns {Promise<boolean>}
 */
async function deleteViolationMessage(
    message
) {
    if (!message.deletable) {
        console.warn(
            `⚠️ Umbra cannot delete a message in #${message.channel.name}.`
        );

        return false;
    }

    try {
        await message.delete();

        return true;
    } catch (error) {
        console.error(
            '❌ Umbra AutoMod failed to delete a message:'
        );

        console.error(
            error
        );

        return false;
    }
}

/**
 * Apply a Discord timeout.
 *
 * @param {import('discord.js').GuildMember} member
 * @param {number} duration
 * @param {string} reason
 * @returns {Promise<boolean>}
 */
async function applyTimeout(
    member,
    duration,
    reason
) {
    if (
        !member?.moderatable
    ) {
        return false;
    }

    try {
        await member.timeout(
            duration,
            `Umbra AutoMod: ${reason}`
        );

        return true;
    } catch (error) {
        console.error(
            '❌ Umbra AutoMod failed to timeout a member:'
        );

        console.error(
            error
        );

        return false;
    }
}

/**
 * Send a temporary channel warning.
 *
 * @param {import('discord.js').Message} message
 * @param {string} warningText
 * @returns {Promise<void>}
 */
async function sendTemporaryWarning(
    message,
    warningText
) {
    if (
        !message.channel.isTextBased()
    ) {
        return;
    }

    try {
        const warningMessage =
            await message.channel.send({
                content:
                    `${message.author}, 🌑 **Umbra Guardian:** ${warningText}`
            });

        const warningTimer =
            setTimeout(
                async () => {
                    try {
                        if (
                            warningMessage
                                .deletable
                        ) {
                            await warningMessage
                                .delete();
                        }
                    } catch {
                        /*
                         * The warning may
                         * already be deleted.
                         */
                    }
                },

                automodConfig
                    .warningDeleteDelayMilliseconds
            );

        if (
            typeof warningTimer.unref ===
            'function'
        ) {
            warningTimer.unref();
        }
    } catch (error) {
        console.error(
            '❌ Failed to send Umbra AutoMod warning:'
        );

        console.error(
            error
        );
    }
}

/**
 * Save an AutoMod case.
 *
 * @param {import('discord.js').Message} message
 * @param {Object} violation
 * @param {string} action
 * @param {boolean} deleted
 * @param {boolean} timedOut
 * @returns {Promise<Object|null>}
 */
async function saveAutoModCase(
    message,
    violation,
    action,
    deleted,
    timedOut
) {
    try {
        const savedCase =
            await addAutoModCase({
                guildId:
                    message.guild.id,

                userId:
                    message.author.id,

                channelId:
                    message.channel.id,

                reason:
                    violation.reason,

                action,

                messageContent:
                    message.content
                        ? message.content
                            .slice(
                                0,
                                4_000
                            )
                        : null,

                messageDeleted:
                    deleted,

                timeoutApplied:
                    timedOut,

                timeoutDurationMilliseconds:
                    violation
                        .timeoutDuration ??
                    null
            });

        console.log(
            `🛡️ Umbra AutoMod Case #${savedCase.id} saved for ${message.author.tag}.`
        );

        return savedCase;
    } catch (error) {
        console.error(
            '❌ Failed to save Umbra AutoMod case:'
        );

        console.error(
            error
        );

        return null;
    }
}

/**
 * Process an Umbra AutoMod violation.
 *
 * @param {import('discord.js').Message} message
 * @param {{
 *   reason: string,
 *   warning: string,
 *   timeoutDuration?: number
 * }} violation
 * @returns {Promise<void>}
 */
async function processViolation(
    message,
    violation
) {
    const deleted =
        await deleteViolationMessage(
            message
        );

    let timedOut =
        false;

    if (
        violation.timeoutDuration
    ) {
        timedOut =
            await applyTimeout(
                message.member,

                violation
                    .timeoutDuration,

                violation.reason
            );
    }

    const actions = [];

    actions.push(
        deleted
            ? 'Message deleted'
            : 'Message could not be deleted'
    );

    if (
        violation.timeoutDuration
    ) {
        actions.push(
            timedOut
                ? 'Soul timed out'
                : 'Timeout could not be applied'
        );
    }

    const action =
        actions.join(
            ' • '
        );

    const savedCase =
        await saveAutoModCase(
            message,
            violation,
            action,
            deleted,
            timedOut
        );

    await Promise.all([
        sendTemporaryWarning(
            message,
            violation.warning
        ),

        sendAutoModLog(
            message,
            violation.reason,
            action,
            savedCase
        )
    ]);
}

module.exports = {
    name:
        Events.MessageCreate,

    once:
        false,

    /**
     * Run Umbra AutoMod for every
     * new server message.
     *
     * @param {import('discord.js').Message} message
     * @returns {Promise<void>}
     */
    async execute(message) {
        if (
            !automodConfig.enabled
        ) {
            return;
        }

        if (
            !message.inGuild()
        ) {
            return;
        }

        if (
            message.author.bot
        ) {
            return;
        }

        if (
            !message.member
        ) {
            return;
        }

        if (
            shouldBypassAutoMod(
                message.member
            )
        ) {
            return;
        }

        const content =
            message.content ?? '';

        /*
         * Umbra Scam Shield
         */
        if (
            automodConfig
                .scamProtection
                ?.enabled
        ) {
            const scamResult =
                detectScam(
                    content,
                    {
                        timeoutMilliseconds:
                            automodConfig
                                .scamProtection
                                .timeoutMilliseconds
                    }
                );

            if (
                scamResult.detected
            ) {
                await processViolation(
                    message,
                    {
                        reason:
                            scamResult.reason,

                        warning:
                            scamResult.warning,

                        timeoutDuration:
                            scamResult
                                .timeoutDuration
                    }
                );

                return;
            }
        }

        /*
         * Discord invite protection.
         */
        if (
            automodConfig
                .inviteProtection
                ?.enabled &&
            DISCORD_INVITE_PATTERN
                .test(content)
        ) {
            await processViolation(
                message,
                {
                    reason:
                        'Unauthorized Discord invite',

                    warning:
                        'Discord invite links are not allowed within this Order.'
                }
            );

            return;
        }

        /*
         * Umbra Profanity Shield
         */
        const badWordResult =
            findBadWord(
                content
            );

        if (badWordResult) {
            if (
                badWordResult.severity ===
                'timeout'
            ) {
                await processViolation(
                    message,
                    {
                        reason:
                            'Severe profanity or abusive language detected',

                        warning:
                            'severe profanity and abusive language violate the Sacred Laws.',

                        timeoutDuration:
                            automodConfig
                                .badWords
                                .timeoutMilliseconds
                    }
                );
            } else {
                await processViolation(
                    message,
                    {
                        reason:
                            'Insulting language detected',

                        warning:
                            'insulting language violates the Sacred Laws.'
                    }
                );
            }

            return;
        }

        /*
         * Mention-spam protection.
         */
        const mentionCount =
            getMentionCount(
                message
            );

        if (
            automodConfig
                .mentionSpam
                ?.enabled &&
            mentionCount >=
                automodConfig
                    .mentionSpam
                    .mentionLimit
        ) {
            await processViolation(
                message,
                {
                    reason:
                        `Mention spam (${mentionCount} mentions)`,

                    warning:
                        'mention spam is not allowed within this Order.',

                    timeoutDuration:
                        automodConfig
                            .mentionSpam
                            .timeoutMilliseconds
                }
            );

            return;
        }

        /*
         * Duplicate-message protection.
         */
        if (
            isDuplicateSpam(
                message
            )
        ) {
            await processViolation(
                message,
                {
                    reason:
                        'Repeated-message spam',

                    warning:
                        'do not send the same message repeatedly.',

                    timeoutDuration:
                        automodConfig
                            .duplicateMessages
                            .timeoutMilliseconds
                }
            );

            duplicateHistory.delete(
                `${message.guild.id}:` +
                `${message.author.id}`
            );

            return;
        }

        /*
         * Rapid-message protection.
         */
        if (
            isMessageSpam(
                message
            )
        ) {
            await processViolation(
                message,
                {
                    reason:
                        'Rapid message spam',

                    warning:
                        'you are sending messages too quickly.',

                    timeoutDuration:
                        automodConfig
                            .spam
                            .timeoutMilliseconds
                }
            );

            messageHistory.delete(
                `${message.guild.id}:` +
                `${message.author.id}`
            );
        }
    }
};

/**
 * Remove expired spam tracking
 * information from memory.
 */
const cleanupTimer =
    setInterval(
        () => {
            const now =
                Date.now();

            if (
                automodConfig.spam
            ) {
                for (
                    const [
                        key,
                        timestamps
                    ]
                    of messageHistory
                        .entries()
                ) {
                    const activeTimestamps =
                        timestamps.filter(
                            timestamp =>
                                now -
                                    timestamp <
                                automodConfig
                                    .spam
                                    .intervalMilliseconds
                        );

                    if (
                        activeTimestamps
                            .length === 0
                    ) {
                        messageHistory.delete(
                            key
                        );
                    } else {
                        messageHistory.set(
                            key,
                            activeTimestamps
                        );
                    }
                }
            }

            if (
                automodConfig
                    .duplicateMessages
            ) {
                for (
                    const [
                        key,
                        data
                    ]
                    of duplicateHistory
                        .entries()
                ) {
                    if (
                        now -
                            data.firstMessageAt >
                        automodConfig
                            .duplicateMessages
                            .intervalMilliseconds
                    ) {
                        duplicateHistory.delete(
                            key
                        );
                    }
                }
            }
        },

        60_000
    );

if (
    typeof cleanupTimer.unref ===
    'function'
) {
    cleanupTimer.unref();
}