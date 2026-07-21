const { query } = require('./connection');

/**
 * Add a new AutoMod case.
 *
 * @param {Object} data
 * @param {string} data.guildId
 * @param {string} data.userId
 * @param {string} data.channelId
 * @param {string} data.reason
 * @param {string} data.action
 * @param {string|null} data.messageContent
 * @param {boolean} data.messageDeleted
 * @param {boolean} data.timeoutApplied
 * @param {number|null} data.timeoutDurationMilliseconds
 * @returns {Promise<Object>}
 */
async function addAutoModCase({
    guildId,
    userId,
    channelId,
    reason,
    action,
    messageContent = null,
    messageDeleted = false,
    timeoutApplied = false,
    timeoutDurationMilliseconds = null
}) {
    const result = await query(
        `
            INSERT INTO automod_cases (
                guild_id,
                user_id,
                channel_id,
                reason,
                action,
                message_content,
                message_deleted,
                timeout_applied,
                timeout_duration_ms
            )
            VALUES (
                $1,
                $2,
                $3,
                $4,
                $5,
                $6,
                $7,
                $8,
                $9
            )
            RETURNING
                id,
                guild_id,
                user_id,
                channel_id,
                reason,
                action,
                message_content,
                message_deleted,
                timeout_applied,
                timeout_duration_ms,
                created_at;
        `,
        [
            guildId,
            userId,
            channelId,
            reason,
            action,
            messageContent,
            messageDeleted,
            timeoutApplied,
            timeoutDurationMilliseconds
        ]
    );

    return result.rows[0];
}

/**
 * Get an AutoMod case by its ID inside a server.
 *
 * @param {string} guildId
 * @param {string|number} caseId
 * @returns {Promise<Object|null>}
 */
async function getAutoModCaseById(
    guildId,
    caseId
) {
    const result = await query(
        `
            SELECT
                id,
                guild_id,
                user_id,
                channel_id,
                reason,
                action,
                message_content,
                message_deleted,
                timeout_applied,
                timeout_duration_ms,
                created_at
            FROM automod_cases
            WHERE guild_id = $1
              AND id = $2
            LIMIT 1;
        `,
        [
            guildId,
            caseId
        ]
    );

    return result.rows[0] || null;
}

/**
 * Get recent AutoMod cases inside a server.
 *
 * @param {string} guildId
 * @param {number} limit
 * @returns {Promise<Array>}
 */
async function getRecentAutoModCases(
    guildId,
    limit = 10
) {
    const safeLimit = Math.min(
        Math.max(Number(limit) || 10, 1),
        50
    );

    const result = await query(
        `
            SELECT
                id,
                guild_id,
                user_id,
                channel_id,
                reason,
                action,
                message_content,
                message_deleted,
                timeout_applied,
                timeout_duration_ms,
                created_at
            FROM automod_cases
            WHERE guild_id = $1
            ORDER BY id DESC
            LIMIT $2;
        `,
        [
            guildId,
            safeLimit
        ]
    );

    return result.rows;
}

/**
 * Get AutoMod cases for a specific server member.
 *
 * @param {string} guildId
 * @param {string} userId
 * @param {number} limit
 * @returns {Promise<Array>}
 */
async function getMemberAutoModCases(
    guildId,
    userId,
    limit = 10
) {
    const safeLimit = Math.min(
        Math.max(Number(limit) || 10, 1),
        50
    );

    const result = await query(
        `
            SELECT
                id,
                guild_id,
                user_id,
                channel_id,
                reason,
                action,
                message_content,
                message_deleted,
                timeout_applied,
                timeout_duration_ms,
                created_at
            FROM automod_cases
            WHERE guild_id = $1
              AND user_id = $2
            ORDER BY id DESC
            LIMIT $3;
        `,
        [
            guildId,
            userId,
            safeLimit
        ]
    );

    return result.rows;
}

/**
 * Count every AutoMod case for a server member.
 *
 * @param {string} guildId
 * @param {string} userId
 * @returns {Promise<number>}
 */
async function countMemberAutoModCases(
    guildId,
    userId
) {
    const result = await query(
        `
            SELECT COUNT(*) AS total
            FROM automod_cases
            WHERE guild_id = $1
              AND user_id = $2;
        `,
        [
            guildId,
            userId
        ]
    );

    return Number(result.rows[0].total);
}

/**
 * Delete an AutoMod case by ID.
 *
 * @param {string} guildId
 * @param {string|number} caseId
 * @returns {Promise<Object|null>}
 */
async function deleteAutoModCaseById(
    guildId,
    caseId
) {
    const result = await query(
        `
            DELETE FROM automod_cases
            WHERE guild_id = $1
              AND id = $2
            RETURNING
                id,
                guild_id,
                user_id,
                channel_id,
                reason,
                action,
                message_content,
                message_deleted,
                timeout_applied,
                timeout_duration_ms,
                created_at;
        `,
        [
            guildId,
            caseId
        ]
    );

    return result.rows[0] || null;
}

module.exports = {
    addAutoModCase,
    getAutoModCaseById,
    getRecentAutoModCases,
    getMemberAutoModCases,
    countMemberAutoModCases,
    deleteAutoModCaseById
};