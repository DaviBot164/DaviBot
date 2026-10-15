const { pool } = require('./connection');
const { calculateLevel } = require('../utils/leveling');

async function awardXP(
    guildId,
    userId,
    amount,
    { message = false } = {}
) {
    if (!Number.isSafeInteger(amount) || amount <= 0) {
        throw new Error('XP reward must be a positive integer.');
    }

    const client = await pool.connect();

    try {
        await client.query('BEGIN');

        const { rows } = await client.query(
            `
                SELECT level, xp
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

        const previousLevel = rows[0].level;

        const progress = calculateLevel(
            previousLevel,
            rows[0].xp + amount
        );

        const updated = await client.query(
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

        await client.query('COMMIT');

        return {
            user: {
                guildId,
                userId,
                level: updated.rows[0].level,
                xp: updated.rows[0].xp,
                messages: updated.rows[0].messages,
                faction: updated.rows[0].faction,
                rank: updated.rows[0].rank,
                rankPoints: updated.rows[0].rank_points
            },
            previousLevel,
            levelsGained: progress.levelsGained,
            awardedXP: amount
        };
    } catch (error) {
        await client.query('ROLLBACK');
        throw error;
    } finally {
        client.release();
    }
}

module.exports = {
    awardXP
};