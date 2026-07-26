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

/*
 * Built-in Umbra Guardian profanity levels.
 *
 * Severe:
 * Delete + notify + database warning.
 *
 * Medium:
 * Delete + notify.
 * Database warning on MEDIUM/HIGH protection.
 *
 * Mild:
 * Delete + temporary notification.
 */
const PROFANITY_LEVELS = {
    severe: [
        'pedo',
        'pedophile',
        'predator',
        'rapist',

        'kill yourself',
        'go kill yourself',
        'kys',

        'nigger',
        'nigga',

        'faggot',
        'retard'
    ],

    medium: [
        'pussy',
        'bitch',
        'slut',
        'whore',
        'cunt',

        'motherfucker',
        'mother fucker',
        'mf',

        'fuck you',
        'fuck off',
        'shut the fuck up',
        'stfu',

        'dumbass',
        'dipshit',
        'piece of shit'
    ],

    mild: [
        'idiot',
        'moron',
        'loser',
        'clown',
        'trash',
        'noob',
        'stupid',
        'dumb'
    ]
};

/**
 * Replace commonly used disguised characters.
 *
 * Examples:
 * b1tch  -> bitch
 * pu$$y  -> pussy
 * f@ggot -> faggot
 *
 * @param {string} content
 * @returns {string}
 */
function replaceDisguisedCharacters(content) {
    return content
        .replace(/[@4]/g, 'a')
        .replace(/8/g, 'b')
        .replace(/3/g, 'e')
        .replace(/[1!|]/g, 'i')
        .replace(/0/g, 'o')
        .replace(/[5$]/g, 's')
        .replace(/7/g, 't');
}

/**
 * Normalize text for profanity detection.
 *
 * normal:
 * "you are p.u.s.s.y" -> "you are p u s s y"
 *
 * compact:
 * "you are p.u.s.s.y" -> "youarepussy"
 *
 * @param {string} content
 * @returns {{ normal: string, compact: string }}
 */
