const {
    query
} = require('./connection');

const leaderboardDatabase =
    require('./leaderboards');

/**
 * Normalize a database query limit.
 *
 * @param {number|string|null|undefined} limit
 * @param {number} fallback
 * @param {number} maximum
 * @returns {number}
 */
function normalizeLimit(
    limit,
    fallback = 5,
    maximum = 25
) {
    return Math.min(
        maximum,
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
 * Map a recent Achievement row.
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
        guildId:
            row.guild_id,

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
 * Map a recent Chronicle Title row.
 *
 * @param {Object|null} row
 * @returns {Object|null}
 */
function mapRecentTitleRow(
    row
) {
    if (!row) {
        return null;
    }

    return {
        guildId:
            row.guild_id,

        userId:
            row.user_id,

        titleId:
            row.title_id,

        name:
            row.name,

        displayName:
            row.display_name,

        description:
            row.description,

        category:
            row.category,

        rarity:
            row.rarity,

        unlockSource:
            row.unlock_source,

        unlockedBy:
            row.unlocked_by,

        isActive:
            Boolean(
                row.is_active
            ),

        unlockedAt:
            row.unlocked_at
                ? new Date(
                    row.unlocked_at
                )
                : null,

        activatedAt:
            row.activated_at
                ? new Date(
                    row.activated_at
                )
                : null
    };
}

/**
 * Map a recent Arrancar Rank history row.
 *
 * @param {Object|null} row
 * @returns {Object|null}
 */
function mapRecentRankHistoryRow(
    row
) {
    if (!row) {
        return null;
    }

    return {
        id:
            Number(
                row.id || 0
            ),

        guildId:
            row.guild_id,

        userId:
            row.user_id,

        moderatorId:
            row.moderator_id,

        action:
            row.action,

        oldRank:
            row.old_rank,

        newRank:
            row.new_rank,

        reason:
            row.reason,

        createdAt:
            row.created_at
                ? new Date(
                    row.created_at
                )
                : null
    };
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

                    COUNT(*) FILTER (
                        WHERE xp > 0
                           OR message_count > 0
                    )::INTEGER
                        AS active_souls,

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
                        AVG(xp),
                        0
                    )::NUMERIC
                        AS average_xp,

                    COALESCE(
                        AVG(message_count),
                        0
                    )::NUMERIC
                        AS average_messages,

                    COALESCE(
                        MAX(level),
                        0
                    )::INTEGER
                        AS highest_level,

                    COALESCE(
                        MAX(xp),
                        0
                    )::BIGINT
                        AS highest_xp,

                    COALESCE(
                        MAX(message_count),
                        0
                    )::BIGINT
                        AS highest_message_count,

                    MIN(created_at)
                        AS first_soul_record_at,

                    MAX(updated_at)
                        AS latest_progression_update_at

                FROM levels

                WHERE guild_id = $1;
            `,
            [
                guildId
            ]
        );

    const row =
        result.rows[0] ||
        {};

    return {
        registeredSouls:
            Number(
                row.registered_souls || 0
            ),

        activeSouls:
            Number(
                row.active_souls || 0
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

        averageXp:
            Number(
                row.average_xp || 0
            ),

        averageMessages:
            Number(
                row.average_messages || 0
            ),

        highestLevel:
            Number(
                row.highest_level || 0
            ),

        highestXp:
            Number(
                row.highest_xp || 0
            ),

        highestMessageCount:
            Number(
                row.highest_message_count || 0
            ),

        firstSoulRecordAt:
            row.first_soul_record_at
                ? new Date(
                    row.first_soul_record_at
                )
                : null,

        latestProgressionUpdateAt:
            row.latest_progression_update_at
                ? new Date(
                    row.latest_progression_update_at
                )
                : null
    };
}

/**
 * Get Achievement statistics.
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
                    ) AS souls_with_achievements,

                    (
                        SELECT
                            MIN(unlocked_at)

                        FROM soul_achievements

                        WHERE guild_id = $1
                    ) AS first_unlock_at,

                    (
                        SELECT
                            MAX(unlocked_at)

                        FROM soul_achievements

                        WHERE guild_id = $1
                    ) AS latest_unlock_at;
            `,
            [
                guildId
            ]
        );

    const row =
        result.rows[0] ||
        {};

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
            ),

        firstUnlockAt:
            row.first_unlock_at
                ? new Date(
                    row.first_unlock_at
                )
                : null,

        latestUnlockAt:
            row.latest_unlock_at
                ? new Date(
                    row.latest_unlock_at
                )
                : null
    };
}

