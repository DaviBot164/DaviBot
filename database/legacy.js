const { query } = require('./connection');

async function getAchievementStats(
    guildId
) {
    const result = await query(
        `
            SELECT
                achievement_id,
                COUNT(*)::INTEGER AS unlocks

            FROM akane_achievements

            WHERE guild_id = $1

            GROUP BY achievement_id

            ORDER BY
                unlocks DESC,
                achievement_id ASC
        `,
        [
            guildId
        ]
    );

    return result.rows.map(
        row => ({
            achievementId:
                row.achievement_id,

            unlocks:
                Number(
                    row.unlocks
                )
        })
    );
}

async function getTitleStats(
    guildId
) {
    const result = await query(
        `
            SELECT
                title_id,

                COUNT(*)::INTEGER
                    AS unlocks,

                COUNT(*) FILTER (
                    WHERE equipped = TRUE
                )::INTEGER
                    AS equipped

            FROM akane_titles

            WHERE guild_id = $1

            GROUP BY title_id

            ORDER BY
                unlocks DESC,
                title_id ASC
        `,
        [
            guildId
        ]
    );

    return result.rows.map(
        row => ({
            titleId:
                row.title_id,

            unlocks:
                Number(
                    row.unlocks
                ),

            equipped:
                Number(
                    row.equipped
                )
        })
    );
}

async function getLegacyTotals(
    guildId
) {
    const result = await query(
        `
            SELECT
                (
                    SELECT COUNT(*)
                    FROM akane_achievements
                    WHERE guild_id = $1
                )::INTEGER
                    AS achievement_unlocks,

                (
                    SELECT COUNT(
                        DISTINCT user_id
                    )
                    FROM akane_achievements
                    WHERE guild_id = $1
                )::INTEGER
                    AS achievement_members,

                (
                    SELECT COUNT(*)
                    FROM akane_titles
                    WHERE guild_id = $1
                )::INTEGER
                    AS title_unlocks,

                (
                    SELECT COUNT(
                        DISTINCT user_id
                    )
                    FROM akane_titles
                    WHERE guild_id = $1
                )::INTEGER
                    AS title_members,

                (
                    SELECT COUNT(*)
                    FROM akane_users
                    WHERE guild_id = $1
                )::INTEGER
                    AS recorded_members
        `,
        [
            guildId
        ]
    );

    const row =
        result.rows[0];

    return {
        achievementUnlocks:
            Number(
                row.achievement_unlocks
            ),

        achievementMembers:
            Number(
                row.achievement_members
            ),

        titleUnlocks:
            Number(
                row.title_unlocks
            ),

        titleMembers:
            Number(
                row.title_members
            ),

        recordedMembers:
            Number(
                row.recorded_members
            )
    };
}

async function getAchievementRankCounts(
    guildId,
    roleIds
) {
    /*
     * Achievement ranks are Discord roles,
     * not stored as a dedicated rank column.
     *
     * This helper therefore only prepares
     * the structure used by /legacy.
     * Discord member-role counting happens
     * in the command layer.
     */
    return Object.entries(
        roleIds
    ).map(
        ([
            id,
            roleId
        ]) => ({
            id,
            roleId,
            members: 0,
            guildId
        })
    );
}

module.exports = {
    getAchievementStats,
    getTitleStats,
    getLegacyTotals,
    getAchievementRankCounts
};