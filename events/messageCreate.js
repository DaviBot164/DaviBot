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
    sendAchievementFeed,
    sendTitleFeed
} = require('../utils/kingdomFeed');

/**
 * Rapid-message history.
 *
 * Key:
 * guildId:userId
 */
const messageHistory =
    new Map();

/**
 * Duplicate-message history.
 *
 * Key:
 * guildId:userId
 */
const duplicateHistory =
    new Map();

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
function escapeRegExp(
    value
) {
    return value.replace(
        /[.*+?^${}()|[\]\\]/g,
        '\\$&'
    );
}

/**
 * Convert common number and symbol
 * replacements back into normal letters.
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
 * Create a flexible regular expression
 * for one configured word or phrase.
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
                if (
                    character ===
                    ' '
                ) {
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
 *     word: string,
 *     severity: 'warning'|'timeout'
 * }|null}
 */
function findBadWord(
    content
) {
    if (
        !automodConfig.badWords ||
        !automodConfig
            .badWords
            .enabled
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

    if (timeoutWord) {
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

    if (warningWord) {
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
 * Check whether a member bypasses
 * Guardian AutoMod.
 *
 * @param {import('discord.js').GuildMember} member
 * @returns {boolean}
 */
function shouldBypassAutoMod(
    member
) {
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

            if (!permission) {
                return false;
            }

            return member
                .permissions
                .has(
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
function isMessageSpam(
    message
) {
    if (
        !automodConfig.spam ||
        !automodConfig
            .spam
            .enabled
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
        automodConfig
            .spam
            .intervalMilliseconds;

    const previousTimestamps =
        messageHistory.get(
            key
        ) ??
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
        automodConfig
            .spam
            .messageLimit
    );
}/**
 * Detect repeated-message spam.
 *
 * @param {import('discord.js').Message} message
 * @returns {boolean}
 */
function isDuplicateSpam(
    message
) {
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

    previousData.count +=
        1;

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
function getMentionCount(
    message
) {
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
 * Send newly unlocked Achievements
 * into the official Soul Progression Feed.
 *
 * @param {import('discord.js').Message} message
 * @param {Object[]} achievements
 * @returns {Promise<void>}
 */
async function sendAchievementFeeds(
    message,
    achievements
) {
    if (
        !Array.isArray(
            achievements
        ) ||
        achievements.length ===
            0
    ) {
        return;
    }

    for (
        const achievement
        of achievements
    ) {
        await sendAchievementFeed({
            member:
                message.member,

            achievement,

            source:
                'Message activity or Soul progression'
        });
    }
}

/**
 * Run progression systems after a valid
 * message passes every Guardian check.
 *
 * Order:
 * 1. Achievement System
 * 2. Achievement Soul Progression Feed
 * 3. Title System
 * 4. Title Soul Progression Feed
 *
 * Title notifications are no longer sent
 * into the member's current channel.
 *
 * @param {import('discord.js').Message} message
 * @returns {Promise<void>}
 */
async function checkMessageProgression(
    message
) {
    let unlockedAchievements =
        [];

    try {
        const achievementResult =
            await checkMessageAchievements(
                message
            );

        unlockedAchievements =
            Array.isArray(
                achievementResult
            )
                ? achievementResult
                : [];
    } catch (error) {
        console.error(
            '❌ Umbra Achievement check failed:'
        );

        console.error(
            error
        );
    }

    if (
        unlockedAchievements.length >
        0
    ) {
        console.log(
            `🏆 ${unlockedAchievements.length} new Achievement(s) unlocked for ${message.author.tag}.`
        );

        await sendAchievementFeeds(
            message,
            unlockedAchievements
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
            '❌ Umbra Title check failed:'
        );

        console.error(
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
        `🏷️ ${newlyUnlockedTitles.length} new Title(s) unlocked for ${message.author.tag}.`
    );

    /*
     * Chronicle Titles are now published
     * only inside the configured
     * Soul Progression Feed.
     */
    await sendTitleFeed({
        member:
            message.member,

        titles:
            newlyUnlockedTitles,

        source:
            'Soul Level, Achievement or spiritual progression'
    });
}

/**
 * Find Umbra AutoMod log channel.
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

    return (
        channelByName ??
        null
    );
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
                'Umbra detected and recorded a violation within Las Noches.'
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
                            256,

                        forceStatic:
                            false
                    })
            )
            .setTimestamp()
            .setFooter({
                text:
                    `🌙 Umbra • Guardian of Las Noches • Soul ID: ${message.author.id}`
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
}/**
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
                    `${message.author}, 🌙 **Umbra Guardian:** ${warningText}`,

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
                         * The warning may already
                         * have been deleted.
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

    const actions =
        [];

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
     * Umbra Guardian entry point.
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

            /*
             * Progression remains active when
             * AutoMod itself is disabled.
             */
            if (
                !automodConfig.enabled
            ) {
                await checkMessageProgression(
                    message
                );

                return;
            }

            /*
             * Staff and other configured bypass
             * members skip moderation checks,
             * but still receive progression.
             */
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

            /*
             * Scam / phishing detection.
             */
            const scamResult =
                detectScam(
                    message.content
                );

            if (
                scamResult.detected
            ) {
                const scamType =
                    scamResult.scamType ||
                    'Suspicious scam activity';

                await processViolation(
                    message,
                    {
                        reason:
                            `Scam or Phishing Detected (${scamType})`,

                        warning:
                            scamResult.warning ||
                            'Your message contained suspicious scam or phishing content and has been removed.',

                        timeoutDuration:
                            scamResult.timeoutDuration ??
                            automodConfig
                                .scamProtection
                                ?.timeoutMilliseconds
                    }
                );

                return;
            }

            /*
             * Discord invite protection.
             */
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

            /*
             * Bad word detection.
             */
            const badWord =
                findBadWord(
                    message.content
                );

            if (badWord) {
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

            /*
             * Rapid-message spam.
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

            /*
             * Duplicate-message spam.
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

            /*
             * Mention spam.
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

            /*
             * Safe message.
             * Run progression systems.
             */
            await checkMessageProgression(
                message
            );
        } catch (error) {
            console.error(
                '❌ Umbra MessageCreate error:'
            );

            console.error(
                error
            );
        }
    }
};/*
 * Periodically clean cached spam history.
 *
 * This prevents old member activity from
 * remaining in memory indefinitely.
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
                const filtered =
                    timestamps.filter(
                        timestamp =>
                            now -
                                timestamp <
                            spamWindow
                    );

                if (
                    filtered.length ===
                    0
                ) {
                    messageHistory.delete(
                        key
                    );
                } else {
                    messageHistory.set(
                        key,
                        filtered
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

/*
 * The cleanup interval must not keep
 * the Node.js process alive by itself.
 */
if (
    typeof cleanupTimer.unref ===
    'function'
) {
    cleanupTimer.unref();
}