/**
 * Get Chronicle Title statistics.
 *
 * @param {string} guildId
 * @returns {Promise<Object>}
 */
async function getTitleStatistics(
    guildId
) {
    const result =
        await query(
            `
                SELECT
                    (
                        SELECT
                            COUNT(*)::INTEGER

                        FROM title_definitions
                    ) AS available_titles,

                    (
                        SELECT
                            COUNT(*)::INTEGER

                        FROM soul_titles

                        WHERE guild_id = $1
                    ) AS total_unlocks,

                    (
                        SELECT
                            COUNT(
                                DISTINCT user_id
                            )::INTEGER

                        FROM soul_titles

                        WHERE guild_id = $1
                    ) AS souls_with_titles,

                    (
                        SELECT
                            COUNT(*)::INTEGER

                        FROM soul_titles

                        WHERE guild_id = $1
                          AND is_active = TRUE
                    ) AS active_titles,

                    (
                        SELECT
                            COUNT(*)::INTEGER

                        FROM soul_titles

                        INNER JOIN title_definitions
                            ON title_definitions.title_id =
                                soul_titles.title_id

                        WHERE soul_titles.guild_id = $1
                          AND title_definitions.rarity IN (
                              'Legendary',
                              'Mythic'
                          )
                    ) AS rare_unlocks,

                    (
                        SELECT
                            MIN(unlocked_at)

                        FROM soul_titles

                        WHERE guild_id = $1
                    ) AS first_unlock_at,

                    (
                        SELECT
                            MAX(unlocked_at)

                        FROM soul_titles

                        WHERE guild_id = $1
                    ) AS latest_unlock_at;
            `,
            [
                guildId
            ]
        );

    const row =
        result.rows[0] ||
        {};

    return {
        availableTitles:
            Number(
                row.available_titles || 0
            ),

        totalUnlocks:
            Number(
                row.total_unlocks || 0
            ),

        soulsWithTitles:
            Number(
                row.souls_with_titles || 0
            ),

        activeTitles:
            Number(
                row.active_titles || 0
            ),

        rareUnlocks:
            Number(
                row.rare_unlocks || 0
            ),

        firstUnlockAt:
            row.first_unlock_at
                ? new Date(
                    row.first_unlock_at
                )
                : null,

        latestUnlockAt:
            row.latest_unlock_at
                ? new Date(
                    row.latest_unlock_at
                )
                : null
    };
}

/**
 * Get Chronicle Title rarity distribution.
 *
 * @param {string} guildId
 * @returns {Promise<Object>}
 */
async function getTitleRarityStatistics(
    guildId
) {
    const result =
        await query(
            `
                SELECT
                    title_definitions.rarity,

                    COUNT(*)::INTEGER
                        AS unlock_count,

                    COUNT(
                        DISTINCT soul_titles.user_id
                    )::INTEGER
                        AS soul_count

                FROM soul_titles

                INNER JOIN title_definitions
                    ON title_definitions.title_id =
                        soul_titles.title_id

                WHERE soul_titles.guild_id = $1

                GROUP BY
                    title_definitions.rarity;
            `,
            [
                guildId
            ]
        );

    const statistics = {
        Common: {
            unlockCount:
                0,

            soulCount:
                0
        },

        Uncommon: {
            unlockCount:
                0,

            soulCount:
                0
        },

        Rare: {
            unlockCount:
                0,

            soulCount:
                0
        },

        Epic: {
            unlockCount:
                0,

            soulCount:
                0
        },

        Legendary: {
            unlockCount:
                0,

            soulCount:
                0
        },

        Mythic: {
            unlockCount:
                0,

            soulCount:
                0
        }
    };

    for (
        const row
        of result.rows
    ) {
        const rarity =
            row.rarity ||
            'Common';

        if (
            !statistics[
                rarity
            ]
        ) {
            statistics[
                rarity
            ] = {
                unlockCount:
                    0,

                soulCount:
                    0
            };
        }

        statistics[
            rarity
        ] = {
            unlockCount:
                Number(
                    row.unlock_count || 0
                ),

            soulCount:
                Number(
                    row.soul_count || 0
                )
        };
    }

    return statistics;
}

