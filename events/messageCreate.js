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

const {
    checkMessageAchievements
} = require('../handlers/achievementHandler');

const {
    checkMessageTitles
} = require('../handlers/titleHandler');

const {
    sendTitleFeed
} = require('../utils/kingdomFeed');

const messageHistory =
    new Map();

const duplicateHistory =
    new Map();

const DISCORD_INVITE_PATTERN =
    /(?:https?:\/\/)?(?:www\.)?(?:discord\.gg|discord(?:app)?\.com\/invite)\/[a-zA-Z0-9-]+/i;

/**
 * Escape RegExp characters.
 *
 * @param {string} value
 * @returns {string}
 */
function escapeRegExp(
    value
) {
    return value.replace(
        /[.*+?^${}()|[\]\\]/g,
        '\\$&'
    );
}

/**
 * Normalize common leet replacements.
 *
 * @param {string} content
 * @returns {string}
 */
function normalizeLeetCharacters(
    content
) {
    return String(
        content
    )
        .toLowerCase()
        .replace(
            /[@4]/g,
            'a'
        )
        .replace(
            /8/g,
            'b'
        )
        .replace(
            /3/g,
            'e'
        )
        .replace(
            /[1!|]/g,
            'i'
        )
        .replace(
            /0/g,
            'o'
        )
        .replace(
            /[$5]/g,
            's'
        )
        .replace(
            /[7+]/g,
            't'
        );
}

/**
 * Normalize message content.
 *
 * @param {string} content
 * @returns {string}
 */
function normalizeContent(
    content
) {
    return normalizeLeetCharacters(
        content
    )
        .normalize(
            'NFKC'
        )
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
 * Create a flexible profanity pattern.
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

    if (
        !normalizedWord
    ) {
        return null;
    }

    const separatorPattern =
        '[\\s._*~`\\-–—|/\\\\]*';

    const wordPattern =
        Array.from(
            normalizedWord
        )
            .map(
                character =>
                    character ===
                    ' '
                        ? '[\\s._*~`\\-–—|/\\\\]+'
                        : escapeRegExp(
                            character
                        )
            )
            .join(
                separatorPattern
            );

    return new RegExp(
        `(^|[^\\p{L}\\p{N}])${wordPattern}(?=$|[^\\p{L}\\p{N}])`,
        'iu'
    );
}

/**
 * Find a configured word.
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
        normalizeContent(
            content
        );

    for (
        const word
        of words
    ) {
        const pattern =
            createProfanityPattern(
                word
            );

        if (
            pattern?.test(
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
 *     word: string,
 *     severity: 'warning'|'timeout'
 * }|null}
 */
function findBadWord(
    content
) {
    if (
        !automodConfig
            .badWords
            ?.enabled
    ) {
        return null;
    }

    const timeoutWord =
        findWordFromList(
            content,
            automodConfig
                .badWords
                .timeoutWords ??
                []
        );

    if (
        timeoutWord
    ) {
        return {
            word:
                timeoutWord,

            severity:
                'timeout'
        };
    }

    const warningWord =
        findWordFromList(
            content,
            automodConfig
                .badWords
                .warningWords ??
                []
        );

    if (
        warningWord
    ) {
        return {
            word:
                warningWord,

            severity:
                'warning'
        };
    }

    return null;
}

/**
 * Check AutoMod bypass.
 *
 * @param {import('discord.js').GuildMember} member
 * @returns {boolean}
 */
