const {
    query
} = require('./connection');

/**
 * Maximum number of rows that one
 * leaderboard query may return.
 */
const MAX_LEADERBOARD_LIMIT =
    100;

/**
 * Normalize a leaderboard limit.
 *
 * @param {number|string|null|undefined} limit
 * @param {number} fallback
 * @returns {number}
 */
function normalizeLimit(
    limit,
    fallback = 10
) {
    return Math.min(
        MAX_LEADERBOARD_LIMIT,
        Math.max(
            1,
            Math.floor(
                Number(
                    limit
                ) ||
                fallback
            )
        )
    );
}

/**
 * Map one Level leaderboard row.
 *
 * @param {Object} row
 * @returns {Object}
 */
function mapLevelLeaderboardRow(
    row
) {
    return {
        guildId:
            row.guild_id,

        userId:
            row.user_id,

        xp:
            Number(
                row.xp || 0
            ),

        level:
            Number(
                row.level || 0
            ),

        messageCount:
            Number(
                row.message_count || 0
            ),

        rank:
            Number(
                row.rank_position || 0
            ),

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
                : null
    };
}

/**
 * Map one Achievement leaderboard row.
 *
 * @param {Object} row
 * @returns {Object}
 */
function mapAchievementLeaderboardRow(
    row
) {
    return {
        guildId:
            row.guild_id,

        userId:
            row.user_id,

        achievementCount:
            Number(
                row.achievement_count || 0
            ),

        rank:
            Number(
                row.rank_position || 0
            ),

        latestUnlockAt:
            row.latest_unlock_at
                ? new Date(
                    row.latest_unlock_at
                )
                : null,

        firstUnlockAt:
            row.first_unlock_at
                ? new Date(
                    row.first_unlock_at
                )
                : null
    };
}

/**
 * Map one Chronicle Title leaderboard row.
 *
 * @param {Object} row
 * @returns {Object}
 */
function mapTitleLeaderboardRow(
    row
) {
    return {
        guildId:
            row.guild_id,

        userId:
            row.user_id,

        titleCount:
            Number(
                row.title_count || 0
            ),

        activeTitleId:
            row.active_title_id ||
            null,

        activeTitleDisplayName:
            row.active_title_display_name ||
            null,

        activeTitleRarity:
            row.active_title_rarity ||
            null,

        rank:
            Number(
                row.rank_position || 0
            ),

        latestUnlockAt:
            row.latest_unlock_at
                ? new Date(
                    row.latest_unlock_at
                )
                : null,

        firstUnlockAt:
            row.first_unlock_at
                ? new Date(
                    row.first_unlock_at
                )
                : null
    };
}

/**
 * Get the Level leaderboard.
 *
 * Ordered by:
 *
 * 1. Level
 * 2. XP
 * 3. Messages
 * 4. Oldest record
 *
 * @param {string} guildId
 * @param {number} limit
 * @returns {Promise<Object[]>}
 */
async function getLevelLeaderboard(
    guildId,
    limit = 10
) {
    const safeLimit =
        normalizeLimit(
            limit
        );

    const result =
        await query(
            `
                SELECT
                    ranked_levels.guild_id,
                    ranked_levels.user_id,
                    ranked_levels.xp,
                    ranked_levels.level,
                    ranked_levels.message_count,
                    ranked_levels.last_xp_at,
                    ranked_levels.created_at,
                    ranked_levels.updated_at,
                    ranked_levels.rank_position

                FROM (
                    SELECT
                        levels.*,

                        ROW_NUMBER() OVER (
                            ORDER BY
                                level DESC,
                                xp DESC,
                                message_count DESC,
                                created_at ASC,
                                user_id ASC
                        ) AS rank_position

                    FROM levels

                    WHERE guild_id = $1
                ) ranked_levels

                ORDER BY
                    ranked_levels.rank_position ASC

                LIMIT $2;
            `,
            [
                guildId,
                safeLimit
            ]
        );

    return result.rows.map(
        mapLevelLeaderboardRow
    );
}

