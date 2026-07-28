const {
    query
} = require('./connection');

/**
 * Level System configuration.
 *
 * A Soul requires:
 *
 * Level 10  = 10,000 total XP
 * Level 25  = 62,500 total XP
 * Level 50  = 250,000 total XP
 * Level 100 = 1,000,000 total XP
 * Level 150 = 2,250,000 total XP
 */
const XP_MULTIPLIER =
    100;

/**
 * Default XP cooldown.
 *
 * One XP reward may be received
 * every 60 seconds.
 */
const DEFAULT_XP_COOLDOWN_MS =
    60_000;

/**
 * Return the total XP required
 * to reach a specific Level.
 *
 * Formula:
 * total XP = 100 × level²
 *
 * @param {number} level
 * @returns {number}
 */
function getTotalXpForLevel(
    level
) {
    const safeLevel =
        Math.max(
            0,
            Math.floor(
                Number(level) || 0
            )
        );

    return (
        XP_MULTIPLIER *
        safeLevel *
        safeLevel
    );
}

/**
 * Calculate a Level from total XP.
 *
 * @param {number} xp
 * @returns {number}
 */
function calculateLevelFromXp(
    xp
) {
    const safeXp =
        Math.max(
            0,
            Number(xp) || 0
        );

    return Math.floor(
        Math.sqrt(
            safeXp /
            XP_MULTIPLIER
        )
    );
}

/**
 * Calculate Level progress information.
 *
 * @param {number} xp
 * @returns {{
 *     level: number,
 *     totalXp: number,
 *     currentLevelXp: number,
 *     nextLevelXp: number,
 *     requiredForNextLevel: number,
 *     progressXp: number,
 *     progressPercent: number
 * }}
 */
function calculateLevelProgress(
    xp
) {
    const totalXp =
        Math.max(
            0,
            Number(xp) || 0
        );

    const level =
        calculateLevelFromXp(
            totalXp
        );

    const currentLevelXp =
        getTotalXpForLevel(
            level
        );

    const nextLevelXp =
        getTotalXpForLevel(
            level + 1
        );

    const requiredForNextLevel =
        nextLevelXp -
        currentLevelXp;

    const progressXp =
        totalXp -
        currentLevelXp;

    const progressPercent =
        requiredForNextLevel > 0
            ? Math.min(
                100,
                Math.max(
                    0,
                    Math.floor(
                        (
                            progressXp /
                            requiredForNextLevel
                        ) *
                        100
                    )
                )
            )
            : 100;

    return {
        level,
        totalXp,
        currentLevelXp,
        nextLevelXp,
        requiredForNextLevel,
        progressXp,
        progressPercent
    };
}

/**
 * Convert a PostgreSQL Level row
 * into Umbra's Level data structure.
 *
 * @param {Object|null} row
 * @returns {Object|null}
 */
function mapLevelRow(
    row
) {
    if (!row) {
        return null;
    }

    const xp =
        Number(
            row.xp || 0
        );

    const level =
        Number(
            row.level || 0
        );

    const messageCount =
        Number(
            row.message_count || 0
        );

    return {
        guildId:
            row.guild_id,

        userId:
            row.user_id,

        xp,
        level,
        messageCount,

        lastXpAt:
            row.last_xp_at
                ? new Date(
                    row.last_xp_at
                )
                : null,

        createdAt:
            row.created_at
                ? new Date(
                    row.created_at
                )
                : null,

        updatedAt:
            row.updated_at
                ? new Date(
                    row.updated_at
                )
                : null,

        progress:
            calculateLevelProgress(
                xp
            )
    };
}

/**
 * Get one Soul's Level record.
 *
 * @param {string} guildId
 * @param {string} userId
 * @returns {Promise<Object|null>}
 */
async function getUserLevel(
    guildId,
    userId
) {
    const result =
        await query(
            `
                SELECT *
                FROM levels
                WHERE guild_id = $1
                  AND user_id = $2
                LIMIT 1;
            `,
            [
                guildId,
                userId
            ]
        );

    if (
        result.rows.length === 0
    ) {
        return null;
    }

    return mapLevelRow(
        result.rows[0]
    );
}