/**
 * Get active Arrancar Rank statistics.
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
                        AS unranked_arrancar,

                    MIN(assigned_at)
                        AS oldest_active_assignment_at,

                    MAX(assigned_at)
                        AS latest_active_assignment_at

                FROM arrancar_ranks

                WHERE guild_id = $1;
            `,
            [
                guildId
            ]
        );

    const row =
        result.rows[0] ||
        {};

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
            ),

        oldestActiveAssignmentAt:
            row.oldest_active_assignment_at
                ? new Date(
                    row.oldest_active_assignment_at
                )
                : null,

        latestActiveAssignmentAt:
            row.latest_active_assignment_at
                ? new Date(
                    row.latest_active_assignment_at
                )
                : null
    };
}/**
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

                    COUNT(*) FILTER (
                        WHERE action = 'SET'
                          AND old_rank IS NULL
                    )::INTEGER
                        AS initial_assignments,

                    COUNT(*) FILTER (
                        WHERE action = 'SET'
                          AND old_rank IS NOT NULL
                          AND new_rank IS NOT NULL
                          AND old_rank <> new_rank
                    )::INTEGER
                        AS rank_changes,

                    MIN(created_at)
                        AS first_rank_action_at,

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
        result.rows[0] ||
        {};

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

        initialAssignments:
            Number(
                row.initial_assignments || 0
            ),

        rankChanges:
            Number(
                row.rank_changes || 0
            ),

        firstRankActionAt:
            row.first_rank_action_at
                ? new Date(
                    row.first_rank_action_at
                )
                : null,

        latestRankActionAt:
            row.latest_rank_action_at
                ? new Date(
                    row.latest_rank_action_at
                )
                : null
    };
}

/**
 * Get the most recent Kingdom
 * Achievement unlocks.
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
 * Get the most recently unlocked
 * Chronicle Titles.
 *
 * @param {string} guildId
 * @param {number} limit
 * @returns {Promise<Object[]>}
 */
async function getRecentKingdomTitles(
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
                    soul_titles.guild_id,
                    soul_titles.user_id,
                    soul_titles.title_id,
                    soul_titles.unlocked_by,
                    soul_titles.unlock_source,
                    soul_titles.is_active,
                    soul_titles.unlocked_at,
                    soul_titles.activated_at,

                    title_definitions.name,
                    title_definitions.display_name,
                    title_definitions.description,
                    title_definitions.category,
                    title_definitions.rarity

                FROM soul_titles

                INNER JOIN title_definitions
                    ON title_definitions.title_id =
                        soul_titles.title_id

                WHERE soul_titles.guild_id = $1

                ORDER BY
                    soul_titles.unlocked_at DESC

                LIMIT $2;
            `,
            [
                guildId,
                safeLimit
            ]
        );

    return result.rows.map(
        mapRecentTitleRow
    );
}

/**
 * Get the most recent Arrancar
 * hierarchy actions.
 *
 * @param {string} guildId
 * @param {number} limit
 * @returns {Promise<Object[]>}
 */
async function getRecentRankHistory(
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

                ORDER BY
                    created_at DESC,
                    id DESC

                LIMIT $2;
            `,
            [
                guildId,
                safeLimit
            ]
        );

    return result.rows.map(
        mapRecentRankHistoryRow
    );
}

/**
 * Get high-level Kingdom activity
 * statistics from existing records.
 *
 * @param {string} guildId
 * @returns {Promise<Object>}
 */
