const { pool } = require('./connection');

const {
    calculateLevel
} = require('../utils/leveling');

const DAY = 24 * 60 * 60 * 1000;
const MAX_STREAK_WINDOW = DAY * 2;

function getDailyReward(streak) {
    return Math.min(200, 50 + (streak - 1) * 25);
}

async function claimDaily(guildId, userId) {
    const client = await pool.connect();

    try {
        await client.query('BEGIN');

        const userResult = await client.query(
            `
                SELECT *
                FROM akane_users
                WHERE guild_id = $1
                  AND user_id = $2
                FOR UPDATE
            `,
            [guildId, userId]
        );

        if (!userResult.rowCount) {
            throw new Error(
                'Player profile does not exist.'
            );
        }

        await client.query(
            `
                INSERT INTO akane_player_stats (
                    guild_id,
                    user_id
                )
                VALUES ($1, $2)
                ON CONFLICT (guild_id, user_id)
                DO NOTHING
            `,
            [guildId, userId]
        );

        const statsResult = await client.query(
            `
                SELECT *
                FROM akane_player_stats
                WHERE guild_id = $1
                  AND user_id = $2
                FOR UPDATE
            `,
            [guildId, userId]
        );

        const { rows: timeRows } =
            await client.query(
                'SELECT NOW() AS current_time'
            );

        const now = timeRows[0].current_time;
        const user = userResult.rows[0];
        const stats = statsResult.rows[0];

        const lastClaim = stats.last_daily_claim_at;

        const elapsed = lastClaim
            ? now.getTime() - new Date(lastClaim).getTime()
            : null;

        if (elapsed !== null && elapsed < DAY) {
            await client.query('COMMIT');

            return {
                claimed: false,
                remainingMs: DAY - elapsed,
                streak: stats.daily_streak
            };
        }

        const streak = (
            elapsed === null ||
            elapsed > MAX_STREAK_WINDOW
        )
            ? 1
            : stats.daily_streak + 1;

        const reward = getDailyReward(streak);

        const progress = calculateLevel(
            user.level,
            user.xp + reward
        );

        await client.query(
            `
                UPDATE akane_users
                SET
                    level = $3,
                    xp = $4,
                    updated_at = NOW()
                WHERE guild_id = $1
                  AND user_id = $2
            `,
            [
                guildId,
                userId,
                progress.level,
                progress.xp
            ]
        );

        await client.query(
            `
                UPDATE akane_player_stats
                SET
                    daily_streak = $3,
                    last_daily_claim_at = NOW(),
                    updated_at = NOW()
                WHERE guild_id = $1
                  AND user_id = $2
            `,
            [
                guildId,
                userId,
                streak
            ]
        );

        await client.query('COMMIT');

        return {
            claimed: true,
            reward,
            streak,
            previousLevel: user.level,
            level: progress.level,
            xp: progress.xp,
            levelsGained: progress.levelsGained
        };
    } catch (error) {
        await client.query('ROLLBACK');
        throw error;
    } finally {
        client.release();
    }
}

module.exports = {
    claimDaily,
    getDailyReward
};