/**
 * Create a Level record when one
 * does not already exist.
 *
 * @param {string} guildId
 * @param {string} userId
 * @returns {Promise<Object>}
 */
async function ensureUserLevel(
    guildId,
    userId
) {
    const result =
        await query(
            `
                INSERT INTO levels (
                    guild_id,
                    user_id,
                    xp,
                    level,
                    message_count
                )
                VALUES (
                    $1,
                    $2,
                    0,
                    0,
                    0
                )
                ON CONFLICT (
                    guild_id,
                    user_id
                )
                DO UPDATE SET
                    updated_at =
                        levels.updated_at
                RETURNING *;
            `,
            [
                guildId,
                userId
            ]
        );

    return mapLevelRow(
        result.rows[0]
    );
}

/**
 * Check whether a Soul may receive XP.
 *
 * @param {string} guildId
 * @param {string} userId
 * @param {number} cooldownMs
 * @returns {Promise<boolean>}
 */
async function canReceiveXp(
    guildId,
    userId,
    cooldownMs =
        DEFAULT_XP_COOLDOWN_MS
) {
    const safeCooldownMs =
        Math.max(
            1_000,
            Math.floor(
                Number(cooldownMs) ||
                DEFAULT_XP_COOLDOWN_MS
            )
        );

    const result =
        await query(
            `
                SELECT
                    last_xp_at IS NULL
                    OR last_xp_at <=
                        NOW() -
                        (
                            $3::BIGINT *
                            INTERVAL '1 millisecond'
                        )
                    AS can_receive_xp
                FROM levels
                WHERE guild_id = $1
                  AND user_id = $2
                LIMIT 1;
            `,
            [
                guildId,
                userId,
                safeCooldownMs
            ]
        );

    if (
        result.rows.length === 0
    ) {
        return true;
    }

    return Boolean(
        result.rows[0]
            .can_receive_xp
    );
}

/**
 * Record a message without granting XP.
 *
 * Useful when the Soul is still
 * inside the XP cooldown.
 *
 * @param {string} guildId
 * @param {string} userId
 * @returns {Promise<Object>}
 */
async function incrementMessageCount(
    guildId,
    userId
) {
    const result =
        await query(
            `
                INSERT INTO levels (
                    guild_id,
                    user_id,
                    xp,
                    level,
                    message_count
                )
                VALUES (
                    $1,
                    $2,
                    0,
                    0,
                    1
                )
                ON CONFLICT (
                    guild_id,
                    user_id
                )
                DO UPDATE SET
                    message_count =
                        levels.message_count + 1,

                    updated_at =
                        NOW()
                RETURNING *;
            `,
            [
                guildId,
                userId
            ]
        );

    return mapLevelRow(
        result.rows[0]
    );
}

/**
 * Add XP to a Soul.
 *
 * This function checks and applies
 * the cooldown inside PostgreSQL.
 *
 * It also increments message_count.
 *
 * @param {string} guildId
 * @param {string} userId
 * @param {number} amount
 * @param {number} cooldownMs
 * @returns {Promise<{
 *     awarded: boolean,
 *     xpAwarded: number,
 *     previousLevel: number,
 *     newLevel: number,
 *     leveledUp: boolean,
 *     data: Object
 * }>}
 */
