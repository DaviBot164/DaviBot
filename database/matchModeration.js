const { pool } = require('./connection');

const CANCELLABLE_STATUSES = new Set([
    'recruiting',
    'ready',
    'active',
    'reported',
    'disputed'
]);

async function forceCancelMatch(guildId, matchId) {
    const client = await pool.connect();

    try {
        await client.query('BEGIN');

        const { rows } = await client.query(
            `
                SELECT *
                FROM akane_matches
                WHERE guild_id = $1
                  AND id = $2
                FOR UPDATE
            `,
            [guildId, matchId]
        );

        const match = rows[0];

        if (!match) {
            throw new Error('Match not found.');
        }

        if (!CANCELLABLE_STATUSES.has(match.status)) {
            throw new Error(
                'This match is already closed.'
            );
        }

        const { rows: updated } = await client.query(
            `
                UPDATE akane_matches
                SET
                    status = 'cancelled',
                    updated_at = NOW()
                WHERE guild_id = $1
                  AND id = $2
                RETURNING *
            `,
            [guildId, matchId]
        );

        await client.query(
            `
                DELETE FROM akane_match_active_players
                WHERE match_id = $1
            `,
            [matchId]
        );

        await client.query(
            `
                DELETE FROM akane_match_confirmations
                WHERE match_id = $1
            `,
            [matchId]
        );

        await client.query('COMMIT');

        return {
            id: String(updated[0].id),
            guildId: updated[0].guild_id,
            status: updated[0].status,
            cancelled: true
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
    forceCancelMatch
};