async function getActivityStatistics(
    guildId
) {
    const result =
        await query(
            `
                SELECT
                    (
                        SELECT
                            COUNT(*)::INTEGER

                        FROM levels

                        WHERE guild_id = $1
                          AND updated_at >=
                              NOW() -
                              INTERVAL '24 hours'
                    ) AS progression_updates_24h,

                    (
                        SELECT
                            COUNT(*)::INTEGER

                        FROM soul_achievements

                        WHERE guild_id = $1
                          AND unlocked_at >=
                              NOW() -
                              INTERVAL '24 hours'
                    ) AS achievement_unlocks_24h,

                    (
                        SELECT
                            COUNT(*)::INTEGER

                        FROM soul_titles

                        WHERE guild_id = $1
                          AND unlocked_at >=
                              NOW() -
                              INTERVAL '24 hours'
                    ) AS title_unlocks_24h,

                    (
                        SELECT
                            COUNT(*)::INTEGER

                        FROM arrancar_rank_history

                        WHERE guild_id = $1
                          AND created_at >=
                              NOW() -
                              INTERVAL '24 hours'
                    ) AS rank_actions_24h,

                    (
                        SELECT
                            COUNT(*)::INTEGER

                        FROM levels

                        WHERE guild_id = $1
                          AND updated_at >=
                              NOW() -
                              INTERVAL '7 days'
                    ) AS progression_updates_7d,

                    (
                        SELECT
                            COUNT(*)::INTEGER

                        FROM soul_achievements

                        WHERE guild_id = $1
                          AND unlocked_at >=
                              NOW() -
                              INTERVAL '7 days'
                    ) AS achievement_unlocks_7d,

                    (
                        SELECT
                            COUNT(*)::INTEGER

                        FROM soul_titles

                        WHERE guild_id = $1
                          AND unlocked_at >=
                              NOW() -
                              INTERVAL '7 days'
                    ) AS title_unlocks_7d,

                    (
                        SELECT
                            COUNT(*)::INTEGER

                        FROM arrancar_rank_history

                        WHERE guild_id = $1
                          AND created_at >=
                              NOW() -
                              INTERVAL '7 days'
                    ) AS rank_actions_7d;
            `,
            [
                guildId
            ]
        );

    const row =
        result.rows[0] ||
        {};

    return {
        last24Hours: {
            progressionUpdates:
                Number(
                    row.progression_updates_24h || 0
                ),

            achievementUnlocks:
                Number(
                    row.achievement_unlocks_24h || 0
                ),

            titleUnlocks:
                Number(
                    row.title_unlocks_24h || 0
                ),

            rankActions:
                Number(
                    row.rank_actions_24h || 0
                )
        },

        last7Days: {
            progressionUpdates:
                Number(
                    row.progression_updates_7d || 0
                ),

            achievementUnlocks:
                Number(
                    row.achievement_unlocks_7d || 0
                ),

            titleUnlocks:
                Number(
                    row.title_unlocks_7d || 0
                ),

            rankActions:
                Number(
                    row.rank_actions_7d || 0
                )
        }
    };
}

/**
 * Calculate combined Kingdom archive
 * totals from loaded statistics.
 *
 * @param {Object} options
 * @returns {Object}
 */
function buildArchiveSummary({
    progression,
    achievements,
    titles,
    ranks,
    rankHistory
}) {
    const totalArchiveRecords =
        Number(
            progression.registeredSouls || 0
        ) +
        Number(
            achievements.totalUnlocks || 0
        ) +
        Number(
            titles.totalUnlocks || 0
        ) +
        Number(
            ranks.activeRankedSouls || 0
        ) +
        Number(
            rankHistory.totalRankRecords || 0
        );

    const participatingSoulIds =
        Math.max(
            Number(
                progression.registeredSouls || 0
            ),
            Number(
                achievements.soulsWithAchievements || 0
            ),
            Number(
                titles.soulsWithTitles || 0
            ),
            Number(
                ranks.activeRankedSouls || 0
            )
        );

    const averageAchievementUnlocks =
        achievements.soulsWithAchievements >
        0
            ? (
                achievements.totalUnlocks /
                achievements.soulsWithAchievements
            )
            : 0;

    const averageTitleUnlocks =
        titles.soulsWithTitles >
        0
            ? (
                titles.totalUnlocks /
                titles.soulsWithTitles
            )
            : 0;

    return {
        totalArchiveRecords,

        participatingSouls:
            participatingSoulIds,

        averageAchievementUnlocks:
            Number(
                averageAchievementUnlocks.toFixed(
                    2
                )
            ),

        averageTitleUnlocks:
            Number(
                averageTitleUnlocks.toFixed(
                    2
                )
            )
    };
}

