const messageHistory = new Map();
const repeatedMessages = new Map();
const violationCounts = new Map();

/**
 * Build a unique key for a guild member.
 *
 * @param {string} guildId
 * @param {string} userId
 * @returns {string}
 */
function getMemberKey(guildId, userId) {
    return `${guildId}:${userId}`;
}

/**
 * Return recent message timestamps for a member.
 *
 * @param {string} guildId
 * @param {string} userId
 * @param {number} intervalMs
 * @returns {number[]}
 */
function addMessageTimestamp(
    guildId,
    userId,
    intervalMs
) {
    const key = getMemberKey(guildId, userId);
    const now = Date.now();

    const timestamps = (
        messageHistory.get(key) || []
    ).filter(timestamp =>
        now - timestamp <= intervalMs
    );

    timestamps.push(now);
    messageHistory.set(key, timestamps);

    return timestamps;
}

/**
 * Track repeated message content.
 *
 * @param {string} guildId
 * @param {string} userId
 * @param {string} normalizedContent
 * @param {number} windowMs
 * @returns {number}
 */
function trackRepeatedMessage(
    guildId,
    userId,
    normalizedContent,
    windowMs
) {
    const key = getMemberKey(guildId, userId);
    const now = Date.now();

    const previous =
        repeatedMessages.get(key);

    if (
        !previous ||
        previous.content !== normalizedContent ||
        now - previous.lastSeenAt > windowMs
    ) {
        repeatedMessages.set(key, {
            content: normalizedContent,
            count: 1,
            lastSeenAt: now
        });

        return 1;
    }

    const updated = {
        content: normalizedContent,
        count: previous.count + 1,
        lastSeenAt: now
    };

    repeatedMessages.set(key, updated);

    return updated.count;
}

/**
 * Increase and return a member's violation count.
 *
 * @param {string} guildId
 * @param {string} userId
 * @returns {number}
 */
function addViolation(guildId, userId) {
    const key = getMemberKey(guildId, userId);
    const nextCount =
        (violationCounts.get(key) || 0) + 1;

    violationCounts.set(key, nextCount);

    return nextCount;
}

/**
 * Reset a member's violation count.
 *
 * @param {string} guildId
 * @param {string} userId
 */
function resetViolations(guildId, userId) {
    const key = getMemberKey(guildId, userId);

    violationCounts.delete(key);
}

module.exports = {
    addMessageTimestamp,
    trackRepeatedMessage,
    addViolation,
    resetViolations
};