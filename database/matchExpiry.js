const { pool } = require('./connection');

const RECRUITING_HOURS = 24;
const BATCH_SIZE = 50;

async function expireRecruitingMatches() {
    const client = await pool.connect();

    try {
        await client.query('BEGIN');

        const { rows } = await client.query(
            `
                SELECT id, guild_id
                FROM kitsune_matches
                WHERE status = 'recruiting'
                  AND created_at <=
                      NOW() - INTERVAL '24 hours'
                ORDER BY created_at, id
                LIMIT $1
                FOR UPDATE SKIP LOCKED
            `,
            [BATCH_SIZE]
        );

        if (!rows.length) {
            await client.query('COMMIT');
            return [];
        }

        const ids = rows.map(row => row.id);

        await client.query(
            `
                UPDATE kitsune_matches
                SET
                    status = 'cancelled',
                    updated_at = NOW()
                WHERE id = ANY($1::bigint[])
                  AND status = 'recruiting'
            `,
            [ids]
        );

        await client.query(
            `
                DELETE FROM kitsune_match_active_players
                WHERE match_id = ANY($1::bigint[])
            `,
            [ids]
        );

        await client.query(
            `
                DELETE FROM kitsune_match_confirmations
                WHERE match_id = ANY($1::bigint[])
            `,
            [ids]
        );

        await client.query('COMMIT');

        return rows.map(row => ({
            guildId: row.guild_id,
            matchId: String(row.id)
        }));
    } catch (error) {
        await client.query('ROLLBACK')
            .catch(() => null);

        throw error;
    } finally {
        client.release();
    }
}

module.exports = {
    RECRUITING_HOURS,
    BATCH_SIZE,
    expireRecruitingMatches
};
