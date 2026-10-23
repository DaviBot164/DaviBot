const { query } = require('./connection');

async function initializeMatchSchema() {
    await query(`
        CREATE TABLE IF NOT EXISTS kitsune_matches (
            id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,

            guild_id TEXT NOT NULL,
            channel_id TEXT NOT NULL,
            message_id TEXT,

            game_name VARCHAR(100) NOT NULL,
            team_size SMALLINT NOT NULL
                CHECK (team_size BETWEEN 1 AND 5),

            creator_id TEXT NOT NULL,

            status TEXT NOT NULL DEFAULT 'recruiting'
                CHECK (
                    status IN (
                        'recruiting',
                        'ready',
                        'active',
                        'reported',
                        'disputed',
                        'completed',
                        'cancelled'
                    )
                ),

            reported_winner TEXT
                CHECK (
                    reported_winner IN ('crimson', 'azure')
                ),

            reported_by TEXT,

            winner_team TEXT
                CHECK (
                    winner_team IN ('crimson', 'azure')
                ),

            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            started_at TIMESTAMPTZ,
            reported_at TIMESTAMPTZ,
            completed_at TIMESTAMPTZ,
            updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

            CHECK (LENGTH(TRIM(game_name)) > 0)
        );
    `);

    await query(`
        CREATE TABLE IF NOT EXISTS kitsune_match_players (
            match_id BIGINT NOT NULL
                REFERENCES kitsune_matches(id)
                ON DELETE CASCADE,

            guild_id TEXT NOT NULL,
            user_id TEXT NOT NULL,

            team TEXT NOT NULL
                CHECK (team IN ('crimson', 'azure')),

            is_captain BOOLEAN NOT NULL DEFAULT FALSE,
            is_ready BOOLEAN NOT NULL DEFAULT FALSE,

            joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

            PRIMARY KEY (match_id, user_id)
        );
    `);

    await query(`
        CREATE TABLE IF NOT EXISTS kitsune_match_confirmations (
            match_id BIGINT NOT NULL
                REFERENCES kitsune_matches(id)
                ON DELETE CASCADE,

            guild_id TEXT NOT NULL,
            captain_id TEXT NOT NULL,

            confirmation_type TEXT NOT NULL
                CHECK (
                    confirmation_type IN ('start', 'result')
                ),

            confirmed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

            PRIMARY KEY (
                match_id,
                captain_id,
                confirmation_type
            )
        );
    `);

    await query(`
        CREATE TABLE IF NOT EXISTS kitsune_match_active_players (
            guild_id TEXT NOT NULL,
            user_id TEXT NOT NULL,

            match_id BIGINT NOT NULL
                REFERENCES kitsune_matches(id)
                ON DELETE CASCADE,

            PRIMARY KEY (guild_id, user_id),
            UNIQUE (match_id, user_id)
        );
    `);

    await query(`
        CREATE UNIQUE INDEX IF NOT EXISTS
            idx_kitsune_match_team_captain
        ON kitsune_match_players (match_id, team)
        WHERE is_captain = TRUE;
    `);

    await query(`
        CREATE INDEX IF NOT EXISTS
            idx_kitsune_matches_guild_status
        ON kitsune_matches (guild_id, status);
    `);

    await query(`
        CREATE INDEX IF NOT EXISTS
            idx_kitsune_matches_creator
        ON kitsune_matches (
            guild_id,
            creator_id,
            created_at DESC
        );
    `);

    await query(`
        CREATE INDEX IF NOT EXISTS
            idx_kitsune_match_players_user
        ON kitsune_match_players (
            guild_id,
            user_id
        );
    `);

    await query(`
        CREATE INDEX IF NOT EXISTS
            idx_kitsune_match_active_players_match
        ON kitsune_match_active_players (match_id);
    `);
}

module.exports = {
    initializeMatchSchema
};
