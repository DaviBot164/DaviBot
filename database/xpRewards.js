const { pool } = require('./connection');
const { calculateLevel } = require('../utils/leveling');


async function awardXP(
    guildId,
    userId,
    amount,
    {
        message = false
    } = {}
) {
    if (!Number.isSafeInteger(amount) || amount <= 0) {
        throw new Error('XP reward must be a positive integer.');
    }


    const client = await pool.connect();

    try {
        await client.query('BEGIN');

        const { rows } = await client.query(
            `
                SELECT *
                FROM kitsune_users
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

        const currentLevel = Number(user.level);
        const currentXP = Number(user.xp);

        if (
            user.level == null ||
            user.xp == null ||
            !String(user.level).trim() ||
            !String(user.xp).trim() ||
            !Number.isSafeInteger(currentLevel) ||
            currentLevel < 1 ||
            !Number.isSafeInteger(currentXP) ||
            currentXP < 0
        ) {
            throw new Error('Player has invalid level or XP data.');
        }

        const totalXP = currentXP + amount;

        if (!Number.isSafeInteger(totalXP)) {
            throw new Error('XP exceeds the supported range.');
        }

        const progress = calculateLevel(currentLevel, totalXP);

        const { rows: updatedRows } = await client.query(
            `
                UPDATE kitsune_users
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
            previousLevel: currentLevel,
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
