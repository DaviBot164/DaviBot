const {
    query
} = require('./connection');

/**
 * Every manually assignable Arrancar Rank.
 *
 * The order goes from the highest rank
 * to the lowest rank.
 */
const ARRANCAR_RANKS = [
    '👑 Espada 0',
    'Ⅰ Espada',
    'Ⅱ Espada',
    'Ⅲ Espada',
    'Ⅳ Espada',
    'Ⅴ Espada',
    'Ⅵ Espada',
    'Ⅶ Espada',
    'Ⅷ Espada',
    'Ⅸ Espada',
    'Ⅹ Espada',
    '🌘 Privaron Espada',
    '⚔️ Fracción',
    '🦴 Numeros',
    '⚪ Unranked Arrancar'
];

/**
 * Validate a manually assignable
 * Arrancar Rank name.
 *
 * @param {string} rankName
 * @returns {boolean}
 */
function isValidRank(
    rankName
) {
    return ARRANCAR_RANKS.includes(
        rankName
    );
}

/**
 * Get the current manually assigned
 * Arrancar Rank of a Soul.
 *
 * @param {string} guildId
 * @param {string} userId
 * @returns {Promise<Object|null>}
 */
async function getCurrentRank(
    guildId,
    userId
) {
    const result =
        await query(
            `
                SELECT
                    guild_id,
                    user_id,
                    rank_name,
                    assigned_by,
                    reason,
                    assigned_at,
                    updated_at
                FROM arrancar_ranks
                WHERE guild_id = $1
                  AND user_id = $2
                LIMIT 1;
            `,
            [
                guildId,
                userId
            ]
        );

    return result.rows[0] || null;
}

/**
 * Assign or replace a Soul's current
 * manually managed Arrancar Rank.
 *
 * The current rank and history record
 * are written in one PostgreSQL query.
 *
 * @param {Object} options
 * @param {string} options.guildId
 * @param {string} options.userId
 * @param {string} options.moderatorId
 * @param {string} options.rankName
 * @param {string} options.reason
 * @returns {Promise<Object>}
 */
async function setRank({
    guildId,
    userId,
    moderatorId,
    rankName,
    reason
}) {
    if (
        !isValidRank(
            rankName
        )
    ) {
        throw new Error(
            `Invalid Arrancar Rank: ${rankName}`
        );
    }

    const safeReason =
        reason ||
        'No reason was provided.';

    const result =
        await query(
            `
                WITH previous_rank AS (
                    SELECT
                        rank_name
                    FROM arrancar_ranks
                    WHERE guild_id = $1
                      AND user_id = $2
                ),

                updated_rank AS (
                    INSERT INTO arrancar_ranks (
                        guild_id,
                        user_id,
                        rank_name,
                        assigned_by,
                        reason,
                        assigned_at,
                        updated_at
                    )
                    VALUES (
                        $1,
                        $2,
                        $3,
                        $4,
                        $5,
                        NOW(),
                        NOW()
                    )

                    ON CONFLICT (
                        guild_id,
                        user_id
                    )

                    DO UPDATE SET
                        rank_name =
                            EXCLUDED.rank_name,

                        assigned_by =
                            EXCLUDED.assigned_by,

                        reason =
                            EXCLUDED.reason,

                        assigned_at =
                            NOW(),

                        updated_at =
                            NOW()

                    RETURNING
                        guild_id,
                        user_id,
                        rank_name,
                        assigned_by,
                        reason,
                        assigned_at,
                        updated_at
                ),

                history_record AS (
                    INSERT INTO arrancar_rank_history (
                        guild_id,
                        user_id,
                        moderator_id,
                        action,
                        old_rank,
                        new_rank,
                        reason,
                        created_at
                    )

                    SELECT
                        updated_rank.guild_id,
                        updated_rank.user_id,
                        $4,
                        'SET',
                        previous_rank.rank_name,
                        updated_rank.rank_name,
                        $5,
                        NOW()

                    FROM updated_rank

                    LEFT JOIN previous_rank
                        ON TRUE

                    RETURNING
                        id,
                        guild_id,
                        user_id,
                        moderator_id,
                        action,
                        old_rank,
                        new_rank,
                        reason,
                        created_at
                )

                SELECT
                    updated_rank.guild_id,
                    updated_rank.user_id,
                    updated_rank.rank_name,
                    updated_rank.assigned_by,
                    updated_rank.reason,
                    updated_rank.assigned_at,
                    updated_rank.updated_at,

                    previous_rank.rank_name
                        AS previous_rank_name,

                    history_record.id
                        AS history_id,

                    history_record.created_at
                        AS history_created_at

                FROM updated_rank

                LEFT JOIN previous_rank
                    ON TRUE

                INNER JOIN history_record
                    ON TRUE;
            `,
            [
                guildId,
                userId,
                rankName,
                moderatorId,
                safeReason
            ]
        );

    if (
        result.rows.length === 0
    ) {
        throw new Error(
            'The Arrancar Rank could not be saved.'
        );
    }

    return result.rows[0];
}