async function addXp(
    guildId,
    userId,
    amount,
    cooldownMs =
        DEFAULT_XP_COOLDOWN_MS
) {
    const safeAmount =
        Math.max(
            0,
            Math.floor(
                Number(amount) || 0
            )
        );

    const safeCooldownMs =
        Math.max(
            1_000,
            Math.floor(
                Number(cooldownMs) ||
                DEFAULT_XP_COOLDOWN_MS
            )
        );

    if (safeAmount <= 0) {
        const existingData =
            await ensureUserLevel(
                guildId,
                userId
            );

        return {
            awarded:
                false,

            xpAwarded:
                0,

            previousLevel:
                existingData.level,

            newLevel:
                existingData.level,

            leveledUp:
                false,

            data:
                existingData
        };
    }

    const currentData =
        await ensureUserLevel(
            guildId,
            userId
        );

    const previousLevel =
        currentData.level;

    const result =
        await query(
            `
                UPDATE levels
                SET
                    message_count =
                        message_count + 1,

                    xp =
                        CASE
                            WHEN
                                last_xp_at IS NULL
                                OR last_xp_at <=
                                    NOW() -
                                    (
                                        $4::BIGINT *
                                        INTERVAL '1 millisecond'
                                    )
                            THEN
                                xp + $3
                            ELSE
                                xp
                        END,

                    last_xp_at =
                        CASE
                            WHEN
                                last_xp_at IS NULL
                                OR last_xp_at <=
                                    NOW() -
                                    (
                                        $4::BIGINT *
                                        INTERVAL '1 millisecond'
                                    )
                            THEN
                                NOW()
                            ELSE
                                last_xp_at
                        END,

                    updated_at =
                        NOW()

                WHERE guild_id = $1
                  AND user_id = $2

                RETURNING
                    *,
                    (
                        last_xp_at IS NOT NULL
                        AND last_xp_at >
                            NOW() -
                            INTERVAL '2 seconds'
                    ) AS xp_was_awarded;
            `,
            [
                guildId,
                userId,
                safeAmount,
                safeCooldownMs
            ]
        );

    const updatedRow =
        result.rows[0];

    const updatedXp =
        Number(
            updatedRow.xp || 0
        );

    const calculatedLevel =
        calculateLevelFromXp(
            updatedXp
        );

    /*
     * Keep the stored Level synchronized
     * with the XP formula.
     */
    let finalRow =
        updatedRow;

    if (
        Number(updatedRow.level) !==
        calculatedLevel
    ) {
        const levelResult =
            await query(
                `
                    UPDATE levels
                    SET
                        level = $3,
                        updated_at = NOW()
                    WHERE guild_id = $1
                      AND user_id = $2
                    RETURNING *;
                `,
                [
                    guildId,
                    userId,
                    calculatedLevel
                ]
            );

        finalRow =
            levelResult.rows[0];
    }

    const data =
        mapLevelRow(
            finalRow
        );

    const awarded =
        Boolean(
            updatedRow.xp_was_awarded
        );

    return {
        awarded,

        xpAwarded:
            awarded
                ? safeAmount
                : 0,

        previousLevel,

        newLevel:
            data.level,

        leveledUp:
            data.level >
            previousLevel,

        data
    };
}

/**
 * Add XP without using the cooldown.
 *
 * Intended for Administrator commands.
 *
 * @param {string} guildId
 * @param {string} userId
 * @param {number} amount
 * @returns {Promise<Object>}
 */
async function addXpAdmin(
    guildId,
    userId,
    amount
) {
    const safeAmount =
        Math.max(
            0,
            Math.floor(
                Number(amount) || 0
            )
        );

    await ensureUserLevel(
        guildId,
        userId
    );

    const currentData =
        await getUserLevel(
            guildId,
            userId
        );

    const newXp =
        currentData.xp +
        safeAmount;

    const newLevel =
        calculateLevelFromXp(
            newXp
        );

    const result =
        await query(
            `
                UPDATE levels
                SET
                    xp = $3,
                    level = $4,
                    updated_at = NOW()
                WHERE guild_id = $1
                  AND user_id = $2
                RETURNING *;
            `,
            [
                guildId,
                userId,
                newXp,
                newLevel
            ]
        );

    return mapLevelRow(
        result.rows[0]
    );
}

/**
 * Remove XP from a Soul.
 *
 * XP can never fall below zero.
 *
 * @param {string} guildId
 * @param {string} userId
 * @param {number} amount
 * @returns {Promise<Object>}
 */
async function removeXp(
    guildId,
    userId,
    amount
) {
    const safeAmount =
        Math.max(
            0,
            Math.floor(
                Number(amount) || 0
            )
        );

    await ensureUserLevel(
        guildId,
        userId
    );

    const currentData =
        await getUserLevel(
            guildId,
            userId
        );

    const newXp =
        Math.max(
            0,
            currentData.xp -
            safeAmount
        );

    const newLevel =
        calculateLevelFromXp(
            newXp
        );

    const result =
        await query(
            `
                UPDATE levels
                SET
                    xp = $3,
                    level = $4,
                    updated_at = NOW()
                WHERE guild_id = $1
                  AND user_id = $2
                RETURNING *;
            `,
            [
                guildId,
                userId,
                newXp,
                newLevel
            ]
        );

    return mapLevelRow(
        result.rows[0]
    );
}