function shouldBypassAutoMod(
    member
) {
    if (
        !member
    ) {
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
            PermissionFlagsBits
                .Administrator,

        ManageMessages:
            PermissionFlagsBits
                .ManageMessages
    };

    const bypassPermissions =
        Array.isArray(
            automodConfig
                .bypassPermissions
        )
            ? automodConfig
                .bypassPermissions
            : [];

    return bypassPermissions.some(
        permissionName => {
            const permission =
                permissionMap[
                    permissionName
                ];

            return Boolean(
                permission &&
                member.permissions.has(
                    permission
                )
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
function isMessageSpam(
    message
) {
    if (
        !automodConfig
            .spam
            ?.enabled
    ) {
        return false;
    }

    const key =
        `${message.guild.id}:${message.author.id}`;

    const now =
        Date.now();

    const minimumTimestamp =
        now -
        automodConfig
            .spam
            .intervalMilliseconds;

    const activeTimestamps =
        (
            messageHistory.get(
                key
            ) ??
            []
        ).filter(
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
        automodConfig
            .spam
            .messageLimit
    );
}

/**
 * Detect duplicate-message spam.
 *
 * @param {import('discord.js').Message} message
 * @returns {boolean}
 */
function isDuplicateSpam(
    message
) {
    if (
        !automodConfig
            .duplicateMessages
            ?.enabled
    ) {
        return false;
    }

    const normalizedContent =
        normalizeContent(
            message.content
        );

    if (
        !normalizedContent
    ) {
        return false;
    }

    const key =
        `${message.guild.id}:${message.author.id}`;

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

    previousData.count +=
        1;

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
function getMentionCount(
    message
) {
    return (
        message.mentions.users.size +
        message.mentions.roles.size +
        (
            message.mentions.everyone
                ? 1
                : 0
        )
    );
}/**
 * Run progression systems
 * for a valid message.
 *
 * @param {import('discord.js').Message} message
 * @returns {Promise<void>}
 */
async function checkMessageProgression(
    message
) {
    try {
        const achievements =
            await checkMessageAchievements(
                message
            );

        if (
            Array.isArray(
                achievements
            ) &&
            achievements.length >
            0
        ) {
            console.log(
                `🏆 ${achievements.length} Achievement(s) unlocked for ${message.author.tag}.`
            );
        }
    } catch (error) {
        console.error(
            '❌ Achievement check failed:',
            error
        );
    }

    let titleResult =
        null;

    try {
        titleResult =
            await checkMessageTitles(
                message
            );
    } catch (error) {
        console.error(
            '❌ Title check failed:',
            error
        );

        return;
    }

    const newlyUnlockedTitles =
        Array.isArray(
            titleResult?.newlyUnlocked
        )
            ? titleResult.newlyUnlocked
            : [];

    if (
        newlyUnlockedTitles.length ===
        0
    ) {
        return;
    }

    console.log(
        `♜ ${newlyUnlockedTitles.length} Title(s) unlocked for ${message.author.tag}.`
    );

    await sendTitleFeed({
        member:
            message.member,

        titles:
            newlyUnlockedTitles,

        source:
            'Automatic progression'
    });
}

/**
 * Find the AutoMod log channel.
 *
 * @param {import('discord.js').Guild} guild
 * @returns {import('discord.js').GuildTextBasedChannel|null}
 */
function findLogChannel(
    guild
) {
    if (
        automodConfig.logChannelId
    ) {
        const channel =
            guild.channels.cache.get(
                automodConfig
                    .logChannelId
            );

        if (
            channel?.isTextBased()
        ) {
            return channel;
        }
    }

    return (
        guild.channels.cache.find(
            channel =>
                channel.isTextBased() &&
                channel.name ===
                    automodConfig
                        .logChannelName
        ) ||
        null
    );
}

/**
 * Send a compact AutoMod log.
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

    if (
        !logChannel
    ) {
        return;
    }

    const cleanContent =
        message.content
            ? message.content
                .slice(
                    0,
                    1_000
                )
                .replace(
                    /```/g,
                    'ˋˋˋ'
                )
            : 'No text content';

    const caseNumber =
        savedCase?.id
            ? `#${savedCase.id}`
            : 'Unavailable';

    const embed =
        new EmbedBuilder()
            .setColor(
                '#8B0000'
            )
            .setAuthor({
                name:
                    'Evelynn • AutoMod',

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
                `🛡️ AutoMod Case ${caseNumber}`
            )
            .setDescription(
                'A message violation was detected.'
            )
            .addFields(
                {
                    name:
                        '✦・MEMBER',

                    value:
                        `${message.author}\n\`${message.author.id}\``,

                    inline:
                        true
                },

                {
                    name:
                        '📺・CHANNEL',

                    value:
                        `${message.channel}`,

                    inline:
                        true
                },

                {
                    name:
                        '🚨・VIOLATION',

                    value:
                        reason,

                    inline:
                        false
                },

                {
                    name:
                        '🛡️・ACTION',

                    value:
                        action,

                    inline:
                        false
                },

                {
                    name:
                        '💬・MESSAGE',

                    value:
                        `\`\`\`\n${cleanContent}\n\`\`\``,

                    inline:
                        false
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
                    'TTS • AutoMod'
            })
            .setTimestamp();

    try {
        await logChannel.send({
            embeds: [
                embed
            ]
        });
    } catch (error) {
        console.error(
            '❌ AutoMod log failed:',
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
    if (
        !message.deletable
    ) {
        return false;
    }

    try {
        await message.delete();

        return true;
    } catch (error) {
        console.error(
            '❌ AutoMod message delete failed:',
            error
        );

        return false;
    }
}

/**
 * Apply a timeout.
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
            `Evelynn AutoMod: ${reason}`
        );

        return true;
    } catch (error) {
        console.error(
            '❌ AutoMod timeout failed:',
            error
        );

        return false;
    }
}

/**
 * Send a temporary warning.
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
                    `${message.author}, **Evelynn AutoMod:** ${warningText}`,

                allowedMentions: {
                    users: [
                        message.author.id
                    ],

                    roles:
                        [],

                    repliedUser:
                        false
                }
            });

        const warningTimer =
            setTimeout(
                async () => {
                    if (
                        warningMessage.deletable
                    ) {
                        await warningMessage
                            .delete()
                            .catch(
                                () => null
                            );
                    }
                },

                automodConfig
                    .warningDeleteDelayMilliseconds
            );

        warningTimer.unref?.();
    } catch (error) {
        console.error(
            '❌ AutoMod warning failed:',
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
        return await addAutoModCase({
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
                    ? message.content.slice(
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
    } catch (error) {
        console.error(
            '❌ AutoMod case save failed:',
            error
        );

        return null;
    }
}

/**
 * Process an AutoMod violation.
 *
 * @param {import('discord.js').Message} message
 * @param {{
 *     reason: string,
 *     warning: string,
 *     timeoutDuration?: number|null
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

    const timedOut =
        violation.timeoutDuration
            ? await applyTimeout(
                message.member,
                violation.timeoutDuration,
                violation.reason
            )
            : false;

    const actions = [
        deleted
            ? 'Message deleted'
            : 'Delete failed'
    ];

    if (
        violation.timeoutDuration
    ) {
        actions.push(
            timedOut
                ? 'Member timed out'
                : 'Timeout failed'
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
}module.exports = {
    name:
        Events.MessageCreate,

    once:
        false,

    /**
     * Handle incoming server messages.
     *
     * AutoMod violations stop further
     * processing for that message.
     *
     * Safe messages continue into
     * progression systems.
     *
     * @param {import('discord.js').Message} message
     * @returns {Promise<void>}
     */
    async execute(
        message
    ) {
        try {
            if (
                !message.inGuild() ||
                message.author.bot ||
                message.webhookId
            ) {
                return;
            }

            if (
                !automodConfig.enabled
            ) {
                await checkMessageProgression(
                    message
                );

                return;
            }

            if (
                shouldBypassAutoMod(
                    message.member
                )
            ) {
                await checkMessageProgression(
                    message
                );

                return;
            }

            const scamResult =
                detectScam(
                    message.content
                );

            if (
                scamResult.detected
            ) {
                await processViolation(
                    message,
                    {
                        reason:
                            `Scam or Phishing (${scamResult.scamType || 'Suspicious Content'})`,

                        warning:
                            scamResult.warning ||
                            'Suspicious scam or phishing content was removed.',

                        timeoutDuration:
                            scamResult.timeoutDuration ??
                            automodConfig
                                .scamProtection
                                ?.timeoutMilliseconds
                    }
                );

                return;
            }

            if (
                automodConfig
                    .inviteProtection
                    ?.enabled &&
                DISCORD_INVITE_PATTERN.test(
                    message.content
                )
            ) {
                await processViolation(
                    message,
                    {
                        reason:
                            'Discord Invite',

                        warning:
                            'Advertising other Discord servers is not allowed.',

                        timeoutDuration:
                            automodConfig
                                .inviteProtection
                                ?.timeoutMilliseconds
                    }
                );

                return;
            }

            const badWord =
                findBadWord(
                    message.content
                );

            if (
                badWord
            ) {
                await processViolation(
                    message,
                    {
                        reason:
                            `Bad Word (${badWord.word})`,

                        warning:
                            'Please avoid offensive language.',

                        timeoutDuration:
                            badWord.severity ===
                            'timeout'
                                ? automodConfig
                                    .badWords
                                    ?.timeoutMilliseconds
                                : null
                    }
                );

                return;
            }

            if (
                isMessageSpam(
                    message
                )
            ) {
                await processViolation(
                    message,
                    {
                        reason:
                            'Spam Detection',

                        warning:
                            'Please slow down your messages.',

                        timeoutDuration:
                            automodConfig
                                .spam
                                ?.timeoutMilliseconds
                    }
                );

                return;
            }

            if (
                isDuplicateSpam(
                    message
                )
            ) {
                await processViolation(
                    message,
                    {
                        reason:
                            'Duplicate Messages',

                        warning:
                            'Repeated messages are not allowed.',

                        timeoutDuration:
                            automodConfig
                                .duplicateMessages
                                ?.timeoutMilliseconds
                    }
                );

                return;
            }

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
                            'Mention Spam',

                        warning:
                            'Too many mentions were detected.',

                        timeoutDuration:
                            automodConfig
                                .mentionSpam
                                ?.timeoutMilliseconds
                    }
                );

                return;
            }

            await checkMessageProgression(
                message
            );
        } catch (error) {
            console.error(
                '❌ Evelynn MessageCreate error:',
                error
            );
        }
    }
};

/**
 * Clean old spam history
 * from memory.
 */
const cleanupTimer =
    setInterval(
        () => {
            const now =
                Date.now();

            const spamWindow =
                automodConfig
                    .spam
                    ?.intervalMilliseconds ??
                30_000;

            const duplicateWindow =
                automodConfig
                    .duplicateMessages
                    ?.intervalMilliseconds ??
                300_000;

            for (
                const [
                    key,
                    timestamps
                ]
                of messageHistory.entries()
            ) {
                const active =
                    timestamps.filter(
                        timestamp =>
                            now -
                                timestamp <
                            spamWindow
                    );

                if (
                    active.length ===
                    0
                ) {
                    messageHistory.delete(
                        key
                    );
                } else {
                    messageHistory.set(
                        key,
                        active
                    );
                }
            }

            for (
                const [
                    key,
                    data
                ]
                of duplicateHistory.entries()
            ) {
                if (
                    now -
                        data.firstMessageAt >
                    duplicateWindow
                ) {
                    duplicateHistory.delete(
                        key
                    );
                }
            }
        },

        5 *
        60 *
        1_000
    );

cleanupTimer.unref?.();