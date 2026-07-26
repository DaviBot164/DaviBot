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
 * Normalize message content for
 * repeated-message detection.
 *
 * @param {string} content
 * @returns {string}
 */
function normalizeContent(content) {
    return String(content || '')
        .normalize('NFKC')
        .toLowerCase()
        .replace(
            /[\u200B-\u200D\uFEFF]/g,
            ''
        )
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
function isRapidSpam(
    message,
    config
) {
    const timestamps =
        addMessageTimestamp(
            message.guild.id,
            message.author.id,
            config.intervalMs
        );

    return (
        timestamps.length >
        config.maxMessages
    );
}

/**
 * Detect repeated-message spam.
 *
 * @param {import('discord.js').Message} message
 * @param {Object} config
 * @returns {boolean}
 */
function isRepeatedSpam(
    message,
    config
) {
    const normalized =
        normalizeContent(
            message.content
        );

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
 * Create a readable timeout duration.
 *
 * @param {number} durationMs
 * @returns {string}
 */
function formatTimeoutDuration(
    durationMs
) {
    const totalMinutes =
        Math.max(
            1,
            Math.round(
                durationMs / 60_000
            )
        );

    return (
        `${totalMinutes}-minute timeout`
    );
}

/**
 * Handle Umbra Guardian spam protection.
 *
 * @param {import('discord.js').Message} message
 * @param {Object} guardianConfig
 * @returns {Promise<boolean>}
 */
async function handleSpamProtection(
    message,
    guardianConfig
) {
    const config =
        guardianConfig.spam;

    if (
        !config ||
        !config.enabled
    ) {
        return false;
    }

    const rapidSpam =
        isRapidSpam(
            message,
            config
        );

    const repeatedSpam =
        isRepeatedSpam(
            message,
            config
        );

    if (
        !rapidSpam &&
        !repeatedSpam
    ) {
        return false;
    }

    const reason =
        repeatedSpam
            ? 'Repeated message spam'
            : 'Sending messages too quickly';

    const violationCount =
        addViolation(
            message.guild.id,
            message.author.id
        );

    const actions = [];

    /*
     * Delete the spam message when
     * message deletion is enabled.
     */
    if (config.deleteMessage) {
        const deleted =
            await deleteViolatingMessage(
                message
            );

        if (deleted) {
            actions.push(
                'Message deleted'
            );
        } else {
            actions.push(
                'Message could not be deleted'
            );
        }
    }

    /*
     * Notify the Soul publicly without
     * exposing internal Guardian data.
     */
    if (config.notifyUser) {
        await sendTemporaryWarning(
            message,
            reason,
            config.notificationDeleteAfterMs
        );

        actions.push(
            'Soul notified'
        );
    }

    const protectionLevel =
        String(
            guardianConfig
                .protectionLevel ||
            'LOW'
        ).toUpperCase();

    /*
     * MEDIUM and HIGH protection save
     * an automatic database warning.
     */
    if (
        protectionLevel === 'MEDIUM' ||
        protectionLevel === 'HIGH'
    ) {
        const warningSaved =
            await saveGuardianWarning(
                message,
                `[Umbra Guardian: Spam] ${reason}`
            );

        if (warningSaved) {
            actions.push(
                'Warning saved'
            );
        } else {
            actions.push(
                'Warning could not be saved'
            );
        }
    }

    /*
     * HIGH protection applies a timeout
     * after repeated spam violations.
     */
    if (
        protectionLevel === 'HIGH' &&
        violationCount >=
            config.timeoutAfterViolations
    ) {
        const timedOut =
            await timeoutMember(
                message.member,
                config.timeoutDurationMs,
                `[Umbra Guardian: Spam] ${reason}`
            );

        if (timedOut) {
            actions.push(
                formatTimeoutDuration(
                    config.timeoutDurationMs
                )
            );

            resetViolations(
                message.guild.id,
                message.author.id
            );
        } else {
            actions.push(
                'Timeout could not be applied'
            );
        }
    }

    await sendGuardianLog({
        message,

        reason,

        action:
            actions.length > 0
                ? actions.join(', ')
                : 'Violation detected',

        violationCount,

        logChannelName:
            guardianConfig.logChannelName
    });

    return true;
}

module.exports = {
    handleSpamProtection
};