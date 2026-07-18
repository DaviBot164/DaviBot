const { query } = require('./connection');

/**
 * Add a new warning.
 *
 * @param {Object} warning
 * @param {string} warning.guildId
 * @param {string} warning.userId
 * @param {string} warning.moderatorId
 * @param {string} warning.reason
 * @returns {Promise<Object>}
 */
async function addWarning({
    guildId,
    userId,
    moderatorId,
    reason
}) {
    const result = await query(
        `
            INSERT INTO warnings (
                guild_id,
                user_id,
                moderator_id,
                reason
            )
            VALUES ($1, $2, $3, $4)
            RETURNING
                id,
                guild_id,
                user_id,
                moderator_id,
                reason,
                created_at;
        `,
        [
            guildId,
            userId,
            moderatorId,
            reason
        ]
    );

    return result.rows[0];
}

/**
 * Get all warnings for a member in a server.
 *
 * @param {string} guildId
 * @param {string} userId
 * @returns {Promise<Array>}
 */
async function getWarnings(guildId, userId) {
    const result = await query(
        `
            SELECT
                id,
                guild_id,
                user_id,
                moderator_id,
                reason,
                created_at
            FROM warnings
            WHERE guild_id = $1
              AND user_id = $2
            ORDER BY created_at DESC;
        `,
        [
            guildId,
            userId
        ]
    );

    return result.rows;
}

/**
 * Get one warning by its ID.
 *
 * @param {string} guildId
 * @param {number} warningId
 * @returns {Promise<Object|null>}
 */
async function getWarningById(guildId, warningId) {
    const result = await query(
        `
            SELECT
                id,
                guild_id,
                user_id,
                moderator_id,
                reason,
                created_at
            FROM warnings
            WHERE guild_id = $1
              AND id = $2
            LIMIT 1;
        `,
        [
            guildId,
            warningId
        ]
    );

    return result.rows[0] || null;
}

/**
 * Remove one warning by its ID.
 *
 * @param {string} guildId
 * @param {number} warningId
 * @returns {Promise<Object|null>}
 */
async function removeWarning(guildId, warningId) {
    const result = await query(
        `
            DELETE FROM warnings
            WHERE guild_id = $1
              AND id = $2
            RETURNING
                id,
                guild_id,
                user_id,
                moderator_id,
                reason,
                created_at;
        `,
        [
            guildId,
            warningId
        ]
    );

    return result.rows[0] || null;
}

/**
 * Count a member's warnings.
 *
 * @param {string} guildId
 * @param {string} userId
 * @returns {Promise<number>}
 */
async function countWarnings(guildId, userId) {
    const result = await query(
        `
            SELECT COUNT(*)::INTEGER AS total
            FROM warnings
            WHERE guild_id = $1
              AND user_id = $2;
        `,
        [
            guildId,
            userId
        ]
    );

    return result.rows[0].total;
}

module.exports = {
    addWarning,
    getWarnings,
    getWarningById,
    removeWarning,
    countWarnings
};