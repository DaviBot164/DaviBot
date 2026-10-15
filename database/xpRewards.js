const { pool } = require('./connection');
const { calculateLevel } = require('../utils/leveling');

const DAY = 24 * 60 * 60 * 1000;

async function awardXP(
    guildId,
    userId,
    amount,
    {
        message = false,
        questProgress = false
    } = {}
) {
    if (!Number.isSafeInteger(amount) || amount <= 0) {
        throw new Error('XP reward must be a positive integer.');
    }

    if (questProgress && !message) {
        throw new Error(
            'Quest progress requires message activity.'
        );
    }

    const client = await pool.connect();

    try {
        await client.query('BEGIN');

        const { rows } = await client.query(
            `
                SELECT *
                FROM akane_users
                WHERE guild_id = $1
                  AND user_id = $2
                FOR UPDATE
            `,
            [guildId, userId]
        );

        if (!rows.length) {
            throw new Error('Player profile does not exist.');
        }

        const user = rows[0];

        const progress = calculateLevel(
            user.level,
            user.xp + amount
        );

        const { rows: updatedRows } = await client.query(
            `
                UPDATE akane_users
                SET
                    level = $3,
                    xp = $4,
                    messages = messages + $5,
                    updated_at = NOW()
                WHERE guild_id = $1
                  AND user_id = $2
                RETURNING *
            `,
            [
                guildId,
                userId,
                progress.level,
                progress.xp,
                message ? 1 : 0
            ]
        );

        if (questProgress) {
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

            const { rows: timeRows } = await client.query(
                'SELECT NOW() AS current_time'
            );

            const now = timeRows[0].current_time;

            const expired =
                now.getTime() -
                questRows[0].cycle_started_at.getTime() >= DAY;

            if (expired) {
                await client.query(
                    `
                        UPDATE akane_daily_quests
                        SET
                            cycle_id = gen_random_uuid(),
                            cycle_started_at = NOW(),
                            eligible_messages = 1,
                            daily_claimed = FALSE,
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
                            eligible_messages =
                                eligible_messages + 1,
                            updated_at = NOW()
                        WHERE guild_id = $1
                          AND user_id = $2
                    `,
                    [guildId, userId]
                );
            }
        }

        await client.query('COMMIT');

        const updated = updatedRows[0];

        return {
            user: {
                guildId,
                userId,
                level: updated.level,
                xp: updated.xp,
                messages: updated.messages,
                faction: updated.faction,
                rank: updated.rank,
                rankPoints: updated.rank_points
            },
            previousLevel: user.level,
            levelsGained: progress.levelsGained,
            awardedXP: amount
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
    awardXP
};