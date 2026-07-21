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

/**
 * Recent message timestamps used for spam detection.
 *
 * Key:
 * guildId:userId
 */
const messageHistory = new Map();

/**
 * Repeated-message history.
 *
 * Key:
 * guildId:userId
 */
const duplicateHistory = new Map();

const DISCORD_INVITE_PATTERN =
    /(?:https?:\/\/)?(?:www\.)?(?:discord\.gg|discord(?:app)?\.com\/invite)\/[a-zA-Z0-9-]+/i;

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

    if (member.id === member.guild.ownerId) {
        return true;
    }

    const permissionMap = {
        Administrator:
            PermissionFlagsBits.Administrator,

        ManageMessages:
            PermissionFlagsBits.ManageMessages
    };

    return automodConfig.bypassPermissions.some(
        permissionName => {
            const permission =
                permissionMap[permissionName];

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
 * Normalize content for comparisons.
 *
 * @param {string} content
 * @returns {string}
 */
function normalizeContent(content) {
    return content
        .toLowerCase()
        .replace(/\s+/g, ' ')
        .trim();
}

/**
 * Detect a configured forbidden word.
 *
 * @param {string} content
 * @returns {string|null}
 */
function findBadWord(content) {
    if (!automodConfig.badWords.enabled) {
        return null;
    }

    const normalizedContent =
        normalizeContent(content);

    for (
        const configuredWord
        of automodConfig.badWords.words
    ) {
        const normalizedWord =
            normalizeContent(configuredWord);

        if (!normalizedWord) {
            continue;
        }

        if (
            normalizedContent.includes(
                normalizedWord
            )
        ) {
            return configuredWord;
        }
    }

    return null;
}

/**
 * Detect rapid-message spam.
 *
 * @param {import('discord.js').Message} message
 * @returns {boolean}
 */
function isMessageSpam(message) {
    if (!automodConfig.spam.enabled) {
        return false;
    }

    const key =
        `${message.guild.id}:${message.author.id}`;

    const now = Date.now();

    const minimumTimestamp =
        now -
        automodConfig.spam
            .intervalMilliseconds;

    const previousTimestamps =
        messageHistory.get(key) ?? [];

    const activeTimestamps =
        previousTimestamps.filter(
            timestamp =>
                timestamp >= minimumTimestamp
        );

    activeTimestamps.push(now);

    messageHistory.set(
        key,
        activeTimestamps
    );

    return (
        activeTimestamps.length >=
        automodConfig.spam.messageLimit
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
            .duplicateMessages
            .enabled
    ) {
        return false;
    }

    const normalizedContent =
        normalizeContent(message.content);

    if (!normalizedContent) {
        return false;
    }

    const key =
        `${message.guild.id}:${message.author.id}`;

    const now = Date.now();

    const previousData =
        duplicateHistory.get(key);

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
                content: normalizedContent,
                count: 1,
                firstMessageAt: now
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
 * Find the configured AutoMod log channel.
 *
 * @param {import('discord.js').Guild} guild
 * @returns {import('discord.js').GuildTextBasedChannel|null}
 */
function findLogChannel(guild) {
    if (automodConfig.logChannelId) {
        const channelById =
            guild.channels.cache.get(
                automodConfig.logChannelId
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
                    automodConfig.logChannelName
        );

    return channelByName ?? null;
}

/**
 * Send an AutoMod log embed.
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
        findLogChannel(message.guild);

    if (!logChannel) {
        console.warn(
            `⚠️ AutoMod log channel was not found in ${message.guild.name}.`
        );

        return;
    }

    const cleanContent =
        message.content
            ? message.content
                .slice(0, 1_000)
                .replace(/```/g, 'ˋˋˋ')
            : 'No text content';

    const caseNumber =
        savedCase?.id
            ? `#${savedCase.id}`
            : 'Not saved';

    const embed = new EmbedBuilder()
        .setColor('#8B0000')
        .setAuthor({
            name: 'Seraphiel AutoMod',
            iconURL:
                message.client.user
                    .displayAvatarURL({
                        extension: 'png',
                        size: 256
                    })
        })
        .setTitle(
            `🛡️ AutoMod Case ${caseNumber}`
        )
        .addFields(
            {
                name: 'Member',
                value:
                    `${message.author} ` +
                    `(\`${message.author.id}\`)`,
                inline: false
            },
            {
                name: 'Channel',
                value: `${message.channel}`,
                inline: true
            },
            {
                name: 'Case ID',
                value: savedCase?.id
                    ? `\`${savedCase.id}\``
                    : '`Database error`',
                inline: true
            },
            {
                name: 'Reason',
                value: reason,
                inline: false
            },
            {
                name: 'Action',
                value: action,
                inline: false
            },
            {
                name: 'Message',
                value:
                    `\`\`\`\n${cleanContent}\n\`\`\``,
                inline: false
            }
        )
        .setThumbnail(
            message.author
                .displayAvatarURL({
                    extension: 'png',
                    size: 256
                })
        )
        .setTimestamp()
        .setFooter({
            text:
                `User ID: ${message.author.id}`
        });

    try {
        await logChannel.send({
            embeds: [embed]
        });
    } catch (error) {
        console.error(
            '❌ Failed to send AutoMod log:'
        );

        console.error(error);
    }
}

/**
 * Delete a violating message.
 *
 * @param {import('discord.js').Message} message
 * @returns {Promise<boolean>}
 */
async function deleteViolationMessage(message) {
    if (!message.deletable) {
        console.warn(
            `⚠️ Seraphiel cannot delete a message in #${message.channel.name}.`
        );

        return false;
    }

    try {
        await message.delete();

        return true;
    } catch (error) {
        console.error(
            '❌ AutoMod failed to delete a message:'
        );

        console.error(error);

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
    if (!member?.moderatable) {
        return false;
    }

    try {
        await member.timeout(
            duration,
            `Seraphiel AutoMod: ${reason}`
        );

        return true;
    } catch (error) {
        console.error(
            '❌ AutoMod failed to timeout a member:'
        );

        console.error(error);

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
    if (!message.channel.isTextBased()) {
        return;
    }

    try {
        const warningMessage =
            await message.channel.send({
                content:
                    `${message.author}, ${warningText}`
            });

        setTimeout(
            async () => {
                try {
                    if (
                        warningMessage.deletable
                    ) {
                        await warningMessage
                            .delete();
                    }
                } catch {
                    // Warning may already be deleted.
                }
            },
            automodConfig
                .warningDeleteDelayMilliseconds
        );
    } catch (error) {
        console.error(
            '❌ Failed to send AutoMod warning:'
        );

        console.error(error);
    }
}

/**
 * Save a completed moderation action.
 *
 * Database failure must not stop AutoMod protection.
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
                            .slice(0, 4_000)
                        : null,

                messageDeleted:
                    deleted,

                timeoutApplied:
                    timedOut,

                timeoutDurationMilliseconds:
                    violation.timeoutDuration ??
                    null
            });

        console.log(
            `🛡️ AutoMod Case #${savedCase.id} saved for ${message.author.tag}.`
        );

        return savedCase;
    } catch (error) {
        console.error(
            '❌ Failed to save AutoMod case:'
        );

        console.error(error);

        return null;
    }
}

/**
 * Process an AutoMod violation.
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
        await deleteViolationMessage(message);

    let timedOut = false;

    if (violation.timeoutDuration) {
        timedOut = await applyTimeout(
            message.member,
            violation.timeoutDuration,
            violation.reason
        );
    }

    const actions = [];

    actions.push(
        deleted
            ? 'Message deleted'
            : 'Message could not be deleted'
    );

    if (violation.timeoutDuration) {
        actions.push(
            timedOut
                ? 'Member timed out'
                : 'Timeout could not be applied'
        );
    }

    const action =
        actions.join(' • ');

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
    name: Events.MessageCreate,

    /**
     * Run AutoMod whenever a message is created.
     *
     * @param {import('discord.js').Message} message
     * @returns {Promise<void>}
     */
    async execute(message) {
        if (!automodConfig.enabled) {
            return;
        }

        if (!message.inGuild()) {
            return;
        }

        if (message.author.bot) {
            return;
        }

        if (!message.member) {
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
         * Discord invite protection
         */
        if (
            automodConfig
                .inviteProtection
                .enabled &&
            DISCORD_INVITE_PATTERN
                .test(content)
        ) {
            await processViolation(
                message,
                {
                    reason:
                        'Unauthorized Discord invite',

                    warning:
                        'Discord invite links are not allowed here.'
                }
            );

            return;
        }

        /*
         * Bad-word protection
         */
        const badWord =
            findBadWord(content);

        if (badWord) {
            await processViolation(
                message,
                {
                    reason:
                        'Forbidden language detected',

                    warning:
                        'that language is not allowed on this server.'
                }
            );

            return;
        }

        /*
         * Mention-spam protection
         */
        const mentionCount =
            getMentionCount(message);

        if (
            automodConfig
                .mentionSpam
                .enabled &&
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
                        'mention spam is not allowed.',

                    timeoutDuration:
                        automodConfig
                            .mentionSpam
                            .timeoutMilliseconds
                }
            );

            return;
        }

        /*
         * Repeated-message protection
         */
        if (isDuplicateSpam(message)) {
            await processViolation(
                message,
                {
                    reason:
                        'Repeated-message spam',

                    warning:
                        'stop sending the same message repeatedly.',

                    timeoutDuration:
                        automodConfig
                            .duplicateMessages
                            .timeoutMilliseconds
                }
            );

            duplicateHistory.delete(
                `${message.guild.id}:${message.author.id}`
            );

            return;
        }

        /*
         * Rapid-message protection
         */
        if (isMessageSpam(message)) {
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
                `${message.guild.id}:${message.author.id}`
            );
        }
    }
};

/**
 * Remove expired tracking data.
 */
setInterval(
    () => {
        const now = Date.now();

        for (
            const [key, timestamps]
            of messageHistory.entries()
        ) {
            const activeTimestamps =
                timestamps.filter(
                    timestamp =>
                        now - timestamp <
                        automodConfig
                            .spam
                            .intervalMilliseconds
                );

            if (
                activeTimestamps.length === 0
            ) {
                messageHistory.delete(key);
            } else {
                messageHistory.set(
                    key,
                    activeTimestamps
                );
            }
        }

        for (
            const [key, data]
            of duplicateHistory.entries()
        ) {
            if (
                now -
                    data.firstMessageAt >
                automodConfig
                    .duplicateMessages
                    .intervalMilliseconds
            ) {
                duplicateHistory.delete(key);
            }
        }
    },
    60_000
);