/**
 * Remove a Soul's manually assigned
 * Arrancar Rank.
 *
 * A removal history record is created
 * only if the Soul currently has a rank.
 *
 * @param {Object} options
 * @param {string} options.guildId
 * @param {string} options.userId
 * @param {string} options.moderatorId
 * @param {string} options.reason
 * @returns {Promise<Object|null>}
 */
async function removeRank({
    guildId,
    userId,
    moderatorId,
    reason
}) {
    const safeReason =
        reason ||
        'No reason was provided.';

    const result =
        await query(
            `
                WITH removed_rank AS (
                    DELETE FROM arrancar_ranks
                    WHERE guild_id = $1
                      AND user_id = $2

                    RETURNING
                        guild_id,
                        user_id,
                        rank_name,
                        assigned_by,
                        reason,
                        assigned_at,
                        updated_at
                ),

                history_record AS (
                    INSERT INTO arrancar_rank_history (
                        guild_id,
                        user_id,
                        moderator_id,
                        action,
                        old_rank,
                        new_rank,
                        reason,
                        created_at
                    )

                    SELECT
                        removed_rank.guild_id,
                        removed_rank.user_id,
                        $3,
                        'REMOVE',
                        removed_rank.rank_name,
                        NULL,
                        $4,
                        NOW()

                    FROM removed_rank

                    RETURNING
                        id,
                        guild_id,
                        user_id,
                        moderator_id,
                        action,
                        old_rank,
                        new_rank,
                        reason,
                        created_at
                )

                SELECT
                    removed_rank.guild_id,
                    removed_rank.user_id,
                    removed_rank.rank_name
                        AS removed_rank_name,

                    removed_rank.assigned_by,
                    removed_rank.reason
                        AS previous_reason,

                    removed_rank.assigned_at,
                    removed_rank.updated_at,

                    history_record.id
                        AS history_id,

                    history_record.created_at
                        AS history_created_at

                FROM removed_rank

                INNER JOIN history_record
                    ON TRUE;
            `,
            [
                guildId,
                userId,
                moderatorId,
                safeReason
            ]
        );

    return result.rows[0] || null;
}

/**
 * Get a Soul's Arrancar Rank history.
 *
 * @param {string} guildId
 * @param {string} userId
 * @param {number} limit
 * @returns {Promise<Object[]>}
 */
async function getRankHistory(
    guildId,
    userId,
    limit = 10
) {
    const safeLimit =
        Math.min(
            25,
            Math.max(
                1,
                Number(limit) || 10
            )
        );

    const result =
        await query(
            `
                SELECT
                    id,
                    guild_id,
                    user_id,
                    moderator_id,
                    action,
                    old_rank,
                    new_rank,
                    reason,
                    created_at
                FROM arrancar_rank_history
                WHERE guild_id = $1
                  AND user_id = $2
                ORDER BY created_at DESC,
                         id DESC
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
 * Count all Arrancar Rank changes
 * recorded for a Soul.
 *
 * @param {string} guildId
 * @param {string} userId
 * @returns {Promise<number>}
 */
async function countRankHistory(
    guildId,
    userId
) {
    const result =
        await query(
            `
                SELECT
                    COUNT(*)::INTEGER
                        AS total
                FROM arrancar_rank_history
                WHERE guild_id = $1
                  AND user_id = $2;
            `,
            [
                guildId,
                userId
            ]
        );

    return Number(
        result.rows[0]?.total || 0
    );
}

/**
 * Get a single Arrancar Rank history
 * record by its database ID.
 *
 * @param {string} guildId
 * @param {number|string} historyId
 * @returns {Promise<Object|null>}
 */
async function getHistoryRecord(
    guildId,
    historyId
) {
    const result =
        await query(
            `
                SELECT
                    id,
                    guild_id,
                    user_id,
                    moderator_id,
                    action,
                    old_rank,
                    new_rank,
                    reason,
                    created_at
                FROM arrancar_rank_history
                WHERE guild_id = $1
                  AND id = $2
                LIMIT 1;
            `,
            [
                guildId,
                historyId
            ]
        );

    return result.rows[0] || null;
}

/**
 * Get the most recent Arrancar Rank
 * history record of a Soul.
 *
 * @param {string} guildId
 * @param {string} userId
 * @returns {Promise<Object|null>}
 */
async function getLatestRankHistory(
    guildId,
    userId
) {
    const result =
        await query(
            `
                SELECT
                    id,
                    guild_id,
                    user_id,
                    moderator_id,
                    action,
                    old_rank,
                    new_rank,
                    reason,
                    created_at
                FROM arrancar_rank_history
                WHERE guild_id = $1
                  AND user_id = $2
                ORDER BY created_at DESC,
                         id DESC
                LIMIT 1;
            `,
            [
                guildId,
                userId
            ]
        );

    return result.rows[0] || null;
}

module.exports = {
    ARRANCAR_RANKS,

    isValidRank,

    getCurrentRank,
    setRank,
    removeRank,

    getRankHistory,
    countRankHistory,
    getHistoryRecord,
    getLatestRankHistory
};