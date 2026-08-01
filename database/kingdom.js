const {
    query
} = require('./connection');

/**
 * Convert a PostgreSQL Kingdom Level row
 * into Umbra's readable structure.
 *
 * @param {Object|null} row
 * @returns {Object|null}
 */
function mapLevelLeaderboardRow(
    row
) {
    if (!row) {
        return null;
    }

    return {
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
 * Convert an Achievement leaderboard row
 * into Umbra's readable structure.
 *
 * @param {Object|null} row
 * @returns {Object|null}
 */
function mapAchievementLeaderboardRow(
    row
) {
    if (!row) {
        return null;
    }

    return {
        userId:
            row.user_id,

        achievementCount:
            Number(
                row.achievement_count || 0
            ),

        latestAchievementAt:
            row.latest_achievement_at
                ? new Date(
                    row.latest_achievement_at
                )
                : null,

        rank:
            Number(
                row.rank_position || 0
            )
    };
}

/**
 * Convert a recent Achievement row
 * into Umbra's readable structure.
 *
 * @param {Object|null} row
 * @returns {Object|null}
 */
function mapRecentAchievementRow(
    row
) {
    if (!row) {
        return null;
    }

    return {
        userId:
            row.user_id,

        achievementId:
            row.achievement_id,

        name:
            row.name,

        description:
            row.description,

        icon:
            row.icon,

        category:
            row.category,

        unlockedAt:
            row.unlocked_at
                ? new Date(
                    row.unlocked_at
                )
                : null
    };
}

/**
 * Safely normalize a leaderboard limit.
 *
 * @param {number} limit
 * @param {number} defaultLimit
 * @param {number} maximumLimit
 * @returns {number}
 */
function normalizeLimit(
    limit,
    defaultLimit = 5,
    maximumLimit = 25
) {
    return Math.min(
        maximumLimit,
        Math.max(
            1,
            Math.floor(
                Number(limit) ||
                defaultLimit
            )
        )
    );
}

/**
 * Get the highest-Level Souls
 * inside one server.
 *
 * Ranking order:
 * 1. XP
 * 2. Message count
 * 3. Oldest record
 *
 * @param {string} guildId
 * @param {number} limit
 * @returns {Promise<Object[]>}
 */
async function getLevelLeaderboard(
    guildId,
    limit = 5
) {
    const safeLimit =
        normalizeLimit(
            limit,
            5,
            25
        );

    const result =
        await query(
            `
                SELECT
                    guild_id,
                    user_id,
                    xp,
                    level,
                    message_count,
                    created_at,
                    updated_at,

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
        mapLevelLeaderboardRow
    );
}

/**
 * Get the most active Souls
 * according to recorded messages.
 *
 * @param {string} guildId
 * @param {number} limit
 * @returns {Promise<Object[]>}
 */
async function getMessageLeaderboard(
    guildId,
    limit = 5
) {
    const safeLimit =
        normalizeLimit(
            limit,
            5,
            25
        );

    const result =
        await query(
            `
                SELECT
                    guild_id,
                    user_id,
                    xp,
                    level,
                    message_count,
                    created_at,
                    updated_at,

                    ROW_NUMBER() OVER (
                        ORDER BY
                            message_count DESC,
                            xp DESC,
                            created_at ASC
                    ) AS rank_position

                FROM levels

                WHERE guild_id = $1

                ORDER BY
                    message_count DESC,
                    xp DESC,
                    created_at ASC

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
 * Get the Souls with the most unlocked
 * Achievements inside one server.
 *
 * @param {string} guildId
 * @param {number} limit
 * @returns {Promise<Object[]>}
 */
async function getAchievementLeaderboard(
    guildId,
    limit = 5
) {
    const safeLimit =
        normalizeLimit(
            limit,
            5,
            25
        );

    const result =
        await query(
            `
                SELECT
                    guild_id,
                    user_id,

                    COUNT(*)::INTEGER
                        AS achievement_count,

                    MAX(unlocked_at)
                        AS latest_achievement_at,

                    ROW_NUMBER() OVER (
                        ORDER BY
                            COUNT(*) DESC,
                            MAX(unlocked_at) ASC,
                            user_id ASC
                    ) AS rank_position

                FROM soul_achievements

                WHERE guild_id = $1

                GROUP BY
                    guild_id,
                    user_id

                ORDER BY
                    achievement_count DESC,
                    latest_achievement_at ASC,
                    user_id ASC

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
 * Get the most recently unlocked
 * Achievements inside one server.
 *
 * @param {string} guildId
 * @param {number} limit
 * @returns {Promise<Object[]>}
 */
async function getRecentKingdomAchievements(
    guildId,
    limit = 5
) {
    const safeLimit =
        normalizeLimit(
            limit,
            5,
            20
        );

    const result =
        await query(
            `
                SELECT
                    soul_achievements.guild_id,
                    soul_achievements.user_id,
                    soul_achievements.achievement_id,
                    soul_achievements.unlocked_at,

                    achievements.name,
                    achievements.description,
                    achievements.icon,
                    achievements.category

                FROM soul_achievements

                INNER JOIN achievements
                    ON achievements.achievement_id =
                        soul_achievements.achievement_id

                WHERE soul_achievements.guild_id = $1

                ORDER BY
                    soul_achievements.unlocked_at DESC

                LIMIT $2;
            `,
            [
                guildId,
                safeLimit
            ]
        );

    return result.rows.map(
        mapRecentAchievementRow
    );
}

/**
 * Get total Kingdom progression statistics.
 *
 * @param {string} guildId
 * @returns {Promise<Object>}
 */
async function getProgressionStatistics(
    guildId
) {
    const result =
        await query(
            `
                SELECT
                    COUNT(*)::INTEGER
                        AS registered_souls,

                    COALESCE(
                        SUM(xp),
                        0
                    )::BIGINT
                        AS total_xp,

                    COALESCE(
                        SUM(message_count),
                        0
                    )::BIGINT
                        AS total_messages,

                    COALESCE(
                        AVG(level),
                        0
                    )::NUMERIC
                        AS average_level,

                    COALESCE(
                        MAX(level),
                        0
                    )::INTEGER
                        AS highest_level,

                    COALESCE(
                        MAX(xp),
                        0
                    )::BIGINT
                        AS highest_xp

                FROM levels

                WHERE guild_id = $1;
            `,
            [
                guildId
            ]
        );

    const row =
        result.rows[0] || {};

    return {
        registeredSouls:
            Number(
                row.registered_souls || 0
            ),

        totalXp:
            Number(
                row.total_xp || 0
            ),

        totalMessages:
            Number(
                row.total_messages || 0
            ),

        averageLevel:
            Number(
                row.average_level || 0
            ),

        highestLevel:
            Number(
                row.highest_level || 0
            ),

        highestXp:
            Number(
                row.highest_xp || 0
            )
    };
}

/**
 * Get total Kingdom Achievement statistics.
 *
 * @param {string} guildId
 * @returns {Promise<Object>}
 */
async function getAchievementStatistics(
    guildId
) {
    const result =
        await query(
            `
                SELECT
                    (
                        SELECT
                            COUNT(*)::INTEGER
                        FROM achievements
                    ) AS available_achievements,

                    (
                        SELECT
                            COUNT(*)::INTEGER
                        FROM soul_achievements
                        WHERE guild_id = $1
                    ) AS total_unlocks,

                    (
                        SELECT
                            COUNT(
                                DISTINCT user_id
                            )::INTEGER
                        FROM soul_achievements
                        WHERE guild_id = $1
                    ) AS souls_with_achievements;
            `,
            [
                guildId
            ]
        );

    const row =
        result.rows[0] || {};

    return {
        availableAchievements:
            Number(
                row.available_achievements || 0
            ),

        totalUnlocks:
            Number(
                row.total_unlocks || 0
            ),

        soulsWithAchievements:
            Number(
                row.souls_with_achievements || 0
            )
    };
}

/**
 * Get Arrancar Rank statistics from
 * the manual Rank System.
 *
 * @param {string} guildId
 * @returns {Promise<Object>}
 */
async function getRankStatistics(
    guildId
) {
    const result =
        await query(
            `
                SELECT
                    COUNT(*)::INTEGER
                        AS active_ranked_souls,

                    COUNT(*) FILTER (
                        WHERE rank_name IN (
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
                            'Ⅹ Espada'
                        )
                    )::INTEGER
                        AS active_espada,

                    COUNT(*) FILTER (
                        WHERE rank_name =
                            '🌘 Privaron Espada'
                    )::INTEGER
                        AS privaron_espada,

                    COUNT(*) FILTER (
                        WHERE rank_name =
                            '⚔️ Fracción'
                    )::INTEGER
                        AS fraccion,

                    COUNT(*) FILTER (
                        WHERE rank_name =
                            '🦴 Numeros'
                    )::INTEGER
                        AS numeros,

                    COUNT(*) FILTER (
                        WHERE rank_name =
                            '⚪ Unranked Arrancar'
                    )::INTEGER
                        AS unranked_arrancar

                FROM arrancar_ranks

                WHERE guild_id = $1;
            `,
            [
                guildId
            ]
        );

    const row =
        result.rows[0] || {};

    return {
        activeRankedSouls:
            Number(
                row.active_ranked_souls || 0
            ),

        activeEspada:
            Number(
                row.active_espada || 0
            ),

        privaronEspada:
            Number(
                row.privaron_espada || 0
            ),

        fraccion:
            Number(
                row.fraccion || 0
            ),

        numeros:
            Number(
                row.numeros || 0
            ),

        unrankedArrancar:
            Number(
                row.unranked_arrancar || 0
            )
    };
}

/**
 * Get Arrancar Rank history statistics.
 *
 * @param {string} guildId
 * @returns {Promise<Object>}
 */
async function getRankHistoryStatistics(
    guildId
) {
    const result =
        await query(
            `
                SELECT
                    COUNT(*)::INTEGER
                        AS total_rank_records,

                    COUNT(*) FILTER (
                        WHERE action = 'SET'
                    )::INTEGER
                        AS rank_assignments,

                    COUNT(*) FILTER (
                        WHERE action = 'REMOVE'
                    )::INTEGER
                        AS rank_removals,

                    MAX(created_at)
                        AS latest_rank_action_at

                FROM arrancar_rank_history

                WHERE guild_id = $1;
            `,
            [
                guildId
            ]
        );

    const row =
        result.rows[0] || {};

    return {
        totalRankRecords:
            Number(
                row.total_rank_records || 0
            ),

        rankAssignments:
            Number(
                row.rank_assignments || 0
            ),

        rankRemovals:
            Number(
                row.rank_removals || 0
            ),

        latestRankActionAt:
            row.latest_rank_action_at
                ? new Date(
                    row.latest_rank_action_at
                )
                : null
    };
}

/**
 * Get the complete Kingdom statistics
 * required by /lasnoches and future
 * leaderboard commands.
 *
 * @param {string} guildId
 * @param {Object} options
 * @param {number} options.leaderboardLimit
 * @param {number} options.recentAchievementLimit
 * @returns {Promise<Object>}
 */
async function getKingdomStatistics(
    guildId,
    {
        leaderboardLimit = 5,
        recentAchievementLimit = 5
    } = {}
) {
    if (!guildId) {
        throw new TypeError(
            'A guild ID is required to open Kingdom statistics.'
        );
    }

    const [
        progression,
        achievementStatistics,
        rankStatistics,
        rankHistoryStatistics,
        levelLeaderboard,
        messageLeaderboard,
        achievementLeaderboard,
        recentAchievements
    ] =
        await Promise.all([
            getProgressionStatistics(
                guildId
            ),

            getAchievementStatistics(
                guildId
            ),

            getRankStatistics(
                guildId
            ),

            getRankHistoryStatistics(
                guildId
            ),

            getLevelLeaderboard(
                guildId,
                leaderboardLimit
            ),

            getMessageLeaderboard(
                guildId,
                leaderboardLimit
            ),

            getAchievementLeaderboard(
                guildId,
                leaderboardLimit
            ),

            getRecentKingdomAchievements(
                guildId,
                recentAchievementLimit
            )
        ]);

    return {
        guildId,

        generatedAt:
            new Date(),

        progression,

        achievements:
            achievementStatistics,

        ranks:
            rankStatistics,

        rankHistory:
            rankHistoryStatistics,

        leaderboards: {
            levels:
                levelLeaderboard,

            messages:
                messageLeaderboard,

            achievements:
                achievementLeaderboard
        },

        recentAchievements
    };
}

module.exports = {
    getLevelLeaderboard,
    getMessageLeaderboard,
    getAchievementLeaderboard,
    getRecentKingdomAchievements,

    getProgressionStatistics,
    getAchievementStatistics,
    getRankStatistics,
    getRankHistoryStatistics,

    getKingdomStatistics
};