const { query } = require('./connection');

function mapAchievement(row) {
    if (!row) {
        return null;
    }

    return {
        guildId: row.guild_id,
        userId: row.user_id,
        achievementId: row.achievement_id,
        unlockedAt: row.unlocked_at
    };
}

async function unlockAchievement(
    guildId,
    userId,
    achievementId
) {
    const { rows } = await query(
        `
            INSERT INTO akane_achievements (
                guild_id,
                user_id,
                achievement_id
            )
            VALUES ($1, $2, $3)
            ON CONFLICT DO NOTHING
            RETURNING *
        `,
        [
            guildId,
            userId,
            achievementId
        ]
    );

    return mapAchievement(rows[0]);
}

async function getAchievements(
    guildId,
    userId
) {
    const { rows } = await query(
        `
            SELECT *
            FROM akane_achievements
            WHERE guild_id = $1
              AND user_id = $2
            ORDER BY unlocked_at ASC
        `,
        [
            guildId,
            userId
        ]
    );

    return rows.map(mapAchievement);
}

async function hasAchievement(
    guildId,
    userId,
    achievementId
) {
    const { rowCount } = await query(
        `
            SELECT 1
            FROM akane_achievements
            WHERE guild_id = $1
              AND user_id = $2
              AND achievement_id = $3
            LIMIT 1
        `,
        [
            guildId,
            userId,
            achievementId
        ]
    );

    return rowCount > 0;
}

module.exports = {
    unlockAchievement,
    getAchievements,
    hasAchievement
};