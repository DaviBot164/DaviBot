const { query } = require('./connection');

/**
 * Add a new warning to a server member.
 *
 * @param {Object} data
 * @param {string} data.guildId
 * @param {string} data.userId
 * @param {string} data.moderatorId
 * @param {string} data.reason
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
 * Get all warnings for a server member.
 *
 * Newest warnings are returned first.
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
            ORDER BY created_at DESC, id DESC;
        `,
        [
            guildId,
            userId
        ]
    );

    return result.rows;
}

/**
 * Get a warning by its ID inside a specific server.
 *
 * @param {string} guildId
 * @param {string|number} warningId
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
 * Delete a warning by its ID inside a specific server.
 *
 * @param {string} guildId
 * @param {string|number} warningId
 * @returns {Promise<Object|null>}
 */
async function deleteWarningById(guildId, warningId) {
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
 * Count all warnings for a server member.
 *
 * @param {string} guildId
 * @param {string} userId
 * @returns {Promise<number>}
 */
async function countWarnings(guildId, userId) {
    const result = await query(
        `
            SELECT COUNT(*) AS total
            FROM warnings
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

module.exports = {
    addWarning,
    getWarnings,
    getWarningById,
    deleteWarningById,
    countWarnings
};