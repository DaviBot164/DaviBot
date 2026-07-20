const {
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
 * Replace commonly used disguised characters.
 *
 * @param {string} content
 * @returns {string}
 */
function replaceDisguisedCharacters(content) {
    return content
        .replace(/[@4]/g, 'a')
        .replace(/[3]/g, 'e')
        .replace(/[1!|]/g, 'i')
        .replace(/[0]/g, 'o')
        .replace(/[5$]/g, 's')
        .replace(/[7]/g, 't');
}

/**
 * Normalize text for profanity detection.
 *
 * @param {string} content
 * @returns {{ normal: string, compact: string }}
 */
function normalizeContent(content) {
    const normal = replaceDisguisedCharacters(
        content
            .normalize('NFKC')
            .toLowerCase()
            .replace(/[\u200B-\u200D\uFEFF]/g, '')
            .replace(/[._\-–—*,/\\()[\]{}:;"'`~+=<>!?]+/g, ' ')
            .replace(/\s+/g, ' ')
            .trim()
    );

    const compact = normal.replace(
        /[^\p{L}\p{N}]/gu,
        ''
    );

    return {
        normal,
        compact
    };
}

/**
 * Normalize one blocked word.
 *
 * @param {string} word
 * @returns {{ normal: string, compact: string }}
 */
function normalizeBlockedWord(word) {
    return normalizeContent(word);
}

/**
 * Check whether a message contains a blocked word.
 *
 * @param {string} content
 * @param {string[]} blockedWords
 * @returns {string|null}
 */
function findBlockedWord(content, blockedWords) {
    if (!content || blockedWords.length === 0) {
        return null;
    }

    const normalizedMessage =
        normalizeContent(content);

    const messageWords =
        normalizedMessage.normal.match(
            /[\p{L}\p{N}]+/gu
        ) || [];

    for (const blockedWord of blockedWords) {
        const normalizedBlocked =
            normalizeBlockedWord(blockedWord);

        if (!normalizedBlocked.compact) {
            continue;
        }

        /*
         * Normal word detection.
         * Example: "you are idiot"
         */
        if (
            messageWords.includes(
                normalizedBlocked.normal
            )
        ) {
            return blockedWord;
        }

        /*
         * Obfuscated-word detection.
         * Examples:
         * i.d.i.o.t
         * i d i o t
         * დ ე ბ ი ლ ი
         */
        if (
            normalizedBlocked.compact.length >= 4 &&
            normalizedMessage.compact.includes(
                normalizedBlocked.compact
            )
        ) {
            return blockedWord;
        }
    }

    return null;
}

/**
 * Handle profanity protection.
 *
 * @param {import('discord.js').Message} message
 * @param {Object} guardianConfig
 * @returns {Promise<boolean>}
 */
async function handleProfanityProtection(
    message,
    guardianConfig
) {
    const config = guardianConfig.profanity;

    if (
        !config ||
        !config.enabled ||
        !message.content
    ) {
        return false;
    }

    const blockedWord = findBlockedWord(
        message.content,
        config.blockedWords
    );

    if (!blockedWord) {
        return false;
    }

    const reason =
        'Inappropriate or insulting language';

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
        } else {
            actions.push('Message could not be deleted');
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
                `[Guardian Profanity] ${reason}`
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
                `[Guardian Profanity] ${reason}`
            );

        if (timedOut) {
            const timeoutMinutes =
                Math.round(
                    config.timeoutDurationMs /
                    60000
                );

            actions.push(
                `${timeoutMinutes}-minute timeout`
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
                : 'Detected only',
        violationCount,
        logChannelName:
            guardianConfig.logChannelName
    });

    return true;
}

module.exports = {
    handleProfanityProtection
};