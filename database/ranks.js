const {
    query
} = require('./connection');

const rankConfig =
    require('../config/ranks');

/**
 * Official LUNAR SEIREITEI ranks.
 *
 * Rank IDs and names are taken from
 * the central rank configuration.
 */
const SIN_RANKS =
    Object.values(
        rankConfig.hierarchy
    ).map(
        rank =>
            rank.name
    );

/**
 * Check whether a rank is currently
 * assignable through the rank system.
 *
 * Dominion is intentionally excluded from
 * normal member rank assignment because
 * it is a special hierarchy position.
 *
 * Unranked is also excluded because removing
 * a rank already represents Unranked state.
 *
 * @param {string} rankName
 * @returns {boolean}
 */
function isValidRank(
    rankName
) {
    return (
        SIN_RANKS.includes(
            rankName
        ) &&
        rankName !==
            rankConfig.hierarchy
                .dominion
                .name &&
        rankName !==
            rankConfig.hierarchy
                .unranked
                .name
    );
}

/**
 * Get the current manually assigned
 * Captain Rank of a Soul.
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
                FROM sin_ranks
                WHERE guild_id = $1
                  AND user_id = $2
                LIMIT 1;
            `,
            [
                guildId,
                userId
            ]
        );

    return (
        result.rows[0] ||
        null
    );
}

/**
 * Assign or replace a Soul's
 * current Captain Rank.
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
            `Invalid Captain Rank: ${rankName}`
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
                    FROM sin_ranks
                    WHERE guild_id = $1
                      AND user_id = $2
                ),

                updated_rank AS (
                    INSERT INTO sin_ranks (
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
                ),                history_record AS (
                    INSERT INTO sin_rank_history (
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
        result.rows.length ===
        0
    ) {
        throw new Error(
            'The Captain Rank could not be saved.'
        );
    }

    return result.rows[0];
}

/**
 * Remove the current Captain Rank.
 *
 * The removed rank is preserved in history.
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
    const currentRank =
        await getCurrentRank(
            guildId,
            userId
        );

    if (!currentRank) {
        return null;
    }

    const safeReason =
        reason ||
        'No reason was provided.';

    await query(
        `
            INSERT INTO sin_rank_history (
                guild_id,
                user_id,
                moderator_id,
                action,
                old_rank,
                new_rank,
                reason,
                created_at
            )
            VALUES (
                $1,
                $2,
                $3,
                'REMOVE',
                $4,
                NULL,
                $5,
                NOW()
            );
        `,
        [
            guildId,
            userId,
            moderatorId,
            currentRank.rank_name,
            safeReason
        ]
    );

    await query(
        `
            DELETE FROM sin_ranks
            WHERE guild_id = $1
              AND user_id = $2;
        `,
        [
            guildId,
            userId
        ]
    );

    return {
        ...currentRank,

        previousRank:
            currentRank.rank_name,

        newRank:
            null,

        reason:
            safeReason
    };
}/**
 * Get rank history for a Soul.
 *
 * @param {string} guildId
 * @param {string} userId
 * @param {number} limit
 * @returns {Promise<Array>}
 */
async function getRankHistory(
    guildId,
    userId,
    limit = 25
) {
    const safeLimit =
        Math.min(
            Math.max(
                Number(limit) || 25,
                1
            ),
            100
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
                FROM sin_rank_history
                WHERE guild_id = $1
                  AND user_id = $2
                ORDER BY created_at DESC
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
 * Get all current Captain Ranks in a server.
 *
 * @param {string} guildId
 * @returns {Promise<Array>}
 */
async function getGuildRanks(
    guildId
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
                FROM sin_ranks
                WHERE guild_id = $1
                ORDER BY
                    updated_at DESC;
            `,
            [
                guildId
            ]
        );

    return result.rows;
}

/**
 * Find members currently holding
 * a specific Captain Rank.
 *
 * @param {string} guildId
 * @param {string} rankName
 * @returns {Promise<Array>}
 */
async function getUsersByRank(
    guildId,
    rankName
) {
    if (
        !isValidRank(
            rankName
        )
    ) {
        return [];
    }

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
                FROM sin_ranks
                WHERE guild_id = $1
                  AND rank_name = $2
                ORDER BY updated_at DESC;
            `,
            [
                guildId,
                rankName
            ]
        );

    return result.rows;
}module.exports = {
    SIN_RANKS,

    isValidRank,

    getCurrentRank,
    setRank,
    removeRank,
    getRankHistory,
    getGuildRanks,
    getUsersByRank
};