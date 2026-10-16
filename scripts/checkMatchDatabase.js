const {
    pool
} = require('../database/connection');

const REQUIRED_TABLES = {
    akane_users: [
        'guild_id',
        'user_id'
    ],
    akane_player_stats: [
        'guild_id',
        'user_id',
        'duel_wins',
        'duel_losses',
        'updated_at'
    ],
    akane_matches: [
        'id',
        'guild_id',
        'channel_id',
        'message_id',
        'game_name',
        'team_size',
        'creator_id',
        'status',
        'reported_winner',
        'reported_by',
        'winner_team',
        'created_at',
        'started_at',
        'reported_at',
        'completed_at',
        'updated_at'
    ],
    akane_match_players: [
        'match_id',
        'guild_id',
        'user_id',
        'team',
        'is_captain',
        'is_ready',
        'joined_at'
    ],
    akane_match_confirmations: [
        'match_id',
        'guild_id',
        'captain_id',
        'confirmation_type',
        'confirmed_at'
    ],
    akane_match_active_players: [
        'guild_id',
        'user_id',
        'match_id'
    ]
};

async function main() {
    const client = await pool.connect();

    try {
        const { rows } = await client.query(`
            SELECT
                table_name,
                column_name
            FROM information_schema.columns
            WHERE table_schema = current_schema()
              AND table_name = ANY($1::text[])
            ORDER BY table_name, ordinal_position
        `, [Object.keys(REQUIRED_TABLES)]);

        const columns = new Map();

        for (const row of rows) {
            if (!columns.has(row.table_name)) {
                columns.set(row.table_name, new Set());
            }

            columns.get(row.table_name).add(
                row.column_name
            );
        }

        let passed = true;

        for (const [table, required] of Object.entries(
            REQUIRED_TABLES
        )) {
            const actual = columns.get(table);

            if (!actual) {
                console.log(`MISSING TABLE: ${table}`);
                passed = false;
                continue;
            }

            const missing = required.filter(
                column => !actual.has(column)
            );

            if (missing.length) {
                console.log(
                    `MISSING COLUMNS: ${table} → ${missing.join(', ')}`
                );

                passed = false;
                continue;
            }

            console.log(`OK: ${table}`);
        }

        if (!passed) {
            process.exitCode = 1;
            return;
        }

        console.log(
            'PvP database structure: compatible.'
        );
    } finally {
        client.release();
    }
}

main()
    .catch(error => {
        console.error(
            'PvP database audit failed:',
            error.message
        );

        process.exitCode = 1;
    })
    .finally(() => pool.end());