/**
 * Get the Spiritual Power leaderboard.
 *
 * Ordered primarily by total XP.
 *
 * @param {string} guildId
 * @param {number} limit
 * @returns {Promise<Object[]>}
 */
async function getXpLeaderboard(
    guildId,
    limit = 10
) {
    const safeLimit =
        normalizeLimit(
            limit
        );

    const result =
        await query(
            `
                SELECT
                    ranked_levels.guild_id,
                    ranked_levels.user_id,
                    ranked_levels.xp,
                    ranked_levels.level,
                    ranked_levels.message_count,
                    ranked_levels.last_xp_at,
                    ranked_levels.created_at,
                    ranked_levels.updated_at,
                    ranked_levels.rank_position

                FROM (
                    SELECT
                        levels.*,

                        ROW_NUMBER() OVER (
                            ORDER BY
                                xp DESC,
                                level DESC,
                                message_count DESC,
                                created_at ASC,
                                user_id ASC
                        ) AS rank_position

                    FROM levels

                    WHERE guild_id = $1
                ) ranked_levels

                ORDER BY
                    ranked_levels.rank_position ASC

                LIMIT $2;
            `,
            [
                guildId,
                safeLimit
            ]
        );

    return result.rows.map(
        mapLevelLeaderboardRow
    );
}

/**
 * Get the Message Activity leaderboard.
 *
 * @param {string} guildId
 * @param {number} limit
 * @returns {Promise<Object[]>}
 */
async function getMessageLeaderboard(
    guildId,
    limit = 10
) {
    const safeLimit =
        normalizeLimit(
            limit
        );

    const result =
        await query(
            `
                SELECT
                    ranked_levels.guild_id,
                    ranked_levels.user_id,
                    ranked_levels.xp,
                    ranked_levels.level,
                    ranked_levels.message_count,
                    ranked_levels.last_xp_at,
                    ranked_levels.created_at,
                    ranked_levels.updated_at,
                    ranked_levels.rank_position

                FROM (
                    SELECT
                        levels.*,

                        ROW_NUMBER() OVER (
                            ORDER BY
                                message_count DESC,
                                xp DESC,
                                level DESC,
                                created_at ASC,
                                user_id ASC
                        ) AS rank_position

                    FROM levels

                    WHERE guild_id = $1
                ) ranked_levels

                ORDER BY
                    ranked_levels.rank_position ASC

                LIMIT $2;
            `,
            [
                guildId,
                safeLimit
            ]
        );

    return result.rows.map(
        mapLevelLeaderboardRow
    );
}

/**
 * Get the Achievement leaderboard.
 *
 * Souls are ordered by:
 *
 * 1. Number of unlocked Achievements
 * 2. Earliest first Achievement
 * 3. User ID
 *
 * @param {string} guildId
 * @param {number} limit
 * @returns {Promise<Object[]>}
 */
async function getAchievementLeaderboard(
    guildId,
    limit = 10
) {
    const safeLimit =
        normalizeLimit(
            limit
        );

    const result =
        await query(
            `
                WITH achievement_totals AS (
                    SELECT
                        soul_achievements.guild_id,
                        soul_achievements.user_id,

                        COUNT(*)::INTEGER
                            AS achievement_count,

                        MIN(
                            soul_achievements.unlocked_at
                        ) AS first_unlock_at,

                        MAX(
                            soul_achievements.unlocked_at
                        ) AS latest_unlock_at

                    FROM soul_achievements

                    WHERE soul_achievements.guild_id = $1

                    GROUP BY
                        soul_achievements.guild_id,
                        soul_achievements.user_id
                ),

                ranked_achievements AS (
                    SELECT
                        achievement_totals.*,

                        ROW_NUMBER() OVER (
                            ORDER BY
                                achievement_count DESC,
                                first_unlock_at ASC,
                                user_id ASC
                        ) AS rank_position

                    FROM achievement_totals
                )

                SELECT
                    ranked_achievements.*

                FROM ranked_achievements

                ORDER BY
                    ranked_achievements.rank_position ASC

                LIMIT $2;
            `,
            [
                guildId,
                safeLimit
            ]
        );

    return result.rows.map(
        mapAchievementLeaderboardRow
    );
}

