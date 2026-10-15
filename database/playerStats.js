const { query } = require('./connection');

function mapStats(row) {
    if (!row) {
        return null;
    }

    return {
        guildId: row.guild_id,
        userId: row.user_id,
        duelWins: row.duel_wins,
        duelLosses: row.duel_losses,
        dailyStreak: row.daily_streak,
        lastDailyClaimAt: row.last_daily_claim_at,
        eventPoints: row.event_points,
        updatedAt: row.updated_at
    };
}

async function getPlayerStats(guildId, userId) {
    const { rows } = await query(
        `
            SELECT *
            FROM akane_player_stats
            WHERE guild_id = $1
              AND user_id = $2
        `,
        [guildId, userId]
    );

    return mapStats(rows[0]);
}

async function ensurePlayerStats(guildId, userId) {
    const { rows } = await query(
        `
            INSERT INTO akane_player_stats (
                guild_id,
                user_id
            )
            VALUES ($1, $2)
            ON CONFLICT (guild_id, user_id)
            DO UPDATE SET
                updated_at = akane_player_stats.updated_at
            RETURNING *
        `,
        [guildId, userId]
    );

    return mapStats(rows[0]);
}

async function addDuelResult(
    guildId,
    winnerId,
    loserId
) {
    if (winnerId === loserId) {
        throw new Error(
            'A member cannot duel themselves.'
        );
    }

    const client = await require('./connection')
        .pool.connect();

    try {
        await client.query('BEGIN');

        const winner = await client.query(
            `
                UPDATE akane_player_stats
                SET
                    duel_wins = duel_wins + 1,
                    updated_at = NOW()
                WHERE guild_id = $1
                  AND user_id = $2
                RETURNING *
            `,
            [guildId, winnerId]
        );

        const loser = await client.query(
            `
                UPDATE akane_player_stats
                SET
                    duel_losses = duel_losses + 1,
                    updated_at = NOW()
                WHERE guild_id = $1
                  AND user_id = $2
                RETURNING *
            `,
            [guildId, loserId]
        );

        if (
            !winner.rowCount ||
            !loser.rowCount
        ) {
            throw new Error(
                'Both duel participants must have player statistics.'
            );
        }

        await client.query('COMMIT');

        return {
            winner: mapStats(winner.rows[0]),
            loser: mapStats(loser.rows[0])
        };
    } catch (error) {
        await client.query('ROLLBACK');
        throw error;
    } finally {
        client.release();
    }
}

async function addEventPoints(
    guildId,
    userId,
    points
) {
    if (
        !Number.isSafeInteger(points) ||
        points <= 0
    ) {
        throw new Error(
            'Event points must be a positive integer.'
        );
    }

    const { rows } = await query(
        `
            UPDATE akane_player_stats
            SET
                event_points = event_points + $3,
                updated_at = NOW()
            WHERE guild_id = $1
              AND user_id = $2
            RETURNING *
        `,
        [guildId, userId, points]
    );

    return mapStats(rows[0]);
}

module.exports = {
    getPlayerStats,
    ensurePlayerStats,
    addDuelResult,
    addEventPoints
};