/**
 * Set a Soul's total XP.
 *
 * @param {string} guildId
 * @param {string} userId
 * @param {number} totalXp
 * @returns {Promise<Object>}
 */
async function setXp(
    guildId,
    userId,
    totalXp
) {
    const safeXp =
        Math.max(
            0,
            Math.floor(
                Number(totalXp) || 0
            )
        );

    const level =
        calculateLevelFromXp(
            safeXp
        );

    const result =
        await query(
            `
                INSERT INTO levels (
                    guild_id,
                    user_id,
                    xp,
                    level,
                    message_count
                )
                VALUES (
                    $1,
                    $2,
                    $3,
                    $4,
                    0
                )
                ON CONFLICT (
                    guild_id,
                    user_id
                )
                DO UPDATE SET
                    xp =
                        EXCLUDED.xp,

                    level =
                        EXCLUDED.level,

                    updated_at =
                        NOW()
                RETURNING *;
            `,
            [
                guildId,
                userId,
                safeXp,
                level
            ]
        );

    return mapLevelRow(
        result.rows[0]
    );
}

/**
 * Set a Soul's Level.
 *
 * XP is changed to the minimum XP
 * required for that Level.
 *
 * @param {string} guildId
 * @param {string} userId
 * @param {number} level
 * @returns {Promise<Object>}
 */
async function setLevel(
    guildId,
    userId,
    level
) {
    const safeLevel =
        Math.max(
            0,
            Math.floor(
                Number(level) || 0
            )
        );

    const totalXp =
        getTotalXpForLevel(
            safeLevel
        );

    return setXp(
        guildId,
        userId,
        totalXp
    );
}

/**
 * Reset one Soul's Level data.
 *
 * @param {string} guildId
 * @param {string} userId
 * @returns {Promise<Object>}
 */
async function resetUserLevel(
    guildId,
    userId
) {
    const result =
        await query(
            `
                INSERT INTO levels (
                    guild_id,
                    user_id,
                    xp,
                    level,
                    message_count,
                    last_xp_at
                )
                VALUES (
                    $1,
                    $2,
                    0,
                    0,
                    0,
                    NULL
                )
                ON CONFLICT (
                    guild_id,
                    user_id
                )
                DO UPDATE SET
                    xp = 0,
                    level = 0,
                    message_count = 0,
                    last_xp_at = NULL,
                    updated_at = NOW()
                RETURNING *;
            `,
            [
                guildId,
                userId
            ]
        );

    return mapLevelRow(
        result.rows[0]
    );
}

/**
 * Get a server leaderboard.
 *
 * @param {string} guildId
 * @param {number} limit
 * @returns {Promise<Object[]>}
 */
async function getLeaderboard(
    guildId,
    limit = 10
) {
    const safeLimit =
        Math.min(
            100,
            Math.max(
                1,
                Math.floor(
                    Number(limit) || 10
                )
            )
        );

    const result =
        await query(
            `
                SELECT
                    *,
                    ROW_NUMBER() OVER (
                        ORDER BY
                            xp DESC,
                            message_count DESC,
                            created_at ASC
                    ) AS rank_position

                FROM levels
                WHERE guild_id = $1

                ORDER BY
                    xp DESC,
                    message_count DESC,
                    created_at ASC

                LIMIT $2;
            `,
            [
                guildId,
                safeLimit
            ]
        );

    return result.rows.map(
        row => ({
            ...mapLevelRow(row),

            rank:
                Number(
                    row.rank_position
                )
        })
    );
}

/**
 * Get one Soul's server Rank.
 *
 * @param {string} guildId
 * @param {string} userId
 * @returns {Promise<number|null>}
 */
async function getUserRank(
    guildId,
    userId
) {
    const result =
        await query(
            `
                SELECT rank_position
                FROM (
                    SELECT
                        user_id,

                        ROW_NUMBER() OVER (
                            ORDER BY
                                xp DESC,
                                message_count DESC,
                                created_at ASC
                        ) AS rank_position

                    FROM levels
                    WHERE guild_id = $1
                ) ranked_levels

                WHERE user_id = $2
                LIMIT 1;
            `,
            [
                guildId,
                userId
            ]
        );

    if (
        result.rows.length === 0
    ) {
        return null;
    }

    return Number(
        result.rows[0]
            .rank_position
    );
}