/**
 * Get the Chronicle Title leaderboard.
 *
 * The active Title is included when one
 * exists for the ranked Soul.
 *
 * @param {string} guildId
 * @param {number} limit
 * @returns {Promise<Object[]>}
 */
async function getTitleLeaderboard(
    guildId,
    limit = 10
) {
    const safeLimit =
        normalizeLimit(
            limit
        );

    const result =
        await query(
            `
                WITH title_totals AS (
                    SELECT
                        soul_titles.guild_id,
                        soul_titles.user_id,

                        COUNT(*)::INTEGER
                            AS title_count,

                        MIN(
                            soul_titles.unlocked_at
                        ) AS first_unlock_at,

                        MAX(
                            soul_titles.unlocked_at
                        ) AS latest_unlock_at

                    FROM soul_titles

                    WHERE soul_titles.guild_id = $1

                    GROUP BY
                        soul_titles.guild_id,
                        soul_titles.user_id
                ),

                active_titles AS (
                    SELECT
                        soul_titles.guild_id,
                        soul_titles.user_id,

                        soul_titles.title_id
                            AS active_title_id,

                        title_definitions.display_name
                            AS active_title_display_name,

                        title_definitions.rarity
                            AS active_title_rarity

                    FROM soul_titles

                    INNER JOIN title_definitions
                        ON title_definitions.title_id =
                            soul_titles.title_id

                    WHERE soul_titles.guild_id = $1
                      AND soul_titles.is_active = TRUE
                ),

                ranked_titles AS (
                    SELECT
                        title_totals.guild_id,
                        title_totals.user_id,
                        title_totals.title_count,
                        title_totals.first_unlock_at,
                        title_totals.latest_unlock_at,

                        active_titles.active_title_id,
                        active_titles.active_title_display_name,
                        active_titles.active_title_rarity,

                        ROW_NUMBER() OVER (
                            ORDER BY
                                title_totals.title_count DESC,
                                title_totals.first_unlock_at ASC,
                                title_totals.user_id ASC
                        ) AS rank_position

                    FROM title_totals

                    LEFT JOIN active_titles
                        ON active_titles.guild_id =
                            title_totals.guild_id
                       AND active_titles.user_id =
                            title_totals.user_id
                )

                SELECT
                    ranked_titles.*

                FROM ranked_titles

                ORDER BY
                    ranked_titles.rank_position ASC

                LIMIT $2;
            `,
            [
                guildId,
                safeLimit
            ]
        );

    return result.rows.map(
        mapTitleLeaderboardRow
    );
}

/**
 * Get one Soul's Level leaderboard
 * position.
 *
 * @param {string} guildId
 * @param {string} userId
 * @returns {Promise<Object|null>}
 */
async function getLevelPosition(
    guildId,
    userId
) {
    const result =
        await query(
            `
                SELECT
                    ranked_levels.guild_id,
                    ranked_levels.user_id,
                    ranked_levels.xp,
                    ranked_levels.level,
                    ranked_levels.message_count,
                    ranked_levels.last_xp_at,
                    ranked_levels.created_at,
                    ranked_levels.updated_at,
                    ranked_levels.rank_position

                FROM (
                    SELECT
                        levels.*,

                        ROW_NUMBER() OVER (
                            ORDER BY
                                level DESC,
                                xp DESC,
                                message_count DESC,
                                created_at ASC,
                                user_id ASC
                        ) AS rank_position

                    FROM levels

                    WHERE guild_id = $1
                ) ranked_levels

                WHERE ranked_levels.user_id = $2

                LIMIT 1;
            `,
            [
                guildId,
                userId
            ]
        );

    return result.rows[0]
        ? mapLevelLeaderboardRow(
            result.rows[0]
        )
        : null;
}

/**
 * Get one Soul's Spiritual Power
 * leaderboard position.
 *
 * @param {string} guildId
 * @param {string} userId
 * @returns {Promise<Object|null>}
 */
