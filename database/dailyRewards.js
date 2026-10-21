const { pool } = require('./connection');
const { calculateLevel } = require('../utils/leveling');

const { DAY, streakInfo } = require('../config/missions');
const MAX_STREAK_WINDOW = DAY * 2;

function getDailyReward(streak) {
    const info = streakInfo(streak);
    return info.base + info.bonus;
}

async function claimDaily(guildId, userId) {
    const client = await pool.connect();

    try {
        await client.query('BEGIN');

        const { rows: userRows } = await client.query(
            `
                SELECT level, xp
                FROM akane_users
                WHERE guild_id = $1
                  AND user_id = $2
                FOR UPDATE
            `,
            [guildId, userId]
        );

        if (!userRows.length) {
            throw new Error('Player profile does not exist.');
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

        const { rows: statsRows } = await client.query(
            `
                SELECT daily_streak, last_daily_claim_at
                FROM akane_player_stats
                WHERE guild_id = $1
                  AND user_id = $2
                FOR UPDATE
            `,
            [guildId, userId]
        );

        const { rows: timeRows } = await client.query(
            'SELECT clock_timestamp() AS current_time'
        );

        const now = timeRows[0].current_time;
        const stats = statsRows[0];
        const user = userRows[0];

        const elapsed = stats.last_daily_claim_at
            ? now.getTime() -
              new Date(stats.last_daily_claim_at).getTime()
            : null;

        if (elapsed !== null && elapsed < DAY) {
            await client.query('COMMIT');

            return {
                claimed: false,
                remainingMs: DAY - elapsed,
                streak: Number(stats.daily_streak),
                nextClaimAt: new Date(now.getTime() + DAY - elapsed)
            };
        }

        const streak = (
            elapsed === null ||
            elapsed > MAX_STREAK_WINDOW
        )
            ? 1
            : Number(stats.daily_streak) + 1;

        const rewardInfo = streakInfo(streak);
        const reward = getDailyReward(streak);

        const progress = calculateLevel(
            Number(user.level),
            Number(user.xp) + reward
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
                    last_daily_claim_at = $4,
                    updated_at = NOW()
                WHERE guild_id = $1
                  AND user_id = $2
            `,
            [guildId, userId, streak, now]
        );

        await client.query(
            `
                INSERT INTO akane_daily_quests (
                    guild_id,
                    user_id
                )
                VALUES ($1, $2)
                ON CONFLICT (guild_id, user_id)
                DO NOTHING
            `,
            [guildId, userId]
        );

        const { rows: questRows } = await client.query(
            `
                SELECT cycle_started_at
                FROM akane_daily_quests
                WHERE guild_id = $1
                  AND user_id = $2
                FOR UPDATE
            `,
            [guildId, userId]
        );

        const cycleExpired =
            now.getTime() -
            questRows[0].cycle_started_at.getTime() >= DAY;

        if (cycleExpired) {
            await client.query(
                `
                    UPDATE akane_daily_quests
                    SET
                        cycle_id = gen_random_uuid(),
                        cycle_started_at = NOW(),
                        eligible_messages = 0,
                        daily_claimed = TRUE,
                        claimed_rewards = '{}'::text[],
                        updated_at = NOW()
                    WHERE guild_id = $1
                      AND user_id = $2
                `,
                [guildId, userId]
            );
        } else {
            await client.query(
                `
                    UPDATE akane_daily_quests
                    SET
                        daily_claimed = TRUE,
                        updated_at = NOW()
                    WHERE guild_id = $1
                      AND user_id = $2
                `,
                [guildId, userId]
            );
        }

        await client.query('COMMIT');

        return {
            claimed: true,
            reward,
            baseReward: rewardInfo.base,
            streakBonus: rewardInfo.bonus,
            streakReset: elapsed !== null && elapsed > MAX_STREAK_WINDOW,
            nextClaimAt: new Date(now.getTime() + DAY),
            streak,
            previousLevel: user.level,
            level: progress.level,
            xp: progress.xp,
            levelsGained: progress.levelsGained
        };
    } catch (error) {
        await client.query('ROLLBACK')
            .catch(() => null);

        throw error;
    } finally {
        client.release();
    }
}

module.exports = {
    claimDaily,
    getDailyReward
};
