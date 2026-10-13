const { query } = require('./connection');

async function getLegacyRecords(guildId, userId = null) {
    const [achievements, titles] = await Promise.all([
        query(
            `
                SELECT user_id, achievement_id
                FROM akane_achievements
                WHERE guild_id = $1
                  AND ($2::TEXT IS NULL OR user_id = $2)
                ORDER BY achievement_id, user_id
            `,
            [guildId, userId]
        ),
        query(
            `
                SELECT user_id, title_id, equipped
                FROM akane_titles
                WHERE guild_id = $1
                  AND ($2::TEXT IS NULL OR user_id = $2)
                ORDER BY title_id, user_id
            `,
            [guildId, userId]
        )
    ]);

    return {
        achievements: achievements.rows.map(row => ({
            userId: row.user_id,
            id: row.achievement_id,
            achievementId: row.achievement_id
        })),
        titles: titles.rows.map(row => ({
            userId: row.user_id,
            id: row.title_id,
            titleId: row.title_id,
            equipped: row.equipped
        }))
    };
}

async function getLeaderboard(guildId, faction = null) {
    const { rows } = await query(
        `
            SELECT user_id, level, xp, messages, faction, rank
            FROM akane_users
            WHERE guild_id = $1
              AND ($2::TEXT IS NULL OR faction = $2)
            ORDER BY level DESC, xp DESC, user_id ASC
        `,
        [guildId, faction]
    );

    return rows.map((row, index) => ({
        userId: row.user_id,
        level: Number(row.level),
        xp: Number(row.xp),
        messages: Number(row.messages),
        faction: row.faction,
        rank: row.rank,
        position: index + 1
    }));
}

module.exports = {
    getLegacyRecords,
    getLeaderboard
};