async function getXpPosition(
    guildId,
    userId
) {
    const result =
        await query(
            `
                SELECT
                    ranked_levels.guild_id,
                    ranked_levels.user_id,
                    ranked_levels.xp,
                    ranked_levels.level,
                    ranked_levels.message_count,
                    ranked_levels.last_xp_at,
                    ranked_levels.created_at,
                    ranked_levels.updated_at,
                    ranked_levels.rank_position

                FROM (
                    SELECT
                        levels.*,

                        ROW_NUMBER() OVER (
                            ORDER BY
                                xp DESC,
                                level DESC,
                                message_count DESC,
                                created_at ASC,
                                user_id ASC
                        ) AS rank_position

                    FROM levels

                    WHERE guild_id = $1
                ) ranked_levels

                WHERE ranked_levels.user_id = $2

                LIMIT 1;
            `,
            [
                guildId,
                userId
            ]
        );

    return result.rows[0]
        ? mapLevelLeaderboardRow(
            result.rows[0]
        )
        : null;
}

/**
 * Get one Soul's Message Activity
 * leaderboard position.
 *
 * @param {string} guildId
 * @param {string} userId
 * @returns {Promise<Object|null>}
 */
async function getMessagePosition(
    guildId,
    userId
) {
    const result =
        await query(
            `
                SELECT
                    ranked_levels.guild_id,
                    ranked_levels.user_id,
                    ranked_levels.xp,
                    ranked_levels.level,
                    ranked_levels.message_count,
                    ranked_levels.last_xp_at,
                    ranked_levels.created_at,
                    ranked_levels.updated_at,
                    ranked_levels.rank_position

                FROM (
                    SELECT
                        levels.*,

                        ROW_NUMBER() OVER (
                            ORDER BY
                                message_count DESC,
                                xp DESC,
                                level DESC,
                                created_at ASC,
                                user_id ASC
                        ) AS rank_position

                    FROM levels

                    WHERE guild_id = $1
                ) ranked_levels

                WHERE ranked_levels.user_id = $2

                LIMIT 1;
            `,
            [
                guildId,
                userId
            ]
        );

    return result.rows[0]
        ? mapLevelLeaderboardRow(
            result.rows[0]
        )
        : null;
}

/**
 * Get one Soul's Achievement leaderboard
 * position.
 *
 * @param {string} guildId
 * @param {string} userId
 * @returns {Promise<Object|null>}
 */
async function getAchievementPosition(
    guildId,
    userId
) {
    const result =
        await query(
            `
                WITH achievement_totals AS (
                    SELECT
                        soul_achievements.guild_id,
                        soul_achievements.user_id,

                        COUNT(*)::INTEGER
                            AS achievement_count,

                        MIN(
                            soul_achievements.unlocked_at
                        ) AS first_unlock_at,

                        MAX(
                            soul_achievements.unlocked_at
                        ) AS latest_unlock_at

                    FROM soul_achievements

                    WHERE soul_achievements.guild_id = $1

                    GROUP BY
                        soul_achievements.guild_id,
                        soul_achievements.user_id
                ),

                ranked_achievements AS (
                    SELECT
                        achievement_totals.*,

                        ROW_NUMBER() OVER (
                            ORDER BY
                                achievement_count DESC,
                                first_unlock_at ASC,
                                user_id ASC
                        ) AS rank_position

                    FROM achievement_totals
                )

                SELECT
                    ranked_achievements.*

                FROM ranked_achievements

                WHERE ranked_achievements.user_id = $2

                LIMIT 1;
            `,
            [
                guildId,
                userId
            ]
        );

    return result.rows[0]
        ? mapAchievementLeaderboardRow(
            result.rows[0]
        )
        : null;
}

/**
 * Get one Soul's Chronicle Title
 * leaderboard position.
 *
 * @param {string} guildId
 * @param {string} userId
 * @returns {Promise<Object|null>}
 */