function normalizeContent(content) {
    const normalized =
        replaceDisguisedCharacters(
            String(content)
                .normalize('NFKC')
                .toLowerCase()
                .replace(
                    /[\u200B-\u200D\uFEFF]/g,
                    ''
                )
                .replace(
                    /[._\-–—*,/\\()[\]{}:;"'`~+=<>!?@#$%^&]+/g,
                    ' '
                )
                .replace(/\s+/g, ' ')
                .trim()
        );

    return {
        normal: normalized,

        compact: normalized.replace(
            /[^\p{L}\p{N}]/gu,
            ''
        )
    };
}

/**
 * Escape text before placing it inside a RegExp.
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
 * Create a phrase-safe regular expression.
 *
 * This prevents short blocked words from
 * matching inside unrelated longer words.
 *
 * @param {string} normalizedTerm
 * @returns {RegExp}
 */
function createTermRegex(normalizedTerm) {
    const parts = normalizedTerm
        .split(/\s+/)
        .filter(Boolean)
        .map(escapeRegExp);

    const phrase =
        parts.join('\\s+');

    return new RegExp(
        `(^|[^\\p{L}\\p{N}])${phrase}(?=$|[^\\p{L}\\p{N}])`,
        'iu'
    );
}

/**
 * Determine whether a blocked term exists
 * inside the message content.
 *
 * Supports:
 * pussy
 * pu$$y
 * p.u.s.s.y
 * p u s s y
 * kill yourself
 *
 * @param {{ normal: string, compact: string }} normalizedMessage
 * @param {string} blockedTerm
 * @returns {boolean}
 */
function containsBlockedTerm(
    normalizedMessage,
    blockedTerm
) {
    const normalizedBlocked =
        normalizeContent(blockedTerm);

    if (!normalizedBlocked.normal) {
        return false;
    }

    /*
     * Exact word or exact phrase detection.
     */
    const termRegex =
        createTermRegex(
            normalizedBlocked.normal
        );

    if (
        termRegex.test(
            normalizedMessage.normal
        )
    ) {
        return true;
    }

    /*
     * Detect characters separated by spaces
     * or symbols.
     *
     * Examples:
     * p.u.s.s.y
     * p u s s y
     */
    if (
        normalizedBlocked.compact.length >= 4 &&
        normalizedMessage.compact.includes(
            normalizedBlocked.compact
        )
    ) {
        return true;
    }

    return false;
}

/**
 * Build the final profanity lists.
 *
 * Custom words from Umbra Guardian's
 * configuration are treated as medium severity
 * unless they already exist in one of the
 * built-in lists.
 *
 * @param {string[]} customBlockedWords
 * @returns {{
 *   severe: string[],
 *   medium: string[],
 *   mild: string[]
 * }}
 */
function buildProfanityLevels(
    customBlockedWords = []
) {
    const severe = new Set(
        PROFANITY_LEVELS.severe
    );

    const medium = new Set(
        PROFANITY_LEVELS.medium
    );

    const mild = new Set(
        PROFANITY_LEVELS.mild
    );

    for (
        const word of customBlockedWords
    ) {
        if (
            typeof word !== 'string' ||
            !word.trim()
        ) {
            continue;
        }

        const cleanWord = word
            .toLowerCase()
            .trim();

        if (
            severe.has(cleanWord) ||
            medium.has(cleanWord) ||
            mild.has(cleanWord)
        ) {
            continue;
        }

        medium.add(cleanWord);
    }

    return {
        severe: [...severe],
        medium: [...medium],
        mild: [...mild]
    };
}

/**
 * Find the first prohibited term and
 * determine its severity.
 *
 * Severe is checked first, followed by
 * medium and mild.
 *
 * @param {string} content
 * @param {string[]} customBlockedWords
 * @returns {{
 *   word: string,
 *   severity: 'severe'|'medium'|'mild'
 * }|null}
 */
function findProfanityViolation(
    content,
    customBlockedWords = []
) {
    if (!content) {
        return null;
    }

    const normalizedMessage =
        normalizeContent(content);

    const levels =
        buildProfanityLevels(
            customBlockedWords
        );

    const severityOrder = [
        'severe',
        'medium',
        'mild'
    ];

    for (
        const severity of severityOrder
    ) {
        for (
            const blockedWord
            of levels[severity]
        ) {
            if (
                containsBlockedTerm(
                    normalizedMessage,
                    blockedWord
                )
            ) {
                return {
                    word: blockedWord,
                    severity
                };
            }
        }
    }

    return null;
}

/**
 * Return a readable severity label.
 *
 * @param {'severe'|'medium'|'mild'} severity
 * @returns {string}
 */
function formatSeverity(severity) {
    switch (severity) {
        case 'severe':
            return 'Severe';

        case 'medium':
            return 'Medium';

        default:
            return 'Mild';
    }
}

/**
 * Decide whether a database warning
 * must be saved.
 *
 * Severe:
 * Always save a warning.
 *
 * Medium:
 * Save on MEDIUM or HIGH protection.
 *
 * Mild:
 * Save only on HIGH protection.
 *
 * @param {'severe'|'medium'|'mild'} severity
 * @param {string} protectionLevel
 * @returns {boolean}
 */
function shouldSaveWarning(
    severity,
    protectionLevel
) {
    if (severity === 'severe') {
        return true;
    }

    if (severity === 'medium') {
        return (
            protectionLevel === 'MEDIUM' ||
            protectionLevel === 'HIGH'
        );
    }

    return (
        protectionLevel === 'HIGH'
    );
}

/**
 * Handle Umbra Guardian profanity
 * protection.
 *
 * @param {import('discord.js').Message} message
 * @param {Object} guardianConfig
 * @returns {Promise<boolean>}
 */
async function handleProfanityProtection(
    message,
    guardianConfig
) {
    const config =
        guardianConfig.profanity;

    if (
        !config ||
        !config.enabled ||
        !message.content
    ) {
        return false;
    }

    const violation =
        findProfanityViolation(
            message.content,

            Array.isArray(
                config.blockedWords
            )
                ? config.blockedWords
                : []
        );

    if (!violation) {
        return false;
    }

    const severityLabel =
        formatSeverity(
            violation.severity
        );

    const reason =
        `${severityLabel} violation of the Sacred Laws`;

    const violationCount =
        addViolation(
            message.guild.id,
            message.author.id
        );

    const actions = [];

    /*
     * All three levels are deleted when
     * message deletion is enabled in
     * Umbra Guardian's configuration.
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
     * Notify the Soul without displaying
     * the exact blocked term publicly.
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

    if (
        shouldSaveWarning(
            violation.severity,
            protectionLevel
        )
    ) {
        const warningSaved =
            await saveGuardianWarning(
                message,

                `[Umbra Guardian: ${severityLabel}] ${reason}`
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
     * after repeated violations.
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

                `[Umbra Guardian: ${severityLabel}] ${reason}`
            );

        if (timedOut) {
            const timeoutMinutes =
                Math.max(
                    1,

                    Math.round(
                        config.timeoutDurationMs /
                        60_000
                    )
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

        reason:
            `${reason}\n` +
            `Detected term: "${violation.word}"`,

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
    handleProfanityProtection
};