/**
 * Load leaderboard datasets through the
 * dedicated Leaderboard database module.
 *
 * @param {string} guildId
 * @param {number} limit
 * @returns {Promise<Object>}
 */
async function getKingdomLeaderboards(
    guildId,
    limit = 5
) {
    const safeLimit =
        normalizeLimit(
            limit,
            5,
            25
        );

    const [
        levels,
        xp,
        messages,
        achievements,
        titles
    ] =
        await Promise.all([
            leaderboardDatabase
                .getLevelLeaderboard(
                    guildId,
                    safeLimit
                ),

            leaderboardDatabase
                .getXpLeaderboard(
                    guildId,
                    safeLimit
                ),

            leaderboardDatabase
                .getMessageLeaderboard(
                    guildId,
                    safeLimit
                ),

            leaderboardDatabase
                .getAchievementLeaderboard(
                    guildId,
                    safeLimit
                ),

            leaderboardDatabase
                .getTitleLeaderboard(
                    guildId,
                    safeLimit
                )
        ]);

    return {
        levels,
        xp,
        messages,
        achievements,
        titles
    };
}

/**
 * Get the complete Kingdom statistics
 * required by the Las Noches Dashboard.
 *
 * @param {string} guildId
 * @param {Object} options
 * @param {number} options.leaderboardLimit
 * @param {number} options.recentAchievementLimit
 * @param {number} options.recentTitleLimit
 * @param {number} options.recentRankLimit
 * @returns {Promise<Object>}
 */
async function getKingdomStatistics(
    guildId,
    {
        leaderboardLimit = 5,
        recentAchievementLimit = 5,
        recentTitleLimit = 5,
        recentRankLimit = 5
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
        titleStatistics,
        titleRarityStatistics,
        rankStatistics,
        rankHistoryStatistics,
        activityStatistics,
        leaderboards,
        recentAchievements,
        recentTitles,
        recentRanks
    ] =
        await Promise.all([
            getProgressionStatistics(
                guildId
            ),

            getAchievementStatistics(
                guildId
            ),

            getTitleStatistics(
                guildId
            ),

            getTitleRarityStatistics(
                guildId
            ),

            getRankStatistics(
                guildId
            ),

            getRankHistoryStatistics(
                guildId
            ),

            getActivityStatistics(
                guildId
            ),

            getKingdomLeaderboards(
                guildId,
                leaderboardLimit
            ),

            getRecentKingdomAchievements(
                guildId,
                recentAchievementLimit
            ),

            getRecentKingdomTitles(
                guildId,
                recentTitleLimit
            ),

            getRecentRankHistory(
                guildId,
                recentRankLimit
            )
        ]);

    const archiveSummary =
        buildArchiveSummary({
            progression,
            achievements:
                achievementStatistics,
            titles:
                titleStatistics,
            ranks:
                rankStatistics,
            rankHistory:
                rankHistoryStatistics
        });

    return {
        guildId,

        generatedAt:
            new Date(),

        progression,

        achievements:
            achievementStatistics,

        titles:
            titleStatistics,

        titleRarities:
            titleRarityStatistics,

        ranks:
            rankStatistics,

        rankHistory:
            rankHistoryStatistics,

        activity:
            activityStatistics,

        archiveSummary,

        leaderboards,

        recentAchievements,
        recentTitles,
        recentRanks
    };
}module.exports = {
    getProgressionStatistics,
    getAchievementStatistics,
    getTitleStatistics,
    getTitleRarityStatistics,

    getRankStatistics,
    getRankHistoryStatistics,
    getActivityStatistics,

    getRecentKingdomAchievements,
    getRecentKingdomTitles,
    getRecentRankHistory,

    getKingdomLeaderboards,
    getKingdomStatistics
};