async function getTitlePosition(
    guildId,
    userId
) {
    const result =
        await query(
            `
                WITH title_totals AS (
                    SELECT
                        soul_titles.guild_id,
                        soul_titles.user_id,

                        COUNT(*)::INTEGER
                            AS title_count,

                        MIN(
                            soul_titles.unlocked_at
                        ) AS first_unlock_at,

                        MAX(
                            soul_titles.unlocked_at
                        ) AS latest_unlock_at

                    FROM soul_titles

                    WHERE soul_titles.guild_id = $1

                    GROUP BY
                        soul_titles.guild_id,
                        soul_titles.user_id
                ),

                active_titles AS (
                    SELECT
                        soul_titles.guild_id,
                        soul_titles.user_id,

                        soul_titles.title_id
                            AS active_title_id,

                        title_definitions.display_name
                            AS active_title_display_name,

                        title_definitions.rarity
                            AS active_title_rarity

                    FROM soul_titles

                    INNER JOIN title_definitions
                        ON title_definitions.title_id =
                            soul_titles.title_id

                    WHERE soul_titles.guild_id = $1
                      AND soul_titles.is_active = TRUE
                ),

                ranked_titles AS (
                    SELECT
                        title_totals.guild_id,
                        title_totals.user_id,
                        title_totals.title_count,
                        title_totals.first_unlock_at,
                        title_totals.latest_unlock_at,

                        active_titles.active_title_id,
                        active_titles.active_title_display_name,
                        active_titles.active_title_rarity,

                        ROW_NUMBER() OVER (
                            ORDER BY
                                title_totals.title_count DESC,
                                title_totals.first_unlock_at ASC,
                                title_totals.user_id ASC
                        ) AS rank_position

                    FROM title_totals

                    LEFT JOIN active_titles
                        ON active_titles.guild_id =
                            title_totals.guild_id
                       AND active_titles.user_id =
                            title_totals.user_id
                )

                SELECT
                    ranked_titles.*

                FROM ranked_titles

                WHERE ranked_titles.user_id = $2

                LIMIT 1;
            `,
            [
                guildId,
                userId
            ]
        );

    return result.rows[0]
        ? mapTitleLeaderboardRow(
            result.rows[0]
        )
        : null;
}

/**
 * Count Souls with a Level record.
 *
 * @param {string} guildId
 * @returns {Promise<number>}
 */
async function countLevelLeaderboardSouls(
    guildId
) {
    const result =
        await query(
            `
                SELECT
                    COUNT(*)::INTEGER
                        AS total

                FROM levels

                WHERE guild_id = $1;
            `,
            [
                guildId
            ]
        );

    return Number(
        result.rows[0]?.total ||
        0
    );
}

/**
 * Count Souls with at least one
 * unlocked Achievement.
 *
 * @param {string} guildId
 * @returns {Promise<number>}
 */
async function countAchievementLeaderboardSouls(
    guildId
) {
    const result =
        await query(
            `
                SELECT
                    COUNT(
                        DISTINCT user_id
                    )::INTEGER AS total

                FROM soul_achievements

                WHERE guild_id = $1;
            `,
            [
                guildId
            ]
        );

    return Number(
        result.rows[0]?.total ||
        0
    );
}

/**
 * Count Souls with at least one
 * unlocked Chronicle Title.
 *
 * @param {string} guildId
 * @returns {Promise<number>}
 */
async function countTitleLeaderboardSouls(
    guildId
) {
    const result =
        await query(
            `
                SELECT
                    COUNT(
                        DISTINCT user_id
                    )::INTEGER AS total

                FROM soul_titles

                WHERE guild_id = $1;
            `,
            [
                guildId
            ]
        );

    return Number(
        result.rows[0]?.total ||
        0
    );
}

module.exports = {
    MAX_LEADERBOARD_LIMIT,

    getLevelLeaderboard,
    getXpLeaderboard,
    getMessageLeaderboard,
    getAchievementLeaderboard,
    getTitleLeaderboard,

    getLevelPosition,
    getXpPosition,
    getMessagePosition,
    getAchievementPosition,
    getTitlePosition,

    countLevelLeaderboardSouls,
    countAchievementLeaderboardSouls,
    countTitleLeaderboardSouls
};