/**
 * Create or update a Level reward role.
 *
 * @param {string} guildId
 * @param {number} level
 * @param {string} roleId
 * @param {string} createdBy
 * @returns {Promise<Object>}
 */
async function addLevelReward(
    guildId,
    level,
    roleId,
    createdBy
) {
    const safeLevel =
        Math.max(
            1,
            Math.floor(
                Number(level) || 1
            )
        );

    const result =
        await query(
            `
                INSERT INTO level_rewards (
                    guild_id,
                    level,
                    role_id,
                    created_by
                )
                VALUES (
                    $1,
                    $2,
                    $3,
                    $4
                )
                ON CONFLICT (
                    guild_id,
                    level,
                    role_id
                )
                DO UPDATE SET
                    created_by =
                        EXCLUDED.created_by
                RETURNING *;
            `,
            [
                guildId,
                safeLevel,
                roleId,
                createdBy
            ]
        );

    return {
        guildId:
            result.rows[0].guild_id,

        level:
            Number(
                result.rows[0].level
            ),

        roleId:
            result.rows[0].role_id,

        createdBy:
            result.rows[0].created_by,

        createdAt:
            new Date(
                result.rows[0]
                    .created_at
            )
    };
}

/**
 * Remove a configured Level reward.
 *
 * @param {string} guildId
 * @param {number} level
 * @param {string} roleId
 * @returns {Promise<boolean>}
 */
async function removeLevelReward(
    guildId,
    level,
    roleId
) {
    const result =
        await query(
            `
                DELETE FROM level_rewards
                WHERE guild_id = $1
                  AND level = $2
                  AND role_id = $3
                RETURNING role_id;
            `,
            [
                guildId,
                level,
                roleId
            ]
        );

    return (
        result.rows.length >
        0
    );
}

/**
 * Get every configured Level reward.
 *
 * @param {string} guildId
 * @returns {Promise<Object[]>}
 */
async function getLevelRewards(
    guildId
) {
    const result =
        await query(
            `
                SELECT *
                FROM level_rewards
                WHERE guild_id = $1
                ORDER BY
                    level ASC,
                    created_at ASC;
            `,
            [
                guildId
            ]
        );

    return result.rows.map(
        row => ({
            guildId:
                row.guild_id,

            level:
                Number(
                    row.level
                ),

            roleId:
                row.role_id,

            createdBy:
                row.created_by,

            createdAt:
                new Date(
                    row.created_at
                )
        })
    );
}

/**
 * Get all rewards earned at or below
 * a Soul's current Level.
 *
 * @param {string} guildId
 * @param {number} level
 * @returns {Promise<Object[]>}
 */
async function getEarnedLevelRewards(
    guildId,
    level
) {
    const safeLevel =
        Math.max(
            0,
            Math.floor(
                Number(level) || 0
            )
        );

    const result =
        await query(
            `
                SELECT *
                FROM level_rewards
                WHERE guild_id = $1
                  AND level <= $2
                ORDER BY
                    level ASC,
                    created_at ASC;
            `,
            [
                guildId,
                safeLevel
            ]
        );

    return result.rows.map(
        row => ({
            guildId:
                row.guild_id,

            level:
                Number(
                    row.level
                ),

            roleId:
                row.role_id,

            createdBy:
                row.created_by,

            createdAt:
                new Date(
                    row.created_at
                )
        })
    );
}

module.exports = {
    XP_MULTIPLIER,
    DEFAULT_XP_COOLDOWN_MS,

    getTotalXpForLevel,
    calculateLevelFromXp,
    calculateLevelProgress,

    getUserLevel,
    ensureUserLevel,
    canReceiveXp,
    incrementMessageCount,
    addXp,
    addXpAdmin,
    removeXp,
    setXp,
    setLevel,
    resetUserLevel,

    getLeaderboard,
    getUserRank,

    addLevelReward,
    removeLevelReward,
    getLevelRewards,
    getEarnedLevelRewards
};