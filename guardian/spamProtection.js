const {
    addMessageTimestamp,
    trackRepeatedMessage,
    addViolation,
    resetViolations
} = require('./cache');

const {
    saveGuardianWarning,
    deleteViolatingMessage,
    sendTemporaryWarning,
    timeoutMember
} = require('./punishments');

const {
    sendGuardianLog
} = require('./guardianLogger');

/**
 * Normalize message content for repeat detection.
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
 * Detect rapid-message spam.
 *
 * @param {import('discord.js').Message} message
 * @param {Object} config
 * @returns {boolean}
 */
function isRapidSpam(message, config) {
    const timestamps = addMessageTimestamp(
        message.guild.id,
        message.author.id,
        config.intervalMs
    );

    return timestamps.length > config.maxMessages;
}

/**
 * Detect repeated-message spam.
 *
 * @param {import('discord.js').Message} message
 * @param {Object} config
 * @returns {boolean}
 */
function isRepeatedSpam(message, config) {
    const normalized =
        normalizeContent(message.content);

    if (!normalized) {
        return false;
    }

    const repeatedCount =
        trackRepeatedMessage(
            message.guild.id,
            message.author.id,
            normalized,
            config.repeatedMessageWindowMs
        );

    return (
        repeatedCount >=
        config.repeatedMessageLimit
    );
}

/**
 * Handle spam protection for a message.
 *
 * @param {import('discord.js').Message} message
 * @param {Object} guardianConfig
 * @returns {Promise<boolean>}
 */
async function handleSpamProtection(
    message,
    guardianConfig
) {
    const config = guardianConfig.spam;

    if (!config.enabled) {
        return false;
    }

    const rapidSpam =
        isRapidSpam(message, config);

    const repeatedSpam =
        isRepeatedSpam(message, config);

    if (!rapidSpam && !repeatedSpam) {
        return false;
    }

    const reason = repeatedSpam
        ? 'Repeated message spam'
        : 'Sending messages too quickly';

    const violationCount = addViolation(
        message.guild.id,
        message.author.id
    );

    const actions = [];

    if (config.deleteMessage) {
        const deleted =
            await deleteViolatingMessage(message);

        if (deleted) {
            actions.push('Message deleted');
        }
    }

    if (config.notifyUser) {
        await sendTemporaryWarning(
            message,
            reason,
            config.notificationDeleteAfterMs
        );

        actions.push('User notified');
    }

    const level =
        guardianConfig.protectionLevel.toUpperCase();

    if (
        level === 'MEDIUM' ||
        level === 'HIGH'
    ) {
        const warningSaved =
            await saveGuardianWarning(
                message,
                `[Guardian] ${reason}`
            );

        if (warningSaved) {
            actions.push('Warning saved');
        }
    }

    if (
        level === 'HIGH' &&
        violationCount >=
            config.timeoutAfterViolations
    ) {
        const timedOut =
            await timeoutMember(
                message.member,
                config.timeoutDurationMs,
                `[Guardian] ${reason}`
            );

        if (timedOut) {
            actions.push('10-minute timeout');
            resetViolations(
                message.guild.id,
                message.author.id
            );
        }
    }

    await sendGuardianLog({
        message,
        reason,
        action:
            actions.length > 0
                ? actions.join(', ')
                : 'Detected only',
        violationCount,
        logChannelName:
            guardianConfig.logChannelName
    });

    return true;
}

module.exports = {
    handleSpamProtection
};